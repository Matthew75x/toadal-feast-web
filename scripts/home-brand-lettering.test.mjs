import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleSource = fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/reference/assets/js/home-brand-lettering.js'), 'utf8');

function harness({ brandText = 'TOADAL FEAST', fontStatus = 'loaded', paintResult, rendererEnabled = true, homeHero = true, imageSrc = null, imageComplete = false, naturalWidth = 108, naturalHeight = 36, homePath = '/toadal-feast-web/' } = {}) {
  const frames = [];
  const mutations = [];
  const resizes = [];
  const fontEvents = {};
  const paints = [];
  const scripts = [];
  const canvases = [];
  const fontFace = { family: 'Lilita One', status: fontStatus, weight: '400' };
  const fonts = [fontFace];
  fonts.addEventListener = (name, callback) => { (fontEvents[name] ||= []).push(callback); };
  fonts.emit = name => (fontEvents[name] || []).forEach(callback => callback());

  function makeElement(tagName) {
    const listeners = {};
    const attrs = {};
    const classes = new Set();
    const element = {
      tagName,
      className: '',
      dataset: {},
      attrs,
      listeners,
      children: [],
      width: 0,
      height: 0,
      painted: false,
      clearCount: 0,
      async: false,
      src: '',
      isConnected: true,
      addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
      emit(name) { (listeners[name] || []).forEach(callback => callback({ type: name })); },
      appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return Object.hasOwn(attrs, name) ? attrs[name] : null; },
      querySelector(selector) { return selector === '.site-brand__image' ? this.children.find(child => child.className === 'site-brand__image') || null : null; },
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); }
      },
      getBoundingClientRect() {
        if (tagName !== 'canvas') return { width: 150, height: 40 };
        return element.className.includes('--toadal') ? dimensions.toadal : dimensions.feast;
      },
      getContext() {
        return { clearRect: () => { element.painted = false; element.clearCount += 1; } };
      }
    };
    if (tagName === 'canvas') canvases.push(element);
    return element;
  }

  const dimensions = {
    toadal: { width: 104, height: 18 },
    feast: { width: 104, height: 18 }
  };
  const brand = makeElement('a');
  let nativeText = brandText;
  Object.defineProperty(brand, 'textContent', {
    get() { return nativeText; },
    set(value) {
      nativeText = String(value);
      this.children.forEach(child => { child.parentNode = null; });
      this.children = [];
    }
  });
  brand.href = 'https://example.test' + homePath;
  let image = null;
  if (imageSrc !== null) {
    image = makeElement('img');
    image.className = 'site-brand__image';
    image.src = imageSrc;
    image.setAttribute('src', imageSrc);
    image.complete = imageComplete;
    image.naturalWidth = naturalWidth;
    image.naturalHeight = naturalHeight;
    brand.appendChild(image);
  }
  const head = makeElement('head');
  const document = {
    scripts,
    fonts,
    head,
    documentElement: {},
    readyState: 'complete',
    querySelector(selector) {
      if (selector === '.site-brand') return brand;
      if (selector === '.home-hero') return homeHero ? {} : null;
      return null;
    },
    createElement: makeElement
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; resizes.push(this); }
    observe(target) { this.target = target; }
  }
  const window = {
    location: { href: 'https://example.test' + homePath },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    addEventListener() {}
  };
  const renderer = {
    whenReady(callback) { callback(); },
    paint(canvas, settings) {
      paints.push({ canvas, settings: { ...settings } });
      canvas.painted = true;
      canvas.width = Math.ceil(settings.w * 2);
      canvas.height = Math.ceil(settings.h * 2);
      return typeof paintResult === 'function' ? paintResult(canvas, settings, paints.length) :
        paintResult === undefined ? true : paintResult;
    }
  };
  const context = { document, window, URL, MutationObserver, ResizeObserver };
  if (rendererEnabled) context.TOADAL = renderer;
  vm.createContext(context);
  vm.runInContext(moduleSource, context);
  return {
    brand,
    image,
    canvases,
    dimensions,
    fonts,
    mutations,
    paints,
    resizes,
    renderer,
    head,
    flushFrames() {
      let guard = 0;
      while (frames.length) {
        assert.ok(++guard < 20, 'animation scheduling settles');
        frames.shift()();
      }
    }
  };
}

test('Home lettering derives its two words from editable native brand text and repaints on edits', () => {
  const h = harness();
  h.flushFrames();
  assert.deepEqual(h.paints.map(item => item.settings.letterText), ['TOADAL', 'FEAST']);
  assert.equal(h.brand.textContent, 'TOADAL FEAST', 'the native semantic link text remains intact');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), true);
  assert.equal(h.brand.children[0].getAttribute('aria-hidden'), 'true');

  h.brand.textContent = 'TOADAL BAKERY';
  h.mutations[0].callback([{ type: 'characterData', target: h.brand }]);
  h.flushFrames();
  assert.deepEqual(h.paints.slice(-2).map(item => item.settings.letterText), ['TOADAL', 'BAKERY']);
  assert.equal(h.brand.textContent, 'TOADAL BAKERY');
  assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
  assert.equal(h.brand.children[0].className, 'site-brand__wordmark',
    'a DOM text replacement cannot detach the decorative wordmark permanently');
});

