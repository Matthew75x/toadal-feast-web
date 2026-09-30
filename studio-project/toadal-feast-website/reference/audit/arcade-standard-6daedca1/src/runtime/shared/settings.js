// ============================================================
// src/runtime/shared/settings.js — Player-facing Settings
// Load order: after src/runtime/shared/systems.js, before game.js
// Creates globals: SettingsManager, SETTINGS
// ============================================================
//
// PURPOSE
// -------
// Owns every preference a normal player might want to change:
// accessibility, display, gameplay feel, audio, and data management.
// Deliberately separate from TWEAK (balance/debug) and GAME_BALANCE
// (gameplay constants). Nothing in here changes difficulty numbers —
// those live in src/runtime/shared/balance.js / modes.js.
//
// HOW IT PLUGS IN
// ---------------
// game.js and game-draw.js read SETTINGS.* directly where needed:
//   SETTINGS.reduceMotion    — suppresses screen shake + particles
//   SETTINGS.showFPS         — draws FPS counter in game HUD
//   SETTINGS.missesTooltip   — show miss counter tooltip in HUD
//   SETTINGS.mobileDifficulty — passed into applyTweaks() gating
//   SETTINGS.hapticFeedback  — navigator.vibrate() calls gated here
//   SETTINGS.entityGlowEffects — bomb/heart/sun/power-up glow halo in drawFoods(),
//                                 plus the frog's own big-size/blood/gem/crown glow
//
// Audio volumes are still owned by AudioManager / SaveManager.audio,
// but the Settings panel exposes them in one unified place so players
// don't need a separate Audio panel.
// ============================================================

// ── Contextual mode defaults ──────────────────────────────────────────────
// Mode preferences live below settings.modes.  They deliberately do not
// share a flat namespace: changing Arcade haptics must never change Puzzle
// haptics, and changing Infinite performance must never alter Puzzle quality.
const SETTINGS_MODE_DEFAULTS = Object.freeze({
  puzzle: Object.freeze({
    frogAnimation: 'full',
    rewardedRecoveryOffers: false,
  }),
  arcade: Object.freeze({
    catchSounds: true,
    missSounds: true,
    actionSounds: true,
    haptics: true,
    visualIntensity: 'full',
    hudTheme: 'classic',
  }),
  feastfall: Object.freeze({
    sound: true,
    haptics: true,
    glows: true,
    reduceMotion: false,
  }),
  infinite: Object.freeze({
    colonySounds: true,
    animationDensity: 'full',
    performance: 'auto',
  }),
});

const SETTINGS_MODE_CHOICES = Object.freeze({
  puzzle: Object.freeze({ frogAnimation: Object.freeze(['full', 'reduced', 'static']) }),
  arcade: Object.freeze({
    visualIntensity: Object.freeze(['full', 'reduced', 'minimal']),
    hudTheme: Object.freeze(['classic', 'garden', 'luminous', 'astro']),
  }),
  infinite: Object.freeze({
    animationDensity: Object.freeze(['full', 'reduced', 'minimal']),
    performance: Object.freeze(['auto', 'balanced', 'saver']),
  }),
});
const SETTINGS_MODES = Object.freeze(Object.keys(SETTINGS_MODE_DEFAULTS));

