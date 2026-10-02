# TOADAL FEAST — Home Visual Donor Reconciliation

**Date:** 2026-10-02  
**Target branch:** `work/manifest-complete-v1-20261002`  
**Donor:** `docs/authority/donors/home-lock-visual-parity-20261001.patch`  
**Current authority:** current qualified Home + approved Home visual evidence + current TOADAL FEAST visual rules

## Conclusion

**Do not apply the preserved Home donor patch wholesale.**

The current stylesheet already contains a later manifest-controlled Home reconciliation block that adopted most of the donor's architecture:

- compact branded navigation;
- desktop two-column portal/dashboard composition;
- 4-column browser-game row;
- Feast Pass sidebar;
- compact Today strip;
- discovery block;
- App conversion with Candy Kingdom background;
- What's Next side panel;
- responsive mobile convergence.

The donor is therefore useful only as a **visual richness reference**.

## Architecture already carried forward

Both donor and current CSS use roughly the same desktop composition:

```
Hero               Hero
Games intro         Feast Pass
Games               Feast Pass
Today               Today
Interactive         Interactive
Discovery           Discovery
App                 What's Next
Companion           Companion
```

Current CSS already contains:
- `grid-template-columns:minmax(0,3.15fr) minmax(310px,.95fr)`
- 4 browser-game columns
- Feast Pass in column 2
- Candy Kingdom background for App conversion
- What's Next in column 2
- crown/nav treatment
- bounded mobile-specific layout

Do not redesign this structure during manifest closure.

## Main donor/current difference

The qualified current version is **more compressed** than the preserved donor.

Approximate desktop comparison:

| Surface | Preserved donor | Current reconciliation | Interpretation |
|---|---:|---:|---|
| Hero height | 400px | 350px | Current prioritizes density; donor gives world/character more presence. |
| Toadal width/max art | ~535px / 445px | ~490px / 390px | Donor feels more character-led. |
| Game preview image | 116px | 92px | Donor gives actual game art more visual weight. |
| Discovery cards | ~258px | ~188px | Current is compact; donor gives World/Characters/Stories more breathing room. |
| World art | ~122px | ~76px | Current materially reduces environment presence. |
| Character art | ~96px donor max | ~58px current max | Current makes character discovery less visually expressive. |
| Genie row | visible in donor | hidden in current desktop block | Current sacrifices part of cast/world personality for density. |
| App panel | ~310px | ~230px | Donor makes flagship app conversion more cinematic. |
| What's Next | roomier | ~230px fixed/compact | Current reduces future-state explanation footprint. |

## Safe visual-lane objective

Do **not** restore the donor's exact numbers automatically.

Instead, compare the final manifest candidate side-by-side with the approved Home authority and test whether a bounded increase in visual presence improves the page without harming first-viewport usefulness.

Prioritized experiments, in order:

1. **Hero presence**
   - modestly increase hero height / Toadal scale if the current Home feels cramped;
   - preserve current CTA visibility and header density.

2. **Real browser-game imagery**
   - increase card art height before increasing card text;
   - keep four games visible efficiently.

3. **Discovery visual weight**
   - allow canonical character/world art more room;
   - avoid hiding approved/canonical cast solely for compression;
   - preserve section density.

4. **App conversion**
   - give the genuine flagship app a stronger cinematic footprint;
   - retain disabled store truth and genuine gameplay evidence.

5. **What's Next**
   - keep compact, but ensure status/copy is readable and not visually subordinate to the point of feeling unfinished.

## Do not regress

Keep:
- current responsive/mobile work;
- current companion collision/drag architecture;
- current real gameplay assets;
- current public-state truth;
- current Search/Feast Pass integration;
- current accessibility/focus behavior;
- current performance gains;
- current card hit targets.

Do not:
- resurrect older Grove green/Toto styling;
- restore obsolete layout wrappers;
- reintroduce excessive empty background;
- make the Home so tall that browser games disappear from useful early viewport;
- hide canonical content simply to win a density metric;
- claim LOCK_VISUAL automatically.

## Acceptance method

The visual lane should produce a **side-by-side final candidate vs approved Home** at:
- 1440x900
- 1366x768
- 768x1024
- 390x844

Evaluate:
- TOADAL FEAST world presence
- Toadal prominence
- playable games visibility
- Feast Pass visibility
- World/Characters/Stories discoverability
- app conversion prominence
- useful-space efficiency
- lack of dead/green space
- no overlap/overflow

Only keep changes that materially improve those criteria.

The current qualified architecture is the base. The preserved patch is a donor, not a patch queue.
