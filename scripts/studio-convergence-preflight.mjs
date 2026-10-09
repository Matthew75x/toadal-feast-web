#!/usr/bin/env node
// Explicit source-bound gate. Ordinary local-design preflight stays hermetic.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectEngine,runtimeIdentity,noSymlinkPath,git,WEBSITE_ROOT,treeFingerprint} from './local-design-preflight.mjs';
import {verifyOwnerRendererProvenance} from './lib/owner-native-projection.mjs';
import {verifyPublicProjection} from './lib/owner-public-projection.mjs';

export function requireCompleteExactEngine(engine,expected,{allowArchivalDocs=false}={}){
 if(engine.commit!==expected.commit)throw Error('Convergence requires exact reviewed engine commit');
 if(!engine.completeWorkingTree||engine.missingTrackedFiles!==0){
  const allowed=expected.reviewedArchivalExclusions||[];
  if(!allowArchivalDocs||!Array.isArray(engine.missingTrackedPaths)||engine.missingTrackedPaths.length!==engine.missingTrackedFiles||engine.missingTrackedPaths.some(p=>!p.startsWith('docs/v51/evidence/')||!(/\.(?:png|json)$/i.test(p))||!allowed.includes(p)))throw Error('Convergence requires complete tracked engine source; only explicit reviewed archival exclusions may remain open');
 }
 return engine;
}
export function convergencePreflight({engineRoot,websiteRoot=WEBSITE_ROOT,nodeVersion=process.versions.node,allowArchivalDocs=false}={}){
 if(!engineRoot)throw Error('Explicit reviewed Studio root required');
 const runtime=runtimeIdentity(nodeVersion),repo=noSymlinkPath(websiteRoot);
 const expected=JSON.parse(fs.readFileSync(path.join(repo,'scripts/vendor/studio-convergence-source.json'),'utf8'));
 const engine=requireCompleteExactEngine(inspectEngine(engineRoot,expected),expected,{allowArchivalDocs});
 const vendors=[verifyOwnerRendererProvenance(engine.root),verifyPublicProjection(engine.root)];
 if(vendors.some(item=>item.sourceChecked!==true))throw Error('Convergence requires sourceChecked:true for both projectors');
 return {schema:'toadal.studio-website-convergence.v1',runtime,engine,vendors,sourceChecked:true,sourceScope:engine.completeWorkingTree?'complete tracked repository':'all executable source/dependencies/tests/fixtures verified; explicitly listed archival docs missing',fullRepositoryMaterialization:engine.completeWorkingTree?'COMPLETE':'OPEN',website:{commit:git(repo,'rev-parse','HEAD'),tree:git(repo,'rev-parse','HEAD^{tree}'),workingTreeDirty:!!git(repo,'status','--porcelain'),native:treeFingerprint(path.join(repo,'studio-project/toadal-feast-website'))},remoteWrites:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv.length<3||process.argv.length>4||(process.argv[3]&&process.argv[3]!=='--allow-archival-docs'))throw Error('Usage: node scripts/studio-convergence-preflight.mjs <reviewed Studio root> [--allow-archival-docs]');console.log(JSON.stringify(convergencePreflight({engineRoot:process.argv[2],allowArchivalDocs:process.argv[3]==='--allow-archival-docs'}),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
