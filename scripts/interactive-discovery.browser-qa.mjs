#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';

const repo = path.resolve(process.argv[2] || '.');
const dist = path.resolve(repo, process.argv[3] || 'dist');
const reportDir = path.resolve(repo, process.argv[4] || 'docs/review/interactive-discovery-v1-20261001/browser-qa');
const basePath = '/toadal-feast-web/';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`Missing rendered site: ${path.join(dist, 'index.html')}`);
fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });

const mime = file => ({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
}[path.extname(file).toLowerCase()] || 'application/octet-stream');

function resolveRequest(pathname) {
  if (!pathname.startsWith(basePath)) return null;
  const relative = decodeURIComponent(pathname.slice(basePath.length)).replace(/^\/+/, '');
  let file = path.resolve(dist, relative);
  if (file !== dist && !file.startsWith(dist + path.sep)) return null;
  if (pathname.endsWith('/') || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
  return file;
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const file = resolveRequest(pathname);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': mime(file), 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-discovery-qa-'));
const portProbe = http.createServer();
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
const debugPort = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const chrome = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
let serverClosed = false;
const failures = [];
const screenshots = [];
const checks = [];
const events = [];
const check = (name, ok, detail) => {
  checks.push({ name, status: ok ? 'PASS' : 'FAIL', ...(detail === undefined ? {} : { detail }) });
  if (!ok) failures.push(name);
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ` ${JSON.stringify(detail)}`}\n`);
};

try {
  let target;
  for (let i = 0; i < 80; i += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      target = targets.find(item => item.type === 'page');
      if (target) break;
    } catch {}
    await sleep(125);
  }
  if (!target) throw new Error('Chrome CDP target was not ready');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const resolve = pending.get(message.id); pending.delete(message.id);
      message.error ? resolve.reject(new Error(JSON.stringify(message.error))) : resolve.resolve(message);
    } else events.push(message);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject: error => reject(new Error(`${method} ${JSON.stringify(params)}: ${error.message}`)) });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    const result = response.result.result;
    if (response.result.exceptionDetails) throw new Error(`Browser evaluation failed: ${JSON.stringify({ expression, details: response.result.exceptionDetails })}`);
    return result.value;
  };
  const waitFor = async (expression, timeoutMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await evaluate(expression)) return true;
      await sleep(50);
    }
    return false;
  };
  const navigate = async url => { await call('Page.navigate', { url }); await waitFor("document.readyState === 'complete'", 10000); await sleep(250); };
  const viewport = async (width, height, mobile = width <= 768) => {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await call('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 1 });
  };
  const capture = async name => {
    const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    const targetPath = path.join(reportDir, 'screenshots', `${name}.png`);
    fs.writeFileSync(targetPath, Buffer.from(result.result.data, 'base64'));
    screenshots.push(path.relative(repo, targetPath).replaceAll('\\', '/'));
  };
  const click = async selector => {
    await evaluate(`(()=>{document.documentElement.style.scrollBehavior='auto';const e=document.querySelector(${JSON.stringify(selector)});if(e){e.scrollIntoView({block:'center',inline:'center',behavior:'auto'});e.focus({preventScroll:true})}return true})()`);
    await sleep(150);
    const rect = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e),points=[[.5,.5],[.15,.5],[.85,.5],[.5,.2],[.5,.8]].map(([x,y])=>({x:r.left+r.width*x,y:r.top+r.height*y})),hits=points.map(p=>({p,el:document.elementFromPoint(p.x,p.y)})),match=hits.find(x=>x.el&&(x.el===e||e.contains(x.el)));const hit=match?.el,atOrigin=document.elementFromPoint(10,10),chain=[];for(let n=e;n&&chain.length<6;n=n.parentElement){const cs=getComputedStyle(n),nr=n.getBoundingClientRect();chain.push({tag:n.tagName,class:String(n.className||'').slice(0,70),visibility:cs.visibility,pointerEvents:cs.pointerEvents,zIndex:cs.zIndex,rect:{x:nr.x,y:nr.y,w:nr.width,h:nr.height}})}return {x:match?.p.x??points[0].x,y:match?.p.y??points[0].y,width:r.width,height:r.height,disabled:e.disabled,inViewport:r.top>=0&&r.bottom<=innerHeight,hitTarget:!!match,hitTag:hit?.tagName||null,hitClass:hit?.className?.toString?.()||'',hitText:(hit?.innerText||'').slice(0,60),style:{visibility:s.visibility,pointerEvents:s.pointerEvents,opacity:s.opacity,display:s.display,zIndex:s.zIndex},chain,originHit:atOrigin?.tagName||null,innerWidth,innerHeight,visualViewport:{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,pageTop:visualViewport.pageTop},scrollY,top:r.top}})()`);
    if (!rect || rect.disabled || !rect.inViewport || !rect.hitTarget) return { ok: false, rect };
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    return { ok: true, rect };
  };
  const tap = async selector => {
    await evaluate(`(()=>{document.documentElement.style.scrollBehavior='auto';const e=document.querySelector(${JSON.stringify(selector)});if(e)e.scrollIntoView({block:'center',inline:'center',behavior:'auto'});return true})()`);
    await sleep(120);
    const rect = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height,disabled:e.disabled,inViewport:r.top>=0&&r.bottom<=innerHeight,hitTarget:!!hit&&(hit===e||e.contains(hit))}})()`);
    if (!rect || rect.disabled || !rect.inViewport) return { ok: false, rect };
    const point = { x: rect.x, y: rect.y, radiusX: 4, radiusY: 4, force: 1, id: 1 };
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await sleep(80);
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [point] });
    await sleep(80);
    return { ok: true, rect };
  };
  const key = async key => {
    const keyCode = key === 'Enter' ? 13 : 32;
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key === 'Enter' ? 'Enter' : 'Space', windowsVirtualKeyCode: keyCode });
    await call('Input.dispatchKeyEvent', { type: 'char', key: key === 'Enter' ? '\r' : ' ', text: key === 'Enter' ? '\r' : ' ' });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key === 'Enter' ? 'Enter' : 'Space', windowsVirtualKeyCode: keyCode });
  };

  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable'); await call('Log.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: "window.__discoveryQaSignals={};['toadal:daily-checkin-claimed','toadal:daily-chest-opened','toadal:portal-used'].forEach(name=>window.addEventListener(name,event=>{window.__discoveryQaSignals[name]={detail:event.detail||null,at:Date.now()}}));" });
  await viewport(1440, 900, false);
  await navigate(origin + basePath);
  check('Home progression loader completed', await waitFor('window.__toadalGuestProgressionLoaded === true'));
  check('Home discovery controller initialized', await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'"));
  check('Discovery controller script fetched', events.some(e => e.method === 'Network.responseReceived' && e.params.response.url.endsWith('/assets/js/home-interactive-discovery.js') && e.params.response.status === 200));

  const layouts = [[1440,900],[430,932],[390,844],[320,800]];
  for (const [width, height] of layouts) {
    await viewport(width, height, width <= 768);
    await navigate(origin + basePath);
    await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'");
    const layout = await evaluate(`(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,discovery:!!document.querySelector('[data-home-discovery]'),genies:[...document.querySelectorAll('.genie-row [data-discover-character]')].map(e=>{const r=e.getBoundingClientRect();return {id:e.getAttribute('data-discover-character'),role:e.getAttribute('role'),tabIndex:e.tabIndex,visible:e.getClientRects().length>0,width:r.width,height:r.height}}),portal:(()=>{const r=document.querySelector('[data-home-portal]')?.getBoundingClientRect();return r?{width:r.width,height:r.height}:null})(),daily:(()=>{const r=document.querySelector('[data-claim-daily]')?.getBoundingClientRect();return r?{width:r.width,height:r.height}:null})()}))()`);
    check(`Home layout ${width}x${height} has no horizontal overflow`, layout.scrollWidth <= layout.width + 1, layout);
    check(`Home layout ${width}x${height} keeps portal and daily controls usable`, Boolean(layout.portal && layout.portal.width >= 44 && layout.portal.height >= 44 && layout.daily && layout.daily.width >= 44 && layout.daily.height >= 44), layout);
    check(`Home layout ${width}x${height} shows three keyboard-ready Genie discoveries`, layout.genies.length === 3 && layout.genies.every(item => item.visible && item.role === 'button' && item.tabIndex === 0 && item.width >= 44 && item.height >= 44), layout.genies);
    await capture(`home-${width}x${height}`);
  }
  await viewport(390, 844, true);
  await navigate(origin + basePath);
  await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'");
  // The viewport matrix intentionally exercises the companion's responsive clamping.
  // Reset only this temporary browser profile to a safe, visible mobile location before
  // testing primary controls; this does not touch the user's browser or product defaults.
  await evaluate("localStorage.setItem('toadal:site:companion:position:v1',JSON.stringify({version:1,x:268,y:566}))");
  await call('Page.reload', { ignoreCache: true });
  await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'");
  const baseState = await evaluate(`(()=>({keys:Object.keys(localStorage).sort(),position:localStorage.getItem('toadal:site:companion:position:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1'),companionStyle:document.querySelector('[data-companion]')?.getAttribute('style')||'',pressed:document.querySelector('[data-home-candy="portal-candy"]')?.getAttribute('aria-pressed')}))()`);
  check('Companion exists once', await evaluate("document.querySelectorAll('[data-companion]').length === 1"));
  check('No standalone interaction localStorage key is introduced', await evaluate("!Object.keys(localStorage).some(k=>k.includes('home-interaction'))"));

  const imageAudit = await evaluate(`(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');const results=await Promise.all(imgs.map(async i=>{try{await i.decode();return i.naturalWidth>0?null:(i.currentSrc||i.src)}catch{return i.currentSrc||i.src}}));return results.filter(Boolean)})()`);
  check('Home image decode audit is clean', Array.isArray(imageAudit) && imageAudit.length === 0, imageAudit);
  const sweetFocus = await evaluate("(()=>{const e=document.querySelector('[data-discover-character=genie-sweet]');e?.scrollIntoView({block:'center',behavior:'instant'});e?.focus();return document.activeElement===e})()");
  check('Sweet Genie artwork discovery supports keyboard focus', sweetFocus);
  await key('Enter');
  check('Sweet Genie discovery saves through the existing browser-local collection', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').items.includes('character-artwork-genie-sweet')"));
  const savouryClick = await click('[data-discover-character=genie-savoury]');
  check('Savoury Genie artwork discovery responds to pointer activation', savouryClick.ok, savouryClick);
  check('Savoury Genie discovery saves through the existing browser-local collection', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').items.includes('character-artwork-genie-savoury')"));
  const fruityTap = await tap('[data-discover-character=genie-fruity]');
  check('Fruity Genie artwork discovery responds to mobile touch', fruityTap.ok, fruityTap);
  check('Fruity Genie discovery saves through the existing browser-local collection', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').items.includes('character-artwork-genie-fruity')"));
  const genieSaved = await evaluate(`(()=>({items:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').items.filter(id=>id.startsWith('character-artwork-genie-')),statuses:[...document.querySelectorAll('.genie-row [data-character-discovery-status]')].map(e=>e.textContent.trim()),keys:Object.keys(localStorage).sort(),buttons:[...document.querySelectorAll('.genie-row [data-discover-character]')].map(e=>e.getAttribute('aria-disabled'))}))()`);
  check('All three Genies report saved discoveries without adding another progression key', genieSaved.items.length === 3 && genieSaved.statuses.every(text => text === 'Discovered in this browser') && genieSaved.buttons.every(value => value === 'true') && !genieSaved.keys.some(key => key.includes('genie')), genieSaved);
  await capture('home-genies-discovered');
  await navigate(origin + basePath);
  const geniesAfterReload = await evaluate(`(()=>({statuses:[...document.querySelectorAll('.genie-row [data-character-discovery-status]')].map(e=>e.textContent.trim()),disabled:[...document.querySelectorAll('.genie-row [data-discover-character]')].map(e=>e.getAttribute('aria-disabled'))}))()`);
  check('Genie discoveries persist after reload in the existing guest collection', geniesAfterReload.statuses.length === 3 && geniesAfterReload.statuses.every(text => text === 'Discovered in this browser') && geniesAfterReload.disabled.every(value => value === 'true'), geniesAfterReload);
    await evaluate("document.querySelector('[data-home-discovery]').scrollIntoView({block:'start',behavior:'instant'})"); await sleep(250);
  check('Golden Block lazy sprite loaded', await waitFor("document.querySelector('[data-golden-block-art]')?.dataset.spriteLoaded === 'true'"));
  check('Daily chest lazy sprite loaded', await waitFor("document.querySelector('[data-daily-chest-art]')?.dataset.spriteLoaded === 'true'"));

  const companionBefore = await evaluate(`(()=>({position:localStorage.getItem('toadal:site:companion:position:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1'),style:document.querySelector('[data-companion]')?.getAttribute('style')||''}))()`);
  const dailyTap = await tap('[data-claim-daily]');
  check('Daily check-in control receives mobile touch activation', dailyTap.ok, dailyTap);
  check('Daily check-in uses the UTC daily claim', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:quests')||'{}').dailyClaimedPeriod === new Date().toISOString().slice(0,10)"));
  await waitFor("document.querySelector('[data-daily-chest-art]')?.dataset.chestOpen === 'true'", 5000);
  const dailyAfter = await evaluate(`(()=>({quests:localStorage.getItem('toadal:web:v1:quests'),pass:localStorage.getItem('toadal:web:v1:feast-pass'),label:document.querySelector('[data-daily-claim-label]')?.textContent,disabled:document.querySelector('[data-claim-daily]')?.disabled,opened:document.querySelector('[data-daily-chest-art]')?.dataset.chestOpen,position:localStorage.getItem('toadal:site:companion:position:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1'),keys:Object.keys(localStorage).sort()}))()`);
  const dailySignals = await evaluate('window.__discoveryQaSignals');
  check('Daily chest opens from the existing successful claim', dailyAfter.opened === 'true' && Boolean(dailySignals['toadal:daily-checkin-claimed']) && Boolean(dailySignals['toadal:daily-chest-opened']), { dailyAfter, dailySignals });
  check('Daily check-in leaves the companion position/minimized state intact', dailyAfter.position === companionBefore.position && dailyAfter.minimized === companionBefore.minimized, { before: companionBefore, after: dailyAfter });
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1 });
  const claimSnapshot = { quests: dailyAfter.quests, pass: dailyAfter.pass };
  await tap('[data-claim-daily]');
  const dailySecond = await evaluate(`({quests:localStorage.getItem('toadal:web:v1:quests'),pass:localStorage.getItem('toadal:web:v1:feast-pass')})`);
  check('Second daily click is idempotent', dailySecond.quests === claimSnapshot.quests && dailySecond.pass === claimSnapshot.pass, dailySecond);
  check('Daily claim creates no standalone feature key', dailyAfter.keys.every(k => ['toadal:web:v1:discoveries','toadal:web:v1:quests','toadal:web:v1:feast-pass','toadal:web:v1:profile','toadal:site:companion:position:v1','toadal:site:companion:minimized:v1'].includes(k)), dailyAfter.keys);

  const blueFocus = await evaluate("(()=>{const e=document.querySelector('[data-home-candy=portal-candy]');e.scrollIntoView({block:'center'});e.focus();return document.activeElement===e})()");
  check('Blue candy supports keyboard focus', blueFocus);
  await key('Enter');
  check('Blue candy activates by keyboard and persists', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction.candies.includes('portal-candy')"));
  await capture('home-blue-candy-found');

  const greenTap = await tap('[data-home-candy=lower-page-candy]');
  check('Green candy receives touch activation at mobile width', greenTap.ok, greenTap);
  check('Green candy collects from real touch input', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction.candies.includes('lower-page-candy')"));
  const blockBefore = await evaluate("document.querySelector('[data-home-candy=golden-block-candy]')?.closest('[data-home-candy-reveal]')?.hidden === true");
  check('Third candy is hidden before Golden Block completion', blockBefore);
  const companionBeforeBlock = await evaluate(`(()=>({position:localStorage.getItem('toadal:site:companion:position:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1')}))()`);
  let hitCount = 0;
  for (let hit = 1; hit <= 4; hit += 1) {
    const result = await tap('[data-golden-block-hit]');
    check(`Golden Block hit ${hit} receives touch input`, result.ok, result);
    const completed = await waitFor(`(()=>{const b=document.querySelector('[data-golden-block-hit]');return b?.dataset.animating==='false' && JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction.goldenBlock.hits===${hit}})()`, 10000);
    check(`Golden Block hit ${hit} advances and animation settles`, completed);
    hitCount += 1;
    if (hit === 4) await sleep(100);
  }
  const blockState = await evaluate(`(()=>({state:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction,frame:document.querySelector('[data-golden-block-art]')?.dataset.spriteFrame,revealed:!document.querySelector('[data-home-candy-reveal]')?.hidden,events:(()=>window.__goldenBlockEvents||0)(),position:localStorage.getItem('toadal:site:companion:position:v1'),minimized:localStorage.getItem('toadal:site:companion:minimized:v1')}))()`);
  check('Exactly four deliberate hits complete one Golden Block', hitCount === 4 && blockState.state.goldenBlock.hits === 4 && blockState.state.goldenBlock.complete === true && blockState.revealed && blockState.frame === '24', blockState);
  check('Golden Block did not change companion position/minimized state', blockState.position === companionBeforeBlock.position && blockState.minimized === companionBeforeBlock.minimized, { before: companionBeforeBlock, after: blockState });
  check('Only the expected existing progression keys are present', blockState && await evaluate("Object.keys(localStorage).every(k=>['toadal:web:v1:discoveries','toadal:web:v1:quests','toadal:web:v1:feast-pass','toadal:web:v1:profile','toadal:site:companion:position:v1','toadal:site:companion:minimized:v1'].includes(k))"));
  await capture('home-golden-block-broken');
  const purpleTap = await tap('[data-home-candy=golden-block-candy]');
  check('Purple candy receives touch input only after reveal', purpleTap.ok, purpleTap);
  check('Purple candy is manually collected and saved', await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction.candies.includes('golden-block-candy')"));
  const persisted = await evaluate(`(()=>({candies:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')).homeInteraction.candies,block:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')).homeInteraction.goldenBlock}))()`);
  check('Exactly three candies are collected', persisted.candies.length === 3 && new Set(persisted.candies).size === 3, persisted);
  await capture('home-three-candies-collected');
  await navigate(origin + basePath);
  const afterReload = await evaluate(`(()=>({candies:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')).homeInteraction.candies,block:JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')).homeInteraction.goldenBlock,found:[...document.querySelectorAll('[data-home-candy]')].filter(e=>e.disabled).length}))()`);
  check('Three candy discoveries and four block hits persist after reload', afterReload.candies.length === 3 && afterReload.block.hits === 4 && afterReload.found === 3, afterReload);

  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate("localStorage.removeItem('toadal:web:v1:discoveries');localStorage.removeItem('toadal:web:v1:quests');localStorage.removeItem('toadal:web:v1:feast-pass')");
  await navigate(origin + basePath);
  await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'");
  await viewport(390, 844, true);
  await evaluate("document.querySelector('[data-home-discovery]').scrollIntoView({block:'start'})"); await sleep(200);
  const reducedTap = await tap('[data-golden-block-hit]');
  check('Reduced-motion Golden Block accepts touch', reducedTap.ok, reducedTap);
  await waitFor("JSON.parse(localStorage.getItem('toadal:web:v1:discoveries')||'{}').homeInteraction.goldenBlock.hits===1");
  const reducedResult = await evaluate("({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,frame:document.querySelector('[data-golden-block-art]')?.dataset.spriteFrame,animations:document.querySelector('[data-golden-block-art]')?.getAnimations().length||0,animating:document.querySelector('[data-golden-block-hit]')?.dataset.animating})");
  check('Reduced-motion mode jumps to the hit frame without animating', reducedResult.reduced && reducedResult.frame === '9' && reducedResult.animations === 0 && reducedResult.animating === 'false', reducedResult);

  await call('Emulation.setEmulatedMedia', { features: [] });
  await viewport(390, 844, true);
  await navigate(origin + basePath);
  await evaluate("localStorage.setItem('toadal:site:companion:position:v1',JSON.stringify({version:1,x:268,y:566}))");
  await call('Page.reload', { ignoreCache: true });
  await waitFor("document.querySelector('[data-home-discovery]')?.dataset.interactionReady === 'true'");
  const portalPositionBefore = await evaluate('history.length');
  const portalFocus = await evaluate("(()=>{const e=document.querySelector('[data-home-portal]');e.scrollIntoView({block:'center',behavior:'auto'});e.focus();return document.activeElement===e})()");
  check('Surprise Me supports keyboard focus', portalFocus);
  const portal = await tap('[data-home-portal]');
  check('Surprise Me receives real mobile touch activation', portal.ok, portal);
  const portalState = await evaluate(`(()=>({path:location.pathname,portal:document.querySelector('[data-home-portal]')?.dataset.portalState,disabled:document.querySelector('[data-home-portal]')?.disabled,busy:document.querySelector('[data-home-portal]')?.getAttribute('aria-busy'),status:document.querySelector('[data-portal-status]')?.textContent,signal:window.__discoveryQaSignals['toadal:portal-used']||null,history:history.length}))()`);
  process.stdout.write(`PORTAL_STATE ${JSON.stringify(portalState)}\n`);
  await capture('home-portal-opening');
  const navigated = await waitFor(`location.pathname !== ${JSON.stringify(basePath)}`, 8000);
  const destination = await evaluate('location.pathname');
  check('Surprise Me navigates to a curated same-origin destination', navigated && ['/characters/','/world/','/feast-pass/','/play/'].some(route => destination === basePath.slice(0,-1)+route), { destination, portalState });
  const history = await call('Page.getNavigationHistory');
  const currentIndex = history.result.currentIndex;
  const previousEntry = history.result.entries[currentIndex - 1]?.url || '';
  check('Portal navigation preserves normal browser history', previousEntry.startsWith(origin + basePath) && (await evaluate('history.length')) >= portalPositionBefore, { previousEntry, length: await evaluate('history.length'), portalState });

  const browserErrors = events.filter(e =>
    (e.method === 'Network.responseReceived' && e.params.response.status >= 400 && !String(e.params.response.url).endsWith('/favicon.ico')) ||
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
  ).map(e => ({ method: e.method, detail: e.params?.response ? { status: e.params.response.status, url: e.params.response.url } : e.params?.entry?.text || e.params?.exceptionDetails?.text || 'runtime error' }));
  check('No browser request/console/runtime errors', browserErrors.length === 0, browserErrors);

  const report = {
    generatedAt: new Date().toISOString(), basePath, origin, renderedDist: dist,
    status: failures.length ? 'FAIL' : 'PASS', checkCount: checks.length,
    passed: checks.filter(item => item.status === 'PASS').length, failed: failures,
    checks, screenshots, browserErrors, persistence: { initial: baseState, afterDaily: dailyAfter, afterReload, reducedMotion: reducedResult },
    conclusion: 'All interactions are browser-local, gated and score-free; no game score or companion position/minimized key is written by discovery actions.'
  };
  fs.writeFileSync(path.join(reportDir, 'interactive-discovery-browser-qa.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ status: report.status, checkCount: report.checkCount, passed: report.passed, failed: failures, screenshots }, null, 2) + '\n');
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error(error?.stack || error);
  try {
    fs.writeFileSync(path.join(reportDir, 'interactive-discovery-browser-qa.partial.json'), JSON.stringify({ generatedAt: new Date().toISOString(), status: 'BLOCKED', error: error?.stack || String(error), checks, failures, screenshots }, null, 2) + '\n');
  } catch {}
  process.exitCode = 1;
} finally {
  if (ws && ws.readyState === WebSocket.OPEN) ws.close();
  try {
    if (process.platform === 'win32' && chrome.pid) execFileSync('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    else chrome.kill();
  } catch { chrome.kill(); }
  await sleep(250);
  await new Promise(resolve => server.close(() => { serverClosed = true; resolve(); }));
  const tempBase = path.resolve(os.tmpdir()) + path.sep;
  if (profile.startsWith(tempBase) && path.basename(profile).startsWith('toadal-discovery-qa-')) {
    try { fs.rmSync(profile, { recursive: true, force: true }); }
    catch (error) { console.warn(`Could not remove this run's temporary Chrome profile (${error.code}); left it in place: ${profile}`); }
  }
  if (!serverClosed) server.close();
}
