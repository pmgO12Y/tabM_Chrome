import { traceBackgroundEvent } from "./trace";

const WINDOW_ID_NONE = -1;
const EVENT_SYNC_DEBOUNCE_MS = 40;

interface Deferred<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
}

interface BufferedWindowSyncRequest {
  cause: string;
  deferreds: Array<Deferred<void>>;
  windowId: number;
}

interface BufferedCrossWindowSyncRequest {
  cause: string;
  deferreds: Array<Deferred<void>>;
  key: string;
  order: number[];
}

interface DebouncedWindowSyncRequest {
  cause: string;
  deferred: Deferred<void>;
  timer: ReturnType<typeof setTimeout>;
  windowId: number;
}

interface DebouncedCrossWindowSyncRequest {
  cause: string;
  deferred: Deferred<void>;
  key: string;
  order: number[];
  timer: ReturnType<typeof setTimeout>;
}

interface CommandPhaseState {
  bufferedCrossWindowSyncs: Map<string, BufferedCrossWindowSyncRequest>;
  bufferedWindowSyncs: Map<number, BufferedWindowSyncRequest>;
}

export interface WindowSyncCoordinator {
  scheduleWindowSync(params: {
    windowId: number;
    cause: string;
  }): Promise<void>;
  scheduleCrossWindowSync(params: {
    sourceWindowId: number | null;
    targetWindowId: number;
    cause: string;
  }): Promise<void>;
  scheduleCommandSync(params: {
    affectedWindowIds: number[];
    preferredOrder?: number[];
    cause: string;
  }): Promise<void>;
  runCommandPhase<T extends {
    affectedWindowIds: number[];
    preferredOrder?: number[];
  }>(params: {
    cause: string;
    task: () => Promise<T>;
  }): Promise<T>;
  runAfterCurrentCycle<T>(params: {
    cause: string;
    task: () => Promise<T>;
  }): Promise<T>;
}

