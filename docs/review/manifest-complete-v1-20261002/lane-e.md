# Lane E — World, Characters, Stories

Base: `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43`  
Base tree: `b48efb7b20c72c11acc017a4807bc545aa81f17a`  
Branch: `work/manifest-complete-v1-20261002`

## Row closures

| Row | Action | Closure and remaining dependency |
|---:|---|---|
| 5 — World Hub | INTEGRATE / BUILD THIN | Added an environment atlas using the three existing PREVIEW media records, two unnamed locked location slots, and saved World-visit progress via `world-page-preview`. It explicitly says the atlas art is not a location map. Approved world/location records are still a content dependency. |
| 6 — Characters Hub | KEEP / POLISH | Kept the seven current PREVIEW character records, existing filter controls, and explicit relationship/appearance publication states. Their guest-progression and character-discovery notices remain unchanged. No approved relationship or appearance records exist in the current registry. |
| 7 — Toadal Profile | KEEP / PLACEHOLDER | Kept the structured profile and its verified title/appearance facts. Biography, personality, history, abilities, relationships, locations, story appearances, and collectibles remain explicit awaiting/not-configured states where unsupported. No canon was added. |
| 8 — Stories Hub | KEEP | Kept the current publishing architecture, featured/latest/progress areas, and “Publishing preview · no published stories” sentinel. The registry has no public series, chapters, or pages. |
| 9 — Manga Series | KEEP / PLACEHOLDER | Kept the existing series template, “PREVIEW · NOT PUBLISHED” and “0 published” states, and current continue-reading gate. No chapter or cover was fabricated. |
| 10 — Comic Reader | KEEP / POLISH | Kept the reader, navigation, fullscreen, page controls, and local bookmark architecture. Added World, Characters, and Media links for the no-chapter state. Preserved the “No published chapter selected” sentinel. |

## Changes in this lane

- `studio-project/toadal-feast-website/pages/world.json` — appended the canonical environment atlas and accessible visit-progress display.
- `studio-project/toadal-feast-website/pages/comic-reader.json` — appended related-content links for its empty publication state.
- `studio-project/toadal-feast-website/reference/assets/js/world-discovery.js` — binds to the existing guest progression store and idempotent `route:/world/` event; it returns without changes on routes without the atlas.
- `scripts/world-manifest.test.mjs` — checks rows 5–10, including the preserved status sentinels, registry facts, route-loader contract, and no published story records.

The shared `manifest-shell.js` currently loads `world-discovery.js` on `/world/`, `/characters/`, and `/characters/toadal/` after guest progression is ready. The controller only renders when `[data-world-map]` exists, so the character pages are unaffected. The six existing page `data-*` reader/filter contracts were retained. This lane did not edit the shared loader, progression runtime/definitions, publishing runtime/records, character registry, CSS, navigation, route index, or generated outputs.

## Reuse and donor search

- Current website source: reused `content/registry.json` for the seven PREVIEW characters, three PREVIEW environment-art records, and empty worlds/locations/story collections; reused `progression-definitions.js` and `guest-progression.js` for the World visit discovery; retained `stories-publishing.js` and `story-content.json` unchanged.
- `Matthew75x/Toadal-Feast-Development` `main` and `gh-pages`: checked repository trees with read-only `gh` queries for world/location/lore/story/manga source paths; no relevant public website content records or page templates were found. Existing canonical gameplay art remains represented by the current website’s approved media records.
- `Matthew75x/froggy-locker-publisher-platform` and `Matthew75x/toadal-feast-publisher-stack`: read-only tree checks found no world/story/character publication source applicable to these rows. Their account/publisher infrastructure does not supply canon or published stories.
- Historical content was not imported; no approved location, biography, relationship, appearance, or story records were found that supersede the current website registry.

## Verification

- `node --test scripts/world-manifest.test.mjs scripts/stories-publishing.test.mjs` — 7 passed, 0 failed.
- `git diff --check` — passed for lane edits. It emitted only a line-ending warning on another worker’s concurrently edited `pages/contact.json`.
- Browser rendering/Studio export was not run in this lane; final integrated rendering remains with the integrator.

## Remaining content dependencies

- Approved structured World and Location records are needed before environment previews can become named map destinations or location-specific discoveries.
- Approved character relationship and appearance records are needed before those panels can show links as canon.
- Approved expanded Toadal bio/personality/history/abilities/relationships/location/story/collectible source material is needed to replace the profile’s explicit pending states.
- Approved story-series metadata, cover art, synopsis, creator credit, chapter/page records and page assets are needed before Stories/Manga/Reader can show published content or real reading progress.

## Shared integration hooks

- The integrator should retain the current shared loader route list and load ordering: progression definitions → guest runtime/ready event → `world-discovery.js` on the three discovery/profile routes.
- The actual World map points remain non-interactive environment-art links until approved location records and a location-specific progress definition are supplied. Current local discovery reflects only the existing World page visit.
