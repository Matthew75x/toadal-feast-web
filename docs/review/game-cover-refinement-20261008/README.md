# Local game-cover refinement, 2026-10-08

Base: `1c8bdb7a6eb1c4052b40b9c8e97733d41c5f4deb`, branch `dot/website-design-completion-20261008`.

The owner's 18:05 UTC request asks for images to fill their boxes coherently and one generated Feed Gulper game-title card. It supersedes the fixed 155px/contain presentation for **promotional listing covers only**. This is a local website candidate, not a deployment or product/game authority change.

## Changes

- Home's four game-card image windows now use editable native `aspectRatio: 16/9` instead of a fixed height. Existing Wicked Bites and Froggie Fruity Bash covers are exactly 960×540, so the complete composition fills each window without letterboxing, stretching or title cropping.
- Play uses the same landscape ratio above each card's copy. Status chips sit below the image, avoiding title obstruction.
- Preview buttons remain separate from navigation and sit below the artwork, with 44px minimum targets. Existing preview interaction JavaScript is unchanged.
- Reflowed Play cards are protected as complete collision surfaces. The existing measured 52px desktop header-gap dock also supports Play for default minimized companions, preserving manual placements and all viewport/drag guards.
- CLAW: Feed Gulper has a generated promotional cover by default. Its genuine 844×390 staging screenshot remains separately available in Home's gameplay preview and unchanged on its detail page. Browser launch remains held.

## Artwork provenance

Master: `asset.import.feed-gulper-title-card-v1.e8ca7e00`, 1672×941 RGB PNG, 2,118,796 bytes, SHA-256 `e8ca7e000f1d77cbdc272854e84ac6010ea29b422369d316c140bd7f6386c46a`.

This is owner-requested generated **promotional candidate artwork**, using canonical Gulper and the existing promotional covers as references. It is not game footage, game canon, release authority, or claimed owner visual acceptance. The original generated PNG is preserved unchanged in the native asset graph. Studio `asset-tools/importOptimizedAsset` and `importAssetFromBuffer` created the registered WebP delivery asset (189,806 bytes) and recorded AVIF/thumbnail derivatives. Source dimensions remain 1672×941; the 16:9 frame difference is 0.053%, less than one source pixel vertically, never a meaningful title/face crop. No painting, compositing, or alteration of prior images was performed.

## Verification

- Required workflow suite: 283 pass, zero failures.
- Manifest/crawler controls: 25 pass, zero failures.
- Framing/design/visibility focused tests: 26 pass, zero failures; includes explicit native aspect ratio, title-safe source dimensions, separate genuine screenshot, status placement, preserved image provenance and held-state checks.
- Native project validation: no errors or warnings.
- Home contract: 38/38 pass; base path, links, staging robots and visual asset authority pass.
- All 76 pre-existing registered asset byte hashes and the advanced-code JavaScript remain unchanged from the base commit. No game registry, protected cartridge, audio, share or game runtime files changed.
- Canonical export and retained preview namespace are regenerated from native source using Studio engine `5d022f5c3ea676458a63c8d2bb67ceb69c1a84d5`. A second build exactly reproduces all 150 files in the frozen review output. Final `candidate-review-15` differs from browser-reviewed `candidate-review-14` only by CSS trailing whitespace and resulting stylesheet hash URLs; token/HTML equivalence is recorded.
- Native render freshness: all 33 routes pass the unchanged checker at the correct stage, after public projection/base-path rewriting and before sanctioned intrinsic image metadata injection. A diagnostic invocation after intrinsic injection reports expected metadata differences and is not the qualification command. The final post-intrinsic output passes exact-engine deterministic comparison and intrinsic-dimension regression tests.

Two optional historical `owner-native-runtime.test.mjs` assertions fail on the discovery-loader resource list (three versus four resources); both reproduce identically when running the same command against an independently extracted exact `1c8bdb7` baseline. They were not weakened or changed, and no claim is made that the entire historical unfiltered test glob passes.

## Rendered acceptance

Independent browser QA of frozen review-14 passes at desktop 1180px and true top-level narrow 388px/DPR1. Home and Play promotional cover boxes are 16:9 and fully filled with title lettering/faces intact. Final narrow Feed Gulper keyboard Enter toggles gameplay and back without changing the Home URL; ordinary Play detail navigation remains held/non-playable. The desktop Play companion is 52×52 in the measured header gap (x276, y6), with zero main-text/image/control intersections. Original screenshots remain independent gameplay content.

No push, PR, merge, deployment, external source write or spending performed. Physical-device testing, a fresh Studio editor UI walkthrough and owner visual acceptance remain separate.
