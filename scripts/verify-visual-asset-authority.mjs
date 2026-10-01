#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const lockPath = path.join(root, 'manifests', 'visual-asset-authority-lock.json');
const indexPath = path.join(site, 'assets', 'index.json');
const canonicalPath = path.join(root, 'docs', 'implementation', 'CANONICAL_ASSET_SOURCE_MANIFEST.json');
const errors = [];
const notes = [];
const ok = (c, m) => { if (!c) errors.push(m); };
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const toWebPath = source => source.startsWith('reference/') ? '/' + source.slice('reference/'.length).replace(/\\/g, '/') : null;

for (const f of [lockPath, indexPath, canonicalPath]) ok(fs.existsSync(f), `required authority file missing: ${path.relative(root, f)}`);
if (errors.length) { console.error('VISUAL ASSET AUTHORITY: FAIL'); errors.forEach(x => console.error('-', x)); process.exit(1); }

const lock = readJson(lockPath);
const index = readJson(indexPath);
const canonical = readJson(canonicalPath);
ok(lock.schema === 'toadal-feast.web.visual-asset-authority-lock.v1', 'unexpected authority schema');
ok(lock.status === 'LOCKED_FOR_OWNER_PREVIEW', 'authority is not locked for owner preview');

const indexed = new Map();
const indexedSources = new Set();
for (const asset of index.assets || []) {
  ok(asset.id && !indexed.has(asset.id), 'duplicate or missing asset id: ' + asset.id);
  indexed.set(asset.id, asset);
  ok(asset.source && !indexedSources.has(asset.source), 'duplicate or missing asset source: ' + asset.source);
  indexedSources.add(asset.source);
  const file = path.join(site, asset.source);
  ok(fs.existsSync(file), `indexed asset file missing: ${asset.id} -> ${asset.source}`);
  if (!fs.existsSync(file)) continue;
  ok(fs.statSync(file).size === asset.bytes, `indexed byte mismatch: ${asset.id}`);
  ok(sha256(file) === asset.sha256, `indexed hash mismatch: ${asset.id}`);
}

const snapshot = new Map((lock.registeredAssetSnapshot || []).map(x => [x.id, x]));
ok(snapshot.size === indexed.size, `authority/index asset count mismatch: lock ${snapshot.size}, index ${indexed.size}`);
for (const [id, asset] of indexed) {
  const frozen = snapshot.get(id);
  ok(!!frozen, `indexed asset not frozen in authority: ${id}`);
  if (!frozen) continue;
  for (const key of ['source','sha256','bytes','category']) ok(frozen[key] === asset[key], `authority drift for ${id}: ${key}`);
}

const requiredIds = [
  lock.brand?.approvedWebsiteBrandAssetId,
  ...(lock.characters?.toadalRequiredAssetIds || []),
  lock.characters?.princessLily?.requiredAssetId,
  ...(lock.characters?.requiredRegistryAssetIds || []),
  ...(lock.worldRequiredAssetIds || []),
  ...(lock.gamePreviewRequiredAssetIds || [])
].filter(Boolean);
for (const id of requiredIds) ok(indexed.has(id), `required authority asset id missing: ${id}`);

const lilySource = lock.characters?.princessLily?.approvedCanonicalSource;
const lilyRequired = (canonical.required || []).find(x => x.role === 'princessLilyIdle');
ok(lilyRequired?.path === lilySource, 'Princess Lily source drifted from the September 2026 canonical set');
const lilyAsset = indexed.get(lock.characters?.princessLily?.requiredAssetId);
ok(lilyAsset?.source === 'reference/assets/images/characters/princess-lily.webp', 'Princess Lily website derivative path drifted');
ok(lilyAsset?.referenceSource === lilyAsset?.source, 'Princess Lily referenceSource drifted');

const retiredCanonical = new Set(canonical.retiredNeverUse || []);
const retiredLock = new Set(lock.characters?.princessLily?.retiredNeverUse || []);
ok(retiredCanonical.size === retiredLock.size && [...retiredCanonical].every(x => retiredLock.has(x)), 'retired Princess Lily deny list differs from canonical source manifest');

const productRoots = ['pages','collections','content','mechanics','variables','animations'].map(x => path.join(site, x));
productRoots.push(path.join(site, 'reference', 'assets', 'css'));
productRoots.push(path.join(site, 'reference', 'assets', 'js'));
const textFiles = [];
function walkText(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkText(p);
    else if (ent.isFile() && ['.json','.js','.mjs','.css','.html'].includes(path.extname(ent.name).toLowerCase())) textFiles.push(p);
  }
}
productRoots.forEach(walkText);

const forbiddenStrings = [
  ...(lock.characters?.princessLily?.retiredNeverUse || []),
  lock.brand?.externalOwnerIcon?.name || 'EASY BRANDING.png'
].filter(Boolean);
for (const file of textFiles) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const forbidden of forbiddenStrings) ok(!raw.includes(forbidden), `forbidden asset reference in product source: ${path.relative(root,file)} -> ${forbidden}`);
}

const referenceRoot = path.join(site, 'reference');
for (const retired of lock.characters?.princessLily?.retiredNeverUse || []) {
  const basename = path.basename(retired);
  const princessRoot = path.join(referenceRoot, 'assets', 'images', 'characters');
  const hits = [];
  function find(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) find(p);
      else if (ent.isFile() && ent.name === basename && p.toLowerCase().includes('princess')) hits.push(p);
    }
  }
  find(princessRoot);
  ok(hits.length === 0, `retired Princess Lily file physically present: ${basename}`);
}

