#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { normalizeBasePath } from './wo001-pages-basepath.mjs';

const SECTION_ORDER = [
  'home-hero',
  'games-intro',
  'home-game-grid',
  'feast-pass',
  'today',
  'discovery',
  'app-conversion',
  'whats-next',
  'companion',
];
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);
const EXTERNAL_SCHEMES = /^(?:mailto|tel|data|blob|about|sms):/i;
const VIRTUAL_ORIGIN = 'https://wo001-static.invalid';
const PUBLIC_FEATURE_STATE_PATH = fileURLToPath(new URL('../docs/implementation/PUBLIC_FEATURE_STATE.json', import.meta.url));
const PREVIEW_GAME_FEATURES = new Map([
  ['wickedBites', 'Wicked Bites'],
  ['toadalTowerDefense', 'TOADAL Tower Defense'],
  ['froggyFruityBash', 'Froggy Fruity Bash'],
  ['clawFeedGulper', 'CLAW: Feed Gulper'],
]);
const ARCADE_CANDIDATE_FEATURE = 'toadalFeastArcadePreview';
const ARCADE_CANDIDATE_TITLE = 'TOADAL FEAST Arcade';

const failures = [];
let passes = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passes += 1;
    return;
  }
  failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function usage() {
  console.error('Usage: node scripts/verify-wo001-home.mjs <STATIC_EXPORT_DIR> <BASE_PATH>');
  process.exit(2);
}

function decodeEntities(value) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|amp|quot|apos|lt|gt|nbsp|colon|tab|newline);/gi, (whole, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : whole;
      } catch {
        return '\uFFFD';
      }
    }
    return ({
      amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0',
      colon: ':', tab: '\t', newline: '\n',
    })[entity.toLowerCase()];
  });
}

function parseAttributes(source) {
  const attrs = Object.create(null);
  let i = 0;
  while (i < source.length) {
    while (/\s|\//.test(source[i] ?? '')) i += 1;
    if (i >= source.length) break;
    const nameStart = i;
    while (i < source.length && !/[\s=/>]/.test(source[i])) i += 1;
    if (nameStart === i) { i += 1; continue; }
    const name = source.slice(nameStart, i).toLowerCase();
    while (/\s/.test(source[i] ?? '')) i += 1;
    let value = '';
    if (source[i] === '=') {
      i += 1;
      while (/\s/.test(source[i] ?? '')) i += 1;
      const quote = source[i] === '"' || source[i] === "'" ? source[i++] : '';
      const valueStart = i;
      if (quote) {
        while (i < source.length && source[i] !== quote) i += 1;
        value = source.slice(valueStart, i);
        if (source[i] === quote) i += 1;
      } else {
        while (i < source.length && !/[\s>]/.test(source[i])) i += 1;
        value = source.slice(valueStart, i).replace(/\/$/, '');
      }
    }
    if (!(name in attrs)) attrs[name] = decodeEntities(value);
  }
  return attrs;
}

// A small HTML tokenizer/tree builder is sufficient for generated HTML and
// avoids a non-built-in parser dependency. Script/style bodies are skipped.
function parseHtml(html) {
  const root = { tag: '#document', attrs: {}, children: [], text: '', parent: null, start: 0, end: html.length };
  const stack = [root];
  let cursor = 0;

  while (cursor < html.length) {
    const open = html.indexOf('<', cursor);
    if (open < 0) {
      stack.at(-1).text += html.slice(cursor);
      break;
    }
    if (open > cursor) stack.at(-1).text += html.slice(cursor, open);
    if (html.startsWith('<!--', open)) {
      const commentEnd = html.indexOf('-->', open + 4);
      cursor = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }

    let end = open + 1;
    let quote = '';
    for (; end < html.length; end += 1) {
      const char = html[end];
      if (quote) {
        if (char === quote) quote = '';
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        break;
      }
    }
    if (end >= html.length) {
      stack.at(-1).text += html.slice(open);
      break;
    }

    const rawTag = html.slice(open + 1, end);
    if (/^\s*[!?]/.test(rawTag)) {
      cursor = end + 1;
      continue;
    }
    const closing = /^\s*\//.test(rawTag);
    const match = rawTag.match(/^\s*\/?\s*([a-z][\w:-]*)/i);
    if (!match) {
      stack.at(-1).text += '<';
      cursor = open + 1;
      continue;
    }
    const tag = match[1].toLowerCase();
    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) {
          for (let pop = stack.length - 1; pop >= index; pop -= 1) stack.pop();
          break;
        }
      }
      cursor = end + 1;
      continue;
    }

    const attrSource = rawTag.slice(match[0].length);
    const node = {
      tag,
      attrs: parseAttributes(attrSource),
      children: [],
      text: '',
      parent: stack.at(-1),
      start: open,
      end: end + 1,
    };
    node.parent.children.push(node);
    if (!VOID_ELEMENTS.has(tag) && !/\/\s*$/.test(rawTag)) {
      stack.push(node);
      if (tag === 'script' || tag === 'style') {
        const closePattern = new RegExp(`<\\/\\s*${tag}\\s*>`, 'ig');
        closePattern.lastIndex = end + 1;
        const close = closePattern.exec(html);
        if (close) cursor = close.index;
        else cursor = html.length;
        continue;
      }
    }
    cursor = end + 1;
  }

  return root;
}

