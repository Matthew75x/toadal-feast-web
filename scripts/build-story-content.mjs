#!/usr/bin/env node

import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CONTENT_STATES = new Set(['DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED']);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../studio-project/toadal-feast-website');
const REQUIRED_ARRAYS = ['storySeries', 'storyArcs', 'chapters', 'storyPages'];
const LEGACY_ARRAYS = ['games', 'characters', 'worlds', 'locations', 'media', 'news', 'supportArticles', 'roadmapItems', 'legalDocuments'];
// Public projection is deliberately allowlisted. Keep only runtime-visible story
// fields here; never spread source records into the public JSON.
const PUBLIC_FIELDS = Object.freeze({
  series: ['id', 'slug', 'publicationState', 'summary', 'searchable', 'title', 'readingDirection', 'publicPreview', 'coverAssetId', 'coverAlt', 'thumbnailAssetId', 'order', 'arcIds', 'chapterIds'],
  arcs: ['id', 'slug', 'publicationState', 'summary', 'searchable', 'title', 'seriesId', 'order', 'coverAssetId', 'thumbnailAssetId', 'chapterIds'],
  chapters: ['id', 'slug', 'publicationState', 'summary', 'searchable', 'title', 'displayLabel', 'chapterLabel', 'seriesId', 'arcId', 'publishedAt', 'order', 'readingDirection', 'pageIds', 'previousChapterId', 'nextChapterId', 'coverAssetId', 'thumbnailAssetId'],
  pages: ['id', 'slug', 'publicationState', 'summary', 'searchable', 'chapterId', 'assetId', 'thumbnailAssetId', 'order', 'width', 'height', 'alt'],
});

function pickPublicFields(record, fields) {
  return Object.fromEntries(fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]));
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fail(errors, at, message) {
  errors.push(`${at}: ${message}`);
}

function validateIdSlugRecords(registry, errors) {
  const ids = new Map();
  const storySlugRequired = new Set(['storySeries', 'storyArcs', 'chapters']);
  for (const key of [...LEGACY_ARRAYS, ...REQUIRED_ARRAYS]) {
    const entries = registry[key];
    if (!Array.isArray(entries)) {
      fail(errors, key, 'must be an array');
      continue;
    }
    const slugs = new Set();
    entries.forEach((entry, index) => {
      const at = `${key}[${index}]`;
      if (!isRecord(entry)) {
        fail(errors, at, 'must be an object');
        return;
      }
      if (typeof entry.id !== 'string' || !/^[a-z0-9][a-z0-9._:-]*$/u.test(entry.id)) {
        fail(errors, `${at}.id`, 'must be a stable non-empty lowercase identifier');
      } else if (ids.has(entry.id)) {
        fail(errors, `${at}.id`, `duplicates globally unique ID in ${ids.get(entry.id)}`);
      } else {
        ids.set(entry.id, at);
      }
      if (storySlugRequired.has(key) || !REQUIRED_ARRAYS.includes(key)) {
        if (typeof entry.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(entry.slug)) {
          fail(errors, `${at}.slug`, 'must be a non-empty lowercase URL slug');
        } else if (slugs.has(entry.slug)) {
          fail(errors, `${at}.slug`, 'duplicates a slug in its entity namespace');
        } else {
          slugs.add(entry.slug);
        }
      }
      if (!CONTENT_STATES.has(entry.publicationState)) {
        fail(errors, `${at}.publicationState`, `must be one of ${[...CONTENT_STATES].join(', ')}`);
      }
    });
  }
  return ids;
}

function validateOrder(items, at, errors, required = true) {
  if (!Array.isArray(items) || (required && items.length === 0)) {
    fail(errors, at, required ? 'must be a non-empty explicit ordered ID array' : 'must be an array');
    return;
  }
  const seen = new Set();
  items.forEach((id, index) => {
    if (typeof id !== 'string' || id.length === 0) fail(errors, `${at}[${index}]`, 'must be a non-empty stable ID');
    else if (seen.has(id)) fail(errors, `${at}[${index}]`, `duplicates ordered ID ${id}`);
    else seen.add(id);
  });
}

