// ============================================================
// src/runtime/ui/ui-icon-library.js — owned semantic UI icon adapter
// ============================================================
// Compact UI roles resolve through AssetProvenanceRegistry. The adapter never
// invents Unicode, SVG, Canvas, or CSS placeholder artwork. If an approved
// semantic asset is unresolved, the icon node remains layout-safe but visually
// hidden and records a diagnostic marker for verification.

const UIIconLibrary = (() => {
  'use strict';

  const ICONS = Object.freeze({
    pause: 'ui.control.pause',
    resume: 'ui.control.resume',
    restart: 'ui.control.restart',
    undo: 'ui.action.undo',
    skip: 'ui.action.skip',
    quit: 'ui.action.quit',
    left: 'ui.control.left',
    right: 'ui.control.right',
    up: 'ui.control.up',
    down: 'ui.control.down',
    settings: 'ui.settings',
    warning: 'ui.warning',
    lock: 'ui.lock',
    unlock: 'ui.unlock',
    heart: 'ui.health.heart',
    gold: 'ui.currency.gold',
    colonyCoin: 'ui.currency.colony-coin',
    map: 'ui.map',
    trophy: 'ui.badge.trophy',
    rank: 'ui.badge.rank',
    characters: 'ui.menu.characters',
    cosmetics: 'ui.menu.cosmetics',
    shop: 'ui.menu.shop',
    help: 'ui.menu.help',
    story: 'ui.menu.story',
    powerups: 'ui.menu.powerups',
    audio: 'ui.menu.audio',
    stats: 'ui.menu.stats',
    hero: 'ui.menu.hero',
    food: 'ui.game.food',
    bomb: 'ui.game.bomb',
    skull: 'ui.game.skull',
    vomit: 'ui.game.vomit',
    plate: 'ui.game.plate',
    sparkle: 'ui.game.sparkle',
    target: 'ui.game.target',
    lab: 'ui.tool.lab',
    copy: 'ui.action.copy',
    apply: 'ui.action.apply',
  });

  function resolve(key, options = {}) {
    const semanticKey = ICONS[key] || String(key || '');
    if (!semanticKey || typeof AssetProvenanceRegistry === 'undefined' || !AssetProvenanceRegistry?.resolve) return null;
    return AssetProvenanceRegistry.resolve(semanticKey, options);
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function apply(node, key, options = {}) {
    if (!node || !node.ownerDocument) return null;
    const semanticKey = ICONS[key] || String(key || '');
    const source = resolve(semanticKey, options);
    node.classList.add('ff-ui-icon');
    node.dataset.uiIcon = semanticKey;
    node.setAttribute('aria-hidden', 'true');
    clear(node);
    if (source?.sourcePath) {
      const image = node.ownerDocument.createElement('img');
      image.src = source.sourcePath;
      image.alt = '';
      image.decoding = 'async';
      image.loading = 'eager';
      image.dataset.uiIconAssetKey = source.assetKey;
      image.addEventListener('error', () => {
        image.remove();
        node.classList.add('ff-ui-icon--missing');
        node.dataset.uiIconError = source.assetKey || semanticKey;
      }, { once: true });
      image.addEventListener('load', () => {
        node.classList.remove('ff-ui-icon--missing');
        delete node.dataset.uiIconError;
      }, { once: true });
      node.appendChild(image);
      node.classList.remove('ff-ui-icon--missing');
      return source;
    }
    // Fail closed visually: preserve semantic/layout ownership without inventing artwork.
    node.classList.add('ff-ui-icon--missing');
    node.dataset.uiIconError = semanticKey;
    return null;
  }

  function createNode(documentRef, key, options = {}) {
    if (!documentRef?.createElement) return null;
    const node = documentRef.createElement('span');
    node.className = options.className || 'ff-ui-icon';
    node.dataset.uiIcon = key;
    if (options.label) node.setAttribute('aria-label', options.label);
    apply(node, key, options);
    return node;
  }

  // Safe dynamic-label helper for buttons and status pills. It keeps the icon as
  // a semantic DOM node rather than restoring a native glyph through textContent.
  function setLabel(node, key, label, options = {}) {
    if (!node || !node.ownerDocument) return null;
    clear(node);
    const icon = createNode(node.ownerDocument, key, options);
    if (icon) node.appendChild(icon);
    if (label !== undefined && label !== null && String(label).length) {
      node.appendChild(node.ownerDocument.createTextNode(options.separator ?? ' '));
      const text = node.ownerDocument.createElement(options.textTag || 'span');
      if (options.textClass) text.className = options.textClass;
      text.textContent = String(label);
      node.appendChild(text);
    }
    return icon;
  }

  function hydrate(root = typeof document !== 'undefined' ? document : null) {
    if (!root?.querySelectorAll) return [];
    const nodes = [];
    if (root.matches?.('[data-ui-icon]')) nodes.push(root);
    nodes.push(...root.querySelectorAll('[data-ui-icon]'));
    return nodes.map(node => apply(node, node.dataset.uiIcon));
  }

  function boot() {
    hydrate();
    if (typeof window !== 'undefined') {
      window.addEventListener('froggy-theme-change', () => hydrate(), { passive: true });
    }
    // Menus, pause panels, and benchmark controls are created dynamically.
    // Hydrate newly inserted semantic icons automatically so no late panel can
    // display an empty placeholder simply because it missed DOMContentLoaded.
    if (typeof MutationObserver !== 'undefined' && document.documentElement) {
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes || []) {
            if (node?.nodeType !== 1) continue;
            if (node.matches?.('[data-ui-icon]')) apply(node, node.dataset.uiIcon);
            hydrate(node);
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }

  return Object.freeze({ ICONS, resolve, apply, createNode, setLabel, hydrate });
})();

if (typeof globalThis !== 'undefined') globalThis.UIIconLibrary = UIIconLibrary;
