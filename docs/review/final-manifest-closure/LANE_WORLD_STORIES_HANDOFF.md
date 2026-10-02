# World / Characters / Stories Lane Handoff

Date: 2026-10-02
Lane: World / Characters / Stories
Owned route files: `studio-project/toadal-feast-website/pages/*.json`

## Route-local closure

### Row 05 — World

- Reframed the existing approved environment plates as an atlas-style visual index. The copy says clearly that the arrangement is not a canonical geographic map and does not define unpublished locations.
- Kept only the existing Candy Kingdom, candy-land, and forest-portal environment art; no new assets or location lore were added.
- Added an App route CTA and a future-region card marked locked and unpublished, with no invented region name, map placement, or lore.
- Added a local discovery count surface using the existing guest-progression page/stat/status attributes. It reports configured route discoveries and states that looking at an environment plate does not collect a location.

### Row 06 — Characters

- Preserved all seven canonical art previews, the single Toadal profile link, the unpublished relationship/appearance state, and the separate unnamed future-character slot.
- Added explicit filter values and card-group hooks for `all`, `hero`, `genie`, `cast`, and `future`, plus an accessible result-status region for the filter runtime.
- Added a local preview-discovery status surface. Its count represents configured route discoveries; opening a character card is not treated as collecting that character.

### Rows 07–10 — Toadal Profile, Stories, Manga, Reader

- Preserved the Toadal profile structure because it already covers the approved profile sections while keeping unavailable canon unpublished.
- Preserved the Stories/Manga/Reader architecture and empty publication states. The story registry still contains no published series, arcs, chapters, or pages; no covers, chapters, or reader pages were fabricated.

## Shared integration hooks for the integrator

### Runtime — required for Characters filters

Wire the route-local controls in the shared page runtime (or a new route script loaded through the integrator-owned advanced-code collection):

- Scope to `[data-character-filter-controls]` and `[data-character-collection]`.
- On a radio change, show cards whose `data-character-group` matches the selected `data-character-filter` value; `all` shows every card.
- Toggle the native `hidden` state on `[data-character-card]` elements and update `[data-character-filter-status]` with a polite live count.
- Keep all cards visible if the script is unavailable. Do not persist filter state or change the discovery store.

The existing shared CSS already styles the radio controls, cards, responsive grid, and future card. No required CSS change is needed to support this behavior.

### Runtime / progression definitions — required for Characters local progress

The page has `[data-progression-page]`, `[data-progression-stat="discoveries"]`, and `[data-progression-storage-status]` hooks. Current guest-progression loading excludes `/characters/`, and current discovery definitions cover World and Stories previews only. To populate the Characters counter truthfully:

1. Include `/characters/` in the shared guest-progression loader's eligible routes.
2. Add `/characters/` to the known site routes in the progression definitions.
3. Add a route-visit discovery definition such as `characters-hub-preview` / “Visited the Characters preview.” This should count the hub visit only; it should not imply a character profile, appearance, or collectible.

The World route already loads the current progression runtime and uses its existing route-discovery count. No new storage namespace or per-character collection state is requested.

### CSS and registries

- No shared CSS change is required for the route-local layouts; they use existing discovery, fact-card, radio, and character-card styles. The World grid has the optional `world-atlas-map` class if the integrator wants a restrained connector/marker treatment. Any styling must preserve the copy that this is a visual index, not geography.
- No asset registry or content registry change is required. `content/registry.json` has seven canonical character records and no published world/location records. Do not invent location records or character biographies to fill those gaps.
- No story publishing or reader runtime hook is required. Its existing publication projection and progress/bookmark contract remain unchanged.

## Validation performed

- Parsed all six owned page manifests as JSON and checked route links and image paths in the changed World and Characters manifests.
- `node scripts/stories-publishing.test.mjs` — passed (4 tests).
- `node scripts/story-content.test.mjs` — passed (9 tests).
- The combined `node --test ...` runner could not spawn its worker in the managed shell (`spawn EPERM`); running both test entrypoints directly succeeded.
- `dist/**` was not rendered or modified.

The Characters filter behavior and Characters route-discovery count require the shared hooks above before those controls are fully interactive in the integrated site.
