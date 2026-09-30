# Preparation Promotion Plan — WO-000 → WO-001

## Problem being solved
The live Codex environment-certification branch and the forward-planning branch are intentionally separate.

This prevents ChatGPT preparation from colliding with Codex's active WO-000 work, but the implementation branch must receive the prepared authority after WO-000 passes.

## Current branches
Active Codex:
`work/WO-000-environment-baseline`

Cumulative preparation:
`plan/website-prep-full-20260930`

## After WO-000 PASS
Do **not** make WO-001 from this planning branch.

Correct sequence:
1. record accepted WO-000 final commit SHA;
2. create `work/WO-001-global-shell-home` from that exact SHA;
3. promote only planning/document/script files from `plan/website-prep-full-20260930`;
4. do not overwrite WO-000 environment evidence/project files with older planning copies;
5. verify resulting branch contains both:
   - accepted environment baseline;
   - current design/runtime/content/release authority;
6. run WO-001 asset audit;
7. begin Home implementation.

## Promotion scope
Promote preparation paths:
- `docs/design/`
- `docs/implementation/`
- `docs/content/`
- `docs/work-orders/WO-001*` through later prepared work orders
- planning utility scripts:
  - `wo001-asset-audit.ps1`
  - `verify-pages-basepath.mjs`
  - `audit-cartridge-source.mjs`
  - `verify-static-links.mjs`
  - `verify-staging-robots.mjs`
  - `generate-static-manifest.mjs`

Preserve accepted WO-000 paths from the implementation branch:
- `docs/environment/DGENERATOR_BASELINE.md`
- fresh `studio-project/` source
- any accepted WO-000 narrow config/ignore changes

## Safety
Before implementation:
- compare against accepted WO-000;
- ensure `dist/` is still the accepted pre-WO-001 state;
- ensure Pages was not triggered by preparation;
- ensure no secret/private artifact was promoted.

## Why this exists
It prevents a common integration mistake: starting the beautiful Home work from an older planning branch and accidentally losing the environment baseline Codex just certified.
