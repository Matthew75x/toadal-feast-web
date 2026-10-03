import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyGullyDerivativeAsset } from './verify-canonical-gully-gameplay-authority.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonical = {
  id: 'asset.home.character.gully',
  source: 'reference/assets/images/characters/gully.webp',
  sha256: '177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea',
};
const masterPins = [
  '481ad8dc37e26180319314452644e73c4743d2e2c0240640fc5ef661902ad499',
  'a2f72ce4b16429ddac86a4f38291ed2ad3e6d5073e3d79e1add037dfcb241265',
];
const handoffCommit = '012877ab7058f8de3c1802d2a572834a57ae2666';

test('canonical Gully authority, derivative handoff hashes, and six frozen gameplay files pass end to end', () => {
  const output = execFileSync(process.execPath, ['scripts/verify-canonical-gully-gameplay-authority.mjs', repo], { cwd: repo, encoding: 'utf8' });
  const report = JSON.parse(output.slice(0, output.indexOf('\nCANONICAL GULLY AUTHORITY')));
  assert.equal(report.neutralAsset.sha256, '177f30acff9a2a782ba3e80aa3e05f19860dddeb513f7de0955fadc0b8585cea');
  assert.deepEqual([report.neutralAsset.width, report.neutralAsset.height], [319, 319]);
  assert.equal(report.neutralAsset.archiveSource, 'characters/gully/gully-happy-canonical.png');
  assert.equal(report.neutralAsset.archiveSourceSha256, '5c06144b728acb893eca1996c83d92e771e73b27be466f2acf5aec0ffff96388');
  assert.equal(report.neutralAsset.archiveSha256, '605e16399d21210228a9c784fb413c6d886e75b0bf0fa277b25ef0a2dbcf4ecb');
  assert.deepEqual(report.neutralReferences, ['pages/home.json', 'pages/characters.json', 'pages/world.json', 'pages/media.json', 'content/registry.json']);
  assert.equal(report.unchangedGameplaySources.length, 6);
  assert.ok(report.unchangedGameplaySources.every((item) => item.unchanged));
  assert.deepEqual(report.derivedReferences.map(({ sha256, handoffMasterSha256, handoffCommit: commit }) => ({ sha256, handoffMasterSha256, handoffCommit: commit })), [
    { sha256: '431513d3b1ea642582412819b4e37be91b517f011a29ef8dd7bf63bd6030c48d', handoffMasterSha256: '481ad8dc37e26180319314452644e73c4743d2e2c0240640fc5ef661902ad499', handoffCommit },
    { sha256: 'a6e8afa445bde0c16837784850da3622de7705ae23ad11d2db1fdf0994fac8bd', handoffMasterSha256: 'a2f72ce4b16429ddac86a4f38291ed2ad3e6d5073e3d79e1add037dfcb241265', handoffCommit },
  ]);
  assert.deepEqual(report.errors, []);
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gully-derivative-proof-'));
  const source = 'assets/imported/gully-desktop.webp';
  const bytes = Buffer.from('approved native derivative fixture');
  const absoluteSource = path.join(root, ...source.split('/'));
  fs.mkdirSync(path.dirname(absoluteSource), { recursive: true });
  fs.writeFileSync(absoluteSource, bytes);
  const asset = {
    id: 'asset.owner-native.gully.desktop', source, extension: 'webp',
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    authorityAssetId: canonical.id, authoritySource: canonical.source,
    authoritySha256: canonical.sha256, handoffCommit,
    handoffMasterSha256: masterPins[0],
  };
  return { root, absoluteSource, asset };
}

test('accepts imported Gully derivatives with either approved desktop or mobile master pin', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  for (const handoffMasterSha256 of masterPins) {
    const result = verifyGullyDerivativeAsset({ ...f.asset, handoffMasterSha256 }, f.root, canonical);
    assert.equal(result.valid, true, result.errors.join('; '));
    assert.equal(result.proof.source, f.asset.source);
    assert.equal(result.proof.authorityAssetId, canonical.id);
    assert.equal(result.proof.handoffMasterSha256, handoffMasterSha256);
  }
});

test('rejects a derivative registry hash that does not match its source bytes', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const result = verifyGullyDerivativeAsset({ ...f.asset, sha256: '0'.repeat(64) }, f.root, canonical);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('SHA-256 does not match')));
});

test('rejects a broken canonical authority link or unapproved authority asset', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  for (const changes of [
    { authorityAssetId: 'asset.wrong' },
    { authoritySource: 'reference/wrong.webp' },
    { authoritySha256: '0'.repeat(64) },
  ]) {
    const result = verifyGullyDerivativeAsset({ ...f.asset, ...changes }, f.root, canonical);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('does not link')));
  }
  const badAuthority = verifyGullyDerivativeAsset(f.asset, f.root, { ...canonical, sha256: '0'.repeat(64) });
  assert.equal(badAuthority.valid, false);
  assert.ok(badAuthority.errors.some((error) => error.includes('authority asset')));
});

test('rejects a missing imported derivative source file', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.unlinkSync(f.absoluteSource);
  const result = verifyGullyDerivativeAsset(f.asset, f.root, canonical);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('missing or unreadable')));
});
