# WO-000 — D-generator Environment Baseline
**Status:** READY
**Execution branch:** `work/WO-000-environment-baseline`

## Goal
Certify D-generator, TOADAL Studio 1.4.1, the fresh website Studio project, and local static export before any visual implementation.

## Hard prerequisites
- Repository: `Matthew75x/toadal-feast-web`
- Branch: `work/WO-000-environment-baseline`
- Node.js: **22+**
- Studio archive supplied by owner:
  `TOADAL_STUDIO_1.4.1_RESEALED_2026-09-29.zip`
- Expected Studio ZIP SHA-256:
  `bad679307d6fa4ab8a75ac6dd3700cd8988cf92874ba2a7a287ee7b2ba9c5ec8`

If the Studio archive is not physically available on D-generator, or its hash does not match, **STOP and report that blocker**.
Do not download or substitute another Studio build.

## Why Codex
This is bounded environment/configuration/build verification. It requires command execution, not product or visual judgment.

## In scope
1. Clone/update `Matthew75x/toadal-feast-web`.
2. Checkout the pre-created branch `work/WO-000-environment-baseline`.
3. Verify the branch starts from the documented website baseline and this work order is present.
4. Extract Studio **outside the public website repository**.
5. Confirm:
   - package version 1.4.1;
   - `plugin.json` version 1.4.1;
   - `.codex-plugin/plugin.json` version 1.4.1.
6. From Studio root run:
   - `npm run validate`
   - `npm test`
   - `npm run ai:doctor`
7. Create a **fresh Modern clean-site project** under the website repo's `studio-project/` source area.
   Preferred resulting manifest:
   `<repo>\\studio-project\\toadal-feast-web\\project.json`
   Do not copy/reuse Studio's legacy `projects/toadal-games` project.
8. Set `TOADAL_PROJECT` explicitly to the exact fresh manifest path.
9. Prove MCP/local AI operations target that project:
   - `toadal.inspect`
   - `toadal.render`
   - `toadal.export(kind="static")`
   - a verify/preflight checkpoint
10. Confirm the clean project validates with 0 errors and 0 warnings.
11. Confirm static export contains a valid website output including `index.html` and `404.html`.
12. **Do not replace the tracked repository `dist/` placeholder during WO-000.**
    Prove export compatibility in a temporary/untracked location only. The first real `dist/` replacement belongs to WO-001.
13. Ensure project build products/history are not committed.
14. Record exact commands, paths, versions and results in:
    `docs/environment/DGENERATOR_BASELINE.md`
15. Commit only:
    - the fresh Studio project source needed for later implementation;
    - the baseline report;
    - any narrowly necessary ignore/config file.
16. Report final commit and stop.

## Version-note
Studio's root `CAPABILITY_LEDGER.json` may still label the historical certified foundation as release 1.2.0.
That is not the installed Studio package version.
For WO-000, installed Studio authority is the package/plugin/MCP version **1.4.1** plus passing validation/tests/doctor.

## Out of scope
- Home or other page implementation
- design-system coding
- image generation
- Figma work
- asset selection
- backend/provider selection
- changing tracked `dist/`
- GitHub Pages deployment
- production deployment or DNS
- mobile-game repository changes
- broad architecture improvements

## Required evidence
Report:
- final commit SHA
- Node/npm versions
- Studio package/plugin versions
- exact Studio installation path
- exact `TOADAL_PROJECT` path
- validate result
- 81-test result
- ai:doctor result
- inspect/render/export/checkpoint result
- static export file check
- `git status`
- any blocker for WO-001

## Stop condition
STOP after the environment baseline is documented and committed.

Do not start WO-001.
Do not use spare time to improve the website.
Do not merge to `main`.
Do not trigger GitHub Pages.
