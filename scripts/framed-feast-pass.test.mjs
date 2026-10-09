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
 const classes=new Set(),callbacks=[],mutations=[],sizes=[],calls=[];
 const heading={textContent:text,isConnected:true,offsetLeft:17,offsetTop:22,getBoundingClientRect:()=>({width:250,height:35}),classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},after:c=>heading.canvas=c};
 const doc={readyState:'complete',fonts:[{family:"'Lilita One'",status:font}],querySelectorAll:()=>[heading],querySelector:()=>({href:'https://qa.invalid/toadal-feast-web/'}),createElement:tag=>({tag,style:{},setAttribute(k,v){this[k]=v;}}),head:{appendChild:s=>{calls.push(s.src);s.onload();}}};
 const runtime={whenReady:f=>ready?f():callbacks.push(f),paintSafe:(c,get)=>{assert.equal(typeof get,'function');calls.push(get());},paint:()=>paint};
 vm.runInNewContext(adapter,{document:doc,location:{href:'https://qa.invalid/toadal-feast-web/'},URL,TOADAL:runtime,window:{addEventListener(){}},requestAnimationFrame:f=>f(),MutationObserver:class{constructor(f){mutations.push(f);}observe(){}},ResizeObserver:class{constructor(f){sizes.push(f);}observe(){}}});
 return {heading,classes,callbacks,mutations,sizes,calls};
}
test('loaded font and successful paint alone enable the decorative canvas',()=>{
 const f=fixture();assert.ok(f.classes.has('feast-pass-lettering-ready'));assert.equal(f.heading.canvas.hidden,false);
 assert.equal(f.heading.canvas['aria-hidden'],'true');assert.equal(f.heading.textContent,'Your Feast Pass');assert.equal(f.calls[0],'/toadal-feast-web/assets/js/toadal-lettering.js');
});
test('resolved font failure, paint failure, hidden geometry and unsupported text retain visible semantic fallback',()=>{
 for(const options of [{font:'error'},{font:'loading'},{paint:false},{text:'A'.repeat(33)},{text:'文字'}]){
  const f=fixture(options);assert.equal(f.heading.canvas.hidden,true);assert.equal(f.classes.has('feast-pass-lettering-ready'),false);
 }
 const f=fixture();f.heading.getBoundingClientRect=()=>({width:0,height:0});f.sizes[0]();assert.equal(f.heading.canvas.hidden,true);assert.equal(f.classes.has('feast-pass-lettering-ready'),false);
});
test('delayed font completion and later text edits paint current source text without replacing it',()=>{
 const f=fixture({ready:false});f.heading.textContent='My Feast Pass';f.callbacks[0]();assert.equal(f.calls.at(-1).letterText,'My Feast Pass');
 f.heading.textContent='Another Feast';f.mutations[0]();assert.equal(f.calls.at(-1).letterText,'Another Feast');assert.equal(f.heading.textContent,'Another Feast');
});
