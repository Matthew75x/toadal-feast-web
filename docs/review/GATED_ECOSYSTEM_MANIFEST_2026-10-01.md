# TOADAL FEAST Website - Gated Ecosystem Manifest Candidate

**Date:** 2026-10-01
**Branch:** `work/gated-ecosystem-manifest-20261001`
**Base:** `integration/manifest-home-characters-progression-20261001@4f01ee29bddc1d25f0cf4e304057e10e93a51d38`
**Implementation commit:** `61023edf34f14fc9131ebfe258000cffbea49520`

## Manifest rows advanced

Rows **19, 21, 22, 26, 27, 28, 29** moved from absent/inline-only/deferred structures to dedicated truthful candidate routes.

| Row | Route | Candidate behavior | Remaining external/product gate |
|---:|---|---|---|
| 19 Account | `/account/` | Guest status, continue-as-guest, future benefits, disabled signup/login, privacy/legal routing. | Real identity/login/sync backend and approved service copy. |
| 21 Community | `/community/` | Curated-area preview without fabricated creators, posts, uploads or events. | Posting/moderation/social backend and real published community records. |
| 22 Store | `/store/` | Merchandise/digital-goodies structure with no products, prices, cart or checkout. | Approved catalog, commerce provider, inventory/fulfillment/entitlements. |
| 26 Contact | `/contact/` | Full manifest field structure with submit/upload disabled and explicit no-endpoint truth. | Verified endpoint or approved public mailbox. |
| 27 About | `/about/` | TOADAL GAMES in subordinate studio role; TOADAL FEAST remains flagship/public-first. | Approved deeper studio history and real press/business destinations. |
| 28 Coming Soon | `/coming-soon/` | Reusable branded construction destination with useful escape paths and no fake dates. | Apply consistently to future unfinished destinations as they appear. |
| 29 Legal | `/legal/` | Readable Privacy/Terms template and current product facts without generated legal copy. | Approved Privacy Policy, Terms, dates and verified legal/privacy contact text. |
## Additional reconciliation

- Home `What's Next` keeps its existing composition but now links Community, Store and Account Sync to their truthful preview routes.
- Support no longer claims all website progression is unsaved. It now distinguishes browser-local Feast Pass progress from unavailable account sync.
- Support now links to Account, Contact and Legal status surfaces.
- Contextual Toadal uses the existing approved runtime states for account, community, merchandise, contact, partnership/business, maintenance/construction, privacy/legal and support.

## Truth boundaries

- Account does not expose a live credential flow.
- Community exposes no posting/upload form.
- Store exposes no checkout, cart, price, inventory or purchase path.
- Contact has no form action, disabled submit and disabled attachment; entered text is explicitly described as not transmitted.
- Coming Soon contains no invented launch date or countdown.
- Legal explicitly marks Privacy Policy and Terms as not published and distinguishes technical product facts from legal policy.

## Verification

- Gated ecosystem truth verifier: **PASS**.
- GitHub Pages base-path verifier: **PASS** across 28 HTML files.
- Navigation truth: **PASS**, 27 implemented static route records, 0 unresolved targets.
- Home visual contract: **29/29 PASS**.
- Character content registry: **PASS**.
- Guest progression unit suite: **17/17 PASS**.
- Desktop/mobile browser smoke: **0 failures, 0 console errors, 0 HTTP/resource failures**.
- Tested gated/support routes had no broken images, no horizontal overflow, and the contextual companion remained within the viewport.
- Source/dist stylesheet SHA-256 parity: **PASS**.
- Standalone browser-game cartridge boundary versus base: **unchanged**.
## Static-link checker note

`scripts/verify-static-links.mjs` is not GitHub-project-base aware. It interprets valid `/toadal-feast-web/...` URLs as paths relative to `dist/` and reports those links as missing across pre-existing untouched pages as well as new pages. No valid project-base links were rewritten to satisfy this legacy checker.

For this candidate, `verify-pages-basepath.mjs`, `verify-navigation-truth.mjs`, and the real HTTP browser smoke are the authoritative route/resource checks.

## Visual evidence

Desktop WebP proofs and the machine-readable browser result are under `docs/review/gated-ecosystem-20261001/`.

## Deployment boundary

`main`, `staging/live-visual`, production, DNS and standalone game cartridges were not changed. No Pages deployment occurred.

This branch remains a **PARTIAL_CANDIDATE** lane. Dedicated routes now exist, but unavailable backends, legal copy, commerce/catalog data, and real public contact destinations remain explicit external/product gates.
