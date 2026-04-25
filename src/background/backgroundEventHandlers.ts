import type { BackgroundRuntimeDependencies } from "./backgroundHandlers";

export type BackgroundEventHandlerDependencies = Pick<
  BackgroundRuntimeDependencies,
  | "traceBackgroundEvent"
  | "windowSyncCoordinator"
  | "detachedTabWindowIds"
  | "ensureInitialized"
  | "store"
  | "queryNormalizedGroup"
  | "queryNormalizedTabsInGroup"
  | "syncGroupSnapshot"
> & {
  windowIdNone: number;
  enqueueStoreTask: <T>(task: () => Promise<T>) => Promise<T>;
  syncGroupFromChrome: (groupId: number, providedGroup?: chrome.tabGroups.TabGroup) => Promise<void>;
  syncWindowFromChrome: (windowId: number, traceContext?: Record<string, unknown>) => Promise<void>;
  handlePatch: (patch: ReturnType<BackgroundRuntimeDependencies["store"]["removeWindow"]>) => void;
  handleActivated: (activeInfo: chrome.tabs.TabActiveInfo) => Promise<void>;
};

export function createTabEventHandlers(deps: Pick<
  BackgroundEventHandlerDependencies,
  | "traceBackgroundEvent"
  | "windowSyncCoordinator"
  | "detachedTabWindowIds"
  | "enqueueStoreTask"
  | "handleActivated"
>): {
  onCreated: (tab: chrome.tabs.Tab) => void;
  onUpdated: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void;
  onMoved: (tabId: number, moveInfo: chrome.tabs.TabMoveInfo) => void;
  onAttached: (tabId: number, attachInfo: chrome.tabs.TabAttachInfo) => void;
  onDetached: (tabId: number, detachInfo: chrome.tabs.TabDetachInfo) => void;
  onRemoved: (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void;
  onActivated: (activeInfo: chrome.tabs.TabActiveInfo) => void;
} {
  return {
    onCreated: (tab) => {
      deps.traceBackgroundEvent("tabs/onCreated", {
        tabId: tab.id,
        windowId: tab.windowId,
        index: tab.index,
        pendingUrl: tab.pendingUrl,
        url: tab.url
      });
      void deps.windowSyncCoordinator.scheduleWindowSync({
        windowId: tab.windowId,
        cause: "tabs/onCreated"
      });
    },
    onUpdated: (tabId, changeInfo, tab) => {
      deps.traceBackgroundEvent("tabs/onUpdated", {
        tabId,
        windowId: tab.windowId,
        status: changeInfo.status,
        title: changeInfo.title,
        url: changeInfo.url,
        groupId: tab.groupId
      });

      void deps.windowSyncCoordinator.scheduleWindowSync({
        windowId: tab.windowId,
        cause: "tabs/onUpdated"
      });
    },
    onMoved: (tabId, moveInfo) => {
      deps.traceBackgroundEvent("tabs/onMoved", {
        tabId,
        windowId: moveInfo.windowId,
        fromIndex: moveInfo.fromIndex,
        toIndex: moveInfo.toIndex
      });
      void deps.windowSyncCoordinator.scheduleWindowSync({
        windowId: moveInfo.windowId,
        cause: "tabs/onMoved"
      });
    },
    onAttached: (tabId, attachInfo) => {
      deps.traceBackgroundEvent("tabs/onAttached", {
        tabId,
        newWindowId: attachInfo.newWindowId,
        newPosition: attachInfo.newPosition,
        previousWindowId: deps.detachedTabWindowIds.get(tabId) ?? null
      });
      const previousWindowId = deps.detachedTabWindowIds.get(tabId) ?? null;
      deps.detachedTabWindowIds.delete(tabId);

      void deps.windowSyncCoordinator.scheduleCrossWindowSync({
        sourceWindowId: previousWindowId,
        targetWindowId: attachInfo.newWindowId,
        cause: "tabs/onAttached"
      });
    },
    onDetached: (tabId, detachInfo) => {
      deps.traceBackgroundEvent("tabs/onDetached", {
        tabId,
        oldWindowId: detachInfo.oldWindowId,
        oldPosition: detachInfo.oldPosition
      });
      deps.detachedTabWindowIds.set(tabId, detachInfo.oldWindowId);
    },
    onRemoved: (tabId, removeInfo) => {
      deps.traceBackgroundEvent("tabs/onRemoved", {
        tabId,
        windowId: removeInfo.windowId,
        isWindowClosing: removeInfo.isWindowClosing
      });
      if (removeInfo.isWindowClosing) {
        return;
      }

      void deps.windowSyncCoordinator.scheduleWindowSync({
        windowId: removeInfo.windowId,
        cause: "tabs/onRemoved"
      });
    },
    onActivated: (activeInfo) => {
      deps.enqueueStoreTask(() => deps.handleActivated(activeInfo));
    }
  };
}

export function createTabGroupEventHandlers(deps: Pick<
  BackgroundEventHandlerDependencies,
  | "enqueueStoreTask"
  | "syncGroupFromChrome"
  | "ensureInitialized"
  | "store"
  | "handlePatch"
  | "syncWindowFromChrome"
>): {
  onCreated: (group: chrome.tabGroups.TabGroup) => void;
  onUpdated: (group: chrome.tabGroups.TabGroup) => void;
  onRemoved: (group: chrome.tabGroups.TabGroup) => void;
} {
  return {
    onCreated: (group) => {
      deps.enqueueStoreTask(() => deps.syncGroupFromChrome(group.id, group));
    },
    onUpdated: (group) => {
      deps.enqueueStoreTask(() => deps.syncGroupFromChrome(group.id, group));
    },
    onRemoved: (group) => {
      deps.enqueueStoreTask(async () => {
        await deps.ensureInitialized();
        deps.handlePatch(deps.store.removeGroup(group.id));
        await deps.syncWindowFromChrome(group.windowId);
      });
    }
  };
}

export function createWindowEventHandlers(deps: Pick<
  BackgroundEventHandlerDependencies,
  | "enqueueStoreTask"
  | "ensureInitialized"
  | "store"
  | "handlePatch"
  | "windowSyncCoordinator"
  | "windowIdNone"
>): {
  onRemoved: (windowId: number) => void;
  onFocusChanged: (windowId: number) => void;
} {
  return {
    onRemoved: (windowId) => {
      deps.enqueueStoreTask(async () => {
        await deps.ensureInitialized();
        deps.handlePatch(deps.store.removeWindow(windowId));
      });
    },
    onFocusChanged: (windowId) => {
      if (windowId === deps.windowIdNone) {
        return;
      }

      void deps.windowSyncCoordinator.runAfterCurrentCycle({
        cause: "windows/onFocusChanged",
        task: async () => {
          await deps.ensureInitialized();
          deps.handlePatch(deps.store.focusWindow(windowId));
        }
      });
    }
  };
}
