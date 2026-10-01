#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';

const root = path.resolve(process.argv[2] || '.');
const dist = path.resolve(root, process.argv[3] || 'dist');
const basePath = process.argv[4] || '/toadal-feast-web/';
const evidenceDir = path.resolve(root, process.argv[5] || 'docs/review/owner-visual-closure-20261001');
const storageKey = 'toadal:site:companion:minimized:v1';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const mime = file => ({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
}[path.extname(file).toLowerCase()] || 'application/octet-stream');

function assert(ok, message) {
  if (!ok) throw new Error(message);
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (!pathname.startsWith(basePath)) { res.writeHead(404).end('not found'); return; }
  const relative = decodeURIComponent(pathname.slice(basePath.length)).replace(/^\/+/, '');
  let file = path.resolve(dist, relative);
  if (file !== dist && !file.startsWith(dist + path.sep)) { res.writeHead(403).end('forbidden'); return; }
  if (pathname.endsWith('/') || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': mime(file), 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

await fs.promises.mkdir(evidenceDir, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const chromeCandidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const chromePath = chromeCandidates.find(file => fs.existsSync(file));
assert(chromePath, 'Chrome executable not found (set CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-owner-visual-'));
let chrome;
let ws;
const results = { schema: 'toadal-feast.owner-visual-closure-browser-qa.v1', basePath, captures: [], checks: {} };

async function freePort() {
  const probe = http.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}

try {
  const debugPort = await freePort();
  chrome = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let target;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      target = list.find(item => item.type === 'page');
      if (target) break;
    } catch { /* Chrome is still starting. */ }
    await sleep(100);
  }
  assert(target, 'Chrome DevTools page target did not become available.');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`${waiter.method}: ${JSON.stringify(message.error)}`));
      else waiter.resolve(message);
    }
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text || 'Browser evaluation failed.');
    return response.result.result.value;
  };
  const waitFor = async (expression, timeoutMs = 2500) => {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      const result = await evaluate(expression);
      if (result) return result;
      await sleep(50);
    }
    return null;
  };
  const navigate = async (route, width, height, mobile = width <= 768) => {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await call('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 1 });
    const targetUrl = origin + basePath + route.replace(/^\//, '');
    await call('Page.navigate', { url: targetUrl });
    assert(await waitFor(`location.href === ${JSON.stringify(targetUrl)} && document.readyState === 'complete'`), `Navigation did not complete at ${targetUrl}.`);
    await sleep(180);
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)});`);
    await call('Page.reload', { ignoreCache: true });
    assert(await waitFor(`location.href === ${JSON.stringify(targetUrl)} && document.readyState === 'complete'`), `Reload did not complete at ${targetUrl}.`);
    await sleep(220);
  };
  const capture = async (name, description) => {
    const response = await call('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    const bytes = Buffer.from(response.result.data, 'base64');
    const file = path.join(evidenceDir, name);
    fs.writeFileSync(file, bytes);
    results.captures.push({ file: path.relative(root, file).replaceAll(path.sep, '/'), bytes: bytes.length, description });
  };
  const scrollState = async (y) => {
    await evaluate(`window.scrollTo(0, ${Math.round(y)}); true`);
    await sleep(80);
    return evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),image=root?.querySelector('[data-companion-image]');if(!root||!button||!image)return null;const r=button.getBoundingClientRect(),s=getComputedStyle(root);return {scrollY,position:s.position,rect:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},image:!!image.currentSrc,within:r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1};})()`);
  };
  const criticalOverlap = async () => evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]');if(!button)return null;const a=button.getBoundingClientRect();const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};const rectRatio=r=>{const w=Math.max(0,Math.min(a.right,r.right)-Math.max(a.left,r.left)),h=Math.max(0,Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top));return w*h/Math.max(1,r.width*r.height);};const controls=[...document.querySelectorAll('a[href],button,input,select,textarea,[role="button"]')].filter(e=>!root.contains(e)&&visible(e)).map(e=>({text:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('placeholder')||'').trim().slice(0,90),ratio:rectRatio(e.getBoundingClientRect())})).filter(x=>x.ratio>.05);const copy=[...document.querySelectorAll('h1,h2,h3,p,.section-heading,.section-lede,.detail-breadcrumb,nav[aria-label="Breadcrumb"]')].filter(e=>!root.contains(e)&&visible(e)).map(e=>{const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()];return {text:(e.innerText||e.textContent||'').trim().slice(0,90),ratio:Math.max(0,...rects.map(rectRatio))};}).filter(x=>x.ratio>.05);return {controls,copy};})()`);

  await call('Page.enable');
  await call('Runtime.enable');

  const viewportCaptures = [
    { route: '/', width: 1440, height: 900, file: 'home-1440x900.png', desc: 'Home desktop' },
    { route: '/', width: 320, height: 800, file: 'home-320x800.png', desc: 'Home narrow mobile (layout inspection)' },
    { route: '/', width: 390, height: 844, file: 'home-390x844.png', desc: 'Home mobile' },
    { route: '/', width: 430, height: 932, file: 'home-430x932.png', desc: 'Home large mobile' },
    { route: '/play/', width: 320, height: 800, file: 'play-320x800.png', desc: 'Play mobile' }
  ];
  for (const item of viewportCaptures) {
    await navigate(item.route, item.width, item.height);
    const companion = await evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),image=root?.querySelector('[data-companion-image]');if(!root||!button||!image)return null;const r=button.getBoundingClientRect();return {position:getComputedStyle(root).position,visible:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight,width:r.width,height:r.height,imageVisible:image.complete&&image.naturalWidth>0};})()`);
    assert(companion && companion.position === 'fixed' && companion.visible && companion.imageVisible, `${item.desc}: Toadal is not a visible fixed viewport companion.`);
    const minCompanionWidth = item.width <= 360 ? 68 : item.width <= 760 ? 78 : 92;
    assert(companion.width >= minCompanionWidth, `${item.desc}: Toadal helper is too small (${companion.width}px; minimum ${minCompanionWidth}px).`);
    results.checks[`visible-${item.width}`] = companion;
    await capture(item.file, item.desc);
    if (item.route === '/') {
      const heroGeometry = await evaluate(`(()=>{const art=document.querySelector('.home-hero__toadal img'),actions=[...document.querySelectorAll('.home-hero .home-actions a')];if(!art||!actions.length||!art.complete||!art.naturalWidth)return null;const a=art.getBoundingClientRect(),canvas=document.createElement('canvas');canvas.width=art.naturalWidth;canvas.height=art.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(art,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;return {art:{x:a.x,y:a.y,right:a.right,bottom:a.bottom,width:a.width,height:a.height},actions:actions.map(e=>{const r=e.getBoundingClientRect(),l=Math.max(a.left,r.left),t=Math.max(a.top,r.top),right=Math.min(a.right,r.right),bottom=Math.min(a.bottom,r.bottom);let opaqueOverlapPixels=0;if(right>l&&bottom>t){const x0=Math.max(0,Math.floor((l-a.left)*art.naturalWidth/a.width)),x1=Math.min(art.naturalWidth,Math.ceil((right-a.left)*art.naturalWidth/a.width)),y0=Math.max(0,Math.floor((t-a.top)*art.naturalHeight/a.height)),y1=Math.min(art.naturalHeight,Math.ceil((bottom-a.top)*art.naturalHeight/a.height));for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*art.naturalWidth+x)*4+3]>32)opaqueOverlapPixels++;}return {text:e.innerText.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom,opaqueOverlapPixels};})};})()`);
      assert(heroGeometry, `${item.desc}: missing Home hero art or actions.`);
      results.checks[`hero-geometry-${item.width}`] = heroGeometry;
      assert(heroGeometry.actions.every(action => action.opaqueOverlapPixels === 0), `${item.desc}: hero character visibly intersects a primary action: ${JSON.stringify(heroGeometry.actions)}`);
    }
    const overlaps = await criticalOverlap();
    results.checks[`overlap-${item.width}`] = overlaps;
    assert(!overlaps.controls.length && !overlaps.copy.length, `${item.desc}: companion overlaps critical controls/copy: ${JSON.stringify(overlaps)}`);
  }

  for (const item of [
    { route: '/characters/toadal/', width: 390, height: 844, file: 'toadal-profile-390x844.png', desc: 'Toadal profile mobile' },
    { route: '/search/', width: 1440, height: 900, file: 'search-1440x900.png', desc: 'Search desktop' },
    { route: '/search/', width: 390, height: 844, file: 'search-390x844.png', desc: 'Search mobile' },
    { route: '/contact/', width: 390, height: 844, file: 'contact-390x844.png', desc: 'Contact mobile' }
  ]) {
    await navigate(item.route, item.width, item.height);
    const state = await evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),image=root?.querySelector('[data-companion-image]'),rect=button?.getBoundingClientRect();return {path:location.pathname,title:document.title,overflow:document.documentElement.scrollWidth>innerWidth,companionFixed:!!root&&getComputedStyle(root).position==='fixed',companionLoaded:!!image&&image.complete&&image.naturalWidth>0,buttonVisible:!!rect&&rect.bottom>0&&rect.top<innerHeight,buttonWidth:rect?.width??0};})()`);
    assert(state.path === basePath + item.route.replace(/^\//, '') && !state.overflow && state.companionFixed && state.companionLoaded && state.buttonVisible, `${item.desc}: route or layout integrity check failed: ${JSON.stringify(state)}`);
    const minRouteWidth = item.width <= 360 ? 68 : item.width <= 760 ? 78 : 92;
    assert(state.buttonWidth >= minRouteWidth, `${item.desc}: contextual Toadal is too small (${state.buttonWidth}px; minimum ${minRouteWidth}px).`);
    await capture(item.file, item.desc);
    const overlaps = await criticalOverlap();
    results.checks[`route-${item.route}-${item.width}`] = { ...state, overlaps };
    assert(!overlaps.controls.length && !overlaps.copy.length, `${item.desc}: companion overlaps critical controls/copy: ${JSON.stringify(overlaps)}`);
  }

  for (const device of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }, { name: 'large-mobile', width: 430, height: 932 }]) {
    await navigate('/', device.width, device.height);
    const page = await evaluate('document.documentElement.scrollHeight');
    assert(page > device.height * 1.5, `Home is not long enough to verify scrolled persistence at ${device.name}.`);
    const positions = [0, Math.round((page - device.height) * .55), Math.max(0, page - device.height)];
    const states = [], overlapsAtPosition = [];
    for (const y of positions) {
      states.push(await scrollState(y));
      overlapsAtPosition.push(await criticalOverlap());
    }
    const first = states[0].rect;
    const stable = states.every(state => state && state.position === 'fixed' && state.within && Math.abs(state.rect.x - first.x) < 2 && Math.abs(state.rect.y - first.y) < 2);
    results.checks[`scroll-${device.name}`] = { scrollHeight: page, states, overlapsAtPosition, stable };
    assert(stable, `Toadal did not remain fixed/visible through ${device.name} scroll positions.`);
    assert(overlapsAtPosition.every(overlaps => !overlaps.controls.length && !overlaps.copy.length), `Toadal overlaps controls/copy at a ${device.name} scroll position: ${JSON.stringify(overlapsAtPosition)}`);
    const middle = states[1];
    await evaluate(`window.scrollTo(0, ${middle.scrollY}); true`);
    await sleep(100);
    await capture(`companion-scroll-${device.name}.png`, `Toadal remains fixed while Home is scrolled (${device.name}).`);
    results.checks[`scroll-overlap-${device.name}`] = overlapsAtPosition[1];
  }

  await navigate('/', 1440, 900, false);
  const worldTarget = await evaluate(`(()=>{const e=document.querySelector('.site-links a[href$="/world/"]');if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  assert(worldTarget, 'Could not find the semantic World navigation target for reaction verification.');
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: worldTarget.x, y: worldTarget.y });
  const worldReaction = await waitFor(`(()=>{const r=document.querySelector('[data-companion]'),i=r?.querySelector('[data-companion-image]');return r?.getAttribute('data-companion-current-reaction')==='curious'&&i?.getAttribute('src')?.includes('/companion/runtime-v1/world-map.webp')&&i.complete&&i.naturalWidth>0;})()`, 3000);
  results.checks.hoverReaction = { passed: !!worldReaction, reaction: await evaluate("document.querySelector('[data-companion]')?.getAttribute('data-companion-current-reaction')"), image: await evaluate("document.querySelector('[data-companion-image]')?.getAttribute('src')") };
  assert(worldReaction, `World hover did not produce the expected curious/map-guide reaction: ${JSON.stringify(results.checks.hoverReaction)}`);
  await capture('companion-reaction-world-hover.png', 'Real pointer hover on World nav changes Toadal reaction and artwork.');

  await navigate('/', 390, 844, true);
  const touchTarget = await evaluate(`(()=>{const e=document.querySelector('.discovery-card--world');if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  assert(await waitFor(`(()=>{const e=document.querySelector('.discovery-card--world'),r=e?.getBoundingClientRect();return !!r&&r.top>=0&&r.bottom<=innerHeight;})()`), 'World discovery card did not settle in the mobile viewport before touch input.');
  assert(touchTarget, 'Could not find the World discovery surface for touch reaction verification.');
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchTarget.x, y: touchTarget.y, radiusX: 3, radiusY: 3, force: 1, id: 1 }] });
  const touchReaction = await waitFor(`(()=>{const r=document.querySelector('[data-companion]'),i=r?.querySelector('[data-companion-image]');return r?.getAttribute('data-companion-current-reaction')==='curious'&&i?.getAttribute('src')?.includes('/companion/runtime-v1/world-map.webp')&&i.complete&&i.naturalWidth>0;})()`, 1200);
  await capture('companion-reaction-world-touch-390x844.png', 'Real browser touch on the World discovery card changes Toadal reaction and artwork.');
  // Current Chromium CDP schema requires 1..16 touchPoints even for touchEnd.
  // Preserve the active contact coordinates for its terminal event.
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: touchTarget.x, y: touchTarget.y, radiusX: 3, radiusY: 3, force: 1, id: 1 }] });
  results.checks.touchReaction = { passed: !!touchReaction, reaction: await evaluate("document.querySelector('[data-companion]')?.getAttribute('data-companion-current-reaction')"), image: await evaluate("document.querySelector('[data-companion-image]')?.getAttribute('src')") };
  assert(touchReaction, `World touch did not produce the expected curious/map-guide reaction: ${JSON.stringify(results.checks.touchReaction)}`);

  await navigate('/', 1440, 900, false);
  const before = await evaluate(`(()=>{const b=document.querySelector('[data-companion-toggle]');return {expanded:b?.getAttribute('aria-expanded'),hidden:document.querySelector('[data-companion-panel]')?.hidden,pref:localStorage.getItem(${JSON.stringify(storageKey)})};})()`);
  const buttonPoint = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: buttonPoint.x, y: buttonPoint.y });
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: buttonPoint.x, y: buttonPoint.y, button: 'left', clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: buttonPoint.x, y: buttonPoint.y, button: 'left', clickCount: 1 });
  await sleep(100);
  const toggled = await evaluate(`(()=>({expanded:document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded'),hidden:document.querySelector('[data-companion-panel]')?.hidden,pref:localStorage.getItem(${JSON.stringify(storageKey)}),imageVisible:!!document.querySelector('[data-companion-image]')?.currentSrc}))()`);
  assert(toggled.expanded === 'true' && toggled.hidden === false && toggled.pref === 'false' && toggled.imageVisible, `Companion restore control did not open/persist its panel: ${JSON.stringify({ before, toggled })}`);
  await call('Page.reload', { ignoreCache: true });
  await waitFor("document.readyState === 'complete'");
  await sleep(180);
  const persisted = await evaluate(`(()=>({expanded:document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded'),hidden:document.querySelector('[data-companion-panel]')?.hidden,pref:localStorage.getItem(${JSON.stringify(storageKey)}),imageVisible:!!document.querySelector('[data-companion-image]')?.currentSrc}))()`);
  assert(persisted.expanded === 'true' && persisted.hidden === false && persisted.pref === 'false' && persisted.imageVisible, `Companion panel preference failed to persist through reload: ${JSON.stringify(persisted)}`);
  results.checks.togglePersistence = { before, toggled, persisted };

  results.status = 'PASS';
} catch (error) {
  results.status = 'FAIL';
  results.error = String(error?.stack || error);
} finally {
  try { fs.writeFileSync(path.join(evidenceDir, 'owner-visual-closure-browser-qa.json'), JSON.stringify(results, null, 2) + '\n'); } catch { /* Preserve primary error. */ }
  try { ws?.close(); } catch {}
  try { chrome?.kill(); } catch {}
  await new Promise(resolve => server.close(resolve));
  if (profile.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Temporary browser profile can be removed later by the OS. */ }
  }
}

console.log(JSON.stringify(results, null, 2));
if (results.status !== 'PASS') process.exitCode = 1;
