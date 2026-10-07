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
      check('nonOptIn: no shared comfort controls', await page.locator('[data-player-audio-settings]').count(), 0);
      check('nonOptIn: no shared host', await page.evaluate(() => !!window.__toadalWebsiteAudioHost), false);
      const game = page.frames().find(f => f.url().includes('/public/games/wicked-bites/'));
      await page.locator('[data-player-sound]').click();
      await game.waitForFunction(() => window.__legacyMuteMessages.includes('host:mute'));
      await page.locator('[data-player-sound]').click();
      await game.waitForFunction(() => window.__legacyMuteMessages.includes('host:unmute'));
      check('nonOptIn: original mute/unmute', await game.evaluate(() => window.__legacyMuteMessages), ['host:mute', 'host:unmute']);
    } else {
      await page.waitForFunction(() => !!window.__toadalWebsiteAudioHost);
      check('scratchOptIn: comfort defaults visible', await page.evaluate(() => {
        const group = document.querySelector('[data-player-audio-settings]');
        return [group.querySelector('input[type=range]').value, group.querySelector('input[type=checkbox]').checked, group.querySelector('output').textContent];
      }), ['25', true, '25%']);
      const volume = page.getByRole('slider', { name: 'Site sound volume' });
      await volume.fill('30'); await volume.focus(); await volume.press('ArrowRight');
      await page.getByRole('checkbox', { name: 'Gentler stereo' }).uncheck();
      check('scratchOptIn: controls before activation keep context dormant', await page.evaluate(() => [window.__hostContextCreations, window.__toadalWebsiteAudioHost.pref.master, window.__toadalWebsiteAudioHost.pref.gentleStereo]), [0, 0.31, false]);
      check('scratchOptIn: volume output updates accessibly', await volume.getAttribute('aria-valuetext'), '31%');
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
      check('scratchOptIn: comfort settings persisted in existing preference', await page.evaluate(() => [window.__toadalWebsiteAudioHost.pref.master, window.__toadalWebsiteAudioHost.pref.gentleStereo, document.querySelector('[data-player-audio-settings] input[type=range]').value]), [0.31, false, '31']);
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
  scratch = true;
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(origin + prefix + 'player/wicked-bites/', { waitUntil: 'networkidle' });
  const mobileLayout = await mobilePage.evaluate(() => {
    const group = document.querySelector('[data-player-audio-settings]');
    const box = group.getBoundingClientRect();
    return { withinViewport: box.left >= 0 && box.right <= innerWidth, gridColumn: getComputedStyle(group).gridColumn, labelsHaveTouchHeight: [...group.querySelectorAll('label')].every(el => el.getBoundingClientRect().height >= 44) };
  });
  check('mobileEmulation: opt-in controls fit viewport and span player grid', mobileLayout, { withinViewport: true, gridColumn: '1 / -1', labelsHaveTouchHeight: true });
  report.mobileEmulationOnly = true;
  report.mobileScreenshot = path.join(path.dirname(output), 'website-audio-comfort-mobile.png');
  await mobilePage.locator('.wo002-player-toolbar').screenshot({ path: report.mobileScreenshot });
  await mobileContext.close();
  // Actual browser digital renders; scratch PCM fixtures are not approved cues
  // and cannot establish acoustic sound pressure or headphone listening quality.
  const renderContext = await browser.newContext();
  const renderPage = await renderContext.newPage();
  await renderPage.goto(origin + prefix, { waitUntil: 'networkidle' });
  report.digitalRenders = await renderPage.evaluate(async ({ moduleUrl, declaration, registry }) => {
    const { WebsiteAudioHost } = await import(moduleUrl);
    const results = [];
    for (const scenario of [
      { name: 'sample-default', master: 0.25, voices: 1, sample: true },
      { name: 'sample-maximum', master: 1, voices: 1, sample: true },
      { name: 'dense-default', master: 0.25, voices: 16, sample: true },
      { name: 'dense-maximum', master: 1, voices: 16, sample: true },
      { name: 'tone-default', master: 0.25, voices: 1 },
      { name: 'zero-volume', master: 0, voices: 16, sample: true },
      { name: 'zero-intensity', master: 1, voices: 1, intensity: 0 }
    ]) {
      const offline = new OfflineAudioContext(2, 24000, 48000);
      const facade = new Proxy(offline, { get(target, key) {
        if (key === 'state') return 'running';
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      } });
      localStorage.setItem('toadal:web:v1:audio', JSON.stringify({ master: scenario.master }));
      const host = new WebsiteAudioHost({ shell: { ownerDocument: document, querySelector: () => null }, frame: { contentWindow: { postMessage() {} } }, gameId: 'scratch', declaration, registry, registryUrl: location.origin + '/registry.json', contextFactory: () => facade });
      await host.unlock();
      const sample = offline.createBuffer(1, 4800, 48000); sample.getChannelData(0).fill(0.7);
      host.loadSample = async () => sample;
      const cue = { bus: 'sfx', gain: 1, cooldownMs: 0, maxVoices: 1, voicePolicy: 'drop', fallback: { kind: 'tone', wave: 'sine', startHz: 440, endHz: 440, durationMs: 100 }, ...(scenario.sample ? { sample: {} } : {}) };
      for (let i = 0; i < scenario.voices; i++) await host.play({ cueId: 'digital-' + i, cue, params: { intensity: scenario.intensity ?? 1 } });
      const buffer = await offline.startRendering();
      let peak = 0, energy = 0, maxAdjacentStep = 0, firstNonzero = null, lastNonzero = null;
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const values = buffer.getChannelData(ch);
        for (let i = 0; i < values.length; i++) {
          const v = values[i]; peak = Math.max(peak, Math.abs(v)); energy += v * v;
          if (i) maxAdjacentStep = Math.max(maxAdjacentStep, Math.abs(v - values[i - 1]));
          if (Math.abs(v) > 1e-8) { firstNonzero = firstNonzero === null ? i : Math.min(firstNonzero, i); lastNonzero = Math.max(lastNonzero ?? 0, i); }
        }
      }
      results.push({ ...scenario, peak, rms: Math.sqrt(energy / (buffer.length * buffer.numberOfChannels)), maxAdjacentStep, firstNonzero, lastNonzero, plays: host.records.filter(r => r.type === 'play').length }); host.dispose();
    }
    return results;
  }, { moduleUrl: origin + prefix + 'assets/js/website-audio-host.mjs', declaration, registry });
  check('digitalRender: zero volume and zero intensity are exact silence', report.digitalRenders.filter(r => r.name.startsWith('zero-')).map(r => [r.peak, r.plays]), [[0, 0], [0, 0]]);
  check('digitalRender: default volume attenuates after compressor', Math.abs(report.digitalRenders[0].peak / report.digitalRenders[1].peak - 0.25) < 0.001, true);
  check('digitalRender: sampled edges are smooth in tested fixtures', report.digitalRenders.filter(r => r.sample).every(r => r.maxAdjacentStep < 0.01), true);
  check('digitalRender: tested maximum dense fixture stays below PCM full scale', report.digitalRenders.every(r => r.peak < 1), true);
  await renderContext.close();
  report.status = 'PASS'; report.passed = report.checks.length; report.failed = 0;
} catch (error) { report.status = 'FAIL'; report.failed = 1; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, report: output, error: report.error }, null, 2));
}
