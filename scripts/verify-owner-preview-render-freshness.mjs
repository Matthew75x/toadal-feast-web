#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { rewriteHtml, normalizeBasePath } from './wo001-pages-basepath.mjs';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';
import { createPublicProjector } from './lib/owner-public-projection.mjs';
import { projectIntrinsicImageDimensions } from './lib/intrinsic-image-dimensions.mjs';
import { normalizeCssUrlQuoteEntities } from './lib/normalize-css-url-quotes.mjs';

const root = path.resolve(process.argv[2] || '.');
const dist = path.resolve(root, process.argv[3] || 'dist');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const pageIndex = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8')).pages || [];
const sourceErrors = [];
const staleErrors = [];
const basePath = normalizeBasePath(process.argv[4] || '/toadal-feast-web/');
const normalizeText = value => value.replaceAll('\r\n', '\n');
const escapeHtmlAttribute = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll("'", '&#39;');
const projector = await createOwnerNativeProjector();
const publicProjection = await createPublicProjector();
// Match Studio 1.4.2's safeRich boundary: scripts are loaded by the shared
// runtime, never emitted from authored rich text. No Studio source is changed.
const studioRichText = value => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
  .replace(/javascript:/gi, '');

function normalizeHtmlAttributeSerialization(html) {
  return String(html).replace(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g, tag => {
    if (tag.startsWith('<!--')) return tag;
    const close = tag.match(/^<\/\s*([A-Za-z][\w:-]*)\s*>$/);
    if (close) return `</${close[1].toLowerCase()}>`;
    const opening = tag.match(/^<([A-Za-z][\w:-]*)([\s\S]*)>$/);
    if (!opening) return tag;
    const tagName = opening[1].toLowerCase();
    let source = opening[2];
    const selfClosing = /\/\s*$/.test(source);
    if (selfClosing) source = source.replace(/\/\s*$/, '');
    const attributes = [];
    let cursor = 0;
    while (cursor < source.length) {
      while (/\s/.test(source[cursor] || '')) cursor++;
      if (cursor >= source.length) break;
      const nameStart = cursor;
      while (cursor < source.length && !/[\s=/>]/.test(source[cursor])) cursor++;
      if (cursor === nameStart) return tag;
      const name = source.slice(nameStart, cursor).toLowerCase();
      while (/\s/.test(source[cursor] || '')) cursor++;
      if (source[cursor] !== '=') {
        attributes.push([name, null]);
        continue;
      }
      cursor++;
      while (/\s/.test(source[cursor] || '')) cursor++;
      const quote = source[cursor] === '"' || source[cursor] === "'" ? source[cursor++] : '';
      const valueStart = cursor;
      if (quote) {
        while (cursor < source.length && source[cursor] !== quote) cursor++;
        if (cursor >= source.length) return tag;
      } else {
        while (cursor < source.length && !/\s/.test(source[cursor])) cursor++;
      }
      const attributeValue = source.slice(valueStart, cursor);
      attributes.push([name, name === 'style' ? normalizeCssUrlQuoteEntities(attributeValue) : attributeValue]);
      if (quote) cursor++;
    }
    attributes.sort((left, right) => left[0].localeCompare(right[0]));
    const serialized = attributes.map(([name, value]) => value === null ? ` ${name}` : ` ${name}=${JSON.stringify(value)}`).join('');
    return `<${tagName}${serialized}${selfClosing ? '/' : ''}>`;
  });
}

