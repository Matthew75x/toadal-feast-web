# ARC-QUAL-01 — Arcade Cartridge Qualification / HOLD Closure

**Status:** ACTIVE HOLD

## Goal

Turn the current audited Arcade directory into a qualified, minimal, isolated web cartridge **without integrating it into the website yet**.

## Starting evidence

Historical WO-003 Arcade evidence maps to this work order.

Known useful evidence:
- 38/38 bounded smoke checks;
- iframe isolation/basic controls passed;
- previous gameplay witness only ~16 seconds, score 150, level 1;
- package audit directory approximately 401 files / 28.86 MB;
- dependency audit contains unresolved references and donor files requiring classification.

The prior 38/38 result is not the final qualification verdict.

## Required

1. Settle stage-specific persistence.
2. Prove meaningful Standard Arcade gameplay.
3. Prove required Toadal mechanics.
4. Prove realistic mobile/multi-input behavior.
5. Qualify Standard web roster:
   - Toadal
   - Classic Frog
   - Gully (`pelican`)
6. Qualify 5 Minute Feast:
   - `fmf`
   - Chomper
   - canonical 300-second timer
7. Qualify Zen:
   - `zen`
   - Princess Lily
   - canonical 900-catch / 5-room / 180-per-room authority
8. Capture runtime reachability across every intended experience.
9. Classify unresolved references.
10. Produce justified package closure.
11. Rerun mechanics/browser tests against the exact final cartridge.
12. Hash the exact final bytes.

## Hard boundaries

Do not:
- integrate into website routes;
- deploy;
- expose FEAST FRENZY / `tc`;
- add Puzzle/Feastfall/Infinite;
- rewrite gameplay;
- mutate mobile save/economy;
- weaken opaque-origin isolation merely for storage;
- prune files solely because the earlier 16-second run did not request them.

## Output

Exactly one:

- `ARCADE QUALIFIED — PACKAGE ONLY`
- `ARCADE HOLD`

If qualified, record exact package file count/bytes, deterministic ledger/hash, entry hash, adapter hash, test counts and evidence inventory.
