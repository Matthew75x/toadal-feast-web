import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../studio-project/toadal-feast-website/reference/assets/js/site-search.js', import.meta.url), 'utf8');

function harness({ hash = '', initiallyOpen = [], legacy = false } = {}) {
  const pendingToggles = new Set(), pendingFrames = [];
  class Element {
    constructor(tag, id, text = '') { this.tagName = tag; this.id = id; this.textContent = text; this.hidden = false; this.value = ''; this.listeners = new Map(); this.attributes = {}; this._open = initiallyOpen.includes(id); }
    addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(listener); }
    emit(type, values = {}) { const event = { type, button: 0, detail: 1, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values }; for (const listener of this.listeners.get(type) || []) listener(event); return event; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    querySelector(selector) { assert.equal(selector, 'summary'); return this.summary || null; }
    focus(options) { this.focusOptions = options; document.activeElement = this; }
    get open() { return this._open; }
    set open(value) { const next = !!value; if (next !== this._open) { this._open = next; pendingToggles.add(this); } }
  }
  const input = new Element('INPUT', 'help-query');
  const count = new Element('P', 'help-count');
  const cards = [
    new Element(legacy ? 'ARTICLE' : 'DETAILS', 'guest-progress', 'Guest progress stays on this device.'),
    new Element(legacy ? 'ARTICLE' : 'DETAILS', 'preview-states', 'Game previews show current availability.'),
    new Element(legacy ? 'ARTICLE' : 'DETAILS', 'contact', 'Contact and feedback routes.')
  ];
  for (const card of cards) { card.attributes['data-support-text'] = card.textContent; if (!legacy) card.summary = new Element('SUMMARY', card.id + '-summary'); }
  const location = { href: 'https://example.invalid/toadal-feast-web/support/' + hash, hash };
  const links = [ '#preview-states', '#contact', 'https://elsewhere.invalid/#preview-states', '/toadal-feast-web/world/#contact' ].map(href => {
    const link = new Element('A', 'link-' + href); link.href = new URL(href, location.href).href; return link;
  });
  const document = {
    readyState: 'complete', activeElement: null,
    querySelector(selector) { if (selector === '[data-site-search]') return null; if (selector === '[data-support-search]') return input; if (selector === '[data-support-count]') return count; throw new Error('Unexpected selector: ' + selector); },
    querySelectorAll(selector) { if (selector === '[data-support-article]') return cards; if (selector === 'a[href]') return links; throw new Error('Unexpected selector: ' + selector); }
  };
  const window = new Element('WINDOW', 'window');
  window.requestAnimationFrame = callback => pendingFrames.push(callback);
  vm.runInNewContext(source, { document, location, window, URL, URLSearchParams, Map });
  function flushToggles() { const pending = [...pendingToggles]; pendingToggles.clear(); for (const card of pending) card.emit('toggle'); }
  function flushFrames() { for (const callback of pendingFrames.splice(0)) callback(); }
  function search(value) { input.value = value; input.emit('input'); }
  return { input, count, cards, links, document, location, window, search, flushToggles, flushFrames };
}

test('Support filtering reveals matching native details and restores prior disclosure states', () => {
  const h = harness({ initiallyOpen: ['contact'] });
  h.search('guest progress'); h.flushToggles();
  assert.deepEqual(h.cards.map(card => card.hidden), [false, true, true]);
  assert.equal(h.cards[0].open, true);
  assert.equal(h.count.textContent, '1 help topic shown.');
  h.search(''); h.flushToggles();
  assert.deepEqual(h.cards.map(card => card.hidden), [false, false, false]);
  assert.deepEqual(h.cards.map(card => card.open), [false, false, true]);
  assert.equal(h.count.textContent, '3 help topics shown.');
});

test('clearing a filter respects reader disclosure changes, including a pending toggle event', () => {
  const h = harness();
  h.search('guest'); h.flushToggles();
  h.cards[0].open = false; h.flushToggles();
  h.cards[0].open = true; h.flushToggles();
  h.search(''); h.flushToggles();
  assert.equal(h.cards[0].open, true, 'reader-expanded answer should remain open after clearing');
  h.search('guest'); h.flushToggles();
  h.cards[0].open = false;
  h.search(''); h.flushToggles();
  assert.equal(h.cards[0].open, false, 'a reader close before a queued native toggle must be preserved');
});

test('a filtered-out topic quicklink reveals and opens its target while retaining native navigation', () => {
  const h = harness(); const originalIds = h.cards.map(card => card.id);
  h.search('nothing matches'); h.flushToggles();
  assert.equal(h.count.textContent, '0 help topics shown.');
  const event = h.links[0].emit('click', { detail: 0 }); h.flushToggles();
  assert.equal(h.document.activeElement, null, 'keyboard focus waits for native fragment navigation');
  h.flushFrames();
  assert.equal(event.defaultPrevented, false);
  assert.equal(h.input.value, '');
  assert.deepEqual(h.cards.map(card => card.hidden), [false, false, false]);
  assert.equal(h.cards[1].open, true);
  assert.equal(h.document.activeElement, h.cards[1].summary);
  assert.equal(h.cards[1].summary.focusOptions.preventScroll, true);
  assert.deepEqual(h.cards.map(card => card.id), originalIds, 'native topic identities are preserved');
  assert.equal(new URL(h.links[0].href).hash, '#preview-states');
});

test('pointer links reveal answers without moving focus and unrelated or modified links leave filtering intact', () => {
  const h = harness(); h.search('nothing matches'); h.flushToggles();
  for (const [link, values] of [[h.links[0], { ctrlKey: true }], [h.links[0], { button: 1 }], [h.links[2], {}], [h.links[3], {}]]) {
    link.emit('click', values);
    assert.equal(h.input.value, 'nothing matches');
    assert.equal(h.cards[1].hidden, true);
  }
  h.links[0].emit('click'); h.flushToggles();
  assert.equal(h.cards[1].hidden, false);
  assert.equal(h.cards[1].open, true);
  assert.equal(h.document.activeElement, null);
});

test('direct and history topic fragments open details and reveal filtered targets', () => {
  const h = harness({ hash: '#preview-states' }); h.flushToggles();
  assert.equal(h.cards[1].open, true);
  h.search('guest'); h.flushToggles();
  h.location.hash = '#contact'; h.location.href = 'https://example.invalid/toadal-feast-web/support/#contact';
  h.window.emit('hashchange'); h.flushToggles();
  assert.equal(h.input.value, '');
  assert.equal(h.cards[2].hidden, false);
  assert.equal(h.cards[2].open, true);
});

test('legacy native article topics are revealed without replacing source objects', () => {
  const h = harness({ legacy: true }); const original = [...h.cards];
  h.search('nothing matches'); h.links[0].emit('click');
  assert.equal(h.cards[1].hidden, false);
  assert.deepEqual(h.cards, original);
  assert.equal(h.document.activeElement, null);
});
