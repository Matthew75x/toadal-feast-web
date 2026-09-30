// ============================================================
// standalone-audio.js — Mode-neutral local audio helper
// Provides a small, offline-safe audio preference surface for the three
// standalone packages. It never owns gameplay cues; each mode continues to
// call AudioManager through its own game systems.
// ============================================================

const StandaloneAudio = (() => {
  const DEFAULT_MASTER = 0.8;
  let initialized = false;
  let lastAudibleMaster = DEFAULT_MASTER;

  function storageKey() {
    const raw = document.body?.dataset?.standaloneAudioKey;
    const baseKey = raw ? String(raw) : 'froggyFeastStandalone.audio.v1';
    return typeof ThemeSaveResolver !== 'undefined'
      ? ThemeSaveResolver.key(baseKey, { consumer: 'standalone-audio' })
      : baseKey;
  }

  function clamp(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : fallback;
  }

  function normalize(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const volumes = source.volumes && typeof source.volumes === 'object' ? source.volumes : {};
    const master = clamp(volumes.master, DEFAULT_MASTER);
    const next = {
      master,
      sfx: clamp(volumes.sfx, 0.86),
      bgm: clamp(volumes.bgm, 0.62),
      menu: clamp(volumes.menu, 0.72),
    };
    return {
      volumes: next,
      lastAudibleMaster: Math.max(0.05, clamp(source.lastAudibleMaster, master || DEFAULT_MASTER)),
    };
  }

  function read() {
    try {
      return normalize(JSON.parse(localStorage.getItem(storageKey()) || 'null'));
    } catch (_) {
      return normalize(null);
    }
  }

  function write(volumes) {
    const current = normalize({ volumes, lastAudibleMaster });
    lastAudibleMaster = current.lastAudibleMaster;
    try { localStorage.setItem(storageKey(), JSON.stringify(current)); } catch (_) { /* local persistence is optional */ }
    return current;
  }

  function manager() {
    return typeof AudioManager !== 'undefined' ? AudioManager : null;
  }

  function getVolumes() {
    const audio = manager();
    if (audio?.getVolumes) return normalize({ volumes: audio.getVolumes(), lastAudibleMaster }).volumes;
    return read().volumes;
  }

  function syncSavedPreference() {
    const saved = read();
    lastAudibleMaster = saved.lastAudibleMaster;
    const audio = manager();
    if (audio?.setVolumes) audio.setVolumes(saved.volumes);
    return saved;
  }

  function init() {
    if (initialized) return getState();
    initialized = true;
    syncSavedPreference();
    return getState();
  }

  function activate({ cue = false } = {}) {
    init();
    const audio = manager();
    if (!audio) return getState();
    try {
      // AudioManager.activate is the gesture-safe path that resumes the
      // context and starts the currently selected music scene. Keep the
      // legacy init/resume fallback for older packaged shells.
      if (typeof audio.activate === 'function') audio.activate();
      else {
        audio.init?.();
        audio.resume?.();
      }
    } catch (_) {}
    if (cue) {
      try { audio.click?.({ volume: 0.28, pitchShift: 1.0 }); } catch (_) {}
    }
    return getState();
  }

  function setVolumes(patch = {}) {
    init();
    const next = { ...getVolumes(), ...patch };
    next.master = clamp(next.master, DEFAULT_MASTER);
    next.sfx = clamp(next.sfx, 0.86);
    next.bgm = clamp(next.bgm, 0.62);
    next.menu = clamp(next.menu, 0.72);
    if (next.master > 0.001) lastAudibleMaster = next.master;
    manager()?.setVolumes?.(next);
    write(next);
    return getState();
  }

  function toggleMuted() {
    // Do not resume a suspended AudioContext here: pause-menu audio controls
    // must not restart a paused run's background audio. The next real gameplay
    // input activates the context through the normal AudioManager path.
    init();
    const current = getVolumes();
    const muted = current.master <= 0.001;
    const nextMaster = muted ? Math.max(0.05, lastAudibleMaster || DEFAULT_MASTER) : 0;
    return setVolumes({ master: nextMaster });
  }

  function getState() {
    const volumes = getVolumes();
    return Object.freeze({
      volumes: { ...volumes },
      muted: volumes.master <= 0.001,
      label: volumes.master <= 0.001 ? 'Audio Muted' : 'Audio',
      initialized,
    });
  }

  function syncButton(button) {
    if (!button) return getState();
    const state = getState();
    const label = button.querySelector?.('[data-standalone-audio-label]');
    if (label) label.textContent = state.label;
    else button.textContent = state.label;
    button.setAttribute?.('aria-pressed', state.muted ? 'true' : 'false');
    button.setAttribute?.('aria-label', state.muted ? 'Unmute audio' : 'Mute audio');
    return state;
  }

  return Object.freeze({ init, activate, setVolumes, toggleMuted, getState, getVolumes, syncButton });
})();

if (typeof globalThis !== 'undefined') globalThis.StandaloneAudio = StandaloneAudio;
