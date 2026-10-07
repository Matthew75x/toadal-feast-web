#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isProtectedGameArtifact } from './lib/protected-game-artifacts.mjs';
import { STAGING_ROBOTS_TEXT } from './lib/staging-robots.mjs';

const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'poster']);
const RAW_TEXT_TAGS = new Set(['script', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext']);
const STAGING_ROBOTS_FILE = 'robots.txt';
const STAGING_ROBOTS_META = '<meta name="robots" content="noindex,nofollow">';

export function normalizeBasePath(basePath) {
  if (typeof basePath !== 'string' || basePath.length === 0) {
    throw new TypeError('Base path must be a non-empty string.');
  }

  if (!basePath.startsWith('/') || basePath.startsWith('//')) {
    throw new TypeError('Base path must be absolute and have exactly one leading slash.');
  }
  if (/[\\?#\u0000-\u001f\u007f-\u009f]/u.test(basePath)) {
    throw new TypeError('Base path must not contain backslashes, query/hash delimiters, or control characters.');
  }

  const segments = basePath.split('/').filter(Boolean);
  for (const segment of segments) {
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new TypeError('Base path contains invalid percent-encoding.');
    }
    if (decoded === '.' || decoded === '..') {
      throw new TypeError('Base path must not contain . or .. path segments.');
    }
    if (/[\\/?#\u0000-\u001f\u007f-\u009f]/u.test(decoded)) {
      throw new TypeError('Base path segments must not contain encoded separators, query/hash delimiters, or control characters.');
    }
  }

  const normalized = basePath.replace(/\/{2,}/gu, '/').replace(/\/+$/u, '');
  return normalized === '' ? '/' : `${normalized}/`;
}

/** Resolve a root-absolute URL beneath a GitHub Pages project-site base path. */
export function resolveBasePath(basePath, url) {
  const normalizedBasePath = normalizeBasePath(basePath);
  if (typeof url !== 'string') throw new TypeError('URL must be a string.');
  if (normalizedBasePath === '/' || !url.startsWith('/') || url.startsWith('//')) return url;

  const suffixAt = url.search(/[?#]/u);
  const pathname = suffixAt === -1 ? url : url.slice(0, suffixAt);
  const prefixWithoutTrailingSlash = normalizedBasePath.slice(0, -1);
  if (pathname === prefixWithoutTrailingSlash || pathname.startsWith(normalizedBasePath)) return url;

  return `${normalizedBasePath}${url.slice(1)}`;
}

function rewriteSrcset(value, basePath) {
  let output = '';
  let index = 0;
  let rewrites = 0;

  while (index < value.length) {
    const leadingStart = index;
    while (index < value.length && (value[index] === ',' || /\s/u.test(value[index]))) index += 1;
    output += value.slice(leadingStart, index);
    if (index >= value.length) break;

    const tokenStart = index;
    while (index < value.length && !/\s/u.test(value[index])) index += 1;
    const token = value.slice(tokenStart, index);
    const trailingCommas = token.match(/,+$/u)?.[0] ?? '';
    const candidateUrl = trailingCommas ? token.slice(0, -trailingCommas.length) : token;
    const resolvedUrl = candidateUrl ? resolveBasePath(basePath, candidateUrl) : candidateUrl;
    if (resolvedUrl !== candidateUrl) rewrites += 1;
    output += `${resolvedUrl}${trailingCommas}`;

    if (trailingCommas) continue;

    const descriptorStart = index;
    while (index < value.length && value[index] !== ',') index += 1;
    if (index < value.length) index += 1;
    output += value.slice(descriptorStart, index);
  }

  return { value: output, rewrites };
}

function findTagEnd(html, start) {
  let quote = null;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote !== null) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  return -1;
}

function rewriteStartTag(tag, basePath) {
  const nameMatch = /^<([A-Za-z][^\s/>]*)/u.exec(tag);
  if (!nameMatch) return { tag, name: null, rewrites: 0 };

  const tagName = nameMatch[1].toLowerCase();
  let output = tag.slice(0, nameMatch[0].length);
  let index = nameMatch[0].length;
  let rewrites = 0;
  const contentEnd = tag.endsWith('>') ? tag.length - 1 : tag.length;

  while (index < contentEnd) {
    const whitespaceStart = index;
    while (index < contentEnd && /\s/u.test(tag[index])) index += 1;
    output += tag.slice(whitespaceStart, index);
    if (index >= contentEnd || tag[index] === '/') {
      output += tag.slice(index, contentEnd);
      index = contentEnd;
      break;
    }

    const attributeStart = index;
    while (index < contentEnd && !/[\s=/>]/u.test(tag[index])) index += 1;
    if (index === attributeStart) {
      output += tag[index];
      index += 1;
      continue;
    }

    const attributeName = tag.slice(attributeStart, index);
    const normalizedName = attributeName.toLowerCase();
    output += attributeName;
    const equalsWhitespaceStart = index;
    while (index < contentEnd && /\s/u.test(tag[index])) index += 1;

    if (index >= contentEnd || tag[index] !== '=') {
      output += tag.slice(equalsWhitespaceStart, index);
      continue;
    }

    output += `${tag.slice(equalsWhitespaceStart, index)}=`;
    index += 1;
    const valueWhitespaceStart = index;
    while (index < contentEnd && /\s/u.test(tag[index])) index += 1;
    output += tag.slice(valueWhitespaceStart, index);

    let quote = null;
    let valueStart = index;
    let valueEnd;
    if (tag[index] === '"' || tag[index] === "'") {
      quote = tag[index];
      output += quote;
      valueStart = index + 1;
      valueEnd = tag.indexOf(quote, valueStart);
      if (valueEnd === -1 || valueEnd > contentEnd) {
        output += tag.slice(index + 1, contentEnd);
        index = contentEnd;
        break;
      }
      index = valueEnd + 1;
    } else {
      while (index < contentEnd && !/\s/u.test(tag[index])) index += 1;
      valueEnd = index;
    }

    const originalValue = tag.slice(valueStart, valueEnd);
    let rewrittenValue = originalValue;
    if (normalizedName === 'srcset') {
      const result = rewriteSrcset(originalValue, basePath);
      rewrittenValue = result.value;
      rewrites += result.rewrites;
    } else if (normalizedName === 'style') {
      const cssValue = originalValue
        .replace(/&(?:#39|#x27|apos);/giu, "'")
        .replace(/&(?:#34|#x22|quot);/giu, '"');
      const result = rewriteCss(cssValue, basePath);
      result.value = result.value.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
      rewrittenValue = result.value;
      rewrites += result.rewrites;
    } else if (URL_ATTRIBUTES.has(normalizedName)) {
      rewrittenValue = resolveBasePath(basePath, originalValue);
      if (rewrittenValue !== originalValue) rewrites += 1;
    }

    output += rewrittenValue;
    if (quote !== null) output += quote;
  }

  if (tag.endsWith('>')) output += '>';
  return { tag: output, name: tagName, rewrites };
}

function findRawClosingTag(html, start, tagName) {
  const pattern = new RegExp(`<\\/${tagName}(?=[\\s/>])`, 'igu');
  pattern.lastIndex = start;
  const match = pattern.exec(html);
  return match ? match.index : -1;
}

function findHtmlTagEnd(html, start) {
  const end = findTagEnd(html, start);
  return end === -1 ? html.length : end + 1;
}

export function rewriteCss(css, basePath) {
  let output = '';
  let index = 0;
  let rewrites = 0;

  while (index < css.length) {
    if (css.startsWith('/*', index)) {
      const commentEnd = css.indexOf('*/', index + 2);
      const end = commentEnd === -1 ? css.length : commentEnd + 2;
      output += css.slice(index, end);
      index = end;
      continue;
    }

    if (css[index] === '"' || css[index] === "'") {
      const quote = css[index];
      const stringStart = index;
      index += 1;
      while (index < css.length) {
        if (css[index] === '\\') index += 2;
        else if (css[index++] === quote) break;
      }
      output += css.slice(stringStart, Math.min(index, css.length));
      continue;
    }

    const importMatch = css.slice(index).match(/^@import\b/iu);
    if (importMatch) {
      let valueStart = index + importMatch[0].length;
      while (valueStart < css.length && /\s/u.test(css[valueStart])) valueStart += 1;
      const quote = css[valueStart];
      if (quote === '"' || quote === "'") {
        let valueEnd = valueStart + 1;
        while (valueEnd < css.length) {
          if (css[valueEnd] === '\\') valueEnd += 2;
          else if (css[valueEnd] === quote) break;
          else valueEnd += 1;
        }
        if (valueEnd < css.length && css[valueEnd] === quote) {
          const originalUrl = css.slice(valueStart + 1, valueEnd);
          const rewrittenUrl = resolveBasePath(basePath, originalUrl);
          if (rewrittenUrl !== originalUrl) rewrites += 1;
          output += css.slice(index, valueStart + 1);
          output += rewrittenUrl;
          output += quote;
          index = valueEnd + 1;
          continue;
        }
      }
    }

    const previous = index === 0 ? '' : css[index - 1];
    const functionMatch = css.slice(index).match(/^url(?=\s*\()/iu);
    if (!functionMatch || /[\w-]/u.test(previous)) {
      output += css[index];
      index += 1;
      continue;
    }

    let openParen = index + functionMatch[0].length;
    while (openParen < css.length && /\s/u.test(css[openParen])) openParen += 1;
    if (css[openParen] !== '(') {
      output += css[index];
      index += 1;
      continue;
    }

    let valueStart = openParen + 1;
    while (valueStart < css.length && /\s/u.test(css[valueStart])) valueStart += 1;
    const quote = css[valueStart] === '"' || css[valueStart] === "'" ? css[valueStart] : null;
    let valueEnd;
    let closeParen;
    if (quote !== null) {
      let cursor = valueStart + 1;
      while (cursor < css.length) {
        if (css[cursor] === '\\') cursor += 2;
        else if (css[cursor++] === quote) break;
      }
      if (css[cursor - 1] !== quote) {
        output += css[index];
        index += 1;
        continue;
      }
      valueEnd = cursor - 1;
      closeParen = cursor;
      while (closeParen < css.length && /\s/u.test(css[closeParen])) closeParen += 1;
      if (css[closeParen] !== ')') {
        output += css[index];
        index += 1;
        continue;
      }
    } else {
      valueEnd = valueStart;
      while (valueEnd < css.length && css[valueEnd] !== ')') {
        if (css[valueEnd] === '\\') valueEnd += 1;
        valueEnd += 1;
      }
      if (css[valueEnd] !== ')') {
        output += css[index];
        index += 1;
        continue;
      }
      closeParen = valueEnd;
      while (valueEnd > valueStart && /\s/u.test(css[valueEnd - 1])) valueEnd -= 1;
    }

    const originalUrl = css.slice(valueStart + (quote === null ? 0 : 1), valueEnd);
    const rewrittenUrl = resolveBasePath(basePath, originalUrl);
    if (rewrittenUrl !== originalUrl) rewrites += 1;

    output += css.slice(index, valueStart + (quote === null ? 0 : 1));
    output += rewrittenUrl;
    output += css.slice(valueEnd, closeParen + 1);
    index = closeParen + 1;
  }

  return { value: output, rewrites };
}

export function rewriteHtml(html, basePath) {
  let output = '';
  let index = 0;
  let rewrites = 0;

  while (index < html.length) {
    const tagStart = html.indexOf('<', index);
    if (tagStart === -1) {
      output += html.slice(index);
      break;
    }
    output += html.slice(index, tagStart);

    if (html.startsWith('<!--', tagStart)) {
      const commentEnd = html.indexOf('-->', tagStart + 4);
      const end = commentEnd === -1 ? html.length : commentEnd + 3;
      output += html.slice(tagStart, end);
      index = end;
      continue;
    }

    if (html.startsWith('</', tagStart) || html.startsWith('<!', tagStart) || html.startsWith('<?', tagStart)) {
      const end = findHtmlTagEnd(html, tagStart);
      output += html.slice(tagStart, end);
      index = end;
      continue;
    }

    const end = findHtmlTagEnd(html, tagStart);
    const rewrittenTag = rewriteStartTag(html.slice(tagStart, end), basePath);
    output += rewrittenTag.tag;
    rewrites += rewrittenTag.rewrites;
    index = end;

    if (!rewrittenTag.name) continue;
    if (rewrittenTag.name === 'style') {
      const closingStart = findRawClosingTag(html, index, 'style');
      const contentEnd = closingStart === -1 ? html.length : closingStart;
      const cssResult = rewriteCss(html.slice(index, contentEnd), basePath);
      output += cssResult.value;
      rewrites += cssResult.rewrites;
      if (closingStart === -1) {
        index = html.length;
      } else {
        const closingEnd = findHtmlTagEnd(html, closingStart);
        output += html.slice(closingStart, closingEnd);
        index = closingEnd;
      }
    } else if (RAW_TEXT_TAGS.has(rewrittenTag.name)) {
      const closingStart = findRawClosingTag(html, index, rewrittenTag.name);
      const contentEnd = closingStart === -1 ? html.length : closingStart;
      output += html.slice(index, contentEnd);
      if (closingStart === -1) {
        index = html.length;
      } else {
        const closingEnd = findHtmlTagEnd(html, closingStart);
        output += html.slice(closingStart, closingEnd);
        index = closingEnd;
      }
    }
  }

  return { value: output, rewrites };
}

async function collectStaticFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectStaticFiles(fullPath));
    } else if (entry.isFile() && /\.(?:html|css)$/iu.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function transformExport(exportDirectory, basePath) {
  const root = path.resolve(exportDirectory);
  const rootStats = await stat(root);
  if (!rootStats.isDirectory()) throw new TypeError(`Static export path is not a directory: ${root}`);

  const files = await collectStaticFiles(root);
  let rewrittenFiles = 0;
  let rewrittenUrls = 0;

  for (const file of files) {
    // Cartridge payloads are immutable artifacts, not website page templates.
    if (isProtectedGameArtifact(path.relative(root,file))) continue;
    const original = await readFile(file, 'utf8');
    const extension = path.extname(file).toLowerCase();
    const result = extension === '.html' ? rewriteHtml(original, basePath) : rewriteCss(original, basePath);
    if (result.value !== original) {
      await writeFile(file, result.value, 'utf8');
      rewrittenFiles += 1;
      rewrittenUrls += result.rewrites;
    }
  }

  return { filesScanned: files.length, filesRewritten: rewrittenFiles, urlsRewritten: rewrittenUrls };
}

function addStagingRobotsPolicy(html) {
  const robotsMeta = /<meta\b(?=[^>]*\bname\s*=\s*(["'])robots\1)(?=[^>]*\bcontent\s*=\s*(["'])(.*?)\2)[^>]*>/iu;
  const existing = robotsMeta.exec(html);
  if (existing) {
    if (existing[3].replace(/\s+/gu, '').toLowerCase() === 'noindex,nofollow') return html;
    throw new Error('Staging robots policy conflicts with an existing robots meta tag.');
  }

  const head = /<head\b[^>]*>/iu.exec(html);
  if (!head) throw new Error('Staging website HTML has no <head> element.');
  const insertAt = head.index + head[0].length;
  return `${html.slice(0, insertAt)}\n${STAGING_ROBOTS_META}${html.slice(insertAt)}`;
}

async function applyStagingRobotsPolicy(exportDirectory) {
  const root = path.resolve(exportDirectory);
  let changed = false;
  for (const file of await collectStaticFiles(root)) {
    if (path.extname(file).toLowerCase() !== '.html' || isProtectedGameArtifact(path.relative(root, file))) continue;
    const original = await readFile(file, 'utf8');
    const transformed = addStagingRobotsPolicy(original);
    if (transformed !== original) {
      await writeFile(file, transformed, 'utf8');
      changed = true;
    }
  }

  const robotsPath = path.join(root, STAGING_ROBOTS_FILE);
  let robotsOriginal = '';
  try {
    robotsOriginal = await readFile(robotsPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  // This explicit staging opt-in replaces public/exception rules rather than
  // appending a wildcard group whose Allow ties can defeat the crawl block.
  const robotsUpdated = STAGING_ROBOTS_TEXT;
  if (robotsUpdated !== robotsOriginal) {
    await writeFile(robotsPath, robotsUpdated, 'utf8');
    changed = true;
  }
  return changed;
}

async function runCli(args) {
  const stagingRobots = args.includes('--staging-robots');
  const positional = args.filter((argument) => argument !== '--staging-robots');
  if (positional.length < 1 || positional.length > 2 || args.filter((argument) => argument === '--staging-robots').length > 1) {
    throw new TypeError('Usage: node scripts/wo001-pages-basepath.mjs <STATIC_EXPORT_DIR> [BASE_PATH] [--staging-robots]');
  }

  const exportDirectory = positional[0];
  const basePath = normalizeBasePath(positional[1] ?? '/');
  const counts = await transformExport(exportDirectory, basePath);
  const stagingRobotsApplied = stagingRobots ? await applyStagingRobotsPolicy(exportDirectory) : false;
  console.log(`Files scanned: ${counts.filesScanned}`);
  console.log(`Files rewritten: ${counts.filesRewritten}`);
  console.log(`URLs rewritten: ${counts.urlsRewritten}`);
  if (stagingRobots) console.log(`Staging robots policy: ${stagingRobotsApplied ? 'added' : 'already present'}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
