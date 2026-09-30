# WO-001 — final QA and disposition

Date: 2026-09-30
Branch: `work/WO-001-global-shell-home`
Overall result: **BLOCKED — the implementation and local technical checks are complete, but acceptance gates remain unresolved.**

## Environment and project

- Node: `v22.23.2`; npm: `10.9.8`.
- Certified Studio/package/core plugin: `1.4.2`.
- Studio root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo001\studio-project\toadal-feast-website\project.json`.
- Fresh project: `toadal-feast-website` (`generic-site`); two pages (Home and 404), four game records, nine registered assets, and 12 Studio components.

## Studio validation and test evidence

- `npm run validate` on the exact manifest: **PASS**, zero errors / zero warnings.
- `npm run ai:doctor`: **PASS**, all 26 checks passed, including stdio/HTTP processes, origin protection, rate limiting, tool/resource/prompt discovery, and a real inspect call against the exact manifest.
- Complete Studio `npm test`: **PASS, 81/81, 0 failed, 0 skipped**. For the test run only, `TOADAL_PROJECT` was cleared so Studio tests used their own fixtures; process-scoped environment pointed to the installed ImageMagick, Chrome 154, Python 3.13 with Playwright, and ZIP utilities. No Studio source/tests/assertions were changed.
- `toadal.inspect`: **PASS**; validation clean; 2 pages / 4 games / 9 assets / 12 components. Graph has 40 nodes / 30 edges and four analyzer false-positive dangling edges from `component.home.games` to the type marker `game.card`; each real `game.<id>` edge is present.
- `toadal.render`: **PASS**, 17 files / 800,024 bytes, HTML 50,372 bytes, zero large-file warnings. Pre-base-path `index.html` SHA-256: `8e4788ea12c586cb788cc170b6dd02ebf355685e90032d6fc95e9fb7fc457fa9`; `404.html`: `ec5d6e08e394f500a933184c32faa92f968d11d94e028500b5b91766ee325502`.
- `toadal.export(kind="static")`: **PASS**, 744,570-byte archive; SHA-256 `47D8F0DAA3DE4FA5E00937C149A4D1FBA51861ED0D8E6F581C0FBDFB49541696`.
- `toadal.checkpoint(mode="verify")`: **PASS**, zero validation errors / warnings. The generated Studio handoff is outside the product repository. Machine-readable results are in `studio-inspect-render.json` and `studio-static-export.json`.

## Static export, Pages-path, and browser evidence

The exact Studio ZIP was extracted outside the repository and tested under `/toadal-feast-web/`; nothing was deployed.

- Export has 17 files including `index.html` and `404.html`.
- Pages base-path rewrite: first pass scanned 3 HTML/CSS files, rewrote 2 files / 18 URLs; second pass rewrote zero files / zero URLs (idempotent). Post-rewrite SHA-256: Home `E10A502283189B1C1A8CABA8B03D78E2143DC209832EE1365E6D8D62D55C4DEA`; 404 `EA93B1E6C5B3456255E24B305255BA017D179452EF313BD1AF27A224F69CE04C`.
- `verify-wo001-home.mjs`: **PASS, 41 checks**. `wo001-pages-basepath.test.mjs`: **PASS, 8/8**. `verify-navigation-truth.mjs`: **PASS, 14/14 navigation targets**, zero unresolved routes or Home fragments. The nav uses `./#…` so those links work from both Home and 404 on a project-path host.
- Browser QA against the fresh Pages-shaped export: **PASS, 87/87**, Chrome `154.0.8037.57`; no console errors, page errors, or HTTP errors. Tested 390×844, 430×932, 768×1024, 1366×768, 1600×900, and 1920×1080. All six have no horizontal overflow; the game grid adapts to one, two, or four columns; collapsed nav open/Escape/focus return, filters, 404 recovery links, and disabled controls passed.
- Keyboard/accessibility smoke: first Tab reaches skip link; mobile nav retains 48px toggle and restores focus on Escape; game filters are keyboard operable; reduced-motion emulation passed. Companion changes copy on Feast Pass hover and keyboard focus, announces keyboard context politely, and persists minimize via local storage.
- Studio quick QA: all nine accessibility heuristics true; zero accessibility issues, errors, or warnings. It also reports 17 preview files and zero large-file warnings.
- Screenshots (six required viewport captures plus full-page phone/desktop) and machine-readable metrics are under `docs/review/WO-001/screenshots/` and `viewport-evidence.json`. The final captures were inspected; the Genie lane was tightened into a compact responsive row after review. They show the intended chocolate/cream/pink/gold game-world treatment, visible environment, canonical Toadal, search surface, and section hierarchy. The approved original mockup was not available, so this is not a mockup-parity sign-off.

