import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@icon-park/react/styles/index.css";
import { getRuntimeLocale, translate } from "../shared/i18n";
import App from "./App";
import "./styles.css";

const container = document.getElementById("root");
const bootBridge = getBootBridge();

if (!container) {
  throw new Error(translate(getRuntimeLocale(), "error.sidepanel.mountMissing"));
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
      errorMessage:
        error instanceof Error
          ? error.message
          : translate(getRuntimeLocale(), "error.sidepanel.renderFailed")
    };
  }

  override componentDidCatch(error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : translate(getRuntimeLocale(), "error.sidepanel.renderFailed");
    bootBridge?.fatal(message);
    console.error("Side panel render error:", error);
  }

  override render() {
    if (this.state.errorMessage) {
      return (
        <div className="fatal-error" role="alert">
          <p className="fatal-error__title">{translate(getRuntimeLocale(), "boot.fatalTitle")}</p>
          <p className="fatal-error__body">{this.state.errorMessage}</p>
          <p className="fatal-error__hint">{translate(getRuntimeLocale(), "error.sidepanel.retryHint")}</p>
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
