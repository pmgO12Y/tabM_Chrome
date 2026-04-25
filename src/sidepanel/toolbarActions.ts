export interface BulkToggleToolbarActionParams {
  hasCollapsedWindows: boolean;
  hasCollapsedGroups: boolean;
}

export interface BulkToggleToolbarAction {
  mode: "expand" | "collapse";
  label: "全部展开" | "全部收起";
}

export function resolveBulkToggleToolbarAction(
  params: BulkToggleToolbarActionParams
): BulkToggleToolbarAction {
  const shouldShowExpandAction = params.hasCollapsedWindows || params.hasCollapsedGroups;

  if (shouldShowExpandAction) {
    return {
      mode: "expand",
      label: "全部展开"
    };
  }

  return {
    mode: "collapse",
    label: "全部收起"
  };
}
