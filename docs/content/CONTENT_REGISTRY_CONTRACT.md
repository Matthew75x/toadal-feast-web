# TOADAL FEAST — Content Registry Contract
**Purpose:** one structured source of truth for public website content instead of hard-coded page copy scattered across templates.

## Core rule
Routes/components render structured content. Mockup text is not automatically content authority.

## Stable identifiers
Every entity uses:
- `id`: stable machine identifier; never reused for a different entity
- `slug`: public URL segment
- `title` or `displayName`
- `publicationState`
- optional `summary`
- optional `art` references

Changing a title does not require changing the ID.

## Publication states
Content publication is separate from product feature state.

Allowed content states:
- `DRAFT`
- `PREVIEW`
- `PUBLISHED`
- `ARCHIVED`

A page may exist while its feature remains `COMING_SOON`.

## Entity types

### Game
Fields:
- id / slug / displayName
- public feature state
- summary / description
- cartridge ID if runnable
- controls/platform metadata
- key art / real screenshots
- related characters/worlds/stories

### Character
Fields:
- id / slug / displayName
- canonical asset IDs
- short biography
- traits/role
- related games/worlds/stories/media

Character copy must not invent canon from generated mockups.

### World / Location
World contains ordered locations.

Location:
- id / slug / title
- worldId
- summary/lore
- environment art
- related characters/stories/games
- discovery state hooks

### Story Series
Series:
- id / slug / title
- summary
- cover
- reading direction
- ordered arcs/volumes/chapters
- publication state

### Story Arc / Volume
- id / slug / seriesId
- title and explicit order within the series
- ordered chapter IDs
- publication state

### Chapter
Chapter:
- id / slug / seriesId
- number/display label
- title
- publication date when factual
- ordered page manifest
- optional thumbnail/cover
- optional arcId and previous/next chapter IDs
- publication state

### Story Page
- immutable id and chapterId
- explicit order within the chapter (never inferred from filenames)
- assetId and optional thumbnailAssetId
- pixel width/height and accessible description
- publication state

### Media
- id / slug / title
- kind: video / artwork / screenshot / download
- source/asset
- caption
- related content

### News / Devlog
- id / slug / title
- factual publication date
- author/byline only when real
- excerpt/body
- hero/media
- tags
- related content

### Quest / Reward / Badge / Collectible
These are progression-content definitions.
Runtime player state stays separate.

Do not put a player's earned/completed state into the content registry.

### Support Article
- id / slug / title
- category
- body
- updated date when factual

### Roadmap Item
- id / title
- public status
- description
- optional public time window only when owner-approved
- evidence/source note

### Legal Document
- id / slug / title
- approved body source
- effective/updated date
- publication state

## Relationships
Use IDs, not duplicated embedded copies.

Example:
`characterIds: ["toadal","princess-lily"]`

The build validates referenced IDs.

Story series, arcs, chapters, and pages are separate from reader progress. Public
PREVIEW records require an explicit `publicPreview: true`; DRAFT and ARCHIVED
records never enter the public story projection. A PUBLISHED chapter must point
only to a PUBLISHED series and a non-empty, unique ordered list of PUBLISHED
page records whose assets resolve through the asset catalog.

## Asset references
Prefer logical asset IDs/manifest references over fragile relative paths in content.

## Search
Only `PUBLISHED` and explicitly searchable `PREVIEW` content enters the public local-search index.

## Archive behavior
ARCHIVED content may remain addressable when required for old links, but is excluded from normal discovery unless explicitly configured.

## Build gate
Static export fails when:
- duplicate IDs/slugs exist within a route namespace;
- required references are missing;
- PUBLISHED content points to missing required assets;
- a public route points to DRAFT-only content.
