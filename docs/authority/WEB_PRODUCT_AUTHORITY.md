# TOADAL FEAST website product authority

Consolidated 2026-10-01. Repository: `Matthew75x/toadal-feast-web`.

## Binding hierarchy

1. OWNER-APPROVED PRODUCT/CREATIVE REQUIREMENTS
2. AUTHORITY MANIFESTS / APPROVED ASSETS / MOCKUPS
3. IMPLEMENTATION WORK ORDERS
4. STAGING IMPLEMENTATION

A work order cannot silently redefine, delete, or mark complete an owner-approved requirement. Newer timestamps do not establish higher authority. A conflict requires an explicit owner decision, its source, the exact affected requirement, and an entry in [AUTHORITY_CHANGELOG.md](AUTHORITY_CHANGELOG.md). Until then, preserve the requirement and report the implementation gap.

Mockups approve only the dimensions identified in the visual ledger. Layout approval does not approve generated character identities, fabricated game/app screenshots, sample economy values, invented lore, dates, or working accounts/commerce.

## Current operational authority

- Accepted visual lineage: `staging/live-visual` at verified local and remote SHA `7c17e28135688ace9139918f077a44e3d03d9765`.
- Consolidation branch: `ops/web-authority-consolidation-20261001`, created directly from that SHA.
- Main snapshot at verification: `87050885331770ca3e30db7e463154aebd777512`.
- Public visual staging: <https://matthew75x.github.io/toadal-feast-web/>.
- Studio project: `studio-project/toadal-feast-website/project.json`; certified renderer: TOADAL Studio 1.4.2.
- `staging/live-visual` is the deployment lane. Consolidation and archival branches do not deploy. Production and DNS require a separate explicit owner instruction.

The current owner's staging-restoration and authority-consolidation instructions supersede older operational statements that Pages must deploy `main`, WO-000 is unstarted, or accepted WO-001/002 work remains blocked. They do not supersede product/creative requirements. [Work-order history](../work-orders/PRESERVED_WORK_ORDER_HISTORY.md) distinguishes historical decisions from current state.

## Persistent product requirements

TOADAL FEAST is the visitor-facing franchise. TOADAL GAMES is the subordinate studio identity. The website is a dense, playful food-fantasy portal: browser play, the world and characters, stories/media, guest progression, news, and conversion to the full flagship mobile app.

The approved Home combines a visible environment, separate canonical Toadal overlay, Play and App CTAs, immediately discoverable browser games, a compact Feast Pass summary, Characters/World/Stories & Media discovery, App conversion, and truthful future-state cards. Preserve the approved composition while distinguishing implemented capabilities from planned ones.

The bottom-right companion is contextual and non-blocking. Its character artwork/state must respond where approved reaction assets exist; changing dialogue alone is incomplete. Minimize persistence, keyboard/focus/touch support, reduced-motion semantics, and safe areas remain required. See [COMPANION_REACTION_AUTHORITY.md](COMPANION_REACTION_AUTHORITY.md).

Feast Pass is guest-local first, designed for later guest-to-account migration. Its planned treatment in current staging is a delivery deferral, not deletion of the progression requirement. App CTAs need real destinations and genuine approved product imagery. Never fill missing capability with fabricated success paths.

## Recoverable source map

- [Source and asset inventory](../../manifests/web-authority-inventory.json): provenance, approval, status, hashes, and exclusions.
- [Visual authority](VISUAL_AUTHORITY.md): approved reference scope and identity rules.
- [Page requirements](PAGE_REQUIREMENTS.md): all 30 planned page families and current navigation reconciliation.
- [Asset authority](ASSET_AUTHORITY.md): canonical runtime paths, package provenance, publication boundaries.
- [Current staging gaps](STAGING_AUTHORITY_GAP_REPORT.md): assessment of the verified staging SHA, not an overall product acceptance.
- Existing contracts under `docs/design/`, `docs/content/`, and `docs/implementation/` remain in their original paths. Their historical phase labels do not override this index.

## Change discipline

Before work begins, identify the product requirement, its evidence, and the current staging gap. Record donor/reference material as such. Acceptance must cover the requested behavior, not merely the presence of a route, button, dialogue, or asset. A future implementation should continue from the accepted visual staging lineage and carry these records forward; do not merge an archival snapshot into staging as a replacement website.