function allNodes(root) {
  const result = [];
  const visit = (node) => {
    for (const child of node.children) {
      result.push(child);
      visit(child);
    }
  };
  visit(root);
  return result;
}

function hasAttr(node, name) {
  return Object.hasOwn(node.attrs, name);
}

function isHidden(node) {
  return hasAttr(node, 'hidden')
    || node.attrs['aria-hidden']?.toLowerCase() === 'true'
    || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(node.attrs.style ?? '')
    || node.tag === 'template'
    || node.tag === 'script'
    || node.tag === 'style';
}

function visibleText(node) {
  if (isHidden(node)) return '';
  return `${node.text} ${node.children.map(visibleText).join(' ')}`.replace(/\s+/g, ' ').trim();
}

function textOf(node) {
  return decodeEntities(visibleText(node));
}

function descendants(node) {
  return allNodes(node);
}

function attrValues(node) {
  return Object.entries(node.attrs).map(([name, value]) => `${name}=${value}`);
}

function markerMatches(node, marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const delimited = new RegExp(`(?:^|[-_:\\s])${escaped}(?:$|[-_:\\s])`, 'i');
  if (delimited.test(node.attrs.id ?? '')) return true;
  if ((node.attrs.class ?? '').split(/\s+/).some((token) => token.toLowerCase() === marker)) return true;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (/^data-(?:home-)?(?:section|zone|region|area|studio-variant)(?:-|$)/i.test(name)
      && (value.toLowerCase() === marker || delimited.test(value))) return true;
  }
  return false;
}

function sectionNode(nodes, marker) {
  return nodes.find((node) => markerMatches(node, marker)) ?? null;
}

function isControl(node) {
  return ['button', 'select', 'input', 'textarea'].includes(node.tag)
    || node.attrs.role?.toLowerCase() === 'button';
}

function isDisabled(node) {
  return hasAttr(node, 'disabled')
    || node.attrs['aria-disabled']?.toLowerCase() === 'true'
    || node.attrs['data-state']?.toLowerCase() === 'disabled';
}

function controlLabel(node) {
  return [textOf(node), node.attrs['aria-label'], node.attrs.title, node.attrs.name,
    node.attrs.id, node.attrs.class].filter(Boolean).join(' ').toLowerCase();
}

function isCategoryControl(node) {
  if (!isControl(node)) return false;
  const identity = [node.attrs.id, node.attrs.class, ...attrValues(node)].filter(Boolean).join(' ').toLowerCase();
  return /category.*filter|filter.*category|game-filter|data-filter-category|data-category-filter/.test(identity)
    || (hasAttr(node, 'data-game-tab') && /^(?:all|preview|public)$/i.test(node.attrs['data-game-tab'].trim()))
    || (hasAttr(node, 'data-filter') && /category|game|all|action|puzzle/i.test(node.attrs['data-filter']))
    || (hasAttr(node, 'data-category') && (hasAttr(node, 'aria-pressed') || identity.includes('filter')));
}

function isSearchInput(node) {
  if (node.tag !== 'input') return false;
  const identity = [node.attrs.type, node.attrs.name, node.attrs.id, node.attrs.class,
    node.attrs.placeholder, node.attrs['aria-label']].filter(Boolean).join(' ').toLowerCase();
  return node.attrs.type?.toLowerCase() === 'search' || /\bsearch\b/.test(identity);
}

function isSearchButton(node) {
  if (!['button', 'input'].includes(node.tag) && node.attrs.role?.toLowerCase() !== 'button') return false;
  const type = node.attrs.type?.toLowerCase();
  const label = controlLabel(node);
  return /\bsearch\b/.test(label) || type === 'submit' && node.parent?.tag === 'form'
    || /search/.test(`${node.attrs.id ?? ''} ${node.attrs.class ?? ''}`.toLowerCase());
}

function ancestry(node) {
  const nodes = [];
  for (let parent = node.parent; parent; parent = parent.parent) nodes.push(parent);
  return nodes;
}

function hasDescendant(node, candidate) {
  for (let parent = candidate; parent; parent = parent.parent) if (parent === node) return true;
  return false;
}

function findSearchRegion(input, nodes) {
  const buttons = nodes.filter(isSearchButton);
  const parents = ancestry(input);
  const form = parents.find((parent) => parent.tag === 'form'
    && buttons.some((button) => hasDescendant(parent, button)));
  if (form) return { region: form, button: buttons.find((button) => hasDescendant(form, button)) };
  for (const parent of parents) {
    const contained = buttons.filter((button) => hasDescendant(parent, button));
    if (contained.length && (parent.tag === 'form' || /search/i.test(`${parent.attrs.id ?? ''} ${parent.attrs.class ?? ''} ${attrValues(parent).join(' ')}`))) {
      return { region: parent, button: contained[0] };
    }
  }
  for (const parent of ancestry(input)) {
    const button = buttons.find((candidate) => hasDescendant(parent, candidate));
    if (button && ['form', 'fieldset', 'section'].includes(parent.tag)) return { region: parent, button };
  }
  return null;
}

