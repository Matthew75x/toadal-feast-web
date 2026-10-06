#!/usr/bin/env node
// Export through the pinned Studio API. The committed dist is replaced only
// after native source, public projection and protected payload checks pass.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyOwnerRendererProvenance } from './lib/owner-native-projection.mjs';
import { verifyPublicProjection } from './lib/owner-public-projection.mjs';
import { verifyProtectedGameArtifacts } from './lib/protected-game-artifacts.mjs';
import { verifyExportGamePins } from './lib/staging-artifact.mjs';
import { externalizeAdvancedRuntime } from './lib/externalize-advanced-runtime.mjs';
import { addIntrinsicImageDimensions } from './lib/intrinsic-image-dimensions.mjs';
import { fingerprintFiles } from './fingerprint-site-inputs.mjs';
import { synchronize as verifyPlayCatalogue } from './sync-play-catalogue.mjs';

const args = process.argv.slice(2);
const studioInput = args.find(value => !value.startsWith('--'));
const verifyOnly = args.includes('--verify-only');
if (!studioInput || args.some(value => value.startsWith('--') && value !== '--verify-only') || args.filter(value => !value.startsWith('--')).length !== 1) {
  throw new Error('Usage: node --no-warnings --experimental-strip-types scripts/export-staging-candidate.mjs <PINNED_STUDIO_ROOT> [--verify-only]');
}
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.resolve(studioInput);
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const manifest = path.join(project, 'project.json');
const dist = path.join(repo, 'dist');
const scratchRoot = path.join(repo, '.tmp');
const basePath = '/toadal-feast-web/';
function assertLocalPath(candidate) {
  const relative = path.relative(repo, candidate);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Export path escapes the website checkout: ' + candidate);
  let current = candidate;
  while (current !== repo) {
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Export path contains a symlink: ' + current);
    current = path.dirname(current);
  }
}
assertLocalPath(dist);
assertLocalPath(scratchRoot);
verifyOwnerRendererProvenance(studio);
verifyPublicProjection(studio);
// Refuse stale availability labels before exporting; do not silently edit owner source.
verifyPlayCatalogue(project, true);

const publishing = JSON.parse(fs.readFileSync(path.join(project, 'collections', 'publishing.json'), 'utf8'));
if (publishing.staticExport?.basePath !== basePath || publishing.staticExport?.staging !== true) {
  throw new Error('The Studio publishing profile must remain /toadal-feast-web/ with staging=true.');
}
const sourceEntries = ['project.json', 'pages', 'assets', 'games', 'themes', 'mechanics', 'variables', 'animations', 'collections', 'content', 'reference', 'plugins', 'behaviors'];
const before = fingerprintFiles(project, sourceEntries);
const { loadProject } = await import(pathToFileURL(path.join(studio, 'packages/project-kernel/src/loader.ts')).href);
const { validateProject } = await import(pathToFileURL(path.join(studio, 'packages/project-kernel/src/validate.ts')).href);
const validation = validateProject(loadProject(manifest));
if (!validation.valid) throw new Error('Studio validation failed: ' + JSON.stringify(validation.errors));

fs.mkdirSync(scratchRoot, { recursive: true });
const run = fs.mkdtempSync(path.join(scratchRoot, 'staging-export-'));
const exportedDir = path.join(run, 'site');
const runtimeDir = path.join(run, 'runtime');
fs.mkdirSync(runtimeDir);
// Studio uses os.tmpdir(); this sibling is outside the project being exported.
process.env.TEMP = runtimeDir;
process.env.TMP = runtimeDir;
process.env.TOADAL_PROJECT = manifest;
process.env.TOADAL_STUDIO_ROOT = studio;
const { exportStaticSite } = await import(pathToFileURL(path.join(studio, 'packages/export-manager/src/index.ts')).href);
const exported = exportStaticSite(manifest);
if (exported.profile?.basePath !== basePath || exported.profile?.staging !== true) throw new Error('Studio returned an unexpected static export profile.');

const extraction = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  'Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory($env:TOADAL_STAGING_ZIP,$env:TOADAL_STAGING_OUTPUT)'], {
  env: { ...process.env, TOADAL_STAGING_ZIP: exported.path, TOADAL_STAGING_OUTPUT: exportedDir },
  encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024,
});
if (extraction.status !== 0) throw new Error('Studio ZIP extraction failed: ' + (extraction.stderr || extraction.error?.message));

const advancedRuntime = externalizeAdvancedRuntime(exportedDir, project, basePath);
const protectedArtifacts = verifyProtectedGameArtifacts(exportedDir, project);
if (!protectedArtifacts.valid) throw new Error('Protected game bytes changed: ' + protectedArtifacts.errors.join('; '));
verifyExportGamePins(exportedDir, project, repo);
const checks = [];
for (const [script, parameters] of [
  ['wo001-pages-basepath.mjs', [exportedDir, basePath, '--staging-robots']],
  ['verify-owner-preview-render-freshness.mjs', [repo, exportedDir, basePath]],
  ['verify-pages-basepath.mjs', [exportedDir, basePath]],
  ['verify-static-links.mjs', [exportedDir, basePath]],
  ['verify-staging-robots.mjs', [exportedDir, 'staging']],
]) {
  const result = spawnSync(process.execPath, ['--no-warnings', path.join(repo, 'scripts', script), ...parameters], {
    cwd: repo, env: process.env, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  checks.push({ script, status: result.status, stdout: result.stdout, stderr: result.stderr });
  if (result.status !== 0) throw new Error(script + ' failed: ' + (result.stderr || result.stdout || result.error?.message));
}
const intrinsicImages = addIntrinsicImageDimensions(exportedDir, basePath);
const after = fingerprintFiles(project, sourceEntries);
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Studio export changed authored source; dist was preserved.');

let previousDist = null;
if (!verifyOnly) {
  // Both rename targets are checked children of this checkout. Preserve the
  // previous export in ignored scratch instead of deleting it.
  assertLocalPath(exportedDir);
  if (fs.existsSync(dist)) {
    previousDist = path.join(run, 'previous-dist');
    assertLocalPath(previousDist);
    fs.renameSync(dist, previousDist);
  }
  try { fs.renameSync(exportedDir, dist); }
  catch (error) {
    if (previousDist) fs.renameSync(previousDist, dist);
    throw error;
  }
}
const receipt = {
  schema: 'toadal-feast.staging-studio-export.v1',
  status: 'PASS', studio, manifest, verifyOnly,
  output: verifyOnly ? exportedDir : dist,
  previousDist, source: before,
  validation: { valid: validation.valid, warnings: validation.warnings },
  staticExport: exported,
  zipSha256: crypto.createHash('sha256').update(fs.readFileSync(exported.path)).digest('hex'),
  protectedArtifacts: { count: protectedArtifacts.files.length, valid: protectedArtifacts.valid },
  advancedRuntime,
  intrinsicImages,
  checks,
};
const receiptPath = path.join(run, 'receipt.json');
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, output: receipt.output, receipt: receiptPath, protectedArtifacts: receipt.protectedArtifacts, sourceUnchanged: true }, null, 2));
