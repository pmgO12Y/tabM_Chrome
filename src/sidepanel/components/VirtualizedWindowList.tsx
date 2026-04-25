import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PanelRow } from "../../shared/types";
import type { DragSource, DropTarget } from "./listDrag";
import { buildDragCommand, createDragSource, createSelectedTabsDragSource, resolveDropTarget } from "./listDrag";
import { RowShell } from "./listRows";

interface VirtualizedWindowListProps {
  rows: PanelRow[];
  currentActiveTabId: number | null;
  closingTabIds: ReadonlySet<number>;
  selectedTabIds: ReadonlySet<number>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  searchActive?: boolean;
  onTraceEvent?: (event: string, details: Record<string, unknown>) => void;
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
  onMoveTab: (command: {
    tabId: number;
    targetWindowId: number;
    targetIndex: number;
    targetGroupId: number | null;
  }) => void;
  onMoveTabs: (command: {
    tabIds: number[];
    targetWindowId: number;
    targetIndex: number;
    targetGroupId: number | null;
  }) => void;
  onMoveGroup: (command: {
    groupId: number;
    tabIds: number[];
    targetWindowId: number;
    targetIndex: number;
    title: string;
    color: chrome.tabGroups.ColorEnum;
    collapsed: boolean;
  }) => void;
}

type WindowRenderItem =
  | { kind: "single"; row: Exclude<PanelRow, { kind: "window" }> }
  | {
      kind: "group-block";
      groupRow: Extract<PanelRow, { kind: "group" }>;
      childRows: Array<Extract<PanelRow, { kind: "tab" }>>;
    };

export interface WindowRenderSection {
  windowRow: Extract<PanelRow, { kind: "window" }>;
  items: WindowRenderItem[];
}

export function getRowShellClassName(params: {
  extraClassName?: string;
}): string {
  const { extraClassName = "" } = params;

  return `stack-list__item${extraClassName ? ` ${extraClassName}` : ""}`;
}

export function getWindowRowClassName(params: {
  isFocused: boolean;
  visuallyExpanded?: boolean;
}): string {
  const { isFocused, visuallyExpanded = false } = params;

  return `window-row${isFocused ? " window-row--focused" : ""}${
    visuallyExpanded ? " window-row--visually-expanded" : ""
  }`;
}

export function getGroupRowClassName(params: {
  collapsed: boolean;
  visuallyExpanded?: boolean;
}): string {
  const { collapsed, visuallyExpanded = false } = params;

  return `group-row${collapsed && !visuallyExpanded ? " group-row--collapsed" : ""}${
    visuallyExpanded ? " group-row--visually-expanded" : ""
  }`;
}

export function getWindowSectionHeaderClassName(params: {
  measured: boolean;
}): string {
  const { measured } = params;

  return `window-section__header${measured ? " window-section__header--measured" : ""}`;
}

export function getStickyScrollStyle(windowStickyOffset: number): React.CSSProperties {
  return {
    "--window-sticky-offset": `${windowStickyOffset}px`
  } as React.CSSProperties;
}

export function getTabRowClassName(params: {
  isCurrentActive: boolean;
  isWindowActive: boolean;
  isGrouped: boolean;
  isSelected?: boolean;
  isClosing?: boolean;
  groupedTabColor?: chrome.tabGroups.ColorEnum;
  matchesSearch?: boolean;
}): string {
  const {
    isCurrentActive,
    isWindowActive,
    isGrouped,
    isSelected = false,
    isClosing = false,
    groupedTabColor,
    matchesSearch
  } = params;

  return `tab-row${
    isCurrentActive ? " tab-row--current-active" : isWindowActive ? " tab-row--window-active" : ""
  }${groupedTabColor ? ` tab-row--grouped tab-row--grouped-${groupedTabColor}` : ""}${
    isCurrentActive && isGrouped ? " tab-row--grouped-current-active" : ""
  }${isSelected ? " tab-row--selected" : ""}${isClosing ? " tab-row--closing" : ""}${
    matchesSearch === false ? " tab-row--unmatched" : ""
  }`;
}

