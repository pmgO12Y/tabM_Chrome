import type { TabDisplaySize } from "../../shared/types";

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
  isLocatePulsing?: boolean;
}): string {
  const {
    isCurrentActive,
    isWindowActive,
    isGrouped,
    isSelected = false,
    isClosing = false,
    groupedTabColor,
    matchesSearch,
    isLocatePulsing = false
  } = params;

  return `tab-row${
    isCurrentActive ? " tab-row--current-active" : isWindowActive ? " tab-row--window-active" : ""
  }${groupedTabColor ? ` tab-row--grouped tab-row--grouped-${groupedTabColor}` : ""}${
    isCurrentActive && isGrouped ? " tab-row--grouped-current-active" : ""
  }${isSelected || matchesSearch ? " tab-row--selected" : ""}${isClosing ? " tab-row--closing" : ""}${
    matchesSearch === false ? " tab-row--unmatched" : ""
  }${isLocatePulsing ? " tab-row--locate-pulsing" : ""}`;
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

export function calculateTargetRowScrollAdjustment(params: {
  rowTop: number;
  rowBottom: number;
  containerHeight: number;
  topObstruction: number;
}): number {
  const { rowTop, rowBottom, containerHeight, topObstruction } = params;
  const visibleHeight = Math.max(0, containerHeight - topObstruction);
  const desiredRowCenter = topObstruction + visibleHeight / 2;
  const rowCenter = (rowTop + rowBottom) / 2;

  return rowCenter - desiredRowCenter;
}

export function shouldPulseLocateRow(params: {
  locateRequest: {
    rowKey: string;
    requestId: number;
  } | null;
  hasRenderedTargetRow: boolean;
}): boolean {
  const { locateRequest, hasRenderedTargetRow } = params;
  return locateRequest != null && hasRenderedTargetRow;
}

export function shouldHandleLocateRequest(params: {
  locateRequest: {
    rowKey: string;
    requestId: number;
  } | null;
  hasRenderedTargetRow: boolean;
  previousHandledRequestId: number | null;
}): boolean {
  const { locateRequest, hasRenderedTargetRow, previousHandledRequestId } = params;

  return (
    locateRequest != null
    && hasRenderedTargetRow
    && locateRequest.requestId !== previousHandledRequestId
  );
}

export function getVirtualListClassName(tabDisplaySize: TabDisplaySize): string {
  return `virtual-list virtual-list--${tabDisplaySize}`;
}

export function getRowTopWithinContainer(rowNode: HTMLDivElement, scrollContainer: HTMLDivElement): number {
  return rowNode.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
}

export function getActiveRowTopObstruction(rowNode: HTMLDivElement): number {
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

export function getPointerRatio(event: React.DragEvent<HTMLElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.height <= 0) {
    return 0.5;
  }

  return (event.clientY - rect.top) / rect.height;
}
