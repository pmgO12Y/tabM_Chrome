import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const shellExecutable = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";
const rootDir = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const env = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
);

async function globalSetup(): Promise<void> {
  await execFileAsync(shellExecutable, ["/d", "/s", "/c", "npm run build"], {
    cwd: rootDir,
    env
  });
}

export default globalSetup;
