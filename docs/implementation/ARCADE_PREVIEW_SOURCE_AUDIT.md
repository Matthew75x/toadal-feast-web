# TOADAL FEAST Arcade Preview — Source/Package Audit
**Date:** 2026-09-30
**Status:** CANDIDATE, not yet PUBLIC

## Source inspected
ASSIGNATOR current game source:
`C:\ASSIGNATOR\ChatGPT\Toadal-Feast-RC276`

Relevant browser entry points exist:
- `arcade-modern.html`
- `arcade-standalone.html`
- `puzzle-standalone.html`
- `feastfall-standalone.html`
- `infinite-standalone.html`
- `froggy-feast.html`

The dedicated Arcade standalone is the most appropriate candidate for a bounded browser preview.

## Direct static closure audit
A recursive static-string dependency scan beginning at:
`arcade-standalone.html`

found approximately:
- **359 directly discoverable files**
- **20,226,937 bytes**
- **19.29 MiB**

Directly discoverable breakdown:
- assets: 16.64 MiB
- runtime JS: 2.14 MiB
- generated content: 0.33 MiB
- styles/prod/themes/shared: under 1 MiB combined

This is **not yet the final cartridge size**.

## Why 19.29 MiB is not final
The runtime contains dynamic asset-directory selection and generated path templates.

Observed dynamic families include:
- Arcade food runtime assets
- non-food hazard/pickup runtime assets
- power-up candies
- multiple character animation families
- reaction art
- living-feast backgrounds
- theme/content registries

Therefore a simple HTML/CSS/JS crawler undercounts runtime-resolved files.

## Large dynamic families measured

| Runtime family | Approx. MiB |
|---|---:|
| Arcade food max-256 | 3.36 |
| Arcade non-food runtime | 0.34 |
| Arcade power-up candies | 0.47 |
| Classic high-res character | 3.74 |
| Reaction art v1 | 10.60 |
| Princess Lily current family | 7.30 |
| Gulper Arcade family | 15.54 |
| Fire high-res | 1.37 |
| Royal high-res | 3.71 |
| Count high-res | 5.49 |
| Bob Arcade | 3.16 |
| Chomper Arcade | 3.10 |
| Flytrap Arcade | 11.13 |
| Gully Arcade | 9.06 |
| Toadal Arcade | 3.84 |
| Living Feast backgrounds | 3.65 |

Blindly copying all runtime families would create a much larger package than necessary.

## Important conclusion
Do **not** copy the whole mobile game's `assets/` tree.

That tree alone is approximately:
- 736 files
- 216.85 MiB

The correct website strategy is a deliberately sealed cartridge with only the runtime behavior/assets required for the chosen Arcade preview profile.

## Recommended preview profile
For the first website cartridge:
- use the existing Arcade standalone runtime as donor;
- choose one explicit public preview configuration;
- prefer canonical Toadal as default/featured character;
- disable or omit UI paths whose assets are intentionally not included;
- keep only gameplay variants actually exposed by the preview;
- seal dependency closure after runtime testing;
- preserve product truth that this is a limited web preview, not the entire mobile app.

This must be implemented as a deliberate profile, not by deleting files until errors stop.

## Required WO-002 proof
Before marking Arcade `PUBLIC`:
1. build a dedicated cartridge directory;
2. run dependency closure audit;
3. start the game through the website player shell;
4. complete at least one real run;
5. test restart/exit/fullscreen/pause;
6. test keyboard/touch paths appropriate to the preview;
7. inspect console/network requests;
8. prove no request escapes the cartridge/site package unintentionally;
9. record package size/hash;
10. capture real screenshots.

## Other mini-games
No runnable packages were found in the current authoritative mobile-game checkout for:
- Wicked Bites
- TOADAL Tower Defense / Feast Defense
- Froggy Fruity Bash
- CLAW: Feed Gulper
- Dry Dock

Their Home/Play status remains `PREVIEW` or `PLANNED` until a real package is located or implemented.

An older website donor contains Lily Pad Leap marked `prototype`; this is not sufficient for `PUBLIC`.
