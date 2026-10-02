import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');

function fixture(initial = {}, clock = '2026-10-01T12:00:00.000Z', options = {}) {
  const map = new Map(Object.entries(initial));
  const writes = [];
  const storage = {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) {
      writes.push(key);
      if (options.failSetItem && options.failSetItem(key, value, writes.length)) throw new Error('simulated storage failure');
      map.set(key, String(value));
    },
    removeItem(key) { map.delete(key); }
  };
  const now = () => new Date(clock);
  return { map, writes, storage, now, store: runtime.createStore({ storage, now, definitions }) };
}

test('uses the exact four scoped keys and safe guest defaults', () => {
  const { store } = fixture();
  const state = store.getSnapshot();
  assert.deepEqual(Object.values(runtime.KEYS), [
    'toadal:web:v1:feast-pass', 'toadal:web:v1:quests',
    'toadal:web:v1:discoveries', 'toadal:web:v1:profile'
  ]);
  assert.equal(state.pass.level, 1);
  assert.equal(state.pass.xp, 0);
  assert.equal(state.pass.sparks, 0);
  assert.equal(state.pass.treats, 0);
  assert.equal(state.quests.length, 4);
  assert.deepEqual(definitions.treats.map(item => [item.id, item.sourceInteractionId, item.localOnly, item.entitlement]), [
    ['treat-home-blue', 'portal-candy', true, false],
    ['treat-home-green', 'lower-page-candy', true, false],
    ['treat-home-purple', 'golden-block-candy', true, false]
  ]);
  assert.deepEqual(definitions.discoveries.map(item => item.route), ['/world/', '/stories/']);
  assert.equal(state.rewards.length, 4);
  assert.equal(definitions.configStatus, 'starter-config-editable-not-canonical');
});

test('persists events and state across store reloads; route event is idempotent', () => {
  const first = fixture();
  assert.equal(first.store.recordEvent('route:/world/'), true);
  assert.equal(first.store.getSnapshot().quests[0].progress, 1);
  assert.equal(first.store.recordEvent('route:/world/'), false);
  const reloaded = runtime.createStore({ storage: first.storage, now: first.now, definitions });
  assert.equal(reloaded.getSnapshot().quests[0].complete, true);
  assert.equal(reloaded.getSnapshot().pass.xp, 0);
  assert.deepEqual(reloaded.getSnapshot().discoveries.map(item => item.title), ['Visited the World preview']);
  assert.deepEqual(JSON.parse(first.storage.getItem(runtime.KEYS.discoveries)).items, ['world-page-preview']);
});

test('malformed JSON falls back safely with diagnostics and is not overwritten just by reading', () => {
  const { store, writes } = fixture({ [runtime.KEYS.pass]: '{not-json' });
  const state = store.getSnapshot();
  assert.equal(state.pass.level, 1);
  assert.equal(state.storage.diagnostics[0].kind, 'malformed-json');
  assert.deepEqual(writes, []);
});

test('migrates missing legacy fields and preserves unknown fields on the same schema version', () => {
  const legacyPass = { schemaVersion: 1, updatedAt: '2026-01-01T00:00:00.000Z', level: 3, xp: 12, customFutureField: { keep: true } };
  const { store, storage } = fixture({ [runtime.KEYS.pass]: JSON.stringify(legacyPass) });
  assert.equal(store.getSnapshot().pass.sparks, 0);
  assert.equal(store.getSnapshot().pass.treats, 0);
  assert.deepEqual(store.getSnapshot().pass.customFutureField, { keep: true });
  store.claimDaily();
  const persisted = JSON.parse(storage.getItem(runtime.KEYS.pass));
  assert.deepEqual(persisted.customFutureField, { keep: true });
  assert.equal(persisted.streak.count, 1);
});

test('future schema is safe to read and never overwritten by progression writes', () => {
  const raw = JSON.stringify({ schemaVersion: 8, updatedAt: '2026-01-01T00:00:00.000Z', level: 99, marker: 'do-not-touch' });
  const { store, storage, writes } = fixture({ [runtime.KEYS.pass]: raw });
  assert.equal(store.getSnapshot().pass.level, 1);
  assert.equal(store.getSnapshot().storage.diagnostics[0].kind, 'future-version');
  assert.deepEqual(store.claimDaily(), { ok: false, reason: 'future-schema-read-only' });
  assert.equal(storage.getItem(runtime.KEYS.pass), raw);
  assert.deepEqual(writes, []);
});

