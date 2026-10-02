# TOADAL FEAST — Manifest Reuse & Closure Plan

**Date:** 2026-10-02  
**Current qualified website source:** `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43`  
**Authoritative denominator:** 30-page `PAGE_MANIFEST.md` + locked cross-cutting requirements  
**Operating rule:** REUSE / PORT / INTEGRATE / POLISH before BUILD NEW.

## 1. Architecture correction

The website is the player-facing shell for a larger ecosystem that already exists. Missing website presentation is not proof the underlying capability was never built.

Primary reusable authorities/donors:

- `Matthew75x/toadal-feast-web` — current public website shell, TOADAL Studio project, companion, search, guest progression, stories publishing, game wrappers.
- `Matthew75x/Toadal-Feast-Development` — canonical game/runtime source and player-facing game systems.
- `Matthew75x/Toadal-Feast-Development` `gh-pages` @ `2022e904d0c81f60b13aa340a3838ccbb1a6b150` — staged frozen web runtime with Scores/Leaderboard panel, `buildLeaderboard()`, local top-50 score persistence, profile/resources, daily goals, achievements, collection, settings and player UI.
- `Matthew75x/froggy-locker-publisher-platform` @ `4016dbb0cec7b0d6f4dbe15da7ca7e304b9db454` — backend authority for guest/account identity, profiles, cloud saves, leaderboard submit/read, achievements, economy, entitlements, commerce, privacy, telemetry and publisher services.
- `Matthew75x/toadal-feast-publisher-stack` @ `6c0c0362e46328d0452aa7e373fe790754734246` — integrated orchestration proving TOADAL web/game + Froggy Locker + Growth Control Plane + account/admin/status surfaces can coexist behind explicit boundaries.
- `Matthew75x/growth-control-plane` — management/analytics decision plane. Internal read/decision surface; NOT player leaderboard/account authority.
- Historical Grove/TOADAL portal donor on ASSIGNATOR: `C:\ReleaseOps\toadal-games-redesign-20260925` plus R2/R3 packages. Proven browser-local Passport, Sparks, Treats, daily rewards, quest completion, optional sound, route discovery, responsive HUD and parallax. Branding/storage model are superseded; behavior is reusable.
- `Matthew75x/grove-focus-pal` — generic companion/progression/resilience patterns only where compatible. Do not make Grove product semantics public TOADAL authority.

## 2. Confirmed reuse findings

### Leaderboards
Do **not** build leaderboard infrastructure from scratch.

Existing stack:
- Game local score capture: `src/runtime/modes/arcade/arcade-standalone-leaderboard.js`.
- Historical GitHub Pages UI: `gh-pages` contains Scores button, leaderboard panel and `buildLeaderboard()` displaying ranked rows with character portrait/name/score.
- Local persistence: top 50 scores + best scores/ruleset data already exist.
- Froggy Locker backend: capability-gated leaderboard submit/read service and `leaderboard_scores` DB table.
- TOADAL social client: `getLeaderboard(scope)` with local simulation and HTTP seams.

Website work is therefore a **view/adapter/integration task**, not a new subsystem.

### Feast Pass / Treats / quests / daily rewards
Do **not** rebuild the progression engine.

