# TOADAL FEAST Web — Local State Namespace Contract

## Goal
Prevent guest web progression, UI preferences and reader state from colliding with legacy game saves or future authenticated storage.

## Namespace
All new website-owned browser storage keys should begin with:

`toadal:web:v1:`

Examples:
- `toadal:web:v1:guest-id`
- `toadal:web:v1:feast-pass`
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:reader-progress`
- `toadal:web:v1:companion-minimized`
- `toadal:web:v1:recent-searches`
- `toadal:web:v1:preferences`

Do not reuse mobile/game runtime save keys.

## Schema versioning
Each structured record must include:
- `schemaVersion`
- `updatedAt`
- payload

Migrations must be additive/fail-safe.
Unknown future fields must not crash the site.

## Guest identity
Generate a local opaque guest identifier only when needed for local progression.
Do not present it as an account.

## Account future
Future account migration must:
1. read guest-local state;
2. offer/perform an explicit migration path;
3. avoid silently replacing newer progress;
4. record migration version/result.

## Privacy
Do not store:
- passwords
- OAuth tokens
- unnecessary sensitive personal data
in this namespace.

## Reset
Provide a future clear-local-progress/privacy control before connected accounts launch.
