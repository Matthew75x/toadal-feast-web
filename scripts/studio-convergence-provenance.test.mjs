import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyPublicProjection} from './lib/owner-public-projection.mjs';
const studio=process.env.TOADAL_STUDIO_ROOT;
test('public source and LF provenance are checked and unrelated drift fails closed',()=>{
 assert(studio,'Explicit reviewed Studio root required');
 assert.equal(verifyPublicProjection(studio).sourceChecked,true);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-public-source-drift-'));
 try{
  const name='packages/export-manager/src/public-runtime.ts',dest=path.join(root,name);
  fs.mkdirSync(path.dirname(dest),{recursive:true});const source=fs.readFileSync(path.join(studio,name),'utf8');
  for(const drift of [source+'\n// unrelated drift\n',source.replaceAll('\n','\r\n')]){
   fs.writeFileSync(dest,drift);assert.throws(()=>verifyPublicProjection(root),/source drift/);
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
