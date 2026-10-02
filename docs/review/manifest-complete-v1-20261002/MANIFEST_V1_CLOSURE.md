# TOADAL FEAST — Manifest V1 Closure

Date: 2026-10-02  
Branch: `work/manifest-complete-v1-20261002`  
Frozen starting commit/tree: `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43` / `b48efb7b20c72c11acc017a4807bc545aa81f17a`  
Studio: TOADAL Studio 1.4.2; exact project `studio-project/toadal-feast-website/project.json`  
Final qualification: 16/16 owner-preview gates; browser 83/83 across 33 registered routes. This is engineering closure, not Home `LOCK_VISUAL` acceptance.

## Outcome

**MANIFEST V1 ENGINEERING COMPLETE — ONLY EXTERNAL ACTIVATION/CONTENT DEPENDENCIES REMAIN**

All 30 original page families below have an implemented, route-backed website experience. Empty, gated, and unpublished states are intentional and useful rather than dead ends. This does not mean all future services or content exist. No real users, global scores, checkout, account creation, legal policy, publication, app-store availability, or release dates are fabricated. Home remains subject to owner visual review; no visual redesign or `LOCK_VISUAL` claim is made here.

## Thirty-family reconciliation

| # | Manifest family / route | Action | Closure evidence and remaining dependency |
|---:|---|---|---|
| 01 | Home `/` | POLISH / KEEP | Preserved approved composition, contextual companion, world/play/pass/app discovery, and current three-candy guest interaction. Home contract 38/38 and fresh 1920/1366/390 screenshots pass. Owner still decides visual acceptance. |
| 02 | Play / Games Hub `/play/` | INTEGRATE / POLISH | Existing game registry, filters, truthful PREVIEW/held states, Wicked Bites entry, Pass/leaderboard links retained. Arcade remains held; no unsupported game is represented as public. |
| 03 | Wicked Bites Detail `/games/wicked-bites/` | KEEP / INTEGRATE | Existing cartridge/detail and canonical gameplay bytes preserved; companion, progression, and score paths link at the website boundary. No game engine rewrite. |
| 04 | Browser Game Player `/player/wicked-bites/` | KEEP / INTEGRATE | Existing isolated player retained. Host adapter validates source/origin/protocol/session/run/score and only persists a completed validated personal best locally. |
| 05 | World Hub `/world/` | POLISH / PORT | Existing world/character registry and canonical assets reused; structured locations/discovery state and reduced-motion-safe interaction are wired. No invented canon. |
| 06 | Characters Hub `/characters/` | KEEP / POLISH | Existing character registry, approved assets, filtering, and discovery reused; responsive desktop/mobile proof included. Broader approved lore remains content-dependent. |
| 07 | Toadal Profile `/characters/toadal/` | KEEP / POLISH | Structured profile and canonical art retained, with current guest discovery/progression links. Additional biography/appearances require approved canon. |
| 08 | Stories / Comics `/stories/` | KEEP / POLISH | Existing publication architecture and shelves/empty states retained; zero approved series/chapters/pages stays explicitly unpublished. |
| 09 | Manga Series `/manga/` | KEEP / PLACEHOLDER | Existing series template reused, related reader links and empty publication state verified. Approved series/chapter records remain content-only. |
| 10 | Comic Reader `/reader/` | KEEP / INTEGRATE | Existing reader controls, progress/bookmark/resume boundary and empty state retained; no fabricated chapter pages. |
| 11 | Media Hub `/media/` | POLISH / KEEP | Existing canonical world, character, and game media reused with working available-section filters. Video, downloads, and press records await approved assets/content. |
| 12 | News Hub `/news/` | POLISH | Registry-backed search/filter/category presentation and truthful empty state; no approved published news records currently exist. |
| 13 | News Article / Devlog `/news/devlog/` | BUILD THIN | New thin article route reuses editorial registry/projection, awaits-publication state, and adjacent-article links. No CMS or fake article created. |
| 14 | Feast Pass `/feast-pass/` | PORT / INTEGRATE | Existing four-key namespaced guest schema retained; local level/XP/Sparks/streak/daily/discovery/Treat/quest/reward summary integrated. All starter values are non-entitlement and browser-local. |
| 15 | Quests `/feast-pass/quests/` | PORT / POLISH | Existing definition-driven quest engine expanded with route, Treat, and daily definitions and one-time safe claims; future production catalog remains configurable/content-owned. |
| 16 | Rewards / Collection `/feast-pass/rewards/` | PORT / POLISH | Existing reward renderer now has three configurable non-entitlement level milestones and Treat definitions; no paid economy, permanent entitlement, or unsupported badge catalog is invented. |
| 17 | Leaderboards `/leaderboards/` | BUILD THIN / INTEGRATE | Website view/adapter reuses game-local score model and validated Wicked Bites personal-best contract; game/scope controls, truthful no-data state, related challenge entry, and explicit connected-future scope. No global ranking or backend endpoint is fabricated. |
| 18 | App `/app/` | KEEP / POLISH | Existing app page covers Arcade, Puzzle, Feastfall, Infinite and distinguishes web/app; genuine project gameplay evidence retained. Store destinations remain disabled until verified URLs exist. |
| 19 | Account `/account/` | PLACEHOLDER / INTEGRATE | Guest-first account preview reuses existing boundaries; login/signup remain disabled and explain future Froggy activation. No duplicate auth system. |
| 20 | Player Profile `/profile/` | INTEGRATE / POLISH | Existing guest state renders level, XP, Sparks, streak, discoveries, quests, Treats, and validated local Wicked Bites best; no connected identity or sync is implied. |
| 21 | Community `/community/` | PLACEHOLDER | Finished construction/guide state, contextual companion and useful onward paths; posting/moderation/events await a real approved service and content. |
| 22 | Store `/store/` | PLACEHOLDER | Finished preview makes absent catalog, prices, inventory, cart, and checkout explicit; reuses future commerce boundary rather than adding another engine. |
| 23 | Search `/search/` | KEEP / POLISH | Existing local-only grouped search, URL state, suggestions and support filtering retained; index rebuilt from current routes. No external search dependency. |
| 24 | Roadmap `/roadmap/` | BUILD THIN | New dedicated route projects five existing registry entries into Available Now / In Development / Coming Soon / Exploring; no dates or guarantees invented. |
| 25 | Support `/support/` | POLISH | Five current support articles/search and useful route shortcuts are present, including accurate browser-local progression wording; public ticket/email endpoint remains absent. |
| 26 | Contact `/contact/` | PLACEHOLDER / POLISH | Existing form shell is explicit, non-submitting and disabled without a verified endpoint/mailbox; no user data is falsely claimed to be sent or saved. |
| 27 | About `/about/` | POLISH / KEEP | Existing TOADAL GAMES-subordinate studio presentation retained; deeper history/press/business copy awaits approved material. |
| 28 | Coming Soon `/coming-soon/` | KEEP / POLISH | Reusable unavailable-feature route provides useful escape paths and no false date/promise. |
| 29 | Legal `/legal/` | PLACEHOLDER / KEEP | Legal status and accurate product storage facts are shown; no policy text is fabricated. Approved privacy/terms and legal contact are external/content inputs. |
| 30 | 404 `/404.html` | KEEP / POLISH | Branded recovery route, Search path and current companion retained; static route/base-path checks pass. |

