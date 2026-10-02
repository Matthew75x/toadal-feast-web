# Editorial / Discovery Lane Handoff

Branch: `lane/editorial-roadmap-devlog-20261002`

## Lane output

- Expanded `pages/media.json` with real gameplay captures, canonical world and character art, and finished empty states for trailer, video, shorts, wallpaper, and download categories.
- Expanded `pages/news.json` with featured/latest/category/recent structure and direct Devlog and Roadmap paths. The registry still has no published news entries; no posts, dates, bylines, or trending counts were added.
- Added `pages/news-devlog.json` for `/news/devlog/`, with article body, media, pull quote, related-content, previous/next, and Roadmap slots. All publication slots are honestly empty.
- Added `pages/roadmap.json` for `/roadmap/`, reflecting the existing roadmap registry facts and the PREVIEW, COMING_SOON, and PLANNED labels without dates.
- Reviewed `pages/support.json`; its help search, FAQ/category cards, and contact/legal paths already meet the bounded manifest scope. It is unchanged.

## Required integrator changes

1. Register both route-local pages in `studio-project/toadal-feast-website/pages/index.json`:

   | id | route | file | title |
   |---|---|---|---|
   | `page.news-devlog` | `/news/devlog/` | `pages/news-devlog.json` | `Devlog & Article · TOADAL FEAST` |
   | `page.roadmap` | `/roadmap/` | `pages/roadmap.json` | `Roadmap · TOADAL FEAST` |

2. Regenerate the local search index after route registration with `node scripts/build-local-search-index.mjs` as part of the integrator's final build. The builder discovers registered page records, assigns News/Roadmap groups from their routes, and writes both the source search index and `dist` output; this lane did not run it or touch `dist/**`.

## No shared changes required

- `collections/navigation.json`: the existing News and Media links remain; News now links directly to Devlog and Roadmap, and Search will include the new pages once routes are registered. No navigation edit is required for these working paths.
- `content/registry.json`: leave the empty `news` array and existing `roadmapItems` unchanged. Roadmap cards reproduce those facts and statuses.
- `pages/search.json`, `collections/advanced-code.json`, and search runtime: no changes required; existing category and index behavior supports News and Roadmap.
- `assets/index.json`: all images used here are already catalogued. The route pages use current WebP assets for gameplay, world scenes, and canonical characters.
- `reference/assets/css/site.css`: no new hooks required. Markup reuses existing `.wo002-detail-*`, `.detail-fact`, `.discovery-band`, `.app-gameplay-*`, `.media-character-*`, `.story-panel`, and `.story-empty-card` rules.

No shared files or generated `dist/**` files were modified in this lane.