test('quest rewards require completion and are claimed once without direct score writes', () => {
  const { store } = fixture();
  assert.deepEqual(store.claimQuest('visit-world'), { ok: false, reason: 'incomplete' });
  store.recordEvent('route:/world/');
  assert.deepEqual(store.claimQuest('visit-world'), { ok: true });
  assert.deepEqual(store.claimQuest('visit-world'), { ok: false, reason: 'already-claimed' });
  assert.equal(store.getSnapshot().pass.xp, 10);
  assert.equal(store.getSnapshot().pass.sparks, 1);
  assert.equal(store.getSnapshot().pass.treats, 0);
});

test('UTC daily claim cannot repeat in a day and increments streak only on adjacent UTC days', () => {
  const first = fixture({}, '2026-10-01T23:59:00.000Z');
  assert.equal(first.store.claimDaily().ok, true);
  assert.deepEqual(first.store.claimDaily(), { ok: false, reason: 'already-claimed' });
  assert.equal(first.store.getSnapshot().pass.streak.count, 1);
  const next = runtime.createStore({ storage: first.storage, now: () => new Date('2026-10-02T00:01:00.000Z'), definitions });
  assert.equal(next.claimDaily().ok, true);
  assert.equal(next.getSnapshot().pass.streak.count, 2);
  const skipped = runtime.createStore({ storage: first.storage, now: () => new Date('2026-10-04T00:01:00.000Z'), definitions });
  assert.equal(skipped.claimDaily().ok, true);
  assert.equal(skipped.getSnapshot().pass.streak.count, 1);
});

test('reset removes only the four guest progression keys and leaves unrelated data intact', () => {
  const extraKey = 'some:other:game:data';
  const { map, store } = fixture({ [extraKey]: 'preserve-me' });
  store.recordEvent('route:/world/');
  store.claimDaily();
  const state = store.clear();
  assert.equal(state.pass.level, 1);
  assert.equal(state.quests[0].progress, 0);
  assert.equal(map.get(extraKey), 'preserve-me');
  for (const key of Object.values(runtime.KEYS)) assert.equal(map.has(key), false);
});

test('milestones are surfaced as truthful locked/unlocked non-entitlement rewards', () => {
  const { store } = fixture();
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.rewards.length, 4);
  assert.deepEqual(snapshot.milestones.map(item => [item.level, item.unlocked, item.entitlement]), [
    [1, true, false], [2, false, false], [5, false, false]
  ]);
});

test('route normalization handles root, query/hash, trailing slashes, and GitHub Pages prefixes', () => {
  assert.equal(runtime.normalizePath('/'), '/');
  assert.equal(runtime.normalizePath('/toadal-feast-web/'), '/');
  assert.equal(runtime.normalizePath('/feast-pass/', definitions), '/feast-pass/');
  assert.equal(runtime.normalizePath('/toadal-feast-web/feast-pass/', definitions), '/feast-pass/');
  assert.equal(runtime.normalizePath('/toadal-feast-web/world/?from=home#map', definitions), '/world/');
  assert.equal(runtime.normalizePath('/stories', definitions), '/stories/');
  assert.equal(runtime.normalizePath('/toadal-feast-web/stories/', definitions), '/stories/');
});

test('configured route events count only the exact normalized event route', () => {
  const { store } = fixture();
  assert.equal(store.recordEvent('route:/world'), false);
  assert.equal(store.recordEvent('route:/world/extra/'), false);
  assert.equal(store.getSnapshot().quests[0].progress, 0);
  assert.equal(store.recordEvent('route:/world/'), true);
  assert.equal(store.getSnapshot().quests[0].progress, 1);
});

test('boot persists configured route activity even when the page has no progression root', () => {
  const { storage } = fixture();
  const document = { querySelectorAll() { return []; } };
  const root = { localStorage: storage, location: { pathname: '/toadal-feast-web/world/' } };
  runtime.boot(document, root);
  assert.equal(JSON.parse(storage.getItem(runtime.KEYS.quests)).items['visit-world'].progress, 1);
  assert.deepEqual(JSON.parse(storage.getItem(runtime.KEYS.discoveries)).items, ['world-page-preview']);
});

test('daily snapshot computes claimed status against one UTC period value', () => {
  const dates = ['2026-10-01T00:00:00Z', '2026-10-01T23:59:00Z', '2026-10-02T00:01:00Z'];
  const storage = {
    getItem(key) {
      if (key === runtime.KEYS.quests) return JSON.stringify({ schemaVersion: 1, updatedAt: dates[0], items: {}, processedEventIds: [], dailyClaimedPeriod: '2026-10-01' });
      return null;
    }, setItem() {}, removeItem() {}
  };
  const store = runtime.createStore({ storage, definitions, now: () => new Date(dates.shift() || '2026-10-02T00:02:00Z') });
  const daily = store.getSnapshot().daily;
  assert.equal(daily.period, '2026-10-01');
  assert.equal(daily.claimed, true);
});

