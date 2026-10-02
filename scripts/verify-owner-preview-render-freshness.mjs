#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const dist = path.resolve(root, process.argv[3] || 'dist');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const pageIndex = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8')).pages || [];
const errors = [];

function distFileFor(route) {
  if (route === '/') return path.join(dist, 'index.html');
  if (route === '/404.html') return path.join(dist, '404.html');
  return path.join(dist, route.replace(/^\//, ''), 'index.html');
}
function inspect(route, cfg = {}) {
  const record = pageIndex.find((item) => item.route === route);
  if (!record) {
    errors.push(`registered route missing: ${route}`);
    return;
  }
  const sourceFile = path.join(site, record.file);
  const renderedFile = distFileFor(route);
  if (!fs.existsSync(sourceFile)) errors.push(`source missing for ${route}: ${record.file}`);
  if (!fs.existsSync(renderedFile)) {
    errors.push(`render missing for ${route}: ${path.relative(root, renderedFile)}`);
    return;
  }
  const source = fs.readFileSync(sourceFile, 'utf8');
  const rendered = fs.readFileSync(renderedFile, 'utf8');
  const sourceLower = source.toLowerCase();
  const renderedLower = rendered.toLowerCase();
  for (const phrase of cfg.sourceExpected || []) {
    if (!sourceLower.includes(phrase.toLowerCase())) errors.push(`${route} source missing sentinel: ${phrase}`);
  }
  for (const phrase of cfg.renderExpected || cfg.sourceExpected || []) {
    if (!renderedLower.includes(phrase.toLowerCase())) errors.push(`${route} render stale/missing sentinel: ${phrase}`);
  }
  for (const phrase of cfg.forbidden || []) {
    if (sourceLower.includes(phrase.toLowerCase())) errors.push(`${route} source contains stale phrase: ${phrase}`);
    if (renderedLower.includes(phrase.toLowerCase())) errors.push(`${route} render contains stale phrase: ${phrase}`);
  }
}

for (const record of pageIndex) {
  if (!fs.existsSync(distFileFor(record.route))) {
    errors.push(`registered route has no rendered HTML: ${record.route}`);
  }
}

inspect('/404.html', {
  sourceExpected: ['Search the Feast', '"href": "/search/"'],
  renderExpected: ['Search the Feast', '/search/'],
  forbidden: ['Search is coming soon']
});
inspect('/characters/', {
  sourceExpected: ['Guest website progression is active on this browser', "href='/characters/toadal/'"],
  renderExpected: ['Guest website progression is active on this browser', '/characters/toadal/']
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
if (!fs.existsSync(searchIndex)) errors.push('rendered local-search-index.json missing');
else {
  const data = JSON.parse(fs.readFileSync(searchIndex, 'utf8'));
  if (!Array.isArray(data.entries) || data.entries.length < 48) {
    errors.push(`rendered search index unexpectedly small: ${Array.isArray(data.entries) ? data.entries.length : 'invalid'}`);
  }
}

if (errors.length) {
  console.error('OWNER PREVIEW RENDER FRESHNESS: FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}
console.log('OWNER PREVIEW RENDER FRESHNESS: PASS');
console.log(JSON.stringify({registeredRoutes: pageIndex.length, dist, searchEntriesMinimum: 48}, null, 2));
