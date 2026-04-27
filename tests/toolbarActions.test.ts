import { describe, expect, it } from "vitest";
import { resolveBulkToggleToolbarAction } from "../src/sidepanel/toolbarActions";
import { translate } from "../src/shared/i18n";

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

  it("provides toolbar copy for moving tabs to a new window", () => {
    expect(
      translate("zh-CN", "sidepanel.toolbar.moveToNewWindow", {
        count: 3
      })
    ).toBe("移动到新窗口（3）");
  });

  it("provides hover preview copy for title and url without new keys", () => {
    expect(translate("zh-CN", "sidepanel.toolbar.selectedCount", { count: 2 })).toBe("已选 2 项");
  });
});
