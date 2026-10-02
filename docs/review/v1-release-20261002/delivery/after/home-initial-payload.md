# PRELIMINARY TRIAL ONLY — shared-code WebP experiment (superseded; not final)

This record is retained as requested, but **must not be used as final delivery evidence**. It captured the transient shared Advanced Code / companion-default experiment, which was subsequently rolled back. The final correction is limited to Home companion `srcset` with the original PNG fallback; see [`final-home-initial-payload.md`](final-home-initial-payload.md) for the final Home-only cold-capture evidence. In particular, this trial's “PNG not requested” result does not qualify context-return behavior.

Post-render, read-only cold-load confirmation for the same checked-out baseline commit `0dfa18d2b7bad97d862849a4360000c3fa8c8aff` (tree `b6a61fb0f2c474809b2ca80f3dfb55ab4fc6260e`) with newly rendered local `dist/`. Source/render output was not changed by this audit. The preceding baseline capture is documented in `../home-initial-payload.md`.

## Method

Repeated the prior audit method: serve current committed-worktree `dist/` locally at `/toadal-feast-web/`, fresh cold Chrome context per viewport, initial Home navigation, no scrolling, wait for network idle plus 1.2 seconds. Captures each completed in under 3 seconds (well below the 30-second cap). Chromium CDP counted completed request encoded bytes. This is local static-artifact evidence, not GitHub Pages CDN compression/cache or production-network evidence.

## Before / after

| Viewport | Before requests / encoded bytes | After requests / encoded bytes | Net change |
|---|---:|---:|---:|
| Desktop 1440×900 | 27 / 2,209,593 B | 26 / 1,876,830 B | −1 request / −332,763 B (−15.1%) |
| Mobile 390×844 | 16 / 1,329,765 B | 15 / 997,002 B | −1 request / −332,763 B (−25.0%) |

After captures: all completed requests returned HTTP 200; zero failures; no horizontal overflow (1440/1440 and 390/390); no layout-shift entries or long tasks in these samples. Totals include local HTTP/header accounting and are uncompressed harness transfers.

## Companion verification

- Browser selected `/toadal-feast-web/assets/images/characters/toadal-victory.webp` as `currentSrc` for both the Home hero and floating companion at both viewports. Each cold page made **one** request for that shared image (63,624 CDP encoded bytes). The HTML still has the canonical PNG in `src` as the fallback, but Chrome requested **no `.png` at all** on either capture.
- Exact local rendered WebP SHA-256: `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb`, matching the existing approved `asset.home.character.toadal-victory-web` registry/lock hash. This optimized derivative points to the already approved canonical victory source SHA-256 `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`; no asset bytes were changed.
- Verified the existing WebP decodes to RGBA at 611×640 with alpha extrema 0–255, 209,145 fully transparent pixels, and 10,447 partial-alpha pixels. The byte-identical approved hash verifies the canonical pose and its transparent edge treatment are preserved; the page loaded and completed both hero and companion images.
- Pre-change trace transferred the companion PNG at 335,598 encoded bytes in addition to the hero WebP. Net cold transfer fell by 332,763 bytes in each profile; the 2,835-byte difference from the PNG transfer reflects other changed HTML/script bytes in the new Studio output, so the net measured reduction—not the PNG's gross size—is reported above.

## Deferred item retained

The duplicate Candy Kingdom URL remains: canonical environment plus `assets/studio/asset-home-world-desktop.da8261fa30.webp`, identical SHA-256 `da8261fa30f6535f5288f52841dc2123d21a3251340e5d7888d576b7531809b4`, each 183,551 encoded bytes in these traces. As directed, this is deferred because deduplication requires Studio materialization/source behavior changes or loss of the structured game-card asset binding. It is a non-blocking optimization; no edits were made to address it.

Desktop still fetches the existing near-viewport discovery sprites under the established 160 px observer margin; mobile did not fetch them in this capture. No judgment about hosting compression/cache policy is made from the local server.
