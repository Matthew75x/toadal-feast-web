# Mobile interaction runtime closure — 2026-10-05

Starting live/staging authority: `0132cb22cfbf821ec597d32a97f60d556ead7e97` on `staging/live-visual`.

## Scope

This is a bounded source-first interaction repair. It does not redesign the website or alter protected browser-game payloads.

- Added a real persistent Toadal **hidden** state, separate from minimized/expanded state.
- Added an explicit 44×44 **Hide Toadal** control to the companion panel.
- Added double-tap/click hide as a pointer shortcut while retaining single-tap minimize/restore.
- Added an unobtrusive **Show Toadal** recovery control in the footer.
- Hidden Toadal is removed from pointer/focus interaction with `aria-hidden` + `inert`, and the state persists across routes.
- Corrected toggle accessibility labels to **Expand Toadal companion** / **Minimize Toadal companion**.
- Replaced the fullscreen game's 143×44 text pill with a visually compact translucent icon while preserving a 44×44 target, DOM text, accessible label, title, and safe-area positioning.

## Source and projection

Authoritative source changes:
- `studio-project/toadal-feast-website/collections/advanced-code.json`
- `studio-project/toadal-feast-website/reference/assets/css/site.css`

The source runtime was deterministically projected into all 33 generated website HTML pages and the reference CSS was copied byte-for-byte to `dist/assets/css/site.css`. No file under `dist/public/games/` changed.

## Qualification

Focused Node tests:
- `node --test scripts/mobile-interaction-closure.test.mjs scripts/protected-game-artifacts.test.mjs`
- Result: **9 PASS, 0 FAIL**

Mobile browser QA against the patched local export:
- 320×800: PASS
- 360×800: PASS
- 390×844: PASS
- 430×932: PASS

Verified in browser:
- same-screen-position double tap hides Toadal;
- explicit hide control is 44×44;
- hidden state persists after route navigation;
- restore control clears hidden state;
- hidden companion is visually hidden and inert;
- fullscreen wrapper enters fullscreen;
- exit control is exactly 44×44 at an 8px safe-area edge;
- visible text pill is suppressed while `Exit full screen` remains as DOM text and accessible name.

Repository checks:
- `git diff --check`: PASS.
- protected-game diff: empty.
- protected-game artifact regression suite: PASS.

## Pre-existing baseline issue

Before this patch, the untouched live commit's broad `node --test scripts/*.test.mjs` suite already contained projection failures because `scripts/vendor/owner-authoring-renderer.mjs` does not match the SHA-256 stored in its provenance JSON. That provenance gate was not weakened, bypassed, or changed by this repair. The interaction closure is qualified with focused tests that do not depend on that already-broken renderer pin.
