/* Native Studio game-preview pattern v1. Images remain ordinary managed images. */
(function () {
  'use strict';
  function enhance(root, environment = window) {
    if (root.dataset.gamePreviewBound === 'true') return;
    const cover = root.querySelector('[data-game-preview-cover]');
    const gameplay = root.querySelector('[data-game-preview-gameplay]');
    const toggle = root.querySelector('[data-game-preview-toggle]');
    const link = root.querySelector('[data-game-preview-link]');
    const status = root.querySelector('[data-game-preview-status]');
    if (!cover || !toggle || !link) return;
    root.dataset.gamePreviewBound = 'true';
    const hoverQuery = environment.matchMedia('(hover: hover) and (pointer: fine)');
    let hovered = false, focused = false, pinned = null, suppressed = false;
    let available = Boolean(gameplay && gameplay.complete && gameplay.naturalWidth > 0);
    const showLabel = toggle.querySelector('[data-game-preview-show-label]');
    const hideLabel = toggle.querySelector('[data-game-preview-hide-label]');
    function render() {
      const showing = available && !suppressed && (pinned === null ? hovered || focused : pinned);
      root.dataset.gamePreviewShowing = showing ? 'gameplay' : 'cover';
      toggle.hidden = false;
      toggle.disabled = !available;
      toggle.setAttribute('aria-pressed', String(Boolean(showing)));
      if (showLabel) showLabel.hidden = Boolean(showing);
      if (hideLabel) hideLabel.hidden = !showing;
      cover.setAttribute('aria-hidden', String(Boolean(showing)));
      if (gameplay) gameplay.setAttribute('aria-hidden', String(!showing));
    }
    function loaded() { available = gameplay.naturalWidth > 0; if (status) status.textContent = ''; render(); }
    function failed() {
      available = false; pinned = null;
      if (status) status.textContent = 'Gameplay image unavailable. You can still open the game details.';
      render();
    }
    if (gameplay) { gameplay.addEventListener('load', loaded); gameplay.addEventListener('error', failed); }
    cover.addEventListener('error', () => { root.dataset.gamePreviewCoverFailed = 'true'; });
    root.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !hoverQuery.matches) return;
      hovered = true; suppressed = false; render();
    });
    root.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = false; pinned = null; suppressed = false; render();
    });
    // Only the ordinary navigation link auto-previews on keyboard focus. The
    // toggle never changes its own state merely because it received focus.
    link.addEventListener('focus', () => { focused = link.matches(':focus-visible'); suppressed = false; render(); });
    link.addEventListener('blur', () => { focused = false; render(); });
    toggle.addEventListener('click', () => {
      if (!available) return;
      pinned = root.dataset.gamePreviewShowing !== 'gameplay'; suppressed = false; render();
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      pinned = null; suppressed = true; render();
    });
    hoverQuery.addEventListener?.('change', () => { hovered = false; render(); });
    environment.document?.addEventListener('visibilitychange', () => {
      if (environment.document.hidden) { hovered = false; focused = false; pinned = null; suppressed = true; render(); }
    });
    if (gameplay?.complete && !gameplay.naturalWidth) failed(); else render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { enhance };
  if (typeof document !== 'undefined') {
    const start = () => document.querySelectorAll('[data-game-preview]').forEach(root => enhance(root));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})();
