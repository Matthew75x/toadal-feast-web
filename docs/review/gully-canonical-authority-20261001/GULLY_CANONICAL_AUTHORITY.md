# Gully canonical website identity — closure report

## Result

**PASS — canonical neutral Gully authority completed on a dedicated branch.**

Starting baseline: `fbcc41a7e5ac36ca8362f503557968090119e5f1`

Branch: `asset/gully-canonical-happy-20261001`

This lane changes only the neutral website identity art for Gully plus its authority metadata, verifier, and compact evidence. Wicked Bites gameplay-specific Gully assets are explicitly excluded.

## Owner-approved role

The owner-selected regular happy standing Gully is the canonical neutral/profile portrait for:
- Home
- Characters
- World
- Media

Celebration/confetti and dizzy Gully remain reaction-state art only and are not part of this neutral identity change.

## Asset provenance

Owner upload SHA-256:
`5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388`

The source contained an opaque near-black backdrop around the subject. A conservative connected-background cleanup was applied to remove only the contiguous backdrop while retaining Gully's dark eye and outline detail.

Final runtime derivative:
- path: `reference/assets/images/characters/gully.webp`
- dimensions: `319x319`
- bytes: `15,798`
- SHA-256: `177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea`

The asset index and `visual-asset-authority-lock.json` are updated to this exact derivative.

## Binding model

All four neutral surfaces already resolve through the shared `gully.webp` path, so no page-specific markup hacks were required.

The focused verifier asserts:
- exact derivative SHA/bytes/dimensions;
- owner-source provenance hash;
- all four render targets;
- required authority tags;
- Home/Characters/World/Media still reference the shared neutral Gully asset;
- Wicked Bites gameplay-specific Gully selector/sprite references remain untouched.

## Qualification

- `verify-gully-canonical-authority.mjs`: **PASS**
- character content registry: **PASS**
- visual asset authority: **PASS**
- Home visual contract: **37/37 PASS**
- navigation truth: **PASS**
- required Node suite: **48/48 PASS**

Disposable browser preview was based on the frozen `fbcc41a...` Pages dist with only the candidate Gully derivative swapped into the matching runtime path. This preview was not committed or deployed.

Browser evidence:
- Home desktop: loaded 319x319 canonical derivative; no horizontal overflow
- Characters desktop: loaded 319x319 canonical derivative; no horizontal overflow
- World desktop: loaded 319x319 canonical derivative; no horizontal overflow
- Media desktop: loaded 319x319 canonical derivative; no horizontal overflow
- Home 390px: loaded canonical derivative; no horizontal overflow
- Characters 390px: loaded canonical derivative; no horizontal overflow

See:
- `evidence/gully-browser-evidence.json`
- `evidence/gully-characters-desktop.webp`
- `evidence/gully-characters-mobile.webp`

## Scope and integration

No Home layout architecture, floating-companion behavior, gameplay cartridge, progression logic, Interactive Discovery V1 logic, `main`, staging, or production deployment was changed in this lane.

This commit is intentionally small and cherry-pickable onto the qualified Interactive Discovery V1 commit `40e4437c00951d9b9903c3a188d32f54d5a49ef3`, followed by the normal authoritative Studio rerender/qualification on that integrated branch.
