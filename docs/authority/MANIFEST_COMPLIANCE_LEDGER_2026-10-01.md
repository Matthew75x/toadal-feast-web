# TOADAL FEAST Website - Manifest Compliance Ledger

**Date:** 2026-10-01  
**Current public staging:** `270940dee30b7aafb70af941c520c6d4d223e288`  
**Latest combined review candidate:** `58a7121e363d3480c122623b1de5cd0d5ac1778e`  
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
| 1 | Home | LOCK_VISUAL | LIVE + CANDIDATE | **PARTIAL** | Live route exists; combined candidate has Home/header convergence and contextual companion. **Gap:** Still does not match the approved dense Home closely enough: final franchise wordmark/header utilities, richer first-viewport composition, five-card/game-pass density, app evidence, guest progression, and owner visual acceptance remain. |
| 2 | Play / Games Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | Play route and four truthful PREVIEW listings exist; candidate improves illustrated portal treatment. **Gap:** Manifest calls for challenges, badges/rewards, leaderboard, Feast Pass integration and limited Arcade preview. Do not re-certify Arcade just to complete the page. |
| 3 | Wicked Bites Game Detail | LOCK_LAYOUT | LIVE | **PARTIAL** | Real Wicked Bites detail route/evidence exists. **Gap:** Trailer/screenshots/mechanics depth, challenges, leaderboard, achievements/rewards and related-content depth are not manifest-complete. |
| 4 | Browser Game Player | LOCK_LAYOUT | LIVE | **PARTIAL** | Wicked Bites preview player exists with static player shell. **Gap:** Full reusable player contract across approved games plus score/timer/achievement/XP/challenge surfaces is incomplete. |
| 5 | World Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | World route exists; candidate adds canonical environment/cast discovery. **Gap:** Interactive/structured world map, lore model, discoveries/progress and approved location structure remain absent. |
| 6 | Characters Hub | POLISH | ABSENT | **NOT_STARTED** | Canonical character assets exist. **Gap:** Dedicated route, collection/filter/relationships/appearances/discovery-progress experience absent. |
| 7 | Toadal Character Profile | POLISH | ABSENT | **NOT_STARTED** | Canonical Toadal identity/assets are established. **Gap:** Dedicated biography/personality/history/abilities/friends/locations/games/stories/gallery/collectibles page absent. |
| 8 | Stories / Comics Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | Stories route exists; candidate adds canonical setting/cast composition. **Gap:** No published series/latest chapter/reading progress/comics/manga/shorts/lore/BTS data. |
| 9 | TOADAL FEAST Manga Series | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Series/reader requirements are preserved in the manifest. **Gap:** Series route, cover/synopsis/chapter list/progress/character/lore links absent. |
| 10 | Comic / Manga Reader | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Reader contract is documented. **Gap:** Reader, thumbnails, prev/next, fullscreen, progress and bookmarks absent. |
| 11 | Media Hub | LOCK_LAYOUT | LIVE + CANDIDATE | **PARTIAL** | Media route exists; candidate adds canonical world and character gallery. **Gap:** Featured trailer/video/gameplay/shorts/wallpapers/downloads/creator/press structure and real published records absent. |
| 12 | News / Updates Hub | LOCK_LAYOUT | LIVE | **PARTIAL** | News route exists with truthful placeholder state. **Gap:** No real dated published update catalog/filters/trending content. |
| 13 | News Article / Devlog | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Editorial detail template is required. **Gap:** Article route, body/media slots, related links and prev/next absent. |
| 14 | Feast Pass Dashboard | LOCK_LAYOUT | LIVE | **PARTIAL** | Explanatory/planned Feast Pass route exists and avoids fake economy data. **Gap:** Guest-local level/XP/Sparks/Treats/streak/daily reward/reward track/discoveries are not implemented. |
| 15 | Quests / Challenges | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Quest concepts and assets exist. **Gap:** Daily/weekly/exploration/game/story quests, rewards and history absent. |
| 16 | Rewards / Collection | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Reward assets/state concepts exist. **Gap:** Reward track, badges, titles, cosmetics, foods/relics/collectibles and lock states absent. |
| 17 | Leaderboards | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Global connected identity is correctly deferred. **Gap:** Even the truthful local-public leaderboard surface/game selector/time scopes/personal position is absent. |
| 18 | App / Get TOADAL FEAST | LOCK_LAYOUT | LIVE | **PARTIAL** | Informational App route correctly describes mobile as flagship. **Gap:** Genuine approved screenshots/video and verified App Store/Google Play destinations are missing. |
| 19 | Account / Sign Up / Login | LOCK_LAYOUT | ABSENT | **DEFERRED_SERVICE** | Backend-connected account/sync is intentionally deferred. **Gap:** Manifest still requires a truthful guest/account-benefits preview and continue-as-guest surface; route absent. |
| 20 | Player Profile | LOCK_LAYOUT | ABSENT | **NOT_STARTED** | Guest-local profile is allowed without connected account. **Gap:** Guest profile, local level/XP/title/scores/discovery/achievement showcase absent. |
| 21 | Community Hub | POLISH | HOME_CARD_ONLY | **DEFERRED_SERVICE** | Community is truthfully marked Coming Soon on Home. **Gap:** Dedicated polished gated route/creator spotlight/fan-art/event/guideline discovery absent. Posting remains deferred. |
| 22 | Store | POLISH | HOME_CARD_ONLY | **DEFERRED_SERVICE** | Store is truthfully marked Coming Soon; no fake checkout. **Gap:** Dedicated polished preview route/categories/digital goodies/update CTA absent. |
| 23 | Search / Discovery | LOCK_LAYOUT | DISABLED_UTILITY | **NOT_STARTED** | Search is not falsely presented as live. **Gap:** Dedicated local search route, grouped results, filters and meaningful empty/results states absent. |
| 24 | What's Next / Roadmap | LOCK_STRUCTURE_ONLY | HOME_SECTION_ONLY | **PARTIAL** | Truthful compact What's Next content exists without fake dates. **Gap:** Dedicated approved-items roadmap route/status taxonomy/devlog links absent. |
| 25 | Support / Help Center | LOCK_LAYOUT | LIVE | **PARTIAL** | Support route exists. **Gap:** Help search/categories/popular questions/contact/status shortcuts and mature help content absent. |
| 26 | Contact / Feedback | LOCK_LAYOUT | ABSENT | **BLOCKED_CONTENT_ENDPOINT** | Dedicated contact assets/state exist. **Gap:** Route/form/category/email/subject/message/device info and real endpoint/approved destinations absent. |
| 27 | About TOADAL GAMES | POLISH | ABSENT | **NOT_STARTED** | TOADAL GAMES is subordinate in current shell/footer. **Gap:** Dedicated mission/flagship universe/experiments/stories/philosophy/press-business page absent. |
| 28 | Coming Soon / Under Construction | POLISH | INLINE_STATES_ONLY | **PARTIAL** | Truthful Coming Soon cards and production construction Toadal asset exist. **Gap:** Dedicated reusable branded route with related available content/follow-up path absent. |
| 29 | Privacy / Terms / Legal | LOCK_STRUCTURE_ONLY | ABSENT | **BLOCKED_APPROVED_COPY** | Privacy/legal assets and template requirement exist. **Gap:** Dedicated readable legal template and approved policy/terms copy absent. |
| 30 | 404 / Lost in the Feast | POLISH | LIVE | **DONE_PROVEN** | Branded 404/recovery page exists and routing/base-path behavior has been verified. **Gap:** Optional search/Treat embellishment may improve it later but is not required to call the recovery route functional. |

