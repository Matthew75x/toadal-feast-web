import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const serviceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = path.resolve(process.env.SHARE_REVIEW_OUTPUT || path.join(serviceRoot, 'evidence', 'browser'));
const reportRoot = artifactRoot;
const origin = process.env.SHARE_BROWSER_ORIGIN || 'http://127.0.0.1:8787';
await fs.mkdir(artifactRoot, { recursive: true });
await fs.mkdir(reportRoot, { recursive: true });
const checks = [];
const errors = [];
const cards = [];
const screenshots = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const apiConfig = await (await context.request.get(origin + '/api/config')).json();
assert.equal(apiConfig.creationEnabled, true, 'Qualification requires local link creation enabled.');
async function addHarness(page, { native = true, clipboardFails = false } = {}) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()); });
  await page.addInitScript(({ native, clipboardFails }) => {
    window.__shareCalls = [];
    window.__shareMode = 'success';
    window.__copiedLinks = [];
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: native ? data => {
      window.__shareCalls.push({ data, activation: navigator.userActivation.isActive });
      return window.__shareMode === 'cancel'
        ? Promise.reject(new DOMException('Closed by test user', 'AbortError'))
        : Promise.resolve();
    } : undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: text => {
        if (clipboardFails) return Promise.reject(new Error('Clipboard unavailable'));
        window.__copiedLinks.push(text);
        return Promise.resolve();
      }
    } });
  }, { native, clipboardFails });
}
async function ready(page) {
  await page.waitForFunction(() => document.getElementById('preview-state').textContent === 'Preview ready', { timeout: 25000 });
  assert.equal(await page.locator('#card-preview').evaluate(image => image.naturalWidth), 1200);
  assert.equal(await page.locator('#card-preview').evaluate(image => image.naturalHeight), 630);
}
async function screenshot(page, name) {
  const destination = path.join(artifactRoot, name);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: destination, fullPage: true });
  screenshots.push(destination);
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
}
async function prepare(page) {
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/shares') && response.request().method() === 'POST');
  await page.locator('#prepare').click();
  const response = await responsePromise;
  assert([200, 201].includes(response.status()), 'Create responded ' + response.status());
  const card = await response.json();
  cards.push(card);
  await page.waitForFunction(() => !document.getElementById('ready-panel').hidden && document.getElementById('share-url').value, { timeout: 10000 });
  assert.equal(await page.locator('#share-url').inputValue(), card.url);
  assert.equal(card.url.includes(card.manageToken), false, 'Removal token must not be in the public URL.');
  return card;
}
async function checkRemoved(card) {
  assert.equal((await context.request.get(card.url)).status(), 410);
  assert.equal((await context.request.get(card.imageUrl)).status(), 410);
  assert.equal((await context.request.head(card.imageUrl)).status(), 410);
}
try {
  const page = await context.newPage();
  await addHarness(page);
  await page.goto(origin, { waitUntil: 'networkidle' });
  await ready(page);
  assert.equal(await page.locator('input[name=kind]:checked').inputValue(), 'invite');
  assert.equal(await page.locator('#score-kind').isDisabled(), true);
  assert.equal(await page.locator('#alias-fields').isHidden(), true);
  assert.equal(await page.locator('#ready-panel').isHidden(), true);
  await noOverflow(page);
  await screenshot(page, 'share-composer-desktop-feast.png');
  checks.push('Desktop anonymous default, score availability, alias-off configuration, 1200x630 Feast preview, no horizontal overflow');

  const oldPreview = await page.locator('#card-preview').getAttribute('src');
  await page.locator('input[name=theme][value=astro]').check();
  await ready(page);
  assert.equal(await page.locator('body').getAttribute('data-theme'), 'astro');
  assert.notEqual(await page.locator('#card-preview').getAttribute('src'), oldPreview);
  await screenshot(page, 'share-composer-desktop-astro.png');
  const invite = await prepare(page);
  const inviteLanding = await context.request.get(invite.url);
  assert.equal(inviteLanding.status(), 200);
  const inviteHtml = await inviteLanding.text();
  assert.match(inviteHtml, /og:image/);
  assert.match(inviteHtml, /invited to the Feast/i);
  assert.match(inviteHtml, /Explore the games/);
  assert.equal((await context.request.get(invite.imageUrl)).status(), 200);
  await page.locator('#copy-link').click();
  assert.deepEqual(await page.evaluate(() => window.__copiedLinks), [invite.url]);
  await page.locator('#native-share').click();
  await page.waitForFunction(() => document.getElementById('share-status').textContent.includes('handed'));
  const nativeCall = (await page.evaluate(() => window.__shareCalls))[0];
  assert.equal(nativeCall.activation, true);
  assert.equal(nativeCall.data.url, invite.url);
  await page.evaluate(() => { window.__shareMode = 'cancel'; });
  await page.locator('#native-share').click();
  await page.waitForFunction(() => document.getElementById('share-status').textContent.includes('Share closed'));
  assert.equal(await page.locator('#share-url').inputValue(), invite.url);
  checks.push('Astro preview, durable invite/OG/image, copy payload, fresh-click native handoff, normal native cancellation');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-card').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'toadal-invite-card.png');
  assert.equal(await download.failure(), null);
  checks.push('Prepared card downloads the durable PNG without adding a removal credential');

  await page.getByText('Remove this public card', { exact: true }).click();
  await page.locator('#remove-card').click();
  await page.waitForFunction(() => document.getElementById('ready-title').textContent.includes('removed'));
  await checkRemoved(invite);
  assert.equal(await page.locator('#copy-link').isDisabled(), true);
  checks.push('UI revocation disables sharing; page/image GET and image HEAD return410');

  await page.locator('#game').selectOption('wicked-bites');
  await page.locator('input[name=kind][value=score]').check();
  await page.locator('#score').fill('0');
  await ready(page);
  assert.match(await page.locator('#source-note').textContent(), /Entered personal score/);
  assert.match(await page.locator('#score-help').textContent(), /does not read a game session/);
  const zero = await prepare(page);
  const zeroHtml = await (await context.request.get(zero.url)).text();
  assert.match(zeroHtml, /0 points/);
  assert.match(zeroHtml, /Personal, player-submitted score/);
  assert.doesNotMatch(zeroHtml, /Global rank #/);
  assert.match(zeroHtml, /Play Wicked Bites/);
  checks.push('Wicked Bites zero score accepted, explicit entered/personal claim, no fabricated global rank, fixed eligible CTA');

  await page.locator('#score').fill('999999999');
  await page.locator('input[name=theme][value=feast]').check();
  await ready(page);
  const large = await prepare(page);
  assert.notEqual(large.id, zero.id);
  const largeHtml = await (await context.request.get(large.url)).text();
  assert.match(largeHtml, /999,999,999 points/);
  assert.equal(await page.locator('#earlier-cards').isHidden(), false);
  await screenshot(page, 'share-composer-desktop-personal-score.png');
  await page.locator('#earlier-cards summary').click();
  await page.locator('#earlier-cards button').click();
  await page.waitForFunction(() => document.getElementById('earlier-cards').hidden);
  await checkRemoved(zero);
  checks.push('Maximum score render/preparation, immutable distinct snapshots, earlier-card removal access retained in tab memory');

  await page.locator('#score').fill('1000000000');
  assert.equal(await page.locator('#prepare').isDisabled(), true);
  await page.waitForFunction(() => document.getElementById('preview-error').textContent.includes('999,999,999'));
  await page.locator('#score').fill('-1');
  assert.equal(await page.locator('#prepare').isDisabled(), true);
  await page.locator('#game').selectOption('toadal-feast');
  await ready(page);
  assert.equal(await page.locator('input[name=kind]:checked').inputValue(), 'invite');
  assert.equal(await page.locator('#score-fields').isHidden(), true);
  checks.push('Out-of-range/negative scores prevented; switching to a non-score game restores invitation without stale score fields');

  // Remove the remaining created card through the visible composer.
  await page.locator('#remove-card').click();
  await page.waitForFunction(() => document.getElementById('ready-title').textContent.includes('removed'));
  await checkRemoved(large);

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await addHarness(mobile);
  await mobile.goto(origin, { waitUntil: 'networkidle' });
  await ready(mobile);
  await noOverflow(mobile);
  await screenshot(mobile, 'share-composer-mobile-feast.png');
  await mobile.locator('#game').selectOption('wicked-bites');
  await mobile.locator('input[name=kind][value=score]').check();
  await mobile.locator('#score').fill('999999999');
  await mobile.locator('input[name=theme][value=astro]').check();
  await ready(mobile);
  await noOverflow(mobile);
  await screenshot(mobile, 'share-composer-mobile-astro-score.png');
  checks.push('390px mobile Feast and Astro/maximum-score previews render without horizontal overflow');

  const fallback = await context.newPage();
  await addHarness(fallback, { native: false, clipboardFails: true });
  await fallback.goto(origin, { waitUntil: 'networkidle' });
  await ready(fallback);
  const fallbackCard = await prepare(fallback);
  assert.equal(await fallback.locator('#native-share').isHidden(), true);
  await fallback.locator('#copy-link').click();
  assert.equal(await fallback.locator('#share-url').evaluate(node => node.selectionEnd - node.selectionStart), fallbackCard.url.length);
  assert.match(await fallback.locator('#share-status').textContent(), /copy command/);
  checks.push('Missing native Share and denied clipboard use selectable manual-copy fallback');
  await fallback.getByText('Remove this public card', { exact: true }).click();
  await fallback.locator('#remove-card').click();
  await fallback.waitForFunction(() => document.getElementById('ready-title').textContent.includes('removed'));
  await checkRemoved(fallbackCard);

  const disabled = await context.newPage();
  await addHarness(disabled);
  await disabled.route('**/api/config', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ ...apiConfig, creationEnabled: false })
  }));
  await disabled.goto(origin, { waitUntil: 'networkidle' });
  await ready(disabled);
  assert.equal(await disabled.locator('#prepare').isDisabled(), true);
  assert.match(await disabled.locator('.prepare-help').textContent(), /not enabled yet/);
  checks.push('Creation-disabled configuration leaves real previews available and durable creation visibly disabled');

  const recovery = await context.newPage();
  await addHarness(recovery);
  await recovery.goto(origin, { waitUntil: 'networkidle' });
  await ready(recovery);
  const keys = [];
  await recovery.route('**/api/shares', route => {
    keys.push(route.request().headers()['idempotency-key']);
    return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Preparation failed.' }) });
  });
  await recovery.locator('#prepare').click();
  await recovery.waitForFunction(() => document.getElementById('form-error').textContent.includes('start a new'));
  await recovery.locator('#prepare').click();
  await recovery.waitForFunction(() => document.getElementById('form-error').textContent.includes('start a new'));
  assert.equal(keys.length, 2);
  assert.notEqual(keys[0], keys[1]);
  await recovery.unroute('**/api/shares');
  const pendingKeys = [];
  await recovery.route('**/api/shares', route => {
    pendingKeys.push(route.request().headers()['idempotency-key']);
    return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Preparing.' }) });
  });
  await recovery.locator('#prepare').click();
  await recovery.waitForFunction(() => document.getElementById('form-error').textContent.includes('same request'));
  await recovery.locator('#prepare').click();
  await recovery.waitForFunction(() => document.getElementById('form-error').textContent.includes('same request'));
  assert.equal(pendingKeys.length, 2);
  assert.equal(pendingKeys[0], pendingKeys[1]);
  checks.push('Known failed503 preparation uses a new key; pending409 retry preserves the same key');

  // Expected503/409 failed-resource console entries are classified, rather than hidden as real failures.
  const unexpected = errors.filter(message => !/Failed to load resource: the server responded with a status of (503|409)/.test(message));
  assert.deepEqual(unexpected, [], 'Unexpected browser/CSP/runtime errors');
  checks.push('No unexpected browser runtime or CSP console errors');

  const report = { status: 'PASS', origin, browser: 'Chromium (headless)', checks, screenshots,
    limitations: ['Native sharing and clipboard are browser stubs; no OS share sheet or recipient delivery was tested.',
      'Configuration-disabled and503/409 cases use route fixtures; other previews, creation, landing, image and revocation checks use the actual local service.',
      'No production URL or third-party platform preview was published or qualified.'],
    createdCards: cards.length, cleanup: 'All created local cards revoked; management tokens excluded from this report.',
    at: new Date().toISOString()
  };
  await fs.writeFile(path.join(reportRoot, 'composer-browser-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const report = { status: 'FAIL', message: error.stack || error.message, checks, errors, screenshots, at: new Date().toISOString() };
  await fs.writeFile(path.join(reportRoot, 'composer-browser-report.json'), JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  for (const card of cards) {
    try { await context.request.delete(origin + '/api/shares/' + encodeURIComponent(card.id), {
      headers: { Authorization: 'Bearer ' + card.manageToken, Origin: origin }
    }); } catch { /* The report contains no token or raw request bodies. */ }
  }
  await browser.close();
}