// ── Default values ────────────────────────────────────────────────────────
const SETTINGS_DEFAULTS = {
  // ── Gameplay ──────────────────────────────────────────────
  mobileDifficulty:   true,   // touch-comfort density/reach protection (auto-detected at boot; bombs and fall speed stay unchanged)
  missPenalty:        true,   // losing a life on missed food
  ghostFrames:        true,   // brief invincibility frames after taking damage
  tutorialHints:      true,   // first-catch / level-up tip overlays
  feastGeniePreference:'helpful', // contextual Genie guidance: full / helpful / off
  puzzleStoryDialogue:false,  // campaign story dialogue is opt-in for now; off keeps Puzzle level starts immediate
  puzzleQuality:      'high',  // Puzzle renderer profile; shared so reset/export/import stay coherent

  // ── Display ───────────────────────────────────────────────
  showFPS:            false,  // FPS counter in top-right corner during play
  assetTheme:         'default', // presentation theme: default / dark-theme
  reduceMotion:       false,  // suppress screen shake + burst particles
  entityGlowEffects:  true,   // glow halo on bombs/hearts/suns/power-ups + frog's own glow states; off = a little cheaper to render
  favouriteFoodHints: true,   // subtle ring/sparkle around the selected character's favourite foods
  colorVisionMode:    'standard', // authored visual-assist palette: standard / protanopia / deuteranopia / tritanopia
  patternAssist:      false,  // add non-colour markers/textures to gameplay-critical visual roles
  highContrastMode:   false,  // strengthen gameplay-plane outlines and backing surfaces without changing rules
  showPuzzleCellNumbers: false, // show explicit −1 / 0 / +1 cell numbers in Puzzle Mode
  puzzlePatternOverlays: false, // add non-colour Puzzle cell markers for accessibility
  showPuzzleFrogGroundCue: true, // show the optional ground ring beneath the Puzzle frog

  // ── Controls (mobile) ─────────────────────────────────────
  hapticFeedback:     true,   // vibrate on catch / miss (touch only)
  mobileControls: {
    controlStyle: 'auto',
    visibilityMode: 'minimal',
    actionStyle: 'smart',
    controlHints: true,
  },

  // Contextual preferences are persisted as one namespaced object.  Keep the
  // object in the live SETTINGS projection so mode hosts can read it without
  // creating a second persistence authority.
  modes: SETTINGS_MODE_DEFAULTS,

  // ── Data ──────────────────────────────────────────────────
  // No boolean flags here — export/import/reset are actions, not persisted state
};

// Player save imports are intentionally bounded. A normal save is measured in
// kilobytes; multi-megabyte or extremely deep documents are malformed for this
// game and can otherwise freeze JSON parsing/normalization or exhaust storage.
const SETTINGS_IMPORT_MAX_CHARS = 2 * 1024 * 1024;
const SETTINGS_IMPORT_MAX_DEPTH = 32;
const SETTINGS_IMPORT_MAX_NODES = 100_000;
const SETTINGS_IMPORT_UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

// ── Unsigned-import provenance policy (single isolated decision point) ──────
// An unsigned manual save import is UNTRUSTED data. It may restore progression
// (levels/stars/coins/stats), but it must never establish externally-verified
// value:
//   * Entitlements (paid store ownership) are NEVER imported — this is LOCKED
//     (SECURITY_DECISION_REGISTER: "Imported save cannot establish IAP/purchase
//     provenance"). The device keeps its own entitlements; paid ownership is
//     re-established only through store receipt restoration.
//   * Jeweled Candy is the premium currency. Whether an unsigned import may
//     INCREASE locally-earned Candy is OWNER DECISION #4 — still OPEN. The
//     security-favoring default is NO (import may not raise Candy above the
//     device's current balance). Flip this ONLY via a deliberate owner decision;
//     do not decide it implicitly elsewhere.
const UNSIGNED_IMPORT_MAY_INCREASE_CANDY = false; // OWNER DECISION #4 (default: NO)

const SETTINGS_COLOR_VISION_MODES = Object.freeze(['standard','protanopia','deuteranopia','tritanopia']);
const SETTINGS_PUZZLE_QUALITY_MODES = Object.freeze(['high','balanced','low']);
const SETTINGS_MOBILE_CONTROL_DEFAULTS = Object.freeze({ controlStyle:'auto', visibilityMode:'minimal', actionStyle:'smart', controlHints:true });
const SETTINGS_MOBILE_CONTROL_LEGACY_KEYS = Object.freeze([
  'froggyFeast.mobileControls.controlStyle.v1',
  'froggyFeast.mobileControls.visibility.v1',
  'froggyFeast.mobileControls.actionStyle.v1',
]);

