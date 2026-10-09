import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import crypto from 'node:crypto';
import {normalizeCssUrlQuoteEntities} from './lib/normalize-css-url-quotes.mjs';
const root=path.resolve(import.meta.dirname,'..');
const project=path.join(root,'studio-project/toadal-feast-website');
const read=name=>JSON.parse(fs.readFileSync(path.join(project,name),'utf8'));
const home=read('pages/home.json'),code=read('collections/advanced-code.json');
const nodes=x=>Array.isArray(x)?x.flatMap(nodes):x&&typeof x==='object'?[...(x.props?[x]:[]),...Object.values(x).flatMap(nodes)]:[];
const all=nodes(home),cards=all.find(n=>n.id==='component.home.games').props.children;

test('approved original-design candidate keeps 33 editable routes and excludes unpublished Croaker draft',()=>{
 const index=read('pages/index.json');assert.equal(index.pages.length,33);
 assert.ok(!index.pages.some(p=>/croaker/i.test(p.id+' '+p.route)));
 assert.equal(all.filter(n=>n.type==='core.image'&&n.props.asset==='asset.owner.world.daylight-market-web').length,1);
 assert.ok(all.some(n=>n.type==='core.text'&&n.props.tag==='h1'&&n.props.text==='Play the Feast World for Free.'));
 assert.ok(!all.some(n=>n.type==='core.image'&&/mockup|primary-home-design-target/i.test(n.props.asset||'')));
});
test('four Home image stages are natively editable responsive 16:9 without cropping cover titles',()=>{
 assert.equal(cards.length,4);
 for(const card of cards){const art=nodes(card).find(n=>n.props?.attributes&&Object.hasOwn(n.props.attributes,'data-game-preview-stage'))||nodes(card).find(n=>n.type==='core.image');assert.equal(art.props.aspectRatio,'16/9');assert.equal(art.props.frameHeight||art.props.imageHeight,undefined);}
 assert.deepEqual(all.filter(n=>n.props?.attributes&&Object.hasOwn(n.props.attributes,'data-game-preview-gameplay')).map(n=>n.props.asset).sort(),['asset.home.game.claw-feed-gulper-preview','asset.home.game.wicked-bites-preview']);
 assert.match(code.css,/body:has\(\.home-hero\) #browser-games \[data-game-preview\] \[data-game-preview-stage\] img\s*\{\s*height: 100%;/);
 assert.match(code.css,/\[data-game-preview-link\]::after[^}]*inset:0/);
 assert.match(code.css,/\[data-game-preview-toggle\][^}]*z-index:2/);
});
test('all added approved assets are hash-verified, framed as promotion, and included in the authority lock',()=>{
 const catalog=read('assets/index.json');const lock=JSON.parse(fs.readFileSync(path.join(root,'manifests/visual-asset-authority-lock.json'),'utf8'));
 const ids=lock.ownerApprovedAdditions20261008.assetIds;assert.equal(ids.length,6);
 for(const id of ids){const a=catalog.assets.find(a=>a.id===id);assert.ok(a);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(project,a.source))).digest('hex'),a.sha256);assert.ok(lock.registeredAssetSnapshot.some(s=>s.id===id&&s.sha256===a.sha256));}
 assert.ok(!ids.some(id=>/croaker|draft-cover/.test(id)));
 assert.equal(lock.brand.finalFranchiseWordmark.status,'NOT_PRESENT_NOT_APPROVED');
});
function companionHarness(){
 // Exercise the actual render function with small DOM stubs; no copied decision logic.
 const start=code.javascript.indexOf('    function render(announce) {');
 const end=code.javascript.indexOf('\n    function ',start+10);
 const fn=code.javascript.slice(start,end);
 const selectorStart=code.javascript.indexOf('    function selectContextValue(');
 const selectorEnd=code.javascript.indexOf('\n    function enterHoverContext(',selectorStart);
 assert.ok(selectorStart>=0&&selectorEnd>selectorStart,'actual modality-aware selector helper exists');
 const selector=code.javascript.slice(selectorStart,selectorEnd);
 const source=fn.replace(/function render\(announce\)/,'function render(announce)');
 const attrs={};const root={hidden:false,setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]};
 const panel={hidden:false};const toggle={setAttribute:(k,v)=>attrs['toggle:'+k]=v};
 const speech={textContent:'',setAttribute:(k,v)=>attrs['speech:'+k]=v};
 const ctx={root,panel,toggle,speech,attrs,companionHidden:false,minimized:true,lastInput:'pointer',action:null,focused:null,hovered:null,touched:null,currentSection:{copy:'Explore this world. Your progress stays in this browser.',artwork:'world.webp',reaction:'thinking'},hero:null,defaultCompanionImage:'default.webp',artworkRequest:0,syncVisibilityControls(){},contextValue:v=>v,applyArtwork:v=>{ctx.artwork=v;}};
 vm.createContext(ctx);vm.runInContext(selector+'\n'+source+'; globalThis.run=render;',ctx);return ctx;
}
test('minimized speech stays closed on hover/focus; expanded context retains artwork and two-sentence speech',()=>{
 const h=companionHarness();h.hovered={copy:'Meet the cast. Choose a character to explore.',artwork:'cast.webp',reaction:'friendly'};h.run(false);assert.equal(h.panel.hidden,true);assert.equal(h.artwork,'cast.webp');
 h.lastInput='keyboard';h.focused={copy:'Explore this world. Your progress stays in this browser.',artwork:'world.webp',reaction:'thinking'};h.run(false);assert.equal(h.panel.hidden,true);assert.equal(h.artwork,'world.webp');
 h.minimized=false;h.run(true);assert.equal(h.panel.hidden,false);assert.equal(h.speech.textContent,'Explore this world. Your progress stays in this browser.');assert.equal(h.attrs['speech:aria-live'],'polite');
 h.companionHidden=true;h.run(true);assert.equal(h.panel.hidden,true);assert.equal(h.root.hidden,true);assert.ok(Object.hasOwn(h.attrs,'inert'));
 assert.match(code.javascript,/localStorage\.setItem\(hiddenKey, companionHidden \? 'true' : 'false'\)/);
});
test('embedding guard remains intact and narrow fallback retains accessible navigation',()=>{
 assert.match(code.javascript,/function start\(\) \{\s*if \(window.self !== window.top\) return;/);
 assert.match(code.css,/\.site-nav:not\(\[data-menu-enhanced='true'\]\) \.site-links[^}]*overflow-x:auto/);
 assert.match(code.css,/\.toadal-companion:not\(\[data-panel-visible\]\) \.companion-panel \{ display:none; \}/);
});

