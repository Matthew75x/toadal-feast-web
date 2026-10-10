import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidenceDir, '../../..');
const base = 'http://127.0.0.1:8185/toadal-feast-web/';
const require = createRequire(import.meta.url);
const playwright = process.env.TOADAL_PLAYWRIGHT_ENTRY ||
  'C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(playwright);
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const screenshotDir = path.join(evidenceDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const result = {
  schema: 'toadal-feast.explorer-passport-browser-qa.v1', status: 'FAIL',
  observedDate: '2026-10-10', origin: base, checks: {}, screenshots: [],
  storageKeys: [], pageErrors: [], failures: [],
};
let browser;
const check = (name, passed, details = {}) => {
  result.checks[name] = { status: passed ? 'PASS' : 'FAIL', details };
  if (!passed) result.failures.push(name);
};
const waitFor = async (page, fn, message) => {
  try { await page.waitForFunction(fn, null, { timeout: 10000 }); return true; }
  catch (_) { result.failures.push(message); return false; }
};
const screenshot = async (page, name) => {
  const file = path.join(screenshotDir, name);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  result.screenshots.push({ path: path.relative(root, file).replaceAll(path.sep, '/'), sha256: sha256(file) });
};

try {
  browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--disable-background-networking', '--disable-extensions', '--no-first-run', '--no-default-browser-check'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => result.pageErrors.push(error.message));
  const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 20000 });
  if (!response || response.status() !== 200) throw new Error('Home did not return HTTP 200.');
  await page.locator('[data-home-explorer-passport]').waitFor({ state: 'visible', timeout: 10000 });
  const passport = page.locator('[data-home-explorer-passport]');
  await waitFor(page, () => document.querySelector('[data-home-explorer-passport]')?.getAttribute('data-home-passport-state') === 'available', 'Explorer Passport did not reach its safe browser-local state.');
  const initial = await passport.evaluate(node => ({
    summary: node.querySelector('[data-home-passport-summary]')?.textContent.trim(),
    activities: Array.from(node.querySelectorAll('[data-passport-activity]')).map(item => ({
      id: item.getAttribute('data-passport-activity'), state: item.getAttribute('data-passport-state'), text: item.textContent.trim(),
    })),
    link: node.querySelector('[data-home-passport-link]')?.getAttribute('href'),
    bounds: (() => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
  }));
  check('Existing exploration activities load without an invented balance', initial.activities.length === 3 && initial.activities.every(item => item.state === 'active') && /0 of 3/.test(initial.summary), initial);
  check('Passport links directly to the existing quest board', initial.link === '/toadal-feast-web/feast-pass/quests/', { href: initial.link });
  await screenshot(page, 'passport-home-desktop-initial.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot(page, 'passport-home-mobile-390.png');
  const mobile390 = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, passportWidth: document.querySelector('[data-home-explorer-passport]')?.getBoundingClientRect().width }));
  check('Passport fits a 390px phone without horizontal overflow', mobile390.documentWidth <= 390 && mobile390.passportWidth <= 390, mobile390);
  await page.setViewportSize({ width: 320, height: 720 });
  const mobile320 = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, passportWidth: document.querySelector('[data-home-explorer-passport]')?.getBoundingClientRect().width }));
  check('Passport fits a 320px phone without horizontal overflow', mobile320.documentWidth <= 320 && mobile320.passportWidth <= 320, mobile320);
  await screenshot(page, 'passport-home-mobile-320.png');

  await passport.locator('[data-home-passport-link]').click();
  await page.waitForURL(/\/feast-pass\/quests\/$/u, { timeout: 10000 });
  await page.locator('[data-quest-id="visit-world"] a').click();
  await page.waitForURL(/\/world\/$/u, { timeout: 10000 });
  await page.locator('.site-brand').click();
  await page.waitForURL(/\/toadal-feast-web\/$/u, { timeout: 10000 });
  await waitFor(page, () => document.querySelector('[data-passport-activity="visit-world"]')?.getAttribute('data-passport-state') === 'ready', 'Visiting World did not update the existing World quest on Home.');
  const readyState = await passport.evaluate(node => ({
    summary: node.querySelector('[data-home-passport-summary]')?.textContent.trim(),
    world: node.querySelector('[data-passport-activity="visit-world"]')?.textContent.trim(),
    linkText: node.querySelector('[data-home-passport-link]')?.textContent.trim(),
    link: node.querySelector('[data-home-passport-link]')?.getAttribute('href'),
  }));
  check('World visit updates the existing quest and surfaces its ready reward', /1 exploration reward is ready/.test(readyState.summary) && /Ready to claim · 1\/1/.test(readyState.world) && readyState.link === '/toadal-feast-web/feast-pass/quests/?view=ready', readyState);
  const innerBrand = await page.locator('.site-brand').evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, href: node.getAttribute('href') };
  });
  check('Inner-route Home anchor stays visible after compact-phone resizing', innerBrand.width >= 108 && innerBrand.height >= 44, innerBrand);
  await page.setViewportSize({ width: 1440, height: 900 });
  await screenshot(page, 'passport-home-desktop-reward-ready.png');

  await passport.locator('[data-home-passport-link]').click();
  await page.waitForURL(/\/feast-pass\/quests\/\?view=ready$/u, { timeout: 10000 });
  await page.locator('[data-quest-claim="visit-world"]').click();
  const status = page.locator('[data-progression-storage-status]').first();
  await page.waitForFunction(() => /Quest reward claimed in this browser\./u.test(document.querySelector('[data-progression-storage-status]')?.textContent || ''), null, { timeout: 10000 }).catch(() => {
    result.failures.push('Quest claim did not announce its existing reward feedback.');
  });
  const claimFeedback = await status.textContent();
  check('Existing quest claim provides explicit reward feedback', /Quest reward claimed in this browser\./u.test(claimFeedback || ''), { text: claimFeedback?.trim() || '' });
  await page.locator('.site-brand').click();
  await page.waitForURL(/\/toadal-feast-web\/$/u, { timeout: 10000 });
  await waitFor(page, () => document.querySelector('[data-passport-activity="visit-world"]')?.getAttribute('data-passport-state') === 'claimed', 'Claimed World activity did not remain visible in the Passport.');
  const claimedState = await passport.evaluate(node => ({
    summary: node.querySelector('[data-home-passport-summary]')?.textContent.trim(),
    world: node.querySelector('[data-passport-activity="visit-world"]')?.textContent.trim(),
  }));
  check('Passport reflects the existing claimed quest after returning Home', /1 of 3 exploration activities claimed/.test(claimedState.summary) && /Claimed · 1\/1/.test(claimedState.world), claimedState);
  result.storageKeys = await page.evaluate(() => Object.keys(localStorage).sort());
  check('Passport reuses existing progression storage without a new namespace', result.storageKeys.some(key => key === 'toadal:web:v1:quests') && !result.storageKeys.some(key => /passport/i.test(key)), { keys: result.storageKeys });
  check('Journey pages report no browser errors', result.pageErrors.length === 0, { pageErrors: result.pageErrors });
  result.status = result.failures.length ? 'FAIL' : 'PASS';
} catch (error) {
  result.failures.push(error.message);
  result.status = 'FAIL';
} finally {
  if (browser) await browser.close();
  const output = path.join(evidenceDir, 'browser-qa.json');
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') process.exitCode = 1;
}
