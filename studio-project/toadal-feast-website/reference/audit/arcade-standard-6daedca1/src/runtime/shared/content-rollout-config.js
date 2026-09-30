// ============================================================
// src/runtime/shared/content-rollout-config.js — Generated-content rollout switch
// ============================================================
// This is a one-release-cycle compatibility safeguard. An integrator may set
// window.USE_GENERATED_CONTENT_REGISTRY = false *before* this file loads to
// disable generated content for the current page. Legacy cosmetics, native
// renderer fallbacks, and all saved IDs remain untouched.

const ContentRolloutConfig = (() => {
  const DEFAULT_GENERATED_CONTENT_ENABLED = true;

  function isGeneratedContentEnabled() {
    if (typeof globalThis !== 'undefined' && typeof globalThis.USE_GENERATED_CONTENT_REGISTRY === 'boolean') {
      return globalThis.USE_GENERATED_CONTENT_REGISTRY;
    }
    if (typeof window !== 'undefined' && typeof window.USE_GENERATED_CONTENT_REGISTRY === 'boolean') {
      return window.USE_GENERATED_CONTENT_REGISTRY;
    }
    return DEFAULT_GENERATED_CONTENT_ENABLED;
  }

  function modeLabel() {
    return isGeneratedContentEnabled() ? 'generated-content-enabled' : 'legacy-fallback-only';
  }

  return Object.freeze({
    defaultGeneratedContentEnabled: DEFAULT_GENERATED_CONTENT_ENABLED,
    isGeneratedContentEnabled,
    modeLabel,
  });
})();
