#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

const root=path.resolve(process.argv[2]||'.');
const dist=path.resolve(root,process.argv[3]||'dist');
const basePath=process.argv[4]||'/toadal-feast-web/';
const reportPath=path.resolve(root,process.argv[5]||'docs/review/owner-preview-gate-20261001/browser-matrix.json');
const pages=JSON.parse(fs.readFileSync(path.join(root,'studio-project','toadal-feast-website','pages','index.json'),'utf8')).pages||[];
const critical=new Set(['/','/play/','/characters/','/world/','/stories/','/search/','/feast-pass/','/app/']);

function mime(file){
  const ext=path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4'})[ext]||'application/octet-stream';
}
function diskPath(urlPath){
  if(!urlPath.startsWith(basePath)) return null;
  let rel=decodeURIComponent(urlPath.slice(basePath.length)).replace(/^\/+/,'');
  let file=path.resolve(dist,rel);
  if(file!==dist&&!file.startsWith(dist+path.sep)) return null;
  if(urlPath.endsWith('/')||(fs.existsSync(file)&&fs.statSync(file).isDirectory())) file=path.join(file,'index.html');
  return file;
}
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const file=diskPath(pathname);
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'content-type':'text/plain'});res.end('not found');return;}
  res.writeHead(200,{'content-type':mime(file),'cache-control':'no-store'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const origin='http://127.0.0.1:'+port;

const chromeCandidates=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const chromePath=chromeCandidates.find(p=>fs.existsSync(p));
if(!chromePath){console.error('Chrome not found');process.exit(2);}
const debugPort=9237;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-owner-preview-'));
const chrome=spawn(chromePath,['--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'--headless=new','--disable-gpu','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getTarget(){
  for(let i=0;i<50;i++){try{const list=await (await fetch('http://127.0.0.1:'+debugPort+'/json')).json();const p=list.find(x=>x.type==='page');if(p)return p;}catch{}await sleep(100);}
  throw new Error('Chrome debugging target unavailable');
}
const target=await getTarget();
const ws=new WebSocket(target.webSocketDebuggerUrl);
let seq=0; let events=[]; const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}else events.push(m);};
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
const call=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,m=>m.error?j(new Error(JSON.stringify(m.error))):r(m));ws.send(JSON.stringify({id,method,params}));});
await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Emulation.setEmulatedMedia',{media:'',features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});return r.result.result.value;}

const inspectExpr=[
"(async()=>{",
"const text=e=>(e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim();",
"const name=e=>{const labelled=(e.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();const labels=e.labels?[...e.labels].map(text).filter(Boolean).join(' ').trim():'';const alt=e.getAttribute('alt')||[...e.querySelectorAll('img[alt]')].map(i=>i.alt).join(' ');return (labelled||e.getAttribute('aria-label')||labels||e.getAttribute('title')||text(e)||alt||'').trim();};",
"const imgs=[...document.images].filter(i=>!i.closest('[hidden]'));imgs.forEach(i=>i.loading='eager');",
"await Promise.race([Promise.all(imgs.map(i=>i.decode().catch(()=>null))),new Promise(r=>setTimeout(r,1200))]);",
"const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];",
"const controls=[...document.querySelectorAll('a[href],button,input,select,textarea,[role=\"button\"],[role=\"link\"]')];",
"const unnamed=controls.filter(e=>!name(e)).map(e=>({tag:e.tagName,id:e.id||''}));",
"const brokenFragments=[...document.querySelectorAll('a[href^=\"#\"]')].map(a=>(a.getAttribute('href')||'').slice(1)).filter(id=>id&&!document.getElementById(decodeURIComponent(id)));",
"return {title:document.title.trim(),lang:document.documentElement.lang||'',viewport:document.querySelector('meta[name=\"viewport\"]')?.content||'',",
"h1:[...document.querySelectorAll('h1')].filter(e=>e.getClientRects().length&&text(e)).length,main:document.querySelectorAll('main').length,",
"overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src),",
"missingAlt:imgs.filter(i=>!i.hasAttribute('alt')).map(i=>i.currentSrc||i.src),duplicateIds:dup,unnamedControls:unnamed,brokenFragments,scrollHeight:document.documentElement.scrollHeight};",
"})()"
].join('\n');

