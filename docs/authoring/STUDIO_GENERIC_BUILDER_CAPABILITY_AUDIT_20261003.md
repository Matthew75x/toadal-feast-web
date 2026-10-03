# TOADAL Studio — Generic Visual Website Builder Capability Audit

**Date:** 2026-10-03  
**Branch:** `audit/studio-generic-builder-capability-20261003`  
**Purpose:** define the missing capabilities required for TOADAL Studio to become a reusable owner-operated visual website builder, not merely a TOADAL FEAST-specific editor.

## Product goal

TOADAL Studio should let a non-coding owner create, duplicate, rearrange, restyle and publish ordinary websites visually.

TOADAL FEAST is the first serious project, not a hard-coded product boundary. A later project such as Starship Engineer should be able to use the same Studio engine with a different theme, assets, templates, content and interaction pack.

The editor should make ordinary changes through direct manipulation and understandable controls. Routine edits must not require hand-written CSS, JSON or source code.

## Current foundation already present

The current owner-native branch proves a useful base rather than a blank rewrite:

- project kind is already `generic-site`;
- pages can be created from Blank, Template and Existing page sources;
- whole projects can be duplicated/backed up/restored;
- page sections can be added, duplicated, reordered, hidden, deleted and undone;
- image replacement and framing controls have already been piloted, including fit, focal position, aspect/height/zoom and independent mobile settings;
- visible text/copy, alt text and links can be edited and persisted;
- Draft/Published state and explicit navigation addition exist;
- Save/Cancel and dirty-edit protection exist across the proven owner workflow;
- project themes already use named tokens;
- reusable symbols and page templates already exist;
- static export is deterministic and separate from deployment.

This means the correct direction is **extend the existing component/project model**, not replace Studio with another website builder.

## The missing layer

The main missing capability is a true **direct-manipulation canvas**.

Today, Studio can edit the data behind many visual properties. The desired experience is to manipulate the rendered result directly and have Studio translate the gesture into safe structured properties.

The mental model should be:

> Select it → drag it, resize it, edit it, style it, preview it → Studio stores safe component properties → renderer produces the CSS.

Not:

> Select it → type raw CSS until it looks right.

## Capability matrix

| Capability | Current state | Target |
| --- | --- | --- |
| Create/duplicate pages | Strong foundation | Preserve and generalize |
| Project duplication | Proven | Turn into reusable starter-site flow |
| Section reorder/add/remove | Proven | Add true canvas drag/drop affordances |
| Image replacement | Proven | Add direct on-canvas crop/resize/position controls |
| Image responsive overrides | Proven property model | Make breakpoint state visible and easy to edit |
| Text editing | Proven basic content edits | Add in-place rich text editing |
| Typography | Theme tokens exist | Add visual typography inspector + per-component overrides |
| Layout | Structured components exist | Add visual flex/grid/container controls |
| Direct move/resize | Missing as primary UX | Add selection handles + constrained manipulation |
| Interaction rules | Project collection exists but empty | Add generic trigger/condition/action editor |
| Animations | Collection exists but empty | Add reusable animation presets and timing controls |
| Variables | Collection exists but empty | Add reusable project/site variables only where useful |
| Reusable site starters | Templates/symbols exist | Add full Site Starter / Theme Pack / Component Pack flows |
| Raw CSS | Possible through source | Keep as expert escape hatch, not normal workflow |
| Owner-safe Undo/history | Present in bounded workflows | Extend to all canvas and interaction mutations |

## 1. Direct image manipulation

### Desired owner experience

When an image is selected, Studio should show a visible bounding frame and a small contextual toolbar.

The owner should be able to:

- drag the image **inside its frame** to change crop/focal position;
- drag corner/edge handles to resize the frame;
- hold a modifier or use a lock button to preserve aspect ratio;
- choose Cover / Contain / Original;
- zoom the image inside the frame;
- center/reset framing;
- set a common aspect ratio such as Auto, 1:1, 4:3, 3:2, 16:9 or custom;
- adjust border radius;
- align the frame left/center/right;
- set max width or full width;
- switch Desktop / Tablet / Mobile and intentionally override only the properties that need to differ.

