// ============================================================
// src/runtime/rendering/draw-background.js — Canvas setup & background rendering
// drawBobChest, initGraphics, resizeCanvas, BackgroundMaps, drawClone, cosmetic anchors, drawBackground. Split from game-draw.js for modularity.
// ============================================================

// ============================================================
// game-draw.js — ALL rendering logic: canvas drawing, HUD,
//                character sprites, backgrounds, particles,
//                cosmetic overlays, effects
// Load order: 8th (after game.js)
// ZERO gameplay mutations — read-only access to global state.
// ============================================================



function getRenderableCosmeticDefinitions() {
  if (typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getAllCosmeticDefinitions === 'function') {
    return ContentAssetResolver.getAllCosmeticDefinitions();
  }
  return typeof COSMETIC_DATA !== 'undefined' && Array.isArray(COSMETIC_DATA) ? COSMETIC_DATA : [];
}

function getRenderableCosmeticDefinition(id) {
  return getRenderableCosmeticDefinitions().find(item => item.id === String(id || '')) || null;
}

function getRenderableCosmeticSlot(item) {
  if (typeof cosmeticSlotForItem === 'function') return cosmeticSlotForItem(item);
  if (typeof getCosmeticSlot === 'function') return getRenderableCosmeticSlot(item);
  return item?.slot || item?.cosmetic?.slot || (item?.type === 'skin' ? 'skin' : 'hat');
}

// Equipped cosmetic resolution used to rebuild arrays, scan the full cosmetic
// catalog, and sort layers on every rendered frame. Cache the resolved layer
// list by character + slot/id signature; SaveManager still remains the source
// of truth and any equipment change invalidates naturally through the signature.
const EquippedCosmeticRenderCache = (() => {
  let key = '';
  let items = Object.freeze([]);
  const layerOrder = Object.freeze({ skin:0, cape:1, mouth:2, beard:3, glasses:4, afro:5, hat:6, horns:7 });

  function signature(characterId, equipped) {
    return `${characterId}|${Object.entries(equipped || {}).map(([slot,id]) => `${slot}:${id}`).sort().join('|')}`;
  }
  function get(characterId, equipped) {
    const nextKey = signature(characterId, equipped);
    if (nextKey === key) return items;
    key = nextKey;
    items = Object.freeze(Object.values(equipped || {})
      .map(id => getRenderableCosmeticDefinition(id))
      .filter(item => {
        if (!item || item.isBg) return false;
        const applies = typeof cosmeticAppliesToCharacter === 'function'
          ? cosmeticAppliesToCharacter(item, characterId)
          : ((item.applicableTo || []).includes('all') || (item.applicableTo || []).includes(characterId));
        if (!applies) return false;
        const mode = typeof cosmeticPresentationForItem === 'function'
          ? cosmeticPresentationForItem(item).mode
          : 'overlay';
        return mode !== 'sprite-variant' && mode !== 'canvas-palette';
      })
      .sort((a, b) => (layerOrder[getRenderableCosmeticSlot(a)] ?? -1) - (layerOrder[getRenderableCosmeticSlot(b)] ?? -1)));
    return items;
  }
  function clear() { key = ''; items = Object.freeze([]); }
  if (typeof window !== 'undefined') window.addEventListener('froggy-theme-change', clear, { passive:true });
  return Object.freeze({ get, clear });
})();

