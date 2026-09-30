// ═══════════════════════════════════════════════════════════
// BALANCE.JS — All tuning numbers, constants, config
// Loads 1st — Provides safe global scope constants
// ═══════════════════════════════════════════════════════════

const CONFIG = {
  CANVAS_W: 480,
  CANVAS_H: 800,

  // Food item dimensions (used for spawn X clamping, hitbox drawing, fall-off detection)
  FOOD_W: 36,
  FOOD_H: 36,

  // Frog / character dimensions (used for movement clamping and tongue origin)
  FROG_W: 48,
  FROG_H: 48,

  // Movement speed baseline — overwritten by applyTweaks() via TWEAK.frogSpeed
  FROG_SPEED: 520,

  // Tongue physics
  TONGUE_SPEED: 680,   // px/s the tongue tip travels (extended by fastTongue bonus)
  TONGUE_MAX:   320,   // max upward reach from tongue origin (px)
};

const GAME_MODES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DEAD: 'dead'
};

// Owner-facing Arcade balance levers. These are deliberately few, independent,
// and mirrored into the development Live Tweak panel. Change these defaults when
// a playtest decision should become permanent; use Live Tweak for temporary tuning.
// A value of 0 for a concurrency cap means "unlimited / legacy behavior".
const ARCADE_TUNING_DEFAULTS = Object.freeze({
  foodSpawnRateMult: 1.00,          // >1 = more frequent drops; <1 = more breathing room
  maxConcurrentFood: 0,             // regular collectible food only; 0 = unlimited
  fallSpeedMult: 1.00,              // standard/relative food + hazard fall speed
  bombRateMult: 1.00,               // independent hazard/bomb frequency multiplier
  bombStartLevel: 1,                // first Arcade level where normal hazards may roll
  bombChanceInc: 0.005,             // hazard chance added per level
  bombChanceCap: 0.35,              // final probability ceiling after multiplier
  maxConcurrentBombs: 0,            // 0 = unlimited
  mobileFoodSpawnRateMult: 0.90,    // touch comfort: density only; speed/bombs stay unchanged
  mobileMaxConcurrentFood: 0,       // optional touch-only cap; 0 = inherit/unlimited
  mobileReachabilityMaxJumpRatio: 0.80, // lightweight protection for extreme random left/right jumps
});

const GAME_BALANCE = {
  arcadeTuning: { ...ARCADE_TUNING_DEFAULTS },
  // Emergency visual rollback. Setting enabled=false leaves gameplay and
  // character IDs intact while routing all characters through the existing
  // approved same-character portrait/generic sprite routes. This is intentionally a source-level
  // release switch, not a player-facing setting.
  arcadeAnimationRuntime: Object.freeze({ enabled: true }),

  // Visual-only Arcade presentation normalization. These values never alter
  // gameplay collision, movement, tongue reach, spawn timing, or scoring.
  // Character art is scaled around the gameplay baseline (frog.y), preserving
  // grounded placement while freeing more vertical playfield. Food is enlarged
  // only at draw time; its existing 36x36 gameplay geometry remains authoritative.
  arcadePresentation: Object.freeze({
    characterBaseScale: 0.88,
    foodVisualScale: 1.30,
    characterSizeClassMultipliers: Object.freeze({
      standard: 1.00,
      large: 1.08,
      compact: 0.92,
      special: 1.00,
    }),
  }),
  spawn: { 
    doubleChance: 0.55, 
    tripleChance: 0.20, 
    foodSpeedBase: 130, 
    foodSpeedRand: 80, 
    missPenaltyEnabled: true, 
    blueHeartChance: 0.015, 
    redHeartBonus: 0, 
    blueHeartEvery: 2, 
    rareFoodChance: 0.008,
    powerUpChance: 0.018, 
    powerUpMinLevel: 2 
  },
  level: { 
    scorePerLevel: 200, 
    heartSpawnScore: 215 
  },
  scoring: { 
    basePointsPerLevel: 10, 
    missPenaltyLives: 1, 
    bombCatchPenaltyLives: 1 
  },
  lives: { 
    defaultStart: 3, 
    defaultMax: 8, 
    heartHealAmount: 1, 
    absoluteMax: 15 
  },
  royal: { 
    // NOTE: belly speed-penalty cap is NOT read from here — it's
    // charDef.stats.bellySpeedPenaltyMax in src/runtime/shared/characters.js (currently 120).
    // This file used to also define `bellyPenaltyMax: 180`, an unused/
    // never-read duplicate with a different value than the real one —
    // removed to avoid the two drifting further out of sync.
    bellySpeedFloor: 200, 
    streakTier: 3, 
    multiplierMax: 3 
  },
  pelican: {
    diveSpeed: 480,
    climbSpeed: 260,
    comboMultMax: 3.0,
    comboStep: 0.10,
    // Gully uses a character-specific velocity controller. These values are
    // gameplay tuning only; sprite playback is owned by ArcadeAnimationClock.
    flight: Object.freeze({
      groundY: CONFIG.CANVAS_H - 80,
      floorY: CONFIG.CANVAS_H - 88,
      spawnY: CONFIG.CANVAS_H - 170,
      ceilingY: 65,
      horizontalMaxSpeedMult: 0.82,
      horizontalMinMaxSpeed: 120,
      horizontalAcceleration: 6.2,
      horizontalReleaseDrag: 4.1,
      horizontalGroundDrag: 6.8,
      verticalAcceleration: 6.4,
      verticalReleaseDrag: 4.4,
      takeoffImpulse: 220,
      landingSpeedThreshold: 20,
      facingVelocityThreshold: 20,
      turnCrossfadeSeconds: 0.11,
      bankMaxRadians: 0.18,
      bankSmoothing: 7.0,
      touchImpulsePerPixel: 18,
    }),
  },
  tc: { 
    spawnIntervalBase: 0.70, 
    spawnIntervalMin: 0.32, 
    speedMultBase: 1.5, 
    missPenaltyEnabled: false,
    syringeChance: 0.01, 
    syringeSpeed: 80, 
    sizeMin: 0.35, 
    sizeMax: 2.5,
    doubleChance: 0.75 
  },
  count: {
    heartStreamChance: 0.20,
    bonusHeartChance: 0.18,
    heartCap: 12,
    heartPoints: 100,
    maxLives: 20
  },
  bob: {
    basketMax: 5,
    carrySlowMax: 120,
    chestTriggerDist: 60
  },
  zen: {
    foodSpeedMult:     0.58,
    spawnIntervalMult: 1.60,
    totalCatches:      900,
    rooms:             5,
    roomCatchThreshold:180,
    roomTiers: [
      { label:'Courtyard',   toast:'The courtyard is clear!',    glowColor:'#a8f7a0' },
      { label:'Great Hall',  toast:'The great hall glows again!', glowColor:'#ffd700' },
      { label:'Tower',       toast:'The tower blooms!',           glowColor:'#ff88cc' },
      { label:'Throne Room', toast:'The throne room shimmers!',   glowColor:'#cc88ff' },
      { label:'Castle Peak', toast:'The kingdom is revealed!',    glowColor:'#fff7cc' },
    ],
    basePoints:  5,
    startLives:  10,
    maxLives:    10,
  },
  // Progressive mode unlocks — score thresholds for alternative game modes.
  // Standard is always available. FMF unlocks at 600 pts best score (2–4 solid
  // runs). TC unlocks at 1500 pts (meaningful progression milestone).
  modeUnlocks: {
    fmf: 600,
    tc:  1500,
    zen: 0,
  }
};

