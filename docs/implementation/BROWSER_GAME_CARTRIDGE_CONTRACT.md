# TOADAL FEAST — Browser Game Cartridge Contract
**Status:** implementation authority for WO-002 and later browser games

## Goal
Browser games should be isolated, replaceable playable packages that can run inside the TOADAL FEAST website without coupling the global website shell to one game's internal implementation.

## Packaging model
A cartridge is a self-contained static web package under:

`public/games/<game-id>/`

Required:
- `index.html`
- `cartridge.json`

Optional:
- assets/
- scripts/
- styles/
- screenshot.webp
- poster.webp
- LICENSE/credits files when needed

The website player shell must not reach into undocumented internal game files.

## Manifest
Each cartridge manifest must declare:
- id
- displayName
- version
- publicState
- entry
- poster
- orientation
- input capabilities
- save behavior
- fullscreen support
- mobile support
- message protocol version
- source provenance
- known limitations

## Isolation
Preferred host:
- same-origin iframe
- explicit `allow` permissions only
- no wildcard cross-origin access
- no direct dependency on website DOM structure

A game must not assume:
- it is top-level window;
- fixed viewport dimensions;
- production domain;
- global website CSS.

## Message protocol
Version: `toadal.game.v1`

Cartridge → host:
- `game:ready`
- `game:started`
- `game:paused`
- `game:resumed`
- `game:score`
- `game:complete`
- `game:error`
- `game:request-exit`
- `game:request-fullscreen`

Host → cartridge:
- `host:init`
- `host:pause`
- `host:resume`
- `host:mute`
- `host:unmute`
- `host:exit-confirmed`
- `host:visibility`

Unknown messages must be ignored.

The list above defines the protocol vocabulary. Core lifecycle messages are required where applicable to normal play. The host shell remains responsible for route exit and fullscreen UI.

Conditional request semantics:
- `game:request-exit` is optional when the cartridge has no internal host-exit affordance. If a cartridge emits it, it must also accept `host:exit-confirmed`.
- `game:request-fullscreen` is optional when fullscreen is exposed only by the host shell. If a cartridge emits it, its manifest must declare fullscreen support.
- A cartridge must not invent dummy exit/fullscreen controls merely to satisfy protocol-token checks.

## Saving
Each cartridge owns its internal save namespace.

Website-owned local state uses:
`toadal:web:v1:`

Game cartridge storage should use:
`toadal:game:<game-id>:v1:`

Do not reuse mobile save keys unless a migration/import feature is explicitly designed.

## Public-state gate
A cartridge may only be `PUBLIC` when:
1. a runnable static package exists;
2. package dependencies are closed;
3. required assets resolve offline from package scope;
4. desktop and target mobile input paths work;
5. reload/resume behavior is understood;
6. console/network error smoke test passes;
7. the website shell can enter/exit safely;
8. truthful limitations are documented.

Otherwise use `PREVIEW`, `PLANNED`, or `COMING_SOON`.

## Product evidence
Screenshots shown on Game Detail pages must come from the actual cartridge or another real approved build.

## Size
There is no arbitrary universal package-size cap.

However:
- remove unused masters/source art;
- avoid copying entire game repositories;
- use web-optimized assets;
- lazy-load optional media;
- record compressed/uncompressed package size.

A package is rejected for waste, not merely for crossing a made-up number.

## Exit/fullscreen
The website host owns:
- browser history integration;
- fullscreen entry/exit UI;
- route exit;
- surrounding navigation.

The cartridge owns gameplay pause state but must accept host pause/resume messages.

## Accessibility
The player shell must expose:
- game title/state;
- exit control;
- fullscreen control;
- sound control where applicable;
- keyboard-focus escape route.

The cartridge must not trap keyboard focus permanently.

## Failure state
If the game fails to initialize:
- show a branded recoverable error;
- offer retry;
- offer return to Play;
- never leave a blank iframe as the final state.
