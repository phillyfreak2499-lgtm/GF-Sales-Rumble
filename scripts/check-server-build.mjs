#!/usr/bin/env node
/**
 * `npm start` runs `.output/server/index.mjs` (the nitro `node-server`
 * preset output). Mirrors the preset resolution in vite.config.ts so a
 * misconfigured host fails loudly at build time with an actionable message,
 * instead of crashing on `npm start` with a confusing "module not found".
 */
import { existsSync } from "node:fs";

const preset = process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : "node-server");
const expected = ".output/server/index.mjs";

if (preset === "node-server" && !existsSync(expected)) {
  console.error(
    `[check-server-build] Expected "${expected}" but the build did not produce it.\n` +
      `The nitro preset resolved to "node-server" but no server file was found.\n` +
      `If this host should build for Vercel instead, set NITRO_PRESET=vercel.`,
  );
  process.exit(1);
}