// Arcade food is keyed by immutable `food.<slug>` IDs.  The IDs are
// gameplay-facing and never depend on a filename, display name, or theme.
// Runtime image paths are deliberately omitted until final approved art is
// promoted; the renderer uses a polished vector fallback in the meantime.
const ARCADE_FOOD_DEFINITIONS = Object.freeze([
  { itemId:'food.apple',       label:'Apple',       assetKey:'food_apple',       visualKind:'apple',       category:'fruit' },
  { itemId:'food.banana',      label:'Banana',      assetKey:'food_banana',      visualKind:'banana',      category:'fruit' },
  { itemId:'food.pear',        label:'Pear',        assetKey:'food_pear',        visualKind:'pear',        category:'fruit' },
  { itemId:'food.orange',      label:'Orange',      assetKey:'food_orange',      visualKind:'orange',      category:'fruit' },
  { itemId:'food.lemon',       label:'Lemon',       assetKey:'food_lemon',       visualKind:'lemon',       category:'fruit' },
  { itemId:'food.watermelon',  label:'Watermelon',  assetKey:'food_watermelon',  visualKind:'watermelon',  category:'fruit', runtimeActive:false, blockReason:'owner-removed-duplicate', replacementItemId:'food.watermelon-slice' },
  { itemId:'food.strawberry',  label:'Strawberry',  assetKey:'food_strawberry',  visualKind:'strawberry',  category:'fruit' },
  { itemId:'food.grapes',      label:'Grapes',      assetKey:'food_grapes',      visualKind:'grapes',      category:'fruit' },
  { itemId:'food.cherry',      label:'Cherry',      assetKey:'food_cherry',      visualKind:'cherry',      category:'fruit' },
  { itemId:'food.pineapple',   label:'Pineapple',   assetKey:'food_pineapple',   visualKind:'pineapple',   category:'fruit' },
  { itemId:'food.kiwi',        label:'Kiwi',        assetKey:'food_kiwi',        visualKind:'kiwi',        category:'fruit' },
  { itemId:'food.mango',       label:'Mango',       assetKey:'food_mango',       visualKind:'mango',       category:'fruit' },
  { itemId:'food.blueberry',   label:'Blueberry',   assetKey:'food_blueberry',   visualKind:'blueberry',   category:'fruit' },
  { itemId:'food.coconut',     label:'Coconut',     assetKey:'food_coconut',     visualKind:'coconut',     category:'fruit' },
  { itemId:'food.pizza',       label:'Pizza',       assetKey:'food_pizza',       visualKind:'pizza',       category:'meal' },
  { itemId:'food.burger',      label:'Burger',      assetKey:'food_burger',      visualKind:'burger',      category:'meal' },
  { itemId:'food.fries',       label:'Fries',       assetKey:'food_fries',       visualKind:'fries',       category:'meal' },
  { itemId:'food.fried-chicken',label:'Fried Chicken',assetKey:'food_chicken',   visualKind:'chicken',     category:'meal' },
  { itemId:'food.steak',       label:'Steak',       assetKey:'food_meat',        visualKind:'steak',       category:'meal' },
  { itemId:'food.cheese',      label:'Cheese',      assetKey:'food_cheese',      visualKind:'cheese',      category:'meal' },
  { itemId:'food.pretzel',     label:'Pretzel',     assetKey:'food_pretzel',     visualKind:'pretzel',     category:'snack' },
  { itemId:'food.pancake',     label:'Pancakes',    assetKey:'food_pancakes',    visualKind:'pancakes',    category:'breakfast', runtimeActive:false, blockReason:'missing-exact-approved-art' },
  { itemId:'food.waffle',      label:'Waffle',      assetKey:'food_waffle',      visualKind:'waffle',      category:'breakfast', runtimeActive:false, blockReason:'missing-exact-approved-art' },
  { itemId:'food.sushi-roll',  label:'Rice Roll Cluster', assetKey:'food_riceball', visualKind:'riceball', category:'meal', runtimeActive:false, blockReason:'owner-removed-four-roll-cluster', replacementItemId:'food.maki-roll' },
  { itemId:'food.sushi',       label:'Sushi',       assetKey:'food_sushi',       visualKind:'sushi',       category:'meal', runtimeActive:false, blockReason:'owner-removed-duplicate', replacementItemId:'food.maki-roll' },
  { itemId:'food.udon',        label:'Noodles',     assetKey:'food_noodles',     visualKind:'noodles',     category:'meal', runtimeActive:false, blockReason:'owner-removed-quality' },
  { itemId:'food.carrot',      label:'Carrot',      assetKey:'food_carrot',      visualKind:'carrot',      category:'veg' },
  { itemId:'food.corn',        label:'Corn',        assetKey:'food_corn',        visualKind:'corn',        category:'veg', runtimeActive:false, blockReason:'owner-replaced-by-candy-corn', replacementItemId:'food.candy-corn' },
  { itemId:'food.candy-corn',  label:'Candy Corn',  assetKey:'food_candycorn',  visualKind:'candy-corn',  category:'candy', effect:'sugar', affinities:['princess','count'] },
  { itemId:'food.avocado',     label:'Avocado',     assetKey:'food_avocado',     visualKind:'avocado',     category:'veg' },
  { itemId:'food.broccoli',    label:'Broccoli',    assetKey:'food_broccoli',    visualKind:'broccoli',    category:'veg' },
  { itemId:'food.tomato',      label:'Tomato',      assetKey:'food_tomato',      visualKind:'tomato',      category:'veg' },
  { itemId:'food.potato',      label:'Potato',      assetKey:'food_potato',      visualKind:'potato',      category:'veg' },
  { itemId:'food.donut',       label:'Donut',       assetKey:'food_donut',       visualKind:'donut',       category:'dessert' },
  { itemId:'food.cookie',      label:'Cookie',      assetKey:'food_cookie',      visualKind:'cookie',      category:'dessert' },
  { itemId:'food.ice-cream-cone', label:'Ice Cream',assetKey:'food_icecream',   visualKind:'icecream',    category:'dessert' },
  { itemId:'food.red-velvet-cake',label:'Cake',     assetKey:'food_cake',        visualKind:'cake',        category:'dessert' },
  { itemId:'food.cupcake',     label:'Cupcake',     assetKey:'food_cupcake',     visualKind:'cupcake',     category:'dessert' },
  { itemId:'food.chocolate',   label:'Chocolate',   assetKey:'food_chocolate',   visualKind:'chocolate',   category:'dessert' },
  { itemId:'food.hard-candy',  label:'Candy',       assetKey:'food_candy',       visualKind:'candy',       category:'dessert' },
  { itemId:'food.gummy-bear',  label:'Gummy Bear',  assetKey:'food_gummy_bear',  visualKind:'gummy-bear',  category:'candy',     effect:'sugar',  affinities:['princess'] },
  { itemId:'food.lollipop',    label:'Lollipop',    assetKey:'food_lollipop',    visualKind:'lollipop',    category:'candy',     effect:'sugar',  affinities:['princess'] },
  { itemId:'food.macaron',     label:'Macaron',     assetKey:'food_macaron',     visualKind:'macaron',     category:'dessert',   effect:'crumb',  affinities:['princess','royal'] },
  { itemId:'food.salmon-nigiri',label:'Salmon Nigiri',assetKey:'food_salmon_nigiri',visualKind:'salmon-nigiri',category:'sushi', effect:'rice', affinities:['ninja','ocean'] },
  { itemId:'food.shrimp-nigiri',label:'Shrimp Nigiri',assetKey:'food_shrimp_nigiri',visualKind:'shrimp-nigiri',category:'sushi', effect:'rice', affinities:['ninja','ocean'] },
  { itemId:'food.maki-roll',   label:'Maki Roll',   assetKey:'food_maki_roll',   visualKind:'maki-roll',   category:'sushi',     effect:'rice',   affinities:['ninja'] },
  { itemId:'food.ramen',       label:'Ramen',       assetKey:'food_ramen',       visualKind:'ramen',       category:'meal',      effect:'savory', affinities:['ninja','fire'] },
  { itemId:'food.curry',       label:'Curry',       assetKey:'food_curry',       visualKind:'curry',       category:'meal',      effect:'savory', affinities:['ninja','fire'] },
  { itemId:'food.chili-pepper',label:'Chili Pepper',assetKey:'food_chili_pepper',visualKind:'chili-pepper',category:'veg',       effect:'juice',  affinities:['fire'] },
  { itemId:'food.marshmallow', label:'Marshmallow', assetKey:'food_marshmallow', visualKind:'marshmallow', category:'candy',     effect:'sugar',  affinities:['princess','fire'] },
  { itemId:'food.mochi',       label:'Mochi',       assetKey:'food_mochi',       visualKind:'mochi',       category:'dessert',   effect:'sugar',  affinities:['ninja','princess'] },
  { itemId:'food.brownie',     label:'Brownie',     assetKey:'food_brownie',     visualKind:'brownie',     category:'dessert',   effect:'crumb',  affinities:['princess','chomper'] },
  { itemId:'food.cheesecake',  label:'Cheesecake',  assetKey:'food_cheesecake',  visualKind:'cheesecake',  category:'dessert',   effect:'crumb',  affinities:['princess','royal'] },
  { itemId:'food.taco',        label:'Taco',        assetKey:'food_taco',        visualKind:'taco',        category:'fast-food', effect:'savory', affinities:['chomper','fire'] },
  { itemId:'food.hot-dog',     label:'Hot Dog',     assetKey:'food_hot_dog',     visualKind:'hot-dog',     category:'fast-food', effect:'savory', affinities:['chomper'] },
  { itemId:'food.chicken-nuggets',label:'Chicken Nuggets',assetKey:'food_chicken_nuggets',visualKind:'chicken-nuggets',category:'fast-food',effect:'crumb',affinities:['chomper'] },
  { itemId:'food.onion-rings', label:'Onion Rings', assetKey:'food_onion_rings', visualKind:'onion-rings', category:'fast-food', effect:'crumb',  affinities:['chomper'] },
  { itemId:'food.nachos',      label:'Nachos',      assetKey:'food_nachos',      visualKind:'nachos',      category:'fast-food', effect:'savory', affinities:['chomper','fire'] },
  { itemId:'food.whole-fish',  label:'Whole Fish',  assetKey:'food_whole_fish',  visualKind:'whole-fish',  category:'seafood',   effect:'savory', affinities:['ocean','pelican'] },
  { itemId:'food.fruit-bowl',  label:'Fruit Bowl',  assetKey:'food_fruit_bowl',  visualKind:'fruit-bowl',  category:'fruit',     effect:'juice',  affinities:['hippo','classic'] },
  { itemId:'food.watermelon-slice',label:'Watermelon Slice',assetKey:'food_watermelon_slice',visualKind:'watermelon-slice',category:'fruit',effect:'juice',affinities:['hippo'] },
  { itemId:'food.cinnamon-roll',label:'Cinnamon Roll',assetKey:'food_cinnamon_roll',visualKind:'cinnamon-roll',category:'dessert',effect:'crumb',affinities:['princess'] },
  { itemId:'food.milkshake',   label:'Milkshake',   assetKey:'food_milkshake',   visualKind:'milkshake',   category:'drink',     effect:'sugar',  affinities:['chomper','princess'] },
  { itemId:'food.cotton-candy',label:'Cotton Candy',assetKey:'food_cotton_candy',visualKind:'cotton-candy',category:'candy',     effect:'sugar',  affinities:['princess'] },
  { itemId:'food.peach',       label:'Peach',       assetKey:'food_peach',       visualKind:'peach',       category:'fruit',     effect:'juice',  affinities:['hippo'] },
  { itemId:'food.raspberry',   label:'Raspberry',   assetKey:'food_raspberry',   visualKind:'raspberry',   category:'fruit',     effect:'juice',  affinities:['count'] },
  { itemId:'food.dragon-fruit',label:'Dragon Fruit',assetKey:'food_dragon_fruit',visualKind:'dragon-fruit',category:'fruit',     effect:'juice',  affinities:['ocean','princess'] },
  { itemId:'food.golden-apple',label:'Golden Apple',assetKey:'food_golden_apple',visualKind:'golden-apple',category:'premium',    effect:'premium',affinities:['golden'], rare:true },
  { itemId:'food.jelly-beans', label:'Jelly Beans', assetKey:'food_jelly_beans', visualKind:'jelly-beans', category:'candy',     effect:'sugar',  affinities:['princess'] },
  { itemId:'food.jewel-candy', label:'Jewel Candy', assetKey:'food_jewel_candy', visualKind:'jewel-candy', category:'premium',   effect:'premium',affinities:['royal'], rare:true },
]);

