# WO-000 — D-generator Environment Baseline
**Status:** READY
**Authoritative setup branch:** `plan/design-system-work-orders-20260929`
**Exact starting commit:** `8cbf923440159e6e946082569ce2b4d81694e2e2`
**Execution branch:** `work/WO-000-environment-baseline`

## Goal
Prepare D-generator as the website implementation machine and prove the exact Studio/project/export baseline works before design implementation.

## Why Codex
This is bounded environment setup, configuration verification and repeatable command/test work.

## In scope
1. Work only in `Matthew75x/toadal-feast-web` on `work/WO-000-environment-baseline`.
2. Confirm the branch starts from commit `8cbf923440159e6e946082569ce2b4d81694e2e2`.
3. Install/reference the owner-supplied resealed TOADAL Studio 1.4.1 outside the public website repository.
4. Verify Studio version and run `npm run validate`, `npm test`, and `npm run ai:doctor` when supported.
5. Create/validate a fresh independent TOADAL FEAST website Studio project.
6. Do **not** reuse Studio's legacy `projects/toadal-games` project.
7. Set `TOADAL_PROJECT` explicitly to the exact new `project.json`.
8. Prove Studio MCP inspect/render/export/checkpoint targets only that project.
9. Prove static export can write the website repo's `dist/` target.
10. Record commands, versions, paths and results in `docs/environment/DGENERATOR_BASELINE.md`.
11. Make no design/page changes.

## Out of scope
Home implementation, design coding, image generation, Figma, backend providers, production deployment,
DNS changes, mobile-game repo changes, broad architecture changes.

## Required evidence
Report Studio/Node/npm versions, exact `project.json`, test results, export result, branch/final commit,
`git status`, and any blocker for WO-001.

## Stop condition
STOP after baseline documentation is committed.
Do not begin WO-001 or improve the website.
