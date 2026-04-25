import { useEffect, useMemo, useRef, useState } from "react";
import type { TabStoreSnapshot } from "../shared/types";
import { reconcileClosingTabIds } from "./closingTabs";

const CLOSE_TAB_ROLLBACK_DELAY_MS = 1400;

export function useClosingTabs(snapshot: TabStoreSnapshot) {
  const [closingTabIds, setClosingTabIds] = useState<number[]>([]);
  const closingRollbackTimersRef = useRef(new Map<number, number>());
  const latestSnapshotRef = useRef(snapshot);
  const latestClosingTabIdsRef = useRef<number[]>([]);

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
  }, [snapshot]);

  const closingTabIdSet = useMemo(() => new Set(closingTabIds), [closingTabIds]);

  useEffect(() => {
    if (closingTabIds.length === 0) {
      return;
    }

    const nextClosingTabIds = reconcileClosingTabIds(closingTabIds, snapshot);
    if (nextClosingTabIds.length === closingTabIds.length) {
      return;
    }

    for (const tabId of closingTabIds) {
      if (nextClosingTabIds.includes(tabId)) {
        continue;
      }

      const timerId = closingRollbackTimersRef.current.get(tabId);
      if (timerId != null) {
        window.clearTimeout(timerId);
        closingRollbackTimersRef.current.delete(tabId);
      }
    }

    setClosingTabIds(nextClosingTabIds);
  }, [closingTabIds, snapshot]);

  useEffect(() => {
    latestClosingTabIdsRef.current = closingTabIds;
  }, [closingTabIds]);

  useEffect(() => {
    return () => {
      for (const timerId of closingRollbackTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      closingRollbackTimersRef.current.clear();
    };
  }, []);

  function startClosing(tabIds: readonly number[]): number[] {
    const currentClosingTabIdSet = new Set(latestClosingTabIdsRef.current);
    const nextClosingTabIds = tabIds.filter((tabId) => !currentClosingTabIdSet.has(tabId));

    if (nextClosingTabIds.length === 0) {
      return [];
    }

    latestClosingTabIdsRef.current = [...latestClosingTabIdsRef.current, ...nextClosingTabIds];
    setClosingTabIds((current) => [...new Set([...current, ...nextClosingTabIds])]);

    for (const tabId of nextClosingTabIds) {
      const existingTimerId = closingRollbackTimersRef.current.get(tabId);
      if (existingTimerId != null) {
        window.clearTimeout(existingTimerId);
      }

      const rollbackTimerId = window.setTimeout(() => {
        closingRollbackTimersRef.current.delete(tabId);
        if (latestSnapshotRef.current.tabsById[tabId]) {
          setClosingTabIds((current) => current.filter((candidateId) => candidateId !== tabId));
        }
      }, CLOSE_TAB_ROLLBACK_DELAY_MS);
      closingRollbackTimersRef.current.set(tabId, rollbackTimerId);
    }

    return nextClosingTabIds;
  }

  return {
    closingTabIds,
    closingTabIdSet,
    startClosing
  };
}
