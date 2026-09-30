# CP9 / V13 Player Compatibility Plan
**Date:** 2026-09-30
**Status:** planning authority for WO-002; not authorization to start WO-002.

## Why this exists

The recovered CP9/V13 donor already has a working browser-player boundary and two qualified staging cartridges. The current website contract uses a newer message vocabulary.

WO-002 should use a **thin compatibility adapter**, not rewrite the qualified games merely to rename messages.

## Authorities

Current website contract:
`toadal.game.v1`

Recovered CP9 host contract:
`toadal-web-player-v2`

CP9 source authority:
- `src/data/player-contract.json`
- `src/data/cartridge-standard.json`
- `src/scripts/cartridge-host.js`
- `src/data/web-games.json`

CP9 player facts:
- mount: sandboxed iframe;
- preferred public delivery: versioned origin;
- host owns navigation/fullscreen/mute/how-to/access;
- game owns simulation/rendering/input/local save;
- strict origin + source + type validation;
- pause/resume on visibility/page lifecycle;
- distinct browser-local save namespaces;
- measure time-to-playable;
- package-size references are warnings, not universal eligibility caps.

## Message normalization

### CP9 game → current host
| CP9 | Current normalized event | Rule |
|---|---|---|
| `game.ready` | `game:ready` | direct |
| `game.gameplayStart` | `game:started` | direct; use as gameplay-start/time-to-playable signal |
| `game.complete` | `game:complete` | direct |
| `game.exit` | `game:request-exit` | host decides navigation |
| `game.error` | `game:error` | recoverable player error state |
| `game.requestFullscreen` | `game:request-fullscreen` | host owns fullscreen |
| `game.saveStatus` | no public current event | advisory/internal only |

### Current host → CP9 game
| Current | CP9 | Rule |
|---|---|---|
| `host:pause` | `host.pause` | direct |
| `host:resume` | `host.resume` | direct |
| `host:mute` | `host.mute` | direct |
| `host:unmute` | `host.unmute` | direct |
| `host:init` | none | optional; do not require from legacy game |
| `host:visibility` | pause/resume | translate based on hidden/visible |
| `host:exit-confirmed` | none | host-only finalization |

Machine-readable authority:
`docs/implementation/CP9_PLAYER_COMPATIBILITY_MAP.json`

## Security boundary

The adapter must fail closed:
1. verify exact iframe source window;
2. verify exact cartridge origin;
3. verify the CP9 contract marker before normalizing;
4. allowlist message type;
5. validate payload shape;
6. never act on unknown or malformed messages;
7. never let the iframe navigate the parent directly.

## First two integration candidates

### Wicked Bites
- version: 5.5
- source: `Matthew75x/feast-crossing-wicked-bites`
- commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- qualified CP9 staging entry SHA-256:
  `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`

### CLAW: Feed Gulper
- version: 2.5.1
- source: `Matthew75x/claw-feed-gulper`
- commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- qualified CP9 staging entry SHA-256:
  `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`

Both remain **withheld from current Home launch routing** until the new player integration passes.

## WO-002 implementation sequence

1. build the current player shell;
2. add the CP9-v2 compatibility adapter;
3. integrate Wicked Bites 5.5 without changing its internals unless a real incompatibility is proven;
4. run player/exit/fullscreen/pause/resume/mobile/reload/network tests;
5. integrate CLAW 2.5.1 through the same adapter;
6. repeat qualification;
7. only then audit the limited TOADAL FEAST Arcade preview;
8. leave planned games planned unless a real runnable package is located and certified.

## Do not do

- do not rewrite the two qualified games merely to match new message names;
- do not bundle whole source repositories into the website;
- do not expose staging endpoints directly as final production URLs;
- do not claim native/mobile save continuity;
- do not let account-gated content rely on client-only hiding;
- do not turn package-size guidance into an arbitrary hard cap;
- do not start this implementation before WO-001 is accepted.
