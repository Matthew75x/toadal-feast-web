import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ConversionError, OWNER_TAGS, RUNTIME_EXCEPTIONS, catalogAssetForUrl, classifyTag, convertHtml, convertPage,
  inspectHtml, referenceSourceForUrl, resolveHref,
} from './convert-owner-native.mjs';

const options = { componentId: 'component.fixture.rich-text', assetForUrl: (url) => `asset.${url.replace(/\W/g, '-')}` };
const convert = (html, extra = {}) => convertHtml(html, { ...options, ...extra });
const all = (root) => [root, ...(root.props.children ?? []).flatMap(all)];
const byTag = (root, tag) => all(root).filter((c) => c.props.tag === tag);
const text = (root) => (root.props.text ?? root.props.label ?? '') + (root.props.children ?? []).map(text).join('');
const rejects = (html, code, extra) => assert.throws(() => convert(html, extra), (error) => error instanceof ConversionError && error.diagnostics.some((d) => d.code === code));

test('strict nesting, quoted delimiters, HTML void tags and deterministic bounded IDs', () => {
  const html = `<div id='outer' data-note='a > b'><p>one<br>two<img src='/a.webp' alt='A &quot;quote&quot;'></p><p>last</p></div>`;
  const result = convert(html);
  assert.deepEqual(result, convert(html));
  const [div] = result.props.children;
  assert.equal(div.props.attributes['data-note'], 'a > b');
  assert.deepEqual(div.props.children.map((c) => c.props.tag), ['p', 'p']);
  assert.deepEqual(div.props.children[0].props.children.map((c) => c.props.tag), ['#text', 'br', '#text', 'img']);
  assert.equal(byTag(result, 'img')[0].props.alt, 'A "quote"');
  const deep = convert(`${'<div>'.repeat(80)}leaf${'</div>'.repeat(80)}`, { componentId: 'component.' + 'x'.repeat(195) });
  const ids = all(deep).map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.length <= 240));
  assert.throws(() => convert('<p>x</p>', { componentId: 'x'.repeat(241) }), /bridge limit/);
  rejects('<div><span>x</div>', 'MALFORMED_HTML');
  rejects('<div/>', 'MALFORMED_HTML');
  rejects('<p title="unfinished>', 'MALFORMED_HTML');
  rejects('<p id="a" ID="b">x</p>', 'MALFORMED_HTML');
});

test('named and numeric entities decode once; nonbreaking and multicodepoint values survive', () => {
  const result = convert('<p>&apos;&quot;&amp;&lt;&gt;&#39;&#x27;&rarr;&darr;&nbsp;&eacute;&NotEqualTilde;&#128;&#x1f438;&amp;lt;&unknown;</p>');
  assert.equal(text(result), `'"&<>''→↓\u00a0é≂\u0338€🐸&lt;&unknown;`);
  assert.equal(text(convert('<p>&amp hello &AMP; &#0; &#xD800; &#1114112;</p>')), '& hello & \ufffd \ufffd \ufffd');
  const link = byTag(convert('<a href="/find?x=1&amp;y=2" title="&amp=literal &quot;">go</a>'), 'a')[0];
  assert.equal(link.props.href, '/find?x=1&y=2');
  assert.equal(link.props.attributes.title, '&amp=literal "');
  assert.equal(text(convert('<p>&alpha;&NotEqual;&OElig;&notin;&notin &copy</p>')), 'α≠Œ∉¬in ©');
  assert.equal(convert('<p title="&notin &copy">x</p>').props.children[0].props.attributes.title, '&notin ©');
});

