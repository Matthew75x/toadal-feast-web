import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/stories-publishing.js');
const root = process.cwd();
const project = path.join(root, 'studio-project/toadal-feast-website');

test('publishing routes have static preview shells and do not invent a published catalogue', () => {
  const pages = JSON.parse(fs.readFileSync(path.join(project, 'pages/index.json'), 'utf8'));
  const registry = JSON.parse(fs.readFileSync(path.join(project, 'content/registry.json'), 'utf8'));
  for (const route of ['/stories/', '/manga/', '/reader/']) {
    const page = pages.pages.find((entry) => entry.route === route);
    assert.ok(page, `missing route ${route}`);
    assert.ok(fs.existsSync(path.join(project, page.file)), `missing page source ${page.file}`);
  }
  assert.deepEqual(registry.storySeries, []);
  assert.deepEqual(registry.storyArcs, []);
  assert.deepEqual(registry.chapters, []);
  assert.deepEqual(registry.storyPages, []);
  const stories = JSON.parse(fs.readFileSync(path.join(project, 'pages/stories.json'), 'utf8'));
  const manga = JSON.parse(fs.readFileSync(path.join(project, 'pages/manga-series.json'), 'utf8'));
  const reader = JSON.parse(fs.readFileSync(path.join(project, 'pages/comic-reader.json'), 'utf8'));
  assert.match(stories.components[0].props.html, /no published stories/i);
  assert.match(manga.components[0].props.html, /PREVIEW · NOT PUBLISHED/);
  assert.match(reader.components[0].props.html, /No published chapter is available/);
  for (const source of [stories, manga, reader]) {
    assert.doesNotMatch(source.components[0].props.html, /Chapter\s+12|Tastier Tomorrow|\b(?:128K|125K|50%)\b/i);
  }
});

test('reader resolves only public series, chapter, and an explicit ordered page manifest', () => {
  const fixture = {
    schemaVersion: 1,
    series: [{ id: 's-1', slug: 'series-one', title: 'Fixture Series', publicationState: 'PUBLISHED', chapterIds: ['c-1'] }],
    arcs: [],
    chapters: [{ id: 'c-1', slug: 'chapter-one', seriesId: 's-1', title: 'Fixture Chapter', publicationState: 'PUBLISHED', pageIds: ['p-2', 'p-1'] }],
    pages: [
      { id: 'p-1', chapterId: 'c-1', assetId: 'a-1', order: 2, publicationState: 'PUBLISHED', alt: 'Page one fixture' },
      { id: 'p-2', chapterId: 'c-1', assetId: 'a-2', order: 1, publicationState: 'PUBLISHED', alt: 'Page two fixture' },
    ],
    assets: { 'a-1': '/assets/test/page-1.webp', 'a-2': '/assets/test/page-2.webp' },
  };
  const result = runtime.resolveChapter(fixture, 'series-one', 'chapter-one');
  assert.equal(result.error, undefined);
  assert.deepEqual(result.pages.map((page) => page.id), ['p-2', 'p-1']);
  assert.equal(runtime.resolveChapter(fixture, 'series-one', 'missing').error, 'That chapter is not publicly available.');
  fixture.pages[0].publicationState = 'DRAFT';
  assert.match(runtime.resolveChapter(fixture, 's-1', 'c-1').error, /page or its approved artwork is missing/);
});

test('keyboard, swipe, and chapter order obey the content manifest', () => {
  assert.equal(runtime.keyboardPageDelta('ltr', 'ArrowRight'), 1);
  assert.equal(runtime.keyboardPageDelta('ltr', 'ArrowLeft'), -1);
  assert.equal(runtime.keyboardPageDelta('rtl', 'ArrowLeft'), 1);
  assert.equal(runtime.keyboardPageDelta('rtl', 'ArrowRight'), -1);
  assert.equal(runtime.keyboardPageDelta('ltr', 'Escape'), 0);
  assert.equal(runtime.swipePageDelta('ltr', -90, 0), 1);
  assert.equal(runtime.swipePageDelta('rtl', 90, 0), 1);
  assert.equal(runtime.swipePageDelta('ltr', -12, 0), 0);
  assert.equal(runtime.swipePageDelta('ltr', -90, 100), 0);
  const registry = {
    arcs: [],
    chapters: [
      { id: 'second', seriesId: 's', order: 2, publicationState: 'PUBLISHED' },
      { id: 'first', seriesId: 's', order: 1, publicationState: 'PUBLISHED' },
    ],
  };
  assert.deepEqual(runtime.chapterIdsForSeries(registry, { id: 's', chapterIds: ['first', 'second'] }).map((item) => item.id), ['first', 'second']);
});

test('reader progress persists stable IDs in its own namespace and preserves corrupt data', () => {
  const values = new Map([
    ['toadal:web:v1:level', '7'],
    ['toadal:web:v1:quests', '{"quest":"unchanged"}'],
  ]);
  const calls = [];
  const storage = {
    getItem(key) { calls.push(['get', key]); return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { calls.push(['set', key]); values.set(key, value); },
  };
  assert.equal(runtime.STORAGE_KEY, 'toadal:web:v1:reader-progress');
  assert.equal(runtime.saveProgress(storage, { seriesId: 's', chapterId: 'c', pageId: 'p', updatedAt: 'test-time' }), true);
  const saved = JSON.parse(values.get(runtime.STORAGE_KEY));
  assert.deepEqual(saved.entries.c, { seriesId: 's', chapterId: 'c', pageId: 'p', updatedAt: 'test-time' });
  assert.equal(values.get('toadal:web:v1:level'), '7');
  assert.equal(values.get('toadal:web:v1:quests'), '{"quest":"unchanged"}');
  assert.ok(calls.every(([, key]) => key === runtime.STORAGE_KEY));
  values.set(runtime.STORAGE_KEY, '{bad json');
  assert.equal(runtime.loadProgress(storage).corrupt, true);
  assert.equal(runtime.saveProgress(storage, { seriesId: 's', chapterId: 'c', pageId: 'p' }), false);
  assert.equal(values.get(runtime.STORAGE_KEY), '{bad json');
  const malformedEntry = '{"schemaVersion":1,"entries":{"c":null}}';
  values.set(runtime.STORAGE_KEY, malformedEntry);
  assert.equal(runtime.loadProgress(storage).corrupt, true);
  assert.equal(runtime.saveProgress(storage, { seriesId: 's', chapterId: 'c', pageId: 'p' }), false);
  assert.equal(values.get(runtime.STORAGE_KEY), malformedEntry);
});
