# TOADAL FEAST Web Arcade Demo — Product Authority

Date: 2026-09-30  
Status: owner-directed authority. Current implementation remains **ARCADE HOLD** until the final cartridge passes gameplay, dependency, mobile-input, persistence, and byte-level requalification gates.

## Product definition

The website does not ship the full mobile game. It ships a bounded **Arcade sampler** that should feel like a complete small web game while leaving the larger TOADAL FEAST experience to the app.

The final web sampler contains three experiences:

1. **Standard Arcade** — website-owned three-character preview roster:
   - Toadal — start unlocked
   - Classic Frog (`classic`) — unlock after first completed Standard run
   - Gully (`pelican`) — unlock at Standard best score 600 OR after 3 completed Standard runs
2. **5 Minute Feast** (`fmf`) — canonical five-minute sprint, forced **Chomper**
3. **Zen** (`zen`) — canonical Zen rules, forced **Princess Lily**

The current source authority explicitly maps `fmf -> Chomper` and `zen -> Princess Lily`. These are not new game modes invented for web; they are existing Arcade variants being selectively exposed through the web sampler.

**FEAST FRENZY / `tc` is not part of this owner update.** Keep it excluded unless separately approved.

## Current HOLD and qualification rule

The current WO-003 audit passing 38/38 bounded checks does not qualify the cartridge for integration by itself.

The reported gameplay witness lasted only 16 seconds, reached score 150 and remained in level 1. That is useful technical smoke evidence, not adequate gameplay qualification.

Before integration, Stage A must directly prove meaningful Standard Arcade gameplay depth, including the source-authoritative Toadal mechanic paths, natural progression/run behavior, realistic touch drag, and simultaneous movement/action where applicable.

The final candidate must then qualify 5 Minute Feast and Zen in the same sealed cartridge before Stage B is considered complete.

## Persistence decision

The prior ambiguity is now settled by stage:

- **Stage A technical qualification:** session-only score/state is acceptable.
- **Final public preview:** website-host-owned local persistence is required for the Standard web-demo progression.

The final preview may persist only small web-owned state such as:

- Standard best score;
- per-character Standard best scores;
- completed Standard run count;
- unlocked Standard preview characters;
- selected character;
- selected experience;
- preview settings.

Namespace:

`toadal:game:toadal-feast-arcade-preview:v1:`

Do not use or mutate the mobile `froggyFeast` save. Do not weaken the opaque-origin sandbox just to recover mobile-style storage. Do not claim account sync.

## Why FMF and Zen belong in the sampler

This expansion is efficient because the authoritative standalone Arcade runtime already supports `standard`, `fmf`, and `zen`. The current audit package is broad enough that variant code/assets are already part of the dependency problem.

Therefore, do not spend effort proving 5 Minute Feast and Zen files are removable if they are now intentional web-preview content. Instead, qualify those experiences and let their reachable assets count as justified package content.

This does **not** justify keeping every donor file. Runtime reachability still has to be proven across all three experiences.

## 5 Minute Feast

Preserve its canonical identity:

- runtime id: `fmf`
- display name: **5 Minute Feast**
- forced character: **Chomper**
- canonical five-minute clock
- no web-specific scoring/physics rewrite

The web shell may choose the experience, but it must not turn FMF into a new fork.

## Zen

Preserve its canonical identity:

- runtime id: `zen`
- display name: **Zen**
- forced character: **Princess Lily**
- canonical Zen pacing/rules
- no web-specific scoring/physics rewrite

Princess Lily must use the current approved/canonical runtime assets, not the retired pink-crowned set.

## Standard Arcade

Standard remains the main progression loop.

Use natural Standard Arcade first. Do not add a hard timer before measured play demonstrates a need for one. The target remains a satisfying short session, roughly 2–4 minutes when practical.

The website owns the visible Standard character chooser. Do not expose the full mobile roster/shop/cosmetics economy.

## Results and conversion

Reward play before marketing.

For Standard:
1. score;
2. new best / personal best;
3. unlock or unlock progress;
4. Replay;
5. Change Character / Change Experience;
6. full-game CTA.

For FMF/Zen, preserve their appropriate canonical result semantics while keeping the app CTA secondary to the gameplay result.

Do not interrupt active gameplay with conversion messaging.

## Package/dependency policy

The current audit package is not the final cartridge.

Do not interpret the reported 101 unresolved references as 101 confirmed missing files. Classify directories, template expressions, wildcards, and real file dependencies separately.

Do not delete the reported 187 unrequested donor files merely because a 16-second witness did not request them.

Required optimization sequence:

1. close Standard gameplay-depth/mobile-input/persistence gates;
2. qualify FMF and Zen in the same cartridge;
3. capture runtime requests/reachability across all three experiences;
4. classify unresolved references;
5. remove only proven-unreachable files;
6. rerun authoritative mechanics/browser verifiers against the modified cartridge;
7. requalify the exact final bytes;
8. only then integrate into the website.

## Website integration gates

Arcade integration remains blocked until cartridge qualification passes.

After cartridge qualification, integration still requires:

- Wicked Bites legacy route compatibility;
- fresh site regressions;
- static export/base-path verification;
- appropriate handling/documentation of the inherited Windows `spawnSync npm.cmd EINVAL` full-QA invocation issue;
- responsive/mobile evidence;
- exact package and static-export hashes.

## Deliberately excluded from this web sampler

- FEAST FRENZY / `tc` unless separately approved
- Puzzle
- Feastfall
- Infinite
- full Arcade character roster
- shop
- cosmetics economy
- daily goals
- mobile currencies
- mobile save import/export
- cross-device progression
- global leaderboard
- account requirement

## Acceptance standard

A first-time visitor should be able to play a meaningful Standard run, earn visible Standard progression, switch among the qualified web roster as unlocked, choose 5 Minute Feast with Chomper, choose Zen with Princess Lily, and understand that this is a polished Arcade sampler rather than the full mobile game.

The product-complete web preview is therefore:

**Standard Arcade + Toadal/Classic/Gully progression + 5 Minute Feast/Chomper + Zen/Princess Lily**, all inside one qualified isolated web cartridge.
