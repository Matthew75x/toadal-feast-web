# TOADAL Studio visual-builder implementation manifest v1

Date: 2026-10-03  
Status: proposal for Astra review; non-deploying architecture/execution branch.

## Outcome

Evolve the qualified TOADAL Studio 1.4.2 owner-authoring foundation into a reusable visual website builder. Preserve the existing structured project, renderer, Save/Cancel/Undo, draft/export boundary, assets, templates, deterministic static export and backup/restore. Add a capability-driven visual control plane rather than a second persisted canvas model.

TOADAL FEAST is the first project, not the definition of Studio. A later Starship Engineer site must use the same Studio core with unrelated themes, assets, pages, reusable sections and behaviors without brand-specific core edits.

## Baseline

Current website owner-authoring branch at manifest preparation: `work/owner-native-authoring-20261002` @ `3a609af0924ed5d3043630a5a219f488c7352db1`, tree `afb774d4078ad617b7391ec2be3fc0a5a7f2d960`.

Current closure reports Studio 1.4.2 source `e06eb5f14c210fc22b9f39dd11b9b51ee6847faa`, tree `b6818ee8e0a5184e45630f6ebea871fb568a1bb2`, with the standalone Studio checkout on the recorded DEGNARATOR path and a verified local full-history bundle. The exact standalone Studio checkout is not visible on the currently connected ASSIGNATOR profile, so recovering/verifying that source is Gate G0 rather than an excuse to guess implementation details.

The current project is already `projectKind: generic-site`, with generated rendering, 33 indexed pages, asset catalogue, themes, templates/patterns, symbols, publishing, and empty behavior/animation/variable extension collections. Existing pages are a hybrid of migrated DOM-like component trees and newer semantic/native components. Therefore implementation is adapter-first; no mass project rewrite is authorized.

The current closure also records a real Studio UI image round trip using `fit=contain`, `focalX=45`, `focalY=55`, `imageHeight=180`, `aspectRatio=4/3`, `zoom=1.05`, with save/reopen and emitted `object-fit` / `object-position` agreement. The first direct-manipulation slice must map onto this proven legacy path before introducing a new image contract.

## Architecture invariants

1. Existing project data is the only canonical persisted source of truth.
2. Canvas, DOM, selection, geometry cache and rich-text sessions are disposable views.
3. All owner mutations use the same validated semantic CommandGateway.
4. No manual `dist/` editing and no DOM scraping back into project data.
5. One gesture creates one history operation; pointer movement remains an ephemeral draft.
6. Normal content stays in responsive document flow. Freeform is explicit and bounded.
7. Legacy image semantics are not silently reinterpreted.
8. Responsive layout is intrinsic first, sparse breakpoint exceptions second.
9. Every drag action has keyboard and single-pointer non-drag equivalents.
10. Save, Export, Publish and Deploy remain separate.
11. Missing/unknown pack/plugin data is preserved rather than silently deleted.
12. Project opening never silently persists a migration.
13. Declarative project packs precede executable plugin infrastructure.
14. Studio Core contains no TOADAL- or Starship-specific conditionals.

## Core control plane

Logical responsibilities, to be mapped onto existing source during G0:

- ProjectGateway — load/validate/save/snapshot/recovery/revision.
- ComponentRegistry — typed component capabilities, protection, parents/children, editable paths.
- AuthoringAddressResolver — page/node/instance/slot/part/repeat/renderEpoch identity.
- PropertyResolver — defaults, pack/theme, shared definition, instance and responsive provenance.
- CommandGateway — semantic commands, capability checks, revision checks, forward/inverse deltas.
- DraftSessionManager — one active edit/gesture session initially.
- HistoryAdapter — reuse existing history where it meets grouped transaction/savepoint requirements.
- PreviewBridge — editor identity, hit testing, geometry and safe host/iframe protocol.
- GeometryManager — targeted selected/hover/drop-zone observation, not continuous whole-DOM measurement.
- RendererAdapter — existing renderer plus editor-only hooks; public export strips all editor metadata.
- PackManager — later declarative pack/version/dependency management.

Semantic commands include `content.setText@1`, `media.setPresentation@1`, `media.replaceAsset@1`, `layout.setProperty@1`, `structure.moveNode@1`, `structure.duplicateNode@1`, `theme.setToken@1`, `symbol.detach@1` and `behavior.upsertRule@1`. Raw JSON Patch may be used internally for change sets but is not the owner/business command API.

## Compatibility tiers

- Tier 0: protected runtime wrapper — select/layout wrapper only where safe; no internal arbitrary editing.
- Tier 1: migrated content-safe node — text/alt/replaceable asset/typed link and proven content fields.
- Tier 2: migrated presentation-safe node — proven fit/focal/zoom/height/aspect/responsive presentation.
- Tier 3: native typed component — full registered visual/layout capabilities.