test('missing browser storage reports non-persistent memory mode and has no economy fallback', () => {
  const store = runtime.createStore({ definitions: { quests: [], discoveries: [] }, now: () => new Date('2026-10-01T00:00:00Z') });
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.storage.persistent, false);
  assert.equal(snapshot.xpToNext, null);
  assert.equal(store.claimDaily().reason, 'not-configured');
  assert.equal(snapshot.pass.level, 1);
});

test('refreshes quest and daily state across stale stores before granting claims', () => {
  const shared = fixture();
  const stale = runtime.createStore({ storage: shared.storage, now: shared.now, definitions });
  assert.equal(shared.store.claimDaily().ok, true);
  assert.deepEqual(stale.claimDaily(), { ok: false, reason: 'already-claimed' });

  const first = runtime.createStore({ storage: shared.storage, now: shared.now, definitions });
  const second = runtime.createStore({ storage: shared.storage, now: shared.now, definitions });
  assert.equal(first.recordEvent('route:/world/'), true);
  assert.equal(second.recordEvent('route:/world/'), false, 'stale store must refresh route-event state');
  assert.equal(first.recordEvent('route:/stories/'), true);
  assert.deepEqual(second.claimQuest('visit-stories'), { ok: true });
  assert.deepEqual(first.claimQuest('visit-stories'), { ok: false, reason: 'already-claimed' });
  assert.equal(runtime.createStore({ storage: shared.storage, now: shared.now, definitions }).getSnapshot().pass.xp, 15);
});

