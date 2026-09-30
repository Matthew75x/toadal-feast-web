// ============================================================
// src/runtime/ui/ui-authority-runtime.js — Froggy UI v2 presentation guard
// ============================================================
// Presentation-only. Protects card scrolling, current-art fallback behavior,
// and explicit player/direct/dev authority metadata without changing mode logic.

const FroggyUIAuthority = (() => {
  'use strict';
  const DRAG_THRESHOLD = 10;
  const CLICK_SUPPRESS_MS = 450;
  const tracked = new WeakMap();

  function markMissingArt(img) {
    const card = img?.closest?.('.ff-v2-mode-card,.ff-v2-variant,.ff-qa-art-card,.ff-qa-shell-hero');
    if (!card) return;
    card.classList.add('ff-v2-art-missing');
    if (!card.dataset.fallbackLabel) {
      const owner = card.closest('button,[aria-label]') || card;
      const label = owner.getAttribute?.('aria-label') || owner.textContent || 'TOADAL FEAST!';
      card.dataset.fallbackLabel = String(label).split(/[—·]/)[0].trim().slice(0, 42);
    }
  }

  function markLoadedArt(img) {
    img?.closest?.('.ff-v2-mode-card,.ff-v2-variant,.ff-qa-art-card,.ff-qa-shell-hero')?.classList.remove('ff-v2-art-missing');
  }

  function wireArtFallbacks(root = document) {
    root.querySelectorAll('.ff-v2-mode-art,.ff-v2-variant-art,.ff-qa-card-art,.ff-qa-hero-art').forEach(img => {
      if (img.dataset.ffAuthorityBound === '1') return;
      img.dataset.ffAuthorityBound = '1';
      img.addEventListener('error', () => markMissingArt(img));
      img.addEventListener('load', () => markLoadedArt(img));
      if (img.complete && img.naturalWidth === 0) markMissingArt(img);
    });
  }

  function wireTapGuard(card) {
    if (!card || card.dataset.ffTapGuard === '1') return;
    card.dataset.ffTapGuard = '1';
    card.style.touchAction = 'pan-y';

    card.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      tracked.set(card, {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        suppressUntil: 0,
      });
    }, { passive: true });

    card.addEventListener('pointermove', event => {
      const state = tracked.get(card);
      if (!state || state.pointerId !== event.pointerId || state.moved) return;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) state.moved = true;
    }, { passive: true });

    const finish = event => {
      const state = tracked.get(card);
      if (!state || state.pointerId !== event.pointerId) return;
      if (state.moved) state.suppressUntil = performance.now() + CLICK_SUPPRESS_MS;
      state.pointerId = null;
    };
    card.addEventListener('pointerup', finish, { passive: true });
    card.addEventListener('pointercancel', finish, { passive: true });

    card.addEventListener('click', event => {
      const state = tracked.get(card);
      if (!state || state.suppressUntil <= performance.now()) return;
      state.suppressUntil = 0;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function wireCardTapGuards(root = document) {
    root.querySelectorAll('.ff-v2-mode-card,.ff-v2-variant,.ff-qa-art-card').forEach(wireTapGuard);
  }

  function ensureAuthorityMetadata() {
    const body = document.body;
    if (!body) return;
    if (!body.dataset.surfaceClass) body.dataset.surfaceClass = body.dataset.runtimeSurface === 'player' ? 'player' : 'qa';
    if (!body.dataset.uiAuthority) body.dataset.uiAuthority = body.dataset.surfaceClass === 'player' ? 'froggy-ui-v2' : 'froggy-ui-v2-qa';
  }

  function setHudAuthority(authority = 'none', node = null) {
    const target = node || document.getElementById('canvasWrapper');
    if (!target) return false;
    if (!authority || authority === 'none') delete target.dataset.hudAuthority;
    else target.dataset.hudAuthority = String(authority);
    return true;
  }

  function clearHudAuthority(node = null) { return setHudAuthority('none', node); }

  function init() {
    ensureAuthorityMetadata();
    wireArtFallbacks();
    wireCardTapGuards();
    return api;
  }

  const api = Object.freeze({ init, wireArtFallbacks, wireCardTapGuards, ensureAuthorityMetadata, setHudAuthority, clearHudAuthority });
  return api;
})();

if (typeof globalThis !== 'undefined') globalThis.FroggyUIAuthority = FroggyUIAuthority;
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => FroggyUIAuthority.init(), { once: true });
  else FroggyUIAuthority.init();
}
