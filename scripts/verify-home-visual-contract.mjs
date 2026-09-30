#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const exportDir = process.argv[3] ? path.resolve(process.argv[3]) : null;
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const read = (rel) => fs.readFileSync(path.join(project, rel), 'utf8');
const manifest = JSON.parse(read('project.json'));
const home = JSON.parse(read(path.join('pages', 'home.json')));
const notFound = JSON.parse(read(path.join('pages', '404.json')));
const nav = JSON.parse(read(path.join('collections', 'navigation.json')));
const advanced = JSON.parse(read(path.join('collections', 'advanced-code.json')));
const symbols = JSON.parse(read(path.join('collections', 'symbols.json')));
const patterns = JSON.parse(read(path.join('collections', 'patterns.json')));
const site = JSON.parse(read(path.join('collections', 'site.json')));
const assets = JSON.parse(read(path.join('assets', 'index.json')));
const gameIndex = JSON.parse(read(path.join('games', 'index.json')));
const css = read(path.join('reference', 'assets', 'css', 'site.css'));
const byId = new Map((home.components || []).map(component => [component.id, component]));
const component = (id) => byId.get(id);
const symbolsById = new Map((symbols.items || []).map(symbol => [symbol.id, symbol]));
const resolvedProps = (item) => {
  const symbol = symbolsById.get(item?.props?.symbolId);
  return { ...(symbol?.props || {}), ...(item?.props || {}) };
};
const componentHtml = (id) => resolvedProps(component(id)).html || '';
const html = (home.components || []).map(item => resolvedProps(item).html || '').join('\n');
const collectComponents = (items, output = []) => {
  for (const item of items || []) {
    output.push(item);
    collectComponents(item?.props?.children, output);
  }
  return output;
};
const homeInstances = collectComponents(home.components);
const notFoundInstances = collectComponents(notFound.components);
const patternInstances = (patterns.sectionPatterns || []).flatMap(pattern => collectComponents(pattern.components));
const symbolByName = (name) => (symbols.items || []).find(item =>
  String(item.name || '').toLowerCase() === name.toLowerCase());
const usesSymbol = (instances, symbol) => Boolean(symbol && instances.some(item => item?.props?.symbolId === symbol.id));
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
const homeGameChildren = component('component.home.games')?.props?.children || [];
const actualGameCards = homeGameChildren.filter(child => child?.type === 'game.card');
const whatsNextHtml = componentHtml('component.home.whats-next');
const previewOnly = indexedGames.length === 4 && gameRecords.every(game =>
  game.status === 'preview' && game.web?.enabled === false && !game.web?.launchUrl && !game.web?.buildUrl);
check('preview-truth', previewOnly && actualGameCards.length === 4 &&
  /Playable now[\s\S]*?<span>0<\/span>/i.test(componentHtml('component.home.games-intro')),
  'The four indexed browser games remain preview-only with no Home launch/build URLs and zero playable Home routes.');
