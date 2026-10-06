import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyProtectedGameArtifacts } from './lib/protected-game-artifacts.mjs';
import { safeRelative, inventoryPayload, sha256, canonicalBytes, validatePolicy, enforceGamePolicy, exactSource,
  expectedManifest, comparePayload, preparePackage, verifyPackage, verifyExportGamePins, POLICY_PATH, ENVIRONMENT, REPO } from './lib/staging-artifact.mjs';

function command(repo,args,input) {
  const r=spawnSync('git',['-C',repo,...args],{input,encoding:'utf8',timeout:15000});
  assert.equal(r.status,0,r.stderr);return r.stdout.trim();
}
function put(root,name,bytes) {const f=path.join(root,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,bytes);}
function rows(root) {return inventoryPayload(root);}
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-staging-artifact-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const repo=path.join(root,'repo'),dist=path.join(repo,'dist'),project=path.join(repo,'project'),reference=path.join(project,'reference');fs.mkdirSync(repo);
  const content={'index.html':'<!doctype html><meta name="robots" content="noindex,nofollow"><p>Synthetic test page</p>',
    '404.html':'<meta name="robots" content="noindex,nofollow">Missing','.nojekyll':'','robots.txt':'User-agent: *\nDisallow: /\n',
    'assets/site.js':'/* synthetic website */','assets/binary.webp':Buffer.from([0,1,255,128,6]),
    'public/games/wicked-bites/index.html':'synthetic game bytes; not executed',
    'public/games/wicked-bites/cartridge.json':'{"fixture":true}',
    'public/games/wicked-bites/toadal-bridge.js':'/* synthetic no-op */'};
  for(const [p,b] of Object.entries(content)){put(dist,p,b);if(p.startsWith('public/games/'))put(reference,p,b);}
  const policy={schema:'toadal.staging-game-preservation.v1',environment:ENVIRONMENT,basePath:'/toadal-feast-web/',
    classification:'LEGACY_PREVIEW_PRESERVATION_NOT_TCS_QUALIFICATION',tcsQualified:false,gameId:'wicked-bites',version:'5.5',publicState:'PREVIEW',
    unknownGamePayloads:'DENY',newCartridgeAdmission:'NOT_ENABLED',baseline:{sourceCommit:'a'.repeat(40),scope:'SYNTHETIC_TEST_ONLY'},
    files:rows(dist).filter(f=>f.path.startsWith('public/games/')),revokedSha256:[]};
  put(repo,POLICY_PATH,canonicalBytes(policy));
  command(repo,['init','-q']);command(repo,['config','core.autocrlf','false']);command(repo,['config','user.name','Synthetic fixture']);command(repo,['config','user.email','fixture@example.invalid']);
  const commit=()=>{command(repo,['add','.']);command(repo,['-c','commit.gpgsign=false','commit','-qm','Synthetic source fixture']);return command(repo,['rev-parse','HEAD']);};
  const revision=commit();return {root,repo,dist,project,reference,policy,revision,commit,output:path.join(root,'package')};
}
function make(f,extra={}) {return preparePackage({repo:f.repo,revision:f.revision,input:f.dist,output:f.output,...extra});}
function check(f,result,extra={}) {return verifyPackage({repo:f.repo,revision:f.revision,output:f.output,manifestSha256:result.manifestSha256,...extra});}

