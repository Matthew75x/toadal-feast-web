import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildStoryContent, projectPublicStoryContent, validateStoryRegistry } from './build-story-content.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'story-content-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const projectRoot = path.join(root, 'project');
  const assetsRoot = path.join(projectRoot, 'reference/assets');
  await mkdir(path.join(projectRoot, 'content'), { recursive: true });
  await mkdir(path.join(projectRoot, 'assets'), { recursive: true });
  await mkdir(assetsRoot, { recursive: true });
  const registry = {
    schemaVersion: 1, games: [], characters: [], worlds: [], locations: [], media: [], news: [],
    supportArticles: [], roadmapItems: [], legalDocuments: [],
    storySeries: [], storyArcs: [], chapters: [], storyPages: [],
  };
  const assetManifest = { schemaVersion: 1, assets: [] };
  async function persist() {
    await writeFile(path.join(projectRoot, 'content/registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
    await writeFile(path.join(projectRoot, 'assets/index.json'), `${JSON.stringify(assetManifest, null, 2)}\n`);
  }
  return { projectRoot, assetsRoot, registry, assetManifest, persist };
}

function addAsset(f, { id = 'asset.page.1', source = 'reference/assets/pages/page-1.webp' } = {}) {
  f.assetManifest.assets.push({ id, source, kind: 'image' });
  const relativeSource = source.startsWith('reference/assets/') ? source.slice('reference/assets/'.length) : source;
  return mkdir(path.dirname(path.join(f.assetsRoot, relativeSource)), { recursive: true })
    .then(() => writeFile(path.join(f.assetsRoot, relativeSource), 'synthetic image placeholder'));
}

function addPublishedStory(f) {
  f.registry.storySeries.push({ id: 'series-one', slug: 'series-one', title: 'Synthetic Series', publicationState: 'PUBLISHED' });
  f.registry.chapters.push({ id: 'chapter-one', slug: 'chapter-one', seriesId: 'series-one', title: 'Synthetic Chapter', publicationState: 'PUBLISHED', pageIds: ['page-one'] });
  f.registry.storyPages.push({ id: 'page-one', slug: 'page-one', chapterId: 'chapter-one', publicationState: 'PUBLISHED', assetId: 'asset.page.1', order: 1, width: 100, height: 150, alt: 'Synthetic page' });
}

test('excludes DRAFT and ARCHIVED records and only includes referenced assets', async (t) => {
  const f = await fixture(t);
  await addAsset(f);
  await addAsset(f, { id: 'asset.cover', source: 'reference/assets/covers/series.webp' });
  await addAsset(f, { id: 'asset.thumb', source: 'reference/assets/thumbs/page.webp' });
  addPublishedStory(f);
  f.registry.storySeries[0].coverAssetId = 'asset.cover';
  f.registry.storyPages[0].thumbnailAssetId = 'asset.thumb';
  f.registry.storySeries.push({ id: 'draft-series', slug: 'draft-series', publicationState: 'DRAFT' });
  f.registry.storySeries.push({ id: 'archived-series', slug: 'archived-series', publicationState: 'ARCHIVED' });
  assert.deepEqual(await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot }), []);
  const projection = projectPublicStoryContent(f.registry, f.assetManifest);
  assert.deepEqual(projection.series.map(({ id }) => id), ['series-one']);
  assert.deepEqual(projection.chapters.map(({ id }) => id), ['chapter-one']);
  assert.deepEqual(projection.assets, {
    'asset.cover': '/assets/covers/series.webp',
    'asset.page.1': '/assets/pages/page-1.webp',
    'asset.thumb': '/assets/thumbs/page.webp',
  });
  assert.deepEqual(Object.keys(projection), ['schemaVersion', 'series', 'arcs', 'chapters', 'pages', 'assets']);
});
test('removes draft and archived IDs from all projected records and relationships', async (t) => {
  const f = await fixture(t);
  await addAsset(f);
  addPublishedStory(f);
  f.registry.storySeries[0].arcIds = ['arc-public', 'arc-draft', 'arc-archived'];
  f.registry.storySeries[0].chapterIds = ['chapter-one', 'chapter-draft', 'chapter-archived'];
  f.registry.storySeries.push({ id: 'series-two', slug: 'series-two', publicationState: 'DRAFT' });
  f.registry.storyArcs.push({ id: 'arc-public', slug: 'arc-public', seriesId: 'series-one', publicationState: 'PUBLISHED', chapterIds: ['chapter-one', 'chapter-draft', 'chapter-archived'] });
  f.registry.storyArcs.push({ id: 'arc-draft', slug: 'arc-draft', seriesId: 'series-one', publicationState: 'DRAFT' });
  f.registry.storyArcs.push({ id: 'arc-archived', slug: 'arc-archived', seriesId: 'series-one', publicationState: 'ARCHIVED' });
  f.registry.chapters.push({ id: 'chapter-draft', slug: 'chapter-draft', seriesId: 'series-one', arcId: 'arc-public', publicationState: 'DRAFT', pageIds: ['page-draft'] });
  f.registry.chapters.push({ id: 'chapter-archived', slug: 'chapter-archived', seriesId: 'series-one', arcId: 'arc-public', publicationState: 'ARCHIVED', pageIds: ['page-archived'] });
  const projected = projectPublicStoryContent(f.registry, f.assetManifest);
  const serialized = JSON.stringify(projected);
  for (const unpublishedId of ['arc-draft', 'arc-archived', 'chapter-draft', 'chapter-archived', 'series-two']) {
    assert.equal(serialized.includes(unpublishedId), false, `${unpublishedId} leaked into public projection`);
  }
  assert.deepEqual(projected.series[0].arcIds, ['arc-public']);
  assert.deepEqual(projected.series[0].chapterIds, ['chapter-one']);
  assert.deepEqual(projected.arcs[0].chapterIds, ['chapter-one']);
});

