import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ledgerPath = path.join(root, 'manifests', 'manifest-compliance-ledger.json');
const pagesIndexPath = path.join(root, 'studio-project', 'toadal-feast-website', 'pages', 'index.json');
const authorityPath = path.join(root, 'docs', 'authority', 'WEB_PRODUCT_AUTHORITY.md');

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const pagesIndex = JSON.parse(fs.readFileSync(pagesIndexPath, 'utf8'));
const authority = fs.readFileSync(authorityPath, 'utf8');

const errors = [];
const allowedStatuses = new Set(['DONE_PROVEN','PARTIAL','PARTIAL_CANDIDATE','NOT_STARTED','DEFERRED_SERVICE','BLOCKED_CONTENT_ENDPOINT','BLOCKED_APPROVED_COPY']);

if (!Array.isArray(ledger.pages) || ledger.pages.length !== 30) errors.push(`Expected 30 manifest pages; found ${ledger.pages?.length ?? 'none'}.`);
const nums = ledger.pages.map(p => p.n);
for (let i=1;i<=30;i++) if (!nums.includes(i)) errors.push(`Missing manifest page #${i}.`);
if (new Set(nums).size !== nums.length) errors.push('Duplicate manifest page numbers found.');

for (const p of ledger.pages) {
  if (!allowedStatuses.has(p.status)) errors.push(`Invalid status ${p.status} for page #${p.n} ${p.page}.`);
  if (!p.evidence || !p.remainingGap) errors.push(`Page #${p.n} ${p.page} must carry evidence and remainingGap text.`);
  if (p.status === 'DONE_PROVEN' && p.remainingGap.toLowerCase().includes('absent')) errors.push(`DONE_PROVEN page #${p.n} still says required content is absent.`);
}

const implementedRoutes = new Set((pagesIndex.pages || []).map(p => p.route));
const acceptedRouteEvidence = new Map([
  [1,['/']],
  [2,['/play/']],
  [3,['/games/wicked-bites/','/play/wicked-bites/']],
  [4,['/player/wicked-bites/']],
  [5,['/world/']],
  [6,['/characters/']],
  [7,['/characters/toadal/']],
  [8,['/stories/']],
  [11,['/media/']],
  [12,['/news/']],
  [14,['/feast-pass/']],
  [15,['/feast-pass/quests/']],
  [16,['/feast-pass/rewards/']],
  [18,['/app/']],
  [20,['/profile/']],
  [25,['/support/']],
  [30,['/404.html']]
]);

for (const [n, routes] of acceptedRouteEvidence) {
  if (!routes.some(r => implementedRoutes.has(r))) errors.push(`Ledger claims implemented surface for page #${n}, but no accepted route is present: ${routes.join(', ')}`);
}

const absentRows = ledger.pages.filter(p => p.delivery === 'ABSENT').map(p => p.n);
for (const n of absentRows) {
  const routes = acceptedRouteEvidence.get(n);
  if (routes && routes.some(r => implementedRoutes.has(r))) errors.push(`Page #${n} is marked ABSENT but an accepted implemented route exists.`);
}

if (!authority.includes('MANIFEST_COMPLIANCE_LEDGER_2026-10-01.md')) errors.push('WEB_PRODUCT_AUTHORITY.md does not reference the manifest compliance ledger.');
if (!authority.includes('PROJECT_SOURCE_MAP_2026-10-01.md')) errors.push('WEB_PRODUCT_AUTHORITY.md does not reference the project source map.');

const approvedHome = ledger.authority?.approvedHomeSha256;
if (approvedHome !== '4154f582ed9e7ad8ee31010a3b6974bcd8aaae0cb72cacf1d6a953fa6bf79608') errors.push('Approved Home hash drifted from recorded authority.');

const home = ledger.pages.find(p => p.n === 1);
if (!home || home.status === 'DONE_PROVEN') errors.push('Home must not be marked DONE_PROVEN until owner LOCK_VISUAL acceptance is recorded.');

const actualCounts = {};
for (const p of ledger.pages) actualCounts[p.status] = (actualCounts[p.status] || 0) + 1;
if (JSON.stringify(actualCounts) !== JSON.stringify(ledger.pageStatusCounts)) errors.push(`pageStatusCounts drifted: expected ${JSON.stringify(actualCounts)}, found ${JSON.stringify(ledger.pageStatusCounts)}.`);

const requiredEvidence = [
  ledger.visualEvidence?.home?.path,
  ...(ledger.visualEvidence?.batch1 || []).map(x => x.path),
  ledger.donorEvidence?.strictHomeParityWip?.preservedPatch,
  ledger.donorEvidence?.strictHomeParityWip?.visualProof,
].filter(Boolean);
for (const rel of requiredEvidence) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Required visual/donor evidence missing: ${rel}`);
}
if ((ledger.visualEvidence?.batch1 || []).length !== 9) errors.push(`Expected 9 individually preserved Batch-1 mockups for pages 2-10; found ${ledger.visualEvidence?.batch1?.length ?? 0}.`);
if (!Array.isArray(ledger.executionPriorities) || ledger.executionPriorities.length < 6) errors.push('Manifest-first execution priorities are missing or incomplete.');

console.log(`Manifest rows: ${ledger.pages.length}`);
console.log(`Implemented route records: ${implementedRoutes.size}`);
console.log(`Cross-cutting requirements: ${ledger.crossCutting?.length ?? 0}`);
console.log(`Page status counts: ${JSON.stringify(ledger.pageStatusCounts)}`);

if (errors.length) {
  console.error('MANIFEST COMPLIANCE VERIFY: FAIL');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log('MANIFEST COMPLIANCE VERIFY: PASS');
