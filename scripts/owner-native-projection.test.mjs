import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createOwnerNativeProjector, projectPageHtml, verifyOwnerRendererProvenance } from './lib/owner-native-projection.mjs';
import { renderOwnerComponent as renderVendoredOwnerComponent } from './vendor/owner-authoring-renderer.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptsDir, '..');
const projectRoot = path.join(websiteRoot, 'studio-project', 'toadal-feast-website');
const studioRoot = process.env.TOADAL_STUDIO_ROOT || null;

test('pinned vendored SDK works portably and checks live Studio provenance when configured', async () => {
  const provenance = verifyOwnerRendererProvenance(studioRoot || undefined);
  assert.equal(provenance.valid, true);
  assert.equal(provenance.sourceChecked, Boolean(studioRoot));
  assert.equal(provenance.provenance.studioVersion, '1.4.2');

  const driftRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'owner-native-source-drift-'));
  try {
    fs.mkdirSync(path.join(driftRoot, 'packages', 'owner-authoring', 'src'), { recursive: true });
    fs.writeFileSync(path.join(driftRoot, 'package.json'), JSON.stringify({ version: '1.4.2' }));
    fs.writeFileSync(path.join(driftRoot, 'packages', 'owner-authoring', 'src', 'index.ts'), 'export const changed = true;');
    assert.throws(() => verifyOwnerRendererProvenance(driftRoot), /source drift/);
  } finally {
    fs.rmSync(driftRoot, { recursive: true, force: true });
  }

  const projector = await createOwnerNativeProjector(null);
  const nativeOnly = projector(projectRoot, {
    components: [{ id: 'native-text', type: 'core.text', props: { authoringVersion: 1, tag: '#text', text: 'portable renderer' } }],
  });
  assert.equal(nativeOnly, 'portable renderer');
});