function distFileFor(route) {
  if (route === '/') return path.join(dist, 'index.html');
  if (route === '/404.html') return path.join(dist, '404.html');
  return path.join(dist, route.replace(/^\//, ''), 'index.html');
}
function inspect(route, cfg = {}) {
  const record = pageIndex.find((item) => item.route === route);
  if (!record) {
    sourceErrors.push(`registered route missing: ${route}`);
    return;
  }
  const sourceFile = path.join(site, record.file);
  const renderedFile = distFileFor(route);
  if (!fs.existsSync(sourceFile)) sourceErrors.push(`source missing for ${route}: ${record.file}`);
  if (!fs.existsSync(renderedFile)) {
    staleErrors.push(`render missing for ${route}: ${path.relative(root, renderedFile)}`);
    return;
  }
  const page = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  let sourceProjection;
  try {
    sourceProjection = projector.projectPageComponents(site, page).map(({ html }) => html).join('\n');
  } catch (error) {
    sourceErrors.push(`${route} source projection failed: ${error.message}`);
    sourceProjection = '';
  }
  const legacyStructuredSource = JSON.stringify((page.components || []).filter(component =>
    !component.props?.authoringVersion && typeof component.props?.html !== 'string'), null, 2);
  const source = `${sourceProjection}\n${legacyStructuredSource}`;
  const rendered = fs.readFileSync(renderedFile, 'utf8');
  const sourceLower = source.toLowerCase();
  const renderedLower = rendered.toLowerCase();
  for (const phrase of cfg.sourceExpected || []) {
    if (!sourceLower.includes(phrase.toLowerCase())) sourceErrors.push(`${route} source missing sentinel: ${phrase}`);
  }
  for (const phrase of cfg.renderExpected || cfg.sourceExpected || []) {
    if (!renderedLower.includes(phrase.toLowerCase())) staleErrors.push(`${route} render stale/missing sentinel: ${phrase}`);
  }
  for (const phrase of cfg.forbidden || []) {
    if (sourceLower.includes(phrase.toLowerCase())) sourceErrors.push(`${route} source contains stale phrase: ${phrase}`);
    if (renderedLower.includes(phrase.toLowerCase())) staleErrors.push(`${route} render contains stale phrase: ${phrase}`);
  }
}

for (const record of pageIndex) {
  if (!fs.existsSync(distFileFor(record.route))) {
    staleErrors.push(`registered route has no rendered HTML: ${record.route}`);
    continue;
  }
  const page = JSON.parse(fs.readFileSync(path.join(site, record.file), 'utf8'));
  const rendered = normalizeText(fs.readFileSync(distFileFor(record.route), 'utf8'));
  const renderedForSubtrees = normalizeHtmlAttributeSerialization(rendered);
  for (const component of page.components || []) {
    const isNative = component.props?.authoringVersion === 1;
    const isLegacyRichText = component.type === 'core.rich-text' && component.props?.html;
    if (!isNative && !isLegacyRichText) continue;
    let projected;
    try {
      projected = isNative
        ? projector.projectComponentHtml(site, component)
        : studioRichText(projector.projectComponentHtml(site, component));
    } catch (error) {
      sourceErrors.push(`${record.route} source projection failed for ${component.id}: ${error.message}`);
      continue;
    }
    if (isNative) {
      const props = component.props || {};
      const anchorId = String(props.anchorId || '').trim().replace(/[^A-Za-z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '');
      for (const [name, value] of [
        ...(anchorId ? [['id', anchorId]] : []),
        ...(props.variant ? [['data-studio-variant', props.variant]] : [])
      ]) {
        const escaped = escapeHtmlAttribute(value);
        if (!projected.includes(`${name}='${escaped}'`) && !projected.includes(`${name}="${escaped}"`)) {
          sourceErrors.push(`${record.route} native projection dropped ${name} metadata: ${component.id}`);
        }
      }
    }
    const publicHtml=normalizeText(rewriteHtml(publicProjection(projected), basePath).value);
    const expected = normalizeHtmlAttributeSerialization(publicHtml);
    // Accept either exact native output or its exact approved image-header transform.
    // No attributes are removed; wrong dimensions and copy still fail.
    const pageRel=path.relative(dist,distFileFor(record.route)).split(path.sep).join('/');
    const expectedWithDimensions=normalizeHtmlAttributeSerialization(projectIntrinsicImageDimensions(publicHtml,dist,pageRel,basePath).html);
    const emptyNativeComponentAbsent = !expected && !rendered.includes(`data-studio-component='${component.id}'`)
      && !rendered.includes(`data-studio-component="${component.id}"`)
      && !rendered.includes(`data-toadal-node='${component.id}'`) && !rendered.includes(`data-toadal-node="${component.id}"`);
    if ((expected && !renderedForSubtrees.includes(expected) && !renderedForSubtrees.includes(expectedWithDimensions)) || (!expected && isNative && !emptyNativeComponentAbsent)) {
      staleErrors.push(`${record.route} ${isNative ? 'native' : 'rich-text'} component stale: ${component.id}`);
    }
  }
}
for (const name of ['guest-progression.js', 'progression-definitions.js', 'website-score-adapter.js', 'editorial-manifest.js']) {
  const source = path.join(site, 'reference/assets/js', name);
  const exported = path.join(dist, 'assets/js', name);
  if (!fs.existsSync(exported) || normalizeText(fs.readFileSync(source, 'utf8')) !== normalizeText(fs.readFileSync(exported, 'utf8'))) {
    staleErrors.push('Runtime export stale: ' + name);
  }
}

inspect('/404.html', {
  sourceExpected: ['Search the Feast', "href='/search/'"],
  renderExpected: ['Search the Feast', '/search/'],
  forbidden: ['Search is coming soon']
});
inspect('/characters/', {
  sourceExpected: ['Mark character artwork as viewed to save a discovery in this browser', "href='/characters/toadal/'"],
  renderExpected: ['Mark character artwork as viewed to save a discovery in this browser', '/characters/toadal/']
});
inspect('/characters/toadal/', {
  sourceExpected: ['Browser-local progression is active', 'character-specific collectible records are not configured'],
  forbidden: ['Guest collection coming later', 'will connect to browser-local progression', 'before that system exists']
});
inspect('/news/', {
  sourceExpected: ['Only approved, published editorial appears here', 'No public news updates have been published yet'],
  forbidden: ['Story updates unavailable', 'A story archive and publishing schedule have not been made available']
});
inspect('/media/', {
  sourceExpected: ['not a downloadable press or media library'],
  forbidden: ['not a published media library']
});
inspect('/search/', {
  sourceExpected: ['data-site-search', 'LOCAL PREVIEW SEARCH']
});
inspect('/stories/', {
  sourceExpected: ["href='/manga/'", 'PUBLISHING PREVIEW'],
  renderExpected: ['/manga/', 'PUBLISHING PREVIEW']
});
inspect('/manga/', {
  sourceExpected: ["href='/reader/'", '0 published'],
  renderExpected: ['/reader/', '0 published']
});
inspect('/reader/', {
  sourceExpected: ['data-reader-shell', 'No chapter selected']
});
inspect('/feast-pass/', {
  sourceExpected: ["data-progression-stat='level'", "data-progression-stat='sparks'"]
});
inspect('/profile/', {
  sourceExpected: ["data-progression-page='profile'", "data-progression-stat='level'"]
});

const searchIndex = path.join(dist, 'assets', 'data', 'local-search-index.json');
if (!fs.existsSync(searchIndex)) staleErrors.push('rendered local-search-index.json missing');
else {
  const data = JSON.parse(fs.readFileSync(searchIndex, 'utf8'));
  if (!Array.isArray(data.entries) || data.entries.length < 48) {
    staleErrors.push(`rendered search index unexpectedly small: ${Array.isArray(data.entries) ? data.entries.length : 'invalid'}`);
  }
}

if (sourceErrors.length || staleErrors.length) {
  console.error('OWNER PREVIEW RENDER FRESHNESS: FAIL');
  if (sourceErrors.length) {
    console.error('Source check failures:');
    for (const error of sourceErrors) console.error('-', error);
  }
  if (staleErrors.length) {
    console.error('Output staleness failures:');
    for (const error of staleErrors) console.error('-', error);
  }
  process.exit(1);
}
console.log('OWNER PREVIEW RENDER FRESHNESS: PASS');
console.log(JSON.stringify({registeredRoutes: pageIndex.length, dist, searchEntriesMinimum: 48}, null, 2));
