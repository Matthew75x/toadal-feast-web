import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const adapter = require('../studio-project/toadal-feast-website/reference/assets/js/website-score-adapter.js');
const guest = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');

function hub(target = {}) {
  const listeners = new Map();
  target.addEventListener = (name, listener) => {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(listener);
  };
  target.emit = (name, event = {}) => (listeners.get(name) || []).forEach(listener => listener(event));
  return target;
}
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.textContent = ''; this.appends = 0; }
  get firstChild() { return this.children[0] || null; }
  appendChild(child) { this.children.push(child); this.appends += 1; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); }
}
function fixture() {
  const map = new Map(), writes = [];
  const storage = {
    getItem: key => map.get(key) ?? null,
    setItem(key, value) { writes.push(['set', key]); map.set(key, String(value)); },
    removeItem(key) { writes.push(['remove', key]); map.delete(key); }
  };
  const nodes = {
    '[data-leaderboard-game]': hub({ value: 'wicked-bites' }),
    '[data-leaderboard-scope]': hub({ value: 'local' }),
    '[data-leaderboard-empty]': { hidden: false },
    '[data-leaderboard-personal-best]': { textContent: '' },
    '[data-leaderboard-position]': { textContent: '' },
    '[data-leaderboard-rows]': new Element('tbody')
  };
  const page = { matches: selector => selector === '[data-progression-page]', querySelector: selector => nodes[selector] || null, querySelectorAll: () => [] };
  const document = hub({ visibilityState: 'visible', querySelector: () => null,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => ['[data-progression-page]', '[data-leaderboard-view]'].includes(selector) ? [page] : [] });
  page.ownerDocument = document;
  const root = hub({ document, localStorage: storage, ToadalGuestProgression: guest,
    location: { pathname: '/leaderboards/', search: '', href: 'https://site.example/leaderboards/' } });
  guest.boot(document, root);
  adapter.boot(document, root);
  const otherTab = guest.createStore({ storage });
  return { map, writes, storage, nodes, page, document, root, otherTab,
    best: () => nodes['[data-leaderboard-personal-best]'].textContent,
    rows: nodes['[data-leaderboard-rows]'] };
}
const flush = () => Promise.resolve();
function save(view, score) { assert.equal(view.otherTab.recordLocalScore({ gameId: 'wicked-bites', score }).ok, true); }
function notify(view, key = guest.KEYS.profile, storageArea = view.storage) {
  view.root.emit('storage', { key, storageArea });
}

test('an open leaderboard adopts another tab saved score and reset without writing storage', async () => {
  const view = fixture();
  assert.equal(view.best(), 'Not available');
  save(view, 321); save(view, 123);
  const bytes = [...view.map], writes = view.writes.length;
  notify(view);
  await flush();
  assert.equal(view.best(), '321');
  assert.deepEqual(view.rows.children.map(row => row.children[2].textContent), ['321', '123']);
  assert.equal(view.nodes['[data-leaderboard-empty]'].hidden, true);
  assert.equal(view.writes.length, writes);
  assert.deepEqual([...view.map], bytes);
  view.otherTab.clear();
  const resetWrites = view.writes.length;
  notify(view, null);
  await flush();
  assert.equal(view.best(), 'Not available');
  assert.equal(view.nodes['[data-leaderboard-empty]'].hidden, false);
  assert.equal(view.rows.children.length, 1);
  assert.match(view.rows.firstChild.children[0].textContent, /No saved Wicked Bites scores/);
  assert.equal(view.writes.length, resetWrites);
});

test('focus, cached-page restore and visible-document return repaint after guest rehydration', async () => {
  for (const event of ['focus', 'pageshow', 'visibilitychange']) {
    const view = fixture(); save(view, 42);
    const writes = view.writes.length;
    if (event === 'visibilitychange') view.document.emit(event);
    else view.root.emit(event, { persisted: true });
    await flush();
    assert.equal(view.best(), '42', event);
    view.otherTab.clear();
    if (event === 'visibilitychange') view.document.emit(event);
    else view.root.emit(event, { persisted: true });
    const afterResetWrites = view.writes.length;
    await flush();
    assert.equal(view.best(), 'Not available', event + ' reset');
    assert.equal(view.writes.length, afterResetWrites);
    assert.ok(afterResetWrites >= writes);
  }
});

test('unrelated storage, noncached pageshow and hidden visibility do not repaint', async () => {
  const view = fixture(), initialRow = view.rows.firstChild;
  save(view, 99);
  notify(view, 'other:game:save');
  notify(view, guest.KEYS.profile, {});
  notify(view, guest.KEYS.profile, null);
  view.root.emit('pageshow', { persisted: false });
  view.document.visibilityState = 'hidden';
  view.document.emit('visibilitychange');
  await flush();
  assert.equal(view.best(), 'Not available');
  assert.equal(view.rows.firstChild, initialRow);
  view.root.emit('focus'); view.root.emit('focus');
  const appends = view.rows.appends;
  await flush();
  assert.equal(view.best(), '99');
  assert.equal(view.rows.appends, appends + 1, 'one repaint for queued lifecycle events');
});

test('refresh retains the chosen game and connected scope without inventing public rankings', async () => {
  const view = fixture(); save(view, 77);
  view.nodes['[data-leaderboard-scope]'].value = 'connected';
  view.nodes['[data-leaderboard-scope]'].emit('change');
  notify(view); await flush();
  assert.equal(view.best(), 'Not available');
  assert.match(view.rows.firstChild.children[0].textContent, /Connected rankings are unavailable/);
  view.nodes['[data-leaderboard-scope]'].value = 'local';
  view.nodes['[data-leaderboard-game]'].value = 'claw-feed-gulper';
  view.nodes['[data-leaderboard-game]'].emit('change');
  view.root.emit('focus'); await flush();
  assert.equal(view.nodes['[data-leaderboard-game]'].value, 'claw-feed-gulper');
  assert.equal(view.best(), 'Not available');
  assert.match(view.rows.firstChild.children[0].textContent, /does not currently expose a trusted website score feed/);
  view.nodes['[data-leaderboard-game]'].value = 'wicked-bites';
  view.nodes['[data-leaderboard-game]'].emit('change');
  assert.equal(view.best(), '77');
});
