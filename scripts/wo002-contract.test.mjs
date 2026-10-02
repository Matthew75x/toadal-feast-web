import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectManifestPath = process.env.TOADAL_PROJECT
  ? path.resolve(process.cwd(), process.env.TOADAL_PROJECT)
  : path.join(repoRoot, 'studio-project', 'toadal-feast-website', 'project.json');
const projectRoot = path.dirname(projectManifestPath);
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function readProjectJson(relativePath) {
  return readJson(path.join(projectRoot, relativePath));
}

const project = readJson(projectManifestPath);
const pageIndex = readProjectJson(project.pageIndex);
const gameIndex = readProjectJson(project.gameIndex);
const navigation = readProjectJson(project.navigation);
const cartridgeSchema = readJson(path.join(repoRoot, 'docs', 'implementation', 'game-cartridge.schema.json'));
const pages = pageIndex.pages.map((record) => ({
  ...record,
  document: readProjectJson(record.file),
}));
const games = gameIndex.games.map((record) => ({
  ...record,
  document: readProjectJson(record.file),
}));
const pageByRoute = new Map(pages.map((page) => [page.route, page]));
const gameBySlug = new Map(games.map((game) => [game.slug, game]));

// Remove only owner-editor metadata attributes for semantic contract matching.
function semanticMarkup(markup) {
  return markup.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/\sdata-studio-(?:component|edit-field)=(['"])[^'"]*\1/g, ''));
}

function componentHtml(page, variant) {
  const component = page.document.components.find((entry) =>
    (entry.type === 'core.rich-text' || entry.props?.authoringVersion) && entry.props?.variant === variant,
  );
  assert.ok(component, `${page.route} must contain authored component variant ${variant}`);
  return semanticMarkup(projectPage(projectRoot, { ...page.document, components: [component] }));
}

function pageHtml(page) {
  return page.document.components
    .filter((component) => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map((component) => semanticMarkup(projectPage(projectRoot, { ...page.document, components: [component] })))
    .join('\n');
}

function htmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] ?? match[2]) : null;
}

function walkFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  };
  visit(root);
  return files;
}

