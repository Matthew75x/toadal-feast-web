# TOADAL FEAST Web Program — Status and Execution Queue

Date: 2026-09-30  
Purpose: one human-readable queue for continuing the website without rediscovering scope.

## Current active lane

**ARC-QUAL-01 — Arcade cartridge qualification / HOLD closure**

Latest locally reported Arcade audit:
- commit: `b1f2cd6f52e16c6e80f76e313386156373fee94b`
- verdict: **ARCADE HOLD**
- previous bounded checks: 38/38
- previous gameplay witness: ~16 seconds / score 150 / level 1
- audit package: ~401 files / 28,859,472 bytes
- not integrated
- not deployed

This local commit is recorded from the execution report. It is not assumed to exist on public GitHub until independently preserved there.

## Current intended Arcade product

Final web sampler:
- Standard Arcade
  - Toadal
  - Classic Frog
  - Gully
- 5 Minute Feast
  - Chomper
- Zen
  - Princess Lily

Not currently included:
- FEAST FRENZY / tc
- Puzzle
- Feastfall
- Infinite
- full roster/shop/economy

## Queue

### Q1 — ARC-QUAL-01
Owner: active execution lane / Codex
State: ACTIVE HOLD

Close:
- Standard gameplay depth
- Toadal mechanics
- realistic mobile input
- persistence contract
- Standard roster
- FMF
- Zen
- dependency closure
- final package requalification

### Q2 — ARC-INTEGRATE-01
Owner: runtime implementation lane after Q1 PASS
State: BLOCKED BY Q1

Integrate qualified cartridge into accepted WO-002 site.
Also close Wicked Bites compatibility and site regression/export gates.

### Q3 — BETA-01
Owner: website lane
State: PREPARED / may begin only where it cannot conflict with accepted runtime work

Implement beta navigation/content minimum:
- World
- Characters
- Toadal profile
- App
- Support
- Legal
- 404/recovery

Do not invent lore or legal text.

### Q4 — Beta conversion/routing closure
Owner: website lane
State: PREPARED

- preserve `?ref=app_qr`
- preserve `?ref=app_share`
- configure only verified store destinations
- unknown/malformed campaign codes must fail to website
- analytics failure must not block navigation

### Q5 — Beta site-wide QA
Owner: website QA lane
State: WAITING FOR Q2/Q3

- responsive
- accessibility
- player orientation/safe-area
- links
- console/network
- performance
- robots/indexing
- static/base-path

### Q6 — Beta RC
Owner: release lane
State: WAITING FOR Q5

Freeze:
- exact Git SHA/tree
- static manifest
- per-file hashes
- static ZIP
- screenshots
- known limitations
- rollback source

Owner acceptance required before production.

## Work that does not block Beta 1

- full Stories/Manga/Reader
- full Feast Pass
- account backend
- cross-device sync
- global leaderboards
- community backend
- full Store/commerce
- all future browser mini-games
- full editorial expansion

## Approximate execution count from here

If ARC-QUAL-01 closes without discovering a new product defect:

- Arcade HOLD closure: 1 execution run
- Arcade integration/site regression: 1 run
- Beta navigation/content minimum: 1–2 runs
- Site-wide beta QA: 1 run
- Beta RC/staging closure: 1 run

Expected website beta: roughly **5–6 substantive execution runs** from the current HOLD, not dozens of micro-prompts.

The full long-term roadmap continues after Beta 1.
