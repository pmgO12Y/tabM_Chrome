import { computeDuplicateSelection } from "../src/shared/domain/duplicateDetection";
import type { TabRecord } from "../src/shared/types";

function createTab(overrides: Partial<TabRecord> & { id: number }): TabRecord {
  return {
    windowId: 1,
    index: 0,
    groupId: -1,
    title: "",
    url: "https://example.com/page",
    pinned: false,
    active: false,
    audible: false,
    discarded: false,
    favIconUrl: null,
    lastAccessed: 0,
    ...overrides
  };
}

describe("computeDuplicateSelection", () => {
  describe("正常路径", () => {
    it("输入多组重复标签时应选中除最近活跃外的所有重复", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a", lastAccessed: 100 }),
        2: createTab({ id: 2, url: "https://example.com/a", lastAccessed: 200 }),
        3: createTab({ id: 3, url: "https://example.com/a", lastAccessed: 300 }),
        4: createTab({ id: 4, url: "https://example.com/b", lastAccessed: 150 }),
        5: createTab({ id: 5, url: "https://example.com/b", lastAccessed: 250 })
      };
      const windowTabIds = { 1: [1, 2, 3, 4, 5] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(true);
      // 组 a: 保留 id=3 (lastAccessed=300), 选中 1, 2
      // 组 b: 保留 id=5 (lastAccessed=250), 选中 4
      expect(result.tabIdsToSelect).toEqual(expect.arrayContaining([1, 2, 4]));
      expect(result.tabIdsToSelect).not.toContain(3);
      expect(result.tabIdsToSelect).not.toContain(5);
      expect(result.tabIdsToSelect.length).toBe(3);
    });
  });

  describe("边界条件", () => {
    it("输入所有标签 URL 唯一时应返回无重复", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a" }),
        2: createTab({ id: 2, url: "https://example.com/b" }),
        3: createTab({ id: 3, url: "https://example.com/c" })
      };
      const windowTabIds = { 1: [1, 2, 3] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(false);
      expect(result.tabIdsToSelect).toEqual([]);
    });

    it("输入空数据时应返回无重复", () => {
      const result = computeDuplicateSelection({}, {});

      expect(result.hasDuplicates).toBe(false);
      expect(result.tabIdsToSelect).toEqual([]);
    });

    it("所有标签都是 pinned 时即使 URL 重复也应返回无重复", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a", pinned: true }),
        2: createTab({ id: 2, url: "https://example.com/a", pinned: true }),
        3: createTab({ id: 3, url: "https://example.com/a", pinned: true })
      };
      const windowTabIds = { 1: [1, 2, 3] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(false);
      expect(result.tabIdsToSelect).toEqual([]);
    });

    it("重复组中混有 pinned 标签时应跳过 pinned 只处理非 pinned", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a", pinned: true }),
        2: createTab({ id: 2, url: "https://example.com/a", pinned: true }),
        3: createTab({ id: 3, url: "https://example.com/a", lastAccessed: 100 }),
        4: createTab({ id: 4, url: "https://example.com/a", lastAccessed: 200 })
      };
      const windowTabIds = { 1: [1, 2, 3, 4] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(true);
      // pinned(1,2) 不参与, 非 pinned(3,4) 中保留 lastAccessed 更大的 4
      expect(result.tabIdsToSelect).toEqual([3]);
    });

    it("lastAccessed 相同时应保留 tab ID 较大的", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a", lastAccessed: 100 }),
        2: createTab({ id: 2, url: "https://example.com/a", lastAccessed: 100 }),
        3: createTab({ id: 3, url: "https://example.com/a", lastAccessed: 100 })
      };
      const windowTabIds = { 1: [1, 2, 3] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(true);
      // 全部 lastAccessed 相同，保留 tab ID 最大的 (3)
      expect(result.tabIdsToSelect).toEqual(expect.arrayContaining([1, 2]));
      expect(result.tabIdsToSelect).not.toContain(3);
      expect(result.tabIdsToSelect.length).toBe(2);
    });

    it("跨窗口的重复标签也应被检测到", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a", windowId: 1, lastAccessed: 100 }),
        2: createTab({ id: 2, url: "https://example.com/a", windowId: 2, lastAccessed: 200 })
      };
      const windowTabIds = { 1: [1], 2: [2] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(true);
      expect(result.tabIdsToSelect).toEqual([1]);
    });

    it("多个 tab ID 为空的窗口键应被忽略", () => {
      const result = computeDuplicateSelection({}, { 1: [], 2: [] });

      expect(result.hasDuplicates).toBe(false);
      expect(result.tabIdsToSelect).toEqual([]);
    });
  });

  describe("异常处理", () => {
    it("tabsById 中不存在的 tab ID 应被跳过", () => {
      const tabsById: Record<number, TabRecord> = {
        1: createTab({ id: 1, url: "https://example.com/a" })
      };
      const windowTabIds = { 1: [1, 999] };

      const result = computeDuplicateSelection(tabsById, windowTabIds);

      expect(result.hasDuplicates).toBe(false);
      expect(result.tabIdsToSelect).toEqual([]);
    });

    it("tabsById 为 null 或 undefined 的 key 不应导致崩溃", () => {
      const windowTabIds = { 1: [1] } as Record<number, number[]>;
      const result = computeDuplicateSelection({}, windowTabIds);

      expect(result.hasDuplicates).toBe(false);
    });
  });
});
