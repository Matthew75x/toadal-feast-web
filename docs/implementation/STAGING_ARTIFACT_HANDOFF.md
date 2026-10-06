# Exact GitHub Pages staging artifact handoff

## Scope

The existing Studio export and Pages workflow now share a fixed game-preservation boundary. Pages uploads a separate, checked package instead of the working `dist/` directory. This closes the controlled staging **final-payload handoff** gap; it does not claim the whole TCS system, production Direct Upload, or all administrator-controlled paths are qualified.

The existing public staging website and its three-file Wicked Bites 5.5 legacy preview remain unchanged. The policy records the exact already-delivered PR #23 source `670f1967ddd49805ca937aa941808fd4de30dc91`, not a new game qualification. The donor entry hash, wrapped entry hash and whole-game package hashes are different identities: the policy pins the actual three files served by this staging site.

`manifests/staging-game-preservation-policy.json` is a separately reviewed trust input. Never regenerate it from an altered candidate merely to make a failed check pass. Its exception is **LEGACY_PREVIEW_PRESERVATION_NOT_TCS_QUALIFICATION**. New cartridges remain denied; qualification/admission and capability activation must use the existing TCS/Publisher authority in a separately reviewed integration. This tool cannot emit TCS PASS, accept a substitute QA report, enable a held game or grant progression capability.

## What is enforced

1. Studio export still verifies reference/output equality, and additionally verifies each protected game file against the independent legacy pins. Changing source and output together no longer passes merely because the copies match. Unknown extra game payloads, including unlisted/hidden ones, are denied.
2. The package source is an explicit full Git commit SHA. Branch names, `HEAD`, short hashes and an implicit latest candidate are refused by the interface. The manifest binds that commit, root tree, `dist` tree, current policy hash, file inventory and environment.
3. The complete final input is compared with exact Git blobs. Missing, extra, changed or relocated files fail. Symlinks/junctions, hardlinks, Git symlink/submodule modes, case collisions, ambiguous paths, hidden/private runtime paths, custom-domain CNAME and unbounded payloads fail. Non-game HTML must retain staging noindex/nofollow and robots.txt must disallow the site.
4. Preparation copies verified bytes into a NEW `site/` directory, then checks them again. It never overwrites an existing package or edits the source/input directory. A failed partial preparation remains for inspection and is not a successful upload target.
5. The manifest, its digest and receipt are outside `site/`. Verification recomputes the expected manifest from the explicit Git source and current policy; rewriting a payload and its local checksum does not authorize changed bytes. The receipt cannot truthfully claim deployment or TCS approval.
6. GitHub's existing uploader excludes dotfiles. The empty `.nojekyll` source marker is therefore the one explicit packaging omission, recorded in the manifest. Its contents must be empty. The sealed `site/` contains exactly the public files the existing action uploads; no other implicit file omissions are allowed. The current source has 141 files; the sealed public payload has 140, with identical content bytes.
7. The same current policy applies when preparing a historical source package. A revoked artifact cannot be resurrected by reading an old source/policy. Historical preparation is not live rollback activation.

Policy changes and executable website-source changes still require review. A committed hash is source identity, not proof of owner acceptance or gameplay truth. This checker recognizes declared protected game namespaces; it is not a semantic detector for arbitrary game code deliberately disguised and committed as ordinary website code. It rejects such unaccounted additions after the source/export boundary, while intentional code/policy changes remain the repository's administrative trust boundary.

## Normal operator workflow

Use the existing pinned Studio command to export in an isolated authoring checkout. It now includes the independent game pins. Commit and review the intended source/export through the existing branch process.

```text
node --no-warnings --experimental-strip-types scripts/export-staging-candidate.mjs <PINNED_STUDIO_ROOT>
node scripts/staging-artifact.mjs prepare --source <FULL_REVIEWED_COMMIT_SHA> --input dist --output <NEW_PACKAGE_DIRECTORY>
node scripts/staging-artifact.mjs verify --source <SAME_FULL_COMMIT_SHA> --output <SAME_PACKAGE_DIRECTORY> --manifest-sha256 <RECORDED_SHA256>
```

Python, a phone, a provider token and a TCS signing key are not needed. Node and Git are used, with no additional npm dependency. The package directory's parent must already exist. Keep it outside authored source, or in this checkout's ignored `.tmp/` area. Packages are portable: their saved receipt uses `site` and `manifest.json` relative paths, not a previous machine's absolute path.

In CI, `GITHUB_SHA`, the expected repository and `refs/heads/staging/live-visual` must agree. The `seal` step exposes its verified isolated payload path to `actions/upload-pages-artifact@v4`; no later step modifies that payload. Existing Pages permissions, environment, branch restriction and concurrency remain unchanged. No new workflow, manual dispatch, production deployment or credential is introduced.

The input `dist/` is no longer the uploader's path. Do not add a direct-upload step around the seal or upload the package root (which contains metadata). Use its `site/` payload only, after verifying the exact source and separately recorded digest. The command itself never uploads, invokes a provider or switches traffic.

## Recover the recorded prior staging source without rebuilding

In a full clone containing the prior reviewed commit, run the current packager against its exact Git objects:

```text
node scripts/staging-artifact.mjs prepare --source 670f1967ddd49805ca937aa941808fd4de30dc91 --from-git --output ../staging-recovery-670f1967
node scripts/staging-artifact.mjs verify --source 670f1967ddd49805ca937aa941808fd4de30dc91 --output ../staging-recovery-670f1967 --manifest-sha256 <DIGEST_RETURNED_BY_PREPARATION>
```

This reconstructs source-owned public bytes, not private accounts, game saves, databases, keys or the old machine's services. It uses today's reviewed game policy, not the old commit's policy. No rebuild from a newer Studio or mutable worktree occurs. The result is only a prepared historical candidate; do not deploy it without checking the relevant acceptance/revocation and environment decision. No automatic rollback is installed.

An ordinary shallow Actions checkout contains the current run's source, sufficient for current packaging. Historical recovery requires that exact historical commit/object set to be present; a missing object is a refusal, not a fallback to the current head.

## Evidence and remaining boundary

Focused regressions reproduce the old comparison-only gaps with synthetic bytes and cover exact source/copy verification, tampering, self-rehashed manifests, path/link conflicts, unsafe destinations, policy revocation, historical recovery and staging-only metadata. Those fixtures are not approved cartridges and are never executed as games.

The delivery receipt should record the exact tested/merged source, policy and manifest hashes, fresh export equality, package/source-only recovery, actual Actions seal/upload/deployment result and final HTTPS readback. Do not mark the task deployed from local tests or a prepared package alone. A before/after browser campaign is unnecessary when every public byte remains identical; byte readback is not a new physical-device/gameplay qualification.

Out-of-band administrator uploads, provider-side rollback, production DNS/hosting, branch-protection administration, and legitimate positive TCS issuance remain separate controls. This repository cannot prevent a privileged person from intentionally disabling/replacing its workflow or uploading elsewhere. Previously open EC-02 and the broader multi-path EC-01/EC-05 admission work must not be falsely closed by this staging handoff.

Official uploader format/omission references: `actions/upload-pages-artifact@v4:action.yml`; GitHub Docs, “Using custom workflows with GitHub Pages.” The existing uploader uses tar with link dereferencing, so this guard refuses links before they reach it. No provider-side custom TCS verification is assumed.
