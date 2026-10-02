#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const pageIndex = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8'));
const manifestPlan = JSON.parse(fs.readFileSync(path.join(root, 'manifests', 'final-manifest-surface-plan.json'), 'utf8'));
const navigation = JSON.parse(fs.readFileSync(path.join(site, 'collections', 'navigation.json'), 'utf8'));

const required = new Set((manifestPlan.rows || []).map((row) => row.route));
const registered = new Map((pageIndex.pages || []).map((page) => [page.route, page]));
const incoming = new Map([...required].map((route) => [route, new Set()]));
const edges = [];
const failures = [];
const notes = [];

function normalizeRoute(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(raw)) return null;
  let pathname = raw.split('#')[0].split('?')[0];
  if (!pathname.startsWith('/')) return null;
  pathname = pathname.replace(/\/+/g, '/');
  if (pathname === '/') return '/';
  if (/\.html$/i.test(pathname)) return pathname;
  return pathname.replace(/\/+$/, '') + '/';
}

function addEdge(from, href) {
  const to = normalizeRoute(href);
  if (!to || to === from) return;
  edges.push({from, to});
  if (incoming.has(to)) incoming.get(to).add(from);
}

function scanValue(from, key, value) {
  if (typeof value === 'string') {
    if (key === 'href') addEdge(from, value);
    for (const match of value.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) addEdge(from, match[1]);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) scanValue(from, '', item);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) scanValue(from, childKey, childValue);
  }
}

for (const [route, record] of registered) {
  const file = path.join(site, record.file);
  if (!fs.existsSync(file)) continue;
  scanValue(route, '', JSON.parse(fs.readFileSync(file, 'utf8')));
}

for (const section of ['primary', 'footer', 'planned']) {
  for (const item of navigation[section] || []) addEdge('[navigation:' + section + ']', item.href);
}

for (const route of required) {
  if (!registered.has(route)) {
    failures.push('Required manifest route is not registered: ' + route);
    continue;
  }
  if (route === '/' || route === '/404.html') continue;
  const sources = incoming.get(route) || new Set();
  if (!sources.size) failures.push('Orphan manifest route has no incoming internal discovery path: ' + route);
}

const journeyRequirements = [
  ['/', '/play/'],
  ['/play/', '/games/wicked-bites/'],
  ['/games/wicked-bites/', '/player/wicked-bites/'],
  ['/', '/feast-pass/'],
  ['/feast-pass/', '/feast-pass/quests/'],
  ['/feast-pass/', '/feast-pass/rewards/'],
  ['/feast-pass/', '/leaderboards/'],
  ['/profile/', '/leaderboards/'],
  ['/news/', '/news/devlog/'],
  ['/news/', '/roadmap/'],
  ['/coming-soon/', '/roadmap/']
];

const edgeSet = new Set(edges.map((edge) => edge.from + ' -> ' + edge.to));
for (const [from, to] of journeyRequirements) {
  if (!registered.has(from) || !registered.has(to)) continue;
  if (!edgeSet.has(from + ' -> ' + to)) failures.push('Required player-journey link missing: ' + from + ' -> ' + to);
}

notes.push('registeredRoutes=' + registered.size);
notes.push('internalEdges=' + edges.length);
notes.push('manifestRoutes=' + required.size);

if (failures.length) {
  console.error('FINAL MANIFEST DISCOVERABILITY CHECK: FAIL');
  for (const failure of failures) console.error('- ' + failure);
  console.error(notes.join('\n'));
  process.exit(1);
}

console.log('FINAL MANIFEST DISCOVERABILITY CHECK: PASS');
console.log(notes.join('\n'));
