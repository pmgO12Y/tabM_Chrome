import { expect } from "@playwright/test";
import type { TabRecord } from "../../src/shared";
import { openSidepanelPage, type SidepanelApi } from "./helpers/sidepanel";
import { test } from "./fixtures";

type Snapshot = Awaited<ReturnType<SidepanelApi["getSnapshot"]>>;

async function waitForSnapshot(
  sidepanelApi: SidepanelApi,
  predicate: (snapshot: Snapshot) => boolean
) {
  await expect
    .poll(async () => {
      const snapshot = await sidepanelApi.getSnapshot();
      return predicate(snapshot);
    })
    .toBe(true);
}

function countTabsByWindow(snapshot: Snapshot): Map<number, number> {
  return new Map(
    Object.entries(snapshot.windowTabIds).map(([windowId, tabIds]) => [Number(windowId), tabIds.length])
  );
}

function getSnapshotTabs(snapshot: Snapshot): TabRecord[] {
  return Object.values(snapshot.tabsById) as TabRecord[];
}

function createLocalPageUrl(slug: string): string {
  const title = `page-${slug}`;
  return `data:text/html,<title>${title}</title><body>${title}</body>`;
}

// ---------------------------------------------------------------------------
// 测试用例
// ---------------------------------------------------------------------------

test("sidepanel 加载后显示标签", async ({ extensionContext, sidepanelApi }) => {
  const tab1 = await extensionContext.newPage();
  const tab2 = await extensionContext.newPage();
  await tab1.goto(createLocalPageUrl("example-com"));
  await tab2.goto(createLocalPageUrl("example-org"));
  await tab1.waitForLoadState("load");
  await tab2.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      getSnapshotTabs(snapshot).filter(
        (tab) => tab.url?.includes("page-example-com") || tab.url?.includes("page-example-org")
      ).length >= 2
  );

  const snapshot = await sidepanelApi.getSnapshot();
  expect(snapshot.version).toBeGreaterThan(0);
  expect(snapshot.tabsById).toBeDefined();

  const tabIds = Object.keys(snapshot.tabsById).map(Number);
  expect(tabIds.length).toBeGreaterThanOrEqual(2);
});

test("激活标签后侧边栏状态更新", async ({ extensionContext, sidepanelApi }) => {
  const tab1 = await extensionContext.newPage();
  const tab2 = await extensionContext.newPage();
  await tab1.goto(createLocalPageUrl("example-com"));
  await tab2.goto(createLocalPageUrl("example-org"));
  await tab1.waitForLoadState("load");
  await tab2.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => getSnapshotTabs(snapshot).some((t) => t.url?.includes("page-example-com"))
  );

  const snapshot1 = await sidepanelApi.getSnapshot();
  const tab1Record = getSnapshotTabs(snapshot1).find(
    (t) => t.url?.includes("page-example-com")
  );
  expect(tab1Record).toBeDefined();

  await sidepanelApi.dispatchCommand({
    type: "tab/activate",
    tabId: tab1Record!.id
  });

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => snapshot.tabsById[tab1Record!.id]?.active === true
  );

  const snapshot2 = await sidepanelApi.getSnapshot();
  const tab1After = snapshot2.tabsById[tab1Record!.id];
  expect(tab1After?.active).toBe(true);
});

test("关闭标签后从列表中移除", async ({ extensionContext, sidepanelApi }) => {
  const tabToClose = await extensionContext.newPage();
  await tabToClose.goto(createLocalPageUrl("close-me"));
  await tabToClose.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => Object.values(snapshot.tabsById).some((t) => t.url?.includes("page-close-me"))
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabToCloseRecord = getSnapshotTabs(beforeSnapshot).find(
    (t) => t.url?.includes("page-close-me")
  );
  expect(tabToCloseRecord).toBeDefined();

  await Promise.all([
    tabToClose.waitForEvent("close").catch(() => {}),
    sidepanelApi.dispatchCommand({
      type: "tab/close",
      tabId: tabToCloseRecord!.id
    })
  ]);

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => snapshot.tabsById[tabToCloseRecord!.id] == null
  );

  const afterSnapshot = await sidepanelApi.getSnapshot();
  expect(afterSnapshot.tabsById[tabToCloseRecord!.id]).toBeUndefined();
});