const ARCADE_FOOD_IDS = Object.freeze(ARCADE_FOOD_DEFINITIONS.filter(food => food.runtimeActive !== false).map(food => food.itemId));
const ARCADE_FOOD_BY_ID = Object.freeze(Object.fromEntries(ARCADE_FOOD_DEFINITIONS.map(food => [food.itemId, food])));

// One authoritative favourite-food vocabulary serves spawning, scoring and
// player feedback. Explicit per-food affinities refine these broad profiles;
// they do not replace the readable category themes players learn in a run.
const ARCADE_CHARACTER_FAVOURITE_PROFILES = Object.freeze({
  classic: Object.freeze({ label:'Fruit Bloom', itemIds:Object.freeze([]), categories:Object.freeze(['fruit']) }),
  fire: Object.freeze({ label:'Hot Plate Rush', itemIds:Object.freeze(['food.pizza','food.burger','food.fries','food.fried-chicken','food.steak','food.chili-pepper','food.ramen','food.curry']), categories:Object.freeze(['meal']) }),
  ocean: Object.freeze({ label:'Tropical Tide', itemIds:Object.freeze(['food.coconut','food.pineapple','food.mango','food.watermelon-slice','food.whole-fish','food.salmon-nigiri','food.shrimp-nigiri','food.dragon-fruit']), categories:Object.freeze(['fruit','seafood']) }),
  royal: Object.freeze({ label:'Royal Dessert Parade', itemIds:Object.freeze(['food.jewel-candy']), categories:Object.freeze(['dessert']) }),
  ninja: Object.freeze({ label:'Sushi Current', itemIds:Object.freeze(['food.maki-roll','food.salmon-nigiri','food.shrimp-nigiri','food.ramen','food.curry','food.mochi']), categories:Object.freeze(['sushi']) }),
  golden: Object.freeze({ label:'Golden Treat Rush', itemIds:Object.freeze(['food.golden-apple','food.donut','food.cupcake']), categories:Object.freeze(['dessert','breakfast']) }),
  princess: Object.freeze({ label:'Candy Drizzle', itemIds:Object.freeze(['food.hard-candy','food.chocolate','food.donut','food.cookie','food.cupcake','food.gummy-bear','food.lollipop','food.macaron','food.marshmallow','food.mochi','food.cinnamon-roll','food.milkshake','food.cotton-candy','food.jelly-beans','food.candy-corn']), categories:Object.freeze(['dessert','candy']) }),
  chomper: Object.freeze({ label:'Drive-Thru Rush', itemIds:Object.freeze(['food.burger','food.fries','food.pizza','food.fried-chicken','food.pretzel','food.cheese','food.taco','food.hot-dog','food.chicken-nuggets','food.onion-rings','food.nachos','food.milkshake']), categories:Object.freeze(['meal','snack','fast-food']) }),
  hippo: Object.freeze({ label:'Big Fruit Bowl', itemIds:Object.freeze(['food.watermelon-slice','food.pineapple','food.coconut','food.fruit-bowl','food.peach']), categories:Object.freeze(['fruit']) }),
  chameleon: Object.freeze({ label:'Colour Feast', itemIds:Object.freeze(['food.strawberry','food.blueberry','food.lemon','food.avocado','food.dragon-fruit']), categories:Object.freeze(['fruit','veg']) }),
  pelican: Object.freeze({ label:'Boardwalk Bites', itemIds:Object.freeze(['food.fries','food.pretzel','food.maki-roll','food.whole-fish']), categories:Object.freeze(['snack','meal','seafood']) }),
  count: Object.freeze({ label:'Midnight Sweets', itemIds:Object.freeze(['food.strawberry','food.cherry','food.red-velvet-cake','food.raspberry','food.candy-corn']), categories:Object.freeze(['dessert','fruit','candy']) }),
  flytrap: Object.freeze({ label:'Garden Harvest', itemIds:Object.freeze(['food.carrot','food.broccoli','food.tomato','food.chili-pepper']), categories:Object.freeze(['veg']) }),
  bob: Object.freeze({ label:'Picnic Basket', itemIds:Object.freeze(['food.apple','food.pear','food.pretzel','food.cheese','food.fruit-bowl']), categories:Object.freeze(['fruit','snack']) }),
  gulper: Object.freeze({ label:'Giant Feast', itemIds:Object.freeze(['food.watermelon-slice','food.pizza','food.burger','food.fruit-bowl']), categories:Object.freeze(['meal']) }),
  toadal: Object.freeze({ label:"King's Feast", itemIds:Object.freeze(['food.steak','food.pizza','food.fruit-bowl','food.cheesecake','food.golden-apple','food.jewel-candy']), categories:Object.freeze([]) }),
});

