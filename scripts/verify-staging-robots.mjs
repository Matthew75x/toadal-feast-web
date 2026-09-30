#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve(process.argv[2]||'dist');
const mode=(process.argv[3]||'staging').toLowerCase();
const files=[];
function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile()&&p.endsWith('.html')) files.push(p);
  }
}
walk(dist);
const errors=[];
for(const f of files){
  const s=fs.readFileSync(f,'utf8').toLowerCase();
  const hasNoindex=/name=["']robots["'][^>]*content=["'][^"']*noindex/.test(s) ||
                   /content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/.test(s);
  const hasNofollow=/name=["']robots["'][^>]*content=["'][^"']*nofollow/.test(s) ||
                    /content=["'][^"']*nofollow[^"']*["'][^>]*name=["']robots["']/.test(s);
  if(mode==='staging' && (!hasNoindex || !hasNofollow)) errors.push(`${path.relative(dist,f)} missing staging noindex,nofollow`);
}
if(errors.length){
  console.error('ROBOTS CHECK FAIL');
  errors.forEach(e=>console.error('-',e));
  process.exit(1);
}
console.log('ROBOTS CHECK PASS');
console.log('Mode:',mode);
console.log('HTML files:',files.length);
