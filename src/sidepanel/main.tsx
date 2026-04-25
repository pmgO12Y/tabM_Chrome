import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@icon-park/react/styles/index.css";
import App from "./App";
import "./styles.css";

const container = document.getElementById("root");
const bootBridge = getBootBridge();

if (!container) {
  throw new Error("未找到侧边栏挂载节点。");
}

class SidepanelErrorBoundary extends Component<
  { children: ReactNode },
  { errorMessage: string | null }
> {
  override state = {
    errorMessage: null
  };

  static getDerivedStateFromError(error: unknown) {
    return {
      errorMessage: error instanceof Error ? error.message : "侧边栏启动失败。"
    };
  }

  override componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : "侧边栏启动失败。";
    bootBridge?.fatal(message);
    console.error("Side panel render error:", error);
  }

  override render() {
    if (this.state.errorMessage) {
      return (
        <div className="fatal-error" role="alert">
          <p className="fatal-error__title">侧边栏启动失败</p>
          <p className="fatal-error__body">{this.state.errorMessage}</p>
          <p className="fatal-error__hint">请到 chrome://extensions 里重新加载扩展后再试。</p>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(container).render(
  <StrictMode>
    <SidepanelErrorBoundary>
      <App />
    </SidepanelErrorBoundary>
  </StrictMode>
);

function getBootBridge():
  | {
      ready: () => void;
      fatal: (message: string) => void;
    }
  | null {
  const candidate = (
    window as typeof window & {
      __sidepanelBoot?: {
        ready?: () => void;
        fatal?: (message: string) => void;
      };
    }
  ).__sidepanelBoot;

  if (!candidate?.ready || !candidate?.fatal) {
    return null;
  }

  return {
    ready: candidate.ready,
    fatal: candidate.fatal
  };
}
