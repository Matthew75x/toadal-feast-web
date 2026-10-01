# Web Arcade Package-Pruning Notes — 2026-09-30

Purpose: independent source review to reduce false-positive pruning during ARC-QUAL-01.

## Preload behavior matters

Current game source does **not** fully preload every runtime asset required by a run.

`AssetManager.preloadForMode(mode)` returns the same critical Arcade preload for:

- standard
- tc
- fmf
- zen

`preloadForRun(mode, characterId)` then adds:

- the selected/effective character's primary registered asset;
- the selected character's active run-food menu.

This means a runtime file that was not requested during the first few seconds is **not automatically unused**.

Renderer/animation-specific assets can still be requested later when:

- the character moves;
- the character catches;
- the character is hurt;
- a result state occurs;
- a rare-food reaction occurs;
- a mode reaches deeper progression;
- a room/timer/end-state presentation becomes active.

This reinforces the current HOLD rule: a 16-second Standard witness cannot safely define the final dependency closure.

## FMF / Chomper assets

The canonical animation registry uses:

`assets/images/characters/chomper-arcade/`

with at least these approved runtime clips:

- `sheets_256/chomper_idle_static_1f_256.png`
- `sheets_256/chomper_move_14f_256.png`
- `sheets_256/chomper_chomp_26f_256.png`

Chomper also has an approved canonical portrait at:

`assets/images/characters/runtime-select/chomper.png`

Do not remove the movement/chomp strips merely because an early preload only touched the portrait.

## Zen / Princess Lily assets

The current approved Princess Lily Arcade animation authority is the September replacement family under:

`assets/images/characters/curated-highres/princess/`

Required clips include:

- `lilly_idle_1f_512_2026-09-08.png`
- `lilly_walk_4f_512_2026-09-08.png`
- `lilly_catch_open_3f_512_2026-09-08.png`
- `lilly_catch_hold_1f_512_2026-09-08.png`
- `lilly_chew_swallow_3f_512_2026-09-08.png`
- `lilly_blink_3f_512_2026-09-08.png`
- `lilly_wink_3f_512_2026-09-08.png`
- `lilly_hurt_1f_512_2026-09-08.png`

The standalone Zen launch art also points at:

`lilly_idle_1f_512_2026-09-08.png`

Do not use the retired legacy Princess portrait/sprite set as fallback authority.

## Standard roster implication

The same late-request principle applies to Standard roster animation families.

For example, Gully's canonical animation registry contains multiple states across:

`assets/images/characters/gully-arcade/sheets_256/`

including takeoff, flight, landing, ground walk, catch/swallow, pouch-full, hurt, victory, game-over, and rare-food reaction states.

A one-state or short-run request trace is insufficient to prove those files unnecessary if the final web preview intends real Gully gameplay.

## Practical pruning rule

A file is a safe removal candidate only if at least one of the following is established:

1. it belongs to an explicitly excluded mode/character/surface and no shared runtime references it;
2. static resolution proves no final preview code path can resolve it;
3. representative runtime coverage across all intended preview experiences plus source-level dependency analysis confirms it is unreachable;
4. it is authoring/dev/QA material not loaded by the runtime.

“Not requested during one short run” is not enough.

## Reachability coverage expected before final trim

Capture runtime requests while exercising:

- Standard / Toadal:
  - movement
  - catch
  - hop
  - Golden Throw
  - Golden Block
  - hurt/damage
  - natural result
- Standard / Classic:
  - movement
  - catch
  - hurt/result as applicable
- Standard / Gully:
  - ground state
  - takeoff
  - flight/glide
  - landing
  - catch/swallow
  - damage/result where applicable
- FMF / Chomper:
  - idle
  - movement
  - chomp/catch
  - timer HUD
  - restart
  - terminal result
- Zen / Princess Lily:
  - idle
  - movement
  - catch/open/hold/swallow
  - room progress
  - room reveal
  - final-result path

The final ledger should combine runtime request evidence with source-level registry references rather than using either alone.
