#!/usr/bin/env node
// Disposable API witness. No browser/GUI, canonical export, or publication claim.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {preflight,WEBSITE_ROOT,noSymlinkPath,safeNewDirectory,pathsOverlap,treeFingerprint} from './local-design-preflight.mjs';

export function witnessPaths({engineRoot,websiteRoot=WEBSITE_ROOT,scratch,report}){
 if(!engineRoot||!scratch||!report)throw Error('Explicit engine, fresh scratch directory and report path required.');
 const repo=noSymlinkPath(websiteRoot),engine=noSymlinkPath(engineRoot),dir=safeNewDirectory(scratch,[repo,engine]),result=noSymlinkPath(report);
 if([repo,engine,dir].some(root=>pathsOverlap(result,root)))throw Error('Report must be outside source, engine and scratch (and cannot be their ancestor).');
 if(fs.existsSync(result))throw Error('Report already exists; refusing to overwrite.');
 if(!fs.existsSync(path.dirname(result))||!fs.statSync(path.dirname(result)).isDirectory())throw Error('Report parent must already exist.');
 return{repo,engine,dir,result,project:path.join(repo,'studio-project/toadal-feast-website')};
}
export function finalizeWitnessStatus(report){
 report.success=Boolean(report.success&&report.sourceUnchanged&&report.disposablePageRestored);
 return report;
}
const walk=items=>items.flatMap(c=>[c,...walk(c.props?.children||[]),...Object.values(c.props?.slots||{}).flatMap(walk)]);
export async function runWitness(options){
 const p=witnessPaths(options),qualification=preflight({engineRoot:p.engine,websiteRoot:p.repo,allowNode24:!!options.allowNode24});
 const before=treeFingerprint(p.project),report={schema:'toadal.native-design-edit-roundtrip.v1',scope:'Disposable native API save/reopen/render witness; not GUI or public-pipeline acceptance',qualification,sourceFingerprintBefore:before,steps:[],uiTest:false,remoteWrites:false,success:false};
 let copy,original,pageFile,fd;
 // Exclusive report reservation cannot overwrite an existing file even if it appeared after validation.
 fd=fs.openSync(p.result,'wx');
 try{
  if(!fs.existsSync(p.dir))fs.mkdirSync(p.dir,{recursive:true});
  copy=path.join(p.dir,'native-project');fs.cpSync(p.project,copy,{recursive:true,errorOnExist:true,force:false});
  assert.deepEqual(treeFingerprint(copy),before,'Complete native copy must match source');
  const imp=relative=>import(pathToFileURL(path.join(p.engine,relative)));
  const {loadProject}=await imp('packages/project-kernel/src/loader.ts');
  const {validateProject}=await imp('packages/project-kernel/src/validate.ts');
  const {renderProject}=await imp('packages/renderer/src/index.ts');
  const {applyOperation}=await imp('packages/authoring-kernel/src/index.ts');
  const {readPageWithRevision,updateComponent,findPageFile}=await imp('packages/project-kernel/src/mutations.ts');
  const manifest=path.join(copy,'project.json'),pageId='page.home';
  pageFile=findPageFile(manifest,pageId);original=fs.readFileSync(pageFile);
  const initial=readPageWithRevision(manifest,pageId),nodes=walk(initial.value.components);
  const headline=nodes.find(x=>x.id==='component.home.hero.4db086c637da.home-hero-title');
  const link=nodes.find(x=>x.id==='component.home.hero.ea6c8d3dd272.button-link-button-link-');
  const cover=nodes.find(x=>x.id==='component.home.game.wicked-bites.preview.cover');
  assert.ok(headline&&link&&cover,'Expected native Home headline, App link and approved cover must exist');
  const projectId=loadProject(manifest).manifest.id;
  function edit(node,type,payload,expectedProps){
   const prior=readPageWithRevision(manifest,pageId);
   const result=applyOperation(manifest,{id:`local-witness.${report.steps.length}`,type,version:1,target:{projectId,pageId,nodeId:node.id,scope:'page',breakpoint:'base'},baseRevision:prior.revision,actor:{role:'owner',id:'local-api-witness'},origin:'api',payload});
   assert.equal(result.ok,true,JSON.stringify(result.diagnostics));assert.equal(result.changed,true);
   record(node,type,prior.revision,expectedProps);
  }
  function record(node,api,beforeRevision,props){
   const reopened=readPageWithRevision(manifest,pageId),actual=walk(reopened.value.components).find(c=>c.id===node.id);
   for(const [key,value]of Object.entries(props))assert.deepEqual(actual.props[key],value,`Reopened ${key}`);
   assert.notEqual(reopened.revision,beforeRevision);
   report.steps.push({node:node.id,api,beforeRevision,afterRevision:reopened.revision,reopenedProps:props});
  }
  edit(headline,'content.setText',{field:'text',text:'Round-trip editable headline'},{text:'Round-trip editable headline'});
  const prior=readPageWithRevision(manifest,pageId);updateComponent(manifest,pageId,link.id,{href:'/app/#mode-arcade'},prior.revision);record(link,'updateComponent',prior.revision,{href:'/app/#mode-arcade'});
  edit(cover,'image.reframe',{set:{fit:'cover',focalX:35,focalY:60,zoom:1.1}},{fit:'cover',focalX:35,focalY:60,zoom:1.1});
  report.validation=validateProject(loadProject(manifest));assert.equal(report.validation.valid,true,JSON.stringify(report.validation));
  const output=path.join(p.dir,'edited-native-render');renderProject(manifest,output);
  const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
  assert.ok(html.includes('Round-trip editable headline'));assert.ok(html.includes('/app/#mode-arcade'));
  const imageTag=html.match(new RegExp(`<img\\b[^>]*data-studio-component=['"]${cover.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"][^>]*>`))?.[0];
  assert.ok(imageTag,'Cover image rendered');assert.match(imageTag,/object-fit:cover/);assert.match(imageTag,/object-position:35% 60%/);assert.match(imageTag,/scale\(1\.1\)/);
  report.editedExportVerified=true;report.success=true;
 }catch(error){report.error=String(error.stack||error);}
 finally{
  try{if(original&&pageFile){fs.writeFileSync(pageFile,original);report.disposablePageRestored=fs.readFileSync(pageFile).equals(original);}report.sourceFingerprintAfter=treeFingerprint(p.project);report.sourceUnchanged=JSON.stringify(before)===JSON.stringify(report.sourceFingerprintAfter);if(!report.sourceUnchanged)report.success=false;}catch(error){report.success=false;report.restorationError=String(error);}
  finalizeWitnessStatus(report);
  fs.writeFileSync(fd,JSON.stringify(report,null,2)+'\n');fs.closeSync(fd);
 }
 if(!report.success)throw Error(`Native witness failed; see ${p.result}: ${report.error||report.restorationError||'source changed'}`);
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const[engineRoot,scratch,report,...flags]=process.argv.slice(2);if(flags.some(x=>x!=='--allow-node24-reproduction'))throw Error('Unknown option');const r=await runWitness({engineRoot,scratch,report,allowNode24:flags.includes('--allow-node24-reproduction')});console.log(JSON.stringify(r,null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
