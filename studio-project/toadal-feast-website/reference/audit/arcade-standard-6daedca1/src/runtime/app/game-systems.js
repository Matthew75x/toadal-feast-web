// ============================================================
// src/runtime/app/game-systems.js — SpawnManager, InputManager, FXManager, SceneManager, EntityFactory
// World/entity subsystem managers. Split from game.js for modularity.
// ============================================================

const SpawnManager = (() => {
  let timer = 0;
  let interval = LEVEL_DATA.default.spawnIntervalBase;
  let speedMult = LEVEL_DATA.default.speedMultBase;

  let burstQueue = [];
  let rainfallZone = null;
  let rainfallCount = 0;
  let sweepX = 0;
  let sweepDir = 1;
  let zigzagSide = 'left';
  let lastGuardedFoodX = null;

  function _arcadeTuning() {
    return (typeof GAME_BALANCE !== 'undefined' && GAME_BALANCE.arcadeTuning) || ARCADE_TUNING_DEFAULTS;
  }

  function _touchComfortActive() {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    return Boolean(touch && typeof TWEAK !== 'undefined' && TWEAK.mobileDifficulty);
  }

  function _effectiveSpawnRateMult() {
    const tuning = _arcadeTuning();
    let mult = Math.max(0.10, Number(tuning.foodSpawnRateMult) || 1);
    if (_touchComfortActive()) mult *= Math.max(0.10, Number(tuning.mobileFoodSpawnRateMult) || 1);
    return Math.max(0.10, mult);
  }

  function _effectiveFallSpeedMult() {
    return Math.max(0.25, Number(_arcadeTuning().fallSpeedMult) || 1);
  }

  function _regularFood(item) {
    return Boolean(item && !item.isBomb && !item.isHazard && !item.isHeart && !item.isSun
      && !item.isSyringe && !item.isPowerUp && !item.isGiftBox);
  }

  function _countLive(list, predicate) {
    if (!Array.isArray(list)) return 0;
    let count = 0;
    for (const item of list) if (predicate(item)) count++;
    return count;
  }

  function _effectiveFoodCap() {
    const tuning = _arcadeTuning();
    const base = Math.max(0, Math.floor(Number(tuning.maxConcurrentFood) || 0));
    if (!_touchComfortActive()) return base;
    const mobile = Math.max(0, Math.floor(Number(tuning.mobileMaxConcurrentFood) || 0));
    if (!mobile) return base;
    return base ? Math.min(base, mobile) : mobile;
  }

  function _pushSpawn(activeEntities, item) {
    if (!item || !activeEntities || !Array.isArray(activeEntities.foods)) return false;
    const tuning = _arcadeTuning();
    const bombCap = Math.max(0, Math.floor(Number(tuning.maxConcurrentBombs) || 0));
    if (item.isBomb && bombCap && _countLive(activeEntities.foods, entry => entry?.isBomb) >= bombCap) {
      if (typeof LiveStats !== 'undefined') LiveStats.bombsSpawned = Math.max(0, (LiveStats.bombsSpawned || 0) - 1);
      return false;
    }
    const foodCap = _effectiveFoodCap();
    if (_regularFood(item) && foodCap && _countLive(activeEntities.foods, _regularFood) >= foodCap) {
      if (typeof LiveStats !== 'undefined') LiveStats.foodsSpawned = Math.max(0, (LiveStats.foodsSpawned || 0) - 1);
      return false;
    }
    activeEntities.foods.push(item);
    return true;
  }

  function _applyMobileReachability(item, enabled) {
    if (!enabled || !_regularFood(item) || !_touchComfortActive()) return item;
    const ratio = Math.max(0.20, Math.min(1, Number(_arcadeTuning().mobileReachabilityMaxJumpRatio) || 1));
    const pad = CONFIG.FOOD_W / 2;
    if (ratio < 1 && Number.isFinite(lastGuardedFoodX)) {
      const maxJump = CONFIG.CANVAS_W * ratio;
      item.x = Math.max(pad, Math.min(CONFIG.CANVAS_W - pad,
        Math.max(lastGuardedFoodX - maxJump, Math.min(lastGuardedFoodX + maxJump, item.x))));
    }
    lastGuardedFoodX = item.x;
    return item;
  }

  // Data-driven formations are a normal engine capability. Player-facing
  // patterns can be added to DROP_PATTERN_REGISTRY in src/runtime/shared/balance.js; the dev lab
  // only records, previews, and exports definitions for this scheduler.
  let queuedPattern = [];
  let queuedPatternRest = 0;
  let queuedPatternRestAfter = 0;


  function reset() {
    timer = 0;
    interval = LEVEL_DATA.default.spawnIntervalBase;
    speedMult = LEVEL_DATA.default.speedMultBase;
    burstQueue = [];
    rainfallZone = null;
    rainfallCount = 0;
    sweepX = 0;
    sweepDir = 1;
    zigzagSide = 'left';
    lastGuardedFoodX = null;
    queuedPattern = [];
    queuedPatternRest = 0;
    queuedPatternRestAfter = 0;
  }

  function applyWaveConfig() {
    const cfg = getCurrentLevelConfig();
    const modeSpawn = getSpawnCfg();
    // FEAST FRENZY has an intentionally denser/faster authored base. Preserve
    // the shared 50-wave spawnSpeed curve, but resolve its base/minimum from
    // the active TC spawn bucket instead of Standard LEVEL_DATA.
    const speedBase = GameState.isTC
      ? Math.max(0.10, Number(modeSpawn.speedMultBase) || LEVEL_DATA.default.speedMultBase)
      : LEVEL_DATA.default.speedMultBase;
    const intervalBase = GameState.isTC
      ? Math.max(0.05, Number(modeSpawn.spawnIntervalBase) || LEVEL_DATA.default.spawnIntervalBase)
      : LEVEL_DATA.default.spawnIntervalBase;
    const intervalMin = GameState.isTC
      ? Math.max(0.05, Number(modeSpawn.spawnIntervalMin) || LEVEL_DATA.perLevel.spawnIntervalMin)
      : LEVEL_DATA.perLevel.spawnIntervalMin;
    speedMult = speedBase * cfg.spawnSpeed * getModeSpeedMult();
    interval = Math.max(intervalMin, intervalBase / cfg.spawnSpeed) * getModeIntervalMult();
    burstQueue = [];
    rainfallZone = null;
    rainfallCount = 0;
    sweepX = 0;
    sweepDir = 1;
    zigzagSide = 'left';
    queuedPattern = [];
    queuedPatternRest = 0;
    queuedPatternRestAfter = 0;
  }

  function _speedMult() { return speedMult; }

  function getZoneX(zone) {
    const w = CONFIG.CANVAS_W;
    const pad = CONFIG.FOOD_W / 2;
    if (zone === 'left')  return pad + Math.random() * (w / 3 - pad);
    if (zone === 'mid')   return w / 3 + Math.random() * (w / 3);
    return (w * 2 / 3) + Math.random() * (w / 3 - pad);
  }

  function getSpawnCfg() {
    return getSpawnConfig();
  }

  function getModeSpeedMult() {
    return GameState.currentMode === 'zen' ? (GAME_BALANCE.zen.foodSpeedMult || 1) : 1;
  }

  function getModeIntervalMult() {
    return GameState.currentMode === 'zen' ? (GAME_BALANCE.zen.spawnIntervalMult || 1) : 1;
  }

  function applyLevel(level) {
    const p   = LEVEL_DATA.perLevel;
    const cfg = getSpawnCfg();
    if (GameState.isTC) {
      speedMult = cfg.speedMultBase + (level - 1) * p.speedMultInc;
      interval  = Math.max(cfg.spawnIntervalMin, cfg.spawnIntervalBase - (level - 1) * p.spawnIntervalDec);
      return;
    }
    const charDef = getCharDef();
    const sRamp = charDef.stats.speedRampMult    || 1.0;
    const iMult = charDef.stats.spawnIntervalMult || 1.0;
    speedMult = (1 + (level - 1) * p.speedMultInc * sRamp) * getModeSpeedMult();
    const baseInterval = LEVEL_DATA.default.spawnIntervalBase * iMult;
    interval = Math.max(p.spawnIntervalMin * iMult, baseInterval - (level - 1) * p.spawnIntervalDec) * getModeIntervalMult();
  }

  function createFoodAt(fixedX, options = {}) {
    // ── Dev: force a specific item type ──────────────────────────
    const override = (typeof TWEAK !== 'undefined') ? TWEAK.spawnItemOverride : 'none';
    if (override && override !== 'none') {
      let item;
      const spd = (GAME_BALANCE.spawn.foodSpeedBase + Math.random() * GAME_BALANCE.spawn.foodSpeedRand) * speedMult * _effectiveFallSpeedMult();
      switch (override) {
        case 'food':
          item = EntityFactory.createFood(randomArcadeFoodId(), false, false, spd);
          break;
        case 'bomb':
          item = EntityFactory.createHazard(HAZARD_DATA[Math.floor(Math.random() * HAZARD_DATA.length)].id, spd);
          break;
        case 'hazard_bomb':
          item = EntityFactory.createHazard('bomb', spd);
          break;
        case 'hazard_fire':
          item = EntityFactory.createHazard('fire', spd);
          break;
        case 'hazard_caution':
          item = EntityFactory.createHazard('caution', spd);
          break;
        case 'heart':
          item = EntityFactory.createHeart(65);
          break;
        case 'blueHeart':
          item = EntityFactory.createBlueHeart(65);
          break;
        case 'syringe':
          item = EntityFactory.createSyringe(80 + Math.random() * 40);
          break;
        case 'sun':
          item = EntityFactory.createSun(spd * 0.7);
          break;
        default:
          if (override.startsWith('powerup_')) {
            const effectId = override.replace('powerup_', '');
            const durMap = { shield:6, slowFood:7, doublePoints:8, speedBoost:5, magnet:6, scoreBoost:8, piercing:7, vacuum:5 };
            item = EntityFactory.createPowerUp(effectId, durMap[effectId] || 6);
          } else {
            item = EntityFactory.createFood(ARCADE_FOOD_IDS[0], false, false, spd);
          }
      }
      if (fixedX !== null) item.x = fixedX;
      return item;
    }

    // ── Normal spawn logic ────────────────────────────────────────
    const p = LEVEL_DATA.perLevel;
    const charDef = getCharDef();
    const charSpeedMult = charDef.stats.foodSpeedMult || 1;
    if (hasAbility(charDef, 'vampireFeed')) {
      const heartMult = Math.max(0, charDef.stats.heartSpawnMult || 1);
      const heartChance = Math.min(0.65, (GAME_BALANCE.count.heartStreamChance || 0.2) * heartMult);
      if (Math.random() < heartChance) {
        const f = EntityFactory.createHeart((130 + Math.random() * 80) * speedMult);
        if (fixedX !== null) f.x = fixedX;
        return f;
      }
    }
    const _sCfg = getSpawnCfg();
    if (_sCfg.syringeChance && Math.random() < _sCfg.syringeChance) {
      const s = EntityFactory.createSyringe((_sCfg.syringeSpeed || 80) + Math.random() * 40);
      if (fixedX !== null) s.x = fixedX;
      return s;
    }
    const tuning = _arcadeTuning();
    const bombStartLevel = Math.max(1, Math.floor(Number(tuning.bombStartLevel) || 1));
    const baseBombChance = GameState.currentMode === 'zen' || GameState.level < bombStartLevel
      ? 0
      : LEVEL_DATA.default.bombChance + GameState.level * Math.max(0, Number(tuning.bombChanceInc) || 0);
    const rawBombChance = Math.min(Math.max(0, Number(tuning.bombChanceCap) || 0),
      Math.max(0, baseBombChance * Math.max(0, Number(tuning.bombRateMult) || 0)));
    const bombCap = Math.max(0, Math.floor(Number(tuning.maxConcurrentBombs) || 0));
    const bombCapReached = bombCap && typeof entities !== 'undefined' && Array.isArray(entities.foods)
      && _countLive(entities.foods, entry => entry?.isBomb) >= bombCap;
    const adjustedBombChance = bombCapReached ? 0 : (typeof ArcadeLivingFeastDirector !== 'undefined' && GameState.currentMode === 'standard'
      ? ArcadeLivingFeastDirector.adjustHazardChance(rawBombChance)
      : rawBombChance);
    const bombChance = Math.max(0, Math.min(1, Number(adjustedBombChance) || 0));
    const isHazardSpawn = Math.random() < bombChance;
    const spawnedHazard = isHazardSpawn
      ? HAZARD_DATA[Math.floor(Math.random() * HAZARD_DATA.length)]
      : null;
    // Bombs get a clearer approach window without changing food or other hazard pacing.
    const bombFallSpeedMultiplier = spawnedHazard?.id === 'bomb' ? 0.82 : 1;
    const itemSpeed = (GAME_BALANCE.spawn.foodSpeedBase + Math.random() * GAME_BALANCE.spawn.foodSpeedRand)
      * speedMult * charSpeedMult * _effectiveFallSpeedMult() * bombFallSpeedMultiplier;
    const forecastFoodPicker = typeof ArcadeLivingFeastDirector !== 'undefined' && GameState.currentMode === 'standard'
      ? () => ArcadeLivingFeastDirector.pickForecastFoodId(charDef.id, randomArcadeFoodId)
      : randomArcadeFoodId;
    const assistedFoodId = typeof FeastOrdersManager !== 'undefined'
      ? FeastOrdersManager.pickSpawnFoodId(charDef.id, forecastFoodPicker)
      : forecastFoodPicker();
    const rareFoodId = !isHazardSpawn && typeof pickArcadeRareFoodId === 'function'
      && Math.random() < Math.max(0, Number(GAME_BALANCE.spawn.rareFoodChance) || 0)
      ? pickArcadeRareFoodId()
      : null;
    const food = spawnedHazard
      ? EntityFactory.createHazard(spawnedHazard.id, itemSpeed)
      : EntityFactory.createFood(rareFoodId || assistedFoodId, false, false, itemSpeed);
    if (rareFoodId) food.isRareFood = true;
    if (fixedX !== null) food.x = fixedX;
    _applyMobileReachability(food, Boolean(options.guardReachability && fixedX === null));
    return food;
  }

  function createLivingFeastItem(plan) {
    const item = createFoodAt(null);
    if (plan && typeof ArcadeWaveFormations !== 'undefined') {
      const directedX = ArcadeWaveFormations.resolveSpawnX(plan, item);
      if (Number.isFinite(directedX)) item.x = directedX;
    }
    return item;
  }

  function createHeart() {
    if (Math.random() < GAME_BALANCE.spawn.blueHeartChance) {
      return EntityFactory.createBlueHeart(65);
    }
    return EntityFactory.createHeart(69);
  }
  
  function createSun() {
    const spd = (GAME_BALANCE.spawn.foodSpeedBase * 0.7) + Math.random() * 40;
    return EntityFactory.createSun(spd * SpawnManager._speedMult());
  }

  // ── Data-driven pattern scheduler ──────────────────────────────────────
  // A registry pattern can be either:
  //   1) legacy timed points: { at, x, itemId }, or
  //   2) a formation: { formation:true, formationDepth, formationRevealY,
  //                    points:[{ x, formationY, itemId }] }.
  //
  // Formations are scheduled from their vertical geometry. Items lower in the
  // intended shape spawn earlier, items higher in the shape spawn later, and
  // every point reaches its requested position at the same reveal moment.
  // This is what lets a drawn heart/arrow/zigzag actually read as a shape
  // instead of becoming a fast pile of unrelated falling items.
  const PATTERN_FORMATION_DEFAULTS = Object.freeze({
    depth: 260,          // logical canvas pixels of vertical shape space
    revealY: 0.30,       // centre of the shape as a fraction of canvas height
    formationHold: 0,    // seconds the completed formation stays readable
    previewHold: 2.4,    // quiet time after the final pattern entry in the lab
  });

  function _clampPatternNumber(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function _clampPatternX(x) {
    const pad = CONFIG.FOOD_W / 2;
    const normalized = _clampPatternNumber(x, 0, 1, 0.5);
    return Math.max(pad, Math.min(CONFIG.CANVAS_W - pad, normalized * CONFIG.CANVAS_W));
  }

  function _getFormationY(point) {
    const value = point && (point.formationY ?? point.y ?? point.visualY);
    return Number.isFinite(Number(value)) ? _clampPatternNumber(value, 0.02, 0.98, 0.5) : null;
  }

  function _clonePatternDefinition(definition) {
    return {
      id: typeof definition.id === 'string' ? definition.id : 'custom_pattern',
      label: typeof definition.label === 'string' ? definition.label : 'Custom Pattern',
      speedMode: definition.speedMode,
      fixedFallSpeed: definition.fixedFallSpeed,
      speedMultiplier: definition.speedMultiplier,
      saturation: definition.saturation,
      recordingPointGap: definition.recordingPointGap,
      formationHold: definition.formationHold,
      rest: definition.rest,
      formation: !!definition.formation,
      formationDepth: definition.formationDepth,
      formationRevealY: definition.formationRevealY,
      points: definition.points.map(point => ({ ...point })),
    };
  }

  function _normalisePatternDefinition(input, fallbackRest = 0.55) {
    const source = Array.isArray(input) ? { points: input } : (input || {});
    const rawPoints = Array.isArray(source.points) ? source.points : [];
    const hasFormationPoint = rawPoints.some(point => _getFormationY(point) !== null);
    const formation = source.formation === true || source.timingMode === 'formation' || hasFormationPoint;
    const points = rawPoints.map((point, index) => ({
      at: _clampPatternNumber(point && (point.at ?? point.delay), 0, 30, index * 0.12),
      x: _clampPatternNumber(point && point.x, 0.02, 0.98, 0.5),
      formationY: _getFormationY(point),
      itemId: typeof (point && point.itemId) === 'string' ? point.itemId : 'food_random',
      speedMultiplier: _clampPatternNumber(point && point.speedMultiplier, 0.25, 4, 1),
    })).slice(0, 48);
    if (!points.length) return null;
    return {
      id: typeof source.id === 'string' && /^[a-z][a-z0-9_]{0,47}$/i.test(source.id) ? source.id : 'custom_pattern',
      label: typeof source.label === 'string' ? source.label.slice(0, 64) : 'Custom Pattern',
      // Fixed speed gives Pattern Lab a predictable preview independent of
      // the current wave. Relative remains the backwards-compatible default
      // for existing registry entries that should scale with difficulty.
      speedMode: source.speedMode === 'relative' ? 'relative' : ((source.speedMode === 'fixed' || Number.isFinite(Number(source.fixedFallSpeed ?? source.fallSpeed))) ? 'fixed' : 'relative'),
      fixedFallSpeed: Number.isFinite(Number(source.fixedFallSpeed ?? source.fallSpeed))
        ? _clampPatternNumber(source.fixedFallSpeed ?? source.fallSpeed, 45, 360, 105) : null,
      speedMultiplier: _clampPatternNumber(source.speedMultiplier, 0.25, 4, 1),
      // Saturation deterministically keeps an evenly distributed subset of
      // the drawn points. Old patterns have no field and remain 100% dense.
      saturation: _clampPatternNumber(source.saturation ?? source.density, 0.10, 1, 1),
      recordingPointGap: _clampPatternNumber(source.recordingPointGap ?? source.pointGap, 12, 150, 46),
      formationHold: _clampPatternNumber(source.formationHold ?? source.revealHold, 0, 5, PATTERN_FORMATION_DEFAULTS.formationHold),
      rest: _clampPatternNumber(source.rest, 0, 10, fallbackRest),
      formation,
      formationDepth: _clampPatternNumber(source.formationDepth ?? source.shapeDepth, 90, 620, PATTERN_FORMATION_DEFAULTS.depth),
      formationRevealY: _clampPatternNumber(source.formationRevealY ?? source.revealY, 0.18, 0.72, PATTERN_FORMATION_DEFAULTS.revealY),
      points,
    };
  }

  // Deterministic sampling means a low-density heart/arrow still keeps its
  // outline rather than choosing a random cluster from the beginning of a stroke.
  function _saturatedPatternPoints(points, saturation) {
    const source = Array.isArray(points) ? points : [];
    const total = source.length;
    if (!total) return [];
    const density = _clampPatternNumber(saturation, 0.10, 1, 1);
    const wanted = Math.max(1, Math.min(total, Math.ceil(total * density)));
    if (wanted >= total) return source.slice();
    if (wanted === 1) return [source[Math.floor((total - 1) / 2)]];
    const indexes = new Set();
    for (let i = 0; i < wanted; i++) indexes.add(Math.round(i * (total - 1) / (wanted - 1)));
    for (let i = 0; indexes.size < wanted && i < total; i++) indexes.add(i);
    return Array.from(indexes).sort((a, b) => a - b).map(index => source[index]);
  }

  function _patternBaseSpeed(pattern, pointMultiplier) {
    const multiplier = _clampPatternNumber(pointMultiplier, 0.25, 4, 1);
    // A fixed pace is intentionally independent of the current level and
    // character modifiers. This makes the editor's preview reproducible.
    if (pattern && pattern.speedMode === 'fixed' && Number.isFinite(pattern.fixedFallSpeed)) {
      return Math.max(20, pattern.fixedFallSpeed * multiplier);
    }
    const charDef = getCharDef();
    const charSpeedMult = (charDef && charDef.stats && charDef.stats.foodSpeedMult) || 1;
    // Relative patterns retain the existing production behavior: their fall
    // speed rises with the game curve but has no random per-item drift.
    const base = GAME_BALANCE.spawn.foodSpeedBase + GAME_BALANCE.spawn.foodSpeedRand * 0.5;
    return Math.max(20, base * speedMult * charSpeedMult * pattern.speedMultiplier * multiplier * _effectiveFallSpeedMult());
  }

  function _formationSchedule(normalised) {
    const allFormationPoints = normalised.points.filter(point => point.formationY !== null);
    const points = _saturatedPatternPoints(normalised.points, normalised.saturation);
    const formationPoints = points.filter(point => point.formationY !== null);
    if (!normalised.formation || !formationPoints.length) {
      return points
        .slice()
        .sort((a, b) => a.at - b.at)
        .map(point => ({ ...point, scheduledAt: point.at, resolvedSpeed: _patternBaseSpeed(normalised, point.speedMultiplier || 1) }));
    }

    // Use the original geometry's bounds, even when density removes some
    // points, so the remaining outline keeps the intended vertical scale.
    const rangeSource = allFormationPoints.length ? allFormationPoints : formationPoints;
    const minY = Math.min(...rangeSource.map(point => point.formationY));
    const maxY = Math.max(...rangeSource.map(point => point.formationY));
    const range = Math.max(0.001, maxY - minY);
    const centreY = normalised.formationRevealY * CONFIG.CANVAS_H;
    const topY = Math.max(CONFIG.FOOD_H, centreY - normalised.formationDepth / 2);
    const bottomY = Math.min(CONFIG.CANVAS_H - CONFIG.FOOD_H * 2, centreY + normalised.formationDepth / 2);
    const usableDepth = Math.max(CONFIG.FOOD_H, bottomY - topY);

    const staged = points.map(point => {
      const sourceY = point.formationY === null ? 0.5 : point.formationY;
      const yT = range <= 0.002 ? 0.5 : (sourceY - minY) / range;
      const targetY = topY + yT * usableDepth;
      const resolvedSpeed = _patternBaseSpeed(normalised, point.speedMultiplier || 1);
      const travelTime = Math.max(0, (targetY + CONFIG.FOOD_H) / resolvedSpeed);
      return { ...point, targetY, resolvedSpeed, travelTime };
    });
    const revealAt = Math.max(...staged.map(point => point.travelTime));

    return staged
      .map(point => ({ ...point, scheduledAt: Math.max(0, revealAt - point.travelTime) }))
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  function _createPatternItem(point, patternSettings) {
    const itemId = point.itemId || 'food_random';
    const fallSpeed = Number.isFinite(point.resolvedSpeed)
      ? point.resolvedSpeed
      : _patternBaseSpeed(patternSettings || { speedMode: 'relative', speedMultiplier: 1 }, point.speedMultiplier || 1);
    const puMap = {
      shield_pu: { effect: 'shield', dur: 6 }, slowfood_pu: { effect: 'slowFood', dur: 7 },
      doublepoints_pu: { effect: 'doublePoints', dur: 8 }, speedboost_pu: { effect: 'speedBoost', dur: 5 },
      magnet_pu: { effect: 'magnet', dur: 6 }, scoreboost_pu: { effect: 'scoreBoost', dur: 8 },
      piercing_pu: { effect: 'piercing', dur: 7 }, vacuum_pu: { effect: 'vacuum', dur: 5 },
    };
    let item;
    if (puMap[itemId]) {
      const { effect, dur } = puMap[itemId];
      item = EntityFactory.createPowerUp(effect, dur);
    } else if (itemId === 'heart') {
      item = EntityFactory.createHeart(fallSpeed);
    } else if (itemId === 'blueHeart') {
      item = EntityFactory.createBlueHeart(fallSpeed);
    } else if (itemId === 'syringe') {
      item = EntityFactory.createSyringe(fallSpeed);
    } else if (itemId === 'sun') {
      item = EntityFactory.createSun(fallSpeed * 0.7);
    } else if (itemId === 'giftBox') {
      item = EntityFactory.createGiftBox(fallSpeed);
    } else if (itemId === 'hazard_bomb') {
      item = EntityFactory.createHazard('bomb', fallSpeed);
    } else if (itemId === 'hazard_fire') {
      item = EntityFactory.createHazard('fire', fallSpeed);
    } else if (itemId === 'hazard_caution') {
      item = EntityFactory.createHazard('caution', fallSpeed);
    } else if (itemId === 'hazard_random' || itemId === 'bomb') {
      const hazard = HAZARD_DATA[Math.floor(Math.random() * HAZARD_DATA.length)];
      item = EntityFactory.createHazard(hazard.id, fallSpeed);
    } else {
      const foodMatch = /^food:(\d+)$/.exec(itemId);
      const foodIndex = foodMatch ? Number(foodMatch[1]) : -1;
      const foodId = (typeof itemId === 'string' && /^food\.[a-z0-9-]+$/.test(itemId) &&
          (!getArcadeFoodDef || getArcadeFoodDef(itemId)))
        ? itemId
        : (foodIndex >= 0 && foodIndex < ARCADE_FOOD_IDS.length
          ? ARCADE_FOOD_IDS[foodIndex]
          : randomArcadeFoodId());
      item = EntityFactory.createFood(foodId, false, false, fallSpeed);
    }
    item.x = _clampPatternX(point.x);
    item.y = -CONFIG.FOOD_H;
    // Special items have legacy default speeds in EntityFactory. A pattern's
    // speed control is intentional and must win for every item category.
    item.speed = fallSpeed;
    item.isPatternDrop = true;
    if (Number.isFinite(point.targetY)) {
      item.patternTargetY = point.targetY;
      item.patternReached = false;
      item.patternHoldDuration = _clampPatternNumber(patternSettings && patternSettings.formationHold, 0, 5, 0);
      item.patternHoldRemaining = item.patternHoldDuration;
    }
    return item;
  }

  function _queuePatternDefinition(definition, options = {}) {
    const normalised = _normalisePatternDefinition(definition);
    if (!normalised) return false;
    const scheduled = _formationSchedule(normalised);
    let previousAt = 0;
    queuedPattern = scheduled.map(point => {
      const at = point.scheduledAt;
      const entry = {
        ...point,
        delay: Math.max(0, at - previousAt),
        patternSettings: {
          speedMode: normalised.speedMode,
          fixedFallSpeed: normalised.fixedFallSpeed,
          speedMultiplier: normalised.speedMultiplier,
          formationHold: normalised.formationHold,
        },
      };
      previousAt = at;
      return entry;
    });
    queuedPatternRestAfter = Number.isFinite(options.restAfter)
      ? Math.max(0, options.restAfter)
      : normalised.rest;
    return true;
  }

  function _drainQueuedPattern(dt, activeEntities) {
    if (queuedPatternRest > 0) {
      queuedPatternRest = Math.max(0, queuedPatternRest - dt);
      return true;
    }
    if (!queuedPattern.length) return false;
    let remaining = Math.max(0, dt);
    let safety = 0;
    while (queuedPattern.length && safety++ < 64) {
      const next = queuedPattern[0];
      next.delay -= remaining;
      if (next.delay > 0) break;
      remaining = -next.delay;
      queuedPattern.shift();
      _pushSpawn(activeEntities, _createPatternItem(next, next.patternSettings));
    }
    if (!queuedPattern.length) {
      queuedPatternRest = queuedPatternRestAfter;
      queuedPatternRestAfter = 0;
    }
    return true;
  }

  function _clearQueuedPattern() {
    queuedPattern = [];
    queuedPatternRest = 0;
    queuedPatternRestAfter = 0;
  }

  function _registeredPattern(name) {
    if (typeof DROP_PATTERN_REGISTRY === 'undefined' || !DROP_PATTERN_REGISTRY || typeof name !== 'string') return null;
    return _normalisePatternDefinition(DROP_PATTERN_REGISTRY[name]);
  }



  function update(dt, entities) {
    const zenCelebrating = GameState.currentMode === 'zen' && typeof ZenState !== 'undefined' && ZenState.celebrationTimer > 0;

    if (ProgressionState.transitioning) {
      if (burstQueue.length > 0) {
        burstQueue[0].delay -= dt;
        if (burstQueue[0].delay <= 0) { burstQueue.shift(); }
      }
      return;
    }

    if (burstQueue.length > 0 && !zenCelebrating) {
      burstQueue[0].delay -= dt;
      if (burstQueue[0].delay <= 0) {
        burstQueue.shift();
        _pushSpawn(entities, createFoodAt(null));
      }
    }

    if (zenCelebrating) return;

    // Data formations own their cadence while queued, including their planned rest.
    if (_drainQueuedPattern(dt, entities)) return;

    timer += dt;
    const ddaMult = DDAManager.getAdjustment(GameState.currentMode);
    const adjustedInterval = interval * ddaMult / _effectiveSpawnRateMult();
    if (timer >= adjustedInterval) {
      timer = 0;
      const override = (typeof TWEAK !== 'undefined' && TWEAK.spawnPatternOverride && TWEAK.spawnPatternOverride !== 'auto')
        ? TWEAK.spawnPatternOverride : null;
      const pattern = override || getCurrentLevelConfig().spawnPattern;
      const livingPlan = !override
        && GameState.currentMode === 'standard'
        && typeof ArcadeLivingFeastDirector !== 'undefined'
        ? ArcadeLivingFeastDirector.getPlan()
        : null;
      const livingFormationActive = Boolean(livingPlan && livingPlan.formation && livingPlan.formation !== 'normal');
      const spawnPlannedItem = (guardReachability = false) => {
        const item = livingPlan ? createLivingFeastItem(livingPlan) : createFoodAt(null, { guardReachability });
        _pushSpawn(entities, item);
        return item;
      };

      if (livingFormationActive) {
        // Only explicit Living Feast formations replace Standard mode's positional
        // pattern. A normal Director plan keeps the established zigzag, burst,
        // rainfall, sweep, and registered pattern behavior intact.
        spawnPlannedItem(false);
      } else {
        const registered = _registeredPattern(pattern);
        if (registered) {
          _queuePatternDefinition(registered);
          _drainQueuedPattern(0, entities);
          return;
        }


        if (pattern === 'burst' && Math.random() < 0.3 && burstQueue.length === 0) {
          const bx = CONFIG.FOOD_W/2 + Math.random() * (CONFIG.CANVAS_W - CONFIG.FOOD_W);
          const count = 3 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) burstQueue.push({ delay: i * 0.08, x: bx });
          _pushSpawn(entities, createFoodAt(bx));
        } else if (pattern === 'rainfall') {
          if (!rainfallZone || rainfallCount <= 0) {
            const zones = ['left', 'mid', 'right'];
            rainfallZone = zones[Math.floor(Math.random() * 3)];
            rainfallCount = 4 + Math.floor(Math.random() * 3);
          }
          _pushSpawn(entities, createFoodAt(getZoneX(rainfallZone)));
          rainfallCount--;
        } else if (pattern === 'sweep') {
          // Continuous back-and-forth sweep across the canvas width
          sweepX += sweepDir * 0.16;
          if (sweepX >= 1) { sweepX = 1; sweepDir = -1; }
          if (sweepX <= 0) { sweepX = 0; sweepDir = 1; }
          const pad = CONFIG.FOOD_W / 2;
          const sx = pad + sweepX * (CONFIG.CANVAS_W - pad * 2);
          _pushSpawn(entities, createFoodAt(sx));
        } else if (pattern === 'zigzag') {
          // Alternates spawns between the left and right zones each tick
          zigzagSide = zigzagSide === 'left' ? 'right' : 'left';
          _pushSpawn(entities, createFoodAt(getZoneX(zigzagSide)));
        } else {
          _pushSpawn(entities, createFoodAt(null, { guardReachability: true }));
        }
      }

      const _spCfg = getSpawnCfg();
      if (Math.random() < _spCfg.doubleChance) spawnPlannedItem(false);
      if (Math.random() < _spCfg.tripleChance) spawnPlannedItem(false);

      const isZen = GameState.currentMode === 'zen';
      const charDef = getCharDef();
      const isCount = hasAbility(charDef, 'vampireFeed');
      const sunChance = isZen ? 0 : (GameState.level >= 3 ? Math.min(0.004 + (GameState.level - 3) * 0.0008, 0.012) : 0);
      if (Math.random() < sunChance) _pushSpawn(entities, createSun());

      const lvlCfg = getCurrentLevelConfig();
      const heartCap = isCount ? Math.max(lvlCfg.heartCap, GAME_BALANCE.count.heartCap || 12) : lvlCfg.heartCap;
      if (!isZen && ProgressionState.heartsSpawnedThisLevel < heartCap) {
        const heartChance = isCount ? (GAME_BALANCE.count.bonusHeartChance || 0.18) : 0.04;
        if (Math.random() < heartChance) {
          _pushSpawn(entities, createHeart());
          ProgressionState.heartsSpawnedThisLevel++;
        }
      }

      const _puBase  = GAME_BALANCE.spawn.powerUpChance  || 0.018;
      const _puMinLv = GAME_BALANCE.spawn.powerUpMinLevel || 2;
      const powerUpChance = Math.min(_puBase + GameState.level * 0.002, 0.12);
      if (Math.random() < powerUpChance && (isZen || GameState.level >= _puMinLv)) {
        const POWERUP_POOL = isZen ? [
          { id: 'piercing', dur: 7, weight: 4 },
          { id: 'vacuum',   dur: 5, weight: 3 },
          { id: 'slowFood', dur: 7, weight: 3 },
        ] : [
          { id: 'shield',       dur: 6,  weight: 3 },
          { id: 'slowFood',     dur: 7,  weight: 4 },
          { id: 'doublePoints', dur: 8,  weight: 3 },
          { id: 'speedBoost',   dur: 5,  weight: 2 },
          { id: 'magnet',       dur: 6,  weight: 2 },
          { id: 'scoreBoost',   dur: 8,  weight: 2 },
          { id: 'piercing',     dur: 7,  weight: 1 },
          { id: 'vacuum',       dur: 5,  weight: 1 },
        ];
        const totalW = POWERUP_POOL.reduce((s, p) => s + p.weight, 0);
        let roll = Math.random() * totalW;
        const picked = POWERUP_POOL.find(p => (roll -= p.weight) < 0) || POWERUP_POOL[0];
        _pushSpawn(entities, EntityFactory.createPowerUp(picked.id, picked.dur));
      }

      // ── Gift Box spawn ────────────────────────────────────────────────
      if (typeof GIFT_BOX_CONFIG !== 'undefined' &&
          GameState.level >= (GIFT_BOX_CONFIG.minLevel || 1) &&
          Math.random() < (GIFT_BOX_CONFIG.spawnChance || 0.008)) {
        _pushSpawn(entities, EntityFactory.createGiftBox());
      }
    }
  }

  // ── Dev: Force-spawn a specific item immediately, bypassing wave logic ──────
  // itemId matches ITEM_SHOP_DATA ids (e.g. 'shield_pu') or special keys:
  //   'heart', 'blueHeart', 'food', 'bomb', 'syringe', 'sun'
  // The entity is pushed straight into entities.foods so it starts falling
  // immediately. foodsEaten and wave timers are NOT touched.
  function forceSpawnItem(itemId) {
    if (GameState.mode !== GAME_MODES.PLAYING) return;
    const pad  = CONFIG.FOOD_W / 2;
    const spawnX = pad + Math.random() * (CONFIG.CANVAS_W - pad * 2);
    const baseSpd = (GAME_BALANCE.spawn.foodSpeedBase + Math.random() * GAME_BALANCE.spawn.foodSpeedRand) * speedMult;
    let item;

    // Map ITEM_SHOP_DATA ids (e.g. 'shield_pu') to power-up effect ids
    const puMap = {
      shield_pu:       { effect: 'shield',       dur: 6  },
      slowfood_pu:     { effect: 'slowFood',      dur: 7  },
      doublepoints_pu: { effect: 'doublePoints',  dur: 8  },
      speedboost_pu:   { effect: 'speedBoost',    dur: 5  },
      magnet_pu:       { effect: 'magnet',        dur: 6  },
      scoreboost_pu:   { effect: 'scoreBoost',    dur: 8  },
      piercing_pu:     { effect: 'piercing',      dur: 7  },
      vacuum_pu:       { effect: 'vacuum',        dur: 5  },
    };

    if (puMap[itemId]) {
      const { effect, dur } = puMap[itemId];
      item = EntityFactory.createPowerUp(effect, dur);
    } else {
      switch (itemId) {
        case 'heart':
          item = EntityFactory.createHeart(65);
          break;
        case 'blueHeart':
          item = EntityFactory.createBlueHeart(65);
          break;
        case 'bomb':
        case 'hazard_random':
          item = EntityFactory.createHazard(HAZARD_DATA[Math.floor(Math.random() * HAZARD_DATA.length)].id, baseSpd);
          break;
        case 'hazard_bomb':
          item = EntityFactory.createHazard('bomb', baseSpd);
          break;
        case 'hazard_fire':
          item = EntityFactory.createHazard('fire', baseSpd);
          break;
        case 'hazard_caution':
          item = EntityFactory.createHazard('caution', baseSpd);
          break;
        case 'syringe':
          item = EntityFactory.createSyringe(80 + Math.random() * 40);
          break;
        case 'sun':
          item = EntityFactory.createSun(baseSpd * 0.7);
          break;
        case 'food':
        default:
          item = EntityFactory.createFood(randomArcadeFoodId(), false, false, baseSpd);
          break;
      }
    }

    item.x = spawnX;
    item.y = -CONFIG.FOOD_H;
    entities.foods.push(item);
  }

  const api = {
    reset,
    applyLevel,
    applyWaveConfig,
    createFoodAt,
    createHeart,
    createSun,
    update,
    _speedMult,
    forceSpawnItem,
    getMetrics: () => ({ interval, speedMult }),
    getEffectivePattern: () => (typeof TWEAK !== 'undefined' && TWEAK.spawnPatternOverride && TWEAK.spawnPatternOverride !== 'auto')
      ? TWEAK.spawnPatternOverride : getCurrentLevelConfig().spawnPattern,
  };


  return api;
})();

const InputManager = (() => {
  const keys = {};
  let touchDragging = false;
  let touchDeltaX = 0;
  let touchDeltaY = 0;
  let lastTouchX = null;
  let lastTouchY = null;
  let virtualAxisX = 0;
  let virtualAxisY = 0;
  let arcadeSpaceClaimed = false;

  function arcadeOwnsGameplayKeyboard() {
    if (typeof GameState === 'undefined' || typeof GAME_MODES === 'undefined') return false;
    if (GameState.mode !== GAME_MODES.PLAYING) return false;
    return typeof GameModeRegistry !== 'undefined'
      && Boolean(GameModeRegistry[GameState.currentMode]);
  }

  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' || e.key === 'Escape') { e.preventDefault(); EventBus.emit('escapePressed'); return; }
    keys[e.code] = true;
    const arcadeOwns = arcadeOwnsGameplayKeyboard();
    const arcadeChar = arcadeOwns && typeof getCharDef === 'function' ? getCharDef() : null;
    const toadalActive = arcadeChar?.id === 'toadal';
    if (e.code === 'Space' && arcadeOwns) {
      e.preventDefault();
      // Toadal owns Space as a single tongue snap. Key-repeat must not queue a
      // stream of automatic shots while the player holds the key.
      if (!toadalActive || !e.repeat) {
        arcadeSpaceClaimed = true;
        EventBus.emit('shootPressed');
        EventBus.emit('spaceDown');
      }
    }
    if (toadalActive && !e.repeat && e.code === 'KeyQ') {
      e.preventDefault();
      EventBus.emit('toadalThrowPressed');
    }
    if (toadalActive && !e.repeat && e.code === 'KeyE') {
      e.preventDefault();
      EventBus.emit('toadalBlockPressed');
    }
    if (e.code === 'ArrowUp')   {
      if (arcadeOwns) {
        e.preventDefault();
        const _acd = typeof getCharDef === 'function' ? getCharDef() : null;
        if (_acd?.id === 'toadal') {
          // Toadal's jump is Down/S hold-and-release; Up is intentionally free.
        } else if (_acd && !hasAbility(_acd, 'flyingCatch')) { EventBus.emit('clonePickup'); }
      }
      // Dev-mode combo requires Shift held — plain ArrowUp (used for movement/
      // clone-pickup during normal play, and pressed often while idling on the
      // menu) was triggering the 5-press unlock-everything easter egg by
      // accident, silently granting every character and cosmetic in the shop.
      if (e.shiftKey && typeof GameState !== 'undefined' && typeof GAME_MODES !== 'undefined' && GameState.mode === GAME_MODES.MENU) {
        e.preventDefault();
        EventBus.emit('menuArrowUp');
      }
    }
    if (e.code === 'ArrowDown' && arcadeOwns) {
      e.preventDefault();
      const _acd2 = typeof getCharDef === 'function' ? getCharDef() : null;
      if (_acd2?.id === 'toadal') {
        // Held state is sampled by ArcadeToadalMechanics; release launches the
        // charged Royal Hop. Do not also dispatch Flytrap's clone-place action.
      } else if (_acd2 && !hasAbility(_acd2, 'flyingCatch')) { EventBus.emit('clonePlace'); }
    }
  });
  
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'Space' && arcadeSpaceClaimed) {
      arcadeSpaceClaimed = false;
      EventBus.emit('spaceUp');
    }
  });

  let touchStartX = 0, touchStartY = 0, touchMoved = false;
  let touchGestureMax = 0;
  let touchGestureHandled = false;
  let touchGestureStartedPaused = false;
  let suppressTouchTap = false;
  let touchActionActive = false;
  let touchActionStarted = false;

  function resetTouchGesture() {
    touchDragging = false;
    touchDeltaX = 0;
    touchDeltaY = 0;
    lastTouchX = null;
    lastTouchY = null;
    touchMoved = false;
    touchStartX = 0;
    touchStartY = 0;
    touchGestureMax = 0;
    touchGestureHandled = false;
    touchGestureStartedPaused = false;
    suppressTouchTap = false;
    touchActionActive = false;
    touchActionStarted = false;
  }

  function arcadeTouchActionRequirements() {
    if (!document.body?.classList?.contains('arcade-mobile-controls-visible')) return [];
    const definition = typeof getCharDef === 'function' ? getCharDef() : null;
    const behavior = definition && typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(definition)
      : null;
    return behavior?.mobileControlRequirements || [];
  }

  function beginArcadePlayfieldAction() {
    if (GameState.mode !== GAME_MODES.PLAYING) return false;
    const requirements = arcadeTouchActionRequirements();
    const cloneAction = requirements.includes('clone-pickup') || requirements.includes('clone-place');
    if (cloneAction) {
      if (GameState.charState?.flytrap?.cloneHeld) EventBus.emit('clonePlace');
      else EventBus.emit('clonePickup');
      touchActionStarted = true;
      return true;
    }
    if (requirements.includes('primary-action') || requirements.includes('hold-primary')) {
      EventBus.emit('shootPressed');
      EventBus.emit('spaceDown');
      touchActionActive = true;
      touchActionStarted = true;
      return true;
    }
    return false;
  }

  function endArcadePlayfieldAction() {
    if (touchActionActive) EventBus.emit('spaceUp');
    touchActionActive = false;
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault(); AudioManager.init();
    const t = e.targetTouches?.[0] || e.changedTouches?.[0], rect = canvas.getBoundingClientRect();
    if (!t || rect.width <= 0 || rect.height <= 0) return;
    const continuingGesture = touchDragging && touchGestureMax > 0;
    const scaleX = CONFIG.CANVAS_W / rect.width;
    const scaleY = CONFIG.CANVAS_H / rect.height;
    lastTouchX = (t.clientX - rect.left) * scaleX;
    lastTouchY = (t.clientY - rect.top) * scaleY;
    if (!continuingGesture) {
      touchStartX = t.clientX; touchStartY = t.clientY;
      touchDragging = true; touchDeltaX = 0; touchDeltaY = 0; touchMoved = false;
      touchGestureHandled = false;
      touchGestureStartedPaused = GameState.mode === GAME_MODES.PAUSED;
      suppressTouchTap = false;
      touchActionStarted = false;
      touchActionActive = false;
      if (beginArcadePlayfieldAction()) suppressTouchTap = true;
    }
    touchGestureMax = Math.max(touchGestureMax, Number(e.targetTouches?.length || 0));
    // A tap used to resume also reached touchend and fired a tongue shot. Resume
    // remains immediate, but this gesture is consumed so play restarts cleanly.
    if (GameState.mode === GAME_MODES.PAUSED) {
      suppressTouchTap = true;
      EventBus.emit('resumePressed');
    }
  }, { passive: false });
  
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.targetTouches?.[0] || e.changedTouches?.[0], rect = canvas.getBoundingClientRect();
    if (!t || rect.width <= 0 || rect.height <= 0) return;
    touchGestureMax = Math.max(touchGestureMax, Number(e.targetTouches?.length || 0));
    if (touchActionStarted) return;
    const scaleX = CONFIG.CANVAS_W / rect.width;
    const scaleY = CONFIG.CANVAS_H / rect.height;
    const tx = (t.clientX - rect.left) * scaleX;
    const ty = (t.clientY - rect.top) * scaleY;
    touchDeltaX = tx - (lastTouchX ?? tx); lastTouchX = tx;
    touchDeltaY = ty - (lastTouchY ?? ty); lastTouchY = ty;
    if (Math.abs(t.clientX - touchStartX) > 8 || Math.abs(t.clientY - touchStartY) > 8) touchMoved = true;
  }, { passive: false });
  
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    // targetTouches excludes the thumb held on the separate joystick element,
    // so a second finger can tap the canvas for the character action without
    // being mistaken for the two-finger pause gesture.
    const allTouchesEnded = Number(e.targetTouches?.length || 0) === 0;
    if (allTouchesEnded) endArcadePlayfieldAction();
    // changedTouches usually contains only the finger that lifted, so checking
    // its length made the documented two-finger pause gesture unreliable.
    if (touchGestureMax >= 2) {
      suppressTouchTap = true;
      touchDragging = false;
      touchDeltaX = 0;
      touchDeltaY = 0;
      lastTouchX = null;
      lastTouchY = null;
      if (!touchGestureHandled) {
        touchGestureHandled = true;
        // The first touch already requested Resume when this gesture began on
        // a paused canvas. Do not toggle back to pause when the second finger
        // lifts; consume the whole gesture as one intentional resume.
        if (!touchGestureStartedPaused) {
          if (GameState.mode === GAME_MODES.PLAYING) pauseGame();
          else if (GameState.mode === GAME_MODES.PAUSED) resumeGame();
        }
      }
      if (allTouchesEnded) resetTouchGesture();
      return;
    }
    if (!allTouchesEnded) return;
    if (!suppressTouchTap && !touchMoved && GameState.mode === GAME_MODES.PLAYING) {
      const definition = typeof getCharDef === 'function' ? getCharDef() : null;
      const behavior = definition && typeof getArcadeCharacterBehaviorProfile === 'function'
        ? getArcadeCharacterBehaviorProfile(definition)
        : null;
      const requirements = behavior?.mobileControlRequirements || [];
      const cloneAction = requirements.includes('clone-pickup') || requirements.includes('clone-place');
      if (cloneAction) {
        if (GameState.charState?.flytrap?.cloneHeld) EventBus.emit('clonePlace');
        else EventBus.emit('clonePickup');
      } else if (requirements.includes('primary-action') || requirements.includes('hold-primary')) {
        EventBus.emit('shootPressed');
        EventBus.emit('spaceDown');
        EventBus.emit('spaceUp');
      }
    }
    resetTouchGesture();
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    e.preventDefault();
    endArcadePlayfieldAction();
    resetTouchGesture();
  }, { passive: false });
  
  canvas.addEventListener('click', () => AudioManager.init());

  const virtualKeys = {};

  // Pausing, exiting, and starting a fresh run are hard input boundaries.
  // Clear both hardware and virtual-button state so a lost pointerup/keyup
  // event cannot make the frog keep moving after Resume or a new run.
  function clearTransientInput() {
    Object.keys(keys).forEach(code => { keys[code] = false; });
    Object.keys(virtualKeys).forEach(code => { virtualKeys[code] = false; });
    if (arcadeSpaceClaimed) {
      arcadeSpaceClaimed = false;
      EventBus.emit('spaceUp');
    }
    virtualAxisX = 0;
    virtualAxisY = 0;
    try { ArcadeToadalMechanics?.cancelCrouch?.('input-reset'); } catch (_) {}
    resetTouchGesture();
  }

  // Browser chrome, app switching, and interrupted pointers can swallow keyup
  // or touchend. Clear immediately so returning to play can never leave the
  // character drifting from stale input.
  window.addEventListener('blur', clearTransientInput);

  function consumeTouchDelta() { const d = touchDeltaX; touchDeltaX = 0; return d; }
  function consumeTouchVector() {
    const vector = { x: touchDeltaX, y: touchDeltaY };
    touchDeltaX = 0; touchDeltaY = 0;
    return vector;
  }
  function isDown(code) { return !!(keys[code] || virtualKeys[code]); }
  function setVirtualKey(code, val) { virtualKeys[code] = val; }
  function setVirtualAxis(x, y) {
    virtualAxisX = Math.max(-1, Math.min(1, Number(x) || 0));
    virtualAxisY = Math.max(-1, Math.min(1, Number(y) || 0));
  }
  function getVirtualAxis() { return { x:virtualAxisX, y:virtualAxisY }; }

  return { isDown, isTouchDragging: () => touchDragging, consumeTouchDelta, consumeTouchVector, setVirtualKey, setVirtualAxis, getVirtualAxis, clearTransientInput };
})();