function validateAssetPath(source, assetsRoot, at, errors) {
  if (typeof source !== 'string' || source.length === 0 || source.includes('\\') || source.startsWith('/') || /^[a-z]+:/iu.test(source)) {
    fail(errors, at, 'must be a relative asset path within reference/assets');
    return null;
  }
  const assetRelativePath = source.startsWith('reference/assets/') ? source.slice('reference/assets/'.length) : source;
  const segments = assetRelativePath.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    fail(errors, at, 'must not contain empty, dot, or traversal path segments');
    return null;
  }
  const resolved = path.resolve(assetsRoot, assetRelativePath);
  const relative = path.relative(path.resolve(assetsRoot), resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail(errors, at, 'resolves outside reference/assets');
    return null;
  }
  return { resolved, url: `/assets/${segments.map(encodeURIComponent).join('/')}` };
}

/** Validate story records and required local asset files. Returns all errors. */
export async function validateStoryRegistry(registry, assetManifest, options = {}) {
  const errors = [];
  if (!isRecord(registry)) return ['registry: must be an object'];
  if (!isRecord(assetManifest) || !Array.isArray(assetManifest.assets)) return ['asset manifest: assets must be an array'];
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(registry[key])) fail(errors, key, 'must be an array');
  }
  const ids = validateIdSlugRecords(registry, errors);
  const assetsRoot = options.assetsRoot ?? path.resolve(DEFAULT_PROJECT_ROOT, 'reference/assets');
  const assetsById = new Map();
  for (const [index, asset] of assetManifest.assets.entries()) {
    if (!isRecord(asset) || typeof asset.id !== 'string') {
      fail(errors, `assets[${index}]`, 'must have an ID');
      continue;
    }
    if (assetsById.has(asset.id)) fail(errors, `assets[${index}].id`, `duplicates asset ID ${asset.id}`);
    assetsById.set(asset.id, asset);
  }

  const series = registry.storySeries ?? [];
  const arcs = registry.storyArcs ?? [];
  const chapters = registry.chapters ?? [];
  const pages = registry.storyPages ?? [];
  const seriesById = new Map(series.filter(isRecord).map((item) => [item.id, item]));
  const arcsById = new Map(arcs.filter(isRecord).map((item) => [item.id, item]));
  const chaptersById = new Map(chapters.filter(isRecord).map((item) => [item.id, item]));
  const pagesById = new Map(pages.filter(isRecord).map((item) => [item.id, item]));

  const assetReferences = new Set();
  const validateRecordAssets = (record, at) => {
    if (!isRecord(record)) return;
    for (const field of ['coverAssetId', 'thumbnailAssetId']) {
      if (record[field] == null) continue;
      if (typeof record[field] !== 'string' || !assetsById.has(record[field])) {
        fail(errors, `${at}.${field}`, 'must reference an asset in assets/index.json');
      } else assetReferences.add(record[field]);
    }
  };
  for (const [index, item] of series.entries()) validateRecordAssets(item, `storySeries[${index}]`);
  for (const [index, item] of arcs.entries()) validateRecordAssets(item, `storyArcs[${index}]`);
  for (const [index, item] of chapters.entries()) validateRecordAssets(item, `chapters[${index}]`);
  for (const [index, item] of pages.entries()) validateRecordAssets(item, `storyPages[${index}]`);

  const validateSiblingOrder = (entries, at) => {
    const seen = new Map();
    entries.forEach((entry, index) => {
      if (entry.order === undefined) return;
      if (!Number.isInteger(entry.order) || entry.order < 1) {
        fail(errors, `${at}[${index}].order`, 'must be a positive integer when provided');
        return;
      }
      const scope = entry.seriesId ?? 'root';
      const siblingOrders = seen.get(scope) ?? new Set();
      if (siblingOrders.has(entry.order)) fail(errors, `${at}[${index}].order`, `duplicates order ${entry.order} in ${scope}`);
      siblingOrders.add(entry.order);
      seen.set(scope, siblingOrders);
    });
  };
  validateSiblingOrder(series, 'storySeries');
  validateSiblingOrder(arcs, 'storyArcs');
  validateSiblingOrder(chapters, 'chapters');

  for (const [index, item] of series.entries()) {
    if (!isRecord(item)) continue;
    for (const [field, target] of [['arcIds', arcsById], ['chapterIds', chaptersById]]) {
      if (item[field] === undefined) continue;
      validateOrder(item[field], `storySeries[${index}].${field}`, errors, false);
      for (const id of item[field] ?? []) {
        const related = target.get(id);
        if (!related) fail(errors, `storySeries[${index}].${field}`, `references unknown ID ${id}`);
        else if (related.seriesId !== item.id) fail(errors, `storySeries[${index}].${field}`, `${id} belongs to a different series`);
      }
    }
  }

  for (const [index, arc] of arcs.entries()) {
    if (!isRecord(arc)) continue;
    if (!seriesById.has(arc.seriesId)) fail(errors, `storyArcs[${index}].seriesId`, 'must reference an existing series');
    if (arc.chapterIds !== undefined) validateOrder(arc.chapterIds, `storyArcs[${index}].chapterIds`, errors, false);
    for (const id of arc.chapterIds ?? []) {
      if (!chaptersById.has(id)) fail(errors, `storyArcs[${index}].chapterIds`, `references unknown chapter ${id}`);
      else if (chaptersById.get(id).seriesId !== arc.seriesId || chaptersById.get(id).arcId !== arc.id) {
        fail(errors, `storyArcs[${index}].chapterIds`, `chapter ${id} does not belong to this arc and series`);
      }
    }
  }
  for (const [index, chapter] of chapters.entries()) {
    if (!isRecord(chapter)) continue;
    if (!seriesById.has(chapter.seriesId)) fail(errors, `chapters[${index}].seriesId`, 'must reference an existing series');
    if (chapter.arcId != null && !arcsById.has(chapter.arcId)) fail(errors, `chapters[${index}].arcId`, 'must reference an existing arc');
    else if (chapter.arcId != null && arcsById.get(chapter.arcId).seriesId !== chapter.seriesId) fail(errors, `chapters[${index}].arcId`, 'arc must belong to the same series');
    const seriesRecord = seriesById.get(chapter.seriesId);
    if (chapter.publicationState === 'PUBLISHED' && seriesRecord?.publicationState !== 'PUBLISHED') {
      fail(errors, `chapters[${index}].seriesId`, 'a PUBLISHED chapter requires a PUBLISHED series');
    }
    validateOrder(chapter.pageIds, `chapters[${index}].pageIds`, errors);
    const pageOrders = [];
    for (const pageId of chapter.pageIds ?? []) {
      if (!pagesById.has(pageId)) fail(errors, `chapters[${index}].pageIds`, `references unknown page ${pageId}`);
      else {
        const page = pagesById.get(pageId);
        if (page.chapterId !== chapter.id) fail(errors, `chapters[${index}].pageIds`, `page ${pageId} belongs to a different chapter`);
        if (Number.isInteger(page.order) && page.order > 0) pageOrders.push({ id: pageId, order: page.order });
      }
    }
    const seenOrders = new Set();
    pageOrders.forEach(({ id, order }, position) => {
      if (seenOrders.has(order)) fail(errors, `chapters[${index}].pageIds`, `page order ${order} is duplicated (${id})`);
      seenOrders.add(order);
      if (order !== position + 1) fail(errors, `chapters[${index}].pageIds`, `page ${id} has invalid order ${order}; expected ${position + 1} in explicit manifest order`);
    });
    for (const direction of ['previousChapterId', 'nextChapterId']) {
      const linkedId = chapter[direction];
      if (linkedId == null) continue;
      const linked = chaptersById.get(linkedId);
      if (!linked) fail(errors, `chapters[${index}].${direction}`, 'must reference an existing chapter');
      else if (chapter.publicationState === 'PUBLISHED' && (linked.publicationState !== 'PUBLISHED' || linked.seriesId !== chapter.seriesId)) {
        fail(errors, `chapters[${index}].${direction}`, 'published chapters may link only to PUBLISHED chapters in the same series');
      }
    }
  }
  for (const [index, page] of pages.entries()) {
    if (!isRecord(page)) continue;
    if (!chaptersById.has(page.chapterId)) fail(errors, `storyPages[${index}].chapterId`, 'must reference an existing chapter');
    if (typeof page.assetId !== 'string' || !assetsById.has(page.assetId)) {
      fail(errors, `storyPages[${index}].assetId`, 'must reference an asset in assets/index.json');
    } else {
      const asset = assetsById.get(page.assetId);
      assetReferences.add(page.assetId);
    }
    if (!Number.isFinite(page.width) || page.width <= 0) fail(errors, `storyPages[${index}].width`, 'must be positive');
    if (!Number.isFinite(page.height) || page.height <= 0) fail(errors, `storyPages[${index}].height`, 'must be positive');
    if (typeof page.alt !== 'string' || page.alt.trim().length === 0) fail(errors, `storyPages[${index}].alt`, 'must be non-empty accessible text');
    if (!Number.isInteger(page.order) || page.order < 1) fail(errors, `storyPages[${index}].order`, 'must be a positive explicit order');
  }
  let canonicalAssetsRoot;
  try {
    canonicalAssetsRoot = await realpath(assetsRoot);
  } catch {
    canonicalAssetsRoot = null;
  }
  for (const assetId of assetReferences) {
    const asset = assetsById.get(assetId);
    if (!asset) continue;
    const info = validateAssetPath(asset.source, assetsRoot, `assets.${assetId}.source`, errors);
    if (!info) continue;
    try {
      if (!canonicalAssetsRoot) throw new Error('assets root is unavailable');
      const canonicalFile = await realpath(info.resolved);
      const canonicalRelative = path.relative(canonicalAssetsRoot, canonicalFile);
      if (canonicalRelative.startsWith('..') || path.isAbsolute(canonicalRelative)) {
        fail(errors, `assets.${assetId}.source`, 'must not resolve outside reference/assets through symlinks');
        continue;
      }
      const fileStat = await stat(canonicalFile);
      if (!fileStat.isFile()) fail(errors, `assets.${assetId}.source`, 'must resolve to a file');
    } catch {
      fail(errors, `assets.${assetId}.source`, 'does not resolve to an existing file');
    }
  }
  return errors;
}

