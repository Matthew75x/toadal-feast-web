import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizeBasePath, resolveBasePath } from './wo001-pages-basepath.mjs';
import { stagingRobotsErrors, STAGING_ROBOTS_TEXT } from './lib/staging-robots.mjs';

const BASE = '/toadal-feast-web/';
const SCRIPT = fileURLToPath(new URL('./wo001-pages-basepath.mjs', import.meta.url));
const VERIFY_SCRIPT = fileURLToPath(new URL('./verify-wo001-home.mjs', import.meta.url));
const ROBOTS_VERIFY_SCRIPT = fileURLToPath(new URL('./verify-staging-robots.mjs', import.meta.url));

test('resolveBasePath rewrites only unprefixed root-absolute same-origin URLs', () => {
  assert.equal(resolveBasePath(BASE, '/'), BASE);
  assert.equal(resolveBasePath(BASE, '/assets/x.svg'), `${BASE}assets/x.svg`);
  assert.equal(resolveBasePath(BASE, '/assets/x.svg?q=1#icon'), `${BASE}assets/x.svg?q=1#icon`);
  assert.equal(resolveBasePath(BASE, '/toadal-feast-web'), '/toadal-feast-web');
  assert.equal(resolveBasePath(BASE, '/toadal-feast-web/page/'), '/toadal-feast-web/page/');

  for (const value of [
    'https://example.test/x',
    'mailto:hello@example.test',
    '//cdn.example.test/x',
    'data:image/png;base64,AAAA',
    'blob:https://example.test/id',
    '#section',
    'assets/x.svg',
    '?query=1',
  ]) {
    assert.equal(resolveBasePath(BASE, value), value, `${value} should remain unchanged`);
  }

  assert.equal(resolveBasePath('/', '/'), '/');
  assert.equal(resolveBasePath('/', '/assets/x.svg'), '/assets/x.svg');
  assert.equal(resolveBasePath('/nested//site', '/assets/x.svg'), '/nested/site/assets/x.svg');
});

test('resolveBasePath rejects invalid base paths', () => {
  for (const basePath of [
    '', 'relative/', '//host/path', '/a/./b', '/a/../b', '/a/%2e/b', '/a/%2E%2e/b',
    '/a/%2f/b', '/a/%5c/b', '/a/%3f/b', '/a/%23/b', '/a/%00/b', '/a/%7f/b', '/a/%C2%85/b',
    '/a\\b', '/a?x=1', '/a#x', '/a/\u0001b', '/bad%zz',
  ]) {
    assert.throws(() => resolveBasePath(basePath, '/asset'), TypeError, `${basePath} should be rejected`);
  }
  assert.equal(normalizeBasePath('/nested//site'), '/nested/site/');
});

