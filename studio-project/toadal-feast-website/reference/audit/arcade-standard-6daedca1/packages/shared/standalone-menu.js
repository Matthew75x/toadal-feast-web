// ============================================================
// standalone-menu.js — Shared modal-menu controller for standalone modes
// Keeps Arcade, Puzzle, Feastfall, and Infinite menu behavior consistent
// without importing any mode runtime. Each standalone supplies its actions.
// ============================================================

const StandaloneMenu = (() => {
  let root = null;
  let options = null;
  let lastFocused = null;
  let initialized = false;

  function requireRoot(rootId) {
    const element = document.getElementById(rootId);
    if (!element) throw new Error(`[StandaloneMenu] Missing menu root #${rootId}.`);
    return element;
  }

  function isOpen() {
    return !!root && !root.hidden;
  }

  function isUnavailable(element) {
    if (!element || element.disabled || element.hidden) return true;
    let node = element;
    while (node && node !== root) {
      if (node.hidden || node.getAttribute?.('aria-hidden') === 'true') return true;
      node = node.parentElement;
    }
    return false;
  }

  function firstAvailable(selectors, scope = root) {
    if (!scope) return null;
    for (const selector of selectors) {
      const match = [...scope.querySelectorAll(selector)].find(element => !isUnavailable(element));
      if (match) return match;
    }
    return null;
  }

  function getActiveView() {
    if (!root) return 'home';
    const visible = [...root.querySelectorAll('[data-standalone-view]')]
      .find(view => !view.hidden && view.getAttribute('aria-hidden') !== 'true');
    return visible?.dataset?.standaloneView || 'home';
  }

  function viewRoot(view = getActiveView()) {
    return [...(root?.querySelectorAll('[data-standalone-view]') || [])]
      .find(node => node.dataset.standaloneView === view && !node.hidden && node.getAttribute('aria-hidden') !== 'true') || null;
  }

  function activeViewRoot() {
    return viewRoot(getActiveView()) || root;
  }

  function focusElement(element) {
    if (!element?.focus) return false;
    try { element.focus({ preventScroll: true }); }
    catch (_) { element.focus(); }
    return document.activeElement === element;
  }

  function focusView(view = getActiveView()) {
    const scope = viewRoot(view) || activeViewRoot();
    const target = firstAvailable([
      '[data-standalone-view-focus]',
      '[data-standalone-primary]',
      'button',
      'select',
      'input',
      'textarea',
    ], scope);
    if (focusElement(target)) return target;
    // A newly revealed panel can briefly reject child focus while styles and
    // icon templates settle. Focusing the panel itself still keeps keyboard
    // ownership inside the visible view and provides a deterministic fallback.
    if (scope && scope !== root) {
      if (!scope.hasAttribute('tabindex')) scope.setAttribute('tabindex', '-1');
      if (focusElement(scope)) return scope;
    }
    return target || null;
  }

  function focusCurrentView() {
    return focusView(getActiveView());
  }

  function setMessage(message = '') {
    if (!root) return;
    const target = root.querySelector('[data-standalone-menu-message]');
    if (!target) return;
    target.textContent = String(message || '');
    target.hidden = !message;
  }

  function setOpenClass(open) {
    document.body.classList.toggle('standalone-menu-open', !!open);
    document.documentElement.classList.toggle('standalone-menu-open', !!open);
  }

  function show({ message = '', focus = true } = {}) {
    if (!root) return false;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    setOpenClass(true);
    setMessage(message);
    options?.onShow?.();
    if (focus) requestAnimationFrame(focusCurrentView);
    return true;
  }

  function hide({ restoreFocus = false } = {}) {
    if (!root) return false;
    options?.onHide?.();
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    setOpenClass(false);
    if (restoreFocus) focusElement(lastFocused);
    return true;
  }

  function dispatch(action, element, event) {
    if (!action || !options?.onAction) return;
    options.onAction(action, element, event);
  }

  function onClick(event) {
    const control = event.target.closest?.('[data-standalone-action]');
    if (!control || !root?.contains(control) || control.disabled || isUnavailable(control)) return;
    dispatch(control.dataset.standaloneAction, control, event);
  }

  function isTextEntry(target) {
    const tag = String(target?.tagName || '').toLowerCase();
    return tag === 'textarea' || (tag === 'input' && ['text', 'search', 'number'].includes(String(target.type || '').toLowerCase()));
  }

  function handleEscape(event) {
    const view = getActiveView();
    if (options?.onEscape?.(event, { view, isHome: view === 'home' }) === true) return true;

    // Escape from a nested menu view always behaves like its visible Back
    // control. Never let a Resume control inside a hidden home view fire.
    if (view !== 'home') {
      const back = firstAvailable(['[data-standalone-action="back-home"]'], activeViewRoot());
      if (back) {
        back.click();
        return true;
      }
    }

    // Top-level menus are safe resting places. Escape must not start or resume
    // gameplay implicitly; the player chooses Play/Resume explicitly.
    return false;
  }

  function onKeydown(event) {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      if (handleEscape(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    if (event.key === 'Enter' && !isTextEntry(event.target)) {
      const tag = String(event.target?.tagName || '').toLowerCase();
      if (tag === 'button' || tag === 'select') return;
      const primary = firstAvailable(['[data-standalone-primary]'], activeViewRoot());
      if (primary) {
        event.preventDefault();
        primary.click();
      }
    }
  }

  function init(config = {}) {
    if (initialized) throw new Error('[StandaloneMenu] init() may only be called once per standalone page.');
    options = config;
    root = requireRoot(config.rootId || 'standaloneMenu');
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown, true);
    initialized = true;
    return api;
  }

  const api = Object.freeze({ init, show, hide, isOpen, setMessage, getActiveView, focusView, focusCurrentView });
  return api;
})();

if (typeof globalThis !== 'undefined') globalThis.StandaloneMenu = StandaloneMenu;
