import { useEffect, useMemo, useState } from "react";
import { buildVisibleTabIndex, reconcileVisibleTabSelection, resolveTabPrimaryAction } from "./tabSelection";
import type { PanelRow } from "../shared/types";

export function useTabSelection(
  rows: readonly PanelRow[],
  onTraceEvent?: (event: string, details: Record<string, unknown>) => void
) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [selectionAnchorTabId, setSelectionAnchorTabId] = useState<number | null>(null);

  const visibleTabIndex = useMemo(() => buildVisibleTabIndex(rows), [rows]);
  const visibleTabIds = visibleTabIndex.ids;
  const selectedTabIdSet = useMemo(() => new Set(selectedTabIds), [selectedTabIds]);

  useEffect(() => {
    const nextSelection = reconcileVisibleTabSelection({
      visibleTabIds,
      visibleTabIdSet: visibleTabIndex.idSet,
      selectedTabIds,
      anchorTabId: selectionAnchorTabId
    });

    if (
      nextSelection.selectedTabIds.length === selectedTabIds.length &&
      nextSelection.selectedTabIds.every((tabId, index) => tabId === selectedTabIds[index]) &&
      nextSelection.anchorTabId === selectionAnchorTabId
    ) {
      return;
    }

    setSelectedTabIds(nextSelection.selectedTabIds);
    setSelectionAnchorTabId(nextSelection.anchorTabId);
  }, [selectionAnchorTabId, selectedTabIds, visibleTabIds]);

  function clearSelection(): void {
    if (selectedTabIds.length > 0) {
      onTraceEvent?.("panel/selection-cleared", {
        selectedTabIds,
        selectionAnchorTabId
      });
    }
    setSelectedTabIds([]);
    setSelectionAnchorTabId(null);
  }

  function enterSelectionMode(): void {
    setSelectionMode(true);
  }

  function exitSelectionMode(): void {
    clearSelection();
    setSelectionMode(false);
  }

  function removeFromSelection(tabId: number): void {
    onTraceEvent?.("panel/selection-removed", {
      tabId,
      selectedTabIds,
      selectionAnchorTabId
    });
    setSelectedTabIds((current) => current.filter((candidateId) => candidateId !== tabId));
    setSelectionAnchorTabId((current) => (current === tabId ? null : current));
  }

  function handlePrimaryAction(params: {
    tabId: number;
    shiftKey: boolean;
    toggleKey: boolean;
    onActivate: (tabId: number) => void;
  }): void {
    const { tabId, shiftKey, toggleKey, onActivate } = params;

    onTraceEvent?.("panel/selection-primary-action", {
      tabId,
      shiftKey,
      toggleKey,
      selectionMode,
      selectedTabIds,
      selectionAnchorTabId
    });

    const nextAction = resolveTabPrimaryAction({
      visibleTabIds,
      selectedTabIds,
      anchorTabId: selectionAnchorTabId,
      tabId,
      shiftKey,
      toggleKey,
      selectionMode
    });

    if (nextAction.shouldActivateTab) {
      clearSelection();
      onActivate(tabId);
      return;
    }

    onTraceEvent?.("panel/selection-updated", {
      tabId,
      shiftKey,
      toggleKey,
      selectionMode: nextAction.selectionMode,
      nextSelectedTabIds: nextAction.selectedTabIds,
      nextAnchorTabId: nextAction.anchorTabId
    });

    setSelectionMode(nextAction.selectionMode);
    setSelectedTabIds(nextAction.selectedTabIds);
    setSelectionAnchorTabId(nextAction.anchorTabId);
  }

  return {
    selectionMode,
    selectedTabIds,
    selectedTabIdSet,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    removeFromSelection,
    handlePrimaryAction
  };
}
