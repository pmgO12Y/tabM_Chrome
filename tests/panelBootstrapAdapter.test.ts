import { afterEach, describe, expect, it, vi } from "vitest";
import { createPanelBootstrapAdapter } from "../src/sidepanel/panelBootstrapAdapter";

function makeTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
  return {
    id: overrides.id,
    windowId: overrides.windowId,
    index: overrides.index,
    title: overrides.title,
    url: overrides.url,
    groupId: overrides.groupId
  } as chrome.tabs.Tab;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("panelBootstrapAdapter", () => {
  it("should emit start, progress, and snapshot callbacks", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [
          makeTab({ id: 1, windowId: 2, index: 0, title: "A", url: "data:text/html,A" })
        ])
      },
      windows: {
        getLastFocused: vi.fn(async () => ({ id: 2 }))
      },
      tabGroups: {
        get: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://unit-test/${path}`
      }
    });

    const onStart = vi.fn();
    const onProgress = vi.fn();
    const onSnapshot = vi.fn();
    const onError = vi.fn();

    await createPanelBootstrapAdapter().bootstrap({
      onStart,
      onProgress,
      onSnapshot,
      onError,
      shouldStop: () => false
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(0, 1);
    expect(onProgress).toHaveBeenCalledWith(1, 1);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("should stop quietly when asked before snapshot emission", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [
          makeTab({ id: 1, windowId: 2, index: 0, title: "A", url: "data:text/html,A" })
        ])
      },
      windows: {
        getLastFocused: vi.fn(async () => ({ id: 2 }))
      },
      tabGroups: {
        get: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://unit-test/${path}`
      }
    });

    const onSnapshot = vi.fn();

    await createPanelBootstrapAdapter().bootstrap({
      onStart: vi.fn(),
      onProgress: vi.fn(),
      onSnapshot,
      onError: vi.fn(),
      shouldStop: () => true
    });

    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("should report an error when tab query fails", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => {
          throw new Error("query failed");
        })
      },
      windows: {
        getLastFocused: vi.fn(async () => ({ id: 2 }))
      },
      tabGroups: {
        get: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://unit-test/${path}`
      }
    });

    const onError = vi.fn();
    const onSnapshot = vi.fn();

    await createPanelBootstrapAdapter().bootstrap({
      onStart: vi.fn(),
      onProgress: vi.fn(),
      onSnapshot,
      onError,
      shouldStop: () => false
    });

    expect(onSnapshot).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("首屏数据加载失败，正在等待后台同步。");
  });

  it("should not report an error when stopped after a bootstrap failure", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => {
          throw new Error("query failed");
        })
      },
      windows: {
        getLastFocused: vi.fn(async () => ({ id: 2 }))
      },
      tabGroups: {
        get: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://unit-test/${path}`
      }
    });

    const onError = vi.fn();

    await createPanelBootstrapAdapter().bootstrap({
      onStart: vi.fn(),
      onProgress: vi.fn(),
      onSnapshot: vi.fn(),
      onError,
      shouldStop: () => true
    });

    expect(onError).not.toHaveBeenCalled();
  });
});
