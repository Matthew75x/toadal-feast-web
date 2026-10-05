const test=require('node:test'),assert=require('node:assert/strict');
const {Controller,registrationDocuments,audienceEligible}=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/integration-controller.js'),ui=require('../../studio-project/toadal-feast-website/reference/assets/js/publisher-integration/account-ui.js');
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
const docs=()=>({documents:['terms','privacy','eula'].map(key=>({key,version:'approved-test-v1',approved:true,path:'/'+key+'/',requiredForAccounts:key!=='eula'}))});
const policy={classification:'general',neutralAgeScreen:true,policyVersion:'approved-test-v1'};
function fixture({registration=true,accountOrigin=null}={}){
 const c=new Controller({config:{enabled:true,environment:'staging',buildId:'synthetic-unit-test',accountOrigin,features:{accounts:true,accountRegistration:registration}},localStorage:memory(),sessionStorage:memory()});
 c.lastProbe={ok:true,controls:{maintenance:false,accountCreationEnabled:true,guestSessionsEnabled:true},capabilities:{capabilities:{accounts:true,guest_identity:true}},audiencePolicy:{...policy}};c.probe=async()=>c.lastProbe;
 const calls=[];c.client.request=async path=>{calls.push(path);return docs()};c.client.ensureGuest=async()=>{calls.push('guest');c.client.token='synthetic-memory-only'};
 c.client.classifyAudience=async ageBand=>{calls.push(['classify',ageBand]);return{audience:{ageBand,policyVersion:policy.policyVersion}}};
 c.client.audienceState=async()=>({policy,assertion:{ageBand:'18_plus',policyVersion:policy.policyVersion}});
 c.client.register=async data=>{calls.push(['register',data]);return{user:{id:'synthetic-unit-only',kind:'account'}}};
 return{c,calls};
}
test('published legal plan follows requiredForAccounts and validates every required document',()=>{
 assert.deepEqual(registrationDocuments(docs()).map(d=>d.key),['terms','privacy']);for(const patch of [{approved:false},{version:'2026-draft-1'},{path:'javascript:alert(1)'},{path:'//other.invalid/terms'},{path:'https://user:password@other.invalid/terms'},{key:undefined}]){const x=docs();Object.assign(x.documents[0],patch);assert.equal(registrationDocuments(x),null)}const x=docs();x.documents.pop();assert.equal(registrationDocuments(x).length,2);
});
test('optional unapproved EULA does not block required approved terms and privacy',()=>{
 const x=docs();Object.assign(x.documents[2],{approved:false,version:'2026-draft-1'});assert.deepEqual(registrationDocuments(x).map(d=>d.key),['terms','privacy']);
});
test('required EULA blocks while unapproved and joins the exact plan after approval',()=>{
 const x=docs();Object.assign(x.documents[2],{requiredForAccounts:true,approved:false});assert.equal(registrationDocuments(x),null);x.documents[2].approved=true;assert.deepEqual(registrationDocuments(x).map(d=>d.key),['terms','privacy','eula']);
});
test('missing or malformed requirement flags and empty or ambiguous required sets fail closed',()=>{
 for(const value of [null,{}, {documents:[]},{documents:[null]},{documents:[[]]}])assert.equal(registrationDocuments(value),null);
 for(const flag of [undefined,null,'true',1]){const x=docs();x.documents[2].requiredForAccounts=flag;assert.equal(registrationDocuments(x),null)}
 const empty=docs();for(const d of empty.documents)d.requiredForAccounts=false;assert.equal(registrationDocuments(empty),null);const duplicate=docs();duplicate.documents.push({...duplicate.documents[0]});assert.equal(registrationDocuments(duplicate),null);
});
test('valid canonical required set does not invent named optional requirements',()=>{
 const x=docs();x.documents=x.documents.slice(0,1);x.documents[0].key='approved_account_policy';assert.deepEqual(registrationDocuments(x).map(d=>d.key),['approved_account_policy']);
});
test('neutral audience selection never treats an unclassified/minor consent path as approved',()=>{
 assert.equal(audienceEligible(policy,{ageBand:'18_plus',policyVersion:policy.policyVersion},'18_plus'),true);
 assert.equal(audienceEligible({...policy,classification:'mixed'},{ageBand:'under_13',policyVersion:policy.policyVersion},'under_13'),false);
 assert.equal(audienceEligible({...policy,classification:'child_directed'},{ageBand:'18_plus',policyVersion:policy.policyVersion},'18_plus'),false);
 assert.equal(audienceEligible({...policy,classification:'unclassified'},{ageBand:'18_plus',policyVersion:policy.policyVersion},'18_plus'),false);
 assert.equal(audienceEligible(policy,{ageBand:'18_plus',policyVersion:'old'},'18_plus'),false);
});
test('held runtime registration performs no guest, age, consent or register write',async()=>{const {c,calls}=fixture({registration:false});assert.equal((await c.registrationState()).ready,false);await assert.rejects(c.register('synthetic@example.invalid','synthetic password',{legalAcceptances:[]}),e=>e.code==='FEATURE_HELD');assert.deepEqual(calls,[])});
test('unchecked or stale consent is rejected before guest or audience writes',async()=>{const {c,calls}=fixture();for(const r of [{ageBand:'18_plus',legalAcceptances:[]},{ageBand:'18_plus',audienceAccepted:true,legalAcceptances:[{documentKey:'terms',documentVersion:'old'}]}])await assert.rejects(c.register('synthetic@example.invalid','synthetic password',r),e=>e.code==='LEGAL_ACCEPTANCE_REQUIRED');assert.equal(calls.some(x=>x==='guest'||Array.isArray(x)),false)});
test('explicit current choices classify real assertion before registration and send only exact reviewed document versions',async()=>{
 const {c,calls}=fixture(),acceptances=registrationDocuments(docs()).map(d=>({documentKey:d.key,documentVersion:d.version}));
 const out=await c.register('synthetic@example.invalid','synthetic password',{ageBand:'18_plus',audienceAccepted:true,legalAcceptances:acceptances});assert.equal(out.account.user.id,'synthetic-unit-only');const sent=calls.find(x=>Array.isArray(x)&&x[0]==='register')[1];assert.deepEqual(sent.legalAcceptances,acceptances);assert.equal(sent.ageBand,undefined);assert.deepEqual(calls.filter(Array.isArray).map(x=>x[0]),['classify','register']);
});
test('child classification never fabricates parental consent or calls register',async()=>{const {c,calls}=fixture();c.lastProbe.audiencePolicy={...policy,classification:'mixed'};c.client.audienceState=async()=>({policy:{...policy,classification:'mixed'},assertion:{ageBand:'under_13',policyVersion:policy.policyVersion}});await assert.rejects(c.register('synthetic@example.invalid','synthetic password',{ageBand:'under_13',audienceAccepted:true,legalAcceptances:registrationDocuments(docs()).map(d=>({documentKey:d.key,documentVersion:d.version}))}),e=>e.code==='AUDIENCE_ACCOUNT_HELD');assert.equal(calls.some(x=>Array.isArray(x)&&x[0]==='register'),false)});
test('password reset request is available with registration held and preserves local bytes',async()=>{const {c}=fixture({registration:false});c.localStorage.setItem('keep','exact');let called;c.client.requestPasswordReset=async email=>{called=email;return{queued:true}};assert.deepEqual(await c.requestPasswordReset('synthetic@example.invalid'),{queued:true});assert.equal(called,'synthetic@example.invalid');assert.equal(c.localStorage.getItem('keep'),'exact')});
test('reset request fails closed when account probe fails',async()=>{const {c}=fixture();c.probe=async()=>c.lastProbe={ok:false};let calls=0;c.client.requestPasswordReset=async()=>{calls++};await assert.rejects(c.requestPasswordReset('synthetic@example.invalid'),e=>e.code==='FEATURE_HELD');assert.equal(calls,0)});
test('provider completion is held without approved public account URL',async()=>{const {c}=fixture();let called=false;c.client.completePasswordReset=async()=>{called=true};await assert.rejects(c.completePasswordReset('synthetic-token','synthetic password'),e=>e.code==='ACCOUNT_RECOVERY_HELD');assert.equal(called,false)});
test('approved provider completion clears connected identity only after successful backend result',async()=>{const {c}=fixture({accountOrigin:'https://website.test/account/'});c.client.completePasswordReset=async input=>{assert.equal(input.token,'synthetic-token');return{changed:true}};c.lastProbe.identity={user:{id:'synthetic'}};assert.deepEqual(await c.completePasswordReset('synthetic-token','synthetic password'),{changed:true});assert.equal(c.lastProbe.identity,null)});
function tokenDocument(href){const history=[];return{doc:{defaultView:{location:{href},history:{replaceState:(_,__,path)=>history.push(path)}}},history}};
test('token is never accepted outside exact approved public recovery page and query is removed',()=>{for(const config of [{},{accountOrigin:'https://other.test/account/'},{accountOrigin:'https://website.test/another/' }]){const {doc,history}=tokenDocument('https://website.test/account/?token=synthetic-token');assert.equal(ui.providerRecoveryToken(doc,config),null);assert.deepEqual(history,['/account/'])}const {doc,history}=tokenDocument('https://website.test/account/?token=synthetic-token');assert.equal(ui.providerRecoveryToken(doc,{accountOrigin:'https://website.test/account/'}),'synthetic-token');assert.deepEqual(history,['/account/'])});
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.attributes={};this.children=[];this.listeners={};this.value='';this.checked=false;this.disabled=false;this.isConnected=true}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='value')this.value=String(v)}getAttribute(k){return this.attributes[k]??null}removeAttribute(k){delete this.attributes[k]}
 append(...nodes){this.children.push(...nodes)}insertBefore(n,ref){const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,n)}
 set innerHTML(v){this.children=[]}get innerHTML(){return''}addEventListener(k,v){this.listeners[k]=v}focus(){this.focused=true}querySelector(){return this.actions||null}
 async click(){if(!this.disabled)return this.onclick?.()}async submit(){return this.listeners.submit?.({preventDefault(){}})}
}
function dom(){const actions=new Element('div'),card=new Element('article');card.actions=actions;return{actions,doc:{querySelector:()=>card,createElement:tag=>new Element(tag),defaultView:{location:{href:'https://website.test/account/'},history:{replaceState(){}}}}}}
function all(node){return[node,...node.children.flatMap(all)]}const settle=()=>new Promise(r=>setImmediate(r));
test('actual account UI exposes enumeration-safe request form with registration held and no automatic submission',async()=>{
 const {actions,doc}=dom();let requests=[];const controller={config:{enabled:true},permits:f=>['accounts','guest'].includes(f),probe:async()=>({ok:true,identity:null}),requestPasswordReset:async email=>{requests.push(email);return{queued:true}}};ui.enhance(doc,controller,{});await settle();assert.equal(all(actions).find(x=>x.textContent==='Account creation awaiting activation').disabled,true);assert.deepEqual(requests,[]);
 await all(actions).find(x=>x.textContent==='Reset password').click();const form=all(actions).find(x=>x.getAttribute('data-account-form')==='reset-request'),input=all(form).find(x=>x.getAttribute('name')==='email');input.value='synthetic@example.invalid';await form.submit();assert.deepEqual(requests,['synthetic@example.invalid']);assert.equal(input.value,'');assert.equal(all(actions).find(x=>x.getAttribute('data-account-status')!==null).textContent,ui.RECOVERY_REQUEST_RECEIPT);
});
test('registration UI starts every policy checkbox and age choice empty and refuses implicit acceptance',async()=>{
 const {actions,doc}=dom();let registrations=0;const controller={config:{enabled:true},permits:()=>true,probe:async()=>({ok:true,identity:null}),registrationState:async()=>({ready:true,documents:registrationDocuments(docs()),ageBands:['under_13','13_15','16_17','18_plus']}),register:async()=>{registrations++}};ui.enhance(doc,controller,{});await settle();await all(actions).find(x=>x.textContent==='Create free account').click();const form=all(actions).find(x=>x.getAttribute('data-account-form')==='register'),checkboxes=all(form).filter(x=>x.getAttribute('type')==='checkbox');assert.equal(checkboxes.length,3);assert.equal(checkboxes.every(x=>x.checked===false),true);assert.equal(all(form).find(x=>x.getAttribute('name')==='ageBand').value,'');await form.submit();assert.equal(registrations,0);
});
test('actual registration UI checkbox count follows canonical required document set',async()=>{
 for(const requireEula of [false,true]){const legal=docs();Object.assign(legal.documents[2],{requiredForAccounts:requireEula,approved:requireEula,version:requireEula?'approved-test-v1':'2026-draft-1'});const documents=registrationDocuments(legal),{actions,doc}=dom();const controller={config:{enabled:true},permits:()=>true,probe:async()=>({ok:true,identity:null}),registrationState:async()=>({ready:true,documents,ageBands:['under_13','13_15','16_17','18_plus']})};ui.enhance(doc,controller,{});await settle();await all(actions).find(x=>x.textContent==='Create free account').click();const form=all(actions).find(x=>x.getAttribute('data-account-form')==='register'),checkboxes=all(form).filter(x=>x.getAttribute('type')==='checkbox');assert.equal(checkboxes.length,documents.length+1);assert.equal(all(form).filter(x=>x.tagName==='A').some(x=>x.getAttribute('href')==='/eula/'),requireEula);}
});
