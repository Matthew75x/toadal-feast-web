# Floating Toadal Companion — WO Evidence

Date: 2026-10-01 (local)

Branch: `integration/owner-preview-reconcile-20261001`

Starting commit/tree: `f649dba4346867965651a8507f495ee4d33d8133` / `11e1e7078a85dbe56de0a1ce98329468974c93e6`

Scope: floating companion behavior only; no push, deployment, production change, or `main` change.

## Root cause and historical reference

The old companion was not a persistent free-positioned viewport utility: a responsive rule changed `.toadal-companion` to `position: static` at tablet widths, the Home-specific wrapper also had a later static-position override, and the companion markup was absent from 11 of 30 registered routes. The previous “automatic corner” correction forced a fixed corner but did not implement user-owned position state or drag interaction.

Historical commit `9195f77` is architectural evidence, not copied wholesale: its `.tf-companion` used a fixed overlay, a roughly 174px shell, roughly 142px artwork, a separate speech bubble, and a minimize control. The Wicked Bites canvas uses `pointerdown`/`pointermove`/`pointerup`/`pointercancel` and `setPointerCapture`; the Stories viewer uses pointer capture and clears the gesture on cancellation. The implementation follows these native patterns without adding a dependency.

## Implementation contract

- `reference/assets/js/companion-position.js` reparents the existing/fallback companion root directly under `document.body`, then keeps one fixed overlay independent of document flow and route CSS scopes.
- First use is one universal lower-right preset: 12px from the right, and 180px above the bottom-edge position. It is identical on every route, remains in the lower half of tested viewports, and is not chosen from nearby controls or route identity. Users can immediately drag it anywhere. The clearance was selected to keep the initial Home hero CTA and the Quests “Claim quest reward” action unobscured; it is not collision avoidance.
- Position uses a dedicated `toadal:site:companion:position:v1` local-storage key containing `{version:1,x,y}`. Existing minimize preference remains separate as `toadal:site:companion:minimized:v1`. Reactions/artwork/copy do not write x/y.
- Placement is applied as fixed `left`/`top` coordinates, clamped to `visualViewport` dimensions and CSS safe-area insets. Resize/orientation changes clamp the saved position instead of resetting it.
- Pointer input uses primary-button `pointerdown`, `setPointerCapture`, `pointermove`, `pointerup`, `pointercancel`, and `lostpointercapture`; an 8px movement threshold separates click/tap from drag. Cancellation restores the drag origin. Touch on the companion does not bubble into contextual tap behavior. Arrow keys (Shift for a larger step) provide keyboard movement.
- The speech panel is positioned separately. It chooses above/below and left/right from available space, then clamps its own dimensions/coordinates; opening it never moves the companion.
- CSS sizes the artwork at 142px desktop, 102px at 361–760px, and 92px at 360px and narrower (the 320px test footprint is 92×96px). Reactions scale the image modestly. Reduced-motion media rules suppress that transition/animation.
- Shared fallback markup covers routes whose original page templates did not include the companion, including `/404.html`, game routes, player, Feast Pass, Quests, Rewards, and Profile.

## Verification

TOADAL Studio 1.4.2 was scoped to the exact `TOADAL_PROJECT` manifest for this branch, using Node v22.23.2 / npm 10.9.8. `toadal.inspect(scope="workspace")` reported 30 pages, 4 games, 41 assets, 40 components, valid project state, zero validation errors/warnings, and 4 dangling graph edges. All four are analyzer false positives: each edge points from the Home games layout to the shared `game.card` component type, while each of the four nested card components has a distinct `gameId` registered in `games/index.json`. No graph or game source was changed. The final `toadal.render`, `toadal.export(kind="static")`, and `toadal.checkpoint(mode="verify")` completed successfully. The static ZIP is 38,193,099 bytes; all 114 files in the transformed Pages export and tracked `dist/` match by SHA-256. The Pages transform scanned 32 files, rewrote 31 HTML files / 892 URLs, and applied staging robots policy.

