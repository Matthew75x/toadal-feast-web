# TOADAL Studio — Visual Editor Architecture / Borrow-vs-Build Spec

**Date:** 2026-10-03  
**Companion:** `STUDIO_GENERIC_BUILDER_CAPABILITY_AUDIT_20261003.md`

## Decision

Keep the existing Studio project/component/renderer architecture.

Add a **visual manipulation layer** on top of it.

Do not replatform the website project into a third-party editor. Borrow proven interaction primitives where useful, but persist all edits in Studio's own typed project model.

## Architectural layers

### 1. Project model

Authoritative persisted data:

- pages
- components
- props
- themes/tokens
- assets
- symbols
- patterns
- behavior presets
- animation presets
- project metadata

No DOM measurement or editor-library object becomes authoritative project data.

### 2. Renderer

Takes project data and produces the preview/static site.

The renderer remains deterministic.

### 3. Visual canvas

Shows the rendered page and resolves rendered DOM nodes back to component IDs.

Responsibilities:

- hover outline
- selected outline
- drop targets
- resize handles
- focal/crop handles
- spacing handles
- breakpoint simulation
- contextual toolbar

### 4. Inspector

Edits typed properties for the selected component.

Examples:

- Image → fit/focal/zoom/aspect/frame
- Text → content/typography
- Container → width/padding/gap/background
- Grid → columns/gap/spans
- Bubble → text/anchor/dismiss/timing
- Behavior → trigger/target/condition/action

### 5. Transaction/history layer

Every owner gesture becomes a named transaction.

Examples:

- “Resize hero image”
- “Move card”
- “Change heading typography”
- “Add click interaction”

A pointer move can update preview many times, but pointer-up should commit one Undo step.

## Borrow vs build

### GrapesJS — architecture reference, not replacement

Useful ideas:

- component model;
- component-specific traits/settings;
- Style Manager;
- canvas selection/hover/resize spots;
- component-specific toolbar actions;
- limiting which style properties a component may expose.

Recommendation:

**Borrow the interaction model, not the persistence model.**

Studio already has project/page/components/symbols/templates and a qualified renderer. Migrating the project wholesale to GrapesJS would create a second source of truth and unnecessary conversion risk.

### Moveable — strong candidate for on-canvas manipulation

Moveable provides mature primitives for:

- drag;
- resize;
- scale;
- rotate;
- group manipulation;
- custom handles/“ables.”

Good fit for:

- image frame resize;
- freeform decorative layers;
- visual selection handles;
- constrained hero mascot positioning.

Integration rule:

Moveable events update an ephemeral draft during the gesture and commit typed Studio props at gesture end.

Do not persist its raw transform string as the default data model.

### dnd-kit — strong candidate for structural drag/drop if Studio UI stack fits

Useful for:

- section ordering;
- component ordering;
- moving cards between containers;
- keyboard-accessible sortable structures;
- constrained drop targets.

Do not use free-coordinate drag/drop to represent responsive layout.

If Studio is not using a compatible UI stack, reproduce the same structural concepts or use a framework-neutral equivalent rather than forcing a framework migration.

### Tiptap / ProseMirror — optional rich-text layer

Useful when Studio needs:

- in-place rich text;
- inline links;
- headings/lists;
- contextual bubble menu;
- custom content nodes.

Do **not** migrate simple labels/buttons into a heavy rich-text document unless needed.

Suggested split:

- labels/button text/simple fields → lightweight direct text field;
- paragraphs/article content → Tiptap-backed rich text;
- project data stores structured content, not arbitrary editor DOM.

### Native CSS primitives — use them aggressively

For images:

- `object-fit`
- `object-position`
- `aspect-ratio`
- width / max-width
- overflow clipping
- border-radius

For layout:

- CSS Grid
- Flexbox
- logical spacing
- project theme variables

These already solve the browser-side rendering problem. Studio's job is to make them understandable visually.

### State-machine concepts — borrow the schema, not necessarily the dependency

Interaction rules naturally map to:

- events/triggers;
- guards/conditions;
- actions;
- state.

A small Studio behavior schema can handle ordinary website interactions without introducing a full state-machine dependency.

Use a state-machine library only if interactions grow complex enough to justify it.

## Canvas selection contract

Every editable rendered element should expose a stable component reference, for example through an editor-only attribute injected in preview:

`data-studio-component-id="component.home.hero..."`

The static public export does not need editor metadata unless intentionally retained.

On selection:

