# Website shared audio runtime v1 — qualification checkpoint

**Date:** 2026-10-07
**Disposition:** REVIEW CANDIDATE / NOT DEPLOYED

## Exact scope

Base website staging commit: `839fe227e36526e9e8fbb75e5421a217bcaa72c8`.

This candidate extends the existing Browser Game Cartridge Contract and Cartridge Hardener. It does not create a second cartridgeifier. The website owns an optional shared playback runtime; cartridges opt in through `cartridge.json.audio` and use a thin semantic-event adapter.

Current protected Wicked Bites remains game-audio-owned. Its cartridge manifest has no host-audio declaration and its protected bytes are unchanged.

The central website registry is intentionally empty until a real game/profile and production sounds are explicitly admitted.

## What was proven

- Hardener understands optional `game.audio.mode = "host"`, validates its bounded contract, requires `game:audio` / `host:audio` vocabulary and emits the declaration into generated `cartridge.json`.
- Existing cartridges without `audio` remain valid.
- A reusable cartridge-side adapter keeps local audio before host activation and prevents local double-play after host ownership becomes active/muted.
- The player loads only a tiny manifest probe on player pages. The full runtime and registry are dynamically loaded only when a cartridge opts in.
- The website host keeps one current-page AudioContext, website-global mute/volume preference under `toadal:web:v1:audio`, bounded voices/cache, same-origin hash-checked samples and procedural tone fallback.
- The current multi-page site is not converted to an SPA, service worker, SharedWorker or hidden persistent audio frame. HTTP cache/settings can persist across pages; decoded buffers/context do not.

## Final focused verification

### Automated

- Cartridge Hardener: **16/16 PASS** on Windows / Python 3.13.15.
- Website/player focused Node tests: **36/36 PASS**, zero skips, Node v22.23.2.
- The focused Node set includes the shared-audio contract plus existing WO-002 player contract, manifest runtime, protected-game artifact and website-score adapter checks.

### Staging-parent baseline distinction

The broader Play-catalogue suite reports **38/40 PASS** on the exact parent `efd5280...` and the same two failures on the audio branch. Both are stale catalogue projection metadata failures. This candidate does not rewrite that unrelated metadata and does not claim those baseline failures as audio PASS.

### Exact Studio export

Using Studio authority `ffebf68559c0866e8e68b3de1470fa89ee654013`, a scratch static export succeeded.

After advanced-runtime externalization:
- protected game verification: **PASS**, 3 protected files;
- player references the newly hashed advanced runtime;
- advanced runtime includes the player-only audio loader;
- current Wicked Bites manifest has **no audio opt-in**.

Exported shared-audio files:
- `assets/js/website-audio-loader.mjs`: 1,620 bytes; SHA-256 `8d35aef38905871fd01e1a81147627fcb26fdb1498cc5cfa36faa143c2d7d7e7`
- `assets/js/website-audio-host.mjs`: 21,514 bytes; SHA-256 `39df0116393793f7caa24b4f353e4a5ce0ef382165e12338051e5b0c0575766c`
- `assets/data/audio-registry.json`: 304 bytes; SHA-256 `508f6aff4c79851b73f26328508ba8cdc301a03292b54be3f5f54898bed4467c`
- generated advanced runtime: `advanced-code.696ecde0ccc9.js`; SHA-256 `696ecde0ccc993e3794944332ce247c8b218a560f4ae1040485aa38af25f7d4a`

### Real Chrome checks

Chrome file version: 154.0.8037.93.

**Current non-opted-in Wicked Bites:** PASS.
- tiny loader requested once;
- cartridge manifest requested once;
- full audio host requested zero times;
- audio registry requested zero times;
- existing Request mute behavior remains;
- zero page/console errors.

**Scratch host-audio opt-in:** PASS.
- full host and registry loaded once after manifest opt-in;
- before explicit user action there is no AudioContext;
- clicking the existing sound control unlocks one running host context;
- a bounded `game:audio` event resolved to the central cue and played procedural fallback;
- muting stores `toadal:web:v1:audio` and a second event does not create another playback;
- zero page/console errors.

The opt-in manifest/registry mutation existed only in the extracted scratch export and is not committed to the protected cartridge.

## Deliberate limits

This does **not** mean the whole audio roadmap is complete. No real website cartridge is migrated yet, no production cue/profile is admitted, no production sound master is approved, and no physical phone/Safari listening or latency pass has occurred.

The reusable adapter is a template, not an unsafe automatic source rewriter. The cartridgeifier can validate/package the contract, but the real gameplay action → semantic event mapping remains a reviewed per-game integration step.

No live Pages deployment, production DNS, native game, TCS authority or player account/settings system was changed.
