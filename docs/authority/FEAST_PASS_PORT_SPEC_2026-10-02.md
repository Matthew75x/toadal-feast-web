# TOADAL FEAST — Feast Pass / Treat / Reward Port Specification

**Date:** 2026-10-02  
**Target:** manifest rows 14–16 and Profile integration  
**Rule:** preserve the current website progression store; port proven donor behavior into it.

## 1. Current state authority

Current runtime:
`studio-project/toadal-feast-website/reference/assets/js/guest-progression.js`

Current definitions:
`studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js`

Current storage:
- `toadal:web:v1:feast-pass`
- `toadal:web:v1:quests`
- `toadal:web:v1:discoveries`
- `toadal:web:v1:profile`

Current pass already stores:
- level
- XP
- Sparks
- Treat count
- streak
- badges
- collectibles

Current quest state already stores:
- progress
- completedAt
- claimedAt
- processed event IDs
- daily claimed period

Current discovery state already stores:
- discoveries
- Home collectible state
- Golden Block state

Do not create another save system.

## 2. Proven historical donor behavior

Historical Grove/TOADAL portal already proved:
- hidden Treat collection
- Explorer Passport/HUD
- Sparks/streak presentation
- daily claim
- seven-day reward presentation
- quest completion
- reward unlock
- route discoveries
- browser persistence
- optional sound
- reduced-motion behavior

Use the interaction ideas, not the old state keys or old branding.

## 3. Treat closure

The current site already owns three collectible candy assets and IDs:

Home interaction IDs:
- `portal-candy`
- `lower-page-candy`
- `golden-block-candy`

Existing assets:
- blue candy
- green candy
- purple candy

Current `collectHomeCandy()` persists them in `discoveries.homeInteraction.candies`.

Correct final behavior:
- each unique successful collection also contributes one browser-local Treat;
- collection is idempotent;
- Golden Block Treat remains locked until the fourth hit;
- repeated clicks never mint duplicate Treats;
- Treat count is derived/updated from unique approved local collectibles, not arbitrary clicks.

Prefer a deterministic mapping such as:

```
portal-candy       -> local Treat collectible A
lower-page-candy   -> local Treat collectible B
golden-block-candy -> local Treat collectible C
```

Titles/descriptions should stay descriptive and non-lore-heavy unless approved. Example phrasing:
- Blue Feast Treat
- Green Feast Treat
- Purple Feast Treat

Do not create canon/history around them.

## 4. Current-schema implementation approach

When `collectHomeCandy(id)` succeeds:

1. validate ID against the existing allowlist;
2. update discovery/Home interaction;
3. ensure matching collectible ID exists once in `pass.collectibles`;
4. set/recalculate `pass.treats` from valid unique local Treat collectibles;
5. save `discoveries` and `pass` atomically using the existing `saveMany()` pattern;
6. emit a semantic event for UI/companion/quest reaction if useful.

Do not increment Treats before persistence succeeds.

Do not make Treats a paid/transferable currency.

## 5. Treat definitions

`progression-definitions.js` currently has:
`treats: []`

Fill this with editable, explicitly local starter definitions using the existing assets/IDs.

Definitions should carry:
- stable ID
- display title
- source interaction ID
- asset ID
- local-only / non-entitlement status
- optional short descriptive copy

Do not use permanent economy values.

## 6. Quest closure

The current quest engine is already definition-driven, but `recordEvent()` currently handles route visits only.

Preserve existing route quests.

Add only bounded generic event support needed for the manifest, for example:
- route visit
- Treat collected
- browser game completed / score recorded

Recommended local starter quest set:
- Explore the World
- Visit Stories
- Find a Treat
- optionally Complete a browser preview when a real cartridge emits a trusted `game:complete`

Do not fabricate Weekly/story/game quests for systems with no event source.

Quest rewards remain editable starter config and clearly non-canonical.

## 7. Rewards / collection closure

`progression-definitions.js` currently has:
`rewards: []`

Use rewards to demonstrate the finished local reward surface without creating entitlement promises.

Safe local reward types:
- badge/title marker
- collection milestone
- non-transferable local recognition

Examples that derive from real actions:
- First Treat Found
- Three Treats Found
- First Quest Complete
- Explorer milestone

Avoid:
- paid currency
- permanent mobile entitlement
- unlock claims affecting the full app
- merchandise
- account/cloud rewards

Use the existing reward companion art **only when a reward is actually earned**, consistent with the asset catalog.

## 8. Daily / streak presentation

Keep the current UTC-day claim authority.

The historical seven-day donor can inspire the UI, but do not import its values blindly.

Safe presentation:
- current streak count
- today claimed/unclaimed
- seven-day visual track/calendar
- starter-config label

If escalating daily values are used, they must remain configuration-driven and explicitly non-canonical.

## 9. Feast Pass page composition

Final Feast Pass should feel like one coherent product, not debug stats.

Required:
- branded pass identity/header
- Level / XP / Sparks / Treats / Streak summary
- progress-to-next-level
- daily check-in
- Treat/collection preview
- active quests
- reward/milestone preview
- discoveries
- links to Quests / Rewards / Leaderboards / Profile
- guest-local truth note
- account-sync future state

Keep the underlying data clear and compact.

## 10. Quests page

Required:
- Active
- Completed
- category/status treatment
- progress
- reward description
- claim action only when eligible
- empty/future categories truthfully represented
- Feast Pass / Rewards / Leaderboards / Profile navigation

Do not create fake dynamic/server rotations.

## 11. Rewards page

Required:
- earned local badges/rewards
- locked local milestones
- Treat/collection state
- clear "local preview / no entitlement" language
- no empty page when valid local milestones can be derived
- links back to Feast Pass/Profile/Leaderboards

## 12. Profile

Display only real local state:
- level
- XP
- Sparks
- Treats
- streak
- badges/selected badge if real
- discoveries
- local scores when wired
- recent/earned local milestones if available

Do not fabricate biography, canonical achievement history, connected identity or synced account state.

## 13. Companion events

Use semantic current companion events/states:
- Feast Pass / quest -> adventure guide
- Treat discovery -> excited/collection-friendly state
- earned reward -> reward celebration
- locked/future account -> account/register/construction as appropriate

Reduced motion must keep semantic state without movement.

## 14. Tests

Add/extend tests for:
- unique Treat collection increments exactly once;
- duplicate collection is idempotent;
- Golden Block collection remains locked until valid;
- discovery + pass save is atomic/fail-safe;
- corrupt/future schema behavior remains safe;
- Treat clear/reset stays within website namespace;
- quest event matching for any new event types;
- reward claim idempotency;
- daily UTC period behavior unchanged;
- no mobile/game storage writes;
- reload persistence;
- local-only truth labels remain visible.

The goal is to make Feast Pass feel complete by **wiring already-existing local progression and proven donor behavior**, not by inventing a new economy.
