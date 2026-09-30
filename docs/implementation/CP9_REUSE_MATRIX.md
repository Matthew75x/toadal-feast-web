# CP9 / V13 Reuse Matrix

Date: 2026-09-30  
Purpose: prevent the certified Studio rebuild from discarding already-qualified website behavior.

The exact donor is pinned by `CP9_DONOR_MANIFEST.json` and can be verified with:

`node scripts/verify-cp9-donor.mjs .`

## Decision rule

- **REUSE**: port the proven behavior or contract with minimal architectural adaptation.
- **ADAPT**: preserve the user-facing behavior but implement it through current Studio 1.4.2 structures.
- **REFERENCE**: use as regression/visual evidence, not as code authority.
- **REQUALIFY**: donor artifact already worked, but must pass current-environment qualification before PUBLIC state.

| Capability | CP9 evidence | Current direction | Action |
|---|---|---|---|
| Home visual hierarchy | CP9 desktop/mobile captures + Checkpoint IX | Documented approved visual direction; original PNGs unavailable, so no pixel-parity claim | REFERENCE + ADAPT; manual visual review is the acceptance basis |
| Desktop search field | `src/styles/components.css` search-wrap/search-box | Current Studio Home retains a visible, accessible, truthfully disabled field | ADAPT; keep the field treatment, never imply live search |
| Living/context guide | `src/scripts/optimal.js`, guide assets | Current contextual Toadal uses pointer/focus messages | REUSE behavior ideas; keep current canonical Toadal |
| Public-copy cleanup | Checkpoint IX jargon scan | Public pages must stay player-facing | REUSE rule |
| Play hub | CP9 `/play/` + `src/data/web-games.json` | WO-002 Play family | ADAPT, do not restart from blank |
| Player shell | `src/scripts/cartridge-host.js`, player contract v2 | WO-002 sandboxed iframe host | REUSE contract + ADAPT shell |
| Fullscreen | Parent-owned fullscreen in player contract + host implementation | WO-002 fullscreen requirement | REUSE |
| Pause/resume bridge | `host.pause` / `host.resume` | WO-002 visibility protocol | REUSE |
| Message validation | allowed game/host message set | WO-002 postMessage protocol | REUSE + harden |
| Wicked Bites | v5.5 manifest, local + Netlify qualification PASS | currently shown Preview in new Home | REQUALIFY; do not rebuild |
| CLAW: Feed Gulper | v2.5.1 manifest, Netlify qualification PASS | currently shown Preview in new Home | REQUALIFY; do not rebuild |
| Feast Defense | CP9 staging slot and public-facing copy | Preview/Planned until real package is certified | REFERENCE / locate donor |
| Fruity Bash | CP9 staging slot | Preview/Planned until certified | REFERENCE / locate donor |
| Lily Pad Leap | CP9 staging slot | Preview/Planned until certified | REFERENCE / locate donor |
| TOADAL FEAST Arcade | CP9 slot + separate current donor audit | bounded browser preview | ADAPT / REQUALIFY |
| Guest progression | CP9 Explorer/Passport concepts | WO-001 planned summary only; actual guest-local progress is gated to WO-005 | ADAPT the concept only; do not copy progression state or claims |
| App funnel | CP9 web-is-playground/app-is-full-feast | current strong app conversion | REUSE message hierarchy |
| Support/legal funnel | CP9 support/status/privacy surfaces | later utility routes | REUSE structure where compatible |
| QA baseline | 11,687 staging checks; 11,014 production-shaped checks | current WO QA | REFERENCE; do not relabel as current |

## Specific source anchors

- `src/scripts/cartridge-host.js`: sandboxed player host, origin-aware postMessage, pause/resume, fullscreen and exit.
- `src/data/player-contract.json`: parent/game ownership and message contract.
- `src/data/cartridge-standard.json`: cartridge packaging, isolation and qualification rules.
- `src/scripts/optimal.js`: living-guide behavior and section-aware contextual state.
- `src/styles/components.css`: desktop search-field treatment.
- `cartridges/wicked-bites/manifest.json`: qualified Wicked Bites v5.5 donor identity.
- `cartridges/feed-gulper/manifest.json`: qualified CLAW v2.5.1 donor identity.
## Non-goals

This matrix does **not** authorize:
- copying CP9 `dist/` wholesale into Studio;
- marking a donor game PUBLIC without current requalification;
- reviving retired assets or obsolete product truth;
- overwriting the approved Home visual direction with the old donor;
- changing production DNS or deploying the replacement site.

The objective is salvage without regression: keep what was already good, rebuild only what genuinely needs rebuilding.
