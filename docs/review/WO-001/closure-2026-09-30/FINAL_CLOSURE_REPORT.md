# WO-001 — Superseded Closure Draft

> Historical draft; its BLOCKED disposition and donor-mismatch conclusions are obsolete. Current disposition is **PASS** in [`../final-closure-pass-2026-09-30/FINAL_CLOSURE_REPORT.md`](../final-closure-pass-2026-09-30/FINAL_CLOSURE_REPORT.md). The original contents are retained below as a record of the earlier pre-reconciliation assessment.

- Date: 2026-09-30
- Branch: `work/WO-001-global-shell-home`
- Starting commit: `b56ce4fd5e64da246a51b09e9f8e7c04cdaf15b3`
Final disposition: **BLOCKED — one unresolved donor-integrity mismatch**

This report supersedes the earlier blocked assessment in `docs/review/WO-001/QA_REPORT.md`. That file remains as a historical snapshot; its former visual-authority, product-truth, component-reuse, and donor-availability blockers have been re-evaluated below.

## 1. CP9/V13 donor recovery and integrity

The owner-designated paths were checked exactly. Both were absent, with PowerShell reporting `Cannot find path '<exact path>' because it does not exist.`:

- Archive: `C:\ASSIGNATOR\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`
- Extracted root: `C:\ASSIGNATOR\TOADAL_V13_CP9\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH`

A byte-identical archive mirror was found at:

`C:\Users\Metarator\Downloads\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`

Its SHA-256 is `EBBD2B7631268E39522A2F63EB7377CE2CD6571B86CB88947C597B0B1376E7A4`, exactly the owner-pinned value. It was extracted read-only to:

`C:\Users\Metarator\AppData\Local\Temp\toadal-cp9-readonly-audit-3ceb2548d8e14aec906d84a9d8a2bdb9\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH`

The repository donor verifier passed the archive and all 15 individual hash/byte witnesses (**16 verified**), but failed the two `dist/` aggregate checks:

| Evidence | Files | Bytes |
|---|---:|---:|
| Repository manifest expectation | 236 | 6,605,121 |
| Inventory from the exact SHA-matched archive | 234 | 6,422,416 |

The archive's own Checkpoint IX report also describes a 234-file staging distribution. The archive and donor were not modified, and neither the verifier nor its expected totals were relaxed. This unresolved conflict is a concrete data-integrity blocker; see “Owner decision” below.

### Salvage / regression comparison

I inspected the donor read-only, including `src/scripts/optimal.js`, `src/scripts/cartridge-host.js`, the player/cartridge contracts and game registry, and the retained CP9 Home desktop/mobile screenshots. The Play screenshots/source were also reviewed. No donor `dist/` was copied into Studio.

The WO-001 Home preserves the useful Home-level concepts: a visible desktop search-field treatment (truthfully disabled with an explanation rather than icon-only), clear site hierarchy, large illustrated Feast World environment, canonical golden Toadal, strong pink discovery CTA, browser-game discovery funnel, contextual Toadal, and responsive mobile navigation/composition. CP9's route/player/cartridge/fullscreen and qualified game-launch behavior remains donor material for a separately scoped and requalified game work order; it was not grafted into the Home or represented as currently playable. Current game cards remain four honest `PREVIEW` states with no launch links.

## 2. Visual authority and manual review

The original `MOCKUP_HOME_DESKTOP.png` and `MOCKUP_HOME_MOBILE.png` were not recovered. Their absence is **not** treated as a blocker. The documented approved visual direction, repository visual-authority documents, and retained CP9/V13 Home captures were used as the available authority. The supplied Figma composition URL was attempted read-only but could not be retrieved by the web reader; no Figma contents are inferred or claimed as reviewed. The actual final screenshots in [`screenshots/`](screenshots/) were manually inspected at all six required viewports, with the full-page desktop/mobile captures compared against CP9 Home desktop/mobile.

