# WO-000 QR Failure — Independent Root-Cause Diagnosis
**Date:** 2026-09-30  
**Status:** environment prerequisite identified; Codex's "missing handler" conclusion is incorrect.

## What Codex reported
D-generator finished WO-000 with 80/81 Studio tests passing. The remaining Tier 3 failure was:
`assert.ok(qr.asset?.id)`
after:
`POST /api/qr`.

The baseline concluded that the Studio server had no matching QR handler and marked WO-000 BLOCKED.

## Independent inspection of the exact Studio archive
Archive:
`TOADAL_STUDIO_1.4.1_RESEALED_2026-09-29.zip`

SHA-256:
`bad679307d6fa4ab8a75ac6dd3700cd8988cf92874ba2a7a287ee7b2ba9c5ec8`

The exact archive **does contain** the QR handler in:
`apps/studio/server.ts`

The handler:
1. accepts `POST /api/qr`;
2. invokes the Python executable from `process.env.PYTHON || 'python3'`;
3. runs `import qrcode`;
4. writes a temporary PNG;
5. imports that PNG into the Studio asset catalog;
6. returns the imported asset.

Therefore this is not a missing HTTP route.

## Exact reproduction
Using the exact Studio 1.4.1 source with a Python environment that does **not** contain the `qrcode` module reproduces the Codex failure exactly:

- Tier 3 catalogs: PASS
- Tier 3 render/export: PASS
- Tier 3 Studio HTTP surface: FAIL
- exact assertion: `assert.ok(qr.asset?.id)`

Calling the route directly returns:

`QR_GENERATOR_UNAVAILABLE ... ModuleNotFoundError: No module named 'qrcode'`

## Control
Using a Python environment with `qrcode` installed makes the same Tier 3 HTTP test PASS.

## Root cause
The remaining WO-000 failure is an **environment prerequisite**:
the Python interpreter used by Studio QR generation does not have the `qrcode` package available.

Codex installed task-local Python Playwright for accessibility inspection, but that does not imply the QR dependency is present.

## Correct remediation
Do not edit Studio source or tests.

On D-generator:
1. identify the exact Python interpreter Studio will use;
2. install/provide task-local `qrcode` plus Pillow support for that interpreter;
3. explicitly set `PYTHON` to that interpreter if needed;
4. verify:
   `python -c "import qrcode; print('QR_IMPORT_PASS')"`
5. rerun the exact Tier 3 test;
6. rerun complete `npm test`;
7. update `DGENERATOR_BASELINE.md`;
8. if 81/81 passes and postcheck remains clean, change WO-000 to PASS.

## Product-quality follow-up
Studio's `ai:doctor` currently passes even when the QR Python dependency can be absent.

That is a Studio diagnostics gap, but it does **not** require blocking the TOADAL FEAST website once the task-local QR prerequisite is supplied.