test('leading, trailing and inter-element whitespace stays in original flow order', () => {
  const result = convert(' \n<div> lead <strong>middle</strong> tail\n<a href="#x"> go <span>→</span> </a>\t</div> \n');
  assert.deepEqual(result.props.children.map((c) => c.props.tag), ['#text', 'div', '#text']);
  const div = result.props.children[1];
  assert.deepEqual(div.props.children.map((c) => c.props.tag), ['#text', 'strong', '#text', 'a', '#text']);
  assert.equal(div.props.children[0].props.text, ' lead ');
  assert.equal(div.props.children[2].props.text, ' tail\n');
  assert.equal(div.props.children[4].props.text, '\t');
  assert.equal(text(result), ' \n lead middle tail\n go → \t \n');
  assert.equal(byTag(result, 'a')[0].props.label, undefined);
  assert.equal(byTag(result, 'a')[0].props.children[0].props.text, ' go ');
});

test('nested linked images preserve the source tree and use the actual asset/href/target fields', () => {
  const result = convert(`<figure class='art' style='margin: 0'><a href='/downloads/press.zip?rev=2#files' target='_blank' download='press.zip'><img src='/a.webp' alt='Art' width='20' height='30' loading='lazy' decoding='async'></a><figcaption> Art </figcaption></figure>`);
  const [figure] = result.props.children;
  const [link, caption] = figure.props.children;
  assert.equal(figure.props.className, 'art');
  assert.equal(figure.props.style, 'margin: 0');
  assert.equal(link.type, 'core.button');
  assert.equal(link.props.href, '/downloads/press.zip?rev=2#files');
  assert.equal(link.props.target, '_blank');
  assert.equal(link.props.attributes.download, 'press.zip');
  const [image] = link.props.children;
  assert.equal(image.type, 'core.image');
  assert.equal(image.props.asset, 'asset.-a-webp');
  assert.equal(image.props.assetId, undefined);
  assert.deepEqual(image.props.attributes, { width: '20', height: '30', loading: 'lazy', decoding: 'async' });
  assert.equal(caption.props.text, ' Art ');
  assert.equal(byTag(result, 'a').length, 1);
});

test('href and target are separate typed props for images and visual containers', () => {
  for (const tag of ['img', 'div']) {
    const markup = tag === 'img' ? "<img src='/a.webp' href='/download/art.png?size=2' target='_blank' alt='Art'>" : "<div href='/world/' target='_self'><span>World</span></div>";
    const item = convert(markup).props.children[0];
    assert.equal(item.props.target, tag === 'img' ? '_blank' : '_self');
    assert.ok(item.props.href);
    for (const key of ['href', 'target', 'src', 'class', 'style']) assert.equal(Object.hasOwn(item.props.attributes, key), false);
  }
  rejects("<a href='/world/'><img src='/a.webp' href='/other/'></a>", 'NESTED_LINK');
  rejects("<a href='/one/'><a href='/two/'>two</a></a>", 'NESTED_LINK');
  rejects("<input href='/other/' type='text'>", 'UNSUPPORTED_URL_PROPERTY');
});

test('forms retain field semantics, exact nesting, booleans, values and raw textarea content', () => {
  const result = convert(`<form action='/search/' method='get' role='search'><fieldset disabled><legend> Search </legend><label for='q'>Query</label><input id='q' name='q' type='search' value=' a &amp; b ' required><select name='scope' multiple><option value='all' selected> All </option><option value='cast'>Cast</option></select><textarea name='notes' rows='4' readonly>\n literal <b>text</b> &amp; end </textarea><button type='submit'> Go </button></fieldset></form>`);
  const form = result.props.children[0];
  assert.equal(form.type, 'layout.container');
  assert.equal(form.props.attributes.action, '/search/');
  assert.equal(form.props.attributes.method, 'get');
  const fieldset = byTag(result, 'fieldset')[0];
  assert.equal(fieldset.props.attributes.disabled, true);
  const input = byTag(result, 'input')[0];
  assert.equal(input.type, 'layout.container');
  assert.equal(input.props.text, undefined);
  assert.deepEqual(input.props.attributes, { id: 'q', name: 'q', type: 'search', value: ' a & b ', required: true });
  const select = byTag(result, 'select')[0];
  assert.equal(select.props.attributes.multiple, true);
  assert.deepEqual(select.props.children.map((c) => c.props.tag), ['option', 'option']);
  assert.equal(select.props.children[0].props.attributes.selected, true);
  assert.equal(select.props.children[0].props.text, ' All ');
  const textarea = byTag(result, 'textarea')[0];
  assert.equal(textarea.props.text, '\n literal <b>text</b> & end ');
  assert.equal(textarea.props.attributes.readonly, true);
  assert.equal(byTag(result, 'button')[0].props.label, ' Go ');
  assert.equal(form.props.collection, undefined);
});

