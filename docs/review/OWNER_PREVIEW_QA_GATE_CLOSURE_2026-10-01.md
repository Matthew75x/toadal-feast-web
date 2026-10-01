# Owner Preview Critical QA Gate — 2026-10-01

## Lane result

**PASS — the owner-preview QA gate itself is complete and reproducible.**

**Current pre-render website candidate: FAIL, correctly blocked.**

This lane does not modify Home, gameplay, styling, product content, staging, or production. It adds qualification tooling only, on top of the completed non-Home truth donor.

## Provenance

- Branch: `parallel/owner-preview-gate-20261001`
- Base: `990fd7044cdb4780bd0446ee5aad287753b8fe32`
- Integrated product ancestor: `ce5aceb251ac6b612fcace7baa6ea63032ca93a7`

## What the gate does

`python scripts/owner-preview-gate.py --repo . --base-path /toadal-feast-web/`

runs one bounded release-style owner-preview check covering:

- integrated 48-test website suite;
- Home visual contract;
- navigation truth;
- character registry;
- gated ecosystem;
- manifest;
- Search/Discovery;
- non-Home truth;
- cartridge isolation;
- source-to-render freshness;
- GitHub Pages base-path safety;
- static links;
- staging robots;
- a dependency-free Chrome/CDP browser matrix.

The browser matrix uses the locally installed Chrome directly and does not require Playwright. It checks all 30 registered routes at desktop and 390px mobile, plus tablet/small-mobile coverage on the most important owner-review routes and an additional 430px Home case.

Current matrix size: **77 rendered route/viewport cases**.

It checks:
- page/title/lang/viewport integrity;
- one visible H1 and one main;
- broken images and missing alt;
- duplicate IDs;
- unnamed interactive controls;
- broken same-page fragments;
- runtime/HTTP errors;
- horizontal overflow;
- horizontally clipped visible controls;
- severe fixed/sticky Toadal-helper overlap with meaningful non-header/footer controls;
- companion viewport bounds.

## Current gate result

Overall: **FAIL — 12 gates pass, 2 gates block**.

Passing:
- integrated Node suite: 48/48
- Home visual contract: 29/29
- navigation truth
- character registry
- gated ecosystem
- manifest
- Search source contract
- non-Home truth contract
- cartridge isolation
- Pages base path
- static links
- staging robots

Blocking:

### 1. Render freshness

The checked-in `dist/` is older than the combined source candidate.

It is missing the rendered `/search/` route and rendered local search index, and still contains pre-convergence copy on 404, Characters, Toadal profile, News, and Media.

This is exactly why the final owner preview must be produced through a fresh authoritative Studio render rather than treating the current `dist/` as current.

### 2. Browser matrix

Current stale `dist/` result:

- 77 cases total
- 69 PASS
- 8 FAIL

Four failures are the absent rendered `/search/` route across desktop/mobile/tablet/small-mobile and should disappear after the required Studio render.

The remaining visual/interaction findings are useful owner-preview blockers to re-check after Codex's visual pass:

- `/play/` desktop: fixed Toadal helper substantially covers a game-detail action.
- `/play/` 320px: filter/actions have clipped controls and the helper substantially overlaps the filter controls.
- `/characters/toadal/` 390px: the profile anchor navigation runs off the right edge (Locations/Games/Stories/Gallery/Collectibles).
- `/contact/` 390px: the fixed helper substantially overlaps the category select control.

The overlap gate intentionally ignores header/footer controls and only blocks overlaps greater than 50% of the affected control area, to avoid turning normal decorative proximity into noisy failures.

## Why this matters

Previously, a build could be described as healthy because route/link checks passed even while:
- generated `dist/` lagged behind newer source work;
- a new route existed in source but not in the rendered preview;
- a control was clipped by an overflow-hidden mobile layout;
- the fixed Toadal helper covered an important control.

This gate turns those into explicit blockers before staging promotion.

## Integration handoff

Bring this gate branch/commit into the final owner-preview visual candidate after the non-Home truth donor.

Then:

1. run both content builders;
2. perform the authoritative Studio 1.4.2 render;
3. rerun the one-command owner-preview gate;
4. fix any remaining real layout blockers;
5. require the gate to be fully PASS before staging/live-visual promotion.

No deployment occurred from this lane.
