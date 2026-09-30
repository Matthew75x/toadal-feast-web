# WO-001 — Final Closure Report

- Date: 2026-09-30
- Branch: `work/WO-001-global-shell-home`
Disposition: **PASS — local implementation and closure gates complete**

This report supersedes the earlier blocked assessments. The donor aggregate was reconciled against the exact hash-pinned archive, and the final responsive corrections were rerendered and tested. WO-002 was not started. No GitHub Pages, production, or `main` change was performed.

## Delivered Home and visual disposition

The Home/global shell is complete within WO-001 scope. The final visual check is against the owner-approved written parity criteria and the retained CP9/V13 regression direction; the original approved mockup PNG was not available in this checkout, so this is not a pixel-perfect parity claim. The six fresh viewport captures were inspected and are recorded in [`screenshots/`](screenshots/) with full-page phone/desktop captures and [`browser-qa.json`](browser-qa.json).

The final browser run passed **96/96** checks in Chrome `154.0.8037.57`: 390×844, 430×932, 768×1024, 1366×768, 1600×900, and 1920×1080. There was no horizontal overflow, console/page error, or failed network request. The responsive hero is full-width throughout; desktop hero heights are 443–465px. The game band has four genuine preview cards and four desktop columns. Home search/store actions remain honestly disabled; four game records remain preview-only with zero Home launch URLs. Arcade is a dashed audit-required candidate in What’s Next, not a public game record or launch. Feast Pass remains planned for WO-005. Qualified Wicked Bites and CLAW staging packages exist, but Home launch routing remains withheld until WO-002 player integration.

The first responsive capture exposed zero-width phone/tablet layout and five desktop grid columns. Those failures were preserved as diagnostic output in the earlier `final-closure-2026-09-30/` evidence folder, not treated as acceptance evidence. Narrow layouts now return to normal block flow, desktop grid placement no longer leaks into implicit columns, and the desktop game grid is four columns. The final 96/96 browser result and replacement captures are the current evidence.

## Donor and asset evidence

The exact CP9/V13 archive SHA-256 is `ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`. The byte-identical Downloads mirror and read-only extracted mirror were verified locally with explicit paths: **17/17** witnesses passed, no failures. The corrected archive-derived `dist/` aggregate is **234 files / 6,422,416 bytes**; the earlier 236 / 6,605,121 repository expectation was stale. Archive bytes, individual witness hashes, and verifier logic were not changed. See [`CP9_V13_DONOR_BASELINE.md`](../../../implementation/CP9_V13_DONOR_BASELINE.md).

Canonical web asset audit: **10/10 PASS** against the documented official-source checkout. Staging evidence remains qualified, not a claim of Home integration: Wicked Bites 5.5 (HTTP 200; 1,462,042 bytes; SHA-256 `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`) and CLAW Feed Gulper 2.5.1 (HTTP 200; index SHA-256 `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`).

## Studio environment and quality gates

- Node `v22.23.2`; npm `10.9.8`.
- TOADAL Studio, package, and plugins: **1.4.2**.
- Studio root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo001\studio-project\toadal-feast-website\project.json`.
- `npm run validate`: **PASS**, zero errors / warnings.
- Complete unmodified Studio `npm test`: **PASS, 81/81**, zero failed / skipped. Tier 3 and Tier 4 closure tests passed in the same complete run. Earlier isolated prerequisite failures were caused by process-scoped discovery of Chrome/Playwright, ZIP utilities, and ImageMagick; supplying those installed tools through the test process environment resolved them. No Studio source, tests, skips, or assertions were changed.
- `npm run ai:doctor`: **PASS, 26/26**.
- `toadal.inspect(scope="workspace")`: **PASS**, valid; 2 pages / 4 games / 9 assets / 12 components; graph 40 nodes / 30 edges. Four dangling analyzer entries are the known generic `game.card` type-marker edges; all real game records are present.
- `toadal.render`: **PASS**, 17 files / 806,608 bytes; 50,949 HTML bytes; zero large-file warnings. Preview `index.html` SHA-256 `3b43a08f9fa98cf4f9a7772b0cd671ebef1286162f0e093487b67fd8ee094640`; `404.html` SHA-256 `f775f5648f795854304f388e15c639ea5e7f8980d3565d2ccc15fcbe7055db78`.
- `toadal.qa(level="quick")`: **PASS**, all nine accessibility heuristics true; zero issues, errors, or warnings.
- `toadal.export(kind="static")`: **PASS**, 745,942-byte ZIP; SHA-256 `a65ccdeb61e4df25479bdd8f15574ae58ffe3d07e3af3e3a3774c74a0828290b`. The local ZIP contained 17 files including regular `index.html` and `404.html`.
- `toadal.checkpoint(mode="verify")`: **PASS**, validation exit 0, no warnings; generated Studio handoff remains outside the repository.

The MCP `toadal.qa(level="full")` accessibility portion passed, but its built-in test subprocess returned Windows `spawnSync npm.cmd EINVAL`. The same complete, unmodified `npm test` suite was therefore run directly in the Studio installation with the required process-scoped tool paths and passed 81/81; no Studio runtime workaround was applied.

## Static Pages-shaped verification

The static ZIP was extracted outside the repository and tested locally under `/toadal-feast-web/`; nothing was deployed. Base-path rewrite: first pass scanned 3 HTML/CSS files and rewrote 2 files / 18 URLs; second pass rewrote 0 files / 0 URLs (idempotent). `verify-pages-basepath.mjs`: **PASS**, both HTML pages. Post-rewrite `index.html`: SHA-256 `e48201356b9c12c08da513fc47e0d6b63fc11de6afa36b4aca0e7c30866afeb2`; `404.html`: `316027b4560f3f790d1019d29af3bc8bfb125a35f0407216e308b219e68b6395`.

- `verify-wo001-home.mjs`: **PASS, 41 checks**.
- `verify-home-visual-contract.mjs`: **PASS, 34/34**, including 11/11 reusable shell concepts.
- `verify-navigation-truth.mjs`: **PASS**, 14 navigation targets, zero unresolved routes/fragments.
- `node --test scripts/wo001-pages-basepath.test.mjs`: **PASS, 8/8**.
- CP9 donor verifier: **PASS, 17/17** with the exact mirror/archive paths.
- Canonical asset audit: **PASS, 10/10**.
- Browser QA: **PASS, 96/96**, six target viewport sizes, zero overflow/errors/network failures.
- Studio accessibility quick QA: **PASS**, nine heuristics / zero issues.

## Scope and repository safety

Tracked `dist/` was not changed. The `main` branch was not checked out or modified; no merge occurred. GitHub Pages and production were not deployed. Generated Studio `build/`, `.history/`, and `.studio-history/` state is ignored and not tracked. Final commit/push are limited to `work/WO-001-global-shell-home`; this report does not authorize WO-002, game-page work, or deployment. The unresolved functional dependency is deliberately explicit: browser-game launch routes remain gated pending the separately scoped WO-002 player-shell integration.
