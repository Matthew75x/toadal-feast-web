# Stories + Gated Website Integration Audit — 2026-10-01

## Result and scope

Result: **PASS WITH DOCUMENTED GAPS**. The integrated website candidate passed its scoped source, export, static, responsive-browser, and repository test gates. No website was deployed. This audit does not grant Home visual owner acceptance or claim that Stories/Manga content or a publishing backend exists.

Only the Stories/Manga/Reader integration and bounded convergence fixes were in scope. Search/editorial WIP, production, live staging, game source/gameplay, and deployment were not included.

## Provenance

- Branch: `integration/stories-gated-convergence-20261001`
- Clean integration base: `f7b556fe0a6392fc428942f471eeda13e42ca0a4`
- Qualified Stories donor: `8b681eeb31a56c7bb69133664b7ce5b5574aeeda`
- Merge-base: `4f01ee29bddc1d25f0cf4e304057e10e93a51d38`
- Integration strategy: merge the donor into a fresh worktree at the exact base, reconcile shared source/CSS, then regenerate the tracked deployment artifact from the integrated Studio project.
- The separate editorial/search WIP worktree was not used or modified.
- Before-work remote refs recorded for `main` and `staging/live-visual` were left out of this branch’s writes; only the new integration branch is pushed.

## Integration summary

- Preserved the base candidate’s Home, gated ecosystem, guest progression, characters, account/community/contact surfaces, game details, and isolated Wicked Bites preview.
- Integrated `/stories/`, `/manga/`, and `/reader/`, their structured content projection, registry/schema, focused tests, and documented empty-state screenshots.
- Reconciled the shared stylesheet rather than selecting either side wholesale. Chromium does not expose focus on the parent iframe as `:focus`/`:focus-within` when focus enters its browsing context. The host now listens for the parent-window `blur` event while the player iframe is `document.activeElement`, applies a host focus class, and removes that class on return to the host document; CSS gives that state a visible outline. The contract test covers the source hooks, and the final browser matrix separately exercises the real Tab-to-iframe sequence.
- Labeled the Contact attachment control, fixing an unnamed control in rendered-browser QA.
- `dist/` was audited before regeneration. After source integration, the exact transformed Studio export and final `dist/` each contain 110 paths; a final SHA-256 comparison found no missing, extra, or byte-mismatched files. New generated Stories pages/assets are intentional output from the integrated project. No manual/untracked content under `dist/` was found or deleted.
- Generated Studio preview/history state is ignored and was not staged.

## Stories surfaces and manifest

- `/stories/`: functioning hub, truthful empty state, no invented published catalog.
- `/manga/`: reusable series shell, no approved series/chapter records exposed.
- `/reader/`: reader shell and manifest-driven behavior; no chapter/page records exposed. Progress remains separately namespaced from guest progression.
- Public projection is fail-closed and only serializes allowlisted public fields. Generated `series`, `arcs`, `chapters`, and `pages` collections remain empty until approved content exists.
- Manifest rows 8–10: `PARTIAL`, `PARTIAL_CANDIDATE`, `PARTIAL_CANDIDATE`. These statuses reflect route/architecture evidence, not published content, editorial operations, account sync, or backend completion.
- Manifest verifier: 30 rows, 29 registered route records, 23 cross-cutting requirements; status counts reconcile as `16 PARTIAL_CANDIDATE / 10 PARTIAL / 3 NOT_STARTED / 1 DONE_PROVEN`.

## Staging robots and WO-002 contract

- The raw generated Wicked Bites cartridge HTML is not hand-edited. `scripts/wo001-pages-basepath.mjs` has an explicit `--staging-robots` opt-in that adds `noindex,nofollow` to that generated document; the Pages workflow passes it only after the `staging/live-visual` job gate. Default/non-staging transform behavior is unchanged.
- Pages workflow push trigger and deploy-job ref condition remain staging-only. The integration-branch push cannot deploy Pages through this workflow. No deployment was run.
- WO-002 package-size drift (`1,467,205` expected vs `1,469,109` measured, `+1,904`) was traced to CRLF expansion in the unchanged `index.html` (+1,800) and `toadal-bridge.js` (+104). Normalizing those package text inputs to UTF-8/LF reproduces the canonical Git blobs. The test now compares canonical package bytes/ledger after line-ending normalization; expected canonical hash remains `d775a2fd2ee236b0b0171732f0d7202b6c95c1b1eb11127e86c9949963851153`. No gameplay or cartridge source was changed.
- The route contract now asserts the required base routes, approved game-detail routes, and exactly one qualified `/player/wicked-bites/` route while allowing the seven newer gated routes.

