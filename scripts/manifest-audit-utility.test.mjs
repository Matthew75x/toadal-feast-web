import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const root = process.cwd();
const site = path.join(root, 'studio-project', 'toadal-feast-website');
const assets = JSON.parse(fs.readFileSync(path.join(site, 'assets', 'index.json'), 'utf8')).assets;
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);

function page(slug) {
  return JSON.parse(fs.readFileSync(path.join(site, 'pages', `${slug}.json`), 'utf8'));
}

// Remove only owner-editor metadata attributes for semantic contract matching.
function semanticMarkup(markup) {
  return markup.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/\sdata-studio-(?:component|edit-field)=(['"])[^'"]*\1/g, ''));
}

function projectableMarkup(record) {
  return record.components
    .filter((component) => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map((component) => semanticMarkup(projectPage(site, { ...record, components: [component] })))
    .join('\n');
}

function html(slug) {
  return projectableMarkup(page(slug));
}

test('Community exposes feed and guidelines previews without fabricated social activity', () => {
  const content = html('community');
  assert.match(content, /id='community-feed-preview'/);
  assert.match(content, /No community posts are published/);
  assert.match(content, /no posts, creator profiles, reactions, or activity counts/i);
  assert.match(content, /id='community-guidelines'/);
  assert.match(content, /Guidelines are awaiting approved publication/);
  assert.match(content, /<button type='button' disabled>Posting unavailable<\/button>/);
  assert.doesNotMatch(content, /<form\b/i);
});

test('Store updates lead to News and Roadmap without implying a subscription', () => {
  const content = html('store');
  assert.match(content, /href='\/news\/'/);
  assert.match(content, /href='\/roadmap\/'/);
  assert.match(content, /no store mailing list or subscription service/i);
  assert.match(content, /neither link signs you up for messages/i);
  assert.match(content, /Checkout unavailable/);
  assert.doesNotMatch(content, /href='[^']*(?:checkout|cart|buy|payment)[^']*'/i);
});

test('About supplies required page structure while leaving mission and philosophy unpublished', () => {
  const content = html('about');
  assert.match(content, /id='about-mission'/);
  assert.match(content, /id='about-philosophy'/);
  assert.match(content, /Approved copy awaiting publication/);
  assert.match(content, /id='about-stories-characters'/);
  assert.match(content, /href='\/stories\/'/);
  assert.match(content, /href='\/characters\/'/);
  assert.match(content, /TOADAL GAMES is the studio identity/);
  assert.match(content, /public experience remains TOADAL FEAST-first/);
});

test('Legal includes a last-updated slot without inventing a policy date or text', () => {
  const content = html('legal');
  assert.match(content, /id='legal-last-updated-title'/);
  assert.match(content, /Policy publication date:[\s\S]*?Not published/);
  assert.match(content, /No policy date is shown because approved Privacy Policy and Terms text has not been published/);
  assert.match(content, /APPROVED COPY REQUIRED/);
  assert.match(content, /Approved policy text is not published/);
});

test('App retains real gameplay, distinguishes web and app, and uses the approved app icon only as app art', () => {
  const content = html('app');
  for (const capture of ['arcade-real-gameplay.webp', 'puzzle-real-gameplay.webp', 'feastfall-real-gameplay.webp']) {
    assert.ok(content.includes(capture), `retains genuine ${capture}`);
  }
  assert.match(content, /<h2>The complete adventure<\/h2>[\s\S]*?mobile app/);
  assert.match(content, /<h2>Explore while you wait<\/h2>[\s\S]*?website remains the place/);
  assert.match(content, /<h2 id='infinite-mode-title'>Infinite<\/h2>/);
  assert.match(content, /<strong>Infinite Feasts:<\/strong> Food is overrunning the land\. Assign friends, reclaim plots, and expand carefully\./);
  assert.match(content, /its own Colony Coins/);
  assert.match(content, /GAMEPLAY CAPTURE NOT AVAILABLE/);
  assert.match(content, /<h1>Take the whole Feast with you<\/h1>/);
  assert.match(content, /<figure class='app-icon-figure'><img\b(?=[^>]*\sclass='app-icon-image')(?=[^>]*\ssrc='\/assets\/images\/app\/approved-app-icon\.webp')(?=[^>]*\salt='TOADAL FEAST mobile app icon')(?=[^>]*\swidth='256')(?=[^>]*\sheight='256')(?=[^>]*\sloading='lazy')[^>]*>/);
  assert.equal((content.match(/\/assets\/images\/app\/approved-app-icon\.webp/g) || []).length, 1,
    'approved external icon is used once in the App icon slot');
  assert.doesNotMatch(content, /class='(?:site-logo|brandmark|toadal-mascot)[^']*'[^>]*src='\/assets\/images\/app\/approved-app-icon\.webp'/i);
  const approvedIcon = assets.find((asset) => asset.id === 'asset.app.approved-icon');
  assert.ok(approvedIcon, 'approved app icon is registered in the asset catalog');
  assert.equal(approvedIcon.source, 'reference/assets/images/app/approved-app-icon.webp');
  assert.equal(approvedIcon.width, 256);
  assert.equal(approvedIcon.height, 256);
  assert.equal(approvedIcon.bytes, 120158);
  assert.equal(approvedIcon.sha256, '7c1ba16ae5ab67c2ab2297c3ca84ad9f313b82627d17673efc578e45ee201a44');
  assert.equal(approvedIcon.authoritySha256, 'c7fb79e1d466f417e3c8f374450b81ecf8d183ad6bdabe3eabb62c642fb17b7e');
  assert.deepEqual(approvedIcon.renderTargets, ['website-app-page']);
  assert.match(content, /No public app trailer is available yet/);
  assert.doesNotMatch(content, /(?:src|href)='[^']*infinite[^']*\.(?:png|jpe?g|webp|mp4)/i);
});
