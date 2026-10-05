import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { closeHomeGameCards, closeOwnerNativeObjectPages, closeWorldDiscoveryCards } from './owner-native-object-closure.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(repo, 'studio-project', 'toadal-feast-website');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(projectRoot, relative), 'utf8'));
const home = readJson('pages/home.json');
const world = readJson('pages/world.json');
const gameIndex = readJson('games/index.json');
const games = gameIndex.games.map(record => readJson(record.file));
const assets = readJson('assets/index.json');
const all = components => (components ?? []).flatMap(component => [component, ...all(component.props?.children)]);
const byId = (components, id) => all(components).find(component => component.id === id);
const byType = (components, type) => all(components).filter(component => component.type === type);
const byHref = (components, href) => all(components).filter(component => component.props?.href === href);
const worldAtlas = page => all(page.components).find(component => Object.hasOwn(component.props?.attributes ?? {}, 'data-world-map'));

// Keep the historical migration helper's strict wrapper and secondary-link
// contract under test. The current native atlas moved within the owner page.
function historicalWorldFixture() {
  const fixture = structuredClone(world);
  const atlas = worldAtlas(fixture);
  assert.ok(atlas, 'the current World page retains its semantic atlas selector');
  atlas.id = 'component.world.map-discovery';
  const grid = byId(atlas.props.children, 'component.world.map-discovery.bdd73088f428.discovery-scene-grid');
  assert.ok(grid, 'the atlas retains its authored discovery collection');
  for (const card of grid.props.children.slice(0, 3)) {
    card.props.tag = 'article';
    delete card.props.href;
    card.props.attributes.role = 'listitem';
    const secondary = all(card.props.children).find(component => component.props?.text === 'View in Media');
    assert.ok(secondary, 'each linked environment retains its editable action label');
    secondary.type = 'core.button';
    secondary.props.tag = 'a';
    secondary.props.href = '/media/#world-art';
    secondary.props.label = secondary.props.text;
    delete secondary.props.text;
  }
  return fixture;
}

test('actual Home project closes exactly four game cards as native whole-card links', () => {
  const result = closeHomeGameCards(home, games, assets);
  const sourceCards = byId(home.components, 'component.home.games').props.children;
  const cards = byId(result.components, 'component.home.games').props.children;
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map(card => card.id), sourceCards.map(card => card.id));
  assert.deepEqual(cards.map(card => card.props.gameId), sourceCards.map(card => card.props.gameId));
  assert.ok(cards.every(card => card.type === 'layout.container' && card.props.authoringVersion === 1 && card.props.tag === 'a'));
  assert.ok(cards.every(card => card.props.className === 'module studio-game-card owner-object-link'));
  assert.ok(cards.every(card => card.props.attributes['aria-label'] === `View ${games.find(game => game.id === card.props.gameId).name} details`));

  for (const card of cards) {
    const game = games.find(item => item.id === card.props.gameId);
    const image = byId(card.props.children, card.id + '.art');
    const heading = byId(card.props.children, card.id + '.heading');
    const description = byId(card.props.children, card.id + '.description');
    const chip = byId(card.props.children, card.id + '.status');
    const action = byId(card.props.children, card.id + '.action');
    assert.equal(card.props.href, game.route);
    assert.ok(image && heading && description && chip && action, 'all required editable card roles remain present');
    assert.equal(image.type, 'core.image');
    assert.ok([heading, description, chip, action].every(child => child.type === 'core.text' && child.props.authoringVersion === 1));
    assert.deepEqual(card.props.children.map(child => child.id), sourceCards.find(source => source.id === card.id).props.children.map(child => child.id), 'closure preserves additional owner-authored text nodes');
    assert.deepEqual(all([card]).filter(child => child.props?.tag === 'a' || child.type === 'core.button' && child.props?.href).map(child => child.id), [card.id], 'the whole card has one destination and no nested links');
    assert.equal(action.props.tag, 'span');
    assert.equal(action.props.className, 'home-game-action');
    assert.equal(action.props.text, game.slug === 'wicked-bites' ? 'Explore preview →' : 'View game details →');
    assert.equal(Object.hasOwn(action.props, 'href'), false);
    assert.equal(image.props.asset, game.artAsset);
    assert.equal(heading.props.tag, 'h3');
    assert.equal(heading.props.text, game.name);
    assert.equal(description.props.tag, 'p');
    assert.equal(description.props.text, byId(sourceCards, card.id + '.description').props.text, 'closure preserves the owner-authored description rather than replacing it with registry copy');
    assert.ok(typeof description.props.text === 'string' && description.props.text.trim().length > 0, 'each native card retains a meaningful editable description');
    assert.equal(chip.props.tag, 'span');
    assert.equal(chip.props.text, game.statusLabel);
    assert.equal(chip.props.className, `chip ${game.status}`);
    assert.equal(card.props.gameId, game.id);
    assert.equal(card.props.children.some(child => /learn more/i.test(child.props.text ?? '')), false);
  }
  assert.deepEqual(home, readJson('pages/home.json'), 'source page is not mutated');
});

