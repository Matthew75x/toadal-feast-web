# D-generator Environment Baseline - WO-000

Run date: 2026-09-30
Repository: `Matthew75x/toadal-feast-web`
Branch: `work/WO-000-environment-baseline`
Starting HEAD: `df57aac2cb856a33d957e1884fabf082c9f7aa9a`
Baseline main commit recorded at preflight: `87050885331770ca3e30db7e463154aebd777512`

## Overall result

**BLOCKED.** D-generator inspect, render, static export, validation, AI doctor, and verify checkpoint pass. The complete Studio test suite ends at 80/81: one Tier 3 Studio HTTP test fails because `POST /api/qr` does not produce an asset. The test's assertion is `qr.asset?.id` at `tests/tier3-closure.test.ts:120`. Repository search finds the QR call in the Studio browser UI but no matching server handler or QR implementation. This is a Studio failure, not an environment prerequisite. No Studio source, tests, assertions, or product code were changed. WO-001 remains blocked.

## Exact environment and versions

- Node.js: `v22.23.2`; npm: `10.9.8`.
- Verified archive: `TOADAL_STUDIO_1.4.1_RESEALED_2026-09-29.zip`; SHA-256 `bad679307d6fa4ab8a75ac6dd3700cd8988cf92874ba2a7a287ee7b2ba9c5ec8`.
- Extracted Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.1\TOADAL_STUDIO_1.4.1_AUDITED_WEB_BUILDER`.
- Studio npm package: `toadal-studio@1.4.1`. The root `plugin.json` and `.codex-plugin/plugin.json` both identify `toadal-studio@1.4.1`. The fresh generic-site project has no project plugins (`plugins: []`).
- Exact `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo000\studio-project\toadal-feast-website\project.json`; ID `toadal-feast-website`, kind `generic-site`, schema version 1.
- Preflight and `npm install --no-audit --no-fund`: PASS. `scripts/wo000-preflight.ps1`: PASS.

Task-local environment prerequisites (all outside the repository; no global PATH or package installation):
- Info-ZIP Zip 3.0 at `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo000-tools\zip\zip.exe`; Info-ZIP UnZip 6.00 at `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo000-tools\unzip\unzip.exe`.
- ImageMagick `7.1.2-32 Q16 x64` at `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo000-tools\imagemagick-release\magick.exe`, selected by task-scoped `MAGICK_BIN`.
- Chrome `154.0.8037.57` at `C:\Program Files\Google\Chrome\Application\chrome.exe`, selected by task-scoped `CHROMIUM_BIN`.
- Python `3.12.14` and Playwright `1.63.0`; Playwright was installed under `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\wo000-tools\playwright-python-libs` and selected by task-scoped `PYTHONPATH` / `PLAYWRIGHT_PYTHON`.
- Zip and unzip directories were prepended to PATH only for the test process.

## Validation and AI doctor

- `npm run validate`: PASS; `valid: true`, 0 errors, 0 warnings.
- `npm run ai:doctor`: PASS; `ok: true`; Studio reports version 1.4.1 and all reported configuration, MCP transport, tool, resource, prompt, origin-protection, and rate-limit checks pass.

## Fresh project bridge workflow

All calls were made through `createBridge(TOADAL_PROJECT).callTool(...)` using the exact fresh generic-site manifest.

- `toadal.inspect(scope=workspace)`: PASS; 2 pages, 0 games, 0 assets, 8 components; validation valid with 0 errors/warnings; graph 23 nodes, 10 edges, 0 dangling.
- `toadal.render`: PASS; preview at `studio-project/toadal-feast-website/build/ai-preview`; 5 files, 23,163 total bytes, 17,021 HTML bytes, 0 large-file warnings; HTML regression snapshot includes `index.html` and `404.html`.
- `toadal.export(kind=static)`: PASS; ZIP at `studio-project/toadal-feast-website/build/exports/toadal-feast-website-static-site.zip`, 8,167 bytes, SHA-256 `69f8a098d53e8ef5950127fbaa8a1938e0e5450f84129d1bb812b3fcc5d8a077`. Entries: `404.html`, `index.html`, `robots.txt`, `assets/css/site.css`, and `assets/css/toadal-studio-components.css`.
- Export verification: `index.html` extracted successfully (15,977 bytes; title `TOADAL FEAST Website`; SHA-256 `99776ef61ae7a434ea8d5491e7456758943da610ca1737418eca56f89b791ae0`). `404.html` extracted successfully (1,044 bytes; title `Page not found`; SHA-256 `c76755073aa0c425c5aa2d4d38ca21eec5e744681befb1ec2e25fed2be4f9e52`). Both are HTML documents.
- `toadal.checkpoint(mode=verify)`: PASS; verification validation exit 0, 0 errors/warnings, checkpoint `ok: true`. Handoff: `AI/HANDOFFS/2026-09-30T05-56-20-100Z-WO-000-D-generator-baseline.md` (under the Studio installation).

## Tier 3 / Tier 4 discrepancy investigation

The initial Windows environment lacked `zip`/`unzip`, ImageMagick, a discoverable Chromium executable, and Python Playwright. These were supplied only from task-local paths and the exact tests were rerun; no tests were skipped or edited.

- Tier 2 game web-pack ZIP test: PASS after exposing Info-ZIP Zip/UnZip.
- Tier 3 render/export optimized-media test: PASS with ImageMagick 7.1.2-32 available.
- Tier 4 plugin/scheduler/QA/export/deployment checkpoint test: PASS after setting `CHROMIUM_BIN` to the installed Chrome executable.
- Accessibility deep-inspection test: PASS after providing task-local Python Playwright 1.63.0.
- Final complete `npm test`: **81 tests, 80 passed, 1 failed, 0 skipped** (exit 1). The only remaining failure is `Tier 3 Studio HTTP surface exposes theme modes, QR generation and automatic import optimization` at `tests/tier3-closure.test.ts:112`; exact failing assertion: `assert.ok(qr.asset?.id)` at line 120. The test calls `POST /api/qr`, but the Studio server/packages contain no handler for that route; the UI invocation alone is present in `apps/studio/public/studio.js`. This is not fixed by adding any environment utility. The later HTTP image-import assertions in that same test are not reached because the QR assertion fails first; the separate Tier 3 optimized-media render/export test passes with ImageMagick.
- Conclusion: the original ZIP, image, browser, and Python failures were environment prerequisites and have been corrected locally. The remaining QR failure is a genuine Studio implementation gap. Correcting it would require out-of-scope Studio source work, so the deterministic WO-000 result is **BLOCKED**.

## Scope and deployment boundary

Tracked `dist/` is unchanged from the recorded baseline main commit. Generated Studio build/history/recovery state is ignored and is not included in the evidence commit. GitHub Pages was not deployed; no production or external deployment was run. Only the WO-000 branch is in scope. WO-001 is not authorized by this result.

## Repository postcheck

- Required command `powershell -ExecutionPolicy Bypass -File scripts/wo000-postcheck.ps1 -ProjectManifest C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo000\studio-project\toadal-feast-website\project.json`: PASS (`WO-000 POSTCHECK PASS`).
- The script's `main...HEAD` comparison required a temporary local `main` ref at the recorded baseline SHA `87050885331770ca3e30db7e463154aebd777512`; that ref was deleted after the check. No remote main ref was present or updated.
