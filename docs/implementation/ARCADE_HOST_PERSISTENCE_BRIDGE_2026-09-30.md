# Arcade Preview Host-Owned Persistence Bridge

Date: 2026-09-30  
Status: implementation authority for the final web preview persistence boundary.

## Goal

Resolve the conflict between:

- opaque-origin cartridge isolation;
- the old cartridge-local `froggyFeast*` storage model; and
- the final web preview's requirement to persist Standard best score/unlocks locally.

The website host owns persistence. The cartridge remains sandboxed and receives only the minimal preview state it needs.

## Existing protocol

Keep the existing `toadal.game.v1` message family.

Existing host/cartridge messages remain valid.

This document adds a narrow persistence subprotocol; it does not create a second incompatible bridge.

## Security model

Because an opaque sandbox may report message origin as `null`, origin-string checks alone are not enough.

The host must validate:

1. `event.source === iframe.contentWindow`;
2. expected protocol/version;
3. expected cartridge/session identifier;
4. exact message type allow-list;
5. bounded schema/type/range validation for every payload.

The cartridge must likewise accept host messages only from `window.parent` and only from the initialized session/protocol.

Unknown messages are ignored.

Never expose an RPC such as:
- get arbitrary localStorage key;
- set arbitrary localStorage key;
- enumerate host storage.

## Namespace

Host storage prefix:

`toadal:game:toadal-feast-arcade-preview:v1:`

A single JSON document is preferred over many loosely coordinated keys.

Suggested key:

`toadal:game:toadal-feast-arcade-preview:v1:state`

## Persisted state

Version 1 state:

```json
{
  "schemaVersion": 1,
  "bestScoreOverall": 0,
  "bestScoreByCharacter": {
    "toadal": 0,
    "classic": 0,
    "pelican": 0
  },
  "completedStandardRuns": 0,
  "unlockedCharacterIds": ["toadal"],
  "selectedCharacterId": "toadal",
  "selectedExperienceId": "standard",
  "settings": {}
}
```

Optional future fields must be ignored by older adapters rather than causing data loss.

Do not persist:
- coins;
- mobile achievements;
- mobile inventory;
- mobile cosmetics;
- mobile quest state;
- app account identifiers;
- raw mobile save data.

## Host init

The existing `host:init` message should carry the validated preview snapshot or a reference payload field dedicated to preview state.

Conceptually:

```text
host:init
  protocol = toadal.game.v1
  cartridge = toadal-feast-arcade-preview
  sessionId = random per iframe mount
  previewState = validated state snapshot
```

The host is authoritative.

If local state is missing/corrupt:
- use safe defaults;
- do not block play;
- do not attempt to import `froggyFeast`.

## Cartridge -> host commit

Add one narrow message:

`game:preview-state`

Payload contains only a candidate partial update.

Allowed fields:
- runScore
- characterId
- completedStandardRun
- selectedCharacterId
- selectedExperienceId
- settingsPatch

The cartridge should report gameplay facts, not decide durable entitlement policy.

Example:

```json
{
  "type": "game:preview-state",
  "protocol": "toadal.game.v1",
  "sessionId": "...",
  "payload": {
    "runScore": 742,
    "characterId": "toadal",
    "completedStandardRun": true
  }
}
```

## Host-owned progression calculation

The host derives durable state.

For a completed Standard run:

1. clamp/validate score;
2. update overall best;
3. update per-character best;
4. increment completed Standard runs exactly once for that run;
5. ensure Toadal remains unlocked;
6. unlock Classic when completedStandardRuns >= 1;
7. unlock Gully when bestScoreOverall >= 600 OR completedStandardRuns >= 3;
8. persist atomically;
9. return the new validated snapshot.

Do not trust the cartridge to send:
`unlockedCharacterIds: ["everything"]`.

## Host -> cartridge acknowledgement

Add:

`host:preview-state`

This sends the authoritative post-commit snapshot back to the cartridge/player UI.

The website shell can use the same snapshot to render:
- NEW BEST;
- newly unlocked character;
- progress to Gully;
- selected character;
- experience chooser state.

## Idempotency

Each completed run should have a run/session result identifier.

Host should remember the most recently committed run id(s) for the active mount or otherwise reject duplicate completion commits caused by:
- retrying `postMessage`;
- iframe race;
- result-screen remount;
- visibility/reload edge cases.

Do not increment `completedStandardRuns` twice for the same run.

## Reset

If the preview later exposes a reset action:

- reset only the preview namespace;
- do not call `localStorage.clear()`;
- do not remove `toadal:web:v1:` website state;
- do not touch `froggyFeast*`.

No reset UI is required merely to close ARC-QUAL-01.

## FMF / Zen

5 Minute Feast and Zen do not need to participate in Standard character-unlock progression.

Their result summaries may optionally feed:
`bestScoreByExperience`
later, but that is not required for the first public preview.

Do not let FMF/Zen runs increment `completedStandardRuns`.

## Failure behavior

If host persistence fails:
- gameplay remains usable;
- result screen may say **Best this session**;
- emit/report a bounded persistence failure;
- do not silently claim durable progression.

If persistence is healthy:
- public copy may say local preview progress is saved on this browser.

## Qualification

Before final integration, prove:

1. clean origin starts with default preview state;
2. Standard result survives reload;
3. first completed Standard run unlocks Classic;
4. score >= 600 unlocks Gully;
5. three completed Standard runs also unlock Gully;
6. duplicate completion message does not double-increment;
7. corrupt JSON recovers to safe defaults;
8. legacy `froggyFeast*` values remain byte-for-byte/logically unchanged;
9. reset removes only preview-owned state;
10. second tab cannot trivially overwrite a newer state with an older snapshot;
11. malformed/untrusted message payload is rejected;
12. a message from a different window/source is rejected.

## Cross-tab safety

For version 1, use one of:

- revision number + compare-before-write;
- timestamp/revision with merge rules for monotonic fields;
- short host-side transaction/re-read before commit.

At minimum:
- best scores use max();
- completed runs never move backward;
- unlocked set never loses a legitimately earned character because another tab had stale state.

## Promotion rule

Stage A technical cartridge qualification may remain session-only.

ARC-INTEGRATE-01 cannot call the final preview persistence-complete until this host-owned bridge (or an equivalent equally isolated design) passes the qualification list above.
