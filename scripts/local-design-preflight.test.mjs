import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {inspectEngine,runtimeIdentity,verifyVendors,preflight,safeNewDirectory,treeFingerprint,WEBSITE_ROOT} from './local-design-preflight.mjs';
import {witnessPaths,finalizeWitnessStatus} from './native-design-edit-roundtrip.mjs';
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'toadal-preflight-'));
// Windows directory junctions require no Developer Mode privilege and exercise
// the same forbidden linked-path invariant. Unix keeps native symlink coverage.
const directoryLink=(target,link)=>fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');
function fixture(fn){const root=temp();try{return fn(root);}finally{fs.rmSync(root,{recursive:true,force:true});}}
function git(root,...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function engineFixture(root){git(root,'init','-q');git(root,'config','user.name','Fixture');git(root,'config','user.email','fixture@example.invalid');fs.writeFileSync(path.join(root,'source.ts'),'export const value=1;\n');git(root,'add','.');git(root,'commit','-qm','base');const parent=git(root,'rev-parse','HEAD');fs.writeFileSync(path.join(root,'source.ts'),'export const value=2;\n');git(root,'add','.');git(root,'commit','-qm','patch');return{commit:git(root,'rev-parse','HEAD'),parent,tree:git(root,'rev-parse','HEAD^{tree}')};}
test('exact Node 22.23.2 is runtime qualification only',()=>{const r=runtimeIdentity('22.23.2');assert.equal(r.qualifiedRuntime,true);assert.equal(r.studioCertification,false);});
test('Node 24 requires explicit reproduction flag and never qualifies',()=>{assert.throws(()=>runtimeIdentity('24.19.0'),/not required/);assert.equal(runtimeIdentity('24.19.0',true).qualifiedRuntime,false);assert.throws(()=>runtimeIdentity('23.0.0',true),/not required/);assert.throws(()=>runtimeIdentity('22.23.1',true),/not required/);});
test('SDK environment ambiguity fails before engine access even when empty',()=>{for(const value of ['','/patched'])assert.throws(()=>preflight({engineRoot:'/missing',env:{TOADAL_STUDIO_ROOT:value}}),/Unset TOADAL_STUDIO_ROOT/);});
test('both unchanged vendor artifacts match their separate provenance',()=>assert.equal(verifyVendors(WEBSITE_ROOT).length,2));
test('vendor tampering is rejected without changing its pin',()=>fixture(root=>{fs.mkdirSync(path.join(root,'scripts'),{recursive:true});fs.cpSync(path.join(WEBSITE_ROOT,'scripts/vendor'),path.join(root,'scripts/vendor'),{recursive:true});fs.appendFileSync(path.join(root,'scripts/vendor/owner-authoring-renderer.mjs'),'\n// drift');assert.throws(()=>verifyVendors(root),/provenance mismatch/);}));
test('exact engine identity and working bytes pass',()=>fixture(root=>{const expected=engineFixture(root);const r=inspectEngine(root,expected,['source.ts']);assert.equal(r.identityMatch,'exact-commit');assert.equal(r.completeWorkingTree,true);}));
test('equivalent full tree and parent permits recovered commit identity',()=>fixture(root=>{const expected=engineFixture(root);expected.commit='0'.repeat(40);assert.equal(inspectEngine(root,expected,['source.ts']).identityMatch,'source-equivalent-tree-and-parent');}));
test('wrong engine tree and wrong parent fail even with same head',()=>fixture(root=>{const expected=engineFixture(root);assert.throws(()=>inspectEngine(root,{...expected,tree:'0'.repeat(40)},['source.ts']),/Wrong engine/);assert.throws(()=>inspectEngine(root,{...expected,parent:'0'.repeat(40)},['source.ts']),/Wrong engine/);}));
test('matching engine HEAD with skip-worktree modification fails',()=>fixture(root=>{const expected=engineFixture(root);git(root,'update-index','--skip-worktree','source.ts');fs.appendFileSync(path.join(root,'source.ts'),'// changed');assert.throws(()=>inspectEngine(root,expected,['source.ts']),/Modified engine working bytes/);}));
test('missing engine entrypoint fails',()=>fixture(root=>{const expected=engineFixture(root);fs.unlinkSync(path.join(root,'source.ts'));assert.throws(()=>inspectEngine(root,expected,['source.ts']),/Missing engine entrypoint/);}));
test('partial engine reports missing files separately from verified subset',()=>fixture(root=>{const expected=engineFixture(root);fs.unlinkSync(path.join(root,'source.ts'));const r=inspectEngine(root,expected,[]);assert.equal(r.completeWorkingTree,false);assert.equal(r.missingTrackedFiles,1);}));
test('scratch rejects source, ancestor, nonempty and symlink routes',()=>fixture(root=>{const source=path.join(root,'source');fs.mkdirSync(source);assert.throws(()=>safeNewDirectory(source,[source]),/outside/);assert.throws(()=>safeNewDirectory(root,[source]),/outside/);const occupied=path.join(root,'occupied');fs.mkdirSync(occupied);fs.writeFileSync(path.join(occupied,'keep'),'do not remove');assert.throws(()=>safeNewDirectory(occupied,[source]),/overwrite/);const link=path.join(root,'linked');directoryLink(source,link);assert.throws(()=>safeNewDirectory(path.join(link,'child'),[]),/Symlink/);assert.equal(fs.readFileSync(path.join(occupied,'keep'),'utf8'),'do not remove');}));
test('witness paths require fresh report outside scratch and protected roots',()=>fixture(root=>{const repo=path.join(root,'repo'),engine=path.join(root,'engine'),scratch=path.join(root,'scratch'),report=path.join(root,'report.json');fs.mkdirSync(repo);fs.mkdirSync(engine);const args={websiteRoot:repo,engineRoot:engine,scratch,report};assert.equal(witnessPaths(args).result,report);assert.throws(()=>witnessPaths({...args,report:path.join(scratch,'report.json')}),/outside/);assert.throws(()=>witnessPaths({...args,scratch:path.join(engine,'scratch')}),/outside/);fs.writeFileSync(report,'keep');assert.throws(()=>witnessPaths(args),/already exists/);assert.equal(fs.readFileSync(report,'utf8'),'keep');}));
test('native fingerprint rejects symlinked input and detects changed bytes',()=>fixture(root=>{const f=path.join(root,'a');fs.writeFileSync(f,'one');const first=treeFingerprint(root);fs.writeFileSync(f,'two');assert.notEqual(treeFingerprint(root).sha256,first.sha256);if(process.platform==='win32'){const directory=path.join(root,'native');fs.mkdirSync(directory);fs.writeFileSync(path.join(directory,'source'),'private');directoryLink(directory,path.join(root,'b'));}else fs.symlinkSync(f,path.join(root,'b'));assert.throws(()=>treeFingerprint(root),/Symlink/);}));
test('default renderer enforces preflight before importing the engine',()=>{const text=fs.readFileSync(new URL('./render-local-design-candidate.mjs',import.meta.url),'utf8');assert.ok(text.indexOf('qualification=preflightGate(')<text.indexOf('const {renderProject}'));assert.match(text,/safeNewDirectory\(out,\[repo,engine\]\)/);});

test('native project root symlink is rejected before copying or editing',()=>fixture(root=>{const native=path.join(root,'native'),alias=path.join(root,'alias');fs.mkdirSync(native);fs.writeFileSync(path.join(native,'project.json'),'{}');directoryLink(native,alias);assert.throws(()=>treeFingerprint(alias),/Symlink path/);}));

test('witness completion requires source preservation and successful disposable restoration',()=>{for(const sourceUnchanged of [true,false,undefined])for(const disposablePageRestored of [true,false,undefined]){const result=finalizeWitnessStatus({success:true,sourceUnchanged,disposablePageRestored});assert.equal(result.success,sourceUnchanged===true&&disposablePageRestored===true);}assert.equal(finalizeWitnessStatus({success:false,sourceUnchanged:true,disposablePageRestored:true}).success,false);});

test('ordinary hermetic engine pin selects convergence and excludes the preserved predecessor',async()=>{
 const {EXPECTED_ENGINE}=await import('./local-design-preflight.mjs');
 const selected=JSON.parse(fs.readFileSync(new URL('./vendor/studio-convergence-source.json',import.meta.url),'utf8'));
 for(const key of ['commit','tree','parent'])assert.equal(EXPECTED_ENGINE[key],selected[key]);
 assert.notEqual(EXPECTED_ENGINE.commit,'5d022f5c3ea676458a63c8d2bb67ceb69c1a84d5');
 assert.notEqual(EXPECTED_ENGINE.tree,'4ecd731114dd4fd0319bee9da3cada51402f5578');
});
