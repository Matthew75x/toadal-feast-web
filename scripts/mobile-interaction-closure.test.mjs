import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { rewriteCss } from './wo001-pages-basepath.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(root, 'studio-project', 'toadal-feast-website');
const advanced = JSON.parse(fs.readFileSync(path.join(projectRoot, 'collections', 'advanced-code.json'), 'utf8'));
const positionSource = fs.readFileSync(path.join(projectRoot, 'reference', 'assets', 'js', 'companion-position.js'), 'utf8');
const referenceCssPath = path.join(projectRoot, 'reference', 'assets', 'css', 'site.css');
const distCssPath = path.join(root, 'dist', 'assets', 'css', 'site.css');
const referenceCss = fs.readFileSync(referenceCssPath, 'utf8');
const distCss = fs.readFileSync(distCssPath, 'utf8');

function htmlFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const candidate = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...htmlFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(candidate);
  }
  return result;
}

test('companion source exposes persistent hide, explicit restore, and double-tap shortcut', () => {
  assert.doesNotThrow(() => new vm.Script(advanced.javascript));
  assert.match(advanced.javascript, /toadal:site:companion:hidden:v1/);
  assert.match(advanced.javascript, /data-companion-hide/);
  assert.match(advanced.javascript, /data-companion-restore/);
  assert.doesNotThrow(() => new vm.Script(positionSource));
  assert.match(positionSource, /button\.addEventListener\('pointerup'/);
  assert.match(positionSource, /toadal:companion-hide-request/);
  assert.match(positionSource, /ended\.moved/);
  assert.match(positionSource, /event\.timeStamp - ended\.startedAt <= TAP_MAX_DURATION/);
  assert.doesNotMatch(advanced.javascript, /lastToggleClickAt|DOUBLE_TAP_WINDOW/, 'global click handling must not duplicate the pointer gesture recognizer');
  assert.match(advanced.javascript, /setHidden\(true, false\)/);
  assert.match(advanced.javascript, /aria-label', 'Hide Toadal companion'/);
  assert.match(advanced.javascript, /'Expand Toadal companion' : 'Minimize Toadal companion'/);
  assert.match(advanced.javascript, /root\.setAttribute\('inert', ''\)/);
});

test('fullscreen exit remains a 44px accessible target with a compact visual treatment', () => {
  assert.match(advanced.javascript, /fullscreenExit\.setAttribute\('aria-label', 'Exit full screen'\)/);
  assert.match(referenceCss, /\.player-fullscreen-exit \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/);
  assert.match(referenceCss, /font-size: 0;/);
  assert.match(referenceCss, /\.player-fullscreen-exit::before/);
  assert.match(referenceCss, /env\(safe-area-inset-top, 0px\)/);
  assert.match(referenceCss, /env\(safe-area-inset-right, 0px\)/);
  assert.match(referenceCss, /\.wo002-player-frame-wrap:fullscreen \.player-fullscreen-rail/);
  assert.match(referenceCss, /\.wo002-player-frame-wrap:fullscreen \.player-fullscreen-exit \{[^}]*position: static;[^}]*font-size: 0;/);
  assert.match(advanced.javascript, /fullscreenRail\.hidden = !active/);
});

test('Studio reference CSS and public CSS are byte-identical', () => {
  assert.equal(distCss, referenceCss);
});

test('all generated site pages reference one exact cacheable Studio advanced runtime', () => {
  const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
  const derivedCss=rewriteCss(advanced.css,'/toadal-feast-web/').value;
  const cssName='advanced-code.'+sha(derivedCss).slice(0,12)+'.css';
  const jsName='advanced-code.'+sha(advanced.javascript).slice(0,12)+'.js';
  assert.equal(fs.readFileSync(path.join(root,'dist','assets','css',cssName),'utf8'),derivedCss);
  assert.equal(fs.readFileSync(path.join(root,'dist','assets','js',jsName),'utf8'),advanced.javascript);
  const files = htmlFiles(path.join(root, 'dist'));
  let projected = 0;
  let previewProjected = 0;
  for (const file of files) {
    const rel=path.relative(path.join(root,'dist'),file).replaceAll('\\','/');
    if(rel.startsWith('public/games/')) continue;
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html.includes('<script data-toadal-advanced-code>'), false, rel);
    assert.equal(html.includes('<style data-toadal-advanced-code>'), false, rel);
    assert.equal(html.includes('/toadal-feast-web/assets/js/'+jsName), true, rel);
    assert.equal(html.includes('/toadal-feast-web/assets/css/'+cssName), true, rel);
    if(rel.startsWith('previews/cards-phone-20261008/')) previewProjected += 1;
    else projected += 1;
  }
  assert.equal(projected, 34);
  assert.equal(previewProjected, 34);
});

test('protected game payloads do not receive the website advanced runtime', () => {
  const protectedRoot = path.join(root, 'dist', 'public', 'games');
  for (const file of htmlFiles(protectedRoot)) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html.includes('data-toadal-advanced-code'), false);
  }
});
