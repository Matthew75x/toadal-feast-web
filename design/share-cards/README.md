# TOADAL FEAST sharing-card handoff

This folder consolidates the current work, supplied original source ZIPs, assets, concepts and review evidence on the same branch as PR #30. Share-card composition remains stopped at the owner's explicit request on 2026-10-07; a separate mascot walk-cycle package was added later at the owner's request.

## Current design snapshot

- Original 1200 x 630 card layout, Score to beat, representative gameplay and iPhone-inspired frame are retained.
- Current local concept uses 14 existing native repository food types in 37 fixed placements per card. The strawberry is normalized by its visible alpha bounds to match the surrounding foods.
- Original Froggy is the default. The two supplied crowned-adventurer and burger-feast pictures are selectable mascot choices through the concept's Mascot artwork design control.
- Preview changes are local design work. The existing production service in services/share-cards does not yet implement the new game-specific device, gameplay-capture, dense-food or mascot-selection concepts.
- The card-background concept uses no newly generated background art. The two earlier generated food-background experiments were rejected and remain under explorations/rejected-generated-backgrounds. The separately requested mascot walk-cycle generation is an animation asset, not a card background.

## Entry points

- [Standalone current preview](preview/game-challenge-directions-preview.html) - download and open in a browser. Host design controls require the Codex conversation surface; the default card and variant navigation are standalone.
- [Editable concept fragment](preview/game-challenge-directions.html)
- [Current desktop/narrow inspection images](preview/current-inspection/)
- [Sharing architecture and implementation plan](outputs/SHARE_CARDS_AND_INVITES.md)
- [Gameplay/device design notes](outputs/GAMEPLAY_SHARE_CARD_DESIGN.md)
- [Verified link-preview sizing guidance](outputs/LINK_PREVIEW_SIZING.md)
- [All supplied source ZIPs](source-packs/)
- [Source-pack sizes and hashes](source-pack-index.json)
- [Asset/candidate provenance](assets/decorations/)
- [Supplied mascot originals](assets/mascot-originals/)
- [Mascot walk-cycle animation](assets/animations/toadal-walk-cycle-v1/README.md)
- [Astro/font resources](assets/astro-and-lettering/)

## Preferred packs at the stop point

The three preferred D: packs are all included unchanged, along with the four earlier ZIP attachments. The labeled food pack is byte-identical to the earlier C: copy; the preferred D: file is the archived source.

300 existing food candidates and five static star sheets have been extracted with source-member/hash metadata. These candidates have not received a final semantic/style selection and are not all present in the current card. Some crops are duplicate variants, UI-like objects or white-matted artwork and require review before use. The complete originals preserve every supplied item, including members not selected for candidate extraction.

## Mascot variation contract for the implementation

Use an allowlisted art ID (original, crowned-adventurer, burger-feast), keeping original as the default. A player choice is cosmetic. An optional surprise choice should resolve once when creating a card, and the resolved ID and asset version must remain fixed with that card's immutable public image. Rendering or crawler requests must not re-randomize it. Automatic high-score selection needs explicit game/mode-specific rules; these images do not themselves assert a verified rank or earned reward. The current concept demonstrates manual selection only.

## Review evidence and integrity

Outputs and review logs preserve their original timing/scope. Earlier service validation does not certify later visual concepts or unfinished preferred-asset selections. No new implementation tests, merge, deployment or production configuration change was performed for this archival upload.

upload-manifest.json records every consolidated file's size and SHA256, excluding its own recursive entry. Original images/ZIP bytes are preserved. Snapshot scripts may retain local execution paths. Installed dependency caches, browser profiles and unrelated checkouts are outside this task handoff; the service's dependency declarations are already in the same branch.

## Additional supplied asset library

[TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip](assets/TOADAL_ASSET_LIBRARY_V2_PRODUCTION_READY_ONLY.zip) was added to this same assets folder on 2026-10-07. Its original ZIP bytes are preserved and its size/hash are recorded in source-pack-index.json and upload-manifest.json.

## Additional mascot animation

The owner-requested Toadal walk-cycle package is at [assets/animations/toadal-walk-cycle-v1](assets/animations/toadal-walk-cycle-v1/). It includes the transparent animated WebP, eight extracted PNG frames, the 4×2 source sheet, and a local HTML preview. The still share-link image remains the appropriate Open Graph preview for platforms that do not animate link cards.
