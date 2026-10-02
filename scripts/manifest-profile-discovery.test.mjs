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
const approvedCharacters = [
  'toadal', 'princess-lily', 'genie-sweet', 'genie-fruity',
  'genie-savoury', 'gulper', 'gully'
];

// Remove only owner-editor metadata attributes for semantic contract matching.
function semanticMarkup(markup) {
  return markup.replace(/<[a-z][^>]*>/gi, (tag) =>
    tag.replace(/\sdata-studio-(?:component|edit-field)=(['"])[^'"]*\1/g, ''));
}

function authoredMarkup(filename) {
  const page = JSON.parse(fs.readFileSync(path.join(pagesDir, filename), 'utf8'));
  assert.equal(page.components.length, 1, `${filename} has one authored rich-text component`);
  const html = semanticMarkup(projectPage(projectRoot, { ...page, components: [page.components[0]] }));
  assert.equal(typeof html, 'string', `${filename} exposes authored renderer HTML`);
  return html;
}

test('Profile exposes guest identity, current local title, route visits, achievements, and collection hooks', () => {
  const html = authoredMarkup('profile.json');
  assert.match(html, /data-progression-page='profile'/);
  assert.match(html, /class='guest-profile-avatar' aria-hidden='true'>G<\/span>/);
  assert.match(html, /Guest Feaster/);
  assert.match(html, /non-identifying label for this browser/);
  assert.match(html, /data-progression-stat='selected-title'[^>]*>No title selected<\/dd>/);
  assert.match(html, /data-progression-stat='route-visits'/);
  assert.match(html, /data-progression-stat='character-discoveries'/);
  assert.match(html, /data-progression-discovery-list/);
  assert.match(html, /data-progression-character-list/);
  assert.match(html, /data-progression-achievement-list/);
  assert.match(html, /data-progression-collection-list/);
  assert.match(html, /data-progression-storage-status/);
  const settings = html.match(/<section class='progression-section' data-companion-context='settings'[\s\S]*?<\/section>/)?.[0];
  assert.ok(settings, 'Profile has an appearance settings section with settings companion context');
  assert.match(settings, /data-companion-copy='[^']*CSS animations[^']*'/);
  assert.match(settings, /<h2 id='profile-display-settings-title'>Display settings<\/h2>/);
  assert.match(settings, /<input type='checkbox' id='site-motion-toggle' data-site-motion-toggle(?:='')?> Reduce site CSS animations in this tab/);
  assert.match(settings, /only in this browser tab and is not saved as a preference/);
  assert.match(settings, /operating-system reduced-motion preferences are always respected/);
  assert.doesNotMatch(settings, /sound|audio|localStorage|persist/i);
  assert.match(html, /A visit does not mean a world was completed, a story was read, or a character’s story or canon was discovered/);
  assert.match(html, /Artwork views are browser-local discovery records/);
  assert.match(html, /claimed local badges only/);
  assert.match(html, /game or connected achievements are represented as earned/);
  assert.match(html, /No local badges have been claimed in this browser/);
  assert.doesNotMatch(html, /tracking not connected yet/i);
});

test('Characters provides one accessible artwork-view discovery control and status per approved record', () => {
  const html = authoredMarkup('characters.json');
  assert.match(html, /<article class='character-family-page characters-page' data-progression-page='characters'/);
  assert.match(html, /Browse character previews/);
  assert.match(html, /Filter character previews/);
  assert.match(html, /data-progression-stat='character-discoveries'/);
  assert.match(html, /This records an artwork view only; it does not mean game, story, or canonical character completion/);
  assert.ok(html.includes('Guest website progression is active on this browser'), 'existing rendered source freshness phrase is preserved exactly');

  const cards = [...html.matchAll(/<(article|a) class='character-card(?: [^']*)?'[\s\S]*?<\/\1>/g)].map(match => match[0]);
  const authoredButtons = [...html.matchAll(/data-discover-character='([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(authoredButtons, approvedCharacters, 'the only whole-card artwork discovery controls target the seven approved records');
  const controls = [];
  for (const slug of approvedCharacters) {
    const card = cards.find(candidate => candidate.includes(`data-discover-character='${slug}'`));
    assert.ok(card, `approved character ${slug} has a card discovery control`);
    assert.equal((card.match(new RegExp(`data-discover-character='${slug}'`, 'g')) || []).length, 1, `${slug} has one control`);
    assert.equal((card.match(new RegExp(`data-character-discovery-status='${slug}'`, 'g')) || []).length, 1, `${slug} has one matching status`);
    const opening = card.slice(0, card.indexOf('>') + 1);
    assert.match(opening, new RegExp(`data-discover-character='${slug}'`), 'the visual card itself owns the real discovery binding');
    if (slug === 'toadal') {
      assert.match(opening, /^<a\b/);
      assert.match(opening, /href='\/characters\/toadal\/'/, 'the whole published-profile card remains a real navigation link');
    } else {
      assert.match(opening, /role='button'/);
      assert.match(opening, /tabindex='0'/);
      assert.match(opening, /aria-label='Discover [^']+ artwork'/);
    }
    assert.doesNotMatch(card, /<button[^>]*data-discover-character|Mark artwork viewed/, 'no redundant discovery button is introduced');
    assert.match(card, new RegExp(`<p class='character-card-state' data-character-discovery-status='${slug}' role='status' aria-live='polite'[^>]*>Not discovered in this browser<\\/p>`));
    controls.push(slug);
  }
  assert.deepEqual(controls, approvedCharacters);
  assert.equal(new Set(controls).size, 7);

  const futureCard = cards.find(card => card.includes('data-character-group=\'future\''));
  assert.ok(futureCard, 'future character slot remains present');
  assert.doesNotMatch(futureCard, /data-discover-character|data-character-discovery-status/);
  assert.doesNotMatch(html, /tracking not connected yet/i);
});
