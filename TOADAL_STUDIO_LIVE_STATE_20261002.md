# TOADAL Studio / Website Live State — 2026-10-02

## Active workspace and service

- Website repository/worktree: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002`
- Studio repository/worktree: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\studio-owner-authoring-20261002\TOADAL_STUDIO_1.4.2_AUDITED_WEB_BUILDER`
- Studio version: **1.4.2** (the local audited Studio checkout; running directly from source)
- `TOADAL_PROJECT`: `C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json`
- Local Studio/editor URL: `http://127.0.0.1:4320/` (port 4320; listener observed active; do not stop it)
- Provider: local Node.js process running `apps/studio/server.ts`; launched by PowerShell with `TOADAL_PROJECT` set to the path above and temporary files redirected to `D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\studio-export-tmp`.
- This Studio editing/render/export workflow is local. No external editor, generator, or API service is required for the work recorded here. External network may still be used by unrelated browser features; no such dependency was needed for the canonical local export.

## Git state

- Website branch: `work/owner-native-authoring-20261002`
- Website HEAD: `fc0537dbde074acb6ee8c426a5a9793fdcb209ee`; HEAD tree: `e067cf1570c6fcaba28defd47207f967e04f666d`
- Website worktree: **dirty**, 121 short-status entries at snapshot time. Changes include native-authoring source/project inputs, generated `dist/`, and untracked authoring/qualification scripts and docs. Nothing has been committed by this work.
- Studio branch: `work/owner-native-authoring-20261002`
- Studio HEAD: `cba27e30c0c5ebedba407eb02e6b67f11c3c006e`; HEAD tree: `9c0249fb35fa55fc7445300dc4d9b11ef5c83bce`
- Studio worktree: **dirty**, 44 short-status entries. Contains Studio source/UI/bridge/exporter changes, new tests and authoring modules, plus generated/test scratch files. Nothing has been committed by this work.
- No reset, cleanup, merge, staging promotion, or deployment was performed.

## Work completed in this owner-native authoring task

- **Website/source/project:** Converted the site’s 33 routes to native Studio component authoring (2,732 component nodes); exposed native Home game-card and World-card navigation objects. Three protected runtime-rich-text leaves remain intentionally specialized. The project graph validates with 180 nodes, 217 edges, and zero dangling references.
- **Studio/editor:** Added owner-oriented authoring controls/surfaces and typed bridge support. Fixed the renderer’s legacy-symbol behavior so instance-owned properties and children survive; added a regression test. Added the Windows ZIP export compression assembly fallback.
- **Assets/content/dialogue/links:** Reused the existing site content and assets; no separate dialogue rewrite or new visual redesign was performed. Native link/navigation objects were added for the Home game cards and World cards. Eight approved companion derivatives were part of the existing conversion scope.
- **Render/export:** Canonical Studio inspect, render, static export, and verify checkpoint completed. Studio validation passed; inspect reported 33 pages, 4 games, 68 assets, 62 components, and zero warnings/errors. Fresh static ZIP SHA-256: `5B03E85FDC0AE3878583AD968BFD9879C9DC45D16AF2803C0693BE667B4AC917`. Extracted export and `dist/` matched exactly (138 files; ledger SHA-256 `82a095330f4349145e1ee7ddd1c02ecc0fa73bf98b041d662846f7def9106f8a`). `index.html` and `404.html` are present.
- **Verification:** Website `node --test`: 136/136 passed. Final manifest closure gate: 20/20 passed, including its 83-case browser matrix. Pages base-path and static-link checks passed. Studio `ai:doctor` passed. Studio suite ran 183 tests but only 147 passed; 36 failed with `ENOSPC`/disk-write errors on C:, so this is not a completed green Studio qualification. The owner-preview gate was interrupted after C: filled; do not interpret it as a pass.
- **Deploy/staging:** No deployment, staging update, production change, or `main` change.

## Remaining / preservation notes

