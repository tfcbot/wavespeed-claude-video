#!/usr/bin/env bun
// fetch-media — resolve a social video URL to a direct mp4 URL via Scrape Creators,
// then download the bytes to disk.
//
// Supported:
//   Meta Ad Library URL or ad_archive_id
//   TikTok URL
//   Instagram reel/post URL
//   Direct https mp4/mov URL
//
// Out of scope:
//   YouTube — Gemini accepts YouTube URLs natively via fileData.fileUri.
//             Pass the URL to gemini-analyze.ts directly, not here.
//   Local files — use `cp`.
//
// Usage:
//   bun scripts/fetch-media.ts <source> [--out path]
//
// Prints the output path to stdout. Requires SCRAPE_CREATORS_API for
// Meta / TikTok / Instagram sources.

const SC_BASE = "https://api.scrapecreators.com";

function scrapeCreatorsKey(): string {
  const k = process.env.SCRAPE_CREATORS_API;
  if (!k || k === "your_scrapecreators_key_here") {
    throw new Error("SCRAPE_CREATORS_API not set in .env");
  }
  return k;
}

async function scGet(path: string): Promise<any> {
  const res = await fetch(`${SC_BASE}${path}`, {
    headers: { "x-api-key": scrapeCreatorsKey() },
  });
  if (!res.ok) throw new Error(`Scrape Creators ${res.status} @ ${path}`);
  return res.json();
}

// ── Resolvers: source → direct mp4 URL ──────────────────────────────────────

async function resolveMetaAdLibrary(id: string): Promise<string> {
  const data = await scGet(`/v1/facebook/adLibrary/ad?id=${encodeURIComponent(id)}`);
  const cards =
    data?.results?.[0]?.snapshot?.cards ?? data?.data?.snapshot?.cards ?? [];
  const card = cards.find((c: any) => c?.video_hd_url || c?.video_sd_url);
  const url = card?.video_hd_url ?? card?.video_sd_url;
  if (!url) throw new Error(`Meta ad ${id} has no video (may be image-only)`);
  return url;
}

async function resolveTikTok(url: string): Promise<string> {
  const data = await scGet(`/v2/tiktok/video?url=${encodeURIComponent(url)}`);
  const v = data?.aweme_detail?.video ?? data?.data?.aweme_detail?.video;
  const out =
    v?.download_no_watermark_addr?.url_list?.[0] ??
    v?.play_addr?.url_list?.[0] ??
    v?.download_addr?.url_list?.[0];
  if (!out) throw new Error("TikTok response contains no playable mp4 URL");
  return out;
}

async function resolveInstagram(url: string): Promise<string> {
  const data = await scGet(`/v1/instagram/post?url=${encodeURIComponent(url)}`);
  const out =
    data?.data?.xdt_shortcode_media?.video_url ??
    data?.xdt_shortcode_media?.video_url;
  if (!out) throw new Error("Instagram post has no video (may be image-only)");
  return out;
}

// ── Dispatch table ──────────────────────────────────────────────────────────

type Resolver = (source: string) => Promise<string>;

const ROUTES: Array<{ match: RegExp; extract?: (s: string) => string; resolve: Resolver; label: string }> = [
  {
    label: "meta-ad-library",
    match: /facebook\.com\/ads\/library.*[?&]id=\d+/i,
    extract: (s) => s.match(/[?&]id=(\d+)/)![1]!,
    resolve: resolveMetaAdLibrary,
  },
  {
    label: "meta-ad-library",
    match: /^\d+$/,
    resolve: resolveMetaAdLibrary,
  },
  {
    label: "tiktok",
    match: /(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\//i,
    resolve: resolveTikTok,
  },
  {
    label: "instagram",
    match: /instagram\.com\/(?:reel|p|tv)\/[A-Za-z0-9_-]+/i,
    resolve: resolveInstagram,
  },
];

const YOUTUBE_RE = /(?:youtube\.com|youtu\.be)/i;
const DIRECT_MEDIA_RE = /^https?:\/\/.+\.(?:mp4|mov)(\?.*)?$/i;

// ── Download ────────────────────────────────────────────────────────────────

async function download(url: string, out: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await Bun.write(out, bytes);
  return bytes.byteLength;
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { source: string; out: string } {
  let source = "";
  let out = "references/ads/ref.mp4";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--out") out = argv[++i]!;
    else if (!source && !a.startsWith("--")) source = a;
  }
  if (!source) {
    console.error("Usage: bun scripts/fetch-media.ts <source> [--out path]");
    process.exit(2);
  }
  return { source, out };
}

const { source, out } = parseArgs(process.argv.slice(2));

if (YOUTUBE_RE.test(source)) {
  console.error(
    "YouTube is handled natively by gemini-analyze.ts (fileData.fileUri). Pass the URL there, not here."
  );
  process.exit(2);
}

try {
  const route = ROUTES.find((r) => r.match.test(source));
  let mediaUrl: string;
  if (route) {
    const arg = route.extract ? route.extract(source) : source;
    console.error(`[fetch-media] ${route.label}`);
    mediaUrl = await route.resolve(arg);
  } else if (DIRECT_MEDIA_RE.test(source)) {
    console.error(`[fetch-media] direct URL`);
    mediaUrl = source;
  } else {
    console.error(`Unrecognized source: ${source}`);
    process.exit(2);
  }

  const size = await download(mediaUrl, out);
  console.error(`[fetch-media] ${(size / 1024 / 1024).toFixed(1)} MB → ${out}`);
  console.log(out);
} catch (err) {
  console.error(`[fetch-media] ${(err as Error).message}`);
  process.exit(1);
}
