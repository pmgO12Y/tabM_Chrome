import { useEffect, useMemo, useState } from "react";
import { getVisibleTabIds, reconcileVisibleTabSelection, resolveTabSelection } from "./tabSelection";
import type { PanelRow } from "../shared/types";

export function useTabSelection(
  rows: readonly PanelRow[],
  onTraceEvent?: (event: string, details: Record<string, unknown>) => void
) {
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [selectionAnchorTabId, setSelectionAnchorTabId] = useState<number | null>(null);

  const visibleTabIds = useMemo(() => getVisibleTabIds(rows), [rows]);
  const selectedTabIdSet = useMemo(() => new Set(selectedTabIds), [selectedTabIds]);

  useEffect(() => {
    const nextSelection = reconcileVisibleTabSelection({
      visibleTabIds,
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
      selectedTabIds,
      selectionAnchorTabId
    });

    if (!shiftKey && !toggleKey) {
      clearSelection();
      onActivate(tabId);
      return;
    }

    const nextSelection = resolveTabSelection({
      visibleTabIds,
      selectedTabIds,
      anchorTabId: selectionAnchorTabId,
      tabId,
      shiftKey,
      toggleKey
    });
    onTraceEvent?.("panel/selection-updated", {
      tabId,
      shiftKey,
      toggleKey,
      nextSelectedTabIds: nextSelection.selectedTabIds,
      nextAnchorTabId: nextSelection.anchorTabId
    });
    setSelectedTabIds(nextSelection.selectedTabIds);
    setSelectionAnchorTabId(nextSelection.anchorTabId);
  }

  return {
    selectedTabIds,
    selectedTabIdSet,
    clearSelection,
    removeFromSelection,
    handlePrimaryAction
  };
}
