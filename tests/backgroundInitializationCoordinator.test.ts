import { describe, expect, it, vi } from "vitest";
import { createBackgroundInitializationCoordinator } from "../src/background/backgroundInitializationCoordinator";

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

describe("backgroundInitializationCoordinator", () => {
  it("should initialize once and schedule badge update", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [makeTab({ id: 1, windowId: 2, index: 0, title: "A", url: "data:text/html,A" })])
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

    const setInitialStore = vi.fn();
    const scheduleActionBadgeUpdate = vi.fn();
    const coordinator = createBackgroundInitializationCoordinator({
      initializeTracePersistence: vi.fn(async () => undefined),
      initializeExtensionSettings: vi.fn(async () => undefined),
      configureActionBadge: vi.fn(),
      configureSidePanel: vi.fn(async () => undefined),
      scheduleActionBadgeUpdate,
      setInitialStore
    });

    await coordinator.ensureInitialized();
    await coordinator.ensureInitialized();

    expect(setInitialStore).toHaveBeenCalledTimes(1);
    expect(scheduleActionBadgeUpdate).toHaveBeenCalledTimes(1);
  });

  it("should boot trace, settings, badge and side panel", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [])
      },
      windows: {
        getLastFocused: vi.fn(async () => ({ id: undefined }))
      },
      tabGroups: {
        get: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://unit-test/${path}`
      }
    });

    const initializeTracePersistence = vi.fn(async () => undefined);
    const initializeExtensionSettings = vi.fn(async () => undefined);
    const configureActionBadge = vi.fn();
    const configureSidePanel = vi.fn(async () => undefined);
    const coordinator = createBackgroundInitializationCoordinator({
      initializeTracePersistence,
      initializeExtensionSettings,
      configureActionBadge,
      configureSidePanel,
      scheduleActionBadgeUpdate: vi.fn(),
      setInitialStore: vi.fn()
    });

    await coordinator.boot();

    expect(initializeTracePersistence).toHaveBeenCalledTimes(1);
    expect(initializeExtensionSettings).toHaveBeenCalledTimes(1);
    expect(configureActionBadge).toHaveBeenCalledTimes(1);
    expect(configureSidePanel).toHaveBeenCalledTimes(1);
  });
});
