/* toadal-lettering.js -- exported from Crownfall HUD Maker (2026-10-05)
 * Game runtime usage:
 *   toadalPaintCanvasSafe(canvasEl, { w, h, letterText, paletteMode, accent, accent2, tightness, endBoost,
 *                                     lineScale, outlineWidth, shine, bounce, glossOn, glow });
 *   w/h = element size in CSS px (the canvas backing store is sized for you, 2x).
 *   toadalPrewarm()                 optional: build the A-Z / 0-9 sprites in idle time at startup.
 *   toadalNaturalAspect(settings)   width/height a box needs to show the text unscaled.
 * The same functions are also on one object: TOADAL.paintSafe / .paint / .prewarm / .aspect / .whenReady (and module.exports).
 * Nothing else is needed: the alphabet (Lilita One, OFL 1.1) is embedded. Same field names appear
 * under `config` in Game JSON. */
/* ===== TOADAL LETTERING ENGINE v2 :: BEGIN ========================================
 * Level A of the TOADAL context-reactive lettering system (see the concept brief and
 * TOADAL_LETTERING_INTEGRATION_PLAN). Self-contained: no dependency on the HUD Maker, so the
 * same source is exported for the game runtime (header "Lettering JS" button).
 *
 *   glyph library ..... Lilita One (SIL OFL 1.1, embedded below) as the stand-in bubble alphabet,
 *                       picked by measurement against the reference art. Each glyph is PUFFED:
 *                       a distance-transform morphology (closing, opening, inflate) rounds every
 *                       corner like a balloon, then it is rasterised once into a cached "sprite".
 *   contextual spacing  TOADAL_KERN, computed offline from the puffed outlines (closest-approach
 *                       collision measurement, toadal_autokern.py): T tucks over round letters,
 *                       A closes against L, digits and punctuation included.
 *   surface ........... lit gel: a height field from the glyph mask is lit from the top-left
 *                       (diffuse shade, rim light, Blinn-Phong specular streak, sheen, bounce
 *                       light, edge occlusion), baked into a per-glyph overlay.
 *   outline ........... ONE merged chocolate border per line, built from the Euclidean distance
 *                       field of the union of the letters (continuous colour ramp measured off the
 *                       reference), with a stacked slab, drop shadow and optional glow.
 *   palette rules ..... positional rainbow (1st red, 2nd blue, 3rd green, 4th purple, 5th orange,
 *                       6th gold), measured from the FEAST! and GAMES art.
 *   composition ....... end-letter boost, multi-line lockups ("TOADAL|GAMES"), fit-to-box.
 * =============================================================================== */
const TOADAL_ENGINE_VERSION = '2.0.0';
const TOADAL_FONT_NAME = 'Lilita One';
const TOADAL_FONT_FAMILY = "'Lilita One', 'Fredoka', 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif";
const TOADAL_FONT_WEIGHT = 400;
const TOADAL_CAP_EM = 0.70;                 // Lilita One cap height 0.701em
/* Lilita One, Copyright (c) 2011 Juan Montoreano (juan@remolacha.biz), with Reserved Font Name "Lilita One".
   Licensed under the SIL Open Font License 1.1 (http://scripts.sil.org/OFL); full text in licenses/LilitaOne-OFL.txt.
   Embedded as distributed by Fontsource / Google Fonts (Latin subset, WOFF2); the glyph outlines are not modified. */
