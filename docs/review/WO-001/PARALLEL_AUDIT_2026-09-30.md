# WO-001 Parallel Audit — 2026-09-30

This audit was performed independently on ASSIGNATOR against the current WO-001 source lineage while Codex remains responsible for the bounded Studio implementation/certification lane.

## Donor integrity

The recovered CP9/V13 donor is intact.

- archive SHA-256: `ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`
- donor static output: 236 files / 6,605,121 bytes
- pinned key files/screenshots: 15
- `node scripts/verify-cp9-donor.mjs .`: **PASS**
- total verifier witnesses: 17
- donor failures: 0

Four original CP9 QA screenshots are preserved under `docs/review/CP9-donor/` on this QA branch.

## Current Home contract scan

A new non-browser source guard was run:

`node scripts/verify-home-visual-contract.mjs .`

Result against the current WO-001 Home scaffold:
- 18 checks total
- 16 PASS
- 2 FAIL
PASS coverage already includes:
- locked hero message
- browser-game discovery
- Feast Pass
- app conversion
- What's Next
- canonical Toadal
- retired Lily exclusion
- contextual companion source
- pointer hover reaction
- keyboard focus reaction
- companion minimize persistence
- reduced-motion behavior
- small-phone breakpoint
- Preview truth treatment
- pending-store-link truth
- core navigation labels

## Current gaps

### 1. Desktop search treatment — FAIL
The current pre-Studio shell uses an icon-only disabled utility. The approved Home direction/CP9 donor uses a real desktop search-field treatment.

Closure requirement:
- restore the visible search field form factor;
- if search is not yet public, make the field truthfully disabled/coming-soon rather than pretending search works;
- do not regress back to an icon-only desktop shell.

### 2. Today / current-adventure surface — FAIL
The current Home has a Today's Quest row inside Feast Pass, but no dedicated Today/current-adventure surface required by WO-001.

Closure requirement:
- add the bounded, truthful Today/current-adventure surface;
- do not fabricate live-service data, rotating server state, dates, or account synchronization;
- it may route the visitor toward current browser adventures/discovery using real feature states.
## Visual comparison

The current WO-001 pre-Studio screenshot is directionally healthy: rich world art, canonical Toadal, chocolate/cream/pink/gold system, browser games, Feast Pass, and discovery surfaces are present.

The CP9 reference remains useful because it proves a more complete desktop utility/search treatment and mature full-page composition already existed.

## Recommendation

WO-001 should not be accepted until the two static contract gaps above are resolved and the final Studio 1.4.2 viewport evidence passes.

This QA branch intentionally does not modify the Home implementation. It provides donor preservation, source-level regression guards, and explicit closure criteria without colliding with Codex's implementation branch.
## Navigation truth audit

A separate navigation-source guard was added:

`node scripts/verify-navigation-truth.mjs .`

Current result:
- implemented Studio routes: 2 (`/`, `/404.html`)
- navigation targets checked: 14
- unresolved clickable targets: **13**

The current `navigation.json` points at future routes such as Play, World, Stories, Media, Feast Pass, App, Community, Store, About, News, Support, Contact and Legal even though those Studio pages do not exist yet.

This is not permission to remove the approved navigation labels. It is a closure requirement to make unavailable destinations truthful in WO-001—for example, current-page anchors, disabled/planned states, or another Studio-supported non-broken treatment—until each real route lands in its own work order.

Final Studio export must not ship a polished Home whose global navigation simply sends visitors to thirteen missing pages.
## Parallel closure candidate

A separate implementation candidate was created after the baseline findings rather than mutating this QA branch:

- branch: `fix/wo001-search-today-nav-truth-20260930`
- draft PR: #5
- current candidate head: `458c43049373b9514fd003126da72c06dd28ee15`

It closes the two source-level gaps found above:
- approved desktop search-bar form factor restored as a truthful `Soon` surface;
- dedicated truthful Today/current-adventure surface added.

It also prevents current Home navigation from linking to not-yet-implemented Studio routes.
## Exact viewport audit

A reusable Chrome DevTools Protocol audit is now provided by:

`node scripts/audit-home-viewports.mjs <repo>`

Against PR #5 after the grid-containment fix:

- 390×844: PASS; no horizontal overflow; mobile menu visible
- 430×932: PASS; no horizontal overflow; mobile menu visible
- 768×1024: PASS; no horizontal overflow; tablet/mobile menu visible
- 1366×768: PASS; no horizontal overflow; desktop search visible
- 1600×900: PASS; no horizontal overflow; desktop search visible
- 1920×1080: PASS; no horizontal overflow; desktop search visible

Result: **6 / 6 PASS**.

The audit specifically caught a real intrinsic-grid overflow before closure. The fix adds min-width containment to the top and discovery grid children rather than hiding document overflow.