function getArcadeFavouriteProfile(characterId) {
  const id = String(characterId || 'classic');
  return ARCADE_CHARACTER_FAVOURITE_PROFILES[id]
    || (id === 'gully' ? ARCADE_CHARACTER_FAVOURITE_PROFILES.pelican : null)
    || ARCADE_CHARACTER_FAVOURITE_PROFILES.classic;
}

function isArcadeFavouriteFood(characterId, itemId) {
  const id = String(characterId || 'classic');
  const canonicalId = id === 'gully' ? 'pelican' : id;
  const food = ARCADE_FOOD_BY_ID[String(itemId || '')] || null;
  if (!food) return false;
  const explicit = Array.isArray(food.affinities) ? food.affinities : [];
  if (explicit.includes(canonicalId) || (canonicalId === 'pelican' && explicit.includes('gully'))) return true;
  const profile = getArcadeFavouriteProfile(canonicalId);
  return profile.itemIds.includes(food.itemId) || profile.categories.includes(food.category);
}

// All approved identities remain registered for Feast Orders and explicit
// pattern drops, while ordinary spawns use a compact per-run menu. The stable
// 30-food core plus one 10-food character theme keeps recognition readable and
// prevents the complete 59-food library from appearing in a single run.
const ARCADE_FOOD_CORE_IDS = Object.freeze(ARCADE_FOOD_IDS.slice(0, 30));
const ARCADE_FOOD_ROTATIONS = Object.freeze({
  royalSweets: Object.freeze(['food.gummy-bear','food.lollipop','food.macaron','food.marshmallow','food.mochi','food.brownie','food.cheesecake','food.fruit-bowl','food.strawberry','food.donut']),
  ninjaSea: Object.freeze(['food.salmon-nigiri','food.shrimp-nigiri','food.maki-roll','food.ramen','food.curry','food.whole-fish','food.mochi','food.chili-pepper','food.fruit-bowl','food.nachos']),
  chomperFeast: Object.freeze(['food.taco','food.hot-dog','food.chicken-nuggets','food.onion-rings','food.nachos','food.brownie','food.cheesecake','food.ramen','food.curry','food.fruit-bowl']),
  festivalMix: Object.freeze(['food.gummy-bear','food.lollipop','food.marshmallow','food.chili-pepper','food.taco','food.nachos','food.whole-fish','food.fruit-bowl','food.macaron','food.maki-roll']),
  kingsFeast: Object.freeze(['food.taco','food.hot-dog','food.nachos','food.ramen','food.curry','food.fruit-bowl','food.brownie','food.cheesecake','food.macaron','food.milkshake']),
});
const ARCADE_FOOD_RESERVE_ROTATIONS = Object.freeze({
  orchard: Object.freeze(['food.watermelon-slice','food.peach']),
  berryExotic: Object.freeze(['food.raspberry','food.dragon-fruit']),
  carnival: Object.freeze(['food.cinnamon-roll','food.cotton-candy']),
  candyBar: Object.freeze(['food.milkshake','food.jelly-beans']),
});
const ARCADE_RARE_FOOD_IDS = Object.freeze(['food.golden-apple','food.jewel-candy']);
const ARCADE_CHARACTER_FOOD_ROTATION = Object.freeze({
  princess:'royalSweets', royal:'royalSweets', count:'royalSweets',
  ninja:'ninjaSea', ocean:'ninjaSea', gully:'ninjaSea',
  chomper:'chomperFeast', hippo:'chomperFeast', pelican:'chomperFeast', flytrap:'chomperFeast',
  classic:'festivalMix', gulper:'festivalMix', fire:'festivalMix', golden:'festivalMix', chameleon:'festivalMix', bob:'festivalMix',
  toadal:'kingsFeast',
});
const ARCADE_CHARACTER_RESERVE_ROTATION = Object.freeze({
  hippo:'orchard', classic:'orchard', gulper:'orchard',
  ocean:'berryExotic', gully:'berryExotic', count:'berryExotic', chameleon:'berryExotic',
  princess:'carnival', royal:'carnival', fire:'carnival', golden:'carnival',
  chomper:'candyBar', ninja:'candyBar', pelican:'candyBar', flytrap:'candyBar', bob:'candyBar',
  toadal:'carnival',
});

