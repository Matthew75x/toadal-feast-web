#!/usr/bin/env node
// Read exact selected source, render to fresh disposable outputs, compare both bridges.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {normalizeConvergenceHtml} from './lib/convergence-html-parity.mjs';
import {convergencePreflight} from './studio-convergence-preflight.mjs';
import {safeNewDirectory,treeFingerprint} from './local-design-preflight.mjs';
import {rewriteHtml} from './wo001-pages-basepath.mjs';
import {renderOwnerComponent as vendorOwner} from './vendor/owner-authoring-renderer.mjs';
import {transformPublicExport as vendorPublic} from './vendor/public-export-projection.mjs';
import {verifyProtectedGameArtifacts,isProtectedGameArtifact} from './lib/protected-game-artifacts.mjs';
const [engineInput,outInput,option]=process.argv.slice(2);
if(!engineInput||!outInput||process.argv.length>5||(option&&option!=='--allow-archival-docs'))throw Error('Usage: node --experimental-strip-types scripts/qualify-studio-website-convergence.mjs <reviewed Studio root> <new output>');
const repo=path.resolve(import.meta.dirname,'..'),engine=path.resolve(engineInput),out=path.resolve(outInput),project=path.join(repo,'studio-project/toadal-feast-website');
const qualification=convergencePreflight({engineRoot:engine,allowArchivalDocs:option==='--allow-archival-docs'});safeNewDirectory(out,[repo,engine]);
const before=treeFingerprint(project),load=rel=>import(pathToFileURL(path.join(engine,rel)));
const {renderProject}=await load('packages/renderer/src/index.ts');
const {renderOwnerComponent:nativeOwner}=await load('packages/owner-authoring/src/index.ts');
const {transformPublicExport:nativePublic}=await load('packages/export-manager/src/public-runtime.ts');
const nativeBase=await load('packages/export-manager/src/base-path.mjs');
const {loadProject}=await load('packages/project-kernel/src/loader.ts');
const {validateProject}=await load('packages/project-kernel/src/validate.ts');
const manifest=path.join(project,'project.json'),validation=validateProject(loadProject(manifest));assert.equal(validation.valid,true,JSON.stringify(validation));
fs.mkdirSync(out,{recursive:true});const native=path.join(out,'native'),vendor=path.join(out,'vendor');
const rendered=renderProject(manifest,native);fs.cpSync(native,vendor,{recursive:true});
const pages=rendered.bundle.pages.map(p=>p.referenceFile),roots=[path.join(project,'reference'),project];
nativePublic(native,pages,roots);vendorPublic(vendor,pages,roots);
assert.deepEqual(treeFingerprint(native),treeFingerprint(vendor),'native public export must exactly equal vendored public export');
const publicFingerprint=treeFingerprint(native),baseResults=[];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const [index,basePath] of ['/','/toadal-feast-web/'].entries()){
 const nativeAtBase=path.join(out,`native-base-${index}`),vendorAtBase=path.join(out,`vendor-base-${index}`);
 fs.cpSync(native,nativeAtBase,{recursive:true});fs.cpSync(vendor,vendorAtBase,{recursive:true});
 const excludes=files(native).map(f=>path.relative(native,f).split(path.sep).join('/')).filter(isProtectedGameArtifact);
 await nativeBase.transformExport(nativeAtBase,basePath,{excludeFiles:excludes});
 const rewrite=spawnSync(process.execPath,[path.join(repo,'scripts/wo001-pages-basepath.mjs'),vendorAtBase,basePath],{encoding:'utf8'});
 assert.equal(rewrite.status,0,rewrite.stderr);
 const serializationOnly=[];
 assert.deepEqual(files(nativeAtBase).map(f=>path.relative(nativeAtBase,f)).sort(),files(vendorAtBase).map(f=>path.relative(vendorAtBase,f)).sort());
 for(const a of files(nativeAtBase)){const rel=path.relative(nativeAtBase,a),b=path.join(vendorAtBase,rel),left=fs.readFileSync(a),right=fs.readFileSync(b);if(left.equals(right))continue;assert(a.endsWith('.html'),'non-HTML output must be byte-identical: '+rel);assert.equal(normalizeConvergenceHtml(left.toString()),normalizeConvergenceHtml(right.toString()),rel);serializationOnly.push(rel);}
 const protectedAtBase=verifyProtectedGameArtifacts(nativeAtBase,project);assert.equal(protectedAtBase.valid,true,JSON.stringify(protectedAtBase.errors));
 baseResults.push({basePath,nativeFingerprint:treeFingerprint(nativeAtBase),websiteFingerprint:treeFingerprint(vendorAtBase),byteIdentical:serializationOnly.length===0,protectedFiles:protectedAtBase.files.length,serializationOnly,semanticallyEqual:true});
}
const sourceUrl='/assets/images/world/candy-kingdom.webp',old='/assets/images/world/legacy-background.webp',special=`/assets/images/world/candy kingdom (wide) O'Neil & "friends".webp`;
const variants=['guest-progression-feast-pass','guest-progression-quests','guest-progression-rewards','guest-progression-profile'];let backgroundCases=0;
for(const variant of variants)for(const mode of ['ordinary','escaped','layered']){
 const url=mode==='escaped'?special:sourceUrl;
 const props={authoringVersion:1,tag:'section',variant,backgroundAsset:'asset.background',style:mode==='layered'?`background-image:linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.2)), url("${old}");background-position:20% 30%;background-size:cover`:'background-size:cover'};
 if(mode==='layered')props.backgroundSourceUrl=old;
 const component={id:'component.background',type:'layout.container',props},resolve=id=>id==='asset.background'?url:null;
 const a=nativeOwner(component,resolve),b=vendorOwner(component,resolve);assert.equal(a,b);
 for(const basePath of ['/','/toadal-feast-web/']){
  const actual=rewriteHtml(b,basePath).value;assert.equal(normalizeConvergenceHtml(actual),normalizeConvergenceHtml(nativeBase.rewriteHtml(a,basePath).value));
  assert(!actual.includes('/toadal-feast-web/toadal-feast-web/'));
  assert.equal(rewriteHtml(actual,basePath).value,actual,'basepath rewrite must be idempotent');
  if(basePath==='/')assert(!actual.includes('/toadal-feast-web/'));
  const prefix=basePath==='/'?'':basePath.slice(0,-1);
  assert(actual.includes(prefix+(mode==='escaped'?'/assets/images/world/candy kingdom (wide) O%27Neil &amp; %22friends%22.webp':sourceUrl)));
  if(mode==='layered'){assert(!actual.includes(old));assert(actual.includes('linear-gradient'));assert(actual.includes('background-position:20% 30%'));}
  backgroundCases++;
 }
}
const protectedArtifacts=verifyProtectedGameArtifacts(native,project);assert.equal(protectedArtifacts.valid,true,JSON.stringify(protectedArtifacts));
assert.deepEqual(treeFingerprint(project),before,'editable native project must remain byte-identical');
console.log(JSON.stringify({qualification,validation,publicFingerprint,baseResults,backgroundCases,protectedArtifacts,sourceUnchanged:true,sourceChecked:true,remoteWrites:false},null,2));
