# TOADAL FEAST website — Home visual-target bridge

Date: 2026-09-30
Status: design-reference bridge for WO-001; no production deployment implied

Figma working reference:
https://www.figma.com/design/T2CosIgfKTy32yNRqNThmS

This file translates the owner-approved Home look into an editable reference. It is **visual/compositional guidance only**. Product truth, route order, feature state, content, asset authority, and implementation tokens on `work/WO-001-global-shell-home` override any placeholder copy or placeholder card content inside the Figma working reference.

Read the WO-001 authority first:
- `docs/design/DESIGN_SYSTEM_SPEC.md`
- `docs/design/design-tokens.json`
- `docs/design/VISUAL_AUTHORITY_LEDGER.md`
- `docs/implementation/HOME_IMPLEMENTATION_SPEC.md`
- `docs/implementation/HOME_PRODUCT_TRUTH_GATE.md`
- `docs/implementation/HOME_CONTENT_REGISTRY.json`
- `docs/implementation/CANONICAL_ASSET_SOURCE_MANIFEST.json`
- `docs/implementation/WO001_VISUAL_ACCEPTANCE_CHECKLIST.md`

## Locked visual direction

The Home page is a LOCK_VISUAL route. It should feel like the TOADAL FEAST world, not a generic SaaS landing page.

Preserve:
- dark chocolate global navigation and footer
- warm cream/parchment page surfaces
- vivid pink primary actions
- gold/crown reward accents
- deep navy/royal headings where the implementation system calls for them
- lush food-fantasy scenery visible around UI
- canonical golden Toadal presence
- premium rounded cards/panels
- playful readable display type + highly legible UI/body type
- dense-but-organized game-like composition
- clear app conversion without turning the whole page into an app-store advertisement

Avoid:
- cold corporate blue/gray shells
- generic AI gradients
- heavy glassmorphism
- neon/cyber styling
- sparse SaaS hero + generic feature boxes
- random icon packs
- generic green-frog substitutes
- rasterizing the mockup as production UI
- regressions to earlier rough website versions

## Correct Home content hierarchy

WO-001 product/content authority controls the final section order:

1. Hero — Play the Feast World for Free
2. Immediate browser-game discovery
3. Feast Pass / progression summary using the currently approved truthful state
4. Today / current-adventure surface
5. Characters / World / Stories & Media discovery
6. App conversion
7. Truthful What's Next / future-state surface
8. Contextual Toadal companion
9. Subordinate TOADAL GAMES footer

The Figma working reference currently contains a four-card Arcade / Puzzle / Feastfall / Infinite row because those approved game images were immediately available as composition material. **That row is not product-content authority for the website Home.** WO-001 should populate the discovery area from the approved website game/content registries instead.

Likewise, placeholder Figma copy must not create account sync, rewards, dates, scores, commerce, community, or other backend behavior.

## Implementation tokens

Do not create a competing token set from the Figma file.

Use the implementation authority in `docs/design/design-tokens.json`, currently centered on:
- chocolate: `#1e100d / #2c1710 / #422416`
- cream: `#fffdf6 / #fff9e9 / #fff0cf`
- navy: `#10165b / #292d7e`
- pink: `#d90055 / #f50961 / #ff267a`
- gold: `#a86606 / #de8d09 / #ffb823 / #ffd45b`

The Figma file is useful for spacing, composition, art/copy balance, CTA hierarchy, rounded surface treatment, and general visual weight. Exact color implementation should converge on the repository design system.

## Canonical asset authority

Use only assets accepted by the WO-001 canonical asset audit.

The verified manifest includes canonical Toadal, Princess Lily, Gulper, Gully and Genie sources. The asset audit has been independently executed against the frozen game source and currently passes all 10 required assets.

Do not use retired Princess Lily assets.

Do not treat `C:\AMD\EASY BRANDING.png` as website wordmark authority; it remains app/icon source authority only.

The Figma file also uses real TOADAL FEAST environment/mode art as **visual reference material**. Those environment/mode images are not automatically promoted into the final website bundle merely because they appear in Figma. Website ingestion needs explicit provenance, optimization, and WO-001 product relevance.

## Interaction quality

Required feel:
- obvious primary/secondary CTA hierarchy without shouting
- consistent hover/focus language
- visible keyboard focus
- cards that feel interactive without becoming dashboard widgets
- meaningful environmental art crops
- contextual Toadal that never blocks controls/content
- bottom-right/context helper behavior, when present, responds to the hovered/focused object rather than static generic copy
- acquisition routing remains separate from presentation logic

## Responsive quality

Required evidence already defined by WO-001:
- 390x844
- 430x932
- 768x1024
- 1366x768
- 1600x900
- 1920x1080

At smaller widths:
- collapse navigation intentionally
- preserve hero identity and readable contrast
- avoid text directly over detailed art without a contrast surface
- keep touch targets at least 44px
- avoid horizontal overflow
- retain meaningful hierarchy rather than stacking desktop sections mechanically
- keep game/player surfaces and safe areas distinct from ordinary site chrome

## Figma status

The current desktop Home target has been assembled with:
- cream/chocolate/pink/gold visual language
- canonical Toadal portrait
- real TOADAL FEAST world art
- real game art as composition placeholders
- world/story feature treatment
- Feast Pass treatment
- app conversion block
- compact footer

It is an implementation/reference canvas, not a replacement for the owner's original approved mockup.

## Branch/deployment boundary

This design branch:
- does not change production site source
- does not touch tracked `dist/`
- does not deploy GitHub Pages or Netlify
- does not modify Android release source
- must not be merged as a substitute for WO-001 implementation

Goal: make WO-001 converge on the approved visual identity while preserving current product truth and implementation authority.
