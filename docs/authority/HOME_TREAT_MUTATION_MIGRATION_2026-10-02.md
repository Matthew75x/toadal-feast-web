# TOADAL FEAST — Home Candy → Treat Mutation / Migration Contract

**Date:** 2026-10-02  
**Scope:** final Feast Pass Treat wiring

## Existing qualified behavior

Home currently stores three unique candy discoveries in:

`toadal:web:v1:discoveries -> homeInteraction.candies`

Stable interaction IDs:
- `portal-candy`
- `lower-page-candy`
- `golden-block-candy`

The Golden Block path is already qualified:
- four deliberate hits;
- final candy remains unavailable until hit 4;
- collection is idempotent;
- Home emits `toadal:candy-found` only after `store.collectHomeCandy(id)` succeeds.

Current Home interaction code does **not** grant Treats.

Current guest progression already owns:
- `pass.treats`
- `pass.collectibles`

Current progression schema defines collectibles as:
```json
{ "id": "string", "count": integer >= 0 }
```

## Required final invariant

For approved Home candy/Treat mappings:

> one valid unique collected Home candy corresponds to one local Treat collectible and contributes exactly one to the browser-local Treat total.

No click, animation, hover or repeated event may grant an extra Treat.

## Atomic new collection path

When a new Home candy is collected:

1. refresh both `discoveries` and `pass`;
2. validate both records are writable/current schema;
3. validate the candy ID against the existing Home allowlist;
4. preserve Golden Block gating;
5. reject already-collected candy;
6. add candy to `discoveries.homeInteraction.candies`;
7. add the mapped Treat collectible once to `pass.collectibles`;
8. recompute/maintain `pass.treats` consistently;
9. save `discoveries` + `pass` atomically through the existing `saveMany()` rollback pattern;
10. return success only after both writes succeed.

Do not:
- write Discoveries first and Pass second with no rollback;
- grant from the UI `toadal:candy-found` event separately;
- increment `pass.treats` on every click;
- treat Golden Block hits as Treat grants.

The UI event remains a reaction/notification seam, not economy authority.

## Existing-user reconciliation

Important: valid current users may already have Home candies stored from the qualified pre-Treat implementation.

Example valid old state:

```js
discoveries.homeInteraction.candies =
  ["portal-candy", "lower-page-candy", "golden-block-candy"]

pass.treats = 0
pass.collectibles = []
```

Final implementation must not require those candies to be clicked again.

### Safe migration rule

Provide an explicit reconciliation path that:

- reads the valid current Home candy list;
- maps only known approved candy IDs;
- adds only missing corresponding local Treat collectibles;
- recomputes the Treat count deterministically;
- is idempotent;
- writes only current writable records;
- never overwrites a future-version record;
- never repairs malformed Home-interaction data by guessing.

This may be called during a deliberate progression boot/migration step or before rendering Feast Pass/Rewards/Profile.

Avoid hidden write-on-read behavior inside a generic `getSnapshot()` if it would violate existing expectations that simply reading corrupted/malformed state does not mutate storage.

## Suggested stable mapping

The exact display names remain editable, but stable IDs should be deterministic.

Example:

```js
{
  "portal-candy":       "treat-home-blue",
  "lower-page-candy":   "treat-home-green",
  "golden-block-candy": "treat-home-purple"
}
```

Use existing approved candy art/asset IDs.

Do not create lore around these treats unless approved.

## Collectible shape

Prefer the schema-compatible object form:

```js
{ id: "treat-home-blue", count: 1 }
```

For these V1 Home collectibles:
- count is 0 or 1;
- duplicate entries for the same ID are invalid/canonicalized safely;
- Treat total should be consistent with the approved Treat collectible counts.

Do not store the same logical Treat once as a string and once as an object.

## Failure semantics

If Pass is future-version/read-only:
- do not partially add a new candy discovery that cannot receive its Treat;
- return a truthful read-only/future-schema failure.

If Discoveries is future-version/read-only:
- do not change Pass/Treat state.

If one storage write throws:
- rollback both records using the existing atomic `saveMany()` behavior;
- report storage unavailable;
- UI must not announce successful collection.

## Golden Block

`hitGoldenBlock()` remains discovery-only.

Only `collectHomeCandy('golden-block-candy')` after the fourth hit grants the corresponding Treat.

This preserves:
- hit animation semantics;
- no reward on partial crack;
- no reward on the fourth hit until the revealed candy is actually collected.

## Quest integration

If a quest such as “Find a Treat” is added:

- derive it from the successful Treat/candy collection transaction;
- ensure the quest event is also idempotent;
- quest reward is separate from the Treat itself.

Do not use a quest completion as the authority for whether the Treat was collected.

## Required tests

Add focused coverage for:

1. first portal candy -> exactly 1 Treat;
2. duplicate portal candy -> still exactly 1;
3. lower-page candy -> exactly 2 total;
4. Golden Block hits 1–3 -> no Treat change;
5. hit 4 alone -> no Treat change;
6. collect revealed Golden Block candy -> exactly 3;
7. reload preserves 3;
8. pre-Treat valid candy state reconciles to 3 exactly once;
9. reconciliation rerun is idempotent;
10. corrupt Home interaction remains read-only and is not migrated;
11. future Discoveries schema receives no write;
12. future Pass schema receives no partial discovery write;
13. simulated second-write failure rolls both records back;
14. clear removes both Treat and candy state within the existing four-key namespace;
15. unrelated game/mobile storage remains untouched.

This migration detail is required for a complete Treat implementation; otherwise existing qualified Home users can be stranded at zero Treats.
