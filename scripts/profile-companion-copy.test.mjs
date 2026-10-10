import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '..');
const sourcePath = 'studio-project/toadal-feast-website/reference/assets/js/companion-position.js';
const source = fs.readFileSync(path.join(repo, sourcePath), 'utf8');
const profileSelector = '[data-progression-page="profile"]';
const characterHeroSelector = '.toadal-profile-page .profile-hero-copy';
const noteSelector = profileSelector + ' :is(h1, h2, h3, h4, h5, h6, p, label, dt, dd, [role="listitem"], [role="status"], .progression-local-badge)';
const accountPrivacySelector = '.studio-rich-text.shell.section[data-studio-variant="gated-account"] [data-companion-context="privacy"]';
const accountPrivacyCopySelector = accountPrivacySelector + ' :is(h1, h2, h3, h4, h5, h6, p, label, dt, dd, [role="listitem"], [role="status"], .progression-local-badge)';
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
// Exact settled EA rectangles, 2026-10-09, Profile 320x844, scrollY=0.
// The original witness's manual/default provenance is unproven. These are
// source-execution fixtures, not a replay of the rendered page or a browser gate.
const observed = { x: 192, y: 556 };
const noteBounds = rect(32.667, 582.354, 254.667, 118.438);
// Visible hero-copy ink envelope measured from the actual fresh-context
// 1440x900 capture toadal-profile-desktop-1440x900.png (SHA-256
// 3ddcb13241b74e9dff6caf175f499276859048e0815048ecc284a5c036cc0972).
// The rectangle spans the eyebrow through the hero actions, including the
// heading pixels obscured by the companion; it is not a synthetic fixture.
const characterHeroCopyBounds = rect(170, 157, 457, 353);
const characterObserved = { x: 204, y: 118 };
const area = (position, obstacle, width = 100, height = 96, gap = 0) =>
  Math.max(0, Math.min(position.x + width + gap, obstacle.right) - Math.max(position.x - gap, obstacle.left)) *
  Math.max(0, Math.min(position.y + height + gap, obstacle.bottom) - Math.max(position.y - gap, obstacle.top));
const plain = value => JSON.parse(JSON.stringify(value));

function extract(name, indent = '    ', boundary = '\n' + indent + 'function ') {
  const start = source.indexOf(indent + 'function ' + name + '(');
  assert.ok(start >= 0, 'actual source function exists: ' + name);
  const end = source.indexOf(boundary, start + indent.length);
  assert.ok(end > start, 'actual source function has an extraction boundary: ' + name);
  return source.slice(start, end);
}

function extractFinishPointer() {
  const start = source.indexOf('    function finishPointer(');
  assert.ok(start >= 0, 'actual source finishPointer function exists');
  const end = source.indexOf("\n    button.addEventListener('pointerdown'", start);
  assert.ok(end > start, 'finishPointer ends before its listener wiring');
  return source.slice(start, end);
}

