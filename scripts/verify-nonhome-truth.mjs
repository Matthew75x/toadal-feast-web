#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const pagesDir = path.join(site, 'pages');
const errors = [];
const notes = [];
const ok = (condition, message) => { if (!condition) errors.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const index = readJson(path.join(pagesDir, 'index.json'));
const records = index.pages || [];
const routes = new Map(records.map((record) => [record.route, record]));
const nonHome = records.filter((record) => record.route !== '/');

const currentRoutes = [
  '/search/',
  '/characters/',
  '/characters/toadal/',
  '/stories/',
  '/manga/',
  '/reader/',
  '/feast-pass/',
  '/feast-pass/quests/',
  '/feast-pass/rewards/',
  '/profile/'
];
for (const route of currentRoutes) ok(routes.has(route), `current route missing: ${route}`);

const forbidden = [
  ['search is coming soon', 'Search is implemented at /search/.'],
  ['search is not live', 'Search is implemented at /search/.'],
  ['search is unavailable', 'Search is implemented at /search/.'],
  ['feast pass is planned for later work', 'Guest-local Feast Pass progression is implemented.'],
  ['guest-first progression is planned for later work', 'Guest-local Feast Pass progression is implemented.'],
  ['there are no live levels', 'Guest-local Level/XP/Sparks state is implemented.'],
  ['character profiles are not published on this site', 'The Toadal profile preview is implemented.'],
  ['no stories or media library is published here', 'Stories/Manga/Reader preview surfaces are implemented.'],
  ['stories and media do not have a published library here', 'Stories/Manga/Reader preview surfaces are implemented.'],
  ['guest collection coming later', 'Browser-local progression is already implemented.'],
  ['will connect to browser-local progression', 'Browser-local progression is already implemented.'],
  ['before that system exists', 'Browser-local progression already exists.'],
  ['story updates unavailable', 'Stories/Manga/Reader preview surfaces exist; only dated story-news posts are absent.'],
  ['a story archive and publishing schedule have not been made available', 'Stories/Manga/Reader preview surfaces exist; only dated story-news posts/schedule are absent.'],
  ['not a published media library', 'The Media route already publishes canonical art previews; only downloadable press/media library capability is absent.']
];

let scanned = 0;
for (const record of nonHome) {
  const file = path.join(site, record.file);
  ok(fs.existsSync(file), `page file missing for ${record.route}: ${record.file}`);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  scanned += 1;
  const lower = raw.toLowerCase();
  for (const [phrase, reason] of forbidden) {
    if (lower.includes(phrase)) errors.push(`${record.route} contains stale claim "${phrase}" — ${reason}`);
  }
}

function pageRaw(route) {
  const record = routes.get(route);
  if (!record) return '';
  return fs.readFileSync(path.join(site, record.file), 'utf8');
}

const search = pageRaw('/search/');
ok(search.includes('data-site-search'), '/search/ missing active local-search form hook');
ok(
  search.includes('no remote search service is used') ||
  search.includes('not sent to an external search service'),
  '/search/ no longer states its local-only boundary'
);

const searchIndex = path.join(site, 'reference', 'assets', 'data', 'local-search-index.json');
ok(fs.existsSync(searchIndex), 'local search index missing');
if (fs.existsSync(searchIndex)) {
  const data = readJson(searchIndex);
  ok(Array.isArray(data.entries) && data.entries.length > 0, 'local search index is empty');
  notes.push(`localSearchEntries=${Array.isArray(data.entries) ? data.entries.length : 0}`);
}

const support = pageRaw('/support/');
ok(support.includes('data-support-search'), '/support/ missing local help-filter control');
ok(
  support.includes('Feast Pass progress can persist locally on this browser'),
  '/support/ does not acknowledge current guest-local progression'
);

const account = pageRaw('/account/');
ok(
  account.includes('Website progression can already stay on this browser'),
  '/account/ does not acknowledge current guest-local progression'
);
ok(
  account.includes('sign-up, login, and cross-device sync are future capabilities'),
  '/account/ must keep account/cloud-sync boundary explicit'
);

const profile = pageRaw('/profile/');
ok(profile.includes("data-progression-page='profile'"), '/profile/ missing live guest-progression hook');
ok(profile.includes("data-progression-stat='level'"), '/profile/ missing Level stat hook');

const feastPass = pageRaw('/feast-pass/');
for (const stat of ['level', 'xp', 'sparks', 'streak', 'discoveries', 'quests-complete']) {
  ok(feastPass.includes(`data-progression-stat='${stat}'`), `/feast-pass/ missing current progression stat: ${stat}`);
}

const characters = pageRaw('/characters/');
ok(characters.includes("href='/characters/toadal/'"), '/characters/ does not expose current Toadal profile');
ok(
  characters.includes('Guest website progression is active on this browser'),
  '/characters/ contains pre-progression discovery copy'
);

const stories = pageRaw('/stories/');
ok(stories.includes("href='/manga/'"), '/stories/ does not expose current Manga preview');
ok(stories.toLowerCase().includes('publishing preview'), '/stories/ does not describe current publishing-preview state');

const manga = pageRaw('/manga/');
ok(manga.includes("href='/reader/'"), '/manga/ does not expose current Reader preview');
ok(manga.toLowerCase().includes('0 published'), '/manga/ must preserve truthful zero-published-chapter state');

const reader = pageRaw('/reader/');
ok(reader.includes('data-reader-shell'), '/reader/ missing reader shell');
ok(reader.toLowerCase().includes('no chapter selected'), '/reader/ must preserve truthful empty reader state');

const notFound = pageRaw('/404.html');
ok(notFound.includes('"href": "/search/"'), '/404.html missing Search recovery action');
ok(notFound.includes('search the Feast'), '/404.html does not acknowledge current Search route');

const progressionRuntime = path.join(site, 'reference', 'assets', 'js', 'guest-progression.js');
ok(fs.existsSync(progressionRuntime), 'guest progression runtime missing');
if (fs.existsSync(progressionRuntime)) {
  const runtime = fs.readFileSync(progressionRuntime, 'utf8');
  ok(runtime.includes("pass: 'toadal:web:v1:feast-pass'"), 'guest progression storage contract missing');
  ok(runtime.includes('data-progression-stat'), 'guest progression runtime no longer renders stats');
}

if (errors.length) {
  console.error('NON-HOME TRUTH VERIFY: FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log('NON-HOME TRUTH VERIFY: PASS');
console.log(JSON.stringify({
  registeredRoutes: records.length,
  nonHomeRoutesScanned: scanned,
  currentCapabilityRoutesChecked: currentRoutes.length,
  staleClaimPatternsChecked: forbidden.length,
  notes
}, null, 2));
