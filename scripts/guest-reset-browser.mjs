#!/usr/bin/env node
// Bounded browser fault injection against the actual exported Profile page.
// Never connects to an existing browser, account, or public game service.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/guest-reset-browser.mjs <REPORT_DIRECTORY>; optional PLAYWRIGHT_MODULE and CHROME_PATH environment variables');
const reportDir = path.resolve(output);
fs.mkdirSync(reportDir, { recursive: true });
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const pwPath = process.env.PLAYWRIGHT_MODULE || require.resolve('playwright-core');
const { chromium } = await import(pathToFileURL(pwPath).href);
const dist = path.join(repo, 'dist');
const prefix = '/toadal-feast-web/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedRuntimeHash = sha(fs.readFileSync(path.join(dist, 'assets/js/guest-progression.js')));
const seed = new Map();
const storage = { getItem: key => seed.get(key) ?? null, setItem: (key, value) => seed.set(key, value), removeItem: key => seed.delete(key) };
const store = runtime.createStore({ storage, definitions, now: () => new Date('2026-10-05T12:00:00.000Z') });
assert.equal(store.recordEvent('route:/world/'), true);
assert.equal(store.claimQuest('visit-world').ok, true);
assert.equal(store.recordLocalScore({ gameId: 'wicked-bites', score: 120 }).ok, true);
seed.set('unrelated:game:save', 'preserve-game');
seed.set('unrelated:companion:preference', 'preserve-preference');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!['GET', 'HEAD'].includes(request.method) || !url.pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    let file = path.resolve(dist, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file !== dist && !file.startsWith(dist + path.sep)) { response.writeHead(403).end(); return; }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const bytes = fs.readFileSync(file);
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
const cases = [];
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), timeout: 15_000 });
  for (const spec of [
    { name: 'denied-removal-desktop', width: 1280, height: 800, fault: 'remove' },
    { name: 'denied-removal-phone', width: 390, height: 844, fault: 'remove' },
    { name: 'silent-retained-profile', width: 390, height: 844, fault: 'noop' },
    { name: 'unreadable-reset-outcome', width: 390, height: 844, fault: 'read' },
    { name: 'memory-only-reset', width: 390, height: 844, fault: 'unavailable' },
    { name: 'successful-reset-narrow-phone', width: 320, height: 800, fault: null }
  ]) {
    const result = { name: spec.name, viewport: { width: spec.width, height: spec.height }, status: 'FAIL' };
    const context = await browser.newContext({ viewport: result.viewport, isMobile: spec.width < 600, hasTouch: spec.width < 600, serviceWorkers: 'block' });
    try {
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await context.addInitScript(({ entries, unavailable }) => {
        const local = window.localStorage;
        const get = Storage.prototype.getItem;
        const remove = Storage.prototype.removeItem;
        if (!sessionStorage.getItem('reset-fixture-seeded')) {
          for (const [key, value] of entries) local.setItem(key, value);
          sessionStorage.setItem('reset-fixture-seeded', 'true');
        }
        const control = window.__resetTest = { mode: null, key: null, originalGet: key => get.call(local, key) };
        Storage.prototype.removeItem = function (key) {
          if (this === local && key === control.key) {
            if (control.mode === 'remove') throw new DOMException('Injected delete denial', 'SecurityError');
            if (control.mode === 'noop') return;
          }
          return remove.call(this, key);
        };
        Storage.prototype.getItem = function (key) {
          if (this === local && key === control.key && control.mode === 'read') throw new DOMException('Injected read denial', 'SecurityError');
          return get.call(this, key);
        };
        if (unavailable) Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Injected storage policy denial', 'SecurityError'); } });
      }, { entries: [...seed], unavailable: spec.fault === 'unavailable' });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.setDefaultTimeout(6000);
      const runtimeResponse = page.waitForResponse(response => response.url() === origin + prefix + 'assets/js/guest-progression.js');
      await page.goto(origin + prefix + 'profile/', { waitUntil: 'load', timeout: 15_000 });
      assert.equal(sha(await (await runtimeResponse).body()), expectedRuntimeHash, 'browser must execute the tested exported runtime');
      await page.waitForFunction(() => !!document.querySelector('[data-progression-page]')?.__toadalProgressionStore);
      const getState = () => page.evaluate(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot());
      if (spec.fault !== 'unavailable') assert.equal((await getState()).pass.xp, 10);
      await page.evaluate(({ fault, pass, profile }) => { window.__resetTest.mode = fault; window.__resetTest.key = fault === 'noop' ? profile : pass; }, { fault: spec.fault, pass: runtime.KEYS.pass, profile: runtime.KEYS.profile });
      await page.locator('[data-clear-progression]').first().click();
      const status = page.locator('[data-progression-storage-status]').first();
      result.message = await status.innerText();
      const state = await getState();
      result.reset = state.storage.lastReset;
      if (spec.fault === 'unavailable') {
        assert.match(result.message, /temporary progress in this tab/i);
        assert.equal(state.storage.lastReset.scope, 'page-only');
        assert.equal(await page.evaluate(key => JSON.parse(window.__resetTest.originalGet(key)).xp, runtime.KEYS.pass), 10);
      } else if (spec.fault) {
        assert.equal(state.storage.lastReset.ok, false);
        assert.match(result.message, /could not be completed and verified/i);
        if (spec.fault === 'noop') assert.equal(state.localScores['wicked-bites'].best, 120);
        else assert.equal(state.pass.xp, 10);
      } else {
        assert.equal(state.storage.lastReset.ok, true);
        assert.match(result.message, /was cleared from this browser/i);
      }
      await status.scrollIntoViewIfNeeded();
      result.messageVisible = await status.isVisible();
      assert.equal(result.messageVisible, true);
      await page.screenshot({ path: path.join(reportDir, spec.name + '.png') });
      const foreign = await page.evaluate(() => [window.__resetTest.originalGet('unrelated:game:save'), window.__resetTest.originalGet('unrelated:companion:preference')]);
      assert.deepEqual(foreign, ['preserve-game', 'preserve-preference']);
      if (spec.fault !== 'unavailable') {
        await page.evaluate(() => { window.__resetTest.mode = null; });
        await page.locator('[data-clear-progression]').first().click();
        assert.equal((await getState()).storage.lastReset.ok, true);
        assert.match(await status.innerText(), /was cleared from this browser/i);
        for (const key of Object.values(runtime.KEYS)) assert.equal(await page.evaluate(key => window.__resetTest.originalGet(key), key), null);
        await page.reload({ waitUntil: 'load', timeout: 15_000 });
        await page.waitForFunction(() => !!document.querySelector('[data-progression-page]')?.__toadalProgressionStore);
        assert.equal((await getState()).pass.xp, 0);
        assert.deepEqual((await getState()).localScores, {});
        result.retryAndReload = 'PASS';
      }
      result.runtimeSha256 = expectedRuntimeHash;
      result.pageErrors = pageErrors;
      assert.deepEqual(pageErrors, [], 'no unexpected page exceptions');
      result.status = 'PASS';
    } catch (error) { result.error = String(error.stack || error); }
    finally { await context.close(); }
    cases.push(result);
    console.log(result.name, result.status, result.error || '');
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const report = { schema: 'toadal.guest-reset-browser.v1', evidence: 'desktop Chromium with injected storage failures; phone viewports are emulation, not physical devices', cases, passed: cases.filter(row => row.status === 'PASS').length, total: cases.length };
fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, total: report.total }));
process.exitCode = report.passed === report.total ? 0 : 1;
