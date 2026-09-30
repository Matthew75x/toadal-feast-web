# Arcade Web Preview — Evidence Snapshot
**Date:** 2026-09-30
**Purpose:** establish whether a Toadal-led limited browser preview is technically credible before WO-002.

## Current source capability

Current TOADAL FEAST 1.2.9 source contains a dedicated:
`arcade-standalone.html`

The runtime supports Toadal in standard Arcade and contains mobile-specific Toadal controls.

The test-only runtime path can force Toadal in standard Arcade via `devCharacter=toadal`, confirming the runtime already exercises this exact character/mode combination.

**Production web preview must not rely on the `devCharacter` query parameter.**
WO-002 should introduce a proper cartridge profile/configuration.

## Toadal runtime verification run on ASSIGNATOR

Executed:
`npm.cmd run verify:toadal-arcade`

Result:
- Arcade animation registry source/generated authority: **PASS**
- Toadal frozen asset integrity: **PASS 13/13**
- Toadal Arcade mechanics contract: **PASS**
- Toadal Arcade phase-3 integration: **PASS 22/22**
- Toadal Arcade adversarial mechanics: **PASS 34 cases**
- Toadal Arcade regression contract: **PASS 18/18**

Total command runtime was about 6.4 seconds on ASSIGNATOR.

## Browser witness

Executed:
`node scripts/test-arcade-roster-mechanics-browser.js --character=toadal`

Result:
**PASS 1/1**

Governed roster reported: 11.

Evidence path produced by the game QA harness:
`benchmark-reports/arcade-roster-mechanics/qa-arcade-roster-mechanics-2026-09-30T06-09-26-926Z/report.json`

## Mobile controls

Executed:
- `npm.cmd run test:arcade-mobile-control-authority`
- `npm.cmd run qa:browser:arcade-mobile-control-authority`

Result:
**PASS**

Verified by the existing game contract:
- gesture-first + one-hand defaults
- bottom-right optional assist
- assist taps stay movement-only
- ordinary Tongue de-clutter
- Toadal Minimal mode hides optional special controls
- portrait scenic continuation
- canonical Toadal Hop cancellation wiring
- no mobile control-dock canvas shrink
- Pause/HUD reservation
- browser portrait geometry and free/anchored drag behavior

## Frozen Toadal asset authority

The current Arcade frozen manifest contains 13 integrity-locked files including:
- portrait
- idle
- run
- tongue catch
- jump / Royal Hop
- hurt
- swallow
- Golden Throw
- Golden Block
- victory
- projectile/block effects
- source manifest

The separate source manifest explicitly says:
**No additional character generation required for this final Arcade core set.**

## Package architecture finding

The repository already has a `build standalone arcade` factory.

However that factory begins by calling `buildPlayerBase()`, which packages the full player release before converting the Arcade entrypoint to `index.html`.

That is appropriate for release/distribution safety but **not** a minimal website cartridge strategy.

Current production-package integrity authority reports:
- 2,017 files
- 274,809,077 bytes

The full local `assets/` tree alone is about 216.85 MiB.

Therefore WO-002 should not simply run the existing standalone build and copy its output into the website.

## Static dependency evidence

A static-string closure beginning at `arcade-standalone.html` found:
- 359 directly discoverable files
- 19.29 MiB

This is a lower bound because runtime registries use dynamic asset families.

That result is still useful: a purpose-built preview cartridge can plausibly be much smaller than the full release package, but runtime closure—not arbitrary file deletion—must determine the final set.

## Decision

A **Toadal-led standard Arcade web preview is technically credible** and is the preferred first real website cartridge candidate.

It is **not PUBLIC yet**.

Remaining blockers:
1. proper non-dev preview profile/config;
2. cartridge storage isolation;
3. sealed runtime dependency package;
4. website host/postMessage integration;
5. clean network/console/run-completion QA;
6. real cartridge screenshots and final package manifest.
