// GENERATED FROM content/assets/arcade-p0-nonfood-production-manifest.json — DO NOT EDIT.
// Run: npm run assets:arcade-nonfood-bindings
// Exact approved masters remain provenance authority; gameplay uses compact derivatives.

const ArcadeNonFoodAssetBindings = (() => {
  'use strict';
  const RUNTIME_ROOT = 'assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/runtime-max-256';
  const BINDINGS = Object.freeze([
  {
    "visualKey": "hazard.bomb",
    "runtimeAssetKey": "arcade_hazard_bomb",
    "semanticAssetKey": "arcade.hazard.bomb",
    "runtimeTarget": "arcade.falling.hazard.bomb",
    "subject": "bomb hazard"
  },
  {
    "visualKey": "hazard.caution",
    "runtimeAssetKey": "arcade_hazard_caution",
    "semanticAssetKey": "arcade.hazard.caution",
    "runtimeTarget": "arcade.falling.hazard.caution",
    "subject": "caution hazard"
  },
  {
    "visualKey": "hazard.fire",
    "runtimeAssetKey": "arcade_hazard_fire",
    "semanticAssetKey": "arcade.hazard.fire",
    "runtimeTarget": "arcade.falling.hazard.fire",
    "subject": "fire hazard"
  },
  {
    "visualKey": "heart.blue",
    "runtimeAssetKey": "arcade_heart_blue",
    "semanticAssetKey": "arcade.pickup.heart.blue",
    "runtimeTarget": "arcade.falling.heart.blue",
    "subject": "blue heart pickup"
  },
  {
    "visualKey": "heart.red",
    "runtimeAssetKey": "arcade_heart_red",
    "semanticAssetKey": "arcade.pickup.heart.red",
    "runtimeTarget": "arcade.falling.heart.red",
    "subject": "red heart pickup"
  },
  {
    "visualKey": "pickup.gift",
    "runtimeAssetKey": "arcade_pickup_gift",
    "semanticAssetKey": "arcade.pickup.gift",
    "runtimeTarget": "arcade.falling.gift",
    "subject": "gift box pickup"
  },
  {
    "visualKey": "pickup.sun",
    "runtimeAssetKey": "arcade_pickup_sun",
    "semanticAssetKey": "arcade.pickup.sun",
    "runtimeTarget": "arcade.falling.sun",
    "subject": "sun bonus pickup"
  },
  {
    "visualKey": "pickup.syringe",
    "runtimeAssetKey": "arcade_pickup_syringe",
    "semanticAssetKey": "arcade.pickup.syringe",
    "runtimeTarget": "arcade.falling.syringe",
    "subject": "syringe pickup"
  }
]);
  const runtimePath = binding => `assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/runtime-max-256/${binding.runtimeAssetKey}.png`;
  function list(options = {}) {
    if (typeof AssetProvenanceRegistry === 'undefined' || !AssetProvenanceRegistry?.resolve) return [];
    return BINDINGS.map(binding => {
      const source = AssetProvenanceRegistry.resolve(binding.semanticAssetKey, options);
      if (!source?.sourcePath) return null;
      return Object.freeze({ ...binding, assetKey: binding.runtimeAssetKey, src: runtimePath(binding), masterSrc: source.sourcePath, group: 'approved-theme-arcade-nonfood', sourceAssetKey: binding.semanticAssetKey });
    }).filter(Boolean);
  }
  function get(visualKey, options = {}) {
    const binding = BINDINGS.find(item => item.visualKey === String(visualKey || ''));
    if (!binding || typeof AssetProvenanceRegistry === 'undefined' || !AssetProvenanceRegistry?.resolve) return null;
    const source = AssetProvenanceRegistry.resolve(binding.semanticAssetKey, options);
    return source?.sourcePath ? Object.freeze({ ...binding, assetKey: binding.runtimeAssetKey, src: runtimePath(binding), masterSrc: source.sourcePath, group: 'approved-theme-arcade-nonfood', sourceAssetKey: binding.semanticAssetKey }) : null;
  }
  return Object.freeze({ RUNTIME_ROOT, BINDINGS, runtimePath, list, get });
})();
if (typeof globalThis !== 'undefined') globalThis.ArcadeNonFoodAssetBindings = ArcadeNonFoodAssetBindings;