### Important implementation rule

A drag must **not** normally write arbitrary `left/top/transform` CSS.

For images in normal document flow, dragging inside the frame should update structured fields such as:

- `fit`
- `focalX`
- `focalY`
- `zoom`
- `frameWidth`
- `frameHeight`
- `aspectRatio`
- `alignment`
- breakpoint overrides

The renderer then maps those fields to stable CSS such as `object-fit`, `object-position`, `aspect-ratio`, width/max-width and controlled transforms.

This is the difference between a reliable website builder and a canvas that looks good at one screen size but breaks everywhere else.

### Optional Freeform mode

Absolute positioning should exist only in an explicit **Freeform Layer** or decorative canvas mode.

Use cases:

- hero mascots;
- stickers;
- decorative stars/sparkles;
- poster-like compositions;
- intentionally overlapping art.

Freeform components may store x/y/width/height/rotation per breakpoint, but ordinary content should stay in responsive flow.

## 2. Selection and resize handles

A selected visual component should get an overlay rather than requiring the user to find its settings in a side panel.

Recommended overlay controls:

- blue/neutral outline around selected component;
- drag handle;
- resize handles;
- component name;
- quick Duplicate;
- quick Hide;
- quick Delete;
- parent/select-up control;
- optional "Edit content" action.

Existing page/component identity should remain the source of truth; the overlay is only a manipulation surface.

## 3. Visual layout editing

Dragging a normal section/card should mean **reorder or reflow**, not arbitrary pixel positioning.

Studio should expose understandable layout controls:

### Container
- content width / max width;
- padding;
- gap;
- horizontal alignment;
- vertical alignment;
- background;
- border/radius;
- overflow.

### Row / Flex
- direction;
- wrap;
- gap;
- justify;
- align;
- child width presets.

### Grid
- column count;
- minimum card width;
- gap;
- span;
- auto-fit / fixed columns;
- breakpoint column overrides.

### Spacing
Use visual handles/sliders for:
- padding;
- margin where safe;
- section gap.

Prefer named spacing tokens plus an explicit custom value when needed.

## 4. Typography editing

There should be two layers of text editing.

### Content layer

Click text and type directly.

Selecting text should expose a small contextual toolbar for:

- bold;
- italic;
- underline when allowed;
- link;
- heading/paragraph style;
- list;
- clear formatting.

### Design layer

Selecting the text component itself should expose:

- font family/token;
- size;
- weight;
- line height;
- letter spacing;
- color/token;
- alignment;
- max text width;
- transform/case where appropriate.

The default should prefer project theme tokens. A local override should be visibly marked as an override so the owner knows when a component no longer follows the global theme.

## 5. Reusable interaction / behavior builder

The current project has a behavior-presets collection but no items. This should become a generic visual interaction system.

The editor should read like:

**WHEN** [trigger]  
**ON** [target]  
**IF** [optional conditions]  
**DO** [one or more actions]

### Triggers

Initial safe set:

- Click
- Hover / pointer enter
- Focus
- Page load
- Enters viewport
- Leaves viewport
- After delay
- Custom component event

Avoid exposing scroll-math or arbitrary JavaScript in the normal UI.

### Targets

Targets should be semantic, not brittle CSS selectors.

Examples:

- This component
- Component by ID
- Any component with tag
- Character/entity tag
- Current companion
- Page
- Section
- Shared symbol instance

### Conditions

Initial set:

- page/route;
- breakpoint/device class;
- local state value;
- first time / once per session;
- feature availability;
- component data tag;
- reduced-motion preference.

### Actions

Initial set:

- show/hide/toggle component;
- show speech bubble;
- change companion reaction;
- navigate/open link;
- scroll to section;
- swap image/state;
- add/remove a visual state class;
- play animation preset;
- set local state value;
- dismiss message;
- emit a named event.