test('Home rejects unknown games, mismatched IDs, missing art, and invalid routes', () => {
  const unknownGame = structuredClone(home);
  byId(unknownGame.components, 'component.home.games').props.children[0].props.gameId = 'game.unknown';
  assert.throws(() => closeHomeGameCards(unknownGame, games, assets), /Unknown game/);

  const mismatchedGame = structuredClone(home);
  byId(mismatchedGame.components, 'component.home.games').props.children[0].id = 'component.home.game.wrong';
  assert.throws(() => closeHomeGameCards(mismatchedGame, games, assets), /mismatch/);

  const unknownAsset = structuredClone(games);
  unknownAsset[0].artAsset = 'asset.not-registered';
  assert.throws(() => closeHomeGameCards(home, unknownAsset, assets), /Unknown art asset/);

  const invalidRoute = structuredClone(games);
  invalidRoute[0].route = 'javascript:alert(1)';
  assert.throws(() => closeHomeGameCards(home, invalidRoute, assets), /invalid or mismatched internal route/);
  const mismatchedRoute = structuredClone(games);
  mismatchedRoute[0].route = '/games/another-title/';
  assert.throws(() => closeHomeGameCards(home, mismatchedRoute, assets), /invalid or mismatched internal route/);
});

test('current World atlas retains three canonical whole-card links, and historical closure preserves locked slots', () => {
  const atlas = worldAtlas(world);
  assert.ok(atlas, 'World keeps the semantic data-world-map content selector after the atlas move');
  assert.equal(all(world.components).filter(component => Object.hasOwn(component.props?.attributes ?? {}, 'data-world-map')).length, 1);
  assert.equal(atlas.props.tag, 'section');
  assert.match(atlas.props.className, /\bworld-map-preview\b/);
  assert.equal(atlas.props.attributes['aria-labelledby'], 'world-map-heading');
  const heading = all(atlas.props.children).find(component => component.props?.attributes?.id === 'world-map-heading');
  assert.equal(heading?.type, 'core.text');
  assert.equal(heading?.props.tag, 'h2');
  assert.ok(typeof heading?.props.text === 'string' && heading.props.text.trim().length > 0, 'the atlas retains a meaningful owner-editable heading');
  const sourceGrid = byId(atlas.props.children, 'component.world.map-discovery.bdd73088f428.discovery-scene-grid');
  assert.ok(sourceGrid, 'the discovery collection is inside the moved atlas');
  assert.equal(sourceGrid.props.attributes.role, 'group');
  assert.equal(sourceGrid.props.attributes['aria-label'], 'Approved Feast World environment previews');
  assert.equal(sourceGrid.props.children.length, 5);
  assert.deepEqual(byType(sourceGrid.props.children.slice(0, 3), 'core.image').map(image => image.props.asset), ['asset.home.world.desktop', 'asset.home.world.calm', 'asset.home.world.portal']);
  assert.ok(byType(sourceGrid.props.children.slice(0, 3), 'core.image').every(image => assets.assets.some(asset => asset.id === image.props.asset)));
  const titles = byType(sourceGrid.props.children.slice(0, 3), 'core.text').filter(text => text.props.tag === 'strong');
  assert.deepEqual(titles.map(title => title.props.text), ['Candy Kingdom environment art', 'Candy-land scenic art', 'Forest portal environment art']);
  assert.ok(sourceGrid.props.children.slice(0, 3).every(card => card.props.tag === 'a' && card.props.href === '/media/#world-art' && all([card]).filter(node => node.props?.tag === 'a' || node.type === 'core.button' && node.props?.href).length === 1));
  assert.equal(byType(sourceGrid.props.children.slice(0, 3), 'core.text').filter(text => text.props.text === 'Preview · ').length, 3, 'every environment keeps its truthful preview status');
  const result = closeWorldDiscoveryCards(historicalWorldFixture());
  assert.equal(byId(result.components, heading.id).props.text, heading.props.text, 'closure preserves the current authored atlas title');
  const grid = byId(result.components, sourceGrid.id);
  assert.equal(grid.props.attributes.role, 'group');
  assert.equal(grid.props.attributes['aria-label'], sourceGrid.props.attributes['aria-label']);
  assert.equal(grid.props.children.length, 5);

  const linked = grid.props.children.slice(0, 3);
  assert.ok(linked.every(card => card.props.tag === 'a' && card.props.href === '/media/#world-art'));
  assert.ok(linked.every(card => card.props.className === 'discovery-scene-card owner-object-link'));
  assert.ok(linked.every(card => !Object.hasOwn(card.props.attributes, 'role')));
  assert.equal(byHref(result.components, '/media/#world-art').length, 3);
  assert.ok(linked.every(card => all([card]).filter(component => component.props?.tag === 'a').length === 1));
  const innerLinks = byType(linked, 'core.text').filter(component => component.props.tag === 'span' && component.props.text === 'View in Media');
  assert.equal(innerLinks.length, 3);
  assert.ok(innerLinks.every(component => !Object.hasOwn(component.props, 'href')));

  assert.deepEqual(grid.props.children.slice(3), sourceGrid.props.children.slice(3), 'the two locked future slots stay unchanged');
  assert.deepEqual(world, readJson('pages/world.json'), 'source page is not mutated');
});

