# TOADAL Website — Current Authority

**Updated:** 2026-10-04

## Autonomous completion operation — qualified candidate

The owner delegated technical and authoring completion, internal visual acceptance, durable GitHub preservation, and staging release in the autonomous completion operation. Owner review is not an execution gate for that operation. This does not authorize production/DNS changes, fabricated external services, native-game release changes, or changes to `main`.

The active website work branch is `work/autonomous-owner-completion-20261004`.

- Qualified website candidate: `0132cb22cfbf821ec597d32a97f60d556ead7e97`
- Candidate tree: `0ee1e5e54d77e5a59d84c7c8a557c14cc098d0b8`
- Candidate parent/base: `97c969b536aa250a20aa339cdb85202a358b40e7`
- Source workspace: `D:\TOADAL_BACKUPS\website-autonomous-completion-20261004`
- Canonical project: `D:\TOADAL_BACKUPS\website-autonomous-completion-20261004\studio-project\toadal-feast-website\project.json`
- Regenerated static export: `dist/`, 140 files, GitHub Pages base `/toadal-feast-web/`.
- Gate input fingerprints: source 271 files / SHA-256 `4ee50ea44890abf913dad692f781aebbf9e7e763e2221436de2d010ff7b17ee2`; dist 140 files / SHA-256 `c369a3dd0d5176e8ce02a0ea86a06525a1eff89bbeb554281a40d28142e243ac`. Inputs were unchanged during the gate.

### Current remote authority

Refs were freshly checked after the work-branch push:

