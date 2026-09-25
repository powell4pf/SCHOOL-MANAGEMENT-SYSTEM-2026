import nextEnv from "@next/env";
import { spawn } from "node:child_process";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  console.error("Set DATABASE_URL and a BETTER_AUTH_SECRET of at least 32 characters in .env.local first.");
  process.exit(1);
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(executable, ["--yes", "auth@latest", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("error", error => {
  console.error(`Could not start Better Auth CLI: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
