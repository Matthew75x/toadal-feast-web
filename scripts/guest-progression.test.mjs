import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');

function fixture(initial = {}, clock = '2026-10-01T12:00:00.000Z') {
  const map = new Map(Object.entries(initial));
  const writes = [];
  const storage = {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { writes.push(key); map.set(key, String(value)); },
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
  assert.equal(definitions.treats.length, 3);
  assert.deepEqual(definitions.treats.map(item => item.id), ['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  assert.deepEqual(definitions.discoveries.map(item => item.route), ['/world/', '/stories/']);
  assert.equal(state.rewards.length, 3);
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

test('Wicked Bites personal best persists locally only from the validated website adapter contract', () => {
  const { store, storage, now } = fixture();
  assert.deepEqual(store.recordLocalHighScore({ gameId: 'other-game', score: 80 }), { ok: false, reason: 'invalid-score-record' });
  assert.deepEqual(store.recordLocalHighScore({ gameId: 'wicked-bites', score: -1 }), { ok: false, reason: 'invalid-score-record' });
  assert.deepEqual(store.recordLocalHighScore({ gameId: 'wicked-bites', score: 120 }), { ok: true, gameId: 'wicked-bites', score: 120 });
  assert.deepEqual(store.recordLocalHighScore({ gameId: 'wicked-bites', score: 99 }), { ok: false, reason: 'not-a-personal-best' });
  assert.equal(store.getSnapshot().pass.xp, 0, 'scores never grant progression currency');
  const reloaded = runtime.createStore({ storage, now, definitions });
  assert.deepEqual(reloaded.getSnapshot().localHighScores.map(({ gameId, score }) => [gameId, score]), [['wicked-bites', 120]]);
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
  assert.equal(snapshot.rewards.length, 3);
  assert.deepEqual(snapshot.rewards.map(item => [item.level, item.unlocked, item.entitlement]), [
    [1, true, false], [2, false, false], [3, false, false]
  ]);
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
  assert.equal(store.collectHomeCandy('portal-candy').reason, 'already-collected');
  assert.equal(store.collectHomeCandy('lower-page-candy').ok, true);
  assert.equal(store.collectHomeCandy('not-a-v1-candy').reason, 'unknown-candy');

  for (let hit = 1; hit <= 4; hit += 1) {
    const result = store.hitGoldenBlock();
    assert.equal(result.ok, true);
    assert.equal(result.state.goldenBlock.hits, hit);
    assert.equal(result.state.goldenBlock.complete, hit === 4);
    assert.equal(result.state.candies.includes('golden-block-candy'), false);
  }
  assert.equal(store.hitGoldenBlock().reason, 'already-broken');
  assert.equal(store.collectHomeCandy('golden-block-candy').ok, true);
  assert.equal(store.collectHomeCandy('golden-block-candy').reason, 'already-collected');
  assert.deepEqual(store.getHomeInteractionState().candies, ['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  assert.deepEqual([...new Set(writes)].sort(), [runtime.KEYS.discoveries, runtime.KEYS.pass, runtime.KEYS.quests].sort());
  assert.equal(storage.getItem('toadal:web:v1:home-interaction'), null);

  const reloaded = runtime.createStore({ storage, now: first.now, definitions });
  assert.deepEqual(reloaded.getHomeInteractionState().candies, ['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  assert.equal(reloaded.getHomeInteractionState().goldenBlock.hits, 4);
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