test("移动到新窗口后立即出现在侧边栏窗口列表中", async ({ extensionContext, sidepanelApi }) => {
  const tabToMove = await extensionContext.newPage();
  const companionTab = await extensionContext.newPage();
  await tabToMove.goto(createLocalPageUrl("move-me"));
  await companionTab.goto(createLocalPageUrl("stay-put"));
  await tabToMove.waitForLoadState("load");
  await companionTab.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => Object.values(snapshot.tabsById).some((t) => t.url?.includes("page-move-me"))
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabRecord = getSnapshotTabs(beforeSnapshot).find(
    (t) => t.url?.includes("page-move-me")
  );
  expect(tabRecord).toBeDefined();

  const originalWindowId = tabRecord!.windowId;

  await sidepanelApi.dispatchCommand({
    type: "tabs/move-to-new-window",
    tabIds: [tabRecord!.id]
  });

  await waitForSnapshot(sidepanelApi, (snapshot) => {
    const movedTab = snapshot.tabsById[tabRecord!.id];
    return (
      movedTab != null &&
      movedTab.windowId !== originalWindowId &&
      snapshot.windowOrder.includes(movedTab.windowId) &&
      snapshot.windowTabIds[movedTab.windowId]?.includes(tabRecord!.id) === true
    );
  });

  const afterSnapshot = await sidepanelApi.getSnapshot();
  const movedTab = afterSnapshot.tabsById[tabRecord!.id];
  expect(movedTab).toBeDefined();
  expect(movedTab.windowId).not.toBe(originalWindowId);
  expect(afterSnapshot.windowOrder).toContain(movedTab.windowId);
  expect(afterSnapshot.windowTabIds[movedTab.windowId]).toContain(tabRecord!.id);
});

test("批量移动到新窗口后不会长期把源窗口压缩成少量残留标签", async ({ extensionContext, sidepanelApi }) => {
  await Promise.all(
    Array.from({ length: 6 }, async (_unused, index) => {
      const page = await extensionContext.newPage();
      await page.goto(createLocalPageUrl(`bulk-${index}`));
      await page.waitForLoadState("load");
      return page;
    })
  );

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => Object.values(snapshot.tabsById).filter((t) => t.url?.includes("page-bulk-")).length === 6
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabRecords = getSnapshotTabs(beforeSnapshot)
    .filter((t) => t.url?.includes("page-bulk-"))
    .sort((left, right) => left.index - right.index);
  expect(tabRecords).toHaveLength(6);

  const sourceWindowId = tabRecords[0]!.windowId;
  const sourceWindowCountBefore = countTabsByWindow(beforeSnapshot).get(sourceWindowId) ?? 0;
  const movedTabIds = tabRecords.slice(0, 4).map((tab) => tab.id);

  await sidepanelApi.dispatchCommand({
    type: "tabs/move-to-new-window",
    tabIds: movedTabIds
  });

  await waitForSnapshot(sidepanelApi, (snapshot) => {
    const movedTabs = movedTabIds.map((tabId) => snapshot.tabsById[tabId]).filter(Boolean);
    if (movedTabs.length !== movedTabIds.length) {
      return false;
    }

    const targetWindowIds = new Set(movedTabs.map((tab) => tab.windowId));
    if (targetWindowIds.size !== 1) {
      return false;
    }

    const sourceWindowCountAfter = countTabsByWindow(snapshot).get(sourceWindowId) ?? 0;
    return sourceWindowCountAfter >= sourceWindowCountBefore - movedTabIds.length;
  });
});

