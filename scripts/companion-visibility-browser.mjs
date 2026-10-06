#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist'), basePath='/toadal-feast-web/';
const reportDir=path.join(root,'.tmp','companion-visibility-browser');
fs.mkdirSync(reportDir,{recursive:true});
function mime(file){const e=path.extname(file).toLowerCase();return ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[e]||'application/octet-stream';}
function diskPath(urlPath){if(!urlPath.startsWith(basePath))return null;const rel=decodeURIComponent(urlPath.slice(basePath.length)).replace(/^\/+/,'');let file=path.resolve(dist,rel);if(file!==dist&&!file.startsWith(dist+path.sep))return null;if(urlPath.endsWith('/')||(fs.existsSync(file)&&fs.statSync(file).isDirectory()))file=path.join(file,'index.html');return file;}
const server=http.createServer((req,res)=>{const file=diskPath(new URL(req.url,'http://127.0.0.1').pathname);if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':mime(file),'cache-control':'no-store'});fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port+basePath;
const chrome=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Chrome unavailable');
const debugPort=9326, profile=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-companion-lifecycle-'));
const chromeProc=spawn(chrome,['--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'--headless=new','--disable-gpu','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function findTarget(){for(let i=0;i<60;i++){try{const a=await(await fetch('http://127.0.0.1:'+debugPort+'/json')).json();const t=a.find(x=>x.type==='page');if(t)return t;}catch{}await sleep(100);}throw new Error('CDP target unavailable');}
const target=await findTarget(), ws=new WebSocket(target.webSocketDebuggerUrl), pending=new Map();let seq=0;
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
const call=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,m=>m.error?j(new Error(JSON.stringify(m.error))):r(m.result||{}));ws.send(JSON.stringify({id,method,params}));});
await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'evaluation failed');return r.result.value;}
async function waitFor(expression,timeout=7000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await evaluate(expression))return;}catch{}await sleep(40);}throw new Error('Timeout: '+expression);}
async function navigate(route=''){await call('Page.navigate',{url:origin+route});await waitFor("document.readyState==='complete'");await waitFor("!!document.querySelector('[data-companion-nav-visibility]')");await waitFor("document.querySelector('[data-companion]')?.getAttribute('data-position-ready')==='true'");}
async function metrics(width,height,touch=false){await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch,screenWidth:width,screenHeight:height});await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:5});}
const stateExpression=[
"(()=>{",
"const root=document.querySelector('[data-companion]'),nav=document.querySelector('[data-companion-nav-visibility]'),restore=document.querySelector('[data-companion-restore]'),toggle=document.querySelector('[data-companion-toggle]');",
"const visible=e=>!!e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;",
"const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};",
"const stored=k=>{try{return localStorage.getItem(k)}catch{return '__unavailable__'}};",
"return {rootHidden:root?.hidden,rootAriaHidden:root?.getAttribute('aria-hidden'),rootInert:root?.hasAttribute('inert'),hiddenVisibleInteractives:root?[...root.querySelectorAll('a,button,input,select,textarea,[tabindex]')].filter(visible).length:null,minimized:root?.getAttribute('data-minimized'),reaction:root?.getAttribute('data-companion-current-reaction')||null,navText:nav?.textContent.trim(),navPressed:nav?.getAttribute('aria-pressed'),navPersistence:nav?.getAttribute('data-companion-persistence'),navVisible:visible(nav),navBox:box(nav),restoreVisible:visible(restore),toggleVisible:visible(toggle),menuExpanded:document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')||null,overflow:document.documentElement.scrollWidth>innerWidth+1,image:document.querySelector('[data-companion-image]')?.getAttribute('src')||null,active:document.activeElement===nav?'nav':document.activeElement===restore?'restore':document.activeElement===toggle?'toggle':document.activeElement?.tagName||null,storedHidden:stored('toadal:site:companion:hidden:v1'),storedMinimized:stored('toadal:site:companion:minimized:v1'),storedPosition:stored('toadal:site:companion:position:v1')};",
"})()"
].join('\n');
const state=()=>evaluate(stateExpression), cases=[], failures=[];
function add(name,ok,detail){cases.push({name,status:ok?'PASS':'FAIL',detail});if(!ok)failures.push(name);}
async function center(selector){return evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+"),r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height}})()");}
async function tap(selector){const p=await center(selector);await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100);}
async function activateFocused(selector){await evaluate("document.querySelector("+JSON.stringify(selector)+").focus();document.querySelector("+JSON.stringify(selector)+").click();true");await sleep(80);}
async function clearPrefs(){await evaluate("localStorage.removeItem('toadal:site:companion:hidden:v1');localStorage.removeItem('toadal:site:companion:minimized:v1');localStorage.removeItem('toadal:site:companion:position:v1');true");}

