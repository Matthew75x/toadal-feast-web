import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../studio-project/toadal-feast-website/reference/assets/js/site-search.js', import.meta.url), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

function harness() {
  class Element {
    constructor(tag, text = '') { this.tagName = tag; this.textContent = text; this.value = ''; this.children = []; this.listeners = new Map(); this.attributes = {}; }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    emit(type) { const event = { preventDefault() { this.defaultPrevented = true; } }; this.listeners.get(type)?.(event); return event; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    replaceChildren(...children) { this.children = children; }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); return child; }
    focus() { document.activeElement = this; }
  }
  const form = new Element('FORM'), input = new Element('INPUT'), category = new Element('SELECT');
  category.value = 'All'; category.options = ['All', 'Characters'].map(value => ({ value }));
  const results = new Element('DIV'), status = new Element('P', 'Loading the local search index…'), suggestion = new Element('BUTTON');
  suggestion.attributes['data-search-suggestion'] = 'Gully';
  form.querySelector = selector => selector === '[data-search-input]' ? input : category;
  const document = {
    readyState: 'complete', activeElement: null,
    querySelector(selector) { return { '[data-site-search]': form, '[data-search-results]': results, '[data-search-status]': status, '[data-support-search]': null, '.site-brand': { href: 'https://example.invalid/toadal-feast-web/' } }[selector] ?? null; },
    querySelectorAll(selector) { assert.equal(selector, '[data-search-suggestion]'); return [suggestion]; },
    createElement(tag) { return new Element(tag); }
  };
  const location = { href: 'https://example.invalid/toadal-feast-web/search/', search: '' };
  const history = { replaceState() {} };
  let resolve, reject;
  const response = new Promise((yes, no) => { resolve = yes; reject = no; });
  const requests = [];
  vm.runInNewContext(source, { document, location, history, URL, URLSearchParams, fetch(url) { requests.push(url); return response; } });
  function search(value) { input.value = value; input.emit('input'); }
  return { form, input, category, results, status, suggestion, requests, resolve, reject, search };
}

const entries = [{ title: 'Gully', summary: 'Canonical artwork.', route: '/characters/', group: 'Characters', publicationState: 'PREVIEW' }];
function loaded(h) { h.resolve({ ok: true, json: () => Promise.resolve({ entries }) }); }

test('query and filters retain loading status until the local index resolves', async () => {
  const h = harness();
  h.search('Gully'); assert.match(h.status.textContent, /Loading the local search index/);
  h.category.value = 'Characters'; h.category.emit('change');
  h.form.emit('submit'); h.suggestion.emit('click');
  assert.match(h.status.textContent, /Loading the local search index/);
  assert.equal(h.results.children.length, 0);
  loaded(h); await settle();
  assert.equal(h.status.textContent, '1 local result for “Gully”.');
  assert.equal(h.results.children[0].children[1].children[0].href, '/toadal-feast-web/characters/');
  assert.equal(h.requests[0], '/toadal-feast-web/assets/data/local-search-index.json');
});

test('request failures remain unavailable across search interactions instead of reporting no results', async () => {
  for (const failure of ['network', 'http']) {
    const h = harness();
    if (failure === 'network') h.reject(new Error('offline')); else h.resolve({ ok: false, status: 503 });
    await settle();
    assert.match(h.status.textContent, /index is unavailable/);
    for (const interaction of [() => h.search('Gully'), () => h.category.emit('change'), () => h.form.emit('submit'), () => h.suggestion.emit('click'), () => h.search('')]) {
      interaction(); assert.match(h.status.textContent, /index is unavailable/);
      assert.equal(h.results.children.length, 0);
    }
  }
});

test('a ready index keeps real no-results distinct and recovers to matches', async () => {
  const h = harness(); loaded(h); await settle();
  h.search('not-in-library'); assert.equal(h.status.textContent, 'No local results for “not-in-library”.');
  h.suggestion.emit('click'); assert.equal(h.status.textContent, '1 local result for “Gully”.');
  assert.equal(h.results.children.length, 1);
  h.search(''); assert.match(h.status.textContent, /Type a word/); assert.equal(h.results.children.length, 0);
});
