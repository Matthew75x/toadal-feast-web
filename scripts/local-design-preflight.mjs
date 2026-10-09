#!/usr/bin/env node
// Read-only identity gate. Historical SDK provenance and patched engine stay separate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const WEBSITE_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const EXPECTED_ENGINE=Object.freeze({commit:'5d022f5c3ea676458a63c8d2bb67ceb69c1a84d5',parent:'100629ad5edee57f8eb1358b4c7c3f0e09c6ec76',tree:'4ecd731114dd4fd0319bee9da3cada51402f5578'});
export const ENTRYPOINTS=Object.freeze(['package.json','package-lock.json','packages/renderer/src/index.ts','packages/project-kernel/src/loader.ts','packages/project-kernel/src/validate.ts','packages/project-kernel/src/mutations.ts','packages/authoring-kernel/src/index.ts']);
export const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',env:{...process.env,GIT_NO_LAZY_FETCH:'1'},maxBuffer:16*1024*1024});if(r.status!==0)throw Error(`Git identity unavailable: ${args.join(' ')}: ${r.stderr}`);return r.stdout.trim();}
export function noSymlinkPath(input){
 const absolute=path.resolve(input),parsed=path.parse(absolute);
 let cursor=parsed.root;
 for(const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)){
  cursor=path.join(cursor,part);
  try{if(fs.lstatSync(cursor).isSymbolicLink())throw Error(`Symlink path is not allowed: ${cursor}`);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 return absolute;
}
export function pathsOverlap(a,b){return a===b||a.startsWith(b+path.sep)||b.startsWith(a+path.sep);}
export function safeNewDirectory(input,protectedRoots){
 const dir=noSymlinkPath(input);
 if(protectedRoots.some(root=>pathsOverlap(dir,noSymlinkPath(root))))throw Error('Scratch/output must be outside and not an ancestor of source or engine.');
 if(fs.existsSync(dir)&&(!fs.statSync(dir).isDirectory()||fs.readdirSync(dir).length))throw Error('Scratch/output must be new or empty; refusing to overwrite.');
 return dir;
}
export function treeFingerprint(root){
 root=noSymlinkPath(root);
 const entries=[];
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error(`Symlink in source: ${f}`);if(e.isDirectory())walk(f);else if(e.isFile())entries.push([path.relative(root,f).split(path.sep).join('/'),sha256(fs.readFileSync(f))]);else throw Error(`Unsupported source entry: ${f}`);}}
 walk(root);return{sha256:sha256(JSON.stringify(entries)),files:entries.length};
}
export function runtimeIdentity(version=process.versions.node,allowNode24=false){
 const qualified=version==='22.23.2';
 if(!qualified&&!(allowNode24&&/^24\./.test(version)))throw Error(`Runtime ${version} is not required Node 22.23.2. Node 24 may be used only with --allow-node24-reproduction; it is not qualification.`);
 return{node:version,requiredNode:'22.23.2',qualifiedRuntime:qualified,mode:qualified?'qualified-runtime-only':'reproduction-only',studioCertification:false};
}
export function inspectEngine(engineInput,expected=EXPECTED_ENGINE,entrypoints=ENTRYPOINTS){
 const root=noSymlinkPath(engineInput);if(path.resolve(git(root,'rev-parse','--show-toplevel'))!==root)throw Error('Engine must be the repository root.');
 const identity={commit:git(root,'rev-parse','HEAD'),parent:git(root,'show','-s','--format=%P','HEAD'),tree:git(root,'rev-parse','HEAD^{tree}')};
 if(identity.tree!==expected.tree||identity.parent!==expected.parent)throw Error('Wrong engine tree or parent; matching two patched files is insufficient.');
 const rows=git(root,'ls-tree','-rz','HEAD').split('\0').filter(Boolean),missing=[],modified=[];let verified=0;
 for(const row of rows){const match=row.match(/^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/);if(!match||match[2]!=='blob')throw Error('Unsupported engine tree entry.');const[,mode,,oid,name]=match;const f=path.join(root,name);if(!fs.existsSync(f)){missing.push(name);continue;}noSymlinkPath(f);if(!fs.statSync(f).isFile()||mode==='120000')throw Error(`Unsupported engine source: ${name}`);const bytes=fs.readFileSync(f),actual=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');if(actual!==oid)modified.push(name);else verified++;}
 if(modified.length)throw Error(`Modified engine working bytes (including skip-worktree): ${modified.join(', ')}`);
 for(const item of entrypoints){if(!fs.existsSync(path.join(root,item)))throw Error(`Missing engine entrypoint: ${item}`);}
 // Every installed package source is immutable; extra untracked modules cannot shadow imports.
 const extras=git(root,'ls-files','--others','--exclude-standard','--','packages','package.json','package-lock.json').split('\n').filter(Boolean);
 if(extras.length)throw Error(`Untracked engine source: ${extras.join(', ')}`);
 return{root,...identity,identityMatch:identity.commit===expected.commit?'exact-commit':'source-equivalent-tree-and-parent',workingFilesVerified:verified,missingTrackedFiles:missing.length,completeWorkingTree:missing.length===0,scope:missing.length?'bounded materialized subset, not complete Studio':'complete tracked working tree, not Studio certification'};
}
export function verifyVendors(repo){
 return ['owner-authoring-renderer','public-export-projection'].map(name=>{const provenance=JSON.parse(fs.readFileSync(path.join(repo,'scripts/vendor',name+'.provenance.json'),'utf8'));const artifact=path.join(repo,provenance.generated);if(!artifact.startsWith(path.join(repo,'scripts/vendor')+path.sep))throw Error('Invalid vendor artifact path');noSymlinkPath(artifact);if(sha256(fs.readFileSync(artifact))!==provenance.generatedSha256)throw Error(`Vendor provenance mismatch: ${name}`);return{name,generatedSha256:provenance.generatedSha256,sourceSha256:provenance.sourceSha256,sourceChecked:false};});
}
export function preflight({engineRoot,websiteRoot=WEBSITE_ROOT,allowNode24=false,env=process.env,nodeVersion=process.versions.node}={}){
 if(!engineRoot)throw Error('Explicit Studio root required.');
 if(Object.hasOwn(env,'TOADAL_STUDIO_ROOT'))throw Error('Unset TOADAL_STUDIO_ROOT: the patched render engine is not the separately pinned historical SDK.');
 const runtime=runtimeIdentity(nodeVersion,allowNode24),repo=noSymlinkPath(websiteRoot),engine=inspectEngine(engineRoot);
 const npm=spawnSync('npm',['--version'],{encoding:'utf8'});
 return{schema:'toadal.local-design-preflight.v1',website:{root:repo,commit:git(repo,'rev-parse','HEAD'),tree:git(repo,'rev-parse','HEAD^{tree}'),workingTreeDirty:!!git(repo,'status','--porcelain')},engine,runtime:{...runtime,npm:npm.status===0?npm.stdout.trim():null},vendors:verifyVendors(repo),remoteWrites:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [engine,...flags]=process.argv.slice(2);if(flags.some(x=>x!=='--allow-node24-reproduction'))throw Error('Unknown option');console.log(JSON.stringify(preflight({engineRoot:engine,allowNode24:flags.includes('--allow-node24-reproduction')}),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
