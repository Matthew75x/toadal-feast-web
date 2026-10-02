import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const root = process.cwd();
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const index = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8'));
const routes = new Map(index.pages.map((record) => [record.route, record]));
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);
const families = [
  ['Home', '/'], ['Play / Games Hub', '/play/'], ['Wicked Bites Detail', '/games/wicked-bites/'],
  ['Browser Game Player', '/player/wicked-bites/'], ['World Hub', '/world/'], ['Characters Hub', '/characters/'],
  ['Toadal Profile', '/characters/toadal/'], ['Stories / Comics', '/stories/'], ['Manga Series', '/manga/'],
  ['Comic Reader', '/reader/'], ['Media Hub', '/media/'], ['News Hub', '/news/'], ['News Article / Devlog', '/news/devlog/'],
  ['Feast Pass', '/feast-pass/'], ['Quests / Challenges', '/feast-pass/quests/'], ['Rewards / Collection', '/feast-pass/rewards/'],
  ['Leaderboards', '/leaderboards/'], ['App', '/app/'], ['Account', '/account/'], ['Player Profile', '/profile/'],
  ['Community', '/community/'], ['Store', '/store/'], ['Search', '/search/'], ['Roadmap', '/roadmap/'],
  ['Support', '/support/'], ['Contact', '/contact/'], ['About', '/about/'], ['Coming Soon', '/coming-soon/'],
  ['Legal', '/legal/'], ['404', '/404.html']
];

function source(route) {
  const record = routes.get(route);
  assert.ok(record, `registered family route: ${route}`);
  const file = path.join(site, record.file);
  assert.ok(fs.existsSync(file), `${route} source exists: ${record.file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
// Remove only owner-editor metadata attributes for semantic contract matching.
function semanticMarkup(markup) {
  return markup.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/\sdata-studio-(?:component|edit-field)=(['"])[^'"]*\1/g, ''));
}
function projectableMarkup(record) {
  return record.components
    .filter((component) => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map((component) => semanticMarkup(projectPage(site, { ...record, components: [component] })))
    .join('\n');
}
function html(route) {
  return projectableMarkup(source(route));
}

test('all 30 original manifest families have distinct, source-backed route records', () => {
  assert.equal(families.length, 30);
  const paths = families.map(([, route]) => route);
  assert.equal(new Set(paths).size, 30, 'the denominator is 30 distinct families, not total static route count');
  for (const [family, route] of families) assert.ok(source(route), `${family} source-backed`);
});

test('thin editorial, leaderboard, roadmap, and support experiences use real current data states', () => {
  assert.match(html('/news/'), /data-news-filters/);
  assert.match(html('/news/devlog/'), /data-article-content/);
  assert.match(html('/leaderboards/'), /data-leaderboard-game[\s\S]*data-leaderboard-rows/);
  for (const status of ['available-now', 'in-development', 'coming-soon', 'exploring']) assert.ok(html('/roadmap/').includes(`data-roadmap-status='${status}'`));
  assert.match(html('/support/'), /data-support-search/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(site, 'reference', 'assets', 'data', 'manifest-public-content.json'), 'utf8')).news.length, 0);
});

test('Media uses genuine stills, truthful empty categories, optimized assets, and working product routes', () => {
  const media = html('/media/');
  assert.match(media, /No public trailer, video, or short is available/);
  assert.match(media, /genuine gameplay stills/i);
  assert.match(media, /no public wallpaper, logo, or other media downloads/i);
  assert.match(media, /No press kit is published/);
  for (const route of ['/app/', '/games/wicked-bites/', '/player/wicked-bites/', '/play/']) assert.ok(media.includes(`href='${route}'`), `Media links to ${route}`);
  assert.doesNotMatch(media, /<video\b|(?:src|href)=["'][^"']+\.(?:mp4|webm|mov|m4v)(?:[?#][^"']*)?["']/i);
  assert.doesNotMatch(media, /master-v2-selected\/.*\.png|production-pack-v2\/.*\.png/i);
});

test('Player HUD labels host-measured time and does not imply an active challenge', () => {
  const player = html('/player/wicked-bites/');
  assert.match(player, /Host-measured preview time; this is not an authoritative in-game timer/);
  assert.match(player, /No active website challenge for this preview/);
});

test('guest progression and connected-service boundaries stay within existing contracts', () => {
  const runtime = fs.readFileSync(path.join(site, 'reference', 'assets', 'js', 'guest-progression.js'), 'utf8');
  for (const key of ['toadal:web:v1:feast-pass', 'toadal:web:v1:quests', 'toadal:web:v1:discoveries', 'toadal:web:v1:profile']) assert.ok(runtime.includes(key));
  assert.match(runtime, /recordLocalHighScore/);
  assert.match(runtime, /toadal:web:v1:profile/);
  assert.match(html('/contact/'), /type='submit' disabled/);
  assert.match(html('/account/'), /disabled>Create free account/);
  assert.match(html('/store/'), /Checkout unavailable/);
  assert.doesNotMatch(html('/store/'), /href='[^']*(?:checkout|cart|buy|payment)[^']*'/i);
});

console.log(`Manifest family matrix: ${families.length}/30 distinct families have registered source-backed route records.`);