test('exact source produces a portable checked payload and manifest outside the public site',t=>{
  const f=fixture(t),r=make(f),v=check(f,r);assert.equal(v.status,'EXACT_STAGING_PACKAGE_VERIFIED');assert.equal(v.fileCount,8);assert.equal(v.sourceFileCount,9);
  assert.equal(v.tcsQualified,false);assert.equal(v.deployPerformed,false);assert.equal(r.mode,'CHECKED_WORKING_PAYLOAD_COPY');
  assert.deepEqual(rows(path.join(f.output,'site')),rows(f.dist).filter(f=>f.path!=='.nojekyll'));assert.equal(fs.existsSync(path.join(f.output,'site','.nojekyll')),false);assert.equal(fs.existsSync(path.join(f.output,'site','manifest.json')),false);
  const meta=JSON.parse(fs.readFileSync(path.join(f.output,'receipt.json')));assert.equal(meta.payload,'site');assert.equal(meta.manifest,'manifest.json');
  const moved=path.join(f.root,'moved');fs.renameSync(f.output,moved);assert.equal(check(f,r,{output:moved}).status,'EXACT_STAGING_PACKAGE_VERIFIED');
});
test('source-only reconstruction ignores a dirty working payload and reproduces the declared Git source',t=>{
  const f=fixture(t);put(f.dist,'assets/site.js','uncommitted wrong bytes');put(f.dist,'stray.html','uncommitted unwanted file');
  const r=preparePackage({repo:f.repo,revision:f.revision,fromGit:true,output:f.output});assert.equal(r.mode,'SOURCE_ONLY_RECOVERY_NO_DEPLOYMENT');check(f,r);
  assert.equal(fs.existsSync(path.join(f.output,'site','stray.html')),false);assert.equal(fs.readFileSync(path.join(f.output,'site/assets/site.js'),'utf8'),'/* synthetic website */');
});
test('historical package preparation uses the explicit older source and CURRENT policy',t=>{
  const f=fixture(t);put(f.dist,'index.html','<meta name="robots" content="noindex,nofollow">new source');f.commit();const r=preparePackage({repo:f.repo,revision:f.revision,fromGit:true,output:f.output});
  check(f,r);assert.notEqual(r.sourceCommit,command(f.repo,['rev-parse','HEAD']));assert.match(fs.readFileSync(path.join(f.output,'site/index.html'),'utf8'),/Synthetic/);
});
test('manifest bytes are deterministic for the same exact source and policy',t=>{
  const f=fixture(t),a=make(f),b=make(f,{output:path.join(f.root,'second')});assert.equal(a.manifestSha256,b.manifestSha256);
});
test('changing source reference and exported game together passed the old comparator but fails the independent pin',t=>{
  const f=fixture(t),name='public/games/wicked-bites/index.html';put(f.dist,name,'changed candidate');put(f.reference,name,'changed candidate');
  assert.equal(verifyProtectedGameArtifacts(f.dist,f.project).valid,true,'This reproduces the previous comparison-only gap');
  assert.throws(()=>verifyExportGamePins(f.dist,f.project,f.repo),/differs from preserved/);assert.throws(()=>make(f),/differs from exact source/);
});
test('new unqualified game in source AND export passes the old comparator but is denied by the fixed legacy policy',t=>{
  const f=fixture(t),name='public/games/unqualified/index.html';put(f.dist,name,'synthetic');put(f.reference,name,'synthetic');
  assert.equal(verifyProtectedGameArtifacts(f.dist,f.project).valid,true);
  assert.throws(()=>verifyExportGamePins(f.dist,f.project,f.repo),/Unknown or missing/);
});
test('committing a changed game still cannot pass the independent legacy policy',t=>{
  const f=fixture(t);put(f.dist,'public/games/wicked-bites/index.html','changed game');const newer=f.commit();
  assert.throws(()=>make(f,{revision:newer}),/differs from preserved/);assert.equal(fs.existsSync(f.output),false);
});
test('adding a hidden-from-catalogue cartridge is denied even when committed',t=>{
  const f=fixture(t);put(f.dist,'cartridges/not-listed/payload.js','synthetic');const newer=f.commit();assert.throws(()=>make(f,{revision:newer}),/Unknown or missing/);
});
test('revocation blocks old source recovery without changing historical bytes',t=>{
  const f=fixture(t);f.policy.revokedSha256.push(f.policy.files[0].sha256);put(f.repo,POLICY_PATH,canonicalBytes(f.policy));f.commit();
  assert.throws(()=>preparePackage({repo:f.repo,revision:f.revision,fromGit:true,output:f.output}),/revoked/);assert.equal(fs.existsSync(f.output),false);
});
test('uncommitted candidate policy cannot self-authorize publication',t=>{
  const f=fixture(t);f.policy.files[0].sha256='b'.repeat(64);put(f.repo,POLICY_PATH,canonicalBytes(f.policy));assert.throws(()=>make(f),/Uncommitted policy/);
});
for(const change of [p=>p.environment='production',p=>p.tcsQualified=true,p=>p.publicState='PUBLIC',p=>p.newCartridgeAdmission='ENABLED',p=>p.unknownGamePayloads='ALLOW',p=>p.gameId='croaker-king-defense']) {
  test('legacy scope cannot be raised by metadata: '+change,t=>{const f=fixture(t);change(f.policy);assert.throws(()=>validatePolicy(f.policy));});
}
test('extra arbitrary payload path outside game directories is rejected at final handoff',t=>{
  const f=fixture(t);put(f.dist,'assets/renamed-runtime.html','<script>/*synthetic*/</script>');assert.throws(()=>make(f),/extra\/missing/);assert.equal(fs.existsSync(f.output),false);
});
test('missing final file is rejected',t=>{const f=fixture(t);fs.unlinkSync(path.join(f.dist,'index.html'));assert.throws(()=>make(f),/extra\/missing/);});
test('same-size changed website script is rejected',t=>{const f=fixture(t);const p=path.join(f.dist,'assets/site.js');fs.writeFileSync(p,Buffer.alloc(fs.statSync(p).size,65));assert.throws(()=>make(f),/differs from exact source/);});
test('tampering with a sealed payload is detected before upload',t=>{const f=fixture(t),r=make(f);put(path.join(f.output,'site'),'index.html','changed');assert.throws(()=>check(f,r),/differs from exact source/);});
test('a payload and self-rehashed manifest cannot override the independently selected source',t=>{
  const f=fixture(t),r=make(f);const dir=path.join(f.output,'site');put(dir,'assets/extra.js','synthetic');
  const manifest=JSON.parse(fs.readFileSync(path.join(f.output,'manifest.json')));manifest.files=rows(dir);manifest.fileCount=manifest.files.length;
  const bytes=canonicalBytes(manifest),digest=sha256(bytes);fs.writeFileSync(path.join(f.output,'manifest.json'),bytes);fs.writeFileSync(path.join(f.output,'manifest.sha256'),digest+'\n');
  assert.throws(()=>check(f,r,{manifestSha256:digest}),/Manifest\/source\/policy/);
});
test('wrong separately recorded digest is rejected',t=>{const f=fixture(t),r=make(f);assert.throws(()=>check(f,r,{manifestSha256:'f'.repeat(64)}),/Manifest\/source\/policy/);});
test('receipt cannot mislabel a package as deployed or TCS approved',t=>{
  const f=fixture(t),r=make(f),p=path.join(f.output,'receipt.json');const j=JSON.parse(fs.readFileSync(p));j.deployPerformed=true;fs.writeFileSync(p,canonicalBytes(j));assert.throws(()=>check(f,r),/receipt contradicts/);
});
test('unexpected package sidecars are rejected and never included in site',t=>{const f=fixture(t),r=make(f);put(f.output,'unreviewed.json','{}');assert.throws(()=>check(f,r),/Unexpected package/);});
test('exact full source SHA is required; no branch/HEAD/latest aliases',t=>{const f=fixture(t);for(const source of ['HEAD','staging/live-visual',f.revision.slice(0,8),'a'.repeat(39),'x'.repeat(40)])assert.throws(()=>exactSource(f.repo,source),/explicit full commit/);});
test('existing output and sentinel remain unchanged on refusal',t=>{const f=fixture(t);fs.mkdirSync(f.output);put(f.output,'sentinel.txt','keep');assert.throws(()=>make(f),/NEW/);assert.equal(fs.readFileSync(path.join(f.output,'sentinel.txt'),'utf8'),'keep');});
test('output cannot overwrite or live inside the source/dist tree',t=>{const f=fixture(t);assert.throws(()=>make(f,{output:path.join(f.dist,'new-package')}),/outside authored source|separate/);assert.throws(()=>make(f,{output:path.join(f.repo,'not-scratch')}),/outside authored source/);});
test('untracked private file cannot enter final payload',t=>{const f=fixture(t);put(f.dist,'.env','synthetic=only');assert.throws(()=>make(f),/Private\/hidden/);});
test('an empty untracked directory is not silently omitted from the sealed inventory',t=>{const f=fixture(t);fs.mkdirSync(path.join(f.dist,'empty'));assert.throws(()=>make(f),/empty payload directory/);});
test('payload hardlinks are refused rather than dereferenced into an upload',t=>{const f=fixture(t);fs.linkSync(path.join(f.dist,'assets/site.js'),path.join(f.root,'alias.js'));assert.throws(()=>make(f),/Link\/nonregular/);});
test('directory symlink or Windows junction is rejected before reading outside the payload',t=>{
  const f=fixture(t),outside=path.join(f.root,'outside');fs.mkdirSync(outside);put(outside,'secret.txt','synthetic sentinel');
  fs.symlinkSync(outside,path.join(f.dist,'linked'),process.platform==='win32'?'junction':'dir');assert.throws(()=>make(f),/Symlink\/junction/);
});
test('linked output parent is refused',t=>{
  const f=fixture(t),outside=path.join(f.root,'outside');fs.mkdirSync(outside);const alias=path.join(f.root,'alias');fs.symlinkSync(outside,alias,process.platform==='win32'?'junction':'dir');
  assert.throws(()=>make(f,{output:path.join(alias,'new')}),/Symlink\/junction/);assert.equal(fs.readdirSync(outside).length,0);
});
test('Git symlink mode is rejected even on systems that cannot create native file symlinks',t=>{
  const f=fixture(t),blob=command(f.repo,['hash-object','-w','--stdin'],'../outside');command(f.repo,['update-index','--add','--cacheinfo','120000,'+blob+',dist/linked']);
  command(f.repo,['-c','commit.gpgsign=false','commit','-qm','Synthetic symlink index']);assert.throws(()=>exactSource(f.repo,command(f.repo,['rev-parse','HEAD'])),/link\/submodule/);
});
test('case-colliding Git names cannot produce different Windows/Unix payloads',t=>{
  const f=fixture(t),blob=command(f.repo,['hash-object','-w','--stdin'],'fixture');
  command(f.repo,['update-index','--add','--cacheinfo','100644,'+blob+',dist/COLLISION.html']);command(f.repo,['update-index','--add','--cacheinfo','100644,'+blob+',dist/collision.html']);
  command(f.repo,['-c','commit.gpgsign=false','commit','-qm','Synthetic case collision']);assert.throws(()=>exactSource(f.repo,command(f.repo,['rev-parse','HEAD'])),/case-colliding/);
});
test('unsafe paths are never normalized into a different accepted file',()=>{
  for(const name of ['../escape','a/../b','/absolute','a\\b','a//b','x%2f.html','bad?.js','C:stream','x:y','NUL.txt','COM1/file','trailing.','trailing ','a/.hidden','.git/config','workspaces/private.json','private-key.pem'])assert.throws(()=>safeRelative(name),undefined,name);
  assert.equal(safeRelative('.nojekyll'),'.nojekyll');assert.equal(safeRelative('assets/normal-file.webp'),'assets/normal-file.webp');
});
test('current independent legacy pins match the three exact historical source files, not the donor hash',()=>{
  const policy=JSON.parse(fs.readFileSync(path.join(REPO,POLICY_PATH)));validatePolicy(policy);
  const source=path.join(REPO,'studio-project/toadal-feast-website/reference');for(const row of policy.files){const b=fs.readFileSync(path.join(source,row.path));assert.equal(b.length,row.bytes);assert.equal(sha256(b),row.sha256);}
  assert.equal(policy.baseline.sourceCommit,'670f1967ddd49805ca937aa941808fd4de30dc91');
});
test('normal exporter and Pages upload both pass through the shared gate, with no runtime edits or extra deployment workflow',()=>{
  const exporter=fs.readFileSync(path.join(REPO,'scripts/export-staging-candidate.mjs'),'utf8');assert.match(exporter,/verifyExportGamePins\(exportedDir, project, repo\)/);
  const workflow=fs.readFileSync(path.join(REPO,'.github/workflows/pages.yml'),'utf8');assert.match(workflow,/staging-artifact\.mjs prepare/);assert.match(workflow,/--source "\$GITHUB_SHA"/);
  assert.match(workflow,/path: \$\{\{ steps\.seal\.outputs\.payload \}\}/);assert.doesNotMatch(workflow,/path: dist\s*\n/);
  assert.ok(workflow.indexOf('staging-artifact.mjs prepare')<workflow.indexOf('actions/upload-pages-artifact'));
  assert.match(workflow,/github\.ref == 'refs\/heads\/staging\/live-visual'/);
});

