#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(process.argv[2] || '.');
const manifestPath = path.join(repo, 'docs', 'implementation', 'CP9_DONOR_MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
const donorRoot = path.resolve(process.argv[3] || manifest.rootPath);
const archivePath = path.resolve(process.argv[4] || manifest.archivePath);
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const failures = [];
const passes = [];
function verifyFile(label, file, expectedHash, expectedBytes) {
  if (!fs.existsSync(file)) { failures.push(`${label}: missing ${file}`); return; }
  const stat = fs.statSync(file);
  const hash = sha256(file);
  if (expectedBytes != null && stat.size !== expectedBytes) failures.push(`${label}: bytes ${stat.size} != ${expectedBytes}`);
  if (hash !== expectedHash) failures.push(`${label}: sha256 ${hash} != ${expectedHash}`);
  if (hash === expectedHash && (expectedBytes == null || stat.size === expectedBytes)) passes.push(label);
}

verifyFile('archive', archivePath, manifest.archiveSha256);
for (const entry of manifest.entries) {
  verifyFile(entry.path, path.join(donorRoot, ...entry.path.split('/')), entry.sha256, entry.bytes);
}
const distRoot = path.join(donorRoot, 'dist');
if (!fs.existsSync(distRoot)) {
  failures.push('dist: missing');
} else {
  let files = 0;
  let bytes = 0;
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile()) { files += 1; bytes += fs.statSync(full).size; }
    }
  };
  walk(distRoot);
  if (files !== manifest.distFiles) failures.push(`dist files ${files} != ${manifest.distFiles}`);
  if (bytes !== manifest.distBytes) failures.push(`dist bytes ${bytes} != ${manifest.distBytes}`);
  if (files === manifest.distFiles && bytes === manifest.distBytes) passes.push('dist aggregate');
}

console.log(JSON.stringify({
  schema: 'toadal-feast.cp9-donor-verification.v1',
  donorRoot,
  archivePath,
  pass: failures.length === 0,
  verified: passes.length,
  failures
}, null, 2));

if (failures.length) process.exitCode = 1;
