# Changelog

## 2.0.0 (2026-10-05): finished release
**Look**
- Letters are rounded and puffed (distance-transform closing, opening, inflate), then cached as sprites.
- Lit-gel surface: height field lit from the top-left (soft shade in the letter's own deep colour, rim light, specular streak, sheen, bounce light, edge occlusion).
- One merged chocolate border per line from the Euclidean distance field of the letters, with a measured colour ramp, extruded slab and soft drop shadow; optional warm glow.

**Spacing**
- Kerning table grew from 32 to 59 characters (digits and punctuation) and is measured on the puffed shapes. `toadal_autokern.py` v2 regenerates it.

**HUD Maker**
- New controls: Shine slider, six colour swatches, Fit box, Reset style; new Score counter preset (6 presets total).
- Resize repaints at half resolution while dragging and crisp 160 ms after; sprite cache with idle-time prewarm.
- Game JSON: `config` carries all lettering fields incl. `shine`; `content.text` carries the plain text.

**Engine and runtime**
- `TOADAL` namespace and CommonJS export; `toadalNaturalAspect`, `toadalPrewarm`, `toadalCacheStats`, `toadalClearCache`; `paint(..., {draft:true})`.
- Any CSS colour accepted for `accent` / `accent2`; invalid values fall back instead of failing a paint.
- Text limits: 4 lines, 100 characters per line.
- New `toadal-lettering-demo.html`: playground, Game JSON viewer, browser self-test.

**Fixes**
- Output no longer depends on what was painted before (scaled draws out of oversized reused canvases).
- Thin glyphs (hyphen, quotes) can no longer vanish when rounded.
- Documentation: the claim that GAMES sits on a baseline arc was wrong (flat baseline, larger end letters); erratum added to the earlier specs.

## 1.0.0 (2026-09-30): first delivery
- Vector-stroke engine: `LETTERING` element type, 5 presets, 32-character kerning table, positional rainbow, lockups, Game JSON, engine export.
