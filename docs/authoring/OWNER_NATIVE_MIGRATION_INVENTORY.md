# Owner-native migration inventory

Status: the canonical Studio project has native authoring across all 33 registered routes. This is a current source inventory and work-status note; it does not define acceptance criteria or claim final website qualification.

## Current project shape

`studio-project/toadal-feast-website/project.json` selects generated rendering. Its page registry has 33 Studio-generated routes, each represented by a Studio page record. The page component trees use version-1 typed owner properties and nested children. The 404 route already uses `core.content-section` and `layout.grid`; it remains a native structured page and is not an HTML-blob exception.

The historical pre-conversion pages commonly stored full page sections in `core.rich-text.props.html`. That was the prior source shape, not the current authoring inventory. The current native trees contain 2,732 component nodes across the 33 routes. Exactly three small, locked `core.rich-text` runtime leaves retain their original protected fragments. All other page content is represented in native typed properties and nested components; there is no shadow HTML blob alongside native page trees.

Top-level component IDs remain stable across the migration. The following is the current route-to-top-level-ID map; nested content is selectable in Studio Layers and retains typed properties such as `text`, `asset`, `alt`, `href`, `target`, semantic attributes, layout mode, and `children`.

| Route | Stable top-level component IDs (type) |
| --- | --- |
| `/` | `component.home.skip` (container), `component.home.hero` (container), `component.home.games-intro` (container), `component.home.games` (grid), `component.home.feast-pass` (container), `component.home.today` (container), `component.home.interactive-discovery` (container), `component.home.discovery` (container), `component.home.app` (container), `component.home.whats-next` (container), `component.home.companion` (container) |
| `/404.html` | `component.404.main` (`core.content-section`), `component.404.recovery` (grid) |
| `/play/` | `component.muogc2on.jbosap`, `component.play.manifest-links` |
| `/games/wicked-bites/` | `component.muogc38s.ly16t7`, `component.game-wicked-bites.manifest-links` |
| `/games/claw-feed-gulper/` | `component.muogc3tg.5k94yf` |
| `/games/toadal-tower-defense/` | `component.muogc4gl.i0xsth` |
| `/games/froggy-fruity-bash/` | `component.muogc5bb.tnywdf` |
| `/player/wicked-bites/` | `component.muogc5wx.80e0fg`, `component.player-wicked-bites.score-session`, `component.player-wicked-bites.challenge-status` |
| `/world/` | `component.live-world.rich-text`, `component.world.map-discovery` |
| `/characters/` | `component.characters.rich-text` |
| `/characters/toadal/` | `component.toadal-profile.rich-text` |
| `/stories/` | `component.stories.publishing-hub` |
| `/manga/` | `component.manga.series-preview` |
| `/reader/` | `component.comic.reader-preview`, `component.comic.reader-related-links` |
| `/media/` | `component.live-media.rich-text`, `component.media.related-routes` |
| `/feast-pass/` | `component.guest-feast-pass.rich-text` |
| `/feast-pass/quests/` | `component.guest-quests.rich-text` |
| `/feast-pass/rewards/` | `component.guest-rewards.rich-text` |
| `/profile/` | `component.guest-profile.rich-text` |
| `/news/` | `component.manifest-news` |
| `/search/` | `component.search.rich-text` |
| `/support/` | `component.manifest-support` |
| `/app/` | `component.live-app.rich-text`, `component.app.puzzle-abilities`, `component.app.infinite-mode`, `component.app.icon-trailer-availability` |
| `/account/` | `component.account.rich-text`, `component.account.live-guest-status` |
| `/community/` | `component.community.rich-text`, `component.community.guided-exits`, `component.community.feed-guidelines` |
| `/store/` | `component.store.rich-text`, `component.store.guided-exits`, `component.store.updates` |
| `/contact/` | `component.contact.gated-preview`, `component.contact.unavailable-guide` |
| `/about/` | `component.about.rich-text`, `component.about.mission-stories` |
| `/coming-soon/` | `component.coming-soon.rich-text` |
| `/legal/` | `component.legal.rich-text`, `component.legal.last-updated-slot` |
| `/news/devlog/` | `component.manifest-news-article` |
| `/leaderboards/` | `component.leaderboards.main` |
| `/roadmap/` | `component.manifest-roadmap` |

Unqualified top-level IDs in this compact table use the native layout-container type. Home's game collection remains a selectable grid. Nested page content and repeated records are not stored as flattened page HTML.

## Protected runtime leaves

Only these three exact legacy fragments remain, each as a locked, read-only specialized runtime leaf. Their route, original parent ID, fragment shape, and code resources are pinned in `scripts/convert-owner-native.mjs` and covered by `scripts/owner-native-runtime.test.mjs`.

