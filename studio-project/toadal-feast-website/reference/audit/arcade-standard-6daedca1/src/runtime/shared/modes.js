// ============================================================
// src/runtime/shared/modes.js — ACHIEVEMENT_DATA and TWEAK_DEFAULTS
// Load order: 5th (after src/runtime/shared/shop.js)
// Creates globals: ACHIEVEMENT_DATA, TWEAK_DEFAULTS
// Consumes: CHARACTER_DATA (src/runtime/shared/characters.js, loaded earlier)
//           SaveManager (src/runtime/shared/systems.js, loaded AFTER — see note)
// NOTE: ACHIEVEMENT_DATA.check() callbacks reference SaveManager
//       and CHARACTER_DATA. SaveManager is declared in src/runtime/shared/systems.js
//       which loads AFTER modes.js. The callbacks are closures that
//       are only *called* at runtime (after all files are loaded),
//       so the forward reference to SaveManager is safe as long as
//       the callbacks are never invoked during file parse/load.
//       This matches the original data-2.js behaviour exactly.
// ============================================================

// ──────────────────────────────────────────────────────────
// ACHIEVEMENT_DATA
// check(score, level, stats, save) — all four args are passed
//   score : final score this run
//   level : final level this run
//   stats : SaveManager lifetime stats object (StatsTracker.getStats())
//   save  : full SaveManager.get() object
//
// unlocks : optional array of character ids granted on completion
//           (checked in ProgressionManager.checkAndClaimAchievements)
// ──────────────────────────────────────────────────────────
const ACHIEVEMENT_DATA = [

  // ── Starter ───────────────────────────────────────────
  {
    id: 'first_catch',
    icon: 'Badge', name: 'First Feast',
    req: 'Catch your very first food item.',
    check: (s,l,st) => (st && st.totalFoodCaught >= 1) || s >= 10,
  },

  // ── Score milestones ──────────────────────────────────
  {
    id: 'score500',
    icon: 'Badge', name: 'Star Player',
    req: 'Score 500 points in a single game.',
    check: (s) => s >= 500,
  },
  {
    id: 'score1000',
    icon: 'Badge', name: 'Super Muncher',
    req: 'Score 1,000 points in a single game.',
    check: (s) => s >= 1000,
  },
  {
    id: 'score2500',
    icon: 'Badge', name: 'Legendary Eater',
    req: 'Score 2,500 points in a single game.',
    check: (s) => s >= 2500,
  },
  {
    id: 'score5000',
    icon: 'Badge', name: 'Apex Predator',
    req: 'Score 5,000 points in a single game.',
    check: (s) => s >= 5000,
  },

  // ── Level milestones ──────────────────────────────────
  {
    id: 'level5',
    icon: 'Badge', name: 'Getting Serious',
    req: 'Reach level 5 in a single game.',
    check: (s,l) => l >= 5,
  },
  {
    id: 'level10',
    icon: 'Badge', name: 'Depth Diver',
    req: 'Reach level 10 in a single game.',
    check: (s,l) => l >= 10,
    unlocks: ['bob'],
  },
  {
    id: 'level15',
    icon: 'Badge', name: 'Peak Feeder',
    req: 'Reach level 15 in a single game.',
    check: (s,l) => l >= 15,
  },

  // ── Streak / combo ────────────────────────────────────
  {
    id: 'streak10',
    icon: 'Badge', name: 'On Fire',
    req: 'Catch 10 foods in a row without missing.',
    check: (s,l,st) => st && st.longestComboEver >= 10,
  },
  {
    id: 'streak20',
    icon: 'Badge', name: 'Unstoppable',
    req: 'Catch 20 foods in a row without missing.',
    check: (s,l,st) => st && st.longestComboEver >= 20,
    unlocks: ['pelican'],
  },
  {
    id: 'streak35',
    icon: 'Badge', name: 'Lightning Reflexes',
    req: 'Catch 35 foods in a row without missing.',
    check: (s,l,st) => st && st.longestComboEver >= 35,
  },

  // ── Lives / survival ──────────────────────────────────
  {
    id: 'max_lives_10',
    icon: 'Badge', name: 'Immortal',
    req: 'Reach 10 lives at the same time.',
    check: (s,l,st,sv) => sv && (sv._peakLives || 0) >= 10,
    unlocks: ['count'],
  },
  {
    id: 'no_miss_level5',
    icon: 'Badge', name: 'Flawless Appetite',
    req: 'Reach level 5 without missing a single food.',
    check: (s,l,st,sv) => l >= 5 && sv && (sv._runMisses || 0) === 0,
  },
  {
    id: 'survive_5bombs',
    icon: 'Badge', name: 'Bomb Survivor',
    req: 'Survive catching 5 bombs in a single game (shields don\'t count).',
    check: (s,l,st,sv) => sv && (sv._runBombsWithoutDying || 0) >= 5,
  },

  // ── Hazard interactions ───────────────────────────────
  {
    id: 'eat_fire_hazards',
    icon: 'Badge', name: 'Playing With Fire',
    req: 'Intentionally catch 3 fire hazards across all your games.',
    check: (s,l,st,sv) => sv && (sv._lifetimeFireCaught || 0) >= 3,
    unlocks: ['fire'],
  },
  {
    id: 'eat_bombs_10',
    icon: 'Badge', name: 'Bomb Connoisseur',
    req: 'Catch 10 bombs total across all your games.',
    check: (s,l,st) => st && st.totalBombsHit >= 10,
  },

  // ── Hearts ────────────────────────────────────────────
  {
    id: 'hearts_25',
    icon: 'Badge', name: 'Warm Heart',
    req: 'Catch 25 hearts across all your games.',
    check: (s,l,st) => st && st.totalHeartsCaught >= 25,
  },
  {
    id: 'hearts_100',
    icon: 'Badge', name: 'Heart Hoarder',
    req: 'Catch 100 hearts across all your games.',
    check: (s,l,st) => st && st.totalHeartsCaught >= 100,
  },

  // ── Lifetime food ─────────────────────────────────────
  {
    id: 'food_100',
    icon: 'Badge', name: 'Good Appetite',
    req: 'Catch 100 food items across all your games.',
    check: (s,l,st) => st && st.totalFoodCaught >= 100,
  },
  {
    id: 'food_500',
    icon: 'Badge', name: 'Bottomless Pit',
    req: 'Catch 500 food items across all your games.',
    check: (s,l,st) => st && st.totalFoodCaught >= 500,
    unlocks: ['gulper'],
  },
  {
    id: 'food_2000',
    icon: 'Badge', name: 'World Consumer',
    req: 'Catch 2,000 food items across all your games.',
    check: (s,l,st) => st && st.totalFoodCaught >= 2000,
  },

  // ── Games played ──────────────────────────────────────
  {
    id: 'games_10',
    icon: 'Badge', name: 'Dedicated Diner',
    req: 'Play 10 games.',
    check: (s,l,st) => st && st.totalGamesPlayed >= 10,
  },
  {
    id: 'games_50',
    icon: 'Badge', name: 'Seasoned Glutton',
    req: 'Play 50 games.',
    check: (s,l,st) => st && st.totalGamesPlayed >= 50,
  },

  // ── Character-specific ────────────────────────────────
  {
    id: 'golden_score',
    icon: 'Badge', name: 'Gilded Tongue',
    req: 'Legacy Golden Frog identity is retired; canonical mascot identity is Toadal.',
    retired: true,
    releaseState: 'disabled-polish',
    check: () => false,
  },
  {
    id: 'ninja_level10',
    icon: 'Badge', name: 'Shadow Master',
    req: 'Post-launch Ninja Frog challenge.',
    retired: true,
    releaseState: 'post-launch',
    check: () => false,
  },
  {
    id: 'royal_streak15',
    icon: 'Badge', name: 'Royal Flush',
    req: 'Build a 15-catch streak as Royal Frog in a single game.',
    // NOTE: same issue — Royal Frog must already be owned to set
    // selectedChar:'royal', so unlocks:['royal'] was a no-op. Removed.
    check: (s,l,st,sv) => st && st.longestComboEver >= 15 && sv && sv.selectedChar === 'royal',
  },
  {
    id: 'chameleon_reach',
    icon: 'Badge', name: 'Long Shot',
    req: 'Shelved Chameleon-era challenge retained only for save/history compatibility.',
    retired: true,
    releaseState: 'shelved-polish',
    check: () => false,
  },
  {
    id: 'chomper_chain',
    icon: 'Badge', name: 'Rapid Bite',
    req: 'Reach level 8 with Gulper — because you already know how to eat.',
    check: (s,l,st,sv) => l >= 8 && sv && sv.selectedChar === 'gulper',
    unlocks: ['chomper'],
  },
  {
    id: 'hippo_lunge',
    icon: 'Badge', name: 'Heavy Hitter',
    req: 'Score 2,000 points in a single Arcade game.',
    check: (s) => s >= 2000,
  },
  {
    id: 'flytrap_clone',
    icon: 'Badge', name: 'Two Mouths',
    req: 'Score 4,000 points in a single game.',
    check: (s) => s >= 4000,
    unlocks: ['flytrap'],
  },

  // ── Puzzle Mode ────────────────────────────────────────
  {
    id: 'puzzle_first_clear',
    icon: 'Badge', name: 'First Leap',
    req: 'Complete any Puzzle Mode level.',
    check: (s,l,st,sv) => Object.values((sv && sv.puzzleProgress && sv.puzzleProgress.levelStars) || {}).some(stars => stars >= 1),
  },
  {
    id: 'puzzle_perfect_clear',
    icon: 'Badge', name: 'No Splash',
    req: 'Complete a Puzzle Mode level without losing a red heart.',
    check: (s,l,st,sv) => Object.values((sv && sv.puzzleProgress && sv.puzzleProgress.levelStars) || {}).some(stars => stars >= 3),
  },
  {
    id: 'puzzle_world_clear',
    icon: 'Badge', name: 'Puzzle Pond Cleared',
    req: 'Complete the original 20 Puzzle Mode campaign levels.',
    check: (s,l,st,sv) => ['p001','p002','p003','p004','p005','p006','p007','p008','p009','p010','p011','p012','p013','p014','p015','p016','p017','p018','p019','p020'].every(id => ((sv && sv.puzzleProgress && sv.puzzleProgress.levelStars) || {})[id] >= 1),
  },
  {
    id: 'puzzle_echo_marsh_clear',
    icon: 'Badge', name: 'Echo Marsh Cleared',
    req: 'Complete all 20 Echo Marsh Puzzle levels.',
    check: (s,l,st,sv) => Array.from({ length: 20 }, (_, index) => `p${String(index + 21).padStart(3, '0')}`).every(id => ((sv && sv.puzzleProgress && sv.puzzleProgress.levelStars) || {})[id] >= 1),
  },

  // ── Collector ─────────────────────────────────────────
  {
    id: 'allchars',
    icon: 'Badge', name: 'Full Roster',
    req: 'Unlock every character.',
    check: (s,l,st,sv) => {
      if (!sv || !Array.isArray(sv.unlockedChars)) return false;
      const roster = typeof getPlayerSelectableCharacters === 'function'
        ? getPlayerSelectableCharacters()
        : [];
      return roster.every(character => (character.coinCost || 0) === 0 || sv.unlockedChars.includes(character.id));
    },
  },
];

