# wavespeed-claude-video

Clone any winning ad for your product — from the terminal, in minutes. A Claude Code skill pack that pairs Gemini video understanding with Wavespeed's Seedance 2.0, Nano Banana 2, and native audio generation.

**No video editing software. No creative agencies. No hired talent. No code required.**

## What it does

Drop any winning ad URL into Claude Code — **Meta Ad Library, TikTok, Instagram Reel, or YouTube Short**. The agent downloads the reference, watches the full video with Gemini, extracts the shot list, rewrites every beat for your product, generates a reference product image with Nano Banana 2, and fires off a single Seedance 2.0 call that produces a 15-second multi-shot ad with native audio. End to end in minutes, one command.

## Why it exists

Ad performance is speed-to-capture. Winning ads have a short shelf life — by the time you brief a creator and wait for delivery, the format is saturated. This workflow closes the gap: spot an ad working in the wild in the morning, ship your version in the afternoon.

The core unlock vs other clone workflows: **Gemini watches the full video** instead of extracting screenshots. It sees motion, transitions, audio, pacing, dialogue — all in one pass — and returns a structured shot list Claude can rewrite.

## Getting started

Fastest path: open [Claude Code](https://claude.com/product/claude-code) in any empty directory and paste the prompt below. Claude will clone the repo, install the skills, set up your `.env`, and walk you through getting your first cloned ad on the screen.

### The one-prompt setup

Copy this entire block and paste it into Claude Code:

> Clone the repo `https://github.com/tfcbot/wavespeed-claude-video` into the current working directory. Once it's cloned:
>
> 1. Read the README, CLAUDE.md, and each `skills/*/SKILL.md` so you understand the four skills and when to use each.
> 2. Install the Claude Code skills by running `npx skills add .` from the repo root.
> 3. Copy `.env.example` to `.env`. Ask me for my Wavespeed, Gemini, and Scrape Creators API keys one at a time, and write each into the new `.env` file. If I don't have keys yet, direct me to `https://wavespeed.ai`, `https://aistudio.google.com/apikey`, and `https://scrapecreators.com`, then wait until I have them. Scrape Creators is how we download the reference ad from the Meta Ad Library.
> 4. Run `bun setup.ts` to verify the environment. Report any failures and help me fix them.
> 5. Once setup passes, ask me for a reference ad URL (Meta Ad Library, TikTok, Instagram Reel, YouTube, YouTube Shorts, or a local mp4 path) and a description of the product I want to make an ad for. Then invoke the `ad-clone-analyzer` skill to produce a cloned 15-second ad for me, saving the output to `references/outputs/`.
> 6. Open the resulting mp4 so I can watch it and report back with the shot count and the Wavespeed-hosted URL.
>
> Don't skip any step. If anything fails, stop and explain what went wrong before continuing.

That prompt takes you from nothing to a finished 15-second AI ad on your screen. Run it once; after that, invoke the skills directly (`/ad-clone-analyzer`, `/seedance-prompter`, etc.) whenever you want to make another.

### Manual setup (if you'd rather not paste the prompt)

```bash
# 1. Clone
git clone https://github.com/tfcbot/wavespeed-claude-video.git
cd wavespeed-claude-video

# 2. Install Claude Code skills
npx skills add .

# 3. Copy .env.example → .env and paste your API keys
cp .env.example .env
#   open .env and paste WAVESPEED_API_KEY and GEMINI_API_KEY

# 4. Verify setup
bun setup.ts

# 5. In Claude Code, invoke the ad-clone-analyzer skill:
#   "Use /ad-clone-analyzer on <reference-ad-url>
#    and rewrite it for my product: <product description>"
```

## Requirements

Fresh-Mac install path — four commands and nothing else:

```bash
xcode-select --install                                      # git + build tools
curl -fsSL https://bun.sh/install | bash                    # Bun runtime for every script
curl -fsSL https://claude.ai/install.sh | bash              # Claude Code
brew install ffmpeg                                         # video tooling
```

No Node, no npm, no TypeScript compiler, no Docker, no Python. Bun is a full runtime replacement — it runs `.ts` files directly. Claude Code has its own bundled runtime separate from Bun.

API keys (paste into `.env` after `cp .env.example .env`):

- [Wavespeed](https://wavespeed.ai) — one key covers Seedance 2.0 + Nano Banana 2 + ElevenLabs
- [Gemini](https://aistudio.google.com/apikey) — video understanding
- [Scrape Creators](https://scrapecreators.com) — downloads reference videos from Meta Ad Library, TikTok, and Instagram. (Not needed for YouTube / Shorts — Gemini accepts those URLs directly.)

## Skills

| Skill | Invokes when | Input | Output |
|---|---|---|---|
| **ad-clone-analyzer** | User drops a reference ad and asks to clone it | Video source + product description | 15s cloned ad MP4 |
| **social-scraper** | User pastes a Meta Ad Library / TikTok / Instagram URL and wants the mp4 locally | Social URL or direct mp4 URL | Local mp4 file |
| **seedance-prompter** | User wants to author a Seedance 2.0 video from scratch | Product + style description | Seedance shot-list prompt + MP4 |
| **nano-banana-prompter** | User needs a product reference image | Product description | Image PNG |
| **video-stitcher** | User has multiple Seedance clips >15s total | Multiple MP4 files | Concatenated MP4 with loudnorm audio |

YouTube URLs don't need `social-scraper` — Gemini reads YouTube URIs natively, so pass them straight to `gemini-analyze.ts`.

See each skill's `SKILL.md` for the full contract.

## Repository layout

```
wavespeed-claude-video/
├── skills/
│   ├── ad-clone-analyzer/SKILL.md         # the hero skill
│   ├── social-scraper/SKILL.md            # social URL → local mp4
│   ├── seedance-prompter/SKILL.md
│   ├── nano-banana-prompter/SKILL.md
│   └── video-stitcher/SKILL.md
├── scripts/                                # Bun helpers each skill can call
│   ├── fetch-media.ts
│   ├── gemini-analyze.ts
│   ├── nano-banana.ts
│   ├── seedance.ts
│   └── ffmpeg-concat.ts
├── prompting/
│   ├── shot-list-template.md               # the shot-list structure that works
│   ├── ugc-guidelines.md                   # camera imperfections, skin texture, etc.
│   └── product-hero.md                     # cinematic product shot templates
├── examples/                               # drop your generated outputs here
├── references/
│   ├── products/                           # your product images go here
│   ├── ads/                                # reference ads to clone
│   └── outputs/                            # generated videos
├── setup.ts                                # env check
├── .env.example
└── CLAUDE.md                               # project instructions for Claude Code
```

## The shot-list insight

The single biggest Seedance prompt learning in this repo — see `prompting/shot-list-template.md`. Narrative time beats ("0–4s hook, 4–9s reveal…") render as **one continuous take** with almost no cuts. Explicit `CUT. SHOT N:` language with per-shot framing/angle/movement/location produces proper multi-shot ads at 4–5 cuts per 10 seconds. Use the template every time.

## License

MIT. See `LICENSE`.
