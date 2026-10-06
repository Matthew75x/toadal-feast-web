#!/usr/bin/env node
// Exercises actual exported quests, activities and existing claims. Failure
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
if (!output) throw new Error('Usage: node scripts/quest-journey-browser.mjs <REPORT_DIRECTORY>');
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
const operationTimeout = Number(process.env.QUEST_TEST_TIMEOUT_MS || 20000);
if (!Number.isInteger(operationTimeout) || operationTimeout < 20000 || operationTimeout > 60000) throw new Error('QUEST_TEST_TIMEOUT_MS must be 20000..60000');
const cases = [];
let browser;
try {
  browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,timeout:15000});
  const baseline = process.argv.includes('--baseline');
  const addControls = async context => context.addInitScript(keys => {
    const set=Storage.prototype.setItem,get=Storage.prototype.getItem,local=window.localStorage;
    const control=window.__questTest={denyWrite:null,denyRead:null,writes:0};
    Storage.prototype.setItem=function(k,v){if(this===local&&control.denyWrite===k)throw new DOMException('controlled write denial','QuotaExceededError');if(this===local&&keys.includes(k))control.writes++;return set.call(this,k,v);};
    Storage.prototype.getItem=function(k){if(this===local&&control.denyRead===k)throw new DOMException('controlled read denial','SecurityError');return get.call(this,k);};
  },Object.values(KEYS));
  async function contextFor(viewport) {
    const context=await browser.newContext({viewport,hasTouch:viewport.width<600,isMobile:viewport.width<600,serviceWorkers:'block',reducedMotion:'reduce'});
    await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await addControls(context);return context;
  }
  const pageRoute=route=>origin+prefix+route;
  const waitNext=async(page,kind,title)=>{
    await page.waitForFunction(({kind,title})=>{
      const card=document.querySelector('[data-quest-next]');return card?.getAttribute('data-quest-next-state')===kind&&(!title||card.querySelector('[data-quest-next-title]').textContent===title);
    },{kind,title});
  };
  async function assertNoTipOverlap(page, selector) {
    await page.waitForTimeout(400); // Allow the existing tip transition/placement to settle.
    const overlaps = await page.evaluate(selector => {
      const panel = document.querySelector('#toadal-companion-panel');
      if (!panel) return [];
      const style = getComputedStyle(panel), rect = panel.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || !rect.width || !rect.height) return [];
      return [...document.querySelectorAll(selector)].filter(node => {
        const r = node.getBoundingClientRect();
        return r.width && r.height && Math.min(r.right, rect.right) > Math.max(r.left, rect.left) && Math.min(r.bottom, rect.bottom) > Math.max(r.top, rect.top);
      }).map(node => node.getAttribute('data-quest-id') || node.className);
    }, selector);
    assert.deepEqual(overlaps, [], 'Automatic companion tip must not obscure quest text/actions');
  }
  const nextLink=page=>page.locator('[data-quest-next-link]');
  const quest= (page,id)=>page.locator('[data-quest-id="'+id+'"]');
  const filter=(page,key)=>page.locator('[data-quest-filter="'+key+'"]');
  const xp=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"xp":0}').xp,KEYS.pass);
  if(baseline) {
    const context=await contextFor({width:1280,height:900});
    try {
      const page=await context.newPage();await page.goto(pageRoute('feast-pass/quests/'),{waitUntil:'load'});
      const row={name:'before-implementation',status:'OBSERVED',activityLinks:await page.locator('[data-progression-quest-list] a').allTextContents(),statusFilters:await page.locator('[data-quest-filter]').count()};
      await page.goto(pageRoute('feast-pass/'),{waitUntil:'load'});row.nextCards=await page.locator('[data-quest-next]').count();row.runtimeSha256=runtimeHash;cases.push(row);
    }finally{await context.close();}
  } else {
    for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:700}]) {
      const row={name:'actual-quest-journey-'+viewport.width,status:'FAIL',checks:[]};const context=await contextFor(viewport);const errors=[];
      try {
        const a=await context.newPage(),b=await context.newPage();for(const page of [a,b]){page.setDefaultTimeout(operationTimeout);page.on('pageerror',e=>errors.push(e.message));}
        const [response]=await Promise.all([a.waitForResponse(r=>r.url()===pageRoute('assets/js/guest-progression.js')),a.goto(pageRoute('feast-pass/'),{waitUntil:'load'})]);
        assert.equal(hash(await response.body()),runtimeHash);await waitNext(a,'active','Explore the World');
        await assertNoTipOverlap(a, '.quest-next');
        await a.locator('[data-quest-next]').screenshot({path:path.join(output,row.name+'-next.png')});
        await b.goto(pageRoute('feast-pass/quests/'),{waitUntil:'load'});assert.equal(await filter(b,'all').getAttribute('data-quest-count'),'4');
        assert.equal(await filter(b,'active').getAttribute('data-quest-count'),'4');
        assert.equal(await quest(b,'visit-world').getByRole('link',{name:'Open activity',exact:true}).getAttribute('href'),prefix+'world/');
        assert.equal(await b.locator('[data-quest-claim]:visible').count(),0);
        await nextLink(a).click();await a.waitForURL('**/world/');
        await b.waitForFunction(()=>document.querySelector('[data-quest-id="visit-world"]')?.getAttribute('data-quest-state')==='ready');
        assert.equal(await xp(b),0);await filter(b,'active').click();assert.equal(await quest(b,'visit-world').isVisible(),false);
        await filter(b,'ready').click();assert.equal(await b.locator('[data-quest-id]:visible').count(),1);
        await b.locator('.quest-filters').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
        await assertNoTipOverlap(b, '.quest-board');
        await b.screenshot({path:path.join(output,row.name+'-board.png')});
        row.checks.push('fresh next step opens real World route; visit creates ready status in other tab without rewarding; filters/counts match');
        await a.goto(pageRoute('feast-pass/'),{waitUntil:'load'});await waitNext(a,'ready','Explore the World');
        await nextLink(a).click();await a.waitForURL('**/feast-pass/quests/?view=ready');assert.equal(await filter(a,'ready').getAttribute('aria-pressed'),'true');assert.equal(await xp(a),0);
        await quest(b,'visit-world').getByRole('button',{name:'Claim quest reward: Explore the World',exact:true}).click();assert.equal(await xp(b),10);
        assert.equal(await b.evaluate(()=>document.activeElement?.getAttribute('data-quest-filter')),'ready','claim keeps focus in visible quest controls');
        await a.waitForFunction(()=>document.querySelector('[data-quest-filter="ready"]')?.getAttribute('data-quest-count')==='0');
        assert.equal(await a.locator('[data-quest-empty]').isVisible(),true);
        await filter(b,'claimed').click();assert.equal(await quest(b,'visit-world').isVisible(),true);
        assert.equal(await quest(b,'visit-world').getByRole('button').isVisible(),false);
        await b.reload({waitUntil:'load'});assert.equal(await filter(b,'claimed').getAttribute('aria-pressed'),'true');assert.equal(await xp(b),10);
        row.checks.push('next-step ready link navigates without auto-claim; actual claim grants exactly 10 XP; claimed view and URL survive reload');
        await a.goto(pageRoute('feast-pass/'),{waitUntil:'load'});await waitNext(a,'active','Visit Stories');
        await nextLink(a).click();await a.waitForURL('**/stories/');
        await filter(b,'ready').click();await b.waitForFunction(()=>document.querySelector('[data-quest-id="visit-stories"]')?.getAttribute('data-quest-state')==='ready');
        await quest(b,'visit-stories').getByRole('button',{name:'Claim quest reward: Visit Stories',exact:true}).click();assert.equal(await xp(b),20);
        await a.goto(pageRoute('feast-pass/'),{waitUntil:'load'});await waitNext(a,'active','Find the Feast Treats');
        await nextLink(a).click();await a.waitForURL('**/toadal-feast-web/#interactive-discovery');
        await a.locator('[data-home-candy="portal-candy"]').click();await a.locator('[data-home-candy="lower-page-candy"]').click();
        for(let i=0;i<4;i++)await a.locator('[data-golden-block-hit]').click();
        await a.locator('[data-home-candy="golden-block-candy"]').click();
        await b.waitForFunction(()=>document.querySelector('[data-quest-id="find-feast-treats"]')?.getAttribute('data-quest-state')==='ready');
        await quest(b,'find-feast-treats').getByRole('button',{name:'Claim quest reward: Find the Feast Treats',exact:true}).click();assert.equal(await xp(b),35);
        await a.goto(pageRoute('feast-pass/'),{waitUntil:'load'});await waitNext(a,'daily','Daily check-in');
        await nextLink(a).click();await a.locator('[data-claim-daily]').click();await waitNext(a,'complete');assert.equal(await xp(a),40);
        row.checks.push('Stories visit is a route quest only; actual Home candy/block controls complete Treat quest; daily uses its existing one-time control');
        for(const page of [a,b])assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
        const writes=await a.evaluate(()=>window.__questTest.writes);
        await b.locator('[data-clear-progression]').first().click();await waitNext(a,'active','Explore the World');
        assert.equal(await xp(a),0);assert.equal(await a.evaluate(()=>window.__questTest.writes),writes);
        row.checks.push('reset updates next step without recreating progress or adding receiver writes; no horizontal overflow');
        assert.deepEqual(errors,[]);row.status='PASS';row.errors=errors;
      }catch(error){row.error=String(error.stack||error);}finally{await context.close();}
      cases.push(row);console.log(row.name,row.status,row.error||'');
    }
    for(const scenario of ['write-failure','future-quests','denied-read']) {
      const row={name:scenario,status:'FAIL'};const context=await contextFor({width:390,height:844});
      try {
        const page=await context.newPage();page.setDefaultTimeout(operationTimeout);
        await page.goto(pageRoute('world/'),{waitUntil:'load'});await page.goto(pageRoute('feast-pass/quests/?view=ready'),{waitUntil:'load'});
        if(scenario==='write-failure'){
          await page.evaluate(key=>window.__questTest.denyWrite=key,KEYS.pass);
          await quest(page,'visit-world').getByRole('button',{name:'Claim quest reward: Explore the World',exact:true}).click();
          assert.equal(await xp(page),0);assert.match(await page.locator('[data-progression-storage-status]').innerText(),/could not be saved/);
          assert.equal(await quest(page,'visit-world').getAttribute('data-quest-state'),'ready');
          await page.evaluate(()=>window.__questTest.denyWrite=null);
          await quest(page,'visit-world').getByRole('button',{name:'Claim quest reward: Explore the World',exact:true}).click();assert.equal(await xp(page),10);
        }else{
          let raw;
          if(scenario==='future-quests'){
            raw=JSON.stringify({schemaVersion:99,marker:'preserve-future'});await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEYS.quests,raw});await page.reload({waitUntil:'load'});
          }else await page.evaluate(key=>{window.__questTest.denyRead=key;window.dispatchEvent(new Event('focus'));},KEYS.quests);
          assert.equal(await page.locator('[data-quest-claim]:visible').count(),0);assert.equal(await filter(page,'all').getAttribute('data-quest-count'),'—');
          assert.match(await page.locator('[data-quest-summary]').innerText(),/unavailable/);
          if(raw)assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEYS.quests),raw);
        }
        row.status='PASS';
      }catch(error){row.error=String(error.stack||error);}finally{await context.close();}
      cases.push(row);console.log(row.name,row.status,row.error||'');
    }
  }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
const report={schema:'toadal.quest-journey.browser.v1',operationTimeout,runtimeSha256:runtimeHash,cases,passed:cases.filter(c=>c.status==='PASS').length,total:cases.length,evidence:process.argv.includes('--baseline')?'Baseline probe of absent activity links/status filters/next card; no gameplay or claim journey exercised.':'Actual exported-page navigation, quest claims, Home candy/block controls, daily claim, cross-tab reset and reload. Failure inputs are controlled. Phone widths are Chromium emulation, not physical-device acceptance. No native/cartridge execution, new rewards or account sync.'};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total}));process.exitCode=process.argv.includes('--baseline')?0:report.passed===report.total?0:1;
