import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { siteFingerprint } from '../fingerprint-site-inputs.mjs';

export const CURRENT_ROUTE_QUALIFICATION = 'docs/review/gulper-player-route-qualification-20261010/route-qualification.json';

const exactSha = value => /^[a-f0-9]{40}$/u.test(value || '');
const exactSha256 = value => /^[a-f0-9]{64}$/u.test(value || '');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function currentRouteQualificationErrors(root, ledger, pageIndex) {
  const errors = [];
  const historical = ledger.latestManifestV1Closure;
  if (historical?.classification !== 'HISTORICAL_QUALIFICATION_SNAPSHOT' || historical.observedDate !== '2026-10-02' ||
      historical.qualifiedSha !== '485e5cee7fd9e8d74bde017e99a861ff7da3a2c6' ||
      historical.qualifiedTree !== '1876ed5c4e51c8d99fb0563954d804b49436799a' || historical.routeRecords !== 33) {
    errors.push('The October 2 manifest v1 qualification must remain the original 33-route historical snapshot.');
  }

  const reportPath = path.join(root, CURRENT_ROUTE_QUALIFICATION);
  if (!fs.existsSync(reportPath)) {
    errors.push(`Current candidate route qualification is missing: ${CURRENT_ROUTE_QUALIFICATION}`);
    return errors;
  }

  let report;
  try { report = JSON.parse(fs.readFileSync(reportPath, 'utf8')); }
  catch { errors.push('Current candidate route qualification is not valid JSON.'); return errors; }
  if (report.schema !== 'toadal-feast.gulper-player-route-qualification.v1' || report.status !== 'PASS' ||
      report.classification !== 'LOCAL_CANDIDATE_ENGINEERING_QUALIFICATION' || report.observedDate !== '2026-10-10') {
    errors.push('Current candidate route qualification must be a dated, passing local engineering record.');
  }
  if (report.historicalSnapshot?.observedDate !== historical?.observedDate ||
      report.historicalSnapshot?.qualifiedSha !== historical?.qualifiedSha ||
      report.historicalSnapshot?.qualifiedTree !== historical?.qualifiedTree ||
      report.historicalSnapshot?.routeRecords !== historical?.routeRecords) {
    errors.push('Current candidate route qualification does not preserve and cite the exact October 2 snapshot.');
  }

  const routeCount = (pageIndex.pages || []).length;
  if (report.candidate?.routeRecords !== routeCount || report.candidate?.routeRecords !== 34 ||
      report.candidate?.addedRoute !== '/player/claw-feed-gulper/') {
    errors.push(`Current candidate route qualification does not account for the registered 34-route index and its added Gulper player route.`);
  }

  try {
    const current = siteFingerprint(root);
    if (JSON.stringify(report.candidate?.inputFingerprint) !== JSON.stringify(current)) {
      errors.push('Current candidate route qualification is stale against the website source or rendered dist.');
    }
  } catch (error) { errors.push(`Could not verify candidate source fingerprint: ${error.message}`); }

  const route = report.route || {};
  const routeRecord = (pageIndex.pages || []).find(page => page.route === '/player/claw-feed-gulper/');
  const routeSourcePath = path.join(root, 'studio-project', 'toadal-feast-website', routeRecord?.file || '');
  const routeHtmlPath = path.join(root, 'dist', 'player', 'claw-feed-gulper', 'index.html');
  if (!routeRecord || route.id !== routeRecord.id || route.file !== routeRecord.file || route.title !== routeRecord.title ||
      route.route !== routeRecord.route || route.purpose !== 'Isolated, noindex browser preview for the registered CLAW: Feed Gulper cartridge.') {
    errors.push('Candidate evidence does not identify the actual Gulper player route and its preview purpose.');
  }
  if (!fs.existsSync(routeSourcePath) || !exactSha256(route.sourceSha256) || sha256(routeSourcePath) !== route.sourceSha256) {
    errors.push('Candidate evidence does not bind the Studio-authored Gulper player page bytes.');
  }
  if (!fs.existsSync(routeHtmlPath) || !exactSha256(route.exportedHtmlSha256) || sha256(routeHtmlPath) !== route.exportedHtmlSha256) {
    errors.push('Candidate evidence does not bind the exported Gulper player route bytes.');
  }
  if (route.publicationState !== 'noindex' || route.studioGenerated !== true ||
      route.referenceFile !== 'player/claw-feed-gulper/index.html') {
    errors.push('Gulper player route must remain a Studio-generated noindex preview backed by its protected player reference.');
  }

  const navigation = report.navigation || {};
  if (navigation.playToGameDetails !== '/games/claw-feed-gulper/' ||
      navigation.detailsToPlayer !== '/player/claw-feed-gulper/' ||
      navigation.playerBackToDetails !== '/games/claw-feed-gulper/' || navigation.studioRouteExported !== true) {
    errors.push('Candidate route navigation or Studio export evidence is incomplete.');
  }

  const exportEvidence = report.studioExport || {};
  const receiptPath = path.join(root, exportEvidence.receiptPath || '');
  if (exportEvidence.status !== 'PASS' || !exactSha(exportEvidence.rendererCommit) ||
      !exactSha256(exportEvidence.receiptSha256) || !fs.existsSync(receiptPath) ||
      sha256(receiptPath) !== exportEvidence.receiptSha256) {
    errors.push('Pinned Studio export receipt is missing, invalid, or not bound by its recorded hash.');
  } else {
    try {
      const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      if (receipt.schema !== 'toadal-feast.gulper-player-route-studio-export-evidence.v1' ||
          receipt.status !== 'PASS' || receipt.nativeStudioExport?.status !== 'PASS' ||
          receipt.nativeStudioExport?.validationValid !== true || receipt.nativeStudioExport?.sourceUnchanged !== true ||
          receipt.nativeStudioExport?.routeHtmlSha256 !== route.exportedHtmlSha256 ||
          !receipt.checks?.length || receipt.checks.some(check => check.status !== 'PASS') ||
          receipt.publicationGate?.status !== 'BLOCKED' ||
          !/Unknown or missing protected game payload; new admission is held/iu.test(receipt.publicationGate?.reason || '')) {
        errors.push('Pinned Studio export evidence must prove route generation and static checks while recording the unchanged game-admission publication gate.');
      }
    } catch { errors.push('Pinned Studio export receipt is not valid JSON.'); }
  }

  const browserEvidence = report.browserEvidence || {};
  const browserPath = path.join(root, browserEvidence.path || '');
  if (browserEvidence.status !== 'PASS' || !exactSha256(browserEvidence.sha256) || !fs.existsSync(browserPath) ||
      sha256(browserPath) !== browserEvidence.sha256) {
    errors.push('Desktop/mobile browser evidence is missing, invalid, or not bound by its recorded hash.');
  } else {
    try {
      const browser = JSON.parse(fs.readFileSync(browserPath, 'utf8'));
      if (browser.status !== 'PASS' || browser.checks?.desktop !== 'PASS' || browser.checks?.mobile !== 'PASS' ||
          browser.checks?.navigation !== 'PASS' || browser.checks?.crownAbsence !== 'PASS' ||
          browser.checks?.canonicalCharacterArtwork !== 'PASS' || browser.checks?.buildIdentity !== 'PASS' ||
          !Array.isArray(browser.screenshots) || browser.screenshots.length < 2) {
        errors.push('Desktop/mobile browser evidence does not prove the required route, crown, and screenshot checks.');
      }
      for (const image of browser.screenshots || []) {
        const imagePath = path.join(root, image.path || '');
        if (!image.path || !exactSha256(image.sha256) || !fs.existsSync(imagePath) || sha256(imagePath) !== image.sha256) {
          errors.push(`Browser screenshot hash is missing or mismatched: ${image.path || '(unset)'}`);
        }
      }
    } catch { errors.push('Desktop/mobile browser evidence is not valid JSON.'); }
  }
  return errors;
}