test('World rejects cards with multiple secondary links or malformed discovery structure', () => {
  const multipleSameHref = historicalWorldFixture();
  const card = byId(multipleSameHref.components, 'component.world.map-discovery.747bebb2e5c7.discovery-scene-card');
  const span = all([card]).find(component => component.id === 'component.world.map-discovery.674c575af55c.span');
  span.props.children.push({id:'duplicate-link',type:'core.button',props:{authoringVersion:1,tag:'a',href:'/media/#world-art',label:'Duplicate destination'}});
  assert.throws(() => closeWorldDiscoveryCards(multipleSameHref), /exactly one.*no other links/);

  const otherSecondaryHref = historicalWorldFixture();
  const otherCard = byId(otherSecondaryHref.components, 'component.world.map-discovery.747bebb2e5c7.discovery-scene-card');
  const inner = all([otherCard]).find(component => component.props?.href === '/media/#world-art');
  const otherAnchor = structuredClone(inner);
  otherAnchor.id = `${inner.id}.secondary`;
  otherAnchor.props.href = '/characters/';otherAnchor.props.children=[];
  const innerContainer = all([otherCard]).find(component => component.id === 'component.world.map-discovery.674c575af55c.span');
  innerContainer.props.children.push(otherAnchor);
  assert.throws(() => closeWorldDiscoveryCards(otherSecondaryHref), /exactly one.*no other links/);

  const missingCard = historicalWorldFixture();
  const grid = byId(missingCard.components, 'component.world.map-discovery.bdd73088f428.discovery-scene-grid');
  grid.props.children.pop();
  assert.throws(() => closeWorldDiscoveryCards(missingCard), /World discovery collection/);
});

test('object closure is idempotent and preserves subsequent owner copy edits',()=>{
 const first=closeOwnerNativeObjectPages({home,world:historicalWorldFixture(),games,assets});first.home.components.find(c=>c.id==='component.home.games').props.children[0].props.children[1].props.text='Owner-authored label';
 const second=closeOwnerNativeObjectPages({...first,games,assets});assert.deepEqual(second,first);
});

test('combined transformation returns only Home and World copies', () => {
  const worldInput = historicalWorldFixture();
  const result = closeOwnerNativeObjectPages({ home, world: worldInput, games, assets });
  assert.notEqual(result.home, home);
  assert.notEqual(result.world, worldInput);
  assert.equal(result.home.id, home.id);
  assert.equal(result.world.id, world.id);
  assert.deepEqual(home, readJson('pages/home.json'));
  assert.deepEqual(world, readJson('pages/world.json'));
});