function settingsNormalizedValue(key, value) {
  if (!Object.prototype.hasOwnProperty.call(SETTINGS_DEFAULTS, key)) return SETTINGS_DEFAULTS[key];
  const fallback = SETTINGS_DEFAULTS[key];
  if (key === 'feastGeniePreference') {
    const normalized = String(value || '').toLowerCase();
    return ['full', 'helpful', 'off'].includes(normalized) ? normalized : fallback;
  }
  if (key === 'colorVisionMode') {
    const normalized = String(value || '').toLowerCase();
    return SETTINGS_COLOR_VISION_MODES.includes(normalized) ? normalized : fallback;
  }
  if (key === 'assetTheme') {
    const normalized = String(value || '').toLowerCase();
    return ['default', 'dark-theme'].includes(normalized) ? normalized : fallback;
  }
  if (key === 'puzzleQuality') {
    const normalized = String(value || '').toLowerCase();
    return SETTINGS_PUZZLE_QUALITY_MODES.includes(normalized) ? normalized : fallback;
  }
  if (key === 'mobileControls') {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      controlStyle: ['auto','one-hand','two-hands'].includes(source.controlStyle) ? source.controlStyle : SETTINGS_MOBILE_CONTROL_DEFAULTS.controlStyle,
      visibilityMode: ['minimal','faint','analog','fixed','buttons','full'].includes(source.visibilityMode) ? source.visibilityMode : SETTINGS_MOBILE_CONTROL_DEFAULTS.visibilityMode,
      actionStyle: ['smart','toggle','hold'].includes(source.actionStyle) ? source.actionStyle : SETTINGS_MOBILE_CONTROL_DEFAULTS.actionStyle,
      controlHints: typeof source.controlHints === 'boolean' ? source.controlHints : SETTINGS_MOBILE_CONTROL_DEFAULTS.controlHints,
    };
  }
  if (key === 'modes') return normalizeModeSettings(value);
  return typeof value === typeof fallback ? value : fallback;
}

function normalizeModeName(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  return SETTINGS_MODES.includes(normalized) ? normalized : null;
}

function normalizeModeSetting(mode, key, value) {
  const normalizedMode = normalizeModeName(mode);
  if (!normalizedMode || !Object.prototype.hasOwnProperty.call(SETTINGS_MODE_DEFAULTS[normalizedMode], key)) return undefined;
  const fallback = SETTINGS_MODE_DEFAULTS[normalizedMode][key];
  const choices = SETTINGS_MODE_CHOICES[normalizedMode]?.[key];
  if (choices) {
    const candidate = String(value ?? '').trim().toLowerCase();
    return choices.includes(candidate) ? candidate : fallback;
  }
  return typeof value === typeof fallback ? value : fallback;
}

function normalizeModeSettings(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const normalized = {};
  for (const mode of SETTINGS_MODES) {
    const savedMode = source[mode] && typeof source[mode] === 'object' && !Array.isArray(source[mode])
      ? source[mode] : {};
    normalized[mode] = {};
    for (const key of Object.keys(SETTINGS_MODE_DEFAULTS[mode])) {
      normalized[mode][key] = normalizeModeSetting(mode, key, savedMode[key]);
    }
  }
  return normalized;
}

