import type { TabCommand } from "../shared/types";

type PanelCommandDispatcher = (command: TabCommand) => void;
type MoveTabCommandInput = Omit<Extract<TabCommand, { type: "tab/move" }>, "type">;
type MoveTabsCommandInput = Omit<Extract<TabCommand, { type: "tabs/move" }>, "type">;
type MoveGroupCommandInput = Omit<Extract<TabCommand, { type: "group/move" }>, "type">;

export const panelCommandFactories = {
  activateTab(tabId: number): TabCommand {
    return {
      type: "tab/activate",
      tabId
    };
  },
  setTabPinned(tabId: number, pinned: boolean): TabCommand {
    return {
      type: "tab/set-pinned",
      tabId,
      pinned
    };
  },
  closeTab(tabId: number): TabCommand {
    return {
      type: "tab/close",
      tabId
    };
  },
  closeTabs(tabIds: readonly number[]): TabCommand {
    return {
      type: "tabs/close",
      tabIds: [...tabIds]
    };
  },
  setGroupCollapsed(groupId: number, collapsed: boolean): TabCommand {
    return {
      type: "group/set-collapsed",
      groupId,
      collapsed
    };
  },
  moveTab(command: MoveTabCommandInput): TabCommand {
    return {
      type: "tab/move",
      tabId: command.tabId,
      targetWindowId: command.targetWindowId,
      targetIndex: command.targetIndex,
      targetGroupId: command.targetGroupId
    };
  },
  moveTabs(command: MoveTabsCommandInput): TabCommand {
    return {
      type: "tabs/move",
      tabIds: [...command.tabIds],
      targetWindowId: command.targetWindowId,
      targetIndex: command.targetIndex,
      targetGroupId: command.targetGroupId
    };
  },
  moveGroup(command: MoveGroupCommandInput): TabCommand {
    return {
      type: "group/move",
      groupId: command.groupId,
      tabIds: [...command.tabIds],
      targetWindowId: command.targetWindowId,
      targetIndex: command.targetIndex,
      title: command.title,
      color: command.color,
      collapsed: command.collapsed
    };
  },
  moveTabsToNewWindow(tabIds: readonly number[]): TabCommand {
    return {
      type: "tabs/move-to-new-window",
      tabIds: [...tabIds]
    };
  }
};

function createDispatchingAction<Args extends unknown[]>(
  dispatchCommand: PanelCommandDispatcher,
  createCommand: (...args: Args) => TabCommand
): (...args: Args) => void {
  return (...args) => {
    dispatchCommand(createCommand(...args));
  };
}

export function createPanelCommandActions(dispatchCommand: PanelCommandDispatcher) {
  return {
    activateTab: createDispatchingAction(dispatchCommand, panelCommandFactories.activateTab),
    setTabPinned: createDispatchingAction(dispatchCommand, panelCommandFactories.setTabPinned),
    closeTab: createDispatchingAction(dispatchCommand, panelCommandFactories.closeTab),
    closeTabs: createDispatchingAction(dispatchCommand, panelCommandFactories.closeTabs),
    setGroupCollapsed: createDispatchingAction(dispatchCommand, panelCommandFactories.setGroupCollapsed),
    moveTab: createDispatchingAction(dispatchCommand, panelCommandFactories.moveTab),
    moveTabs: createDispatchingAction(dispatchCommand, panelCommandFactories.moveTabs),
    moveGroup: createDispatchingAction(dispatchCommand, panelCommandFactories.moveGroup),
    moveTabsToNewWindow: createDispatchingAction(dispatchCommand, panelCommandFactories.moveTabsToNewWindow)
  };
}