1. resolve DOM element → component ID;
2. fetch component schema;
3. show valid canvas handles;
4. show valid inspector controls;
5. keep prohibited operations hidden/disabled.

This prevents an image, text node and grid from all receiving the same meaningless controls.

## Component capability schema

Each component type should declare capabilities.

Example conceptual structure:

- `contentEditable`
- `draggable: reorder | freeform | false`
- `resizable: frame | width | freeform | false`
- `imageFocalEditable`
- `typographyEditable`
- `layoutEditable`
- `supportsBehaviors`
- `allowedChildren`
- `allowedParentTypes`
- `responsiveProperties`
- `stylableProperties`

The editor derives UI from this schema.

This is safer than hard-coding special cases throughout the canvas.

## Image manipulation contract

Separate **frame** from **image content**.

### Frame

Controls:

- width
- max width
- height
- aspect ratio
- alignment
- radius
- overflow

### Content

Controls:

- asset
- fit
- focal X
- focal Y
- zoom
- alt text

Owner gestures:

- drag inside image → focal X/Y
- mouse wheel or zoom control → zoom
- resize edge/corner → frame dimensions
- lock aspect → preserve ratio
- double-click → image asset/reframe mode
- Reset → inherited/default framing

## Responsive property storage

Recommended conceptual shape:

`base` values plus sparse `tablet` and `mobile` overrides.

Do not copy every base property into every breakpoint.

The editor must display:

- inherited value
- overridden value
- reset override button

This prevents mobile tweaks from silently forking the entire component.

## Visual style inspector

Organize by human concepts, not CSS alphabetically.

### Layout
- display/layout type
- width
- height
- alignment
- columns
- gap
- padding

### Appearance
- background
- text color
- border
- radius
- shadow
- opacity

### Typography
- style/token
- family
- size
- weight
- line height
- spacing
- alignment

### Position
Only show when relevant:
- normal flow controls;
- sticky;
- Freeform x/y/rotation.

### Responsive
- override state;
- hide at breakpoint when permitted;
- reset to inherited.

### Advanced
- whitelisted lower-level style values;
- expert CSS separately.

## Behavior schema

A reusable behavior record should contain:

- ID/name
- enabled
- trigger
- target
- zero or more conditions
- one or more actions
- repeat policy
- accessibility/reduced-motion behavior

Example conceptual rule:

`click → tag(entity.toadal) → showBubble + companionReaction`

The UI should allow previewing a behavior without publishing/exporting.

## Speech bubble runtime

A speech bubble should be a first-class component/action target.

Runtime contract:

- can anchor to target or companion;
- viewport collision handling keeps it visible;
- optional close button;
- optional auto-hide;
- replaces or queues existing bubble according to policy;
- mobile placement can differ;
- reduced-motion mode disables unnecessary entrance motion;
- non-modal by default;
- does not trap focus.

## Styling and behavior packs

Generic Studio core should provide schemas and base components.

Project packs provide content-specific presets.

Example:

### TOADAL pack
- TOADAL theme
- Toadal/Princess Lily/Gully entity tags
- companion reactions
- candy card presets
- Feast page templates
- behavior presets

### Starship Engineer pack
- space/industrial theme
- ship/crew/system entity tags
- star-map/card presets
- engineering page templates
- different interaction presets

Both use identical Studio core.

## Low-risk implementation spike

Before a broad build, implement one disposable prototype against a copied project:

### Spike A — image

- select an image in preview;
- show Moveable-like frame handles;
- drag image focal point;
- resize frame;
- switch Mobile;
- change mobile focal point;
- Undo;
- Save;
- reopen;
- static export;
- verify desktop/mobile output.

### Spike B — text

- click a paragraph;
- edit text inline;
- select phrase;
- apply bold/link from bubble menu;
- change paragraph style from inspector;
- Undo;
- export.

### Spike C — behavior

- tag two disposable elements with `entity.demo`;
- create click → bubble rule;
- set text;
- set close + timeout;
- preview both targets;
- export and verify.

If those three spikes work cleanly with the existing project/renderer/history model, proceed to the full tranche.

## Success criteria

The visual editor is successful when the owner thinks in terms of:

- “make this image smaller”
- “move the crop over”
- “make this heading bigger”
- “put this section above that one”
- “when I click this, say this”
- “make mobile look different here”

and Studio handles the translation into project data and CSS.

The owner should not need to think in terms of:

- selectors;
- `object-position`;
- flex/grid syntax;
- media queries;
- transforms;
- event listeners;
- DOM nodes;
- JSON.

That translation layer is the product.
