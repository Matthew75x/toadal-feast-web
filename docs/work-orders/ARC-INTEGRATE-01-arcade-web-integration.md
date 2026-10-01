# ARC-INTEGRATE-01 — Qualified Arcade Website Integration

**Status:** HOLD until ARC-QUAL-01 = ARCADE QUALIFIED — PACKAGE ONLY

## Goal

Integrate the exact qualified Arcade cartridge into the accepted WO-002 website without changing the qualified cartridge bytes unnecessarily.

## Public state

Arcade remains:

`PREVIEW`

It is not the full mobile game.

## Website experience

Expose:

### Standard Arcade
Website-owned Standard chooser:
- Toadal
- Classic Frog
- Gully

Web-preview unlocks:
- Toadal: start unlocked
- Classic: first completed Standard run
- Gully: Standard best score >= 600 OR 3 completed Standard runs

### 5 Minute Feast
- Chomper
- canonical mode/rules

### Zen
- Princess Lily
- canonical mode/rules

Do not expose `tc` under this work order.

## Host ownership

Website owns:
- route;
- experience chooser;
- Standard character chooser;
- local preview progression;
- fullscreen request;
- exit;
- error/retry presentation.

Cartridge remains opaque-origin and communicates through the versioned game-host protocol.

## Persistence

Final Standard preview progression is host-owned under:

`toadal:game:toadal-feast-arcade-preview:v1:`

Do not use the mobile `froggyFeast` save.

## Required integration closure

- Arcade card/detail/player;
- correct PREVIEW truth;
- Wicked Bites legacy route compatibility;
- Home/Play regressions;
- navigation/aria-current;
- static links;
- base-path;
- responsive/player orientation;
- accessibility;
- console/network;
- staging-indexing policy;
- fresh static export;
- exact static ZIP hash.

## Prohibited

- deployment;
- merge to main without owner acceptance;
- Android/iOS changes;
- account/backend implementation;
- shop/cosmetics/mobile economy;
- arbitrary gameplay redesign;
- rebuilding the cartridge from a different donor after qualification.

## Output

Exactly one:

- `ARCADE QUALIFIED — WEB SAMPLER INTEGRATED`
- `ARCADE QUALIFIED — PACKAGE ONLY`
- `ARCADE HOLD`
