// ============================================================
// sprite-renderer.js — Sprite-Based Character & Asset Rendering
// ============================================================
// Provides character rendering using sprite sheets instead of
// procedural canvas drawing. Supports animations, expressions, and
// easy reskinning through asset packs.

const SpriteRenderer = (() => {
  const characterStates = Object.create(null);  // characterId -> state object
  const animationPlayers = Object.create(null); // characterId -> animation player

  /**
   * Initialize a character for sprite rendering
   * @param {string} characterId - Character identifier
   * @param {object} characterDef - Character definition from ASSET_REGISTRY
   * @param {string} packName - Name of asset pack to use
   * @returns {object} Character state object
   */
  function initCharacter(characterId, characterDef, packName = 'default') {
    const state = {
      id: characterId,
      definition: characterDef,
      packName,
      currentFrame: characterDef.frames?.idle || 'idle',
      currentState: 'idle', // idle, eating, moving, etc.
      x: 0,
      y: 0,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      flipX: false,
      flipY: false,
      tint: null, // { r, g, b, a } for color overlay
      metadata: {
        lastUpdateTime: performance.now(),
        totalFramesDrawn: 0,
      },
    };

    characterStates[characterId] = state;
    return state;
  }

  /**
   * Update character state based on game logic
   * @param {string} characterId - Character identifier
   * @param {object} updates - State updates { x, y, scale, state, etc. }
   */
  function updateCharacter(characterId, updates = {}) {
    const state = characterStates[characterId];
    if (!state) return;

    Object.assign(state, updates);

    // Handle state changes (idle -> eating, etc.)
    if (updates.currentState && state.definition.frames[updates.currentState]) {
      state.currentFrame = state.definition.frames[updates.currentState];
    }

    state.metadata.lastUpdateTime = performance.now();
  }

  /**
   * Play an animation on a character
   * @param {string} characterId - Character identifier
   * @param {string} animationKey - Animation identifier
   * @param {object} options - { loop, onComplete }
   * @returns {object} Animation player
   */
  function playAnimation(characterId, animationKey, options = {}) {
    const state = characterStates[characterId];
    if (!state) return null;

    const sheetKey = state.definition.spriteSheet;
    if (!sheetKey || typeof SpriteSheetManager === 'undefined') return null;

    // Create animation player
    const player = SpriteSheetManager.createAnimationPlayer(sheetKey, animationKey);
    if (!player) return null;

    if (options.loop !== undefined) player.loop = options.loop;
    if (options.onComplete) player.onComplete = options.onComplete;

    animationPlayers[characterId] = player;
    return player;
  }

  /**
   * Stop an active animation and keep the character on its current frame.
   * Useful for scene tooling that needs deterministic frame inspection.
   */
  function stopAnimation(characterId) {
    const player = animationPlayers[characterId];
    if (!player) return false;
    player.stop();
    return true;
  }

  /**
   * Remove any animation player and select an explicit frame.
   */
  function setFrame(characterId, frameKey) {
    const state = characterStates[characterId];
    if (!state || !frameKey) return false;
    delete animationPlayers[characterId];
    state.currentFrame = frameKey;
    state.metadata.lastUpdateTime = performance.now();
    return true;
  }

  /**
   * Draw a supplied character definition with an existing renderer state.
   * Content adapters use this to swap only the visual sheet while preserving
   * the game's position, state, flip, and timing data.
   */
  function drawCharacterDefinition(ctx, definition, renderState = {}) {
    if (!definition || !definition.spriteSheet || typeof SpriteSheetManager === 'undefined') return false;
    const frameKey = renderState.currentFrame || definition.frames?.idle || 'idle';
    return SpriteSheetManager.drawFrame(
      ctx,
      definition.spriteSheet,
      frameKey,
      Number(renderState.x || 0),
      Number(renderState.y || 0),
      {
        scale: Number(renderState.scale || 1),
        rotation: Number(renderState.rotation || 0),
        opacity: Number(renderState.opacity ?? 1),
        flipX: renderState.flipX === true,
        flipY: renderState.flipY === true,
        anchorX: Number.isFinite(Number(definition.anchor?.x)) ? Number(definition.anchor.x) : undefined,
        anchorY: Number.isFinite(Number(definition.anchor?.y)) ? Number(definition.anchor.y) : undefined,
      }
    );
  }

  /**
   * Draw a character using sprite sheets
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} characterId - Character identifier
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} Whether character was drawn
   */
  function drawCharacter(ctx, characterId, deltaTime = 0.016) {
    const state = characterStates[characterId];
    if (!state) return false;

    const { definition, packName, currentFrame, x, y, scale, rotation, opacity, flipX, flipY } = state;
    const sheetKey = definition.spriteSheet;

    if (!sheetKey || typeof SpriteSheetManager === 'undefined') {
      console.warn(`Cannot render character ${characterId}: missing sprite sheet configuration`);
      return false;
    }

    // Update animation if playing
    const player = animationPlayers[characterId];
    if (player) {
      player.update(deltaTime);
      state.currentFrame = player.getCurrentFrame();
    }

    // Draw through the shared definition path so runtime content adapters
    // and native sprites use identical frame, anchor, flip, and opacity logic.
    const frameDrawn = drawCharacterDefinition(ctx, definition, state);

    if (frameDrawn) {
      state.metadata.totalFramesDrawn++;
    }

    return frameDrawn;
  }

  /**
   * Draw a character with color overlay/tinting
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} characterId - Character identifier
   * @param {object} tintColor - { r, g, b, a }
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean}
   */
  function drawCharacterTinted(ctx, characterId, tintColor, deltaTime = 0.016) {
    const state = characterStates[characterId];
    if (!state) return false;

    ctx.save();

    // Draw the character normally first
    const result = drawCharacter(ctx, characterId, deltaTime);

    // Apply tint overlay
    if (result && tintColor) {
      const { x, y, scale } = state;
      const frame = SpriteSheetManager.getFrame(
        state.definition.spriteSheet,
        state.currentFrame
      );

      if (frame) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(${tintColor.r}, ${tintColor.g}, ${tintColor.b}, ${tintColor.a || 0.5})`;
        ctx.fillRect(
          x - frame.width * scale * 0.5,
          y - frame.height * scale * 0.5,
          frame.width * scale,
          frame.height * scale
        );
      }
    }

    ctx.restore();
    return result;
  }

  /**
   * Draw a character with multiple frames layered
   * Useful for compound characters (e.g., character + cosmetic)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {array<string>} characterIds - Array of character IDs to layer
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean}
   */
  function drawCharacterComposite(ctx, characterIds = [], deltaTime = 0.016) {
    let anyDrawn = false;

    // Draw in order (z-order)
    characterIds.forEach((characterId, index) => {
      const drawn = drawCharacter(ctx, characterId, deltaTime);
      if (drawn) anyDrawn = true;
    });

    return anyDrawn;
  }

  /**
   * Get character render state
   * @param {string} characterId - Character identifier
   * @returns {object|null}
   */
  function getCharacterState(characterId) {
    return characterStates[characterId] || null;
  }

  /**
   * Get animation player
   * @param {string} characterId - Character identifier
   * @returns {object|null}
   */
  function getAnimationPlayer(characterId) {
    return animationPlayers[characterId] || null;
  }

  /**
   * Create a character sprite from template
   * Useful for creating multiple instances with different configs
   * @param {string} characterId - Character identifier
   * @param {string} baseCharacter - Character to base on (from ASSET_REGISTRY)
   * @param {object} overrides - Property overrides
   * @returns {object} Character definition
   */
  function createCharacterSprite(characterId, baseCharacter, overrides = {}) {
    if (typeof ASSET_REGISTRY === 'undefined') {
      console.error('ASSET_REGISTRY not loaded');
      return null;
    }

    const baseDef = ASSET_REGISTRY.characters[baseCharacter];
    if (!baseDef) {
      console.error(`Character not found in registry: ${baseCharacter}`);
      return null;
    }

    const customDef = Object.assign({}, baseDef, overrides);
    initCharacter(characterId, customDef);
    return customDef;
  }

  /**
   * Draw character from layout config
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} characterId - Character identifier
   * @param {string} layoutKey - Layout key from AssetLayoutConfig (e.g., 'main', 'puzzle')
   * @param {number} deltaTime - Time since last frame
   * @returns {boolean}
   */
  function drawCharacterAtLayout(ctx, characterId, layoutKey = 'main', deltaTime = 0.016) {
    if (typeof AssetLayoutConfig === 'undefined') {
      console.warn('AssetLayoutConfig not loaded');
      return drawCharacter(ctx, characterId, deltaTime);
    }

    const layout = AssetLayoutConfig.characters[layoutKey];
    if (!layout) {
      console.warn(`Layout not found: ${layoutKey}`);
      return drawCharacter(ctx, characterId, deltaTime);
    }

    const state = characterStates[characterId];
    if (!state) return false;

    // Update position and scale from layout
    state.x = layout.x;
    state.y = layout.y;
    state.scale = layout.scale || 1.0;

    return drawCharacter(ctx, characterId, deltaTime);
  }

  /**
   * Batch draw multiple characters
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {array<string>} characterIds - Character IDs to draw
   * @param {number} deltaTime - Time since last frame
   * @returns {number} Number of characters drawn
   */
  function drawCharactersBatch(ctx, characterIds = [], deltaTime = 0.016) {
    let count = 0;
    characterIds.forEach(id => {
      if (drawCharacter(ctx, id, deltaTime)) count++;
    });
    return count;
  }

  /**
   * Clear all character states
   */
  function clear() {
    Object.keys(characterStates).forEach(key => delete characterStates[key]);
    Object.keys(animationPlayers).forEach(key => delete animationPlayers[key]);
  }

  /**
   * Get statistics about rendered characters
   * @returns {object} Stats
   */
  function getStats() {
    const stats = {
      activeCharacters: Object.keys(characterStates).length,
      animationsPlaying: Object.keys(animationPlayers).length,
      totalFramesDrawn: 0,
    };

    Object.values(characterStates).forEach(state => {
      stats.totalFramesDrawn += state.metadata.totalFramesDrawn;
    });

    return stats;
  }

  return {
    initCharacter,
    updateCharacter,
    playAnimation,
    stopAnimation,
    setFrame,
    drawCharacter,
    drawCharacterDefinition,
    drawCharacterTinted,
    drawCharacterComposite,
    getCharacterState,
    getAnimationPlayer,
    createCharacterSprite,
    drawCharacterAtLayout,
    drawCharactersBatch,
    clear,
    getStats,
  };
})();
