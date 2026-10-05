const test=require('node:test'),assert=require('node:assert/strict');const {start}=require('./mock-froggy-server.js');const {Client,FroggyError}=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/froggy-client.js');
function mem(){const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
test('client guest/profile/save/telemetry/logout round trip',async t=>{const x=await start();t.after(()=>x.server.close());const c=new Client({baseUrl:x.base,gameId:'froggy_feast',buildId:'b1',environmentId:'staging',storage:mem()});await c.ensureGuest();assert.ok(c.token);assert.equal((await c.profile()).displayName,null);await c.updateProfile({displayName:'Toad'});assert.equal((await c.profile()).displayName,'Toad');assert.equal(await c.loadSave('main'),null);const saved=await c.save('main',{hello:'world'},0);assert.equal(saved.version,1);c.track('mode_entered',{mode:'arcade'});assert.equal(await c.flushTelemetry(),1);await c.logout();assert.equal(c.token,null);});
test('client surfaces optimistic save conflict',async t=>{const x=await start();t.after(()=>x.server.close());const c=new Client({baseUrl:x.base,gameId:'froggy_feast',storage:mem()});await c.ensureGuest();await c.save('main',{n:1},0);await assert.rejects(()=>c.save('main',{n:2},0),e=>e instanceof FroggyError&&e.code==='SAVE_VERSION_CONFLICT'&&e.status===409);});

test('v0.10.1 register carries legal acceptance/locale/platform fields',async t=>{
  const x=await start();t.after(()=>x.server.close());
  const c=new Client({baseUrl:x.base,gameId:'froggy_feast',platform:'web',storage:mem()});
  await c.ensureGuest();
  const out=await c.register({email:'legal@example.com',password:'strong enough password',legalAcceptances:[{documentKey:'terms',documentVersion:'v1'}],locale:'en-CA'});
  assert.equal(out.account.email,'legal@example.com');
  assert.ok(c.token);
});

test('v0.10.1 telemetry retry preserves pending batchId after ambiguous failure',async()=>{
  const bodies=[];let attempts=0;
  const fetchImpl=async(url,opts={})=>{
    if(String(url).includes('/v1/telemetry/')){
      const b=JSON.parse(opts.body||'{}');bodies.push(b);attempts++;
      if(attempts===1)throw new Error('ambiguous transport failure');
      return new Response(JSON.stringify({accepted:0,duplicate:true}),{status:202,headers:{'content-type':'application/json'}});
    }
    return new Response('{}',{status:200,headers:{'content-type':'application/json'}});
  };
  const c=new Client({baseUrl:'https://api.example.test',gameId:'froggy_feast',fetchImpl,storage:mem(),telemetryBatchSize:50});
  c.track('mode_entered',{mode:'arcade'});
  await assert.rejects(()=>c.flushTelemetry(),e=>e instanceof FroggyError&&e.code==='NETWORK_ERROR');
  const pending=c.telemetryStatus();assert.equal(pending.pending,1);assert.ok(pending.pendingBatchId);
  assert.equal(await c.flushTelemetry(),1);
  assert.equal(bodies.length,2);assert.equal(bodies[0].batchId,bodies[1].batchId);
});

test('v0.10.1 telemetry queue is bounded and reports overflow',async()=>{
  const bodies=[];
  const fetchImpl=async(url,opts={})=>{bodies.push(JSON.parse(opts.body||'{}'));return new Response(JSON.stringify({accepted:3}),{status:202,headers:{'content-type':'application/json'}});};
  const c=new Client({baseUrl:'https://api.example.test',gameId:'froggy_feast',fetchImpl,storage:mem(),telemetryBatchSize:100,telemetryMaxQueue:2});
  await c.track('mode_entered',{mode:'a'});await c.track('mode_entered',{mode:'b'});await c.track('mode_entered',{mode:'c'});
  assert.equal(c.telemetryStatus().dropped,1);
  assert.equal(await c.flushTelemetry(),3);
  assert.equal(bodies[0].events[0].name,'telemetry_queue_overflow');
  assert.equal(bodies[0].events[0].data.dropped,1);
  assert.deepEqual(bodies[0].events.slice(1).map(e=>e.data.mode),['b','c']);
});


test('v0.10.1 audience/legal/status/config reads use canonical endpoints',async t=>{
  const x=await start();t.after(()=>x.server.close());
  const c=new Client({baseUrl:x.base,gameId:'froggy_feast',environmentId:'staging',storage:mem()});
  assert.equal((await c.serviceStatus()).status,'ok');
  assert.equal((await c.audiencePolicy()).classification,'general');
  assert.equal((await c.config()).config.telemetryEnabled,true);
  await c.ensureGuest();
  assert.equal((await c.audienceState()).assertion,null);
  assert.equal((await c.classifyAudience('18_plus')).audience.ageBand,'18_plus');
  assert.deepEqual((await c.legalState()).state.required,[]);
  assert.equal((await c.acceptLegal('terms','v1')).acceptance.documentKey,'terms');
});
