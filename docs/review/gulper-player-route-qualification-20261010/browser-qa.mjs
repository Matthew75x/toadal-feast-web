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
const screenshotsDir = path.join(evidenceDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const result = {
  schema: 'toadal-feast.gulper-player-browser-qa.v1',
  status: 'FAIL',
  observedDate: '2026-10-10',
  origin: base,
  checks: { desktop: 'FAIL', mobile: 'FAIL', navigation: 'FAIL', buildIdentity: 'FAIL', crownAbsence: 'FAIL', canonicalCharacterArtwork: 'FAIL' },
  details: {},
  screenshots: [],
};
const failures = [];
const check = (name, passed, detail) => {
  result.checks[name] = passed ? 'PASS' : 'FAIL';
  result.details[name] = detail;
  if (!passed) failures.push(name);
};
const screenshot = async (page, name) => {
  const file = path.join(screenshotsDir, name);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  result.screenshots.push({
    path: path.relative(root, file).replaceAll(path.sep, '/'),
    sha256: sha256(file),
  });
};
let browser;

try {
  browser = await chromium.launch({ headless: true, executablePath: chrome, args: ['--disable-background-networking', '--disable-extensions', '--no-first-run', '--no-default-browser-check'] });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const desktopErrors = [];
  const gameResponses = [];
  desktop.on('pageerror', error => desktopErrors.push(error.message));
  desktop.on('response', response => {
    if (response.url().includes('/public/games/claw-feed-gulper/index.html')) gameResponses.push(response.status());
  });

  let response = await desktop.goto(new URL('play/', base).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await desktop.locator('main').waitFor({ state: 'visible', timeout: 10000 });
  const playLinks = await desktop.locator('a[href]').evaluateAll(links => links
    .map(link => ({ href: link.getAttribute('href'), text: (link.innerText || link.textContent || '').trim() }))
    .filter(link => link.href?.endsWith('/games/claw-feed-gulper/')));
  if (!response || response.status() !== 200 || !playLinks.length) throw new Error('Desktop Play directory did not expose the Gulper details route.');
  await desktop.locator(`a[href="${playLinks[0].href}"]`).first().click();
  await desktop.waitForURL(/\/games\/claw-feed-gulper\/$/, { timeout: 10000 });
  const detailsLinks = await desktop.locator('a[href]').evaluateAll(links => links
    .map(link => ({ href: link.getAttribute('href'), text: (link.innerText || link.textContent || '').trim() }))
    .filter(link => link.href?.endsWith('/player/claw-feed-gulper/')));
  if (!detailsLinks.length) throw new Error('Gulper details do not expose the browser player route.');
  await desktop.locator(`a[href="${detailsLinks[0].href}"]`).first().click();
  await desktop.waitForURL(/\/player\/claw-feed-gulper\/$/, { timeout: 10000 });
  const frame = desktop.locator('iframe').first();
  await frame.waitFor({ state: 'visible', timeout: 10000 });
  await desktop.waitForTimeout(1200);
  const playerState = await desktop.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const rect = iframe?.getBoundingClientRect();
    return {
      title: document.title,
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      iframeSrc: iframe?.getAttribute('src') || '',
      sandbox: iframe?.getAttribute('sandbox') || '',
      iframeVisible: !!rect && rect.width > 0 && rect.height > 0,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      crownGlyphInShell: /[♕♛👑]/u.test(document.body.innerText),
      hrefBack: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).find(h => h?.endsWith('/games/claw-feed-gulper/')) || '',
    };
  });
  await screenshot(desktop, 'desktop-gulper-player.png');
  const gameFrame = desktop.frames().find(item => item.url().includes('/public/games/claw-feed-gulper/index.html'));
  let gameFrameState = null;
  if (gameFrame) {
    try {
      gameFrameState = await gameFrame.evaluate(() => ({
        title: document.title,
        ready: document.readyState,
        crownGlyphInGame: /[♕♛👑]/u.test(document.documentElement.outerHTML),
        buildTag: document.querySelector('.build-tag')?.textContent.trim() || '',
      }));
      await gameFrame.locator('#creditsBtn').click();
      await gameFrame.locator('#creditsDialog').waitFor({ state: 'visible', timeout: 3000 });
      gameFrameState.creditsBuild = (await gameFrame.locator('#creditsDialog .credit-list').innerText()).replace(/\s+/gu, ' ').trim();
      await gameFrame.locator('#creditsClose').click();
    } catch (error) { gameFrameState = { inspectionError: error.message }; }
  }
  check('buildIdentity', !!gameFrameState?.buildTag?.includes('v2.5.1') &&
    /Mastery Edition 2\.5\.1 · source 91f9b600b5d0/u.test(gameFrameState?.creditsBuild || ''), gameFrameState);
  const desktopPass = playerState.title.includes('CLAW: Feed Gulper') && playerState.robots.includes('noindex') &&
    playerState.iframeSrc.includes('/public/games/claw-feed-gulper/index.html') &&
    playerState.sandbox.includes('allow-scripts') && !playerState.sandbox.includes('allow-same-origin') &&
    playerState.iframeVisible && !playerState.horizontalOverflow && gameResponses.includes(200) && desktopErrors.length === 0;
  check('desktop', desktopPass, { route: new URL(desktop.url()).pathname, ...playerState, gameResponses, gameFrameState, pageErrors: desktopErrors });
  check('navigation', playerState.hrefBack.endsWith('/games/claw-feed-gulper/') && playLinks[0].href.endsWith('/games/claw-feed-gulper/') &&
    detailsLinks[0].href.endsWith('/player/claw-feed-gulper/'), { playToDetails: playLinks[0].href, detailsToPlayer: detailsLinks[0].href, playerBackToDetails: playerState.hrefBack });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobileErrors = [];
  mobile.on('pageerror', error => mobileErrors.push(error.message));
  response = await mobile.goto(new URL('player/claw-feed-gulper/', base).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await mobile.locator('iframe').first().waitFor({ state: 'visible', timeout: 10000 });
  await mobile.waitForTimeout(1000);
  const mobileState = await mobile.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const rect = iframe?.getBoundingClientRect();
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      iframeWidth: rect?.width || 0,
      iframeWithinViewport: !!rect && rect.left >= -1 && rect.right <= innerWidth + 1,
      title: document.title,
      iframeSrc: iframe?.getAttribute('src') || '',
      crownGlyphInShell: /[♕♛👑]/u.test(document.body.innerText),
    };
  });
  await screenshot(mobile, 'mobile-gulper-player-390.png');
  const compact = await browser.newPage({ viewport: { width: 320, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await compact.goto(new URL('player/claw-feed-gulper/', base).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await compact.locator('iframe').first().waitFor({ state: 'visible', timeout: 10000 });
  const compactState = await compact.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  check('mobile', !!response && response.status() === 200 && mobileState.iframeWithinViewport &&
    mobileState.documentWidth <= mobileState.viewport + 1 && compactState.documentWidth <= compactState.viewport + 1 &&
    !mobileState.crownGlyphInShell && mobileErrors.length === 0, { ...mobileState, compact: compactState, pageErrors: mobileErrors });

  const noCrownGlyphs = !playerState.crownGlyphInShell && !mobileState.crownGlyphInShell && !gameFrameState?.crownGlyphInGame;
  const standaloneCrownAssetAbsent = !fs.existsSync(path.join(root, 'dist', 'assets', 'brand', 'brand-crown.svg'));
  const gameSources = path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'public', 'games', 'claw-feed-gulper');
  const sourceFiles = [];
  const walk = directory => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) walk(file);
      else if (/\.(?:html|css|js|json|svg)$/iu.test(item.name)) sourceFiles.push(file);
    }
  };
  walk(gameSources);
  const glyphMatches = sourceFiles.filter(file => /[♕♛👑]/u.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(root, file).replaceAll(path.sep, '/'));
  check('crownAbsence', noCrownGlyphs && standaloneCrownAssetAbsent && glyphMatches.length === 0, {
    standaloneCrownAssetAbsent,
    crownGlyphInPlayerShell: playerState.crownGlyphInShell || mobileState.crownGlyphInShell,
    noCrownGlyphsInPlayerOrGame: noCrownGlyphs,
    GulperSourceGlyphMatches: glyphMatches,
    gameFrame: gameFrameState,
  });

  const character = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await character.goto(new URL('characters/toadal/', base).href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await character.locator('main').waitFor({ state: 'visible', timeout: 10000 });
  const characterImages = await character.locator('img').evaluateAll(images => images.map(image => ({
    src: image.currentSrc || image.src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
    alt: image.alt, visible: image.getClientRects().length > 0,
  })));
  const approvedImage = characterImages.find(image => /toadal-(?:victory|portrait)\.webp/u.test(image.src) && image.naturalWidth > 0 && image.visible);
  await screenshot(character, 'desktop-toadal-character-art.png');
  const artworkPath = approvedImage ? new URL(approvedImage.src).pathname.replace('/toadal-feast-web/', '') : '';
  const visualLock = JSON.parse(fs.readFileSync(path.join(root, 'manifests', 'visual-asset-authority-lock.json'), 'utf8'));
  const approvedRecord = visualLock.registeredAssetSnapshot.find(asset => asset.id === 'asset.home.character.toadal-victory-web');
  const sourceArtwork = approvedRecord ? path.join(root, 'studio-project', 'toadal-feast-website', approvedRecord.source) : '';
  const exportedArtwork = artworkPath ? path.join(root, 'dist', artworkPath) : '';
  const sourceArtworkSha = sourceArtwork && fs.existsSync(sourceArtwork) ? sha256(sourceArtwork) : '';
  const exportedArtworkSha = exportedArtwork && fs.existsSync(exportedArtwork) ? sha256(exportedArtwork) : '';
  check('canonicalCharacterArtwork', !!approvedImage && !!approvedRecord && !!sourceArtworkSha &&
    sourceArtworkSha === approvedRecord.sha256 && sourceArtworkSha === exportedArtworkSha, {
    selectedArtwork: approvedImage || null, authoritySource: approvedRecord?.source || null,
    authoritySha256: approvedRecord?.sha256 || '', sourceArtworkSha256: sourceArtworkSha, exportedArtworkSha256: exportedArtworkSha,
  });

  if (failures.length) result.failureNames = failures;
} catch (error) {
  result.error = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  result.status = failures.length || result.error ? 'FAIL' : 'PASS';
  const reportPath = path.join(evidenceDir, 'browser-qa.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (result.status !== 'PASS') process.exitCode = 1;
}
