# WO-002 donor preflight — exact starting matrix

Date: 2026-09-30
Status: planning/preflight only. WO-002 implementation must not begin until WO-001 is accepted.

This document reconciles the earlier mobile-checkout availability audit with the subsequently recovered CP9/V13 donor evidence.

## Key clarification

The current TOADAL FEAST mobile-game checkout does **not** contain packaged copies of Wicked Bites or CLAW.

That does **not** mean those browser games are source-missing.

The recovered CP9/V13 donor contains qualified cartridge manifests whose exact source authorities still resolve in GitHub. Therefore WO-002 should start with **requalification/integration of Wicked Bites and CLAW**, not with rebuilding them from scratch.

## Candidate matrix

| Experience | Exact source authority | CP9 package evidence | Current website state | WO-002 next action |
|---|---|---|---|---|
| Wicked Bites | `Matthew75x/feast-crossing-wicked-bites` @ `6fff3c89605092ba5c5e122565cb98415c8ab5e5`; artifact blob `1433d67f17bf93c81fa4347402331999168a1fc8` | v5.5, single-file, 1,462,042 bytes, entry SHA-256 `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`; localhost + Netlify qualification PASS | PREVIEW until current-environment requalification | Reuse exact source, reseal through current cartridge/player contract, rerun current browser/player QA |
| CLAW: Feed Gulper | `Matthew75x/claw-feed-gulper` @ `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`; release tree `7a55e0e637790418e121f9c29c0ea3b420e7107c`; release-hashes blob `e7c8b8da8fd04e36ff455d91122cd59e5f1f03fc` | v2.5.1, 87 files, 16,618,931 bytes, entry SHA-256 `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`; Netlify qualification PASS | PREVIEW until current-environment requalification | Reuse exact release tree, preserve service-worker isolation on a dedicated/versioned origin, rerun current browser/player QA |
| TOADAL FEAST Arcade preview | current authoritative game checkout `arcade-standalone.html` donor | no sealed current cartridge yet; static closure already ~19.29 MiB and dynamic families expand beyond that | CANDIDATE | Deliberately seal one bounded preview profile; do not copy the full mobile asset tree |
| Tower Defense / Feast Defense | no current certified package established | CP9 route/visual donor only | PREVIEW | Locate real package/source authority before promotion |
| Froggy Fruity Bash | no current certified package established | CP9 route/visual donor only | PREVIEW | Locate real package/source authority before promotion |
| Lily Pad Leap | older donor marks prototype | no current certification | PROTOTYPE / PREVIEW | Locate current prototype authority and qualify |
| Dry Dock | no current implementation authority established | none | PLANNED | Do not fabricate a package |

## Wicked Bites source facts

CP9 manifest:
- cartridge id: `wicked-bites`
- standard: `toadal-web-cartridge-v2`
- version: 5.5
- source path: `dist/PLAY_FEAST_CROSSING_WICKED_BITES_V5_5_MOTION_JUICE.html`
- artifact kind: single-file
- artifact files: 1
- artifact bytes: 1,462,042
- entry SHA-256: `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- external network: none
- source maps: false
- parent navigation: false
- mobile viewport: true
- upstream browser assertions: 47
- upstream page errors: 0
- upstream console errors: 0
- CP9 qualification: PASS
- CP9 Netlify deployment qualification: PASS

WO-002 should treat this as a **real qualified donor**, not a design card.

## CLAW source facts

CP9 manifest:
- cartridge id: `feed-gulper`
- standard: `toadal-web-cartridge-v2`
- version: 2.5.1
- artifact kind: directory
- artifact files: 87
- artifact bytes: 16,618,931
- browser-measured initial bytes: 6,047,329
- entry SHA-256: `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`
- external network: none
- mobile viewport: true
- service worker: present
- service-worker policy: dedicated game origin
- upstream browser viewports: 5
- upstream clickable surfaces: 69
- upstream campaign certifications: 600
- upstream endless-soak actions: 50,000
- CP9 qualification: PASS
- CP9 Netlify deployment qualification: PASS

The service worker is the major integration consideration. Do not casually place CLAW at a site scope where its game-owned service worker could control unrelated TOADAL pages.

## Integration priority

Unless a new defect is discovered, the efficient order for WO-002 is:

1. build/reuse the shared Play hub and player shell;
2. requalify **Wicked Bites first** because it is the smallest/simplest existing qualified cartridge;
3. requalify **CLAW second**, preserving service-worker isolation;
4. then decide whether the bounded TOADAL FEAST Arcade preview adds enough value to justify sealing its larger dependency graph;
5. leave the other preview/planned games truthful until their real packages are located and certified.

This ordering reduces risk and should get the website to its first genuinely playable browser experience faster than starting with the much larger Arcade donor.

## Required requalification before PUBLIC

Historical CP9 PASS evidence is valuable donor evidence, but the new Studio/player environment still needs fresh proof.

For each candidate promoted PUBLIC:
- verify exact source commit/tree;
- build/seal current cartridge package;
- record exact file count, bytes and hashes;
- validate same-origin/allowed-origin policy;
- validate storage namespace isolation;
- validate postMessage contract;
- validate pause/resume and visibility behavior;
- validate fullscreen and exit;
- validate keyboard/touch where applicable;
- validate console/page/network errors;
- run desktop + mobile browser smoke;
- complete at least one real playable run;
- capture real screenshots from the current cartridge;
- preserve honest Home/Play state until this proof passes.

## Route compatibility

CP9 qualified player paths used:
- `/play/wicked-bites/game/`
- `/play/feed-gulper/game/`

The current route plan uses a dynamic player concept such as:
- `/play/:gameId/player/`

Do not silently break old qualified URLs. WO-002 should preserve `/game/` as a compatibility alias or intentionally keep the older canonical path.

## Boundary

This preflight does not:
- mark Wicked Bites or CLAW PUBLIC in the new site;
- authorize deployment;
- start WO-002 before WO-001 PASS;
- change the mobile-game repo;
- replace current product-truth gates.

Its purpose is to remove duplicate investigation and prevent the next work order from rebuilding already-qualified work.
