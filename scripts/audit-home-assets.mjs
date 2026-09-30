#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const page = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'home.json'), 'utf8').replace(/^\uFEFF/, ''));
const html = page.components?.map(c => c?.props?.html || '').join('\n') || '';
const refRoot = path.join(project, 'reference');

const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
const rows = [];
const failures = [];
const unique = new Map();

const attr = (tag, name) => {
  const m = tag.match(new RegExp('\\b' + name + '=["\\\']([^"\\\']*)["\\\']', 'i'));
  return m ? m[1] : null;
};

for (const tag of tags) {
  const src = attr(tag, 'src');
  const alt = attr(tag, 'alt');
  const loading = attr(tag, 'loading');
  const fetchpriority = attr(tag, 'fetchpriority');
  if (!src || /^(?:https?:|data:)/i.test(src)) continue;
  const file = path.join(refRoot, ...src.split('/'));
  const exists = fs.existsSync(file);
  const bytes = exists ? fs.statSync(file).size : null;
  const aboveFold = fetchpriority === 'high';
  const immediateUi = aboveFold;
  const decorative = alt === '';
  if (!exists) failures.push({type:'missing-asset',src});
  if (alt === null) failures.push({type:'missing-alt-attribute',src});
  if (!immediateUi && loading !== 'lazy') failures.push({type:'below-fold-not-lazy',src});
  if (aboveFold && loading === 'lazy') failures.push({type:'hero-lazy-loaded',src});
  if (exists && !unique.has(src)) unique.set(src, bytes);
  rows.push({src,bytes,loading:loading||'eager',fetchpriority:fetchpriority||null,aboveFold,decorative});
}
const totalUniqueBytes = [...unique.values()].reduce((a,b)=>a+b,0);
const largest = [...unique.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([src,bytes])=>({src,bytes}));
const summary = {
  imageTags: rows.length,
  uniqueLocalImages: unique.size,
  uniqueImageBytes: totalUniqueBytes,
  uniqueImageMiB: Number((totalUniqueBytes/1048576).toFixed(2)),
  largest,
  failures: failures.length
};

console.log(JSON.stringify({
  schema:'toadal-feast.home-asset-audit.v1',
  rows,
  summary,
  failures,
  guidance:'Byte counts are measurements, not universal eligibility caps. Optimize where it improves real loading/quality.'
}, null, 2));

if (failures.length) process.exitCode = 1;
