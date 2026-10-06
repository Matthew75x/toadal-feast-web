import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const api=require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const { KEYS, GAME_PROGRESS_CONTRACT_VERSION, GAME_PROGRESS_REGISTRATIONS, createStore,
  gameProgressProjection, gameProgressLabels, normalizeExternalGameProjection }=api;
const site=new URL('../studio-project/toadal-feast-website/',import.meta.url);
const stamp='2026-10-06T16:00:00.000Z';

function storageFixture(initial={}) {
  const data=new Map(Object.entries(initial)),writes=[];
  const storage={
    getItem(k){return data.has(k)?data.get(k):null;},
    setItem(k,v){writes.push(['set',k]);data.set(k,String(v));},
    removeItem(k){writes.push(['remove',k]);data.delete(k);}
  };
  return {data,writes,storage,store:createStore({storage,now:()=>stamp})};
}
function external(overrides={}) {
  return {
    schemaVersion:GAME_PROGRESS_CONTRACT_VERSION,
    gameId:'wicked-bites',
    source:{id:'fixture-account-projection',label:'Controlled fixture source',kind:'account-projection',version:'fixture'},
    capability:'account-linked-personal-progress',
    connection:'account-linked',
    dataState:'synchronized',
    confidence:'policy-accepted-personal',
    persistence:'account-synced',
    observedAt:stamp,
    metric:{kind:'score',best:42,latest:42,recentCount:1,recordedAt:stamp},
    ...overrides
  };
}

test('registrations are an exact read-model projection of the four current public game records',()=>{
  const expected=['wicked-bites','claw-feed-gulper','froggy-fruity-bash','toadal-tower-defense'];
  assert.deepEqual(Object.keys(GAME_PROGRESS_REGISTRATIONS),expected);
  for(const id of expected){
    const game=JSON.parse(fs.readFileSync(new URL('games/'+id+'.json',site),'utf8'));
    const reg=GAME_PROGRESS_REGISTRATIONS[id];
    assert.equal(reg.gameId,id);
    assert.equal(reg.title,game.name);
    assert.equal(reg.route,game.route);
    const availability=game.web.enabled?'playable-preview':game.web.browserCartridge?.launchHeld?'launch-held':'concept';
    assert.equal(reg.availability,availability);
    if(id==='wicked-bites'){
      assert.equal(reg.capability,'local-personal-progress');
      assert.equal(reg.progressAdapter,'wicked-bites-local-score-v1');
      assert.equal(reg.source.id,'website-preview-session');
      assert.equal(reg.source.version,game.web.browserCartridge.version);
    }else{
      assert.equal(reg.capability,'launch-only');
      assert.equal(reg.progressAdapter,null);
      assert.equal(reg.source,null);
    }
  }
});

test('unlinked catalogue games never become zero progress',()=>{
  const f=storageFixture(),before=JSON.stringify(f.store.getSnapshot());
  for(const id of ['claw-feed-gulper','froggy-fruity-bash','toadal-tower-defense']){
    const view=gameProgressProjection(f.store.getSnapshot(),id);
    assert.equal(view.dataState,'not-linked');
    assert.equal(view.connection,'not-linked');
    assert.equal(view.metric,null);
    assert.equal(view.persistence,'none');
    assert.match(gameProgressLabels(view).detail,/not 0% completion/i);
  }
  assert.equal(JSON.stringify(f.store.getSnapshot()),before);
  assert.equal(f.writes.length,0);
});

test('connected local source with no data is distinct from a genuine saved zero',()=>{
  const f=storageFixture();
  const none=gameProgressProjection(f.store.getSnapshot(),'wicked-bites');
  assert.equal(none.dataState,'no-data');
  assert.equal(none.metric,null);
  assert.equal(none.persistence,'browser-local');
  assert.match(gameProgressLabels(none).detail,/not a zero score/i);
  assert.equal(f.store.recordLocalScore({gameId:'wicked-bites',score:0}).ok,true);
  const zero=gameProgressProjection(f.store.getSnapshot(),'wicked-bites');
  assert.equal(zero.dataState,'zero');
  assert.deepEqual(zero.metric,{kind:'score',best:0,latest:0,recentCount:1,recordedAt:stamp});
  assert.match(gameProgressLabels(zero).detail,/real saved result of zero/i);
});

