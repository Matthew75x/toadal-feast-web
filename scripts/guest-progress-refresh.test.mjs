import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const now = () => new Date('2026-10-05T12:00:00.000Z');

function fixture() {
  const map = new Map(), writes = [], reads = [], denied = new Set();
  const storage = {
    getItem(key) { reads.push(key); if (denied.has(key)) throw new Error('injected read denial'); return map.get(key) ?? null; },
    setItem(key, value) { writes.push(['set', key]); map.set(key, String(value)); },
    removeItem(key) { writes.push(['remove', key]); map.delete(key); }
  };
  return { map, writes, reads, denied, storage,
    store: runtime.createStore({ storage, now, definitions }) };
}
function hub(target = {}) {
  const events = new Map();
  target.addEventListener = (name, fn) => {
    if (!events.has(name)) events.set(name, []);
    events.get(name).push(fn);
  };
  target.emit = (name, event = {}) => (events.get(name) || []).forEach(fn => fn(event));
  target.listenerCount = name => (events.get(name) || []).length;
  return target;
}
function ui(storage, pathname = '/profile/') {
  let renders = 0, value = '';
  const xp = { getAttribute: () => 'xp', get textContent() { return value; }, set textContent(text) { value = text; renders += 1; } };
  const status = { textContent: '' };
  const daily = { textContent: '', disabled: false, setAttribute() {} };
  const reset = hub();
  const nodes = { '[data-progression-storage-status]': status, '[data-claim-daily]': daily };
  const page = {
    querySelector: selector => nodes[selector] || null,
    querySelectorAll: selector => selector === '[data-progression-stat]' ? [xp] : selector === '[data-clear-progression]' ? [reset] : []
  };
  const document = hub({ visibilityState: 'visible', querySelectorAll: () => [page] });
  const root = hub({ location: { pathname } });
  if (storage) root.localStorage = storage;
  else Object.defineProperty(root, 'localStorage', { get() { throw new Error('blocked localStorage'); } });
  runtime.boot(document, root);
  return { page, document, root, xp, status, daily, reset, get renders() { return renders; } };
}
function gainWorld(f) {
  assert.equal(f.store.recordEvent('route:/world/'), true);
  assert.equal(f.store.claimQuest('visit-world').ok, true);
  return 10;
}
function notify(view, storage, key = runtime.KEYS.pass, extra = {}) {
  view.root.emit('storage', { storageArea: storage, key, ...extra });
}

test('another tab claim updates the already-open view without writes or reload', () => {
  const f = fixture(), view = ui(f.storage);
  assert.equal(view.xp.textContent, '0');
  gainWorld(f);
  const writes = f.writes.length;
  notify(view, f.storage);
  assert.equal(view.xp.textContent, '10', 'open Profile must not keep stale zero after a saved quest claim');
  assert.equal(f.writes.length, writes, 'receiving a change must be read-only');
});

test('refresh adopts all four owned records and never grants or writes anything', () => {
  const f = fixture();
  const stale = runtime.createStore({ storage: f.storage, now, definitions });
  gainWorld(f);
  f.store.discoverCharacter('toadal');
  f.store.recordLocalScore({ gameId: 'wicked-bites', score: 120 });
  f.map.set('other:game:save', 'untouched');
  const bytes = [...f.map], writes = f.writes.length;
  const state = stale.refreshFromStorage();
  assert.equal(state.pass.xp, 10);
  assert.equal(state.localScores['wicked-bites'].best, 120);
  assert.equal(state.characterDiscoveries.length, 1);
  assert.equal(state.quests.find(q => q.id === 'visit-world').claimedAt !== null, true);
  assert.equal(state.storage.lastRefresh.ok, true);
  assert.equal(state.storage.lastRefresh.changed, true);
  assert.deepEqual([...f.map], bytes);
  assert.equal(f.writes.length, writes);
});

test('unrelated keys, sessionStorage and unbound storage events are ignored', () => {
  const f = fixture(), view = ui(f.storage);
  gainWorld(f);
  const reads = f.reads.length, renders = view.renders;
  notify(view, f.storage, 'other:game:save');
  notify(view, {}, runtime.KEYS.pass);
  notify(view, null, runtime.KEYS.pass);
  assert.equal(f.reads.length, reads);
  assert.equal(view.renders, renders);
  assert.equal(view.xp.textContent, '0');
  notify(view, f.storage);
  assert.equal(view.xp.textContent, '10');
});

test('notification payload is never treated as a saved progress record', () => {
  const f = fixture(), view = ui(f.storage);
  gainWorld(f);
  notify(view, f.storage, runtime.KEYS.pass, { newValue: JSON.stringify({ schemaVersion: 1, xp: 9999 }) });
  assert.equal(view.xp.textContent, '10', 'read actual current storage, not event.newValue');
});

test('reset in another tab clears old display without re-recording route visits', () => {
  const f = fixture();
  gainWorld(f);
  const view = ui(f.storage, '/world/');
  assert.equal(view.xp.textContent, '10');
  f.store.clear();
  const writes = f.writes.length;
  notify(view, f.storage, null);
  assert.equal(view.xp.textContent, '0');
  assert.deepEqual(view.page.__toadalProgressionStore.getSnapshot().discoveries, []);
  assert.equal(f.writes.length, writes);
  for (const key of Object.values(runtime.KEYS)) assert.equal(f.map.has(key), false);
});

