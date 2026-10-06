import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const now = () => new Date('2026-10-05T12:00:00.000Z');

function fixture() {
  const map = new Map();
  const fail = { remove: new Set(), noop: new Set(), read: new Set() };
  const removed = [];
  const storage = {
    getItem(key) { if (fail.read.has(key)) throw new Error('read denied'); return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) {
      removed.push(key);
      if (fail.remove.has(key)) throw new Error('removal denied');
      if (!fail.noop.has(key)) map.delete(key);
    }
  };
  const store = runtime.createStore({ storage, now, definitions });
  store.recordEvent('route:/world/');
  store.claimQuest('visit-world');
  store.recordLocalScore({ gameId: 'wicked-bites', score: 120 });
  map.set('unrelated:game:save', 'preserve-game');
  map.set('toadal:companion:position', 'preserve-preference');
  return { map, fail, removed, storage, store };
}

function bootFixture(storage) {
  const listeners = {};
  const status = { textContent: '' };
  const xp = { textContent: '', getAttribute: () => 'xp' };
  const button = { addEventListener(name, fn) { listeners[name] = fn; } };
  const page = {
    querySelector(selector) { return selector === '[data-progression-storage-status]' ? status : null; },
    querySelectorAll(selector) {
      if (selector === '[data-clear-progression]') return [button];
      if (selector === '[data-progression-stat]') return [xp];
      return [];
    }
  };
  const document = { querySelectorAll: () => [page] };
  const root = { location: { pathname: '/profile/' } };
  if (storage) root.localStorage = storage;
  else Object.defineProperty(root, 'localStorage', { get() { throw new Error('browser storage blocked'); } });
  runtime.boot(document, root);
  return { page, status, xp, click: () => listeners.click() };
}

test('denied reset retains the progress actually left in browser storage', () => {
  const f = fixture();
  const original = f.map.get(runtime.KEYS.pass);
  f.fail.remove.add(runtime.KEYS.pass);
  const state = f.store.clear();
  assert.equal(state.pass.xp, 10, 'a failed removal must not manufacture an empty profile');
  assert.equal(f.map.get(runtime.KEYS.pass), original);
  assert.equal(state.storage.lastReset.ok, false);
  assert.deepEqual(state.storage.lastReset.retainedKeys, [runtime.KEYS.pass]);
  assert.deepEqual(state.storage.lastReset.failedKeys, [runtime.KEYS.pass]);
  assert.equal(state.storage.persistent, false);
});

test('silent removal failure is caught by actual readback', () => {
  const f = fixture();
  f.fail.noop.add(runtime.KEYS.profile);
  const state = f.store.clear();
  assert.equal(state.storage.lastReset.ok, false);
  assert.deepEqual(state.storage.lastReset.retainedKeys, [runtime.KEYS.profile]);
  assert.equal(state.localScores['wicked-bites'].best, 120);
  assert.ok(state.storage.diagnostics.some(row => row.kind === 'clear-not-removed'));
});

test('unreadable reset outcome preserves last-readable values and reports them unverified', () => {
  const f = fixture();
  f.fail.read.add(runtime.KEYS.pass);
  const state = f.store.clear();
  assert.equal(state.pass.xp, 10);
  assert.equal(state.storage.lastReset.ok, false);
  assert.deepEqual(state.storage.lastReset.unverifiedKeys, [runtime.KEYS.pass]);
  assert.equal(state.storage.persistent, false);
  assert.ok(state.storage.diagnostics.some(row => row.kind === 'clear-readback-failed'));
  assert.equal(f.map.has(runtime.KEYS.pass), false, 'actual deletion alone does not prove readable final state');
});

test('reset refusal does not remove future-schema protection from retained data', () => {
  const f = fixture();
  const future = JSON.stringify({ schemaVersion: 99, marker: 'retain-future-data' });
  f.map.set(runtime.KEYS.pass, future);
  f.fail.remove.add(runtime.KEYS.pass);
  const state = f.store.clear();
  assert.ok(state.storage.futureVersionKeys.includes(runtime.KEYS.pass));
  assert.equal(state.storage.lastReset.ok, false);
  assert.equal(f.store.claimDaily().ok, false);
  assert.equal(f.map.get(runtime.KEYS.pass), future);
});

test('malformed retained data stays read-only and is never replaced with safe defaults', () => {
  const f = fixture();
  f.map.set(runtime.KEYS.pass, '{invalid-json');
  f.fail.noop.add(runtime.KEYS.pass);
  assert.equal(f.store.clear().storage.lastReset.ok, false);
  assert.equal(f.store.claimDaily().ok, false);
  assert.equal(f.map.get(runtime.KEYS.pass), '{invalid-json');
});

