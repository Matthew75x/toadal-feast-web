// ============================================================
// arcade-run-polish.js — low-bloat run integrity and presentation
// ============================================================
// This module deliberately adds no gameplay rules. It snapshots the settings
// a run actually started with, prepares only essential imagery, tracks a tiny
// result recap, and provides a capped visual eating finish for direct catches.

const ArcadeRunRules = (() => {
  const DEFINITIONS = Object.freeze({
    classic: Object.freeze({ id:'classic', label:'Classic', shortLabel:'Classic', description:'Standard miss penalty and desktop difficulty.' }),
    'touch-comfort': Object.freeze({ id:'touch-comfort', label:'Touch Comfort', shortLabel:'Comfort', description:'Touch-friendly pacing with the normal miss penalty.' }),
    custom: Object.freeze({ id:'custom', label:'Custom', shortLabel:'Custom', description:'A difficulty-affecting setting differs from the standard rules.' }),
    legacy: Object.freeze({ id:'legacy', label:'Legacy', shortLabel:'Legacy', description:'Recorded before ruleset-separated scores were introduced.' }),
  });

  let active = null;

  const safeMode = value => String(value || 'standard').replace(/[^a-z0-9-]/gi, '').slice(0, 32) || 'standard';
  const safeRuleset = value => Object.prototype.hasOwnProperty.call(DEFINITIONS, value) ? value : 'legacy';
  const keyFor = (mode, ruleset) => `${safeMode(mode)}:${safeRuleset(ruleset)}`;

  function classify(settings = typeof SETTINGS !== 'undefined' ? SETTINGS : {}) {
    if (settings?.missPenalty === false) return 'custom';
    return settings?.mobileDifficulty === true ? 'touch-comfort' : 'classic';
  }

  function beginRun(mode = 'standard') {
    const ruleset = classify();
    active = {
      mode:safeMode(mode),
      ruleset,
      startedAt:Date.now(),
      changedDuringRun:false,
    };
    return snapshot();
  }

  function markDifficultySettingChanged(key) {
    if (!active || !['mobileDifficulty', 'missPenalty'].includes(String(key || ''))) return;
    const current = classify();
    if (current === active.ruleset) return;
    active.ruleset = 'custom';
    active.changedDuringRun = true;
  }

  function snapshot() {
    const source = active || { mode:'standard', ruleset:classify(), startedAt:0, changedDuringRun:false };
    const definition = DEFINITIONS[safeRuleset(source.ruleset)];
    return Object.freeze({
      mode:safeMode(source.mode),
      ruleset:definition.id,
      label:definition.label,
      shortLabel:definition.shortLabel,
      description:definition.description,
      key:keyFor(source.mode, definition.id),
      changedDuringRun:Boolean(source.changedDuringRun),
      startedAt:Number(source.startedAt || 0),
    });
  }

  function bestFor(save = {}, context = snapshot()) {
    const ledger = save?.bestScoresByRuleset;
    if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) return 0;
    const value = Math.floor(Number(ledger[keyFor(context.mode, context.ruleset)]));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function labelFor(ruleset) {
    return DEFINITIONS[safeRuleset(ruleset)].label;
  }

  function normalizeEntryContext(entry = {}) {
    const ruleset = safeRuleset(String(entry.ruleset || 'legacy'));
    const mode = safeMode(entry.mode || 'standard');
    return Object.freeze({ mode, ruleset, label:labelFor(ruleset), key:keyFor(mode, ruleset) });
  }

  function endRun() {
    const completed = snapshot();
    active = null;
    return completed;
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('settingChanged', payload => markDifficultySettingChanged(payload?.key));
    EventBus.on('gameOver', () => { active = null; });
  }

  return Object.freeze({
    DEFINITIONS,
    classify,
    beginRun,
    snapshot,
    bestFor,
    keyFor,
    labelFor,
    normalizeEntryContext,
    endRun,
  });
})();

