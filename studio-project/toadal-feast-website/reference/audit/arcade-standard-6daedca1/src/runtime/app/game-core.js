// ============================================================
// src/runtime/app/game-core.js — Core game state & mode registry
// GameModeRegistry, ProgressionState, GameState, level config,
// revenge state, hasAbility(). Split from game.js for modularity.
// Load order: 10th (after src/runtime/shared/settings.js)
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const FroggyMobileRuntimePolicy = (() => {
  const coarsePointer = Boolean(typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
  const touch = Boolean((typeof navigator !== 'undefined' && Number(navigator.maxTouchPoints) > 0) || coarsePointer);
  const shortestViewportEdge = typeof window !== 'undefined' ? Math.min(window.innerWidth || 0, window.innerHeight || 0) : 0;
  const compactViewport = shortestViewportEdge > 0 && shortestViewportEdge <= 900;
  const mobileRenderProfile = coarsePointer && compactViewport;
  const tabletRenderProfile = mobileRenderProfile && shortestViewportEdge >= 600;
  const saveData = Boolean(typeof navigator !== 'undefined' && navigator.connection?.saveData === true);
  const lowMemory = Number(typeof navigator !== 'undefined' ? navigator.deviceMemory : 0) > 0 && Number(navigator.deviceMemory) <= 4;
  const lowCpu = Number(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0) > 0 && Number(navigator.hardwareConcurrency) <= 4;
  const performanceConstrained = saveData || lowMemory || lowCpu;
  return Object.freeze({ touch, coarsePointer, compactViewport, mobileRenderProfile, tabletRenderProfile, performanceConstrained, saveData, lowMemory, lowCpu });
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyMobileRuntimePolicy = FroggyMobileRuntimePolicy;
const FROGGY_DEVICE_DPR = Math.max(1, Number(window.devicePixelRatio) || 1);
const FROGGY_INITIAL_ARCADE_BUDGET = globalThis.FroggyEnginePerformance?.budgetForMode?.('arcade') || null;
const FROGGY_INITIAL_DPR = Math.min(FROGGY_DEVICE_DPR, Math.max(1, Number(FROGGY_INITIAL_ARCADE_BUDGET?.renderDprCap) || 3));
let DPR = FROGGY_INITIAL_DPR;

// Mobile heat is driven primarily by pixels shaded per second. Preserve smooth
// gameplay first by lowering render density before reducing frame rate. The
// logical 480x800 playfield and all collision/input coordinates stay unchanged.
const FroggyRenderScaleController = (() => {
  const candidates = [FROGGY_DEVICE_DPR, 3, 2.5, 2, 1.75, 1.5, 1.25, 1];
  const ladder = Object.freeze([...new Set(candidates.map(value => Math.round(Math.min(FROGGY_DEVICE_DPR, Math.max(1, value)) * 100) / 100))].sort((a,b)=>b-a));
  let budgetCap = Math.max(1, Number(FROGGY_INITIAL_ARCADE_BUDGET?.renderDprCap) || 3);
  let stage = 0; let lastReason = 'initial-engine-budget';
  function stageForCap(capValue) { const cap=Math.max(1,Number(capValue)||1); const found=ladder.findIndex(value=>value<=cap+0.001); return found>=0?found:ladder.length-1; }
  function snapshot(){ return Object.freeze({currentDpr:DPR,stage,ladder:[...ladder],budgetCap,lastReason}); }
  function publish(reason){ DPR=ladder[stage]||1; lastReason=reason||'engine-budget'; if(typeof document!=='undefined'&&document.documentElement){document.documentElement.dataset.arcadeRenderDpr=String(DPR);document.documentElement.dataset.arcadeRenderDprStage=String(stage);document.documentElement.dataset.engineRenderDprCap=String(budgetCap);} if(typeof window!=='undefined'&&typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function') window.dispatchEvent(new CustomEvent('froggy-render-scale-change',{detail:snapshot()})); return DPR; }
  function setBudgetCap(value,reason='engine-budget'){ const nextCap=Math.max(1,Number(value)||1); const nextStage=stageForCap(nextCap); const changed=Math.abs(nextCap-budgetCap)>=0.001||nextStage!==stage; budgetCap=nextCap; stage=nextStage; publish(reason); return changed; }
  function reset(reason='engine-budget-reset'){ const nextStage=stageForCap(budgetCap); const changed=nextStage!==stage; stage=nextStage; publish(reason); return changed; }
  setBudgetCap(budgetCap,'initial-engine-budget');
  return Object.freeze({setBudgetCap,reset,snapshot,get currentDpr(){return DPR;},get stage(){return stage;},get budgetCap(){return budgetCap;},ladder});
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyRenderScaleController = FroggyRenderScaleController;

// Toadal Consumption owns one slow, continuous giant-growth curve. Gulper
// begins at one-quarter linear size and requires 140 valid swallowed meals to
// reach a 20x body-area target (sqrt(20) linear scale). The eight authored
// bodies remain fullness milestones; runtime scale changes after every meal.
// ────────────────────────────────────────────────────────────────────────
// LIFECYCLE COORDINATOR (EC-2)
// ────────────────────────────────────────────────────────────────────────
// The single owner of interruption events (visibilitychange/blur/pagehide)
// and the matching resume signal. Every system that previously registered its
// own listener subscribes here instead, so interruption POLICY stays with each
// subscriber while event REGISTRATION exists exactly once. External-modal
// state (fullscreen ads, future narrative video) is surfaced centrally so
// subscribers stop copy-pasting the guard.
const FroggyLifecycleCoordinator = (() => {
  const interruptionSubscribers = [];
  const resumeSubscribers = [];
  let installed = false;

  function isExternalModalActive() {
    return globalThis.__HYBRID_EXTERNAL_MODAL_ACTIVE__ === true;
  }

  function dispatch(list, payload) {
    for (const fn of list) {
      try { fn(payload); } catch (e) { console.error('[Lifecycle] subscriber failed:', e); }
    }
  }

  function interruption(reason) {
    dispatch(interruptionSubscribers, Object.freeze({
      reason,
      externalModalActive: isExternalModalActive(),
      hidden: typeof document !== 'undefined' && document.hidden === true,
    }));
    if (typeof EventBus !== 'undefined') EventBus.emit('lifecycleInterruption', { reason });
  }

  function resume(reason) {
    dispatch(resumeSubscribers, Object.freeze({ reason, externalModalActive: isExternalModalActive() }));
    if (typeof EventBus !== 'undefined') EventBus.emit('lifecycleResume', { reason });
  }

  function install() {
    if (installed || typeof document === 'undefined' || typeof window === 'undefined') return;
    installed = true;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) interruption('hidden');
      else resume('visible');
    });
    window.addEventListener('blur', () => interruption('blur'));
    window.addEventListener('pagehide', () => interruption('pagehide'));
  }

  function onInterruption(fn) {
    if (typeof fn === 'function' && !interruptionSubscribers.includes(fn)) interruptionSubscribers.push(fn);
    install();
  }
  function onResume(fn) {
    if (typeof fn === 'function' && !resumeSubscribers.includes(fn)) resumeSubscribers.push(fn);
    install();
  }

  return Object.freeze({ onInterruption, onResume, isExternalModalActive });
})();

const GULPER_TOADAL_MIN_SCALE = 0.25;
const GULPER_TOADAL_MAX_BODY_AREA = 20;
const GULPER_TOADAL_MAX_SCALE = Math.sqrt(GULPER_TOADAL_MAX_BODY_AREA);
// Reaching full size takes five times as many meals as the original 28, so the
// climb reads as a slow continuous swell rather than a handful of sudden jumps.
// Scale still advances after every single meal, so each one is visible.
const GULPER_TOADAL_MAX_MEALS = 140;
// Growth stages and authored bodies are deliberately different numbers.
//
// GULPER_TOADAL_STAGE_COUNT is the *felt* progression: how many increments the
// player is shown growing through. It was 8, which read as a few coarse jumps.
// GULPER_TOADAL_BODY_COUNT is how many complete bodies were actually drawn
// (assets/images/characters/gulper-arcade/stages/gulper_stage_0..7.png), and it
// cannot change without new owner-approved art.
//
// Keeping them separate lets the progression be finer-grained without inventing
// artwork: scale already interpolates continuously after every meal, so the body
// frame simply holds across several growth stages while the model keeps scaling.
const GULPER_TOADAL_STAGE_COUNT = 20;
const GULPER_TOADAL_BODY_COUNT = 8;
function interpolateGulperToadalScale(progress = 0) {
  const unit = Math.max(0, Math.min(1, Number(progress) || 0));
  return GULPER_TOADAL_MIN_SCALE * Math.pow(GULPER_TOADAL_MAX_SCALE / GULPER_TOADAL_MIN_SCALE, unit);
}
const GULPER_TOADAL_VISUAL_SCALES = Object.freeze(Array.from(
  { length:GULPER_TOADAL_STAGE_COUNT },
  (_, stage) => interpolateGulperToadalScale(stage / (GULPER_TOADAL_STAGE_COUNT - 1))
));
function clampGulperToadalMeals(meals = 0) {
  return Math.max(0, Math.min(GULPER_TOADAL_MAX_MEALS, Math.floor(Number(meals) || 0)));
}
function getGulperToadalVisualScale(meals = 0) {
  const progress = clampGulperToadalMeals(meals) / GULPER_TOADAL_MAX_MEALS;
  return interpolateGulperToadalScale(progress);
}
function getGulperToadalStage(meals = 0) {
  const progress = clampGulperToadalMeals(meals) / GULPER_TOADAL_MAX_MEALS;
  return Math.max(0, Math.min(GULPER_TOADAL_STAGE_COUNT - 1, Math.floor(progress * (GULPER_TOADAL_STAGE_COUNT - 1))));
}
// Which authored body to draw. Renderers must use this rather than the growth
// stage: there are only GULPER_TOADAL_BODY_COUNT frames on disk, and indexing
// them with a growth stage would run past the end and fail the render contract.
function getGulperToadalBodyIndex(meals = 0) {
  const progress = clampGulperToadalMeals(meals) / GULPER_TOADAL_MAX_MEALS;
  return Math.max(0, Math.min(GULPER_TOADAL_BODY_COUNT - 1, Math.floor(progress * (GULPER_TOADAL_BODY_COUNT - 1))));
}
if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, {
    GULPER_TOADAL_MIN_SCALE,
    GULPER_TOADAL_MAX_BODY_AREA,
    GULPER_TOADAL_MAX_SCALE,
    interpolateGulperToadalScale,
    GULPER_TOADAL_MAX_MEALS,
    GULPER_TOADAL_STAGE_COUNT,
    GULPER_TOADAL_BODY_COUNT,
    getGulperToadalBodyIndex,
    GULPER_TOADAL_VISUAL_SCALES,
    clampGulperToadalMeals,
    getGulperToadalVisualScale,
    getGulperToadalStage,
  });
}

// ── Timer tracking (must be defined before any usage) ────────────────────────
const _timerIds = [];
function _safeInterval(fn, ms) { const id = setInterval(fn, ms); _timerIds.push(id); return id; }
function _safeTimeout(fn, ms) {
  // Remove completed one-shot timers from the registry so long sessions do not
  // accumulate stale handles. _clearAllTimers() remains safe at any point.
  let id = null;
  id = setTimeout(() => {
    const idx = _timerIds.indexOf(id);
    if (idx !== -1) _timerIds.splice(idx, 1);
    fn();
  }, ms);
  _timerIds.push(id);
  return id;
}
function _clearAllTimers() { _timerIds.forEach(id => { clearTimeout(id); clearInterval(id); }); _timerIds.length = 0; }

// ============================================================
//  GAME MODE REGISTRY ARCHITECTURE
// ============================================================

const GameModeRegistry = {
  standard: {
    id: 'standard',
    name: 'Standard',
    missPenalty: true,
    spawnConfig: GAME_BALANCE.spawn,
    forcedChar: null,
    hudWidget: 'standard',
    init() {
      const persist = SaveManager.get();
      GameState.selectedCharacterId = persist.selectedChar;
    },
    onFoodMissed(f) {
      // Ghost frames: if the player took damage recently, ignore this miss
      if (RuntimeState.ghostTime > 0) return;
      if (!GAME_BALANCE.invincible && !StatusEffectSystem.has('shield')) {
        // Respect the player's miss-penalty setting
        if (typeof SETTINGS === 'undefined' || SETTINGS.missPenalty) {
          GameState.lives = Math.max(0, GameState.lives - 1);
        }
        AudioManager.miss();
        if (typeof SETTINGS === 'undefined' || !SETTINGS.reduceMotion) RuntimeState.shakeTime = 0.2;
        if (typeof SETTINGS !== 'undefined' && SETTINGS.ghostFrames) RuntimeState.ghostTime = 0.6;
        if (typeof Haptic !== 'undefined') Haptic.miss();
        FXManager.spawnFloatingText(entities, f.x, CONFIG.CANVAS_H - 40, 'Missed!', '#ff8888');
        GameState.combo = 0;
        const charDef = getCharDef();
        if (hasAbility(charDef, 'streakMultiplier')) {
          GameState.charState.royal.streak = 0;
          GameState.charState.royal.multiplier = 1;
        }
        if (hasAbility(charDef, 'growingBelly') && GameState.charState.royal.belly > 0) {
          const shrink = charDef.stats.bellyShrinkOnMiss || 5;
          GameState.charState.royal.belly = Math.max(0, GameState.charState.royal.belly - shrink);
          FXManager.spawnFloatingText(entities, frog.x, frog.y - 40, 'Belly shrunk!', '#cc88ff');
        }
        EventBus.emit('playerDamaged', { source: 'miss' });
      }
      if (GameState.lives <= 0) {
        triggerGameOver('Game Over!', 'The food hit the ground...', 'miss');
      }
    },
    onFoodCaught(food, charDef) {
      return false;
    },
    onTick(dt) {},
    onStart() {
      // Standard Arcade always uses the canonical, full-size Stage 0 Gulper.
      // Fullness growth belongs exclusively to Toadal Consumption.
      if (GameState.selectedCharacterId === 'gulper') {
        Object.assign(GameState.charState.gulper, {
          size:1,
          targetSize:1,
          foodsEaten:0,
          pendingTargetSize:null,
          growthPulse:0,
          shrinkPulse:0,
          mouthHeld:false,
          chomping:false,
          chompTime:0,
          eatAnimTimer:0,
        });
      }
      applyEquippedCosmeticStats();
      BackgroundMaps.initForMode(GameState.selectedCharacterId);
    }
  },

  tc: {
    id: 'tc',
    name: 'FEAST FRENZY',
    missPenalty: false,
    spawnConfig: GAME_BALANCE.tc,
    forcedChar: 'gulper',
    hudWidget: 'tc',
    init() {
      // Toadal Consumption uses Gulper without overwriting the player's
      // normal saved Arcade selection.
    },
    onFoodMissed(f) {},
    onFoodCaught(food, charDef) {
      const isEdibleGrowthFood = !food.isBomb && !food.isSyringe && !food.isHeart
        && !food.isBlueHeart && !food.isPowerUp && !food.isGiftBox;
      if (isEdibleGrowthFood) {
        const tc = GameState.toadalConsumption;
        tc.foodsEaten = Math.min(GULPER_TOADAL_MAX_MEALS, Math.max(0, Number(tc.foodsEaten || 0)) + 1);
        tc.pendingTargetSize = getGulperToadalVisualScale(tc.foodsEaten);
        tc.growthPulse = Math.max(tc.growthPulse, 0.24);
      }
      return false;
    },
    onTick(dt) {
      const tc = GameState.toadalConsumption;
      const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
      const revealThreshold = Math.max(0.1, Number(tc.eatAnimDuration || 0.58)) * 0.34;
      if (tc.pendingTargetSize != null && Number(tc.eatAnimTimer || 0) <= revealThreshold) {
        tc.targetSize = Math.max(GULPER_TOADAL_MIN_SCALE, Math.min(GULPER_TOADAL_MAX_SCALE, Number(tc.pendingTargetSize)));
        tc.pendingTargetSize = null;
      }
      const alpha = 1 - Math.exp(-3.2 * safeDt);
      tc.size += (tc.targetSize - tc.size) * alpha;
      tc.growthPulse = Math.max(0, tc.growthPulse - safeDt);
      tc.shrinkPulse = Math.max(0, tc.shrinkPulse - safeDt);
      tc.eatAnimTimer = Math.max(0, Number(tc.eatAnimTimer || 0) - safeDt);
      tc.breatheTime = (Number(tc.breatheTime || 0) + safeDt * 2.2) % (Math.PI * 2);
    },
    onStart() {
      Object.assign(GameState.toadalConsumption, {
        size: getGulperToadalVisualScale(0),
        targetSize: getGulperToadalVisualScale(0),
        mouthClosed: false,
        foodsEaten: 0,
        eatAnimTimer: 0,
        eatAnimDuration: 0.58,
        pendingTargetSize: null,
        chomping: false,
        chompTime: 0,
        growthPulse: 0,
        shrinkPulse: 0,
        breatheTime: 0,
      });
      applyEquippedCosmeticStats();
    }
  },

  fmf: {
    id: 'fmf',
    name: '5 Minute Feast',
    missPenalty: false,
    spawnConfig: GAME_BALANCE.spawn,
    forcedChar: 'chomper',
    hudWidget: 'fmf',
    init() {
      // 5 Minute Feast temporarily resolves Chomper through forcedChar. Keep
      // the player's ordinary Arcade selection untouched so leaving this
      // variant returns them to the character they actually chose.
      GameState.fmfTimeLeft = 300;
    },
    onFoodMissed(f) {
      const charDef = getCharDef();
      if (hasAbility(charDef, 'streakMultiplier')) {
        GameState.charState.royal.streak = 0;
        GameState.charState.royal.multiplier = 1;
        FXManager.spawnFloatingText(entities, frog.x, frog.y - 40, 'Streak Lost!', '#cc88ff');
      }
      if (hasAbility(charDef, 'growingBelly')) {
        const shrink = charDef.stats.bellyShrinkOnMiss || 5;
        GameState.charState.royal.belly = Math.max(0, GameState.charState.royal.belly - shrink);
      }
      GameState.combo = 0;
    },
    onFoodCaught(food, charDef) {
      return false;
    },
    onTick(dt) {
      GameState.fmfTimeLeft -= dt;
      if (GameState.fmfTimeLeft <= 0) {
        GameState.fmfTimeLeft = 0;
        triggerGameOver("Time's Up!", 'Five Minute Feast Complete!', 'timer', true);
      }
    },
    onStart() {
      GameState.fmfTimeLeft = 300;
      GameState.lives = 5;
      GameState.maxLives = 8;
      applyEquippedCosmeticStats();
      BackgroundMaps.initForMode(getCharDef().id);
    }
  },

  zen: {
    id: 'zen',
    name: 'Zen Garden',
    missPenalty: false,
    spawnConfig: GAME_BALANCE.spawn,
    forcedChar: 'princess',
    hudWidget: 'zen',

    init() {
      // Zen temporarily resolves Princess Lily through forcedChar without
      // overwriting the player's ordinary Arcade character selection.
    },

    onFoodMissed(f) {
      // No life penalty in zen — gentle visual only. A miss still breaks the
      // audio combo so the rising catch tone always reflects consecutive catches.
      GameState.combo = 0;
      FXManager.spawnFloatingText(entities, f.x, CONFIG.CANVAS_H - 44, '~', '#88aacc');
    },

    onFoodCaught(food, charDef) {
      // Special entities use the shared handler so hearts, gift boxes, syringes,
      // and the Zen power-up pool keep their normal gameplay effects and sounds.
      if (food.isBomb || food.isSun || food.isPowerUp || food.isHeart || food.isGiftBox || food.isSyringe) return false;

      const bal = GAME_BALANCE.zen;
      ZenState.totalCaught++;
      ZenState.roomCaught++;

      // Score scales with room depth (deeper rooms = more rewarding).
      // Princess Lily's permanent favourite-food affinity is applied here too
      // so Zen and Standard use one understandable character rule.
      const basePts = bal.basePoints * (ZenState.roomsRevealed + 1);
      const affinityBonus = typeof getFeastAffinityBonus === 'function'
        ? getFeastAffinityBonus(charDef, food, basePts)
        : 0;
      const pts = basePts + affinityBonus;
      GameState.score += pts;
      GameState.combo++;

      AudioManager.catchForCombo(GameState.combo);
      if (typeof SETTINGS === 'undefined' || !SETTINGS.reduceMotion) FXManager.spawnParticles(entities, food.x, food.y, '#a8f7a0', 4);
      FXManager.spawnFloatingText(entities, food.x, food.y, `+${pts}`, '#a8f7a0');
      if (affinityBonus > 0) FXManager.spawnFloatingText(entities, food.x, food.y - 25, `Favourite +${affinityBonus}`, '#ff88cc');
      frog.mouthOpen = 1.0;
      if (typeof recordArcadeFeastCatch === 'function') recordArcadeFeastCatch(food, charDef, affinityBonus);

      // Room reveal check
      if (ZenState.roomCaught >= bal.roomCatchThreshold && ZenState.roomsRevealed < bal.rooms) {
        ZenState.roomsRevealed++;
        ZenState.roomCaught = 0;
        ZenState.revealAnim   = 1.0;
        ZenState.celebrationTimer = 2.2;

        const tier = bal.roomTiers[ZenState.roomsRevealed - 1];
        if (tier) {
          FXManager.spawnFloatingText(entities, CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2 - 60,
            tier.toast, tier.glowColor);
          // The garden lighting transition replaces the center-screen burst.
        }
        AudioManager.levelUp();

        // Princess transformation tier
        GameState.charState.princess.transformTier = ZenState.roomsRevealed;
        GameState.charState.princess.sparkle = 1.0;

        if (ZenState.roomsRevealed >= bal.rooms) {
          ZenState.complete = true;
          _safeTimeout(() => triggerGameOver('Kingdom Revealed!', 'You cleared the castle!', 'victory', true), 2800);
        }

        EventBus.emit('zenRoomRevealed', { room: ZenState.roomsRevealed });
      }

      EventBus.emit('foodCaught', { score: GameState.score, level: GameState.level, itemId: food.itemId, characterId: charDef.id, affinityBonus, premiumBonus:0, points:pts, combo:GameState.combo, isRare:Boolean(food.isRareFood) });
      return true; // handled — skip default scoring in handleFoodCaught
    },

    onTick(dt) {
      if (ZenState.revealAnim > 0)        ZenState.revealAnim       = Math.max(0, ZenState.revealAnim - dt * 1.2);
      if (ZenState.celebrationTimer > 0)  ZenState.celebrationTimer -= dt;
      if (GameState.charState.princess.sparkle > 0)
        GameState.charState.princess.sparkle -= dt * 2;
    },

    onStart() {
      ZenState.reset();
      GameState.lives    = GAME_BALANCE.zen.startLives;
      GameState.maxLives = GAME_BALANCE.zen.maxLives;
      GameState.charState.princess = { transformTier: 0, sparkle: 0 };
      applyEquippedCosmeticStats();
      BackgroundMaps.initForMode(getCharDef().id);
    },
  },
};

function getModeConfig() {
  return GameModeRegistry[GameState.currentMode] || GameModeRegistry.standard;
}

// ── Revenge Mode ──────────────────────────────────────────────────────────
// Legacy score-only Revenge globals are retained as inert compatibility
// shims for older promoted files. Unified challenges live in ArcadeRevengeChallenges.
let lastRunScore = 0;
let isRevengeRun = false;

// ── Unlock Progress Bar ───────────────────────────────────────────────────
// Finds the nearest unearned achievement that unlocks purely via score.
// Binary-searches check(probe, 0, stats, save) to locate the threshold.
function getNextUnlockTarget(scoreForProbing) {
  const d     = SaveManager.get();
  const earned = d.achievements || [];
  const stats  = (typeof StatsTracker !== 'undefined') ? StatsTracker.getStats() : null;

  const scored = (typeof ACHIEVEMENT_DATA !== 'undefined' ? ACHIEVEMENT_DATA : [])
    .filter(a => !earned.includes(a.id))
    .map(a => {
      try {
        if (!a.check(99999, 0, stats, d)) return null; // not reachable by score alone
        if ( a.check(0,     0, stats, d)) return null; // passable at 0 — not score-gated
        let lo = 0, hi = 99999;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (a.check(mid, 0, stats, d)) hi = mid; else lo = mid + 1;
        }
        return { icon: a.icon, name: a.name, threshold: lo };
      } catch(_) { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => a.threshold - b.threshold);

  return scored.length > 0 ? scored[0] : null;
}

function getMissPenaltyEnabled() {
  return getModeConfig().missPenalty;
}

function getSpawnConfig() {
  return getModeConfig().spawnConfig || GAME_BALANCE.spawn;
}

const ZenState = {
  totalCaught: 0,
  roomCaught: 0,
  roomsRevealed: 0,
  revealAnim: 0,
  celebrationTimer: 0,
  complete: false,

  reset() {
    this.totalCaught = 0;
    this.roomCaught = 0;
    this.roomsRevealed = 0;
    this.revealAnim = 0;
    this.celebrationTimer = 0;
    this.complete = false;
  },

  get totalProgress() {
    return Math.min(
      1,
      this.totalCaught / GAME_BALANCE.zen.totalCatches
    );
  },

  get roomFraction() {
    return Math.min(
      1,
      this.roomCaught /
      GAME_BALANCE.zen.roomCatchThreshold
    );
  }
};

const ProgressionState = {
  currentLevel: 0,
  foodsEaten: 0,
  foodCarryover: 0,
  heartsSpawnedThisLevel: 0,
  transitioning: false,
  transitionTimer: 0,
  MIN_TRANSITION_DISPLAY: 0.65,
  drainStartCount: 0,
};

function getCurrentLevelConfig() {
  return LEVEL_CONFIG[Math.min(ProgressionState.currentLevel, LEVEL_CONFIG.length - 1)];
}
function resetLevelProgress() {
  // Bob can bank several foods atomically. If one deposit crosses the exact
  // wave threshold, preserve only that overshoot for the next wave instead of
  // deleting earned progress. Ordinary runs leave foodCarryover at zero.
  const carryover = Math.max(0, Math.floor(Number(ProgressionState.foodCarryover) || 0));
  ProgressionState.foodsEaten = carryover;
  ProgressionState.foodCarryover = 0;
  ProgressionState.heartsSpawnedThisLevel = 0;
  if (typeof GameState !== 'undefined' && GameState.charState?.bob) {
    GameState.charState.bob.bankedItems = 0;
  }
}
function isWaveDrainObject(entity) {
  if (!entity || entity.isBomb || entity.isSun) return false;
  // An item still waiting for its approved runtime image is pinned above the
  // playfield: it cannot be caught, cannot be missed, and is never drawn. It is
  // not part of the live edible set, so the Wave Clear drain must not block on
  // it and the drain meter must not count it as remaining food.
  if (Number(entity.visualWaitSeconds) > 0) return false;
  return true;
}
function countActiveWaveDrainObjects() {
  let count = 0;
  for (let i = 0; i < entities.foods.length; i++) {
    if (isWaveDrainObject(entities.foods[i])) count++;
  }
  return count;
}
function triggerWaveComplete() {
  if (ProgressionState.transitioning) return;
  ProgressionState.transitioning = true;
  ProgressionState.transitionTimer = 0;
  ProgressionState.drainStartCount = countActiveWaveDrainObjects();

  // Wave Clear closes the spawn gate, but the live playfield keeps running.
  // Existing falling food, the current tongue shot, character movement, catch
  // effects, and score feedback remain active until the last edible object has
  // been caught or has naturally left the screen. Never purge the playfield here.
  FXManager.spawnFloatingText(entities, CONFIG.CANVAS_W/2, CONFIG.CANVAS_H/2 - 20,
    'Wave Complete!', '#ffd700');
}

function advanceToNextLevel() {
  ProgressionState.transitioning = false;
  ProgressionState.transitionTimer = 0;
  ProgressionState.drainStartCount = 0;
  if (ProgressionState.currentLevel < LEVEL_CONFIG.length - 1) {
    ProgressionState.currentLevel++;
  }
  GameState.level = ProgressionState.currentLevel + 1;
  resetLevelProgress();
  SpawnManager.applyWaveConfig();
  AudioManager.levelUp();
  // A Wave 10 checkpoint can pause longer than the floating-text lifetime,
  // freezing the old message until Encore resumes. Remove that stale message
  // before adding the next-level announcement so the two never overlap.
  entities.floatingTexts = entities.floatingTexts.filter(text => text?.text !== 'Wave Complete!');
  FXManager.spawnFloatingText(entities, CONFIG.CANVAS_W/2, CONFIG.CANVAS_H/2 - 20,
    `Level ${GameState.level}!`, '#7edd54');

  if (GameState.currentMode === 'standard') {
    const redCount = 1 + (GAME_BALANCE.spawn.redHeartBonus || 0);
    for (let i = 0; i < redCount; i++) {
      const h = EntityFactory.createHeart(60 + i * 20);
      h.x = CONFIG.CANVAS_W * (0.3 + i * 0.2); 
      entities.foods.push(h);
    }
    ProgressionState.heartsSpawnedThisLevel += redCount;

    const blueEvery = GAME_BALANCE.spawn.blueHeartEvery || 2;
    if (blueEvery > 0 && ProgressionState.currentLevel > 0 && ProgressionState.currentLevel % blueEvery === 0) {
      const bh = EntityFactory.createBlueHeart(55);
      bh.x = CONFIG.CANVAS_W / 2;
      entities.foods.push(bh);
    }
  }

  EventBus.emit('levelUp', { level: GameState.level });
}

function applyEquippedCosmeticStats() {
  const currentCharacter = getCharDef();
  const persist = SaveManager.get();
  GameState.runtimeStats = structuredClone(currentCharacter.stats);
  const equipped = persist.equippedCosmetics[currentCharacter.id] || {};

  Object.values(equipped).forEach(cosmeticId => {
    // Generated content must flow through the same catalog as approved native cosmetics.
    // Only legacy/reviewed code may expose a modStats function; generated JSON
    // contributes visual metadata and reviewed effect IDs, never executable code.
    const item = typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getCosmeticDefinition === 'function'
      ? ContentAssetResolver.getCosmeticDefinition(cosmeticId)
      : (typeof COSMETIC_DATA !== 'undefined' ? COSMETIC_DATA.find(c => c.id === cosmeticId) : null);
    const applies = item && (typeof cosmeticAppliesToCharacter === 'function'
      ? cosmeticAppliesToCharacter(item, currentCharacter.id)
      : ((item.applicableTo || []).includes('all') || (item.applicableTo || []).includes(currentCharacter.id)));
    if (applies && typeof applyCosmeticEffects === 'function') {
      applyCosmeticEffects(item, GameState.runtimeStats);
    } else if (applies && typeof item.modStats === 'function') {
      // Compatibility only for an older imported catalog.
      item.modStats(GameState.runtimeStats);
    }
  });
}

const DEFAULT_CHAR_STATE = {
  standardFrogMotion: {
    characterId:'', velocityX:0, facingSign:1, requestedFacing:1,
    facingFrom:1, facingTo:1, facingBlend:1, hysteresisTime:0,
    lean:0, locomotion:0, bobPhase:0,
  },
  specialLocomotion: { characterId:'', velocityX:0, lean:0, locomotion:0, bobPhase:0 },
  bob:     { basketItems:[], bankedItems:0, leaning:false, leanAmt:0, chestAnim:0, depositAnim:0, coinBurst:{ time:0, count:0 } },
  chomper: { chompTimer:0, chompAnimTimer:0, chomping:false, mouthActive:false, combo:0 },
  chameleon:{ catchAnimTimer:0, missAnimTimer:0, rareAnimTimer:0, caughtThisShot:false },
  gulper:  { size:0.6, targetSize:0.6, foodsEaten:0, chomping:false, chompTime:0, eatAnimTimer:0, eatAnimDuration:0.58, mouthHeld:false, mouthClosed:false, growthPulse:0, shrinkPulse:0, breatheTime:0 },
  hippo:   { mouthOpen:0, lunging:false, chompTimer:0, catchCooldown:0 },
  pelican: {
    y:0, pouchFull:0, wingCycle:0,
    catchAnimTimer:0, rareAnimTimer:0,
    catchAnimUntil:0, rareAnimUntil:0,
    flightVx:0, flightVy:0, grounded:false, flightMode:'airborne',
    facingSign:1, facingFrom:1, facingTo:1, facingBlendStartedAt:0,
    bank:0,
  },
  count:   { bloodAnim:0, hissAnim:0, biting:0 },
  flytrap: { cloneX:-1, cloneY:-1, cloneHeld:false, cloneSnapAnim:0, catchAnimTimer:0, rareAnimTimer:0, cloneActionTimer:0, cloneAction:null },
  royal:   { belly:0, streak:0, multiplier:1 },
  ninja:   { jumping:false, jumpT:0, jumpY:0, jumpCatchBonus:0 },
  princess:{ transformTier:0, sparkle:0 },
  toadal: {
    charge:0, grounded:true, supportBlockId:null, velocityY:0, hopActive:false,
    crouchInputHeld:false, crouchHeld:false, crouchChargeSeconds:0, crouchChargeRatio:0,
    lastHopChargeRatio:0, lastHopSpeed:0, pendingTongueSwallow:false,
    eatAnimTimer:0, hurtAnimTimer:0,
    throwAction:{ active:false, elapsed:0, committed:false, reservedCharge:0 },
    buildAction:{ active:false, elapsed:0, committed:false, reservedCharge:0 },
    projectiles:[], blocks:[], nextOwnedEntityId:1, lastCatchSource:'', lastBlockOutcome:'',
  },
};

const GameState = {
  mode: GAME_MODES.MENU,
  currentMode: 'standard',
  // Puzzle Mode uses a dedicated scene token so the protected arcade update
  // loop stays idle while the turn-based board is active.
  screen: 'main',
  currentLevelId: null,
  get isTC()  { return this.currentMode === 'tc'; },
  get isFMF() { return this.currentMode === 'fmf'; },
  get isZen() { return this.currentMode === 'zen'; },
  fmfTimeLeft: 300,
  toadalConsumption: {
    size: getGulperToadalVisualScale(0),
    targetSize: getGulperToadalVisualScale(0),
    mouthClosed: false,
    foodsEaten: 0,
    eatAnimTimer: 0,
    eatAnimDuration: 0.58,
    pendingTargetSize: null,
    growthPulse: 0,
    shrinkPulse: 0,
    breatheTime: 0,
  },
  score: 0,
  level: 1,
  lives: 3,
  maxLives: 5,
  combo: 0,
  activeEvents: [],
  selectedCharacterId: 'classic',
  runtimeStats: null,
  charState: structuredClone(DEFAULT_CHAR_STATE),
};

function hasAbility(characterDef, ability) {
  return characterDef.abilities.includes(ability);
}

// AudioManager now lives in src/runtime/platform/audio-manager.js (loaded earlier, before src/runtime/shared/characters.js).
// The legacy inline oscillator-based AudioManager that used to live here was removed
// to avoid a duplicate `const AudioManager` declaration, which throws a fatal
// SyntaxError and prevents this entire file (and everything after it) from loading.


// NOTE: this used to be called `AchievementManager` and also exposed a
// `check(score, level)` function that duplicated — line for line — the
// achievement-checking and unlock-granting logic that actually runs in
// src/runtime/shared/progression.js (ProgressionManager.checkAndClaimAchievements, wired to
// the 'gameOver' event). That `check()` was never called from anywhere
// in the codebase; it was dead code. Worse, it had no shared bookkeeping
// with src/runtime/shared/progression.js's `achievementRewardsClaimed` list, so if it were
// ever wired up (e.g. by someone "fixing" achievements not firing) every
// achievement would be processed by both systems independently, which is
// exactly the kind of bug that caused characters/cosmetics to get
// unlocked unexpectedly. Removed the dead `check()` entirely.
//
// What's left below is real, still-needed logic: per-run stat trackers
// that write into the save object under underscore-prefixed keys
// (_runMisses, _runBombsWithoutDying, _peakLives) so that achievement
// checks in src/runtime/shared/progression.js (no_miss_level5, survive_5bombs, max_lives_10)
// can read them at game-over time.
const RunStatsTracker = (() => {

  EventBus.on('gameStarted', () => {
    SaveManager.set(d => {
      d._runMisses            = 0;
      d._runBombsWithoutDying = 0;
      d._peakLives            = GameState.lives || 3;
    });
  });

  EventBus.on('playerDamaged', (data) => {
    SaveManager.set(d => {
      const source = data?.source;
      if (ArcadeDamageSource.isMiss(source)) d._runMisses = (d._runMisses || 0) + 1;
      if (ArcadeDamageSource.isBomb(source) && GameState.lives > 0) {
        d._runBombsWithoutDying = (d._runBombsWithoutDying || 0) + 1;
      }
    });
  });

  // Lives only increase through heart/pickup paths, which already emit
  // `heartCaught`. The old foodCaught listener serialized the whole save on
  // every ordinary catch even though the peak could not have changed.
  EventBus.on('heartCaught', () => {
    SaveManager.set(d => {
      const lives = GameState.lives || 0;
      if (lives > (d._peakLives || 0)) d._peakLives = lives;
    });
  });

})();