test('retry can complete a partial reset without touching game saves or preferences', () => {
  const f = fixture();
  f.fail.remove.add(runtime.KEYS.pass);
  assert.equal(f.store.clear().storage.lastReset.ok, false);
  f.fail.remove.clear();
  const state = f.store.clear();
  assert.equal(state.storage.lastReset.ok, true);
  assert.equal(state.storage.lastReset.scope, 'browser');
  assert.equal(state.storage.persistent, true);
  assert.equal(state.pass.xp, 0);
  for (const key of Object.values(runtime.KEYS)) assert.equal(f.map.has(key), false);
  assert.equal(f.map.get('unrelated:game:save'), 'preserve-game');
  assert.equal(f.map.get('toadal:companion:position'), 'preserve-preference');
  assert.ok(f.removed.every(key => Object.values(runtime.KEYS).includes(key)));
  const reloaded = runtime.createStore({ storage: f.storage, now, definitions }).getSnapshot();
  assert.equal(reloaded.pass.xp, 0);
  assert.deepEqual(reloaded.localScores, {});
});

test('snapshot reset details cannot mutate the store report', () => {
  const f = fixture();
  const first = f.store.clear();
  first.storage.lastReset.clearedKeys.length = 0;
  assert.equal(f.store.getSnapshot().storage.lastReset.clearedKeys.length, 4);
});

test('page-memory reset is explicitly distinct from confirmed browser-storage reset', () => {
  const store = runtime.createStore({ now, definitions });
  store.recordEvent('route:/world/');
  const state = store.clear();
  assert.equal(state.storage.lastReset.ok, true);
  assert.equal(state.storage.lastReset.scope, 'page-only');
  assert.equal(state.storage.persistent, false);
});

test('reset button reports failure after render, preserves visible retained XP, and supports retry', () => {
  const f = fixture();
  const ui = bootFixture(f.storage);
  f.fail.remove.add(runtime.KEYS.pass);
  ui.click();
  assert.equal(ui.xp.textContent, '10');
  assert.match(ui.status.textContent, /could not be completed and verified/i);
  assert.doesNotMatch(ui.status.textContent, /was cleared from this browser/i);
  f.fail.remove.clear();
  ui.click();
  assert.equal(ui.xp.textContent, '0');
  assert.match(ui.status.textContent, /was cleared from this browser/i);
});

test('inaccessible localStorage never displays browser-wide reset success', () => {
  const ui = bootFixture();
  ui.click();
  assert.match(ui.status.textContent, /temporary progress in this tab/i);
  assert.match(ui.status.textContent, /could not be verified/i);
  assert.doesNotMatch(ui.status.textContent, /was cleared from this browser/i);
});

// Resource pins must be reproducible from the committed project, not a
// workstation-specific CRLF copy of an otherwise unchanged JavaScript file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.join(repo, 'studio-project/toadal-feast-website');
function resourcePins(value) {
  if (Array.isArray(value)) return value.flatMap(resourcePins);
  if (!value || typeof value !== 'object') return [];
  return [...(value.runtimeCodeResources || []), ...Object.values(value).flatMap(resourcePins)];
}
const pins = ['home.json', 'comic-reader.json', 'player-wicked-bites.json'].flatMap(file =>
  resourcePins(JSON.parse(fs.readFileSync(path.join(project, 'pages', file), 'utf8'))));

test('all seven affected runtime fragment pins match exact authored and exported bytes', () => {
  assert.deepEqual(pins.map(pin => pin.url).sort(), ["/assets/js/guest-progression.js", "/assets/js/home-interactive-discovery.js", "/assets/js/manifest-shell.js", "/assets/js/manifest-shell.js", "/assets/js/play-catalogue.js", "/assets/js/stories-publishing.js", "/public/games/wicked-bites/index.html"].sort());
  for (const pin of pins) {
    for (const root of [path.join(project, 'reference'), path.join(repo, 'dist')]) {
      const bytes = fs.readFileSync(path.join(root, pin.url.slice(1)));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256, pin.url);
    }
  }
});

test('pinned runtime resources have exact-path LF checkout rules', () => {
  const attributes = fs.readFileSync(path.join(repo, '.gitattributes'), 'utf8').split(/\r?\n/);
  for (const url of new Set(pins.map(pin => pin.url))) {
    for (const root of ['/studio-project/toadal-feast-website/reference', '/dist']) {
      assert.ok(attributes.includes(root + url + ' text eol=lf'), root + url);
    }
  }
});
