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
const siteCss = fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');

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

test('docked drag keeps the visible artwork anchor under the pointer through a size change', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(extract('dragOffsetsAtScale', '  '), context);
  const cases = [
    { beforeRoot: rect(180, 6, 102, 52), beforeArtwork: rect(205, 6, 52, 52),
      afterRoot: rect(180, 6, 110, 106), afterArtwork: rect(184, 6, 102, 106), down: { x: 231, y: 32 } },
    { beforeRoot: rect(800, 40, 52, 52), beforeArtwork: rect(800, 40, 52, 52),
      afterRoot: rect(800, 40, 100, 110), afterArtwork: rect(800, 40, 100, 110), down: { x: 826, y: 66 } }
  ];
  for (const fixture of cases) {
    const anchorX = (fixture.down.x - fixture.beforeArtwork.left) / fixture.beforeArtwork.width;
    const anchorY = (fixture.down.y - fixture.beforeArtwork.top) / fixture.beforeArtwork.height;
    const offset = context.dragOffsetsAtScale(anchorX, anchorY, fixture.afterRoot, fixture.afterArtwork);
    const movedPointer = { x: fixture.down.x + 9, y: fixture.down.y + 5 };
    const newRoot = { x: movedPointer.x - offset.x, y: movedPointer.y - offset.y };
    const artworkLeft = newRoot.x + fixture.afterArtwork.left - fixture.afterRoot.left;
    const artworkTop = newRoot.y + fixture.afterArtwork.top - fixture.afterRoot.top;
    const fractionX = (movedPointer.x - artworkLeft) / fixture.afterArtwork.width;
    const fractionY = (movedPointer.y - artworkTop) / fixture.afterArtwork.height;
    assert.ok(Math.abs(fractionX - anchorX) < 1e-9);
    assert.ok(Math.abs(fractionY - anchorY) < 1e-9);
  }
  assert.ok(source.includes('var artworkRect = image.getBoundingClientRect();'));
  assert.ok(source.includes('anchorX: artworkRect.width > 0'));
  assert.ok(source.includes('dragOffsetsAtScale(drag.anchorX, drag.anchorY,') &&
    source.includes('root.getBoundingClientRect(), image.getBoundingClientRect());'));
});

test('Home speech visibility keeps the avatar anchor and the larger compact size', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(extract('shouldRepositionOnPanelChange', '  '), context);
  assert.equal(context.shouldRepositionOnPanelChange(true, false), false,
    'Home panel visibility must leave the avatar position alone');
  assert.equal(context.shouldRepositionOnPanelChange(false, false), true,
    'Other routes retain their existing panel-transition placement');
  assert.equal(context.shouldRepositionOnPanelChange(false, true), false,
    'A live pointer drag keeps its current placement on every route');
  assert.ok(source.includes("var homePage = !!document.querySelector('.home-hero');"));
  assert.ok(source.includes('shouldRepositionOnPanelChange(homePage, !!drag)'));
  assert.match(source, /var desktopSize = homeDock \? 64 : 52/);
  assert.match(source, /var width = homeDock \? 64 :/);
  assert.ok(siteCss.includes('html body:has(.home-hero) .toadal-companion {') &&
    siteCss.includes('width: 64px !important;') && siteCss.includes('height: 64px !important;'));
});

function mobileDockHarness({ width = 390, home = false, gameLibrary = false, minimized = true, brandRight = 110, navEdge = 320, menuVisible = width <= 960, manualPosition = false } = {}) {
  const brand = { getBoundingClientRect: () => rect(8, 0, brandRight - 8, 52) };
  const nav = {
    querySelector(selector) {
      if (selector === '.site-brand') return brand;
      if (selector === '.site-links') return { getBoundingClientRect: () => rect(navEdge, 0, 400, 52) };
      if (selector === '.nav-toggle') return { getBoundingClientRect: () => rect(navEdge, 0, 48, 52) };
      return null;
    }
  };
  const context = {
    EDGE_GAP: 12,
    manualPosition,
    window: { innerWidth: width },
    root: { getAttribute: name => name === 'data-minimized' && minimized ? 'true' : null },
    document: {
      querySelector(selector) {
        if (selector === '.home-hero') return home ? {} : null;
        if (selector === '.wo002-game-library') return gameLibrary ? {} : null;
        if (selector === '.home-hero, .wo002-game-library') return home || gameLibrary ? {} : null;
        if (selector === '.site-nav') return nav;
        if (selector === '.site-nav .nav-toggle') return menuVisible ? {} : null;
        if (selector === '[data-progression-page="profile"]') return null;
        return null;
      }
    },
    getComputedStyle: () => ({ display: 'block' })
  };
  vm.createContext(context);
  vm.runInContext(extract('mobileDock'), context);
  return context.mobileDock;
}

test('Home nav docking uses a centered 64px square on desktop and mobile', () => {
  const desktop = mobileDockHarness({ width: 1000, home: true, navEdge: 300 })();
  assert.equal(desktop.width, 64);
  assert.equal(desktop.height, 64);
  assert.equal(desktop.kind, 'desktop');
  const mobile = mobileDockHarness({ width: 390, home: true, navEdge: 320 })();
  assert.equal(mobile.width, 64);
  assert.equal(mobile.height, 64);
  assert.equal(mobile.x, 183);
});