test('CLI recursively rewrites HTML attributes, srcset and CSS URLs, and is idempotent', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-basepath-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const exportRoot = path.join(tempRoot, 'dist');
  await mkdir(path.join(exportRoot, 'nested'), { recursive: true });

  const html = `<!doctype html>
<a href="/" data-note="/unchanged">home</a>
<a href='/assets/logo.svg?x=1&amp;y=2'>asset</a>
<a href="https://example.test/x">external</a><a href="//cdn.example.test/x">protocol-relative</a>
<a href="data:text/plain,hello">data</a><a href="blob:https://example.test/id">blob</a>
<a href="#section">fragment</a><a href="assets/relative.svg">relative</a>
<a href="/toadal-feast-web/already.svg">prefixed</a>
<img srcset="/small.webp 1x, /large.webp 2x, data:image/png;base64,AAAA 3x">
<div style="background:url('/inline-attribute.svg')"></div>
<section style="background-image:url(&#39;/assets/images/world/candy-kingdom.webp&#39;)"></section>
<style>/* url(/comment.svg) */ .hero { background: url('/assets/hero.webp'); mask: url(../mask.svg); }</style>
<script>const example = "url('/script-string.svg')";</script>
`;
  const css = `@import "/assets/imported.css"; /* url(/comment.css) */ .logo { background-image: url("/assets/logo.webp"); mask: url(//cdn.example.test/mask.svg); }`;
  const nestedCss = `.nested { background: url(/assets/nested.webp); }`;
  await writeFile(path.join(exportRoot, 'index.html'), html, 'utf8');
  await writeFile(path.join(exportRoot, 'site.css'), css, 'utf8');
  await writeFile(path.join(exportRoot, 'nested', 'extra.css'), nestedCss, 'utf8');
  await writeFile(path.join(exportRoot, 'imported.css'), '.imported { color: red; }', 'utf8');
  await writeFile(path.join(exportRoot, 'nested', 'app.js'), `const path = '/must-not-change.js';`, 'utf8');

  const run = (basePath = BASE) => spawnSync(process.execPath, [SCRIPT, exportRoot, basePath], { encoding: 'utf8' });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Files scanned: 4\r?\nFiles rewritten: 3\r?\nURLs rewritten: 10\r?\n/u);

  const rewrittenHtml = await readFile(path.join(exportRoot, 'index.html'), 'utf8');
  assert.match(rewrittenHtml, /href="\/toadal-feast-web\/"/u);
  assert.match(rewrittenHtml, /href='\/toadal-feast-web\/assets\/logo\.svg\?x=1&amp;y=2'/u);
  assert.match(rewrittenHtml, /srcset="\/toadal-feast-web\/small\.webp 1x, \/toadal-feast-web\/large\.webp 2x, data:image\/png;base64,AAAA 3x"/u);
  assert.match(rewrittenHtml, /background: url\('\/toadal-feast-web\/assets\/hero\.webp'\)/u);
  assert.match(rewrittenHtml, /style="background:url\(&#39;\/toadal-feast-web\/inline-attribute\.svg&#39;\)"/u);
  assert.match(rewrittenHtml, /background-image:url\(&#39;\/toadal-feast-web\/assets\/images\/world\/candy-kingdom\.webp&#39;\)/u);
  assert.match(rewrittenHtml, /\/\* url\(\/comment\.svg\) \*\//u);
  assert.match(rewrittenHtml, /url\('\/script-string\.svg'\)/u);
  assert.match(rewrittenHtml, /href="\/toadal-feast-web\/already\.svg"/u);

  const rewrittenCss = await readFile(path.join(exportRoot, 'site.css'), 'utf8');
  assert.match(rewrittenCss, /^@import "\/toadal-feast-web\/assets\/imported\.css";/u);

  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /Files scanned: 4\r?\nFiles rewritten: 0\r?\nURLs rewritten: 0\r?\n/u);

  const rootBaseNoOp = run('/');
  assert.equal(rootBaseNoOp.status, 0, rootBaseNoOp.stderr);
  assert.match(rootBaseNoOp.stdout, /Files scanned: 4\r?\nFiles rewritten: 0\r?\nURLs rewritten: 0\r?\n/u);
});

test('CLI rejects invalid arguments without touching the export', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-basepath-invalid-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const markerPath = path.join(tempRoot, 'index.html');
  const original = '<a href="/assets/x">x</a>';
  await writeFile(markerPath, original, 'utf8');

  const result = spawnSync(process.execPath, [SCRIPT, tempRoot, '//host/path'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exactly one leading slash/u);
  assert.equal(await readFile(markerPath, 'utf8'), original);
});