function harness({ route = profileSelector, manual = false, controls = [], note = noteBounds,
  saved = null, width = 320, height = 844, copyBounds = null, rootWidth = 100, rootHeight = 96 } = {}) {
  const attrs = {}, style = {}, writes = [], cancelledFrames = [], timers = [], frames = [];
  const makeElement = (bounds, extra = {}) => ({ getBoundingClientRect: () => bounds, ...extra });
  const copyElements = (copyBounds || [note]).map(bounds => makeElement(bounds));
  const noteElement = copyElements[0];
  const controlElements = controls.map(value => makeElement(value.bounds, value));
  const root = {
    hidden: false, offsetWidth: rootWidth, offsetHeight: rootHeight,
    contains: element => element.inCompanion === true,
    getAttribute: name => attrs[name],
    setAttribute: (name, value) => { attrs[name] = value; },
    removeAttribute: name => { delete attrs[name]; },
    style: { setProperty: (name, value) => { style[name] = value; } }
  };
  const header = { contains: element => element.inHeader === true };
  const queries = [], lookups = [];
  const context = {
    root, button: root, noteElement, copyElements, attrs, style, writes, queries, lookups, cancelledFrames, timers, manualPosition: manual, homePage: route === '.home-hero',
    x: 0, y: 0, drag: null, moveFrame: 0, queuedPosition: null, lastTouchTap: null, suppressClick: false, suppressTimer: null, EDGE_GAP: 12, DEFAULT_BOTTOM_GAP: 180,
    frames, flushFrame: () => { const frame = frames.shift(); if (frame) frame(); },
    POSITION_KEY: 'toadal:site:companion:position:v1',
    window: { innerWidth: width, innerHeight: height, scrollY: 0,
      requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, cancelAnimationFrame: id => cancelledFrames.push(id),
      setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: id => timers.push({ clear: id }), localStorage: { getItem: () => JSON.stringify(saved), setItem: (key, value) => writes.push({ key, value: JSON.parse(value) }) } },
    document: {
      documentElement: {},
      querySelector: selector => { lookups.push(selector); return selector === '.site-header' ? header : selector === route ? {} : null; },
      querySelectorAll: selector => {
        queries.push(selector);
        if (selector === noteSelector) return route === profileSelector ? copyElements : [];
        if (selector === characterHeroSelector) return route === characterHeroSelector ? copyElements : [];
        if (selector === accountPrivacyCopySelector) return route === accountPrivacySelector ? copyElements : [];
        return controlElements;
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
      'applyPosition', 'controlRects', 'avoidControls', 'avoidProfileCopy', 'defaultPosition', 'loadPosition',
      'schedulePosition', 'onScroll'].map(name => extract(name)).concat(
        extract('clampAfterViewportChange', '    ', '\n    window.addEventListener')).join('\n'), context);
  vm.runInContext(extractFinishPointer(), context);
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
  assert.match(source, /dock \? avoidControls\(next, dock\.width, dock\.height \|\| 52, controlRects\(false, true\)\) :\s*\(manualPosition \? next : avoidProfileCopy\(next\)\)/);
});

