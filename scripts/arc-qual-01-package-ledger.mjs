#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateRoot = path.resolve(process.argv[2] || path.join(
  repoRoot, 'studio-project/toadal-feast-website/reference/audit/arcade-standard-6daedca1'));
const runtimePath = path.resolve(process.argv[3] || path.join(repoRoot, 'docs/review/WO-003/arc-qual-01/runtime.json'));
const outputPath = path.resolve(process.argv[4] || path.join(repoRoot, 'docs/review/WO-003/arc-qual-01/package-ledger.json'));
const closurePath = path.join(repoRoot, 'docs/review/WO-003/arcade-package/source-static-closure.json');
const overlayPath = path.join(repoRoot, 'docs/review/WO-003/arcade-package/runtime-overlay-ledger.json');
const baselineInventoryPath = path.join(repoRoot, 'docs/review/WO-003/arcade-package/package-inventory.json');
const staticClassificationPath = path.join(repoRoot, 'docs/review/WO-003/continuation-20260930/WO-003_CONTINUATION_RESULT_2026-09-30.md');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(); }
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .flatMap((entry) => {
      const absolute = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : entry.isFile() ? [absolute] : [];
    });
}
function rel(absolute, root) { return path.relative(root, absolute).split(path.sep).join('/'); }
function safeRead(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }

for (const required of [candidateRoot, runtimePath, closurePath, overlayPath, baselineInventoryPath, staticClassificationPath]) {
  if (!fs.existsSync(required)) throw new Error(`Required evidence path does not exist: ${required}`);
}

const runtime = readJson(runtimePath);
const closure = readJson(closurePath);
const overlay = readJson(overlayPath);
const baseline = readJson(baselineInventoryPath);
const staticClassification = safeRead(staticClassificationPath);
const closureByPath = new Map((closure.fileLedger || []).map((file) => [file.path, file]));
const overlayByPath = new Map((overlay.fileLedger || []).map((file) => [file.path, file]));
const previousPaths = new Set((baseline.files || []).map((file) => file.path));

const requestEvidence = new Map();
const qaHarnessRequests = [];
const nonCartridgeLocalRequests = [];
function ensureEvidence(filePath) {
  if (!requestEvidence.has(filePath)) requestEvidence.set(filePath, new Map());
  return requestEvidence.get(filePath);
}
function recordNetwork(collection, phase) {
  for (const item of collection || []) {
    let url;
    try { url = new URL(item.url); } catch (_) { continue; }
    if (url.origin !== 'http://127.0.0.1:8899') continue;
    if (url.pathname.startsWith('/qa/')) {
      qaHarnessRequests.push({ phase, profile: item.profile || null, path: url.pathname, type: item.type || null, status: item.status || null, failure: item.failure || null });
      continue;
    }
    if (!url.pathname.startsWith('/cartridge/')) {
      nonCartridgeLocalRequests.push({ phase, profile: item.profile || null, path: url.pathname, type: item.type || null, status: item.status || null, failure: item.failure || null });
      continue;
    }
    const filePath = decodeURIComponent(url.pathname.slice('/cartridge/'.length));
    const byProfile = ensureEvidence(filePath);
    const profile = String(item.profile || 'unlabeled');
    const entry = byProfile.get(profile) || { requests: 0, types: [], statuses: [], failures: [] };
    entry.requests += phase === 'request' ? 1 : 0;
    if (item.type && !entry.types.includes(item.type)) entry.types.push(item.type);
    if (Number.isFinite(item.status)) entry.statuses.push(item.status);
    if (item.failure) entry.failures.push(item.failure);
    byProfile.set(profile, entry);
  }
}
recordNetwork(runtime.network?.requests, 'request');
recordNetwork(runtime.network?.responses, 'response');
recordNetwork(runtime.network?.failures, 'failure');