Visual decision: **PASS against the currently available approved visual authority and CP9/V13 regression baseline.** No pixel-perfect parity with the unavailable original PNGs is claimed. The captures retain a chocolate navigation bar, warm illustrated candy-world hero, canonical Toadal, vivid pink CTAs, dark/navy and cream hierarchy, a visible desktop search field, game discovery, planned Feast Pass, Today/current-adventure treatment, character/world/story discovery, app conversion, contextual companion, and subordinate TOADAL GAMES footer. The page is not generic SaaS, cold blue/gray, or stripped of world identity. At 1920×1080, the loaded hero art is 1424×750 (183,348 bytes); it was visually inspected at the rendered viewport and showed no obvious degradation.

## 3. Product-truth remediation

- Exact Home headline: **“Explore the Feast World for Free.”** Zero browser games are currently public/playable. The main CTA routes to `/#browser-games`; it does not claim a preview is runnable. “Play the Feast World for Free” may return only after WO-002 certifies a playable browser experience.
- Feast Pass is **PLANNED / PREVIEW SUMMARY ONLY**. The Home and contextual companion do not show fake levels, XP, Sparks, Treats, streaks, live quests, persistence, sync, or account data. The authoritative feature gate remains unchanged; actual guest-local behavior belongs to WO-005.
- Search and app-store actions remain visibly and accessibly disabled until their functionality/destinations are verified. No store URLs or live-game availability were fabricated.

## 4. Reusable Studio component coverage

The updated source/export gate reports **32/32 checks and 11/11 requested reusable shell concepts**. This is verified by real component types, references, behaviors, patterns, and generated output—not display-name metadata. The mapping and Studio 1.4.2 limits are in [`STUDIO_COMPONENT_REUSE.md`](../../../implementation/STUDIO_COMPONENT_REUSE.md).

`SiteHeader`, `SiteFooter`, and `RouteShell` use Studio's shared `generic-site` renderer on Home and 404. `PrimaryButton`, `SecondaryButton`, `CreamPanel`, `DarkFeaturePanel`, `SectionHeading`, `StatusChip`, `CategoryTabs`, and `ToadalCompanion` use synchronized native component symbols and real insertable patterns where applicable. Studio 1.4.2 does not expose typed slots/parameters for symbols and its patterns insert copies; the global shell is renderer-owned. The closest native constructs are used and the limitation is documented. The existing custom disabled SearchField treatment remains intact.

## 5. Environment and Studio qualification