test("批量移动到已有窗口后不会反复触发源/目标窗口数量异常", async ({ extensionContext, sidepanelApi }) => {
  await Promise.all(
    Array.from({ length: 6 }, async (_unused, index) => {
      const page = await extensionContext.newPage();
      await page.goto(createLocalPageUrl(`existing-${index}`));
      await page.waitForLoadState("load");
      return page;
    })
  );

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => Object.values(snapshot.tabsById).filter((t) => t.url?.includes("page-existing-")).length === 6
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const tabRecords = getSnapshotTabs(beforeSnapshot)
    .filter((t) => t.url?.includes("page-existing-"))
    .sort((left, right) => left.index - right.index);
  expect(tabRecords).toHaveLength(6);

  const sourceWindowId = tabRecords[0]!.windowId;
  const seedTargetTabId = tabRecords[0]!.id;

  await sidepanelApi.dispatchCommand({
    type: "tabs/move-to-new-window",
    tabIds: [seedTargetTabId]
  });

  await expect
    .poll(async () => {
      const snapshot = await sidepanelApi.getSnapshot();
      return snapshot.tabsById[seedTargetTabId]?.windowId ?? null;
    })
    .not.toBe(sourceWindowId);

  const afterTargetCreated = await sidepanelApi.getSnapshot();
  const targetWindowId = afterTargetCreated.tabsById[seedTargetTabId]!.windowId;
  const movedTabIds = tabRecords.slice(1, 5).map((tab) => tab.id);
  const targetIndex = afterTargetCreated.windowTabIds[targetWindowId]?.length ?? 0;
  const sourceWindowCountAfterSeedMove = afterTargetCreated.windowTabIds[sourceWindowId]?.length ?? 0;
  const targetWindowCountBeforeBatchMove = afterTargetCreated.windowTabIds[targetWindowId]?.length ?? 0;

  await sidepanelApi.dispatchCommand({
    type: "tabs/move",
    tabIds: movedTabIds,
    targetWindowId,
    targetIndex,
    targetGroupId: null
  });

  await waitForSnapshot(sidepanelApi, (snapshot) => {
    const movedTabs = movedTabIds.map((tabId) => snapshot.tabsById[tabId]).filter(Boolean);
    if (movedTabs.length !== movedTabIds.length) {
      return false;
    }

    const allInTarget = movedTabs.every((tab) => tab.windowId === targetWindowId);
    if (!allInTarget) {
      return false;
    }

    const sourceCount = snapshot.windowTabIds[sourceWindowId]?.length ?? 0;
    const targetCount = snapshot.windowTabIds[targetWindowId]?.length ?? 0;
    return (
      sourceCount === sourceWindowCountAfterSeedMove - movedTabIds.length &&
      targetCount === targetWindowCountBeforeBatchMove + movedTabIds.length
    );
  });
});

test("折叠窗口后搜索仍会显示匹配标签，清空后恢复折叠视图", async ({ extensionContext, sidepanelApi, sidepanelPage }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const hiddenTitle = `search-hidden-${uniqueSuffix}`;
  const visibleTitle = `search-visible-${uniqueSuffix}`;

  const targetTab = await extensionContext.newPage();
  const companionTab = await extensionContext.newPage();
  await targetTab.goto(`data:text/html,<title>${hiddenTitle}</title><body>${hiddenTitle}</body>`);
  await companionTab.goto(`data:text/html,<title>${visibleTitle}</title><body>${visibleTitle}</body>`);
  await targetTab.waitForLoadState("load");
  await companionTab.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      Object.values(snapshot.tabsById).filter((tab) => tab.title === hiddenTitle).length === 1 &&
      Object.values(snapshot.tabsById).filter((tab) => tab.title === visibleTitle).length === 1
  );

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const hiddenTabRecord = getSnapshotTabs(beforeSnapshot).find((tab) => tab.title === hiddenTitle);
  expect(hiddenTabRecord).toBeDefined();

  const targetWindowRow = sidepanelPage.locator("button.window-row").first();
  const hiddenTabRow = sidepanelPage.getByRole("treeitem", { name: `切换到标签页 ${hiddenTitle}` });

  await expect(hiddenTabRow).toBeVisible();
  await targetWindowRow.click();

  await expect(targetWindowRow).toHaveAttribute("aria-expanded", "false");
  await expect(hiddenTabRow).toHaveCount(0);

  await sidepanelPage.getByLabel("搜索标签").fill(`hidden-${uniqueSuffix}`);

  await expect(hiddenTabRow).toBeVisible();
  await expect(targetWindowRow).toHaveAttribute("aria-expanded", "true");

  await sidepanelPage.getByLabel("清除搜索").click();

  await expect(hiddenTabRow).toHaveCount(0);
  await expect(targetWindowRow).toHaveAttribute("aria-expanded", "false");
});