export function createWindowSyncCoordinator(params: {
  runExclusive: <T>(task: () => Promise<T>) => Promise<T>;
  syncWindow: (windowId: number, traceContext?: Record<string, unknown>) => Promise<void>;
}) : WindowSyncCoordinator {
  const { runExclusive, syncWindow } = params;
  let cycleSequence = 0;
  let commandPhase: CommandPhaseState | null = null;
  const pendingWindowSyncs = new Map<number, Promise<void>>();
  const pendingCrossWindowSyncs = new Map<string, Promise<void>>();
  const debouncedWindowSyncs = new Map<number, DebouncedWindowSyncRequest>();
  const debouncedCrossWindowSyncs = new Map<string, DebouncedCrossWindowSyncRequest>();

  return {
    scheduleWindowSync({ windowId, cause }) {
      if (commandPhase) {
        return bufferWindowSync(commandPhase, {
          windowId,
          cause
        });
      }

      return scheduleDebouncedWindowSync({
        windowId,
        cause
      });
    },

    scheduleCrossWindowSync({ sourceWindowId, targetWindowId, cause }) {
      const order = sourceWindowId != null && sourceWindowId !== targetWindowId
        ? [targetWindowId, sourceWindowId]
        : [targetWindowId];

      if (commandPhase) {
        return bufferCrossWindowSync(commandPhase, {
          order,
          cause
        });
      }

      return scheduleDebouncedCrossWindowSync({
        order,
        cause
      });
    },

    scheduleCommandSync({ affectedWindowIds, preferredOrder = [], cause }) {
      return scheduleCommandSyncNow({
        affectedWindowIds,
        preferredOrder,
        cause
      });
    },

    async runCommandPhase<T extends {
      affectedWindowIds: number[];
      preferredOrder?: number[];
    }>({ cause, task }: {
      cause: string;
      task: () => Promise<T>;
    }) {
      if (commandPhase) {
        return await task();
      }

      const phase: CommandPhaseState = {
        bufferedCrossWindowSyncs: new Map(),
        bufferedWindowSyncs: new Map()
      };
      commandPhase = phase;
      const coveredWindowIds = new Set<number>();
      let result: T | null = null;
      let failure: unknown;

      try {
        result = await runExclusive(task);
        const ordered = orderWindowIds(result.affectedWindowIds, result.preferredOrder ?? []);
        for (const windowId of ordered) {
          coveredWindowIds.add(windowId);
        }

        if (ordered.length > 0) {
          await scheduleCommandSyncNow({
            affectedWindowIds: result.affectedWindowIds,
            preferredOrder: result.preferredOrder ?? [],
            cause
          });
        }
      } catch (error) {
        failure = error;
      }

      try {
        await flushCommandPhaseBufferedSyncs(phase, coveredWindowIds);
      } finally {
        commandPhase = null;
      }

      if (failure) {
        throw failure;
      }

      return result as T;
    },

    async runAfterCurrentCycle({ cause, task }) {
      if (!commandPhase) {
        await flushDebouncedEventSyncs();
      }

      return runExclusive(async () => {
        traceBackgroundEvent("coordinator/post-cycle-task", {
          cause
        });
        return task();
      });
    }
  };

  function scheduleDebouncedWindowSync(params: {
    windowId: number;
    cause: string;
  }): Promise<void> {
    const existingPending = pendingWindowSyncs.get(params.windowId);
    if (existingPending) {
      traceBackgroundEvent("coordinator/window-sync-coalesced", {
        windowId: params.windowId,
        cause: params.cause
      });
      return existingPending;
    }

    const existingDebounced = debouncedWindowSyncs.get(params.windowId);
    if (existingDebounced) {
      existingDebounced.cause = params.cause;
      traceBackgroundEvent("coordinator/window-sync-coalesced", {
        windowId: params.windowId,
        cause: params.cause
      });
      return existingDebounced.deferred.promise;
    }

    const deferred = createDeferred<void>();
    const request: DebouncedWindowSyncRequest = {
      windowId: params.windowId,
      cause: params.cause,
      deferred,
      timer: globalThis.setTimeout(() => {
        debouncedWindowSyncs.delete(params.windowId);
        void scheduleWindowSyncNow({
          windowId: params.windowId,
          cause: request.cause
        }).then(deferred.resolve, deferred.reject);
      }, EVENT_SYNC_DEBOUNCE_MS)
    };

    debouncedWindowSyncs.set(params.windowId, request);
    return deferred.promise;
  }

  function scheduleDebouncedCrossWindowSync(params: {
    order: number[];
    cause: string;
  }): Promise<void> {
    const key = buildCrossWindowKey(params.cause, params.order);
    const existingPending = pendingCrossWindowSyncs.get(key);
    if (existingPending) {
      traceBackgroundEvent("coordinator/cross-window-sync-coalesced", {
        cause: params.cause,
        order: params.order
      });
      return existingPending;
    }

    const existingDebounced = debouncedCrossWindowSyncs.get(key);
    if (existingDebounced) {
      existingDebounced.cause = params.cause;
      traceBackgroundEvent("coordinator/cross-window-sync-coalesced", {
        cause: params.cause,
        order: params.order
      });
      return existingDebounced.deferred.promise;
    }

    const deferred = createDeferred<void>();
    const request: DebouncedCrossWindowSyncRequest = {
      key,
      order: params.order,
      cause: params.cause,
      deferred,
      timer: globalThis.setTimeout(() => {
        debouncedCrossWindowSyncs.delete(key);
        void scheduleCrossWindowSyncNow({
          order: params.order,
          cause: request.cause
        }).then(deferred.resolve, deferred.reject);
      }, EVENT_SYNC_DEBOUNCE_MS)
    };

    debouncedCrossWindowSyncs.set(key, request);
    return deferred.promise;
  }

  function scheduleWindowSyncNow(params: {
    windowId: number;
    cause: string;
  }): Promise<void> {
    const existing = pendingWindowSyncs.get(params.windowId);
    if (existing) {
      traceBackgroundEvent("coordinator/window-sync-coalesced", {
        windowId: params.windowId,
        cause: params.cause
      });
      return existing;
    }

    const scheduled = runExclusive(async () => {
      const cycleId = ++cycleSequence;
      traceBackgroundEvent("coordinator/cycle-start", {
        cycleId,
        cause: params.cause,
        mode: "single-window",
        order: [params.windowId]
      });
      await syncWindow(params.windowId, {
        cycleId,
        cause: params.cause,
        orderIndex: 0,
        totalWindows: 1
      });
      traceBackgroundEvent("coordinator/cycle-end", {
        cycleId,
        cause: params.cause,
        mode: "single-window",
        order: [params.windowId]
      });
    }).finally(() => {
      pendingWindowSyncs.delete(params.windowId);
    });

    pendingWindowSyncs.set(params.windowId, scheduled);
    return scheduled;
  }

  function scheduleCrossWindowSyncNow(params: {
    order: number[];
    cause: string;
  }): Promise<void> {
    const key = buildCrossWindowKey(params.cause, params.order);
    const existing = pendingCrossWindowSyncs.get(key);
    if (existing) {
      traceBackgroundEvent("coordinator/cross-window-sync-coalesced", {
        cause: params.cause,
        order: params.order
      });
      return existing;
    }

    const scheduled = runExclusive(async () => {
      const cycleId = ++cycleSequence;

      traceBackgroundEvent("coordinator/cycle-start", {
        cycleId,
        cause: params.cause,
        mode: "cross-window",
        order: params.order
      });

      for (const [orderIndex, windowId] of params.order.entries()) {
        await syncWindow(windowId, {
          cycleId,
          cause: params.cause,
          orderIndex,
          totalWindows: params.order.length
        });
      }

      traceBackgroundEvent("coordinator/cycle-end", {
        cycleId,
        cause: params.cause,
        mode: "cross-window",
        order: params.order
      });
    }).finally(() => {
      pendingCrossWindowSyncs.delete(key);
    });

    pendingCrossWindowSyncs.set(key, scheduled);
    return scheduled;
  }

  function scheduleCommandSyncNow(params: {
    affectedWindowIds: number[];
    preferredOrder?: number[];
    cause: string;
  }): Promise<void> {
    return runExclusive(async () => {
      const cycleId = ++cycleSequence;
      const ordered = orderWindowIds(params.affectedWindowIds, params.preferredOrder ?? []);

      traceBackgroundEvent("coordinator/cycle-start", {
        cycleId,
        cause: params.cause,
        mode: "command",
        preferredOrder: params.preferredOrder ?? [],
        order: ordered
      });

      for (const [orderIndex, windowId] of ordered.entries()) {
        await syncWindow(windowId, {
          cycleId,
          cause: params.cause,
          orderIndex,
          totalWindows: ordered.length
        });
      }

      traceBackgroundEvent("coordinator/cycle-end", {
        cycleId,
        cause: params.cause,
        mode: "command",
        preferredOrder: params.preferredOrder ?? [],
        order: ordered
      });
    });
  }

  async function flushDebouncedEventSyncs(): Promise<void> {
    const pending: Promise<void>[] = [];

    for (const request of debouncedWindowSyncs.values()) {
      globalThis.clearTimeout(request.timer);
      debouncedWindowSyncs.delete(request.windowId);
      pending.push(
        scheduleWindowSyncNow({
          windowId: request.windowId,
          cause: request.cause
        }).then(request.deferred.resolve, request.deferred.reject)
      );
    }

    for (const request of debouncedCrossWindowSyncs.values()) {
      globalThis.clearTimeout(request.timer);
      debouncedCrossWindowSyncs.delete(request.key);
      pending.push(
        scheduleCrossWindowSyncNow({
          order: request.order,
          cause: request.cause
        }).then(request.deferred.resolve, request.deferred.reject)
      );
    }

    await Promise.all(pending);
  }

  async function flushCommandPhaseBufferedSyncs(
    phase: CommandPhaseState,
    coveredWindowIds: Set<number>
  ): Promise<void> {
    while (phase.bufferedWindowSyncs.size > 0 || phase.bufferedCrossWindowSyncs.size > 0) {
      const bufferedWindows = [...phase.bufferedWindowSyncs.values()];
      const bufferedCross = [...phase.bufferedCrossWindowSyncs.values()];
      phase.bufferedWindowSyncs.clear();
      phase.bufferedCrossWindowSyncs.clear();

      const syncedByCrossWindow = new Set<number>();
      const pending: Promise<void>[] = [];

      for (const request of bufferedCross) {
        const uncoveredOrder = request.order.filter((windowId) => !coveredWindowIds.has(windowId));
        if (uncoveredOrder.length === 0) {
          resolveAll(request.deferreds);
          continue;
        }

        const ordered = orderWindowIds(uncoveredOrder, request.order);
        for (const windowId of ordered) {
          syncedByCrossWindow.add(windowId);
        }

        pending.push(
          scheduleCrossWindowSyncNow({
            order: ordered,
            cause: request.cause
          }).then(
            () => resolveAll(request.deferreds),
            (error) => rejectAll(request.deferreds, error)
          )
        );
      }

      for (const request of bufferedWindows) {
        if (coveredWindowIds.has(request.windowId) || syncedByCrossWindow.has(request.windowId)) {
          resolveAll(request.deferreds);
          continue;
        }

        pending.push(
          scheduleWindowSyncNow({
            windowId: request.windowId,
            cause: request.cause
          }).then(
            () => resolveAll(request.deferreds),
            (error) => rejectAll(request.deferreds, error)
          )
        );
      }

      if (pending.length === 0) {
        break;
      }

      await Promise.all(pending);
    }
  }

  function bufferWindowSync(
    phase: CommandPhaseState,
    params: {
      windowId: number;
      cause: string;
    }
  ): Promise<void> {
    const existing = phase.bufferedWindowSyncs.get(params.windowId);
    if (existing) {
      existing.cause = params.cause;
      traceBackgroundEvent("coordinator/window-sync-coalesced", {
        windowId: params.windowId,
        cause: params.cause
      });
      const deferred = createDeferred<void>();
      existing.deferreds.push(deferred);
      return deferred.promise;
    }

    const deferred = createDeferred<void>();
    phase.bufferedWindowSyncs.set(params.windowId, {
      windowId: params.windowId,
      cause: params.cause,
      deferreds: [deferred]
    });
    return deferred.promise;
  }

  function bufferCrossWindowSync(
    phase: CommandPhaseState,
    params: {
      order: number[];
      cause: string;
    }
  ): Promise<void> {
    const key = buildCrossWindowKey(params.cause, params.order);
    const existing = phase.bufferedCrossWindowSyncs.get(key);
    if (existing) {
      existing.cause = params.cause;
      traceBackgroundEvent("coordinator/cross-window-sync-coalesced", {
        cause: params.cause,
        order: params.order
      });
      const deferred = createDeferred<void>();
      existing.deferreds.push(deferred);
      return deferred.promise;
    }

    const deferred = createDeferred<void>();
    phase.bufferedCrossWindowSyncs.set(key, {
      key,
      order: params.order,
      cause: params.cause,
      deferreds: [deferred]
    });
    return deferred.promise;
  }
}

function buildCrossWindowKey(cause: string, order: number[]): string {
  return `${cause}:${order.join("->")}`;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>["resolve"];
  let reject!: Deferred<T>["reject"];
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    resolve,
    reject
  };
}

function rejectAll(deferreds: Array<Deferred<void>>, error: unknown): void {
  for (const deferred of deferreds) {
    deferred.reject(error);
  }
}

function resolveAll(deferreds: Array<Deferred<void>>): void {
  for (const deferred of deferreds) {
    deferred.resolve(undefined);
  }
}

function orderWindowIds(windowIds: number[], preferredOrder: number[]): number[] {
  const uniqueWindowIds = Array.from(
    new Set(windowIds.filter((windowId) => Number.isInteger(windowId) && windowId !== WINDOW_ID_NONE))
  );

  const preferred = preferredOrder.filter((windowId) => uniqueWindowIds.includes(windowId));
  const remaining = uniqueWindowIds.filter((windowId) => !preferred.includes(windowId));
  return [...preferred, ...remaining];
}
