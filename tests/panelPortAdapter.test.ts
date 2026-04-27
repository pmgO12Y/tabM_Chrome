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

  it("should ignore duplicate connect calls while a port is active", () => {
    const port = createPort();
    const connectPort = vi.fn(() => port as unknown as chrome.runtime.Port);

    const adapter = createPanelPortAdapter({
      connectPort,
      onMessage: vi.fn(),
      onConnectionFailed: vi.fn(),
      onDisconnected: vi.fn()
    });

    adapter.connect();
    adapter.connect();

    expect(connectPort).toHaveBeenCalledTimes(1);
  });

  it("should cancel a pending reconnect when connect is called manually", () => {
    vi.useFakeTimers();
    const port1 = createPort();
    const port2 = createPort();
    const connectPort = vi.fn()
      .mockReturnValueOnce(port1 as unknown as chrome.runtime.Port)
      .mockReturnValueOnce(port2 as unknown as chrome.runtime.Port);

    const adapter = createPanelPortAdapter({
      connectPort,
      onMessage: vi.fn(),
      onConnectionFailed: vi.fn(),
      onDisconnected: vi.fn(),
      reconnectDelayMs: 10
    });

    adapter.connect();
    port1.emitDisconnect();
    adapter.connect();
    vi.advanceTimersByTime(10);

    expect(connectPort).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

});