test('staging robots opt-in applies website policy and preserves protected game HTML/CSS bytes exactly', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-staging-robots-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const exportRoot = path.join(tempRoot, 'dist');
  const targetDirectory = path.join(exportRoot, 'public', 'games', 'wicked-bites');
  const nestedWebsiteDirectory = path.join(exportRoot, 'about');
  const assetsDirectory = path.join(exportRoot, 'assets');
  await mkdir(targetDirectory, { recursive: true });
  await mkdir(nestedWebsiteDirectory, { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  const targetPath = path.join(targetDirectory, 'index.html');
  const targetCssPath = path.join(targetDirectory, 'game.css');
  const otherPath = path.join(exportRoot, 'index.html');
  const nestedWebsitePath = path.join(nestedWebsiteDirectory, 'index.html');
  const websiteCssPath = path.join(assetsDirectory, 'site.css');
  const robotsPath = path.join(exportRoot, 'robots.txt');
  const cartridgeHtml = Buffer.from('<!doctype html><html><head><title>Wicked Bites</title></head><body>game</body></html>');
  const cartridgeCss = Buffer.from('/* immutable game stylesheet */\n.game { background: url("/game.png"); }');
  const otherHtml = '<!doctype html><html><head><title>Home</title></head><body>home</body></html>';
  const nestedHtml = '<!doctype html><html><head><title>About</title></head><body>about</body></html>';
  const websiteCss = '.site { color: green; }';
  await writeFile(targetPath, cartridgeHtml);
  await writeFile(targetCssPath, cartridgeCss);
  await writeFile(otherPath, otherHtml, 'utf8');
  await writeFile(nestedWebsitePath, nestedHtml, 'utf8');
  await writeFile(websiteCssPath, websiteCss, 'utf8');

  const run = (...args) => spawnSync(process.execPath, [SCRIPT, exportRoot, '/', ...args], { encoding: 'utf8' });
  const defaultRun = run();
  assert.equal(defaultRun.status, 0, defaultRun.stderr);
  assert.deepEqual(await readFile(targetPath), cartridgeHtml, 'default behavior must preserve protected game HTML bytes');
  assert.deepEqual(await readFile(targetCssPath), cartridgeCss, 'default behavior must preserve protected game CSS bytes');
  assert.equal(await readFile(otherPath, 'utf8'), otherHtml);
  assert.equal(await readFile(nestedWebsitePath, 'utf8'), nestedHtml);
  await assert.rejects(readFile(robotsPath), { code: 'ENOENT' }, 'default behavior must not add staging policy');

  await writeFile(robotsPath, 'User-agent: *\nAllow: /\nUser-agent: *\nDisallow: /\n');
  const stagingRun = run('--staging-robots');
  assert.equal(stagingRun.status, 0, stagingRun.stderr);
  assert.match(stagingRun.stdout, /Staging robots policy: added/u);
  const homeWithPolicy = otherHtml.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">');
  const aboutWithPolicy = nestedHtml.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">');
  assert.deepEqual(await readFile(targetPath), cartridgeHtml, 'staging policy must never edit protected game HTML bytes');
  assert.deepEqual(await readFile(targetCssPath), cartridgeCss, 'staging policy must never edit protected game CSS bytes');
  assert.equal(await readFile(otherPath, 'utf8'), homeWithPolicy, 'website HTML receives noindex,nofollow');
  assert.equal(await readFile(nestedWebsitePath, 'utf8'), aboutWithPolicy, 'nested website HTML receives noindex,nofollow');
  assert.equal(await readFile(websiteCssPath, 'utf8'), websiteCss, 'website CSS remains unchanged');
  const robotsText = await readFile(robotsPath, 'utf8');
  assert.equal(robotsText, STAGING_ROBOTS_TEXT);

  const repeatRun = run('--staging-robots');
  assert.equal(repeatRun.status, 0, repeatRun.stderr);
  assert.match(repeatRun.stdout, /Staging robots policy: already present/u);
  assert.deepEqual(await readFile(targetPath), cartridgeHtml, 'repeat runs preserve protected game HTML bytes');
  assert.deepEqual(await readFile(targetCssPath), cartridgeCss, 'repeat runs preserve protected game CSS bytes');
  assert.equal(await readFile(otherPath, 'utf8'), homeWithPolicy, 'repeat website HTML policy is byte-for-byte idempotent');
  assert.equal(await readFile(nestedWebsitePath, 'utf8'), aboutWithPolicy, 'repeat nested website policy is byte-for-byte idempotent');
  assert.equal(await readFile(robotsPath, 'utf8'), robotsText, 'repeat robots.txt policy is byte-for-byte idempotent');
});

test('staging robots verification rejects equally applicable root Allow rules', () => {
  for (const text of [
    'User-agent: *\nAllow: /\nDisallow: /\n',
    'User-agent: *\nDisallow: /\nUser-agent: *\nAllow: /\n',
    'USER-AGENT: *\r\nDISALLOW: /\r\nALLOW: / # conflicting tie\r\n',
  ]) assert.match(stagingRobotsErrors(text).join('; '), /conflicting root Allow/);
  assert.deepEqual(stagingRobotsErrors(STAGING_ROBOTS_TEXT), []);
  assert.deepEqual(stagingRobotsErrors('# staging\r\nUser-Agent: *\r\nDisallow: /\r\n'), []);
  assert.ok(stagingRobotsErrors('User-agent: *\nDisallow: /\nAllow: /assets/\n').length);
  assert.ok(stagingRobotsErrors('User-agent: *\nDisallow: /\nUser-agent: crawler\nAllow: /\n').length);
});

test('the staging robots CLI rejects the original conflict and still enforces website noindex/nofollow', async t => {
  const exportRoot = await mkdtemp(path.join(os.tmpdir(), 'toadal-robots-cli-negative-'));
  t.after(() => rm(exportRoot, {recursive:true, force:true}));
  const game = 'public/games/wicked-bites';
  await mkdir(path.join(exportRoot, game), {recursive:true});
  for (const name of ['index.html', 'cartridge.json', 'toadal-bridge.js']) {
    const source = new URL(`../studio-project/toadal-feast-website/reference/${game}/${name}`, import.meta.url);
    await writeFile(path.join(exportRoot, game, name), await readFile(source));
  }
  const index = path.join(exportRoot, 'index.html');
  await writeFile(index, '<meta name="robots" content="noindex,nofollow"><p>Synthetic website</p>');
  const robots = path.join(exportRoot, 'robots.txt');
  const run = () => spawnSync(process.execPath, [ROBOTS_VERIFY_SCRIPT, exportRoot, 'staging'], {encoding:'utf8'});
  await writeFile(robots, 'User-agent: *\nAllow: /\nUser-agent: *\nDisallow: /\n');
  const conflict = run();
  assert.notEqual(conflict.status, 0); assert.match(conflict.stderr, /conflicting root Allow/u);
  await writeFile(robots, STAGING_ROBOTS_TEXT);
  const repaired = run(); assert.equal(repaired.status, 0, repaired.stderr);
  await writeFile(index, '<p>Indexable synthetic website</p>');
  const indexable = run(); assert.notEqual(indexable.status, 0); assert.match(indexable.stderr, /missing staging noindex,nofollow/u);
});

test('verifier shares strict base-path validation and rejects traversal-like paths', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-basepath-validation-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  for (const basePath of ['/a/./b', '/a/%2e%2e/b', '/a/%2f/b', '/a/%5c/b', '/a/%3f/b', '/a/%23/b', '/a/%00/b', '/bad%zz']) {
    const result = spawnSync(process.execPath, [VERIFY_SCRIPT, tempRoot, basePath], { encoding: 'utf8' });
    assert.equal(result.status, 2, `${basePath}: ${result.stderr}`);
    assert.match(result.stderr, /Invalid BASE_PATH/u);
    assert.throws(() => normalizeBasePath(basePath), TypeError);
  }
});

