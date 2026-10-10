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
  let previewCount=0;
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
        if(rel.startsWith('previews/cards-phone-20261008/')) previewCount++;
        else count++;
      }
    }
  }
  walk(path.join(root,'dist')); assert.equal(count,34);
  assert.equal(previewCount,34);
});

test('native preview Home image height outranks canonical card breakpoints',()=>{
  const preview=path.join(root,'dist','previews','cards-phone-20261008');
  const native=fs.readFileSync(path.join(preview,'assets/css/approved-native-card-phone.css'),'utf8');
  const selector='body:has(.home-hero) #browser-games [data-game-preview] [data-game-preview-stage] img';
  const rules=[...native.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const fixed=rules.filter(([,s])=>s.replace(/\/\*[\s\S]*?\*\//g,'').trim()===selector);
  assert.equal(fixed.length,1);
  assert.equal(fixed[0][2].trim(),'height: 100%;');
  // :has adopts .home-hero specificity: repair (1,3,2) > legacy (1,2,2).
  // Keep this declaration unconditional so every canonical width is covered.
  assert.equal(native.slice(0,fixed[0].index).replace(/\/\*[\s\S]*?\*\//g,'').split('{').length,
    native.slice(0,fixed[0].index).replace(/\/\*[\s\S]*?\*\//g,'').split('}').length);
  const advanced=fs.readFileSync(path.join(preview,'assets/css/advanced-code.2df1f6e8de1a.css'),'utf8');
  assert.match(advanced,/body:has\(\.home-hero\) #browser-games \.studio-game-card img\s*\{\s*height:120px;/);
  assert.match(advanced,/body:has\(\.home-hero\) #browser-games \.studio-game-card img\s*\{\s*height:92px;/);
  assert.match(native,/\[data-game-preview\] \[data-game-preview-stage\] img\s*\{[^}]*height:\s*100%;/);
});

test('native preview uses full-bleed covers, separate authentic captures, and excludes App',()=>{
  const preview=path.join(root,'dist','previews','cards-phone-20261008');
  const home=fs.readFileSync(path.join(preview,'index.html'),'utf8');
  assert.match(home,/class=['"]home-hero['"]/);
  assert.match(home,/id=['"]browser-games['"]/);
  const images=[...home.matchAll(/<img\b[^>]*\bdata-game-preview-(?:cover|gameplay)(?:\s|=)[^>]*>/g)];
  assert.equal(images.length,5);
  for(const [image] of images){
    assert.match(image,image.includes('data-game-preview-gameplay')?/object-fit:contain/:/object-fit:cover/);
    assert.match(image,/object-position:50% 50%/);
  }
  const stages=[...home.matchAll(/<[^>]*\bdata-game-preview-stage(?:\s|=)[^>]*>/g)];
  assert.equal(stages.length,3);
  for(const [stage] of stages) assert.match(stage,/aspect-ratio:16\/9/);
  for(const page of ['play/index.html','app/index.html']){
    const html=fs.readFileSync(path.join(preview,page),'utf8');
    assert.doesNotMatch(html,/class=['"][^'"]*\bhome-hero\b/);
  }
});
