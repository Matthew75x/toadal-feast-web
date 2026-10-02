# Manifest audit remediation — 2026-10-02

## Scope and authority

Continuation from clean `work/manifest-complete-v1-20261002`, commit `60c4d8bee7edd818fcc794e3f87232058585b9d8`, tree `152294e80804ef7b065bdca2911c4f404f84fe80`. The then-live staging baseline was `688e1c471fdc97207c5ebfeaa0ef313ab9c44e52`. Scope is the 30-family authoritative `docs/authority/sources/mockups/PAGE_MANIFEST.md`, product rules and the user's manifest-completion mission. Reuse-first functional and structural fixes only; no redesign, new cartridge, connected service, invented lore, or production work.

## Findings closed

1. **Dead Player score HUD:** Studio host/HUD are sibling components. Added explicit host-to-HUD ID association and resolved progression storage from that HUD, keeping opaque-origin iframe identity/protocol checks.
2. **Lost all-time best after 50 runs:** preserve a valid stored all-time best beyond bounded recent history. Best values below retained results remain invalid/read-only; corrupt and future data remain preserved.
3. **Broken dynamically generated Pages links:** prefix local quest and profile score links using the authored site-brand base. Root hosting, existing prefixes, queries and fragments remain supported.
4. **Missing template structure:** news featured/latest/trending, article quote/related links, Roadmap related devlogs, App icon/trailer, profile identity/title/discoveries/achievements/showcase, Community feed/guidelines, Store update CTAs, About mission/philosophy, Legal last-updated slot. Empty states remain truthful. Published editorial projection now allowlists public fields and excludes draft/private relations.
5. **Incomplete character discovery:** seven approved artwork-view controls use the existing discoveries key; no XP, Sparks, Treats, canon completion or game ownership is granted. Profile separates artwork records from route/Treat records.
6. **App icon audit correction:** located the exact approved original in Downloads and imported a verified optimized app-only derivative. See `APP_ICON_PROVENANCE.md`; no new artwork or wordmark substitute.
7. **Stale completion evidence:** gates now fingerprint source and generated artifacts before/after, and freshness checks authored sections plus exported runtimes. Ledger qualification requires matching green gate and real browser evidence; old snapshots are explicitly historical.

## Additional integration defects found by real browser use

- A new run retained the previous saved-result message: corrected at `game:started`, with regression coverage.
- Profile's route-visit number included artwork discovery: derived route classification and a dedicated route counter now distinguish them.
- A real natural run finished at **1,489**, but the adapter froze at **980** because the unchanged cartridge bridge reads comma-formatted `wbScore` text. Website normalization now accepts only correctly grouped integer strings (e.g. `1,489`) and strict safe integers. Malformed grouping, negatives, fractional/unsafe values and untrusted sources remain rejected. The old unit expectation that rejected canonical `1,234` was corrected to the demonstrated cartridge contract, with more malformed-input and end-to-end persistence assertions; tests were not skipped. Cartridge bytes remain unchanged.

## Qualification boundaries

Required Node suite, Studio flow, owner-preview gate, manifest gates, full browser matrix, real runtime witnesses and fresh screenshots are recorded in sibling evidence files. The manifest gate reuses the owner gate's complete browser matrix rather than running it twice. No generated build/history or full-size owner icon master is tracked.

Prior supplemental Studio package-suite missing zip/ImageMagick prerequisites are historical toolchain evidence, not a website release-gate exemption. The package suite was not rerun in this bounded website repair; Studio source/tests were not modified.

Home source and generated Home HTML are byte-equivalent to the pre-remediation Git blobs; default composition and companion behavior are preserved. Home `LOCK_VISUAL` acceptance remains owner review, not engineering acceptance. Remaining publication/service gaps are approved external content, official destinations, identity/commerce/contact services and policy/canon approvals, not falsely connected features.

The qualified site commit and later documentation-only deployment commit are intentionally distinct so the ledger can name the exact immutable deployed SHA without a self-referential commit claim. Staging publication is conditional on every required result being green; `main`, production and DNS are excluded.
