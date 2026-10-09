import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '..');
const sourcePath = 'studio-project/toadal-feast-website/reference/assets/js/companion-position.js';
const source = fs.readFileSync(path.join(repo, sourcePath), 'utf8');
const profileSelector = '[data-progression-page="profile"]';
const noteSelector = profileSelector + ' .progression-truth-note';
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
// Exact settled EA rectangles, 2026-10-09, Profile 320x844, scrollY=0.
// The original witness's manual/default provenance is unproven. These are
// source-execution fixtures, not a replay of the rendered page or a browser gate.
const observed = { x: 192, y: 556 };
const noteBounds = rect(32.667, 582.354, 254.667, 118.438);
const area = (position, obstacle, width = 100, height = 96, gap = 0) =>
  Math.max(0, Math.min(position.x + width + gap, obstacle.right) - Math.max(position.x - gap, obstacle.left)) *
  Math.max(0, Math.min(position.y + height + gap, obstacle.bottom) - Math.max(position.y - gap, obstacle.top));
const plain = value => JSON.parse(JSON.stringify(value));

function extract(name, indent = '    ') {
  const start = source.indexOf(indent + 'function ' + name + '(');
  assert.ok(start >= 0, 'actual source function exists: ' + name);
  const end = source.indexOf('\n' + indent + 'function ', start + indent.length);
  assert.ok(end > start, 'actual source function has an extraction boundary: ' + name);
  return source.slice(start, end);
}

function harness({ route = profileSelector, manual = false, controls = [], note = noteBounds,
  saved = null, width = 320, height = 844 } = {}) {
  const attrs = {}, style = {}, writes = [];
  const makeElement = (bounds, extra = {}) => ({ getBoundingClientRect: () => bounds, ...extra });
  const noteElement = makeElement(note);
  const controlElements = controls.map(value => makeElement(value.bounds, value));
  const root = {
    hidden: false, offsetWidth: 100, offsetHeight: 96,
    contains: element => element.inCompanion === true,
    getAttribute: name => attrs[name],
    setAttribute: (name, value) => { attrs[name] = value; },
    removeAttribute: name => { delete attrs[name]; },
    style: { setProperty: (name, value) => { style[name] = value; } }
  };
  const header = { contains: element => element.inHeader === true };
  const queries = [];
  const context = {
    root, button: root, noteElement, attrs, style, writes, queries, manualPosition: manual,
    x: 0, y: 0, drag: null, EDGE_GAP: 12, DEFAULT_BOTTOM_GAP: 180,
    POSITION_KEY: 'toadal:site:companion:position:v1',
    window: { innerWidth: width, innerHeight: height,
      localStorage: { getItem: () => JSON.stringify(saved), setItem: (key, value) => writes.push({ key, value: JSON.parse(value) }) } },
    document: {
      documentElement: {},
      querySelector: selector => selector === '.site-header' ? header : selector === route ? {} : null,
      querySelectorAll: selector => {
        queries.push(selector);
        return selector === noteSelector ? (route === profileSelector ? [noteElement] : []) : controlElements;
      }
    },
    getComputedStyle: element => ({ display: 'block', visibility: 'visible', opacity: '1',
      getPropertyValue: () => '0', ...element.computedStyle }),
    // Panel/DOM rendering has separate existing tests. This harness exercises the
    // real placement, collector, clamping, docking and persisted-position logic.
    placePanel() {}
  };
  vm.createContext(context);
  vm.runInContext(extract('readSafeInset', '  ') + '\n' +
    ['mobileDock', 'setDock', 'viewport', 'clampPosition', 'persistPosition',
      'applyPosition', 'controlRects', 'avoidControls', 'avoidProfileCopy', 'defaultPosition', 'loadPosition'].map(name => extract(name)).join('\n'), context);
  return context;
}

