import type { BackgroundToPanelMessage } from "../shared/messages";
import type { StorePatch, TabStoreSnapshot, TraceSettingsRecord } from "../shared/types";

export function createPanelPortHub() {
  const panelPorts = new Set<chrome.runtime.Port>();

  return {
    register(port: chrome.runtime.Port): void {
      panelPorts.add(port);
    },
    unregister(port: chrome.runtime.Port): void {
      panelPorts.delete(port);
    },
    sendSnapshot(port: chrome.runtime.Port, snapshot: TabStoreSnapshot): void {
      safeSend(port, {
        type: "panel/snapshot",
        payload: {
          snapshot
        }
      });
    },
    sendError(port: chrome.runtime.Port, message: string): void {
      safeSend(port, {
        type: "panel/error",
        payload: {
          message
        }
      });
    },
    sendTraceState(
      port: chrome.runtime.Port,
      payload: {
        settings: TraceSettingsRecord;
        entryCount: number;
        updatedAt: string | null;
      }
    ): void {
      safeSend(port, {
        type: "debug/trace-state",
        payload
      });
    },
    broadcastTraceState(payload: {
      settings: TraceSettingsRecord;
      entryCount: number;
      updatedAt: string | null;
    }): void {
      broadcast({
        type: "debug/trace-state",
        payload
      });
    },
    broadcastPatch(patch: StorePatch): void {
      broadcast({
        type: "panel/patch",
        payload: patch
      });
    }
  };

  function broadcast(message: BackgroundToPanelMessage): void {
    for (const port of panelPorts) {
      safeSend(port, message);
    }
  }

  function safeSend(port: chrome.runtime.Port, message: BackgroundToPanelMessage): void {
    try {
      port.postMessage(message);
    } catch {
      panelPorts.delete(port);
    }
  }
}