test('verifier rejects javascript URLs and checks nested HTML plus CSS references in deployed context', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-verify-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const exportRoot = path.join(tempRoot, 'dist');
  await mkdir(path.join(exportRoot, 'play'), { recursive: true });
  await mkdir(path.join(exportRoot, 'world'), { recursive: true });
  await mkdir(path.join(exportRoot, 'assets'), { recursive: true });
  await mkdir(path.join(exportRoot, 'images'), { recursive: true });
  await writeFile(path.join(exportRoot, 'index.html'), `<!doctype html><html><head>
<link rel="stylesheet" href="/toadal-feast-web/assets/site.css">
<style>.inline { background: url('/toadal-feast-web/missing-inline.webp'); }</style>
</head><body><main><h1>Play the Feast World for Free.</h1><a href="javascript:alert(1)">unsafe</a><a href="java&Tab;script&colon;alert(2)">entity-obfuscated unsafe</a></main></body></html>`, 'utf8');
  await writeFile(path.join(exportRoot, '404.html'), '<main><h1>Not found</h1></main>', 'utf8');
  await writeFile(path.join(exportRoot, 'play', 'index.html'), '<main><h1>Play</h1><a href="../world/">World</a><a href="/world/">Unprefixed broken route</a><link rel="stylesheet" href="../assets/nested.css"><img src="../images/nested.webp"></main>', 'utf8');
  await writeFile(path.join(exportRoot, 'world', 'index.html'), '<main><h1>World</h1></main>', 'utf8');
  await writeFile(path.join(exportRoot, 'assets', 'site.css'), '.hero { background: url("/toadal-feast-web/missing-from-css.webp"); }', 'utf8');
  await writeFile(path.join(exportRoot, 'assets', 'nested.css'), '@import "/toadal-feast-web/assets/imported.css"; .nested { background: url("../images/nested.webp"); }', 'utf8');
  await writeFile(path.join(exportRoot, 'assets', 'imported.css'), '@font-face { src: url("/toadal-feast-web/missing-font.woff2"); }', 'utf8');
  await writeFile(path.join(exportRoot, 'images', 'nested.webp'), 'fixture', 'utf8');

  const result = spawnSync(process.execPath, [VERIFY_SCRIPT, exportRoot, BASE], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr.match(/unsafe javascript: URL/gu)?.length, 2, result.stderr);
  assert.match(result.stderr, /missing-inline\.webp/u);
  assert.match(result.stderr, /missing-from-css\.webp/u);
  assert.match(result.stderr, /missing-font\.woff2/u);
  assert.match(result.stderr, /play[\\/]index\.html: a\[href\]/u);
  assert.doesNotMatch(result.stderr, /play[\\/]index\.html: img\[src\].*missing target/u);
  assert.doesNotMatch(result.stderr, /assets\/nested\.css: CSS: url\(\).*missing target/u);
});

