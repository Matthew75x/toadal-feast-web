# Visual asset authority + real gameplay convergence

**Baseline:** `40e4437c00951d9b9903c3a188d32f54d5a49ef3`

**Branch:** `work/visual-asset-gameplay-convergence-20261001`
**Status:** `PASS` for this local owner-preview candidate. No push, GitHub Pages deployment, production, or domain change was made.

## Environment and Studio certification

- Node: `v22.23.2`; npm: `10.9.8`.
- Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Studio/package/plugin: `toadal-studio` `1.4.2` (all three manifests report `1.4.2`).
- `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-preview-20261001\studio-project\toadal-feast-website\project.json`.
- Studio bridge sequence: workspace + Home/App/Wicked Bites inspect completed; validation `valid=true`, `errors=0`, `warnings=0`; render PASS (130 files, 41,907,740 bytes); static export PASS (39,677,991 bytes, SHA-256 `cf15c47ac88aee10dd32a63731d899cc5066281fa07baa25d5e1ea4d27d3c871`); verify checkpoint PASS (`ok=true`, validation `ok=true`). The complete bridge evidence is [studio-flow.json](studio-flow.json).
- Studio `ai:doctor`: PASS, `ok=true`, 26/26 checks, including tools/resources/prompts, validation call, stdio/http processes, origin protection, and rate limit.
- The deterministic Studio `npm run render` produced the final 130-file static site directly into `dist/`; `/toadal-feast-web/` base-path and staging robots were applied afterward. No manual HTML/CSS patch was made in `dist/`.

## Visual authority and gameplay evidence

The canonical neutral website Gully is the owner-approved happy-standing identity, not a gameplay pose:

- Source archive: `TOADAL_WEBSITE_INTERACTIVE_ASSET_AUTHORITY_20261001.zip`, SHA-256 `605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb`.
- Source member: `characters/gully/gully-happy-canonical.png`, 319×319 RGBA, SHA-256 `5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388`.
- Website derivative: `studio-project/toadal-feast-website/reference/assets/images/characters/gully.webp`, 320×320, 11,604 bytes, SHA-256 `f9009fbe628b912518347a9bfb1f5cf5c817e10bb1168bc73d8121cbdd4c6612`.
- The neutral derivative remains referenced from Home, Characters, World, Media, and the shared character registry. Asset authority covers 81/81 registered visual files.
- **Known owner-review visual:** the source PNG contains an opaque near-black rectangular backdrop behind Gully; the rectangle is already in the supplied canonical art, not introduced by the WebP conversion or page styling. It was not inpainted or otherwise altered. The owner may decide whether to supply a different approved source.
- The focused Gully/gameplay verifier passed and confirms the Wicked Bites HTML, bridge, cartridge manifest, and generated `dist/public/games/wicked-bites/` bytes match baseline `40e4437` (Git clean-filtered blob identities are unchanged). No gameplay source/result handler was modified.

The owner-supplied mobile QA archive (`TOADAL_FEAST_OWNER_VISUAL_QA_2026-09-27.zip`, 125,677,077 bytes, SHA-256 `fb614e1f5293b226d38b47265b88f3ae65d775158ab2c3d85f62ad739f427482`) is not copied into the repository. Five individually hash-verified quality-86 WebP derivatives total 372,202 bytes; [capture-assets.json](capture-assets.json) and [capture-assets.md](capture-assets.md) preserve source/derivative hashes, dimensions, encoder versions, commands, and caveats.

- Home and App lead with real owner-supplied Arcade active-play imagery; the first-run control hint and QA-tools badge stay visible and are described. These are labeled mobile-app captures, not website gameplay.
- App mode-menu, Puzzle level-selection/result, and Feastfall entry captures remain identified as mobile-app screens.
- Wicked Bites detail continues to use the previously qualified v5.5 gameplay capture and remains an isolated PREVIEW. Store destinations remain disabled/unconfigured. Golden Block art remains Puzzle concept art; Fruity Bash remains Candy Shooter concept art; CLAW remains held; no game was made runnable.
- Final visual inspection led only to bounded CSS refinements: the desktop Play-directory link is no longer cramped, Home’s app-capture caption has readable contrast over its background, and the App phone-capture caption clears the floating companion at phone width. The original approved Home visual direction and companion behavior were preserved.

## Studio graph references

Studio reports four identical dangling graph edges: `component.home.games --uses-game--> game.card`. These are generic component-type references emitted once for each Home game card, not unresolved game IDs. The four corresponding Home card bindings are `game.wicked-bites`, `game.toadal-tower-defense`, `game.froggy-fruity-bash`, and `game.claw-feed-gulper`; each ID resolves in `studio-project/toadal-feast-website/games/index.json`. Studio validation still reports zero errors and zero warnings. No Studio source or graph test was changed to suppress the diagnostic.

## Test and browser results

- Required integrated Node suite: **48/48 PASS** (owner-preview gate step `integrated-node-48`).
- Owner-preview gate: **16/16 PASS**. Home visual contract, navigation truth, character registry, gated ecosystem, manifest, Search/Discovery, non-Home truth, visual-asset authority, non-Home layout closure, cartridge isolation, render freshness, Pages base path, static links, staging robots, and browser matrix all passed.
- Full owner-preview browser matrix: **77/77 PASS across 30 routes**, zero failed cases and zero reported issue counts. Evidence: [browser-matrix.json](owner-preview-gate/browser-matrix.json).
- Interactive Discovery browser QA: **49/49 PASS**. Real mobile touch/keyboard actions, UTC check-in, chest opening, local-state persistence, Golden Block, companion-state isolation, and same-origin portal/history behavior passed with no browser request/console/runtime errors.
- Canonical Gully/gameplay authority test: **1/1 PASS**.
- Pages base-path check: PASS (31 HTML files); static-link check: PASS; staging robots check: PASS.
- The matrix records a non-failing diagnostic of generic companion/control overlap in three viewport cases (10 entries): Home tablet’s “Public games” filter and Toadal-profile Personality/History anchors. These are not primary-CTA failures, and the gate’s issue count is zero, but the fixed companion can visually intersect them; it remains draggable/minimizable. This diagnostic is retained for owner review rather than hidden.

Fresh screenshots and geometry evidence are in [browser-closure](browser-closure/), including [Home desktop](browser-closure/home-1440x900.png), [Home mobile](browser-closure/home-390x844.png), [Home App section](browser-closure/home-app-arcade-1440x900.png), [Play mobile](browser-closure/play-320x800.png), [App phone capture](browser-closure/app-arcade-phone-390x844.png), [Toadal profile mobile](browser-closure/toadal-profile-390x844.png), [Search desktop](browser-closure/search-1440x900.png), [Search mobile](browser-closure/search-390x844.png), [Contact mobile](browser-closure/contact-390x844.png), and the Gully captures for [Characters](browser-closure/characters-gully-1366x768.png), [World](browser-closure/world-gully-1366x768.png), and [Media](browser-closure/media-gully-1366x768.png). Interaction screenshots and run summary are in [interactive-discovery](interactive-discovery/).

## Reproduction

```powershell
python scripts/prepare_capture_assets.py
node scripts/apply-visual-asset-gameplay-convergence.mjs .
node scripts/verify-canonical-gully-gameplay-authority.mjs .
node scripts/verify-visual-asset-authority.mjs .
```

The Studio bridge runner and exact manifest/root are recorded in `studio-flow.json`. Generated Studio `build/` and AI checkpoint/history state remain outside the commit; they are ignored local build state. This is a local owner-preview result only and does not authorize deployment or production.
