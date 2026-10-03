# TOADAL Studio visual-builder consultation handoff — 2026-10-03

Purpose: independent architecture/UX consultation on evolving TOADAL Studio from the qualified owner-authoring foundation into a reusable generic visual website builder.

This branch intentionally inherits the two detailed proposal documents from `audit/studio-generic-builder-capability-20261003`:

- `docs/authoring/STUDIO_GENERIC_BUILDER_CAPABILITY_AUDIT_20261003.md`
- `docs/authoring/STUDIO_VISUAL_EDITOR_ARCHITECTURE_SPEC_20261003.md`

Current implementation authority remains `work/owner-native-authoring-20261002`, especially:

- `docs/authoring/OWNER_SELF_SERVICE_CLOSURE_20261003.md`
- `docs/authoring/OWNER_SELF_SERVICE_GUIDE_20261002.md`
- `docs/authoring/OWNER_SELF_SERVICE_CLOSURE_PLAN_20261002.md`
- `TOADAL_STUDIO_LIVE_STATE_20261002.md`
- `studio-project/toadal-feast-website/project.json`
- `studio-project/toadal-feast-website/collections/patterns.json`
- `studio-project/toadal-feast-website/collections/symbols.json`
- `studio-project/toadal-feast-website/collections/behavior-presets.json`
- `studio-project/toadal-feast-website/animations/index.json`
- `studio-project/toadal-feast-website/variables/core.json`
- `studio-project/toadal-feast-website/themes/theme.modern.json`

The owner goal is not a TOADAL-only editor. Studio should become a project-agnostic visual builder where a future Starship Engineer site can be created, themed, laid out, edited, made interactive, previewed, exported and restored without modifying Studio core for that brand.

The consultant is asked to challenge, not rubber-stamp, the proposed direction. Key questions include canvas/preview architecture, DOM-to-component identity, component capability schemas, direct image manipulation, responsive inheritance, structural drag versus freeform movement, shared-symbol overrides, rich text, typed interactions, project packs/plugins, versioning/migrations, accessibility, performance, and the smallest falsifiable implementation spike.

A separate owner handoff package contains a self-contained long-form proposal, reference index, consultant prompt/questions and DOCX rendering. That package is the preferred consultation input; this branch exists as source-controlled context and provenance.

No site source, Studio source, `dist`, staging, production or deployment change is authorized by this consultation branch.