test('Home discoveries use the existing discoveries key and persist exactly three gated candies', () => {
  const first = fixture();
  const { store, storage, writes } = first;
  assert.deepEqual(store.getHomeInteractionState().candies, []);
  assert.deepEqual(store.collectHomeCandy('golden-block-candy').reason, 'locked');
  assert.equal(store.collectHomeCandy('portal-candy').ok, true);
  assert.equal(store.getSnapshot().pass.treats, 1);
  assert.equal(store.collectHomeCandy('portal-candy').reason, 'already-collected');
  assert.equal(store.collectHomeCandy('lower-page-candy').ok, true);
  assert.equal(store.getSnapshot().pass.treats, 2);
  assert.equal(store.collectHomeCandy('not-a-v1-candy').reason, 'unknown-candy');

  for (let hit = 1; hit <= 4; hit += 1) {
    const result = store.hitGoldenBlock();
    assert.equal(result.ok, true);
    assert.equal(result.state.goldenBlock.hits, hit);
    assert.equal(result.state.goldenBlock.complete, hit === 4);
    assert.equal(result.state.candies.includes('golden-block-candy'), false);
  }
  assert.equal(store.hitGoldenBlock().reason, 'already-broken');
  assert.equal(store.getSnapshot().pass.treats, 2);
  assert.equal(store.collectHomeCandy('golden-block-candy').ok, true);
  assert.equal(store.collectHomeCandy('golden-block-candy').reason, 'already-collected');
  assert.deepEqual(store.getHomeInteractionState().candies, ['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  assert.deepEqual([...new Set(writes)].sort(), [runtime.KEYS.discoveries, runtime.KEYS.pass, runtime.KEYS.quests].sort());
  assert.equal(JSON.parse(storage.getItem(runtime.KEYS.pass)).treats, 3);
  assert.deepEqual(JSON.parse(storage.getItem(runtime.KEYS.pass)).collectibles, [
    { id: 'treat-home-blue', count: 1 },
    { id: 'treat-home-green', count: 1 },
    { id: 'treat-home-purple', count: 1 }
  ]);
  assert.equal(storage.getItem('toadal:web:v1:home-interaction'), null);

  const reloaded = runtime.createStore({ storage, now: first.now, definitions });
  assert.deepEqual(reloaded.getHomeInteractionState().candies, ['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  assert.equal(reloaded.getHomeInteractionState().goldenBlock.hits, 4);
  assert.equal(reloaded.getSnapshot().pass.treats, 3);
});

test('a future Home-interaction schema is readable but cannot be overwritten', () => {
  const raw = JSON.stringify({ schemaVersion: 1, items: [], homeInteraction: { schemaVersion: 9, marker: 'preserve' } });
  const { store, storage, writes } = fixture({ [runtime.KEYS.discoveries]: raw });
  assert.equal(store.getHomeInteractionState().readOnly, true);
  assert.deepEqual(store.collectHomeCandy('portal-candy').reason, 'future-schema-read-only');
  assert.deepEqual(store.hitGoldenBlock().reason, 'future-schema-read-only');
  assert.equal(storage.getItem(runtime.KEYS.discoveries), raw);
  assert.deepEqual(writes, []);
});

test('malformed Home-interaction data is preserved and read-only until a safe migration exists', () => {
  const malformed = { schemaVersion: 1, candies: ['portal-candy', 'unknown-future-candy'], goldenBlock: { hits: 2, complete: false } };
  const raw = JSON.stringify({ schemaVersion: 1, items: [], homeInteraction: malformed });
  const { store, storage, writes } = fixture({ [runtime.KEYS.discoveries]: raw });
  assert.equal(store.getHomeInteractionState().readOnly, true);
  assert.equal(store.collectHomeCandy('lower-page-candy').reason, 'invalid-stored-data-read-only');
  assert.equal(store.hitGoldenBlock().reason, 'invalid-stored-data-read-only');
  assert.equal(storage.getItem(runtime.KEYS.discoveries), raw);
  assert.deepEqual(writes, []);
});

test('existing Home candies reconcile atomically into Treat collectibles without write-on-read', () => {
  const candies = ['portal-candy', 'lower-page-candy', 'golden-block-candy'];
  const discovery = {
    schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', items: [],
    homeInteraction: { schemaVersion: 1, candies, goldenBlock: { hits: 4, complete: true } }
  };
  const { store, storage, writes } = fixture({ [runtime.KEYS.discoveries]: JSON.stringify(discovery) });
  assert.equal(store.getSnapshot().pass.treats, 0);
  assert.deepEqual(writes, [], 'the generic snapshot read does not migrate or persist');

  const first = store.reconcileHomeTreats();
  assert.deepEqual(first, { ok: true, changed: true, treats: 3, questEventsRecorded: 3 });
  assert.equal(store.getSnapshot().pass.treats, 3);
  assert.equal(store.getSnapshot().quests.find(item => item.id === 'find-a-treat').complete, true);
  const pass = JSON.parse(storage.getItem(runtime.KEYS.pass));
  assert.equal(pass.treats, 3);
  assert.deepEqual(pass.collectibles, [
    { id: 'treat-home-blue', count: 1 },
    { id: 'treat-home-green', count: 1 },
    { id: 'treat-home-purple', count: 1 }
  ]);

  const writesAfterMigration = writes.length;
  assert.deepEqual(store.reconcileHomeTreats(), { ok: true, changed: false, treats: 3, questEventsRecorded: 0 });
  assert.equal(writes.length, writesAfterMigration, 'a repeated reconciliation does not write');
});

test('progression-page boot runs the explicit Home Treat reconciliation before rendering', () => {
  const discovery = JSON.stringify({
    schemaVersion: 1, items: [],
    homeInteraction: { schemaVersion: 1, candies: ['portal-candy'], goldenBlock: { hits: 0, complete: false } }
  });
  const { storage } = fixture({ [runtime.KEYS.discoveries]: discovery });
  const status = { textContent: 'Guest progress is stored only in this browser.' };
  const page = {
    ownerDocument: { createElement() { throw new Error('no list containers expected'); } },
    querySelector(selector) { return selector === '[data-progression-storage-status]' ? status : null; },
    querySelectorAll() { return []; }
  };
  const document = { querySelectorAll(selector) { return selector === '[data-progression-page]' ? [page] : []; } };
  const root = { localStorage: storage, location: { pathname: '/feast-pass/' } };
  runtime.boot(document, root);
  assert.equal(JSON.parse(storage.getItem(runtime.KEYS.pass)).treats, 1);
  assert.deepEqual(JSON.parse(storage.getItem(runtime.KEYS.pass)).collectibles, [{ id: 'treat-home-blue', count: 1 }]);
  assert.equal(status.textContent, 'Guest progress is stored only in this browser.');
});

test('Treat migration leaves malformed and future records untouched', () => {
  const malformedDiscovery = JSON.stringify({
    schemaVersion: 1, items: [],
    homeInteraction: { schemaVersion: 1, candies: ['portal-candy', 'unknown-candy'], goldenBlock: { hits: 0, complete: false } }
  });
  const corrupt = fixture({ [runtime.KEYS.discoveries]: malformedDiscovery });
  assert.equal(corrupt.store.reconcileHomeTreats().ok, false);
  assert.equal(corrupt.storage.getItem(runtime.KEYS.discoveries), malformedDiscovery);
  assert.equal(corrupt.storage.getItem(runtime.KEYS.pass), null);
  assert.deepEqual(corrupt.writes, []);

  const futureDiscovery = JSON.stringify({ schemaVersion: 7, marker: 'keep-discoveries' });
  const readOnlyDiscovery = fixture({ [runtime.KEYS.discoveries]: futureDiscovery });
  assert.equal(readOnlyDiscovery.store.collectHomeCandy('portal-candy').reason, 'future-schema-read-only');
  assert.equal(readOnlyDiscovery.storage.getItem(runtime.KEYS.discoveries), futureDiscovery);
  assert.equal(readOnlyDiscovery.storage.getItem(runtime.KEYS.pass), null, 'Pass is not partially written');
  assert.deepEqual(readOnlyDiscovery.writes, []);

  const futurePass = JSON.stringify({ schemaVersion: 9, marker: 'keep-pass' });
  const readOnlyPass = fixture({ [runtime.KEYS.pass]: futurePass });
  assert.equal(readOnlyPass.store.collectHomeCandy('portal-candy').reason, 'future-schema-read-only');
  assert.equal(readOnlyPass.storage.getItem(runtime.KEYS.pass), futurePass);
  assert.equal(readOnlyPass.storage.getItem(runtime.KEYS.discoveries), null, 'Discoveries are not partially written');
  assert.deepEqual(readOnlyPass.writes, []);
});

test('the Treat quest requires both a saved Home candy and its mapped local collectible', () => {
  const discovery = JSON.stringify({
    schemaVersion: 1, items: [],
    homeInteraction: { schemaVersion: 1, candies: ['portal-candy'], goldenBlock: { hits: 0, complete: false } }
  });
  const { store, writes } = fixture({ [runtime.KEYS.discoveries]: discovery });
  assert.equal(store.recordEvent({ type: 'treat-collected', interactionId: 'portal-candy' }), false);
  assert.equal(store.getSnapshot().quests.find(item => item.id === 'find-a-treat').progress, 0);
  assert.deepEqual(writes, []);
});

test('Treat collection rolls back both existing records if the second write fails', () => {
  let failed = false;
  const initialDiscoveries = JSON.stringify({
    schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', items: [],
    homeInteraction: { schemaVersion: 1, candies: [], goldenBlock: { hits: 0, complete: false } }
  });
  const initialPass = JSON.stringify({
    schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', level: 1, xp: 0, sparks: 0, treats: 0,
    streak: { count: 0, lastQualifiedPeriod: null }, badges: [], collectibles: []
  });
  const { store, storage, writes } = fixture({
    [runtime.KEYS.discoveries]: initialDiscoveries,
    [runtime.KEYS.pass]: initialPass
  }, '2026-10-01T12:00:00.000Z', {
    failSetItem(key) {
      if (!failed && key === runtime.KEYS.pass) { failed = true; return true; }
      return false;
    }
  });
  const result = store.collectHomeCandy('portal-candy');
  assert.deepEqual(result, { ok: false, reason: 'storage-unavailable', state: { schemaVersion: 1, candies: [], goldenBlock: { hits: 0, complete: false } } });
  assert.equal(storage.getItem(runtime.KEYS.discoveries), initialDiscoveries);
  assert.equal(storage.getItem(runtime.KEYS.pass), initialPass);
  assert.equal(store.getSnapshot().pass.treats, 0);
  assert.deepEqual([...new Set(writes)].sort(), [runtime.KEYS.discoveries, runtime.KEYS.pass].sort());
});

test('legacy Treat reconciliation rolls Discoveries back if Pass cannot be saved', () => {
  let failed = false;
  const initialDiscoveries = JSON.stringify({
    schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', items: [],
    homeInteraction: { schemaVersion: 1, candies: ['portal-candy'], goldenBlock: { hits: 0, complete: false } }
  });
  const initialPass = JSON.stringify({ schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', level: 1, xp: 0, sparks: 0, treats: 0, streak: { count: 0, lastQualifiedPeriod: null }, badges: [], collectibles: [] });
  const { store, storage } = fixture({
    [runtime.KEYS.discoveries]: initialDiscoveries,
    [runtime.KEYS.pass]: initialPass
  }, '2026-10-01T12:00:00.000Z', {
    failSetItem(key) {
      if (!failed && key === runtime.KEYS.pass) { failed = true; return true; }
      return false;
    }
  });
  assert.deepEqual(store.reconcileHomeTreats(), { ok: false, changed: false, reason: 'storage-unavailable' });
  assert.equal(storage.getItem(runtime.KEYS.discoveries), initialDiscoveries);
  assert.equal(storage.getItem(runtime.KEYS.pass), initialPass);
  assert.equal(store.getSnapshot().pass.treats, 0);
});

test('strict score normalization rejects fractional, negative, unsafe, and payload-shaped values', () => {
  assert.equal(runtime.normalizeScore(123), 123);
  assert.equal(runtime.normalizeScore('123'), 123);
  assert.equal(runtime.normalizeScore(' 123 '), 123);
  for (const value of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '123.5', '-1', '12px', '', '9007199254740992', { score: 123 }]) {
    assert.equal(runtime.normalizeScore(value), null, String(value));
  }
});

test('the local score API stores sanitized completions in the existing profile key and survives reload', () => {
  const { store, storage, writes } = fixture();
  assert.deepEqual(store.getLocalScores('wicked-bites'), { gameId: 'wicked-bites', best: null, runs: [] });
  const result = store.recordLocalScore({ gameId: 'wicked-bites', score: '1234', completionId: 'run-001' });
  assert.equal(result.ok, true);
  assert.equal(result.best, 1234);
  assert.deepEqual(result.run, {
    score: 1234, completedAt: '2026-10-01T12:00:00.000Z', mode: null, ruleset: null, characterId: null, completionId: 'run-001'
  });
  assert.equal(store.getLocalBest('wicked-bites'), 1234);
  const saved = JSON.parse(storage.getItem(runtime.KEYS.profile));
  assert.equal(saved.localScores['wicked-bites'].best, 1234);
  assert.equal(saved.localScores['wicked-bites'].runs.length, 1);
  assert.equal(storage.getItem('toadal:web:v1:scores'), null);
  assert.deepEqual([...new Set(writes)].sort(), [runtime.KEYS.profile, runtime.KEYS.quests].sort());

  const reloaded = runtime.createStore({ storage, now: () => new Date('2026-10-02T12:00:00.000Z'), definitions });
  assert.equal(reloaded.getLocalBest('wicked-bites'), 1234);
  assert.equal(reloaded.getSnapshot().localScores['wicked-bites'].runs[0].completionId, 'run-001');
});

test('score completion IDs deduplicate retries while equal scores from later runs remain valid', () => {
  const { store } = fixture();
  assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 600, completionId: 'run-one' }).ok, true);
  assert.deepEqual(store.recordLocalScore({ gameId: 'wicked-bites', score: 900, completionId: 'run-one' }), { ok: false, reason: 'duplicate-completion' });
  assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 600, completionId: 'run-two' }).ok, true);
  assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 420, completionId: 'run-three' }).ok, true);
  const scores = store.getLocalScores('wicked-bites');
  assert.equal(scores.best, 600);
  assert.deepEqual(scores.runs.map(run => run.score), [600, 600, 420]);
  assert.equal(new Set(scores.runs.map(run => run.completionId)).size, 3);
});