The page registry contains 33 routes because it also includes distinct game-detail routes; the denominator above remains the original 30 families, not route count.

## Locked cross-cutting requirements

| Requirement | Status | Evidence / boundary |
|---|---|---|
| TOADAL FEAST-first identity; TOADAL GAMES subordinate | PASS | Existing authority/content and 38/38 Home visual contract. |
| Enter the Feast World; canonical approved characters | PASS for implemented shell | Existing canonical assets and 84/84 visual asset authority; owner visual comparison remains review-only. |
| Immediate free play and honest game availability | PASS | Play registry and isolated Wicked Bites remain truthful; Arcade remains held. |
| Discover world, characters and stories | PASS for available structure | World discovery and character registry integrated; unpublished lore/chapters remain explicit. |
| Media/news/manga/lore truth | PASS | Registry-driven empty/published states; no unapproved content inserted. |
| Guest-first progression / safe storage | PASS | Existing namespaced four-key schema; 72/72 tests and cartridge storage-isolation check. |
| Treats and candy discoveries | PASS | Three Home candies atomically update discoveries, Pass Treat count, and configured quest progress; no score injection. |
| Daily reward idempotency | PASS | UTC-period check-in and retry/concurrency tests retained. |
| Quests and safe reward claims | PASS | Definition-driven progress, idempotent claims, and non-entitlement starter reward definitions verified. |
| Leaderboard boundary | PASS for website contract | Validated local personal-best adapter; no global rows or connected API without activation. |
| Account/profile/cloud boundary | PASS | Guest-first shell; Froggy account/sync stays future until configured. |
| App conversion truth | PASS | Four modes, genuine available media, disabled unverified store links. |
| Contextual Toadal companion | PASS | 17 companion interactions passed; contextual guide/construction behavior remains non-blocking. |
| Search | PASS | Existing local search retained, source index refreshed, grouped discovery verified. |
| Mobile navigation and responsive behavior | PASS | Full 83-case browser matrix, responsive visual captures, overflow/interaction diagnostics clean. |
| Keyboard/focus/accessibility and reduced motion | PASS for required current-route checks | Existing contracts retained; reduced-motion handling remains in current runtime. |
| PUBLIC/PREVIEW/PLANNED/COMING_SOON/DISABLED accuracy | PASS | Registry-driven status mapping; no invented release dates/services/scores. |
| Git-backed staging/production separation | PASS | Staging-only publication; `main`, production, and DNS are not modified. |
| Home `LOCK_VISUAL` acceptance | OWNER REVIEW PENDING | This engineering mission does not claim owner acceptance; approved authority remains controlling. |

