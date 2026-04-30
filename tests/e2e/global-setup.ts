import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const rootDir = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const env = {
  ...Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  ),
  VITE_E2E_TEST: "true"
};

function resolveBuildCommand(): { command: string; args: string[] } {
  return process.platform === "win32"
    ? {
        command: process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
        args: ["/d", "/s", "/c", "npm run build"]
      }
    : {
        command: "npm",
        args: ["run", "build"]
      };
}

async function globalSetup(): Promise<void> {
  const { command, args } = resolveBuildCommand();

  await execFileAsync(command, args, {
    cwd: rootDir,
    env
  });
}

export default globalSetup;
