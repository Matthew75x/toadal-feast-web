import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createOwnerNativeProjector } from './lib/owner-native-projection.mjs';

const require = createRequire(import.meta.url);
const worldDiscovery = require('../studio-project/toadal-feast-website/reference/assets/js/world-discovery.js');
const progression = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const project = path.join(process.cwd(), 'studio-project/toadal-feast-website');
const studioRoot = process.env.TOADAL_STUDIO_ROOT;
const projectPage = await createOwnerNativeProjector(studioRoot);

function readPage(name) {
  return JSON.parse(fs.readFileSync(path.join(project, 'pages', name), 'utf8'));
}

function pageHtml(name) {
  const page = readPage(name);
  return page.components
    .filter((component) => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map((component) => projectPage(project, { ...page, components: [component] }))
    .join('\n');
}

test('world atlas uses approved environment records, locks unknown slots, and surfaces real route discovery', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(project, 'content/registry.json'), 'utf8'));
  const page = readPage('world.json');
  const markup = page.components
    .filter((component) => component.props?.authoringVersion || typeof component.props?.html === 'string')
    .map((component) => projectPage(project, { ...page, components: [component] }))
    .join('\n');
  assert.deepEqual(registry.worlds, []);
  assert.deepEqual(registry.locations, []);
  for (const title of ['Candy Kingdom environment art', 'Candy-land scenic art', 'Forest portal environment art']) {
    assert.ok(registry.media.some((entry) => entry.title === title && entry.publicationState === 'PREVIEW'));
    assert.ok(markup.includes(title));
  }
  assert.equal((markup.match(/LOCKED · location details unavailable/g) || []).length, 2);
  assert.match(markup, /data-world-visit-meter/);
  assert.match(markup, /data-world-visit-status/);
  const shell = fs.readFileSync(path.join(project, 'reference/assets/js/manifest-shell.js'), 'utf8');
  assert.match(shell, /load\('world-discovery\.js'\)/);
  for (const route of ['/world/', '/characters/', '/characters/toadal/']) assert.ok(shell.includes("'" + route + "'"));

  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const store = progression.createStore({ storage, definitions });
  assert.equal(worldDiscovery.getVisitProgress(store.getSnapshot()).value, 0);
  assert.equal(store.recordEvent('route:/world/'), true);
  assert.equal(store.recordEvent('route:/world/'), false);
  assert.deepEqual(worldDiscovery.getVisitProgress(store.getSnapshot()), {
    value: 1,
    max: 1,
    available: true,
    message: 'World preview visit recorded in this browser · 1 of 1 available site discoveries.',
  });
  assert.deepEqual(JSON.parse(values.get(progression.KEYS.discoveries)).items, ['world-page-preview']);
});

test('characters and Toadal keep registry-backed cast, filters, and explicit unpublished canon slots', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(project, 'content/registry.json'), 'utf8'));
  const characters = pageHtml('characters.json');
  const toadal = pageHtml('toadal-profile.json');
  const publishedCast = registry.characters.filter((entry) => entry.publicationState === 'PREVIEW');
  assert.equal(publishedCast.length, 7);
  for (const entry of publishedCast) assert.ok(characters.includes(entry.displayName), `character missing from hub: ${entry.displayName}`);
  assert.match(characters, /character-filter-all/);
  assert.match(characters, /character-filter-genies/);
  assert.match(characters, /RELATIONSHIPS[\s\S]*NOT PUBLISHED/);
  assert.match(characters, /APPEARANCES/);
  assert.match(characters, /Mark character artwork as viewed to save a discovery in this browser/);
  assert.match(characters, /data-progression-page='characters'/);
  assert.equal((characters.match(/data-discover-character='/g) || []).length, 7);
  assert.equal((characters.match(/data-character-discovery-status='/g) || []).length, 7);
  assert.match(characters, /does not complete a game or story/);
  assert.doesNotMatch(characters, /character-specific discovery tracking is not connected yet/);
  assert.match(toadal, /King of Feasts/);
  assert.match(toadal, /Browser-local progression is active/);
  assert.match(toadal, /Character-specific collectible records are not configured/);
  for (const section of ['PERSONALITY', 'HISTORY', 'ABILITIES', 'FRIENDS & RELATIONSHIPS', 'LOCATIONS', 'GAMES', 'STORIES', 'GALLERY', 'COLLECTIBLES']) {
    assert.ok(toadal.includes(section) || toadal.includes(section.replaceAll('&', '&amp;')), `profile section missing: ${section}`);
  }
  assert.match(toadal, /awaiting approved copy|not published|not canonized/i);
});

test('Stories, Manga, and Reader retain the publication gate and useful related routes', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(project, 'content/registry.json'), 'utf8'));
  assert.deepEqual(registry.storySeries, []);
  assert.deepEqual(registry.storyArcs, []);
  assert.deepEqual(registry.chapters, []);
  assert.deepEqual(registry.storyPages, []);
  const stories = pageHtml('stories.json');
  const manga = pageHtml('manga-series.json');
  const reader = pageHtml('comic-reader.json');
  assert.match(stories, /no published stories/i);
  assert.match(stories, /Publishing preview · no published stories/i);
  assert.match(stories, /Reading progress/);
  assert.match(stories, /href='\/characters\/'/);
  assert.match(stories, /href='\/world\/'/);
  assert.match(manga, /PREVIEW · NOT PUBLISHED/);
  assert.match(manga, /0 published/);
  assert.match(manga, /href='\/characters\/'/);
  assert.match(manga, /href='\/world\/'/);
  assert.match(manga, /href='\/media\/'/);
  assert.match(reader, /No published chapter is available/);
  assert.match(reader, /No published chapter selected/);
  assert.match(reader, /data-reader-fullscreen/);
  assert.match(reader, /data-reader-previous/);
  assert.match(reader, /data-reader-next/);
  assert.match(reader, /href='\/world\/'/);
  assert.match(reader, /href='\/characters\/'/);
  assert.match(reader, /href='\/media\/'/);
  for (const source of [stories, manga, reader]) {
    assert.doesNotMatch(source, /Chapter\s+12|Tastier Tomorrow/i);
  }
});