export function buildWindowRenderSections(rows: PanelRow[]): WindowRenderSection[] {
  const sections: WindowRenderSection[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.kind !== "window") {
      continue;
    }

    const sectionRows: Array<Exclude<PanelRow, { kind: "window" }>> = [];
    let cursor = index + 1;
    while (cursor < rows.length && rows[cursor].kind !== "window") {
      sectionRows.push(rows[cursor] as Exclude<PanelRow, { kind: "window" }>);
      cursor += 1;
    }

    sections.push({
      windowRow: row,
      items: buildRenderItems(sectionRows)
    });
    index = cursor - 1;
  }

  return sections;
}

export function shouldScrollToActiveRow(params: {
  activeRowKey: string | null;
  hasActiveRowInList: boolean;
  hasRenderedTargetRow: boolean;
  hasCompletedInitialScroll: boolean;
  previousScrolledRowKey: string | null;
}): boolean {
  const {
    activeRowKey,
    hasActiveRowInList,
    hasRenderedTargetRow,
    hasCompletedInitialScroll,
    previousScrolledRowKey
  } = params;

  if (!activeRowKey || !hasActiveRowInList || !hasRenderedTargetRow) {
    return false;
  }

  return !hasCompletedInitialScroll || previousScrolledRowKey !== activeRowKey;
}

export function resolveActiveRowAutoScroll(params: {
  activeRowKey: string | null;
  hasActiveRowInList: boolean;
  hasRenderedTargetRow: boolean;
  hasCompletedInitialScroll: boolean;
  previousScrolledRowKey: string | null;
  suppressedActiveRowKey: string | null;
}): {
  shouldScroll: boolean;
  nextPreviousScrolledRowKey: string | null;
  nextSuppressedActiveRowKey: string | null;
} {
  const {
    activeRowKey,
    hasActiveRowInList,
    hasRenderedTargetRow,
    hasCompletedInitialScroll,
    previousScrolledRowKey,
    suppressedActiveRowKey
  } = params;

  if (!activeRowKey) {
    return {
      shouldScroll: false,
      nextPreviousScrolledRowKey: null,
      nextSuppressedActiveRowKey: null
    };
  }

  if (suppressedActiveRowKey === activeRowKey) {
    return {
      shouldScroll: false,
      nextPreviousScrolledRowKey: activeRowKey,
      nextSuppressedActiveRowKey: hasActiveRowInList ? null : suppressedActiveRowKey
    };
  }

  if (!hasActiveRowInList) {
    return {
      shouldScroll: false,
      nextPreviousScrolledRowKey: null,
      nextSuppressedActiveRowKey: suppressedActiveRowKey
    };
  }

  if (!hasRenderedTargetRow) {
    return {
      shouldScroll: false,
      nextPreviousScrolledRowKey: previousScrolledRowKey,
      nextSuppressedActiveRowKey: suppressedActiveRowKey
    };
  }

  const shouldScroll = shouldScrollToActiveRow({
    activeRowKey,
    hasActiveRowInList,
    hasRenderedTargetRow,
    hasCompletedInitialScroll,
    previousScrolledRowKey
  });

  return {
    shouldScroll,
    nextPreviousScrolledRowKey: shouldScroll ? activeRowKey : previousScrolledRowKey,
    nextSuppressedActiveRowKey: suppressedActiveRowKey
  };
}

export function calculateAnchorScrollAdjustment(params: {
  previousRowTop: number;
  nextRowTop: number;
}): number {
  const { previousRowTop, nextRowTop } = params;

  return nextRowTop - previousRowTop;
}

export function calculateRequiredBottomSpacer(params: {
  desiredScrollTop: number;
  maxScrollTop: number;
}): number {
  const { desiredScrollTop, maxScrollTop } = params;

  return Math.max(0, Math.ceil(desiredScrollTop - maxScrollTop));
}

export function canReleaseBottomSpacer(params: {
  currentScrollTop: number;
  maxScrollTop: number;
  bottomSpacerHeight: number;
}): boolean {
  const { currentScrollTop, maxScrollTop, bottomSpacerHeight } = params;

  if (bottomSpacerHeight <= 0) {
    return false;
  }

  const distanceToBottom = Math.max(0, maxScrollTop - currentScrollTop);
  return distanceToBottom >= bottomSpacerHeight;
}

