# WO-001 — final Studio 1.4.2 visual-parity closure

Date: 2026-09-30
Branch: `fix/wo001-approved-home-parity-20260930`
Starting HEAD: `ceaf37575126de045ab414dce73d7f1017ddb76d`

## Result

**PASS against the written approved-composition review and the six requested viewports.** The Home keeps the truthful `Explore the Feast World for Free.` headline, the bright saturated hero and canonical Toadal, the paired desktop Games + Feast Pass band, and the App + What's Next pairing. The desktop search is now a compact utility and remains wholly inside the existing 510px hero. No overflow, broken image, clipped navigation, console error, page error, failed request, or HTTP error was observed.

The original approved-authority image (`TOADAL_APPROVED_HOME_VISUAL_AUTHORITY.png`) was not present in the checkout or available attachments during this run. The result is therefore a pass against the written authority and observed composition, **not a pixel-difference sign-off against that missing image**.

One older verifier assertion remains intentionally incompatible with the accepted truth rule: `scripts/verify-wo001-home.mjs` expects the H1 `Play the Feast World for Free.`, while the accepted WO-001 review requires `Explore the Feast World for Free.` until WO-002 supplies a qualified playable route. The final transformed-export run reports only that H1 assertion; it was not changed or weakened. The search explanation and remaining checks pass.

## Environment and Studio gates

- Node: `v22.23.2`; npm: `10.9.8`.
- TOADAL Studio package/plugin: `toadal-studio@1.4.2`; bundled QR dependency: `qrcode@1.5.4`.
- Studio root: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo001-parity\studio-project\toadal-feast-website\project.json`.
- `npm run validate`: **PASS**, 0 errors / 0 warnings.
- Complete `npm test`: **PASS, 81/81, 0 failed, 0 skipped**. Tier 3 tests 76–78 and Tier 4 tests 79–81 all pass.
- Test-environment finding: the first run lacked explicit Windows paths for Chrome/Playwright, ImageMagick, and ZIP utilities. That produced prerequisite failures in tests 32, 75, 77, 78, and 81. With process-scoped `CHROMIUM_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe`, `PLAYWRIGHT_PYTHON=C:\Users\Metarator\AppData\Local\Programs\Python\Python313\python.exe`, and `MAGICK_BIN=C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo000-tools\imagemagick-release\magick.exe`, plus `...\work\wo000-tools\zip`, `...\work\wo000-tools\unzip`, and `...\work\wo000-tools\imagemagick-release` prepended to that process's `PATH`, the complete suite passed. `TOADAL_PROJECT` was unset only for `npm test` so tests used their own fixtures. No Studio source, tests, or assertions were changed.
- `npm run ai:doctor`: **PASS**, `ok: true`; all 26 checks passed, including stdio/HTTP MCP checks and origin/rate-limit protections.
- `toadal.inspect`: **PASS**, exact project recognized; 2 pages, 4 games, 11 assets, 12 components; validation valid with 0 errors / 0 warnings. Graph: 42 nodes / 30 edges; its four dangling edges are the existing generic `component.home.games -> game.card` type references.
- `toadal.qa(level="quick")`: **PASS**, no validation or accessibility issues/warnings and no large-file warnings.
- `toadal.render`: **PASS**, 19 files / 1,155,784 bytes; 0 large-file warnings. Pre-base-path `index.html` SHA-256 `4d1c912166674e925d026d9b47e5b6a91060f92a774782231db54f93e7465b17`; `404.html` SHA-256 `552d9d5b9e4b97803a2347bfc4459b6ae7d280c7b903f7d4e7a1e503cc36e492`.
- `toadal.export(kind="static")`: **PASS**, 1,084,075-byte ZIP; SHA-256 `422b584db2c278d20d5fbbfd23972f9559c12fd07299a2125b2d139cb418cc41`. The archive contains `index.html` (33,629 bytes) and `404.html` (17,667 bytes); their extracted hashes match the render evidence above.
- `toadal.checkpoint(mode="verify")`: **PASS**, validation clean; generated handoff saved under Studio's ignored `AI/HANDOFFS` directory.

## GitHub Pages-shaped export check

The Studio ZIP was extracted outside the repository. A local-only rewrite prepared it under `/toadal-feast-web/`: 3 files scanned, 2 files / 18 URLs rewritten. `verify-pages-basepath.mjs` passes on that transformed export, and `wo001-pages-basepath.test.mjs` passes **8/8**. Nothing was deployed.

The transformed Home and `404.html` both returned HTTP 200. `scripts/verify-home-visual-contract.mjs` passes **28/28**. `scripts/verify-navigation-truth.mjs` checked 14 targets and found **0 unresolved**. The older `verify-wo001-home.mjs` result is described above; preserving the accepted Explore headline takes precedence over its stale Play-only assertion.

## Viewport results

Browser: Chrome `154.0.8037.57`, Playwright `1.63.0`; screenshots are from the final Studio static export after the local Pages-path rewrite.

| Viewport | Document width | Game columns | Hero height | Search in hero |
| --- | ---: | ---: | ---: | --- |
| 390×844 | 390px | 1 | 646.6px | Hidden by the small-screen layout |
| 430×932 | 430px | 1 | 638.8px | Hidden by the small-screen layout |
| 768×1024 | 768px | 2 | 664.6px | Visible; fits |
| 1366×768 | 1366px | 4 | 510px | Bottom 537.3px / hero bottom 571px |
| 1600×900 | 1600px | 4 | 510px | Bottom 561.5px / hero bottom 579px |
| 1920×1080 | 1920px | 4 | 510px | Bottom 561.5px / hero bottom 579px |

All six had zero horizontal overflow and zero broken images; the four game cards and truthful `PLANNED` Feast Pass state were present. No console, page, HTTP, or request-failure events were recorded. Keyboard and interaction evidence confirms: first Tab reaches the skip link; mobile menu opens and Escape closes it with focus restored; Playable shows zero cards and its empty state while Preview/All restore four; search/store controls remain disabled and game cards have no launch links; primary CTA stays under the Pages base path; companion pointer copy is contextual, keyboard focus changes its live region to polite, and minimize/restore persists across reload; reduced-motion emulation reduces transition/animation to `1e-05s`; 404 recovery returns 200 with a Home-search link.

## Evidence

- [Viewport evidence JSON](viewport-evidence.json)
- [Interaction smoke JSON](interaction-smoke.json)
- [390×844 screenshot](screenshots/home-390x844.png)
- [430×932 screenshot](screenshots/home-430x932.png)
- [768×1024 screenshot](screenshots/home-768x1024.png)
- [1366×768 screenshot](screenshots/home-1366x768.png)
- [1600×900 screenshot](screenshots/home-1600x900.png)
- [1920×1080 screenshot](screenshots/home-1920x1080.png)
- [Full-page phone screenshot](screenshots/home-full-390x844.png)
- [Full-page desktop screenshot](screenshots/home-full-1920x1080.png)

## Scope and repository state

Only the Home component's compact search copy/placeholder and bounded desktop hero/search CSS were adjusted. Tracked `dist/` is unchanged. Studio `build/` and `.studio-history/` are ignored and not tracked. No operation changed `main`; no merge, Pages deployment, or production change occurred. WO-002 was not started.

The final commit SHA and post-commit Git status are reported with the closure result.
