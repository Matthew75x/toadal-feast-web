# Home LOCK_VISUAL reconciliation candidate — 2026-10-01

**Manifest row:** #1 Home (`LOCK_VISUAL`)

**Base:** `ops/manifest-recalibration-20261001@914a79f0e36c003583282ea7461cb9f8aba8d52a`

**Branch:** `work/home-manifest-lock-visual-20261001`

## Acceptance target

The controlling visual target remains `docs/review/WO-002/evidence/approved-home-visual-authority.png` (SHA-256 `4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608`). This branch does **not** mark Home DONE; owner visual acceptance remains required by the manifest-control ledger.

## What changed

- Restored the approved dense portal hierarchy instead of treating Home as a long editorial landing page.
- Desktop hero reduced to a compact world-first band with canonical victory Toadal, dominant Play CTA and secondary App CTA.
- Browser Games and Feast Pass are paired in the same desktop band.
- Home shows the authority-approved four browser listings only; Arcade remains withheld from the game grid and appears only as a truthful What's Next state.
- Today becomes a compact ribbon rather than a full section.
- Characters / World / Stories & Media are presented as a single dense discovery band.
- App conversion and What's Next share one lower desktop row.
- Mobile Home no longer serializes the full desktop layout into a ~7k-pixel stack; games/discovery use compact two-column layouts and Today is omitted from the mobile summary.
- Persistent contextual Toadal was restored to fixed bottom-right placement after an earlier convergence pass had moved it into document flow.
- What's Next resolves to the approved maintenance/construction Toadal artwork.
- The implementation was consolidated into one Home-specific CSS layer rather than committing a stack of iterative override blocks.

## Measured convergence

- Prior combined-candidate Home evidence: `docs/review/visual-convergence-20261001/home-desktop.png`, 1425x2699 full-page capture.
- Current 1440x900 Home: 1506px document height, no horizontal overflow.
- Current 1920x1080 Home: 1506px document height, no horizontal overflow.
- Current 390x844 Home: 3296px document height, no horizontal overflow.
- Persistent companion clearance: 12px desktop/wide, 10px mobile.

Current evidence:
- `docs/review/home-lock-manifest-20261001/home-desktop.webp`
- `docs/review/home-lock-manifest-20261001/home-wide.webp`
- `docs/review/home-lock-manifest-20261001/home-mobile.webp`
- `docs/review/home-lock-manifest-20261001/runtime-result.json`

## Verification

- Manifest compliance verifier: PASS — 30 rows preserved.
- Authority inventory: PASS — regenerated from reviewed source.
- Pages base path: PASS.
- Navigation truth: PASS — 0 unresolved targets.
- Home visual contract: 29/29 PASS.
- WO-001 Home verifier: 55/55 PASS.
- Cartridge storage isolation: PASS.
- `dist/public/games/` diff versus manifest-control base: none.
- Browser console errors: 0.
- HTTP/resource failures: 0.
- Horizontal overflow: 0 at 1440, 1920 and 390 widths.
- Construction companion artwork: PASS (`maintenance.webp`).

## Deliberately unresolved / not allowed to fake

- Final franchise wordmark artwork is not present in the current website asset set; the header continues to use the current clean text treatment plus canonical crown accent.
- Feast Pass is still truthful/planned until the parallel guest-progression lane lands real browser-local data.
- App Store / Google Play destinations and current approved product screenshots remain unverified, so store actions stay disabled.
- The approved mockup visually shows a fifth Arcade-style game card, but current authority requires four Home listings and Arcade withheld; truth wins over literal mockup mimicry.
- Dedicated mobile bottom navigation remains a cross-cutting manifest gap and is not introduced by this Home-only branch.

## Promotion rule

Do not promote this branch solely because automated checks are green. Home is `LOCK_VISUAL`; owner visual review is still the acceptance gate. If accepted, integrate it with the guest-progression lane and then refresh manifest row #1 evidence without changing the denominator.
