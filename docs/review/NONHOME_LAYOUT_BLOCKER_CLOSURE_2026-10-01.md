# Non-Home Layout Blocker Closure — 2026-10-01

## Result

**PASS — the previously identified non-Home layout blockers are closed at source level and validated in the rendered candidate surface available in this environment.**

This lane is intentionally narrow. It does not redesign Home, change product claims, touch gameplay, deploy staging, or modify production.

## Provenance

- Branch: `parallel/nonhome-layout-blocker-closure-20261001`
- Base: `1837d62f3c53b521cb74761258aa8eb701dba318`
- Owner-preview QA ancestor: `7a649bdcc9f3f00526a06b716fbea2e5f3e63c67`
- Integrated product ancestor: `ce5aceb251ac6b612fcace7baa6ea63032ca93a7`

## What was actually wrong

The previous 77-case owner-preview browser matrix showed eight red cases:

- four `/search/` cases because current source has not yet been authoritatively Studio-rendered into `dist/`;
- four non-Search cases:
  - Play desktop: reported companion/action overlap;
  - Play 320px: clipped filters/game-detail action plus reported companion/filter overlap;
  - Toadal profile 390px: clipped anchor navigation;
  - Contact 390px: reported companion/select overlap.

The audit separated genuine layout defects from QA false positives instead of blindly changing the product to satisfy the test.

### False-positive root cause: companion geometry

The companion runtime defaults to minimized when there is no stored preference. In that state the speech panel is hidden and only the Toadal toggle is visible.

The first QA gate measured the full fixed `.toadal-companion` container rectangle, including space reserved for the hidden panel. That made Play desktop, Play small-mobile, and Contact mobile look obstructed even when the hidden panel could not intercept or cover those controls.

The browser gate now measures only **visible companion children**:
- `.companion-panel` when actually visible;
- `.companion-toggle`.

Overlap area is calculated from those visible rectangles only.

This preserves a strict obstruction test without forcing unnecessary visual regressions.

## Genuine defect 1: Home CSS leaking into Play

The Home LOCK_VISUAL block used global selectors such as:

`#browser-games { ... !important }`

The Play page also owns an element with `id="browser-games"`.

As a result, Home's dense two-column/four-column game-card styling leaked into the dedicated Play page, overriding Play's intended responsive card layout. At 320px this produced extremely narrow cards and contributed to clipped controls.

The Home-only rules are now explicitly scoped:

`body:has(.home-hero) #browser-games ...`

for both desktop and mobile Home treatments.

Result:
- Home keeps the exact intended dense portal layout;
- Play no longer inherits Home-only card geometry;
- the fix addresses the root cause rather than stacking another Play-specific `!important` override.

A separate Home/non-Home ID collision audit found no other current Home ID collision requiring this treatment beyond the intentionally repeated companion panel ID inside isolated page documents.

## Genuine defect 2: Play filters at narrow widths

The Play filter row was intentionally horizontally scrollable at mobile width. The owner-preview requirement is stricter: important filters should remain immediately visible on the smallest supported preview width.

At <=760px the Play filters now:
- wrap;
- remain within the game-library container;
- do not require horizontal scrolling.

At 320px all three current filters remain in-bounds.

## Genuine defect 3: Toadal profile anchor navigation

The profile anchor strip was horizontally scrollable. At 390px several controls were off-screen at initial render.

At <=680px it is now a contained 3-column responsive grid with shrink-safe links.

All ten profile-section destinations remain immediately discoverable without horizontal clipping.

## Verification tooling

Added:

`scripts/verify-nonhome-layout-closure.mjs`

It locks the root-cause fixes:
- Home `#browser-games` styling must remain Home-scoped;
- unscoped `#browser-games` rules are rejected;
- mobile Play filters must wrap and remain non-scroll-clipped;
- Toadal profile anchors must use the contained mobile grid;
- companion obstruction QA must measure visible companion children rather than the hidden container footprint.

This verifier is now part of:

`scripts/owner-preview-gate.py`

## Rendered browser evidence

For visual/layout validation only, the current source CSS was projected into the existing rendered `dist/` without committing generated output. The normal generated `dist/` was restored afterward.

Fresh browser result excluding the already-known unrendered Search route:

- **73 / 73 PASS**
- 0 clipped controls
- 0 severe companion/control overlaps
- 0 horizontal-overflow failures
- 0 runtime/layout failures across the non-Search matrix

Evidence:

`docs/review/nonhome-layout-blocker-closure-20261001/browser-matrix-nonsearch.json`

The complete matrix still reports exactly four red cases, all four being `/search/` because the current checked-in `dist/` predates the Search render. No non-Search case remains red.

That Search condition belongs to the authoritative Studio render lane and is not hidden or relabeled as a layout failure.

## Regression qualification

Fresh source-level qualification:

- integrated Node suite: **48/48 PASS**
- Home visual contract: **29/29 PASS**
- navigation truth: **PASS**
- character registry: **PASS**
- gated ecosystem: **PASS**
- manifest compliance: **PASS**
- Search/Discovery source contract: **PASS**
- non-Home truth: **PASS**
- visual asset authority: **PASS**
- non-Home layout closure: **PASS**
- `git diff --check`: **PASS**

The one-command owner-preview gate with browser work skipped now has:
- **14 PASS**
- **1 FAIL**

The sole failure remains the expected `render-freshness` gate because the authoritative Studio render has not yet regenerated Search and newer source truth into `dist/`.

## Deliberate boundaries

- `pages/home.json` is untouched.
- No Home content or visual composition was changed.
- No generated `dist/` change is committed.
- No product behavior or gameplay changed.
- No staging or production deployment occurred.
- No main-branch merge occurred.

## Integration handoff

This donor should be integrated after the previously closed authority/QA donors, or directly by taking this commit when its ancestry is already present.

After integration into the final visual candidate:

1. perform the authoritative Studio 1.4.2 render;
2. rerun the full owner-preview gate;
3. require the complete 77-case matrix to pass, including newly rendered Search;
4. only then promote the exact frozen build to `staging/live-visual`.

The non-Home layout-blocker closure task itself is complete.
