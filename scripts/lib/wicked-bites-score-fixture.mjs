// Source-contract fixture only: executes the cartridge's exact HUD formatter
// and bridge reader, without launching or simulating gameplay.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const gameRoot = new URL('../../studio-project/toadal-feast-website/reference/public/games/wicked-bites/', import.meta.url);
const game = fs.readFileSync(new URL('index.html', gameRoot), 'utf8');
const bridge = fs.readFileSync(new URL('toadal-bridge.js', gameRoot), 'utf8');
const formatter = game.match(/ui\.score\.textContent=(s\.score\.toLocaleString\(\));/);
const reader = bridge.match(/function readScore\(\) \{[^\n]+\}/);
assert.ok(formatter, 'fixture must use the unchanged actual HUD formatter');
assert.ok(reader, 'fixture must use the unchanged actual bridge reader');

export function readWickedBitesHudScore(score) {
  const textContent = vm.runInNewContext(formatter[1], { s: { score } });
  return vm.runInNewContext(reader[0] + '; readScore()', {
    node: id => id === 'wbScore' ? { textContent } : null
  });
}

export const SCORE_LOCALES = ['en-US', 'de-DE', 'fr-FR', 'ar-EG', 'hi-IN'];
export function scoreLocaleEnvironment(locale) {
  const systemLocale = locale.replaceAll('-', '_') + '.UTF-8';
  const env = { ...process.env, LANG: systemLocale, LC_ALL: systemLocale, TOADAL_SCORE_TEST_LOCALE: locale };
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
