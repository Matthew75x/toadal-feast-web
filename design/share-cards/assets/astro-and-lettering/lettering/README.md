# TOADAL Lettering for the Crownfall HUD Maker, v2.0.0

Balloon-style bubble lettering in the look of the TOADAL FEAST! / TOADAL GAMES art: rounded puffed letters, lit-gel shading, one merged chocolate border with a slab and drop shadow, measured pair spacing, positional rainbow colours, and multi-line lockups. It ships as a new element type inside your HUD Maker **and** as a standalone engine file for the game.

## What is in this folder

| Path | What it is |
|---|---|
| `hud-maker/Crownfall_HUDMaker_VanillaJS.html` | Your HUD Maker with the new **TOADAL Lettering** element. Drop-in replacement for your file. |
| `runtime/toadal-lettering.js` | The engine, standalone, for the game. The same code the HUD Maker runs. Includes its font (no network, no CDN). |
| `runtime/toadal-lettering-demo.html` | Playground, **Game JSON viewer** and **browser self-test**. Open it in any browser; it needs `toadal-lettering.js` in the same folder. |
| `tools/toadal_autokern.py` | Regenerates the pair-kerning table for a new font or new rounding settings. |
| `docs/` | Integration plan (design, numbers, tests, roadmap), the measured specs and the original concept brief. |
| `images/` | Specimen sheet and side-by-side comparisons with the reference art. |
| `licenses/LilitaOne-OFL.txt`, `NOTICE.md` | Third-party licence for the embedded font. |
| `SHA256SUMS.txt` | Checksums for every file. |

## Quick start

**In the HUD Maker.** Open the HTML file. Presets, category **TOADAL Lettering** (6 presets: TOADAL wordmark, TOADAL / FEAST! lockup, TOADAL / GAMES lockup, Rainbow title word, Blue arcade word, Score counter), or Raw Elements, **TOADAL Lettering**. Edit it in Properties, **TOADAL Lettering**: text (use `|` for a new line), palette, six one-tap colour swatches, tightness, end-letter boost, later-line scale, outline, shine, bounce, gloss, **Fit box**, **Reset style**. Export as usual: Game JSON carries the settings, **Lettering JS** downloads the engine.

**In the game.**
```html
<script src="toadal-lettering.js"></script>
<script>
  // e = one element of the Game JSON with type === 'LETTERING'
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:absolute;left:${e.transform.x}px;top:${e.transform.y}px;width:${e.transform.w}px;height:${e.transform.h}px`;
  TOADAL.paintSafe(canvas, {
    w: e.transform.w, h: e.transform.h,
    letterText: e.config.letterText, paletteMode: e.config.paletteMode,
    accent: e.style.accent, accent2: e.style.accent2, glow: e.style.glow,
    tightness: e.config.tightness, endBoost: e.config.endBoost, lineScale: e.config.lineScale,
    outlineWidth: e.config.outlineWidth, shine: e.config.shine, bounce: e.config.bounce, glossOn: e.config.glossOn,
  });
  parent.appendChild(canvas);
  TOADAL.prewarm();   // optional at startup: builds the A-Z / 0-9 sprites in idle time
</script>
```
`runtime/toadal-lettering-demo.html` does exactly this for every `LETTERING` element of a Game JSON you paste in, so it doubles as a working example.

**Check a browser.** Open `runtime/toadal-lettering-demo.html`, tab **Browser self-test**. It reports PASS / WARN / FAIL for each capability and for real rendering (colours, spacing, determinism, speed) and can copy a report.

## API (global functions, also on the `TOADAL` object and as `module.exports`)

| Call | Purpose |
|---|---|
| `TOADAL.paintSafe(canvas, settings \| () => settings)` | Waits for the embedded font, then paints. Use this by default. |
| `TOADAL.paint(canvas, settings, {draft})` | Paints now. Returns `false` until the font is ready. `draft:true` paints at half resolution (for live resizing). |
| `TOADAL.whenReady(cb)` | Calls `cb` when the font is ready. |
| `TOADAL.prewarm(chars?, sizePx?)` | Pre-builds letter sprites in idle time; returns a Promise. |
| `TOADAL.aspect(settings)` | Width / height a box needs to show the text unscaled. |
| `TOADAL.cacheStats()`, `TOADAL.clearCache()` | Sprite cache (about 0.7 MB per glyph at 256 px, capped at 96 MB). |

Settings: `w, h` (CSS px), `letterText` (up to 4 lines of 100 characters, `|` = new line, upper-cased), `paletteMode` (`single` / `rainbow` / `lockup`), `accent`, `accent2` (any CSS colour; invalid values fall back to the defaults), `tightness` 50-150, `endBoost` 0-40, `lineScale` 30-100, `outlineWidth` 0-16, `shine` 0-100, `bounce` 0-12, `glossOn`, `glow`. The canvas backing store is sized for you (2x, capped at 4096 px per side).

## Compatibility and what has been tested

Tested: headless Chromium and WebKitGTK (a real WebKit engine on Linux). The full suite is described in `docs/TOADAL_LETTERING_INTEGRATION_PLAN.md`, section 6.
**Not tested:** Firefox, real Safari / iOS, low-end devices, and your game runtime. Run the browser self-test on those before shipping.

Needs: Canvas 2D, `FontFace`, `ImageData`, `measureText().actualBoundingBox*` (all current browsers). A Content-Security-Policy must allow `font-src data:`, otherwise the embedded font cannot load and the self-test fails the "font ready" check.

## Known limitations

- The alphabet is **Lilita One** (open licence), rounded and puffed. It is close in proportion to your art but is not your custom letters (planned: Phase 2 in the plan).
- Spacing and tucking are contextual (T tucks toward round letters, A closes against L), but a letter never changes shape for its neighbour (Phase 3).
- Uppercase, digits and `! ? . , : ; - ' " & % + / # * ( ) _ @ $ = < >` have measured spacing; other characters fall back to a median spacing and system fonts. `*` loses part of its arms when rounded.
- The donut, frog and splash artwork of the logos are not part of the alphabet.
- The first lettering painted after load takes about 150-250 ms (letter sprites are built once, then cached; later paints take roughly 50-100 ms).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Nothing draws, self-test says "font not ready" | CSP blocking `data:` fonts, or `FontFace` unsupported. |
| Letters drawn in a normal font with odd spacing | The embedded font failed to load; the engine fell back to system fonts. |
| Blurry lettering | The canvas is displayed larger than its CSS box, or `w`/`h` do not match the displayed size. |
| Slow on a device | Check the warm-paint line in the self-test; call `TOADAL.prewarm()` at startup and avoid repainting every frame (paint once, then reuse the canvas). |

## Regenerating the spacing table

```
python3 tools/toadal_autokern.py font.ttf 0.018 0.010 0.052 0.014 > kern.json
#                                gap   close round inflate    (must equal TOADAL_PUFF in the engine)
```
Needs Pillow, numpy, scipy and a `.ttf`/`.otf` (convert a woff2 with fontTools). Put `rows` (joined as space-separated strings), `chars` and `median` into `TOADAL_KERN`. Running the shipped tool on Lilita One with the numbers above reproduces the embedded table exactly.

## Licence notes

The engine embeds **Lilita One** (Copyright 2011 Juan Montoreano, SIL Open Font License 1.1; text in `licenses/LilitaOne-OFL.txt`), as distributed by Fontsource / Google Fonts (Latin subset, WOFF2; outlines unmodified). Keep the licence file and the copyright comment in `toadal-lettering.js` with any redistribution. Everything else is your project's code and follows your project's licence.
