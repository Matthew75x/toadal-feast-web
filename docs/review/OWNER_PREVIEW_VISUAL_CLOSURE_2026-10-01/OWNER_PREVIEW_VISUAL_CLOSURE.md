# TOADAL FEAST Owner Preview Visual Closure

- Date: 2026-10-01
- Candidate branch: `integration/stories-search-convergence-20261001`
- Start SHA: `ce5aceb251ac6b612fcace7baa6ea63032ca93a7`
- Staging branch at start: `270940dee30b7aafb70af941c520c6d4d223e288`

## Result

The integrated candidate is ready for owner review on GitHub Pages staging. It is not a production deployment and does not constitute `LOCK_VISUAL` acceptance. The approved Home reference was compared directly against the final Home capture; the candidate retains the Feast-world identity and is materially closer as a complete, truthful portal.

## Truth and visual changes

- Search is a working local-only discovery route, linked from the shared header. It has no external search service.
- Home Feast Pass reads the guest-local progression runtime; the summary uses live values and explicitly says account sync is unavailable. The optional UTC-day check-in uses the same runtime and remains separate from mobile-game state.
- Characters copy distinguishes the available hub and Toadal preview from unfinished broader profile depth.
- Stories, Manga, and Reader surfaces remain present, but no unapproved series, chapters, covers, or pages are invented.
- The compact header Search utility, expanded discovery lane, more truthful Feast Pass summary, mobile Today layout, and higher-contrast App copy improve clarity. The companion is in document flow and no longer covers Search controls or footer links.

Before/after captures from the candidate work: [`home-1366x768-first.jpg`](home-1366x768-first.jpg) and [`home-1366x768.jpg`](home-1366x768.jpg). The controlling approved reference is [`approved-home-visual-authority.png`](../WO-002/evidence/approved-home-visual-authority.png), SHA-256 `4154F582ED9E7AD8EE31010A3B6974BCD8AAAE0CB72CACF1D6A953FA6BF79608`. A fresh side-by-side is available in [`approved-vs-final-home.html`](approved-vs-final-home.html).

## Automated qualification

- Required website suite: **48 passed, 0 failed, 0 skipped**.
- Home visual contract: **37 passed, 0 failed, 0 warnings**.
- Navigation truth: 30 routes, 19 navigation targets checked, 0 unresolved.
- Character registry: 7 characters, 2 routes, 0 errors.
- Gated ecosystem: 7 route records, pass.
- Manifest compliance: 30 routes, 23 cross-cutting requirements, pass.
- Search/Discovery: 30 routes, 48 local index entries, no external search service.
- Cartridge storage isolation: pass.
- Accessibility: all 9 static checks pass with 0 errors / 0 warnings; deep Playwright checks were available and produced page evidence for Home, Search, Play, Toadal, and Reader.
- Story content and local-search builders both ran successfully before the final Studio render.
- Pages base-path, static-link, and staging-robots checks: pass on both the transformed export and final `dist/` (31 HTML files). Final `dist/` contains 113 files and exactly matches the transformed static export by SHA-256 inventory; no old-only files were found.

## Studio result

Studio 1.4.2 `validate`: pass (0 errors, 0 warnings). `toadal.inspect`: valid workspace; 30 pages, 4 games, 41 assets, 40 components; graph 128 nodes, 86 edges, 4 dangling references. `toadal.render`: pass, 113 files / 40,292,530 bytes. Static export: pass, 38,176,154 bytes. Verify checkpoint: `ok=true`.

The supplemental Studio package suite is not fully green and was not altered for this task. With the installed Chrome and Python Playwright paths supplied, it reports **78 passed / 3 failed**. The remaining failures are Studio-package-only tool prerequisites: Tier 2 press-pack ZIP reports `ZIP_FAILED: null` because the `zip` CLI is absent; Tier 3 media optimization requires ImageMagick (`magick`) which is absent; the Tier 3 HTTP test reaches the image-optimization step and fails for the same missing ImageMagick executable. The Studio accessibility and visual-regression tests pass with the explicit Windows Chrome/Playwright paths. The task's required website suite and actual exported-site browser checks are green.

## Visual and browser evidence

The final browser run captured and visually inspected the seven required Home viewports and desktop/mobile pairs for Play, Characters, Toadal, World, Stories, Manga, Reader, Search, and Feast Pass: **25 captures**. All report no horizontal overflow, broken or pending images, failed responses, or runtime exceptions. Six additional lower-page captures cover Discovery, App/What’s Next, and Today at desktop/mobile sizes. An independent Luna visual review found no remaining severe readability or overlap issue.

Reader is intentionally in its empty-catalogue state: both Reader captures record one empty-source placeholder, while the visible reader panel explains that no chapter is published and includes no sample page art. This is disclosed content state, not a failed or pending image request.

Interactive checks on the exact final static bytes:

- A real pointer click changed the Home daily check-in from available to claimed in browser-local storage; the button became disabled and reported the current UTC day.
- Typing “Toadal” returned 29 local Search results; the first Character link retained `/toadal-feast-web/`.
- The mobile navigation opened, exposed the prefixed Search route, and closed with Escape.
- The companion is statically positioned; no overlap with the Search submit control or Home footer Support link was detected.

Evidence files: [`browser-captures.json`](browser-captures.json), [`interactive-checks.json`](interactive-checks.json), [`home-lower-captures.json`](home-lower-captures.json), and the paired screenshot files in this directory.

## Remaining visual differences and boundaries

The approved authority remains denser and more illustration-rich than this review build; some compact discovery/game descriptions are intentionally clamped at the current viewport sizes. The published Stories/Manga/Reader catalogue is empty by design until approved source content exists. App-store destinations are not verified and remain disabled. These are disclosed preview limits, not claims of completed product content.

The candidate is authorized for staging owner review only. `main`, production, and `toadalfeast.com` are untouched. The owner must decide whether to accept the visual lock after reviewing the preview.
