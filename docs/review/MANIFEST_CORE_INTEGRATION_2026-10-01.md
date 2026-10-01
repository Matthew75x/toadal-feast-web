# Manifest Core Integration - 2026-10-01

**Branch:** `integration/manifest-home-characters-progression-20261001`
**Integration merge:** `945c7ea1b0bc417cbbf2b7b6b3ca3b366114a9da`
**Manifest-control base:** `914a79f0e36c003583282ea7461cb9f8aba8d52a`

## Integrated lanes

- Home LOCK_VISUAL candidate: `d4219fb9a7e8598512e142da4acafeb06225f293`.
- Characters Hub + Toadal Profile candidate: `b1c837acb73137f75283223e57b080d7ec34484e`.
- Guest-local progression candidate: `1f953861ca2a8d06773bb2f49267e3ccec06db7d`.

Manifest rows advanced in the integrated candidate: **1, 6, 7, 14, 15, 16, 20**.

None of these rows is marked DONE merely because the merge or automated checks pass.
## Merge reconciliation

The only merge conflict was the two generated/source copies of `assets/css/site.css`.

The resolution preserves the complete Home + Characters stylesheet from the first parent, then appends only the scoped guest-progression block from the progression parent. Source and `dist` CSS hashes match after reconciliation.

No standalone game cartridge files were changed.

## Verification

- Manifest compliance verifier: PASS, 30 rows.
- Guest progression unit tests: **17/17 PASS**.
- Character content registry: PASS.
- Home visual contract: **29/29 PASS**.
- WO-001 Home verifier: **60 checks PASS**.
- Pages base-path verification: PASS.
- Navigation truth: PASS, 0 unresolved targets.
- Cartridge storage isolation: PASS.
- `git diff --check`: PASS.
- Source/dist stylesheet SHA-256 parity: PASS.
## Combined browser smoke

Browser-tested Home, Characters, Toadal Profile, Feast Pass, Quests, Rewards, Guest Profile, World and Stories at 1440x900 and 390x844.

Result: **0 failures, 0 console errors, 0 HTTP/resource failures**.

- No horizontal overflow on the tested routes.
- No broken images.
- Guest progression stays unloaded on Home / Characters / Toadal Profile.
- Guest progression loads on Feast Pass / Quests / Rewards / Profile / World / Stories.
- Only approved `toadal:web:v1:*` storage keys were observed.
- Home What's Next still resolves to the maintenance artwork with `construction` reaction.

Combined smoke result: `docs/review/manifest-core-integration/browser-smoke.json`.
## Truth and promotion boundary

- Home remains **PARTIAL_CANDIDATE** because `LOCK_VISUAL` still requires owner visual acceptance.
- Characters Hub and Toadal Profile remain **PARTIAL_CANDIDATE** because their content is preview-bounded and owner visual acceptance is still pending.
- Feast Pass / Quests / Rewards / Profile remain **PARTIAL_CANDIDATE** because starter economy values are explicitly non-canonical and Treat/account/entitlement systems are not complete.
- `main`, `staging/live-visual`, production and DNS are unchanged.
- No Pages deployment occurred.

Promotion requires integrated visual review, especially Home, before moving this candidate to `staging/live-visual`.
