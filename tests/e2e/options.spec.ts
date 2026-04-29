import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { openSidepanelPage } from "./helpers/sidepanel";

test("options 页面切换到 English 后立即影响侧边栏", async ({ extensionContext, sidepanelPage }) => {
  const { extensionId } = await openSidepanelPage(extensionContext, "dist");

  const optionsPage = await extensionContext.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: "domcontentloaded",
    timeout: 10_000
  });

  await optionsPage.selectOption("#locale-mode", "en");
  await expect(optionsPage).toHaveTitle("Settings");
  await expect(optionsPage.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(optionsPage.getByLabel("Show number badge on the toolbar icon")).toBeVisible();
  await expect(optionsPage.getByLabel("Show hovered tab preview")).toBeVisible();
  await expect(optionsPage.getByLabel("Enable verbose trace")).toBeVisible();
  await expect(optionsPage.getByRole("button", { name: "Export trace" })).toBeVisible();
  await expect(optionsPage.getByRole("button", { name: "Clear trace" })).toBeVisible();

  await sidepanelPage.reload({ waitUntil: "domcontentloaded" });
  await expect(sidepanelPage.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(sidepanelPage.getByRole("button", { name: "Verbose trace: off" })).toHaveCount(0);
  await expect(sidepanelPage.getByRole("button", { name: "Export trace" })).toHaveCount(0);
  await expect(sidepanelPage.getByRole("button", { name: "Clear trace" })).toHaveCount(0);
  await expect(sidepanelPage.getByLabel("Search tabs")).toBeVisible();

  await optionsPage.close();
});

test("开启悬浮标签预览后侧边栏顶部显示标题和 URL，关闭后隐藏", async ({ extensionContext, sidepanelPage }) => {
  const { extensionId } = await openSidepanelPage(extensionContext, "dist");

  const optionsPage = await extensionContext.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: "domcontentloaded",
    timeout: 10_000
  });

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const targetTitle = `hover-setting-${uniqueSuffix}`;
  const targetTab = await extensionContext.newPage();
  await targetTab.goto(`data:text/html,<title>${targetTitle}</title><body>${targetTitle}</body>`);
  await targetTab.waitForLoadState("load");

  await sidepanelPage.reload({ waitUntil: "domcontentloaded" });
  await sidepanelPage.bringToFront();

  const tabRow = sidepanelPage.locator(".tab-row__main", {
    has: sidepanelPage.locator(".tab-row__title", { hasText: targetTitle })
  }).first();
  const hoveredPreview = sidepanelPage.locator(".panel-toolbar__hovered-tab");

  await expect(tabRow).toBeVisible();
  await tabRow.hover();
  await expect(hoveredPreview).toHaveCount(0);

  await optionsPage.getByLabel("Show hovered tab preview").check();

  await sidepanelPage.reload({ waitUntil: "domcontentloaded" });
  await sidepanelPage.bringToFront();
  await tabRow.hover();
  await expect(hoveredPreview).toContainText(targetTitle);

  await optionsPage.bringToFront();
  await optionsPage.getByLabel("Show hovered tab preview").uncheck();

  await sidepanelPage.reload({ waitUntil: "domcontentloaded" });
  await expect(hoveredPreview).toHaveCount(0);

  await sidepanelPage.bringToFront();
  await tabRow.hover();
  await expect(hoveredPreview).toHaveCount(0);

  await optionsPage.close();
});
