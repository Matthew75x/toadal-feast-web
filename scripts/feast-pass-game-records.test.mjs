import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { KEYS, createStore, gameRecordView, renderGameRecords } = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const project = new URL('../studio-project/toadal-feast-website/', import.meta.url);
const stamp = '2026-10-06T03:40:00.000Z';
function fixture(initial = {}) {
  const data = new Map(Object.entries(initial)), writes = [], control = { denied: null };
  const storage = {
    getItem(key) { if (control.denied === key) throw new Error('controlled read failure'); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { writes.push(['set', key]); data.set(key, String(value)); },
    removeItem(key) { writes.push(['remove', key]); data.delete(key); }
  };
  const store = createStore({ storage, now: () => stamp });
  return { data, writes, control, storage, store, view: () => gameRecordView(store.getSnapshot(), 'wicked-bites') };
}
function score(f, value) { assert.equal(f.store.recordLocalScore({ gameId: 'wicked-bites', score: value }).ok, true); }
function* nodes(value) {
  if (Array.isArray(value)) for (const child of value) yield* nodes(child);
  else if (value && typeof value === 'object') {
    if (value.type && value.props) yield value;
    for (const child of Object.values(value)) yield* nodes(child);
  }
}
test('missing result is not zero, completion, or a write', () => {
  const f = fixture();
  assert.deepEqual(f.view(), { state: 'not-recorded', best: null, latest: null, recentCount: null, recordedAt: null });
  assert.equal(f.data.size, 0); assert.equal(f.writes.length, 0);
});
test('an actually saved zero score remains a valid result', () => {
  const f = fixture(); score(f, 0);
  assert.deepEqual(f.view(), { state: 'recorded', best: 0, latest: 0, recentCount: 1, recordedAt: stamp });
});
test('latest result and personal best remain distinct', () => {
  const f = fixture(); score(f, 1200); score(f, 12);
  assert.equal(f.view().best, 1200); assert.equal(f.view().latest, 12); assert.equal(f.view().recentCount, 2);
});
test('bounded recent count is not all-time count; all-time best survives eviction', () => {
  const f = fixture(); score(f, 9000);
  for (let n = 1; n <= 55; n++) score(f, n);
  assert.equal(f.view().best, 9000); assert.equal(f.view().latest, 55); assert.equal(f.view().recentCount, 50);
});
test('source read model never changes snapshots, rewards, or stored bytes', () => {
  const f = fixture(); score(f, 70);
  const before = JSON.stringify([...f.data]), state = f.store.getSnapshot(), copy = JSON.stringify(state), count = f.writes.length;
  for (let n = 0; n < 5; n++) gameRecordView(state, 'wicked-bites');
  assert.equal(JSON.stringify(state), copy); assert.equal(JSON.stringify([...f.data]), before); assert.equal(f.writes.length, count);
  assert.equal(state.pass.xp, 0); assert.equal(state.pass.sparks, 0); assert.equal(state.pass.treats, 0);
});
for (const id of ['claw-feed-gulper', 'froggy-fruity-bash', 'toadal-tower-defense', 'croaker-king-defense', '__proto__']) {
  test(`unsupported game cannot acquire score capability from a stored object: ${id}`, () => {
    const state = fixture().store.getSnapshot();
    state.localScores[id] = { best: 999, runs: [] };
    const view = gameRecordView(state, id);
    assert.equal(view.state, 'unsupported'); assert.equal(view.best, null); assert.equal(view.recentCount, null);
  });
}
test('unreadable score storage on boot is unavailable, not empty', () => {
  const storage = { getItem: key => { if (key === KEYS.profile) throw new Error('denied'); return null; }, setItem: () => assert.fail('unexpected write') };
  const state = createStore({ storage }).getSnapshot();
  assert.equal(gameRecordView(state, 'wicked-bites').state, 'unavailable');
});
for (const raw of ['{broken', JSON.stringify({ schemaVersion: 99, localScores: { 'wicked-bites': { best: 5000, runs: [] } } }), JSON.stringify({ schemaVersion: 1, localScores: { 'wicked-bites': { best: 20, runs: [{ score: 20, completedAt: 'invalid' }] } } })]) {
  test('corrupt/future profile preserved; no invented zero or verified result: ' + raw.slice(0, 35), () => {
    const f = fixture({ [KEYS.profile]: raw });
    assert.equal(f.view().state, 'unavailable'); assert.equal(f.view().best, null);
    assert.equal(f.data.get(KEYS.profile), raw); assert.equal(f.writes.length, 0);
  });
}
test('read failure withholds unverified values and a valid read restores them without writes', () => {
  const f = fixture(); score(f, 21); const count = f.writes.length;
  f.control.denied = KEYS.profile; f.store.refreshFromStorage();
  assert.equal(f.view().state, 'unavailable'); assert.equal(f.view().best, null);
  f.control.denied = null; f.store.refreshFromStorage();
  assert.equal(f.view().state, 'recorded'); assert.equal(f.view().best, 21); assert.equal(f.writes.length, count);
});
test('unrelated unreadable XP record does not misclassify a readable saved game score', () => {
  const f = fixture(); score(f, 25); f.control.denied = KEYS.pass; f.store.refreshFromStorage();
  assert.equal(f.view().state, 'recorded'); assert.equal(f.view().best, 25);
});
test('page-only memory never claims a saved browser result', () => {
  const store = createStore({ now: () => stamp });
  assert.equal(gameRecordView(store.getSnapshot(), 'wicked-bites').state, 'temporary');
  store.recordLocalScore({ gameId: 'wicked-bites', score: 5 });
  const view = gameRecordView(store.getSnapshot(), 'wicked-bites');
  assert.equal(view.state, 'temporary'); assert.equal(view.best, 5);
});
test('reset removes the game projection without recreating records or deleting other-game saves', () => {
  const f = fixture({ 'other:game:save': 'keep' }); score(f, 50); f.store.clear();
  assert.equal(f.view().state, 'not-recorded'); assert.deepEqual([...f.data], [['other:game:save', 'keep']]);
});
test('malformed/unbound read-model input fails closed', () => {
  for (const state of [null, {}, { storage: {} }, { storage: { scope: 'browser', readOnlyKeys: [] }, localScores: [] }]) assert.equal(gameRecordView(state, 'wicked-bites').state, 'unavailable');
  const state = fixture().store.getSnapshot();
  state.localScores['wicked-bites'] = { best: 1, runs: [{ score: 50, completedAt: stamp, mode: null, ruleset: null, characterId: null }] };
  assert.equal(gameRecordView(state, 'wicked-bites').state, 'unavailable');
});
test('renderer updates only text/record state and preserves native card/link nodes', () => {
  const f = fixture(); score(f, 0);
  const fields = Object.fromEntries(['state','detail','best','latest','recent-count','recorded-at'].map(field => [field, { textContent: '', attrs: {}, getAttribute: () => field, setAttribute(k,v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } }]));
  const card = { attrs: {}, getAttribute: () => 'wicked-bites', setAttribute(k,v) { this.attrs[k] = v; }, querySelectorAll: () => Object.values(fields) };
  const page = { querySelectorAll: () => [card] };
  renderGameRecords(page, f.store.getSnapshot());
  assert.equal(fields.best.textContent, '0'); assert.equal(fields.latest.textContent, '0'); assert.equal(fields['recorded-at'].attrs.datetime, stamp);
  f.control.denied = KEYS.profile; f.store.refreshFromStorage(); renderGameRecords(page, f.store.getSnapshot());
  assert.equal(fields.best.textContent, '—'); assert.match(fields.state.textContent, /unavailable/); assert.equal(fields['recorded-at'].attrs.datetime, undefined);
});
test('four public native cards match existing catalogue titles/routes; no launch expansion', () => {
  const page = JSON.parse(fs.readFileSync(new URL('pages/feast-pass.json', project), 'utf8'));
  const all = [...nodes(page)], cards = all.filter(n => n.props.attributes?.['data-game-record']);
  assert.deepEqual(cards.map(n => n.props.attributes['data-game-record']), ['wicked-bites','claw-feed-gulper','froggy-fruity-bash','toadal-tower-defense']);
  for (const card of cards) {
    const id = card.props.attributes['data-game-record'], game = JSON.parse(fs.readFileSync(new URL('games/' + id + '.json', project),'utf8'));
    const inner = [...nodes(card)];
    assert.ok(inner.some(n => n.type === 'core.text' && n.props.tag === 'h3' && n.props.text === game.name));
    const availability = game.web.enabled ? 'Existing browser preview' : game.web.browserCartridge?.launchHeld ? 'Launch held' : 'Preview listing only';
    assert.ok(inner.some(n => n.type === 'core.text' && n.props.text === availability));
    const links = inner.filter(n => n.type === 'core.button');
    assert.equal(links[0].props.href, game.route);
    assert.ok(links.every(n => !n.props.href.includes('/public/games/') && !n.props.href.includes('/player/')));
    if (id !== 'wicked-bites') assert.equal(links.length, 1);
    assert.ok(inner.every(n => ['core.text','core.button','layout.container'].includes(n.type)));
  }
  assert.equal(new Set(all.map(n => n.id)).size, all.length);
});
