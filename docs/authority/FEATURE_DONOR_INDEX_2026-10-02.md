# TOADAL FEAST — Feature Donor Index

**Purpose:** stop duplicate engineering during final manifest closure.

## Current website authority

Repository: `Matthew75x/toadal-feast-web`

Frozen parent: `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43`

Primary current implementations:

- `studio-project/toadal-feast-website/reference/assets/js/guest-progression.js` — current namespaced guest progression/storage authority.
- `studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js` — editable starter definitions, not permanent economy authority.
- `studio-project/toadal-feast-website/reference/assets/js/home-interactive-discovery.js` — current Golden Block, candy discovery, portal and daily-chest interactions.
- `studio-project/toadal-feast-website/reference/assets/js/site-search.js` — current local search.
- `studio-project/toadal-feast-website/reference/assets/js/stories-publishing.js` — current story publication/reader projection.
- `studio-project/toadal-feast-website/reference/assets/js/companion-position.js` — current companion placement/avoidance behavior.
- Current page JSON under `studio-project/toadal-feast-website/pages/` is presentation authority for existing routes.

## TOADAL game/runtime donors

Repository: `Matthew75x/Toadal-Feast-Development`

Important staging donor:
`gh-pages@2022e904d0c81f60b13aa340a3838ccbb1a6b150`

Use:

- `src/runtime/modes/arcade/arcade-standalone-leaderboard.js`
  - local leaderboard writes
  - score/ruleset context
  - top-50 retention
  - best-score tracking
- `src/runtime/ui/ui-core.js`
  - `buildLeaderboard()`
  - ranked display rows
  - character portrait/name/score rendering
  - panel infrastructure
  - profile/menu presentation donor
- `index.html`
  - Scores/Leaderboard entry
  - Collection
  - Profile
  - Daily
  - Settings
  - Journal/Achievements
  - resource readouts
- `src/runtime/shared/social/social-client.js`
  - connected/local social and leaderboard service seams where enabled
- `src/runtime/shared/social/social-settings.js`
  - social/connected-feature settings boundaries
- `src/runtime/platform/web-social-adapter.js`
  - browser adapter boundary where applicable

Do not copy game UI wholesale into the public website. Reuse data contracts, presentation concepts and adapters.

## Froggy Locker service donors

Repository:
`Matthew75x/froggy-locker-publisher-platform`

Pinned research head:
`4016dbb0cec7b0d6f4dbe15da7ca7e304b9db454`

Use as service authority, not as a public visual donor.

Known relevant paths:

- `apps/api/src/services/leaderboard-service.mjs` — connected leaderboard service.
- `db/migrations/001_core.sql` — leaderboard/account/core storage schema including `leaderboard_scores`.
- `packages/game-sdk` — detachable game-services client boundary.
- `web/` — historical first-party publisher/player-facing web surface.
- Repository README/API/integration contracts — identity, profile, cloud save, achievements, commerce, privacy and publisher-service boundaries.

Do not rebuild these services in `toadal-feast-web`.

## Integrated publisher-stack donor

Repository:
`Matthew75x/toadal-feast-publisher-stack`

Pinned research head:
`6c0c0362e46328d0452aa7e373fe790754734246`

Use:

- `ARCHITECTURE.md` — authority boundaries.
- `SYSTEM_BOUNDARY_MATRIX.md` — public/private service separation.
- `INTEGRATION_STATUS.md` — proven integrated capabilities and explicit non-production gates.
- `docs/REPOSITORY_MAP.md` — where Froggy/Growth/public surfaces live.
- `sites/` — integrated marketing/account/growth/ops presentation donors.
- `runtime/game/current/` — pinned game artifact integration donor.
- `vendor/froggy-locker/` — Froggy snapshot.
- `vendor/growth-control-plane/` — Growth authority snapshot.

Important rule: public website, player account/API and internal Growth/Ops surfaces are separate trust boundaries.

## Growth Control Plane

Repository:
`Matthew75x/growth-control-plane`

Role:
internal management/analytics/decision plane.

Use only for:
- analytics contracts,
- product/marketing aggregate boundaries,
- operations/decision architecture.

Do not use it as:
- public account authority,
- player leaderboard authority,
- public progression authority.

## Historical Grove/TOADAL website donors on ASSIGNATOR

### Base donor
`C:\ReleaseOps\toadal-games-redesign-20260925\site\src\scripts\app.js`

Confirmed behavior:
- Sparks
- visit streaks
- Treat collection
- quest state
- daily state/reward
- game filters
- session timer
- local best score
- Feast Catch historical mini-game
- reduced-motion-aware parallax

Use behavior only. The old `toadal-games-portal-v1` state contract is superseded.

### R2 donor
`C:\ReleaseOps\toadal-games-web-r2\TOADAL_GAMES_R2_VISUAL_CONVERGENCE\site\src\scripts\adventure.js`

Confirmed behavior:
- Explorer Passport/HUD
- level/XP-style presentation
- Sparks
- streak
- Daily Adventure Gift
- 7-day presentation
- optional browser-local sound
- quest board
- Treat collection
- World Scout reward
- route discovery
- rewards rendering
- session timer/break reminder
- reduced-motion handling
- scenic motion

R2 smoke evidence proved daily claim, Treat persistence, 3/3 quest completion, reward persistence, optional sound, mobile 390px containment and 18/18 source tests.

### R3 donor
`C:\ReleaseOps\toadal-games-web-r3\TOADAL_GAMES_R3_INTERACTIVE_MASCOT\site\src\scripts\adventure.js`

Use only where R3 extends the proven R2 interaction patterns without importing superseded branding.

## Structural historical page donors

Older Grove/TOADAL portal includes historical routes/templates for:

- Account
- Community
- News
- Rewards
- Store
- Support
- Updates
- Privacy
- Terms
- Toadal
- Play
- game details
- 404

Use these to accelerate structure/empty-state composition only.

## No-rebuild decision table

| Feature | Primary reuse source |
|---|---|
| Local leaderboard | TOADAL game runtime / gh-pages |
| Connected leaderboard | Froggy Locker |
| Guest progression | Current website |
| Treats | Current discovery schema + historical donor behavior |
| Daily rewards | Current check-in engine + R2 UX donor |
| Quests | Current definition engine + R2 quest UX |
| Rewards/collection | Current renderer + R2 + game achievements/collection |
| Account/profile/cloud | Froggy Locker + current guest shell |
| Search | Current website |
| Story publishing/reader | Current website |
| Companion | Current website |
| Optional site sound | R2 donor |
| Scenic/parallax motion | Historical reduced-motion donor |
| Growth analytics | Growth Control Plane / publisher-stack boundary |
| Store backend | Froggy Locker commerce boundary |
| Roadmap | BUILD THIN from current components + historical Updates structure |
| Devlog article | BUILD THIN from current components + historical News/Updates structure |

If a sub-agent believes a new subsystem is required, it must first document why none of the listed donors can satisfy the requirement.
