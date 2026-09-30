#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const read = (rel) => fs.readFileSync(path.join(project, rel), 'utf8');
const home = JSON.parse(read(path.join('pages', 'home.json')));
const nav = JSON.parse(read(path.join('collections', 'navigation.json')));
const advanced = JSON.parse(read(path.join('collections', 'advanced-code.json')));
const symbols = JSON.parse(read(path.join('collections', 'symbols.json')));
const assets = JSON.parse(read(path.join('assets', 'index.json')));
const canonicalAssetManifest = JSON.parse(fs.readFileSync(path.join(repo, 'docs', 'implementation', 'CANONICAL_ASSET_SOURCE_MANIFEST.json'), 'utf8'));
const sha256File = (abs) => crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
const gameIndex = JSON.parse(read(path.join('games', 'index.json')));
const css = read(path.join('reference', 'assets', 'css', 'site.css'));
const html = home.components?.map(c => c?.props?.html || '').join('\n') || '';
const byId = new Map((home.components || []).map(component => [component.id, component]));
const component = (id) => byId.get(id);
const componentHtml = (id) => component(id)?.props?.html || '';
const plainText = (value) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const checks = [];
const check = (id, ok, detail, severity = 'gate') =>
  checks.push({ id, ok: Boolean(ok), severity, detail });
const has = (text, pattern) => pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
const variants = (home.components || []).map(item => item?.props?.variant).filter(Boolean);

check('hero-headline', /(?:Play|Explore) the Feast World for Free\./.test(plainText(componentHtml('component.home.hero'))),
  'The Home hero preserves the approved Feast World/free headline family while allowing the staging truth state.');
check('browser-games', component('component.home.games')?.props?.anchorId === 'browser-games' &&
  component('component.home.games-intro')?.props?.variant === 'games-intro',
  'Browser-game discovery has an immediate, addressable structured section.');
check('feast-pass', component('component.home.feast-pass')?.props?.anchorId === 'feast-pass',
  'The Feast Pass summary has its required section anchor.');
check('today-surface', component('component.home.today')?.props?.anchorId === 'today' && /today-panel/.test(componentHtml('component.home.today')),
  'A dedicated current-adventure/Today surface exists.');
check('discovery-lanes', ['characters', 'world', 'stories-media'].every(id => html.includes(`id='${id}'`)),
  'Character, world, and stories/media discovery lanes are present.');
check('app-conversion', component('component.home.app')?.props?.anchorId === 'app',
  'The flagship mobile-app conversion section has its required anchor.');
check('future-state', component('component.home.whats-next')?.props?.anchorId === 'whats-next',
  'The future-state section has its required anchor.');
check('canonical-toadal', /assets\/images\/characters\/toadal-portrait\.webp/i.test(html) &&
  assets.assets?.some(asset => asset.source === 'reference/assets/images/characters/toadal-portrait.webp' && asset.tags?.includes('canonical')),
  'The canonical Toadal image derivative is used and registered.');
check('hero-canonical-toadal-victory', /assets\/images\/characters\/toadal-victory\.png/i.test(componentHtml('component.home.hero')) &&
  assets.assets?.some(asset => asset.id === 'asset.home.character.toadal-victory' && asset.tags?.includes('canonical')),
  'The hero uses the canonical large Toadal victory pose rather than a generated mascot substitute.');
check('branded-header-crown', /brand-crown\.svg/i.test(css) &&
  assets.assets?.some(asset => asset.id === 'asset.brand.crown'),
  'The shared shell has an explicit canonical brand-crown accent registered in the asset graph.');
const assetById = new Map((assets.assets || []).map(asset => [asset.id, asset]));
const canonicalByRole = new Map((canonicalAssetManifest.required || []).map(asset => [asset.role, asset]));
const victoryAsset = assetById.get('asset.home.character.toadal-victory');
const victoryAuthority = canonicalByRole.get('toadalVictory');
const crownAsset = assetById.get('asset.brand.crown');
const crownAuthority = canonicalByRole.get('brandCrown');
const victoryActualSha = victoryAsset ? sha256File(path.join(project, victoryAsset.source)) : null;
const crownActualSha = crownAsset ? sha256File(path.join(project, crownAsset.source)) : null;
check('hero-toadal-hash-chain', !!victoryAsset && !!victoryAuthority &&
  victoryActualSha === victoryAsset.sha256 &&
  victoryActualSha === victoryAsset.referenceSha256 &&
  victoryActualSha === victoryAuthority.sha256,
  'Hero Toadal bytes match the website asset index and canonical game-asset authority.');
check('brand-crown-hash-chain', !!crownAsset && !!crownAuthority &&
  crownActualSha === crownAsset.sha256 &&
  crownActualSha === crownAsset.referenceSha256 &&
  crownActualSha === crownAuthority.sha256,
  'Brand-crown bytes match the website asset index and canonical game-asset authority.');
