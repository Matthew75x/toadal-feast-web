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

## Subsequent CP9 recovery

After the mobile-checkout audit above, the exact CP9/V13 website donor was recovered and independently verified on ASSIGNATOR. It contains qualified cartridge manifests for **Wicked Bites** and **CLAW: Feed Gulper**, and those manifests resolve to live source authorities in GitHub.

Therefore the phrase “no runnable packages were found” applies only to the current mobile-game checkout, not to the broader TOADAL website program.

Exact donor/source details are recorded in:
- `docs/implementation/CP9_SOURCE_AUTHORITY_VERIFICATION.md`
- `docs/implementation/WO002_DONOR_PREFLIGHT_2026-09-30.md`

Wicked Bites and CLAW remain PREVIEW in the new Studio site until **current-environment requalification**, but WO-002 should reuse/reseal those donors rather than search for or rebuild them from scratch.

## Conservative launch matrix

| Experience | Default website state now | Promotion condition |
|---|---|---|
| Wicked Bites | PREVIEW | requalify recovered CP9 v5.5 donor in current player environment |
| TOADAL Tower Defense / Feast Defense | PREVIEW | real runnable web package + QA |
| Froggy Fruity Bash | PREVIEW | real runnable web package + QA |
| CLAW: Feed Gulper | PREVIEW | requalify recovered CP9 v2.5.1 donor with service-worker isolation |
| TOADAL FEAST Arcade preview | CANDIDATE | bounded package/cartridge + website QA |
| Lily Pad Leap | PROTOTYPE / PREVIEW | locate current prototype authority + QA |
| Dry Dock | PLANNED | locate real implementation/package |

## Home implication
WO-001 can render the five-card visual composition immediately, but CTA/state must be data-driven.

Until a build is certified:
- use Preview / Coming Soon / Learn More;
- do not use a direct Play CTA that implies a runnable game.

## Next implementation task
WO-002 should begin by re-verifying the exact Wicked Bites and CLAW donor source authorities and integrating them through the current player/cartridge contract. The Arcade donor remains a separate bounded-candidate audit.
