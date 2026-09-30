# WO-001 Parallel Audit — 2026-09-30

This audit was performed independently on ASSIGNATOR against the current WO-001 source lineage while Codex remains responsible for the bounded Studio implementation/certification lane.

**Evidence note:** this is a point-in-time audit snapshot from before the final local Home and navigation corrections. Its search, Today, and 13-target navigation failures are historical, not current. Current local results are in `QA_REPORT.md`; the CP9 integrity result remains external and is not a local donor-salvage review.

## Donor integrity

The recovered CP9/V13 donor is intact.

- archive SHA-256: `ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`
- donor static output: 236 files / 6,605,121 bytes
- pinned key files/screenshots: 15
- `node scripts/verify-cp9-donor.mjs .`: **PASS**
- total verifier witnesses: 17
- donor failures: 0

Four original CP9 QA screenshots are preserved under `docs/review/CP9-donor/` on this QA branch.

## Historical Home contract scan (before final corrections)

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

## Snapshot gaps (search and Today were later implemented)

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

At the time of this snapshot, WO-001 should not be accepted until its two static contract gaps were resolved and the final Studio 1.4.2 viewport evidence passed. Search and Today are now implemented and have current passing evidence in `QA_REPORT.md`.

This QA branch intentionally does not modify the Home implementation. It provides donor preservation, source-level regression guards, and explicit closure criteria without colliding with Codex's implementation branch.
## Historical navigation truth audit (before anchor correction)

A separate navigation-source guard was added:

`node scripts/verify-navigation-truth.mjs .`

Snapshot result at that time:
- implemented Studio routes: 2 (`/`, `/404.html`)
- navigation targets checked: 14
- unresolved clickable targets: **13**

The current `navigation.json` points at future routes such as Play, World, Stories, Media, Feast Pass, App, Community, Store, About, News, Support, Contact and Legal even though those Studio pages do not exist yet.

This was not permission to remove approved navigation labels. The later local implementation keeps the labels and targets Home anchors; the current navigation guard verifies all 14 route/fragment targets with zero unresolved links. See `QA_REPORT.md`.

Final Studio export must not ship a polished Home whose global navigation simply sends visitors to thirteen missing pages.