check('arcade-reserved-slot', /data-feature-state=['"]CANDIDATE_REQUIRES_WEB_PACKAGE_AUDIT['"]/u.test(whatsNextHtml) &&
  /(?:AUDIT REQUIRED|IN DEVELOPMENT)[\s\S]*?TOADAL FEAST Arcade/iu.test(whatsNextHtml) &&
  /next-card\[data-feature-state=["']CANDIDATE_REQUIRES_WEB_PACKAGE_AUDIT["']\][\s\S]*?border:\s*2px dashed/iu.test(css) &&
  !/<a\b|\bhref\s*=/iu.test(whatsNextHtml) &&
  !indexedGames.some(game => /arcade/i.test(game.slug || game.id)),
  'The Arcade candidate has a visually reserved, dashed development card without a game record or launch route.');
check('preview-headline-truth', !previewOnly || /Explore the Feast World for Free\./.test(plainText(componentHtml('component.home.hero'))),
  'When Home has zero integrated launch routes, staging uses Explore rather than implying a playable Home launch.');
check('arcade-withheld', !indexedGames.some(game => /arcade/i.test(game.slug || game.id)),
  'The unapproved Arcade candidate is not exposed as a public browser-game record.');
check('store-link-truth', /type=["']button["'][^>]*disabled/i.test(componentHtml('component.home.app')) &&
  /store links are not available|download links are not available|no download link is configured/i.test(componentHtml('component.home.app')),
  'Store conversion is disabled and explains that no verified destination is configured.');

const requiredNav = ['Home', 'Play', 'World', 'Stories', 'Media', 'Feast Pass', 'App'];
const navLabels = new Set((nav.primary || []).map(item => item.label));
check('core-navigation', requiredNav.every(label => navLabels.has(label)),
  'Core navigation labels are present.');
const exportedPages = exportDir ? ['index.html', '404.html'].map(name => {
  const file = path.join(exportDir, name);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}) : [];
const genericShellSource = manifest.projectKind === 'generic-site' && Boolean(site.brand) &&
  Array.isArray(nav.primary) && Array.isArray(nav.footer) && notFound.route === '/404.html';
const shellMarkupAvailable = !exportDir || exportedPages.every(Boolean);
const shellPage = (pattern) => shellMarkupAvailable && (exportDir
  ? exportedPages.every(markup => pattern.test(markup))
  : genericShellSource);
const primary = symbolByName('PrimaryButton');
const secondary = symbolByName('SecondaryButton');
const creamPanel = symbolByName('CreamPanel');
const darkPanel = symbolByName('DarkFeaturePanel');
const sectionHeading = symbolByName('SectionHeading');
const statusChip = symbolByName('StatusChip');
const categoryTabs = symbolByName('CategoryTabs');
const toadalCompanion = symbolByName('ToadalCompanion');
const patternUses = (symbol) => usesSymbol(patternInstances, symbol);
const componentFamily = [
  ['SiteHeader', shellPage(/<header class="site-header">[\s\S]*?<nav class="site-nav"/u),
    'Generated generic-site header is emitted for Home and 404.'],
  ['SiteFooter', shellPage(/<footer class="site-footer">[\s\S]*?<div class="site-footer-inner"/u),
    'Generated generic-site footer is emitted for Home and 404.'],
  ['RouteShell', shellPage(/<header class="site-header">[\s\S]*?<main id="main-content">[\s\S]*?<footer class="site-footer">/u),
    'Generated route shell wraps main content on Home and 404.'],
  ['PrimaryButton', primary?.type === 'core.button' && usesSymbol(notFoundInstances, primary),
    'Synchronized core.button symbol has a real 404 route instance.'],
  ['SecondaryButton', secondary?.type === 'core.button' && usesSymbol(notFoundInstances, secondary),
    'Synchronized core.button symbol has real 404 route instances.'],
  ['CreamPanel', creamPanel?.type === 'core.content-section' && creamPanel.props?.variant === 'cream-panel' &&
    usesSymbol(notFoundInstances, creamPanel) && css.includes('.studio-content-section[data-studio-variant="cream-panel"]'),
    'Reusable core.content-section symbol is used by 404 and styled as a cream panel.'],
  ['DarkFeaturePanel', darkPanel?.type === 'core.rich-text' && darkPanel.props?.variant === 'dark-feature-panel' &&
    usesSymbol(homeInstances, darkPanel) && /class=.feast-pass-panel./u.test(darkPanel.props?.html || '') &&
    css.includes('data-studio-variant="dark-feature-panel"'),
    'Reusable dark feature symbol supplies the truthful Feast Pass summary on Home.'],
  ['SectionHeading', sectionHeading?.type === 'core.text' && sectionHeading.props?.tag === 'h2' &&
    patternUses(sectionHeading),
    'Reusable core.text h2 symbol is available through a Studio section pattern.'],
  ['StatusChip', statusChip?.type === 'core.badges' && Array.isArray(statusChip.props?.items) &&
    statusChip.props.items.length > 0 && patternUses(statusChip) && css.includes('.studio-badges .chip'),
    'Reusable native core.badges symbol is available through a Studio section pattern.'],
  ['CategoryTabs', categoryTabs?.type === 'core.rich-text' && usesSymbol(homeInstances, categoryTabs) &&
    /class=.game-tabs./u.test(categoryTabs.props?.html || '') && /data-game-tab=/u.test(categoryTabs.props?.html || '') &&
    /querySelector\(['"]\.game-tabs['"]\)/u.test(advanced.javascript || '') && patternUses(categoryTabs),
    'Symbolized category-filter markup is wired to the Home filter behavior and reusable via a Studio pattern.'],
  ['ToadalCompanion', toadalCompanion?.type === 'core.rich-text' && usesSymbol(homeInstances, toadalCompanion) &&
    /data-companion-toggle/u.test(toadalCompanion.props?.html || '') && /function initCompanion/u.test(advanced.javascript || '') &&
    patternUses(toadalCompanion),
    'Symbolized companion markup is wired to the Home interaction behavior and reusable via a Studio pattern.'],
];
componentFamily.forEach(([name, ok, detail]) => check(`reusable-${name}`, ok, detail));
const familyCovered = componentFamily.filter(([, ok]) => ok).length;
check('reusable-shell-components', familyCovered === 11,
  `Studio-native implementation coverage: ${familyCovered}/11; global renderer shell, synchronized symbols, and real section patterns are checked by type, references, behavior, and generated output${exportDir ? ` (${exportDir})` : ' (source-only invocation)'}.`);

const failures = checks.filter(item => !item.ok && item.severity === 'gate');
const warnings = checks.filter(item => !item.ok && item.severity === 'WARN');
console.log(JSON.stringify({
  schema: 'toadal-feast.home-visual-contract-check.v3',
  repo,
  checks,
  summary: { total: checks.length, pass: checks.filter(item => item.ok).length, fail: failures.length, warn: warnings.length }
}, null, 2));
if (failures.length) process.exitCode = 1;
