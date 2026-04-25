import { describe, expect, it } from "vitest";
import { NO_TAB_GROUP_ID } from "../src/shared/defaults";
import type { PanelRow, TabRecord } from "../src/shared/types";
import {
  buildWindowRenderSections,
  calculateActiveRowScrollAdjustment,
  calculateAnchorScrollAdjustment,
  calculateRequiredBottomSpacer,
  calculateStickyHeaderObstruction,
  canReleaseBottomSpacer,
  getGroupRowClassName,
  getRowShellClassName,
  getStickyScrollStyle,
  getTabRowClassName,
  getWindowRowClassName,
  resolveActiveRowAutoScroll,
  shouldScrollToActiveRow
} from "../src/sidepanel/components/VirtualizedWindowList";
import {
  buildDragCommand,
  createDragSource,
  createSelectedTabsDragSource,
  resolveDropTarget
} from "../src/sidepanel/components/listDrag";

function makeTab(overrides: Partial<TabRecord> = {}): TabRecord {
  return {
    id: overrides.id ?? 1,
    windowId: overrides.windowId ?? 1,
    index: overrides.index ?? 0,
    groupId: overrides.groupId ?? NO_TAB_GROUP_ID,
    title: overrides.title ?? `Tab ${overrides.id ?? 1}`,
    url: overrides.url ?? "https://example.com",
    pinned: overrides.pinned ?? false,
    active: overrides.active ?? false,
    audible: overrides.audible ?? false,
    discarded: overrides.discarded ?? false,
    favIconUrl: overrides.favIconUrl ?? null
  };
}

function makeWindowRow(overrides: Partial<Extract<PanelRow, { kind: "window" }>> = {}): Extract<
  PanelRow,
  { kind: "window" }
> {
  return {
    kind: "window",
    key: overrides.key ?? `window-${overrides.windowId ?? 1}`,
    windowId: overrides.windowId ?? 1,
    title: overrides.title ?? `Window ${overrides.windowId ?? 1}`,
    isFocused: overrides.isFocused ?? false,
    collapsed: overrides.collapsed ?? false,
    totalCount: overrides.totalCount ?? 0,
    firstUnpinnedTabIndex: overrides.firstUnpinnedTabIndex ?? 0
  };
}

function makeGroupRow(overrides: Partial<Extract<PanelRow, { kind: "group" }>> = {}): Extract<
  PanelRow,
  { kind: "group" }
> {
  return {
    kind: "group",
    key: overrides.key ?? `group-${overrides.groupId ?? 10}`,
    windowId: overrides.windowId ?? 1,
    groupId: overrides.groupId ?? 10,
    title: overrides.title ?? `Group ${overrides.groupId ?? 10}`,
    color: overrides.color ?? "blue",
    collapsed: overrides.collapsed ?? false,
    totalCount: overrides.totalCount ?? 2,
    tabIds: overrides.tabIds ?? [101, 102],
    firstTabIndex: overrides.firstTabIndex ?? 0
  };
}

function makeTabRow(overrides: Partial<Extract<PanelRow, { kind: "tab" }>> = {}): Extract<
  PanelRow,
  { kind: "tab" }
> {
  const tab = overrides.tab ?? makeTab();
  return {
    kind: "tab",
    key: overrides.key ?? `tab-${tab.id}`,
    windowId: overrides.windowId ?? tab.windowId,
    tab
  };
}

