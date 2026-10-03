# TOADAL Studio research-verified action plan v2 — 2026-10-03

Use this for the forthcoming Codex comparison. Preserve the prior independent plan as its pre-research snapshot.

## Invariants
- Project data is authoritative; DOM is editor view.
- Deterministic renderer remains.
- Normal content uses responsive flow; Freeform is explicit.
- Intrinsic responsiveness precedes sparse breakpoint overrides.
- Canvas gestures persist typed props, not arbitrary CSS.
- One coherent Studio history model.
- Every drag has keyboard and non-drag pointer alternatives.
- Core is brand-agnostic.
- Components/packs are versioned/dependency-aware.
- Missing plugin data is preserved.
- CSS/JS is an expert boundary.
- Export is not deployment.

## Phases
0. Freeze exact checkpoints; prove recovery/export; inspect Studio source; benchmark baseline.
1. Build component identity, type/version/capability schema, property drafts, unified transactions/history, sizing modes, intrinsic responsive model, sparse overrides, secure preview bridge and migration hooks.
2. Image vertical slice: frame resize, focal drag, zoom, fit/aspect, sizing mode, responsive override/reset, non-drag controls, Undo/Save/reopen/export, 1440/tablet/390/320 proof. Evaluate Moveable/Cropper/custom overlay.
3. Inline text + rich text where warranted; typography Inspector; theme inheritance; unified history proof.
4. Structural drag/drop, Grid/Flex/container controls, sizing/min/max, click/tap alternatives; explicit Freeform layer for decorative overlap.
5. Copy/Paste, Pattern, Shared Symbol, instance props/slots, Detach, dependency-aware cross-project Library/Pack import.
6. Theme/design-system editor on semantic tokens.
7. Small typed behavior v1 and speech bubbles; prove Toadal click -> “Ooh, that’s a handsome fellow.” without source edits.
8. Bounded animation presets with reduced-motion behavior.
9. Full trusted executable plugin system with compatibility/migrations/missing-plugin preservation.
10. Site Starter workflow.
11. Build Starship Engineer without Studio source edits; export/backup/restore.
12. Hardening: migrations, accessibility, 320px reflow, performance, recovery, validation.

## Stop conditions
Stop and revise architecture if early work requires DOM scraping as source of truth, normal edits via hand CSS, normal content becoming absolute-positioned, full per-breakpoint component copies, conflicting Undo systems, destructive migrations, silent unknown-plugin loss, or TOADAL-specific hacks in Studio Core.