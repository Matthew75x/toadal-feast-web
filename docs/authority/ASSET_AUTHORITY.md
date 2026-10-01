# Asset authority and provenance

This record distinguishes an asset's presence, its approved use, and actual runtime integration. It is not a blanket acceptance of imagery or product features.

## Approved website references

- The original approved Home is already preserved at `docs/review/WO-002/evidence/approved-home-visual-authority.png` with SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`. Its direction companion is `approved-home-direction-batch1.png`, SHA-256 `747ec321b5a4aa153e4b674ba119cda22b43438b0f4af450b7a54082e50377ac`. The recovered package's Home image is not substituted for either.
- Exact source pages 02–10 from the handoff's `BATCH_1_APPROVED_DIRECTION` are at `assets/reference/mockups/batch-1/`. These images preserve the batch's layout/design direction only, as cross-referenced by `docs/design/VISUAL_AUTHORITY_LEDGER.md`; they do not approve unimplemented features, generated identities, text, or fake product evidence.
- The two 30-page/10-flow contact sheets are at `assets/reference/mockups/mixed-concepts/`. Their contents mix approved direction with concept/reference pages. Neither contact sheet nor every page shown is asserted to be individually approved.

## Restored production-ready-only pack

The owner's restored `TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip` is SHA-256 `06275f4803c8c63e141c34dbcf252bb9c9ab0c35ede460c7c940fd2f687a76a`, 99,780,639 bytes. Its duplicate `(1)` archive has the same size and hash. The original ZIP remains local; the repository holds only four exact, selected images, not the 71-image package. The archive lacks a README, per-file approval manifest, license/provenance record, and animation map. Individual approval is therefore not independently established by the pack.

The four images below were selected as contextual candidates and registered in the Studio asset catalog with source-entry hashes. Catalog registration makes the bytes accessible to the project; it does not bind them to the companion behavior or mark artwork reactions complete.

| Context candidate | Project asset | Source-entry SHA-256 | Boundary |
|---|---|---|---|
| World/map discovery | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-adventure-map-guide.png` | `e3340631b8be301952bfad18c4aa02e73845c6cf3777b36510a3c14f48f8dc2e` | Illustration only, not a canonical published map. |
| Support/help | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-support-headset.png` | `ffed40339cd16b938686f0c4f911561b9cbb318b367ce676dc0f40ed84a1a6c2` | Does not create a support service/contact destination. |
| App/mobile | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-mobile-app.png` | `70d793feb54ece0f1604fa48771abf28d4d64923d8e410b3a9daea0b4b0bdf194` | Illustration, not a genuine app screenshot or store evidence. |
| Stories/media discovery | `studio-project/toadal-feast-website/reference/assets/images/characters/companion/production-pack-v2/toadal-thinking-seated.png` | `700cde7cd4b28c1704430ef0e387cb4cdd5f8388b977527a13c8f939786285e1` | Does not imply published editorial content. |

Exact source-entry paths, file byte counts, package SHA, contexts and non-selection rationale are recorded in [`manifests/companion-runtime-assets.json`](../../manifests/companion-runtime-assets.json) and verified by [`scripts/build-web-authority-inventory.mjs`](../../scripts/build-web-authority-inventory.mjs). The current staging source still uses one static victory image; reaction artwork remains `MISSING` until actual image changes are bound to contexts and observed in runtime.

Two deliberately unselected files are identified in the companion manifest: a treasure-chest pose could overstate current rewards/economy, and an under-construction avatar is specific to maintenance rather than generic coming-soon states.

## Publication and package limits

The source packages are preserved by hashes and selected safe entries. Original ZIP files above GitHub's 100 MiB per-file limit are not added; extracted source documents and explicitly selected references remain auditable. The Arcade WO-003 closure bundle also exceeds that limit and remains local while its actual source branch/evidence is preserved in a named GitHub branch. See [`manifests/web-authority-sources.json`](../../manifests/web-authority-sources.json) and [`manifests/local-work-preservation.json`](../../manifests/local-work-preservation.json).
