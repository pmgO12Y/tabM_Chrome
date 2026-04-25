import { applyPatch, createEmptyState, createSnapshot } from "../shared/domain/tabState";
import type { BackgroundToPanelMessage } from "../shared/messages";
import type { StorePatch, TabStoreSnapshot, TraceSettingsRecord } from "../shared/types";

const EMPTY_SNAPSHOT: TabStoreSnapshot = createSnapshot(createEmptyState(), 0);
const INITIAL_TRACE_SETTINGS: TraceSettingsRecord = {
  verboseLoggingEnabled: false,
  changedAt: new Date(0).toISOString()
};

export interface BootstrapProgress {
  phase: "querying" | "hydrating";
  loaded: number;
  total: number | null;
}

export interface PanelTraceState {
  settings: TraceSettingsRecord;
  entryCount: number;
  updatedAt: string | null;
}

export interface PanelControllerState {
  snapshot: TabStoreSnapshot;
  errorMessage: string | null;
  bootstrapProgress: BootstrapProgress | null;
  isInteractive: boolean;
  hasReceivedRemoteState: boolean;
  traceState: PanelTraceState;
  connectionEpoch: number;
}

export type PanelControllerEvent =
  | {
      type: "bootstrap/start";
    }
  | {
      type: "resync/requested";
    }
  | {
      type: "bootstrap/progress";
      loaded: number;
      total: number;
    }
  | {
      type: "bootstrap/snapshot";
      snapshot: TabStoreSnapshot;
    }
  | {
      type: "bootstrap/error";
      message: string;
    }
  | {
      type: "background/message";
      message: BackgroundToPanelMessage;
    }
  | {
      type: "connection/disconnected";
    }
  | {
      type: "connection/failed";
    }
  | {
      type: "connection/reconnect-requested";
    };

export function createInitialPanelControllerState(): PanelControllerState {
  return {
    snapshot: EMPTY_SNAPSHOT,
    errorMessage: null,
    bootstrapProgress: createBootstrapProgress("querying", 0, null),
    isInteractive: false,
    hasReceivedRemoteState: false,
    traceState: {
      settings: { ...INITIAL_TRACE_SETTINGS },
      entryCount: 0,
      updatedAt: null
    },
    connectionEpoch: 0
  };
}

export function reducePanelControllerState(
  state: PanelControllerState,
  event: PanelControllerEvent
): PanelControllerState {
  switch (event.type) {
    case "resync/requested":
      return {
        ...state,
        errorMessage: null,
        bootstrapProgress: createBootstrapProgress("querying", 0, null),
        isInteractive: false,
        hasReceivedRemoteState: false,
        connectionEpoch: state.connectionEpoch + 1
      };
    case "bootstrap/start":
      return {
        ...state,
        errorMessage: null,
        bootstrapProgress: createBootstrapProgress("querying", 0, null)
      };
    case "bootstrap/progress":
      if (state.hasReceivedRemoteState) {
        return state;
      }

      return {
        ...state,
        bootstrapProgress: createBootstrapProgress("hydrating", event.loaded, event.total)
      };
    case "bootstrap/snapshot":
      if (state.hasReceivedRemoteState) {
        return state;
      }

      return {
        ...state,
        snapshot: event.snapshot,
        bootstrapProgress: null
      };
    case "bootstrap/error":
      if (state.hasReceivedRemoteState) {
        return state;
      }

      return {
        ...state,
        errorMessage: event.message,
        bootstrapProgress: null
      };
    case "background/message":
      return reduceBackgroundMessage(state, event.message);
    case "connection/disconnected":
      return {
        ...state,
        isInteractive: false,
        errorMessage: null
      };
    case "connection/failed":
      return {
        ...state,
        isInteractive: false,
        errorMessage: "连接后台脚本失败，正在重试。"
      };
    case "connection/reconnect-requested":
      return {
        ...state,
        connectionEpoch: state.connectionEpoch + 1
      };
  }
}

function reduceBackgroundMessage(
  state: PanelControllerState,
  message: BackgroundToPanelMessage
): PanelControllerState {
  switch (message.type) {
    case "panel/snapshot":
      if (message.payload.snapshot.version < state.snapshot.version) {
        return state;
      }

      return {
        ...state,
        snapshot: message.payload.snapshot,
        errorMessage: null,
        bootstrapProgress: null,
        isInteractive: true,
        hasReceivedRemoteState: true
      };
    case "panel/patch":
      return {
        ...state,
        snapshot: applyStorePatch(state.snapshot, message.payload),
        errorMessage: null,
        isInteractive: true,
        hasReceivedRemoteState: true
      };
    case "panel/error":
      return {
        ...state,
        errorMessage: message.payload.message
      };
    case "debug/trace-state":
      return {
        ...state,
        traceState: {
          settings: message.payload.settings,
          entryCount: message.payload.entryCount,
          updatedAt: message.payload.updatedAt
        }
      };
    case "debug/trace":
      return {
        ...state,
        traceState: {
          settings: message.payload.settings,
          entryCount: message.payload.entries.length,
          updatedAt: message.payload.updatedAt
        }
      };
  }
}

function createBootstrapProgress(
  phase: BootstrapProgress["phase"],
  loaded: number,
  total: number | null
): BootstrapProgress {
  return {
    phase,
    loaded,
    total
  };
}

function applyStorePatch(snapshot: TabStoreSnapshot, patch: StorePatch): TabStoreSnapshot {
  const nextState = applyPatch(snapshot, patch);
  if (nextState === snapshot) {
    return snapshot;
  }

  return {
    ...nextState,
    version: snapshot.version + 1
  };
}
