import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = path.join(root, 'manifests', 'final-manifest-surface-plan.json');
const pageIndexPath = path.join(root, 'studio-project', 'toadal-feast-website', 'pages', 'index.json');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const plan = await readJson(planPath);
const index = await readJson(pageIndexPath);

const failures = [];
const notes = [];

if (!Array.isArray(plan.rows) || plan.rows.length !== 30) {
  failures.push(`Expected exactly 30 manifest rows, found ${Array.isArray(plan.rows) ? plan.rows.length : 'invalid'}.`);
}

const rowNumbers = new Set((plan.rows || []).map((row) => row.row));
for (let n = 1; n <= 30; n += 1) {
  if (!rowNumbers.has(n)) failures.push(`Missing manifest row ${n} from ${planPath}.`);
}

const pages = Array.isArray(index.pages) ? index.pages : [];
const byRoute = new Map(pages.map((page) => [page.route, page]));

for (const row of plan.rows || []) {
  const page = byRoute.get(row.route);
  if (!page) {
    failures.push(`Row ${String(row.row).padStart(2, '0')} ${row.family}: missing required route ${row.route}`);
    continue;
  }
  if (!page.file) {
    failures.push(`Row ${String(row.row).padStart(2, '0')} ${row.family}: route ${row.route} has no page file.`);
    continue;
  }
  const filePath = path.join(root, 'studio-project', 'toadal-feast-website', page.file);
  try {
    const pageDoc = await readJson(filePath);
    if (pageDoc.route !== row.route) {
      failures.push(`Row ${String(row.row).padStart(2, '0')} ${row.family}: page file route ${pageDoc.route ?? 'missing'} does not match index route ${row.route}.`);
    }
    if (!Array.isArray(pageDoc.components) || pageDoc.components.length === 0) {
      failures.push(`Row ${String(row.row).padStart(2, '0')} ${row.family}: ${page.file} has no components.`);
    }
  } catch (error) {
    failures.push(`Row ${String(row.row).padStart(2, '0')} ${row.family}: cannot read ${page.file}: ${error.message}`);
  }
}

const requiredInfrastructure = [
  'docs/authority/TOADAL_FEAST_MANIFEST_REUSE_CLOSURE_PLAN_2026-10-02.md',
  'docs/authority/FEATURE_DONOR_INDEX_2026-10-02.md',
  'docs/authority/CROSS_PROJECT_HARVEST_2026-10-02.md',
  'docs/authority/DORMANT_CONTRACT_ACTIVATION_MAP_2026-10-02.md',
  'docs/authority/EXISTING_ASSET_REUSE_MAP_2026-10-02.md',
  'docs/authority/STUDIO_ASSEMBLY_RECIPES_2026-10-02.md',
  'docs/authority/FINAL_MANIFEST_ACCEPTANCE_MATRIX_2026-10-02.md',
  'studio-project/toadal-feast-website/reference/assets/js/guest-progression.js',
  'studio-project/toadal-feast-website/reference/assets/js/site-search.js',
  'studio-project/toadal-feast-website/reference/assets/js/stories-publishing.js',
  'studio-project/toadal-feast-website/content/registry.json'
];

for (const relative of requiredInfrastructure) {
  try { await fs.access(path.join(root, relative)); }
  catch { failures.push(`Missing required closure/reuse source: ${relative}`); }
}

const duplicateRoutes = pages
  .map((page) => page.route)
  .filter((route, index, all) => all.indexOf(route) !== index);
if (duplicateRoutes.length) failures.push(`Duplicate page routes: ${[...new Set(duplicateRoutes)].join(', ')}`);

const extraRoutes = pages.filter((page) => !(plan.rows || []).some((row) => row.route === page.route));
if (extraRoutes.length) {
  notes.push(`Additional non-manifest routes retained: ${extraRoutes.map((page) => page.route).join(', ')}`);
}

if (failures.length) {
  console.error('\nFINAL MANIFEST SURFACE CHECK: FAIL\n');
  for (const failure of failures) console.error('- ' + failure);
  if (notes.length) {
    console.error('\nNotes:');
    for (const note of notes) console.error('- ' + note);
  }
  process.exitCode = 1;
} else {
  console.log('FINAL MANIFEST SURFACE CHECK: PASS');
  console.log('30/30 required manifest routes are registered and have readable page components.');
  for (const note of notes) console.log('- ' + note);
}