test('verifier requires the exact four PUBLIC_FEATURE_STATE preview cards and excludes Arcade candidate', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-game-truth-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const exportRoot = path.join(tempRoot, 'dist');
  await mkdir(exportRoot, { recursive: true });
  const approved = [
    ['wicked-bites', 'Wicked Bites'],
    ['toadal-tower-defense', 'TOADAL Tower Defense'],
    ['froggy-fruity-bash', 'Froggy Fruity Bash'],
    ['claw-feed-gulper', 'CLAW: Feed Gulper'],
  ].map(([slug, title]) => `<article class="studio-game-card" data-studio-component="component.home.game.${slug}"><h3>${title}</h3><span>PREVIEW</span></article>`);
  const arcade = '<article class="studio-game-card" data-studio-component="component.home.game.arcade-preview"><h3>TOADAL FEAST Arcade</h3><span>AUDIT REQUIRED</span></article>';
  await writeFile(path.join(exportRoot, '404.html'), '<main><h1>Not found</h1></main>', 'utf8');
  const run = async (cards) => {
    const html = `<!doctype html><main><h1>Play the Feast World for Free.</h1><section id="home-game-grid">${cards.join('')}</section>
<section id="companion" data-companion-state="ready"><div data-companion><button type="button" data-companion-toggle>Minimize Toadal companion</button></div></section></main>
<script>var storageKey = 'toadal:site:companion:minimized:v1'; var minimized = false; var stored = window.localStorage.getItem(storageKey); window.localStorage.setItem(storageKey, minimized ? 'true' : 'false');</script>`;
    await writeFile(path.join(exportRoot, 'index.html'), html, 'utf8');
    return spawnSync(process.execPath, [VERIFY_SCRIPT, exportRoot, BASE], { encoding: 'utf8' });
  };

  const correct = await run(approved);
  assert.notEqual(correct.status, 0, 'other Home contract checks are intentionally absent from this fixture');
  assert.doesNotMatch(correct.stderr, /Home grid contains exactly the four approved PREVIEW game cards/u);
  assert.doesNotMatch(correct.stderr, /Home grid contains no TOADAL FEAST Arcade candidate card/u);
  assert.doesNotMatch(correct.stderr, /PUBLIC_FEATURE_STATE confirms exactly four approved PREVIEW games/u);
  assert.doesNotMatch(correct.stderr, /Toadal companion persists minimized state with namespaced localStorage get\/set calls/u);

  const candidateReplacesPreview = await run([...approved.slice(0, 3), arcade]);
  assert.match(candidateReplacesPreview.stderr, /Home grid contains exactly the four approved PREVIEW game cards/u);
  assert.match(candidateReplacesPreview.stderr, /Home grid contains no TOADAL FEAST Arcade candidate card/u);

  const candidateAdded = await run([...approved, arcade]);
  assert.match(candidateAdded.stderr, /Home grid contains exactly the four approved PREVIEW game cards/u);
  assert.match(candidateAdded.stderr, /Home grid contains no TOADAL FEAST Arcade candidate card/u);
});