test('an indexable Git source cannot be labelled a staging recovery artifact',t=>{
  const f=fixture(t);put(f.dist,'index.html','<!doctype html><p>Indexable</p>');const source=f.commit();
  assert.throws(()=>preparePackage({repo:f.repo,revision:source,fromGit:true,output:f.output}),/noindex\/nofollow/);assert.equal(fs.existsSync(f.output),false);
});
test('an existing custom-domain CNAME is not silently carried into staging',t=>{
  const f=fixture(t);put(f.dist,'CNAME','production.example.invalid');const source=f.commit();assert.throws(()=>exactSource(f.repo,source),/Custom-domain/);
});
test('nonempty hidden source marker cannot be silently dropped by the uploader',t=>{
  const f=fixture(t);put(f.dist,'.nojekyll','unexpected content');const source=f.commit();assert.throws(()=>make(f,{revision:source}),/empty .nojekyll/);
});
test('missing legacy files and duplicate policy records cannot weaken the exact allowlist',t=>{
  const f=fixture(t);const pins=structuredClone(f.policy);pins.files[1]=pins.files[0];assert.throws(()=>validatePolicy(pins),/Invalid exact legacy/);
  assert.throws(()=>enforceGamePolicy([f.policy.files[0],f.policy.files[0],f.policy.files[0]],f.policy),/Duplicate/);
});
