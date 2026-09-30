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
