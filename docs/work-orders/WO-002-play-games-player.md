# WO-002 — Play + Game Detail + Browser Player
**Status:** HOLD until WO-001 PASS
**Planned branch:** `work/WO-002-play-games-player`

## Goal
Implement the Play family and integrate the first two already-qualified browser cartridges through the current TOADAL FEAST player shell without fabricating game availability or rewriting proven games unnecessarily.

## Start condition
Do not begin until WO-001 is accepted.

Create:
`work/WO-002-play-games-player`

from the **accepted WO-001 commit**, not from this planning branch.

## Read first
- `docs/implementation/BROWSER_GAME_CARTRIDGE_CONTRACT.md`
- `docs/implementation/game-cartridge.schema.json`
- `docs/implementation/CP9_PLAYER_COMPATIBILITY.md`
- `docs/implementation/CP9_PLAYER_COMPATIBILITY_MAP.json`
- `docs/implementation/WEB_GAME_EVIDENCE_LEDGER_2026-09-30.json`
- `docs/implementation/BROWSER_GAME_AVAILABILITY_AUDIT.md`
- `docs/implementation/ARCADE_PREVIEW_SOURCE_AUDIT.md`
- `docs/implementation/PUBLIC_FEATURE_STATE.json`
- `docs/implementation/GITHUB_PAGES_ROUTING_CONTRACT.md`
- `docs/implementation/ASSET_INTEGRATION_POLICY.md`
- `docs/implementation/CP9_V13_DONOR_BASELINE.md`

Preflight:
`node scripts/verify-wo002-readiness.mjs`

Expected before implementation:
**15/15 PASS**

## Recovered CP9/V13 authority

Archive SHA-256:
`ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`

Recovered player contract:
`toadal-web-player-v2`

Current player contract:
`toadal.game.v1`

Use the documented thin compatibility adapter. Do **not** force qualified donor cartridges to rename their internal message protocol before integration.

## First two exact cartridge candidates

### 1. Wicked Bites
- version: **5.5**
- source: `Matthew75x/feast-crossing-wicked-bites`
- source commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- qualified staging entry SHA-256:
  `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- CP9 qualification: PASS
- current hosted entry recheck: HTTP 200 and exact byte/hash match
- current Home state: launch withheld until this work order passes

### 2. CLAW: Feed Gulper
- version: **2.5.1**
- source: `Matthew75x/claw-feed-gulper`
- source commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- qualified staging entry SHA-256:
  `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`
- CP9 qualification: PASS
- current hosted index recheck: HTTP 200 and exact entry hash match
- current Home state: launch withheld until this work order passes

Do not waste time searching only the mobile-game repository for these side games. Their source authority is separate.

## CP9 compatibility boundary

Legacy CP9 game messages normalize to current host events:

| CP9 | Current |
|---|---|
| `game.ready` | `game:ready` |
| `game.gameplayStart` | `game:started` |
| `game.complete` | `game:complete` |
| `game.exit` | `game:request-exit` |
| `game.error` | `game:error` |
| `game.requestFullscreen` | `game:request-fullscreen` |
| `game.saveStatus` | internal/advisory only |

Current host events normalize for CP9:

| Current | CP9 |
|---|---|
| `host:pause` | `host.pause` |
| `host:resume` | `host.resume` |
| `host:mute` | `host.mute` |
| `host:unmute` | `host.unmute` |
| `host:visibility` | translate to pause/resume |
| `host:init` | optional/no legacy equivalent |
| `host:exit-confirmed` | host-only/no legacy equivalent |

Fail closed on:
- wrong origin;
- wrong source window;
- wrong contract marker;
- unknown type;
- malformed privileged payload.

The cartridge must never navigate the parent directly.

## In scope

### Play Hub
Implement:
- structured game registry;
- GameCard;
- status/filter UI;
- featured game;
- clear PUBLIC/PREVIEW/PLANNED states.

### Game Detail
Implement reusable detail template:
- real key art/screenshot slots;
- status;
- controls/platform info;
- description;
- real Play CTA only for a certified route;
- Preview/Coming Soon behavior otherwise.

### Browser Player
Implement:
- sandboxed iframe host;
- loading/error/retry state;
- exit;
- fullscreen;
- sound state plumbing;
- pause/resume/visibility;
- responsive safe-area layout;
- keyboard-focus escape;
- current `toadal.game.v1` protocol;
- CP9-v2 compatibility adapter.

## Implementation sequence

1. Pass WO-002 readiness verifier.
2. Implement Play/Game Detail/Player shell.
3. Implement and unit-test the CP9-v2 compatibility adapter.
4. Integrate **Wicked Bites 5.5** unchanged unless a real incompatibility is proven.
5. Run full player qualification.
6. Integrate **CLAW 2.5.1** through the same adapter.
7. Run full player qualification.
8. Only after those two are stable, make the bounded TOADAL FEAST Arcade preview decision.
9. Leave other games Preview/Planned unless a real runnable package is found and certified.

## Arcade preview
The existing mobile source contains `arcade-standalone.html`, so a limited TOADAL FEAST Arcade browser preview remains a plausible candidate.

It is **not** the first integration target anymore.

Do not expose the old four-mode web console as the primary website product.

If integrated, label it a limited browser preview and document exactly what is omitted.

## Other games
Remain Preview/Planned until separately certified:
- Lily Pad Leap
- Froggie Fruity Bash
- Feast Defense / TOADAL Tower Defense
- other future slots

Do not implement a game merely because a card exists.

## Required tests

### Adapter
- exact source-window validation;
- exact origin validation;
- exact contract-marker validation;
- allowlisted legacy types;
- unknown type ignored;
- malformed privileged payload rejected;
- every documented inbound mapping;
- every documented outbound mapping.

### Player
- manifest schema validation;
- cartridge dependency audit;
- base-path validation;
- page/player navigation;
- ready/start/complete/error handling;
- pause/resume;
- exit;
- fullscreen;
- reload;
- console/network smoke;
- desktop + mobile viewport/input smoke;
- focus escape;
- recoverable initialization failure;
- real run completion before PUBLIC promotion.

### Performance/evidence
Record:
- source/ref;
- package manifest;
- file count;
- compressed/uncompressed bytes;
- entry/package SHA-256;
- time-to-playable;
- omitted features/assets;
- known limitations;
- real cartridge screenshots;
- exact test results.

Package-size guidance is advisory. Reject waste or bad runtime behavior, not an arbitrary universal size number.

## Public-state gate
Even with qualified historical staging evidence, a cartridge remains withheld from the current Home/Play launch route until:
1. it mounts through the current player shell;
2. current security/lifecycle tests pass;
3. mobile/desktop smoke passes;
4. product copy matches its real limitations.

## Out of scope
- implementing new mini-games;
- changing the mobile-game product architecture;
- global leaderboard service;
- account backend;
- Store/Community backend;
- production deployment;
- WO-003.

## Resource discipline
Do not:
- re-audit already-sealed source repositories unless a mismatch appears;
- rewrite Wicked Bites or CLAW merely for message naming;
- copy whole source repositories into the website;
- rebuild CP9 functionality without documenting why reuse is unsafe;
- start Arcade work before both first-party side-game integrations are stable;
- broaden into backend/account/store work.

## Stop condition
STOP after:
- Play Hub;
- Game Detail template;
- Player shell;
- CP9 compatibility adapter;
- Wicked Bites integration/evidence;
- CLAW integration/evidence;
- bounded Arcade decision

are complete and committed on the WO-002 branch.

Do not merge `main`.
Do not deploy production.
Do not start WO-003.
