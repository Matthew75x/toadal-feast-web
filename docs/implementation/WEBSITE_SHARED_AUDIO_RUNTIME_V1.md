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
3. if the host explicitly becomes `unavailable`, local fallback may resume;
4. a host mute/drop/cooldown is an intentional host decision and must not trigger a second local copy.

This is the same no-double-play rule proven in the local audio pilots.

## Session lifetime and caching

The current website is a static multi-page site. The shared runtime is loaded once per opted-in player page; it is **not** kept alive across full page navigations by a service worker, SharedWorker, hidden iframe, or SPA rewrite.

Browser HTTP caching can reuse the shared module/sample bytes on later visits, and `toadal:web:v1:audio` preserves the website preference. Decoded `AudioBuffer` objects and the `AudioContext` belong to the current player page and are released with that page.

If a future generic player swaps cartridges inside one page, the same host instance may reuse its decoded cache across those swaps. That optimization must be earned by the real host design; it is not a reason to restructure the current website now.

## Website activation and settings

The iframe remains sandboxed. Do not add `allow-same-origin` merely to make audio easier.

Because browser audio activation belongs to the top-level host context, an opted-in player uses the existing player sound control as the explicit user gesture that unlocks shared audio. Until that activation, `local-before-active` cartridges retain their local path.

Website audio preference belongs only under the existing website namespace:
`toadal:web:v1:audio`.

The first implementation stores only bounded website audio preference. It is not game save data and does not create an account/cloud settings system.

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
