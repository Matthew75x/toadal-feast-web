# TOADAL FEAST Website — Release Acceptance Contract

## Goal
A website release candidate is an exact static artifact tied to an exact Git commit and reproducible review evidence.

## Release candidate identity
Record:
- source repository
- exact Git commit SHA
- Studio project identity/version
- build command
- deployment base path
- build timestamp
- file count
- total bytes
- per-file SHA-256 manifest
- QA report
- known limitations

## Required static checks
Before a Pages or production release candidate is accepted:
1. static export succeeds;
2. `index.html` exists;
3. `404.html` exists;
4. internal links/assets resolve;
5. project-base-path check passes;
6. staging robots policy is correct;
7. no secrets/private files are present;
8. required metadata exists;
9. required route outputs exist for implemented pages;
10. console/network smoke is clean for critical routes.

## Artifact immutability
After owner acceptance, do not silently rebuild the same "release" from a different working tree.

A new build after any source/content/asset change receives:
- a new Git SHA or documented content revision;
- a new static manifest;
- new QA evidence as needed.

## GitHub Pages
Pages is staging until production cutover is explicitly approved.

Deploy only accepted `main` snapshots.

Avoid repeated deploys for unfinished local iterations.

## Rollback
Keep:
- previous accepted static artifact or manifest;
- previous accepted Git SHA;
- clear rollback instructions.

Rollback must not require reconstructing old content from memory.

## Production gate
Production cutover requires explicit owner approval after:
- hosted staging acceptance;
- required legal/support/app destinations are correct;
- critical browser-game/App claims are truthful;
- rollback artifact is available.

## Release blocker examples
- broken navigation/assets;
- mascot/brand regression on critical pages;
- missing 404/recovery;
- staging accidentally indexable;
- fake product evidence;
- PUBLIC game with broken cartridge;
- missing legal/support destination when required;
- artifact cannot be tied to source.
