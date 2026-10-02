# Play / Leaderboards Lane Handoff

Date: 2026-10-02
Branch: `lane/play-leaderboards-20261002`
Scope: manifest rows 02, 03, 04, and 17

This lane changes only `pages/play.json`, `pages/game-wicked-bites.json`, `pages/player-wicked-bites.json`, and `pages/leaderboards.json`. Shared files, progression persistence, generated output, and game storage remain outside this lane.

## Route-local work delivered

- **Play:** keeps all four registered game listings and their existing Preview/held/concept truth. Adds links and presentation blocks for configured website quests, local milestones, Leaderboards, a guest-local Feast Pass summary, and the App route. The summary uses existing `data-progression-stat` hooks.
- **Wicked Bites detail:** uses the qualified v5.5 gameplay capture and mechanics/controls verified in the cartridge help screen. There is no trailer, so the page says so. It distinguishes the cartridge Daily Seeded Run/seed input from website quests; exposes a browser-local personal-best hook; states that the cartridge emits no achievement IDs; separates website rewards from game score; and links the other real catalog listings without asserting story relationships.
- **Player:** preserves its isolated iframe, toolbar, fullscreen exit, retry/error handling, status live region, and game-first layout. Adds a compact live score/session-time/local-best strip plus truthful website challenge, Feast Pass, and achievement/reward context below the viewport.
- **Leaderboards:** defines `/leaderboards/` with a scoped semantic table, caption, browser-local game/scope controls, Personal Best, no-score Play CTA, local/browser disclosure, disabled Global/Friends/Pond Coming Soon choices, and contextual companion markup. No opponents, modes, rulesets, account identity, or ranks are fabricated.

## Route-local hooks

The integrator can target these attributes:

| Surface | Hooks |
|---|---|
| Play summary | `[data-progression-page="play-summary"]`, `[data-progression-stat]`, `[data-progression-storage-status]`, `[data-play-local-best]` |
| Wicked Bites detail | `[data-detail-local-best][data-game-id="wicked-bites"]` |
| Player HUD | `[data-player-hud]`, `[data-player-score]`, `[data-player-session-time]`, `[data-player-local-best]`, `[data-player-challenge-state]`, `[data-player-achievement-state]` |
| Leaderboards | `[data-leaderboard-page]`, `[data-leaderboard-game]`, `[data-leaderboard-scope]`, `[data-leaderboard-personal-best]`, `[data-leaderboard-table]`, `[data-leaderboard-rows]`, `[data-leaderboard-empty]`, `[data-leaderboard-status]` |
| Score domain | `data-local-score-game="wicked-bites"`, `[data-local-score-best]` |

The initial no-score text/table row is the intentional empty state. The renderer should replace it only from the Lane D score API, creating cells with DOM nodes and `textContent`. Sort local completed runs by score; any displayed rank is within this browser's run history only.

## Shared integration required

### 1. `pages/index.json`

Register the new page after the existing Player route (or in the agreed route order):

```json
{
  "id": "page.leaderboards",
  "route": "/leaderboards/",
  "file": "pages/leaderboards.json",
  "title": "Leaderboards · TOADAL FEAST"
}
```

The page definition is present, but this route is not navigable/exportable until the index is updated.

### 2. `collections/navigation.json`

Add this entry once to both `primary` and `footer` arrays, after Play:

```json
{
  "id": "leaderboards",
  "label": "Leaderboards",
  "href": "/leaderboards/"
}
```

Lane D owns the Feast Pass subnavigation in `pages/feast-pass.json`, `pages/quests.json`, `pages/rewards.json`, and `pages/profile.json`; add the same Leaderboards link to those four local navigation lists during progression integration.

### 3. `collections/advanced-code.json`

Extend the current global runtime without changing the cartridge protocol or reading cartridge storage:

