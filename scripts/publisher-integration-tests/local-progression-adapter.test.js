const test = require('node:test'), assert = require('node:assert/strict');
const a = require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/local-progression-adapter.js');
const guest = require('../../dist/assets/js/guest-progression.js');
function storage(seed = {}) { const m = new Map(Object.entries(seed)); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; }
function record(x) { return JSON.stringify({ schemaVersion: 1, updatedAt: '2026-10-04T12:00:00.000Z', ...x }); }
function payload(xp = 100) { return a.makePayload(storage({ [a.KEYS.pass]: record({ xp }) })).payload; }
test('future local schema blocks upload and restore without changing bytes', () => {
  const s = storage({ [a.KEYS.pass]: JSON.stringify({ schemaVersion: 99 }) }); const before = s.getItem(a.KEYS.pass);
  assert.equal(a.makePayload(s).ok, false); assert.equal(a.applyPayload(s, payload(), { allowRecovery: true }).ok, false); assert.equal(s.getItem(a.KEYS.pass), before);
});
test('nested future homeInteraction is protected locally and remotely', () => {
  const value = { schemaVersion: 1, items: [], homeInteraction: { schemaVersion: 2 } }, s = storage({ [a.KEYS.discoveries]: JSON.stringify(value) });
  assert.equal(a.readAll(s).records.discoveries.state, 'future'); assert.equal(a.makePayload(s).ok, false);
  const remote = payload(); remote.records.discoveries = value; assert.equal(a.validatePayload(remote).reason, 'future-record-schema');
});
test('homeInteraction validates the shipped golden block invariant', () => {
  const p = payload(); p.records.discoveries = { schemaVersion: 1, items: [], homeInteraction: { schemaVersion: 1, candies: ['golden-block-candy'], goldenBlock: { hits: 1, complete: false } } };
  assert.equal(a.validatePayload(p).ok, false); p.records.discoveries.homeInteraction.goldenBlock = { hits: 4, complete: true }; assert.equal(a.validatePayload(p).ok, true);
});
test('cloud projection excludes protected fields at every retained structured seam', () => {
  const s = storage({ [a.KEYS.pass]: record({ level: 2, xp: 120, streak: { count: 2, premiumCandy: 900 }, collectibles: [{ id: 'treat', count: 1, purchase: 'fake' }], premiumCandy: 999 }),
    [a.KEYS.profile]: record({ displayName: 'Frog', localScores: { 'wicked-bites': { best: 9, runs: [] } }, entitlements: ['fake'] }),
    [a.KEYS.quests]: record({ items: { quest: { progress: 1, entitlements: ['fake'] } } }) });
  const result = a.makePayload(s); assert.equal(result.ok, true);
  assert.equal(result.payload.records.pass.premiumCandy, undefined); assert.equal(result.payload.records.pass.streak.premiumCandy, undefined);
  assert.equal(result.payload.records.pass.collectibles[0].purchase, undefined); assert.equal(result.payload.records.quests.items.quest.entitlements, undefined);
  assert.equal(result.payload.records.profile.entitlements, undefined); assert.equal(result.payload.records.profile.localScores, undefined);
});
test('actual website personal runs and all-time best survive remote and null-profile restore', () => {
  for (const nullProfile of [false, true]) {
    const s = storage(), store = guest.createStore({ storage: s, now: () => new Date('2026-10-04T12:00:00.000Z') });
    assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 1234 }).ok, true);
    assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 10 }).ok, true);
    const before = JSON.parse(s.getItem(a.KEYS.profile)); const p = payload();
    p.records.profile = nullProfile ? null : { schemaVersion: 1, displayName: 'Cloud', localScores: { 'wicked-bites': { best: 99999, runs: [] } } };
    assert.equal(a.applyPayload(s, p).ok, true); const after = JSON.parse(s.getItem(a.KEYS.profile));
    assert.deepEqual(after.localScores, before.localScores); assert.equal(a.makePayload(s).payload.records.profile.localScores, undefined);
    assert.equal(JSON.parse(s.getItem(a.RECOVERY_KEY)).records.profile, JSON.stringify(before));
  }
});
test('corrupt local bytes are retained until explicit recoverable restore', () => {
  const raw = '{broken', s = storage({ [a.KEYS.pass]: raw });
  assert.equal(a.applyPayload(s, payload()).reason, 'explicit-recovery-required'); assert.equal(s.getItem(a.KEYS.pass), raw);
  assert.equal(a.applyPayload(s, payload(), { allowRecovery: true }).ok, true); assert.equal(JSON.parse(s.getItem(a.RECOVERY_KEY)).records.pass, raw);
});
test('local race snapshot guard prevents destructive restore', () => {
  const s = storage({ [a.KEYS.pass]: record({ xp: 1 }) }), snapshot = a.readAll(s).snapshot; s.setItem(a.KEYS.pass, record({ xp: 2 }));
  assert.equal(a.applyPayload(s, payload(5), { expectedSnapshot: snapshot }).reason, 'local-changed-before-restore'); assert.equal(JSON.parse(s.getItem(a.KEYS.pass)).xp, 2);
});
test('recovery backup quota failure leaves every original key intact', () => {
  const s = storage({ [a.KEYS.pass]: record({ xp: 1 }) }), before = a.readAll(s).snapshot, original = s.setItem;
  s.setItem = (k, v) => { if (k === a.RECOVERY_KEY) throw new Error('quota'); return original(k, v); };
  assert.equal(a.applyPayload(s, payload(5)).reason, 'recovery-backup-failed'); assert.deepEqual(a.readAll(s).snapshot, before);
});
test('partial writes roll back and retain recovery receipt', () => {
  const initial = record({ level: 1 }), s = storage({ [a.KEYS.pass]: initial }); let fail = true; const original = s.setItem;
  s.setItem = (k, v) => { if (fail && k === a.KEYS.quests) { fail = false; throw new Error('quota'); } return original(k, v); };
  const p = payload(5); p.records.quests = { schemaVersion: 1, items: {} };
  const result = a.applyPayload(s, p); assert.equal(result.ok, false); assert.equal(result.rollbackComplete, true); assert.equal(s.getItem(a.KEYS.pass), initial);
  assert.equal(JSON.parse(s.getItem(a.RECOVERY_KEY)).records.pass, initial);
});
test('failed rollback still retains exact recovery bytes', () => {
  const initial = record({ level: 1 }), s = storage({ [a.KEYS.pass]: initial }); const original = s.setItem; let written = false;
  s.setItem = (k, v) => { if (k === a.KEYS.pass) { if (written) throw new Error('rollback unavailable'); written = true; } if (k === a.KEYS.quests) throw new Error('quota'); return original(k, v); };
  const p = payload(5); p.records.quests = { schemaVersion: 1, items: {} };
  const result = a.applyPayload(s, p); assert.equal(result.reason, 'write-failed-recovery-retained'); assert.equal(JSON.parse(s.getItem(a.RECOVERY_KEY)).records.pass, initial);
});
test('exact canonical comparison is stable and does not use a 32-bit authority', () => {
  assert.equal(a.digest({ b: 2, a: 1 }), a.digest({ a: 1, b: 2 })); assert.notEqual(a.digest({ a: 1 }), a.digest({ a: 2 })); assert.equal(a.digest({ a: 1 }), '{"a":1}');
});

test('missing cloud records cannot silently erase a local record', () => {
  const p = payload(); delete p.records.profile; assert.equal(a.validatePayload(p).reason, 'missing-cloud-record');
});
test('quest identifiers retain own property semantics including __proto__', () => {
  const value = JSON.parse('{"schemaVersion":1,"items":{"__proto__":{"progress":1}}}');
  const s = storage({ [a.KEYS.quests]: JSON.stringify(value) }), p = a.makePayload(s).payload;
  assert.equal(Object.hasOwn(p.records.quests.items, '__proto__'), true); assert.equal(p.records.quests.items['__proto__'].progress, 1);
});