test('failed refresh preserves last-readable XP, reports uncertainty, and recovers', () => {
  const f = fixture();
  gainWorld(f);
  const view = ui(f.storage);
  const pass = JSON.parse(f.map.get(runtime.KEYS.pass));
  f.map.set(runtime.KEYS.pass, JSON.stringify({ ...pass, xp: 20 }));
  f.denied.add(runtime.KEYS.pass);
  notify(view, f.storage);
  assert.equal(view.xp.textContent, '10');
  assert.match(view.status.textContent, /could not be fully refreshed/i);
  let state = view.page.__toadalProgressionStore.getSnapshot();
  assert.equal(state.storage.lastRefresh.ok, false);
  assert.deepEqual(state.storage.lastRefresh.unreadableKeys, [runtime.KEYS.pass]);
  assert.equal(state.storage.persistent, false);
  f.denied.clear();
  view.root.emit('focus');
  assert.equal(view.xp.textContent, '20');
  state = view.page.__toadalProgressionStore.getSnapshot();
  assert.equal(state.storage.lastRefresh.ok, true);
  assert.equal(state.storage.persistent, true);
  assert.doesNotMatch(view.status.textContent, /could not be fully refreshed/i);
});

test('future or malformed external data retains the last-readable view without overwriting storage', () => {
  for (const raw of ['{broken', JSON.stringify({ schemaVersion: 99, xp: 9999, marker: 'future' })]) {
    const f = fixture(); gainWorld(f);
    const view = ui(f.storage), writes = f.writes.length;
    f.map.set(runtime.KEYS.pass, raw);
    notify(view, f.storage);
    assert.equal(view.xp.textContent, '10');
    assert.equal(view.page.__toadalProgressionStore.getSnapshot().storage.lastRefresh.ok, false);
    assert.match(view.status.textContent, /last readable/i);
    assert.equal(f.map.get(runtime.KEYS.pass), raw);
    assert.equal(f.writes.length, writes);
  }
});

test('persisted page restore refreshes; ordinary initial pageshow is not a replay', () => {
  const f = fixture(), view = ui(f.storage);
  gainWorld(f);
  view.root.emit('pageshow', { persisted: false });
  assert.equal(view.xp.textContent, '0');
  const writes = f.writes.length;
  view.root.emit('pageshow', { persisted: true });
  assert.equal(view.xp.textContent, '10');
  assert.equal(f.writes.length, writes);
});

test('visibility return refreshes once visible, not while hidden', () => {
  const f = fixture(), view = ui(f.storage);
  gainWorld(f);
  view.document.visibilityState = 'hidden';
  const reads = f.reads.length;
  view.document.emit('visibilitychange');
  assert.equal(f.reads.length, reads);
  view.document.visibilityState = 'visible';
  view.document.emit('visibilitychange');
  assert.equal(view.xp.textContent, '10');
});

test('unchanged focus does not rerender lists or erase the reset operation message', () => {
  const f = fixture(), view = ui(f.storage);
  view.reset.emit('click');
  const message = view.status.textContent, renders = view.renders;
  assert.match(message, /was cleared from this browser/i);
  view.root.emit('focus');
  assert.equal(view.renders, renders);
  assert.equal(view.status.textContent, message);
  assert.equal(view.page.__toadalProgressionStore.getSnapshot().storage.lastReset.ok, true);
});

test('new external progress supersedes a stale reset result', () => {
  const f = fixture(), view = ui(f.storage);
  view.reset.emit('click');
  gainWorld(f);
  notify(view, f.storage);
  assert.equal(view.xp.textContent, '10');
  assert.equal(view.page.__toadalProgressionStore.getSnapshot().storage.lastReset, null);
  assert.doesNotMatch(view.status.textContent, /was cleared from this browser/i);
});

test('repeated boot does not add duplicate refresh listeners or replay writes', () => {
  const f = fixture(), view = ui(f.storage, '/world/');
  const store = view.page.__toadalProgressionStore, writes = f.writes.length;
  runtime.boot(view.document, view.root);
  assert.equal(view.page.__toadalProgressionStore, store);
  for (const name of ['storage', 'focus', 'pageshow']) assert.equal(view.root.listenerCount(name), 1, name);
  assert.equal(view.document.listenerCount('visibilitychange'), 1);
  assert.equal(f.writes.length, writes);
});

test('page-memory mode survives lifecycle refresh without claiming browser/account synchronization', () => {
  const view = ui();
  view.daily.onclick();
  const before = view.page.__toadalProgressionStore.getSnapshot();
  view.root.emit('focus');
  view.root.emit('pageshow', { persisted: true });
  const after = view.page.__toadalProgressionStore.getSnapshot();
  assert.equal(after.pass.xp, before.pass.xp);
  assert.equal(after.storage.persistent, false);
  assert.equal(after.storage.lastRefresh.scope, 'page-only');
  assert.doesNotMatch(view.status.textContent, /synced|synchronized|refreshed from this browser/i);
});

test('refresh report is defensive and repeated unchanged refresh is a no-op', () => {
  const f = fixture();
  const first = f.store.refreshFromStorage();
  first.storage.lastRefresh.unreadableKeys.push('forged');
  assert.deepEqual(f.store.getSnapshot().storage.lastRefresh.unreadableKeys, []);
  assert.equal(f.store.refreshFromStorage().storage.lastRefresh.changed, false);
});
