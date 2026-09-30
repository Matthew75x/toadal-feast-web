// ============================================================
// standalone-pause.js — Shared standalone pause-overlay controller
// Owns only DOM visibility, Escape interception, focus, and action dispatch.
// Mode-specific pause state, save, and gameplay decisions stay in each
// standalone boot module.
// ============================================================

const StandalonePause = (() => {
  let root = null;
  let options = null;
  let initialized = false;
  let lastFocused = null;

  function requireRoot(rootId) {
    const element = document.getElementById(rootId);
    if (!element) throw new Error(`[StandalonePause] Missing pause root #${rootId}.`);
    return element;
  }

  function isOpen() {
    return !!root && !root.hidden;
  }

  function setOpenClass(open) {
    document.body.classList.toggle('standalone-pause-open', !!open);
    document.documentElement.classList.toggle('standalone-pause-open', !!open);
  }

  function setText(selector, value) {
    const target = root?.querySelector(selector);
    if (target && value !== undefined && value !== null) target.textContent = String(value);
  }

  function show({ title = null, subtitle = null, focus = true } = {}) {
    if (!root) return false;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (title !== null) setText('[data-standalone-pause-title]', title);
    if (subtitle !== null) setText('[data-standalone-pause-subtitle]', subtitle);
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    setOpenClass(true);
    options?.onShow?.();
    if (focus) {
      requestAnimationFrame(() => {
        root.querySelector('[data-standalone-pause-primary]:not([disabled]), button:not([disabled])')?.focus?.({ preventScroll: true });
      });
    }
    return true;
  }

  function hide({ restoreFocus = false } = {}) {
    if (!root) return false;
    options?.onHide?.();
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    setOpenClass(false);
    if (restoreFocus) lastFocused?.focus?.({ preventScroll: true });
    return true;
  }

  function dispatch(action, element, event) {
    if (!action) return;
    options?.onAction?.(action, element, event);
  }

  function onClick(event) {
    const control = event.target.closest?.('[data-standalone-pause-action]');
    if (!control || !root?.contains(control) || control.disabled) return;
    dispatch(control.dataset.standalonePauseAction, control, event);
  }

  function isTextEntry(target) {
    const tag = String(target?.tagName || '').toLowerCase();
    return tag === 'textarea' || (tag === 'input' && ['text', 'search', 'number'].includes(String(target.type || '').toLowerCase()));
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || isTextEntry(event.target)) return;

    // Main-menu Escape should not leak into the mode runtime underneath the
    // overlay. StandaloneMenu gets first chance to process its own open state.
    if (!isOpen() && document.body.classList.contains('standalone-menu-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (isOpen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dispatch('resume', root, event);
      return;
    }

    if (options?.canOpen?.()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dispatch('pause', root, event);
    }
  }

  function init(config = {}) {
    if (initialized) throw new Error('[StandalonePause] init() may only be called once per standalone page.');
    options = config;
    root = requireRoot(config.rootId || 'standalonePause');
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown, true);
    initialized = true;
    return api;
  }

  const api = Object.freeze({ init, show, hide, isOpen, setText });
  return api;
})();

if (typeof globalThis !== 'undefined') globalThis.StandalonePause = StandalonePause;
