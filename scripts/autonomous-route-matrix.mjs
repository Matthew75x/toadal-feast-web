#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.resolve('D:/TOADAL_BACKUPS/studio-v51-source-admission-20261003/studio/docs/v51/runtime');
const runtimeTemp = path.join(runtimeRoot, 'autonomous-route-matrix-temp');
const defaultTargetURL = 'http://127.0.0.1:4381/';
const supplemental = [
  { route: '/play/', width: 320, height: 800, label: 'small-mobile-play' },
  { route: '/', width: 430, height: 932, label: 'large-mobile-home' }
];
const screenshotRoutes = new Set([
  '/', '/404.html', '/play/', '/world/', '/characters/', '/stories/', '/search/', '/app/',
  '/news/', '/support/', '/media/', '/about/', '/feast-pass/', '/feast-pass/quests/',
  '/feast-pass/rewards/', '/profile/'
]);

function usage() {
  return `Usage: node scripts/autonomous-route-matrix.mjs --out-dir <D-runtime-dir> --report <D-runtime-file> [--target-url <URL>]
Default target: ${defaultTargetURL}
All screenshots, reports, and browser temporary files must remain under ${runtimeRoot}.`;
}

function parseArgs(argv) {
  const values = { targetURL: defaultTargetURL, outDir: null, report: null };
  for (let i = 0; i < argv.length; i++) {
    const key = ({ '--target-url': 'targetURL', '--targetURL': 'targetURL', '--out-dir': 'outDir', '--report': 'report' })[argv[i]];
    if (!key || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Invalid or incomplete argument: ${argv[i]}\n${usage()}`);
    values[key] = argv[++i];
  }
  if (!values.outDir || !values.report) throw new Error(`Both --out-dir and --report are required.\n${usage()}`);
  return values;
}

function isWithin(parent, target) {
  const relative = path.relative(parent, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function normalizeBaseURL(raw) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported target URL scheme: ${url.protocol}`);
  if (url.username || url.password || url.search || url.hash) throw new Error('Target URL must not contain credentials, query, or fragment.');
  if (url.port === '4370') throw new Error('Port 4370 is the frozen qualified preview.');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

const routeURL = (base, route) => new URL(route.replace(/^\/+/, ''), base).href;
const slug = route => route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

async function inspectDocument(page) {
  return page.evaluate(async () => {
    const text = el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const accessibleName = el => {
      const labelled = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
        .map(id => document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();
      const labels = el.labels ? [...el.labels].map(text).filter(Boolean).join(' ').trim() : '';
      const alt = el.getAttribute('alt') || [...el.querySelectorAll('img[alt]')].map(image => image.alt).filter(Boolean).join(' ');
      return (labelled || el.getAttribute('aria-label') || labels || el.getAttribute('title') || text(el) || alt).trim();
    };
    const visible = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return !el.disabled && !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' &&
        Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    };
    const visibleInLayout = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return !el.closest('[hidden]') && s.display !== 'none' && s.visibility !== 'hidden' &&
        Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0 &&
        (typeof el.checkVisibility !== 'function' || el.checkVisibility({ checkOpacity: true }));
    };
    const images = await Promise.all([...document.images].filter(visible).map(async image => {
      try {
        await image.decode();
        return { src: image.currentSrc || image.src, decoded: image.naturalWidth > 0 && image.naturalHeight > 0 };
      } catch (error) {
        return { src: image.currentSrc || image.src, decoded: false, error: String(error) };
      }
    }));
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(el => visibleInLayout(el) && text(el));
    const navs = [...document.querySelectorAll('nav,[role="navigation"]')].filter(visible).map(el => ({
      label: accessibleName(el), visibleLinks: [...el.querySelectorAll('a[href]')].filter(visible).length
    }));
    const primaryNav = document.querySelector('.site-nav');
    const primaryNavigation = primaryNav ? {
      present: true, visible: visible(primaryNav), label: accessibleName(primaryNav),
      ariaLabel: primaryNav.getAttribute('aria-label') || '',
      visibleLinks: [...primaryNav.querySelectorAll('a[href]')].filter(visible).length
    } : { present: false, visible: false, label: '', ariaLabel: '', visibleLinks: 0 };
    const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="link"]')];
    const unnamedControls = controls.filter(el => visible(el) && !accessibleName(el)).map(el => ({ tag: el.tagName.toLowerCase(), id: el.id || '' }));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seconds = list => Math.max(...list.split(',').map(value => {
      const token = value.trim();
      return token.endsWith('ms') ? Number.parseFloat(token) / 1000 : Number.parseFloat(token) || 0;
    }));
    const motionViolations = reduced ? [...document.querySelectorAll('body *')].filter(visible).map(el => {
      const s = getComputedStyle(el), animation = seconds(s.animationDuration), transition = seconds(s.transitionDuration);
      return animation > 0.001 || transition > 0.001 ? { tag: el.tagName.toLowerCase(), id: el.id || '', animation, transition } : null;
    }).filter(Boolean).slice(0, 20) : [];
    const width = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
    const brokenFragments = [...document.querySelectorAll('a[href^="#"]')].map(a => (a.getAttribute('href') || '').slice(1))
      .filter(id => id && !document.getElementById(decodeURIComponent(id)));
    return {
      title: document.title.trim(), lang: document.documentElement.lang || '',
      viewport: document.querySelector('meta[name="viewport"]')?.content || '',
      h1Count: [...document.querySelectorAll('h1')].filter(el => visibleInLayout(el) && text(el)).length,
      mainCount: document.querySelectorAll('main').length,
      headings: headings.map(el => ({ level: Number(el.tagName.slice(1)), text: text(el).slice(0, 100) })),
      navs, primaryNavigation, unnamedControls, horizontalOverflow: width > innerWidth + 1, viewportWidth: innerWidth, documentWidth: width,
      duplicateIds: [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))], brokenFragments,
      visibleImages: images, reducedMotion: { matches: reduced, motionViolations, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior },
      companionCount: document.querySelectorAll('[data-companion]').length
    };
  });
}

