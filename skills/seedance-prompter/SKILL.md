---
name: seedance-prompter
description: Author a Seedance 2.0 video ad from scratch (no reference ad). Use when the user describes a product and an ad concept and wants a multi-shot 15s ad. The skill writes a shot-list-structured Seedance prompt and calls Wavespeed to produce the MP4.
---

# seedance-prompter

For when the user has a product in mind but no reference ad. Writes an original shot-list prompt and generates the video.

## When to invoke

- "Make a product ad for [brand]"
- "Generate a 15s UGC video for my [product]"
- "Write a Seedance prompt for this concept"

## Input contract

The user provides:
1. **Product** — brand name, category, key visual attributes
2. **Concept / angle** — what's the hook? (e.g. "comfort of a sneaker, look of a dress shoe")
3. **Platform** — IG/TikTok/YouTube → aspect ratio
4. **(optional)** Product image. If missing, delegate to `nano-banana-prompter`.

## Prompt template (the shot-list that Seedance actually follows)

Use the template at `prompting/shot-list-template.md`. Structure:

```
15-second UGC ad for [PRODUCT]. Composed of [N] hard cuts — follow this shot list exactly.

SHOT 1 (0-Xs): [FRAMING], [ANGLE], [MOVEMENT]. Setting: [LOCATION].
  [WHO is doing WHAT]. Says: "[DIALOGUE]"

CUT. SHOT 2 (...): [...]

...

Audio: [VOICE STYLE], [REVERB/AMBIENT], [MUSIC OR NONE]. 9:16 vertical, 480p, 15 seconds. Native audio ON.
```

**Critical rules** (see `prompting/shot-list-template.md` for the full reasoning):
- **Target 4–5 cuts per 10 seconds** for UGC energy (6–7 shots in 15s)
- Vary at least three per-shot dimensions: framing, angle, movement, location, action
- Use real vocabulary: `EXTREME_CLOSEUP | CLOSEUP | MEDIUM_CLOSEUP | MEDIUM | MEDIUM_WIDE | WIDE`, `EYE_LEVEL | LOW_ANGLE | HIGH_ANGLE | OVERHEAD | POV`, `STATIC | HANDHELD | TRACKING | DOLLY | PAN`
- Explicit `CUT.` marker between every shot — don't rely on time beats alone
- Specify dialogue verbatim in quotes — Seedance generates native audio from the text

## Defaults

| Param | Default | Notes |
|---|---|---|
| resolution | `480p` | Reads more authentic on mobile feeds |
| aspect_ratio | `9:16` | IG/TikTok. Switch to `1:1` for Meta static or `16:9` for YouTube |
| duration | `15` | Seedance 2.0 max; the sweet spot for UGC |
| native_audio | ON | Seedance handles dialogue — don't wire up ElevenLabs separately |

## Execution

```bash
bun scripts/seedance.ts \
  --prompt "$(cat my-prompt.txt)" \
  --image references/products/my-product.png \
  --resolution 480p --aspect 9:16 --duration 15 \
  --out references/outputs/my-ad.mp4
```

Or orchestrated by Claude Code directly — the skill's helper is `scripts/seedance.ts`.

## Output

- MP4 at specified output path
- Wavespeed-hosted URL (valid ~7 days) for quick preview

## Common failure modes

- **Flat output, no cuts** → your prompt described beats not shots. Rewrite with explicit `CUT.` markers. See `prompting/shot-list-template.md`.
- **Wrong product orientation** → make the product image explicit: "centered, 3/4 profile angle" in the Nano Banana prompt.
- **Voice too robotic** → add "with a slight audible smile" or "casual, unpolished, like a friend talking to camera" to the audio line.
