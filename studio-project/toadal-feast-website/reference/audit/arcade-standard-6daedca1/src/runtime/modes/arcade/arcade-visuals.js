// ============================================================
// src/runtime/modes/arcade/arcade-visuals.js — approved-asset-first Arcade presentation
// ============================================================
// Player-facing food and Arcade special items render only from owner-approved image assets.
// Removed repository-drawn food/special-item fallback art must not be recreated.

const ArcadeVisuals = (() => {
  const OUTLINE = '#3a2718';
  const LIGHT = 'rgba(255,255,255,0.55)';
  const COSMETIC_IMAGE_CACHE = new Map();

  function getCosmeticImage(src) {
    const key = String(src || '');
    if (!key || typeof Image === 'undefined') return null;
    let record = COSMETIC_IMAGE_CACHE.get(key);
    if (record) return record;
    const image = new Image();
    image.decoding = 'async';
    record = { image, ready:false, failed:false };
    image.onload = () => { record.ready = true; };
    image.onerror = () => { record.failed = true; };
    image.src = key;
    COSMETIC_IMAGE_CACHE.set(key, record);
    return record;
  }

  function drawImageCosmetic(ctx, presentation, size) {
    const record = getCosmeticImage(presentation.assetSrc);
    if (!record || record.failed || !record.ready || !record.image.naturalWidth) return false;
    const width = Math.max(8, Number(presentation.targetWidth || size) || size);
    const height = width * (record.image.naturalHeight / record.image.naturalWidth);
    const anchorX = Number.isFinite(Number(presentation.assetAnchorX)) ? Number(presentation.assetAnchorX) : 0.5;
    const anchorY = Number.isFinite(Number(presentation.assetAnchorY)) ? Number(presentation.assetAnchorY) : 1;
    const seatOffsetX = Number.isFinite(Number(presentation.seatOffsetX)) ? Number(presentation.seatOffsetX) : 0;
    const seatOffsetY = Number.isFinite(Number(presentation.seatOffsetY)) ? Number(presentation.seatOffsetY) : 0;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(record.image, -width * anchorX + seatOffsetX, -height * anchorY + seatOffsetY, width, height);
    return true;
  }


  function circle(ctx, x, y, radius, fill, stroke = OUTLINE, lineWidth = 2) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function rounded(ctx, x, y, width, height, radius, fill, stroke = OUTLINE, lineWidth = 2) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius);
    else ctx.rect(x, y, width, height);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function drawFood(ctx, entity, width, height) {
    if (typeof ArcadeAssetBindings === 'undefined' || typeof ArcadeAssetBindings.getForItem !== 'function') return false;
    if (typeof AssetManager === 'undefined' || typeof AssetManager.getImage !== 'function') return false;
    const binding = ArcadeAssetBindings.getForItem(entity?.itemId);
    const assetKey = binding?.runtimeAssetKey || binding?.assetKey;
    if (!assetKey) return false;
    const image = AssetManager.getImage(assetKey);
    if (!image) return false;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    return true;
  }

  // Arcade timed powerups use the owner-approved Jeweled Candy family.
  // Missing art fails closed instead of recreating a colored programmer-art token.
  function drawPowerCandy(ctx, effectId, width, height) {
    if (typeof ArcadePowerupCandyBindings === 'undefined' || typeof ArcadePowerupCandyBindings.get !== 'function') return false;
    if (typeof AssetManager === 'undefined' || typeof AssetManager.getImage !== 'function') return false;
    const binding = ArcadePowerupCandyBindings.get(effectId);
    if (!binding?.assetKey) return false;
    const image = AssetManager.getImage(binding.assetKey);
    if (!image) return false;
    const drawWidth = Math.max(8, width * 1.22);
    const drawHeight = Math.max(8, height * 1.22);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    return true;
  }

  // Uses only approved, theme-resolved semantic masters. Missing images return false;
  // deleted Canvas/hand-drawn replacements are never invoked or recreated.
  function drawApprovedNonFood(ctx, visualKey, width, height) {
    if (typeof ArcadeNonFoodAssetBindings === 'undefined' || typeof ArcadeNonFoodAssetBindings.get !== 'function') return false;
    if (typeof AssetManager === 'undefined' || typeof AssetManager.getImage !== 'function') return false;
    const binding = ArcadeNonFoodAssetBindings.get(visualKey);
    if (!binding?.assetKey) return false;
    const image = AssetManager.getImage(binding.assetKey);
    if (!image) return false;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    return true;
  }

  function drawFallingEntity(ctx, entity, options={}) {
    if (!ctx || !entity) return false;
    const width=Number(options.width)||40, height=Number(options.height)||40, size=Math.min(width,height);
    if(entity.isHeart) return drawApprovedNonFood(ctx, entity.isBlueHeart ? 'heart.blue' : 'heart.red', width, height);
    if(entity.isBomb||entity.isHazard){
      const hazard=typeof getHazardDef==='function'?getHazardDef(entity.hazardType):null;
      const visualKind=hazard?.visualKind||'bomb';
      return drawApprovedNonFood(ctx, `hazard.${visualKind}`, width, height);
    }
    if(entity.isSun) return drawApprovedNonFood(ctx, 'pickup.sun', width, height);
    if(entity.isSyringe) return drawApprovedNonFood(ctx, 'pickup.syringe', width, height);
    if(entity.isGiftBox) return drawApprovedNonFood(ctx, 'pickup.gift', width, height);
    if(entity.isPowerUp) return drawPowerCandy(ctx, entity.powerUpEffect, width, height);
    return drawFood(ctx,entity,width,height);
  }

  function drawMiniFood(ctx, itemId, x, y, size=8) { ctx.save();ctx.translate(x,y);drawFood(ctx,{itemId},size,size);ctx.restore(); }

  function drawAmbientParticle(ctx, particle) {
    const kind=String(particle?.kind||'spark');const s=Math.max(2,8*(Number(particle?.scale)||1));ctx.save();ctx.translate(particle.x,particle.y);
    if(kind==='leaf'){ctx.save();ctx.rotate(.5);ctx.beginPath();ctx.ellipse(0,0,s*.38,s*.72,.4,0,Math.PI*2);ctx.fillStyle='#77b95c';ctx.fill();ctx.restore();}
    else if(kind==='petal'){circle(ctx,0,0,s*.45,'#ffb4d0',null);}
    else if(kind==='ash'){ctx.fillStyle='#8c8e99';ctx.fillRect(-s*.35,-s*.35,s*.7,s*.7);}
    else if(kind==='ember'){circle(ctx,0,0,s*.32,'#ff9a42',null);}
    else if(kind==='smoke'){circle(ctx,0,0,s*.55,'rgba(220,230,238,0.7)',null);}
    else if(kind==='bubble'){circle(ctx,0,0,s*.48,'rgba(142,219,244,0.2)','#91d7ec',1);}
    else if(kind==='drop'){ctx.beginPath();ctx.moveTo(0,-s*.7);ctx.quadraticCurveTo(s*.6,0,0,s*.7);ctx.quadraticCurveTo(-s*.6,0,0,-s*.7);ctx.fillStyle='#67bde0';ctx.fill();}
    else if(kind==='bat'){ctx.fillStyle='#2a173b';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-s,-s*.35);ctx.lineTo(-s*.6,s*.5);ctx.lineTo(0,s*.2);ctx.lineTo(s*.6,s*.5);ctx.lineTo(s,-s*.35);ctx.closePath();ctx.fill();}
    else if(kind==='coin'){circle(ctx,0,0,s*.45,'#f4c84b','#b77e23',1);circle(ctx,0,0,s*.18,'#ffe98c',null);}
    else if(kind==='star'){ctx.fillStyle='#ffe166';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2===0?s*.65:s*.28,a=-Math.PI/2+i*Math.PI/5;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();}
    else {circle(ctx,0,0,s*.32,'#f4e073',null);}
    ctx.restore();
  }

  function drawCosmeticOverlay(ctx, item, options={}) {
    if(!ctx||!item)return false;
    const presentation = options.presentation || (typeof cosmeticPresentationForItem === 'function' ? cosmeticPresentationForItem(item) : (item.presentation || {}));
    if (!presentation.assetSrc || presentation.imageOnly !== true) return false;
    const size=Math.max(12,Number(options.size)||Number(presentation.targetWidth)||28);
    ctx.save();
    const drawn = drawImageCosmetic(ctx, presentation, size);
    ctx.restore();
    return drawn;
  }

  function cosmeticIconMarkup(item, className='') {
    const title = String(item?.name || 'Cosmetic').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const cls = String(className||'').replace(/[^a-zA-Z0-9_\-\s]/g,'');
    const presentation = typeof cosmeticPresentationForItem === 'function'
      ? cosmeticPresentationForItem(item)
      : (item?.presentation || {});
    // Player-facing fallbacks must remain approved raster art. Never synthesize
    // a crown, badge, or other cosmetic with inline SVG/Canvas/CSS geometry.
    const source = presentation?.assetSrc || item?.previewSrc
      || 'assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-cosmetic.png';
    return `<img src="${source}" class="${cls}" alt="${title}" loading="lazy" decoding="async" onerror="this.onerror=null;this.hidden=true;">`;
  }

  return Object.freeze({ drawFallingEntity, drawFood, drawMiniFood, drawAmbientParticle, drawCosmeticOverlay, cosmeticIconMarkup });
})();
