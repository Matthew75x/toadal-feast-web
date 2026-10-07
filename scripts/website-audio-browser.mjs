#!/usr/bin/env node
// Local-only Chrome qualification. Scratch responses never edit protected files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output || !process.env.PLAYWRIGHT_MODULE || !process.env.CHROME_PATH) throw Error('Pass a report file and explicit PLAYWRIGHT_MODULE / CHROME_PATH.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const prefix = '/toadal-feast-web/', dist = path.join(repo, 'dist');
const declaration = { mode: 'host', contractVersion: 1, profile: 'scratch-audio', profileVersion: 1, eventMessage: 'game:audio', hostMessage: 'host:audio', fallback: 'local-before-active' };
const registry = { schema: 'toadal.web.audio-registry.v1', version: 1, cues: { 'scratch.confirm': { bus: 'sfx', gain: 0.4, cooldownMs: 0, maxVoices: 2, voicePolicy: 'drop', fallback: { kind: 'tone', wave: 'sine', startHz: 440, endHz: 660, durationMs: 80 } } }, profiles: { 'scratch-audio': { version: 1, events: { 'ui.confirm': 'scratch.confirm' } } } };
const adapter = fs.readFileSync(path.join(repo, 'scripts/cartridge-hardener/templates/host-audio-adapter.mjs'), 'utf8');
const fixture = '<!doctype html><meta charset="utf-8"><button id="action">Emit semantic action</button><script type="module">' + adapter + `
let legacyCalls = 0;
const origin = new URL(document.referrer).origin;
const audio = createToadalHostAudioAdapter({ gameId: 'wicked-bites', legacy: () => { legacyCalls++; }, parentOrigin: origin });
window.__audioFixture = { audio, get legacyCalls() { return legacyCalls; } };
document.getElementById('action').addEventListener('click', () => {
  audio.emit('ui.confirm', { intensity: 0.8 });
  parent.postMessage({ protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'game:started', payload: {} }, origin);
});
parent.postMessage({ protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'game:ready', payload: {} }, origin);
</script>`;
let scratch = false;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    let rel = pathname.slice(prefix.length); if (!rel || rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(dist, rel); if (!file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    let bytes;
    if (scratch && rel === 'public/games/wicked-bites/cartridge.json') {
      const manifest = JSON.parse(fs.readFileSync(file, 'utf8')); manifest.audio = declaration; bytes = Buffer.from(JSON.stringify(manifest));
    } else if (scratch && rel === 'assets/data/audio-registry.json') bytes = Buffer.from(JSON.stringify(registry));
    else if (scratch && rel === 'public/games/wicked-bites/index.html') bytes = Buffer.from(fixture);
    else bytes = fs.readFileSync(file);
    res.writeHead(200, { 'content-type': mime[path.extname(rel)] || 'application/octet-stream', 'content-length': bytes.length, 'cache-control': 'no-store' }); res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const report = { schema: 'toadal.web.audio-browser-qualification.v1', sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo }).toString().trim(), sourceTree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: repo }).toString().trim(), sourceDirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: repo }).toString().trim(), chromeExecutable: process.env.CHROME_PATH, scratchResponseOverridesOnly: true, checks: [] };