test('recorded local progress is source-labelled and never changes website rewards',()=>{
  const f=storageFixture(),before=f.store.getSnapshot().pass;
  assert.equal(f.store.recordLocalScore({gameId:'wicked-bites',score:125}).ok,true);
  const view=gameProgressProjection(f.store.getSnapshot(),'wicked-bites');
  assert.equal(view.dataState,'recorded');
  assert.equal(view.connection,'local');
  assert.equal(view.confidence,'source-reported-local');
  assert.equal(view.persistence,'browser-local');
  assert.equal(view.source.id,'website-preview-session');
  assert.equal(view.metric.best,125);
  assert.deepEqual(f.store.getSnapshot().pass,before);
});

test('page-only adapter is session-only and never claims browser persistence',()=>{
  const store=createStore({now:()=>stamp});
  assert.equal(store.recordLocalScore({gameId:'wicked-bites',score:9}).ok,true);
  const view=gameProgressProjection(store.getSnapshot(),'wicked-bites');
  assert.equal(view.dataState,'recorded');
  assert.equal(view.persistence,'session-only');
  assert.match(gameProgressLabels(view).persistence,/tab only/i);
});

test('unreadable score state is unavailable rather than empty or zero',()=>{
  const raw=JSON.stringify({schemaVersion:1,localScores:{'wicked-bites':{best:20,runs:[{score:-1,completedAt:'invalid'}]}}});
  const f=storageFixture({[KEYS.profile]:raw});
  const view=gameProgressProjection(f.store.getSnapshot(),'wicked-bites');
  assert.equal(view.dataState,'unavailable');
  assert.equal(view.metric,null);
  assert.match(gameProgressLabels(view).detail,/cannot be read safely/i);
  assert.equal(f.data.get(KEYS.profile),raw);
  assert.equal(f.writes.length,0);
});

for(const [state,persistence,metric] of [
  ['pending','awaiting-delivery',null],
  ['stale','account-synced',{kind:'score',best:42,latest:40,recentCount:2,recordedAt:stamp}],
  ['unavailable','account-synced',null],
  ['synchronized','account-synced',{kind:'score',best:42,latest:42,recentCount:1,recordedAt:stamp}]
]){
  test('explicit external fixture state is representable without activating a real source: '+state,()=>{
    const fixture=external({dataState:state,persistence,metric});
    const normalized=normalizeExternalGameProjection(fixture);
    assert.equal(normalized.ok,true);
    const view=gameProgressProjection(null,'wicked-bites',fixture);
    assert.equal(view.dataState,state);
    assert.equal(view.external,true);
    assert.equal(view.source.label,'Controlled fixture source');
    assert.equal(view.readOnly,true);
  });
}