The owner-preview gate is **PASS, 16/16 gates**. The required integrated Node suite is **48/48**. The complete browser matrix is **77/77 across all 30 registered routes/viewports**; it asserts exactly one companion after initialization on every route. Initial Home hero actions and the Quests “Claim quest reward” control have no measured overlap. Horizontal overflow, bounds, runtime/network/asset/accessibility checks also passed. Generic control overlaps remain visible as diagnostics, not blanket blockers: three route/viewport combinations have ten repeated scroll samples—Home tablet / “Public games 0”; Toadal desktop / “Personality” and “History”; Toadal mobile / “History”. These are secondary filters/section anchors; placement remains user-controlled.

Focused companion browser automation: **PASS**. It exercises mouse and real touch drags, default and four manual positions at 1440×900, 430×932, 390×844, and 320×800; tap-versus-drag; no overflow; cancel/lost-capture rollback; minimize → reload → restore at a saved position; position persistence through reload/navigation/scroll; World hover/touch reaction with unchanged x/y; bubble flips/clamps; resize/orientation; reduced motion; and the 404/player/Feast Pass/Quests/Rewards/Profile route subset. The full owner-preview matrix independently covers all 30 routes.

`npm run ai:doctor` passed. The Studio `toadal.qa(level="full")` wrapper could not launch `npm.cmd` (`spawnSync npm.cmd EINVAL`), so the package suite was run directly with `CHROMIUM_BIN` set to the installed Chrome executable. That supplemental Studio-only suite reported 77/81: the four remaining failures are missing environment prerequisites, unrelated to the companion or the website release gate:

| Test | Result / cause |
|---|---|
| `accessibility inspector proves the full published-site acceptance surface` | Playwright package is not installed; deep inspector returns `PLAYWRIGHT_NOT_FOUND`. |
| Tier 2 game web pack workflow | `zip` and `unzip` CLI tools are absent (`ZIP_FAILED:null`). |
| Tier 3 render/export workflow | ImageMagick `magick` is absent. |
| Tier 3 HTTP/import workflow | Same missing ImageMagick executable causes image-fixture creation to return null process status. |

No Studio source, assertions, or tests were changed to hide these prerequisites. No machine-wide packages were installed.

## Screenshot evidence

All files below were captured from the freshly rendered, Pages-base-pathed `dist/` using the focused browser harness.

- Home: [desktop](home-1440x900.png), [390 mobile](home-390x844.png), [430 mobile](home-430x932.png), [320 narrow mobile](home-320x800.png)
- Required adjacent routes: [Play 320 mobile](play-320x800.png), [Toadal profile 390 mobile](toadal-profile-390x844.png), [Search desktop](search-1440x900.png), [Search mobile](search-390x844.png), [Contact mobile](contact-390x844.png)
- Manual positions: [desktop upper-left](companion-position-desktop-1440x900-upper-left.png), [430 upper-right](companion-position-large-mobile-430x932-upper-right.png), [390 lower-left](companion-position-mobile-390x844-lower-left.png), [320 center](companion-position-narrow-mobile-320x800-center.png)
- Persistence/reactions: [scroll desktop](companion-scroll-desktop.png), [scroll mobile](companion-scroll-mobile.png), [hover reaction](companion-reaction-world-hover.png), [touch reaction](companion-reaction-world-touch-390x844.png), [position preserved through reaction](companion-position-reaction-preserved.png)

Structured browser evidence is in `owner-visual-closure-browser-qa.json`; the 77-case report is in `../owner-preview-gate-20261001/browser-matrix.json`.

## Boundaries

No Home content, hero artwork, navigation, or page layout was redesigned; only the requested global companion behavior/placement and related browser evidence changed. The local branch is not pushed. GitHub Pages and production were not deployed or otherwise contacted; `main` was not checked out or modified. Studio-generated build/history state remains ignored/untracked by the website repository.
