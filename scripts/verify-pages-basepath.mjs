#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const base = process.argv[3] || '/toadal-feast-web/';

function fail(msg) {
  console.error('FAIL:', msg);
  process.exitCode = 1;
}
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(path.join(dist,'index.html'))) fail('missing dist/index.html');
if (!fs.existsSync(path.join(dist,'404.html'))) fail('missing dist/404.html');

const htmlFiles = walk(dist).filter(p => p.endsWith('.html'));
const rootAbs = [];
const attrRe = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file,'utf8');
  let m;
  while ((m = attrRe.exec(html))) {
    const u = m[1].trim();
    if (!u.startsWith('/') || u.startsWith('//')) continue;
    if (base === '/') continue;
    if (u === base || u.startsWith(base)) continue;
    rootAbs.push({file:path.relative(dist,file),url:u});
  }
}

if (rootAbs.length) {
  fail('root-absolute internal URLs will break GitHub project Pages base path');
  for (const x of rootAbs) console.error(' ',x.file,'->',x.url);
}

if (!process.exitCode) {
  console.log('PAGES BASEPATH CHECK PASS');
  console.log('HTML files:', htmlFiles.length);
  console.log('Base:', base);
}