test('Characters projection preserves semantic targets and cross-checks live Studio when configured', async () => {
  const projector = await createOwnerNativeProjector(null);
  const projected = projector(projectRoot, 'page.characters');
  assert.equal(await projectPageHtml(projectRoot, 'page.characters', null), projected);

  if (studioRoot) {
    const studioProjector = await createOwnerNativeProjector(studioRoot);
    assert.equal(studioProjector(projectRoot, 'page.characters'), projected, 'live Studio and pinned SDK projections are byte-identical');

    const tempOutput = fs.mkdtempSync(path.join(os.tmpdir(), 'owner-native-projection-'));
    try {
      const rendererPath = path.join(studioRoot, 'packages', 'renderer', 'src', 'index.ts');
      const { renderProject } = await import(pathToFileURL(rendererPath).href);
      const manifestPath = path.join(projectRoot, 'project.json');
      renderProject(manifestPath, tempOutput);
      const page = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages', 'characters.json'), 'utf8'));
      const renderedFile = path.join(tempOutput, page.referenceFile);
      const rendered = fs.readFileSync(renderedFile, 'utf8');
      assert.ok(rendered.includes(projected), 'Studio export contains the exact native source projection');

      const pagesIndex = JSON.parse(fs.readFileSync(path.join(projectRoot, 'pages', 'index.json'), 'utf8'));
      for (const route of ['/', '/player/wicked-bites/']) {
        const record = pagesIndex.pages.find(item => item.route === route);
        const sourcePage = JSON.parse(fs.readFileSync(path.join(projectRoot, record.file), 'utf8'));
        const emittedPage = fs.readFileSync(path.join(tempOutput, sourcePage.referenceFile), 'utf8');
        for (const component of sourcePage.components.filter(item => item.props?.authoringVersion === 1)) {
          assert.ok(emittedPage.includes(projector.projectComponentHtml(projectRoot, component)), `${route} native subtree and retained rich-text leaf match Studio output (${component.id})`);
        }
      }
    } finally {
      fs.rmSync(tempOutput, { recursive: true, force: true });
    }
  }

  assert.match(projected, /href='\/characters\/toadal\//, 'canonical profile URL survives projection');
  assert.match(projected, /src='\/assets\/images\//, 'hash-matched canonical asset keeps its reference URL');
  assert.match(projected, /data-discover-character='toadal'/, 'character interaction hook survives projection');
  assert.match(projected, /Meet Toadal|TOADAL/i, 'native text survives projection');
});

test('native asset URLs use the hash-qualified Studio URL when reference bytes no longer match', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'owner-native-hash-url-'));
  const project = path.join(tempRoot, 'project');
  try {
    fs.mkdirSync(path.join(project, 'pages'), { recursive: true });
    fs.mkdirSync(path.join(project, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(project, 'reference', 'images'), { recursive: true });
    fs.writeFileSync(path.join(project, 'project.json'), JSON.stringify({ pageIndex: 'pages/index.json', assetCatalog: 'assets/index.json', referenceDist: 'reference' }));
    fs.writeFileSync(path.join(project, 'pages', 'index.json'), JSON.stringify({ pages: [{ id: 'page.fixture', file: 'pages/fixture.json' }] }));
    fs.writeFileSync(path.join(project, 'assets', 'index.json'), JSON.stringify({ assets: [{
      id: 'asset.fixture.image', source: 'reference/images/fixture.png', referenceSource: 'reference/images/fixture.png',
      sha256: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      referenceSha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', extension: 'png',
    }] }));
    fs.writeFileSync(path.join(project, 'pages', 'fixture.json'), JSON.stringify({ components: [{
      id: 'fixture-image', type: 'core.image', props: { authoringVersion: 1, tag: 'img', asset: 'asset.fixture.image', alt: 'Fixture' },
    }] }));

    const html = await projectPageHtml(project, 'page.fixture', null);
    assert.equal(html, "<img src='/assets/studio/asset-fixture-image.0123456789.png' alt='Fixture' data-studio-component='fixture-image'>");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('background asset replacement preserves retained gradients and shorthand CSS', async () => {
  const component = {
    id: 'background-fixture',
    props: {
      authoringVersion: 1,
      tag: 'div',
      backgroundAsset: 'asset.fixture.background',
      backgroundSourceUrl: '/old-background.png',
      style: "background:linear-gradient(135deg, #f00, #00f), url('/old-background.png') center/cover no-repeat, url('/texture.png'); background-size:cover",
    },
  };
  const assetUrl = () => '/assets/studio/asset-fixture-background.0123456789.png';
  const vendored = renderVendoredOwnerComponent(component, assetUrl);
  assert.equal(vendored, "<div style='background:linear-gradient(135deg, #f00, #00f), url(\"/assets/studio/asset-fixture-background.0123456789.png\") center/cover no-repeat, url(&#39;/texture.png&#39;); background-size:cover' data-studio-component='background-fixture'></div>");

  if (studioRoot) {
    const liveStudio = await import(pathToFileURL(path.join(studioRoot, 'packages', 'owner-authoring', 'src', 'index.ts')).href);
    assert.equal(liveStudio.renderOwnerComponent(component, assetUrl), vendored, 'live Studio and SDK preserve identical background declarations');
  }
});

test('mixed native and legacy components share one projection without shadow HTML', async () => {
  const projector = await createOwnerNativeProjector(null);
  const page = {
    id: 'page.mixed',
    components: [
      { id: 'legacy-before', type: 'core.rich-text', props: { html: '<p onclick="bad()">Legacy &amp; safe</p><script>bad()</script>' } },
      { id: 'native-parent', type: 'layout.container', props: {
        authoringVersion: 1,
        tag: 'section',
        children: [
          { id: 'native-link', type: 'core.link', props: { authoringVersion: 1, tag: 'a', href: '/characters/', text: 'A <native> link' } },
          { id: 'legacy-nested', type: 'core.rich-text', props: { html: '<p>Nested legacy</p>' } },
        ],
      } },
    ],
  };
  const html = projector(projectRoot, page);
  assert.equal(html, '<section class="studio-rich-text shell section" data-studio-component="legacy-before"><p>Legacy &amp; safe</p></section><section data-studio-component=\'native-parent\'><a href=\'/characters/\' data-studio-component=\'native-link\' data-studio-edit-field=\'text\'>A &lt;native&gt; link</a><section class="studio-rich-text shell section" data-studio-component="legacy-nested"><p>Nested legacy</p></section></section>');
  assert.equal(Object.hasOwn(page.components[1].props, 'html'), false, 'native parent stores no shadow HTML');
  assert.equal(Object.hasOwn(page.components[1].props.children[0].props, 'html'), false, 'native child stores no shadow HTML');
  assert.throws(() => projector(projectRoot, {
    components: [{ id: 'legacy-other', type: 'core.button', props: { label: 'Legacy control' } }],
  }), /requires renderLegacyComponent/);
});

test('explicit renderer injection stays available for isolated tests', async () => {
  const projector = await createOwnerNativeProjector(null, {
    renderOwnerComponent: (component, _assetUrl, renderChild) => `<mock>${(component.props.children || []).map(renderChild).join('')}</mock>`,
  });
  const html = projector(projectRoot, {
    components: [{ id: 'root', props: { authoringVersion: 1, children: [{ id: 'child', props: { html: '<b>legacy</b>' } }] } }],
  });
  assert.equal(html, '<mock><b>legacy</b></mock>');
});
