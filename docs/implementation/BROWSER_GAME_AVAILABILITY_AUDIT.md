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

## Current website integration status — WO-002 (2026-09-30)

The external CP9 evidence above remains historical evidence about the donor artifacts. It does not imply that each donor is integrated into this website. The current website deliberately exposes zero `PUBLIC` games; the four registered browser listings remain `PREVIEW`.

| Experience | Donor evidence | Website route/state | Current gate |
|---|---|---|---|
| Wicked Bites 5.5 | Qualified upstream donor; exact entry SHA preserved above | `/games/wicked-bites/` detail and `/player/wicked-bites/` isolated `PREVIEW` player | Session is sandboxed and has no persistent/account storage. Not `PUBLIC`. |
| CLAW: Feed Gulper 2.5.1 | Qualified upstream donor; this does not certify the website wrapper | `/games/claw-feed-gulper/` detail only; launch-held, with no player route or package shipped | Keep held pending origin/storage/service-worker requalification. |
| TOADAL Tower Defense | No runnable website cartridge | Informational concept listing/detail only | Not playable. |
| Froggy Fruity Bash | No runnable website cartridge | Informational concept listing/detail only | Not playable. |
| Lily Pad Leap / Feast Defense | Historical contract-ready/planned references only | No route or package in this WO-002 site | Requalify before future integration. |
| TOADAL FEAST Arcade | A current candidate exists in the mobile source; it is not a website package | No listing, player route, or package | Explicit WO-002 decision: keep it out of website scope until a separate bounded isolation/package audit is authorized. No launch date or URL is implied. |

The website Home and `/play/` route send users to the preview directory; only the Wicked Bites detail page exposes its isolated staging player. All store buttons remain disabled because no verified store destination is configured. No account/backend or Pages deployment was part of WO-002.

The player uses an opaque-origin iframe and a local compatibility adapter around the upstream donor UI. The donor attempts `localStorage`, but that storage is unavailable in the sandbox; its fallback is in-memory state. The cartridge record therefore declares `persistence: none`, and progress is cleared on reload/close. The host communicates visibility and uses pause/resume controls; it does not introduce account sync.

The retained WO-001 source archive, prior CP9 qualification, and external endpoint checks remain unchanged. For the actual WO-002 player/browser checks, route/export/screenshot results, and remaining limitations, see `docs/review/WO-002/WO-002_IMPLEMENTATION_EVIDENCE_2026-09-30.md` and the evidence images beside it.
