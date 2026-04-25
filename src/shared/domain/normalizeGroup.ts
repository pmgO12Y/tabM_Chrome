import type { TabGroupRecord } from "../types";

export function normalizeChromeTabGroup(group: chrome.tabGroups.TabGroup): TabGroupRecord {
  return {
    id: group.id,
    windowId: group.windowId,
    title: group.title?.trim() ?? "",
    color: group.color,
    collapsed: Boolean(group.collapsed)
  };
}
