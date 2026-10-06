#!/usr/bin/env node
// Exercises actual exported Feast Pass pages. Score and failure inputs are controlled
// fixtures through the existing store; no cartridge or native game is launched.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output) throw new Error('Usage: node scripts/feast-pass-game-records-browser.mjs <REPORT_DIRECTORY>');
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
const cases = [];
let browser;
try {
  browser = await chromium.launch({ headless:true, ...(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH } : {}), timeout:15000 });
  for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:700}]) {
    const row = {name:`feast-pass-game-records-${viewport.width}`,status:'FAIL',checks:[]};
    const context = await browser.newContext({viewport,hasTouch:viewport.width<600,isMobile:viewport.width<600,serviceWorkers:'block'});
    const errors=[];
    try {
      await context.route('**/*',route => route.request().url().startsWith(origin+'/') ? route.continue() : route.abort());
      await context.addInitScript(keys => {
        const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,local=window.localStorage;
        const control=window.__gameRecordsTest={denied:null,writes:0};
        Storage.prototype.getItem=function(key){if(this===local && control.denied===key)throw new DOMException('controlled read failure','SecurityError');return get.call(this,key);};
        Storage.prototype.setItem=function(key,value){if(this===local && keys.includes(key))control.writes++;return set.call(this,key,value);};
        Storage.prototype.removeItem=function(key){if(this===local && keys.includes(key))control.writes++;return remove.call(this,key);};
      },Object.values(KEYS));
      const a=await context.newPage(),b=await context.newPage();
      for(const page of [a,b]){page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));}
      const [runtime]=await Promise.all([a.waitForResponse(r=>r.url()===origin+prefix+'assets/js/guest-progression.js'),a.goto(origin+prefix+'feast-pass/',{waitUntil:'load'})]);
      assert.equal(hash(await runtime.body()),runtimeHash);
      const card=a.locator('[data-game-record="wicked-bites"]');
      const field=name=>card.locator(`[data-game-record-field="${name}"]`);
      const waitState=value=>a.waitForFunction(v=>document.querySelector('[data-game-record="wicked-bites"]')?.getAttribute('data-game-record-state')===v,value);
      await waitState('not-recorded');
      assert.equal(await a.locator('[data-game-record]').count(),4);
      assert.equal(await field('best').innerText(),'—');
      assert.equal(await a.locator('[data-game-record-state="unsupported"]').count(),3);
      for(const href of await a.locator('[data-game-record] a').evaluateAll(nodes=>nodes.map(n=>n.href))){
        assert.ok(href.startsWith(origin+prefix));assert.ok(!href.includes('/player/')&&!href.includes('/public/games/'));
        assert.equal((await a.request.get(href)).status(),200);
      }
      row.checks.push('native section has four source-labelled game cards; empty is not zero; catalogue/history links resolve without launching a game');
      const initialWrites=await a.evaluate(()=>window.__gameRecordsTest.writes);
      await a.evaluate(()=>{window.__originalGameCard=document.querySelector('[data-game-record="wicked-bites"]');window.__originalGameLink=window.__originalGameCard.querySelector('a');});
      await b.goto(origin+prefix+'profile/',{waitUntil:'load'});
      const record=async value=>b.evaluate(value=>document.querySelector('[data-progression-page]').__toadalProgressionStore.recordLocalScore({gameId:'wicked-bites',score:value}),value);
      assert.equal((await record(0)).ok,true);await waitState('recorded');
      assert.equal(await field('best').innerText(),'0');assert.equal(await field('recent-count').innerText(),'1');
      await record(1200);await record(5);
      await a.waitForFunction(()=>document.querySelector('[data-game-record-field="recent-count"]')?.textContent==='3');
      assert.equal(await field('best').innerText(),'1,200');assert.equal(await field('latest').innerText(),'5');
      assert.match(await field('recorded-at').getAttribute('datetime'),/^\d{4}-\d{2}-\d{2}T/);
      assert.equal(await a.evaluate(()=>document.querySelector('[data-progression-page]').__toadalProgressionStore.getSnapshot().pass.xp),0);
      row.checks.push('existing score-store input produces saved 0, best 1200, latest 5 and three recent results; no XP award');
      const region=a.locator('section[aria-labelledby="pass-games-title"]');
      await region.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      assert.equal(await region.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
      assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
      await region.screenshot({path:path.join(output,row.name+'-recorded.png')});
      await card.getByRole('link',{name:'View local score history',exact:true}).click();
      await a.waitForURL('**/leaderboards/?game=wicked-bites');
      await a.waitForFunction(()=>document.querySelector('[data-leaderboard-personal-best]')?.textContent==='1200');
      assert.equal(await a.locator('[data-leaderboard-rows] tr').count(),3);
      row.checks.push('actual history link opens the existing local leaderboard with matching personal best and three results');
      await a.goto(origin+prefix+'feast-pass/',{waitUntil:'load'});
      await card.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
      await a.screenshot({path:path.join(output,row.name+'-viewport.png')});
      await a.reload({waitUntil:'load'});await waitState('recorded');assert.equal(await field('best').innerText(),'1,200');
      row.checks.push('actual reload retains recorded scores; desktop/phone-width source section has no horizontal overflow');
      const afterReloadWrites=await a.evaluate(()=>window.__gameRecordsTest.writes);
      await a.evaluate(()=>{window.__originalGameCard=document.querySelector('[data-game-record="wicked-bites"]');window.__originalGameLink=window.__originalGameCard.querySelector('a');});
      await a.evaluate(key=>{window.__gameRecordsTest.denied=key;window.dispatchEvent(new Event('focus'));},KEYS.profile);
      await waitState('unavailable');assert.equal(await field('best').innerText(),'—');
      await region.screenshot({path:path.join(output,row.name+'-unavailable.png')});
      await a.evaluate(()=>{window.__gameRecordsTest.denied=null;window.dispatchEvent(new Event('focus'));});
      await waitState('recorded');assert.equal(await field('best').innerText(),'1,200');
      const raw=await b.evaluate(key=>localStorage.getItem(key),KEYS.profile);
      const future=JSON.stringify({schemaVersion:99,localScores:{'wicked-bites':{best:99999,runs:[]}},marker:'future-keep'});
      await b.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEYS.profile,raw:future});
      await waitState('unavailable');assert.equal(await field('best').innerText(),'—');
      assert.equal(await b.evaluate(key=>localStorage.getItem(key),KEYS.profile),future);
      await b.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEYS.profile,raw});
      await waitState('recorded');
      row.checks.push('denied/future score storage is unavailable, not zero or phantom progress; stored future bytes preserved and recovery restores the real score');
      await b.locator('[data-clear-progression]').first().click();await waitState('not-recorded');
      assert.equal(await field('best').innerText(),'—');
      assert.equal(await a.evaluate(()=>window.__gameRecordsTest.writes),afterReloadWrites);
      assert.equal(await a.evaluate(()=>window.__originalGameCard===document.querySelector('[data-game-record="wicked-bites"]')&&window.__originalGameLink===window.__originalGameCard.querySelector('a')),true);
      assert.equal(initialWrites,0);
      row.checks.push('reset propagates, receiver writes no additional progress, and card/link DOM identity survives updates');
      assert.deepEqual(errors,[]);row.pageErrors=errors;row.runtimeSha256=runtimeHash;row.status='PASS';
    }catch(error){row.error=String(error.stack||error);}
    finally{await context.close();}
    cases.push(row);console.log(row.name,row.status,row.error||'');
  }
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const row={name:'storage-inaccessible-on-boot',status:'FAIL'};
  try{
    await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('controlled storage denial','SecurityError');}}));
    const page=await context.newPage();await page.goto(origin+prefix+'feast-pass/',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('[data-game-record="wicked-bites"]')?.getAttribute('data-game-record-state')==='temporary');
    assert.equal(await page.locator('[data-game-record="wicked-bites"] [data-game-record-field="best"]').innerText(),'—');row.status='PASS';
  }catch(error){row.error=String(error.stack||error);}finally{await context.close();}
  cases.push(row);console.log(row.name,row.status,row.error||'');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
const report={schema:'toadal.feast-pass-game-records.browser.v1',runtimeSha256:runtimeHash,evidence:'Actual exported source pages and links; controlled existing-store score inputs, read denial and future-schema fixtures. Phone sizes are Chromium emulation. No gameplay, TCS, account sync, physical-device or release approval is asserted.',cases,passed:cases.filter(c=>c.status==='PASS').length,total:cases.length};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,total:report.total}));process.exitCode=report.passed===report.total?0:1;
