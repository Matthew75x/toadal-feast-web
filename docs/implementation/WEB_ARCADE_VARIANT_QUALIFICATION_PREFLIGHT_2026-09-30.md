# Web Arcade Variant Qualification Preflight — FMF + Zen

Date: 2026-09-30  
Purpose: independent source-level qualification guidance for the active Arcade HOLD closure.

This document does not qualify the cartridge. It records concrete source authority so the runtime lane can test the right things without rediscovering mode semantics.

## 1. 5 Minute Feast — authoritative runtime facts

Current game source defines `fmf` in `src/runtime/app/game-core.js` with:

- id: `fmf`
- display name: **5 Minute Feast**
- `missPenalty: false`
- forced character: **Chomper** (`chomper`)
- HUD widget: `fmf`
- initial timer: **300 seconds**
- timer decrements by runtime `dt`
- terminal condition: when `fmfTimeLeft <= 0`
- terminal result: **Time's Up! / Five Minute Feast Complete!**
- start lives: **5**
- max lives: **8**

The HUD renders the timer from `GameState.fmfTimeLeft` and changes urgency treatment at 60 and 30 seconds.

### FMF runtime acceptance witness

A bounded browser witness should prove:

1. `GameState.currentMode === 'fmf'`
2. effective character is `chomper`
3. `GameState.fmfTimeLeft` begins at 300
4. timer decreases while actively playing
5. timer does not incorrectly advance while the shared pause state is active
6. normal catch/scoring path works
7. misses do not apply Standard-style life damage solely because they missed
8. restart restores the intended 300-second run state
9. the terminal timer path produces the canonical result
10. exit/fullscreen/visibility behavior remains host-controlled

Waiting five literal minutes is unnecessary if the test separately proves the actual 300-second initialization and then uses an explicit test-only clock/state acceleration to exercise the terminal path.

Do not change the production timer value to make QA faster.

## 2. Zen — authoritative runtime facts

Current game source defines `zen` in `src/runtime/app/game-core.js` with:

- id: `zen`
- display name: **Zen Garden**
- `missPenalty: false`
- forced character: **Princess Lily** (`princess`)
- HUD widget: `zen`

Current balance authority defines:

- food speed multiplier: **0.58**
- spawn interval multiplier: **1.60**
- total catches: **900**
- rooms: **5**
- room catch threshold: **180**

Zen state increments catches and room progress on ordinary food catches. Every 180 room catches reveals the next room. At five rooms, Zen marks complete and schedules the canonical victory result.

The source explicitly keeps Princess Lily's favourite-food affinity in Zen scoring.

### Zen runtime acceptance witness

A bounded browser witness should prove:

1. `GameState.currentMode === 'zen'`
2. effective character is `princess`
3. current approved Princess Lily runtime assets render
4. a normal catch increments Zen progress
5. a miss resets combo/presentation state but does not apply the Standard miss-life penalty
6. room progress is driven by the canonical 180-catch threshold
7. five-room / 900-total-catch authority is unchanged
8. the room-complete path updates Princess transformation state
9. the final Zen victory path is reachable
10. pause/restart/exit/fullscreen/visibility behavior remains correct

It is acceptable to use a clearly labelled test fixture/state acceleration to reach a room boundary and final-room boundary, provided the test also proves the production thresholds remain 180/5/900 and the fixture does not modify shipped runtime values.

## 3. Package implication

FMF and Zen are now intentional web-preview experiences.

Therefore their required assets/scripts/styles should **not** be placed in the “unused because the short Standard run did not request them” bucket.

The package audit should now classify files into at least:

- Standard shared/runtime required
- Standard Toadal required
- Standard Classic required
- Standard Gully required
- FMF required
- Chomper required
- Zen required
- Princess Lily required
- shared by multiple preview experiences
- unresolved/dynamic reference requiring proof
- proven unreachable from the final preview
- authoring/dev/QA only

Only the final two categories are immediate removal candidates.

## 4. Current HOLD interpretation

The existing 38/38 audit is still useful for:

- iframe isolation
- host protocol
- basic control plumbing
- basic runtime boot
- initial scoring
- no immediate fatal network/runtime failure

It is not enough to prove:

- sustained Standard gameplay
- progression beyond level 1
- Toadal's unobserved mechanic paths
- realistic multi-touch behavior
- FMF
- Zen
- final persistence
- safe final pruning

Those are the remaining qualification targets, not reasons to restart the entire audit.

## 5. Product boundary

The final web sampler currently intends:

- Standard Arcade — Toadal / Classic / Gully
- 5 Minute Feast — Chomper
- Zen — Princess Lily

Keep excluded unless separately approved:

- FEAST FRENZY / `tc`
- Puzzle
- Feastfall
- Infinite
- full Arcade roster
- mobile shop/economy
- account requirement
- global leaderboard

## 6. Regression caution

Do not use historical donor success as the final proof for a modified web cartridge.

After any adapter change, persistence bridge, asset prune, route integration, or package rewrite:

- rerun the relevant source-authoritative mechanics verifier against the modified cartridge;
- rerun browser evidence against the exact package;
- hash the exact final bytes.

The last tested bytes must be the bytes proposed for website integration.
