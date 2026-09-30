# TOADAL FEAST — Local Search Index Contract

## Goal
Launch useful Search without waiting for a backend search service.

## Build-time index
Static build generates a compact local index from the content registry.

Eligible:
- PUBLISHED content
- explicitly searchable PREVIEW content

Excluded:
- DRAFT
- private/internal fields
- archived content unless explicitly retained for old-link lookup
- legal body text unless useful/approved for search

## Searchable entity types
- games
- characters
- worlds/locations
- stories/chapters
- media
- news/devlogs
- support articles
- roadmap items when public

## Indexed fields
- title/displayName
- aliases
- summary
- tags
- entity type
- route

Do not index fabricated mockup copy.

## Ranking
Initial ranking can be deterministic/local:
1. exact title/alias
2. title prefix
3. title token match
4. tag match
5. summary token match

No opaque "trending" rank unless backed by real analytics.

## Result state
Each result includes:
- entity type
- public state/publication state
- title
- summary
- route
- optional thumbnail

## Query storage
Recent searches may be local-only under:
`toadal:web:v1:recent-searches`

Do not send queries externally unless analytics/privacy configuration explicitly allows it.

## Empty/error
Local search must provide:
- no-results recovery suggestions
- category shortcuts
- no dependency on network/API availability for core index