test('separate consumers refresh score state before deduplicating a repeated completion', () => {
  const shared = fixture();
  const consumer = runtime.createStore({ storage: shared.storage, now: shared.now, definitions });
  assert.equal(shared.store.recordLocalScore({ gameId: 'wicked-bites', score: 88, completionId: 'session-run-1' }).ok, true);
  assert.deepEqual(consumer.recordLocalScore({ gameId: 'wicked-bites', score: 88, completionId: 'session-run-1' }), { ok: false, reason: 'duplicate-completion' });
  assert.equal(consumer.getLocalScores('wicked-bites').runs.length, 1);
});

test('score writes roll the profile and game quest back together when storage fails', () => {
  let failed = false;
  const initialProfile = JSON.stringify({ schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', displayName: null, selectedBadge: null, localScores: {} });
  const initialQuests = JSON.stringify({ schemaVersion: 1, updatedAt: '2026-10-01T00:00:00.000Z', items: {}, processedEventIds: [], dailyClaimedPeriod: null });
  const { store, storage } = fixture({ [runtime.KEYS.profile]: initialProfile, [runtime.KEYS.quests]: initialQuests }, '2026-10-01T12:00:00.000Z', {
    failSetItem(key) {
      if (!failed && key === runtime.KEYS.quests) { failed = true; return true; }
      return false;
    }
  });
  assert.deepEqual(store.recordLocalScore({ gameId: 'wicked-bites', score: 52, completionId: 'run-write-fail' }), { ok: false, reason: 'storage-unavailable' });
  assert.equal(storage.getItem(runtime.KEYS.profile), initialProfile);
  assert.equal(storage.getItem(runtime.KEYS.quests), initialQuests);
  assert.equal(store.getLocalBest('wicked-bites'), null);
  assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 52, completionId: 'run-write-fail' }).ok, true, 'a failed write does not consume the completion ID');
});

