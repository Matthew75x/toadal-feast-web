# Stories Publishing Stack — Manifest Rows 8–10

**Result: PASS for the Stories/Manga/Reader publishing architecture and truthful empty state.** No story or manga content was invented, and no deployment was performed.

## Revision and environment

- Repository: `Matthew75x/toadal-feast-web`
- Base branch / SHA: `integration/manifest-home-characters-progression-20261001` / `4f01ee29bddc1d25f0cf4e304057e10e93a51d38`
- Work branch: `work/stories-publishing-stack-v2-20261001`
- Final commit: the commit containing this report; its exact SHA is returned in the delivery message (the commit cannot embed its own SHA without changing that SHA).
- Node.js: `v22.23.2`; npm: `10.9.8`.
- TOADAL Studio: `toadal-studio@1.4.2`; project kind `generic-site`, project plugins `[]`.
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-stories-publishing-v2\studio-project\toadal-feast-website\project.json`.
- Final Studio project-tree SHA-256 (excluding generated build/history): `64ae0abae31f4ae4e6c5aa5e828149e88bbfa206c937f52ecd8625722bf4b07b`.

## Manifest rows and visual authority

- **8 — Stories / Comics Hub:** `/stories/`
- **9 — TOADAL FEAST Manga Series:** `/manga/` reusable series template
- **10 — Comic / Manga Reader:** `/reader/` reusable reader shell
- Approved layout references used: `assets/reference/mockups/batch-1/08_STORIES_COMICS_HUB.png`, `09_MANGA_SERIES.png`, and `10_COMIC_READER.png`. Their sample text/art composition was treated as visual direction, not story canon.

The hub has featured/latest/progress states and Comics, Manga, Shorts, Lore, and Behind the Scenes shelves. The series template accepts `?series=<id-or-slug>`; the reader accepts `?series=<id-or-slug>&chapter=<id-or-slug>`. The reader also recognizes `/stories/:seriesId/:chapterId/read/`, but this lane does not materialize per-record static HTML paths. The current public routes are the three templates above; record-specific route files remain future work when approved content exists.

The public registry currently contains **zero** `storySeries`, `storyArcs`, `chapters`, or `storyPages`. Consequently, the public projection is empty. Canonical environment/character art is explicitly labeled as discovery artwork, not a manga cover or comic page. The safe Characters/World links do not assert unapproved story relationships.

## Content and publication behavior

- Structured content is `Series → optional Arc/Volume → Chapter → Page`, separate from player and reader state. Records use stable IDs/slugs, explicit order, asset IDs, dimensions/alt text, relationships, direction, and publication metadata.
- `scripts/build-story-content.mjs` validates registry references, stable IDs/slugs, explicit unique page order, asset existence and containment (including symlink escape rejection), dimensions, alt text, and safe chapter navigation. Its projection contains only referenced assets.
- `DRAFT` and `ARCHIVED` records are excluded. `PREVIEW` is public only when `publicPreview: true` and remains visibly labeled. Reader-loadable chapters require a `PUBLISHED` series and explicitly ordered `PUBLISHED` pages.
- The public JSON projection is fail-closed: it copies only allowlisted public series/arc/chapter/page fields, filters relationships and assets, preserves approved `coverAlt`, maps the schema's `chapterLabel` to the reader runtime's `displayLabel`, and preserves ordering/direction metadata. Regression tests inject private/editorial fields on every record type and prove those fields are absent from serialized output.
- No synopsis, creator, date, chapter count, readership count, lore, cover, or page was fabricated. Actual approved series/chapter/page records and derivatives remain the content gap.

## Reader and bookmark behavior

- Page order is read only from `pageIds`; filenames are never sorted to infer order. LTR/RTL keyboard and swipe direction, previous/next controls, page count/progress, thumbnails, adjacent preload, lazy thumbnails, image retry, and fullscreen are implemented.
- Empty-reader page/chapter/save controls remain disabled. Fullscreen’s visible text and accessible name stay synchronized.
- Reader progress is isolated under `toadal:web:v1:reader-progress`, uses stable series/chapter/page IDs, and preserves malformed stored data rather than overwriting it. The browser fixture verified guest progression keys were unchanged by bookmark writes.
- The existing companion engine was not rewritten. Stories/Manga/Reader resolve the approved `stories-media-thinking.webp` artwork; the Reader companion defaults to minimized.

## Validation and export evidence

- Studio 1.4.2 `npm run validate`: **PASS**, valid, 0 errors / 0 warnings.
- `toadal.inspect(scope=workspace)`: **PASS**, 22 pages / 4 games / 41 assets / 32 components; validation clean. Graph: 112 nodes / 70 edges / 4 existing dangling type references.
- `node scripts/build-story-content.mjs --check`: **PASS**, the committed public projection exactly matches the current registry.
- Final `npm run render`: **PASS**, 103 files into `dist/` from the exact project above.
- GitHub Pages base path `/toadal-feast-web/`: helper rewrote 23 HTML files / 643 URLs; `verify-pages-basepath.mjs`: **PASS**; `verify-static-links.mjs`: **PASS**, 23 HTML files.
- Static Studio export: **PASS**, 103 ZIP entries, 38,079,316 bytes, SHA-256 `4ECC84296FCAB18B9B16122E1D478BD5AE94B1918C7BCFAD5D0F798CEEE69C27`. ZIP integrity passed. Verified `index.html` (57,291 bytes), `404.html` (40,091 bytes), Stories/Manga/Reader routes, story JS/data, and `/characters/toadal/` output.
- `toadal.checkpoint(mode=preflight)`: **PASS**, `ok: true`; generated handoff remains outside the repository.
- Home verifier: **PASS**, 62 checks. Character content registry: **PASS**. Navigation truth: **PASS**, 22 routes / 18 nav targets / 0 unresolved. Manifest compliance ledger: **PASS**. Guest progression tests: **17/17 PASS**. Cartridge storage isolation: **PASS**.
- Focused story/content/base-path and guest-progression tests: **38/38 PASS**, including the 9 story projection tests and the fail-closed allowlist regression. The exact route-registry allowlist test, updated for the accepted integration routes plus `/manga/` and `/reader/`, also passes.
- Chromium browser QA on final Pages-prefixed `dist/`: **PASS (11 checks)** at 1366×900, 390×844, and 320×800 for all three routes. All returned HTTP 200; runtime JS and registry JSON loaded beneath the project prefix; no console/page/HTTP errors or horizontal overflow. The companion art/minimized state, honest empty state, disabled controls, fullscreen accessible name, and Home exclusion were checked.
- A test-only in-memory published manifest (not written to the exported registry) exercised Manga selection, real reader page changes with ArrowRight/ArrowLeft and buttons, and bookmark persistence. Saved IDs were correct; seeded guest progression keys remained byte-for-byte unchanged.
- Screenshots: [Stories desktop](evidence/stories-desktop-empty.png), [Stories mobile](evidence/stories-mobile-empty.png), [Manga desktop](evidence/manga-desktop-empty.png), [Manga mobile](evidence/manga-mobile-empty.png), [Reader desktop](evidence/reader-desktop-empty.png), [Reader mobile](evidence/reader-mobile-empty.png). They show the real public empty state; test-fixture content is not pictured or packaged.

### Existing unrelated test caveat

The broader legacy `scripts/wo002-contract.test.mjs` run exposed its Wicked Bites package-size snapshot expecting `1,467,205` bytes while the unchanged current package sources profile at `1,469,109` bytes. No game/cartridge source was changed to mask this stale assertion; Arcade was not re-certified. The route-list assertion in that file was updated narrowly for the current integration baseline and Stories routes and passes in isolation.

## Scope boundary and remaining gap

No Home composition, guest progression schema/behavior, character authority, or game cartridge source was changed. The Toadal profile’s `referenceFile` was corrected only to emit its already-declared `/characters/toadal/` path, preserving the pre-existing route in the regenerated static export. `main`, `staging/live-visual`, the integration base branch, production/DNS, and GitHub Pages were untouched. No Pages workflow was triggered and no deployment occurred.

The only product-content gap is the absence of approved story/manga records and page derivatives. Until those arrive, readers remain empty and unpublished material cannot leak into the public projection.
