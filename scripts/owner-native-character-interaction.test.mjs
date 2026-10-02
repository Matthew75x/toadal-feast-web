import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');

class Element {
  constructor(tagName, attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.textContent = attributes.text || '';
    this.disabled = false;
  }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatch(type, properties = {}) {
    const event = {
      target: this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...properties
    };
    for (const listener of this.listeners[type] || []) listener(event);
    return event;
  }
  querySelector() { return null; }
}

function setup(controls) {
  const statuses = controls.map(control => new Element('p', {
    'data-character-discovery-status': control.getAttribute('data-discover-character'),
    role: 'status',
    'aria-live': 'polite'
  }));
  const page = {
    __toadalProgressionBooted: false,
    querySelector() { return null; },
    querySelectorAll(selector) {
      if (selector === '[data-discover-character]') return controls;
      if (selector === '[data-character-discovery-status]') return statuses;
      return [];
    }
  };
  const values = new Map();
  const writes = [];
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes.push(key); values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const document = { querySelectorAll: selector => selector === '[data-progression-page]' ? [page] : [] };
  runtime.boot(document, { localStorage: storage, location: { pathname: '/characters/' } });
  return { controls, statuses, page, storage, writes };
}

test('role-button character cards discover by click, touch, Enter, and Space with visible state', () => {
  for (const [input, key] of [['click'], ['touchend'], ['keydown', 'Enter'], ['keydown', ' ']]) {
    const card = new Element('article', { role: 'button', tabindex: '0', 'data-discover-character': 'toadal' });
    const { statuses, page, storage } = setup([card]);
    const event = card.dispatch(input, key ? { key } : {});

    assert.equal(event.defaultPrevented, input === 'keydown');
    assert.equal(card.getAttribute('aria-disabled'), 'true');
    assert.equal(card.getAttribute('tabindex'), '0', 'custom role buttons remain keyboard focusable');
    assert.equal(card.disabled, false, 'custom role buttons use aria-disabled rather than a native disabled property');
    assert.equal(card.textContent, '', 'the card contents are preserved');
    assert.equal(statuses[0].textContent, 'Discovered in this browser');
    assert.deepEqual(JSON.parse(storage.getItem(runtime.KEYS.discoveries)).items, ['character-artwork-toadal']);
    const snapshot = page.__toadalProgressionStore.getSnapshot();
    assert.equal(snapshot.pass.xp, 0);
    assert.deepEqual(snapshot.profile.localScores, {});
    assert.ok(page.__toadalProgressionBooted);
  }
});

test('profile anchors discover without suppressing navigation or changing their content', () => {
  const anchor = new Element('a', { href: '/characters/toadal/', 'data-discover-character': 'toadal' });
  anchor.appendChild(new Element('img', { alt: 'Toadal artwork' }));
  const { statuses, storage } = setup([anchor]);

  const firstClick = anchor.dispatch('click');
  assert.equal(firstClick.defaultPrevented, false);
  assert.equal(anchor.getAttribute('href'), '/characters/toadal/');
  assert.equal(anchor.getAttribute('aria-disabled'), null, 'a discovered profile link remains exposed as a working link');
  assert.equal(anchor.children.length, 1);
  assert.equal(statuses[0].textContent, 'Discovered in this browser');

  anchor.dispatch('click');
  assert.equal(JSON.parse(storage.getItem(runtime.KEYS.discoveries)).items.length, 1, 'repeat activation is idempotent');
});

test('nested secondary controls do not trigger the enclosing card discovery', () => {
  const card = new Element('article', { role: 'button', tabindex: '0', 'data-discover-character': 'toadal' });
  const secondary = card.appendChild(new Element('a', { href: '/characters/toadal/profile/' }));
  const label = secondary.appendChild(new Element('span'));
  const { statuses, storage } = setup([card]);

  const event = card.dispatch('click', { target: label });
  assert.equal(event.defaultPrevented, false);
  assert.equal(statuses[0].textContent, 'Not discovered in this browser');
  assert.equal(storage.getItem(runtime.KEYS.discoveries), null);
  assert.equal(secondary.getAttribute('href'), '/characters/toadal/profile/');

  card.dispatch('keydown', { target: label, key: ' ' });
  assert.equal(storage.getItem(runtime.KEYS.discoveries), null, 'keyboard activity inside a nested link stays with that link');
});

test('legacy discovery buttons still disable and retain the established action label', () => {
  const button = new Element('button', { type: 'button', 'data-discover-character': 'toadal' });
  const { statuses } = setup([button]);

  button.dispatch('click');
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  assert.equal(button.textContent, 'Artwork discovered');
  assert.equal(statuses[0].textContent, 'Discovered in this browser');
});
