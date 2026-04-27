import { DEFAULT_LOCALE_MODE } from "./i18n";
import type { ExtensionSettingsRecord, TabDisplaySize } from "./types";

interface ExtensionSettingsReader {
  get(key: string): Promise<Record<string, unknown>>;
}

interface ExtensionSettingsWriter {
  set(payload: Record<string, unknown>): Promise<void>;
}

export const EXTENSION_SETTINGS_STORAGE_KEY = "sidepanelExtensionSettings";
export const DEFAULT_TAB_DISPLAY_SIZE: TabDisplaySize = "medium";

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettingsRecord = {
  badge: {
    enabled: true
  },
  locale: {
    mode: DEFAULT_LOCALE_MODE
  },
  display: {
    tabDisplaySize: DEFAULT_TAB_DISPLAY_SIZE
  },
  updatedAt: new Date(0).toISOString()
};

function normalizeTabDisplaySize(value: unknown): TabDisplaySize {
  return value === "large" || value === "medium" || value === "small"
    ? value
    : DEFAULT_TAB_DISPLAY_SIZE;
}

export function mergeExtensionSettings(
  value: Partial<ExtensionSettingsRecord> | null | undefined
): ExtensionSettingsRecord {
  return {
    badge: {
      enabled: value?.badge?.enabled ?? DEFAULT_EXTENSION_SETTINGS.badge.enabled
    },
    locale: {
      mode: value?.locale?.mode ?? DEFAULT_EXTENSION_SETTINGS.locale.mode
    },
    display: {
      tabDisplaySize: normalizeTabDisplaySize(value?.display?.tabDisplaySize)
    },
    updatedAt: value?.updatedAt ?? DEFAULT_EXTENSION_SETTINGS.updatedAt
  };
}

export async function loadExtensionSettings(
  storage: ExtensionSettingsReader = chrome.storage.local
): Promise<ExtensionSettingsRecord> {
  const result = await storage.get(EXTENSION_SETTINGS_STORAGE_KEY);
  return mergeExtensionSettings(
    result[EXTENSION_SETTINGS_STORAGE_KEY] as Partial<ExtensionSettingsRecord> | undefined
  );
}

export async function saveExtensionSettings(
  settings: ExtensionSettingsRecord,
  storage: ExtensionSettingsWriter = chrome.storage.local
): Promise<ExtensionSettingsRecord> {
  const normalizedSettings: ExtensionSettingsRecord = {
    badge: {
      enabled: settings.badge.enabled
    },
    locale: {
      mode: settings.locale.mode
    },
    display: {
      tabDisplaySize: normalizeTabDisplaySize(settings.display.tabDisplaySize)
    },
    updatedAt: new Date().toISOString()
  };

  await storage.set({
    [EXTENSION_SETTINGS_STORAGE_KEY]: normalizedSettings
  });

  return normalizedSettings;
}

export async function resetExtensionSettings(
  storage: ExtensionSettingsWriter = chrome.storage.local
): Promise<ExtensionSettingsRecord> {
  return await saveExtensionSettings(DEFAULT_EXTENSION_SETTINGS, storage);
}
