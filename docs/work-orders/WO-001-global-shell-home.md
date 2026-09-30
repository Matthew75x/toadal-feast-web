# WO-001 — Global Shell + Home
**Status:** PASS — final closure and verification completed 2026-09-30
**Execution branch:** `work/WO-001-global-shell-home`

## Current disposition (2026-09-30)

The Studio implementation and local technical QA are complete. The exact hash-pinned CP9/V13 archive verifies **17/17**, and its corrected `dist/` aggregate is 234 files / 6,422,416 bytes. Qualified Wicked Bites and CLAW staging cartridges exist; Home launch routing stays gated until WO-002, and Feast Pass live-state work stays gated to WO-005.

The owner’s bounded visual-composition targets and truth constraints were applied to the existing implementation. The current static export passed the Studio, Pages-shaped, and six-viewport browser gates (96/96), with no pixel-perfect claim for the unavailable original PNGs. See [`final-closure-pass-2026-09-30/FINAL_CLOSURE_REPORT.md`](../review/WO-001/final-closure-pass-2026-09-30/FINAL_CLOSURE_REPORT.md).

WO-002 was not started. No Pages deployment occurred.

See:
- `docs/review/WO-001/APPROVED_HOME_VISUAL_PARITY_REVIEW_2026-09-30.md`
- `docs/review/WO-001/POST_QA_DELTA_2026-09-30.md`
- `docs/review/WO-001/CP9_DONOR_RECONCILIATION_2026-09-30.md`

## Goal
Implement the reusable TOADAL FEAST global shell and Home page from the locked Home visual authority without inventing a new visual direction.

## Start condition
Do not begin until:
1. WO-000 is reviewed and marked PASS;
2. the accepted WO-000 commit SHA is supplied;
3. the approved Home package is available, or the owner-approved documented visual authority and CP9/V13 desktop/mobile regression captures are available for manual review (pixel-perfect parity is not claimed when original PNGs are absent);
4. the canonical game-asset source repo is available locally or its exact approved assets are supplied.

Create `work/WO-001-global-shell-home` from the accepted WO-000 commit. Do not branch from an older planning commit.

## Read first
- `docs/design/DESIGN_SYSTEM_SPEC.md`
- `docs/design/COMPONENT_CATALOG.md`
- `docs/design/TEMPLATE_FAMILY_MAP.md`
- `docs/design/MASCOT_IDENTITY_GUARDRAILS.md`
- `docs/implementation/PUBLIC_TRUTH_RULES.md`
- `docs/implementation/ASSET_INTEGRATION_POLICY.md`
- `docs/implementation/HOME_IMPLEMENTATION_SPEC.md`
- `docs/implementation/HOME_PRODUCT_TRUTH_GATE.md`
- `docs/implementation/HOME_CONTENT_REGISTRY.json`
- `docs/implementation/CANONICAL_ASSET_SOURCE_MANIFEST.json`
- `docs/implementation/TOADAL_COMPANION_STATE_MAP.json`
- `docs/implementation/WO001_VISUAL_ACCEPTANCE_CHECKLIST.md`
- `docs/implementation/CP9_V13_DONOR_BASELINE.md`

## Donor/salvage rule
Before rebuilding any capability already present in the recovered CP9/V13 replacement candidate, inspect the donor and prefer safe reuse/adaptation over reimplementation. CP9/V13 is not disposable. The certified Studio project is the new implementation environment; until the original mockup PNGs are recovered, the available approved visual direction and retained CP9/V13 Home captures are the reviewed composition/regression authority (without pixel-parity claims), and current repository contracts are product-truth/runtime authority.

Do not copy donor `dist/` wholesale. Preserve working route/player/cartridge/fullscreen/funnel patterns where they remain compatible, and document intentional replacements to avoid regressions.

## In scope

### Global shell
Implement reusable:
- SiteHeader
- SiteFooter
- RouteShell
- tokens / CSS variables
- base typography plumbing
- PrimaryButton / SecondaryButton
- CreamPanel
- DarkFeaturePanel
- SectionHeading
- StatusChip
- CategoryTabs
- responsive navigation
- approved desktop search-field treatment from the Home mockup (do not regress to icon-only as the final desktop shell; if search is not public yet, present a truthful non-deceptive state)
- ToadalCompanion state/plumbing

### Home
Implement, in order:
1. hero — **Explore the Feast World for Free** until WO-002 certifies at least one playable browser experience;
2. immediate browser-game discovery
3. truthful Feast Pass planned/preview summary only — live guest-local XP/Sparks/Treats/streak/quest state remains gated until WO-005
4. Today / current-adventure surface
5. Characters / World / Stories & Media discovery
6. App conversion
7. truthful What's Next / future-state section
8. contextual Toadal companion
9. subordinate TOADAL GAMES footer

Use structured data/config rather than duplicated card markup.

## Visual identity
Preserve:
- dark chocolate navigation;
- warm cream/parchment panels;
- vivid pink primary actions;
- deep navy/royal headings;
- gold reward accents;
- lush food-fantasy scenery visible around UI;
- dense but legible game-like composition;
- TOADAL FEAST as dominant identity.

Do not turn the page into sparse corporate/SaaS UI.

## Mascot
Use canonical Toadal only:
- golden-yellow;
- crown;
- red scarf;
- established face/body identity;
- explorer / King-of-Feasts personality.

Prefer clean environment + canonical transparent Toadal overlay.
Do not bake a generated substitute mascot into the hero.

## Product truth
No card/system becomes live because a mockup shows it.

Use explicit state:
`PUBLIC | PREVIEW | PLANNED | COMING_SOON | DISABLED`.

Never fabricate:
- app/game screenshots;
- account sync;
- global rankings;
- Community posting;
- Store checkout;
- release dates;
- final Feast Pass economy.

## Assets
Run the asset audit before implementation:
`powershell -ExecutionPolicy Bypass -File scripts/wo001-asset-audit.ps1 -GameRepo "<ABSOLUTE_PATH_TO_CANONICAL_GAME_REPO>"`

If required canonical assets fail the audit, STOP and report the mismatch rather than substituting generated character art.

The documented approved Home direction is composition authority, with CP9/V13 captures as the regression baseline. The missing original PNGs do not independently block acceptance when these available references are manually reviewed; do not claim pixel-perfect parity.
Do not use the app icon source as the website wordmark.

## Responsive acceptance
Capture:
- 390×844
- 430×932
- 768×1024
- 1366×768
- 1600×900
- 1920×1080

## Accessibility
- keyboard navigation;
- visible focus;
- semantic landmarks;
- meaningful labels;
- reduced motion;
- no color-only meaning;
- companion never blocks controls/content.

## Required evidence
- Studio validation
- tests relevant to changed code
- static export
- Home required-link check
- console-error check
- accessibility smoke check
- viewport screenshots in `docs/review/WO-001/`
- exact diff/stat
- final branch commit
- clean git status

## Out of scope
- Play page implementation
- World/Stories/other route implementation
- backend/provider selection
- final account system
- persistent/global leaderboard
- Community backend
- Store checkout
- new mascot/character generation
- production deployment
- DNS
- broad architecture redesign

## Stop condition
STOP after Global Shell + Home are implemented, tested, evidenced and committed on the work branch.

Do not merge to `main`.
Do not deploy Pages.
Do not start WO-002.
