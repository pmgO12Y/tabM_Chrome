import type { TraceEntryRecord } from "../shared/types";

export {};

declare global {
  var __SIDE_PANEL_TRACE__:
    | {
        clear: () => Promise<void>;
        getEntries: () => TraceEntryRecord[];
        getPersistedEntries: () => Promise<TraceEntryRecord[]>;
      }
    | undefined;
}
