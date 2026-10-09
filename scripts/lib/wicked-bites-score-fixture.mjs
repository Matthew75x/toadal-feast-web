// Source-contract fixtures only, not gameplay or browser-default witnesses.
// Native mode uses the real process default. Controlled mode supplies a locale
// to genuine Intl built-ins only inside an isolated VM, without changing the
// host locale or the unchanged cartridge, bridge or adapter source bytes.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const reference = new URL('../../studio-project/toadal-feast-website/reference/', import.meta.url);
const gameRoot = new URL('public/games/wicked-bites/', reference);
const game = fs.readFileSync(new URL('index.html', gameRoot), 'utf8');
const bridge = fs.readFileSync(new URL('toadal-bridge.js', gameRoot), 'utf8');
const adapterUrl = new URL('assets/js/website-score-adapter.js', reference);
const formatter = game.match(/ui\.score\.textContent=(s\.score\.toLocaleString\(\));/);
const reader = bridge.match(/function readScore\(\) \{[^\n]+\}/);
assert.ok(formatter, 'fixture must use the unchanged actual HUD formatter');
assert.ok(reader, 'fixture must use the unchanged actual bridge reader');

export function createScoreFixture(locale) {
  const context = vm.createContext({ URL, URLSearchParams, fixtureLocale: locale });
  if (locale !== undefined) {
    assert.equal(typeof locale, 'string');
    assert.deepEqual(Intl.NumberFormat.supportedLocalesOf([locale]), [locale], 'requested ICU locale must be supported, never skipped');
    // Use the VM's own intrinsics, never shared host prototypes. Explicit
    // alternate locales remain explicit in both original native built-ins.
    vm.runInContext(`
      const NativeNumberFormat = Intl.NumberFormat;
      Intl.NumberFormat = function (locales, options) {
        return new NativeNumberFormat(locales === undefined ? fixtureLocale : locales, options);
      };
      Object.setPrototypeOf(Intl.NumberFormat, NativeNumberFormat);
      Intl.NumberFormat.prototype = NativeNumberFormat.prototype;
      const nativeToLocaleString = Number.prototype.toLocaleString;
      Number.prototype.toLocaleString = function (locales, options) {
        return Reflect.apply(nativeToLocaleString, this, [locales === undefined ? fixtureLocale : locales, options]);
      };
    `, context);
    vm.runInContext(fs.readFileSync(adapterUrl, 'utf8'), context, { filename: fileURLToPath(adapterUrl) });
  }
  const resolvedLocale = vm.runInContext('new Intl.NumberFormat().resolvedOptions().locale', context);
  if (locale !== undefined) assert.equal(resolvedLocale, locale, 'controlled fixture must use its selected locale');
  else assert.equal(resolvedLocale, new Intl.NumberFormat().resolvedOptions().locale, 'native fixture must retain the actual process default');
  return {
    mode: locale === undefined ? 'native-default' : 'controlled-locale',
    locale: resolvedLocale,
    adapter: locale === undefined ? require(fileURLToPath(adapterUrl)) : context.ToadalWebsiteScoreAdapter,
    format(score, options) { return new Intl.NumberFormat(locale, options).format(score); },
    readHudScore(score) {
      context.s = { score };
      const textContent = vm.runInContext(formatter[1], context);
      context.node = id => id === 'wbScore' ? { textContent } : null;
      return vm.runInContext(reader[0] + '; readScore()', context);
    }
  };
}

export const scoreFixture = createScoreFixture(process.env.TOADAL_SCORE_TEST_LOCALE);
export const readWickedBitesHudScore = score => scoreFixture.readHudScore(score);
export const SCORE_LOCALES = ['en-US', 'de-DE', 'fr-FR', 'ar-EG', 'hi-IN'];
export function scoreLocaleEnvironment(locale) {
  // LANG/LC_ALL do not reliably control Node's default locale on Windows.
  // This selects an explicit test-only VM fixture, not a system locale.
  const env = { ...process.env, TOADAL_SCORE_TEST_LOCALE: locale };
  // Nested node --test must start a fresh runner, not inherit the parent's
  // private child-runner IPC mode (which can hide skipped/failed execution).
  delete env.NODE_TEST_CONTEXT;
  return env;
}

export function assertScoreLocaleChild(child) {
  const report = child.stdout + child.stderr;
  assert.equal(child.status, 0, report);
  assert.match(child.stdout, /^# tests 1$/m, 'exactly one selected locale fixture must execute: ' + report);
  assert.match(child.stdout, /^# pass 1$/m, report);
  assert.match(child.stdout, /^# fail 0$/m, report);
  assert.match(child.stdout, /^# skipped 0$/m, report);
}
