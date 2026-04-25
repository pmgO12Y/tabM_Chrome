import { describe, expect, it } from "vitest";
import { resolveBulkToggleToolbarAction } from "../src/sidepanel/toolbarActions";

describe("toolbarActions", () => {
  it("prefers expand when any window is collapsed", () => {
    expect(
      resolveBulkToggleToolbarAction(
        {
          hasCollapsedWindows: true,
          hasCollapsedGroups: false
        },
        "zh-CN"
      )
    ).toEqual({
      mode: "expand",
      label: "全部展开"
    });
  });

  it("prefers expand when any group is collapsed", () => {
    expect(
      resolveBulkToggleToolbarAction(
        {
          hasCollapsedWindows: false,
          hasCollapsedGroups: true
        },
        "zh-CN"
      )
    ).toEqual({
      mode: "expand",
      label: "全部展开"
    });
  });

  it("switches to collapse only when every window and group is expanded", () => {
    expect(
      resolveBulkToggleToolbarAction(
        {
          hasCollapsedWindows: false,
          hasCollapsedGroups: false
        },
        "zh-CN"
      )
    ).toEqual({
      mode: "collapse",
      label: "全部收起"
    });
  });
});
