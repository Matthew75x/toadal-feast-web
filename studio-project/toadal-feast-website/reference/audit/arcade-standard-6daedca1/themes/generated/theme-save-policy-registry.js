// GENERATED FILE — DO NOT EDIT.
// Run: npm run theme:generate
// Source: themes/source/*.theme.json (runtime save policy)
(function registerFroggyThemeRegistry(global) {
  'use strict';
  const data = {
  "schemaVersion": 1,
  "defaultThemeId": "froggy-feast",
  "keyVersion": 1,
  "policies": [
    {
      "id": "froggy-feast",
      "namespace": "froggy-feast",
      "policy": "shared-presentation",
      "migrationVersion": 1
    }
  ]
};
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  global.FROGGY_THEME_SAVE_POLICY_REGISTRY = freeze(data);
})(typeof globalThis !== 'undefined' ? globalThis : window);
