import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const project = path.resolve('studio-project/toadal-feast-website');
const css = fs.readFileSync(path.join(project, 'reference/assets/css/site.css'), 'utf8');
function page(name) { return JSON.parse(fs.readFileSync(path.join(project, `pages/${name}.json`), 'utf8')); }
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const child of node.props?.children || []) walk(child, visit);
}
function find(pageData, predicate) {
  let found;
  for (const component of pageData.components || []) walk(component, node => { if (!found && predicate(node)) found = node; });
  return found;
}
function classNames(node) { return String(node?.props?.className || '').split(/\s+/).filter(Boolean); }

test('Devlog and Roadmap content roots use the native site shell gutters', () => {
  for (const [name, id] of [
    ['news-article', 'component.manifest-news-article.8166d88b1f44.progression-page'],
    ['roadmap', 'component.manifest-roadmap.aaf8e01b1192.progression-page']
  ]) {
    const root = find(page(name), node => node.id === id);
    assert.ok(root, `${name} progression root exists`);
    assert.ok(classNames(root).includes('shell'));
  }
  assert.match(css, /\.shell,\s*\.studio-layout\s*\{\s*width:\s*min\(calc\(100%\s*-\s*2\s*\*\s*var\(--page-gutter\)\),\s*var\(--content-max\)\);\s*min-width:\s*0;\s*margin-inline:\s*auto;/);
});

test('Media, About, and Wicked Bites keep native destination links in labelled wrapping navigation', () => {
  const mediaNav = find(page('media'), node => node.id === 'component.media.related-routes.b6e4812d8a74.progression-nav');
  assert.ok(mediaNav);
  assert.ok(classNames(mediaNav).includes('progression-nav--media'));
  assert.equal(mediaNav.props.attributes['aria-label'], 'Media destinations');
  assert.deepEqual(mediaNav.props.children.map(node => node.props.href), ['/app/', '/games/wicked-bites/', '/player/wicked-bites/', '/play/']);

  const aboutCard = find(page('about'), node => node.props?.attributes?.id === 'about-stories-characters');
  assert.ok(aboutCard);
  const aboutNav = aboutCard.props.children.at(-1);
  assert.equal(aboutNav.type, 'layout.container');
  assert.equal(aboutNav.props.tag, 'nav');
  assert.ok(classNames(aboutNav).includes('progression-nav--about'));
  assert.equal(aboutNav.props.attributes['aria-label'], 'Stories and characters');
  assert.deepEqual(aboutNav.props.children.map(node => [node.id, node.props.href]), [
    ['component.about.mission-stories.e842ac927f41.a', '/stories/'],
    ['component.about.mission-stories.71aa7c3074ee.a', '/characters/']
  ]);

  const wickedNav = find(page('game-wicked-bites'), node => node.id === 'component.game-wicked-bites.manifest-links.a3b494924a94.progression-nav');
  assert.ok(wickedNav);
  assert.ok(classNames(wickedNav).includes('progression-nav--wicked-bites'));
  assert.equal(wickedNav.props.attributes['aria-label'], 'Wicked Bites destinations');
  assert.deepEqual(wickedNav.props.children.map(node => node.props.href), ['/play/', '/feast-pass/', '/leaderboards/?game=wicked-bites']);
});

test('the three destination rows have visible wrapping gaps, touch-sized links, and focus rings', () => {
  const start = css.indexOf('/* Give editorial routes the same wrapped, keyboard-friendly link rows. */');
  assert.notEqual(start, -1);
  const rules = css.slice(start);
  assert.match(rules, /\.progression-nav--media,\s*#about-stories-characters \.progression-nav--about,\s*\.progression-nav--wicked-bites\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*10px 12px;/s);
  assert.match(rules, /\.progression-nav--media > a,[\s\S]*?\{[^}]*display:\s*inline-flex;[^}]*min-height:\s*44px;[^}]*padding:\s*8px 13px;/);
  assert.match(rules, /:focus-visible,[\s\S]*?\{[^}]*outline:\s*3px solid var\(--pink-700\);[^}]*outline-offset:\s*3px;/);
});
