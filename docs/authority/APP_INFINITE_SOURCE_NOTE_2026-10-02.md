# TOADAL FEAST — App Infinite Mode Source Note

**Date:** 2026-10-02  
**Purpose:** close manifest row 18 factually without inventing copy or generating art.

## Canonical product facts

Source:
`Matthew75x/Toadal-Feast-Development`

Current canonical mode name:
**Infinite Feasts**

Canonical standalone tagline from `infinite-standalone.html`:

> Food is overrunning the land. Assign friends, reclaim plots, and expand carefully.

Current runtime confirms Infinite Feasts is a colony/territory mode involving:
- recruiting/assigning frog helpers;
- reclaiming pressured plots;
- exploring/expanding territory;
- buildings/stations;
- mode-local Colony Coins.

`src/runtime/modes/infinite/infinite-ui.js` explicitly states Infinite uses local Colony Coins for recruitment skips, stations, exploration and territory purchases rather than spending shared ProgressionManager currency.

Do not invent additional marketing claims beyond current game authority.

## Existing canonical/donor art in game repository

Potential asset donors:
- `assets/themes/froggy-feast/ui-raster-authority/runtime-256/mode-infinite.png`
- `assets/themes/froggy-feast/ui-v2/modes/infinite-feast.webp`
- `assets/themes/froggy-feast/world-candies-v1/infinite-loop.png`

Additional Infinite world assets exist under:
- `assets/infinite/biomes/`
- `assets/infinite/buildings/`
- `assets/infinite/frogs/`
- `assets/themes/froggy-feast/infinite/`

These are game-source donors, not automatically approved website assets.

Before copying:
1. verify current asset/provenance policy;
2. import only the minimal required derivative;
3. register it in the website asset catalog;
4. preserve source/ref/provenance;
5. optimize for web;
6. do not copy an entire game asset directory.

## Website assets already present

The current website catalog has no asset tagged specifically `infinite`.

However it already contains:
- `asset.app.capture.app.mode.menu`

If that real owner-supplied mobile mode-menu capture visibly includes Infinite, it can support the factual existence of the fourth mode without importing new game art.

## Recommended V1 App treatment

Add a fourth mode card:

**Infinite Feasts**

Safe short description:
“Assign helpers, reclaim plots, and expand the Feast as the food pressure grows.”

This is a concise paraphrase of the canonical mode source.

If no approved Infinite gameplay screenshot is available:
- do not fabricate one;
- use canonical imported mode art/icon after provenance check, or
- use text/icon presentation plus the real app mode-menu capture.

The App page must still distinguish:
- real gameplay captures for Arcade/Puzzle/Feastfall;
- mode art/icon or menu evidence for Infinite if no standalone screenshot is available.

Do not label mode art as a gameplay screenshot.
