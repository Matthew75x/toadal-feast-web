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
if (!reportDir) throw new Error('Usage: node scripts/pass-display-browser.mjs <REPORT_DIR> [--baseline]');
const baseline = process.argv.includes('--baseline');
fs.mkdirSync(reportDir, { recursive: true });
const require = createRequire(import.meta.url);
const { KEYS, PASS_DISPLAY_KEY } = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
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
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', timeout: 15000 });
  for (const width of [1280, 390, 320, 640]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const errors = [];
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const a = await context.newPage(); a.on('pageerror', e => errors.push(e.message));
    await a.goto(origin + prefix, { waitUntil: 'load' });
    const panel = a.locator('[data-pass-display]'), toggle = panel.locator('[data-pass-display-toggle]'), content = panel.locator('[data-pass-display-content]');
    const xp = () => panel.locator('[data-progression-stat="xp"]').innerText();
    await toggle.waitFor({ state: 'visible' }); assert.equal(await toggle.isEnabled(), true);
    await toggle.focus(); await a.keyboard.press('Enter');
    assert.equal(await content.isHidden(), true); assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await a.evaluate(key => localStorage.getItem(key), PASS_DISPLAY_KEY), 'hidden');
    await a.reload(); assert.equal(await content.isHidden(), true);
    await a.goto(origin + prefix + 'world/'); await a.goto(origin + prefix);
    assert.equal(await content.isHidden(), true);
    await toggle.focus(); await a.keyboard.press('Space'); assert.equal(await content.isVisible(), true);
    const b = await context.newPage(); await b.goto(origin + prefix + 'feast-pass/quests/');
    await b.getByRole('button', { name: /^Claim quest reward/ }).first().click();
    await a.waitForFunction(() => document.querySelector('[data-pass-display] [data-progression-stat="xp"]').textContent === '10');
    await toggle.click();
    await a.locator('[data-claim-daily]').first().click();
    const current = await a.evaluate(() => document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot().pass.xp);
    assert.equal(await xp(), String(current)); assert.ok(current > 10);
    await toggle.click(); assert.equal(await xp(), String(current));
    await b.goto(origin + prefix + 'settings/'); await b.locator('[data-clear-progression]').first().click();
    await a.waitForFunction(() => document.querySelector('[data-pass-display] [data-progression-stat="xp"]').textContent === '0');
    await b.evaluate(key => localStorage.setItem(key, 'hidden'), PASS_DISPLAY_KEY);
    await a.waitForFunction(() => document.querySelector('[data-pass-display-content]').hidden);
    await toggle.click();
    if (width === 640) await a.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await panel.scrollIntoViewIfNeeded();
    const geometry = await a.evaluate(() => {
      const p = document.querySelector('[data-pass-display]'), t = p.querySelector('[data-pass-display-toggle]');
      const r = t.getBoundingClientRect(), c = document.querySelector('.toadal-companion')?.getBoundingClientRect();
      return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, toggle: { x:r.x, y:r.y, width:r.width, height:r.height }, clipped: getComputedStyle(p).overflow, companionOverlap: c ? r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top : false };
    });
    assert.ok(geometry.toggle.height >= 44); assert.ok(geometry.toggle.x >= 0); assert.ok(geometry.toggle.x + geometry.toggle.width <= width + 1); assert.equal(geometry.clipped, 'visible');
    assert.equal(geometry.companionOverlap, false); assert.equal(errors.length, 0);
    await a.screenshot({ path: path.join(reportDir, `pass-${width}.png`), fullPage: false });
    cases.push({ name: `keyboard-navigation-claims-reset-cross-tab-layout-${width}`, status:'PASS', geometry });
    await context.close();
  }
  for (const mode of ['preference-write', 'preference-read', 'pass-read', 'invalid-preference']) {
    const context = await browser.newContext({ viewport: { width:390, height:844 }, serviceWorkers:'block' });
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await context.addInitScript(({ mode, preferenceKey, passKey }) => {
      if (mode === 'invalid-preference') localStorage.setItem(preferenceKey, 'garbled');
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function(key) { if (mode === 'preference-read' && key === preferenceKey || mode === 'pass-read' && key === passKey) throw Error('Controlled read failure'); return get.call(this, key); };
      Storage.prototype.setItem = function(key,value) { if (mode === 'preference-write' && key === preferenceKey) throw Error('Controlled write failure'); return set.call(this,key,value); };
    }, { mode, preferenceKey:PASS_DISPLAY_KEY, passKey:KEYS.pass });
    const page = await context.newPage(); await page.goto(origin + prefix);
    const panel = page.locator('[data-pass-display]');
    if (mode === 'pass-read') assert.equal(await panel.locator('[data-progression-stat="xp"]').innerText(), 'Unavailable');
    else {
      if (mode !== 'preference-write') assert.match(await panel.locator('[data-pass-display-preference-status]').innerText(), /temporary|unreadable/);
      await panel.locator('[data-pass-display-toggle]').click();
      assert.equal(await panel.locator('[data-pass-display-content]').isHidden(), true);
      if (mode !== 'invalid-preference') assert.match(await panel.locator('[data-pass-display-preference-status]').innerText(), /temporary/);
      await panel.locator('[data-pass-display-toggle]').click(); assert.equal(await panel.locator('[data-pass-display-content]').isVisible(), true);
    }
    cases.push({name:mode,status:'PASS'}); await context.close();
  }
  console.log(JSON.stringify({ status:'PASS', runtimeHash, cases },null,2));
  fs.writeFileSync(path.join(reportDir,'browser-results.json'), JSON.stringify({status:'PASS', runtimeHash, cases},null,2));
} catch (error) {
  fs.writeFileSync(path.join(reportDir,'browser-results.json'), JSON.stringify({status:'FAIL', runtimeHash,cases,error:String(error.stack)},null,2)); throw error;
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
