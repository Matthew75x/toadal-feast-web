// ============================================================
// src/runtime/shared/content-asset-resolver.js — Generated content / approved native cosmetic bridge
// ============================================================
// Data and equipment resolution only. Production renderer adapters call the
// public APIs below; this module never mutates gameplay state or evaluates
// executable behavior from content JSON.

const ContentAssetResolver = (() => {
  const TARGET_EQUIPMENT_KEY = '__contentTargets';

  function clone(value) {
    return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
  }

  function isGeneratedContentEnabled() {
    if (typeof ContentRolloutConfig !== 'undefined'
      && typeof ContentRolloutConfig.isGeneratedContentEnabled === 'function') {
      return ContentRolloutConfig.isGeneratedContentEnabled();
    }
    if (typeof globalThis !== 'undefined' && globalThis.USE_GENERATED_CONTENT_REGISTRY === false) return false;
    if (typeof window !== 'undefined' && window.USE_GENERATED_CONTENT_REGISTRY === false) return false;
    return true;
  }

  function canonicalContentId(id) {
    const requested = String(id || '');
    if (typeof ContentLegacySaveIdMap !== 'undefined'
      && typeof ContentLegacySaveIdMap.resolve === 'function') {
      return String(ContentLegacySaveIdMap.resolve(requested) || requested);
    }
    return requested;
  }

  function legacyDefinitions() {
    return typeof COSMETIC_DATA !== 'undefined' && Array.isArray(COSMETIC_DATA)
      ? COSMETIC_DATA
      : [];
  }

  function generatedItems() {
    if (!isGeneratedContentEnabled()) return [];
    return typeof ContentRegistry !== 'undefined' && typeof ContentRegistry.list === 'function'
      ? ContentRegistry.list()
      : [];
  }

  function generatedSources(contentId) {
    return typeof ContentAssetSourceRegistry !== 'undefined' && typeof ContentAssetSourceRegistry.listForContent === 'function'
      ? ContentAssetSourceRegistry.listForContent(contentId)
      : [];
  }

  function currentSave(explicitSave = null) {
    if (explicitSave && typeof explicitSave === 'object') return explicitSave;
    return typeof SaveManager !== 'undefined' && typeof SaveManager.get === 'function'
      ? SaveManager.get()
      : null;
  }

  function typeFor(item) {
    if (item?.cosmetic?.slot === 'background') return 'background';
    if (item?.cosmetic?.type === 'skin') return 'skin';
    return 'accessory';
  }

  function definitionFromItem(item) {
    if (!item || !item.id || !item.cosmetic || !Array.isArray(item.bindings) || !item.bindings.length) return null;
    const sources = generatedSources(item.id);
    const primaryBinding = item.bindings[0];
    const sourceFor = binding => sources.find(entry => entry.targetId === binding.targetId
      && entry.assetRole === binding.assetRole)
      || null;
    const source = sourceFor(primaryBinding) || sources[0] || null;
    const targetBindings = item.bindings.map(binding => {
      const bindingSource = sourceFor(binding);
      return {
        ...binding,
        assetKey: binding.assetKey || bindingSource?.assetKey || null,
        src: binding.src || bindingSource?.src || null,
        thumbnail: binding.thumbnail || bindingSource?.thumbnail || null,
      };
    });
    const effects = Array.isArray(item.cosmetic.effects) ? item.cosmetic.effects : [];
    return {
      id: item.id,
      type: typeFor(item),
      slot: item.cosmetic.slot,
      cosmeticKind: item.cosmetic.type,
      assetKey: source?.assetKey || primaryBinding.assetKey || null,
      src: source?.src || primaryBinding.src || null,
      thumbnail: source?.thumbnail || primaryBinding.thumbnail || null,
      name: String(item.display?.name || item.id),
      visualKind: String(item.display?.visualKind || item.cosmetic?.visualKind || 'content'),
      accent: String(item.display?.accent || item.cosmetic?.accent || '#79b6d8'),
      desc: String(item.display?.description || ''),
      applicableTo: Array.isArray(item.cosmetic.applicableTo) ? [...item.cosmetic.applicableTo] : ['all'],
      coinCost: item.unlock?.kind === 'coins' ? Number(item.unlock.coinCost || 0) : 0,
      isBg: item.cosmetic.slot === 'background',
      blocks: Array.isArray(item.cosmetic.blocks) ? [...item.cosmetic.blocks] : [],
      presentation: clone(item.cosmetic.presentation || {
        mode: item.cosmetic.slot === 'background' ? 'background' : 'overlay',
        anchorSlot: item.cosmetic.slot,
        sizeScale: 1,
      }),
      effectIds: [...effects],
      generatedContent: true,
      contentItemId: item.id,
      targetBindings,
      unlock: clone(item.unlock || { kind: 'invalid' }),
      effects: [...effects],
    };
  }

  function getAllCosmeticDefinitions() {
    const legacy = legacyDefinitions();
    const ids = new Set(legacy.map(item => item.id));
    const generated = generatedItems()
      .map(definitionFromItem)
      .filter(Boolean)
      // A generated item must never silently shadow a released legacy ID.
      .filter(item => !ids.has(item.id));
    return [...legacy, ...generated];
  }

  function getCosmeticDefinition(id) {
    const requested = String(id || '');
    // Current approved native definitions keep priority. If a
    // future migration retires one, the durable save-ID map can resolve old
    // saved IDs to its generated replacement without rewriting the save.
    const legacy = legacyDefinitions().find(item => item.id === requested);
    if (legacy) return legacy;
    const canonical = canonicalContentId(requested);
    return getAllCosmeticDefinitions().find(item => item.id === canonical) || null;
  }

  function listGeneratedCosmetics() {
    return getAllCosmeticDefinitions().filter(item => item.generatedContent === true);
  }

  function bindingFor(item, targetId) {
    const requested = String(targetId || '');
    return (item?.targetBindings || []).find(entry => entry.targetId === requested) || null;
  }

  function appliesToSubject(item, subjectId) {
    const subject = String(subjectId || '');
    if (!subject) return true;
    const applicable = Array.isArray(item?.applicableTo) ? item.applicableTo : [];
    return applicable.includes('all') || applicable.includes(subject);
  }

  function isUnlocked(item, save) {
    return typeof ContentUnlockResolver === 'undefined'
      || typeof ContentUnlockResolver.isUnlocked !== 'function'
      || ContentUnlockResolver.isUnlocked(item, save);
  }

  function explicitTargetEquipment(targetId, save) {
    const map = save?.equippedCosmetics?.[TARGET_EQUIPMENT_KEY];
    return map && typeof map === 'object' ? String(map[targetId] || '') : '';
  }

  function subjectEquipment(subjectId, targetId, save) {
    const subject = String(subjectId || '');
    if (!subject) return '';
    const slots = save?.equippedCosmetics?.[subject];
    if (!slots || typeof slots !== 'object') return '';
    return Object.values(slots).map(value => String(value || '')).find(contentId => {
      const item = getCosmeticDefinition(contentId);
      return Boolean(item?.generatedContent && bindingFor(item, targetId) && appliesToSubject(item, subject));
    }) || '';
  }

  /**
   * Resolve the generated content currently equipped for a target. Target
   * equipment uses the existing equippedCosmetics object under an isolated
   * reserved key, preserving the save's public shape and old cosmetic slots.
   */
  function getEquippedContentId(request = {}) {
    if (!isGeneratedContentEnabled()) return '';
    const targetId = String(request.targetId || '');
    if (!targetId) return '';
    const save = currentSave(request.save);
    const direct = String(request.contentId || request.cosmeticId || '');
    if (direct) return direct;
    const explicitlyEquipped = explicitTargetEquipment(targetId, save);
    if (explicitlyEquipped) return explicitlyEquipped;
    return subjectEquipment(request.subjectId, targetId, save);
  }

  function resolveAsset(request = {}) {
    if (!isGeneratedContentEnabled()) return null;
    const contentId = String(request.contentId || request.cosmeticId || '');
    const targetId = String(request.targetId || '');
    const item = getCosmeticDefinition(contentId);
    if (!item?.generatedContent || !targetId || !appliesToSubject(item, request.subjectId)) return null;

    const save = currentSave(request.save);
    if (!isUnlocked(item, save)) return null;

    const binding = bindingFor(item, targetId);
    if (!binding?.assetKey) return null;

    // AssetManager is deliberately lazy. Request the image on first use, but
    // return null until it has decoded so a renderer can keep its native art.
    if (typeof AssetManager === 'undefined') return null;
    if (typeof AssetManager.load === 'function') AssetManager.load(binding.assetKey);
    const image = typeof AssetManager.getImage === 'function' ? AssetManager.getImage(binding.assetKey) : null;
    if (!image) return null;

    return {
      itemId: item.id,
      targetId,
      assetKey: binding.assetKey,
      image,
      anchor: binding.anchor ? { ...binding.anchor } : null,
      scale: Number(binding.scale || 1),
      assetRole: binding.assetRole,
      animationCoverage: Array.isArray(binding.animationCoverage) ? [...binding.animationCoverage] : [],
    };
  }

  function resolveEquippedAsset(request = {}) {
    const contentId = getEquippedContentId(request);
    return contentId ? resolveAsset({ ...request, contentId }) : null;
  }

  /**
   * Execute a visual replacement when it is decoded and valid, otherwise call
   * the supplied native fallback. The return value always states whether the
   * replacement was actually used, so callers cannot suppress native art by
   * accident while an asset is loading or invalid.
   */
  function drawOrFallback(request = {}) {
    const asset = request.asset || (request.contentId || request.cosmeticId
      ? resolveAsset(request)
      : resolveEquippedAsset(request));
    if (asset && typeof request.drawAsset === 'function') {
      try {
        if (request.drawAsset(asset, request) !== false) {
          return { drawn: true, usedContent: true, asset };
        }
      } catch (error) {
        console.warn(`[ContentAssetResolver] Could not draw ${asset.itemId} on ${asset.targetId}:`, error);
      }
    }
    if (typeof request.drawFallback === 'function') {
      request.drawFallback(request);
      return { drawn: true, usedContent: false, asset: null };
    }
    return { drawn: false, usedContent: false, asset: null };
  }

  /** Programmatic hook for the future Ship Wizard and test tools. */
  function equipTarget(contentId, targetId, options = {}) {
    if (!isGeneratedContentEnabled()) return false;
    const item = getCosmeticDefinition(contentId);
    const target = String(targetId || '');
    const save = currentSave(options.save);
    if (!item?.generatedContent || !target || !bindingFor(item, target) || !isUnlocked(item, save)) return false;
    const write = data => {
      if (!data.equippedCosmetics || typeof data.equippedCosmetics !== 'object') data.equippedCosmetics = {};
      if (!data.equippedCosmetics[TARGET_EQUIPMENT_KEY] || typeof data.equippedCosmetics[TARGET_EQUIPMENT_KEY] !== 'object') {
        data.equippedCosmetics[TARGET_EQUIPMENT_KEY] = {};
      }
      data.equippedCosmetics[TARGET_EQUIPMENT_KEY][target] = item.id;
    };
    if (typeof SaveManager !== 'undefined' && typeof SaveManager.set === 'function' && !options.save) {
      SaveManager.set(write);
    } else if (save) {
      write(save);
    } else {
      return false;
    }
    return true;
  }

  function unequipTarget(targetId, options = {}) {
    if (!isGeneratedContentEnabled()) return false;
    const target = String(targetId || '');
    if (!target) return false;
    const save = currentSave(options.save);
    const write = data => {
      const map = data?.equippedCosmetics?.[TARGET_EQUIPMENT_KEY];
      if (!map || typeof map !== 'object' || !Object.prototype.hasOwnProperty.call(map, target)) return false;
      delete map[target];
      return true;
    };
    if (typeof SaveManager !== 'undefined' && typeof SaveManager.set === 'function' && !options.save) {
      let changed = false;
      SaveManager.set(data => { changed = write(data); });
      return changed;
    }
    return Boolean(save && write(save));
  }

  return Object.freeze({
    TARGET_EQUIPMENT_KEY,
    isGeneratedContentEnabled,
    getAllCosmeticDefinitions,
    getCosmeticDefinition,
    listGeneratedCosmetics,
    getEquippedContentId,
    resolveAsset,
    resolveEquippedAsset,
    drawOrFallback,
    equipTarget,
    unequipTarget,
  });
})();