test('includes deliberate PREVIEW series visibly labeled but no preview chapters', async (t) => {
  const f = await fixture(t);
  f.registry.storySeries.push({ id: 'preview-series', slug: 'preview-series', publicationState: 'PREVIEW', publicPreview: true });
  f.registry.storySeries.push({ id: 'hidden-preview', slug: 'hidden-preview', publicationState: 'PREVIEW', publicPreview: false });
  assert.deepEqual(await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot }), []);
  const projection = projectPublicStoryContent(f.registry, f.assetManifest);
  assert.deepEqual(projection.series, [{ id: 'preview-series', slug: 'preview-series', publicationState: 'PREVIEW', publicPreview: true, previewLabel: 'PREVIEW' }]);
  assert.deepEqual(projection.chapters, []);
});

test('does not reader-project a PUBLISHED chapter under a PREVIEW series', async (t) => {
  const f = await fixture(t);
  await addAsset(f);
  addPublishedStory(f);
  f.registry.storySeries[0].publicationState = 'PREVIEW';
  f.registry.storySeries[0].publicPreview = true;
  const errors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(errors.some((error) => error.includes('PUBLISHED chapter requires a PUBLISHED series')));
  assert.deepEqual(projectPublicStoryContent(f.registry, f.assetManifest).chapters, []);
});

test('rejects asset traversal, invalid slug requirement, and inconsistent arc ownership/order metadata', async (t) => {
  const f = await fixture(t);
  await addAsset(f, { source: 'reference/assets/../outside.webp' });
  f.registry.storySeries.push({ id: 'series-one', slug: 'series-one', publicationState: 'PUBLISHED' });
  f.registry.storyArcs.push({ id: 'arc-one', slug: 'arc-one', seriesId: 'series-one', publicationState: 'PUBLISHED', order: 1, chapterIds: ['chapter-one'] });
  f.registry.storyArcs.push({ id: 'arc-two', slug: 'arc-two', seriesId: 'series-one', publicationState: 'PUBLISHED', order: 1 });
  f.registry.chapters.push({ id: 'chapter-one', slug: 'chapter-one', seriesId: 'series-one', arcId: 'arc-two', publicationState: 'PUBLISHED', pageIds: ['page-one'] });
  f.registry.storyPages.push({ id: 'page-one', chapterId: 'chapter-one', publicationState: 'PUBLISHED', assetId: 'asset.page.1', order: 1, width: 10, height: 10, alt: 'Synthetic page' });
  const errors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(errors.some((error) => error.includes('outside')) || errors.some((error) => error.includes('traversal')));
  assert.ok(errors.some((error) => error.includes('does not belong to this arc and series')));
  assert.ok(errors.some((error) => error.includes('duplicates order 1')));
});

test('projects a PUBLISHED ordered reader manifest deterministically', async (t) => {
  const f = await fixture(t);
  await addAsset(f);
  addPublishedStory(f);
  const errors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.deepEqual(errors, []);
  const first = projectPublicStoryContent(f.registry, f.assetManifest);
  const second = projectPublicStoryContent(JSON.parse(JSON.stringify(f.registry)), JSON.parse(JSON.stringify(f.assetManifest)));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(first.chapters[0].pageIds, ['page-one']);
  assert.equal(first.pages[0].order, 1);
  assert.deepEqual(first.chapters[0].pageIds, ['page-one']);
  assert.deepEqual(first.assets, { 'asset.page.1': '/assets/pages/page-1.webp' });
  await f.persist();
  const result = await buildStoryContent({ projectRoot: f.projectRoot });
  const built = await readFile(result.outputPath, 'utf8');
  assert.equal(built, `${JSON.stringify(first, null, 2)}\n`);
  await assert.doesNotReject(() => buildStoryContent({ projectRoot: f.projectRoot, check: true }));
});

