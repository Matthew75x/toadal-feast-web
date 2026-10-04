import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createPublicProjector,verifyPublicProjection} from './lib/owner-public-projection.mjs';
const repo=path.resolve(import.meta.dirname,'..');
test('exact accepted public projection preserves author values and replaces only editor identities',async()=>{
 const project=await createPublicProjector();
 const html="<p data-studio-component='node.a' data-studio-edit-field='text' data-studio-locked='true' style='color:pink'>Owner copy: data-studio-component</p>";
 assert.equal(project(html),"<p data-toadal-node='node.a' style='color:pink'>Owner copy: data-studio-component</p>");
 assert.equal(verifyPublicProjection(process.env.TOADAL_STUDIO_ROOT).sourceChecked,!!process.env.TOADAL_STUDIO_ROOT);
});
test('static freshness accepts canonical public output and rejects changed copy, missing recovery link and missing search data',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-public-freshness-'));
 try {
  const dist=path.join(tmp,'dist');fs.cpSync(path.join(repo,'dist'),dist,{recursive:true});
  const run=()=>spawnSync(process.execPath,[path.join(repo,'scripts/verify-owner-preview-render-freshness.mjs'),repo,dist],{encoding:'utf8'});
  const initial=run();assert.equal(initial.status,0,initial.stderr);
  const home=path.join(dist,'index.html'),original=fs.readFileSync(home,'utf8');
  assert(original.includes('Play the Feast World for Free'));fs.writeFileSync(home,original.replaceAll('Play the Feast World for Free','UNAUTHORED STALE CONTENT'));
  const stale=run();assert.notEqual(stale.status,0);assert.match(stale.stderr,/native component stale/);fs.writeFileSync(home,original);
  const missing=path.join(dist,'404.html'),recovery=fs.readFileSync(missing,'utf8');assert(recovery.includes('/toadal-feast-web/search/'));
  fs.writeFileSync(missing,recovery.replaceAll('/toadal-feast-web/search/','/toadal-feast-web/INVALID-RECOVERY/'));
  assert.notEqual(run().status,0);fs.writeFileSync(missing,recovery);
  fs.renameSync(path.join(dist,'assets/data/local-search-index.json'),path.join(tmp,'search-index-preserved.json'));
  const absent=run();assert.notEqual(absent.status,0);assert.match(absent.stderr,/local-search-index.json missing/);assert(!absent.stderr.includes('ReferenceError'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
