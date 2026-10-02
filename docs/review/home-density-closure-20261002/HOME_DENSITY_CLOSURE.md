# TOADAL FEAST Home Density Closure — 2026-10-02

## Result

**PASS — Home Daily Treat + Interactive Discovery density closure completed on a dedicated branch.**

Starting baseline:
- SHA: `3deb37287f48b40ba738d33e2a94237b3e6441bd`
- Tree: `b403fa555f4028240338d549e6a15dc1cea4ada6`
- Public staging at start: same qualified SHA

Branch:
`parallel/home-density-closure-20261002`

This lane changes **layout/CSS only** for the Home Daily Treat and Interactive Discovery surfaces. No JavaScript, localStorage schema, reward semantics, product truth, companion position logic, route state, or game state is modified.

## Why this lane existed

The live owner-preview Home was functionally correct but visually too loose compared with the approved dense portal target.

Measured live baseline at 1440px:
- full Home document: **2548 px**
- Daily Treat: **302 px**
- Interactive Discovery: **711 px**
- Daily + Discovery consumed **1013 px**, nearly 40% of the entire desktop Home.

Measured live baseline at 390px:
- full Home document: **5327 px**
- Daily Treat: **441 px**
- Interactive Discovery: **1124 px**
- Daily + Discovery consumed **1565 px**.

The approved target uses substantially more of this vertical space for Characters, World, Stories, App, and What's Next rather than allowing two interaction surfaces to dominate the page.

## Production change

### Desktop ≥1100px
- Interactive Discovery now owns the wide left cell.
- Daily Treat becomes a compact right-hand sidecar.
- Both occupy the same grid row.
- Portal and Golden Block art are reduced to deliberate supporting visuals.
- explanatory copy is tightened without removing truth state.
- Daily chest becomes a compact horizontal control.
- Daily sidecar content is vertically centered.
- interactive controls retain the required 44px minimum target.

This mirrors the already successful Home pattern:
- Games + Feast Pass
- Interactive Discovery + Daily Treat
- App + What's Next

### Tablet / mobile
The features remain stacked to avoid cramping, but:
- Portal and Golden Block art are smaller;
- card padding/gaps are tighter;
- Daily Treat chest becomes a compact horizontal action;
- explanatory text is reduced in visual dominance;
- buttons remain ≥44px where required.

No interaction was removed.

## Quantified result

### Desktop 1440
- Home document: **2548 → 2020 px**
- reduction: **528 px / ~20.7%**
- Daily + Interactive area: **1013 px stacked → 485 px shared row**
- band reduction: **528 px / ~52.1%**
- horizontal overflow: **none**

### Mobile 390
- Home document: **5327 → 4809 px**
- reduction: **518 px / ~9.7%**
- Daily + Interactive: **1565 → 1048 px**
- reduction: **517 px / ~33.0%**
- horizontal overflow: **none**

The visual hierarchy now reaches Characters / World / Stories, App, and What's Next hundreds of pixels sooner.

## Interaction preservation

The production interaction suite was executed against the disposable preview with this exact CSS.

**49/49 PASS**, including:
- 1440×900
- 430×932
- 390×844
- 320×800
- no horizontal overflow
- portal and daily controls meet minimum usable target
- companion remains singular
- no standalone interaction storage key
- Golden Block sprite
- Daily Chest sprite
- Daily Treat touch activation
- UTC-day claim semantics
- daily-claim idempotence
- companion position/minimized state preservation
- keyboard candy collection
- touch candy collection
- exactly four Golden Block hits
- Golden Block persistence
- exactly three candies
- reduced motion
- Portal touch/keyboard activation
- same-origin curated navigation
- normal browser history
- zero request/console/runtime errors

## Regression gates

- Home density closure verifier: **PASS**
- Home visual contract: **38/38 PASS**
- App / Download production verifier: **PASS**
- Visual asset authority: **PASS**
- Navigation truth: **PASS**
- required Node suite: **51/51 PASS**
- `git diff --check`: **PASS**

The first compression preview temporarily reduced the Portal control to 38px. Browser QA caught that regression; the final implementation restores a **44px minimum** before closure.

## Evidence

- `evidence/home-density-1440.webp`
- `evidence/home-density-390.webp`
- `evidence/metrics.json`
- `evidence/interactive-discovery-browser-qa.json`

## Scope boundary

Unchanged:
- Interactive Discovery JavaScript
- guest progression logic
- localStorage schemas
- Daily Treat reward semantics
- floating companion architecture/position
- browser-game states
- Search
- Stories/Manga/Reader
- App production package
- Gully/character authority
- `main`
- production

No deployment was performed from this lane.

## Remaining Home visual delta after this closure

This lane removes the largest measured density problem, but does not claim LOCK_VISUAL.

Remaining visual differences versus the approved target are now more focused:
1. final illustrated TOADAL FEAST wordmark/logo is still unavailable in the qualified asset tree; only the approved crown + text treatment exists;
2. Home Browser Games cards are still more text-heavy and less illustration-rich than the target;
3. Feast Pass remains simpler than the target's richer quest/reward treatment;
4. the lower discovery row is still more restrained than the mockup;
5. owner judgment is still required on overall visual density after integration.

Those are finite visual gaps, not missing website architecture.