const FXManager = (() => {
  const presentationBudget = globalThis.FroggyEnginePerformance?.budgetForMode?.('arcade') || null;
  const particleScale = Math.max(0.2, Math.min(1, Number(presentationBudget?.particleScale) || 1));
  const MAX_PARTICLES = Math.max(1, Number(presentationBudget?.maxParticles) || 180);
  const MAX_PARTICLES_PER_BURST = Math.max(1, Number(presentationBudget?.maxParticlesPerBurst) || 32);
  const MAX_FLOATING_TEXTS = Math.max(1, Number(presentationBudget?.maxFloaters) || 18);

  function spawnParticles(entities, x, y, color, count = 12) {
    const list = entities?.particles;
    if (!Array.isArray(list)) return 0;
    const scaled = Math.ceil(Math.max(0, Number(count) || 0) * particleScale);
    const requested = Math.max(0, Math.min(MAX_PARTICLES_PER_BURST, scaled));
    const overflow = Math.max(0, list.length + requested - MAX_PARTICLES);
    if (overflow > 0) list.splice(0, Math.min(overflow, list.length));
    const allowed = Math.min(requested, MAX_PARTICLES - list.length);
    for (let i = 0; i < allowed; i++) list.push(EntityFactory.createParticle(x, y, color));
    return allowed;
  }
  function spawnFloatingText(entities, x, y, text, color = '#ffd700') {
    const list = entities?.floatingTexts;
    if (!Array.isArray(list)) return false;
    if (list.length >= MAX_FLOATING_TEXTS) list.splice(0, list.length - MAX_FLOATING_TEXTS + 1);
    list.push({ x, y, text, color, life: 1.2, maxLife: 1.2, vy: -60 });
    return true;
  }
  return {
    spawnParticles,
    spawnFloatingText,
    rewardCoins:typeof RewardCoinCelebration !== 'undefined' ? RewardCoinCelebration : null,
    limits:Object.freeze({ particles:MAX_PARTICLES, perBurst:MAX_PARTICLES_PER_BURST, floatingTexts:MAX_FLOATING_TEXTS }),
  };
})();

