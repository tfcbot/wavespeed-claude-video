#!/usr/bin/env bun
// Setup check — verify Node 22+, Bun, ffmpeg, and API keys.
// Run: bun setup.ts

import { existsSync } from "node:fs";

const checks: Array<{ name: string; status: "ok" | "warn" | "fail"; detail: string }> = [];

// .env present
if (existsSync(".env")) {
  checks.push({ name: ".env", status: "ok", detail: "present" });
} else if (existsSync(".env.example")) {
  checks.push({ name: ".env", status: "fail", detail: "missing — copy .env.example to .env and paste your keys" });
} else {
  checks.push({ name: ".env", status: "fail", detail: "missing and no .env.example to copy from" });
}

// Wavespeed key
const ws = process.env.WAVESPEED_API_KEY;
if (ws && ws !== "wsp_your_wavespeed_key_here" && ws.length > 10) {
  try {
    const res = await fetch("https://api.wavespeed.ai/api/v3/balance", {
      headers: { Authorization: `Bearer ${ws}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { data?: { balance?: number } };
      const balance = data.data?.balance ?? null;
      checks.push({
        name: "WAVESPEED_API_KEY",
        status: "ok",
        detail: `valid${balance !== null ? ` · balance: ${balance}` : ""}`,
      });
    } else {
      checks.push({ name: "WAVESPEED_API_KEY", status: "fail", detail: `API returned ${res.status}` });
    }
  } catch (e) {
    checks.push({ name: "WAVESPEED_API_KEY", status: "warn", detail: `network check failed: ${e}` });
  }
} else {
  checks.push({ name: "WAVESPEED_API_KEY", status: "fail", detail: "not set or still placeholder — get one at https://wavespeed.ai" });
}

// Gemini key
const gm = process.env.GEMINI_API_KEY;
if (gm && gm !== "your_gemini_api_key_here" && gm.length > 20) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${gm}`
    );
    if (res.ok) {
      checks.push({ name: "GEMINI_API_KEY", status: "ok", detail: "valid" });
    } else {
      checks.push({ name: "GEMINI_API_KEY", status: "fail", detail: `API returned ${res.status}` });
    }
  } catch (e) {
    checks.push({ name: "GEMINI_API_KEY", status: "warn", detail: `network check failed: ${e}` });
  }
} else {
  checks.push({
    name: "GEMINI_API_KEY",
    status: "fail",
    detail: "not set or still placeholder — get one at https://aistudio.google.com/apikey",
  });
}

// Scrape Creators — required for Meta Ad Library downloads
const sc = process.env.SCRAPE_CREATORS_API;
if (sc && sc !== "your_scrapecreators_key_here" && sc.length > 10) {
  checks.push({ name: "SCRAPE_CREATORS_API", status: "ok", detail: "set" });
} else {
  checks.push({
    name: "SCRAPE_CREATORS_API",
    status: "fail",
    detail: "not set — required to download reference ads from Meta Ad Library. Get a key at https://scrapecreators.com",
  });
}

// ffmpeg
const ffmpegProc = Bun.spawnSync(["which", "ffmpeg"]);
if (ffmpegProc.exitCode === 0) {
  checks.push({ name: "ffmpeg", status: "ok", detail: "found" });
} else {
  checks.push({
    name: "ffmpeg",
    status: "fail",
    detail: "not found — install with `brew install ffmpeg`",
  });
}

// Node version
const nodeVer = process.versions.node.split(".")[0];
if (nodeVer && Number.parseInt(nodeVer) >= 22) {
  checks.push({ name: "Node", status: "ok", detail: `v${process.versions.node}` });
} else {
  checks.push({
    name: "Node",
    status: "warn",
    detail: `v${process.versions.node} (Node 22+ recommended for Claude Code compatibility)`,
  });
}

console.log("");
console.log("wavespeed-claude-video — setup check");
console.log("─────────────────────────────────────────────────");
for (const c of checks) {
  const icon = c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✗";
  console.log(`  ${icon}  ${c.name.padEnd(22)} ${c.detail}`);
}
console.log("");

const failed = checks.filter((c) => c.status === "fail").length;
if (failed === 0) {
  console.log("Ready. Next step: invoke /ad-clone-analyzer in Claude Code.");
  process.exit(0);
} else {
  console.log(`${failed} blocker(s) — fix and rerun.`);
  process.exit(1);
}
