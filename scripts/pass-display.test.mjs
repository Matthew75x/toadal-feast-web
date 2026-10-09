import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const project = new URL('../studio-project/toadal-feast-website/', import.meta.url);
const home = JSON.parse(fs.readFileSync(new URL('pages/home.json', project)));
const nodes=[];
function walk(n) { nodes.push(n); (n.props?.children || []).forEach(walk); }
home.components.forEach(walk);
test('Home summary remains native and exposes a usable independent Show/Hide control', () => {
  const panel=nodes.find(n=>Object.hasOwn(n.props?.attributes || {},'data-pass-display'));
  const toggle=nodes.find(n=>Object.hasOwn(n.props?.attributes || {},'data-pass-display-toggle'));
  const body=nodes.find(n=>Object.hasOwn(n.props?.attributes || {},'data-pass-display-content'));
  assert.equal(panel.type,'layout.container'); assert.equal(toggle.type,'core.button'); assert.equal(toggle.props.tag,'button');
  assert.equal(toggle.props.attributes['aria-controls'],body.props.attributes.id);
  assert.ok(!body.props.children.some(n=>n.id===toggle.id));
  assert.ok(nodes.some(n=>n.props?.attributes?.['data-progression-stat']==='xp'));
  assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
});
test('projection never substitutes a zero balance for unreadable or future Pass data', () => {
  const storage=new Map();
  const api={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  let store=runtime.createStore({storage:api});
  assert.equal(runtime.passDisplayView(store.getSnapshot()).values.xp,0);
  storage.set(runtime.KEYS.pass,'{broken');
  store=runtime.createStore({storage:api});
  assert.equal(runtime.passDisplayView(store.getSnapshot()).available,false);
  assert.equal(runtime.passDisplayView(store.getSnapshot()).values,null);
  storage.set(runtime.KEYS.pass,JSON.stringify({schemaVersion:999,xp:999}));
  store=runtime.createStore({storage:api});
  assert.equal(runtime.passDisplayView(store.getSnapshot()).available,false);
});
test('a failed refresh is unavailable rather than presented as current local progress', () => {
  let fail=false;
  const store=runtime.createStore({storage:{getItem(){if(fail)throw Error('Denied');return null;},setItem(){},removeItem(){}}});
  fail=true;store.refreshFromStorage();
  const view=runtime.passDisplayView(store.getSnapshot());
  assert.equal(view.available,false); assert.match(view.note,/unavailable/);
});
test('temporary local progress is explicitly unsaved and never account-synced',()=>{
  const view=runtime.passDisplayView(runtime.createStore().getSnapshot());
  assert.match(view.note,/Temporary|unavailable/); assert.match(view.note,/Account sync is unavailable/);
});
test('visibility preference stays separate from progression and reset keys',()=>{
  assert.match(runtime.PASS_DISPLAY_KEY,/^toadal\.website\./);
  assert.ok(!Object.values(runtime.KEYS).includes(runtime.PASS_DISPLAY_KEY));
});
test('Home pinned runtime digest and generated runtime are current',()=>{
  const bytes=fs.readFileSync(new URL('reference/assets/js/guest-progression.js',project));
  const digest=crypto.createHash('sha256').update(bytes).digest('hex');
  const resource=nodes.flatMap(n=>n.props?.runtimeCodeResources || []).find(r=>r.url==='/assets/js/guest-progression.js');
  assert.equal(resource.sha256,digest);
  assert.deepEqual(fs.readFileSync(new URL('../dist/assets/js/guest-progression.js',import.meta.url)),bytes);
});

import vm from 'node:vm';
function displayFixture({initial=null,denyRead=false,denyWrite=false}={}) {
 const code=fs.readFileSync(new URL('reference/assets/js/guest-progression.js',project),'utf8');
 const from=code.indexOf('  function bindPassDisplay('), to=code.indexOf('\n  function boot(',from);
 const context={PASS_DISPLAY_KEY:runtime.PASS_DISPLAY_KEY,KEYS:runtime.KEYS,passDisplayView:runtime.passDisplayView};
 vm.createContext(context); vm.runInContext(code.slice(from,to)+';globalThis.bind=bindPassDisplay;',context);
 const make=()=>({textContent:'',attributes:{},handlers:{},disabled:true,hidden:false,setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},addEventListener(k,v){this.handlers[k]=v;}});
 const toggle=make(),content=make(),status=make(),progress=make(), panel=make(),root=make();
 const metrics=['level','xp','xp-to-next','sparks','treats'].map(key=>{const n=make();n.attributes['data-progression-stat']=key;return n;});
 const map={'[data-pass-display-toggle]':toggle,'[data-pass-display-content]':content,'[data-pass-display-preference-status]':status,'[data-progression-storage-status]':progress};
 panel.querySelector=k=>map[k];panel.querySelectorAll=()=>metrics;
 const doc={querySelector:()=>panel}; const control={denyRead,denyWrite,value:initial,writes:[]};
 const storage={getItem(k){assert.equal(k,runtime.PASS_DISPLAY_KEY);if(control.denyRead)throw Error('Denied');return control.value;},setItem(k,v){assert.equal(k,runtime.PASS_DISPLAY_KEY);if(control.denyWrite)throw Error('Denied');control.writes.push(k);control.value=v;}};
 let snapshot=runtime.createStore().getSnapshot();snapshot.storage.persistent=true;
 const store={getSnapshot:()=>snapshot};const render=context.bind(doc,root,storage,store);render();
 return {control,toggle,content,status,progress,metrics,root,storage,render,setSnapshot:s=>snapshot=s};
}
test('hide/show uses one namespaced preference, reload restores it, and content never owns its recovery button',()=>{
 const f=displayFixture();assert.equal(f.content.hidden,false);f.toggle.handlers.click();assert.equal(f.content.hidden,true);assert.equal(f.toggle.textContent,'Show Feast Pass');
 assert.equal(f.toggle.attributes['aria-expanded'],'false');assert.equal(f.control.value,'hidden');assert.equal(f.toggle.disabled,false);
 const next=displayFixture({initial:f.control.value});assert.equal(next.content.hidden,true);next.toggle.handlers.click();assert.equal(next.content.hidden,false);
 assert.deepEqual(f.control.writes,[runtime.PASS_DISPLAY_KEY]);
});
test('preference read/write failure and malformed preference preserve an operable toggle with truthful feedback',()=>{
 for(const options of [{denyRead:true},{denyWrite:true},{initial:'broken'}]){
  const f=displayFixture(options);if(!options.denyWrite)assert.match(f.status.textContent,/temporary|unreadable/);
  f.toggle.handlers.click();assert.equal(f.content.hidden,true);assert.equal(f.toggle.disabled,false);
  if(options.denyRead||options.denyWrite)assert.match(f.status.textContent,/temporary/);
  f.toggle.handlers.click();assert.equal(f.content.hidden,false);
 }
});
test('cross-tab visibility honors exact storage area and unrelated preference keys are ignored',()=>{
 const f=displayFixture();f.control.value='hidden';f.root.handlers.storage({storageArea:{},key:runtime.PASS_DISPLAY_KEY});assert.equal(f.content.hidden,false);
 f.root.handlers.storage({storageArea:f.storage,key:'unrelated'});assert.equal(f.content.hidden,false);
 f.root.handlers.storage({storageArea:f.storage,key:runtime.PASS_DISPLAY_KEY});assert.equal(f.content.hidden,true);
 f.control.value=null;f.root.handlers.storage({storageArea:f.storage,key:null});assert.equal(f.content.hidden,false);
});
test('same shared snapshot refreshes hidden metrics after a claim, reset or candy event; unavailable covers XP to next',()=>{
 const f=displayFixture();f.toggle.handlers.click();const s=runtime.createStore().getSnapshot();s.pass.xp=75;s.xpToNext=25;f.setSnapshot(s);f.render();
 assert.equal(f.metrics[1].textContent,'75');assert.equal(f.metrics[2].textContent,'25');assert.equal(f.content.hidden,true);
 s.pass.xp=0;s.xpToNext=100;f.render();assert.equal(f.metrics[1].textContent,'0');
 s.pass.treats=3;f.root.handlers['toadal:candy-found']();assert.equal(f.metrics[4].textContent,'3');
 s.storage.readOnlyKeys=[runtime.KEYS.pass];f.render();for(const n of f.metrics)assert.equal(n.textContent,'Unavailable');assert.match(f.progress.textContent,/No zero balance/);
 s.storage.readOnlyKeys=[];f.render();assert.equal(f.metrics[1].textContent,'0');
});
test('new preference feedback remains legible on narrow cream panels and desktop grid seam stays filled',()=>{
 const css=fs.readFileSync(new URL('reference/assets/css/site.css',project),'utf8');
 assert.match(css,/#feast-pass \.pass-display-preference-status \{ color: var\(--chocolate-800\)/);
 assert.match(css,/body:has\(\[data-pass-display\]\) #browser-games-intro \{ align-self: stretch; \}/);
});
