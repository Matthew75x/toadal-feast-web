const test=require('node:test'),assert=require('node:assert/strict');
const {OfflineNullAdapter,create}=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/game-services.js');

test('offline null adapter never fabricates economy, scores, saves, or identity',async()=>{
  const x=new OfflineNullAdapter();
  assert.equal(await x.economy.getBalance('jeweled_candy'),null);
  assert.deepEqual(await x.leaderboards.top('arcade'),[]);
  assert.equal((await x.leaderboards.submit('arcade',100)).ok,false);
  assert.equal(await x.saves.load('main'),null);
  assert.equal((await x.saves.save('main',{},0)).ok,false);
  assert.equal((await x.identity.signIn()).reason,'backend-unavailable');
  assert.equal(await x.telemetry.flush(),0);
});

test('game services facade maps to controller boundary without direct storage/database access',async()=>{
  const calls=[];
  const controller={
    requireFeature:()=>{},
    lastProbe:{ok:true,capabilities:{leaderboards:true}},
    ensureGuest:async()=>{calls.push('guest');return 'tok';},
    login:async(e,p)=>{calls.push(['login',e,p]);return {account:true};},
    register:async(e,p,r)=>{calls.push(['register',e,p,r]);return {account:true};},
    logout:async()=>{calls.push('logout');},
    syncNow:async()=>({ok:true}),
    balance:async()=>4,
    submitScore:async(run,elig)=>({ok:true,score:{...run},elig}),
    topScores:async()=>({ok:true,scores:[{score:9}]}),
    track:async()=>({accepted:true}),flushTelemetry:async()=>1,
    profile:async()=>({displayName:'P'}),updateProfile:async p=>p,
    requestPrivacy:async()=>({id:'p1'}),privacyRequests:async()=>[],privacyExport:async()=>({}),
    client:{loadSave:async()=>({version:1}),save:async()=>({version:2}),config:async()=>({config:{}})}
  };
  const g=create(controller);
  assert.equal((await g.capabilities()).leaderboards,true);
  assert.equal(await g.economy.getBalance('jeweled_candy'),4);
  assert.equal((await g.leaderboards.top('arcade'))[0].score,9);
  await g.identity.register({email:'a@b.test',password:'x',locale:'en-CA'});
  assert.equal(calls.find(x=>Array.isArray(x)&&x[0]==='register')[3].locale,'en-CA');
  assert.equal((await g.saves.load('website-progression')).version,1);
});