function getArcadeFoodRotationId(characterId) {
  return ARCADE_CHARACTER_FOOD_ROTATION[String(characterId || '')] || 'festivalMix';
}

function getArcadeActiveFoodIds(characterId) {
  const selected = characterId || (typeof GameState !== 'undefined' ? GameState.selectedCharacterId : 'classic');
  const rotation = ARCADE_FOOD_ROTATIONS[getArcadeFoodRotationId(selected)] || ARCADE_FOOD_ROTATIONS.festivalMix;
  const reserveId = ARCADE_CHARACTER_RESERVE_ROTATION[String(selected || '')] || 'orchard';
  const reserve = ARCADE_FOOD_RESERVE_ROTATIONS[reserveId] || ARCADE_FOOD_RESERVE_ROTATIONS.orchard;
  return Object.freeze([...new Set([...ARCADE_FOOD_CORE_IDS, ...rotation, ...reserve])]);
}

function pickArcadeRareFoodId(rng = Math.random) {
  const roll = Math.max(0, Math.min(0.999999999, Number(rng()) || 0));
  return ARCADE_RARE_FOOD_IDS[Math.floor(roll * ARCADE_RARE_FOOD_IDS.length)];
}

// Shared catch effects make foods feel juicy, sugary, crumbly, savory, or
// premium without requiring a bespoke eating sprite sheet for every item.
const ARCADE_FOOD_EFFECT_PROFILES = Object.freeze({
  juice: Object.freeze({ palette:Object.freeze(['#ff5f79','#ffb13b','#8edb52']), particleCount:15, accent:'pulp' }),
  sugar: Object.freeze({ palette:Object.freeze(['#ff8fd8','#8fe8ff','#fff29a']), particleCount:14, accent:'sparkle' }),
  crumb: Object.freeze({ palette:Object.freeze(['#f2b84b','#d98235','#fff0b5']), particleCount:13, accent:'crumbs' }),
  savory: Object.freeze({ palette:Object.freeze(['#e99b42','#d95d39','#ffe0a1']), particleCount:12, accent:'steam' }),
  rice: Object.freeze({ palette:Object.freeze(['#fffdf1','#f2e2bd','#ff9f73']), particleCount:13, accent:'rice-sparkle' }),
  premium: Object.freeze({ palette:Object.freeze(['#ffe16b','#fff7c2','#ff9be8']), particleCount:24, accent:'starburst' }),
});

