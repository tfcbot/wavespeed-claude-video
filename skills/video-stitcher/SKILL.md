---
name: video-stitcher
description: Concatenate multiple Seedance clips into a single longer video with audio normalized. Use only when the target ad exceeds Seedance's 15s per-clip cap and you need 20s+, 30s+, or 60s outputs. For 15s or less, a single Seedance call is always the right answer — don't stitch unnecessarily.
---

# video-stitcher

ffmpeg-based concat for multi-clip ad assembly. Called rarely — most ads fit in one 15s Seedance call.

## When to invoke

Only when:
- User wants 20s+, 30s, or 60s ad → cap is Seedance's 15s, so generate N clips and stitch
- User has existing clips from another source they want joined
- The ad-clone-analyzer determined the reference is >15s and the hook structure really demands full coverage

**Do not** invoke to stitch 2-3 short clips when a single 15s shot-list prompt would produce the same result in one call. One Seedance invocation with the shot list is almost always better than stitching — character/lighting/audio continuity is preserved natively.

## Requirements

- `ffmpeg` on PATH (see the repo README — required for the whole repo, not just this skill)
- All input clips at the same resolution + fps (use the same Seedance specs for each)

## Pipeline

1. **Build concat manifest** — a text file listing each clip:
   ```
   file 'clip-1.mp4'
   file 'clip-2.mp4'
   file 'clip-3.mp4'
   ```
2. **Concat** without re-encoding (if specs match):
   ```bash
   ffmpeg -f concat -safe 0 -i concat.txt -c copy stitched.mp4
   ```
3. **Normalize audio** to broadcast standard (recommended — Seedance clips have inconsistent levels):
   ```bash
   ffmpeg -i stitched.mp4 \
     -af "loudnorm=I=-16:LRA=11:TP=-1.5" \
     -c:v copy \
     final.mp4
   ```

Combined via the helper:

```bash
bun scripts/ffmpeg-concat.ts \
  --clips clip-1.mp4 clip-2.mp4 clip-3.mp4 \
  --out final.mp4 \
  --normalize
```

## Character continuity across clips

For the last frame of clip N to match the first frame of clip N+1, use Seedance's `last_image` parameter on clip N, which matches to an `image` on clip N+1. This works but is fiddly — before going multi-clip, first try packing everything into a single 15s shot list.

## Output

- Single MP4 at specified path
- Duration + file size printed to stdout

## Common failure modes

- **Audio pops at concat boundaries** → always run the loudnorm pass
- **Resolution mismatch** → ffmpeg's concat demuxer fails silently if inputs differ. Use `-c:v libx264 -c:a aac` (re-encode) instead of `-c copy` if you have mixed specs
- **Character drift across clips** → bite the bullet and use a single Seedance call with a tighter shot list. Multi-clip character continuity is a real problem.
