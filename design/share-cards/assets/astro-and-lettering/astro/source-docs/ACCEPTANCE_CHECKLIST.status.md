# Arcade HUD acceptance checklist: status

Target: `prototype/arcade-hud-theme-20260923` @ `1b0acef`. This work is an uncommitted patch against the handoff
snapshot (`repo-context/`); no commit, push or merge was made on the real repository.

Legend: **VERIFIED** = checked and passing here. **HARNESS ONLY** = checked in the stand-in preview harness (real CSS,
real markup and real Astro sync code over stub state), which the handoff says does not prove acceptance.
**NOT VERIFIED** = needs the real game or a device. **CANNOT RUN** = attempted and blocked by the snapshot.

Totals over 50 rows: 9 verified, 22 harness only, 15 not verified, 4 cannot run.
No row is marked as passing on the strength of a stand-in alone.

## Assets
| Row | Status | Evidence / note |
|---|---|---|
| All three source sheets are used in runtime derivatives. | **VERIFIED** | score-frame.png (scoreboard sheet), health-frame.png (hearts sheet), pause.png and action-ring.png (button sheet). `asset-map.json`. |
| Derivative crops retain source frame art and transparency. | **VERIFIED** | 0 enclosed alpha holes, no art touching a crop edge, rims intact. Interiors are reconstructed where baked text was removed. `evidence/astro-hud-assets-over-backgrounds.png`. |
| Baked sample score, count, reward, heart, and ACTION text are removed where live DOM/state supplies them. | **VERIFIED** | Removed: SCORE label, sample digits and comma, +1,250 chip (rim rebuilt), sample hearts, ACTION label and chevrons. No "count" art exists (the level capsule is CSS). Pause glyph kept, as the plan says. |
| Asset manifest contains source and runtime SHA-256 values. | **VERIFIED** | `ASSET_MANIFEST.json` v2 and `asset-map.json`; runtime hashes re-checked against the files; rebuild is byte-identical. |
| Derivatives are inspected over light, dark, and game-scene backgrounds. | **HARNESS ONLY** | White, light grey, black and a game-scene stand-in (a crop of the reference, not the real scene). Not yet seen over the real canvas. |

## Composition
| Row | Status | Evidence / note |
|---|---|---|
| Classic remains the default. | **NOT VERIFIED** | No default was touched (`settings.js` and `ui-settingspanel.js` unchanged; every added CSS rule is scoped to `astro`). Not exercised: the game does not boot here. |
| Astro/asset-backed theme is opt-in through existing settings. | **NOT VERIFIED** | Existing settings path untouched; not exercised. |
| Top panel is compact, translucent, and inside the safe area. | **HARNESS ONLY** | Three capsules, ~88% frame opacity, 0 off-screen at 5 viewports; safe-area insets emulated via CDP at 390, 412 and 844x390. |
| Score is readable at left without dominating the scene. | **HARNESS ONLY** | Harness: digits fit the frame at every width (measured). "Without dominating the scene" is a judgement for a device. |
| Level and catch/progress count are centered and unambiguous. | **HARNESS ONLY** | `LEVEL n` over a bar over `c / t`, centred; long strings (ENCORE n, ZEN GARDEN, CATCH n / n, WAVE CLEAR) fit down to 320px. |
| Hearts and pause share the top panel; no separate green footer or pause bar remains. | **HARNESS ONLY** | Hearts capsule and pause at the right of the top row; `#mobPause` is `display:none` in every Astro state, so no second pause control. |
| Bottom-left analog cue is transparent and does not cover the player or falling food. | **HARNESS ONLY** | Ring opacity comes from the game's own visibility-mode rule (.62 visible, .16 faint); same box as Current. Whether it covers food in play needs real play. |
| Bottom-right action cue is transparent, circular, and has one live ACTION label with no mouth icon or duplicate baked label. | **HARNESS ONLY** | One live label (TONGUE / HOOK / OPEN / PICK UP / ...), baked label and chevrons removed from the art, no mouth icon; art at .68 opacity. The checklist says "ACTION"; see the report, decision 2. |
| Scene remains the dominant visual surface. | **HARNESS ONLY** | Judgement call; needs the real scene on a device. |

## Responsive and input
| Row | Status | Evidence / note |
|---|---|---|
| 320x568 portrait has no clipping or overlap. | **HARNESS ONLY** | 0 clipping or overlap in the automated scan and in a 280-600px width sweep (clean from 312-320px up); sheets in `evidence/`. |
| 390x844 portrait has no clipping or overlap. | **HARNESS ONLY** | As above, with a 47px top / 34px bottom inset. |
| 412x915 portrait has no clipping or overlap. | **HARNESS ONLY** | As above, with a 32px top / 24px bottom inset. |
| 844x390 landscape has no clipping or overlap. | **HARNESS ONLY** | As above, with 47px side insets. |
| 768x1024 tablet has no clipping or overlap. | **HARNESS ONLY** | As above. |
| Normal and mirrored layouts retain correct sides. | **HARNESS ONLY** | Hit rects identical to Current in normal and mirrored (parity); only sides, not behaviour. |
| Fixed and floating movement retain correct behavior. | **HARNESS ONLY** | Geometry parity only. The stand-in does not run the runtime, so behaviour is unverified. |
| Compact, standard, and large sizes retain valid hit targets. | **HARNESS ONLY** | Rects unchanged versus Current in all three sizes; pause target 34-44px. |
| Simultaneous movement and action still work. | **NOT VERIFIED** | Input cannot be exercised here. The Astro CSS adds no pointer handlers and changes no hit box. |
| Pause remains reachable through the existing pause authority. | **HARNESS ONLY** | Pause button hit-tests as itself at every state; `astroHudActivatePause` is untouched. A real pause is not exercised. |

