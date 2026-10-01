# Owner Preview Reconciliation — 2026-10-01

## Result

**SOURCE RECONCILIATION PASS — authoritative Studio re-render still required before this combined candidate replaces staging.**

Codex closed the visual owner-preview candidate at:

- `96313ac7bb662c6a8660fcdd8a5a92969ae0020f`
- tree `0f4d2300c0eab1977861f6b44ed12e9ca6b3bfba`

GitHub verification confirmed both:

- `integration/stories-search-convergence-20261001`
- `staging/live-visual`

point to that exact SHA, while `main` remains:

- `87050885331770ca3e30db7e463154aebd777512`

The GitHub Pages workflow for `96313ac...` completed successfully.

## Why reconciliation was necessary

The visual candidate and the assistant's parallel closure chain both branched from:

`ce5aceb251ac6b612fcace7baa6ea63032ca93a7`

They therefore diverged instead of containing one another.

Parallel closure head:

`588c27825de807da5d36cabf5c2fd76dad640aea`

That chain contains the completed:

1. non-Home truth closure;
2. owner-preview qualification gate;
3. visual-asset authority lock;
4. non-Home layout blocker closure.

GitHub compare showed the two branches overlap in only one modified file:

`studio-project/toadal-feast-website/reference/assets/css/site.css`

All other parallel closure files were additive or touched different source files.

## CSS reconciliation

The single merge conflict was resolved by preserving Codex's final visual values while retaining the route scoping required by the layout closure.

Specifically, Home's dense `#browser-games` styling remains visually unchanged on Home, but is scoped through:

`body:has(.home-hero) #browser-games ...`

so those Home-only rules cannot leak into the dedicated Play page.

The new visual pass also introduced two additional unscoped `#browser-games .studio-game-card...` rules later in the stylesheet. The non-Home layout verifier caught those immediately during reconciliation. They were also scoped to Home rather than weakening the verifier.

This is the intended use of the new permanent gate: new visual work can improve Home without silently regressing Play.

## Source qualification

Fresh on the reconciled source:

- required Node suite: **48/48 PASS**
- Home visual contract: **PASS**
- navigation truth: **PASS**
- character registry: **PASS**
- gated ecosystem: **PASS**
- manifest compliance: **PASS**
- Search/Discovery: **PASS**
- non-Home truth: **PASS**
- visual asset authority: **PASS**
- non-Home layout closure: **PASS**
- cartridge storage isolation: **PASS**
- `git diff --check`: **PASS**

## Browser matrix

For layout validation only, the reconciled source CSS was temporarily projected over the fully rendered `96313ac...` dist, the browser matrix was run, and generated dist was restored.

Result:

- **77 / 77 PASS**
- 30 routes
- desktop/mobile plus required tablet/small-mobile cases
- no clipped controls
- no severe companion/control overlaps
- no browser matrix issues

Evidence:

`docs/review/owner-preview-reconcile-20261001/browser-matrix-projected-css.json`

This is projection evidence, not a substitute for an authoritative Studio export.

## Owner-preview gate

With browser execution skipped against the currently checked-in render:

- **14 PASS**
- **1 FAIL**

The only failure is:

`render-freshness`

That is expected because the combined source now includes the parallel truth/layout/gate changes but `dist/` still represents the already-deployed `96313ac...` Studio render.

No other source/static gate failed.

## Required final handoff

The next Codex action should be bounded:

1. start from this reconciliation branch;
2. run the authoritative Studio 1.4.2 render/export;
3. do not redesign Home again unless a regression is exposed;
4. run the complete owner-preview gate including the 77-case browser matrix;
5. require all source, render-freshness, static, and browser gates to pass;
6. freeze the resulting SHA;
7. then update `staging/live-visual` to that exact SHA for owner review;
8. leave `main` and production untouched.

Current staging remains a valid visual-review build of `96313ac...`, but it is not yet the combined candidate containing the parallel closure chain.

No staging or production deployment was performed by this reconciliation lane.
