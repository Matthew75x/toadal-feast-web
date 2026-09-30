// ============================================================
// src/runtime/app/game-runtime.js — Live runtime state & GameClock
// TWEAK/applyTweaks, entities/frog/tongue state, RuntimeState, GameClock, LiveStats. Split from game.js for modularity.
// ============================================================

let TWEAK = Object.assign({}, TWEAK_DEFAULTS);

// mobileDifficulty defaults to true on touch devices, false on desktop.
// TWEAK_DEFAULTS ships it as true so the setting is preserved in reset(),
// but we flip it off here for non-touch environments before first applyTweaks().
if (!(('ontouchstart' in window) || navigator.maxTouchPoints > 0)) {
  TWEAK.mobileDifficulty = false;
}

function applyTweaks() {
  GAME_BALANCE.spawn.foodSpeedBase        = TWEAK.foodSpeedBase;
  GAME_BALANCE.spawn.foodSpeedRand        = TWEAK.foodSpeedRand;
  GAME_BALANCE.spawn.doubleChance         = TWEAK.doubleChance;
  GAME_BALANCE.spawn.tripleChance         = TWEAK.tripleChance;
  LEVEL_DATA.default.spawnIntervalBase    = TWEAK.spawnIntervalBase;
  LEVEL_DATA.default.bombChance           = TWEAK.bombChance;
  GAME_BALANCE.level.heartSpawnScore      = TWEAK.heartSpawnScore;
  GAME_BALANCE.level.scorePerLevel        = TWEAK.scorePerLevel;
  GAME_BALANCE.scoring.basePointsPerLevel = TWEAK.basePointsPerLevel;
  CONFIG.FROG_SPEED                       = TWEAK.frogSpeed;
  GAME_BALANCE.invincible                 = TWEAK.invincible;
  GAME_BALANCE.showHitboxes               = TWEAK.showHitboxes;
  GAME_BALANCE.showFoodRadius             = TWEAK.showFoodRadius;
  GAME_BALANCE.showTouchZone              = TWEAK.showTouchZone;
  GAME_BALANCE.modelScale                 = TWEAK.modelScale;
  GAME_BALANCE.showLiveStats              = !!TWEAK.showLiveStats;
  GAME_BALANCE.showGameClock              = !!TWEAK.showGameClock;
  // FEAST FRENZY owns its authored mode-specific spawn bucket. Standard
  // Live Tweak values must never rewrite TC pacing or inject Standard triples.
  // Reset all per-level ramp values from TWEAK first so repeated applyTweaks()
  // calls always start from the clean TWEAK base — never compounding multipliers.
  LEVEL_DATA.perLevel.speedMultInc        = TWEAK.speedMultInc;
  LEVEL_DATA.perLevel.spawnIntervalDec    = TWEAK.spawnIntervalDec;
  LEVEL_DATA.perLevel.spawnIntervalMin    = TWEAK.spawnIntervalMin;
  LEVEL_DATA.perLevel.bombChanceInc       = Number.isFinite(Number(TWEAK.bombChanceInc)) ? Number(TWEAK.bombChanceInc) : ARCADE_TUNING_DEFAULTS.bombChanceInc;
  LEVEL_DATA.perLevel.bombChanceCap       = Number.isFinite(Number(TWEAK.bombChanceCap)) ? Number(TWEAK.bombChanceCap) : ARCADE_TUNING_DEFAULTS.bombChanceCap;
  GAME_BALANCE.royal.streakTier           = TWEAK.streakTier;
  GAME_BALANCE.royal.multiplierMax        = TWEAK.streakBonusMax;
  GAME_BALANCE.spawn.blueHeartChance       = TWEAK.blueHeartChance;
  GAME_BALANCE.spawn.redHeartBonus         = TWEAK.redHeartBonus;
  GAME_BALANCE.spawn.blueHeartEvery        = TWEAK.blueHeartEvery;
  GAME_BALANCE.spawn.powerUpChance         = TWEAK.powerUpChance;
  GAME_BALANCE.spawn.powerUpMinLevel       = TWEAK.powerUpMinLevel;

  // Zen keeps Standard base speed/interval intact. Its two pacing multipliers
  // live in the Zen bucket and are applied exactly once by SpawnManager.
  GAME_BALANCE.zen.foodSpeedMult = Math.max(0.10, Number(TWEAK.zenFoodSpeedMult) || Number(TWEAK_DEFAULTS.zenFoodSpeedMult) || 0.58);
  GAME_BALANCE.zen.spawnIntervalMult = Math.max(0.10, Number(TWEAK.zenSpawnIntervalMult) || Number(TWEAK_DEFAULTS.zenSpawnIntervalMult) || 1.60);

  // Central Arcade tuning authority. Live Tweak writes TWEAK; production code
  // reads this compact bucket so food density, bombs, speed, and touch comfort
  // remain independent levers instead of hidden platform multipliers.
  const _arcadeTuning = GAME_BALANCE.arcadeTuning;
  _arcadeTuning.foodSpawnRateMult = Math.max(0.10, Number(TWEAK.foodSpawnRateMult) || ARCADE_TUNING_DEFAULTS.foodSpawnRateMult);
  _arcadeTuning.maxConcurrentFood = Math.max(0, Math.floor(Number(TWEAK.maxConcurrentFood) || 0));
  _arcadeTuning.fallSpeedMult = Math.max(0.25, Number(TWEAK.fallSpeedMult) || ARCADE_TUNING_DEFAULTS.fallSpeedMult);
  _arcadeTuning.bombRateMult = Math.max(0, Number(TWEAK.bombRateMult) || 0);
  _arcadeTuning.bombStartLevel = Math.max(1, Math.floor(Number(TWEAK.bombStartLevel) || ARCADE_TUNING_DEFAULTS.bombStartLevel));
  _arcadeTuning.bombChanceInc = Math.max(0, Number(TWEAK.bombChanceInc) || 0);
  _arcadeTuning.bombChanceCap = Math.max(0, Math.min(1, Number(TWEAK.bombChanceCap) || 0));
  _arcadeTuning.maxConcurrentBombs = Math.max(0, Math.floor(Number(TWEAK.maxConcurrentBombs) || 0));
  _arcadeTuning.mobileFoodSpawnRateMult = Math.max(0.10, Number(TWEAK.mobileFoodSpawnRateMult) || ARCADE_TUNING_DEFAULTS.mobileFoodSpawnRateMult);
  _arcadeTuning.mobileMaxConcurrentFood = Math.max(0, Math.floor(Number(TWEAK.mobileMaxConcurrentFood) || 0));
  _arcadeTuning.mobileReachabilityMaxJumpRatio = Math.max(0.20, Math.min(1, Number(TWEAK.mobileReachabilityMaxJumpRatio) || ARCADE_TUNING_DEFAULTS.mobileReachabilityMaxJumpRatio));

  // ── Mobile comfort layer ────────────────────────────────────────────────
  // Touch comfort now changes ONLY density/reachability through the centralized
  // Arcade tuning bucket consumed by SpawnManager. It deliberately does not
  // reduce fall speed or bomb frequency, so mobile remains the same game while
  // receiving more thumb-friendly pacing when the setting is enabled.

  // Mobile controls visibility (desktop-only toggle; touch devices always get them during play)
  if (GameState && GameState.mode === GAME_MODES.PLAYING) {
    const _isTouch2 = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const mc = document.getElementById('mobileControls');
    if (mc && !_isTouch2) {
      if (TWEAK.showMobileControls) mc.classList.add('visible');
      else mc.classList.remove('visible');
    }
  }
}
applyTweaks();