async function companionHitTest(page, state) {
  return page.evaluate(stateName => {
    const root = document.querySelector('[data-companion]');
    const toggle = root?.querySelector('[data-companion-toggle]');
    const panel = root?.querySelector('[data-companion-panel]');
    if (!root || !toggle || !panel) return { state: stateName, missing: true, collisions: [] };
    const visible = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return !el.disabled && !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' &&
        Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    };
    const label = el => (el.getAttribute('aria-label') || el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const surfaces = [toggle, ...(visible(panel) ? [panel] : [])].filter(visible);
    const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="link"]')]
      .filter(el => !root.contains(el) && visible(el));
    const collisions = [];
    let overlapSamples = 0;
    for (const control of controls) {
      const cr = control.getBoundingClientRect();
      for (const surface of surfaces) {
        const sr = surface.getBoundingClientRect();
        const l = Math.max(cr.left, sr.left), r = Math.min(cr.right, sr.right);
        const t = Math.max(cr.top, sr.top), b = Math.min(cr.bottom, sr.bottom);
        if (r <= l || b <= t) continue;
        const points = [[(l + r) / 2, (t + b) / 2], [l + (r - l) * .25, t + (b - t) * .25], [l + (r - l) * .75, t + (b - t) * .75]];
        for (const [x, y] of points) {
          overlapSamples++;
          const stack = document.elementsFromPoint(x, y);
          const companionIndex = stack.findIndex(el => root.contains(el));
          const controlIndex = stack.findIndex(el => el === control || control.contains(el));
          const sample = { control: label(control), tag: control.tagName.toLowerCase(), x: Math.round(x), y: Math.round(y),
            topHit: stack[0]?.tagName.toLowerCase() || '', companionHitIndex: companionIndex, controlHitIndex: controlIndex };
          if (companionIndex >= 0 && (controlIndex < 0 || companionIndex < controlIndex)) {
            collisions.push({ ...sample, companionSurface: surface === toggle ? 'toggle' : 'bubble' });
          }
        }
      }
    }
    const r = root.getBoundingClientRect();
    return { state: stateName, expanded: toggle.getAttribute('aria-expanded') === 'true' && visible(panel),
      companionPosition: { left: Math.round(r.left), top: Math.round(r.top) }, controlsChecked: controls.length, overlapSamples, collisions };
  }, state);
}

async function waitForCompanion(page, expected) {
  await page.waitForFunction(value => {
    const toggle = document.querySelector('[data-companion-toggle]'), panel = document.querySelector('[data-companion-panel]');
    return !!toggle && !!panel && (toggle.getAttribute('aria-expanded') === 'true' && !panel.hidden) === value;
  }, expected, { timeout: 2500 });
}

