#!/usr/bin/env node
// QA-only, read-only browser journey for the frozen Website PR #44 dist.
// Execute on a GitHub-hosted runner. This file is not a website payload.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const frozen = '96b237447e64499957d511df1ec4ab46dace1eca';
const expected = Object.freeze({
  distTree: '5474e58616611e4ad2354c4e402cddaadf6fb0dd',
  gameHtml: '783dfe877c931a6d142a1453eaddace6776d4852d4dae074a20b40975b47036c',
  gameBridge: '4f11aefb6aa0cb11c614c9a59de8c7cd753f6e5501cd269bb7f493097852ec8c',
  gameCartridge: '9487519b9e9d5b49e692b15f389e4d1c148d89e7a8508ff9e5ea511274847a03',
  scoreAdapter: 'd9a274eb32f3f08898c6fdbd677d6f2226f231f6dc8f05898b9fbda3b4a64c66',
  toadalArtwork: '2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb',
  headerArtwork: 'bb2a000f8aa492015c077b280671e1b9a405c6bc47b3aaba9d8b6d30e756d32d',
});

const repo = path.resolve(process.env.TOADAL_QA_REPO || process.cwd());
const output = path.resolve(process.env.TOADAL_QA_OUTPUT || path.join(os.tmpdir(), 'toadal-hosted-gameplay-closeout'));
const base = process.env.TOADAL_QA_BASE;
const genuineOnly = process.env.TOADAL_QA_GENUINE_ONLY === '1';
assert.ok(base, 'TOADAL_QA_BASE is required; run against the frozen dist on the GitHub-hosted runner');
const baseUrl = new URL(base);
assert.equal(baseUrl.pathname, '/toadal-feast-web/', 'Unexpected website base path');
assert.match(baseUrl.protocol, /^https?:$/, 'Website QA base must be HTTP(S)');
assert.ok(process.env.CHROME_PATH, 'CHROME_PATH is required');
assert.ok(process.env.PLAYWRIGHT_MODULE, 'PLAYWRIGHT_MODULE is required');
fs.mkdirSync(output, {recursive: true});

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fileSha = relative => sha(fs.readFileSync(path.join(repo, relative)));
const git = (...args) => execFileSync('git', args, {cwd: repo, encoding: 'utf8'}).trim();
function fingerprint(relative) {
  const root = path.join(repo, relative);
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(root, absolute).replaceAll('\\', '/'));
    }
  }
  visit(root);
  files.sort();
  return {files: files.length, sha256: sha(files.map(name => `${name}\0${sha(fs.readFileSync(path.join(root, name)))}\n`).join(''))};
}
function assertSourceBoundary() {
  for (const tree of ['dist', 'studio-project/toadal-feast-website', 'manifests', 'scripts']) {
    assert.equal(git('rev-parse', `HEAD:${tree}`), git('rev-parse', `${frozen}:${tree}`), `${tree} differs from the frozen PR #44 head`);
    assert.equal(git('status', '--porcelain', '--', tree), '', `${tree} has uncommitted changes`);
  }
  assert.equal(git('rev-parse', 'HEAD:dist'), expected.distTree);
  assert.equal(fs.existsSync(path.join(repo, 'dist/public/games/claw-feed-gulper/index.html')), false, 'CLAW payload must remain unadmitted');
  for (const [relative, pin] of [
    ['dist/public/games/wicked-bites/index.html', expected.gameHtml],
    ['dist/public/games/wicked-bites/toadal-bridge.js', expected.gameBridge],
    ['dist/public/games/wicked-bites/cartridge.json', expected.gameCartridge],
    ['dist/assets/js/website-score-adapter.js', expected.scoreAdapter],
    ['dist/assets/images/characters/toadal-victory.webp', expected.toadalArtwork],
    ['studio-project/toadal-feast-website/reference/assets/images/characters/toadal-victory.webp', expected.toadalArtwork],
    ['dist/assets/studio/brand-asset-import-owner-approved-transparent-toadal-games-header-bb2a000f.bb2a000f8a.png', expected.headerArtwork],
  ]) assert.equal(fileSha(relative), pin, `${relative} SHA-256 mismatch`);
}

