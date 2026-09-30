#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [sourceRepoArg, commitArg, outputRootArg, reportArg, ...selectors] = process.argv.slice(2);
if (!sourceRepoArg || !commitArg || !outputRootArg || !reportArg || selectors.length === 0) {
  console.error('Usage: node scripts/wo003-overlay-git-files.mjs <source-repo> <commit> <audit-output-root> <report-json> <git-file-or-directory-prefix>...');
  process.exit(64);
}

const sourceRepo = path.resolve(sourceRepoArg);
const outputRoot = path.resolve(outputRootArg);
const reportPath = path.resolve(reportArg);
const normalizedOutput = outputRoot.replace(/\\/g, '/').toLowerCase();
if (!normalizedOutput.includes('/reference/audit/')) {
  throw new Error(`Refusing to overlay outside reference/audit: ${outputRoot}`);
}

const git = (...args) => execFileSync('git', ['-C', sourceRepo, ...args], { maxBuffer: 64 * 1024 * 1024 });
const commit = git('rev-parse', `${commitArg}^{commit}`).toString('utf8').trim();
const treeRecords = git('ls-tree', '-r', '-z', '--long', commit).toString('utf8').split('\0').filter(Boolean);
const blobs = new Map();
for (const record of treeRecords) {
  const tab = record.indexOf('\t');
  if (tab < 0) continue;
  const [mode, type, oid, size] = record.slice(0, tab).split(/\s+/);
  const relativePath = record.slice(tab + 1);
  if (type === 'blob' && mode !== '120000') blobs.set(relativePath, { oid, size: Number(size) });
}

const selected = new Set();
for (const selectorRaw of selectors) {
  const selector = selectorRaw.replace(/\\/g, '/');
  if (selector.startsWith('/') || selector.split('/').includes('..')) throw new Error(`Unsafe selector: ${selector}`);
  const matches = selector.endsWith('/')
    ? [...blobs.keys()].filter((file) => file.startsWith(selector))
    : blobs.has(selector) ? [selector] : [];
  if (matches.length === 0) throw new Error(`No Git blobs matched: ${selector}`);
  for (const file of matches) selected.add(file);
}

const files = [];
for (const relativePath of [...selected].sort()) {
  const blob = blobs.get(relativePath);
  const bytes = git('cat-file', 'blob', blob.oid);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const target = path.resolve(outputRoot, ...relativePath.split('/'));
  if (!target.startsWith(`${outputRoot}${path.sep}`)) throw new Error(`Unsafe target: ${target}`);
  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target);
    const existingHash = crypto.createHash('sha256').update(existing).digest('hex');
    if (existingHash !== sha256) throw new Error(`Refusing to overwrite differing file: ${relativePath}`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  files.push({ path: relativePath, gitBlob: blob.oid, bytes: bytes.length, sha256 });
}

const ledger = files.map((file) => `${file.path}\0${file.sha256}\n`).join('');
const report = {
  schema: 'toadal-feast.arcade-runtime-overlay.v1',
  sourceRepo,
  sourceCommit: commit,
  outputRoot,
  selectors,
  files: files.length,
  bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  runtimeLedgerSha256: crypto.createHash('sha256').update(ledger, 'utf8').digest('hex'),
  fileLedger: files,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...report, fileLedger: `[${files.length} entries in report]` }, null, 2));