const sampleExpr=[
"(()=>{",
"const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return !e.disabled&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};",
"const nm=e=>(e.getAttribute('aria-label')||e.getAttribute('title')||e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,90);",
"const controls=[...document.querySelectorAll('a[href],button,input,select,textarea,[role=\"button\"],[role=\"link\"]')].filter(visible);",
"const clipped=controls.map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName.toLowerCase(),name:nm(e),left:r.left,right:r.right,top:r.top,bottom:r.bottom};}).filter(x=>x.left<-1||x.right>innerWidth+1);",
"const comp=document.querySelector('[data-companion]');let companion=null,overlaps=[];",
"if(comp){const cs=getComputedStyle(comp);const parts=[...comp.querySelectorAll('.companion-panel,.companion-toggle')].filter(e=>visible(e));const rects=parts.map(e=>e.getBoundingClientRect());if(rects.length){const cr={left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};companion={left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom,position:cs.position,within:cr.left>=-1&&cr.right<=innerWidth+1&&cr.top>=-1&&cr.bottom<=innerHeight+1};",
"if(cs.position==='fixed'||cs.position==='sticky'){overlaps=controls.filter(e=>!comp.contains(e)&&!e.closest('header,footer,.site-header,.site-footer')).map(e=>{const r=e.getBoundingClientRect();let area=0;for(const pr of rects){const iw=Math.max(0,Math.min(r.right,pr.right)-Math.max(r.left,pr.left));const ih=Math.max(0,Math.min(r.bottom,pr.bottom)-Math.max(r.top,pr.top));area+=iw*ih;}return {tag:e.tagName.toLowerCase(),name:nm(e),ratio:Math.min(1,area/Math.max(1,r.width*r.height))};}).filter(x=>x.ratio>.50);}}}",
"return {scrollY,clipped,companion,overlaps};",
"})()"
].join('\n');

const casesToRun=[];
for(const record of pages){
  casesToRun.push({route:record.route,w:1440,h:900,label:'desktop'});
  casesToRun.push({route:record.route,w:390,h:844,label:'mobile'});
  if(critical.has(record.route)){
    casesToRun.push({route:record.route,w:768,h:1024,label:'tablet'});
    casesToRun.push({route:record.route,w:320,h:800,label:'small-mobile'});
  }
}
casesToRun.push({route:'/',w:430,h:932,label:'large-mobile'});

