import { useEffect, useRef } from "react";
import { resolveActiveGroupAutoExpand, selectCurrentActiveGroupId } from "../shared/domain/selectors";
import type { TabCommand, TabStoreSnapshot } from "../shared/types";

export function useActiveGroupAutoExpand(params: {
  snapshot: TabStoreSnapshot;
  currentActiveTabId: number | null;
  dispatchCommand: (command: TabCommand) => void;
}): void {
  const { snapshot, currentActiveTabId, dispatchCommand } = params;
  const previousActiveTabIdRef = useRef<number | null>(null);
  const hasCompletedInitialAutoExpandCheckRef = useRef(false);
  const currentActiveGroupId = selectCurrentActiveGroupId(snapshot);

  useEffect(() => {
    const group = currentActiveGroupId == null ? null : snapshot.groupsById[currentActiveGroupId];
    const decision = resolveActiveGroupAutoExpand({
      currentActiveTabId,
      previousActiveTabId: previousActiveTabIdRef.current,
      hasCompletedInitialCheck: hasCompletedInitialAutoExpandCheckRef.current,
      currentActiveGroupId,
      hasCurrentActiveGroupRecord: Boolean(group),
      isCurrentActiveGroupCollapsed: Boolean(group?.collapsed)
    });

    if (decision.shouldConsumeCheck) {
      previousActiveTabIdRef.current = currentActiveTabId;
      hasCompletedInitialAutoExpandCheckRef.current = true;
    }

    if (!decision.shouldAutoExpand || currentActiveGroupId == null) {
      return;
    }

    dispatchCommand({
      type: "group/set-collapsed",
      groupId: currentActiveGroupId,
      collapsed: false
    });
  }, [currentActiveGroupId, currentActiveTabId, dispatchCommand, snapshot]);
}
