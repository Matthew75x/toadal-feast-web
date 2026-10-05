const test=require('node:test');
const assert=require('node:assert/strict');
const guard=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/telemetry-guard.js');
const bootstrap=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/integration-bootstrap.js');
const {Client}=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/froggy-client.js');

function windowFixture(){
  const handlers=new Map(), timers=new Map(); let next=0;
  const root={document:{readyState:'complete'},fetch:async()=>{throw new Error('unexpected request');},localStorage:{},sessionStorage:{},
    addEventListener(name,fn){if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(fn);},
    removeEventListener(name,fn){handlers.get(name)?.delete(fn);},
    setInterval(fn,delay){timers.set(++next,{fn,delay});return next;},clearInterval(id){timers.delete(id);}};
  root.self=root.top=root;
  return {root,timers,emit(name){for(const fn of handlers.get(name)||[])fn();}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const response=body=>({status:202,ok:true,text:async()=>JSON.stringify(body)});

test('each allowlisted telemetry field has a semantic rule',()=>{
  for(const fields of Object.values(guard.EVENTS))for(const field of fields)assert.equal(typeof guard.FIELD_RULES[field],'function',field);
});
test('PII and free text cannot pass through mode, result, identifiers or error codes',()=>{
  for(const mode of ['alice@example.com','Alice Smith','https://example.com/person','alice','wicked-bites'])assert.equal(guard.sanitize('mode_entered',{mode}).ok,false,mode);
  assert.equal(guard.sanitize('mode_completed',{mode:'arcade',durationMs:10,result:'Alice won'}).ok,false);
  assert.equal(guard.sanitize('session_started',{platform:'web',buildId:'alice@example.com'}).ok,false);
  assert.equal(guard.sanitize('save_cloud_failure',{slot:'website-progression',errorCode:'Failed for alice@example.com'}).ok,false);
});
test('nested data and normalized PII keys are rejected even when otherwise dropped',()=>{
  assert.equal(guard.sanitize('mode_entered',{mode:'arcade',extra:{harmless:1}}).reason,'non-scalar-field');
  assert.equal(guard.sanitize('mode_entered',{mode:'arcade',extra:{DISPLAY_NAME:'Alice'}}).reason,'forbidden-pii-field');
  const cycle={mode:'arcade'};cycle.extra=cycle;
  assert.equal(guard.sanitize('mode_entered',cycle).reason,'non-scalar-field');
});
test('numeric fields reject coercion, negative, fractional, excessive and nonfinite data',()=>{
  for(const durationMs of [-1,Infinity,NaN,'10',86400001])assert.equal(guard.sanitize('mode_completed',{mode:'arcade',durationMs,result:'complete'}).ok,false);
  for(const version of [-1,1.5,'1',Number.MAX_SAFE_INTEGER+1])assert.equal(guard.sanitize('save_cloud_write',{slot:'website-progression',version}).ok,false);
  assert.equal(guard.sanitize('mode_entered',{mode:'arcade',droppedUnknown:Infinity}).reason,'invalid-number');
});
test('required fields and plain event object are enforced',()=>{
  assert.equal(guard.sanitize('mode_entered',{}).reason,'missing-required-field');
  for(const input of [null,undefined,[],new Date()])assert.equal(guard.sanitize('session_started',input).reason,'invalid-event-data');
  assert.deepEqual(guard.sanitize('mode_entered',{mode:'arcade',unused:'drop'}).event.data,{mode:'arcade'});
});
test('catalogue identifiers stay held without a finite explicit allowlist',()=>{
  const event={goalKey:'daily-puzzle'};
  assert.equal(guard.sanitize('daily_goal_completed',event).ok,false);
  assert.equal(guard.sanitize('daily_goal_completed',event,{values:{goalKey:['daily-puzzle']}}).ok,true);
  assert.equal(guard.sanitize('daily_goal_completed',{goalKey:'alice@example.com'},{values:{goalKey:['alice@example.com']}}).ok,false);
});
test('telemetry build and platform bind to configured client identity',async()=>{
  const sent=[];
  const g=new guard.GuardedTelemetry({buildId:'website-test',platform:'web',track(name,data){sent.push({name,data});return 0;}});
  assert.equal((await g.track('session_started',{platform:'web',buildId:'Alice'})).accepted,false);
  assert.equal((await g.track('session_started',{platform:'android',buildId:'website-test'})).accepted,false);
  assert.equal((await g.track('session_started',{platform:'web',buildId:'website-test'})).accepted,true);assert.equal(sent.length,1);
  assert.equal(guard.sanitize('app_boot_started',{buildId:'website-test',platform:'web',profile:'Alice'}).ok,false);
});
test('track rejection cannot block gameplay and never exposes exception text',async()=>{
  let calls=0;
  const g=new guard.GuardedTelemetry({track(){calls++;throw Object.assign(new Error('alice@example.com secret'),{code:'NETWORK_ERROR',status:0});},flushTelemetry:async()=>{throw new Error('secret');}});
  assert.equal((await g.track('mode_entered',{mode:'alice@example.com'})).accepted,false);assert.equal(calls,0);
  const failed=await g.track('mode_entered',{mode:'arcade'});assert.equal(failed.reason,'telemetry-delivery-failed');assert.equal(calls,1);assert.equal(JSON.stringify(failed).includes('secret'),false);
  assert.equal((await g.flush()).accepted,false);
  assert.equal((await g.track('mode_entered',{mode:'arcade'},'alice@example.com')).reason,'invalid-event-time');assert.equal(calls,1);
});
test('a sub-batch event is delivered on the bounded interval',async()=>{
  const w=windowFixture(), bodies=[];
  const c=new Client({baseUrl:'https://example.test/api',gameId:'froggy_feast',buildId:'website-test',storage:null,telemetryBatchSize:20,fetchImpl:async(url,options)=>{bodies.push(JSON.parse(options.body));return response({accepted:1});}});
  const g=new guard.GuardedTelemetry(c), controller={config:{features:{telemetry:true}},permits:()=>true,flushTelemetry:options=>g.flush(options)};
  const lifecycle=bootstrap.telemetryDelivery(w.root,controller);
  await g.track('session_started',{platform:'web',buildId:'website-test'});assert.equal(bodies.length,0);
  assert.equal(w.timers.size,1);const interval=[...w.timers.values()][0];assert.equal(interval.delay,15000);interval.fn();await settle();
  assert.equal(bodies.length,1);assert.equal(bodies[0].events.length,1);lifecycle.stop();assert.equal(w.timers.size,0);
});
test('pagehide uses keepalive and retry retains one batch identity after ambiguous failure',async()=>{
  const w=windowFixture(), requests=[];let fail=true;
  const c=new Client({baseUrl:'https://example.test/api',gameId:'froggy_feast',buildId:'website-test',storage:null,fetchImpl:async(url,options)=>{requests.push({keepalive:options.keepalive,body:JSON.parse(options.body)});if(fail){fail=false;throw new Error('ambiguous response');}return response({accepted:0,duplicate:true});}});
  const g=new guard.GuardedTelemetry(c), controller={config:{features:{telemetry:true}},permits:()=>true,flushTelemetry:options=>g.flush(options)};
  bootstrap.telemetryDelivery(w.root,controller);await g.track('mode_entered',{mode:'arcade'});
  w.emit('pagehide');await settle();assert.equal(w.timers.size,0);assert.equal(requests.length,1);assert.equal(requests[0].keepalive,true);assert.equal(c.telemetryStatus().pending,1);
  w.emit('pageshow');assert.equal(w.timers.size,1);[...w.timers.values()][0].fn();await settle();
  assert.equal(requests.length,2);assert.equal(requests[0].body.batchId,requests[1].body.batchId);assert.equal(c.telemetryStatus().pending,0);
});
test('runtime hold blocks interval and pagehide delivery; rejected async flush is contained',async()=>{
  const w=windowFixture();let permitted=false,calls=0;
  const controller={config:{features:{telemetry:true}},permits:()=>permitted,flushTelemetry:async()=>{calls++;throw new Error('offline');}};
  const lifecycle=bootstrap.telemetryDelivery(w.root,controller);[...w.timers.values()][0].fn();w.emit('pagehide');await settle();assert.equal(calls,0);
  permitted=true;w.emit('pageshow');[...w.timers.values()][0].fn();await settle();assert.equal(calls,1);lifecycle.stop();
});
test('absent public config is inert and starts no network or timer',async()=>{
  const w=windowFixture();let constructed=0;
  w.root.ToadalRuntimeConfig={fromDocument:()=>({enabled:false})};w.root.ToadalIntegrationController={Controller:class{constructor(){constructed++;}}};
  assert.deepEqual(await bootstrap.boot(w.root),{enabled:false});assert.equal(constructed,0);assert.equal(w.timers.size,0);assert.equal(w.root.ToadalPublisherIntegration,undefined);
});
test('configuration, probe and UI failures are contained',async()=>{
  const bad=windowFixture();bad.root.ToadalRuntimeConfig={fromDocument(){throw new Error('secret');}};bad.root.ToadalIntegrationController={};
  assert.equal((await bootstrap.boot(bad.root)).enabled,false);assert.deepEqual(bad.root.__toadalPublisherIntegrationError,{code:'INTEGRATION_BOOT_FAILED'});
  const w=windowFixture();let enhancements=0;
  w.root.ToadalRuntimeConfig={fromDocument:()=>({enabled:true,buildId:'test'})};
  w.root.ToadalIntegrationController={Controller:class{constructor(){this.config={features:{telemetry:false}};}probe(){throw new Error('offline');}permits(){return false;}}};
  w.root.ToadalAccountUI={enhance(){throw new Error('bad ui');}};w.root.ToadalProfileUI={enhance(){enhancements++;return Promise.reject(new Error('async ui'));}};
  assert.equal((await bootstrap.boot(w.root)).enabled,true);await settle();assert.equal(enhancements,1);assert.equal(w.timers.size,0);
});
