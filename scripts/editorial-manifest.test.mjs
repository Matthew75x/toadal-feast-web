import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const editorial = require('../studio-project/toadal-feast-website/reference/assets/js/editorial-manifest.js');
const { projectNewsRecords, projectRoadmapItems } = await import('./build-manifest-public-content.mjs');

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

const articleRecords = [
  { slug: 'article-one', title: 'Article one', summary: 'Published one.', category: 'development', publishedAt: '2026-10-01', publicationState: 'PUBLISHED', featured: true, pullQuote: { text: '<script>quoted text</script>', attribution: 'Approved source' }, relatedSlugs: ['article-two', 'draft-only', 'article-two', 'bad/slug', 'article-one'] },
  { slug: 'article-two', title: 'Article two', summary: 'Published two.', category: 'games', publishedAt: '2026-09-30', publicationState: 'PUBLISHED' },
  { slug: 'draft-only', title: 'Draft article', summary: 'Must remain private.', category: 'development', publishedAt: '2026-09-29', publicationState: 'DRAFT' }
];
const projectedArticles = editorial.projectPublishedNews(articleRecords);
assert.equal(projectedArticles[0].featured, true, 'featured state must be explicit');
assert.deepEqual(projectedArticles[0].pullQuote, { text: '<script>quoted text</script>', attribution: 'Approved source' }, 'quote remains text data for textContent rendering');
assert.deepEqual(projectedArticles[0].relatedSlugs, ['article-two', 'draft-only']);
assert.deepEqual(editorial.projectRelatedNews(projectedArticles[0], articleRecords).map(({ slug }) => slug), ['article-two'], 'related links resolve only to published articles');
assert.equal(editorial.projectPublishedNews([{ ...articleRecords[0], pullQuote: { text: '  ' } }])[0].pullQuote, null, 'blank pull quotes are omitted');

const registryNews = [
  { slug: 'public-one', title: ' Public one ', summary: ' Approved summary. ', category: 'development', publishedAt: '2026-10-01', publicationState: 'PUBLISHED', featured: true, tags: [' dev ', 7], body: [' Approved body. ', '  ', 9], image: '/assets/images/news.webp', imageAlt: 'Approved image', pullQuote: { text: ' Approved quote. ', attribution: ' Approved attribution ', internalQuoteNote: 'must not export' }, relatedSlugs: ['public-two', 'draft-secret', 'private-record', '//outside', 'public-one', 'public-two'], bodySource: 'private/source/path.md', authorEmail: 'private@example.invalid', internalNotes: 'do not export', internalModeration: { approvedBy: 'private-user' } },
  { slug: 'public-two', title: 'Public two', summary: 'Approved.', category: 'games', publishedAt: '2026-09-30', publicationState: 'PUBLISHED', databaseId: 'private-db-id' },
  { slug: 'draft-secret', title: 'Draft secret', summary: 'Not approved.', category: 'development', publishedAt: '2026-10-02', publicationState: 'DRAFT', internalNotes: 'private' },
  { slug: 'invalid-published', title: 'Invalid record', summary: 'Not projectable.', category: 'unknown', publishedAt: '2026-10-02', publicationState: 'PUBLISHED', internalNotes: 'private' }
];
const exportedNews = projectNewsRecords(registryNews);
assert.deepEqual(exportedNews.map(({ slug }) => slug), ['public-one', 'public-two'], 'only complete, valid PUBLISHED news records export');
assert.deepEqual(exportedNews[0], {
  slug: 'public-one', title: 'Public one', summary: 'Approved summary.', category: 'development', publishedAt: '2026-10-01', publicationState: 'PUBLISHED',
  tags: ['dev'], body: ['Approved body.'], image: '/assets/images/news.webp', imageAlt: 'Approved image', featured: true,
  pullQuote: { text: 'Approved quote.', attribution: 'Approved attribution' }, relatedSlugs: ['public-two']
}, 'public news exports only allowlisted fields and only relations resolving to valid published slugs');
assert.ok(exportedNews.every((item) => item.publicationState === 'PUBLISHED'), 'runtime re-projection receives the required publication state');
assert.equal(editorial.projectPublishedNews(exportedNews).length, 2, 'allowlisted build output remains accepted by runtime projection');

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
const relatedRoadmap = [
  { ...roadmap[0], relatedDevlogSlugs: ['article-two', 'draft-only', 'missing', 'article-two'] },
  { ...roadmap[1], slug: 'internal-roadmap', relatedDevlogSlugs: ['article-one'] }
];
assert.deepEqual(editorial.projectRoadmapDevlogs(relatedRoadmap, articleRecords).map(({ roadmapTitle, article }) => [roadmapTitle, article.slug]), [['Current feature', 'article-two']], 'roadmap devlogs require a published roadmap item and a published related article');
assert.deepEqual(editorial.projectRoadmapDevlogs([], articleRecords), []);
assert.deepEqual(projectRoadmapItems([
  { slug: 'roadmap-with-devlog', title: 'Roadmap item', description: 'Approved.', publicStatus: 'PREVIEW', publicationState: 'PREVIEW', route: '/play/', relatedDevlogSlugs: ['public-two', 'draft-secret', 'missing', 'bad/slug', 'public-two'], internalEvidence: 'private' },
  { slug: 'draft-roadmap', title: 'Internal item', description: 'Private.', publicStatus: 'PREVIEW', publicationState: 'DRAFT', route: '/play/', relatedDevlogSlugs: ['public-one'], privateNotes: 'private' }
], registryNews).map(({ slug, relatedDevlogSlugs }) => [slug, relatedDevlogSlugs]), [['roadmap-with-devlog', ['public-two']]], 'build projection strips private roadmap fields and intersects related devlogs with valid published news');
const projectedRoadmap = projectRoadmapItems([{
  slug: 'public-roadmap', title: 'Public roadmap item', description: 'Approved description.', publicStatus: 'COMING_SOON', publicationState: 'PREVIEW', route: '/community/', relatedDevlogSlugs: ['public-one', 'draft-secret', 'nonexistent', 'bad/slug', 'public-one'], privateOwner: 'private-user', internalNotes: 'do not export'
}], registryNews);
assert.deepEqual(projectedRoadmap, [{ slug: 'public-roadmap', title: 'Public roadmap item', summary: 'Approved description.', status: 'coming-soon', publicStatus: 'COMING_SOON', route: '/community/', publicationState: 'PUBLISHED', relatedDevlogSlugs: ['public-one'] }], 'roadmap exports preserve PUBLISHED state while removing private fields and unpublished or invalid related slugs');
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

