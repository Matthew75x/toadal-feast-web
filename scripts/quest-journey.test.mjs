import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const { KEYS, createStore, questJourneyView, questDestination } = runtime;
function fixture(custom = definitions) {
  const data = new Map(), writes = [], denied = new Set();
  let day = '2026-10-06T12:00:00.000Z';
  const storage = { getItem:key=>data.get(key)??null,
    setItem(key,value){if(denied.has(key))throw new Error('controlled write denial');data.set(key,String(value));writes.push(key);},
    removeItem:key=>data.delete(key) };
  const store = createStore({storage,definitions:custom,now:()=>new Date(day)});
  return {data,writes,denied,storage,store,setDay:value=>{day=value;},view:()=>questJourneyView(store.getSnapshot(),custom)};
}
function completeExploration(f) {
  for (const route of ['world','stories']) {
    f.store.recordEvent('route:/'+route+'/'); assert.equal(f.store.claimQuest('visit-'+route).ok,true);
  }
  for (let i=0;i<4;i++)f.store.hitGoldenBlock();
  for (const id of ['portal-candy','lower-page-candy','golden-block-candy'])assert.equal(f.store.collectHomeCandy(id).ok,true);
  assert.equal(f.store.claimQuest('find-feast-treats').ok,true);
}
test('new guest sees actual active quests and World as the first reachable activity',()=>{
 const f=fixture(),v=f.view();assert.equal(v.available,true);assert.deepEqual(v.counts,{all:4,active:4,ready:0,claimed:0});
 assert.equal(v.next.questId,'visit-world');assert.equal(v.next.href,'/world/');assert.equal(f.writes.length,0);
 assert.equal(v.rows.find(r=>r.id==='find-feast-treats').href,'/#interactive-discovery');
});
test('visiting World creates a ready quest but does not claim or mint a reward',()=>{
 const f=fixture();f.store.recordEvent('route:/world/');const v=f.view();
 assert.equal(v.next.kind,'ready');assert.equal(v.next.questId,'visit-world');assert.equal(v.next.href,'/feast-pass/quests/?view=ready');
 assert.equal(f.store.getSnapshot().pass.xp,0);assert.deepEqual(v.counts,{all:4,active:3,ready:1,claimed:0});
});
test('claim uses existing reward once and advances to Stories',()=>{
 const f=fixture();f.store.recordEvent('route:/world/');assert.equal(f.store.claimQuest('visit-world').ok,true);
 assert.equal(f.view().next.questId,'visit-stories');assert.equal(f.store.getSnapshot().pass.xp,10);
 assert.equal(f.store.claimQuest('visit-world').reason,'already-claimed');assert.equal(f.store.getSnapshot().pass.xp,10);
 assert.equal(f.view().rows.find(r=>r.id==='visit-world').state,'claimed');
});
test('saved claim and next activity survive opening a new store',()=>{
 const f=fixture();f.store.recordEvent('route:/world/');f.store.claimQuest('visit-world');
 const restored=createStore({storage:f.storage,definitions,now:()=>new Date('2026-10-06T13:00:00Z')});
 assert.equal(questJourneyView(restored.getSnapshot()).next.questId,'visit-stories');assert.equal(restored.getSnapshot().pass.xp,10);
});
test('Treat progress and Golden Block lock stay source-owned',()=>{
 const f=fixture();f.store.collectHomeCandy('portal-candy');let row=f.view().rows.find(r=>r.id==='find-feast-treats');
 assert.equal(row.progress,1);assert.equal(row.state,'active');assert.equal(f.store.collectHomeCandy('golden-block-candy').reason,'locked');
 assert.equal(f.store.claimQuest('find-feast-treats').reason,'incomplete');assert.equal(f.store.getSnapshot().pass.xp,0);
});
test('all three real exploration activities lead to the existing daily control',()=>{
 const f=fixture();completeExploration(f);const v=f.view();assert.equal(v.next.kind,'daily');
 assert.equal(v.next.href,'/feast-pass/#daily-reward-title');assert.equal(f.store.getSnapshot().pass.xp,35);
 const daily=v.rows.find(r=>r.daily);assert.equal(daily.claimable,false);assert.equal(daily.state,'active');
});
test('daily has one payout and the complete view offers only game listings',()=>{
 const f=fixture();completeExploration(f);assert.equal(f.store.claimDaily().ok,true);
 assert.equal(f.view().next.kind,'complete');assert.equal(f.view().next.href,'/play/');assert.equal(f.store.getSnapshot().pass.xp,40);
 assert.equal(f.store.claimDaily().reason,'already-claimed');assert.equal(f.store.getSnapshot().pass.xp,40);
 assert.deepEqual(f.view().counts,{all:4,active:0,ready:0,claimed:4});
});
test('UTC-day rollover reopens daily only, without rotating exploration or rewarding a read',()=>{
 const f=fixture();completeExploration(f);f.store.claimDaily();const writes=f.writes.length;
 f.setDay('2026-10-07T00:00:00.000Z');const v=f.view();assert.equal(v.next.kind,'daily');assert.equal(v.counts.claimed,3);
 assert.equal(f.writes.length,writes);assert.equal(f.store.getSnapshot().pass.xp,40);
});
test('disabled daily is not an available activity',()=>{
 const defs=structuredClone(definitions);defs.dailyCheckIn.enabled=false;const f=fixture(defs);
 assert.equal(f.view().counts.all,3);assert.ok(f.view().rows.every(r=>!r.daily));completeExploration(f);assert.equal(f.view().next.kind,'complete');
});
test('read model is pure and never grants rewards',()=>{
 const f=fixture();f.store.recordEvent('route:/world/');const s=f.store.getSnapshot();const before=JSON.stringify(s),writes=f.writes.length;
 for(let i=0;i<20;i++)questJourneyView(s);assert.equal(JSON.stringify(s),before);assert.equal(f.writes.length,writes);assert.equal(s.pass.xp,0);
});
for(const name of ['quests','pass'])for(const raw of ['{bad',JSON.stringify({schemaVersion:99,marker:'preserve'})]){
 test('unsafe '+name+' storage suppresses status/claims rather than inventing zero: '+raw,()=>{
  const f=fixture();f.data.set(KEYS[name],raw);const store=createStore({storage:f.storage,definitions});const v=questJourneyView(store.getSnapshot());
  assert.equal(v.available,false);assert.equal(v.counts.active,null);assert.deepEqual(v.rows,[]);assert.equal(f.data.get(KEYS[name]),raw);
 });
}
test('temporary memory cannot impersonate a persistent multi-page journey',()=>{
 const store=createStore({definitions});const v=questJourneyView(store.getSnapshot());assert.equal(v.available,false);assert.equal(v.reason,'temporary');
});
test('unreadable profile alone does not disable independent quest records',()=>{
 const f=fixture();const s=f.store.getSnapshot();s.storage.readOnlyKeys=[KEYS.profile];assert.equal(questJourneyView(s).available,true);
});
test('failed claim remains ready with unchanged reward; retry can succeed',()=>{
 const f=fixture();f.store.recordEvent('route:/world/');f.denied.add(KEYS.pass);
 assert.equal(f.store.claimQuest('visit-world').ok,false);assert.equal(f.view().next.kind,'ready');assert.equal(f.store.getSnapshot().pass.xp,0);
 f.denied.clear();assert.equal(f.store.claimQuest('visit-world').ok,true);assert.equal(f.store.getSnapshot().pass.xp,10);
});
test('reset returns the initial journey without rewriting unrelated storage',()=>{
 const f=fixture();f.data.set('unrelated:game','keep');completeExploration(f);f.store.clear();
 assert.equal(f.view().next.questId,'visit-world');assert.equal(f.data.get('unrelated:game'),'keep');
 assert.equal(f.store.getSnapshot().pass.xp,0);
});
for(const href of ['https://evil.test/','//evil.test/','javascript:alert(1)','/world/\n','/world/?award=100','/%2e%2e/','/world/\\x','/unknown/','/#bad fragment','/#a#b']){
 test('activity destination rejects unconfigured/unsafe link '+JSON.stringify(href),()=>assert.equal(questDestination({href},definitions),null));
}
test('missing destination never fabricates a route or enables a held game',()=>{
 const defs=structuredClone(definitions);defs.quests=[{id:'unmapped',title:'Held',description:'No connection',event:'none',target:1}];defs.dailyCheckIn.enabled=false;
 const f=fixture(defs);assert.equal(f.view().rows[0].href,null);assert.equal(f.view().next.kind,'no-destination');
});
test('no configured activities are described as empty configuration, not earned completion',()=>{
 const defs=structuredClone(definitions);defs.quests=[];defs.dailyCheckIn.enabled=false;const f=fixture(defs);
 assert.equal(f.view().next.title,'No quests are configured');assert.equal(f.view().counts.all,0);
});
for(const mutate of [s=>s.quests.push(s.quests[0]),s=>s.quests[0].progress=-1,s=>s.quests[0].target=0,s=>s.quests[0].claimedAt='not-a-date',s=>s.quests[0].complete=true]){
 test('contradictory projected quest state is unavailable: '+mutate.toString(),()=>{
  const s=fixture().store.getSnapshot();mutate(s);assert.equal(questJourneyView(s).available,false);
 });
}
test('native source includes editable next card and all status controls, with no new economy values',()=>{
 const project=new URL('../studio-project/toadal-feast-website/',import.meta.url);
 const page=fs.readFileSync(new URL('pages/feast-pass.json',project),'utf8');
 const quests=fs.readFileSync(new URL('pages/quests.json',project),'utf8');
 assert.match(page,/data-quest-next-title/);assert.match(page,/data-quest-next-link/);
 for(const v of ['all','active','ready','claimed'])assert.match(quests,new RegExp('"data-quest-filter": "'+v+'"'));
 assert.deepEqual(definitions.quests.map(q=>q.reward),[{xp:10,sparks:1},{xp:10,sparks:1},{xp:15,sparks:2}]);
 assert.deepEqual(Object.values(KEYS),['toadal:web:v1:feast-pass','toadal:web:v1:quests','toadal:web:v1:discoveries','toadal:web:v1:profile']);
});
