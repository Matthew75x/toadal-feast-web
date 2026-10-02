# TOADAL FEAST — Browser Player HUD Truth Map

**Date:** 2026-10-02  
**Scope:** manifest row 04 Browser Game Player / Console  
**Current playable preview:** Wicked Bites

## Existing real cartridge signals

Current `toadal.game.v1` cartridge -> host protocol supports:

- `game:ready`
- `game:started`
- `game:paused`
- `game:resumed`
- `game:score`
- `game:complete`
- `game:error`
- `game:request-exit`
- `game:request-fullscreen`

Wicked Bites compatibility bridge currently emits:
- started state;
- pause/resume;
- score from `#wbScore`;
- one completion transition with final score;
- error state.

It does **not** emit:
- XP;
- Sparks;
- Treats;
- achievement IDs;
- quest/challenge progress;
- canonical game-mode metadata;
- trusted run duration.

## Valid V1 HUD fields

### Score
**REAL**

Source:
`game:score` and final `game:complete.score`.

Display:
- current score during run;
- final score after completion;
- local best once score persistence is integrated.

Normalize for persistence separately. UI may display a sanitized current value.

### Session timer
**HOST-DERIVED, VALID IF LABELED CORRECTLY**

The website can measure elapsed **preview session play time** from protocol state:

- start/resume clock on `game:started` / `game:resumed`;
- pause on `game:paused`;
- stop on `game:complete` / `game:error` / exit;
- pause on page-hidden host pause behavior.

Label:
- `Session time`
- `Preview time`

Do not label it as an authoritative in-game timer, speedrun time, challenge time or score multiplier unless the cartridge explicitly supplies that concept.

Do not persist it as competitive evidence.

### Challenge tracker
**WEBSITE-LOCAL ONLY**

Current guest progression has route quests but no qualified Wicked Bites completion quest yet.

Therefore V1 may:
- show `No active website challenge for this preview`, or
- render a real configured game-completion quest if Lane D adds a definition backed by a validated `game:complete` event.

Do not infer a challenge from mockup text.

### XP / Sparks / Treats
**WEBSITE-LOCAL PROGRESSION ONLY**

May display current website guest totals if:
- guest progression runtime is deliberately loaded/connected for Player;
- the values are labeled as browser-local website Feast Pass state.

A game score must not directly mutate these values.

If the Player route does not need the whole progression runtime, omit these totals rather than duplicating storage access.

### Achievements
**NO CURRENT GENERAL PLAYER EVENT**

The current website guest progression has local milestones/rewards but no cartridge achievement message.

Safe options:
- show earned website-local badge/milestone state;
- show a truthful empty state;
- omit the module.

Do not present the full game's achievement catalog as earned website-preview achievements.

## Player-state transitions

Suggested host HUD state machine:

```
loading
  -> ready
  -> playing
  -> paused
  -> playing
  -> complete

any active state -> error
```

On retry:
- reset session timer;
- reset current score display;
- reset one-run completion-persist guard;
- preserve previously saved local best/history.

On exit:
- stop timer;
- do not synthesize completion.

## Score persistence seam

Persist only final valid completion through the guest-progression score API.

Do not persist every `game:score` message.

This prevents:
- duplicate history;
- partial-run scores;
- high-frequency localStorage writes.

## Visibility/pause behavior

The current player host already pauses the game when the page becomes hidden and resumes when appropriate.

The host session timer must follow the same state.

Do not count hidden/paused time as active session play time if the host has requested pause.

## Accessibility

HUD values should:
- have stable labels;
- avoid announcing every score mutation through an aggressive live region;
- keep the existing player status live region for meaningful state transitions;
- not steal focus from the iframe/game controls;
- remain legible in fullscreen.

Score can update visually without every increment becoming a screen-reader interruption.

## Mobile

Keep game viewport dominant.

On narrow screens:
- compact Score + Session Time into a small strip;
- move secondary website challenge/XP context below or behind a compact disclosure if needed;
- do not shrink the actual game viewport merely to preserve decorative dashboard density.

## Final truth examples

Good:
- `Score 1,240`
- `Session time 02:18`
- `Local best 3,810`
- `No active website challenge for this preview`
- `Feast Pass progress is local to this browser`

Bad:
- `Global rank #4` without connected service
- `+100 XP` merely because a score changed
- `Achievement unlocked` without a real local definition/event
- `Challenge resets in 12h` without configured period authority
- `2:18 run time` when the value is only host elapsed session time

This satisfies the approved player-dashboard composition while keeping every value tied to an actual source.
