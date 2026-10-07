# TOADAL Website Shared Audio Runtime v1

**Status:** opt-in website-host integration contract. No cartridge is migrated merely because this file exists.

## Decision

TOADAL browser cartridges keep their gameplay and sonic identity. The website may own one small shared audio runtime for cartridges that explicitly opt in through `cartridge.json`.

This is an extension of the existing Browser Game Cartridge Contract and Cartridge Hardening Standard. It is **not** a second cartridge system, a second settings authority, or a requirement to rewrite every existing game.

## Why host-owned audio

A host-owned runtime can centralize:
- approved shared cue definitions;
- per-game sound profiles;
- one website mute/volume preference;
- sample loading/hash verification and decoded-buffer caching;
- voice/cooldown bounds;
- missing-sample procedural fallback;
- consistent event diagnostics.

It does **not** make different game sounds free. Unique audio still has to ship somewhere, and no percentage download saving is assumed.

## Manifest extension

`cartridge.json` may contain:

```json
{
  "audio": {
    "mode": "host",
    "contractVersion": 1,
    "profile": "example-game",
    "profileVersion": 1,
    "eventMessage": "game:audio",
    "hostMessage": "host:audio",
    "fallback": "local-before-active"
  }
}
```

`audio.mode = "host"` is opt-in. A cartridge without this object keeps its existing audio behavior.

The manifest carries no sound URL supplied by gameplay. It names a website-owned profile. The website registry resolves that profile to approved cue definitions.

## Message extension

The existing message envelope remains `toadal.game.v1`.

Cartridge → host:

```js
{
  protocol: "toadal.game.v1",
  gameId: "example-game",
  type: "game:audio",
  payload: {
    event: "player.jump",
    params: { pan: 0, intensity: 1, combo: 1 }
  }
}
```

Host → cartridge:

```js
{
  protocol: "toadal.game.v1",
  gameId: "example-game",
  type: "host:audio",
  payload: {
    state: "active",
    profile: "example-game",
    profileVersion: 1
  }
}
```

Allowed host states are `available`, `active`, `muted`, `degraded`, and `unavailable`.

Gameplay never supplies filenames, URLs, recipes, volume persistence writes, or executable data.

## Playback ownership

A host-audio cartridge MUST keep exactly one owner for a supported event.

For `fallback: local-before-active`:
1. before `host:audio {state:"active"}`, the game may use its existing local sound;
2. after host state becomes `active` or `muted`, supported events are handed to the host and must not also play locally;
3. only an explicit `unavailable` state returns ownership to local fallback; later `available` or `degraded` states retain host ownership;
4. a host mute/drop/cooldown is an intentional host decision and must not trigger a second local copy.

This is the same no-double-play rule proven in the local audio pilots.

## Session lifetime and caching

The current website is a static multi-page site. The shared runtime is loaded once per opted-in player page; it is **not** kept alive across full page navigations by a service worker, SharedWorker, hidden iframe, or SPA rewrite.

Browser HTTP caching can reuse the shared module/sample bytes on later visits, and `toadal:web:v1:audio` preserves the website preference. Decoded `AudioBuffer` objects and the `AudioContext` belong to the current player page and are released with that page.

If a future generic player swaps cartridges inside one page, the same host instance may reuse its decoded cache across those swaps. That optimization must be earned by the real host design; it is not a reason to restructure the current website now.

## Website activation and settings

The iframe remains sandboxed. Do not add `allow-same-origin` merely to make audio easier.

Because browser audio activation belongs to the top-level host context, an opted-in player uses the existing player sound control as the explicit user gesture that unlocks shared audio. Until that activation, `local-before-active` cartridges retain their local path.

A persisted mute immediately reports `muted` without creating an AudioContext, so local fallback stays suppressed on reload. Hidden pages stop host voices and cancel pending playback. Normal page exit closes the host; a back/forward-cache visit suspends and restores the same context.

Website audio preference belongs only under the existing website namespace:
`toadal:web:v1:audio`.

The first implementation stores bounded mute, master/sfx/menu gain and a boolean gentler-stereo preference. It is not game save data and does not create an account/cloud settings system.

## Central registry

The website owns `assets/data/audio-registry.json`.

Authored sample paths are website-owned relative paths beneath `/assets/audio/`; cartridge messages never choose those paths.

