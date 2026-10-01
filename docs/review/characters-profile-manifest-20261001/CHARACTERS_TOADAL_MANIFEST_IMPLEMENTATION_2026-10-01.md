# Characters Hub + Toadal Profile manifest candidate — 2026-10-01

**Manifest rows:** #6 Characters Hub, #7 Toadal Character Profile

**Base:** `work/home-manifest-lock-visual-20261001@d4219fb9a7e8598512e142da4acafeb06225f293`

**Branch:** `work/characters-toadal-manifest-20261001`

## Authority

Layout references:

- `assets/reference/mockups/batch-1/06_CHARACTERS_HUB.png`
- `assets/reference/mockups/batch-1/07_TOADAL_PROFILE.png`

The implementation follows their layout/product structure, not their sample lore. `docs/work-orders/WO-003-world-characters.md` explicitly requires canonical content records and says generated mockup lore/character descriptions are not canon.

## What was implemented

### #6 Characters Hub

- Dedicated `/characters/` route.
- Structured registry with seven currently approved character-art records.
- Canonical Toadal, Princess Lily, Sweet Genie, Fruity Genie, Savoury Genie, Gulper and Gully art.
- CSS-only accessible filters for All / Hero / Genies / Other cast / Coming soon.
- Future-character slot clearly separated and deliberately unnamed.
- Relationship panel that refuses to invent mockup relationships.
- Discovery-progress panel prepared for the parallel guest-progression foundation without displaying fake counts.
- Appearance/discovery links into World, Stories, Media and Play without inventing an appearance graph.
- Direct Toadal profile path.
- Home "Meet the characters" funnel now points to the real Characters route.

### #7 Toadal Profile

- Dedicated `/characters/toadal/` route.
- Canonical Toadal hero treatment using existing approved artwork.
- Ten manifest profile sections: Biography, Personality, History, Abilities, Friends, Locations, Games, Stories, Gallery and Collectibles.
- Published identity facts are intentionally narrow: Toadal, Feast hero, canonical King of Feasts title from the page manifest, golden crown/red scarf.
- Personality/history/relationships are explicitly left unpublished rather than copied from generated mockup text.
- Gameplay mechanics remain separate from universal character canon.
- Gallery uses current canonical Toadal art.
- Collectibles are prepared for guest-local progression but show no fake unlock count.

## Structured content

Added:

`studio-project/toadal-feast-website/content/registry.json`

The registry follows the existing content-registry contract with stable IDs/slugs, publication states and logical asset IDs.

Added verifier:

`scripts/verify-character-content-registry.mjs`

It checks:

- required registry arrays;
- schema version;
- character ID/slug uniqueness;
- publication states;
- canonical asset-ID existence;
- implemented route/export existence;
- Toadal profile route integrity;
- the seven approved character-art records.

The page markup is generated from those records for the character collection. Runtime/player progression state remains separate.

## Visual evidence

Direct approved-reference comparisons:

- `characters-approved-vs-candidate.jpg`
- `toadal-profile-approved-vs-candidate.jpg`

Candidate renders:

- `characters-desktop.webp`
- `characters-mobile.webp`
- `toadal-profile-desktop.webp`
- `toadal-profile-mobile.webp`
- `runtime-result.json`

The candidates intentionally contain less lore/content than the mockups because unsupported sample text was not promoted to canon.

## Browser evidence

- Characters desktop: 1440x900, no horizontal overflow, no broken images.
- Characters mobile: 390x844, no horizontal overflow, no broken images.
- Toadal profile desktop: 1440x900, no horizontal overflow, no broken images.
- Toadal profile mobile: 390x844, no horizontal overflow, no broken images.
- Genie filter: exactly Sweet Genie / Fruity Genie / Savoury Genie remain visible.
- Profile anchor navigation: 10/10 sections.
- Browser console errors: 0.
- HTTP/resource failures: 0.
- Companion remains inside tested desktop/mobile viewports.

## Regression checks

- Character content-registry verifier: PASS.
- Manifest compliance verifier: PASS; 30 rows preserved.
- Candidate page index now exposes 17 route records.
- Authority inventory: PASS after regeneration.
- Pages base-path verifier: PASS.
- Navigation truth: PASS, 0 unresolved targets.
- Home visual contract: 29/29 PASS.
- Home regression verifier: 57 checks PASS.
- Cartridge storage isolation: PASS.
- `dist/public/games/` diff versus Home base: none.
- `git diff --check`: PASS.

## Manifest accounting

The controlling ledger is **not modified on this implementation branch**.

If this candidate is accepted/integrated:

- row #6 should move from `NOT_STARTED` to `PARTIAL`;
- row #7 should move from `NOT_STARTED` to `PARTIAL`.

They should not be marked DONE yet because richer approved relationship/appearance/profile content, discovery-state integration, and full canonical biography/history data remain unavailable.

## Explicit boundaries

No deployment occurred.

This lane did not modify:

- guest-progression runtime;
- Arcade/gameplay behavior;
- standalone browser-game cartridges;
- main;
- live staging;
- production/DNS.