function getArcadeFoodEffectFamily(itemId) {
  const food = ARCADE_FOOD_BY_ID[String(itemId || '')] || null;
  if (!food) return 'savory';
  if (ARCADE_FOOD_EFFECT_PROFILES[food.effect]) return food.effect;
  if (food.category === 'fruit' || food.category === 'veg') return 'juice';
  if (food.category === 'candy' || food.category === 'drink') return 'sugar';
  if (food.category === 'premium') return 'premium';
  if (food.category === 'sushi' || food.itemId === 'food.sushi-roll') return 'rice';
  if (['dessert','breakfast','snack'].includes(food.category)) {
    return ['food.hard-candy','food.chocolate','food.ice-cream-cone'].includes(food.itemId) ? 'sugar' : 'crumb';
  }
  return 'savory';
}

function getArcadeFoodEffectProfile(itemId) {
  return ARCADE_FOOD_EFFECT_PROFILES[getArcadeFoodEffectFamily(itemId)] || ARCADE_FOOD_EFFECT_PROFILES.savory;
}

function getArcadeFoodDef(itemId) {
  return ARCADE_FOOD_BY_ID[String(itemId || '')] || ARCADE_FOOD_DEFINITIONS[0];
}

function randomArcadeFoodId(characterId) {
  const activeIds = getArcadeActiveFoodIds(characterId);
  return activeIds[Math.floor(Math.random() * activeIds.length)];
}

