# WO-001 — Approved Home Parity Preflight
**Date:** 2026-09-30
**Branch:** `fix/wo001-approved-home-parity-20260930`
**Parent:** `4e0b4f32b3f6e540bb518703101732e67de9cb2f`

## Visual authority
Approved Home image:
`TOADAL_APPROVED_HOME_VISUAL_AUTHORITY.png`

Reference dimensions:
`1491 × 1055`

SHA-256:
`4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`

## What changed in this bounded remediation

- preserved the existing Studio 1.4.2 architecture and product-truth contracts;
- promoted canonical Toadal victory art into the Home hero;
- added the canonical game-ui crown accent to the shared brand slot;
- brightened and compressed the hero to expose portal content sooner;
- made the hero more character-led and closer to the approved composition;
- kept the staging-safe `Explore the Feast World for Free.` headline while Home has zero integrated launch routes;
- added compact benefit signals without implying unavailable functionality;
- made Games + planned Feast Pass share one desktop band;
- reduced card/section whitespace and increased dashboard density;
- converted Today into a compact current-adventure ribbon;
- enriched the Stories & Media preview without fabricating published content;
- paired App conversion + What's Next on desktop;
- kept store buttons visibly disabled;
- changed the companion from an always-open admin-style note to a character-first helper:
  - Toadal remains visible;
  - contextual speech appears on hover/focus/touch;
  - user can pin it open;
  - explicit minimize persists and overrides future hover.

## Canonical assets added

### Toadal victory
Source:
`assets/images/characters/reactions-v1/toadal/victory.png`

SHA-256:
`8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`

Website copy:
`reference/assets/images/characters/toadal-victory.png`

### Brand crown
Source:
`assets/themes/froggy-feast/ui-v2/brand-crown.svg`

Website copy:
`reference/assets/brand/brand-crown.svg`

SHA-256:
`6fcbfd6dc4193ae86f9ffd42f999d2057fa12d4360bb35ef5d4d2b41a718ee4d`

The crown is a shell accent only. It does not replace the future exact approved TOADAL FEAST wordmark asset.

## Source-contract results

- Home visual contract: **26/26 PASS**
- navigation truth: **14/14 PASS**
- Pages base-path suite: **8/8 PASS**
- canonical asset audit: **10/10 PASS**
- JSON parse: PASS
- `git diff --check`: PASS

## Responsive visual preflight

A source-faithful pre-Studio renderer was used only to validate layout direction before spending another Studio render cycle.

Evidence:
`docs/review/WO-001/parity-preflight/`

Viewports:
- 390×844 — 0 horizontal-overflow offenders
- 430×932 — 0
- 768×1024 — 0
- 1366×768 — 0
- 1600×900 — 0
- 1920×1080 — 0

Desktop hero height after remediation:
**510px**

Desktop band relationship verified:
- Games left + Feast Pass right
- App conversion left + What's Next right

Mobile:
- nav collapses;
- hero remains legible;
- search utility is intentionally removed from the small-screen hero;
- canonical Toadal remains visible;
- no horizontal overflow.

## Interaction smoke

`interaction-smoke.json`:
**13/13 PASS**

Covered:
- default character-only companion;
- hover context reveal;
- hover exit collapse;
- user pin-open;
- persisted minimize;
- explicit minimize overriding hover;
- public-game empty state;
- All filter restores four cards;
- mobile nav collapsed state;
- mobile nav open;
- Escape closes nav + restores focus;
- no mobile horizontal overflow;
- runtime error capture empty.

## Visual disposition

This remediation is materially closer to the approved Home:
- bright Feast World is visible;
- Toadal is a major hero focal point;
- hero is no longer an oversized dark editorial masthead;
- Home reads as a dense game/world portal;
- Games + Feast Pass and App + future state are grouped like the approved composition;
- bottom-right helper behaves like a character rather than a persistent admin panel.

## Remaining gate before WO-001 acceptance

This branch is **READY FOR FINAL STUDIO 1.4.2 VALIDATION**, not accepted yet.

Required next:
1. Studio 1.4.2 validate;
2. inspect/render/static export;
3. final six-viewport browser captures from the actual Studio export;
4. final side-by-side review against the approved Home;
5. accept or one narrowly bounded visual fix.

Do not merge to `main` and do not begin WO-002 until that pass is accepted.
