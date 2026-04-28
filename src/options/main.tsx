import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getRuntimeLocale, translate } from "../shared/i18n";
import App from "./App";
import "./styles.css";

// 检测平台，用于 CSS 微调
document.documentElement.dataset.platform = navigator.platform ?? "";

const container = document.getElementById("root");

if (!container) {
  throw new Error(translate(getRuntimeLocale(), "error.options.mountMissing"));
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
