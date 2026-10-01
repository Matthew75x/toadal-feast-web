# TOADAL FEAST Website — Feature Salvage Audit

**Date:** 2026-10-01

Authority rule: `FEATURE_SALVAGE_RULES.md` says **do not assume latest means most complete** and requires meaningful features to be KEEP, IMPROVE, MERGE or RETIRE WITH RATIONALE.

## Donor inspected

`C:/ReleaseOps/toadal-games-redesign-20260925/site/src/scripts/app.js` contains real working browser-local progression/interaction code. The donor is useful implementation evidence but its Grove/Toto visual authority is superseded.

| Feature | Donor evidence | Decision | What is reusable | Required adaptation / rationale |
|---|---|---|---|---|
| Guest progression state | `toadal-games-redesign-20260925/site/src/scripts/app.js` lines 4–110 | **MERGE / REBUILD CONTRACT** | Working localStorage state, streak, Sparks and render hooks exist. | Do not keep `toadal-games-portal-v1`; migrate behavior to `toadal:web:v1:*`, add `schemaVersion`/`updatedAt`, quarantine invalid records, separate content definitions from player state, and avoid fixed economy values in schema. |
| Hidden Feast Treat collection | app.js lines 190–200 + historical hero-treat CSS | **IMPROVE / SALVAGE** | Click-to-collect Treats, Sparks reward and quest reaction are implemented. | Use current labeled food library and current companion event system; persist collected IDs/discoveries under current guest schema; do not hard-code three treats as permanent product economy. |
| Quest board / discovery quest | app.js lines 69–105 and 171–200 | **MERGE** | Three-part world/genie/treat quest and progress rendering work. | Convert to definition-driven quests and separate player quest state per `PROGRESSION_STATE_CONTRACT.md`; current copy/rewards become examples, not authority. |
| Daily reward | app.js lines 219–247 | **IMPROVE / SALVAGE** | Seven-day UI and one-claim-per-day behavior exist. | Use explicit period IDs/dates, configurable rewards, safe clock/streak recalculation and current guest state. Old +Spark values are not canonical. |
| Mobile drawer / focus trap | app.js lines 112–147 | **KEEP CURRENT IMPLEMENTATION** | Historical donor has keyboard/Escape/focus return behavior. | Current site already has verified mobile menu behavior; do not regress by replacing it. |
| Game filters | app.js lines 149–168 | **SALVAGE IF NEEDED** | Accessible pressed-state filters and empty/count state exist. | Use only if it advances Play manifest requirements; adapt to current game registry/status taxonomy. |
| Contextual Toadal tips | app.js lines 203–215 | **RETIRE OLD IMPLEMENTATION / KEEP INTENT** | Rotating guide tips exist. | Current semantic companion system supersedes this simplistic click-tip behavior. Salvage copy concepts only if approved. |
| Daily/session break reminder | app.js lines 249–266 | **DEFER** | One-hour gentle reminder exists. | Not a current manifest blocker. Preserve as optional donor; do not spend priority credits unless owner reactivates it. |
| Feast Catch mini-game | app.js lines 268–341 | **RETIRE FROM CURRENT INITIAL WEB-GAME PLAN** | A working 15-second catch mini-game exists. | Later owner direction excludes Feast Catch from the initial website free-game set. Preserve historically; do not resurrect as a priority. |
| Environmental parallax | app.js lines 343–359 | **MERGE BOUNDED** | Reduced-motion-aware parallax exists. | Use only on scenic heroes, clamp motion, retain semantic state under reduced motion, and measure performance. |
| Sparks / streak UI | historical CSS + app.js render hooks | **IMPROVE / SALVAGE** | UI counters and state rendering exist. | Re-skin to current TOADAL FEAST design system; exact counts/reward values must be configurable and truthful. |
| Old Grove/Toto visual shell | `toadal-games-redesign-20260925` design documents/CSS | **RETIRE AS AUTHORITY** | Contains useful engineering/interaction donors. | Do not import Grove/green-Toto/left-rail/dashboard authority; later TOADAL FEAST-first authority wins. |

## Key technical finding

The old donor's state is stored under `toadal-games-portal-v1` with fields such as `sparks`, `streak`, `dailyDay`, `treats`, `bestFeast` and a nested quest object. This proves the product behaviors were implemented before, but the model predates the current guest progression contract.

The current contract requires namespaced records such as `toadal:web:v1:feast-pass`, `toadal:web:v1:quests`, `toadal:web:v1:discoveries` and `toadal:web:v1:profile`, with `schemaVersion`, `updatedAt`, corruption recovery, future reset support, and separation of content definitions from player state.

Therefore the correct strategy is **behavior salvage + schema rebuild**, not copy/paste and not greenfield reinvention.

## Recalibrated implication

Guest-local Feast Pass, Treats, quests and daily rewards should move earlier in the website plan because working donor behavior exists and the backend is not required. Account sync remains deferred.

Feast Catch remains historical only because later owner direction excludes it from the initial free web-game set.
