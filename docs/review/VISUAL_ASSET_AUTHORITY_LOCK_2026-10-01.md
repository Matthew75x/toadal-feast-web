# Visual Asset Authority Lock — 2026-10-01

## Result

**PASS — website visual-asset authority is now explicitly locked for the owner-preview candidate.**

This lane is source/asset governance only. It does not redesign Home, change gameplay, alter staging, or deploy production.

## Provenance

- Branch: `parallel/visual-asset-authority-lock-20261001`
- Base: `7a649bdcc9f3f00526a06b716fbea2e5f3e63c67`
- Non-Home truth ancestor: `990fd7044cdb4780bd0446ee5aad287753b8fe32`
- Integrated product ancestor: `ce5aceb251ac6b612fcace7baa6ea63032ca93a7`

## Locked inventory

The authority manifest is:

`manifests/visual-asset-authority-lock.json`

It freezes:

- **41 registered source assets** from the website asset index, including exact path, byte count and SHA-256.
- **25 optimized companion runtime derivatives** with exact path, byte count and SHA-256.
- **66 / 66 visual files** currently present under the website reference image/brand tree. There are no extra unaccounted visual files.
- **39 distinct visual asset paths** currently referenced by product source.

Any new visual file, changed bytes, changed registered path, or changed runtime derivative now requires an explicit authority update rather than silently entering the preview.

## Brand authority

Current approved website brand asset:

- `asset.brand.crown`
- `/assets/brand/brand-crown.svg`
- SHA-256: `6fcbfd6dc4193ae86f9ffd42f999d2057fa12d4360bb35ef5d4d2b41a718ee4d`

The reference brand directory contains exactly the canonical crown asset and no wordmark/logo file.

**Final franchise wordmark status remains: NOT_PRESENT_NOT_APPROVED.**

Until an owner-approved wordmark is supplied, the allowed website fallback is the canonical crown accent plus clean text `TOADAL FEAST`.

The lock explicitly forbids:
- fabricating a replacement wordmark;
- AI-generating a substitute wordmark;
- treating a game/app icon as the website wordmark;
- silently reviving rejected legacy branding.

The existing owner asset `EASY BRANDING.png` remains app/icon source only. The canonical source manifest explicitly prohibits treating it as the website wordmark.

## Toadal authority

Locked Toadal website assets include:

- portrait WebP: `b44601a13ec88ef529c17dad6be4bbabcfce8dc49a4e337a3a6af442056d5512`
- canonical victory PNG: `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`
- optimized victory WebP: `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb`

The contextual companion production sources and runtime derivatives are separately hash-locked.

## Princess Lily authority

The only website Princess Lily derivative remains:

- `asset.home.character.princess-lily`
- website file: `reference/assets/images/characters/princess-lily.webp`
- SHA-256: `3da9e9365230816f8cc07e0375549fd8e62651336f4c986dbf7beda77d1c8256`
- canonical source: `assets/images/characters/curated-highres/princess/lilly_idle_1f_512_2026-09-08.png`

The authority cross-checks the canonical source manifest and permanently denies the retired set:

- `walk_12f.png`
- `idle_blink_16f_256.png`
- `catch_open_10f.png`
- legacy `idle.png`

Those retired Princess Lily files are not present in the website reference asset tree and are forbidden from product source references.

## Other locked visual families

Character registry:
- Toadal
- Princess Lily
- Sweet Genie
- Fruity Genie
- Savoury Genie
- Gulper
- Gully

World:
- Candy Kingdom desktop
- Candy Kingdom mobile crop
- Forest Portal
- Candy-land Calm

Browser-game preview art:
- Wicked Bites v5.5 preview
- Claw / Feed Gulper v2.5.1 preview

The game preview images remain preview art. This lock does not authorize representing them as gameplay footage.

## Enforcement

Added:

`scripts/verify-visual-asset-authority.mjs`

The verifier checks:

1. every registered asset file exists;
2. every registered byte count matches;
3. every registered SHA-256 matches;
4. the complete 41-asset index matches the frozen authority snapshot;
5. all required brand/character/world/game asset IDs remain present;
6. Princess Lily still resolves to the approved September 2026 source;
7. the retired Lily deny list matches canonical source authority;
8. no retired Lily or `EASY BRANDING.png` reference enters product source;
9. retired Princess Lily files are physically absent from the website asset tree;
10. all 25 companion runtime derivatives exist with locked bytes/hashes;
11. no extra companion runtime derivative exists outside authority;
12. every one of the 66 website visual files belongs to the locked authority set;
13. every `/assets/images/...` and `/assets/brand/...` product reference resolves to an approved asset;
14. no unapproved logo/wordmark file can appear while wordmark status is pending;
15. the canonical crown remains wired into shared site CSS;
16. the external owner icon remains app/icon-only;
17. the character registry cannot point at unregistered visual assets.

## Qualification

Fresh results:

- Visual asset authority: **PASS**
  - 41 registered assets
  - 25 runtime derivatives
  - 66 / 66 visual files covered
  - 39 product visual references
  - brand files: `brand-crown.svg`
  - wordmark: `NOT_PRESENT_NOT_APPROVED`
- Integrated Node suite: **48/48 PASS**
- Home visual contract: **29/29 PASS**
- Character registry: **PASS**
- Manifest compliance: **PASS**

The owner-preview gate now includes `visual-asset-authority` as a first-class gate. On the current pre-render candidate it passes; the only source/static gate still failing in the skip-browser run is the already-known stale `dist/` render-freshness gate. That is expected to be resolved by the authoritative Studio render in the visual-convergence lane.

## Integration order

For a candidate that does not already contain these donor lanes, integrate in this order:

1. `990fd7044cdb4780bd0446ee5aad287753b8fe32` — non-Home truth closure
2. `7a649bdcc9f3f00526a06b716fbea2e5f3e63c67` — owner-preview QA gate
3. this visual-asset-authority commit

Then perform the authoritative Studio render and run the owner-preview gate.

## Deliberate non-work

This lane did **not**:
- invent a final wordmark;
- replace approved art for aesthetic experimentation;
- add new character lore;
- change Home composition;
- change game behavior;
- hand-edit generated `dist/`;
- deploy staging;
- touch `main` or production.

The visual asset authority task itself is closed.
