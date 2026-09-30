# WO-003 — World + Characters
**Status:** HOLD until WO-002 PASS

## Goal
Implement the World/Character family using structured canonical content and current approved character art.

Pages:
- World Hub
- Characters Hub
- Toadal Character Profile

## Read first
- `docs/content/CONTENT_REGISTRY_CONTRACT.md`
- `docs/content/content-registry.schema.json`
- `docs/content/PUBLICATION_RULES.md`
- `docs/design/MASCOT_IDENTITY_GUARDRAILS.md`
- `docs/implementation/CANONICAL_ASSET_SOURCE_MANIFEST.json`

## Required
- World/Location/Character entities come from content registry;
- referenced IDs validate;
- WorldCard / CharacterCard reusable components;
- canonical Toadal/Princess Lily/other approved character assets;
- discovery-state hooks separate from content definition;
- related games/stories/media via IDs;
- mobile map/card fallback;
- generated mockup lore/character descriptions are not copied as canon.

## Evidence
- content validation
- canonical asset audit
- desktop/mobile screenshots
- broken-reference check
- accessibility smoke
- static export/base-path check

## Out of scope
- invented canon
- generated mascot substitutions
- account backend
- progression balancing
- unrelated routes
- production deployment

## Stop
STOP after these three pages and shared family components are implemented/evidenced.
Do not start WO-004.
