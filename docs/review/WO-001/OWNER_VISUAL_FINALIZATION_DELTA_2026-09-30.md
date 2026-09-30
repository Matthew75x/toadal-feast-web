# WO-001 — Owner Visual Finalization Delta
**Date:** 2026-09-30
**Base:** `3e82fcd6990b92166769475aed3beffbec5b71f1`
**Branch:** `fix/wo001-owner-visual-finalization-20260930`

## Why this branch exists
The Codex WO-001 closure is technically strong and remains preserved unchanged. This branch is a deliberately smaller **owner-visual refinement lane** so additional mockup alignment does not rewrite or blur the accepted technical evidence.

## Approved Home direction retained
The implementation is now materially aligned with the approved Home direction:
- dark chocolate navigation;
- cream content surfaces;
- vivid pink primary CTAs;
- gold accents;
- bright food-fantasy hero environment;
- canonical golden Toadal;
- immediate browser-game discovery;
- Feast Pass sidecar;
- character / world / stories discovery;
- app conversion paired with future-state content;
- contextual Toadal companion;
- dense game-portal rhythm rather than a corporate/SaaS layout.

## Deliberate staging deviations
These are not visual regressions:
- Headline remains **Explore the Feast World for Free** until WO-002 exposes at least one qualified player route. Then it should return to the approved **Play the Feast World for Free**.
- Home shows four browser-preview records; the future Arcade slot remains withheld until WO-002 qualification/integration.
- Feast Pass remains visibly planned; live XP/Sparks/Treats/streak/quest values stay out until WO-005.
- Store links remain disabled until verified destinations exist.

## Owner-visual refinements in this branch
1. **Hero Toadal gets more visual weight on desktop** without changing character authority.
2. **Disabled search is demoted** so it no longer competes with the hero composition.
3. **Mobile hero removes the nonfunctional search field** to keep the composition closer to the approved CTA-first mockup.
4. **Contextual companion is smaller and less obstructive** so it behaves like a character helper rather than a large floating admin card.
5. No product-state, route, game, progression, or backend truth changed.

## Verification performed before commit
- `verify-home-visual-contract.mjs`: PASS 34/34
- `verify-navigation-truth.mjs`: PASS
- Pages base-path tests: PASS 8/8
- `git diff --check`: PASS

## Next visual gate
Before merging this refinement anywhere:
1. run the same Studio 1.4.2 render/export path used for the accepted WO-001 closure;
2. capture the six authoritative viewports;
3. compare side-by-side with the approved Home mockup;
4. keep only refinements that improve parity without regressing accessibility/responsiveness.

This branch does **not** invalidate or replace the accepted WO-001 closure evidence until that final visual comparison passes.