- Node: `v22.23.2`; npm: `10.9.8`.
- Studio root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Studio/package/portable plugin/Codex plugin: `1.4.2`.
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo001\studio-project\toadal-feast-website\project.json`.
- `npm run validate`: **PASS**, valid, zero errors, zero warnings.
- Complete unmodified `npm test`: **PASS, 81/81**, zero failed and zero skipped.
- `npm run ai:doctor`: **PASS, all 26 checks**.
- `toadal.inspect(scope="workspace")`: **PASS**; valid project, 2 pages / 4 games / 9 assets / 12 components. Graph: 40 nodes / 30 edges / four analyzer false-positive dangling edges from `component.home.games` to the `game.card` type marker; actual `game.<id>` edges are present.
- `toadal.render`: **PASS**, 17 files / 800,966 bytes; HTML 50,421 bytes total; zero large-file warnings. Pre-Pages-rewrite SHA-256: `index.html` `e40e06cc369c8309c9fc930217ddfd145e6016dffd17c4c0cb2ae6d8f34be5f1`; `404.html` `f775f5648f795854304f388e15c639ea5e7f8980d3565d2ccc15fcbe7055db78`.
- `toadal.qa(level="quick")`: **PASS**; all nine accessibility heuristics true, zero issues/errors/warnings; zero large-file warnings.
- `toadal.export(kind="static")`: **PASS**, 744,730-byte ZIP, SHA-256 `65d7ab2f756092041f53917070c0f6e47f566b84d0c98a5467fac9a9be8e71d9`. The extracted static root contained 17 files / 801,272 bytes, including regular `index.html` and `404.html`.
- `toadal.checkpoint(mode="verify")`: **PASS**, validation clean; generated handoff is in the external Studio installation, outside the repository.

### Tier 3 / Tier 4 test discrepancy

The earlier 76/81 run had five failures caused by process-scoped environment discovery, not Studio defects: deep accessibility and Tier 4 visual snapshots could not find installed Windows Chrome/Playwright; Tier 2 ZIP work could not resolve installed `zip`/`unzip`; Tier 3 optimization could not resolve installed ImageMagick. The exact isolated affected suites then passed: plan conformance 8/8, Tier 2 closure 2/2, Tier 3 closure 3/3, and Tier 4 closure 3/3. The final complete unmodified suite passed 81/81 after supplying only process-scoped `CHROMIUM_BIN`, `PLAYWRIGHT_PYTHON`, `MAGICK_BIN`, and `PATH` entries. No Studio source, tests, skips, or assertions were changed. Browser: Chrome `154.0.8037.57`; Python `3.13.1`; Playwright `1.61.0`; ImageMagick `7.1.2-32`.

## 6. Static export, Pages-shaped QA, accessibility, and viewport evidence

The static ZIP was extracted locally outside the repository and rewritten for `/toadal-feast-web/`. Nothing was deployed.

- Pages base-path rewrite first pass: 3 files scanned, 2 files / 18 URLs rewritten; second pass: 3 scanned, 0 rewritten (idempotent).
- Post-rewrite `index.html`: 32,981 bytes, SHA-256 `ca778c9153f66a8d31174a151d5338eec077310f61fa490e1ef7622d858bde20`.
- Post-rewrite `404.html`: 17,746 bytes, SHA-256 `316027b4560f3f790d1019d29af3bc8bfb125a35f0407216e308b219e68b6395`.
- `verify-wo001-home.mjs`: **PASS, 41 checks**. `verify-home-visual-contract.mjs`: **PASS, 32/32**, including **11/11** meaningful reusable concepts. `verify-navigation-truth.mjs`: **PASS, 14/14 navigation targets**, zero unresolved routes/fragments. `verify-pages-basepath.mjs`: **PASS**; 2 HTML pages. `wo001-pages-basepath.test.mjs`: **PASS, 8/8**.
- Canonical asset audit: **PASS, 10/10**.
- Browser QA: **PASS, 87/87**, Chrome `154.0.8037.57`; all six viewports loaded with zero horizontal overflow. Grid columns were 1 at 390/430px, 2 at 768px, and 4 at 1366/1600/1920px. All hero images loaded. Mobile menu open/Escape/focus restoration, keyboard filters, honest zero-playable state, companion pointer/focus messaging and minimize persistence, reduced motion, and 404 recovery passed.
- Accessibility: Studio quick QA nine heuristics true / zero issues; deep accessibility test passed in the complete suite. First keyboard stop is the skip link; menu toggle is 48px tall; Escape returns focus; keyboard filter operation and reduced-motion emulation pass.
- Console errors: **0**. Page errors: **0**. HTTP/network errors: **0**.
- Actual viewport captures (390×844, 430×932, 768×1024, 1366×768, 1600×900, 1920×1080), full-page phone/desktop captures, and machine-readable browser metrics are under [`screenshots/`](screenshots/) and [`browser-qa.json`](browser-qa.json).

## 7. Scope safety and remaining decision

- Tracked `dist/`: unchanged.
- `main`: not checked out or modified; remote `main` remained `87050885331770ca3e30db7e463154aebd777512` during this work. No merge occurred.
- GitHub Pages / Netlify / production: not deployed; no DNS or Android changes.
- Generated Studio `build/` and `.history/` are ignored; no build/history state is tracked.
- Final Git status after the closure commit is pushed to `work/WO-001-global-shell-home`: clean.

### Owner decision required

WO-001 is **BLOCKED** solely because the immutable archive that exactly matches the owner-pinned SHA-256 yields 234 files / 6,422,416 bytes, while the repository donor manifest expects 236 / 6,605,121. Resolve by either supplying the intended archive whose `dist/` matches the recorded aggregate, or explicitly authorizing the manifest aggregate to be reconciled to the actual contents of this exact hash-pinned archive. No manifest/verifier workaround was made. Do not start WO-002 until the owner reviews this receipt and resolves the donor record.
