import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { rewriteCss } from './wo001-pages-basepath.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const project=path.join(root,'studio-project','toadal-feast-website');
const advanced=JSON.parse(fs.readFileSync(path.join(project,'collections','advanced-code.json'),'utf8'));
const css=fs.readFileSync(path.join(project,'reference','assets','css','site.css'),'utf8');
const support=fs.readFileSync(path.join(project,'pages','support.json'),'utf8');

test('navigation exposes one synchronized Show/Hide Toadal preference control',()=>{
  assert.doesNotThrow(()=>new vm.Script(advanced.javascript));
  assert.match(advanced.javascript,/data-companion-nav-visibility/);
  assert.match(advanced.javascript,/navLinks\.appendChild\(navVisibilityButton\)/);
  assert.match(advanced.javascript,/companionHidden \? 'Show Toadal' : 'Hide Toadal'/);
  assert.match(advanced.javascript,/aria-pressed', companionHidden \? 'false' : 'true'/);
  assert.match(advanced.javascript,/setHidden\(!companionHidden, true, navVisibilityButton\)/);
  assert.match(advanced.javascript,/data-companion-persistence/);
});
test('hidden helper is inert and skips companion-only reaction/render work',()=>{
  assert.match(advanced.javascript,/root\.setAttribute\('inert', ''\)/);
  assert.match(advanced.javascript,/if \(companionHidden\) \{\s*artworkRequest \+= 1;\s*root\.removeAttribute\('data-companion-current-reaction'\);\s*return;/);
  assert.match(advanced.javascript,/if \(companionHidden\) return;\s*clearTouchedContext\(\)/);
  assert.match(advanced.javascript,/if \(companionHidden \|\| event\.pointerType === 'touch'\) return;/);
  assert.match(advanced.javascript,/syncLocalStatus\(\);\s*if \(companionHidden\) return;/);
  assert.match(advanced.javascript,/if \(!companionHidden\) render\(false\)/);
});
test('visibility failures remain usable in memory and do not claim persistence',()=>{
  assert.match(advanced.javascript,/hiddenPreferenceState = 'temporary'/);
  assert.match(advanced.javascript,/hiddenPreferenceState = 'invalid'/);
  assert.match(advanced.javascript,/Browser storage is unavailable/);
  assert.match(advanced.javascript,/saved Toadal visibility preference was unreadable/);
});
test('navigation control is keyboard/touch sized and support copy teaches both recovery paths',()=>{
  assert.match(css,/\.site-links \.companion-nav-visibility \{[\s\S]*?min-height: 42px/);
  assert.match(css,/@media \(max-width: 960px\) \{[\s\S]*?\.site-links \.companion-nav-visibility \{ min-height: 44px/);
  assert.match(css,/\.companion-nav-visibility:focus-visible/);
  assert.match(support,/Show Toadal in the navigation menu or footer/);
  assert.match(support,/navigation menu's Show\/Hide Toadal control/);
});
test('existing double tap, footer recovery, minimized preference and position contract are retained',()=>{
  for(const token of ['toadal:site:companion:minimized:v1','toadal:site:companion:hidden:v1','data-companion-restore','toadal:companion-hide-request'])
    assert.equal(advanced.javascript.includes(token),true,token);
  const position=fs.readFileSync(path.join(project,'reference','assets','js','companion-position.js'),'utf8');
  assert.match(position,/touch-double-tap/);
  assert.match(position,/toadal:site:companion:position:v1/);
});
test('generated site pages project one cacheable advanced runtime and CSS after export',()=>{
  const distCss=fs.readFileSync(path.join(root,'dist','assets','css','site.css'),'utf8');
  assert.equal(distCss,css);
  const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
  const derivedCss=rewriteCss(advanced.css,'/toadal-feast-web/').value;
  const cssName='advanced-code.'+sha(derivedCss).slice(0,12)+'.css';
  const jsName='advanced-code.'+sha(advanced.javascript).slice(0,12)+'.js';
  assert.equal(fs.readFileSync(path.join(root,'dist','assets','css',cssName),'utf8'),derivedCss);
  assert.equal(fs.readFileSync(path.join(root,'dist','assets','js',jsName),'utf8'),advanced.javascript);
  let count=0;
  function walk(dir){
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      const p=path.join(dir,e.name);
      if(e.isDirectory()) walk(p);
      else if(e.isFile()&&e.name.endsWith('.html')){
        const rel=path.relative(path.join(root,'dist'),p).replaceAll('\\','/');
        if(rel.startsWith('public/games/')) return;
        const html=fs.readFileSync(p,'utf8');
        assert.equal(html.includes('<style data-toadal-advanced-code>'),false,rel);
        assert.equal(html.includes('<script data-toadal-advanced-code>'),false,rel);
        assert.equal(html.includes('/toadal-feast-web/assets/css/'+cssName),true,rel);
        assert.equal(html.includes('/toadal-feast-web/assets/js/'+jsName),true,rel);
        count++;
      }
    }
  }
  walk(path.join(root,'dist')); assert.equal(count,33);
});
