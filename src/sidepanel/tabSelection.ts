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

export interface VisibleTabIndex {
  ids: number[];
  idSet: ReadonlySet<number>;
  indexById: ReadonlyMap<number, number>;
}

export function getVisibleTabIds(rows: readonly PanelRow[]): number[] {
  return buildVisibleTabIndex(rows).ids;
}

export function buildVisibleTabIndex(rows: readonly PanelRow[]): VisibleTabIndex {
  const ids = rows.flatMap((row) => (row.kind === "tab" ? [row.tab.id] : []));
  return {
    ids,
    idSet: new Set(ids),
    indexById: new Map(ids.map((tabId, index) => [tabId, index]))
  };
}

export function reconcileVisibleTabSelection(params: {
  visibleTabIds: readonly number[];
  visibleTabIdSet?: ReadonlySet<number>;
  selectedTabIds: readonly number[];
  anchorTabId: number | null;
}): ResolvedTabSelection {
  const { visibleTabIds, selectedTabIds, anchorTabId } = params;
  const visibleTabIdSet = params.visibleTabIdSet ?? new Set(visibleTabIds);
  const selectedTabIdSet = new Set(selectedTabIds);
  const nextSelectedTabIds = visibleTabIds.filter((tabId) => selectedTabIdSet.has(tabId));

  return {
    selectedTabIds: nextSelectedTabIds,
    anchorTabId: anchorTabId != null && visibleTabIdSet.has(anchorTabId) ? anchorTabId : null
  };
}

export function resolveTabSelection(params: ResolveTabSelectionParams): ResolvedTabSelection {
  const { visibleTabIds, selectedTabIds, anchorTabId, tabId, shiftKey, toggleKey } = params;
  const visibleTabIndex = buildVisibleTabIndexFromIds(visibleTabIds);
  const currentSelection = reconcileVisibleTabSelection({
    visibleTabIds,
    visibleTabIdSet: visibleTabIndex.idSet,
    selectedTabIds,
    anchorTabId
  });
  const effectiveAnchorTabId =
    currentSelection.anchorTabId != null && visibleTabIndex.idSet.has(currentSelection.anchorTabId)
      ? currentSelection.anchorTabId
      : tabId;

  if (shiftKey) {
    const shiftAnchorTabId =
      resolveNearestSelectedAnchorTabId({
        visibleTabIds,
        visibleTabIndexById: visibleTabIndex.indexById,
        selectedTabIds: currentSelection.selectedTabIds,
        tabId
      }) ?? effectiveAnchorTabId;
    const rangeTabIds = getSelectionRangeTabIds({
      visibleTabIds,
      visibleTabIndexById: visibleTabIndex.indexById,
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

function buildVisibleTabIndexFromIds(visibleTabIds: readonly number[]): VisibleTabIndex {
  return {
    ids: [...visibleTabIds],
    idSet: new Set(visibleTabIds),
    indexById: new Map(visibleTabIds.map((tabId, index) => [tabId, index]))
  };
}

function resolveNearestSelectedAnchorTabId(params: {
  visibleTabIds: readonly number[];
  visibleTabIndexById: ReadonlyMap<number, number>;
  selectedTabIds: readonly number[];
  tabId: number;
}): number | null {
  const { visibleTabIds, visibleTabIndexById, selectedTabIds, tabId } = params;
  const targetIndex = visibleTabIndexById.get(tabId) ?? -1;

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
  visibleTabIndexById: ReadonlyMap<number, number>;
  startTabId: number;
  endTabId: number;
}): number[] {
  const { visibleTabIds, visibleTabIndexById, startTabId, endTabId } = params;
  const startIndex = visibleTabIndexById.get(startTabId) ?? -1;
  const endIndex = visibleTabIndexById.get(endTabId) ?? -1;

  if (startIndex === -1 || endIndex === -1) {
    return [endTabId];
  }

  const [fromIndex, toIndex] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  return visibleTabIds.slice(fromIndex, toIndex + 1);
}
