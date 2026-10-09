# Website design completion candidate — local only

## Scope and authority

- Base: `e919234634b7c82614eb9ed6f8eefa6627249005`.
- Local branch: `dot/website-design-completion-20261008`.
- Original approved Home reference: SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`.
- Later owner-selected daylight market source: SHA-256 `74497e5de4803d5379bd8c9d5b1df035d0107350b052e116e6117cfe1c893f3c`.
- Approved native input ZIP: SHA-256 `dc2e386a3eda9bdc892e5b1e9b674273b283d50fa4d3d32e4bd2511ac07dcede`.
- No push, PR, merge, publication, deployment, spending, new service or production change.
- This candidate advances visual composition across the existing 30 manifest families and 33 editable routes. It does not upgrade owner visual acceptance or change product canon.

## Implemented design

The original food-world portal hierarchy remains: panoramic environment with separate canonical Toadal and editable left-side headline/actions; four browser-game cards beside real guest-local Feast Pass; three illustrated discovery lanes; compact daily check-in and interactive discoveries; flagship App and future-state panels. Desktop composition begins at 1080 CSS pixels. Tablet and narrow layouts retain all features.

The selected daylight market replaces the historical hero environment only where approved, with a pale shared scenic surround across the existing page families. Crown plus live text remains the website brand. Chocolate navigation, navy display headings, cream/gold panels and pink actions are consistent. Player and Reader retain their focused task surfaces.

Wicked Bites and Froggy/Froggie promotional artwork remains clearly distinguished from genuine gameplay. Only Wicked Bites has a genuine gameplay toggle. The normal card remains a semantic details destination; the independent preview toggle does not navigate. All four art windows align at 155 pixels on desktop. The phone shell is CSS around ordinary managed screenshots, labels and captions.

The exact illustrated mockup wordmark is unavailable and not approved. No replacement was invented. No illustrative scores, account balances, fake game screenshots, published chapters, store availability or release dates were copied from mockups.

## Native editability

Primary source: `studio-project/toadal-feast-website/`.

- `pages/home.json`: separate managed environment and Toadal images, live text/links, registered game IDs, independent preview image stage and control, existing progression bindings, discovery art, native App screenshot and phone-screen container.
- `pages/play.json`: selective approved managed promotional cover replacement only. Registry titles and availability source hashes stay unchanged.
- `pages/app.json`: managed screenshot inside an editable phone-screen container. Existing genuine product captures remain unchanged.
- `collections/patterns.json`: approved reusable cover/gameplay and native phone patterns.
- `collections/advanced-code.json`: shared editable design CSS and bounded interaction enhancement. No whole-page mockup image or generated image substitutes native components.
- `assets/index.json`: six approved additions, independently hashed in the existing visual asset lock. Draft Croaker page, raw draft cover, page-index changes and game-registry changes were excluded.

Preview/cover fitting remains owner-editable through ordinary asset, fit, focal point, zoom and responsive-image properties. The 155px frame is a managed native property. All 33 route records, game availability, source hashes, player isolation, real guest progression and the three locked runtime leaves are retained.

## Contextual companion behavior

A minimized companion still changes its canonical reaction art with the current context. Hovering a section while scrolling no longer opens speech over page content. Speech opens when deliberately expanded; focused/hovered/action context still selects its artwork and text. Hidden/minimized persistence, recovery controls and position handling remain intact. Collision inputs additionally protect Home’s `.home-hero__copy`, `.home-discovery-heading`, `.discovery-heading`, `.whats-next-heading`, `.today-copy`, `.feast-pass-copy`, `.home-discovery-card`, `.discovery-card`, `.next-card`, and `.app-conversion-copy`, and Reader’s `.reader-side-panel` and `.reader-page-heading`. These additions are gated by the respective route markers; the existing collision algorithm, drag, viewport and persisted-position handling stay intact. If Home’s minimized desktop helper has no manual position and a visible header gap can fit a 52px control, it docks there. The compact Home desktop header stays sticky during scrolling. Insufficient gap, expanded state, manual position and other routes retain existing behavior. The mobile docking path is unchanged.

The existing `window.self !== window.top` initialization guards remain unchanged. A narrow iframe therefore witnesses CSS fallback only, not enhanced top-level mobile behavior. Its fallback preserves all navigation links in a scroll rail and suppresses the uninitialized floating speech panel. Top-level narrow runtime must be qualified separately.

## Generation and evidence

Actual native renderer used: local Studio engine `5d022f5c3ea676458a63c8d2bb67ceb69c1a84d5`. It is a local background-fix candidate, not the historical `1d91b1a` witness and not a newly certified Studio release. No Studio engine edits are included.

Generated canonical output has 33 website pages plus one protected cartridge HTML file. The retained `previews/cards-phone-20261008/` namespace is regenerated from the same native candidate, retains 33 website pages, and references the canonical shared runtime and protected cartridge. Generated output is not the authoring source.

The original layout/code assertions that demanded a single outer anchor for every card are retained against a historical migration fixture. Current cards have additional direct contracts for one registered semantic details link, independent toggle, known assets, no nested interactive controls and no fabricated Froggy gameplay. Visitor-copy assertions were updated only for equivalent session-only preview, unavailable CLAW, concept entries, empty chapters and disabled store-download semantics.

The owner-visible visual review remains a separate gate from automated tests. Final verification counts and screenshots are recorded with the local task receipt; missing art/content and real-device touch tests must not be represented as complete.

### Reproduce locally

Use Node with native TypeScript stripping and an explicitly supplied local Studio source tree:

```sh
node --no-warnings --experimental-strip-types scripts/render-local-design-candidate.mjs /absolute/path/to/studio-engine /absolute/path/to/separate-output --sync-dist
node scripts/serve-qualified-dist.mjs /absolute/path/to/separate-output 8159
```

The optional `--sync-dist` derives both existing namespaces after validation, public projection, advanced-runtime externalization, intrinsic image sizing, protected-cartridge verification, base-path verification, static-link verification and staging robots verification. It never modifies the native source or the Studio engine and never runs a deployment. Omit it for a scratch render.


### Freshness serialization detail

The pinned owner-renderer SDK and the local Studio engine serialize paired quotes inside four progression background URLs differently: `url(&#39;…&#39;)` versus `url(&quot;…&quot;)`. The freshness comparator normalizes only those paired quote entities inside inline-style `url()`. It does not alter URL bytes, paths, declarations or unpaired quotes; negative tests reject changes to each. All four final exported URLs independently retain `/toadal-feast-web/assets/images/world/candy-kingdom.webp` and resolve to bytes with SHA-256 `da8261fa30f6535f5288f52841dc2123d21a3251340e5d7888d576b7531809b4`.

The actual local generation order is native render → public export projection → advanced-runtime externalization → base-path/staging-robots transformation → native subtree freshness → intrinsic image metadata → protected cartridge and final link/basepath/robots checks. Intrinsic metadata is intentionally applied after native subtree freshness, matching the existing exporter’s contract.


### Current-candidate native editing witness

A disposable full copy of this native design passed a supported Studio API round-trip:

1. Hero headline: `authoring-kernel.applyOperation` / `content.setText`.
2. App link destination: `project-kernel.updateComponent`, the existing Studio Inspector/PATCH update route.
3. Approved promotional cover: `authoring-kernel.applyOperation` / `image.reframe`, changing fit, focal point and zoom.

Each saved change was reopened from the native page file and observed in freshly rendered HTML. The edited copy validated with no errors or warnings, then its original page was restored and rendered again. The authoritative candidate’s complete native-source fingerprint was identical before and after. This proves the selected text/link/image-framing paths in the current source; it does not claim a fresh Studio UI walkthrough or every editor control was exercised.


## Final bounded verification

- Required workflow: 283/283 passed.
- Control tests: 25/25 passed.
- Focused design, native-object and truthful-state contracts: 29/29 passed, including twelve new regressions.
- Home visual contract: 38/38 passed.
- Native source validation: no errors or warnings; pre-intrinsic freshness passed.
- All 67 generated HTML files passed static links, project base path and staging robots checks: 33 canonical website routes, 33 retained preview routes and one protected cartridge HTML file. All three protected cartridge files remain byte-identical.
- Visual asset authority, current catalogue source/availability and manifest ledger checks passed.
- All four progression backgrounds retain the configured subpath and resolve to verified asset bytes.
- Independent browser QA passed the final Home desktop scroll sweep, actual top-level 389 CSS-pixel view at DPR 1, and native 200% zoom. Companion expand/minimize/hide/reload/recovery worked. Its 52px default desktop control remained in the measured header gap across all Home bands. Reader sidebar overlap was cleared.
- Representative desktop routes inspected: Home, Play, World, App, Stories, Feast Pass and Reader. App/Play also received narrow and 200% checks during the unchanged layout phase.

The final frozen browser output is `candidate-review-10`, SHA-256 inventory fingerprint `8deadfb738d62b7aa7b1ef40995d96f5d963c19e6fbabe046c146405375b57c3`. Representative screenshots are in `screenshots/` and the structured check summary is `verification-summary.json`.

No physical-device touch test, complete 33-route pixel comparison or new editor UI walkthrough is claimed. The full unfiltered historical test glob includes separate evidence/environment assumptions and is not represented by the green required-workflow result. The final illustrated wordmark, unpublished stories/content, unverified store destinations and unavailable account/commerce services remain explicit external gates. This local implementation is a reviewable design candidate, not owner acceptance or deployment permission.


### Bounded lower-band refinement

The final desktop App/future-state band is about 434px at 1180 CSS pixels, down from 499px in the prior checkpoint. The composition-only pass reached 407px; two subsequent accessibility corrections intentionally traded 27px for usable navigation targets. Three-column future cards, concise truthful state copy, a compact green-candy row and tighter App spacing preserve all five states, store-disabled controls and real managed phone screenshots. Daily/discovery remains about 280px, reflecting the retained check-in, portal, candy and Golden Block interactions rather than fake sample content.

Home’s daily card carries one visible UTC/local/separate-mobile notice. Ready/claimed labels are native attributes; a Home-only event-driven presentation adapter maps exactly the existing two runtime messages, preserving unknown/error text. The pinned guest-progression file is byte-identical. No polling, progression rule change or persistent-state write was introduced. Additional simplification is a nonblocking future refinement, not a claim of pixel identity with illustrative mockups.


The final target corrections are limited to Home’s real-gameplay CTA and the three standalone Community/Store/Account heading links: each has a 44px minimum hit height. The final three links were observed at 44px on both 1180px desktop and actual 389px top-level narrow views, without overlap or horizontal overflow. These are navigation targets, not prose-link exceptions. Final evidence carries forward only unchanged regions from the preceding qualification checkpoints.
