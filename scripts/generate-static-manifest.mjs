#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(process.argv[2]||'dist');
const outArg=process.argv[3]||'';
if(!fs.existsSync(root)) throw new Error(`Missing directory: ${root}`);

const files=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.isFile()) files.push(p);
  }
}
walk(root);
files.sort((a,b)=>a.localeCompare(b));

let total=0;
const entries=files.map(p=>{
  const buf=fs.readFileSync(p);
  total+=buf.length;
  return {
    path:path.relative(root,p).replace(/\\/g,'/'),
    bytes:buf.length,
    sha256:crypto.createHash('sha256').update(buf).digest('hex')
  };
});
const manifest={
  schema:'toadal-feast.web.static-manifest.v1',
  root:path.basename(root),
  files:entries.length,
  bytes:total,
  entries
};
const json=JSON.stringify(manifest,null,2)+'\n';
if(outArg) fs.writeFileSync(path.resolve(outArg),json);
else process.stdout.write(json);
