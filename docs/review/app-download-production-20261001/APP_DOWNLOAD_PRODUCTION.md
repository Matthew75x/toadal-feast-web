# TOADAL FEAST App / Download Production — Closure Report

## Result

**PASS — App / Download production package completed on a dedicated parallel branch.**

This lane converts the Home mobile-app banner and the dedicated `/app/` page from mostly illustrative placeholders into truthful, real-gameplay product surfaces using actual Arcade, Puzzle, and Feastfall captures.

- Starting baseline: `fbcc41a7e5ac36ca8362f503557968090119e5f1`
- Branch: `parallel/app-download-production-20261001`
- No push or deployment was performed.
- `main`, staging, and production were not changed by this lane.

## Product decisions

1. **Real gameplay leads the App presentation.**
   - Arcade is the primary phone-format capture.
   - Puzzle and Feastfall are supporting real-gameplay captures.
   - The screenshots are explicitly presented as mobile-game imagery, not as separate browser games.

2. **Store truth is preserved.**
   - App Store and Google Play controls remain disabled.
   - No unverified store destination URL is exposed.
   - Existing canonical truth wording is retained: store links remain unavailable until verified destinations exist.

3. **The persistent floating companion remains the character presence.**
   - A second decorative Toadal inside the App composition was tested and rejected because it produced duplicate mascot clutter.
   - The production markup therefore contains no additional section-local Toadal.
   - The existing floating companion remains free to react and move independently.

## Real-gameplay authority and runtime budget

The runtime derivatives were produced from the previously captured real game screens; raw PNGs are not shipped in the new runtime directory.

| Runtime asset | Dimensions | Bytes | Runtime SHA-256 | Source capture SHA-256 |
| --- | ---: | ---: | --- | --- |
| `arcade-real-gameplay.webp` | 360×600 | 63,302 | `c141021348f5937d9ff6de7358aee0b038cab9fddf65c5141780a44291598ef9` | `7de33df99d04b06cdec742da97a67a485af1f1bc1c7bc6c9d7441685e58a03de` |
| `puzzle-real-gameplay.webp` | 640×360 | 43,436 | `c52dfa60185ac2fca83f2cc97b6c3baf369bcd0ff1389ee106135062016d6dfa` | `5a8535169478a625bff53702a565e3ed6806da9e7f9a82b550c91700b5e879bc` |
| `feastfall-real-gameplay.webp` | 640×360 | 35,300 | `362d3d36bf3f8faf19f9db7bf63d0a8abeb1883662210fc4f992e05c5fd56afa` | `80021dafb7b0028e124efcd5a094340725f356163f58dcc3bbf397805be7f766` |

Total new gameplay runtime payload: **142,038 bytes**, below the dedicated 150 KB budget.

The three derivatives are registered in the Studio asset index and visual-asset authority lock with `real-gameplay` tags and their source-capture provenance.

## Home App banner

The Home App section now provides:

- stronger “flagship adventure” hierarchy;
- a real Arcade phone screen;
- real Puzzle and Feastfall supporting cards;
- explicit Arcade / Puzzle / Feastfall labels;
- a “See real gameplay” route to `/app/`;
- disabled App Store / Google Play controls;
- clear store-destination status;
- scoped desktop and mobile styling.

The section remains compact on desktop and becomes an intentional stacked composition on small screens rather than a compressed desktop layout.

## Dedicated /app/ page

The App page now includes:

- real-gameplay hero composition;
- truthful disabled store controls;
- direct links to Play and World;
- a dedicated “Three ways the Feast plays” gallery;
- Arcade, Puzzle, and Feastfall descriptions;
- explicit language that these are mobile-game captures, not browser-game listings;
- existing floating companion support;
- responsive mobile layout.

## Browser evidence

A disposable Pages-base-path preview was generated from the frozen qualified dist plus this lane’s source changes. It was not committed or deployed.

Final browser evidence covered:

- Home App: 1440×900
- Home App: 430×932
- Home App: 390×844
- Home App: 320×800
- App hero: 1440×900
- App hero: 390×844
- App gameplay gallery: 1440×900
- App gameplay gallery: 390×844

Across all eight checks:

- target component found: **PASS**
- horizontal overflow: **0**
- all expected images loaded: **PASS**
- Home/App hero store controls remained disabled: **PASS**

Evidence:
- `evidence/home-app-1440x900.webp`
- `evidence/home-app-390x844.webp`
- `evidence/app-hero-1440x900.webp`
- `evidence/app-hero-390x844.webp`
- `evidence/app-gallery-1440x900.webp`
- `evidence/app-gallery-390x844.webp`
- `evidence/final-browser-evidence.json`

## Regression protection

Added `scripts/verify-app-download-production.mjs`.

It verifies:

- exact hashes, bytes, dimensions, and paths for all three gameplay captures;
- real-gameplay tags in the asset index;
- authority-lock coverage;
- total runtime gameplay payload ≤150 KB;
- no raw PNGs in the App runtime image directory;
- required Home and App-page markup;
- exactly two disabled store controls on each relevant product surface;
- absence of unverified App Store / Google Play URLs;
- truthful mobile-vs-browser distinction;
- no duplicate section-local Toadal;
- responsive/reduced-motion App component CSS.

The pre-existing Home visual contract was updated only where its old assertion specifically required the retired decorative App illustration. The replacement check is stronger: it now requires all three registered real-gameplay assets, their Home references, the REAL GAMEPLAY label, and disabled store controls.

## Qualification

- App / Download production verifier: **PASS**
- Character content registry: **PASS**
- Visual asset authority: **PASS**
- Home visual contract: **37/37 PASS**
- Navigation truth: **PASS**
- Required Node suite: **48/48 PASS**
- `git diff --check`: **PASS**

No existing product-state test was weakened to hide a failure. The one stale App-illustration expectation was replaced with the stronger real-gameplay contract described above.

## Studio integration note

This parallel environment does not contain the authoritative TOADAL Studio 1.4.2 render environment used by Codex. Therefore this lane does **not** claim a fresh authoritative Studio render.

The source/component package, runtime assets, browser proof, and regression checks are complete. After integration onto the current Codex candidate—especially Interactive Discovery V1 `40e4437c00951d9b9903c3a188d32f54d5a49ef3`—Codex should run the normal authoritative Studio validation/render/export/checkpoint and integrated owner-preview gate.

That is an integration qualification step, not unfinished App/Download design work.

## Scope boundary

This lane did not alter:

- floating companion architecture;
- Interactive Discovery V1 behavior;
- Feast Pass progression;
- browser-game launch states;
- Stories/Manga/Reader publishing state;
- Search;
- production or `main`.

The App / Download production component itself is complete and intentionally cherry-pickable.