- `main`: `9ce82e1188eb1c28fb79f3b4cef5bfdab1cbf75a` (untouched)
- `staging/live-visual`: `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6` (refreshed baseline before this candidate's staging promotion)
- qualified work-branch website payload: `0132cb22cfbf821ec597d32a97f60d556ead7e97`; later work-branch commits in this operation update authority documentation only.

The refreshed staging ref is an ancestor of the candidate. The candidate preserves the staging baseline; no force-push, destructive reset, merge, or whole-project replacement was used. The sole changed-file overlap against newer main history since the merge base was `README.md`; it is reconciled as documentation and no implementation overlap was found.

### Qualification receipts

- Website `node --test`: **149/149 PASS**, no skips. Raw run logs are preserved at `evidence/node-tests-20261004.log` (initial environment-sensitive run) and `evidence/node-tests-qualified-20261004.log` (qualified run).
- Owner-preview gate: **16/16 PASS**; machine report and summary are under `docs/review/owner-preview-gate-20261004/`.
- Browser matrix: **83/83 PASS**, 33 routes, desktop/tablet/mobile/small-mobile cases, zero reported issues.
- Route/navigation: 33 routes, 31 navigation targets checked, zero unresolved targets.
- Manifest ledger: 29 rows are `DONE_PROVEN`; the sole `PARTIAL` row is Home. Its `engineeringStatus` is `QUALIFIED`; the remaining item is the owner's `LOCK_VISUAL` acceptance, and the existing verifier correctly forbids recording that owner decision without it. This operation does not claim `LOCK_VISUAL`; no engineering blocker remains.
- Owner-preview render freshness, Pages base path, static links, staging robots, asset authority, protected-cartridge isolation, non-Home layout, manifest, search, route truth and gameplay authority checks passed.
- Studio project validation: PASS, zero warnings/errors. Studio inspect/render/export/verify checkpoint passed; static output contained 140 files and was checked against the Pages base path.
- Staging robots policy is no-index; production remains outside this operation.

Gate summary: `docs/review/owner-preview-gate-20261004/OWNER_PREVIEW_GATE.md`; full JSON and browser case detail are adjacent.

### Studio provenance and owner capability

The separate Studio worktree is `D:\TOADAL_BACKUPS\studio-v51-source-admission-20261003\studio`, branch `integration/studio-builder-v5-20261003`, checkpoint `d43041537ceee5ea531690f1e51b5aae447d9ed8`, tree `9d963ef3e457bb1a70238f739b19a172b5cb997e`. It is the V5.1 engineering lane whose package reports Studio version 1.4.2. Its qualified suite was **473/473 PASS**, `ai:doctor` PASS, project validation PASS. The checkpoint is pushed. Separate, unrelated dirty pilot/Audit entries in that Studio worktree were preserved and not included in the checkpoint.

Local services were running at `http://127.0.0.1:4380/` (Studio editor) and `http://127.0.0.1:4381/` (read-only candidate preview); they were not stopped. Reopen the already-running services rather than launching duplicate instances.

The isolated owner UI pilot passed for actual copy, image/alt/fit/focal/framing, link/navigation and metadata edits; save/reopen persistence; preview; export; undo/redo; invalid focal rejection; cancel-without-mutation; and export output assertions. Receipt: `owner-ui-pilot-evidence/2026-10-04T10-23-54.683Z/receipt.json`. A separate portable backup/restore and repeat-export ledger check passed: `owner-ui-pilot-evidence/backup-roundtrip-2026-10-04T10-36-09.791Z/receipt.json`.

A bounded mobile hero style cap remains: the mobile Toadal artwork is constrained by an existing 205px maximum-height rule. The authoring value persists, but presentation remains within that design cap; this is documented as a constraint, not silently presented as an unrestricted height setting.

### Product truth and optional owner content

All 33 registered routes render and their navigation resolves. Existing game listings remain truthful preview/held states; public-game count remains zero. The isolated Wicked Bites staging route and score bridge remain qualified, while protected gameplay bytes were not broadened or exposed to trusted parent runtime.

The story/manga/reader publishing registries are genuinely empty; the pages show truthful empty/catalogue states. No story chapters or fake user data were invented. Normal content can be added through the Studio collection/page workflows when owner-approved text and artwork exist. Other optional external/owner inputs include approved app-store URLs, owner-approved legal copy, and a real contact-submission service. Accounts/cloud/Passport, payments/entitlements, production telemetry, app-store availability, and TCS cartridge admission remain future/external systems—not falsely simulated as live features.

### Promotion and live verification

- `staging/live-visual` was fast-forwarded from `485e5cee7fd9e8d74bde017e99a861ff7da3a2c6` to the qualified website payload `0132cb22cfbf821ec597d32a97f60d556ead7e97` (tree `0ee1e5e54d77e5a59d84c7c8a557c14cc098d0b8`).
- GitHub Actions **Deploy GitHub Pages** run `37200911048` completed successfully with `head_sha=0132cb22cfbf821ec597d32a97f60d556ead7e97`: https://github.com/Matthew75x/toadal-feast-web/actions/runs/37200911048
- Public owner-preview URL: https://matthew75x.github.io/toadal-feast-web/
- Live read-only smoke: Home, Play, Stories, App, Support, World, Characters, Feast Pass, and `robots.txt` all returned HTTP 200. Each response body was SHA-256 compared against the corresponding local `dist/` file; all nine matched byte-for-byte. Pages base-path and staging no-index markers were present.
- The work branch subsequently received documentation-only authority updates; no source or `dist/` bytes changed after qualification. The staging branch remains pinned to the exact qualified payload SHA above.
- `main` remains `9ce82e1188eb1c28fb79f3b4cef5bfdab1cbf75a`; it was not modified. Production/`toadalfeast.com`, DNS, and native TOADAL FEAST release authority were not touched.

## Repository authority

Repository: `Matthew75x/toadal-feast-web`

- Active completion work lane: `work/autonomous-owner-completion-20261004`
- Preserved owner-authoring baseline: `work/owner-native-authoring-20261002`
- Preserved authority pointer: `archive/owner-native-authority-20261003`
- Deployment lane: `staging/live-visual`

This page is the concise current-state pointer for the website lane. Historical work-order, QA, and Studio logs remain preserved in their dated locations and do not override this page.

## Product hierarchy

1. Owner-approved product/creative requirements
2. Approved authority manifests/assets/mockups
3. Implementation work orders
4. Current implementation/staging

A newer branch does not override an owner-approved requirement simply by being newer.

## Studio boundary

The website authoring repository and the current Studio V5.1 engineering checkpoint are related but separate authorities. Do not use historical Studio 1.4.2 logs as proof for unrelated V5.1 runtime changes. Native TOADAL FEAST 1.2.9 release authority remains outside this operation.

## Branch discipline

Use:
- `work/` for active engineering;
- `qa/` for bounded QA;
- `docs/` for current documentation changes;
- `archive/` for intentionally preserved historical heads.

Close and archive finished lanes. Do not leave old drafts open indefinitely.

## Cleanup record

See [CLEANUP_RECEIPT_20261003.md](CLEANUP_RECEIPT_20261003.md) for the executed PR/branch cleanup and current branch count.
