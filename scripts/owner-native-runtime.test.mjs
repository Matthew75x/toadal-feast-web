import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ConversionError, convertHtml, inspectHtml, OWNER_TAGS, RUNTIME_EXCEPTIONS } from './convert-owner-native.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, '../studio-project/toadal-feast-website');
const ownerTags = new Set([...OWNER_TAGS, 'caption', 'progress', 'tfoot']);
const assetForUrl = (url) => `asset.${url.replace(/\W/g, '-')}`;
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const runtimePropKeys = [
  'html', 'runtimeOnly', 'readOnly', 'locked', 'runtimeVersion', 'runtimeKind',
  'runtimeSha256', 'runtimeCodeResources', 'runtimePolicy', 'layerName',
];

async function getRuntimeLeaves() {
  const manifest = JSON.parse(await readFile(path.join(project, 'project.json'), 'utf8'));
  const pageIndex = JSON.parse(await readFile(path.join(project, manifest.pageIndex ?? 'pages/index.json'), 'utf8'));
  const leaves = [];
  const visit = (items, page) => {
    for (const component of items ?? []) {
      if (component.props?.runtimeOnly === true) leaves.push({ component, page });
      visit(component.props?.children, page);
      for (const children of Object.values(component.props?.slots ?? {})) visit(children, page);
    }
  };
  for (const entry of pageIndex.pages) {
    const page = JSON.parse(await readFile(path.join(project, entry.file), 'utf8'));
    visit(page.components, page);
  }
  return leaves;
}

function assertRefused(html, { route = '/', componentId = 'component.runtime-fixture', runtimeExceptions = [] } = {}) {
  const options = { route, componentId, runtimeExceptions, ownerTags, assetForUrl };
  const report = inspectHtml(html, options);
  assert.ok(report.diagnostics.some((item) => item.code === 'RUNTIME_ONLY_CONTENT' || item.code === 'RUNTIME_ASSET_SLOT'), JSON.stringify(report.diagnostics));
  assert.throws(
    () => convertHtml(html, options),
    (error) => error instanceof ConversionError && error.diagnostics.some((item) => item.code === 'RUNTIME_ONLY_CONTENT' || item.code === 'RUNTIME_ASSET_SLOT'),
  );
}

function assertCurrentRuntimeLeaf(leaf, rule) {
  const { component, page } = leaf;
  const props = component.props;
  assert.equal(page.route, rule.route);
  assert.ok(component.id.startsWith(`${rule.componentId}.`), `${component.id} retains registered parent identity ${rule.componentId}`);
  assert.equal(component.type, 'core.rich-text');
  assert.deepEqual(Object.keys(props).sort(), [...runtimePropKeys].sort());
  assert.equal(props.runtimeOnly, true);
  assert.equal(props.readOnly, true);
  assert.equal(props.locked, true);
  assert.equal(props.runtimeVersion, 1);
  assert.equal(props.runtimeKind, rule.kind);
  assert.equal(props.runtimeSha256, sha256(props.html), 'stored digest covers the original protected HTML fragment');
  assert.equal(new Set(props.runtimeCodeResources.map(item => item.url)).size, props.runtimeCodeResources.length, 'no duplicate runtime resources');
  assert.deepEqual(props.runtimeCodeResources, rule.policy.codeResources.map(({ url, sha256: digest }) => ({ url, sha256: digest })));
  assert.deepEqual(props.runtimePolicy, {
    id: rule.policy.id,
    mode: rule.policy.mode,
    ...Object.fromEntries(Object.entries(rule.policy).filter(([key]) => !['id', 'mode', 'codeResources'].includes(key))),
  });
  assert.equal(props.layerName, `Read-only runtime: ${rule.kind}`);
  return props.html;
}

