#!/usr/bin/env bun
// ffmpeg concat + loudnorm audio normalization for stitching Seedance clips.
//
// Usage:
//   bun scripts/ffmpeg-concat.ts --clips a.mp4 b.mp4 c.mp4 --out final.mp4 [--normalize]

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Args = { clips: string[]; out: string; normalize: boolean };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Partial<Args> = { normalize: false };
  const clips: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--clips") {
      i++;
      while (i < argv.length && !argv[i].startsWith("--")) {
        clips.push(argv[i]);
        i++;
      }
      i--;
    } else if (a === "--out") {
      out.out = argv[i + 1];
      i++;
    } else if (a === "--normalize") {
      out.normalize = true;
    }
  }
  if (!out.out || clips.length === 0) {
    console.error("Usage: bun ffmpeg-concat.ts --clips a.mp4 b.mp4 --out final.mp4 [--normalize]");
    process.exit(1);
  }
  return { ...out, clips } as Args;
}

const { clips, out, normalize } = parseArgs();

// Check ffmpeg exists
const check = Bun.spawnSync(["which", "ffmpeg"]);
if (check.exitCode !== 0) {
  console.error("ffmpeg not found. Install: brew install ffmpeg");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "concat-"));
const manifest = join(tmp, "concat.txt");
await Bun.write(
  manifest,
  clips.map((c) => `file '${c.startsWith("/") ? c : `${process.cwd()}/${c}`}'`).join("\n") + "\n"
);

const stitched = normalize ? join(tmp, "stitched.mp4") : out;

console.error(`[ffmpeg-concat] concatenating ${clips.length} clips → ${stitched}`);
const concatProc = Bun.spawnSync({
  cmd: ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", manifest, "-c", "copy", stitched],
  stderr: "pipe",
});
if (concatProc.exitCode !== 0) {
  console.error("concat failed:", new TextDecoder().decode(concatProc.stderr));
  rmSync(tmp, { recursive: true });
  process.exit(1);
}

if (normalize) {
  console.error("[ffmpeg-concat] normalizing audio → " + out);
  const normProc = Bun.spawnSync({
    cmd: [
      "ffmpeg", "-y", "-i", stitched,
      "-af", "loudnorm=I=-16:LRA=11:TP=-1.5",
      "-c:v", "copy",
      out,
    ],
    stderr: "pipe",
  });
  if (normProc.exitCode !== 0) {
    console.error("loudnorm failed:", new TextDecoder().decode(normProc.stderr));
    rmSync(tmp, { recursive: true });
    process.exit(1);
  }
}

rmSync(tmp, { recursive: true });

// Report final stats
const size = Bun.file(out).size;
console.error(`[ffmpeg-concat] done — ${out} (${(size / 1024 / 1024).toFixed(1)} MB)`);
console.log(out);
