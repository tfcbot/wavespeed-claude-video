#!/usr/bin/env bun
// Gemini video analysis — upload a video via the Files API and get back a shot list.
//
// Usage:
//   bun scripts/gemini-analyze.ts --video <path-or-url> [--out <json-path>] [--prompt <custom-prompt>]
//
// Returns JSON (or writes to --out) with the schema defined in DEFAULT_PROMPT below.

const DEFAULT_PROMPT = `You are breaking down a video ad into a SHOT LIST for AI video cloning.

A SHOT = the frames between two hard cuts. Count every cut — not scene changes, not action beats — actual video cuts.

Return ONLY JSON (no prose, no code fence):
{
  "total_shots": number,
  "total_duration_sec": number,
  "shots_per_10s": number,
  "cut_style": "hard cuts" | "match cuts" | "jump cuts" | "mixed",
  "shots": [{
    "n": number,
    "start": number,
    "end": number,
    "framing": "EXTREME_CLOSEUP" | "CLOSEUP" | "MEDIUM_CLOSEUP" | "MEDIUM" | "MEDIUM_WIDE" | "WIDE",
    "angle": "EYE_LEVEL" | "LOW_ANGLE" | "HIGH_ANGLE" | "OVERHEAD" | "POV",
    "movement": "STATIC" | "HANDHELD" | "PAN" | "TILT" | "DOLLY" | "TRACKING" | "ORBIT",
    "location": string,
    "in_frame": string,
    "creator_action": string,
    "spoken": string,
    "caption": string
  }],
  "creator": { "gender": string, "age_range": string, "hair": string, "wardrobe": string, "expression_style": string },
  "environment_notes": string,
  "audio": { "reverb": string, "voice_quality": string, "music": string, "pacing": string },
  "hook_structure": string
}`;

type Args = { video: string; out?: string; prompt?: string };

function parseArgs(): Args {
  const args: Partial<Args> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--video") args.video = next, i++;
    else if (a === "--out") args.out = next, i++;
    else if (a === "--prompt") args.prompt = next, i++;
  }
  if (!args.video) {
    console.error("Usage: bun gemini-analyze.ts --video <path-or-url> [--out <json-path>] [--prompt <custom>]");
    process.exit(1);
  }
  return args as Args;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
  console.error("GEMINI_API_KEY not set. Copy .env.example → .env and paste your key.");
  process.exit(1);
}

const { video, out, prompt = DEFAULT_PROMPT } = parseArgs();

// YouTube URLs are supported natively by Gemini via fileData.fileUri —
// skip the Files API round-trip entirely.
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]+/i;

let fileUri: string;

if (YOUTUBE_RE.test(video)) {
  console.error(`[gemini-analyze] YouTube URL — using fileData.fileUri directly`);
  fileUri = video;
} else {
  // Step 1: get bytes (from URL or local file)
  const bytes = video.startsWith("http")
    ? await fetch(video).then((r) => r.arrayBuffer()).then((b) => Buffer.from(b))
    : await Bun.file(video).arrayBuffer().then((b) => Buffer.from(b));
  const size = bytes.length;
  console.error(`[gemini-analyze] loaded ${size} bytes`);

  // Step 2: resumable upload to Files API
  const startRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(size),
        "X-Goog-Upload-Header-Content-Type": "video/mp4",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: `analyze-${Date.now()}` } }),
    }
  );
  const uploadUrl = startRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    console.error("Failed to get upload URL:", await startRes.text());
    process.exit(1);
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(size),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });
  const fileMeta = (await uploadRes.json()) as {
    file: { name: string; uri: string; state: string };
  };
  console.error(`[gemini-analyze] uploaded: ${fileMeta.file.name}`);

  // Step 3: wait for ACTIVE
  for (let i = 0; i < 20; i++) {
    await Bun.sleep(2000);
    const check = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileMeta.file.name}?key=${GEMINI_API_KEY}`
    );
    const j = (await check.json()) as { state: string };
    console.error(`[gemini-analyze] state: ${j.state}`);
    if (j.state === "ACTIVE") break;
  }

  fileUri = fileMeta.file.uri;
}

// Step 4: analyze
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { fileData: { mimeType: "video/mp4", fileUri } },
            { text: prompt },
          ],
        },
      ],
    }),
  }
);
const data = (await res.json()) as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }>; error?: { message: string } };
if (data.error) {
  console.error("Gemini error:", data.error.message);
  process.exit(1);
}

let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
// strip code fences if present
text = text.replace(/^```(json)?\s*/i, "").replace(/\s*```\s*$/i, "");

if (out) {
  await Bun.write(out, text);
  console.error(`[gemini-analyze] wrote ${out}`);
} else {
  console.log(text);
}
