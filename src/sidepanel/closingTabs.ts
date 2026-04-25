import type { TabStoreSnapshot } from "../shared/types";

export function reconcileClosingTabIds(
  closingTabIds: readonly number[],
  snapshot: TabStoreSnapshot
): number[] {
  return closingTabIds.filter((tabId) => Boolean(snapshot.tabsById[tabId]));
}
