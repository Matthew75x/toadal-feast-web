#!/usr/bin/env node
// Exercises actual existing website reward/display controls. Failure
// inputs are controlled fixtures; no cartridge or native game is launched.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output) throw new Error('Usage: node scripts/guest-showcase-browser.mjs <REPORT_DIRECTORY>');
fs.mkdirSync(output, { recursive: true });
const require = createRequire(import.meta.url);
const { KEYS } = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const module = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || require.resolve('playwright-core')).href);
const { chromium } = module.default || module;
const dist = path.join(repo, 'dist'), prefix = '/toadal-feast-web/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runtimeHash = hash(fs.readFileSync(path.join(dist, 'assets/js/guest-progression.js')));
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!['GET','HEAD'].includes(req.method) || !url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    let file = path.resolve(dist, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file !== dist && !file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'content-type':types[path.extname(file)] || 'application/octet-stream', 'cache-control':'no-store' });
    res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
// Functional checks are not a page-load performance benchmark. Keep a bounded
// opt-in allowance for a busy shared runner; assertions and journeys are unchanged.
const operationTimeout = Number(process.env.SHOWCASE_TEST_TIMEOUT_MS || 20000);
if (!Number.isInteger(operationTimeout) || operationTimeout < 20000 || operationTimeout > 60000) throw new Error('SHOWCASE_TEST_TIMEOUT_MS must be 20000..60000');
const cases = [];
let browser;
const url = route => origin + prefix + route;
const group = (page,type) => page.locator('[data-showcase-group="'+type+'"]');
const current = (page,type) => group(page,type).locator('[data-showcase-current]');
const select = (page,type) => group(page,type).locator('[data-showcase-select]');
const save = (page,type) => group(page,type).locator('[data-showcase-save]');
const panel = page => page.locator('[data-profile-showcase]');
const message = page => page.locator('[data-showcase-status]');
const reward = (page,title) => page.locator('[data-progression-reward-list] [role="listitem"]').filter({has:page.locator('strong',{hasText:new RegExp('^'+title+'$')})});
async function contextFor(viewport, noStorage = false) {
  const context=await browser.newContext({viewport,hasTouch:viewport.width<600,isMobile:viewport.width<600,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.addInitScript(({keys,noStorage})=>{
    const D=Date;const control=window.__showcaseTest={now:Date.UTC(2026,9,6,12),writes:0,denyRead:null,denyWrite:null,silent:false};
    window.Date=class extends D{constructor(...args){super(...(args.length?args:[control.now]));}static now(){return control.now;}};
    if(noStorage){Object.defineProperty(window,'localStorage',{get(){throw new DOMException('controlled storage denial','SecurityError');}});return;}
    const local=window.localStorage,get=Storage.prototype.getItem,set=Storage.prototype.setItem;
    Storage.prototype.getItem=function(k){if(this===local&&control.denyRead===k)throw new DOMException('controlled read denial','SecurityError');return get.call(this,k);};
    Storage.prototype.setItem=function(k,v){if(this===local&&control.denyWrite===k)throw new DOMException('controlled quota denial','QuotaExceededError');if(this===local&&keys.includes(k)){control.writes++;if(control.silent)return;}return set.call(this,k,v);};
  },{keys:Object.values(KEYS),noStorage});
  return context;
}
async function waitCurrent(page,type,text){await page.waitForFunction(({type,text})=>document.querySelector('[data-showcase-group="'+type+'"] [data-showcase-current]')?.textContent===text,{type,text});}
async function assertNoOverlap(page){
  await panel(page).scrollIntoViewIfNeeded();await page.waitForTimeout(350);
  const overlap=await page.evaluate(()=>{
    const tip=document.querySelector('#toadal-companion-panel'),area=document.querySelector('.guest-showcase');
    if(!tip||!area)return false;const s=getComputedStyle(tip),a=area.getBoundingClientRect(),b=tip.getBoundingClientRect();
    if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||!b.width||!b.height)return false;
    return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
  });
  assert.equal(overlap,false,'automatic companion tip obscures showcase');
}
async function badgeJourney(viewport){
  const row={name:'actual-badge-journey-'+viewport.width,status:'FAIL',checks:[]};const context=await contextFor(viewport);const errors=[];
  try{
    const a=await context.newPage(),b=await context.newPage();for(const p of [a,b]){p.setDefaultTimeout(operationTimeout);p.on('pageerror',e=>errors.push(e.message));}
    const [response]=await Promise.all([a.waitForResponse(r=>r.url()===url('assets/js/guest-progression.js')),a.goto(url('feast-pass/rewards/'),{waitUntil:'load'})]);assert.equal(hash(await response.body()),runtimeHash);
    await b.goto(url('profile/'),{waitUntil:'load'});await waitCurrent(b,'badge','No badge displayed');
    assert.equal(await select(b,'badge').locator('option').count(),1);assert.equal(await save(b,'badge').isDisabled(),true);
    await reward(a,'First Feast').getByRole('button',{name:'Claim locally',exact:true}).click();
    await b.waitForFunction(()=>document.querySelector('[data-showcase-group="badge"] select')?.options.length===2);
    assert.equal(await reward(a,'First Feast').getByRole('button').count(),0);await waitCurrent(b,'badge','No badge displayed');
    const savedPass=await a.evaluate(key=>localStorage.getItem(key),KEYS.pass);const remoteWrites=await a.evaluate(()=>__showcaseTest.writes);
    await select(b,'badge').selectOption('first-feast');await save(b,'badge').focus();await b.keyboard.press('Enter');
    await waitCurrent(b,'badge','First Feast');await waitCurrent(a,'badge','First Feast');
    assert.equal(await a.evaluate(()=>__showcaseTest.writes),remoteWrites);assert.match(await message(b).innerText(),/saved in this browser/);
    assert.equal(await b.evaluate(key=>localStorage.getItem(key),KEYS.pass),savedPass);
    row.checks.push('real existing reward claim enables badge selection; keyboard save persists; other tab refreshes without reward/save writes');
    await b.reload({waitUntil:'load'});await waitCurrent(b,'badge','First Feast');assert.equal(await select(b,'badge').inputValue(),'first-feast');
    await assertNoOverlap(b);assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await panel(b).screenshot({path:path.join(output,row.name+'-profile.png')});
    await select(a,'badge').selectOption('');await save(a,'badge').click();await waitCurrent(b,'badge','No badge displayed');
    assert.equal(await select(b,'badge').locator('option').count(),2);assert.match(await message(a).innerText(),/earned rewards are unchanged/);
    await select(b,'badge').selectOption('first-feast');
    await a.evaluate(key=>{const p=JSON.parse(localStorage.getItem(key));p.localScores={'wicked-bites':{best:17,runs:[{score:17,completedAt:new Date().toISOString(),mode:null,ruleset:null,characterId:null}]}};localStorage.setItem(key,JSON.stringify(p));},KEYS.profile);
    await b.waitForFunction(()=>document.querySelector('[data-progression-score-list]')?.textContent.includes('17'));
    assert.equal(await select(b,'badge').inputValue(),'first-feast','read-only score refresh must preserve an unsaved valid choice');
    const writes=await b.evaluate(()=>__showcaseTest.writes);
    await a.locator('[data-clear-progression]').first().click();await waitCurrent(b,'badge','No badge displayed');
    assert.equal(await select(b,'badge').locator('option').count(),1);assert.equal(await save(b,'badge').isDisabled(),true);
    assert.equal(await b.evaluate(()=>__showcaseTest.writes),writes);assert.equal(await b.evaluate(key=>localStorage.getItem(key),KEYS.profile),null);
    row.checks.push('reload retains selection; hide keeps earned badge; unrelated refresh keeps valid draft; external reset removes choices without resurrecting progress');
    assert.deepEqual(errors,[]);row.status='PASS';
  }catch(error){row.error=String(error.stack||error);}finally{await context.close();}
  cases.push(row);console.log(row.name,row.status,row.error||'');
}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,timeout:30000});
  if(process.argv.includes('--baseline')){
    const context=await contextFor({width:1280,height:900});try{
      const p=await context.newPage();await p.goto(url('profile/'),{waitUntil:'load'});
      const profilePanels=await panel(p).count();const storeSelectionMethod=await p.evaluate(()=>typeof document.querySelector('[data-progression-page]')?.__toadalProgressionStore?.selectProfileReward);
      await p.goto(url('feast-pass/rewards/'),{waitUntil:'load'});
      cases.push({name:'baseline-missing-showcase',status:'OBSERVED',profilePanels,rewardPanels:await panel(p).count(),storeSelectionMethod,runtimeSha256:runtimeHash});
    }finally{await context.close();}
  }else{
    for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:700}])await badgeJourney(viewport);
    {const row={name:'actual-title-unlock-claim-hide-reselect',status:'FAIL',clock:'20 injected UTC days, unchanged 5-XP daily claim'};const context=await contextFor({width:1280,height:900});try{
      const p=await context.newPage();p.setDefaultTimeout(operationTimeout);await p.goto(url('feast-pass/'),{waitUntil:'load'});
      for(let day=0;day<20;day++){
        await p.evaluate(day=>{__showcaseTest.now=Date.UTC(2026,9,6+day,12);window.dispatchEvent(new Event('focus'));},day);
        await p.locator('[data-claim-daily]').click();
      }
      assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).xp,KEYS.pass),100);
      await p.goto(url('feast-pass/rewards/'),{waitUntil:'load'});await reward(p,'Curious Feaster').getByRole('button',{name:'Claim locally',exact:true}).click();
      await waitCurrent(p,'title','Curious Feaster');const pass=await p.evaluate(key=>localStorage.getItem(key),KEYS.pass);
      await select(p,'title').selectOption('');await save(p,'title').click();await waitCurrent(p,'title','No title displayed');
      await p.goto(url('profile/'),{waitUntil:'load'});assert.equal(await p.locator('[data-progression-stat="selected-title"]').innerText(),'No title selected');
      await select(p,'title').selectOption('curious-feaster');await save(p,'title').click();await p.reload({waitUntil:'load'});await waitCurrent(p,'title','Curious Feaster');
      assert.equal(await p.locator('[data-progression-stat="selected-title"]').innerText(),'Curious Feaster');assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEYS.pass),pass);
      await panel(p).screenshot({path:path.join(output,'title-showcase.png')});row.status='PASS';
    }catch(e){row.error=String(e.stack||e);}finally{await context.close();}cases.push(row);console.log(row.name,row.status,row.error||'');}
    for(const scenario of ['write-failure','silent-write','unreadable-profile','future-profile','unknown-selected-title','no-browser-storage']){
      const row={name:scenario,status:'FAIL'};const context=await contextFor({width:390,height:844},scenario==='no-browser-storage');try{
        const p=await context.newPage();p.setDefaultTimeout(operationTimeout);await p.goto(url('feast-pass/rewards/'),{waitUntil:'load'});
        if(scenario==='no-browser-storage'){
          assert.equal(await panel(p).getAttribute('data-showcase-state'),'unavailable');assert.equal(await select(p,'badge').isDisabled(),true);assert.match(await message(p).innerText(),/unavailable/);
        }else{
          await reward(p,'First Feast').getByRole('button',{name:'Claim locally',exact:true}).click();
          if(['write-failure','silent-write'].includes(scenario)){
            await select(p,'badge').selectOption('first-feast');const original=await p.evaluate(key=>localStorage.getItem(key),KEYS.profile);
            await p.evaluate(({key,scenario})=>{if(scenario==='write-failure')__showcaseTest.denyWrite=key;else __showcaseTest.silent=true;},{key:KEYS.profile,scenario});
            await save(p,'badge').click();await waitCurrent(p,'badge','No badge displayed');assert.match(await message(p).innerText(),/could not be (saved|verified)/);
            assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEYS.profile),original);
            await p.evaluate(()=>{__showcaseTest.denyWrite=null;__showcaseTest.silent=false;});await save(p,'badge').click();await waitCurrent(p,'badge','First Feast');
          }else if(scenario==='unknown-selected-title'){
            await p.evaluate(key=>{const data=JSON.parse(localStorage.getItem(key));data.selectedTitle='<b>unearned</b>';localStorage.setItem(key,JSON.stringify(data));},KEYS.profile);
            await p.goto(url('profile/'),{waitUntil:'load'});assert.equal(await current(p,'title').innerText(),'Saved selection is not an earned configured title');
            assert.equal(await p.locator('[data-progression-stat="selected-title"]').innerText(),'Unavailable saved title');await save(p,'title').click();await waitCurrent(p,'title','No title displayed');
          }else{
            const raw=JSON.stringify({schemaVersion:99,marker:'keep-exact-future-profile'});
            if(scenario==='future-profile'){await p.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEYS.profile,raw});await p.reload({waitUntil:'load'});}
            else await p.evaluate(key=>{__showcaseTest.denyRead=key;window.dispatchEvent(new Event('focus'));},KEYS.profile);
            assert.equal(await panel(p).getAttribute('data-showcase-state'),'unavailable');assert.equal(await select(p,'badge').isDisabled(),true);assert.equal(await current(p,'badge').innerText(),'Unavailable');
            if(scenario==='future-profile')assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEYS.profile),raw);
          }
        }
        row.status='PASS';
      }catch(e){row.error=String(e.stack||e);}finally{await context.close();}cases.push(row);console.log(row.name,row.status,row.error||'');
    }
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
const report={schema:'toadal.guest-showcase.browser.v1',runtimeSha256:runtimeHash,operationTimeout,cases,passed:cases.filter(x=>x.status==='PASS').length,total:cases.length,evidence:process.argv.includes('--baseline')?'Observed absent showcase panels and missing selection API on the prior exported website.':'Actual exported-page reward claims, badge/title selection, reload and two-tab reset/refresh. Title qualification accelerates the clock through twenty real existing UTC-day controls; failure/score fixtures are controlled inputs. No new economy values, native game, accounts or physical-device certification. Browser contexts and server are closed.'};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total}));process.exitCode=process.argv.includes('--baseline')?0:report.passed===report.total?0:1;