## Character and lifecycle
| Row | Status | Evidence / note |
|---|---|---|
| Classic Frog tongue/catch works. | **NOT VERIFIED** | Label renders (TONGUE); behaviour not exercised. |
| Gulper and Bob hold/release behavior works while moving. | **NOT VERIFIED** | Gulper label (OPEN) renders; Bob is not rendered; behaviour not exercised. |
| Venus Pick Up/Plant remains stable and understandable. | **NOT VERIFIED** | PICK UP renders; PLANT is not rendered; behaviour not exercised. |
| Passive characters do not show phantom required actions. | **HARNESS ONLY** | No action cue in the passive state. |
| Gully movement, diagonals, fine positioning, and scoop work. | **NOT VERIFIED** | Four-direction ring carets and the D-pad render; movement, diagonals and scoop are not exercised. |
| Toadal Tongue, Hop, Throw, and Block remain distinct. | **HARNESS ONLY** | Four distinct labelled controls, an unavailable state, mirrored/floating/large layout. Behaviour not exercised. |
| Toadal charge/resource UI appears only for Toadal. | **HARNESS ONLY** | Chip appears only in the Toadal state. The gate (`getCharDef().id === 'toadal'`) is unchanged code. |
| Toadal Hop short tap, charge, simultaneous movement, and release produce one valid hop. | **NOT VERIFIED** | Not exercised. |
| Generic lose screens do not show Toadal/golden-frog character art for other characters. | **NOT VERIFIED** | Not touched and not testable: the lose screen is not in the snapshot. |
| HUD hides correctly on home, selection, tutorial, dead/game-over, and non-arcade modes. | **NOT VERIFIED** | Visibility gating in `astroHudSync` is unchanged; not exercised. |
| Theme switching does not duplicate listeners or retain stale values. | **NOT VERIFIED** | Pause binding code unchanged. The new `data-len` hooks derive from the displayed text, so no stale value is kept. Not exercised. |
| Reduced motion and accessibility labels remain valid. | **HARNESS ONLY** | Reduced-motion rules kept; objective `aria-label` now reads e.g. "Level 5 of 10, 7 of 10 caught". Not tried with a screen reader. |

## Required command results
| Row | Status | Evidence / note |
|---|---|---|
| npm run test:arcade-hud-theme-browser | **CANNOT RUN** | Times out waiting for `FullGameArcadeBridge.launch`: `index.html` references 210 local files, the snapshot has 5. Identical failure on the untouched baseline (`evidence/test-logs/`). |
| npm run test:arcade-two-thumb-prototype-geometry | **CANNOT RUN** | Same failure, same cause; identical on the baseline. |
| npm run verify:settings-menu | **CANNOT RUN** | `scripts/verify-settings-menu-contract.js` is not in the snapshot. |
| npm run verify:arcade-presentation | **CANNOT RUN** | `scripts/test-reward-presentation.js` is not in the snapshot. |
| node --check for modified JavaScript | **VERIFIED** | `draw-hud.js` (and the new `capture.cjs`). |
| git diff --check | **VERIFIED** | Clean. |

## Physical-device record
| Row | Status | Evidence / note |
|---|---|---|
| Samsung phone: model, OS, browser, orientation, viewport, and input results recorded. | **NOT VERIFIED** | No device available. |
| iPhone: model, OS, browser, orientation, viewport, and input results recorded. | **NOT VERIFIED** | No device available. |
| Tablet: model, OS, browser, orientation, viewport, and input results recorded. | **NOT VERIFIED** | No device available. |
| Objective failures and subjective preference are recorded separately. | **NOT VERIFIED** | Nothing to record yet; the report keeps judgement calls separate and labelled. |

## Release boundary
| Row | Status | Evidence / note |
|---|---|---|
| No production default changed. | **VERIFIED** | Diff touches only Astro-scoped CSS, the Astro sync code, new assets and tools. |
| No main branch update, merge, push, deploy, or hosting change. | **VERIFIED** | None performed. Output is a patch against the handoff snapshot. |
| Final visual comparison is attached. | **HARNESS ONLY** | `evidence/astro-hud-compare-390.png` (reference, prior attempt, this build). The "this build" panels are the stand-in harness, not the game. |
| Final report states PASS, PASS WITH POLISH, FAIL, or PARTIAL honestly. | **VERIFIED** | `REPORT.md`: PARTIAL. |
