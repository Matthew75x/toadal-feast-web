#!/usr/bin/env node
// Actual exported catalogue journeys. No cartridge/game execution or provider traffic.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]&&path.resolve(process.argv[2]);
if(!output)throw new Error('Usage: node scripts/play-catalogue-browser.mjs <REPORT_DIRECTORY> [--baseline]');
fs.mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url);
const imported=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||require.resolve('playwright-core')).href);
const {chromium}=imported.default||imported;
const dist=path.join(repo,'dist'),prefix='/toadal-feast-web/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!['GET','HEAD'].includes(req.method)||!url.pathname.startsWith(prefix)){res.writeHead(404).end();return;}
  let file=path.resolve(dist,decodeURIComponent(url.pathname.slice(prefix.length)));
  if(!file.startsWith(dist+path.sep)&&file!==dist){res.writeHead(403).end();return;}
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin='http://127.0.0.1:'+server.address().port;
const route=s=>origin+prefix+s;
const cases=[];let browser;
const baseline=process.argv.includes('--baseline');
const timeout=Number(process.env.CATALOGUE_TEST_TIMEOUT_MS||30000);
if(!Number.isInteger(timeout)||timeout<15000||timeout>60000)throw new Error('Bounded timeout must be 15000..60000');
const cards=p=>p.locator('#browser-games .studio-game-card');
const visibleIds=p=>cards(p).evaluateAll(nodes=>nodes.filter(n=>!n.hidden).map(n=>n.getAttribute('data-game-id')));
const filter=(p,key)=>p.locator('[data-catalogue-filter="'+key+'"]');
const ready=p=>p.waitForFunction(()=>document.querySelector('[data-catalogue-root]')?.getAttribute('data-catalogue-state')==='ready');
const waitIds=async(p,ids)=>{await p.waitForFunction(ids=>JSON.stringify([...document.querySelectorAll('#browser-games .studio-game-card')].filter(n=>!n.hidden).map(n=>n.getAttribute('data-game-id')))===JSON.stringify(ids),ids);};
const storage=p=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('toadal:web:v1:')).map(k=>[k,localStorage.getItem(k)])));
async function noOverlap(p){
 await p.locator('[data-catalogue-form]').scrollIntoViewIfNeeded();await p.waitForTimeout(350);
 const hit=await p.evaluate(()=>{
  const panel=document.querySelector('#toadal-companion-panel');if(!panel)return false;
  const style=getComputedStyle(panel),r=panel.getBoundingClientRect();if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||!r.width)return false;
  return [...document.querySelectorAll('[data-catalogue-form], [data-catalogue-control]:not([hidden])')].some(n=>{const b=n.getBoundingClientRect();return b.width&&b.height&&Math.min(b.right,r.right)>Math.max(b.left,r.left)&&Math.min(b.bottom,r.bottom)>Math.max(b.top,r.top);});
 });assert.equal(hit,false,'Automatic companion tip must not cover catalogue form text or controls');
}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,timeout:20000});
 async function contextFor(viewport,options={}){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<600,isMobile:viewport.width<600,serviceWorkers:'block',reducedMotion:'reduce',...options});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  return context;
 }
 if(baseline){
  const context=await contextFor({width:1280,height:900});try{
   const p=await context.newPage();await p.goto(route('play/'),{waitUntil:'load'});
   cases.push({name:'prior-catalogue',status:'OBSERVED',oldFilters:await p.locator('[data-game-tab]').allTextContents(),searchFields:await p.locator('[data-catalogue-query]').count(),availabilityControls:await p.locator('[data-catalogue-filter]').count(),listedIds:await cards(p).evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-game-id'))),pageSha256:hash(fs.readFileSync(path.join(dist,'play/index.html')))});
  }finally{await context.close();}
 }else{
  for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:700}]){
   const context=await contextFor(viewport);const row={name:'catalogue-journey-'+viewport.width,status:'FAIL',checks:[]},errors=[],gameRequests=[];
   try{
    const p=await context.newPage();p.setDefaultTimeout(timeout);p.on('pageerror',e=>errors.push(e.message));
    context.on('request',r=>{if(r.url().includes('/public/games/'))gameRequests.push(r.url());});
    const [moduleResponse]=await Promise.all([p.waitForResponse(r=>r.url()===route('assets/js/play-catalogue.js')),p.goto(route('play/?utm_source=review#browser-games'),{waitUntil:'load'})]);
    assert.equal(hash(await moduleResponse.body()),hash(fs.readFileSync(path.join(dist,'assets/js/play-catalogue.js'))));await ready(p);
    assert.deepEqual(await visibleIds(p),['wicked-bites','claw-feed-gulper','toadal-tower-defense','froggy-fruity-bash']);
    const initial=await storage(p);
    assert.equal(await filter(p,'playable').locator('[data-catalogue-count]').innerText(),'1');assert.equal(await filter(p,'held').locator('[data-catalogue-count]').innerText(),'1');assert.equal(await filter(p,'playable').getAttribute('aria-label'),'Playable: 1 matching listing');assert.equal(await filter(p,'concept').locator('[data-catalogue-count]').innerText(),'2');
    assert.equal(await cards(p).locator('.chip.preview').count(),4);await noOverlap(p);
    await p.locator('[data-catalogue-form]').screenshot({path:path.join(output,row.name+'-controls.png')});
    await filter(p,'playable').click();await waitIds(p,['wicked-bites']);assert.equal(new URL(p.url()).searchParams.get('availability'),'playable');
    assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('data-catalogue-filter')),'playable');
    await p.locator('#browser-games [data-game-id="wicked-bites"] .play-card__art').click();await p.waitForURL('**/games/wicked-bites/');
    assert.ok(await p.locator('a[href="'+prefix+'player/wicked-bites/"]').count(),'existing detail retains its existing player destination');assert.equal(await p.locator('iframe').count(),0);
    await p.goBack({waitUntil:'load'});await ready(p);await waitIds(p,['wicked-bites']);
    await p.locator('[data-catalogue-release-filter]').selectOption('public');await waitIds(p,[]);assert.match(await p.locator('[data-game-empty]').innerText(),/No public releases/);
    await p.locator('[data-catalogue-release-filter]').selectOption('preview');await waitIds(p,['wicked-bites']);
    row.checks.push('current 1/1/2 availability from source; playable filter reaches existing detail/player link without running game; release status remains separate');
    await filter(p,'held').click();await waitIds(p,['claw-feed-gulper']);
    await p.locator('[data-catalogue-query]').fill('gulper');await p.locator('[data-catalogue-query]').press('Enter');await waitIds(p,['claw-feed-gulper']);
    assert.equal(new URL(p.url()).searchParams.get('q'),'gulper');
    await p.locator('#browser-games [data-game-id="claw-feed-gulper"] .play-card__art').click();await p.waitForURL('**/games/claw-feed-gulper/');
    assert.equal(await p.locator('iframe,a[href*="/player/claw-feed-gulper"],a[href*="/public/games/"]').count(),0,'held details do not gain a launch');
    await p.goBack({waitUntil:'load'});await ready(p);assert.equal(await p.locator('[data-catalogue-query]').inputValue(),'gulper');await waitIds(p,['claw-feed-gulper']);
    await p.reload({waitUntil:'load'});await ready(p);assert.equal(await filter(p,'held').getAttribute('aria-pressed'),'true');await waitIds(p,['claw-feed-gulper']);
    const b=await context.newPage();b.setDefaultTimeout(timeout);await b.goto(p.url(),{waitUntil:'load'});await ready(b);await waitIds(b,['claw-feed-gulper']);await b.close();
    row.checks.push('search and availability compose; held listing remains held; Back/reload/copied URL preserve the same title and filters');
    await p.locator('[data-catalogue-query]').fill('wicked');await waitIds(p,[]);assert.equal(await p.locator('[data-game-empty]').isVisible(),true);
    await p.locator('[data-catalogue-reset]').click();await waitIds(p,['wicked-bites','claw-feed-gulper','toadal-tower-defense','froggy-fruity-bash']);
    assert.equal(new URL(p.url()).searchParams.get('utm_source'),'review');assert.equal(new URL(p.url()).hash,'#browser-games');assert.equal(new URL(p.url()).searchParams.get('q'),null);
    assert.equal(await p.locator('[data-catalogue-query]').evaluate(n=>n===document.activeElement),true);
    await filter(p,'held').click();await filter(p,'concept').click();await waitIds(p,['toadal-tower-defense','froggy-fruity-bash']);
    await p.goBack();await waitIds(p,['claw-feed-gulper']);await p.goForward();await waitIds(p,['toadal-tower-defense','froggy-fruity-bash']);
    await p.locator('[data-catalogue-query]').fill('FRUITY');await waitIds(p,['froggy-fruity-bash']);
    await p.locator('#browser-games [data-game-id="froggy-fruity-bash"] .play-card__art').click();await p.waitForURL('**/games/froggy-fruity-bash/');
    assert.equal(await p.locator('iframe,a[href*="/player/froggy-fruity-bash"],a[href*="/public/games/"]').count(),0);
    await p.goBack({waitUntil:'load'});await ready(p);await waitIds(p,['froggy-fruity-bash']);
    await p.screenshot({path:path.join(output,row.name+'-filtered.png')});
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await noOverlap(p);
    assert.deepEqual(await storage(p),initial);assert.deepEqual(gameRequests,[]);assert.deepEqual(errors,[]);
    row.checks.push('true no-match/reset recovery; campaign and fragment retained; filter Back/Forward; concepts remain nonplayable; no game execution, progress writes, overflow or script errors');
    row.status='PASS';
   }catch(e){row.error=String(e.stack||e);}finally{await context.close();}
   cases.push(row);console.log(row.name,row.status,row.error||'');
  }
  for(const scenario of ['module-failure','no-javascript','projection-mismatch','url-write-denied','invalid-url-and-query','unconfirmed-card','empty-catalogue']){
   const context=await contextFor({width:390,height:844},{javaScriptEnabled:scenario!=='no-javascript'});const row={name:scenario,status:'FAIL'};
   try{
    if(scenario==='module-failure')await context.route('**/assets/js/play-catalogue.js',r=>r.abort());
    if(scenario==='url-write-denied')await context.addInitScript(()=>{history.pushState=()=>{throw new DOMException('controlled history restriction','SecurityError');};history.replaceState=history.pushState;});
    if(['projection-mismatch','unconfirmed-card','empty-catalogue'].includes(scenario))await context.route('**/assets/js/play-catalogue.js',async r=>{
      let source=fs.readFileSync(path.join(dist,'assets/js/play-catalogue.js'),'utf8');
      const setup=scenario==='projection-mismatch'?"document.querySelector('[data-catalogue-root]').setAttribute('data-catalogue-version','99');":scenario==='unconfirmed-card'?"document.querySelector('#browser-games .studio-game-card').setAttribute('data-catalogue-availability','unavailable');":"document.querySelectorAll('#browser-games .studio-game-card').forEach(n=>n.remove());";
      await r.fulfill({status:200,contentType:'text/javascript',body:setup+'\n'+source});
    });
    const p=await context.newPage();p.setDefaultTimeout(timeout);
    await p.goto(route('play/'+(scenario==='invalid-url-and-query'?'?availability=invalid&release=latest&keep=1':'')),{waitUntil:'load'});
    if(['module-failure','projection-mismatch'].includes(scenario)){
      await p.waitForFunction(()=>document.querySelector('[data-catalogue-root]').getAttribute('data-catalogue-state')==='unavailable');assert.equal((await visibleIds(p)).length,4);assert.equal(await p.locator('[data-catalogue-query]').isDisabled(),true);assert.equal(await p.locator('[data-game-empty]').isVisible(),false);
      await p.locator('#browser-games [data-game-id="claw-feed-gulper"] .play-card__art').click();await p.waitForURL('**/games/claw-feed-gulper/');
    }else if(scenario==='no-javascript'){
      assert.equal((await visibleIds(p)).length,4);assert.equal(await p.locator('[data-catalogue-query]').isDisabled(),true);assert.match(await p.locator('[data-catalogue-fallback]').innerText(),/Without JavaScript/);assert.equal(await p.locator('[data-catalogue-availability-label]').count(),4);
    }else{
      await ready(p);
      if(scenario==='url-write-denied'){
        await filter(p,'held').click();await waitIds(p,['claw-feed-gulper']);assert.equal(new URL(p.url()).searchParams.get('availability'),null);assert.match(await p.locator('[data-catalogue-url-status]').innerText(),/did not allow/);
      }else if(scenario==='invalid-url-and-query'){
        assert.equal((await visibleIds(p)).length,4);assert.equal(await filter(p,'all').getAttribute('aria-pressed'),'true');
        await p.locator('[data-catalogue-query]').fill('<img id="injected" src=x onerror=alert(1)>');await waitIds(p,[]);assert.equal(await p.locator('#injected').count(),0);assert.equal(new URL(p.url()).searchParams.get('keep'),'1');
        await p.locator('[data-catalogue-reset]').click();assert.equal((await visibleIds(p)).length,4);
      }else if(scenario==='unconfirmed-card'){
        assert.equal(await filter(p,'unavailable').isVisible(),true);await filter(p,'unavailable').click();await waitIds(p,['wicked-bites']);assert.equal(await p.locator('#browser-games [data-game-id="wicked-bites"] [data-catalogue-availability-label]').innerText(),'Availability unconfirmed');assert.equal(await filter(p,'playable').locator('[data-catalogue-count]').innerText(),'0');
      }else{
        assert.equal((await visibleIds(p)).length,0);assert.match(await p.locator('[data-game-empty]').innerText(),/No games are listed here yet/);assert.equal(await filter(p,'all').locator('[data-catalogue-count]').innerText(),'0');
      }
    }
    row.status='PASS';
   }catch(e){row.error=String(e.stack||e);}finally{await context.close();}
   cases.push(row);console.log(row.name,row.status,row.error||'');
  }
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
const report={schema:'toadal.play-catalogue.browser.v1',cases,passed:cases.filter(c=>c.status==='PASS').length,total:cases.length,operationTimeout:timeout,evidence:baseline?'Original exported catalogue observation, before availability controls.':'Actual exported catalogue search/filter/detail navigation, URL reload/Back/Forward, keyboard controls and preserved launch boundaries. Failure/unsupported/empty states are controlled inputs; phone widths are Chromium emulation. No game run, source activation, account data or physical-device qualification. Browser contexts and server are closed.'};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total}));process.exitCode=baseline?0:report.passed===report.total?0:1;
