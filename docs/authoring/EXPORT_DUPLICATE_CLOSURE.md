# Generated export duplicate closure

The canonical Studio export has 138 files. Four tracked, legacy materialized files under `dist/assets/studio/` were no longer produced after native asset identity rendering. All 138 shared files were byte-identical to the Pages-adapted export; no export files were missing. A reachability audit found no references to these four materialized filenames in the canonical project or exported HTML/CSS/JS/JSON. Each is an exact duplicate of an approved canonical asset that remains in the export.

| Obsolete generated filename | SHA-256 | Retained canonical path |
| --- | --- | --- |
| `asset-home-game-claw-feed-gulper-preview.a2c11d58bc.webp` | `a2c11d58bc7c05ef0cfe7aea01c57c27ae71bfb86c99e590420c0045d5fbca4f` | `assets/images/games/claw-feed-gulper-v2.5.1-preview.webp` |
| `asset-home-game-froggy-fruity-bash-concept.4dd67ff42a.webp` | `4dd67ff42a1ec2dfdf727184f5e98e31aea36788c7f05853d6b281204a7b1f1c` | `assets/images/characters/candy-shooter-fruity-bash.webp` |
| `asset-home-game-wicked-bites-preview.02468719f5.webp` | `02468719f59c1f891a750435d261cf8aab1e42609cea3343e70fbd08b472c4d0` | `assets/images/games/wicked-bites-v5.5-preview.webp` |
| `asset-home-world-desktop.da8261fa30.webp` | `da8261fa30f6535f5288f52841dc2123d21a3251340e5d7888d576b7531809b4` | `assets/images/world/candy-kingdom.webp` |

The exact scoped status/diff, file sizes and hashes were printed before cleanup. Only these four obsolete generated duplicates were moved to the recoverable directory `D:/Codex-TOADAL-Owner-QA-8b9080b3491b414fadb09ccb022b838e/obsolete-generated-export-duplicates/`. Source assets, reference assets, cartridge files and manual content were not removed. The frozen reference worktree and Git baseline also retain the old copies. No broad reset/clean or manual HTML patch was used.
