# Visual Convergence Shell

Branch: `work/visual-convergence-shell-20260930`

This is an isolated, non-production implementation lane created while the current WO-003 Arcade work remains local on ASSIGNATOR.

## What this advances

- responsive global navigation and shell;
- Home;
- Play integration surface;
- World;
- Stories;
- Media;
- Feast Pass;
- News;
- Support;
- app-download conversion treatment;
- contextual bottom-right helper that changes with hover/focus;
- mobile navigation and reduced-motion handling;
- explicit asset slots rather than invented replacement character art.

## What this intentionally does NOT do

- It does not modify `main`.
- It does not deploy.
- It does not reproduce or alter WO-003 Arcade internals.
- It does not claim unfinished web games are qualified.
- It does not replace approved production artwork.
- It does not create a new competing canonical build.

## Intended use

When the local canonical branch is available again, use this branch as an implementation donor/reference for the site shell and non-Arcade page surfaces. Integrate selectively into the accepted WO-001/WO-002/WO-003 lineage.

The bottom-right helper behavior is intentionally implemented here so it can be retained during convergence rather than regressing to a static panel.
