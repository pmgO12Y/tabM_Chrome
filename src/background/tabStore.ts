import { createSnapshot, createStateFromTabs, createEmptyState, applyPatch } from "../shared/domain/tabState";
import type { StorePatch, TabGroupRecord, TabRecord, TabStoreSnapshot, TabStoreState } from "../shared/types";

export class BackgroundTabStore {
  private state: TabStoreState = createEmptyState();
  private version = 0;

  initialize(tabs: TabRecord[], focusedWindowId: number | null, groups: TabGroupRecord[] = []): void {
    this.state = createStateFromTabs(tabs, focusedWindowId, groups);
    this.version += 1;
  }

  getSnapshot(): TabStoreSnapshot {
    return createSnapshot(this.state, this.version);
  }

  hasTab(tabId: number): boolean {
    return Boolean(this.state.tabsById[tabId]);
  }

  getTab(tabId: number): TabRecord | undefined {
    return this.state.tabsById[tabId];
  }

  getWindowTabIds(windowId: number): number[] {
    return [...(this.state.windowTabIds[windowId] ?? [])];
  }

  getGroup(groupId: number): TabGroupRecord | undefined {
    return this.state.groupsById[groupId];
  }

  upsertTab(tab: TabRecord): StorePatch | null {
    return this.commitPatch({
      type: "tab/upsert",
      tab
    });
  }

  removeTab(tabId: number, windowId: number): StorePatch | null {
    return this.commitPatch({
      type: "tab/remove",
      tabId,
      windowId
    });
  }

  upsertGroup(group: TabGroupRecord): StorePatch | null {
    return this.commitPatch({
      type: "group/upsert",
      group
    });
  }

  removeGroup(groupId: number): StorePatch | null {
    return this.commitPatch({
      type: "group/remove",
      groupId
    });
  }

  focusWindow(windowId: number | null): StorePatch | null {
    if (windowId == null) {
      return null;
    }

    return this.commitPatch({
      type: "window/focus",
      windowId
    });
  }

  removeWindow(windowId: number): StorePatch | null {
    return this.commitPatch({
      type: "window/remove",
      windowId
    });
  }

  setActiveTab(windowId: number, tabId: number): StorePatch[] {
    const patches: StorePatch[] = [];
    const currentIds = this.state.windowTabIds[windowId] ?? [];
    const currentActiveId = currentIds.find((candidateId) => this.state.tabsById[candidateId]?.active);

    if (currentActiveId === tabId) {
      return patches;
    }

    if (currentActiveId != null) {
      const previous = this.state.tabsById[currentActiveId];
      const patch = this.upsertTab({
        ...previous,
        active: false
      });
      if (patch) {
        patches.push(patch);
      }
    }

    const next = this.state.tabsById[tabId];
    if (next) {
      const patch = this.upsertTab({
        ...next,
        active: true
      });
      if (patch) {
        patches.push(patch);
      }
    }

    return patches;
  }

  private commitPatch(patch: StorePatch): StorePatch | null {
    const nextState = applyPatch(this.state, patch);
    if (nextState === this.state) {
      return null;
    }

    this.state = nextState;
    this.version += 1;
    return patch;
  }
}