const readFile = (await import('node:fs/promises')).readFile;
const registrySchema = JSON.parse(await readFile(new URL('../docs/content/content-registry.schema.json', import.meta.url), 'utf8'));
const newsSchema = registrySchema.properties.news.items.allOf[1].properties;
assert.equal(newsSchema.featured.type, 'boolean');
assert.deepEqual(newsSchema.pullQuote.required, ['text']);
assert.equal(newsSchema.pullQuote.additionalProperties, false);
assert.equal(newsSchema.relatedSlugs.items.$ref, '#/$defs/slug');
assert.equal(registrySchema.properties.roadmapItems.items.properties.relatedDevlogSlugs.items.$ref, '#/$defs/slug');
for (const [file, requiredSlots] of [
  ['news.json', ['data-news-featured-list', 'data-news-featured-empty', 'data-news-list', 'data-news-filters', 'data-news-trending']],
  ['news-article.json', ['data-article-quote', 'data-article-quote-text', 'data-article-quote-attribution', 'data-article-related-list', 'data-article-related-empty', 'data-article-neighbors']],
  ['roadmap.json', ['data-roadmap-related-devlogs', 'data-roadmap-devlog-list', 'data-roadmap-devlog-empty']]
]) {
  const page = JSON.parse(await readFile(new URL(`../studio-project/toadal-feast-website/pages/${file}`, import.meta.url), 'utf8'));
  const html = page.components[0].props.html;
  for (const slot of requiredSlots) assert.ok(html.includes(slot), `${file} must include required slot ${slot}`);
}
const articlePage = JSON.parse(await readFile(new URL('../studio-project/toadal-feast-website/pages/news-article.json', import.meta.url), 'utf8'));
assert.match(articlePage.components[0].props.html, /data-article-quote-text[^>]*>/, 'quote text has a dedicated text-only projection target');
assert.match(editorial.renderArticle.toString(), /quoteText\.textContent = record\.pullQuote\.text/, 'quotes render as text, not injected markup');
assert.match(editorial.renderArticle.toString(), /projectRelatedNews\(record, records\)/, 'article related links use the published-record resolver');
assert.match(editorial.renderRoadmap.toString(), /projectRoadmapDevlogs\(records, newsRecords\)/, 'roadmap links use the published-record resolver');

console.log('Editorial publication, featured/latest/trending slots, quote/related projection, and roadmap checks passed.');