const TOADAL_FONT_DATA = 'data:font/woff2;base64,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';
// Balloon puffing, in em. MUST equal the numbers toadal_autokern.py measured the kerning with.
const TOADAL_PUFF = {close:0.01,round:0.052,inflate:0.014};
const TOADAL_TIGHTNESS_EM_PER_PCT = 0.0015; // tightness slider: 100 = table spacing, +-1% = +-0.0015em
const TOADAL_LINE_OVERLAP = 0.10;           // later lines tuck this fraction of their cap-height into the line above (measured 6-12%)
const TOADAL_PIVOT = 0.40;                  // boosted end letters grow about a point 40% down their cap-height
const TOADAL_RAINBOW = [                    // positional palette, measured (spec V2 section 4)
  { top: '#fa2c53', bottom: '#f40437' },    // 1st  red
  { top: '#06c6fd', bottom: '#005dea' },    // 2nd  blue
  { top: '#75f310', bottom: '#049a13' },    // 3rd  green
  { top: '#dd49fd', bottom: '#9902fd' },    // 4th  purple
  { top: '#fed817', bottom: '#fd9306' },    // 5th  orange
  { top: '#fee822', bottom: '#fdb008' },    // 6th  gold (trailing punctuation slot in FEAST!)
];
const TOADAL_DEFAULT_OUTLINE = 9;           // border band, % of cap height
// Border colour ramp from the fill edge (t=0) outward (t=1): measured on the reference, T stem scan.
const TOADAL_BORDER_STOPS = [[0, 156, 56, 21], [0.27, 100, 29, 8], [0.45, 70, 15, 1], [0.6, 57, 10, 0], [0.75, 34, 0, 0], [1, 13, 0, 1]];
const TOADAL_SEAM = { color: [43, 10, 3], em: 0.017 };      // thin dark seam around each letter where neighbours meet
const TOADAL_SLAB = { drop: 0.045, midRgb: [74, 26, 10], rimRgb: [31, 6, 3] };   // extruded chocolate slab under the word   // extruded chocolate slab under the word
const TOADAL_SHADING = {
  light: [-0.42, -0.60, 0.68],              // direction TO the light (x right, y down, z toward the viewer)
  blur1: 0.030, blur2: 0.080, h1: 0.075, h2: 0.045,        // height field = h1*blur(mask,blur1) + h2*blur(mask,blur2), em
  shade: { k: 1.1, max: 0.55 }, lit: { k: 0.35, max: 0.16 },
  spec: { shin: 48, k: 1.0 }, rim: { k: 0.55, lo: 0.60, hi: 0.82 },
  sheen: 0.12, bounce: 0.08, ao: 0.10,
};
const TOADAL_SPRITE_BUCKETS = [96, 128, 192, 256, 384, 512];
const TOADAL_BORDER_PIXELS = 600000;       // the border's distance field is computed on at most this many pixels (bigger lines use a reduced grid, then scale up)
const TOADAL_SHADOW_SCALE = 4;             // soft shadows / glow are blurred on a canvas this many times smaller, then scaled up
const TOADAL_CACHE_BYTES = 96 * 1024 * 1024;
const TOADAL_MAX_LINE = 100;               // characters per line (text beyond this is ignored)
const TOADAL_KERN = {"chars":"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,:;-'\"&%+/#*()_@$=<>","gap":0.018,"median":-53,"rows":["-12 -42 -68 -32 -32 -28 -70 -32 -2 2 -32 -22 -35 -32 -68 -28 -68 -32 -22 -118 -48 -152 -100 -32 -145 -38 -70 -125 -35 -5 -45 -28 -62 -90 -38 -68 -28 -142 -2 -90 -40 -48 -60 -166 -178 -52 -92 -90 -22 -112 -288 -120 -112 -122 -55 -22 -85 -112 -52","-31 -41 -29 -31 -31 -26 -31 -31 -11 -4 -31 -21 -36 -31 -29 -26 -29 -31 -16 -19 -14 -54 -51 -59 -56 -24 -34 -26 -34 -19 -6 -36 -26 -36 -9 -49 -36 -89 -4 -109 -41 -66 -24 -89 -89 -26 -44 -66 -76 -76 -204 -86 -146 -251 -24 -26 -51 -84 -54","-11 -41 -71 -31 -31 -26 -74 -31 -1 6 -31 -21 -34 -31 -71 -26 -74 -31 -14 -1 -26 -21 -26 -34 -14 -29 -74 -11 -29 -4 -64 -26 -61 -21 -31 -66 -26 -64 -1 -99 -39 -59 -76 -71 -66 -46 -44 -231 -39 -126 -231 -111 -114 -184 -49 -16 -91 -186 -46","-69 -44 -14 -34 -34 -29 -14 -34 -46 -49 -34 -24 -44 -34 -14 -29 -14 -34 -41 -29 -14 -61 -46 -106 -76 -64 -19 -36 -76 -66 -1 -56 -19 -41 -26 -29 -44 -106 -46 -159 -41 -41 -29 -81 -84 -49 -31 -24 -131 -84 -196 -79 -161 -334 -29 -26 -54 -46 -86","-21 -51 -71 -41 -41 -36 -73 -41 -11 -3 -41 -31 -43 -41 -71 -36 -71 -41 -21 2 -23 -18 -23 -41 -11 -31 -71 -8 -38 -13 -63 -36 -58 -18 -31 -51 -36 -61 -11 -103 -48 -61 -83 -68 -63 -46 -33 -93 -36 -131 -213 -113 -111 -136 -51 -26 -88 -116 -53","-134 -44 -62 -34 -34 -29 -62 -34 -2 -107 -34 -24 -54 -34 -59 -29 -59 -34 -42 11 -14 -9 -14 -32 -2 -34 -59 1 -29 -24 -59 -57 -72 -9 -47 -39 -34 -52 -126 -168 -102 -102 -92 -59 -54 -59 -24 -84 -224 -154 -202 -122 -102 -260 -87 -29 -119 -107 -49","-31 -59 -29 -49 -49 -44 -29 -49 -21 -14 -49 -39 -54 -49 -29 -44 -29 -49 -31 -19 -29 -39 -44 -51 -31 -41 -34 -29 -49 -24 -11 -46 -34 -39 -26 -71 -46 -81 -21 -116 -59 -64 -34 -89 -84 -46 -61 -41 -54 -89 -246 -94 -131 -196 -39 -36 -66 -61 -64","-31 -61 -31 -51 -51 -46 -31 -51 -19 -14 -51 -41 -54 -51 -31 -46 -31 -51 -31 -6 -31 -26 -31 -49 -19 -41 -36 -16 -46 -24 -14 -46 -36 -26 -29 -41 -46 -69 -21 -109 -59 -59 -36 -76 -71 -46 -39 -41 -44 -91 -199 -96 -119 -146 -41 -36 -69 -64 -64","1 -29 -51 -19 -19 -14 -54 -19 11 19 -19 -9 -21 -19 -51 -14 -54 -19 1 21 -4 1 -4 -19 6 -11 -51 11 -16 9 -46 -14 -39 1 -14 -36 -14 -41 11 -81 -26 -39 -69 -49 -44 -29 -16 -109 -14 -114 -199 -94 -91 -114 -31 -4 -71 -131 -31","-39 -47 -17 -37 -37 -32 -17 -37 -4 -12 -37 -27 -42 -37 -17 -32 -17 -37 -24 8 -17 -12 -17 -34 -4 -32 -22 -2 -32 -27 1 -44 -22 -12 -14 -27 -37 -54 -12 -117 -44 -44 -22 -62 -57 -32 -24 -27 -84 -77 -184 -82 -104 -232 -27 -22 -54 -49 -52","-8 -35 -68 -25 -25 -20 -70 -25 5 12 -25 -15 -28 -25 -68 -20 -70 -25 -5 -15 -38 -32 -38 -30 -25 -20 -68 -25 -22 2 -68 -20 -55 -35 -25 -62 -20 -78 5 -92 -32 -52 -82 -82 -78 -40 -65 -160 -40 -132 -262 -102 -122 -185 -40 -10 -92 -180 -38","8 -22 -38 -12 -12 -8 -40 -12 18 25 -12 -2 -15 -12 -38 -8 -38 -12 8 -115 -10 -120 -70 -15 -162 -5 -38 -115 -10 15 -30 -8 -28 -72 -2 -48 -8 -122 18 -75 -20 -32 -42 -166 -215 -18 -72 -185 -8 -92 -239 -82 -98 -108 -20 2 -55 -155 -25","-34 -64 -44 -54 -54 -49 -44 -54 -24 -17 -54 -44 -57 -54 -44 -49 -44 -54 -34 -32 -39 -54 -59 -54 -47 -47 -49 -42 -52 -27 -24 -49 -47 -52 -37 -59 -49 -94 -24 -114 -62 -72 -47 -102 -99 -54 -59 -54 -49 -99 -219 -109 -137 -154 -49 -39 -77 -77 -67","-33 -63 -33 -53 -53 -48 -33 -53 -21 -16 -53 -43 -56 -53 -33 -48 -33 -53 -33 -8 -33 -28 -33 -51 -21 -43 -38 -18 -48 -26 -16 -48 -38 -28 -31 -43 -48 -71 -23 -113 -61 -61 -38 -78 -73 -48 -41 -43 -48 -93 -201 -98 -121 -153 -43 -38 -71 -66 -66","-66 -44 -14 -34 -34 -29 -14 -34 -51 -46 -34 -24 -44 -34 -14 -29 -14 -34 -44 -34 -14 -64 -49 -106 -81 -61 -19 -41 -76 -64 1 -56 -19 -46 -24 -31 -44 -111 -44 -156 -41 -41 -26 -84 -89 -46 -34 -24 -129 -81 -199 -79 -166 -306 -26 -29 -56 -46 -91","-115 -52 -30 -42 -42 -38 -30 -42 -30 -135 -42 -32 -58 -42 -30 -38 -30 -42 -40 -18 -22 -52 -45 -88 -60 -60 -35 -22 -62 -60 -55 -65 -38 -32 -52 -32 -48 -90 -126 -168 -50 -50 -92 -80 -82 -60 -30 -50 -238 -118 -192 -98 -148 -314 -60 -28 -60 -80 -75","-79 -54 -24 -44 -44 -39 -24 -44 -61 -56 -44 -34 -54 -44 -24 -39 -24 -44 -54 -44 -24 -74 -59 -119 -91 -74 -29 -51 -89 -76 -9 -66 -29 -56 -36 -41 -54 -121 -56 -166 -51 -51 -36 -94 -99 -56 -44 -34 -114 -94 -209 -89 -176 -146 -36 -39 -66 -56 -101","-18 -42 -45 -32 -32 -28 -45 -32 -2 5 -32 -22 -35 -32 -45 -28 -45 -32 -12 -20 -32 -55 -50 -38 -60 -28 -48 -28 -30 -5 -70 -28 -55 -35 -30 -42 -28 -90 -2 -100 -40 -60 -80 -88 -88 -45 -40 -72 -48 -130 -200 -110 -130 -188 -48 -18 -72 -105 -45","-46 -44 -21 -34 -34 -29 -24 -34 -24 -19 -34 -24 -41 -34 -21 -29 -21 -34 -29 -11 -14 -31 -36 -54 -24 -36 -26 -21 -49 -36 1 -51 -21 -31 -11 -79 -49 -74 -19 -124 -56 -71 -19 -81 -76 -31 -56 -44 -94 -74 -241 -81 -124 -241 -24 -39 -51 -64 -69","-122 -19 -39 -9 -9 -4 -39 -9 23 -82 -9 1 -29 -9 -37 -4 -37 -9 -19 36 11 16 11 -9 21 -9 -37 26 -4 1 -117 -32 -49 16 -27 -17 -9 -27 -124 -168 -77 -79 -139 -34 -29 -37 -2 -144 -144 -132 -179 -99 -77 -239 -102 -9 -92 -167 -24","-48 -46 -16 -36 -36 -31 -16 -36 -3 -18 -36 -26 -41 -36 -16 -31 -16 -36 -31 9 -16 -11 -16 -33 -3 -36 -21 -1 -31 -26 2 -51 -21 -11 -13 -26 -36 -53 -18 -126 -43 -43 -21 -61 -56 -31 -23 -26 -98 -76 -183 -81 -103 -261 -26 -21 -53 -48 -51","-156 -39 -66 -29 -29 -24 -64 -29 4 -101 -29 -19 -51 -29 -64 -24 -64 -29 -54 16 -9 -4 -9 -26 4 -29 -69 4 -24 -19 -84 -51 -76 -6 -61 -51 -29 -46 -126 -168 -81 -81 -114 -54 -49 -71 -34 -91 -181 -146 -209 -134 -96 -296 -101 -44 -94 -119 -56","-118 -43 -56 -33 -33 -28 -56 -33 -1 -91 -33 -23 -56 -33 -56 -28 -56 -33 -51 9 -13 -8 -13 -31 -1 -33 -61 -1 -31 -26 -61 -56 -66 -11 -58 -48 -33 -53 -93 -168 -73 -73 -88 -58 -53 -71 -36 -73 -136 -138 -203 -126 -101 -248 -86 -41 -86 -101 -58","-31 -61 -113 -51 -51 -46 -116 -51 -21 -16 -51 -41 -53 -51 -113 -46 -113 -51 -41 -11 -33 -28 -33 -51 -21 -56 -113 -21 -51 -23 -106 -46 -98 -31 -68 -86 -46 -73 -21 -108 -58 -68 -116 -78 -73 -83 -61 -173 -43 -156 -258 -141 -121 -146 -83 -41 -133 -193 -73","-140 -22 -78 -12 -12 -8 -75 -12 20 -85 -12 -2 -35 -12 -72 -8 -72 -12 -50 30 8 12 8 -10 20 -12 -75 20 -10 -5 -142 -35 -88 10 -55 -50 -12 -32 -126 -168 -100 -102 -178 -38 -32 -68 -20 -132 -188 -165 -215 -130 -80 -292 -132 -40 -112 -165 -48","-26 -43 -58 -33 -33 -28 -56 -33 -1 -6 -33 -23 -46 -33 -53 -28 -53 -33 -23 12 -13 -18 -21 -43 -13 -33 -56 2 -28 -16 -56 -38 -56 -8 -31 -36 -36 -53 -13 -111 -51 -68 -66 -61 -58 -46 -21 -136 -43 -118 -196 -113 -108 -143 -48 -28 -83 -171 -48","-69 -46 -16 -36 -36 -31 -16 -36 -51 -44 -36 -26 -46 -36 -16 -31 -16 -36 -44 -34 -16 -64 -51 -106 -81 -61 -21 -39 -74 -64 -1 -59 -21 -46 -26 -34 -46 -109 -44 -154 -44 -44 -29 -86 -89 -46 -34 -26 -126 -84 -199 -81 -166 -289 -29 -31 -59 -49 -91","-34 -64 -34 -54 -54 -49 -34 -54 -21 -16 -54 -44 -56 -54 -34 -49 -34 -54 -34 -9 -34 -29 -34 -51 -21 -44 -39 -19 -49 -26 -16 -49 -39 -29 -31 -44 -49 -71 -24 -114 -61 -61 -39 -79 -74 -49 -41 -44 -49 -94 -201 -99 -121 -151 -44 -39 -71 -66 -66","-15 -42 -38 -32 -32 -28 -35 -32 -2 5 -32 -22 -35 -32 -38 -28 -38 -32 -12 -2 -20 -38 -35 -35 -38 -22 -40 -10 -30 -5 -50 -28 -48 -20 -22 -30 -28 -70 -2 -100 -40 -52 -68 -72 -72 -38 -28 -70 -38 -115 -188 -102 -122 -140 -40 -18 -65 -102 -45","-51 -53 -38 -43 -43 -38 -38 -43 -31 -21 -43 -33 -48 -43 -38 -38 -38 -43 -33 -21 -23 -53 -53 -81 -51 -41 -41 -28 -53 -38 -13 -56 -36 -38 -21 -61 -53 -86 -23 -128 -61 -86 -31 -91 -91 -38 -51 -71 -98 -83 -216 -96 -143 -261 -33 -43 -61 -91 -71","-53 -53 -31 -43 -43 -38 -33 -43 -41 -33 -43 -33 -48 -43 -31 -38 -31 -43 -36 -76 -23 -96 -81 -93 -88 -48 -36 -86 -63 -51 -6 -66 -31 -96 -21 -106 -58 -138 -31 -143 -68 -101 -28 -146 -141 -38 -108 -66 -113 -83 -268 -91 -173 -228 -33 -51 -61 -83 -88","-64 -61 -39 -51 -51 -46 -41 -51 -41 -34 -51 -41 -56 -51 -39 -46 -41 -51 -46 -34 -31 -54 -59 -76 -46 -54 -44 -44 -64 -51 -16 -66 -41 -54 -29 -89 -66 -96 -34 -141 -71 -86 -36 -104 -99 -46 -71 -59 -114 -91 -249 -101 -146 -271 -41 -56 -69 -81 -84","-55 -52 -30 -42 -42 -38 -32 -42 -32 -25 -42 -32 -50 -42 -30 -38 -30 -42 -38 -52 -22 -72 -78 -85 -65 -45 -35 -62 -55 -42 -8 -58 -30 -75 -20 -88 -58 -115 -25 -132 -62 -78 -28 -122 -118 -38 -100 -50 -102 -82 -290 -90 -165 -255 -32 -48 -60 -72 -75","-138 -30 -50 -20 -20 -15 -48 -20 12 -92 -20 -10 -40 -20 -48 -15 -48 -20 -35 25 0 0 -2 -22 8 -20 -50 15 -15 -10 -70 -42 -60 5 -42 -35 -20 -38 -120 -168 -65 -65 -102 -45 -42 -55 -15 -78 -172 -132 -190 -115 -90 -272 -88 -25 -78 -105 -38","-45 -45 -28 -35 -35 -30 -30 -35 -22 -15 -35 -25 -40 -35 -28 -30 -28 -35 -28 -25 -15 -60 -58 -75 -62 -35 -30 -35 -45 -32 -2 -48 -25 -42 -12 -60 -50 -95 -15 -122 -52 -80 -22 -98 -98 -30 -52 -58 -92 -75 -215 -88 -155 -250 -25 -38 -52 -75 -65","-75 -48 -18 -38 -38 -32 -18 -38 -38 -52 -38 -28 -50 -38 -18 -32 -18 -38 -40 -22 -18 -58 -48 -95 -65 -65 -22 -28 -68 -65 -5 -60 -22 -38 -32 -30 -45 -95 -50 -160 -45 -45 -32 -80 -85 -52 -30 -28 -132 -90 -192 -82 -155 -282 -35 -28 -58 -52 -80","-39 -69 -52 -59 -59 -54 -52 -59 -29 -22 -59 -49 -62 -59 -52 -54 -52 -59 -39 -17 -42 -37 -42 -59 -29 -52 -57 -27 -57 -32 -39 -54 -59 -37 -52 -57 -54 -79 -29 -117 -67 -74 -62 -87 -82 -67 -52 -64 -49 -117 -158 -119 -129 -149 -67 -44 -87 -87 -72","-174 -86 -81 -76 -76 -71 -81 -76 -51 -154 -76 -66 -94 -76 -81 -71 -81 -76 -74 -36 -56 -71 -69 -101 -71 -81 -84 -46 -79 -76 -149 -99 -91 -54 -84 -71 -79 -104 -126 -168 -99 -99 -229 -106 -106 -94 -64 -136 -249 -164 -226 -149 -161 -321 -129 -64 -111 -176 -94","-1 -31 -44 -21 -21 -16 -46 -21 9 16 -21 -11 -24 -21 -44 -16 -44 -21 -1 -124 -16 -126 -76 -21 -126 -11 -44 -124 -19 6 -36 -16 -31 -79 -6 -56 -16 -126 9 -74 -29 -31 -51 -126 -126 -21 -81 -126 -6 -99 -126 -89 -96 -91 -26 -6 -61 -126 -34","-2 -32 -58 -22 -22 -18 -60 -22 8 15 -22 -12 -25 -22 -58 -18 -58 -22 -2 -125 -28 -132 -82 -22 -168 -15 -58 -125 -20 5 -52 -18 -42 -82 -15 -58 -18 -132 8 -88 -30 -45 -90 -166 -168 -30 -82 -168 -20 -128 -168 -95 -110 -78 -32 -8 -80 -168 -35","-12 -42 -12 -32 -32 -27 -12 -32 -2 6 -32 -22 -34 -32 -12 -27 -12 -32 -12 -47 -12 -52 -37 -32 -82 -22 -17 -47 -29 -4 -22 -27 -17 -49 -17 -22 -27 -124 -2 -84 -39 -39 -62 -72 -74 -32 -22 -22 -17 -107 -152 -77 -107 -102 -32 -17 -49 -47 -44","-17 -42 -12 -32 -32 -27 -12 -32 -7 1 -32 -22 -39 -32 -12 -27 -12 -32 -17 -47 -12 -52 -37 -37 -82 -29 -17 -47 -34 -9 -19 -32 -17 -49 -29 -22 -32 -124 -7 -99 -39 -39 -62 -72 -74 -44 -22 -22 -32 -107 -152 -77 -124 -89 -32 -19 -49 -47 -49","-60 -48 -25 -38 -38 -32 -28 -38 -72 -52 -38 -28 -45 -38 -25 -32 -25 -38 -50 -140 -18 -110 -75 -108 -190 -68 -30 -140 -90 -70 0 -98 -25 -152 -18 -95 -52 -135 -55 -168 -92 -90 -22 -166 -253 -40 -162 -55 -138 -78 -289 -85 -175 -289 -28 -68 -58 -75 -122","-166 -96 -94 -86 -86 -81 -91 -86 -54 -159 -86 -76 -106 -86 -91 -81 -91 -86 -94 -41 -66 -61 -66 -84 -54 -86 -96 -51 -81 -76 -154 -109 -104 -61 -101 -89 -86 -104 -126 -166 -109 -109 -166 -111 -106 -111 -79 -156 -166 -166 -166 -161 -154 -166 -136 -81 -121 -166 -104","-175 -80 -85 -70 -70 -65 -85 -70 -38 -142 -70 -60 -90 -70 -85 -65 -85 -70 -82 -25 -50 -45 -50 -68 -38 -70 -88 -35 -65 -60 -145 -92 -95 -45 -90 -80 -70 -88 -126 -168 -100 -102 -253 -95 -90 -102 -68 -148 -253 -168 -235 -152 -138 -253 -128 -72 -112 -180 -92","-99 -54 -24 -44 -44 -39 -24 -44 -109 -112 -44 -34 -57 -44 -24 -39 -24 -44 -57 -114 -24 -79 -59 -152 -124 -132 -29 -122 -142 -119 -32 -67 -32 -132 -72 -42 -54 -179 -112 -168 -52 -52 -69 -109 -112 -82 -49 -34 -184 -134 -224 -92 -179 -329 -47 -42 -69 -62 -162","-48 -61 -43 -51 -51 -46 -46 -51 -28 -18 -51 -41 -56 -51 -43 -46 -43 -51 -33 -91 -31 -111 -93 -71 -103 -41 -48 -103 -51 -33 -21 -53 -43 -113 -28 -101 -51 -151 -23 -126 -61 -83 -38 -161 -156 -46 -128 -73 -83 -91 -306 -103 -163 -201 -41 -41 -68 -93 -68","-102 -64 -34 -54 -54 -49 -34 -54 -119 -219 -54 -44 -64 -54 -34 -49 -34 -54 -84 -157 -34 -99 -77 -169 -154 -149 -39 -157 -197 -129 -32 -77 -39 -204 -72 -62 -64 -179 -126 -168 -62 -62 -67 -159 -162 -97 -77 -44 -212 -132 -259 -99 -194 -331 -49 -67 -97 -67 -217","-168 -43 -123 -36 -33 -28 -121 -33 -6 -108 -31 -23 -56 -33 -118 -28 -118 -33 -93 7 -16 -11 -13 -28 -1 -38 -118 -3 -43 -38 -203 -56 -131 -16 -96 -93 -28 -66 -126 -168 -151 -152 -243 -63 -58 -108 -58 -193 -315 -216 -263 -166 -108 -315 -186 -81 -163 -226 -88","-123 -76 -56 -66 -66 -61 -53 -66 -88 -113 -66 -56 -81 -66 -53 -61 -53 -66 -66 -66 -46 -83 -71 -136 -106 -108 -58 -71 -111 -108 -66 -88 -66 -76 -81 -56 -73 -143 -113 -168 -73 -73 -86 -103 -108 -86 -56 -98 -201 -141 -218 -123 -186 -340 -91 -51 -83 -138 -128","-277 -197 -187 -187 -187 -182 -184 -187 -182 -254 -187 -177 -204 -187 -184 -182 -184 -187 -184 -164 -167 -194 -187 -242 -212 -207 -189 -172 -212 -209 -244 -209 -197 -177 -194 -177 -158 -242 -126 -168 -152 -152 -289 -166 -224 -204 -174 -234 -306 -267 -306 -237 -232 -306 -229 -172 -214 -266 -222","-102 -122 -160 -112 -112 -108 -158 -112 -80 -100 -112 -102 -128 -112 -158 -108 -158 -112 -128 -68 -92 -88 -92 -110 -80 -112 -160 -78 -108 -102 -148 -122 -170 -88 -145 -140 -112 -130 -88 -140 -125 -98 -168 -138 -132 -158 -115 -175 -72 -222 -237 -222 -178 -132 -168 -128 -188 -200 -140","-102 -89 -59 -79 -79 -74 -59 -79 -79 -72 -79 -69 -89 -79 -59 -74 -59 -79 -84 -79 -59 -114 -99 -124 -119 -92 -64 -87 -102 -87 -42 -102 -64 -94 -64 -79 -89 -152 -72 -168 -87 -87 -67 -134 -137 -84 -84 -69 -122 -124 -232 -124 -212 -182 -69 -79 -104 -92 -122","-129 -159 -309 -149 -149 -134 -324 -154 -124 -161 -151 -144 -161 -154 -311 -144 -309 -144 -209 -246 -279 -289 -226 -154 -309 -171 -296 -223 -166 -189 -329 -161 -266 -201 -244 -196 -139 -241 -99 -84 -136 -41 -289 -166 -253 -259 -206 -331 -21 -271 -306 -206 -149 -54 -196 -214 -319 -266 -248","-124 -92 -62 -82 -82 -77 -62 -82 -114 -119 -82 -72 -92 -82 -62 -77 -62 -82 -94 -97 -62 -114 -99 -172 -144 -137 -67 -102 -144 -137 -52 -104 -67 -109 -82 -79 -92 -172 -119 -168 -89 -89 -82 -134 -139 -104 -84 -72 -207 -139 -252 -127 -219 -302 -77 -79 -107 -94 -154","-31 -29 -6 -19 -19 -14 -9 -19 -9 -1 -19 -9 -26 -19 -6 -14 -6 -19 -14 -4 1 -24 -29 -46 -16 -21 -11 -14 -31 -19 16 -34 -6 -24 4 -64 -34 -66 -1 -109 -39 -56 -4 -74 -69 -14 -49 -29 -81 -59 -234 -69 -116 -236 -9 -24 -36 -49 -51","-75 -70 -48 -60 -60 -55 -45 -60 -65 -55 -60 -50 -68 -60 -45 -55 -45 -60 -58 -80 -40 -82 -68 -115 -112 -72 -50 -80 -88 -75 -30 -82 -52 -82 -38 -50 -68 -158 -55 -168 -68 -68 -48 -102 -105 -55 -52 -75 -142 -100 -218 -112 -185 -319 -50 -48 -78 -112 -115","-91 -114 -134 -104 -104 -99 -131 -104 -74 -66 -104 -94 -106 -104 -129 -99 -129 -104 -84 -61 -86 -94 -94 -114 -94 -96 -131 -71 -101 -79 -136 -101 -126 -81 -96 -111 -99 -129 -74 -168 -111 -131 -161 -134 -134 -111 -96 -244 -126 -209 -266 -179 -186 -266 -114 -89 -164 -266 -116","-115 -78 -48 -68 -68 -62 -48 -68 -132 -165 -68 -58 -78 -68 -48 -62 -48 -68 -105 -170 -48 -120 -92 -178 -178 -158 -52 -170 -202 -145 -40 -92 -52 -185 -80 -80 -80 -188 -126 -168 -78 -78 -75 -166 -182 -105 -102 -58 -220 -138 -248 -112 -210 -248 -62 -90 -125 -80 -232"]};

