# TOADAL FEAST Website Visual Convergence Candidate — 2026-10-01

## Purpose

This branch is a review candidate for the website lane. It combines the accepted staging baseline, the recovered Master V2 companion asset authority, enriched World/Stories/Media discovery pages, Codex's Home/header convergence pass, and an additional truth-preserving visual convergence pass for Play and the discovery hubs.

It is **not** a staging deployment, production approval, or permission to merge to `staging/live-visual`.

## Provenance

- Frozen staging baseline: `270940dee30b7aafb70af941c520c6d4d223e288`.
- Master V2 authority lineage: `8cf06eb` -> `6271795`.
- Discovery visual lineage: `c73415bb9eac61facedc4318c4b4471c9cdd739a`.
- Home/header convergence source reviewed from Codex branch `work/home-header-visual-convergence-20261001`, commit `0c38df3dc602fad8230b7ede1dea7daf62b24e64`, whose parent is exactly `270940d`.
- Combined review branch: `integration/visual-convergence-combined-20261001`.
- Visual authority: `docs/authority/VISUAL_AUTHORITY.md`.
- Home LOCK_VISUAL reference: `docs/review/WO-002/evidence/approved-home-visual-authority.png`.
- Batch-1 hub references include `assets/reference/mockups/batch-1/02_PLAY_GAMES_HUB.png`, `05_WORLD_HUB.png`, and `08_STORIES_COMICS_HUB.png`.

## What this candidate changes

### Home and shared shell

The Codex convergence treatment is retained: a tighter shared header, shorter/brighter illustrated Home hero, stronger canonical Toadal presentation, a denser browser-games + Planned Feast Pass band, a compact Today ribbon, and a Home companion placement that does not cover page content.

### Play

Play is moved away from the generic purple editorial block toward the approved illustrated portal direction using only canonical repository art. The hero now uses the Feast World environment and canonical Toadal; the four truthful PREVIEW listings become a compact visual grid.

The approved mockup's fifth Arcade card, leaderboard, daily challenges, badges/rewards, and live Feast Pass data are **not fabricated**. The current product truth remains four PREVIEW listings, zero PUBLIC games, one isolated runnable Wicked Bites staging route, CLAW held, and two concept-only entries.

### World

World now has a full illustrated Feast World hero and a denser discovery composition that combines canonical environment art and character previews. It intentionally does not pretend that an interactive world map, discovery economy, progress counters, or unpublished locations exist.

### Stories and Media

Stories and Media use richer canonical character/environment compositions and denser discovery bands. They remain truthful previews: there is no invented chapter archive, comic reader, release schedule, downloadable press kit, or usage license.

## Browser evidence

Fresh post-fix browser QA covered the nine current top-level routes at both 1440x900 and 390x844:

- Home
- Play
- World
- Stories
- Media
- Feast Pass
- News
- App
- Support

Result: **18/18 PASS** for horizontal containment, completed broken images, console/runtime exceptions, HTTP >=400 responses, non-cancelled loading failures, and companion horizontal/fixed containment.

Evidence: `docs/review/visual-convergence-20261001/runtime-qa.json`.

Post-fix captures in the same folder include Home desktop, Play desktop/mobile, World desktop/mobile, Stories desktop, and Media desktop. Lazy imagery was forced to load before evidence capture to avoid false blank-image screenshots.

## Repository verification

The current candidate passes:

- Pages base-path verification: 16 HTML files.
- Static-link verification: 16 HTML files.
- WO-001 Home verifier: 55 checks.
- Home visual contract: 29/29 gates.
- Navigation truth: 15 implemented routes, 18 navigation targets, 0 unresolved.
- `git diff --check`.
- Source/export stylesheet byte parity.

The authority inventory is regenerated after the visual changes.

## Known hold / non-regression

`verify-staging-robots.mjs dist staging` still reports one known publication-policy gap:

`public/games/wicked-bites/index.html` does not contain a staging `noindex,nofollow` meta tag.

That file is the byte-preserved qualified Wicked Bites standalone package. This candidate does **not** silently modify its qualified bytes just to satisfy the meta-tag check. The gap requires a deployment-level robots policy that does not mutate the cartridge, or an explicit cartridge requalification after such a change.

The separate TOADAL FEAST Arcade lane also remains held. The remote `work/WO-003-arcade-isolation-20260930` branch preserves ARC-QUAL-01 evidence but does not itself change the Arcade HOLD disposition.

## Remaining visual/product gap

This candidate substantially improves convergence but does not claim the approved mockups are literal screenshots of already-built product functionality.

The largest remaining gaps are:

1. Final production TOADAL FEAST wordmark/header utility treatment versus the richer mockup shell.
2. Play-side modules that require real product data or approved functionality: additional qualified games, live progression, rankings/challenges/rewards.
3. World map/progress/discovery depth that requires approved world structure and state.
4. Published story/comic content and the separate Characters Hub, Toadal Profile, Manga Series, and Comic Reader route families from Batch 1.
5. Approved mobile-app screenshots and verified App Store / Google Play destinations.
6. Community, Store, account synchronization, and persistent Feast Pass systems where authority still marks functionality as planned/deferred.
7. Final owner visual acceptance and promotion of a reviewed candidate to staging.

## Decision state

The correct next gate is **review/merge selection**, not more blind styling and not deployment. The candidate is technically coherent and materially closer to the approved visual authority while keeping unavailable features unavailable.
