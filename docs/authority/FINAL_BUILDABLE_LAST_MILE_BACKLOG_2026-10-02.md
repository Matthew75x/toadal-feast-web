# TOADAL FEAST — Final Buildable Last-Mile Backlog

**Date:** 2026-10-02  
**Branch:** `work/manifest-complete-v1-20261002`  
**Purpose:** convert remaining manifest depth into finite implementation tasks.  
**Rule:** this list covers buildable website work only. Unavailable external content/services should use the truthful future-state system.

## Priority 0 — already mechanically blocking

### P0.1 Devlog / Article family
Manifest row 13.

Build:
- `/news/devlog/`
- reusable article shell
- art/media slots
- quote slot
- related links
- previous/next concept
- Roadmap handoff
- truthful no-published-article state if registry remains empty

Reuse:
- current News styling
- content registry News/Devlog contract
- historical News/Updates donor structure

Do not invent an article/date/byline.

### P0.2 Leaderboards
Manifest row 17.

Build:
- `/leaderboards/`
- semantic table
- local/personal score state
- game selector
- supported scope/mode controls
- personal best
- no-score Play CTA
- future connected/global state
- companion high-score context

Reuse:
- `LEADERBOARDS_INTEGRATION_SPEC_2026-10-02.md`
- existing `toadal.game.v1` score messages
- game local leaderboard donor
- Froggy service only as future connected boundary

### P0.3 Roadmap
Manifest row 24.

Build:
- `/roadmap/`
- Available Now
- In Development
- Coming Soon
- Exploring
- related Devlog/News links

Reuse:
- existing `content/registry.json -> roadmapItems`

No fake dates.

### P0.4 App Infinite mode
Manifest row 18.

Current App presents Arcade, Puzzle and Feastfall only.

Add:
- Infinite as a fourth actual mode presentation
- use factual/current game evidence
- no fake screenshot required if no approved capture exists
- retain truthful disabled store controls

### P0.5 Construction asset truth
Manifest row 28 / cross-cutting companion.

Current `/coming-soon/` uses `maintenance.webp` but describes it as a dedicated construction outfit.

Fix one of:
- use a genuinely approved construction asset if found, or
- use canonical/maintenance Toadal with truthful alt/copy that does not overclaim the image

Keep semantic reaction = `construction`.

## Priority 1 — progression / player journey closure

### P1.1 Feast Pass Treat wiring
Rows 14–16.

Current:
- Treat field exists
- current Treat count stays zero
- Home already has three unique candy collectibles

Implement:
- map existing Home candy collectibles to local Treat collection
- unique/idempotent counting
- use current `toadal:web:v1` state
- update collection/reward UI
- preserve local/non-entitlement language

Use:
`FEAST_PASS_PORT_SPEC_2026-10-02.md`

### P1.2 Feast Pass navigation
Add Leaderboards to:
- Feast Pass nav
- Quests nav
- Rewards nav
- Profile nav

### P1.3 Quest category completion
Manifest row 15.

Current page is primarily route-visit quests.

Add finished category presentation for:
- Daily
- Weekly
- Exploration
- Game
- Story

Only activate categories with real event sources.
Others may say no active quests / Coming Soon.

Add:
- Treat/XP/reward summary
- completed/history concept
- no fake timers

### P1.4 Rewards / Collection depth
Manifest row 16.

Current page has milestones but no claimable catalog.

Add coherent local structure for:
- reward track
- badges
- titles
- foods/Treats
- collectibles
- locked/unlocked states
- cosmetics/relic categories as truthful empty/future states when no approved items exist

Safe local earned examples must derive from actual actions only.

No mobile transfer/entitlement claim.

### P1.5 Profile depth
Manifest row 20.

Current profile has stats, score/activity empty state, discovery section.

Add:
- guest avatar/profile presentation
- selected title/badge where real
- local score/personal-best data once score bridge exists
- worlds/characters/stories discovery summary
- earned local achievements/milestones
- showcase slots using only real local state
- Leaderboards link

No connected identity claim.

## Priority 2 — Play family closure

### P2.1 Play Hub integration blocks
Manifest row 2.

Current Play = filters + browser-game catalog.

Add:
- current challenge/quest entry
- badges/rewards entry
- Leaderboards entry
- compact Feast Pass summary/link
- App conversion block

Do not add fake playable games.

### P2.2 Wicked Bites detail depth
Manifest row 3.

