// ============================================================
// src/runtime/rendering/draw-world-entities.js — Food/particle/text rendering
// drawFoods, drawParticles, drawFloatingTexts. Split from game-draw.js for modularity.
// ============================================================

// ctx.shadowBlur is one of the most expensive Canvas2D operations: setting
// it nonzero forces a full blur-convolution pass on every subsequent draw
// call, and it was being set live, per entity, per frame for every bomb,
// heart, sun, and power-up -- exactly the "storm" moments when the most
// entities are on screen at once during normal fruitfall play. That was the
// source of the reported lag.
//
// Fix: precompute and cache a soft radial-gradient "halo" per (color,
// blur radius) pair and paint it once behind the entity instead of asking
// the canvas to blur anything. Gradient objects hold their coordinates in
// local user-space, so a single cached gradient replays correctly no matter
// where/how the context is currently translated/rotated/scaled -- callers
// just need beginPath/arc/fill at the entity's already-transformed origin.
// This preserves the "it's glowing" read at a small fraction of the cost;
// the one visual trade-off is a circular halo instead of a shadow shaped
// exactly like the sprite's silhouette, which is not noticeable at the
// 36x36 entity sizes this renders at.
const _entityGlowGradientCache = new Map();
function _hexToRgba(hex, alpha) {
  const clean = (hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16) || 0xffffff;
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function drawEntityGlow(color, blurRadius) {
  if (!blurRadius || blurRadius <= 0) return;
  if (typeof SETTINGS !== 'undefined' && SETTINGS.entityGlowEffects === false) return;
  const key = color + '|' + Math.round(blurRadius);
  let gradient = _entityGlowGradientCache.get(key);
  if (!gradient) {
    const haloRadius = (CONFIG.FOOD_W / 2) + blurRadius;
    gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
    gradient.addColorStop(0, _hexToRgba(color, 0.55));
    gradient.addColorStop(0.6, _hexToRgba(color, 0.25));
    gradient.addColorStop(1, _hexToRgba(color, 0));
    _entityGlowGradientCache.set(key, gradient);
  }
  const haloRadius = (CONFIG.FOOD_W / 2) + blurRadius;
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const _emptyArcadeFoodDrawOptions = Object.freeze({});
function drawArcadeFoodEntityVisual(entity, options) {
  if (!entity) return false;
  options = options || _emptyArcadeFoodDrawOptions;
  const x = Number.isFinite(Number(options.x)) ? Number(options.x) : Number(entity.x || 0);
  const y = Number.isFinite(Number(options.y)) ? Number(options.y) : Number(entity.y || 0);
  const scaleMultiplier = Math.max(0.01, Number(options.scaleMultiplier || 1));
  const rotationOffset = Number(options.rotationOffset || 0);
  const alpha = Math.max(0, Math.min(1, Number(options.alpha ?? 1)));
  const allowGlow = options.allowGlow !== false;
  const wobbleRotation = options.freezeWobble
    ? 0
    : Math.sin(Number(entity.wobbleTime || 0) * 2) * 0.1;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(Number(entity.rotation || 0) + rotationOffset + wobbleRotation);
  const entityScale = Math.max(0.01, Number(entity.scale || 1)) * scaleMultiplier;
  ctx.scale(entityScale, entityScale);

  // Food art is intentionally more readable than its gameplay hit geometry.
  // This is visual-only: CONFIG.FOOD_W/H, collision, spawn clamping, and fall
  // logic remain unchanged. Canonical image assets still use alpha-bound
  // normalization inside FoodPresentationContract before this outer scale.
  const isStandardFood = !entity.isBomb && !entity.isHazard && !entity.isHeart
    && !entity.isSun && !entity.isSyringe && !entity.isGiftBox && !entity.isPowerUp;
  const foodVisualScale = isStandardFood
    ? Math.max(0.1, Number(GAME_BALANCE.arcadePresentation?.foodVisualScale || 1))
    : 1;
  if (foodVisualScale !== 1) ctx.scale(foodVisualScale, foodVisualScale);
  const nonFoodVisualScale = entity.isSun ? 1.08
    : (entity.isBomb || entity.isHazard) ? 1.30
    : entity.isHeart ? 1.16
    : (entity.isSyringe || entity.isGiftBox || entity.isPowerUp) ? 1.12
    : 1;
  if (!isStandardFood && nonFoodVisualScale !== 1) ctx.scale(nonFoodVisualScale, nonFoodVisualScale);

  const hazard = entity.isBomb && typeof getHazardDef === 'function'
    ? getHazardDef(entity.hazardType)
    : null;
  if (allowGlow && entity.isBomb) {
    drawEntityGlow(hazard?.color || '#ff4444', 12);
  }
  if (allowGlow && entity.isHeart) {
    drawEntityGlow(entity.isBlueHeart ? '#58bfff' : '#ff69b4', 10);
  }
  if (allowGlow && entity.isSun) {
    drawEntityGlow('#ffcc00', 22);
    ctx.scale(1.2, 1.2);
  }
  if (allowGlow && entity.isPowerUp) {
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 220);
    drawEntityGlow('#ffe066', 18 * pulse);
    ctx.scale(pulse * 0.92 + 0.08, pulse * 0.92 + 0.08);
  }

  const isApprovedNonFood = Boolean(entity.isBomb || entity.isHazard || entity.isHeart
    || entity.isSun || entity.isSyringe || entity.isGiftBox || entity.isPowerUp);
  const imageKey = entity.assetKey
    || (typeof FOOD_ASSET_MAP !== 'undefined' && FOOD_ASSET_MAP[entity.itemId]?.assetKey)
    || (typeof BOMB_ASSET_MAP !== 'undefined' && BOMB_ASSET_MAP[entity.hazardType]?.assetKey);
  const image = !isApprovedNonFood && imageKey && typeof AssetManager !== 'undefined'
    ? AssetManager.getImage(imageKey)
    : null;
  const hasMigratedSemanticSource = !isApprovedNonFood && imageKey && typeof AssetManager !== 'undefined'
    && typeof AssetManager.hasSource === 'function' && AssetManager.hasSource(imageKey);

  let spritePreviewDrawn = false;
  const contentReskinDrawn = !spritePreviewDrawn
    && typeof ContentRendererAdapters !== 'undefined'
    && typeof ContentRendererAdapters.drawArcadeFallingEntity === 'function'
    && ContentRendererAdapters.drawArcadeFallingEntity(ctx, entity, { width: CONFIG.FOOD_W, height: CONFIG.FOOD_H });

  if (!spritePreviewDrawn && !contentReskinDrawn && isApprovedNonFood) {
    // Hazards and pickups are not food. Route them directly through the exact
    // approved non-food bindings so FoodPresentationContract cannot substitute
    // a text/placeholder tile when a bomb is dropped.
    const drawn = typeof ArcadeVisuals !== 'undefined'
      && ArcadeVisuals.drawFallingEntity(ctx, entity, { width: CONFIG.FOOD_W, height: CONFIG.FOOD_H });
    if (!drawn) {
      ctx.fillStyle = entity.isBomb || entity.isHazard ? '#ff6464' : '#8ed17b';
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(CONFIG.FOOD_W, CONFIG.FOOD_H) * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (!spritePreviewDrawn && !contentReskinDrawn && image) {
    const presentationDrawn = typeof FoodPresentationContract !== 'undefined'
      && FoodPresentationContract?.draw
      && FoodPresentationContract.draw(ctx, image, {
        mode: 'arcade',
        surface: options.surface || 'falling-food',
        foodId: entity.itemId,
        x: 0,
        y: 0,
        surfaceWidth: CONFIG.FOOD_W,
        surfaceHeight: CONFIG.FOOD_H,
      });
    if (!presentationDrawn) {
      ctx.drawImage(image, -CONFIG.FOOD_W / 2, -CONFIG.FOOD_H / 2, CONFIG.FOOD_W, CONFIG.FOOD_H);
    }
  } else if (!spritePreviewDrawn && !contentReskinDrawn && !hasMigratedSemanticSource && typeof ArcadeVisuals !== 'undefined') {
    ArcadeVisuals.drawFallingEntity(ctx, entity, { width: CONFIG.FOOD_W, height: CONFIG.FOOD_H });
  } else if (!spritePreviewDrawn && !contentReskinDrawn) {
    // A migrated asset never falls back to native emoji or a second
    // illustrative Canvas drawing. During an image failure it uses only this
    // neutral geometric safety mark while telemetry/provenance surfaces flag it.
    ctx.fillStyle = entity.isBomb ? '#ff6464' : '#8ed17b';
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(CONFIG.FOOD_W, CONFIG.FOOD_H) * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return true;
}

// Issue #114's containment camera is anchored at the gameplay ground. Uniform
// scaling around that low anchor keeps wide characters inside the Arcade frame,
// but it also maps a logical food spawn at y=-FOOD_H downward into visible
// screen space whenever the camera scale is below 1. That changed the original
// fruitfall presentation even though gameplay/spawn coordinates never changed.
//
// Keep the shared horizontal camera and the lower-field catch alignment, but
// restore the original top-edge entry visually. While an entity is entering the
// upper field, choose a pre-camera Y whose transformed screen position blends
// from the original logical Y to the camera-mapped Y. The blend reaches the
// ordinary shared-camera position well before the catch area. This function is
// presentation-only and never writes entity state, timing, speed, collisions,
// RNG, scoring, or balance.
function arcadeFallingEntityPresentationY(logicalY, cameraSnapshot = null) {
  const y = Number(logicalY);
  if (!Number.isFinite(y)) return 0;
  const snapshot = cameraSnapshot || (() => {
    const camera = typeof ArcadePresentationCamera !== 'undefined' ? ArcadePresentationCamera : null;
    return camera && typeof camera.snapshot === 'function' ? camera.snapshot() : null;
  })();
  const depth = Number(snapshot?.depth || 0);
  const scale = Number(snapshot?.scale || 1);
  const groundAnchor = Number(snapshot?.anchorY);
  if (!(depth > 0) || !(scale > 0) || !Number.isFinite(groundAnchor) || Math.abs(scale - 1) < 1e-9) return y;

  const canvasHeight = Math.max(1, Number(typeof CONFIG !== 'undefined' ? CONFIG.CANVAS_H : 800) || 800);
  const foodHeight = Math.max(1, Number(typeof CONFIG !== 'undefined' ? CONFIG.FOOD_H : 36) || 36);
  const transitionEnd = Math.max(
    foodHeight * 4,
    Math.min(canvasHeight * 0.72, Math.max(foodHeight * 4, groundAnchor - 96)),
  );
  const progress = Math.max(0, Math.min(1, y / transitionEnd));
  const blend = progress * progress * (3 - 2 * progress);
  const ordinaryCameraY = groundAnchor + (y - groundAnchor) * scale;
  const desiredScreenY = y + (ordinaryCameraY - y) * blend;

  // drawFoods() already runs inside ArcadePresentationCamera. Return the world
  // Y that the existing outer transform must receive to paint desiredScreenY.
  return groundAnchor + (desiredScreenY - groundAnchor) / scale;
}

function drawFoods() {
  const camera = typeof ArcadePresentationCamera !== 'undefined' ? ArcadePresentationCamera : null;
  const cameraSnapshot = camera && typeof camera.snapshot === 'function' ? camera.snapshot() : null;
  for (const entity of entities.foods) {
    const presentationY = arcadeFallingEntityPresentationY(entity.y, cameraSnapshot);
    const presentationDeltaY = presentationY - Number(entity.y || 0);

    if (typeof ArcadeAffinityPresentation !== 'undefined') {
      if (Math.abs(presentationDeltaY) > 1e-9) {
        ctx.save();
        ctx.translate(0, presentationDeltaY);
        ArcadeAffinityPresentation.drawFoodAura(ctx, entity);
        ctx.restore();
      } else {
        ArcadeAffinityPresentation.drawFoodAura(ctx, entity);
      }
    }
    drawArcadeFoodEntityVisual(entity, { y:presentationY });

    if (GAME_BALANCE.showFoodRadius) {
      const halfWidth = CONFIG.FOOD_W / 2;
      const halfHeight = CONFIG.FOOD_H / 2;
      const hazard = entity.isBomb && typeof getHazardDef === 'function'
        ? getHazardDef(entity.hazardType)
        : null;
      ctx.save();
      const color = entity.isBomb ? (hazard?.color || '#ff4444') : entity.isHeart ? '#ff69b4' : '#ffdc00';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(entity.x - halfWidth, presentationY - halfHeight, CONFIG.FOOD_W, CONFIG.FOOD_H);
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = color;
      ctx.fillRect(entity.x - halfWidth, presentationY - halfHeight, CONFIG.FOOD_W, CONFIG.FOOD_H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(entity.x, presentationY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

function drawParticles() {
  for (const p of entities.particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  for (const t of entities.floatingTexts) {
    const alpha = t.life / t.maxLife;
    ctx.save(); ctx.font='bold 20px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=alpha; ctx.fillStyle=t.color; ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
    ctx.fillText(t.text,t.x,t.y); ctx.restore();
  }
}

