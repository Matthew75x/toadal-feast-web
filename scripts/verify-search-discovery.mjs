#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const errors = [];
const ok = (condition, message) => { if (!condition) errors.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const pagesIndex = readJson(path.join(site, 'pages', 'index.json'));
const routes = new Map((pagesIndex.pages || []).map((p) => [p.route, p]));

ok(routes.has('/search/'), 'search route is not registered');
ok(routes.has('/roadmap/'), 'manifest Roadmap route is not registered');
ok(routes.has('/leaderboards/'), 'manifest Leaderboards route is not registered');
ok(routes.has('/news/devlog/'), 'manifest News Article / Devlog route is not registered');
const searchRecord = routes.get('/search/');
const searchPage = searchRecord ? readJson(path.join(site, searchRecord.file)) : null;
const searchHtml = searchPage?.components?.map((x) => x?.props?.html || '').join('\n') || '';
for (const token of ['data-site-search','data-search-input','data-search-category','data-search-results','data-search-status']) {
  ok(searchHtml.includes(token), `search page missing ${token}`);
}
ok(searchPage?.publicationState === 'noindex', 'search page must remain noindex on staging');

const support = readJson(path.join(site, 'pages', 'support.json'));
const supportHtml = support.components.map((x) => x?.props?.html || '').join('\n');
ok(supportHtml.includes('data-support-search'), 'support search control missing');
for (const id of ['preview-states','guest-progress','app-status','contact-status','legal-status']) {
  ok(supportHtml.includes(`id='${id}'`) || supportHtml.includes(`id="${id}"`), `support anchor missing: ${id}`);
}

const media = readJson(path.join(site, 'pages', 'media.json'));
const mediaHtml = media.components.map((x) => x?.props?.html || '').join('\n');for (const id of ['world-art','character-art']) {
  ok(mediaHtml.includes(`id='${id}'`) || mediaHtml.includes(`id="${id}"`), `media anchor missing: ${id}`);
}

const advanced = readJson(path.join(site, 'collections', 'advanced-code.json')).javascript || '';
ok(advanced.includes('function initLocalSearchLoader()'), 'advanced code search loader missing');
ok(advanced.includes('/assets/js/site-search.js'), 'advanced code does not load site-search.js');

const runtimePath = path.join(site, 'reference', 'assets', 'js', 'site-search.js');
ok(fs.existsSync(runtimePath), 'site-search.js missing');
const runtime = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : '';
for (const token of ['textContent','replaceChildren','URLSearchParams','data-support-search']) {
  ok(runtime.includes(token), `site-search runtime missing ${token}`);
}

const indexPath = path.join(site, 'reference', 'assets', 'data', 'local-search-index.json');
ok(fs.existsSync(indexPath), 'local-search-index.json missing; run build-local-search-index.mjs');
const index = fs.existsSync(indexPath) ? readJson(indexPath) : { entries: [] };
ok(index.schema === 'toadal-feast.local-search.v1', 'unexpected local search schema');
ok(Array.isArray(index.entries) && index.entries.length > 0, 'local search index is empty');
const ids = new Set();
for (const entry of index.entries || []) {
  ok(!ids.has(entry.id), `duplicate search id: ${entry.id}`);
  ids.add(entry.id);
  // Roadmap became a real manifest route during final closure; generic route validation below now governs it.
  const [routePath, fragment = ''] = String(entry.route || '').split('#');
  const normalized = routePath || '/';
  ok(routes.has(normalized) || normalized === '/', `search target route missing: ${entry.route}`);
  if (!fragment) continue;  const record = routes.get(normalized === '' ? '/' : normalized);
  if (!record) continue;
  const page = readJson(path.join(site, record.file));
  const serialized = JSON.stringify(page);
  const hasId = serialized.includes(`id='${fragment}'`) || serialized.includes(`id=\"${fragment}\"`) || serialized.includes(`\"anchorId\":\"${fragment}\"`);
  ok(hasId, `search target fragment missing: ${entry.route}`);
}

const groups = (index.entries || []).reduce((m, e) => { m[e.group] = (m[e.group] || 0) + 1; return m; }, {});
const requiredGroups = ['Pages','Characters','Media','Help','Roadmap'];
for (const group of requiredGroups) ok(groups[group] > 0, `search group empty: ${group}`);

if (errors.length) {
  console.error('SEARCH / DISCOVERY VERIFY: FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log('SEARCH / DISCOVERY VERIFY: PASS');
console.log(JSON.stringify({
  routeCount: routes.size,
  searchEntries: index.entries.length,
  groups,
  searchRoute: '/search/',
  externalSearchService: false
}, null, 2));