test('manual Profile placement survives the measured scroll collision and viewport resize clamp', () => {
  const linkBounds = rect(1500, 367.5, 90.6, 19);
  const saved = { version: 1, x: 916, y: 261, manual: true };
  const h = harness({ route: profileSelector, saved, width: 1440, height: 900,
    rootWidth: 152, rootHeight: 142, controls: [{ bounds: linkBounds }] });

  assert.deepEqual(plain(h.loadPosition()), { x: 916, y: 261 });
  assert.equal(h.manualPosition, true, 'the stored manual flag is restored');
  assert.deepEqual(plain(h.clampPosition(916, 261)), { x: 916, y: 261 },
    'the measured desktop point is within the viewport clamp');
  h.applyPosition(916, 261, true);
  assert.deepEqual({ x: h.x, y: h.y }, { x: 916, y: 261 });
  assert.deepEqual(h.writes, [{ key: h.POSITION_KEY, value: saved }]);

  linkBounds.left = 1037.5;
  linkBounds.right = 1128.1;
  assert.deepEqual(plain(h.avoidControls({ x: 916, y: 261 }, 152, 142, [linkBounds])),
    { x: 873, y: 261 }, 'the measured 12px control margin reproduces the observed unwanted move');

  h.window.scrollY = 648;
  h.onScroll();
  assert.equal(h.frames.length, 1, 'scroll schedules the existing animation-frame reflow');
  h.flushFrame();
  assert.deepEqual({ x: h.x, y: h.y }, { x: 916, y: 261 },
    'scroll reflow keeps the manual point despite the measured visible-link collision');
  assert.equal(h.attrs['data-position-x'], '916');
  assert.equal(h.attrs['data-position-y'], '261');
  assert.equal(h.writes.length, 1, 'passive scroll reflow does not rewrite the saved preference');

  h.window.scrollY = 758;
  h.onScroll();
  h.flushFrame();
  assert.deepEqual({ x: h.x, y: h.y }, { x: 916, y: 261 },
    'the repeated scroll reflow keeps the same manual position');

  h.window.innerWidth = 1000;
  h.clampAfterViewportChange();
  assert.deepEqual({ x: h.x, y: h.y }, { x: 836, y: 261 },
    'a narrower viewport still clamps the manual point into view');
  assert.deepEqual(h.writes.at(-1), { key: h.POSITION_KEY,
    value: { version: 1, x: 836, y: 261, manual: true } });
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

test('captured Toadal character-hero copy bounds are excluded for automatic avatar placement', () => {
  const h = harness({ route: characterHeroSelector, width: 1440, height: 900,
    note: characterHeroCopyBounds, copyBounds: [characterHeroCopyBounds] });
  assert.ok(area(characterObserved, characterHeroCopyBounds, 100, 96) > 0,
    'the captured avatar location overlaps the measured hero-copy envelope');
  h.applyPosition(characterObserved.x, characterObserved.y, false);
  const placed = { x: Number(h.attrs['data-position-x']), y: Number(h.attrs['data-position-y']) };
  assert.notDeepEqual(placed, characterObserved, 'automatic character-profile placement moves away from copy');
  assert.equal(area(placed, characterHeroCopyBounds, 100, 96, 12), 0,
    'hero eyebrow, heading, body and actions retain the existing exclusion gap');
  assert.ok(h.queries.includes(characterHeroSelector), 'the route-specific authored hero copy is collected');
  assert.ok(!h.queries.includes(noteSelector), 'guest Profile notes remain route-specific');
  assert.equal(h.writes.length, 0, 'automatic clearance leaves saved manual coordinates untouched');

  const manual = harness({ route: characterHeroSelector, manual: true, width: 1440, height: 900,
    note: characterHeroCopyBounds, copyBounds: [characterHeroCopyBounds] });
  assert.deepEqual(plain(manual.avoidProfileCopy(characterObserved)),
    plain(manual.avoidControls(characterObserved)), 'manual drag remains under the user’s control');
  assert.ok(!manual.lookups.includes(characterHeroSelector), 'manual placement does not inspect the route-specific target');
  assert.ok(!manual.queries.includes(characterHeroSelector), 'manual placement never queries hero-copy geometry');
});

test('automatic Account placement clears Privacy copy while manual placement remains clamped and persistent', () => {
  // Synthetic overlap fixture for the route-specific automatic exclusion; no Account screenshot
  // was available to support a measured rectangle. The production selector comes from account.json.
  const privacyCopy = rect(202, 550, 104, 72);
  const automatic = harness({ route: accountPrivacySelector, note: privacyCopy,
    copyBounds: [privacyCopy], width: 320, height: 844 });
  const preferred = plain(automatic.defaultPosition());
  assert.deepEqual(preferred, { x: 208, y: 556 });
  assert.ok(area(preferred, privacyCopy) > 0, 'the synthetic Account default overlaps the privacy copy');
  automatic.applyPosition(preferred.x, preferred.y, false);
  const placed = { x: Number(automatic.attrs['data-position-x']), y: Number(automatic.attrs['data-position-y']) };
  assert.notDeepEqual(placed, preferred, 'automatic placement leaves the Account copy');
  assert.equal(area(placed, privacyCopy, 100, 96, 12), 0, 'the Privacy heading and text retain the existing exclusion gap');
  assert.ok(automatic.queries.includes(accountPrivacyCopySelector));
  assert.ok(!automatic.queries.includes(noteSelector), 'guest Profile protection remains route-specific');
  assert.equal(automatic.writes.length, 0, 'automatic clearance does not persist a replacement preference');

  const saved = { version: 1, x: 208, y: 556, manual: true };
  const manual = harness({ route: accountPrivacySelector, manual: true, saved,
    note: privacyCopy, copyBounds: [privacyCopy], width: 320, height: 844 });
  assert.deepEqual(plain(manual.loadPosition()), { x: saved.x, y: saved.y });
  manual.applyPosition(saved.x, saved.y, true);
  assert.deepEqual({ x: manual.x, y: manual.y }, { x: saved.x, y: saved.y },
    'a deliberate Account placement is not moved around its copy');
  assert.ok(!manual.queries.includes(accountPrivacyCopySelector), 'manual placement bypasses route-specific copy measurement');
  assert.deepEqual(manual.writes.at(-1), { key: manual.POSITION_KEY, value: saved });

  manual.window.innerWidth = 140;
  manual.clampAfterViewportChange();
  assert.deepEqual({ x: manual.x, y: manual.y }, { x: 28, y: 556 },
    'manual Account placement still clamps to the resized viewport');
  assert.ok(manual.x >= 12 && manual.x + 100 <= 128);
  assert.deepEqual(manual.writes.at(-1), { key: manual.POSITION_KEY,
    value: { version: 1, x: 28, y: 556, manual: true } });
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

test('manual Home drag release and reload preserve the clamped pointer position in the observed collision fixture', () => {
  const obstacle = rect(980, 86, 400, 700);
  const requested = { x: 1029, y: 74 };
  const saved = { version: 1, x: 1600, y: 900, manual: false };
  const h = harness({
    route: '.home-hero',
    saved,
    controls: [{ bounds: obstacle }],
    width: 2560,
    height: 1223,
    rootWidth: 52,
    rootHeight: 52
  });

  const initial = plain(h.loadPosition());
  assert.equal(h.manualPosition, false, 'the untouched saved default remains automatic');
  h.x = initial.x;
  h.y = initial.y;
  h.applyPosition(initial.x, initial.y, false);
  assert.deepEqual(plain(h.clampPosition(requested.x, requested.y)), requested);
  assert.deepEqual(plain(h.avoidControls(requested, 52, 52, [obstacle])), { x: 1029, y: 22 },
    'the exact collision fixture reproduces the unwanted 52px relocation');

  h.drag = {
    pointerId: 7,
    pointerType: 'mouse',
    manual: false,
    originX: h.x,
    originY: h.y,
    moved: true
  };
  h.manualPosition = true;
  h.applyPosition(requested.x, requested.y, false);
  assert.deepEqual({ x: h.x, y: h.y }, requested,
    'manual Home position follows the clamped request during the drag');
  h.moveFrame = 31;
  h.queuedPosition = requested;
  h.finishPointer({ pointerId: 7 }, false);

  assert.equal(h.drag, null);
  assert.equal(h.manualPosition, true);
  assert.deepEqual({ x: h.x, y: h.y }, requested,
    'pointer-up applies the queued manual Home request without text avoidance');
  assert.equal(h.attrs['data-position-x'], String(requested.x));
  assert.equal(h.attrs['data-position-y'], String(requested.y));
  assert.deepEqual(h.cancelledFrames, [31]);
  assert.deepEqual(h.writes, [{
    key: h.POSITION_KEY,
    value: { version: 1, x: requested.x, y: requested.y, manual: true }
  }], 'pointer-up persists the exact manually chosen coordinates');

  const reloaded = harness({
    route: '.home-hero',
    saved: h.writes[0].value,
    controls: [{ bounds: obstacle }],
    width: 2560,
    height: 1223,
    rootWidth: 52,
    rootHeight: 52
  });
  const restored = plain(reloaded.loadPosition());
  assert.equal(reloaded.manualPosition, true);
  reloaded.applyPosition(restored.x, restored.y, false);
  assert.deepEqual({ x: reloaded.x, y: reloaded.y }, requested,
    'reload restores the manually chosen Home coordinates');
  reloaded.applyPosition(requested.x, -20, false);
  assert.deepEqual({ x: reloaded.x, y: reloaded.y }, { x: 1029, y: 12 },
    'manual Home placement still honors the 12px viewport clamp');
});

test('automatic Home placement keeps control avoidance while manual Profile placement stays user-controlled', () => {
  const obstacle = rect(980, 86, 400, 700);
  const requested = { x: 1029, y: 74 };
  const automatic = harness({ route: '.home-hero', controls: [{ bounds: obstacle }],
    width: 2560, height: 1223, rootWidth: 52, rootHeight: 52 });
  automatic.applyPosition(requested.x, requested.y, false);
  assert.deepEqual({ x: automatic.x, y: automatic.y }, { x: 1029, y: 22 }, 'automatic Home');
  assert.equal(area({ x: automatic.x, y: automatic.y }, obstacle, 52, 52, 12), 0,
    'automatic placement still leaves the control exclusion margin clear');

  const manual = harness({ route: profileSelector, manual: true, controls: [{ bounds: obstacle }],
    width: 2560, height: 1223, rootWidth: 52, rootHeight: 52 });
  manual.applyPosition(requested.x, requested.y, false);
  assert.deepEqual({ x: manual.x, y: manual.y }, requested,
    'manual Profile placement follows the requested point despite a generic control collision');
});

test('manual Home speech panel still avoids the navigation and avatar anchor', () => {
  const header = rect(0, 0, 2560, 64);
  const avatar = rect(1029, 74, 52, 52);
  const controls = [header, avatar];
  const preferred = { x: 1000, y: 50 };
  const h = harness({
    route: '.home-hero',
    manual: true,
    width: 2560,
    height: 1223,
    rootWidth: 52,
    rootHeight: 52
  });
  const panel = plain(h.avoidProfileCopy(preferred, 250, 120, controls));

  assert.notDeepEqual(panel, preferred, 'panel placement remains collision-managed in manual Home mode');
  for (const obstacle of controls) assert.equal(area(panel, obstacle, 250, 120, 12), 0);
  assert.match(source,
    /var controls = controlRects\(true\)\.concat\(\[anchor\]\);\s*var next = avoidProfileCopy\(preferred, panelWidth, panelHeight, controls\);/);
});

test('cancelled Home drags restore the prior position mode and coordinates without persisting', () => {
  const obstacle = rect(980, 86, 400, 700);
  const cases = [
    { manualBefore: false, origin: { x: 1600, y: 900 }, saved: { version: 1, x: 1600, y: 900, manual: false } },
    { manualBefore: true, origin: { x: 1029, y: 74 }, saved: { version: 1, x: 1029, y: 74, manual: true } }
  ];

  for (const fixture of cases) {
    const h = harness({
      route: '.home-hero',
      manual: true,
      saved: fixture.saved,
      controls: [{ bounds: obstacle }],
      width: 2560,
      height: 1223,
      rootWidth: 52,
      rootHeight: 52
    });
    h.x = 1700;
    h.y = 1000;
    h.root.setAttribute('data-dragging', 'true');
    h.drag = {
      pointerId: 7,
      manual: fixture.manualBefore,
      originX: fixture.origin.x,
      originY: fixture.origin.y,
      moved: true
    };
    h.moveFrame = 31;
    h.queuedPosition = { x: 1700, y: 1000 };

    h.finishPointer({ pointerId: 7 }, true);

    assert.equal(h.drag, null);
    assert.equal(h.manualPosition, fixture.manualBefore);
    assert.deepEqual({ x: h.x, y: h.y }, fixture.origin);
    assert.equal(h.attrs['data-position-x'], String(fixture.origin.x));
    assert.equal(h.attrs['data-position-y'], String(fixture.origin.y));
    assert.equal(h.attrs['data-dragging'], undefined);
    assert.equal(h.moveFrame, 0);
    assert.equal(h.queuedPosition, null);
    assert.deepEqual(h.cancelledFrames, [31]);
    assert.equal(h.writes.length, 0, 'cancel restores the prior mode and position without saving the interrupted drag');
  }
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

test('Profile semantic copy coverage includes every readable native text node and populated/empty runtime records', () => {
  const profile = JSON.parse(fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/pages/profile.json'), 'utf8'));
  const textTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'label', 'dt', 'dd']);
  const controls = new Set(['a', 'button', 'select', 'option']);
  const covered = node => {
    const props = node.props || {}, classes = (props.className || '').split(/\s+/);
    return textTags.has(props.tag) || controls.has(props.tag) || ['listitem', 'status'].includes(props.attributes?.role) ||
      classes.includes('progression-local-badge') || classes.includes('detail-breadcrumb');
  };
  let checked = 0;
  function walk(value, ancestors = []) {
    if (Array.isArray(value)) { value.forEach(child => walk(child, ancestors)); return; }
    if (!value || typeof value !== 'object') return;
    const next = value.props ? [...ancestors, value] : ancestors;
    if (value.props && typeof value.props.text === 'string' && value.props.text.trim()) {
      const hidden = next.some(node => node.props.attributes?.['aria-hidden'] === 'true' ||
        (node.props.className || '').split(/\s+/).includes('sr-only'));
      if (!hidden) { checked += 1; assert.ok(next.some(covered), value.id + ': ' + value.props.text); }
    }
    for (const child of Object.values(value)) if (child && typeof child === 'object') walk(child, next);
  }
  walk(profile);
  assert.ok(checked >= 65, 'coverage is against the complete native Profile, not only failed paragraphs');
  assert.ok(source.includes(noteSelector));
  const progression = fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/reference/assets/js/guest-progression.js'), 'utf8');
  const render = progression.slice(progression.indexOf('  function renderList('), progression.indexOf('  function renderList(') + 4500);
  assert.match(render, /empty\.setAttribute\('role', 'listitem'\)/);
  assert.match(render, /entry\.setAttribute\('role', 'listitem'\)/);
  assert.match(render, /createElement\('strong'\)/);
  assert.ok(noteSelector.includes('[role="listitem"]'), 'runtime record title and empty div text stay inside protection');
  assert.ok(noteSelector.includes('[role="status"]'), 'status protection survives an owner changing its semantic tag');
});

test('adjacent guest summary and route explanations share one semantic collision set', () => {
  const topCopy = [
    rect(32.67, 195.40, 254.67, 65.85), rect(32.67, 271.25, 254.67, 99.17),
    rect(109.33, 400.42, 167.33, 35.44), rect(109.33, 439.85, 167.33, 27.83),
    rect(109.33, 471.69, 167.33, 86), rect(32.67, 582.35, 254.67, 118.44)
  ];
  const h = harness({ copyBounds: topCopy });
  const previousNoteOnly = { x: 192, y: 474 };
  assert.ok(area(previousNoteOnly, topCopy[4]) > 7000, 'recorded candidate placement obscured guest summary');
  const next = plain(h.avoidProfileCopy(previousNoteOnly));
  for (const copy of topCopy) assert.equal(area(next, copy, 100, 96, 12), 0);
  // All measured rectangles above are included, but unprovided page controls are
  // not fabricated. Complete-page slot availability remains a browser-data gate.
  const routeParagraph = rect(33, 200, 254, 180);
  const middle = harness({ copyBounds: [routeParagraph, rect(33, 400, 254, 100)] });
  const middleNext = plain(middle.avoidProfileCopy({ x: 192, y: 210 }));
  assert.equal(area(middleNext, routeParagraph, 100, 96, 12), 0, 'representative route explanation uses same set');
});

function headerHarness({ width = 320, gap = 49.77, brandRight = 162.88,
  route = profileSelector, manual = false, minimized = true } = {}) {
  const brandBounds = rect(16, 8, brandRight - 16, 48);
  const menuBounds = rect(brandRight + 26 + gap, 10, 65.35, 44);
  const h = harness({ width, route, manual, controls: [
    { bounds: brandBounds, inHeader: true }, { bounds: menuBounds, inHeader: true }
  ] });
  h.attrs['data-minimized'] = String(minimized);
  const query = h.document.querySelector;
  const brand = { getBoundingClientRect: () => brandBounds };
  const menu = { getBoundingClientRect: () => menuBounds };
  h.document.querySelector = selector => selector === '.site-nav' ?
    { querySelector: selector => selector === '.site-brand' ? brand : menu } : query(selector);
  return { h, brandBounds, menuBounds };
}

test('fractional header gap admits only automatic already-minimized Profile at the 48px boundary', () => {
  for (const gap of [47.999, 48, 48.001, 49.77, 51.999, 52, 52.001]) {
    for (const [route, manual, minimized, threshold] of [
      [profileSelector, false, true, 48], [profileSelector, false, false, 52],
      ['.home-hero', false, true, 64], ['.app-page', false, true, 52], ['.wo002-game-library', false, true, 52]
    ]) {
      const { h } = headerHarness({ gap, brandRight: 160, route, manual, minimized });
      const dock = h.mobileDock();
      if (gap < threshold) assert.equal(dock, null, `${route}/${minimized}/${gap}`);
      else {
        assert.ok(dock);
        const expectedWidth = route === '.home-hero' ? 64 : gap;
        assert.ok(Math.abs(dock.width - expectedWidth) < 1e-9, route + '/' + gap + ' keeps its intended hit-box width');
        assert.ok(dock.width <= gap + 1e-9, route + '/' + gap + ' fits between the measured header controls');
        assert.ok(dock.width >= 48);
      }
    }
    const { h } = headerHarness({ gap, manual: true });
    assert.equal(h.mobileDock(), null, 'saved/deliberate manual placement always bypasses docking');
  }
});

test('measured 320px Profile dock keeps its hit target and constrained artwork between brand and Menu', () => {
  const { h, brandBounds, menuBounds } = headerHarness();
  // Actual Chrome scrollbars narrow the visual viewport without changing innerWidth.
  h.window.visualViewport = { offsetLeft: 0, offsetTop: 0, width: 304.67, height: 844 };
  assert.ok(Math.abs(h.defaultPosition().x - 192.67) < 1e-9);
  assert.equal(h.clampPosition(h.defaultPosition().x, 556).x, 192);
  const dock = plain(h.mobileDock());
  assert.ok(Math.abs(dock.width - 49.77) < 1e-9);
  h.applyPosition(observed.x, observed.y, false);
  assert.equal(h.attrs['data-mobile-docked'], 'true');
  const position = { x: Number(h.attrs['data-position-x']), y: Number(h.attrs['data-position-y']) };
  assert.deepEqual(position, { x: 176, y: 6 });
  assert.ok(dock.width >= 48 && 52 >= 48, 'accessible measured hit target');
  for (const obstacle of [brandBounds, menuBounds]) assert.equal(area(position, obstacle, dock.width, 52, 12), 0);
  // CSS contracts below make the visible image no wider than this exact target;
  // actual computed pixels remain part of the separate loaded-artwork browser gate.
  const css = fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');
  assert.match(css, /\.toadal-companion\[data-mobile-docked="true"\] \{\s*width: var\(--toadal-dock-width, 102px\);\s*height: 52px;/);
  assert.match(css, /\.toadal-companion\[data-mobile-docked="true"\] \.companion-toggle \{\s*width: var\(--toadal-dock-width, 102px\);\s*min-width: 0;\s*height: 52px;\s*min-height: 52px;/);
  assert.match(css, /body:has\(\[data-progression-page="profile"\]\) \.toadal-companion\[data-mobile-docked="true"\]\[data-minimized="true"\] \.companion-image \{\s*width: min\(52px, var\(--toadal-dock-width, 52px\)\);\s*\}/);
  assert.match(css, /\.toadal-companion\[data-mobile-docked="true"\] \.companion-image \{[^}]*height: 52px;[^}]*transform: none;/);
  assert.match(css, /\.toadal-companion \.companion-image \{[^}]*object-fit: contain;/);
  assert.equal(h.writes.length, 0, 'the responsive decision writes no preference');
});

test('explicit expansion, collapse, resize and manual placement preserve the prior transition rules', () => {
  const { h } = headerHarness();
  h.applyPosition(observed.x, observed.y, false);
  assert.equal(h.attrs['data-mobile-docked'], 'true');
  h.attrs['data-minimized'] = 'false';
  h.applyPosition(h.x, h.y, false);
  assert.equal(h.attrs['data-mobile-docked'], undefined, 'explicit expansion exits exceptional narrow dock');
  assert.equal(h.attrs['data-minimized'], 'false', 'placement never changes the requested expanded state');
  h.attrs['data-minimized'] = 'true';
  h.applyPosition(h.x, h.y, false);
  assert.equal(h.attrs['data-mobile-docked'], 'true', 'deliberate minimization restores an available automatic dock');
  h.window.innerWidth = 1180;
  h.applyPosition(h.x, h.y, false);
  assert.equal(h.attrs['data-mobile-docked'], undefined, 'existing desktop Profile behavior is retained');
  h.window.innerWidth = 320;
  h.applyPosition(h.x, h.y, false);
  assert.equal(h.attrs['data-mobile-docked'], 'true');
  h.manualPosition = true;
  h.applyPosition(192, 474, false);
  assert.equal(h.attrs['data-mobile-docked'], undefined);
  assert.deepEqual({ x: h.x, y: h.y }, { x: 192, y: 474 });
  assert.equal(h.writes.length, 0);
  const normal = headerHarness({ width: 390, gap: 104.43 });
  for (const minimized of ['true', 'false']) {
    normal.h.attrs['data-minimized'] = minimized;
    const dock = plain(normal.h.mobileDock());
    assert.equal(dock.width, 102);
    normal.h.applyPosition(observed.x, observed.y, false);
    assert.deepEqual({ x: normal.h.x, y: normal.h.y }, { x: 177, y: 6 });
  }
});
