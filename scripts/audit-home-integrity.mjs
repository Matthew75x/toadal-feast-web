#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const template = fs.readFileSync(path.join(project, 'reference', 'home-template.html'), 'utf8');
const page = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'home.json'), 'utf8').replace(/^\uFEFF/, ''));
const portal = page.components?.map(c => c?.props?.html || '').join('\n') || '';
const rendered = template.replace('<main id="main-content"></main>', '<main id="main-content">' + portal + '</main>');

const failures = [];
const warnings = [];
const ids = [...rendered.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
const counts = ids.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
for (const [id,count] of counts) if (count > 1) failures.push({type:'duplicate-id',id,count});

const anchorTargets = [...rendered.matchAll(/\bhref=["']#([^"']+)["']/gi)].map(m=>m[1]);
for (const target of new Set(anchorTargets)) {
  if (!counts.has(target)) failures.push({type:'missing-anchor-target',target});
}

const h1Count = (rendered.match(/<h1\b/gi)||[]).length;
if (h1Count !== 1) failures.push({type:'h1-count',count:h1Count});

const imgs = [...rendered.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
for (const tag of imgs) {
  const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] || '(unknown)';
  if (!/\balt=["'][^"']*["']/i.test(tag)) failures.push({type:'image-alt-missing',src});
}
const buttons = [...rendered.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)];
for (const m of buttons) {
  const full = m[0];
  const innerText = m[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const aria = full.match(/\baria-label=["']([^"']+)["']/i)?.[1]?.trim();
  if (!innerText && !aria) failures.push({type:'button-name-missing',snippet:full.slice(0,120)});
}

const progressbars = [...rendered.matchAll(/<[^>]+role=["']progressbar["'][^>]*>/gi)].map(m=>m[0]);
for (const tag of progressbars) {
  for (const name of ['aria-valuemin','aria-valuemax','aria-valuenow']) {
    if (!new RegExp('\\b'+name+'=', 'i').test(tag)) failures.push({type:'progressbar-aria-missing',attribute:name});
  }
}

const liveRegions = [...rendered.matchAll(/<[^>]+aria-live=["']([^"']+)["'][^>]*>/gi)].length;
if (!liveRegions) warnings.push({type:'no-live-region'});

const futureRouteLinks = [...rendered.matchAll(/<a\b[^>]*\bhref=["']([^"'#][^"']*)["'][^>]*>/gi)]
  .map(m=>m[1])
  .filter(h=>!/^\.?\/?$/.test(h) && !/^(?:https?:|mailto:|tel:)/i.test(h));
if (futureRouteLinks.length) warnings.push({type:'non-anchor-local-links',links:[...new Set(futureRouteLinks)]});

console.log(JSON.stringify({
  schema:'toadal-feast.home-integrity-audit.v1',
  summary:{
    ids:ids.length,
    uniqueIds:counts.size,
    anchorReferences:anchorTargets.length,
    h1Count,
    images:imgs.length,
    buttons:buttons.length,
    progressbars:progressbars.length,
    failures:failures.length,
    warnings:warnings.length
  },
  failures,
  warnings
},null,2));

if (failures.length) process.exitCode=1;
