# Required TOADAL game card before website cartridgeification
**Owner design decision: 2026-10-10** · **Status: proposed release gate, staged for review**

## Rule
**NO OWNER-APPROVED GAME CARD → NO CARTRIDGE COMPLETION → NO WEBSITE PUBLICATION.**
Applies to every new or materially repackaged website game; existing untouched historical previews require separate gap tracking, not silent requalification. An image or a manifest alone is not launch authorization.

## Approved Lily Pad Leap card
The owner supplied the game card on 2026-10-10. Preserve the exact composition, including Lily Pad Leap lettering, slogan, full jumping mint character, collectible lights, pads and portal. The image is a **game-card illustration**, NOT a claimed screenshot from the running game.
- Canonical original: `image(20261010-100132).png`; **1672 × 941**, opaque PNG, SHA-256 `526e7ece1f73519113eb1076c4f43c67f661d4f4fd6062415bef0b3a63d57e2e`.
- Derived root poster for the website: `poster.webp`; **1672 × 941**, no crop, WebP Q97, 202,638 bytes, SHA-256 `1a87f3678c505e604623a1bb5d24167d0838e260b1d389585b3007c16058e6ea`.
- Approval scope is **artwork/card only**; publication, rights, real-device QA, site-player QA and trusted TCS/Publisher clearance are separate.

## Enforced packaging contract (CARD-01 through CARD-03)
New player ZIPs must contain root `index.html`, applicable `toadal-bridge.js`, `cartridge.json`, `poster.webp`, `card-authority.json` and an operator README. `cartridge.json` keeps **website `schemaVersion: 1`** and exact `"poster": "poster.webp"`. The authority record must bind approved original PNG SHA-256, optimized poster SHA-256 and decoded sizes, game ID, display name, meaningful alt text, approval scope and release gate status.

Required poster is near 16:9, >=1280 × 720, normally <=1.5 MB, no character/title crop or distortion. No placeholder SVGs, stock-art stand-ins, generated identity substitutions or developer screenshots falsely labeled as gameplay. Retain the original source art in the separate editable asset archive; do not needlessly embed its 2.5MB PNG in the player.

The card-gate checker under `tools/verify-required-game-card.mjs` checks image existence/type/hash/dimensions, manifest link, original identity declaration, card approval, and accessibility metadata. **Its PASS certifies asset completeness only.** It is not a TCS admission pass, trusted publication signature or rights attestation.

Every changed poster/manifest/cartridge file changes immutable artifact identity. Seal a new version, archive digest and member ledger. Do not overwrite earlier release candidates.

## Website authoring / visual requirements (CARD-04)
Use the owner-authoring lane as source, rather than editing generated `dist` by hand. Apply the same approved card identity across Home, Play/Games catalog, game detail, loading/preview and share/social image when applicable; keep source assets and links editable in Studio. The **whole game tile is one accessible link**; do not overlay a separate button on artwork. Use `object-fit:contain` and preserve the lettering and full bodies at 320px, 390px, tablet and desktop widths. Render fallback space rather than unapproved substitute artwork. Resolve actual website base paths, not only root `/`. A preview must never masquerade as a live playable, reward-authoritative or remote PvP release.

## Ordered acceptance gates (CARD-05/06)
1. **ART REGISTERED** — owner approves exact source image by hash. Missing source/approval → BLOCK.
2. **CARD VERIFIED** — root poster, authority metadata, alt, dimensions, no-crop and manifest digest checks pass. Missing/mismatched → BLOCK cartridge build.
3. **GAME VERIFIED** — preserve runtime, controls, saves and developer/production separation. Run exact candidate regression and developer-only F8 QA. Player must exclude F8/balancing overlays.
4. **WEBSITE STAGED** — actual route works, full-tile navigation and approved card render across breakpoints; host iframe `toadal.game.v1` handshake and pause/mute/visibility/score limitations verified; ordinary browser scores are untrusted.
5. **APPROVALS VERIFIED** — owner approval of gameplay/site, real devices, image use rights, and authorized TCS/Publisher qualification where required. Website manifest is *distinct* from TCS-1 schema `1.0.0`; do not conflate them or self-report trusted PASS.
6. **DEPLOYED & OBSERVED** — only with explicit publication authority; monitor real route, image, cache, errors, conversion path and rollback.

## Current disposition
Prior Lily Pad Leap four-file preview ZIP did **not** include the image. The separately prepared **six-file card-compliant PREVIEW** adds `poster.webp` and `card-authority.json`, links `cartridge.json.poster`, and keeps original gameplay HTML + bridge byte-identical. Its next preview identity is `5.6.0-website-preview.2`. Card gate passes 9 tests locally. **No website staging insertion, live publish or trusted TCS approval is implied.** The original v5.6.0 recovered source remains frozen.

## CI adoption to finish
Before enabling this for promotion, install the checker in the website cartridge build/PR job for *new or changed* game candidates, run host QA, and preserve independent trusted release gates. Do not blanket-fail untouched historical previews. This documentation branch is non-deploying until reviewed and explicitly merged into an authorized publishing workflow.
