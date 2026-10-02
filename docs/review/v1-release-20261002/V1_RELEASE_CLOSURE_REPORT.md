# TOADAL FEAST WEBSITE V1 — authoritative release closure report

Engineering and delegated practical visual acceptance are complete. The exact qualified build is frozen, pushed and proven on GitHub Pages staging. Production has **not** been replaced: authenticated access to the existing host serving `toadalfeast.com` is unavailable. This is the only external release dependency, not an owner visual-review decision or an unfinished feature tranche.

## Exact release identity

| Item | Exact value |
|---|---|
| Starting candidate | `0dfa18d2b7bad97d862849a4360000c3fa8c8aff` |
| Starting tree | `b6a61fb0f2c474809b2ca80f3dfb55ab4fc6260e` |
| Final qualified / deployed SHA | `6e543f2abebe66ef46ca6ecaa6da20e3196a5c43` |
| Final qualified tree | `b48efb7b20c72c11acc017a4807bc545aa81f17a` |
| Release branch | `release/website-v1-engineering-20261002` |
| Annotated release tag | `website-v1-engineering-20261002` (peeled commit equals the final SHA) |
| Work branch | `work/owner-visual-acceptance-20261002`, final qualified SHA |
| Staging branch | `staging/live-visual`, final qualified SHA |
| Main | `87050885331770ca3e30db7e463154aebd777512`, unchanged |
| Receipt branch | `ops/v1-release-closure-20261002`, separate descendant containing post-deployment evidence and a QA-harness correction; not deployed |
| Production deployment identifier | None; no production deployment performed |
| Production target URL | <https://toadalfeast.com/> — still the older TOADAL GAMES site, **not this release** |
| Verified staging URL | <https://matthew75x.github.io/toadal-feast-web/> |
| Pages Actions run | `36982253191` — [successful run](https://github.com/Matthew75x/toadal-feast-web/actions/runs/36982253191) |
| GitHub Pages deployment | `6804115029`, `github-pages`, successful; SHA equals the final qualified SHA |
| Rollback SHA | `d6be86a9762370b66e79c1d5a36ab8066e421496` |
| Rollback ref | `backup/owner-qualified-20261002-d6be86a`, preserved remotely |

The clean freeze and exact tag object are in [FROZEN_RELEASE.json](FROZEN_RELEASE.json). The receipt's own Git commit is intentionally not embedded inside itself; the closure delivery supplies that receipt commit separately. Product source and `dist/` on the receipt branch remain identical to the frozen release. No force push, shared-history rewrite, unrelated merge, credential alteration or DNS change occurred.

## Source changes after the starting candidate

Only two product sources changed, plus their authoritative Studio-generated copies:

- `studio-project/toadal-feast-website/reference/assets/js/companion-position.js` → `dist/assets/js/companion-position.js`: bounded avoidance of visible actionable controls for automatic placement, with rAF-batched scroll/layout invalidation. Explicit manual drags/saved positions, mobile header docking, pointer cancellation, contextual art and the floating architecture remain intact.
- `studio-project/toadal-feast-website/pages/home.json` → `dist/index.html`: Home companion selects the existing approved victory WebP through `srcset`, retaining the canonical PNG fallback. No artwork pixels or visual design changed.

Governance/evidence and five bounded verification/correction scripts were added. Existing tests, assertions, CSS/design, assets, registries, game cartridge source and Studio source were not changed. Shared `advanced-code.json` is exactly the starting blob; an unsuccessful shared-code delivery trial was reversed through Studio and is not in the released product bytes.

The receipt includes one verification-only harness correction after the freeze: a deliberately missing route must return HTTP 404, and Chromium reports that document response as a console resource error. The harness now classifies only the exact missing-document URL plus the exact 404 diagnostic as expected. Asset/runtime errors still fail. The original failed smoke report is preserved in `live/smoke/`; the corrected evidence is `live/smoke-qualified/`. This did not change deployed code, weaken any existing repository assertion, or cause a second deployment.

## Delegated visual acceptance

ACCEPTED for practical V1 release. The approved world-first identity, cream/chocolate/pink/gold language, readable game artwork, playful canonical characters, mobile composition, visible primary CTAs and coherent App/World/Characters/Stories/Media/Feast Pass surfaces were reviewed against the approved Home reference and the candidate's before/after captures. The final source preserves that accepted design. No invented PUBLIC games, story catalogue, store destinations, account success or rewards were introduced to mimic a concept image.

Missing standalone wordmark and bespoke multilayer hero art are non-blocking future art upgrades under this delegated release standard. This is practical V1 acceptance, not a retroactive claim of pixel parity or a new `LOCK_VISUAL` claim.

## Known overlap resolution

Both reported diagnostics were real pointer blockers, not benign rectangle artifacts. Before correction, the companion intercepted the Public filter on desktop Play and tablet Search. Physical clicks worked after moving the helper clear, proving the underlying controls were functional.

After correction: 3/3 bounded physical-input checks PASS — Public filtering changes state, Search submits `Toadal` and displays eight results, and an explicitly dragged position remains manual/persistent. The final 77-case matrix reports **zero** control-overlap diagnostic entries. Opened contextual bubbles and deliberate user positioning remain user-controlled and can cover content; automatic mobile defaults remain clear across the focused views.

## Performance / delivery decision

Cold local Home transfer fell by 332,763 bytes and one request per viewport:

| Viewport | Before | Final | Reduction |
|---|---:|---:|---:|
| Desktop 1440×900 | 2,209,593 B | 1,876,830 B | 15.1% |
| Mobile 390×844 | 1,329,765 B | 997,002 B | 25.0% |

The existing approved 63,422-byte WebP serves both hero and companion; initial Home captures no longer download the extra PNG. Canonical hash/alpha remain unchanged. Later context return may legitimately load the fallback. Responsive mobile world art and proximity-gated discovery sprites work. No broken references, repeatable material CLS problem, external font/third-party blocking chain or pathological JS fan-out was demonstrated. The local capture is not a public-host performance score.

The 183,348-byte world image still has canonical and Studio-materialized URLs. This modest optimization is deferred because removing it requires changing Studio materialization or losing structured game-card binding. Provenance/master art is not indiscriminately pruned. Actual deployed probes confirm gzip delivery for text, valid asset MIME types and a 600-second cache lifetime; no speculative cache-policy rewrite was made.

## Final qualification commands / results

Runtime: Node `v22.23.2`, npm `10.9.8`, audited TOADAL Studio `1.4.2`. Project: `studio-project/toadal-feast-website/project.json` in this repository; Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.

| Command / gate | Final result |
|---|---|
| Studio `npm run validate`; inspect → render → static export → verify checkpoint | PASS; zero validation errors/warnings; 133 rendered files; checkpoint `ok:true` |
| `node --test` | 52/52 PASS; zero failed/skipped/cancelled/todo |
| `owner-preview-gate.py --repo . --report-dir docs/review/v1-release-20261002/gate-qualified` | 16/16 PASS; required subset 48/48; browser matrix 77/77 across 30 routes |
| Home, navigation, characters, gated ecosystem, manifest, Search, non-Home truth, visual assets, non-Home layout, cartridge isolation | All PASS |
| Render freshness, Pages base path, static links, staging robots | All PASS locally and applicable deployment checks PASS in Actions |
| `owner-visual-acceptance-qa.py ... --report-dir docs/review/v1-release-20261002/focused-qualified` | 13/13 visual captures and 17/17 real companion interactions PASS; zero failures; both mobile CTA alpha intersections zero |
| `v1-companion-controls-qa.py` | 3/3 physical-input checks PASS |
| `verify-canonical-gully-gameplay-authority.mjs .` | PASS; happy neutral Gully and Wicked Bites source/export blobs unchanged |
| `verify-app-download-production.mjs .` | PASS; real gameplay captures and disabled store destinations preserved; verifier name is not a production-deployment claim |
| Direct Studio canonical-fixture `npm test` | 81/81 PASS; zero failures/skips; website environment overrides unset only for this fixture child |
| Direct exact-project `npm run ai:doctor` | 26/26 PASS |

The four unchanged `component.home.games → game.card` graph edges are the previously explained resolver false positives for component types, not missing game IDs/assets. They remain explicitly recorded; all four structured cards and game records qualify. The Windows full QA/checkpoint wrapper still fails to spawn `npm.cmd` with `EINVAL`. That failure is recorded, not reported as green; direct identical commands qualify successfully with zip/ImageMagick present. No toolchain source or assertions were patched to hide it.

Final static ZIP: 39,830,590 bytes, SHA-256 `220e03362a89e9519d50a463377af7816b598a3a5fdb567bd8bf71d8c7eed285`. Studio build/export/history state remains ignored and untracked.

## Actual deployed staging certification

Pages deployed SHA `6e543f2...` successfully. Deployment transformation was idempotent: 32 files scanned, zero rewritten, zero URLs rewritten, staging robots already present. Base-path, static-link and staging-robots checks passed for 31 HTML files in the Linux deployment job.

`v1-release-byte-probe.mjs <frozen SHA> <staging URL> ...`: **23/23 PASS**. Response SHA-256 values match frozen Git blobs for representative routes, CSS/shared JS, Gully/victory art, all three cartridge files, robots and the actual missing-route 404. This proves deployed bytes and build identity, independently of a page build-SHA meta tag.

`v1-release-live-smoke.py --base-url <staging URL> --expected-robots staging ...`: **29 requested checks PASS**, zero failed, 14 screenshots. The optional HTML SHA marker probe is NOT_REQUESTED because no such marker exists; identity is proven by deployment SHA plus the independent byte probe, not counted as a skipped release requirement.

- Home, Play, Wicked Bites detail, World, Characters, Stories, Media, Feast Pass, App and Search: HTTP 200, expected navigation, loaded art, companion behavior, no overflow or unexpected runtime/HTTP asset errors.
- Home 390px primary CTA: physical click reaches Play.
- Tablet Search 768px: actual submitted form query produces results.
- Play → Wicked Bites detail → preview CTA → legitimate cartridge iframe: physical navigation mounts the game; actual Play input produces `Game started` runtime status.
- Mobile menus: actual open/close checks pass; App store controls remain disabled with no destination.
- Missing route: actual HTTP 404, visible site fallback, no failed fallback assets; body bytes match frozen `dist/404.html`.
- Staging robots remain `noindex,nofollow`; no production indexing claim is inferred from that policy.

Evidence: [byte probe](live/deployed-byte-probe.json), [live smoke](live/smoke-qualified/v1-release-live-smoke.json), [live screenshots](live/smoke-qualified/screenshots/), [final local gate](gate-qualified/OWNER_PREVIEW_GATE.md), [final visual/interaction evidence](focused-qualified/owner-visual-acceptance-qa.json), [Studio flow](studio-flow-qualified.json), [supplemental Studio evidence](studio-supplemental-qualified.json).

## Production boundary / exact external blocker

**Production smoke: NOT RUN against this V1 build; this build is not deployed at the production domain.** The domain still returns HTTP 200 for “TOADAL GAMES — Different worlds. One home.” Its Home response SHA-256 is unchanged between the pre-release and post-staging observations: `12f045e849b6dffac2cf62796e8c4341c4ec3d7c82f615cb8cd789c2573b214a` (latest observation `2026-10-02T08:12:52.862Z`).

The existing repository has only staging Pages deployment, no production workflow or deployment secrets. Neither main nor Pages is its documented production-source procedure. Cloudflare-fronted DNS does not identify the origin deployment target. Local login/config, environment variables, authenticated browser surfaces, owned/editable Sites projects and relevant available connectors yielded no usable production deployment connection. See [HOSTING_ACCESS_EVIDENCE.json](HOSTING_ACCESS_EVIDENCE.json).

Sole concrete dependency: **authenticated deployment access and the existing target/project binding for the host serving `toadalfeast.com`**. No new hosting architecture, domain cutover, credential workaround or fake production success was introduced. Main and production remain untouched because no established production path is accessible, not because approval is missing.

## Repository state / rollback / post-V1

Release and tag were pushed normally; staging was fast-forwarded to the exact qualified SHA. Main and remote rollback were rechecked unchanged. The receipt is committed/pushed only on `ops/v1-release-closure-20261002`. Its source and deployment artifact remain identical to the freeze, and Git status is clean after that receipt commit. No untracked generated duplicates or bytecode were included.

Rollback remains recoverable from the preserved `d6be86a...` branch, tracked deployment bytes and previously preserved deployment. An actual rollback should redeploy that known-good artifact through an authorized provider operation or use a normal revert commit, not a destructive force push.

Explicit post-V1 scope: additional Arcade variants/games, QR/campaign work, accounts, expanded progression, additional editorial stories/content, future bespoke art/wordmark, analytics and SEO growth. None was merged into this release. Known non-blocking limits: Chromium viewport/touch emulation rather than physical Safari/Firefox certification; modest duplicate world delivery; unavailable future art/content/store states remain truthful rather than fabricated; Windows Studio full-wrapper spawn limitation with successful direct qualification.

V1 ENGINEERING COMPLETE — EXTERNAL RELEASE BLOCKER