const TWEAK_DEFAULTS = {
  invincible:           false,
  showHitboxes:         false,
  showFoodRadius:       false,
  showTouchZone:        false,
  showLiveStats:        false,
  showGameClock:        false,
  gameSpeedMult:        1,
  showLiveTweak:        false,
  spawnPatternOverride: 'auto',
  modelScale:           1.0,
  foodSpeedBase:        130,
  foodSpeedRand:        80,
  spawnIntervalBase:    1.6,
  foodSpawnRateMult:    ARCADE_TUNING_DEFAULTS.foodSpawnRateMult,
  maxConcurrentFood:    ARCADE_TUNING_DEFAULTS.maxConcurrentFood,
  fallSpeedMult:        ARCADE_TUNING_DEFAULTS.fallSpeedMult,
  bombChance:           0.10,
  bombRateMult:         ARCADE_TUNING_DEFAULTS.bombRateMult,
  bombStartLevel:       ARCADE_TUNING_DEFAULTS.bombStartLevel,
  bombChanceInc:        ARCADE_TUNING_DEFAULTS.bombChanceInc,
  bombChanceCap:        ARCADE_TUNING_DEFAULTS.bombChanceCap,
  maxConcurrentBombs:   ARCADE_TUNING_DEFAULTS.maxConcurrentBombs,
  doubleChance:         0.55,
  tripleChance:         0.20,
  heartSpawnScore:      150,
  frogSpeed:            520,
  scorePerLevel:        200,
  basePointsPerLevel:   10,
  speedMultInc:         0.084,
  spawnIntervalDec:     0.12,
  spawnIntervalMin:     0.55,
  streakTier:           3,
  streakBonusMax:       3,
  blueHeartChance:      0.015,
  redHeartBonus:        0,
  blueHeartEvery:       2,
  powerUpChance:        0.018,
  powerUpMinLevel:      2,
  showMobileControls:   false,
  mobileDifficulty:     true,
  mobileFoodSpawnRateMult: ARCADE_TUNING_DEFAULTS.mobileFoodSpawnRateMult,
  mobileMaxConcurrentFood: ARCADE_TUNING_DEFAULTS.mobileMaxConcurrentFood,
  mobileReachabilityMaxJumpRatio: ARCADE_TUNING_DEFAULTS.mobileReachabilityMaxJumpRatio,
  spawnItemOverride:    'none',
  zenFoodSpeedMult:     0.58,
  zenSpawnIntervalMult: 1.60,
};