// ── Bob's chest is an independent prop with level-local fill progression. ──
const BobChestRewardCoinRenderer = (() => {
  const imagePath = 'assets/images/effects/crown-coin.png';
  let lastBurst = null;
  let image = null;
  let failed = false;

  function preload() {
    if (image || failed || typeof Image === 'undefined') return;
    image = new Image();
    image.decoding = 'async';
    image.onerror = () => { failed = true; image = null; };
    image.src = imagePath;
  }

  function drawCoin(ctx, x, y, size, rotation, alpha) {
    if (!image || !image.complete || !image.naturalWidth) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function draw(ctx, cx, cy, burst) {
    if (typeof RewardCoinCelebration !== 'undefined') {
      if (burst !== lastBurst && Number(burst?.time) > 0) RewardCoinCelebration.playAtCanvas('SMALL_REWARD', ctx, cx, cy);
      lastBurst = burst;
      return;
    }
    preload();
    const time = Math.max(0, Number(burst?.time || 0));
    const count = Math.max(0, Math.min(16, Math.round(Number(burst?.count || 0))));
    if (time <= 0 || count <= 0 || !image || !image.complete || !image.naturalWidth) return;
    const progress = Math.max(0, Math.min(1, 1 - (time / 1.2)));
    const fade = Math.min(1, time / 0.16) * Math.min(1, time / 0.24);
    for (let i = 0; i < count; i += 1) {
      const seed = i * 17.31;
      const spread = ((seed % 29) / 29) - 0.5;
      const launch = 26 + ((seed * 7) % 30);
      const x = cx + spread * 52 + Math.sin(progress * 7 + i) * 4;
      const y = cy - 10 - launch * progress + 42 * progress * progress;
      const size = 14 + ((seed * 3) % 7);
      const rotation = seed + progress * (i % 2 ? 5 : -5);
      drawCoin(ctx, x, y, size, rotation, fade * (0.82 + (i % 3) * 0.06));
    }
  }

  return Object.freeze({ draw, preload });
})();
const BobChestPropRenderer = (() => {
  const basePath = 'assets/images/characters/bob-arcade/props/';
  const rewardChestClosed = 'assets/puzzle/ui-generated-v1/runtime-256/reward-chest-closed-owner-v1.png';
  const rewardChestOpen = 'assets/puzzle/ui-generated-v1/runtime-256/reward-chest-open-owner-v1.png';
  const fillFiles = Object.freeze([
    'bob_chest_fill_0.png',
    'bob_chest_fill_1.png',
    'bob_chest_fill_2.png',
    'bob_chest_fill_3.png',
  ]);
  const images = Object.create(null);
  const failed = Object.create(null);
  const allFiles = Object.freeze([...fillFiles, 'bob_chest_open.png', 'bob_chest_deposit.png', rewardChestClosed, rewardChestOpen]);

  function getImage(file) {
    if (images[file] || failed[file] || typeof Image === 'undefined') return images[file] || null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {};
    img.onerror = () => { failed[file] = true; images[file] = null; };
    img.src = file.startsWith('assets/') ? file : basePath + file;
    images[file] = img;
    return img;
  }

  function preload() { allFiles.forEach(getImage); }

  function fillIndex(bobState) {
    const stored = Math.max(0, Number(bobState?.bankedItems || 0));
    const target = Math.max(1, Number(typeof getCurrentLevelConfig === 'function' ? getCurrentLevelConfig()?.foodsToEat : 8) || 8);
    if (stored <= 0) return 0;
    return Math.max(1, Math.min(3, Math.ceil((stored / target) * 3)));
  }

  function fileFor(bobState, nearChest) {
    if (Number(bobState?.depositAnim || 0) > 0.02 || Number(bobState?.chestAnim || 0) > 0.02) return rewardChestOpen;
    if (nearChest) return rewardChestOpen;
    // The owner-provided chest is the canonical closed shell for idle and banked states;
    // the legacy fill atlases remain available for compatibility but are no longer mixed
    // into the polished runtime presentation.
    return rewardChestClosed;
  }

  function draw(ctx, cx, cy, bobState, nearChest) {
    preload();
    const file = fileFor(bobState, nearChest);
    const img = getImage(file);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const width = 72;
    const height = width * (224 / 256);
    const bottom = cy + 40;
    ctx.drawImage(img, cx - width / 2, bottom - height, width, height);
    return true;
  }

  return Object.freeze({ draw, fileFor, fillIndex, preload });
})();

// Gameplay-semantic art must fail closed when its approved raster is unavailable.
// Never synthesize a programmer-drawn chest as a player-facing substitute.
let _bobChestFallbackWarned = false;
function drawBobChestFallback() {
  if (globalThis.FROGGY_DEV_SURFACE === true && !_bobChestFallbackWarned) {
    _bobChestFallbackWarned = true;
    try { console.warn('[Arcade][art] Bob chest raster unavailable; omitting semantic art instead of drawing a placeholder.'); } catch (_) {}
  }
  return false;
}

function drawBobChestGroundContact(ctx, cx, cy) {
  // Bob's chest is gameplay-semantic foreground art, so give it the same
  // contact-language already used under playable characters. This is a shadow,
  // not replacement scenery: the authored Living Feast landscape remains the
  // environment authority while the prop gets an unambiguous floor contact.
  ctx.save();
  // Do not inherit Bob's temporary gold interaction glow onto the floor cue.
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 39, 31, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBobChest() {
  const charDef = getCharDef();
  if (!hasAbility(charDef, 'basketCatch')) return;
  const bobState = GameState.charState.bob;
  const cx = BOB_CHEST.x, cy = BOB_CHEST.y;
  const hasItems = Array.isArray(bobState.basketItems) && bobState.basketItems.length > 0;
  const nearChest = Math.abs(frog.x - cx) < 50 && hasItems;
  const isOpen = nearChest || Number(bobState.chestAnim || 0) > 0;

  ctx.save();
  if (nearChest || Number(bobState.depositAnim || 0) > 0) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
  }

  const depositTime = Math.max(0, Number(bobState.depositAnim || 0));
  const wiggleElapsed = Math.max(0, 0.8 - depositTime);
  const wiggleIn = Math.min(1, wiggleElapsed / 0.06);
  const wiggleOut = Math.min(1, depositTime / 0.18);
  const wiggle = Math.sin(wiggleElapsed * 52) * 0.07 * wiggleIn * wiggleOut;
  if (Math.abs(wiggle) > 0.0001) {
    ctx.translate(cx, cy);
    ctx.rotate(wiggle);
    ctx.translate(-cx, -cy);
  }
  drawBobChestGroundContact(ctx, cx, cy);
  if (!BobChestPropRenderer.draw(ctx, cx, cy, bobState, nearChest)) {
    drawBobChestFallback(cx, cy, isOpen);
  }

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  if (nearChest) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const pulse = 0.7 + Math.sin(Date.now() / 180) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('DEPOSIT', cx, cy - 30);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  BobChestRewardCoinRenderer.draw(ctx, cx, cy - 6, bobState.coinBurst);
}

let bgGradient, groundGradient;
function initGraphics() {
  bgGradient = ctx.createLinearGradient(0,0,0,CONFIG.CANVAS_H);
  bgGradient.addColorStop(0,'#0d1a0d'); bgGradient.addColorStop(0.6,'#1a2e1a'); bgGradient.addColorStop(1,'#2d4a1e');
  groundGradient = ctx.createLinearGradient(0,CONFIG.CANVAS_H-55,0,CONFIG.CANVAS_H);
  groundGradient.addColorStop(0,'#3a5c28'); groundGradient.addColorStop(1,'#2a4018');
}
function resizeCanvas() {
  const standaloneLayout = typeof StandaloneViewport !== 'undefined'
    && document.body?.classList.contains('standalone-mode')
    ? StandaloneViewport.fitCanvas(canvas, CONFIG.CANVAS_W, CONFIG.CANVAS_H, { dpr: DPR })
    : null;
  let scale;
  if (standaloneLayout) {
    scale = standaloneLayout.scale;
  } else {
    const viewport = window.visualViewport;
    const vw = Math.max(1, Number(viewport?.width) || window.innerWidth);
    const vh = Math.max(1, Number(viewport?.height) || window.innerHeight);
    // RC24.1 mobile controls are low-obstruction overlays. Do not shrink the
    // canonical playfield behind a legacy fixed control-dock reservation.
    scale = Math.min(vw / CONFIG.CANVAS_W, vh / CONFIG.CANVAS_H);
    canvas.width  = CONFIG.CANVAS_W * DPR;
    canvas.height = CONFIG.CANVAS_H * DPR;
    canvas.style.width  = Math.floor(CONFIG.CANVAS_W * scale) + 'px';
    canvas.style.height = Math.floor(CONFIG.CANVAS_H * scale) + 'px';
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  window._canvasScale = scale;
  initGraphics();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive:true });
window.visualViewport?.addEventListener?.('resize', resizeCanvas, { passive:true });
window.addEventListener('froggy-render-scale-change', () => _safeTimeout(resizeCanvas, 0), { passive:true });
window.addEventListener('orientationchange', () => { _safeTimeout(resizeCanvas, 120); _safeTimeout(resizeCanvas, 400); }, { passive:true });
// Lifecycle pausing is owned solely by ArcadeSessionGuard through the
// FroggyLifecycleCoordinator; the duplicate visibilitychange pause handler
// that previously lived here (weaker guards, no reason, no event) is removed.
EventBus.on('gameStarted', () => _safeTimeout(resizeCanvas, 50));

const bgStars = [];
const ARCADE_BACKGROUND_BUDGET = globalThis.FroggyEnginePerformance?.budgetForMode?.('arcade') || null;
const bgStarCount = Math.max(0, Number(ARCADE_BACKGROUND_BUDGET?.backgroundStarCount) || 60);
for (let i=0;i<bgStarCount;i++) bgStars.push({x:Math.random()*CONFIG.CANVAS_W,y:Math.random()*CONFIG.CANVAS_H*0.6,r:Math.random()*2,twinkle:Math.random()*Math.PI*2});

const BackgroundMaps = {
  activeParticles: [],
  currentBgId: null,
  initForMode(modeId) {
    this.activeParticles = [];
    const persist = SaveManager.get();
    const equippedCosmetics = persist.equippedCosmetics[modeId] || {};
    let activeBgCosmetic = null;

    if (equippedCosmetics.background) {
      activeBgCosmetic = getRenderableCosmeticDefinition(equippedCosmetics.background);
    }

    if (!activeBgCosmetic) return;

    this.currentBgId = activeBgCosmetic.id;
    const count = Math.max(0, Number(ARCADE_BACKGROUND_BUDGET?.backgroundParticleCount) || 20);
    const particleStyles = activeBgCosmetic.particleStyles || ['spark'];

    for (let i = 0; i < count; i++) {
      this.activeParticles.push({
        x: Math.random() * CONFIG.CANVAS_W,
        y: Math.random() * CONFIG.CANVAS_H,
        kind: particleStyles[Math.floor(Math.random() * particleStyles.length)],
        speed: 15 + Math.random() * 30,
        scale: 0.6 + Math.random() * 0.6,
        alpha: 0.05 + Math.random() * 0.08
      });
    }
  },
  updateAndDraw(dt) {
    if (this.activeParticles.length === 0) return;
    ctx.save();
    this.activeParticles.forEach(p => {
      p.y += p.speed * dt;
      if (p.y > CONFIG.CANVAS_H) {
        p.y = -20;
        p.x = Math.random() * CONFIG.CANVAS_W;
      }
      ctx.globalAlpha = p.alpha;
      if (typeof ArcadeVisuals !== 'undefined') {
        ArcadeVisuals.drawAmbientParticle(ctx, p);
      } else {
        ctx.fillStyle = '#f4e073';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2, 4 * p.scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
};
EventBus.on('levelUp', () => BackgroundMaps.initForMode(GameState.selectedCharacterId));




function isFlytrapPresentationActive() {
  try { return getCharDef()?.id === 'flytrap'; }
  catch (_) { return false; }
}

function flytrapPresentationScale() {
  try {
    const charDef = getCharDef();
    const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef) : null;
    const presentation = GAME_BALANCE?.arcadePresentation || {};
    const sizeClass = behavior?.presentationContract?.sizeClass || 'standard';
    const classScale = Number(presentation.characterSizeClassMultipliers?.[sizeClass] || 1);
    return Math.max(0.65, Number(presentation.characterBaseScale || 1)
      * classScale * Number(GAME_BALANCE?.modelScale || 1) * (GameState.isFMF ? 1.22 : 1));
  } catch (_) { return 1; }
}

// Venus Flytrap is the only Arcade character that changes the playable floor.
// Its lower catch field becomes a continuous dirt bed so the adult and clone
// read as organisms growing out of the environment, not sprites standing on
// top of a separate oval prop. The texture is deterministic to avoid flicker.
function flytrapDirtHash(index, salt = 0) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function flytrapDirtTopY() {
  const groundY = typeof FlytrapArcadeAnimationRenderer !== 'undefined'
    ? FlytrapArcadeAnimationRenderer.mainGroundY()
    : CONFIG.CANVAS_H - 56;
  return Math.max(500, Math.min(CONFIG.CANVAS_H - 205, groundY - 168));
}

function drawFlytrapDirtGround() {
  if (!isFlytrapPresentationActive()) return;
  const topY = flytrapDirtTopY();
  const bottomY = CONFIG.CANVAS_H;
  const height = bottomY - topY;

  ctx.save();

  // Soft, uneven horizon blends into the currently selected Arcade backdrop.
  const horizon = new Path2D();
  horizon.moveTo(0, topY + 8);
  horizon.bezierCurveTo(70, topY - 8, 142, topY + 13, 226, topY + 1);
  horizon.bezierCurveTo(315, topY - 12, 402, topY + 16, CONFIG.CANVAS_W, topY + 3);
  horizon.lineTo(CONFIG.CANVAS_W, bottomY);
  horizon.lineTo(0, bottomY);
  horizon.closePath();

  const earth = ctx.createLinearGradient(0, topY, 0, bottomY);
  earth.addColorStop(0, '#6f4427');
  earth.addColorStop(0.16, '#674024');
  earth.addColorStop(0.58, '#4f2f1c');
  earth.addColorStop(1, '#382116');
  ctx.fillStyle = earth;
  ctx.fill(horizon);

  // A feathered top edge prevents the dirt from looking like a rectangular UI
  // panel laid over the background.
  const edge = ctx.createLinearGradient(0, topY - 18, 0, topY + 34);
  edge.addColorStop(0, 'rgba(91,56,31,0)');
  edge.addColorStop(0.5, 'rgba(102,62,34,0.34)');
  edge.addColorStop(1, 'rgba(77,43,25,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, topY - 18, CONFIG.CANVAS_W, 52);

  // Fine soil grains. Fixed pseudo-random positions make the visual stable.
  for (let i = 0; i < 92; i++) {
    const x = flytrapDirtHash(i, 1) * CONFIG.CANVAS_W;
    const y = topY + 12 + flytrapDirtHash(i, 2) * Math.max(20, height - 18);
    const r = 0.7 + flytrapDirtHash(i, 3) * 1.8;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(184,116,59,0.28)'
      : (i % 3 === 1 ? 'rgba(43,25,16,0.36)' : 'rgba(130,79,39,0.24)');
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.45, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scattered stones and tiny sprouts create one continuous ground material.
  for (let i = 0; i < 22; i++) {
    const x = 12 + flytrapDirtHash(i, 4) * (CONFIG.CANVAS_W - 24);
    const y = topY + 18 + flytrapDirtHash(i, 5) * Math.max(24, height - 35);
    const r = 2.1 + flytrapDirtHash(i, 6) * 3.4;
    ctx.fillStyle = i % 2 ? '#5d3721' : '#7b4a28';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.35, r * 0.72, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(38,21,14,0.48)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(111,130,55,0.46)';
  ctx.lineWidth = 1.3;
  for (const [x, y, lean] of [[48,topY+48,-3],[427,topY+73,4],[116,topY+138,3],[357,topY+124,-4]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean, y - 8, x + lean * 1.4, y - 13);
    ctx.stroke();
  }

  // Subtle vignette keeps food and hazards readable over the darker soil.
  const vignette = ctx.createLinearGradient(0, topY, CONFIG.CANVAS_W, topY);
  vignette.addColorStop(0, 'rgba(24,13,9,0.18)');
  vignette.addColorStop(0.24, 'rgba(24,13,9,0)');
  vignette.addColorStop(0.76, 'rgba(24,13,9,0)');
  vignette.addColorStop(1, 'rgba(24,13,9,0.18)');
  ctx.fillStyle = vignette;
  ctx.fill(horizon);
  ctx.restore();
}

function drawFlytrapSoilBed(cx, groundY, scale = 1, foreground = false) {
  const s = Math.max(0.12, Number(scale || 1));
  const halfWidth = 58 * s;
  ctx.save();

  if (!foreground) {
    // The authored oval platform has been removed from the sprite sheets.
    // Only a narrow root crevice remains behind the plant; it has no closed
    // outer edge and therefore reads as part of the continuous dirt field.
    const crevice = ctx.createLinearGradient(0, groundY - 7 * s, 0, groundY + 7 * s);
    crevice.addColorStop(0, 'rgba(39,22,14,0)');
    crevice.addColorStop(0.55, 'rgba(39,22,14,0.48)');
    crevice.addColorStop(1, 'rgba(39,22,14,0)');
    ctx.fillStyle = crevice;
    ctx.beginPath();
    ctx.moveTo(cx - halfWidth, groundY + 2 * s);
    ctx.quadraticCurveTo(cx - halfWidth * 0.45, groundY - 5 * s, cx, groundY - 2 * s);
    ctx.quadraticCurveTo(cx + halfWidth * 0.45, groundY - 5 * s, cx + halfWidth, groundY + 2 * s);
    ctx.lineTo(cx + halfWidth, groundY + 7 * s);
    ctx.lineTo(cx - halfWidth, groundY + 7 * s);
    ctx.closePath();
    ctx.fill();
  } else {
    // Bury pass: irregular dirt from the SAME continuous ground overlaps the
    // bottom of the leaves. There is deliberately no oval mound, platform,
    // detached shadow, or visible perimeter.
    const buryDepth = 14 * s;
    ctx.beginPath();
    ctx.rect(cx - halfWidth - 8 * s, groundY - buryDepth, halfWidth * 2 + 16 * s, buryDepth + 15 * s);
    ctx.clip();

    const soil = ctx.createLinearGradient(0, groundY - buryDepth, 0, groundY + 8 * s);
    soil.addColorStop(0, 'rgba(111,68,38,0.16)');
    soil.addColorStop(0.35, '#6f4427');
    soil.addColorStop(0.72, '#59351f');
    soil.addColorStop(1, '#452819');
    ctx.fillStyle = soil;
    ctx.beginPath();
    ctx.moveTo(cx - halfWidth, groundY + 7 * s);
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = cx - halfWidth + t * halfWidth * 2;
      const wave = Math.sin((t * 3.5 + 0.25) * Math.PI) * 2.5 * s
        + Math.sin((t * 8.5 + 0.4) * Math.PI) * 1.4 * s;
      ctx.lineTo(x, groundY - 5 * s + wave);
    }
    ctx.lineTo(cx + halfWidth, groundY + 12 * s);
    ctx.lineTo(cx - halfWidth, groundY + 12 * s);
    ctx.closePath();
    ctx.fill();

    const clods = [-0.82,-0.63,-0.43,-0.20,0.02,0.25,0.48,0.69,0.86];
    clods.forEach((position, index) => {
      const r = (2.5 + (index % 3) * 0.55) * s;
      const y = groundY - (2 + (index % 2) * 3) * s;
      ctx.fillStyle = index % 2 ? '#754522' : '#8a5229';
      ctx.beginPath();
      ctx.ellipse(cx + position * halfWidth, y, r * 1.35, r * 0.72, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(49,27,17,0.46)';
      ctx.lineWidth = Math.max(0.55, 0.7 * s);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawFlytrapRootBed() {
  if (!isFlytrapPresentationActive()) return;
  const groundY = typeof FlytrapArcadeAnimationRenderer !== 'undefined'
    ? FlytrapArcadeAnimationRenderer.mainGroundY() : frog.y + 24;
  drawFlytrapSoilBed(frog.x, groundY, flytrapPresentationScale(), false);
  if (globalThis.FROGGY_SHOW_FLYTRAP_GROUND_GUIDE) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,226,89,0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(frog.x - 86, groundY); ctx.lineTo(frog.x + 86, groundY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe259'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`ROOT ${Math.round(groundY)}`, frog.x, groundY + 27);
    ctx.restore();
  }
}

function drawFlytrapForegroundSoil() {
  if (!isFlytrapPresentationActive()) return;
  const groundY = typeof FlytrapArcadeAnimationRenderer !== 'undefined'
    ? FlytrapArcadeAnimationRenderer.mainGroundY() : frog.y + 24;
  drawFlytrapSoilBed(frog.x, groundY, flytrapPresentationScale(), true);
}

function drawFlytrapCloneCharge() {
  if (!isFlytrapPresentationActive()) return;
  const flytrap = GameState.charState?.flytrap || {};
  if (!flytrap.cloneHeld) return;
  if (typeof FlytrapArcadeAnimationRenderer === 'undefined') return;

  const s = flytrapPresentationScale();
  const mainGround = FlytrapArcadeAnimationRenderer.mainGroundY();
  const timer = Math.max(0, Number(flytrap.cloneActionTimer || 0));
  const entering = flytrap.cloneAction === 'pickup' && timer > 0;
  const progress = entering ? Math.max(0, Math.min(1, 1 - timer / 0.52)) : 1;
  const pulse = 0.97 + Math.sin((typeof RuntimeState !== 'undefined' ? RuntimeState.frogAnim : 0) * 2.1) * 0.025;
  const chargeScale = (2 / 3) * s * (0.72 + 0.28 * progress) * pulse;
  const bottomY = Math.min(CONFIG.CANVAS_H - 8, mainGround + 39 * s);
  const alpha = 0.35 + progress * 0.61;

  // A small soil cradle communicates that the clone is ready below the parent,
  // rather than making it look attached to the adult plant's head.
  drawFlytrapSoilBed(frog.x, bottomY - 2, (2 / 3) * s, false);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = 'rgba(180,255,166,0.72)';
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.beginPath();
  ctx.ellipse(frog.x, bottomY - 17 * s, 18 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  FlytrapArcadeAnimationRenderer.drawCloneCharge(ctx, getCharDef(), frog.x, bottomY, alpha, chargeScale / s);
  drawFlytrapSoilBed(frog.x, bottomY - 2, (2 / 3) * s, true);
}

function drawClone() {
  const charDef = getCharDef();
  if (!hasAbility(charDef, 'snapClone')) return;
  const flytrap = GameState.charState?.flytrap || {};
  if (flytrap.cloneHeld || Number(flytrap.cloneX) < 0) return;

  const cloneX = Number(flytrap.cloneX);
  const cloneY = Number(flytrap.cloneY);
  const snapMo = Math.max(0, Number(flytrap.cloneSnapAnim || 0));
  const planting = flytrap.cloneAction === 'plant' && Number(flytrap.cloneActionTimer || 0) > 0;
  const plantProgress = planting
    ? Math.max(0, Math.min(1, 1 - Number(flytrap.cloneActionTimer || 0) / 0.52)) : 1;
  const cloneScale = (2 / 3) * (planting ? 0.58 + 0.42 * plantProgress : 1);
  const cloneAlpha = 0.38 + plantProgress * 0.58;
  const groundY = typeof FlytrapArcadeAnimationRenderer !== 'undefined'
    ? FlytrapArcadeAnimationRenderer.cloneGroundY(cloneY, cloneScale)
    : cloneY + 24 * cloneScale;

  drawFlytrapSoilBed(cloneX, groundY, cloneScale, false);

  let animatedCloneDrawn = false;
  try {
    animatedCloneDrawn = typeof FlytrapArcadeAnimationRenderer !== 'undefined'
      && FlytrapArcadeAnimationRenderer.drawClone(ctx, charDef, cloneX, cloneY, snapMo, cloneAlpha, cloneScale);
  } catch (err) {
    animatedCloneDrawn = false;
    if (typeof console !== 'undefined') console.warn('[arcade] VFT clone animation failed closed.', err);
  }

  drawFlytrapSoilBed(cloneX, groundY, cloneScale, true);

  const catchRadius = Number(charDef.stats.cloneCatchRadius || (charDef.stats.catchRadius || 66) * (2 / 3));
  const pulse = 0.11 + Math.sin((typeof RuntimeState !== 'undefined' ? Number(RuntimeState.frogAnim || 0) : Date.now() / 1000) * 2.2) * 0.025;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cloneX, cloneY, catchRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(111,218,115,${Math.max(0.06, pulse).toFixed(3)})`;
  ctx.lineWidth = animatedCloneDrawn ? 1.5 : 1;
  ctx.setLineDash([4, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// getCosmeticSlot() is defined in src/runtime/ui/ui-cosmetics.js (loaded after this file).
// The stale name-matching copy that used to live here was removed: it was
// silently overwritten at runtime by the id-based version in src/runtime/ui/ui-cosmetics.js,
// and its fallback mappings were wrong for beard/cape/afro/horns items.

function getCosmeticAnchor(charId, slot) {
  const charAnchors = COSMETIC_ANCHORS[charId] || COSMETIC_ANCHORS.default;
  return charAnchors[slot] || COSMETIC_ANCHORS.default[slot] || { x:0, y:0, size:32 };
}


function getClassicHatFrameId() {
  if (typeof SpriteRenderer !== 'undefined' && typeof SpriteRenderer.getCharacterState === 'function') {
    const state = SpriteRenderer.getCharacterState('player');
    const frameId = String(state?.currentFrame || '');
    if (typeof CLASSIC_HAT_FRAME_ANCHORS !== 'undefined' && CLASSIC_HAT_FRAME_ANCHORS[frameId]) return frameId;
  }
  if (typeof tongue !== 'undefined' && tongue.active) return 'classic_tongue_pose';
  if (typeof frog !== 'undefined' && (frog.moveDir !== 0 || frog.isMoving)) return frog.facing < 0 ? 'classic_move_left' : 'classic_move_right';
  return 'classic_idle';
}

function resolveCosmeticDrawAnchor(charDef, slot, presentation, fallbackAnchor) {
  if (charDef?.id === 'classic' && slot === 'hat' && presentation?.assetSrc
    && typeof CLASSIC_HAT_FRAME_ANCHORS !== 'undefined') {
    const renderStage = typeof ArcadeCharacterRenderRouter !== 'undefined'
      && typeof ArcadeCharacterRenderRouter.snapshot === 'function'
      ? ArcadeCharacterRenderRouter.snapshot().stage
      : '';
    if (renderStage === 'portrait-hybrid' && typeof CLASSIC_HAT_PORTRAIT_ANCHOR !== 'undefined') {
      return { x:CLASSIC_HAT_PORTRAIT_ANCHOR.x, y:CLASSIC_HAT_PORTRAIT_ANCHOR.y, size:presentation.targetWidth || fallbackAnchor.size, absoluteToCharacter:true };
    }
    const frameId = getClassicHatFrameId();
    const point = CLASSIC_HAT_FRAME_ANCHORS[frameId] || CLASSIC_HAT_FRAME_ANCHORS.default;
    return { x:point.x, y:point.y, size:presentation.targetWidth || fallbackAnchor.size, absoluteToCharacter:true };
  }
  return { ...fallbackAnchor, absoluteToCharacter:false };
}

function drawEquippedCosmetics(charDef, x, y, isMoving, stepCycle, moveDir) {
  const persist = SaveManager.get();
  const equipped = persist.equippedCosmetics[charDef.id] || {};
  const cosmeticsToDraw = EquippedCosmeticRenderCache.get(charDef.id, equipped);

  if (!cosmeticsToDraw.length) return;

  const facing = moveDir < 0 ? -1 : 1;
  const bob = isMoving ? Math.abs(Math.sin(stepCycle)) * 4 : 0;

  ctx.save();
  ctx.translate(x, y + bob);

  let headY = -30;
  if (hasAbility(charDef, 'gulperCatch'))  headY = -45;
  if (hasAbility(charDef, 'flyingCatch'))  headY = -45;
  if (hasAbility(charDef, 'heavyMovement')) headY = -35;
  const anchorSet = COSMETIC_ANCHORS[charDef.id] || COSMETIC_ANCHORS.default;

  cosmeticsToDraw.forEach(item => {
    ctx.save();

    const equipSlot = getRenderableCosmeticSlot(item);
    const presentation = typeof cosmeticPresentationForItem === 'function'
      ? cosmeticPresentationForItem(item)
      : { mode: 'overlay', anchorSlot: equipSlot, sizeScale: 1 };
    const slot = typeof cosmeticRenderSlotForItem === 'function' ? cosmeticRenderSlotForItem(item) : presentation.anchorSlot;
    const renderSnapshot = typeof ArcadeCharacterRenderRouter !== 'undefined'
      && typeof ArcadeCharacterRenderRouter.snapshot === 'function'
      ? ArcadeCharacterRenderRouter.snapshot()
      : null;
    // Curated Classic Frog headwear is drawn by the same approved sprite
    // renderer that owns the character pose. Skip the generic pass so the hat
    // cannot be duplicated or drift away from the current animation frame.
    if (charDef?.id === 'classic' && slot === 'hat' && presentation?.imageOnly
      && renderSnapshot?.attachedCosmeticsOwned) {
      ctx.restore();
      return;
    }
    const fallbackAnchor = anchorSet[slot] || COSMETIC_ANCHORS.default[slot] || { x:0, y:0, size:32 };
    const anchor = resolveCosmeticDrawAnchor(charDef, slot, presentation, fallbackAnchor);
    let size = (presentation.targetWidth || anchor.size) * (Number(presentation.sizeScale) || 1);
    let xOff = anchor.absoluteToCharacter ? anchor.x : anchor.x * facing;
    let yOff = anchor.y;


    const coordinateY = anchor.absoluteToCharacter || presentation.mode === 'body-effect' || presentation.mode === 'canvas-palette' || presentation.mode === 'sprite-variant' ? 0 : headY;
    ctx.translate(xOff, yOff + coordinateY);
    ctx.scale(presentation.mirrorWithCharacter === false ? 1 : facing, 1);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    if (typeof ArcadeVisuals !== 'undefined' && presentation.assetSrc && presentation.imageOnly === true) {
      ArcadeVisuals.drawCosmeticOverlay(ctx, item, { size, slot, presentation });
    }
    ctx.restore();
  });

  ctx.restore();
}

const LivingFeastBackgroundRenderer = (() => {
  // Standard Arcade already owns deterministic wave chapters in
  // ArcadeLivingFeastDirector. Keep that gameplay/presentation authority and
  // render those chapters from curated authored scenery. Background variation
  // is seeded separately from gameplay and remains fixed for a chapter/run.
  const LIVING_FEAST_ROOT = 'assets/themes/froggy-feast/ui-v2/backgrounds/living-feast/';
  const scene = (file, options = {}) => Object.freeze({
    src:`${LIVING_FEAST_ROOT}${file}`,
    focalX:Number(options.focalX ?? 0.5),
    focalY:Number(options.focalY ?? 0.6),
    scale:Number(options.scale ?? 1.035),
    wash:String(options.wash || 'rgba(5,12,8,0.08)'),
  });
  const chapter = (primary, alternate, atmosphere) => Object.freeze({
    primary,
    alternate:alternate || null,
    atmosphere:String(atmosphere || ''),
  });
  const CHAPTER_SCENES = Object.freeze({
    'morning-pond': chapter(
      scene('13_whimsical_lakeside_fairy_tale_valley.webp', { focalX:0.50, focalY:0.64, scale:1.03, wash:'rgba(15,49,28,0.07)' }),
      scene('07_whimsical_riverside_feast_glade.webp', { focalX:0.49, focalY:0.66, scale:1.04, wash:'rgba(12,45,27,0.08)' }),
      'pollen'
    ),
    'sunset-picnic': chapter(
      scene('14_enchanted_sunset_feast_courtyard.webp', { focalX:0.50, focalY:0.64, scale:1.035, wash:'rgba(92,35,42,0.10)' }),
      scene('10_enchanted_sunset_picnic_clearing.webp', { focalX:0.50, focalY:0.66, scale:1.04, wash:'rgba(90,38,35,0.10)' }),
      'fireflies'
    ),
    'moonlit-festival': chapter(
      scene('15_moonlit_lakeside_festival_village.webp', { focalX:0.50, focalY:0.65, scale:1.035, wash:'rgba(11,18,59,0.15)' }),
      scene('12_moonlit_riverside_lantern_festival.webp', { focalX:0.50, focalY:0.66, scale:1.04, wash:'rgba(13,18,64,0.15)' }),
      'lanterns'
    ),
    'grand-feast': chapter(
      scene('11_whimsical_forest_festival_feast.webp', { focalX:0.50, focalY:0.64, scale:1.045, wash:'rgba(65,30,39,0.08)' }),
      scene('06_fairy_festival_by_the_waterfalls.webp', { focalX:0.50, focalY:0.64, scale:1.045, wash:'rgba(78,35,43,0.09)' }),
      'petals'
    ),
    // The exploration bundle does not contain a standalone grounded candy
    // terrace master. Use its strongest grounded dreamlike authored scene for
    // 1.2.9 rather than shipping a water-floor image that makes actors float.
    'dream-feast': chapter(
      scene('08_moonlit_lantern_village_feast.webp', { focalX:0.50, focalY:0.66, scale:1.045, wash:'rgba(48,24,92,0.18)' }),
      null,
      'sparkles'
    ),
  });
  // One garden, six lighting states: no competing progression authority.
  const ZEN_SCENES = Object.freeze([0.18, 0.145, 0.11, 0.075, 0.04, 0.015].map(veil =>
    Object.freeze({ src:LIVING_FEAST_ROOT + 'zen-royal-garden.webp', focalX:0.5,
      focalY:0.5, scale:1.015, wash:'rgba(37,29,69,' + veil + ')' })));
  const imageRecords = new Map();
  const visual = { context:'', current:null, previous:null, blend:1, clock:0, caught:0, accent:0 };
  const zenPresentation = { seed:1, currentChapter:'zen-0', currentPlan:null, recordPulse:0, orderPulse:0 };
  const readabilityCache = new WeakMap();
  const walkwayGradientCache = new WeakMap();
  let backdropSrc = '';
  let warnedMissing = false;
  const ATMOSPHERE_COUNT = 6;
  const atmosphereMotes = Object.freeze(Array.from({ length:12 }, (_, index) => Object.freeze({
    x:((index * 137 + 41) % 461) + 9,
    y:((index * 83 + 67) % 610) + 48,
    r:0.85 + (index % 4) * 0.38,
    phase:index * 0.83,
    drift:(index % 2 ? 1 : -1) * (0.7 + (index % 3) * 0.18),
  })));

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function definitionFor(chapterId) {
    return CHAPTER_SCENES[chapterId] || CHAPTER_SCENES['morning-pond'];
  }

  function sceneFor(chapterId, runSeed = 1) {
    if (String(chapterId).indexOf('zen-') === 0) {
      return ZEN_SCENES[Math.max(0, Math.min(5, Number(String(chapterId).slice(4)) || 0))];
    }
    const definition = definitionFor(chapterId);
    if (!definition.alternate) return definition.primary;
    // Avalanche all seed bits before choosing a bucket. The former low-bit
    // selector made Sunset and Moonlit alternates inseparable on every run.
    let mixed = ((Number(runSeed) >>> 0) ^ hashString(chapterId) ^ 0x9e3779b9) >>> 0;
    mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b);
    mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
    mixed = (mixed ^ (mixed >>> 16)) >>> 0;
    return mixed < 0x40000000 ? definition.alternate : definition.primary;
  }

  function sourceFor(sceneDef) {
    return String(sceneDef?.src || '');
  }

  function imageRecord(src) {
    const key = String(src || '');
    if (!key || typeof Image === 'undefined') return null;
    let record = imageRecords.get(key);
    if (record) return record;
    const image = new Image();
    image.decoding = 'async';
    record = { image, ready:false, failed:false };
    image.onload = () => { record.ready = true; };
    image.onerror = () => { record.failed = true; };
    image.src = key;
    imageRecords.set(key, record);
    return record;
  }

  function preloadScene(sceneDef) {
    imageRecord(sourceFor(sceneDef));
  }

  function preloadChapter(chapterId, runSeed) {
    preloadScene(sceneFor(chapterId, runSeed));
  }

  function preloadAll() {
    Object.values(CHAPTER_SCENES).forEach(definition => {
      preloadScene(definition.primary);
      if (definition.alternate) preloadScene(definition.alternate);
    });
  }

  function preloadNextChapter(presentation) {
    const wave = Math.max(1, Number(presentation?.currentPlan?.wave) || 1);
    const runSeed = Number(presentation?.seed) || 1;
    const next = wave === 3 ? 'sunset-picnic'
      : wave === 6 ? 'moonlit-festival'
        : wave === 9 ? 'grand-feast'
          : wave === 10 ? 'dream-feast'
            : '';
    if (next) preloadChapter(next, runSeed);
    return next ? sceneFor(next, runSeed).src : '';
  }

  // The authored backgrounds are deliberately larger than the 480×800 logical
  // playfield. Resampling a 900×1500 image for every gameplay frame is wasteful,
  // especially on mobile/high-DPR devices, so retain a logical-size raster for
  // the active scene set. Keep a small horizontal gutter so the original subtle
  // focal drift can still be sampled without touching the source image again.
  const STATIC_CACHE_LIMIT = 4;
  const STATIC_CACHE_GUTTER = 8;
  const staticSceneCache = new Map();

  function createStaticSurface(width, height) {
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

  function coverSourceRect(image, sceneDef, focalOffsetX = 0,
    destinationWidth = CONFIG.CANVAS_W, destinationHeight = CONFIG.CANVAS_H) {
    if (!image?.naturalWidth || !image?.naturalHeight) return false;
    const cw = Math.max(1, Number(destinationWidth) || CONFIG.CANVAS_W);
    const ch = Math.max(1, Number(destinationHeight) || CONFIG.CANVAS_H);
    const requestedScale = Math.max(1, Number(sceneDef?.scale || 1));
    const sourceAspect = image.naturalWidth / image.naturalHeight;
    const canvasAspect = cw / ch;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    if (sourceAspect > canvasAspect) sourceWidth = image.naturalHeight * canvasAspect;
    else sourceHeight = image.naturalWidth / canvasAspect;
    sourceWidth /= requestedScale;
    sourceHeight /= requestedScale;
    const focalX = Math.max(0, Math.min(1, Number(sceneDef?.focalX ?? 0.5) + focalOffsetX));
    const focalY = Math.max(0, Math.min(1, Number(sceneDef?.focalY ?? 0.5)));
    const sx = Math.max(0, Math.min(image.naturalWidth - sourceWidth, image.naturalWidth * focalX - sourceWidth / 2));
    const sy = Math.max(0, Math.min(image.naturalHeight - sourceHeight, image.naturalHeight * focalY - sourceHeight / 2));
    return Object.freeze({ cw, ch, sx, sy, sourceWidth, sourceHeight });
  }

  function drawCover(target, image, sceneDef, alpha = 1, focalOffsetX = 0,
    destinationWidth = CONFIG.CANVAS_W, destinationHeight = CONFIG.CANVAS_H) {
    const rect = coverSourceRect(image, sceneDef, focalOffsetX, destinationWidth, destinationHeight);
    if (!rect) return false;
    target.save();
    target.globalAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = 'high';
    target.drawImage(image, rect.sx, rect.sy, rect.sourceWidth, rect.sourceHeight, 0, 0, rect.cw, rect.ch);
    target.restore();
    return true;
  }

  function sceneCacheKey(sceneDef) {
    return [
      sourceFor(sceneDef),
      CONFIG.CANVAS_W,
      CONFIG.CANVAS_H,
      Number(sceneDef?.focalX ?? 0.5).toFixed(4),
      Number(sceneDef?.focalY ?? 0.5).toFixed(4),
      Number(sceneDef?.scale ?? 1).toFixed(4),
      String(sceneDef?.wash || ''),
    ].join('|');
  }

  function touchStaticCache(key, record) {
    staticSceneCache.delete(key);
    staticSceneCache.set(key, record);
    while (staticSceneCache.size > STATIC_CACHE_LIMIT) {
      const oldest = staticSceneCache.keys().next().value;
      if (oldest === undefined) break;
      staticSceneCache.delete(oldest);
    }
    return record;
  }

  function buildStaticScene(sceneDef, image) {
    const key = sceneCacheKey(sceneDef);
    const cached = staticSceneCache.get(key);
    if (cached) return touchStaticCache(key, cached);

    const width = CONFIG.CANVAS_W + STATIC_CACHE_GUTTER * 2;
    const height = CONFIG.CANVAS_H;
    const surface = createStaticSurface(width, height);
    const surfaceContext = surface?.getContext?.('2d');
    if (!surfaceContext) return null;

    // Render the canonical cover into the centre of the widened surface. The
    // gutter is filled from adjacent source pixels, rather than by changing
    // the cover aspect ratio (which would subtly reframe the authored scene).
    const cover = coverSourceRect(image, sceneDef, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    if (!cover) return null;
    surfaceContext.save();
    surfaceContext.translate(STATIC_CACHE_GUTTER, 0);
    if (!drawCover(surfaceContext, image, sceneDef, 1, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H)) {
      surfaceContext.restore();
      return null;
    }
    surfaceContext.restore();

    const sourceGutter = Math.max(1, cover.sourceWidth / CONFIG.CANVAS_W * STATIC_CACHE_GUTTER);
    const drawEdge = (destinationX, sourceX, sourceWidth) => {
      if (sourceWidth > 0) {
        surfaceContext.drawImage(image, sourceX, cover.sy, sourceWidth, cover.sourceHeight,
          destinationX, 0, STATIC_CACHE_GUTTER, CONFIG.CANVAS_H);
        return;
      }
      const edgeX = destinationX < STATIC_CACHE_GUTTER ? cover.sx : cover.sx + cover.sourceWidth - 1;
      surfaceContext.drawImage(image, Math.max(0, Math.min(image.naturalWidth - 1, edgeX)), cover.sy, 1,
        cover.sourceHeight, destinationX, 0, STATIC_CACHE_GUTTER, CONFIG.CANVAS_H);
    };
    const leftWidth = Math.min(sourceGutter, Math.max(0, cover.sx));
    drawEdge(0, Math.max(0, cover.sx - leftWidth), leftWidth);
    const rightAvailable = Math.max(0, image.naturalWidth - (cover.sx + cover.sourceWidth));
    const rightWidth = Math.min(sourceGutter, rightAvailable);
    drawEdge(CONFIG.CANVAS_W + STATIC_CACHE_GUTTER,
      Math.min(image.naturalWidth - 1, cover.sx + cover.sourceWidth), rightWidth);

    // The wash is part of the static authored scene. It is intentionally
    // retained with the raster so chapter crossfades blend the complete scene
    // treatment, while readability and atmosphere remain dynamic below.
    if (sceneDef.wash) {
      surfaceContext.save();
      surfaceContext.fillStyle = sceneDef.wash;
      surfaceContext.fillRect(0, 0, width, height);
      surfaceContext.restore();
    }
    return touchStaticCache(key, Object.freeze({ surface, width, height }));
  }

  function drawCachedScene(target, cache, alpha, drift) {
    if (!cache?.surface) return false;
    const driftPixels = Math.max(-STATIC_CACHE_GUTTER, Math.min(STATIC_CACHE_GUTTER, Number(drift || 0) * CONFIG.CANVAS_W));
    const sourceX = Math.max(0, Math.min(cache.width - CONFIG.CANVAS_W, STATIC_CACHE_GUTTER + driftPixels));
    target.save();
    target.globalAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    target.imageSmoothingEnabled = true;
    target.imageSmoothingQuality = 'high';
    target.drawImage(cache.surface, sourceX, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H,
      0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    target.restore();
    return true;
  }

  function drawScene(target, chapterId, runSeed, alpha = 1) {
    const sceneDef = sceneFor(chapterId, runSeed);
    const primary = imageRecord(sourceFor(sceneDef));
    const reducedMotion = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    const drift = reducedMotion || String(chapterId).indexOf('zen-') === 0
      ? 0 : Math.sin(visual.clock * 0.13 + hashString(chapterId) * 0.000001) * 0.010;
    let painted = false;
    if (primary?.ready && !primary.failed) {
      const cache = buildStaticScene(sceneDef, primary.image);
      painted = drawCachedScene(target, cache, alpha, drift);
      // Retain a compatibility path for unusual hosts without an offscreen
      // canvas implementation. It is never used by normal browser builds.
      if (!painted) {
        painted = drawCover(target, primary.image, sceneDef, alpha, drift);
        if (painted && sceneDef.wash) {
          target.save();
          target.globalAlpha = Math.max(0, Math.min(1, alpha));
          target.fillStyle = sceneDef.wash;
          target.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
          target.restore();
        }
      }
    }
    return painted;
  }

  function walkwayGradientsFor(target) {
    const fromReadability = readabilityCache.get(target);
    if (fromReadability?.walkwayBodyDay && fromReadability.width === CONFIG.CANVAS_W && fromReadability.height === CONFIG.CANVAS_H) return fromReadability;
    let gradients = walkwayGradientCache.get(target);
    if (gradients && gradients.width === CONFIG.CANVAS_W && gradients.height === CONFIG.CANVAS_H) return gradients;
    const walkwayTopY = CONFIG.CANVAS_H - 55;
    const walkwayBodyDay = target.createLinearGradient(0, walkwayTopY, 0, CONFIG.CANVAS_H);
    walkwayBodyDay.addColorStop(0, 'rgba(83,82,65,0.90)');
    walkwayBodyDay.addColorStop(0.45, 'rgba(59,60,50,0.94)');
    walkwayBodyDay.addColorStop(1, 'rgba(31,35,32,0.98)');
    const walkwayTopDay = target.createLinearGradient(0, walkwayTopY, 0, walkwayTopY + 16);
    walkwayTopDay.addColorStop(0, 'rgba(194,187,151,0.90)');
    walkwayTopDay.addColorStop(0.50, 'rgba(145,143,112,0.94)');
    walkwayTopDay.addColorStop(1, 'rgba(91,99,76,0.97)');
    const walkwayBodyNight = target.createLinearGradient(0, walkwayTopY, 0, CONFIG.CANVAS_H);
    walkwayBodyNight.addColorStop(0, 'rgba(55,61,67,0.92)');
    walkwayBodyNight.addColorStop(0.48, 'rgba(37,43,50,0.96)');
    walkwayBodyNight.addColorStop(1, 'rgba(21,26,33,0.99)');
    const walkwayTopNight = target.createLinearGradient(0, walkwayTopY, 0, walkwayTopY + 16);
    walkwayTopNight.addColorStop(0, 'rgba(139,150,157,0.88)');
    walkwayTopNight.addColorStop(0.50, 'rgba(92,103,111,0.93)');
    walkwayTopNight.addColorStop(1, 'rgba(57,67,76,0.97)');
    gradients = { walkwayBodyDay, walkwayTopDay, walkwayBodyNight, walkwayTopNight, width:CONFIG.CANVAS_W, height:CONFIG.CANVAS_H };
    walkwayGradientCache.set(target, gradients);
    return gradients;
  }

  function drawReadability(target) {
    // Keep the falling-food corridor visually dominant without painting new
    // environment illustration over the owner-approved scene.
    let gradients = readabilityCache.get(target);
    if (!gradients || gradients.width !== CONFIG.CANVAS_W || gradients.height !== CONFIG.CANVAS_H) {
      const corridor = target.createLinearGradient(0, 0, CONFIG.CANVAS_W, 0);
      corridor.addColorStop(0, 'rgba(4,10,8,0.02)');
      corridor.addColorStop(0.20, 'rgba(4,10,8,0.10)');
      corridor.addColorStop(0.50, 'rgba(4,10,8,0.20)');
      corridor.addColorStop(0.80, 'rgba(4,10,8,0.10)');
      corridor.addColorStop(1, 'rgba(4,10,8,0.02)');
      const floorFade = target.createLinearGradient(0, CONFIG.CANVAS_H - 160, 0, CONFIG.CANVAS_H);
      floorFade.addColorStop(0, 'rgba(5,12,8,0)');
      floorFade.addColorStop(1, 'rgba(5,12,8,0.28)');
      const glow = target.createLinearGradient(0, CONFIG.CANVAS_H - 160, 0, CONFIG.CANVAS_H);
      glow.addColorStop(0, 'rgba(255,225,174,0)');
      glow.addColorStop(0.55, 'rgba(255,225,174,0.10)');
      glow.addColorStop(1, 'rgba(255,225,174,0)');
      const walkway = walkwayGradientsFor(target);
      gradients = { corridor, floorFade, glow, ...walkway, width:CONFIG.CANVAS_W, height:CONFIG.CANVAS_H };
      readabilityCache.set(target, gradients);
    }
    target.fillStyle = gradients.corridor;
    target.fillRect(0, 42, CONFIG.CANVAS_W, CONFIG.CANVAS_H - 96);
    target.fillStyle = gradients.floorFade;
    target.fillRect(0, CONFIG.CANVAS_H - 160, CONFIG.CANVAS_W, 160);
  }

  function drawArcadeForegroundWalkway(target) {
    // Grounded Arcade characters share one continuous physical foreground
    // plane. This deliberately reads as a flat garden terrace rather than an
    // actor-specific pedestal, so lateral movement remains coherent even when
    // the authored scenery behind the player contains water, flowers or depth.
    // Venus Flytrap keeps its dedicated soil-bed presentation instead.
    const charDef = typeof getCharDef === 'function' ? getCharDef() : null;
    if (charDef?.id === 'flytrap') return;

    const topY = CONFIG.CANVAS_H - 55;
    const lipY = topY + 16;
    target.save();

    // Use a neutral stone terrace rather than a bright green strip. The two
    // palettes follow the chapter's lighting so the gameplay floor remains one
    // physical object without looking pasted over day and night scenery.
    const cachedGradients = walkwayGradientsFor(target);
    const chapterId = String(visual.current || '');
    const nightLit = Boolean(typeof GameState !== 'undefined' && GameState.isZen) || chapterId.includes('moonlit') || chapterId.includes('dream') || chapterId.startsWith('zen-');
    target.fillStyle = nightLit
      ? (cachedGradients?.walkwayBodyNight || 'rgba(37,43,50,0.96)')
      : (cachedGradients?.walkwayBodyDay || 'rgba(59,60,50,0.94)');
    target.fillRect(0, topY, CONFIG.CANVAS_W, CONFIG.CANVAS_H - topY);

    target.fillStyle = nightLit
      ? (cachedGradients?.walkwayTopNight || 'rgba(92,103,111,0.93)')
      : (cachedGradients?.walkwayTopDay || 'rgba(145,143,112,0.94)');
    target.fillRect(0, topY, CONFIG.CANVAS_W, lipY - topY);

    target.fillStyle = nightLit ? 'rgba(210,226,234,0.24)' : 'rgba(244,231,188,0.34)';
    target.fillRect(0, topY, CONFIG.CANVAS_W, 2);
    target.fillStyle = 'rgba(18,25,24,0.46)';
    target.fillRect(0, lipY - 1, CONFIG.CANVAS_W, 3);

    // Subtle slab joints make the strip read as an intentional terrace while
    // remaining quiet enough that falling food and character silhouettes own
    // the foreground. Rectangular marks keep lightweight QA canvases compatible.
    target.fillStyle = nightLit ? 'rgba(20,28,34,0.28)' : 'rgba(43,44,37,0.24)';
    for (let x = 44; x < CONFIG.CANVAS_W; x += 72) target.fillRect(x, topY + 3, 1, 10);
    target.fillRect(0, topY + 34, CONFIG.CANVAS_W, 1);
    for (let x = 8; x < CONFIG.CANVAS_W; x += 96) target.fillRect(x, topY + 35, 1, 18);

    // A restrained moss seam links the terrace back to the garden art without
    // turning the whole floor into the former green bar.
    target.fillStyle = nightLit ? 'rgba(74,105,80,0.30)' : 'rgba(95,132,68,0.34)';
    for (let x = 12; x < CONFIG.CANVAS_W; x += 40) {
      const h = 2 + ((x / 40) % 2);
      target.fillRect(x, topY - h + 1, 2, h);
    }

    target.restore();
  }

  function drawAtmosphere(target, chapterId, weight = 1) {
    if (typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion) return;
    const type = String(chapterId).indexOf('zen-') === 0 ? '' : definitionFor(chapterId).atmosphere;
    if (!type) return;
    const now = visual.clock * 1000;
    target.save();
    for (let index = 0; index < ATMOSPHERE_COUNT; index++) {
      const mote = atmosphereMotes[index];
      const phase = mote.phase + now * (type === 'fireflies' ? 0.00115 : 0.00062) * mote.drift;
      let x = mote.x + Math.sin(phase) * (type === 'petals' || type === 'pollen' ? 15 : 7);
      let y = mote.y + Math.cos(phase * 0.72) * (type === 'petals' ? 18 : 9);
      let alpha = 0.13 + (Math.sin(phase * 1.4) + 1) * 0.07;
      let radius = mote.r;
      if (type === 'fireflies') {
        target.fillStyle = '#ffe06d'; alpha += 0.13; radius += 0.35;
      } else if (type === 'lanterns') {
        target.fillStyle = index % 2 ? '#ffe6a1' : '#fff4cb'; alpha += 0.07; radius += 0.15;
      } else if (type === 'sparkles') {
        target.fillStyle = index % 2 ? '#f8c7ff' : '#fff1b8'; alpha += 0.08; radius += 0.22;
      } else if (type === 'petals') {
        target.fillStyle = index % 2 ? '#ffd0df' : '#ffe6bc'; x += Math.sin(phase * .51) * 9; alpha += 0.02;
      } else {
        target.fillStyle = index % 2 ? '#f8eec7' : '#fff7df'; alpha -= 0.02;
      }
      target.globalAlpha = Math.max(0.04, Math.min(0.38, alpha)) * weight;
      target.beginPath();
      if (type === 'petals' || type === 'pollen') {
        target.ellipse(x, y, radius * 1.45, Math.max(0.7, radius * 0.72), phase, 0, Math.PI * 2);
      } else {
        target.arc(x, y, Math.max(0.7, radius), 0, Math.PI * 2);
      }
      target.fill();
    }
    target.restore();
  }

  function drawDynamic(target, presentation) {
    const reduced = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
    if (String(presentation.currentChapter).indexOf('zen-') === 0) {
      // Read existing progress; presentation never counts generic pickup events.
      const progress = typeof ZenState !== 'undefined' ? Math.min(1, Math.max(0, ZenState.totalProgress)) : 0;
      target.save();
      target.globalAlpha = (1 - progress) * 0.045;
      target.fillStyle = '#292541';
      target.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
      if (!reduced && visual.accent > 0) {
        target.globalAlpha = visual.accent / 0.5;
        target.fillStyle = readabilityCache.get(target).glow;
        target.fillRect(0, CONFIG.CANVAS_H - 160, CONFIG.CANVAS_W, 160);
      }
      target.restore();
      return;
    }
    if (visual.previous) drawAtmosphere(target, visual.previous, 1 - visual.blend);
    if (visual.current) drawAtmosphere(target, visual.current, visual.previous ? visual.blend : 1);
    if (reduced) return;
    const pulse = Math.max(presentation.recordPulse || 0, presentation.orderPulse || 0);
    if (pulse > 0) {
      target.save();
      target.globalAlpha = Math.min(0.16, pulse * 0.12);
      target.strokeStyle = presentation.recordPulse > presentation.orderPulse ? '#ffe36b' : '#ff8bd8';
      target.lineWidth = 6;
      target.strokeRect(5, 52, CONFIG.CANVAS_W - 10, CONFIG.CANVAS_H - 62);
      target.restore();
    }
  }

  function reset() {
    visual.context = ''; visual.current = null; visual.previous = null;
    visual.blend = 1; visual.clock = 0; visual.caught = 0; visual.accent = 0;
    imageRecords.forEach(record => { record.image.onload = null; record.image.onerror = null; });
    imageRecords.clear();
    staticSceneCache.clear();
  }

  function update(dt) {
    if (typeof GameState !== 'undefined' && (GameState.mode !== GAME_MODES.PLAYING
      || !['standard','zen','tc','fmf'].includes(GameState.currentMode))) return;
    const delta = Math.max(0, Math.min(0.1, Number(dt) || 0));
    visual.clock += delta;
    visual.accent = Math.max(0, visual.accent - delta);
    if (visual.previous) {
      const reduced = typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion;
      visual.blend = Math.min(1, visual.blend + delta / (reduced ? 0.65 : 1.25));
      if (visual.blend === 1) visual.previous = null;
    }
    if (typeof ZenState !== 'undefined' && typeof GameState !== 'undefined' && GameState.currentMode === 'zen') {
      const caught = Number(ZenState.totalCaught) || 0;
      if (caught > visual.caught && !(typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion)) visual.accent = 0.5;
      visual.caught = caught;
    }
  }

  function draw(target, presentation) {
    const desired = presentation.currentChapter || 'morning-pond';
    const zen = String(desired).indexOf('zen-') === 0;
    const runSeed = Number(presentation.seed) || 1;
    const context = (zen ? 'zen:' : 'arcade:') + runSeed;
    if (visual.context !== context) {
      visual.current = null; visual.previous = null; visual.blend = 1;
      visual.context = context;
    }
    const desiredScene = sceneFor(desired, runSeed);
    // Share the approved scenery with the opt-in portrait margin treatment.
    // This is a CSS backdrop only; the Canvas render stays the world authority.
    if (typeof document !== 'undefined' && document.body && desiredScene.src !== backdropSrc) {
      backdropSrc = desiredScene.src;
      // URL tokens inside a CSS variable resolve against the stylesheet using
      // them, so use an absolute URL derived from this document's base.
      const sceneUrl = new URL(desiredScene.src, document.baseURI).href;
      document.body.style.setProperty('--arcade-hud-scene', `url("${sceneUrl}")`);
    }
    const record = imageRecord(desiredScene.src);
    const nextSrc = zen ? '' : preloadNextChapter(presentation);
    // Hold the last good scene while loading. Begin the visual fade only when
    // the destination can draw, independently of the wave director's timer.
    if (record?.ready && !record.failed && desired !== visual.current && !visual.previous) {
      visual.previous = visual.current;
      visual.current = desired;
      visual.blend = visual.previous ? 0 : 1;
    }
    let painted = false;
    if (visual.previous) painted = drawScene(target, visual.previous, runSeed, 1);
    if (visual.current) painted = drawScene(target, visual.current, runSeed, visual.previous ? visual.blend : 1) || painted;

    // Fail closed on missing authored art. A neutral backing avoids resurrecting
    // retired procedural scenery while preserving food/hazard readability.
    if (!painted) {
      target.fillStyle = '#10251d';
      target.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
      if (globalThis.FROGGY_DEV_SURFACE === true && !warnedMissing) {
        warnedMissing = true;
        try { console.warn('[Arcade][art] Authored Living Feast scenery is not ready; using neutral backing rather than programmer-art scenery.'); } catch (_) {}
      }
    }
    // Bound decoded source ownership too, not just the retained raster cache.
    const currentSrc = visual.current ? sceneFor(visual.current, runSeed).src : '';
    const previousSrc = visual.previous ? sceneFor(visual.previous, runSeed).src : '';
    for (const [src, entry] of imageRecords) {
      if (src !== desiredScene.src && src !== currentSrc && src !== previousSrc && src !== nextSrc) {
        entry.image.onload = null; entry.image.onerror = null; imageRecords.delete(src);
      }
    }
    drawReadability(target);
    drawArcadeForegroundWalkway(target);
    drawDynamic(target, presentation);
  }

  const VARIANT_PRESENTATIONS = Object.freeze({
    tc:Object.freeze({ seed:0x54434f41, currentChapter:'grand-feast', currentPlan:null, recordPulse:0, orderPulse:0 }),
    fmf:Object.freeze({ seed:0x464d4635, currentChapter:'sunset-picnic', currentPlan:null, recordPulse:0, orderPulse:0 }),
  });

  function drawVariant(target, modeId) {
    const presentation = VARIANT_PRESENTATIONS[String(modeId || '').toLowerCase()];
    if (!presentation) return false;
    draw(target, presentation);
    return true;
  }

  function drawZen(target) {
    zenPresentation.currentChapter = 'zen-' + Math.max(0, Math.min(5, Number(ZenState.roomsRevealed) || 0));
    draw(target, zenPresentation);
  }

  if (typeof EventBus !== 'undefined') EventBus.on('gameStarted', reset);
  // Begin opening-variant loads opportunistically. Readiness is still checked
  // before drawing; later chapters preload one chapter ahead.
  preloadScene(CHAPTER_SCENES['morning-pond'].primary);
  preloadScene(CHAPTER_SCENES['morning-pond'].alternate);
  return Object.freeze({ draw, drawVariant, drawZen, drawForegroundWalkway:drawArcadeForegroundWalkway, update, reset, preloadAll, CHAPTER_SCENES, ZEN_SCENES, sceneFor,
    snapshot:() => Object.freeze({ ...visual, imageCount:imageRecords.size, rasterCount:staticSceneCache.size }) });
})();

function drawLegacyBackground() {
  ctx.fillStyle = bgGradient; ctx.fillRect(0,0,CONFIG.CANVAS_W,CONFIG.CANVAS_H);
  // Perf: avoid building a new `rgba(...)` string per star per frame (60 allocations/frame).
  // Same visual result using a constant fillStyle + globalAlpha instead.
  ctx.fillStyle = '#fff';
  for (const s of bgStars) {
    ctx.globalAlpha = 0.3 + Math.sin(s.twinkle) * 0.3;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = groundGradient; ctx.fillRect(0,CONFIG.CANVAS_H-55,CONFIG.CANVAS_W,55);
  ctx.fillStyle = '#5a8a3a';
  for (let i=0;i<CONFIG.CANVAS_W;i+=22) {
    const h = 8+Math.sin(i*0.3)*4;
    ctx.fillRect(i,CONFIG.CANVAS_H-55-h,4,h+2); ctx.fillRect(i+8,CONFIG.CANVAS_H-55-h*0.7,3,h*0.7+2);
  }
}

function drawCurrentArcadeBackground() {
  if (typeof GameState !== 'undefined' && GameState.isZen) {
    LivingFeastBackgroundRenderer.drawZen(ctx);
    return;
  }
  if (typeof GameState !== 'undefined' && (GameState.isTC || GameState.isFMF)
    && LivingFeastBackgroundRenderer.drawVariant(ctx, GameState.currentMode)) {
    return;
  }
  if (typeof ArcadeLivingFeastDirector !== 'undefined' && ArcadeLivingFeastDirector.isActive()) {
    LivingFeastBackgroundRenderer.draw(ctx, ArcadeLivingFeastDirector.getPresentationState());
    return;
  }
  drawLegacyBackground();
}

function drawBackground() {
  if (typeof FroggyFeastVisualHost !== 'undefined') {
    const backgroundAuthority = FroggyFeastVisualHost.renderOrLegacy(drawCurrentArcadeBackground);
    // UVR/external providers replace scenery only; the walkable gameplay plane
    // remains game-owned foreground geometry. Repaint it on the transparent
    // game canvas when an external backdrop is active so grounded characters
    // never lose physical contact merely because the background provider changed.
    if (backgroundAuthority === 'external') LivingFeastBackgroundRenderer.drawForegroundWalkway(ctx);
    return;
  }
  drawCurrentArcadeBackground();
}


// Compatibility entry point: Zen now renders once in drawCurrentArcadeBackground.
function drawZenCastle() {}
