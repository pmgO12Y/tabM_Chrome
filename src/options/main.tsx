import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("未找到设置页挂载节点。");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
