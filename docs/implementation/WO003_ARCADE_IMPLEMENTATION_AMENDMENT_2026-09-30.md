# WO-003 Arcade Implementation Amendment — Three-Character Demo

Date: 2026-09-30

This amendment refines the product target without invalidating the current technical qualification work.

## Keep the current Toadal-only work

The existing Toadal-only Standard Arcade cartridge remains the correct **Stage A qualification target**.

Do not restart source discovery, package isolation, sandbox work, provenance, or player-bridge work because of this amendment.

Use Stage A to prove:

- authoritative Arcade source;
- isolated cartridge;
- Standard Arcade;
- Toadal real gameplay;
- controls;
- pause/resume;
- fullscreen/exit;
- network isolation;
- package hashes;
- browser/device behavior.

## Final public product is Stage B

After Stage A passes, evolve the public preview into:

### Web roster

1. Toadal — start unlocked
2. Classic Frog (`classic`) — unlock after first completed run
3. Gully (`pelican`) — unlock at 600 best score OR after 3 completed runs

Only these three are visible in the web character chooser.

## Important economy rule

The web roster is independent of the mobile coin economy.

Do not change canonical character pricing or mobile unlock logic.

Gully remains `pelican` in the runtime and may retain his normal mobile `coinCost`.

The web host owns preview entitlement and may seed the equivalent character into the cartridge's **in-memory** ownership state for the current session after the host has determined that the web-preview unlock requirement is satisfied.

Do not write preview unlocks into the mobile `froggyFeast` save.

## Character chooser

Prefer a website/player-owned three-character chooser.

Do not expose the full standalone:

- character roster;
- shop;
- cosmetics;
- daily-goal/progression surfaces;
- Arcade variant selector

merely to support the preview.

The adapter should call the existing normal Arcade character-selection/start behavior after the website has selected an allowed preview character.

## Run format

Use natural Standard Arcade first.

Do not add a hard timer before measuring actual run duration.

Target a satisfying short-session experience of roughly 2–4 minutes.

If measured runs consistently exceed the intended website-session budget, propose a bounded web-specific cap separately and prove it does not damage normal Arcade rules.

## Preview progression

Host-owned namespace:

`toadal:game:toadal-feast-arcade-preview:v1:`

Persist only:

- overall best score;
- per-character best score;
- completed runs;
- unlocked preview character IDs;
- selected preview character ID;
- preview settings.

No account sync.

## Results screen

After every completed run, prioritize:

1. score;
2. new best / personal best;
3. unlock or progress to next unlock;
4. Replay;
5. Change Character;
6. full-game CTA.

Do not interrupt active gameplay with conversion messaging.

After all three web characters are unlocked, make the app/full-game CTA more prominent.

## Acceptance

Stage B is complete only when all three characters can start and complete real Standard Arcade runs and the web unlock rules are proven without mutating mobile economy/save state.

The final PREVIEW may be technically Stage-A-qualified before Stage B is done, but it is not considered the intended product-complete web demo until Stage B passes.

Canonical detailed references:

- `docs/implementation/WEB_ARCADE_PREVIEW_PROFILE.json`
- `docs/implementation/WEB_ARCADE_DEMO_PRODUCT_AUTHORITY_2026-09-30.md`
- `docs/implementation/WEB_ARCADE_DEMO_ACCEPTANCE.json`