const results=[];
for(const c of casesToRun){
  events=[];
  await call('Emulation.setDeviceMetricsOverride',{width:c.w,height:c.h,deviceScaleFactor:1,mobile:c.w<=768});
  const url=origin+basePath+(c.route==='/'?'':c.route.replace(/^\//,''));
  await call('Page.navigate',{url});await sleep(260);
  let doc={};try{doc=await evaluate(inspectExpr);}catch(e){doc={error:String(e)}}
  const sh=doc.scrollHeight||c.h;
  const positions=[0,Math.max(0,Math.floor(sh/2-c.h/2)),Math.max(0,sh-c.h)];
  const samples=[];
  for(const y of [...new Set(positions)]){await evaluate('(()=>{window.scrollTo(0,'+y+');return true})()');await sleep(20);samples.push(await evaluate(sampleExpr));}
  const httpErrors=events.filter(e=>e.method==='Network.responseReceived'&&e.params?.response?.status>=400&&!String(e.params?.response?.url||'').endsWith('/favicon.ico')).map(e=>({status:e.params.response.status,url:e.params.response.url}));
  const loadErrors=[];
  const runtimeErrors=events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params?.exceptionDetails?.text||'exception');
  const consoleErrors=events.filter(e=>e.method==='Runtime.consoleAPICalled'&&e.params?.type==='error').length;
  const clipped=samples.flatMap(s=>s.clipped.map(x=>({scrollY:s.scrollY,...x})));
  const overlaps=samples.flatMap(s=>s.overlaps.map(x=>({scrollY:s.scrollY,...x})));
  const companionMissing=samples.filter(s=>!s.companion).length;
  const companionNotFixed=samples.filter(s=>s.companion&&s.companion.position!=='fixed').map(s=>s.companion);
  const companionBad=samples.filter(s=>s.companion&&s.companion.position==='fixed'&&!s.companion.within).map(s=>s.companion);
  let companionInteraction=null;
  if(c.route==='/'&&(c.label==='desktop'||c.label==='mobile')){
    companionInteraction=await evaluate(`(async()=>{const root=document.querySelector('[data-companion]');if(!root)return {ok:false,reason:'missing-root'};const img=root.querySelector('[data-companion-image]');const target=document.querySelector('[data-companion-context="world"], a[href$="/world/"]')||[...document.querySelectorAll('[data-companion-context]')].find(e=>e!==root&&!e.closest('[data-companion]'));if(!img||!target)return {ok:false,reason:'missing-image-or-target'};target.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await new Promise(r=>setTimeout(r,90));const cs=getComputedStyle(img);const pointer={engaged:root.getAttribute('data-companion-engaged'),reaction:root.getAttribute('data-companion-current-reaction'),transform:cs.transform,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height};target.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',relatedTarget:document.body}));target.dispatchEvent(new Event('touchstart',{bubbles:true}));await new Promise(r=>setTimeout(r,30));const touch={engaged:root.getAttribute('data-companion-engaged'),reaction:root.getAttribute('data-companion-current-reaction')};return {ok:pointer.engaged==='true'&&!!pointer.reaction&&pointer.transform!=='none'&&touch.engaged==='true'&&!!touch.reaction,pointer,touch};})()`);
  }
  const issues=[];
  if(!doc.title)issues.push('missing-title');if(!doc.lang)issues.push('missing-lang');if(!doc.viewport)issues.push('missing-viewport');
  if(doc.h1!==1)issues.push('h1-count');if(doc.main!==1)issues.push('main-count');if(doc.overflow)issues.push('horizontal-overflow');
  if(doc.brokenImages?.length)issues.push('broken-images');if(doc.missingAlt?.length)issues.push('missing-alt');
  if(doc.duplicateIds?.length)issues.push('duplicate-ids');if(doc.unnamedControls?.length)issues.push('unnamed-controls');
  if(doc.brokenFragments?.length)issues.push('broken-fragments');if(httpErrors.length||loadErrors.length)issues.push('network-errors');
  if(runtimeErrors.length||consoleErrors)issues.push('runtime-errors');if(clipped.length)issues.push('clipped-controls');
  if(companionMissing)issues.push('companion-missing');if(companionNotFixed.length)issues.push('companion-not-fixed');
  if(overlaps.length)issues.push('companion-control-overlap');if(companionBad.length)issues.push('companion-out-of-bounds');
  if(companionInteraction&&!companionInteraction.ok)issues.push('companion-interaction');
  const status=issues.length?'FAIL':'PASS';
  results.push({...c,status,issues,doc,httpErrors,loadErrors,runtimeErrors,consoleErrors,clipped,overlaps,companionMissing,companionNotFixed,companionBad,companionInteraction});
  process.stdout.write(status+'|'+c.label+'|'+c.route+'|'+issues.join(',')+'\n');
}

const summary={schema:'toadal-feast.owner-preview-browser-matrix.v1',status:results.every(c=>c.status==='PASS')?'PASS':'FAIL',routes:pages.length,cases:results.length,passed:results.filter(c=>c.status==='PASS').length,failed:results.filter(c=>c.status==='FAIL').length,issueCounts:{}};
for(const c of results)for(const i of c.issues)summary.issueCounts[i]=(summary.issueCounts[i]||0)+1;
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify({summary,cases:results},null,2)+'\n');
console.log('SUMMARY|'+JSON.stringify(summary));
ws.close();server.close();chrome.kill();try{fs.rmSync(profile,{recursive:true,force:true});}catch{}
process.exit(summary.status==='PASS'?0:1);