## Studio and repository verification

- Node.js `v22.23.2`; npm `10.9.8`.
- TOADAL Studio / bridge `toadal-studio@1.4.2`; project manifest `studio-project/toadal-feast-website/project.json`; `plugins: []`.
- `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-stories-gated-integration-20261001\studio-project\toadal-feast-website\project.json`.
- `npm run validate`: PASS, `valid=true`, zero errors and warnings.
- `npm run render` with the exact `TOADAL_PROJECT`: PASS, 110 files.
- MCP bridge sequence `toadal.inspect` → `toadal.render` → `toadal.export(kind="static")` → `toadal.checkpoint(mode="verify")`: all returned `isError=false`; inspect validation was valid; checkpoint `ok=true` and its validation subprocess exited 0.
- `ai:doctor`: PASS, 26/26 checks, including exact-project inspect, both MCP transports, HTTP origin rejection, and rate limiting.
- Static export: 110 files; ZIP `build/exports/toadal-feast-website-static-site.zip`, 38,153,655 bytes, SHA-256 `046CE9B761DE56172BA8AE29591EB15AB9199974ACBB5479649D7C7683A97CC1`. Extraction succeeded; `index.html`, `404.html`, Stories/Manga/Reader documents, content data/script, and isolated game package were present.
- The final Pages-transformed export matched `dist/` path-for-path and byte-for-byte (110/110 files; 40,186,765 bytes); the index’s path-filtered Git blob IDs also matched the transformed export for all 110 files. The transformed tree includes the base-path rewrite and staging-only robots policy.
- Pages base-path verifier: PASS on 30 HTML files. Transform: 31 files scanned, 30 HTML files and 835 URLs rewritten; idempotent behavior is covered in tests.
- Static-link verifier: PASS on 30 HTML files. Staging robots verifier: PASS on 30 HTML files. WO-001 Home verifier: PASS, 69 checks.
- Home visual contract: PASS, 29/29. Character registry: PASS. Gated ecosystem: PASS, 7 gated routes. Navigation truth: PASS, 29 routes / 18 nav targets / 0 unresolved. Cartridge storage isolation: PASS. Story projection `--check`: PASS.
- Integrated website/WO-002 Node suite: `node --test scripts/stories-publishing.test.mjs scripts/story-content.test.mjs scripts/wo001-pages-basepath.test.mjs scripts/wo002-contract.test.mjs scripts/guest-progression.test.mjs` — **48 passed, 0 failed, 0 skipped**.

### Supplemental Studio package-suite limitation

The Studio tool’s own 81-test suite was run as supplemental evidence; it is **not reported as green** and Studio source was not changed. Its first execution reported 62/81, while the later filtered rerun reported 76/81, so the suite did not produce a stable all-pass result. The latest run’s five failing tests were:

1. `accessibility inspector proves the full published-site acceptance surface` (`plan-conformance.test.ts`)
2. `Tier 2 game web pack completes creation, preview, press, release and reviewer workflows` — `ZIP_FAILED: null`
3. `Tier 3 render/export workflow covers polish, SEO, feeds, scheduling, PWA and optimized media` — ImageMagick prerequisite check failed.
4. `Tier 3 Studio HTTP surface exposes theme modes, QR generation and automatic import optimization` — its ImageMagick fixture command failed.
5. `Tier 4 plugin permissions, scheduler, QA, export and deployment systems close the advanced checkpoint`.

