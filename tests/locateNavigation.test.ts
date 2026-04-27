import { describe, expect, it } from "vitest";
import { resolveAutoLocateFromLiveActiveTab } from "../src/sidepanel/locateNavigation";

describe("locateNavigation", () => {
  it("auto-locates only for chrome native tab activation", () => {
    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: 1,
        nextActiveTabId: 2,
        updateSource: "tabs.onActivated",
        suppressedTabId: null,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: true,
      nextPreviousActiveTabId: 2,
      nextSuppressedTabId: null
    });
  });

  it("does not auto-locate for bootstrap or window focus changes", () => {
    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: null,
        nextActiveTabId: 2,
        updateSource: "bootstrap",
        suppressedTabId: null,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: false,
      nextPreviousActiveTabId: 2,
      nextSuppressedTabId: null
    });

    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: 2,
        nextActiveTabId: 3,
        updateSource: "windows.onFocusChanged",
        suppressedTabId: null,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: false,
      nextPreviousActiveTabId: 3,
      nextSuppressedTabId: null
    });
  });

  it("does not auto-locate when the change came from sidepanel activation", () => {
    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: 1,
        nextActiveTabId: 2,
        updateSource: "tabs.onActivated",
        suppressedTabId: 2,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: false,
      nextPreviousActiveTabId: 2,
      nextSuppressedTabId: null
    });
  });

  it("clears the suppression immediately after consuming the matching activation", () => {
    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: 1,
        nextActiveTabId: 2,
        updateSource: "tabs.onActivated",
        suppressedTabId: 2,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: false,
      nextPreviousActiveTabId: 2,
      nextSuppressedTabId: null
    });

    expect(
      resolveAutoLocateFromLiveActiveTab({
        previousActiveTabId: 2,
        nextActiveTabId: 3,
        updateSource: "tabs.onActivated",
        suppressedTabId: null,
        isInteractive: true
      })
    ).toEqual({
      shouldLocate: true,
      nextPreviousActiveTabId: 3,
      nextSuppressedTabId: null
    });
  });

});
