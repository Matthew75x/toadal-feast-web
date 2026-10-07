import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { verifyManifestCompliance } from './verify-manifest-compliance-ledger.mjs';
import { closureReportPath, donorIdentity, DONOR_SOURCES } from './lib/manifest-compliance-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledger = () => JSON.parse(fs.readFileSync(path.join(root, 'manifests/manifest-compliance-ledger.json'), 'utf8'));
function rejects(change, message) {
  const value = ledger(); change(value);
  assert.match(verifyManifestCompliance(root, value).errors.join('\n'), message);
}

test('reconciled ledger retains qualified Manga/Reader and resolves real historical evidence', () => {
  assert.deepEqual(verifyManifestCompliance(root).errors, []);
});
test('old absent Manga/Reader priority is rejected despite green page statuses', () => {
  rejects(value => value.executionPriorities.find(item => item.rank === 2).impact = 'Rows 9 and 10 are absent and row 8 is only a preview; Batch-1 references already exist.', /Priority 2 contradicts/);
});
test('rebuilding proven Reader shell plumbing is rejected', () => {
  rejects(value => value.executionPriorities.find(item => item.rank === 2).doneWhen = 'Truthful Manga Series and Reader shell/bookmark-resume plumbing exist without fabricated chapters.', /Priority 2 contradicts/);
});
test('old missing editorial/search/roadmap assertion is rejected', () => {
  rejects(value => value.executionPriorities.find(item => item.rank === 3).impact = 'Converts partial media/news/support and missing article/search/roadmap families into useful truthful pages.', /Priority 3 contradicts/);
});
test('qualified engineering absence is rejected outside the originally contradictory lanes', () => {
  rejects(value => value.executionPriorities.find(item => item.rank === 4).impact = 'Row 18 is absent and its App conversion engineering must be rebuilt.', /Priority 4 contradicts/);
  const value = ledger(); value.executionPriorities.find(item => item.rank === 4).impact = 'Approved screenshots and verified store destinations remain missing.';
  assert.deepEqual(verifyManifestCompliance(root, value).errors, []);
});
test('required donor identity fails closed rather than rendering undefined', () => {
  for (const source of Object.values(DONOR_SOURCES)) {
    rejects(value => delete value.sourceMap.implementation_evidence.find(record => record.source === source).sha, /Missing or ambiguous historical donor identity/);
    const value = ledger(); value.sourceMap.implementation_evidence.push(value.sourceMap.implementation_evidence.find(record => record.source === source));
    assert.throws(() => donorIdentity(value, source), /ambiguous/);
  }
});
test('a missing donor role is rejected before generated evidence can render undefined', () => {
  rejects(value => delete value.sourceMap.implementation_evidence.find(record => record.source === DONOR_SOURCES.assets).role, /dated historical role/);
});
test('a historical donor cannot become an active implementation authority', () => {
  rejects(value => value.sourceMap.implementation_evidence.find(record => record.source === DONOR_SOURCES.assets).classification = 'ACTIVE_AUTHORITY', /historical donor identity/);
});
test('a historical donor cannot be silently promoted through the active-authority list', () => {
  rejects(value => value.sourceMap.active_authority.push({source:DONOR_SOURCES.visual, rule:'Current approved product authority; use this donor as current product source.'}), /Historical donor is also listed as active authority/);
});
test('the original nonexistent closure pointer is rejected', () => {
  rejects(value => value.latestManifestV1Closure.report = 'docs/review/manifest-audit-remediation-20261002/AUDIT_REMEDIATION_CLOSURE.md', /Required closure report missing/);
});
test('a surviving closure cannot qualify a different source SHA/tree', () => {
  rejects(value => value.latestManifestV1Closure.qualifiedSha = 'a'.repeat(40), /does not bind the recorded qualified SHA\/tree/);
  rejects(value => value.latestManifestV1Closure.qualifiedTree = 'b'.repeat(40), /does not bind the recorded qualified SHA\/tree/);
});
test('the updater selects surviving deployment versus qualification evidence and refuses missing files', t => {
  const dir = 'docs/review/manifest-audit-remediation-20261002';
  assert.equal(closureReportPath(root, dir, true), `${dir}/DEPLOYMENT_CLOSURE.md`);
  assert.equal(closureReportPath(root, dir, false), `${dir}/qualification-summary.json`);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-closure-negative-'));
  t.after(() => fs.rmSync(empty, { recursive:true, force:true }));
  assert.throws(() => closureReportPath(empty, dir, true), /Required closure evidence missing/);
});
test('undated snapshots and stale current labels are rejected', () => {
  rejects(value => delete value.authority.observedDate, /dated historical observations/);
  rejects(value => value.sourceMap.implementation_evidence[0].role = 'Current public GitHub Pages implementation.', /dated historical role/);
  rejects(value => value.externalSystems.githubPages.status = 'CURRENT_STAGING', /dated historical observation/);
});
test('fixed current SHA promotion is rejected; a later dated readback leaves historical qualification valid', () => {
  rejects(value => value.operationalAuthority.sha = value.authority.liveStaging, /without a fixed current SHA/);
  const value = ledger(); value.operationalAuthority.latestReadback = {
    sha:'c'.repeat(40), observedDate:'2026-10-08', classification:'DATED_READBACK_NOT_LIVE_HEAD'
  };
  assert.deepEqual(verifyManifestCompliance(root, value).errors, []);
});
