import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/reference/assets/js/companion-position.js'), 'utf8');
const advancedSource = JSON.parse(fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/collections/advanced-code.json'), 'utf8')).javascript;

function extract(name, indent = '    ') {
  const start = source.indexOf(indent + 'function ' + name + '(');
  assert.ok(start >= 0, 'actual source function exists: ' + name);
  const end = source.indexOf('\n' + indent + 'function ', start + indent.length);
  assert.ok(end > start, 'actual source function has an extraction boundary: ' + name);
  return source.slice(start, end);
}

function rect(left, top, width, height) {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function harness({ width = 1000, height = 800, rootWidth = 100, rootHeight = 96 } = {}) {
  const counters = { safeInsetReads: 0, minCalls: 0 };
  const math = Object.create(Math);
  math.min = (...values) => { counters.minCalls += 1; return Math.min(...values); };
  const context = {
    Math: math,
    EDGE_GAP: 12,
    DEFAULT_BOTTOM_GAP: 180,
    root: { offsetWidth: rootWidth, offsetHeight: rootHeight },
    button: { offsetWidth: rootWidth, offsetHeight: rootHeight },
    window: { innerWidth: width, innerHeight: height, visualViewport: null },
    readSafeInset: () => { counters.safeInsetReads += 1; return 0; }
  };
  vm.createContext(context);
  vm.runInContext([extract('viewport'), extract('clampPosition'), extract('avoidControls')].join('\n'), context);
  context.counters = counters;
  return context;
}

function legacyAvoidControls(preferred, width, height, controls, viewport) {
  const gap = 12;
  function collisionArea(position) {
    return controls.reduce((area, control) => {
      const overlapWidth = Math.max(0,
        Math.min(position.x + width + gap, control.right) - Math.max(position.x - gap, control.left));
      const overlapHeight = Math.max(0,
        Math.min(position.y + height + gap, control.bottom) - Math.max(position.y - gap, control.top));
      return area + overlapWidth * overlapHeight;
    }, 0);
  }
  const clamp = (x, y) => ({
    x: Math.round(Math.max(12, Math.min(viewport.width - width - 12, x))),
    y: Math.round(Math.max(12, Math.min(viewport.height - height - 12, y)))
  });
  const xs = [preferred.x, 12, viewport.width - width - 12];
  const ys = [preferred.y, 12, viewport.height - height - 12];
  controls.forEach(control => {
    xs.push(Math.floor(control.left - width - gap), Math.ceil(control.right + gap));
    ys.push(Math.floor(control.top - height - gap), Math.ceil(control.bottom + gap));
  });
  let best = preferred;
  let bestArea = collisionArea(preferred);
  let bestDistance = Infinity;
  for (const left of new Set(xs)) for (const top of new Set(ys)) {
    const candidate = clamp(left, top);
    const area = collisionArea(candidate);
    const distance = Math.pow(candidate.x - preferred.x, 2) + Math.pow(candidate.y - preferred.y, 2);
    if (area < bestArea || (area === bestArea && distance < bestDistance)) {
      best = candidate;
      bestArea = area;
      bestDistance = distance;
    }
  }
  return best;
}

function trackedRect(bounds, state) {
  const result = {};
  for (const key of ['left', 'right', 'top', 'bottom']) {
    Object.defineProperty(result, key, { get() { state.reads += 1; return bounds[key]; } });
  }
  return result;
}

test('many-control placement finds the same nearest free slot without cubic collision reads', t => {
  const bounds = Array.from({ length: 80 }, (_, index) => {
    const row = index;
    return rect(400 + index * 2, 260 + row * 6, 70, 24);
  });
  const preferred = { x: 430, y: 390 };
  const expected = legacyAvoidControls(preferred, 100, 96, bounds, { width: 1000, height: 800 });
  const legacyXs = new Set([preferred.x, 12, 888]);
  const legacyYs = new Set([preferred.y, 12, 692]);
  bounds.forEach(control => {
    legacyXs.add(Math.floor(control.left - 112));
    legacyXs.add(Math.ceil(control.right + 12));
    legacyYs.add(Math.floor(control.top - 108));
    legacyYs.add(Math.ceil(control.bottom + 12));
  });
  const legacyReads = 4 * bounds.length * (legacyXs.size * legacyYs.size + 2);
  const state = { reads: 0 };
  const controls = bounds.map(value => trackedRect(value, state));
  const h = harness();
  const actual = h.avoidControls(preferred, 100, 96, controls);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
  assert.equal(expected.x, 332, 'fixture resolves to the same edge candidate under the exact solver');
  assert.ok(state.reads < 1_000, `source snapshots each rectangle once; observed ${state.reads} field reads`);
  assert.ok(h.counters.minCalls < 10_000,
    `spatial lookup should avoid exhaustive X×Y×controls work; observed ${h.counters.minCalls} Math.min calls`);
  assert.ok(legacyReads > 5_000_000, `legacy fixture work estimate was ${legacyReads}`);
  t.diagnostic(`80-control synthetic fixture: ${state.reads} field reads and ${h.counters.minCalls} Math.min calls after optimization; legacy edge scan: ${legacyReads} field reads.`);
});

test('crowded view retains exact overlap-minimizing fallback placement', () => {
  const bounds = [rect(0, 0, 1000, 800), ...Array.from({ length: 20 }, (_, index) =>
    rect(index * 11, index * 17, 120, 90))];
  const preferred = { x: 430, y: 390 };
  const expected = legacyAvoidControls(preferred, 100, 96, bounds, { width: 1000, height: 800 });
  const h = harness();
  const actual = h.avoidControls(preferred, 100, 96, bounds);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
  assert.equal(h.counters.safeInsetReads, 4, 'safe viewport insets are measured once, not per candidate pair');
});

test('optimized placement stays equivalent to the exact solver across deterministic layouts', () => {
  let state = 0x6d2b79f5;
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  for (let sample = 0; sample < 18; sample += 1) {
    const controls = Array.from({ length: 16 + (sample % 9) }, () => {
      const width = 28 + Math.round(random() * 180);
      const height = 20 + Math.round(random() * 120);
      const left = Math.round(random() * (1000 - width));
      const top = Math.round(random() * (800 - height));
      return rect(left, top, width, height);
    });
    const preferred = { x: Math.round(random() * 900), y: Math.round(random() * 700) };
    const expected = legacyAvoidControls(preferred, 100, 96, controls, { width: 1000, height: 800 });
    const actual = harness().avoidControls(preferred, 100, 96, controls);
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, `sample ${sample}`);
  }
});

test('docked drag keeps the same artwork anchor through the one-time size change', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(extract('dragOffsetsAtScale', '  '), context);
  const cases = [
    { beforeRoot: rect(180, 6, 49.77, 52), beforeButton: rect(180, 6, 49.77, 52),
      afterRoot: rect(180, 6, 100, 96), afterButton: rect(188, 6, 92, 96), down: { x: 205, y: 32 } },
    { beforeRoot: rect(800, 40, 52, 52), beforeButton: rect(800, 40, 52, 52),
      afterRoot: rect(800, 40, 100, 110), afterButton: rect(800, 40, 100, 110), down: { x: 826, y: 66 } }
  ];
  for (const fixture of cases) {
    const anchorX = (fixture.down.x - fixture.beforeButton.left) / fixture.beforeButton.width;
    const anchorY = (fixture.down.y - fixture.beforeButton.top) / fixture.beforeButton.height;
    const offset = context.dragOffsetsAtScale(anchorX, anchorY, fixture.afterRoot, fixture.afterButton);
    const movedPointer = { x: fixture.down.x + 9, y: fixture.down.y + 5 };
    const newRoot = { x: movedPointer.x - offset.x, y: movedPointer.y - offset.y };
    const fractionX = (movedPointer.x - (newRoot.x + fixture.afterButton.left - fixture.afterRoot.left)) / fixture.afterButton.width;
    const fractionY = (movedPointer.y - (newRoot.y + fixture.afterButton.top - fixture.afterRoot.top)) / fixture.afterButton.height;
    assert.ok(Math.abs(fractionX - anchorX) < 1e-9);
    assert.ok(Math.abs(fractionY - anchorY) < 1e-9);
  }
  assert.match(source, /var wasDocked = root\.getAttribute\('data-mobile-docked'\) === 'true';[\s\S]*?if \(wasDocked\) \{[\s\S]*?dragOffsetsAtScale\(/);
});

test('unchanged minimized and hidden attributes do not trigger another panel measurement', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(extract('hasPanelLayoutMutation', '  '), context);
  const panelAttrs = { hidden: '' };
  const rootAttrs = { 'data-minimized': 'true', 'data-panel-visible': 'false' };
  const panel = { getAttribute: name => Object.hasOwn(panelAttrs, name) ? panelAttrs[name] : null };
  const root = { getAttribute: name => Object.hasOwn(rootAttrs, name) ? rootAttrs[name] : null };
  const unchanged = [
    { type: 'attributes', target: root, attributeName: 'data-minimized', oldValue: 'true' },
    { type: 'attributes', target: root, attributeName: 'data-panel-visible', oldValue: 'false' },
    { type: 'attributes', target: panel, attributeName: 'hidden', oldValue: '' }
  ];
  assert.equal(context.hasPanelLayoutMutation(unchanged, panel, root), false);
  rootAttrs['data-panel-visible'] = 'true';
  assert.equal(context.hasPanelLayoutMutation(unchanged, panel, root), true);
  assert.equal(context.hasPanelLayoutMutation([{ type: 'childList', target: panel }], panel, root), true);
  assert.match(source, /new MutationObserver\(function \(mutations\) \{\s*if \(!hasPanelLayoutMutation\(mutations, panel, root\)\) return;/);
  assert.match(source, /attributeOldValue: true, attributeFilter: \['data-minimized', 'data-panel-visible'\]/);
});

function artworkHarness() {
  const preloads = [];
  const attrs = { src: 'A', srcset: 'old 2x', width: '52', height: '52' };
  const image = {
    getAttribute: name => Object.hasOwn(attrs, name) ? attrs[name] : null,
    setAttribute: (name, value) => { attrs[name] = String(value); },
    removeAttribute: name => { delete attrs[name]; }
  };
  function Image() {
    this.onload = null;
    this._src = '';
    Object.defineProperty(this, 'src', {
      get: () => this._src,
      set: value => { this._src = String(value); }
    });
    preloads.push(this);
  }
  const context = { artworkRequest: 0, currentArtwork: 'A', defaultCompanionImage: 'A', image, Image };
  vm.createContext(context);
  const start = advancedSource.indexOf('    function applyArtwork(src) {');
  const end = advancedSource.indexOf('\n    var speechRole = speech.getAttribute', start);
  assert.ok(start >= 0 && end > start, 'actual applyArtwork function exists in Studio source');
  vm.runInContext(advancedSource.slice(start, end).trim() + '\nthis.applyArtwork = applyArtwork;', context);
  return { context, attrs, preloads };
}

test('returning to the current artwork invalidates a pending stale preload', () => {
  const h = artworkHarness();
  h.context.applyArtwork('B');
  h.context.applyArtwork('A');
  assert.equal(h.preloads.length, 1);
  h.preloads[0].onload();
  assert.equal(h.attrs.src, 'A');
  assert.equal(h.attrs.srcset, 'old 2x');
  assert.equal(h.context.currentArtwork, 'A');
});

test('the newest contextual artwork wins when older preloads finish later', () => {
  const h = artworkHarness();
  h.context.applyArtwork('B');
  h.context.applyArtwork('C');
  h.preloads[0].onload();
  h.preloads[1].onload();
  assert.equal(h.attrs.src, 'C');
  assert.equal(h.attrs['data-companion-artwork'], 'contextual');
  assert.equal(h.context.currentArtwork, 'C');
});
