// ============================================================
// ASSET_REGISTRY.js — Arcade sprite-frame catalog (subordinate authority)
// ============================================================
// SCOPE (EC-6): This file is NOT a general asset authority. It carries only
// the Arcade sprite pipeline per-character frame/anchor catalog, consumed
// exclusively via ASSET_REGISTRY.characters by:
//   - src/runtime/app/main-boot.js
//   - src/runtime/modes/arcade/arcade-sprite-runtime.js
//   - prod/sprite-renderer.js
// Canonical character identity/roster authority: src/runtime/shared/characters.js
// (CHARACTER_DATA). Sheet-key -> image binding authority: the active asset pack
// (prod/asset-pack-loader.js). Every character id in this catalog must exist in
// CHARACTER_DATA; enforced by scripts/test-ec6-media-ownership.js.

const ASSET_REGISTRY = {
  // ============================================================
  // CHARACTER ASSET REFERENCES
  // ============================================================
  characters: {
    gulper: {
      name: 'Gulper',
      species: 'pig',
      spriteSheet: 'characters',
      frames: {
        idle: 'gulper_idle',
        eating: 'gulper_eating',
        moving: 'gulper_moving',
      },
      colors: {
        body: '#ff88aa',
        belly: '#ffccdd',
        eye: '#333333',
      },
    },

    classic: {
      name: 'Classic Frog',
      species: 'frog',
      spriteSheet: 'classicFrogArcadeApproved',
      frames: {
        idle: 'classic_idle',
        eating: 'classic_mouth_open',
        moving: 'classic_move_right',
        tongueExtend: 'classic_tongue_pose',
        catchSuccess: 'classic_catch_success',
        hurt: 'classic_hurt',
        moveLeft: 'classic_move_left',
        moveRight: 'classic_move_right',
        blink: 'classic_blink',
      },
      anchor: { x: 64, y: 114 },
      mouthAnchor: { x: 64, y: 60 },
      gameplayRole: 'arcade-tongue-catcher',
      prototypeStatus: 'arcade-playable-v1',
      colors: {
        body: '#4cc94c',
        belly: '#a8eea8',
        eye: '#e8b800',
      },
    },

    fire: {
      name: 'Fire Frog',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'fire_idle',
        eating: 'fire_eating',
        moving: 'fire_moving',
      },
      colors: {
        body: '#ff7733',
        belly: '#ffcc88',
        eye: '#ff2200',
      },
    },

    ocean: {
      name: 'Ocean Frog',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'ocean_idle',
        eating: 'ocean_eating',
        moving: 'ocean_moving',
      },
      colors: {
        body: '#33aaff',
        belly: '#aaddff',
        eye: '#0044ff',
      },
    },

    royal: {
      name: 'Royal Frog',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'royal_idle',
        eating: 'royal_eating',
        moving: 'royal_moving',
        excited: 'royal_excited',
      },
      colors: {
        body: '#cc88ff',
        belly: '#eeccff',
        eye: '#ff44ff',
      },
    },

    ninja: {
      name: 'Ninja Frog',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'ninja_idle',
        eating: 'ninja_eating',
        moving: 'ninja_moving',
        jumping: 'ninja_jumping',
      },
      colors: {
        body: '#444444',
        belly: '#777777',
        eye: '#ff0000',
      },
    },

    golden: {
      name: 'Toadal (legacy Golden Frog asset)',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'golden_idle',
        eating: 'golden_eating',
        moving: 'golden_moving',
        gleaming: 'golden_gleaming',
      },
      colors: {
        body: '#ffd700',
        belly: '#fff3aa',
        eye: '#ff8800',
      },
    },

    hippo: {
      name: 'Hungry Hippo',
      species: 'hippo',
      spriteSheet: 'characters',
      frames: {
        idle: 'hippo_idle',
        eating: 'hippo_eating',
        lunging: 'hippo_lunging',
      },
      colors: {
        body: '#9c90b8',
        belly: '#d9d0ea',
        eye: '#1f1f1f',
      },
    },

    chameleon: {
      name: 'Chameleon',
      species: 'chameleon',
      spriteSheet: 'characters',
      frames: {
        mouth_closed: 'chameleon_closed',
        mouth_open: 'chameleon_open',
      },
      colors: {
        body: '#77d65b',
        belly: '#c8f3a7',
        eye: '#ff9a1f',
      },
    },

    pelican: {
      name: 'Seagull',
      species: 'seagull',
      spriteSheet: 'characters',
      frames: {
        idle: 'pelican_idle',
        flying: 'pelican_flying',
        diving: 'pelican_diving',
        landing: 'pelican_landing',
      },
      colors: {
        body: '#f4f4f0',
        belly: '#ffffff',
        eye: '#35506b',
      },
    },

    flytrap: {
      name: 'Venus Flytrap',
      species: 'flytrap',
      spriteSheet: 'characters',
      frames: {
        idle: 'flytrap_idle',
        eating: 'flytrap_eating',
        cloning: 'flytrap_cloning',
      },
      colors: {
        body: '#6fda73',
        belly: '#b8f1ad',
        eye: '#7a1030',
      },
    },

    count: {
      name: 'Count',
      species: 'vampire',
      spriteSheet: 'characters',
      frames: {
        idle: 'count_idle',
        feeding: 'count_feeding',
        moving: 'count_moving',
      },
      colors: {
        body: '#e8d5f0',
        belly: '#4a1a5a',
        eye: '#cc0000',
      },
    },

    bob: {
      name: 'Bob',
      species: 'human',
      spriteSheet: 'characters',
      frames: {
        idle: 'bob_idle',
        catching: 'bob_catching',
        walking: 'bob_walking',
        leaning: 'bob_leaning',
      },
      colors: {
        body: '#f4c17a',
        belly: '#f7d9a8',
        eye: '#3a6ea8',
      },
    },

    chomper: {
      name: 'Chomper',
      species: 'chomper',
      spriteSheet: 'characters',
      frames: {
        idle: 'chomper_idle',
        chomping: 'chomper_chomping',
        cooldown: 'chomper_cooldown',
      },
      colors: {
        body: '#e87c3e',
        belly: '#f5c49a',
        eye: '#ff2200',
      },
    },

    princess: {
      name: 'Princess Lily',
      species: 'frog',
      spriteSheet: 'characters',
      frames: {
        idle: 'princess_idle',
        happy: 'princess_happy',
        dreaming: 'princess_dreaming',
        sparkle: 'princess_sparkle',
      },
      colors: {
        body: '#ff88cc',
        belly: '#ffccee',
        eye: '#9933cc',
      },
    },
  },
};

// Export for both browser and Node environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ASSET_REGISTRY;
}
