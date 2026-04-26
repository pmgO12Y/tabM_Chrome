import { CloseSmall, Refresh, SettingTwo, ExpandDownOne, FoldUpOne } from "@icon-park/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { translate, type SupportedLocale } from "../shared/i18n";
import { resolveBulkToggleToolbarAction } from "./toolbarActions";
import { calculateToolbarTooltipPlacement, type ToolbarTooltipPlacement } from "./toolbarTooltip";


interface ToolbarTooltipState {
  actionKey: string;
  anchor: HTMLButtonElement;
}

interface ToolbarAction {
  key: string;
  label: string;
  icon: typeof Refresh;
  onClick: () => void;
  active?: boolean;
}

export function SidepanelToolbar({
  locale,
  appShellRef,
  selectedCount,
  hasCollapsedWindows,
  hasCollapsedGroups,
  disabled,
  onResync,
  onOpenSettings,
  onExpandAll,
  onCollapseAll,
  onCloseSelected
}: {
  locale: SupportedLocale;
  appShellRef: React.RefObject<HTMLDivElement | null>;
  selectedCount: number;
  hasCollapsedWindows: boolean;
  hasCollapsedGroups: boolean;
  disabled: boolean;
  onResync: () => void;
  onOpenSettings: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCloseSelected: () => void;
}) {
  const [toolbarTooltip, setToolbarTooltip] = useState<ToolbarTooltipState | null>(null);
  const [toolbarTooltipPlacement, setToolbarTooltipPlacement] = useState<ToolbarTooltipPlacement | null>(null);
  const toolbarTooltipRef = useRef<HTMLDivElement | null>(null);

  const bulkToggleAction = resolveBulkToggleToolbarAction(
    {
      hasCollapsedWindows,
      hasCollapsedGroups
    },
    locale
  );

  const toolbarActions: ToolbarAction[] = [
    {
      key: "resync",
      label: translate(locale, "sidepanel.toolbar.resync"),
      icon: Refresh,
      onClick: onResync
    },
    {
      key: "settings",
      label: translate(locale, "sidepanel.toolbar.settings"),
      icon: SettingTwo,
      onClick: onOpenSettings
    },
    {
      key: "toggle-all",
      label: bulkToggleAction.label,
      icon: bulkToggleAction.mode === "expand" ? ExpandDownOne : FoldUpOne,
      onClick: bulkToggleAction.mode === "expand" ? onExpandAll : onCollapseAll
    },
    ...(selectedCount > 0
      ? [
          {
            key: "close-selected",
            label: translate(locale, "sidepanel.toolbar.closeSelected", {
              count: selectedCount
            }),
            icon: CloseSmall,
            onClick: onCloseSelected
          }
        ]
      : [])
  ];

  const toolbarActionLabelByKey = useMemo(
    () => new Map(toolbarActions.map((action) => [action.key, action.label])),
    [toolbarActions]
  );
  const toolbarTooltipLabel = toolbarTooltip
    ? (toolbarActionLabelByKey.get(toolbarTooltip.actionKey) ?? null)
    : null;

  const updateToolbarTooltipPlacement = useCallback(() => {
    if (!toolbarTooltip || !appShellRef.current || !toolbarTooltipRef.current) {
      setToolbarTooltipPlacement(null);
      return;
    }

    const nextPlacement = calculateToolbarTooltipPlacement({
      anchorRect: toolbarTooltip.anchor.getBoundingClientRect(),
      tooltipSize: toolbarTooltipRef.current.getBoundingClientRect(),
      containerRect: appShellRef.current.getBoundingClientRect()
    });
    setToolbarTooltipPlacement(nextPlacement);
  }, [appShellRef, toolbarTooltip]);

  useLayoutEffect(() => {
    updateToolbarTooltipPlacement();
  }, [updateToolbarTooltipPlacement]);

  useEffect(() => {
    if (!toolbarTooltip) {
      return;
    }

    const handleResize = () => {
      updateToolbarTooltipPlacement();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [toolbarTooltip, updateToolbarTooltipPlacement]);

  function showToolbarTooltip(actionKey: string, anchor: HTMLButtonElement): void {
    setToolbarTooltip({
      actionKey,
      anchor
    });
  }

  function hideToolbarTooltip(): void {
    setToolbarTooltip(null);
    setToolbarTooltipPlacement(null);
  }

  return (
    <>
      <div className="panel-toolbar">
        {selectedCount > 0 ? (
          <div className="panel-toolbar__selection" aria-live="polite">
            {translate(locale, "sidepanel.toolbar.selectedCount", {
              count: selectedCount
            })}
          </div>
        ) : null}
        <div className="panel-toolbar__actions" role="toolbar" aria-label={translate(locale, "sidepanel.toolbar.aria")}>
          {toolbarActions.map(({ key, label, icon: Icon, onClick, active = false }) => (
            <button
              key={key}
              type="button"
              className={`panel-toolbar__button${active ? " panel-toolbar__button--active" : ""}`}
              onClick={onClick}
              onPointerEnter={(event) => showToolbarTooltip(key, event.currentTarget)}
              onPointerLeave={hideToolbarTooltip}
              onFocus={(event) => showToolbarTooltip(key, event.currentTarget)}
              onBlur={hideToolbarTooltip}
              disabled={disabled}
              aria-label={label}
            >
              <Icon theme="outline" size="18" />
            </button>
          ))}
        </div>
      </div>
      {toolbarTooltip && toolbarTooltipLabel ? (
        <div
          ref={toolbarTooltipRef}
          className={`panel-toolbar-tooltip${toolbarTooltipPlacement ? " panel-toolbar-tooltip--visible" : ""}`}
          data-placement={toolbarTooltipPlacement?.placement ?? "bottom"}
          style={{
            left: toolbarTooltipPlacement ? `${toolbarTooltipPlacement.left}px` : "-9999px",
            top: toolbarTooltipPlacement ? `${toolbarTooltipPlacement.top}px` : "-9999px"
          }}
          role="tooltip"
        >
          {toolbarTooltipLabel}
        </div>
      ) : null}
    </>
  );
}
