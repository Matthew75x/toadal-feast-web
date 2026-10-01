# Non-Home Truth Closure — 2026-10-01

## Result

**PASS — source-level non-Home truth reconciliation is complete for the current integrated website candidate.**

This lane intentionally excludes Home visual/content changes so it does not collide with the active owner-preview visual convergence work.

## Provenance

- Starting branch: `origin/parallel/owner-preview-support-20261001`
- Starting commit: `a512ea18256014a0f53c203673a7a84587fd02fe`
- New branch: `parallel/nonhome-truth-closure-20261001`
- Integrated ancestor: `ce5aceb251ac6b612fcace7baa6ea63032ca93a7`

The starting point already included the post-convergence 404/Search recovery correction and the Characters guest-progression wording correction.

## Additional stale truth fixed

### Toadal profile / Collectibles

Old copy claimed the guest collection was "coming later", that collectible state "will connect" to browser-local progression, and referred to the progression system as if it did not exist.

Current truth:
- browser-local guest progression already exists;
- character-specific collectible records are not configured;
- no unlock count or entitlement is fabricated.

### News / Stories

Old News copy described story updates generically as "unavailable" and said a story archive had not been made available, which could imply the Stories/Manga/Reader surfaces themselves were absent.

Current truth:
- Stories, Manga, and Reader preview surfaces exist;
- no dated story-news feed or public publishing schedule exists.

### Media

Old companion copy said the selected art previews were "not a published media library", which was unnecessarily ambiguous on the Media route itself.

Current truth:
- canonical art previews are published for site discovery;
- there is no downloadable press/media library or usage-license offering.

## Regression guard

Added:

`scripts/verify-nonhome-truth.mjs`

The verifier:
- scans all 29 registered non-Home routes;
- checks 10 current capability routes;
- rejects 15 known stale-claim patterns;
- verifies Search is active/local-only;
- verifies the 48-entry local search index exists;
- verifies Support acknowledges current guest-local progression;
- verifies Account preserves the no-account/no-sync boundary while acknowledging local progress;
- verifies Profile and Feast Pass live progression hooks;
- verifies Characters exposes the Toadal profile and current progression truth;
- verifies Stories -> Manga -> Reader route relationships;
- preserves the truthful zero-published-chapter state;
- verifies 404 recovery includes Search;
- verifies the guest-progression storage/rendering contract remains present.

The verifier was also run against the older `ce5aceb...` candidate and correctly failed on its stale 404/Search and Characters progression claims, demonstrating that the guard catches the regression class it is intended to prevent.

## Qualification

- Integrated Node suite: **48/48 PASS**
- Home visual contract: **29/29 PASS** (Home unchanged by this lane)
- Navigation truth: **PASS**
- Character registry: **PASS**
- Gated ecosystem: **PASS**
- Manifest compliance: **PASS**
- Search/Discovery: **PASS**
- Non-Home truth verifier: **PASS**
  - 30 registered routes
  - 29 non-Home routes scanned
  - 10 current capability routes checked
  - 15 stale-claim patterns checked
  - 48 local search records observed
- `git diff --check`: **PASS**

## Deliberate boundaries

- `pages/home.json` is untouched.
- Home CSS is untouched.
- No generated `dist/` files are edited by hand.
- No staging or production deployment occurs from this lane.
- No new product capability is invented.
- Missing account sync, public support endpoint, approved legal copy, store destinations, published story chapters, public news posts, community backend, and downloadable media/press library remain truthfully absent.

## Integration handoff

This branch is a small donor for the active owner-preview candidate. Bring its commit forward after/alongside the Home visual pass, then perform the authoritative Studio 1.4.2 render and normal staging qualification.

The non-Home truth-reconciliation work itself is closed.
