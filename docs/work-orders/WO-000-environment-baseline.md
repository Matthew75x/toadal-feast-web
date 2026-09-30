# WO-000 — D-generator Environment Baseline
**Status:** READY
**Start:** main at 87050885331770ca3e30db7e463154aebd777512
**Branch:** work/WO-000-environment-baseline

## Goal
Prepare D-generator as the website implementation machine and prove the exact Studio/project/export baseline works before design implementation.

## Why Codex
This is bounded environment setup, configuration verification and repeatable command/test work.

## In scope
1. Clone/update Matthew75x/toadal-feast-web from the documented start.
2. Install/reference the owner-supplied resealed TOADAL Studio 1.4.1 outside the public website repo.
3. Verify Studio version and run npm run validate, npm test, and npm run ai:doctor when supported.
4. Create/validate a fresh independent TOADAL FEAST website Studio project.
5. Do NOT reuse Studio's legacy projects/toadal-games project.
6. Set TOADAL_PROJECT explicitly to the exact project.json.
7. Prove Studio MCP inspect/render/export/checkpoint targets only that project.
8. Prove static export can write the website repo's dist/ target.
9. Record commands, versions, paths and results in docs/environment/DGENERATOR_BASELINE.md.
10. Make no design/page changes.

## Out of scope
Home implementation, design coding, image generation, Figma, backend providers, production deployment,
DNS changes, mobile-game repo changes, broad architecture changes.

## Evidence
Report Studio/Node/npm versions, exact project.json, test results, export result, branch/final commit,
git status, and any blocker for WO-001.

## Stop
STOP after baseline documentation is committed.
Do not begin WO-001 or improve the website.
