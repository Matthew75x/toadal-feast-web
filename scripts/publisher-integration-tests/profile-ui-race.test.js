const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/profile-ui.js');

class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.listeners = new Map();
    this.value = '';
    this.textContent = '';
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  append(...nodes) { this.children.push(...nodes); }
  insertBefore(node, reference) {
    const index = this.children.indexOf(reference);
    this.children.splice(index < 0 ? this.children.length : index, 0, node);
  }
  querySelector(selector) {
    const match = selector.match(/^\[([^\]]+)\]$/);
    return match ? all(this).slice(1).find(node => node.getAttribute(match[1]) !== null) ?? null : null;
  }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  dispatch(name) { return this.listeners.get(name)?.({ preventDefault() {} }); }
}
const all = node => [node, ...node.children.flatMap(all)];
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const page = new Element('main');
  const doc = {
    querySelector: selector => selector === "[data-progression-page='profile']" ? page : null,
    createElement: tag => new Element(tag),
  };
  let resolveProfile;
  const initialProfile = new Promise(resolve => { resolveProfile = resolve; });
  const updates = [];
  const controller = {
    config: { enabled: true },
    permits: feature => feature === 'accounts',
    profile: () => initialProfile,
    updateProfile: async patch => { updates.push({ ...patch }); return { ...patch }; },
  };
  assert.equal(ui.enhance(doc, controller, { ok: true, identity: { user: { id: 'synthetic-unit-profile' } } }).enhanced, true);
  return {
    input: all(page).find(node => node.tagName === 'INPUT'),
    form: all(page).find(node => node.getAttribute('data-connected-profile-form') !== null),
    resolveProfile,
    updates,
  };
}

test('late initial profile GET preserves typed input and submits that draft', async () => {
  const f = fixture();
  f.input.value = 'Synthetic draft';
  f.input.dispatch('input');
  f.resolveProfile({ displayName: 'Synthetic stored name' });
  await settle();
  await f.form.dispatch('submit');
  assert.deepEqual(f.updates, [{ displayName: 'Synthetic draft' }]);
  assert.equal(f.input.value, 'Synthetic draft');
});

test('initial profile GET prefills an untouched input normally', async () => {
  const f = fixture();
  f.resolveProfile({ displayName: 'Synthetic stored name' });
  await settle();
  assert.equal(f.input.value, 'Synthetic stored name');
  f.input.value = 'Synthetic later draft';
  f.input.dispatch('input');
  await f.form.dispatch('submit');
  assert.deepEqual(f.updates, [{ displayName: 'Synthetic later draft' }]);
});

test('late initial profile GET does not refill a name the user deliberately cleared', async () => {
  const f = fixture();
  f.input.value = 'Synthetic draft';
  f.input.dispatch('input');
  f.input.value = '';
  f.input.dispatch('input');
  f.resolveProfile({ displayName: 'Synthetic stored name' });
  await settle();
  assert.equal(f.input.value, '');
  await f.form.dispatch('submit');
  assert.deepEqual(f.updates, [{ displayName: '' }]);
});
