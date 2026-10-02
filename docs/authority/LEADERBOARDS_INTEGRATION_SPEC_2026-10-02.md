# TOADAL FEAST — Leaderboards Integration Specification

**Date:** 2026-10-02  
**Target:** final manifest row 17 and score/profile integration  
**Rule:** integrate existing boundaries; do not read or rewrite game-private saves.

## 1. Existing authorities

### Website contract
`docs/implementation/PROGRESSION_STATE_CONTRACT.md` already includes **local game scores**.

`docs/implementation/progression-state.schema.json` already reserves `localScores`.

`docs/implementation/PUBLIC_FEATURE_STATE.json` already defines:
- `localLeaderboards: PUBLIC_AFTER_WO005_IF_IMPLEMENTED`
- `globalLeaderboards: PLANNED`

### Cartridge boundary
`docs/implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md` already defines protocol `toadal.game.v1`.

Cartridge -> host includes:
- `game:score`
- `game:complete`

The current browser-player host already accepts both messages in `collections/advanced-code.json`.

Therefore the website already has the correct score-ingress boundary.

### Wicked Bites compatibility bridge is already score-capable

Current file:
`studio-project/toadal-feast-website/reference/public/games/wicked-bites/toadal-bridge.js`

It already:
- reads `#wbScore`;
- emits `game:score` when the score text changes;
- detects `#wbResult`;
- emits `game:complete` once when the result becomes visible;
- emits `game:started`, pause/resume and error state;
- validates parent origin before posting.

The bridge currently sends the score from DOM text, so `payload.score` may be a string.

The website score adapter must normalize an exact finite non-negative integer value before persistence. Do not persist the raw bridge payload.

For Wicked Bites V1 local score records, factual context available from the bridge is primarily:
- `gameId = "wicked-bites"`
- score
- completion time owned by the website

Do not invent character/ruleset/mode metadata when the bridge did not send it. A website label such as `preview` may describe the public feature state, but should not masquerade as cartridge-emitted gameplay metadata.

No cartridge rewrite is required merely to make local Wicked Bites score capture work.

### Game donor
`Matthew75x/Toadal-Feast-Development`

Useful model:
`src/runtime/modes/arcade/arcade-standalone-leaderboard.js`

Donor fields:
- score
- charId
- mode
- ruleset
- rulesetKey
- date

Donor behavior:
- non-negative integer score
- descending sort
- bounded top 50
- ruleset best
- global best

UI donor:
`gh-pages@2022e904d0c81f60b13aa340a3838ccbb1a6b150`
`src/runtime/ui/ui-core.js -> buildLeaderboard()`

### Connected future
Froggy Locker:
`apps/api/src/services/leaderboard-service.mjs`

Connected service already supports:
- `submit({userId, gameId, mode, score, buildId})`
- `top({gameId, mode, limit})`

Database:
`leaderboard_scores(identity_id, game_id, mode, score, build_id, verification, created_at)`

Do not reproduce this backend in the website.

## 2. Correct V1 data flow

```
browser cartridge
   |
   | toadal.game.v1 / game:score
   | toadal.game.v1 / game:complete
   v
website player host
   |
   | validated/sanitized score event
   v
website guest-local score adapter
   |
   | toadal:web:v1:* progression namespace
   v
Leaderboards + Profile + game-detail preview
```

The website must **not**:
- read `froggyFeast` / SaveManager keys directly;
- write cartridge-owned storage;
- copy mobile/full-game save data;
- imply account/global ranking;
- submit preview scores to Froggy unless a real connected service is explicitly activated.

## 3. Score capture policy

Use `game:score` for live player display only.

Persist a run when:
- a valid `game:complete` arrives,
- score is a non-negative safe integer,
- message source/protocol/gameId already passed the current player-host validation.

Recommended bounded local record:

```js
{
  gameId: "wicked-bites",
  score: 1234,
  mode: "preview",        // use actual payload mode when supplied
  ruleset: null,         // use actual payload value when supplied
  characterId: null,     // only when supplied and validated
  completedAt: "2026-10-02T..."
}
```

Keep at most 50 completed local runs per game/scope.

Never persist raw arbitrary message payloads.

## 4. Website persistence

Use the existing `toadal:web:v1:` namespace and current progression store.

Do not couple Leaderboards to cartridge storage.

Preferred implementation:
- extend the current guest-progression/profile score domain deliberately;
- keep schema/version handling fail-safe;
- update `progression-state.schema.json` and tests together if the record shape is expanded.

The existing schema already reserves `localScores`, so preserve that concept rather than inventing a second public score authority.

If richer run history is needed, add it as an explicitly versioned/additive field under the existing website-owned progression/profile contract.

## 5. V1 Leaderboards page

Required:
- dedicated `/leaderboards/`
- game selector
- mode/ruleset selector only when real data supports it
- semantic HTML table
- columns: Rank / Player or Character / Score / Context as available
- Personal Best summary
- no-scores state with Play CTA
- local/guest status disclosure
- link to relevant game/challenge
- companion leaderboard/high-score reaction

Local ranking may rank completed runs from this browser.

If only one personal best exists, present it honestly; do not manufacture opponents.

## 6. Connected/global state

Until Froggy is really configured:

- show Global / Friends / Pond ranking as Coming Soon or unavailable;
- do not create simulated public competitors;
- do not show simulation records as real;
- do not submit local preview scores externally.

When connected later:
- use Froggy service boundary;
- authenticate identity;
- keep verification state visible to service/admin boundaries;
- reconcile local guest scores under the guest-to-account migration policy instead of blind upload.

## 7. Player/Profile/Play integration

Player:
- live `game:score` can update visible score;
- `game:complete` can record the final local run.

Profile:
- show personal bests/recent local runs when they exist;
- link to `/leaderboards/`;
- preserve guest-local disclosure.

Play:
- link to Leaderboards.

Game Detail:
- optional compact best-score module;
- never imply a global rank.

Feast Pass:
- link to Leaderboards as part of player journey;
- score submission does not automatically grant currency/rewards unless an explicit quest/reward definition says so.

## 8. Tests

Minimum:
- rejects negative/non-integer/unsafe scores;
- ignores unknown protocol/gameId/source;
- `game:score` does not create duplicate completed runs;
- `game:complete` persists one sanitized run;
- bounded top/history behavior;
- local best calculation;
- corrupt/future score state fails safely;
- clear website progression clears website scores only;
- cartridge/game storage remains unchanged;
- no connected/global network call when service is inactive;
- table empty/local populated states render accessibly.

This specification turns manifest row 17 into an adapter/presentation task, not a new leaderboard project.
