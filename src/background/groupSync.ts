import { NO_TAB_GROUP_ID } from "../shared/defaults";
import type { TabGroupRecord, TabRecord } from "../shared/types";

export interface MissingGroupBackfillDeps {
  hasKnownGroup: () => boolean;
  queryGroup: () => Promise<TabGroupRecord>;
  upsertGroup: (group: TabGroupRecord) => void;
  removeGroup: () => void;
}

export interface GroupSnapshotSyncDeps {
  queryGroup: () => Promise<TabGroupRecord>;
  queryTabsInGroup: () => Promise<TabRecord[]>;
  upsertGroup: (group: TabGroupRecord) => void;
  upsertTab: (tab: TabRecord) => void;
  removeGroup: () => void;
}

export async function backfillMissingGroupForTab(
  tab: TabRecord,
  deps: MissingGroupBackfillDeps
): Promise<void> {
  if (tab.groupId === NO_TAB_GROUP_ID || deps.hasKnownGroup()) {
    return;
  }

  try {
    deps.upsertGroup(await deps.queryGroup());
  } catch {
    deps.removeGroup();
  }
}

export async function syncGroupSnapshot(deps: GroupSnapshotSyncDeps): Promise<void> {
  try {
    const group = await deps.queryGroup();
    deps.upsertGroup(group);

    try {
      const tabs = await deps.queryTabsInGroup();
      for (const tab of tabs) {
        deps.upsertTab(tab);
      }
    } catch {
      return;
    }
  } catch {
    deps.removeGroup();
  }
}