try{
  await metrics(1440,900,false);await navigate('');await clearPrefs();await navigate('');let s=await state();
  add('desktop-initial-minimized-visible',!s.rootHidden&&s.minimized==='true'&&s.navText==='Hide Toadal'&&s.navPressed==='true'&&!s.restoreVisible&&!s.overflow,s);
  await evaluate("document.querySelector('[data-companion-toggle]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));true");await sleep(120);s=await state();
  const pos=s.storedPosition,min=s.storedMinimized,img=s.image,manual=JSON.parse(s.storedPosition||'{}').manual===true;
  add('manual-position-established-before-visibility-change',manual,s);
  await activateFocused('[data-companion-nav-visibility]');await waitFor("document.querySelector('[data-companion]')?.hidden===true");s=await state();
  add('desktop-focused-hide',s.rootHidden&&s.rootAriaHidden==='true'&&s.rootInert&&s.hiddenVisibleInteractives===0&&s.navText==='Show Toadal'&&s.navPressed==='false'&&s.restoreVisible&&s.active==='nav'&&s.storedPosition===pos&&s.storedMinimized===min,s);
  await evaluate("document.querySelector('a[href*=\"/world/\"]')?.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));window.dispatchEvent(new CustomEvent('toadal:daily-checkin-claimed'));true");await sleep(160);s=await state();
  add('hidden-suspends-reaction-work',s.rootHidden&&s.reaction===null&&s.image===img,s);
  await activateFocused('[data-companion-nav-visibility]');await waitFor("!document.querySelector('[data-companion]')?.hidden");s=await state();
  add('same-route-show-preserves-manual-position',!s.rootHidden&&s.storedPosition===pos&&JSON.parse(s.storedPosition||'{}').manual===true&&s.active==='nav',s);
  await activateFocused('[data-companion-nav-visibility]');await waitFor("document.querySelector('[data-companion]')?.hidden===true");
  await navigate('world/');s=await state();add('hidden-persists-across-route',s.rootHidden&&s.navText==='Show Toadal'&&s.storedHidden==='true'&&JSON.parse(s.storedPosition||'{}').manual===true,s);
  await activateFocused('[data-companion-nav-visibility]');await waitFor("!document.querySelector('[data-companion]')?.hidden");s=await state();
  add('route-show-retains-manual-placement-mode',!s.rootHidden&&s.navText==='Hide Toadal'&&s.minimized==='true'&&JSON.parse(s.storedPosition||'{}').manual===true&&s.active==='nav',s);
  await evaluate("document.querySelector('[data-companion-nav-visibility]').click()");await waitFor("document.querySelector('[data-companion]')?.hidden===true");await evaluate("document.querySelector('[data-companion-restore]').click()");await waitFor("!document.querySelector('[data-companion]')?.hidden");s=await state();
  add('footer-restore-synchronizes-nav',!s.rootHidden&&s.navText==='Hide Toadal'&&s.navPressed==='true'&&!s.restoreVisible,s);
  await evaluate("localStorage.setItem('toadal:site:companion:hidden:v1','broken-value')");await call('Page.reload',{ignoreCache:true});await waitFor("document.querySelector('[data-companion]')?.getAttribute('data-position-ready')==='true'");const invalid=await state();await evaluate("document.querySelector('[data-companion-nav-visibility]').click()");await waitFor("document.querySelector('[data-companion]')?.hidden===true");const repaired=await state();
  add('corrupt-preference-safe-and-repairable',!invalid.rootHidden&&invalid.navPersistence==='invalid'&&repaired.storedHidden==='true'&&repaired.navPersistence==='persistent',{initial:invalid,afterChoice:repaired});
  for(const width of [961,1024,1099,1440]){await metrics(width,800,false);await clearPrefs();await navigate('');s=await state();add('desktop-nav-fit-'+width,s.navVisible&&!s.overflow&&s.navBox.height>=40,s);}
  for(const pair of [[390,844],[320,800],[430,932]]){
    const width=pair[0],height=pair[1];await metrics(width,height,true);await clearPrefs();await navigate('');const initial=await state();
    await tap('.nav-toggle');await waitFor("document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')==='true'");const opened=await state();
    await tap('[data-companion-nav-visibility]');await waitFor("document.querySelector('[data-companion]')?.hidden===true");const hidden=await state();
    await navigate('play/');await tap('.nav-toggle');await waitFor("document.querySelector('.nav-toggle')?.getAttribute('aria-expanded')==='true'");const persisted=await state();
    await tap('[data-companion-nav-visibility]');await waitFor("!document.querySelector('[data-companion]')?.hidden");const shown=await state();
    const ok=initial.minimized==='true'&&!initial.rootHidden&&!initial.overflow&&opened.navVisible&&opened.navBox.height>=44&&!opened.overflow&&opened.storedHidden===initial.storedHidden&&opened.storedMinimized===initial.storedMinimized&&hidden.rootHidden&&hidden.hiddenVisibleInteractives===0&&hidden.navText==='Show Toadal'&&persisted.rootHidden&&persisted.navText==='Show Toadal'&&!shown.rootHidden&&shown.navText==='Hide Toadal'&&!shown.overflow;
    add('mobile-menu-lifecycle-'+width+'x'+height,ok,{initial,menuOpen:opened,hidden,routePersisted:persisted,shown});
    if(width===390){const shot=await call('Page.captureScreenshot',{format:'png',fromSurface:true});fs.writeFileSync(path.join(reportDir,'mobile-390-shown.png'),Buffer.from(shot.data,'base64'));await tap('[data-companion-toggle]');await sleep(80);await tap('[data-companion-toggle]');await sleep(220);const dbl=await state();add('mobile-double-tap-hide-retained',dbl.rootHidden&&dbl.navText==='Show Toadal',dbl);}
  }
  const denial=["(()=>{","const g=Storage.prototype.getItem,s=Storage.prototype.setItem;","Storage.prototype.getItem=function(k){if(k==='toadal:site:companion:hidden:v1')throw new Error('controlled denial');return g.call(this,k)};","Storage.prototype.setItem=function(k,v){if(k==='toadal:site:companion:hidden:v1')throw new Error('controlled denial');return s.call(this,k,v)};","})()"].join('\n');
  await call('Page.addScriptToEvaluateOnNewDocument',{source:denial});await metrics(1440,900,false);await navigate('');const a=await state();await evaluate("document.querySelector('[data-companion-nav-visibility]').click()");await waitFor("document.querySelector('[data-companion]')?.hidden===true");const b=await state();await call('Page.reload',{ignoreCache:true});await waitFor("document.querySelector('[data-companion]')?.getAttribute('data-position-ready')==='true'");const c=await state();
  add('storage-denial-is-temporary-not-false-persistence',a.navPersistence==='temporary'&&!a.rootHidden&&b.rootHidden&&b.navPersistence==='temporary'&&!c.rootHidden&&c.navPersistence==='temporary',{initial:a,hiddenInMemory:b,afterReload:c});
}finally{
  const report={schema:'toadal-feast.companion-navigation-lifecycle.v1',basePath,cases,failures,summary:{status:failures.length?'FAIL':'PASS',cases:cases.length,passed:cases.length-failures.length,failed:failures.length},mobileEvidence:'Chrome DevTools mobile/touch emulation. Physical-device status is recorded separately.'};
  fs.writeFileSync(path.join(reportDir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));ws.close();server.close();chromeProc.kill();try{fs.rmSync(profile,{recursive:true,force:true});}catch{}
}
if(failures.length)process.exit(1);
