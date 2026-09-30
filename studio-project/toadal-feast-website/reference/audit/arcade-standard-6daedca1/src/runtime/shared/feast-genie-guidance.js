// Feast Genie guidance persistence. Player preference is owned by SettingsManager;
// this module stores only bounded tutorial mastery/dismissal/interruption history.
(function (root) {
  'use strict';

  const KEY = 'feastGenie';
  const VERSION = 2;
  const CHOICES = new Set(['full', 'helpful', 'off']);
  const record = value => value && typeof value === 'object' && !Array.isArray(value);

  function manager() {
    try { if (typeof SettingsManager !== 'undefined') return SettingsManager; } catch (_) {}
    return root.SettingsManager || null;
  }
  function liveSettings() {
    try { if (typeof SETTINGS !== 'undefined') return SETTINGS; } catch (_) {}
    return root.SETTINGS || null;
  }
  function saveManager() {
    try { if (typeof SaveManager !== 'undefined') return SaveManager; } catch (_) {}
    return root.SaveManager || null;
  }

  function normalize(value) {
    const source = record(value) ? value : {};
    const mastered = {};
    const dismissals = {};
    if (record(source.mastered)) {
      Object.keys(source.mastered).slice(0, 256).forEach(key => {
        const bounded = String(key).slice(0, 100);
        if (source.mastered[key] === true && bounded) mastered[bounded] = true;
      });
    }
    if (record(source.dismissals)) {
      Object.keys(source.dismissals).slice(0, 128).forEach(key => {
        const bounded = String(key).slice(0, 100);
        const values = Array.isArray(source.dismissals[key]) ? source.dismissals[key] : [];
        dismissals[bounded] = values.filter(Number.isFinite).map(Number).slice(-4);
      });
    }
    const automatic = Array.isArray(source.automatic)
      ? source.automatic.filter(Number.isFinite).map(Number).slice(-16)
      : [];
    return { version: VERSION, mastered, dismissals, automatic };
  }

  function saveRead() {
    try { return saveManager()?.get?.()?.settings?.[KEY]; } catch (_) { return null; }
  }
  function load() { return normalize(saveRead()); }
  function write(next) {
    const normalized = normalize(next);
    try {
      saveManager()?.set?.(data => {
        if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) data.settings = {};
        data.settings[KEY] = normalized;
      });
    } catch (_) {}
    return normalized;
  }

  function preference() {
    const settings = manager();
    try {
      if (settings?.get?.('tutorialHints') === false) return 'off';
      const configured = settings?.get?.('feastGeniePreference');
      return CHOICES.has(configured) ? configured : 'helpful';
    } catch (_) {
      const live = liveSettings();
      if (live?.tutorialHints === false) return 'off';
      return CHOICES.has(live?.feastGeniePreference) ? live.feastGeniePreference : 'helpful';
    }
  }

  function setPreference(value) {
    const normalized = String(value || '').toLowerCase();
    if (!CHOICES.has(normalized)) return false;
    const settings = manager();
    if (settings?.set) return settings.set('feastGeniePreference', normalized) !== false;
    const live = liveSettings();
    if (live) live.feastGeniePreference = normalized;
    return false;
  }

  function markMastery(id) {
    const key = String(id || '').slice(0, 100);
    if (!key) return false;
    const state = load();
    if (state.mastered[key]) return true;
    write({ ...state, mastered: { ...state.mastered, [key]: true } });
    return true;
  }

  function mastered(id) { return !!load().mastered[String(id || '')]; }

  function recordDismissal(id, now = Date.now()) {
    const key = String(id || '').slice(0, 100);
    if (!key) return [];
    const state = load();
    const list = (state.dismissals[key] || []).concat(Number(now)).filter(Number.isFinite).slice(-4);
    write({ ...state, dismissals: { ...state.dismissals, [key]: list } });
    return list;
  }

  function suppressed(id) {
    const list = load().dismissals[String(id || '')] || [];
    return list.length >= 2;
  }

  // Only *visible* automatic guidance consumes the anti-annoyance budget.
  // Silent discovery tracking does not count as an interruption.
  function recordVisibleAutomatic(now = Date.now()) {
    const state = load();
    write({ ...state, automatic: state.automatic.concat(Number(now)).filter(Number.isFinite).slice(-16) });
  }
  function recentVisible(now = Date.now(), windowMs = 30000) {
    return load().automatic.some(t => now - t < windowMs);
  }
  function automaticBudget(now = Date.now()) {
    return load().automatic.filter(t => now - t < 120000).length < 3;
  }

  // Migrate the old nested preference once if a prior Genie prototype wrote it
  // before the canonical SettingsManager preference existed.
  try {
    const sm = saveManager();
    const settings = sm?.get?.()?.settings;
    const canonicalMissing = settings && !Object.prototype.hasOwnProperty.call(settings, 'feastGeniePreference');
    const legacyPreference = settings?.[KEY]?.preference;
    if (canonicalMissing && CHOICES.has(legacyPreference)) manager()?.set?.('feastGeniePreference', legacyPreference);
  } catch (_) {}

  root.FeastGenieGuidance = Object.freeze({
    key: KEY,
    normalize,
    load,
    preference,
    setPreference,
    markMastery,
    mastered,
    recordDismissal,
    suppressed,
    recordVisibleAutomatic,
    recentVisible,
    automaticBudget,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
