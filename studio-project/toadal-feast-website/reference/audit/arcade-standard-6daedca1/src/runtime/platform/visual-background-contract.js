// src/runtime/platform/visual-background-contract.js — Froggy Feast-owned consumer contract for UVR.
// This file contains only structured-cloneable host data and game-to-background
// translation metadata. It does not implement UVR, a renderer, a pack, shaders,
// workers, scene documents, or any gameplay authority.
'use strict';

const FroggyFeastVisualContract = (() => {
  const SCHEMA = 'froggy-feast/visual-host@1';
  const MASTER_PLAN = Object.freeze({
    id: 'uvr/product-foundation-master-plan@1.3',
    status: 'final',
    sha256: '1fbf738d59bc829d185863450ff7efe808b8b81751b6b0a8ec2d6284935eb764',
  });

  const SURFACES = Object.freeze([
    'menu', 'arcade-classic', 'arcade-toadal', 'arcade-fmf', 'arcade-zen',
    'puzzle', 'feastfall', 'infinite',
  ]);

  // Scene references are pack-owned aliases. They are inert strings until a
  // trusted, explicitly registered Froggy Feast pack exists after UVR v1.0.
  const SCENE_BY_SURFACE = Object.freeze({
    menu: 'froggy-feast/menu',
    'arcade-classic': 'froggy-feast/arcade-classic',
    'arcade-toadal': 'froggy-feast/arcade-toadal',
    'arcade-fmf': 'froggy-feast/arcade-five-minute-feast',
    'arcade-zen': 'froggy-feast/arcade-zen-garden',
    puzzle: 'froggy-feast/puzzle',
    feastfall: 'froggy-feast/feastfall',
    infinite: 'froggy-feast/infinite-feasts',
  });

  // UVR is a visual-background product, not a gameplay/world renderer. Infinite
  // Feasts currently paints a complete interactive world, so its legacy world
  // remains authoritative until a dedicated non-gameplay backdrop layer exists.
  const SURFACE_POLICY = Object.freeze({
    menu: Object.freeze({ externalBackground: true }),
    'arcade-classic': Object.freeze({ externalBackground: true }),
    'arcade-toadal': Object.freeze({ externalBackground: true }),
    'arcade-fmf': Object.freeze({ externalBackground: true }),
    'arcade-zen': Object.freeze({ externalBackground: true }),
    puzzle: Object.freeze({ externalBackground: true }),
    feastfall: Object.freeze({ externalBackground: true }),
    infinite: Object.freeze({ externalBackground: false }),
  });

  const SIGNAL_DEFINITIONS = Object.freeze({
    'host.progress': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.danger': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.combo': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.health': Object.freeze({ type: 'number', min: 0, max: 1, default: 1 }),
    'host.runActive': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.paused': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.celebration': Object.freeze({ type: 'number', min: 0, max: 1, default: 0 }),
    'host.intensity': Object.freeze({ type: 'number', min: 0, max: 1, default: 0.12 }),
  });

  const EVENT_MAP = Object.freeze({
    gameStarted: 'run-start',
    gameOver: 'run-end',
    foodCaught: 'food-caught',
    playerDamaged: 'danger-hit',
    heartCaught: 'recovery',
    levelUp: 'celebration',
    zenRoomRevealed: 'celebration',
    puzzleLevelStarted: 'run-start',
    puzzleFoodEaten: 'food-caught',
    puzzleLifeLost: 'danger-hit',
    puzzleLevelComplete: 'celebration',
    puzzleLevelFail: 'run-end',
    connect3Started: 'run-start',
    connect3GameOver: 'run-end',
    infiniteStarted: 'run-start',
    infiniteFoodEaten: 'food-caught',
    infiniteHeroFoodEaten: 'food-caught',
    infiniteGoldenFoodEaten: 'celebration',
    infinitePlotReclaimed: 'celebration',
    infiniteColonyRankUp: 'celebration',
    infiniteFoodSurge: 'danger-rise',
    infiniteFoodSurgeResolved: 'recovery',
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const unit = value => clamp(value, 0, 1);

  function normalizeSurface(value) {
    const surface = String(value || '').trim();
    return SURFACES.includes(surface) ? surface : 'menu';
  }

  function buildSnapshot(raw = {}) {
    const surface = normalizeSurface(raw.surface);
    const progress = unit(raw.progress);
    const danger = unit(raw.danger);
    const combo = unit(raw.combo);
    const health = unit(raw.health == null ? 1 : raw.health);
    const runActive = (raw.runActive ?? raw.active) ? 1 : 0;
    const paused = raw.paused ? 1 : 0;
    const celebration = unit(raw.celebration);
    const intensity = unit(raw.intensity == null ? Math.max(danger, combo, runActive * 0.35, 0.12) : raw.intensity);
    const affectInput = raw.affect && typeof raw.affect === 'object' ? raw.affect : null;
    const affect = Object.freeze({
      valence: clamp(affectInput?.valence ?? (health * 0.75 + progress * 0.35 + celebration * 0.4 - danger * 0.9 - 0.2), -1, 1),
      arousal: unit(affectInput?.arousal ?? Math.max(intensity, danger, combo * 0.8)),
      dominance: unit(affectInput?.dominance ?? (0.2 + progress * 0.45 + health * 0.2 + combo * 0.15)),
    });
    return Object.freeze({
      schema: SCHEMA,
      contractVersion: 1,
      surface,
      sceneId: SCENE_BY_SURFACE[surface],
      seed: String(raw.seed ?? 'froggy-feast'),
      backgroundEnabled: SURFACE_POLICY[surface].externalBackground,
      affect,
      signals: Object.freeze({
        'host.progress': progress,
        'host.danger': danger,
        'host.combo': combo,
        'host.health': health,
        'host.runActive': runActive,
        'host.paused': paused,
        'host.celebration': celebration,
        'host.intensity': intensity,
      }),
    });
  }

  function normalizeEvent(eventName, payload = {}) {
    const sourceName = String(eventName || '');
    const trigger = EVENT_MAP[sourceName] || null;
    if (!trigger) return null;
    let strength = 0.65;
    if (/celebration|complete|rank|golden|levelUp/i.test(sourceName)) strength = 1;
    if (/danger|damaged|lifeLost|surge/i.test(sourceName)) strength = 0.85;
    const explicit = Number(payload?.strength);
    if (Number.isFinite(explicit)) strength = unit(explicit);
    return Object.freeze({ name: trigger, payload: Object.freeze({ strength }) });
  }

  function isStructuredCloneSafe(value) {
    try {
      if (typeof structuredClone === 'function') structuredClone(value);
      else JSON.parse(JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function isValidSnapshot(value) {
    if (!value || value.schema !== SCHEMA || value.contractVersion !== 1) return false;
    if (!SURFACES.includes(value.surface) || value.sceneId !== SCENE_BY_SURFACE[value.surface]) return false;
    if (typeof value.seed !== 'string' || typeof value.backgroundEnabled !== 'boolean') return false;
    if (value.backgroundEnabled !== SURFACE_POLICY[value.surface].externalBackground) return false;
    if (!isStructuredCloneSafe(value)) return false;
    const affect = value.affect || {};
    if (!Number.isFinite(affect.valence) || affect.valence < -1 || affect.valence > 1) return false;
    if (!Number.isFinite(affect.arousal) || affect.arousal < 0 || affect.arousal > 1) return false;
    if (!Number.isFinite(affect.dominance) || affect.dominance < 0 || affect.dominance > 1) return false;
    const expectedSignals = Object.keys(SIGNAL_DEFINITIONS);
    const actualSignals = Object.keys(value.signals || {});
    if (actualSignals.length !== expectedSignals.length) return false;
    if (actualSignals.some(name => !Object.prototype.hasOwnProperty.call(SIGNAL_DEFINITIONS, name))) return false;
    return Object.entries(SIGNAL_DEFINITIONS).every(([name, definition]) => {
      const signal = value.signals?.[name];
      return Number.isFinite(signal) && signal >= definition.min && signal <= definition.max;
    });
  }

  // Rebuild an already-canonical snapshot into a new frozen object. This keeps
  // caller-owned mutable objects and undeclared signal keys outside the host.
  function canonicalizeSnapshot(value) {
    if (!isValidSnapshot(value)) return null;
    return buildSnapshot({
      surface: value.surface,
      seed: value.seed,
      affect: value.affect,
      progress: value.signals['host.progress'],
      danger: value.signals['host.danger'],
      combo: value.signals['host.combo'],
      health: value.signals['host.health'],
      runActive: value.signals['host.runActive'],
      paused: value.signals['host.paused'],
      celebration: value.signals['host.celebration'],
      intensity: value.signals['host.intensity'],
    });
  }

  return Object.freeze({
    SCHEMA,
    MASTER_PLAN,
    SURFACES,
    SCENE_BY_SURFACE,
    SURFACE_POLICY,
    SIGNAL_DEFINITIONS,
    EVENT_MAP,
    buildSnapshot,
    normalizeEvent,
    normalizeSurface,
    isStructuredCloneSafe,
    isValidSnapshot,
    canonicalizeSnapshot,
  });
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyFeastVisualContract = FroggyFeastVisualContract;
