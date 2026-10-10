import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { siteFingerprint } from '../../../scripts/fingerprint-site-inputs.mjs';
import { currentRouteQualificationErrors, CURRENT_ROUTE_QUALIFICATION } from '../../../scripts/lib/current-route-qualification.mjs';
import { verifyProtectedGameArtifacts } from '../../../scripts/lib/protected-game-artifacts.mjs';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidenceDir, '../../..');
const renderer = path.resolve(root, '..', 'studio-render-frozen');
const exportRoot = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(exportRoot, 'player', 'claw-feed-gulper', 'index.html'))) {
  throw new Error('Pass the latest isolated native Studio export directory, containing player/claw-feed-gulper/index.html.');
}
const rel = file => path.relative(root, file).replaceAll(path.sep, '/');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
const pageProject = path.join(root, 'studio-project', 'toadal-feast-website');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'manifests', 'manifest-compliance-ledger.json'), 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(pageProject, 'pages', 'index.json'), 'utf8'));
const routeRecord = index.pages.find(page => page.route === '/player/claw-feed-gulper/');
if (!routeRecord) throw new Error('Gulper player route is not registered.');
const sourceRoute = path.join(pageProject, routeRecord.file);
const nativeRoute = path.join(exportRoot, 'player', 'claw-feed-gulper', 'index.html');
const distRoute = path.join(root, 'dist', 'player', 'claw-feed-gulper', 'index.html');
const archivedRoute = path.join(evidenceDir, 'studio-export-player-route.html');
if (sha256(nativeRoute) !== sha256(distRoute)) throw new Error('Native Studio route output differs from the browser-preview dist route.');
if (sha256(archivedRoute) !== sha256(nativeRoute)) throw new Error('Archived Studio route evidence differs from the native export.');
const browserPath = path.join(evidenceDir, 'browser-qa.json');
const browser = JSON.parse(fs.readFileSync(browserPath, 'utf8'));
if (browser.status !== 'PASS') throw new Error('Desktop/mobile browser evidence is not passing.');
const policyPath = path.join(root, 'manifests', 'staging-game-preservation-policy.json');
const renderEvidencePath = path.join(evidenceDir, 'native-render-evidence.json');
if (!fs.existsSync(renderEvidencePath)) throw new Error('Run the current renderer and record native-render-evidence.json before recording route qualification.');
const renderEvidence = JSON.parse(fs.readFileSync(renderEvidencePath, 'utf8'));
const currentFingerprint = siteFingerprint(root);
const nativeSourceBefore = renderEvidence.fingerprints?.before?.source;
const nativeDistBefore = renderEvidence.fingerprints?.before?.dist;
const sourceAfter = renderEvidence.fingerprints?.after?.source;
const distAfter = renderEvidence.fingerprints?.after?.dist;
if (renderEvidence.status !== 'PASS' || renderEvidence.renderer?.exitCode !== 0 ||
    renderEvidence.renderer?.synchronizedDist !== true || renderEvidence.renderer?.websiteRoutes !== index.pages.length ||
    JSON.stringify(sourceAfter) !== JSON.stringify(nativeSourceBefore) ||
    JSON.stringify(currentFingerprint.source) !== JSON.stringify(sourceAfter) ||
    JSON.stringify(currentFingerprint.dist) !== JSON.stringify(distAfter) ||
    renderEvidence.route?.htmlSha256 !== sha256(nativeRoute) ||
    renderEvidence.route?.distHtmlSha256 !== sha256(distRoute)) {
  throw new Error('The native Studio render proof is stale, incomplete, or does not match the current source/dist. Re-render and rerun browser QA before recording evidence.');
}
const protectedGames = verifyProtectedGameArtifacts(exportRoot, pageProject);
if (!protectedGames.valid) throw new Error('Protected game bytes differ between Studio source and native export.');

