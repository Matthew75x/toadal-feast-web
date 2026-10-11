# Local authoring and recovery tooling

This adds a fail-closed engine preflight, portable native API witness, and explicit reproduction commands to the existing website candidate. It changes tooling/documentation only. Native project, artwork, generated dist and protected game runtime remain unchanged from visual checkpoint `552e8f5b5f83e88784a20d2362e98e94c05f0059` (tree `1e17969c8ba52ecf7cabb115e9507c25f17a5c9e`). The final tooling commit and source-bound seal are recorded in the accompanying delivery receipt, outside this commit.

No push, PR, merge, deployment, paid service or product-canon change is included. Passing a local check does not authorize those actions or constitute owner acceptance.

## Recover the correct source

Use the cumulative bundle in the current delivery, not a similarly named earlier ZIP. Verify its SHA256SUMS first. The bundle needs exact website base `e919234634b7c82614eb9ed6f8eefa6627249005` and its objects/assets in an authorized repository. Obtain them through an approved read-only repository route if absent; do not synthesize objects or relabel another revision. Verify the bundle and fetch its named local branch into a fresh local recovery branch. Check out that branch in its own worktree. This is a delta package, not a standalone clone or complete Studio distribution.

The editable source is the **whole** `studio-project/toadal-feast-website/` directory, including project manifest, pages, collections, assets and reference files. `dist` is generated static output. A 150-file canonical render does not replace the complete canonical plus retained-preview payload. Do not treat static screenshots or the sealed `site` directory as native editable source.

## Studio and runtime prerequisites

Supply an explicit, separate Studio repository root. The preflight accepts:

- Exact engine commit `5d022f5c3ea676458a63c8d2bb67ceb69c1a84d5`, or a source-equivalent recovered commit.
- In both cases, the sole parent must be `100629ad5edee57f8eb1358b4c7c3f0e09c6ec76` and the **full Git tree** must be `4ecd731114dd4fd0319bee9da3cada51402f5578`. Merely matching the two patched files is insufficient.
- Every present tracked engine file is independently hashed against its committed Git blob, including files marked skip-worktree. Modified bytes and symlinks fail. Required renderer, loader, validator, mutation entrypoints, package metadata and lockfile must exist. Untracked package sources fail.
- A partial checkout reports its missing-file count and is only a bounded materialized subset. It is not full engine certification. Missing runtime dependencies still fail the actual import/render; no checks or pins are bypassed.
- Required hosted Studio runtime is **Node 22.23.2**. Node 22 major alone is the website workflow requirement. Current local evidence used Node 24.19.0 with an explicit `--allow-node24-reproduction` flag and reports `qualifiedRuntime: false`. It must not be promoted to Node-22 or full-Studio qualification.

From the verified engine, project dependencies may be restored using its lockfile:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

The historical vendored owner-renderer and public-export projection are verified against their own existing provenance. The patched engine is not their historical source. **Unset `TOADAL_STUDIO_ROOT`**, even if it points to that patched engine. Do not refresh SDK pins to make a check pass. The preflight records historical source hashes as provenance, explicitly without claiming a fresh source rebuild.

## Read-only preflight and canonical render

Commands below run from the website repository root. Replace paths with consumer-local paths. Use new or empty output directories outside both repositories; symlinks, ancestors, nonempty paths and protected roots are rejected.

```sh
env -u TOADAL_STUDIO_ROOT node scripts/local-design-preflight.mjs /absolute/Studio

env -u TOADAL_STUDIO_ROOT node --no-warnings --experimental-strip-types \
  scripts/render-local-design-candidate.mjs /absolute/Studio /absolute/new-canonical-output

node scripts/serve-qualified-dist.mjs /absolute/new-canonical-output 8159
```

Use `http://127.0.0.1:8159/toadal-feast-web/`. Add `--allow-node24-reproduction` to preflight/render **only** for a deliberate Node-24 reproduction. The default renderer enforces preflight before importing the engine. It retains native validation, public projection, advanced-runtime externalization, staging/basepath transforms, semantic freshness, intrinsic dimensions, protected-artifact checks, static links and robots checks. Raw Studio render is not this public pipeline.

Do not use `--sync-dist` merely to review. This existing explicit flag writes generated repository output and retained preview pages; it is not an atomic replacement. Only use it for separately assigned generated-output work in a disposable worktree and inspect the full diff.

## Portable native editing witness

Supply a fresh scratch directory and a **new report file in an existing directory**, both outside source and engine. The report must also be outside scratch. Existing report files and nonempty scratch directories are never overwritten. The command has no workspace-specific absolute paths.

```sh
env -u TOADAL_STUDIO_ROOT node --no-warnings --experimental-strip-types \
  scripts/native-design-edit-roundtrip.mjs \
  /absolute/Studio /absolute/new-witness-scratch /absolute/existing-evidence/report.json
```

For intentional Node-24 reproduction append `--allow-node24-reproduction`.

The runner copies the complete native project, fingerprints it, then edits only that disposable copy:

1. Home headline through `content.setText`.
2. App link through `updateComponent`.
3. Existing approved Wicked Bites cover fit/focal point/zoom through `image.reframe`.

Each edit is saved and reloaded from disk with revision and property checks. Native validation and an edited native render verify all three effects. A `finally` path restores the disposable page and compares the authoritative native fingerprint, on failures as well as success. The report records actual engine identity, runtime mode, errors and restoration status. Scratch history and rendered evidence are deliberately retained for inspection; only the copied page is restored. No authoritative native file is edited.

This is an **API witness**, not a GUI walkthrough. Its raw edited render is bounded native proof, not full public-export acceptance. Current evidence includes a successful witness and an intentionally invalid disposable-asset fixture that fails closed, restores the copied page and leaves authoritative fingerprints unchanged.

## Local checks and evidence

```sh
node --test scripts/local-design-preflight.test.mjs
node --test scripts/website-design-completion.test.mjs scripts/game-cover-framing.test.mjs scripts/companion-visibility.test.mjs scripts/advanced-runtime-externalization.test.mjs scripts/world-character-layout.test.mjs
node scripts/verify-manifest-compliance-ledger.mjs
node --test scripts/manifest-compliance-consistency.test.mjs scripts/wo001-pages-basepath.test.mjs
node scripts/verify-pages-basepath.mjs dist /toadal-feast-web/
node scripts/verify-static-links.mjs dist /toadal-feast-web/
node scripts/verify-staging-robots.mjs dist staging
```

The complete required test command remains in `.github/workflows/pr-verify.yml`; no workflow was changed. Current local reproduction: required 283/283, control 25/25 and current design-focused 35/35 pass. The new safety suite covers exact/equivalent identity, wrong tree/parent, hidden working-byte drift, missing entrypoint, SDK environment ambiguity, vendor tampering, runtime refusal, scratch/report collisions and symlinks. All 150 fresh public-render files match current dist byte-for-byte. Static checks cover all 67 HTML files. The two previously disclosed optional historical runtime-conversion failures are not claimed fixed.

A later tooling commit requires a newly prepared source-bound seal even when dist bytes are identical. Never reuse the previous commit/manifest as if it named the new commit. Final identities, hashes, negative-test receipts and fresh recovery verification belong in the delivery evidence.

## Separate acceptance gates

Node-22.23.2 execution, full Studio checkout/suite, actual editor UI, physical touch-device coverage, full accessibility and owner visual acceptance remain distinct gates. Any separate UI result must identify its actual engine/browser/source and limits. Nothing here changes unavailable account/store/content features, held Feed Gulper launch, missing approved illustrated wordmark, or unpublished content. Integration and publication still require separate approval.
