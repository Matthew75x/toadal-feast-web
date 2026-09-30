# WO-001 Parallel Visual-Contract Fix Candidate

Date: 2026-09-30  
Status: candidate patch only; final Studio 1.4.2 certification still required.

This branch addresses three concrete regressions/gaps found by the independent CP9/WO-001 audit without widening WO-001 scope.

## Changes

- restores the approved desktop search-field **shape** while keeping search truthfully unavailable until its later utility phase;
- adds a bounded **Today in the Feast** / current-adventure surface using only local/current feature truth;
- prevents the current Home shell from linking to thirteen routes that do not exist yet by using truthful in-page destinations and non-clickable planned footer items.

No backend, account sync, store destination, game-publication state, production deployment, or DNS behavior is added.
## Independent checks

Against this candidate:

- Home visual contract: **18/18 PASS**
- navigation truth: **0 unresolved clickable targets**
- canonical asset audit: **10 required assets PASS**
- `git diff --check`: **PASS**

Pre-Studio browser captures:
- `home-1600x900.png`
- `home-390x844.png`

The captures are visual witnesses only. They do not replace the required final Studio 1.4.2 render/export/viewport matrix.

## Acceptance boundary

Do not mark WO-001 PASS from this branch alone. The active implementation lane must still run the certified Studio validation/render/export path and final accessibility/viewport evidence.
