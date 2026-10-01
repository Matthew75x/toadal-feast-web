# Arcade Character Asset Budget — Source-Level Evidence

Date: 2026-09-30  
Source inspected: `Matthew75x/Toadal-Feast-Development` main `6daedca1eb6aa5c953e53a538561e9c42ff9cb3c`

Purpose: help ARC-QUAL-01 distinguish intentional web-preview character bytes from directory-level dead/retired material.

This is source-level evidence, not final package qualification.

## Directory totals vs animation-registry references

| Character | Source directory bytes | Files in directory | Animation-registry referenced bytes | Referenced files | Immediate interpretation |
|---|---:|---:|---:|---:|---|
| Toadal | 4,029,680 | 14 | 3,966,645 | 11 | Nearly all bytes are active animation/effect authority; portrait/manifest-style extras may still be needed by UI |
| Classic Frog | 3,918,918 | 6 | 2,826,283 | 3 | ~1.09 MB is outside the current animation-registry clip set and should be classified |
| Gully | 9,504,879 | 12 | 9,495,338 | 11 | Almost the entire family is active registered animation content |
| Chomper | 3,254,266 | 4 | 3,251,801 | 3 | Almost the entire family is active registered animation content |
| Princess Lily | 7,657,080 | 14 | 4,370,750 | 8 | ~3.29 MB is outside the current approved animation-registry clip set; known retired/duplicate material exists |

## Standard roster

### Toadal

Current registered animation/effect files total **3,966,645 bytes**.

The active registry references:
- idle
- run
- jump
- hurt
- swallow
- Golden Throw
- Golden Block
- victory
- tongue-catch source
- Golden Block world effect
- Golden projectile

Do not assume Toadal can be materially shrunk without either:
- dropping a real mechanic/result state, or
- producing separately approved optimized derivatives.

The family also contains portrait/metadata material that may be required outside the animation renderer.

### Classic Frog

Current registry references only three clips:

- `idle_blink_5f_polished_2026-09-08.png`
- `walk_12f.png`
- `catch_open_5f_polished_2026-09-08.png`

Registry-referenced total: **2,826,283 bytes**.

Full directory total: **3,918,918 bytes**.

Approximately **1,092,635 bytes** is outside the active current clip set.

Candidate extras include older idle/catch variants. Do not remove by directory name alone; classify against all UI/result/runtime references first.

### Gully

Current registry-referenced total: **9,495,338 bytes**.

This is the largest intended character family and is mostly legitimate active state coverage:

- idle
- takeoff
- flight/glide/climb/dive
- landing
- ground walk
- catch/swallow
- pouch-full
- hurt
- victory
- game-over
- rare-food reaction

This explains why a realistic Gully witness matters before pruning.

If package size becomes a concern, optimize transfer/derivative strategy after qualification rather than deleting late-state animations.

## 5 Minute Feast

### Chomper

Current registry references:

- `chomper_idle_static_1f_256.png`
- `chomper_move_14f_256.png`
- `chomper_chomp_26f_256.png`

Registry-referenced total: **3,251,801 bytes**.

The full Chomper Arcade directory is only about 2.5 KB larger because the remaining file is metadata.

Conclusion:
**Chomper is not a meaningful pruning target if 5 Minute Feast is intentional content.**

## Zen

### Princess Lily

Current approved registry references exactly the September replacement family:

- `lilly_idle_1f_512_2026-09-08.png`
- `lilly_walk_4f_512_2026-09-08.png`
- `lilly_catch_open_3f_512_2026-09-08.png`
- `lilly_catch_hold_1f_512_2026-09-08.png`
- `lilly_chew_swallow_3f_512_2026-09-08.png`
- `lilly_blink_3f_512_2026-09-08.png`
- `lilly_wink_3f_512_2026-09-08.png`
- `lilly_hurt_1f_512_2026-09-08.png`

Registered total: **4,370,750 bytes**.

Full Princess directory total: **7,657,080 bytes**.

Approximately **3,286,330 bytes** is outside the active current registry.

The directory-level excess includes legacy/duplicate material. The website package should use the current September `lilly_*` authority and must not revive the retired crowned Princess set.

This is one of the clearest safe-pruning investigation areas.

## Shared package context

For scale, current source groups also measure approximately:

- Arcade runtime JS: 439,018 bytes
- Arcade mode styles: 80,225 bytes
- Arcade runtime food family: 3,519,724 bytes
- shared runtime JS family: 791,212 bytes
- platform runtime JS family: 365,720 bytes
- rendering runtime JS family: 308,073 bytes

These directory totals are not a proposed final package.

They show that the biggest web-cartridge weight is character/art content, especially Gully and the large sprite-strip families, not the Arcade JavaScript itself.

## Practical consequence

Do not chase package size by deleting shared runtime code first.

Highest-value safe analysis order is:

1. remove known retired/duplicate Princess material that no final preview path resolves;
2. classify old Classic variants outside the current registry;
3. remove excluded-mode/character assets only after static/runtime proof;
4. retain Gully/Chomper state coverage required by the intended preview;
5. consider approved web-optimized derivatives only after fidelity qualification if transfer size remains problematic.

The current audit package (~28.86 MB) is not obviously unreasonable once the intended five-character/three-experience art families are accounted for. The job is to remove unjustified bytes, not hit an arbitrary cap.