test('Home companion collision inputs include compact authored headings without changing its saved placement contract',()=>{
 const positioning=fs.readFileSync(path.join(project,'reference/assets/js/companion-position.js'),'utf8');
 assert.match(positioning,/if \(!headerOnly && document.querySelector\('\.home-hero'\)\)/);
 for(const token of ['.home-discovery-heading','.discovery-heading','.whats-next-heading','.today-copy','.feast-pass-copy','.next-card','.app-conversion-copy','toadal:site:companion:position:v1','manualPosition = saved.manual === true'])assert.ok(positioning.includes(token));
 const story=all.find(n=>n.id==='component.home.discovery.b12e056d5c73.stories-art-toadal');assert.equal(story.props.imageHeight,88);assert.equal(story.props.fit,'contain');
});

test('freshness normalization accepts only equivalent paired inline CSS URL quote entities',()=>{
 const single='background-image:url(&#39;/assets/world.webp&#39;);background-size:cover';
 const double='background-image:url(&quot;/assets/world.webp&quot;);background-size:cover';
 assert.equal(normalizeCssUrlQuoteEntities(single),double);
 assert.notEqual(normalizeCssUrlQuoteEntities(single.replace('world.webp','wrong.webp')),double);
 assert.notEqual(normalizeCssUrlQuoteEntities(single.replace('cover','contain')),double);
 assert.notEqual(normalizeCssUrlQuoteEntities(single.replace('&#39;)', '&quot;)')),double);
});

test('Reader collision protection is limited to its existing sidebar and heading blocks',()=>{
 const positioning=fs.readFileSync(path.join(project,'reference/assets/js/companion-position.js'),'utf8');
 assert.match(positioning,/if \(!headerOnly && document.querySelector\('\.comic-reader-page'\)\) \{\s*selectors \+= ', \.reader-side-panel, \.reader-page-heading';\s*\}/);
 assert.match(positioning,/if \(manualPosition\) return \{ x: saved.x, y: saved.y \}/);
 assert.match(positioning,/if \(window.self !== window.top\) return;/);
});

