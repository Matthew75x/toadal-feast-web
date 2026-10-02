# TOADAL FEAST — Final Manifest Acceptance Matrix

**Date:** 2026-10-02  
**Work branch:** `work/manifest-complete-v1-20261002`  
**Frozen parent:** `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43`

This file defines when Codex is allowed to call a manifest row complete. It is intentionally stricter than route presence and intentionally avoids treating unavailable external services as website failure when a truthful future state is permitted.

| # | Family | Must be true to call COMPLETE |
|---:|---|---|
| 01 | Home | Approved composition preserved; Play/App CTAs visible; games, Feast Pass, Characters, World, Stories/Media and future states are immediately discoverable; companion non-blocking; no major dead space/regression. |
| 02 | Play | Real game catalog/filtering works; browser-playable state truthful; challenge/reward/leaderboard/Feast Pass entry points exist where supported; App conversion present. |
| 03 | Wicked Bites detail | Genuine game description/mechanics/media; launch works; challenge/score/reward/related-game surfaces present or truthfully gated. |
| 04 | Browser player | Cartridge launches; pause/resume/fullscreen/sound/controls/exit work; score/timer/challenge/progression data shown where exposed by the cartridge/adapter; no invented telemetry. |
| 05 | World | Locations/world structure, characters, stories/media, discoveries/progress and app path exist; locked worlds visibly locked rather than omitted. |
| 06 | Characters | Collection/filtering works; relationships/appearances/discovery status represented using approved data only; future characters distinguished. |
| 07 | Toadal profile | Biography/personality/history/abilities/friends/locations/games/stories/gallery/collectibles structure exists; unavailable canon is explicitly unpublished rather than invented. |
| 08 | Stories | Featured/latest/reading-progress/comics/manga/shorts/lore/BTS structure exists; unpublished content has a finished publication state. |
| 09 | Manga series | Cover/synopsis/chapter list/characters/progress/world/media links supported; no fabricated chapter required. |
| 10 | Reader | Reader shell, previous/next, thumbnails, fullscreen, bookmark/progress and story info work; unpublished pages fail closed gracefully. |
| 11 | Media | Trailer/video/gameplay/short/art/wallpaper/download/creator/press slots exist with truthful availability. |
| 12 | News | Featured/latest/filter structure exists; publication states and useful empty state work; no fake counts. |
| 13 | Devlog | Reusable article template with body, media slots, quote, related links, previous/next concept and Roadmap link exists. |
| 14 | Feast Pass | Guest status, level/XP, Sparks, Treats, streak, daily, reward-track/milestones, discoveries and account future state form one coherent product experience; current schema remains authority. |
| 15 | Quests | Daily/weekly/exploration/game/story categories represented; current definition-driven quest engine reused; active local quests work; unavailable catalog stays configurable/truthful. |
| 16 | Rewards | Reward track/collection, badges, titles, cosmetics/foods/relics/collectibles and locked/unlocked states represented; no mobile-transfer or paid entitlement claim fabricated. |
| 17 | Leaderboards | Website route/view exists; existing local score model reused; game/mode or ruleset selector where supported; ranking table and personal best/position state work; global/connected state clearly future if backend inactive. |
| 18 | App | Genuine app icon/gameplay imagery; Arcade/Puzzle/Feastfall/Infinite represented; web-vs-full-app distinction clear; store CTAs real or visibly unavailable. |
| 19 | Account | Guest state and benefits clear; continue-as-guest works; signup/login either connected to real Froggy service or intentionally unavailable with construction UX; no fake auth. |
| 20 | Profile | Guest avatar/profile, level/XP/title, scores/worlds/characters/stories/achievements/showcase structure; current local data shown now, connected history only when real service exists. |
| 21 | Community | Creator/fan-art/event/feed-preview/guidelines/feedback structure feels finished; posting/social actions truthfully Coming Soon until service exists. |
| 22 | Store | Merch/digital-goodies/categories/update CTA structure feels finished; no fake products/prices/cart/checkout. |
| 23 | Search | Unified local search works with grouped results/filters and useful suggestions/empty states; existing qualified behavior preserved. |
| 24 | Roadmap | Dedicated route with Available Now / In Development / Coming Soon / Exploring and related devlog links; no fake dates. |
| 25 | Support | Help search/categories/popular questions/contact/status shortcuts exist; unavailable account/store topics may be future-state. |
| 26 | Contact | Category/email/subject/message/attachment/device-info structure exists; submit is real if endpoint exists, otherwise intentional unavailable/construction state with support/business/privacy paths. |
| 27 | About | Mission, flagship universe, experiments, stories/characters, philosophy and press/business structure; TOADAL GAMES remains subordinate to TOADAL FEAST. |
| 28 | Coming Soon | Reusable branded unavailable destination; contextual companion construction response; related available content and updates path; no dead end/fake date. |
| 29 | Legal | Readable Privacy/Terms legal template, TOC concept, last-updated/contact slots; only approved legal text is published. |
| 30 | 404 | Actual HTTP 404 and branded recovery; Home/Play/Search/Stories or equivalent useful exits; no broken assets. |

## Cross-cutting acceptance gates

A final `MANIFEST V1 COMPLETE` status additionally requires:

- TOADAL FEAST-first identity retained.
- Website reads as a cohesive food-fantasy portal, not a generic dashboard.
- Existing contextual companion retained and extended for unavailable/construction actions.
- Existing guest progression storage contract retained.
- Treat/discovery behavior uses current schema.
- Existing Search retained.
- Existing Stories publishing state retained.
- Existing game wrappers/cartridges retained.
- Existing score/leaderboard engine reused rather than duplicated.
- Froggy Locker remains service authority for connected identity/cloud/leaderboard/commerce.
- Growth Control Plane remains internal/management authority.
- Keyboard/focus/touch/reduced-motion behavior retained.
- Desktop/tablet/mobile responsive containment passes.
- No horizontal overflow, broken assets, serious runtime errors or dead CTAs.
- Every unavailable capability gives a truthful explanation and useful next action.
- Final ledger is regenerated against the actual final SHA.
- Qualification is proportional to changed surfaces; unchanged game internals are not re-certified without cause.

## Reuse proof requirement

For rows 14–20 and any other infrastructure-heavy row, the final closure report must name the source used, for example:

- current website implementation,
- TOADAL game runtime,
- `gh-pages@2022e904d0c81f60b13aa340a3838ccbb1a6b150`,
- Froggy Locker,
- publisher stack,
- R2/R3 historical donor,
- or BUILD THIN where no suitable donor exists.

A row may not be labeled BUILD NEW simply because its current website route was absent.
