import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { renderNews } = require('../studio-project/toadal-feast-website/reference/assets/js/editorial-manifest.js');
const page = JSON.parse(fs.readFileSync(new URL('../studio-project/toadal-feast-website/pages/news.json', import.meta.url)));
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.props.children || [])]);
const native = flatten(page.components);
const authored = key => native.find(node => Object.hasOwn(node.props.attributes || {}, key));

class Element {
  constructor(tag = 'div', text = '', attributes = {}) { this.tagName = tag; this.textContent = text; this.attributes = { ...attributes }; this.children = []; this.listeners = new Map(); this.hidden = !!attributes.hidden; this.value = ''; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key] ?? null; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  querySelectorAll(selector) { assert.equal(selector, '[data-news-category]'); return this.children.filter(child => Object.hasOwn(child.attributes, 'data-news-category')); }
  addEventListener(event, handler) { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event).add(handler); }
  removeEventListener(event, handler) { this.listeners.get(event)?.delete(handler); }
  emit(event) { for (const handler of this.listeners.get(event) || []) handler(); }
}
function harness() {
  const slots = new Map(['data-news-filters', 'data-news-query', 'data-news-list', 'data-news-featured-list', 'data-news-featured-empty', 'data-news-status', 'data-news-empty'].map(key => {
    const source = authored(key); return [key, new Element(source.props.tag, source.props.text || '', source.props.attributes)];
  }));
  const filters = slots.get('data-news-filters');
  filters.children = authored('data-news-filters').props.children.map(source => new Element('button', source.props.label, source.props.attributes));
  const controls = new Map(filters.children.map(control => [control.getAttribute('data-news-category'), control]));
  const root = { querySelector(selector) { return slots.get(selector.slice(1, -1)) || null; } };
  const document = { querySelector(selector) { if (selector === '[data-editorial-news]') return root; if (selector === '.site-brand') return { href: 'https://example.invalid/toadal-feast-web/' }; return null; }, location: { href: 'https://example.invalid/toadal-feast-web/news/' }, createElement(tag) { return new Element(tag); } };
  return { document, slots, filters, controls, query: slots.get('data-news-query'), status: slots.get('data-news-status'), empty: slots.get('data-news-empty'), list: slots.get('data-news-list') };
}
const published = { slug: 'test-published-update', title: 'Test published update', summary: 'Fixture for a verified filter result.', category: 'games', publicationState: 'PUBLISHED', publishedAt: '2026-10-01' };

test('an unpublished library displays and announces one authored empty state', () => {
  const h = harness(); const authoredControls = [...h.filters.children];
  renderNews(h.document, []);
  assert.equal(h.empty.hidden, false);
  assert.equal(h.status.hidden, true);
  assert.equal(h.empty.textContent, authored('data-news-empty').props.text);
  assert.equal(h.empty.attributes.role, 'status');
  assert.deepEqual(h.filters.children, authoredControls, 'native filter objects must be reused');
  h.controls.get('games').emit('click');
  assert.equal(h.empty.textContent, authored('data-news-empty').props.text, 'an empty publication library is not described as content hidden by filters');
});

test('published search and category filters keep one visible status and native labels', () => {
  const h = harness();
  h.controls.get('development').textContent = 'Owner edited category';
  h.filters.children.reverse();
  renderNews(h.document, [published, { ...published, slug: 'private-draft', publicationState: 'DRAFT' }]);
  assert.equal(h.list.children.length, 1, 'drafts remain private');
  assert.equal(h.empty.hidden, true); assert.equal(h.status.hidden, false);
  assert.equal(h.status.textContent, '1 published update shown.');
  assert.equal(h.controls.get('development').textContent, 'Owner edited category');
  h.controls.get('development').emit('click');
  assert.equal(h.list.children.length, 0); assert.equal(h.empty.hidden, false); assert.equal(h.status.hidden, true);
  assert.match(h.empty.textContent, /No published updates match/);
  assert.equal(h.controls.get('development').getAttribute('aria-pressed'), 'true');
  h.controls.get('all').emit('click'); h.query.value = 'no matching title'; h.query.emit('input');
  assert.equal(h.empty.hidden, false); assert.equal(h.status.hidden, true);
  h.query.value = ''; h.query.emit('input');
  assert.equal(h.list.children.length, 1); assert.equal(h.empty.hidden, true); assert.equal(h.status.hidden, false);
});

test('refreshing News rebinds existing native controls without duplicate handlers', () => {
  const h = harness(); renderNews(h.document, []); renderNews(h.document, [published]);
  assert.equal(h.query.listeners.get('input').size, 1);
  for (const button of h.controls.values()) assert.equal(button.listeners.get('click').size, 1);
  h.controls.get('games').emit('click'); assert.equal(h.list.children.length, 1);
  assert.equal(h.filters.children.length, 5);
});
