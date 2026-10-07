# Intrinsic image dimensions in static export

Studio/page content and the existing image files remain the authoring authority. The website exporter derives only missing HTML `width`/`height` attributes from the exact local image bytes.

## Why

At staging commit `a393299b1d22f4309d7efb3278e9eed2f9ca2413`, the generated website contained **79 image tags without a complete width/height pair**. The final export inventory resolves as:

- **70 static local images** across 20 normal website pages: dimensions can be derived exactly.
- **32 unique local image assets**: PNG or WebP in the current site.
- **1 runtime reader image** with `data-reader-page` and no source at export time: deliberately left untouched.
- protected game/cartridge HTML: deliberately outside this transform.

Width/height attributes give the browser an intrinsic aspect-ratio hint before image bytes decode. CSS/classes/source URLs/artwork are not changed.

## Derivation

`scripts/lib/intrinsic-image-dimensions.mjs` reads image headers directly. It supports:

- PNG IHDR dimensions;
- WebP VP8X, VP8L and VP8 frame dimensions;
- JPEG SOF dimensions for future local assets.

No image decoding, conversion, re-encoding, or third-party image dependency is used.

The transform runs **after** the existing owner-render freshness, base-path, link and robots checks. Therefore derived attributes are not confused with owner-authored Studio markup, but they are present in the final committed/sealed site.

Rules:

- an image that already has both authored dimensions is preserved verbatim;
- when both are absent, exact intrinsic pixel dimensions are added;
- when one dimension is authored, the missing dimension is derived from the real intrinsic aspect ratio while preserving the authored value;
- external, query-bearing, missing, unsupported or malformed static image sources refuse export instead of receiving guessed dimensions;
- an unknown no-src image refuses export;
- the single known reader runtime image may remain source-less and dimension-less until the reader supplies its page source;
- protected game HTML is untouched.

## Independent real-asset proof

The first candidate export measured **32 unique source assets**. A separate Chrome witness loaded every one and compared browser-decoded `naturalWidth`/`naturalHeight` to the header parser.

Result: **32/32 exact matches**.

A separate 700 ms delayed-image observation compared the prior staging tree with the candidate on Characters, Media, Play, World and Feast Pass at 390?844 and 1440?900. Results were mixed by route because existing CSS/runtime layout also contributes shifts, so this is **not** an acceptance threshold or Core Web Vitals claim. A six-run alternating recheck of the initially noisy mobile Media case produced median synthetic CLS **0.1478 baseline vs 0.1092 candidate**. The hard contract remains exact image dimensions and no route/layout regression.

## Acceptance

This optimization is acceptable only when:

1. the unit/negative tests pass;
2. the final export updates all eligible static image tags and leaves only the approved runtime reader image without a fixed source;
3. Studio source and protected game bytes remain unchanged;
4. the pinned Studio export reproduces committed `dist`;
5. the existing focused Pages tests and 83-route browser matrix remain green;
6. the sealed Pages deployment succeeds and affected live HTML matches merged Git.

This is a generated-output stability improvement, not a visual redesign and not a claim about Core Web Vitals or real-network performance.
