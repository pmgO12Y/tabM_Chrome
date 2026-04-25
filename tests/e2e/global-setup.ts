import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function globalSetup(): Promise<void> {
  await execFileAsync("npm", ["run", "build"], {
    cwd: process.cwd(),
    env: process.env
  });
}

export default globalSetup;
