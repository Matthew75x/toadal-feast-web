# ARC-QUAL-01 HOLD Closure Strategy — Deterministic Witnesses

Date: 2026-09-30

Purpose: narrow the remaining HOLD to concrete, efficient QA work without restarting Arcade packaging.

## Current HOLD

Latest execution report:
- final local commit: `409a6d223a148937aa15073b5640379560594b89`
- branch: `work/WO-003-arcade-isolation-20260930`
- clean local worktree
- FMF/Chomper live scoring: observed
- Zen/Princess live scoring: observed
- persistence survives reload: observed
- Standard meaningful gameplay: not qualified
- Classic package assets: incomplete/missing
- Gully/mobile-input evidence: incomplete
- final package closure: incomplete
- same-frame message spoofing: untested

This document does not upgrade the HOLD.

## 1. Stop relying on a fragile manual/synthetic Standard run

The authoritative game repository already contains a QA-only Arcade bot:

`tools/benchmark/arcade-bot.js`

It uses real gameplay inputs/events and, when required, creates an approved deterministic food target through the real `EntityFactory`. It does **not** inject score.

It records:
- duration
- shots
- catches
- hazards
- game overs
- score gain
- level
- combo
- deterministic assists

It also prefers the mature in-game `AutoBot` in perfect mode when that facility is present.

Important:
- build/release governance forbids AutoBot/AutomationLab in shipped release artifacts;
- therefore use the bot only as a **test harness outside the final cartridge bytes**.

### Recommended Standard witness

Use the exact candidate cartridge plus an external test injection/harness that loads the QA bot for the browser test only.

Do not add the bot to the final package manifest.

Require a run that reaches at least one of:
- level >= 2;
- natural game-over after >= 60 seconds;
- >= 60 seconds of uninterrupted real PLAYING state with multiple real catches and positive score progression.

Prefer level >= 2 plus >= 60 seconds when attainable without distorting game rules.

The purpose is to prove sustained gameplay, not endurance.

## 2. Toadal mechanics should use source-authored diagnostic events

Current Toadal mechanics already exposes authoritative events/diagnostics.

Relevant source events include:
- `toadalChargedHopStarted`
- `toadalGoldenThrowReleased`
- `toadalBlockCreated`
- Toadal direct-catch diagnostics
- Toadal tongue/catch events

The QA witness should subscribe to these real events and require them, rather than infer success from a button press.

### Efficient mechanic setup

Golden Charge comes from direct physical food catches.

For a QA-only deterministic witness:
- create ordinary approved food via `EntityFactory`;
- place it where the real Toadal body/contact path catches it;
- allow the actual scoring/catch/charge code to run;
- repeat until enough real charge exists for Throw/Block;
- drive the actual input/event path for Throw and Block;
- assert the authoritative emitted event and resulting runtime state.

Do not set score directly.
Do not call private success callbacks that bypass gameplay.
If charge is manipulated directly for a narrow mechanics unit witness, label that separately from the integrated gameplay witness and do not use it as the sole proof.

## 3. Classic asset closure is deterministic

The authoritative Arcade animation registry defines Classic under:

`assets/images/characters/curated-highres/classic/`

Required canonical clips for the web Standard roster are:

- `idle_blink_5f_polished_2026-09-08.png`
- `walk_12f.png`
- `catch_open_5f_polished_2026-09-08.png`

The runtime portrait is:

`assets/images/characters/runtime-select/classic.png`

If the candidate reports Classic assets missing, first compare its package ledger against these exact source-authoritative paths.

Do not substitute older Classic sheets simply because they exist elsewhere in Feastfall/cosmetic history.

After adding only the missing required files:
- run Classic idle/move/catch browser witness;
- verify no 404/load/decode failures;
- hash the added assets in the final package ledger.

## 4. Gully qualification

Gully runtime id is `pelican`.

The final witness should intentionally exercise:
- ground state;
- takeoff;
- flight movement in both axes;
- catch/swallow;
- landing;
- result/damage path when practical.

At minimum, prove the actual flight and catch mechanics rather than only loading the portrait/idle state.

## 5. Realistic mobile input

Do not treat "pointer event dispatched" as success.

For the mobile/browser harness:
- drag joystick with pointerdown -> multiple pointermove positions -> pointerup;
- assert frog/Gully position or movement state changes;
- while drag remains active, press the action control with a second pointer;
- assert the expected gameplay event/state change occurs;
- test pointercancel/lost capture and verify controls return neutral.

This is specifically a multi-pointer gameplay witness.

## 6. Same-frame / sibling-frame spoofing

Opaque-origin means message `origin` can be `null`; therefore source-window/session validation is critical.

Create an adversarial harness with:
- legitimate cartridge iframe;
- attacker/sibling iframe with the same opaque-origin behavior if practical;
- parent host.

Attempt to send syntactically valid:
- `game:preview-state`
- `game:request-exit`
- `game:request-fullscreen`
- result/score messages

from the attacker/sibling frame.

PASS requires:
- host rejects because `event.source !== legitimateIframe.contentWindow`;
- wrong/missing session id is rejected;
- wrong cartridge id/protocol is rejected;
- malformed payload is rejected;
- legitimate cartridge message is accepted.

Also test a replayed legitimate message with stale session id after iframe remount.

A same-frame script that can execute **inside the legitimate cartridge itself** is not meaningfully distinguishable by `event.source`; preventing arbitrary script execution is a CSP/package-integrity problem. Do not claim the message bridge alone solves XSS inside the trusted cartridge.

## 7. Package closure

Do not prune until the intended experience matrix has executed:

- Standard / Toadal
- Standard / Classic
- Standard / Gully
- FMF / Chomper
- Zen / Princess Lily

Combine:
- static source references;
- animation registries;
- runtime request log;
- dynamic/template reference classification;
- exact mode/character asset manifests.

Then remove only proven unreachable material.

Re-run the exact same matrix against the pruned final bytes.

## 8. Final efficient disposition

The next execution should be bounded to closing the remaining HOLD only.

Do not:
- redo the accepted FMF/Zen scoring evidence unless final bytes change;
- restart donor selection;
- redesign the website;
- integrate routes before package qualification;
- run long soak tests.

If the above closes, return:

`ARCADE QUALIFIED — PACKAGE ONLY`

Then move separately to ARC-INTEGRATE-01.
