// ============================================================
// src/runtime/shared/theme-system.js — player-facing Theme Dictionary runtime
//
// Themes change display text, menu/UI presentation, accessible labels, and
// declared visual binding intent. They do not rename engine IDs, save fields,
// event names, level data, collision rules, or renderer APIs.
// ============================================================

const ThemeSystem = (() => {
  'use strict';

  const registry = typeof globalThis !== 'undefined' ? globalThis.FROGGY_THEME_REGISTRY : null;
  if (!registry || !Array.isArray(registry.themes)) {
    throw new Error('[ThemeSystem] Missing generated FROGGY_THEME_REGISTRY. Run npm run theme:generate.');
  }

  const byId = new Map(registry.themes.map(theme => [theme.id, theme]));
  const legacyAliases = Object.freeze({ froggy: 'froggy-feast' });
  const replacementRoles = Object.freeze([
    ['Froggy Feast', theme => theme.product.title],
    ['Toadal Consumption', theme => theme.text?.['mode.arcade.toadal'] || 'FEAST FRENZY'],
    ['5 Min Feast', theme => theme.text?.['mode.arcade.fiveMinute'] || '5 Minute Feast'],
    ['Spit-Up', theme => theme.roles.releaseAction.label],
    ['Spit up', theme => theme.roles.releaseAction.label],
    ['Vomit', theme => theme.roles.releaseAction.label],
    ['Bombs', theme => theme.roles.hazard.plural],
    ['Bomb', theme => theme.roles.hazard.singular],
    ['Hearts', theme => theme.roles.health.plural],
    ['Heart', theme => theme.roles.health.singular],
    ['Coins', theme => theme.roles.currency.plural],
    ['Coin', theme => theme.roles.currency.singular],
    ['Bellies', theme => theme.roles.capacityMeter.plural],
    ['Belly', theme => theme.roles.capacityMeter.singular],
    ['Foods', theme => theme.roles.primaryCollectible.plural],
    ['Food', theme => theme.roles.primaryCollectible.singular],
    ['Frogs', theme => theme.roles.playerCharacter.plural],
    ['Frog', theme => theme.roles.playerCharacter.singular],
    ['Tongues', theme => theme.roles.captureTool.plural],
    ['Tongue', theme => theme.roles.captureTool.singular],
  ]);

  let active = null;
  let observer = null;
  // The legacy rewrite bridge mutates only visible DOM prose. Retain original
  // values so switching Base ↔ any alternate theme remains reversible rather
  // than requiring a reload. New UI should use semantic keys instead.
  const rewrittenTextNodes = new Map();
  const rewrittenAttributes = new Map();

  function getSearchParam(name) {
    if (typeof window === 'undefined' || !window.location) return null;
    try { return new URLSearchParams(window.location.search || '').get(name); } catch (_) { return null; }
  }

  function normalizeId(value) {
    const raw = String(value || '').trim().toLowerCase();
    return legacyAliases[raw] || raw;
  }

  function resolveId() {
    const fromGlobal = typeof window !== 'undefined' ? (window.FROGGY_THEME_ID || window.PUZZLE_BRAND_ID) : null;
    const fromQuery = getSearchParam('theme') || getSearchParam('brand');
    const candidate = normalizeId(fromGlobal || fromQuery || registry.defaultThemeId);
    return byId.has(candidate) ? candidate : registry.defaultThemeId;
  }

  function get(id) {
    return byId.get(normalizeId(id)) || byId.get(registry.defaultThemeId);
  }

  function current() {
    return active || get(resolveId());
  }

  function getPath(source, path) {
    return String(path || '').split('.').reduce((value, segment) => (
      value && Object.prototype.hasOwnProperty.call(value, segment) ? value[segment] : undefined
    ), source);
  }

  // ── EC-9 locale seam ──────────────────────────────────────────────────
  // Every player string flows through text()/format(); the locale dimension
  // lives HERE, once. Resolution: active-locale table
  // (`theme.textLocales[locale][key]`) → base `theme.text[key]` → the
  // caller's fallback. `en` is the base language. `en-XA` is a GENERATED
  // pseudo-locale (accents + [[bracket]] markers + ~40% expansion) that
  // transforms only KEYED resolutions — an unkeyed literal stays raw ASCII
  // on screen, which is exactly how the pseudo-locale drill exposes
  // bypassing call sites. Markers are ASCII on purpose (the production
  // emoji/glyph audit is strict-zero); the ACCENTS are the non-ASCII visual
  // signal. Adding a real language = a data swap, never engine surgery.
  let activeLocale = 'en';
  const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Za-z]{2})?$/;
  const PSEUDO_MAP = {
    a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ',
    l: 'ĺ', n: 'ñ', o: 'ö', r: 'ŕ', s: 'š', t: 'ŧ', u: 'ü', w: 'ŵ', y: 'ý', z: 'ž',
    A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ', K: 'Ķ',
    L: 'Ĺ', N: 'Ñ', O: 'Ö', R: 'Ŕ', S: 'Š', T: 'Ŧ', U: 'Ü', W: 'Ŵ', Y: 'Ý', Z: 'Ž',
  };
  function pseudoLocalize(value) {
    const source = String(value);
    let accented = '';
    let inToken = 0;
    for (const ch of source) {
      if (ch === '{') { inToken += 1; accented += ch; continue; }
      if (ch === '}') { inToken = Math.max(0, inToken - 1); accented += ch; continue; }
      accented += inToken > 0 ? ch : (PSEUDO_MAP[ch] || ch);
    }
    // [[…]] + interpunct padding ≈ 40% horizontal expansion for layout drills.
    const pad = '·'.repeat(Math.max(1, Math.round(source.length * 0.2)));
    return `[[${accented}${pad}]]`;
  }
  function setLocale(locale) {
    const value = String(locale || '').trim();
    if (!LOCALE_PATTERN.test(value) && value !== 'en-XA') return false;
    activeLocale = value;
    try { if (typeof EventBus !== 'undefined') EventBus.emit('localeChanged', { locale: value }); } catch (_) {}
    return true;
  }
  function getLocale() { return activeLocale; }
  function localizedText(theme, key) {
    if (activeLocale === 'en') return undefined;
    const base = theme?.text?.[key];
    if (activeLocale === 'en-XA') {
      return typeof base === 'string' && base.length ? pseudoLocalize(base) : undefined;
    }
    const value = theme?.textLocales?.[activeLocale]?.[key];
    return typeof value === 'string' && value.length ? value : undefined;
  }

  function text(key, fallback = '') {
    const theme = current();
    const localized = localizedText(theme, key);
    if (typeof localized === 'string') return localized;
    const value = theme?.text?.[key];
    return typeof value === 'string' && value.length ? value : String(fallback || '');
  }

  function metadata(path, fallback = '') {
    const value = getPath(current(), path);
    if (Array.isArray(value)) return value.join(', ');
    return typeof value === 'string' && value.length ? value : String(fallback || '');
  }

  function aria(key, fallback = '') {
    return template(text(key, fallback));
  }

  function canvasLabel(key, fallback = '') {
    return template(text(key, fallback));
  }

  /**
   * Presentation-only catalog overlay. Character/cosmetic IDs remain stable
   * and definitions are never mutated; a theme can display a licensed or
   * white-label name/description over an existing legacy record.
   */
  function presentCatalogItem(kind, definition = {}) {
    const group = kind === 'cosmetics' ? 'cosmetics' : 'characters';
    const id = String(definition?.id || '');
    const overlay = current()?.catalogPresentation?.[group]?.[id] || {};
    const nativeName = definition?.name || definition?.display?.name || id;
    const nativeDescription = definition?.desc || definition?.description || definition?.display?.description || '';
    return Object.freeze({
      id,
      name: typeof overlay.name === 'string' && overlay.name ? overlay.name : rewrite(nativeName),
      description: typeof overlay.description === 'string' && overlay.description ? overlay.description : rewrite(nativeDescription),
      nativeName,
      nativeDescription,
      themed: Boolean(overlay.name || overlay.description),
    });
  }

  function role(roleId, form = 'singular', fallback = '') {
    const definition = current()?.roles?.[roleId];
    const value = definition?.[form];
    return typeof value === 'string' && value.length ? value : String(fallback || '');
  }

  function icon(roleId, fallback = '') {
    const value = current()?.presentation?.icons?.[roleId];
    return typeof value === 'string' && value.length ? value : String(fallback || '');
  }

  function template(source, values = {}) {
    const seen = new Set();
    let output = String(source || '');
    for (let depth = 0; depth < 8; depth += 1) {
      if (seen.has(output)) break;
      seen.add(output);
      const resolved = output.replace(/\{\{?([a-zA-Z0-9_.-]+)\}?\}/g, (full, key) => {
        if (Object.prototype.hasOwnProperty.call(values, key)) return String(values[key]);
        const fromText = text(key, '');
        if (fromText) return fromText;
        const fromRole = getPath(current()?.roles, key);
        if (typeof fromRole === 'string') return fromRole;
        if (fromRole && typeof fromRole === 'object' && typeof fromRole.singular === 'string') return fromRole.singular;
        return full;
      });
      if (resolved === output) break;
      output = resolved;
    }
    return output;
  }

  function format(key, values = {}, fallback = '') {
    return template(text(key, fallback), values);
  }

  function escapedPattern(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function matchCase(source, replacement) {
    const value = String(replacement || '');
    if (!value) return value;
    if (source === source.toUpperCase()) return value.toUpperCase();
    if (source === source.toLowerCase()) return value.toLowerCase();
    if (source.charAt(0) === source.charAt(0).toUpperCase()) return value;
    return value;
  }

  /**
   * Rewrites player-facing prose only. Use it for existing visible text while
   * migration to semantic text keys happens incrementally. It is deliberately
   * never applied to source, save data, event names, level data, or IDs.
   */
  function rewrite(value) {
    const theme = current();
    let output = String(value ?? '');
    for (const [base, resolveReplacement] of replacementRoles) {
      const replacement = resolveReplacement(theme);
      if (!replacement || replacement === base) continue;
      const pattern = new RegExp(`\\b${escapedPattern(base)}\\b`, 'gi');
      output = output.replace(pattern, match => matchCase(match, replacement));
    }
    return output;
  }

  function rememberRewrittenText(node) {
    if (!rewrittenTextNodes.has(node)) rewrittenTextNodes.set(node, node.nodeValue);
  }

  function rememberRewrittenAttribute(node, attribute) {
    let attributes = rewrittenAttributes.get(node);
    if (!attributes) {
      attributes = new Map();
      rewrittenAttributes.set(node, attributes);
    }
    if (!attributes.has(attribute)) attributes.set(attribute, node.getAttribute(attribute));
  }

  function rewritePresentationNode(node) {
    if (!node || current().id === registry.defaultThemeId || node.closest?.('[data-theme-no-rewrite]')) return;
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const source = node.getAttribute?.(attribute);
      if (!source) continue;
      const next = rewrite(source);
      if (next !== source) {
        rememberRewrittenAttribute(node, attribute);
        node.setAttribute(attribute, next);
      }
    }
  }

  function rewritePresentationAttributes(root) {
    if (!root || current().id === registry.defaultThemeId) return;
    if (root.nodeType === 1) rewritePresentationNode(root);
    root.querySelectorAll?.('[aria-label], [title], [placeholder]').forEach(rewritePresentationNode);
  }

  function restoreCompatibilityMutations() {
    for (const [node, original] of rewrittenTextNodes.entries()) {
      if (node?.isConnected) node.nodeValue = original;
    }
    rewrittenTextNodes.clear();
    for (const [node, attributes] of rewrittenAttributes.entries()) {
      if (!node?.isConnected) continue;
      for (const [attribute, original] of attributes.entries()) {
        if (original === null || original === undefined) node.removeAttribute(attribute);
        else node.setAttribute(attribute, original);
      }
    }
    rewrittenAttributes.clear();
  }

  function isRewritableTextNode(node) {
    if (!node || node.nodeType !== 3 || !node.parentElement) return false;
    const parent = node.parentElement;
    const tag = String(parent.tagName || '').toLowerCase();
    if (['script', 'style', 'textarea', 'code', 'pre'].includes(tag)) return false;
    return !parent.closest?.('[data-theme-no-rewrite]');
  }

  function rewriteTextTree(root) {
    if (!root || typeof document === 'undefined' || !document.createTreeWalker) return;
    const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
    const walker = document.createTreeWalker(root, showText);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!isRewritableTextNode(node)) continue;
      const next = rewrite(node.nodeValue);
      if (next !== node.nodeValue) {
        rememberRewrittenText(node);
        node.nodeValue = next;
      }
    }
    rewritePresentationAttributes(root);
  }

  function themePathValue(theme, path) {
    const value = getPath(theme, path);
    return Array.isArray(value) ? value.join(', ') : value;
  }

  function applyThemeMetadata(doc, theme) {
    doc.querySelectorAll?.('[data-theme-meta]').forEach(node => {
      const path = node.getAttribute('data-theme-meta');
      const value = themePathValue(theme, path);
      if (typeof value === 'string' && value.length) node.setAttribute('content', value);
    });
  }

  function resolveMenuLogo(theme) {
    const logo = theme?.branding?.menuLogo;
    if (!logo || typeof logo !== 'object') return null;
    const src = typeof logo.src === 'string' ? logo.src.trim() : '';
    const themeRoot = `assets/themes/${theme.id}/`;
    if (!src || src.includes('..') || !src.startsWith(themeRoot)) return null;
    const compactSrc = typeof logo.compactSrc === 'string' ? logo.compactSrc.trim() : '';
    if (compactSrc && (compactSrc.includes('..') || !compactSrc.startsWith(themeRoot))) return null;
    const alt = typeof logo.alt === 'string' && logo.alt.trim()
      ? logo.alt.trim()
      : String(theme?.product?.title || '');
    return Object.freeze({ src, compactSrc: compactSrc || null, alt });
  }

  function applyThemeBranding(doc, theme) {
    const logo = resolveMenuLogo(theme);
    doc.querySelectorAll?.('[data-theme-brand-slot="menu"]').forEach(slot => {
      const image = slot.querySelector?.('[data-theme-brand-logo]');
      const compact = slot.querySelector?.('[data-theme-brand-logo-compact]');
      const fallback = slot.querySelector?.('.menu-brand-fallback');
      const showFallback = () => {
        if (compact) compact.removeAttribute('srcset');
        if (image) {
          image.onerror = null;
          image.hidden = true;
          image.removeAttribute('src');
          image.alt = '';
        }
        if (fallback) fallback.hidden = false;
        if (slot.dataset) slot.dataset.brandMode = 'text';
      };
      if (!image || !fallback || !logo) {
        showFallback();
        return;
      }
      image.onerror = showFallback;
      if (compact) {
        if (logo.compactSrc) compact.srcset = logo.compactSrc;
        else compact.removeAttribute('srcset');
      }
      image.src = logo.src;
      image.alt = logo.alt;
      image.hidden = false;
      fallback.hidden = true;
      if (slot.dataset) slot.dataset.brandMode = 'asset';
    });
  }

  function applyThemeAttributes(doc, theme) {
    const root = doc.documentElement;
    if (root?.dataset) {
      root.dataset.gameTheme = theme.id;
      // Legacy Lantern Pond CSS and previous proof URLs remain compatible.
      root.dataset.puzzleBrand = theme.id;
    }
    if (typeof doc.title === 'string') doc.title = theme.product.documentTitle || theme.product.title;
    const themeColor = doc.querySelector?.('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme.product.themeColor);

    doc.querySelectorAll?.('[data-theme-text]').forEach(node => {
      const key = node.getAttribute('data-theme-text');
      node.textContent = template(text(key, node.textContent || ''));
    });
    doc.querySelectorAll?.('[data-theme-template]').forEach(node => {
      const source = node.getAttribute('data-theme-template') || node.textContent || '';
      node.textContent = template(source);
    });
    doc.querySelectorAll?.('[data-theme-icon]').forEach(node => {
      const roleId = node.getAttribute('data-theme-icon');
      node.textContent = icon(roleId, node.textContent || '');
    });
    doc.querySelectorAll?.('[data-theme-attr]').forEach(node => {
      const entries = (node.getAttribute('data-theme-attr') || '').split(';').map(value => value.trim()).filter(Boolean);
      for (const entry of entries) {
        const separator = entry.indexOf('=');
        if (separator <= 0) continue;
        const attribute = entry.slice(0, separator).trim();
        const key = entry.slice(separator + 1).trim();
        if (attribute && key) node.setAttribute(attribute, template(text(key, node.getAttribute(attribute) || '')));
      }
    });
    applyThemeMetadata(doc, theme);
    applyThemeBranding(doc, theme);
  }

  function findInlineSkin(doc, skin) {
    if (!skin || !doc.querySelectorAll) return null;
    return Array.from(doc.querySelectorAll('style[data-froggy-inline-theme-skin]')).find(node => (
      node.getAttribute('data-froggy-inline-theme-skin') === skin
    )) || null;
  }

  function applySkin(doc, theme) {
    const existing = doc.getElementById?.('froggy-theme-skin');
    const skin = theme.presentation?.skin;
    if (!skin) {
      existing?.remove?.();
      return;
    }
    // One-file standalone exports preload scoped theme CSS as inert <style>
    // blocks. Reuse it instead of creating a file://-relative link.
    if (findInlineSkin(doc, skin)) {
      existing?.remove?.();
      return;
    }
    const link = existing || doc.createElement('link');
    link.id = 'froggy-theme-skin';
    link.rel = 'stylesheet';
    link.href = skin;
    if (!existing) doc.head?.appendChild?.(link);
  }

  function disconnectObserver() {
    observer?.disconnect?.();
    observer = null;
  }

  function installObserver(doc) {
    if (current().id === registry.defaultThemeId) {
      disconnectObserver();
      return;
    }
    if (observer || typeof MutationObserver === 'undefined' || !doc.body) return;
    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData' && isRewritableTextNode(record.target)) {
          const next = rewrite(record.target.nodeValue);
          if (next !== record.target.nodeValue) {
            rememberRewrittenText(record.target);
            record.target.nodeValue = next;
          }
        }
        if (record.type === 'childList') {
          record.addedNodes.forEach(node => {
            if (node.nodeType === 3 && isRewritableTextNode(node)) {
              const next = rewrite(node.nodeValue);
              if (next !== node.nodeValue) {
                rememberRewrittenText(node);
                node.nodeValue = next;
              }
            } else if (node.nodeType === 1) {
              rewriteTextTree(node);
            }
          });
        }
      }
    });
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
  }

  function apply(id = resolveId()) {
    const previousThemeId = active?.id || null;
    active = get(id);
    if (typeof globalThis !== 'undefined' && globalThis.ThemeSaveResolver?.observePresentationTheme) {
      globalThis.ThemeSaveResolver.observePresentationTheme(active.id);
    }
    if (typeof document === 'undefined') return active;
    // Applying a theme is already a deliberate full presentation pass. Do not
    // observe our own compatibility rewrites; reconnect only afterward when a
    // non-default theme actually needs the legacy mutation bridge.
    disconnectObserver();
    restoreCompatibilityMutations();
    applyThemeAttributes(document, active);
    applySkin(document, active);
    if (active.id !== registry.defaultThemeId) {
      rewriteTextTree(document.body);
      rewritePresentationAttributes(document);
    }
    installObserver(document);
    if (typeof window !== 'undefined' && previousThemeId && previousThemeId !== active.id && typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('froggy-theme-change', { detail: Object.freeze({ previousThemeId, themeId: active.id }) }));
    }
    return active;
  }

  function list() {
    return registry.themes.slice();
  }

  // Theme Pack v2 deliberately keeps build/export metadata out of this
  // runtime service. These APIs expose presentation lookup only.
  function getRuntimePresentation(themeId = current().id) {
    const theme = get(themeId);
    return theme ? Object.freeze({
      id: theme.id,
      label: theme.label,
      status: theme.status,
      product: theme.product,
      branding: theme.branding || Object.freeze({ menuLogo: null }),
      metadata: theme.metadata,
      presentation: theme.presentation,
      roles: theme.roles,
      text: theme.text,
      modePresentation: theme.modePresentation || {},
      catalogPresentation: theme.catalogPresentation || { characters: {}, cosmetics: {} },
      visualBindings: theme.visualBindings || {},
    }) : null;
  }

  function listRuntimePresentations() {
    return registry.themes.map(theme => getRuntimePresentation(theme.id));
  }

  function getComposition(themeId = current().id) {
    const theme = get(themeId);
    return theme?.composition || Object.freeze({ contentDefaults: {}, visualBindings: theme?.visualBindings || {} });
  }

  function getVisualBinding(roleId, themeId = current().id) {
    const composition = getComposition(themeId);
    return composition?.visualBindings?.[roleId] || get(themeId).visualBindings?.[roleId] || null;
  }

  const api = Object.freeze({
    registry,
    list,
    get,
    current,
    resolveId,
    text,
    setLocale,
    getLocale,
    metadata,
    aria,
    canvasLabel,
    role,
    icon,
    template,
    format,
    rewrite,
    presentCatalogItem,
    apply,
    getComposition,
    getVisualBinding,
    getRuntimePresentation,
    listRuntimePresentations,
  });

  if (typeof globalThis !== 'undefined') {
    globalThis.ThemeSystem = api;
    globalThis.ThemeRegistry = Object.freeze({
      schemaVersion: registry.schemaVersion || 1,
      defaultThemeId: registry.defaultThemeId,
      getRuntimePresentation,
      listRuntimePresentations,
      currentRuntimePresentation: () => getRuntimePresentation(),
    });
    // Public ThemeSystem/ThemeRegistry stay browser APIs; helper functions are
    // declared below as lexical bindings for ESM consumers.
  }

  // Classic scripts load at the end of each HTML body, so static markup exists
  // now. Apply once immediately; later dynamic UI prose is handled by the
  // scoped MutationObserver only for non-base themes.
  apply();

  return api;
})();


// Lightweight helper surface used by canvas and UI modules. Keeping these as
// top-level declarations gives ESM consumers explicit providers while the
// small global publication below preserves the existing public browser API.
function themeText(key, fallback = '') { return ThemeSystem.text(key, fallback); }
function themeAria(key, fallback = '') { return ThemeSystem.aria(key, fallback); }
function themeCanvasLabel(key, fallback = '') { return ThemeSystem.canvasLabel(key, fallback); }
function themeRole(roleId, form = 'singular', fallback = '') { return ThemeSystem.role(roleId, form, fallback); }
function themeIcon(roleId, fallback = '') { return ThemeSystem.icon(roleId, fallback); }
function themeRewrite(value) { return ThemeSystem.rewrite(value); }
function themeCatalogPresentation(kind, definition) { return ThemeSystem.presentCatalogItem(kind, definition); }

if (typeof globalThis !== 'undefined') {
  globalThis.themeText = themeText;
  globalThis.themeAria = themeAria;
  globalThis.themeCanvasLabel = themeCanvasLabel;
  globalThis.themeRole = themeRole;
  globalThis.themeIcon = themeIcon;
  globalThis.themeRewrite = themeRewrite;
  globalThis.themeCatalogPresentation = themeCatalogPresentation;
}