const SceneManager = (() => {
  const SCENES = {
    menu:    { show: ['mainMenu'],       hide: ['pauseOverlay','gameOverOverlay','escHint'] },
    playing: { show: ['escHint'],        hide: ['mainMenu','pauseOverlay','gameOverOverlay'] },
    paused:  { show: ['pauseOverlay'],   hide: ['escHint'] },
    dead:    { show: ['gameOverOverlay'], hide: ['escHint'] },
  };
  function go(scene) {
    const previousScene = GameState.mode;
    GameState.mode = scene;
    const cfg = SCENES[scene];
    if (!cfg) return;
    cfg.show.forEach(id => { const el=document.getElementById(id); if(el) el.classList.remove('hidden'); });
    cfg.hide.forEach(id => { const el=document.getElementById(id); if(el) el.classList.add('hidden'); });
    EventBus?.emit?.('sceneChanged', { scene, previousScene });
  }
  return { go };
})();

function arcadeSafeSpawnX(visualScale = 1) {
  // Spawn centers respect the actual rendered silhouette, not only the legacy
  // collision box. This prevents large food/hazard art from entering half cut
  // off at the left/right corners of the Arcade frame.
  const scale = Math.max(1, Number(visualScale) || 1);
  const half = Math.max(CONFIG.FOOD_W, CONFIG.FOOD_H) * .5 * scale + 6;
  const min = Math.min(CONFIG.CANVAS_W * .5, half);
  const max = Math.max(min, CONFIG.CANVAS_W - half);
  return min + Math.random() * Math.max(0, max - min);
}

