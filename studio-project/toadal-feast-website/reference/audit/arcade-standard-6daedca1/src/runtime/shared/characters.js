// ============================================================
// src/runtime/shared/characters.js — CHARACTER_DATA pure data constant
// Load order: 2nd (after src/runtime/shared/balance.js)
// Creates globals: CHARACTER_DATA
// Consumes: nothing from later files
// ============================================================

const CHARACTER_DATA = [
  { id:'gulper',    name:'Gulper',        emoji:'GUL', assetKey:'char_gulper',    src:'assets/images/characters/runtime-select/gulper.png',    desc:'The cheerful pink eating machine from Toadal Consumption. Hold Space to open wide, feed seven times, and watch Gulper grow through eight authored stages.',                                                                                                                                  species:'gulper',    color:'#ff8ea8', bodyColor:'#ff8ea8', bellyColor:'#ffe4ec', eyeColor:'#2c0e15', coinCost:0,    abilities:['gulperCatch'],                                          stats:{ speedBonus:20,  tongueBonus:0,   reachBonus:0,   catchRadius:40, speedRampMult:1.0,  spawnIntervalMult:0.9 } },
  { id:'classic',   name:'Classic Frog',  emoji:'CLS', assetKey:'char_classic',   src:'assets/images/characters/runtime-select/classic.png',   desc:'A reliable green frog. Born ready.',                                                                                                                                                                                               species:'frog',      color:'#4cc94c', bodyColor:'#3aaa3a', bellyColor:'#a8eea8', eyeColor:'#e8b800', coinCost:0,    abilities:['tongue','legs'],                                         stats:{ speedBonus:0,   tongueBonus:0,   reachBonus:0,   catchRadius:32 } },
  { id:'fire',      name:'Fire Frog',     emoji:'FIR', assetKey:'char_fire',      src:'assets/images/characters/runtime-select/fire.png',      desc:'Faster tongue. Burns with passion.',                                                                                                                                                                                               species:'frog',      color:'#ff7733', bodyColor:'#dd5511', bellyColor:'#ffcc88', eyeColor:'#ff2200', coinCost:30 ,  abilities:['tongue','legs','fastTongue'],                            stats:{ speedBonus:0,   tongueBonus:80,  reachBonus:80,  catchRadius:32 } },
  { id:'ocean',     name:'Ocean Frog',    emoji:'OCN', assetKey:'char_ocean',     src:null,     desc:'Retired historical Arcade identity; no longer selectable or available as a cosmetic.',                                                                                                                                                 species:'frog',      color:'#33aaff', bodyColor:'#1188dd', bellyColor:'#aaddff', eyeColor:'#0044ff', coinCost:60 ,  abilities:['tongue','legs','fastMove'],                              stats:{ speedBonus:80,  tongueBonus:0,   reachBonus:0,   catchRadius:32 }, selectable:false, legacyAliasOf:'classic', arcadeDisposition:'retired' },
  { id:'royal',     name:'Royal Frog',    emoji:'RYL', assetKey:'char_royal',     src:'assets/images/characters/runtime-select/royal.png',     desc:'Feast and grow! Belly swells every 3 catches. Higher streak = bigger multiplier, but you slow down. Miss a food and belly shrinks!',                                                                                                species:'frog',      color:'#cc88ff', bodyColor:'#9944dd', bellyColor:'#eeccff', eyeColor:'#ff44ff', coinCost:100 , abilities:['tongue','legs','scoreBonus','growingBelly','streakMultiplier'], stats:{ speedBonus:0, tongueBonus:0, reachBonus:0, catchRadius:32, scoreBonus:8, bellyGrowthMax:25, bellySpeedPenaltyMax:120, bellyShrinkOnMiss:5, speedRampMult:0.9, spawnIntervalMult:1.05 } },
  { id:'ninja',     name:'Ninja Frog',    emoji:'NIN', assetKey:'char_ninja',     src:null,     desc:'Post-launch concept retained for compatibility and future redesign; not part of the launch roster.',                                                                                                                                species:'frog',      color:'#444444', bodyColor:'#222222', bellyColor:'#777777', eyeColor:'#ff0000', coinCost:150 , abilities:['tongue','legs','fastMove','fastTongue','ninjaJump'],     stats:{ speedBonus:100, tongueBonus:90,  reachBonus:90,  catchRadius:32, speedRampMult:1.25, spawnIntervalMult:0.85 }, selectable:false, arcadeDisposition:'post-launch', releaseState:'post-launch' },
  { id:'golden',    name:'Toadal (legacy Golden Frog)',   emoji:'GLD', assetKey:'char_golden',    src:null,    desc:'Legacy Golden Frog save identity. Canonical identity is Toadal; retained only so historical saves resolve safely.',                                                                                                                                       species:'frog',      color:'#ffd700', bodyColor:'#cc9900', bellyColor:'#fff3aa', eyeColor:'#ff8800', coinCost:250 , abilities:['tongue','legs','scoreMultiplier'],                       stats:{ speedBonus:0,   tongueBonus:0,   reachBonus:0,   catchRadius:34, scoreMultiplier:2 }, selectable:false, legacyAliasOf:'toadal', arcadeDisposition:'retired-alias', releaseState:'retired-alias' },
  { id:'hippo',     name:'Hungry Hippo',  emoji:'HIP', assetKey:'char_hippo',     src:null,     desc:'Legacy Hungry Hippo identity retained only for save compatibility; active Arcade and Infinite presentation reuse the approved launch cast.',                                                                                                                                     species:'hippo',     color:'#9c90b8', bodyColor:'#7d7295', bellyColor:'#d9d0ea', eyeColor:'#1f1f1f', coinCost:85 ,  abilities:['wideCatch','heavyMovement'],                             stats:{ speedBonus:-10, tongueBonus:0,   reachBonus:0,   catchRadius:48, lungeDistance:140, lungeCooldown:0.9, lungeSpeed:800, speedRampMult:0.75, spawnIntervalMult:1.1 }, selectable:false, arcadeDisposition:'compatibility-only' },
  { id:'chameleon', name:'Chameleon',     emoji:'CHM', assetKey:'char_chameleon', src:null, desc:'Shelved Arcade character retained for source and compatibility; not currently selectable.',                                                                                                                                              species:'chameleon', color:'#ff9818', bodyColor:'#f57c00', bellyColor:'#ffe28a', eyeColor:'#8b4300', coinCost:125 , abilities:['hookedTongue','legs','fastTongue'],                      stats:{ speedBonus:20,  tongueBonus:190, reachBonus:210, catchRadius:30 }, selectable:false, arcadeDisposition:'shelved-polish', releaseState:'shelved-polish' },
  { id:'pelican',   name:'Gully',         emoji:'GULY', assetKey:'char_pelican',   src:'assets/images/characters/runtime-select/pelican.png',   desc:'A bold seagull named Gully. Glide in all 4 directions and scoop food mid-air. Build combos for big points — each catch in a row multiplies your score!',                                                                             species:'seagull',   color:'#f4f4f0', bodyColor:'#c8c8c4', bellyColor:'#ffffff', eyeColor:'#35506b', coinCost:175 , abilities:['flyingCatch','pouchCatch','comboScore'],                  stats:{ speedBonus:40,  tongueBonus:0,   reachBonus:0,   catchRadius:52, diveSpeed:480, climbSpeed:260, foodSpeedMult:1.25, speedRampMult:1.0, spawnIntervalMult:1.1 } },
  { id:'flytrap',   name:'Venus Flytrap', emoji:'VFT', assetKey:'char_flytrap',   src:'assets/images/characters/runtime-select/flytrap.png',   desc:'Biggest catch zone. Press Up to pick up your clone, Down to plant it — it catches food on its own! Fast spawns keep both mouths busy.',                                                                                               species:'flytrap',   color:'#6fda73', bodyColor:'#39a85a', bellyColor:'#b8f1ad', eyeColor:'#7a1030', coinCost:215 , abilities:['snapJaw','wideCatch','snapClone'],                        stats:{ speedBonus:-15, tongueBonus:0,   reachBonus:0,   catchRadius:65, cloneCatchRadius:44, speedRampMult:0.75, spawnIntervalMult:1.0 } },
  { id:'count',     name:'Count',         emoji:'CNT', assetKey:'char_count',     src:'assets/images/characters/runtime-select/count.png',     desc:'Ah ah ah! Hearts give +100 pts AND restore health (max 20 hearts). Food costs you points — negative combos pile up fast. Survive on blood alone.',                                                                                   species:'vampire',   color:'#e8d5f0', bodyColor:'#2a0a3a', bellyColor:'#4a1a5a', eyeColor:'#cc0000', coinCost:300 , abilities:['vampireFeed','tongue','legs'],                           stats:{ speedBonus:30,  tongueBonus:20,  reachBonus:0,   catchRadius:34, heartScoreBonus:100, foodScorePenalty:50, heartSpawnMult:1.45, startLives:3, maxLives:20, speedRampMult:0.9, spawnIntervalMult:1.0 } },
  { id:'bob',       name:'Bob',           emoji:'BOB', assetKey:'char_bob',       src:'assets/images/characters/runtime-select/bob.png',       desc:'Catch food in your basket, then walk to the chest (bottom-right) to bank your points! Basket holds 5 items. Space to lean forward. Food falls faster — but you can hold 10 lives!',                                               species:'human',     color:'#f4c17a', bodyColor:'#e8955a', bellyColor:'#f7d9a8', eyeColor:'#3a6ea8', coinCost:50 ,  abilities:['basketCatch','legs'],                                    stats:{ speedBonus:20,  tongueBonus:0,   reachBonus:0,   catchRadius:52, basketLeanBonus:55, foodSpeedMult:1.7, startLives:2, maxLives:10, speedRampMult:0.85, spawnIntervalMult:1.15 } },
  { id:'chomper',   name:'Chomper',       emoji:'CHP', assetKey:'char_chomper',   src:'assets/images/characters/runtime-select/chomper.png',   desc:'A friendly little dino-chomper who catches falling food from above with a big happy bite. Scores immediately, then needs a tiny reset between chomps!',                                                                         species:'chomper',   color:'#e87c3e', bodyColor:'#c45a1a', bellyColor:'#f5c49a', eyeColor:'#ff2200', coinCost:75 ,  abilities:['chomperCatch'],                                          stats:{ speedBonus:-5,  tongueBonus:0,   reachBonus:0,   catchRadius:48, chompCooldown:0.18, speedRampMult:0.85, spawnIntervalMult:1.05 } },
  { id:'toadal',     name:'Toadal',        emoji:'TOAD', assetKey:'char_toadal',    src:'assets/images/characters/toadal-arcade/portrait.png',     desc:'TOADAL FEAST mascot and King of Feasts. Eat by contact to build Golden Charge. Hold Down/S and release for a charged Royal Hop, snap a short tongue with Space for extra reach, then spend Charge on Golden Throw or stackable Golden Blocks.', species:'frog', color:'#f3c52b', bodyColor:'#e3ad16', bellyColor:'#fff0b4', eyeColor:'#6d4218', coinCost:0, abilities:['toadalPassiveEat','toadalHop','toadalTongue','toadalGoldenThrow','toadalGoldenBlock','scoreMultiplier'], stats:{ speedBonus:20, tongueBonus:0, reachBonus:0, catchRadius:38, scoreMultiplier:2, speedRampMult:1.0, spawnIntervalMult:1.0 }, selectable:true, arcadeDisposition:'active', releaseState:'active' },
  { id:'princess',  name:'Princess Lily', emoji:'LILY', assetKey:'char_princess',  src:'assets/images/characters/curated-highres/princess/lilly_idle_1f_512_2026-09-08.png',  desc:'A frog princess buried under endless food! Catch everything to uncover your enchanted kingdom. No bombs, no pressure — just pure zen.',                                                                                           species:'frog',      color:'#ff88cc', bodyColor:'#ee66aa', bellyColor:'#ffccee', eyeColor:'#9933cc', coinCost:0,    abilities:['zenMode','tongue','legs'],                               stats:{ speedBonus:20,  tongueBonus:20,  reachBonus:0,   catchRadius:34, startLives:10, maxLives:10 } },
];


