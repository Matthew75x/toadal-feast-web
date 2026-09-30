// ============================================================
// src/runtime/shared/theme-composition-resolver.js — Theme default content precedence
// ============================================================
// Phase 13.3 bridge above ContentRegistry / ContentAssetResolver.
// Themes select only validated published content through target IDs; this file
// never changes gameplay, source asset paths, saves, or renderer fallback code.
//
// Resolution order:
//   player equipment (only when the target policy permits it)
//     → active theme default content
//     → native/default content
//     → native renderer fallback

const ThemeCompositionResolver = (() => {
  'use strict';

  const POLICIES = Object.freeze({
    PLAYER_CUSTOMIZABLE: 'player-customizable',
    THEME_FIXED: 'theme-fixed',
    NATIVE_ONLY: 'native-only',
  });

  function currentThemeId() {
    if (typeof ThemeSystem !== 'undefined' && typeof ThemeSystem.current === 'function') {
      return String(ThemeSystem.current()?.id || '');
    }
    return typeof ThemeCoverageRegistry !== 'undefined' ? String(ThemeCoverageRegistry.defaultThemeId || '') : '';
  }

  function coverageFor(themeId = currentThemeId()) {
    if (typeof ThemeCoverageRegistry !== 'undefined' && typeof ThemeCoverageRegistry.get === 'function') {
      return ThemeCoverageRegistry.get(themeId);
    }
    const registry = typeof FROGGY_THEME_COVERAGE_REGISTRY !== 'undefined'
      ? FROGGY_THEME_COVERAGE_REGISTRY
      : null;
    const themes = Array.isArray(registry?.themes) ? registry.themes : [];
    return themes.find(theme => theme.id === themeId)
      || themes.find(theme => theme.id === registry?.defaultThemeId)
      || null;
  }

  function bindingFor(targetId, themeId = currentThemeId()) {
    const target = String(targetId || '');
    if (!target) return null;
    const composition = coverageFor(themeId)?.composition || null;
    const binding = composition?.visualBindings?.[Object.keys(composition?.visualBindings || {}).find(role => (
      composition.visualBindings[role]?.targetId === target
    ))];
    return binding || null;
  }

  function policyFor(targetId, themeId = currentThemeId()) {
    return bindingFor(targetId, themeId)?.selectionPolicy || POLICIES.PLAYER_CUSTOMIZABLE;
  }

  function defaultContentId(targetId, themeId = currentThemeId()) {
    const target = String(targetId || '');
    if (!target) return '';
    return String(coverageFor(themeId)?.composition?.contentDefaults?.[target] || '');
  }

  function canUsePlayerEquipment(targetId, themeId = currentThemeId()) {
    return policyFor(targetId, themeId) === POLICIES.PLAYER_CUSTOMIZABLE;
  }

  function resolveExplicitEquipment(request, themeId) {
    if (!canUsePlayerEquipment(request.targetId, themeId)) return null;
    if (typeof ContentAssetResolver === 'undefined') return null;
    const contentId = typeof ContentAssetResolver.getEquippedContentId === 'function'
      ? ContentAssetResolver.getEquippedContentId({
        targetId: request.targetId,
        subjectId: request.subjectId,
        save: request.save,
      })
      : '';
    if (!contentId || typeof ContentAssetResolver.resolveAsset !== 'function') return null;
    const asset = ContentAssetResolver.resolveAsset({ ...request, contentId });
    return asset ? { source: 'player-equipment', contentId, asset } : null;
  }

  function resolveThemeDefault(request, themeId) {
    const policy = policyFor(request.targetId, themeId);
    if (policy === POLICIES.NATIVE_ONLY || typeof ContentAssetResolver === 'undefined') return null;
    const contentId = defaultContentId(request.targetId, themeId);
    if (!contentId || typeof ContentAssetResolver.resolveAsset !== 'function') return null;
    const asset = ContentAssetResolver.resolveAsset({ ...request, contentId });
    return asset ? { source: 'theme-default', contentId, asset } : null;
  }

  function resolveAsset(request = {}) {
    const targetId = String(request.targetId || '');
    if (!targetId) return null;
    const themeId = String(request.themeId || currentThemeId());
    const explicit = resolveExplicitEquipment({ ...request, targetId }, themeId);
    if (explicit) return { ...explicit.asset, themeId, selectionSource: explicit.source, selectionPolicy: policyFor(targetId, themeId) };
    const themed = resolveThemeDefault({ ...request, targetId }, themeId);
    if (themed) return { ...themed.asset, themeId, selectionSource: themed.source, selectionPolicy: policyFor(targetId, themeId) };
    return null;
  }

  /**
   * Mirrors ContentAssetResolver.drawOrFallback while preserving the exact
   * native fallback path. Render adapters can adopt this without learning
   * theme JSON, content schemas, or save details.
   */
  function drawOrFallback(request = {}) {
    const asset = request.asset || resolveAsset(request);
    if (asset && typeof request.drawAsset === 'function') {
      try {
        if (request.drawAsset(asset, request) !== false) {
          return { drawn: true, usedContent: true, asset, selectionSource: asset.selectionSource || 'theme-default' };
        }
      } catch (error) {
        console.warn(`[ThemeCompositionResolver] Could not draw ${asset.itemId || asset.contentId || 'theme content'} on ${asset.targetId || request.targetId}:`, error);
      }
    }
    if (typeof request.drawFallback === 'function') {
      request.drawFallback(request);
      return { drawn: true, usedContent: false, asset: null, selectionSource: 'native-fallback' };
    }
    return { drawn: false, usedContent: false, asset: null, selectionSource: 'native-fallback' };
  }

  function presentationSlot(slotId, themeId = currentThemeId()) {
    const slot = String(slotId || '');
    if (!slot) return null;
    const surface = coverageFor(themeId)?.surfaces?.find(entry => entry.id === slot) || null;
    if (!surface) return null;
    return Object.freeze({
      id: surface.id,
      status: surface.status,
      fallback: surface.fallback || null,
      themeId: String(themeId || currentThemeId()),
      ready: surface.status === 'ready',
    });
  }

  function coverage(themeId = currentThemeId()) {
    return coverageFor(themeId);
  }

  return Object.freeze({
    POLICIES,
    currentThemeId,
    coverage,
    bindingFor,
    policyFor,
    defaultContentId,
    canUsePlayerEquipment,
    resolveAsset,
    drawOrFallback,
    presentationSlot,
  });
})();
