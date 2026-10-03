#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

// Run from the repository root: node scripts/verify-canonical-gully-gameplay-authority.mjs
const expectedAssetHash = '177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea';
const expectedHandoffCommit = '012877ab7058f8de3c1802d2a572834a57ae2666';
const derivativeMasterPins = new Set(['481ad8dc37e26180319314452644e73c4743d2e2c0240640fc5ef661902ad499', 'a2f72ce4b16429ddac86a4f38291ed2ad3e6d5073e3d79e1add037dfcb241265']);
const expectedDerivativeHashes = new Map([
  ['481ad8dc37e26180319314452644e73c4743d2e2c0240640fc5ef661902ad499', '431513d3b1ea642582412819b4e37be91b517f011a29ef8dd7bf63bd6030c48d'],
  ['a2f72ce4b16429ddac86a4f38291ed2ad3e6d5073e3d79e1add037dfcb241265', 'a6e8afa445bde0c16837784850da3622de7705ae23ad11d2db1fdf0994fac8bd'],
]);
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

export function verifyGullyDerivativeAsset(asset, projectRoot, authorityAsset) {
  const errors = [];
  if (!asset || typeof asset !== 'object') return { valid: false, errors: ['Derivative asset registry entry is missing.'] };
  if (authorityAsset?.id !== 'asset.home.character.gully' || authorityAsset?.source !== 'reference/assets/images/characters/gully.webp' || authorityAsset?.sha256 !== expectedAssetHash) errors.push('Canonical Gully authority asset does not match its pinned registry identity, source, and hash.');
  if (asset.authorityAssetId !== 'asset.home.character.gully' || asset.authoritySource !== 'reference/assets/images/characters/gully.webp' || asset.authoritySha256 !== expectedAssetHash) errors.push('Derivative does not link to the pinned canonical Gully asset, source, and SHA-256.');
  if (asset.handoffCommit !== expectedHandoffCommit) errors.push('Derivative handoff commit does not match the exact approved commit.');
  if (!derivativeMasterPins.has(asset.handoffMasterSha256)) errors.push('Derivative handoff master SHA-256 is not an approved desktop or mobile pin.');
  const source = String(asset.source || '').replaceAll('\\', '/');
  if (!source.startsWith('assets/imported/') || path.posix.normalize(source) !== source || source.split('/').includes('..')) errors.push('Derivative source must resolve from the native assets/imported directory.');
  let actualSha256;
  if (source.startsWith('assets/imported/') && path.posix.normalize(source) === source && !source.split('/').includes('..')) {
    const absoluteSource = path.resolve(projectRoot, ...source.split('/'));
    if (!absoluteSource.startsWith(path.resolve(projectRoot) + path.sep)) errors.push('Derivative source resolves outside the Studio project.');
    else try { actualSha256 = sha256(fs.readFileSync(absoluteSource)); } catch { errors.push(`Derivative source is missing or unreadable: ${source}`); }
  }
  if (!/^[0-9a-f]{64}$/i.test(asset.sha256 || '') || actualSha256 !== asset.sha256?.toLowerCase()) errors.push('Derivative registry SHA-256 does not match the bytes at its source path.');
  return { valid: !errors.length, errors, proof: errors.length ? undefined : { assetId: asset.id, source, sha256: actualSha256, authorityAssetId: asset.authorityAssetId, authoritySource: asset.authoritySource, authoritySha256: asset.authoritySha256, handoffCommit: asset.handoffCommit, handoffMasterSha256: asset.handoffMasterSha256 } };
}