1. In `initGuestProgressionLoader()`, add these normalized routes to the eligible list: `/play/`, `/games/wicked-bites/`, `/player/wicked-bites/`, and `/leaderboards/`. The Play, Wicked Bites detail, Player, and Leaderboards route roots carry `data-progression-page` so the existing progression boot can attach its page store.
2. In `initBrowserPlayer()`, update `[data-player-score]` from validated `game:score` payloads for live display only. Normalize score again before persistence: accept only a non-negative safe integer (or a deliberately strict decimal string for the current bridge), reject decimals, negatives, unsafe values, and arbitrary strings.
3. Track host session time using monotonic elapsed segments: start/resume on `game:started`/`game:resumed`; pause on `game:paused` and the existing hidden-page pause; stop on complete, error, exit, and page hide. Format it as **Session time**. Do not call it game/run time or persist it as competitive evidence.
4. On `game:complete` only, call Lane D's score API once for the active run after host source/protocol/gameId checks and score normalization. Prevent duplicate completion writes for that run; reset the guard, current score, and timer on retry/new run. Do not persist `game:score` updates.
5. Read local best/history for the detail, player, Play, and Leaderboards hooks from the same Lane D score domain. Never read `froggyFeast`, `SaveManager`, cartridge keys, or other game storage; never send a network request while connected scoring is inactive.
6. Render local table rows only from validated Lane D records. Keep the initial empty row when there are no records. Keep Global/Friends/Pond disabled and Coming Soon. Do not add a mode/ruleset selector unless the cartridge later supplies validated values.
7. Extend `companionState()` so `leaderboards`, `leaderboard`, or `high score` context maps to the existing `reward` companion state/art. The Leaderboards page already marks its semantic context; this uses existing approved companion assets and requires no asset registry change.

**Lane D API dependency:** at this branch snapshot, `guest-progression.js` exposes `getSnapshot()` and the route/quest APIs, but no local-score read/write methods. Lane D must add the score methods to the existing website profile/progression store and snapshot (same four storage keys), with normalization, a bounded 50-run history per game/scope, best calculation, duplicate-completion defense support, fail-safe schema behavior, clear semantics, and tests. Suggested surface is `recordLocalScore({ gameId, score, mode, ruleset, characterId })`, `getLocalScores(gameId)`, and `getLocalBest(gameId)`; unsupported metadata must remain null. The current Wicked bridge supplies score/completion but no mode/ruleset/character metadata, so do not label `preview` as cartridge mode.

### 4. `reference/assets/css/site.css`

Add and consolidate route-scoped rules for these new classes:

- `.play-journey-grid`: responsive card grid for Play challenge, rewards, local scores, Feast Pass, and App entries; reuse existing `.detail-fact` treatment.
- `.wicked-mechanics`, `.wicked-media-and-challenge`, `.wicked-rewards-state`, and `.related-games-grid`: tune the existing `.wo002-detail-facts` card spacing for the detail page; let the four related listing cards wrap cleanly.
- `.player-hud-strip`: compact, legible horizontal Score / Session time / Local best strip; wrap on narrow screens without shrinking the game viewport. Keep value updates out of an aggressive live region.
- `.player-context-grid` and `.player-context-card`: secondary three-card website-state area below the iframe, collapsing to one column on narrow screens.
- `.leaderboard-controls`: labeled game/scope selectors with visible keyboard focus and a narrow-screen stack.
- `.leaderboard-table-wrap` and `.leaderboard-table`: horizontal overflow contained within a focusable region, readable header/cell spacing, and visible focus. The table must not widen the page.
- `.leaderboard-results`, `.leaderboard-empty-note`, `.leaderboard-future-state`, and `.leaderboard-disclosure`: style the responsive results section, empty state, connected-future state, and local-data disclosure with the existing site tokens.

Keep the existing `.wo002-player-frame-wrap` viewport sizing, focus outline, and fullscreen behavior. Do not add motion to score changes or reduce game viewport dominance.

## Acceptance checks for integration

- Every page and table selector resolves after static export; the Leaderboards route is indexed and both global navigation zones link to it.
- Play still shows exactly the four game registry records and all remain Preview; only Wicked Bites has a player CTA.
- Player HUD values come from validated protocol events/host clock. Website challenge and reward state remain empty unless Lane D configures a matching event; no score grants XP or achievement.
- One valid completion creates at most one website-local score record; retries allow a later run with the same score to count.
- Leaderboards empty/local states render accessibly; no score record, account, competitor, connected/global rank, or unsupported mode is synthesized.
- No page reads cartridge storage, no shared file is edited by Lane C, and `dist/` is generated only by the integrator after source integration.

## Lane checks run

- JSON parse of the four owned page definitions: PASS.
- Play / Wicked Bites / Player / Leaderboards surface assertions: PASS.
- `node scripts/verify-wicked-bites-score-bridge.mjs`: PASS.
- `node scripts/wo002-contract.test.mjs`: 8 of 9 assertions pass, including all Play catalog, player boundary, game package, and provenance checks. The static-link subtest could not spawn its nested Node verifier in this restricted environment (`spawn EPERM`); the failure occurs before that verifier runs. `node --test` also cannot start its worker here for the same process-spawn restriction.

No `dist/` output was rendered.
