(function (root, factory) {
  const adapter = (typeof module === 'object' && module.exports) ? require('./local-progression-adapter.js') : root.ToadalLocalProgressionAdapter;
  const api = factory(adapter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalCloudSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (adapter) {
  'use strict';
  if (!adapter) throw new Error('ToadalLocalProgressionAdapter is required');
  const SLOT = 'website-progression';
  function contentView(payload) { return payload ? { schema: payload.schema, schemaVersion: payload.schemaVersion, records: payload.records } : null; }
  function payloadDigest(payload) { return adapter.digest(contentView(payload)); }
  function remotePayload(remoteSave) { return remoteSave?.data || null; }
  function validRemote(remote) { return !remote || Number.isSafeInteger(remote.version) && remote.version > 0 && adapter.validatePayload(remote.data).ok; }
  function decide(localPayload, remoteSave, meta) {
    const localCheck = adapter.validatePayload(localPayload);
    if (!localCheck.ok) return { action: 'block', reason: 'invalid-local', details: localCheck };
    if (!validRemote(remoteSave)) return { action: 'block', reason: 'invalid-or-future-remote', details: adapter.validatePayload(remoteSave?.data) };
    const remote = remotePayload(remoteSave), localDigest = payloadDigest(localPayload), remoteDigest = remote ? payloadDigest(remote) : null;
    const localMeaningful = adapter.meaningful(localPayload), remoteMeaningful = remote ? adapter.meaningful(remote) : false;
    if (!remoteSave) return localMeaningful ? { action: 'upload', reason: 'remote-empty', expectedVersion: 0, localDigest, remoteDigest } : { action: 'noop', reason: 'both-empty', remoteVersion: 0, localDigest, remoteDigest };
    if (localDigest === remoteDigest) return { action: 'noop', reason: 'equivalent', remoteVersion: remoteSave.version, localDigest, remoteDigest };
    if (!localMeaningful && remoteMeaningful) return { action: 'restore', reason: 'local-empty', remoteVersion: remoteSave.version, localDigest, remoteDigest };
    if (!localMeaningful && !remoteMeaningful) return { action: 'noop', reason: 'both-empty-states', remoteVersion: remoteSave.version, localDigest, remoteDigest };
    if (localMeaningful && !remoteMeaningful) return { action: 'upload', reason: 'remote-empty-state', expectedVersion: remoteSave.version, localDigest, remoteDigest };
    if (meta?.schema === 'toadal/web-cloud-sync-meta@2' && Number.isSafeInteger(meta.remoteVersion) && typeof meta.localContent === 'string' && typeof meta.remoteContent === 'string') {
      const remoteUnchanged = meta.remoteVersion === remoteSave.version && meta.remoteContent === remoteDigest;
      const localUnchanged = meta.localContent === localDigest;
      if (remoteUnchanged && localUnchanged) return { action: 'noop', reason: 'known-synchronized-projection', remoteVersion: remoteSave.version, localDigest, remoteDigest };
      if (remoteUnchanged && !localUnchanged) return { action: 'upload', reason: 'local-changed-only', expectedVersion: remoteSave.version, localDigest, remoteDigest };
      if (!remoteUnchanged && localUnchanged) return { action: 'restore', reason: 'remote-changed-only', remoteVersion: remoteSave.version, localDigest, remoteDigest };
      if (!remoteUnchanged && !localUnchanged) return { action: 'conflict', reason: 'both-changed', remoteVersion: remoteSave.version, localDigest, remoteDigest };
    }
    return { action: 'conflict', reason: 'first-link-both-meaningful', remoteVersion: remoteSave.version, localDigest, remoteDigest };
  }
  class Coordinator {
    constructor(options) {
      options = options || {};
      if (!options.client || !options.storage) throw new Error('client and storage required');
      this.client = options.client; this.storage = options.storage;
      this.slot = options.slot || SLOT;
      if (this.slot !== SLOT) throw new Error('Website cloud sync requires the dedicated website-progression slot');
      this.allowWrites = typeof options.allowWrites === 'function' ? options.allowWrites : () => true;
      this.running = null;
    }
    local() { return adapter.makePayload(this.storage, { includeLocalScores: false }); }
    async context() {
      await this.client.ensureGuest();
      const token = this.client.token, identity = await this.client.me();
      if (!identity?.user?.id || token !== this.client.token) return null;
      let apiOrigin = String(this.client.baseUrl || '');
      try { apiOrigin = new URL(apiOrigin, globalThis.location?.href).href.replace(/\/+$/, ''); } catch (_) { apiOrigin = apiOrigin.replace(/\/+$/, ''); }
      if (!apiOrigin || !this.client.gameId) return null;
      return { token, binding: { apiOrigin, gameId: this.client.gameId, slot: this.slot, identityId: String(identity.user.id) } };
    }
    mark(remoteVersion, payload, binding, remote, extra) {
      try { adapter.writeMeta(this.storage, { schema: 'toadal/web-cloud-sync-meta@2', binding, remoteVersion, localContent: payloadDigest(payload), remoteContent: payloadDigest(remote || payload), syncedAt: new Date().toISOString(), ...(extra || {}) }); return true; }
      catch (_) { return false; }
    }
    conflict(inspected, reason) {
      return { ok: false, action: 'conflict', reason: reason || inspected.decision?.reason, local: inspected.local || null, remote: inspected.remote, meta: inspected.meta, binding: inspected.binding, snapshot: inspected.snapshot,
        recoveryRequired: inspected.recoveryRequired === true, issues: inspected.issues || [] };
    }
    async inspect() {
      const initial = this.local();
      if (!initial.ok && initial.issues.some(x => x.state === 'future' || x.state === 'read-failed')) return { ok: false, action: 'block', reason: initial.reason, issues: initial.issues };
      const context = await this.context();
      if (!context) return { ok: false, action: 'block', reason: 'canonical-identity-unavailable' };
      const remote = await this.client.loadSave(this.slot);
      if (context.token !== this.client.token) return { ok: false, action: 'block', reason: 'identity-changed-during-inspection' };
      const current = this.local();
      if (!current.ok && current.issues.some(x => x.state === 'future' || x.state === 'read-failed')) return { ok: false, action: 'block', reason: current.reason, issues: current.issues };
      const storedMeta = adapter.readMeta(this.storage), meta = adapter.readMeta(this.storage, context.binding);
      const inspected = { ok: true, local: current.payload || null, remote, meta, binding: context.binding, token: context.token, snapshot: current.snapshot, issues: current.issues || [] };
      if (!validRemote(remote)) return { ok: false, action: 'block', reason: 'invalid-or-future-remote', details: adapter.validatePayload(remote?.data) };
      if (!current.ok) {
        if (!remote) return { ok: false, action: 'block', reason: 'corrupt-local-no-cloud-recovery', issues: current.issues };
        inspected.recoveryRequired = true;
        inspected.decision = { action: 'conflict', reason: 'explicit-corrupt-recovery-required' };
      } else if (!adapter.sameSnapshot(initial.snapshot, current.snapshot)) inspected.decision = { action: 'conflict', reason: 'local-changed-during-inspection' };
      else if (storedMeta && !meta && adapter.meaningful(current.payload)) inspected.decision = { action: 'conflict', reason: 'account-or-service-context-changed' };
      else inspected.decision = decide(current.payload, remote, meta);
      return inspected;
    }
    current(inspected) { return this.client.token === inspected.token && adapter.sameSnapshot(adapter.readAll(this.storage).snapshot, inspected.snapshot); }
    async refreshedConflict(reason) {
      const current = await this.inspect(); if (!current.ok) return current;
      return this.conflict(current, reason);
    }
    async upload(inspected, expectedVersion, reason) {
      if (!this.current(inspected)) return this.refreshedConflict('local-or-identity-changed-before-upload');
      if (this.allowWrites() !== true) return { ok: false, action: 'held', reason: 'cloud-writes-held' };
      try {
        const saved = await this.client.save(this.slot, inspected.local, expectedVersion);
        if (!validRemote(saved)) return { ok: false, action: 'block', reason: 'invalid-save-write-response' };
        if (this.client.token !== inspected.token) return { ok: false, action: 'block', reason: 'identity-changed-during-upload' };
        const metadataWritten = this.mark(saved.version, inspected.local, inspected.binding, saved.data || inspected.local, { reason });
        return { ok: true, action: 'upload', reason, remote: saved, metadataWritten };
      } catch (error) { if (error?.code === 'SAVE_VERSION_CONFLICT') return this.refreshedConflict('save-version-conflict'); throw error; }
    }
    restore(inspected, reason) {
      if (this.client.token !== inspected.token) return { ok: false, action: 'block', reason: 'identity-changed-before-restore' };
      const applied = adapter.applyPayload(this.storage, inspected.remote.data, { expectedSnapshot: inspected.snapshot, allowRecovery: inspected.recoveryRequired === true });
      if (!applied.ok) return { ok: false, action: 'restore', ...applied };
      const local = this.local();
      const metadataWritten = local.ok && this.mark(inspected.remote.version, local.payload, inspected.binding, inspected.remote.data, { reason });
      return { ok: true, action: 'restore', reason, remote: inspected.remote, recoveryKey: applied.recoveryKey, metadataWritten: Boolean(metadataWritten) };
    }
    run(operation) {
      if (this.running) return Promise.resolve({ ok: false, action: 'held', reason: 'sync-in-progress' });
      this.running = Promise.resolve().then(operation).finally(() => { this.running = null; }); return this.running;
    }
    reconcile() {
      return this.run(async () => {
        const inspected = await this.inspect(); if (!inspected.ok) return inspected;
        const decision = inspected.decision;
        if (decision.action === 'noop') {
          const metadataWritten = this.mark(inspected.remote?.version || 0, inspected.local, inspected.binding, inspected.remote?.data, { reason: decision.reason });
          return { ok: true, action: 'noop', reason: decision.reason, remote: inspected.remote, metadataWritten };
        }
        if (decision.action === 'upload') return this.upload(inspected, decision.expectedVersion, decision.reason);
        if (decision.action === 'restore') return this.restore(inspected, decision.reason);
        if (decision.action === 'conflict') return this.conflict(inspected);
        return { ok: false, action: 'block', reason: decision.reason, details: decision.details };
      });
    }
    resolve(strategy, conflict) {
      return this.run(async () => {
        if (!conflict || conflict.action !== 'conflict') throw new Error('A current conflict receipt is required');
        const current = await this.inspect(); if (!current.ok) return current;
        const receiptMatches = adapter.stable(conflict.binding) === adapter.stable(current.binding) && adapter.sameSnapshot(conflict.snapshot, current.snapshot) &&
          (conflict.remote?.version || 0) === (current.remote?.version || 0) && payloadDigest(conflict.remote?.data) === payloadDigest(current.remote?.data);
        if (!receiptMatches) return this.conflict(current, 'stale-conflict-reinspect-required');
        if (strategy === 'remote') return current.remote ? this.restore(current, 'explicit-remote-choice') : this.conflict(current, 'remote-copy-unavailable');
        if (strategy === 'local') return current.local ? this.upload(current, current.remote?.version || 0, 'explicit-local-choice') : this.conflict(current, 'corrupt-local-cannot-upload');
        return this.conflict(current, 'unsupported-resolution');
      });
    }
  }
  return { SLOT, contentView, payloadDigest, decide, Coordinator };
});
