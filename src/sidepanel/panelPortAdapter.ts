import { PANEL_PORT_NAME } from "../shared/defaults";
import type { BackgroundToPanelMessage, PanelToBackgroundMessage } from "../shared/messages";

export type TraceBundlePayload = Extract<BackgroundToPanelMessage, { type: "debug/trace" }>['payload'];

export interface PanelPortAdapter {
  connect(): void;
  disconnect(): void;
  postMessage(message: PanelToBackgroundMessage): boolean;
  requestTraceBundle(): Promise<TraceBundlePayload>;
}

export interface PanelPortAdapterOptions {
  connectPort?: () => chrome.runtime.Port;
  onMessage: (message: BackgroundToPanelMessage) => void;
  onConnectionFailed: () => void;
  onDisconnected: () => void;
  reconnectDelayMs?: number;
}

export function createPanelPortAdapter(options: PanelPortAdapterOptions): PanelPortAdapter {
  const connectPort = options.connectPort ?? (() => chrome.runtime.connect({ name: PANEL_PORT_NAME }));
  const reconnectDelayMs = options.reconnectDelayMs ?? 400;

  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let activePort: chrome.runtime.Port | null = null;
  let pendingTraceRequest: {
    resolve: (payload: TraceBundlePayload) => void;
    reject: (error: Error) => void;
  } | null = null;

  const clearReconnectTimer = (): void => {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const rejectPendingTraceRequest = (error: Error): void => {
    pendingTraceRequest?.reject(error);
    pendingTraceRequest = null;
  };

  const handleMessage = (message: BackgroundToPanelMessage): void => {
    if (message.type === "debug/trace") {
      pendingTraceRequest?.resolve(message.payload);
      pendingTraceRequest = null;
    }

    options.onMessage(message);
  };

  const scheduleReconnect = (): void => {
    if (disposed || reconnectTimer != null) {
      return;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs);
  };

  const handleDisconnect = (): void => {
    if (activePort) {
      activePort.onMessage.removeListener(handleMessage);
      activePort.onDisconnect.removeListener(handleDisconnect);
      activePort = null;
    }

    rejectPendingTraceRequest(new Error("后台连接已断开"));

    if (disposed) {
      return;
    }

    options.onDisconnected();
    scheduleReconnect();
  };

  const connect = (): void => {
    if (disposed || activePort) {
      return;
    }

    clearReconnectTimer();

    try {
      activePort = connectPort();
    } catch {
      options.onConnectionFailed();
      scheduleReconnect();
      return;
    }

    activePort.onMessage.addListener(handleMessage);
    activePort.onDisconnect.addListener(handleDisconnect);
  };

  return {
    connect,
    disconnect(): void {
      disposed = true;
      clearReconnectTimer();
      rejectPendingTraceRequest(new Error("后台连接已断开"));

      const port = activePort;
      activePort = null;
      if (!port) {
        return;
      }

      port.onMessage.removeListener(handleMessage);
      port.onDisconnect.removeListener(handleDisconnect);
      port.disconnect();
    },
    postMessage(message: PanelToBackgroundMessage): boolean {
      if (!activePort) {
        return false;
      }

      activePort.postMessage(message);
      return true;
    },
    async requestTraceBundle(): Promise<TraceBundlePayload> {
      const port = activePort;
      if (!port) {
        throw new Error("后台连接不可用");
      }

      return await new Promise<TraceBundlePayload>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingTraceRequest = null;
          reject(new Error("获取调试日志超时"));
        }, 5000);

        pendingTraceRequest = {
          resolve: (payload) => {
          clearTimeout(timeout);
            resolve(payload);
          },
          reject: (error) => {
          clearTimeout(timeout);
            reject(error);
          }
        };

        port.postMessage({
          type: "debug/get-trace"
        } satisfies PanelToBackgroundMessage);
      });
    }
  };
}
