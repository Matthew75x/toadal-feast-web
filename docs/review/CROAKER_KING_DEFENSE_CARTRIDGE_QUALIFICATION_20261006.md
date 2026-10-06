# Croaker King Defense — cartridge qualification record — 2026-10-06

**Status:** external/local cartridge candidate record. This file does not install the game into the website and does not authorize PUBLIC state.

## Identity

- Game/cartridge ID: `croaker-king-defense`
- Display name: **Croaker King Defense**
- Candidate version: **2.0.0**
- Protocol: `toadal.game.v1`
- Storage namespace: `toadal:game:croaker-king-defense:v1:`
- Declared public state: `PREVIEW`

## Source provenance

The combined two-mode source was restored from preserved execution records plus the intact Croaker King Defense v1.10.0 and Cannon Horde 0.7.0 donors. It is not claimed byte-identical to a later unpublished v2.0.1 workspace.

Restored entry SHA-256:

`f09be56a38792beae7ac435762b80e38bc345dcfa8c3f3272f7b955254cf53cd`

## Hardening result

The exact restored entry was re-run through TOADAL Cartridge Hardener v1 with project regression commands enabled.

Result:

- disposition: **PREVIEW_CANDIDATE**
- hardening level: **CHL-4 / QA-QUALIFIED**
- mandatory failures: **0**
- runtime ledger SHA-256: `37ffde4c9701c110e4195cf16ddd64a97373c16913fded6d14817eda61a901e8`
- deterministic cartridge ZIP SHA-256: `0eecab75504b1656147775adbdb0978a2b368e3fbc042497f711461bf12d74a3`

The deterministic ZIP check was repeated twice from unchanged source and produced identical archive bytes.

### Local/fresh checks

- combined package verification: PASS
- Cannon Horde rules/replay regression: PASS
- two-mode clean lifecycle smoke: PASS
- bound package evidence:
  - package verification: 5 passed / 0 failed
  - browser integration: 25 passed / 0 failed
  - Horde rules/replay: 21 passed / 0 failed
  - multi-viewport presentation: 35 passed / 0 failed
- real-build poster and screenshot: PASS
- cartridge schema v1: PASS
- output ZIP CRC/integrity: PASS

## External gates

Still required for this exact package:

1. **Real TOADAL website player/iframe lifecycle — NOT RUN.**
2. **Physical-device acceptance/performance — NOT RUN.**
3. **PUBLIC decision — BLOCKED until external gates and release authority permit it.**

A synthetic HTTPS host-harness attempt was blocked by managed Chromium policy with `ERR_BLOCKED_BY_ADMINISTRATOR`. No policy bypass was attempted and the blocked harness is not counted as a PASS or FAIL.

## Admission rule

This candidate may proceed to the real website-player acceptance lane as a PREVIEW candidate. Do not:

- mark it PUBLIC from local hardening alone;
- merge Horde scores into Fortress results without mode-aware host support;
- treat earlier single-mode qualification as proof for this exact combined package;
- mutate the package bytes without invalidating this qualification record.