test('responsive image source and srcset attributes remain static and complete', () => {
  const result = convert(`<picture><source media='(max-width: 680px)' srcset='/a.webp 1x, /b.webp 2x'><img src='/a.webp' srcset='/a.webp 611w' sizes='48vw' alt='A'></picture>`);
  const source = byTag(result, 'source')[0];
  assert.equal(source.type, 'layout.container');
  assert.equal(source.props.attributes.srcset, '/a.webp 1x, /b.webp 2x');
  assert.equal(byTag(result, 'img')[0].props.attributes.srcset, '/a.webp 611w');
  rejects('<source src="/movie.mp4">', 'UNSUPPORTED_ASSET_PROPERTY');
});

test('runtime iframe/script and non-native content are classified and never silently stripped', () => {
  const iframe = `<iframe src='/public/games/wicked-bites/index.html' sandbox='allow-scripts allow-pointer-lock' title='Preview'></iframe>`;
  assert.equal(classifyTag('iframe'), 'runtime-only');
  assert.equal(inspectHtml(iframe).diagnostics[0].classification, 'runtime-only');
  rejects(iframe, 'RUNTIME_ONLY_CONTENT');
  rejects('<script src="/runtime.js" defer>if (x < 2) alert("x");</script><p>After</p>', 'RUNTIME_ONLY_CONTENT');
  rejects('<noscript>fallback</noscript>', 'RUNTIME_ONLY_CONTENT');
  rejects('<style>.x { color:red }</style>', 'UNSUPPORTED_TAG');
  rejects('<!-- keep me --><p>After</p>', 'UNREPRESENTABLE_CONTENT');
  rejects('<!doctype html><p>After</p>', 'UNREPRESENTABLE_CONTENT');
  rejects('<mystery>Do not drop</mystery>', 'UNSUPPORTED_TAG');
  rejects('<p onclick="alert(1)">x</p>', 'UNSAFE_ATTRIBUTE');
  rejects('<img src="javascript:alert(1)">', 'UNSAFE_ATTRIBUTE');
  rejects('<a href="vbscript:x">x</a>', 'UNSAFE_ATTRIBUTE');
  rejects('<iframe srcdoc="&lt;script&gt;x&lt;/script&gt;"></iframe>', 'UNSAFE_ATTRIBUTE');
  rejects("<img data-reader-page alt='' decoding='async'>", 'RUNTIME_ASSET_SLOT');
  assert.equal(inspectHtml('<img data-reader-page>').diagnostics[0].classification, 'runtime-only');
  rejects('<img alt="Missing">', 'MISSING_IMAGE_SOURCE');
  rejects('<form target="_blank"><p>x</p></form>', 'OWNER_PROPERTY_GAP');
});

test('inert SVG keeps namespace attribute case; active/reference SVG remains runtime-only', () => {
  const result = convert(`<svg viewBox='0 0 24 24' aria-hidden='true' xmlns='http://www.w3.org/2000/svg'><title> Arrow &amp; path </title><g fill='none'><path d='M0 0 L24 24' stroke-width='2'/><circle cx='12' cy='12' r='3'/></g></svg>`);
  const svg = byTag(result, 'svg')[0];
  assert.equal(svg.props.attributes.viewBox, '0 0 24 24');
  assert.equal(svg.props.attributes.viewbox, undefined);
  assert.equal(byTag(result, 'title')[0].props.text, ' Arrow & path ');
  assert.equal(byTag(result, 'path')[0].props.attributes['stroke-width'], '2');
  assert.deepEqual(byTag(result, 'path')[0].props.children, []);
  rejects('<svg><foreignObject><div>active boundary</div></foreignObject></svg>', 'RUNTIME_ONLY_CONTENT');
  rejects('<svg><use href="#icon"/></svg>', 'RUNTIME_ONLY_CONTENT');
  rejects('<svg><path onclick="x()"/></svg>', 'UNSAFE_ATTRIBUTE');
  rejects('<svg><path xlink:href="#icon"/></svg>', 'UNSUPPORTED_SVG_REFERENCE');
});