export function calculateStickyHeaderObstruction(params: {
  windowHeaderHeight: number;
  groupHeaderHeight: number | null;
  groupHeaderOverlap: number | null;
}): number {
  const { windowHeaderHeight, groupHeaderHeight, groupHeaderOverlap } = params;

  return Math.max(0, windowHeaderHeight) + Math.max(0, (groupHeaderHeight ?? 0) - (groupHeaderOverlap ?? 0));
}

export function calculateActiveRowScrollAdjustment(params: {
  rowTop: number;
  rowBottom: number;
  containerHeight: number;
  topObstruction: number;
}): number {
  const { rowTop, rowBottom, containerHeight, topObstruction } = params;

  if (rowTop < topObstruction) {
    return rowTop - topObstruction;
  }

  if (rowBottom > containerHeight) {
    return rowBottom - containerHeight;
  }

  return 0;
}

export function VirtualizedWindowList({
  rows,
  currentActiveTabId,
  closingTabIds,
  selectedTabIds,
  scrollContainerRef,
  disabled = false,
  searchActive = false,
  onTraceEvent,
  onClearSelection,
  onToggleWindow,
  onToggleGroup,
  onActivateTab,
  onTogglePinned,
  onCloseTab,
  onMoveTab,
  onMoveTabs,
  onMoveGroup
}: VirtualizedWindowListProps) {
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const hasCompletedInitialScrollRef = useRef(false);
  const previousScrolledRowKeyRef = useRef<string | null>(null);
  const suppressedAutoScrollRowKeyRef = useRef<string | null>(null);
  const pendingManualAnchorRef = useRef<{
    rowKey: string;
    previousRowTop: number;
  } | null>(null);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [windowStickyOffset, setWindowStickyOffset] = useState(0);
  const [measuredWindowHeaderNode, setMeasuredWindowHeaderNode] = useState<HTMLDivElement | null>(null);
  const activeRowKey = currentActiveTabId != null ? `tab-${currentActiveTabId}` : null;
  const hasActiveRowInList = useMemo(
    () => activeRowKey != null && rows.some((row) => row.key === activeRowKey),
    [activeRowKey, rows]
  );
  const windowSections = useMemo(() => buildWindowRenderSections(rows), [rows]);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const pendingAnchor = pendingManualAnchorRef.current;
    if (scrollContainer && pendingAnchor) {
      const rowNode = rowRefs.current.get(pendingAnchor.rowKey);
      if (!rowNode) {
        pendingManualAnchorRef.current = null;
      } else {
        const nextRowTop = getRowTopWithinContainer(rowNode, scrollContainer);
        const scrollAdjustment = calculateAnchorScrollAdjustment({
          previousRowTop: pendingAnchor.previousRowTop,
          nextRowTop
        });

        if (scrollAdjustment === 0) {
          pendingManualAnchorRef.current = null;
        } else {
          const desiredScrollTop = scrollContainer.scrollTop + scrollAdjustment;
          const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          const requiredBottomSpacer = calculateRequiredBottomSpacer({
            desiredScrollTop,
            maxScrollTop
          });

          if (requiredBottomSpacer > bottomSpacerHeight) {
            setBottomSpacerHeight(requiredBottomSpacer);
            return;
          }

          scrollContainer.scrollTop = Math.max(0, Math.min(desiredScrollTop, maxScrollTop));
          pendingManualAnchorRef.current = null;
        }
      }
    }

    if (
      scrollContainer &&
      pendingManualAnchorRef.current == null &&
      canReleaseBottomSpacer({
        currentScrollTop: scrollContainer.scrollTop,
        maxScrollTop: scrollContainer.scrollHeight - scrollContainer.clientHeight,
        bottomSpacerHeight
      })
    ) {
      setBottomSpacerHeight(0);
    }
  }, [rows, bottomSpacerHeight, scrollContainerRef]);

  useEffect(() => {
    if (bottomSpacerHeight === 0) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const handleScroll = () => {
      if (
        canReleaseBottomSpacer({
          currentScrollTop: scrollContainer.scrollTop,
          maxScrollTop: scrollContainer.scrollHeight - scrollContainer.clientHeight,
          bottomSpacerHeight
        })
      ) {
        setBottomSpacerHeight(0);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [bottomSpacerHeight, scrollContainerRef]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const targetRow = activeRowKey == null ? null : rowRefs.current.get(activeRowKey);
    const decision = resolveActiveRowAutoScroll({
      activeRowKey,
      hasActiveRowInList,
      hasRenderedTargetRow: Boolean(targetRow),
      hasCompletedInitialScroll: hasCompletedInitialScrollRef.current,
      previousScrolledRowKey: previousScrolledRowKeyRef.current,
      suppressedActiveRowKey: suppressedAutoScrollRowKeyRef.current
    });

    previousScrolledRowKeyRef.current = decision.nextPreviousScrolledRowKey;
    suppressedAutoScrollRowKeyRef.current = decision.nextSuppressedActiveRowKey;

    if (!decision.shouldScroll || !targetRow || !scrollContainer) {
      return;
    }

    const rowTop = getRowTopWithinContainer(targetRow, scrollContainer);
    const rowBottom = rowTop + targetRow.getBoundingClientRect().height;
    const topObstruction = getActiveRowTopObstruction(targetRow);
    const scrollAdjustment = calculateActiveRowScrollAdjustment({
      rowTop,
      rowBottom,
      containerHeight: scrollContainer.clientHeight,
      topObstruction
    });

    onTraceEvent?.("list/auto-scroll-to-active", {
      activeRowKey,
      scrollAdjustment,
      rowTop,
      rowBottom,
      topObstruction
    });

    if (scrollAdjustment !== 0) {
      const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
      const nextScrollTop = Math.max(0, Math.min(scrollContainer.scrollTop + scrollAdjustment, maxScrollTop));
      scrollContainer.scrollTo({
        top: nextScrollTop,
        behavior: "smooth"
      });
    }

    hasCompletedInitialScrollRef.current = true;
    previousScrolledRowKeyRef.current = activeRowKey;
  }, [activeRowKey, hasActiveRowInList, rows, scrollContainerRef]);

  useEffect(() => {
    if (dragSource && !rows.some((row) => row.key === dragSource.rowKey)) {
      setDragSource(null);
      setDropTarget(null);
    }
  }, [dragSource, rows]);

  useLayoutEffect(() => {
    if (!measuredWindowHeaderNode) {
      setWindowStickyOffset(0);
      return;
    }

    const updateWindowStickyOffset = () => {
      setWindowStickyOffset(measuredWindowHeaderNode.getBoundingClientRect().height);
    };

    updateWindowStickyOffset();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWindowStickyOffset);
      return () => {
        window.removeEventListener("resize", updateWindowStickyOffset);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWindowStickyOffset();
    });
    observer.observe(measuredWindowHeaderNode);

    return () => {
      observer.disconnect();
    };
  }, [measuredWindowHeaderNode]);

  function captureManualToggleAnchor(rowKey: string): void {
    const scrollContainer = scrollContainerRef.current;
    const rowNode = rowRefs.current.get(rowKey);

    suppressedAutoScrollRowKeyRef.current = activeRowKey;

    if (!scrollContainer || !rowNode) {
      pendingManualAnchorRef.current = null;
      return;
    }

    pendingManualAnchorRef.current = {
      rowKey,
      previousRowTop: getRowTopWithinContainer(rowNode, scrollContainer)
    };
  }

  function clearDragState(): void {
    setDragSource(null);
    setDropTarget(null);
  }

  function handleDragStart(row: PanelRow, event: React.DragEvent<HTMLElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (row.kind === "tab" && !selectedTabIds.has(row.tab.id) && selectedTabIds.size > 0) {
      onClearSelection();
    }

    const selectedTabsSource =
      row.kind === "tab" && selectedTabIds.has(row.tab.id)
        ? createSelectedTabsDragSource({
            row,
            rows,
            selectedTabIds
          })
        : null;

    if (row.kind === "tab" && selectedTabIds.has(row.tab.id) && selectedTabIds.size > 1 && !selectedTabsSource) {
      event.preventDefault();
      return;
    }

    const source = selectedTabsSource ?? createDragSource(row);
    if (!source) {
      event.preventDefault();
      return;
    }

    onTraceEvent?.("list/drag-start", {
      rowKey: row.key,
      rowKind: row.kind,
      source
    });

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.key);
    setDragSource(source);
    setDropTarget(null);
  }

  function handleDragOver(row: PanelRow, event: React.DragEvent<HTMLElement>): void {
    if (disabled || !dragSource) {
      return;
    }

    const target = resolveDropTarget({
      source: dragSource,
      targetRow: row,
      pointerRatio: getPointerRatio(event)
    });

    if (!target) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget((current) =>
      current &&
      current.rowKey === target.rowKey &&
      current.indicator === target.indicator &&
      current.targetWindowId === target.targetWindowId &&
      current.targetIndex === target.targetIndex &&
      current.targetGroupId === target.targetGroupId
        ? current
        : target
    );
  }

  function handleDrop(row: PanelRow, event: React.DragEvent<HTMLElement>): void {
    if (disabled || !dragSource) {
      return;
    }

    const target = resolveDropTarget({
      source: dragSource,
      targetRow: row,
      pointerRatio: getPointerRatio(event)
    });
    if (!target) {
      clearDragState();
      return;
    }

    event.preventDefault();
    const command = buildDragCommand({
      source: dragSource,
      target
    });
    onTraceEvent?.("list/drop", {
      rowKey: row.key,
      rowKind: row.kind,
      dragSource,
      target,
      command
    });
    clearDragState();

    if (!command) {
      return;
    }

    if (command.type === "tab/move") {
      onMoveTab(command);
      return;
    }

    if (command.type === "tabs/move") {
      onMoveTabs(command);
      return;
    }

    onMoveGroup(command);
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">
          {searchActive ? "没有匹配的标签页" : "没有可显示的标签页"}
        </p>
        <p className="empty-state__body">
          {searchActive ? "试试其他关键词，或按 Esc 清空搜索" : "打开网页后，这里会自动出现对应标签。"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="virtual-list"
      role="tree"
      aria-label="标签列表"
      style={getStickyScrollStyle(windowStickyOffset)}
      onPointerDown={(event) => {
        if (event.target instanceof Element && event.target.closest(".stack-list__item")) {
          return;
        }

        onClearSelection();
      }}
      onDragEnd={clearDragState}
      onDrop={(event) => {
        event.preventDefault();
        clearDragState();
      }}
    >
      <div className="stack-list">
        {windowSections.map((section, sectionIndex) => (
          <section
            key={section.windowRow.key}
            className="window-section"
          >
            <RowShell
              row={section.windowRow}
              rowRefs={rowRefs}
              currentActiveTabId={currentActiveTabId}
              closingTabIds={closingTabIds}
              selectedTabIds={selectedTabIds}
              onCaptureManualToggleAnchor={captureManualToggleAnchor}
              disabled={disabled}
              onClearSelection={onClearSelection}
              onToggleWindow={onToggleWindow}
              onToggleGroup={onToggleGroup}
              onActivateTab={onActivateTab}
              onTogglePinned={onTogglePinned}
              onCloseTab={onCloseTab}
              dragSource={dragSource}
              dropTarget={dropTarget}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              extraClassName={getWindowSectionHeaderClassName({
                measured: sectionIndex === 0
              })}
              visuallyExpanded={searchActive && section.windowRow.collapsed}
              onElementRefChange={sectionIndex === 0 ? setMeasuredWindowHeaderNode : undefined}
            />
            {searchActive || !section.windowRow.collapsed ? (
              <div className="window-section__body">
                {section.items.map((item) =>
                  item.kind === "single" ? (
                    <RowShell
                      key={item.row.key}
                      row={item.row}
                      rowRefs={rowRefs}
                      currentActiveTabId={currentActiveTabId}
                      closingTabIds={closingTabIds}
                      selectedTabIds={selectedTabIds}
                      onCaptureManualToggleAnchor={captureManualToggleAnchor}
                      disabled={disabled}
                      onClearSelection={onClearSelection}
                      onToggleWindow={onToggleWindow}
                      onToggleGroup={onToggleGroup}
                      onActivateTab={onActivateTab}
                      onTogglePinned={onTogglePinned}
                      onCloseTab={onCloseTab}
                      dragSource={dragSource}
                      dropTarget={dropTarget}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ) : (
                    <div
                      key={item.groupRow.key}
                      className={`group-block group-block--${item.groupRow.color}${
                        item.groupRow.collapsed ? " group-block--collapsed" : ""
                      }${
                        dragSource?.kind === "group" && dragSource.groupId === item.groupRow.groupId
                          ? " group-block--dragging"
                          : ""
                      }`}
                    >
                      <RowShell
                        row={item.groupRow}
                        rowRefs={rowRefs}
                        currentActiveTabId={currentActiveTabId}
                        closingTabIds={closingTabIds}
                        selectedTabIds={selectedTabIds}
                        onCaptureManualToggleAnchor={captureManualToggleAnchor}
                        disabled={disabled}
                        onClearSelection={onClearSelection}
                        onToggleWindow={onToggleWindow}
                        onToggleGroup={onToggleGroup}
                        onActivateTab={onActivateTab}
                        onTogglePinned={onTogglePinned}
                        onCloseTab={onCloseTab}
                        extraClassName="group-block__header"
                        visuallyExpanded={searchActive && item.groupRow.collapsed}
                        dragSource={dragSource}
                        dropTarget={dropTarget}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                      {!item.groupRow.collapsed || searchActive ? (
                        <div className="group-block__body">
                          {item.childRows.map((row, index) => (
                            <RowShell
                              key={row.key}
                              row={row}
                              rowRefs={rowRefs}
                              currentActiveTabId={currentActiveTabId}
                              closingTabIds={closingTabIds}
                              selectedTabIds={selectedTabIds}
                              onCaptureManualToggleAnchor={captureManualToggleAnchor}
                              disabled={disabled}
                              onClearSelection={onClearSelection}
                              onToggleWindow={onToggleWindow}
                              onToggleGroup={onToggleGroup}
                              onActivateTab={onActivateTab}
                              onTogglePinned={onTogglePinned}
                              onCloseTab={onCloseTab}
                              extraClassName={`group-block__item${
                                index === item.childRows.length - 1 ? " group-block__item--last" : ""
                              }`}
                              groupedTabColor={item.groupRow.color}
                              dragSource={dragSource}
                              dropTarget={dropTarget}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            ) : null}
          </section>
        ))}
        {bottomSpacerHeight > 0 ? (
          <div
            aria-hidden="true"
            className="stack-list__bottom-spacer"
            style={{ height: `${bottomSpacerHeight}px` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function buildRenderItems(rows: Array<Exclude<PanelRow, { kind: "window" }>>): WindowRenderItem[] {
  const items: WindowRenderItem[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.kind !== "group") {
      items.push({
        kind: "single",
        row
      });
      continue;
    }

    const childRows: Array<Extract<PanelRow, { kind: "tab" }>> = [];
    let cursor = index + 1;
    while (cursor < rows.length) {
      const candidate = rows[cursor];
      if (candidate.kind !== "tab" || candidate.tab.groupId !== row.groupId) {
        break;
      }

      childRows.push(candidate);
      cursor += 1;
    }

    items.push({
      kind: "group-block",
      groupRow: row,
      childRows
    });
    index = cursor - 1;
  }

  return items;
}

function getRowTopWithinContainer(rowNode: HTMLDivElement, scrollContainer: HTMLDivElement): number {
  return rowNode.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
}

function getActiveRowTopObstruction(rowNode: HTMLDivElement): number {
  const windowSection = rowNode.closest(".window-section");
  const windowHeader = windowSection?.querySelector<HTMLDivElement>(".window-section__header") ?? null;
  const groupBlock = rowNode.closest(".group-block");
  const groupHeader = groupBlock?.querySelector<HTMLDivElement>(".group-block__header") ?? null;

  const groupHeaderOverlap =
    groupHeader == null
      ? null
      : normalizePixelValue(window.getComputedStyle(groupHeader).paddingTop);

  return calculateStickyHeaderObstruction({
    windowHeaderHeight: windowHeader?.getBoundingClientRect().height ?? 0,
    groupHeaderHeight: groupHeader?.getBoundingClientRect().height ?? null,
    groupHeaderOverlap
  });
}


function normalizePixelValue(value: string): number | null {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}


function getPointerRatio(event: React.DragEvent<HTMLElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.height <= 0) {
    return 0.5;
  }

  return (event.clientY - rect.top) / rect.height;
}
