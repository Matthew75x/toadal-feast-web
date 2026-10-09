import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve('studio-project/toadal-feast-website');
const characters = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages/characters.json'), 'utf8'));
const media = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages/media.json'), 'utf8'));
const css = fs.readFileSync(path.join(projectRoot, 'reference/assets/css/site.css'), 'utf8');

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const child of node.props?.children || []) walk(child, visit);
}

function allComponents(page) {
  const result = [];
  for (const component of page.components || []) walk(component, node => result.push(node));
  return result;
}

const characterAssets = new Set([
  'asset.home.character.toadal',
  'asset.home.character.princess-lily',
  'asset.home.genie.sweet-art',
  'asset.home.genie.fruity-art',
  'asset.home.genie.savoury-art',
  'asset.home.character.gulper'
]);
const gameplayAssets = new Set([
  'asset.app.gameplay.arcade',
  'asset.app.gameplay.puzzle',
  'asset.app.gameplay.feastfall'
]);

test('Characters square card art is bounded to the native desktop and mobile frames', () => {
  const images = allComponents(characters).filter(node => node.type === 'core.image' && characterAssets.has(node.props?.asset));
  assert.equal(images.length, characterAssets.size);
  assert.deepEqual(new Set(images.map(image => image.props.asset)), characterAssets);
  for (const { props } of images) {
    assert.equal(props.fit, 'contain');
    assert.equal(props.imageHeight, 160);
    assert.equal(props.focalX, 50);
    assert.equal(props.focalY, 50);
    assert.equal(props.padding, 0);
    assert.equal(props.zoom, 1);
    assert.equal(props.responsive.mobile.maxWidth, 680);
    assert.equal(props.responsive.mobile.fit, 'contain');
    assert.equal(props.responsive.mobile.imageHeight, 115);
    assert.equal(props.responsive.mobile.focalX, 50);
    assert.equal(props.responsive.mobile.focalY, 50);
    assert.equal(props.responsive.mobile.padding, 0);
    assert.equal(props.responsive.mobile.zoom, 1);
  }
});

test('Gully keeps its dedicated full-body desktop and mobile card-fit assets', () => {
  const gully = allComponents(characters).find(node => node.type === 'core.image' && node.props?.asset === 'asset.import.gully-card-fit-desktop-7x4.431513d3');
  assert.ok(gully);
  assert.equal(gully.props.fit, 'cover');
  assert.equal(gully.props.imageHeight, 160);
  assert.equal(gully.props.responsive.mobile.asset, 'asset.import.gully-card-fit-mobile-3x2.a6e8afa4');
  assert.equal(gully.props.responsive.mobile.fit, 'cover');
  assert.equal(gully.props.responsive.mobile.imageHeight, 115);
});

test('Media gameplay stills use full-content 16:9 native image frames only', () => {
  const components = allComponents(media);
  const images = components.filter(node => node.type === 'core.image' && gameplayAssets.has(node.props?.asset));
  assert.equal(images.length, gameplayAssets.size);
  assert.deepEqual(new Set(images.map(image => image.props.asset)), gameplayAssets);
  for (const { props } of images) {
    assert.equal(props.fit, 'contain');
    assert.equal(props.aspectRatio, '16/9');
    assert.equal(props.focalX, 50);
    assert.equal(props.focalY, 50);
    assert.equal(props.padding, 0);
  }
  const gameplayCards = components.filter(node =>
    node.type === 'core.button' && node.props?.className?.split(/\s+/).includes('discovery-scene-card--gameplay'));
  assert.equal(gameplayCards.length, gameplayAssets.size);
  const cardAssets = [];
  for (const card of gameplayCards) {
    const assets = [];
    for (const child of card.props.children || []) walk(child, node => {
      if (node.type === 'core.image' && gameplayAssets.has(node.props?.asset)) assets.push(node.props.asset);
    });
    assert.equal(assets.length, 1);
    cardAssets.push(assets[0]);
  }
  assert.deepEqual(new Set(cardAssets), gameplayAssets);
});

test('Media gameplay framing overrides the fixed cropped scene-card image rule', () => {
  const rule = css.match(/\.discovery-media\s+\.discovery-scene-card--gameplay\s+img\s*\{([^}]+)\}/);
  assert.ok(rule, 'scoped gameplay framing rule is present');
  assert.match(rule[1], /height:\s*auto\s*;/);
  assert.match(rule[1], /aspect-ratio:\s*16\s*\/\s*9\s*;/);
  assert.match(rule[1], /object-fit:\s*contain\s*;/);
});
