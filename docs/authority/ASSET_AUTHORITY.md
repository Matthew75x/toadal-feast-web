# Asset authority and provenance

This record distinguishes an asset's presence, its approved use, and actual runtime integration. It is not a blanket acceptance of imagery or product features.

## Approved website references

- The original approved Home is already preserved at `docs/review/WO-002/evidence/approved-home-visual-authority.png` with SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`. Its direction companion is `approved-home-direction-batch1.png`, SHA-256 `747ec321b5a4aa153e4b674ba119cda22b43438b0f4af450b7a54082e50377ac`. The recovered package's Home image is not substituted for either.
- Exact source pages 02–10 from the handoff's `BATCH_1_APPROVED_DIRECTION` are at `assets/reference/mockups/batch-1/`. These images preserve the batch's layout/design direction only, as cross-referenced by `docs/design/VISUAL_AUTHORITY_LEDGER.md`; they do not approve unimplemented features, generated identities, text, or fake product evidence.
- The two 30-page/10-flow contact sheets are at `assets/reference/mockups/mixed-concepts/`. Their contents mix approved direction with concept/reference pages. Neither contact sheet nor every page shown is asserted to be individually approved.

## Restored production-ready-only pack

The owner's restored `TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip` is SHA-256 `06275f4803c8c63e141c34dbcf252bb9c9ab0c35edae460c7c940fd2f687a76a`, 99,780,639 bytes. Its duplicate `(1)` archive has the same size and hash. The complete verified 71-image ZIP is remotely preserved on `archive/production-ready-asset-pack-20261001@5820653d1e74f2b1ff6cb7f9f0c3adc02f9305ba`; it is not merged into staging or production. The repository now preserves 25 exact selected full-resolution source images across the original four v1 sources and 21 Master V2 selected sources, while the rest of the 71-image production-ready library remains hash-inventoried rather than bulk-duplicated. That curated subset archive itself lacks a README and per-file approval manifest. The later re-supplied Master V2 resolves the classification question by placing the matched entries in its explicit production-ready full-size library; see the Master V2 recovery section below.

The four images below were originally selected as contextual candidates and registered in the Studio asset catalog with source-entry hashes. They are now runtime-bound and browser-verified, and their source entries independently match the re-supplied Master V2 production-ready library.

| Context candidate | Project asset | Source-entry SHA-256 | Boundary |
|---|---|---|---|
| World/map discovery | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-adventure-map-guide.png` | `e3340631b8be301952bfad18c4aa02e73845c6cf3777b36510a3c14f48f8dc2e` | Illustration only, not a canonical published map. |
| Support/help | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-support-headset.png` | `ffed40339cd16b938686f0c4f911561b9cbb318b367ce676dc0f40ed84a1a6c2` | Does not create a support service/contact destination. |
| App/mobile | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-mobile-app.png` | `70d793feb54ece0f1604fa48771abf28d4d64923d8e410b3a9daea0b4b0bdf194` | Illustration, not a genuine app screenshot or store evidence. |
| Stories/media discovery | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-thinking-seated.png` | `700cde7cd4b28c1704430ef0e387cb4cdd5f8388b977527a13c8f939786285e1` | Does not imply published editorial content. |

Exact source-entry paths, file byte counts, package SHA, contexts and non-selection rationale are recorded in [`manifests/companion-runtime-assets.json`](../../manifests/companion-runtime-assets.json) and verified by [`scripts/build-web-authority-inventory.mjs`](../../scripts/build-web-authority-inventory.mjs). That sentence described the pre-runtime consolidation baseline. `staging/live-visual@270940dee30b7aafb70af941c520c6d4d223e288` subsequently bound and browser-verified World, Support, App and Stories/Media artwork changes. The Master V2 recovery now supplies per-file classification and additional preferred production sources; see `OWNER_ASSET_RECOVERY_2026-10-01.md` and the v2 runtime manifests.

Earlier consolidation deliberately withheld the treasure-chest and construction poses. That remains correct for generic use: rewards art must not imply a live economy, and construction art must not become a universal unavailable placeholder. The owner's re-supplied Master V2 and direct quality confirmation now qualify the construction worker for genuine maintenance/under-construction/`What's Next` contexts only. Reward artwork remains limited to actual earned-reward events.

## Publication and package limits

The source packages are preserved by hashes and selected safe entries. Original ZIP files above GitHub's 100 MiB per-file limit are not added; extracted source documents and explicitly selected references remain auditable. The Arcade WO-003 closure bundle also exceeds that limit and remains local while its actual source branch/evidence is preserved in a named GitHub branch. See [`manifests/web-authority-sources.json`](../../manifests/web-authority-sources.json) and [`manifests/local-work-preservation.json`](../../manifests/local-work-preservation.json).

## Owner Master V2 recovery — 2026-10-01

The owner re-supplied `TOADAL_ASSET_LIBRARY_MASTER_V2_COMPLETE.zip`, SHA-256 `a38cdfaa57a801e198fff716029b8cd71e8a0096695d4989edffe078177ec8ea`, 212,344,954 bytes. Its internal library metadata resolves the earlier per-file-approval ambiguity: 71 full-size assets are explicitly separated into the production-ready folder, while sprite/composite references, user references, alternates/drafts and needs-regeneration material are segregated.

The re-supplied interactive mascot handoff is SHA-256 `0361a993c9ec2f905adba1b9df66a1c16e7a3a66ad26232351914201ce38681a` and defines 35 semantic interaction states. The labeled food library is SHA-256 `7581092a3d8ead33f9f658fb25887725b93169dddc082b6416da714da5abac7d`.

Exact classification, direct owner quality references, runtime derivative hashes and state eligibility are recorded in `OWNER_ASSET_RECOVERY_2026-10-01.md`, `manifests/owner-asset-recovery-v2.json` and `manifests/companion-runtime-v2.json`. The large archives remain local because the Master and mascot handoff exceed GitHub's normal 100 MiB per-file limit.