const studioEvidence = {
  schema: 'toadal-feast.gulper-player-route-studio-export-evidence.v1',
  status: 'PASS',
  nativeStudioExport: {
    status: 'PASS',
    sourceCommit: git(root, 'rev-parse', 'HEAD'),
    sourceTree: git(root, 'rev-parse', 'HEAD^{tree}'),
    sourceFingerprintBefore: { source: nativeSourceBefore, dist: nativeDistBefore },
    sourceFingerprintAfter: { source: sourceAfter, dist: distAfter },
    sourceUnchanged: true,
    nativeRenderEvidencePath: rel(renderEvidencePath),
    nativeRenderEvidenceSha256: sha256(renderEvidencePath),
    rendererCommit: git(renderer, 'rev-parse', 'HEAD'),
    rendererTree: git(renderer, 'rev-parse', 'HEAD^{tree}'),
    validationValid: true,
    routeRecords: index.pages.length,
    routeHtmlPath: rel(nativeRoute),
    routeHtmlSha256: sha256(nativeRoute),
    routeHtmlMatchesDistAndArchive: true,
    protectedGameArtifactsValid: true,
    protectedGameArtifactCount: protectedGames.files.length,
  },
  checks: [
    { name: 'Pinned Studio provenance and public projection', status: 'PASS' },
    { name: 'Studio project validation and native static export', status: 'PASS' },
    { name: '34-route owner preview render freshness', status: 'PASS', registeredRoutes: index.pages.length },
    { name: 'Base-path and static-link checks', status: 'PASS' },
    { name: 'Protected cartridge source/export byte comparison', status: 'PASS', files: protectedGames.files.length },
    { name: 'Studio source stable across native export', status: 'PASS' },
    { name: 'Synchronized dist and native route match the render', status: 'PASS' },
  ],
  publicationGate: {
    status: 'BLOCKED',
    gate: 'verifyExportGamePins',
    policyPath: rel(policyPath),
    policySha256: sha256(policyPath),
    reason: 'Unknown or missing protected game payload; new admission is held',
    scope: 'The local website candidate is exported and browser-qualified; the staging publication artifact remains held because the committed legacy policy does not admit the Gulper cartridge.',
  },
};
const studioPath = path.join(evidenceDir, 'studio-export-evidence.json');
fs.writeFileSync(studioPath, JSON.stringify(studioEvidence, null, 2) + '\n');

const qualification = {
  schema: 'toadal-feast.gulper-player-route-qualification.v1',
  status: 'PASS',
  classification: 'LOCAL_CANDIDATE_ENGINEERING_QUALIFICATION',
  observedDate: '2026-10-10',
  sourceIdentity: {
    repository: 'Matthew75x/toadal-feast-web',
    branch: git(root, 'rev-parse', '--abbrev-ref', 'HEAD'),
    baseCommit: git(root, 'rev-parse', 'HEAD'),
    baseTree: git(root, 'rev-parse', 'HEAD^{tree}'),
    worktreeState: 'DIRTY_LOCAL_TAKEOVER_CANDIDATE',
  },
  historicalSnapshot: {
    observedDate: ledger.latestManifestV1Closure.observedDate,
    qualifiedSha: ledger.latestManifestV1Closure.qualifiedSha,
    qualifiedTree: ledger.latestManifestV1Closure.qualifiedTree,
    routeRecords: ledger.latestManifestV1Closure.routeRecords,
  },
  candidate: {
    routeRecords: index.pages.length,
    priorRouteRecords: ledger.latestManifestV1Closure.routeRecords,
    addedRoute: '/player/claw-feed-gulper/',
    inputFingerprint: siteFingerprint(root),
  },
  route: {
    id: routeRecord.id,
    route: routeRecord.route,
    file: routeRecord.file,
    title: routeRecord.title,
    purpose: 'Isolated, noindex browser preview for the registered CLAW: Feed Gulper cartridge.',
    publicationState: 'noindex',
    studioGenerated: true,
    referenceFile: 'player/claw-feed-gulper/index.html',
    sourceSha256: sha256(sourceRoute),
    exportedHtmlSha256: sha256(nativeRoute),
  },
  navigation: {
    playToGameDetails: '/games/claw-feed-gulper/',
    detailsToPlayer: '/player/claw-feed-gulper/',
    playerBackToDetails: '/games/claw-feed-gulper/',
    studioRouteExported: true,
  },
  studioExport: {
    status: 'PASS',
    rendererCommit: studioEvidence.nativeStudioExport.rendererCommit,
    receiptPath: rel(studioPath),
    receiptSha256: sha256(studioPath),
  },
  browserEvidence: {
    status: 'PASS',
    path: rel(browserPath),
    sha256: sha256(browserPath),
  },
  acceptance: {
    engineering: 'VERIFIED',
    ownerAcceptance: 'AWAITING_OWNER_ACCEPTANCE',
    releaseAuthorized: false,
  },
};
const qualificationPath = path.join(root, CURRENT_ROUTE_QUALIFICATION);
fs.writeFileSync(qualificationPath, JSON.stringify(qualification, null, 2) + '\n');
const errors = currentRouteQualificationErrors(root, ledger, index);
if (errors.length) throw new Error('Candidate qualification failed its own verifier:\n- ' + errors.join('\n- '));
console.log(JSON.stringify({
  status: 'PASS',
  qualification: rel(qualificationPath),
  qualificationSha256: sha256(qualificationPath),
  studioEvidence: rel(studioPath),
  studioEvidenceSha256: sha256(studioPath),
  routeSourceSha256: sha256(sourceRoute),
  studioAndDistRouteSha256: sha256(nativeRoute),
  sourceFingerprint: sourceAfter,
  distFingerprint: distAfter,
  routeRecords: index.pages.length,
  protectedGameArtifacts: protectedGames.files.length,
  publicationGate: studioEvidence.publicationGate,
}, null, 2));
