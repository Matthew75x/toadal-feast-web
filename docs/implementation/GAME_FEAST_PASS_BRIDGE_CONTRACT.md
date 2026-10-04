# Website Acceptance Contract — TOADAL FEAST Game → FEAST PASS

**Status:** schema/merge guardrail only; no ingestion runtime  
**Date:** 2026-10-03

## Current reality

The website's Feast Pass is browser-local guest progression.

The mobile/full game has a separate local save authority.

There is currently no authenticated canonical account service joining them.

Therefore this website branch does **not** read the game save, call the game,
consume bridge events, or award website progression from game accomplishments.

## Accepted future input shape

A future authenticated import/reconciliation service may accept only a validated
projection conforming to:

`docs/implementation/game-feast-pass-bridge.schema.json`

The game-side source intentionally marks every projection:

- `authority: local-game-projection`
- `syncStatus: not-synced`

Those labels are not optional presentation copy; they describe the current
authority boundary.

## What the projection means

The bridge can represent:

- earned FEAST BOOK Feat IDs;
- earned FEAST BOOK Set IDs;
- Main/Mastery counts;
- earned FEAST TITLE IDs;
- explicit selected Title;
- effective display Title;
- deterministic accomplishment IDs.

It does **not** carry reward instructions.

## What the website must not infer

The website must not turn a bridge accomplishment directly into:

- XP;
- Sparks;
- Treats;
- streak progress;
- premium/soft currency;
- an entitlement;
- a quest reward;

unless a future **server-authoritative, versioned definition** explicitly maps
that accomplishment and guarantees idempotency.

The current `progression-definitions.js` is starter configuration and is not
that authority.

## Badge versus Title

`profile.selectedBadge` and `profile.selectedTitle` are separate identity
concepts.

Never map:

`game Title → selectedBadge`

merely because a badge field already exists.

## Future reconciliation

Before bridge ingestion can ship, define:

1. authenticated account identity;
2. canonical server progression schema/version;
3. accepted game manifest versions;
4. validation/trust policy for local game projections;
5. deterministic accomplishment de-duplication;
6. guest + account merge policy;
7. selected Title conflict policy;
8. reward mapping registry, if any;
9. rollback/retry behavior;
10. user-visible migration/sync result.

## Recommended merge behavior

After validation:

- earned Feat IDs: set union;
- earned Title IDs: set union;
- selected Title: explicit conflict policy, never silent timestamp guessing;
- completion counts: recompute from accepted canonical IDs rather than blindly
  taking the larger client number;
- currencies: **outside this bridge**;
- website quests/streaks: **outside this bridge** unless a future rule says otherwise.

## Idempotency

Deterministic IDs such as:

- `game:feat:arcade.grand-feast`
- `game:title:arcade-explorer`

are suitable de-duplication keys.

Receiving the same valid projection repeatedly must not generate repeated value.

## Current UI wording

Until account sync exists, website UI should describe preservation/sync as
planned or coming later. It must not say game progress is currently synchronized.