## Asset and source audit

- Canonical asset audit: **PASS, 10/10**. The prescribed `E:\.codex\toadal-android-audit-remediation-20260929` checkout was unavailable; the documented official-source fallback was used at `Matthew75x/Toadal-Feast-Development`, commit `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`. Hash/provenance details are in `ASSET_PROVENANCE.md`.
- CP9/V13 donor audit evidence exists on this branch from a separate ASSIGNATOR run: archive SHA-256 `ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`, 17 witnesses / zero failures. This is external audit evidence, not a local reproduction.
- Local `node scripts/verify-cp9-donor.mjs .`: **FAIL, 0/17 verified**. The configured archive `C:\ASSIGNATOR\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`, donor root `C:\ASSIGNATOR\TOADAL_V13_CP9\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH`, and donor `dist/` are absent. The 17 missing witnesses are: archive; `CHECKPOINT_IX_REPORT.md`; `src/scripts/optimal.js`; `src/scripts/cartridge-host.js`; `src/data/player-contract.json`; `src/data/cartridge-standard.json`; `src/data/web-games.json`; `src/styles/components.css`; `src/styles/pages.css`; `src/styles/optimal.css`; `cartridges/wicked-bites/manifest.json`; `cartridges/feed-gulper/manifest.json`; `qa-cp9/V13_CP9_HOME_DESKTOP.png`; `qa-cp9/V13_CP9_HOME_MOBILE.png`; `qa-cp9/V13_CP9_PLAY_DESKTOP.png`; `qa-cp9/V13_CP9_PLAY_MOBILE.png`; and `dist` aggregate. Thus the external donor-integrity audit is preserved, but this checkout cannot compare/review salvage of the player, cartridge, fullscreen, route, and funnel behavior.
- I inspected the visual-target bridge at remote branch `design/home-visual-target-20260930`, commit `b40fa0dd879a31eb606a29fb48ed46ba531dd963`. Its document describes Figma as a composition aid, not content authority, and says the original approved Home mockups remain the visual north star. The original `MOCKUP_HOME_DESKTOP.png` and `MOCKUP_HOME_MOBILE.png` files were not present in this checkout or Downloads; the Figma page was not available to the local page reader. The pre-Studio reconstruction is expressly not the approved mockup.

## Product truth and remaining acceptance gates

- Four indexed games are `PREVIEW`, have no playable build/launch URL, and are presented as concepts; the playable filter returns an empty state. Arcade remains withheld from the game index and labeled audit-required in future-state content.
- Search is present but disabled with an explanation. App/store conversion is present but disabled because no verified store URLs or approved screenshots were supplied. No destinations were fabricated.
- Feast Pass shows only planned/guest-first state and no live level, XP, reward, streak, quest, or sync data. WO-001 asks for a guest-local summary while central `PUBLIC_FEATURE_STATE.json` gates `feastPassGuestLocal` until `PUBLIC_AFTER_WO005`; no authority was supplied to change that gate.
- The required hero headline, “Play the Feast World for Free,” remains, but the current feature state contains zero playable browser games. Its promise needs explicit product-authority reconciliation before acceptance.
- Home has ten top-level Studio components (nine `core.rich-text`, one `layout.grid`) and three synchronized symbols (buttons and game card). The source contract check reports 20/21: the named shell-symbol requirement has only 2/11 matches (`PrimaryButton` and `SecondaryButton`). Required reusable shell/surface components are not sufficiently covered.
- No approved support/legal/contact destinations were available; none were invented.

## Safety and disposition

- `git diff HEAD -- dist`: clean; tracked `dist/` unchanged.
- `main` was not changed; its observed remote SHA was `87050885331770ca3e30db7e463154aebd777512`.
- No GitHub Pages/production deployment, DNS change, or merge was performed.
- Studio `build/`, `.history/`, and `.studio-history/` are ignored and not committed. Final tracked Git status is expected clean after committing the evidence on this work branch.

WO-001 is therefore **BLOCKED**, not PASS: original visual comparison is unavailable; donor salvage is not locally reproducible; the Feast Pass and free-play headline conflict with feature truth; and reusable shell-symbol coverage is incomplete. Keep WO-002 on hold. Do not deploy Pages or merge `main`.
