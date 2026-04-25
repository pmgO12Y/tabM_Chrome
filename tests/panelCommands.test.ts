import { describe, expect, it, vi } from "vitest";
import { createPanelCommandActions, panelCommandFactories } from "../src/sidepanel/panelCommands";

describe("panelCommandFactories", () => {
  it("should create scalar tab commands", () => {
    expect(panelCommandFactories.activateTab(7)).toEqual({
      type: "tab/activate",
      tabId: 7
    });

    expect(panelCommandFactories.setTabPinned(8, true)).toEqual({
      type: "tab/set-pinned",
      tabId: 8,
      pinned: true
    });

    expect(panelCommandFactories.closeTab(9)).toEqual({
      type: "tab/close",
      tabId: 9
    });

    expect(panelCommandFactories.setGroupCollapsed(10, false)).toEqual({
      type: "group/set-collapsed",
      groupId: 10,
      collapsed: false
    });
  });

  it("should clone array inputs for bulk commands", () => {
    const closeIds = [1, 2];
    const moveIds = [3, 4];
    const groupIds = [5, 6];
    const newWindowIds = [7, 8];

    const closeCommand = panelCommandFactories.closeTabs(closeIds);
    const moveCommand = panelCommandFactories.moveTabs({
      tabIds: moveIds,
      targetWindowId: 2,
      targetIndex: 5,
      targetGroupId: 11
    });
    const groupCommand = panelCommandFactories.moveGroup({
      groupId: 12,
      tabIds: groupIds,
      targetWindowId: 3,
      targetIndex: 6,
      title: "工作",
      color: "blue",
      collapsed: true
    });
    const newWindowCommand = panelCommandFactories.moveTabsToNewWindow(newWindowIds);

    closeIds.push(99);
    moveIds.push(99);
    groupIds.push(99);
    newWindowIds.push(99);

    expect(closeCommand).toEqual({
      type: "tabs/close",
      tabIds: [1, 2]
    });
    expect(moveCommand).toEqual({
      type: "tabs/move",
      tabIds: [3, 4],
      targetWindowId: 2,
      targetIndex: 5,
      targetGroupId: 11
    });
    expect(groupCommand).toEqual({
      type: "group/move",
      groupId: 12,
      tabIds: [5, 6],
      targetWindowId: 3,
      targetIndex: 6,
      title: "工作",
      color: "blue",
      collapsed: true
    });
    expect(newWindowCommand).toEqual({
      type: "tabs/move-to-new-window",
      tabIds: [7, 8]
    });
  });

  it("should create moveTab command", () => {
    expect(
      panelCommandFactories.moveTab({
        tabId: 5,
        targetWindowId: 2,
        targetIndex: 4,
        targetGroupId: null
      })
    ).toEqual({
      type: "tab/move",
      tabId: 5,
      targetWindowId: 2,
      targetIndex: 4,
      targetGroupId: null
    });
  });
});

describe("createPanelCommandActions", () => {
  it("should dispatch each generated command", () => {
    const dispatchCommand = vi.fn();
    const actions = createPanelCommandActions(dispatchCommand);

    actions.activateTab(1);
    actions.setTabPinned(2, false);
    actions.closeTab(3);
    actions.closeTabs([4, 5]);
    actions.setGroupCollapsed(6, true);
    actions.moveTab({
      tabId: 7,
      targetWindowId: 2,
      targetIndex: 3,
      targetGroupId: 9
    });
    actions.moveTabs({
      tabIds: [8, 9],
      targetWindowId: 3,
      targetIndex: 4,
      targetGroupId: null
    });
    actions.moveGroup({
      groupId: 10,
      tabIds: [11, 12],
      targetWindowId: 4,
      targetIndex: 5,
      title: "Group 10",
      color: "purple",
      collapsed: false
    });
    actions.moveTabsToNewWindow([13, 14]);

    expect(dispatchCommand.mock.calls).toEqual([
      [{ type: "tab/activate", tabId: 1 }],
      [{ type: "tab/set-pinned", tabId: 2, pinned: false }],
      [{ type: "tab/close", tabId: 3 }],
      [{ type: "tabs/close", tabIds: [4, 5] }],
      [{ type: "group/set-collapsed", groupId: 6, collapsed: true }],
      [{ type: "tab/move", tabId: 7, targetWindowId: 2, targetIndex: 3, targetGroupId: 9 }],
      [{ type: "tabs/move", tabIds: [8, 9], targetWindowId: 3, targetIndex: 4, targetGroupId: null }],
      [{
        type: "group/move",
        groupId: 10,
        tabIds: [11, 12],
        targetWindowId: 4,
        targetIndex: 5,
        title: "Group 10",
        color: "purple",
        collapsed: false
      }],
      [{ type: "tabs/move-to-new-window", tabIds: [13, 14] }]
    ]);
  });
});
