#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const entry=process.argv[3]||'index.html';
const textExt=new Set(['.html','.js','.mjs','.cjs','.css','.json','.webmanifest']);
const prefixes=['assets/','src/','prod/','themes/','content/','packages/'];
const queue=[entry], seen=new Set(), unresolved=new Set();

function normalize(raw,from){
  let s=raw.replace(/\\/g,'/').replace(/[?#].*$/,'').trim();
  if(!s || /^(https?:|data:|blob:|#|javascript:|mailto:|tel:)/i.test(s)) return null;
  if(s.startsWith('/')) s=s.slice(1);
  if(prefixes.some(p=>s.startsWith(p)) || s===entry) return s;
  if(s.startsWith('./')||s.startsWith('../')) return path.posix.normalize(path.posix.join(path.posix.dirname(from),s));
  return null;
}

function extract(text,from){
  const out=new Set();
  const patterns=[
    /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'`]((?:assets|src|prod|themes|content|packages)\/[^"'`\s)<>]+)["'`]/g
  ];
  for(const re of patterns){
    let m; while((m=re.exec(text))){ const n=normalize(m[1],from); if(n) out.add(n); }
  }
  return [...out];
}

while(queue.length){
  const rel=queue.shift();
  if(seen.has(rel)) continue;
  seen.add(rel);
  const full=path.join(root,...rel.split('/'));
  if(!fs.existsSync(full)||!fs.statSync(full).isFile()){unresolved.add(rel);continue;}
  if(textExt.has(path.extname(rel).toLowerCase())){
    let txt=''; try{txt=fs.readFileSync(full,'utf8')}catch{}
    for(const r of extract(txt,rel)) if(!seen.has(r)) queue.push(r);
  }
}

const files=[...seen].filter(rel=>{
  const p=path.join(root,...rel.split('/'));
  return fs.existsSync(p)&&fs.statSync(p).isFile();
});
let bytes=0;
for(const rel of files) bytes+=fs.statSync(path.join(root,...rel.split('/'))).size;

const report={
  root,entry,files:files.length,bytes,MiB:+(bytes/1048576).toFixed(2),
  unresolved:[...unresolved].sort(),
  note:'Static-string closure only. Dynamic paths/directories require runtime verification.'
};
console.log(JSON.stringify(report,null,2));
if(report.unresolved.length) process.exitCode=2;
