import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const registry = JSON.parse(fs.readFileSync(path.join(project, 'content', 'registry.json'), 'utf8'));
const NEWS_CATEGORIES = new Set(['announcements', 'development', 'games', 'world-stories']);
const ROADMAP_STATUSES = { PREVIEW: 'available-now', COMING_SOON: 'coming-soon', PLANNED: 'exploring' };

function validSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function validInternalRoute(value) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\\s]/.test(value) && !/(?:^|\/)\.\.(?:\/|$)/.test(value);
}

function stringsOnly(value, requireNonblank) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && (!requireNonblank || item.trim())).map((item) => item.trim());
}

function projectPullQuote(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.text !== 'string' || !value.text.trim()) return null;
  return {
    text: value.text.trim(),
    ...(typeof value.attribution === 'string' && value.attribution.trim() ? { attribution: value.attribution.trim() } : {})
  };
}

function isPublicNewsRecord(item) {
  return !!item && typeof item === 'object' && !Array.isArray(item) && item.publicationState === 'PUBLISHED' &&
    validSlug(item.slug) && typeof item.title === 'string' && !!item.title.trim() &&
    typeof item.summary === 'string' && !!item.summary.trim() && NEWS_CATEGORIES.has(item.category) && validDate(item.publishedAt);
}

export function projectNewsRecords(items) {
  const published = (Array.isArray(items) ? items : []).filter(isPublicNewsRecord);
  const approvedSlugs = new Set(published.map((item) => item.slug));

  return published.map((item) => {
    const projected = {
      slug: item.slug,
      title: item.title.trim(),
      summary: item.summary.trim(),
      category: item.category,
      publishedAt: item.publishedAt,
      publicationState: 'PUBLISHED',
      tags: stringsOnly(item.tags, false),
      body: stringsOnly(item.body, true),
      image: typeof item.image === 'string' && /^\/assets\/[a-zA-Z0-9_./-]+$/.test(item.image) && !item.image.includes('..') ? item.image : '',
      imageAlt: typeof item.imageAlt === 'string' ? item.imageAlt : ''
    };
    if (typeof item.featured === 'boolean') projected.featured = item.featured;
    const pullQuote = projectPullQuote(item.pullQuote);
    if (pullQuote) projected.pullQuote = pullQuote;
    if (Array.isArray(item.relatedSlugs)) {
      const seen = new Set();
      projected.relatedSlugs = item.relatedSlugs.filter((slug) => {
        if (!validSlug(slug) || slug === item.slug || !approvedSlugs.has(slug) || seen.has(slug)) return false;
        seen.add(slug);
        return true;
      });
    }
    return projected;
  });
}

export function projectRoadmapItems(items, newsItems) {
  const approvedNewsSlugs = new Set(projectNewsRecords(newsItems).map((item) => item.slug));
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item) && item.publicationState === 'PREVIEW' && ROADMAP_STATUSES[item.publicStatus] &&
      validSlug(item.slug) && typeof item.title === 'string' && !!item.title.trim() &&
      typeof item.description === 'string' && !!item.description.trim() && validInternalRoute(item.route))
    .map((item) => {
      const projected = {
        slug: item.slug,
        title: item.title.trim(),
        summary: item.description.trim(),
        status: ROADMAP_STATUSES[item.publicStatus],
        publicStatus: item.publicStatus,
        route: item.route,
        publicationState: 'PUBLISHED'
      };
      if (Array.isArray(item.relatedDevlogSlugs)) {
        const seen = new Set();
        projected.relatedDevlogSlugs = item.relatedDevlogSlugs.filter((slug) => {
          if (!validSlug(slug) || !approvedNewsSlugs.has(slug) || seen.has(slug)) return false;
          seen.add(slug);
          return true;
        });
      }
      return projected;
    });
}

const news = projectNewsRecords(registry.news);
const roadmap = projectRoadmapItems(registry.roadmapItems, news);
const output = path.join(project, 'reference', 'assets', 'data', 'manifest-public-content.json');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({ schema: 'toadal.manifest-public-content.v1', news, roadmap }, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(repo, output), news: news.length, roadmap: roadmap.length, statuses: [...new Set(roadmap.map((item) => item.status))] }, null, 2));
}
