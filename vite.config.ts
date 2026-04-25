import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const packageJson = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8")) as {
  version: string;
};
const releaseVersionDir = `release/v${packageJson.version}`;

export default defineConfig({
  plugins: [react()],
  build: {
    target: "chrome114",
    outDir: `${releaseVersionDir}/dist`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(rootDir, "sidepanel.html"),
        options: resolve(rootDir, "options.html"),
        background: resolve(rootDir, "src/background/index.ts")
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background" ? "assets/background.js" : "assets/[name].js",
        chunkFileNames: "assets/chunks/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"]
  }
});