const ArcadeRunStartGate = (() => {
  const OVERLAY_ID = 'arcadeRunStartGate';
  const SHOW_AFTER_MS = 90;
  const HARD_CAP_MS = 520;
  let generation = 0;
  let visibilityNonce = 0;

  function ensureOverlay() {
    let root = document.getElementById(OVERLAY_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = OVERLAY_ID;
    root.className = 'arcade-run-start-gate';
    root.hidden = true;
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = '<span class="arcade-run-start-gate__spinner" aria-hidden="true"></span><strong>Serving the feast…</strong>';
    document.body.appendChild(root);
    return root;
  }

  function show() {
    const root = ensureOverlay();
    const nonce = ++visibilityNonce;
    root.hidden = false;
    requestAnimationFrame(() => {
      if (nonce !== visibilityNonce || root.hidden) return;
      root.classList.add('is-visible');
    });
  }

  function hide() {
    const root = document.getElementById(OVERLAY_ID);
    // Invalidate a queued reveal frame before removing the class. Without this,
    // a fast preload can hide the gate and then the older rAF adds is-visible
    // back permanently on high-refresh/mobile browsers.
    visibilityNonce += 1;
    if (!root) return;
    root.classList.remove('is-visible');
    // Once gameplay is ready the loading gate must stop participating in
    // layout, hit-testing, and accessibility immediately. A delayed hidden
    // flip can leave an invisible full-screen layer above the first playable
    // frame on busy/mobile browsers.
    root.hidden = true;
  }

  async function prepare(mode, characterId, options = {}) {
    const token = ++generation;
    let showTimer = null;
    const showOverlay = options.showOverlay !== false;
    try {
      if (showOverlay) showTimer = window.setTimeout(() => { if (token === generation) show(); }, SHOW_AFTER_MS);
      const preload = typeof AssetManager !== 'undefined' && typeof AssetManager.preloadRunEssentials === 'function'
        ? AssetManager.preloadRunEssentials(mode, characterId)
        : Promise.resolve();
      await Promise.race([
        Promise.resolve(preload).catch(() => undefined),
        new Promise(resolve => window.setTimeout(resolve, HARD_CAP_MS)),
      ]);
    } finally {
      if (showTimer) clearTimeout(showTimer);
      if (token === generation) hide();
    }
    return token === generation;
  }

  return Object.freeze({ prepare, hide });
})();

const ArcadeRunInsights = (() => {
  const state = {
    catches:0,
    favouriteCatches:0,
    affinityBonus:0,
    rareCatches:0,
    premiumBonus:0,
    bestCombo:0,
    hazardHits:0,
    missDamage:0,
    heartCatches:0,
    mistakeCatches:0,
    characterId:'classic',
  };

  function reset() {
    Object.assign(state, {
      catches:0,
      favouriteCatches:0,
      affinityBonus:0,
      rareCatches:0,
      premiumBonus:0,
      bestCombo:0,
      hazardHits:0,
      missDamage:0,
      heartCatches:0,
      mistakeCatches:0,
      characterId:typeof getCharDef === 'function' ? String(getCharDef()?.id || 'classic') : 'classic',
    });
  }

  function onFoodCaught(payload = {}) {
    if (!payload.itemId) return;
    if (payload.characterId) state.characterId = String(payload.characterId);
    const points = Number(payload.points);
    if (Number.isFinite(points) && points < 0) {
      state.mistakeCatches += 1;
      return;
    }
    state.catches += 1;
    const affinity = Math.max(0, Math.floor(Number(payload.affinityBonus) || 0));
    const premium = Math.max(0, Math.floor(Number(payload.premiumBonus) || 0));
    if (affinity > 0) state.favouriteCatches += 1;
    if (premium > 0 || payload.isRare === true) state.rareCatches += 1;
    state.affinityBonus += affinity;
    state.premiumBonus += premium;
    const liveCombo = typeof GameState !== 'undefined' ? GameState.combo : 0;
    state.bestCombo = Math.max(state.bestCombo, Math.max(0, Math.floor(Number(payload.combo ?? liveCombo) || 0)));
  }

  function onHeartCaught() {
    state.heartCatches += 1;
    if (typeof getCharDef === 'function') state.characterId = String(getCharDef()?.id || state.characterId);
  }

  function onDamage(payload = {}) {
    const source = String(payload.source || '');
    if (source.startsWith('hazard:') || source === 'sun') state.hazardHits += 1;
    if (source === 'miss') state.missDamage += 1;
  }

  function nextOpportunity(payload = {}) {
    const misses = Math.max(state.missDamage, Math.floor(Number(payload.misses) || 0));
    const cause = String(payload.endCause || payload.badge || '').toLowerCase();
    if (state.characterId === 'count' && state.mistakeCatches > 0) return 'As Count, wait for hearts and avoid ordinary food.';
    if (cause.includes('hazard') || cause.includes('bomb') || state.hazardHits > 0) return 'Move early when the hazard warning appears.';
    if (misses >= Math.max(2, Math.ceil(state.catches * 0.35))) return 'Hold one safe lane before chasing the next drop.';
    if (state.catches >= 6 && state.favouriteCatches === 0) return 'Chase the softly glowing favourites for bonus points.';
    if (state.bestCombo < 5 && state.catches >= 5) return 'Prioritize clean consecutive catches to build a combo.';
    return 'Keep the same rhythm and push one wave farther.';
  }

  function finish(payload = {}) {
    const bestMoment = state.bestCombo > 1
      ? `${state.bestCombo}-catch combo`
      : state.catches > 0
        ? `${state.catches} clean catch${state.catches === 1 ? '' : 'es'}`
        : state.heartCatches > 0
          ? `${state.heartCatches} heart${state.heartCatches === 1 ? '' : 's'} collected`
          : 'Run started';
    const feastMastery = state.favouriteCatches > 0
      ? `${state.favouriteCatches} favourite${state.favouriteCatches === 1 ? '' : 's'} · +${state.affinityBonus.toLocaleString()} bonus`
      : state.rareCatches > 0
        ? `${state.rareCatches} rare treat${state.rareCatches === 1 ? '' : 's'} · +${state.premiumBonus.toLocaleString()} bonus`
        : state.heartCatches > 0
          ? `${state.heartCatches} heart${state.heartCatches === 1 ? '' : 's'} collected`
          : `${state.catches} food caught`;
    return Object.freeze({
      bestMoment,
      feastMastery,
      nextOpportunity:nextOpportunity(payload),
      catches:state.catches,
      favouriteCatches:state.favouriteCatches,
      affinityBonus:state.affinityBonus,
      rareCatches:state.rareCatches,
      premiumBonus:state.premiumBonus,
      bestCombo:state.bestCombo,
      heartCatches:state.heartCatches,
      mistakeCatches:state.mistakeCatches,
    });
  }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('gameStarted', reset);
    EventBus.on('foodCaught', onFoodCaught);
    EventBus.on('heartCaught', onHeartCaught);
    EventBus.on('playerDamaged', onDamage);
  }

  return Object.freeze({ reset, finish, snapshot:() => Object.freeze({ ...state }) });
})();