test('external zero requires an actual zero metric',()=>{
  const good=external({dataState:'zero',connection:'host-linked',confidence:'source-reported-local',persistence:'browser-local',
    source:{id:'fixture-host',label:'Controlled fixture source',kind:'host-projection'},metric:{kind:'score',best:0,latest:0,recentCount:1,recordedAt:stamp}});
  assert.equal(normalizeExternalGameProjection(good).ok,true);
  assert.equal(normalizeExternalGameProjection({...good,metric:{...good.metric,best:1}}).reason,'zero-state-mismatch');
});
test('data-bearing external states require an exact observation timestamp',()=>{
  for(const state of ['zero','recorded','stale','synchronized']){
    const metric=state==='zero'
      ? {kind:'score',best:0,latest:0,recentCount:1,recordedAt:stamp}
      : {kind:'score',best:42,latest:42,recentCount:1,recordedAt:stamp};
    const value=external({dataState:state,observedAt:null,metric,
      ...(state==='zero'?{connection:'host-linked',confidence:'source-reported-local',persistence:'browser-local',
        source:{id:'fixture-host',label:'Controlled fixture source',kind:'host-projection'}}:{})});
    assert.equal(normalizeExternalGameProjection(value).reason,'observed-at-required');
  }
});
test('pending cannot impersonate synchronized persistence',()=>{
  assert.equal(normalizeExternalGameProjection(external({dataState:'pending',metric:null,persistence:'account-synced'})).reason,'pending-persistence-mismatch');
});
test('synchronized requires account linkage and accepted-or-better confidence',()=>{
  assert.equal(normalizeExternalGameProjection(external({connection:'host-linked'})).reason,'synchronized-state-mismatch');
  assert.equal(normalizeExternalGameProjection(external({confidence:'source-reported-local'})).reason,'synchronized-state-mismatch');
});
test('missing-data and unavailable states cannot smuggle a metric',()=>{
  for(const state of ['no-data','pending','unavailable']){
    const value=external({dataState:state,persistence:state==='pending'?'awaiting-delivery':'account-synced'});
    assert.equal(normalizeExternalGameProjection(value).reason,'metric-not-allowed');
  }
});
test('unknown games, future schemas and malformed source timestamps fail closed',()=>{
  assert.equal(normalizeExternalGameProjection(external({gameId:'unknown'})).reason,'unknown-game');
  assert.equal(normalizeExternalGameProjection(external({schemaVersion:99})).reason,'invalid-envelope');
  assert.equal(normalizeExternalGameProjection(external({observedAt:'not-a-date'})).reason,'invalid-observed-at');
  const view=gameProgressProjection(null,'unknown',external());
  assert.equal(view.dataState,'unavailable');
  assert.equal(view.confidence,'none');
});
test('count metrics support future personal accomplishment projections without creating a universal percentage',()=>{
  const value=external({
    dataState:'synchronized',
    metric:{kind:'count',current:3,total:10,label:'Main Feats'},
    source:{id:'fixture-native',label:'Controlled native projection fixture',kind:'native-projection',version:'fixture'}
  });
  const normalized=normalizeExternalGameProjection(value);
  assert.equal(normalized.ok,true);
  assert.deepEqual(normalized.projection.metric,{kind:'count',current:3,total:10,label:'Main Feats'});
  assert.equal(Object.hasOwn(normalized.projection.metric,'percent'),false);
});
test('projection calls are read-only over the existing store snapshot',()=>{
  const f=storageFixture();f.store.recordLocalScore({gameId:'wicked-bites',score:3});
  const state=f.store.getSnapshot(),before=JSON.stringify(state),writes=f.writes.length;
  for(let i=0;i<10;i++) gameProgressProjection(state,'wicked-bites');
  assert.equal(JSON.stringify(state),before);assert.equal(f.writes.length,writes);
});

test('Feast Pass cards expose source, connection, persistence and confidence with existing actions intact',()=>{
  const page=JSON.parse(fs.readFileSync(new URL('pages/feast-pass.json',site),'utf8'));
  function* nodes(v){if(Array.isArray(v))for(const x of v)yield* nodes(x);else if(v&&typeof v==='object'){if(v.type&&v.props)yield v;for(const x of Object.values(v))yield* nodes(x);}}
  const all=[...nodes(page)],cards=all.filter(n=>n.props.attributes?.['data-game-record']);
  assert.equal(cards.length,4);
  for(const card of cards){
    const fields=new Map([...nodes(card)].filter(n=>n.props.attributes?.['data-game-record-field']).map(n=>[n.props.attributes['data-game-record-field'],n]));
    for(const field of ['state','detail','source','connection','persistence','confidence','availability'])assert.ok(fields.has(field),card.id+' '+field);
    const links=[...nodes(card)].filter(n=>n.type==='core.button');
    assert.ok(links.length>=1);
    assert.ok(links.every(n=>!String(n.props.href||'').includes('/public/games/')));
  }
});
