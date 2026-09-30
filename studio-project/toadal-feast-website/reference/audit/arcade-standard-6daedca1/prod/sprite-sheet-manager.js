// ============================================================
// sprite-sheet-manager.js — Sprite Sheet & Frame Management
// ============================================================
// Handles loading sprite sheets, parsing frame metadata, and providing
// frame lookups for animation and rendering.

const SpriteSheetManager = (() => {
  const sheets = Object.create(null);           // sheetKey -> { image, metadata }
  const frameCache = Object.create(null);       // frameKey -> { x, y, width, height, ... }
  const pending = Object.create(null);          // sheetKey -> Promise
  let collected = false;

  /**
   * Sprite Sheet Format (JSON metadata):
   * {
   *   "image": "path/to/sprite-sheet.png",
   *   "width": 512,
   *   "height": 512,
   *   "frames": {
   *     "character_idle_front": { "x": 0, "y": 0, "width": 64, "height": 64 },
   *     "character_idle_side": { "x": 64, "y": 0, "width": 64, "height": 64 },
   *   },
   *   "animations": {
   *     "character_walk": {
   *       "frames": ["character_walk_1", "character_walk_2", "character_walk_3"],
   *       "framerate": 8,
   *       "loop": true
   *     }
   *   }
   * }
   */

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isLoadedImage(value) {
    return typeof HTMLImageElement !== 'undefined' && value instanceof HTMLImageElement;
  }

  function cloneMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') return {};
    return JSON.parse(JSON.stringify(metadata));
  }

  function clearCachedFrames(sheetKey) {
    const prefix = `${sheetKey}:`;
    Object.keys(frameCache).forEach(key => {
      if (key.startsWith(prefix)) delete frameCache[key];
    });
  }

  function cacheFrames(sheetKey, metadata) {
    if (!metadata || !metadata.frames) return;
    Object.entries(metadata.frames).forEach(([frameKey, frameData]) => {
      frameCache[`${sheetKey}:${frameKey}`] = frameData;
    });
  }

  function storeSheet(sheetKey, image, imagePath, metadata) {
    clearCachedFrames(sheetKey);
    sheets[sheetKey] = {
      image,
      imagePath: imagePath || null,
      metadata: cloneMetadata(metadata),
      loadedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };
    cacheFrames(sheetKey, sheets[sheetKey].metadata);
    return true;
  }

  /**
   * Load a sprite sheet and its metadata
   * @param {string} sheetKey - Unique identifier for this sprite sheet
   * @param {string} imagePath - Path to the sprite sheet PNG
   * @param {object} metadata - Frame and animation metadata
   * @returns {Promise<void>}
   */
  function loadSheet(sheetKey, imagePath, metadata = {}) {
    if (pending[sheetKey]) return pending[sheetKey];
    if (hasOwn(sheets, sheetKey)) return Promise.resolve();
    if (typeof Image === 'undefined') return Promise.resolve();

    pending[sheetKey] = new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        storeSheet(sheetKey, image, imagePath, metadata || {});
        delete pending[sheetKey];
        resolve();
      };
      image.onerror = () => {
        console.warn(`Failed to load sprite sheet: ${sheetKey} from ${imagePath}`);
        sheets[sheetKey] = null;
        delete pending[sheetKey];
        resolve();
      };
      image.src = imagePath;
    });
    return pending[sheetKey];
  }

  /**
   * Load multiple sprite sheets
   * @param {object} sheetMap - { sheetKey: { image, metadata } }
   * @returns {Promise<void>}
   */
  function loadSheets(sheetMap = {}) {
    const promises = [];
    Object.entries(sheetMap).forEach(([sheetKey, { image, metadata }]) => {
      promises.push(loadSheet(sheetKey, image, metadata));
    });
    return Promise.all(promises);
  }

  /**
   * Register an already decoded image with existing sheet metadata.
   * This avoids duplicate renderer logic for shipped content assets.
   */
  function registerImageSheet(sheetKey, image, metadata = {}, options = {}) {
    if (!sheetKey || !isLoadedImage(image)) return false;
    delete pending[sheetKey];
    return storeSheet(sheetKey, image, options.imagePath || null, metadata || {});
  }

  /** Return a detached metadata copy for a production content adapter. */
  function getRawMetadata(sheetKey) {
    const sheet = sheets[sheetKey];
    return sheet ? cloneMetadata(sheet.metadata) : null;
  }

  /**
   * Get a specific frame from a sprite sheet
   * @param {string} sheetKey - Sprite sheet identifier
   * @param {string} frameKey - Frame identifier within sheet
   * @returns {object|null} Frame data { x, y, width, height } or null
   */
  function getFrame(sheetKey, frameKey) {
    const cacheKey = `${sheetKey}:${frameKey}`;
    if (hasOwn(frameCache, cacheKey)) {
      return frameCache[cacheKey];
    }
    const sheet = sheets[sheetKey];
    if (!sheet || !sheet.metadata || !sheet.metadata.frames) return null;
    const frameData = sheet.metadata.frames[frameKey];
    if (frameData) frameCache[cacheKey] = frameData;
    return frameData || null;
  }

  /**
   * Get animation sequence frames
   * @param {string} sheetKey - Sprite sheet identifier
   * @param {string} animationKey - Animation identifier
   * @returns {object|null} Animation data { frames: [...], framerate, loop }
   */
  function getAnimation(sheetKey, animationKey) {
    const sheet = sheets[sheetKey];
    if (!sheet || !sheet.metadata) return null;
    return sheet.metadata.animations?.[animationKey] || null;
  }

  /**
   * Get the image element for a sprite sheet
   * @param {string} sheetKey - Sprite sheet identifier
   * @returns {HTMLImageElement|null} The loaded image or null
   */
  function getImage(sheetKey) {
    const sheet = sheets[sheetKey];
    return (sheet && isLoadedImage(sheet.image)) ? sheet.image : null;
  }

  /**
   * Draw a frame from a sprite sheet to a canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} sheetKey - Sprite sheet identifier
   * @param {string} frameKey - Frame identifier
   * @param {number} x - Canvas X position
   * @param {number} y - Canvas Y position
   * @param {object} options - { scale, rotation, opacity, flip }
   */
  function drawFrame(ctx, sheetKey, frameKey, x, y, options = {}) {
    const frame = getFrame(sheetKey, frameKey);
    const image = getImage(sheetKey);
    if (!frame || !image) return false;

    const {
      scale = 1,
      rotation = 0,
      opacity = 1,
      flipX = false,
      flipY = false,
      sourceWidth = frame.width,
      sourceHeight = frame.height,
    } = options;

    // Anchor points are optional metadata. Existing packs stay centred because
    // a missing anchor resolves to the historical width/2, height/2 behaviour.
    const metadataAnchorX = Number.isFinite(Number(frame.anchorX)) ? Number(frame.anchorX) : sourceWidth * 0.5;
    const metadataAnchorY = Number.isFinite(Number(frame.anchorY)) ? Number(frame.anchorY) : sourceHeight * 0.5;
    const anchorX = Number.isFinite(Number(options.anchorX)) ? Number(options.anchorX) : metadataAnchorX;
    const anchorY = Number.isFinite(Number(options.anchorY)) ? Number(options.anchorY) : metadataAnchorY;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    if (flipX || flipY) {
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }
    if (scale !== 1) ctx.scale(scale, scale);

    ctx.drawImage(
      image,
      frame.x, frame.y, sourceWidth, sourceHeight,
      -anchorX, -anchorY, sourceWidth, sourceHeight
    );

    ctx.restore();
    return true;
  }

  /**
   * Determine if a sprite sheet is loaded and ready
   * @param {string} sheetKey - Sprite sheet identifier
   * @returns {boolean}
   */
  function isReady(sheetKey) {
    return isLoadedImage(getImage(sheetKey));
  }

  /**
   * Check if a specific frame exists in a sheet
   * @param {string} sheetKey - Sprite sheet identifier
   * @param {string} frameKey - Frame identifier
   * @returns {boolean}
   */
  function hasFrame(sheetKey, frameKey) {
    return getFrame(sheetKey, frameKey) !== null;
  }

  /**
   * List all loaded sprite sheets
   * @returns {array} Array of sheet info { key, imagePath, frameCount, animationCount }
   */
  function list() {
    return Object.entries(sheets)
      .filter(([_, sheet]) => sheet !== null)
      .map(([key, sheet]) => ({
        key,
        imagePath: sheet.imagePath,
        frameCount: Object.keys(sheet.metadata.frames || {}).length,
        animationCount: Object.keys(sheet.metadata.animations || {}).length,
        status: isLoadedImage(sheet.image) ? 'loaded' : 'failed',
      }));
  }

  /**
   * Get metadata about a sprite sheet
   * @param {string} sheetKey - Sprite sheet identifier
   * @returns {object|null}
   */
  function getMetadata(sheetKey) {
    const sheet = sheets[sheetKey];
    if (!sheet) return null;
    return {
      key: sheetKey,
      imagePath: sheet.imagePath,
      width: sheet.metadata.width,
      height: sheet.metadata.height,
      frameCount: Object.keys(sheet.metadata.frames || {}).length,
      animationCount: Object.keys(sheet.metadata.animations || {}).length,
      frames: Object.keys(sheet.metadata.frames || {}),
      animations: Object.keys(sheet.metadata.animations || {}),
    };
  }

  /**
   * Create an animation player for smooth frame sequencing
   * @param {string} sheetKey - Sprite sheet identifier
   * @param {string} animationKey - Animation identifier
   * @returns {object} Animation player object
   */
  function createAnimationPlayer(sheetKey, animationKey) {
    const animation = getAnimation(sheetKey, animationKey);
    if (!animation) return null;

    return {
      sheetKey,
      animationKey,
      frames: animation.frames,
      framerate: animation.framerate || 8,
      loop: animation.loop !== false,
      currentIndex: 0,
      elapsedTime: 0,
      isPlaying: true,

      /**
       * Update animation player
       * @param {number} deltaTime - Time elapsed since last update in seconds
       * @returns {string} Current frame key
       */
      update(deltaTime) {
        if (!this.isPlaying) return this.getCurrentFrame();
        
        this.elapsedTime += deltaTime;
        const frameDuration = 1 / this.framerate;
        
        while (this.elapsedTime >= frameDuration && this.isPlaying) {
          this.elapsedTime -= frameDuration;
          this.currentIndex++;
          
          if (this.currentIndex >= this.frames.length) {
            if (this.loop) {
              this.currentIndex = 0;
            } else {
              this.currentIndex = this.frames.length - 1;
              this.isPlaying = false;
            }
          }
        }
        
        return this.getCurrentFrame();
      },

      getCurrentFrame() {
        return this.frames[this.currentIndex] || null;
      },

      reset() {
        this.currentIndex = 0;
        this.elapsedTime = 0;
        this.isPlaying = true;
      },

      stop() {
        this.isPlaying = false;
      },

      play() {
        this.isPlaying = true;
      },

      getProgress() {
        return this.currentIndex / this.frames.length;
      },
    };
  }

  /**
   * Remove one sprite sheet and all frame-cache entries derived from it.
   * The caller owns object-URL cleanup; this manager only owns decoded image references.
   */
  function unloadSheet(sheetKey) {
    if (!sheetKey) return false;
    clearCachedFrames(sheetKey);
    const existed = hasOwn(sheets, sheetKey) || hasOwn(pending, sheetKey);
    delete sheets[sheetKey];
    delete pending[sheetKey];
    return existed;
  }

  /**
   * Replace a sheet at the same key. This is deliberately separate from loadSheet
   * so development tools can hot-reload through the production renderer without
   * cloning its draw logic.
   */
  function reloadSheet(sheetKey, imagePath, metadata = {}) {
    unloadSheet(sheetKey);
    return loadSheet(sheetKey, imagePath, metadata);
  }

  /**
   * Clear all sprite sheet data (useful for hot-reload)
   */
  function clear() {
    Object.keys(sheets).forEach(key => delete sheets[key]);
    Object.keys(frameCache).forEach(key => delete frameCache[key]);
    Object.keys(pending).forEach(key => delete pending[key]);
  }

  return {
    loadSheet,
    reloadSheet,
    unloadSheet,
    loadSheets,
    registerImageSheet,
    getRawMetadata,
    getFrame,
    getAnimation,
    getImage,
    drawFrame,
    isReady,
    hasFrame,
    list,
    getMetadata,
    createAnimationPlayer,
    clear,
  };
})();
