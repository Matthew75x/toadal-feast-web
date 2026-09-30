# WO-004 — Stories + Manga + Reader
**Status:** HOLD until WO-003 PASS

## Goal
Implement first-class structured story/comic publishing and reader behavior without putting raw master archives into normal Git history.

Pages:
- Stories Hub
- Manga Series
- Comic Reader

## Read first
- `docs/content/CONTENT_REGISTRY_CONTRACT.md`
- `docs/content/content-registry.schema.json`
- `docs/content/COMIC_PUBLISHING_CONTRACT.md`
- `docs/content/PUBLICATION_RULES.md`
- `docs/implementation/LOCAL_STATE_NAMESPACE.md`
- `docs/implementation/GITHUB_PAGES_ROUTING_CONTRACT.md`

## Required
- Series → Arc/Volume optional → Chapter → Page;
- stable IDs/slugs;
- explicit reading direction;
- ordered page manifests;
- thumbnails/web derivatives;
- bookmark/resume using stable page IDs;
- previous/next page and chapter;
- touch + keyboard;
- adjacent preload, farther lazy load;
- reader image error/retry;
- mobile safe area;
- Toadal unobtrusive/minimized;
- static URLs materialized for published content.

## Asset rule
Comic masters stay outside normal website Git.
Website uses approved derivatives resolved by asset manifest.

## Evidence
- schema/content validation
- sample published chapter renders
- missing-page/error recovery
- keyboard/touch smoke
- responsive screenshots
- static export/base-path check
- no master archive accidentally tracked

## Out of scope
- mass-generating story content
- choosing CDN provider
- account backend
- unrelated routes
- production deployment

## Stop
STOP after Stories/Manga/Reader family is implemented/evidenced.
Do not start WO-005.
