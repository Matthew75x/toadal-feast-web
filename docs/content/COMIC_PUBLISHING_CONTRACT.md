# TOADAL FEAST — Comic Publishing Contract

## Model
`Series → Arc/Volume (optional) → Chapter → Page`

The reader consumes a chapter manifest. It never infers order from filenames.

## Master assets
Original comic masters remain outside normal website Git history.

Keep:
- original high-resolution page master
- source/editable file when applicable
- immutable content/page ID

## Web derivatives
Generate optimized web derivatives with deterministic filenames based on stable page IDs.

Recommended derivative classes:
- reader desktop
- reader mobile if materially beneficial
- thumbnail

Do not create alternate narrative content in derivatives.

## Chapter manifest
Required:
- seriesId
- chapterId
- readingDirection
- ordered pages
- page asset IDs
- dimensions/aspect ratio
- alt/accessible description when available
- publication state

## Reader behavior
Required:
- next/previous page or panel
- next/previous chapter
- touch/swipe
- keyboard
- reading-direction aware navigation
- current page indicator
- bookmark/resume
- retry on failed page load
- adjacent-page preload
- farther pages lazy-load
- mobile safe area
- unobtrusive/minimized Toadal

## Progress
Store guest reading progress under:
`toadal:web:v1:reader-progress`

Progress record uses stable chapter/page IDs, not filenames.

## URLs
Published series/chapter URLs must remain stable if cover/page art changes.

## Publication
DRAFT chapters are never exported to the public discovery index.

PREVIEW is allowed only when deliberately public and visibly labeled.

## Large-scale hosting
The reader/content model must not assume pages live in Git forever.

Asset IDs should resolve through an asset manifest so storage can later move to object storage/CDN without changing chapter content manifests.

## Quality gate
A chapter cannot publish when:
- a page asset is missing;
- ordered page IDs duplicate;
- page order is empty;
- reader cannot recover from an image-load failure;
- next/previous chapter points to non-public content.
