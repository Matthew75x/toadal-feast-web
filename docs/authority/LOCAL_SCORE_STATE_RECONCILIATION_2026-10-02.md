# TOADAL FEAST — Local Score State Reconciliation

**Date:** 2026-10-02  
**Purpose:** keep Leaderboards/Profile/Play on the existing guest-progression architecture.

## Existing locked foundation

The qualified guest progression foundation proved exactly four website-owned keys:

- `toadal:web:v1:feast-pass`
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:profile`

Its reset/isolation tests explicitly prove that clearing guest progression removes those four keys and leaves unrelated game/mobile storage untouched.

`PROGRESSION_STATE_CONTRACT.md` already lists **local game scores** as a supported guest-progression concept.

`progression-state.schema.json` already reserves `localScores`.

Therefore final Leaderboards integration should extend the existing guest-progression/profile domain, not create a fifth public storage key.

## Recommended ownership

Lane D / guest progression owns:
- score normalization;
- persistence;
- bounded history;
- best-score calculation;
- snapshot/read API;
- clear/reset semantics;
- corrupt/future-schema handling.

Lane C / Play + Leaderboards owns:
- presentation;
- selectors;
- table;
- personal-best module;
- no-score state.

Integrator owns:
- validated `game:complete` -> score API connection.

No route page should call `localStorage` directly.

## Recommended persisted shape

Keep the exact four storage keys.

A safe additive shape under the existing profile record is:

```js
profile: {
  schemaVersion: 1,
  updatedAt: "...",
  displayName: null,
  selectedBadge: null,
  localScores: {
    "wicked-bites": {
      best: 1234,
      runs: [
        {
          score: 1234,
          completedAt: "2026-10-02T...",
          mode: null,
          ruleset: null,
          characterId: null
        }
      ]
    }
  }
}
```

The exact nesting may differ if the progression lane has a better compatible implementation, but these invariants must hold:

- no new uncoordinated storage namespace;
- no raw cartridge payload persistence;
- no mobile/full-game SaveManager read/write;
- score history is bounded;
- best is derived or maintained consistently;
- unsupported metadata remains `null`, not invented.

## API boundary

Expose score behavior through the existing guest-progression runtime.

Recommended shape:

```js
recordLocalScore({ gameId, score, mode, ruleset, characterId })
getLocalScores(gameId)
getLocalBest(gameId)
```

or equivalent methods under the current store.

`getSnapshot()` should expose enough score state for Profile and Leaderboards to render without reading storage.

## Score normalization

Wicked Bites bridge currently may send score as DOM text/string.

The persistence API must normalize before write.

Accept only an exact finite non-negative safe integer.

Examples:

- `123` -> valid
- `"123"` -> valid after strict decimal normalization
- `" 123 "` -> valid only if deliberately trimmed first
- `"123.5"` -> reject
- `-1` -> reject
- `Infinity` -> reject
- `NaN` -> reject
- `"12px"` -> reject
- unsafe integer -> reject

Never use permissive `parseInt()` on arbitrary payload text.

## Message trust boundary

The existing player host already validates:

- `event.source === frame.contentWindow`
- expected protocol
- expected `gameId`
- allowed message type

Only after those checks may `game:complete` reach the score API.

The score API must still validate its own arguments; it should not rely solely on the caller.

## Completion deduplication

The Wicked bridge itself has one-completion-per-result behavior, but the host/persistence seam should not assume every future cartridge does.

For V1:
- persist on `game:complete`, not every `game:score`;
- prevent duplicate persistence of the same completion within one active player session;
- reset that in-session guard when a real new run starts/retry occurs.

Do not dedupe separate legitimate runs merely because they have equal score values.

## History bounds

The full game donor keeps top 50 leaderboard entries.

For the website:
- keep at most 50 completed runs per game/scope;
- sort/rank on read or maintain deterministic order;
- reject pathological/unbounded game IDs/metadata.

This is enough for a local Leaderboard without creating unlimited browser growth.

## Clear/reset

Existing `store.clear()` must continue to clear all website-local guest progression, including local scores, using the same four-key isolation guarantee.

It must not clear:
- cartridge storage;
- full-game/mobile saves;
- unrelated origin storage.

## Economy separation

Recording a score must not directly grant:
- XP;
- Sparks;
- Treats;
- badges;
- entitlements;
- mobile currency.

If a future quest rewards a completed game, that reward comes through the explicit quest/event definition path, not the score store itself.

## Required tests

Add focused tests for:

1. strict score normalization;
2. one valid completion persists;
3. `game:score` does not persist completed history;
4. duplicate completion in one run is ignored;
5. same numeric score in a later run may persist;
6. best-score update;
7. bounded 50-run history;
8. corrupt local score state falls back safely;
9. future profile schema remains read-only;
10. clear/reset removes score state with the existing profile key;
11. no fifth website score storage key appears;
12. no unrelated game/mobile key is modified.

This keeps the final Leaderboards implementation inside the already-qualified guest-local progression architecture.