let _toadalMeasureCtx = null;
let _toadalKernRows = null;
let _toadalFrame = 0;
let _toadalLastR = 256;
const _toadalSprites = new Map();
let _toadalSpriteBytes = 0;
const _toadalScratch = {};
let _toadalBorderLut = null;

function toadalNum(v, d) { if (v === null || v === undefined || v === '') return d; const n = Number(v); return Number.isFinite(n) ? n : d; }
function toadalClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, toadalNum(v, lo))); }
function toadalRgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return `rgba(254,232,34,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function toadalFont(px) { return `${TOADAL_FONT_WEIGHT} ${px.toFixed(2)}px ${TOADAL_FONT_FAMILY}`; }
function toadalMakeCanvas(w, h) {
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return new OffscreenCanvas(w, h);
}
function toadalCtx(canvas, readback) {
  const c = canvas.getContext('2d', readback ? { willReadFrequently: true } : undefined);
  if (c) { c.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in c) c.imageSmoothingQuality = 'high'; }
  return c;
}
function toadalSmooth(t) { return t * t * (3 - 2 * t); }
// Any CSS colour ("#fc0", "red", "rgb(1,2,3)" ...) -> "#rrggbb"; anything unparseable -> the fallback. Never throws.
function toadalHex(color, fallback) {
  if (typeof color !== 'string' || !color.trim()) return fallback;
  if (!_toadalMeasureCtx) _toadalMeasureCtx = toadalCtx(toadalMakeCanvas(8, 8));
  const g = _toadalMeasureCtx;
  g.fillStyle = '#010203'; g.fillStyle = color.trim();
  const v = String(g.fillStyle).toLowerCase();                 // browsers normalise to #rrggbb or rgba(r, g, b, a)
  if (v === '#010203' && color.trim().toLowerCase().replace(/\s/g, '') !== '#010203') return fallback;
  if (v[0] === '#' && v.length === 7) return v;
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(v);
  return m ? '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('') : fallback;
}
// Deep tone used for shading a letter: its own bottom colour, a little darker and more saturated.
function toadalShadeColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  const n = m ? parseInt(m[1], 16) : 0xfda80a;
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const k = 0.80, sat = 1.12;
  const l = (mx + mn) / 2;
  r = Math.min(255, Math.max(0, (l + (r - l) * sat) * k)); g = Math.min(255, Math.max(0, (l + (g - l) * sat) * k)); b = Math.min(255, Math.max(0, (l + (b - l) * sat) * k));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// "TOADAL|FEAST!" -> ['TOADAL', 'FEAST!']  (upper-cased, max 4 lines, '|' starts a new line)
function toadalLines(text) {
  const lines = String(text == null ? '' : text).toUpperCase().split('|')
    .map((s) => Array.from(s.replace(/\s+/g, ' ').trim()).slice(0, TOADAL_MAX_LINE).join('')).filter((s) => s.length).slice(0, 4);
  return lines.length ? lines : ['TOADAL'];
}

// Measured pair kerning in em, relative to the font's natural advance.
function toadalKernEm(a, b) {
  if (a === ' ' || b === ' ') return 0;
  if (!_toadalKernRows) _toadalKernRows = TOADAL_KERN.rows.map((r) => r.split(' ').map(Number));
  const ia = TOADAL_KERN.chars.indexOf(a);
  const ib = TOADAL_KERN.chars.indexOf(b);
  if (ia < 0 || ib < 0) return TOADAL_KERN.median / 1000;
  return _toadalKernRows[ia][ib] / 1000;
}

// Advance + ink bounds of one glyph at a given pixel size (canvas measureText; needs the font loaded).
function toadalMetrics(ch, px) {
  if (!_toadalMeasureCtx) _toadalMeasureCtx = toadalCtx(toadalMakeCanvas(8, 8));
  _toadalMeasureCtx.font = toadalFont(px);
  const m = _toadalMeasureCtx.measureText(ch);
  const adv = m.width;
  if (ch === ' ') return { adv, l: 0, r: adv, asc: 0, desc: 0 };
  return {
    adv,
    l: -toadalNum(m.actualBoundingBoxLeft, 0),
    r: toadalNum(m.actualBoundingBoxRight, adv),
    asc: toadalNum(m.actualBoundingBoxAscent, px * TOADAL_CAP_EM),
    desc: toadalNum(m.actualBoundingBoxDescent, 0),
  };
}

/* ---- distance transform (Felzenszwalb & Huttenlocher, exact Euclidean) ------------------- */
const TOADAL_INF = 1e20;
// f: Float32Array(w*h) seeds, 0 on source pixels and TOADAL_INF elsewhere. Becomes the SQUARED distance to the nearest source.
function toadalEdt(f, w, h) {
  const n = Math.max(w, h);
  const g = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1), v = new Int32Array(n);
  const pass = (len) => {
    let k = 0; v[0] = 0; z[0] = -TOADAL_INF; z[1] = TOADAL_INF;
    for (let q = 1; q < len; q++) {
      let s;
      for (;;) {
        const p = v[k];
        s = ((g[q] + q * q) - (g[p] + p * p)) / (2 * q - 2 * p);
        if (s <= z[k]) k--; else break;
      }
      k++; v[k] = q; z[k] = s; z[k + 1] = TOADAL_INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; const dq = q - v[k]; d[q] = dq * dq + g[v[k]]; }
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) g[y] = f[y * w + x];
    pass(h);
    for (let y = 0; y < h; y++) f[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    const o = y * w;
    for (let x = 0; x < w; x++) g[x] = f[o + x];
    pass(w);
    for (let x = 0; x < w; x++) f[o + x] = d[x];
  }
}

// Separable box blur, zero padded, 3 passes per axis (close to a gaussian with sigma ~ r).
function toadalBlur(src, w, h, r) {
  const a = Float32Array.from(src), b = new Float32Array(src.length);
  const inv = 1 / (2 * r + 1);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      const o = y * w; let acc = 0;
      for (let x = 0; x <= r && x < w; x++) acc += a[o + x];
      for (let x = 0; x < w; x++) {
        b[o + x] = acc * inv;
        const add = x + r + 1, rem = x - r;
        if (add < w) acc += a[o + add];
        if (rem >= 0) acc -= a[o + rem];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = 0; y <= r && y < h; y++) acc += b[y * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc * inv;
        const add = y + r + 1, rem = y - r;
        if (add < h) acc += b[add * w + x];
        if (rem >= 0) acc -= b[rem * w + x];
      }
    }
  }
  return a;
}

/* ---- glyph sprites: puffed mask + seam + lit-gel overlay, cached per (char, size bucket) --- */
function toadalBucket(devPx) {
  let best = TOADAL_SPRITE_BUCKETS[0], bd = Infinity;
  for (const R of TOADAL_SPRITE_BUCKETS) { const dd = Math.abs(Math.log(Math.max(1, devPx) / R)); if (dd < bd) { bd = dd; best = R; } }
  return best;
}

// Two planes: `shade` (alpha only; tinted with the letter's own deep colour at paint time, so shading
// stays saturated instead of going muddy) and `light` (white: sheen, lit slopes, bounce, specular streak).
function toadalBuildOverlay(alpha, w, h, R, oy) {
  const SH = TOADAL_SHADING, n = w * h;
  const hA = toadalBlur(alpha, w, h, Math.max(1, Math.round(SH.blur1 * R)));
  const hB = toadalBlur(alpha, w, h, Math.max(2, Math.round(SH.blur2 * R)));
  const H1 = SH.h1 * R, H2 = SH.h2 * R;
  const ht = new Float32Array(n);
  for (let i = 0; i < n; i++) ht[i] = H1 * hA[i] + H2 * hB[i];
  const cap = TOADAL_CAP_EM * R, capTop = oy - cap;
  let lx = SH.light[0], ly = SH.light[1], lz = SH.light[2];
  const ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
  let hx = lx, hy = ly, hz = lz + 1;
  const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
  const shade = new Uint8ClampedArray(n * 4), light = new Uint8ClampedArray(n * 4);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, a = alpha[i];
      if (a < 0.004) continue;
      const gx = (ht[i + 1] - ht[i - 1]) * 0.5, gy = (ht[i + w] - ht[i - w]) * 0.5;
      const inv = 1 / Math.sqrt(gx * gx + gy * gy + 1);
      const nx = -gx * inv, ny = -gy * inv, nz = inv;
      const dd = nx * lx + ny * ly + nz * lz - lz;
      const edgeIn = Math.min(1, Math.max(0, (0.95 - hA[i]) / 0.45));
      // dark: edge occlusion, then shade on the surfaces facing away from the light
      const ao = SH.ao * Math.min(1, Math.max(0, (0.92 - hA[i]) / 0.42));
      const sh = Math.min(SH.shade.max, Math.max(0, -dd * SH.shade.k));
      const dark = sh + ao * (1 - sh);
      // light: broad top sheen, light on lit slopes, bounce light low on the letter, specular streak
      let keep = 1;
      const yy = (y - (capTop - 0.02 * R)) / (cap * 0.62);
      if (yy > 0 && yy < 1) keep *= 1 - SH.sheen * (1 - toadalSmooth(yy));
      keep *= 1 - Math.min(SH.lit.max, Math.max(0, dd * SH.lit.k));
      const yb = Math.min(1, Math.max(0, (y - (oy - cap * 0.30)) / (cap * 0.36)));
      if (yb > 0) keep *= 1 - SH.bounce * toadalSmooth(yb) * (0.35 + 0.65 * edgeIn);
      const ndh = nx * hx + ny * hy + nz * hz;
      if (ndh > 0) keep *= 1 - Math.min(1, SH.spec.k * Math.pow(ndh, SH.spec.shin));
      if (dd > 0) {                                                  // crisp rim light just inside the lit edges
        const mid = (SH.rim.lo + SH.rim.hi) / 2;
        const up = toadalSmooth(Math.min(1, Math.max(0, (hA[i] - SH.rim.lo) / (mid - SH.rim.lo))));
        const dn = 1 - toadalSmooth(Math.min(1, Math.max(0, (hA[i] - mid) / (SH.rim.hi - mid))));
        keep *= 1 - SH.rim.k * up * dn * Math.min(1, dd * 3);
      }
      const o = i * 4;
      shade[o] = shade[o + 1] = shade[o + 2] = 255; shade[o + 3] = Math.round(dark * a * 255);
      light[o] = light[o + 1] = light[o + 2] = 255; light[o + 3] = Math.round((1 - keep) * a * 255);
    }
  }
  return { shade, light };
}

function toadalBuildSprite(ch, R) {
  if (ch === ' ') return null;
  const m0 = toadalMetrics(ch, R);
  const mg = Math.ceil(R * 0.10) + 2;
  const abl = Math.max(0, Math.ceil(-m0.l)), abr = Math.max(1, Math.ceil(m0.r));
  const asc = Math.max(1, Math.ceil(m0.asc)), desc = Math.max(0, Math.ceil(m0.desc));
  const w = abl + abr + 2 * mg, h = asc + desc + 2 * mg;
  const ox = mg + abl, oy = mg + asc, n = w * h;
  const cv = toadalMakeCanvas(w, h), g = toadalCtx(cv, true);
  g.font = toadalFont(R); g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = '#000';
  g.fillText(ch, ox, oy);
  const px = g.getImageData(0, 0, w, h).data;
  const S = new Uint8Array(n), f = new Float32Array(n);
  for (let i = 0; i < n; i++) S[i] = px[i * 4 + 3] >= 128 ? 1 : 0;
  const c = TOADAL_PUFF.close * R, p = TOADAL_PUFF.round * R, inf = TOADAL_PUFF.inflate * R;
  // 1) closing step: dilate by c
  for (let i = 0; i < n; i++) f[i] = S[i] ? 0 : TOADAL_INF;
  toadalEdt(f, w, h);
  const c2 = c * c;
  for (let i = 0; i < n; i++) S[i] = f[i] <= c2 ? 1 : 0;
  // 2) erode by c + p' (finishes the closing, starts the opening). p' shrinks for glyphs whose thickest
  //    stroke is thin (hyphen, quotes ...) so no glyph can vanish.
  for (let i = 0; i < n; i++) f[i] = S[i] ? TOADAL_INF : 0;
  toadalEdt(f, w, h);
  let maxD2 = 0;
  for (let i = 0; i < n; i++) if (f[i] > maxD2 && f[i] < TOADAL_INF) maxD2 = f[i];
  const pEff = Math.max(0, Math.min(p, 0.80 * Math.sqrt(maxD2) - c));
  const e2 = (c + pEff) * (c + pEff);
  for (let i = 0; i < n; i++) S[i] = f[i] >= e2 ? 1 : 0;
  // 3) dilate by p' + inflate, anti-aliased through the true distance (also gives the seam for free)
  for (let i = 0; i < n; i++) f[i] = S[i] ? 0 : TOADAL_INF;
  toadalEdt(f, w, h);
  const rOut = pEff + inf, rSeam = rOut + TOADAL_SEAM.em * R;
  const alpha = new Float32Array(n), maskData = new Uint8ClampedArray(n * 4), seamData = new Uint8ClampedArray(n * 4);
  const sc = TOADAL_SEAM.color;
  for (let i = 0; i < n; i++) {
    const d = Math.sqrt(f[i]);
    const a = d <= 0 ? 1 : Math.min(1, Math.max(0, rOut - d + 0.5));
    const sa = d <= 0 ? 1 : Math.min(1, Math.max(0, rSeam - d + 0.5));
    alpha[i] = a;
    const o = i * 4;
    maskData[o] = maskData[o + 1] = maskData[o + 2] = 255; maskData[o + 3] = Math.round(a * 255);
    seamData[o] = sc[0]; seamData[o + 1] = sc[1]; seamData[o + 2] = sc[2]; seamData[o + 3] = Math.round(sa * 255);
  }
  const ov = toadalBuildOverlay(alpha, w, h, R, oy);
  const mk = (data) => { const c3 = toadalMakeCanvas(w, h); toadalCtx(c3).putImageData(new ImageData(data, w, h), 0, 0); return c3; };
  return { ch, R, w, h, ox, oy, adv: m0.adv, mask: mk(maskData), seam: mk(seamData), shade: mk(ov.shade), light: mk(ov.light), bytes: w * h * 16, use: 0 };
}

function toadalGetSprite(ch, R, draft) {
  if (draft) {                                                // live resizing: never build a big sprite, reuse the nearest cached size
    let best = null, bd = Infinity;
    for (const B of TOADAL_SPRITE_BUCKETS) { const c = _toadalSprites.get(ch + '|' + B); if (c) { const dd = Math.abs(Math.log(B / R)); if (dd < bd) { bd = dd; best = c; } } }
    if (best) { best.use = _toadalFrame; return best; }
    R = Math.min(R, 128);
  }
  const key = ch + '|' + R;
  let s = _toadalSprites.get(key);
  if (s) { _toadalSprites.delete(key); _toadalSprites.set(key, s); s.use = _toadalFrame; return s; }
  s = toadalBuildSprite(ch, R);
  if (!s) return null;
  s.use = _toadalFrame;
  _toadalSprites.set(key, s); _toadalSpriteBytes += s.bytes;
  while (_toadalSpriteBytes > TOADAL_CACHE_BYTES) {          // LRU, never evict what this paint is using
    let victim = null;
    for (const [k, v] of _toadalSprites) { if (v.use !== _toadalFrame) { victim = k; break; } }
    if (victim === null) break;
    const old = _toadalSprites.get(victim); _toadalSprites.delete(victim); _toadalSpriteBytes -= old.bytes;
    old.mask.width = old.seam.width = old.shade.width = old.light.width = 0;
  }
  return s;
}
function toadalCacheStats() { return { sprites: _toadalSprites.size, megabytes: +(_toadalSpriteBytes / 1048576).toFixed(1) }; }
function toadalClearCache() {
  for (const v of _toadalSprites.values()) v.mask.width = v.seam.width = v.shade.width = v.light.width = 0;
  _toadalSprites.clear(); _toadalSpriteBytes = 0;
}

// Reusable scratch canvases. `exact` canvases are resized to exactly w x h: they are scaled when drawn onto the
// result, and a scaled drawImage out of a sub-rectangle of a larger canvas is sampled differently by some
// engines, which would make the output depend on whatever was painted before.
function toadalScratch(name, w, h, readback, exact) {
  let s = _toadalScratch[name];
  const fresh = !s;
  if (!s || s.canvas.width < w || s.canvas.height < h || (exact && (s.canvas.width !== w || s.canvas.height !== h))) {
    const nw = exact ? w : Math.max(w, s ? s.canvas.width : 0), nh = exact ? h : Math.max(h, s ? s.canvas.height : 0);
    if (s && exact) { s.canvas.width = nw; s.canvas.height = nh; s.ctx = toadalCtx(s.canvas, readback); }   // resetting the size also resets the context state
    else { const canvas = toadalMakeCanvas(nw, nh); s = _toadalScratch[name] = { canvas, ctx: toadalCtx(canvas, readback) }; }
  }
  const c = s.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0;
  c.clearRect(0, 0, s.canvas.width, s.canvas.height);
  return s;
}

/* ---- layout ------------------------------------------------------------------------------ */
// End-letter boost: first/last letters larger, falling off 4x per step toward the middle
// (reference art: T and L ~1.16x, their neighbours ~1.04x, the middle letters 1.0x).
function toadalSizeProfile(i, n, boostPct) {
  if (!boostPct || n < 3) return 1;
  const d = Math.min(i, n - 1 - i);
  return 1 + (boostPct / 100) * Math.pow(0.25, d);
}

// Lay one line out left-to-right at `fontPx`. Coordinates are relative to the line's first
// glyph origin / baseline (y grows downward).
function toadalLayoutLine(text, fontPx, tightness, boostPct, bouncePct) {
  const chars = Array.from(text);
  const n = chars.length;
  const shiftEm = (100 - toadalNum(tightness, 100)) * TOADAL_TIGHTNESS_EM_PER_PCT;
  const capRef = TOADAL_CAP_EM * fontPx;
  const glyphs = [];
  let x = 0, top = 0, bottom = 0;
  for (let i = 0; i < n; i++) {
    const ch = chars[i];
    const s = toadalSizeProfile(i, n, boostPct);
    const px = fontPx * s;
    const m = toadalMetrics(ch, px);
    if (i > 0) {
      const prev = glyphs[i - 1];
      if (ch !== ' ' && prev.ch !== ' ') x += (toadalKernEm(prev.ch, ch) + shiftEm) * ((prev.px + px) / 2);
    }
    const dy = (1 - TOADAL_PIVOT) * capRef * (s - 1) + capRef * (toadalNum(bouncePct, 0) / 100) * Math.sin(i * 2.4 + 0.7);
    glyphs.push({ ch, x, dy, px, s, adv: m.adv, l: m.l, r: m.r });
    if (ch !== ' ') { top = Math.min(top, dy - m.asc); bottom = Math.max(bottom, dy + m.desc); }
    x += m.adv;
  }
  const first = glyphs.find((g) => g.ch !== ' ') || glyphs[0];
  const last = [...glyphs].reverse().find((g) => g.ch !== ' ') || glyphs[glyphs.length - 1];
  const inkL = first.x + first.l;
  const inkR = last.x + last.r;
  return { glyphs, inkL, inkR, width: inkR - inkL, top, bottom };
}

// Natural size of the whole block at a reference font size (before fitting it to a box).
function toadalMeasureBlock(el) {
  const lines = toadalLines(el.letterText);
  const lineScale = toadalClamp(el.lineScale == null ? 62 : el.lineScale, 30, 100) / 100;
  const outlinePct = toadalClamp(el.outlineWidth == null ? TOADAL_DEFAULT_OUTLINE : el.outlineWidth, 0, 20);
  const REF = 100;
  const laid = lines.map((text, i) => {
    const fpx = REF * (i === 0 ? 1 : lineScale);
    return Object.assign({ text, fpx }, toadalLayoutLine(text, fpx, toadalNum(el.tightness, 100), toadalClamp(el.endBoost, 0, 40), toadalClamp(el.bounce, 0, 12)));
  });
  let cursor = 0;
  laid.forEach((L, i) => {
    if (i === 0) L.baseline = -L.top;
    else L.baseline = cursor - TOADAL_LINE_OVERLAP * TOADAL_CAP_EM * L.fpx - L.top;
    cursor = L.baseline + L.bottom;
  });
  const blockW = Math.max.apply(null, laid.map((L) => L.width));
  const pad = (TOADAL_PUFF.inflate + TOADAL_CAP_EM * outlinePct / 100 + TOADAL_SLAB.drop + 0.04) * REF;
  return { laid, REF, blockW, blockH: cursor, pad, outlinePct };
}

// width / height of the text block incl. border room: what a box should be to show the text unscaled.
function toadalNaturalAspect(el) {
  const b = toadalMeasureBlock(el);
  return (b.blockW + 2 * b.pad) / Math.max(1, b.blockH + 2 * b.pad);
}

// Whole-element plan: stack the lines with the measured overlap, then scale + centre the block
// so it fits the element box (with room for outline + slab).
function toadalPlanBlock(el, W, H) {
  const b = toadalMeasureBlock(el);
  const scale = Math.max(0.01, Math.min(W / (b.blockW + 2 * b.pad), H / (b.blockH + 2 * b.pad)));
  const top = (H - b.blockH * scale) / 2;
  const lines = b.laid.map((L) => {
    const cx = (L.inkL + L.inkR) / 2;
    const base = top + L.baseline * scale;
    return {
      text: L.text,
      fontPx: L.fpx * scale,
      glyphs: L.glyphs.map((g) => ({ ch: g.ch, x: W / 2 + (g.x - cx) * scale, y: base + g.dy * scale, px: g.px * scale, adv: g.adv * scale })),
    };
  });
  return { lines, scale, outlinePct: b.outlinePct };
}

/* ---- painter ----------------------------------------------------------------------------- */
function toadalBorderLut() {
  if (_toadalBorderLut) return _toadalBorderLut;
  const lut = new Uint8ClampedArray(256 * 3), st = TOADAL_BORDER_STOPS;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < st.length - 2 && t > st[k + 1][0]) k++;
    const a = st[k], b = st[k + 1], u = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[c + 1] + (b[c + 1] - a[c + 1]) * u);
  }
  return (_toadalBorderLut = lut);
}

// A soft shadow / glow without a full-size canvas blur: the shapes are drawn on a canvas TOADAL_SHADOW_SCALE
// times smaller, blurred there, then scaled back up (bilinear upscaling softens the result further).
// shapes: [{ canvas, sx, sy, sw, sh, dx, dy, dw, dh }] (source rect -> destination rect, device px).
function toadalSoftLayer(ctx, shapes, blurPx, offY, color) {
  const k = TOADAL_SHADOW_SCALE;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const g of shapes) { x0 = Math.min(x0, g.dx); y0 = Math.min(y0, g.dy); x1 = Math.max(x1, g.dx + g.dw); y1 = Math.max(y1, g.dy + g.dh); }
  const pad = Math.ceil(blurPx * 1.6 + Math.abs(offY) + 2);
  const rx = Math.max(0, Math.floor(x0 - pad)), ry = Math.max(0, Math.floor(y0 - pad));
  const rw = Math.min(ctx.canvas.width, Math.ceil(x1 + pad)) - rx, rh = Math.min(ctx.canvas.height, Math.ceil(y1 + pad + Math.max(0, offY))) - ry;
  if (rw < 2 || rh < 2) return;
  const sw = Math.max(2, Math.ceil(rw / k)), sh = Math.max(2, Math.ceil(rh / k));
  const T = toadalScratch('soft', sw, sh, false, true), c = T.ctx;
  c.shadowColor = color; c.shadowBlur = blurPx / k; c.shadowOffsetY = offY / k;
  for (const g of shapes) c.drawImage(g.canvas, g.sx, g.sy, g.sw, g.sh, (g.dx - rx) / k, (g.dy - ry) / k, g.dw / k, g.dh / k);
  ctx.drawImage(T.canvas, 0, 0, sw, sh, rx, ry, rw, rh);
}

// Sliding maximum down the columns: out[y] = max(a[y-win .. y]). O(N log win) by doubling.
function toadalMaxDown(a, w, h, win) {
  const cur = Uint8Array.from(a), W = win + 1;
  let span = 1;
  const apply = (sh) => { for (let y = h - 1; y >= sh; y--) { const o = y * w, p = (y - sh) * w; for (let x = 0; x < w; x++) if (cur[p + x] > cur[o + x]) cur[o + x] = cur[p + x]; } };
  while (span * 2 <= W) { apply(span); span *= 2; }
  if (span < W) apply(W - span);
  return cur;
}

// One merged border for a line: union of the letter masks -> distance field -> colour ramp, plus the
// extruded slab (a vertical sliding maximum of the border) and a soft drop shadow underneath.
// All sizes in device pixels. Lines bigger than TOADAL_BORDER_PIXELS are computed on a reduced grid
// and scaled up (the ramp is smooth, so nothing visible is lost).
function toadalPaintLineBorder(ctx, glyphs, bandPx, f0S, dropPx) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const g of glyphs) { x0 = Math.min(x0, g.dx); y0 = Math.min(y0, g.dy); x1 = Math.max(x1, g.dx + g.dw); y1 = Math.max(y1, g.dy + g.dh); }
  const m = Math.ceil(bandPx + 2);
  x0 = Math.max(0, Math.floor(x0) - m); y0 = Math.max(0, Math.floor(y0) - m);
  x1 = Math.min(ctx.canvas.width, Math.ceil(x1) + m); y1 = Math.min(ctx.canvas.height, Math.ceil(y1) + m + Math.ceil(dropPx) + 1);
  const bw = x1 - x0, bh = y1 - y0;
  if (bw < 2 || bh < 2) return;
  const q = Math.min(1, Math.max(0.5, Math.sqrt(TOADAL_BORDER_PIXELS / (bw * bh))));
  const qw = Math.max(2, Math.round(bw * q)), qh = Math.max(2, Math.round(bh * q));
  const sx = qw / bw, sy = qh / bh, bandQ = Math.max(0.5, bandPx * sx);
  const U = toadalScratch('union', qw, qh, true);
  for (const g of glyphs) U.ctx.drawImage(g.sp.mask, (g.dx - x0) * sx, (g.dy - y0) * sy, g.dw * sx, g.dh * sy);
  const ua = U.ctx.getImageData(0, 0, qw, qh).data;
  const n = qw * qh, f = new Float32Array(n);
  for (let i = 0; i < n; i++) f[i] = ua[i * 4 + 3] >= 128 ? 0 : TOADAL_INF;
  toadalEdt(f, qw, qh);
  const lut = toadalBorderLut(), out = new Uint8ClampedArray(n * 4), alpha = new Uint8Array(n), lim2 = (bandQ + 1) * (bandQ + 1);
  for (let i = 0; i < n; i++) {
    const d2 = f[i];
    if (d2 > lim2) continue;
    const d = Math.sqrt(d2);
    const a = d <= 0 ? 1 : Math.min(1, bandQ - d + 0.5);
    if (a <= 0) continue;
    const li = Math.round(Math.min(1, d / bandQ) * 255) * 3, o = i * 4, a8 = Math.round(a * 255);
    out[o] = lut[li]; out[o + 1] = lut[li + 1]; out[o + 2] = lut[li + 2]; out[o + 3] = a8; alpha[i] = a8;
  }
  // slab: union of the border translated down by 0..drop. Dark rim at the very bottom, chocolate above it.
  const dropQ = Math.max(1, Math.round(dropPx * sy));
  const full = toadalMaxDown(alpha, qw, qh, dropQ), upper = toadalMaxDown(alpha, qw, qh, Math.max(0, Math.round(dropQ * 0.72)));
  const slab = new Uint8ClampedArray(n * 4), rc = TOADAL_SLAB.rimRgb, mc = TOADAL_SLAB.midRgb;
  for (let i = 0; i < n; i++) {
    const fa = full[i];
    if (!fa) continue;
    const u = upper[i] / fa, o = i * 4;
    slab[o] = rc[0] + (mc[0] - rc[0]) * u; slab[o + 1] = rc[1] + (mc[1] - rc[1]) * u; slab[o + 2] = rc[2] + (mc[2] - rc[2]) * u; slab[o + 3] = fa;
  }
  const S1 = toadalScratch('slab', qw, qh, false, true);
  S1.ctx.putImageData(new ImageData(slab, qw, qh), 0, 0);
  toadalSoftLayer(ctx, [{ canvas: S1.canvas, sx: 0, sy: 0, sw: qw, sh: qh, dx: x0, dy: y0, dw: bw, dh: bh }], f0S * 0.07, f0S * 0.045, 'rgba(14,3,0,0.50)');
  ctx.drawImage(S1.canvas, 0, 0, qw, qh, x0, y0, bw, bh);
  const B = toadalScratch('border', qw, qh, false, true);
  B.ctx.putImageData(new ImageData(out, qw, qh), 0, 0);
  ctx.drawImage(B.canvas, 0, 0, qw, qh, x0, y0, bw, bh);
}

// W,H in CSS px. The context must have an identity transform and a W*S x H*S backing store.
function toadalPaintWord(ctx, el, W, H, S, draft) {
  S = S || 1;
  ++_toadalFrame;
  const plan = toadalPlanBlock(el, W, H);
  const mode = el.paletteMode === 'rainbow' || el.paletteMode === 'lockup' ? el.paletteMode : 'single';
  const topC = toadalHex(el.accent, '#fee822'), botC = toadalHex(el.accent2, '#fda80a');
  const shine = el.glossOn === false ? 0 : toadalClamp(el.shine == null ? 100 : el.shine, 0, 100) / 100;

  const lineGlyphs = plan.lines.map((L, li) => {
    let pos = 0;
    const out = [];
    for (const g of L.glyphs) {
      if (g.ch === ' ') { pos = 0; continue; }
      const rainbow = mode === 'rainbow' || (mode === 'lockup' && li > 0);
      const pal = rainbow ? TOADAL_RAINBOW[pos % TOADAL_RAINBOW.length] : { top: topC, bottom: botC };
      const R = toadalBucket(g.px * S);
      if (!draft) _toadalLastR = R;
      const sp = toadalGetSprite(g.ch, R, draft);
      pos++;
      if (!sp) continue;
      const f = g.px * S / sp.R;
      out.push({ ch: g.ch, pal, shadeColor: toadalShadeColor(pal.bottom), sp, f, dx: Math.round(g.x * S - sp.ox * f), dy: Math.round(g.y * S - sp.oy * f), dw: Math.max(1, Math.round(sp.w * f)), dh: Math.max(1, Math.round(sp.h * f)) });
    }
    return out;
  });
  if (!lineGlyphs.some((l) => l.length)) return;
  const f0S = plan.lines[0].fontPx * S;

  ctx.save();
  ctx.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  if (el.glow) {                                              // warm halo: blurred letter shapes, covered by the border afterwards
    const shapes = [];
    for (const glyphs of lineGlyphs) for (const g of glyphs) shapes.push({ canvas: g.sp.seam, sx: 0, sy: 0, sw: g.sp.w, sh: g.sp.h, dx: g.dx, dy: g.dy, dw: g.dw, dh: g.dh });
    toadalSoftLayer(ctx, shapes, f0S * 0.18, 0, toadalRgba(topC, 0.6));
  }
  lineGlyphs.forEach((glyphs, li) => {
    if (!glyphs.length) return;
    const fpx = plan.lines[li].fontPx * S;
    const bandPx = TOADAL_CAP_EM * fpx * plan.outlinePct / 100;
    if (bandPx > 0.6) toadalPaintLineBorder(ctx, glyphs, bandPx, f0S, TOADAL_SLAB.drop * fpx);
    for (const g of glyphs) {
      const sp = g.sp;
      ctx.drawImage(sp.seam, g.dx, g.dy, g.dw, g.dh);
      const t = toadalScratch('glyph', g.dw, g.dh), tc = t.ctx;
      tc.drawImage(sp.mask, 0, 0, g.dw, g.dh);
      tc.globalCompositeOperation = 'source-in';
      const top = (sp.oy - (TOADAL_CAP_EM + TOADAL_PUFF.inflate) * sp.R) * g.f, bot = (sp.oy + TOADAL_PUFF.inflate * sp.R) * g.f;
      const gr = tc.createLinearGradient(0, top, 0, bot);
      gr.addColorStop(0, g.pal.top); gr.addColorStop(1, g.pal.bottom);
      tc.fillStyle = gr; tc.fillRect(0, 0, g.dw, g.dh);
      tc.globalCompositeOperation = 'source-over';
      if (shine > 0) {
        const tt = toadalScratch('tint', g.dw, g.dh), tn = tt.ctx;      // shading in the letter's own deep colour
        tn.drawImage(sp.shade, 0, 0, g.dw, g.dh);
        tn.globalCompositeOperation = 'source-in'; tn.fillStyle = g.shadeColor; tn.fillRect(0, 0, g.dw, g.dh);
        tc.globalAlpha = shine; tc.drawImage(tt.canvas, 0, 0, g.dw, g.dh, 0, 0, g.dw, g.dh);
        tc.drawImage(sp.light, 0, 0, g.dw, g.dh); tc.globalAlpha = 1;
      }
      ctx.drawImage(t.canvas, 0, 0, g.dw, g.dh, g.dx, g.dy, g.dw, g.dh);
    }
  });
  ctx.restore();
}

// Element box -> canvas backing store -> paint. Returns false when the font is not ready yet
// (use toadalPaintCanvasSafe, or wait for toadalWhenFontReady).  opt.draft = half resolution (live resizing).
function toadalPaintCanvas(canvas, el, opt) {
  if (_toadalFontState !== 2) return false;
  const W = Math.max(20, toadalNum(el.w, 300));
  const H = Math.max(12, toadalNum(el.h, 100));
  const S = (opt && opt.draft ? 1 : 2) * Math.min(1, 4096 / (W * 2), 4096 / (H * 2));
  const bw = Math.max(1, Math.round(W * S)), bh = Math.max(1, Math.round(H * S));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bw, bh);
  try { toadalPaintWord(ctx, el, W, H, bw / W, !!(opt && opt.draft)); return true; }
  catch (e) { if (typeof console !== 'undefined') console.error('[toadal-lettering]', e); return false; }
}

/* ---- font loading ------------------------------------------------------------------------ */
// Canvas never downloads webfonts by itself, so the alphabet is registered from the embedded data
// (FontFace API) and painting is repeated once it is decoded. No network, no CDN.
let _toadalFontState = 0;                 // 0 idle, 1 loading, 2 ready
const _toadalFontWaiters = [];
function toadalWhenFontReady(cb) {
  if (_toadalFontState === 2) { cb(); return; }
  _toadalFontWaiters.push(cb);
  if (_toadalFontState === 1) return;
  _toadalFontState = 1;
  const finish = () => {
    _toadalFontState = 2;
    _toadalFontWaiters.splice(0).forEach((f) => { try { f(); } catch (e) { /* keep going */ } });
  };
  try {
    const scope = typeof document !== 'undefined' ? document : (typeof self !== 'undefined' ? self : null);
    if (!scope || !scope.fonts || typeof FontFace === 'undefined') { finish(); return; }
    for (const f of scope.fonts) { if (f.family.replace(/['"]/g, '') === TOADAL_FONT_NAME && f.status === 'loaded') { finish(); return; } }
    const face = new FontFace(TOADAL_FONT_NAME, `url(${TOADAL_FONT_DATA}) format('woff2')`, { weight: '400', style: 'normal' });
    scope.fonts.add(face);
    face.load().then(finish, finish);
  } catch (e) { finish(); }
}
// Paint now (if the font is ready), and again once the alphabet is ready. `elOrGetter` may be a plain
// settings object or a function returning the CURRENT settings (use the function form when settings can
// change while the font is still decoding, so a late repaint never paints stale values).
function toadalPaintCanvasSafe(canvas, elOrGetter) {
  const get = () => (typeof elOrGetter === 'function' ? elOrGetter() : elOrGetter);
  const now = get();
  if (_toadalFontState === 2 && now) { toadalPaintCanvas(canvas, now); return; }
  toadalWhenFontReady(() => { const cur = get(); if (cur) toadalPaintCanvas(canvas, cur); });
}
// Build the sprites for some characters ahead of time in small idle slices (default: A-Z, 0-9, ! ?),
// so the first lettering a player sees appears instantly. R defaults to the size last painted. Returns a Promise.
function toadalPrewarm(chars, R) {
  const list = Array.from(new Set(Array.from(String(chars == null ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?' : chars).toUpperCase()))).filter((c) => c.trim());
  return new Promise((resolve) => {
    toadalWhenFontReady(() => {
      let i = 0;
      const later = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 200 }) : (fn) => setTimeout(fn, 0);
      const step = () => {
        const t0 = Date.now();
        _toadalFrame++;
        while (i < list.length && Date.now() - t0 < 12) toadalGetSprite(list[i++], R || _toadalLastR);
        if (i < list.length) later(step); else resolve(toadalCacheStats());
      };
      later(step);
    });
  });
}
// One namespace for people who prefer it over the global function names (also the CommonJS export).
const TOADAL = {
  version: TOADAL_ENGINE_VERSION,
  paint: toadalPaintCanvas,              // (canvas, settings, {draft}) -> bool   (false until the font is ready)
  paintSafe: toadalPaintCanvasSafe,      // (canvas, settings | () => settings)   waits for the font, then paints
  whenReady: toadalWhenFontReady,        // (callback)
  prewarm: toadalPrewarm,                // (chars?, sizePx?) -> Promise
  aspect: toadalNaturalAspect,           // (settings) -> width / height the text needs
  cacheStats: toadalCacheStats,
  clearCache: toadalClearCache,
};
if (typeof module !== 'undefined' && module.exports) module.exports = TOADAL;
/* ===== TOADAL LETTERING ENGINE v2 :: END ========================================= */