// Hazards are separate gameplay identities. They use the same vector-first
// fallback policy as food and can later receive an asset path without changing
// collision, saves, score logic, or renderer target IDs.
const HAZARD_DATA = Object.freeze([
  { id:'bomb',    label:'Bomb',    assetKey:'hazard_bomb',    visualKind:'bomb',    color:'#ff4444', caughtText:'-1 Life!',  gameOverTitle:'Boom!',      gameOverSub:'Caught a bomb!' },
  { id:'fire',    label:'Fire',    assetKey:'hazard_fire',    visualKind:'fire',    color:'#ff7a22', caughtText:'Burned!',   gameOverTitle:'Burned!',    gameOverSub:'The fire was too hot!' },
  { id:'caution', label:'Caution', assetKey:'hazard_caution', visualKind:'caution', color:'#ffd23f', caughtText:'Danger!',   gameOverTitle:'Too Risky!', gameOverSub:'You caught a caution hazard!' },
]);

const HAZARD_BY_ID = Object.freeze(Object.fromEntries(HAZARD_DATA.map(hazard => [hazard.id, hazard])));
function getHazardDef(id) {
  return HAZARD_BY_ID[String(id || '')] || HAZARD_BY_ID.bomb;
}

// `FOOD_ASSET_MAP` remains the native source registry used by the asset and
// theme systems. Its keys are now stable food IDs rather than glyphs.
const FOOD_ASSET_MAP = Object.freeze({
  'food.apple': Object.freeze({ itemId:'food.apple', label:'Apple', assetKey:'food_apple', visualKind:'apple', category:'fruit' }),
  'food.banana': Object.freeze({ itemId:'food.banana', label:'Banana', assetKey:'food_banana', visualKind:'banana', category:'fruit' }),
  'food.pear': Object.freeze({ itemId:'food.pear', label:'Pear', assetKey:'food_pear', visualKind:'pear', category:'fruit' }),
  'food.orange': Object.freeze({ itemId:'food.orange', label:'Orange', assetKey:'food_orange', visualKind:'orange', category:'fruit' }),
  'food.lemon': Object.freeze({ itemId:'food.lemon', label:'Lemon', assetKey:'food_lemon', visualKind:'lemon', category:'fruit' }),
  'food.watermelon': Object.freeze({ itemId:'food.watermelon', label:'Watermelon', assetKey:'food_watermelon', visualKind:'watermelon', category:'fruit' }),
  'food.strawberry': Object.freeze({ itemId:'food.strawberry', label:'Strawberry', assetKey:'food_strawberry', visualKind:'strawberry', category:'fruit' }),
  'food.grapes': Object.freeze({ itemId:'food.grapes', label:'Grapes', assetKey:'food_grapes', visualKind:'grapes', category:'fruit' }),
  'food.cherry': Object.freeze({ itemId:'food.cherry', label:'Cherry', assetKey:'food_cherry', visualKind:'cherry', category:'fruit' }),
  'food.pineapple': Object.freeze({ itemId:'food.pineapple', label:'Pineapple', assetKey:'food_pineapple', visualKind:'pineapple', category:'fruit' }),
  'food.kiwi': Object.freeze({ itemId:'food.kiwi', label:'Kiwi', assetKey:'food_kiwi', visualKind:'kiwi', category:'fruit' }),
  'food.mango': Object.freeze({ itemId:'food.mango', label:'Mango', assetKey:'food_mango', visualKind:'mango', category:'fruit' }),
  'food.blueberry': Object.freeze({ itemId:'food.blueberry', label:'Blueberry', assetKey:'food_blueberry', visualKind:'blueberry', category:'fruit' }),
  'food.coconut': Object.freeze({ itemId:'food.coconut', label:'Coconut', assetKey:'food_coconut', visualKind:'coconut', category:'fruit' }),
  'food.pizza': Object.freeze({ itemId:'food.pizza', label:'Pizza', assetKey:'food_pizza', visualKind:'pizza', category:'meal' }),
  'food.burger': Object.freeze({ itemId:'food.burger', label:'Burger', assetKey:'food_burger', visualKind:'burger', category:'meal' }),
  'food.fries': Object.freeze({ itemId:'food.fries', label:'Fries', assetKey:'food_fries', visualKind:'fries', category:'meal' }),
  'food.fried-chicken': Object.freeze({ itemId:'food.fried-chicken', label:'Fried Chicken', assetKey:'food_chicken', visualKind:'chicken', category:'meal' }),
  'food.steak': Object.freeze({ itemId:'food.steak', label:'Steak', assetKey:'food_meat', visualKind:'steak', category:'meal' }),
  'food.cheese': Object.freeze({ itemId:'food.cheese', label:'Cheese', assetKey:'food_cheese', visualKind:'cheese', category:'meal' }),
  'food.pretzel': Object.freeze({ itemId:'food.pretzel', label:'Pretzel', assetKey:'food_pretzel', visualKind:'pretzel', category:'snack' }),
  'food.pancake': Object.freeze({ itemId:'food.pancake', label:'Pancakes', assetKey:'food_pancakes', visualKind:'pancakes', category:'breakfast' }),
  'food.waffle': Object.freeze({ itemId:'food.waffle', label:'Waffle', assetKey:'food_waffle', visualKind:'waffle', category:'breakfast' }),
  'food.sushi-roll': Object.freeze({ itemId:'food.sushi-roll', label:'Rice Roll', assetKey:'food_riceball', visualKind:'riceball', category:'meal' }),
  'food.sushi': Object.freeze({ itemId:'food.sushi', label:'Sushi', assetKey:'food_sushi', visualKind:'sushi', category:'meal' }),
  'food.udon': Object.freeze({ itemId:'food.udon', label:'Noodles', assetKey:'food_noodles', visualKind:'noodles', category:'meal' }),
  'food.carrot': Object.freeze({ itemId:'food.carrot', label:'Carrot', assetKey:'food_carrot', visualKind:'carrot', category:'veg' }),
  'food.corn': Object.freeze({ itemId:'food.corn', label:'Corn', assetKey:'food_corn', visualKind:'corn', category:'veg' }),
  'food.candy-corn': Object.freeze({ itemId:'food.candy-corn', label:'Candy Corn', assetKey:'food_candycorn', visualKind:'candy-corn', category:'candy', effect:'sugar' }),
  'food.avocado': Object.freeze({ itemId:'food.avocado', label:'Avocado', assetKey:'food_avocado', visualKind:'avocado', category:'veg' }),
  'food.broccoli': Object.freeze({ itemId:'food.broccoli', label:'Broccoli', assetKey:'food_broccoli', visualKind:'broccoli', category:'veg' }),
  'food.tomato': Object.freeze({ itemId:'food.tomato', label:'Tomato', assetKey:'food_tomato', visualKind:'tomato', category:'veg' }),
  'food.potato': Object.freeze({ itemId:'food.potato', label:'Potato', assetKey:'food_potato', visualKind:'potato', category:'veg' }),
  'food.donut': Object.freeze({ itemId:'food.donut', label:'Donut', assetKey:'food_donut', visualKind:'donut', category:'dessert' }),
  'food.cookie': Object.freeze({ itemId:'food.cookie', label:'Cookie', assetKey:'food_cookie', visualKind:'cookie', category:'dessert' }),
  'food.ice-cream-cone': Object.freeze({ itemId:'food.ice-cream-cone', label:'Ice Cream', assetKey:'food_icecream', visualKind:'icecream', category:'dessert' }),
  'food.red-velvet-cake': Object.freeze({ itemId:'food.red-velvet-cake', label:'Cake', assetKey:'food_cake', visualKind:'cake', category:'dessert' }),
  'food.cupcake': Object.freeze({ itemId:'food.cupcake', label:'Cupcake', assetKey:'food_cupcake', visualKind:'cupcake', category:'dessert' }),
  'food.chocolate': Object.freeze({ itemId:'food.chocolate', label:'Chocolate', assetKey:'food_chocolate', visualKind:'chocolate', category:'dessert' }),
  'food.hard-candy': Object.freeze({ itemId:'food.hard-candy', label:'Candy', assetKey:'food_candy', visualKind:'candy', category:'dessert' }),
});
const BOMB_ASSET_MAP = Object.freeze(Object.fromEntries(HAZARD_DATA.map(hazard => [hazard.id, {
  hazardId: hazard.id,
  label: hazard.label,
  assetKey: hazard.assetKey,
  visualKind: hazard.visualKind,
}] )));

