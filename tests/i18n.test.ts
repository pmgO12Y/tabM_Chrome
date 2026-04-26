import { describe, expect, it } from "vitest";
import {
  formatWindowTitle,
  getDisplayTabTitle,
  getUntitledTabTitle,
  resolveLocale,
  resolveSystemLocale,
  translate
} from "../src/shared/i18n";
import { DEFAULT_EXTENSION_SETTINGS } from "../src/shared/settings";

describe("i18n", () => {
  it("maps any zh locale to zh-CN", () => {
    expect(resolveSystemLocale("zh")).toBe("zh-CN");
    expect(resolveSystemLocale("zh-TW")).toBe("zh-CN");
    expect(resolveSystemLocale("zh-HK")).toBe("zh-CN");
    expect(resolveSystemLocale("zh-CN")).toBe("zh-CN");
  });

  it("maps non-zh locales to en", () => {
    expect(resolveSystemLocale("en")).toBe("en");
    expect(resolveSystemLocale("en-US")).toBe("en");
    expect(resolveSystemLocale("ja-JP")).toBe("en");
  });

  it("resolves system mode from the UI language", () => {
    expect(
      resolveLocale({
        settings: DEFAULT_EXTENSION_SETTINGS,
        uiLanguage: "zh-TW"
      })
    ).toBe("zh-CN");
  });

  it("falls back to english when a key is translated in english", () => {
    expect(translate("zh-CN", "sidepanel.toolbar.settings")).toBe("设置");
    expect(translate("en", "sidepanel.toolbar.settings")).toBe("Settings");
  });

  it("normalizes untitled tab labels to the active locale", () => {
    expect(getUntitledTabTitle("zh-CN")).toBe("未命名标签页");
    expect(getUntitledTabTitle("en")).toBe("Untitled tab");
    expect(getDisplayTabTitle("未命名标签页", "en")).toBe("Untitled tab");
    expect(getDisplayTabTitle("Untitled tab", "zh-CN")).toBe("未命名标签页");
  });

  it("exposes locate-current-page toolbar labels in both locales", () => {
    expect(translate("zh-CN", "sidepanel.toolbar.locateCurrentPage")).toBe("定位到当前页面");
    expect(translate("en", "sidepanel.toolbar.locateCurrentPage")).toBe("Locate current page");
    expect(translate("zh-CN", "sidepanel.toolbar.locateCurrentPageUnavailable")).toBe("当前页面不在侧边栏快照中");
    expect(translate("en", "sidepanel.toolbar.locateCurrentPageUnavailable")).toBe("Current page is not in the side panel snapshot");
  });
});
