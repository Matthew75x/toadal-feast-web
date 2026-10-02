#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const assetIndexPath = path.join(site, 'assets', 'index.json');
const authorityLockPath = path.join(root, 'manifests', 'visual-asset-authority-lock.json');
const gullyPath = path.join(site, 'reference', 'assets', 'images', 'characters', 'gully.webp');
const expectedSha = '177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea';
const ownerSourceSha = '5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388';
const expectedBytes = 15798;
const expectedWidth = 319;
const expectedHeight = 319;
const expectedTargets = ['website-home','website-characters','website-world','website-media'];
const neutralPages = ['pages/home.json','pages/characters.json','pages/world.json','pages/media.json'];
const errors = [];
const notes = [];
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ok = (condition, message) => { if (!condition) errors.push(message); };

ok(fs.existsSync(assetIndexPath), 'asset index missing');
ok(fs.existsSync(authorityLockPath), 'visual asset authority lock missing');
ok(fs.existsSync(gullyPath), 'canonical neutral Gully derivative missing');

if (fs.existsSync(gullyPath)) {
  ok(fs.statSync(gullyPath).size === expectedBytes, 'Gully byte size drifted');
  ok(sha256(gullyPath) === expectedSha, 'Gully SHA-256 drifted from cleaned owner-approved happy portrait derivative');
}

if (fs.existsSync(assetIndexPath)) {
  const index = JSON.parse(fs.readFileSync(assetIndexPath, 'utf8'));
  const asset = (index.assets || []).find(x => x.id === 'asset.home.character.gully');
  ok(!!asset, 'asset.home.character.gully missing');
  if (asset) {
    ok(asset.source === 'reference/assets/images/characters/gully.webp', 'neutral Gully asset path drifted');
    ok(asset.sha256 === expectedSha, 'asset index Gully SHA drifted');
    ok(asset.referenceSha256 === expectedSha, 'asset index reference SHA drifted');
    ok(asset.bytes === expectedBytes, 'asset index Gully bytes drifted');
    ok(asset.width === expectedWidth && asset.height === expectedHeight, 'asset index Gully dimensions drifted');
    ok(asset.authoritySha256 === ownerSourceSha, 'owner-source authority SHA drifted');
    for (const target of expectedTargets) ok((asset.renderTargets || []).includes(target), 'missing render target: ' + target);
    for (const tag of ['happy-gully','neutral-profile','background-cleaned']) ok((asset.tags || []).includes(tag), 'missing authority tag: ' + tag);
  }
}

if (fs.existsSync(authorityLockPath)) {
  const lock = JSON.parse(fs.readFileSync(authorityLockPath, 'utf8'));
  const entries = lock?.authority?.assetLocks || lock?.assetLocks || [];
  const flat = Array.isArray(entries) ? entries : [];
  const asset = flat.find(x => x.id === 'asset.home.character.gully');
  if (asset) {
    ok(asset.sha256 === expectedSha, 'authority-lock Gully SHA drifted');
    ok(asset.bytes === expectedBytes, 'authority-lock Gully bytes drifted');
  } else {
    const raw = fs.readFileSync(authorityLockPath, 'utf8');
    ok(raw.includes(expectedSha), 'authority lock does not contain canonical Gully SHA');
  }
}

for (const rel of neutralPages) {
  const file = path.join(site, rel);
  ok(fs.existsSync(file), 'neutral surface missing: ' + rel);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  ok(raw.includes('assets/images/characters/gully.webp'), 'neutral surface no longer uses shared canonical Gully: ' + rel);
}

const wickedRoot = path.join(site, 'reference', 'public', 'games', 'wicked-bites');
if (fs.existsSync(wickedRoot)) {
  const embedded = fs.readFileSync(path.join(wickedRoot, 'index.html'), 'utf8');
  ok(embedded.includes('runtime-select/pelican.png'), 'Wicked Bites gameplay Gully selector was unexpectedly altered');
  ok(embedded.includes('gully_ludo_flight_flap_6f_256.png'), 'Wicked Bites gameplay Gully sprite reference was unexpectedly altered');
}

notes.push('neutralSurfaces=' + neutralPages.join(','));
notes.push('ownerApprovedDerivative=' + expectedSha);
notes.push('ownerSource=' + ownerSourceSha);
notes.push('backgroundCleanup=near-black connected backdrop removed; silhouette retained');
notes.push('gameplaySpecificGullyUntouchedByAuthorityRule=true');

if (errors.length) {
  console.error('GULLY CANONICAL AUTHORITY: FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}
console.log('GULLY CANONICAL AUTHORITY: PASS');
console.log(JSON.stringify({schema:'toadal-feast.gully-canonical-authority.v1',notes}, null, 2));