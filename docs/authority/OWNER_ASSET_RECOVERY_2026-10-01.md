# Owner asset recovery — 2026-10-01

This record closes the ambiguity around the website mascot/source libraries re-supplied by the owner.

## Source packages

- `TOADAL_ASSET_LIBRARY_MASTER_V2_COMPLETE.zip` — SHA-256 `a38cdfaa57a801e198fff716029b8cd71e8a0096695d4989edffe078177ec8ea`, 212,344,954 bytes, 161 archive files. Its internal manifest describes 131 image records: 71 production-ready full-size assets, 19 sprite/composite references, 9 user references, 22 alternates/drafts, 4 needs-regeneration items and 6 library artifacts.
- `TOADAL_WEBSITE_INTERACTIVE_MASCOT_HANDOFF_v1(1).zip` — SHA-256 `0361a993c9ec2f905adba1b9df66a1c16e7a3a66ad26232351914201ce38681a`, 157,708,471 bytes, 92 archive files. Its interaction map defines 35 mascot states.
- `FroggyFeast_Food_Assets_Labeled.zip` — SHA-256 `7581092a3d8ead33f9f658fb25887725b93169dddc082b6416da714da5abac7d`, 82,539,537 bytes, 58 archive files.
- The already-present curated subset `TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip` remains verified at SHA-256 `06275f4803c8c63e141c34dbcf252bb9c9ab0c35edae460c7c940fd2f687a76a`, 99,780,639 bytes.

The large archives remain outside Git because they exceed or approach GitHub's normal file-size limits. Operational provenance is preserved by exact archive hashes, per-entry hashes, source-entry names and web derivatives in the manifests.

## Binding classification rule

1. Explicit owner approval/direct quality callout.
2. Master V2 `01_PRODUCTION_READY_FULL_SIZE` entries marked `PREFERRED`, `PREFERRED_VARIANT` or canonical reference as appropriate.
3. Interactive mascot handoff for semantic role/state intent.
4. Older extended-functional assets only as donor/reference.
5. Sprite sheets/composites and user-reference material are reference-only.
6. Alternates/drafts are not selected by default.
7. `05_NEEDS_REGENERATION` must not be shipped as final art.

A filename existing in an archive is not enough by itself to make it runtime authority.

## Direct owner references from this review

- `Untisstled.png` — 1312×1199 RGBA, SHA-256 `eee948784ce187ba22c7042ffb7c154443c7b2a8eaf9d91339cc806900ce719d`. The owner explicitly identified this construction-worker quality level as appropriate. It is visually equivalent to the Master V2 preferred maintenance-worker artwork, although re-encoded.
- `suppp.png` — 1254×1254 RGBA, SHA-256 `3df2eae5988906f9888356de2e3be201627a140fa01157ad423318d7474ac4e8`. This is an owner-supplied polished Support/Help quality reference. It is not byte-identical to Master V2 Support v02/v03, so it is preserved as a quality reference rather than silently substituted.

## Current runtime policy

The companion remains semantic and non-blocking. It does not chase pointer coordinates. Artwork can change for a route, section or interactive control while dialogue keeps the current-section copy when the hovered control has no dedicated copy.

Current or immediately applicable production states include World, Support, App/mobile, Stories/Media, News/Blog, Search, Contact and genuine Maintenance/What's Next contexts. Settings, mute, notifications, account/register/delete, privacy, ratings, survey, feedback, AI disclosure, partnership, community, merch, download and reward assets are prepared as production candidates and activate only when the corresponding real UI/context exists.

Feast Pass does **not** automatically use reward/treasure artwork while its economy is not live. Maintenance artwork is limited to genuine maintenance/under-construction/What's Next contexts and is not a generic unavailable placeholder.

The complete machine-readable crosswalk and runtime derivative provenance are in `manifests/owner-asset-recovery-v2.json` and `manifests/companion-runtime-v2.json`.