test('current owner tag gaps are explicit and can be resolved by the actual validator contract', () => {
  for (const [tag, html] of [['caption', '<table><caption>Scores</caption><tbody><tr><td>0</td></tr></tbody></table>'], ['progress', '<progress max="1" value="0">0</progress>']]) {
    assert.equal(classifyTag(tag), 'owner-schema-gap');
    rejects(html, 'OWNER_SCHEMA_GAP');
    const result = convert(html, { ownerTags: new Set([...OWNER_TAGS, tag]) });
    assert.ok(byTag(result, tag).length);
  }
});

test('registered CSS background URLs gain typed identity while canonical CSS stays intact', () => {
  const style = "background-image: url('/assets/images/bg.webp'); color: red;";
  const html = `<div style="${style}"><p>Cover</p></div>`;
  const result = convert(html);
  assert.equal(result.props.children[0].props.style, style);
  assert.equal(result.props.children[0].props.backgroundAsset, 'asset.-assets-images-bg-webp');
  assert.equal(result.props.children[0].props.backgroundSourceUrl, '/assets/images/bg.webp');
  assert.equal(result.props.children[0].props.background, undefined);
  assert.deepEqual(inspectHtml(html, { assetForUrl: options.assetForUrl }).warnings, []);
  const unresolved = convert(html, { assetForUrl: () => null });
  assert.equal(unresolved.props.children[0].props.backgroundAsset, undefined);
  assert.equal(inspectHtml(html, { assetForUrl: () => null }).warnings[0].code, 'CSS_ASSET_IDENTITY_PENDING');
  const shorthand = convert(`<div style="background: #fff url('/assets/images/bg.webp') center/cover no-repeat"></div>`);
  assert.equal(shorthand.props.children[0].props.backgroundAsset, 'asset.-assets-images-bg-webp');
  assert.equal(shorthand.props.children[0].props.backgroundSourceUrl, '/assets/images/bg.webp');
  assert.equal(shorthand.props.children[0].props.style, "background: #fff url('/assets/images/bg.webp') center/cover no-repeat");
  const layeredStyle = "background: linear-gradient(90deg, rgba(0,0,0,.8), transparent), url('../art/scene.webp') 66% center / auto no-repeat; color: white;";
  const layered = convert(`<section style="${layeredStyle}"></section>`, { assetForUrl: (url) => url === '../art/scene.webp' ? 'asset.scene' : null, route: '/stories/' });
  assert.equal(layered.props.children[0].props.style, layeredStyle);
  assert.equal(layered.props.children[0].props.backgroundAsset, 'asset.scene');
  assert.equal(layered.props.children[0].props.backgroundSourceUrl, '../art/scene.webp');
  assert.equal(layered.props.children[0].props.backgroundFit, undefined);
  rejects('<div style="background:javascript:x">x</div>', 'UNSAFE_STYLE');
});

