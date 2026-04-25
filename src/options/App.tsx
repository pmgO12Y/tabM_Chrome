import { useEffect, useState } from "react";
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  loadExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings
} from "../shared/settings";
import type { ExtensionSettingsRecord } from "../shared/types";

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettingsRecord>(DEFAULT_EXTENSION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "设置";

    let disposed = false;

    const initialize = async () => {
      const nextSettings = await loadExtensionSettings();
      if (disposed) {
        return;
      }

      setSettings(nextSettings);
      setLoading(false);
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      const settingsChange = changes[EXTENSION_SETTINGS_STORAGE_KEY];
      if (!settingsChange) {
        return;
      }

      setSettings(
        (settingsChange.newValue as ExtensionSettingsRecord | undefined) ?? DEFAULT_EXTENSION_SETTINGS
      );
      setLoading(false);
    };

    void initialize();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      disposed = true;
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  async function handleBadgeEnabledChange(enabled: boolean): Promise<void> {
    const nextSettings = await saveExtensionSettings({
      ...settings,
      badge: {
        ...settings.badge,
        enabled
      }
    });
    setSettings(nextSettings);
  }

  async function handleResetSettings(): Promise<void> {
    const nextSettings = await resetExtensionSettings();
    setSettings(nextSettings);
  }

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <div>
          <p className="settings-page__eyebrow">Chrome 扩展</p>
          <h1 className="settings-page__title">设置</h1>
          <p className="settings-page__description">修改后立即生效。</p>
        </div>
      </header>

      <section className="settings-card" aria-labelledby="settings-badge-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-badge-title" className="settings-card__title">徽标显示</h2>
            <p className="settings-card__description">控制工具栏图标上的数字徽标是否显示。</p>
          </div>
        </div>
        <label className="settings-toggle" htmlFor="badge-enabled">
          <div className="settings-toggle__copy">
            <span className="settings-toggle__label">显示工具栏数字徽标</span>
            <span className="settings-toggle__hint">关闭后不再显示当前标签总数。</span>
          </div>
          <input
            id="badge-enabled"
            className="settings-toggle__input"
            type="checkbox"
            checked={settings.badge.enabled}
            onChange={(event) => {
              void handleBadgeEnabledChange(event.target.checked);
            }}
            disabled={loading}
          />
        </label>
      </section>

      <section className="settings-card" aria-labelledby="settings-ui-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-ui-title" className="settings-card__title">界面显示</h2>
            <p className="settings-card__description">即将支持</p>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-search-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-search-title" className="settings-card__title">搜索交互</h2>
            <p className="settings-card__description">即将支持</p>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-debug-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-debug-title" className="settings-card__title">调试选项</h2>
            <p className="settings-card__description">即将支持</p>
          </div>
        </div>
      </section>

      <footer className="settings-page__footer">
        <button
          type="button"
          className="settings-page__reset"
          onClick={() => {
            void handleResetSettings();
          }}
          disabled={loading}
        >
          恢复默认设置
        </button>
      </footer>
    </main>
  );
}
