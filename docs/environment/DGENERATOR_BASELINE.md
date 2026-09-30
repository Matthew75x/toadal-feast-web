# D-generator Environment Baseline - WO-000

Run date: 2026-09-30
Repository: `Matthew75x/toadal-feast-web`
Branch: `work/WO-000-environment-baseline`
Starting HEAD: `df57aac2cb856a33d957e1884fabf082c9f7aa9a`
Baseline main commit recorded at preflight: `87050885331770ca3e30db7e463154aebd777512`

## Overall result

**PASS.** The exact fresh-project inspect, render, static export, and verify checkpoint pass with corrected Studio 1.4.2. Studio validation reports 0 errors/warnings, `ai:doctor` passes, and the complete unskipped suite passes **81/81**. The former Tier 3 QR failure was traced to an existing route that depended on an undeclared, absent Python `qrcode` module; Studio 1.4.2 replaces that runtime prerequisite with a pinned, bundled Node QR generator. No website product files, tracked `dist/`, or main branch content were changed, and no deployment occurred. WO-000 is complete; WO-001 is unblocked for a separate user-authorized task but was not started here.

## Exact environment and versions

- Node.js: `v22.23.2`; npm: `10.9.8`.
- Original verified archive (unchanged): `C:\Users\Metarator\Downloads\TOADAL_STUDIO_1.4.1_RESEALED_2026-09-29.zip`; SHA-256 `bad679307d6fa4ab8a75ac6dd3700cd8988cf92874ba2a7a287ee7b2ba9c5ec8`.
- Corrected Studio installation: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`.
- Corrected archive: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-1.4.2\TOADAL_STUDIO_1.4.2_RESEALED_2026-09-30.zip`; SHA-256 `2268eed4f6a74bc9b1e643cf648128a7e352a2e4a2967d8481c5352ef08e0379`; adjacent checksum file `.zip.sha256`.
- Studio npm package and authoritative plugin, MCP, ping, UI, AI, and desktop metadata: `toadal-studio@1.4.2`. QR dependency: `qrcode@1.5.4`, pinned in the lockfile and bundled with its runtime modules in the resealed archive. The fresh generic-site project has no project plugins (`plugins: []`).
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
- `npm test`: PASS; 81 tests, 81 passed, 0 failed, 0 skipped. The run used the task-local ZIP/UnZip, ImageMagick 7.1.2-32, Chrome 154.0.8037.57, and Python Playwright 1.63.0 prerequisites listed above.
- `npm run ai:doctor`: PASS; `ok: true`; reports Studio 1.4.2 and all configuration, MCP transport, tools, resources, prompts, origin-protection, and rate-limit checks pass.

## Fresh project bridge workflow

All calls were made through `createBridge(TOADAL_PROJECT).callTool(...)` using the exact fresh generic-site manifest.

- `toadal.inspect(scope=workspace)`: PASS; 2 pages, 0 games, 0 assets, 8 components; validation valid with 0 errors/warnings; graph 23 nodes, 10 edges, 0 dangling.
- `toadal.render`: PASS; preview at `studio-project/toadal-feast-website/build/ai-preview`; 5 files, 23,163 total bytes, 17,021 HTML bytes, 0 large-file warnings; HTML regression snapshot includes `index.html` and `404.html`.
- `toadal.export(kind=static)`: PASS; ZIP at `studio-project/toadal-feast-website/build/exports/toadal-feast-website-static-site.zip`, 8,167 bytes, SHA-256 `ef525c96d1ce4056abb1f293b84834470fbf4fd7e406cefaed1f7443814a0541`. Entries: `404.html`, `index.html`, `robots.txt`, `assets/css/site.css`, and `assets/css/toadal-studio-components.css`.
- Export verification: `index.html` extracted successfully (15,977 bytes; title `TOADAL FEAST Website`; SHA-256 `99776ef61ae7a434ea8d5491e7456758943da610ca1737418eca56f89b791ae0`). `404.html` extracted successfully (1,044 bytes; title `Page not found`; SHA-256 `c76755073aa0c425c5aa2d4d38ca21eec5e744681befb1ec2e25fed2be4f9e52`). Both are HTML documents.
- `toadal.checkpoint(mode=verify)`: PASS; validation exit 0, 0 errors/warnings, checkpoint `ok: true`. Handoff: `AI/HANDOFFS/2026-09-30T06-36-11-998Z-WO-000-corrected-D-generator-baseline.md` (under the Studio installation; excluded from the distribution archive).

