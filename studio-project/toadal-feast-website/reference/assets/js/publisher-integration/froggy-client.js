(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalFroggyClient = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class FroggyError extends Error {
    constructor(status, code, message, details) {
      super(message || code || 'Froggy request failed');
      this.name = 'FroggyError'; this.status = status; this.code = code || 'HTTP_ERROR'; this.details = details;
    }
  }
  function trimSlash(v) { return String(v || '').replace(/\/+$/, ''); }
  function defaultStorage() { try { return globalThis.sessionStorage || null; } catch (_) { return null; } }
  function encode(v) { return encodeURIComponent(v); }
  function telemetryBatchId() {
    try { const id = globalThis.crypto?.randomUUID?.(); if (id) return id; } catch (_) {}
    return `tb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  }

  class Client {
    constructor(options) {
      options = options || {};
      if (!options.gameId) throw new Error('gameId is required');
      this.baseUrl = trimSlash(options.baseUrl || '/api');
      this.gameId = options.gameId;
      this.buildId = options.buildId || 'dev';
      this.platform = options.platform || 'web';
      this.environmentId = options.environmentId || 'development';
      this.releaseSubjectKey = options.releaseSubjectKey ? String(options.releaseSubjectKey).slice(0,256) : null;
      this.fetch = options.fetchImpl || globalThis.fetch;
      if (typeof this.fetch !== 'function') throw new Error('fetch implementation is required');
      this.storage = options.storage === undefined ? defaultStorage() : options.storage;
      this.timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : 12000;
      this.telemetryBatchSize = Math.max(1, Math.min(100, Number(options.telemetryBatchSize) || 25));
      this.telemetryMaxQueue = Math.max(1, Math.min(5000, Number(options.telemetryMaxQueue) || 500));
      this.telemetryQueue = [];
      this.telemetryPendingBatch = null;
      this.telemetryFlushPromise = null;
      this.telemetryDropped = 0;
      this.sessionKey = `froggy-locker:${this.baseUrl}:${this.gameId}:guest-session`;
      this.token = this.storage?.getItem?.(this.sessionKey) || null;
    }
    setSession(token) {
      this.token = token || null;
      try {
        if (this.token) this.storage?.setItem?.(this.sessionKey, this.token);
        else this.storage?.removeItem?.(this.sessionKey);
      } catch (_) { /* session still works in-memory */ }
      return this.token;
    }
    async request(path, options) {
      options = options || {};
      const method = options.method || 'GET';
      const headers = { accept: 'application/json', ...(options.headers || {}) };
      if (options.body !== undefined) headers['content-type'] = 'application/json';
      if (options.auth !== false && this.token) headers.authorization = `Bearer ${this.token}`;
      let timer = null; let controller = null;
      if (typeof AbortController !== 'undefined' && this.timeoutMs > 0) {
        controller = new AbortController(); timer = setTimeout(() => controller.abort(), this.timeoutMs);
      }
      let response;
      try {
        response = await this.fetch(this.baseUrl + path, {
          method, headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller?.signal,
          keepalive: options.keepalive===true
        });
      } catch (error) {
        const code = error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
        throw new FroggyError(0, code, error?.message || code);
      } finally { if (timer) clearTimeout(timer); }
      const text = response.status === 204 ? '' : await response.text();
      let payload = {};
      if (text) { try { payload = JSON.parse(text); } catch (_) { payload = { raw: text }; } }
      if (!response.ok) {
        const e = payload?.error || {};
        throw new FroggyError(response.status, e.code || 'HTTP_ERROR', e.message || `HTTP ${response.status}`, e.details);
      }
      return payload;
    }
    capabilities() { return this.request(`/v1/games/${encode(this.gameId)}/capabilities`, { auth: false }); }
    config() { return this.request(`/v1/config/${encode(this.gameId)}?environment=${encode(this.environmentId)}`, { auth: false }); }
    serviceStatus() { return this.request('/v1/status', { auth: false }); }
    audiencePolicy() { return this.request(`/v1/audience/${encode(this.gameId)}/policy`, { auth: false }); }
    async currentRelease(options) {
      options = options || {};
      const channel = options.channel || 'production';
      const subjectKey = options.subjectKey || this.releaseSubjectKey;
      const q = new URLSearchParams({ environment: this.environmentId, channel });
      if (subjectKey) q.set('subject', String(subjectKey).slice(0,256));
      return (await this.request(`/v1/releases/${encode(this.gameId)}/current?${q}`, { auth: false })).release;
    }
    async ensureGuest() {
      if (this.token) return this.token;
      const out = await this.request(`/v1/identity/${encode(this.gameId)}/guest`, { method: 'POST', auth: false });
      this.setSession(out.session.token); return this.token;
    }
    async register(input, password) {
      const data = typeof input === 'object' && input !== null ? input : { email: input, password };
      const body = {
        email: data.email,
        password: data.password,
        legalAcceptances: Array.isArray(data.legalAcceptances) ? data.legalAcceptances : [],
        locale: data.locale || 'en',
        platform: data.platform || this.platform
      };
      const out = await this.request(`/v1/identity/${encode(this.gameId)}/register`, { method: 'POST', body, auth: Boolean(this.token) });
      this.setSession(out.session.token); return out;
    }
    async login(input, password) {
      const data = typeof input === 'object' && input !== null ? input : { email: input, password };
      const out = await this.request(`/v1/identity/${encode(this.gameId)}/login`, { method: 'POST', body: { email: data.email, password: data.password }, auth: Boolean(this.token) });
      this.setSession(out.session.token); return out;
    }
    async platformAuth(platform, proof, options) {
      options = options || {};
      const out = await this.request(`/v1/identity/${encode(this.gameId)}/platform/${encode(platform)}`, { method: 'POST', body: { proof, mode: options.mode || 'login' }, auth: Boolean(this.token) });
      this.setSession(out.session.token); return out;
    }
    me() { return this.token ? this.request('/v1/identity/me') : Promise.resolve(null); }
    async audienceState() { await this.ensureGuest(); return this.request(`/v1/audience/${encode(this.gameId)}/state`); }
    async classifyAudience(ageBand) { await this.ensureGuest(); return this.request(`/v1/audience/${encode(this.gameId)}/classify`, { method: 'POST', body: { ageBand } }); }
    async legalState() { await this.ensureGuest(); return this.request(`/v1/legal/${encode(this.gameId)}/state`); }
    async acceptLegal(documentKey, documentVersion, options) {
      options = options || {}; await this.ensureGuest();
      return this.request(`/v1/legal/${encode(this.gameId)}/accept`, { method: 'POST', body: { documentKey, documentVersion, locale: options.locale || 'en', platform: options.platform || this.platform } });
    }
    async registerPush(provider, token, options) { options = options || {}; await this.ensureGuest(); return this.request(`/v1/notifications/${encode(this.gameId)}/register`, { method: 'POST', body: { provider, token, locale: options.locale || 'en' } }); }
    async unregisterPush(provider, token) { await this.ensureGuest(); return this.request(`/v1/notifications/${encode(this.gameId)}/register`, { method: 'DELETE', body: { provider, token } }); }
    requestEmailVerification() { return this.request('/v1/identity/email/verification-request', { method: 'POST' }); }
    verifyEmail(token) { return this.request('/v1/identity/email/verify', { method: 'POST', body: { token }, auth: false }); }
    requestPasswordReset(email) { return this.request('/v1/identity/password-reset/request', { method: 'POST', body: { email }, auth: false }); }
    async completePasswordReset(input, newPassword) {
      const data = typeof input === 'object' && input !== null ? input : { token: input, newPassword };
      const out = await this.request('/v1/identity/password-reset/complete', { method: 'POST', body: { token: data.token, newPassword: data.newPassword }, auth: false }); this.setSession(null); return out;
    }
    async changePassword(input, newPassword) {
      const data = typeof input === 'object' && input !== null ? input : { currentPassword: input, newPassword };
      const out = await this.request('/v1/identity/password', { method: 'PUT', body: { currentPassword: data.currentPassword, newPassword: data.newPassword } }); this.setSession(null); return out;
    }
    async logout() { if (!this.token) return; try { await this.request('/v1/identity/session/revoke', { method: 'POST' }); } finally { this.setSession(null); } }
    async logoutEverywhere() { if (!this.token) return 0; const out = await this.request('/v1/identity/sessions/revoke-all', { method: 'POST' }); this.setSession(null); return out.revoked || 0; }
    async profile() { await this.ensureGuest(); return (await this.request(`/v1/profiles/${encode(this.gameId)}`)).profile; }
    async updateProfile(patch) { await this.ensureGuest(); return (await this.request(`/v1/profiles/${encode(this.gameId)}`, { method: 'PATCH', body: patch })).profile; }
    async achievements() { await this.ensureGuest(); return (await this.request(`/v1/achievements/${encode(this.gameId)}`)).achievements; }
    async startRewardRun(input, metadata) {
      const data = typeof input === 'object' && input !== null ? input : { mode: input, metadata: metadata || {} };
      await this.ensureGuest();
      return (await this.request(`/v1/rewards/${encode(this.gameId)}/runs?environment=${encode(this.environmentId)}`, { method: 'POST', body: { mode: data.mode, buildId: this.buildId, environmentId: this.environmentId, metadata: data.metadata || {} } })).run;
    }
    async claimReward(runId, rewardKey, evidence) { await this.ensureGuest(); return (await this.request(`/v1/rewards/${encode(this.gameId)}/runs/${encode(runId)}/claim?environment=${encode(this.environmentId)}`, { method: 'POST', body: { rewardKey, evidence: evidence || {} } })).claim; }
    async loadSave(slot) { await this.ensureGuest(); return (await this.request(`/v1/saves/${encode(this.gameId)}/${encode(slot || 'main')}`)).save; }
    async save(slot, data, expectedVersion) { await this.ensureGuest(); return (await this.request(`/v1/saves/${encode(this.gameId)}/${encode(slot || 'main')}`, { method: 'PUT', body: { data, expectedVersion } })).save; }
    async balance(currencyKey) { await this.ensureGuest(); return (await this.request(`/v1/economy/${encode(this.gameId)}/${encode(currencyKey)}/balance`)).balance; }
    async entitlements() { await this.ensureGuest(); return (await this.request(`/v1/entitlements/${encode(this.gameId)}`)).entitlements; }
    async submitScore(mode, score) { await this.ensureGuest(); return (await this.request(`/v1/leaderboards/${encode(this.gameId)}/${encode(mode)}/submit`, { method: 'POST', body: { score, buildId: this.buildId } })).score; }
    async topScores(mode, options) { const n = Math.max(1, Math.min(100, Number(typeof options === 'number' ? options : options?.limit) || 50)); return (await this.request(`/v1/leaderboards/${encode(this.gameId)}/${encode(mode)}/top?limit=${n}`, { auth: false })).scores; }
    async requestPrivacy(type, options) { await this.ensureGuest(); const body = typeof options === 'object' && options !== null ? { type, ...options } : { type, confirm: options }; return (await this.request(`/v1/privacy/${encode(this.gameId)}/requests`, { method: 'POST', body })).request; }
    async privacyRequests() { if (!this.token) return []; return (await this.request('/v1/privacy/requests')).requests; }
    async privacyExport(requestId) { return (await this.request(`/v1/privacy/requests/${encode(requestId)}/export`)).export; }
    track(name, data, time) {
      if (this.telemetryQueue.length >= this.telemetryMaxQueue) { this.telemetryQueue.shift(); this.telemetryDropped++; }
      this.telemetryQueue.push({ name, time: time || new Date().toISOString(), data: data || {} });
      return this.telemetryQueue.length >= this.telemetryBatchSize ? this.flushTelemetry() : Promise.resolve(0);
    }
    telemetryStatus() { return { queued: this.telemetryQueue.length, pending: this.telemetryPendingBatch?.events?.length || 0, pendingBatchId: this.telemetryPendingBatch?.batchId || null, dropped: this.telemetryDropped, maxQueue: this.telemetryMaxQueue }; }
    async flushTelemetry(options) {
      if (this.telemetryFlushPromise) return this.telemetryFlushPromise;
      if (!this.telemetryPendingBatch && !this.telemetryQueue.length && !this.telemetryDropped) return 0;
      this.telemetryFlushPromise = this._flushTelemetryOnce(options).finally(() => { this.telemetryFlushPromise = null; });
      return this.telemetryFlushPromise;
    }
    async _flushTelemetryOnce(options) {
      if (!this.telemetryPendingBatch) {
        const events = [];
        if (this.telemetryDropped) { events.push({ name: 'telemetry_queue_overflow', time: new Date().toISOString(), data: { dropped: this.telemetryDropped } }); this.telemetryDropped = 0; }
        events.push(...this.telemetryQueue.splice(0, Math.max(0, 100 - events.length)));
        this.telemetryPendingBatch = { batchId: telemetryBatchId(), events };
      }
      const pending = this.telemetryPendingBatch;
      const body={ batchId: pending.batchId, environmentId: this.environmentId, platform: this.platform, buildId: this.buildId, events: pending.events };
      if(options?.keepalive && new TextEncoder().encode(JSON.stringify(body)).length>60000) return 0;
      try {
        const out = await this.request(`/v1/telemetry/${encode(this.gameId)}/events`, { method: 'POST', auth: Boolean(this.token), body, keepalive:options?.keepalive===true });
        const delivered = out.duplicate ? pending.events.length : (out.accepted || 0);
        this.telemetryPendingBatch = null;
        return delivered;
      } catch (error) { throw error; }
    }
  }
  return { Client, FroggyError, telemetryBatchId };
});