const ArcadeEatingFinish = (() => {
  const MAX_ACTIVE = 6;
  const DEFAULT_DURATION = 0.115;
  const active = [];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function edible(food) {
    return Boolean(food && food.itemId && !food.isBomb && !food.isHazard && !food.isSun && !food.isHeart
      && !food.isSyringe && !food.isGiftBox && !food.isPowerUp && !food.isContentLabPrototype);
  }

  function familyFor(food) {
    const def = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(food?.itemId) : null;
    const category = String(def?.category || food?.category || '').toLowerCase();
    if (food?.isRareFood || def?.rare === true) return 'premium';
    if (/drink|juice|soda|smoothie/.test(category)) return 'juice';
    if (/candy|sweet|dessert|fruit/.test(category)) return 'sugar';
    if (/bread|pastry|cake|cookie/.test(category)) return 'crumb';
    if (/rice|grain|sushi/.test(category)) return 'rice';
    return 'savory';
  }

  function targetFor(character, options = {}) {
    if (Number.isFinite(options.targetX) && Number.isFinite(options.targetY)) return { x:options.targetX, y:options.targetY };
    const yOffset = character?.id === 'pelican' ? 12 : character?.id === 'hippo' ? -4 : -32;
    const activeFrog = (typeof frog !== 'undefined' && frog) ? frog : null;
    return { x:Number(activeFrog?.x || CONFIG.CANVAS_W / 2), y:Number(activeFrog?.y || CONFIG.CANVAS_H - 80) + yOffset };
  }

  function capture(food, character, options = {}) {
    if (!edible(food)) return false;
    const target = targetFor(character, options);
    const reduced = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion === true;
    const duration = reduced ? 0.055 : DEFAULT_DURATION;
    active.push({
      food:{ ...food },
      startX:Number(food.x || target.x),
      startY:Number(food.y || target.y),
      targetX:target.x,
      targetY:target.y,
      elapsed:0,
      duration,
      family:familyFor(food),
      reduced,
    });
    while (active.length > MAX_ACTIVE) active.shift();
    return true;
  }

  function finishBurst(item) {
    if (item.reduced || typeof FXManager === 'undefined' || typeof entities === 'undefined' || !entities) return;
    const palette = { juice:'#73cfff', sugar:'#ff9bd3', crumb:'#e4ad69', rice:'#fff0b0', premium:'#ffe36b', savory:'#b8e06f' };
    FXManager.spawnParticles(entities, item.targetX, item.targetY, palette[item.family] || '#b8e06f', item.family === 'premium' ? 7 : 4);
  }

  function tick(dt) {
    const step = Math.max(0, Math.min(0.05, Number(dt) || 0));
    for (let index = active.length - 1; index >= 0; index -= 1) {
      const item = active[index];
      item.elapsed += step;
      if (item.elapsed < item.duration) continue;
      finishBurst(item);
      active.splice(index, 1);
    }
  }

  function draw(context) {
    if (!context || typeof drawArcadeFoodEntityVisual !== 'function') return;
    for (const item of active) {
      const t = clamp(item.elapsed / Math.max(0.001, item.duration), 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const arc = item.reduced ? 0 : Math.sin(Math.PI * t) * 8;
      const x = item.startX + (item.targetX - item.startX) * eased;
      const y = item.startY + (item.targetY - item.startY) * eased - arc;
      drawArcadeFoodEntityVisual(item.food, {
        x,
        y,
        scaleMultiplier:Math.max(0.08, 1 - eased * 0.82),
        rotationOffset:eased * 0.55,
        alpha:Math.max(0, 1 - Math.pow(t, 2)),
        allowGlow:false,
        freezeWobble:true,
        surface:'eating-finish',
      });
    }
  }

  function clear() { active.length = 0; }

  if (typeof EventBus !== 'undefined') {
    EventBus.on('gameStarted', clear);
    EventBus.on('gameOver', clear);
  }

  return Object.freeze({ capture, tick, draw, clear, count:() => active.length });
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ArcadeRunRules = ArcadeRunRules;
  globalThis.ArcadeRunStartGate = ArcadeRunStartGate;
  globalThis.ArcadeRunInsights = ArcadeRunInsights;
  globalThis.ArcadeEatingFinish = ArcadeEatingFinish;
}
