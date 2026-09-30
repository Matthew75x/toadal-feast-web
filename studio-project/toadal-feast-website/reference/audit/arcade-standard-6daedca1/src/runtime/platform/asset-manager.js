// ============================================================
// src/runtime/platform/asset-manager.js — AssetManager
// ============================================================
// A lazy image registry for the legacy global-script runtime.
//
// `init()` records all known asset metadata but only preloads a small critical
// Arcade set. `getImage(key)` starts an asynchronous load on first use and
// returns null until the image is ready, preserving the renderer-owned
// fallback behavior. The migrated Arcade path uses ArcadeVisuals rather than emoji. This avoids a startup storm of requests for every
// optional character, cosmetic, and mode-specific image.

const AssetManager = (() => {
  const images = Object.create(null);      // assetKey -> HTMLImageElement | null
  const pending = Object.create(null);     // assetKey -> Promise<void>
  const registry = Object.create(null);    // assetKey -> { assetKey, src, group }
  const generations = Object.create(null); // assetKey -> monotonic load generation
  const failures = Object.create(null);    // assetKey -> last failure metadata
  let collected = false;

  // Keep first paint small. Character and run-specific food imagery is queued
  // separately once the selected character is known instead of decoding the
  // entire roster and all 69 foods at boot.
  const CRITICAL_ARCADE_KEYS = Object.freeze([
    'food_apple',
    'food_banana',
    'food_pear',
    'food_strawberry',
    'hazard_bomb',
    'hazard_fire',
    // Approved exact Arcade P0 non-food masters. These stay separate from
    // generic hazard keys so a missing asset cannot mask another role.
    'arcade_heart_red', 'arcade_heart_blue',
    'arcade_hazard_bomb', 'arcade_hazard_fire', 'arcade_hazard_caution',
    'arcade_pickup_sun', 'arcade_pickup_syringe', 'arcade_pickup_gift',
    'arcade_powerup_candy_shield', 'arcade_powerup_candy_time', 'arcade_powerup_candy_royal',
    'arcade_powerup_candy_haste', 'arcade_powerup_candy_magnet', 'arcade_powerup_candy_star',
    'arcade_powerup_candy_sword', 'arcade_powerup_candy_portal',
  ]);

  const RUN_PRELOAD_CONCURRENCY = 6;

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function loadedImage(value) {
    return typeof HTMLImageElement !== 'undefined'
      && value instanceof HTMLImageElement
      && value.complete
      && value.naturalWidth > 0
      && value.naturalHeight > 0;
  }

  function dispatchAssetEvent(name, detail) {
    if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
  }

  function collectSources() {
    const sources = [];
    const add = (item, group) => {
      if (item && item.assetKey && item.src) sources.push({
        assetKey: item.assetKey,
        src: item.src,
        group: item.group || group,
        contentId: item.contentId || null,
        targetId: item.targetId || null,
      });
    };
    if (typeof CHARACTER_DATA !== 'undefined') CHARACTER_DATA.forEach(item => add(item, 'character'));
    const cosmeticDefinitions = typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getAllCosmeticDefinitions === 'function'
      ? ContentAssetResolver.getAllCosmeticDefinitions()
      : (typeof COSMETIC_DATA !== 'undefined' ? COSMETIC_DATA : []);
    cosmeticDefinitions.forEach(item => add(item, item.generatedContent ? 'generated-content' : 'cosmetic'));
    if (typeof ITEM_SHOP_DATA !== 'undefined') ITEM_SHOP_DATA.forEach(item => add(item, 'shop'));
    if (typeof FOOD_ASSET_MAP !== 'undefined') Object.values(FOOD_ASSET_MAP).forEach(item => add(item, 'food'));
    if (typeof BOMB_ASSET_MAP !== 'undefined') Object.values(BOMB_ASSET_MAP).forEach(item => add(item, 'hazard'));
    // Asset Factory v1: owner-approved canonical masters may serve multiple modes
    // through their own semantic bindings. Arcade keeps its existing runtime key
    // (for example `food_broccoli`) and never learns a file name or Infinite ID.
    if (typeof ArcadeAssetBindings !== 'undefined' && typeof ArcadeAssetBindings.list === 'function') {
      ArcadeAssetBindings.list().forEach(item => add(item, 'approved-theme-food'));
    }
    if (typeof ArcadeNonFoodAssetBindings !== 'undefined' && typeof ArcadeNonFoodAssetBindings.list === 'function') {
      ArcadeNonFoodAssetBindings.list().forEach(item => add(item, 'approved-theme-arcade-nonfood'));
    }
    if (typeof ArcadePowerupCandyBindings !== 'undefined' && typeof ArcadePowerupCandyBindings.list === 'function') {
      ArcadePowerupCandyBindings.list().forEach(item => add(item, 'approved-theme-arcade-powerup-candy'));
    }
    // Phase 3 generated source records are intentionally data-only. They are
    // available to the existing lazy loader now, while the Phase 4 resolver
    // decides when an equipped content item may request one at runtime.
    if (typeof ContentAssetSourceRegistry !== 'undefined' && typeof ContentAssetSourceRegistry.list === 'function') {
      ContentAssetSourceRegistry.list().forEach(item => add(item, 'generated-content'));
    }
    return sources;
  }

  function registerSources(options = {}) {
    // Data arrays are loaded before the boot call. Re-running is harmless and
    // picks up data-driven content added by development tools. Theme-bound food
    // sources are replaced as a group so an alternate theme cannot retain a
    // Froggy Feast image after a runtime theme change.
    if (options.replaceThemeBound) {
      Object.keys(registry).forEach(assetKey => {
        if (!['approved-theme-food', 'approved-theme-arcade-nonfood'].includes(registry[assetKey]?.group)) return;
        generations[assetKey] = (generations[assetKey] || 0) + 1;
        delete registry[assetKey];
        delete images[assetKey];
        delete pending[assetKey];
      });
    }
    collectSources().forEach(entry => {
      if (!registry[entry.assetKey] || entry.group === 'approved-theme-food') registry[entry.assetKey] = entry;
    });
    collected = true;
  }

  function syncThemeBoundSources() {
    registerSources({ replaceThemeBound: true });
  }

  function loadOne(assetKey) {
    if (pending[assetKey]) return pending[assetKey];
    if (loadedImage(images[assetKey])) return Promise.resolve(true);
    if (hasOwn(images, assetKey) && images[assetKey] === null) delete images[assetKey];
    if (!collected) registerSources();
    const entry = registry[assetKey];
    if (!entry || !entry.src || typeof Image === 'undefined') return Promise.resolve(false);

    const generation = (generations[assetKey] || 0) + 1;
    generations[assetKey] = generation;
    let request = null;
    request = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      let settled = false;

      const finish = (value, error = null) => {
        if (settled) return;
        settled = true;
        const currentEntry = registry[assetKey];
        const current = generations[assetKey] === generation && currentEntry?.src === entry.src;
        if (current) {
          images[assetKey] = loadedImage(value) ? value : null;
          if (loadedImage(value)) {
            delete failures[assetKey];
            dispatchAssetEvent('froggy:asset-ready', { assetKey, src: entry.src, width: value.naturalWidth, height: value.naturalHeight });
          } else {
            failures[assetKey] = { assetKey, src: entry.src, at: Date.now(), message: String(error?.message || error || 'Image failed to load or decode.') };
            dispatchAssetEvent('froggy:asset-load-failed', failures[assetKey]);
          }
        }
        if (pending[assetKey] === request) delete pending[assetKey];
        resolve(loadedImage(value));
      };

      image.addEventListener('load', async () => {
        try {
          if (typeof image.decode === 'function') await image.decode();
          if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
            throw new Error('Image decoded without drawable pixels.');
          }
          finish(image);
        } catch (error) {
          finish(null, error);
        }
      }, { once: true });
      image.addEventListener('error', () => finish(null, new Error(`Image request failed: ${entry.src}`)), { once: true });
      image.src = entry.src;
      if (image.complete && image.naturalWidth > 0) {
        Promise.resolve(typeof image.decode === 'function' ? image.decode() : undefined)
          .then(() => finish(image), error => finish(null, error));
      }
    });
    pending[assetKey] = request;
    return request;
  }
  function load(assetKey) {
    if (!assetKey) return Promise.resolve();
    return loadOne(String(assetKey));
  }

  function preload(keys = []) {
    if (!collected) registerSources();
    const unique = [...new Set(keys.filter(Boolean))];
    return Promise.all(unique.map(loadOne));
  }

  async function preloadLimited(keys = [], concurrency = RUN_PRELOAD_CONCURRENCY) {
    if (!collected) registerSources();
    const queue = [...new Set(keys.filter(Boolean))];
    const workerCount = Math.min(queue.length, Math.max(1, Math.floor(Number(concurrency) || 1)));
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < queue.length) {
        const assetKey = queue[nextIndex++];
        await loadOne(assetKey);
      }
    }
    await Promise.all(Array.from({ length: workerCount }, worker));
  }

  function preloadCritical(keys = CRITICAL_ARCADE_KEYS) {
    return preload(keys);
  }

  function preloadCharacter(characterId) {
    if (!collected) registerSources();
    const keys = [];
    if (typeof CHARACTER_DATA !== 'undefined') {
      const character = CHARACTER_DATA.find(item => item?.id === characterId);
      if (character?.assetKey) keys.push(character.assetKey);
    }
    const cosmeticDefinitions = typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getAllCosmeticDefinitions === 'function'
      ? ContentAssetResolver.getAllCosmeticDefinitions()
      : (typeof COSMETIC_DATA !== 'undefined' ? COSMETIC_DATA : []);
    // Applicability is a shop/menu concern, not a runtime preload rule. Loading
    // every cosmetic that *could* fit the selected character also pulled all
    // universal accessories and backgrounds into memory. Gameplay renders only
    // the equipped slot values, so preload exactly those; getImage() remains the
    // lazy safety net for a cosmetic equipped after this call.
    const equippedSlots = typeof SaveManager !== 'undefined' && typeof SaveManager.get === 'function'
      ? SaveManager.get()?.equippedCosmetics?.[characterId]
      : null;
    if (equippedSlots && typeof equippedSlots === 'object') {
      const byId = new Map(cosmeticDefinitions.map(item => [String(item?.id || ''), item]));
      [...new Set(Object.values(equippedSlots).map(String).filter(Boolean))].forEach(cosmeticId => {
        const item = byId.get(cosmeticId);
        if (item?.assetKey) keys.push(item.assetKey);
      });
    }
    return preload(keys);
  }

  function runFoodKeys(characterId) {
    // Modern Arcade exposes a compact character-specific menu. The full-game
    // legacy host still randomizes across its complete Arcade catalog, so use
    // that catalog as the safe fallback rather than allowing first-use flashes.
    let ids = [];
    if (typeof getArcadeActiveFoodIds === 'function') {
      ids = [...getArcadeActiveFoodIds(characterId)];
      if (typeof ARCADE_RARE_FOOD_IDS !== 'undefined') ids.push(...ARCADE_RARE_FOOD_IDS);
    } else if (typeof ARCADE_FOOD_DEFINITIONS !== 'undefined') {
      ids = ARCADE_FOOD_DEFINITIONS.map(item => item?.itemId).filter(Boolean);
    } else if (typeof FOOD_ASSET_MAP !== 'undefined') {
      return [...new Set(Object.values(FOOD_ASSET_MAP).map(item => item?.assetKey).filter(Boolean))];
    }
    if (typeof getArcadeFoodDef !== 'function') return [];
    return [...new Set(ids.map(itemId => getArcadeFoodDef(itemId)?.assetKey).filter(Boolean))];
  }

  function preloadRunFoods(characterId) {
    return preloadLimited(runFoodKeys(characterId));
  }

  // Food selection is randomized within the selected character's compact run
  // menu, so preloading only an arbitrary slice cannot guarantee Wave 1. Load
  // the same bounded active menu the run will use; the readiness gate still
  // hard-caps waiting at 520 ms and unfinished decodes continue in background.
  // This changes timing, not the run's eventual memory footprint.
  function runEssentialKeys(characterId) {
    return [...new Set([...CRITICAL_ARCADE_KEYS, ...runFoodKeys(characterId)])];
  }

  function preloadRunEssentials(mode, characterId) {
    return Promise.all([
      preloadForMode(mode),
      preloadCharacter(characterId),
      preloadLimited(runEssentialKeys(characterId), 5),
    ]);
  }

  function preloadForMode(mode) {
    if (mode === 'arcade' || mode === 'standard' || mode === 'tc' || mode === 'fmf' || mode === 'zen') return preloadCritical();
    // Puzzle and Feastfall currently own their dedicated imagery directly.
    // Their mode-start hooks load only the files each renderer actually uses.
    return Promise.resolve();
  }

  function preloadForRun(mode, characterId) {
    return Promise.all([
      preloadForMode(mode),
      preloadCharacter(characterId),
      preloadRunFoods(characterId),
    ]);
  }

  function init(options = {}) {
    registerSources();
    if (options.preloadCritical === false) return Promise.resolve();
    const tasks = [preloadCritical(options.criticalKeys || CRITICAL_ARCADE_KEYS)];
    if (options.characterId) tasks.push(preloadCharacter(options.characterId));
    return Promise.all(tasks);
  }

  function getImage(assetKey) {
    if (!assetKey) return null;
    if (!hasOwn(images, assetKey)) loadOne(assetKey);
    const value = images[assetKey];
    return loadedImage(value) ? value : null;
  }

  function isReady(assetKey) {
    return loadedImage(images[assetKey]);
  }

  function hasSource(assetKey) {
    if (!collected) registerSources();
    return Boolean(assetKey && registry[assetKey]?.src);
  }

  function listFailures() {
    return Object.values(failures).map(item => ({ ...item }));
  }

  function list() {
    if (!collected) registerSources();
    return Object.keys(registry).sort().map(key => ({
      key,
      src: registry[key].src,
      group: registry[key].group,
      status: loadedImage(images[key]) ? 'loaded' : hasOwn(images, key) ? 'failed' : pending[key] ? 'pending' : 'unloaded',
    }));
  }


  if (typeof window !== 'undefined') {
    window.addEventListener('froggy-theme-change', syncThemeBoundSources, { passive: true });
  }

  return {
    init,
    load,
    preload,
    preloadCritical,
    preloadCharacter,
    preloadRunFoods,
    preloadRunEssentials,
    preloadForMode,
    preloadForRun,
    getImage,
    isReady,
    hasSource,
    list,
    listFailures,
    syncThemeBoundSources,
  };
})();
