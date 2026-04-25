import { useEffect, useMemo, useState } from "react";
import {
  applyDocumentLocale,
  getUiLanguage,
  resolveLocale,
  translate,
  type TranslationKey
} from "../shared/i18n";
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  loadExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings
} from "../shared/settings";
import type { ExtensionSettingsRecord, LocaleMode } from "../shared/types";

const LANGUAGE_OPTIONS: LocaleMode[] = ["system", "zh-CN", "en"];

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettingsRecord>(DEFAULT_EXTENSION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const locale = useMemo(
    () => resolveLocale({ settings, uiLanguage: getUiLanguage() }),
    [settings]
  );

  useEffect(() => {
    applyDocumentLocale({
      locale,
      titleKey: "app.settingsTitle"
    });

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
  }, [locale]);

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

  async function handleLocaleModeChange(mode: LocaleMode): Promise<void> {
    const nextSettings = await saveExtensionSettings({
      ...settings,
      locale: {
        mode
      }
    });
    setSettings(nextSettings);
  }

  async function handleResetSettings(): Promise<void> {
    const nextSettings = await resetExtensionSettings();
    setSettings(nextSettings);
  }

  const t = (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);

  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <div>
          <p className="settings-page__eyebrow">{t("options.eyebrow")}</p>
          <h1 className="settings-page__title">{t("options.title")}</h1>
          <p className="settings-page__description">{t("options.description")}</p>
        </div>
      </header>

      <section className="settings-card" aria-labelledby="settings-language-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-language-title" className="settings-card__title">{t("options.section.language.title")}</h2>
            <p className="settings-card__description">{t("options.section.language.description")}</p>
          </div>
        </div>
        <label className="settings-select" htmlFor="locale-mode">
          <div className="settings-select__copy">
            <span className="settings-toggle__label">{t("options.language.label")}</span>
            <span className="settings-toggle__hint">{t("options.language.hint")}</span>
          </div>
          <select
            id="locale-mode"
            className="settings-select__input"
            value={settings.locale.mode}
            onChange={(event) => {
              void handleLocaleModeChange(event.target.value as LocaleMode);
            }}
            disabled={loading}
          >
            {LANGUAGE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {t(`options.language.option.${mode}` as TranslationKey)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="settings-card" aria-labelledby="settings-badge-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-badge-title" className="settings-card__title">{t("options.section.badge.title")}</h2>
            <p className="settings-card__description">{t("options.section.badge.description")}</p>
          </div>
        </div>
        <label className="settings-toggle" htmlFor="badge-enabled">
          <div className="settings-toggle__copy">
            <span className="settings-toggle__label">{t("options.badge.label")}</span>
            <span className="settings-toggle__hint">{t("options.badge.hint")}</span>
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
            <h2 id="settings-ui-title" className="settings-card__title">{t("options.section.ui.title")}</h2>
            <p className="settings-card__description">{t("options.comingSoon")}</p>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-search-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-search-title" className="settings-card__title">{t("options.section.search.title")}</h2>
            <p className="settings-card__description">{t("options.comingSoon")}</p>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-debug-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-debug-title" className="settings-card__title">{t("options.section.debug.title")}</h2>
            <p className="settings-card__description">{t("options.comingSoon")}</p>
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
          {t("options.reset")}
        </button>
      </footer>
    </main>
  );
}
