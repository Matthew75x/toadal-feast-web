import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const project = path.join(root, 'studio-project/toadal-feast-website');
const characters = JSON.parse(fs.readFileSync(path.join(project, 'pages/characters.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(project, 'assets/index.json'), 'utf8'));
const css = fs.readFileSync(path.join(project, 'reference/assets/css/site.css'), 'utf8');
const components = [];

function walk(node) {
  if (!node || typeof node !== 'object') return;
  components.push(node);
  for (const child of node.props?.children || []) walk(child);
}

for (const component of characters.components || []) walk(component);

const heroImage = components.find(node => node.props?.className === 'character-hero-toadal');
const fitRuleIndex = css.indexOf("/* Keep the Characters Hub's canonical full-body Toadal inside its clipped hero. */");
const fitRules = fitRuleIndex < 0 ? '' : css.slice(fitRuleIndex, css.indexOf('/* Screenshot-reviewed App, World, and Play polish. */', fitRuleIndex));

test('Characters Hub keeps the approved native full-body Toadal fully inside the hero at desktop and mobile widths', () => {
  assert.ok(heroImage, 'the Characters hero remains a native image component');
  assert.equal(heroImage.type, 'core.image');
  assert.equal(heroImage.props.asset, 'asset.home.character.toadal-victory-web');
  assert.equal(heroImage.props.attributes.width, '611');
  assert.equal(heroImage.props.attributes.height, '640');

  const asset = assets.assets.find(item => item.id === heroImage.props.asset);
  assert.ok(asset, 'the native asset registry retains the approved artwork');
  assert.equal(asset.source, 'reference/assets/images/characters/toadal-victory.webp');
  assert.equal(asset.width, 611);
  assert.equal(asset.height, 640);
  assert.equal(asset.sha256, '2d9c9409372a709c3202ade120e78e8df520ecb7aab27289320595bbcde01cfb');

  assert.match(fitRules, /\.characters-page \.character-hero\s*\{\s*min-height:\s*clamp\(330px,\s*40\.8vw,\s*461px\);/);
  assert.match(fitRules, /\.characters-page \.character-hero-toadal\s*\{\s*bottom:\s*0;/);
  assert.match(fitRules, /@media \(min-width: 681px\) and \(max-width: 900px\)[\s\S]*?\.characters-page \.character-hero-toadal\s*\{\s*width:\s*36%;/);
  assert.match(fitRules, /@media \(max-width: 680px\)[\s\S]*?\.characters-page \.character-hero-toadal\s*\{\s*bottom:\s*0;/);
  assert.doesNotMatch(fitRules, /profile-hero|character-card/);

  for (const width of [681, 900, 901, 1024, 1200, 1440]) {
    const heroWidth = Math.min(1180, width - 28);
    const heroHeight = Math.min(461, Math.max(330, width * 0.408));
    const imageWidth = width <= 900 ? heroWidth * 0.36 : Math.min(heroWidth * 0.39, 440);
    const imageHeight = imageWidth * 640 / 611;
    assert.ok(imageHeight <= heroHeight, `full-body art fits the desktop/tablet hero at ${width}px`);
  }

  for (const width of [320, 390, 680]) {
    const heroWidth = Math.min(1180, width - 28);
    const imageWidth = Math.min(heroWidth * 0.48, 210);
    const imageHeight = imageWidth * 640 / 611;
    assert.ok(imageHeight <= 430, `full-body art fits the mobile hero at ${width}px`);
  }
});

test('Characters hero fit reaches both canonical and phone-preview exports without changing the shared profile fit', () => {
  assert.match(css, /\.toadal-profile-page \.profile-hero-toadal\s*\{\s*bottom:\s*0;\s*\}/);
  const routes = [
    ['characters/index.html', 'assets/css/site.css'],
    ['previews/cards-phone-20261008/characters/index.html', 'previews/cards-phone-20261008/assets/css/site.css']
  ];

  for (const [route, cssPath] of routes) {
    const html = fs.readFileSync(path.join(root, 'dist', route), 'utf8');
    assert.match(html, /class=['"]character-hero-toadal['"]/, `${route} preserves the native hero image`);
    const exportedCss = fs.readFileSync(path.join(root, 'dist', cssPath), 'utf8');
    assert.match(exportedCss, /\.characters-page \.character-hero-toadal\s*\{\s*bottom:\s*0;/, `${route} exports the Characters-only fit rule`);
  }
});
