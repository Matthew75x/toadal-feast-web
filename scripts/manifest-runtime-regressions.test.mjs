import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { readWickedBitesHudScore, SCORE_LOCALES, scoreLocaleEnvironment, assertScoreLocaleChild } from './lib/wicked-bites-score-fixture.mjs';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const require = createRequire(import.meta.url);
const site = '../studio-project/toadal-feast-website/';
const progression = require(site + 'reference/assets/js/guest-progression.js');
const definitions = require(site + 'reference/assets/js/progression-definitions.js');
const adapter = require(site + 'reference/assets/js/website-score-adapter.js');
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '..', 'studio-project', 'toadal-feast-website');
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);

function storageFixture() {
  const values = new Map();
  const writes = [];
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes.push(key); values.set(key, value); },
    removeItem: key => values.delete(key)
  };
  const create = () => progression.createStore({ storage, definitions, now: () => new Date('2026-10-02T12:00:00Z') });
  return { storage, values, writes, create, store: create() };
}

test('all-time best survives eviction from the latest 50 runs and remains writable', () => {
  const fixture = storageFixture();
  assert.equal(fixture.store.recordLocalScore({ gameId: 'wicked-bites', score: 1000 }).ok, true);
  for (let i = 0; i < 50; i++) assert.equal(fixture.store.recordLocalScore({ gameId: 'wicked-bites', score: 1 }).ok, true);
  const reloaded = fixture.create();
  const state = reloaded.getSnapshot();
  assert.equal(state.localScores['wicked-bites'].runs.length, 50);
  assert.equal(state.localScores['wicked-bites'].best, 1000);
  assert.equal(state.localHighScores[0].score, 1000);
  assert.equal(state.storage.diagnostics.length, 0);
  assert.equal(reloaded.recordLocalScore({ gameId: 'wicked-bites', score: 2 }).ok, true);
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].best, 1000);
  assert.equal(fixture.create().recordLocalScore({ gameId: 'wicked-bites', score: 1001 }).personalBest, true);
});

test('best below retained run maximum is still invalid and never overwritten', () => {
  const fixture = storageFixture();
  fixture.store.recordLocalScore({ gameId: 'wicked-bites', score: 100 });
  const profile = JSON.parse(fixture.storage.getItem(progression.KEYS.profile));
  profile.localScores['wicked-bites'].best = 1;
  fixture.storage.setItem(progression.KEYS.profile, JSON.stringify(profile));
  const before = fixture.storage.getItem(progression.KEYS.profile);
  assert.equal(fixture.create().recordLocalScore({ gameId: 'wicked-bites', score: 200 }).reason, 'stored-data-read-only');
  assert.equal(fixture.storage.getItem(progression.KEYS.profile), before);
});

class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.attributes = {}; this._text = ''; }
  get firstChild() { return this.children[0] || null; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, handler) { this[type] = handler; }
}
function documentFixture(base = '/toadal-feast-web/') {
  const brand = new Element('a');
  brand.setAttribute('href', base);
  return {
    baseURI: 'https://site.example' + base + 'profile/',
    querySelector: selector => selector === '.site-brand' ? brand : null,
    createElement: tag => new Element(tag)
  };
}

test('runtime-generated quest and score links retain root/project hosting and query/fragments', () => {
  for (const base of ['/', '/toadal-feast-web/']) {
    const document = documentFixture(base);
    const container = new Element();
    const page = { ownerDocument: document, querySelector: () => container };
    const prefix = base === '/' ? '' : base.slice(0, -1);
    progression.renderList(page, '[data-progression-quest-list]', [
      { title: 'Daily check-in', href: '/feast-pass/#daily-reward-title' },
      { title: 'Personal best', href: '/leaderboards/?game=wicked-bites' }
    ]);
    assert.equal(container.children[0].children.find(child => child.tagName === 'a').href, prefix + '/feast-pass/#daily-reward-title');
    assert.equal(container.children[1].children.find(child => child.tagName === 'a').href, prefix + '/leaderboards/?game=wicked-bites');
    assert.equal(progression.siteHref(document, prefix + '/profile/'), prefix + '/profile/', 'already-prefixed URLs are not doubled');
  }
});