function isGameCard(node) {
  const classes = (node.attrs.class ?? '').toLowerCase().split(/\s+/);
  const classCard = classes.some((token) => /^(?:studio-)?(?:(?:browser|arcade)-)?game-card(?:-item)?$/.test(token));
  const explicit = ['data-studio-game-card', 'data-game-card', 'data-game-card-id', 'data-studio-game-id', 'data-game-id']
    .some((name) => hasAttr(node, name));
  return classCard || explicit;
}

function readPublicGameTruth() {
  const document = JSON.parse(fs.readFileSync(PUBLIC_FEATURE_STATE_PATH, 'utf8'));
  const features = document.features ?? {};
  const approvedIds = new Set([...PREVIEW_GAME_FEATURES.keys()]
    .filter((feature) => features[feature] === 'PREVIEW_UNTIL_REAL_WEB_BUILD')
    .map((feature) => `game.${feature.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`));
  const expectedIds = new Set([...PREVIEW_GAME_FEATURES.keys()].map((feature) =>
    `game.${feature.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`));
  const observedPreviewFeatures = Object.entries(features)
    .filter(([, state]) => state === 'PREVIEW_UNTIL_REAL_WEB_BUILD')
    .map(([feature]) => feature)
    .sort();
  const expectedPreviewFeatures = [...PREVIEW_GAME_FEATURES.keys()].sort();
  const exactPreviewTruth = observedPreviewFeatures.length === expectedPreviewFeatures.length
    && observedPreviewFeatures.every((feature, index) => feature === expectedPreviewFeatures[index]);

  return {
    approvedIds,
    expectedIds,
    candidateId: `game.${ARCADE_CANDIDATE_FEATURE.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`,
    candidateState: features[ARCADE_CANDIDATE_FEATURE],
    exactPreviewTruth,
  };
}

function gameIdsInCard(node, truth) {
  const ids = new Set();
  const idNames = ['data-game-id', 'data-studio-game-id', 'data-game-card-id', 'data-content-id', 'data-record-id', 'data-entry-id', 'data-item-id'];
  const scope = [node, ...descendants(node)];
  for (const candidate of scope) {
    for (const name of idNames) {
      const value = candidate.attrs[name]?.trim();
      if (value?.startsWith('game.')) ids.add(value);
    }
    const componentId = candidate.attrs['data-studio-component'] ?? '';
    for (const gameId of [...truth.expectedIds, truth.candidateId]) {
      const slug = gameId.slice('game.'.length);
      if (componentId.endsWith(`.game.${slug}`)) ids.add(gameId);
    }
  }

  const title = scope.find((candidate) => candidate.tag === 'h2' || candidate.tag === 'h3');
  const normalizedTitle = title ? textOf(title).toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim() : '';
  for (const [feature, expectedTitle] of PREVIEW_GAME_FEATURES) {
    if (normalizedTitle === expectedTitle.toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim()) {
      ids.add(`game.${feature.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`);
    }
  }
  if (normalizedTitle === ARCADE_CANDIDATE_TITLE.toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim()) ids.add(truth.candidateId);
  return ids;
}

function isArcadeCandidateCard(node, truth) {
  const scope = [node, ...descendants(node)];
  const attrs = scope.flatMap(attrValues).join(' ').toLowerCase();
  const text = textOf(node).toLowerCase();
  const ids = gameIdsInCard(node, truth);
  return ids.has(truth.candidateId)
    || attrs.includes(truth.candidateId)
    || attrs.includes('candidate_requires_web_package_audit')
    || attrs.includes('arcade-preview')
    || text.includes(ARCADE_CANDIDATE_TITLE.toLowerCase())
    || text.includes('audit required');
}

function hasNamespacedStorageOperation(html, method, keyNames) {
  const callPattern = new RegExp(`\\b(?:window\\s*\\.\\s*)?localStorage\\s*\\.\\s*${method}\\s*\\(\\s*([$A-Z_a-z][$\\w]*)`, 'giu');
  return [...html.matchAll(callPattern)].some((match) => keyNames.has(match[1]));
}

