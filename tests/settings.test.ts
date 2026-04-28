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
const mockData = {
  persistedDisplayLarge: {
    display: {
      tabDisplaySize: "large"
    }
  },
  persistedInvalidDisplay: {
    display: {
      tabDisplaySize: "huge"
    }
  },
  persistedHoveredPreviewDisabled: {
    display: {
      hoveredTabPreviewEnabled: false
    }
  }
} as const;

beforeEach(() => {
  storage.clear();
});

describe("settings", () => {
  describe("正常路径", () => {
    it("returns default settings when storage is empty", async () => {
      const settings = await loadExtensionSettings({
        get: async (key: string) => ({ [key]: storage.get(key) })
      });

      expect(settings).toEqual(DEFAULT_EXTENSION_SETTINGS);
    });

    it("persists settings with a fresh updatedAt", async () => {
      const savedSettings = await saveExtensionSettings(
        {
          ...DEFAULT_EXTENSION_SETTINGS,
          badge: {
            enabled: false
          },
          display: {
            ...DEFAULT_EXTENSION_SETTINGS.display,
            tabDisplaySize: "large"
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
      expect(savedSettings.display.tabDisplaySize).toBe("large");
      expect(savedSettings.display.hoveredTabPreviewEnabled).toBe(true);
      expect(savedSettings.updatedAt).not.toBe(DEFAULT_EXTENSION_SETTINGS.updatedAt);
      expect(storage.get(EXTENSION_SETTINGS_STORAGE_KEY)).toEqual(savedSettings);
    });

    it("reads back a persisted display size", async () => {
      storage.set(EXTENSION_SETTINGS_STORAGE_KEY, {
        ...DEFAULT_EXTENSION_SETTINGS,
        ...mockData.persistedDisplayLarge
      });

      const settings = await loadExtensionSettings({
        get: async (key: string) => ({ [key]: storage.get(key) })
      });

      expect(settings.display.tabDisplaySize).toBe("large");
    });

    it("reads back a persisted hovered preview setting", async () => {
      storage.set(EXTENSION_SETTINGS_STORAGE_KEY, {
        ...DEFAULT_EXTENSION_SETTINGS,
        display: {
          ...DEFAULT_EXTENSION_SETTINGS.display,
          ...mockData.persistedHoveredPreviewDisabled.display
        }
      });

      const settings = await loadExtensionSettings({
        get: async (key: string) => ({ [key]: storage.get(key) })
      });

      expect(settings.display.hoveredTabPreviewEnabled).toBe(false);
    });
  });

  describe("边界条件", () => {
    it("merges partial persisted settings with defaults", () => {
      const settings = mergeExtensionSettings({
        badge: {
          enabled: false
        }
      });

      expect(settings.badge.enabled).toBe(false);
      expect(settings.locale.mode).toBe(DEFAULT_EXTENSION_SETTINGS.locale.mode);
      expect(settings.display.tabDisplaySize).toBe(DEFAULT_EXTENSION_SETTINGS.display.tabDisplaySize);
      expect(settings.updatedAt).toBe(DEFAULT_EXTENSION_SETTINGS.updatedAt);
    });

    it("fills missing display settings with medium", () => {
      const settings = mergeExtensionSettings({
        badge: {
          enabled: false
        },
        locale: {
          mode: "en"
        }
      });

      expect(settings.display.tabDisplaySize).toBe("medium");
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
        },
        display: {
          tabDisplaySize: "medium"
        }
      });
    });
  });

  describe("异常处理", () => {
    it("normalizes an invalid display size to medium", () => {
      const settings = mergeExtensionSettings(mockData.persistedInvalidDisplay as never);

      expect(settings.display.tabDisplaySize).toBe("medium");
    });
  });
});
