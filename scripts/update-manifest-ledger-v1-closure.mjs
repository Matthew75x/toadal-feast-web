import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { siteFingerprint } from './fingerprint-site-inputs.mjs';
import { closureReportPath } from './lib/manifest-compliance-contract.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
function option(name) { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; }
const qualifiedSha = option('--qualified-sha');
const deployedSha = option('--deployed-sha');
const evidenceDir = 'docs/review/manifest-audit-remediation-20261002';
const ledgerPath = path.join(root, 'manifests/manifest-compliance-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const pages = JSON.parse(fs.readFileSync('studio-project/toadal-feast-website/pages/index.json', 'utf8')).pages;
const git = (...params) => execFileSync('git', params, { encoding: 'utf8' }).trim();
const branch = git('branch', '--show-current');
if (branch !== 'work/manifest-complete-v1-20261002') throw new Error('Refusing ledger reconciliation on wrong branch');
const staging = git('ls-remote', 'origin', 'refs/heads/staging/live-visual').split(/\s+/)[0];
const fingerprint = siteFingerprint(root);
let qualification = null;
if (qualifiedSha) {
  if (!/^[a-f0-9]{40}$/.test(qualifiedSha)) throw new Error('Exact qualified commit required');
  git('cat-file', '-e', qualifiedSha + '^{commit}');
  // A later documentation-only evidence commit is allowed; implementation cannot drift.
  git('diff', '--exit-code', qualifiedSha, '--', 'studio-project', 'dist', 'scripts',
    'docs/content/content-registry.schema.json', 'docs/implementation/progression-state.schema.json',
    'manifests/visual-asset-authority-lock.json');
  const report = file => JSON.parse(fs.readFileSync(path.join(root, evidenceDir, file), 'utf8'));
  const owner = report('gate/owner-preview-gate.json').summary;
  const manifest = report('manifest-gate/final-manifest-closure-gate.json').summary;
  qualification = report('qualification-summary.json');
  const runtime = report('runtime-browser-witnesses.json');
  for (const gate of [owner, manifest]) {
    if (gate.status !== 'PASS' || !gate.inputsUnchangedDuringGate ||
        JSON.stringify(gate.inputFingerprint) !== JSON.stringify(fingerprint)) throw new Error('Stale or failing gate evidence');
  }
  if (qualification.status !== 'PASS' || qualification.nodeTests.failed !== 0 ||
      runtime.status !== 'PASS' || JSON.stringify(runtime.inputFingerprint) !== JSON.stringify(fingerprint)) {
    throw new Error('Runtime/qualification evidence is not green for these exact bytes');
  }
}
if (deployedSha && (deployedSha !== qualifiedSha || staging !== deployedSha)) throw new Error('Deployment identity does not match exact qualified commit');
const qualified = Boolean(qualifiedSha);
const phase = deployedSha ? 'STAGING_VERIFIED' : qualified ? 'QUALIFIED' : 'QUALIFICATION_PENDING';
const reportPath = qualified ? closureReportPath(root, evidenceDir, Boolean(deployedSha)) : null;
const rows = [
 ['KEEP / POLISH','Existing Home composition, games/Pass/discovery/App hierarchy and companion preserved; no redesign.','Owner Home LOCK_VISUAL acceptance remains pending.'],
 ['KEEP / INTEGRATE','Existing catalog/filtering, truthful preview states, challenges/rewards/leaderboard links and App path.','Additional game availability requires qualification.'],
 ['KEEP / INTEGRATE','Genuine Wicked Bites media/mechanics; current launch and progression/related paths.','Approved additional trailer/character/reward content may publish later.'],
 ['INTEGRATE / FIX','Explicit sibling HUD association; validated current score/session time, pause/error/exit lifecycle and completed local score persistence.','No cartridge XP/challenge/achievement telemetry is invented.'],
 ['KEEP / POLISH','Existing approved World art/registry, locked locations, site discoveries and App path.','Approved location lore/map details await publication.'],
 ['INTEGRATE / POLISH','Seven approved character artwork discoveries save idempotently in the existing discoveries key; filters and unpublished canon slots preserved.','Relationships/appearance canon remains unpublished.'],
 ['KEEP / POLISH','Biography/personality/history/abilities/friends/locations/games/stories/gallery/collectible structures with truthful canon states.','Additional approved canon remains unpublished.'],
 ['KEEP / POLISH','Featured/latest/progress/comics/manga/short/lore/BTS publishing structures preserved.','Approved published story content required.'],
 ['KEEP / PLACEHOLDER','Reusable series cover/synopsis/chapters/characters/progress/world/media structure, fail-closed publishing.','Approved series/chapter content required.'],
 ['KEEP / INTEGRATE','Existing reader navigation/thumbnails/fullscreen/bookmark/progress/story-info code and graceful unpublished shell.','Approved published page manifests required.'],
 ['KEEP / POLISH','Genuine stills/art plus truthful trailer/video/short/wallpaper/download/press availability slots.','Approved video/download/press content required.'],
 ['BUILD THIN / POLISH','Featured/latest/filter/trending structures; only valid published editorial, no invented activity metrics.','Approved news and verified trending data required.'],
 ['BUILD THIN / INTEGRATE','Allowlisted article body/media/quote/related links/neighbor navigation and Roadmap handoff.','Approved published articles/quotes required.'],
 ['KEEP / INTEGRATE','Current four-key schema, level/XP/Sparks/Treats/streak/daily/milestones/discoveries and optional account boundary.','Connected sync remains inactive.'],
 ['KEEP / FIX','Configured daily/exploration activities and five quest categories; runtime links honor Pages base path.','Weekly/game/story goals require supported configured activities.'],
 ['KEEP / POLISH','Local reward track/badges/titles/collection and locked/unlocked milestones; no paid/mobile entitlements.','Additional approved reward catalog required.'],
 ['KEEP / FIX','Validated completed local runs, preserved all-time best beyond 50-run history, safe local table and personal-best state.','Froggy connected/global service and unsupported mode/ruleset fields remain future.'],
 ['INTEGRATE / POLISH','Hash-verified genuine App icon, three genuine gameplay captures, all four modes and canonical Infinite copy; web/App distinction retained.','Approved trailer/Infinite capture and official store destinations remain unavailable.'],
 ['KEEP / PLACEHOLDER','Guest status, account benefits/privacy and guest continuation; real signup/login intentionally unavailable.','Configured Froggy identity/cloud endpoint required.'],
 ['INTEGRATE / POLISH','Non-identifying guest avatar, selected title, scores, route/Treat and character artwork views, local badges/showcase, tab-only appearance controls.','Connected/game achievements/history require actual service/data.'],
 ['PLACEHOLDER / POLISH','Creator/fan-art/event/feed/guidelines/feedback structures; no fabricated public community activity.','Approved guidelines/content and posting/moderation service required.'],
 ['PLACEHOLDER / POLISH','Merch/digital/categories and real News/Roadmap update CTAs; no fake signup/cart/prices/checkout.','Approved catalog and real commerce service required.'],
 ['KEEP','Existing local grouped search, filters/suggestions/empty states preserved and current index regenerated.','No external activation required for local search.'],
 ['BUILD THIN / INTEGRATE','Four status groups plus related published-devlog links or explicit publication empty state; no invented dates.','Approved devlogs required to populate related links.'],
 ['KEEP / POLISH','Existing local help search/categories/popular FAQs/contact/status paths.','Ticket/contact endpoint requires configuration.'],
 ['KEEP / PLACEHOLDER','Complete contact field/routing structure and truthful disabled non-submitting behavior.','Verified endpoint/mailboxes required.'],
 ['PLACEHOLDER / POLISH','Mission/flagship/experiments/stories/characters/philosophy/press/business structures without invented studio statements.','Approved mission/philosophy/business copy and contact required.'],
 ['KEEP','Branded contextual construction destination, useful available routes and updates; no false dates.','External capabilities remain honestly unavailable.'],
 ['PLACEHOLDER / POLISH','Privacy/Terms readable template/TOC/related/contact and undated last-updated slot.','Approved policy text, publication dates and legal contact required.'],
 ['KEEP','Actual branded HTTP404, Home/Play/Search/Stories recovery and current assets.','No buildable gap.']
];
if (rows.length !== 30 || ledger.pages.length !== 30) throw new Error('Manifest denominator changed');
ledger.date = '2026-10-02';
ledger.authority = {
  classification: 'HISTORICAL_QUALIFICATION_SNAPSHOT',
  observedDate: new Date().toISOString().slice(0, 10),
  main: git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0],
  liveStaging: staging, currentReviewBranch: branch,
  currentReviewCandidate: qualifiedSha || 'UNCOMMITTED_REMEDIATION_WORKTREE',
  qualifiedTree: qualifiedSha ? git('rev-parse', qualifiedSha + '^{tree}') : null,
  approvedHomeSha256: '4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608',
  remediationBase: '60c4d8bee7edd818fcc794e3f87232058585b9d8',
  frozenRelease: '6e543f2abebe66ef46ca6ecaa6da20e3196a5c43',
  previousLedger: '60c4d8bee7edd818fcc794e3f87232058585b9d8:manifests/manifest-compliance-ledger.json'
};
ledger.operationalAuthority = {
  repository: 'Matthew75x/toadal-feast-web', ref: 'staging/live-visual',
  resolve: 'LIVE_REF_BEFORE_CONSEQUENTIAL_OPERATIONS',
  latestReadback: { sha: staging, observedDate: new Date().toISOString().slice(0, 10), classification: 'DATED_READBACK_NOT_LIVE_HEAD' }
};
for (const page of ledger.pages) {
  const [action, evidence, gap] = rows[page.n - 1];
  page.status = page.n === 1 ? 'PARTIAL' : qualified ? 'DONE_PROVEN' : 'PARTIAL_CANDIDATE';
  page.delivery = deployedSha ? 'LIVE_STAGING' : 'REMEDIATION_CANDIDATE';
  page.evidence = evidence + (qualified ? ' Qualified evidence: ' + evidenceDir + '.' : ' Final integrated qualification pending.');
  page.remainingGap = gap;
  page.buildableGaps = [];
  page.engineeringStatus = qualified ? 'QUALIFIED' : 'IMPLEMENTED_AWAITING_QUALIFICATION';
  page.manifestV1Action = action;
  page.manifestV1Evidence = page.evidence;
}
ledger.pageStatusCounts = {};
for (const page of ledger.pages) ledger.pageStatusCounts[page.status] = (ledger.pageStatusCounts[page.status] || 0) + 1;
for (const item of ledger.crossCutting) {
  if (item.requirement === 'Final Home LOCK_VISUAL acceptance' || item.requirement === 'Website feels like entering the Feast World') {
    item.status = 'OWNER_REVIEW_PENDING';
    item.evidence = 'Current owner-preview composition preserved; no LOCK_VISUAL acceptance or redesign claimed.';
  } else if (item.requirement === 'Environmental motion / ambience') {
    item.status = 'CONDITIONAL_SALVAGE_NOT_ACTIVATED';
    item.evidence = 'Scenic composition and reduced-motion-safe existing interactions retained. Extra parallax is conditional on adding delight without clutter under LOCKED_PRODUCT_DECISIONS; not added during bug remediation.';
  } else if (item.requirement === 'Mobile fast-Play / bottom-navigation concept') {
    item.status = 'CURRENT_NAVIGATION_PRESERVED';
    item.evidence = 'Current mobile drawer and direct Play entry retained; extra bottom navigation is conditional (if useful), not a required replacement.';
  } else {
    item.status = qualified ? 'DONE_PROVEN' : 'QUALIFICATION_PENDING';
    item.evidence = 'Current implementation qualified by manifest/owner gates and runtime witnesses in ' + evidenceDir + '; unavailable services/content stay truthful.' +
      (item.requirement === 'Sound/settings/search utilities' ? ' Local Search, existing player sound requests, and tab-only Profile CSS-animation preference; no site-audio service invented.' : '');
  }
}
delete ledger.integration;
delete ledger.gatedEcosystem;
ledger.historicalEvidence = {
  immutableLedger: ledger.authority.previousLedger,
  note: 'Earlier integrated/gated/deployment snapshots remain recoverable from this Git object and are not current status.'
};
ledger.latestManifestV1Closure = {
  status: qualified ? 'MANIFEST V1 ENGINEERING COMPLETE — ONLY EXTERNAL ACTIVATION/CONTENT DEPENDENCIES REMAIN' : 'QUALIFICATION PENDING — NOT COMPLETE',
  phase, report: reportPath, qualificationReport: evidenceDir + '/qualification-summary.json', branch,
  classification: 'HISTORICAL_QUALIFICATION_SNAPSHOT', observedDate: qualification?.date || ledger.date,
  qualifiedSha: qualifiedSha || null, qualifiedTree: ledger.authority.qualifiedTree,
  routeRecords: pages.length, originalManifestFamilies: 30,
  inputFingerprint: fingerprint,
  nodeTests: qualification?.nodeTests || null,
  stagingSha: staging, deploymentVerified: Boolean(deployedSha),
  homeLockVisual: 'OWNER REVIEW PENDING; NOT CLAIMED',
  rollback: '688e1c471fdc97207c5ebfeaa0ef313ab9c44e52',
  historicalRollback: 'd6be86a9762370b66e79c1d5a36ab8066e421496'
};
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ phase, status: ledger.latestManifestV1Closure.status, counts: ledger.pageStatusCounts, qualifiedSha, staging }, null, 2));
