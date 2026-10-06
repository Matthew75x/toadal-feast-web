#!/usr/bin/env node
// Isolated two-tab journeys through exported pages. No game or owner session.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDir = process.argv[2] && path.resolve(process.argv[2]);
if (!reportDir) throw new Error('Usage: node scripts/guest-progress-refresh-browser.mjs <REPORT_DIR> [--baseline]');
const baseline = process.argv.includes('--baseline');
fs.mkdirSync(reportDir, { recursive: true });
const require = createRequire(import.meta.url);
const { KEYS } = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const playwright = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || require.resolve('playwright-core')).href);
const { chromium } = playwright.default || playwright;
const dist = path.join(repo, 'dist'), prefix = '/toadal-feast-web/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runtimeHash = hash(fs.readFileSync(path.join(dist, 'assets/js/guest-progression.js')));
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
  for (const viewport of baseline ? [{ width: 1280, height: 800 }] : [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    const row = { name: baseline ? 'baseline-stale-open-view' : `two-tab-journey-${viewport.width}`, viewport, status: 'FAIL', checks: [] };
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 600, isMobile: viewport.width < 600, serviceWorkers: 'block' });
    const errors = [];
    try {
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await context.addInitScript(keys => {
        const local = window.localStorage, get = Storage.prototype.getItem, set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
        const control = window.__refreshTest = { denied: null, suppress: false, writes: 0 };
        window.addEventListener('storage', event => { if (control.suppress) event.stopImmediatePropagation(); });
        Storage.prototype.getItem = function (key) {
          if (this === local && control.denied === key) throw new DOMException('Controlled refresh read failure', 'SecurityError');
          return get.call(this, key);
        };
        Storage.prototype.setItem = function (key, value) { if (this === local && keys.includes(key)) control.writes++; return set.call(this, key, value); };
        Storage.prototype.removeItem = function (key) { if (this === local && keys.includes(key)) control.writes++; return remove.call(this, key); };
      }, Object.values(KEYS));
      const a = await context.newPage(), b = await context.newPage();
      for (const page of [a, b]) { page.setDefaultTimeout(7000); page.on('pageerror', error => errors.push(error.message)); }
      const load = async (page, route) => {
        const [runtimeResponse] = await Promise.all([
          page.waitForResponse(response => response.url() === origin + prefix + 'assets/js/guest-progression.js'),
          page.goto(origin + prefix + route, { waitUntil: 'load', timeout: 15_000 })
        ]);
        assert.equal(hash(await runtimeResponse.body()), runtimeHash);
      };
      const state = page => page.evaluate(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot());
      const xp = page => page.locator('[data-progression-stat="xp"]').first().innerText();
      const waitXP = (page, value) => page.waitForFunction(value => document.querySelector('[data-progression-stat="xp"]')?.textContent === String(value), value);
      await load(a, 'profile/');
      assert.equal(await xp(a), '0');
      const initialWrites = await a.evaluate(() => window.__refreshTest.writes);
      await load(b, 'world/');
      await load(b, 'feast-pass/quests/');
      await b.getByRole('button', { name: 'Claim quest reward', exact: true }).first().click();
      assert.equal((await state(b)).pass.xp, 10);
      if (baseline) {
        await a.waitForTimeout(500);
        row.observed = { savedXP: 10, openProfileXP: await xp(a) };
        assert.equal(row.observed.openProfileXP, '0');
        row.status = 'REPRODUCED';
        await a.screenshot({ path: path.join(reportDir, row.name + '.png') });
      } else {
        await waitXP(a, 10);
        row.checks.push('actual World visit + quest button updates already-open Profile to 10 XP');
        await a.screenshot({ path: path.join(reportDir, row.name + '-updated.png') });
        await b.evaluate(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.recordLocalScore({ gameId: 'wicked-bites', score: 120 }));
        await a.waitForFunction(() => document.querySelector('[data-progression-score-list]')?.textContent.includes('120'));
        row.checks.push('controlled local-score adapter input updates displayed personal best; no game is launched');
        await a.evaluate(() => { window.__refreshNode = document.querySelector('[data-progression-score-list]').firstChild; window.dispatchEvent(new Event('focus')); });
        assert.equal(await a.evaluate(() => window.__refreshNode === document.querySelector('[data-progression-score-list]').firstChild), true);
        row.checks.push('unchanged focus preserves existing list nodes');
        await load(b, 'profile/');
        await b.locator('[data-clear-progression]').first().click();
        await waitXP(a, 0);
        assert.deepEqual((await state(a)).localScores, {});
        assert.deepEqual(await a.evaluate(keys => keys.map(key => localStorage.getItem(key)), Object.values(KEYS)), [null, null, null, null]);
        row.checks.push('actual reset in tab B clears tab A display without recreating stored records');
        await a.screenshot({ path: path.join(reportDir, row.name + '-reset.png') });
        await a.evaluate(key => { window.__refreshTest.denied = key; }, KEYS.pass);
        await b.evaluate(() => { const store = document.querySelector('[data-progression-page]').__toadalProgressionStore; store.recordEvent('route:/world/'); store.claimQuest('visit-world'); });
        await a.waitForFunction(() => document.querySelector('[data-progression-storage-status]')?.textContent.includes('could not be fully refreshed'));
        assert.equal(await xp(a), '0', 'retain the known empty state instead of pretending the unreadable new record was read');
        assert.equal((await state(a)).storage.lastRefresh.ok, false);
        await a.locator('[data-progression-storage-status]').first().scrollIntoViewIfNeeded();
        await a.screenshot({ path: path.join(reportDir, row.name + '-read-warning.png') });
        await a.evaluate(() => { window.__refreshTest.denied = null; window.dispatchEvent(new Event('focus')); });
        await waitXP(a, 10);
        assert.equal((await state(a)).storage.lastRefresh.ok, true);
        row.checks.push('injected read failure is explicit; focus retry recovers actual 10 XP without writes');
        await a.evaluate(() => { window.__refreshTest.suppress = true; });
        await b.evaluate(() => { const store = document.querySelector('[data-progression-page]').__toadalProgressionStore; store.recordEvent('route:/stories/'); store.claimQuest('visit-stories'); });
        assert.equal((await state(b)).pass.xp, 20);
        assert.equal(await xp(a), '10');
        await a.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await waitXP(a, 20);
        row.checks.push('controlled persisted-pageshow handler reloads newer saved data; not an actual bfcache certification');
        await a.evaluate(() => { window.__refreshTest.suppress = false; });
        const passBytes = await b.evaluate(key => localStorage.getItem(key), KEYS.pass);
        const future = JSON.stringify({ schemaVersion: 99, xp: 9999, marker: 'preserved-future-record' });
        await b.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: KEYS.pass, raw: future });
        await a.waitForFunction(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot().storage.lastRefresh?.ok === false);
        assert.equal(await xp(a), '20');
        assert.equal(await b.evaluate(key => localStorage.getItem(key), KEYS.pass), future);
        await b.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: KEYS.pass, raw: passBytes });
        await a.waitForFunction(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot().storage.lastRefresh?.ok === true);
        row.checks.push('future record remains untouched and last-readable 20 XP remains explicitly limited until supported data returns');
        assert.equal(await a.evaluate(() => window.__refreshTest.writes), initialWrites);
        row.checks.push('receiving tab performed zero additional progression writes throughout the journey');
        assert.deepEqual(errors, []);
        row.status = 'PASS';
      }
      row.runtimeSha256 = runtimeHash;
      row.pageErrors = errors;
    } catch (error) { row.error = String(error.stack || error); }
    finally { await context.close(); }
    cases.push(row);
    console.log(row.name, row.status, row.error || '');
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
const expected = baseline ? 'REPRODUCED' : 'PASS';
const report = { schema: 'toadal.guest-progress-refresh-browser.v1', baseline, evidence: 'Actual exported pages in two same-origin Chromium tabs; local-score/read-failure/future-schema inputs and persisted-pageshow event are controlled fixtures. Phone sizes are emulation, not physical-device acceptance.', cases, passed: cases.filter(row => row.status === expected).length, total: cases.length };
fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, total: report.total }));
process.exitCode = report.passed === report.total ? 0 : 1;
