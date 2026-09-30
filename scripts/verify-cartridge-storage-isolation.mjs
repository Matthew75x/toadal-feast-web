#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const expected='toadal:game:toadal-feast-arcade-preview:v1:';
const textFiles=[];

function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile() && /\.(?:js|mjs|cjs|html|json)$/.test(e.name)) textFiles.push(p);
  }
}
walk(root);

const directLegacy=[];
const namespaceHits=[];
const storagePattern=/(?:localStorage\.(?:getItem|setItem|removeItem)|(?:STORAGE|SAVE|MODE_SETTINGS|CONTEXT|BASE)_?KEY[^=]*=)[^\n]{0,120}["'`](froggyFeast[^"'`]*)["'`]/gi;

for(const file of textFiles){
  const text=fs.readFileSync(file,'utf8');
  if(text.includes(expected)) namespaceHits.push(path.relative(root,file).replace(/\\/g,'/'));
  let m;
  while((m=storagePattern.exec(text))){
    directLegacy.push({
      file:path.relative(root,file).replace(/\\/g,'/'),
      key:m[1]
    });
  }
}

const unique=[...new Map(directLegacy.map(x=>[`${x.file}|${x.key}`,x])).values()];
console.log(JSON.stringify({
  root,
  expectedNamespace:expected,
  namespacedFiles:namespaceHits,
  legacyStorageReferences:unique
},null,2));

if(!namespaceHits.length){
  console.error('FAIL: cartridge namespace not found');
  process.exitCode=1;
}
if(unique.length){
  console.error('FAIL: legacy froggyFeast storage references remain in cartridge package');
  process.exitCode=1;
}
if(!process.exitCode) console.log('CARTRIDGE STORAGE ISOLATION CHECK PASS');
