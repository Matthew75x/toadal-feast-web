// ============================================================
// src/runtime/shared/content-unlock-resolver.js — Data-driven content unlock decisions
// ============================================================
// Load order: after generated content registries, before AssetManager and
// progression/cosmetics consumers. This module intentionally owns no save
// fields: generated content reuses unlockedCosmetics/equippedCosmetics so
// existing save data remains compatible.

const ContentUnlockResolver = (() => {
  const KNOWN_UNLOCKS = Object.freeze(['default', 'coins', 'achievement', 'rewardPool', 'entitlement']);
  // Platform-owned entitlement IDs that are installed independently of generated
  // cosmetic/content entries. New commercial ownership IDs must be installed in
  // shipped content (ContentRegistry) or deliberately added here by owner code;
  // remote storefront data cannot invent them.
  const PLATFORM_ENTITLEMENTS = Object.freeze(['no-ads']);

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function isGenerated(item) {
    return !!item && item.generatedContent === true;
  }

  function compatibleSaveIds(item) {
    const canonical = String(item?.id || '');
    if (!canonical) return [];
    const ids = new Set([canonical]);
    if (typeof ContentLegacySaveIdMap !== 'undefined'
      && typeof ContentLegacySaveIdMap.legacyIdsFor === 'function') {
      ContentLegacySaveIdMap.legacyIdsFor(canonical).forEach(id => ids.add(String(id || '')));
    }
    return [...ids].filter(Boolean);
  }

  function savedAsUnlocked(item, save) {
    const unlocked = array(save?.unlockedCosmetics);
    return compatibleSaveIds(item).some(id => unlocked.includes(id));
  }

  function unlockKind(item) {
    if (!isGenerated(item)) return 'legacy';
    const kind = String(item?.unlock?.kind || '');
    return KNOWN_UNLOCKS.includes(kind) ? kind : 'invalid';
  }

  function installedEntitlementIds() {
    const ids = new Set(PLATFORM_ENTITLEMENTS);
    if (typeof ContentRegistry !== 'undefined' && typeof ContentRegistry.listForUnlock === 'function') {
      for (const item of ContentRegistry.listForUnlock('entitlement')) {
        const id = String(item?.unlock?.entitlementId || '');
        if (id) ids.add(id);
      }
    }
    return [...ids].sort();
  }

  function knowsEntitlement(entitlementId) {
    const id = String(entitlementId || '');
    return !!id && installedEntitlementIds().includes(id);
  }

  function isUnlocked(item, save) {
    if (!item) return false;
    const unlocked = array(save?.unlockedCosmetics);
    if (!isGenerated(item)) {
      // Preserve legacy behavior exactly: zero-cost cosmetics are available
      // by default; paid cosmetics use the existing unlockedCosmetics array.
      return !Number(item.coinCost || 0) || unlocked.includes(item.id);
    }

    switch (unlockKind(item)) {
      case 'default':
        return true;
      case 'coins':
      case 'rewardPool':
        return savedAsUnlocked(item, save);
      case 'achievement':
        return array(save?.achievements).includes(item?.unlock?.achievementId);
      case 'entitlement': {
        // EC-2.5: per-item durable ownership from the shared save's
        // entitlements map (granted only through GrantService — billing
        // receipts, restores, or explicit owner grants). Fail closed when
        // the item names no installed entitlement id or the map is absent.
        const entitlementId = String(item?.unlock?.entitlementId || '');
        if (!knowsEntitlement(entitlementId)) return false;
        const owned = save?.entitlements && typeof save.entitlements === 'object' ? save.entitlements : {};
        return !!owned[entitlementId];
      }
      default:
        return false;
    }
  }

  function canPurchase(item, save) {
    if (!item || isUnlocked(item, save)) return false;
    if (!isGenerated(item)) return Number.isInteger(item.coinCost) && item.coinCost > 0;
    return unlockKind(item) === 'coins' && Number.isInteger(item?.unlock?.coinCost) && item.unlock.coinCost > 0;
  }

  function getCoinCost(item) {
    if (!item) return null;
    if (!isGenerated(item)) {
      const cost = Number(item.coinCost || 0);
      return Number.isFinite(cost) && cost > 0 ? cost : null;
    }
    if (unlockKind(item) !== 'coins') return null;
    const cost = Number(item?.unlock?.coinCost || 0);
    return Number.isFinite(cost) && cost > 0 ? cost : null;
  }

  function isGiftEligible(item, save, rewardPoolId = 'gift-box') {
    if (!item || isUnlocked(item, save)) return false;
    if (!isGenerated(item)) return true;
    return unlockKind(item) === 'rewardPool' && String(item?.unlock?.rewardPoolId || '') === String(rewardPoolId || 'gift-box');
  }

  function getUnlockLabel(item) {
    if (!item) return 'Unavailable';
    if (!isGenerated(item)) {
      const cost = getCoinCost(item);
      return cost ? `Cost: ${cost}` : 'Included';
    }
    switch (unlockKind(item)) {
      case 'default': return 'Included';
      case 'coins': return `Cost: ${item.unlock.coinCost}`;
      case 'achievement': return 'Achievement unlock';
      case 'rewardPool': return 'Reward pool unlock';
      case 'entitlement': return knowsEntitlement(item?.unlock?.entitlementId) ? 'Store entitlement required' : 'Unavailable';
      default: return 'Unavailable';
    }
  }

  return Object.freeze({
    knownUnlocks: [...KNOWN_UNLOCKS],
    platformEntitlements: [...PLATFORM_ENTITLEMENTS],
    installedEntitlementIds,
    knowsEntitlement,
    isGenerated,
    compatibleSaveIds,
    unlockKind,
    isUnlocked,
    canPurchase,
    getCoinCost,
    isGiftEligible,
    getUnlockLabel,
  });
})();