## Reuse map and implementation summary

- Existing website source, TOADAL Studio components, navigation, companion, local search, stories publishing, reader, and namespaced guest progression were retained.
- Game-local score/leaderboard concepts were reused from the pinned `Toadal-Feast-Development` `gh-pages` authority (`2022e904d0c81f60b13aa340a3838ccbb1a6b150`); the website only adapts the supported validated score contract. Froggy Locker leaderboard/account/commerce code remains an inactive service boundary, not a claimed live integration.
- Historical Passport/Treat/quest/daily behavior was adapted to current namespaced website storage; obsolete donor branding and storage keys were not restored.
- Editorial/article/roadmap surfaces project the existing content registry. Existing news has zero approved articles; roadmap has five existing records. Empty content remains empty.
- Source changes also repair the malformed App page record, add article/leaderboard/roadmap routes, expand Support, update local search route coverage, add tested score-adapter behavior, and correct rich-text landmarks so Studio's generated pages contain one `<main>`.
- Studio generated deploy output; the official Pages transform—not manual HTML patching—then applied `/toadal-feast-web/` URLs and staging `noindex,nofollow`.
- Wicked Bites runtime/source and generated cartridge entry/bridge/manifest match the frozen baseline byte-for-byte.

## Qualification evidence

- Studio 1.4.2 `validate`: PASS, zero errors/warnings; `ai:doctor`: PASS.
- `toadal.inspect`: PASS; 33 pages, 4 games, 59 assets, 55 components. Four graph warnings are benign typed `game.card` component discriminants under `component.home.games`, not unresolved game IDs; actual `props.gameId` values reference all four registered games.
- Bridge `toadal.render`: PASS, 141 preview files. `toadal.export(kind="static")`: PASS, archive `studio-project/toadal-feast-website/build/exports/toadal-feast-website-static-site.zip` (39,883,333 bytes; SHA-256 `b172d1debdf38cd0ad69b6218a561a232493fb69df498aa92856ab9f65792fd4`). Verify checkpoint: PASS (`ok=true`). Canonical Studio `npm run render`: PASS, 141 files to tracked `dist/`.
- `node --test scripts/*.test.mjs`: 72/72 PASS. Required integrated 48-test suite: PASS. Home contract 38/38; all 16 owner-preview gates PASS; stricter final manifest closure gate 20/20 PASS; browser matrix 83/83 over 33 routes.
- Additional checks: navigation, character registry, gated routes, manifest, Search/Discovery, non-Home truth, visual asset authority 84/84, non-Home layout 12/12, cartridge storage isolation, Gully/gameplay authority, Pages base path, static links, and staging robots all PASS.
- Fresh visual evidence: 13 captures PASS and 17/17 companion interactions; evidence is under `screenshots/`. Captures include Home 1920×1080, 1366×768, 390×844; App, World, Characters/Gully, Media, Play, Stories, and Feast Pass. Home remains owner review, not accepted.
- Supplemental Studio package tests: 76/81. Five failures are environmental prerequisites: missing `zip` for Tier 2 press-pack and Tier 4 archive paths; missing ImageMagick (`magick`) for three Tier 3 image/QR paths. User-scoped installs were unavailable; Studio code/tests were not modified or weakened. This does not replace the green website release gates.

## Remaining dependencies (not buildable website omissions)

External activation: verified App Store/Google Play URLs; configured account/identity/cloud-save endpoint; connected leaderboard endpoint/capabilities; community posting/moderation service; commerce catalog/provider/fulfillment; public support/contact endpoint or mailbox.

Approved content: published news/devlog articles; series/chapter/page assets and creator metadata; additional approved world/character lore and appearances; video/press/download assets; deeper approved studio copy; signed-off Privacy Policy/Terms and legal contact; additional approved reward/badge/treat catalog entries. No dates, prices, legal text, users, purchases, or scores are fabricated.

Owner decision: Home's visual acceptance. This does not block engineering closure and is not claimed here.

## Deployment and rollback

The candidate is intended for the established GitHub Pages staging lane only, at `https://matthew75x.github.io/toadal-feast-web/`, with staging robots policy retained. The exact pushed/promoted SHA, GitHub Pages workflow run, public-route probes, and frozen rollback reference are appended after deployment verification. Production domain/DNS and `main` remain out of scope and untouched.
