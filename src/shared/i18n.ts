import type {
  ExtensionSettingsRecord,
  LocaleMode,
  LocalizedTextRecord,
  SupportedLocale
} from "./types";

export type { LocaleMode, SupportedLocale } from "./types";

const DEFAULT_UI_LANGUAGE = "en";

export const DEFAULT_LOCALE_MODE: LocaleMode = "system";

export const DEFAULT_RESOLVED_LOCALE: SupportedLocale = "en";

let runtimeLocale: SupportedLocale = DEFAULT_RESOLVED_LOCALE;

const messages = {
  "zh-CN": {
    "app.extensionName": "侧边栏标签管家",
    "app.extensionDescription": "极简的 Chrome 侧边栏网页定位插件，只保留显示和跳转能力。",
    "app.actionTitle": "打开侧边栏标签管家",
    "app.settingsTitle": "设置",
    "app.sidepanelTitle": "侧边栏标签管家",
    "boot.loadingTitle": "侧边栏标签管家",
    "boot.loadingBody": "正在初始化侧边栏并读取标签…",
    "boot.fatalTitle": "侧边栏启动失败",
    "boot.fatalBody": "启动脚本报错，请到 chrome://extensions 里重新加载扩展后再试。",
    "boot.fatalBodyShort": "启动脚本报错，请重新加载扩展后再试。",
    "boot.asyncFailure": "初始化异步流程失败，请重新加载扩展后再试。",
    "boot.timeoutTitle": "加载时间过长",
    "boot.timeoutBody": "初始化未完成，请到 chrome://extensions 里重新加载扩展后再试。",
    "options.eyebrow": "Chrome 扩展",
    "options.title": "设置",
    "options.description": "修改后立即生效。",
    "options.section.language.title": "语言",
    "options.section.language.description": "默认跟随系统语言，也可以手动改成简体中文或 English。",
    "options.language.label": "界面语言",
    "options.language.hint": "切换后设置页和侧边栏都会立即更新。",
    "options.language.option.system": "跟随系统",
    "options.language.option.zh-CN": "简体中文",
    "options.language.option.en": "English",
    "options.section.badge.title": "徽标显示",
    "options.section.badge.description": "控制工具栏图标上的数字徽标是否显示。",
    "options.badge.label": "显示工具栏数字徽标",
    "options.badge.hint": "关闭后不再显示当前标签总数。",
    "options.section.ui.title": "界面显示",
    "options.section.search.title": "搜索交互",
    "options.section.debug.title": "调试选项",
    "options.comingSoon": "即将支持",
    "options.reset": "恢复默认设置",
    "error.options.mountMissing": "未找到设置页挂载节点。",
    "error.sidepanel.mountMissing": "未找到侧边栏挂载节点。",
    "error.sidepanel.renderFailed": "侧边栏启动失败。",
    "error.sidepanel.retryHint": "请到 chrome://extensions 里重新加载扩展后再试。",
    "error.backgroundUnknown": "扩展后台发生未知错误。",
    "error.commandPinnedMoveUnsupported": "暂不支持拖动置顶标签",
    "error.panel.bootstrapFailed": "首屏数据加载失败，正在等待后台同步。",
    "error.panel.connectionFailed": "连接后台脚本失败，正在重试。",
    "error.panel.connectionUnavailable": "后台连接不可用",
    "error.panel.connectionClosed": "后台连接已断开",
    "error.panel.traceTimeout": "获取调试日志超时",
    "sidepanel.loading.title": "正在同步标签",
    "sidepanel.loading.body": "正在连接后台并读取最新标签状态。",
    "sidepanel.loading.bodyResync": "正在重新连接后台并刷新列表。",
    "sidepanel.debug.title": "详细日志记录中",
    "sidepanel.debug.body": "已记录 {count} 条，保留完整标题与 URL，可在顶部导出或清空。",
    "sidepanel.debug.updatedAt": "最近更新：{value}",
    "sidepanel.error.title": "同步异常",
    "sidepanel.error.hintInteractive": "插件正在自动恢复，同步回来后会继续可用。",
    "sidepanel.error.hintReconnecting": "插件正在尝试重连，恢复后可以继续点击。",
    "sidepanel.error.copyTrace": "复制调试日志",
    "sidepanel.error.copyTraceSuccess": "调试日志已复制。",
    "sidepanel.error.copyTraceFailed": "复制日志失败，请稍后重试。",
    "sidepanel.toolbar.resync": "重新同步",
    "sidepanel.toolbar.settings": "设置",
    "sidepanel.toolbar.expandAll": "全部展开",
    "sidepanel.toolbar.collapseAll": "全部收起",
    "sidepanel.toolbar.traceOn": "详细日志：开",
    "sidepanel.toolbar.traceOff": "详细日志：关",
    "sidepanel.toolbar.exportTrace": "导出日志",
    "sidepanel.toolbar.clearTrace": "清空日志",
    "sidepanel.toolbar.closeSelected": "关闭已选（{count}）",
    "sidepanel.toolbar.selectedCount": "已选 {count} 项",
    "sidepanel.toolbar.aria": "侧边栏操作",
    "sidepanel.search.placeholder": "搜索标签...",
    "sidepanel.search.input": "搜索标签",
    "sidepanel.search.clear": "清除搜索",
    "sidepanel.search.filter": "过滤模式",
    "sidepanel.search.highlight": "高亮模式",
    "sidepanel.search.moveToNewWindow": "将匹配的标签移动到新窗口",
    "sidepanel.search.matchCount": "{count} 个匹配",
    "sidepanel.list.emptySearchTitle": "没有匹配的标签页",
    "sidepanel.list.emptySearchBody": "试试其他关键词，或按 Esc 清空搜索",
    "sidepanel.list.emptyTitle": "没有可显示的标签页",
    "sidepanel.list.emptyBody": "打开网页后，这里会自动出现对应标签。",
    "sidepanel.list.aria": "标签列表",
    "sidepanel.window.current": "当前",
    "sidepanel.tab.activate": "切换到标签页 {title}",
    "sidepanel.tab.pin": "固定标签",
    "sidepanel.tab.unpin": "取消固定标签",
    "sidepanel.tab.close": "关闭标签",
    "tab.untitled": "未命名标签页",
    "window.title.withActive": "窗口 {index} - {title}",
    "window.title.withoutActive": "窗口 {index}",
    "trace.timeline.header": "侧边栏调试时间线",
    "trace.timeline.updatedAt": "更新时间：{value}",
    "trace.timeline.verbose": "详细日志：{value}",
    "trace.timeline.verbose.enabled": "开启",
    "trace.timeline.verbose.disabled": "关闭",
    "trace.timeline.entryCount": "记录条数：{count}",
    "trace.timeline.bySource": "来源统计：{value}",
    "trace.timeline.byLevel": "级别统计：{value}",
    "trace.timeline.byCategory": "分类统计：{value}",
    "trace.timeline.label": "时间线："
  },
  en: {
    "app.extensionName": "Tab Sidebar Manager",
    "app.extensionDescription": "A minimal Chrome side panel tab finder that only keeps display and jump actions.",
    "app.actionTitle": "Open Tab Sidebar Manager",
    "app.settingsTitle": "Settings",
    "app.sidepanelTitle": "Tab Sidebar Manager",
    "boot.loadingTitle": "Tab Sidebar Manager",
    "boot.loadingBody": "Starting the side panel and reading tabs…",
    "boot.fatalTitle": "Side panel failed to start",
    "boot.fatalBody": "The startup script failed. Reload the extension on chrome://extensions and try again.",
    "boot.fatalBodyShort": "The startup script failed. Reload the extension and try again.",
    "boot.asyncFailure": "The async startup flow failed. Reload the extension and try again.",
    "boot.timeoutTitle": "Loading is taking too long",
    "boot.timeoutBody": "Initialization did not finish. Reload the extension on chrome://extensions and try again.",
    "options.eyebrow": "Chrome Extension",
    "options.title": "Settings",
    "options.description": "Changes apply immediately.",
    "options.section.language.title": "Language",
    "options.section.language.description": "Follow the system language by default, or switch to 简体中文 or English manually.",
    "options.language.label": "Interface language",
    "options.language.hint": "The settings page and side panel update right away after switching.",
    "options.language.option.system": "Follow system",
    "options.language.option.zh-CN": "简体中文",
    "options.language.option.en": "English",
    "options.section.badge.title": "Badge",
    "options.section.badge.description": "Control whether the toolbar icon shows a number badge.",
    "options.badge.label": "Show number badge on the toolbar icon",
    "options.badge.hint": "Turn it off to hide the current tab count.",
    "options.section.ui.title": "Interface",
    "options.section.search.title": "Search",
    "options.section.debug.title": "Debug",
    "options.comingSoon": "Coming soon",
    "options.reset": "Reset to defaults",
    "error.options.mountMissing": "Settings root element was not found.",
    "error.sidepanel.mountMissing": "Side panel root element was not found.",
    "error.sidepanel.renderFailed": "Side panel failed to start.",
    "error.sidepanel.retryHint": "Reload the extension on chrome://extensions and try again.",
    "error.backgroundUnknown": "An unknown background error occurred.",
    "error.commandPinnedMoveUnsupported": "Pinned tabs cannot be dragged yet",
    "error.panel.bootstrapFailed": "The first snapshot failed to load. Waiting for background sync.",
    "error.panel.connectionFailed": "Background connection failed. Retrying.",
    "error.panel.connectionUnavailable": "Background connection is unavailable",
    "error.panel.connectionClosed": "Background connection was closed",
    "error.panel.traceTimeout": "Timed out while loading the debug trace",
    "sidepanel.loading.title": "Syncing tabs",
    "sidepanel.loading.body": "Connecting to the background script and reading the latest tab state.",
    "sidepanel.loading.bodyResync": "Reconnecting to the background script and refreshing the list.",
    "sidepanel.debug.title": "Verbose trace is on",
    "sidepanel.debug.body": "Recorded {count} entries. Full titles and URLs are kept and can be exported or cleared from the toolbar.",
    "sidepanel.debug.updatedAt": "Last updated: {value}",
    "sidepanel.error.title": "Sync issue",
    "sidepanel.error.hintInteractive": "The extension is recovering automatically and will keep working after sync returns.",
    "sidepanel.error.hintReconnecting": "The extension is trying to reconnect. You can continue after it recovers.",
    "sidepanel.error.copyTrace": "Copy debug trace",
    "sidepanel.error.copyTraceSuccess": "Debug trace copied.",
    "sidepanel.error.copyTraceFailed": "Could not copy the debug trace. Try again later.",
    "sidepanel.toolbar.resync": "Resync",
    "sidepanel.toolbar.settings": "Settings",
    "sidepanel.toolbar.expandAll": "Expand all",
    "sidepanel.toolbar.collapseAll": "Collapse all",
    "sidepanel.toolbar.traceOn": "Verbose trace: on",
    "sidepanel.toolbar.traceOff": "Verbose trace: off",
    "sidepanel.toolbar.exportTrace": "Export trace",
    "sidepanel.toolbar.clearTrace": "Clear trace",
    "sidepanel.toolbar.closeSelected": "Close selected ({count})",
    "sidepanel.toolbar.selectedCount": "Selected {count}",
    "sidepanel.toolbar.aria": "Side panel actions",
    "sidepanel.search.placeholder": "Search tabs...",
    "sidepanel.search.input": "Search tabs",
    "sidepanel.search.clear": "Clear search",
    "sidepanel.search.filter": "Filter mode",
    "sidepanel.search.highlight": "Highlight mode",
    "sidepanel.search.moveToNewWindow": "Move matching tabs to a new window",
    "sidepanel.search.matchCount": "{count} matches",
    "sidepanel.list.emptySearchTitle": "No matching tabs",
    "sidepanel.list.emptySearchBody": "Try another keyword, or press Esc to clear the search.",
    "sidepanel.list.emptyTitle": "No tabs to show",
    "sidepanel.list.emptyBody": "Open a page and its tab will appear here automatically.",
    "sidepanel.list.aria": "Tab list",
    "sidepanel.window.current": "Current",
    "sidepanel.tab.activate": "Switch to tab {title}",
    "sidepanel.tab.pin": "Pin tab",
    "sidepanel.tab.unpin": "Unpin tab",
    "sidepanel.tab.close": "Close tab",
    "tab.untitled": "Untitled tab",
    "window.title.withActive": "Window {index} - {title}",
    "window.title.withoutActive": "Window {index}",
    "trace.timeline.header": "Side panel debug timeline",
    "trace.timeline.updatedAt": "Updated at: {value}",
    "trace.timeline.verbose": "Verbose trace: {value}",
    "trace.timeline.verbose.enabled": "enabled",
    "trace.timeline.verbose.disabled": "disabled",
    "trace.timeline.entryCount": "Entry count: {count}",
    "trace.timeline.bySource": "By source: {value}",
    "trace.timeline.byLevel": "By level: {value}",
    "trace.timeline.byCategory": "By category: {value}",
    "trace.timeline.label": "Timeline:"
  }
} as const;

type MessageKey = keyof typeof messages["en"];

export type TranslationKey = MessageKey;

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
  const template = messages[locale][key] ?? messages.en[key] ?? key;
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
