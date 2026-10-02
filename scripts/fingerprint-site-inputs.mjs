import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const textTypes = new Set(['.json', '.js', '.mjs', '.css', '.html', '.svg', '.md', '.py', '.txt', '.xml']);
export function fingerprintFiles(root, entries) {
  const files = [];
  function walk(file) {
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) throw new Error('Fingerprint must not follow symlink: ' + file);
    if (stat.isDirectory()) fs.readdirSync(file).sort().forEach(name => {
      if (name !== '__pycache__') walk(path.join(file, name));
    });
    else if (stat.isFile()) files.push(file);
  }
  entries.forEach(entry => walk(path.resolve(root, entry)));
  const hash = crypto.createHash('sha256');
  for (const file of [...new Set(files)].sort()) {
    const rel = path.relative(root, file).replaceAll(path.sep, '/');
    const raw = fs.readFileSync(file);
    const bytes = textTypes.has(path.extname(file)) ? Buffer.from(raw.toString('utf8').replaceAll('\r\n', '\n')) : raw;
    hash.update(rel + '\0' + bytes.length + '\0');
    hash.update(bytes);
  }
  return { sha256: hash.digest('hex'), files: new Set(files).size };
}
export function siteFingerprint(root) {
  const site = 'studio-project/toadal-feast-website/';
  const source = ['project.json', 'pages', 'assets', 'games', 'mechanics', 'variables', 'animations', 'collections', 'content', 'reference'].map(item => site + item);
  source.push('scripts', 'docs/content/content-registry.schema.json', 'docs/implementation/progression-state.schema.json', 'manifests/visual-asset-authority-lock.json');
  return { source: fingerprintFiles(root, source), dist: fingerprintFiles(root, ['dist']) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(siteFingerprint(path.resolve(process.argv[2] || '.'))));
}
