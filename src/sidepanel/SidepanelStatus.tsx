export function SidepanelStatus({
  errorMessage,
  isInteractive,
  isLoading,
  isResyncing,
  traceEnabled,
  traceEntryCount,
  traceUpdatedAt,
  onCopyDebugTrace,
  copyTraceState
}: {
  errorMessage: string | null;
  isInteractive: boolean;
  isLoading: boolean;
  isResyncing: boolean;
  traceEnabled?: boolean;
  traceEntryCount?: number;
  traceUpdatedAt?: string | null;
  onCopyDebugTrace?: () => void;
  copyTraceState?: "idle" | "success" | "error";
}) {
  if (isLoading) {
    return (
      <div className="loading-state" aria-live="polite">
        <p className="loading-state__title">正在同步标签</p>
        <p className="loading-state__body">
          {isResyncing ? "正在重新连接后台并刷新列表。" : "正在连接后台并读取最新标签状态。"}
        </p>
      </div>
    );
  }

  if (!errorMessage && !traceEnabled) {
    return null;
  }

  return (
    <>
      {traceEnabled ? (
        <div className="debug-state" role="status" aria-live="polite">
          <p className="debug-state__title">详细日志记录中</p>
          <p className="debug-state__body">
            已记录 {traceEntryCount ?? 0} 条，保留完整标题与 URL，可在顶部导出或清空。
          </p>
          {traceUpdatedAt ? <p className="debug-state__hint">最近更新：{new Date(traceUpdatedAt).toLocaleString()}</p> : null}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="error-state" role="alert">
          <p className="error-state__title">同步异常</p>
          <p className="error-state__body">{errorMessage}</p>
          <p className="error-state__hint">
            {isInteractive ? "插件正在自动恢复，同步回来后会继续可用。" : "插件正在尝试重连，恢复后可以继续点击。"}
          </p>
          {onCopyDebugTrace ? (
            <>
              <button type="button" className="panel-toolbar__button" onClick={onCopyDebugTrace}>
                复制调试日志
              </button>
              {copyTraceState === "success" ? <p className="error-state__hint">调试日志已复制。</p> : null}
              {copyTraceState === "error" ? <p className="error-state__hint">复制日志失败，请稍后重试。</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
