import { NO_TAB_GROUP_ID } from "../defaults";
import type { TabRecord } from "../types";

export function normalizeChromeTab(tab: chrome.tabs.Tab): TabRecord | null {
  if (tab.id == null || tab.windowId == null || tab.index == null) {
    return null;
  }

  const pageUrl = tab.pendingUrl ?? tab.url ?? "";

  return {
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    groupId: tab.groupId ?? NO_TAB_GROUP_ID,
    title: tab.title?.trim() || "未命名标签页",
    url: pageUrl,
    pinned: Boolean(tab.pinned),
    active: Boolean(tab.active),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded),
    favIconUrl: getSafeFaviconUrl(tab)
  };
}

function getSafeFaviconUrl(tab: chrome.tabs.Tab): string | null {
  const pageUrl = tab.pendingUrl ?? tab.url ?? "";
  const rawFaviconUrl = tab.favIconUrl ?? "";
  if (!rawFaviconUrl) {
    return null;
  }

  try {
    const faviconUrl = new URL(rawFaviconUrl);
    if (isWebPageUrl(pageUrl) && (faviconUrl.protocol === "http:" || faviconUrl.protocol === "https:")) {
      return rawFaviconUrl;
    }

    if (
      faviconUrl.protocol === "chrome:" ||
      faviconUrl.protocol === "chrome-extension:" ||
      faviconUrl.protocol === "data:" ||
      faviconUrl.protocol === "blob:"
    ) {
      return rawFaviconUrl;
    }
  } catch {
    return null;
  }

  return null;
}

function isWebPageUrl(value: string): boolean {
  return /^(https?|file):/i.test(value);
}
