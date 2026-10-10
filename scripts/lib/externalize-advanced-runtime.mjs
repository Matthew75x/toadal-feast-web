import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { rewriteCss, normalizeBasePath } from '../wo001-pages-basepath.mjs';
import { isProtectedGameArtifact } from './protected-game-artifacts.mjs';

const STYLE_RE = /<style\s+data-toadal-advanced-code>([\s\S]*?)<\/style>/gu;
const SCRIPT_RE = /<script\s+data-toadal-advanced-code>([\s\S]*?)<\/script>/gu;

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const byteLength = value => Buffer.byteLength(value, 'utf8');

function walkHtml(root, dir = root, rows = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Static export contains a symbolic link: ' + full);
    if (entry.isDirectory()) walkHtml(root, full, rows);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) rows.push(full);
  }
  return rows;
}
function ensureNoStaleAssets(root) {
  for (const folder of ['assets/css','assets/js']) {
    const full = path.join(root, folder);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      if (/^advanced-code\.[a-f0-9]{12}\.(?:css|js)$/u.test(name)) {
        throw new Error('Static export unexpectedly already contains a derived advanced runtime: ' + path.join(folder,name));
      }
    }
  }
}
function exactSingleMatch(html, regex, label, file) {
  const matches = [...html.matchAll(regex)];
  if (matches.length !== 1) throw new Error(file + ' must contain exactly one inline advanced ' + label + ' block; found ' + matches.length);
  return matches[0];
}

export function externalizeAdvancedRuntime(exportRoot, projectRoot, basePath = '/toadal-feast-web/') {
  const root = path.resolve(exportRoot);
  const project = path.resolve(projectRoot);
  const normalizedBase = normalizeBasePath(basePath);
  if (!fs.statSync(root).isDirectory()) throw new Error('Static export root is not a directory.');
  ensureNoStaleAssets(root);

  const collectionPath = path.join(project, 'collections', 'advanced-code.json');
  const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
  if (typeof collection.css !== 'string' || typeof collection.javascript !== 'string' || !collection.css || !collection.javascript) {
    throw new Error('Advanced-code collection must contain non-empty css and javascript strings.');
  }
  if (collection.css.includes('</style') || collection.javascript.includes('</script')) {
    throw new Error('Advanced-code source contains a closing-tag sequence that cannot be externalized safely.');
  }

  const normalizedCss = rewriteCss(collection.css, normalizedBase).value;
  const cssHash = sha256(normalizedCss);
  const jsHash = sha256(collection.javascript);
  const cssRel = 'assets/css/advanced-code.' + cssHash.slice(0,12) + '.css';
  const jsRel = 'assets/js/advanced-code.' + jsHash.slice(0,12) + '.js';
  const cssUrl = normalizedBase + cssRel;
  const jsUrl = normalizedBase + jsRel;
  const cssTag = '<link rel="stylesheet" data-toadal-advanced-code href="' + cssUrl + '"><link rel="preload" data-toadal-advanced-code-preload href="' + jsUrl + '" as="script">';
  const jsTag = '<script data-toadal-advanced-code src="' + jsUrl + '"></script>';

  let pages = 0;
  let beforeHtmlBytes = 0;
  let afterHtmlBytes = 0;
  let sourceCssEmbeds = 0;
  let basePathCssEmbeds = 0;
  const updates = [];
  for (const file of walkHtml(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (isProtectedGameArtifact(rel)) continue;
    const original = fs.readFileSync(file, 'utf8');
    const style = exactSingleMatch(original, STYLE_RE, 'CSS', rel);
    const script = exactSingleMatch(original, SCRIPT_RE, 'JavaScript', rel);
    // The pinned Studio renderer may already have applied the approved static
    // export base-path rewrite to CSS URLs. Accept only the exact source bytes
    // or their deterministic base-path projection; arbitrary CSS drift still
    // fails closed. The externalized asset is always the normalized projection.
    if (style[1] === collection.css) sourceCssEmbeds += 1;
    else if (style[1] === normalizedCss) basePathCssEmbeds += 1;
    else throw new Error(rel + ' advanced CSS differs from Studio source and its base-path projection.');
    if (script[1] !== collection.javascript) throw new Error(rel + ' advanced JavaScript differs from Studio source.');
    if (style.index > script.index) throw new Error(rel + ' advanced CSS must remain before advanced JavaScript.');
    const transformed = original.replace(STYLE_RE, cssTag).replace(SCRIPT_RE, jsTag);
    if (/<style\s+data-toadal-advanced-code>/u.test(transformed) || /<script\s+data-toadal-advanced-code>/u.test(transformed)) throw new Error(rel + ' still contains inline advanced runtime.');
    beforeHtmlBytes += byteLength(original);
    afterHtmlBytes += byteLength(transformed);
    updates.push({ file, transformed });
    pages += 1;
  }
  if (pages < 1) throw new Error('No website pages contained the advanced runtime.');

  for (const [rel, body] of [[cssRel, normalizedCss],[jsRel, collection.javascript]]) {
    const target = path.join(root, ...rel.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body, { flag: 'wx' });
  }
  for (const update of updates) fs.writeFileSync(update.file, update.transformed, 'utf8');

  const derivedBytes = byteLength(normalizedCss) + byteLength(collection.javascript);
  return {
    schema: 'toadal-feast.advanced-runtime-externalization.v1',
    pages,
    source: {
      cssBytes: byteLength(collection.css),
      cssSha256: sha256(collection.css),
      embeddedCssVariants: { source: sourceCssEmbeds, basePathProjected: basePathCssEmbeds },
      javascriptBytes: byteLength(collection.javascript),
      javascriptSha256: sha256(collection.javascript),
    },
    derived: {
      css: { path: cssRel, url: cssUrl, bytes: byteLength(normalizedCss), sha256: cssHash },
      javascript: { path: jsRel, url: jsUrl, bytes: byteLength(collection.javascript), sha256: jsHash },
    },
    html: {
      beforeBytes: beforeHtmlBytes,
      afterBytes: afterHtmlBytes,
      reductionBytes: beforeHtmlBytes - afterHtmlBytes,
    },
    duplicatedSourceBytesRemoved: pages * (byteLength(collection.css) + byteLength(collection.javascript)) - derivedBytes,
    executionOrder: 'external parser-blocking script remains at the original end-of-body script position',
    cssOrder: 'external stylesheet remains at the original advanced-style position',
  };
}
