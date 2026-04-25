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

  await sidepanelPage.reload({ waitUntil: "domcontentloaded" });
  await expect(sidepanelPage.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(sidepanelPage.getByLabel("Search tabs")).toBeVisible();

  await optionsPage.close();
});
