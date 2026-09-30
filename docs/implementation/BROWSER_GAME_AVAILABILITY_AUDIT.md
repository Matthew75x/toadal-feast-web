# Browser Game Availability Audit — Current Evidence
**Date:** 2026-09-30
**Scope:** inspected current authoritative game checkout plus the older website redesign donor on ASSIGNATOR.

## Findings

### Current TOADAL FEAST game checkout
Repository inspected:
`C:\ASSIGNATOR\ChatGPT\Toadal-Feast-RC276`

Tracked-source searches returned **no references** for:
- Wicked Bites
- Froggy Fruity Bash
- CLAW / Feed Gulper
- TOADAL Tower Defense / Feast Defense
- Dry Dock
- Lily Pad Leap
- generic website cartridge naming

This does **not** prove those projects do not exist elsewhere.
It does prove the current authoritative mobile-game checkout is not a valid source for claiming those browser spinoffs are already packaged/public.

### Existing TOADAL FEAST browser-capable source
The authoritative game checkout does contain:
- `arcade-modern.html`
- `arcade-standalone.html`
- Puzzle/Feastfall/Infinite standalone/browser source

That makes a limited Arcade browser preview a plausible **candidate**, but it still requires a deliberate cartridge/package audit before the website marks it `PUBLIC`.

The website must not expose the old four-mode console as the primary web product. It may reuse bounded real gameplay as a preview/cartridge only.

### Older website redesign donor
`C:\ReleaseOps\toadal-games-redesign-20260925\site\src\data\games.json`
contains **Lily Pad Leap** marked `prototype`.

That is donor evidence only, not current public-release proof.

## Conservative launch matrix

| Experience | Default website state now | Promotion condition |
|---|---|---|
| Wicked Bites | PREVIEW | real runnable web package + QA |
| TOADAL Tower Defense / Feast Defense | PREVIEW | real runnable web package + QA |
| Froggy Fruity Bash | PREVIEW | real runnable web package + QA |
| CLAW: Feed Gulper | PREVIEW | real runnable web package + QA |
| TOADAL FEAST Arcade preview | CANDIDATE | bounded package/cartridge + website QA |
| Lily Pad Leap | PROTOTYPE / PREVIEW | locate current prototype authority + QA |
| Dry Dock | PLANNED | locate real implementation/package |

## Home implication
WO-001 can render the five-card visual composition immediately, but CTA/state must be data-driven.

Until a build is certified:
- use Preview / Coming Soon / Learn More;
- do not use a direct Play CTA that implies a runnable game.

## Next implementation task
WO-002 should begin with a cartridge/source audit before writing the final game registry.
