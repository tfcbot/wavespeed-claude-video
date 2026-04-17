# UGC realism guidelines

Tokens to include in Seedance prompts to avoid AI-tell visual cues.

## Camera imperfections (the realism cues)

Add at least two per shot:
- `handheld with gentle sway` (not `static` — nobody shoots UGC on a tripod)
- `shallow depth of field, 50mm feel`
- `slight lens vignette`
- `subtle motion blur on quick moves`
- `natural grain`
- `phone camera characteristic — iPhone 15 Pro footage`
- `light chromatic aberration at frame edges`
- `slight overexposure on window edges`

## Creator styling

- `mid-30s, unpolished expression` reads as real; `perfect, symmetrical face` reads as AI
- Wardrobe: specify texture + wear (`worn cotton tee`, `cream cable-knit fisherman sweater`, `broken-in denim`)
- Hair: specify slight imperfection (`short brown hair, slightly messy`, `quick morning hair`)
- Expression: `genuine`, `mid-sentence`, `slight audible smile`, `unpolished` — NOT `professional`, `polished`, `model-like`

## Environment

- Specify real rooms (`kitchen with dishes in the sink`, `living room with a throw blanket draped on the couch`)
- Natural light direction: `soft natural window light from the left` (always name a direction)
- Avoid: `sterile`, `minimal`, `studio` unless the product demands it

## Audio

- Voice: `warm mid-pitch conversational voice with a slight audible smile` — this produces the best UGC voice
- Reverb: `natural room reverb` (not `studio dry`)
- Music: almost always `no music bed` for UGC. Music = ad. Silence + room tone = authentic.

## What NOT to say in a Seedance prompt

- `Professional commercial` — Seedance renders this as over-lit studio → AI tell
- `High production value` — same problem
- `4K cinematic` — pushes Seedance toward oversharp / uncanny
- `Model` — produces uncanny-valley faces. Use `person`, `creator`, `influencer`.
- `Perfect lighting` — specify direction instead
- `Smooth` — produces unnatural robot motion. Prefer `natural`, `gentle`.

## Tell density calibration

Your AI tells budget per 15s shot list:
- **0–1 tells** = reads fully as real UGC
- **2–3 tells** = reads as "probably AI but decent"
- **4+ tells** = reads as clearly AI

Tells to watch for in Seedance outputs:
- Hands (Seedance 2.0 is much improved but finger morphing on close-ups still happens — avoid close-ups of hands if you can)
- Text on products (symbols / 2–3 letter wordmarks only, or composite in post)
- Feet walking (sometimes the gait looks off — crop below knees for feet shots)
- Reflections in eyes (too perfect or too simple — prefer wider framing)

## The 480p paradox

Counterintuitively, **480p reads more authentic than 720p** for UGC. Real phone footage uploaded to TikTok/Reels gets compressed to ~480p effective, so AI artifacts get masked by the compression. At 720p the artifacts stay crisp and more noticeable. Default to 480p — save money AND read more real.