const EntityFactory = {
  createFood(itemId, isBomb = false, isHeart = false, speed = 100, isSun = false) {
    // Compatibility parameters are retained for old dev callers, but the
    // visible runtime data is now ID/key based rather than glyph based.
    if (isSun) return this.createSun(speed);
    if (isHeart) return this.createHeart(speed);
    if (isBomb) return this.createHazard(itemId || 'bomb', speed);
    const foodDef = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(itemId) : null;
    LiveStats.foodsSpawned++;
    return {
      type: 'food', tags: ['collectible'],
      x: arcadeSafeSpawnX(Math.max(1.18, Number((typeof GAME_BALANCE !== 'undefined' ? GAME_BALANCE.arcadePresentation?.foodVisualScale : 1.30) || 1.30))),
      y: -CONFIG.FOOD_H,
      itemId: foodDef ? foodDef.itemId : String(itemId || ''),
      assetKey: foodDef?.assetKey || null,
      visualKind: foodDef?.visualKind || 'apple',
      isBomb: false, isHazard: false, hazardType: null,
      isHeart: false, isBlueHeart: false, isSun: false,
      speed,
      wobble: (Math.random() - 0.5) * 0.8,
      wobbleTime: Math.random() * 10,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0,
    };
  },
  createHazard(hazardId, speed) {
    const hazard = typeof getHazardDef === 'function' ? getHazardDef(hazardId) : null;
    const approvedBinding = typeof ArcadeNonFoodAssetBindings !== 'undefined'
      && typeof ArcadeNonFoodAssetBindings.get === 'function'
      ? ArcadeNonFoodAssetBindings.get(`hazard.${hazard?.visualKind || 'bomb'}`)
      : null;
    if (approvedBinding?.assetKey && typeof AssetManager !== 'undefined' && typeof AssetManager.load === 'function') {
      AssetManager.load(approvedBinding.assetKey);
    }
    LiveStats.bombsSpawned++;
    return {
      type: 'food', tags: ['hazard'],
      x: arcadeSafeSpawnX(1.30),
      y: -CONFIG.FOOD_H,
      itemId: null,
      assetKey: approvedBinding?.assetKey || hazard?.assetKey || 'hazard_bomb',
      visualKind: hazard?.visualKind || 'bomb',
      isBomb: true, isHazard: true,
      hazardType: hazard?.id || 'bomb',
      hazardLabel: hazard?.label || 'Bomb',
      isHeart: false, isBlueHeart: false, isSun: false,
      speed,
      wobble: (Math.random() - 0.5) * 0.8,
      wobbleTime: Math.random() * 10,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0,
    };
  },
  createHeart(speed, isBlueHeart = false) {
    LiveStats.heartsSpawned++;
    return {
      type: 'food', tags: ['powerup'],
      x: arcadeSafeSpawnX(1.16),
      y: -CONFIG.FOOD_H,
      itemId: null,
      assetKey: isBlueHeart ? 'pickup_heart_blue' : 'pickup_heart_red',
      visualKind: isBlueHeart ? 'heart-blue' : 'heart-red',
      isBomb: false, isHazard: false, hazardType: null,
      isHeart: true, isBlueHeart: !!isBlueHeart, isSun: false,
      speed,
      wobble: (Math.random() - 0.5) * 0.8,
      wobbleTime: Math.random() * 10,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0,
    };
  },
  createBlueHeart(speed) {
    return this.createHeart(speed, true);
  },
  createSun(speed) {
    LiveStats.bombsSpawned++;
    return {
      type: 'food', tags: ['hazard'],
      x: arcadeSafeSpawnX(1.30),
      y: -CONFIG.FOOD_H,
      itemId: null, assetKey: 'hazard_sun', visualKind: 'sun',
      isBomb: false, isHazard: true, hazardType: 'sun',
      isHeart: false, isBlueHeart: false, isSun: true,
      speed,
      wobble: (Math.random() - 0.5) * 0.8,
      wobbleTime: Math.random() * 10,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0,
    };
  },
  createSyringe(speed) {
    LiveStats.powerupsSpawned++;
    return {
      type: 'food', tags: ['powerup'],
      x: arcadeSafeSpawnX(1.18),
      y: -CONFIG.FOOD_H,
      itemId: null, assetKey: 'pickup_syringe', visualKind: 'syringe',
      isBomb: false, isHazard: false, hazardType: null,
      isHeart: false, isBlueHeart: false, isSun: false, isSyringe: true,
      speed,
      wobble: (Math.random() - 0.5) * 0.8,
      wobbleTime: Math.random() * 10,
      rotation: (Math.random() - 0.5) * 0.5,
      scale: 0,
    };
  },
  createPowerUp(effectId, duration) {
    LiveStats.powerupsSpawned++;
    const shopItem = typeof ITEM_SHOP_DATA !== 'undefined'
      ? ITEM_SHOP_DATA.find(item => item.id === `${effectId}_pu` || item.id === effectId)
      : null;
    return {
      type: 'food', tags: ['powerup'],
      x: arcadeSafeSpawnX(1.18),
      y: -CONFIG.FOOD_H,
      itemId: null,
      assetKey: shopItem?.assetKey || `powerup_${String(effectId || 'generic')}`,
      visualKind: 'powerup',
      isBomb: false, isHazard: false, hazardType: null,
      isHeart: false, isBlueHeart: false, isSun: false, isSyringe: false, isPowerUp: true,
      powerUpEffect: effectId, powerUpDuration: duration,
      speed: 65 + Math.random() * 30,
      wobble: (Math.random() - 0.5) * 0.5,
      wobbleTime: Math.random() * 10,
      rotation: 0, scale: 0,
    };
  },
  createGiftBox(speed) {
    LiveStats.powerupsSpawned++;
    return {
      type: 'food', tags: ['powerup'],
      x: arcadeSafeSpawnX(1.18),
      y: -CONFIG.FOOD_H,
      itemId: null, assetKey: 'pickup_gift', visualKind: 'gift',
      isBomb: false, isHazard: false, hazardType: null,
      isHeart: false, isBlueHeart: false, isSun: false,
      isSyringe: false, isPowerUp: false, isGiftBox: true,
      speed: speed || (55 + Math.random() * 25),
      wobble: (Math.random() - 0.5) * 0.5,
      wobbleTime: Math.random() * 10,
      rotation: 0, scale: 0,
    };
  },
  createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2, spd = 80 + Math.random() * 160;
    const life = 0.6 + Math.random() * 0.4;
    return { type:'particle', tags:['fx'], x, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd-60, life, maxLife:life, color, size:4+Math.random()*6 };
  },
  createFloatingText(x, y, text, color='#ffd700') {
    return { type:'floatingText', tags:['ui'], x, y, text, color, life:1.2, maxLife:1.2, vy:-60 };
  },
};