describe("VirtualizedWindowList helpers", () => {
  it("scrolls to an active row when it first appears", () => {
    expect(
      shouldScrollToActiveRow({
        activeRowKey: "tab-2",
        hasActiveRowInList: true,
        hasRenderedTargetRow: true,
        hasCompletedInitialScroll: false,
        previousScrolledRowKey: null
      })
    ).toBe(true);
  });

  it("does not scroll when the active row is not ready", () => {
    expect(
      shouldScrollToActiveRow({
        activeRowKey: "tab-2",
        hasActiveRowInList: false,
        hasRenderedTargetRow: false,
        hasCompletedInitialScroll: false,
        previousScrolledRowKey: null
      })
    ).toBe(false);
  });

  it("suppresses one auto-scroll pass after a manual collapse", () => {
    expect(
      resolveActiveRowAutoScroll({
        activeRowKey: "tab-2",
        hasActiveRowInList: true,
        hasRenderedTargetRow: true,
        hasCompletedInitialScroll: true,
        previousScrolledRowKey: "tab-2",
        suppressedActiveRowKey: "tab-2"
      })
    ).toEqual({
      shouldScroll: false,
      nextPreviousScrolledRowKey: "tab-2",
      nextSuppressedActiveRowKey: null
    });
  });

  it("scrolls when the active row actually changes", () => {
    expect(
      resolveActiveRowAutoScroll({
        activeRowKey: "tab-3",
        hasActiveRowInList: true,
        hasRenderedTargetRow: true,
        hasCompletedInitialScroll: true,
        previousScrolledRowKey: "tab-2",
        suppressedActiveRowKey: null
      })
    ).toEqual({
      shouldScroll: true,
      nextPreviousScrolledRowKey: "tab-3",
      nextSuppressedActiveRowKey: null
    });
  });

  it("calculates anchor and active-row scroll adjustments", () => {
    expect(
      calculateAnchorScrollAdjustment({
        previousRowTop: 140,
        nextRowTop: 92
      })
    ).toBe(-48);

    expect(
      calculateActiveRowScrollAdjustment({
        rowTop: 8,
        rowBottom: 40,
        containerHeight: 200,
        topObstruction: 24
      })
    ).toBe(-16);

    expect(
      calculateActiveRowScrollAdjustment({
        rowTop: 160,
        rowBottom: 228,
        containerHeight: 200,
        topObstruction: 24
      })
    ).toBe(28);
  });

  it("calculates spacer and sticky obstruction helpers", () => {
    expect(
      calculateRequiredBottomSpacer({
        desiredScrollTop: 260,
        maxScrollTop: 220
      })
    ).toBe(40);

    expect(
      canReleaseBottomSpacer({
        currentScrollTop: 120,
        maxScrollTop: 200,
        bottomSpacerHeight: 60
      })
    ).toBe(true);

    expect(
      calculateStickyHeaderObstruction({
        windowHeaderHeight: 40,
        groupHeaderHeight: 28,
        groupHeaderOverlap: 6
      })
    ).toBe(62);
  });

  it("builds window render sections with grouped child rows", () => {
    const rows: PanelRow[] = [
      makeWindowRow({ windowId: 1, totalCount: 3 }),
      makeGroupRow({ windowId: 1, groupId: 9, tabIds: [91, 92], totalCount: 2, firstTabIndex: 0 }),
      makeTabRow({ tab: makeTab({ id: 91, windowId: 1, index: 0, groupId: 9 }) }),
      makeTabRow({ tab: makeTab({ id: 92, windowId: 1, index: 1, groupId: 9 }) }),
      makeTabRow({ tab: makeTab({ id: 93, windowId: 1, index: 2 }) }),
      makeWindowRow({ windowId: 2, totalCount: 1 }),
      makeTabRow({ tab: makeTab({ id: 201, windowId: 2, index: 0 }) })
    ];

    expect(buildWindowRenderSections(rows)).toEqual([
      {
        windowRow: rows[0],
        items: [
          {
            kind: "group-block",
            groupRow: rows[1],
            childRows: [rows[2], rows[3]]
          },
          {
            kind: "single",
            row: rows[4]
          }
        ]
      },
      {
        windowRow: rows[5],
        items: [
          {
            kind: "single",
            row: rows[6]
          }
        ]
      }
    ]);
  });

  it("builds render sections from rows even when a window or group row is marked collapsed", () => {
    const rows: PanelRow[] = [
      makeWindowRow({ windowId: 1, collapsed: true, totalCount: 2 }),
      makeGroupRow({ windowId: 1, groupId: 9, collapsed: true, tabIds: [91], totalCount: 1, firstTabIndex: 0 }),
      makeTabRow({ tab: makeTab({ id: 91, windowId: 1, index: 0, groupId: 9 }) }),
      makeTabRow({ tab: makeTab({ id: 92, windowId: 1, index: 1 }) })
    ];

    expect(buildWindowRenderSections(rows)).toEqual([
      {
        windowRow: rows[0],
        items: [
          {
            kind: "group-block",
            groupRow: rows[1],
            childRows: [rows[2]]
          },
          {
            kind: "single",
            row: rows[3]
          }
        ]
      }
    ]);
  });

  it("marks window and group rows as visually expanded during search previews", () => {
    expect(getWindowRowClassName({ isFocused: false, visuallyExpanded: true })).toContain(
      "window-row--visually-expanded"
    );
    expect(getGroupRowClassName({ collapsed: true, visuallyExpanded: true })).toContain(
      "group-row--visually-expanded"
    );
    expect(getGroupRowClassName({ collapsed: true, visuallyExpanded: true })).not.toContain(
      "group-row--collapsed"
    );
  });

});

