// ============================================================
// src/runtime/rendering/draw-characters-1.js — retired procedural character bodies
// + Zen Garden restoration presentation extension
// ============================================================
// Character rendering remains asset-authoritative. Legacy Canvas body generators
// were removed to prevent substitute character models from reappearing.
//
// This file is intentionally retained in the render load-order immediately after
// draw-background.js. Zen uses that compatibility slot for a presentation-only
// post-background pass: authored food clutter progressively clears from Princess
// Lily's royal garden. Gameplay/progression authority stays in ZenState.

const ZenRestorationLayer = (() => {
  const TOTAL_CATCHES = 900;
  const ROOM_CATCHES = 180;
  const ROOM_COUNT = 5;
  const CLIP_TOP = 48;
  const CLIP_BOTTOM = 730;
  const CACHE_LIMIT = 30;
  const DEFAULT_FOOD_POOL = Object.freeze([
    'food.apple', 'food.banana', 'food.strawberry', 'food.grapes',
    'food.pizza', 'food.burger', 'food.fries', 'food.cheese', 'food.pretzel',
    'food.carrot', 'food.avocado', 'food.broccoli', 'food.tomato',
    'food.donut', 'food.cookie', 'food.ice-cream-cone', 'food.red-velvet-cake',
    'food.cupcake', 'food.chocolate', 'food.hard-candy', 'food.gummy-bear', 'food.lollipop',
  ]);
  const ROOM_GLOWS = Object.freeze(['#a8f7a0', '#ffd700', '#ff88cc', '#cc88ff', '#fff7cc']);
  const CLEAR_WINDOWS = Object.freeze([
    Object.freeze([0.03, 0.16]),
    Object.freeze([0.17, 0.31]),
    Object.freeze([0.32, 0.46]),
    Object.freeze([0.47, 0.62]),
    Object.freeze([0.63, 0.79]),
    Object.freeze([0.80, 0.97]),
  ]);

  // All five areas are already food-overrun at catch zero. Progress can only
  // remove obstruction; no future room ever "spawns" new clutter.
  // Anchors hug authored garden surfaces: foreground grass, shore planting,
  // side vegetation, tree/castle edges. Keep the open lake/sky corridor clear
  // so restoration reads as clearing an overgrown feast, never floating food.
  const ROOM_ANCHORS = Object.freeze([
    Object.freeze([[46,690,1.08],[172,704,0.98],[310,690,1.00],[432,680,1.06],[95,618,0.92],[360,625,0.95]]),
    Object.freeze([[35,565,0.96],[145,570,0.88],[285,560,0.90],[438,548,0.96],[80,500,0.82],[380,500,0.84]]),
    Object.freeze([[42,445,0.88],[126,430,0.78],[346,420,0.78],[438,440,0.88],[72,382,0.74],[400,376,0.76]]),
    Object.freeze([[28,332,0.78],[82,310,0.70],[404,305,0.70],[454,330,0.78],[46,270,0.66],[432,260,0.68]]),
    Object.freeze([[28,220,0.66],[62,184,0.60],[420,215,0.60],[458,240,0.66],[35,140,0.54],[445,145,0.54]]),
  ]);

  const CLUSTERS = Object.freeze(ROOM_ANCHORS.flatMap((anchors, room) => anchors.map((anchor, index) => {
    const window = CLEAR_WINDOWS[index];
    return Object.freeze({
      id: `zen-r${room + 1}-c${index + 1}`,
      room,
      index,
      start:window[0],
      end:window[1],
      x:anchor[0],
      y:anchor[1],
      scale:anchor[2],
      seed:(room + 1) * 101 + (index + 1) * 37,
    });
  })));

  const state = {
    cache:new Map(),
    skippedClusters:new Set(),
    pool:Object.freeze([]),
    preloadRequested:false,
    compositionLocked:false,
    lastCaught:0,
    catchPulse:0,
    milestoneRoom:-1,
    milestonePulse:0,
    lastFrameTime:0,
    wasZen:false,
  };

  const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
  const smoothstep = value => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  };

  function activeFoodIds() {
    let ids = [];
    if (typeof getArcadeActiveFoodIds === 'function') {
      try { ids = [...getArcadeActiveFoodIds('princess')]; } catch (_) {}
    }
    const fallback = ids.length >= 8 ? ids : DEFAULT_FOOD_POOL;
    const approved = [];
    for (const itemId of fallback) {
      const id = String(itemId || '');
      if (!id || approved.includes(id)) continue;
      const definition = typeof getArcadeFoodDef === 'function' ? getArcadeFoodDef(id) : null;
      if (!definition || String(definition.itemId || '') !== id || definition.runtimeActive === false || !definition.assetKey) continue;
      approved.push(id);
    }
    // Fail closed if the current registry cannot prove enough exact identities.
    // getArcadeFoodDef() has a legacy first-food fallback for unknown IDs; Zen
    // must never turn a missing environmental identity into a misleading Apple.
    return Object.freeze(approved);
  }

  function foodDefinition(itemId) {
    if (typeof getArcadeFoodDef !== 'function') return null;
    const definition = getArcadeFoodDef(itemId);
    if (!definition || String(definition.itemId || '') !== String(itemId || '')
      || definition.runtimeActive === false || !definition.assetKey) return null;
    return definition;
  }

  function foodImage(itemId) {
    const definition = foodDefinition(itemId);
    if (!definition || typeof AssetManager === 'undefined' || typeof AssetManager.getImage !== 'function') return null;
    return AssetManager.getImage(definition.assetKey);
  }

  function requestPreload() {
    if (state.preloadRequested) return;
    state.preloadRequested = true;
    state.pool = activeFoodIds();
    const keys = state.pool.map(foodDefinition).filter(Boolean).map(item => item.assetKey);
    if (typeof AssetManager !== 'undefined' && typeof AssetManager.preload === 'function') {
      try { AssetManager.preload(keys).catch(() => {}); } catch (_) {}
    }
  }

  function createSurface(width, height) {
    if (typeof OffscreenCanvas === 'function') {
      try { return new OffscreenCanvas(width, height); } catch (_) {}
    }
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const surface = document.createElement('canvas');
      surface.width = width;
      surface.height = height;
      return surface;
    }
    return null;
  }

  function hashUnit(seed, salt) {
    const value = Math.sin((seed + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function piecesFor(cluster) {
    const pool = state.pool.length ? state.pool : activeFoodIds();
    if (!pool.length) return [];
    const count = cluster.index % 2 === 0 ? 5 : 4;
    return Array.from({ length:count }, (_, index) => {
      const pick = (cluster.seed + index * 7 + cluster.room * 3) % pool.length;
      return pool[pick];
    });
  }

  function buildClusterSurface(cluster) {
    const foods = piecesFor(cluster);
    const records = foods.map((itemId, index) => ({ itemId, image:foodImage(itemId), index }))
      .filter(record => record.image);
    if (!records.length) return null;

    const width = 116;
    const height = 88;
    const surface = createSurface(width, height);
    const target = surface && typeof surface.getContext === 'function' ? surface.getContext('2d') : null;
    if (!target) return null;

    target.save();
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = 'high';

    // Only floor-level piles receive contact shadow/crumbs. Upper clusters are
    // tucked into authored vegetation/castle edges and must not look like food
    // sitting on floating platters in the lake or sky.
    const groundContact = cluster.y >= 480;
    if (groundContact) {
      target.fillStyle = 'rgba(18,13,12,0.22)';
      target.beginPath();
      target.ellipse(width * 0.50, height * 0.70, 43, 12, 0, 0, Math.PI * 2);
      target.fill();
    }

    records.forEach((record, index) => {
      const img = record.image;
      const aspect = Math.max(0.55, Math.min(1.8,
        (Number(img.naturalWidth || img.width) || 1) / (Number(img.naturalHeight || img.height) || 1)));
      const size = 27 + hashUnit(cluster.seed, index + 11) * 11;
      const drawW = aspect >= 1 ? size : size * aspect;
      const drawH = aspect >= 1 ? size / aspect : size;
      const spread = (index - (records.length - 1) / 2) * 16;
      const jitterX = (hashUnit(cluster.seed, index + 21) - 0.5) * 12;
      const x = width * 0.50 + spread + jitterX;
      const y = height * 0.57 - (index % 2) * 12 - hashUnit(cluster.seed, index + 31) * 7;
      const rotation = (hashUnit(cluster.seed, index + 41) - 0.5) * 0.34;
      target.save();
      target.translate(x, y);
      target.rotate(rotation);
      target.globalAlpha = 0.88;
      target.shadowColor = 'rgba(19,12,10,0.28)';
      target.shadowBlur = 3;
      target.shadowOffsetY = 2;
      try { target.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH); } catch (_) {}
      target.restore();
    });

    // Tiny crumbs bridge floor piles to grass. Never emit them into upper
    // vegetation, where detached crumbs would read as airborne particles.
    if (groundContact) {
      target.fillStyle = 'rgba(236,205,140,0.34)';
      for (let index = 0; index < 5; index += 1) {
        const x = 26 + hashUnit(cluster.seed, index + 51) * 66;
        const y = 61 + hashUnit(cluster.seed, index + 61) * 13;
        const r = 0.8 + hashUnit(cluster.seed, index + 71) * 1.4;
        target.beginPath();
        target.arc(x, y, r, 0, Math.PI * 2);
        target.fill();
      }
    }
    target.restore();
    return Object.freeze({ surface, width, height, itemCount:records.length });
  }

  // Freeze environmental composition on the first valid garden frame. The
  // existing Arcade run-start gate preloads Princess Lily's active food menu.
  // If a particular raster still missed that bounded readiness window, omit its
  // cluster for this run rather than allowing new obstruction to pop into an
  // already-visible garden later. Restoration therefore stays visually one-way.
  function lockComposition() {
    if (state.compositionLocked) return;
    requestPreload();
    state.skippedClusters.clear();
    for (const cluster of CLUSTERS) {
      if (state.cache.has(cluster.id)) continue;
      if (state.cache.size >= CACHE_LIMIT) {
        state.skippedClusters.add(cluster.id);
        continue;
      }
      const built = buildClusterSurface(cluster);
      if (built) state.cache.set(cluster.id, built);
      else state.skippedClusters.add(cluster.id);
    }
    state.compositionLocked = true;
  }

  function cachedCluster(cluster) {
    const existing = state.cache.get(cluster.id);
    if (existing) return existing;
    // Once the first visible garden frame is composed, never add food later.
    if (state.compositionLocked || state.skippedClusters.has(cluster.id)) return null;
    if (state.cache.size >= CACHE_LIMIT) return null;
    const built = buildClusterSurface(cluster);
    if (built) state.cache.set(cluster.id, built);
    return built;
  }

  function roomProgress(totalCaught, room) {
    return clamp01((Math.max(0, Number(totalCaught) || 0) - room * ROOM_CATCHES) / ROOM_CATCHES);
  }

  function remainingAlpha(cluster, totalCaught) {
    const fraction = roomProgress(totalCaught, cluster.room);
    const span = Math.max(0.001, cluster.end - cluster.start);
    return 1 - smoothstep((fraction - cluster.start) / span);
  }

  function computeState(totalCaught) {
    const caught = Math.max(0, Math.min(TOTAL_CATCHES, Math.floor(Number(totalCaught) || 0)));
    const room = Math.min(ROOM_COUNT - 1, Math.floor(caught / ROOM_CATCHES));
    const roomFraction = caught >= TOTAL_CATCHES ? 1 : roomProgress(caught, room);
    const clusters = CLUSTERS.map(cluster => Object.freeze({
      id:cluster.id,
      room:cluster.room,
      remainingAlpha:remainingAlpha(cluster, caught),
    }));
    const cleared = clusters.filter(cluster => cluster.remainingAlpha <= 0.001).length;
    const aggregateRemainingAlpha = clusters.reduce((sum, cluster) => sum + cluster.remainingAlpha, 0);
    return Object.freeze({
      totalCaught:caught,
      totalProgress:clamp01(caught / TOTAL_CATCHES),
      room,
      roomFraction,
      clusters:Object.freeze(clusters),
      clustersTotal:clusters.length,
      clustersCleared:cleared,
      clustersVisible:clusters.length - cleared,
      aggregateRemainingAlpha,
    });
  }

  function currentCaught() {
    if (typeof ZenState === 'undefined') return 0;
    return Math.max(0, Math.min(TOTAL_CATCHES, Number(ZenState.totalCaught) || 0));
  }

  function baseGardenReady() {
    if (typeof LivingFeastBackgroundRenderer === 'undefined' || typeof LivingFeastBackgroundRenderer.snapshot !== 'function') return true;
    const snapshot = LivingFeastBackgroundRenderer.snapshot();
    return String(snapshot && snapshot.current || '').indexOf('zen-') === 0;
  }

  function externalBackgroundActive() {
    if (typeof FroggyFeastVisualHost === 'undefined' || typeof FroggyFeastVisualHost.getState !== 'function') return false;
    const stateSnapshot = FroggyFeastVisualHost.getState();
    return stateSnapshot && stateSnapshot.active && stateSnapshot.backgroundEnabled;
  }

  function frameDelta() {
    const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
    if (!state.lastFrameTime) {
      state.lastFrameTime = now;
      return 0;
    }
    const delta = Math.max(0, Math.min(0.05, (now - state.lastFrameTime) / 1000));
    state.lastFrameTime = now;
    const playing = typeof GameState !== 'undefined'
      && (typeof GAME_MODES === 'undefined' || GameState.mode === GAME_MODES.PLAYING);
    return playing ? delta : 0;
  }

  function drawLocalGlow(target, caught, delta) {
    state.catchPulse = Math.max(0, state.catchPulse - delta);
    state.milestonePulse = Math.max(0, state.milestonePulse - delta);
    const room = Math.min(ROOM_COUNT - 1, Math.floor(Math.min(caught, TOTAL_CATCHES - 1) / ROOM_CATCHES));
    const anchors = ROOM_ANCHORS[room] || ROOM_ANCHORS[0];
    const centreX = anchors.reduce((sum, anchor) => sum + anchor[0], 0) / anchors.length;
    const centreY = anchors.reduce((sum, anchor) => sum + anchor[1], 0) / anchors.length;
    const pulse = Math.max(state.catchPulse * 0.18, state.milestonePulse * 0.36);
    if (pulse <= 0.002 || typeof target.createRadialGradient !== 'function') return;
    const glowRoom = state.milestonePulse > 0 ? Math.max(0, state.milestoneRoom) : room;
    const color = ROOM_GLOWS[glowRoom] || ROOM_GLOWS[0];
    const gradient = target.createRadialGradient(centreX, centreY, 6, centreX, centreY, 145);
    gradient.addColorStop(0, hexToRgba(color, pulse));
    gradient.addColorStop(0.55, hexToRgba(color, pulse * 0.36));
    gradient.addColorStop(1, hexToRgba(color, 0));
    target.save();
    target.fillStyle = gradient;
    target.fillRect(Math.max(0, centreX - 150), Math.max(CLIP_TOP, centreY - 150), 300, 300);
    target.restore();
  }

  function hexToRgba(hex, alpha) {
    const raw = String(hex || '#ffffff').replace('#', '');
    const value = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw.padEnd(6, 'f').slice(0, 6);
    const number = parseInt(value, 16);
    const r = (number >> 16) & 255;
    const g = (number >> 8) & 255;
    const b = number & 255;
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, Number(alpha) || 0))})`;
  }

  function draw(target) {
    const zen = typeof GameState !== 'undefined' && (GameState.currentMode === 'zen' || GameState.isZen === true);
    if (!zen) {
      if (state.wasZen) reset({ clearCache:true });
      return false;
    }
    state.wasZen = true;
    if (!target || externalBackgroundActive() || !baseGardenReady()) return false;
    requestPreload();
    lockComposition();

    const caught = currentCaught();
    if (caught > state.lastCaught) state.catchPulse = 0.50;
    state.lastCaught = caught;
    const delta = frameDelta();
    drawLocalGlow(target, caught, delta);

    const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion === true;
    target.save();
    target.beginPath();
    target.rect(0, CLIP_TOP, typeof CONFIG !== 'undefined' ? CONFIG.CANVAS_W : 480, CLIP_BOTTOM - CLIP_TOP);
    target.clip();

    for (const cluster of CLUSTERS) {
      const remaining = remainingAlpha(cluster, caught);
      if (remaining <= 0.001) continue;
      const cached = cachedCluster(cluster);
      if (!cached || !cached.surface) continue;
      const cleared = 1 - remaining;
      const scale = cluster.scale * (reducedMotion ? 1 : 1 - cleared * 0.065);
      const driftY = reducedMotion ? 0 : cleared * 5;
      target.save();
      target.globalAlpha = Math.min(0.84, remaining * 0.84);
      target.translate(cluster.x, cluster.y + driftY);
      target.scale(scale, scale);
      target.drawImage(cached.surface, -cached.width / 2, -cached.height / 2);
      target.restore();
    }
    target.restore();
    return true;
  }

  function reset(options = {}) {
    state.lastCaught = 0;
    state.catchPulse = 0;
    state.milestoneRoom = -1;
    state.milestonePulse = 0;
    state.lastFrameTime = 0;
    state.wasZen = false;
    if (options.clearCache) {
      state.cache.clear();
      state.skippedClusters.clear();
      state.pool = Object.freeze([]);
      state.preloadRequested = false;
      state.compositionLocked = false;
    }
  }

  function snapshot() {
    const progress = computeState(currentCaught());
    return Object.freeze({
      ...progress,
      cacheSurfaces:state.cache.size,
      skippedClusters:state.skippedClusters.size,
      compositionLocked:state.compositionLocked,
      foodPoolSize:state.pool.length,
      baseGardenReady:baseGardenReady(),
      reducedMotion:typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion === true,
    });
  }

  if (typeof EventBus !== 'undefined' && typeof EventBus.on === 'function') {
    EventBus.on('zenRoomRevealed', payload => {
      const room = Math.max(0, Math.min(ROOM_COUNT - 1, (Number(payload && payload.room) || 1) - 1));
      state.milestoneRoom = room;
      state.milestonePulse = 1.05;
    });
    EventBus.on('gameStarted', () => {
      // Build a fresh deterministic environmental composition for each Zen run
      // after ArcadeRunStartGate has had its chance to decode the approved menu.
      const zen = typeof GameState !== 'undefined' && GameState.currentMode === 'zen';
      reset({ clearCache:zen });
      if (zen) requestPreload();
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('froggy-theme-change', () => reset({ clearCache:true }), { passive:true });
  }

  return Object.freeze({
    TOTAL_CATCHES,
    ROOM_CATCHES,
    ROOM_COUNT,
    CLUSTERS,
    computeState,
    draw,
    reset,
    snapshot,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ZenRestorationLayer = ZenRestorationLayer;

// draw-render.js intentionally calls drawZenCastle() immediately after the base
// background pass and before world actors. Reclaim that retained compatibility
// hook for the new food-restoration layer, keeping gameplay entities above it.
if (typeof drawZenCastle === 'function') {
  drawZenCastle = function drawZenCastleRestorationPass() {
    if (typeof ctx === 'undefined') return;
    try { ZenRestorationLayer.draw(ctx); }
    catch (error) {
      if (globalThis.FROGGY_DEV_SURFACE === true) {
        try { console.warn('[ZenRestoration] presentation pass failed; preserving gameplay.', error); } catch (_) {}
      }
    }
  };
}
