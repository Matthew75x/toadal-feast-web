import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { CLAW_CUSTODY_SOURCE, CLAW_QUARANTINE_FILES, classifyStagingGameRows, projectStagingGamePayload } from './lib/staging-game-projection.mjs';
import { REPO, POLICY_PATH, inventoryPayload, enforceGamePolicy, sha256 } from './lib/staging-artifact.mjs';

const policy = JSON.parse(fs.readFileSync(path.join(REPO, POLICY_PATH), 'utf8'));
const reference = path.join(REPO, 'studio-project/toadal-feast-website/reference');
const fullRows = () => [...structuredClone(policy.files), ...structuredClone(CLAW_QUARANTINE_FILES)];
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-known-game-projection-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const row of fullRows()) {
    const target = path.join(root, row.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(reference, row.path), target);
  }
  return root;
}

test('fixed quarantine is the complete83-file frozen CLAW inventory, independent of later candidates', () => {
  assert.equal(CLAW_CUSTODY_SOURCE, '72c8f76686a9479f593aea36c1dc20f116706b98');
  assert.equal(CLAW_QUARANTINE_FILES.length, 83);
  assert.equal(new Set(CLAW_QUARANTINE_FILES.map(row => row.path)).size, 83);
  assert.equal(CLAW_QUARANTINE_FILES.reduce((sum, row) => sum + row.bytes, 0), 16892760);
  for (const row of CLAW_QUARANTINE_FILES) {
    const bytes = fs.readFileSync(path.join(reference, row.path));
    assert.equal(bytes.length, row.bytes, row.path);
    assert.equal(sha256(bytes), row.sha256, row.path);
  }
});

test('full private86 files classify into three admitted files and83 held files without changing policy', () => {
  const before = JSON.stringify(policy);
  const plan = classifyStagingGameRows(fullRows(), policy.files);
  assert.equal(plan.admitted.length, 3);
  assert.equal(plan.excluded.length, 83);
  assert.equal(JSON.stringify(policy), before);
  assert.equal(policy.unknownGamePayloads, 'DENY');
  assert.equal(policy.newCartridgeAdmission, 'NOT_ENABLED');
  assert.throws(() => enforceGamePolicy(fullRows(), policy), /Unknown or missing/);
  assert.equal(enforceGamePolicy(plan.admitted, policy).files, 3);
});

test('already projected staging rows have no additional admission or exclusion', () => {
  const plan = classifyStagingGameRows(structuredClone(policy.files), policy.files);
  assert.equal(plan.excluded.length, 0);
  assert.equal(plan.admitted.length, 3);
});

test('crawler CLI accepts exact private and projected games but refuses unknown, changed or partial payloads', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'index.html'), '<meta name="robots" content="noindex,nofollow"><h1>Staging</h1>');
  fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  const check = () => spawnSync(process.execPath, [path.join(REPO, 'scripts/verify-staging-robots.mjs'), root, 'staging'], {
    encoding: 'utf8', windowsHide: true,
  });
  assert.equal(check().status, 0, 'exact private86-file authoring export');
  projectStagingGamePayload(root, inventoryPayload(root), policy.files);
  assert.equal(check().status, 0, 'three-file public projection');
  assert.equal(enforceGamePolicy(inventoryPayload(root), policy).files, 3);
  const unknown = path.join(root, 'public/games/wicked-bites/unknown.js');
  fs.writeFileSync(unknown, 'unapproved');
  assert.match(check().stderr, /Unknown protected/);
  fs.unlinkSync(unknown);
  const admitted = path.join(root, policy.files[0].path), original = fs.readFileSync(admitted);
  fs.writeFileSync(admitted, Buffer.alloc(original.length, 65));
  assert.match(check().stderr, /differs from fixed/);
  fs.writeFileSync(admitted, original);
  const held = CLAW_QUARANTINE_FILES[0];
  fs.mkdirSync(path.dirname(path.join(root, held.path)), { recursive: true });
  fs.copyFileSync(path.join(reference, held.path), path.join(root, held.path));
  assert.match(check().stderr, /Incomplete fixed/);
});

