import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const project = path.join(root, 'studio-project/toadal-feast-website');
const code = JSON.parse(fs.readFileSync(path.join(project, 'collections/advanced-code.json'), 'utf8'));
const correction = code.css.slice(code.css.indexOf('/* World bands have distinct authored contents:'));
const nodes = value => Array.isArray(value) ? value.flatMap(nodes)
  : value && typeof value === 'object' ? [...(value.props ? [value] : []), ...Object.values(value).flatMap(nodes)] : [];

test('World desktop corrects the shared band template and keeps explicit atlas, cast and destination layouts', () => {
  assert.match(correction, /@media\(min-width:1100px\)/);
  assert.match(correction, /\.discovery-world \.discovery-band\s*\{[^}]*grid-template-columns:minmax\(0,1fr\);[^}]*grid-template-areas:none;/);
  assert.match(correction, /\.discovery-world \.discovery-band-heading\s*\{[^}]*grid-area:auto; display:block;/);
  assert.match(correction, /\.discovery-world \.discovery-cast-strip\s*\{ grid-template-columns:repeat\(4,minmax\(0,1fr\)\);/);
  assert.match(correction, /\.discovery-world \.portal-journey-grid\s*\{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); width:100%;/);
  assert.match(correction, /\.discovery-world \.world-map-preview > \.discovery-band-heading\s*\{ grid-column:1 \/ -1;/);
  assert.ok(!correction.includes('!important'), 'native inline styling must remain editable');
});

test('Characters scenic H1 uses the existing light palette without recoloring light-panel headings', () => {
  assert.match(correction, /\.character-family-page \.character-hero \.character-hero-copy h1\s*\{ color:var\(--cream-50\); \}/);
  const page = JSON.parse(fs.readFileSync(path.join(project, 'pages/characters.json'), 'utf8'));
  const heading = nodes(page).filter(n => n.props.tag === 'h1');
  assert.equal(heading.length, 1);
  assert.equal(heading[0].type, 'core.text');
  assert.equal(heading[0].props.text, 'Characters Hub');
  assert.equal(heading[0].props.style, '');
});

test('current World and Characters pages use the same newly generated stylesheet', () => {
  const paths = ['world/index.html', 'characters/index.html'];
  let shared;
  for (const route of paths) {
    const html = fs.readFileSync(path.join(root, 'dist', route), 'utf8');
    const match = html.match(/data-toadal-advanced-code href="([^"]+)"/);
    assert.ok(match, route);
    assert.equal(match[1], shared ||= match[1]);
    const css = fs.readFileSync(path.join(root, 'dist', match[1].replace('/toadal-feast-web/', '')), 'utf8');
    assert.ok(css.includes(correction.trim()));
  }
});
