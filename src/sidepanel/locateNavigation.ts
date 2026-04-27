export type LiveActiveUpdateSource = "bootstrap" | "tabs.onActivated" | "windows.onFocusChanged";

export function resolveAutoLocateFromLiveActiveTab(params: {
  previousActiveTabId: number | null;
  nextActiveTabId: number | null;
  updateSource: LiveActiveUpdateSource | null;
  suppressedTabId: number | null;
  isInteractive: boolean;
}): {
  shouldLocate: boolean;
  nextPreviousActiveTabId: number | null;
  nextSuppressedTabId: number | null;
} {
  const { previousActiveTabId, nextActiveTabId, updateSource, suppressedTabId, isInteractive } = params;

  if (nextActiveTabId == null) {
    return {
      shouldLocate: false,
      nextPreviousActiveTabId: null,
      nextSuppressedTabId: null
    };
  }

  if (nextActiveTabId === previousActiveTabId) {
    return {
      shouldLocate: false,
      nextPreviousActiveTabId: previousActiveTabId,
      nextSuppressedTabId: suppressedTabId
    };
  }

  if (suppressedTabId === nextActiveTabId) {
    return {
      shouldLocate: false,
      nextPreviousActiveTabId: nextActiveTabId,
      nextSuppressedTabId: null
    };
  }

  return {
    shouldLocate: isInteractive && updateSource === "tabs.onActivated",
    nextPreviousActiveTabId: nextActiveTabId,
    nextSuppressedTabId: null
  };
}