function publicState(record) {
  return record.publicationState === 'PUBLISHED' || (record.publicationState === 'PREVIEW' && record.publicPreview === true);
}

/** Return a deterministic public-safe projection; non-public and disconnected records are excluded. */
export function projectPublicStoryContent(registry, assetManifest) {
  const seriesSource = registry.storySeries ?? [];
  const arcsSource = registry.storyArcs ?? [];
  const chaptersSource = registry.chapters ?? [];
  const pagesSource = registry.storyPages ?? [];
  const publicSeries = seriesSource.filter(publicState);
  const seriesIds = new Set(publicSeries.map(({ id }) => id));
  const publicArcs = arcsSource.filter((arc) => publicState(arc) && seriesIds.has(arc.seriesId));
  const arcIds = new Set(publicArcs.map(({ id }) => id));
  const publishedSeriesIds = new Set(publicSeries.filter((series) => series.publicationState === 'PUBLISHED').map(({ id }) => id));
  const candidateChapters = chaptersSource.filter((chapter) =>
    chapter.publicationState === 'PUBLISHED' && publishedSeriesIds.has(chapter.seriesId) && (chapter.arcId == null || arcIds.has(chapter.arcId)));
  const pagesById = new Map(pagesSource.map((page) => [page.id, page]));
  const assetsById = new Map((assetManifest.assets ?? []).map((asset) => [asset.id, asset]));
  const readerLoadable = candidateChapters.filter((chapter) =>
    Array.isArray(chapter.pageIds) && chapter.pageIds.length > 0 && chapter.pageIds.every((id) => {
      const page = pagesById.get(id);
      return page && page.publicationState === 'PUBLISHED' && page.chapterId === chapter.id;
    }));
  const chapterIds = new Set(readerLoadable.map(({ id }) => id));
  const projectedArcs = publicArcs.map((arc) => ({
    ...pickPublicFields(arc, PUBLIC_FIELDS.arcs),
    ...(Array.isArray(arc.chapterIds) ? { chapterIds: arc.chapterIds.filter((id) => chapterIds.has(id)) } : {}),
  }));
  const projectedArcIds = new Set(projectedArcs.map(({ id }) => id));
  const chapters = readerLoadable.map((chapter) => {
    const projected = pickPublicFields(chapter, PUBLIC_FIELDS.chapters);
    if (projected.displayLabel === undefined && projected.chapterLabel !== undefined) {
      projected.displayLabel = projected.chapterLabel;
    }
    if (chapter.arcId && !projectedArcIds.has(chapter.arcId)) projected.arcId = null;
    if (chapter.previousChapterId && !chapterIds.has(chapter.previousChapterId)) projected.previousChapterId = null;
    if (chapter.nextChapterId && !chapterIds.has(chapter.nextChapterId)) projected.nextChapterId = null;
    return projected;
  });
  const pages = [...new Map(chapters.flatMap((chapter) => chapter.pageIds.map((id) => [id, pagesById.get(id)]))).values()]
    .sort((left, right) => {
      const leftChapter = chapters.findIndex((chapter) => chapter.id === left.chapterId);
      const rightChapter = chapters.findIndex((chapter) => chapter.id === right.chapterId);
      return leftChapter - rightChapter || left.order - right.order;
    })
    .map((page) => pickPublicFields(page, PUBLIC_FIELDS.pages));
  const arcs = projectedArcs;
  const series = publicSeries.map((item) => {
    const projected = pickPublicFields(item, PUBLIC_FIELDS.series);
    if (Array.isArray(item.arcIds)) projected.arcIds = item.arcIds.filter((id) => projectedArcIds.has(id));
    if (Array.isArray(item.chapterIds)) projected.chapterIds = item.chapterIds.filter((id) => chapterIds.has(id));
    if (item.publicationState === 'PREVIEW') projected.previewLabel = 'PREVIEW';
    return projected;
  });
  const usedAssetIds = new Set(pages.flatMap((page) => [page.assetId, page.thumbnailAssetId]).filter(Boolean));
  for (const item of [...series, ...arcs, ...chapters]) {
    if (item.coverAssetId) usedAssetIds.add(item.coverAssetId);
    if (item.thumbnailAssetId) usedAssetIds.add(item.thumbnailAssetId);
  }
  const assets = Object.fromEntries([...usedAssetIds].sort().map((id) => {
    const asset = assetsById.get(id);
    const relative = asset.source.startsWith('reference/assets/') ? asset.source.slice('reference/assets/'.length) : asset.source;
    return [id, `/assets/${relative.split('/').map(encodeURIComponent).join('/')}`];
  }));
  return { schemaVersion: 1, series, arcs, chapters, pages, assets };
}