function assertSchemaValue(value, schema, label) {
  const types = schema.type == null ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.length) {
    const matchesType = (type) => {
      if (type === 'null') return value === null;
      if (type === 'array') return Array.isArray(value);
      if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
      if (type === 'integer') return Number.isInteger(value);
      if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
      return typeof value === type;
    };
    assert.ok(types.some(matchesType), `${label} must have schema type ${types.join(' or ')}`);
  }

  if (Object.hasOwn(schema, 'const')) assert.deepEqual(value, schema.const, `${label} must equal its schema const`);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${label} must be one of ${schema.enum.join(', ')}`);
  if (schema.pattern && typeof value === 'string') {
    assert.match(value, new RegExp(schema.pattern), `${label} must match ${schema.pattern}`);
  }
  if (schema.minLength != null && typeof value === 'string') {
    assert.ok(value.length >= schema.minLength, `${label} must have at least ${schema.minLength} characters`);
  }
  if (schema.minimum != null && typeof value === 'number') {
    assert.ok(value >= schema.minimum, `${label} must be at least ${schema.minimum}`);
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      assert.ok(Object.hasOwn(value, key), `${label}.${key} is required by the cartridge schema`);
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) assertSchemaValue(value[key], childSchema, `${label}.${key}`);
    }
    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(value)) {
        assert.ok(allowed.has(key), `${label}.${key} is not allowed by the cartridge schema`);
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => assertSchemaValue(item, schema.items, `${label}[${index}]`));
  }
}

test('page registry retains core play/Stories routes, approved game details, and only the qualified Wicked Bites player route', () => {
  const expectedGameRoutes = [
    '/games/wicked-bites/',
    '/games/claw-feed-gulper/',
    '/games/toadal-tower-defense/',
    '/games/froggy-fruity-bash/',
  ];
  const routes = pages.map((page) => page.route);
  assert.equal(new Set(routes).size, routes.length, 'page routes must be unique');
  const requiredRoutes = [
    '/', '/play/', '/stories/', '/manga/', '/reader/',
    ...expectedGameRoutes, '/player/wicked-bites/',
  ];
  for (const route of requiredRoutes) {
    assert.ok(routes.includes(route), `page registry must retain required route ${route}`);
  }
  assert.deepEqual(
    routes.filter((route) => route.startsWith('/games/')).sort(),
    expectedGameRoutes.sort(),
    'the qualified WO-002 game-detail contract must remain unchanged',
  );
  for (const page of pages) {
    assert.equal(page.document.route, page.route, `${page.file} route must match the registry`);
  }
  assert.deepEqual(
    routes.filter((route) => route.startsWith('/player/')),
    ['/player/wicked-bites/'],
    'only Wicked Bites may have a player route',
  );
});

test('all four registered games and every Play card remain PREVIEW', () => {
  assert.deepEqual(
    games.map((game) => game.slug).sort(),
    ['wicked-bites', 'claw-feed-gulper', 'toadal-tower-defense', 'froggy-fruity-bash'].sort(),
  );
  for (const game of games) {
    assert.equal(game.document.status, 'preview', `${game.slug} registry status`);
    assert.equal(game.document.statusLabel, 'PREVIEW', `${game.slug} visible status label`);
    assert.equal(game.document.web.browserCartridge.publicState, 'PREVIEW', `${game.slug} cartridge state`);
  }

  const playPage = pageByRoute.get('/play/');
  assert.ok(playPage, 'Play page must be registered');
  const html = componentHtml(playPage, 'wo002-play-hub');
  const cards = [...html.matchAll(/<article\b[^>]*class=(['"])[^'"]*\bplay-card\b[^'"]*\1[^>]*>/g)]
    .map(([tag]) => ({
      id: htmlAttribute(tag, 'data-game-id'),
      status: htmlAttribute(tag, 'data-game-status'),
    }));
  assert.equal(cards.length, games.length, 'Play must show exactly one card for each registered game');
  assert.deepEqual(cards.map((card) => card.id).sort(), games.map((game) => game.slug).sort());
  assert.ok(cards.every((card) => card.status === 'preview'), 'every card must advertise PREVIEW');
});

test('Home preserves approved hero, truthful game states, live guest-local Feast Pass, and disabled store links', () => {
  const homePage = pageByRoute.get('/');
  assert.ok(homePage, 'Home page must be registered');
  const hero = componentHtml(homePage, 'home-hero');
  const headings = [...hero.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map(([, text]) => text.replace(/<[^>]*>/g, '').trim());
  assert.deepEqual(headings, ['Play the Feast World for Free.']);

  const heroLinks = [...hero.matchAll(/<a\b[^>]*>/gi)].map(([tag]) => ({
    href: htmlAttribute(tag, 'href'),
    className: htmlAttribute(tag, 'class') ?? '',
  }));
  assert.ok(
    heroLinks.some((link) => link.href === '/play/' && /\bbutton-link--primary\b/.test(link.className)),
    'primary Home hero CTA must lead to /play/',
  );

  const gameIntro = componentHtml(homePage, 'games-intro');
  assert.match(hero, /isolated, session-only browser preview/i);
  assert.match(gameIntro, /Wicked Bites runs as a session-only staging preview/i);
  assert.match(gameIntro, /CLAW is held for origin-safety requalification/i);
  assert.match(gameIntro, /two entries are concepts/i);
  assert.match(gameIntro, /Nothing is marked PUBLIC\./i);
  assert.equal(homePage.document.seo.title, homePage.document.title,
    'Home SEO title should stay aligned with its visible title');
  assert.equal(homePage.document.seo.description, homePage.document.description,
    'Home SEO description should stay aligned with its route description');
  const publicEmptyState = pageHtml(homePage);
  assert.match(publicEmptyState, /No PUBLIC browser games are available yet/,
    'the empty public filter should explain the actual public-state gate');
  assert.doesNotMatch(publicEmptyState, /Qualified staging previews are being connected/,
    'the empty public filter must not claim the player integration is still pending');

  const gameGrid = homePage.document.components.find((component) => component.props?.variant === 'home-game-grid');
  assert.ok(gameGrid, 'Home must retain its structured game-card grid');
  assert.deepEqual(
    gameGrid.props.children.map((child) => child.props.gameId).sort(),
    games.map((game) => game.id).sort(),
    'Home game grid must reference all four registry games',
  );
  for (const slug of ['toadal-tower-defense', 'froggy-fruity-bash']) {
    assert.match(gameBySlug.get(slug).document.description, /concept/i, `${slug} must remain described as a concept`);
  }

  const feastPass = componentHtml(homePage, 'feast-pass');
  assert.match(feastPass, /GUEST PROGRESS · THIS BROWSER/);
  assert.match(feastPass, /data-progression-page/);
  for (const stat of ['level', 'xp', 'sparks', 'treats']) {
    assert.match(feastPass, new RegExp(`data-progression-stat=['"]${stat}['"]`), `Home Feast Pass must render real local ${stat} state`);
  }
  // The copy is intentionally concise; keep asserting the product truth, not a fixed sentence.
  assert.match(feastPass, /account sync is (?:not available|unavailable)/i);
  assert.doesNotMatch(feastPass, /Guest-first progression is planned|no level, XP, Sparks, Treats/i);

  const appConversion = componentHtml(homePage, 'app-conversion');
  const storeButtons = [...appConversion.matchAll(/<button\b[^>]*class=['"][^'"]*\bstore-badge\b[^'"]*['"][^>]*>/gi)]
    .map(([tag]) => tag);
  assert.equal(storeButtons.length, 2, 'Home should show the two expected app-store badges');
  assert.ok(
    storeButtons.every((tag) => /\sdisabled(?:\s|=|>)/i.test(tag) && htmlAttribute(tag, 'href') === null),
    'app-store badges must remain disabled buttons until verified store URLs exist',
  );
  assert.match(appConversion, /store links remain unavailable until verified destinations exist/i);
  assert.match(appConversion, /Verified store links are not configured/i);
});

test('Home companion is present and each context has its own copy', () => {
  const homePage = pageByRoute.get('/');
  assert.ok(homePage, 'Home page must be registered');
  const markup = pageHtml(homePage);
  assert.match(markup, /<aside\b[^>]*\bdata-companion(?:\s|>|=)/i, 'contextual companion must be present');
  const contexts = [...markup.matchAll(/<[^>]*\bdata-companion-context=(?:"[^"]+"|'[^']+')[^>]*>/gi)]
    .map(([tag]) => tag);
  assert.ok(contexts.length >= 5, 'Home should provide context across its major sections');
  assert.ok(
    contexts.every((tag) => htmlAttribute(tag, 'data-companion-copy') !== null),
    'each Home companion context must declare its truthful copy',
  );
});

test('launch gating exposes only the Wicked Bites preview and keeps CLAW held', () => {
  const wicked = gameBySlug.get('wicked-bites')?.document;
  const claw = gameBySlug.get('claw-feed-gulper')?.document;
  assert.ok(wicked && claw, 'Wicked Bites and CLAW must both be registered');
  assert.equal(wicked.web.enabled, true);
  assert.equal(wicked.web.browserCartridge.entry, '/public/games/wicked-bites/index.html');
  assert.equal(wicked.web.browserCartridge.publicState, 'PREVIEW');

  assert.equal(claw.web.enabled, false, 'CLAW website launch must remain disabled');
  assert.equal(claw.web.browserCartridge.runnable, false);
  assert.equal(claw.web.browserCartridge.launchHeld, true);
  assert.equal(claw.web.browserCartridge.entry, null);
  assert.match(claw.web.browserCartridge.reason, /requalification/i);

  const detailLaunches = pages
    .filter((page) => page.route.startsWith('/games/'))
    .flatMap((page) => [...componentHtml(page, 'wo002-game-detail').matchAll(/\bhref=(['"])(\/player\/[^'"]+)\1/g)]
      .map((match) => ({ route: page.route, href: match[2] })));
  assert.deepEqual(detailLaunches, [{ route: '/games/wicked-bites/', href: '/player/wicked-bites/' }]);

  const playerPage = pageByRoute.get('/player/wicked-bites/');
  assert.ok(playerPage, 'Wicked Bites player page must exist');
  const playerHtml = componentHtml(playerPage, 'wo002-browser-player');
  const iframeSources = [...playerHtml.matchAll(/<iframe\b[^>]*\bsrc=(['"])([^'"]+)\1[^>]*>/g)]
    .map((match) => match[2]);
  assert.deepEqual(iframeSources, ['/public/games/wicked-bites/index.html']);
  const iframeTag = playerHtml.match(/<iframe\b[^>]*>/i)?.[0];
  assert.ok(iframeTag, 'player must contain its cartridge iframe');
  assert.equal(htmlAttribute(iframeTag, 'sandbox'), 'allow-scripts allow-pointer-lock');
  assert.doesNotMatch(iframeTag, /\ballow-same-origin\b/, 'opaque-origin sandbox must not grant same-origin');
  assert.equal(htmlAttribute(iframeTag, 'referrerpolicy'), 'origin');
  assert.equal(htmlAttribute(iframeTag, 'allow'), 'fullscreen',
    'the iframe should receive only its declared fullscreen capability');
  const siteCss = fs.readFileSync(path.join(projectRoot, 'reference', 'assets', 'css', 'site.css'), 'utf8');
  assert.match(siteCss, /\.wo002-player-frame:focus-visible\s*\{[^}]*outline:/,
    'keyboard focus on the isolated game iframe must have a visible host-side indicator');
  assert.match(siteCss, /\.wo002-player-frame-wrap:focus-within,\s*\.wo002-player-frame-wrap\.wo002-player-frame-focused\s*\{[^}]*outline:/,
    'the player host must show focus when browser focus enters the sandboxed iframe');
  const advancedCode = JSON.parse(fs.readFileSync(path.join(projectRoot, 'collections', 'advanced-code.json'), 'utf8'));
  assert.match(advancedCode.javascript, /window\.addEventListener\('blur', function \(\) \{ if \(document\.activeElement === frame\) setFrameFocusIndicator\(\); \}\);/,
    'the host must detect focus entering the opaque-origin iframe without inspecting cartridge internals');
  assert.equal(htmlAttribute(iframeTag, 'allow'), 'fullscreen',
    'the iframe should receive only its declared fullscreen capability');
  const toolbarTag = playerHtml.match(/<div\b[^>]*class=(['"])wo002-player-toolbar\1[^>]*>/i)?.[0];
  assert.ok(toolbarTag, 'player toolbar must exist');
  assert.equal(htmlAttribute(toolbarTag, 'role'), 'group');
  assert.equal(htmlAttribute(toolbarTag, 'aria-label'), 'Browser player controls');
  assert.match(playerHtml, /<button\b[^>]*\bdata-player-fullscreen-exit\b[^>]*>Exit full screen<\/button>/i);
  assert.doesNotMatch(playerHtml, /claw-feed-gulper/i, 'the player must not mention or load CLAW');
});

test('player host enforces opaque-origin identity and does not echo ready/init', () => {
  const playerHost = readProjectJson(project.collections.advancedCode).javascript;
  assert.match(
    playerHost,
    /event\.source\s*!==\s*frame\.contentWindow\s*\|\|\s*event\.origin\s*!==\s*'null'/,
    'host must accept messages only from its opaque-origin iframe window',
  );
  assert.match(playerHost, /if\s*\(message\.gameId\s*!==\s*gameId\)\s*return;/,
    'host must require an exact matching gameId');
  assert.match(playerHost, /function onFrameLoad\(\)[\s\S]*?send\('host:init'/,
    'host init should be sent on the verified iframe load');
  assert.equal([...playerHost.matchAll(/send\('host:init'/g)].length, 1,
    'the host should issue init once rather than echoing it after readiness');
  const readyBranch = playerHost.match(/if\s*\(message\.type\s*===\s*'game:ready'\)\s*\{([\s\S]*?)\}\s*else if\s*\(message\.type\s*===\s*'game:started'/);
  assert.ok(readyBranch, 'host must explicitly handle game:ready');
  assert.doesNotMatch(readyBranch[1], /\bsend\s*\(/,
    'handling game:ready must not echo ready or re-issue host:init');
  assert.match(playerHost, /function start\(\)\s*\{\s*if\s*\(window\.self\s*!==\s*window\.top\)\s*return;/,
    'global site runtime must skip iframe documents');
  assert.match(playerHost, /if\s*\(fullscreenExit\)\s*fullscreenExit\.hidden\s*=\s*!active/,
    'the dedicated exit control must appear while the player is fullscreen');
  assert.match(playerHost, /send\('host:visibility',\s*\{\s*visibility:\s*document\.hidden\s*\?/,
    'the host should communicate visibility changes to the isolated cartridge');
});

test('Wicked Bites cartridge conforms to the schema and preserves qualified provenance', () => {
  const packageRoot = path.join(projectRoot, 'reference', 'public', 'games');
  assert.ok(fs.existsSync(packageRoot), 'public game package directory must exist');
  assert.deepEqual(
    fs.readdirSync(packageRoot).sort(),
    ['wicked-bites'],
    'only the Wicked Bites package may be present under public/games (no CLAW package or loose bundle)',
  );

  const wickedRoot = path.join(packageRoot, 'wicked-bites');
  const manifestPath = path.join(wickedRoot, 'cartridge.json');
  assert.ok(fs.existsSync(manifestPath), 'Wicked Bites cartridge manifest must exist');
  const manifest = readJson(manifestPath);
  assertSchemaValue(manifest, cartridgeSchema, 'cartridge');
  for (const key of cartridgeSchema.required) {
    assert.ok(Object.hasOwn(manifest, key), `cartridge.${key} is required by the declared schema`);
  }

  assert.equal(manifest.id, 'wicked-bites');
  assert.equal(manifest.displayName, 'Wicked Bites');
  assert.equal(manifest.version, '5.5');
  assert.equal(manifest.publicState, 'PREVIEW');
  assert.equal(manifest.entry, 'index.html');
  assert.equal(manifest.inputs.gamepad, false,
    'the verified donor does not claim gamepad input support');
  assert.equal(manifest.protocol.name, 'toadal.game');
  assert.equal(manifest.protocol.version, 1);
  assert.equal(manifest.storage.persistence, 'none',
    'the opaque-origin preview only has in-memory fallback saves, not reload-persistent storage');
  assert.equal(manifest.fullscreen, true);
  assert.equal(manifest.mobileSupport, true);
  assert.ok(manifest.knownLimitations.length >= 1);

  assert.deepEqual(manifest.source, {
    repository: 'Matthew75x/feast-crossing-wicked-bites',
    ref: '6fff3c89605092ba5c5e122565cb98415c8ab5e5',
    entrySource: 'dist/PLAY_FEAST_CROSSING_WICKED_BITES_V5_5_MOTION_JUICE.html',
    sourceHash: 'a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5',
  });
  const wickedEvidence = gameBySlug.get('wicked-bites').document.evidence;
  assert.equal(manifest.source.repository, wickedEvidence.repository);
  assert.equal(manifest.source.ref, wickedEvidence.commit);
  assert.equal(manifest.source.sourceHash, wickedEvidence.entrySha256);
  assert.deepEqual(manifest.donorPackage, {
    files: 1,
    bytes: 1462042,
    sha256: 'a6d0772c608ff50e042f319dcb5cabe612cafeb656a2a19f922cc5f4068b50b5',
  });
  assert.deepEqual(manifest.package, {
    files: 2,
    bytes: 1467205,
    sha256: 'd775a2fd2ee236b0b0171732f0d7202b6c95c1b1eb11127e86c9949963851153',
  });
  assert.equal(
    manifest.packageHashMethod,
    'SHA-256 of sorted path/hash ledger for runtime files only; cartridge.json excluded to avoid self-reference.',
  );

  const allPackageFiles = walkFiles(wickedRoot);
  assert.ok(allPackageFiles.some((file) => path.basename(file) === 'index.html'));
  assert.ok(allPackageFiles.some((file) => path.basename(file) === 'cartridge.json'));
  assert.ok(allPackageFiles.every((file) => !/claw-feed-gulper/i.test(file)));
  const runtimeFiles = allPackageFiles
    .filter((file) => path.relative(wickedRoot, file).replaceAll('\\', '/') !== 'cartridge.json')
    .map((file) => ({
      path: path.relative(wickedRoot, file).replaceAll('\\', '/'),
      // Runtime package files are canonical UTF-8/LF text. Normalize only CRLF
      // checkout conversion so package accounting matches the committed bytes.
      bytes: Buffer.from(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), 'utf8'),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert.deepEqual(runtimeFiles.map((file) => file.path), ['index.html', 'toadal-bridge.js']);
  assert.equal(runtimeFiles.length, manifest.package.files, 'runtime file count must match package profile');
  assert.equal(
    runtimeFiles.reduce((sum, file) => sum + file.bytes.length, 0),
    manifest.package.bytes,
    'runtime package byte count must use canonical UTF-8/LF bytes (CRLF checkout conversion normalized)',
  );
  const ledger = `${runtimeFiles.map(({ path: relativePath, bytes }) =>
    `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${relativePath}`,
  ).join('\n')}\n`;
  assert.equal(
    crypto.createHash('sha256').update(ledger).digest('hex'),
    manifest.package.sha256,
    'runtime package ledger hash must match its recorded profile',
  );
  const bridgeShim = fs.readFileSync(path.join(wickedRoot, 'toadal-bridge.js'), 'utf8');
  assert.match(bridgeShim, /'host:visibility'/,
    'the compatibility adapter should accept the contracted host visibility message');
  assert.match(bridgeShim, /host:visibility'\s*&&\s*message\.payload\?\.visibility\s*===\s*'hidden'/,
    'hidden host visibility should pause the running donor');
  assert.match(bridgeShim, /host:visibility'\s*&&\s*message\.payload\?\.visibility\s*===\s*'visible'/,
    'visible host visibility should resume a paused donor');
});

test('primary and footer navigation both route to Play', () => {
  for (const zone of ['primary', 'footer']) {
    const playLinks = navigation[zone].filter((link) => link.id === 'play');
    assert.equal(playLinks.length, 1, `${zone} navigation must have one Play link`);
    assert.equal(playLinks[0].href, '/play/');
  }
});

test('static link verifier scans markup attributes without mistaking runtime JavaScript for missing files', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-wo002-static-links-'));
  try {
    const html = path.join(fixtureRoot, 'index.html');
    const verifier = path.join(repoRoot, 'scripts', 'verify-static-links.mjs');
    fs.writeFileSync(html, '<!doctype html><script>frame.src = \'about:blank\';</script><img src="/missing.png">', 'utf8');
    const missing = spawnSync(process.execPath, [verifier, fixtureRoot, '/'], { encoding: 'utf8' });
    assert.notEqual(missing.status, 0, 'a real missing markup asset must still fail');
    assert.match(missing.stderr, /missing\.png/);
    assert.doesNotMatch(missing.stderr, /about:blank/,
      'runtime-only JavaScript navigation must not be treated as an exported static link');

    fs.writeFileSync(path.join(fixtureRoot, 'missing.png'), 'fixture', 'utf8');
    const complete = spawnSync(process.execPath, [verifier, fixtureRoot, '/'], { encoding: 'utf8' });
    assert.equal(complete.status, 0, complete.stderr);
    assert.match(complete.stdout, /STATIC LINK CHECK PASS/);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
