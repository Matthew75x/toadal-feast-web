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
  const primary = cssRule(css, 'body:has(.home-hero) #feast-pass a.button-link[href="/feast-pass/"]');
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