export function serializeStoryProjection(projection) {
  return `${JSON.stringify(projection, null, 2)}\n`;
}

export async function buildStoryContent({ projectRoot = DEFAULT_PROJECT_ROOT, check = false } = {}) {
  const registryPath = path.join(projectRoot, 'content/registry.json');
  const assetManifestPath = path.join(projectRoot, 'assets/index.json');
  const outputPath = path.join(projectRoot, 'reference/assets/data/story-content.json');
  const assetsRoot = path.join(projectRoot, 'reference/assets');
  const [registry, assetManifest] = await Promise.all([
    readFile(registryPath, 'utf8').then(JSON.parse),
    readFile(assetManifestPath, 'utf8').then(JSON.parse),
  ]);
  const errors = await validateStoryRegistry(registry, assetManifest, { assetsRoot });
  if (errors.length) throw new Error(`Story registry validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  const bytes = serializeStoryProjection(projectPublicStoryContent(registry, assetManifest));
  if (check) {
    let existing;
    try { existing = await readFile(outputPath, 'utf8'); } catch { existing = null; }
    if (existing !== bytes) throw new Error(`Story projection is stale or missing: ${outputPath}`);
    return { outputPath, bytes, wrote: false };
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes, 'utf8');
  return { outputPath, bytes, wrote: true };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invoked === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check') || args.filter((arg) => arg === '--check').length > 1) {
    console.error('Usage: node scripts/build-story-content.mjs [--check]');
    process.exitCode = 2;
  } else {
    buildStoryContent({ check: args.includes('--check') })
      .then(({ outputPath, wrote }) => console.log(`${wrote ? 'Wrote' : 'Verified'} ${outputPath}`))
      .catch((error) => { console.error(error.message); process.exitCode = 1; });
  }
}