let entities = { foods:[], particles:[], floatingTexts:[] };
let frog = { x:CONFIG.CANVAS_W/2, y:CONFIG.CANVAS_H-80, mouthOpen:0, isMoving:false, moveDir:0, facing:1, moveY:0, stepCycle:0, lastX:CONFIG.CANVAS_W/2 };
function createTongueAttackState() {
  return {
    active: false,
    x: 0,
    y: 0,
    tip: 0,
    catching: false,
    phase: 'idle',
    originXOffset: 0,
    originYOffset: 0,
    reachCompensation: 0,
    contactTimer: 0,
    capturedFood: null,
    captureRotation: 0,
    impact: 0,
    swallowTimer: 0,
    shotId: 0,
  };
}

let tongue = createTongueAttackState();

function resetTongueAttackState() {
  const nextShotId = Number(tongue?.shotId || 0);
  Object.assign(tongue, createTongueAttackState(), { shotId: nextShotId });
  return tongue;
}
const RuntimeState = {
  shakeTime: 0, lastTime: 0, frogAnim: 0, tongueWobble: 0,
  heartSpawned: false, lastHeartLevel: 0,
  ghostTime: 0,   // seconds of post-damage invincibility remaining (SETTINGS.ghostFrames)
};


// Shared Arcade feedback replaces character-specific hurt, normal-catch, and
// game-over body clips. It is deliberately renderer-agnostic so sprite,
// portrait/hybrid, and Canvas characters receive the same readable response.
const ArcadePresentationFeedback = (() => {
  const state = {
    spawn: 0,
    catch: 0,
    damage: 0,
    miss: 0,
    gameOver: 0,
    damageSource: '',
  };
  const durations = Object.freeze({ spawn: 0.32, catch: 0.18, damage: 0.28, miss: 0.26, gameOver: 0.6 });

  function reset() {
    state.spawn = state.catch = state.damage = state.miss = state.gameOver = 0;
    state.damageSource = '';
  }

  function tick(dt) {
    const safeDt = Math.max(0, Math.min(0.1, Number(dt) || 0));
    for (const key of ['spawn', 'catch', 'damage', 'miss', 'gameOver']) {
      state[key] = Math.max(0, Number(state[key] || 0) - safeDt);
    }
  }

  function trigger(kind, source = '') {
    if (!(kind in durations)) return;
    state[kind] = Math.max(Number(state[kind] || 0), durations[kind]);
    if (kind === 'damage') state.damageSource = String(source || 'damage');
  }

  function transform(characterId = '') {
    const reduceMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const allowBodyScalePulse = String(characterId || '') !== 'classic';
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0, rotation = 0, alpha = 1;

    if (state.spawn > 0) {
      const t = 1 - state.spawn / durations.spawn;
      const overshoot = 1 + 1.6 * Math.pow(t - 1, 3) + 0.6 * Math.pow(t - 1, 2);
      const s = reduceMotion ? Math.min(1, t * 1.4) : Math.max(0.02, overshoot);
      if (allowBodyScalePulse) {
        scaleX *= s; scaleY *= s;
      }
      alpha *= Math.min(1, t * 2.2);
    }

    if (state.catch > 0 && !reduceMotion && allowBodyScalePulse) {
      const t = state.catch / durations.catch;
      const pulse = Math.sin(Math.PI * (1 - t));
      scaleX *= 1 + pulse * 0.045;
      scaleY *= 1 - pulse * 0.025;
    }

    if (state.damage > 0) {
      const t = state.damage / durations.damage;
      const envelope = t * t;
      if (!reduceMotion) {
        offsetX += Math.sin((1 - t) * Math.PI * 8) * 5 * envelope;
        rotation += Math.sin((1 - t) * Math.PI * 5) * 0.045 * envelope;
        if (allowBodyScalePulse) {
          scaleX *= 1 + 0.08 * envelope;
          scaleY *= 1 - 0.10 * envelope;
        }
      }
    }

    if (state.gameOver > 0 && !reduceMotion) {
      const t = 1 - state.gameOver / durations.gameOver;
      offsetY += 10 * t * t;
      rotation += 0.08 * t * t;
    }

    return { scaleX, scaleY, offsetX, offsetY, rotation, alpha };
  }

  function draw(ctx, x, y, accent = '#ffffff') {
    if (!ctx) return;
    if (state.catch > 0) {
      const t = state.catch / durations.catch;
      ctx.save();
      ctx.globalAlpha = Math.max(0, t) * 0.55;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 28, 18 + (1 - t) * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (state.damage > 0) {
      const t = state.damage / durations.damage;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 2.5);
      ctx.fillStyle = '#ffdf4a';
      ctx.strokeStyle = '#3a2410';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 24, y - 62, 12, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2410';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', x + 24, y - 61);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(0.32, t * 0.32);
      ctx.fillStyle = '#ff5b5b';
      ctx.fillRect(0, 0, ctx.canvas?.width || 0, ctx.canvas?.height || 0);
      ctx.restore();
    }
    if (state.miss > 0) {
      const t = state.miss / durations.miss;
      const progress = 1 - t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t * 2.4));
      ctx.strokeStyle = '#ff6b6b';
      ctx.fillStyle = '#ffb0b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const missY = (ctx.canvas?.height || y + 80) - 24;
      ctx.moveTo(x - 9, missY - 9 + progress * 5);
      ctx.lineTo(x + 9, missY + 9 + progress * 5);
      ctx.moveTo(x + 9, missY - 9 + progress * 5);
      ctx.lineTo(x - 9, missY + 9 + progress * 5);
      ctx.stroke();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('COMBO LOST', x, missY - 17 + progress * 5);
      ctx.restore();
    }
    if (state.gameOver > 0) {
      const t = state.gameOver / durations.gameOver;
      const width = ctx.canvas?.width || 0;
      const height = ctx.canvas?.height || 0;
      ctx.save();
      const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.68);
      vignette.addColorStop(0, 'rgba(20,24,30,0)');
      vignette.addColorStop(1, `rgba(8,10,16,${0.58 * (1 - t)})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = Math.min(1, (1 - t) * 2.5);
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#d8e2eb';
      ctx.fillText('×  ×', x, y - 58);
      ctx.restore();
    }
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('gameStarted', () => { reset(); trigger('spawn'); });
    EventBus.on('foodCaught', () => trigger('catch'));
    EventBus.on('playerDamaged', data => {
      trigger('damage', data?.source || 'damage');
      if (data?.source === 'miss') trigger('miss');
    });
    EventBus.on('gameOver', () => trigger('gameOver'));
  }

  return Object.freeze({ state, durations, reset, tick, trigger, transform, draw });
})();

// ── Game Clock ────────────────────────────────────────────────────────────
const GameClock = (() => {
  let _elapsed = 0;   // seconds since game start (only ticks while PLAYING)
  let _running = false;

  function reset()  { _elapsed = 0; _running = false; }
  function start()  { _running = true; }
  function pause()  { _running = false; }
  function resume() { _running = true; }
  function tick(dt) { if (_running) _elapsed += dt; }

  function getElapsed() { return _elapsed; }
  function format() {
    const total = Math.floor(_elapsed);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  EventBus.on('gameStarted', () => { reset(); start(); });
  EventBus.on('gameOver',    () => pause());

  return { reset, start, pause, resume, tick, getElapsed, format };
})();
// ── Arcade visual-time and character animation runtime ───────────────────
// Sprite playback advances once per visible browser frame from raw real time.
// It is deliberately independent from GameClock, debug speed multipliers, and
// fixed simulation substeps. RuntimeState.frogAnim remains a compatibility
// mirror for older procedural effects; new animation code uses this clock.
const ArcadeAnimationClock = (() => {
  const MAX_DELTA_SECONDS = 0.10;
  let elapsed = 0;
  let running = false;
  let labPaused = false;

  function syncLegacyClock() {
    RuntimeState.frogAnim = elapsed * 3;
  }
  function reset(value = 0) {
    elapsed = Math.max(0, Number(value) || 0);
    running = false;
    labPaused = false;
    syncLegacyClock();
  }
  function start() { running = true; }
  function pause() { running = false; }
  function resume() { running = true; }
  function tick(rawDeltaSeconds) {
    const safe = Math.min(MAX_DELTA_SECONDS, Math.max(0, Number(rawDeltaSeconds) || 0));
    if (running && !labPaused && safe > 0) {
      elapsed += safe;
      syncLegacyClock();
    }
    return safe;
  }
  function getElapsed() { return elapsed; }
  function setElapsed(value) {
    elapsed = Math.max(0, Number(value) || 0);
    syncLegacyClock();
    return elapsed;
  }
  function step(seconds) {
    elapsed += Math.max(0, Number(seconds) || 0);
    syncLegacyClock();
    return elapsed;
  }
  function setLabPaused(value) { labPaused = Boolean(value); return labPaused; }
  function isLabPaused() { return labPaused; }
  function isRunning() { return running; }

  EventBus.on('gameStarted', () => { reset(); start(); });
  EventBus.on('gameOver', () => pause());

  return Object.freeze({
    MAX_DELTA_SECONDS,
    reset, start, pause, resume, tick, getElapsed, setElapsed, step,
    setLabPaused, isLabPaused, isRunning,
  });
})();

// Temporary authoring overrides live in localStorage. Accepted timing remains
// in content/arcade/character-animation-registry.json and must be regenerated.
const CharacterAnimationTuning = (() => {
  const STORAGE_KEY = 'froggyFeast.characterAnimationTiming.v2';
  const LIMITS = Object.freeze({ min: 0.5, max: 24, step: 0.25 });
  const registry = Object.create(null);
  const renderers = Object.create(null);
  const overrides = Object.create(null);
  const manualFrames = Object.create(null);

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function clampFps(value, fallback = 8) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(LIMITS.min, Math.min(LIMITS.max, Math.round(n / LIMITS.step) * LIMITS.step));
  }
  function sanitizeFrames(value, fallback) {
    if (!Array.isArray(value) || !value.length) return [...fallback];
    const out = value.map(v => Math.max(0, Math.floor(Number(v) || 0)));
    return out.length ? out : [...fallback];
  }
  function sanitizeDurations(value, count, fallbackMs) {
    if (!Array.isArray(value) || value.length !== count) return Array(count).fill(fallbackMs);
    return value.map(v => Math.max(16, Math.min(10000, Number(v) || fallbackMs)));
  }
  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      for (const [cid, actions] of Object.entries(parsed || {})) {
        overrides[cid] = Object.create(null);
        for (const [aid, data] of Object.entries(actions || {})) {
          if (data && typeof data === 'object') overrides[cid][aid] = clone(data);
        }
      }
    } catch (_) {}
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch (_) {}
  }
  function register(characterId, definitions, displayName = characterId) {
    registry[characterId] = Object.freeze({
      id: characterId,
      displayName: String(displayName || characterId),
      definitions,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('character-animation-registry-change', { detail: { characterId } }));
    }
  }
  function registerRenderer(characterId, renderer) {
    if (renderer && typeof renderer === 'object') renderers[characterId] = renderer;
    else delete renderers[characterId];
  }
  function getRenderer(characterId) { return renderers[characterId] || null; }
  function definition(characterId, animationId) {
    return registry[characterId]?.definitions?.[animationId] || null;
  }
  function actionOverride(characterId, animationId) {
    return overrides[characterId]?.[animationId] || null;
  }
  function defaultSourceFrames(characterId, animationId) {
    const def = definition(characterId, animationId);
    return def?.sourceFrames?.length ? [...def.sourceFrames] : Array.from({ length: Math.max(1, Number(def?.frames || 1)) }, (_, i) => i);
  }
  function getSourceFrames(characterId, animationId) {
    const base = defaultSourceFrames(characterId, animationId);
    return sanitizeFrames(actionOverride(characterId, animationId)?.sourceFrames, base);
  }
  function defaultFps(characterId, animationId, fallback = 8) {
    return clampFps(definition(characterId, animationId)?.fps, fallback);
  }
  function getFps(characterId, animationId, fallback = 8) {
    const value = actionOverride(characterId, animationId)?.fps;
    return value == null ? defaultFps(characterId, animationId, fallback) : clampFps(value, fallback);
  }
  function defaultFrameDurations(characterId, animationId) {
    const def = definition(characterId, animationId);
    const frames = defaultSourceFrames(characterId, animationId);
    if (Array.isArray(def?.frameDurationsMs) && def.frameDurationsMs.length === frames.length) return [...def.frameDurationsMs];
    return Array(frames.length).fill(1000 / Math.max(0.01, defaultFps(characterId, animationId, 8)));
  }
  function getFrameDurations(characterId, animationId) {
    const frames = getSourceFrames(characterId, animationId);
    const override = actionOverride(characterId, animationId);
    if (override?.mode === 'perFrame') {
      return sanitizeDurations(override.frameDurationsMs, frames.length, 1000 / getFps(characterId, animationId, 8));
    }
    if (override?.mode === 'fps') return Array(frames.length).fill(1000 / getFps(characterId, animationId, 8));
    const defaults = defaultFrameDurations(characterId, animationId);
    return defaults.length === frames.length ? defaults : Array(frames.length).fill(1000 / defaultFps(characterId, animationId, 8));
  }
  function getMode(characterId, animationId) {
    const override = actionOverride(characterId, animationId);
    if (override?.mode) return override.mode;
    const def = definition(characterId, animationId);
    return Array.isArray(def?.frameDurationsMs) ? 'perFrame' : 'fps';
  }
  function ensureOverride(characterId, animationId) {
    if (!overrides[characterId]) overrides[characterId] = Object.create(null);
    if (!overrides[characterId][animationId]) overrides[characterId][animationId] = {};
    return overrides[characterId][animationId];
  }
  function emit(characterId, animationId) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('character-animation-tuning-change', { detail: { characterId, animationId } }));
    }
  }
  function setFps(characterId, animationId, fps) {
    const entry = ensureOverride(characterId, animationId);
    entry.mode = 'fps';
    entry.fps = clampFps(fps, defaultFps(characterId, animationId, 8));
    delete entry.frameDurationsMs;
    persist(); emit(characterId, animationId);
    return entry.fps;
  }
  function setFrameDurations(characterId, animationId, durations) {
    const entry = ensureOverride(characterId, animationId);
    const frames = getSourceFrames(characterId, animationId);
    entry.mode = 'perFrame';
    entry.frameDurationsMs = sanitizeDurations(durations, frames.length, 1000 / getFps(characterId, animationId, 8));
    persist(); emit(characterId, animationId);
    return [...entry.frameDurationsMs];
  }
  function setSourceFrames(characterId, animationId, frames) {
    const entry = ensureOverride(characterId, animationId);
    entry.sourceFrames = sanitizeFrames(frames, defaultSourceFrames(characterId, animationId));
    if (entry.mode === 'perFrame') {
      entry.frameDurationsMs = sanitizeDurations(entry.frameDurationsMs, entry.sourceFrames.length, 1000 / getFps(characterId, animationId, 8));
    }
    persist(); emit(characterId, animationId);
    return [...entry.sourceFrames];
  }
  function clearAction(characterId, animationId) {
    if (overrides[characterId]) {
      delete overrides[characterId][animationId];
      if (!Object.keys(overrides[characterId]).length) delete overrides[characterId];
      persist();
    }
    emit(characterId, animationId);
  }
  function resetCharacter(characterId) {
    delete overrides[characterId];
    persist(); emit(characterId, '*');
  }
  function duration(characterId, animationId) {
    return getFrameDurations(characterId, animationId).reduce((sum, ms) => sum + ms, 0) / 1000;
  }
  function setManualFrame(characterId, animationId, frameIndex = null) {
    const key = `${characterId}:${animationId}`;
    if (frameIndex == null) delete manualFrames[key];
    else manualFrames[key] = Math.max(0, Math.floor(Number(frameIndex) || 0));
    emit(characterId, animationId);
  }
  function getManualFrame(characterId, animationId) {
    const value = manualFrames[`${characterId}:${animationId}`];
    return value == null ? null : value;
  }
  function listCharacters() {
    return Object.values(registry).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  function exportAction(characterId, animationId) {
    const def = definition(characterId, animationId) || {};
    const frames = getSourceFrames(characterId, animationId);
    const durations = getFrameDurations(characterId, animationId).map(ms => Math.round(ms));
    return {
      characterId,
      animationId,
      sourceFrames: frames,
      frameDurationsMs: durations,
      loop: Boolean(def.loop),
      next: def.next || null,
    };
  }

  function initPanel(force = false) {
    if (typeof document === 'undefined' || document.getElementById('characterAnimationTimingPanel')) return;
    const isDevSurface = globalThis.FROGGY_DEV_SURFACE === true;
    const allowed = isDevSurface && (force || new URLSearchParams(location.search).get('dev') === '1'
      || (typeof SaveManager !== 'undefined' && SaveManager.get?.().devModeUnlocked));
    if (!allowed) return;
    const panel = document.createElement('section');
    panel.id = 'characterAnimationTimingPanel';
    panel.className = 'collapsed';
    panel.innerHTML = `<style>
#characterAnimationTimingPanel{position:fixed;right:max(12px,var(--full-dev-right-offset,12px));top:12px;z-index:99999;width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:12px;border:1px solid rgba(255,255,255,.25);border-radius:14px;background:rgba(8,17,29,.96);color:#f3f7ff;font:13px/1.35 system-ui;box-shadow:0 12px 35px rgba(0,0,0,.38)}
#characterAnimationTimingPanel.collapsed .timing-body{display:none}#characterAnimationTimingPanel header{display:flex;justify-content:space-between;align-items:center}#characterAnimationTimingPanel h2{font-size:14px;margin:0}#characterAnimationTimingPanel button,#characterAnimationTimingPanel select,#characterAnimationTimingPanel input,#characterAnimationTimingPanel textarea{font:inherit}#characterAnimationTimingPanel button{border:1px solid rgba(255,255,255,.22);border-radius:8px;background:#17283d;color:#fff;padding:5px 8px;cursor:pointer}#characterAnimationTimingPanel label{display:grid;grid-template-columns:100px 1fr;gap:8px;align-items:center;margin:8px 0}#characterAnimationTimingPanel select,#characterAnimationTimingPanel input,#characterAnimationTimingPanel textarea{width:100%;box-sizing:border-box;background:#0f2135;color:#fff;border:1px solid #52677e;border-radius:7px;padding:5px}#characterAnimationTimingPanel textarea{min-height:48px;resize:vertical}#characterAnimationTimingPanel .row{display:flex;gap:6px;flex-wrap:wrap}#characterAnimationTimingPanel small{color:#b8c5d7;display:block;margin-top:5px}
</style><header><h2>Character animation timing lab</h2><button data-collapse type="button">Show</button></header><div class="timing-body">
<label><span>Character</span><select data-character></select></label><label><span>Clip</span><select data-animation></select></label><label><span>Mode</span><select data-mode><option value="fps">Constant FPS</option><option value="perFrame">Per-frame ms</option></select></label>
<label><span>FPS</span><input data-fps type="number" min="${LIMITS.min}" max="${LIMITS.max}" step="${LIMITS.step}"></label><label><span>Frames</span><textarea data-frames></textarea></label><label><span>Durations</span><textarea data-durations></textarea></label>
<div class="row"><button data-play type="button">Pause visual</button><button data-prev type="button">Previous frame</button><button data-next type="button">Next frame</button><button data-live type="button">Live playback</button></div>
<div class="row" style="margin-top:7px"><button data-apply type="button">Apply temporary</button><button data-default type="button">Restore clip</button><button data-reset type="button">Reset character</button><button data-export type="button">Export JSON</button></div><small data-readout></small><small>Temporary edits stay local. Commit accepted values to the canonical registry JSON.</small></div>`;
    document.body.appendChild(panel);
    const q = selector => panel.querySelector(selector);
    const charSelect = q('[data-character]');
    const animationSelect = q('[data-animation]');
    const modeSelect = q('[data-mode]');
    const fpsInput = q('[data-fps]');
    const framesInput = q('[data-frames]');
    const durationsInput = q('[data-durations]');
    const readout = q('[data-readout]');
    let manualIndex = null;

    function rendererFor(id) { return getRenderer(id); }
    function parseList(text) {
      const parsed = JSON.parse(String(text || '[]'));
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array.');
      return parsed;
    }
    function refreshCharacters() {
      const old = charSelect.value;
      const characters = listCharacters();
      charSelect.innerHTML = characters.map(c => `<option value="${c.id}">${c.displayName}</option>`).join('');
      const selected = typeof GameState !== 'undefined' ? GameState.selectedCharacterId : '';
      charSelect.value = registry[old] ? old : registry[selected] ? selected : characters[0]?.id || '';
      refreshAnimations();
    }
    function refreshAnimations() {
      const old = animationSelect.value;
      const defs = registry[charSelect.value]?.definitions || {};
      animationSelect.innerHTML = Object.entries(defs).map(([id, d]) => `<option value="${id}">${id} · ${(d.sourceFrames?.length || d.frames || 1)}f · ${d.category || 'other'}</option>`).join('');
      if (defs[old]) animationSelect.value = old;
      rendererFor(charSelect.value)?.setForcedAnimation?.(animationSelect.value || null);
      manualIndex = null;
      refresh();
    }
    function refresh() {
      const cid = charSelect.value, aid = animationSelect.value, def = definition(cid, aid);
      if (!def) return;
      modeSelect.value = getMode(cid, aid);
      fpsInput.value = String(getFps(cid, aid, def.fps || 8));
      framesInput.value = JSON.stringify(getSourceFrames(cid, aid));
      durationsInput.value = JSON.stringify(getFrameDurations(cid, aid).map(ms => Math.round(ms)));
      durationsInput.disabled = modeSelect.value !== 'perFrame';
      readout.textContent = `${duration(cid, aid).toFixed(2)}s · ${def.loop ? 'loop' : 'one-shot'} · ${def.approval || 'unreviewed'}${manualIndex == null ? '' : ` · manual frame ${manualIndex + 1}`}`;
    }
    function setManual(next) {
      const cid = charSelect.value, aid = animationSelect.value, count = getSourceFrames(cid, aid).length;
      manualIndex = Math.max(0, Math.min(count - 1, next));
      setManualFrame(cid, aid, manualIndex);
      ArcadeAnimationClock.setLabPaused(true);
      q('[data-play]').textContent = 'Resume visual';
      refresh();
    }
    q('[data-collapse]').onclick = () => {
      panel.classList.toggle('collapsed');
      q('[data-collapse]').textContent = panel.classList.contains('collapsed') ? 'Show' : 'Hide';
    };
    charSelect.onchange = refreshAnimations;
    animationSelect.onchange = () => { rendererFor(charSelect.value)?.setForcedAnimation?.(animationSelect.value); manualIndex = null; refresh(); };
    modeSelect.onchange = refresh;
    q('[data-play]').onclick = () => {
      const paused = ArcadeAnimationClock.setLabPaused(!ArcadeAnimationClock.isLabPaused());
      q('[data-play]').textContent = paused ? 'Resume visual' : 'Pause visual';
      if (!paused) { manualIndex = null; setManualFrame(charSelect.value, animationSelect.value, null); }
    };
    q('[data-prev]').onclick = () => setManual((manualIndex == null ? 0 : manualIndex) - 1);
    q('[data-next]').onclick = () => setManual((manualIndex == null ? -1 : manualIndex) + 1);
    q('[data-live]').onclick = () => { manualIndex = null; setManualFrame(charSelect.value, animationSelect.value, null); ArcadeAnimationClock.setLabPaused(false); q('[data-play]').textContent = 'Pause visual'; refresh(); };
    q('[data-apply]').onclick = () => {
      try {
        const cid = charSelect.value, aid = animationSelect.value;
        setSourceFrames(cid, aid, parseList(framesInput.value));
        if (modeSelect.value === 'perFrame') setFrameDurations(cid, aid, parseList(durationsInput.value));
        else setFps(cid, aid, fpsInput.value);
        rendererFor(cid)?.setForcedAnimation?.(aid);
        refresh();
      } catch (error) { readout.textContent = `Invalid timing data: ${error.message}`; }
    };
    q('[data-default]').onclick = () => { clearAction(charSelect.value, animationSelect.value); refresh(); };
    q('[data-reset]').onclick = () => { resetCharacter(charSelect.value); refresh(); };
    q('[data-export]').onclick = () => {
      const payload = JSON.stringify(exportAction(charSelect.value, animationSelect.value), null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${charSelect.value}-${animationSelect.value}-timing.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 0);
    };
    window.addEventListener('character-animation-registry-change', refreshCharacters);
    window.addEventListener('character-animation-tuning-change', refresh);
    refreshCharacters();
  }

  // Authoring overrides are dev/test-owned (EC-9 Phase 3): the shipping player
  // profile never reads locally-stored tuning overrides — the generated
  // registry defaults are the only production animation timing authority.
  if (globalThis.FROGGY_DEV_SURFACE === true) load();
  return Object.freeze({
    LIMITS, register, registerRenderer, getRenderer, definition, getMode, getFps, getSourceFrames, getFrameDurations,
    setFps, setSourceFrames, setFrameDurations, clearAction, resetCharacter,
    duration, setManualFrame, getManualFrame, listCharacters, exportAction, initPanel,
  });
})();

const ArcadeAnimationRuntime = (() => {
  function registryClip(characterId, clipId) {
    if (typeof CharacterAnimationTuning !== 'undefined' && typeof CharacterAnimationTuning.definition === 'function') {
      const effective = CharacterAnimationTuning.definition(characterId, clipId);
      if (effective) return effective;
    }
    return typeof ArcadeAnimationRegistry !== 'undefined' ? ArcadeAnimationRegistry.clip(characterId, clipId) : null;
  }
  function sourceFrames(characterId, clipId) {
    const def = registryClip(characterId, clipId);
    if (!def) return [0];
    return CharacterAnimationTuning.getSourceFrames(characterId, clipId);
  }
  function frameDurations(characterId, clipId) {
    return CharacterAnimationTuning.getFrameDurations(characterId, clipId);
  }
  function durationSeconds(characterId, clipId) {
    return frameDurations(characterId, clipId).reduce((sum, ms) => sum + ms, 0) / 1000;
  }
  function frameIndexFor(characterId, clipId, elapsedSeconds) {
    const frames = sourceFrames(characterId, clipId);
    const manual = CharacterAnimationTuning.getManualFrame(characterId, clipId);
    if (manual != null) return frames[Math.max(0, Math.min(frames.length - 1, manual))] || 0;
    const def = registryClip(characterId, clipId) || {};
    const durations = frameDurations(characterId, clipId);
    const totalMs = durations.reduce((sum, ms) => sum + ms, 0) || 1;
    let elapsedMs = Math.max(0, Number(elapsedSeconds) || 0) * 1000;
    if (def.loop) elapsedMs %= totalMs;
    else elapsedMs = Math.min(totalMs - 0.001, elapsedMs);
    let cursor = 0;
    for (let i = 0; i < durations.length; i++) {
      cursor += durations[i];
      if (elapsedMs < cursor) return frames[i] ?? frames[frames.length - 1] ?? 0;
    }
    return frames[frames.length - 1] ?? 0;
  }
  function createController(characterId, fallbackClip) {
    let activeId = fallbackClip;
    let startedAt = ArcadeAnimationClock.getElapsed();
    let queuedId = null;
    let completedCount = 0;
    let completionHandler = null;

    function def(id = activeId) { return registryClip(characterId, id); }
    function activate(id, now, reason = 'request') {
      if (!def(id)) id = fallbackClip;
      const previous = activeId;
      activeId = id;
      startedAt = now;
      if (previous !== activeId && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('arcade-animation-change', { detail: { characterId, previous, activeId, reason } }));
      }
      return activeId;
    }
    function elapsed(now = ArcadeAnimationClock.getElapsed()) { return Math.max(0, now - startedAt); }
    function completeIfNeeded(now = ArcadeAnimationClock.getElapsed()) {
      const current = def();
      if (!current || current.loop || elapsed(now) < durationSeconds(characterId, activeId)) return false;
      const completed = activeId;
      completedCount++;
      const next = current.next && def(current.next) ? current.next : (queuedId && def(queuedId) ? queuedId : fallbackClip);
      queuedId = null;
      activate(next, now, 'complete');
      completionHandler?.({ characterId, completed, next, completedCount, now });
      return true;
    }
    function canInterrupt(incomingId, force = false) {
      if (force) return true;
      const current = def();
      if (!current || current.loop) return true;
      if (completeIfNeeded()) return true;
      const incoming = def(incomingId);
      if (!incoming) return false;
      if (current.interruptPolicy === 'always') return true;
      if (current.interruptPolicy === 'never') return false;
      return Number(incoming.priority || 0) > Number(current.priority || 0);
    }
    function request(id, options = {}) {
      const now = options.now ?? ArcadeAnimationClock.getElapsed();
      completeIfNeeded(now);
      if (!def(id)) id = fallbackClip;
      if (id === activeId) return activeId;
      if (!canInterrupt(id, Boolean(options.force))) {
        queuedId = id;
        return activeId;
      }
      return activate(id, now, options.reason || 'request');
    }
    function force(id) { queuedId = null; return activate(id || fallbackClip, ArcadeAnimationClock.getElapsed(), 'force'); }
    function snapshot(now = ArcadeAnimationClock.getElapsed()) {
      completeIfNeeded(now);
      return Object.freeze({
        characterId,
        activeId,
        queuedId,
        startedAt,
        elapsed: elapsed(now),
        frame: frameIndexFor(characterId, activeId, elapsed(now)),
        completedCount,
      });
    }
    function setCompletionHandler(handler) { completionHandler = typeof handler === 'function' ? handler : null; }
    function reset(id = fallbackClip) { queuedId = null; completedCount = 0; activate(id, ArcadeAnimationClock.getElapsed(), 'reset'); }
    return Object.freeze({ request, force, snapshot, reset, setCompletionHandler, completeIfNeeded });
  }
  return Object.freeze({ sourceFrames, frameDurations, durationSeconds, frameIndexFor, createController });
})();


const LiveStats = {
  level: 1, score: 0, misses: 0, bombsCaught: 0, heartsCaught: 0, foodsCaught: 0,
  foodsSpawned: 0, bombsSpawned: 0, heartsSpawned: 0, powerupsSpawned: 0,
  totalDamageEvents: 0, lastDamageTime: 0, fps: 0, _frameCount: 0, _lastFpsSample: performance.now()
};

function resetLiveStats() {
  LiveStats.level = 1; LiveStats.score = 0; LiveStats.misses = 0;
  LiveStats.bombsCaught = 0; LiveStats.heartsCaught = 0; LiveStats.foodsCaught = 0;
  LiveStats.foodsSpawned = 0; LiveStats.bombsSpawned = 0; LiveStats.heartsSpawned = 0; LiveStats.powerupsSpawned = 0;
  LiveStats.totalDamageEvents = 0; LiveStats.lastDamageTime = 0;
}

function formatSeconds(ms) {
  if (!ms) return '—';
  return (ms / 1000).toFixed(1) + 's';
}

function updateLiveStatsFps(now) {
  LiveStats._frameCount++;
  if (now - LiveStats._lastFpsSample >= 500) {
    LiveStats.fps = (LiveStats._frameCount * 1000) / (now - LiveStats._lastFpsSample);
    LiveStats._frameCount = 0;
    LiveStats._lastFpsSample = now;
  }
}


// ── Tweak Schema (Extracted Globally) ─────────────────────────────────────
