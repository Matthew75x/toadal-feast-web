# Astro arcade HUD: implementation report

**Verdict: PARTIAL.** The implementation is complete as a patch, but it has only been verified in a stand-in
harness. The repo's own browser tests could not run here (the snapshot does not contain the game), and nothing was
checked on a physical device. Per `HANDOFF_BOUNDARIES.md`, none of this counts as visual acceptance; that still needs
the real game and real phones.

- Target: `prototype/arcade-hud-theme-20260923` @ `1b0acef` (from `REPO_TARGET.md`).
- The patch is against the 10-file snapshot in the handoff's `repo-context/`, which is all of that repo I was given.
- Opt-in only. No default changed. Every CSS addition is scoped to `astro`; `settings.js` and `ui-settingspanel.js`
  are untouched. Nothing was pushed, merged or deployed.

## What changed

| File | Change |
|---|---|
| `src/styles/style.css` | Old Astro HUD block replaced (top row: score / level / hearts+pause). Touch-control skin appended at the **end** of the file so source order, not `!important`, wins against the two-thumb prototype layer. |
| `src/runtime/rendering/draw-hud.js` | Objective copy and spoken description; `data-len` hooks on score, combo and objective text (CSS font steps). Pause path, state gating, hearts, Toadal gate and score tween are unchanged. |
| `assets/images/ui/arcade-astro/v2/` | `score-frame.png`, `health-frame.png`, `pause.png`, `action-ring.png`, `asset-map.json`. **New folder on purpose**: your branch already ships *different* images under these four names one level up (full-sheet crops with rectangular holes cut out, which is what produces the stray arcs on the S25 Ultra). Reusing the URLs would make `git apply` refuse, and let a phone keep serving the cached old art under the new 9-slice CSS. The old files are left untouched and can be deleted once the new build is verified on a device. |
| `tools/arcade-hud-assets/` | Deterministic asset build script, README, and the preview harness and guardrails (`hud-preview.html`, `capture.cjs`, `scan-metrics.py`, `sweep.cjs`, `check-css.cjs`, `scene-standin.jpg`). |

**Top row.** Three glass capsules across the top, as in the reference: score at left, `LEVEL n` over a progress bar
with a gold star over the catch count at centre, hearts plus pause at right. Score and health frames are 9-sliced so one
image serves any width. The level capsule is CSS glass because the art pack ships no frame for it. Pause is the pack's
button with its glyph kept; its box is the hit target (34 to 44px), and it still goes through the existing
`astroHudActivatePause` path.

**Bottom.** The joystick ring and the action cue draw the pack's glass-ring art on a pseudo-element, scaled so the
visible disc equals the real hit box. Hit boxes, positions, mirrored/floating layouts and compact/standard/large sizes
stay owned by the runtime and prototype layer. The action button shows the live per-character label. Toadal's
Throw/Block/Hop, the Buttons-mode D-pad and the four-direction ring carets are restyled to match.

## Decisions for you to confirm or overrule

1. **Three capsules** like the reference, instead of the prior attempt's single merged score+goal panel.
2. **Live action labels** (TONGUE, HOOK, OPEN, CLOSE, LEAN, PICK UP, PLANT, HOP, THROW, BLOCK), not a fixed "ACTION".
   The reference's "ACTION" is a placeholder and the plan requires the live label. The baked ACTION text and chevrons
   are removed from the art, so exactly one label shows and there is no mouth icon.
3. **Objective copy** is now `LEVEL n` over `c / t` (was `FEAST GOAL n/N` over `c / t`, which read as two counters).
   Encore is `ENCORE n`. The wave goal moved into the spoken `aria-label`. The existing test regex accepts both forms.
4. **The "+1,250" reward chip never appears.** Nothing in the provided files ever sets the bonus amount, and the plan
   forbids inferring rewards from score deltas. The chip is dormant, not removed. If the full repo has a scoring event
   hook, wiring it is a few lines in `draw-hud.js`.
5. **Combo text stays live**: `STREAK n · TIER t` or `STREAK n · k TO TIER`. That is longer than the reference's
   "COMBO x4" and most combo values produce the long form, so the chip wraps to two lines under the score.
6. **Joystick ring reuses the action-ring art.** The pack has no separate joystick art. The up/down carets are kept
   only in four-direction mode, where they are a real affordance.
7. The first-run coach mark sits lower (`top: calc(86px + safe-top)`, was 70px) so it clears the hanging combo and
   Toadal-charge chips.