Neither `zip` nor ImageMagick (`magick`) is installed in this environment. In addition, Studio `toadal.qa(level="full")` returned `spawnSync npm.cmd EINVAL` for its child test runner; direct `npm test` ran and exposed the failures above. This is a documented Studio toolchain qualification gap, not a failure in the website’s 48-test integration suite or final browser matrix. The four reported reference-graph dangling edges were independently traced to the analyzer mistaking generic `game.card` component types for game records; each card’s actual `gameId` resolves to one of the four existing game records.

## Browser/responsive matrix

The final recorded run is in `docs/review/STORIES_INTEGRATION_AUDIT_2026-10-01/browser-matrix.json`. All **116/116** registered-route/viewport cases passed, including `/404.html`, at 1440×900, 768×1024, 390×844, and 320×800; all **3/3** reduced-motion cases passed. The report records zero unexpected external requests, browser/console/page errors, missing assets, broken links, or invisible/unvisited keyboard focus stops. Reduced motion was verified by computed style: `scroll-behavior: auto`, max animation duration `0.01 ms`, and max transition duration `0.01 ms` on Home, Stories, and Reader. The player iframe host indicator also passed in its four viewport cases with no traversal cap hit.

The dedicated Stories/Manga/Reader browser check passed **11 checks** against the exact final local `dist/`: all three routes at desktop, mobile, and narrow-mobile sizes; truthful empty states; base-path runtime/registry loads; an in-memory-only published-content fixture driving Manga selection and real reader page 1→2→1 keyboard navigation, next-page and bookmark persistence; guest keys unchanged; and Stories runtime isolation from Home. The fixture is test-only and was not written into the public content projection. Six empty-state screenshots are recorded in the publishing-stack evidence folder; the rerun introduced no image diffs.

An initial recorded run found the host iframe keyboard-focus indicator issue. The final whole-site report records the actual iframe Tab stop, host focus class, and visible computed outline at all four viewport sizes; a dedicated rerun is also saved as `docs/review/STORIES_INTEGRATION_AUDIT_2026-10-01/player-focus-matrix.json` (4/4 PASS). The QA harness detects natural focus-cycle completion, fails if the traversal cap is reached, checks computed reduced-motion timing, and fails on unexpected external requests. A report-writer compatibility issue was corrected; only the final JSON’s case results are authoritative.

## Final static-output audit

- Final output: 110 files, 40,186,765 bytes: 30 HTML, 1 CSS, 4 JS, 2 JSON, 26 PNG, 44 WebP, 1 SVG, 1 `.nojekyll`, and 1 text file.
- No source maps or debug/test-fixture/log artifacts were found.
- Static/local links and fragments, Pages base paths, required assets, and staging robots policy passed their verifiers. The browser matrix also checks image decoding and failed same-origin requests.
- The 25 full-resolution companion PNG source copies total 34,156,729 bytes; runtime contexts use their optimized WebP derivatives. They are retained canonical source exports, not pruned by size alone. A separate canonical Toadal PNG is 335,410 bytes. This is a documented deployment-payload opportunity for a future explicit asset-export policy, not an untracked or accidental file.
- Base `dist/` at `f7b556fe0a6392fc428942f471eeda13e42ca0a4`: 81 files, 5,781,471 bytes. The larger integrated output reflects the new route/template output, raw game package, source artwork copies, and Story runtime assets; the PNG duplication is called out above rather than treated as an unexplained size delta.

## Authority, unresolved work, and deployment

- Home remains subject to owner `LOCK_VISUAL` acceptance. Automated contract PASS is not owner approval; no Home redesign was performed.
- No approved published story/series/chapter/page content, editorial publication workflow, backend, or account synchronization is claimed.
- Studio’s non-green/variable package test suite and generic graph-reference false positives are recorded as toolchain gaps; the website candidate’s required integration checks are green.
- Regression gates passed for Home, Play/Games, World, Characters, Stories, Feast Pass, gated routes, guest progression, navigation, responsive layout, and the accessibility foundation.
- No GitHub Pages, Netlify, or production deployment occurred.
- Next recommended action: obtain owner Home visual acceptance and address Studio’s missing `zip`/ImageMagick test prerequisites before treating Studio 1.4.2’s complete package suite as certified.