let browser;
const check = (name, actual, expected) => { assert.deepEqual(actual, expected, name); report.checks.push({ name, actual, expected, status: 'PASS' }); };
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true, timeout: 20000 }); report.chromeVersion = browser.version();
  for (const optIn of [false, true]) {
    scratch = optIn;
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.__legacyMuteMessages = [];
      if (window !== window.top) {
        window.addEventListener('message', e => { if (['host:mute', 'host:unmute'].includes(e.data?.type)) window.__legacyMuteMessages.push(e.data.type); });
        return;
      }
      window.__hostContextCreations = 0;
      const Base = window.AudioContext || window.webkitAudioContext;
      if (Base) window.AudioContext = class extends Base { constructor(...args) { super(...args); window.__hostContextCreations++; } };
    });
    const page = await context.newPage(), requests = [], errors = [];
    page.on('request', req => requests.push(new URL(req.url()).pathname));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.setDefaultTimeout(10000);
    await page.goto(origin + prefix + 'player/wicked-bites/', { waitUntil: 'networkidle' });
    const scope = optIn ? 'scratchOptIn' : 'nonOptIn';
    check(scope + ': no host context before gesture', await page.evaluate(() => window.__hostContextCreations), 0);
    const sandbox = await page.locator('[data-player-frame]').getAttribute('sandbox'); check(scope + ': opaque iframe isolation', sandbox.includes('allow-same-origin'), false);
    if (!optIn) {
      check('nonOptIn: no shared host', await page.evaluate(() => !!window.__toadalWebsiteAudioHost), false);
      const game = page.frames().find(f => f.url().includes('/public/games/wicked-bites/'));
      await page.locator('[data-player-sound]').click();
      await game.waitForFunction(() => window.__legacyMuteMessages.includes('host:mute'));
      await page.locator('[data-player-sound]').click();
      await game.waitForFunction(() => window.__legacyMuteMessages.includes('host:unmute'));
      check('nonOptIn: original mute/unmute', await game.evaluate(() => window.__legacyMuteMessages), ['host:mute', 'host:unmute']);
    } else {
      await page.waitForFunction(() => !!window.__toadalWebsiteAudioHost);
      let game = page.frames().find(f => f.url().includes('/public/games/wicked-bites/'));
      await game.getByRole('button', { name: 'Emit semantic action' }).click();
      check('scratchOptIn: local owner before activation', await game.evaluate(() => window.__audioFixture.legacyCalls), 1);
      await page.locator('[data-player-sound]').click();
      await page.waitForFunction(() => window.__toadalWebsiteAudioHost.active);
      check('scratchOptIn: one running host context', await page.evaluate(() => [window.__hostContextCreations, window.__toadalWebsiteAudioHost.context.state]), [1, 'running']);
      await game.getByRole('button', { name: 'Emit semantic action' }).click();
      await page.waitForFunction(() => window.__toadalWebsiteAudioHost.records.some(r => r.type === 'play'));
      check('scratchOptIn: semantic procedural playback', await page.evaluate(() => window.__toadalWebsiteAudioHost.records.filter(r => r.type === 'play').map(r => [r.cue, r.source])), [['scratch.confirm', 'procedural-fallback']]);
      check('scratchOptIn: active host prevents legacy duplicate', await game.evaluate(() => window.__audioFixture.legacyCalls), 1);
      await page.locator('[data-player-sound]').click();
      check('scratchOptIn: website mute persisted', await page.evaluate(() => JSON.parse(localStorage.getItem('toadal:web:v1:audio')).muted), true);
      await game.getByRole('button', { name: 'Emit semantic action' }).click();
      await page.waitForFunction(() => window.__toadalWebsiteAudioHost.records.some(r => r.type === 'muted-event'));
      check('scratchOptIn: muted action has no second shared or legacy play', [await page.evaluate(() => window.__toadalWebsiteAudioHost.records.filter(r => r.type === 'play').length), await game.evaluate(() => window.__audioFixture.legacyCalls)], [1, 1]);
      for (const state of ['degraded', 'available']) {
        await page.evaluate(state => document.querySelector('[data-player-frame]').contentWindow.postMessage({ protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'host:audio', payload: { state } }, '*'), state);
        await game.waitForFunction(state => window.__audioFixture.audio.state === state, state);
        await game.getByRole('button', { name: 'Emit semantic action' }).click();
      }
      check('scratchOptIn: degraded/available retain host ownership', await game.evaluate(() => [window.__audioFixture.audio.hostOwnsPlayback, window.__audioFixture.legacyCalls]), [true, 1]);
      await page.evaluate(() => document.querySelector('[data-player-frame]').contentWindow.postMessage({ protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'host:audio', payload: { state: 'unavailable' } }, '*'));
      await game.waitForFunction(() => window.__audioFixture.audio.state === 'unavailable');
      await game.getByRole('button', { name: 'Emit semantic action' }).click();
      check('scratchOptIn: explicit unavailable returns local ownership', await game.evaluate(() => window.__audioFixture.legacyCalls), 2);
      report[scope + 'RequestsBeforeReload'] = requests.slice();
      await page.reload({ waitUntil: 'networkidle' });
      check('scratchOptIn: reload preserves mute without creating context', await page.evaluate(() => [window.__hostContextCreations, window.__toadalWebsiteAudioHost.pref.muted, window.__toadalWebsiteAudioHost.currentState()]), [0, true, 'muted']);
      game = page.frames().find(f => f.url().includes('/public/games/wicked-bites/'));
      await game.waitForFunction(() => window.__audioFixture?.audio.hostOwnsPlayback);
      await game.getByRole('button', { name: 'Emit semantic action' }).click();
      check('scratchOptIn: persisted mute suppresses local fallback', await game.evaluate(() => window.__audioFixture.legacyCalls), 0);
    }
    const measured = optIn ? report.scratchOptInRequestsBeforeReload : requests;
    const count = suffix => measured.filter(p => p.endsWith(suffix)).length;
    report[scope] = { loaderRequests: count('/website-audio-loader.mjs'), manifestRequests: count('/cartridge.json'), hostRequests: count('/website-audio-host.mjs'), registryRequests: count('/audio-registry.json'), errors, totalRequests: measured.length };
    check(scope + ': audio request counts', [report[scope].loaderRequests, report[scope].manifestRequests, report[scope].hostRequests, report[scope].registryRequests], optIn ? [1, 1, 1, 1] : [1, 1, 0, 0]);
    check(scope + ': browser errors', errors, []);
    await context.close();
  }
  report.status = 'PASS'; report.passed = report.checks.length; report.failed = 0;
} catch (error) { report.status = 'FAIL'; report.failed = 1; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, report: output, error: report.error }, null, 2));
}
