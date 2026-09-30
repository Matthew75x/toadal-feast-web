#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [auditRootArg, closurePathArg, overlayPathArg, qualificationPathArg, outputPathArg] = process.argv.slice(2);
if (![auditRootArg, closurePathArg, overlayPathArg, qualificationPathArg, outputPathArg].every(Boolean)) {
  console.error('Usage: node scripts/wo003-package-inventory.mjs <audit-root> <static-closure.json> <runtime-overlay-ledger.json> <runtime-qualification.json> <output.json>');
  process.exit(2);
}

const auditRoot = path.resolve(auditRootArg);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const closure = readJson(closurePathArg);
const overlay = readJson(overlayPathArg);
const qualification = readJson(qualificationPathArg);
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : entry.isFile() ? [absolute] : [];
  });
}

const closureByPath = new Map(closure.fileLedger.map((file) => [file.path, file]));
const overlayByPath = new Map(overlay.fileLedger.map((file) => [file.path, file]));
const observedRequests = new Set();
const requestKinds = new Map();
for (const request of qualification.network.requests) {
  const url = new URL(request.url);
  if (url.origin === 'http://127.0.0.1:8899') {
    const requestPath = decodeURIComponent(url.pathname.replace(/^\//, ''));
    observedRequests.add(requestPath);
    requestKinds.set(requestPath, request.resourceType);
  }
}

const files = walk(auditRoot).map((absolute) => {
  const relative = path.relative(auditRoot, absolute).split(path.sep).join('/');
  const bytes = fs.readFileSync(absolute);
  const sourceStatic = closureByPath.get(relative);
  const sourceOverlay = overlayByPath.get(relative);
  return {
    path: relative,
    bytes: bytes.length,
    sha256: sha256(bytes),
    donorGitBlob: sourceStatic?.gitBlob || sourceOverlay?.gitBlob || null,
    donorSha256: sourceStatic?.sha256 || sourceOverlay?.sha256 || null,
    sourceSets: [sourceStatic && 'static-closure', sourceOverlay && 'runtime-overlay'].filter(Boolean),
    requestedByQualification: observedRequests.has(relative),
    requestType: requestKinds.get(relative) || null
  };
}).sort((a, b) => a.path.localeCompare(b.path));

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const sourceUnion = new Set([...closureByPath.keys(), ...overlayByPath.keys()]);
const requestedDonorFiles = files.filter((file) => file.sourceSets.length && file.requestedByQualification);
const unrequestedDonorFiles = files.filter((file) => file.sourceSets.length && !file.requestedByQualification);
const byCategory = {};
for (const file of files) {
  const category = file.path.split('/').slice(0, 2).join('/');
  byCategory[category] ||= { files: 0, bytes: 0 };
  byCategory[category].files += 1;
  byCategory[category].bytes += file.bytes;
}

const hashes = new Map();
for (const file of files) {
  const matches = hashes.get(file.sha256) || [];
  matches.push(file.path);
  hashes.set(file.sha256, matches);
}
const duplicateContentGroups = [...hashes.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([hash, paths]) => ({ sha256: hash, paths: paths.sort() }))
  .sort((a, b) => a.sha256.localeCompare(b.sha256));

const canonicalLedger = files.map(({ path: filePath, bytes, sha256: digest }) => `${filePath}\t${bytes}\t${digest}`).join('\n') + '\n';
const result = {
  schema: 'toadal-feast.wo003.arcade-package-inventory.v1',
  auditRoot: path.relative(process.cwd(), auditRoot).split(path.sep).join('/'),
  scope: 'unpublished qualification audit copy; not a website route or integrated package',
  sourceCommit: closure.sourceCommit,
  sourceTree: closure.sourceTree,
  donorEntry: {
    path: closure.entry,
    gitBlob: closure.entryGitBlob,
    sourceBytes: closure.entryBytes,
    sourceSha256: closure.entrySha256,
    packagedBytes: files.find((file) => file.path === closure.entry)?.bytes ?? null,
    packagedSha256: files.find((file) => file.path === closure.entry)?.sha256 ?? null
  },
  inventory: {
    files: files.length,
    bytes: totalBytes,
    mebibytes: Number((totalBytes / 1048576).toFixed(3)),
    sourceDonorFiles: sourceUnion.size,
    sourceDonorBytes: files.filter((file) => file.sourceSets.length).reduce((sum, file) => sum + file.bytes, 0),
    requestedDonorFiles: requestedDonorFiles.length,
    requestedDonorBytes: requestedDonorFiles.reduce((sum, file) => sum + file.bytes, 0),
    unrequestedDonorFiles: unrequestedDonorFiles.length,
    unrequestedDonorBytes: unrequestedDonorFiles.reduce((sum, file) => sum + file.bytes, 0),
    qualificationUniqueLocalRequests: observedRequests.size,
    categories: byCategory,
    largest20: [...files].sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path)).slice(0, 20),
    duplicateContentGroups
  },
  qualification: {
    pass: qualification.pass,
    checkCount: qualification.checks.length,
    failedChecks: qualification.checks.filter((check) => !check.pass).map((check) => check.name),
    uniqueRequests: qualification.network.uniqueRequests,
    failedResources: qualification.network.failedResourceCount,
    badResponses: qualification.network.badResponses,
    externalRequests: qualification.network.externalRequests,
    pageErrors: qualification.network.pageErrors,
    unexpectedConsoleErrors: qualification.network.unexpectedConsoleErrors,
    downloads: qualification.network.downloads
  },
  sortedRuntimeLedgerSha256: sha256(Buffer.from(canonicalLedger)),
  files
};

fs.mkdirSync(path.dirname(path.resolve(outputPathArg)), { recursive: true });
fs.writeFileSync(outputPathArg, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  output: path.resolve(outputPathArg),
  files: result.inventory.files,
  bytes: result.inventory.bytes,
  donorFiles: result.inventory.sourceDonorFiles,
  requestedDonorFiles: result.inventory.requestedDonorFiles,
  unrequestedDonorFiles: result.inventory.unrequestedDonorFiles,
  unrequestedDonorBytes: result.inventory.unrequestedDonorBytes,
  sortedRuntimeLedgerSha256: result.sortedRuntimeLedgerSha256
}, null, 2));
