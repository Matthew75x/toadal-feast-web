// Source-bound GitHub Pages staging payloads. This is not a TCS issuer or release approval.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isProtectedGameArtifact } from './protected-game-artifacts.mjs';
import { stagingRobotsErrors } from './staging-robots.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const POLICY_PATH = 'manifests/staging-game-preservation-policy.json';
export const ENVIRONMENT = 'github-pages-staging';
export const MAX_FILES = 10000, MAX_FILE_BYTES = 32 * 1024 * 1024, MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/, COMMIT = /^[a-f0-9]{40}$/;
export function requireThat(ok, message) { if (!ok) throw new Error(message); }
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const canonicalBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (parent, child) => { const rel=path.relative(path.resolve(parent),path.resolve(child)); return !rel || (!rel.startsWith('..'+path.sep) && rel !== '..' && !path.isAbsolute(rel)); };
const compare = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

export function safeRelative(value) {
  requireThat(typeof value === 'string' && value.length > 0 && value.length <= 512, 'Invalid payload path length');
  requireThat(!/[\\:%?#\u0000-\u001f\u007f]/.test(value) && !value.startsWith('/'), 'Nonportable/encoded payload path: ' + value);
  const parts = value.split('/');
  requireThat(parts.every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p)), 'Ambiguous/traversing payload path: ' + value);
  requireThat(!parts.some(p => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'Reserved payload path: ' + value);
  requireThat(parts.every(p => !p.startsWith('.') || (value === '.nojekyll' && parts.length === 1)), 'Private/hidden payload path: ' + value);
  requireThat(!parts.some(p => /^(?:node_modules|workspaces|secrets|qualification|__pycache__)$/i.test(p)) &&
    !/(?:^|\/)(?:owner-access-code|credentials?|cookies?|session|private-key)(?:[.-]|$)/i.test(value) &&
    !/\.(?:pem|key|pfx|p12|sqlite3?|db|env|bundle|zip|har)$/i.test(value), 'Private/runtime/archive file in website payload: ' + value);
  requireThat(value.toLowerCase() !== 'cname', 'Custom-domain publication is outside the staging artifact scope');
  return value;
}
export function assertNoLinks(target, directory = true) {
  target = path.resolve(target);
  let at = target;
  while (true) {
    const s = fs.lstatSync(at);
    requireThat(!s.isSymbolicLink(), 'Symlink/junction path refused: ' + at);
    if (at === target) requireThat(directory ? s.isDirectory() : s.isFile(), 'Unexpected path type: ' + at);
    if (path.dirname(at) === at) break;
    at = path.dirname(at);
  }
  return target;
}
export function readRegular(root, name) {
  safeRelative(name);
  const full = path.join(root, ...name.split('/'));
  assertNoLinks(path.dirname(full));
  const before = fs.lstatSync(full);
  requireThat(before.isFile() && !before.isSymbolicLink() && before.nlink === 1, 'Link/nonregular payload file: ' + name);
  requireThat(before.size <= MAX_FILE_BYTES, 'Payload file exceeds byte limit: ' + name);
  const fd = fs.openSync(full, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const first = fs.fstatSync(fd);
    requireThat(first.isFile() && first.nlink === 1 && first.dev === before.dev && first.ino === before.ino && first.size === before.size, 'Payload identity changed before read: ' + name);
    const data = fs.readFileSync(fd), last = fs.fstatSync(fd), after = fs.lstatSync(full);
    requireThat(last.dev === first.dev && last.ino === first.ino && last.size === first.size && last.mtimeMs === first.mtimeMs &&
      after.dev === first.dev && after.ino === first.ino && !after.isSymbolicLink() && data.length === first.size,
      'Payload changed during read: ' + name);
    return data;
  } finally { fs.closeSync(fd); }
}
export function inventoryPayload(root) {
  root = assertNoLinks(root);
  const rows = [], seen = new Set(); let total = 0;
  function visit(dir, rel = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : 1)) {
      const name = rel ? rel + '/' + e.name : e.name;
      safeRelative(name); const lower = name.toLowerCase();
      requireThat(!seen.has(lower), 'Case-colliding payload path: ' + name); seen.add(lower);
      requireThat(!e.isSymbolicLink(), 'Symlink/junction payload entry: ' + name);
      if (e.isDirectory()) {
        requireThat(fs.readdirSync(path.join(root, name)).length > 0, 'Unaccounted empty payload directory: ' + name);
        visit(path.join(root, name), name);
      } else {
        requireThat(e.isFile(), 'Special payload entry: ' + name);
        const bytes = readRegular(root, name); total += bytes.length;
        requireThat(rows.length < MAX_FILES && total <= MAX_TOTAL_BYTES, 'Payload inventory exceeds limits');
        rows.push({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  }
  visit(root); requireThat(rows.length > 0, 'Empty staging payload'); return rows.sort(compare);
}
function git(repo, args, input) {
  const result = spawnSync('git', ['-C', repo, ...args], { input, encoding: null, timeout: 60000, maxBuffer: MAX_TOTAL_BYTES + 4 * 1024 * 1024, windowsHide: true });
  requireThat(!result.error && result.status === 0, 'Git source read failed: ' + args[0]); return result.stdout;
}
export function exactSource(repo, revision) {
  repo = assertNoLinks(repo);
  requireThat(COMMIT.test(revision), 'Source must be an explicit full commit SHA, not HEAD/a branch/tag');
  requireThat(git(repo, ['rev-parse', revision + '^{commit}']).toString().trim() === revision, 'Source is not the exact declared commit');
  const sourceTree = git(repo, ['rev-parse', revision + '^{tree}']).toString().trim();
  const distTree = git(repo, ['rev-parse', revision + ':dist']).toString().trim();
  const listing = git(repo, ['ls-tree', '-rz', revision + ':dist']).toString('utf8');
  const files = listing.split('\0').filter(Boolean).map(line => {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    requireThat(match, 'Git payload contains a link/submodule/nonregular entry');
    return { path: safeRelative(match[3]), blob: match[2] };
  }).sort(compare);
  requireThat(files.length > 0 && files.length <= MAX_FILES, 'Git payload file count outside bounds');
  requireThat(new Set(files.map(f => f.path.toLowerCase())).size === files.length, 'Git payload has case-colliding paths');
  // Query sizes before reading content, then hash exact Git blobs without checkout conversion.
  const query = files.map(f => f.blob).join('\n') + '\n';
  const sizes = git(repo, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], query).toString().trim().split('\n');
  requireThat(sizes.length === files.length, 'Git size inventory incomplete'); let total = 0;
  sizes.forEach((line,i) => {
    const [oid,type,value] = line.split(' '), size = Number(value);
    requireThat(oid === files[i].blob && type === 'blob' && Number.isSafeInteger(size) && size >= 0 && size <= MAX_FILE_BYTES, 'Invalid/oversized Git payload object');
    total += size; requireThat(total <= MAX_TOTAL_BYTES, 'Git payload exceeds total byte limit'); files[i].bytes = size;
  });
  const output = git(repo, ['cat-file', '--batch'], query); let offset = 0;
  for (const file of files) {
    const end = output.indexOf(10, offset); requireThat(end >= 0, 'Missing Git object header');
    const header = output.subarray(offset,end).toString();
    requireThat(header === file.blob + ' blob ' + file.bytes, 'Unexpected Git batch object'); offset = end + 1;
    file.content = output.subarray(offset, offset + file.bytes); file.sha256 = sha256(file.content); offset += file.bytes;
    requireThat(output[offset] === 10, 'Incomplete Git payload object'); offset++;
  }
  requireThat(offset === output.length, 'Unexpected Git batch trailing bytes');
  return { revision, sourceTree, distTree, totalBytes: total, files };
}
export function validatePolicy(policy) {
  requireThat(policy?.schema === 'toadal.staging-game-preservation.v1' && policy.environment === ENVIRONMENT &&
    policy.basePath === '/toadal-feast-web/' && policy.unknownGamePayloads === 'DENY' && policy.newCartridgeAdmission === 'NOT_ENABLED', 'Unsupported staging game policy');
  requireThat(policy.classification === 'LEGACY_PREVIEW_PRESERVATION_NOT_TCS_QUALIFICATION' && policy.tcsQualified === false &&
    policy.gameId === 'wicked-bites' && policy.version === '5.5' && policy.publicState === 'PREVIEW', 'Legacy exception scope cannot raise game authority');
  requireThat(COMMIT.test(policy.baseline?.sourceCommit || '') && Array.isArray(policy.files) && policy.files.length === 3, 'Missing exact legacy baseline');
  const names = new Set();
  for (const f of policy.files) {
    safeRelative(f.path);
    requireThat(/^public\/games\/wicked-bites\/(?:index\.html|cartridge\.json|toadal-bridge\.js)$/.test(f.path) && !names.has(f.path) &&
      Number.isSafeInteger(f.bytes) && f.bytes > 0 && f.bytes <= MAX_FILE_BYTES && HASH.test(f.sha256), 'Invalid exact legacy file pin'); names.add(f.path);
  }
  requireThat(Array.isArray(policy.revokedSha256) && policy.revokedSha256.every(hash => HASH.test(hash)), 'Invalid revocation list');
  return policy;
}
export function enforceGamePolicy(rows, policy) {
  validatePolicy(policy);
  const actual = rows.filter(r => isProtectedGameArtifact(r.path)), expected = new Map(policy.files.map(f => [f.path,f]));
  requireThat(new Set(actual.map(f=>f.path)).size===actual.length, 'Duplicate protected game payload entry');
  requireThat(actual.length === expected.size, 'Unknown or missing protected game payload; new admission is held');
  for (const f of actual) {
    const pin = expected.get(f.path);
    requireThat(pin && pin.bytes === f.bytes && pin.sha256 === f.sha256, 'Game payload differs from preserved legacy staging identity: ' + f.path);
    requireThat(!policy.revokedSha256.includes(f.sha256), 'Game artifact is revoked: ' + f.path);
  }
  return { files: actual.length, classification: policy.classification, tcsQualified: false, newCartridgesAdmitted: 0 };
}
export function policyFromRepo(repo, committed = true) {
  const bytes = readRegular(repo, POLICY_PATH); const policy = validatePolicy(JSON.parse(bytes.toString('utf8')));
  if (committed) requireThat(git(repo, ['show', 'HEAD:' + POLICY_PATH]).equals(bytes), 'Uncommitted policy cannot authorize payload preparation');
  return { policy, sha256: sha256(bytes) };
}
export function verifyExportGamePins(exported, project, repo = REPO) {
  // Used during authoring too: changes to both source and export cannot silently re-pin a game.
  const { policy } = policyFromRepo(repo, false);
  for (const root of [path.join(project,'reference'), exported]) {
    // Only game files in the reference (which also contains non-public developer material).
    const rows = [];
    function walk(dir, rel = '') {
      assertNoLinks(dir);
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const name = rel ? rel + '/' + e.name : e.name;
        requireThat(!e.isSymbolicLink(), 'Linked Studio reference/payload refused: ' + name);
        if (e.isDirectory()) walk(path.join(dir,e.name),name);
        else if (isProtectedGameArtifact(name)) { const data = readRegular(root,name); rows.push({path:name,bytes:data.length,sha256:sha256(data)}); }
      }
    }
    walk(root); enforceGamePolicy(rows,policy);
  }
  return { valid:true, files:policy.files.length, classification:policy.classification };
}
export function expectedManifest(repo, revision) {
  const source = exactSource(repo,revision), { policy, sha256:policySha256 } = policyFromRepo(repo);
  const rows = source.files.map(({path,bytes,sha256}) => ({path,bytes,sha256})); enforceGamePolicy(rows,policy);
  requireThat(rows.some(f => f.path === 'index.html') && rows.some(f => f.path === '404.html') && rows.some(f => f.path === '.nojekyll'), 'Missing required static website entry points');
  const robots = source.files.find(f => f.path === 'robots.txt')?.content.toString('utf8') || '';
  const robotsErrors = stagingRobotsErrors(robots);
  requireThat(!robotsErrors.length, 'Source is not the disallowed staging robots profile: ' + robotsErrors.join('; '));
  for(const file of source.files.filter(f=>/\.html$/i.test(f.path) && !isProtectedGameArtifact(f.path))) {
    const text=file.content.toString('utf8');
    const robotTags=text.match(/<meta\b[^>]*>/gi) || [];
    requireThat(robotTags.some(tag=>/\bname\s*=\s*['" ]robots['" ]/i.test(tag) && /\bcontent\s*=\s*['"][^'"]*\bnoindex\b[^'"]*['"]/i.test(tag) && /\bcontent\s*=\s*['"][^'"]*\bnofollow\b[^'"]*['"]/i.test(tag)), 'Source HTML is not a noindex/nofollow staging page: '+file.path);
  }
  const marker=rows.find(f=>f.path==='.nojekyll');
  requireThat((marker.bytes===0 && marker.sha256===sha256(Buffer.alloc(0))) || (marker.bytes===1 && marker.sha256===sha256(Buffer.from('\n'))), 'Only an empty or single-LF .nojekyll source marker may be omitted');
  // upload-pages-artifact@v4 already drops dotfiles. Make that one known, blank
  // control-marker omission explicit BEFORE sealing, so the uploaded tar is exact.
  const publishedRows=rows.filter(f=>f.path!=='.nojekyll');
  const manifest = { schema:'toadal.staging-release-artifact.v1', environment:ENVIRONMENT, repository:'Matthew75x/toadal-feast-web',
    sourceCommit:revision, sourceTree:source.sourceTree, distTree:source.distTree, basePath:'/toadal-feast-web/',
    site:'https://matthew75x.github.io/toadal-feast-web/', gamePolicySha256:policySha256, legacyGameClassification:policy.classification,
    sourceFileCount:rows.length, omittedSourceMarkers:[{...marker,reason:'Blank Jekyll marker (empty or one LF); existing Pages Actions uploader excludes dotfiles'}],
    fileCount:publishedRows.length, sourceTotalBytes:source.totalBytes, totalBytes:source.totalBytes-marker.bytes, files:publishedRows };
  return { source, policy, manifest, manifestBytes:canonicalBytes(manifest) };
}
export function comparePayload(root, expected) {
  const actual = inventoryPayload(root);
  requireThat(actual.length === expected.length, 'Final payload has extra/missing files');
  const byPath = new Map(expected.map(f => [f.path,f]));
  for (const f of actual) {
    const wanted = byPath.get(f.path);
    requireThat(wanted && wanted.bytes === f.bytes && wanted.sha256 === f.sha256, 'Final payload differs from exact source: ' + f.path);
  }
  return actual;
}
export function preparePackage({repo=REPO,revision,input,output,fromGit=false}) {
  requireThat((fromGit && !input) || (!fromGit && typeof input === 'string'), 'Choose exactly one input: a checked directory or source-only Git recovery');
  const data = expectedManifest(repo,revision);
  if (input) comparePayload(input,data.source.files);
  output = path.resolve(output); const parent = assertNoLinks(path.dirname(output));
  requireThat(!fs.existsSync(output) && !/[\r\n]/.test(output), 'Package destination must be NEW; overwrite is refused');
  requireThat((!within(repo,output) || (within(path.join(repo,'.tmp'),output) && path.relative(path.join(repo,'.tmp'),output))), 'Package must be outside authored source or inside its .tmp directory');
  requireThat(!input || (!within(input,output) && !within(output,input)), 'Package and input must be separate');
  fs.mkdirSync(output); const payload=path.join(output,'site'); fs.mkdirSync(payload);
  for (const f of data.source.files) {
    if(f.path==='.nojekyll')continue;
    const bytes=input ? readRegular(input,f.path) : f.content;
    requireThat(bytes.length===f.bytes && sha256(bytes)===f.sha256, 'Input changed during package creation: '+f.path);
    const target=path.join(payload,...f.path.split('/')); fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,bytes,{flag:'wx'});
  }
  comparePayload(payload,data.manifest.files); enforceGamePolicy(data.manifest.files,data.policy);
  fs.writeFileSync(path.join(output,'manifest.json'),data.manifestBytes,{flag:'wx'});
  const hash=sha256(data.manifestBytes);
  fs.writeFileSync(path.join(output,'manifest.sha256'),hash+'\n',{flag:'wx'});
  const receipt={status:'EXACT_STAGING_PACKAGE_PREPARED',sourceCommit:revision,sourceTree:data.source.sourceTree,distTree:data.source.distTree,
    manifestSha256:hash,payload,manifest:path.join(output,'manifest.json'),fileCount:data.manifest.fileCount,sourceFileCount:data.manifest.sourceFileCount,sourceTotalBytes:data.manifest.sourceTotalBytes,totalBytes:data.manifest.totalBytes,
    mode:fromGit?'SOURCE_ONLY_RECOVERY_NO_DEPLOYMENT':'CHECKED_WORKING_PAYLOAD_COPY',environment:ENVIRONMENT,tcsQualified:false,deployPerformed:false};
  fs.writeFileSync(path.join(output,'receipt.json'),canonicalBytes({...receipt,payload:'site',manifest:'manifest.json'}),{flag:'wx'});
  return receipt;
}
export function verifyPackage({repo=REPO,revision,output,manifestSha256}) {
  requireThat(HASH.test(manifestSha256 || ''),'Provide the separately recorded manifest SHA-256');
  output=assertNoLinks(output);
  requireThat(fs.readdirSync(output).sort().join('|') === ['manifest.json','manifest.sha256','receipt.json','site'].sort().join('|'),'Unexpected package entries');
  const bytes=readRegular(output,'manifest.json'),expected=expectedManifest(repo,revision);
  requireThat(sha256(bytes)===manifestSha256 && bytes.equals(expected.manifestBytes),'Manifest/source/policy identity mismatch');
  requireThat(readRegular(output,'manifest.sha256').toString()===manifestSha256+'\n','Manifest digest record changed');
  const receipt=JSON.parse(readRegular(output,'receipt.json').toString('utf8'));
  requireThat(receipt.status==='EXACT_STAGING_PACKAGE_PREPARED' && receipt.sourceCommit===revision && receipt.sourceTree===expected.source.sourceTree && receipt.distTree===expected.source.distTree && receipt.manifestSha256===manifestSha256 && receipt.fileCount===expected.manifest.fileCount && receipt.sourceFileCount===expected.manifest.sourceFileCount && receipt.sourceTotalBytes===expected.manifest.sourceTotalBytes && receipt.totalBytes===expected.manifest.totalBytes && receipt.environment===ENVIRONMENT && receipt.payload==='site' && receipt.manifest==='manifest.json' && receipt.deployPerformed===false && receipt.tcsQualified===false && ['SOURCE_ONLY_RECOVERY_NO_DEPLOYMENT','CHECKED_WORKING_PAYLOAD_COPY'].includes(receipt.mode), 'Package receipt contradicts exact source/scope');
  comparePayload(path.join(output,'site'),expected.manifest.files);
  return {status:'EXACT_STAGING_PACKAGE_VERIFIED',sourceCommit:revision,sourceTree:expected.source.sourceTree,distTree:expected.source.distTree,
    manifestSha256,fileCount:expected.manifest.fileCount,sourceFileCount:expected.manifest.sourceFileCount,sourceTotalBytes:expected.manifest.sourceTotalBytes,totalBytes:expected.manifest.totalBytes,environment:ENVIRONMENT,
    legacyGameFiles:expected.policy.files.length,tcsQualified:false,deployPerformed:false};
}
