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

Pre-Studio browser captures now cover the full required viewport matrix:
- `home-390x844.png`
- `home-430x932.png`
- `home-768x1024.png`
- `home-1366x768.png`
- `home-1600x900.png`
- `home-1920x1080.png`

`viewport-probes.json` records the exact emulated viewport and document-width witness. All six currently report **no document-level horizontal overflow**. The small/tablet cases also confirm the responsive menu button remains visible.

The first viewport sweep exposed a real grid min-content overflow on 390/430/768 widths; this branch adds the narrow `min-width:0` containment fix and the repeated sweep is clean.

Browser interaction probes are also recorded in `interaction-probes.json` for 390×844 and 1600×900. They confirm one H1, semantic header/nav/main/footer landmarks, zero broken in-page anchor targets, zero unlabeled buttons, truthful disabled search, functional mobile menu state change, contextual companion focus reaction, no document overflow, and an active reduced-motion override (`transition-duration: 0.001ms`).

The captures and browser probes are pre-Studio witnesses only. They do not replace the required final Studio 1.4.2 render/export/viewport matrix.

## Acceptance boundary

Do not mark WO-001 PASS from this branch alone. The active implementation lane must still run the certified Studio validation/render/export path and final accessibility/viewport evidence.
