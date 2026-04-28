import type { TabRecord } from "../types";

export interface DuplicateSelectionResult {
  tabIdsToSelect: number[];
  hasDuplicates: boolean;
}

export function computeDuplicateSelection(
  tabsById: Record<number, TabRecord>,
  windowTabIds: Record<number, number[]>
): DuplicateSelectionResult {
  const tabIds = collectAllTabIds(windowTabIds);
  const urlGroups = groupByUrl(tabIds, tabsById);
  const tabIdsToSelect: number[] = [];

  for (const group of urlGroups) {
    if (group.length < 2) {
      continue;
    }

    const sorted = [...group].sort((a, b) => {
      const diff = tabsById[b].lastAccessed - tabsById[a].lastAccessed;
      if (diff !== 0) {
        return diff;
      }
      return tabsById[b].id - tabsById[a].id;
    });

    for (let index = 1; index < sorted.length; index += 1) {
      tabIdsToSelect.push(sorted[index]);
    }
  }

  return {
    tabIdsToSelect,
    hasDuplicates: tabIdsToSelect.length > 0
  };
}

function collectAllTabIds(windowTabIds: Record<number, number[]>): number[] {
  return Object.values(windowTabIds).flat();
}

function groupByUrl(
  tabIds: number[],
  tabsById: Record<number, TabRecord>
): number[][] {
  const urlToTabIds = new Map<string, number[]>();

  for (const tabId of tabIds) {
    const tab = tabsById[tabId];
    if (!tab || tab.pinned) {
      continue;
    }

    const url = tab.url;
    const existing = urlToTabIds.get(url) ?? [];
    existing.push(tabId);
    urlToTabIds.set(url, existing);
  }

  return Array.from(urlToTabIds.values());
}
