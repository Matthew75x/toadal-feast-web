// GENERATED FILE — DO NOT EDIT.
// Source: content/migrations/legacy-cosmetic-save-id-map.json
// Run: npm run content:generate
(function (globalScope) {
  'use strict';

  const DATA = Object.freeze({
  "schemaVersion": 1,
  "entries": []
});
  function clone(value) { return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value)); }
  const entries = DATA.entries.map(entry => Object.freeze({ ...entry }));
  const byLegacyId = new Map(entries.map(entry => [entry.legacyId, entry]));
  const legacyIdsByCanonicalId = new Map();
  entries.forEach(entry => {
    const aliases = legacyIdsByCanonicalId.get(entry.canonicalId) || [];
    aliases.push(entry.legacyId);
    legacyIdsByCanonicalId.set(entry.canonicalId, aliases);
  });

  function list() { return entries.map(clone); }
  function get(legacyId) { return clone(byLegacyId.get(String(legacyId || '')) || null); }
  function resolve(id) {
    const requested = String(id || '');
    return byLegacyId.get(requested)?.canonicalId || requested;
  }
  function legacyIdsFor(canonicalId) {
    return [...(legacyIdsByCanonicalId.get(String(canonicalId || '')) || [])];
  }

  globalScope.ContentLegacySaveIdMap = Object.freeze({
    schemaVersion: DATA.schemaVersion,
    list,
    get,
    resolve,
    legacyIdsFor
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
