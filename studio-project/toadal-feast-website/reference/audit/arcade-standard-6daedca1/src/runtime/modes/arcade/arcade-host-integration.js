// ============================================================
// arcade-host-integration.js — polished Arcade <-> full-game bridge
// ============================================================
// Same-origin navigation keeps localStorage, progression, settings, unlocks,
// cosmetics, and scores authoritative in one save. Query inputs are allowlisted
// so a crafted return URL cannot navigate outside the packaged game.

const ArcadeHostIntegration = (() => {
  'use strict';

  const MODE_SETTINGS_KEY = 'froggyFeast.arcade.modeSettings.v1';
  const MODE_SETTINGS_DEFAULTS = Object.freeze({
    catchSounds: true,
    missSounds: true,
    actionSounds: true,
    haptics: true,
    visualIntensity: 'full',
  });

  function normalizeModeSettings(value = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.freeze({
      catchSounds: source.catchSounds !== false,
      missSounds: source.missSounds !== false,
      actionSounds: source.actionSounds !== false,
      haptics: source.haptics !== false,
      visualIntensity: ['full', 'reduced', 'minimal'].includes(source.visualIntensity) ? source.visualIntensity : 'full',
    });
  }

  function readFallbackModeSettings() {
    try {
      const raw = localStorage.getItem(MODE_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function getModeSettings() {
    const manager = typeof SettingsManager !== 'undefined' ? SettingsManager : globalThis.SettingsManager;
    if (typeof manager?.getMode === 'function') {
      try {
        const modeValue = manager.getMode('arcade');
        if (modeValue && typeof modeValue === 'object') return normalizeModeSettings(modeValue);
      } catch (_) { /* the shared mode-settings integration is optional */ }
    }
    return normalizeModeSettings(readFallbackModeSettings());
  }

  function setModeSettings(patch = {}) {
    const next = normalizeModeSettings({ ...getModeSettings(), ...patch });
    const manager = typeof SettingsManager !== 'undefined' ? SettingsManager : globalThis.SettingsManager;
    let persisted = false;
    if (typeof manager?.setMode === 'function') {
      try {
        persisted = Object.entries(patch || {}).length > 0
          && Object.entries(patch).every(([key, value]) => manager.setMode('arcade', key, value) !== false);
      } catch (_) { /* fall through to the local compatibility store */ }
    }
    if (!persisted) {
      try { localStorage.setItem(MODE_SETTINGS_KEY, JSON.stringify(next)); } catch (_) { /* optional storage */ }
    }
    try { globalThis.EventBus?.emit?.('arcadeModeSettingsChanged', { mode: 'arcade', settings: next }); } catch (_) {}
    return next;
  }

  function applyModeSettings(settings = getModeSettings()) {
    const normalized = normalizeModeSettings(settings);
    document.documentElement?.classList?.toggle('arcade-less-flashy', normalized.visualIntensity !== 'full');
    document.documentElement?.setAttribute?.('data-arcade-visual-intensity', normalized.visualIntensity);
    return normalized;
  }

  const params = new URLSearchParams(location.search);
  const MODE_IDS = new Set(['standard', 'tc', 'fmf', 'zen']);
  const RETURN_TARGETS = new Set(['index.html', 'tools/dev-hosts/full/index.html']);
  const CONTEXT_KEY = 'froggyFeast.arcadeHostContext.v1';
  const integrated = params.get('host') === 'full' || params.get('source') === 'full-game';

  function normalizeMode(value) {
    const mode = String(value || 'standard').toLowerCase();
    return MODE_IDS.has(mode) ? mode : 'standard';
  }

  function normalizeReturnTarget(value) {
    const normalized = String(value || '').split(/[?#]/)[0].replace(/^\/+/, '');
    if (RETURN_TARGETS.has(normalized)) return normalized;
    return normalized.endsWith('/index.html') && normalized.includes('tools/dev-hosts/full')
      ? 'tools/dev-hosts/full/index.html'
      : 'index.html';
  }

  const requestedMode = normalizeMode(params.get('mode'));
  const autostart = integrated && params.get('autostart') !== '0';
  const returnTarget = normalizeReturnTarget(params.get('return'));

  function consumeAutostartParam() {
    if (!params.has('autostart') || typeof history === 'undefined' || typeof history.replaceState !== 'function') return false;
    const clean = new URL(location.href);
    clean.searchParams.delete('autostart');
    try {
      history.replaceState(history.state, '', clean.href);
      return true;
    } catch (_) {
      return false;
    }
  }

  function returnUrl(reason = 'menu') {
    const url = new URL('/' + returnTarget.replace(/^\/+/, ''), location.origin);
    url.searchParams.set('returnedFrom', 'arcade');
    url.searchParams.set('arcadeMode', requestedMode);
    url.searchParams.set('reason', String(reason || 'menu').slice(0, 32));
    const theme = params.get('theme');
    if (theme) url.searchParams.set('theme', theme);
    return url;
  }

  function returnToHost(reason = 'menu') {
    if (!integrated) return false;
    try { globalThis.SaveManager?.save?.(); } catch (_) {}
    try { globalThis.SaveManager?.flush?.(); } catch (_) {}
    try {
      sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({
        version: 1,
        returnedAt: Date.now(),
        reason: String(reason || 'menu'),
        mode: String(globalThis.GameState?.currentMode || requestedMode),
        returnPage: returnTarget,
      }));
    } catch (_) {}
    const target = returnUrl(reason);
    if (globalThis.GameTransitionOverlay?.navigate) {
      globalThis.GameTransitionOverlay.navigate(target, { mode: 'return', direction: 'return', wait: 'auto' });
      return true;
    }
    location.assign(target.href);
    return true;
  }

  function installUi() {
    if (!integrated || document.documentElement.dataset.arcadeHostUiInstalled === 'true') return;
    document.documentElement.dataset.arcadeHostUiInstalled = 'true';
    document.body?.classList?.add('arcade-integrated-host');

    const actions = document.querySelector('.standalone-actions');
    if (actions && !document.getElementById('arcadeReturnToFullGame')) {
      const button = document.createElement('button');
      button.id = 'arcadeReturnToFullGame';
      button.type = 'button';
      button.className = 'arcade-host-return-button';
      button.dataset.arcadeHostReturn = 'topbar';
      button.innerHTML = '<span class="ff-ui-icon" data-ui-icon="left" aria-hidden="true"></span><span>Full Game</span>';
      button.addEventListener('click', () => returnToHost('topbar'));
      actions.prepend(button);
    }

    const utility = document.querySelector('.launch-utility-nav');
    if (utility && !utility.querySelector('[data-standalone-action="return-full-game"]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'arcade-host-menu-return';
      button.dataset.standaloneAction = 'return-full-game';
      button.innerHTML = '<span class="ff-ui-icon" data-ui-icon="left" aria-hidden="true"></span><span>Full Game</span>';
      button.addEventListener('click', event => {
        event.preventDefault();
        returnToHost('menu-utility');
      });
      utility.prepend(button);
    }
  }

  function resultMenuLabel() {
    return integrated ? 'Full Game Menu' : 'Arcade Menu';
  }

  return Object.freeze({
    integrated,
    requestedMode,
    autostart,
    returnTarget,
    normalizeMode,
    returnUrl,
    returnToHost,
    installUi,
    consumeAutostartParam,
    resultMenuLabel,
    MODE_SETTINGS_KEY,
    MODE_SETTINGS_DEFAULTS,
    normalizeModeSettings,
    getModeSettings,
    setModeSettings,
    applyModeSettings,
    CONTEXT_KEY,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeHostIntegration = ArcadeHostIntegration;
