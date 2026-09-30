#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve(process.argv[2]||'dist');
const base=process.argv[3]||'/';
const errors=[];
const htmlFiles=[];

function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile() && p.endsWith('.html')) htmlFiles.push(p);
  }
}
function existsTarget(rel){
  const p=path.join(dist,...rel.split('/').filter(Boolean));
  if(fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  if(fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p,'index.html'))) return true;
  if(rel.endsWith('/') && fs.existsSync(path.join(p,'index.html'))) return true;
  return false;
}
function localize(raw,fromFile){
  let u=raw.trim();
  if(!u || /^(https?:|mailto:|tel:|data:|blob:|javascript:|#)/i.test(u)) return null;
  u=u.split('#')[0].split('?')[0];
  if(!u) return null;
  if(u.startsWith('//')) return null;
  if(u.startsWith('/')){
    if(base!=='/' && u.startsWith(base)) u=u.slice(base.length);
    else if(base!=='/') return {badBase:true,url:raw};
    else u=u.slice(1);
  } else {
    const fromRel=path.relative(dist,fromFile).replace(/\\/g,'/');
    u=path.posix.normalize(path.posix.join(path.posix.dirname(fromRel),u));
  }
  return {rel:u.replace(/^\.\//,'')};
}

walk(dist);
if(!htmlFiles.length) errors.push('no HTML files found');

const tagRe=/<[a-zA-Z][^>]*>/g;
const attributeRe=/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ');
  const tags=html.match(tagRe)||[];
  for(const tag of tags){
    let m;
    attributeRe.lastIndex=0;
    while((m=attributeRe.exec(tag))){
      const x=localize(m[1],file);
      if(!x) continue;
      if(x.badBase){ errors.push(`${path.relative(dist,file)}: root URL outside base -> ${x.url}`); continue; }
      if(!existsTarget(x.rel)) errors.push(`${path.relative(dist,file)}: missing -> ${m[1]} (resolved ${x.rel})`);
    }
  }
}

if(errors.length){
  console.error('STATIC LINK CHECK FAIL');
  for(const e of errors.slice(0,300)) console.error('-',e);
  process.exit(1);
}
console.log('STATIC LINK CHECK PASS');
console.log('HTML files:',htmlFiles.length);
console.log('Base:',base);
