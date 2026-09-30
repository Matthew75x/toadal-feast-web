#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo=path.resolve(process.argv[2]||'.');
const page=JSON.parse(fs.readFileSync(path.join(repo,'studio-project','toadal-feast-website','pages','home.json'),'utf8').replace(/^\uFEFF/,''));
const html=(page.components||[]).map(c=>c?.props?.html||'').join('\n');
const text=html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&rsquo;/gi,'’')
  .replace(/\s+/g,' ')
  .trim();

const hard=[
  ['work-order',/\bwork order\b/i],
  ['website-qa',/\bwebsite QA\b/i],
  ['package-audit',/\bpackage audit\b/i],
  ['audit-required',/\baudit required\b/i],
  ['candidate-only',/\bcandidate only\b/i],
  ['operator-gate',/\brelease gate\b|\bdeployment gate\b/i]
];
const soft=[
  ['web-build',/\bweb build\b/i],
  ['app-store-urls',/\bapp-store URLs?\b/i],
  ['approved-product-screenshots',/\bapproved product screenshots\b/i]
];
const failures=hard.filter(([,re])=>re.test(text)).map(([id])=>id);
const warnings=soft.filter(([,re])=>re.test(text)).map(([id])=>id);
console.log(JSON.stringify({schema:'toadal-feast.public-copy-audit.v1',failures,warnings,summary:{hardJargon:failures.length,softJargon:warnings.length}},null,2));
if(failures.length)process.exitCode=1;