for (const locale of SCORE_LOCALES) {
  test(`localized adapter completion/store fixture (not gameplay): ${locale}`, () => {
    const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern=^authored sibling HUD', import.meta.filename], {
      encoding: 'utf8', env: scoreLocaleEnvironment(locale)
    });
    assertScoreLocaleChild(child);
  });
}

test('authored sibling HUD receives validated lifecycle messages, timer and completed local score', () => {
  if (process.env.TOADAL_SCORE_TEST_LOCALE) assert.equal(new Intl.NumberFormat().resolvedOptions().locale, process.env.TOADAL_SCORE_TEST_LOCALE);
  const record = JSON.parse(fs.readFileSync(new URL(site + 'pages/player-wicked-bites.json', import.meta.url), 'utf8'));
  const componentMarkup = record.components
    .filter(component => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map(component => ({
    component,
    html: projectPage(projectRoot, { ...record, components: [component] }),
    }));
  const hostMarkup = componentMarkup.find(({ html }) => html.includes('data-player-shell'))?.html;
  const hudMarkup = componentMarkup.find(({ html }) => html.includes('data-score-session'))?.html;
  const hudId = hostMarkup.match(/data-player-hud='([^']+)'/)?.[1];
  assert.ok(hudId, 'host explicitly associates its sibling HUD');
  assert.ok(hudMarkup.includes("id='" + hudId + "'"));
  assert.ok(!hostMarkup.includes('data-score-current'), 'regression fixture must retain sibling components');
  const source = hostMarkup.match(/<iframe[^>]*src=["']([^"']+)["']/)?.[1];
  assert.ok(source);
  const fixture = storageFixture();
  const score = new Element(), best = new Element(), elapsed = new Element(), status = new Element();
  const label = new Element('dt'); elapsed.parentElement = { querySelector: () => label };
  const hudNodes = { '[data-score-current]': score, '[data-score-session-best]': best, '[data-score-elapsed]': elapsed, '[data-score-session-status]': status };
  const hud = {
    querySelector: selector => hudNodes[selector] || null,
    matches: selector => selector === '[data-progression-page="game-session"]',
    __toadalProgressionStore: fixture.store
  };
  const frame = { src: 'https://site.example' + source, contentWindow: {}, isConnected: true, getAttribute: name => name === 'src' ? source : null };
  const shell = {
    querySelector: selector => selector === '[data-player-frame]' ? frame : null,
    contains: node => node === frame,
    getAttribute: name => name === 'data-player-hud' ? hudId : name === 'data-game-id' ? 'wicked-bites' : null
  };
  const document = {
    getElementById: id => id === hudId ? hud : null,
    querySelectorAll: selector => selector === '[data-player-shell]' ? [shell] : []
  };
  let clock = 0, listener, timer;
  const root = {
    document, location: { href: 'https://site.example/player/wicked-bites/' }, performance: { now: () => clock },
    addEventListener(type, callback) { if (type === 'message') listener = callback; },
    setInterval(callback) { timer = callback; }
  };
  adapter.boot(document, root);
  assert.equal(typeof listener, 'function');
  assert.equal(typeof timer, 'function');
  const message = (type, payload = {}, sourceWindow = frame.contentWindow) =>
    listener({ source: sourceWindow, origin: 'null', data: { protocol: adapter.PROTOCOL, gameId: adapter.GAME_ID, type, payload } });
  message('game:started');
  assert.match(status.textContent, /Current run is in memory/);
  clock = 65000;
  message('game:score', { score: readWickedBitesHudScore(207) });
  assert.equal(score.textContent, (207).toLocaleString());
  assert.equal(elapsed.textContent, '1:05');
  assert.equal(label.textContent, 'Session time');
  message('game:complete', { score: 999 }, {});
  assert.equal(fixture.store.getSnapshot().localHighScores.length, 0, 'attacker source must not persist');
  message('game:complete', { score: readWickedBitesHudScore(207) });
  message('game:complete', { score: readWickedBitesHudScore(207) });
  assert.match(status.textContent, /Completed score saved in this browser only/);
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].best, 207);
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].runs.length, 1, 'duplicate completion is not a second run');
  clock = 80000; timer();
  assert.equal(elapsed.textContent, '1:05', 'completed timer is stopped');
  message('game:started');
  assert.match(status.textContent, /Current run is in memory/, 'a new run must not retain the previous saved-result message');
  message('game:score', { score: readWickedBitesHudScore(1234) });
  message('game:complete', { score: '1,234.567' });
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].runs.length, 1, 'malformed completion never writes');
  message('game:complete', { score: readWickedBitesHudScore(1234567) });
  message('game:complete', { score: readWickedBitesHudScore(1234567) });
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].best, 1234567, 'real UI-formatted result normalizes to a numeric personal best');
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].runs.at(-1).score, 1234567);
  assert.match(status.textContent, /Completed score saved in this browser only/);
  assert.equal(score.textContent, (1234567).toLocaleString(), 'host displays the normalized completed result');
  assert.equal(fixture.create().getSnapshot().localScores['wicked-bites'].runs.length, 2);
  // Rehydrate the real store, then complete a later lower run through the real
  // adapter. This remains a DOM/store fixture, not an actual gameplay witness.
  hud.__toadalProgressionStore = fixture.create();
  message('game:started');
  message('game:complete', { score: readWickedBitesHudScore(1234) });
  message('game:complete', { score: readWickedBitesHudScore(1234) });
  const saved = fixture.create().getSnapshot().localScores['wicked-bites'];
  assert.equal(saved.best, 1234567, 'later lower run must not lower the saved best');
  assert.deepEqual(saved.runs.map(run => run.score), [207, 1234567, 1234], 'one numeric record per genuine fixture completion');
});