test('Profile copy uses the editable native truth-note and identical generated runtime mirrors', () => {
  const profile = JSON.parse(fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/pages/profile.json'), 'utf8'));
  const collect = value => Array.isArray(value) ? value.flatMap(collect) : value && typeof value === 'object' ?
    [value, ...Object.values(value).flatMap(collect)] : [];
  const note = collect(profile).find(value => value.id === 'component.guest-profile.rich-text.f51d1d081ac2.progression-truth-note');
  assert.equal(note.type, 'core.text');
  assert.equal(note.props.className, 'progression-truth-note');
  for (const mirror of ['dist/assets/js/companion-position.js', 'dist/previews/cards-phone-20261008/assets/js/companion-position.js']) {
    assert.equal(fs.readFileSync(path.join(repo, mirror), 'utf8'), source, mirror);
  }
});

test('existing collector stays unchanged; automatic Profile copy protection bypasses manual and header-only placement', () => {
  const h = harness();
  for (const includeNavigation of [false, true]) {
    assert.deepEqual(plain(h.controlRects(includeNavigation)), []);
    assert.ok(!h.queries.at(-1).includes(noteSelector));
  }
  h.applyPosition(observed.x, observed.y, false);
  assert.ok(h.queries.includes(noteSelector));
  h.controlRects(false, true);
  assert.ok(!h.queries.at(-1).includes(noteSelector));
  h.manualPosition = true;
  h.queries.length = 0;
  assert.deepEqual(plain(h.avoidProfileCopy(observed)), observed);
  assert.ok(!h.queries.includes(noteSelector));
  assert.match(source, /dock \? avoidControls\(next, dock.width, 52, controlRects\(false, true\)\) : avoidProfileCopy\(next\)/);
});

test('exact observed and source-default Profile geometry avoid the note with the existing measured-edge algorithm', () => {
  const h = harness();
  assert.ok(area(observed, noteBounds) > 6600, 'observed geometry really intersects the exact note');
  const preferredDefault = plain(h.defaultPosition());
  assert.deepEqual(preferredDefault, { x: 208, y: 556 });
  assert.ok(area(preferredDefault, noteBounds) > 0);
  for (const preferred of [observed, preferredDefault]) {
    const next = plain(h.avoidProfileCopy(preferred));
    assert.deepEqual(next, { x: preferred.x, y: 474 });
    assert.equal(area(next, noteBounds, 100, 96, 12), 0, 'note retains full exclusion gap');
    h.applyPosition(preferred.x, preferred.y, false);
    assert.equal(h.attrs['data-position-x'], String(next.x));
    assert.equal(h.attrs['data-position-y'], String(next.y));
    assert.equal(h.attrs['data-mobile-docked'], undefined);
  }
  assert.equal(h.writes.length, 0, 'automatic repositioning does not rewrite preferences');
});

test('representative controls stay clear when the nearest note-safe position would collide with a control', () => {
  // Synthetic representative obstacles, not measured EA controls. The top control
  // blocks the otherwise-nearest y=474; the unchanged solver must find another slot.
  const controls = [rect(20, 430, 280, 48), rect(20, 12, 280, 48)];
  const h = harness({ controls: controls.map(bounds => ({ bounds })) });
  for (const preferred of [observed, plain(h.defaultPosition())]) {
    const next = plain(h.avoidProfileCopy(preferred));
    assert.notEqual(next.y, 474);
    for (const obstacle of [...controls, noteBounds]) assert.equal(area(next, obstacle, 100, 96, 12), 0);
    assert.ok(next.x >= 12 && next.x + 100 <= 308 && next.y >= 12 && next.y + 96 <= 832);
  }
});

test('manual position loading, deliberate note overlap and existing interactive-control avoidance are unchanged', () => {
  const saved = { version: 1, ...observed, manual: true };
  const h = harness({ saved });
  assert.deepEqual(plain(h.loadPosition()), observed);
  assert.equal(h.manualPosition, true);
  assert.deepEqual(plain(h.avoidProfileCopy(observed)), observed, 'manual placement does not gain a copy exclusion');
  h.applyPosition(observed.x, observed.y, true);
  assert.deepEqual(h.writes, [{ key: h.POSITION_KEY, value: saved }]);
  const control = rect(180, 560, 100, 60);
  const withControl = harness({ manual: true, controls: [{ bounds: control }] });
  const next = plain(withControl.avoidProfileCopy(observed));
  assert.equal(area(next, control, 100, 96, 12), 0, 'existing manual control avoidance remains active');
  assert.ok(!withControl.queries.at(-1).includes(noteSelector));
  const oldStyle = { ...h.style };
  h.root.hidden = true;
  h.applyPosition(20, 20, true);
  assert.deepEqual(h.style, oldStyle);
  assert.equal(h.writes.length, 1, 'hidden placement does not destroy saved coordinates');
});

test('fresh, legacy and nonmanual positions use automatic defaults without changing the storage schema', () => {
  for (const saved of [null, { version: 1, x: 15, y: 15 }, { version: 1, x: 15, y: 15, manual: false }]) {
    const h = harness({ saved });
    const position = plain(h.loadPosition());
    assert.deepEqual(position, { x: 208, y: 556 });
    assert.equal(h.manualPosition, false);
    assert.equal(area(h.avoidProfileCopy(position), noteBounds, 100, 96, 12), 0);
    assert.equal(h.writes.length, 0);
  }
});

test('header-only controls and unrelated routes retain their preexisting collision inputs', () => {
  const head = rect(20, 10, 100, 40), body = rect(20, 200, 100, 40);
  const h = harness({ controls: [{ bounds: head, inHeader: true }, { bounds: body }] });
  assert.deepEqual(plain(h.controlRects(false, true)), [head]);
  assert.ok(!h.queries.at(-1).includes(noteSelector));
  const cases = [
    ['.home-hero', '.home-hero__copy'],
    ['.wo002-game-library', '.play-card'],
    ['.comic-reader-page', '.reader-side-panel'],
    ['.app-page', null], ['.support-page', null], ['[data-progression-page="leaderboard"]', null]
  ];
  for (const [route, existing] of cases) {
    const other = harness({ route, controls: [{ bounds: body }] });
    assert.deepEqual(plain(other.controlRects(false)), [body]);
    const selectors = other.queries.at(-1);
    assert.ok(!selectors.includes(noteSelector), route);
    if (existing) assert.ok(selectors.includes(existing), route + ' existing protection');
    assert.deepEqual(plain(other.avoidProfileCopy(observed)), observed, route + ' unchanged open placement');
  }
});

test('offscreen note, viewport resize and longer editable note use current measured bounds', () => {
  const offscreen = harness({ note: rect(32, 900, 255, 118) });
  assert.deepEqual(plain(offscreen.controlRects(false)), []);
  assert.deepEqual(plain(offscreen.avoidProfileCopy(observed)), observed);
  for (const width of [320, 390, 1180]) {
    for (const height of [118.438, 220]) {
      const note = rect(32.667, 582.354, Math.min(700, width - 65.334), height);
      const h = harness({ width, note });
      const next = plain(h.avoidProfileCopy(h.defaultPosition()));
      assert.equal(area(next, note, 100, 96, 12), 0, `${width}px / ${height}px note`);
      assert.ok(next.x >= 12 && next.x + 100 <= width - 12);
    }
  }
});

test('crowded or tiny viewport stays finite and deterministic when no zero-overlap slot exists', () => {
  for (const [width, height] of [[320, 180], [90, 80]]) {
    const h = harness({ width, height, note: rect(0, 0, width, height), controls: [{ bounds: rect(0, 0, width, height) }] });
    const preferred = h.clampPosition(observed.x, observed.y);
    const a = plain(h.avoidProfileCopy(preferred)), b = plain(h.avoidProfileCopy(preferred));
    assert.deepEqual(a, b);
    assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
    assert.ok(a.x >= 12 && a.y >= 12);
    assert.ok(a.x <= Math.max(12, width - 112) && a.y <= Math.max(12, height - 108));
  }
});

test('a compact Profile never trades readable Menu controls for unavoidable note overlap', () => {
  const brand = rect(12, 12, 168, 44), menu = rect(240, 12, 68, 44);
  const note = rect(33, 70, 255, 230), preferred = { x: 208, y: 68 };
  const h = harness({ height: 320, note, controls: [{ bounds: brand }, { bounds: menu }] });
  const baseline = plain(h.avoidControls(preferred));
  assert.deepEqual(baseline, preferred);
  for (const control of [brand, menu]) assert.equal(area(baseline, control, 100, 96, 12), 0);
  const unsafe = plain(h.avoidControls(preferred, 100, 96, [brand, menu, note]));
  assert.deepEqual(unsafe, { x: 208, y: 12 });
  assert.equal(area(unsafe, menu), 2992, 'fixture demonstrates why adding only a selector is unsafe');
  assert.deepEqual(plain(h.avoidProfileCopy(preferred)), baseline);
  assert.ok(area(baseline, note) > 0, 'unavoidable copy overlap is retained instead of hiding Menu');
});

test('panel protection keeps explicit navigation and anchor rectangles and bypasses manual placement', () => {
  const h = harness();
  const header = rect(0, 0, 320, 64), anchor = rect(192, 713, 100, 96);
  const controls = [header, anchor], snapshot = JSON.stringify(controls);
  const preferred = { x: 32, y: 520 }, width = 250, height = 120;
  const next = plain(h.avoidProfileCopy(preferred, width, height, controls));
  for (const obstacle of [...controls, noteBounds]) assert.equal(area(next, obstacle, width, height, 12), 0);
  assert.equal(JSON.stringify(controls), snapshot, 'explicit obstacle array remains unchanged');
  h.manualPosition = true;
  assert.deepEqual(plain(h.avoidProfileCopy(preferred, width, height, controls)),
    plain(h.avoidControls(preferred, width, height, controls)));
  assert.match(source, /var controls = controlRects\(true\)\.concat\(\[anchor\]\);\s*var next = avoidProfileCopy\(preferred, panelWidth, panelHeight, controls\);/);
});

test('hidden, transparent, companion-owned or offscreen notes do not influence automatic placement', () => {
  for (const computedStyle of [{ display: 'none' }, { visibility: 'hidden' }, { opacity: '0' }]) {
    const h = harness();
    h.noteElement.computedStyle = computedStyle;
    assert.deepEqual(plain(h.avoidProfileCopy(observed)), plain(h.avoidControls(observed)));
  }
  const owned = harness();
  owned.noteElement.inCompanion = true;
  assert.deepEqual(plain(owned.avoidProfileCopy(observed)), observed);
  const h = harness();
  h.window.visualViewport = { offsetLeft: 0, offsetTop: 720, width: 320, height: 300 };
  const preferred = { x: 192, y: 740 };
  assert.deepEqual(plain(h.avoidProfileCopy(preferred)), plain(h.avoidControls(preferred)));
});

test('automatic measured header docking is unchanged even when Profile copy scrolls behind the header', () => {
  const h = harness({ width: 390, note: rect(32, 0, 326, 118) });
  const query = h.document.querySelector;
  const brand = { getBoundingClientRect: () => rect(12, 12, 138, 40) };
  const menu = { getBoundingClientRect: () => rect(310, 12, 68, 40) };
  h.document.querySelector = selector => selector === '.site-nav' ?
    { querySelector: selector => selector === '.site-brand' ? brand : menu } : query(selector);
  const expected = plain(h.mobileDock());
  h.applyPosition(observed.x, observed.y, false);
  assert.equal(h.attrs['data-mobile-docked'], 'true');
  assert.equal(h.attrs['data-position-x'], String(Math.round(expected.x)));
  assert.equal(h.attrs['data-position-y'], String(Math.round(expected.y)));
  assert.ok(!h.queries.includes(noteSelector), 'header-only character path never requests Profile copy');
});