This prevents the visual builder from forcing a rewrite of accepted pages.

## Responsive model

Expose sizing intent first: Fit Content/Auto, Fill, Relative, Fixed, optional Viewport, plus min/max. Use Grid/Flex/wrap/minmax/auto-fit where possible. Base/Tablet/Mobile are sparse explicit exceptions, not complete copies.

The Inspector shows value provenance and `Reset override`. Absence means inherit; zero/false/empty string remain valid values. Null has meaning only where its descriptor defines one.

One policy requires Astra review before G1 freeze: resolve responsive chain inside each source layer, then source-layer precedence; this gives explicit instance ownership priority even when the instance value is inherited from Base.

## Image strategy

Phase S/A initially uses a legacy image adapter that preserves the existing flat fields and renderer semantics. Do not convert `focalX/focalY` into a source-image subject focal model merely because the name suggests one.

After golden equivalence, newly created native image components may use an explicit v2 frame/content contract with algorithm versioning. Frame geometry, bitmap presentation and semantic meaning are separate.

Manipulation library is not preselected. Native Pointer Events is the baseline comparator. Moveable and Cropper.js may be tested behind one adapter. A candidate must pass iframe/scroll/scale/pointer-cancel/history/accessibility/teardown gates; then score correctness 35%, integration 20%, accessibility/touch 15%, performance 15%, maintenance/bundle 10%, replaceability 5%.

## Reuse

Pattern = independent reusable recipe. Shared Symbol = linked definition. Definition editing is an explicit mode with impact preview. Detach = one undoable materialization to independent content.

Cross-project recipes carry dependency closure for assets, tokens, component versions, behavior/animation presets and pack requirements. Collisions are surfaced; nothing unrelated is overwritten silently.

## Interactions

Version 1 is deliberately small and declarative: WHEN trigger / ON target / IF optional conditions / DO typed actions. Central page/project rule records are authoritative; component UI references them contextually.

Initial triggers: activation, focus/explicit activation, page load, enters viewport, delay. Initial actions: show/hide/toggle, speech bubble, visual state/reaction, typed navigation, scroll, local typed state, named animation. No general expression language or arbitrary JavaScript.

The Toadal proof is authored through the UI: activate an `entity.toadal` target, show “Ooh, that’s a handsome fellow.”, optional proud reaction, visible close/Escape, configurable repeat policy and optional nonessential timeout.

## Project packs

Start with declarative packs containing brand themes, assets/tags, entities, patterns, starters, named states and behavior/animation presets. Exact installed versions/digests are locked. Executable plugins are a later higher-trust class.

## Migration/recovery

Adapter first, migration second. Opening old projects does not save a migration. A necessary migration runs on a copy, validates after every ordered transform, preserves unknown extension data where possible, renders/exports required fixtures and only then becomes eligible to replace a working copy. Rollback uses the untouched snapshot and compatible old Studio build; inverse migrations are not required.

## Gates

- G0 Source Admission — recover/verify exact Studio source; source map; build; baseline export/restore.
- G1 Platform Spine — address/capabilities/commands/drafts/history/resolver/bridge/selection; zero no-edit public drift.
- GS Architecture Falsification — complete image workflow including mobile, cancel, undo, save/reopen/export/restore, linked/protected/neutral fixture, non-drag equivalent.
- G2 Production Media Editing.
- G3 Text/Typography.
- G4 Layout/Reuse/Theme.
- G5 Interaction v1.
- G6 Packs + clean-room Starship Engineer portability proof.
- G7 Builder v1 hardening: migration, security, browser/input/accessibility/performance/export/rollback/owner acceptance.

Every gate stops on failure and preserves evidence. No gate automatically triggers staging/main merge or deployment.

## Genericity acceptance

Studio is not declared a generic builder until a new Starship Engineer project can be created with unrelated theme/assets/pages, visual image manipulation, mobile overrides, typography, pattern reuse, linked component/detach, one generic interaction, desktop/tablet/390/320 preview, Undo/Redo, export and independent backup/restore — without Studio core edits or manual JSON/CSS/dist changes.

## Execution package

The full owner handoff package is named:
`TOADAL_STUDIO_VISUAL_BUILDER_IMPLEMENTATION_MANIFEST_V1_20261003.zip`

Package SHA-256:
`c41ba075acd3f46fa0fb8d72f9cdafdb8069070f3cc2b67d9cc503d59f559d07`

It includes the master strategy, current-system/gap ledger, code proposal, Codex gate runbook, test matrix, research ledger, Astra review brief, ADR register, machine-readable implementation manifest and JSON Schemas for authoring addresses, component capabilities, command envelopes, behavior rules, packs, preview messages and the proposed image-v2 contract.

No implementation, deployment, staging promotion or canonical-project migration is authorized by this proposal branch.