test("定位到当前页面会在搜索隐藏目标时清空搜索并重新显示目标", async ({ extensionContext, sidepanelApi, sidepanelPage }) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const targetTitle = `locate-target-${uniqueSuffix}`;
  const distractorTitle = `locate-distractor-${uniqueSuffix}`;

  const targetTab = await extensionContext.newPage();
  const distractorTab = await extensionContext.newPage();
  await targetTab.goto(`data:text/html,<title>${targetTitle}</title><body>${targetTitle}</body>`);
  await distractorTab.goto(`data:text/html,<title>${distractorTitle}</title><body>${distractorTitle}</body>`);
  await targetTab.waitForLoadState("load");
  await distractorTab.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) =>
      Object.values(snapshot.tabsById).some((tab) => tab.title === targetTitle) &&
      Object.values(snapshot.tabsById).some((tab) => tab.title === distractorTitle)
  );

  const snapshotBeforeActivate = await sidepanelApi.getSnapshot();
  const targetTabRecord = getSnapshotTabs(snapshotBeforeActivate).find((tab) => tab.title === targetTitle);
  expect(targetTabRecord).toBeDefined();

  await sidepanelApi.dispatchCommand({
    type: "tab/activate",
    tabId: targetTabRecord!.id
  });

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => snapshot.tabsById[targetTabRecord!.id]?.active === true
  );
  await sidepanelApi.waitForInteractive();

  await sidepanelPage.getByLabel("搜索标签").fill(`no-match-${uniqueSuffix}`);
  await expect(sidepanelPage.getByText("没有匹配的标签页")).toBeVisible();

  await sidepanelPage.getByLabel("定位到当前页面").click();

  await expect(sidepanelPage.getByLabel("搜索标签")).toHaveValue("");
  await expect(sidepanelPage.getByRole("treeitem", { name: `切换到标签页 ${targetTitle}` })).toBeVisible();
});

test("开启详细日志后点击激活标签不会产生 move 事件", async ({ extensionContext, sidepanelApi, sidepanelPage }) => {
  const { extensionId } = await openSidepanelPage(extensionContext, "dist");
  const optionsPage = await extensionContext.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: "domcontentloaded",
    timeout: 10_000
  });
  const tab1 = await extensionContext.newPage();
  const tab2 = await extensionContext.newPage();
  await tab1.goto(createLocalPageUrl("log-a"));
  await tab2.goto(createLocalPageUrl("log-b"));
  await tab1.waitForLoadState("load");
  await tab2.waitForLoadState("load");

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => Object.values(snapshot.tabsById).some((t) => t.url?.includes("page-log-a"))
  );

  await optionsPage.getByLabel("开启详细日志").check();
  await expect(sidepanelPage.getByText("详细日志记录中")).toBeVisible();

  const beforeSnapshot = await sidepanelApi.getSnapshot();
  const targetTab = getSnapshotTabs(beforeSnapshot).find((t) => t.url?.includes("page-log-a"));
  expect(targetTab).toBeDefined();

  const targetTitle = targetTab!.title;
  const targetCandidates = await sidepanelPage.getByRole("treeitem", { name: `切换到标签页 ${targetTitle}` }).all();
  await targetCandidates[0]!.click();

  await waitForSnapshot(
    sidepanelApi,
    (snapshot) => snapshot.tabsById[targetTab!.id]?.active === true
  );

  const afterSnapshot = await sidepanelApi.getSnapshot();
  expect(afterSnapshot.tabsById[targetTab!.id]?.index).toBe(targetTab!.index);
  expect(afterSnapshot.tabsById[targetTab!.id]?.windowId).toBe(targetTab!.windowId);

  const trace = await sidepanelApi.getTraceEntries();
  const relevant = trace.filter((entry) =>
    [
      "panel/tab-activate-clicked",
      "panel/selection-primary-action",
      "command/dispatch",
      "tabs/onActivated",
      "tabs/onMoved",
      "list/drag-start",
      "list/drop"
    ].includes(entry.event)
  );

  expect(relevant.some((entry) => entry.event === "panel/tab-activate-clicked")).toBe(true);
  expect(relevant.some((entry) => entry.event === "tabs/onActivated")).toBe(true);
  expect(
    relevant.some(
      (entry) =>
        entry.event === "command/dispatch" &&
        ["tab/move", "tabs/move", "group/move"].includes(String(entry.details.commandType ?? ""))
    )
  ).toBe(false);
  expect(relevant.some((entry) => entry.event === "tabs/onMoved")).toBe(false);
  await optionsPage.close();
});

test("侧边栏加载时无 JS 错误", async ({ sidepanelPage }) => {
  const errors: string[] = [];
  sidepanelPage.on("pageerror", (err) => {
    errors.push(err.message);
  });

  await sidepanelPage.reload();
  await sidepanelPage.waitForLoadState("domcontentloaded");

  const realErrors = errors.filter(
    (e) => !e.includes("ResizeObserver") && !e.includes("favicon")
  );
  expect(realErrors).toHaveLength(0);
});
