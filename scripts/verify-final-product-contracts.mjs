#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const index = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8'));
const failures = [];
const notes = [];
const pages = new Map();
const missingRoutes = new Set();
const projector = await createOwnerNativeProjector();

for (const record of index.pages || []) {
  const file = path.join(site, record.file);
  if (!fs.existsSync(file)) continue;
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const html = projector.projectPageComponents(site, doc).map(({ html }) => html).join('\n');
  const structured = JSON.stringify(doc.components || []);
  pages.set(record.route, {
    record,
    doc,
    html,
    structured,
    source: html + '\n' + structured,
    text: (html + ' ' + structured).replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim()
  });
}

function page(route) {
  const value = pages.get(route);
  if (!value && !missingRoutes.has(route)) {
    missingRoutes.add(route);
    failures.push('Missing route required for final product contract: ' + route);
  }
  return value;
}
function requireText(route, regex, message) {
  const value = page(route);
  if (value && !regex.test(value.text)) failures.push(route + ': ' + message);
}
function requireHtml(route, regex, message) {
  const value = page(route);
  if (value && !regex.test(value.html)) failures.push(route + ': ' + message);
}
function requireSource(route, regex, message) {
  const value = page(route);
  if (value && !regex.test(value.source)) failures.push(route + ': ' + message);
}

// Devlog/article family: thin reusable surface, not fabricated publication.
requireHtml('/news/devlog/', /<article\b/i, 'Devlog template needs an article semantic surface.');
requireSource('/news/devlog/', /\/roadmap\//i, 'Devlog template needs a Roadmap handoff.');
requireText('/news/devlog/', /devlog|development|behind the feast|update/i, 'Devlog template does not identify its editorial purpose.');

// Leaderboards: reuse local score model; connected/global may remain future.
requireHtml('/leaderboards/', /<table\b/i, 'Leaderboard presentation must use a semantic table.');
requireHtml('/leaderboards/', /<caption\b/i, 'Leaderboard table needs a screen-reader caption.');
requireHtml('/leaderboards/', /<th\b[^>]*scope\s*=\s*["']col["']/i, 'Leaderboard table needs scoped column headings.');
requireText('/leaderboards/', /personal best|your best|best score/i, 'Leaderboard route needs a personal-best state.');
requireText('/leaderboards/', /local|this browser|guest/i, 'Leaderboard route must disclose local/guest scope when connected ranking is not active.');
requireSource('/leaderboards/', /data-companion-context/i, 'Leaderboard route needs companion semantic context.');

// Roadmap: four public status groups; no dates required.
for (const label of ['Available Now', 'In Development', 'Coming Soon', 'Exploring']) {
  requireText('/roadmap/', new RegExp(label.replace(/ /g, '\\s*'), 'i'), 'Roadmap missing public status group: ' + label);
}
requireSource('/roadmap/', /data-companion-context/i, 'Roadmap route needs companion semantic context.');

// Feast Pass family should become connected instead of isolated.
requireText('/feast-pass/', /Treats/i, 'Feast Pass must expose Treats.');
requireText('/feast-pass/', /daily/i, 'Feast Pass must expose daily/check-in state.');
requireSource('/feast-pass/', /\/feast-pass\/quests\//i, 'Feast Pass must link to Quests.');
requireSource('/feast-pass/', /\/feast-pass\/rewards\//i, 'Feast Pass must link to Rewards.');
requireSource('/feast-pass/', /\/leaderboards\//i, 'Feast Pass must link to Leaderboards.');
requireSource('/profile/', /\/leaderboards\//i, 'Guest Profile must link to Leaderboards/local scores.');
requireText('/profile/', /score/i, 'Guest Profile must retain score/activity presentation.');

// App truth: all current game modes must be represented even when store URLs are unavailable.
for (const mode of ['Arcade', 'Puzzle', 'Feastfall', 'Infinite']) {
  requireText('/app/', new RegExp('\\b' + mode + '\\b', 'i'), 'App page missing mode: ' + mode);
}
requireText('/app/', /store .*not configured|store links .*not configured|destinations pending|disabled/i, 'App page must keep unavailable store destinations truthful until configured.');

// Construction and utility closure.
requireText('/coming-soon/', /coming soon|under construction/i, 'Coming Soon route does not clearly state unavailable status.');
requireSource('/coming-soon/', /data-companion-reaction[^}]*construction/i, 'Coming Soon route must trigger construction semantic reaction.');
requireSource('/404.html', /\/search\//i, '404 must retain Search recovery.');
requireSource('/support/', /data-support-search/i, 'Support must retain local help search.');
requireSource('/search/', /data-site-search/i, 'Search must retain active local search hook.');

// Reader/publishing core cannot regress while closure work proceeds.
requireSource('/reader/', /data-reader-shell/i, 'Reader shell missing.');
requireSource('/stories/', /\/manga\//i, 'Stories must link to Manga.');
requireSource('/manga/', /\/reader\//i, 'Manga must link to Reader.');

// Page-family cross-links for discovery.
requireSource('/news/', /\/news\/devlog\//i, 'News Hub should expose the Devlog/article family even when no posts are published.');
requireSource('/news/', /\/roadmap\//i, 'News Hub should expose Roadmap/What\'s Next.');
requireSource('/play/', /\/leaderboards\//i, 'Play Hub should expose Leaderboards.');

notes.push('registeredRoutes=' + pages.size);

if (failures.length) {
  console.error('FINAL PRODUCT CONTRACT CHECK: FAIL');
  for (const failure of failures) console.error('- ' + failure);
  console.error(notes.join('\n'));
  process.exit(1);
}

console.log('FINAL PRODUCT CONTRACT CHECK: PASS');
console.log(notes.join('\n'));