test('public projection allowlists schema fields and excludes private/editorial metadata', async (t) => {
  const f = await fixture(t);
  await addAsset(f);
  await addAsset(f, { id: 'asset.cover', source: 'reference/assets/covers/series.webp' });
  addPublishedStory(f);
  f.registry.storySeries[0].readingDirection = 'ltr';
  f.registry.storySeries[0].order = 2;
  f.registry.storySeries[0].coverAssetId = 'asset.cover';
  f.registry.storySeries[0].coverAlt = 'Approved series cover artwork';
  f.registry.storySeries[0].editorialNotes = 'PRIVATE_SERIES_MARKER';
  f.registry.storySeries[0].internal = { token: 'PRIVATE_NESTED_MARKER' };
  f.registry.storyArcs.push({
    id: 'arc-one', slug: 'arc-one', seriesId: 'series-one', title: 'Arc One',
    publicationState: 'PUBLISHED', chapterIds: ['chapter-one'],
    editorName: 'PRIVATE_ARC_MARKER', draft: { comment: 'PRIVATE_ARC_NESTED_MARKER' },
  });
  f.registry.storySeries[0].arcIds = ['arc-one'];
  f.registry.chapters[0].arcId = 'arc-one';
  f.registry.chapters[0].chapterLabel = 'Chapter 1';
  f.registry.chapters[0].order = 3;
  f.registry.chapters[0].readingDirection = 'rtl';
  f.registry.chapters[0].editorialStatus = 'PRIVATE_CHAPTER_MARKER';
  f.registry.storyPages[0].productionNotes = 'PRIVATE_PAGE_MARKER';

  const projection = projectPublicStoryContent(f.registry, f.assetManifest);
  const serialized = JSON.stringify(projection);
  for (const marker of [
    'PRIVATE_SERIES_MARKER', 'PRIVATE_NESTED_MARKER', 'PRIVATE_ARC_MARKER',
    'PRIVATE_ARC_NESTED_MARKER', 'PRIVATE_CHAPTER_MARKER', 'PRIVATE_PAGE_MARKER',
    'editorialNotes', 'editorName', 'editorialStatus', 'productionNotes', 'internal', 'draft',
  ]) assert.equal(serialized.includes(marker), false, `${marker} leaked into public projection`);

  assert.deepEqual(Object.keys(projection.series[0]), [
    'id', 'slug', 'publicationState', 'title', 'readingDirection', 'coverAssetId', 'coverAlt', 'order', 'arcIds',
  ]);
  assert.deepEqual(Object.keys(projection.arcs[0]), [
    'id', 'slug', 'publicationState', 'title', 'seriesId', 'chapterIds',
  ]);
  assert.equal(projection.series[0].order, 2);
  assert.equal(projection.series[0].coverAlt, 'Approved series cover artwork');
  assert.equal(projection.chapters[0].displayLabel, 'Chapter 1', 'chapterLabel should map to the runtime displayLabel field');
  assert.equal(projection.chapters[0].chapterLabel, 'Chapter 1');
  assert.equal(projection.chapters[0].order, 3);
  assert.equal(projection.chapters[0].readingDirection, 'rtl');
  for (const field of ['displayLabel', 'chapterLabel', 'order', 'readingDirection']) {
    assert.ok(Object.hasOwn(projection.chapters[0], field), `${field} should survive public projection`);
  }
  assert.equal(Object.hasOwn(projection.chapters[0], 'editorialStatus'), false);
  assert.deepEqual(Object.keys(projection.pages[0]), [
    'id', 'slug', 'publicationState', 'chapterId', 'assetId', 'order', 'width', 'height', 'alt',
  ]);
});

test('rejects missing assets, empty/duplicate page order, and unsafe published chapter links', async (t) => {
  const f = await fixture(t);
  addPublishedStory(f);
  f.registry.storyPages[0].assetId = 'asset.missing';
  f.registry.chapters[0].pageIds = [];
  f.registry.chapters.push({ id: 'other-chapter', slug: 'other-chapter', seriesId: 'other-series', publicationState: 'DRAFT', pageIds: ['page-one'] });
  f.registry.storySeries.push({ id: 'other-series', slug: 'other-series', publicationState: 'PUBLISHED' });
  f.registry.chapters[0].nextChapterId = 'other-chapter';
  const errors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(errors.some((error) => error.includes('assetId')));
  assert.ok(errors.some((error) => error.includes('pageIds')));
  assert.ok(errors.some((error) => error.includes('nextChapterId')));

  f.registry.chapters[0].pageIds = ['page-one', 'page-one'];
  const duplicateErrors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(duplicateErrors.some((error) => error.includes('duplicates ordered ID')));

  f.registry.chapters[0].pageIds = ['page-one'];
  f.registry.storyPages[0].order = 2;
  const invalidOrderErrors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(invalidOrderErrors.some((error) => error.includes('invalid order')));
});

test('rejects asset paths that escape the approved root through a symlink', async (t) => {
  const f = await fixture(t);
  const outsideRoot = path.join(f.projectRoot, 'outside-assets');
  await mkdir(outsideRoot, { recursive: true });
  await writeFile(path.join(outsideRoot, 'page.webp'), 'outside placeholder');
  await symlink(outsideRoot, path.join(f.assetsRoot, 'linked-assets'), process.platform === 'win32' ? 'junction' : 'dir');
  f.assetManifest.assets.push({ id: 'asset.page.1', source: 'reference/assets/linked-assets/page.webp', kind: 'image' });
  addPublishedStory(f);

  const errors = await validateStoryRegistry(f.registry, f.assetManifest, { assetsRoot: f.assetsRoot });
  assert.ok(errors.some((error) => error.includes('must not resolve outside reference/assets through symlinks')));
});
