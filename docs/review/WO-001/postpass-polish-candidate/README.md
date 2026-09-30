# WO-001 Post-PASS Polish Candidate — 2026-09-30

Base branch: `work/WO-001-global-shell-home`  
Base commit: `3e82fcd6990b92166769475aed3beffbec5b71f1`  
Base disposition: **WO-001 PASS**  
Candidate branch: `quality/wo001-postpass-polish-20260930`

## Why this exists

The certified WO-001 Home is technically complete and safe. This candidate does **not** challenge that PASS.

A final visual review found a few places where the certified Home still reads like an internal staging build rather than a polished player-facing portal:

- visible phrases such as `WO-002`, `WO-005`, `staging cartridges`, `AUDIT REQUIRED`, `package audit`, `website QA`, and `app-store URLs`;
- a smaller/less expressive Toadal hero than the available canonical high-resolution victory artwork;
- repeated generic world art on browser-game cards despite source-qualified Wicked Bites and CLAW screenshots already being available;
- World and Stories/Media could use richer truthful environment art without inventing content.

The goal is to remove those remaining presentation seams while keeping every feature-state and safety boundary intact.

## Changes

### Player-facing copy

Internal implementation language is removed from visible Home copy.

Examples:
- browser games are described as previews being prepared rather than `staging cartridges`;
- Feast Pass says **later update / not live yet** rather than `WO-005`;
- TOADAL FEAST Arcade says **IN DEVELOPMENT** rather than `AUDIT REQUIRED`;
- App conversion says downloads are coming later rather than exposing internal URL/screenshot approval language.

Underlying feature-state attributes remain unchanged.

### Hero and App Toadal

The Home hero and App conversion now use the canonical high-resolution Toadal victory derivative:

- authority: `assets/images/characters/reactions-v1/toadal/victory.png`
- authority SHA-256: `8af7dfef69ffc8d0484845453ba462776376e4d1fc574459f2c8e9d1d138e026`
- derivative: `reference/assets/images/characters/toadal-victory.webp`
- derivative: 611×640 / 63,422 bytes
- derivative SHA-256: `2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb`

The certified Home layout is preserved; only the character source and bounded desktop maximum size change.

### Qualified browser-game card art

Wicked Bites and CLAW now use source-qualified gameplay screenshots instead of generic/repeated artwork.

**Wicked Bites**
- source repo: `Matthew75x/feast-crossing-wicked-bites`
- source commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- screenshot authority: `proof/V5_5_03_LANDSCAPE_844x390.png`
- source SHA-256: `c4fc02ec29a576275cf1474467116211f434400f54f6990f73f4afed1e9199b4`
- derivative SHA-256: `02468719f59c1f891a750435d261cf8aab1e42609cea3343e70fbd08b472c4d0`
- derivative bytes: 34,526

**CLAW: Feed Gulper**
- source repo: `Matthew75x/claw-feed-gulper`
- source commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- screenshot authority: `docs/browser-evidence/844x390-game.png`
- source SHA-256: `6579a55db36c81e1839ed151427e5a6c4e98c9d705abd2916f8fc54eb5d6bbe4`
- derivative SHA-256: `a2c11d58bc7c05ef0cfe7aea01c57c27ae71bfb86c99e590420c0045d5fbca4f`
- derivative bytes: 20,930

Both game records remain:
- `status: preview`
- `web.enabled: false`
- no Home launch/build URL

Artwork therefore does **not** imply playability.

### World + Stories/Media

Two existing game-world sources were converted to registered web derivatives:

**Forest Portal**
- authority SHA-256: `84a855f13c6241eb7efa3425cda93cbde983178db48df671f366f05d421f4f71`
- derivative SHA-256: `dd9de34d884c376ef67e4b7b9ce7809b4ab92ee9f2118a8242223f1f708e5980`

**Candyland Scenic**
- authority SHA-256: `a3e4105d6b5d7c5e2ceae49faaa8e10423b0d2c0b3f9e75a63a61fd3356dc15d`
- derivative SHA-256: `217403d6e20a2c22211ed8dfeff7f2b7b8a22acfd2404abe9689867bd0047a85`

World discovery now uses a three-image cluster. Stories/Media uses Forest Portal as an illustrated background while remaining explicitly **NOT PUBLISHED**.

No story, media, game, launch date, or product availability is fabricated.

## Repository-level verification

Candidate checks:

- Home visual/source contract: **34/34 PASS**
- Public-copy audit: **9/9 PASS**
- Post-pass polish verifier: **14/14 PASS**
- Navigation truth: **PASS**
- Pages/base-path tests: **8/8 PASS**
- Canonical game-source asset audit: **10/10 PASS**
- `git diff --check`: **PASS**

### CP9 donor

The old extracted ASSIGNATOR donor folder contains two stale extra files and therefore reports 236 files / 6,605,121 bytes.

The authoritative archive itself is correct. A fresh extraction from:

`C:\ASSIGNATOR\TOADAL_FEAST_V13_CHECKPOINT_IX_PUBLIC_POLISH (2).zip`

produced:

- **234 files**
- **6,422,416 bytes**

Running the current verifier against that fresh extraction gives:

- **17/17 PASS**
- zero failures

No donor/archive bytes were modified.

## Structural-preview witnesses

The candidate includes lightweight previews:

- `home-1600x900-structural-preview.webp`
- `home-390x844-structural-preview.webp`
- `home-1600x2600-structural-preview.webp`

These use the real candidate component graph, CSS, assets, symbols, and game records through a small local Studio-like renderer.

They show:
- the certified dense portal layout remains intact;
- hero Toadal is larger and more expressive;
- mobile hero remains readable with no horizontal overflow observed;
- qualified game screenshots improve visual variety;
- Feast Pass remains clearly planned;
- the companion remains compact;
- the richer World/Stories treatment does not pretend unpublished content exists.

These are **not** final Studio acceptance artifacts.

## Acceptance boundary

The certified `3e82fcd` build remains the safe accepted fallback.

Before this candidate replaces it, the authoritative closure lane should run one bounded re-certification only:

1. Studio 1.4.2 validation;
2. complete Studio test suite;
3. render/export/checkpoint;
4. six required viewport captures;
5. browser/accessibility/console/network QA;
6. visual comparison against the approved Home authority.

If those remain green, this candidate can supersede the existing WO-001 visual source.

No deployment, `main` merge, production DNS change, or WO-002 implementation is authorized by this branch.


## Synthetic six-viewport layout matrix

A pre-certification Chrome layout matrix was also run against the structural preview at the six required target sizes:

- 390×844
- 430×932
- 768×1024
- 1366×768
- 1600×900
- 1920×1080

Result:
- **6/6 with zero horizontal overflow**
- **6/6 with visible Toadal**
- game grid: 1 column at 390/430, 2 columns at 768, 4 columns on desktop
- mobile Menu behavior visible below 800px
- desktop hero height remained approximately 465–490px in this synthetic witness

Machine-readable evidence:
`synthetic-layout-matrix.json`

This matrix is an early CSS/layout guard only. It does not replace the certified Studio/browser viewport suite required before adopting the candidate.
