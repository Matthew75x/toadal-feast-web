# TOADAL FEAST Website - Manifest Compliance Ledger

**Date:** 2026-10-01
**Current public staging:** `270940dee30b7aafb70af941c520c6d4d223e288`
**Current integrated review candidate:** `945c7ea1b0bc417cbbf2b7b6b3ca3b366114a9da`
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

## Critical recalibration finding

**Home is still PARTIAL, not complete.** It is `LOCK_VISUAL`. The combined candidate is cleaner and closer, but side-by-side with the approved Home it remains visibly sparser and less game-world dense. Technical checks cannot upgrade that to visual acceptance.

The approved Home remains `docs/review/WO-002/evidence/approved-home-visual-authority.png` (SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`).

## 30-page compliance

| # | Manifest page | Visual authority | Delivery | Status | Evidence / remaining gap |
|---:|---|---|---|---|---|
| 1 | Home | LOCK_VISUAL | LIVE + CANDIDATE | **PARTIAL_CANDIDATE** | Home remains live from the older staging shell; candidate d4219fb / integrated 945c7ea materially restores the approved dense portal hierarchy, four truthful game listings, fixed contextual Toadal, paired Games/Feast Pass and App/What’s Next bands. **Gap:** LOCK_VISUAL still requires owner visual acceptance. Final franchise wordmark, real app-store evidence and richer approved content remain unavailable. |
| 2 | Play / Games Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | Play route and four truthful PREVIEW listings exist; candidate improves illustrated portal treatment. **Gap:** Manifest calls for challenges, badges/rewards, leaderboard, Feast Pass integration and limited Arcade preview. Do not re-certify Arcade just to complete the page. |
| 3 | Wicked Bites Game Detail | LOCK_LAYOUT | LIVE | **PARTIAL** | Real Wicked Bites detail route/evidence exists. **Gap:** Trailer/screenshots/mechanics depth, challenges, leaderboard, achievements/rewards and related-content depth are not manifest-complete. |
| 4 | Browser Game Player | LOCK_LAYOUT | LIVE | **PARTIAL** | Wicked Bites preview player exists with static player shell. **Gap:** Full reusable player contract across approved games plus score/timer/achievement/XP/challenge surfaces is incomplete. |
| 5 | World Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | World route exists; candidate adds canonical environment/cast discovery. **Gap:** Interactive/structured world map, lore model, discoveries/progress and approved location structure remain absent. |
| 6 | Characters Hub | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /characters/ route is implemented on the integrated candidate with canonical character registry, approved Batch-1 layout reference and responsive filtering. **Gap:** Still preview-state content; relationships/appearances/discovery-progress depth and final owner visual acceptance are not complete. |
| 7 | Toadal Character Profile | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /characters/toadal/ route is implemented on the integrated candidate using canonical Toadal art and a structured profile layout. **Gap:** Biography/lore depth is intentionally bounded to verified content; broader appearances/collectibles/history remain incomplete and owner visual acceptance is pending. |
| 8 | Stories / Comics Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | The existing /stories/ route is extended on the integration candidate with featured/latest/progress regions, Comics/Manga/Shorts/Lore/Behind-the-Scenes shelves, and truthful empty states. **Gap:** The public projection has zero approved series, chapters or pages; published catalog, latest-chapter and reading-progress records remain absent. |
| 9 | TOADAL FEAST Manga Series | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | The /manga/ reusable series template is implemented on the integration candidate and labels discovery art and empty publication state truthfully. **Gap:** No approved published series, cover, synopsis, creator, chapters or reading-progress records exist. |
| 10 | Comic / Manga Reader | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | The /reader/ shell provides ordered-page navigation, thumbnails, fullscreen, progress and isolated local bookmarks; interaction coverage used a non-public in-memory fixture. **Gap:** No approved published chapter/pages exist, so real-content reading, thumbnails and chapter navigation are not yet available. |
| 11 | Media Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | Media route exists; candidate adds canonical world and character gallery. **Gap:** Featured trailer/video/gameplay/shorts/wallpapers/downloads/creator/press structure and real published records absent. |
| 12 | News / Updates Hub | LOCK_LAYOUT | LIVE | **PARTIAL** | News route exists with truthful placeholder state. **Gap:** No real dated published update catalog/filters/trending content. |
| 13 | News Article / Devlog | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Editorial detail template is required. **Gap:** Article route, body/media slots, related links and prev/next absent. |
| 14 | Feast Pass Dashboard | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL_CANDIDATE** | Feast Pass candidate now renders browser-local level, XP, Sparks, streak, discoveries, quest summary and daily check-in using current namespaced storage. **Gap:** Starter values are explicitly non-canonical; Treat catalog, complete reward track, account sync and final visual/product acceptance remain. |
| 15 | Quests / Challenges | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /feast-pass/quests/ route and definition-driven local route-visit quests are implemented with idempotent progress and safe reward claims. **Gap:** Only starter route-visit quests exist; daily/weekly/exploration content catalog and production quest definitions remain incomplete. |
| 16 | Rewards / Collection | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /feast-pass/rewards/ route is implemented with truthful local non-entitlement milestones and empty claimable catalog behavior. **Gap:** Approved badges, titles, cosmetics, Treat/food/relic collections and any entitlement catalog remain intentionally absent. |
| 17 | Leaderboards | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Global connected identity is correctly deferred. **Gap:** Even the truthful local-public leaderboard surface/game selector/time scopes/personal position is absent. |
| 18 | App / Get TOADAL FEAST | LOCK_LAYOUT | LIVE | **PARTIAL** | Informational App route correctly describes mobile as flagship. **Gap:** Genuine approved screenshots/video and verified App Store/Google Play destinations are missing. |
| 19 | Account / Sign Up / Login | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /account/ preview now exposes current guest-local status, continue-as-guest paths, disabled sign-up/login controls, account benefits and legal-status linking without connecting a backend. **Gap:** Real account creation, login, credentials, cross-device sync and approved account/privacy service copy remain deferred. |
| 20 | Player Profile | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /profile/ guest-local profile is implemented with local level/XP/Sparks/streak/discovery/quest summary and explicit non-account scope. **Gap:** No connected identity, synced history, game-score feed, achievement showcase or approved title/avatar system exists yet. |
| 21 | Community Hub | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /community/ Coming Soon route now provides creator/fan-art/event/feedback structure without fabricated creators, posts, dates or uploads. **Gap:** Posting, moderation, creator records, events and connected social services remain deferred. |
| 22 | Store | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /store/ preview now provides merchandise/digital-goodies structure while explicitly exposing no catalog, prices, inventory, cart or checkout. **Gap:** Approved products, prices, commerce provider, fulfillment, entitlements and checkout remain deferred. |
| 23 | Search / Discovery | LOCK_LAYOUT | DISABLED_UTILITY | **NOT_STARTED** | Search is not falsely presented as live. **Gap:** Dedicated local search route, grouped results, filters and meaningful empty/results states absent. |
| 24 | What's Next / Roadmap | LOCK_STRUCTURE_ONLY | HOME_SECTION_ONLY | **PARTIAL** | Truthful compact What's Next content exists without fake dates. **Gap:** Dedicated approved-items roadmap route/status taxonomy/devlog links absent. |
| 25 | Support / Help Center | LOCK_LAYOUT | LIVE | **PARTIAL** | Support route exists. **Gap:** Help search/categories/popular questions/contact/status shortcuts and mature help content absent. |
| 26 | Contact / Feedback | LOCK_LAYOUT | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /contact/ route now implements the manifest field structure and routing panels with submit/upload disabled and explicit no-endpoint/no-mailbox truth. **Gap:** A real approved submission endpoint or public mailbox is still required before contact can become functional. |
| 27 | About TOADAL GAMES | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /about/ route now presents TOADAL GAMES in its subordinate studio role, with TOADAL FEAST-first flagship, web-experiment and business/contact structure. **Gap:** Approved deeper studio history, press/business destinations and any additional public company copy remain. |
| 28 | Coming Soon / Under Construction | POLISH | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated reusable /coming-soon/ construction route now provides available-content escape paths and explicitly avoids fake dates or release promises. **Gap:** Future destinations still need to route here consistently as they are added; final polish remains owner-reviewable. |
| 29 | Privacy / Terms / Legal | LOCK_STRUCTURE_ONLY | CANDIDATE | **PARTIAL_CANDIDATE** | Dedicated /legal/ template now exposes readable Privacy/Terms/contact status and current guest-storage product facts while explicitly refusing generated legal policy text. **Gap:** Approved Privacy Policy, Terms, last-updated dates and verified privacy/legal contact copy are still blocked on real legal sources. |
| 30 | 404 / Lost in the Feast | POLISH | LIVE | **DONE_PROVEN** | Branded 404/recovery page exists and routing/base-path behavior has been verified. **Gap:** Optional search/Treat embellishment may improve it later but is not required to call the recovery route functional. |

### Page-family status count

- **DONE_PROVEN: 1**
- **NOT_STARTED: 3**
- **PARTIAL: 10**
- **PARTIAL_CANDIDATE: 16**

Route presence is not the same as page completion. This candidate adds the Stories/Manga/Reader publishing templates; several routes map to the same manifest family and many remain truthful previews. The current integration browser/static audit records the exact route count and qualification coverage.

## Cross-cutting product contract

| Requirement | Status | Evidence / gap |
|---|---|---|
| TOADAL FEAST-first public identity | **DONE_PROVEN** | Current authority and candidate keep TOADAL FEAST primary and TOADAL GAMES subordinate. |
| Website feels like entering the Feast World | **PARTIAL** | Canonical food-fantasy art is present, but approved Home is still much richer/denser than candidate. |
| Play something free immediately | **PARTIAL** | Wicked Bites has an isolated preview player, but current authority still reports zero PUBLIC games. |
| Discover characters/world/story | **PARTIAL_CANDIDATE** | World/Stories/Media plus Characters Hub, Toadal Profile, Manga template, and Reader shell candidate routes cover more of discovery; published story content and broader character depth remain absent. |
| Consume media/manga/lore/news | **PARTIAL** | Media/News previews and a fail-closed Stories/Manga/Reader publishing stack exist; approved public story records and the News Article route remain absent. |
| Guest-first Feast Pass progression | **PARTIAL_CANDIDATE** | Integrated candidate implements browser-local level/XP/Sparks/streak/discoveries/daily check-in/quest summary under the current namespaced contract. |
| Account later for preserve/sync | **PARTIAL_CANDIDATE** | Account preview route now explains guest-local progress, optional future account benefits and disabled sign-up/login; connected identity/sync remains deferred. |
| Convert visitors to flagship mobile app | **PARTIAL** | App route exists, but genuine product screenshots and verified store links are missing. |
| Reactive Toadal companion | **PARTIAL_CANDIDATE** | Contextual artwork now covers core routes plus account, community, merchandise, contact/business, construction and privacy/legal candidate surfaces. |
| Hidden Treats / collectible food | **NOT_STARTED** | Food library exists; site interaction/progression loop not implemented. |
| Daily rewards | **PARTIAL_CANDIDATE** | Candidate has one configurable UTC-day browser-local check-in with idempotent claim behavior; full reward calendar/content remains unapproved. |
| Quests/challenges | **PARTIAL_CANDIDATE** | Candidate implements definition-driven route-visit quests with local progress and one-time claims; production quest catalog remains incomplete. |
| Sound/settings/search utilities | **PARTIAL_CANDIDATE** | Companion assets/semantic reactions exist; full user-facing settings/search system is not implemented. |
| Truthful PUBLIC/PREVIEW/PLANNED/COMING_SOON/DISABLED states | **DONE_PROVEN** | Current implementation is conservative and does not fabricate unavailable services. |
| Mobile navigation / responsive composition | **DONE_PROVEN_CURRENT_ROUTES** | Current implemented routes have responsive/menu verification; future routes remain unbuilt. |
| Keyboard/focus/reduced-motion/accessibility foundation | **DONE_PROVEN_CURRENT_ROUTES** | Verified on current shell; must remain a gate for every new route. |
| Git-backed source of truth / staging-production separation | **DONE_PROVEN** | GitHub Pages staging, branch preservation and production separation are established. |
| Final Home LOCK_VISUAL acceptance | **NOT_ACHIEVED** | Approved screenshot remains the north star; combined candidate is visibly not at parity and has not received owner visual acceptance. |
| Feature-salvage discipline | **ACTIVE_CONTROL** | Historical donor code was inspected. Guest progression/Treats/quests/daily rewards/parallax have working donors; Feast Catch is retired from the initial game plan. |
| Environmental motion / ambience | **NOT_STARTED_SALVAGE_AVAILABLE** | Reduced-motion-aware parallax donor exists; current visual shell has not integrated it as a manifest-level ambience layer. |
| Mobile fast-Play / bottom-navigation concept | **PARTIAL** | Current drawer/menu behavior is verified; the mockup mobile plan also calls for fast Play access/bottom navigation where useful. |
| Content publication states | **PARTIAL** | Truth labels are strong, but a complete DRAFT/PREVIEW/PUBLISHED/ARCHIVED publishing pipeline for stories/media/news is not yet built. |
| Guest progression storage contract | **PARTIAL_CANDIDATE** | Candidate implements toadal:web:v1:* records, safe defaults, schema/version protection, corruption recovery and scoped reset behavior. |

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
2. **Stories publishing stack** (manifest rows 8, 9, 10) - Candidate hub/template/reader routes and fail-closed plumbing are qualified; approved story records and page derivatives remain absent and must not be fabricated.
3. **Editorial/discovery utilities** (manifest rows 11, 12, 13, 23, 24, 25) - Converts partial media/news/support and missing article/search/roadmap families into useful truthful pages.
4. **App conversion evidence closure** (manifest rows 18) - Completes flagship conversion only when genuine evidence is available.
5. **Play depth / additional browser-game integration** (manifest rows 2, 3, 4, 17) - Improves immediate-play depth after core structure is under control.

Arcade remains a separate HOLD/evidence lane and is **not** allowed to consume the website roadmap unless a manifest-level browser-game integration task specifically requires it.
