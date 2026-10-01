# Owner Visual Closure Evidence — 2026-10-01

## Scope and baseline

- Work branch: `integration/owner-preview-reconcile-20261001`
- Starting commit/tree: `168bd41aeafc45c33c5a564e59d682552eafed19` / `5f374c773b181ea8d00a38cf7e407922979d1996`
- Owner-review visual candidate compared: `96313ac7bb662c6a8660fcdd8a5a92969ae0020f`
- Studio: `toadal-studio@1.4.2`
- Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`
- `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-preview-20261001\studio-project\toadal-feast-website\project.json`
- Runtime: Node `v22.23.2`, npm `10.9.8`

This is a bounded Home/global companion visual and behavior closure. No page/content registry, route, product claim, game package, production config, or backend integration was changed.

## Source changes

- Kept the Home hero’s canonical world art and Toadal focal image, adding a restrained gold frame and clearer display type/flagship treatment. Truthful preview and availability copy remains unchanged.
- At 320–430px, increased hero breathing room and scaled the foreground Toadal to avoid the hero image intersecting either primary action. Browser pixel-alpha comparison confirms zero opaque-art pixels over either CTA at 320, 390, and 430px.
- Kept the contextual helper attached to the viewport and removed its Home document-flow slot. The final character control measures 96×102px on desktop, 82×88px on 390/430px mobile, and 72×78px at 320px.
- The requested lower-right corner was tested. At Home 430×932, it overlapped 12.5% of the Tower Defense heading and 31.6% of its preview copy; on Search desktop, it overlapped 38.9% of the Search control. To preserve the stronger no-obstruction requirement, Home, Search, and Contact use a fixed upper-right position; other routes retain lower-right. This is an explicit, unresolved placement deviation from the preferred bottom-right location, not a claim of strict compliance.
- No runtime JavaScript or interaction semantics were modified.

## Studio render and checks

- `npm run validate`: PASS; zero errors and warnings.
- Prior source inspection for this exact reconciled baseline: PASS; 30 pages, 4 games, 41 registered assets, 40 components; 128 graph nodes and 86 edges. The four reported dangling `game.card` references were identified in that inspection as benign graph-resolver false positives. This closure changed CSS only, so the page graph inputs did not change.
- `npm run render`: PASS; 113 files emitted to `dist/` from the exact `TOADAL_PROJECT` above.
- GitHub Pages base-path transform: 32 files scanned, 31 rewritten, 892 URLs rewritten; staging robots policy added.
- `verify-pages-basepath`: PASS (31 HTML files); `verify-static-links`: PASS (31 HTML files); `verify-staging-robots`: PASS.
- Complete owner-preview gate: PASS, 16/16 steps. Integrated Node suite: 48/48 PASS. Full browser matrix: 77/77 PASS across 30 registered routes, with zero failed cases or issue counts. This includes render freshness, Pages base path, static links, and staging robots checks.

## Companion-specific browser verification

The focused CDP harness passed with images decoded and navigation checked against the requested route. It verified fixed viewport geometry at Home 1440×900, 320×800, 390×844, and 430×932; top/middle/bottom Home scroll samples at desktop, 390px, and 430px; and no sampled companion collision above the 5% overlap threshold with actionable controls or rendered text lines at the final upper-right placements. It also proved real World hover and touch reactions (`curious` state plus loaded map-guide artwork), and panel toggle persistence across reload. A direct lower-right comparison was also performed: it failed the no-obstruction check on Home 430px and Search desktop, which is why those routes use the upper-right exception.

Focused route checks passed with no horizontal overflow or sampled text/control obstruction on Toadal profile 390px, Search desktop/mobile, and Contact mobile. These checks found and drove fixes for the Search submit button and Contact form overlap before the final gate.

## Visual comparison and owner judgment

The final 1440px render was compared against both `96313ac7bb662c6a8660fcdd8a5a92969ae0020f` (`docs/review/OWNER_PREVIEW_VISUAL_CLOSURE_2026-10-01/home-1440x900.jpg`) and the approved authority (`docs/review/WO-002/evidence/approved-home-visual-authority.png`). The reconciled candidate retains its canonical scene, foreground character, hierarchy, and truthful content; the mobile character/action overlap is removed rather than traded for clipped copy or controls.

The approved authority remains a materially denser, more fully branded marketing composition than the present truthful site candidate. In particular, the asset authority still has no approved wordmark (only the crown mark is approved), and the current Home intentionally labels preview/concept and unavailable states rather than reproducing unverified claims. Those are owner visual/content decisions; this result does **not** claim `LOCK_VISUAL` acceptance.

## Screenshot and machine-readable evidence

Screenshots and focused browser report are in this directory:

- `home-1440x900.png`, `home-320x800.png`, `home-390x844.png`, `home-430x932.png`
- `play-320x800.png`, `toadal-profile-390x844.png`
- `search-1440x900.png`, `search-390x844.png`, `contact-390x844.png`
- `companion-scroll-desktop.png`, `companion-scroll-mobile.png`, `companion-scroll-large-mobile.png`
- `companion-reaction-world-hover.png`, `companion-reaction-world-touch-390x844.png`
- `owner-visual-closure-browser-qa.json`
- Canonical full-gate reports: `../owner-preview-gate-20261001/OWNER_PREVIEW_GATE.md`, `../owner-preview-gate-20261001/owner-preview-gate.json`, and `../owner-preview-gate-20261001/browser-matrix.json`

## Deployment boundary and result

Technical owner-preview result: **PASS — candidate ready for owner review; not visual-lock acceptance**. No staging deployment or branch update was performed. `main`, production, and `toadalfeast.com` were not touched.
