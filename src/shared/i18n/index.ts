import type {
  ExtensionSettingsRecord,
  LocaleMode,
  LocalizedTextRecord,
  SupportedLocale
} from "../types";
import { messages } from "./messages";

export type { LocaleMode, SupportedLocale } from "../types";

export type TranslationKey = keyof typeof messages.en;

const DEFAULT_UI_LANGUAGE = "en";

export const DEFAULT_LOCALE_MODE: LocaleMode = "system";

export const DEFAULT_RESOLVED_LOCALE: SupportedLocale = "en";

let runtimeLocale: SupportedLocale = DEFAULT_RESOLVED_LOCALE;

export function resolveLocaleMode(settings: ExtensionSettingsRecord): LocaleMode {
  return settings.locale.mode;
}

export function resolveSystemLocale(language: string | null | undefined): SupportedLocale {
  const normalizedLanguage = (language ?? DEFAULT_UI_LANGUAGE).trim().toLowerCase();
  return normalizedLanguage.startsWith("zh") ? "zh-CN" : "en";
}

export function resolveLocale(params: {
  settings: Pick<ExtensionSettingsRecord, "locale">;
  uiLanguage?: string | null;
}): SupportedLocale {
  return params.settings.locale.mode === "system"
    ? resolveSystemLocale(params.uiLanguage)
    : params.settings.locale.mode;
}

export function getUiLanguage(): string {
  return chrome.i18n?.getUILanguage?.() ?? navigator.language ?? DEFAULT_UI_LANGUAGE;
}

export function setRuntimeLocale(locale: SupportedLocale): SupportedLocale {
  runtimeLocale = locale;
  return runtimeLocale;
}

export function getRuntimeLocale(): SupportedLocale {
  return runtimeLocale;
}

export function translate(
  locale: SupportedLocale,
  key: TranslationKey,
  values?: Record<string, string | number>
): string {
  const template = messages[locale]?.[key] ?? messages.en[key] ?? key;
  return formatMessage(template, values);
}

export function translateText(locale: SupportedLocale, text: LocalizedTextRecord): string {
  return "message" in text ? text.message : translate(locale, text.key as TranslationKey, text.values);
}

export function createLocalizedText(
  key: TranslationKey,
  values?: Record<string, string | number>
): LocalizedTextRecord {
  return values ? { key, values } : { key };
}

export function createStaticText(message: string): LocalizedTextRecord {
  return { message };
}

export function getUntitledTabTitle(locale: SupportedLocale = runtimeLocale): string {
  return translate(locale, "tab.untitled");
}

export function getDisplayTabTitle(rawTitle: string, locale: SupportedLocale = runtimeLocale): string {
  const title = rawTitle.trim();
  if (!title) {
    return getUntitledTabTitle(locale);
  }

  const knownUntitledTitles = new Set([
    translate("zh-CN", "tab.untitled"),
    translate("en", "tab.untitled")
  ]);

  return knownUntitledTitles.has(title) ? getUntitledTabTitle(locale) : title;
}

export function getDocumentLanguage(locale: SupportedLocale): string {
  return locale === "zh-CN" ? "zh-CN" : "en";
}

export function applyDocumentLocale(params: {
  locale: SupportedLocale;
  titleKey: TranslationKey;
}): void {
  document.documentElement.lang = getDocumentLanguage(params.locale);
  document.title = translate(params.locale, params.titleKey);
  setRuntimeLocale(params.locale);
}

export function formatWindowTitle(params: {
  locale: SupportedLocale;
  visibleWindowIndex: number;
  activeTabTitle: string;
}): string {
  return params.activeTabTitle
    ? translate(params.locale, "window.title.withActive", {
        index: params.visibleWindowIndex,
        title: getDisplayTabTitle(params.activeTabTitle, params.locale)
      })
    : translate(params.locale, "window.title.withoutActive", {
        index: params.visibleWindowIndex
      });
}

function formatMessage(template: string, values?: Record<string, string | number>): string {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}
