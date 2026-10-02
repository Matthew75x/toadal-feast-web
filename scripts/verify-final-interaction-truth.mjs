#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const pagesIndex = JSON.parse(fs.readFileSync(path.join(site, 'pages', 'index.json'), 'utf8'));
const featureState = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'implementation', 'PUBLIC_FEATURE_STATE.json'), 'utf8'));
const contentRegistry = JSON.parse(fs.readFileSync(path.join(site, 'content', 'registry.json'), 'utf8'));

const failures = [];
const notes = [];
const pages = new Map();

for (const record of pagesIndex.pages || []) {
  const file = path.join(site, record.file);
  if (!fs.existsSync(file)) continue;
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const html = (doc.components || []).map((component) => component?.props?.html || '').join('\n');
  pages.set(record.route, {record, doc, html});
}

const strip = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const hasAttr = (tag, name) => new RegExp('\\b' + name + '(?:\\s*=|\\b)', 'i').test(tag);

function interactives(html) {
  const out = [];
  for (const match of html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const tag = '<' + match[1] + match[2] + '>';
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    out.push({
      kind: match[1].toLowerCase(),
      tag,
      text: strip(match[3]),
      href: hrefMatch ? hrefMatch[1] : '',
      disabled: hasAttr(tag, 'disabled') || /aria-disabled\s*=\s*["']true["']/i.test(tag)
    });
  }
  return out;
}

for (const [route, page] of pages) {
  for (const item of interactives(page.html)) {
    if (item.kind === 'a' && (!item.href || item.href === '#' || /^javascript:/i.test(item.href))) {
      failures.push(route + ': dead/placeholder anchor "' + item.text + '" -> ' + JSON.stringify(item.href));
    }
  }
}

function requireRoute(route) {
  const page = pages.get(route);
  if (!page) failures.push('Required truth-state route missing: ' + route);
  return page;
}

function assertNoActiveAction(route, pattern, reason) {
  const page = requireRoute(route);
  if (!page) return;
  const offenders = interactives(page.html).filter((item) => pattern.test(item.text) && !item.disabled);
  for (const item of offenders) failures.push(route + ': active "' + item.text + '" violates ' + reason);
}

const features = featureState.features || {};
if (features.accountAuthentication !== 'PUBLIC') {
  assertNoActiveAction('/account/', /\b(create|sign\s*up|log\s*in|login|sign\s*in)\b/i, 'accountAuthentication=' + features.accountAuthentication);
}
if (features.storeCheckout !== 'PUBLIC') {
  assertNoActiveAction('/store/', /\b(buy|checkout|purchase|add to cart|order now)\b/i, 'storeCheckout=' + features.storeCheckout);
}
if (features.communityPosting !== 'PUBLIC') {
  assertNoActiveAction('/community/', /\b(post|upload|submit|publish)\b/i, 'communityPosting=' + features.communityPosting);
}
if (String(features.appStoreButtons || '').startsWith('DISABLED')) {
  assertNoActiveAction('/app/', /\b(app store|google play|get it on|download on)\b/i, 'appStoreButtons=' + features.appStoreButtons);
}

const contact = requireRoute('/contact/');
if (contact) {
  const submits = interactives(contact.html).filter((item) => item.kind === 'button' && /submit|send/i.test(item.text));
  const formHasRealAction = /<form\b[^>]*\baction\s*=\s*["']https?:\/\//i.test(contact.html);
  const formHasRuntimeHook = /<form\b[^>]*\bdata-[^>]*(?:contact|form|submit)/i.test(contact.html);
  if (!formHasRealAction && !formHasRuntimeHook) {
    for (const item of submits) if (!item.disabled) failures.push('/contact/: submit is active without a verified action/runtime hook.');
  }
}

const legal = requireRoute('/legal/');
if (legal && (!Array.isArray(contentRegistry.legalDocuments) || contentRegistry.legalDocuments.length === 0)) {
  if (!/not published|approved .* required|approved .* not/i.test(legal.html)) {
    failures.push('/legal/: legalDocuments is empty but the route does not clearly disclose unpublished/approval-required legal copy.');
  }
}

for (const route of ['/account/', '/community/', '/store/', '/contact/', '/legal/', '/coming-soon/']) {
  const page = requireRoute(route);
  if (!page) continue;
  if (!/data-companion-context\s*=/.test(page.html)) failures.push(route + ': missing companion semantic context.');
}

const construction = requireRoute('/coming-soon/');
if (construction) {
  if (!/data-companion-reaction\s*=\s*["']construction["']/i.test(construction.html)) {
    failures.push('/coming-soon/: missing explicit construction companion reaction.');
  }
  const internalExits = interactives(construction.html).filter((item) => item.kind === 'a' && /^\/(?!\/)/.test(item.href));
  if (internalExits.length < 3) failures.push('/coming-soon/: must provide at least 3 useful internal escape routes.');
  if (/maintenance\.webp/i.test(construction.html) &&
      !/data-companion-context\s*=\s*["']under-construction["']/i.test(construction.html) &&
      !/data-companion-reaction\s*=\s*["']construction["']/i.test(construction.html)) {
    failures.push('/coming-soon/: maintenance.webp may only be used in a genuine under-construction/maintenance context.');
  }
}

const app = requireRoute('/app/');
if (app) {
  for (const mode of ['Arcade', 'Puzzle', 'Feastfall', 'Infinite']) {
    if (!new RegExp('\\b' + mode + '\\b', 'i').test(strip(app.html))) failures.push('/app/: missing required app mode presentation: ' + mode);
  }
}

const futureStateRoutes = ['/account/', '/community/', '/store/', '/coming-soon/'];
for (const route of futureStateRoutes) {
  const page = pages.get(route);
  if (!page) continue;
  const liveAlternatives = interactives(page.html).filter((item) => item.kind === 'a' && /^\/(?!\/)/.test(item.href));
  if (!liveAlternatives.length) failures.push(route + ': future-state page has no working internal alternative action.');
}

notes.push('pagesScanned=' + pages.size);
notes.push('legalDocuments=' + (Array.isArray(contentRegistry.legalDocuments) ? contentRegistry.legalDocuments.length : 0));

if (failures.length) {
  console.error('FINAL INTERACTION/TRUTH CHECK: FAIL');
  for (const failure of failures) console.error('- ' + failure);
  console.error('Notes: ' + notes.join(', '));
  process.exit(1);
}

console.log('FINAL INTERACTION/TRUTH CHECK: PASS');
console.log(notes.join('\n'));