8. **No `backdrop-filter` on the three HUD capsules or on Toadal's secondary buttons.** The baseline had none there.
   On the stand-in scene a 5px blur moved each capsule by about 1 of 255 on average, while a backdrop blur over a
   repainting canvas is recomputed every frame. Easy to add back if you prefer the look; frame rate was not measured.

## Verification performed

| Check | Result |
|---|---|
| `node --check` on modified JS; `git diff --check` | pass; clean |
| Patch applies to a pristine baseline and reproduces all 15 files byte for byte | pass |
| Runtime PNGs match `asset-map.json` hashes; rebuild from the source sheets is byte-identical | pass |
| Stand-in harness, Chromium 141: 76 viewport×state captures across 320×568, 390×844, 412×915, 844×390, 768×1024, plus 120 Current↔Astro parity assertions (ring, knob, action, secondary actions, D-pad, and that the ring is recoloured) in the prototype layout, the shipping-default layout and Buttons mode | 0 issues |
| Same matrix with container-query units disabled (the fallback older browsers take) | 0 issues |
| **Width sweep**, `sweep.cjs`: every width 280 to 600px in 4px steps × 8 hardest states (6/7/10-digit scores, `TIME 12:34` / `CATCH 11 / 12`, `ENCORE 100`, `GROWTH 139 / 140`, `WAVE CLEAR 12 LEFT`, numeric hearts, zen, Toadal chip) × score digits made 0, .04 and .08em wider than on my machine = 1,944 renders per path | clean from 312px up (container-query path) and 320px up (fallback path); below that is informational |
| **CSS integrity**, `check-css.cjs`: Chromium's parser keeps all 102 Astro rules and no brace is unmatched | pass; fails on both bug reproductions I tried and does not false-alarm on your baseline stylesheet |
| Text must sit inside its capsule **vertically** as well as horizontally; panel heights must not depend on state; the combo chip must stay `position:absolute`; no Astro asset request may fail | pass (new in this round) |
| Selector contract: 15 hooks the new CSS depends on, plus all 24 `astro-hud__*` classes, looked up in the markup, runtime and sync code | 1 hook not found: `.mob-btn-pressed` (review item 5) |
| `npm run test:arcade-hud-theme-browser` | **cannot run** |
| `npm run test:arcade-two-thumb-prototype-geometry` | **cannot run** |
| `npm run verify:settings-menu`, `npm run verify:arcade-presentation` | **cannot run**: the scripts are not in the snapshot |

**Why the two repo tests cannot run.** `index.html` references 210 local files and the snapshot contains 5, so the game
never boots. With `CHROMIUM_BIN` set, both tests time out waiting for `FullGameArcadeBridge.launch`. Running them on the
untouched baseline gives the identical failure, so it is the environment, not this patch (logs in `evidence/test-logs/`).
I went through the hud-theme test's assertions by hand. Score sync, objective regex, pause ≥34px, top row inside 390px,
no overlap at 320px, `#mobPause` hidden, unchanged ring/action geometry and a recoloured ring are each checked in the
harness; theme persistence and the real pause coordinator are not.

**What the harness is.** It loads the real `style.css`, the real `#astroArcadeHud` and `#mobileControls` markup from
`index.html`, and the real Astro sync code sliced out of `draw-hud.js`, over stub game state. The class and
data-attribute toggles from `mobile-control-runtime.js` are re-implemented by hand; that file is not executed. The scene
is a HUD-free crop of the reference mock-up. The first-run coach, the D-pad arrow icons and the design tokens the game
defines in files I don't have are stand-ins. It checks composition, sizing, overflow and cascade. It cannot prove
gameplay, input or the real canvas.

