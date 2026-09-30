# CP9 Browser-Game Art Provenance Audit

Date: 2026-09-30  
Scope: visual donor review only. This does not change public feature state.

CP9 maps Home/Play cards through `src/data/web-games.json`. The donor is useful, but its card art is not automatically canonical product evidence.

| Game | CP9 art key | Donor file | Visual finding | Recommendation |
|---|---|---|---|---|
| Wicked Bites | native-feast-card | `src/assets/raw/native-feast-card.webp` | Polished Feast-world scene with a green crowned frog; not canonical golden Toadal | Treat as game-specific/legacy marketing art only until Wicked Bites source authority confirms it |
| CLAW: Feed Gulper | froggy-feast-guide | `src/assets/raw/froggy-feast-guide.webp` | Shows Toadal reading a map, not Gulper or claw gameplay | Do **not** reuse as CLAW evidence; current canonical Gulper treatment is more truthful |
| Lily Pad Leap | lily-pad-leap | `src/assets/raw/lily-pad-leap.webp` | Purpose-built lily-pad/platform scene with green frog | Useful game-specific candidate art; verify against Lily Pad Leap source before promotion |
| Froggie Fruity Bash | genie-fruity | `src/assets/raw/genie-fruity.webp` | Fruity Genie card with baked-in title/copy | Use only if source/canon approved; not ideal as responsive UI art because text is baked in |
| Feast Defense | guide-discover | `src/assets/raw/guide-discover.png` | Canonical-style golden Toadal with map; no defense gameplay | Good helper/World art, weak game-evidence art |
| TOADAL FEAST Arcade | toadal-arcade | `src/assets/raw/toadal-arcade.png` | Small transparent golden Toadal figure, no gameplay | Character accent only; prefer real Arcade evidence for a playable/candidate card |
## Practical rule

CP9 should be salvaged for **architecture, interaction, route behavior, qualification evidence, and composition**.

For card art:
1. real game screenshot / qualified cartridge capture;
2. source-authority promotional art for that exact game;
3. canonical character/environment art clearly labeled as illustrative;
4. generic placeholder only when the feature state is visibly Preview/Planned.

Do not let visually attractive donor art imply a character identity, gameplay scene, or public capability that it does not actually prove.

## Immediate WO-001 implication

The current Home's CLAW card using canonical Gulper is safer than copying CP9's map-reading Toadal image.

The current generic environment art for other Preview cards is acceptable as temporary truthful presentation, but final polish should replace generic repeats with source-qualified game art when available.

This is a case where **selective salvage is better than wholesale salvage**.
