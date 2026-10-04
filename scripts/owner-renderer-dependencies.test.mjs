import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildReviewedOwnerRenderer} from './lib/owner-renderer-build.mjs';
import {verifyOwnerRendererProvenance} from './lib/owner-native-projection.mjs';
const studio=process.env.TOADAL_STUDIO_ROOT;
test('reviewed owner renderer closes presentation dependency deterministically and portably',()=>{
  assert(studio, 'Pass the reviewed Studio root for live dependency qualification');
  const a=buildReviewedOwnerRenderer(studio),b=buildReviewedOwnerRenderer(studio);
  assert.deepEqual(a,b);
  assert.equal(a.dependencies.length,1);
  assert.equal(a.dependencies[0].source,'packages/owner-authoring/src/presentation.ts');
  assert(!/^\s*import\s/m.test(a.generated));
  assert.equal(verifyOwnerRendererProvenance(studio).sourceChecked,true);
});
test('modified native presentation source cannot pass the renderer provenance gate',()=>{
  assert(studio);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-renderer-dependency-drift-'));
  try {
    const dest=path.join(root,'packages/owner-authoring/src');fs.mkdirSync(dest,{recursive:true});
    fs.copyFileSync(path.join(studio,'package.json'),path.join(root,'package.json'));
    for(const name of ['index.ts','presentation.ts'])fs.copyFileSync(path.join(studio,'packages/owner-authoring/src',name),path.join(dest,name));
    fs.appendFileSync(path.join(dest,'presentation.ts'),'\n// Deliberate test-only dependency drift\n');
    assert.throws(()=>verifyOwnerRendererProvenance(root),/dependency source drift/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
