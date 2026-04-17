---
name: ad-clone-analyzer
description: Clone any winning ad for a user's product end-to-end. Use when the user provides a reference ad (URL, Meta Ad Library ID, or local MP4) and asks for a cloned version targeting their own product. The skill runs Gemini video analysis, generates a product reference image with Nano Banana 2, and fires a single Seedance 2.0 call to produce a multi-shot ad with native audio. No voice generation, no ffmpeg stitching.
---

# ad-clone-analyzer

The hero skill. Takes a reference ad + product description, returns a cloned MP4.

## When to invoke

- User says "clone this ad for my product"
- User drops a Meta Ad Library URL, a YouTube link, or a local MP4
- User asks to "make a version of this ad for [my brand]"

## Input contract

The user provides:
1. **Reference source** — one of:
   - **Meta Ad Library** URL (e.g. `https://www.facebook.com/ads/library?id=12345`) or raw ad_archive_id — downloaded via Scrape Creators
   - **TikTok** URL (e.g. `https://www.tiktok.com/@user/video/12345`) — downloaded via Scrape Creators (prefers watermark-free)
   - **Instagram** Reel or post URL (e.g. `https://www.instagram.com/reel/ABC123/`) — downloaded via Scrape Creators
   - **YouTube** or YouTube Shorts URL — passed straight to Gemini via `fileData.fileUri` (no download; no Scrape Creators call needed)
   - Direct mp4 URL
   - Local file path (e.g. `references/ads/my-ref.mp4`)
2. **Product description** — brand name + category + key visual attributes
3. **(optional)** Product image file or URL. If missing, skill generates one via Nano Banana 2.
4. **(optional)** Target platform → sets aspect ratio (Meta/IG/TikTok → 9:16, YouTube → 16:9). Default 9:16.

## Pipeline

### 0. Obtain the reference

- If the user provides a **Meta Ad Library / TikTok / Instagram / direct mp4** URL, delegate to `/social-scraper` to download it to `references/ads/<slug>.mp4`.
- If the user provides a **YouTube URL**, skip this step. Gemini accepts YouTube URLs natively via `fileData.fileUri`; `gemini-analyze.ts` passes them through unchanged.
- If the user provides a **local file**, use it directly.

```bash
# Social URLs / direct mp4 → download first
bun scripts/fetch-media.ts <source> --out references/ads/<slug>.mp4
```

### 1. Analyze the reference with Gemini

Upload the reference video to Gemini's Files API (resumable upload for anything >2 MB), wait for `state === "ACTIVE"`, then call `gemini-2.5-flash:generateContent` with a shot-list prompt:

```
Break this video into a shot list. A SHOT is the frames between two hard cuts.
Return JSON:
{
  "total_shots": number,
  "shots": [{"n": number, "start": number, "end": number,
             "framing": string, "angle": string, "movement": string,
             "location": string, "in_frame": string, "spoken": string}],
  "creator": {"gender", "age_range", "hair", "wardrobe", "expression_style"},
  "hook_structure": string
}
```

Save to `references/outputs/<slug>/00-reference-analysis.json`.

### 2. Generate the product image (if not provided)

If no product image was given, build a Nano Banana 2 prompt from the product description:

> "Hyperrealistic product photo: [product] in [color/material], [key detail], clean white seamless background, studio softbox lighting from above and left, shallow depth of field, 3/4 angle, editorial e-commerce style, 1:1 aspect ratio."

POST to `https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image` with `size: "2048*2048", num_images: 1`. Poll `/api/v3/predictions/{id}/result` every 2s until `completed`, download the image.

### 3. Build the Seedance 2.0 shot-list prompt

**Critical:** Seedance interprets prompts literally. Use explicit `CUT. SHOT N:` language. See `prompting/shot-list-template.md`. For each shot, vary at least three of:
- framing (`EXTREME_CLOSEUP` / `CLOSEUP` / `MEDIUM` / `MEDIUM_WIDE` / `WIDE`)
- angle (`EYE_LEVEL` / `LOW_ANGLE` / `HIGH_ANGLE` / `OVERHEAD` / `POV`)
- movement (`STATIC` / `HANDHELD` / `TRACKING` / `DOLLY` / `PAN`)
- location
- action

Target **4–5 cuts per 10 seconds** to match UGC ad energy. If the reference had 10 shots / 25s (≈4 cuts per 10s) and you're generating 15s, aim for 6–7 shots.

Rewrite the spoken dialogue from the reference analysis, substituting the user's product and brand specifics. Keep the same sentence cadence and hook structure.

### 4. Call Seedance 2.0

```
POST https://api.wavespeed.ai/api/v3/bytedance/seedance-2.0/image-to-video
Authorization: Bearer $WAVESPEED_API_KEY
Content-Type: application/json

{
  "prompt": "<shot-list prompt>",
  "image": "<product image URL>",
  "aspect_ratio": "9:16",
  "resolution": "480p",
  "duration": 15
}
```

**Resolution default: `480p`.** Reads more authentic on mobile feeds — lower resolution hides the AI tells that get noticeable at higher resolution. Only go to 720p if the target is YouTube/desktop.

Poll `/api/v3/predictions/{id}/result` every 3s until `completed`. Download `outputs[0]` to `references/outputs/<slug>/cloned-ad.mp4`.

### 5. Verify with a round-trip Gemini analysis

Upload the clone back to Gemini, run the same shot-list prompt. Compare:
- Shot count should match or exceed the reference's density (cuts per 10s)
- Hook structure should match
- Framing variety should be ≥ 3

Save to `references/outputs/<slug>/01-verification.json`. If the clone has < ⅔ the reference's cut density, regenerate with more explicit `CUT. SHOT N:` markers.

## Output

Report to the user:
- Path to `cloned-ad.mp4`
- Shot count vs reference
- Wavespeed-hosted URL (playable in browser for ~7 days)

## Helper scripts

This skill is fully scriptable via Bun:

```bash
bun scripts/fetch-media.ts <source> --out references/ads/<slug>.mp4   # skip for YouTube / local files
bun scripts/gemini-analyze.ts --video <local-mp4-or-youtube-url> --out references/outputs/<slug>/00-reference-analysis.json
bun scripts/nano-banana.ts --prompt "<prompt>" --out references/products/<slug>.png
bun scripts/seedance.ts --prompt "<prompt>" --image <image-url> --duration 15 --resolution 480p --aspect 9:16 --out references/outputs/<slug>/cloned-ad.mp4
```

Each script does one thing. Compose via stdout → next command's `--video` / `--image` arg.

## Common failure modes

- **Clone feels flat / too few shots** → your prompt used narrative beats instead of explicit `CUT. SHOT N:`. Rewrite with hard `CUT.` markers and distinct per-shot framing/angle/movement.
- **Text on product mangled** → Seedance still gets fine text wrong. Use a short symbol or 2–3 letter wordmark, or composite the logo in post.
- **Voice doesn't match energy** → be specific in prompt about "warm conversational voice with audible smile" or "deadpan monotone". Don't leave voice to defaults.
