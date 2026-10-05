(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalIntegrationBootstrap = api;
  if (root?.document) api.start(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FLUSH_INTERVAL_MS = 15000;
  function allowed(controller) {
    try { return controller?.permits?.('telemetry') === true; } catch (_) { return false; }
  }
  function safely(action) { return Promise.resolve().then(action).catch(() => ({ accepted:false, reason:'integration-service-unavailable' })); }
  function telemetryDelivery(root, controller) {
    let timer = null;
    const flush = options => allowed(controller) ? safely(() => controller.flushTelemetry(options)) : Promise.resolve({accepted:false,reason:'telemetry-disabled'});
    const resume = () => {
      if (timer !== null || controller?.config?.features?.telemetry !== true || typeof root.setInterval !== 'function') return;
      timer = root.setInterval(() => { void flush(); }, FLUSH_INTERVAL_MS);
    };
    const pause = () => { if (timer !== null) { root.clearInterval?.(timer); timer = null; } };
    const onPageHide = () => { pause(); void flush({keepalive:true}); };
    root.addEventListener?.('pagehide',onPageHide);
    root.addEventListener?.('pageshow',resume);
    resume();
    return { flush, stop() { pause(); root.removeEventListener?.('pagehide',onPageHide); root.removeEventListener?.('pageshow',resume); } };
  }
  function enhance(root, controller, probe, config) {
    for (const apply of [
      () => root.ToadalAccountUI?.enhance(root.document,controller,probe),
      () => root.ToadalProfileUI?.enhance(root.document,controller,probe),
      () => root.ToadalLeaderboardUI?.enhance(root.document,controller,probe,{modes:config.leaderboardModes || {}}),
      () => root.ToadalSupportContact?.enhance(root.document,config,root.fetch.bind(root)),
      () => root.ToadalGameResultBridge?.attach(root,controller)
    ]) { try { const result=apply(); if (result?.then) void safely(() => result); } catch (_) {} }
  }
  async function boot(root) {
    if (!root || root.self !== root.top || !root.document || root.__toadalPublisherIntegrationBooted) return {enabled:false};
    root.__toadalPublisherIntegrationBooted = true;
    try {
      const configApi=root.ToadalRuntimeConfig, controllerApi=root.ToadalIntegrationController;
      if (!configApi || !controllerApi) return {enabled:false};
      const config=configApi.fromDocument(root.document,root);
      if (!config.enabled) return {enabled:false};
      const controller=new controllerApi.Controller({config,localStorage:root.localStorage,sessionStorage:root.sessionStorage,fetchImpl:root.fetch.bind(root)});
      root.ToadalPublisherIntegration=controller;
      root.ToadalGameServicesClient=root.ToadalGameServices?.create?.(controller) || null;
      const probe=await safely(() => controller.probe());
      root.__toadalPublisherProbe=probe;
      enhance(root,controller,probe,config);
      root.__toadalTelemetryDelivery=telemetryDelivery(root,controller);
      if (allowed(controller)) void safely(() => controller.track('session_started',{platform:'web',buildId:config.buildId}));
      return {enabled:true,probe};
    } catch (_) {
      root.__toadalPublisherIntegrationError={code:'INTEGRATION_BOOT_FAILED'};
      return {enabled:false,error:{code:'INTEGRATION_BOOT_FAILED'}};
    }
  }
  function start(root) {
    const run=() => { void safely(() => boot(root)); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',run,{once:true});
    else run();
  }
  return { FLUSH_INTERVAL_MS, telemetryDelivery, boot, start };
});
