import { translate, type SupportedLocale } from "../shared/i18n";
import { getLastFocusedWindowId, queryAllTabGroupsForTabs } from "../background/chromeQueries";
import { normalizeChromeTab } from "../shared/domain/normalizeTab";
import { createSnapshot, createStateFromTabs } from "../shared/domain/tabState";
import type { TabRecord, TabStoreSnapshot } from "../shared/types";

const BOOTSTRAP_CHUNK_SIZE = 80;

export interface PanelBootstrapAdapter {
  bootstrap(params: {
    onStart: () => void;
    onProgress: (loaded: number, total: number) => void;
    onSnapshot: (snapshot: TabStoreSnapshot) => void;
    onError: (message: string) => void;
    shouldStop: () => boolean;
  }): Promise<void>;
}

export function createPanelBootstrapAdapter(locale: SupportedLocale): PanelBootstrapAdapter {
  return {
    async bootstrap(params): Promise<void> {
      const { onStart, onProgress, onSnapshot, onError, shouldStop } = params;

      try {
        onStart();

        const tabs = await chrome.tabs.query({});
        const [focusedWindowId, groups] = await Promise.all([
          getLastFocusedWindowId(),
          queryAllTabGroupsForTabs(tabs)
        ]);

        if (shouldStop()) {
          return;
        }

        const normalizedTabs = await hydrateLocalTabs({
          tabs,
          locale,
          onProgress,
          shouldStop
        });

        if (!normalizedTabs) {
          return;
        }

        onSnapshot(createSnapshot(createStateFromTabs(normalizedTabs, focusedWindowId, groups), 1));
      } catch {
        if (shouldStop()) {
          return;
        }

        onError(translate(locale, "error.panel.bootstrapFailed"));
      }
    }
  };
}

async function hydrateLocalTabs(params: {
  tabs: readonly chrome.tabs.Tab[];
  locale: SupportedLocale;
  onProgress: (loaded: number, total: number) => void;
  shouldStop: () => boolean;
}): Promise<TabRecord[] | null> {
  const { tabs, locale, onProgress, shouldStop } = params;
  const normalizedTabs: TabRecord[] = [];
  onProgress(0, tabs.length);

  for (let index = 0; index < tabs.length; index += BOOTSTRAP_CHUNK_SIZE) {
    const chunk = tabs.slice(index, index + BOOTSTRAP_CHUNK_SIZE);
    normalizedTabs.push(...normalizeTabChunk(chunk, locale));

    if (shouldStop()) {
      return null;
    }

    onProgress(Math.min(index + chunk.length, tabs.length), tabs.length);

    if (index + BOOTSTRAP_CHUNK_SIZE < tabs.length) {
      await nextPaint();
    }
  }

  return normalizedTabs;
}

function normalizeTabChunk(
  tabs: readonly chrome.tabs.Tab[],
  locale: SupportedLocale
): TabRecord[] {
  return tabs.map((tab) => normalizeChromeTab(tab, locale)).filter((tab): tab is TabRecord => Boolean(tab));
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