Current:
- real preview status
- launch
- How to Play
- session-only truth

Add compact sections for:
- genuine screenshot/key art
- mechanics/controls
- challenge state
- local score/Leaderboard link
- achievements/rewards state
- related games
- related characters only when factual

Trailer slot may be truthful unavailable if no real trailer exists.

### P2.3 Player HUD
Manifest row 4.

Current player already has:
- viewport
- fullscreen
- pause/resume
- sound request
- exit
- status
- `game:score` message handling

Add only truthful shell-level HUD:
- score
- session timer
- active challenge state
- XP/reward result only when a real local definition applies
- achievement state only when real

If no active challenge/reward exists, show a compact truthful state rather than inventing one.

Game viewport remains dominant.

## Priority 3 — discovery/editorial depth

### P3.1 World
Manifest row 5.

Current:
- Feast World intro
- places/faces
- exploration
- cast
- discovery preview
- Stories/Play/Media links

Add:
- map/location-style structured presentation using approved environment art
- local discovery progress
- App CTA
- mystery/future region locked treatment without invented lore

### P3.2 Characters
Manifest row 6.

Current already has:
- collection
- major cast
- canonical links
- relationship/appearance explanatory states
- current-site links

Finish:
- useful filters if absent
- local discovery/progress indicator
- clear Future character treatment

Do not invent biographies/relationships.

### P3.3 Media
Manifest row 11.

Current page is primarily world scenes + character art.

Add structured slots/sections for:
- featured trailer
- videos
- gameplay
- shorts
- art
- wallpapers
- downloads
- creator/press links

Populate with real project assets only.
Unavailable categories get polished empty/future states.

Use genuine app/gameplay captures for gameplay.

### P3.4 News Hub
Manifest row 12.

Current = honest empty editorial surface.

Add complete empty-capable structure:
- featured news area
- latest updates list
- filters/categories
- trending/recent area with truthful empty state
- Devlog link
- Roadmap link

No fake counts/posts/dates.

## Priority 4 — gated ecosystem refinement

### P4.1 Community
Manifest row 21.

Current already has:
- creator spotlight future state
- fan art future state
- events future state
- feedback link

Add:
- curated feed preview structure
- guidelines/safety/participation link or section
- useful available-content escape path

No fake creators/posts.

### P4.2 Store
Manifest row 22.

Current already has:
- merchandise
- digital goodies
- categories
- no-checkout truth

Add:
- notify/update CTA using an actually available route such as News/Roadmap
- companion merch context on CTA
- no email collection unless a real provider is configured

### P4.3 About TOADAL GAMES
Manifest row 27.

Current is structurally thin.

Add concise sections for:
- mission
- TOADAL FEAST flagship universe
- experiments/web experiences
- stories & characters
- product philosophy
- press/business path

Keep TOADAL GAMES subordinate to TOADAL FEAST public identity.

Do not invent company history.

### P4.4 Coming Soon
Manifest row 28.

After Roadmap exists:
- add Follow updates -> Roadmap/News
- preserve Play/World/Characters/Stories/Feast Pass escapes
- fix construction-art truth mismatch

### P4.5 Legal
Manifest row 29.

Current template already has:
- TOC
- Privacy/Terms status
- guest-data fact
- contact

Add only if useful:
- explicit last-updated/status slot that says no approved document is published rather than inventing a date
- related-document structure

Do not publish generated legal terms.

## Rows that should mostly be preserved

These are already structurally close to their manifest role and should not absorb redesign time:

- 01 Home — bounded visual convergence only
- 07 Toadal Profile — structure already comprehensive; approved-copy gaps stay truthful
- 08 Stories Hub — preserve publishing architecture
- 09 Manga Series — preserve template/publication state
- 10 Reader — preserve reader architecture
- 19 Account — future-state shell is already strong
- 23 Search — qualified; do not regress
- 25 Support — qualified local help/search structure
- 26 Contact — complete non-submitting mockup structure
- 30 404 — structured recovery already works

## Final order of operations

1. Close P0 blockers.
2. Wire progression/score systems.
3. Add Play/Media/News/World depth using existing assets/components.
4. Refine gated ecosystem.
5. Run `python scripts/final-manifest-closure-gate.py --source-only --skip-browser`.
6. Resolve every source failure.
7. Render/export.
8. Run full final gate with browser checks.
9. Update manifest ledger against final SHA.
10. Stage exact final candidate.

No new architecture should be required to complete this backlog.
