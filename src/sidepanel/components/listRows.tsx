import { CloseSmall, Pin } from "@icon-park/react";
import { useEffect, useState } from "react";
import { buildTabFaviconCandidates } from "../../shared/domain/favicon";
import { translate, type SupportedLocale } from "../../shared/i18n";
import type { PanelRow } from "../../shared/types";
import type { DragSource, DropTarget } from "./listDrag";
import {
  getGroupRowClassName,
  getRowShellClassName,
  getTabRowClassName,
  getWindowRowClassName
} from "./VirtualizedWindowList";

export function RowShell({
  locale,
  row,
  rowRefs,
  currentActiveTabId,
  closingTabIds,
  selectedTabIds,
  onCaptureManualToggleAnchor,
  disabled,
  onClearSelection,
  onToggleWindow,
  onToggleGroup,
  onActivateTab,
  onTogglePinned,
  onCloseTab,
  selectionMode,
  dragSource,
  dropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  extraClassName = "",
  groupedTabColor,
  visuallyExpanded = false,
  onElementRefChange
}: {
  locale: SupportedLocale;
  row: PanelRow;
  rowRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  currentActiveTabId: number | null;
  closingTabIds: ReadonlySet<number>;
  selectedTabIds: ReadonlySet<number>;
  onCaptureManualToggleAnchor: (rowKey: string) => void;
  disabled: boolean;
  onClearSelection: () => void;
  onToggleWindow: (windowId: number) => void;
  onToggleGroup: (groupId: number, collapsed: boolean) => void;
  onActivateTab: (params: {
    tabId: number;
    shiftKey: boolean;
    toggleKey: boolean;
  }) => void;
  onTogglePinned: (tabId: number, pinned: boolean) => void;
  onCloseTab: (tabId: number) => void;
  selectionMode: boolean;
  dragSource: DragSource | null;
  dropTarget: DropTarget | null;
  onDragStart: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  extraClassName?: string;
  groupedTabColor?: chrome.tabGroups.ColorEnum;
  visuallyExpanded?: boolean;
  onElementRefChange?: (node: HTMLDivElement | null) => void;
}) {
  const shellExtraClassName = [
    extraClassName,
    dragSource?.rowKey === row.key ? "stack-list__item--dragging" : "",
    dropTarget?.rowKey === row.key ? `stack-list__item--drop-${dropTarget.indicator}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={getRowShellClassName({
        extraClassName: shellExtraClassName
      })}
      ref={(node) => {
        if (node) {
          rowRefs.current.set(row.key, node);
        } else {
          rowRefs.current.delete(row.key);
        }
        onElementRefChange?.(node);
      }}
    >
      <PanelListRow
        locale={locale}
        row={row}
        currentActiveTabId={currentActiveTabId}
        closingTabIds={closingTabIds}
        selectedTabIds={selectedTabIds}
        onCaptureManualToggleAnchor={onCaptureManualToggleAnchor}
        disabled={disabled}
        onClearSelection={onClearSelection}
        onToggleWindow={onToggleWindow}
        onToggleGroup={onToggleGroup}
        onActivateTab={onActivateTab}
        onTogglePinned={onTogglePinned}
        onCloseTab={onCloseTab}
        selectionMode={selectionMode}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        groupedTabColor={groupedTabColor}
        visuallyExpanded={visuallyExpanded}
      />
    </div>
  );
}

function PanelListRow({
  locale,
  row,
  currentActiveTabId,
  closingTabIds,
  selectedTabIds,
  onCaptureManualToggleAnchor,
  disabled,
  onClearSelection,
  onToggleWindow,
  onToggleGroup,
  onActivateTab,
  onTogglePinned,
  onCloseTab,
  selectionMode,
  onDragStart,
  onDragOver,
  onDrop,
  groupedTabColor,
  visuallyExpanded = false
}: {
  locale: SupportedLocale;
  row: PanelRow;
  currentActiveTabId: number | null;
  closingTabIds: ReadonlySet<number>;
  selectedTabIds: ReadonlySet<number>;
  onCaptureManualToggleAnchor: (rowKey: string) => void;
  disabled: boolean;
  onClearSelection: () => void;
  onToggleWindow: (windowId: number) => void;
  onToggleGroup: (groupId: number, collapsed: boolean) => void;
  onActivateTab: (params: {
    tabId: number;
    shiftKey: boolean;
    toggleKey: boolean;
  }) => void;
  onTogglePinned: (tabId: number, pinned: boolean) => void;
  onCloseTab: (tabId: number) => void;
  selectionMode: boolean;
  onDragStart: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (row: PanelRow, event: React.DragEvent<HTMLElement>) => void;
  groupedTabColor?: chrome.tabGroups.ColorEnum;
  visuallyExpanded?: boolean;
}) {
  if (row.kind === "window") {
    return (
      <button
        type="button"
        className={getWindowRowClassName({
          isFocused: row.isFocused,
          visuallyExpanded
        })}
        role="treeitem"
        aria-level={1}
        onClick={() => {
          onClearSelection();
          onCaptureManualToggleAnchor(row.key);
          onToggleWindow(row.windowId);
        }}
        onDragOver={(event) => onDragOver(row, event)}
        onDrop={(event) => onDrop(row, event)}
        aria-expanded={visuallyExpanded || !row.collapsed}
        disabled={disabled}
      >
        <span className="window-row__chevron" aria-hidden="true">
          {visuallyExpanded || !row.collapsed ? "▾" : "▸"}
        </span>
        <span className="window-row__title">{row.title}</span>
        <span className="window-row__meta">
          {row.isFocused ? <span className="window-row__current">{translate(locale, "sidepanel.window.current")}</span> : null}
          <span className="window-row__count">{row.totalCount}</span>
        </span>
      </button>
    );
  }

  if (row.kind === "group") {
    return (
      <button
        type="button"
        className={getGroupRowClassName({
          collapsed: row.collapsed,
          visuallyExpanded
        })}
        role="treeitem"
        aria-level={2}
        onClick={() => {
          onClearSelection();
          onCaptureManualToggleAnchor(row.key);
          onToggleGroup(row.groupId, !row.collapsed);
        }}
        draggable={!disabled}
        onDragStart={(event) => onDragStart(row, event)}
        onDragOver={(event) => onDragOver(row, event)}
        onDrop={(event) => onDrop(row, event)}
        aria-expanded={visuallyExpanded || !row.collapsed}
        disabled={disabled}
      >
        <span className="group-row__title">{row.title}</span>
        <span className="group-row__meta">
          <span className="group-row__count">{row.totalCount}</span>
          <span className="group-row__chevron" aria-hidden="true">
            {visuallyExpanded || !row.collapsed ? "▾" : "▸"}
          </span>
        </span>
      </button>
    );
  }

  const isCurrentActive = row.tab.id === currentActiveTabId;
  const isWindowActive = row.tab.active && !isCurrentActive;
  const isClosing = closingTabIds.has(row.tab.id);
  const isSelected = selectedTabIds.has(row.tab.id);
  const tabDisabled = disabled || isClosing;

  return (
    <div
      className={getTabRowClassName({
        isCurrentActive,
        isWindowActive,
        isGrouped: groupedTabColor != null,
        isSelected,
        isClosing,
        groupedTabColor,
        matchesSearch: row.matchesSearch
      }) + (tabDisabled ? " tab-row--disabled" : "")}
      onDragOver={(event) => onDragOver(row, event)}
      onDrop={(event) => onDrop(row, event)}
    >
      <button
        type="button"
        className="tab-row__main"
        role="treeitem"
        aria-level={groupedTabColor != null ? 3 : 2}
        aria-label={
          selectionMode
            ? row.tab.title
            : translate(locale, "sidepanel.tab.activate", {
                title: row.tab.title
              })
        }
        aria-current={isCurrentActive ? "page" : undefined}
        aria-selected={isSelected}
        onClick={(event) =>
          onActivateTab({
            tabId: row.tab.id,
            shiftKey: event.shiftKey,
            toggleKey: event.metaKey || event.ctrlKey
          })
        }
        draggable={!tabDisabled && !row.tab.pinned}
        onDragStart={(event) => onDragStart(row, event)}
        disabled={tabDisabled}
      >
        <span className="tab-row__favicon" aria-hidden="true">
          <TabFavicon pageUrl={row.tab.url} favIconUrl={row.tab.favIconUrl} />
        </span>
        <span className="tab-row__title">{row.tab.title}</span>
      </button>
      <div className="tab-row__actions" aria-hidden={tabDisabled ? "true" : undefined}>
        <button
          type="button"
          className={`tab-row__action${row.tab.pinned ? " tab-row__action--active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePinned(row.tab.id, !row.tab.pinned);
          }}
          aria-label={row.tab.pinned ? translate(locale, "sidepanel.tab.unpin") : translate(locale, "sidepanel.tab.pin")}
          aria-pressed={row.tab.pinned}
          disabled={tabDisabled}
        >
          <Pin theme={row.tab.pinned ? "filled" : "outline"} size="16" />
        </button>
        <button
          type="button"
          className="tab-row__action"
          onClick={(event) => {
            event.stopPropagation();
            onCloseTab(row.tab.id);
          }}
          aria-label={translate(locale, "sidepanel.tab.close")}
          disabled={tabDisabled}
        >
          <CloseSmall theme="outline" size="16" />
        </button>
      </div>
    </div>
  );
}

function TabFavicon({
  pageUrl,
  favIconUrl
}: {
  pageUrl: string;
  favIconUrl: string | null;
}) {
  const candidates = buildTabFaviconCandidates(pageUrl, favIconUrl);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const activeCandidate = candidates[candidateIndex] ?? null;

  useEffect(() => {
    setCandidateIndex(0);
  }, [pageUrl, favIconUrl]);

  if (!activeCandidate) {
    return <span className="tab-row__favicon-placeholder" />;
  }

  return (
    <img
      src={activeCandidate}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setCandidateIndex((current) => current + 1)}
    />
  );
}
