> **Current-state pointer (2026-10-06):** For day-to-day website lane status, start with [CURRENT_STATE_20261006.md](CURRENT_STATE_20261006.md). This file remains the product-requirements authority and historical consolidation record; operational snapshots below may be superseded by the current-state pointer.\n\n# TOADAL FEAST website product authority

Consolidated 2026-10-01. Repository: `Matthew75x/toadal-feast-web`.

## Binding hierarchy

1. OWNER-APPROVED PRODUCT/CREATIVE REQUIREMENTS
2. AUTHORITY MANIFESTS / APPROVED ASSETS / MOCKUPS
3. IMPLEMENTATION WORK ORDERS
4. STAGING IMPLEMENTATION

A work order cannot silently redefine, delete, or mark complete an owner-approved requirement. Newer timestamps do not establish higher authority. A conflict requires an explicit owner decision, its source, the exact affected requirement, and an entry in [AUTHORITY_CHANGELOG.md](AUTHORITY_CHANGELOG.md). Until then, preserve the requirement and report the implementation gap.

Mockups approve only the dimensions identified in the visual ledger. Layout approval does not approve generated character identities, fabricated game/app screenshots, sample economy values, invented lore, dates, or working accounts/commerce.

## Manifest compliance control

The canonical project-level progress control is [MANIFEST_COMPLIANCE_LEDGER_2026-10-01.md](MANIFEST_COMPLIANCE_LEDGER_2026-10-01.md), with machine-readable state in `manifests/manifest-compliance-ledger.json`. It uses the original 30-page manifest plus locked cross-cutting product requirements as the denominator.

Work-order PASS, automated QA PASS, route presence, branch cleanliness, or visual improvement do **not** upgrade a manifest row to complete. Future tasks must identify the manifest row(s), cross-cutting requirement(s), or release blocker they advance. Historical project folders are donor/evidence only unless the current authority explicitly cites them; see [PROJECT_SOURCE_MAP_2026-10-01.md](PROJECT_SOURCE_MAP_2026-10-01.md).

## Current operational authority

Local authoring supplement (2026-10-03): [owner self-service foundation closure](../authoring/OWNER_SELF_SERVICE_CLOSURE_20261003.md) records Studio 1.4.2 source `e06eb5f14c210fc22b9f39dd11b9b51ee6847faa`, safe ordinary-page UI qualification and the current local editor. It does not modify product/creative requirements, upgrade manifest visual acceptance, integrate Stories/Reader or cartridges, or authorize deployment. The operational SHA list below is the preserved 2026-10-01 consolidation snapshot, not a claim about the latest local authoring tip or a newly verified deployment; see `TOADAL_STUDIO_LIVE_STATE_20261002.md` for current local provenance.

- Current public visual staging lineage: `staging/live-visual` at verified SHA `270940dee30b7aafb70af941c520c6d4d223e288`.
- Authority consolidation baseline: `ops/web-authority-consolidation-20261001` at `92decef6cef31622833458e2a98dd9e577ca79c2`.
- Current integrated review candidate: `integration/manifest-home-characters-progression-20261001` at `945c7ea1b0bc417cbbf2b7b6b3ca3b366114a9da`. It combines the Home `LOCK_VISUAL` candidate, Characters Hub + Toadal Profile, and guest-local progression. It is **not** owner-approved, staged, or deployed.
- Older visual-only convergence candidate: `integration/visual-convergence-combined-20261001` at `58a7121e363d3480c122623b1de5cd0d5ac1778e`; retain as implementation history/donor rather than the current review head.
- Manifest-control baseline: `ops/manifest-recalibration-20261001` at `914a79f0e36c003583282ea7461cb9f8aba8d52a`.
- Main snapshot remains `87050885331770ca3e30db7e463154aebd777512`.
- Public visual staging: <https://matthew75x.github.io/toadal-feast-web/>.
- Studio project: `studio-project/toadal-feast-website/project.json`; certified renderer: TOADAL Studio 1.4.2.
- `staging/live-visual` is the deployment lane. Review, consolidation and archival branches do not deploy. Production and DNS require a separate explicit owner instruction.

The current owner's staging-restoration and authority-consolidation instructions supersede older operational statements that Pages must deploy `main`, WO-000 is unstarted, or accepted WO-001/002 work remains blocked. They do not supersede product/creative requirements. [Work-order history](../work-orders/PRESERVED_WORK_ORDER_HISTORY.md) distinguishes historical decisions from current state.

## Persistent product requirements

TOADAL FEAST is the visitor-facing franchise. TOADAL GAMES is the subordinate studio identity. The website is a dense, playful food-fantasy portal: browser play, the world and characters, stories/media, guest progression, news, and conversion to the full flagship mobile app.

The approved Home combines a visible environment, separate canonical Toadal overlay, Play and App CTAs, immediately discoverable browser games, a compact Feast Pass summary, Characters/World/Stories & Media discovery, App conversion, and truthful future-state cards. Preserve the approved composition while distinguishing implemented capabilities from planned ones.

The bottom-right companion is contextual and non-blocking. Its character artwork/state must respond where approved reaction assets exist; changing dialogue alone is incomplete. Minimize persistence, keyboard/focus/touch support, reduced-motion semantics, and safe areas remain required. See [COMPANION_REACTION_AUTHORITY.md](COMPANION_REACTION_AUTHORITY.md).

Feast Pass is guest-local first, designed for later guest-to-account migration. Its planned treatment in current staging is a delivery deferral, not deletion of the progression requirement. App CTAs need real destinations and genuine approved product imagery. Never fill missing capability with fabricated success paths.

## Recoverable source map

- [Manifest compliance ledger](MANIFEST_COMPLIANCE_LEDGER_2026-10-01.md): canonical 30-page + cross-cutting project progress control.
- [Manifest-first execution matrix](MANIFEST_EXECUTION_MATRIX_2026-10-01.md): priority order based on original-product impact and reusable resources.
- [Project source map / authority firewall](PROJECT_SOURCE_MAP_2026-10-01.md): active worktrees, historical donors, and external-system roles.
- [Feature salvage audit](FEATURE_SALVAGE_AUDIT_2026-10-01.md): KEEP / IMPROVE / MERGE / RETIRE decisions for older living-site behavior.
- [Source and asset inventory](../../manifests/web-authority-inventory.json): provenance, approval, status, hashes, and exclusions.
- [Visual authority](VISUAL_AUTHORITY.md): approved reference scope and identity rules.
- [Page requirements](PAGE_REQUIREMENTS.md): all 30 planned page families and current navigation reconciliation.
- [Asset authority](ASSET_AUTHORITY.md): canonical runtime paths, package provenance, publication boundaries.
- [Current staging gaps](STAGING_AUTHORITY_GAP_REPORT.md): assessment of the verified staging SHA, not an overall product acceptance.
- Existing contracts under `docs/design/`, `docs/content/`, and `docs/implementation/` remain in their original paths. Their historical phase labels do not override this index.

## Change discipline

Before work begins, identify the product requirement, its evidence, and the current staging gap. Record donor/reference material as such. Acceptance must cover the requested behavior, not merely the presence of a route, button, dialogue, or asset. A future implementation should continue from the accepted visual staging lineage and carry these records forward; do not merge an archival snapshot into staging as a replacement website.
