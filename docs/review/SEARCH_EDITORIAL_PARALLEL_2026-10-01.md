# Search / Editorial Parallel Lane — 2026-10-01

## Result

**SOURCE DONOR PASS.** This lane is intentionally isolated from the active Stories convergence lane and from the dirty editorial-discovery worktree.

- Base: `f7b556fe0a6392fc428942f471eeda13e42ca0a4`
- Branch: `parallel/search-editorial-closure-20261001`
- Worktree: `C:\ReleaseOps\toadal-feast-web-search-editorial-parallel-20261001`
- Production, `main`, and `staging/live-visual`: untouched
- Home LOCK_VISUAL composition: untouched

## Implemented

- Added a source-defined `/search/` route with a local-only search UI.
- Added `scripts/build-local-search-index.mjs` and generated the source search index.
- Added `assets/js/site-search.js` runtime loading only on `/search/` and `/support/`.
- Added support-page local filtering without any backend or remote search service.
- Added real support/media anchors used by search results.
- Corrected roadmap discovery targets so no search result points at nonexistent `/roadmap/`.
- Added a dedicated `verify-search-discovery.mjs` contract.

Current source index: **46 entries**:
- Characters: 9
- Help: 6
- Media: 5
- News: 1
- Pages: 20
- Roadmap: 5

Search result text is rendered with DOM `textContent`; query text is not interpolated as HTML.
## Fresh qualification

- `verify-search-discovery.mjs`: **PASS**
- Home visual contract: **29/29 PASS**
- Navigation truth: **28 implemented routes, 0 unresolved targets**
- Character content registry: **PASS**
- Gated ecosystem routes: **PASS**
- Guest progression: **17/17 PASS**
- Cartridge storage isolation: **PASS**
- Manifest compliance verifier: **PASS** (30 manifest rows, 28 implemented route records, 23 cross-cutting requirements)
- `node --check` on search builder/runtime/verifier: **PASS**
- Embedded advanced-code JavaScript parse: **PASS**

Broader legacy WO-002 remains **7/9 PASS** for the same two known unrelated debts:

1. The old test still requires the historical eight-route registry instead of validating the WO-002 subset.
2. Wicked Bites package bytes are `1,469,109` while the stale snapshot expects `1,467,205` (+1,904 bytes).

No Wicked Bites gameplay or package source was changed by this lane.

## Deliberate boundaries

The approved Home search field remains disabled. Activating or visually changing it here would reopen the Home visual contract while owner LOCK_VISUAL acceptance is still outstanding. The local search implementation is prepared as a donor so it can be wired into Home deliberately after convergence/visual acceptance.

`dist/` is intentionally not committed from this lane. The certified Studio 1.4.2 install used by earlier Codex qualification is not present on the currently reachable Windows account, so I did not substitute a hand-built export for the authoritative Studio render.

## Integration handoff

After the Stories/gated convergence candidate is green:

1. Bring this donor source forward onto that exact candidate.
2. Rerun `node scripts/build-local-search-index.mjs` so Manga/Reader and any newer routes are indexed from the integrated registry.
3. Run authoritative Studio 1.4.2 validate/render.
4. Run base-path, static-link, search-discovery, full browser matrix, robots, manifest, and legacy regression checks.
5. Reconcile manifest row 23 from actual integrated evidence.
6. Decide Home search activation as part of the owner visual review rather than silently changing the locked Home treatment.

No deployment occurred.
## Pre-merge conflict map against Stories donor

A read-only `git merge-tree --write-tree` comparison against Stories donor `8b681eeb31a56c7bb69133664b7ce5b5574aeeda` found a small, understandable conflict surface:

- `studio-project/toadal-feast-website/collections/advanced-code.json` — preserve both Stories publishing loader logic and this local-search loader.
- `studio-project/toadal-feast-website/content/registry.json` — preserve Stories series/chapter schema/content fields plus this lane's media/help/roadmap records.
- `studio-project/toadal-feast-website/reference/assets/css/site.css` — retain both Stories styles and the isolated search/support styles.
- `dist/assets/css/site.css` — generated conflict; resolve by authoritative Studio regeneration rather than hand-merging generated CSS.

`pages/index.json` auto-merges in the hypothetical merge, so `/manga/`, `/reader/`, and `/search/` do not inherently collide.

After reconciliation, rerun both content builders (`build-story-content.mjs` and `build-local-search-index.mjs`) before Studio render so neither generated data projection is stale.