const ARCADE_LAUNCH_CHARACTER_IDS = Object.freeze([
  'gulper',
  'classic',
  'toadal',
  'fire',
  'royal',
  'pelican',
  'flytrap',
  'count',
  'bob',
  'chomper',
  'princess',
]);
const ARCADE_LAUNCH_CHARACTER_ID_SET = new Set(ARCADE_LAUNCH_CHARACTER_IDS);

const ARCADE_CHARACTER_ID_MIGRATIONS = Object.freeze({
  ocean: 'classic',
  ninja: 'classic',
  hippo: 'classic',
  golden: 'toadal',
  chameleon: 'classic',
});

function canonicalCharacterId(characterId) {
  const id = String(characterId || 'classic');
  return ARCADE_CHARACTER_ID_MIGRATIONS[id] || id;
}

function isCharacterPlayerSelectable(character) {
  // Fail closed: flags alone are not enough. A character becomes player-
  // eligible (selectable, purchasable, achievement-unlockable) only when its
  // ID is also promoted into the canonical launch roster set.
  return Boolean(character
    && character.hidden !== true
    && character.selectable !== false
    && !character.legacyAliasOf
    && ARCADE_LAUNCH_CHARACTER_ID_SET.has(String(character.id || '')));
}

function getPlayerSelectableCharacters() {
  return ARCADE_LAUNCH_CHARACTER_IDS
    .map(id => CHARACTER_DATA.find(character => character.id === id))
    .filter(isCharacterPlayerSelectable);
}

