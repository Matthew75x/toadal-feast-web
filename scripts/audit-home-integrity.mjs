#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo=path.resolve(process.argv[2]||'.');
const project=path.join(repo,'studio-project','toadal-feast-website');
const page=JSON.parse(fs.readFileSync(path.join(project,'pages','home.json'),'utf8').replace(/^\uFEFF/,''));
const nav=JSON.parse(fs.readFileSync(path.join(project,'collections','navigation.json'),'utf8').replace(/^\uFEFF/,''));
const html=(page.components||[]).map(c=>c?.props?.html||'').join('\n');

const failures=[];
const warnings=[];
const ids=[...html.matchAll(/\bid=['"]([^'"]+)['"]/gi)].map(m=>m[1]);
for(const component of page.components||[]) if(component?.props?.anchorId) ids.push(component.props.anchorId);
ids.push('main-content'); // shared generated route-shell landmark
const counts=ids.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
for(const [id,count] of counts) if(count>1) failures.push({type:'duplicate-id',id,count});

const anchors=[
  ...[...html.matchAll(/\bhref=['"]#([^'"]+)['"]/gi)].map(m=>m[1]),
  ...(nav.primary||[]).concat(nav.footer||[]).map(x=>String(x.href||'').match(/#([^#]+)$/)?.[1]).filter(Boolean)
];
for(const target of new Set(anchors)) if(!counts.has(target)) failures.push({type:'missing-anchor-target',target});

const h1Count=(html.match(/<h1\b/gi)||[]).length;
if(h1Count!==1) failures.push({type:'h1-count',count:h1Count});

const imgs=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
for(const tag of imgs){
 const src=tag.match(/\bsrc=['"]([^'"]+)['"]/i)?.[1]||'(unknown)';
 if(!/\balt=['"][^'"]*['"]/i.test(tag)) failures.push({type:'image-alt-missing',src});
}

const buttons=[...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)];
for(const m of buttons){
 const full=m[0],inner=m[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
 const aria=full.match(/\baria-label=['"]([^'"]+)['"]/i)?.[1]?.trim();
 if(!inner&&!aria)failures.push({type:'button-name-missing',snippet:full.slice(0,120)});
}

const progressbars=[...html.matchAll(/<[^>]+role=['"]progressbar['"][^>]*>/gi)].map(m=>m[0]);
for(const tag of progressbars){
 for(const name of ['aria-valuemin','aria-valuemax','aria-valuenow']){
  if(!new RegExp('\\b'+name+'=','i').test(tag))failures.push({type:'progressbar-aria-missing',attribute:name});
 }
}

const liveRegions=(html.match(/aria-live=['"][^'"]+['"]/gi)||[]).length;
if(!liveRegions)warnings.push({type:'no-live-region'});

console.log(JSON.stringify({
 schema:'toadal-feast.home-integrity-audit.v2',
 summary:{ids:ids.length,uniqueIds:counts.size,anchorReferences:anchors.length,h1Count,images:imgs.length,buttons:buttons.length,progressbars:progressbars.length,liveRegions,failures:failures.length,warnings:warnings.length},
 failures,warnings
},null,2));
if(failures.length)process.exitCode=1;
