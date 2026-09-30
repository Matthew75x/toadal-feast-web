# WO-008 — Website Release Candidate Closure
**Status:** HOLD until WO-007 PASS

## Goal
Create an exact accepted website release candidate. No feature expansion.

## Read first
- `docs/implementation/RELEASE_ACCEPTANCE_CONTRACT.md`
- `docs/implementation/BRANCH_AND_DEPLOYMENT_POLICY.md`
- `docs/implementation/QA_ACCEPTANCE_MATRIX.md`

## Required
1. only release-blocking fixes;
2. clean source checkpoint;
3. Studio validation/build/static export;
4. static link/base-path/robots checks;
5. generate exact static manifest:
   `node scripts/generate-static-manifest.mjs dist <evidence-path>/STATIC_MANIFEST.json`
6. record exact Git SHA;
7. Studio project backup/reference;
8. QA report;
9. known limitations;
10. rollback source/artifact reference;
11. GitHub Pages staging review package.

## Artifact identity
Record:
- Git SHA
- file count
- bytes
- per-file SHA-256
- build environment
- deployment base

## Prohibited
- feature expansion
- production DNS/cutover
- unrelated visual improvement
- starting future backend work
- changing accepted public truth without owner approval

## Stop
STOP at owner-acceptance package.
Do not deploy production.
