# TOADAL FEAST website — approved visual-target contract

Date: 2026-09-30
Status: implementation target for WO-001+; no production deployment implied

Figma working target:
https://www.figma.com/design/T2CosIgfKTy32yNRqNThmS

This file translates the owner-approved homepage direction into an editable implementation reference. It does not replace the source mockup or authorize unrelated visual redesign.

## Non-negotiable visual direction

The site should feel like the TOADAL FEAST world, not a generic SaaS landing page.

Primary language:
- warm cream page surfaces
- dark chocolate navigation/footer
- pink primary CTAs
- gold highlights and chips
- rounded, soft premium cards
- lush game-world imagery
- clear TOADAL FEAST character presence
- playful display typography with readable body copy
- generous spacing and low visual clutter
- app conversion is prominent but does not consume the whole page

Avoid:
- cold corporate blue/gray shells
- generic AI gradients
- glassmorphism-heavy UI
- neon cyber styling
- dense dashboards
- random icon packs
- replacing approved game art with unrelated stock imagery
- regressions to earlier rough website versions

## Homepage hierarchy

1. slim announcement strip
2. chocolate global navigation
3. world-art hero with TOADAL FEAST conversion panel
4. compact benefit/positioning strip
5. four-mode card row: Arcade / Puzzle / Feastfall / Infinite
6. world / story feature block
7. Feast Pass progression strip
8. flagship app conversion block
9. compact footer

The page should communicate in this order:
play -> understand the world -> understand progression -> get the full app.

## Design tokens

Reference values from the working target:

- page cream: #F7F0DF
- card cream: #FFF9EB
- chocolate: #3B241C
- deep footer chocolate: #2B1914
- primary pink: #EB5E88
- gold: #F3C65B
- body brown: #6B5146
- lavender progression surface: #F0E7FA

Typography direction:
- display: rounded/playful, similar to Fredoka Bold
- body/UI: highly readable rounded sans, similar to Nunito
- do not introduce novelty fonts for ordinary UI text

Treat these as implementation reference values, not permission to duplicate arbitrary colors throughout the codebase. Centralize them as site tokens.

## Canonical game-art references

The current visual target deliberately uses real TOADAL FEAST assets rather than placeholder stock art.

Candidate source references:
- Toadal portrait:
  `assets/images/characters/toadal-arcade/portrait.png`
- hero/world:
  `assets/themes/froggy-feast/ui-v2/backgrounds/candyland-scenic-calm.webp`
- world feature:
  `assets/themes/froggy-feast/ui-v2/backgrounds/candy-forest-owner-v1.webp`
- Arcade:
  `assets/themes/froggy-feast/ui-v2/modes/arcade.webp`
- Puzzle:
  `assets/themes/froggy-feast/ui-v2/modes/puzzle.webp`
- Feastfall:
  `assets/themes/froggy-feast/ui-v2/modes/feastfall.webp`
- Infinite:
  `assets/themes/froggy-feast/ui-v2/modes/infinite-feast.webp`

Do not copy from the frozen Android release worktree into production blindly. Website asset ingestion must have its own provenance and optimization step.

## Interaction expectations

- Primary CTA hierarchy is obvious without shouting.
- Cards should feel clickable but not like a dashboard grid.
- Hover/focus treatment must be consistent and restrained.
- Keyboard focus must remain clearly visible.
- Mobile layout should preserve hierarchy rather than merely stack every desktop block at full size.
- The bottom-right contextual helper, where present in the platform build, must react to the hovered/focused object rather than displaying static generic copy.
- App/store routing and acquisition attribution remain separate from the visual layer.

## Responsive expectations

Desktop target: 1440px reference canvas.

At tablet/mobile:
- collapse global nav cleanly
- preserve hero art but keep copy readable
- one/two-column mode cards depending on width
- avoid text over detailed art without a contrast surface
- keep CTA tap targets >= 44px
- maintain meaningful art crops
- avoid horizontal overflow
- do not shrink body copy below reasonable reading size
- preserve clear spacing between site content and embedded/fullscreen game surfaces

## Implementation boundary

WO-001 should build the global shell and Home against this visual contract after the certified Studio 1.4.2 baseline.

Do not:
- deploy production from the design branch
- merge this branch as a substitute for implementation
- modify Android release source
- treat placeholder destination URLs as final store URLs

The goal is convergence on the approved mockup direction, not a new design exploration cycle.
