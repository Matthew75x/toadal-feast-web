#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [sourceRepoArg, commitArg, entryArg, outputArg, reportArg] = process.argv.slice(2);
if (!sourceRepoArg || !commitArg || !entryArg || !outputArg || !reportArg) {
  console.error('Usage: node scripts/wo003-extract-git-static-closure.mjs <source-repo> <commit> <entry> <output-root> <report-json>');
  process.exit(64);
}

const sourceRepo = path.resolve(sourceRepoArg);
const commit = commitArg;
const entry = entryArg.replace(/\\/g, '/');
const outputRoot = path.resolve(outputArg);
const reportPath = path.resolve(reportArg);
if (entry.startsWith('/') || entry.split('/').includes('..')) throw new Error(`Unsafe entry path: ${entry}`);
if (fs.existsSync(outputRoot)) throw new Error(`Refusing to overwrite existing extraction: ${outputRoot}`);

const git = (...args) => execFileSync('git', ['-C', sourceRepo, ...args], { maxBuffer: 64 * 1024 * 1024 });
const resolvedCommit = git('rev-parse', `${commit}^{commit}`).toString('utf8').trim();
const sourceTree = git('rev-parse', `${resolvedCommit}^{tree}`).toString('utf8').trim();
const treeRecords = git('ls-tree', '-r', '-z', '--long', resolvedCommit).toString('utf8').split('\0').filter(Boolean);
const blobs = new Map();
for (const record of treeRecords) {
  const tab = record.indexOf('\t');
  if (tab < 0) continue;
  const [mode, type, oid, size] = record.slice(0, tab).split(/\s+/);
  const rel = record.slice(tab + 1);
  if (type === 'blob' && mode !== '120000') blobs.set(rel, { oid, size: Number(size) });
}

const textExt = new Set(['.html', '.js', '.mjs', '.cjs', '.css', '.json', '.webmanifest', '.svg']);
const prefixes = ['assets/', 'src/', 'prod/', 'themes/', 'content/', 'packages/'];
const queue = [entry];
const seen = new Set();
const unresolved = new Set();
const contentCache = new Map();
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function normalize(raw, from) {
  let value = raw.replace(/\\/g, '/').replace(/[?#].*$/, '').trim();
  if (!value || /^(https?:|data:|blob:|#|javascript:|mailto:|tel:)/i.test(value)) return null;
  if (value.startsWith('/')) value = value.slice(1);
  if (prefixes.some(prefix => value.startsWith(prefix)) || value === entry) return value;
  if (value.startsWith('./') || value.startsWith('../')) return path.posix.normalize(path.posix.join(path.posix.dirname(from), value));
  return null;
}

function extract(text, from) {
  const refs = new Set();
  const patterns = [
    /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'`]((?:assets|src|prod|themes|content|packages)\/[^"'`\s)<>]+)["'`]/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const rel = normalize(match[1], from);
      if (rel) refs.add(rel);
    }
  }
  return [...refs];
}

function readBlob(rel) {
  let bytes = contentCache.get(rel);
  if (!bytes) {
    const blob = blobs.get(rel);
    if (!blob) return null;
    bytes = git('cat-file', 'blob', blob.oid);
    contentCache.set(rel, bytes);
  }
  return bytes;
}

while (queue.length) {
  const rel = queue.shift();
  if (seen.has(rel)) continue;
  seen.add(rel);
  const blob = blobs.get(rel);
  if (!blob) {
    unresolved.add(rel);
    continue;
  }
  if (textExt.has(path.posix.extname(rel).toLowerCase())) {
    const bytes = readBlob(rel);
    for (const ref of extract(bytes.toString('utf8'), rel)) if (!seen.has(ref)) queue.push(ref);
  }
}

const files = [...seen].filter(rel => blobs.has(rel)).sort().map(rel => {
  const bytes = readBlob(rel);
  const blob = blobs.get(rel);
  return { path: rel, gitBlob: blob.oid, bytes: bytes.length, sha256: sha256(bytes) };
});
const bytesTotal = files.reduce((sum, file) => sum + file.bytes, 0);
const packageLedger = files.map(file => `${file.path}\0${file.sha256}\n`).join('');
const categories = {};
for (const file of files) {
  const category = file.path.split('/')[0];
  categories[category] ||= { files: 0, bytes: 0 };
  categories[category].files += 1;
  categories[category].bytes += file.bytes;
}
const report = {
  schema: 'toadal-feast.arcade-static-source-closure.v1',
  method: 'Recursive static-string closure from exact Git blobs; dynamic/runtime-resolved paths are not captured.',
  sourceRepo,
  sourceCommit: resolvedCommit,
  sourceTree,
  entry,
  entryGitBlob: blobs.get(entry)?.oid || null,
  entryBytes: blobs.get(entry)?.size ?? null,
  entrySha256: blobs.has(entry) ? sha256(readBlob(entry)) : null,
  files: files.length,
  bytes: bytesTotal,
  mebibytes: Number((bytesTotal / 1048576).toFixed(3)),
  runtimeLedgerSha256: sha256(Buffer.from(packageLedger, 'utf8')),
  categories,
  largest20: [...files].sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)).slice(0, 20),
  unresolved: [...unresolved].sort(),
  fileLedger: files,
};

fs.mkdirSync(outputRoot, { recursive: true });
for (const file of files) {
  const target = path.join(outputRoot, ...file.path.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, readBlob(file.path));
}
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...report, fileLedger: `[${files.length} entries in report]` }, null, 2));
if (unresolved.size) process.exitCode = 2;
