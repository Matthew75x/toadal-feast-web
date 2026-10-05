(function (root, factory) {
  const adapter = (typeof module === 'object' && module.exports) ? require('./local-progression-adapter.js') : root.ToadalLocalProgressionAdapter;
  const api = factory(adapter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalGameServices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (adapter) {
  'use strict';
  const WEBSITE_SLOT='website-progression';
  function websiteSlot(slot) { if(slot && slot!==WEBSITE_SLOT) throw new Error('Website progression must use its dedicated cloud slot.'); return WEBSITE_SLOT; }

  class OfflineNullAdapter {
    constructor(options) {
      options = options || {};
      this.localSnapshot = typeof options.localSnapshot === 'function' ? options.localSnapshot : (() => ({ ok: true, payload: null }));
    }
    capabilities() { return Promise.resolve({ offline: true, capabilities: {} }); }
    identity = {
      createGuest: async () => ({ offline: true, session: null }),
      signIn: async () => ({ ok: false, offline: true, reason: 'backend-unavailable' }),
      signOut: async () => undefined
    };
    saves = {
      load: async () => null,
      save: async () => ({ ok: false, offline: true, reason: 'backend-unavailable' })
    };
    economy = { getBalance: async () => null };
    leaderboards = {
      submit: async () => ({ ok: false, offline: true, reason: 'backend-unavailable' }),
      top: async () => []
    };
    telemetry = { emit: () => undefined, flush: async () => 0 };
    remoteConfig = { current: async () => ({ offline: true }) };
  }

  function create(controller) {
    if (!controller) throw new Error('controller required');
    return {
      capabilities: async () => {
        const probe = controller.lastProbe || await controller.probe();
        return probe?.ok ? probe.capabilities : { offline: true, capabilities: {} };
      },
      identity: {
        createGuest: () => controller.ensureGuest(),
        signIn: ({ email, password }) => controller.login(email, password),
        register: ({ email, password, ...registration }) => controller.register(email, password, registration),
        signOut: () => controller.logout()
      },
      saves: {
        load: async (slot) => { const target=websiteSlot(slot); controller.requireFeature('cloudSync'); await controller.ensureGuest(); return controller.client.loadSave(target); },
        save: async (slot, data, expectedVersion) => { controller.requireFeature('cloudWrite'); if(!adapter.validatePayload(data).ok || !Number.isSafeInteger(expectedVersion) || expectedVersion<0) throw new Error('A valid website progression payload and expected version are required.'); await controller.ensureGuest(); return controller.client.save(websiteSlot(slot), data, expectedVersion); },
        reconcileWebsiteProgress: () => controller.syncNow()
      },
      economy: { getBalance: () => controller.balance() },
      leaderboards: {
        submit: (mode, score, proof) => controller.submitScore({ mode, score }, { eligible: Boolean(proof?.eligible), source: proof?.source }),
        top: async (mode, options) => {
          const out = await controller.topScores(mode, options?.limit);
          return out?.ok ? out.scores : [];
        }
      },
      telemetry: {
        emit: (name, data) => controller.track(name, data),
        flush: () => controller.flushTelemetry()
      },
      remoteConfig: { current: () => controller.client.config() },
      profile: { get: () => controller.profile(), update: patch => controller.updateProfile(patch) },
      privacy: { request: (type, options) => controller.requestPrivacy(type, options), list: () => controller.privacyRequests(), export: id => controller.privacyExport(id) }
    };
  }
  return { create, OfflineNullAdapter };
});