## Tier 3 / Tier 4 discrepancy investigation

The initial environment failures were isolated and reproduced, then corrected using task-local prerequisites only. No tests were skipped, and no assertions were weakened.

- Tier 2 game web-pack ZIP test: PASS with Info-ZIP Zip 3.0 / UnZip 6.00 on task-local PATH.
- Tier 3 render/export optimized-media test: PASS with task-local ImageMagick 7.1.2-32 Q16 x64.
- Tier 4 plugin/scheduler/QA/export/deployment checkpoint test: PASS with Chrome 154.0.8037.57 at the explicit `CHROMIUM_BIN` path.
- Accessibility deep-inspection test: PASS with Python 3.12.14 and task-local Playwright 1.63.0.
- The original 1.4.1 package did contain `POST /api/qr`; the earlier blocked report incorrectly said the route was absent. Its handler called `python3 -c "import qrcode"`, while Python's `qrcode` module was not installed or declared. A direct import reproduced `ModuleNotFoundError: No module named 'qrcode'`, explaining the empty `qr.asset` response. This was a Studio portability/implementation defect, not a reason to add an undocumented Python prerequisite.
- Studio 1.4.2 uses pinned `qrcode@1.5.4` in Node, outputs a deterministic PNG with level-M correction and a four-module quiet zone, normalizes filenames to `.png`, and stores it with `importAssetFromBuffer` through the existing asset system. The Tier 3 test still asserts `qr.asset?.id` and now also checks stored PNG bytes, metadata, repeatable output, blank input rejection, and operation with an invalid Python executable.
- Direct HTTP smoke against a temporary copy of the fresh project: `POST /api/qr` returned 200; asset ID `asset.import.wo000-qr.65e7f4f0`; path `assets/imported/asset-import-wo000-qr-65e7f4f0.65e7f4f0f0.png`; PNG 222×222, 1,680 bytes, SHA-256 `65e7f4f0f052e869d7eced98fd693ebad3534c3af1697a74ef0b9dbf0750819b`; `GET /api/asset/file` returned 200. The call used `PYTHON=__qr-smoke-must-not-use-python__` and a `.svg` request suffix, which was correctly normalized to PNG.
- Final complete `npm test`: **81 tests, 81 passed, 0 failed, 0 skipped** (exit 0). Tier 3 QR/import and Tier 4 checkpoint coverage both pass.
- Conclusion: missing ZIP/image/browser/Playwright utilities were environment prerequisites; the QR failure was caused by an undeclared Python runtime dependency in Studio. The Studio implementation was corrected narrowly in 1.4.2, and the deterministic WO-000 result is **PASS**.

## Corrected Studio archive

- Resealed archive: `TOADAL_STUDIO_1.4.2_RESEALED_2026-09-30.zip`.
- SHA-256: `2268eed4f6a74bc9b1e643cf648128a7e352a2e4a2967d8481c5352ef08e0379`; the adjacent `.zip.sha256` sidecar matches.
- Archive integrity: Info-ZIP `zip -T` returned `OK`; the archive contains the locked `node_modules/qrcode` runtime and excludes the task-generated D-generator handoff.
- The original 1.4.1 archive remained byte-identical at its verified SHA-256; it was not overwritten.

## Scope and deployment boundary

Tracked `dist/` is unchanged from the recorded baseline main commit. Generated Studio build/history/recovery state is ignored and is not included in the evidence commit. GitHub Pages was not deployed; no production or external deployment was run. Only the WO-000 branch is in scope. WO-001 is not authorized by this result.

## Repository postcheck

- Required command `powershell -ExecutionPolicy Bypass -File scripts/wo000-postcheck.ps1 -ProjectManifest "C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-wo000\studio-project\toadal-feast-website\project.json"`: PASS (`WO-000 POSTCHECK PASS`). It confirms `generic-site`, generated state untracked, and no `dist/` changes relative to main.
- The script's `main...HEAD` comparison required a temporary local `main` ref at the recorded baseline SHA `87050885331770ca3e30db7e463154aebd777512`; that temporary ref was deleted after checking. No main content or remote ref was changed. Final branch status is clean after the evidence commit is pushed.
