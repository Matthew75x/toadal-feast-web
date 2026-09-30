// ============================================================
// arcade-affinity-presentation.js — Favourite-food readability
// and universal positive catch reactions.
// ============================================================
// Gameplay scoring remains owned by FeastOrdersManager/balance.js. This module
// is presentation-only: menu previews, falling-food anticipation, and a short
// renderer-agnostic reaction after favourite/rare catches.

const ArcadeAffinityPresentation = (() => {
  'use strict';

  const AFFINITY_PRESENTATION_CONFIG = Object.freeze({
    previewCount: 4,
    favouriteReactionSeconds: 0.46,
    rareReactionSeconds: 0.82,
    reactionRefreshCapSeconds: 0.95,
  });

  const state = {
    remaining: 0,
    duration: 0,
    kind: 'none',
    characterId: '',
    itemId: '',
    accent: '#ffffff',
  };

  function clamp(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
  }

  function selectedCharacterId() {
    if (typeof getCharDef === 'function') return String(getCharDef()?.id || 'classic');
    return String((typeof GameState !== 'undefined' ? GameState?.selectedCharacterId : '') || 'classic');
  }

  function profileFor(characterId) {
    return typeof getArcadeFavouriteProfile === 'function'
      ? getArcadeFavouriteProfile(characterId)
      : null;
  }

  function foodDefinition(itemId) {
    return typeof getArcadeFoodDef === 'function'
      ? getArcadeFoodDef(itemId)
      : (typeof ARCADE_FOOD_BY_ID !== 'undefined' ? (ARCADE_FOOD_BY_ID[String(itemId || '')] || null) : null);
  }

  function isRareItem(itemId) {
    const definition = foodDefinition(itemId);
    return Boolean(definition?.rare || (typeof ARCADE_RARE_FOOD_IDS !== 'undefined' && ARCADE_RARE_FOOD_IDS.includes(String(itemId || ''))));
  }

  function previewFoods(characterId, limit = AFFINITY_PRESENTATION_CONFIG.previewCount) {
    const profile = profileFor(characterId);
    if (!profile) return Object.freeze([]);
    const definitions = typeof ARCADE_FOOD_DEFINITIONS !== 'undefined' && Array.isArray(ARCADE_FOOD_DEFINITIONS) ? ARCADE_FOOD_DEFINITIONS : [];
    const candidates = [];
    const seen = new Set();
    const add = itemId => {
      const definition = foodDefinition(itemId);
      if (!definition || seen.has(definition.itemId) || definition.rare) return;
      seen.add(definition.itemId);
      candidates.push(definition);
    };
    (profile.itemIds || []).forEach(add);
    definitions.forEach(definition => {
      if ((profile.categories || []).includes(definition.category)) add(definition.itemId);
    });
    return Object.freeze(candidates.slice(0, Math.max(1, Math.floor(Number(limit) || AFFINITY_PRESENTATION_CONFIG.previewCount))).map(Object.freeze));
  }

  function sourceFor(itemId) {
    const resolved = typeof ArcadeAssetBindings !== 'undefined' ? ArcadeAssetBindings?.getForItem?.(itemId) : null;
    return String(resolved?.src || '');
  }

  function summary(characterId) {
    const profile = profileFor(characterId);
    const foods = previewFoods(characterId);
    return Object.freeze({
      characterId: String(characterId || 'classic'),
      label: String(profile?.label || 'Favourite Foods'),
      foods,
      bonusPercent: Math.round(Number((typeof FEAST_ORDER_CONFIG !== 'undefined' ? FEAST_ORDER_CONFIG?.affinityMultiplier : 0.15) || 0.15) * 100),
    });
  }

  function classification(entity, characterId = selectedCharacterId()) {
    if (!entity || entity.isBomb || entity.isHazard || entity.isHeart || entity.isSun
      || entity.isSyringe || entity.isGiftBox || entity.isPowerUp || !entity.itemId) {
      return Object.freeze({ favourite: false, rare: false, kind: 'none' });
    }
    const rare = isRareItem(entity.itemId);
    const favourite = typeof isArcadeFavouriteFood === 'function'
      ? isArcadeFavouriteFood(characterId, entity.itemId)
      : false;
    return Object.freeze({ favourite, rare, kind: rare ? 'rare' : favourite ? 'favourite' : 'none' });
  }

  function drawSparkle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius * 0.34, y - radius * 0.34);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x + radius * 0.34, y + radius * 0.34);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius * 0.34, y + radius * 0.34);
    ctx.lineTo(x - radius, y);
    ctx.lineTo(x - radius * 0.34, y - radius * 0.34);
    ctx.closePath();
    ctx.fill();
  }

  function drawFoodAura(ctx, entity) {
    if (!ctx || !entity) return 'none';
    const hintEnabled = typeof SETTINGS === 'undefined' || SETTINGS.favouriteFoodHints !== false;
    if (!hintEnabled) return 'none';
    const info = classification(entity);
    if (info.kind === 'none') return 'none';

    const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const glowEnabled = typeof SETTINGS === 'undefined' || SETTINGS.entityGlowEffects !== false;
    const time = Number(entity.wobbleTime || 0);
    const pulse = reducedMotion ? 0.5 : (0.5 + 0.5 * Math.sin(time * 4.2));
    const foodWidth = typeof CONFIG !== 'undefined' ? Number(CONFIG.FOOD_W || 36) : 36;
    const foodHeight = typeof CONFIG !== 'undefined' ? Number(CONFIG.FOOD_H || 36) : 36;
    const radius = Math.max(foodWidth, foodHeight) * 0.57 + pulse * (info.rare ? 3.5 : 2.2);
    const accent = info.rare
      ? '#ffd75a'
      : String((typeof getCharDef === 'function' ? getCharDef()?.color : '') || '#ff8fc7');

    ctx.save();
    ctx.translate(Number(entity.x || 0), Number(entity.y || 0));
    ctx.globalAlpha *= info.rare ? 0.92 : 0.72;
    if (glowEnabled) {
      ctx.fillStyle = info.rare ? 'rgba(255,215,90,0.12)' : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = info.rare ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = accent;
    const sparkleRadius = info.rare ? 3.6 : 2.7;
    drawSparkle(ctx, radius * 0.76, -radius * 0.72, sparkleRadius + pulse * 0.8);
    if (info.rare) drawSparkle(ctx, -radius * 0.72, radius * 0.58, sparkleRadius * 0.78);
    ctx.restore();
    return info.kind;
  }

  function reset() {
    state.remaining = 0;
    state.duration = 0;
    state.kind = 'none';
    state.characterId = '';
    state.itemId = '';
    state.accent = '#ffffff';
  }

  function trigger(payload = {}) {
    const kind = payload.isRare ? 'rare' : payload.isFavourite ? 'favourite' : 'none';
    if (kind === 'none') return false;
    const duration = kind === 'rare' ? AFFINITY_PRESENTATION_CONFIG.rareReactionSeconds : AFFINITY_PRESENTATION_CONFIG.favouriteReactionSeconds;
    const sameOrStronger = state.kind === 'rare' && kind === 'favourite';
    if (!sameOrStronger) state.kind = kind;
    state.duration = Math.max(state.duration, duration);
    state.remaining = Math.min(AFFINITY_PRESENTATION_CONFIG.reactionRefreshCapSeconds, Math.max(state.remaining, duration));
    state.characterId = String(payload.characterId || selectedCharacterId());
    state.itemId = String(payload.itemId || '');
    const character = typeof getCharDef === 'function' ? getCharDef() : null;
    state.accent = kind === 'rare' ? '#ffd75a' : String(character?.color || '#ff8fc7');
    return true;
  }

  function tick(dt) {
    state.remaining = Math.max(0, Number(state.remaining || 0) - clamp(dt, 0, 0.1));
    if (state.remaining <= 0) reset();
  }

  function snapshot() {
    const duration = Math.max(0.001, Number(state.duration || 0.001));
    return Object.freeze({ ...state, progress: clamp(1 - state.remaining / duration, 0, 1), active: state.remaining > 0 });
  }

  function transform(characterId = '') {
    if (state.remaining <= 0) return Object.freeze({ scaleX: 1, scaleY: 1, offsetY: 0, rotation: 0 });
    const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    if (reducedMotion) return Object.freeze({ scaleX: 1, scaleY: 1, offsetY: 0, rotation: 0 });
    const snap = snapshot();
    const envelope = Math.sin(Math.PI * clamp(snap.progress, 0, 1));
    const strength = state.kind === 'rare' ? 1 : 0.58;
    const allowBodyScalePulse = String(characterId || '') !== 'classic';
    return Object.freeze({
      scaleX: allowBodyScalePulse ? 1 + envelope * 0.055 * strength : 1,
      scaleY: allowBodyScalePulse ? 1 - envelope * 0.026 * strength : 1,
      offsetY: -envelope * 2.6 * strength,
      rotation: Math.sin(snap.progress * Math.PI * 3) * 0.012 * strength,
    });
  }

  function drawReaction(ctx, x, y) {
    if (!ctx || state.remaining <= 0) return false;
    const snap = snapshot();
    const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const fade = Math.sin(Math.PI * clamp(snap.progress, 0, 1));
    const spread = reducedMotion ? 0 : snap.progress * (state.kind === 'rare' ? 16 : 10);
    const count = state.kind === 'rare' ? 4 : 3;
    ctx.save();
    ctx.fillStyle = state.accent;
    ctx.globalAlpha *= clamp(fade * 0.9, 0, 0.9);
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI * 0.82 + index * (Math.PI * 0.64 / Math.max(1, count - 1));
      const radius = 33 + spread + (index % 2) * 5;
      drawSparkle(ctx, x + Math.cos(angle) * radius, y - 34 + Math.sin(angle) * radius * 0.42, state.kind === 'rare' ? 4.5 : 3.4);
    }
    ctx.restore();
    return true;
  }

  function preferredClip(characterId, definitions) {
    if (state.remaining <= 0 || state.kind !== 'rare') return null;
    if (String(characterId || '') !== String(state.characterId || selectedCharacterId())) return null;
    // Never replace a mechanic-critical tongue/catch pose. The reaction remains
    // alive briefly and can take over once the action pose releases.
    if (typeof tongue !== 'undefined' && (tongue?.active || Number(tongue?.swallowTimer || 0) > 0)) return null;
    return definitions?.rare_food_reaction ? 'rare_food_reaction' : null;
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('gameStarted', reset);
    EventBus.on('arcadeFoodCaught', trigger);
  }

  return Object.freeze({
    CONFIG: AFFINITY_PRESENTATION_CONFIG,
    state,
    profileFor,
    previewFoods,
    sourceFor,
    summary,
    classification,
    drawFoodAura,
    trigger,
    tick,
    reset,
    snapshot,
    transform,
    drawReaction,
    preferredClip,
    isRareItem,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeAffinityPresentation = ArcadeAffinityPresentation;

// Shipping cadence authority for expression-bearing/re-cropped Arcade art.
// The checked-in runtime registry is generated, but its authoring source is not
// shipped in this repository. Keep the approved PNGs and apply only explicit
// timing/geometry normalization at the CharacterAnimationTuning registration
// boundary. This runs after game-runtime (which defines the boundary) and
// before the generated registry, so registration is deterministic on both
// full-game and standalone Arcade surfaces.
const ArcadeNaturalAnimationTimingAuthority = (() => {
  'use strict';

  const TARGETS = Object.freeze(new Set(['classic', 'fire', 'count']));
  const applied = new Set();
  const schedules = Object.freeze({
    classic: Object.freeze({
      idle: Object.freeze({
        file: 'idle.png',
        frames: 1,
        sourceFrames: Object.freeze([0]),
        frameDurationsMs: Object.freeze([1000]),
        frameWidth: 512,
        frameHeight: 512,
        drawScale: 0.22,
        anchorX: 256,
        anchorY: 502,
        bodyBounds: Object.freeze({ minX: 8, minY: 52, maxX: 503, maxY: 501 }),
        mode: 'static-neutral-with-separate-blink',
      }),
      blink: Object.freeze({
        file: 'idle_blink_16f_256.png',
        frames: 16,
        sourceFrames: Object.freeze(Array.from({ length: 16 }, (_, index) => index)),
        frameDurationsMs: Object.freeze([30, 30, 30, 30, 45, 65, 80, 65, 45, 30, 30, 30, 30, 30, 30, 30]),
        fps: 24,
        loop: false,
        category: 'expression',
        next: 'idle',
        priority: 11,
        interruptPolicy: 'higherPriority',
        restartPolicy: 'restart',
        facingMode: 'front',
        frameWidth: 256,
        frameHeight: 256,
        drawScale: 0.44,
        anchorX: 128,
        anchorY: 245,
        bodyBounds: Object.freeze({ minX: 9, minY: 32, maxX: 242, maxY: 244 }),
        mode: 'scheduled-expression-fits-window',
      }),
      catch_open: Object.freeze({
        file: 'catch_open_10f.png',
        frames: 10,
        sourceFrames: Object.freeze(Array.from({ length: 10 }, (_, index) => index)),
        fps: 16,
        loop: false,
        category: 'action',
        next: 'idle',
        priority: 40,
        interruptPolicy: 'higherPriority',
        restartPolicy: 'restart',
        facingMode: 'front',
        frameWidth: 512,
        frameHeight: 512,
        drawScale: 0.22,
        anchorX: 256,
        anchorY: 502,
        bodyBounds: Object.freeze({ minX: 8, minY: 52, maxX: 503, maxY: 501 }),
        mode: 'normalized-action-footprint',
      }),
    }),
    fire: Object.freeze({
      idle: Object.freeze({
        frames: 1,
        sourceFrames: Object.freeze([0]),
        frameDurationsMs: Object.freeze([1000]),
        mode: 'static-neutral-with-separate-blink',
      }),
      blink: Object.freeze({
        sourceFrames: Object.freeze(Array.from({ length: 12 }, (_, index) => index)),
        frameDurationsMs: Object.freeze([80, 55, 45, 35, 35, 35, 35, 45, 55, 65, 70, 45]),
        loop: false,
        next: 'idle',
        category: 'expression',
        mode: 'scheduled-expression-fits-window',
      }),
    }),
    count: Object.freeze({
      idle: Object.freeze({
        drawScale: 0.55,
        anchorX: 90.5,
        anchorY: 239,
        bodyBounds: Object.freeze({ minX: 0, minY: 72, maxX: 180, maxY: 238 }),
        frameDurationsMs: Object.freeze(Array(12).fill(180)),
        mode: 'normalized-action-footprint',
      }),
      move: Object.freeze({
        drawScale: 0.22,
        anchorX: 256,
        anchorY: 507,
        bodyBounds: Object.freeze({ minX: 6, minY: 92, maxX: 505, maxY: 507 }),
        mode: 'normalized-action-footprint',
      }),
      catch_open: Object.freeze({
        drawScale: 0.55,
        anchorX: 90.5,
        anchorY: 226,
        bodyBounds: Object.freeze({ minX: 0, minY: 45, maxX: 180, maxY: 225 }),
        next: 'idle',
        mode: 'normalized-action-footprint',
      }),
    }),
  });

  function cloneDefinitions(profile) {
    return Object.fromEntries(Object.entries(profile?.clips || {}).map(([clipId, definition]) => [clipId, {
      ...definition,
      sourceFrames: Array.isArray(definition?.sourceFrames) ? [...definition.sourceFrames] : definition?.sourceFrames,
      frameDurationsMs: Array.isArray(definition?.frameDurationsMs) ? [...definition.frameDurationsMs] : definition?.frameDurationsMs,
    }]));
  }

  function applyClip(definitions, clipId, patch) {
    if (!patch) return false;
    const existing = definitions[clipId] || {};
    definitions[clipId] = {
      ...existing,
      ...patch,
      sourceFrames: Array.isArray(patch.sourceFrames) ? [...patch.sourceFrames] : existing.sourceFrames,
      frameDurationsMs: Array.isArray(patch.frameDurationsMs) ? [...patch.frameDurationsMs] : existing.frameDurationsMs,
      naturalnessAuthority: 'ArcadeNaturalAnimationTimingAuthority',
      naturalnessMode: patch.mode,
    };
    return true;
  }

  function apply(characterId) {
    const id = String(characterId || '');
    if (!TARGETS.has(id) || applied.has(id)) return false;
    if (typeof ArcadeAnimationRegistry === 'undefined' || typeof CharacterAnimationTuning === 'undefined') return false;
    const profile = ArcadeAnimationRegistry.character(id);
    const schedule = schedules[id];
    if (!profile || !schedule) return false;
    applied.add(id);
    const definitions = cloneDefinitions(profile);
    for (const [clipId, patch] of Object.entries(schedule)) applyClip(definitions, clipId, patch);
    CharacterAnimationTuning.register(id, definitions, profile.displayName || id);
    return true;
  }

  function scheduleApply(characterId) {
    const id = String(characterId || '');
    if (!TARGETS.has(id) || applied.has(id)) return;
    const defer = typeof queueMicrotask === 'function' ? queueMicrotask : callback => Promise.resolve().then(callback);
    defer(() => apply(id));
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('character-animation-registry-change', event => scheduleApply(event?.detail?.characterId));
  }

  return Object.freeze({ targets: Object.freeze([...TARGETS]), schedules, apply, isApplied: id => applied.has(String(id || '')) });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeNaturalAnimationTimingAuthority = ArcadeNaturalAnimationTimingAuthority;