| Route | Stable source parent → protected runtime leaf | Kept behavior |
| --- | --- | --- |
| `/` | `component.home.interactive-discovery` → `component.home.interactive-discovery.742f9e5d1458.external-script` | First-party Home discovery loader and its existing interaction hooks. |
| `/player/wicked-bites/` | `component.muogc5wx.80e0fg` → `component.muogc5wx.80e0fg.a6b9a7e442cf.isolated-frame` | Opaque-origin sandboxed Wicked Bites preview frame. The frame does not gain `allow-same-origin`. |
| `/reader/` | `component.comic.reader-preview` → `component.comic.reader-preview.a0eec156f188.dynamic-image` | Dynamic reader image slot populated from published story data. |

The compatibility boundary is deliberately limited to those leaves. It is not permission for additional hand-authored HTML, script-bearing content, or general-purpose runtime fragments.

## Characters pilot contract

The bounded Characters pilot has real Studio UI and export evidence recorded in [CHARACTERS_OWNER_PILOT.md](CHARACTERS_OWNER_PILOT.md). Its source page is now a 167-node nested native tree. Preserve the seven approved discovery IDs (`toadal`, `princess-lily`, `genie-sweet`, `genie-fruity`, `genie-savoury`, `gulper`, `gully`), the unnamed non-discoverable future slot, and the existing progression and companion hooks.

The native tree and compiled DOM still need to retain: the page root `article.character-family-page.characters-page[data-progression-page="characters"]`; all five named radio filters and their label/name/check state; group-classified cards; one discovery control and matching polite live status per approved card; the discovery summary projection; companion toggle/panel/image/speech and context data; and heading, breadcrumb, image-alt, keyboard focus, and navigation semantics. The site verifier source now projects nested components through the pinned owner renderer, while final browser/site qualification remains separate.

## Current qualification and remaining work (2026-10-02)

The source migration is closed: all 33 routes have native authoring (2,732 nodes); the Home collection has four typed native game cards; World has three whole-card preview links; `/404.html` remains native structured content; and the only HTML compatibility leaves are the three locked runtime fragments listed above. The four former graph references to the `game.card` pseudo-type are closed, and Studio graph validation reports zero dangling references; all four registered `gameId` references remain intact.

Saved qualification evidence:

- Website native regression suite: **136/136 PASS**, from the latest `Dwebsite-final-all-tests.log`.
- Owner preview gate: **16/16 steps PASS**, including the 33-route browser matrix **83/83 PASS**; see `qualified-owner-gate/owner-preview-gate.json` and `browser-matrix.json`.
- Studio qualification record: **173/173 tests PASS**; project validation valid with zero errors/warnings, graph has zero dangling references, accessibility has zero errors/warnings; `studio-qualification-final.json` also records Studio doctor **26/26 checks PASS**.
- Browser evidence: App download **44/44 PASS** with eight captures; Stories/Manga/Reader QA records nine route/viewport cases plus the fixture reader flow, with six captures; Home interactive discovery **49/49 PASS** with eight captures.
- Visual comparison: **12/12 cases PASS** as a comparison run. Home, World, and App section geometry matches at desktop 1440, tablet 900, and mobile 390 widths. Characters geometry differs at all three widths because the native layout removes the prior layout control; that is the documented expected exception, not a claim of identical geometry.
- Manifest closure gate: its **20 steps are green**, but the saved gate status is **FAIL** because `inputsUnchangedDuringGate` is false (source fingerprint changed during the run while the dist fingerprint stayed the same). A clean rerun after source freeze is pending.

The Studio team is implementing a general `publishing.staticExport` profile and its Pages UI so publishing/export can replace the current owner CLI export step. This integration is **not complete** and must not be reported as delivered. Additional symbol and motion-compatibility tests are also in progress; a final Studio rerun including those tests and the publishing integration is still required. The manifest fingerprint rerun and final package commit are pending as well. Therefore this inventory records completed website authoring closure and substantial passing qualification evidence, but does **not** mark the overall final qualification/package complete. The baseline legacy `headlineAccent` field remains inert and preserved; it was not recovered or made active. The bounded Characters pilot remains the recorded real-UI pilot proof; project-wide migration does not imply that every route received the same real-UI editing exercise.

## Historical pre-conversion inventory

Before conversion, the registry already contained 33 routes and Studio-generated records, but most visible route content was encoded in `core.rich-text.props.html`. Home had ten rich-text blocks and a grid; `/404.html` already had `core.content-section` and a grid. Some pages had multiple rich-text siblings, and several blobs contained forms, cards, runtime hooks, or whole page regions. That historical observation explains the conversion; it must not be read as a description of today's source.

Editorial publication data and ordered story-page manifests were and remain structured content data. Runtime-inserted global shell elements also remain outside page component trees. Source verifiers should inspect typed authoring data and projected output, and browser/site checks should inspect actual built routes; none should use the former full-page blobs as today's source of truth.