const report = {
  schema: 'toadal.pr44.hosted-gameplay-closeout.v1',
  frozenHead: frozen,
  observedAtUtc: new Date().toISOString(),
  base,
  mode: genuineOnly ? 'GENUINE_ONLY' : 'GENUINE_AND_BOUNDED_SUPPLEMENT',
  scope: 'Fresh browser contexts and ordinary UI links, keyboard or Chromium touch input. No score fixture, game-state mutation, reward injection, payload edits, release, or physical-device claim.',
  expected,
  qaBranchHead: git('rev-parse', 'HEAD'),
  qualificationSupplement: {
    navigation: {},
    heldRoute: {},
    crownAbsence: {samples: []},
    canonicalCharacterArtwork: {},
  },
  cases: [],
  status: 'RUNNING',
};
if (genuineOnly) report.reusedSupplement = {
  runId: 38109235044,
  qaBranchHead: '8d58d7c74e8bceb3bd47b6ab2d3e31bb97d643f8',
  frozenProductHead: frozen,
  caseName: 'bounded-supplement-1440',
  caseStatus: 'PASS',
  note: 'This run does not repeat the prior hosted held-route/artwork supplement. The earlier run failed its genuine journeys; only its independently passing bounded supplement may be considered with its own custody receipt.',
};
function save() { fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n'); }
let browser;
let status = 'FAIL';
try {
  assertSourceBoundary();
  report.distFingerprintBefore = fingerprint('dist');
  const moduleSpec = process.env.PLAYWRIGHT_MODULE.startsWith('file:')
    ? process.env.PLAYWRIGHT_MODULE
    : pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE)).href;
  const {chromium} = await import(moduleSpec);
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage']});
  report.chromeVersion = browser.version();

  async function makeCase(name, viewport) {
    const mobile = viewport.width < 600;
    const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    const row = {name, viewport, status: 'RUNNING', checks: [], errors: [], screenshots: [], observedMessages: [], served: {}};
    const resourceTasks = [];
    page.on('pageerror', error => row.errors.push(error.message));
    page.on('response', response => {
      const route = new URL(response.url()).pathname;
      if (![
        '/toadal-feast-web/public/games/wicked-bites/index.html',
        '/toadal-feast-web/public/games/wicked-bites/toadal-bridge.js',
        '/toadal-feast-web/assets/js/website-score-adapter.js',
        '/toadal-feast-web/assets/images/characters/toadal-victory.webp',
        '/toadal-feast-web/assets/studio/brand-asset-import-owner-approved-transparent-toadal-games-header-bb2a000f.bb2a000f8a.png',
      ].includes(route)) return;
      resourceTasks.push(response.body()
        .then(bytes => { row.served[route] = {status: response.status(), sha256: sha(bytes)}; })
        .catch(error => { row.errors.push(`Could not read served resource ${route}: ${String(error)}`); }));
    });
    await context.addInitScript(() => {
      window.__observedGameMessages = [];
      addEventListener('message', event => {
        if (event.data?.protocol === 'toadal.game.v1') {
          window.__observedGameMessages.push({origin: event.origin, type: event.data.type, gameId: event.data.gameId, payload: event.data.payload});
        }
      });
    });
    const shot = async label => {
      const filename = `${name}-${label}.png`;
      await page.screenshot({path: path.join(output, filename)});
      row.screenshots.push({filename, sha256: sha(fs.readFileSync(path.join(output, filename)))});
    };
    const click = async locator => {
      await locator.scrollIntoViewIfNeeded();
      if (mobile) await locator.tap(); else await locator.click();
    };
    const headerLink = async label => {
      if (mobile) await click(page.locator('.nav-toggle'));
      await click(page.locator('.site-links a').filter({hasText: new RegExp(`^${label}$`)}));
    };
    const progress = () => page.evaluate(() => document.querySelector('[data-progression-page]')?.__toadalProgressionStore?.getSnapshot());
    const crownAbsent = async route => {
      const hasCrown = await page.evaluate(() => document.body.innerText.includes('👑'));
      row.checks.push({check: 'body-crown-glyph-absent', route, hasCrown});
      report.qualificationSupplement.crownAbsence.samples.push({case: name, route, crownGlyph: hasCrown});
      assert.equal(hasCrown, false, `${route} shows an obsolete crown glyph`);
    };
    return {context, page, row, resourceTasks, shot, click, headerLink, progress, crownAbsent};
  }

  async function genuineJourney(viewport) {
    const mobile = viewport.width < 600;
    const q = await makeCase(`genuine-${viewport.width}`, viewport);
    const {context, page, row, resourceTasks, shot, click, headerLink, progress, crownAbsent} = q;
    try {
      const home = await page.goto(base, {waitUntil: 'load'});
      assert.equal(home.status(), 200);
      assert.equal(sha(await home.body()), fileSha('dist/index.html'));
      await crownAbsent('home');
      await shot('home');
      await headerLink('Play');
      await page.waitForURL('**/play/');
      report.qualificationSupplement.navigation.homeToPlay = 'PASS';
      await crownAbsent('play');
      await click(page.locator('a[href$="/games/wicked-bites/"]').filter({hasText: /View game details/}));
      await page.waitForURL('**/games/wicked-bites/');
      report.qualificationSupplement.navigation.playToWickedDetails = 'PASS';
      await crownAbsent('wicked-details');
      await click(page.locator('a[href$="/player/wicked-bites/"]').first());
      await page.waitForURL('**/player/wicked-bites/');
      await crownAbsent('wicked-player');
      row.checks.push({check: 'real-link-navigation', path: ['home', 'play', 'wicked-details', 'wicked-player']});

      const frameLocator = page.frameLocator('[data-player-frame]');
      await frameLocator.locator('#wbLoading').waitFor({state: 'hidden'});
      await page.waitForFunction(() => document.querySelector('[data-player-status]')?.textContent.startsWith('Preview ready'));
      const frame = page.frames().find(item => item.url().includes('/public/games/wicked-bites/'));
      assert.ok(frame, 'Admitted Wicked Bites iframe missing');
      await page.locator('[data-player-frame]').scrollIntoViewIfNeeded();
      await click(frame.locator('#wbPlay'));
      await frame.locator('#wbStart').waitFor({state: 'hidden'});
      await page.waitForFunction(() => window.__observedGameMessages.some(message =>
        message.origin === 'null' && message.gameId === 'wicked-bites' && message.type === 'game:started'));
      row.checks.push({check: 'genuine-game-started-before-input', status: 'observed'});
      if (mobile) {
        const cdp = await context.newCDPSession(page);
        try {
          const box = await frame.locator('#wbCanvas').boundingBox();
          assert.ok(box && box.width > 0 && box.height > 0);
          const start = {x: box.x + box.width / 2, y: box.y + box.height * .75};
          await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [start]});
          await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: start.x, y: start.y - 100}]});
          await frame.waitForFunction(() => Number(document.querySelector('#wbScore').textContent.replace(/[^0-9]/g, '')) > 0, null, {timeout: 20000});
          await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
        } finally { await cdp.detach(); }
        row.input = 'Chromium touchStart/touchMove/touchEnd on the visible cartridge canvas';
      } else {
        await frame.locator('#wbCanvas').click();
        await page.keyboard.down('ArrowUp');
        try {
          await frame.waitForFunction(() => Number(document.querySelector('#wbScore').textContent.replace(/[^0-9]/g, '')) > 0, null, {timeout: 20000});
        } finally { await page.keyboard.up('ArrowUp'); }
        row.input = 'ArrowUp on the focused cartridge canvas';
      }
      row.earnedScore = Number((await frame.locator('#wbScore').textContent()).replace(/[^0-9]/g, ''));
      assert.ok(row.earnedScore > 0);
      await shot('positive-gameplay');
      await click(page.locator('[data-player-pause]'));
      await frame.locator('#wbPauseOverlay').waitFor({state: 'visible'});
      await shot('paused');
      await click(page.locator('[data-player-resume]'));
      await frame.locator('#wbPauseOverlay').waitFor({state: 'hidden'});
      await click(page.locator('[data-player-pause]'));
      await frame.locator('#wbPauseOverlay').waitFor({state: 'visible'});
      await click(frame.locator('#wbBank'));
      await frame.locator('#wbConfirmOverlay').waitFor({state: 'visible'});
      await click(frame.locator('#wbConfirmYes'));
      await frame.locator('#wbResult').waitFor({state: 'visible'});
      await page.waitForFunction(() => document.querySelector('[data-score-session-status]')?.textContent.includes('Completed score saved'));
      row.completedScore = Number((await frame.locator('#wbScore').textContent()).replace(/[^0-9]/g, ''));
      assert.ok(row.completedScore > 0);
      row.observedMessages = await page.evaluate(() => window.__observedGameMessages);
      assert.ok(row.observedMessages.some(message => message.origin === 'null' && message.gameId === 'wicked-bites' && message.type === 'game:complete' && Number(message.payload.score.replace(/[^0-9]/g, '')) === row.completedScore), 'Matching genuine game:complete was not observed');
      const saved = await progress();
      assert.equal(saved.localScores['wicked-bites'].best, row.completedScore);
      assert.equal(saved.pass.xp, 0);
      assert.equal(saved.pass.sparks, 0);
      row.savedResult = saved.localScores['wicked-bites'];
      row.checks.push({check: 'positive-completion-local-save-separate-from-pass', score: row.completedScore, xp: saved.pass.xp, sparks: saved.pass.sparks});
      await shot('saved-result');

      await click(page.locator('[data-player-fullscreen]'));
      await page.waitForFunction(() => Boolean(document.fullscreenElement));
      await page.locator('[data-player-fullscreen-exit]').waitFor({state: 'visible'});
      await shot('fullscreen');
      await click(page.locator('[data-player-fullscreen-exit]'));
      await page.waitForFunction(() => !document.fullscreenElement);
      row.checks.push({check: 'pause-resume-fullscreen-exit', status: 'observed'});
      await click(page.locator('[data-player-exit]'));
      await page.waitForURL('**/games/wicked-bites/');
      await headerLink('Feast Pass');
      await page.waitForURL('**/feast-pass/');
      await crownAbsent('feast-pass');
      const card = page.locator('[data-game-record="wicked-bites"]');
      await card.waitFor();
      assert.equal(await card.getAttribute('data-game-record-state'), 'recorded');
      assert.equal(Number((await card.locator('[data-game-record-field="best"]').textContent()).replace(/[^0-9]/g, '')), row.completedScore);
      await card.scrollIntoViewIfNeeded();
      await shot('feast-pass-result');
      await page.reload({waitUntil: 'load'});
      assert.equal(Number((await card.locator('[data-game-record-field="best"]').textContent()).replace(/[^0-9]/g, '')), row.completedScore);
      const reloaded = await progress();
      assert.equal(reloaded.localScores['wicked-bites'].best, row.completedScore);
      assert.equal(reloaded.pass.xp, 0);
      assert.equal(reloaded.pass.sparks, 0);
      row.checks.push({check: 'feast-pass-full-reload', score: row.completedScore, xp: reloaded.pass.xp, sparks: reloaded.pass.sparks});

      if (!mobile) {
        await click(page.locator('[data-quest-next-link]'));
        await page.waitForURL('**/world/');
        await click(page.locator('.site-footer-links a').filter({hasText: /^Quests$/}));
        await page.waitForURL('**/feast-pass/quests/');
        const world = page.locator('[data-quest-id="visit-world"]');
        assert.equal(await world.getAttribute('data-quest-state'), 'ready');
        await click(world.getByRole('button', {name: 'Claim quest reward: Explore the World', exact: true}));
        const quest = await progress();
        assert.equal(quest.localScores['wicked-bites'].best, row.completedScore);
        assert.equal(quest.pass.xp, 10);
        assert.equal(quest.pass.sparks, 1);
        row.checks.push({check: 'explicit-world-quest-only', score: row.completedScore, xp: quest.pass.xp, sparks: quest.pass.sparks});
        await click(page.locator('.site-footer-links a').filter({hasText: /^Rewards$/}));
        await page.waitForURL('**/feast-pass/rewards/');
        const reward = page.locator('[data-progression-reward-list] [role="listitem"]')
          .filter({hasText: 'First Feast'})
          .getByRole('button', {name: 'Claim locally', exact: true});
        await click(reward);
        assert.ok((await progress()).pass.badges.includes('first-feast'));
        await page.reload({waitUntil: 'load'});
        const afterBadgeReload = await progress();
        assert.ok(afterBadgeReload.pass.badges.includes('first-feast'));
        assert.equal(afterBadgeReload.localScores['wicked-bites'].best, row.completedScore);
        assert.equal(afterBadgeReload.pass.xp, 10);
        assert.equal(afterBadgeReload.pass.sparks, 1);
        row.checks.push({check: 'first-feast-explicit-claim-reload', badge: 'first-feast', score: row.completedScore});
        await shot('badge-claimed');
      }
      await Promise.all(resourceTasks);
      for (const [route, pin] of [
        ['/toadal-feast-web/public/games/wicked-bites/index.html', expected.gameHtml],
        ['/toadal-feast-web/public/games/wicked-bites/toadal-bridge.js', expected.gameBridge],
        ['/toadal-feast-web/assets/js/website-score-adapter.js', expected.scoreAdapter],
        ['/toadal-feast-web/assets/studio/brand-asset-import-owner-approved-transparent-toadal-games-header-bb2a000f.bb2a000f8a.png', expected.headerArtwork],
      ]) {
        assert.equal(row.served[route]?.status, 200, `${route} did not load in the browser`);
        assert.equal(row.served[route]?.sha256, pin, `${route} served SHA mismatch`);
      }
      assert.deepEqual(row.errors, []);
      row.status = 'PASS';
    } catch (error) {
      row.status = 'FAIL';
      row.error = String(error.stack || error);
      row.observedMessages = await page.evaluate(() => window.__observedGameMessages || []).catch(() => []);
      await shot('failure').catch(() => {});
    } finally {
      await Promise.allSettled(resourceTasks);
      await context.close();
      report.cases.push(row);
      save();
    }
  }

  async function boundedSupplement() {
    const q = await makeCase('bounded-supplement-1440', {width: 1440, height: 900});
    const {context, page, row, resourceTasks, shot, click, crownAbsent} = q;
    const clawRequests = [];
    page.on('request', request => { if (request.url().includes('/public/games/claw-feed-gulper/')) clawRequests.push(request.url()); });
    try {
      const held = await page.goto(base + 'player/claw-feed-gulper/', {waitUntil: 'load'});
      assert.equal(held.status(), 200);
      assert.equal(sha(await held.body()), fileSha('dist/player/claw-feed-gulper/index.html'));
      await crownAbsent('claw-held');
      assert.equal(await page.locator('iframe').count(), 0);
      assert.match(await page.locator('main').innerText(), /Browser play is not available yet/);
      assert.deepEqual(clawRequests, []);
      await shot('held-player');
      await click(page.locator('main a[href$="/games/claw-feed-gulper/"]').first());
      await page.waitForURL('**/games/claw-feed-gulper/');
      report.qualificationSupplement.navigation.heldBackToDetails = 'PASS';
      await crownAbsent('claw-details');
      assert.equal(await page.locator('a[href$="/player/claw-feed-gulper/"]').count(), 0);
      assert.deepEqual(clawRequests, []);
      report.qualificationSupplement.heldRoute = {iframeCount: 0, unadmittedRequests: [...clawRequests], backNavigation: 'PASS'};
      row.checks.push({check: 'held-player-back-link', destination: page.url(), iframeCount: 0, clawPayloadRequestCount: clawRequests.length});
      await page.goto(base + 'characters/toadal/', {waitUntil: 'load'});
      await crownAbsent('toadal-profile');
      const art = await page.locator('main img').evaluateAll(images => images.map(image => {
        const rect = image.getBoundingClientRect();
        return {src: image.currentSrc || image.src, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight, visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight};
      }));
      await Promise.all(resourceTasks);
      const artRoute = '/toadal-feast-web/assets/images/characters/toadal-victory.webp';
      assert.ok(art.some(image => image.visible && image.width > 0 && new URL(image.src).pathname === artRoute), 'Canonical Toadal image is not visibly loaded');
      assert.equal(row.served[artRoute]?.status, 200);
      assert.equal(row.served[artRoute]?.sha256, expected.toadalArtwork);
      assert.equal(row.served['/toadal-feast-web/assets/studio/brand-asset-import-owner-approved-transparent-toadal-games-header-bb2a000f.bb2a000f8a.png']?.sha256, expected.headerArtwork);
      row.checks.push({check: 'canonical-toadal-visible-served-source-export-match', images: art, servedSha256: row.served[artRoute].sha256});
      report.qualificationSupplement.canonicalCharacterArtwork = {
        authoritySha256: fileSha('studio-project/toadal-feast-website/reference/assets/images/characters/toadal-victory.webp'),
        exportedSha256: fileSha('dist/assets/images/characters/toadal-victory.webp'),
        images: art.map(image => ({...image, servedSha256: new URL(image.src).pathname === artRoute ? row.served[artRoute].sha256 : row.served[new URL(image.src).pathname]?.sha256 || null})),
      };
      await shot('toadal-artwork');
      assert.deepEqual(row.errors, []);
      row.status = 'PASS';
    } catch (error) {
      row.status = 'FAIL';
      row.error = String(error.stack || error);
      await shot('failure').catch(() => {});
    } finally {
      await Promise.allSettled(resourceTasks);
      await context.close();
      report.cases.push(row);
      save();
    }
  }

  await genuineJourney({width: 1440, height: 900});
  await genuineJourney({width: 390, height: 844});
  if (!genuineOnly) await boundedSupplement();
  assert.ok(report.cases.every(item => item.status === 'PASS'), 'One or more exact-head hosted browser cases failed');
  status = 'PASS';
} catch (error) {
  report.error = String(error.stack || error);
} finally {
  await browser?.close();
  report.distFingerprintAfter = fingerprint('dist');
  report.distUnchanged = JSON.stringify(report.distFingerprintBefore) === JSON.stringify(report.distFingerprintAfter);
  try { assertSourceBoundary(); } catch (error) { report.sourceBoundaryError = String(error.stack || error); }
  report.status = status === 'PASS' && report.distUnchanged && !report.sourceBoundaryError ? 'PASS' : 'FAIL';
  save();
  console.log(`HOSTED_GAMEPLAY_CLOSEOUT ${report.status} ${report.cases.map(item => `${item.name}:${item.status}`).join(' ')}`);
  if (report.error) console.error(report.error);
  if (report.sourceBoundaryError) console.error(report.sourceBoundaryError);
  process.exitCode = report.status === 'PASS' ? 0 : 1;
}
