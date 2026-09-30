# WO-002 Home Evolution — Implementation Evidence

**Overall result: PASS for the WO-002 visual/product-navigation baseline.** This is not a deployment or production approval.

## Provenance and environment

- Frozen starting baseline: `0e7f795d942f9fa6e9127e714a9ed83a7e61f2f8` (accepted WO-001 parity close).
- Branch: `work/WO-002-home-evolution-20260930`.
- Node: `v22.23.2`; npm: `10.9.8`.
- TOADAL Studio package/plugin: `toadal-studio` / `toadal-studio` plugin `1.4.2`.
- Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Exact Studio project: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo002-20260930\studio-project\toadal-feast-website\project.json` (`generic-site`, id `toadal-feast-website`).

The approved Home source was available and preserved in `evidence/approved-home-visual-authority.png` (SHA-256 `4154F582ED9E7AD8EE31010A3B6974BCD8AAAE0CB72CACF1D6A953FA6BF79608`) and `evidence/approved-home-direction-batch1.png` (SHA-256 `747EC321B5A4AA153E4B674BA119CDA22B43438B0F4AF450B7A54082E50377AC`). A same-viewport WO-001 before/WO-002 after pair is included. Visual comparison is qualitative against the approved composition; no pixel-exact score is claimed.

## What changed

- Home now says **“Play the Feast World for Free.”** and routes its primary browser CTA to `/play/`. Metadata matches the visible title and current page description. The empty `PUBLIC` filter no longer says player integration is pending.
- The shared shell marks the current route with `aria-current`; Play stays active through game detail/player routes. The responsive Home composition, canonical art, contextual companion, cream/chocolate/pink/gold palette, and disabled unverified store buttons remain intact.
- The Play directory and four informational details remain `PREVIEW`. Only Wicked Bites 5.5 has an isolated `/player/wicked-bites/` route. CLAW remains launch-held with no player/package; Tower Defense and Fruity Bash remain concepts. There are still zero `PUBLIC` browser games.
- The Wicked Bites player uses an opaque-origin sandbox (`allow-scripts allow-pointer-lock`, no `allow-same-origin`) and now grants fullscreen only; the donor manifest does not claim gamepad support. The compatibility adapter handles the contracted visibility signal as well as pause/resume. Storage is declared `none`: the upstream localStorage save layer falls back to in-memory data in the sandbox, so reload/close can clear progress and account sync is absent.
- Donor provenance remains source commit `6fff3c89605092ba5c5e122565cb98415c8ab5e5`, entry SHA-256 `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`. The normalized source-audit artifact matched that hash exactly after removing only the intended 46-byte `<script src="toadal-bridge.js" defer></script>` integration tag. The website-served `index.html` with that tag has SHA-256 `783dfe877c931a6d142a1453eaddace6776d4852d4dae074a20b40975b47036c` (1,462,088 bytes). Runtime package profile: 2 files, 1,467,205 bytes; sorted runtime-ledger SHA-256 `d775a2fd2ee236b0b0171732f0d7202b6c95c1b1eb11127e86c9949963851153`.

Intentionally unchanged: tracked production `dist/`, `main`, deployment/Pages settings, store destinations, app/account/backend behavior, unrelated pages, and the mobile-game source. TOADAL FEAST Arcade remains outside this WO: no listing, package, or route was added; a separately authorized bounded isolation/package audit is its next gate.

## Studio and repository verification

- `toadal.inspect`: Studio 1.4.2; 8 pages, 4 game records, 11 assets, 18 components. Validation in inspect: valid, 0 errors, 0 warnings.
- `npm run validate`: valid, 0 errors, 0 warnings.
- `npm run ai:doctor`: **26/26 PASS**.
- Full Studio `npm test`: **81/81 PASS**, no skips. This includes Tier 3 tests 76–78 and all three Tier 4 tests 79–81.
- Tier 3/Tier 4 discrepancy investigation: an initial invocation accidentally inherited the website manifest in `TOADAL_PROJECT`, redirecting Studio fixture tests into the site project. With `TOADAL_PROJECT` unset and ImageMagick/unzip configured, but without Windows browser variables, exact tests **#32** (deep accessibility) and **#81** (Tier 4 visual snapshot) failed because browser discovery returned unavailable. Tier 3 passed. Isolated Tier 4 then passed **3/3** with `CHROMIUM_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe` and `PLAYWRIGHT_PYTHON=C:\Users\Metarator\.pyenv\pyenv-win\versions\3.7.4\python.exe`; the full corrected run passed **81/81**. This was an environment invocation prerequisite, not a Studio source/test failure. No Studio source, assertions, or tests were changed.
- `toadal.qa(level="full")`: validation passed; accessibility checks **9/9**, 0 errors/warnings; performance inspected 28 files (2,858,357 bytes), with one large-file notice for the 1,487,239-byte donor cartridge. The reference graph retains four `game.card` edges reported dangling by Studio. The QA tool’s nested test runner still reports Windows `spawnSync npm.cmd EINVAL`; the direct complete `npm test` command above passes. No workaround or skipped suite was used.
- Bridge workflow: inspect/render/static export/`toadal.checkpoint(mode="verify")` all returned successfully; checkpoint `ok: true`. Render contains 9 HTML files: `index.html`, `404.html`, Play, four detail pages, Wicked Bites player, and the Wicked Bites package entry. Static ZIP: 2,141,382 bytes, SHA-256 `780082A1CC67273C868AB648745367B574F056289783FEF99B2F61D50B69125B`. Both root `index.html` and `404.html` were present in the ZIP.
- Static export verification on an extracted copy: base-path rewrite changed 9 HTML files / 180 URLs; `verify-pages-basepath` PASS; `verify-static-links` PASS; WO-001 Home regression verifier **48/48 PASS**. Required route files were present and no CLAW player/package was emitted.
- `scripts/wo002-contract.test.mjs` plus `scripts/wo001-pages-basepath.test.mjs`: **17/17 PASS**. The WO-002 contract covers route/state gates, metadata truth, sandbox capabilities, donor provenance and runtime package hashes. The static-link verifier was corrected to inspect actual markup attributes rather than mistaking JavaScript `frame.src = 'about:blank'` retry code for missing static files; a focused regression test confirms real missing HTML targets still fail.
- `verify-home-visual-contract.mjs`: **29/29 PASS**. This deliberately updates the old WO-001 contract: the former hero headline/action was Explore/section-anchor; the new headline/action is Play/`/play/` because a registered PREVIEW-only isolated player now exists. Public count remains zero. Navigation truth: 8 routes, 14 targets checked, 0 unresolved.

## Browser and viewport evidence

- Home: 390×844, 430×932, 768×1024, 1366×768, 1600×900, and 1920×1080 — HTTP 200 at each, no horizontal overflow, no broken loaded images, no console errors or external requests.
- Home interactions: companion pointer context, keyboard-focus context, minimized-state persistence, primary CTA routing, disabled store controls, 404/Home recovery, mobile navigation plus Escape focus return, and reduced-motion media query all passed.
- Play/player smoke: **33 checks PASS**, including four PREVIEW cards, empty PUBLIC filter, detail-to-player route, ready/start/pause/resume/mute/unmute/fullscreen, opaque-origin isolation, accepted/rejected protocol messages, error/retry/reload/exit, mobile overflow, and CLAW hold. Console errors, failed requests, and external requests: **0**.
- Before/after and approved-source images are in `evidence/`; viewport and funnel screenshots are individually named by route/size.

## Scope, deployment, and remaining decisions

- No merge, push, GitHub Pages deployment, DNS change, or production release occurred. `main` was not modified; the remote `main` SHA observed read-only was `87050885331770ca3e30db7e463154aebd777512`.
- `dist/` is unchanged. Studio build/history outputs are ignored and not tracked.
- A supplementary `verify-staging-robots.mjs` check was tried and **did not pass**: it requires `noindex,nofollow` on every HTML file, and the current published Studio route metadata does not emit those tags (including the byte-preserved donor entry). No deployment was authorized, so WO-002 leaves publication policy unchanged. Before exposing a staging URL to crawlers, decide and apply a consistent noindex policy, including for the standalone cartridge.
- Owner inputs still needed before a launch/deployment: verified App Store/Google Play destinations, any future account-sync decision, and authorization for a separate Arcade audit. These do not block the WO-002 visual baseline, but they do block production claims or deployment.

## Evidence screenshots

| Evidence | File |
|---|---|
| Approved Home source | [approved-home-visual-authority.png](evidence/approved-home-visual-authority.png) |
| WO-001 before, 1600×900 | [home-before-wo002-1600x900.png](evidence/home-before-wo002-1600x900.png) |
| WO-002 Home, 1600×900 | [home-1600x900.png](evidence/home-1600x900.png) |
| WO-002 mobile Home, 390×844 | [home-390x844.png](evidence/home-390x844.png) |
| Play directory | [play-desktop.png](evidence/play-desktop.png), [play-mobile.png](evidence/play-mobile.png) |
| Wicked Bites funnel | [wicked-detail-desktop.png](evidence/wicked-detail-desktop.png), [player-desktop.png](evidence/player-desktop.png), [player-mobile.png](evidence/player-mobile.png) |
