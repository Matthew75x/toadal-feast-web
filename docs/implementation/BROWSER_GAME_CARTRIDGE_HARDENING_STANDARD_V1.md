# TOADAL Browser Game Cartridge Hardening Standard v1

**Status:** reusable operational standard for converting a browser game into a TOADAL FEAST website cartridge.

This standard sits on top of the existing [Browser Game Cartridge Contract](BROWSER_GAME_CARTRIDGE_CONTRACT.md). It does not weaken that contract. It turns the contract into a repeatable intake, hardening, evidence, packaging, and release-gating process.

## 1. Why this exists

A game can be playable without being safe to embed in the website. Cartridge hardening answers a different question:

> Can this exact game build be packaged as a self-contained, isolated, lifecycle-safe, evidence-backed website cartridge without lying about its readiness?

The hardener is deliberately **fail-closed**. A numeric score never overrides a failed mandatory gate.

## 2. Cartridge Hardening Levels (CHL)

| Level | Name | Meaning |
|---|---|---|
| CHL-0 | RAW | Playable/source exists, no cartridge qualification. |
| CHL-1 | CLOSED | Runnable static package exists and dependency closure is proven. |
| CHL-2 | ISOLATED | Storage namespace, no forbidden network dependency, iframe assumptions, and package boundaries pass. |
| CHL-3 | HOST-SAFE | `toadal.game.v1` handshake/lifecycle passes in the cartridge host harness. |
| CHL-4 | QA-QUALIFIED | Desktop/mobile input, lifecycle, game regressions, browser console, packaging and real-build evidence pass. **Eligible for PREVIEW candidate.** |
| CHL-5 | SITE-ACCEPTED | The exact package passes the real TOADAL website player/iframe lifecycle. |
| CHL-6 | PUBLIC-ADMISSIBLE | Physical-device acceptance and any product-specific release gates pass. **Eligible for PUBLIC decision.** |

CHL is monotonic only for a **specific immutable runtime ledger hash**. Any runtime-affecting change invalidates downstream levels until requalified.

## 3. Mandatory gates

### G0 — Identity and authority
- Stable game/cartridge ID.
- Display name and version.
- Exact source/ref or honest local-build provenance.
- Entry source SHA-256.
- Public state begins fail-closed (`PREVIEW` unless already qualified farther).

### G1 — Dependency closure
- `index.html` exists and runs as a static package.
- All required runtime dependencies are package-local or embedded.
- No unresolved relative/absolute asset references.
- No required external CDN/API/network dependency unless the cartridge contract explicitly permits it.
- Runtime file/byte count and deterministic ledger hash recorded.

### G2 — Isolation and persistence
- Storage uses `toadal:game:<game-id>:v1:` (mode subkeys are allowed beneath it).
- No website-owned `toadal:web:v1:` mutation.
- No silent reuse of native/mobile save keys.
- No `document.domain` or website-DOM coupling.
- Unknown cross-window messages are ignored.
- Opaque/sandboxed iframe operation is supported.

### G3 — Host lifecycle
Required protocol: `toadal.game.v1`.

Core cartridge → host:
`game:ready`, `game:started`, `game:paused`, `game:resumed`, `game:score`, `game:complete`, `game:error`.

Core host → cartridge:
`host:init`, `host:pause`, `host:resume`, `host:mute`, `host:unmute`, `host:visibility`.

Conditional request vocabulary:
- `game:request-exit` is optional unless the cartridge exposes its own host-exit affordance; when implemented, `host:exit-confirmed` is required.
- `game:request-fullscreen` is optional when fullscreen is host-shell-only; if emitted, the manifest must declare fullscreen support.

Required behaviors:
- Validate parent/source/origin as applicable.
- Hidden/background pauses gameplay.
- Visible alone is not an implicit resume gesture.
- Completion is idempotent.
- Exit/fullscreen remain host-owned.
- Loading failure is recoverable; never strand a blank iframe.

### G4 — Gameplay/input regression
- Existing game-specific tests still pass after cartridge adaptation.
- Mouse/touch/keyboard paths promised in the manifest are exercised.
- Pause/settings/background/focus races are exercised.
- Restart/terminal-state behavior is deterministic/idempotent where applicable.
- Multi-mode cartridges prove mode teardown and no cross-mode control/timer/audio leakage.

### G5 — Presentation/accessibility
- Real-build poster/screenshot only.
- Target desktop, portrait mobile and compact landscape are visually checked.
- No important controls under browser chrome/safe areas.
- Focus can escape; controls are keyboard reachable.
- Reduced-motion behavior retains essential gameplay warnings.