The registry separates:
- profiles: semantic game event → cue;
- cues: playback policy and authored-sample/procedural-fallback definition.

Multiple profiles may point at the same cue ID. Replacing an approved shared cue in the central registry changes future hosted playback consistently without editing the game source. Release review still controls when a registry change is promoted.

## Cartridgeifier / hardener behavior

The existing hardener remains the cartridgeifier authority. When `game.audio.mode` is `host`, it:
- validates the audio manifest fields;
- requires `game:audio` and `host:audio` vocabulary in the runtime package;
- copies the validated audio declaration into generated `cartridge.json`;
- does not inject a sound engine into the cartridge;
- does not grant a website profile or asset approval.

A game's compatibility bridge is small and game-specific because only the game knows its real action boundaries.

## Rollback

Rollback is manifest-level and reversible:
- remove/disable the host-audio declaration, or
- set a candidate cartridge back to local audio before promotion.

No production migration should delete the game's known-good local path until website/device qualification proves the host path.

## Current admission posture

The runtime is prepared as an opt-in website capability. Existing protected Wicked Bites bytes are not changed by this integration. The first production-admission candidate must separately prove:
- real player lifecycle;
- exact-origin/sandbox behavior;
- audio activation/mute/visibility;
- physical phone/Safari behavior;
- owner listening acceptance;
- approved/rights-cleared sound masters.

Do not weaken TCS, cartridge containment, or website release gates for audio.


## Headphone comfort and cue admission

An opted-in player exposes site volume beside its existing sound button, plus a manual **Gentler stereo** checkbox. Native keyboard/touch controls persist in `toadal:web:v1:audio`. Changing them does not activate audio or release muted host ownership. No device detection, microphone permission or additional settings store is used. Non-opted-in games keep their original controls and sound path.

These are digital engineering defaults, not medically safe listening levels:

- New website preferences start at 25% master gain; previously chosen bounded values are retained. A fixed 0.5 output factor provides additional digital headroom. User gain follows the compressor so makeup gain cannot undo the chosen attenuation.
- Gentler stereo defaults on, mapping authored pan to 60% of its range, with short ramps when changed during a sound. This reduces extreme left/right placement; it cannot evaluate an authored stereo sample's contents.
- Sample and procedural cue gain ramps from zero over up to 5 ms and returns to zero over up to 10 ms. Stops/steals fade over 10 ms. Fading sources remain in the existing voice budget until `ended`; replacement admission rechecks lifecycle, cooldown, mute and volume. BFCache exit/disposal stops immediately to prevent stale tails after suspension.
- Zero volume/intensity and intentional host drops remain host-owned silence. They never trigger legacy fallback.

WHO/ITU guidance addresses level, duration and frequency of exposure, adjustable volume and management of sudden/repeated loud sounds. The website does not know device volume, headphone sensitivity, amplifier output or fit. Its gain and PCM measurements cannot establish sound pressure at the ear. The Web Audio compressor is not a certified true-peak limiter or hearing-safety device.

Every separately admitted game/profile still requires owner review of actual samples **and** procedural fallbacks: sharp transients, high or sustained ringing/squeals, fatigue from repeated actions, sudden rewards, stereo motion and simultaneous maximum allowed voices. Use lower device volume first, compare headphones and speakers, and include ordinary prolonged gameplay and mute/volume changes. Do not infer subjective comfort from automated fixtures. For `local-before-active`, a separate migration must also review its local preactivation sound path; site controls govern host playback after activation and cannot rewrite legacy audio.

For content-mix review, WHO/ITU's gaming guidance gives a 30-minute mix example around -23 LUFS/LKFS (±2) with a maximum -1 dBTP true peak. That is a content-production reference, not an acoustic safety guarantee or a target for normalizing each isolated short cue. Actual masters, mix measurements, owner listening, physical phone/Safari and latency remain separate admission gates. The production registry remains empty until that admission.

References: [WHO/ITU gaming guidance (2025)](https://www.itu.int/dms_pub/itu-t/opb/joint/T-JOINT-WHO-2025-1-PDF-E.pdf), [WHO safe listening](https://www.who.int/news-room/questions-and-answers/item/deafness-and-hearing-loss-safe-listening), [Web Audio compressor makeup gain](https://www.w3.org/TR/webaudio-1.0/#computing-the-makeup-gain).
