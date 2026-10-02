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
    const [image, heading, description, chip] = card.props.children;
    assert.equal(card.props.href, game.route);
    assert.deepEqual(card.props.children.map(child => child.type), ['core.image', 'core.text', 'core.text', 'core.text']);
    assert.equal(image.props.asset, game.artAsset);
    assert.equal(heading.props.tag, 'h3');
    assert.equal(heading.props.text, game.name);
    assert.equal(description.props.tag, 'p');
    assert.equal(description.props.text, game.web?.shortDescription || game.summary);
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

test('actual World project wraps only the three environment cards and preserves locked slots', () => {
  const result = closeWorldDiscoveryCards(world);
  const sourceGrid = byId(world.components, 'component.world.map-discovery.bdd73088f428.discovery-scene-grid');
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
  const multipleSameHref = structuredClone(world);
  const card = byId(multipleSameHref.components, 'component.world.map-discovery.747bebb2e5c7.discovery-scene-card');
  const span = all([card]).find(component => component.id === 'component.world.map-discovery.674c575af55c.span');
  span.props.children.push({id:'duplicate-link',type:'core.button',props:{authoringVersion:1,tag:'a',href:'/media/#world-art',label:'Duplicate destination'}});
  assert.throws(() => closeWorldDiscoveryCards(multipleSameHref), /exactly one.*no other links/);

  const otherSecondaryHref = structuredClone(world);
  const otherCard = byId(otherSecondaryHref.components, 'component.world.map-discovery.747bebb2e5c7.discovery-scene-card');
  const inner = all([otherCard]).find(component => component.props?.href === '/media/#world-art');
  const otherAnchor = structuredClone(inner);
  otherAnchor.id = `${inner.id}.secondary`;
  otherAnchor.props.href = '/characters/';otherAnchor.props.children=[];
  const innerContainer = all([otherCard]).find(component => component.id === 'component.world.map-discovery.674c575af55c.span');
  innerContainer.props.children.push(otherAnchor);
  assert.throws(() => closeWorldDiscoveryCards(otherSecondaryHref), /exactly one.*no other links/);

  const missingCard = structuredClone(world);
  const grid = byId(missingCard.components, 'component.world.map-discovery.bdd73088f428.discovery-scene-grid');
  grid.props.children.pop();
  assert.throws(() => closeWorldDiscoveryCards(missingCard), /World discovery collection/);
});

test('object closure is idempotent and preserves subsequent owner copy edits',()=>{
 const first=closeOwnerNativeObjectPages({home,world,games,assets});first.home.components.find(c=>c.id==='component.home.games').props.children[0].props.children[1].props.text='Owner-authored label';
 const second=closeOwnerNativeObjectPages({...first,games,assets});assert.deepEqual(second,first);
});

test('combined transformation returns only Home and World copies', () => {
  const result = closeOwnerNativeObjectPages({ home, world, games, assets });
  assert.notEqual(result.home, home);
  assert.notEqual(result.world, world);
  assert.equal(result.home.id, home.id);
  assert.equal(result.world.id, world.id);
  assert.deepEqual(home, readJson('pages/home.json'));
  assert.deepEqual(world, readJson('pages/world.json'));
});
