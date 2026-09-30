# TOADAL FEAST Website — Full Preparation Status
**Date:** 2026-09-30
**Branch:** `plan/website-prep-full-20260930`
**Purpose:** cumulative planning/preparation authority while Codex completes WO-000.

## This branch is cumulative
It includes all preparation from:
- `plan/wo001-home-ready-20260930`
- `plan/website-runtime-contracts-20260930`
- `plan/wo002-play-ready-20260930`
- `plan/content-models-20260930`
- `plan/release-tooling-20260930`

Use this branch as the single preparation source going forward.

## Ready for WO-001
- approved Home implementation spec
- product-truth gate
- Home structured content registry
- canonical asset-source manifest
- Toadal companion state map
- Home visual acceptance checklist
- deterministic canonical asset audit

## Ready for WO-002
- browser-game public-state audit
- Arcade preview source/package audit
- browser cartridge contract
- cartridge JSON schema
- static cartridge dependency auditor
- hardened Play/Game Detail/Player work order

## Cross-site runtime authority ready
- 30-route registry
- GitHub Pages base-path/static routing contract
- public feature-state registry
- guest local-state namespace
- SEO/staging metadata contract
- vendor-neutral analytics events
- App conversion evidence gate

## Content/publishing authority ready
- content registry contract + schema
- publication rules
- comic publishing contract
- local search index contract
- progression state contract + schema
- guest-to-account migration guardrail
- hardened WO-003 through WO-006

## Release/QA tooling ready
- GitHub Pages base-path validator
- static-link validator
- staging robots validator
- deterministic static file manifest generator
- release acceptance contract
- hardened WO-007 and WO-008

## Independent verification already performed
On ASSIGNATOR:
- `wo001-asset-audit.ps1` syntax PASS
- Pages base-path validator syntax PASS and current dist PASS
- cartridge source auditor syntax PASS and Arcade donor scan completed
- static link validator syntax PASS and current dist PASS
- staging robots validator syntax PASS and current dist PASS
- static manifest generator syntax PASS and generated manifest successfully

## Arcade donor findings
The existing Arcade standalone is a real browser candidate.

A static-string dependency scan found:
- 359 directly discoverable files
- 19.29 MiB direct closure

The full game asset tree is about 216.85 MiB and must **not** be copied blindly.

Dynamic character/food/power-up families mean the first real website Arcade cartridge requires a deliberately sealed preview profile and runtime dependency proof.

## Current execution dependency
WO-000 is still the only executable Codex task.

Do not start implementation from this planning branch.

After WO-000 PASS:
1. create WO-001 branch from the exact accepted WO-000 commit;
2. promote the current preparation authority into that work branch;
3. provide approved Home visual/asset inputs;
4. run WO-001 only.
