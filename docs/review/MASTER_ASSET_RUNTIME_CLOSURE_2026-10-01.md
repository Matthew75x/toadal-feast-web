# Master V2 mascot/runtime closure — 2026-10-01

Base staging: `270940dee30b7aafb70af941c520c6d4d223e288`

Integration branch: `integration/master-asset-authority-20261001`

## Recovered source authority

- Master V2: SHA-256 `a38cdfaa57a801e198fff716029b8cd71e8a0096695d4989edffe078177ec8ea`, 212,344,954 bytes.
- Interactive mascot handoff: SHA-256 `0361a993c9ec2f905adba1b9df66a1c16e7a3a66ad26232351914201ce38681a`, 157,708,471 bytes.
- Labeled food library: SHA-256 `7581092a3d8ead33f9f658fb25887725b93169dddc082b6416da714da5abac7d`, 82,539,537 bytes.
- Curated production-only subset: SHA-256 `06275f4803c8c63e141c34dbcf252bb9c9ab0c35edae460c7c940fd2f687a76a`, 99,780,639 bytes.

Master V2 separates 71 production-ready full-size assets from references, composites, alternates/drafts and needs-regeneration material. The repository preserves selected exact production sources plus optimized runtime derivatives rather than bulk-committing the complete 212 MB archive.

## Runtime integration

The existing live bindings for World, Support, App and Stories/Media are preserved.

Master V2 adds real semantic artwork behavior for current website contexts:
- News/Blog → writing/devlog Toadal.
- Search → magnifier Toadal.
- Support Contact/Mail → mail-carrier Toadal.
- Genuine Home What's Next / maintenance context → construction-worker Toadal.

Production-qualified semantic states are also prepared for real future controls: Settings, mute, notifications, privacy, account/register/delete, ratings, survey, positive/negative feedback, AI disclosure, partnership, community, merch, download and earned rewards.

Feast Pass intentionally keeps the canonical fallback unless an actual reward event exists. Maintenance art is not a generic unavailable-state illustration.

## Evidence

Local browser assertions passed for Home default, six nav destinations, Search, What's Next, World, Stories, Media, App, Support, News, Feast Pass fallback, Play fallback, Support Contact and semantic Settings/notifications/mute/privacy/account controls.

Result: 0 failed assertions, 0 console errors, 0 relevant failed requests.

At 390×844, the maintenance pose remained inside the viewport with 12 px right/bottom clearance. Proof screenshots and `runtime-result.json` live under `docs/review/master-asset-runtime-proofs/`.

Repository checks:
- Pages base path: PASS.
- Navigation truth: PASS, 0 unresolved targets.
- Cartridge storage isolation: PASS.
- Home visual contract: 29/29 PASS.
- WO-001 Home static verification: 55 checks PASS.
- Standalone `dist/public/games/` cartridge diff versus staging base: none.
- Source PNG/runtime WebP hash verification: 21/21 PASS.

## Preservation

The 21 newly selected full-resolution Master V2 source PNGs are preserved under `reference/assets/images/characters/companion/master-v2-selected/`. Their optimized WebP derivatives are under `runtime-v2/`, with exact archive-entry provenance and hashes in the v2 manifests.

The direct owner Support image supplied during review remains a quality reference, not silently substituted for a different Master asset. Its SHA-256 is `3df2eae5988906f9888356de2e3be201627a140fa01157ad423318d7474ac4e8`.
