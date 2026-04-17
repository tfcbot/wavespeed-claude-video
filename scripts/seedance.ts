#!/usr/bin/env bun
// Seedance 2.0 image-to-video via Wavespeed.
//
// Usage:
//   bun scripts/seedance.ts \
//     --prompt "..." \
//     --image <url-or-path> \
//     [--aspect 9:16] [--resolution 480p] [--duration 15] \
//     [--out path.mp4] [--url-only]

type Args = {
  prompt: string;
  image: string;
  aspect: string;
  resolution: string;
  duration: number;
  out?: string;
  urlOnly: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const a: Partial<Args> = {
    aspect: "9:16",
    resolution: "480p",
    duration: 15,
    urlOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    const next = argv[i + 1];
    if (x === "--prompt") a.prompt = next, i++;
    else if (x === "--image") a.image = next, i++;
    else if (x === "--aspect") a.aspect = next, i++;
    else if (x === "--resolution") a.resolution = next, i++;
    else if (x === "--duration") a.duration = Number(next), i++;
    else if (x === "--out") a.out = next, i++;
    else if (x === "--url-only") a.urlOnly = true;
  }
  if (!a.prompt || !a.image) {
    console.error('Usage: bun seedance.ts --prompt "..." --image <url-or-path> [--aspect 9:16] [--resolution 480p] [--duration 15] [--out out.mp4]');
    process.exit(1);
  }
  return a as Args;
}

const KEY = process.env.WAVESPEED_API_KEY;
if (!KEY || KEY === "wsp_your_wavespeed_key_here") {
  console.error("WAVESPEED_API_KEY not set");
  process.exit(1);
}

const { prompt, image, aspect, resolution, duration, out, urlOnly } = parseArgs();

// If image is a local path, upload it — for now we assume URL (Wavespeed product images come back as URLs already)
if (!image.startsWith("http")) {
  console.error("Image must be a URL. Use nano-banana.ts first and pass its output URL here.");
  process.exit(1);
}

const create = await fetch(
  "https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/image-to-video",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      prompt,
      image,
      aspect_ratio: aspect,
      resolution,
      duration,
    }),
  }
);
const created = (await create.json()) as { data?: { id?: string }; code?: number; message?: string };
const id = created.data?.id;
if (!id) {
  console.error("Create failed:", JSON.stringify(created, null, 2));
  process.exit(1);
}
console.error(`[seedance] request: ${id}`);
console.error(`[seedance] ${duration}s @ ${resolution} ${aspect} — polling…`);

for (let i = 0; i < 300; i++) {
  await Bun.sleep(3000);
  const poll = await fetch(
    `https://api.wavespeed.ai/api/v3/predictions/${id}/result`,
    { headers: { Authorization: `Bearer ${KEY}` } }
  );
  const p = (await poll.json()) as { data?: { status?: string; outputs?: string[]; error?: string } };
  const status = p.data?.status;
  if (i % 5 === 0) console.error(`[seedance] ${i + 1}/300: ${status}`);
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
      console.error(`[seedance] saved to ${out}`);
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

console.error("[seedance] timeout after 900s");
process.exit(1);
