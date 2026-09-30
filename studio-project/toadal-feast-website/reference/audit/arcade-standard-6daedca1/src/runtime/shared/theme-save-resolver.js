// ============================================================
// src/runtime/shared/theme-save-resolver.js — Theme Pack v2 save-isolation runtime
//
// Player-facing themes may change presentation, but must never accidentally
// overwrite another product's progression. This resolver maps stable logical
// storage keys to a validated theme product namespace *before* a save host
// reads or writes localStorage. It never changes fields inside a save blob.
// ============================================================

const ThemeSaveResolver = (() => {
  'use strict';

  const registry = typeof globalThis !== 'undefined' ? globalThis.FROGGY_THEME_SAVE_POLICY_REGISTRY : null;
  if (!registry || !Array.isArray(registry.policies)) {
    throw new Error('[ThemeSaveResolver] Missing generated save-policy registry. Run npm run theme:generate.');
  }

  const POLICY_VALUES = new Set(['shared-presentation', 'isolated', 'migration-required']);
  const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const LOGICAL_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,160}$/;
  const policyById = new Map(registry.policies.map(entry => [entry.id, entry]));
  const scopedPrefix = 'froggyFeast.theme';
  const backupPrefix = 'froggyFeast.theme-backup';
  let lockedSession = null;
  let lastPresentationMismatch = null;

  function currentThemeId() {
    try {
      const id = ThemeSystem?.current?.()?.id;
      return typeof id === 'string' && id ? id : registry.defaultThemeId;
    } catch (_) {
      return registry.defaultThemeId;
    }
  }

  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }

  function validRecord(record) {
    return Boolean(record
      && typeof record.id === 'string'
      && ID_PATTERN.test(record.id)
      && typeof record.namespace === 'string'
      && ID_PATTERN.test(record.namespace)
      && POLICY_VALUES.has(record.policy)
      && Number.isInteger(record.migrationVersion)
      && record.migrationVersion >= 1);
  }

  function invalidPolicy(themeId) {
    return freeze({
      id: String(themeId || 'invalid'),
      namespace: 'invalid',
      policy: 'isolated',
      migrationVersion: 1,
      valid: false,
      reason: 'invalid-theme-save-policy',
    });
  }

  function policyFor(themeId = currentThemeId()) {
    const candidate = policyById.get(String(themeId || ''));
    if (!validRecord(candidate)) return invalidPolicy(themeId);
    return freeze({
      id: candidate.id,
      namespace: candidate.namespace,
      policy: candidate.policy,
      migrationVersion: candidate.migrationVersion,
      valid: true,
      reason: null,
    });
  }

  function validateLogicalKey(logicalKey) {
    const key = String(logicalKey || '');
    if (!LOGICAL_KEY_PATTERN.test(key)) {
      throw new Error(`[ThemeSaveResolver] Unsafe logical storage key: ${key || '(empty)'}`);
    }
    return key;
  }

  function scopedKey(logicalKey, config) {
    const key = validateLogicalKey(logicalKey);
    if (config.policy === 'shared-presentation') return key;
    const namespace = config.valid ? config.namespace : 'invalid';
    const version = Number.isInteger(config.migrationVersion) && config.migrationVersion >= 1
      ? config.migrationVersion
      : 1;
    return `${scopedPrefix}.${namespace}.v${version}.${key}`;
  }

  function sessionPolicy() {
    if (!lockedSession) lockedSession = policyFor(currentThemeId());
    return lockedSession;
  }

  /**
   * Resolve a logical player-storage key. Calls without an explicit theme ID
   * lock the page to its boot theme so a later visual-only ThemeSystem.apply()
   * cannot redirect live save writes into another product namespace.
   */
  function autoplayBenchmarkSuffix() {
    try {
      if (typeof location === 'undefined' || typeof URLSearchParams === 'undefined') return '';
      const params = new URLSearchParams(location.search || '');
      if (params.get('ffBenchmark') !== '1' || params.get('autoplay') !== '1') return '';
      const rawRunId = String(params.get('autoRunId') || 'auto');
      const safeRunId = rawRunId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'auto';
      return `.benchmark.${safeRunId}`;
    } catch (_) {
      return '';
    }
  }

  function key(logicalKey, options = {}) {
    const explicitThemeId = typeof options.themeId === 'string' && options.themeId ? options.themeId : null;
    const config = explicitThemeId ? policyFor(explicitThemeId) : sessionPolicy();
    return `${scopedKey(logicalKey, config)}${autoplayBenchmarkSuffix()}`;
  }

  function logicalKeys() {
    return Object.freeze([
      'froggyFeast',
      'froggyFeastPuzzleStandalone.v1',
      'froggyFeast.feastfall.v1',
      'froggyFeastInfiniteStandalone.v1',
      'froggyFeastArcadeStandalone.audio.v1',
      'froggyFeastPuzzleStandalone.audio.v1',
      'froggyFeastFeastfallStandalone.audio.v1',
      'froggyFeastInfiniteStandalone.audio.v1',
    ]);
  }

  function backupKey(config, now = Date.now()) {
    const stamp = Math.max(0, Math.floor(Number(now) || Date.now()));
    return `${backupPrefix}.${config.namespace}.v${config.migrationVersion}.${stamp}`;
  }

  /**
   * Explicit, no-data-loss bridge for a proof theme that previously shared
   * the base product key. Nothing happens automatically: the caller must name
   * the exact destination namespace and every source key remains untouched.
   */
  function migrateSharedPreview({ themeId = currentThemeId(), logicalStorageKeys = logicalKeys(), approval = '', now = Date.now() } = {}) {
    const config = policyFor(themeId);
    if (!config.valid) return freeze({ ok: false, reason: config.reason, copied: [], skipped: [], backupKey: null });
    if (config.policy !== 'migration-required') {
      return freeze({ ok: false, reason: 'migration-not-required', copied: [], skipped: [], backupKey: null });
    }
    if (String(approval) !== config.namespace) {
      return freeze({ ok: false, reason: 'approval-required', copied: [], skipped: [], backupKey: null });
    }
    if (typeof localStorage === 'undefined') {
      return freeze({ ok: false, reason: 'storage-unavailable', copied: [], skipped: [], backupKey: null });
    }

    const keys = [...new Set((Array.isArray(logicalStorageKeys) ? logicalStorageKeys : []).map(validateLogicalKey))];
    const candidates = [];
    for (const logicalKey of keys) {
      const sourceKey = logicalKey;
      const destinationKey = scopedKey(logicalKey, config);
      let sourceValue = null;
      let destinationValue = null;
      try {
        sourceValue = localStorage.getItem(sourceKey);
        destinationValue = localStorage.getItem(destinationKey);
      } catch (_) {
        return freeze({ ok: false, reason: 'storage-read-failed', copied: [], skipped: [], backupKey: null });
      }
      if (sourceValue === null) {
        candidates.push({ logicalKey, sourceKey, destinationKey, state: 'missing-source', sourceValue: null });
      } else if (destinationValue !== null) {
        candidates.push({ logicalKey, sourceKey, destinationKey, state: 'destination-exists', sourceValue: null });
      } else {
        candidates.push({ logicalKey, sourceKey, destinationKey, state: 'copy', sourceValue });
      }
    }

    const copyable = candidates.filter(entry => entry.state === 'copy');
    const backup = copyable.length ? backupKey(config, now) : null;
    try {
      if (backup) {
        localStorage.setItem(backup, JSON.stringify({
          schemaVersion: 1,
          kind: 'theme-shared-preview-backup',
          themeId: config.id,
          namespace: config.namespace,
          migrationVersion: config.migrationVersion,
          createdAtMs: Math.max(0, Math.floor(Number(now) || Date.now())),
          entries: copyable.map(entry => ({
            logicalKey: entry.logicalKey,
            sourceKey: entry.sourceKey,
            destinationKey: entry.destinationKey,
            value: entry.sourceValue,
          })),
        }));
        for (const entry of copyable) localStorage.setItem(entry.destinationKey, entry.sourceValue);
      }
    } catch (_) {
      // Source keys are never removed. The backup is written before any target
      // copy, so a caller can inspect/retry even if local storage is near quota.
      return freeze({ ok: false, reason: 'storage-write-failed', copied: [], skipped: candidates.map(({ logicalKey, state }) => ({ logicalKey, state })), backupKey: backup });
    }

    return freeze({
      ok: true,
      reason: copyable.length ? 'migrated-with-backup' : 'nothing-to-migrate',
      copied: copyable.map(({ logicalKey, sourceKey, destinationKey }) => ({ logicalKey, sourceKey, destinationKey })),
      skipped: candidates.filter(entry => entry.state !== 'copy').map(({ logicalKey, state }) => ({ logicalKey, state })),
      backupKey: backup,
    });
  }

  function observePresentationTheme(themeId) {
    const selected = String(themeId || '');
    const session = lockedSession;
    if (session && selected && session.id !== selected) {
      lastPresentationMismatch = freeze({
        storageThemeId: session.id,
        presentationThemeId: selected,
        note: 'Presentation changed after save namespace locked; persistence remains on the boot theme until reload.',
      });
    } else {
      lastPresentationMismatch = null;
    }
    return lastPresentationMismatch;
  }

  function state() {
    const session = lockedSession || policyFor(currentThemeId());
    return freeze({
      currentThemeId: currentThemeId(),
      storageThemeId: session.id,
      namespace: session.namespace,
      policy: session.policy,
      migrationVersion: session.migrationVersion,
      valid: session.valid,
      locked: Boolean(lockedSession),
      presentationMismatch: lastPresentationMismatch,
    });
  }

  const api = Object.freeze({
    key,
    resolveKey: key,
    policyFor,
    logicalKeys,
    migrateSharedPreview,
    observePresentationTheme,
    state,
    backupKey,
  });

  if (typeof globalThis !== 'undefined') globalThis.ThemeSaveResolver = api;
  return api;
})();
