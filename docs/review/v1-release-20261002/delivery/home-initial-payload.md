# V1 delivery audit — Home initial payload

Read-only delivery audit of exact baseline `0dfa18d2b7bad97d862849a4360000c3fa8c8aff` (tree `b6a61fb0f2c474809b2ca80f3dfb55ab4fc6260e`). No source, render, test, deployment, or Git operation was performed after checking the baseline.

## Method and limits

Served the exact committed `dist/` locally under its GitHub Pages base path (`/toadal-feast-web/`) and loaded Home in Chrome at 1440×900 and 390×844. Each was a cold browser context, initial navigation, no scroll, then a short settle window. Recorded Chromium CDP request completion/encoded bytes, browser resource timing, loaded image intrinsic/rendered dimensions, render-blocking status, long-task entries, and layout shifts. This measures the committed static artifact and browser behavior, not GitHub Pages/CDN compression, cache headers, or production network latency. The local Python server emitted no cache headers and served WebP as `application/octet-stream`; this is a harness limitation, not evidence of deployed MIME/cache behavior.

## Initial request totals

| Viewport | Completed requests | CDP encoded transfer bytes | Failures | Horizontal overflow | LCP observed locally |
|---|---:|---:|---:|---:|---:|
| Desktop 1440×900 | 27 | 2,209,593 B (2.11 MiB) | 0 | No (1440 px) | 636 ms, Home environment image |
| Mobile 390×844 | 16 | 1,329,765 B (1.27 MiB) | 0 | No (390 px) | 180 ms, mobile environment crop |

The byte totals are cold local transfers, including protocol/header accounting, without HTTP compression. All requests in these captures returned 200. The different desktop request count is largely due to near-viewport interactive sprites being fetched on desktop; browser-native lazy loading also fetched several images below the visible viewport. These timings/bytes should not be presented as public-host performance scores.

## Payload observations

- The document is 69,469 bytes; the single head stylesheet `dist/assets/css/site.css` is 213,518 bytes and is the only resource Chrome classified as render-blocking. Its CDP transfer was 213,705 bytes; local resource timing was 8–10 ms. No external fonts or third-party requests appeared.
- Desktop hero: `assets/images/world/candy-kingdom.webp` is 183,348 bytes (1424×750 source; displayed 1440×347); `assets/images/characters/toadal-victory.webp` is 63,422 bytes (displayed 460×390). Mobile selects `assets/images/world/candy-kingdom-mobile.webp` (69,360 bytes; 470×750 source; displayed 390×480) and the same approved Toadal WebP (63,422 bytes).
- **Exact duplicate environment transfer:** the game-card export `assets/studio/asset-home-world-desktop.da8261fa30.webp` and canonical `assets/images/world/candy-kingdom.webp` have identical SHA-256 `da8261fa30f6535f5288f52841dc2123d21a3251340e5d7888d576b7531809b4`, each 183,348 body bytes. Both URLs were requested on desktop and mobile, costing 183,551 encoded bytes apiece in this local trace. The duplicate is the Tower Defense *concept* card art, not gameplay evidence. Reusing the canonical already-loaded URL for this exact same image is the clearest low-risk saving: about 183.5 KB per cold Home visit, with no artwork change.
- **Oversized duplicate Toadal delivery:** Home hero uses the approved optimized canonical victory WebP (63,422 bytes), while the floating companion uses `assets/images/characters/toadal-victory.png` (335,410 bytes; its initial request was 335,598 encoded bytes). Both are loaded on desktop and mobile although they represent the canonical victory pose. The lock/index list `asset.home.character.toadal-victory-web` as the optimized form of the same authority source (`assets/images/characters/reactions-v1/toadal/victory.png`, SHA-256 `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`); the WebP derivative is 63,422 bytes, SHA-256 `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb`. **Candidate:** point the companion at that already-used WebP if a visual/transparency check confirms it preserves its current presentation. Expected cold-transfer reduction is about 272 KB; no new art is needed.
- On mobile, the responsive hero correctly selects the 69 KB mobile crop, but the desktop Candy Kingdom image is also fetched twice (canonical path plus identical Studio-export path) for the concept card. This leaves roughly 436 KB of environment image traffic in the initial capture, despite a 69 KB hero crop.
- Chrome fetched all four preview/concept card images initially (including the 80,618-byte Froggy concept and duplicated 183,348-byte environment) even though they are below the first fold on mobile; `loading="lazy"` images inside the browser's near-viewport fetch distance are expected to load. This is not a broken lazy attribute. Avoid aggressive deferral of immediately discoverable cards without product/visual review.
- Desktop also fetched the discovery daily-chest and Golden Block sprite sheets (147,151 and 425,113 encoded bytes respectively) as the nearby interaction section approached the 160 px IntersectionObserver margin. They were not requested in the mobile trace. They are genuine interactive artwork and already gated by proximity; this audit does not recommend removing or replacing them. If desktop first-load transfer is later a priority, investigate compressing/resizing those sheets without changing frames/appearance, with a visual check.
- App gameplay captures fetched below the initial viewport are intentionally real gameplay capture assets; there is no evidence to remove them from the Home experience based only on this load trace.

## JS, layout, and cache

- Four external Home scripts account for 57,200 source bytes (13,147 + 1,920 + 27,734 + 14,399); they are late-body/async rather than additional render-blocking resources. No third-party or pathological request fan-out was observed.
- Long-task sampling was variable: two desktop captures observed one early main-window long task over 50 ms (61–95 ms across runs), with the observer attributing it only to the window, not a specific script. Mobile captures observed none. This merits targeted profiling only if repeated on a representative device; evidence does not justify blaming or rewriting a particular script.
- Layout shifts were not reproducible: one initial mobile sample showed CLS 0.104, but subsequent desktop/mobile samples recorded no layout-shift entries (one desktop sample was 0.0003). Treat that first value as an unresolved one-off measurement, not a confirmed regression or a pass claim. No visible horizontal overflow was measured.
- Host cache/compression behavior is out of scope and cannot be inferred from the local server. No cache-policy correction is recommended from these headers. Content-fingerprinted Studio assets are suitable for long-lived caching in principle; shared unhashed filenames require host-specific policy evidence before proposing changes.

## Delivery disposition

The two worthwhile, art-preserving follow-ups are (1) eliminate the exact duplicate Candy Kingdom URL for the concept card and (2) reuse the already-approved optimized victory WebP for the companion after confirming identical visual/alpha presentation. Neither is a reason to chase synthetic scores or alter approved composition. The blocking CSS and desktop sprite bytes are measurable, but the available evidence does not justify a risky stylesheet split or sprite redesign in this delivery audit. No code correction was applied; implementation ownership returns to the primary Home implementer.
