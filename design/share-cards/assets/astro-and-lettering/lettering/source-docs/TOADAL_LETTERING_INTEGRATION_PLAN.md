# TOADAL Lettering — HUD Maker Integration Plan (release 2.0.0)

**Date:** 2026-10-05
**Supersedes:** the 2026-09-30 plan (engine v1, vector strokes; kept in `history/`)
**Status:** Phase 1 SHIPPED as release 2.0.0 (engine v2, standalone demo and self-test). Phases 2–6 open.
**Parents:** `TOADAL_CONTEXT_REACTIVE_PHYSICS_AWARE_LETTERING_CONCEPT.md`, `specs/TOADAL_LETTERING_MECHANICS_SPEC_V2_VERIFIED_20260927.md` (now carries an erratum), `specs/TOADAL_GAMES_FONT_MECHANICS_SPEC_20260927.md` (same), `specs/TOADAL_LETTERING_STYLE_REFERENCE_DECISION_20260927.md`, `reference/` (your concept brief)

## Files (this is `docs/` inside the release; see the top-level README for the whole folder)

| File | What it is |
|---|---|
| `hud-maker/Crownfall_HUDMaker_VanillaJS.html` | Your HUD Maker, edited in place: +881 lines, 4 lines changed, 149,418 → 228,054 bytes (the engine is 67.1 KB of that, 14.3 KB of it the embedded font). |
| `runtime/toadal-lettering.js` | The exact engine the editor runs, standalone (also downloadable from the tool: header **Lettering JS**, panel **Engine .js**). |
| `runtime/toadal-lettering-demo.html` | Playground, Game JSON viewer and **browser self-test** (17 checks). |
| `tools/toadal_autokern.py` | Regenerates the kerning table for any font (measures on the puffed shapes). |
| `images/` | Specimen sheet; engine-versus-reference comparisons. |

---|---|
| `Crownfall_HUDMaker_VanillaJS.html` | Your HUD Maker, edited in place: +854 lines, 4 lines changed, 149,418 → 226,166 bytes (the engine is 65.3 KB of that, 14.3 KB of it the embedded font). |
| `toadal-lettering.js` | The exact engine the editor runs, standalone, for the game runtime (also downloadable from the tool: header **Lettering JS**, or panel **Engine .js**). |
| `toadal_autokern.py` | Offline tool that regenerates the kerning table from any font (v2: measures on the puffed shapes). |
| `TOADAL_lettering_specimen.png` | A–Z, 0–9, punctuation, words and the two lockups rendered by the engine. |
| `TOADAL_lettering_vs_reference_GAMES.png`, `..._FEAST.png` | Reference art (left) next to engine output (right). |

---

## 1. What changed from the first delivery, and why

The first delivery drew the font's own outlines with canvas strokes. It worked but looked like "a bubble font with effects": flat-cornered letters, a stroke-ring outline, a heavy-handed gloss. Engine v2 is a raster pipeline built to match the reference's balloon look:

