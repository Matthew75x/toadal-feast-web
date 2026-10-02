# Final Home delivery audit — Home-only companion WebP `srcset`

This is the final cold Home capture after the bounded Home-only correction and fresh Studio render. Baseline commit: `0dfa18d2b7bad97d862849a4360000c3fa8c8aff` (tree `b6a61fb0f2c474809b2ca80f3dfb55ab4fc6260e`); the rendered `dist/` is the current worktree output. The separate shared Advanced Code trial record is explicitly marked preliminary and superseded.

## Method

Same method as the baseline audit: current local `dist/` served under `/toadal-feast-web/`; one new cold Chrome context per viewport; Home initial navigation; no scrolling; network-idle plus 1.2 seconds; CDP request/encoded-byte capture. Desktop capture took 2.41 seconds and mobile 1.88 seconds (both under the 30-second limit). This validates the local rendered artifact, not GitHub Pages/CDN transfer compression, cache behavior, or public-network performance. The current cold-load evidence does not exercise context return; that path may legitimately load the PNG fallback and is outside this result.

## Before / final after

| Viewport | Before | Final after | Net change |
|---|---:|---:|---:|
| Desktop 1440×900 | 27 requests · 2,209,593 B | 26 · 1,876,830 B | −1 request · −332,763 B (−15.1%) |
| Mobile 390×844 | 16 requests · 1,329,765 B | 15 · 997,002 B | −1 request · −332,763 B (−25.0%) |

Final captures had only HTTP 200 responses, no failed requests, no horizontal overflow, no recorded layout shifts, and no long tasks in these samples. Byte totals are the same local, uncompressed CDP transfer accounting as baseline, not representative CDN byte counts.

## Home companion / canonical-art evidence

- Both the Home hero and floating companion selected `/toadal-feast-web/assets/images/characters/toadal-victory.webp` as browser `currentSrc` on both viewport profiles. There was one 63,624-byte encoded request for that common URL per cold profile.
- The authored HTML keeps `assets/images/characters/toadal-victory.png` as the `src` fallback, but **zero `.png` requests occurred during either Home initial-load capture**. This is specifically an initial-Home-load finding, not a claim about navigation/context return.
- The rendered WebP file matches the approved registry bytes exactly: SHA-256 `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb` (`asset.home.character.toadal-victory-web`). Its authority remains the canonical victory source SHA-256 `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`.
- The approved WebP decodes to RGBA 611×640 with alpha range 0–255, 209,145 fully transparent pixels, and 10,447 partial-alpha pixels. Since the actual response bytes match the existing approved hash, canonical pose and transparent-edge pixels are byte-identical to that approved derivative; no asset bytes changed.

## Preserved non-blocking behavior and scope note

The exact duplicate Candy Kingdom image paths remain and are intentionally deferred: `/assets/images/world/candy-kingdom.webp` and `/assets/studio/asset-home-world-desktop.da8261fa30.webp` share SHA-256 `da8261fa30f6535f5288f52841dc2123d21a3251340e5d7888d576b7531809b4`; each transferred 183,551 encoded bytes in each viewport capture. No structured Studio game-card source or materialization behavior was changed.

Scope reconciliation note from read-only `git diff` during capture: `collections/advanced-code.json` has no content diff (its worktree “modified” status is line-ending-only), and sampled non-Home page HTML files match the baseline. However, `studio-project/toadal-feast-website/reference/assets/js/companion-position.js` and its rendered `dist/assets/js/companion-position.js` are modified from baseline: a shared `avoidControls()` placement helper was added. This is not part of my audit edits and is not identical-to-base shared runtime code; reconcile with the stated scope before treating the overall render as strictly Home-only. The cold payload result above remains valid for the artifact captured. No source edits, renders, commits, or deployment actions were performed by this audit.