async function exerciseCompanion(page, label) {
  const toggle = page.locator('[data-companion-toggle]').first(), panel = page.locator('[data-companion-panel]').first();
  if (!await toggle.count() || !await panel.count()) return { missing: true, states: [], actionError: 'companion controls absent' };
  const initiallyOpen = await toggle.getAttribute('aria-expanded') === 'true' && await panel.isVisible().catch(() => false);
  const states = [await companionHitTest(page, `${label}:initial-default`)];
  try {
    if (initiallyOpen) {
      await toggle.click({ timeout: 2500 });
      await waitForCompanion(page, false);
      states.push(await companionHitTest(page, `${label}:closed`));
    }
    await toggle.click({ timeout: 2500 });
    await waitForCompanion(page, true);
    states.push(await companionHitTest(page, `${label}:open-bubble`));
    return { initiallyOpen, states };
  } catch (error) {
    return { initiallyOpen, states, actionError: String(error) };
  }
}

async function exerciseKeyboardAndMenu(page, width) {
  const result = { keyboard: null, mobileMenu: { applicable: width <= 960 } };
  try {
    await page.keyboard.press('Tab');
    result.keyboard = await page.evaluate(() => {
      const el = document.activeElement, style = el ? getComputedStyle(el) : null, rect = el?.getBoundingClientRect();
      const outline = style?.outlineStyle !== 'none' && Number.parseFloat(style?.outlineWidth || '0') > 0;
      const skip = document.querySelector('.skip-to-main'), skipStyle = skip ? getComputedStyle(skip) : null;
      const skipRect = skip?.getBoundingClientRect(), skipOutline = skipStyle?.outlineStyle !== 'none' && Number.parseFloat(skipStyle?.outlineWidth || '0') > 0;
      const skipHref = skip?.getAttribute('href') || '';
      return { tag: el?.tagName.toLowerCase() || '', id: el?.id || '',
        label: (el?.getAttribute('aria-label') || el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
        focusVisible: !!el?.matches(':focus-visible'), visible: !!rect && rect.width > 0 && rect.height > 0 && style?.visibility !== 'hidden',
        focusIndicator: !!(outline || (style?.boxShadow && style.boxShadow !== 'none')),
        skipLink: {
          focusedOnFirstTab: !!skip && el === skip,
          focusVisible: !!skip?.matches(':focus-visible'),
          revealedInViewport: !!skipRect && skipRect.left >= 0 && skipRect.top >= 0 && skipRect.right <= innerWidth && skipRect.bottom <= innerHeight &&
            skipStyle?.display !== 'none' && skipStyle?.visibility !== 'hidden' && Number(skipStyle?.opacity || 1) > 0,
          focusIndicator: !!(skipOutline || (skipStyle?.boxShadow && skipStyle.boxShadow !== 'none')),
          target: skipHref, targetExists: skipHref.startsWith('#') && !!document.getElementById(decodeURIComponent(skipHref.slice(1)))
        } };
    });
  } catch (error) { result.keyboard = { error: String(error) }; }
  if (width > 960) return result;
  const toggle = page.locator('.site-nav .nav-toggle').first();
  try {
    await toggle.waitFor({ state: 'visible', timeout: 2500 });
    const before = await toggle.getAttribute('aria-expanded');
    await toggle.click({ timeout: 2500 });
    await page.waitForFunction(value => document.querySelector('.site-nav .nav-toggle')?.getAttribute('aria-expanded') !== value, before, { timeout: 2500 });
    const openedByPointer = await toggle.getAttribute('aria-expanded') === 'true';
    const linksVisible = await page.locator('.site-nav .site-links').isVisible();
    const hitTest = await companionHitTest(page, 'mobile-menu-open');
    await toggle.click({ timeout: 2500 });
    await page.waitForFunction(() => document.querySelector('.site-nav .nav-toggle')?.getAttribute('aria-expanded') === 'false', null, { timeout: 2500 });
    result.mobileMenu = { applicable: true, openedByPointer, linksVisible, companionHitTest: hitTest };
  } catch (error) { result.mobileMenu = { applicable: true, error: String(error) }; }
  return result;
}

async function runView(browser, baseURL, view, report, outDir) {
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1,
    isMobile: view.width <= 768, hasTouch: view.width <= 768, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const networkErrors = [], pageErrors = [], consoleErrors = [];
  page.on('response', response => {
    if (response.status() >= 400 && !new URL(response.url()).pathname.toLowerCase().endsWith('/favicon.ico')) {
      networkErrors.push({ status: response.status(), url: response.url() });
    }
  });
  page.on('requestfailed', request => networkErrors.push({ status: 'request-failed', url: request.url(), error: request.failure()?.errorText || '' }));
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const url = routeURL(baseURL, view.route);
  const item = { route: view.route, width: view.width, height: view.height, label: view.label, url, status: 'PASS',
    issues: [], networkErrors, pageErrors, consoleErrors };
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    item.documentStatus = response?.status() ?? null;
    if (item.documentStatus !== 200) item.issues.push(`document-status-${item.documentStatus ?? 'missing'}`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(120);
    item.document = await inspectDocument(page);
    if (!item.document.title) item.issues.push('missing-title');
    if (!item.document.lang) item.issues.push('missing-language');
    if (!item.document.viewport) item.issues.push('missing-viewport-meta');
    if (item.document.h1Count !== 1) item.issues.push(`visible-h1-count-${item.document.h1Count}`);
    if (item.document.mainCount !== 1) item.issues.push(`main-count-${item.document.mainCount}`);
    if (!item.document.primaryNavigation.present || !item.document.primaryNavigation.visible || !item.document.primaryNavigation.visibleLinks) item.issues.push('missing-visible-primary-navigation');
    if (item.document.primaryNavigation.label.toLowerCase() !== 'primary navigation') item.issues.push('incorrect-primary-navigation-name');
    if (item.document.horizontalOverflow) item.issues.push('horizontal-overflow');
    if (item.document.duplicateIds.length) item.issues.push('duplicate-ids');
    if (item.document.unnamedControls.length) item.issues.push('unnamed-visible-controls');
    if (item.document.brokenFragments.length) item.issues.push('broken-fragment-links');
    if (item.document.headings.some((heading, i, all) => i > 0 && heading.level > all[i - 1].level + 1)) item.issues.push('heading-level-skip');
    if (item.document.visibleImages.some(image => !image.decoded)) item.issues.push('visible-image-decode-failure');
    if (!item.document.reducedMotion.matches || item.document.reducedMotion.motionViolations.length) item.issues.push('reduced-motion-not-honored');
    if (item.document.companionCount !== 1) item.issues.push(`companion-count-${item.document.companionCount}`);
    if (screenshotRoutes.has(view.route)) {
      const dir = path.join(outDir, slug(view.route));
      await fs.mkdir(dir, { recursive: true });
      item.screenshot = path.join(dir, `${view.width}x${view.height}.png`);
      await page.screenshot({ path: item.screenshot, fullPage: false, animations: 'disabled' });
    }
    item.interactions = await exerciseKeyboardAndMenu(page, view.width);
    if (!item.interactions.keyboard?.focusVisible || !item.interactions.keyboard?.visible || !item.interactions.keyboard?.focusIndicator) item.issues.push('keyboard-focus-not-visible');
    const skipLink = item.interactions.keyboard?.skipLink;
    if (!skipLink?.focusedOnFirstTab || !skipLink?.focusVisible || !skipLink?.revealedInViewport || !skipLink?.focusIndicator || !skipLink?.targetExists) item.issues.push('skip-link-focus-reveal-failed');
    if (view.width <= 960 && (item.interactions.mobileMenu?.error || !item.interactions.mobileMenu?.openedByPointer || !item.interactions.mobileMenu?.linksVisible)) item.issues.push('mobile-menu-interaction-failed');
    item.companion = await exerciseCompanion(page, view.label);
    if (item.companion.missing || item.companion.actionError) item.issues.push('companion-interaction-failed');
    const hitTests = [...(item.companion.states || []), item.interactions.mobileMenu?.companionHitTest].filter(Boolean);
    if (hitTests.some(state => state.missing || state.collisions?.length)) item.issues.push('companion-hit-test-collision');
  } catch (error) { item.issues.push(`view-exception: ${String(error)}`); }
  if (networkErrors.length) item.issues.push('http-or-resource-errors');
  if (pageErrors.length) item.issues.push('page-errors');
  if (consoleErrors.length) item.issues.push('console-errors');
  item.status = item.issues.length ? 'FAIL' : 'PASS';
  report.views.push(item);
  console.log(`${item.status}|${view.label}|${view.route}|${view.width}x${view.height}|${item.issues.join(',')}`);
  await context.close();
}

async function checkUnknownPath(browser, baseURL, report) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const route = '/__autonomous-route-matrix-unknown-path-must-404__/', url = routeURL(baseURL, route);
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const status = response?.status() ?? null;
    report.unknownPath = { route, url, status, expectedStatus: 404, passed: status === 404 };
    if (!report.unknownPath.passed) report.issues.push({ kind: 'unknown-route-status', ...report.unknownPath });
  } catch (error) {
    report.unknownPath = { route, url, expectedStatus: 404, passed: false, error: String(error) };
    report.issues.push({ kind: 'unknown-route-navigation', ...report.unknownPath });
  } finally { await context.close(); }
  console.log(`${report.unknownPath.passed ? 'PASS' : 'FAIL'}|unknown-path|expected-404|actual-${report.unknownPath.status ?? 'error'}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2)), outDir = path.resolve(args.outDir), reportPath = path.resolve(args.report);
  if (!isWithin(runtimeRoot, outDir) || !isWithin(runtimeRoot, reportPath)) throw new Error(`Output paths must be inside D runtime: ${runtimeRoot}`);
  const baseURL = normalizeBaseURL(args.targetURL);
  const pageIndexPath = path.join(repoRoot, 'studio-project', 'toadal-feast-website', 'pages', 'index.json');
  const pages = JSON.parse(await fs.readFile(pageIndexPath, 'utf8')).pages || [];
  if (pages.length !== 33) throw new Error(`Expected the current 33-route registry; found ${pages.length} in ${pageIndexPath}`);
  if (new Set(pages.map(page => page.route)).size !== 33 || !pages.some(page => page.route === '/') || !pages.some(page => page.route === '/404.html')) {
    throw new Error('Route registry has duplicate routes or lacks Home/404 records.');
  }
  process.env.TEMP = runtimeTemp;
  process.env.TMP = runtimeTemp;
  process.env.TMPDIR = runtimeTemp;
  await fs.mkdir(runtimeTemp, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });
  const require = createRequire(import.meta.url);
  const { chromium } = require('C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const report = {
    schema: 'toadal-feast.autonomous-route-matrix.v1', targetURL: baseURL.href,
    source: { routeIndex: pageIndexPath, registeredRoutes: pages.length },
    viewportPlan: { routeViewportsPerRoute: ['1440x900 desktop', '768x1024 tablet', '390x844 mobile'], routeViewCount: 99, supplemental },
    screenshotFamilies: [...screenshotRoutes], views: [], issues: []
  };
  const browser = await chromium.launch({ headless: true });
  try {
    for (const record of pages) {
      for (const viewport of [
        { width: 1440, height: 900, label: 'desktop' },
        { width: 768, height: 1024, label: 'tablet' },
        { width: 390, height: 844, label: 'mobile' }
      ]) await runView(browser, baseURL, { route: record.route, ...viewport }, report, outDir);
    }
    for (const view of supplemental) await runView(browser, baseURL, view, report, outDir);
    await checkUnknownPath(browser, baseURL, report);
  } finally { await browser.close(); }
  const failedViews = report.views.filter(view => view.status !== 'PASS');
  report.summary = {
    status: failedViews.length || report.issues.length ? 'FAIL' : 'PASS',
    registeredRoutes: pages.length, expectedRouteViews: 99,
    actualRouteViews: report.views.filter(view => ['desktop', 'tablet', 'mobile'].includes(view.label)).length,
    supplementalViews: supplemental.length, passedViews: report.views.filter(view => view.status === 'PASS').length,
    failedViews: failedViews.length, unknownPath404: report.unknownPath?.passed === true,
    issueCount: report.issues.length + failedViews.reduce((sum, view) => sum + view.issues.length, 0)
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`SUMMARY|${JSON.stringify(report.summary)}`);
  console.log(`REPORT|${reportPath}`);
  process.exitCode = report.summary.status === 'PASS' ? 0 : 1;
}

main().catch(error => { console.error(error.stack || String(error)); process.exitCode = 2; });