const candidateFiles = walk(candidateRoot).map((absolute) => {
  const filePath = rel(absolute, candidateRoot);
  const bytes = fs.readFileSync(absolute);
  const staticSource = closureByPath.get(filePath) || null;
  const runtimeOverlay = overlayByPath.get(filePath) || null;
  const profileEvidence = requestEvidence.get(filePath) || new Map();
  return {
    path: filePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    sourceStaticGitBlob: staticSource?.gitBlob || null,
    sourceStaticSha256: staticSource?.sha256 || null,
    runtimeOverlayGitBlob: runtimeOverlay?.gitBlob || null,
    runtimeOverlaySha256: runtimeOverlay?.sha256 || null,
    requestedByProfiles: [...profileEvidence.keys()].sort(),
    runtime: Object.fromEntries([...profileEvidence.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    presentInPriorInventory: previousPaths.has(filePath),
    reachabilityDisposition: profileEvidence.size ? 'runtime-observed' : 'retain-unresolved-or-unexercised; absence from this matrix does not prove unreachable'
  };
}).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

const ledgerText = candidateFiles.map((file) => `${file.path}\t${file.bytes}\t${file.sha256}`).join('\n') + '\n';
const filesByPath = new Map(candidateFiles.map((file) => [file.path, file]));
const registryRelative = 'src/runtime/modes/arcade/arcade-animation-registry.js';
const registryPath = path.join(candidateRoot, registryRelative);
const registrySource = safeRead(registryPath);
const registryMatch = registrySource.match(/const data = (\{[\s\S]*?\n  \});/);
const registryData = registryMatch ? JSON.parse(registryMatch[1]) : null;
const profileSpecs = [
  { id: 'standard-toadal', label: 'Standard / Toadal', experience: 'standard', character: 'toadal', gameplay: runtime.gameplay?.standardToadal || null },
  { id: 'standard-classic', label: 'Standard / Classic', experience: 'standard', character: 'classic', gameplay: runtime.gameplay?.standardClassic || null },
  { id: 'standard-gully', label: 'Standard / Gully', experience: 'standard', character: 'pelican', gameplay: runtime.gameplay?.standardGully || null },
  { id: 'fmf-chomper', label: 'FMF / Chomper', experience: 'fmf', character: 'chomper', gameplay: runtime.gameplay?.fmf || null },
  { id: 'zen-princess', label: 'Zen / Princess Lily', experience: 'zen', character: 'princess', gameplay: runtime.gameplay?.zen || null },
];
const checkByName = new Map((runtime.checks || []).map((check) => [check.name, check]));
const checkMap = {
  'standard-toadal': ['standard-toadal-qualified-sustained-real-play', 'standard-toadal-bot-drove-live-path', 'toadal-direct-physical-catch', 'toadal-charged-royal-hop', 'toadal-golden-throw', 'toadal-golden-block'],
  'standard-classic': ['classic-idle-movement-catch-and-assets'],
  'standard-gully': ['gully-ground-takeoff-2axis-catch-land'],
  'fmf-chomper': ['fmf-forced-character-live-score'],
  'zen-princess': ['zen-forced-character-live-score']
};
const effectiveOverrides = {
  classic: {
    source: 'src/runtime/modes/arcade/arcade-affinity-presentation.js',
    files: ['idle.png', 'idle_blink_16f_256.png', 'catch_open_10f.png'],
    note: 'These timing-authority definitions override the generated idle/blink/catch_open registry entries; exact 5-frame audited sheets are included and hashed separately.'
  },
  pelican: {
    source: 'src/runtime/rendering/draw-characters-3.js',
    files: ['flap_flight'],
    note: 'Gameplay renderer requests flap_flight continuously; ground/takeoff/landing/catch_swallow registry clips are not runtime-proven by gameplay transitions.'
  }
};

const profiles = profileSpecs.map((spec) => {
  const checks = (checkMap[spec.id] || []).map((name) => checkByName.get(name) || { name, pass: false, missing: true });
  const requests = [...requestEvidence.entries()]
    .filter(([, perProfile]) => [...perProfile.keys()].some((name) => name.startsWith(spec.id === 'standard-toadal' ? 'standard-toadal' : spec.id)))
    .map(([filePath, perProfile]) => ({ path: filePath, evidence: Object.fromEntries([...perProfile.entries()].filter(([name]) => name.startsWith(spec.id === 'standard-toadal' ? 'standard-toadal' : spec.id))) }))
    .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const registryCharacter = registryData?.characters?.[spec.character] || null;
  const override = effectiveOverrides[spec.character] || null;
  const effectiveOverrideAssets = override?.files?.map((file) => {
    const packagePath = file.includes('/') ? file : `${registryCharacter?.basePath || ''}${file}`;
    return {
      file,
      packagePath,
      present: filesByPath.has(packagePath),
      requestedInProfile: requests.some((request) => request.path === packagePath)
    };
  }) || null;
  const registeredAssets = Object.entries(registryCharacter?.clips || {}).map(([clipId, clip]) => ({
    clipId,
    file: clip.file || null,
    packagePath: clip.file ? `${registryCharacter.basePath || ''}${clip.file}` : null,
    present: clip.file ? filesByPath.has(`${registryCharacter.basePath || ''}${clip.file}`) : false,
    requestedInProfile: clip.file ? requests.some((request) => request.path === `${registryCharacter.basePath || ''}${clip.file}`) : false
  }));
  const allChecksPass = checks.length > 0 && checks.every((check) => check.pass === true);
  return {
    id: spec.id,
    label: spec.label,
    experience: spec.experience,
    runtimeCharacterId: spec.character,
    status: spec.gameplay ? (allChecksPass ? 'profile-checks-pass' : 'profile-hold') : 'not-run',
    checks,
    runtimeOutcome: spec.gameplay,
    animationRegistry: {
      sourceFile: registryRelative,
      sourceSha256: filesByPath.get(registryRelative)?.sha256 || null,
      characterBasePath: registryCharacter?.basePath || null,
      registeredAssets,
      effectiveRuntimeOverrides: override ? { ...override, assets: effectiveOverrideAssets } : null
    },
    requestedCandidateFiles: requests,
    reachabilityRule: 'A runtime request proves reachability for the recorded scenario only. An unrequested registered, dynamic, or template-resolved file remains unresolved, not proven unreachable.'
  };
});

const unresolvedByClass = {
  directoryReferences: 21,
  distinctDirectoryTargets: 20,
  templateExpressions: 6,
  wildcardPatterns: 1,
  unresolvedFixedFileLiterals: 73,
  total: 101
};
const addedSincePreviousInventory = candidateFiles.filter((file) => !file.presentInPriorInventory);
const output = {
  schema: 'toadal-feast.arc-qual-01.package-ledger.v1',
  candidate: {
    path: rel(candidateRoot, repoRoot),
    sourceEntry: 'arcade-standalone.html',
    sourceEntrySha256: filesByPath.get('arcade-standalone.html')?.sha256 || null,
    packageBytes: candidateFiles.reduce((sum, file) => sum + file.bytes, 0),
    packageFiles: candidateFiles.length,
    sortedPathSizeSha256LedgerSha256: sha256(Buffer.from(ledgerText, 'utf8')),
    files: candidateFiles
  },
  qualificationRun: {
    reportPath: rel(runtimePath, repoRoot),
    status: runtime.status || (runtime.failures?.length ? 'BLOCKED' : 'UNKNOWN'),
    browser: runtime.browser || null,
    checks: runtime.checks || [],
    profiles: runtime.profiles || [],
    network: {
      failedRequests: runtime.network?.failures || [],
      badResponses: (runtime.network?.responses || []).filter((response) => response.status >= 400),
      externalRequests: runtime.network?.externalRequests || [],
      pageErrors: runtime.network?.pageErrors || [],
      decodeErrors: runtime.network?.decodeErrors || [],
      qaHarnessRequests: qaHarnessRequests.filter((entry) => entry.phase === 'request'),
      nonCartridgeLocalRequests
    }
  },
  profileReachability: profiles,
  staticAndDynamicReferenceClassification: {
    sourceReportPath: rel(closurePath, repoRoot),
    sourceReportSha256: sha256(fs.readFileSync(closurePath)),
    donorCommit: closure.sourceCommit,
    donorTree: closure.sourceTree,
    staticClosureFiles: closure.files,
    unresolvedReferenceClassification: unresolvedByClass,
    classificationEvidencePath: rel(staticClassificationPath, repoRoot),
    classificationEvidenceSha256: sha256(Buffer.from(staticClassification, 'utf8')),
    knownConditionallyReferencedMissingDonorFiles: [
      'assets/images/tongue-rig/golden_shaft.png',
      'assets/images/tongue-rig/golden_stages.png',
      'assets/images/tongue-rig/golden_tip.png'
    ],
    expansionPolicy: 'Directory, template, wildcard, animation-registry, and dynamic URL references are retained unless a complete profile/state expansion proves they unreachable. The current bounded runtime matrix is not such a proof.'
  },
  priorInventoryComparison: {
    sourceInventoryPath: rel(baselineInventoryPath, repoRoot),
    priorInventoryFiles: baseline.inventory?.files || (baseline.files || []).length,
    addedSincePriorInventory,
    removedSincePriorInventory: (baseline.files || []).filter((previous) => !filesByPath.has(previous.path)).map((file) => file.path)
  },
  pruning: {
    removedFiles: [],
    provenUnreachableFiles: [],
    decision: 'No files were pruned. No file is classified as proven unreachable solely because it was not requested in a bounded run.'
  },
  qaDriver: runtime.externalQaDriver || null,
  websiteIntegration: 'not performed; this report covers the isolated candidate only'
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  output: outputPath,
  candidateFiles: output.candidate.packageFiles,
  candidateBytes: output.candidate.packageBytes,
  ledgerSha256: output.candidate.sortedPathSizeSha256LedgerSha256,
  addedSincePreviousInventory: addedSincePreviousInventory.map((file) => ({ path: file.path, sha256: file.sha256 })),
  runtimeStatus: output.qualificationRun.status,
  profileStatuses: profiles.map((profile) => ({ id: profile.id, status: profile.status }))
}, null, 2));
