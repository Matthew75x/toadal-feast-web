// ============================================================
// src/runtime/platform/a11y-manager.js — shared accessibility and keyboard navigation support
// ============================================================
// Keeps native controls native. It adds missing labels, modal focus handling,
// and mobile-safe input defaults without replacing browser-standard keyboard
// behavior or gameplay input.

const A11yManager = (() => {
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const LAYER_SELECTOR = [
    '#mainMenu',
    '#puzzleNextScreen',
    '#settingsImportBackdrop',
    'dialog',
    '[role="dialog"]',
    '.panel',
    '.familiar-menu-panel',
    '.standalone-menu',
    '.ff-transition-overlay',
  ].join(',');

  const MUTATION_RELEVANT_SELECTOR = [
    LAYER_SELECTOR,
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[tabindex]',
    '[data-a11y-persistent="true"]',
  ].join(',');

  const PANEL_LABELS = Object.freeze({
    panelLeaderboard: 'Leaderboard',
    panelCharSelect: 'Character selection',
    panelAchievements: 'Feast Journal',
    panelAudio: 'Audio settings',
    panelCosmetics: 'Wardrobe and Store',
    panelInstructions: 'Help',
    panelSettings: 'Settings',
    panelCollection: 'Collection',
  });

  const ICON_BUTTON_LABELS = Object.freeze({
    btnAudioFloating: 'Open audio settings',
  });

  const layerVisibility = new WeakMap();
  const layerOpeners = new WeakMap();
  let observer = null;
  let initialized = false;
  let layerSyncQueued = false;
  let semanticSyncQueued = false;
  const pendingSemanticRoots = new Set();
  let latestActivation = null;
  let focusRestoreGeneration = 0;
  let focusRestorePending = false;
  const diagnostics = {
    mutationBatches:0,
    relevantMutationBatches:0,
    enhancementPasses:0,
    fullDocumentEnhancements:0,
    localEnhancementPasses:0,
    layerReconciliations:0,
  };

  function text(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function isElement(value) {
    return typeof Element !== 'undefined' && value instanceof Element;
  }

  function isHtmlElement(value) {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
  }

  function setAttributeIfChanged(element, name, value) {
    if (!element?.getAttribute || !element?.setAttribute) return;
    const next = String(value);
    if (element.getAttribute(name) !== next) element.setAttribute(name, next);
  }

  function setInertIfChanged(element, value) {
    if (!isHtmlElement(element) || !('inert' in element)) return;
    const next = Boolean(value);
    if (element.inert !== next) element.inert = next;
  }

  function hiddenByTree(element) {
    if (!isElement(element)) return true;
    for (let node = element; isElement(node); node = node.parentElement) {
      if (node.hidden || node.classList.contains('hidden')) return true;
      // Managed aria-hidden mirrors a CSS/hidden state and must not make a
      // container permanently hidden after the class is removed.
      if (node.getAttribute('aria-hidden') === 'true' && node.dataset.a11yManaged !== 'hidden') return true;
    }
    const style = window.getComputedStyle?.(element);
    return !!style && (style.display === 'none' || style.visibility === 'hidden');
  }

  function meaningfulButtonText(button) {
    const clone = button.cloneNode(true);
    clone.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove());
    return text(clone.textContent);
  }

  function labelForControl(control) {
    if (!isHtmlElement(control)) return '';
    if (control.id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
      if (explicit) return text(explicit.textContent);
    }
    const wrappingLabel = control.closest('label');
    if (wrappingLabel) return text(wrappingLabel.textContent);
    const row = control.closest('.tweak-row, .sl-row, .sl-mix-bus, .familiar-section');
    if (row) {
      const candidate = row.querySelector('.tweak-label, .sl-lbl, .sl-mix-label, h3, strong');
      if (candidate) return text(candidate.textContent);
    }
    return '';
  }

  function ensureButtonName(button) {
    if (typeof HTMLButtonElement === 'undefined' || !(button instanceof HTMLButtonElement)) return;
    if (button.hasAttribute('aria-label') || button.hasAttribute('aria-labelledby')) return;
    const visibleText = meaningfulButtonText(button);
    if (visibleText && /[\p{L}\p{N}]/u.test(visibleText)) return;
    const fallback = ICON_BUTTON_LABELS[button.id] || button.getAttribute('title') || button.dataset.a11yLabel || button.id;
    if (fallback) button.setAttribute('aria-label', text(fallback));
  }

  function syncRangeValue(input) {
    if (typeof HTMLInputElement === 'undefined' || !(input instanceof HTMLInputElement) || input.type !== 'range') return;
    const label = input.getAttribute('aria-label') || labelForControl(input);
    if (label) setAttributeIfChanged(input, 'aria-label', label);
    setAttributeIfChanged(input, 'aria-valuemin', input.min || '0');
    setAttributeIfChanged(input, 'aria-valuemax', input.max || '100');
    setAttributeIfChanged(input, 'aria-valuenow', input.value);
  }

  function layerNodes() {
    if (typeof document === 'undefined') return [];
    return [...new Set(document.querySelectorAll(LAYER_SELECTOR))];
  }

  function layerStackOrder(node, fallbackOrder) {
    const zIndex = Number.parseInt(window.getComputedStyle?.(node)?.zIndex || '0', 10);
    // Native modal dialogs live in the browser top layer, so their CSS
    // z-index is not a reliable signal for accessibility ownership. Without
    // this priority, a body-level <dialog> can be selected behind #mainMenu
    // and immediately marked inert, which leaves its controls visibly painted
    // but unreachable by real pointer input.
    const nativeModal = node?.tagName === 'DIALOG' && node.open;
    return [nativeModal ? Number.MAX_SAFE_INTEGER : (Number.isFinite(zIndex) ? zIndex : 0), fallbackOrder];
  }

  function visibleLayer() {
    const candidates = layerNodes()
      .map((node, index) => ({ node, index }))
      // Feast Genie guidance is body-level floating chrome. It may retain
      // role="dialog" for semantics and its own focus/key gate, but it must
      // not become the document's modal owner: doing so inerted #canvasWrapper
      // and made mode-owned controls visibly present but physically untappable.
      .filter(({ node }) => !isPersistentOverlay(node) && !hiddenByTree(node));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const [az, ai] = layerStackOrder(a.node, a.index);
      const [bz, bi] = layerStackOrder(b.node, b.index);
      return az - bz || ai - bi;
    });
    return candidates.at(-1)?.node || null;
  }

  function focusableWithin(root) {
    if (!root) return [];
    return [...root.querySelectorAll(FOCUSABLE)].filter(node => {
      if (node.getAttribute('aria-disabled') === 'true') return false;
      return !hiddenByTree(node) && !node.closest?.('[inert]');
    });
  }

  function persistentOverlayControls() {
    return [...document.querySelectorAll('[data-a11y-persistent="true"]')]
      .flatMap(root => focusableWithin(root));
  }

  function preferredFocusTarget(layer) {
    const explicit = layer.querySelector('[data-a11y-autofocus], [autofocus]');
    if (explicit && focusableWithin(layer).includes(explicit)) return explicit;

    const primary = layer.querySelector([
      '.standalone-pause-primary:not([disabled])',
      '.btn-resume:not([disabled])',
      '[data-standalone-action="play-standard"]:not([disabled])',
      '[data-standalone-action="start"]:not([disabled])',
      '#btnPlay:not([disabled])',
      '.btn-back:not([disabled])',
      '[data-standalone-action="back-home"]:not([disabled])',
    ].join(','));
    if (primary && focusableWithin(layer).includes(primary)) return primary;

    return focusableWithin(layer)[0] || null;
  }

  function focusLayer(layer) {
    if (!layer || hiddenByTree(layer) || visibleLayer() !== layer) return false;
    const target = preferredFocusTarget(layer);
    if (target?.focus) {
      target.focus({ preventScroll: true });
      return true;
    }
    if (isHtmlElement(layer)) {
      if (!layer.hasAttribute('tabindex')) layer.setAttribute('tabindex', '-1');
      layer.focus?.({ preventScroll: true });
      return true;
    }
    return false;
  }

  function queueLayerFocus(layer) {
    const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    schedule(() => focusLayer(layer));
  }

  function restoreFocusAfterClose(layer) {
    const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    const generation = ++focusRestoreGeneration;
    focusRestorePending = true;
    schedule(() => {
      if (generation !== focusRestoreGeneration) return;
      const active = visibleLayer();
      const opener = layerOpeners.get(layer);
      if (opener?.focus && !hiddenByTree(opener) && (!active || active.contains(opener))) {
        opener.focus({ preventScroll: true });
        focusRestorePending = false;
        return;
      }
      if (active) focusLayer(active);
      focusRestorePending = false;
    });
  }

  // Persistent floating chrome is attached at body level on purpose so it survives
  // every screen. That also makes it a non-active sibling of whichever menu or panel
  // is open, which the background sweep would otherwise mark inert — leaving it
  // painted and normally styled while silently removed from hit-testing, focus, and
  // the accessibility tree. Opting such elements out keeps them usable without
  // weakening the sweep for genuine background content behind a modal.
  function isPersistentOverlay(element) {
    if (element.dataset.a11yPersistent === 'true') return true;
    return Boolean(element.closest?.('[data-a11y-persistent="true"]'));
  }

  function setManagedBackgroundInert(element, requestedInert) {
    if (!isHtmlElement(element)) return;
    const shouldInert = requestedInert && !isPersistentOverlay(element);
    if (shouldInert) {
      if (element.dataset.a11yBackgroundInert !== 'true') element.dataset.a11yBackgroundInert = 'true';
      if ('inert' in element) setInertIfChanged(element, true);
      else setAttributeIfChanged(element, 'aria-hidden', 'true');
      return;
    }
    if (element.dataset.a11yBackgroundInert !== 'true') return;
    delete element.dataset.a11yBackgroundInert;
    // Releasing temporary background ownership must not reactivate a layer
    // that is independently hidden. Nested modal teardown can otherwise turn
    // a just-closed parent panel non-inert for one frame and strand focus in it.
    const independentlyHidden = hiddenByTree(element);
    if ('inert' in element) setInertIfChanged(element, independentlyHidden);
    else if (!independentlyHidden && element.getAttribute('aria-hidden') === 'true') element.removeAttribute('aria-hidden');
  }

  function syncBackgroundInert(activeLayer) {
    if (!document.body) return;
    [...document.body.children].forEach(child => {
      if (!isHtmlElement(child) || ['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE'].includes(child.tagName)) return;
      const isActiveBranch = !activeLayer || child === activeLayer || child.contains(activeLayer);
      setManagedBackgroundInert(child, Boolean(activeLayer) && !isActiveBranch);
    });

    // Full-screen panels commonly share an application wrapper with the main
    // menu, so inerting only body-level siblings leaves the visible menu
    // keyboard- and pointer-active behind the modal. Inert every other visible
    // peer layer while preserving ancestors/descendants of the active layer.
    layerNodes().forEach(layer => {
      const isActiveBranch = !activeLayer || layer === activeLayer
        || layer.contains(activeLayer) || activeLayer.contains(layer);
      setManagedBackgroundInert(layer, Boolean(activeLayer) && !isActiveBranch && !hiddenByTree(layer));
    });
  }

  function makeHiddenContainersInert() {
    // Use the same canonical layer inventory for visibility-owned inertness and
    // background ownership. Keeping a second selector list here caused Puzzle
    // Next to remain inert after it transitioned from hidden -> active: the
    // background sweep had released its ownership marker while the screen was
    // still hidden, then no visibility pass knew to clear the inert property.
    const containers = layerNodes();
    containers.forEach(container => {
      const hidden = hiddenByTree(container);
      if ('inert' in container && (hidden || container.dataset.a11yBackgroundInert !== 'true')) {
        setInertIfChanged(container, hidden);
      }
      if (hidden) {
        if (container.dataset.a11yManaged !== 'hidden') container.dataset.a11yManaged = 'hidden';
        setAttributeIfChanged(container, 'aria-hidden', 'true');
      } else if (container.dataset.a11yManaged === 'hidden') {
        delete container.dataset.a11yManaged;
        setAttributeIfChanged(container, 'aria-hidden', 'false');
      }
    });
  }

  function openerForLayer(layer) {
    const now = Date.now();
    const recent = latestActivation;
    if (recent?.target && now - recent.time < 900 && !layer.contains(recent.target) && !hiddenByTree(recent.target)) {
      return recent.target;
    }
    const active = document.activeElement;
    if (isHtmlElement(active) && active !== document.body && !layer.contains(active) && !hiddenByTree(active)) return active;
    return null;
  }

  function syncLayerLifecycle() {
    if (typeof document === 'undefined' || !document.body) return;
    const layers = layerNodes();
    const active = visibleLayer();
    let closedLayerNeedsFocusRestore = false;

    layers.forEach(layer => {
      const visible = !hiddenByTree(layer);
      const wasVisible = layerVisibility.get(layer);
      if (visible && !wasVisible) {
        const opener = openerForLayer(layer);
        if (opener) layerOpeners.set(layer, opener);
        if (layer === active) queueLayerFocus(layer);
      } else if (!visible && wasVisible) {
        closedLayerNeedsFocusRestore = true;
        restoreFocusAfterClose(layer);
      }
      layerVisibility.set(layer, visible);
    });

    syncBackgroundInert(active);

    // A layer can become the topmost visible surface without changing its own
    // visibility state—for example, when a transition overlay closes above an
    // already-visible menu. In that case the old transition-only check never
    // requested focus for the newly exposed layer, leaving keyboard users on
    // <body> or on an inert background control. Keep focus inside the current
    // active layer whenever it is exposed, without disturbing focus that is
    // already on one of its usable descendants.
    const focused = document.activeElement;
    const focusInsideActive = active && isHtmlElement(focused)
      && active.contains(focused) && !hiddenByTree(focused)
      && !focused.closest?.('[inert]');
    // A closing modal owns the next focus move so its opener can be
    // restored. Queuing the generic layer default in the same frame would
    // overwrite that restoration (for example, Settings -> Start Game).
    if (active && !focusInsideActive && !closedLayerNeedsFocusRestore && !focusRestorePending) queueLayerFocus(active);
  }

  function mutationTouchesAccessibilitySurface(mutation) {
    const target = isElement(mutation?.target) ? mutation.target : null;
    if (mutation?.type === 'childList') {
      const changed = [...(mutation.addedNodes || []), ...(mutation.removedNodes || [])]
        .filter(isElement);
      return changed.some(node => node.matches?.(MUTATION_RELEVANT_SELECTOR)
        || node.querySelector?.(MUTATION_RELEVANT_SELECTOR));
    }
    if (mutation?.type !== 'attributes' || !target) return false;
    const attribute = mutation.attributeName;
    // Several browser DOM properties report an attribute mutation even when a
    // renderer assigns the value it already has. Those writes do not change
    // accessibility state and must not trigger a document-wide layer pass.
    if (mutation.oldValue === target.getAttribute(attribute)) return false;
    if (attribute === 'class') {
      // Mode/layer visibility classes matter; per-frame animation classes on
      // descendants do not justify a document-wide accessibility reconciliation.
      return target === document.body
        || target === document.documentElement
        || target.matches?.(LAYER_SELECTOR)
        || target.matches?.('[data-a11y-persistent="true"]');
    }
    if (!['hidden', 'disabled', 'value'].includes(attribute)) return false;
    return target.matches?.(MUTATION_RELEVANT_SELECTOR)
      || Boolean(target.closest?.(LAYER_SELECTOR));
  }

  function mutationTouchesLayerSurface(mutation) {
    const target = isElement(mutation?.target) ? mutation.target : null;
    if (mutation?.type === 'childList') {
      const changed = [...(mutation.addedNodes || []), ...(mutation.removedNodes || [])].filter(isElement);
      return changed.some(node => node.matches?.(LAYER_SELECTOR) || node.querySelector?.(LAYER_SELECTOR));
    }
    if (mutation?.type !== 'attributes' || !target) return false;
    if (mutation.oldValue === target.getAttribute(mutation.attributeName)) return false;
    if (!['hidden', 'class'].includes(mutation.attributeName)) return false;
    return target === document.body
      || target === document.documentElement
      || target.matches?.(LAYER_SELECTOR)
      || target.matches?.('[data-a11y-persistent="true"]');
  }

  function semanticRootsForMutation(mutation) {
    if (mutation?.type === 'childList') {
      return [...(mutation.addedNodes || [])].filter(node => isElement(node)
        && (node.matches?.(MUTATION_RELEVANT_SELECTOR) || node.querySelector?.(MUTATION_RELEVANT_SELECTOR)));
    }
    const target = isElement(mutation?.target) ? mutation.target : null;
    if (!target || mutation?.type !== 'attributes') return [];
    if (mutation.oldValue === target.getAttribute(mutation.attributeName)) return [];
    return target.matches?.(MUTATION_RELEVANT_SELECTOR) ? [target] : [];
  }

  function scheduleLayerSync() {
    if (layerSyncQueued) return;
    layerSyncQueued = true;
    const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    schedule(() => {
      layerSyncQueued = false;
      enhanceRoot(document);
    });
  }

  function scheduleSemanticSync(roots) {
    roots.forEach(root => { if (root?.isConnected) pendingSemanticRoots.add(root); });
    if (semanticSyncQueued || !pendingSemanticRoots.size) return;
    semanticSyncQueued = true;
    const schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    schedule(() => {
      semanticSyncQueued = false;
      const rootsToEnhance = [...pendingSemanticRoots];
      pendingSemanticRoots.clear();
      rootsToEnhance.forEach(root => {
        if (!root?.isConnected) return;
        diagnostics.localEnhancementPasses += 1;
        enhanceSemantics(root);
      });
    });
  }

  function matchingAndDescendants(root, selector) {
    const nodes = [];
    if (root?.matches?.(selector)) nodes.push(root);
    if (root?.querySelectorAll) nodes.push(...root.querySelectorAll(selector));
    return nodes;
  }

  function enhanceSemantics(root) {
    matchingAndDescendants(root, 'button').forEach(ensureButtonName);
    matchingAndDescendants(root, 'input[type="range"]').forEach(syncRangeValue);

    matchingAndDescendants(root, '.panel').forEach(panel => {
      setAttributeIfChanged(panel, 'role', 'dialog');
      setAttributeIfChanged(panel, 'aria-modal', 'true');
      if (!panel.hasAttribute('aria-label') && !panel.hasAttribute('aria-labelledby')) {
        const title = panel.querySelector('.panel-title, h1, h2');
        panel.setAttribute('aria-label', text(title?.textContent) || PANEL_LABELS[panel.id] || 'Game panel');
      }
    });

    matchingAndDescendants(root, '#pauseOverlay, #gameOverOverlay').forEach(dialog => {
      setAttributeIfChanged(dialog, 'role', 'dialog');
      setAttributeIfChanged(dialog, 'aria-modal', 'true');
      if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
        const title = dialog.querySelector('.pause-title, .go-title, h1, h2');
        dialog.setAttribute('aria-label', text(title?.textContent) || (dialog.id === 'pauseOverlay' ? 'Paused game' : 'Game over'));
      }
    });

    matchingAndDescendants(root, '.lb-list, .char-grid, .unlock-list, .familiar-list, .familiar-grid').forEach(list => {
      if (!list.hasAttribute('role')) list.setAttribute('role', 'list');
    });
  }

  function enhanceRoot(root = document) {
    diagnostics.enhancementPasses += 1;
    if (root === document) diagnostics.fullDocumentEnhancements += 1;
    enhanceSemantics(root);
    if (root === document) {
      diagnostics.layerReconciliations += 1;
      makeHiddenContainersInert();
      syncLayerLifecycle();
    }
  }

  function onActivation(event) {
    const target = event.target?.closest?.(FOCUSABLE);
    if (isHtmlElement(target) && !hiddenByTree(target) && target.getAttribute('aria-disabled') !== 'true') {
      latestActivation = { target, time: Date.now() };
    }
  }

  function onInput(event) {
    if (typeof HTMLInputElement !== 'undefined' && event.target instanceof HTMLInputElement && event.target.type === 'range') syncRangeValue(event.target);
  }

  function onKeydown(event) {
    const target = event.target;
    if (event.key === 'Enter' || event.key === ' ') {
      if (isHtmlElement(target) && target.getAttribute('role') === 'button' && target.tagName !== 'BUTTON') {
        event.preventDefault();
        target.click();
        return;
      }
    }

    if (event.key !== 'Tab') return;
    const layer = visibleLayer();
    if (!layer) return;
    // Authenticated development/benchmark chrome is intentionally usable over
    // every player layer. Include those explicitly opted-in controls in the
    // focus cycle; production builds mount none, so the normal modal trap is
    // unchanged for players.
    const controls = [...focusableWithin(layer), ...persistentOverlayControls()]
      .filter((node, index, all) => all.indexOf(node) === index);
    if (!controls.length) return;
    const index = controls.indexOf(document.activeElement);
    const atFirst = index <= 0;
    const atLast = index === controls.length - 1;
    if ((!event.shiftKey && (index === -1 || atLast)) || (event.shiftKey && (index === -1 || atFirst))) {
      event.preventDefault();
      const next = event.shiftKey ? controls.at(-1) : controls[0];
      next?.focus?.({ preventScroll: true });
    }
  }

  function init() {
    if (initialized) return api;
    initialized = true;
    // Keep diagnostics and package simulations safe in non-browser harnesses.
    if (typeof document === 'undefined' || !document.addEventListener) return api;
    const run = () => enhanceRoot(document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
    document.addEventListener('click', onActivation, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('keydown', onKeydown, true);
    if (typeof MutationObserver !== 'undefined' && document.documentElement) {
      observer = new MutationObserver(mutations => {
        diagnostics.mutationBatches += 1;
        const relevant = mutations.filter(mutationTouchesAccessibilitySurface);
        if (relevant.length) {
          diagnostics.relevantMutationBatches += 1;
          if (relevant.some(mutationTouchesLayerSurface)) scheduleLayerSync();
          const roots = relevant.flatMap(semanticRootsForMutation);
          if (roots.length) scheduleSemanticSync(roots);
        }
      });
      observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['hidden', 'class', 'disabled', 'value'] });
    }
    return api;
  }

  const api = Object.freeze({ init, enhance: enhanceRoot, focusableWithin, visibleLayer, diagnostics: () => Object.freeze({ ...diagnostics }) });
  return api;
})();

if (typeof globalThis !== 'undefined') globalThis.A11yManager = A11yManager;
A11yManager.init();
