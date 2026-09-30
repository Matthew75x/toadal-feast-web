# WO-002 — Play + Game Detail + Browser Player
**Status:** HOLD until WO-001 PASS

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

### First cartridge candidate
Audit/build a **limited TOADAL FEAST Arcade preview** from the existing `arcade-standalone.html` donor.

Do not copy the full game repo or entire assets tree.

Seal only the dependencies required by the explicitly selected preview profile.

## Other games
Wicked Bites, Tower Defense/Feast Defense, Fruity Bash and CLAW remain Preview unless a real runnable package is independently found and certified during the work order.

Do not implement those games merely because their cards exist.

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
