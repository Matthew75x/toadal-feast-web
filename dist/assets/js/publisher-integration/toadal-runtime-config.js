(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalRuntimeConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA = 'toadal/web-runtime-config@1';
  const FORBIDDEN_KEY = /(password|passwd|secret|private.?key|database.?url|postgres|pepper|service.?token|admin.?token|smtp.?password|stripe.?secret|authorization)/i;
  const ALLOWED_ENV = new Set(['development', 'staging', 'production']);

  function own(value, key) { return Object.prototype.hasOwnProperty.call(value || {}, key); }
  function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
  function cleanString(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
  function originOrRelative(value, fallback) {
    const v = cleanString(value, fallback);
    if (!v) return v;
    if (v.startsWith('/')) return v.replace(/\/+$/, '') || '/';
    try {
      const u = new URL(v);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('unsupported protocol');
      u.hash = '';
      u.search = '';
      return u.toString().replace(/\/$/, '');
    } catch (_) {
      throw new Error('Runtime origin must be an http(s) URL or root-relative path: ' + v);
    }
  }
  function safeStringMap(value) {
    const out = {};
    if (!isObject(value)) return out;
    for (const [k,v] of Object.entries(value)) {
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(k)) continue;
      if (typeof v !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(v)) continue;
      out[k] = v;
    }
    return out;
  }
  function findForbidden(value, path, out) {
    path = path || '$'; out = out || [];
    if (!isObject(value) && !Array.isArray(value)) return out;
    if (Array.isArray(value)) {
      value.forEach((item, i) => findForbidden(item, path + '[' + i + ']', out));
      return out;
    }
    Object.keys(value).forEach(key => {
      if (FORBIDDEN_KEY.test(key)) out.push(path + '.' + key);
      findForbidden(value[key], path + '.' + key, out);
    });
    return out;
  }
  function normalize(input) {
    if (!isObject(input)) throw new Error('Runtime config must be an object');
    const forbidden = findForbidden(input);
    if (forbidden.length) throw new Error('Forbidden secret-like runtime config keys: ' + forbidden.join(', '));
    const environment = cleanString(input.environment, 'development');
    if (!ALLOWED_ENV.has(environment)) throw new Error('Invalid environment: ' + environment);
    const config = {
      schema: SCHEMA,
      enabled: input.enabled !== false,
      environment,
      gameId: cleanString(input.gameId, 'froggy_feast'),
      buildId: cleanString(input.buildId, 'dev'),
      apiBaseUrl: originOrRelative(input.apiBaseUrl, '/api'),
      accountOrigin: input.accountOrigin ? originOrRelative(input.accountOrigin) : null,
      statusOrigin: input.statusOrigin ? originOrRelative(input.statusOrigin) : null,
      supportEndpoint: input.supportEndpoint ? originOrRelative(input.supportEndpoint) : null,
      requestTimeoutMs: Number.isInteger(input.requestTimeoutMs) && input.requestTimeoutMs >= 1000 && input.requestTimeoutMs <= 60000 ? input.requestTimeoutMs : 12000,
      telemetryBatchSize: Number.isInteger(input.telemetryBatchSize) && input.telemetryBatchSize >= 1 && input.telemetryBatchSize <= 100 ? input.telemetryBatchSize : 20,
      telemetryMaxQueue: Number.isInteger(input.telemetryMaxQueue) && input.telemetryMaxQueue >= 1 && input.telemetryMaxQueue <= 5000 ? input.telemetryMaxQueue : 500,
      leaderboardModes: safeStringMap(input.leaderboardModes),
      telemetryModes: safeStringMap(input.telemetryModes),
      features: {
        accounts: input.features?.accounts === true,
        accountRegistration: input.features?.accountRegistration === true,
        cloudSync: input.features?.cloudSync === true,
        globalLeaderboardsRead: input.features?.globalLeaderboardsRead === true,
        globalLeaderboardsSubmit: input.features?.globalLeaderboardsSubmit === true,
        achievements: input.features?.achievements === true,
        entitlements: input.features?.entitlements === true,
        telemetry: input.features?.telemetry === true,
        support: input.features?.support === true,
        commerce: input.features?.commerce === true,
        pond: input.features?.pond === true,
        push: input.features?.push === true
      }
    };
    if (config.features.support && !config.supportEndpoint) throw new Error('Support cannot be enabled without supportEndpoint');
    return Object.freeze(config);
  }
  function fromDocument(doc, root) {
    root = root || (typeof globalThis !== 'undefined' ? globalThis : null);
    if (root && isObject(root.__TOADAL_RUNTIME_CONFIG__)) return normalize(root.__TOADAL_RUNTIME_CONFIG__);
    const node = doc && doc.querySelector && doc.querySelector('script[type="application/json"][data-toadal-runtime-config]');
    if (!node) return normalize({ enabled: false });
    let parsed;
    try { parsed = JSON.parse(node.textContent || '{}'); }
    catch (_) { throw new Error('Invalid JSON in data-toadal-runtime-config'); }
    return normalize(parsed);
  }
  function publicView(config) {
    const c = normalize(config);
    return JSON.parse(JSON.stringify(c));
  }
  return { SCHEMA, normalize, fromDocument, findForbidden, publicView };
});
