// GENERATED FILE — DO NOT EDIT.
// Source: content/items/*.json
// Run: npm run content:generate
(function (globalScope) {
  'use strict';

  const DATA = Object.freeze({
  "schemaVersion": 1,
  "targetRegistryRevision": 4,
  "items": []
});
  function clone(value) { return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value)); }
  const items = DATA.items.map(item => Object.freeze(item));
  const byId = new Map(items.map(item => [item.id, item]));

  function list(options = {}) {
    let result = items;
    if (options.targetId) result = result.filter(item => item.bindings.some(binding => binding.targetId === options.targetId));
    if (options.kind) result = result.filter(item => item.kind === options.kind);
    if (options.unlockKind) result = result.filter(item => item.unlock?.kind === options.unlockKind);
    return result.map(clone);
  }

  function get(id) { return clone(byId.get(String(id || '')) || null); }
  function listForTarget(targetId) { return list({ targetId }); }
  function listForUnlock(kind) { return list({ unlockKind: kind }); }

  globalScope.ContentRegistry = Object.freeze({
    schemaVersion: DATA.schemaVersion,
    targetRegistryRevision: DATA.targetRegistryRevision,
    list,
    get,
    listForTarget,
    listForUnlock
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
