// ============================================================
// src/runtime/shared/content-renderer-adapters.js — Production visual reskin adapters
// ============================================================
// Keeps generated content data separate from game renderers. Each adapter
// attempts a validated, equipped generated asset first and returns false when
// the native renderer must remain in control. No adapter changes gameplay
// state, collisions, scoring, input, or save migration behavior.

const ContentRendererAdapters = (() => {
  const registeredSheets = new Map();

  function safeString(value) {
    return String(value || '').trim();
  }

  function drawResultUsedContent(result) {
    return Boolean(result && result.drawn && result.usedContent);
  }

  // Theme composition sits above target equipment. It resolves a validated
  // player selection where allowed, then a valid theme default, and leaves the
  // existing native renderer in control if neither image is ready. Older
  // runtime pages remain compatible by falling back to ContentAssetResolver.
  function drawComposedOrFallback(request) {
    if (typeof ThemeCompositionResolver !== 'undefined'
      && typeof ThemeCompositionResolver.drawOrFallback === 'function') {
      return ThemeCompositionResolver.drawOrFallback(request);
    }
    return typeof ContentAssetResolver !== 'undefined'
      && typeof ContentAssetResolver.drawOrFallback === 'function'
      ? ContentAssetResolver.drawOrFallback(request)
      : { drawn: false, usedContent: false, asset: null };
  }

  function makeContentSheetKey(asset, baseSheetKey) {
    const assetKey = safeString(asset?.assetKey).replace(/[^a-z0-9_-]/gi, '-');
    const baseKey = safeString(baseSheetKey).replace(/[^a-z0-9:_-]/gi, '-');
    return assetKey && baseKey ? `content:${assetKey}:${baseKey}` : '';
  }

  function registerContentCharacterSheet(asset, baseSheetKey, metadata) {
    if (!asset?.image || !metadata || typeof SpriteSheetManager === 'undefined') return null;
    if (typeof SpriteSheetManager.registerImageSheet !== 'function') return null;
    const sheetKey = makeContentSheetKey(asset, baseSheetKey);
    if (!sheetKey) return null;
    const existing = registeredSheets.get(sheetKey);
    if (!existing || existing.image !== asset.image || existing.assetKey !== asset.assetKey) {
      if (!SpriteSheetManager.registerImageSheet(sheetKey, asset.image, metadata)) return null;
      registeredSheets.set(sheetKey, { image: asset.image, assetKey: asset.assetKey });
    }
    return sheetKey;
  }

  function drawArcadeClassicFrog(ctx, options = {}) {
    const charDef = options.charDef || null;
    if (!charDef || charDef.id !== 'classic') return false;
    if (typeof ContentAssetResolver === 'undefined' || typeof SpriteRenderer === 'undefined' || typeof SpriteSheetManager === 'undefined') return false;
    if (typeof SpriteRenderer.getCharacterState !== 'function' || typeof SpriteRenderer.drawCharacterDefinition !== 'function') return false;
    const state = options.spriteState || SpriteRenderer.getCharacterState('player');
    if (!state?.definition?.spriteSheet) return false;

    const result = drawComposedOrFallback({
      targetId: 'arcade.player.sprite-character',
      subjectId: 'classic',
      save: options.save,
      drawAsset(asset) {
        const metadata = typeof SpriteSheetManager.getRawMetadata === 'function'
          ? SpriteSheetManager.getRawMetadata(state.definition.spriteSheet)
          : null;
        if (!metadata) return false;
        const sheetKey = registerContentCharacterSheet(asset, state.definition.spriteSheet, metadata);
        if (!sheetKey) return false;
        const definition = {
          ...state.definition,
          spriteSheet: sheetKey,
          anchor: asset.anchor ? { ...asset.anchor } : state.definition.anchor,
        };
        return SpriteRenderer.drawCharacterDefinition(ctx, definition, state);
      },
    });
    return drawResultUsedContent(result);
  }

  function arcadeEntityTargetId(entity) {
    if (!entity || typeof entity !== 'object') return null;
    if (entity.isHeart) return entity.isBlueHeart ? 'arcade.falling.heart.blue' : 'arcade.falling.heart.red';
    if (entity.isBomb || entity.isHazard) {
      const hazard = typeof getHazardDef === 'function' ? getHazardDef(entity.hazardType) : null;
      const hazardId = safeString(hazard?.id || entity.hazardType).toLowerCase();
      return /^[a-z][a-z0-9-]*$/.test(hazardId) ? `arcade.falling.hazard.${hazardId}` : null;
    }
    const food = typeof FOOD_ASSET_MAP !== 'undefined' ? FOOD_ASSET_MAP[entity.itemId] : null;
    const suffix = safeString(food?.assetKey).replace(/^food_/, '').toLowerCase();
    return /^[a-z][a-z0-9-]*$/.test(suffix) ? `arcade.falling.food.${suffix}` : null;
  }

  function drawArcadeFallingEntity(ctx, entity, options = {}) {
    if (typeof ContentAssetResolver === 'undefined' || !ctx) return false;
    const targetId = arcadeEntityTargetId(entity);
    if (!targetId) return false;
    const width = Number(options.width || (typeof CONFIG !== 'undefined' ? CONFIG.FOOD_W : 40));
    const height = Number(options.height || (typeof CONFIG !== 'undefined' ? CONFIG.FOOD_H : 40));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;

    const result = drawComposedOrFallback({
      targetId,
      subjectId: 'arcade',
      save: options.save,
      drawAsset(asset) {
        if (!asset?.image || typeof ctx.drawImage !== 'function') return false;
        ctx.drawImage(asset.image, -width / 2, -height / 2, width, height);
        return true;
      },
    });
    return drawResultUsedContent(result);
  }

  function clearRuntimeCache() {
    registeredSheets.clear();
  }

  return Object.freeze({
    drawArcadeClassicFrog,
    drawArcadeFallingEntity,
    arcadeEntityTargetId,
    clearRuntimeCache,
  });
})();
