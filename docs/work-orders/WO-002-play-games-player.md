# WO-002 — Play + Game Detail + Browser Player
**Status:** ACTIVE — accepted WO-001 base `3e82fcd6990b92166769475aed3beffbec5b71f1`

## Goal
Implement the Play family and certify the first real browser cartridge without fabricating game availability.

## Start condition
Do not begin until WO-001 is accepted.

Create:
`work/WO-002-play-games-player`
from the accepted WO-001 commit.

## Read first
- `docs/implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md`
- `docs/implementation/game-cartridge.schema.json`
- `docs/implementation/BROWSER_GAME_AVAILABILITY_AUDIT.md`
- `docs/implementation/ARCADE_PREVIEW_SOURCE_AUDIT.md`
- `docs/implementation/PUBLIC_FEATURE_STATE.json`
- `docs/implementation/GITHUB_PAGES_ROUTING_CONTRACT.md`
- `docs/implementation/ASSET_INTEGRATION_POLICY.md`
- `docs/implementation/CP9_V13_DONOR_BASELINE.md`
- `docs/implementation/WO002_DONOR_PREFLIGHT_2026-09-30.md`
- `docs/review/WO-002/cartridge-intake/intake-evidence.json`

## CP9/V13 salvage gate
Before creating or sealing a new player/cartridge implementation, inspect the recovered CP9/V13 donor. It already contains working staging Play/player surfaces and cartridge packages/evidence for Wicked Bites and CLAW: Feed Gulper, plus the broader fullscreen/player/routing/funnel architecture. Reuse or port those proven pieces when compatible; do not discard them and rebuild from scratch merely because the certified Studio project is newer.

Preserve current product-truth states until each donor artifact is requalified in the new environment. Existing CP9 functionality is evidence to audit, not automatic permission to mark a game PUBLIC.

Document any deliberate replacement of a previously working CP9 capability.

## In scope

### Play Hub
Implement:
- structured game registry
- GameCard
- status/filter UI
- featured game
- clear PUBLIC/PREVIEW/PLANNED states

### Game Detail
Implement reusable detail template:
- real key art/screenshot slots
- status
- controls/platform info
- description
- real Play CTA only for PUBLIC cartridges
- Preview/Coming Soon behavior otherwise

### Browser Player
Implement:
- same-origin iframe host
- loading/error/retry state
- exit
- fullscreen
- sound state plumbing
- pause/resume/visibility protocol
- responsive safe-area layout
- focus escape
- cartridge postMessage protocol

### Cartridge intake priority
1. Audit the recovered CP9 Wicked Bites and CLAW cartridge packages/evidence first. If their qualification remains reproducible, port/reuse them rather than recreating them.
2. Separately audit/build the **limited TOADAL FEAST Arcade preview** from the existing `arcade-standalone.html` donor where it still adds value.

Do not copy the full game repo or entire assets tree.

Seal only dependencies required by explicitly selected preview/public profiles.

## Other games
The recovered CP9/V13 donor already contains staging packages/routes for Wicked Bites and CLAW; treat them as donor candidates requiring current-environment requalification, not as missing products.

Tower Defense/Feast Defense, Fruity Bash, Lily Pad Leap and other slots remain Preview/Planned unless a real runnable package is found and certified during the work order.

Do not implement a game merely because its card exists.

## Arcade preview truth
The website must call it a limited browser preview.
Do not imply all mobile modes/content/progression are present.

## Required tests
- manifest schema validation
- cartridge dependency audit
- base-path validation
- page/player navigation
- game ready/start/complete/error message handling
- pause/resume
- exit
- fullscreen
- reload
- console/network smoke
- desktop + mobile viewport/input smoke
- real run completion if candidate is promoted PUBLIC

## Evidence
Record:
- donor source/ref
- package manifest
- file count/bytes/hash
- omitted features/assets
- known limitations
- screenshots from real cartridge
- exact test results

## Out of scope
- implementing new mini-games
- global leaderboard service
- account backend
- Store/Community
- mobile-game repository redesign
- production deployment
- WO-003

## Stop condition
STOP after Play, Game Detail, Player, and the bounded Arcade cartridge decision are implemented/evidenced.

Do not merge main.
Do not deploy production.
Do not start WO-003.