async function main() {
const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project/toadal-feast-website');
const baseline = '40e4437c00951d9b9903c3a188d32f54d5a49ef3';
const expectedSourceHash = '5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388';
const expectedArchiveHash = '605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb';
const errors = [];
const projector = await createOwnerNativeProjector();
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
if (!size || size[0] !== 319 || size[1] !== 319) errors.push(`Neutral Gully derivative must be 319x319; found ${size?.join('x') || 'unknown'}`);

const ledger = JSON.parse(fs.readFileSync(path.join(repo, 'docs/review/interactive-discovery-v1-20261001/asset-ledger.json'), 'utf8'));
const gullyLedger = ledger.outputs?.find((item) => item.key === 'gully');
const source = gullyLedger?.sourceAssets?.find((item) => item.path === 'characters/gully/gully-happy-canonical.png');
if (!source || source.sha256 !== expectedSourceHash) errors.push('Approved archive Gully source path or original SHA-256 does not match the authority ledger.');
if (gullyLedger?.path !== 'reference/assets/images/characters/gully.webp' || gullyLedger?.sha256 !== expectedAssetHash || gullyLedger?.width !== 319 || gullyLedger?.height !== 319) errors.push('Gully asset ledger does not record the canonical derivative authority.');
if (ledger.archiveSha256 !== expectedArchiveHash) errors.push('Gully authority ledger archive SHA-256 does not match the approved source archive.');

const pages = ['home', 'characters', 'world', 'media'];
const renderedPages = new Map();
for (const page of pages) {
  const document = readJson(`pages/${page}.json`);
  const html = projector.projectPageComponents(project, document).map(({ html }) => html).join('\n');
  renderedPages.set(page, html);
  if (page !== 'characters' && !/assets\/images\/characters\/gully\.webp/i.test(html)) errors.push(`pages/${page}.json does not reference the neutral Gully derivative.`);
}
const registry = readJson('content/registry.json');
const gully = (registry.characters || []).find((item) => item.id === 'gully');
const assetIndex = readJson('assets/index.json');
const registered = (assetIndex.assets || []).find((item) => item.id === 'asset.home.character.gully');
if (!gully || gully.displayName !== 'Gully' || !gully.assetIds?.includes('asset.home.character.gully')) errors.push('Content registry lacks the Gully record and neutral asset relationship.');
if (registered?.source !== 'reference/assets/images/characters/gully.webp') errors.push('Asset registry does not map the referenced Gully id to the neutral derivative.');
if (registered?.sha256 !== expectedAssetHash || registered?.authoritySha256 !== expectedSourceHash || registered?.authoritySource !== 'TOADAL_WEBSITE_INTERACTIVE_ASSET_AUTHORITY_20261001.zip#characters/gully/gully-happy-canonical.png') errors.push('Asset registry does not retain the approved neutral Gully source-to-derivative hash chain.');
const derivedAssets = (assetIndex.assets || []).filter((item) => item.authorityAssetId === 'asset.home.character.gully');
const derivedProofs = [];
for (const asset of derivedAssets) {
  const result = verifyGullyDerivativeAsset(asset, project, registered);
  if (!result.valid) errors.push(...result.errors.map((error) => `${asset.id || 'Gully derivative'}: ${error}`));
  else {
    derivedProofs.push(result.proof);
    if (expectedDerivativeHashes.get(result.proof.handoffMasterSha256) !== result.proof.sha256) errors.push(`${asset.id || 'Gully derivative'} source SHA-256 does not match its exact approved desktop/mobile handoff master mapping.`);
  }
}
if (derivedProofs.length && derivativeMasterPins.size !== new Set(derivedProofs.map((proof) => proof.handoffMasterSha256)).size) errors.push('Gully derivative registry does not include both approved desktop and mobile master pins.');
const charactersHtml = renderedPages.get('characters') || '';
if (!derivedProofs.length && !/assets\/images\/characters\/gully\.webp/i.test(charactersHtml)) errors.push('pages/characters.json does not reference the canonical Gully source or any proven native derivative.');
const renderedDerivedProofs = derivedProofs.filter((proof) => {
  const asset = derivedAssets.find((candidate) => candidate.id === proof.assetId);
  const renderedUrl = `/assets/studio/${String(asset.id).replace(/[^a-z0-9_-]+/gi, '-')}.${asset.sha256.slice(0, 10)}.${asset.extension}`;
  return charactersHtml.includes(renderedUrl);
});
if (derivedProofs.length && !renderedDerivedProofs.length) errors.push('Characters does not render a validated native Gully derivative URL resolved from the asset registry.');
if (renderedDerivedProofs.length !== derivedProofs.length) errors.push('Characters does not render every validated Gully derivative source resolved from the native asset registry.');
if (renderedDerivedProofs.length && /assets\/images\/characters\/gully\.webp/i.test(charactersHtml)) errors.push('Characters still renders the literal canonical Gully URL alongside a derivative.');
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

console.log(JSON.stringify({ schema: 'toadal.canonical-gully-gameplay-authority.v1', baseline, neutralAsset: { path: 'reference/assets/images/characters/gully.webp', sha256: assetHash, width: size?.[0], height: size?.[1], archiveSource: source?.path, archiveSourceSha256: source?.sha256, archiveSha256: ledger.archiveSha256 }, neutralReferences: [...pages.map((page) => `pages/${page}.json`), 'content/registry.json'], ...(renderedDerivedProofs.length ? { derivedReferences: renderedDerivedProofs } : {}), unchangedGameplaySources: runtimeResults, errors }, null, 2));
if (errors.length) process.exit(1);
console.log('CANONICAL GULLY AUTHORITY AND FROZEN GAMEPLAY SOURCE CHECK PASS');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
