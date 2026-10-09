import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const project = new URL('../studio-project/toadal-feast-website/', import.meta.url);
const read = p => fs.readFileSync(new URL(p, project));
const json = p => JSON.parse(read(p));
const code = json('collections/advanced-code.json');
const adapter = code.javascript.slice(code.javascript.indexOf('/* Framed Feast Pass v1:'));
const nodes = list => list.flatMap(n => [n,...nodes(n.props?.children || [])]);
const home = nodes(json('pages/home.json').components), full = nodes(json('pages/feast-pass.json').components);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

test('framed headings and frame remain native editable nodes on both routes', () => {
 for (const list of [home, full]) {
  const heading=list.find(n=>n.props.className?.split(' ').includes('feast-pass-lettering'));
  assert.equal(heading.type,'core.text'); assert.equal(heading.props.text,'Your Feast Pass');
  assert.equal(heading.props.authoringVersion,1); assert.ok(!heading.props.locked); assert.ok(!heading.props.html);
  const frame=list.find(n=>n.props.className==='feast-pass-title-frame');
  assert.equal(frame.type,'core.image');assert.equal(frame.props.asset,'asset.feast-pass.astro-frame');assert.equal(frame.props.alt,'');
  assert.equal(frame.props.attributes['aria-hidden'],'true');assert.ok(!frame.props.locked);
  assert.equal(new Set(list.map(n=>n.id)).size,list.length);
 }
 assert.deepEqual(json('project.json').plugins,[],'No SDK plugin or engine extension is needed');
 assert.match(code.css,/\.framed-feast-pass--full \.portal-pass-hero \.feast-pass-lettering \{ color:#ffe49a;/,'Full native fallback overrides the inherited H1 skin');
});
test('approved standalone runtime and frame are exact and carry their notices', () => {
 assert.equal(sha(read('reference/assets/js/toadal-lettering.js')),'7188d0199bcb2c4e37d46254059f1d7b759b183e2088f7df83bc5bd44eb4721b');
 for(const f of ['NOTICE.md','LilitaOne-OFL.txt'])assert.ok(read('reference/assets/licenses/toadal-lettering/'+f).length>50);
 const a=json('assets/index.json').assets.find(a=>a.id==='asset.feast-pass.astro-frame');
 const pixels=read(a.source);assert.equal(a.width,pixels.readUInt32BE(16));assert.equal(a.height,pixels.readUInt32BE(20));
 assert.equal(sha(pixels),a.sha256);assert.equal(a.provenance.commit,'c912c44a7333e143761fc3a1617da64adb07e633');
 assert.equal(a.provenance.source,'services/share-cards/assets/astro-score-frame.png');
});
test('existing runtime metrics, show/hide and reset controls remain present',()=>{
 for(const key of ['level','xp','xp-to-next','sparks','treats'])for(const list of [home,full])assert.ok(list.some(n=>n.props.attributes?.['data-progression-stat']===key),key);
 assert.ok(home.some(n=>Object.hasOwn(n.props.attributes||{},'data-pass-display-toggle')));
 assert.ok(home.some(n=>Object.hasOwn(n.props.attributes||{},'data-pass-display-content')));
 assert.ok(full.some(n=>Object.hasOwn(n.props.attributes||{},'data-clear-progression')));
 assert.doesNotMatch(adapter,/localStorage|sessionStorage|fetch\(|\.innerHTML|data-studio-runtime/);
 assert.doesNotMatch(code.css.slice(code.css.indexOf('/* Framed Feast Pass v1.')),/!important/,'Native inline editing remains authoritative');
});
function fixture({font='loaded',paint=true,text='Your Feast Pass',ready=true}={}){
 const classes=new Set(),callbacks=[],mutations=[],sizes=[],paints=[],scriptLoads=[],windowEvents={},fontEvents={};
 const face={family:"'Lilita One'",status:font};
 const fonts=[face];
 fonts.addEventListener=(name,fn)=>{(fontEvents[name] ||= []).push(fn);};
 const rect={width:250,height:35};
 const heading={textContent:text,isConnected:true,offsetLeft:17,offsetTop:22,getBoundingClientRect:()=>rect,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},after:c=>heading.canvas=c};
 const doc={readyState:'complete',fonts,querySelectorAll:()=>[heading],querySelector:()=>({href:'https://qa.invalid/toadal-feast-web/'}),createElement:tag=>({tag,style:{},setAttribute(k,v){this[k]=v;}}),head:{appendChild:s=>{scriptLoads.push(s.src);s.onload();}}};
 let paintResult=paint;
 const runtime={whenReady:f=>ready?f():callbacks.push(f),paintSafe:()=>{throw new Error('paintSafe should not be used by the already-ready adapter');},paint:(canvas,settings)=>{paints.push({canvas,settings:{...settings}});return typeof paintResult==='function'?paintResult(canvas,settings):paintResult;}};
 const window={devicePixelRatio:1,addEventListener:(name,fn)=>{(windowEvents[name] ||= []).push(fn);}};
 vm.runInNewContext(adapter,{document:doc,location:{href:'https://qa.invalid/toadal-feast-web/'},URL,TOADAL:runtime,window,requestAnimationFrame:f=>f(),MutationObserver:class{constructor(f){mutations.push(f);}observe(){}},ResizeObserver:class{constructor(f){sizes.push(f);}observe(){}}});
 const emitFont=(name,event={fontfaces:[face]})=>(fontEvents[name]||[]).forEach(f=>f(event));
 const emitWindow=name=>(windowEvents[name]||[]).forEach(f=>f());
 return {heading,classes,callbacks,mutations,sizes,paints,scriptLoads,face,fonts,rect,window,emitFont,emitWindow,setPaintResult:value=>{paintResult=value;}};
}
test('loaded font paints once and enables the decorative canvas while native text stays intact',()=>{
 const f=fixture();assert.ok(f.classes.has('feast-pass-lettering-ready'));assert.equal(f.heading.canvas.hidden,false);
 assert.equal(f.heading.canvas['aria-hidden'],'true');assert.equal(f.heading.textContent,'Your Feast Pass');assert.equal(f.scriptLoads[0],'/toadal-feast-web/assets/js/toadal-lettering.js');
 assert.equal(f.paints.length,1,'ready callback must not synchronously paint twice');
});
test('no-op observer notifications skip raster work but still update canvas placement',()=>{
 const f=fixture();assert.equal(f.paints.length,1);
 f.heading.offsetLeft=25;f.heading.offsetTop=34;
 f.mutations[0]();f.sizes[0]();f.emitWindow('resize');
 assert.equal(f.paints.length,1);assert.equal(f.heading.canvas.style.left,'25px');assert.equal(f.heading.canvas.style.top,'34px');
 assert.equal(f.heading.canvas.hidden,false);assert.ok(f.classes.has('feast-pass-lettering-ready'));
});
test('raster signature covers every preset field, dimensions, DPR and font revision',()=>{
 const start=adapter.indexOf('function rasterSignature('),end=adapter.indexOf('\n  function start()',start);
 assert.ok(start>=0&&end>start);
 const context={};vm.runInNewContext(adapter.slice(start,end)+'\nglobalThis.signature=rasterSignature;',context);
 const base={w:250,h:35,letterText:'Your Feast Pass',paletteMode:'rainbow',tightness:100,outlineWidth:4};
 const sig=context.signature(base,1,0,true);
 assert.notEqual(context.signature({...base,outlineWidth:5},1,0,true),sig,'preset edits invalidate');
 assert.notEqual(context.signature({...base,w:251},1,0,true),sig,'dimensions invalidate');
 assert.notEqual(context.signature(base,2,0,true),'DPR invalidates');
 assert.notEqual(context.signature(base,1,1,true),'font events invalidate');
 assert.notEqual(context.signature(base,1,0,false),'font readiness is part of the key');
});
test('text, geometry, DPR and relevant font events invalidate; unrelated font events do not repaint',()=>{
 const f=fixture();assert.equal(f.paints.length,1);
 f.heading.textContent='My Feast Pass';f.mutations[0]();assert.equal(f.paints.length,2);assert.equal(f.paints.at(-1).settings.letterText,'My Feast Pass');
 f.rect.width=275;f.sizes[0]();assert.equal(f.paints.length,3);assert.equal(f.paints.at(-1).settings.w,275);
 f.window.devicePixelRatio=2;f.emitWindow('resize');assert.equal(f.paints.length,4);
 f.emitFont('loadingdone',{fontfaces:[{family:'Arial',status:'loaded'}]});assert.equal(f.paints.length,4);
 f.emitFont('loadingdone',{fontfaces:[f.face]});assert.equal(f.paints.length,5);
});
test('font loading races and later native text edits use current text after the face becomes ready',()=>{
 const f=fixture({font:'loading',ready:false});f.heading.textContent='My Feast Pass';f.callbacks[0]();assert.equal(f.paints.length,0);
 f.face.status='loaded';f.emitFont('loadingdone');assert.equal(f.paints.length,1);assert.equal(f.paints[0].settings.letterText,'My Feast Pass');
 f.heading.textContent='Another Feast';f.mutations[0]();assert.equal(f.paints.at(-1).settings.letterText,'Another Feast');assert.equal(f.heading.textContent,'Another Feast');
});
test('paint failure clears the successful cache and preserves semantic fallback',()=>{
 const f=fixture();assert.equal(f.paints.length,1);
 f.setPaintResult(false);f.heading.textContent='A different pass';f.mutations[0]();
 assert.equal(f.paints.length,2);assert.equal(f.heading.canvas.hidden,true);assert.equal(f.classes.has('feast-pass-lettering-ready'),false);
 f.setPaintResult(true);f.heading.textContent='Your Feast Pass';f.mutations[0]();
 assert.equal(f.paints.length,3,'failed raster must not leave a stale successful signature');
 assert.equal(f.heading.canvas.hidden,false);assert.ok(f.classes.has('feast-pass-lettering-ready'));assert.equal(f.heading.textContent,'Your Feast Pass');
});
test('font failure, invalid geometry and unsupported text retain visible semantic fallback',()=>{
 for(const options of [{font:'error'},{font:'loading'},{paint:false},{text:'A'.repeat(33)},{text:'文字'}]){
  const f=fixture(options);assert.equal(f.heading.canvas.hidden,true);assert.equal(f.classes.has('feast-pass-lettering-ready'),false);
 }
 const f=fixture();f.rect.width=0;f.sizes[0]();assert.equal(f.heading.canvas.hidden,true);assert.equal(f.classes.has('feast-pass-lettering-ready'),false);
});
test('delayed engine readiness paints latest native text exactly once',()=>{
 const f=fixture({ready:false});f.heading.textContent='My Feast Pass';f.callbacks[0]();assert.equal(f.paints.length,1);assert.equal(f.paints[0].settings.letterText,'My Feast Pass');
});
