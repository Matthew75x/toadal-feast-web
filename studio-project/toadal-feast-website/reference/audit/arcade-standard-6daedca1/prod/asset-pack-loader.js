// ============================================================
// asset-pack-loader.js — Theme Asset Pack Management
// ============================================================
// Handles loading, validating, and applying complete asset packs
// for easy reskinning and theming.

const AssetPackLoader = (() => {
  const loadedPacks = Object.create(null);  // packName -> packData
  const pending = Object.create(null);       // packName -> Promise
  let activePack = 'default';

  /**
   * Asset Pack Format (JSON):
   * {
   *   "id": "my-theme",
   *   "version": "1.0.0",
   *   "name": "My Custom Theme",
   *   "description": "A beautiful custom theme",
   *   "author": "Author Name",
   *   "spriteSheets": {
   *     "characters": {
   *       "image": "assets/my-theme/characters.png",
   *       "metadata": {...}
   *     }
   *   },
   *   "colors": {
   *     "background": "#1a1a1a",
   *     "primary": "#ff6600",
   *     "secondary": "#0099ff"
   *   },
   *   "fonts": {
   *     "primary": "Arial, sans-serif",
   *     "heading": "Impact, sans-serif"
   *   },
   *   "config": {
   *     "animationSpeed": 1.0,
   *     "particleCount": 50,
   *     "soundVolume": 0.8
   *   }
   * }
   */

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function fallbackPack(packName) {
    return {
      id: String(packName || 'default'),
      version: '1.0.0',
      name: `${String(packName || 'default')} Asset Pack`,
      description: 'Runtime fallback pack used when a local manifest cannot be fetched.',
      spriteSheets: {},
      colors: {},
      config: {},
      fallback: true,
    };
  }

  function fetchManifest(manifestPath) {
    try {
      return fetch(manifestPath);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Load an asset pack JSON manifest
   * @param {string} packName - Identifier for this asset pack
   * @param {string} manifestPath - Path to the manifest JSON
   * @returns {Promise<object>} The loaded pack data
   */
  function loadPack(packName, manifestPath) {
    if (pending[packName]) return pending[packName];
    if (hasOwn(loadedPacks, packName)) return Promise.resolve(loadedPacks[packName]);

    pending[packName] = fetchManifest(manifestPath)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load asset pack: ${packName}`);
        return response.json();
      })
      .catch(() => fallbackPack(packName))
      .then(packData => {
        if (!validatePack(packData)) {
          packData = fallbackPack(packName);
        }
        loadedPacks[packName] = packData;
        delete pending[packName];
        return packData;
      });

    return pending[packName];
  }

  /**
   * Validate asset pack structure
   * @param {object} packData - The pack data to validate
   * @returns {boolean}
   */
  function validatePack(packData) {
    // Required fields
    if (!packData.id || !packData.name) return false;
    
    // Recommended fields
    if (!packData.version) packData.version = '1.0.0';
    if (!packData.spriteSheets) packData.spriteSheets = {};
    if (!packData.colors) packData.colors = {};
    if (!packData.config) packData.config = {};

    return true;
  }

  /**
   * Apply an asset pack to the game
   * Loads all sprite sheets and applies configuration
   * @param {string} packName - Name of the pack to apply
   * @returns {Promise<void>}
   */
  function applyPack(packName) {
    const pack = loadedPacks[packName];
    if (!pack) return Promise.reject(new Error(`Asset pack not loaded: ${packName}`));

    activePack = packName;

    // Load all sprite sheets in the pack
    const sheetPromises = [];
    if (pack.spriteSheets && typeof SpriteSheetManager !== 'undefined') {
      Object.entries(pack.spriteSheets).forEach(([sheetKey, sheetData]) => {
        // Resolve relative paths
        const imagePath = resolveAssetPath(packName, sheetData.image);
        sheetPromises.push(
          SpriteSheetManager.loadSheet(
            `${packName}:${sheetKey}`,
            imagePath,
            sheetData.metadata
          )
        );
      });
    }

    // Apply color overrides to DOM if needed
    if (pack.colors) {
      applyColorTheme(pack.colors);
    }

    // Apply font configuration if needed
    if (pack.fonts) {
      applyFontConfig(pack.fonts);
    }

    // Apply game configuration
    if (pack.config && typeof GameConfig !== 'undefined') {
      Object.assign(GameConfig, pack.config);
    }

    return Promise.all(sheetPromises);
  }

  /**
   * Resolve relative asset paths for a pack
   * @param {string} packName - Pack identifier
   * @param {string} assetPath - Relative asset path
   * @returns {string} Full asset path
   */
  function resolveAssetPath(packName, assetPath) {
    // If absolute URL or data URI, return as-is
    if (assetPath.startsWith('http') || assetPath.startsWith('data:')) {
      return assetPath;
    }
    // Prepend pack directory path
    return `assets/packs/${packName}/${assetPath}`;
  }

  /**
   * Apply color theme to the page
   * @param {object} colors - Color definitions
   */
  function applyColorTheme(colors) {
    const root = document.documentElement;
    if (!root) return;

    Object.entries(colors).forEach(([name, value]) => {
      const cssVarName = `--theme-${name.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
  }

  /**
   * Apply font configuration
   * @param {object} fonts - Font definitions
   */
  function applyFontConfig(fonts) {
    const root = document.documentElement;
    if (!root) return;

    Object.entries(fonts).forEach(([name, value]) => {
      const cssVarName = `--font-${name}`;
      root.style.setProperty(cssVarName, value);
    });
  }

  /**
   * Get the currently active pack
   * @returns {string} Pack name
   */
  function getActivePack() {
    return activePack;
  }

  /**
   * Get loaded pack data
   * @param {string} packName - Pack identifier
   * @returns {object|null}
   */
  function getPack(packName) {
    return loadedPacks[packName] || null;
  }

  /**
   * Get a sprite sheet from a pack
   * @param {string} packName - Pack identifier
   * @param {string} sheetKey - Sprite sheet key
   * @returns {object|null} Sprite sheet data
   */
  function getPackSpriteSheet(packName, sheetKey) {
    const pack = loadedPacks[packName];
    if (!pack || !pack.spriteSheets) return null;
    return pack.spriteSheets[sheetKey] || null;
  }

  /**
   * List all loaded packs
   * @returns {array} Array of pack info
   */
  function listPacks() {
    return Object.entries(loadedPacks)
      .filter(([_, pack]) => pack !== null)
      .map(([name, pack]) => ({
        name,
        id: pack.id,
        version: pack.version,
        author: pack.author,
        description: pack.description,
      }));
  }

  /**
   * Get a configuration value from the active pack
   * @param {string} key - Config key (supports dot notation: "key.subkey")
   * @param {*} defaultValue - Default if not found
   * @returns {*}
   */
  function getConfig(key, defaultValue = null) {
    const pack = loadedPacks[activePack];
    if (!pack || !pack.config) return defaultValue;

    const keys = key.split('.');
    let value = pack.config;
    for (let k of keys) {
      value = value?.[k];
      if (value === undefined) return defaultValue;
    }
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Merge multiple asset packs (overlay mode)
   * Later packs override earlier ones
   * @param {array<string>} packNames - Pack names to merge
   * @returns {Promise<object>} Merged pack data
   */
  function mergePacks(packNames = []) {
    const merged = {
      id: 'merged',
      name: 'Merged Pack',
      spriteSheets: {},
      colors: {},
      fonts: {},
      config: {},
    };

    packNames.forEach(packName => {
      const pack = loadedPacks[packName];
      if (!pack) return;

      Object.assign(merged.spriteSheets, pack.spriteSheets || {});
      Object.assign(merged.colors, pack.colors || {});
      Object.assign(merged.fonts, pack.fonts || {});
      Object.assign(merged.config, pack.config || {});
    });

    loadedPacks['__merged'] = merged;
    return Promise.resolve(merged);
  }

  /**
   * Create a new pack from scratch
   * @param {string} packName - New pack identifier
   * @param {object} packData - Pack data
   * @returns {object} The created pack
   */
  function createPack(packName, packData = {}) {
    const newPack = {
      id: packName,
      name: packData.name || packName,
      version: packData.version || '1.0.0',
      author: packData.author || 'Unknown',
      description: packData.description || '',
      spriteSheets: packData.spriteSheets || {},
      colors: packData.colors || {},
      fonts: packData.fonts || {},
      config: packData.config || {},
    };

    if (validatePack(newPack)) {
      loadedPacks[packName] = newPack;
      return newPack;
    }
    return null;
  }

  /**
   * Export pack as JSON
   * @param {string} packName - Pack to export
   * @returns {string} JSON string
   */
  function exportPack(packName) {
    const pack = loadedPacks[packName];
    if (!pack) return null;
    return JSON.stringify(pack, null, 2);
  }

  /**
   * Clear all loaded packs
   */
  function clear() {
    Object.keys(loadedPacks).forEach(key => delete loadedPacks[key]);
    Object.keys(pending).forEach(key => delete pending[key]);
    activePack = 'default';
  }

  return {
    loadPack,
    applyPack,
    getActivePack,
    getPack,
    getPackSpriteSheet,
    listPacks,
    getConfig,
    mergePacks,
    createPack,
    exportPack,
    clear,
  };
})();
