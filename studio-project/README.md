# TOADAL FEAST Studio project
> Historical WO-001 project note, preserved below. Current source is the same Studio project on `staging/live-visual`; the accepted SHA, deployed routes, source/asset authority and known gaps are in [the authority index](../docs/authority/WEB_PRODUCT_AUTHORITY.md). The old BLOCKED and no-deployment statements are superseded operational history.


This is the fresh `generic-site` project created for WO-001 with certified TOADAL Studio 1.4.2. The manifest is `toadal-feast-website/project.json`; Studio must receive its absolute path through `TOADAL_PROJECT`.

## Structure

- `collections/site.json` and `collections/navigation.json` configure the shared global shell: the visitor-facing identity, header links, and footer links. Studio renders the shared header, route shell, main landmark, and footer for both Home and 404.
- `pages/home.json` keeps the Home as separate Studio component records: skip link, hero, discovery intro, data-driven game grid, Feast Pass, Today, character/world/media discovery, app conversion, What's Next, and companion. It is not a single page-sized HTML blob.
- Browser-game cards are nested `game.card` components using `symbol.home.game-card`, with their state and canonical art in `games/*.json`. The four listed entries are preview-only; the Arcade candidate is not in the public game index.
- `collections/symbols.json` supplies reusable button and browser-card symbols. The global header/footer are configured by Studio's site shell; other shared visual treatments are token-backed CSS patterns, not separate Studio symbols yet. `collections/advanced-code.json` provides responsive navigation, filter behavior, and contextual companion state.
- `project.json` uses the canonical Toadal portrait asset as the site favicon, so the static export has an explicit icon URL.

## Public-truth boundaries

The browser-game concepts remain `PREVIEW` without launch links. Search and app-store actions are visibly disabled until real capabilities/destinations exist. Feast Pass is shown as planned without fabricated progress or rewards, consistent with `docs/implementation/PUBLIC_FEATURE_STATE.json`; this deliberately does not satisfy WO-001's guest-local summary requirement because that central gate currently says `PUBLIC_AFTER_WO005`. Arcade remains an audit-required candidate. No support/legal/contact destination was supplied as an approved live URL, so none is invented in the footer.

## Review disposition

WO-001 is **BLOCKED**, not accepted. The certified Studio render/export and responsive/browser checks pass, but the CP9/V13 donor source and original approved Home visual package are not available for the required salvage and visual-authority comparisons. The pre-Studio screenshot retained under `docs/review/WO-001/pre-studio/` is context only. See `docs/review/WO-001/QA_REPORT.md` for the evidence and remaining authority conflicts.

## Generated output

Studio's `build/`, `.studio-history/`, and `.history/` data are generated workspace state and are not committed. `dist/` is not replaced during WO-001; deployment remains out of scope. Acceptance evidence is kept under `docs/review/WO-001/`.