test('unknown public, package, cartridge or extra CLAW paths are refused rather than silently dropped', () => {
  for (const path of ['public/games/unqualified/index.html', 'game-packages/new/payload.js',
    'cartridges/new/payload.js', 'public/games/claw-feed-gulper/unreviewed.js']) {
    assert.throws(() => classifyStagingGameRows([...fullRows(), { path, bytes: 1, sha256: 'a'.repeat(64) }], policy.files), /Unknown protected/);
  }
});

test('tampered admitted or quarantined identity is refused even with unchanged length', () => {
  for (const index of [0, 3]) {
    const rows = fullRows(); rows[index].sha256 = 'a'.repeat(64);
    assert.throws(() => classifyStagingGameRows(rows, policy.files), /differs from fixed/);
  }
});

test('missing admitted bytes and partial CLAW copies are both refused', () => {
  const missingAdmitted = fullRows(); missingAdmitted.shift();
  assert.throws(() => classifyStagingGameRows(missingAdmitted, policy.files), /Missing preserved/);
  const missingQuarantine = fullRows(); missingQuarantine.pop();
  assert.throws(() => classifyStagingGameRows(missingQuarantine, policy.files), /Incomplete fixed/);
});

test('duplicate protected paths cannot satisfy a missing inventory entry', () => {
  const rows = fullRows(); rows[4] = rows[3];
  assert.throws(() => classifyStagingGameRows(rows, policy.files), /Duplicate protected/);
});

test('scratch projection removes exactly83 files, preserves admitted bytes, and leaves source intact', t => {
  const root = fixture(t), sourceBefore = fullRows().map(row => sha256(fs.readFileSync(path.join(reference, row.path))));
  const receipt = projectStagingGamePayload(root, inventoryPayload(root), policy.files);
  assert.equal(receipt.excludedFiles, 83);
  assert.equal(receipt.excludedBytes, 16892760);
  assert.equal(receipt.admittedGameFiles, 3);
  assert.equal(receipt.sourceModified, false);
  assert.deepEqual(inventoryPayload(root), [...policy.files].sort((a, b) => a.path.localeCompare(b.path)));
  assert.equal(enforceGamePolicy(inventoryPayload(root), policy).files, 3);
  assert.equal(fs.existsSync(path.join(root, 'public/games/claw-feed-gulper')), false);
  assert.deepEqual(fullRows().map(row => sha256(fs.readFileSync(path.join(reference, row.path)))), sourceBefore);
});

test('an unknown file refuses the entire projection before any known file is removed', t => {
  const root = fixture(t), unknown = path.join(root, 'public/games/claw-feed-gulper/unknown.js');
  fs.writeFileSync(unknown, 'unapproved');
  assert.throws(() => projectStagingGamePayload(root, inventoryPayload(root), policy.files), /Unknown protected/);
  for (const row of fullRows()) assert.equal(fs.existsSync(path.join(root, row.path)), true);
});

test('bytes changed after inventory refuse before removal', t => {
  const root = fixture(t), rows = inventoryPayload(root), changed = CLAW_QUARANTINE_FILES.at(-1);
  fs.writeFileSync(path.join(root, changed.path), Buffer.alloc(changed.bytes, 65));
  assert.throws(() => projectStagingGamePayload(root, rows, policy.files), /changed before projection/);
  for (const row of fullRows()) assert.equal(fs.existsSync(path.join(root, row.path)), true);
});

test('a linked quarantine root cannot direct exclusion into an external cartridge', t => {
  const root = fixture(t), cartridge = path.join(root, 'public/games/claw-feed-gulper'), outside = path.join(path.dirname(root), path.basename(root) + '-outside');
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.renameSync(cartridge, outside);
  fs.symlinkSync(outside, cartridge, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => projectStagingGamePayload(root, fullRows(), policy.files), /Linked quarantine/);
  assert.equal(fs.readdirSync(outside).length > 0, true);
});
