import type { BrowserContext, Page } from "@playwright/test";
import type { TabCommand, TabStoreSnapshot } from "../../../src/shared";

export interface SidepanelApi {
  getSnapshot(): Promise<TabStoreSnapshot>;
  dispatchCommand(command: TabCommand): Promise<void>;
  waitForInteractive(): Promise<void>;
  getTraceEntries(): Promise<Array<{
    sequence: number;
    at: string;
    sinceStartMs: number;
    event: string;
    details: Record<string, unknown>;
  }>>;
}

async function getLoadedExtensionId(context: BrowserContext, distDir: string): Promise<string> {
  const serviceWorker =
    context.serviceWorkers().find((worker) => worker.url().startsWith("chrome-extension://")) ??
    (await context.waitForEvent("serviceworker", {
      predicate: (worker) => worker.url().startsWith("chrome-extension://")
    }));

  const serviceWorkerUrl = serviceWorker.url();
  const serviceWorkerMatch = serviceWorkerUrl.match(/chrome-extension:\/\/([^/]+)\//);
  if (serviceWorkerMatch) {
    return serviceWorkerMatch[1];
  }

  const tempPage = await context.newPage();

  try {
    const cdpSession = await context.newCDPSession(tempPage);
    const response = await cdpSession.send("Target.getTargets");

    const extensionTargets = response.targetInfos?.filter(
      (t: { url?: string }) => t.url?.startsWith("chrome-extension://")
    );

    if (extensionTargets && extensionTargets.length > 0) {
      const target = extensionTargets[0];
      if (target.url) {
        const match = target.url.match(/chrome-extension:\/\/([^/]+)\//);
        if (match) {
          return match[1];
        }
      }
    }
  } finally {
    await tempPage.close();
  }

  throw new Error(`Failed to discover loaded extension ID for ${distDir}`);
}

export async function openSidepanelPage(
  context: BrowserContext,
  extPath: string
): Promise<{ page: Page; extensionId: string }> {
  const extensionId = await getLoadedExtensionId(context, extPath);
  const sidepanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;

  const sidepanelPage = await context.newPage();
  await sidepanelPage.goto(sidepanelUrl, { waitUntil: "domcontentloaded", timeout: 10_000 });

  return { page: sidepanelPage, extensionId };
}

export async function connectSidepanelApi(
  sidepanelPage: Page
): Promise<SidepanelApi> {
  await sidepanelPage.waitForFunction(
    () =>
      typeof (window as unknown as { __playwrightApi?: unknown }).__playwrightApi !==
      "undefined",
    { timeout: 15_000 }
  );

  return {
    getSnapshot: () =>
      sidepanelPage.evaluate(() =>
        (window as unknown as { __playwrightApi: SidepanelApi }).__playwrightApi.getSnapshot()
      ),
    dispatchCommand: (cmd: TabCommand) =>
      sidepanelPage.evaluate(
        (command) =>
          (window as unknown as { __playwrightApi: SidepanelApi }).__playwrightApi.dispatchCommand(
            command
          ),
        cmd
      ),
    waitForInteractive: () =>
      sidepanelPage.evaluate(() =>
        (window as unknown as { __playwrightApi: SidepanelApi }).__playwrightApi.waitForInteractive()
      ),
    getTraceEntries: async () => {
      const serviceWorker =
        sidepanelPage.context().serviceWorkers().find((worker) => worker.url().startsWith("chrome-extension://")) ??
        (await sidepanelPage.context().waitForEvent("serviceworker", {
          predicate: (worker) => worker.url().startsWith("chrome-extension://")
        }));

      return serviceWorker.evaluate(() => {
        const scope = globalThis as typeof globalThis & {
          __SIDE_PANEL_TRACE__?: {
            getEntries: () => Array<{
              sequence: number;
              at: string;
              sinceStartMs: number;
              event: string;
              details: Record<string, unknown>;
            }>;
          };
        };
        return scope.__SIDE_PANEL_TRACE__?.getEntries() ?? [];
      });
    }
  };
}
