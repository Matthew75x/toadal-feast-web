# WO-002 browser-game card art candidates

Date: 2026-09-30  
Status: evidence/design prep only; these files are **not** wired into the current Home or Play runtime.

The current WO-001 Home deliberately uses conservative generic/canonical art for preview cards because game-specific web packages had not yet been requalified. The recovered CP9 source authorities now let us prepare better **truthful** visual candidates without making the games PUBLIC.

## Wicked Bites

Source authority:
- repo: `Matthew75x/feast-crossing-wicked-bites`
- commit: `6fff3c89605092ba5c5e122565cb98415c8ab5e5`
- screenshot: `proof/V5_5_03_LANDSCAPE_844x390.png`
- source SHA-256: `c4fc02ec29a576275cf1474467116211f434400f54f6990f73f4afed1e9199b4`

Prepared derivative:
- `wicked-bites-v5.5-landscape.webp`
- 844×390
- 34,526 bytes
- SHA-256 `02468719f59c1f891a750435d261cf8aab1e42609cea3343e70fbd08b472c4d0`

Visual note: this is genuine gameplay evidence from the exact qualified v5.5 donor. It includes game-specific historical character presentation and therefore should be treated as a **Wicked Bites screenshot**, not as current mascot/character-art authority. Do not let it redefine canonical Toadal or Princess Lily.

## CLAW: Feed Gulper

Source authority:
- repo: `Matthew75x/claw-feed-gulper`
- commit: `7c49d1bf70ebf6503fde3b533a1acd356d12c77c`
- screenshot: `docs/browser-evidence/844x390-game.png`
- source SHA-256: `6579a55db36c81e1839ed151427e5a6c4e98c9d705abd2916f8fc54eb5d6bbe4`

Prepared derivative:
- `claw-feed-gulper-v2.5.1-landscape.webp`
- 844×390
- 20,930 bytes
- SHA-256 `a2c11d58bc7c05ef0cfe7aea01c57c27ae71bfb86c99e590420c0045d5fbca4f`

Visual note: this is genuine CLAW gameplay evidence from the exact v2.5.1 donor and is substantially more truthful for a CLAW preview/detail card than the generic Gulper portrait alone.

## Usage rule

Do not wire either derivative into public runtime merely because it looks better.

After WO-002 current-environment requalification:
1. capture a fresh screenshot from the requalified cartridge when practical;
2. prefer that fresh screenshot for production;
3. use these donor derivatives as fallback/reference if the requalified build is byte-equivalent and no visual behavior changed;
4. keep the PREVIEW/PUBLIC state independent from the artwork;
5. never use card artwork as proof that a game is playable.

The goal is to replace generic repeated scenery with real, source-qualified game visuals **without lying about availability**.
