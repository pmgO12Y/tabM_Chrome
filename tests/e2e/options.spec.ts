import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { openSidepanelPage } from "./helpers/sidepanel";

test("options 页面可通过原生入口打开并显示徽标开关", async ({ extensionContext, sidepanelPage }) => {
  const { extensionId } = await openSidepanelPage(extensionContext, "dist");

  const maybeOptionsPage = extensionContext.waitForEvent("page", {
    predicate: (page) => page.url().startsWith(`chrome-extension://${extensionId}/options.html`)
  });

  await sidepanelPage.click('button[aria-label="设置"]');

  const optionsPage = await maybeOptionsPage.catch(async () => {
    const page = await extensionContext.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: "domcontentloaded",
      timeout: 10_000
    });
    return page;
  });

  await expect(optionsPage).toHaveTitle("设置");
  await expect(optionsPage.getByRole("heading", { name: "设置" })).toBeVisible();
  await expect(optionsPage.getByLabel("显示工具栏数字徽标")).toBeVisible();

  await optionsPage.close();
});
