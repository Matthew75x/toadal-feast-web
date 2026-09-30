#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const read = (rel) => fs.readFileSync(path.join(project, rel), 'utf8');
const home = JSON.parse(read(path.join('pages', 'home.json')));
const nav = JSON.parse(read(path.join('collections', 'navigation.json')));
const advanced = JSON.parse(read(path.join('collections', 'advanced-code.json')));
const site = JSON.parse(read(path.join('collections', 'site.json')));
const pagesIndex = JSON.parse(read(path.join('pages', 'index.json')));
const symbols = JSON.parse(read(path.join('collections', 'symbols.json')));
const assets = JSON.parse(read(path.join('assets', 'index.json')));
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

check('hero-headline', /Explore the Feast World for Free\./.test(plainText(componentHtml('component.home.hero'))),
  'The authoritative Home headline is present in the structured Studio hero.');
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
check('arcade-withheld', !indexedGames.some(game => /arcade/i.test(game.slug || game.id)),
  'The unapproved Arcade candidate is not exposed as a public browser-game record.');
check('store-link-truth', /type=["']button["'][^>]*disabled/i.test(componentHtml('component.home.app')) &&
  /store links are not available|download links are not available|no download link is configured/i.test(componentHtml('component.home.app')),
  'Store conversion is disabled and explains that no verified destination is configured.');

const requiredNav = ['Home', 'Play', 'World', 'Stories', 'Media', 'Feast Pass', 'App'];
const navLabels = new Set((nav.primary || []).map(item => item.label));
check('core-navigation', requiredNav.every(label => navLabels.has(label)),
  'Core navigation labels are present.');
const normalizeName = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const symbolItems = symbols.items || [];
const findSymbol = name => symbolItems.find(item => normalizeName(item.name) === normalizeName(name));
const cssHas = pattern => pattern.test(css);
const reuseArchitecture = {
  SiteHeader: Boolean(site.brand && (nav.primary || []).length >= 7 && cssHas(/\.site-header\b/)),
  SiteFooter: Boolean((nav.footer || []).length >= 1 && cssHas(/\.site-footer\b/)),
  RouteShell: Boolean((pagesIndex.pages || []).some(page => page.route === '/') &&
    (pagesIndex.pages || []).some(page => page.route === '/404.html' || page.route === '/404') &&
    cssHas(/\.site-main\b|main\s*\{/)),
  PrimaryButton: Boolean(findSymbol('Primary button')?.type === 'core.button' &&
    findSymbol('Primary button')?.props?.kind === 'primary'),
  SecondaryButton: Boolean(findSymbol('Secondary button')?.type === 'core.button' &&
    findSymbol('Secondary button')?.props?.kind === 'secondary'),
  CreamPanel: Boolean(cssHas(/\.today-panel\b/) && cssHas(/\.app-conversion-panel\b/) &&
    cssHas(/background:\s*var\(--cream-50\)/)),
  DarkFeaturePanel: Boolean(cssHas(/\.feast-pass-panel\b/) &&
    cssHas(/background:\s*var\(--chocolate-800\)/)),
  SectionHeading: Boolean(cssHas(/\.section-heading\b/) && /class=['"]section-heading['"]/.test(html)),
  StatusChip: Boolean(cssHas(/\.status-chip\b/) && /class=['"][^'"]*status-chip/.test(html)),
  CategoryTabs: Boolean(['all', 'preview', 'public'].every(value =>
    new RegExp(`data-game-tab=['"]${value}['"]`).test(componentHtml('component.home.games-intro'))) &&
    /data-game-tab/i.test(advanced.javascript || '')),
  SearchField: Boolean(/class=['"]home-search['"]/.test(componentHtml('component.home.hero')) &&
    /type=['"]search['"][^>]*disabled/i.test(componentHtml('component.home.hero')))
};
const requiredReuse = Object.keys(reuseArchitecture);
const reusableCount = requiredReuse.filter(name => reuseArchitecture[name]).length;
check('reusable-shell-components', reusableCount === requiredReuse.length,
  `Effective reusable architecture coverage: ${reusableCount}/${requiredReuse.length}. ` +
  requiredReuse.map(name => `${name}=${reuseArchitecture[name] ? 'yes' : 'no'}`).join(', ') +
  '. Header/footer/route shell are shared Studio collections; visual primitives may be token/CSS patterns rather than fake unused symbols.');

const failures = checks.filter(item => !item.ok && item.severity === 'gate');
const warnings = checks.filter(item => !item.ok && item.severity === 'WARN');
console.log(JSON.stringify({
  schema: 'toadal-feast.home-visual-contract-check.v2',
  repo,
  checks,
  summary: { total: checks.length, pass: checks.filter(item => item.ok).length, fail: failures.length, warn: warnings.length }
}, null, 2));
if (failures.length) process.exitCode = 1;
