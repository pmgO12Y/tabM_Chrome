import { readFileSync } from "node:fs";
import { chromium, test as base, type BrowserContext, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  connectSidepanelApi,
  openSidepanelPage,
  type SidepanelApi
} from "./helpers/sidepanel";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(resolve(rootDir, "..", "..", "package.json"), "utf8")
) as {
  version: string;
};
const distDir = resolve(rootDir, "..", "..", `release/v${packageJson.version}/dist`);

export type E2eFixture = {
  extensionContext: BrowserContext;
  sidepanelPage: Page;
  sidepanelApi: SidepanelApi;
};

export const test = base.extend<E2eFixture>({
  extensionContext: async ({}, use) => {
    const userDataDir = await mkdtemp(resolve(tmpdir(), "sidepanel-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: "chromium",
      headless: false,
      viewport: { width: 400, height: 800 },
      args: [
        `--disable-extensions-except=${distDir}`,
        `--load-extension=${distDir}`
      ]
    });

    try {
      await use(context);
    } finally {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    }
  },

  sidepanelPage: async ({ extensionContext }, use) => {
    const { page } = await openSidepanelPage(extensionContext, distDir);
    await use(page);
    await page.close();
  },

  sidepanelApi: async ({ sidepanelPage }, use) => {
    const api = await connectSidepanelApi(sidepanelPage);
    await use(api);
  }
});
