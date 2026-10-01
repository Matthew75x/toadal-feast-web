# Owner-preview reconciliation evidence

Run date: 2026-10-01

Result: **PASS for the requested owner-preview staging qualification; this is not owner acceptance or `LOCK_VISUAL`.**

## Frozen input and toolchain

- Authoritative input branch: `integration/owner-preview-reconcile-20261001`
- Starting commit: `3f08acf72ad4783f4c50061e7d4fc4fa5fc0a807`
- Starting tree: `03af0bc9e8408d16d457b6e7faf145c634d3c72f`
- Starting worktree: clean; the source revision is the exact reconciliation SHA supplied for this task.
- Node: `v22.23.2`
- npm: `10.9.8`
- Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`
- Studio npm package: `toadal-studio@1.4.2` (package manifest and lockfile agree).
- Project plugins: none enabled (`project.json` has `"plugins": []`).
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-preview-20261001\studio-project\toadal-feast-website\project.json`

## Authoritative Studio workflow

| Operation | Result / evidence |
|---|---|
| `npm run validate` | PASS; valid, 0 errors, 0 warnings. |
| `toadal.inspect(scope="workspace")` | PASS; 30 pages, 4 games, 41 assets, 40 components. Reference graph: 128 nodes, 86 edges, 4 analyzer warnings, individually resolved below. |
| `toadal.render` | PASS; 113 files, 40,293,421 bytes, written to the project AI preview directory. |
| Canonical `npm run render` | PASS; Studio renderer wrote the tracked deploy artifact `dist/` (113 files). No generated `dist/` file was manually patched. |
| Pages transform | PASS; official `scripts/wo001-pages-basepath.mjs dist /toadal-feast-web/ --staging-robots` scanned 32 files, rewrote 31 files / 892 URLs, and applied staging robots metadata. |
| `toadal.export(kind="static")` | PASS; archive `build/exports/toadal-feast-website-static-site.zip`, 38,176,353 bytes, SHA-256 `be378e9199dff4baab797d7792bb3dd9f6823324dede4cd4a6610e17646c42ae`. |
| `toadal.checkpoint(mode="verify")` | PASS (`ok=true`, validation passed). Studio handoff: `AI/HANDOFFS/2026-10-01T21-46-58-333Z-owner-preview-reconcile-20261001.md` and `.json` in the Studio installation. |
| Static export artifacts | PASS; both `dist/index.html` and `dist/404.html` exist, are generated, and are covered by the passing base-path/static-link/robots checks. |

The MCP response was valid for each typed bridge operation. Studio project build/preview and history state remain outside the repository’s tracked source; no Studio source was edited.

## Studio dangling graph references

The four reported references are not four missing games. Studio’s graph analyzer treats the shared component type token `game.card` as though it were a game entity ID (`uses-game`). In each Home card the actual `gameId` resolves to an existing record in `studio-project/toadal-feast-website/games/index.json`:

| Home card component | Actual `gameId` | Resolution |
|---|---|---|
| `component.home.game.wicked-bites` | `game.wicked-bites` | Present in the game index; reference is valid. |
| `component.home.game.toadal-tower-defense` | `game.toadal-tower-defense` | Present in the game index; reference is valid. |
| `component.home.game.froggy-fruity-bash` | `game.froggy-fruity-bash` | Present in the game index; reference is valid. |
| `component.home.game.claw-feed-gulper` | `game.claw-feed-gulper` | Present in the game index; reference is valid. |

Classification: four benign analyzer false positives caused by using a component type as the graph target; no broken page/game target was found, so no source or Studio patch was made.

## Owner-preview release gate

Command: `python scripts/owner-preview-gate.py --repo . --base-path /toadal-feast-web/`

Result: **PASS, 16/16 gates; 0 failed.**

| Gate | Result |
|---|---|
| Integrated required Node suite | PASS, 48/48 |
| Home visual contract | PASS |
| Navigation truth | PASS |
| Character registry | PASS |
| Gated ecosystem | PASS |
| Manifest | PASS |
| Search / Discovery | PASS |
| Non-Home truth | PASS |
| Visual-asset authority | PASS |
| Non-Home layout closure | PASS |
| Cartridge storage isolation | PASS |
| Render freshness | PASS |
| GitHub Pages base path | PASS |
| Static links | PASS |
| Staging robots | PASS |
| Browser matrix | PASS, 77/77 across 30 routes; 0 failures / issue counts |

Machine- and human-readable gate records are `owner-preview-gate.json`, `OWNER_PREVIEW_GATE.md`, and `browser-matrix.json` in this directory.

## Supplemental Studio package suite

Result: **78 passed / 3 failed / 0 skipped**. Website release gates above remain fully green; these are missing host tool prerequisites in the supplemental Studio package suite, not failures of the site render or browser release gate.

- Test 75 (Tier 2 press-pack): failed because the `zip` CLI is absent (`ZIP_FAILED: null`).
- Test 77 (Tier 3 optimized media): failed because ImageMagick / `magick` is absent.
- Test 78 (Tier 3 Studio HTTP optimize): failed because the same ImageMagick prerequisite is absent (null result instead of exit code 0).
- Tier 4 tests 79–81 passed.

No tests or assertions were changed, skipped, or weakened. System-wide installation of these optional tools was not justified for this bounded staging qualification.

## Fresh screenshots and visual comparison

All captures are fresh screenshots from the authoritative Studio-rendered `dist/`, served locally after the official Pages-base-path transform. The capture manifest records route, viewport, title, and image byte size.

- Home desktop, 1440×900: `reconciled-visual/reconciled-home-1440x900.png`
- Home mobile, 390×844: `reconciled-visual/reconciled-home-390x844.png`
- Home mobile, 430×932: `reconciled-visual/reconciled-home-430x932.png`
- Play mobile, 320×800: `reconciled-visual/reconciled-play-320x800.png`
- Toadal mobile, 390×844: `reconciled-visual/reconciled-toadal-390x844.png`
- Search desktop, 1440×900: `reconciled-visual/reconciled-search-1440x900.png`
- Search mobile, 390×844: `reconciled-visual/reconciled-search-390x844.png`
- Contact mobile, 390×844: `reconciled-visual/reconciled-contact-390x844.png`
- Capture metadata: `reconciled-visual/capture-manifest.json`
- Three-way Home comparison: `reconciled-visual/home-comparison.html`

The reconciled Home is materially consistent with the `96313ac7bb662c6a8660fcdd8a5a92969ae0020f` owner-review candidate; the authoritative rerender introduces no material visual regression. The approved authority remains substantially richer and denser than both owner-preview captures. That existing parity gap is explicitly left for owner judgment; this task does not claim acceptance or `LOCK_VISUAL`.

Independent screenshot review also found no obvious viewport regressions on the other seven captures. Home character art approaches/overlaps the lower-right hero copy/action region on 390px mobile, but the copy and buttons remain readable in the captured viewport.

## Scope and deployment boundary

- The only intended tracked product artifact changes are generated `dist/` output from the authoritative Studio render and official staging-base-path transform.
- Gate reports and fresh screenshots are qualification evidence.
- `studio-project/.../pages/home.json` and `pages/support.json` have no content diff: their path-normalized working hashes equal the starting commit’s blobs. They are excluded from the intended change set.
- `main` and `toadalfeast.com` production are outside scope and remain untouched.
- This evidence is for the `staging/live-visual` Pages build only. The exact qualified commit/tree and successful SHA-matched GitHub Pages run must be confirmed after the final commit and staging branch update.