Existing modern website:
- `toadal:web:v1:feast-pass`
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:profile`
- level, XP, Sparks, streak, badges, collectibles, quests, discoveries, daily check-in
- Golden Block + collectible candy discovery loop

Existing donor behavior:
- hidden Feast Treat collection
- R2 Explorer Passport HUD
- 7-day daily reward presentation
- World/Genie/Treat quest and reward
- site-level XP/Sparks HUD
- optional site sound
- reduced-motion parallax

Correct action: port/adapt donor interaction into the modern state contract and current TOADAL FEAST visuals.

### Account / profile / cloud / achievements
Do **not** invent backend architecture.

Froggy Locker already implements guest identity, email accounts, guest-to-account upgrade, profiles, cloud saves, achievements and privacy boundaries. Current website should remain guest-first and truthfully gated until an authenticated production Froggy deployment exists.

### Growth Control Plane
Use for internal analytics/operations only. It is not the public-player account, leaderboard or progression authority.

## 3. 30-page manifest reconciliation and execution decision

| # | Manifest family | Existing source | Closure action |
|---:|---|---|---|
| 01 | Home | Current Home + visual authority + companion/discovery | **POLISH** |
| 02 | Play / Games Hub | Current Play + cartridge/game repos + progression/score systems | **INTEGRATE/POLISH** |
| 03 | Wicked Bites detail | Current route + real Wicked Bites source | **POLISH/CONNECT** |
| 04 | Browser Game Player | Current qualified wrapper/player | **KEEP + THIN INTEGRATION** |
| 05 | World Hub | Current World + canonical environments + discovery state | **POLISH/STRUCTURE** |
| 06 | Characters Hub | Current Characters registry | **POLISH** |
| 07 | Toadal Profile | Current structured profile | **POLISH/FILL APPROVED DATA** |
| 08 | Stories Hub | Current hub + publication states | **KEEP** |
| 09 | Manga Series | Current template | **KEEP** |
| 10 | Comic Reader | Current reader/bookmark/resume shell | **KEEP** |
| 11 | Media Hub | Current Media + existing project assets | **POLISH** |
| 12 | News Hub | Current News | **POLISH** |
| 13 | News Article / Devlog | Missing current family; old Updates/News donor | **BUILD THIN TEMPLATE** |
| 14 | Feast Pass | Modern guest state + R2 Passport donor | **MERGE/PORT** |
| 15 | Quests | Modern definition-driven engine + donor quest board | **MERGE/EXPAND DEFINITIONS** |
| 16 | Rewards / Collection | Current renderer + donor Rewards + game collection/achievements | **MERGE/POLISH** |
| 17 | Leaderboards | Game local leaderboard + gh-pages UI + Froggy backend | **INTEGRATE** |
| 18 | App | Current App + genuine gameplay evidence | **KEEP/POLISH** |
| 19 | Account | Current truthful shell + Froggy account platform | **GATED INTEGRATION** |
| 20 | Player Profile | Current guest profile + game/Froggy profile data | **INTEGRATE/POLISH** |
| 21 | Community | Current Coming Soon structure | **FINISH PLACEHOLDER EXPERIENCE** |
| 22 | Store | Current preview + Froggy commerce architecture | **FINISH PLACEHOLDER EXPERIENCE** |
| 23 | Search | Current local search qualified | **KEEP** |
| 24 | Roadmap | Missing route; old Updates donor | **BUILD THIN ROUTE** |
| 25 | Support | Current route + older Support donor | **POLISH** |
| 26 | Contact | Current truthful form shell | **FINISH PLACEHOLDER** |
| 27 | About TOADAL GAMES | Current route | **POLISH** |
| 28 | Coming Soon | Current construction route + companion | **KEEP/EXTEND** |
| 29 | Legal | Current legal template + donor material | **KEEP TEMPLATE** |
| 30 | 404 | Current branded recovery route | **KEEP** |

## 4. Cross-cutting closure map

| Requirement | Reuse source | Action |
|---|---|---|
| Reactive Toadal | Current website companion | Keep; add construction/unavailable semantic state. |
| Treat collectibles | Current discovery schema + old Treat behavior | Port into current IDs/schema. |
| Daily rewards | Current UTC check-in + R2 7-day UX | Merge presentation; configurable values only. |
| Quests | Current definition engine + donor board | Expand definitions/UI, not engine. |
| Rewards | Current renderer + R2 rewards + game achievements/collection | Connect/polish. |
| Leaderboards | Game gh-pages UI + local score data + Froggy API | Website adapter/view; connected service gated. |
| Profile/account | Current guest profile + game profile + Froggy identity | Guest-first; future connected activation only. |
| Search | Current `site-search.js` | Keep. |
| Stories publishing | Current `stories-publishing.js` | Keep; truthful states. |
| Sound | R2 browser-local opt-in donor | Optional port if low-risk. |
| Environmental motion | Reduced-motion-aware parallax donor | Optional bounded scenic use only. |
| Analytics / growth | Growth Control Plane + Froggy aggregate boundary | Internal only. |
| Store/commerce | Froggy commerce architecture | Preview only until real activation. |
| Production hosting | Separate release concern | Do after manifest closure. |

## 5. Required operating rules

1. No greenfield rebuild before repository/donor search.
2. Do not confuse public shell with backend authority.
3. Growth Control Plane stays internal; Froggy/game services own player-facing data.
4. Do not port obsolete Grove branding/state schema. Port behavior only.
5. Do not re-certify unchanged game internals. Test adapters and affected surfaces.
6. Unavailable future capability = polished truthful state, not unfinished website.
7. One integration branch, one final qualification.
8. Current qualified release remains rollback authority while closure work proceeds.

## 6. Completion expectation

Remaining work is primarily **integration, porting and presentation**, not invention of new infrastructure.

Largest reusable systems already exist: score/leaderboards, account/profile/cloud boundaries, progression, Treats/daily/quests donors, companion, search, publishing, game wrappers and analytics/ops.

Close the manifest by assembling the best existing implementation behind current TOADAL FEAST authority, then qualify once.
