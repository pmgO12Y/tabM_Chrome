import { describe, expect, it } from "vitest";
import { normalizeChromeTabGroup } from "../src/shared/domain/normalizeGroup";

describe("normalizeGroup", () => {
  it("keeps unnamed group titles blank after trimming", () => {
    expect(
      normalizeChromeTabGroup({
        id: 1,
        windowId: 1,
        title: "",
        color: "blue",
        collapsed: false
      } as chrome.tabGroups.TabGroup).title
    ).toBe("");

    expect(
      normalizeChromeTabGroup({
        id: 2,
        windowId: 1,
        title: "   ",
        color: "red",
        collapsed: true
      } as chrome.tabGroups.TabGroup).title
    ).toBe("");
  });

  it("preserves non-empty group titles", () => {
    expect(
      normalizeChromeTabGroup({
        id: 3,
        windowId: 2,
        title: "工作",
        color: "green",
        collapsed: false
      } as chrome.tabGroups.TabGroup).title
    ).toBe("工作");
  });
});
