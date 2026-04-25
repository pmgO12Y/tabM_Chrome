import { describe, expect, it, vi } from "vitest";
import { createPortMessageHandlers } from "../src/background/backgroundHandlers";

function createDeps() {
  return {
    buildTraceExportBundle: vi.fn(async () => ({
      entries: [{ id: 1 }],
      settings: { verboseLoggingEnabled: true, changedAt: "2026-04-25T00:00:00.000Z" },
      updatedAt: "2026-04-25T00:01:00.000Z"
    })),
    formatPersistedTraceTimeline: vi.fn(async () => "timeline"),
    traceBackgroundEvent: vi.fn(),
    tracePanelEvent: vi.fn(),
    setVerboseLoggingEnabled: vi.fn(async (enabled: boolean) => ({
      verboseLoggingEnabled: enabled,
      changedAt: "2026-04-25T00:02:00.000Z"
    })),
    panelPortHub: {
      broadcastTraceState: vi.fn(),
      sendError: vi.fn()
    },
    getTraceState: vi.fn(async () => ({
      settings: { verboseLoggingEnabled: true, changedAt: "2026-04-25T00:02:00.000Z" },
      entryCount: 1,
      updatedAt: "2026-04-25T00:01:00.000Z"
    })),
    clearPersistedTrace: vi.fn(async () => undefined),
    windowSyncCoordinator: {
      runCommandPhase: vi.fn(async ({ task }) => await task())
    },
    executeTabCommand: vi.fn(async () => ({
      affectedWindowIds: [3],
      preferredOrder: [3]
    }))
  };
}

describe("backgroundHandlers", () => {
  it("should post trace bundle for debug/get-trace", async () => {
    const deps = createDeps();
    const handlers = createPortMessageHandlers(deps as never);
    const port = { postMessage: vi.fn() } as unknown as chrome.runtime.Port;

    await handlers["debug/get-trace"](port, { type: "debug/get-trace" });

    expect(deps.buildTraceExportBundle).toHaveBeenCalledTimes(1);
    expect(port.postMessage).toHaveBeenCalledWith({
      type: "debug/trace",
      payload: {
        entries: [{ id: 1 }],
        settings: { verboseLoggingEnabled: true, changedAt: "2026-04-25T00:00:00.000Z" },
        updatedAt: "2026-04-25T00:01:00.000Z",
        timelineText: "timeline"
      }
    });
  });

  it("should dispatch command through command phase", async () => {
    const deps = createDeps();
    const handlers = createPortMessageHandlers(deps as never);

    await handlers["command/dispatch"](
      {} as chrome.runtime.Port,
      {
        type: "command/dispatch",
        payload: {
          type: "tab/activate",
          tabId: 7
        }
      }
    );

    expect(deps.windowSyncCoordinator.runCommandPhase).toHaveBeenCalledTimes(1);
    expect(deps.executeTabCommand).toHaveBeenCalledWith({
      type: "tab/activate",
      tabId: 7
    });
  });
});
