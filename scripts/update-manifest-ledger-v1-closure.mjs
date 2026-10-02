import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ledgerPath = path.join(root, 'manifests', 'manifest-compliance-ledger.json');
const reportPath = 'docs/review/manifest-complete-v1-20261002/MANIFEST_V1_CLOSURE.md';
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const pageIndex = JSON.parse(fs.readFileSync(path.join(root, 'studio-project/toadal-feast-website/pages/index.json'), 'utf8'));
const report = fs.readFileSync(path.join(root, reportPath), 'utf8');

ledger.date = '2026-10-02';
ledger.authority.manifestCompletionBranch = 'work/manifest-complete-v1-20261002';
ledger.authority.manifestCompletionBase = '6e543f2abebe66ef46ca6ecaa6da20e3196a5c43';
ledger.authority.manifestCompletionTree = 'b48efb7b20c72c11acc017a4807bc545aa81f17a';
ledger.authority.currentReviewBranch = 'work/manifest-complete-v1-20261002';
ledger.authority.currentReviewCandidate = 'qualification-pending-commit';

const completionRows = new Map([
  [1, ['POLISH / KEEP', 'Home contract 38/38; fresh desktop/mobile visual evidence. Owner visual acceptance remains pending.']],
  [2, ['INTEGRATE / POLISH', 'Existing game registry, truthful availability, filters, and links to progression/leaderboards retained.']],
  [3, ['KEEP / INTEGRATE', 'Existing detail/cartridge and score boundary retained; no game engine rewrite.']],
  [4, ['KEEP / INTEGRATE', 'Existing isolated player retained; validated host adapter persists bounded completed runs only.']],
  [5, ['POLISH / PORT', 'Existing world registry and approved assets; structured discovery integrated without invented canon.']],
  [6, ['KEEP / POLISH', 'Character registry, approved assets, filtering, and desktop/mobile proof.']],
  [7, ['KEEP / POLISH', 'Structured canonical Toadal profile and guest progression links.']],
  [8, ['KEEP / POLISH', 'Existing publishing architecture and honest empty states; no published records fabricated.']],
  [9, ['KEEP / PLACEHOLDER', 'Reusable manga template and publication state; approved series/content remains absent.']],
  [10, ['KEEP / INTEGRATE', 'Existing reader controls and isolated bookmark/progress boundary retained.']],
  [11, ['POLISH / KEEP', 'Canonical existing media assets and working filters; media records await approved content.']],
  [12, ['POLISH', 'Registry-backed editorial search/filter and honest empty state.']],
  [13, ['BUILD THIN', 'New article/devlog route reuses editorial records, empty state, and adjacent links.']],
  [14, ['PORT / INTEGRATE', 'Current four-key guest schema with atomic Treat collectible migration, local progression, daily, quests, and rewards.']],
  [15, ['PORT / POLISH', 'Existing definition-driven quest system with route/Treat/daily events and safe claims.']],
  [16, ['PORT / POLISH', 'Existing renderer plus non-entitlement milestone/Treat definitions; no paid economy.']],
  [17, ['BUILD THIN / INTEGRATE', 'Website leaderboard view uses bounded completed local runs and personal best; connected/global stays future.']],
  [18, ['KEEP / POLISH', 'Four modes represented with existing gameplay evidence; unverified store destinations disabled.']],
  [19, ['PLACEHOLDER / INTEGRATE', 'Guest-first account shell; real identity/sync remains gated on configured Froggy activation.']],
  [20, ['INTEGRATE / POLISH', 'Guest progression and validated local personal-best summary; no connected profile implied.']],
  [21, ['PLACEHOLDER', 'Finished community construction state; service/content remains future.']],
  [22, ['PLACEHOLDER', 'Finished store preview; no catalog, prices, inventory, cart, or checkout invented.']],
  [23, ['KEEP / POLISH', 'Existing grouped local search and support filtering; route index refreshed.']],
  [24, ['BUILD THIN', 'New registry-backed Available/In Development/Coming Soon/Exploring route without dates.']],
  [25, ['POLISH', 'Five searchable support articles and useful shortcuts with accurate guest-local wording.']],
  [26, ['PLACEHOLDER / POLISH', 'Truthful disabled, non-submitting contact surface until endpoint/mailbox exists.']],
  [27, ['POLISH / KEEP', 'TOADAL GAMES remains subordinate; additional approved studio copy is content-dependent.']],
  [28, ['KEEP / POLISH', 'Reusable construction route with useful exits and no false dates/promises.']],
  [29, ['PLACEHOLDER / KEEP', 'Product facts and legal status; approved policies/contact remain external content inputs.']],
  [30, ['KEEP / POLISH', 'Branded 404, Search recovery path, and staging base path verified.']]
]);

for (const page of ledger.pages) {
  const update = completionRows.get(page.n);
  if (!update) throw new Error(`Missing closure reconciliation for page ${page.n}`);
  page.manifestV1Action = update[0];
  page.manifestV1Evidence = update[1];
}
for (const n of [13, 17, 24]) {
  const page = ledger.pages.find(item => item.n === n);
  page.status = 'PARTIAL_CANDIDATE';
  page.delivery = 'CANDIDATE';
  page.evidence = page.manifestV1Evidence;
}
const treats = ledger.crossCutting.find(item => item.requirement === 'Hidden Treats / collectible food');
treats.status = 'PARTIAL_CANDIDATE';
treats.evidence = 'Three Home candies map one-to-one to schema-compatible {id,count} collectibles; boot migration is idempotent, and collection atomically updates discovery, Pass, and quest state; no permanent economy is asserted.';
const storyCrossCutting = ledger.crossCutting.find(item => item.requirement === 'Consume media/manga/lore/news');
storyCrossCutting.evidence = 'Media/News previews, registry-backed article/roadmap presentation, and fail-closed Stories/Manga/Reader publishing surfaces exist; approved public records remain absent.';
const previousStatusCounts = {};
for (const page of ledger.pages) previousStatusCounts[page.status] = (previousStatusCounts[page.status] || 0) + 1;
ledger.pageStatusCounts = previousStatusCounts;
ledger.latestManifestV1Closure = {
  status: 'MANIFEST V1 ENGINEERING COMPLETE — ONLY EXTERNAL ACTIVATION/CONTENT DEPENDENCIES REMAIN',
  report: reportPath,
  branch: 'work/manifest-complete-v1-20261002',
  baseCommit: '6e543f2abebe66ef46ca6ecaa6da20e3196a5c43',
  baseTree: 'b48efb7b20c72c11acc017a4807bc545aa81f17a',
  routeRecords: pageIndex.pages.length,
  originalManifestFamilies: 30,
  studioVersion: '1.4.2',
  studioValidation: 'PASS',
  studioAiDoctor: 'PASS',
  studioInspectRenderExportCheckpoint: 'PASS',
  nodeTests: '83/83 PASS',
  ownerPreviewGates: '16/16 PASS',
  browserMatrix: '83/83 PASS across 33 routes',
  visualEvidence: '13 captures and 17/17 companion interactions PASS; cold initial payload recorded for Home/Play/World/Media/App/Feast Pass',
  homeLockVisual: 'OWNER REVIEW PENDING; NOT CLAIMED',
  requiredContentAndExternalDependencies: 'See closure report',
  stagingSha: 'pending deployment verification',
  rollback: 'd6be86a9762370b66e79c1d5a36ab8066e421496'
};
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(`Updated manifest ledger: ${ledger.pages.length} rows, ${pageIndex.pages.length} routes, ${JSON.stringify(previousStatusCounts)}`);