test('inner routes use the same decorative wordmark while the shared anchor text and URL stay native', () => {
  const h = harness({ homeHero: false });
  h.flushFrames();
  assert.deepEqual(h.paints.map(item => item.settings.letterText), ['TOADAL', 'FEAST']);
  assert.equal(h.brand.tagName, 'a');
  assert.equal(h.brand.href, 'https://example.test/toadal-feast-web/');
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), true);
  assert.equal(h.brand.children[0].getAttribute('aria-hidden'), 'true');
});

test('Home lettering repaints after a size change', () => {
  const h = harness();
  h.flushFrames();
  const priorPaints = h.paints.length;
  h.dimensions.toadal.width = 88;
  h.resizes[0].callback([]);
  h.flushFrames();
  assert.equal(h.paints.length, priorPaints + 2);
  assert.equal(h.paints.at(-2).settings.w, 88);
});

test('unsupported edited text restores native copy and clears both canvases', () => {
  const h = harness();
  h.flushFrames();
  h.brand.textContent = 'TOADAL FEAST HOME';
  h.mutations[0].callback([{ type: 'characterData', target: h.brand }]);
  h.flushFrames();
  assert.equal(h.brand.textContent, 'TOADAL FEAST HOME');
  assert.equal(h.brand.dataset.homeBrandLettering, 'fallback');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), false);
  assert.deepEqual(h.canvases.map(canvas => canvas.painted), [false, false]);
  assert.ok(h.canvases.every(canvas => canvas.clearCount > 0));
});

test('an unloaded embedded Lilita One face never hides the native text', () => {
  const h = harness({ fontStatus: 'error' });
  h.flushFrames();
  assert.equal(h.paints.length, 0);
  assert.equal(h.brand.dataset.homeBrandLettering, 'fallback');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), false);
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
});

test('a failed second canvas paint clears partial lettering and restores native text', () => {
  const h = harness({ paintResult: (_canvas, _settings, count) => count === 1 });
  h.flushFrames();
  assert.equal(h.paints.length, 2);
  assert.equal(h.brand.dataset.homeBrandLettering, 'fallback');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), false);
  assert.deepEqual(h.canvases.map(canvas => canvas.painted), [false, false]);
  assert.ok(h.canvases.every(canvas => canvas.clearCount > 0));
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
});

test('the native brand stays crown-free and keeps its fallback wordmark aligned', () => {
  const css = fs.readFileSync(path.join(repo,
    'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');
  const rule = css.match(/html body:has\(\.home-hero\) \.site-brand\s*\{([^}]*)\}/);
  assert.ok(rule, 'Home brand rule exists');
  assert.doesNotMatch(rule[1], /padding-inline-start\s*:/);
  const sharedWordmark = css.match(/html body \.site-brand__wordmark\s*\{([^}]*)\}/);
  assert.ok(sharedWordmark, 'the decorative layer applies to shared navigation on every route');
  const readyWordmark = css.match(/html body \.site-brand\.site-brand--lettering-ready\s*\{([^}]*)\}/);
  assert.ok(readyWordmark, 'the measured wordmark layout applies on Home and inner routes');
  assert.match(readyWordmark[1], /min-width:\s*108px\s*;/,
    'canvas lettering retains a visible, clickable home anchor when native text is visually hidden');
  assert.match(sharedWordmark[1], /inset-inline-start:\s*0\s*;/,
    'the lettering begins at the brand edge with no crown reservation');
  const advancedCss = JSON.parse(fs.readFileSync(path.join(repo,
    'studio-project/toadal-feast-website/collections/advanced-code.json'), 'utf8')).css;
  assert.doesNotMatch(css + advancedCss, /brand-crown\.svg|\.site-brand::before\b|\.feast-pass-panel::after\b|content\s*:\s*["'][♛♕♔♚👑]/i);
  const gulper = path.join(repo, 'studio-project/toadal-feast-website/reference/public/games/claw-feed-gulper');
  const gameUi = fs.readFileSync(path.join(gulper, 'runtime.bundle.js'), 'utf8') +
    fs.readFileSync(path.join(gulper, 'styles.css'), 'utf8');
  assert.doesNotMatch(gameUi, /[♛♕♔♚👑]|class\s*=\s*["']crown["']|\.mastery-step\s+\.crown\b/u,
    'the embedded game contains no standalone crown or queen icon');
  const assets = JSON.parse(fs.readFileSync(path.join(repo,
    'studio-project/toadal-feast-website/assets/index.json'), 'utf8'));
  assert.ok(!assets.assets.some(asset => asset.id === 'asset.brand.crown'));
  assert.equal(harness({ fontStatus: 'error' }).brand.classList.contains('site-brand--lettering-ready'), false);
});

test('the shared nav loader runs on inner pages instead of requiring a Home hero', () => {
  const advanced = JSON.parse(fs.readFileSync(path.join(repo,
    'studio-project/toadal-feast-website/collections/advanced-code.json'), 'utf8')).javascript;
  const marker = 'Shared navigation wordmark loader';
  const offset = advanced.indexOf(marker);
  assert.ok(offset >= 0, 'the native advanced-code collection retains the shared loader');
  const loader = advanced.slice(offset);
  assert.doesNotMatch(loader, /document\.querySelector\('\.home-hero'\)/);
  assert.match(loader, /home-brand-lettering\.js/);
});

test('a failed renderer script leaves the native brand text readable', () => {
  const h = harness({ rendererEnabled: false });
  const loader = h.head.children[0];
  assert.equal(loader.src, '/toadal-feast-web/assets/js/toadal-lettering.js');
  loader.emit('error');
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
  assert.equal(h.brand.dataset.homeBrandLettering, 'fallback');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), false);
});