describe("listDrag helpers", () => {
  it("creates drag sources for group and unpinned tab rows", () => {
    expect(createDragSource(makeWindowRow())).toBeNull();
    expect(createDragSource(makeTabRow({ tab: makeTab({ pinned: true }) }))).toBeNull();

    expect(createDragSource(makeGroupRow({ groupId: 5, tabIds: [1, 2] }))).toEqual({
      kind: "group",
      rowKey: "group-5",
      groupId: 5,
      windowId: 1,
      tabIds: [1, 2],
      firstTabIndex: 0,
      title: "Group 5",
      color: "blue",
      collapsed: false
    });

    expect(createDragSource(makeTabRow({ tab: makeTab({ id: 7, index: 3, groupId: 12 }) }))).toEqual({
      kind: "tab",
      rowKey: "tab-7",
      tabId: 7,
      windowId: 1,
      index: 3,
      groupId: 12
    });
  });

  it("creates multi-tab drag sources only for multi-selection without pinned tabs", () => {
    const rows: PanelRow[] = [
      makeTabRow({ tab: makeTab({ id: 1, index: 0 }) }),
      makeTabRow({ tab: makeTab({ id: 2, index: 1 }) }),
      makeTabRow({ tab: makeTab({ id: 3, index: 2, pinned: true }) })
    ];

    expect(
      createSelectedTabsDragSource({
        row: rows[0],
        rows,
        selectedTabIds: new Set([1])
      })
    ).toBeNull();

    expect(
      createSelectedTabsDragSource({
        row: rows[0],
        rows,
        selectedTabIds: new Set([1, 3])
      })
    ).toBeNull();

    expect(
      createSelectedTabsDragSource({
        row: rows[1],
        rows,
        selectedTabIds: new Set([1, 2])
      })
    ).toEqual({
      kind: "tabs",
      rowKey: "tab-2",
      tabIds: [1, 2],
      tabs: [
        { tabId: 1, windowId: 1, index: 0, groupId: null },
        { tabId: 2, windowId: 1, index: 1, groupId: null }
      ]
    });
  });

  it("resolves drop targets for windows, groups, and tabs", () => {
    const tabSource = createDragSource(makeTabRow({ tab: makeTab({ id: 8, index: 2 }) }));
    if (!tabSource) {
      throw new Error("expected tabSource");
    }

    expect(
      resolveDropTarget({
        source: tabSource,
        targetRow: makeWindowRow({ windowId: 2, totalCount: 5, firstUnpinnedTabIndex: 1 }),
        pointerRatio: 0.2
      })
    ).toEqual({
      rowKey: "window-2",
      targetWindowId: 2,
      targetIndex: 1,
      targetGroupId: null,
      indicator: "window-start"
    });

    expect(
      resolveDropTarget({
        source: tabSource,
        targetRow: makeGroupRow({ groupId: 11, windowId: 1, firstTabIndex: 4, tabIds: [21, 22] }),
        pointerRatio: 0.5
      })
    ).toEqual({
      rowKey: "group-11",
      targetWindowId: 1,
      targetIndex: 4,
      targetGroupId: 11,
      indicator: "into-group"
    });

    expect(
      resolveDropTarget({
        source: tabSource,
        targetRow: makeTabRow({ tab: makeTab({ id: 30, index: 6, groupId: 15 }) }),
        pointerRatio: 0.9
      })
    ).toEqual({
      rowKey: "tab-30",
      targetWindowId: 1,
      targetIndex: 7,
      targetGroupId: 15,
      indicator: "after"
    });
  });

  it("prevents invalid drop targets for self-selection and same group", () => {
    expect(
      resolveDropTarget({
        source: {
          kind: "tabs",
          rowKey: "tab-1",
          tabIds: [1, 2],
          tabs: [
            { tabId: 1, windowId: 1, index: 0, groupId: null },
            { tabId: 2, windowId: 1, index: 1, groupId: null }
          ]
        },
        targetRow: makeTabRow({ tab: makeTab({ id: 2, index: 1 }) }),
        pointerRatio: 0.5
      })
    ).toBeNull();

    expect(
      resolveDropTarget({
        source: {
          kind: "group",
          rowKey: "group-5",
          groupId: 5,
          windowId: 1,
          tabIds: [11, 12],
          firstTabIndex: 3,
          title: "G5",
          color: "blue",
          collapsed: false
        },
        targetRow: makeTabRow({ tab: makeTab({ id: 12, index: 4, groupId: 5 }) }),
        pointerRatio: 0.5
      })
    ).toBeNull();
  });

  it("builds drag commands and normalizes intra-window indices", () => {
    expect(
      buildDragCommand({
        source: {
          kind: "tab",
          rowKey: "tab-1",
          tabId: 1,
          windowId: 1,
          index: 2,
          groupId: null
        },
        target: {
          rowKey: "tab-9",
          targetWindowId: 1,
          targetIndex: 5,
          targetGroupId: null,
          indicator: "after"
        }
      })
    ).toEqual({
      type: "tab/move",
      tabId: 1,
      targetWindowId: 1,
      targetIndex: 4,
      targetGroupId: null
    });

    expect(
      buildDragCommand({
        source: {
          kind: "tab",
          rowKey: "tab-1",
          tabId: 1,
          windowId: 1,
          index: 2,
          groupId: null
        },
        target: {
          rowKey: "tab-2",
          targetWindowId: 1,
          targetIndex: 2,
          targetGroupId: null,
          indicator: "before"
        }
      })
    ).toBeNull();
  });

  it("keeps raw targetIndex for multi-tab commands so backend owns normalization", () => {
    expect(
      buildDragCommand({
        source: {
          kind: "tabs",
          rowKey: "tab-2",
          tabIds: [1, 2],
          tabs: [
            { tabId: 1, windowId: 1, index: 0, groupId: null },
            { tabId: 2, windowId: 1, index: 1, groupId: null }
          ]
        },
        target: {
          rowKey: "tab-8",
          targetWindowId: 1,
          targetIndex: 4,
          targetGroupId: null,
          indicator: "before"
        }
      })
    ).toEqual({
      type: "tabs/move",
      tabIds: [1, 2],
      targetWindowId: 1,
      targetIndex: 4,
      targetGroupId: null
    });
  });

  it("builds group move commands without changing cross-window targetIndex", () => {
    expect(
      buildDragCommand({
        source: {
          kind: "tabs",
          rowKey: "tab-2",
          tabIds: [1, 2],
          tabs: [
            { tabId: 1, windowId: 1, index: 0, groupId: null },
            { tabId: 2, windowId: 1, index: 1, groupId: null }
          ]
        },
        target: {
          rowKey: "tab-8",
          targetWindowId: 1,
          targetIndex: 4,
          targetGroupId: null,
          indicator: "before"
        }
      })
    ).toEqual({
      type: "tabs/move",
      tabIds: [1, 2],
      targetWindowId: 1,
      targetIndex: 4,
      targetGroupId: null
    });

    expect(
      buildDragCommand({
        source: {
          kind: "group",
          rowKey: "group-7",
          groupId: 7,
          windowId: 1,
          tabIds: [20, 21],
          firstTabIndex: 3,
          title: "Group 7",
          color: "purple",
          collapsed: true
        },
        target: {
          rowKey: "window-2",
          targetWindowId: 2,
          targetIndex: 1,
          targetGroupId: null,
          indicator: "window-start"
        }
      })
    ).toEqual({
      type: "group/move",
      groupId: 7,
      tabIds: [20, 21],
      targetWindowId: 2,
      targetIndex: 1,
      title: "Group 7",
      color: "purple",
      collapsed: true
    });
  });

  it("clamps pointer ratio for window and tab drop targets", () => {
    const tabSource = createDragSource(makeTabRow({ tab: makeTab({ id: 42, index: 2 }) }));
    if (!tabSource) {
      throw new Error("expected tabSource");
    }

    expect(
      resolveDropTarget({
        source: tabSource,
        targetRow: makeWindowRow({ windowId: 3, totalCount: 6, firstUnpinnedTabIndex: 2 }),
        pointerRatio: Number.NaN
      })
    ).toEqual({
      rowKey: "window-3",
      targetWindowId: 3,
      targetIndex: 6,
      targetGroupId: null,
      indicator: "window-end"
    });

    expect(
      resolveDropTarget({
        source: tabSource,
        targetRow: makeTabRow({ tab: makeTab({ id: 50, index: 5 }) }),
        pointerRatio: -1
      })
    ).toEqual({
      rowKey: "tab-50",
      targetWindowId: 1,
      targetIndex: 5,
      targetGroupId: null,
      indicator: "before"
    });
  });

  it("normalizes same-window group target index and skips no-op group moves", () => {
    expect(
      buildDragCommand({
        source: {
          kind: "group",
          rowKey: "group-9",
          groupId: 9,
          windowId: 1,
          tabIds: [30, 31, 32],
          firstTabIndex: 4,
          title: "Group 9",
          color: "cyan",
          collapsed: false
        },
        target: {
          rowKey: "tab-90",
          targetWindowId: 1,
          targetIndex: 10,
          targetGroupId: null,
          indicator: "after"
        }
      })
    ).toEqual({
      type: "group/move",
      groupId: 9,
      tabIds: [30, 31, 32],
      targetWindowId: 1,
      targetIndex: 7,
      title: "Group 9",
      color: "cyan",
      collapsed: false
    });

    expect(
      buildDragCommand({
        source: {
          kind: "group",
          rowKey: "group-9",
          groupId: 9,
          windowId: 1,
          tabIds: [30, 31, 32],
          firstTabIndex: 4,
          title: "Group 9",
          color: "cyan",
          collapsed: false
        },
        target: {
          rowKey: "tab-91",
          targetWindowId: 1,
          targetIndex: 4,
          targetGroupId: null,
          indicator: "before"
        }
      })
    ).toBeNull();
  });
});
