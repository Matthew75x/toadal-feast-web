#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Run from the repository root: node scripts/verify-canonical-gully-gameplay-authority.mjs
const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project/toadal-feast-website');
const baseline = '40e4437c00951d9b9903c3a188d32f54d5a49ef3';
const expectedAssetHash = 'f9009fbe628b912518347a9bfb1f5cf5c817e10bb1168bc73d8121cbdd4c6612';
const expectedSourceHash = '5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388';
const expectedArchiveHash = '605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb';
const errors = [];
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(project, relative), 'utf8'));
const assetBytes = fs.readFileSync(path.join(project, 'reference/assets/images/characters/gully.webp'));
const assetHash = sha256(assetBytes);

function webpSize(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (kind === 'VP8X' && size >= 10) return [1 + bytes.readUIntLE(data + 4, 3), 1 + bytes.readUIntLE(data + 7, 3)];
    if (kind === 'VP8L' && size >= 5 && bytes[data] === 0x2f) {
      return [1 + bytes[data + 1] + ((bytes[data + 2] & 0x3f) << 8), 1 + (bytes[data + 2] >> 6) + (bytes[data + 3] << 2) + ((bytes[data + 4] & 0x0f) << 10)];
    }
    if (kind === 'VP8 ' && size >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      return [bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff];
    }
    offset = data + size + (size & 1);
  }
  return null;
}

const size = webpSize(assetBytes);
if (assetHash !== expectedAssetHash) errors.push(`Neutral Gully derivative SHA-256 mismatch: ${assetHash}`);
if (!size || size[0] !== 320 || size[1] !== 320) errors.push(`Neutral Gully derivative must be 320x320; found ${size?.join('x') || 'unknown'}`);

const ledger = JSON.parse(fs.readFileSync(path.join(repo, 'docs/review/interactive-discovery-v1-20261001/asset-ledger.json'), 'utf8'));
const gullyLedger = ledger.outputs?.find((item) => item.key === 'gully');
const source = gullyLedger?.sourceAssets?.find((item) => item.path === 'characters/gully/gully-happy-canonical.png');
if (!source || source.sha256 !== expectedSourceHash) errors.push('Approved archive Gully source path or original SHA-256 does not match the authority ledger.');
if (gullyLedger?.path !== 'reference/assets/images/characters/gully.webp' || gullyLedger?.sha256 !== expectedAssetHash || gullyLedger?.width !== 320 || gullyLedger?.height !== 320) errors.push('Gully asset ledger does not record the canonical derivative authority.');
if (ledger.archiveSha256 !== expectedArchiveHash) errors.push('Gully authority ledger archive SHA-256 does not match the approved source archive.');

const pages = ['home', 'characters', 'world', 'media'];
for (const page of pages) {
  const document = readJson(`pages/${page}.json`);
  const html = (document.components || []).map((component) => component.props?.html || '').join('\n');
  if (!/assets\/images\/characters\/gully\.webp/i.test(html)) errors.push(`pages/${page}.json does not reference the neutral Gully derivative.`);
}
const registry = readJson('content/registry.json');
const gully = (registry.characters || []).find((item) => item.id === 'gully');
const assetIndex = readJson('assets/index.json');
const registered = (assetIndex.assets || []).find((item) => item.id === 'asset.home.character.gully');
if (!gully || gully.displayName !== 'Gully' || !gully.assetIds?.includes('asset.home.character.gully')) errors.push('Content registry lacks the Gully record and neutral asset relationship.');
if (registered?.source !== 'reference/assets/images/characters/gully.webp') errors.push('Asset registry does not map the referenced Gully id to the neutral derivative.');
if (registered?.sha256 !== expectedAssetHash || registered?.authoritySha256 !== expectedSourceHash || registered?.authoritySource !== 'TOADAL_WEBSITE_INTERACTIVE_ASSET_AUTHORITY_20261001.zip#characters/gully/gully-happy-canonical.png') errors.push('Asset registry does not retain the approved neutral Gully source-to-derivative hash chain.');
const lock = JSON.parse(fs.readFileSync(path.join(repo, 'manifests/visual-asset-authority-lock.json'), 'utf8'));
const gullyAuthority = lock.characters?.gullyNeutralIdentity;
if (gullyAuthority?.requiredAssetId !== 'asset.home.character.gully' || gullyAuthority?.approvedSourceSha256 !== expectedSourceHash || gullyAuthority?.websiteDerivativeSha256 !== expectedAssetHash || gullyAuthority?.excludeRuntimeGameplay !== true) errors.push('Visual authority lock does not freeze neutral Gully provenance and gameplay exclusion.');

const gameplayFiles = [
  'studio-project/toadal-feast-website/reference/public/games/wicked-bites/index.html',
  'studio-project/toadal-feast-website/reference/public/games/wicked-bites/toadal-bridge.js',
  'studio-project/toadal-feast-website/reference/public/games/wicked-bites/cartridge.json',
  'dist/public/games/wicked-bites/index.html',
  'dist/public/games/wicked-bites/toadal-bridge.js',
  'dist/public/games/wicked-bites/cartridge.json',
];
const runtimeResults = [];
for (const gameplayPath of gameplayFiles) {
  let baselineBlob;
  try {
    baselineBlob = execFileSync('git', ['rev-parse', `${baseline}:${gameplayPath}`], { cwd: repo, encoding: 'utf8' }).trim();
  } catch {
    errors.push(`Cannot read frozen gameplay baseline ${baseline}:${gameplayPath}.`);
    continue;
  }
  const currentPath = path.join(repo, gameplayPath);
  const current = fs.readFileSync(currentPath);
  const currentHash = sha256(current);
  let workingBlob;
  try {
    // Use Git's clean-filtered blob identity so Windows CRLF checkout conversion
    // does not masquerade as a gameplay-source edit.
    workingBlob = execFileSync('git', ['hash-object', `--path=${gameplayPath}`, currentPath], { cwd: repo, encoding: 'utf8' }).trim();
  } catch {
    errors.push(`Cannot compute normalized working-tree blob for gameplay source: ${gameplayPath}`);
    continue;
  }
  const unchanged = baselineBlob === workingBlob;
  runtimeResults.push({ path: gameplayPath, rawSha256: currentHash, baselineBlob, workingTreeBlob: workingBlob, unchanged });
  if (!unchanged) errors.push(`Gameplay source/output blob differs from frozen baseline: ${gameplayPath}`);
}

console.log(JSON.stringify({ schema: 'toadal.canonical-gully-gameplay-authority.v1', baseline, neutralAsset: { path: 'reference/assets/images/characters/gully.webp', sha256: assetHash, width: size?.[0], height: size?.[1], archiveSource: source?.path, archiveSourceSha256: source?.sha256, archiveSha256: ledger.archiveSha256 }, neutralReferences: [...pages.map((page) => `pages/${page}.json`), 'content/registry.json'], unchangedGameplaySources: runtimeResults, errors }, null, 2));
if (errors.length) process.exit(1);
console.log('CANONICAL GULLY AUTHORITY AND FROZEN GAMEPLAY SOURCE CHECK PASS');
