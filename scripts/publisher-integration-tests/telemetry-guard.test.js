const test=require('node:test'),assert=require('node:assert/strict');const t=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/telemetry-guard.js');
test('known telemetry keeps only allowlisted fields',()=>{const r=t.sanitize('mode_entered',{mode:'arcade',junk:'drop'});assert.deepEqual(r.event.data,{mode:'arcade'});});
test('telemetry rejects direct PII anywhere',()=>{const r=t.sanitize('mode_entered',{mode:'arcade',email:'x@y.z'});assert.equal(r.ok,false);assert.equal(r.reason,'forbidden-pii-field');});
test('unknown event rejected',()=>assert.equal(t.sanitize('made_up_event',{}).ok,false));
