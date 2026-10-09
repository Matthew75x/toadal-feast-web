import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleSource = fs.readFileSync(path.join(repo,
  'studio-project/toadal-feast-website/reference/assets/js/home-brand-lettering.js'), 'utf8');

function harness({ brandText = 'TOADAL FEAST', fontStatus = 'loaded', paintResult, rendererEnabled = true } = {}) {
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
  brand.href = 'https://example.test/toadal-feast-web/';
  const head = makeElement('head');
  const document = {
    scripts,
    fonts,
    head,
    documentElement: {},
    readyState: 'complete',
    querySelector(selector) {
      if (selector === '.site-brand') return brand;
      if (selector === '.home-hero') return {};
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
    location: { href: 'https://example.test/toadal-feast-web/' },
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

test('the native brand keeps the original crown clearance while lettering is unavailable', () => {
  const css = fs.readFileSync(path.join(repo,
    'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');
  const rule = css.match(/html body:has\(\.home-hero\) \.site-brand\s*\{([^}]*)\}/);
  assert.ok(rule, 'Home brand rule exists');
  assert.match(rule[1], /padding-inline-start:\s*42px\s*;/);
  assert.equal(harness({ fontStatus: 'error' }).brand.classList.contains('site-brand--lettering-ready'), false);
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