**What testing caught in my own first pass** (all fixed; where to look if something seems off):
- The ring art first went on via `border-image` and rendered as a squashed artifact; replaced with a scaled pseudo-element.
- `CATCH 6 / 12` and `ENCORE 12` were clipped; they now step down in size.
- The combo chip overlapped the level capsule in every streak state, then grew upward into the score digits when wrapped; it now grows downward.
- Giving the level capsule more width pushed the score digits over the frame's leaf caps; digits now fit to the capsule's real width.
- Toadal's charge chip spilled 17px at 320px; it now flexes.
- Four-direction carets were silently dropped; restored.
- **My own last CSS edit left a stray `}`, which made the browser silently drop the next rule** (the combo chip lost its `position:absolute`, joined the score capsule's layout and pushed the digits out of the frame). Every width and overflow check I had at that point was horizontal-only, so a full sweep reported it clean. It was found by looking at a render, not by a test. The vertical checks, the sweep and `check-css.cjs` now each catch it independently (152, 192 and 1 failures respectively on the broken file), and the splice script refuses to write a stylesheet with an unmatched brace. All sweep numbers in this report were re-run after the fix.
- Two harness-fidelity gaps of mine (the control-mode toggle's visibility, the runtime's inline `display`) made a stray "STICK" button show up; harness only, the game was never affected.

## Not verified (needs the real game or a device)

Input of any kind (simultaneous stick + action, floating stick, Gulper/Bob hold and release, Venus PLANT, Gully,
Toadal hop/charge/throw/block behaviour); that tapping HUD pause actually opens the pause coordinator; the lose screen
and Toadal/golden-frog gating on it; HUD hiding on home, selection, tutorial and game-over; theme switching and
persistence; real icons, real scene, real frame rate; screen-reader behaviour; all physical-device checks.

## Review items

1. `.astro-hud__top` captures pointer events across the whole top strip. The baseline did too, so I left it. If floating-stick touches can start there, set it to `pointer-events: none` (the pause button keeps `auto`).
2. The control-mode toggle ("STICK"/"BUTTONS") is not themed; the runtime already hides it in prototype mode. It is visible in the S25 Ultra screenshot you sent (faint circle above the joystick), so that layout really does show it.
3. In the faint visibility mode the action label fades with its button, same as Current.
4. The container-relative score fit needs container query units (Chrome 105, Safari 16, Firefox 110); older browsers get the tuned viewport-unit fallback, which passed the same checks.
5. `.mob-btn-pressed` (pressed feedback) is toggled by code that is not in the snapshot; the baseline CSS already depends on it.
6. The pre-existing `body[data-arcade-hud-theme="astro"]:has(#canvasWrapper.active)` background rule is kept as found.
7. The shipping-default layout (prototype flag off) is covered for art scaling and for hit-box parity with Current, but the
   harness does not run the runtime's resting-origin logic, so where the ring *sits* in that layout is a CSS fallback
   here, not what the game does (`evidence/astro-hud-control-layouts.png`).
8. Frame rate and battery were not measured; that needs a device.
9. Below the repo's own 320px floor the top row degrades (digits and `WAVE CLEAR` first, from about 312px down). Some foldable cover screens are that narrow.
10. The score font is a monospace stack. A phone resolves `monospace` to a different face than my desktop, so the fit leaves ~19% slack per digit and the sweep re-runs with digits up to .08em wider; the real face on a real device is still unseen.

## Files in this package

- `astro-hud.patch`: the change set (`git apply astro-hud.patch` on the target branch).
- `repo-files/`: the same 15 files at their repo paths.
- `evidence/before-after-s25-ultra.png`: your S25 Ultra screenshot next to the patched build rendered in the same state at the same CSS width and pixel density (a stand-in render, not a device capture).
- `ASSET_MANIFEST.json` (v2, source and runtime SHA-256) and `ACCEPTANCE_CHECKLIST.status.md` (every checklist row with an honest status).
- `evidence/`: reference / prior attempt / this build comparison, viewport matrix, modes-and-characters sheet, control-layout sheet, asset sheet over four backgrounds, the harness's `metrics.json`, and the test logs (including the untouched-baseline control run).

## Run it on your side

```
git apply astro-hud.patch      # the art lands in assets/images/ui/arcade-astro/v2/, so it cannot collide with the old files
npm run test:arcade-hud-theme-browser
npm run test:arcade-two-thumb-prototype-geometry
npm run verify:settings-menu
npm run verify:arcade-presentation
git diff --check
```

Then open the game with `?ffArcadeControls=prototype`, choose the Astro HUD theme in the existing settings panel, and
record the device results the checklist asks for (model, OS, browser, orientation, viewport, input results), keeping
objective failures separate from subjective preference. To re-run the stand-in harness and its guardrails:
`node tools/arcade-hud-assets/preview/capture.cjs out/hud && python3 tools/arcade-hud-assets/preview/scan-metrics.py out/hud`,
`node tools/arcade-hud-assets/preview/sweep.cjs` (add `--no-cqw` for the fallback path) and
`node tools/arcade-hud-assets/preview/check-css.cjs`.

On the S25 Ultra: **make sure the phone is running the new files, not cached ones.** The top-left capsule should read `LEVEL n` over `c / t`, with the score inside a complete neon frame and no stray arcs. If it still reads `FEAST GOAL n/N`, it is the previous build. If your app has a service worker or versioned asset URLs, bump the version so the new `style.css`, `draw-hud.js` and `v2/` art are fetched together.