### Page-family status count

- **BLOCKED_APPROVED_COPY: 1**
- **BLOCKED_CONTENT_ENDPOINT: 1**
- **DEFERRED_SERVICE: 3**
- **DONE_PROVEN: 1**
- **NOT_STARTED: 11**
- **PARTIAL: 13**

Route presence is not the same as page completion. The current implementation exposes 12 of the original 30 page families as actual routes/surfaces; several are still only truthful previews.

## Cross-cutting product contract

| Requirement | Status | Evidence / gap |
|---|---|---|
| TOADAL FEAST-first public identity | **DONE_PROVEN** | Current authority and candidate keep TOADAL FEAST primary and TOADAL GAMES subordinate. |
| Website feels like entering the Feast World | **PARTIAL** | Canonical food-fantasy art is present, but approved Home is still much richer/denser than candidate. |
| Play something free immediately | **PARTIAL** | Wicked Bites has an isolated preview player, but current authority still reports zero PUBLIC games. |
| Discover characters/world/story | **PARTIAL** | World/Stories/Media routes exist; Characters Hub and Toadal Profile do not. |
| Consume media/manga/lore/news | **PARTIAL** | Media/News previews exist; manga/reader/article publishing stack is absent. |
| Guest-first Feast Pass progression | **NOT_STARTED** | No durable guest-local XP/level/Sparks/Treats/streak/quests/discoveries runtime. |
| Account later for preserve/sync | **DEFERRED_SERVICE** | Correctly deferred; guest/account preview route still absent. |
| Convert visitors to flagship mobile app | **PARTIAL** | App route exists, but genuine product screenshots and verified store links are missing. |
| Reactive Toadal companion | **PARTIAL_CANDIDATE** | Live staging has a bounded contextual image set; combined candidate expands semantic state artwork substantially. Many manifest destinations do not exist yet. |
| Hidden Treats / collectible food | **NOT_STARTED** | Food library exists; site interaction/progression loop not implemented. |
| Daily rewards | **NOT_STARTED** | Documented concept only. |
| Quests/challenges | **NOT_STARTED** | Documented concept only. |
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
| Guest progression storage contract | **NOT_STARTED_SALVAGE_AVAILABLE** | Current contract is defined; historical donor proves behavior, but migration to toadal:web:v1:* records has not been implemented. |

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
- **integration/visual-convergence-combined-20261001** `58a7121e363d3480c122623b1de5cd0d5ac1778e` - Latest combined visual candidate; review only, not manifest completion.
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

1. **Home LOCK_VISUAL closure** (manifest rows 1) - Required north-star acceptance; prevents visual drift across all later pages.
2. **Guest progression foundation** (manifest rows 14, 15, 16, 20) - Closes a major cross-cutting product loop and unlocks Feast Pass/Quests/Rewards/Profile without waiting for account backend.
3. **Characters Hub + Toadal Profile** (manifest rows 6, 7) - Two completely missing approved Batch-1 families; directly advances discovery journey.
4. **Stories publishing stack** (manifest rows 8, 9, 10) - Turns a placeholder hub into the required content/reader system.
5. **Editorial/discovery utilities** (manifest rows 11, 12, 13, 23, 24, 25) - Converts empty previews into usable media/news/search/roadmap/support surfaces.
6. **Truthful gated ecosystem routes** (manifest rows 19, 21, 22, 26, 27, 28, 29) - Eliminates dead-end/missing ecosystem families without fabricating backend functionality.
7. **App conversion evidence closure** (manifest rows 18) - Completes flagship conversion only when evidence is real.
8. **Play depth / additional browser game integration** (manifest rows 2, 3, 4, 17) - Improves immediate-play funnel after core site product structure is under control.

Arcade remains a separate HOLD/evidence lane and is **not** allowed to consume the website roadmap unless a manifest-level browser-game integration task specifically requires it.