| | v1 | v2 |
|---|---|---|
| Letter shape | font outlines + round-join stroke | every glyph **puffed**: distance-transform closing + opening + inflate (rounded like balloons), cached as a sprite |
| Spacing | 32-char table measured on raw outlines | **59-char table (A–Z, 0–9, `! ? . , : ; - ' " & % + / # * ( ) _ @ $ = < >`) measured on the puffed shapes**, with the same puffing in Python and JS |
| Surface | edge-band highlights | **lit gel**: height field from the glyph mask, lit from the top-left (soft shade tinted with the letter's own deep colour, rim light, Blinn-Phong specular streak, sheen, bounce light, edge occlusion) |
| Outline | 3 discrete stroke rings | **one merged border per line** from the Euclidean distance field of the union of the letters, with a continuous colour ramp measured off the reference, an extruded slab and a soft drop shadow |
| Speed | canvas shadow blurs at full size | border on a capped grid, shadows on a 4× smaller canvas, draft (half-res) paint while dragging, sprite cache with LRU, idle-time prewarm |

New controls: **Shine** slider, six one-tap colour **swatches** (the measured rainbow slots), **Fit box** (sets the width for the current height), **Reset style**, a **Score counter** preset (digits), prewarm when the preset category opens.

---

## 2. How the engine works

1. **Glyph library.** Lilita One (SIL OFL 1.1), embedded unmodified as base64 and registered through the FontFace API, so it works offline and in a standalone game page. Chosen by measurement: its T/D/L width:height (0.69 / 0.77 / 0.55) and stem weight (28% of cap) sit inside the ranges measured off the reference; every other candidate tested was too wide.
2. **Puffing** (`TOADAL_PUFF`: close 0.010, round 0.052, inflate 0.014 em). Closing fills concave corners, opening rounds convex ones, inflate thickens. The opening radius is capped by the glyph's thickest stroke (`p' = min(p, 0.8·Dmax − c)`) so thin glyphs (hyphen, quotes) never vanish. Anti-aliasing comes from the true distance, so edges are smooth.
3. **Sprite** per (character, size bucket 96/128/192/256/384/512): puffed mask, a dark seam silhouette, a `shade` plane and a `light` plane.
4. **Layout.** `TOADAL_KERN` supplies pair kerning in em (e.g. `TA −0.122`, `LT −0.115`, `AV −0.152`, `TO −0.037`, `OA −0.066`, `AL −0.022`). Tightness shifts all pairs. End letters get a size boost (¼ falloff per step inward). Lines stack with a 10% tuck; the block fits the box.
5. **Paint** (device pixels): per line, the union of the letter masks → exact distance field → colour ramp = merged border; the slab is a vertical sliding maximum of the border; then per glyph: seam → gradient fill (palette top→bottom) → tinted shade → light. Lines are painted in order, so a lower line sits on top of the one above.
6. **Palette.** `single` (Accent → Accent 2), `rainbow` (positional: 1st red, 2nd blue, 3rd green, 4th purple, 5th orange, 6th gold), `lockup` (line 1 single, later lines rainbow).

---

## 3. In the HUD Maker file (find by identifier; line numbers shift)

| Change | Identifier |
|---|---|
| Engine, own script block so export can read it back | `<script id="toadal-lettering-engine">` before the main script |
| Type | `TYPES.LETTERING`, `TYPE_META` (the sidebar button is auto-generated) |
| Defaults | `makeBase` → `byType[TYPES.LETTERING]` |
| Presets (6) | `COMPONENT_PRESETS`, category `'TOADAL Lettering'` |
| Canvas | `renderElementShellHTML` → `case TYPES.LETTERING` |
| Node glue | `updateElementNode`, `updateElementTransform` → `toadalQueueRepaint` (half-res draft once per frame while dragging, crisp paint 160 ms after), `toadalMountLettering`, `toadalLatestElement` |
| Panel | `renderPropertiesHtml` "TOADAL Lettering"; live labels in `updateLiveLabel` |
| Actions | `export-lettering-engine`, `toggle-lettering-gloss`, `set-lettering-swatch`, `reset-lettering-style`, `fit-lettering-box`; `exportLetteringEngine()` |
| Game JSON | `runtimeConfigFor` (all fields under `config`), `runtimeContentFor` (`content.text`, `\|` → space) |
| Warm-up | `set-preset-category` → `toadalPrewarm()`; first mount also prewarms |
| In-app plan | `DESIGN_QUESTS[style]` ("Polish the look") also completes on a `LETTERING` element |

## 4. Element fields

| Field | Default | Range | Meaning |
|---|---|---|---|
| `letterText` | `TOADAL` | ≤4 lines, ≤100 chars/line, `\|` = newline | auto-uppercased |
| `paletteMode` | `single` | `single` / `rainbow` / `lockup` | |
| `accent` / `accent2` | `#fee822` / `#fda80a` | any CSS colour (invalid values fall back to the defaults) | single-hue gradient top / bottom; `accent` tints the glow |
| `tightness` | 100 | 50–150 | 100 = table spacing |
| `endBoost` | 16 | 0–40 | first/last letter enlargement % |
| `lineScale` | 62 | 30–100 | later lines vs line 1 (FEAST! preset 72) |
| `outlineWidth` | 9 | 0–16 | border band, % of cap height |
| `shine` | 100 | 0–100 | strength of shade + light (0 = flat); `glossOn:false` forces 0 |
| `bounce` | 0 | 0–12 | playful vertical jitter |
| `glow` | false | bool | warm halo (reuses the Style-section Glow button) |

---

## 5. Measured reference → code

| Measured on the reference art | Engine |
|---|---|
| Stem ÷ cap, fill: 26–30% | Lilita 28% + inflate ≈ 30% |
| T / D / L width:height ≈ 0.70–0.74 / 0.74–0.75 / 0.52–0.57 | Lilita 0.69 / 0.77 / 0.55 (before puffing) |
| Fill-to-fill gap between letters 0.009–0.023 em | kerning target: closest approach of the puffed shapes **0.018 em** |
| Border colour `#9c3815` (at the fill) → `#200000` (outer), over ~6.5% of cap | `TOADAL_BORDER_STOPS` (the six sampled points), default band 9% (the reference reads thicker than the one scan because of the slab and soft shadow) |
| End letters ≈ 1.16–1.18× the middle ones | `endBoost` 16, ¼ falloff |
| GAMES line ≈ 0.62, FEAST! line ≈ 0.75 of line 1 | `lineScale` 62 / 72 |
| Line overlap 6–12% | 10% |
| Positional palette | `TOADAL_RAINBOW`; 3rd bottom stop is `#049a13`, because the measured `#015c09` was sampled inside shadow |

**Erratum, already applied to the older docs:** the "baseline arc" claim was wrong. The baselines are almost shared and flat; the end-letter size boost is the real effect.

---

## 6. Verification

Real engines: headless **Chromium** (Playwright) and **WebKitGTK 2.52** (a real WebKit through WebDriver and Xvfb, software-rendered; it is not Safari itself). The sandbox blocks CDNs, so Tailwind was compiled locally, html2canvas came from npm and lucide icons were stubbed.

| Suite | Result |
|---|---|
| Chromium end-to-end (real UI controls) | **29/29**: all 6 presets via their buttons, text/palette/sliders/live labels, gloss, swatch, reset, fit box, draft→crisp resize, duplicate/undo/redo/delete/move, save→reload, Game JSON, Editor JSON, engine export, PNG export |
| WebKit end-to-end | **8/8**: specimen sheet, 6 presets painted in the app, panel edits, resize, Game JSON, standalone engine |
| Demo page, self-test and Game JSON viewer | Chromium **11/11**, WebKit **3/3**; the self-test itself passes **17/17** in both engines (it is also how you check Firefox and Safari, see README) |
| Regression vs your original file | **11/11**: same elements/nodes, **identical rendered HTML for every pre-existing element**, all pre-existing presets build identical elements, default-layout Game JSON unchanged |
| Hostile input | **6/6**: empty/separator text, 200 and 5,000 letters, emoji/CJK, 5×5 px and 3000×1500 boxes, absurd/null settings, **invalid and named CSS colours** (the self-test found a real bug here: a non-colour `accent` made a paint throw; fixed, colours are now validated), no exceptions |
| Determinism | **2/2**: output is identical on a clean page and after painting unrelated big content first; glow/shadow halo has no rectangle-edge lines (found and fixed a real bug: scaled draws from sub-rectangles of reused scratch canvases made output depend on earlier paints) |
| Distance transform vs scipy | max error 9e-13 on squared distance |
| JS puffing vs the Python used for kerning | median 0.0016 em, worst 0.0053 em (`*`); kerning gap target is 0.018 em |
| Packaging | the shipped `toadal-lettering.js` equals the tested engine build plus its header; every test above except the unit/parity ones ran against the **release copies**, not the build folder; the shipped `toadal_autokern.py` reproduces the embedded kerning table exactly |

**Performance (Chromium, software raster):**

| Case | ms |
|---|---|
| Single word 560×200, first paint (cold cache) | 149 |
| Same, warm | 58 |
| Lockup 620×360 with glow: cold / warm | 237 / 98 |
| Large 1100×620 lockup, warm / half-res draft | 243 / 108 |
| Score counter 300×110, warm | 36 |
| One sprite at 256 px | ≈13 (192: 8, 384: 30, 512: 53) |
| Prewarm 38 characters (idle slices ≤12 ms) | ≈1.6 s wall, 27.5 MB |

(Timings vary a little between runs; this machine is a software-rendered sandbox.) WebKitGTK (software raster under Xvfb) cold specimen cases: 192–767 ms in the last run (it varies run to run). Real Safari on a GPU should be faster, but I could not measure that.

**Not verified:** Firefox (its download is blocked here), real Safari/iOS (WebKitGTK is the same engine family, not the same build or GPU path), the real CDN-loaded UI (Tailwind, icons; I did confirm the three icon names I added exist in lucide 1.51.0, the version `lucide@latest` serves), low-end devices, and any Crownfall game runtime (I don't have it). The demo's **Browser self-test** is the way to check Firefox, Safari and iOS yourself in about a minute.

---

## 7. Known limitations

1. **Stand-in alphabet.** Lilita One puffed is close in proportion, not your hand-airbrushed letters.
2. **No glyph-shape alternates yet.** Spacing and tucking are contextual; a letter never changes shape for a neighbour (the T that overhangs an O, `FE` interlock, `AL` pair form). That is design work (Phase 3), not something the reference images can supply.
3. **Table and puffing travel together.** If you change `TOADAL_PUFF` or the font, regenerate the kerning (§9) with the same three numbers.
4. **Thin glyph parts.** `*` loses part of its arms to the rounding (worst parity glyph); quotes/hyphen shrink slightly.
5. **Characters outside the 59** use the median kern and fallback fonts.
6. **Memory.** ~0.7 MB per cached glyph at 256 px; the cache is capped at 96 MB (LRU).
7. **Canvas, not vector.** Backing store is 2× and capped at 4096 px per side.
8. The donut, frog and splash art are intentionally not part of the alphabet.

---

## 8. Roadmap

| Phase | Work | Acceptance |
|---|---|---|
| 0 ✅ | Reference measurement and specs | three spec docs (two now carry an erratum) |
| 1 ✅ | Level A engine + HUD Maker integration (v1, then v2) | §6 |
| 2 | **Custom TOADAL glyph set** (proof set `T O A D L G M E S !`, then A–Z/0–9). Replace `TOADAL_FONT_*`, `TOADAL_CAP_EM`; set `TOADAL_PUFF` (probably smaller); regenerate `TOADAL_KERN` | stem 26–30% of cap; T/D/L aspect within ±0.05 of the §5 targets; side-by-side vs the reference |
| 3 | **Authored contextual alternates** (brief §13): T overhang form, `AL` pair, `FE` interlock, one vertical-offset rule; a rule registry (pair → alternate glyph or transform), each rule toggleable | proof words show the alternates; toggling a rule changes only that pair |
| 4 | Decorative asset library as separate element types (donut-O, crowned frog, splash droplets) | alphabet renders identically with and without the overlay |
| 5 | Crownfall/TOADAL runtime adoption; menu brand-slot; optional **sprite-atlas export** for WebGL/engine textures | same settings render the same in the editor and the game (pixel-diff within tolerance); Firefox and real Safari/iOS run the §6 suites |
| 6 (optional) | OpenType/COLR export for use outside the engine | installs and renders in a desktop app |

---

## 9. Runtime and tooling recipes

**Game side** (values come from Game JSON: `transform`, `style`, `config`; this structure was checked against a real export):
```html
<script src="toadal-lettering.js"></script>
<script>
  // e = one Game JSON element with type === 'LETTERING'
  const c = document.createElement('canvas');
  c.style.cssText = `position:absolute;left:${e.transform.x}px;top:${e.transform.y}px;width:${e.transform.w}px;height:${e.transform.h}px`;
  TOADAL.paintSafe(c, {
    w: e.transform.w, h: e.transform.h,
    letterText: e.config.letterText, paletteMode: e.config.paletteMode,
    accent: e.style.accent, accent2: e.style.accent2, glow: e.style.glow,
    tightness: e.config.tightness, endBoost: e.config.endBoost, lineScale: e.config.lineScale,
    outlineWidth: e.config.outlineWidth, shine: e.config.shine, bounce: e.config.bounce, glossOn: e.config.glossOn,
  });
  parent.appendChild(c);
  TOADAL.prewarm();                      // optional at startup: A-Z/0-9 sprites in idle time
</script>
```
`runtime/toadal-lettering-demo.html` (tab "Game JSON viewer") does exactly this for every lettering element of a Game JSON, so it is also a working example. Other calls (all also exist as `toadal…` globals): `TOADAL.aspect(settings)` (width/height a box needs to show the text unscaled), `.cacheStats()`, `.clearCache()`, `.paint(canvas, settings, {draft:true})` (returns `false` until the font is ready), `.whenReady(cb)`, `.version`. `content.text` carries the plain text for anything that skips the engine.

**Regenerate kerning for a new font or puff** (needs Pillow, numpy, scipy; `.ttf`/`.otf`):
```
python3 toadal_autokern.py font.ttf 0.018 0.010 0.052 0.014 > kern.json
#                          gap   close round inflate   <- must equal TOADAL_PUFF in the engine
```
Put `rows` (joined as space-separated strings), `chars`, `median` into `TOADAL_KERN`. The tool needs a `.ttf`/`.otf`: convert a woff2 with `python3 -c "from fontTools.ttLib import TTFont as T; f=T('font.woff2'); f.flavor=None; f.save('font.ttf')"`. Verified: running the shipped tool on Lilita One with the numbers above reproduces the embedded table exactly.

**Tuning knobs** (all `const` objects in the engine): `TOADAL_SHADING` (light direction, height-field blur/amplitude, shade/lit/spec/rim/sheen/bounce/AO), `TOADAL_BORDER_STOPS`, `TOADAL_SLAB`, `TOADAL_SEAM`, `TOADAL_RAINBOW`, `TOADAL_DEFAULT_OUTLINE`.

---

## 10. Decisions and assumptions

- **"Add it to the plan."** There was no plan inside the HUD Maker file, so: this document, plus folding lettering into the in-app **Polish the look** quest (no new quest, scoring unchanged). If you meant another plan document (for example the RC-12 continuation record), I don't have it; §11 is a paste-ready entry.
- **Raster canvas** because the layered effects (merged border, per-glyph lighting) are simpler and faster there, and it exports through html2canvas.
- **Font embedded, not linked**, so the same engine file works in the game with no network.
- **A real distance-transform morphology rather than a blur trick**, so corners round without thinning strokes, and kerning could be measured on exactly the shapes that get drawn.

---

## 11. Paste-ready continuation-record entry (release 2.0.0)

```
## TOADAL lettering - HUD Maker integration, release 2.0.0 (2026-10-05)
- Crownfall_HUDMaker_VanillaJS.html: LETTERING element type + TOADAL lettering engine v2 (+881 lines, 4 changed,
  regression-checked: every pre-existing element renders identically).
- Engine v2: puffed (balloon) glyph sprites, lit-gel shading, merged distance-field chocolate border + slab,
  59-char measured kerning on the puffed shapes, positional rainbow, end-letter boost, lockups, draft/crisp resize.
  Exported as toadal-lettering.js; Game JSON carries config + content.text.
- Also shipped: runtime/toadal-lettering-demo.html (playground, Game JSON viewer, 17-check browser self-test), README, CHANGELOG, licences, checksums.
- Tests: Chromium e2e 29/29, WebKit 8/8, demo 11/11 + 3/3, regression 11/11, stress 6/6, determinism 2/2, EDT + puffing parity pass.
- Not verified: Firefox, real Safari/iOS, the game runtime (run the demo's self-test there). Alphabet is a stand-in (Lilita One).
- Open: custom glyph set (P2), contextual shape alternates (P3), decorative overlays (P4), runtime adoption (P5).
- Correction: the earlier "GAMES baseline arc" claim is withdrawn (flat baseline; end letters are larger).
```