function companionStorageEvidence(html) {
  const keyPattern = /\b(?:var|let|const)\s+([$A-Z_a-z][$\w]*)\s*=\s*(['"])(toadal:[a-z0-9:_-]+)\2/giu;
  const keyNames = new Set([...html.matchAll(keyPattern)].map((match) => match[1]));
  const reads = hasNamespacedStorageOperation(html, 'getItem', keyNames);
  const writes = hasNamespacedStorageOperation(html, 'setItem', keyNames);
  const minimizedState = /\bminimiz(?:e|ed|ing)\b/iu.test(html);
  return { reads, writes, minimizedState };
}

function isGameLaunchLink(node) {
  if (node.tag !== 'a' && node.attrs.role?.toLowerCase() !== 'link') return false;
  const label = controlLabel(node);
  if (/\b(?:play|launch|start|open|try)\b.{0,24}\b(?:game|now|preview)?\b/i.test(label)) return true;
  const href = node.attrs.href;
  if (!href) return false;
  try {
    const parsed = new URL(decodeEntities(href), VIRTUAL_ORIGIN);
    return /\/(?:play|games?|arcade|launch|cartridges?)(?:\/|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function storeLike(node) {
  const label = `${controlLabel(node)} ${attrValues(node).join(' ')}`;
  if (/\b(?:app[-\s]?store|google\s*play|play\s*store|store\s+links?|itunes|ios|android|download)\b/i.test(label)) return true;
  const href = node.attrs.href ?? '';
  return /(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com|market\.android\.com)/i.test(href);
}

function collectOrigins(root) {
  const origins = new Set();
  for (const node of allNodes(root)) {
    const rel = (node.attrs.rel ?? '').toLowerCase().split(/\s+/);
    const isCanonical = node.tag === 'link' && rel.includes('canonical');
    const isOpenGraph = node.tag === 'meta' && node.attrs.property?.toLowerCase() === 'og:url';
    const isSiteUrl = node.tag === 'meta' && /^(?:site-url|url)$/i.test(node.attrs.name ?? '');
    const isAbsoluteBase = node.tag === 'base' && node.attrs.href && /^[a-z][\w+.-]*:/i.test(node.attrs.href);
    const raw = isCanonical || isAbsoluteBase ? node.attrs.href
      : isOpenGraph || isSiteUrl ? node.attrs.content : null;
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') origins.add(parsed.origin);
    } catch { /* malformed metadata is not treated as an origin */ }
  }
  return origins;
}

function splitSrcset(value) {
  const urls = [];
  let cursor = 0;
  while (cursor < value.length) {
    while (cursor < value.length && /[\s,]/.test(value[cursor])) cursor += 1;
    if (cursor >= value.length) break;
    const start = cursor;
    while (cursor < value.length && !/\s/.test(value[cursor])) cursor += 1;
    let candidate = value.slice(start, cursor);
    while (candidate.endsWith(',')) candidate = candidate.slice(0, -1);
    if (candidate) urls.push(candidate);
    let parentheses = 0;
    while (cursor < value.length) {
      const char = value[cursor];
      if (char === '(') parentheses += 1;
      else if (char === ')') parentheses = Math.max(0, parentheses - 1);
      else if (char === ',' && parentheses === 0) { cursor += 1; break; }
      cursor += 1;
    }
  }
  return urls;
}

function safeDecodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function pageUrlPath(relativeFile, basePath) {
  const rel = relativeFile.replaceAll(path.sep, '/');
  if (rel === 'index.html') return basePath;
  if (rel === '404.html') return `${basePath}404.html`;
  if (rel.endsWith('/index.html')) return `${basePath}${rel.slice(0, -'index.html'.length)}`;
  return `${basePath}${rel}`;
}

function fileForUrlPath(root, pathname, basePath) {
  let normalizedPath = pathname;
  const noSlashBase = basePath === '/' ? '' : basePath.slice(0, -1);
  if (noSlashBase && normalizedPath === noSlashBase) normalizedPath = basePath;
  if (!normalizedPath.startsWith(basePath)) return { outsideBase: true };
  const decoded = safeDecodePath(normalizedPath.slice(basePath.length));
  if (decoded === null) return { invalid: 'URL path contains malformed percent-encoding' };
  const segments = decoded.split('/');
  if (segments.some((part) => part === '..' || part === '.')) return { outsideBase: true };
  const relative = segments.filter(Boolean).join(path.sep);
  const candidate = path.resolve(root, relative);
  const relCheck = path.relative(root, candidate);
  if (relCheck === '..' || relCheck.startsWith(`..${path.sep}`) || path.isAbsolute(relCheck)) return { outsideBase: true };

  let target = candidate;
  try {
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    else if (!fs.existsSync(target) && !path.extname(target)) {
      const routeIndex = path.join(target, 'index.html');
      const routeHtml = `${target}.html`;
      if (fs.existsSync(routeIndex)) target = routeIndex;
      else if (fs.existsSync(routeHtml)) target = routeHtml;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return { missing: relative || 'index.html' };
    const realRoot = fs.realpathSync(root);
    const realTarget = fs.realpathSync(target);
    const realRelative = path.relative(realRoot, realTarget);
    if (realRelative === '..' || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) return { outsideBase: true };
  } catch (error) {
    return { invalid: error.message };
  }
  return { target };
}

function checkUrlTarget(rawValue, context) {
  const raw = decodeEntities(rawValue.trim());
  if (!raw) return null;
  const scheme = raw.match(/^([^:]+):/u)?.[1]?.replace(/[\u0000-\u0020\u007f]/gu, '').toLowerCase();
  if (scheme === 'javascript') return `${context.label}: unsafe javascript: URL ${JSON.stringify(raw)}`;
  if (EXTERNAL_SCHEMES.test(raw)) return null;

  let resolved;
  try {
    resolved = new URL(raw, context.effectiveBase);
  } catch {
    return `${context.label}: malformed URL ${JSON.stringify(raw)}`;
  }

  if (resolved.origin !== context.siteOrigin && !context.origins.has(resolved.origin)) return null;

  const found = fileForUrlPath(context.root, resolved.pathname, context.basePath);
  if (found.outsideBase) return `${context.label}: URL escapes expected base path ${context.basePath}: ${raw}`;
  if (found.invalid) return `${context.label}: ${raw} (${found.invalid})`;
  if (found.missing) return `${context.label}: missing target for ${raw} (resolved ${found.missing})`;
  if (resolved.hash && context.checkFragments !== false) {
    const fragment = safeDecodePath(resolved.hash.slice(1));
    if (fragment === null) return `${context.label}: malformed fragment in ${raw}`;
    const targetHtml = fs.readFileSync(found.target, 'utf8');
    const targetTree = parseHtml(targetHtml);
    const hasTarget = allNodes(targetTree).some((node) => node.attrs.id === fragment
      || node.tag === 'a' && node.attrs.name === fragment);
    if (!hasTarget) return `${context.label}: fragment #${fragment} does not exist in ${path.relative(context.root, found.target)}`;
  }
  return null;
}

function consumeCssString(css, start) {
  const quote = css[start];
  let cursor = start + 1;
  while (cursor < css.length) {
    if (css[cursor] === '\\') cursor += 2;
    else if (css[cursor] === quote) {
      return { value: css.slice(start + 1, cursor), end: cursor + 1 };
    } else cursor += 1;
  }
  return null;
}

function cssReferences(css) {
  const references = [];
  let index = 0;
  while (index < css.length) {
    if (css.startsWith('/*', index)) {
      const commentEnd = css.indexOf('*/', index + 2);
      index = commentEnd < 0 ? css.length : commentEnd + 2;
      continue;
    }

    const importMatch = css.slice(index).match(/^@import\b/iu);
    if (importMatch) {
      let valueStart = index + importMatch[0].length;
      while (valueStart < css.length && /\s/u.test(css[valueStart])) valueStart += 1;
      if (css[valueStart] === '"' || css[valueStart] === "'") {
        const parsed = consumeCssString(css, valueStart);
        if (parsed) {
          references.push({ value: parsed.value, kind: '@import' });
          index = parsed.end;
          continue;
        }
      }
    }

    if (css[index] === '"' || css[index] === "'") {
      const parsed = consumeCssString(css, index);
      index = parsed ? parsed.end : css.length;
      continue;
    }

    const previous = index === 0 ? '' : css[index - 1];
    const urlMatch = css.slice(index).match(/^url(?=\s*\()/iu);
    if (!urlMatch || /[\w-]/u.test(previous)) {
      index += 1;
      continue;
    }
    let openParen = index + urlMatch[0].length;
    while (openParen < css.length && /\s/u.test(css[openParen])) openParen += 1;
    if (css[openParen] !== '(') {
      index += 1;
      continue;
    }
    let valueStart = openParen + 1;
    while (valueStart < css.length && /\s/u.test(css[valueStart])) valueStart += 1;
    let value;
    let closeParen;
    if (css[valueStart] === '"' || css[valueStart] === "'") {
      const parsed = consumeCssString(css, valueStart);
      if (!parsed) { index += 1; continue; }
      let close = parsed.end;
      while (close < css.length && /\s/u.test(css[close])) close += 1;
      if (css[close] !== ')') { index += 1; continue; }
      value = parsed.value;
      closeParen = close;
    } else {
      let valueEnd = valueStart;
      while (valueEnd < css.length && css[valueEnd] !== ')') {
        if (css[valueEnd] === '\\') valueEnd += 1;
        valueEnd += 1;
      }
      if (css[valueEnd] !== ')') { index += 1; continue; }
      value = css.slice(valueStart, valueEnd).trim();
      closeParen = valueEnd;
    }
    references.push({ value, kind: 'url()' });
    index = closeParen + 1;
  }
  return references;
}

function embeddedStyleSheets(html) {
  const styles = [];
  const pattern = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/giu;
  for (const match of html.matchAll(pattern)) styles.push(match[1]);
  return styles;
}

function checkUrlCandidates(candidates, context) {
  let targetCount = 0;
  let targetFailures = 0;
  for (const [raw, label] of candidates) {
    const cssReference = label.includes('[style ') || label.startsWith('<style ');
    const targetContext = {
      ...context,
      checkFragments: context.checkFragments !== false && !cssReference,
      label: `${context.label}: ${label}`,
    };
    const issue = checkUrlTarget(raw, targetContext);
    if (issue) {
      failures.push(issue);
      targetFailures += 1;
    } else {
      try {
        const resolved = new URL(decodeEntities(raw.trim()), targetContext.effectiveBase);
        if (resolved.origin === targetContext.siteOrigin || targetContext.origins.has(resolved.origin)) targetCount += 1;
      } catch { /* malformed URLs are reported by checkUrlTarget */ }
    }
  }
  check(`${context.label}: local URL targets stay within ${context.basePath} and resolve`,
    targetFailures === 0,
    `${targetCount} local URL references checked`);
}

function checkDocumentTargets(file, html, tree, basePath, root) {
  const rel = path.relative(root, file);
  const pagePath = pageUrlPath(rel, basePath);
  const origins = collectOrigins(tree);
  let siteOrigin = VIRTUAL_ORIGIN;
  if (origins.size) siteOrigin = origins.values().next().value;
  const baseNode = allNodes(tree).find((node) => node.tag === 'base' && node.attrs.href);
  let effectiveBase = `${siteOrigin}${pagePath}`;
  if (baseNode) {
    try { effectiveBase = new URL(decodeEntities(baseNode.attrs.href), effectiveBase).href; }
    catch { failures.push(`${rel}: invalid <base href> ${JSON.stringify(baseNode.attrs.href)}`); }
  }
  const context = { root, basePath, siteOrigin, origins, effectiveBase, label: rel };
  const candidates = [];
  for (const node of allNodes(tree)) {
    for (const name of ['href', 'src', 'poster', 'data', 'action', 'formaction', 'xlink:href']) {
      if (hasAttr(node, name)) candidates.push([node.attrs[name], `${node.tag}[${name}]`]);
    }
    if (hasAttr(node, 'srcset')) {
      for (const src of splitSrcset(node.attrs.srcset)) candidates.push([src, `${node.tag}[srcset]`]);
    }
    if (hasAttr(node, 'style')) {
      for (const reference of cssReferences(node.attrs.style)) candidates.push([reference.value, `${node.tag}[style ${reference.kind}]`]);
    }
  }
  for (const [index, css] of embeddedStyleSheets(html).entries()) {
    for (const reference of cssReferences(css)) candidates.push([reference.value, `<style ${index + 1} ${reference.kind}>`]);
  }
  checkUrlCandidates(candidates, context);
}

function checkStylesheetTargets(file, css, basePath, root, siteOrigin, origins) {
  const rel = path.relative(root, file);
  const deployedPath = `${basePath}${rel.replaceAll(path.sep, '/')}`;
  const context = {
    root,
    basePath,
    siteOrigin,
    origins,
    effectiveBase: `${siteOrigin}${deployedPath}`,
    checkFragments: false,
    label: `${rel}: CSS`,
  };
  const candidates = cssReferences(css).map((reference) => [reference.value, reference.kind]);
  checkUrlCandidates(candidates, context);
}

function checkDocumentBasics(label, tree, isHome) {
  const nodes = allNodes(tree);
  const ids = new Map();
  const duplicates = [];
  for (const node of nodes) {
    const id = node.attrs.id;
    if (!id) continue;
    if (ids.has(id)) duplicates.push(id);
    else ids.set(id, node);
  }
  check(`${label}: IDs are unique`, duplicates.length === 0,
    duplicates.length ? `duplicate IDs: ${[...new Set(duplicates)].join(', ')}` : '');

  const h1s = nodes.filter((node) => node.tag === 'h1');
  check(`${label}: exactly one h1`, h1s.length === 1, `found ${h1s.length}`);
  if (isHome) {
    check('Home h1 has the contractual text', h1s.length === 1 && textOf(h1s[0]) === 'Play the Feast World for Free.',
      h1s.length === 1 ? `found ${JSON.stringify(textOf(h1s[0]))}` : 'Home needs exactly one h1');
  }
  check(`${label}: main landmark exists`, nodes.some((node) => node.tag === 'main' || node.attrs.role?.toLowerCase() === 'main'));
  if (isHome) {
    check('Home: header landmark exists', nodes.some((node) => node.tag === 'header' || node.attrs.role?.toLowerCase() === 'banner'));
    check('Home: navigation landmark exists', nodes.some((node) => node.tag === 'nav' || node.attrs.role?.toLowerCase() === 'navigation'));
    check('Home: footer landmark exists', nodes.some((node) => node.tag === 'footer' || node.attrs.role?.toLowerCase() === 'contentinfo'));
  }
}

function runHomeChecks(homeTree, html, truth) {
  const nodes = allNodes(homeTree);
  const sections = SECTION_ORDER.map((marker) => ({ marker, node: sectionNode(nodes, marker) }));
  for (const { marker, node } of sections) check(`Home section wrapper exists: ${marker}`, Boolean(node));
  const present = sections.filter(({ node }) => node);
  const ordered = present.length === SECTION_ORDER.length
    && present.every(({ node }, index) => index === 0 || present[index - 1].node.start < node.start);
  check('Home sections appear in contractual order', ordered,
    present.map(({ marker }) => marker).join(' → '));

  const gamesIntro = sections.find(({ marker }) => marker === 'games-intro')?.node;
  const gameGrid = sections.find(({ marker }) => marker === 'home-game-grid')?.node;
  const cards = gameGrid ? descendants(gameGrid).filter(isGameCard).filter((node) => {
    return !ancestry(node).some((parent) => parent !== gameGrid && isGameCard(parent));
  }) : [];
  const cardIds = cards.map((card) => gameIdsInCard(card, truth));
  const observedIds = cardIds.flatMap((ids) => [...ids]);
  const uniqueObservedIds = new Set(observedIds);
  const exactApprovedCards = cards.length === truth.expectedIds.size
    && cardIds.every((ids) => ids.size === 1 && truth.approvedIds.has([...ids][0]))
    && uniqueObservedIds.size === truth.expectedIds.size
    && [...truth.expectedIds].every((id) => uniqueObservedIds.has(id))
    && truth.approvedIds.size === truth.expectedIds.size;
  check('PUBLIC_FEATURE_STATE confirms exactly four approved PREVIEW games and the Arcade candidate state',
    truth.exactPreviewTruth && truth.approvedIds.size === truth.expectedIds.size
      && truth.candidateState === 'CANDIDATE_REQUIRES_WEB_PACKAGE_AUDIT',
    `approved PREVIEW records: ${[...truth.approvedIds].join(', ') || 'none'}; Arcade state: ${truth.candidateState ?? 'missing'}`);
  check('Home grid contains exactly the four approved PREVIEW game cards', exactApprovedCards,
    `found ${cards.length}; identified ${[...uniqueObservedIds].join(', ') || 'none'}; expected ${[...truth.expectedIds].join(', ')}`);
  const arcadeCards = cards.filter((card) => isArcadeCandidateCard(card, truth));
  check('Home grid contains no TOADAL FEAST Arcade candidate card', arcadeCards.length === 0,
    arcadeCards.length ? `${arcadeCards.length} Arcade candidate card(s) found` : '');

  if (cards.length) {
    const invalidPreview = [];
    const launchLinks = [];
    cards.forEach((card, index) => {
      const label = `game card ${index + 1}${cardIds[index].size ? ` (${[...cardIds[index]].join(', ')})` : ''}`;
      const text = textOf(card);
      if (!/\bpreview\b/i.test(text)) invalidPreview.push(`${label}: visible PREVIEW state missing`);
      const links = [card, ...descendants(card)].filter(isGameLaunchLink);
      if (links.length) launchLinks.push(`${label}: ${links.length} launch link(s)`);
    });
    check('Every game card visibly says PREVIEW and is non-playable', invalidPreview.length === 0 && launchLinks.length === 0,
      [...invalidPreview, ...launchLinks].join('; ') || `${cards.length} cards have visible PREVIEW state and no launch link`);
  } else {
    check('Every game card visibly says PREVIEW and is non-playable', false, 'no candidate game cards found');
  }

  const categoryControls = gamesIntro ? descendants(gamesIntro).filter(isCategoryControl) : nodes.filter(isCategoryControl);
  const categoryValues = new Set(categoryControls.map((node) => node.attrs['data-game-tab']?.trim().toLowerCase()).filter(Boolean));
  const hasThreeCategories = ['all', 'preview', 'public'].every((value) => categoryValues.has(value));
  check('Games intro exposes All, Preview, and Playable now category controls', categoryControls.length >= 3 && hasThreeCategories,
    `found ${categoryControls.length}; values: ${[...categoryValues].join(', ') || 'none'}`);

  const searchInputs = nodes.filter(isSearchInput);
  const searchPair = searchInputs.map((input) => ({ input, ...findSearchRegion(input, nodes) })).find((pair) => pair.region && pair.button);
  check('Search input and button are present', Boolean(searchPair),
    searchPair ? '' : `found ${searchInputs.length} search input(s); no associated Search button`);
  if (searchPair) {
    check('Search input is disabled', isDisabled(searchPair.input));
    check('Search button is disabled', isDisabled(searchPair.button));
    const explanation = textOf(searchPair.region);
    check('Search has a visible not-live explanation', /\bnot\s+(?:yet\s+)?live(?:\s+yet)?\b|\bnot available\b|\bcoming soon\b|\bplanned\b|\bdisabled\b|\bunavailable\b/i.test(explanation),
      'no not-live/unavailable explanation is visible with the controls');
  }

  const appSection = sections.find(({ marker }) => marker === 'app-conversion')?.node;
  const storeControls = appSection ? descendants(appSection).filter((node) => storeLike(node)
    && (node.tag === 'a' || isControl(node) || ['link', 'button'].includes(node.attrs.role?.toLowerCase()))) : [];
  check('App conversion exposes store controls in a verifiable disabled state', storeControls.length > 0,
    'no App Store / Google Play / download control found');
  const activeStores = [];
  const inventedStores = [];
  storeControls.forEach((node) => {
    const label = controlLabel(node) || `<${node.tag}>`;
    if (!isDisabled(node)) activeStores.push(label);
    const href = node.attrs.href;
    if (href) {
      try {
        const url = new URL(decodeEntities(href), VIRTUAL_ORIGIN);
        if (url.origin !== VIRTUAL_ORIGIN) inventedStores.push(`${label}: ${href}`);
      } catch { inventedStores.push(`${label}: malformed destination ${href}`); }
    }
  });
  check('App/store controls are disabled', activeStores.length === 0, activeStores.join(', '));
  check('No invented external app/store destination is present', inventedStores.length === 0, inventedStores.join('; '));

  const companionSection = sections.find(({ marker }) => marker === 'companion')?.node;
  const companionNodes = companionSection ? [companionSection, ...descendants(companionSection)] : [];
  const companionControl = companionNodes.find((node) => isControl(node)
    && /companion|toadal/i.test(`${controlLabel(node)} ${attrValues(node).join(' ')}`));
  check('Toadal companion control exists', Boolean(companionControl));
  const hasStateMarker = companionNodes.some((node) => Object.keys(node.attrs).some((name) =>
    /^data-companion-(?:state|zone|reaction|intent)$/i.test(name)))
    || /companion[\w-]{0,40}(?:state|zone|reaction)|(?:state|zone|reaction)[\w-]{0,40}companion/i.test(html);
  check('Toadal companion state plumbing marker exists', hasStateMarker);
  const storageEvidence = companionStorageEvidence(html);
  const persistedMinimizedState = storageEvidence.reads && storageEvidence.writes && storageEvidence.minimizedState;
  check('Toadal companion persists minimized state with namespaced localStorage get/set calls', persistedMinimizedState,
    `namespaced read: ${storageEvidence.reads ? 'yes' : 'missing'}; namespaced write: ${storageEvidence.writes ? 'yes' : 'missing'}; minimized state: ${storageEvidence.minimizedState ? 'yes' : 'missing'}`);
}

function collectExportFiles(root, extensionPattern) {
  const files = [];
  const visit = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && extensionPattern.test(entry.name)) files.push(file);
    }
  };
  visit(root);
  return files;
}

function regularFileWithinRoot(root, file) {
  try {
    if (!fs.lstatSync(file).isFile()) return false;
    const realRoot = fs.realpathSync(root);
    const realFile = fs.realpathSync(file);
    const relative = path.relative(realRoot, realFile);
    return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  } catch {
    return false;
  }
}

function main() {
  if (process.argv.length !== 4) usage();
  const exportDir = path.resolve(process.argv[2]);
  let basePath;
  try { basePath = normalizeBasePath(process.argv[3]); }
  catch (error) {
    console.error(`Invalid BASE_PATH: ${error.message}`);
    process.exit(2);
  }

  check('Static export directory exists', fs.existsSync(exportDir) && fs.statSync(exportDir).isDirectory(), exportDir);
  if (!fs.existsSync(exportDir) || !fs.statSync(exportDir).isDirectory()) {
    console.error('WO-001 HOME VERIFY FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  const root = fs.realpathSync(exportDir);
  const docs = new Map();
  const htmlFiles = collectExportFiles(root, /\.html$/iu);
  const htmlByRelativePath = new Map(htmlFiles.map((file) => [path.relative(root, file).replaceAll(path.sep, '/'), file]));
  for (const name of ['index.html', '404.html']) {
    const file = path.join(root, name);
    const exists = regularFileWithinRoot(root, file);
    check(`Static export contains ${name}`, exists, exists ? '' : file);
  }
  for (const [rel, file] of htmlByRelativePath) {
    if (!regularFileWithinRoot(root, file)) {
      check(`${rel}: HTML file is a regular file contained by the export`, false);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const tree = parseHtml(html);
    docs.set(rel, { file, html, tree });
    if (rel === 'index.html' || rel === '404.html') checkDocumentBasics(rel, tree, rel === 'index.html');
    checkDocumentTargets(file, html, tree, basePath, root);
  }

  const home = docs.get('index.html');
  if (home) {
    try {
      runHomeChecks(home.tree, home.html, readPublicGameTruth());
    } catch (error) {
      check('PUBLIC_FEATURE_STATE can be read for Home preview verification', false, error.message);
    }
  }

  const homeOrigins = home ? collectOrigins(home.tree) : new Set();
  const siteOrigin = homeOrigins.values().next().value ?? VIRTUAL_ORIGIN;
  for (const file of collectExportFiles(root, /\.css$/iu)) {
    if (!regularFileWithinRoot(root, file)) {
      check(`${path.relative(root, file)}: stylesheet is a regular file contained by the export`, false);
      continue;
    }
    checkStylesheetTargets(file, fs.readFileSync(file, 'utf8'), basePath, root, siteOrigin, homeOrigins);
  }

  if (failures.length) {
    console.error(`WO-001 HOME VERIFY FAIL (${failures.length} failed check(s))`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`WO-001 HOME VERIFY PASS (${passes} checks)`);
  console.log(`Export: ${root}`);
  console.log(`Base path: ${basePath}`);
}

main();
