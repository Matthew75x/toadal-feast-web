# Interactive Discovery V1 — Qualification

Date: 2026-10-02

Repository branch: `work/interactive-discovery-v1-20261001`

Baseline: `fbcc41a7e5ac36ca8362f503557968090119e5f1`

Scope: local owner-preview qualification only. No Pages or production deployment.

## Implementation and asset authority

- The supplied asset archive was verified against its manifest: 59/59 source assets; archive SHA-256 `605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb`.
- The derivative ledger records 11 generated outputs, their input/output SHA-256 values, dimensions, and byte counts in `asset-ledger.json`. Raw source sheets/sequences and the archive are not shipped.
- Home interactions use the existing `discoveries` record under `toadal:web:v1:discoveries`; no standalone discovery localStorage key was added. Exactly three candy IDs are available; the third is gated behind one Golden Block with four deliberate hits. The existing UTC daily check-in grants its existing reward only once.
- Candy Shooter / Fruity Bash remains concept art, not a playable game. Wicked Bites and CLAW retain their existing package/launch truth. Golden Block ability art remains puzzle/mobile art, not Tower Defense art.
- The package audit verified all 11 ledger outputs in source and `dist`, matching hashes. It also checked Classic, Gully, Chomper, Princess Lily, and Fruity Bash reachability/authority; no definitely missing or accidentally unreachable material was identified. The obsolete hashed Studio alias for Genie was removed; the canonical Genie asset remains.

## Studio 1.4.2 workflow

Exact project manifest: `studio-project/toadal-feast-website/project.json`.

| Step | Result |
|---|---|
| `npm run validate` with exact `TOADAL_PROJECT` | PASS — valid, 0 errors, 0 warnings |
| `toadal.inspect(scope="workspace")` | PASS — 30 pages, 4 games, 51 assets, 42 components; 140 graph nodes / 88 edges |
| `toadal.render` | PASS — 125 files in the fresh Studio preview |
| `toadal.export(kind="static")` | PASS — 125-entry archive, 39,303,570 bytes; SHA-256 `05379df478bb7ca5fbed6a6cbf3e185b1664ca7d122d2c9ca940d806faeae064`; contains `index.html` (67,475 bytes) and `404.html` (44,368 bytes) |
| `toadal.checkpoint(mode="verify")` | PASS — validation passed and verify handoff was written |
| Canonical render to repository `dist/` | PASS — 125 files |
| GitHub Pages base-path transform | PASS — `/toadal-feast-web/`; 894 URLs rewritten; staging robots policy added |
| `npm run ai:doctor` | PASS — Studio 1.4.2, all reported checks successful |

Studio reported four dangling graph references. All are benign graph-classifier false positives in `pages/home.json`: each nested game card has `type: "game.card"`, but the graph builder treats every string beginning `game.` as a game reference. The actual `gameId` values resolve to existing game records:

1. Home game card 0: `game.wicked-bites`.
2. Home game card 1: `game.toadal-tower-defense`.
3. Home game card 2: `game.froggy-fruity-bash`.
4. Home game card 3: `game.claw-feed-gulper`.

No source or test was changed to suppress these reports; no gameplay reference is broken.

## Tests and browser evidence

- Required owner-preview gate: **PASS, 16/16 gate steps**. This includes the integrated **48-test Node suite**, Home visual contract, navigation truth, character registry, gated ecosystem, manifest, Search/Discovery, non-Home truth, visual-asset authority, non-Home layout closure, cartridge isolation, render freshness, Pages base path, static links, staging robots, and browser matrix.
- Full browser matrix: **77/77 PASS** over 30 routes; 0 failed cases. The matrix records 3 cases / 10 generic control-overlap diagnostic entries, but none are primary-control overlaps and they do not fail the gate. The diagnostics are the Home tablet “Public games 0” control and the Personality/History section links on the Toadal profile at desktop/mobile; no overflow, broken image, runtime, or primary-control failure was reported.
- Interactive Discovery browser qualification: **49/49 PASS**. It verifies 1440×900, 430×932, 390×844, and 320×800 layouts; mobile touch and keyboard operation; same-origin curated portal navigation and browser history; UTC daily-claim idempotency; exactly three persisted candies; one four-hit block; reduced motion; no additional progression key; no companion position/minimized-state mutation; and no browser/network/runtime errors.
- Focused progression tests: **20/20 PASS**. Visual asset authority: **PASS**, 76/76 visual files covered.
- Gate reports: `owner-preview-gate/owner-preview-gate.json` and `owner-preview-gate/browser-matrix.json`.
- Interaction report: `browser-qa/interactive-discovery-browser-qa.json`.

Screenshots:

- `browser-qa/screenshots/home-1440x900.png`
- `browser-qa/screenshots/home-430x932.png`
- `browser-qa/screenshots/home-390x844.png`
- `browser-qa/screenshots/home-320x800.png`
- `browser-qa/screenshots/home-blue-candy-found.png`
- `browser-qa/screenshots/home-golden-block-broken.png`
- `browser-qa/screenshots/home-three-candies-collected.png`
- `browser-qa/screenshots/home-portal-opening.png`

## Boundary and final status

Overall qualification: **PASS** for Interactive Discovery V1 owner preview. The site was not deployed; `main` and production were not modified. This result does not authorize a Pages/production release or an unrelated feature tranche.
