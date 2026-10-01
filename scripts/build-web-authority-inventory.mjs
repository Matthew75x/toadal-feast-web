import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep, extname } from 'node:path';

const root = resolve(process.argv.find(x => x.startsWith('--root='))?.slice(7) || '.');
const verify = process.argv.includes('--verify');
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const shaTextLF = path => sha(Buffer.from(read(path).toString('utf8').replace(/\r\n/g, '\n')));
const slash = path => path.split(sep).join('/');
const sources = json('manifests/web-authority-sources.json');
const catalogPath = 'studio-project/toadal-feast-website/assets/index.json';
const catalog = json(catalogPath);
const projectRoot = 'studio-project/toadal-feast-website/';
const documents = new Map(sources.documents.map(item => [item.path, item]));
const assets = new Map(catalog.assets.map(item => [projectRoot + item.source, item]));
const files = [];

function walk(dir) {
  for (const item of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = slash(relative(root, resolve(root, dir, item.name)));
    if (item.isDirectory()) walk(path);
    else if (item.isFile()) files.push(path);
  }
}
walk('docs');
walk('assets/reference/mockups');
walk(projectRoot + 'reference/assets');
const entries = files.sort().map(path => {
  const raw = read(path);
  const source = documents.get(path);
  const asset = assets.get(path);
  const exactSource = !!source;
  const text = ['.md', '.json', '.txt', '.svg', '.css'].includes(extname(path));
  const bytes = text && !exactSource ? Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n')) : raw;
  let status = 'active';
  let approvalState = 'implementation-evidence';
  let purpose = 'Preserved website contract, plan, or implementation evidence; consult the authority hierarchy for precedence.';
  if (path.startsWith('docs/review/')) { status = 'archival'; purpose = 'Historical review/acceptance evidence, not current product authority.'; }
  if (path.includes('/CP9-donor/')) { status = 'donor-reference'; approvalState = 'donor-evidence'; }
  if (path.includes('/mockups/')) { status = 'reference'; approvalState = 'layout-reference'; purpose = '30-page composition reference; only the visual-ledger dimensions are approved.'; }
  if (path.startsWith('docs/authority/')) { approvalState = 'consolidated-authority-record'; purpose = 'Current authority index, reconciliation, or retained source; not independent owner approval.'; }
  if (path.startsWith(projectRoot + 'reference/assets/')) { approvalState = asset ? 'approved-website-asset' : 'implementation-source'; purpose = asset?.name || 'Existing website styling/asset retained at its canonical path.'; }
  if (path.startsWith('assets/reference/mockups/batch-1/')) { status = 'approved-reference'; approvalState = 'owner-approved-batch-1-layout-reference'; purpose = 'Byte-preserved Batch 1 approved page reference. Approval covers visual direction/composition only, not feature availability or unshown content.'; }
  if (path.startsWith('assets/reference/mockups/mixed-concepts/')) { status = 'reference'; approvalState = 'mixed-concept-reference'; purpose = 'Contact sheet contains mixed approved, reference and concept material; no blanket approval is asserted.'; }
  if (asset?.tags?.includes('per-file-approval-unconfirmed')) { status = 'candidate'; approvalState = 'owner-production-pack-candidate'; purpose = 'Selected context candidate from the owner-described production-ready-only pack; individual approval metadata is absent and runtime binding remains pending.'; }
  return {
    filename: path.split('/').at(-1), path, purpose,
    source: asset?.authoritySource || asset?.referenceSource || 'existing repository at staging/live-visual@' + sources.verifiedStagingSha,
    approvalState, status, bytes: bytes.length, sha256: sha(bytes),
    hashEncoding: text && !exactSource ? 'utf8-lf' : 'exact-bytes',
    ...(source || {}),
    ...(asset?.authoritySha256 ? { originalSourceSha256: asset.authoritySha256 } : {})
  };
});

for (const [path, source] of documents) {
  if (!existsSync(resolve(root, path))) throw new Error('Missing preserved source: ' + path);
  if (source.sha256 && sha(read(path)) !== source.sha256) throw new Error('Source byte mismatch: ' + path);
}
for (const asset of catalog.assets) {
  const path = projectRoot + asset.source;
  if (!existsSync(resolve(root, path))) throw new Error('Missing catalog asset: ' + path);
  // Existing text SVGs use the project's LF export convention.
  const content = read(path);
  const bytes = extname(path) === '.svg' ? Buffer.from(content.toString('utf8').replace(/\r\n/g, '\n')) : content;
  if (asset.sha256 && sha(bytes) !== asset.sha256) throw new Error('Catalog asset hash mismatch: ' + path);
}
const companion = json('manifests/companion-runtime-assets.json');
for (const asset of companion.assets) {
  const bytes = read(asset.path);
  if (sha(bytes) !== asset.sha256) throw new Error('Companion package provenance mismatch: ' + asset.path);
  if (!catalog.assets.some(item => projectRoot + item.source === asset.path)) throw new Error('Unregistered companion: ' + asset.path);
  if (!asset.contexts?.length || !asset.sourceEntry || !asset.approvalState) throw new Error('Incomplete companion authority: ' + asset.path);
}

const inventory = {
  schema: 'toadal-feast.web-authority-inventory.v1', date: '2026-10-01',
  repository: 'Matthew75x/toadal-feast-web', verifiedStagingSha: sources.verifiedStagingSha,
  authorityOrder: ['OWNER-APPROVED PRODUCT/CREATIVE REQUIREMENTS', 'AUTHORITY MANIFESTS / APPROVED ASSETS / MOCKUPS', 'IMPLEMENTATION WORK ORDERS', 'STAGING IMPLEMENTATION'],
  hashPolicy: 'Binary and preserved original sources use exact bytes; other text uses UTF-8 with LF so Windows checkout conversion does not change the ledger.',
  sourcePackages: sources.packages, exclusions: sources.exclusions,
  sourceManifest: 'manifests/web-authority-sources.json', sourceManifestSha256: shaTextLF('manifests/web-authority-sources.json'),
  companionManifest: 'manifests/companion-runtime-assets.json',
  companionManifestSha256: shaTextLF('manifests/companion-runtime-assets.json'),
  localWorkManifest: 'manifests/local-work-preservation.json', localWorkManifestSha256: shaTextLF('manifests/local-work-preservation.json'),
  files: entries
};
const output = JSON.stringify(inventory, null, 2) + '\n';
const target = 'manifests/web-authority-inventory.json';
if (verify) {
  const old = read(target).toString('utf8').replace(/\r\n/g, '\n');
  if (old !== output) throw new Error('Authority inventory stale; run this script without --verify after reviewing the source changes.');
  console.log(`PASS: ${entries.length} preserved files, ${companion.assets.length} companion assets; provenance, catalog references and inventory agree.`);
} else {
  writeFileSync(resolve(root, target), output);
  console.log(`Recorded ${entries.length} files and ${companion.assets.length} companion assets.`);
}
