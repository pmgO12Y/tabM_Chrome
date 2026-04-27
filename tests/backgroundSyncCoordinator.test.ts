import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWindowSyncCoordinator } from "../src/background/backgroundSyncCoordinator";

beforeEach(() => {
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => undefined)
      }
    }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("backgroundSyncCoordinator", () => {
  it("syncs target before source for cross-window reconciliation", async () => {
    const syncWindow = vi.fn(async () => undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    vi.useFakeTimers();
    const pending = coordinator.scheduleCrossWindowSync({
      sourceWindowId: 1,
      targetWindowId: 9,
      cause: "tabs/onAttached"
    });

    await vi.advanceTimersByTimeAsync(40);
    await pending;

    expect(syncWindow).toHaveBeenNthCalledWith(1, 9, expect.objectContaining({ orderIndex: 0 }));
    expect(syncWindow).toHaveBeenNthCalledWith(2, 1, expect.objectContaining({ orderIndex: 1 }));
  });

  it("coalesces repeated cross-window syncs for the same source and target", async () => {
    vi.useFakeTimers();

    const resolvers: Array<() => void> = [];
    const syncWindow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    const first = coordinator.scheduleCrossWindowSync({
      sourceWindowId: 1,
      targetWindowId: 9,
      cause: "tabs/onAttached"
    });
    const second = coordinator.scheduleCrossWindowSync({
      sourceWindowId: 1,
      targetWindowId: 9,
      cause: "tabs/onAttached"
    });

    await vi.advanceTimersByTimeAsync(40);
    expect(syncWindow).toHaveBeenCalledTimes(1);
    resolvers.shift()?.();
    await Promise.resolve();
    expect(syncWindow).toHaveBeenCalledTimes(2);
    resolvers.shift()?.();
    await Promise.all([first, second]);
    expect(syncWindow).toHaveBeenCalledTimes(2);
  });

  it("runs post-cycle tasks after an in-flight window sync", async () => {
    vi.useFakeTimers();

    const events: string[] = [];
    let releaseSync!: () => void;
    const syncWindow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          events.push("sync-start");
          releaseSync = () => {
            events.push("sync-end");
            resolve();
          };
        })
    );

    let tail = Promise.resolve<void>(undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: <T>(task: () => Promise<T>) => {
        const run = tail.then(task);
        tail = run.then(() => undefined, () => undefined);
        return run;
      },
      syncWindow
    });

    const syncPromise = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "tabs/onCreated"
    });
    await vi.advanceTimersByTimeAsync(40);
    const postTaskPromise = coordinator.runAfterCurrentCycle({
      cause: "panel/connect",
      task: async () => {
        events.push("post-task");
      }
    });

    expect(events).toEqual(["sync-start"]);
    releaseSync();

    await Promise.all([syncPromise, postTaskPromise]);
    expect(events).toEqual(["sync-start", "sync-end", "post-task"]);
  });

  it("debounces repeated window syncs for the same window", async () => {
    vi.useFakeTimers();

    const syncWindow = vi.fn(async () => undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    const first = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "tabs/onUpdated"
    });
    const second = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "tabs/onMoved"
    });

    await vi.advanceTimersByTimeAsync(39);
    expect(syncWindow).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second]);

    expect(syncWindow).toHaveBeenCalledTimes(1);
    expect(syncWindow).toHaveBeenCalledWith(5, expect.objectContaining({ cause: "tabs/onMoved" }));
  });

  it("does not debounce different windows together", async () => {
    vi.useFakeTimers();

    const syncWindow = vi.fn(async () => undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    const first = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "tabs/onUpdated"
    });
    const second = coordinator.scheduleWindowSync({
      windowId: 9,
      cause: "tabs/onUpdated"
    });

    await vi.advanceTimersByTimeAsync(40);
    await Promise.all([first, second]);

    expect(syncWindow).toHaveBeenCalledTimes(2);
    expect(syncWindow).toHaveBeenNthCalledWith(1, 5, expect.any(Object));
    expect(syncWindow).toHaveBeenNthCalledWith(2, 9, expect.any(Object));
  });

  it("suppresses buffered event syncs when command sync already covers the same windows", async () => {
    const syncWindow = vi.fn(async () => undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    const result = await coordinator.runCommandPhase({
      cause: "command/tabs/move",
      task: async () => {
        void coordinator.scheduleWindowSync({
          windowId: 9,
          cause: "tabs/onMoved"
        });
        void coordinator.scheduleCrossWindowSync({
          sourceWindowId: 5,
          targetWindowId: 9,
          cause: "tabs/onAttached"
        });

        return {
          affectedWindowIds: [9, 5],
          preferredOrder: [9, 5]
        };
      }
    });

    expect(result.affectedWindowIds).toEqual([9, 5]);
    expect(syncWindow).toHaveBeenCalledTimes(2);
    expect(syncWindow).toHaveBeenNthCalledWith(1, 9, expect.objectContaining({ cause: "command/tabs/move" }));
    expect(syncWindow).toHaveBeenNthCalledWith(2, 5, expect.objectContaining({ cause: "command/tabs/move" }));
  });

  it("debounces auto-correct window syncs for the same window", async () => {
    vi.useFakeTimers();

    const syncWindow = vi.fn(async () => undefined);
    const coordinator = createWindowSyncCoordinator({
      runExclusive: async (task) => task(),
      syncWindow
    });

    const first = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "autocorrect/tabs/onUpdated"
    });
    const second = coordinator.scheduleWindowSync({
      windowId: 5,
      cause: "autocorrect/tabs/onRemoved"
    });

    await vi.advanceTimersByTimeAsync(40);
    await Promise.all([first, second]);

    expect(syncWindow).toHaveBeenCalledTimes(1);
    expect(syncWindow).toHaveBeenCalledWith(5, expect.objectContaining({ cause: "autocorrect/tabs/onRemoved" }));
  });

});