This should be declarative and JSON-serializable. Custom JavaScript belongs in an expert/plugin boundary.

## 6. Toadal "handsome fellow" example

The requested behavior should be achievable without code.

A TOADAL project pack could define a semantic tag such as:

`entity.toadal`

Any image/card/profile/companion representation of Toadal can carry that tag.

Then the owner creates:

**WHEN:** Click  
**ON:** Any element tagged `entity.toadal`  
**DO:** Show companion speech bubble  
**TEXT:** “Ooh, that’s a handsome fellow.”  
**REACTION:** pleased / proud  
**CLOSE:** X button enabled  
**AUTO-HIDE:** 5 seconds  
**REPEAT:** every click, or once per page/session

The core Studio feature remains generic. “Toadal,” his line and his reaction assets belong to the TOADAL project pack, not Studio itself.

## 7. Speech-bubble component

Speech bubbles should become reusable components, not one-off CSS.

Properties:

- speaker/entity;
- text;
- anchor: companion / selected target / viewport corner / component;
- placement preference;
- max width;
- style preset;
- close button on/off;
- auto-hide duration;
- entrance animation;
- exit animation;
- persistence: every trigger / once per page / once per session;
- mobile placement override;
- reduced-motion fallback.

The runtime should keep them non-modal unless an actual modal is intended. A dismissible close button must be keyboard reachable, and dynamic text should use appropriate polite announcement semantics without stealing focus.

## 8. Animation presets

Do not start with a full motion-graphics editor.

Start with named safe presets:

- Fade
- Slide up/down/left/right
- Pop
- Bounce
- Wiggle
- Pulse
- Float
- Character reaction
- None

Editable fields:

- duration;
- delay;
- easing preset;
- repeat count;
- trigger;
- reduced-motion fallback.

This covers most owner needs without exposing fragile keyframe code.

## 9. Theme and global styling

The project already has theme tokens. Expand this into a proper Theme editor.

The owner should be able to edit:

- brand colors;
- page background;
- surface/card colors;
- accent;
- body font;
- display font;
- heading weights;
- base size;
- corner-radius scale;
- shadow presets;
- spacing scale;
- button presets.

Changes should preview live and apply globally.

Add **Save as Theme** / **Duplicate Theme** so TOADAL FEAST, Starship Engineer and future sites can start from independent design systems.

## 10. Generic starter-site system

The current page-template system should grow into three reusable levels:

### Site Starter
Examples:
- Blank Website
- Product / Game Website
- Portfolio
- Story / Media Website
- Documentation / Information Site

A TOADAL FEAST starter can live as a project-specific pack.

### Page Template
Already present. Continue supporting:
- landing;
- about;
- contact;
- article;
- media;
- custom saved page.

### Section / Pattern
Save any selected section as a reusable pattern.

The owner should be able to choose:

**Save section as reusable pattern**

and later insert it into the same or another project.

## 11. Shared component packs and project packs

Studio core should know nothing about frogs or starships.

A project pack can provide:

- theme(s);
- component presets;
- symbols;
- behavior presets;
- animation presets;
- asset tags;
- page templates;
- starter pages;
- optional project-specific inspector controls.

This is the architectural feature that makes the same Studio useful for TOADAL FEAST and Starship Engineer without bloating the generic core.

## 12. CSS policy

### Normal mode

Do not ask the owner to write CSS.

Routine controls update typed props or design tokens.

### Advanced style mode

Expose a curated CSS-style inspector for safe properties such as:

- width/max-width/min-width;
- height;
- padding/gap;
- color/background;
- border/radius;
- typography;
- alignment;
- display/grid/flex properties where compatible.

### Expert mode

Raw CSS can exist behind an explicit advanced warning.

Requirements:

- scoped to a component/page/project;
- syntax validated;
- previewable before save;
- reversible;
- clearly labeled as expert customization;
- never generated as the default result of drag/resize gestures.

