# Contextual companion runtime closure candidate — 2026-10-01

Base authority: `ops/web-authority-consolidation-20261001@92decef6cef31622833458e2a98dd9e577ca79c2`

Integration branch: `integration/contextual-companion-authority-20261001`

## Scope

This candidate closes only the authority-documented visual-reaction gap. It does not change `main`, production, DNS, Arcade qualification, app-store destinations, editorial content, or guest progression.

Only the four assets selected by `manifests/companion-runtime-assets.json` are wired:

- World/map contexts → map-guide Toadal
- Support/help contexts → headset Toadal
- App/mobile contexts → smartphone Toadal
- Stories/Media contexts → thinking Toadal

All other contexts retain the existing canonical victory Toadal. No unselected production-pack pose is implied to be approved.

## Runtime behavior

The existing action/focus/hover/touch/current-section priority remains intact. Artwork is applied before the dialogue-panel visibility return, so Toadal can visibly react even while the speech panel is minimized.

Media's reaction label is aligned from `excited` to `thinking` because Stories/Media share the authority-selected thinking artwork.

The standalone browser-game package under `dist/public/games/` is unchanged.

## Runtime asset optimization

The exact selected PNG sources remain preserved in the authority tree. Runtime uses 640px alpha-preserving WebP derivatives with source and derivative SHA-256 values recorded in `manifests/companion-runtime-derivatives.json`.

Selected PNG source total: 5,539,737 bytes.
Runtime WebP total: 240,400 bytes.

## Browser evidence

A local GitHub-Pages-base-path preview was exercised in headless Chromium.

Passed:
- World route → map guide
- Stories route → thinking
- Media route → thinking
- App route → smartphone
- Support route → headset
- News → canonical victory fallback
- Feast Pass → canonical victory fallback
- Play → canonical victory fallback
- Home default → canonical victory fallback
- Home World hover → map guide
- Home Stories/Media hover → thinking
- Home App hover → smartphone
- Home Feast Pass hover → canonical fallback
- Support contact hover → headset
- Mobile World → map guide

Mobile companion remained inside a 390×844 viewport at 264×56 with 12px right/bottom clearance.

Console errors: 0.
Relevant failed requests: 0.

Machine-readable result: `docs/review/companion-authority-proofs/runtime-result.json`.
Visual crops: `world.png`, `stories.png`, `app.png`, and `support.png` in the same proof folder.

## Regression checks

- `scripts/verify-pages-basepath.mjs`: PASS
- `scripts/verify-navigation-truth.mjs`: PASS, 0 unresolved targets
- `scripts/verify-cartridge-storage-isolation.mjs`: PASS
- `git diff --check`: PASS
- `dist/public/games/` diff versus authority base: none

Two repository checks are already red on the unchanged staging baseline and are therefore not regressions from this candidate:

- `scripts/verify-static-links.mjs` mis-resolves the `/toadal-feast-web/` Pages base path and already fails on `staging/live-visual`.
- `scripts/verify-staging-robots.mjs` already fails because `dist/public/games/wicked-bites/index.html` lacks staging `noindex,nofollow`.

## Promotion rule

Promote this authority lineage forward into `staging/live-visual`; do not cherry-pick only generated `dist` files and discard the authority/source records.
