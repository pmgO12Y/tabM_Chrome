import { createLocalizedText, getRuntimeLocale, resolveLocale, setRuntimeLocale, translateText } from "../shared/i18n";
import { NO_TAB_GROUP_ID, PANEL_PORT_NAME } from "../shared/defaults";
import { normalizeChromeTab } from "../shared/domain/normalizeTab";
import type { BackgroundToPanelMessage, PanelToBackgroundMessage } from "../shared/messages";
import { DEFAULT_EXTENSION_SETTINGS, EXTENSION_SETTINGS_STORAGE_KEY, loadExtensionSettings, mergeExtensionSettings } from "../shared/settings";
import type { ExtensionSettingsRecord, StorePatch, TabCommand, TabGroupRecord, TabRecord } from "../shared/types";
import {
  getLastFocusedWindowId,
  queryAllTabGroupsForTabs,
  queryGroups,
  queryNormalizedGroup,
  queryNormalizedTabsInGroup,
  queryNormalizedTabsInWindow
} from "./chromeQueries";
import { createWindowSyncCoordinator } from "./backgroundSyncCoordinator";
import { createTabEventHandlers, createTabGroupEventHandlers, createWindowEventHandlers } from "./backgroundEventHandlers";
import { createPortMessageHandlers } from "./backgroundHandlers";
import { createBackgroundInitializationCoordinator } from "./backgroundInitializationCoordinator";
import { executeTabCommand } from "./commandExecutor";
import { syncGroupSnapshot } from "./groupSync";
import { createPanelPortHub } from "./panelPortHub";
import { createTaskQueue } from "./taskQueue";
import { BackgroundTabStore } from "./tabStore";
import {
  buildTraceExportBundle,
  clearPersistedTrace,
  formatPersistedTraceTimeline,
  getTraceState,
  initializeTracePersistence,
  setVerboseLoggingEnabled,
  summarizeError,
  summarizeSnapshot,
  traceBackgroundEvent,
  tracePanelEvent
} from "./trace";

const store = new BackgroundTabStore();
const panelPortHub = createPanelPortHub();
const detachedTabWindowIds = new Map<number, number>();

const BADGE_BACKGROUND_COLOR = "#111827";
let badgeUpdateQueued = false;
let lastBadgeText: string | null = null;
let extensionSettings: ExtensionSettingsRecord = {
  ...DEFAULT_EXTENSION_SETTINGS,
  badge: {
    ...DEFAULT_EXTENSION_SETTINGS.badge
  }
};

const initializationCoordinator = createBackgroundInitializationCoordinator({
  initializeTracePersistence,
  initializeExtensionSettings,
  configureActionBadge,
  configureSidePanel,
  scheduleActionBadgeUpdate,
  setInitialStore: ({ tabs, focusedWindowId, groups }) => {
    store.initialize(tabs, focusedWindowId, groups);
  }
});

function configureActionBadge(): void {
  chrome.action.setBadgeBackgroundColor({
    color: BADGE_BACKGROUND_COLOR
  });
}

function updateActionBadge(): void {
  if (!extensionSettings.badge.enabled) {
    if (lastBadgeText === "") {
      return;
    }

    lastBadgeText = "";
    chrome.action.setBadgeText({
      text: ""
    });
    return;
  }

  const tabCount = Object.keys(store.getSnapshot().tabsById).length;
  const nextText = String(tabCount);
  if (nextText === lastBadgeText) {
    return;
  }

  lastBadgeText = nextText;
  chrome.action.setBadgeText({
    text: nextText
  });
}

function scheduleActionBadgeUpdate(): void {
  if (badgeUpdateQueued) {
    return;
  }

  badgeUpdateQueued = true;
  queueMicrotask(() => {
    badgeUpdateQueued = false;
    updateActionBadge();
  });
}

async function initializeExtensionSettings(): Promise<void> {
  extensionSettings = await loadExtensionSettings();
  setRuntimeLocale(
    resolveLocale({
      settings: extensionSettings,
      uiLanguage: chrome.i18n?.getUILanguage?.()
    })
  );
}

function handleSettingsStorageChange(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string
): void {
  if (areaName !== "local") {
    return;
  }

  const settingsChange = changes[EXTENSION_SETTINGS_STORAGE_KEY];
  if (!settingsChange) {
    return;
  }

  extensionSettings = mergeExtensionSettings(
    settingsChange.newValue as Partial<ExtensionSettingsRecord> | undefined
  );
  setRuntimeLocale(
    resolveLocale({
      settings: extensionSettings,
      uiLanguage: chrome.i18n?.getUILanguage?.()
    })
  );
  scheduleActionBadgeUpdate();
}