test('score histories keep only the latest 50 runs per game while preserving best', () => {
  const { store } = fixture();
  for (let score = 0; score < 55; score += 1) {
    assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score, completionId: 'run-' + score }).ok, true);
  }
  const scores = store.getLocalScores('wicked-bites');
  assert.equal(scores.runs.length, 50);
  assert.equal(scores.best, 54);
  assert.equal(scores.runs[0].score, 54);
  assert.equal(scores.runs.at(-1).score, 5);
});

test('future and malformed profile score records remain read-only', () => {
  const future = JSON.stringify({ schemaVersion: 12, marker: 'keep-future-profile' });
  const futureFixture = fixture({ [runtime.KEYS.profile]: future });
  assert.equal(futureFixture.store.recordLocalScore({ gameId: 'wicked-bites', score: 12, completionId: 'run-x' }).reason, 'future-schema-read-only');
  assert.equal(futureFixture.storage.getItem(runtime.KEYS.profile), future);
  assert.deepEqual(futureFixture.writes, []);

  const corrupt = JSON.stringify({ schemaVersion: 1, localScores: { 'wicked-bites': { best: '999', runs: [] } } });
  const corruptFixture = fixture({ [runtime.KEYS.profile]: corrupt });
  assert.equal(corruptFixture.store.recordLocalScore({ gameId: 'wicked-bites', score: 20, completionId: 'run-y' }).reason, 'invalid-stored-data-read-only');
  assert.equal(corruptFixture.storage.getItem(runtime.KEYS.profile), corrupt);
  assert.deepEqual(corruptFixture.writes, []);
});

