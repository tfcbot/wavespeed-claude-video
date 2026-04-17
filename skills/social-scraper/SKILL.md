---
name: social-scraper
description: Download a video from a social URL — Meta Ad Library, TikTok, Instagram Reel/post, or a direct mp4 URL — to a local file. Use when the user pastes a social video link and wants the file locally so another skill can analyze or clone it. Wraps Scrape Creators for the platforms that don't expose a direct mp4. Does NOT handle YouTube (pass YouTube URLs straight to gemini-analyze.ts — Gemini reads them natively).
---

# social-scraper

One URL in, one local mp4 out. Nothing else.

## When to invoke

- User pastes a TikTok / Instagram Reel / Meta Ad Library URL and wants the file
- Called internally by `ad-clone-analyzer` as step 0 for those platforms
- Any downstream skill that needs a reference mp4 file on disk

## When NOT to invoke

- **YouTube URLs** — pass them directly to `gemini-analyze.ts`. Gemini's API accepts YouTube URIs natively via `fileData.fileUri`; there's no need to download. `fetch-media.ts` will exit with an error if you hand it a YouTube URL.
- **Local files** — use `cp`. This script doesn't duplicate files.

## Supported sources

| Input pattern | API | Output |
|---|---|---|
| `facebook.com/ads/library?id=…` | Scrape Creators `/v1/facebook/adLibrary/ad` | local mp4 |
| numeric `^\d+$` (Meta `ad_archive_id`) | same | local mp4 |
| `tiktok.com/…`, `vm.tiktok.com/…`, `vt.tiktok.com/…` | Scrape Creators `/v2/tiktok/video` (prefers `download_no_watermark_addr`) | local mp4 |
| `instagram.com/(reel\|p\|tv)/…` | Scrape Creators `/v1/instagram/post` | local mp4 |
| `https://….mp4` or `.mov` | direct download | local mp4 |

## Execution

```bash
bun scripts/fetch-media.ts <source> [--out path]
```

Prints the output path on stdout. Errors on stderr. Exit codes: `0` success, `1` runtime error, `2` bad input.

### Examples

```bash
bun scripts/fetch-media.ts "https://www.facebook.com/ads/library?id=1234567890" --out references/ads/meta.mp4
bun scripts/fetch-media.ts "https://www.tiktok.com/@user/video/7251387037834595630" --out references/ads/tiktok.mp4
bun scripts/fetch-media.ts "https://www.instagram.com/reel/ABC123/" --out references/ads/ig.mp4
bun scripts/fetch-media.ts 1234567890 --out references/ads/meta.mp4   # raw ad_archive_id also works
```

## Environment

`SCRAPE_CREATORS_API` required for Meta / TikTok / Instagram. Not needed for direct mp4 URLs.

## Adding new sources

Scrape Creators' full endpoint catalog is at https://docs.scrapecreators.com/llms.txt.

To add a new platform (X, LinkedIn, Threads, etc.):

1. Find the endpoint in `llms.txt`
2. Read its doc page to learn the response shape and the JSON path to the playable mp4 URL
3. In `scripts/fetch-media.ts`, add a small `resolve<Platform>(source): Promise<string>` — two lines to call `scGet(...)`, a few lines to dig out the URL
4. Add a `ROUTES` entry with a URL regex → your resolver

Each new platform is roughly 15 lines of code. No changes needed elsewhere.

## Common failure modes

| Error | Cause | Fix |
|---|---|---|
| `SCRAPE_CREATORS_API not set` | missing key | paste a key into `.env` |
| `Meta ad … has no video` | ad is static image-only | the Meta Ad Library has both; pick a different ad |
| `Instagram post has no video` | post is a carousel of stills or a photo | pick a reel URL |
| `download failed: HTTP 403` | CDN URL expired between resolve and download | re-run the script — Scrape Creators returns fresh URLs each call |
| `Unrecognized source: …` | URL didn't match any route and isn't a direct `.mp4` | check the URL; for YouTube, pass to `gemini-analyze.ts` directly |