- Highest-priority unfinished work: rerun the Studio 183-test qualification with both `TEMP` and `TMP` redirected to the available D: scratch directory; then complete the owner-preview gate if resources permit. Do not repeat already-green broad checks without a reason.
- Website has 121 dirty/untracked status entries; Studio has 44. They remain on disk and uncommitted. Ending Codex does not itself discard them, but they have no commit checkpoint yet. Inspect `git status --short` in both repositories before any edit or commit.
- `dist/` is generated output, but it is not the only changed state: authoritative source/project files are also modified. Current `dist/` is byte-for-byte aligned with the canonical static export; do not treat this as a dist-only change.
- Studio project histories/build/export archives and test scratch are generated state. Preserve them until the owner decides what can be archived or cleaned.
- Minimum resume command (from the Studio repository):
  `$env:TOADAL_PROJECT='C:\Users\Metarator\Documents\Codex\2026-09-29\t-3\work\toadal-feast-web-owner-native-authoring-20261002\studio-project\toadal-feast-website\project.json'; $env:PORT='4320'; $env:TOADAL_HOST='127.0.0.1'; $env:TEMP='D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\studio-export-tmp'; $env:TMP=$env:TEMP; node --no-warnings --experimental-strip-types apps/studio/server.ts`

## Preservation checkpoint update — 2026-10-02

- Website owner-native checkpoint: commit `8701e59c83a704eed2d14ad2c18ce01d62ef2b2b`, tree `cb24c85d0c66158b0d6a066b25937c614a73a68f` (219 paths). It includes the native project/source, intentional tracked `dist/`, authoring tests, docs, and evidence.
- Studio owner-native checkpoint: commit `c504b8e247640f097d85c86ae9da8c9b20c20762`, tree `8adfe0a97e7f9341b5fd1769a010e2244148637e` (36 paths). It includes Studio source, owner-authoring controls, renderer symbol fix/regression test, exporter updates, and launcher/config files.
- Qualification update after checkpoint: Studio full suite rerun once with `TEMP`, `TMP`, `TMPDIR`, `npm_config_cache`, and report output on D: resulted in **167/183 PASS, 16 FAIL**. The report is `D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\studio-suite-output-20261002\studio-qualification-resume.json`. Validation passed, AI doctor exit 0, source fingerprint unchanged. Failures are not all explained by temp relocation: the visible test output includes five recovery tests with `ENOSPC` writes/copies into the Studio checkout on C:, `ZIP_FAILED: null` in Tier 2, missing ImageMagick in Tier 3, a Tier-3 HTTP assertion (`null !== 0`), and a Tier-4 assertion (`false !== true`). The QA response retains only the output tail, so this list may not account for all 16 failures. C: filled again during this run; no further suite rerun attempted.
- Owner-preview gate remains **interrupted/incomplete**; it was not resumed because the Studio suite failed. Do not claim it passed. Previously completed, unaffected checks remain as documented above.
- Preservation exclusions: Studio `AI/AUDIT/mcp-tools.jsonl` remains modified (generated tool-call audit entries); `projects/ai-test-1790966509110/` and six zero-byte `projects/toadal-games/*.tmp` files remain untracked as generated QA/test residue. They were not discarded. The verified static ZIP was moved intact to `D:\Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e\checkpoint-preserve-20261002\toadal-feast-website-static-site.zip`; SHA-256 remains `5B03E85FDC0AE3878583AD968BFD9879C9DC45D16AF2803C0693BE667B4AC917`.
- Qualification used the existing committed Studio checkpoint, not the running localhost workspace. The next action should be a separately planned test run from a D:-resident committed Studio checkout with explicit ZIP/ImageMagick paths and the correct project-root behavior, after ensuring C: is not needed for fixture writes; investigate the QR and Tier-4 assertions rather than assuming they're environmental. Do not resume broad owner-preview tests until Studio suite blockers are understood.
