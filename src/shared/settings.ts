import type { ExtensionSettingsRecord } from "./types";

interface ExtensionSettingsReader {
  get(key: string): Promise<Record<string, unknown>>;
}

interface ExtensionSettingsWriter {
  set(payload: Record<string, unknown>): Promise<void>;
}

export const EXTENSION_SETTINGS_STORAGE_KEY = "sidepanelExtensionSettings";

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettingsRecord = {
  badge: {
    enabled: true
  },
  updatedAt: new Date(0).toISOString()
};

export function mergeExtensionSettings(
  value: Partial<ExtensionSettingsRecord> | null | undefined
): ExtensionSettingsRecord {
  return {
    badge: {
      enabled: value?.badge?.enabled ?? DEFAULT_EXTENSION_SETTINGS.badge.enabled
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
