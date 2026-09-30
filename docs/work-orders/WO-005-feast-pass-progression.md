# WO-005 — Feast Pass / Progression Family
**Status:** HOLD until WO-004 PASS

Pages:
- Feast Pass
- Quests
- Rewards
- Leaderboards
- Player Profile

## Read first
- `docs/implementation/LOCAL_STATE_NAMESPACE.md`
- `docs/implementation/PROGRESSION_STATE_CONTRACT.md`
- `docs/implementation/progression-state.schema.json`
- `docs/implementation/GUEST_TO_ACCOUNT_MIGRATION.md`
- `docs/content/CONTENT_REGISTRY_CONTRACT.md`
- `docs/content/PUBLICATION_RULES.md`

## Required
- durable local guest state;
- XP/level/Sparks/Treats/streak data model;
- badges/discoveries/collectibles;
- quest definitions separate from player quest state;
- daily/weekly period-aware logic;
- local score/profile views;
- corruption-safe defaults;
- migration-ready interfaces;
- local/demo/planned state visibly distinguished for online features.

## Truth rules
Do not:
- invent permanent economy values from mockups;
- imply cross-device account sync;
- imply global/friends leaderboards are live;
- treat local guest identity as a registered account.

## Evidence
- schema validation
- persistence/reload tests
- reset/corrupt-state tests
- daily/weekly boundary tests where implemented
- responsive/accessibility screenshots
- no collision with mobile/game save namespaces

## Stop
STOP after progression family QA/evidence.
Do not start WO-006.
