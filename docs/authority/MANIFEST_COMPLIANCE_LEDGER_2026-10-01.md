# TOADAL FEAST Website - Manifest Compliance Ledger

**Date:** 2026-10-02
**Current public staging:** `688e1c471fdc97207c5ebfeaa0ef313ab9c44e52`
**Current integrated review candidate:** `UNCOMMITTED_REMEDIATION_WORKTREE`
**Controlling denominator:** the original 30-page manifest plus locked cross-cutting product requirements.

## Why this exists

This ledger replaces work-order completion as the project-level progress measure. A green verifier, a clean branch, or a closed work order does **not** mean the website manifest is complete.

Future work must map to this ledger. If a task does not advance a row below, a cross-cutting requirement, or a real release blocker, it is not project-priority work.

## Original vision - recovered and still authoritative

- Enter the **TOADAL FEAST world**: colorful food kingdoms, adventure, characters, exploration and feasting.
- Web is broader than a port of the mobile game: free browser experiences + world/story/media discovery + lightweight progression + app conversion.
- Visitor journey: **play free -> discover world/cast/story -> consume media/lore/news -> earn guest Feast Pass progress -> optionally create account later -> convert to full mobile app**.
- TOADAL FEAST is visitor-facing first; TOADAL GAMES is subordinate except studio/business/legal contexts.
- Toadal is a **reactive site companion**, using semantic context and actual pose/art changes across pointer, keyboard focus and touch.
- Guest progression starts without an account and is stored durably in-browser; account/sync expands it later.
- Unavailable account/community/store/future destinations should be visible only through truthful polished states, never fake-live.
- The 30 page families remain requirements. Work orders are implementation slices, not replacements for the roadmap.

## Qualification and owner acceptance

**Phase:** QUALIFICATION_PENDING. Current source/artifact qualification and owner visual acceptance are separate. Home remains PARTIAL because LOCK_VISUAL acceptance is owner-pending; this remediation does not redesign it or claim acceptance.