## 13. Breakpoint model

Use a small predictable breakpoint model rather than arbitrary one-off media queries in every component.

Recommended initial editing contexts:

- Desktop / Base
- Tablet
- Mobile

Property resolution:

1. Mobile override, if defined
2. Tablet override, if defined
3. Base value
4. Theme/default

The UI should make inherited values visibly different from overridden values and provide **Reset to inherited**.

This is critical for intuitive editing.

## 14. Undo, Save and safety model

Every canvas operation should be a transaction:

- drag/reorder;
- resize;
- crop/focal change;
- typography change;
- visibility change;
- interaction change;
- delete;
- duplicate.

During pointer movement, Studio can preview continuously, but it should record one coherent Undo step when the gesture ends.

Keep explicit Save/Cancel for meaningful forms and property drafts. Canvas gestures may update the local draft immediately but must stay undoable and should not silently deploy.

## 15. Suggested implementation order

### Phase A — Visual media editing

1. canvas selection overlay;
2. image direct manipulation;
3. breakpoint switcher + override indicator;
4. safe resize/crop/focal persistence;
5. Undo transaction per gesture.

This produces the most obvious owner value quickly.

### Phase B — Visual text and styling

1. in-place text editing;
2. contextual text toolbar;
3. typography inspector;
4. theme editor improvements;
5. live token preview.

### Phase C — Layout composition

1. drag-to-reorder sections/components;
2. grid/flex/container inspector;
3. spacing handles;
4. insert/drop targets;
5. save section as pattern.

### Phase D — Interactions

1. behavior schema;
2. trigger/target/action UI;
3. speech bubble component;
4. companion reaction action;
5. visibility/navigation/state actions;
6. interaction preview mode.

### Phase E — Reusable builder

1. Site Starter workflow;
2. project/theme/component packs;
3. shared patterns/assets;
4. clean project creation wizard;
5. portability/backup qualification across two genuinely different sites.

## 16. What not to do

- Do not replace the current Studio wholesale with GrapesJS or another builder.
- Do not store normal drag operations as arbitrary inline CSS.
- Do not make every element absolutely positioned.
- Do not hard-code TOADAL-specific behavior into Studio core.
- Do not expose arbitrary JavaScript as the normal interaction system.
- Do not make mobile fixes by mutating desktop values invisibly.
- Do not add dozens of animation controls before basic manipulation is excellent.
- Do not claim a generic builder until a second non-TOADAL project is created and edited through it.

## 17. Acceptance test for “generic website builder”

TOADAL Studio should not be called a reusable generic builder until this can be done without editing source code:

1. Create a new project named Starship Engineer from a blank/product starter.
2. Define a new theme and upload brand assets.
3. Create Home, About and Media pages.
4. Duplicate a page and change its route/title.
5. Insert sections and reorder them visually.
6. Upload an image, resize its frame, drag its crop/focal point and set a mobile override.
7. Edit heading/body text directly and alter typography visually.
8. Save one section as a reusable pattern and insert it elsewhere.
9. Create a click-triggered speech bubble or simple interaction.
10. Preview desktop/tablet/mobile.
11. Undo several edits safely.
12. Export the static site.
13. Back up the project and restore it independently.

If that passes, Studio is no longer merely a TOADAL FEAST editor.

## Research conclusion

The desired experience is realistic and does not require inventing a new graphics engine.

Useful established patterns include:

- component + style-property inspectors, selection overlays and resize spots;
- direct drag/resize libraries for manipulation handles;
- structured drag/drop for layout ordering;
- headless rich-text editing with contextual bubble menus;
- native CSS image fitting/positioning/aspect-ratio primitives;
- declarative event/guard/action models for interactions.

The correct engineering work is primarily **mapping those mature interaction patterns onto Studio's existing typed project model**.

That is substantially safer than replacing the current architecture or letting direct manipulation emit arbitrary CSS.