const allowedWebPaths = new Set();
for (const asset of index.assets || []) {
  const web = toWebPath(asset.source);
  if (web) allowedWebPaths.add(web);
}
const runtimeLock = lock.approvedRuntimeDerivatives || [];
const runtimePaths = new Set();
for (const item of runtimeLock) {
  runtimePaths.add(item.path);
  allowedWebPaths.add(item.path);
  const file = path.join(referenceRoot, item.path.replace(/^\//,'').replace(/\//g,path.sep));
  ok(fs.existsSync(file), `approved runtime derivative missing: ${item.path}`);
  if (!fs.existsSync(file)) continue;
  ok(fs.statSync(file).size === item.bytes, `runtime byte mismatch: ${item.path}`);
  ok(sha256(file) === item.sha256, `runtime hash mismatch: ${item.path}`);
}

const runtimeDirs = [
  path.join(referenceRoot,'assets','images','characters','companion','runtime-v1'),
  path.join(referenceRoot,'assets','images','characters','companion','runtime-v2')
];
const actualRuntime = new Set();
for (const dir of runtimeDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    if (!ent.isFile()) continue;
    const file = path.join(dir, ent.name);
    actualRuntime.add('/' + path.relative(referenceRoot,file).replace(/\\/g,'/'));
  }
}
ok(actualRuntime.size === runtimePaths.size, `runtime derivative count drift: lock ${runtimePaths.size}, actual ${actualRuntime.size}`);
for (const p of actualRuntime) ok(runtimePaths.has(p), `unapproved runtime derivative present: ${p}`);

const allVisualFiles = [];
for (const visualRoot of [path.join(referenceRoot,'assets','images'), path.join(referenceRoot,'assets','brand')]) {
  function walkVisual(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkVisual(p);
      else if (ent.isFile()) allVisualFiles.push('/' + path.relative(referenceRoot,p).replace(/\\/g,'/'));
    }
  }
  walkVisual(visualRoot);
}
for (const p of allVisualFiles) ok(allowedWebPaths.has(p), `visual file exists outside locked authority: ${p}`);
ok(allVisualFiles.length === allowedWebPaths.size, `visual authority coverage mismatch: files ${allVisualFiles.length}, allowed ${allowedWebPaths.size}`);

const webRefRe = /\/assets\/(?:images|brand)\/[A-Za-z0-9_.\-\/]+/g;
const references = new Map();
for (const file of textFiles) {
  const raw = fs.readFileSync(file,'utf8');
  for (const match of raw.matchAll(webRefRe)) {
    const ref = match[0];
    if (!references.has(ref)) references.set(ref, []);
    references.get(ref).push(path.relative(root,file));
  }
}
for (const [ref, files] of references) {
  ok(allowedWebPaths.has(ref), `product source references asset outside authority: ${ref} (${files[0]})`);
  const disk = path.join(referenceRoot, ref.replace(/^\//,'').replace(/\//g,path.sep));
  ok(fs.existsSync(disk), `product source asset reference missing on disk: ${ref}`);
}

const brandDir = path.join(referenceRoot,'assets','brand');
const brandFiles = fs.existsSync(brandDir) ? fs.readdirSync(brandDir).filter(x => fs.statSync(path.join(brandDir,x)).isFile()) : [];
if (lock.brand?.finalFranchiseWordmark?.status === 'NOT_PRESENT_NOT_APPROVED') {
  for (const name of brandFiles) ok(!/(wordmark|logo)/i.test(name), `unapproved brand wordmark/logo appeared while authority status is pending: ${name}`);
}
ok(brandFiles.includes('brand-crown.svg'), 'canonical brand crown missing');
const siteCss = fs.readFileSync(path.join(referenceRoot,'assets','css','site.css'),'utf8');
ok(siteCss.includes('brand-crown.svg'), 'shared site CSS no longer uses canonical brand crown');

const externalRule = canonical.externalOwnerAsset?.rule || '';
ok(/app\/icon source only/i.test(externalRule), 'external EASY BRANDING asset rule no longer says app/icon only');
ok(/website wordmark/i.test(externalRule), 'external EASY BRANDING asset rule no longer prohibits website-wordmark use');

const registry = readJson(path.join(site,'content','registry.json'));
const registryIds = new Set((registry.characters || []).flatMap(x => x.assetIds || []));
for (const id of lock.characters?.requiredRegistryAssetIds || []) ok(registryIds.has(id), `character registry lost locked asset id: ${id}`);
for (const id of registryIds) ok(indexed.has(id), `character registry references unregistered asset id: ${id}`);

notes.push(`registeredAssets=${indexed.size}`);
notes.push(`runtimeDerivatives=${runtimePaths.size}`);
notes.push(`visualFilesCovered=${allVisualFiles.length}/${allowedWebPaths.size}`);
notes.push(`productVisualReferences=${references.size}`);
notes.push(`brandFiles=${brandFiles.join(',')}`);
notes.push(`wordmarkStatus=${lock.brand?.finalFranchiseWordmark?.status}`);

if (errors.length) {
  console.error('VISUAL ASSET AUTHORITY: FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}
console.log('VISUAL ASSET AUTHORITY: PASS');
console.log(JSON.stringify({schema:lock.schema,status:lock.status,notes},null,2));