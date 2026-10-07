# Share-card asset inputs

Read-only extraction from the user-supplied `files (19).zip` and `files (20).zip`. See `asset-manifest.json` for source/archive members, SHA-256 hashes, byte sizes, and PNG dimensions.

- `astro/score-frame.png`: 796 x 254 transparent frame; suitable for a score panel.
- `astro/health-frame.png`: 991 x 227 transparent frame; optional visual reference, not a required card component.
- `lettering/toadal-lettering.js`: original v2.0.0 browser/Canvas engine; preserved but not executed during extraction.
- `lettering/fonts/LilitaOne-Latin.woff2`: unmodified font bytes decoded from the engine data URL; usable via a local `@font-face` for deterministic static browser rendering. Font loading must finish before capture.
- `lettering/licenses/LilitaOne-OFL.txt` and `lettering/NOTICE.md`: retain on distribution.
- `lettering/TOADAL_lettering_specimen.png`: visual reference.

`lettering/fonts/LilitaOne-Latin.ttf` is a decoded TTF for resvg/Pillow; the source WOFF2 and license are retained. `lettering/renders/toadal-feast-header.png` (1000 x 180) and `toadal-feast-lockup.png` (640 x 330) are transparent title artwork pre-rendered by the actual v2 engine. The plain font does not reproduce the engine's glossy gel effect; that requires deliberate styling or use of the Canvas engine in a controlled renderer. Source documents and reported tests remain package claims. The standalone engine was inspected for external I/O and then executed only in an isolated Chromium context with every network request blocked. The render report records zero attempted requests and zero page errors; both titles were visually inspected. Supplied HTML was not run. No game files were modified.
