import { describe, expect, it, vi } from "vitest";
import { createPanelPortAdapter, type TraceBundlePayload } from "../src/sidepanel/panelPortAdapter";

function createPort() {
  const messageListeners = new Set<(message: unknown) => void>();
  const disconnectListeners = new Set<() => void>();

  return {
    postMessage: vi.fn(),
    disconnect: vi.fn(),
    onMessage: {
      addListener: vi.fn((listener: (message: unknown) => void) => {
        messageListeners.add(listener);
      }),
      removeListener: vi.fn((listener: (message: unknown) => void) => {
        messageListeners.delete(listener);
      })
    },
    onDisconnect: {
      addListener: vi.fn((listener: () => void) => {
        disconnectListeners.add(listener);
      }),
      removeListener: vi.fn((listener: () => void) => {
        disconnectListeners.delete(listener);
      })
    },
    emitMessage(message: unknown) {
      messageListeners.forEach((listener) => listener(message));
    },
    emitDisconnect() {
      disconnectListeners.forEach((listener) => listener());
    }
  };
}

describe("panelPortAdapter", () => {
  it("should forward background messages and reconnect after disconnect", () => {
    vi.useFakeTimers();
    const port1 = createPort();
    const port2 = createPort();
    const connectPort = vi.fn()
      .mockReturnValueOnce(port1 as unknown as chrome.runtime.Port)
      .mockReturnValueOnce(port2 as unknown as chrome.runtime.Port);
    const onMessage = vi.fn();
    const onDisconnected = vi.fn();

    const adapter = createPanelPortAdapter({
      connectPort,
      onMessage,
      onConnectionFailed: vi.fn(),
      onDisconnected,
      reconnectDelayMs: 10
    });

    adapter.connect();
    port1.emitMessage({ type: "panel/error", payload: { message: "x" } });
    port1.emitDisconnect();
    vi.advanceTimersByTime(10);

    expect(onMessage).toHaveBeenCalledWith({ type: "panel/error", payload: { message: "x" } });
    expect(onDisconnected).toHaveBeenCalledTimes(1);
    expect(connectPort).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("should resolve trace bundle requests through the active port", async () => {
    const port = createPort();
    const adapter = createPanelPortAdapter({
      connectPort: () => port as unknown as chrome.runtime.Port,
      onMessage: vi.fn(),
      onConnectionFailed: vi.fn(),
      onDisconnected: vi.fn()
    });

    adapter.connect();
    await Promise.resolve();
    const pending = adapter.requestTraceBundle();
    expect(port.postMessage).toHaveBeenCalledWith({ type: "debug/get-trace" });

    const payload: TraceBundlePayload = {
      entries: [],
      settings: {
        verboseLoggingEnabled: true,
        changedAt: "2026-04-25T00:00:00.000Z"
      },
      updatedAt: "2026-04-25T00:01:00.000Z",
      timelineText: "timeline"
    };
    port.emitMessage({ type: "debug/trace", payload });

    await expect(pending).resolves.toEqual(payload);
  });
});
