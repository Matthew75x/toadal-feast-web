# Browser Game Availability Audit — Current Evidence
**Updated:** 2026-09-30

## Source boundaries

### Mobile-game checkout
Inspected:
`C:\ASSIGNATOR\ChatGPT\Toadal-Feast-RC276`

The mobile repository does not contain the separate Wicked Bites / CLAW / Fruity Bash / Lily Pad Leap browser projects.

That is **not** evidence those browser projects do not exist. They are separate repositories/artifacts.

The mobile checkout remains the correct source for:
- flagship TOADAL FEAST runtime;
- Arcade standalone candidate;
- canonical game characters/assets.

### CP9/V13 website donor
Authoritative archive:
`TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`

SHA-256:
`ebbd2b7631268e39522a2f63eb7377ce2cd6571b86cb88947c597b0b1376e7a4`

Independent reconciliation confirms the archive contains the player/cartridge contracts, two deployed staging cartridge manifests, QA screenshots, and populated static build.

## Verified browser artifacts

### Wicked Bites
- source repo: `Matthew75x/feast-crossing-wicked-bites`
- source commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- cartridge: 5.5
- CP9 state: deployed / public staging preview
- artifact: 1 file / 1,462,042 bytes
- manifest SHA-256:
  `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- qualification: PASS
- deployment qualification: PASS

2026-09-30 recheck from ASSIGNATOR:
- HTTP 200
- downloaded bytes exactly 1,462,042
- downloaded SHA-256 exactly matches the CP9 manifest
- endpoint remains `noindex`

### CLAW: Feed Gulper
- source repo: `Matthew75x/claw-feed-gulper`
- source commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- cartridge: 2.5.1
- CP9 state: deployed / public staging preview
- artifact: 87 files / 16,618,931 bytes
- entry SHA-256:
  `77815f0652a9a0899ec426534f339d9c26fde9cf71c215c553f305a132d69701`
- qualification: PASS
- deployment qualification: PASS

2026-09-30 recheck from ASSIGNATOR:
- HTTP 200
- current index size 16,127 bytes
- current index SHA-256 exactly matches the CP9 manifest
- endpoint remains `noindex`

The full 87-file remote tree was not re-downloaded during this recheck; CP9's preserved qualification is still the authority for its full-tree audit.

## Other browser experiences

CP9 records:
- Lily Pad Leap — contract-ready / planned integration
- Froggie Fruity Bash — contract-ready / planned integration
- Feast Defense — contract-ready / planned adaptation
- TOADAL FEAST Arcade — contract-ready / planned integration

Current mobile source additionally confirms a real Arcade standalone runtime exists, so Arcade remains a strong current cartridge candidate after isolation/storage work.

## Current launch matrix

| Experience | Evidence state | Current Home launch state | Next gate |
|---|---|---|---|
| Wicked Bites | **QUALIFIED STAGING PREVIEW AVAILABLE** | withheld in WO-001 | integrate through current WO-002 player shell + compatibility smoke |
| CLAW: Feed Gulper | **QUALIFIED STAGING PREVIEW AVAILABLE** | withheld in WO-001 | integrate through current WO-002 player shell + compatibility smoke |
| Lily Pad Leap | contract-ready / planned integration | Preview | locate/re-qualify current source artifact |
| Froggie Fruity Bash | contract-ready / planned integration | Preview | qualify public edition |
| Feast Defense | contract-ready / planned adaptation | Preview | adaptation + qualification |
| TOADAL FEAST Arcade | current candidate | withheld | bounded cartridge isolation/package audit |

## Home implication

WO-001 should **not** directly launch Wicked Bites or CLAW until the current player shell/route is implemented and tested.

However, copy must no longer state that no real browser builds exist anywhere.

Truthful wording:
- qualified browser previews exist;
- current Home launch routing is withheld until WO-002 integration;
- the mobile app remains the flagship full experience.

This distinction preserves product truth without discarding real qualified work.

## WO-002 implication

WO-002 should not begin by searching the mobile repository for Wicked Bites or CLAW.

Begin with:
1. CP9 `toadal-web-player-v2` compatibility review;
2. current `toadal.game.v1` host contract;
3. Wicked Bites 5.5 integration;
4. CLAW 2.5.1 integration;
5. then the current TOADAL FEAST Arcade candidate.

See:
- `docs/review/WO-001/CP9_DONOR_RECONCILIATION_2026-09-30.md`
- `docs/implementation/WEB_GAME_EVIDENCE_LEDGER_2026-09-30.json`
