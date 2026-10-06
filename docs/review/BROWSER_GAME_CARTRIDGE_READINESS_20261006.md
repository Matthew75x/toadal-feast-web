# Browser game cartridge readiness — 2026-10-06

**Snapshot base:** `staging/live-visual` at `91be42c6090a703f674cf024add146d6d4a6089b`.

This is a read-only readiness audit. It does not promote, rebuild, rewrite, or install any game. CHL status is only assigned where the hardening standard and evidence support it.

## Executive disposition

| Game | Current website state | Verified cartridge posture | Next safe action |
|---|---|---|---|
| Croaker King Defense 2.0.0 | Not yet installed in website catalogue/player | **CHL-4 / QA-QUALIFIED PREVIEW candidate**. Dual website/TCS manifests recorded; trusted positive TCS, real-site host acceptance and physical-device gates remain. | Obtain trusted TCS qualification for the exact immutable bytes, then run CHL-5 website-player acceptance. |
| Wicked Bites 5.5 | Runnable website **PREVIEW** | Existing multi-file package is dependency-closed under package-wide hardener scanning. Current static result: **0 mandatory FAIL / 1 WARN** (documented storage fallback). No fresh CHL-4 assignment from this audit. | Create a tree-mode hardening profile with real gameplay evidence/project regressions; add TCS intake metadata only if Publisher/TCS admission is desired. |
| CLAW: Feed Gulper 2.5.1 | PREVIEW listing, launch held | Not eligible for website-player admission while shared-origin storage and upstream broad service-worker behavior remain unqualified. | Repair/isolate storage + service-worker behavior first, then restart from CHL-1/G1. |
| Froggy Fruity Bash | PREVIEW concept | **CHL-0 / no runnable cartridge package connected.** | Recover/author an actual runnable source package before cartridge hardening. |
| TOADAL Tower Defense | PREVIEW concept | **CHL-0 / no runnable cartridge package connected.** | Recover/author an actual runnable source package before cartridge hardening. |

## Wicked Bites focused audit

Website record:
- source repository: `Matthew75x/feast-crossing-wicked-bites`
- source ref: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- version: `5.5`
- entry SHA-256: `a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5`
- public state: `PREVIEW`
- website runtime files include `index.html` plus `toadal-bridge.js`; website `cartridge.json` is metadata and is excluded from the runtime payload hash.

The earlier single-file hardener falsely treated `toadal-bridge.js` as unresolved and could not see protocol behavior implemented in that bridge.

After adding explicit multi-file/tree scanning, the existing package produced:

- mandatory hardener failures: **0**
- warnings: **1**
- warning: `storage-runtime-mismatch` because the donor runtime contains browser-storage code while the website manifest declares `persistence: none`.

That warning is consistent with the existing website limitation: the donor uses local storage, while the opaque-origin website player forces the donor save layer into an in-memory/session-only fallback and does not account-sync it.

No Wicked Bites game bytes were changed by this audit.

## Protocol clarification

The canonical protocol list is vocabulary, not a requirement to fabricate controls.

Core lifecycle remains mandatory. The host shell owns route exit and fullscreen UI.

Conditional rules:
- `game:request-exit` is optional when the cartridge has no internal host-exit affordance.
- if `game:request-exit` is implemented, `host:exit-confirmed` must be accepted.
- `game:request-fullscreen` is optional when fullscreen is host-shell-only.
- if `game:request-fullscreen` is emitted, the website manifest must declare fullscreen support.

Wicked Bites has no internal host-exit control. Its Character Select buttons are internal game navigation, not website route exit. Therefore no dummy `game:request-exit` behavior is required.

## Hardener capability added by this audit

The hardener now supports two explicit runtime modes:

- `single`: one authored self-contained entry becomes runtime `index.html`;
- `tree`: an explicit source-owned runtime directory is copied as the cartridge payload.

Tree mode:
- requires the declared entry to resolve to the runtime root `index.html`;
- rejects symlinks;
- excludes source-only `.git`, `node_modules`, and `__pycache__` trees;
- preserves legitimate package-local bridge/script/style files;
- checks package-local HTML/CSS references without treating arbitrary JavaScript asset strings as guaranteed filesystem dependencies;
- scans protocol, storage, network, and dangerous-code signals across all runtime text files;
- keeps hardener-generated `cartridge.json`, integrity and evidence files authoritative rather than copying stale generated metadata.

Regression coverage after this change: **13/13 hardener self-tests PASS**, plus Python syntax compilation and clean `git diff --check`.

## Priority order

1. **Croaker trusted TCS gate** — highest release leverage; do not bypass the independent authority.
2. **Croaker CHL-5 website-player acceptance** after exact-byte TCS approval.
3. **Wicked Bites full tree-mode hardening profile/evidence** — likely the easiest second runnable cartridge to standardize.
4. **CLAW isolation remediation** — storage/service-worker first, cartridge qualification second.
5. **Fruity Bash / Tower Defense source recovery or implementation** — no value in pretending concepts are cartridges.

## Non-claims

This audit does not claim:
- Wicked Bites CHL-4;
- CLAW launch readiness;
- TCS qualification for any game other than whatever an independent trusted authority later signs;
- physical-device acceptance;
- PUBLIC status;
- account/cloud progression authority.