test('a failed renderer script on an inner route also leaves the native brand readable', () => {
  const h = harness({ rendererEnabled: false, homeHero: false });
  const loader = h.head.children[0];
  assert.equal(loader.src, '/toadal-feast-web/assets/js/toadal-lettering.js');
  loader.emit('error');
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
  assert.equal(h.brand.dataset.homeBrandLettering, 'fallback');
  assert.equal(h.brand.classList.contains('site-brand--lettering-ready'), false);
});


test('a pending managed image retains the existing lettering until successful load', () => {
  const h = harness({ imageSrc: '/toadal-feast-web/assets/studio/qa-image.0123456789.png' });
  h.flushFrames();
  assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), false);
  h.image.emit('load');
  h.flushFrames();
  assert.equal(h.brand.dataset.homeBrandLettering, 'image-ready');
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), true);
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
});

test('cached managed images work at root and nested export paths', () => {
  for (const homePath of ['/', '/toadal-feast-web/']) {
    const h = harness({ homePath, imageSrc: homePath + 'assets/studio/qa-image.0123456789.png', imageComplete: true });
    h.flushFrames();
    assert.equal(h.brand.dataset.homeBrandLettering, 'image-ready');
    assert.equal(h.brand.classList.contains('site-brand--image-ready'), true);
    assert.equal(h.paints.length, 0, 'the successful image suppresses decorative canvas painting');
    assert.equal(h.brand.textContent, 'TOADAL FEAST');
  }
});

test('image loading failure restores the current lettering and accessible text', () => {
  const h = harness({ imageSrc: '/toadal-feast-web/assets/studio/qa-image.0123456789.png', imageComplete: true });
  h.flushFrames();
  h.image.emit('error');
  h.flushFrames();
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), false);
  assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
  assert.deepEqual(h.paints.map(item => item.settings.letterText), ['TOADAL', 'FEAST']);
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
});

test('external and unmanaged images never replace the current wordmark', () => {
  for (const imageSrc of ['https://external.test/assets/studio/logo.png', '/toadal-feast-web/assets/images/icon.png', '/assets/studio/wrong-base.png']) {
    const h = harness({ imageSrc, imageComplete: true });
    h.flushFrames();
    assert.equal(h.brand.classList.contains('site-brand--image-ready'), false);
    assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
  }
});

test('a later source change is revalidated before an image can stay visible', () => {
  const h = harness({ imageSrc: '/toadal-feast-web/assets/studio/qa-image.0123456789.png', imageComplete: true });
  h.flushFrames();
  h.image.setAttribute('src', 'https://external.test/assets/studio/logo.png');
  h.image.emit('load');
  h.flushFrames();
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), false);
  assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
});

test('an image with zero decoded dimensions leaves the current lettering usable', () => {
  const h = harness({ imageSrc: '/toadal-feast-web/assets/studio/qa-image.0123456789.png', imageComplete: true, naturalWidth: 0, naturalHeight: 0 });
  h.flushFrames();
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), false);
  assert.equal(h.brand.dataset.homeBrandLettering, 'ready');
});

test('a valid managed image survives failure of the optional lettering script', () => {
  const h = harness({ imageSrc: '/toadal-feast-web/assets/studio/qa-image.0123456789.png', imageComplete: true, rendererEnabled: false });
  h.head.children[0].emit('error');
  assert.equal(h.brand.dataset.homeBrandLettering, 'image-ready');
  assert.equal(h.brand.classList.contains('site-brand--image-ready'), true);
  assert.equal(h.brand.textContent, 'TOADAL FEAST');
});
