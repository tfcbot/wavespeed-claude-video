---
name: nano-banana-prompter
description: Generate a product image via Nano Banana 2 (Wavespeed). Use when the user needs a hyperrealistic product photo for reference in video generation, for their e-commerce listing, or as standalone b-roll.
---

# nano-banana-prompter

Turn a product description into a clean product photo. The image becomes the reference for `ad-clone-analyzer` / `seedance-prompter` and can also stand alone as e-commerce creative.

## When to invoke

- "Generate a product image for my [brand]"
- "Make a reference photo of [product] for the video"
- `ad-clone-analyzer` calls this automatically when no product image is provided

## Prompt template

```
Hyperrealistic product photo: [PRODUCT] in [COLOR/MATERIAL], [KEY DETAILS],
clean pure white seamless background, studio softbox lighting from above
and left casting soft natural shadow, shallow depth of field,
[ANGLE — typically "3/4 profile"], editorial e-commerce style,
[ASPECT RATIO — typically 1:1 square].
```

### Specifics that matter

- **Background:** always "pure white seamless" unless the user asks for lifestyle. Flat backgrounds composite better into later Seedance shots.
- **Lighting:** "studio softbox from above and left" produces a reliable clean look. Specify a direction — "studio lighting" alone is too vague.
- **Angle:** default `3/4 profile`. Front-facing reads as stock photo; side profile reads as catalog. 3/4 reads as "product photo worth an ad."
- **Detail count:** 3–5 specific material / shape callouts. More than 5 and Nano Banana starts averaging.
- **Text:** avoid text on the product. Nano Banana 2 can render small wordmarks but reliability drops with word length. Keep logos to a short symbol or 2–3 letters.

## Execution

```bash
bun scripts/nano-banana.ts \
  --prompt "Hyperrealistic product photo: ..." \
  --size 2048x2048 \
  --out references/products/my-product.png
```

## Defaults

| Param | Default |
|---|---|
| size | `2048*2048` (1:1 square) |
| num_images | `1` |
| enable_base64_output | `false` (returns hosted URL + downloads) |

For 9:16 product hero shots (when the image itself is the end deliverable, not a Seedance reference): `size: "1024*2048"`. For 16:9: `size: "2048*1152"`.

## Output

- PNG downloaded to specified path
- Wavespeed-hosted URL printed to stdout (reusable as Seedance `image` input)

## Common failure modes

- **Product rendered too stylized / cartoony** → add "hyperrealistic" and "photograph" to the prompt. Nano Banana 2 can drift stylized without these anchors.
- **Weird proportions on unusual products** → reference an analogous well-known product in the prompt ("shaped like a 2024 Nike Air Max 90"). Nano Banana 2 has seen thousands of shoes; leverage that.
- **Background bleeding into the product** → add "cutout on seamless white background, no reflections." Otherwise it sometimes paints soft shadows onto the product.
