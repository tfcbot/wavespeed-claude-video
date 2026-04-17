# Seedance 2.0 shot-list template

The structure that actually produces multi-shot dynamic ads. In side-by-side testing, a time-beat narrative prompt produced 3 shots in 15s, while the explicit `CUT. SHOT N:` structure below produced 7 shots in the same 15s. The difference is the explicit cut markers + per-shot variety in framing/angle/movement/location.

## Why this matters

Seedance 2.0 interprets your prompt literally. "0–4s: hook, 4–9s: product reveal" reads as **one continuous take** with interpolated motion between beats. To get hard cuts between distinct shots, you have to tell Seedance there are distinct shots.

## The template

```
[DURATION]-second UGC ad for [PRODUCT]. Composed of [N] hard cuts — follow this shot list exactly. Hard cut between every shot. Each shot has a different camera angle, framing, and location.

SHOT 1 (0-Xs): [FRAMING], [ANGLE], [MOVEMENT].
  Setting: [LOCATION — be specific].
  [WHO] does [WHAT]. Says: "[DIALOGUE]"

CUT. SHOT 2 (Xs-Ys): [FRAMING], [ANGLE], [MOVEMENT].
  Setting: [DIFFERENT LOCATION].
  [WHO] does [WHAT]. Says: "[DIALOGUE]"

... (continue for N shots)

Audio: [VOICE STYLE], [REVERB/AMBIENT NOTES], [MUSIC OR NO MUSIC].
[ASPECT RATIO] vertical, [RESOLUTION], [DURATION] seconds total. Native audio ON.
```

## Vocabulary (use these exact terms)

**Framing** — pick one per shot:
- `EXTREME_CLOSEUP` — detail (eye, product texture, label)
- `CLOSEUP` — head or hand-held object fills frame
- `MEDIUM_CLOSEUP` — chest up, the UGC default
- `MEDIUM` — waist up
- `MEDIUM_WIDE` — full body, head to knees
- `WIDE` — full body + environment
- `EXTREME_WIDE` — subject tiny in big environment

**Angle** — pick one per shot:
- `EYE_LEVEL` — neutral UGC default
- `LOW_ANGLE` — looking up at subject (hero shot, or feet on ground looking up)
- `HIGH_ANGLE` — looking down (overhead product, or shoes on feet from waist POV)
- `OVERHEAD` — straight top-down
- `POV` — through the subject's eyes

**Movement** — pick one per shot:
- `STATIC` — camera locked off
- `HANDHELD` — slight organic sway (UGC default)
- `PAN` — horizontal rotate
- `TILT` — vertical rotate
- `DOLLY` — in/out along camera axis (push in / pull out)
- `TRACKING` — follows subject laterally
- `ORBIT` — circles around subject

## Density targets

| Content type | Cuts per 10s | Total shots in 15s |
|---|---|---|
| Premium brand / luxury | 2–3 | 3–5 |
| Standard UGC social ad | 4–5 | 6–8 |
| Gadzhi / high-energy cut-heavy | 6–8 | 9–12 |

Default to the middle row. Too few cuts → feels flat. Too many → feels chaotic and you blow the 15s Seedance budget on setup frames.

## Required variety rule

**Across your N shots, you must vary at least 3 of:** `framing`, `angle`, `movement`, `location`, `subject_action`.

Don't stay in one location with one camera setup across multiple shots. Even if the creator doesn't move, change the angle or framing to signal "new shot" to Seedance.

## Dialogue integration

Put dialogue verbatim in quotes within the shot where it's spoken:

```
SHOT 3 (5-8s): MEDIUM_CLOSEUP, EYE_LEVEL, STATIC.
  Setting: sunlit kitchen counter.
  Creator's hands rotate the shoe to show the heel.
  Says: "Made from tech-knit and recycled EVA."
```

Seedance 2.0's native audio generates the spoken line from this text. Don't wire up ElevenLabs separately — one call, native audio, done.

## Worked example

```
15-second UGC ad for [your product]. Composed of 7 hard cuts — follow this shot list exactly. Hard cut between every shot. Each shot has a different camera angle, framing, and location.

SHOT 1 (0-2s): MEDIUM_CLOSEUP, EYE_LEVEL, STATIC.
  Setting: bright minimalist living room with a staircase visible on the right.
  A creator, mid-30s, cream cable-knit fisherman sweater, direct eye contact, points at camera mid-sentence.
  Says: "[Your hook sentence — a question that sets up your product benefit.]"

CUT. SHOT 2 (2-4s): EXTREME_CLOSEUP, EYE_LEVEL, SLOW HANDHELD.
  Setting: wooden console table, warm morning light.
  [Your product] sits alone on the table, camera slowly pushes in on a key detail.
  No dialogue, soft ambient sound.

CUT. SHOT 3 (4-6s): MEDIUM_WIDE, EYE_LEVEL, STATIC.
  Setting: home office with a standing desk and open laptop.
  Creator seated, typing, using/wearing the product.
  Says: "[Benefit statement in context — frames the product in the user's world.]"

CUT. SHOT 4 (6-8s): LOW_ANGLE CLOSEUP, STATIC.
  Setting: same home office, under the desk.
  Close on a detail that proves the benefit (feet, hands, finish).
  Says: "[Second benefit statement.]"

CUT. SHOT 5 (8-10s): CLOSEUP, HANDHELD, LIGHT SWAY.
  Setting: kitchen counter, natural light.
  Creator's hands rotate the product to show another angle.
  Says: "[Material / construction / quality callout.]"

CUT. SHOT 6 (10-12s): HIGH_ANGLE POV, TRACKING FORWARD.
  Setting: outdoor environment relevant to the product use case.
  POV looking at the product in use.
  Says: "[Third benefit or lifestyle statement.]"

CUT. SHOT 7 (12-15s): MEDIUM_CLOSEUP, EYE_LEVEL, STATIC.
  Setting: back in the opening location.
  Creator smiling, holding the product.
  Says: "[Tagline. Link in my bio.]"

Audio: warm mid-pitch conversational voice with a slight audible smile, natural room reverb that changes subtly with each location, no music bed. 9:16 vertical, 480p, 15 seconds. Native audio ON.
```

Fill in each `[bracketed placeholder]` with your specifics. The structural skeleton — 7 cuts, varied framing/angle/movement/location across them, quoted dialogue per shot — is what makes Seedance produce a multi-shot ad rather than one continuous take.
