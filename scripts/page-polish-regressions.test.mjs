import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(repoRoot, 'studio-project/toadal-feast-website/reference/assets/css/site.css'), 'utf8');
const marker = '/* Screenshot-reviewed App, World, and Play polish. */';
const polishStart = css.indexOf(marker);
assert.notEqual(polishStart, -1, 'Screenshot-reviewed page polish rules must remain grouped and scoped');
const polish = css.slice(polishStart);

function rule(selector) {
  const start = polish.indexOf(selector);
  assert.notEqual(start, -1, `Missing CSS rule: ${selector}`);
  const open = polish.indexOf('{', start + selector.length);
  const close = polish.indexOf('}', open + 1);
  assert.ok(open > start && close > open, `Malformed CSS rule: ${selector}`);
  return polish.slice(open + 1, close);
}

function cssColor(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `Missing CSS color token --${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

test('App Infinite actions retain their light-card state and readable labels', () => {
  const appSelector = '.app-gameplay-section:has(#infinite-mode-title) .app-product-actions .button-link--secondary';
  const appRule = rule(appSelector);
  assert.match(appRule, /color:\s*var\(--navy-900\)/);
  assert.match(appRule, /border-color:\s*var\(--gold-600\)/);
  assert.match(appRule, /background:\s*var\(--cream-50\)/);

  const textLum = luminance(cssColor('navy-900'));
  const surfaceLum = luminance(cssColor('cream-50'));
  assert.ok((surfaceLum + 0.05) / (textLum + 0.05) >= 4.5, 'Infinite action labels need WCAG AA text contrast');
  assert.match(appSelector, /#infinite-mode-title/, 'The color adjustment stays on the Infinite mode controls');
});

test('World and Play mobile adventure cards put their image caption in a full-width flow', () => {
  assert.match(polish, /@media\s*\(max-width:\s*600px\)/);
  const card = rule(':is(#mobile-adventure-world, #mobile-adventure-play).portal-app-feature');
  assert.match(card, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  const figure = rule(':is(#mobile-adventure-world, #mobile-adventure-play).portal-app-feature .portal-app-art');
  assert.match(figure, /width:\s*100%/);
  assert.match(figure, /height:\s*auto/);
  const image = rule(':is(#mobile-adventure-world, #mobile-adventure-play).portal-app-feature .portal-app-art img');
  assert.match(image, /width:\s*100%/);
  assert.match(image, /height:\s*160px/);
  const caption = rule(':is(#mobile-adventure-world, #mobile-adventure-play).portal-app-feature .portal-app-art figcaption');
  assert.match(caption, /overflow-wrap:\s*anywhere/);
  assert.match(caption, /line-height:\s*1\.4/);
});

test('World atlas titles and preview or locked labels get a visible wrapping gap', () => {
  const atlasRule = rule('.discovery-world .world-map-preview .discovery-scene-card > div:last-child');
  assert.match(atlasRule, /display:\s*flex/);
  assert.match(atlasRule, /flex-wrap:\s*wrap/);
  assert.match(atlasRule, /align-items:\s*baseline/);
  assert.match(atlasRule, /gap:\s*2px\s+8px/);
  assert.match(atlasRule, /padding:\s*8px\s+10px/);
});
