# Product Image Variant Generator

Upload one product photo, get **30 marketplace-ready square variants** — background
removed, tight-cropped, centered, and framed to spec. Everything runs client-side
in the browser (Next.js + Canvas + `@imgly/background-removal`); no image is ever
sent to your own server.

## Spec this follows

- Aspect ratio: 1:1 square
- Resolution: ≥ 1000 × 1000 px
- Format: JPEG or PNG (toggle in the UI)
- Background: plain white / light neutral
- Main subject: product only — no text, watermark, props, or model
- Framing: centered, tight crop, product fills 70–90% of the frame
- 30 variants = combinations of crop tightness (70–90%), background tone
  (white / soft-white / light grey), and an optional soft ground shadow —
  all generated from the **same** uploaded photo, as your "main + extra angle"
  style set.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, drop in a product photo, pick JPEG or PNG, and click
**Generate 30 variants**. Download any single image, or grab all 30 as a ZIP.

## How it works

1. **Background removal** — `@imgly/background-removal` runs a local ONNX model
   in the browser (via WASM) to cut the product out. Nothing is sent to a remote
   AI API; the model weights are fetched once from imgly's CDN and cached by the
   browser, so the very first run needs an internet connection.
2. **Trim** — the cutout is trimmed to the bounding box of its non-transparent
   pixels, so later framing has no built-in dead space.
3. **Composite** — for each of the 30 configs, the trimmed product is drawn
   centered onto a plain square canvas at the target fill percentage, with an
   optional soft blurred ellipse as a ground shadow.
4. **Export** — each canvas is exported via `toBlob` as JPEG or PNG and offered
   as an individual download link; "Download all" zips them client-side with
   `jszip`.

## Notes & limits

- Very low-resolution source photos will still be upscaled to hit 1000×1000px,
  but will look softer — the UI flags this when it detects a small source.
- `ctx.filter` (used for the soft shadow blur) is supported in all current
  evergreen browsers (Chrome, Edge, Firefox, Safari).
- This is a static, client-only app — deployable as-is to Vercel, Netlify, or any
  static host.

## Project structure

```
app/
  layout.tsx        root layout, fonts
  page.tsx           main UI + orchestration
  globals.css
components/
  Uploader.tsx       drag/drop + click-to-browse input
  VariantGrid.tsx    thumbnail grid, per-item + bulk download
lib/
  bgRemoval.ts        wrapper around @imgly/background-removal
  variants.ts         trimming, variant configs, canvas compositing
  zip.ts              client-side ZIP packaging
```
