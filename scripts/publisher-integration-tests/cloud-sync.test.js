const test = require('node:test'), assert = require('node:assert/strict');
const a = require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/local-progression-adapter.js'), sync = require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/cloud-sync.js');
function storage(seed = {}) { const m = new Map(Object.entries(seed)); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; }
function record(xp) { return JSON.stringify({ schemaVersion: 1, updatedAt: '2026-10-04T12:00:00.000Z', xp }); }
function local(xp) { return storage({ [a.KEYS.pass]: record(xp) }); }
function payload(xp = 0) { return a.makePayload(local(xp)).payload; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function client(remote = null, id = 'A') {
  const saves = new Map([[id + ':' + sync.SLOT, clone(remote)], [id + ':main', { version: 7, data: { native: 'unchanged' } }]]);
  return { baseUrl: 'https://staging.toadalfeast.com/api', gameId: 'froggy_feast', token: 'token-' + id, id, saves, calls: [],
    ensureGuest: async function () { return this.token; }, me: async function () { return { user: { id: this.id, kind: 'guest' } }; },
    loadSave: async function (slot) { this.calls.push(['load', slot]); if (this.onLoad) await this.onLoad(); return clone(this.saves.get(this.id + ':' + slot) || null); },
    save: async function (slot, data, expectedVersion) { this.calls.push(['save', slot, expectedVersion]); if (this.onSave) await this.onSave(); const current = this.saves.get(this.id + ':' + slot);
      if ((current?.version || 0) !== expectedVersion) { const e = new Error('Conflict'); e.code = 'SAVE_VERSION_CONFLICT'; throw e; }
      const saved = { version: expectedVersion + 1, data: clone(data) }; this.saves.set(this.id + ':' + slot, saved); return clone(saved); } };
}
function meta(p, version = 3) { return { schema: 'toadal/web-cloud-sync-meta@2', remoteVersion: version, localContent: sync.payloadDigest(p), remoteContent: sync.payloadDigest(p) }; }
test('remote empty uploads meaningful local', () => assert.equal(sync.decide(payload(10), null, null).action, 'upload'));
test('equivalent is noop', () => { const p = payload(10); assert.equal(sync.decide(p, { version: 2, data: p }, null).action, 'noop'); });
test('first meaningful divergence conflicts', () => assert.equal(sync.decide(payload(10), { version: 1, data: payload(20) }, null).action, 'conflict'));
test('known remote unchanged plus local changed uploads', () => assert.equal(sync.decide(payload(20), { version: 3, data: payload(10) }, meta(payload(10))).action, 'upload'));
test('known local unchanged plus remote changed restores', () => assert.equal(sync.decide(payload(10), { version: 4, data: payload(20) }, meta(payload(10))).action, 'restore'));
test('legacy short global digest never authorizes automatic divergence upload', () => {
  assert.equal(sync.decide(payload(20), { version: 3, data: payload(10) }, { remoteVersion: 3, localDigest: '00000000' }).action, 'conflict');
});
test('dedicated slot upload leaves native main save byte-identical', async () => {
  const c = client(), s = local(10), native = JSON.stringify(c.saves.get('A:main')), co = new sync.Coordinator({ client: c, storage: s });
  assert.equal((await co.reconcile()).action, 'upload'); assert.equal(JSON.stringify(c.saves.get('A:main')), native); assert.deepEqual(c.calls.filter(x => x[0] === 'save').map(x => x[1]), [sync.SLOT]);
  assert.throws(() => new sync.Coordinator({ client: c, storage: s, slot: 'main' }), /dedicated/);
});
test('same canonical identity reconnect uses bound metadata for local changes', async () => {
  const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s }); await co.reconcile(); s.setItem(a.KEYS.pass, record(20));
  const next = new sync.Coordinator({ client: c, storage: s }); assert.equal((await next.reconcile()).reason, 'local-changed-only'); assert.equal(c.saves.get('A:' + sync.SLOT).data.records.pass.xp, 20);
});
test('account switch cannot reuse metadata or auto-copy prior account into an empty target', async () => {
  for (const target of [null, { version: 1, data: payload(30) }]) {
    const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s }); await co.reconcile(); s.setItem(a.KEYS.pass, record(20));
    c.id = 'B'; c.token = 'token-B'; c.saves.set('B:' + sync.SLOT, target); const result = await co.reconcile();
    assert.equal(result.action, 'conflict'); assert.equal(result.reason, 'account-or-service-context-changed'); assert.deepEqual(c.saves.get('B:' + sync.SLOT), target);
  }
});
test('different API origin does not authorize old metadata', async () => {
  const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s }); await co.reconcile(); s.setItem(a.KEYS.pass, record(20)); c.baseUrl = 'https://other.invalid/api';
  assert.equal((await co.reconcile()).reason, 'account-or-service-context-changed');
});
test('canonical-preserving guest upgrade continues; unproved cross-ID guest merge requires choice', async () => {
  const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s }); await co.reconcile(); c.me = async function () { return { user: { id: this.id, kind: 'registered' } }; };
  assert.equal((await co.reconcile()).action, 'noop'); c.id = 'Account'; c.token = 'account-token'; assert.equal((await co.reconcile()).action, 'conflict');
});
test('corrupt local with valid cloud offers explicit quarantine recovery and never auto-restores', async () => {
  const raw = '{corrupt', s = storage({ [a.KEYS.pass]: raw }), c = client({ version: 1, data: payload(30) }), co = new sync.Coordinator({ client: c, storage: s });
  const conflict = await co.reconcile(); assert.equal(conflict.action, 'conflict'); assert.equal(conflict.recoveryRequired, true); assert.equal(s.getItem(a.KEYS.pass), raw);
  assert.equal((await co.resolve('local', conflict)).reason, 'corrupt-local-cannot-upload'); assert.equal((await co.resolve('remote', conflict)).ok, true);
  assert.equal(JSON.parse(s.getItem(a.RECOVERY_KEY)).records.pass, raw); assert.equal(JSON.parse(s.getItem(a.KEYS.pass)).xp, 30);
});
test('nested future local blocks even explicit recovery before remote request', async () => {
  const s = storage({ [a.KEYS.discoveries]: JSON.stringify({ schemaVersion: 1, homeInteraction: { schemaVersion: 99 } }) }), c = client({ version: 1, data: payload(30) });
  assert.equal((await new sync.Coordinator({ client: c, storage: s }).reconcile()).action, 'block'); assert.equal(c.calls.length, 0);
});
test('future remote blocks destructive restore', async () => {
  const p = payload(30); p.records.discoveries = { schemaVersion: 1, homeInteraction: { schemaVersion: 99 } }; const s = local(0), before = a.readAll(s).snapshot;
  assert.equal((await new sync.Coordinator({ client: client({ version: 1, data: p }), storage: s }).reconcile()).action, 'block'); assert.deepEqual(a.readAll(s).snapshot, before);
});
test('local mutation while cloud is loading returns explicit current conflict', async () => {
  const s = local(0), c = client({ version: 1, data: payload(30) }); c.onLoad = () => { s.setItem(a.KEYS.pass, record(5)); };
  const result = await new sync.Coordinator({ client: c, storage: s }).reconcile(); assert.equal(result.reason, 'local-changed-during-inspection'); assert.equal(result.local.records.pass.xp, 5); assert.equal(JSON.parse(s.getItem(a.KEYS.pass)).xp, 5);
});
test('optimistic failure reinspects once and returns current conflict without overwrite retry', async () => {
  const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s });
  c.onSave = () => { c.saves.set('A:' + sync.SLOT, { version: 1, data: payload(30) }); c.onSave = null; };
  const result = await co.reconcile(); assert.equal(result.action, 'conflict'); assert.equal(result.reason, 'save-version-conflict'); assert.equal(result.remote.version, 1);
  assert.equal(c.calls.filter(x => x[0] === 'save').length, 1); assert.equal(c.saves.get('A:' + sync.SLOT).data.records.pass.xp, 30);
});
test('stale explicit local and remote choices require a new receipt', async () => {
  for (const strategy of ['local', 'remote']) {
    const c = client({ version: 1, data: payload(30) }), s = local(10), co = new sync.Coordinator({ client: c, storage: s }), conflict = await co.reconcile();
    c.saves.set('A:' + sync.SLOT, { version: 2, data: payload(40) }); const result = await co.resolve(strategy, conflict);
    assert.equal(result.reason, 'stale-conflict-reinspect-required'); assert.equal(result.remote.version, 2); assert.equal(c.calls.filter(x => x[0] === 'save').length, 0); assert.equal(JSON.parse(s.getItem(a.KEYS.pass)).xp, 10);
  }
});
test('local changes after a conflict cannot be silently included in an old choice', async () => {
  const c = client({ version: 1, data: payload(30) }), s = local(10), co = new sync.Coordinator({ client: c, storage: s }), conflict = await co.reconcile(); s.setItem(a.KEYS.pass, record(20));
  assert.equal((await co.resolve('local', conflict)).reason, 'stale-conflict-reinspect-required'); assert.equal(c.calls.filter(x => x[0] === 'save').length, 0);
});
test('held cloud writes are checked immediately before upload and explicit local choice', async () => {
  let allowed = false; const c = client(), s = local(10), co = new sync.Coordinator({ client: c, storage: s, allowWrites: () => allowed });
  assert.equal((await co.reconcile()).reason, 'cloud-writes-held'); c.saves.set('A:' + sync.SLOT, { version: 1, data: payload(30) }); const conflict = await co.reconcile();
  assert.equal((await co.resolve('local', conflict)).reason, 'cloud-writes-held'); assert.equal(c.calls.filter(x => x[0] === 'save').length, 0);
});
test('read-only remote restore is allowed when cloud writes are held', async () => {
  const c = client({ version: 1, data: payload(30) }), s = local(0), co = new sync.Coordinator({ client: c, storage: s, allowWrites: () => false });
  assert.equal((await co.reconcile()).action, 'restore'); assert.equal(JSON.parse(s.getItem(a.KEYS.pass)).xp, 30); assert.equal(c.calls.filter(x => x[0] === 'save').length, 0);
});
test('preserved device score profile does not cause a second reconciliation conflict', async () => {
  const s = local(0); s.setItem(a.KEYS.profile, JSON.stringify({ schemaVersion: 1, localScores: { 'wicked-bites': { best: 1234, runs: [] } } }));
  const c = client({ version: 1, data: payload(30) }), co = new sync.Coordinator({ client: c, storage: s });
  assert.equal((await co.reconcile()).action, 'restore'); assert.equal((await co.reconcile()).reason, 'known-synchronized-projection'); assert.equal(c.calls.filter(x => x[0] === 'save').length, 0);
});
