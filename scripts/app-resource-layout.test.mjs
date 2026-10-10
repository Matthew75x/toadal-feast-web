import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve('studio-project/toadal-feast-website');
const app = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages/app.json'), 'utf8'));
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
const components = allComponents(app);

test('App icon and trailer use editable two-column desktop and stacked mobile layout', () => {
  const layout = components.find(node => node.id === 'component.app.icon-trailer-availability.097a16b48695.app-gameplay-section');
  assert.ok(layout);
  assert.equal(layout.type, 'layout.container');
  assert.equal(layout.props.tag, 'section');
  assert.equal(layout.props.presentationVersion, 1);
  assert.equal(layout.props.mode, 'grid');
  assert.equal(layout.props.columns, 2);
  assert.equal(layout.props.gap, 18);
  assert.deepEqual(layout.props.responsive.mobile, { maxWidth: 760, mode: 'stack', gap: 12 });
  assert.deepEqual(layout.props.children.map(child => child.id), [
    'component.app.icon-trailer-availability.3e731fccbad2.app-gameplay-card-app-ic',
    'component.app.icon-trailer-availability.82717a890699.app-gameplay-card'
  ]);
});

test('App layout preserves gameplay cards and honest unavailable destinations', () => {
  const gameplay = components.find(node => node.id === 'component.live-app.rich-text.a4c346931a3b.app-gameplay-grid');
  assert.ok(gameplay);
  assert.equal(gameplay.props.className, 'app-gameplay-grid');
  assert.equal(gameplay.props.children.length, 3);

  const icon = components.find(node => node.id === 'component.app.icon-trailer-availability.4533ddd8eda7.app-icon-image');
  assert.ok(icon);
  assert.equal(icon.props.asset, 'asset.app.approved-icon');
  assert.equal(icon.props.alt, 'TOADAL FEAST mobile app icon');

  const trailerCopy = components.find(node => node.id === 'component.app.icon-trailer-availability.3635dc4fa282.p');
  assert.equal(trailerCopy.props.text, 'No public app trailer is available yet. The gameplay images above remain genuine still captures and are not presented as a trailer.');
  const mediaLink = components.find(node => node.id === 'component.app.icon-trailer-availability.9b2b3bb20261.a');
  assert.equal(mediaLink.props.href, '/media/');

  const storeButtons = components.filter(node => node.props?.className === 'store-badge');
  assert.equal(storeButtons.length, 2);
  for (const button of storeButtons) {
    assert.equal(button.props.tag, 'button');
    assert.equal(button.props.attributes.disabled, true);
    assert.equal(button.props.href, undefined);
  }
});
