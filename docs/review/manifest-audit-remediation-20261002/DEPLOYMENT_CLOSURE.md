# Manifest audit remediation — staging closure

**Result: PASS — qualified staging only; owner visual acceptance remains pending.**

- Qualified/deployed commit: `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6`.
- Qualified tree: `1876ed5c4e51c8d99fb0563954d804b49436799a`.
- Source/evidence branch: `work/manifest-complete-v1-20261002`.
- Deployment branch: `staging/live-visual`, fast-forwarded from `688e1c471fdc97207c5ebfeaa0ef313ab9c44e52` to that exact qualified SHA.
- Main remains `87050885331770ca3e30db7e463154aebd777512`.
- Owner-preview URL: https://matthew75x.github.io/toadal-feast-web/
- GitHub Pages run: https://github.com/Matthew75x/toadal-feast-web/actions/runs/37011524073 — success, exact qualified `headSha`; deployment step succeeded 2026-10-02T13:13:39Z.

## Verified results

| Evidence | Result |
|---|---|
| Studio 1.4.2 validation/inspect/render/static export/verify checkpoint | PASS; 0 validation errors/warnings; 142 exported files |
| ai:doctor | PASS, 26 checks |
| Complete website Node suite | 99/99 PASS; 0 failed/skipped |
| Owner-preview gate | 16/16 PASS |
| Manifest gate | 19/19 PASS; shared full browser evidence below |
| Full rendered browser matrix | 83/83 PASS across 33 registered routes |
| Fresh visual captures | 13/13 PASS |
| Companion interaction checks | 17/17 PASS |
| Live route artifact/robots probes | 33/33 HTTP200; every response matches qualified artifact after CRLF normalization |
| Live JS/data/CSS/icon/cartridge/robots artifact probes | 10/10 HTTP200 and matching qualified bytes |
| Real unknown URL | HTTP404 with exact qualified branded404 response |
| Public browser smoke | Home heading; Characters/Gully319×319 decoded; App heading and approved icon256×256 decoded |

`gate` includes the complete matrix once; `manifest-gate` deliberately reuses those exact fingerprinted results. The legacy `integrated-node-48` step label runs 77 current targeted tests; the separate complete suite runs99. Neither count is inferred from a label.

Real browser interaction evidence additionally proves numeric/local persistence after a natural score1,953 game-over, strictly grouped score handling, idempotent artwork discovery, actual local badge/showcase, distinct route/artwork counters, and Pages-prefixed runtime links. No score was injected. See `runtime-browser-witnesses.json` and `REMEDIATION_SCOPE.md` for observed failures and their source-level corrections.

## Remaining honest boundaries

All buildable audit findings are closed. Approved content/publication and real external service/destination dependencies remain unavailable and visibly labelled: published stories/news/canon, legal/mission copy, community/catalog, App trailer/Infinite capture/store URLs, identity/global rankings/contact/moderation/commerce.

Home visual design and companion source are preserved. The four Studio dangling graph entries are individually explained component-discriminator false positives in `DANGLING_GRAPH_REFERENCES.md`, not broken runtime IDs. No `LOCK_VISUAL` acceptance is claimed. The supplemental Studio package suite was not rerun; previous zip/ImageMagick prerequisite gaps remain documented rather than concealed.

Only this task branch and the established GitHub Pages staging branch were pushed. No `main`, toadalfeast.com production, DNS, GitHub workflow, or cartridge/engine source change occurred. Generated Studio build/history remains ignored and untracked. This documentation-only follow-up updates the ledger to the immutable deployed site SHA; it does not deploy a different source/artifact tree.
