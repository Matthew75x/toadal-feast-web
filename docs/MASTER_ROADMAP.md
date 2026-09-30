[Reading 141 lines from start (total: 141 lines, 0 remaining)]

# TOADAL FEAST Website — Master Roadmap
**Status:** execution baseline
**Canonical pages:** 30
**Current visual state:** complete structural/layout coverage; identity and product-truth rules control production.

## Phase 0 — Authority and infrastructure
Complete:
- dedicated public website repository
- GitHub Pages staging
- known-good corrected TOADAL Studio 1.4.2 package
- 30-page reference set
- design-system rules
- public-truth rules
- bounded Codex workflow
- WO-000 D-generator environment certification — PASS at `e639cd8ee68c6650aede6a2f04e524bef20a1c08`

## Phase 1 — Global shell + Home
**Status: ACTIVE**
Branch: `work/WO-001-global-shell-home`
Current implementation head: `9195f77b94e6b7e8a7fec972d39889f6ed579d5e`

Deliver:
- global shell
- shared tokens/primitives
- Home route
- responsive base
- Toadal companion frame
- static export
Gate: hosted/visual acceptance before merge.

## Phase 2 — Play family
Pages:
- Play / Games Hub
- Wicked Bites Game Detail
- Browser Game Player

Deliver:
- game registry
- reusable GameCard/GameDetail
- player shell
- cartridge contract
- real product evidence hooks
Gate: no fake gameplay, truthful availability.

## Phase 3 — World + Characters
Pages:
- World Hub
- Characters Hub
- Toadal Profile

Deliver:
- world/location content model
- character relationships
- canonical character asset integration
Gate: generated character identities cannot override canonical art/content.

## Phase 4 — Stories + Comics
Pages:
- Stories Hub
- Manga Series
- Comic Reader

Deliver:
- Series → Arc/Volume → Chapter → Page model
- reader
- bookmarks/resume state
- image derivative manifest
Gate: real comic assets and manifest validation.

## Phase 5 — Feast Pass / progression
Pages:
- Feast Pass
- Quests
- Rewards
- Leaderboards
- Player Profile

Deliver:
- guest-local state
- XP/Sparks/Treats/streak/badges/discoveries
- quests/rewards
- local scores
Gate: online/account-dependent systems remain Preview/Planned until real.

## Phase 6 — Editorial, discovery, app and utility
Pages:
- Media
- News
- Devlog
- App
- Account
- Community
- Store
- Search
- Roadmap
- Support
- Contact
- About
- Coming Soon
- Legal
- 404

Deliver:
- reusable editorial/utility templates
- local search
- real app evidence
- truthful future-state pages

## Phase 7 — Responsive/accessibility/performance closure
Required:
- phone/tablet/desktop
- keyboard/focus
- reduced motion
- safe areas
- error/empty/loading states
- link/content integrity
- asset optimization

## Phase 8 — Release candidate
No feature expansion.
Deliver:
- exact Git SHA
- Studio project backup
- static artifact
- manifest/checksums
- QA report
- rollback artifact
- owner acceptance package

## Phase 9 — Production cutover
Only after explicit owner approval.
Production DNS/current live site remain untouched before this gate.

## Parallel operating rule
The current execution model is intentionally multi-lane:
- Codex handles bounded implementation/certification tasks where its local environment materially helps.
- ChatGPT may implement directly on independent branches when the required source/tool access is available, in addition to reviewing visual/product quality.
- ASSIGNATOR provides independent file, script, source and visual verification.
- no lane may silently broaden another lane's current work order.
- D-generator remains the Studio 1.4.2 certification/render authority until that exact environment is reproduced elsewhere.

[executed on device: ASSIGNATOR (df89eadc-2f4c-40da-b60e-eb480cd977a2)]