test('only the three qualified runtime fragments remain as read-only specialized runtime blocks', () => {
  const rules = RUNTIME_EXCEPTIONS;
  const cases = [
    { route: '/', id: rules[0].componentId, kind: 'external-script', html: `<div><p>Keep this copy</p><script src='assets/js/home-interactive-discovery.js' defer></script><p>And this copy</p></div>`, fragment: '<script src=\'assets/js/home-interactive-discovery.js\' defer></script>' },
    { route: '/player/wicked-bites/', id: rules[1].componentId, kind: 'isolated-frame', html: `<div><p>Player copy</p><iframe class="wo002-player-frame" data-player-frame src="/public/games/wicked-bites/index.html" title="Wicked Bites browser preview" loading="eager" referrerpolicy="origin" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" allowfullscreen></iframe><p>After player</p></div>`, fragment: `<iframe class="wo002-player-frame" data-player-frame src="/public/games/wicked-bites/index.html" title="Wicked Bites browser preview" loading="eager" referrerpolicy="origin" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen" allowfullscreen></iframe>` },
    { route: '/reader/', id: rules[2].componentId, kind: 'dynamic-image', html: `<div><p>Reader copy</p><img data-reader-page alt='' decoding='async'><p>More reader copy</p></div>`, fragment: `<img data-reader-page alt='' decoding='async'>` },
  ];
  for (const item of cases) {
    const page = { id: `page.${item.route}`, route: item.route, components: [{ id: item.id, type: 'core.rich-text', props: { html: item.html } }] };
    const result = convertPage(page, { ...options, runtimeExceptions: rules });
    const root = result.components[0];
    const children = root.props.children[0].props.children;
    const runtime = children.find((component) => component.type === 'core.rich-text');
    assert.ok(runtime);
    assert.equal(runtime.props.runtimeOnly, true);
    assert.equal(runtime.props.readOnly, true);
    assert.equal(runtime.props.locked, true);
    assert.equal(runtime.props.runtimeVersion, 1);
    assert.equal(runtime.props.runtimeKind, item.kind);
    assert.equal(runtime.props.html, item.fragment);
    assert.equal(runtime.props.runtimeSha256, createHash('sha256').update(item.fragment, 'utf8').digest('hex'));
    assert.deepEqual(runtime.props.runtimeCodeResources, rules.find((rule) => rule.kind === item.kind).policy.codeResources.map(({ url, sha256 }) => ({ url, sha256 })));
    assert.ok(Buffer.byteLength(runtime.props.html, 'utf8') <= 2048);
    const policy = rules.find((rule) => rule.kind === item.kind).policy;
    assert.equal(Object.isFrozen(policy), true);
    assert.equal(runtime.props.runtimePolicy.id, policy.id);
    assert.equal(runtime.props.runtimePolicy.mode, policy.mode);
    assert.ok(runtime.props.runtimeCodeResources.every((resource) => /^[a-f0-9]{64}$/.test(resource.sha256)));
    assert.match(children.map(text).join(' '), /Keep this copy|Player copy|Reader copy/);
    assert.equal(children.length, 3);
  }
  rejects(`<script src='assets/js/home-interactive-discovery.js' defer></script>`, 'RUNTIME_ONLY_CONTENT', { componentId: 'component.other', route: '/', runtimeExceptions: [rules[0]] });
  rejects(`<script src='/other.js' defer></script>`, 'RUNTIME_ONLY_CONTENT', { componentId: rules[0].componentId, route: '/', runtimeExceptions: [rules[0]] });
  rejects(`<script src='assets/js/home-interactive-discovery.js' defer>inline body</script>`, 'RUNTIME_ONLY_CONTENT', { componentId: rules[0].componentId, route: '/', runtimeExceptions: [rules[0]] });
  rejects(`<iframe src='/public/games/wicked-bites/index.html' sandbox='allow-scripts'></iframe>`, 'RUNTIME_ONLY_CONTENT', { componentId: rules[1].componentId, route: '/player/wicked-bites/', runtimeExceptions: [rules[1]] });
});

