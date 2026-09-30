#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo=path.resolve(process.argv[2]||'.');
const project=path.join(repo,'studio-project','toadal-feast-website');
const readJson=(rel)=>JSON.parse(fs.readFileSync(path.join(project,...rel.split('/')),'utf8').replace(/^\uFEFF/,''));
const home=readJson('pages/home.json');
const symbols=readJson('collections/symbols.json');
const gamesIndex=readJson('games/index.json');

const chunks=[];
for(const c of home.components||[]) if(c?.props?.html) chunks.push(c.props.html);
for(const name of ['CategoryTabs','DarkFeaturePanel','ToadalCompanion']){
  const s=(symbols.items||[]).find(x=>x.name===name);
  if(s?.props?.html) chunks.push(s.props.html);
}
for(const e of gamesIndex.games||[]){
  const g=readJson(e.file);
  chunks.push(g.summary||'',g.description||'',g.web?.shortDescription||'');
}
const visible=chunks.join(' ')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&rsquo;/gi,'’')
  .replace(/\s+/g,' ')
  .trim();

const forbidden=[
  ['wo-number',/\bWO-\d+\b/i],
  ['work-order',/\bwork order\b/i],
  ['staging-cartridge',/\bstaging cartridges?\b/i],
  ['package-audit',/\bpackage audit\b/i],
  ['website-qa',/\bwebsite QA\b/i],
  ['audit-required',/\bAUDIT REQUIRED\b/i],
  ['candidate-only',/\bcandidate only\b/i],
  ['app-store-urls',/\bapp-store URLs?\b/i],
  ['approved-product-screenshots',/\bapproved product screenshots\b/i]
];
const failures=forbidden.filter(([,re])=>re.test(visible)).map(([id])=>id);
console.log(JSON.stringify({
  schema:'toadal-feast.public-copy-audit.v2',
  inspectedCharacters:visible.length,
  failures,
  summary:{checked:forbidden.length,fail:failures.length,pass:forbidden.length-failures.length}
},null,2));
if(failures.length) process.exitCode=1;
