const http=require('node:http');
const {URL}=require('node:url');
function json(res,status,body){res.writeHead(status,{'content-type':'application/json'});res.end(body===undefined?'':JSON.stringify(body));}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(s?JSON.parse(s):{});}catch(e){reject(e);}});req.on('error',reject);});}
function start(){
 let n=1;const users=new Map(),tokens=new Map(),emails=new Map(),saves=new Map(),profiles=new Map(),audiences=new Map(),scores=[],events=[],privacy=[],telemetryBatches=new Set();
 const testPolicy={gameId:'froggy_feast',classification:'general',neutralAgeScreen:true,policyVersion:'approved-synthetic-test-v1'};
 const testLegalDocuments=['terms','privacy','eula'].map(key=>({key,version:'approved-synthetic-test-v1',approved:true,path:'/'+key+'/',requiredForAccounts:key!=='eula'}));
 function auth(req){const h=req.headers.authorization||'';const t=h.startsWith('Bearer ')?h.slice(7):null;return t&&tokens.get(t)||null;}
 function session(user){const token='token-'+n++;tokens.set(token,user);return{token};}
 function key(uid,game,slot){return `${uid}:${game}:${slot}`;}
 const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://x');const p=u.pathname,m=req.method;
   if(p==='/health'||p==='/ready')return json(res,200,{status:p==='/ready'?'ready':'ok'});
   if(m==='GET'&&/^\/v1\/games\/[^/]+\/capabilities$/.test(p))return json(res,200,{gameId:'froggy_feast',capabilities:{guest_identity:true,accounts:true,cloud_save:true,leaderboards:true,achievements:true,telemetry:true,entitlements:true,privacy_ops:true,economy:true},effectiveEnvironment:'staging',effectiveControls:{maintenance:false,guestSessionsEnabled:true,accountCreationEnabled:true,cloudSaveWritesEnabled:true,leaderboardsEnabled:true,telemetryEnabled:true}});
   if(m==='GET'&&p.startsWith('/v1/config/'))return json(res,200,{gameId:'froggy_feast',environmentId:'staging',status:'active',config:{maintenance:false,guestSessionsEnabled:true,accountCreationEnabled:true,cloudSaveWritesEnabled:true,leaderboardsEnabled:true,telemetryEnabled:true}});
   if(m==='GET'&&p==='/v1/status')return json(res,200,{status:'ok'});
   if(m==='GET'&&/^\/v1\/audience\/[^/]+\/policy$/.test(p))return json(res,200,testPolicy);
   if(m==='GET'&&/^\/v1\/audience\/[^/]+\/state$/.test(p)){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{policy:testPolicy,assertion:audiences.get(user.id)||null,state:{ageBand:audiences.get(user.id)?.ageBand||null}});}
   if(m==='POST'&&/^\/v1\/audience\/[^/]+\/classify$/.test(p)){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});const b=await body(req),assertion={ageBand:b.ageBand,policyVersion:testPolicy.policyVersion};audiences.set(user.id,assertion);return json(res,200,{audience:assertion,state:{ageBand:b.ageBand}});}
   if(m==='GET'&&p==='/v1/legal/documents')return json(res,200,{documents:testLegalDocuments});
   if(m==='GET'&&/^\/v1\/legal\/[^/]+\/state$/.test(p)){if(!auth(req))return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{state:{required:[]}});}
   if(m==='POST'&&/^\/v1\/legal\/[^/]+\/accept$/.test(p)){if(!auth(req))return json(res,401,{error:{code:'UNAUTHORIZED'}});const b=await body(req);return json(res,200,{acceptance:b});}
   if(m==='POST'&&/^\/v1\/identity\/[^/]+\/guest$/.test(p)){const user={id:'u'+n++,kind:'guest'};users.set(user.id,user);return json(res,201,{user,session:session(user)});}
   if(m==='POST'&&/^\/v1\/identity\/[^/]+\/register$/.test(p)){const b=await body(req);let user=auth(req);if(!user){user={id:'u'+n++,kind:'account'};users.set(user.id,user);}user.kind='account';user.email=b.email;user.password=b.password;emails.set(b.email,user);return json(res,201,{user,account:{email:b.email},session:session(user)});}
   if(m==='POST'&&/^\/v1\/identity\/[^/]+\/login$/.test(p)){const b=await body(req);const user=emails.get(b.email);if(!user||user.password!==b.password)return json(res,401,{error:{code:'INVALID_LOGIN',message:'Invalid login'}});return json(res,200,{user,session:session(user)});}
   if(m==='GET'&&p==='/v1/identity/me'){const user=auth(req);return user?json(res,200,{user}):json(res,401,{error:{code:'UNAUTHORIZED'}});}
   if(m==='POST'&&p==='/v1/identity/session/revoke'){const h=req.headers.authorization||'';tokens.delete(h.slice(7));res.writeHead(204);return res.end();}
   if(m==='POST'&&p==='/v1/identity/sessions/revoke-all'){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});let count=0;for(const [t,u2] of [...tokens])if(u2.id===user.id){tokens.delete(t);count++;}return json(res,200,{revoked:count});}
   if(m==='POST'&&['/v1/identity/email/verification-request','/v1/identity/email/verify','/v1/identity/password-reset/request','/v1/identity/password-reset/complete'].includes(p))return json(res,200,{ok:true});
   if(m==='PUT'&&p==='/v1/identity/password')return json(res,200,{ok:true});
   let mt=p.match(/^\/v1\/profiles\/([^/]+)$/);if(mt){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});if(m==='GET')return json(res,200,{profile:profiles.get(user.id)||{displayName:null,preferences:{}}});if(m==='PATCH'){const b=await body(req);const cur={...(profiles.get(user.id)||{}),...b};profiles.set(user.id,cur);return json(res,200,{profile:cur});}}
   mt=p.match(/^\/v1\/saves\/([^/]+)\/([^/]+)$/);if(mt){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});const k=key(user.id,mt[1],mt[2]);if(m==='GET')return json(res,200,{save:saves.get(k)||null});if(m==='PUT'){const b=await body(req),cur=saves.get(k),ver=cur?.version||0;if(b.expectedVersion!==undefined&&b.expectedVersion!==ver)return json(res,409,{error:{code:'SAVE_VERSION_CONFLICT',message:'Cloud save version conflict',details:{currentVersion:ver}}});const save={userId:user.id,gameId:mt[1],slot:mt[2],data:b.data,version:ver+1,updatedAt:new Date().toISOString()};saves.set(k,save);return json(res,200,{save});}}
   mt=p.match(/^\/v1\/leaderboards\/([^/]+)\/([^/]+)\/top$/);if(mt&&m==='GET'){const list=scores.filter(s=>s.gameId===mt[1]&&s.mode===mt[2]).sort((a,b)=>b.score-a.score).slice(0,Number(u.searchParams.get('limit'))||50);return json(res,200,{scores:list});}
   mt=p.match(/^\/v1\/leaderboards\/([^/]+)\/([^/]+)\/submit$/);if(mt&&m==='POST'){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});const b=await body(req);if(!Number.isSafeInteger(b.score)||b.score<0)return json(res,400,{error:{code:'INVALID_SCORE'}});const row={userId:user.id,displayName:profiles.get(user.id)?.displayName||'Player',gameId:mt[1],mode:mt[2],score:b.score,buildId:b.buildId};scores.push(row);return json(res,201,{score:row});}
   mt=p.match(/^\/v1\/telemetry\/([^/]+)\/events$/);if(mt&&m==='POST'){const b=await body(req);if(b.batchId&&telemetryBatches.has(b.batchId))return json(res,202,{accepted:0,duplicate:true});if(b.batchId)telemetryBatches.add(b.batchId);for(const e of b.events||[])events.push(e);return json(res,202,{accepted:(b.events||[]).length,duplicate:false});}
   mt=p.match(/^\/v1\/achievements\/([^/]+)$/);if(mt&&m==='GET'){if(!auth(req))return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{achievements:[]});}
   mt=p.match(/^\/v1\/entitlements\/([^/]+)$/);if(mt&&m==='GET'){if(!auth(req))return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{entitlements:[]});}
   mt=p.match(/^\/v1\/economy\/([^/]+)\/([^/]+)\/balance$/);if(mt&&m==='GET'){if(!auth(req))return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{balance:0});}
   mt=p.match(/^\/v1\/privacy\/([^/]+)\/requests$/);if(mt&&m==='POST'){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});const b=await body(req);if(b.type==='delete'&&b.confirm!=='DELETE')return json(res,400,{error:{code:'DELETE_CONFIRMATION_REQUIRED'}});const row={id:'pr'+n++,userId:user.id,type:b.type,state:'queued'};privacy.push(row);return json(res,202,{request:row});}
   if(m==='GET'&&p==='/v1/privacy/requests'){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{requests:privacy.filter(x=>x.userId===user.id)});}
   mt=p.match(/^\/v1\/privacy\/requests\/([^/]+)\/export$/);if(mt&&m==='GET'){const user=auth(req);if(!user)return json(res,401,{error:{code:'UNAUTHORIZED'}});return json(res,200,{export:{requestId:mt[1],data:{identity:{id:user.id}}}});}
   return json(res,404,{error:{code:'NOT_FOUND'}});
 }catch(e){return json(res,500,{error:{code:'TEST_SERVER',message:e.message}});}});
 return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,base:`http://127.0.0.1:${server.address().port}`,state:{users,tokens,saves,profiles,scores,events,privacy,telemetryBatches}})));
}
module.exports={start};