test('score validation rejects invalid identifiers and metadata before any write', () => {
  const { store, writes } = fixture();
  for (const args of [
    { gameId: 'Wicked Bites', score: 20, completionId: 'run-a' },
    { gameId: 'wicked-bites', score: -1, completionId: 'run-b' },
    { gameId: 'wicked-bites', score: 20, completionId: '' },
    { gameId: 'wicked-bites', score: 20, completionId: 'run-c', characterId: { name: 'Toadal' } },
    { gameId: 'wicked-bites', score: '20 pts', completionId: 'run-d' }
  ]) assert.equal(store.recordLocalScore(args).ok, false);
  assert.deepEqual(writes, []);
});

test('game completion quest progress comes only from a persisted valid local score', () => {
  const { store } = fixture();
  assert.equal(store.getSnapshot().quests.find(item => item.id === 'complete-wicked-bites-preview').progress, 0);
  assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: '0', completionId: 'run-zero' }).ok, true);
  assert.equal(store.getSnapshot().quests.find(item => item.id === 'complete-wicked-bites-preview').complete, true);
  assert.equal(store.claimQuest('complete-wicked-bites-preview').ok, true);
  assert.equal(store.getSnapshot().pass.xp, 15);
  assert.equal(store.getSnapshot().pass.sparks, 2);
  assert.equal(store.getSnapshot().pass.treats, 0, 'a game score does not mint Treats');
});

test('clear removes local scores with the same four website keys and leaves game/mobile keys intact', () => {
  const gameKey = 'toadal:game:wicked-bites:v1:save';
  const mobileKey = 'froggyFeast:save';
  const { map, store } = fixture({ [gameKey]: 'cartridge-save', [mobileKey]: 'mobile-save' });
  store.recordLocalScore({ gameId: 'wicked-bites', score: 90, completionId: 'run-clear' });
  store.clear();
  assert.deepEqual([...Object.values(runtime.KEYS)].filter(key => map.has(key)), []);
  assert.equal(map.get(gameKey), 'cartridge-save');
  assert.equal(map.get(mobileKey), 'mobile-save');
  assert.deepEqual(Object.keys(runtime.KEYS).sort(), ['discoveries', 'pass', 'profile', 'quests']);
});

test('local reward states derive only from collected Treats, quest completions, discoveries, and levels', () => {
  const { store } = fixture();
  let rewards = store.getSnapshot().rewards;
  assert.equal(rewards.find(item => item.id === 'first-treat-found').earned, false);
  assert.equal(rewards.find(item => item.id === 'home-treat-collection').earned, false);
  assert.equal(rewards.find(item => item.id === 'first-quest-complete').earned, false);
  assert.equal(store.recordEvent('route:/world/'), true);
  assert.equal(store.recordEvent('route:/stories/'), true);
  assert.equal(store.getSnapshot().rewards.find(item => item.id === 'world-and-stories-explorer').earned, true);
  assert.equal(store.collectHomeCandy('portal-candy').ok, true);
  assert.equal(store.getSnapshot().rewards.find(item => item.id === 'first-treat-found').earned, true);
  assert.equal(store.getSnapshot().rewards.every(item => item.entitlement === false), true);
});

