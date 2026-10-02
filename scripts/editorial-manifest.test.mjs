import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const editorial = require('../studio-project/toadal-feast-website/reference/assets/js/editorial-manifest.js');

const news = [
  { id: 'draft-note', slug: 'draft-note', title: 'Draft note', summary: 'Not public.', category: 'development', publishedAt: '2026-10-01', publicationState: 'DRAFT' },
  { id: 'game-note', slug: 'game-note', title: 'Game note', summary: 'A published game update.', category: 'games', tags: ['preview'], body: ['Verified release detail.'], publishedAt: '2026-10-01', publicationState: 'PUBLISHED' },
  { id: 'unknown-type', slug: 'unknown-type', title: 'Unknown type', summary: 'Not in taxonomy.', category: 'invented', publishedAt: '2026-10-02', publicationState: 'PUBLISHED' },
  { id: 'fake-date', slug: 'fake-date', title: 'Bad date', summary: 'Invalid publication date.', category: 'games', publishedAt: 'next month', publicationState: 'PUBLISHED' },
  { id: 'preview', slug: 'preview', title: 'Preview note', summary: 'Not a published announcement.', category: 'games', publishedAt: '2026-10-02', publicationState: 'PREVIEW', publicPreview: true }
];

assert.deepEqual(editorial.projectPublishedNews(news).map((item) => item.slug), ['game-note']);
assert.deepEqual(editorial.filterNews(news, { category: 'games', query: 'verified update' }).map((item) => item.slug), ['game-note']);
assert.deepEqual(editorial.filterNews(news, { category: 'world-stories' }), []);
assert.deepEqual(editorial.projectPublishedNews([]), []);

const roadmap = [
  { slug: 'available', title: 'Current feature', summary: 'Verified current feature.', status: 'available-now', publicStatus: 'PREVIEW', route: '/play/', publicationState: 'PUBLISHED' },
  { slug: 'internal', title: 'Internal task', summary: 'Not approved for public display.', status: 'in-development', publicationState: 'DRAFT' },
  { slug: 'bad-state', title: 'Unrecognized state', summary: 'Must not leak.', status: 'paused', publicationState: 'PUBLISHED' },
  { slug: 'no-date', title: 'No date item', summary: 'Dates are not required.', status: 'exploring', publicStatus: 'PLANNED', route: '/account/', publicationState: 'PUBLISHED', publishedAt: 'not a date' },
  { slug: 'unsafe-route', title: 'Bad route', summary: 'Do not link this.', status: 'available-now', publicStatus: 'PREVIEW', route: '//attacker.example', publicationState: 'PUBLISHED' }
];

assert.deepEqual(editorial.projectRoadmap(roadmap).map((item) => item.slug), ['available', 'no-date']);
assert.deepEqual(editorial.projectRoadmap([]), []);
assert.equal(editorial.projectRoadmap(roadmap)[0].route, '/play/');
assert.deepEqual(editorial.ROADMAP_STATUSES.map(({ id }) => id), ['available-now', 'in-development', 'coming-soon', 'exploring']);
assert.deepEqual(editorial.NEWS_RECORDS, []);
assert.deepEqual(editorial.ROADMAP_RECORDS, []);
assert.match(editorial.renderMediaFilters.toString(), /aria-pressed/);
assert.match(editorial.renderMediaFilters.toString(), /candidate\.section\.hidden/);
const publicContent = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../studio-project/toadal-feast-website/reference/assets/data/manifest-public-content.json', import.meta.url), 'utf8'));
assert.equal(publicContent.news.length, 0, 'unpublished news remains absent');
assert.equal(publicContent.roadmap.length, 5, 'roadmap is projected from the existing content registry');
assert.deepEqual([...new Set(publicContent.roadmap.map((item) => item.status))].sort(), ['available-now', 'coming-soon', 'exploring']);
assert.ok(publicContent.roadmap.every((item) => item.publicationState === 'PUBLISHED' && !('date' in item)));

console.log('Editorial publication, filter, and roadmap checks passed.');
