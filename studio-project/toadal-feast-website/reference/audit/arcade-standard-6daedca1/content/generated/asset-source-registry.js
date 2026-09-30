// GENERATED FILE — DO NOT EDIT.
// Source: content/items/*.json
// Run: npm run content:generate
(function (globalScope) {
  'use strict';

  const DATA = Object.freeze({
  "schemaVersion": 1,
  "sources": []
});
  function clone(value) { return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value)); }
  const sources = DATA.sources.map(source => Object.freeze({ ...source }));
  const byKey = new Map(sources.map(source => [source.assetKey, source]));

  function list(options = {}) {
    let result = sources;
    if (options.contentId) result = result.filter(source => source.contentId === options.contentId);
    if (options.targetId) result = result.filter(source => source.targetId === options.targetId);
    return result.map(clone);
  }

  function get(assetKey) { return clone(byKey.get(String(assetKey || '')) || null); }
  function listForContent(contentId) { return list({ contentId }); }

  globalScope.ContentAssetSourceRegistry = Object.freeze({
    schemaVersion: DATA.schemaVersion,
    list,
    get,
    listForContent
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