test('owned progression pages include local truth labels and Leaderboards links', () => {
  for (const name of ['feast-pass', 'quests', 'rewards', 'profile']) {
    const page = JSON.parse(readFileSync(new URL('../studio-project/toadal-feast-website/pages/' + name + '.json', import.meta.url), 'utf8'));
    const html = page.components[0].props.html;
    assert.match(html, /href="\/leaderboards\/"/, name + ' links to Leaderboards');
    assert.match(html, /browser|local|guest/i, name + ' discloses local state');
    assert.match(html, /entitlement|transfer|connected identity|sync/i, name + ' states the entitlement/account boundary');
  }
  const quests = JSON.parse(readFileSync(new URL('../studio-project/toadal-feast-website/pages/quests.json', import.meta.url), 'utf8')).components[0].props.html;
  for (const category of ['Daily', 'Weekly', 'Exploration', 'Game', 'Story']) assert.match(quests, new RegExp('>' + category + '<'));
  const profile = JSON.parse(readFileSync(new URL('../studio-project/toadal-feast-website/pages/profile.json', import.meta.url), 'utf8')).components[0].props.html;
  assert.match(profile, /data-profile-local-score-list/);
});

test('browser boot exposes one shared website-local persistence API', () => {
  const { storage } = fixture();
  const document = { querySelectorAll() { return []; } };
  const root = { localStorage: storage, location: { pathname: '/player/wicked-bites/' } };
  runtime.boot(document, root);
  const store = runtime.getStore(root);
  assert.ok(store);
  assert.equal(store, root.__toadalGuestProgressionStore);
  for (const method of ['recordLocalScore', 'getLocalScores', 'getLocalBest', 'getSnapshot', 'clear']) assert.equal(typeof store[method], 'function');
  assert.equal(runtime.normalizePath('/toadal-feast-web/leaderboards/', definitions), '/leaderboards/');
});

test('runtime list rendering uses div role=list/listitem semantics', () => {
  class Element {
    constructor(tagName) { this.tagName = tagName; this.children = []; this.attributes = {}; this.firstChild = null; this.textContent = ''; }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); this.firstChild = this.children[0] || null; }
    removeChild(child) { this.children = this.children.filter(item => item !== child); this.firstChild = this.children[0] || null; }
    addEventListener() {}
  }
  const container = new Element('div');
  const document = { createElement: tag => new Element(tag) };
  const page = { ownerDocument: document, querySelector: () => container };
  runtime.renderList(page, '[data-progression-quest-list]', [{ title: 'Explore', detail: 'Visit the preview.', id: 'visit' }]);
  assert.equal(container.tagName, 'div');
  assert.equal(container.attributes.role, 'list');
  assert.equal(container.children[0].tagName, 'div');
  assert.equal(container.children[0].attributes.role, 'listitem');
  assert.equal(container.children.some(item => item.tagName === 'li'), false);
});

test('daily button label and aria-disabled track claim state; quest entries show configured reward metadata', () => {
  class Element {
    constructor(tagName) { this.tagName = tagName; this.children = []; this.attributes = {}; this._text = ''; this.disabled = false; this.onclick = null; }
    get firstChild() { return this.children[0] || null; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this._text = String(value); this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { this.children = this.children.filter(item => item !== child); }
    addEventListener() {}
  }
  const nodes = {
    '[data-progression-storage-status]': new Element('p'),
    '[data-daily-reward-status]': new Element('p'),
    '[data-claim-daily]': new Element('button'),
    '[data-progression-quest-list]': new Element('div'),
    '[data-progression-reward-list]': new Element('div'),
    '[data-progression-discovery-list]': new Element('div')
  };
  const page = {
    ownerDocument: { createElement: tag => new Element(tag) },
    querySelector(selector) { return nodes[selector] || null; },
    querySelectorAll() { return []; }
  };
  const document = { querySelectorAll(selector) { return selector === '[data-progression-page]' ? [page] : []; } };
  const { storage, store } = fixture();
  store.recordEvent('route:/world/');
  runtime.boot(document, { localStorage: storage, location: { pathname: '/feast-pass/' } });
  const dailyButton = nodes['[data-claim-daily]'];
  assert.equal(dailyButton.textContent, 'Claim daily check-in');
  assert.equal(dailyButton.attributes['aria-disabled'], 'false');
  assert.match(nodes['[data-progression-quest-list]'].textContent, /Reward: 10 XP, 1 Sparks/);
  dailyButton.onclick();
  assert.equal(dailyButton.textContent, 'Already claimed today');
  assert.equal(dailyButton.disabled, true);
  assert.equal(dailyButton.attributes['aria-disabled'], 'true');
});
