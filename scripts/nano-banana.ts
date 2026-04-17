#!/usr/bin/env bun
// Nano Banana 2 product image gen via Wavespeed.
//
// Usage:
//   bun scripts/nano-banana.ts --prompt "..." [--size 2048*2048] [--out path.png] [--url-only]

type Args = { prompt: string; size: string; out?: string; urlOnly: boolean };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Partial<Args> = { size: "2048*2048", urlOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--prompt") out.prompt = next, i++;
    else if (a === "--size") out.size = next, i++;
    else if (a === "--out") out.out = next, i++;
    else if (a === "--url-only") out.urlOnly = true;
  }
  if (!out.prompt) {
    console.error('Usage: bun nano-banana.ts --prompt "..." [--size 2048*2048] [--out path.png] [--url-only]');
    process.exit(1);
  }
  return out as Args;
}

const KEY = process.env.WAVESPEED_API_KEY;
if (!KEY || KEY === "wsp_your_wavespeed_key_here") {
  console.error("WAVESPEED_API_KEY not set");
  process.exit(1);
}

const { prompt, size, out, urlOnly } = parseArgs();

const create = await fetch(
  "https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ prompt, size, num_images: 1, enable_base64_output: false }),
  }
);
const created = (await create.json()) as { data?: { id?: string; status?: string }; code?: number; message?: string };
const id = created.data?.id;
if (!id) {
  console.error("Create failed:", JSON.stringify(created, null, 2));
  process.exit(1);
}
console.error(`[nano-banana] request: ${id}`);

for (let i = 0; i < 60; i++) {
  await Bun.sleep(2000);
  const poll = await fetch(
    `https://api.wavespeed.ai/api/v3/predictions/${id}/result`,
    { headers: { Authorization: `Bearer ${KEY}` } }
  );
  const p = (await poll.json()) as { data?: { status?: string; outputs?: string[]; error?: string } };
  const status = p.data?.status;
  console.error(`[nano-banana] ${i + 1}/60: ${status}`);
  if (status === "completed") {
    const url = p.data?.outputs?.[0];
    if (!url) {
      console.error("Completed but no output");
      process.exit(1);
    }
    if (urlOnly) {
      console.log(url);
    } else if (out) {
      const res = await fetch(url);
      await Bun.write(out, await res.arrayBuffer());
      console.log(url);
      console.error(`[nano-banana] saved to ${out}`);
    } else {
      console.log(url);
    }
    process.exit(0);
  }
  if (status === "failed") {
    console.error("Failed:", p.data?.error);
    process.exit(1);
  }
}

console.error("[nano-banana] timeout after 120s");
process.exit(1);