// LEVEL_CONFIG — ordered wave definitions. getCurrentLevelConfig() clamps to the last entry
// once ProgressionState.currentLevel exceeds this list, so later waves stay at max difficulty.
//
// GAMEPLAY FIX: this used to be a hand-written 10-entry list, which meant the game's
// real difficulty ceiling (spawn speed, spawn pattern, foods-per-wave, heart cap) was
// reached and *frozen* by level 10 — every level after that was identical. Players
// could keep climbing GameState.level via score, but the wave itself never changed,
// and the level-1→2 jump alone was +10% spawn speed.
//
// Now generated out to 50 waves on a flat LINEAR curve, so every single level adds
// the same small amount of difficulty (~+3.3% spawn speed per level) instead of a few
// big jumps — genuinely gradual — and the climb keeps going all the way to level 50
// instead of plateauing at 10. Level 50+ becomes the new (harder, but fairly-earned)
// difficulty ceiling.
const LEVEL_PATTERN_CYCLE = [
  'normal', 'normal', 'zigzag', 'burst', 'sweep',
  'zigzag', 'rainfall', 'burst', 'sweep', 'rainfall',
];

function _buildLevelConfig(maxLevel) {
  const waves = [];
  const speedStart = 1.0;
  const speedEnd   = 2.6; // total ramp across all 50 levels, spread evenly
  for (let i = 0; i < maxLevel; i++) {
    const level = i + 1;
    const t = (level - 1) / (maxLevel - 1); // 0 to 1 across the whole run
    waves.push({
      spawnSpeed:   +(speedStart + t * (speedEnd - speedStart)).toFixed(3),
      spawnPattern: LEVEL_PATTERN_CYCLE[i % LEVEL_PATTERN_CYCLE.length],   // cycles, with a calmer "normal" beat recurring every 10 levels
      foodsToEat:   Math.min(8 + Math.floor((level - 1) / 2), 30),        // 8 to 30, +1 every 2 levels
      heartCap:     Math.min(1 + Math.floor((level - 1) / 10), 5),       // 1 to 5, +1 every 10 levels
    });
  }
  return waves;
}

const LEVEL_CONFIG = _buildLevelConfig(50);

// LEVEL_DATA — per-level difficulty ramp config, tuned live via TWEAK_DEFAULTS/applyTweaks()
const LEVEL_DATA = {
  default: {
    spawnIntervalBase: 1.6,
    speedMultBase: 1.0,
    bombChance: 0.10
  },
  perLevel: {
    spawnIntervalMin: 0.55,
    speedMultInc: 0.084,
    spawnIntervalDec: 0.12,
    // bombChanceInc was 0.01, which hit bombChanceCap by level 25 and then sat flat
    // for the rest of the run. Halved so the bomb-chance ramp spans the full 50-level
    // curve (0.10 base + 50 * 0.005 = 0.35 = cap, reached right at the new ceiling).
    bombChanceInc: 0.005,
    bombChanceCap: 0.35
  }
};
