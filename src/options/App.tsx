import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyDocumentLocale,
  getUiLanguage,
  resolveLocale,
  translate,
  type TranslationKey
} from "../shared/i18n";
import type { PanelToBackgroundMessage } from "../shared/messages";
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  loadExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings
} from "../shared/settings";
import type {
  ExtensionSettingsRecord,
  LocaleMode,
  TraceSettingsRecord
} from "../shared/types";
import {
  createPanelPortAdapter,
  type PanelPortAdapter,
  type TraceBundlePayload
} from "../sidepanel/panelPortAdapter";

const LANGUAGE_OPTIONS: LocaleMode[] = ["system", "zh-CN", "en"];

interface DebugTraceState {
  settings: TraceSettingsRecord;
  entryCount: number;
  updatedAt: string | null;
}

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettingsRecord>(DEFAULT_EXTENSION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [traceState, setTraceState] = useState<DebugTraceState | null>(null);
  const [traceUnavailable, setTraceUnavailable] = useState(false);
  const tracePortAdapterRef = useRef<PanelPortAdapter | null>(null);
  const manifest = chrome.runtime.getManifest();
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

  useEffect(() => {
    let disposed = false;

    const portAdapter = createPanelPortAdapter({
      onMessage: (message) => {
        if (message.type !== "debug/trace-state") {
          return;
        }

        if (disposed) {
          return;
        }

        setTraceState(message.payload);
        setTraceUnavailable(false);
      },
      onConnectionFailed: () => {
        if (!disposed) {
          setTraceUnavailable(true);
        }
      },
      onDisconnected: () => {
        if (!disposed) {
          setTraceUnavailable(true);
        }
      }
    });

    tracePortAdapterRef.current = portAdapter;
    portAdapter.connect();

    return () => {
      disposed = true;
      portAdapter.disconnect();
      if (tracePortAdapterRef.current === portAdapter) {
        tracePortAdapterRef.current = null;
      }
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

  function handleVerboseLoggingEnabledChange(enabled: boolean): void {
    const didPost =
      tracePortAdapterRef.current?.postMessage({
        type: "debug/set-trace-settings",
        payload: {
          verboseLoggingEnabled: enabled
        }
      } satisfies PanelToBackgroundMessage) ?? false;

    if (!didPost) {
      setTraceUnavailable(true);
    }
  }

  async function handleExportTrace(): Promise<void> {
    try {
      const portAdapter = tracePortAdapterRef.current;
      if (!portAdapter) {
        setTraceUnavailable(true);
        return;
      }

      const bundle = await portAdapter.requestTraceBundle();
      const timestamp = createExportTimestamp();
      downloadTextFile(
        `sidepanel-trace-${timestamp}.json`,
        buildTraceExportJson(bundle),
        "application/json"
      );
      downloadTextFile(
        `sidepanel-trace-${timestamp}.timeline.txt`,
        bundle.timelineText,
        "text/plain;charset=utf-8"
      );
      setTraceUnavailable(false);
    } catch {
      setTraceUnavailable(true);
    }
  }

  function handleClearTrace(): void {
    const didPost =
      tracePortAdapterRef.current?.postMessage({
        type: "debug/clear-trace"
      } satisfies PanelToBackgroundMessage) ?? false;

    if (!didPost) {
      setTraceUnavailable(true);
    }
  }

  const t = (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);
  const traceControlsDisabled = loading || traceState == null || traceUnavailable;
  const verboseStateKey: TranslationKey = traceState?.settings.verboseLoggingEnabled
    ? "trace.timeline.verbose.enabled"
    : "trace.timeline.verbose.disabled";

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
            <p className="settings-card__description">{t("options.section.debug.description")}</p>
          </div>
        </div>
        <label className="settings-toggle" htmlFor="debug-verbose-logging">
          <div className="settings-toggle__copy">
            <span className="settings-toggle__label">{t("options.debug.logging.label")}</span>
            <span className="settings-toggle__hint">{t("options.debug.logging.hint")}</span>
          </div>
          <input
            id="debug-verbose-logging"
            className="settings-toggle__input"
            type="checkbox"
            checked={traceState?.settings.verboseLoggingEnabled ?? false}
            onChange={(event) => {
              handleVerboseLoggingEnabledChange(event.target.checked);
            }}
            disabled={traceControlsDisabled}
          />
        </label>
        <div className="settings-debug__meta" aria-live="polite">
          <p className="settings-debug__metaItem">
            {t("trace.timeline.verbose", {
              value: t(verboseStateKey)
            })}
          </p>
          <p className="settings-debug__metaItem">
            {t("options.debug.entryCount", {
              count: traceState?.entryCount ?? 0
            })}
          </p>
          <p className="settings-debug__metaItem">
            {traceState?.updatedAt
              ? t("options.debug.updatedAt", {
                  value: new Date(traceState.updatedAt).toLocaleString(locale)
                })
              : t("options.debug.updatedAt.empty")}
          </p>
          {traceUnavailable ? (
            <p className="settings-status settings-status--warning">{t("options.debug.connectionUnavailable")}</p>
          ) : null}
        </div>
        <div className="settings-button-row">
          <button
            type="button"
            className="settings-button"
            onClick={() => {
              void handleExportTrace();
            }}
            disabled={traceControlsDisabled}
          >
            {t("sidepanel.toolbar.exportTrace")}
          </button>
          <button
            type="button"
            className="settings-button"
            onClick={handleClearTrace}
            disabled={traceControlsDisabled}
          >
            {t("sidepanel.toolbar.clearTrace")}
          </button>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-about-title">
        <div className="settings-card__header">
          <div>
            <h2 id="settings-about-title" className="settings-card__title">{t("options.section.about.title")}</h2>
            <p className="settings-card__description">{t("options.section.about.description")}</p>
          </div>
        </div>
        <div className="settings-debug__meta" aria-live="polite">
          <p className="settings-debug__metaItem">
            {t("options.about.name")}: {t("app.extensionName")}
          </p>
          <p className="settings-debug__metaItem">
            {t("options.about.version")}: {manifest.version}
          </p>
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

function createExportTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
}

function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildTraceExportJson(bundle: TraceBundlePayload): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      settings: bundle.settings,
      updatedAt: bundle.updatedAt,
      entries: bundle.entries
    },
    null,
    2
  );
}
