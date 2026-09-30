# TOADAL FEAST Web Arcade Demo — Product Authority

Date: 2026-09-30  
Status: owner-directed product authority for WO-003 implementation after the Toadal-only isolation/runtime qualification gate.

## Product definition

The website Arcade experience is **not the full TOADAL FEAST mobile game**.

It is a deliberately bounded, replayable web demo that should feel like a complete small game:

> enter → play Standard Arcade → finish a run → see score/best → unlock a character → replay → eventually discover the full app

The technical Toadal-only cartridge remains useful as the **first qualification stage**, but it is not the intended final public demo.

## Final web roster

The public web preview should expose exactly three Arcade characters:

| Web order | Runtime id | Display name | Availability |
|---|---|---|---|
| 1 | `toadal` | Toadal | Start unlocked |
| 2 | `classic` | Classic Frog | Unlock after first completed run |
| 3 | `pelican` | Gully | Unlock at 600 best score OR after 3 completed runs |

Why this trio:

- **Toadal** is the franchise mascot and showcases the most distinctive TOADAL FEAST mechanics.
- **Classic Frog** gives an immediately understandable traditional frog/tongue play style.
- **Gully** is mechanically different enough to make the third unlock feel meaningful instead of cosmetic.

The runtime character id for Gully is **`pelican`**.

The mobile game currently prices Gully separately. The web preview must **not** rewrite or weaken the mobile economy. Web-demo unlock entitlement is a separate host-owned state.

## Unlock philosophy

The demo should reward quickly.

### Classic

Unlock after the first completed run.

This gives the player a guaranteed first payoff and immediately communicates that the preview has progression.

### Gully

Unlock when either condition is satisfied:

- best score reaches **600**, or
- the player completes **3 runs**.

The 600-point value is grounded in the existing Arcade balance authority, which already describes 600 points as a meaningful early best-score milestone reachable in roughly 2–4 solid runs.

The three-run fallback prevents a less-skilled player from becoming stuck behind a hard score wall.

This is a **web-preview progression rule**, not a mobile unlock rule.

## Run format

Version 1 should **not add a hard timer merely because this is a demo**.

Use the normal Standard Arcade completion/game-over loop first.

Design target:

- typical satisfying run: about 2–4 minutes;
- high score is the main repeat-play motivator;
- normal Arcade hazards/hearts/end condition remain authoritative.

During qualification, measure bounded real-play run duration.

Only introduce a web-specific time cap if normal runs are consistently too long for the website funnel. A time cap should therefore be a data-driven follow-up, not an automatic gameplay fork.

## Results-screen priority

The result screen must reward the player before marketing to them.

Order:

1. current run score;
2. **NEW BEST** / personal-best comparison;
3. newly unlocked character or progress to the next unlock;
4. Replay;
5. Change Character;
6. full-game/app conversion.

Do not show an interruptive app-conversion modal in the middle of play.

Conversion intensity:

- first visit: subtle;
- first completed run: subtle;
- first unlock: visible but secondary;
- web roster complete or meaningful repeat engagement: prominent.

A successful web-demo completion message may say that all three web characters are unlocked and invite the player to discover the larger full-game roster and modes.

## Persistence

Website-owned isolated storage may persist only the small web-demo state:

- overall best score;
- per-character best scores;
- completed run count;
- unlocked web character ids;
- selected web character id;
- preview settings.

Namespace:

`toadal:game:toadal-feast-arcade-preview:v1:`

Do not use or mutate the mobile `froggyFeast` save.

Do not claim account sync.

If the iframe remains opaque-origin, the host owns persistence and exchanges only explicit preview state through `toadal.game.v1`.

## Character entitlement bridge

The website owns the three-character preview roster.

The cartridge adapter may translate website preview entitlement into **session-only runtime ownership** so that the existing Arcade character implementations can be selected normally.

Example:

1. website loads its isolated preview state;
2. website sends unlocked preview ids through the host protocol;
3. adapter seeds the matching ids into the cartridge's in-memory Arcade ownership state for this session;
4. adapter calls the existing normal character-selection/start path;
5. no mobile coins, prices, or durable mobile save records are changed.

Forbidden:

- changing canonical `CHARACTER_DATA.coinCost`;
- granting mobile currency;
- writing web preview unlocks into `froggyFeast`;
- exposing general parent localStorage to the iframe;
- enabling the full standalone shop/character economy just to support the three-character demo.

## UI ownership

The **website/player shell** should own the visible three-character chooser.

Do not expose the full standalone character/shop/cosmetics/menu surface if it can be avoided.

The visible chooser should only show:

- Toadal;
- Classic Frog;
- Gully.

Locked cards should clearly show the requirement.

Examples:

- Classic Frog — “Complete your first run”
- Gully — “Reach 600 best score or complete 3 runs”

Once unlocked, switching character should be immediate and should not involve coins.

## Deliberately excluded from the web demo

- Puzzle
- Feastfall
- Infinite
- TC / FEAST FRENZY as a selectable full Arcade variant
- 5 Minute Feast
- Zen
- full Arcade character roster
- shop
- cosmetics economy
- daily goals
- mobile currencies
- mobile achievements/progression
- mobile save import/export
- cross-device progression
- global leaderboard
- account requirement

These exclusions are intentional product boundaries, not missing features.

## Efficient implementation sequence

Do not rebuild Arcade.

1. Qualify the isolated Standard Arcade + Toadal cartridge first.
2. Preserve that exact source/package authority.
3. Add the website-owned three-character demo profile.
4. Add isolated preview progression and entitlement bridge.
5. Prove all three characters can start/play/finish real Standard runs.
6. Add result/unlock presentation.
7. Measure natural run duration.
8. Capture runtime request/reachability evidence.
9. Trim only proven-unused files.
10. Re-run browser/mobile/package qualification.

This sequencing prevents game-design polish from hiding fundamental cartridge/isolation defects and prevents premature package trimming from creating regressions.

## Acceptance standard

A first-time visitor should be able to:

1. understand the goal without reading a manual;
2. start with Toadal;
3. complete a real Arcade run;
4. see a score/best-score result;
5. unlock Classic Frog immediately after the first completion;
6. replay using Classic;
7. make visible progress toward Gully;
8. unlock Gully through skill or three-run persistence;
9. play a real Gully run;
10. understand that the web roster is complete while the full TOADAL FEAST app contains the larger experience.

The emotional target is not “I hit the demo limit.”

It is:

> “That was a complete little game. What else is in TOADAL FEAST?”

## Relationship to WO-003

WO-003's current Toadal-only isolation/package work should continue.

Do **not** interrupt a valid technical qualification merely because this product profile evolved.

Interpret the stages as:

- **Stage A:** Toadal-only = technical qualification gate.
- **Stage B:** 3-character progression = intended public preview product.
- **Stage C:** package trimming and final polish after runtime proof.

The public PREVIEW should not be considered product-complete until Stage B is qualified.
