import { describe, expect, it, vi } from "vitest";
import {
  createTabEventHandlers,
  createTabGroupEventHandlers,
  createWindowEventHandlers
} from "../src/background/backgroundEventHandlers";

describe("backgroundEventHandlers", () => {
  it("should schedule window sync for tab created", () => {
    const deps = {
      traceBackgroundEvent: vi.fn(),
      windowSyncCoordinator: {
        scheduleWindowSync: vi.fn(async () => undefined),
        scheduleCrossWindowSync: vi.fn(async () => undefined)
      },
      detachedTabWindowIds: new Map<number, number>(),
      enqueueStoreTask: vi.fn(),
      handleActivated: vi.fn(async () => undefined)
    };

    const handlers = createTabEventHandlers(deps as never);
    handlers.onCreated({ id: 1, windowId: 3, index: 0, url: "a" } as chrome.tabs.Tab);

    expect(deps.windowSyncCoordinator.scheduleWindowSync).toHaveBeenCalledWith({
      windowId: 3,
      cause: "tabs/onCreated"
    });
  });

  it("should schedule cross-window sync for tab attached", () => {
    const deps = {
      traceBackgroundEvent: vi.fn(),
      windowSyncCoordinator: {
        scheduleWindowSync: vi.fn(async () => undefined),
        scheduleCrossWindowSync: vi.fn(async () => undefined)
      },
      detachedTabWindowIds: new Map([[7, 2]]),
      enqueueStoreTask: vi.fn(),
      handleActivated: vi.fn(async () => undefined)
    };

    const handlers = createTabEventHandlers(deps as never);
    handlers.onAttached(7, { newWindowId: 9, newPosition: 0 });

    expect(deps.windowSyncCoordinator.scheduleCrossWindowSync).toHaveBeenCalledWith({
      sourceWindowId: 2,
      targetWindowId: 9,
      cause: "tabs/onAttached"
    });
  });

  it("should enqueue group removal reconciliation", async () => {
    const taskQueue = vi.fn(async (task: () => Promise<void>) => await task());
    const deps = {
      enqueueStoreTask: taskQueue,
      syncGroupFromChrome: vi.fn(async () => undefined),
      ensureInitialized: vi.fn(async () => undefined),
      store: {
        removeGroup: vi.fn(() => ({ type: "group/remove", groupId: 5 }))
      },
      handlePatch: vi.fn(),
      syncWindowFromChrome: vi.fn(async () => undefined)
    };

    const handlers = createTabGroupEventHandlers(deps as never);
    await handlers.onRemoved({ id: 5, windowId: 8 } as chrome.tabGroups.TabGroup);

    expect(deps.handlePatch).toHaveBeenCalledWith({ type: "group/remove", groupId: 5 });
    expect(deps.syncWindowFromChrome).toHaveBeenCalledWith(8);
  });

  it("should ignore WINDOW_ID_NONE focus changes", () => {
    const deps = {
      enqueueStoreTask: vi.fn(),
      ensureInitialized: vi.fn(async () => undefined),
      store: {
        removeWindow: vi.fn(),
        focusWindow: vi.fn()
      },
      handlePatch: vi.fn(),
      windowSyncCoordinator: {
        runAfterCurrentCycle: vi.fn(async () => undefined)
      },
      windowIdNone: -1
    };

    const handlers = createWindowEventHandlers(deps as never);
    handlers.onFocusChanged(deps.windowIdNone);

    expect(deps.windowSyncCoordinator.runAfterCurrentCycle).not.toHaveBeenCalled();
  });
});
