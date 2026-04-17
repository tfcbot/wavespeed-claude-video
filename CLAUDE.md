# CLAUDE.md — wavespeed-claude-video

Project instructions for Claude Code when this repo is the working directory.

## What this repo does

Clone any winning ad for a user's product using a 3-tool stack:
- **Gemini** watches the reference video and returns a shot list
- **Nano Banana 2** (via Wavespeed) generates a product reference image
- **Seedance 2.0** (via Wavespeed) generates the final multi-shot ad with native audio

No ffmpeg frame extraction. No separate voice gen. No NLE. One Seedance call per ad.

## Skills

Four Claude Code skills live under `skills/`. Each `SKILL.md` contains the invocation contract. In order of frequency:

1. **`ad-clone-analyzer`** — the hero skill. User drops an ad URL (Meta Ad Library or mp4 file) and a product description. Skill runs the full pipeline end-to-end.
2. **`seedance-prompter`** — builds a Seedance 2.0 shot-list prompt from scratch (no reference ad).
3. **`nano-banana-prompter`** — generates a product image only (no video).
4. **`video-stitcher`** — ffmpeg concat for outputs longer than Seedance's 15s max.

## The shot-list rule (learned the hard way)

Seedance 2.0 interprets prompts literally. If you describe one continuous action with time beats ("0-4s: hook, 4-9s: product reveal..."), it renders **one long continuous take** with minimal cuts — the result feels flat.

To get multi-shot dynamic ads, use **explicit `CUT. SHOT N:` language**:

```
SHOT 1 (0-2s): MEDIUM CLOSE-UP, EYE LEVEL, STATIC. Setting: ...
CUT. SHOT 2 (2-4s): EXTREME CLOSE-UP, EYE LEVEL, HANDHELD. Setting: ...
CUT. SHOT 3 (4-6s): MEDIUM WIDE, LOW ANGLE, TRACKING. Setting: ...
```

Per shot, vary at least three of: `framing`, `angle`, `camera_movement`, `location`, `action`. Target **4-5 cuts per 10 seconds** for the UGC / Gadzhi feel.

See `prompting/shot-list-template.md` for the full template.

## Defaults when prompting Seedance 2.0

- **Resolution:** `480p` for social/mobile outputs. `720p` actually reads less authentic on mobile feeds — AI tells are more visible at higher resolution.
- **Aspect ratio:** `9:16` for Instagram / TikTok / YouTube Shorts, `1:1` for Meta feed static, `16:9` for YouTube / desktop.
- **Duration:** `15` seconds — the max, and the sweet spot for UGC ads. Only stitch clips when the ad legitimately runs longer.
- **Native audio:** always ON. Seedance 2.0 generates dialogue from the prompt — no separate voice gen needed.

## API usage conventions

- All secrets live in `.env` (never committed). See `.env.example`.
- Bun + TypeScript for all helper scripts under `scripts/`. No Node, no ts-node.
- Wavespeed async pattern: POST creates a job → poll `/api/v3/predictions/{id}/result` every 2–3s until `status === "completed"`.
- Gemini uploads large videos via Files API (not inline base64) to avoid command-line arg limits.

## Workflow when user asks to "clone this ad for my product"

1. Invoke `ad-clone-analyzer`:
   - Upload reference to Gemini Files API → analyze for shot list → save JSON
   - Generate product image with Nano Banana 2 (if not provided)
   - Build Seedance shot-list prompt from the reference analysis + user's product
   - Call Seedance 2.0 with product image as `image` field, 15s @ 480p 9:16
   - Poll until complete, download to `references/outputs/`
   - Round-trip: send output to Gemini to verify shot count matches reference

2. Report back:
   - Shot count achieved vs reference
   - Path to output file

## Conventions

- Never print API keys to terminal. Save them to config files and print the path.
- No interactive prompts in scripts — always flag-driven so agents can run them.
- Use semantic versioning (v1.0.0) for iterations, not ad-hoc v1/v2.
- For product images: 1:1 aspect, 2048×2048, white seamless background, editorial e-commerce lighting.
- For UGC video: always include authenticity cues — "handheld with slight sway", "genuine unpolished expression", "natural room reverb, no music bed".
