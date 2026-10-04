# TOADAL FEAST Web — Guest Progression State Contract

## Goal
Implement Feast Pass/progression locally first without creating a dead-end data model for future accounts.

## Storage namespace
Primary local record:
`toadal:web:v1:feast-pass`

Related:
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:profile`

## State record
Every persisted record includes:
- `schemaVersion`
- `updatedAt`
- payload

## Core guest progression
Supported concepts:
- level
- XP
- Sparks
- Treats
- streak
- badges
- discoveries
- collectibles
- quest progress
- local game scores
- reading progress references

Exact balance/economy values are configuration, not schema.

## Separation
Content definitions and player state are separate.

Example:
Quest definition:
- quest ID
- title
- requirements
- reward definition

Player quest state:
- quest ID
- progress
- completion
- claimedAt

Do not duplicate full quest content into every player record.

## Time
Daily/weekly rotation logic must use explicit period IDs/dates.
Do not trust a persisted client "streak" integer without enough timestamp/period information to recalculate safely.

## Offline
Core guest progression must work offline after required static assets are available.

## Corruption/recovery
If a record cannot be parsed:
- do not crash the site;
- quarantine/ignore the invalid record;
- start safe defaults;
- preserve a diagnostic path when practical.

## Reset
A future privacy/settings control must be able to clear website-local guest progression independently of unrelated game/mobile data.

## Profile identity
Profile identity keeps badge and Title concepts separate:
- `selectedBadge` — website badge selection;
- `selectedTitle` — future cross-ecosystem Title selection.

A Title must never be silently aliased into the badge field.

## Game accomplishment bridge
The website may later accept a validated TOADAL FEAST game projection conforming
to `game-feast-pass-bridge.schema.json`. That projection is semantic input only:
it carries earned Feat/Title identities and explicitly says `not-synced`.

The current guest runtime does not ingest that projection and does not assign XP,
Sparks, Treats or other rewards from it.

## Online future
The local schema must not imply server authority.
Connected-account sync is a separate future capability.
