# TOADAL FEAST Website - Project Source Map / Authority Firewall

**Date:** 2026-10-01

## Purpose

ASSIGNATOR contains many historical TOADAL website worktrees and redesign packages. This document prevents a historical donor from silently becoming current product authority.

## Active project folders

- `C:/ReleaseOps/toadal-feast-web-live-staging` - public staging lineage; remote staging SHA `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6`.
- `C:/ReleaseOps/toadal-feast-web-stories-stack-20261001` - current integrated review candidate `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6` on `work/manifest-complete-v1-20261002`.
- `C:/ReleaseOps/toadal-feast-web-gated-ecosystem-20261001` - parallel gated-ecosystem candidate for manifest rows 19, 21, 22, 26, 27, 28, 29; not deployed.
- `C:/ReleaseOps/toadal-feast-web-visual-combined-20261001` - older visual-only convergence candidate `undefined`; implementation history/donor, not current review head.
- `C:/ReleaseOps/toadal-feast-web-manifest-recalibration-20261001` - manifest-control baseline worktree.
- `C:/ReleaseOps/toadal-feast-web-master-asset-integration-20261001` - Master V2 asset authority `undefined`.
- `C:/ReleaseOps/toadal-feast-web-discovery-visual-20261001` - World/Stories/Media candidate.
- `C:/ReleaseOps/toadal-feast-web-home-header-convergence-review-20261001` - reviewed Home/header candidate.
- `C:/ReleaseOps/toadal-feast-web-production-asset-archive-20261001` - complete production-ready asset-pack preservation.

## Local donor that must not be lost

- `C:/ReleaseOps/toadal-feast-web-home-lock-visual-20261001` - unpushed Home LOCK_VISUAL WIP donor. Its exact CSS diff is preserved as `docs/authority/donors/home-lock-visual-parity-20261001.patch` (SHA-256 `c215c613b6d67a40bde9ccc5b23cb84302e2cab6c03cb122eed42c47f5739d5d`).
- Visual proof: `docs/review/manifest-recalibration/home-lock-wip-donor-1440x900.webp` (SHA-256 `31b00079fd7b97f91294c2c3957543ec334f17717e36f70e44e76497be8f0ca6`).
- Use it as a visual/CSS donor only. It is not authority and not approved final.

## Preservation-only folders

- `toadal-feast-web-local-wip-preservation`
- `toadal-feast-web-wo002-preservation`
- companion prep/archive branches and staging rollback refs

Preservation folders are evidence/donors. They are not product authority.

## Historical / superseded website folders

- `toadal-games-redesign-20260925`
- `toadal-games-master-20260925`
- `toadal-games-web-r2`, `r3`, `v4`
- `toadal-final-*`, `toadal-release-*`, `toadal-integration-*`
- older WO-001 polish/audit/remediation worktrees
- `visual-recovery-combined`, `visual-remediation`, `website-visual-audit-*`

These folders remain useful for engineering donors, historical evidence or assets. They cannot override the 2026-10-01 consolidated TOADAL FEAST product authority.

### Explicit conflict example

`C:/ReleaseOps/toadal-games-redesign-20260925` contains an older authority model that describes TOADAL GAMES/Grove-first composition, a green/Toto guide and dashboard/left-rail concepts. Later authority establishes TOADAL FEAST-first presentation and canonical golden Toadal. The old rules are donor/history only.

## High-value historical donors

- `toadal-games-redesign-20260925/site/src/scripts/app.js` - working browser-local Sparks, streaks, Treats, quest, daily reward and reduced-motion parallax donor.
- `toadal-games-web-r3/TOADAL_GAMES_R3_INTERACTIVE_MASCOT` - explicitly deferred/not a release candidate, but R2 smoke proves a 21-route local build plus Passport/HUD, optional sound, daily reward, Treat/quest persistence and reward behavior. Its route templates include Toadal, Account, Community, Store, Support, Privacy, Terms and Updates.
- Import behavior/templates only after translating them to current TOADAL FEAST branding, truthful feature states and current storage/content contracts.

## External systems

- **GitHub Pages** is the active public staging system.
- **Netlify** contains cartridge previews and an older V13 site preview; it is not current website deployment authority.
- **Figma** contains the Approved Home Target page. Repository-preserved approved Home evidence remains usable when Figma MCP quota is unavailable.

## Rule

Before using any source outside `docs/authority`, `docs/design`, approved mockup evidence or current candidate lineage, identify its authority tier in the Manifest Compliance Ledger. If uncertain, treat it as a donor - not as an instruction.
