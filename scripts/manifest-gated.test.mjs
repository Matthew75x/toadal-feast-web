import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const root = process.cwd();
const pagesDir = path.join(root, 'studio-project', 'toadal-feast-website', 'pages');
const projectRoot = path.dirname(pagesDir);
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);
const expectedPages = {
  app: '/app/',
  account: '/account/',
  community: '/community/',
  store: '/store/',
  contact: '/contact/',
  about: '/about/',
  'coming-soon': '/coming-soon/',
  legal: '/legal/',
  404: '/404.html'
};

function page(slug) {
  return JSON.parse(fs.readFileSync(path.join(pagesDir, `${slug}.json`), 'utf8'));
}

// Remove only owner-editor metadata attributes for semantic contract matching.
function semanticMarkup(markup) {
  return markup.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/\sdata-studio-(?:component|edit-field)=(['"])[^'"]*\1/g, ''));
}

function projectedMarkup(record) {
  return record.components.map(component => {
    if (component.props?.authoringVersion || typeof component.props?.html === 'string') {
      return semanticMarkup(projectPage(projectRoot, { ...record, components: [component] }));
    }
    return JSON.stringify(component.props || {});
  }).join('\n');
}

function html(slug) {
  return projectedMarkup(page(slug));
}

test('all lane-owned manifest pages have valid route records and authored content', () => {
  for (const [slug, route] of Object.entries(expectedPages)) {
    const record = page(slug);
    assert.equal(record.id, `page.${slug}`);
    assert.equal(record.route, route);
    assert.equal(record.publicationState, 'noindex');
    assert.ok(record.components.length > 0, `${slug} has at least one component`);
    assert.ok(html(slug).trim().length > 0, `${slug} has page content`);
  }
});

test('App shows all four genuine mobile modes without inventing an Infinite capture', () => {
  const content = html('app');
  for (const mode of ['Arcade', 'Puzzle', 'Feastfall', 'Infinite']) assert.match(content, new RegExp(`<h[23][^>]*>${mode}</h[23]>`));
  for (const capture of ['arcade-real-gameplay.webp', 'puzzle-real-gameplay.webp', 'feastfall-real-gameplay.webp']) {
    assert.ok(content.includes(capture), `retains the existing ${capture} capture`);
  }
  assert.match(content, /no approved Infinite gameplay capture yet/i);
  assert.doesNotMatch(content, /(?:src|href)='[^']*infinite[^']*\.(?:png|jpe?g|webp|mp4)/i);
  assert.match(content, /App Store[\s\S]*?disabled/);
  assert.match(content, /Google Play[\s\S]*?disabled/);
  assert.match(content, /Why official downloads are unavailable/);
  assert.match(content, /data-companion-action-copy='Official App Store and Google Play destinations are not configured yet\./);
});

test('Account keeps auth gated and reads live browser-local guest status', () => {
  const content = html('account');
  assert.match(content, /<button type='button' disabled>Create free account/);
  assert.match(content, /<button type='button' disabled>Log in/);
  assert.match(content, /data-progression-page='account'/);
  assert.match(content, /data-progression-storage-status(?:='')? role='status' aria-live='polite'/);
  assert.match(content, /href='\/profile\//);
  assert.match(content, /href='\/feast-pass\//);
  assert.match(content, /data-companion-action-copy='Account sign-up, login, and sync are not connected\./);
  const runtime = fs.readFileSync(path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'js', 'guest-progression.js'), 'utf8');
  assert.match(runtime, /querySelectorAll\('\[data-progression-page\]'\)/);
  assert.match(runtime, /querySelector\('\[data-progression-storage-status\]'\)/);
});

test('Community and Store keep real actions disabled and offer working guide links', () => {
  const community = html('community');
  assert.doesNotMatch(community, /<form\b/i);
  assert.match(community, /<button type='button' disabled>Posting unavailable<\/button>/);
  assert.match(community, /data-companion-action-copy='Community posting is unavailable/);
  assert.match(community, /href='\/stories\/'/);
  assert.match(community, /href='\/media\/'/);

  const store = html('store');
  assert.doesNotMatch(store, /<form\b/i);
  assert.match(store, /<button type='button' disabled>Checkout unavailable<\/button>/);
  assert.match(store, /no public products, prices, or checkout flows/i);
  assert.doesNotMatch(store, /href='[^']*(?:checkout|cart|buy|payment)[^']*'/i);
  assert.match(store, /data-companion-action-copy='Checkout is unavailable/);
  assert.match(store, /href='\/play\/'/);
});

test('Contact presents all manifest fields but every data-entry and submit control is disabled', () => {
  const content = html('contact');
  for (const field of ['Category', 'Email', 'Subject', 'Message', 'diagnostics', 'Attachment']) assert.ok(content.includes(field));
  const form = content.match(/<form\b[\s\S]*?<\/form>/i)?.[0] || '';
  assert.ok(form, 'contact preview has a non-submitting form structure');
  const controls = form.match(/<(?:input|select|textarea|button)\b[^>]*>/gi) || [];
  assert.ok(controls.length >= 7, 'includes category, email, subject, message, diagnostics, attachment and submit');
  for (const tag of controls) assert.match(tag, /\bdisabled\b/i, `control is disabled: ${tag}`);
  assert.doesNotMatch(form, /<form\b[^>]*\baction\s*=/i);
  assert.doesNotMatch(content, /onsubmit\s*=|mailto:|https?:\/\/[^\s'\"]+/i);
  assert.match(content, /All fields are disabled; nothing is entered, stored, or sent here\./);
  assert.match(content, /data-companion-action-copy='Contact stays disabled/);
  assert.match(content, /href='\/support\/'/);
  assert.match(content, /href='\/about\/'/);
  assert.match(content, /href='\/legal\/'/);
});

test('About, construction, legal and 404 remain truthful and useful', () => {
  const about = html('about');
  assert.match(about, /TOADAL GAMES is the studio identity/);
  assert.match(about, /public experience remains TOADAL FEAST-first/);
  assert.match(about, /href='\/play\/'/);
  assert.match(about, /href='\/contact\/'/);

  const construction = html('coming-soon');
  assert.match(construction, /No release promise is implied/);
  assert.doesNotMatch(construction, /\b20\d{2}\b/);
  for (const destination of ['/play/', '/world/', '/stories/', '/feast-pass/']) assert.ok(construction.includes(`href='${destination}'`));
  assert.match(construction, /data-companion-reaction='construction'/);

  const legal = html('legal');
  assert.match(legal, /APPROVED COPY REQUIRED/);
  assert.match(legal, /Privacy Policy[\s\S]*?NOT PUBLISHED/);
  assert.match(legal, /Terms[\s\S]*?NOT PUBLISHED/);
  assert.match(legal, /not a replacement for a privacy policy/i);
  assert.match(legal, /No verified privacy mailbox is configured/);

  const notFound = page('404');
  const buttons = notFound.components.flatMap(component => component.props?.children || []);
  for (const destination of ['/', '/play/', '/world/', '/stories/', '/search/']) {
    assert.ok(buttons.some(button => button.props?.href === destination), `404 links to ${destination}`);
  }
  assert.ok(buttons.length > 0, '404 provides button-based recovery actions');
});

test('enabled unavailable-action guides use the shared construction semantics', () => {
  for (const slug of ['app', 'account', 'community', 'store', 'contact']) {
    const content = html(slug);
    assert.match(content, /<a\b(?=[^>]*\shref='\/coming-soon\/')(?=[^>]*\sdata-companion-context='under-construction')(?=[^>]*\sdata-companion-action(?:=''|(?=\s|>)))(?=[^>]*\sdata-companion-action-copy=)[^>]*>/, `${slug} has an actionable construction guide`);
  }
});
