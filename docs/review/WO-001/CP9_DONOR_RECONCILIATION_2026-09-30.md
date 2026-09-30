# WO-001 — CP9/V13 Donor Reconciliation
**Date:** 2026-09-30  
**Disposition:** donor authority independently reproduced; safe salvage requirements identified.

## Archive identity

Authoritative donor archive independently inspected:

`TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`

SHA-256:

`ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`

This exactly matches the previously recorded CP9/V13 audit hash.

The archive contains every previously required witness:
- `CHECKPOINT_IX_REPORT.md`
- `src/scripts/optimal.js`
- `src/scripts/cartridge-host.js`
- `src/data/player-contract.json`
- `src/data/cartridge-standard.json`
- `src/data/web-games.json`
- `src/styles/components.css`
- `src/styles/pages.css`
- `src/styles/optimal.css`
- Wicked Bites cartridge manifest
- CLAW: Feed Gulper cartridge manifest
- Home desktop/mobile screenshots
- Play desktop/mobile screenshots
- populated `dist/` (234 files)

Therefore the earlier ASSIGNATOR-local failure to locate the archive was an environment/path availability issue, not missing donor evidence.

## What CP9 actually proves

Checkpoint IX states:
- replacement candidate, not production replacement;
- source/release tests 32/32 PASS;
- two free browser games playable in staging;
- no account required for those free games;
- four additional web experiences planned/in development;
- installed app remains the full TOADAL FEAST experience;
- public-facing cartridge/operator jargon was intentionally removed;
- no production promotion occurred.

## Browser cartridge evidence

### Wicked Bites
Source:
`Matthew75x/feast-crossing-wicked-bites`

Commit:
`6fff3c89605092ba5c5e122565cb98415c8ab5e5`

Repository/commit existence independently verified.

CP9 cartridge:
- version 5.5
- access tier: public
- state: deployed
- artifact: one HTML file
- artifact bytes: 1,462,042
- entry SHA-256:
  `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- qualification: PASS
- deployment qualification: PASS

Current endpoint rechecked from ASSIGNATOR on 2026-09-30:
- HTTP 200
- Content-Length 1,462,042
- downloaded SHA-256 exactly matches the CP9 manifest

### CLAW: Feed Gulper
Source:
`Matthew75x/claw-feed-gulper`

Commit:
`7c49d1bf70ebf6503fde3b533a1acd356d12c77c`

Repository/commit existence independently verified.

CP9 cartridge:
- version 2.5.1
- access tier: public
- state: deployed
- artifact: directory
- total bytes: 16,618,931
- 87 files
- index SHA-256:
  `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`
- qualification: PASS
- deployment qualification: PASS

Current endpoint rechecked from ASSIGNATOR on 2026-09-30:
- HTTP 200
- current index Content-Length 16,127
- downloaded index SHA-256 exactly matches the CP9 manifest

The full 87-file remote tree was not re-downloaded in this reconciliation pass; CP9's preserved qualification evidence remains the authority for its full-tree verification.

## CP9 web-game catalog truth

`src/data/web-games.json` records:

- Wicked Bites — deployed staging cartridge, free/public
- CLAW: Feed Gulper — deployed staging cartridge, free/public
- Lily Pad Leap — contract-ready / planned integration
- Froggie Fruity Bash — contract-ready / planned integration
- Feast Defense — contract-ready / planned adaptation
- TOADAL FEAST Arcade — contract-ready / planned integration

This supersedes the earlier inference that Wicked Bites and CLAW had no real runnable web package merely because the mobile-game checkout did not contain them.

The browser side-games are separate projects and should not be searched for only inside the mobile-game repository.

## Salvage requirements

### KEEP / adapt
1. **Sandboxed iframe player boundary**
   - parent owns navigation/fullscreen/mute/how-to/access
   - game owns simulation/rendering/game input/local save

2. **Origin + message validation**
   CP9 validates origin, source window and an allowlisted message type before acting.

3. **Pause/resume bridge**
   Host sends pause/resume on visibility/page lifecycle.

4. **Fullscreen ownership**
   Website shell owns fullscreen instead of letting cartridges manipulate parent UI.

5. **Save separation**
   Distinct browser-local game namespaces; no claim of native/mobile save continuity.

6. **Artifact provenance**
   Source repo/commit/tree/blob/hash/package-size/qualification stay in operator metadata, not visitor copy.

7. **Immutable/versioned game delivery**
   Large games can stay outside the core website bundle.

8. **Time/bytes-to-playable measurement**
   Package size alone is not a global rejection rule.

9. **Player-facing language**
   Public pages say Play / Preview / Coming Soon rather than exposing engineering jargon.

### MERGE with current architecture
- CP9's `toadal-web-player-v2` concepts should inform the new `toadal.game.v1` cartridge contract rather than being discarded.
- Keep compatibility aliases/adapters where cheap; avoid forcing already-qualified cartridges to rewrite before website integration.
- Current route/template system remains the site authority.
- Current canonical mascot/brand assets override donor character art when they conflict.

### RETIRE / do not restore
- CP9's four-mode flagship web-console emphasis as the primary website product.
- old Passport naming where current product authority says Feast Pass.
- any generated/generic mascot treatment that differs from canonical Toadal.
- internal operator phrases on public surfaces.
- production launch assumptions from the old candidate.

## WO-001 implication

The donor-integrity blocker is now **resolved as evidence**.

The current WO-001 Home does not need to copy CP9 `dist/` or player code wholesale. It must simply avoid destroying these proven capabilities and carry their contracts forward into WO-002.

## WO-002 implication

WO-002 no longer starts from zero.

Its first two cartridge candidates are:
1. Wicked Bites 5.5 — qualified/deployed staging artifact
2. CLAW: Feed Gulper 2.5.1 — qualified/deployed staging artifact

They should be integrated through the current player-shell contract with compatibility/adaptation tests before any new browser game is implemented.
