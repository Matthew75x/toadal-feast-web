import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.join(root, 'studio-project', 'toadal-feast-website');
const home = JSON.parse(fs.readFileSync(path.join(project, 'pages', 'home.json'), 'utf8'));
const advancedCode = JSON.parse(fs.readFileSync(path.join(project, 'collections', 'advanced-code.json'), 'utf8'));

function collectNodes(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (!Array.isArray(value)) output.push(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) collectNodes(child, output);
  return output;
}

function authoredText(value) {
  if (Array.isArray(value)) return value.map(authoredText).join('');
  if (!value || typeof value !== 'object') return '';
  const props = value.props || {};
  return (props.text || props.label || '') + authoredText(props.children || value.children || []);
}

function cssRule(css, selector) {
  const rules = [...css.matchAll(/([^{}\n]+)\{/g)];
  const match = rules.find(item => item[1].trim() === selector);
  assert.ok(match, 'Missing CSS rule: ' + selector);
  const open = css.indexOf('{', match.index);
  const close = css.indexOf('}', open);
  assert.ok(open > match.index && close > open, 'Malformed CSS rule: ' + selector);
  return css.slice(open + 1, close);
}

test('Home Feast Pass actions retain native order and destinations', () => {
  const all = collectNodes(home);
  const panel = all.find(node =>
    node.type === 'layout.container' &&
    String(node.props?.className || '').split(/\s+/).includes('home-feast-pass-panel')
  );
  assert.ok(panel, 'Native Home Feast Pass panel must remain editable');
  const panelNodes = collectNodes(panel);
  const primary = panelNodes.find(node =>
    node.type === 'core.button' && node.props?.href === '/feast-pass/'
  );
  const nav = panelNodes.find(node =>
    node.type === 'layout.container' &&
    node.props?.tag === 'nav' &&
    node.props?.className === 'feast-journey-links'
  );
  assert.ok(primary, 'Open Feast Pass remains a native link');
  assert.match(authoredText(primary), /Open Feast Pass/);
  assert.equal(primary.props.className, 'button-link button-link--secondary');
  assert.ok(nav, 'Secondary actions remain in the native labeled nav');
  assert.equal(nav.props.attributes['aria-label'], 'Continue your local Feast journey');
  assert.ok(panelNodes.indexOf(primary) < panelNodes.indexOf(nav), 'The main action precedes the secondary actions');
  assert.deepEqual(
    nav.props.children.map(node => ({ label: node.props.label, href: node.props.href })),
    [
      { label: 'Quests', href: '/feast-pass/quests/' },
      { label: 'Rewards & Treats', href: '/feast-pass/rewards/' },
      { label: 'Guest profile', href: '/profile/' }
    ]
  );
});

test('Home Feast Pass fills the reference, desktop-sidebar, and 390px mobile action widths', () => {
  const css = advancedCode.css;
  const primary = cssRule(css, 'body:has(.home-hero) #feast-pass .home-feast-pass-panel .feast-pass-copy a.button-link');
  const nav = cssRule(css, 'body:has(.home-hero) #feast-pass .feast-journey-links');
  const secondary = cssRule(css, 'body:has(.home-hero) #feast-pass .feast-journey-links > .button-link');

  assert.match(primary, /display:\s*flex/);
  assert.match(primary, /box-sizing:\s*border-box/);
  assert.match(primary, /width:\s*100%/);
  assert.match(primary, /min-height:\s*44px/);
  assert.match(nav, /display:\s*grid/);
  assert.match(nav, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(nav, /width:\s*100%/);
  assert.match(nav, /gap:\s*6px/);
  assert.match(secondary, /width:\s*100%/);
  assert.match(secondary, /min-width:\s*0/);
  assert.match(secondary, /min-height:\s*48px/);
  assert.match(secondary, /flex:\s*initial/);
  assert.match(secondary, /white-space:\s*normal/);
  assert.match(secondary, /text-align:\s*center/);

  const cases = [
    { name: 'reference narrow card', actionNavWidth: 300 },
    { name: 'desktop sidebar', actionNavWidth: 316 },
    { name: '390px mobile viewport', actionNavWidth: 310 }
  ];
  const navPadding = 8;
  const gap = 6;
  for (const item of cases) {
    const contentWidth = item.actionNavWidth - navPadding * 2;
    const trackWidth = (contentWidth - gap * 2) / 3;
    assert.ok(trackWidth >= 88, item.name + ' must keep every secondary action readable');
    assert.ok(
      Math.abs(trackWidth * 3 + gap * 2 - contentWidth) < 0.001,
      item.name + ' must distribute the complete available width across three equal actions'
    );
  }
});

function parseTag(raw) {
  const match = /^<([a-z][\w:-]*)\b([\s\S]*?)>$/i.exec(raw);
  if (!match) return null;
  const attributes = Object.create(null);
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const attribute of match[2].matchAll(pattern)) {
    attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
  }
  return { tag: match[1].toLowerCase(), attributes };
}

function classes(node) {
  return (node?.attributes?.class || '').split(/\s+/).filter(Boolean);
}

function exportedPassAnchor(html, expectedHref) {
  const bodyTag = /<body\b[^>]*>/i.exec(html);
  assert.ok(bodyTag, 'Exported Home page has a body');
  const bodyEnd = html.indexOf('</body', bodyTag.index);
  const body = html.slice(bodyTag.index, bodyEnd < 0 ? html.length : bodyEnd);
  const tags = [...body.matchAll(/<\/?[a-z][\w:-]*\b[^>]*>/gi)];
  assert.ok(tags.some(token => classes(parseTag(token[0])).includes('home-hero')),
    'body:has(.home-hero) applies on the exported Home page');
  const sectionToken = tags.find(token => {
    const node = parseTag(token[0]);
    return !token[0].startsWith('</') && node?.tag === 'section' && node.attributes.id === 'feast-pass';
  });
  assert.ok(sectionToken, 'Exported Home page retains the Feast Pass section');
  const labelAt = body.indexOf('Open Feast Pass', sectionToken.index);
  assert.ok(labelAt >= 0, 'Exported Home page retains the primary action');
  const anchorStart = body.lastIndexOf('<a', labelAt);
  const anchorRaw = body.slice(anchorStart).match(/^<a\b[^>]*>/i)?.[0];
  assert.ok(anchorStart > sectionToken.index && anchorRaw, 'Primary action remains an anchor in the pass section');
  const anchor = parseTag(anchorRaw);
  assert.equal(anchor.attributes.href, expectedHref, 'Exported destination remains correct for this base path');
  assert.ok(classes(anchor).includes('button-link'), 'Primary action retains its shared button class');

  const stack = [];
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const fragment = body.slice(sectionToken.index, anchorStart);
  for (const token of fragment.matchAll(/<\/?[a-z][\w:-]*\b[^>]*>/gi)) {
    const raw = token[0];
    const node = parseTag(raw.replace(/^<\//, '<'));
    if (!node) continue;
    if (raw.startsWith('</')) {
      const index = stack.findLastIndex(item => item.tag === node.tag);
      if (index >= 0) stack.splice(index);
    } else if (!voidTags.has(node.tag) && !/\/\s*>$/.test(raw)) {
      stack.push(node);
    }
  }
  const section = stack.find(node => node.tag === 'section' && node.attributes.id === 'feast-pass');
  const panel = stack.find(node => classes(node).includes('home-feast-pass-panel'));
  assert.ok(section && panel, 'Primary action is inside the Home Feast Pass panel');
  assert.ok(stack.some(node => classes(node).includes('feast-pass-copy')), 'Primary anchor remains inside .feast-pass-copy');
  return anchor;
}

function assertPrimaryWidthRule(css) {
  const selector = 'body:has(.home-hero) #feast-pass .home-feast-pass-panel .feast-pass-copy a.button-link';
  const rule = cssRule(css, selector);
  assert.doesNotMatch(selector, /\[href=/i, 'Primary width no longer depends on a deployed base-path URL');
  assert.match(rule, /display:\s*flex/);
  assert.match(rule, /box-sizing:\s*border-box/);
  assert.match(rule, /width:\s*100%/);
  assert.match(rule, /min-height:\s*44px/);
}

test('Home Feast Pass primary CTA selector matches root and base-path preview exports', () => {
  const exports = [
    { name: 'root export', file: path.join(root, 'dist', 'index.html'), href: '/toadal-feast-web/feast-pass/' },
    { name: 'cards-phone preview export', file: path.join(root, 'dist', 'previews', 'cards-phone-20261008', 'index.html'), href: '/toadal-feast-web/previews/cards-phone-20261008/feast-pass/' }
  ];
  for (const item of exports) {
    const html = fs.readFileSync(item.file, 'utf8');
    exportedPassAnchor(html, item.href);
    const cssFileName = [...html.matchAll(/(?:href|src)=["']([^"']*advanced-code\.[^/'"]+\.css)["']/g)]
      .map(match => path.basename(match[1]))[0];
    assert.ok(cssFileName, item.name + ' links the generated advanced-code stylesheet');
    const cssPath = path.join(root, 'dist', 'assets', 'css', cssFileName);
    assert.ok(fs.existsSync(cssPath), item.name + ' stylesheet is present');
    assertPrimaryWidthRule(fs.readFileSync(cssPath, 'utf8'));
  }
});
