import fs from 'node:fs';
import path from 'node:path';

export const DONOR_SOURCES = {
  visual: 'integration/visual-convergence-combined-20261001',
  assets: 'integration/master-asset-authority-20261001',
};
const exactSha = value => /^[a-f0-9]{40}$/u.test(value || '');
const dated = value => /^\d{4}-\d{2}-\d{2}$/u.test(value || '');

export function donorIdentity(ledger, source) {
  const records = (ledger.sourceMap?.implementation_evidence || []).filter(record => record.source === source);
  if (records.length !== 1 || !exactSha(records[0].sha) || records[0].classification !== 'HISTORICAL_DONOR') {
    throw new Error(`Missing or ambiguous historical donor identity: ${source}`);
  }
  return records[0];
}

// The historical updater must reference evidence that actually survived. It may
// not invent a replacement closure or imply deployment from qualification alone.
export function closureReportPath(root, evidenceDir, deployed) {
  const report = `${evidenceDir}/${deployed ? 'DEPLOYMENT_CLOSURE.md' : 'qualification-summary.json'}`;
  if (!fs.existsSync(path.join(root, report))) throw new Error(`Required closure evidence missing: ${report}`);
  return report;
}

export function controlConsistencyErrors(ledger, root) {
  const errors = [];
  for (const source of Object.values(DONOR_SOURCES)) {
    try { donorIdentity(ledger, source); } catch (error) { errors.push(error.message); }
  }
  for (const record of ledger.sourceMap?.implementation_evidence || []) {
    if (!record.source || !record.role || !exactSha(record.sha) || !dated(record.observedDate) ||
        !['HISTORICAL_OBSERVATION', 'HISTORICAL_DONOR'].includes(record.classification) ||
        /\bcurrent\b/iu.test(record.role || '')) errors.push(`Implementation evidence needs a dated historical role: ${record.source}`);
    if (record.classification === 'HISTORICAL_DONOR' &&
        (ledger.sourceMap?.active_authority || []).some(active => active.source === record.source)) {
      errors.push(`Historical donor is also listed as active authority: ${record.source}`);
    }
  }
  if (ledger.authority?.classification !== 'HISTORICAL_QUALIFICATION_SNAPSHOT' || !dated(ledger.authority?.observedDate)) {
    errors.push('Qualification SHAs must be explicitly dated historical observations.');
  }
  const operational = ledger.operationalAuthority;
  if (operational?.repository !== 'Matthew75x/toadal-feast-web' || operational.ref !== 'staging/live-visual' ||
      operational.resolve !== 'LIVE_REF_BEFORE_CONSEQUENTIAL_OPERATIONS' || operational.sha || operational.currentSha) {
    errors.push('Operational authority must identify the repository/ref and require live resolution, without a fixed current SHA.');
  }
  const readback = operational?.latestReadback;
  if (!exactSha(readback?.sha) || !dated(readback?.observedDate) || readback?.classification !== 'DATED_READBACK_NOT_LIVE_HEAD') {
    errors.push('Operational SHA readback must be separately dated and labelled as an observation.');
  }
  const external = ledger.externalSystems?.githubPages;
  if (external?.status !== 'HISTORICAL_STAGING_OBSERVATION' || !dated(external?.observedDate) || !exactSha(external?.sha)) {
    errors.push('The preserved GitHub Pages SHA must be a dated historical observation.');
  }
  for (const priority of ledger.executionPriorities || []) {
    const pages = (priority?.manifestRows || []).map(n => ledger.pages.find(page => page.n === n));
    const qualified = pages.length && pages.every(page => page?.engineeringStatus === 'QUALIFIED' && Array.isArray(page.buildableGaps) && !page.buildableGaps.length);
    const text = `${priority.impact || ''} ${priority.doneWhen || ''}`;
    // Content/service admission may remain pending. A qualified row or surface
    // must not instead be described as absent engineering or a rebuild target.
    const absentEngineering = /\brows?\s+#?\d[^.;]*\b(?:absent|missing)\b/iu.test(text) ||
      /\b(?:absent|missing)\b[^.;]*\b(?:families|surfaces|engineering|structures)\b/iu.test(text) ||
      /\bengineering\b[^.;]*\b(?:absent|missing|rebuilt|rebuild)\b/iu.test(text) ||
      /\b(?:shell|plumbing|templates|local search).*?\bexist\b/iu.test(priority.doneWhen || '');
    const reconciledLane = [2, 3].includes(priority.rank);
    if ((qualified && absentEngineering) || (reconciledLane && (!qualified ||
        priority.engineeringStatus !== 'QUALIFIED_RETAIN_EXISTING_IMPLEMENTATION' ||
        priority.remainingWork !== 'APPROVED_CONTENT_OR_EXTERNAL_DEPENDENCIES'))) {
      errors.push(`Priority ${priority.rank} contradicts its qualified engineering rows or calls for rebuilding proven surfaces.`);
    }
  }
  const closure = ledger.latestManifestV1Closure;
  if (closure?.classification !== 'HISTORICAL_QUALIFICATION_SNAPSHOT' || !dated(closure?.observedDate)) {
    errors.push('Manifest v1 closure must remain explicitly dated historical evidence.');
  }
  if (!closure?.report || !fs.existsSync(path.join(root, closure.report))) {
    errors.push(`Required closure report missing: ${closure?.report || '(unset)'}`);
  } else if (closure.deploymentVerified) {
    const report = fs.readFileSync(path.join(root, closure.report), 'utf8');
    if (!exactSha(closure.qualifiedSha) || !exactSha(closure.qualifiedTree) ||
        !report.includes(closure.qualifiedSha) || !report.includes(closure.qualifiedTree)) {
      errors.push('Historical deployment closure does not bind the recorded qualified SHA/tree.');
    }
  }
  const qualification = closure?.qualificationReport;
  if (!qualification || !fs.existsSync(path.join(root, qualification))) {
    errors.push(`Required qualification report missing: ${qualification || '(unset)'}`);
  } else {
    const report = JSON.parse(fs.readFileSync(path.join(root, qualification), 'utf8'));
    if (report.status !== 'PASS' || report.date !== closure.observedDate ||
        JSON.stringify(report.inputFingerprint) !== JSON.stringify(closure.inputFingerprint)) {
      errors.push('Historical qualification report does not bind the recorded date/fingerprint.');
    }
  }
  return errors;
}
