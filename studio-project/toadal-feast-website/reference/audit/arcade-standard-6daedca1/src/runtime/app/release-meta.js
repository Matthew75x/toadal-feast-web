// GENERATED FROM package.json — synchronized for the canonical complete build.
(function registerFroggyReleaseMeta(global) {
  'use strict';
  // Source checkouts deliberately remain unsealed. scripts/package-release.js
  // replaces this build object in generated player packages with exact,
  // source-bound provenance without changing stable runtime identifiers.
  const build = Object.freeze({
    sourceSha: null,
    shortSha: null,
    buildDate: null,
    buildDatePolicy: 'source-commit-time',
    productionTreeSha256: null,
    releaseIdentity: null,
    packageKind: 'source-checkout',
    buildVariant: 'source-checkout',
    sourceState: 'unsealed',
    platform: 'web',
    nativeVersionCode: null,
    provenance: 'unpackaged-source'
  });
  const meta = Object.freeze({
    version:'1.2.9',
    label:'v1.2.9 — Release candidate',
    channel:'release-candidate',
    verification:'pending-release-certification',
    build
  });
  global.FROGGY_RELEASE = meta;
  global.FROGGY_RELEASE_VERSION = meta.version;
})(typeof globalThis !== 'undefined' ? globalThis : window);