test('verifier recognizes Studio variant markers, intro filters, search explanation, and disabled store-links control', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'wo001-pages-studio-markers-'));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const exportRoot = path.join(tempRoot, 'dist');
  await mkdir(exportRoot, { recursive: true });
  const previewCards = [
    ['wicked-bites', 'Wicked Bites'],
    ['toadal-tower-defense', 'TOADAL Tower Defense'],
    ['froggy-fruity-bash', 'Froggy Fruity Bash'],
    ['claw-feed-gulper', 'CLAW: Feed Gulper'],
  ].map(([slug, title]) => `<article class="studio-game-card" data-studio-component="component.home.game.${slug}"><h3>${title}</h3><span>PREVIEW</span></article>`).join('');
  const html = `<!doctype html><main>
<section data-studio-variant="home-hero"><h1>Play the Feast World for Free.</h1>
<form id="home-search" role="search"><label for="search-field">Search the Feast</label><div class="home-search__field"><input id="search-field" type="search" disabled><button type="button" disabled aria-label="Search is coming soon">Search</button></div><p>Search is not live yet. This field will not submit or collect anything.</p></form></section>
<section data-studio-variant="games-intro"><div class="game-tabs"><button type="button" data-game-tab="all">All experiences</button><button type="button" data-game-tab="preview">Previews</button><button type="button" data-game-tab="public">Playable now</button></div></section>
<section data-studio-variant="home-game-grid">${previewCards}</section>
<section data-studio-variant="app-conversion"><button type="button" disabled>STORE LINKS NOT AVAILABLE</button><p>App-store URLs are not available here.</p></section>
</main>`;
  await writeFile(path.join(exportRoot, 'index.html'), html, 'utf8');
  await writeFile(path.join(exportRoot, '404.html'), '<main><h1>Not found</h1></main>', 'utf8');

  const result = spawnSync(process.execPath, [VERIFY_SCRIPT, exportRoot, BASE], { encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'other Home contract sections are intentionally absent from this fixture');
  for (const expectedToPass of [
    /Home section wrapper exists: home-game-grid/u,
    /Home section wrapper exists: app-conversion/u,
    /Home grid contains exactly the four approved PREVIEW game cards/u,
    /Games intro exposes All, Preview, and Playable now category controls/u,
    /Search has a visible not-live explanation/u,
    /App conversion exposes store controls in a verifiable disabled state/u,
    /App\/store controls are disabled/u,
  ]) {
    assert.doesNotMatch(result.stderr, expectedToPass);
  }
});