test('all pages retain exactly the four registered, locked runtime leaves with original fragments and exact resource policies', async () => {
  const leaves = await getRuntimeLeaves();
  assert.equal(leaves.length, RUNTIME_EXCEPTIONS.length);
  const unmatched = [...RUNTIME_EXCEPTIONS];
  for (const leaf of leaves) {
    const ruleIndex = unmatched.findIndex((rule) => leaf.page.route === rule.route && leaf.component.id.startsWith(`${rule.componentId}.`));
    assert.notEqual(ruleIndex, -1, `runtime leaf is registered to its exact route and original parent: ${leaf.page.route} ${leaf.component.id}`);
    const [rule] = unmatched.splice(ruleIndex, 1);
    const html = assertCurrentRuntimeLeaf(leaf, rule);

    if (rule.kind === 'external-script') {
      assert.match(html, /^<script\s+src=['"]assets\/js\/home-interactive-discovery\.js['"]\s+defer\s*><\/script>$/i);
    } else if (rule.kind === 'isolated-frame') {
      const frameSource = rule.policy.codeResources[0].url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.match(html, new RegExp(`^<iframe\\b[^>]*src=['"]${frameSource}['"]`, 'i'));
      assert.match(html, /sandbox=['"]allow-scripts allow-pointer-lock['"]/i);
      assert.match(html, /allow=['"]fullscreen['"]/i);
      assert.match(html, /referrerpolicy=['"]origin['"]/i);
      assert.doesNotMatch(html, /allow-same-origin|srcdoc/i);
    } else {
      assert.match(html, /^<img\b[^>]*data-reader-page/i);
      assert.match(html, /\balt=['"]['"]/i);
      assert.match(html, /\bdecoding=['"]async['"]/i);
      assert.doesNotMatch(html, /\bsrc\s*=/i, 'runtime supplies the selected page asset and alternative text');
    }
  }
  assert.deepEqual(unmatched, [], 'every registered exception has exactly one persisted leaf');
});

test('exact registered fragments convert while preserving their runtime leaf data and Studio tag set', async () => {
  for (const tag of ['caption', 'progress', 'tfoot']) assert.ok(ownerTags.has(tag));
  const leaves = await getRuntimeLeaves();
  for (const rule of RUNTIME_EXCEPTIONS) {
    const leaf = leaves.find(({ page, component }) => page.route === rule.route && component.id.startsWith(`${rule.componentId}.`));
    assert.ok(leaf, `found ${rule.kind} on ${rule.route}`);
    const original = leaf.component.props;
    const converted = convertHtml(original.html, {
      componentId: rule.componentId,
      route: rule.route,
      runtimeExceptions: RUNTIME_EXCEPTIONS,
      ownerTags,
      assetForUrl,
    });
    assert.equal(converted.props.children.length, 1);
    assert.equal(converted.props.children[0].type, 'core.rich-text');
    assert.deepEqual(converted.props.children[0].props, {
      html: original.html,
      runtimeOnly: true,
      readOnly: true,
      locked: true,
      runtimeVersion: 1,
      runtimeKind: rule.kind,
      runtimeSha256: original.runtimeSha256,
      runtimeCodeResources: original.runtimeCodeResources,
      runtimePolicy: original.runtimePolicy,
      layerName: `Read-only runtime: ${rule.kind}`,
    });
  }
});

test('unregistered, wrong-route, wrong-parent, altered-fragment, and altered-version inputs fail closed', async () => {
  const leaves = await getRuntimeLeaves();
  for (const rule of RUNTIME_EXCEPTIONS) {
    const leaf = leaves.find(({ page, component }) => page.route === rule.route && component.id.startsWith(`${rule.componentId}.`));
    assert.ok(leaf);
    const html = leaf.component.props.html;
    assertRefused(html, { route: rule.route, componentId: rule.componentId });
    assertRefused(html, { route: '/wrong-route/', componentId: rule.componentId, runtimeExceptions: RUNTIME_EXCEPTIONS });
    assertRefused(html, { route: rule.route, componentId: 'component.unregistered', runtimeExceptions: RUNTIME_EXCEPTIONS });

    const altered = html.replace(/(?<=<\w+)(?=\s|>)/, ' data-runtime-qualification-altered');
    assert.notEqual(altered, html);
    assertRefused(altered, { route: rule.route, componentId: rule.componentId, runtimeExceptions: RUNTIME_EXCEPTIONS });

    const alteredVersion = { ...leaf.component, props: { ...leaf.component.props, runtimeVersion: 2 } };
    assert.throws(() => assertCurrentRuntimeLeaf({ ...leaf, component: alteredVersion }, rule), /strictly deep-equal|Expected values to be strictly equal/);
  }
});

test('the owner tag allowlist covers the actual Studio caption, progress, and tfoot capabilities', () => {
  for (const tag of ['caption', 'progress', 'tfoot']) {
    assert.equal(inspectHtml(`<${tag}></${tag}>`, { ownerTags }).valid, true);
  }
});

test('registered runtime code-resource pins match exact current native and canonical export bytes', async () => {
  for (const rule of RUNTIME_EXCEPTIONS) for (const resource of rule.policy.codeResources) {
    const source = await readFile(path.join(project, 'reference', resource.source));
    const published = await readFile(path.resolve(here, '../dist', resource.source));
    assert.equal(createHash('sha256').update(source).digest('hex'), resource.sha256, `${resource.source} native source pin`);
    assert.equal(createHash('sha256').update(published).digest('hex'), resource.sha256, `${resource.source} canonical export pin`);
  }
});