check('approved-dense-desktop-bands', /grid-template-areas[\s\S]*games-intro pass[\s\S]*app next/i.test(css),
  'Desktop composition pairs Games with Feast Pass and App conversion with What’s Next, matching the approved dense portal hierarchy.');
check('character-companion-treatment', /\.companion-toggle[\s\S]*background:\s*transparent/i.test(css) &&
  /assets\/images\/characters\/toadal-victory\.png/i.test(componentHtml('component.home.companion')),
  'The contextual companion is character-led rather than an admin-style toggle.');
check('retired-lily-absent', !/(walk_12f|idle_blink_16f_256|catch_open_10f|curated-highres\/princess\/idle\.png)/i.test(html + css),
  'Retired Princess Lily assets are absent from Home markup and styling.');
check('desktop-search-field', /type=["']search["'][^>]*disabled/i.test(componentHtml('component.home.hero')) &&
  /Find your place in the Feast/i.test(componentHtml('component.home.hero')),
  'The approved search-field treatment is visible and honestly disabled.');
check('contextual-companion-source', /data-companion-copy=/i.test(html),
  'Home sections expose distinct contextual companion copy.');
check('contextual-companion-pointer', /addEventListener\(['"]pointer(?:over|enter)['"]/i.test(advanced.javascript || ''),
  'The companion reacts to pointer hover context.');
check('contextual-companion-focus', /addEventListener\(['"]focusin['"]/i.test(advanced.javascript || ''),
  'The companion reacts to keyboard focus context.');
check('companion-minimize-persistence', /localStorage\.setItem\(storageKey/i.test(advanced.javascript || ''),
  'The companion minimize preference persists locally.');
check('reduced-motion', /prefers-reduced-motion\s*:\s*reduce/i.test(css),
  'Reduced-motion behavior is defined.');
check('mobile-breakpoint', /@media\s*\(\s*max-width\s*:\s*(?:420|430)px\s*\)/i.test(css),
  'A small-phone responsive breakpoint is defined.');

const indexedGames = gameIndex.games || [];
const gameRecords = indexedGames.map(entry => JSON.parse(read(entry.file)));
const previewOnly = indexedGames.length === 4 && gameRecords.every(game =>
  game.status === 'preview' && game.web?.enabled === false && !game.web?.launchUrl && !game.web?.buildUrl);
check('preview-truth', previewOnly && component('component.home.games')?.props?.children?.length === 4 &&
  /Playable now[\s\S]*?<span>0<\/span>/i.test(componentHtml('component.home.games-intro')),
  'The four indexed browser games remain preview-only with no launch/build URLs or playable count.');
check('preview-headline-truth', !previewOnly || /Explore the Feast World for Free\./.test(plainText(componentHtml('component.home.hero'))),
  'When Home has zero integrated launch routes, staging uses Explore rather than implying a playable Home launch.');
check('arcade-withheld', !indexedGames.some(game => /arcade/i.test(game.slug || game.id)),
  'The unapproved Arcade candidate is not exposed as a public browser-game record.');
check('store-link-truth', /type=["']button["'][^>]*disabled/i.test(componentHtml('component.home.app')) &&
  /store links are not available|no download link is configured/i.test(componentHtml('component.home.app')),
  'Store conversion is disabled and explains that no verified destination is configured.');

const requiredNav = ['Home', 'Play', 'World', 'Stories', 'Media', 'Feast Pass', 'App'];
const navLabels = new Set((nav.primary || []).map(item => item.label));
check('core-navigation', requiredNav.every(label => navLabels.has(label)),
  'Core navigation labels are present.');
const requiredSymbols = ['SiteHeader', 'SiteFooter', 'RouteShell', 'PrimaryButton', 'SecondaryButton',
  'CreamPanel', 'DarkFeaturePanel', 'SectionHeading', 'StatusChip', 'CategoryTabs', 'SearchField'];
const symbolNames = new Set((symbols.items || []).map(item => String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')));
const normalizedRequiredSymbols = requiredSymbols.map(name => name.toLowerCase().replace(/[^a-z0-9]/g, ''));
check('reusable-shell-components', normalizedRequiredSymbols.every(name => symbolNames.has(name)),
  `Studio symbol-registry coverage: ${normalizedRequiredSymbols.filter(name => symbolNames.has(name)).length}/${requiredSymbols.length}; required named shell components are ${requiredSymbols.join(', ')}.`);

const failures = checks.filter(item => !item.ok && item.severity === 'gate');
const warnings = checks.filter(item => !item.ok && item.severity === 'WARN');
console.log(JSON.stringify({
  schema: 'toadal-feast.home-visual-contract-check.v2',
  repo,
  checks,
  summary: { total: checks.length, pass: checks.filter(item => item.ok).length, fail: failures.length, warn: warnings.length }
}, null, 2));
if (failures.length) process.exitCode = 1;