test('dense Home desktop can dock in a measured header gap without resetting user placement',()=>{
 const positioning=fs.readFileSync(path.join(project,'reference/assets/js/companion-position.js'),'utf8');
 const start=positioning.indexOf('    function mobileDock() {'),end=positioning.indexOf('\n    function setDock',start);
 const ctx={manualPosition:false,window:{innerWidth:1180},root:{getAttribute:()=> 'true'},EDGE_GAP:12,getComputedStyle:()=>({display:'flex'}),gapRight:400};
 const brand={getBoundingClientRect:()=>({right:220,top:14,height:32,bottom:46})};
 const links={getBoundingClientRect:()=>({left:ctx.gapRight,bottom:58})};
 ctx.document={querySelector:s=>s==='.home-hero, .wo002-game-library'?{}:s==='.site-nav'?{querySelector:s=>s==='.site-brand'?brand:links}:null};
 vm.createContext(ctx);vm.runInContext(positioning.slice(start,end)+';globalThis.dock=mobileDock;',ctx);
 const dock=ctx.dock();assert.equal(dock.kind,'desktop');assert.equal(dock.width,52);assert.ok(dock.x>=233&&dock.x+52<=387);
 ctx.gapRight=270;assert.equal(ctx.dock(),null,'insufficient measured gap keeps existing body fallback');
 ctx.gapRight=400;ctx.manualPosition=true;assert.equal(ctx.dock(),null,'deliberate saved/dragged placement is not overridden');
 ctx.manualPosition=false;ctx.root.getAttribute=()=> 'false';assert.equal(ctx.dock(),null,'expanded companion retains existing placement path');
 assert.ok(positioning.includes('.today-panel, .home-feast-pass-panel'));
});

test('concise Home daily labels preserve runtime states and do not rewrite unknown or error text',()=>{
 const start=code.javascript.indexOf('  function conciseDailyCopy(status) {'),end=code.javascript.indexOf('\n  function start()',start);
 const ctx={};vm.createContext(ctx);vm.runInContext(code.javascript.slice(start,end)+';globalThis.apply=conciseDailyCopy;',ctx);
 const status={textContent:'A starter-config UTC-day check-in is available. Progress is local to this browser.',getAttribute:k=>k==='data-daily-ready-copy'?'Today’s check-in is ready.':'You’ve checked in today.'};
 ctx.apply(status);assert.equal(status.textContent,'Today’s check-in is ready.');
 status.textContent='Today’s UTC check-in is already claimed.';ctx.apply(status);assert.equal(status.textContent,'You’ve checked in today.');
 for(const text of ['No daily check-in is configured.','Browser storage is unavailable.','Claim failed.']){status.textContent=text;ctx.apply(status);assert.equal(status.textContent,text);}
 const runtime=fs.readFileSync(path.join(project,'reference/assets/js/guest-progression.js'));assert.equal(crypto.createHash('sha256').update(runtime).digest('hex'),'5e795b22398fed42de68bacc6448c5813610f605bb6745d0163c1961f6840338');
 const daily=all.find(n=>n.props?.className==='today-checkin-status');assert.equal(daily.props.attributes['data-daily-ready-copy'],'Today’s check-in is ready.');
});

test('Home real-gameplay CTA retains a 44px target outside desktop-only media rules',()=>{
 const selector='body:has(.home-hero) #app .app-conversion-panel--production .app-more-link';
 const marker=selector+' { min-height:44px; }';
 const at=code.css.lastIndexOf(marker);assert.ok(at>=0);
 const before=code.css.slice(0,at).replace(/\/\*[\s\S]*?\*\//g,'');
 assert.equal(before.split('{').length,before.split('}').length,'target rule applies outside a media query');
 const app=all.find(n=>n.props?.className?.includes('app-more-link'));assert.equal(app.props.href,'/app/');
});

test('three standalone future-card heading links have 44px Home-scoped targets',()=>{
 const links=all.filter(n=>n.props?.className==='next-card-title-link');assert.equal(links.length,3);
 assert.deepEqual(links.map(n=>n.props.href).sort(),['/account/','/community/','/store/']);
 assert.match(code.css,/body:has\(\.home-hero\) #whats-next \.next-card-title-link \{ display:flex; align-items:center; min-height:44px; padding-block:4px; box-sizing:border-box; \}/);
});