const storeTaskQueue = createTaskQueue((error) => {
  traceBackgroundEvent("queue/error", summarizeError(error));
  console.error("store task failed", error);
});
const windowSyncCoordinator = createWindowSyncCoordinator({
  runExclusive: (task) => storeTaskQueue.enqueue(task),
  syncWindow: syncWindowFromChrome
});

type RegisterListener = () => void;
type TabEventHandler<TArgs extends unknown[]> = (...args: TArgs) => void;
type PortMessageHandler<T extends PanelToBackgroundMessage = PanelToBackgroundMessage> = (
  port: chrome.runtime.Port,
  message: T
) => Promise<void>;

void boot();
registerBackgroundListeners();

function registerBackgroundListeners(): void {
  createBackgroundListenerRegistrations().forEach((register) => register());
}

function createBackgroundListenerRegistrations(): RegisterListener[] {
  return [
    () => chrome.storage.onChanged.addListener(handleSettingsStorageChange),
    () =>
      chrome.runtime.onInstalled.addListener(() => {
        void configureSidePanel();
      }),
    () =>
      chrome.runtime.onStartup.addListener(() => {
        void ensureInitialized();
        void configureSidePanel();
      }),
    registerPanelPortListener,
    registerTabListeners,
    registerTabGroupListeners,
    registerWindowListeners
  ];
}

function registerPanelPortListener(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PANEL_PORT_NAME) {
      return;
    }

    traceBackgroundEvent("panel/connect", {
      portName: port.name
    }, {
      category: "panel"
    });
    panelPortHub.register(port);

    void (async () => {
      try {
        await ensureInitialized();
        await windowSyncCoordinator.runAfterCurrentCycle({
          cause: "panel/connect",
          task: async () => {
            const snapshot = store.getSnapshot();
            traceBackgroundEvent("panel/send-snapshot", summarizeSnapshot(snapshot), {
              category: "panel"
            });
            panelPortHub.sendSnapshot(port, snapshot);
            panelPortHub.sendTraceState(port, await getTraceState());
          }
        });
      } catch (error) {
        traceBackgroundEvent("panel/send-snapshot-error", summarizeError(error), {
          category: "panel"
        });
        panelPortHub.sendError(port, toErrorMessage(error));
      }
    })();

    port.onMessage.addListener((message) => {
      void handlePortMessage(port, message as PanelToBackgroundMessage);
    });

    port.onDisconnect.addListener(() => {
      traceBackgroundEvent("panel/disconnect", {
        portName: port.name
      });
      panelPortHub.unregister(port);
    });
  });
}

function registerTabListeners(): void {
  const handlers = createTabEventHandlers({
    traceBackgroundEvent,
    windowSyncCoordinator,
    detachedTabWindowIds,
    enqueueStoreTask,
    handleActivated
  });

  chrome.tabs.onCreated.addListener(handlers.onCreated);
  chrome.tabs.onUpdated.addListener(handlers.onUpdated);
  chrome.tabs.onMoved.addListener(handlers.onMoved);
  chrome.tabs.onAttached.addListener(handlers.onAttached);
  chrome.tabs.onDetached.addListener(handlers.onDetached);
  chrome.tabs.onRemoved.addListener(handlers.onRemoved);
  chrome.tabs.onActivated.addListener(handlers.onActivated);
}

function registerTabGroupListeners(): void {
  const handlers = createTabGroupEventHandlers({
    enqueueStoreTask,
    syncGroupFromChrome,
    ensureInitialized,
    store,
    handlePatch,
    syncWindowFromChrome
  });

  chrome.tabGroups.onCreated.addListener(handlers.onCreated);
  chrome.tabGroups.onUpdated.addListener(handlers.onUpdated);
  chrome.tabGroups.onRemoved.addListener(handlers.onRemoved);
}

function registerWindowListeners(): void {
  const handlers = createWindowEventHandlers({
    enqueueStoreTask,
    ensureInitialized,
    store,
    handlePatch,
    windowSyncCoordinator,
    windowIdNone: chrome.windows.WINDOW_ID_NONE
  });

  chrome.windows.onRemoved.addListener(handlers.onRemoved);
  chrome.windows.onFocusChanged.addListener(handlers.onFocusChanged);
}

async function boot(): Promise<void> {
  await initializationCoordinator.boot();
}

async function ensureInitialized(): Promise<void> {
  await initializationCoordinator.ensureInitialized();
}

async function configureSidePanel(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
}

async function handlePortMessage(
  port: chrome.runtime.Port,
  message: PanelToBackgroundMessage
): Promise<void> {
  try {
    await resolvePortMessageHandler(message.type)(port, message as never);
  } catch (error) {
    traceBackgroundEvent("command/error", {
      commandType: message.type,
      ...summarizeError(error)
    });
    panelPortHub.sendError(port, toErrorMessage(error));
  }
}

