#!/usr/bin/env node
/**
 * Render sometimes skips the implicit install and jumps straight to
 * `npm run build`. If vite is missing, install dependencies first.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

function has(pkg) {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

if (has("vite") && has("nitro") && has("@vitejs/plugin-react")) {
  process.exit(0);
}

console.log("[ensure-deps] Build tools missing — running npm install");
const result = spawnSync("npm", ["install", "--include=dev"], {
  stdio: "inherit",
  env: { ...process.env, NPM_CONFIG_PRODUCTION: "false", NODE_ENV: "development" },
});
process.exit(result.status ?? 1);
