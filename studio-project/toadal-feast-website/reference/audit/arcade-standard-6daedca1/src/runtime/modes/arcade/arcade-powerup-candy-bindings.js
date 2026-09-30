// GENERATED FROM content/assets/arcade-powerup-candy-production-manifest.json — DO NOT EDIT.
// Run: npm run assets:generate

const ArcadePowerupCandyBindings = (() => {
  'use strict';
  const RUNTIME_ROOT = 'assets/themes/froggy-feast/arcade-powerup-candies-v1/runtime-max-256';
  const BINDINGS = Object.freeze([
  {
    "effectId": "doublePoints",
    "candyId": "royal",
    "playerLabel": "Royal Candy",
    "runtimeAssetKey": "arcade_powerup_candy_royal",
    "semanticAssetKey": "arcade.powerup.candy.royal",
    "runtimeTarget": "arcade.falling.powerup.doublePoints"
  },
  {
    "effectId": "magnet",
    "candyId": "magnet",
    "playerLabel": "Magnet Candy",
    "runtimeAssetKey": "arcade_powerup_candy_magnet",
    "semanticAssetKey": "arcade.powerup.candy.magnet",
    "runtimeTarget": "arcade.falling.powerup.magnet"
  },
  {
    "effectId": "piercing",
    "candyId": "sword",
    "playerLabel": "Sword Candy",
    "runtimeAssetKey": "arcade_powerup_candy_sword",
    "semanticAssetKey": "arcade.powerup.candy.sword",
    "runtimeTarget": "arcade.falling.powerup.piercing"
  },
  {
    "effectId": "scoreBoost",
    "candyId": "star",
    "playerLabel": "Star Candy",
    "runtimeAssetKey": "arcade_powerup_candy_star",
    "semanticAssetKey": "arcade.powerup.candy.star",
    "runtimeTarget": "arcade.falling.powerup.scoreBoost"
  },
  {
    "effectId": "shield",
    "candyId": "shield",
    "playerLabel": "Shield Candy",
    "runtimeAssetKey": "arcade_powerup_candy_shield",
    "semanticAssetKey": "arcade.powerup.candy.shield",
    "runtimeTarget": "arcade.falling.powerup.shield"
  },
  {
    "effectId": "slowFood",
    "candyId": "time",
    "playerLabel": "Time Candy",
    "runtimeAssetKey": "arcade_powerup_candy_time",
    "semanticAssetKey": "arcade.powerup.candy.time",
    "runtimeTarget": "arcade.falling.powerup.slowFood"
  },
  {
    "effectId": "speedBoost",
    "candyId": "haste",
    "playerLabel": "Haste Candy",
    "runtimeAssetKey": "arcade_powerup_candy_haste",
    "semanticAssetKey": "arcade.powerup.candy.haste",
    "runtimeTarget": "arcade.falling.powerup.speedBoost"
  },
  {
    "effectId": "vacuum",
    "candyId": "portal",
    "playerLabel": "Portal Candy",
    "runtimeAssetKey": "arcade_powerup_candy_portal",
    "semanticAssetKey": "arcade.powerup.candy.portal",
    "runtimeTarget": "arcade.falling.powerup.vacuum"
  }
]);
  const runtimePath = binding => `assets/themes/froggy-feast/arcade-powerup-candies-v1/runtime-max-256/${binding.runtimeAssetKey}.png`;
  function list(options = {}) {
    if (typeof AssetProvenanceRegistry === 'undefined' || typeof AssetProvenanceRegistry.resolve !== 'function') return [];
    return BINDINGS.map(binding => {
      const source = AssetProvenanceRegistry.resolve(binding.semanticAssetKey, options);
      if (!source?.sourcePath) return null;
      return Object.freeze({ ...binding, assetKey: binding.runtimeAssetKey, src: runtimePath(binding), masterSrc: source.sourcePath, group: 'approved-theme-arcade-powerup-candy', sourceAssetKey: binding.semanticAssetKey });
    }).filter(Boolean);
  }
  function get(effectId, options = {}) {
    const binding = BINDINGS.find(item => item.effectId === String(effectId || ''));
    if (!binding || typeof AssetProvenanceRegistry === 'undefined' || typeof AssetProvenanceRegistry.resolve !== 'function') return null;
    const source = AssetProvenanceRegistry.resolve(binding.semanticAssetKey, options);
    return source?.sourcePath ? Object.freeze({ ...binding, assetKey: binding.runtimeAssetKey, src: runtimePath(binding), masterSrc: source.sourcePath, group: 'approved-theme-arcade-powerup-candy', sourceAssetKey: binding.semanticAssetKey }) : null;
  }
  return Object.freeze({ RUNTIME_ROOT, BINDINGS, runtimePath, list, get });
})();
if (typeof globalThis !== 'undefined') globalThis.ArcadePowerupCandyBindings = ArcadePowerupCandyBindings;
