# WO-001 Parallel Visual Composition Candidate — 2026-09-30

Base branch: `work/WO-001-global-shell-home`  
Base commit: `4e0b4f32b3f6e540bb518703101732e67de9cb2f`  
Candidate branch: `design/wo001-visual-composition-20260930`

## Purpose

This is a bounded visual-composition remediation for the Home page. It does **not** restart WO-001, does not deploy, and does not begin WO-002.

The candidate directly targets the remaining visual-parity findings in `APPROVED_HOME_VISUAL_PARITY_REVIEW_2026-09-30.md` while preserving the already-passing product-truth, accessibility, responsive, navigation, and feature-state contracts.

## Major visual changes

- Stronger TOADAL FEAST franchise treatment in the header using text/CSS rather than the Android app icon.
- Hero world art is brighter and more visible.
- Canonical high-resolution Toadal victory art is now the desktop hero focal point and a compact mobile focal point.
- Hero search is visually reduced to a secondary utility.
- Desktop hero height is tightened so the browser-games/Feast Pass band enters the first viewport sooner.
- Browser games + Feast Pass are composed into one dense desktop band.
- Today is reduced to a compact current-adventure ribbon.
- Discovery remains three columns but World and Stories/Media now use richer, truthful environment artwork.
- App conversion + What’s Next are paired in the same lower desktop band.
- Contextual Toadal is presented as the visible companion control with a compact speech bubble instead of an admin-like note card.
- Player-facing operator jargon was removed from the Home copy.

## Game-card quality

Two cards now use source-qualified gameplay evidence rather than repeated generic scenery:

### Wicked Bites
- source repo: `Matthew75x/feast-crossing-wicked-bites`
- source commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- screenshot authority: `proof/V5_5_03_LANDSCAPE_844x390.png`
- source SHA-256: `c4fc02ec29a576275cf1474467116211f434400f54f6990f73f4afed1e9199b4`
- web derivative SHA-256: `02468719f59c1f891a750435d261cf8aab1e42609cea3343e70fbd08b472c4d0`
- derivative bytes: 34,526

### CLAW: Feed Gulper
- source repo: `Matthew75x/claw-feed-gulper`
- source commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- screenshot authority: `docs/browser-evidence/844x390-game.png`
- source SHA-256: `6579a55db36c81e1839ed151427e5a6c4e98c9d705abd2916f8fc54eb5d6bbe4`
- web derivative SHA-256: `a2c11d58bc7c05ef0cfe7aea01c57c27ae71bfb86c99e590420c0045d5fbca4f`
- derivative bytes: 20,930

These screenshots remain **preview art only**. Their use does not make either game launchable from the Home page.

## Canonical asset additions

High-resolution Toadal:
- authority: `assets/images/characters/reactions-v1/toadal/victory.png`
- authority SHA-256: `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`
- derivative: `toadal-victory.webp`
- derivative SHA-256: `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb`

Additional real Feast World environments:
- forest portal authority SHA-256: `84a855f13c6241eb7efa3425cda93cbde983178db48df671f366f05d421f4f71`
- derivative SHA-256: `dd9de34d884c376ef67e4b7b9ce7809b4ab92ee9f2118a8242223f1f708e5980`
- candyland scenic authority SHA-256: `a3e4105d6b5d7c5e2ceae49faaa8e10423b0d2c0b3f9e75a63a61fd3356dc15d`
- derivative SHA-256: `217403d6e20a2c22211ed8dfeff7f2b7b8a22acfd2404abe9689867bd0047a85`

Retired Princess Lily assets remain excluded.

## Repository-level checks

Current candidate results:

- `verify-home-visual-contract.mjs`: **22/22 PASS**
- `verify-wo001-composition-candidate.mjs`: **17/17 PASS**
- navigation truth: **PASS**
- Pages/base-path tests: **8/8 PASS**
- canonical asset audit: **10/10 PASS**
- `git diff --check`: **PASS**

## Structural-preview screenshots

These screenshots are generated from the Studio project graph with a small local structural renderer so the visual direction can be inspected before spending a full Studio certification cycle.

They are **not** final Studio evidence and must not replace the required Studio 1.4.2 render/export/browser qualification.

- `home-1600x900-structural-preview.webp`
- `home-390x844-structural-preview.webp`
- `home-1600x2600-structural-preview.webp`

The desktop structural preview now visibly shows:
- a strong franchise header;
- a bright panoramic hero;
- a much larger canonical Toadal;
- the browser-games + Feast Pass combined band;
- denser vertical rhythm;
- richer discovery surfaces;
- App + What’s Next pairing;
- the compact character-like Toadal helper.

The mobile structural preview keeps the world art visible, retains the hero hierarchy and Toadal focal point, and collapses the portal layout to a single readable column without horizontal overflow.

## Final acceptance boundary

This branch is a visual candidate only.

Before WO-001 can be accepted, the active closure lane must still:
1. integrate or reproduce the candidate changes on the authoritative WO-001 branch;
2. run Studio 1.4.2 validation/render/export/checkpoint;
3. capture the exact required six viewport screenshots;
4. rerun browser/accessibility checks;
5. compare the exact final screenshots to the approved Home visual authority;
6. issue the final PASS/FIX/BLOCKED receipt.

No production deployment is authorized by this candidate.