test('character artwork discovery persists idempotently without inventing progression rewards', () => {
  const fixture = storageFixture();
  assert.equal(fixture.store.discoverCharacter('unknown').reason, 'unknown-character');
  assert.equal(fixture.store.discoverCharacter('gully').ok, true);
  assert.equal(fixture.create().discoverCharacter('gully').reason, 'already-discovered');
  const state = fixture.create().getSnapshot();
  assert.equal(state.characterDiscoveries[0].characterId, 'gully');
  assert.equal(state.characterDiscoveries[0].routeVisit, false, 'artwork is not a website route visit');
  assert.match(state.characterDiscoveries[0].description, /not game, story, or canon completion/);
  assert.equal(state.pass.xp, 0);
  assert.equal(state.pass.sparks, 0);
  assert.equal(state.pass.treats, 0);
  assert.deepEqual([...new Set(fixture.writes)], [progression.KEYS.discoveries]);
  fixture.store.recordEvent('route:/world/');
  assert.equal(fixture.create().getSnapshot().discoveries.filter(item => item.routeVisit).length, 1, 'route visits are classified separately from artwork');
});

test('character discovery respects future record and storage failures', () => {
  const fixture = storageFixture();
  const raw = JSON.stringify({ schemaVersion: 99, marker: 'preserve' });
  fixture.storage.setItem(progression.KEYS.discoveries, raw);
  assert.equal(fixture.create().discoverCharacter('toadal').reason, 'stored-data-read-only');
  assert.equal(fixture.storage.getItem(progression.KEYS.discoveries), raw);
  const store = progression.createStore({ definitions, storage: { getItem: () => null, setItem() { throw new Error('quota'); }, removeItem() {} } });
  assert.equal(store.discoverCharacter('toadal').reason, 'storage-unavailable');
  assert.equal(store.getSnapshot().characterDiscoveries.length, 0);
});
