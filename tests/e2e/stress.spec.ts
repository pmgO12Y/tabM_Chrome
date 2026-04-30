import { expect } from "@playwright/test";
import type { SidepanelApi } from "./helpers/sidepanel";
import { test } from "./fixtures";

type Snapshot = Awaited<ReturnType<SidepanelApi["getSnapshot"]>>;

async function waitForSnapshot(
  sidepanelApi: SidepanelApi,
  predicate: (snapshot: Snapshot) => boolean,
  timeout = 30_000
) {
  await expect
    .poll(async () => {
      const snapshot = await sidepanelApi.getSnapshot();
      return predicate(snapshot);
    }, { timeout })
    .toBe(true);
}

function getSnapshotTabs(snapshot: Snapshot): Array<{ id: number; url?: string; title?: string; pinned?: boolean; windowId: number; index: number; active?: boolean }> {
  return Object.values(snapshot.tabsById) as Array<{ id: number; url?: string; title?: string; pinned?: boolean; windowId: number; index: number; active?: boolean }>;
}

function createLocalPageUrl(slug: string): string {
  const title = `page-${slug}`;
  return `data:text/html,<title>${title}</title><body>${title}</body>`;
}

// ---------------------------------------------------------------------------
// S1：批量创建标签
// ---------------------------------------------------------------------------

test("压力测试：批量创建 30 个标签后全部出现在快照中", async ({ extensionContext, sidepanelApi }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const count = 30;

  for (let i = 0; i < count; i++) {
    const tab = await extensionContext.newPage();
    await tab.goto(createLocalPageUrl(`stress-bulk-${uniqueSuffix}-${i}`));
    await tab.waitForLoadState("load");
  }

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-bulk-${uniqueSuffix}`)).length >= count,
    60_000
  );

  const snapshot = await sidepanelApi.getSnapshot();
  const stressTabs = getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-bulk-${uniqueSuffix}`));
  expect(stressTabs.length).toBe(count);
  for (const tab of stressTabs) {
    expect(tab.windowId).toBeGreaterThan(0);
  }
});

// ---------------------------------------------------------------------------
// S2：批量关闭标签
// ---------------------------------------------------------------------------

test("压力测试：批量关闭 20 个标签后快照中全部移除", async ({ extensionContext, sidepanelApi }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const count = 20;

  for (let i = 0; i < count; i++) {
    const tab = await extensionContext.newPage();
    await tab.goto(createLocalPageUrl(`stress-close-${uniqueSuffix}-${i}`));
    await tab.waitForLoadState("load");
  }

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-close-${uniqueSuffix}`)).length >= count,
    60_000
  );

  // Get tab IDs and close rapidly
  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabIdsToClose = getSnapshotTabs(beforeSnapshot)
    .filter((t) => t.url?.includes(`stress-close-${uniqueSuffix}`))
    .map((t) => t.id);

  for (const tabId of tabIdsToClose) {
    await sidepanelApi.dispatchCommand({ type: "tab/close", tabId });
  }

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-close-${uniqueSuffix}`)).length === 0,
    60_000
  );
});

// ---------------------------------------------------------------------------
// S3：反复折叠展开窗口
// ---------------------------------------------------------------------------

test("压力测试：反复折叠/展开窗口 20 次后状态一致", async ({ extensionContext, sidepanelPage, sidepanelApi }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create 3 tabs then move 1 to a new window (to have 2 windows)
  for (let i = 0; i < 3; i++) {
    const tab = await extensionContext.newPage();
    await tab.goto(createLocalPageUrl(`stress-fold-${uniqueSuffix}-${i}`));
    await tab.waitForLoadState("load");
  }

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-fold-${uniqueSuffix}`)).length >= 3
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabToMove = getSnapshotTabs(beforeSnapshot).find((t) => t.url?.includes(`stress-fold-${uniqueSuffix}-0`));
  expect(tabToMove).toBeDefined();

  await sidepanelApi.dispatchCommand({
    type: "tabs/move-to-new-window",
    tabIds: [tabToMove!.id]
  });
  await waitForSnapshot(sidepanelApi, (snapshot) => snapshot.windowOrder.length >= 2);

  await sidepanelPage.bringToFront();
  const windowRows = sidepanelPage.locator("button.window-row");

  for (let i = 0; i < 20; i++) {
    const rowCount = await windowRows.count();
    for (let w = 0; w < rowCount; w++) {
      await windowRows.nth(w).click();
    }
  }

  const afterSnapshot = await sidepanelApi.getSnapshot();
  expect(afterSnapshot.windowOrder.length).toBeGreaterThanOrEqual(2);
});

// ---------------------------------------------------------------------------
// S4：连续派发命令
// ---------------------------------------------------------------------------

test("压力测试：连续派发 50 个命令后无崩溃", async ({ extensionContext, sidepanelApi }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const count = 10;

  for (let i = 0; i < count; i++) {
    const tab = await extensionContext.newPage();
    await tab.goto(createLocalPageUrl(`stress-cmd-${uniqueSuffix}-${i}`));
    await tab.waitForLoadState("load");
  }

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      getSnapshotTabs(snapshot).filter((t) => t.url?.includes(`stress-cmd-${uniqueSuffix}`)).length >= count
  );

  const snapshot = await sidepanelApi.getSnapshot();
  const tabIds = getSnapshotTabs(snapshot)
    .filter((t) => t.url?.includes(`stress-cmd-${uniqueSuffix}`))
    .map((t) => t.id);

  let closeCount = 0;
  const maxClose = 5;
  for (let i = 0; i < 50; i++) {
    if (i % 2 === 0) {
      await sidepanelApi.dispatchCommand({ type: "tab/activate", tabId: tabIds[i % tabIds.length] });
    } else if (closeCount < maxClose) {
      await sidepanelApi.dispatchCommand({ type: "tab/close", tabId: tabIds[closeCount] });
      closeCount++;
    } else {
      await sidepanelApi.dispatchCommand({ type: "tab/activate", tabId: tabIds[(i + 1) % tabIds.length] });
    }
  }

  const afterSnapshot = await sidepanelApi.getSnapshot();
  expect(afterSnapshot.version).toBeGreaterThan(0);
});
