import { useCallback, useEffect, useMemo, useState } from "react";
import { expandFocusedWindow, resolveCollapsedWindowIdsForTarget } from "../shared/domain/selectors";
import type { TabGroupRecord, TabStoreSnapshot } from "../shared/types";

export function useCollapsedWindows(snapshot: TabStoreSnapshot, onSetGroupCollapsed: (groupId: number, collapsed: boolean) => void) {
  const [collapsedWindowIds, setCollapsedWindowIds] = useState<number[]>([]);
  const groups = useMemo(() => Object.values(snapshot.groupsById), [snapshot.groupsById]);

  useEffect(() => {
    setCollapsedWindowIds((current) => {
      const next = expandFocusedWindow(current, snapshot.focusedWindowId);
      return next === current ? current : [...next];
    });
  }, [snapshot.focusedWindowId]);

  function toggleWindow(windowId: number): void {
    setCollapsedWindowIds((current) =>
      current.includes(windowId)
        ? current.filter((candidateId) => candidateId !== windowId)
        : [...current, windowId]
    );
  }

  function expandWindowPath(windowId: number | null): void {
    setCollapsedWindowIds((current) =>
      resolveCollapsedWindowIdsForTarget({
        collapsedWindowIds: current,
        targetWindowId: windowId
      })
    );
  }

  const setAllGroupsCollapsed = useCallback(
    (collapsed: boolean): void => {
      for (const group of groups) {
        if (group.collapsed === collapsed) {
          continue;
        }
        onSetGroupCollapsed(group.id, collapsed);
      }
    },
    [groups, onSetGroupCollapsed]
  );

  function expandAll(): void {
    setCollapsedWindowIds([]);
    setAllGroupsCollapsed(false);
  }

  function collapseAll(): void {
    setCollapsedWindowIds([...snapshot.windowOrder]);
    setAllGroupsCollapsed(true);
  }

  return {
    collapsedWindowIds,
    groups,
    hasCollapsedWindows: collapsedWindowIds.length > 0,
    hasCollapsedGroups: groups.some((group: TabGroupRecord) => group.collapsed),
    toggleWindow,
    expandWindowPath,
    expandAll,
    collapseAll
  };
}
