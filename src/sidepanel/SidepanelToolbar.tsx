import { CloseSmall, Download, Refresh, SettingTwo, SwitchButton, ExpandDownOne, FoldUpOne } from "@icon-park/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolveBulkToggleToolbarAction } from "./toolbarActions";
import { calculateToolbarTooltipPlacement, type ToolbarTooltipPlacement } from "./toolbarTooltip";

import type { TraceSettingsRecord } from "../shared/types";

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
  appShellRef,
  selectedCount,
  hasCollapsedWindows,
  hasCollapsedGroups,
  disabled,
  traceSettings,
  onResync,
  onOpenSettings,
  onExpandAll,
  onCollapseAll,
  onCloseSelected,
  onToggleVerboseTrace,
  onExportTrace,
  onClearTrace
}: {
  appShellRef: React.RefObject<HTMLDivElement | null>;
  selectedCount: number;
  hasCollapsedWindows: boolean;
  hasCollapsedGroups: boolean;
  disabled: boolean;
  traceSettings: TraceSettingsRecord;
  onResync: () => void;
  onOpenSettings: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCloseSelected: () => void;
  onToggleVerboseTrace: () => void;
  onExportTrace: () => void;
  onClearTrace: () => void;
}) {
  const [toolbarTooltip, setToolbarTooltip] = useState<ToolbarTooltipState | null>(null);
  const [toolbarTooltipPlacement, setToolbarTooltipPlacement] = useState<ToolbarTooltipPlacement | null>(null);
  const toolbarTooltipRef = useRef<HTMLDivElement | null>(null);

  const bulkToggleAction = resolveBulkToggleToolbarAction({
    hasCollapsedWindows,
    hasCollapsedGroups
  });

  const toolbarActions: ToolbarAction[] = [
    {
      key: "resync",
      label: "重新同步",
      icon: Refresh,
      onClick: onResync
    },
    {
      key: "settings",
      label: "设置",
      icon: SettingTwo,
      onClick: onOpenSettings
    },
    {
      key: "toggle-all",
      label: bulkToggleAction.label,
      icon: bulkToggleAction.mode === "expand" ? ExpandDownOne : FoldUpOne,
      onClick: bulkToggleAction.mode === "expand" ? onExpandAll : onCollapseAll
    },
    {
      key: "trace-toggle",
      label: traceSettings.verboseLoggingEnabled ? "详细日志：开" : "详细日志：关",
      icon: SwitchButton,
      onClick: onToggleVerboseTrace,
      active: traceSettings.verboseLoggingEnabled
    },
    {
      key: "trace-export",
      label: "导出日志",
      icon: Download,
      onClick: onExportTrace
    },
    {
      key: "trace-clear",
      label: "清空日志",
      icon: CloseSmall,
      onClick: onClearTrace
    },
    ...(selectedCount > 0
      ? [
          {
            key: "close-selected",
            label: `关闭已选（${selectedCount}）`,
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
            已选 {selectedCount} 项
          </div>
        ) : null}
        <div className="panel-toolbar__actions" role="toolbar" aria-label="侧边栏操作">
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
