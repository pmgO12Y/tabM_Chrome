import { translate, type SupportedLocale } from "../shared/i18n";

export interface BulkToggleToolbarActionParams {
  hasCollapsedWindows: boolean;
  hasCollapsedGroups: boolean;
}

export interface BulkToggleToolbarAction {
  mode: "expand" | "collapse";
  label: string;
}

export function resolveBulkToggleToolbarAction(
  params: BulkToggleToolbarActionParams,
  locale: SupportedLocale
): BulkToggleToolbarAction {
  const shouldShowExpandAction = params.hasCollapsedWindows || params.hasCollapsedGroups;

  if (shouldShowExpandAction) {
    return {
      mode: "expand",
      label: translate(locale, "sidepanel.toolbar.expandAll")
    };
  }

  return {
    mode: "collapse",
    label: translate(locale, "sidepanel.toolbar.collapseAll")
  };
}
