(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalLocalProgressionAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1, CLOUD_SCHEMA = 'toadal/web-cloud-save@1';
  const KEYS = Object.freeze({ pass: 'toadal:web:v1:feast-pass', quests: 'toadal:web:v1:quests', discoveries: 'toadal:web:v1:discoveries', profile: 'toadal:web:v1:profile' });
  const META_KEY = 'toadal:web:v1:cloud-sync', RECOVERY_KEY = 'toadal:web:v1:cloud-recovery';
  const HOME_CANDIES = ['portal-candy', 'lower-page-candy', 'golden-block-candy'];
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function object(v) { return Boolean(v) && typeof v === 'object' && !Array.isArray(v); }
  function own(v, k) { return Object.prototype.hasOwnProperty.call(v, k); }
  function integer(v, minimum) { return Number.isSafeInteger(v) && v >= minimum; }
  function date(v) { return typeof v === 'string' && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v; }
  function optional(v, k, check) { return !own(v, k) || check(v[k]); }
  function strings(v) { return Array.isArray(v) && v.every(x => typeof x === 'string'); }
  function nullableString(v) { return v === null || typeof v === 'string'; }
  function nullableDate(v) { return v === null || date(v); }
  function validLocalScores(v) {
    return object(v) && Object.entries(v).every(([id, score]) => id === 'wicked-bites' && object(score) && integer(score.best, 0) && Array.isArray(score.runs) && score.runs.length <= 50 &&
      score.runs.every(run => object(run) && integer(run.score, 0) && date(run.completedAt) && ['mode', 'ruleset', 'characterId'].every(k => nullableString(run[k]))) &&
      score.best >= score.runs.reduce((best, run) => Math.max(best, run.score), 0));
  }
  function validLegacyScores(v) { return Array.isArray(v) && v.every(x => object(x) && x.gameId === 'wicked-bites' && integer(x.score, 0) && date(x.updatedAt)); }
  function recordState(v, name) {
    if (!object(v) || !Number.isInteger(v.schemaVersion)) return 'invalid';
    if (v.schemaVersion > VERSION) return 'future';
    if (v.schemaVersion !== VERSION || !optional(v, 'updatedAt', nullableDate)) return 'invalid';
    if (name === 'pass') {
      if (!['xp', 'sparks', 'treats'].every(k => optional(v, k, x => integer(x, 0))) || !optional(v, 'level', x => integer(x, 1)) ||
          !['badges', 'claimedRewardIds'].every(k => optional(v, k, strings)) ||
          !optional(v, 'collectibles', x => Array.isArray(x) && x.every(item => typeof item === 'string' || object(item) && typeof item.id === 'string' && item.id.trim() && integer(item.count, 0))) ||
          !optional(v, 'streak', x => object(x) && optional(x, 'count', n => integer(n, 0)) && optional(x, 'lastQualifiedPeriod', nullableString))) return 'invalid';
    } else if (name === 'quests') {
      if (!optional(v, 'items', x => object(x) && Object.values(x).every(item => object(item) && optional(item, 'progress', n => Number.isFinite(n) && n >= 0) && ['completedAt', 'claimedAt'].every(k => optional(item, k, nullableDate)))) ||
          !optional(v, 'processedEventIds', strings) || !optional(v, 'dailyClaimedPeriod', nullableString)) return 'invalid';
    } else if (name === 'discoveries') {
      if (!optional(v, 'items', strings)) return 'invalid';
      if (own(v, 'homeInteraction')) {
        const h = v.homeInteraction;
        if (object(h) && Number.isInteger(h.schemaVersion) && h.schemaVersion > VERSION) return 'future';
        if (!object(h) || h.schemaVersion !== VERSION || !Array.isArray(h.candies) || h.candies.some(id => !HOME_CANDIES.includes(id)) || new Set(h.candies).size !== h.candies.length ||
            !object(h.goldenBlock) || !integer(h.goldenBlock.hits, 0) || h.goldenBlock.hits > 4 || typeof h.goldenBlock.complete !== 'boolean' || h.goldenBlock.complete !== (h.goldenBlock.hits === 4) ||
            h.candies.includes('golden-block-candy') && !h.goldenBlock.complete) return 'invalid';
      }
    } else if (name === 'profile') {
      if (!['displayName', 'selectedBadge', 'selectedTitle'].every(k => optional(v, k, nullableString)) || !['badges', 'titles', 'collectibles'].every(k => optional(v, k, strings)) ||
          !optional(v, 'rewardClaims', x => object(x) && Object.values(x).every(date)) || !optional(v, 'localScores', validLocalScores) || !optional(v, 'localHighScores', validLegacyScores)) return 'invalid';
    }
    return 'valid';
  }
  function parseRecord(raw, name) {
    if (raw == null || raw === '') return { state: 'missing', name, value: null, raw };
    let value; try { value = JSON.parse(raw); } catch (_) { return { state: 'malformed', name, raw }; }
    return { state: recordState(value, name), name, value, raw };
  }
  function readAll(storage) {
    const records = {}, issues = [], snapshot = {};
    for (const name of Object.keys(KEYS)) {
      try { const raw = storage.getItem(KEYS[name]); snapshot[name] = raw; records[name] = parseRecord(raw, name); }
      catch (error) { records[name] = { state: 'read-failed', name }; }
      if (!['missing', 'valid'].includes(records[name].state)) issues.push({ name, state: records[name].state });
    }
    return { records, issues, snapshot, writable: issues.length === 0 };
  }
  function maxUpdated(records) { return Object.values(records).map(r => r?.value?.updatedAt).filter(date).sort().pop() || null; }
  function whitelistPass(v) {
    if (!object(v)) return null;
    return { schemaVersion: VERSION, updatedAt: v.updatedAt || null, level: v.level || 1, xp: v.xp || 0, sparks: v.sparks || 0, treats: v.treats || 0,
      streak: { count: v.streak?.count || 0, lastQualifiedPeriod: v.streak?.lastQualifiedPeriod || null }, badges: copy(v.badges || []),
      collectibles: (v.collectibles || []).map(x => typeof x === 'string' ? x : { id: x.id, count: x.count }), claimedRewardIds: copy(v.claimedRewardIds || []) };
  }
  function whitelistQuests(v) {
    if (!object(v)) return null;
    const items = Object.fromEntries(Object.entries(v.items || {}).map(([id, item]) => [id, { progress: item.progress || 0, completedAt: item.completedAt || null, claimedAt: item.claimedAt || null }]));
    return { schemaVersion: VERSION, updatedAt: v.updatedAt || null, items, processedEventIds: copy(v.processedEventIds || []), dailyClaimedPeriod: v.dailyClaimedPeriod || null };
  }
  function whitelistDiscoveries(v) {
    if (!object(v)) return null;
    const result = { schemaVersion: VERSION, updatedAt: v.updatedAt || null, items: copy(v.items || []) };
    if (v.homeInteraction) result.homeInteraction = { schemaVersion: VERSION, candies: copy(v.homeInteraction.candies), goldenBlock: { hits: v.homeInteraction.goldenBlock.hits, complete: v.homeInteraction.goldenBlock.complete } };
    return result;
  }
  function whitelistProfile(v, options) {
    if (!object(v)) return null;
    const result = { schemaVersion: VERSION, updatedAt: v.updatedAt || null, displayName: v.displayName?.slice(0, 80) || null, selectedBadge: v.selectedBadge || null, selectedTitle: v.selectedTitle || null,
      badges: copy(v.badges || []), titles: copy(v.titles || []), collectibles: copy(v.collectibles || []), rewardClaims: copy(v.rewardClaims || {}) };
    if (options?.includeLocalScores) result.localScores = copy(v.localScores || {});
    return result;
  }
  function project(records, options) { return { pass: whitelistPass(records.pass), quests: whitelistQuests(records.quests), discoveries: whitelistDiscoveries(records.discoveries), profile: whitelistProfile(records.profile, options) }; }
  function makePayload(storage, options) {
    options = options || {}; const read = readAll(storage);
    if (!read.writable) return { ok: false, reason: 'local-records-read-only', issues: read.issues, snapshot: read.snapshot };
    const values = {}; for (const name of Object.keys(KEYS)) values[name] = read.records[name].value;
    return { ok: true, snapshot: read.snapshot, payload: { schema: CLOUD_SCHEMA, schemaVersion: VERSION, source: 'toadal-feast-web', generatedAt: new Date().toISOString(), localUpdatedAt: maxUpdated(read.records), records: project(values, options),
      authority: { premiumCurrency: 'excluded-server-authoritative', entitlements: 'excluded-server-authoritative', purchases: 'excluded-server-authoritative', globalLeaderboard: 'excluded-server-authoritative', localScores: options.includeLocalScores ? 'non-authoritative-personal-history' : 'excluded-by-default' } } };
  }
  function validatePayload(payload) {
    if (!object(payload) || payload.schema !== CLOUD_SCHEMA || payload.schemaVersion !== VERSION || !object(payload.records)) return { ok: false, reason: 'invalid-cloud-schema' };
    for (const name of Object.keys(KEYS)) {
      if (!own(payload.records, name) || payload.records[name] === undefined) return { ok: false, reason: 'missing-cloud-record', record: name };
      const value = payload.records[name];
      if (value !== null && value !== undefined) { const state = recordState(value, name); if (state !== 'valid') return { ok: false, reason: state === 'future' ? 'future-record-schema' : 'invalid-record-shape', record: name }; }
    }
    return { ok: true };
  }
  function sameSnapshot(a, b) { return Object.keys(KEYS).every(k => a?.[k] === b?.[k]); }
  function applyPayload(storage, payload, options) {
    options = options || {}; const validation = validatePayload(payload); if (!validation.ok) return validation;
    const current = readAll(storage), before = current.snapshot;
    if (current.issues.some(x => x.state === 'future' || x.state === 'read-failed')) return { ok: false, reason: 'local-records-read-only', issues: current.issues };
    if (options.expectedSnapshot && !sameSnapshot(before, options.expectedSnapshot)) return { ok: false, reason: 'local-changed-before-restore' };
    if (!current.writable && options.allowRecovery !== true) return { ok: false, reason: 'explicit-recovery-required', issues: current.issues };
    const records = project(payload.records, { includeLocalScores: false });
    // Personal score history belongs to this device, even when the cloud profile is absent.
    const profile = current.records.profile;
    if (profile.state === 'valid' && (own(profile.value, 'localScores') || own(profile.value, 'localHighScores'))) {
      records.profile = records.profile || whitelistProfile({ schemaVersion: VERSION });
      if (own(profile.value, 'localScores')) records.profile.localScores = copy(profile.value.localScores);
      if (own(profile.value, 'localHighScores')) records.profile.localHighScores = copy(profile.value.localHighScores);
    }
    try { storage.setItem(RECOVERY_KEY, JSON.stringify({ schema: 'toadal/web-cloud-recovery@1', createdAt: new Date().toISOString(), reason: options.allowRecovery ? 'explicit-corrupt-recovery' : 'before-cloud-restore', records: before })); }
    catch (error) { return { ok: false, reason: 'recovery-backup-failed', error: String(error?.message || error) }; }
    try {
      for (const name of Object.keys(KEYS)) { if (records[name] == null) storage.removeItem(KEYS[name]); else storage.setItem(KEYS[name], JSON.stringify(records[name])); }
      return { ok: true, written: Object.keys(KEYS), recoveryKey: RECOVERY_KEY };
    } catch (error) {
      let rollbackComplete = true;
      for (const name of Object.keys(KEYS)) { try { if (before[name] == null) storage.removeItem(KEYS[name]); else storage.setItem(KEYS[name], before[name]); } catch (_) { rollbackComplete = false; } }
      return { ok: false, reason: rollbackComplete ? 'write-failed-rolled-back' : 'write-failed-recovery-retained', rollbackComplete, recoveryKey: RECOVERY_KEY, error: String(error?.message || error) };
    }
  }
  function meaningful(payload) {
    if (!validatePayload(payload).ok) return false;
    const p = payload.records.pass || {}, q = payload.records.quests || {}, d = payload.records.discoveries || {}, r = payload.records.profile || {}, h = d.homeInteraction || {};
    return Boolean((p.xp || 0) > 0 || (p.sparks || 0) > 0 || (p.treats || 0) > 0 || (p.level || 1) > 1 || (p.streak?.count || 0) > 0 || (p.badges || []).length || (p.collectibles || []).length || (p.claimedRewardIds || []).length ||
      Object.keys(q.items || {}).length || q.dailyClaimedPeriod || (q.processedEventIds || []).length || (d.items || []).length || (h.candies || []).length || h.goldenBlock?.hits || r.displayName || r.selectedBadge || r.selectedTitle ||
      (r.badges || []).length || (r.titles || []).length || (r.collectibles || []).length || Object.keys(r.rewardClaims || {}).length || Object.keys(r.localScores || {}).length);
  }
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (object(value)) return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  // Exact canonical content comparison avoids using a short, collision-prone digest as write authority.
  function digest(value) { return stable(value); }
  function readMeta(storage, binding) {
    try { const raw = storage.getItem(META_KEY); if (!raw) return null; const meta = JSON.parse(raw);
      return object(meta) && meta.schema === 'toadal/web-cloud-sync-meta@2' && object(meta.binding) && (!binding || stable(meta.binding) === stable(binding)) && typeof meta.localContent === 'string' && typeof meta.remoteContent === 'string' ? meta : null;
    } catch (_) { return null; }
  }
  function writeMeta(storage, meta) { storage.setItem(META_KEY, JSON.stringify(meta)); return meta; }
  return { VERSION, CLOUD_SCHEMA, KEYS, META_KEY, RECOVERY_KEY, readAll, makePayload, validatePayload, applyPayload, meaningful, stable, digest, sameSnapshot, readMeta, writeMeta };
});
