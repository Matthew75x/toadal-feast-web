# TOADAL FEAST — Batch‑1 Visual Module → Existing System Map

**Date:** 2026-10-02  
**Purpose:** make approved Batch‑1 visuals implementable by assembly, not reinvention.

Individual approved/reference mockups exist for rows 02–10 under:
`assets/reference/mockups/batch-1/`

Use the mockup for **composition/hierarchy** and use current project/runtime/service systems for **behavior/data**.

## 02 — Play / Games Hub

Approved mockup visually calls for:
- large Feast-world hero;
- game catalog/filter row;
- prominent game cards;
- leaderboard module;
- daily challenges;
- badges/rewards;
- Feast Pass;
- app conversion;
- future games strip.

Existing implementation/donors:
- hero + catalog + filters: current `play.json`
- game records: current Studio game registry
- actual browser packages/status: current cartridge manifests
- leaderboard: TOADAL local score model + website adapter + Froggy future seam
- challenges: current guest quest engine
- badges/rewards: current guest progression + R2 donor presentation
- Feast Pass: current guest progression
- app conversion: current App route/assets
- future games: current PREVIEW/PLANNED game states

**Conclusion:** approved Play direction is an integration dashboard over systems already present. Do not invent a new games portal architecture.

## 03 — Wicked Bites Detail

Approved mockup calls for:
- strong game art/identity;
- Play CTA;
- screenshots/trailer area;
- mechanics/how-to;
- challenges;
- characters;
- leaderboard;
- achievements/rewards;
- related games.

Existing:
- current Wicked detail route and truthful PREVIEW launch
- real Wicked Bites cartridge and qualified preview
- real preview gameplay evidence
- current game registry
- browser player
- local leaderboard adapter
- quest/reward system
- character/world registries

Unavailable:
- no need to fabricate a trailer
- unsupported character/lore relationships remain omitted/truthful

**Conclusion:** deepen current page with existing modules; do not rebuild the game.

## 04 — Browser Game Player

Approved mockup calls for:
- game-dominant viewport;
- pause/resume;
- sound;
- fullscreen;
- score/timer;
- achievement/XP/challenge context;
- exit.

Existing:
- current player shell and iframe isolation
- pause/resume/fullscreen/sound/exit
- loading/error/retry
- `toadal.game.v1` protocol
- `game:score`
- `game:complete`
- guest progression/quest/reward state

Port/reference:
- historical session timer pattern if a shell timer is useful

**Conclusion:** this is a thin HUD integration problem. Preserve game viewport dominance.

## 05 — World Hub

Approved mockup calls for:
- world/map feel;
- lore/location cards;
- characters;
- stories/media;
- discoveries/progress;
- app CTA;
- locked mystery worlds.

Existing:
- Candy Kingdom / forest portal / scenic world art
- current World route
- content registry World/Location model
- discovery state
- characters
- stories/media
- companion map-guide state
- App route

**Conclusion:** compose approved world-hub hierarchy with current art + discovery/progress data. Do not invent mystery-world lore.

## 06 — Characters Hub

Approved mockup calls for:
- character collection;
- filtering;
- relationships;
- appearances;
- discovery progress;
- future-character distinction.

Existing:
- current canonical character registry
- Toadal, Princess Lily, Gully, Gulper, Genies
- current character cards/profile route
- current discovery/progression
- existing truthful "relationships/appearances awaiting canon" states

**Conclusion:** keep canonical art and expose richer collection/filter/progress structure. Do not synthesize relationships.

## 07 — Toadal Profile

Approved mockup calls for:
- biography;
- personality;
- history;
- abilities;
- friends;
- locations;
- games;
- stories;
- gallery;
- collectibles.

Current page already implements this structural outline.

Existing:
- canonical Toadal art
- current game/world/story/media links
- current guest collection state

Missing approved canon remains a publication/content state.

**Conclusion:** mostly preserve. Do not fill empty canon sections with generated lore.

## 08 — Stories / Comics Hub

Approved mockup calls for:
- featured series;
- latest chapter;
- reading progress;
- comics;
- manga;
- shorts;
- lore;
- BTS.

Existing:
- current Stories publishing architecture
- structured content registry
- publication states
- reader progress/bookmarks
- Manga + Reader routes
- World/Characters links

**Conclusion:** current architecture already matches the required product model. Empty publication states are valid until real stories exist.

## 09 — Manga Series

Approved mockup calls for:
- cover;
- synopsis;
- chapter list;
- characters;
- progress;
- lore/world;
- related media.

Existing:
- current Manga series template
- structured Series → Chapter model
- current reader handoff
- publication rules
- progress state
- World/Characters/Media links

**Conclusion:** preserve template; published chapter/cover is content dependency, not website engineering.

## 10 — Comic / Manga Reader

Approved mockup calls for:
- uncluttered reader;
- thumbnails;
- previous/next;
- fullscreen;
- progress;
- bookmark;
- story info.

Existing:
- current Reader shell
- publishing projection
- bookmark/resume architecture
- truthful no-published-chapter state

**Conclusion:** preserve. Do not add generic dashboard chrome.

## Cross-page implementation rule

The approved mockups contain illustrative data (scores, rewards, counts, games, dates, etc.).

Do not copy illustrative values as product truth.

Use:
1. composition/hierarchy from approved visual,
2. data/state from current runtime/contracts,
3. current canonical art,
4. truthful future/empty state when real data is absent.

This lets the final site look like the intended product without fabricating the mockup's illustrative content.