test('Home avoids a too-small mobile menu pocket while other routes keep their existing sizes', () => {
  assert.equal(mobileDockHarness({ width: 390, home: true, brandRight: 110, navEdge: 199 })(), null,
    'a 63px measured pocket is too small for the Home square');
  const ordinaryMobile = mobileDockHarness({ width: 390, brandRight: 110, navEdge: 320 })();
  assert.equal(ordinaryMobile.width, 102);
  assert.equal(ordinaryMobile.height, 52);
  const ordinaryDesktop = mobileDockHarness({ width: 1000, gameLibrary: true, navEdge: 300 })();
  assert.equal(ordinaryDesktop.width, 52);
  assert.equal(ordinaryDesktop.height, 52);
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

function extractAdvanced(name) {
  const marker = '    function ' + name + '(';
  const start = advancedSource.indexOf(marker);
  const end = advancedSource.indexOf('\n    function ', start + marker.length);
  assert.ok(start >= 0, 'actual Studio runtime function exists: ' + name);
  assert.ok(end > start, 'actual Studio runtime function has an extraction boundary: ' + name);
  return advancedSource.slice(start, end);
}

function contextHarness() {
  const context = {
    lastInput: 'keyboard', hovered: null, touched: { state: 'touch' }, touchTimer: null,
    defaultCompanionImage: 'canonical-victory.png',
    companionArtwork: {
      world: 'runtime-v1/world-map.webp', support: 'runtime-v1/support-help.webp',
      app: 'runtime-v1/app-mobile.webp', storiesMedia: 'runtime-v1/stories-media-thinking.webp',
      survey: 'runtime-v2/survey.webp', thumbsUp: 'runtime-v2/thumbs-up.webp',
      thumbsDown: 'runtime-v2/thumbs-down.webp', community: 'runtime-v2/community.webp'
    },
    window: { clearTimeout() {} }
  };
  vm.createContext(context);
  const functions = ['companionSemantic', 'companionState', 'artworkForContext', 'reactionForContext',
    'contextValue', 'selectContextValue', 'enterHoverContext', 'leaveHoverContext', 'clearTouchedContext'];
  vm.runInContext(functions.map(extractAdvanced).join('\n') +
    '\nthis.stateFor = companionState; this.artFor = artworkForContext; this.reactionFor = reactionForContext;' +
    '\nthis.selectValue = selectContextValue; this.enterHover = enterHoverContext; this.leaveHover = leaveHoverContext;', context);
  return context;
}

function semanticTarget(value) {
  const attrs = { 'data-companion-context': value };
  return {
    getAttribute(name) { return Object.hasOwn(attrs, name) ? attrs[name] : null; },
    hasAttribute(name) { return Object.hasOwn(attrs, name); },
    textContent: ''
  };
}

test('context selection keeps action and keyboard focus priority, then follows pointer hover', () => {
  const h = contextHarness();
  const action = { id: 'action' }, focus = { id: 'focus' }, hover = { id: 'hover' };
  const touch = { id: 'touch' }, section = { id: 'section' }, hero = { id: 'hero' };
  assert.equal(h.selectValue(action, focus, hover, touch, section, hero, 'pointer'), action);
  assert.equal(h.selectValue(null, focus, hover, touch, section, hero, 'keyboard'), focus);
  assert.equal(h.selectValue(null, focus, hover, touch, section, hero, 'pointer'), hover,
    'actual pointer input must no longer be masked by stale keyboard focus');
  assert.equal(h.selectValue(null, null, null, touch, section, hero, 'pointer'), touch);
  assert.equal(h.selectValue(null, focus, hover, touch, section, hero, 'touch'), touch,
    'active touch input cannot be masked by keyboard focus or a stale mouse hover');
  assert.equal(h.selectValue(null, null, null, null, section, hero, 'pointer'), section);
  assert.equal(h.selectValue(null, null, null, null, null, hero, 'pointer'), hero);
});

test('hover enter, rapid transitions, and leave ignore stale pointer-out events', () => {
  const h = contextHarness();
  const world = { id: 'world' }, app = { id: 'app' }, support = { id: 'support' };
  h.hovered = world;
  assert.equal(h.enterHover(app, 'mouse'), true, 'mouse hover switches away from keyboard focus');
  assert.equal(h.lastInput, 'pointer');
  assert.equal(h.hovered, app);
  assert.equal(h.touched, null, 'pointer hover clears an expired touch context');
  assert.equal(h.enterHover(support, 'mouse'), true, 'rapid hover picks the newest context');
  assert.equal(h.hovered, support);
  assert.equal(h.leaveHover(app, null, 'mouse'), false, 'late leave from prior target cannot clear current hover');
  assert.equal(h.hovered, support);
  assert.equal(h.leaveHover(support, null, 'mouse'), true);
  assert.equal(h.hovered, null, 'leaving the active context restores section/hero fallback');
});

test('touch pointerover cannot replace the touch context or input modality', () => {
  const h = contextHarness();
  const touch = { id: 'touch' }, hovered = { id: 'hover' };
  h.lastInput = 'pointer'; h.hovered = hovered; h.touched = touch;
  assert.equal(h.enterHover({ id: 'ignored' }, 'touch'), false);
  assert.equal(h.hovered, hovered);
  assert.equal(h.touched, touch);
  assert.equal(h.leaveHover(hovered, null, 'touch'), false);
  assert.equal(h.hovered, hovered);
  assert.match(advancedSource,/pointerdown', function \(event\) \{ lastInput = event\.pointerType === 'touch' \? 'touch' : 'pointer';/);
  assert.match(advancedSource,/touchstart', function \(event\) \{\s*if \(companionHidden\) return;\s*lastInput = 'touch';/);
});

test('context matcher routes feedback and app adventure precisely and excludes unqualified art', () => {
  const h = contextHarness();
  assert.equal(h.stateFor(semanticTarget('positive feedback')), 'thumbs-up');
  assert.equal(h.stateFor(semanticTarget('negative feedback')), 'thumbs-down');
  assert.equal(h.stateFor(semanticTarget('survey feedback')), 'survey');
  assert.equal(h.stateFor(semanticTarget('/app/ mobile adventure')), 'app');
  assert.equal(h.stateFor(semanticTarget('/support/ help map')), 'support');
  assert.equal(h.stateFor(semanticTarget('/stories/ media adventure')), 'stories-media');
  assert.equal(h.stateFor(semanticTarget('/world/ adventure map')), 'world');
  const world=semanticTarget('/world/ adventure map');
  const app=semanticTarget('/app/ mobile adventure');
  const stories=semanticTarget('/stories/ media adventure');
  const positive=semanticTarget('positive feedback');
  const negative=semanticTarget('negative feedback');
  assert.equal(h.artFor(world),'runtime-v1/world-map.webp');
  assert.equal(h.reactionFor(world),'curious');
  assert.equal(h.artFor(app),'runtime-v1/app-mobile.webp');
  assert.equal(h.reactionFor(app),'present');
  assert.equal(h.artFor(stories),'runtime-v1/stories-media-thinking.webp');
  assert.equal(h.reactionFor(stories),'thinking');
  assert.equal(h.artFor(positive),'runtime-v2/thumbs-up.webp');
  assert.equal(h.artFor(negative),'runtime-v2/thumbs-down.webp');
  assert.equal(h.artFor(semanticTarget('survey feedback')),'runtime-v2/survey.webp');
  const impact=semanticTarget('social impact community');
  const rewards=semanticTarget('/feast-pass/rewards/ achievement');
  assert.equal(h.stateFor(impact),'');
  assert.equal(h.artFor(impact),'canonical-victory.png');
  assert.equal(h.reactionFor(impact),null);
  assert.equal(h.stateFor(rewards),'');
  assert.equal(h.artFor(rewards),'canonical-victory.png');
  assert.equal(h.reactionFor(rewards),null);
});

test('minimized companion continues contextual artwork while explicit hide suspends and invalidates it', () => {
  const renderStart = advancedSource.indexOf('    function render(announce) {');
  const renderEnd = advancedSource.indexOf('\n    function persistPreference()', renderStart);
  const hiddenStart = advancedSource.indexOf('    function setHidden(value, returnFocus, focusTarget) {');
  const hiddenEnd = advancedSource.indexOf('\n    hideButton.addEventListener', hiddenStart);
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  assert.ok(hiddenStart >= 0 && hiddenEnd > hiddenStart);
  const renderSource = advancedSource.slice(renderStart, renderEnd);
  const hideSource = advancedSource.slice(hiddenStart, hiddenEnd);
  assert.match(renderSource, /root\.setAttribute\('data-minimized', minimized \? 'true' : 'false'\)/);
  assert.ok(renderSource.indexOf('if (companionHidden) {') < renderSource.indexOf('applyArtwork(value && value.artwork'),
    'artwork selection runs after the hidden-only early return, including while minimized');
  assert.doesNotMatch(renderSource, /if \(minimized\)[\s\S]*?return;/);
  assert.match(renderSource, /artworkRequest \+= 1;[\s\S]*?data-companion-current-reaction[\s\S]*?return;/);
  assert.match(hideSource, /focused = null;[\s\S]*hovered = null;[\s\S]*action = null;/);
});


test('tablet Menu navigation uses the header gap on Home and inner routes', () => {
  for (const home of [true, false]) {
    const dock = mobileDockHarness({ width: 768, home, brandRight: 132, navEdge: 678 })();
    assert.ok(dock, 'tablet Menu has a usable header gap');
    assert.equal(dock.kind, undefined, 'the Menu gap path also applies when its links are open');
    assert.equal(dock.height, home ? 64 : 52);
    assert.ok(dock.x > 132 && dock.x + dock.width < 678);
    assert.equal(mobileDockHarness({ width: 768, home, manualPosition: true })(), null,
      'a saved manual position bypasses automatic header docking');
  }
});
