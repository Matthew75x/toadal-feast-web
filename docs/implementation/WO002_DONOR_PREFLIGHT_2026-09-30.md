# WO-002 donor preflight — exact starting matrix

Date: 2026-09-30  
Status: ACTIVE evidence / integration preflight

WO-002 starts from accepted WO-001 commit:
`3e82fcd6990b92166769475aed3beffbec5b71f1`

## Recovered qualified donor packages

The previous staging preview URLs were still reachable and were downloaded again from their exact historical preview deployments.

### Wicked Bites 5.5

Qualified preview URL:
`https://6abaf01a1add5a24ea0bffbd--toadal-wicked-cartridge-preview.netlify.app/v/5.5/index.html`

Recovered exact runtime:
- files: 1
- bytes: 1,462,042
- index SHA-256: `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- exact match to CP9/V13 cartridge evidence: YES
- source authority: `Matthew75x/feast-crossing-wicked-bites@6fff3c89605092ba5c5e122565cb98415c8ab5e5`

Important: the raw repository HTML at that source commit is not byte-identical to the qualified deployed artifact. WO-002 therefore imports the **exact qualified hosted runtime**, while retaining the source commit as provenance.

### CLAW: Feed Gulper 2.5.1

Qualified preview root:
`https://6abb0b5698d4e49a8a2b5d05--toadal-claw-cartridge-preview.netlify.app/v/2.5.1/`

Recovered exact runtime:
- service-worker precache paths downloaded: 83
- total web-runtime files including `sw.js`: 84
- total web-runtime bytes: 16,615,206
- index bytes: 16,127
- index SHA-256: `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`
- service-worker SHA-256: `fb4b224cda4de0016c260b578882a3eb45d7a77086d68200ef87d7ee679ceadc`
- all service-worker precache targets downloaded successfully: YES
- source authority: `Matthew75x/claw-feed-gulper@7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- release tree: `7a55e0e637790418e121f9c29c0ea3b420e7107c`

Three source-only release helpers are intentionally not part of the website cartridge:
- `PLAYER_SERVER.ps1`
- `START_CLAW.cmd`
- `build-manifest.json`

The qualified runtime service worker registers as `./sw.js`. It must remain scoped to the CLAW cartridge directory and never control the wider TOADAL website.

## Current Studio intake state

Imported under:
- `studio-project/toadal-feast-website/public/games/wicked-bites/`
- `studio-project/toadal-feast-website/public/games/claw-feed-gulper/`

Both cartridge manifests remain:
`publicState: PREVIEW`

This is deliberate.

Historical deployment qualification proves the donors are real and working. It does **not** automatically prove the new Studio player host/bridge.

Current host-bridge state:
`PENDING_CURRENT_PLAYER_ADAPTER`

No public launch CTA may be enabled until current player/browser qualification passes.

## Storage compatibility

The exact donors retain their established save keys:

Wicked Bites:
`toadalFeast.wickedBites.standalone.v4`

CLAW:
`toadal.claw.feed-gulper.v7`

These are unique and do not collide with the website-owned `toadal:web:v1:` namespace.

They do not follow the preferred new `toadal:game:<game-id>:v1:` convention. Changing the keys would mutate the qualified games and would require an unnecessary save migration/requalification. Treat the legacy namespaces as a documented compatibility exception unless an actual collision is found.

## Current route architecture

Published:
- `/play/`
- `/play/wicked-bites/`
- `/play/claw-feed-gulper/`

Prepared but not indexed/public:
- `/play/wicked-bites/player/`
- `/play/claw-feed-gulper/player/`

The detail pages intentionally keep Play disabled until bridge certification.

## Current host shell

The draft browser-player shell now includes:
- same-origin sandboxed iframe
- explicit allowed iframe permissions
- exit
- retry
- fullscreen
- sound-state plumbing
- host init
- pause/resume
- visibility messages
- source/origin validation for cartridge messages
- current `toadal.game` v1 message envelope
- legacy `toadal-web-player-v2` receive/send compatibility where practical
- recoverable error UI
- responsive player layout

The host shell exists before publication so it can be tested without exposing a fake launch path.

## Recommended qualification order

1. Wicked Bites first: smallest exact runtime, no service worker, simplest isolation profile.
2. CLAW second: validate dedicated cartridge service-worker scope and full 84-file runtime.
3. Decide after those whether the larger TOADAL FEAST Arcade preview adds enough launch value to justify its separate isolation/package pass.
4. Keep Tower Defense, Fruity Bash, Lily Pad Leap, Dry Dock truthful until their current runnable authority is established.

## Evidence files

- `docs/review/WO-002/cartridge-intake/intake-evidence.json`
- `docs/review/WO-002/cartridge-intake/wicked-bites.sha256`
- `docs/review/WO-002/cartridge-intake/claw-feed-gulper.sha256`
- `docs/review/WO-002/donor-art-candidates/`

## Boundary

This intake does not yet mark either cartridge PUBLIC.

Promotion requires fresh current-environment proof for:
- cartridge manifest/schema
- host bridge
- ready/start/complete/error handling
- pause/resume/visibility
- fullscreen
- exit/retry
- storage behavior
- console/page/network errors
- mobile + desktop browser smoke
- at least one real playable run
