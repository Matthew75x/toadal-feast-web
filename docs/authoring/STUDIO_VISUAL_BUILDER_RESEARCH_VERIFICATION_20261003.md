# TOADAL Studio visual-builder research verification — 2026-10-03

Status: proposed direction VALIDATED WITH AMENDMENTS. This is architecture/research guidance only; no implementation/deployment authorization.

## Strongly supported decisions

1. Preserve Studio's structured project/component model and deterministic renderer. Add a visual editing layer; do not make the rendered DOM the persistence model.
2. Add a component capability/registration schema so image, text, layout, freeform and protected runtime components expose different valid controls.
3. Use direct image manipulation as the first owner-value vertical slice, persisting semantic frame/focal/fit/zoom/aspect data rather than arbitrary CSS.
4. Keep normal responsive flow distinct from explicit Freeform composition.
5. Keep Pattern (independent copy), Shared Symbol (linked), Detach, and cross-project Pack/Library as distinct concepts.
6. Build interactions as a small typed declarative model (WHEN / ON / IF / DO); do not make arbitrary JS the normal authoring path.
7. Keep Core brand-agnostic; TOADAL and Starship Engineer specifics belong in project packs/site data/plugins.
8. Keep the Starship Engineer second-site proof as the generic-builder acceptance gate.

## Amend before implementation

### Responsive model
Do not make Desktop/Tablet/Mobile overrides the primary responsiveness mechanism. Add first-class sizing intent (Fit/Auto, Fill, Relative, Fixed, min/max), intrinsic Grid/Flex/wrap/auto-fit/minmax behavior, and optionally container-aware component rules. Breakpoints remain sparse explicit exceptions.

### Resize semantics
Define how handles interact with sizing mode before adding generic resize handles. A Fill or Fit Content layer must not silently become a fixed-pixel box after dragging.

### Drag accessibility
WCAG 2.2 Dragging Movements requires a simple single-pointer non-drag alternative; keyboard support alone is insufficient. Add Move Up/Down/To commands, numeric/preset sizing, focal sliders/nudges, Center/Reset, etc.

### Unified history
Rich-text engines such as Tiptap/ProseMirror use transaction/history systems. Studio must explicitly integrate or session-wrap that history so Canvas/Inspector/rich-text Undo remains one understandable owner experience.

### Preview bridge
Formalize DOM identity, iframe coordinate mapping, and same-origin/postMessage security. If postMessage is used, validate exact origin/source/message schema.

### Versioning/migration
Move minimal component type/version/capability/migration metadata into the substrate phase. Cross-project reuse must be dependency/version-aware. Prefer tested forward migrations with automatic pre-migration snapshots rather than relying on inverse migrations.

### Behavior v1
Start narrower: Click, Focus/activation, Page load, Enters viewport, After delay; show/hide, speech bubble, reaction, navigation, scroll, typed local state, named animation. Add Hover only with defined touch/fallback behavior.

### Qualification
Add 320 CSS-pixel reflow and focus-not-obscured checks. Instrument canvas/render/save/select performance before setting hard budgets.

## Dependency posture

Research supports evaluating, not preselecting:
- Moveable: generic drag/resize/scale/snap controls.
- Cropper.js: image-specific move/zoom/selection controls.
- dnd-kit: structural sortable operations with pointer + keyboard sensors where Studio's UI stack fits.
- Tiptap/ProseMirror: rich-text editing, provided history integration is solved.

The actual Studio 1.4.2 source must be inspected before choosing any dependency.

## Research sources

Official sources consulted include GrapesJS Traits/Style Manager/Components; Moveable; Cropper.js; dnd-kit; Tiptap and ProseMirror; current Webflow breakpoints/components/variables/libraries; current Framer sizing and positioning guidance; Builder.io custom components/state/versioning; MDN object-fit/object-position/aspect-ratio/Grid/container queries/postMessage/same-origin; W3C WCAG 2.2 Dragging Movements/Reflow/Focus Not Obscured/Target Size/Animation from Interactions; and Stately/XState guards/actions.

Full research report and the revised independent plan are in the consultation handoff package V3.

## Recommended execution order

0. Freeze/inspect/measure.
1. Generic editor contract: identity, capabilities/version, drafts/history, sizing/responsive model, secure bridge.
2. Image vertical slice.
3. Text/typography with unified history.
4. Structural layout + explicit Freeform + non-drag alternatives.
5. Reuse/libraries + dependency/version semantics.
6. Theme/design system.
7. Behavior v1 + speech bubble.
8. Animation presets.
9. Full executable plugin/pack system.
10. Site Starter.
11. Starship Engineer genericity proof.
12. Builder-v1 hardening.

Do not start broad implementation until current Studio source inspection validates the insertion points and the image vertical-slice spike validates the model.