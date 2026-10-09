#!/usr/bin/env node
// Local candidate only. Does not push, publish, deploy or alter the Studio engine.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {convergencePreflight} from './studio-convergence-preflight.mjs';
import {preflight,safeNewDirectory,treeFingerprint} from './local-design-preflight.mjs';
import {externalizeAdvancedRuntime} from './lib/externalize-advanced-runtime.mjs';
import {addIntrinsicImageDimensions} from './lib/intrinsic-image-dimensions.mjs';
import {verifyProtectedGameArtifacts} from './lib/protected-game-artifacts.mjs';
const [engineInput,outputInput,...options]=process.argv.slice(2);
if(!engineInput||!outputInput||options.some(x=>!['--sync-dist','--allow-node24-reproduction','--qualify-convergence','--allow-archival-docs'].includes(x)))throw new Error('Usage: node --experimental-strip-types scripts/render-local-design-candidate.mjs <Studio root> <local output> [--sync-dist] [--allow-node24-reproduction] [--qualify-convergence]');
const repo=path.resolve(import.meta.dirname,'..'),project=path.join(repo,'studio-project/toadal-feast-website'),engine=path.resolve(engineInput),out=path.resolve(outputInput);
const sourceBound=options.includes('--qualify-convergence');
if(sourceBound&&options.includes('--allow-node24-reproduction'))throw Error('Convergence cannot use reproduction runtime');
if(options.includes('--allow-archival-docs')&&!sourceBound)throw Error('Archive exclusions require explicit convergence mode');
const qualification=preflightGate();
function preflightGate(){return sourceBound?convergencePreflight({engineRoot:engine,websiteRoot:repo,allowArchivalDocs:options.includes('--allow-archival-docs')}):preflight({engineRoot:engine,websiteRoot:repo,allowNode24:options.includes('--allow-node24-reproduction')});}
safeNewDirectory(out,[repo,engine]);
treeFingerprint(project); // Reject symlinked native inputs before any render writes.
const engineCommit=qualification.engine.commit;
const {transformPublicExport}=await import('./vendor/public-export-projection.mjs');
const {renderProject}=await import(pathToFileURL(path.join(engine,'packages/renderer/src/index.ts')));
const {loadProject}=await import(pathToFileURL(path.join(engine,'packages/project-kernel/src/loader.ts')));
const {validateProject}=await import(pathToFileURL(path.join(engine,'packages/project-kernel/src/validate.ts')));
const manifest=path.join(project,'project.json'),validation=validateProject(loadProject(manifest));
if(!validation.valid)throw new Error('Native validation failed: '+JSON.stringify(validation));
const rendered=renderProject(manifest,out);
const projection=transformPublicExport(out,rendered.bundle.pages.map(p=>p.referenceFile),[path.join(project,'reference'),project]);
const advanced=externalizeAdvancedRuntime(out,project,'/toadal-feast-web/');
function run(script,...args){const r=spawnSync(process.execPath,[path.join(repo,'scripts',script),...args],{cwd:repo,encoding:'utf8',env:sourceBound?{...process.env,TOADAL_STUDIO_ROOT:engine}:process.env});if(r.status!==0)throw new Error(script+': '+r.stderr+r.stdout);return r.stdout.trim();}
run('wo001-pages-basepath.mjs',out,'/toadal-feast-web/','--staging-robots');
const freshness=run('verify-owner-preview-render-freshness.mjs',repo,out,'/toadal-feast-web/');
const images=addIntrinsicImageDimensions(out,'/toadal-feast-web/');
const protectedArtifacts=verifyProtectedGameArtifacts(out,project);if(!protectedArtifacts.valid)throw new Error(protectedArtifacts.errors.join('\n'));
const checks=['verify-pages-basepath.mjs','verify-static-links.mjs'].map(script=>run(script,out,'/toadal-feast-web/'));
checks.push(run('verify-staging-robots.mjs',out,'staging'));
if(options.includes('--sync-dist')){
 const dist=path.join(repo,'dist');fs.cpSync(out,dist,{recursive:true});
 const preview=path.join(dist,'previews/cards-phone-20261008');
 function derive(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name),rel=path.relative(out,f);if(rel==='.nojekyll'||rel==='public'||rel.startsWith('public'+path.sep))continue;if(e.isDirectory()){derive(f);continue;}const dst=path.join(preview,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});let bytes=fs.readFileSync(f);if(/\.(html|css|js|json)$/.test(f))bytes=Buffer.from(bytes.toString().replace(/\/toadal-feast-web\/(?!assets\/(?:css|js)\/advanced-code\.|public\/games\/)/g,'/toadal-feast-web/previews/cards-phone-20261008/'));fs.writeFileSync(dst,bytes);}}
 derive(out);
 checks.push(run('verify-static-links.mjs',dist,'/toadal-feast-web/'));
}
console.log(JSON.stringify({scope:'local design candidate only',qualification,engineCommit,validation,output:out,websiteRoutes:rendered.bundle.pages.length,protectedFiles:projection.protectedFiles,advanced,freshness,images,checks,synchronizedDist:options.includes('--sync-dist'),remoteWrites:false},null,2));
