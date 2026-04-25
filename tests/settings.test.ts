import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  loadExtensionSettings,
  mergeExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings
} from "../src/shared/settings";

const storage = new Map<string, unknown>();

beforeEach(() => {
  storage.clear();
});

describe("settings", () => {
  it("returns default settings when storage is empty", async () => {
    const settings = await loadExtensionSettings({
      get: async (key: string) => ({ [key]: storage.get(key) })
    });

    expect(settings).toEqual(DEFAULT_EXTENSION_SETTINGS);
  });

  it("merges partial persisted settings with defaults", () => {
    const settings = mergeExtensionSettings({
      badge: {
        enabled: false
      }
    });

    expect(settings.badge.enabled).toBe(false);
    expect(settings.locale.mode).toBe(DEFAULT_EXTENSION_SETTINGS.locale.mode);
    expect(settings.updatedAt).toBe(DEFAULT_EXTENSION_SETTINGS.updatedAt);
  });

  it("persists settings with a fresh updatedAt", async () => {
    const savedSettings = await saveExtensionSettings(
      {
        ...DEFAULT_EXTENSION_SETTINGS,
        badge: {
          enabled: false
        }
      },
      {
        set: async (payload: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(payload)) {
            storage.set(key, value);
          }
        }
      }
    );

    expect(savedSettings.badge.enabled).toBe(false);
    expect(savedSettings.locale.mode).toBe(DEFAULT_EXTENSION_SETTINGS.locale.mode);
    expect(savedSettings.updatedAt).not.toBe(DEFAULT_EXTENSION_SETTINGS.updatedAt);
    expect(storage.get(EXTENSION_SETTINGS_STORAGE_KEY)).toEqual(savedSettings);
  });

  it("resets settings back to defaults", async () => {
    await resetExtensionSettings({
      set: async (payload: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(payload)) {
          storage.set(key, value);
        }
      }
    });

    expect(storage.get(EXTENSION_SETTINGS_STORAGE_KEY)).toMatchObject({
      badge: {
        enabled: true
      }
    });
  });
});