### G6 — Performance and boundedness
- No unbounded entity/effect creation.
- Dense/boss/special phases are exercised.
- Static scenes do not wastefully redraw where avoidable.
- Constrained-device performance is measured before PUBLIC qualification.

### G7 — Evidence and package
- `cartridge.json` validates against schema v1.
- Package ledger/hash is recorded.
- Hardening report records PASS/WARN/FAIL with exact limitations.
- ZIP integrity passes.
- The exact runtime ledger hash is the unit promoted to later gates.
- Archive construction SHOULD be deterministic so repeated packaging of unchanged bytes does not produce false drift.

### G8 — Real website and device admission
- Exact package installed in the real TOADAL website player.
- Enter/start/pause/resume/mute/visibility/fullscreen/exit/retry and stale-message rejection pass.
- Physical-device acceptance passes.
- Only then may product/release authority consider `PUBLIC`.

## 4. Automated hardening vs external acceptance

The repository tool under `scripts/cartridge-hardener/` can automate G0–G3 static portions, package construction, manifest/schema validation, evidence conversion, project regression commands, integrity hashing, and a virtual-origin host harness. It cannot honestly replace:

- real TOADAL website-host acceptance;
- physical-device performance/UX acceptance;
- owner product approval;
- store/publisher/TCS gates outside the browser-cartridge contract.

Those remain explicit external gates.

## 5. Intake profile

Each game supplies a small JSON profile containing identity, entry point, capabilities, storage, provenance, known limitations, evidence images, and project-specific regression commands. This is the only game-specific configuration required by the generic hardener.

Runtime packaging modes:
- `single` (default): one self-contained authored entry is copied to runtime `index.html`;
- `tree`: an explicit source-owned runtime directory is copied byte-for-byte (except hardener-generated metadata/evidence names) and package-wide protocol/reference checks are applied.

Tree mode exists for legitimate multi-file cartridges such as an authored `index.html` plus compatibility bridge/scripts/styles. It must not be used to copy whole repositories, `.git`, `node_modules`, or source-only directories.

## 6. Standard output

For `<game-id>`, a successful hardening run creates:

```
<output>/
  public/games/<game-id>/
    index.html
    [package-local runtime files/directories]
    cartridge.json
    poster.webp
    screenshot.webp
    cartridge.integrity.json
  HARDENING_REPORT.json
  HARDENING_REPORT.md
  profile.json
  <game-id>-cartridge.zip
```

The runtime `package.sha256` is SHA-256 of a sorted `path<TAB>sha256` ledger over runtime payload files, excluding `cartridge.json` and the integrity file to avoid self-reference. The integrity file records every runtime payload hash.

When a game also enters the Publisher/TCS admission path, the hardener may emit a separate root `tcs1.json`. Website `cartridge.json` and TCS `tcs1.json` are different contracts: both remain immutable payload, both identities must agree, and generation of `tcs1.json` is **not** TCS qualification. TCS bridge/runtime/security gates and trusted positive authority remain external.

## 7. Promotion rule

- CHL-0–3: not ready for website preview admission.
- CHL-4: **PREVIEW candidate**; package can proceed to real-site acceptance.
- CHL-5: site-accepted PREVIEW; physical/device/release gates remain.
- CHL-6: technically PUBLIC-admissible, subject to owner/release authority.

A prior PASS never transfers to changed bytes automatically.

## 8. Relationship to existing tooling

`scripts/audit-cartridge-source.mjs` remains a useful lightweight source-closure audit. The hardener is the stronger profile-driven qualification and packaging lane; neither tool substitutes for the real site/player or device gates.

## 9. Optional website-hosted audio extension

Shared audio is an **opt-in extension of this hardening path**, not another cartridge pipeline. The authoritative contract is [WEBSITE_SHARED_AUDIO_RUNTIME_V1.md](WEBSITE_SHARED_AUDIO_RUNTIME_V1.md).

When an intake profile declares `game.audio.mode = "host"`, the hardener must additionally:
- validate the host-audio manifest fields;
- require both `game:audio` and `host:audio` vocabulary in the runtime tree;
- preserve the exact declaration in generated `cartridge.json`;
- keep sound URLs/recipes out of gameplay messages;
- leave website profile/asset admission and listening approval external.

The hardener does not inject a sound engine or rewrite unknown gameplay boundaries. A compatibility bridge remains a small source-owned adaptation because only the game knows when a jump, hit, reward, menu action, or other semantic event actually occurred.

CHL-3 host safety for an opted-in cartridge includes the audio ownership contract, but does not prove final sound quality. CHL-5/6 still require the real website player and target devices. Existing cartridges without `audio.mode = "host"` remain valid under the previous game-owned path.

