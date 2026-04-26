import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyDocumentLocale,
  getUiLanguage,
  resolveLocale
} from "../shared/i18n";
import { filterPanelRowsBySearch, flattenWindowSections, selectCurrentActiveTabId, selectWindowSections } from "../shared/domain/selectors";
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  loadExtensionSettings
} from "../shared/settings";
import type { ExtensionSettingsRecord, SearchFilterMode, SupportedLocale, TabCommand } from "../shared/types";
import { VirtualizedWindowList } from "./components/VirtualizedWindowList";
import { createPanelCommandActions } from "./panelCommands";
import { SearchBar, focusSearchInput } from "./SearchBar";
import { SidepanelStatus } from "./SidepanelStatus";
import { SidepanelToolbar } from "./SidepanelToolbar";
import { useActiveGroupAutoExpand } from "./useActiveGroupAutoExpand";
import { useClosingTabs } from "./useClosingTabs";
import { useCollapsedWindows } from "./useCollapsedWindows";
import { usePanelController } from "./usePanelController";
import { useTabSelection } from "./useTabSelection";

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettingsRecord>(DEFAULT_EXTENSION_SETTINGS);
  const locale: SupportedLocale = useMemo(
    () => resolveLocale({ settings, uiLanguage: getUiLanguage() }),
    [settings]
  );
  const panelController = usePanelController(locale);
  const dispatchCommand = useCallback(
    (command: TabCommand) => panelController.dispatchCommand(command),
    [panelController]
  );
  const {
    snapshot,
    errorMessage,
    isInteractive,
    hasUsableSnapshot,
    isLoading,
    isResyncing,
    traceSettings,
    traceEntryCount,
    traceUpdatedAt,
    resyncPanel,
    copyDebugTrace,
    postTraceEvent
  } = panelController;
  const [copyTraceState, setCopyTraceState] = useState<"idle" | "success" | "error">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<SearchFilterMode>("filter");
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const commandActions = useMemo(() => createPanelCommandActions(dispatchCommand), [dispatchCommand]);

  useEffect(() => {
    applyDocumentLocale({
      locale,
      titleKey: "app.sidepanelTitle"
    });
  }, [locale]);

  useEffect(() => {
    let disposed = false;

    const initializeSettings = async () => {
      const nextSettings = await loadExtensionSettings();
      if (!disposed) {
        setSettings(nextSettings);
      }
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      const settingsChange = changes[EXTENSION_SETTINGS_STORAGE_KEY];
      if (!settingsChange) {
        return;
      }

      setSettings(
        (settingsChange.newValue as ExtensionSettingsRecord | undefined) ?? DEFAULT_EXTENSION_SETTINGS
      );
    };

    void initializeSettings();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      disposed = true;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const {
    collapsedWindowIds,
    hasCollapsedWindows,
    hasCollapsedGroups,
    toggleWindow,
    expandAll,
    collapseAll
  } = useCollapsedWindows(snapshot, commandActions.setGroupCollapsed);

  const sections = useMemo(
    () => selectWindowSections(snapshot, collapsedWindowIds, locale),
    [collapsedWindowIds, locale, snapshot]
  );
  const searchActive = searchTerm.trim().length > 0;
  const rows = useMemo(
    () => flattenWindowSections(sections, searchActive ? { includeCollapsedChildren: true } : undefined),
    [sections, searchActive]
  );

  const filteredRows = useMemo(
    () => filterPanelRowsBySearch(rows, searchTerm, filterMode),
    [rows, searchTerm, filterMode]
  );

  const matchCount = useMemo(() => {
    if (!searchTerm.trim()) {
      return 0;
    }

    if (filterMode === "filter") {
      return filteredRows.filter((row) => row.kind === "tab").length;
    }

    return filteredRows.filter((row) => row.kind === "tab" && row.matchesSearch).length;
  }, [filteredRows, filterMode, searchTerm]);

  const currentActiveTabId = useMemo(() => selectCurrentActiveTabId(snapshot), [snapshot]);

  const { selectedTabIds, selectedTabIdSet, clearSelection, removeFromSelection, handlePrimaryAction } =
    useTabSelection(filteredRows, (event, details) => {
      postTraceEvent({
        event,
        details,
        category: "selection"
      });
    });
  const { closingTabIdSet, startClosing } = useClosingTabs(snapshot);

  useActiveGroupAutoExpand({
    snapshot,
    currentActiveTabId,
    dispatchCommand
  });

  useEffect(() => {
    (
      window as typeof window & {
        __sidepanelBoot?: {
          ready?: () => void;
        };
      }
    ).__sidepanelBoot?.ready?.();
  }, []);

  useEffect(() => {
    const api: NonNullable<typeof window.__playwrightApi> = {
      getSnapshot: () => Promise.resolve(snapshot),
      dispatchCommand: (command: TabCommand) => {
        dispatchCommand(command);
        return Promise.resolve();
      },
      waitForInteractive: async () => {
        const timeoutAt = Date.now() + 10_000;
        while (Date.now() < timeoutAt) {
          if (snapshot.version > 0 && panelController.isInteractive) {
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error("Sidepanel did not become interactive within 10 seconds");
      },
      closeSidepanel: () => window.close()
    };
    window.__playwrightApi = api;
  }, [dispatchCommand, panelController.isInteractive, snapshot]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (event.key === "Escape") {
          event.preventDefault();
          setSearchTerm("");
          target.blur();
        }
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        focusSearchInput();
        return;
      }

      if (event.key === "Escape" && searchTerm) {
        event.preventDefault();
        setSearchTerm("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchTerm]);

  function closeTab(tabId: number): void {
    postTraceEvent({
      event: "panel/tab-close-clicked",
      details: {
        tabId,
        selectedTabIds
      },
      category: "command"
    });
    removeFromSelection(tabId);

    const nextClosingTabIds = startClosing([tabId]);
    if (nextClosingTabIds.length === 0) {
      return;
    }

    commandActions.closeTab(tabId);
  }

  function closeSelectedTabs(): void {
    if (selectedTabIds.length === 0) {
      return;
    }

    postTraceEvent({
      event: "panel/tabs-close-selected",
      details: {
        selectedTabIds
      },
      category: "command"
    });

    const nextClosingTabIds = startClosing(selectedTabIds);
    clearSelection();
    if (nextClosingTabIds.length === 0) {
      return;
    }

    commandActions.closeTabs(nextClosingTabIds);
  }

  function handleTabPrimaryAction(params: { tabId: number; shiftKey: boolean; toggleKey: boolean }): void {
    postTraceEvent({
      event: "panel/tab-activate-clicked",
      details: params,
      category: "command"
    });
    handlePrimaryAction({
      ...params,
      onActivate: commandActions.activateTab
    });
  }

  async function handleCopyDebugTrace(): Promise<void> {
    try {
      postTraceEvent({
        event: "panel/trace-copy-clicked",
        details: {
          traceEntryCount
        },
        category: "trace"
      });
      const copied = await copyDebugTrace();
      setCopyTraceState(copied ? "success" : "error");
    } catch {
      setCopyTraceState("error");
    }
  }

  function handleClearSearch(): void {
    postTraceEvent({
      event: "panel/search-cleared-from-app",
      details: {
        searchTerm,
        filterMode,
        matchCount
      },
      category: "search"
    });
    setSearchTerm("");
  }

  function handleMoveToNewWindow(): void {
    if (matchCount === 0) {
      return;
    }

    const matchingTabIds = filteredRows.reduce<number[]>((tabIds, row) => {
      if (row.kind !== "tab") {
        return tabIds;
      }

      if (filterMode === "highlight" && !row.matchesSearch) {
        return tabIds;
      }

      return [...tabIds, row.tab.id];
    }, []);

    if (matchingTabIds.length === 0) {
      return;
    }

    postTraceEvent({
      event: "panel/search-move-to-new-window-dispatched",
      details: {
        searchTerm,
        filterMode,
        matchCount,
        matchingTabIds
      },
      category: "command"
    });

    commandActions.moveTabsToNewWindow(matchingTabIds);
    setSearchTerm("");
  }

  useEffect(() => {
    if (copyTraceState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyTraceState("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyTraceState]);

  const toolbarDisabled = !isInteractive || isResyncing;
  const listDisabled = !hasUsableSnapshot;

  return (
    <div ref={appShellRef} className="app-shell">
      <SidepanelToolbar
        locale={locale}
        appShellRef={appShellRef}
        selectedCount={selectedTabIds.length}
        hasCollapsedWindows={hasCollapsedWindows}
        hasCollapsedGroups={hasCollapsedGroups}
        disabled={toolbarDisabled}
        onResync={resyncPanel}
        onOpenSettings={() => {
          postTraceEvent({
            event: "panel/settings-open-clicked",
            details: {},
            category: "panel"
          });
          void chrome.runtime.openOptionsPage();
        }}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onCloseSelected={closeSelectedTabs}
      />
      <div ref={panelScrollRef} className="panel-scroll">
        <SidepanelStatus
          locale={locale}
          errorMessage={errorMessage}
          isInteractive={isInteractive}
          isLoading={isLoading}
          isResyncing={isResyncing}
          traceEnabled={traceSettings.verboseLoggingEnabled}
          traceEntryCount={traceEntryCount}
          traceUpdatedAt={traceUpdatedAt}
          onCopyDebugTrace={
            errorMessage
              ? () => {
                  void handleCopyDebugTrace();
                }
              : undefined
          }
          copyTraceState={copyTraceState}
        />
        {!isLoading ? (
          <VirtualizedWindowList
            locale={locale}
            rows={filteredRows}
            currentActiveTabId={currentActiveTabId}
            closingTabIds={closingTabIdSet}
            selectedTabIds={selectedTabIdSet}
            scrollContainerRef={panelScrollRef}
            disabled={listDisabled}
            searchActive={searchActive}
            onTraceEvent={(event, details) => {
              postTraceEvent({
                event,
                details,
                category: event.startsWith("list/") ? "ui" : "selection"
              });
            }}
            onClearSelection={clearSelection}
            onToggleWindow={toggleWindow}
            onToggleGroup={commandActions.setGroupCollapsed}
            onActivateTab={handleTabPrimaryAction}
            onTogglePinned={commandActions.setTabPinned}
            onCloseTab={closeTab}
            onMoveTab={commandActions.moveTab}
            onMoveTabs={commandActions.moveTabs}
            onMoveGroup={commandActions.moveGroup}
          />
        ) : null}
      </div>
      <SearchBar
        locale={locale}
        searchTerm={searchTerm}
        filterMode={filterMode}
        matchCount={matchCount}
        disabled={toolbarDisabled}
        onSearchChange={setSearchTerm}
        onFilterModeChange={setFilterMode}
        onMoveToNewWindow={handleMoveToNewWindow}
        onClearSearch={handleClearSearch}
        onTraceEvent={(event, details) => {
          postTraceEvent({
            event,
            details,
            category: "search"
          });
        }}
      />
    </div>
  );
}