function migrateModeSettings(saved) {
  const candidates = [saved.modes, saved.modeSettings, saved.contextualModes];
  const source = candidates.find(value => value && typeof value === 'object' && !Array.isArray(value)) || {};
  const migratedSource = {};
  let migrated = !Object.prototype.hasOwnProperty.call(saved, 'modes');
  for (const mode of SETTINGS_MODES) {
    migratedSource[mode] = { ...(source[mode] || {}) };
    for (const key of Object.keys(SETTINGS_MODE_DEFAULTS[mode])) {
      // Accept the short-lived flat names used by pre-namespaced prototypes,
      // but write only the canonical settings.modes shape going forward.
      const legacyKey = `${mode}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      if (migratedSource[mode][key] === undefined && saved[legacyKey] !== undefined) {
        migratedSource[mode][key] = saved[legacyKey];
        migrated = true;
      }
    }
  }
  const normalized = normalizeModeSettings(migratedSource);
  if (JSON.stringify(normalized) !== JSON.stringify(source)) migrated = true;
  return { normalized, migrated };
}

function settingsValidateImportStructure(root) {
  const stack = [{ value: root, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop();
    nodes += 1;
    if (nodes > SETTINGS_IMPORT_MAX_NODES) return { ok: false, error: 'Save data contains too many values.' };
    if (depth > SETTINGS_IMPORT_MAX_DEPTH) return { ok: false, error: 'Save data is nested too deeply.' };
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) stack.push({ value: value[index], depth: depth + 1 });
      continue;
    }
    for (const key of Object.keys(value)) {
      if (SETTINGS_IMPORT_UNSAFE_KEYS.has(key)) return { ok: false, error: `Save data contains an unsafe key: ${key}.` };
      stack.push({ value: value[key], depth: depth + 1 });
    }
  }
  return { ok: true };
}

// ── SettingsManager ───────────────────────────────────────────────────────
// Thin wrapper around SaveManager so settings persist alongside save data.
// Uses the 'settings' sub-key inside the existing save blob — no new storage.
const SettingsManager = (() => {

  function _ensure(d) {
    if (!d.settings) d.settings = {};
    return d.settings;
  }

  // Merge saved settings over defaults — unknown keys in save are ignored,
  // new defaults are picked up automatically on first load after an update.
  function load() {
    const save = SaveManager.get();
    const saved = _ensure(save);
    let migrated = false;
    const modeMigration = migrateModeSettings(saved);
    if (modeMigration.migrated) migrated = true;
    const legacyQuality = save.puzzleProgress?.puzzleNext?.quality;
    if (!SETTINGS_PUZZLE_QUALITY_MODES.includes(String(saved.puzzleQuality || '').toLowerCase()) && SETTINGS_PUZZLE_QUALITY_MODES.includes(String(legacyQuality || '').toLowerCase())) {
      saved.puzzleQuality = String(legacyQuality).toLowerCase();
      migrated = true;
    }
    const existingControls = saved.mobileControls && typeof saved.mobileControls === 'object' && !Array.isArray(saved.mobileControls)
      ? saved.mobileControls : {};
    const legacyControls = {};
    try {
      legacyControls.controlStyle = localStorage.getItem(SETTINGS_MOBILE_CONTROL_LEGACY_KEYS[0]);
      legacyControls.visibilityMode = localStorage.getItem(SETTINGS_MOBILE_CONTROL_LEGACY_KEYS[1]);
      legacyControls.actionStyle = localStorage.getItem(SETTINGS_MOBILE_CONTROL_LEGACY_KEYS[2]);
    } catch (_) {}
    // Migrate each legacy preference independently. A canonical field always
    // wins, including an explicitly stored (but later-normalized) value.
    const migratedControls = { ...existingControls };
    const controlFields = ['controlStyle', 'visibilityMode', 'actionStyle'];
    for (const field of controlFields) {
      if (migratedControls[field] == null && legacyControls[field] != null) {
        migratedControls[field] = legacyControls[field];
        migrated = true;
      }
    }
    if (migrated && controlFields.some(field => migratedControls[field] !== undefined)) {
      saved.mobileControls = migratedControls;
    }
    if (migrated) {
      try {
        SaveManager.set(d => {
          d.settings = {
            ...(d.settings || {}),
            puzzleQuality: saved.puzzleQuality,
            mobileControls: saved.mobileControls,
            modes: modeMigration.normalized,
          };
        });
      } catch (_) {}
    }
    const merged = {};
    for (const key of Object.keys(SETTINGS_DEFAULTS)) merged[key] = settingsNormalizedValue(key, saved[key]);
    // Use the just-normalized migration result even when SaveManager returns a
    // snapshot, so the first boot immediately exposes complete mode defaults.
    merged.modes = modeMigration.normalized;
    if (typeof saved.showPuzzleCellNumbers !== 'boolean' && typeof saved.puzzlePathCues === 'string') {
      merged.showPuzzleCellNumbers = saved.puzzlePathCues === 'detailed';
    }
    return merged;
  }

  function get(key) {
    return load()[key];
  }

  function set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(SETTINGS_DEFAULTS, key)) return false;
    const normalized = settingsNormalizedValue(key, value);
    SaveManager.set(d => { _ensure(d)[key] = normalized; });
    // Keep the live SETTINGS object in sync so game code reading it
    // doesn't need to re-call load() on every frame.
    SETTINGS[key] = normalized;
    EventBus.emit('settingChanged', { key, value: normalized });
    return true;
  }

  // Return a detached mode object. Callers cannot accidentally mutate another
  // mode or bypass SaveManager by retaining the live SETTINGS reference.
  function getMode(mode) {
    const normalizedMode = normalizeModeName(mode);
    if (!normalizedMode) return null;
    const modes = load().modes || normalizeModeSettings();
    return structuredClone(modes[normalizedMode]);
  }

  function setMode(mode, key, value) {
    const normalizedMode = normalizeModeName(mode);
    const normalizedValue = normalizeModeSetting(normalizedMode, key, value);
    if (!normalizedMode || normalizedValue === undefined) return false;
    SaveManager.set(d => {
      const settings = _ensure(d);
      const modes = normalizeModeSettings(settings.modes);
      modes[normalizedMode][key] = normalizedValue;
      settings.modes = modes;
    });
    if (!SETTINGS.modes || typeof SETTINGS.modes !== 'object') SETTINGS.modes = normalizeModeSettings();
    if (!SETTINGS.modes[normalizedMode]) SETTINGS.modes[normalizedMode] = {};
    SETTINGS.modes[normalizedMode][key] = normalizedValue;
    EventBus.emit('modeSettingChanged', { mode: normalizedMode, key, value: normalizedValue });
    // Keep legacy engine-facing globals alive while hosts migrate to getMode.
    EventBus.emit('settingChanged', { key: `modes.${normalizedMode}.${key}`, mode: normalizedMode, value: normalizedValue });
    return true;
  }

  function reset() {
    SaveManager.set(d => { d.settings = structuredClone(SETTINGS_DEFAULTS); });
    for (const key of SETTINGS_MOBILE_CONTROL_LEGACY_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
    Object.assign(SETTINGS, structuredClone(SETTINGS_DEFAULTS));
    // Re-apply touch default
    if (!(('ontouchstart' in window) || navigator.maxTouchPoints > 0)) {
      SETTINGS.mobileDifficulty = false;
      SaveManager.set(d => { d.settings.mobileDifficulty = false; });
    }
    globalThis.FroggyMobileControls?.resetPreferences?.();
    EventBus.emit('settingsReset');
  }

  // ── Save export ────────────────────────────────────────────────────────
  // Returns the full save blob as a pretty-printed JSON string the player
  // can copy and store somewhere safe.
  function exportSave() {
    return JSON.stringify(SaveManager.get(), null, 2);
  }

  // ── Save import ────────────────────────────────────────────────────────
  // Accepts a JSON string, validates the top-level shape, and overwrites
  // localStorage.  Returns { ok, error }.
  function importSave(jsonStr) {
    const source = String(jsonStr ?? '');
    if (source.length > SETTINGS_IMPORT_MAX_CHARS) {
      return { ok: false, error: 'Save data is too large to import safely.' };
    }
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch (e) {
      return { ok: false, error: 'Invalid JSON — could not parse.' };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: 'Save data must be a JSON object.' };
    }
    const structure = settingsValidateImportStructure(parsed);
    if (!structure.ok) return structure;
    // Require at least one recognisable key so we don't import garbage.
    const knownKeys = [
      'version', 'leaderboard', 'bestScore', 'bestScoresByRuleset', 'selectedChar', 'unlockedChars',
      'achievements', 'stats', 'settings', 'coins', 'puzzleProgress',
      'infiniteProgress', 'connect3Progress', 'dailyGoals', 'infiniteGoldExchange',
    ];
    const hasKnown = knownKeys.some(k => Object.prototype.hasOwnProperty.call(parsed, k));
    if (!hasKnown) {
      return { ok: false, error: 'This doesn\'t look like a TOADAL FEAST! save file.' };
    }
    // An imported version above the runtime schema would put every later boot
    // into permanent read-only mode with no in-game explanation. This runtime
    // can only honestly import saves at or below its own schema.
    if (Object.prototype.hasOwnProperty.call(parsed, 'version')) {
      const importVersion = Number(parsed.version);
      if (!Number.isFinite(importVersion) || importVersion < 0 || importVersion > SaveManager.version) {
        return { ok: false, error: `This save was written by a newer version of the game (schema ${String(parsed.version)}). Update the game before importing it.` };
      }
    }
    // Provenance separation: an unsigned import restores progression but can
    // never establish externally-verified value. Read the device's current save
    // so paid ownership and the Candy ceiling come from it, not the import.
    let current = {};
    try {
      const currentRaw = localStorage.getItem(SaveManager.KEY);
      const decoded = currentRaw ? JSON.parse(currentRaw) : null;
      if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) current = decoded;
    } catch (_) { current = {}; }
    // Entitlements (paid ownership) are NEVER established by an import — LOCKED: keep
    // the device's own entitlements and discard whatever the import carried.
    if (current.entitlements && typeof current.entitlements === 'object' && !Array.isArray(current.entitlements)) {
      parsed.entitlements = current.entitlements;
    } else {
      delete parsed.entitlements;
    }
    // Candy: unless the owner has enabled it (OWNER DECISION #4, default NO), an
    // unsigned import may not INCREASE Candy above the device's current balance.
    if (!UNSIGNED_IMPORT_MAY_INCREASE_CANDY && Object.prototype.hasOwnProperty.call(parsed, 'candy')) {
      const importedCandy = Math.max(0, Math.floor(Number(parsed.candy) || 0));
      const currentCandy = Math.max(0, Math.floor(Number(current.candy) || 0));
      parsed.candy = Math.min(importedCandy, currentCandy);
    }
    // External-value transaction provenance (`iap:*` ledger identities) is
    // NEVER established by an unsigned import: a crafted `iap:*` tombstone
    // would either masquerade as store-verified value or silently block a
    // later legitimate store reconciliation with a DUPLICATE. Strip every
    // imported `iap:*` record; carry the device's own `iap:*` records forward
    // so its kept entitlements stay backed by their receipts. Local-progression
    // ledger identities (scores, achievements, purchases of earned currency)
    // restore freely with the progression they describe.
    const importedLedger = parsed.economyLedger && typeof parsed.economyLedger === 'object' && !Array.isArray(parsed.economyLedger)
      ? parsed.economyLedger : null;
    const importedApplied = importedLedger && importedLedger.applied && typeof importedLedger.applied === 'object' && !Array.isArray(importedLedger.applied)
      ? importedLedger.applied : null;
    if (importedApplied) {
      for (const id of Object.keys(importedApplied)) {
        if (id.startsWith('iap:')) delete importedApplied[id];
      }
    }
    const currentApplied = current.economyLedger && typeof current.economyLedger === 'object' && !Array.isArray(current.economyLedger)
      && current.economyLedger.applied && typeof current.economyLedger.applied === 'object' && !Array.isArray(current.economyLedger.applied)
      ? current.economyLedger.applied : null;
    if (currentApplied) {
      const deviceIap = {};
      for (const id of Object.keys(currentApplied)) {
        if (id.startsWith('iap:')) deviceIap[id] = currentApplied[id];
      }
      if (Object.keys(deviceIap).length) {
        if (importedApplied) Object.assign(importedApplied, deviceIap);
        else if (importedLedger) importedLedger.applied = deviceIap;
        else parsed.economyLedger = { applied: deviceIap };
      }
    }
    // In-flight Candy-assist reservations are same-device crash-recovery
    // state, not portable value: an imported list would be "refunded" by the
    // next boot's recovery pass, minting Candy past the ceiling above. Imports
    // never carry reservations (an in-flight assist on either side of the
    // import is forfeited, never multiplied — fail closed).
    delete parsed.candyReservations;
    try {
      // Preserve the outgoing save: quarantine-style copy beside the primary
      // so an accidental import is recoverable.
      try {
        const outgoing = localStorage.getItem(SaveManager.KEY);
        if (typeof outgoing === 'string' && outgoing) localStorage.setItem(SaveManager.KEY + '.pre-import', outgoing);
      } catch (_) {}
      localStorage.setItem(SaveManager.KEY, JSON.stringify(parsed));
      for (const key of SETTINGS_MOBILE_CONTROL_LEGACY_KEYS) localStorage.removeItem(key);
    } catch (e) {
      return { ok: false, error: 'Could not write to localStorage: ' + e.message };
    }
    // Force a page reload so all systems re-initialise from the new save.
    location.reload();
    return { ok: true };
  }

  // ── Progress reset ─────────────────────────────────────────────────────
  function resetProgress() {
    // A deliberate factory reset removes the recovery/quarantine siblings too;
    // leaving them would both waste quota and let the next boot resurrect the
    // save the player explicitly asked to erase.
    for (const key of [SaveManager.KEY, SaveManager.KEY + '.lkg', SaveManager.KEY + '.corrupt', SaveManager.KEY + '.pre-import']) {
      try { localStorage.removeItem(key); } catch(e) {}
    }
    for (const key of SETTINGS_MOBILE_CONTROL_LEGACY_KEYS) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
    location.reload();
  }

  return { load, get, set, getMode, setMode, reset, exportSave, importSave, resetProgress };
})();

// ── Live settings object ──────────────────────────────────────────────────
// Game code reads from SETTINGS.* directly — no function call needed per frame.
// SettingsManager.set() keeps this in sync whenever a value changes.
let SETTINGS = SettingsManager.load();

// Auto-correct mobileDifficulty for non-touch environments at boot —
// same logic as TWEAK.mobileDifficulty in game.js so they stay aligned.
if (!(('ontouchstart' in window) || navigator.maxTouchPoints > 0)) {
  if (SETTINGS.mobileDifficulty !== false) {
    SETTINGS.mobileDifficulty = false;
    try { SaveManager.set(d => { d.settings.mobileDifficulty = false; }); } catch (_) {}
  }
}

// ── Haptic helper ─────────────────────────────────────────────────────────
// Call from any catch / miss / damage handler. No-ops silently on desktop
// or when the player has turned vibration off in Settings.
const Haptic = {
  _lastFoodFamilyAt: 0,
  // Short crisp pulse — food catch
  catch()  { Haptic._vibe(30); },
  foodFamily(family, reducedMotion = false) {
    const patterns = {
      juice:18,
      sugar:[10,18,10],
      crumb:[14,9,8],
      savory:22,
      rice:[8,12,8],
      premium:[20,22,20,22,28],
    };
    Haptic._lastFoodFamilyAt = Date.now();
    Haptic._vibe(reducedMotion ? 12 : (patterns[String(family || '')] || 20));
  },
  // Double pulse — heart / power-up
  good()   { Haptic._vibe([30, 40, 30]); },
  // Firm buzz — miss / bomb
  miss()   { Haptic._vibe(80); },
  // Long rumble — game over
  gameOver(){ Haptic._vibe([120, 60, 80]); },

  _vibe(pattern) {
    if (!SETTINGS.hapticFeedback) return;
    if (!('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch(e) {}
  }
};

// ── applySettings() ──────────────────────────────────────────────────────
// Called once at boot and whenever a setting changes.
// Syncs SETTINGS into the parts of the engine that read global flags.
function applySettings() {
  // mobileDifficulty is mirrored into TWEAK so applyTweaks() can gate on it.
  // Only do this if TWEAK already exists (game.js may load after src/runtime/shared/settings.js).
  if (typeof TWEAK !== 'undefined') {
    TWEAK.mobileDifficulty = SETTINGS.mobileDifficulty;
    if (typeof applyTweaks === 'function') applyTweaks();
  }

  // missPenalty — reflected into GAME_BALANCE so game.js mode handlers see it.
  if (typeof GAME_BALANCE !== 'undefined') {
    GAME_BALANCE.spawn.missPenaltyEnabled = SETTINGS.missPenalty;
  }

  // Reduce-motion: suppress screen shake globally by zeroing shakeTime when active.
  // The actual particle gate is in FXManager.spawnParticles (patched below).

  EventBus.emit('settingsApplied', SETTINGS);
}

// ── Patch FXManager.spawnParticles to respect reduceMotion ───────────────
// Runs once after DOMContentLoaded so FXManager is guaranteed to exist.
// We wrap the existing function rather than replacing it so other callers
// Automation and test callers are unaffected.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof FXManager !== 'undefined' && FXManager.spawnParticles) {
    const _origSpawnParticles = FXManager.spawnParticles.bind(FXManager);
    FXManager.spawnParticles = function(entities, x, y, color, count = 12) {
      if (SETTINGS.reduceMotion) return; // suppress burst particles
      _origSpawnParticles(entities, x, y, color, count);
    };
  }

  // Initial apply after all scripts are loaded
  applySettings();
});

// Re-apply whenever any setting changes (mobileDifficulty needs applyTweaks)
EventBus.on('settingChanged', applySettings);

// ── Haptic event wiring ───────────────────────────────────────────────────
// Single listener per event type — no need to patch individual game call sites.
EventBus.on('arcadeFoodCatchFeedback', payload => {
  if (typeof AudioManager !== 'undefined' && AudioManager.foodTexture) {
    AudioManager.foodTexture(payload?.family, { volume:payload?.reducedMotion ? 0.35 : 0.55 });
  }
  Haptic.foodFamily(payload?.family, Boolean(payload?.reducedMotion));
});
EventBus.on('foodCaught',    () => {
  if (Date.now() - Haptic._lastFoodFamilyAt > 80) Haptic.catch();
});
EventBus.on('heartCaught',   () => Haptic.good());
EventBus.on('gameOver',      () => Haptic.gameOver());
