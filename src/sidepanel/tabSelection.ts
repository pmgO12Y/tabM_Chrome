import type { PanelRow } from "../shared/types";

export interface ResolvedTabSelection {
  selectedTabIds: number[];
  anchorTabId: number | null;
}

export interface ResolveTabSelectionParams {
  visibleTabIds: readonly number[];
  selectedTabIds: readonly number[];
  anchorTabId: number | null;
  tabId: number;
  shiftKey: boolean;
  toggleKey: boolean;
}

export interface ResolveTabPrimaryActionParams extends ResolveTabSelectionParams {
  selectionMode: boolean;
}

export interface ResolvedTabPrimaryAction extends ResolvedTabSelection {
  selectionMode: boolean;
  shouldActivateTab: boolean;
}

export function getVisibleTabIds(rows: readonly PanelRow[]): number[] {
  return rows.flatMap((row) => (row.kind === "tab" ? [row.tab.id] : []));
}

export function reconcileVisibleTabSelection(params: {
  visibleTabIds: readonly number[];
  selectedTabIds: readonly number[];
  anchorTabId: number | null;
}): ResolvedTabSelection {
  const { visibleTabIds, selectedTabIds, anchorTabId } = params;
  const visibleTabIdSet = new Set(visibleTabIds);
  const selectedTabIdSet = new Set(selectedTabIds);
  const nextSelectedTabIds = visibleTabIds.filter((tabId) => selectedTabIdSet.has(tabId));

  return {
    selectedTabIds: nextSelectedTabIds,
    anchorTabId: anchorTabId != null && visibleTabIdSet.has(anchorTabId) ? anchorTabId : null
  };
}

export function resolveTabSelection(params: ResolveTabSelectionParams): ResolvedTabSelection {
  const { visibleTabIds, selectedTabIds, anchorTabId, tabId, shiftKey, toggleKey } = params;
  const visibleTabIdSet = new Set(visibleTabIds);
  const currentSelection = reconcileVisibleTabSelection({
    visibleTabIds,
    selectedTabIds,
    anchorTabId
  });
  const effectiveAnchorTabId =
    currentSelection.anchorTabId != null && visibleTabIdSet.has(currentSelection.anchorTabId)
      ? currentSelection.anchorTabId
      : tabId;

  if (shiftKey) {
    const shiftAnchorTabId =
      resolveNearestSelectedAnchorTabId({
        visibleTabIds,
        selectedTabIds: currentSelection.selectedTabIds,
        tabId
      }) ?? effectiveAnchorTabId;
    const rangeTabIds = getSelectionRangeTabIds({
      visibleTabIds,
      startTabId: shiftAnchorTabId,
      endTabId: tabId
    });
    const nextSelectedTabIdSet = new Set([...currentSelection.selectedTabIds, ...rangeTabIds]);

    return {
      selectedTabIds: visibleTabIds.filter((candidateTabId) => nextSelectedTabIdSet.has(candidateTabId)),
      anchorTabId: shiftAnchorTabId
    };
  }

  if (!toggleKey) {
    return {
      selectedTabIds: [],
      anchorTabId: null
    };
  }

  const nextSelectedTabIdSet = new Set(currentSelection.selectedTabIds);
  if (nextSelectedTabIdSet.has(tabId)) {
    nextSelectedTabIdSet.delete(tabId);
  } else {
    nextSelectedTabIdSet.add(tabId);
  }

  const nextSelectedTabIds = visibleTabIds.filter((candidateTabId) => nextSelectedTabIdSet.has(candidateTabId));

  return {
    selectedTabIds: nextSelectedTabIds,
    anchorTabId: nextSelectedTabIds.length > 0 ? tabId : null
  };
}

export function resolveTabPrimaryAction(params: ResolveTabPrimaryActionParams): ResolvedTabPrimaryAction {
  const { selectionMode, shiftKey, toggleKey, ...selectionParams } = params;

  if (!selectionMode && !shiftKey && !toggleKey) {
    return {
      selectedTabIds: [],
      anchorTabId: null,
      selectionMode: false,
      shouldActivateTab: true
    };
  }

  const nextSelection = resolveTabSelection({
    ...selectionParams,
    shiftKey,
    toggleKey: selectionMode ? !shiftKey || toggleKey : toggleKey || !shiftKey
  });

  return {
    ...nextSelection,
    selectionMode: true,
    shouldActivateTab: false
  };
}

function resolveNearestSelectedAnchorTabId(params: {
  visibleTabIds: readonly number[];
  selectedTabIds: readonly number[];
  tabId: number;
}): number | null {
  const { visibleTabIds, selectedTabIds, tabId } = params;
  const targetIndex = visibleTabIds.indexOf(tabId);

  if (targetIndex === -1 || selectedTabIds.length === 0) {
    return null;
  }

  const selectedTabIdSet = new Set(selectedTabIds);

  return visibleTabIds.reduce<{ tabId: number; distance: number } | null>((closest, candidateTabId, index) => {
    if (!selectedTabIdSet.has(candidateTabId) || candidateTabId === tabId) {
      return closest;
    }

    const distance = Math.abs(index - targetIndex);
    if (closest == null || distance < closest.distance) {
      return {
        tabId: candidateTabId,
        distance
      };
    }

    return closest;
  }, null)?.tabId ?? null;
}

function getSelectionRangeTabIds(params: {
  visibleTabIds: readonly number[];
  startTabId: number;
  endTabId: number;
}): number[] {
  const { visibleTabIds, startTabId, endTabId } = params;
  const startIndex = visibleTabIds.indexOf(startTabId);
  const endIndex = visibleTabIds.indexOf(endTabId);

  if (startIndex === -1 || endIndex === -1) {
    return [endTabId];
  }

  const [fromIndex, toIndex] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  return visibleTabIds.slice(fromIndex, toIndex + 1);
}