test('collection classification is general and direct-sibling based', () => {
  for (const html of [
    "<div class='media-tile-grid'><figure>One</figure> \n<figure>Two</figure></div>",
    "<section class='story-rail'><a class='story-card' href='/one/'>One</a><a class='story-card' href='/two/'>Two</a></section>",
    '<ul><li>One</li>\n<li>Two</li></ul>',
    "<div role='list'><div role='listitem'>One</div><div role='listitem'>Two</div></div>",
  ]) assert.equal(convert(html).props.children[0].props.collection, true);
  for (const html of [
    "<div class='cards-grid'><h2>Heading</h2><article>One</article><article>Two</article></div>",
    "<div class='cards-grid'>Prose<article>One</article><article>Two</article></div>",
    "<div class='cards-grid'><article>Only</article></div>",
    "<div class='filter-grid'><input type='radio'><label>All</label></div>",
    '<div><article>One</article><article>Two</article></div>',
    "<ol class='progression-daily-track'><li data-daily-track-day='1'>Day 1</li><li data-daily-track-day='2'>Day 2</li></ol>",
  ]) assert.equal(convert(html).props.children[0].props.collection, undefined);
});

test('Toadal whole-card href survives profile mutation and deep heading names stay approved', () => {
  const html = `<div class='character-card-grid'><article class='character-card' data-character-group='hero'><div class='character-card-art'><img src='/toadal.webp' alt='Toadal'></div><div class='character-card-copy'><span>PREVIEW</span><h2>Toadal</h2><a class='character-card-action' href='/characters/toadal/'>Open profile <span>→</span></a><button data-discover-character='toadal'>Mark artwork viewed</button><p data-character-discovery-status='toadal' role='status'>Not discovered</p></div></article><article class='character-card' data-character-group='cast'><div><span>PREVIEW</span><h2>Princess Lily</h2><p>Canonical artwork</p><button data-discover-character='princess-lily'>Mark artwork viewed</button><p data-character-discovery-status='princess-lily'>Not discovered</p></div></article><article class='character-card character-card--future' data-character-group='future'><h2>More characters</h2><span>Coming soon</span></article></div>`;
  const result = convert(html);
  const grid = result.props.children[0];
  assert.equal(grid.props.collection, true);
  const [toadal, lily, future] = grid.props.children;
  assert.equal(toadal.props.href, '/characters/toadal/');
  assert.equal(toadal.props.tag, 'a');
  assert.equal(byTag(toadal, 'a').length, 1);
  assert.equal(byTag(toadal, 'button').length, 0);
  assert.ok(byTag(toadal, 'span').some((x) => x.props.className === 'character-card-action' && text(x) === 'Open profile →'));
  assert.equal(lily.props.attributes['aria-label'], 'Discover Princess Lily artwork');
  assert.equal(lily.props.attributes.role, 'button');
  assert.equal(lily.props.attributes.tabindex, '0');
  assert.equal(byTag(lily, 'button').length, 0);
  assert.equal(all(result).filter((c) => c.props.attributes?.['data-character-discovery-status']).length, 2);
  assert.equal(future.props.attributes['data-discover-character'], undefined);
  assert.equal(future.props.tag, 'article');
  const unrelated = convert("<article><h2>Unrelated</h2><button data-discover-character='other'>View</button></article>");
  assert.equal(unrelated.props.children[0].props.attributes['data-discover-character'], undefined);
  assert.equal(byTag(unrelated, 'button').length, 1);
  const filters = convert("<div class='character-filter-controls' role='group'><input checked type='radio' name='character-filter' id='all'><label for='all'>All</label><input type='radio' name='character-filter' id='hero'><label for='hero'>Hero</label></div>");
  assert.equal(byTag(filters, 'input').length, 2);
  assert.equal(byTag(filters, 'input')[0].props.attributes.checked, true);
  assert.equal(byTag(filters, 'label')[1].props.attributes.for, 'hero');
  assert.equal(filters.props.children[0].props.collection, undefined);
});