function resolvePortMessageHandler(
  type: PanelToBackgroundMessage["type"]
): ReturnType<typeof createPortMessageHandlers>[PanelToBackgroundMessage["type"]] {
  return createPortMessageHandlers({
    buildTraceExportBundle,
    formatPersistedTraceTimeline,
    traceBackgroundEvent,
    tracePanelEvent,
    setVerboseLoggingEnabled,
    panelPortHub,
    getTraceState,
    clearPersistedTrace,
    windowSyncCoordinator,
    executeTabCommand
  })[type];
}


async function handleActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
  traceBackgroundEvent("tabs/onActivated", {
    tabId: activeInfo.tabId,
    windowId: activeInfo.windowId
  });
  await ensureInitialized();

  if (!store.hasTab(activeInfo.tabId)) {
    await syncWindowFromChrome(activeInfo.windowId);
  }

  for (const patch of store.setActiveTab(activeInfo.windowId, activeInfo.tabId)) {
    panelPortHub.broadcastPatch(patch);
  }

  const focusPatch = store.focusWindow(activeInfo.windowId);
  if (focusPatch) {
    panelPortHub.broadcastPatch(focusPatch);
  }
}

async function syncWindowAfterRemoval(windowId: number): Promise<void> {
  await ensureInitialized();

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  await syncWindowFromChrome(windowId);
}

async function syncWindowFromChrome(
  windowId: number,
  traceContext: Record<string, unknown> = {}
): Promise<void> {
  await ensureInitialized();

  if (!Number.isInteger(windowId) || windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  traceBackgroundEvent("syncWindow/start", {
    windowId,
    existingCount: store.getWindowTabIds(windowId).length,
    ...traceContext
  });

  try {
    const normalizedTabs = await queryNormalizedTabsInWindow(windowId);
    const staleTabIds = selectStaleTabIds(store.getWindowTabIds(windowId), normalizedTabs);
    staleTabIds.forEach((staleTabId) => {
      handlePatch(store.removeTab(staleTabId, windowId));
    });

    normalizedTabs.forEach((normalizedTab) => {
      handlePatch(store.upsertTab(normalizedTab));
    });

    const groups = await queryGroups(collectNormalizedGroupIds(normalizedTabs));
    groups.forEach((group) => {
      handlePatch(store.upsertGroup(group));
    });

    traceBackgroundEvent("syncWindow/end", {
      windowId,
      nextCount: normalizedTabs.length,
      nextTabIds: normalizedTabs.map((tab) => tab.id),
      groupCount: groups.length,
      snapshot: summarizeSnapshot(store.getSnapshot()),
      ...traceContext
    });
  } catch (error) {
    traceBackgroundEvent("syncWindow/error", {
      windowId,
      ...traceContext,
      ...summarizeError(error)
    });
    return;
  }
}

async function syncGroupFromChrome(
  groupId: number,
  providedGroup?: chrome.tabGroups.TabGroup
): Promise<void> {
  await ensureInitialized();

  if (groupId === NO_TAB_GROUP_ID) {
    return;
  }

  await syncGroupSnapshot({
    queryGroup: () => queryNormalizedGroup(groupId, providedGroup),
    queryTabsInGroup: () => queryNormalizedTabsInGroup(groupId),
    upsertGroup: upsertGroupRecord,
    upsertTab: upsertTabRecord,
    removeGroup: () => handlePatch(store.removeGroup(groupId))
  });
}

function handlePatch(patch: StorePatch | null): void {
  if (!patch) {
    return;
  }

  panelPortHub.broadcastPatch(patch);
  scheduleActionBadgeUpdate();
}

function upsertTabRecord(tab: TabRecord): void {
  handlePatch(store.upsertTab(tab));
}

function upsertGroupRecord(group: TabGroupRecord): void {
  handlePatch(store.upsertGroup(group));
}

function enqueueStoreTask<T>(task: () => Promise<T>): Promise<T> {
  return storeTaskQueue.enqueue(task);
}

function selectStaleTabIds(currentTabIds: readonly number[], nextTabs: readonly TabRecord[]): number[] {
  const nextTabIdSet = new Set(nextTabs.map((tab) => tab.id));
  return currentTabIds.filter((tabId) => !nextTabIdSet.has(tabId));
}

function collectNormalizedGroupIds(tabs: readonly TabRecord[]): number[] {
  return Array.from(
    new Set(
      tabs
        .map((tab) => tab.groupId)
        .filter((groupId) => groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
    )
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return translateText(getRuntimeLocale(), createLocalizedText("error.backgroundUnknown"));
}
