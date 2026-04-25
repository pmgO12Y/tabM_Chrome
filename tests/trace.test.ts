import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTraceExportBundle,
  clearPersistedTrace,
  formatPersistedTraceTimeline,
  getTraceSettings,
  getTraceState,
  setVerboseLoggingEnabled,
  traceBackgroundEvent,
  tracePanelEvent
} from "../src/background/trace";

const storage = new Map<string, unknown>();

beforeEach(async () => {
  storage.clear();
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
        set: vi.fn(async (payload: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(payload)) {
            storage.set(key, value);
          }
        }),
        remove: vi.fn(async (key: string) => {
          storage.delete(key);
        })
      }
    }
  });
  await clearPersistedTrace();
  await setVerboseLoggingEnabled(false);
});

describe("trace", () => {
  it("persists verbose logging setting", async () => {
    await setVerboseLoggingEnabled(true);
    await expect(getTraceSettings()).resolves.toMatchObject({
      verboseLoggingEnabled: true
    });
  });

  it("records panel events only when verbose logging is enabled", async () => {
    tracePanelEvent({
      event: "panel/search-updated",
      details: {
        searchTerm: "abc"
      }
    });

    let bundle = await buildTraceExportBundle();
    expect(bundle.entries.some((entry) => entry.event === "panel/search-updated")).toBe(false);

    await setVerboseLoggingEnabled(true);
    tracePanelEvent({
      event: "panel/search-updated",
      details: {
        searchTerm: "abc"
      }
    });

    bundle = await buildTraceExportBundle();
    expect(bundle.entries.some((entry) => entry.event === "panel/search-updated")).toBe(true);
  });

  it("keeps settings after clearing entries", async () => {
    await setVerboseLoggingEnabled(true);
    traceBackgroundEvent("bg/test-event", {
      foo: "bar"
    });

    await clearPersistedTrace();

    const bundle = await buildTraceExportBundle();
    expect(bundle.entries).toEqual([]);
    expect(bundle.settings.verboseLoggingEnabled).toBe(true);
  });

  it("builds timeline text with source and category", async () => {
    await setVerboseLoggingEnabled(true);
    traceBackgroundEvent("bg/test-event", { foo: "bar" }, { category: "trace" });
    tracePanelEvent({
      event: "panel/search-updated",
      details: { searchTerm: "abc" },
      category: "search"
    });

    const timeline = await formatPersistedTraceTimeline();
    expect(timeline).toContain("Chrome Sidepanel Debug Timeline");
    expect(timeline).toContain("bg/test-event");
    expect(timeline).toContain("panel/search-updated");
    expect(timeline).toContain("[background]");
    expect(timeline).toContain("[sidepanel]");
  });

  it("returns trace state summary", async () => {
    await setVerboseLoggingEnabled(true);
    traceBackgroundEvent("bg/test-event", { value: 1 });

    const state = await getTraceState();
    expect(state.settings.verboseLoggingEnabled).toBe(true);
    expect(state.entryCount).toBeGreaterThan(0);
    expect(state.updatedAt).not.toBeNull();
  });
});