test('all route families retain page/component metadata, siblings, slots and variants', () => {
  const page = { id: 'page.contact', route: '/contact/', title: 'Contact', components: [
    { id: 'component.contact.copy', type: 'core.rich-text', slot: 'intro', props: { variant: 'contact', locked: true, html: '<h1>Contact</h1>' } },
    { id: 'component.grid', type: 'layout.grid', props: { columns: 2, children: [{ id: 'component.nested', type: 'core.rich-text', props: { html: '<p>Nested</p>' } }], slots: { aside: [{ id: 'component.aside', type: 'core.rich-text', props: { html: '<aside>Aside</aside>' } }] } } },
    { id: 'component.other', type: 'game.card', props: { gameId: 'game.preview' } },
  ] };
  const before = structuredClone(page);
  const converted = convertPage(page, options);
  assert.deepEqual(page, before);
  assert.equal(converted.route, '/contact/');
  assert.equal(converted.components[0].id, page.components[0].id);
  assert.equal(converted.components[0].slot, 'intro');
  assert.equal(converted.components[0].props.variant, 'contact');
  assert.equal(converted.components[0].props.locked, true);
  assert.equal(converted.components[0].props.html, undefined);
  assert.equal(converted.components[1].props.children[0].type, 'layout.container');
  assert.equal(converted.components[1].props.slots.aside[0].type, 'layout.container');
  assert.deepEqual(converted.components[2], page.components[2]);
  assert.deepEqual(convertPage({ components: [{ id: 'native', type: 'core.text', props: { text: 'Keep' } }] }, options), { components: [{ id: 'native', type: 'core.text', props: { text: 'Keep' } }] });
  assert.deepEqual(convertPage({ components: [{ id: 'bare', type: 'compat.html' }] }, options), { components: [{ id: 'bare', type: 'compat.html' }] });
});

test('route and asset resolution preserve exact source destinations and reject basename guessing', () => {
  assert.equal(resolveHref('/downloads/book.pdf?edition=1#pages'), '/downloads/book.pdf?edition=1#pages');
  assert.equal(resolveHref('../downloads/book.pdf?edition=1#pages', '/stories/'), '/downloads/book.pdf?edition=1#pages');
  assert.equal(resolveHref('https://example.com/a%20b.zip?x=1'), 'https://example.com/a%20b.zip?x=1');
  assert.equal(resolveHref('mailto:hello@example.com'), 'mailto:hello@example.com');
  assert.throws(() => resolveHref('//other.invalid/x'));
  assert.throws(() => resolveHref('/bad path'));
  const catalog = { assets: [{ id: 'right', source: 'reference/assets/images/one/a.webp' }, { id: 'wrong', source: 'reference/assets/images/two/a.webp' }] };
  assert.equal(catalogAssetForUrl(catalog, '/assets/images/one/a.webp').id, 'right');
  assert.equal(catalogAssetForUrl(catalog, '/assets/images/a.webp'), null);
  assert.equal(catalogAssetForUrl(catalog, '/assets/images/one/a.webp?crop=1'), null);
  assert.equal(referenceSourceForUrl('/assets/%2e%2e/private.webp'), null);
  assert.equal(referenceSourceForUrl('/assets/%5cprivate.webp'), null);
  assert.equal(referenceSourceForUrl('assets/a.webp', { route: '/' }), 'reference/assets/a.webp');
  assert.equal(referenceSourceForUrl('assets/a.webp', { route: '/world/' }), null);
  const replaced = { assets: [{ id: 'replacement', source: 'assets/imported/new.webp', referenceSource: 'reference/assets/a.webp' }] };
  assert.equal(catalogAssetForUrl(replaced, '/assets/a.webp'), null);
});

test('write CLI requires explicit scope and the qualified pilot flag', () => {
  const script = fileURLToPath(new URL('./convert-owner-native.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, '--project', process.cwd(), '--studio', process.cwd(), '--page', path.resolve('support.json')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires --pilot-qualified/);
  const noScope = spawnSync(process.execPath, [script, '--project', process.cwd(), '--studio', process.cwd(), '--pilot-qualified'], { encoding: 'utf8' });
  assert.equal(noScope.status, 1);
  assert.match(noScope.stderr, /Choose exactly one scope/);
});