The approved Home remains `docs/review/WO-002/evidence/approved-home-visual-authority.png` (SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`).

## 30-page compliance

| # | Manifest page | Visual authority | Delivery | Status | Evidence / remaining gap |
|---:|---|---|---|---|---|
| 1 | Home | LOCK_VISUAL | REMEDIATION_CANDIDATE | **PARTIAL** | Existing Home composition, games/Pass/discovery/App hierarchy and companion preserved; no redesign. Final integrated qualification pending. **Gap:** Owner Home LOCK_VISUAL acceptance remains pending. |
| 2 | Play / Games Hub | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Existing catalog/filtering, truthful preview states, challenges/rewards/leaderboard links and App path. Final integrated qualification pending. **Gap:** Additional game availability requires qualification. |
| 3 | Wicked Bites Game Detail | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Genuine Wicked Bites media/mechanics; current launch and progression/related paths. Final integrated qualification pending. **Gap:** Approved additional trailer/character/reward content may publish later. |
| 4 | Browser Game Player | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Explicit sibling HUD association; validated current score/session time, pause/error/exit lifecycle and completed local score persistence. Final integrated qualification pending. **Gap:** No cartridge XP/challenge/achievement telemetry is invented. |
| 5 | World Hub | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Existing approved World art/registry, locked locations, site discoveries and App path. Final integrated qualification pending. **Gap:** Approved location lore/map details await publication. |
| 6 | Characters Hub | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Seven approved character artwork discoveries save idempotently in the existing discoveries key; filters and unpublished canon slots preserved. Final integrated qualification pending. **Gap:** Relationships/appearance canon remains unpublished. |
| 7 | Toadal Character Profile | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Biography/personality/history/abilities/friends/locations/games/stories/gallery/collectible structures with truthful canon states. Final integrated qualification pending. **Gap:** Additional approved canon remains unpublished. |
| 8 | Stories / Comics Hub | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Featured/latest/progress/comics/manga/short/lore/BTS publishing structures preserved. Final integrated qualification pending. **Gap:** Approved published story content required. |
| 9 | TOADAL FEAST Manga Series | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Reusable series cover/synopsis/chapters/characters/progress/world/media structure, fail-closed publishing. Final integrated qualification pending. **Gap:** Approved series/chapter content required. |
| 10 | Comic / Manga Reader | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Existing reader navigation/thumbnails/fullscreen/bookmark/progress/story-info code and graceful unpublished shell. Final integrated qualification pending. **Gap:** Approved published page manifests required. |
| 11 | Media Hub | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Genuine stills/art plus truthful trailer/video/short/wallpaper/download/press availability slots. Final integrated qualification pending. **Gap:** Approved video/download/press content required. |
| 12 | News / Updates Hub | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Featured/latest/filter/trending structures; only valid published editorial, no invented activity metrics. Final integrated qualification pending. **Gap:** Approved news and verified trending data required. |
| 13 | News Article / Devlog | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Allowlisted article body/media/quote/related links/neighbor navigation and Roadmap handoff. Final integrated qualification pending. **Gap:** Approved published articles/quotes required. |
| 14 | Feast Pass Dashboard | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Current four-key schema, level/XP/Sparks/Treats/streak/daily/milestones/discoveries and optional account boundary. Final integrated qualification pending. **Gap:** Connected sync remains inactive. |
| 15 | Quests / Challenges | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Configured daily/exploration activities and five quest categories; runtime links honor Pages base path. Final integrated qualification pending. **Gap:** Weekly/game/story goals require supported configured activities. |
| 16 | Rewards / Collection | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Local reward track/badges/titles/collection and locked/unlocked milestones; no paid/mobile entitlements. Final integrated qualification pending. **Gap:** Additional approved reward catalog required. |
| 17 | Leaderboards | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Validated completed local runs, preserved all-time best beyond 50-run history, safe local table and personal-best state. Final integrated qualification pending. **Gap:** Froggy connected/global service and unsupported mode/ruleset fields remain future. |
| 18 | App / Get TOADAL FEAST | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Hash-verified genuine App icon, three genuine gameplay captures, all four modes and canonical Infinite copy; web/App distinction retained. Final integrated qualification pending. **Gap:** Approved trailer/Infinite capture and official store destinations remain unavailable. |
| 19 | Account / Sign Up / Login | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Guest status, account benefits/privacy and guest continuation; real signup/login intentionally unavailable. Final integrated qualification pending. **Gap:** Configured Froggy identity/cloud endpoint required. |
| 20 | Player Profile | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Non-identifying guest avatar, selected title, scores, route/Treat and character artwork views, local badges/showcase, tab-only appearance controls. Final integrated qualification pending. **Gap:** Connected/game achievements/history require actual service/data. |
| 21 | Community Hub | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Creator/fan-art/event/feed/guidelines/feedback structures; no fabricated public community activity. Final integrated qualification pending. **Gap:** Approved guidelines/content and posting/moderation service required. |
| 22 | Store | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Merch/digital/categories and real News/Roadmap update CTAs; no fake signup/cart/prices/checkout. Final integrated qualification pending. **Gap:** Approved catalog and real commerce service required. |
| 23 | Search / Discovery | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Existing local grouped search, filters/suggestions/empty states preserved and current index regenerated. Final integrated qualification pending. **Gap:** No external activation required for local search. |
| 24 | What's Next / Roadmap | LOCK_STRUCTURE_ONLY | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Four status groups plus related published-devlog links or explicit publication empty state; no invented dates. Final integrated qualification pending. **Gap:** Approved devlogs required to populate related links. |
| 25 | Support / Help Center | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Existing local help search/categories/popular FAQs/contact/status paths. Final integrated qualification pending. **Gap:** Ticket/contact endpoint requires configuration. |
| 26 | Contact / Feedback | LOCK_LAYOUT | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Complete contact field/routing structure and truthful disabled non-submitting behavior. Final integrated qualification pending. **Gap:** Verified endpoint/mailboxes required. |
| 27 | About TOADAL GAMES | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Mission/flagship/experiments/stories/characters/philosophy/press/business structures without invented studio statements. Final integrated qualification pending. **Gap:** Approved mission/philosophy/business copy and contact required. |
| 28 | Coming Soon / Under Construction | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Branded contextual construction destination, useful available routes and updates; no false dates. Final integrated qualification pending. **Gap:** External capabilities remain honestly unavailable. |
| 29 | Privacy / Terms / Legal | LOCK_STRUCTURE_ONLY | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Privacy/Terms readable template/TOC/related/contact and undated last-updated slot. Final integrated qualification pending. **Gap:** Approved policy text, publication dates and legal contact required. |
| 30 | 404 / Lost in the Feast | POLISH | REMEDIATION_CANDIDATE | **PARTIAL_CANDIDATE** | Actual branded HTTP404, Home/Play/Search/Stories recovery and current assets. Final integrated qualification pending. **Gap:** No buildable gap. |

### Page-family status count

- **PARTIAL: 1**
- **PARTIAL_CANDIDATE: 29**

Route presence is not the same as page completion. This candidate currently contains 33 static route records; several map to the same manifest family and many remain truthful previews.

## Cross-cutting product contract

| Requirement | Status | Evidence / gap |
|---|---|---|
| TOADAL FEAST-first public identity | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Website feels like entering the Feast World | **OWNER_REVIEW_PENDING** | Current owner-preview composition preserved; no LOCK_VISUAL acceptance or redesign claimed. |
| Play something free immediately | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Discover characters/world/story | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Consume media/manga/lore/news | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Guest-first Feast Pass progression | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Account later for preserve/sync | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Convert visitors to flagship mobile app | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Reactive Toadal companion | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Hidden Treats / collectible food | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Daily rewards | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Quests/challenges | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Sound/settings/search utilities | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. Local Search, existing player sound requests, and tab-only Profile CSS-animation preference; no site-audio service invented. |
| Truthful PUBLIC/PREVIEW/PLANNED/COMING_SOON/DISABLED states | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Mobile navigation / responsive composition | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Keyboard/focus/reduced-motion/accessibility foundation | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Git-backed source of truth / staging-production separation | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Final Home LOCK_VISUAL acceptance | **OWNER_REVIEW_PENDING** | Current owner-preview composition preserved; no LOCK_VISUAL acceptance or redesign claimed. |
| Feature-salvage discipline | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Environmental motion / ambience | **CONDITIONAL_SALVAGE_NOT_ACTIVATED** | Scenic composition and reduced-motion-safe existing interactions retained. Extra parallax is conditional on adding delight without clutter under LOCKED_PRODUCT_DECISIONS; not added during bug remediation. |
| Mobile fast-Play / bottom-navigation concept | **CURRENT_NAVIGATION_PRESERVED** | Current mobile drawer and direct Play entry retained; extra bottom navigation is conditional (if useful), not a required replacement. |
| Content publication states | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |
| Guest progression storage contract | **QUALIFICATION_PENDING** | Current implementation qualified by manifest/owner gates and runtime witnesses in docs/review/manifest-audit-remediation-20261002; unavailable services/content stay truthful. |

## Visual evidence levels

- Home: **LOCK_VISUAL** - `docs/review/WO-002/evidence/approved-home-visual-authority.png`.
- Page 2 Play / Games Hub: `assets/reference/mockups/batch-1/02_PLAY_GAMES_HUB.png` - owner-approved-batch-1-layout-reference.
- Page 3 Wicked Bites Game Detail: `assets/reference/mockups/batch-1/03_WICKED_BITES_DETAIL.png` - owner-approved-batch-1-layout-reference.
- Page 4 Browser Game Player: `assets/reference/mockups/batch-1/04_BROWSER_GAME_PLAYER.png` - owner-approved-batch-1-layout-reference.
- Page 5 World Hub: `assets/reference/mockups/batch-1/05_WORLD_HUB.png` - owner-approved-batch-1-layout-reference.
- Page 6 Characters Hub: `assets/reference/mockups/batch-1/06_CHARACTERS_HUB.png` - owner-approved-batch-1-layout-reference.
- Page 7 Toadal Character Profile: `assets/reference/mockups/batch-1/07_TOADAL_PROFILE.png` - owner-approved-batch-1-layout-reference.
- Page 8 Stories / Comics Hub: `assets/reference/mockups/batch-1/08_STORIES_COMICS_HUB.png` - owner-approved-batch-1-layout-reference.
- Page 9 TOADAL FEAST Manga Series: `assets/reference/mockups/batch-1/09_MANGA_SERIES.png` - owner-approved-batch-1-layout-reference.
- Page 10 Comic / Manga Reader: `assets/reference/mockups/batch-1/10_COMIC_READER.png` - owner-approved-batch-1-layout-reference.
- Pages 11-30 also appear in `assets/reference/mockups/mixed-concepts/DESKTOP_30_PAGE_CONTACT_SHEET.jpg`, but that contact sheet is reference material and does not give every page the same approval level as Home/Batch 1.

## Authority firewall

### Active authority

- **Latest explicit owner instruction** - Highest priority; can supersede older project documents.
- **docs/authority/sources/product/LOCKED_PRODUCT_DECISIONS.md** - Product identity, visitor journey, companion, Feast Pass, browser games and playful-layer contract.
- **docs/authority/sources/mockups/PAGE_MANIFEST.md** - 30-page page-by-page product manifest.
- **docs/design/VISUAL_AUTHORITY_LEDGER.md** - LOCK_VISUAL / LOCK_LAYOUT / LOCK_STRUCTURE_ONLY / POLISH status.
- **docs/authority/VISUAL_AUTHORITY.md** - Approved Home and visual/identity rules.
- **docs/authority/PAGE_REQUIREMENTS.md** - Reconciles manifest with current implementation without cancelling missing page families.
- **docs/authority/WEB_PRODUCT_AUTHORITY.md** - Authority hierarchy and current operational source of truth.
- **docs/review/WO-002/evidence/approved-home-visual-authority.png** - Home LOCK_VISUAL north star; SHA-256 4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608.

### Current implementation evidence

- **staging/live-visual** `270940dee30b7aafb70af941c520c6d4d223e288` - Current public GitHub Pages implementation.
- **integration/manifest-home-characters-progression-20261001** `945c7ea1b0bc417cbbf2b7b6b3ca3b366114a9da` - Current manifest-core review candidate: Home + Characters/Toadal + guest progression; not approved or deployed.
- **work/gated-ecosystem-manifest-20261001** `61023edf34f14fc9131ebfe258000cffbea49520` - Parallel candidate for Account, Community, Store, Contact, About, Coming Soon and Legal manifest rows; verified, not deployed.
- **integration/visual-convergence-combined-20261001** `58a7121e363d3480c122623b1de5cd0d5ac1778e` - Older visual-only convergence candidate retained as implementation history/donor.
- **integration/master-asset-authority-20261001** `62717951f4ffba0e8dd779116cc192d70f94d534` - Recovered Master V2 companion/asset authority.
- **archive/production-ready-asset-pack-20261001** `5820653d1e74f2b1ff6cb7f9f0c3adc02f9305ba` - Remote preservation of complete 71-image production-ready pack.

### Historical / donor-only material

- **C:/ReleaseOps/toadal-games-redesign-20260925** - Older TOADAL GAMES/Grove redesign authority. Contains superseded green/Toto and dashboard/left-rail concepts; cannot override later TOADAL FEAST-first 30-page authority.
- **Netlify: toadal-v13-site-preview** - Older SSO-protected V13 preview/donor, not current deployment authority.
- **Netlify cartridge previews** - Useful isolated game evidence only; not the website product roadmap.
- **Older WO-001/visual-remediation/recovery worktrees** - Historical implementation evidence/donors only unless current authority explicitly cites them.
- **WO-003 Arcade HOLD lane** - Qualification evidence only; cannot become a website-wide priority or block manifest implementation.

This firewall matters because the local project folders contain older redesign documents that conflict with the later authority. Physical proximity or newer file timestamps do not make those documents current authority.

## Donor/reuse findings

- **strictHomeParityWip: LOCAL_WIP_DONOR** - 322-line CSS parity treatment is denser/closer to approved Home in games/pass/discovery/app-next composition than the later combined Home, but is not final or approved. Preserved patch: `docs/authority/donors/home-lock-visual-parity-20261001.patch`.
- **progressionDonor: HISTORICAL_DONOR** - Working local Sparks, streaks, Treats, quest board, daily rewards, Feast Catch and reduced-motion-aware parallax. Salvage behavior, rebuild state contract.
- **r2r3AdventureDonor: DEFERRED_DONOR_NOT_RELEASE_CANDIDATE** - R2 smoke proved 21-route build plus browser-local Passport, sound, daily reward, Treat quest and reward persistence. R3 adventure.js adds collapsible Passport/HUD, route discovery and modal patterns. Branding/state schema are superseded.
- **structuralRoutes: STRUCTURAL_DONOR_ONLY** - Older routes can accelerate templates/empty states but do not provide current authority or final copy.

The correct progression strategy is **behavior salvage + current-schema rebuild**, not greenfield reinvention and not direct import of obsolete storage/economy/branding.

## External-source check

- **Figma:** connected Approved Home Target is available, but MCP inspection is currently rate-limited. The exact approved Home is preserved in-repo, so the target is not lost.
- **Netlify:** cartridge previews and the older V13 site preview are donor/preview evidence only. GitHub Pages is current website staging authority.
- **ASSIGNATOR project folders:** active, preservation and historical worktrees were enumerated; donor classification is recorded in the Project Source Map.

## Operating rules from this point forward

1. No task may be called priority work unless it advances at least one explicit manifest page row, cross-cutting requirement, or real release blocker.
2. Automated QA proves implementation health, not manifest completion or visual acceptance.
3. A passed work order never cancels an unimplemented manifest requirement.
4. Home remains incomplete until LOCK_VISUAL is judged against the approved Home image and owner acceptance is recorded.
5. Do not spend Arcade/gameplay re-certification effort unless a website integration change plausibly changed the qualified game behavior.
6. Historical project folders are donors/evidence only unless cited by current authority.
7. Percentages must name their denominator: live shell, current candidate, or full 30-page manifest.
8. Connected services and unpublished content must remain truthful rather than fabricated.

## Manifest-first execution order

1. **Integrated candidate visual acceptance / staging gate** (manifest rows 1, 6, 7, 14, 15, 16, 20) - Core candidate is implemented and verified; Home remains LOCK_VISUAL and must be reviewed before staging promotion.
2. **Stories publishing stack** (manifest rows 8, 9, 10) - Rows 9 and 10 are absent and row 8 is only a preview; Batch-1 references already exist.
3. **Editorial/discovery utilities** (manifest rows 11, 12, 13, 23, 24, 25) - Converts partial media/news/support and missing article/search/roadmap families into useful truthful pages.
4. **App conversion evidence closure** (manifest rows 18) - Completes flagship conversion only when genuine evidence is available.
5. **Play depth / additional browser-game integration** (manifest rows 2, 3, 4, 17) - Improves immediate-play depth after core structure is under control.

Arcade remains a separate HOLD/evidence lane and is **not** allowed to consume the website roadmap unless a manifest-level browser-game integration task specifically requires it.
