import { describe, expect, it } from "vitest";
import type { PanelRow } from "../src/shared/types";
import {
  getVisibleTabIds,
  reconcileVisibleTabSelection,
  resolveTabSelection
} from "../src/sidepanel/tabSelection";

describe("tabSelection", () => {
  it("collects only visible tab ids from the current rows", () => {
    const rows: PanelRow[] = [
      {
        kind: "window",
        key: "window-1",
        windowId: 1,
        title: "窗口 1 - A",
        isFocused: true,
        collapsed: false,
        totalCount: 2,
        firstUnpinnedTabIndex: 0
      },
      {
        kind: "group",
        key: "group-66",
        windowId: 1,
        groupId: 66,
        title: "测试组",
        color: "blue",
        collapsed: false,
        totalCount: 1,
        tabIds: [2],
        firstTabIndex: 1
      },
      {
        kind: "tab",
        key: "tab-1",
        windowId: 1,
        tab: {
          id: 1,
          windowId: 1,
          index: 0,
          groupId: -1,
          title: "A",
          url: "https://a.com",
          pinned: false,
          active: true,
          audible: false,
          discarded: false,
          favIconUrl: null
        }
      },
      {
        kind: "tab",
        key: "tab-2",
        windowId: 1,
        tab: {
          id: 2,
          windowId: 1,
          index: 1,
          groupId: 66,
          title: "B",
          url: "https://b.com",
          pinned: false,
          active: false,
          audible: false,
          discarded: false,
          favIconUrl: null
        }
      }
    ];

    expect(getVisibleTabIds(rows)).toEqual([1, 2]);
  });

  it("supports ctrl or cmd toggle selection without activating the tab", () => {
    expect(
      resolveTabSelection({
        visibleTabIds: [1, 2, 3, 4],
        selectedTabIds: [2],
        anchorTabId: 2,
        tabId: 4,
        shiftKey: false,
        toggleKey: true
      })
    ).toEqual({
      selectedTabIds: [2, 4],
      anchorTabId: 4
    });
  });

  it("supports shift range selection across the current visible order", () => {
    expect(
      resolveTabSelection({
        visibleTabIds: [1, 2, 3, 4, 5],
        selectedTabIds: [2],
        anchorTabId: 2,
        tabId: 5,
        shiftKey: true,
        toggleKey: false
      })
    ).toEqual({
      selectedTabIds: [2, 3, 4, 5],
      anchorTabId: 2
    });
  });

  it("supports ctrl/cmd + shift by appending a visible range", () => {
    expect(
      resolveTabSelection({
        visibleTabIds: [1, 2, 3, 4, 5],
        selectedTabIds: [1],
        anchorTabId: 1,
        tabId: 4,
        shiftKey: true,
        toggleKey: true
      })
    ).toEqual({
      selectedTabIds: [1, 2, 3, 4],
      anchorTabId: 1
    });
  });

  it("clears hidden selections and resets a hidden anchor", () => {
    expect(
      reconcileVisibleTabSelection({
        visibleTabIds: [3, 4, 5],
        selectedTabIds: [2, 4, 5],
        anchorTabId: 2
      })
    ).toEqual({
      selectedTabIds: [4, 5],
      anchorTabId: null
    });
  });
});
