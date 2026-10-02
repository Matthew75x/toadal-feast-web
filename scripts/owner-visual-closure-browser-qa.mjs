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
const positionStorageKey = 'toadal:site:companion:position:v1';
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
  const navigate = async (route, width, height, mobile = width <= 768, clearPreferences = true) => {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await call('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 1 });
    const targetUrl = origin + basePath + route.replace(/^\//, '');
    await call('Page.navigate', { url: targetUrl });
    assert(await waitFor(`location.href === ${JSON.stringify(targetUrl)} && document.readyState === 'complete'`), `Navigation did not complete at ${targetUrl}.`);
    await sleep(180);
    if (clearPreferences) await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)});localStorage.removeItem(${JSON.stringify(positionStorageKey)});`);
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
  const criticalOverlap = async () => evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]');if(!button)return null;const a=button.getBoundingClientRect();const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};const targets=[...document.querySelectorAll('.home-hero .home-actions a')].filter(visible);const overlap=targets.map(e=>{const r=e.getBoundingClientRect(),w=Math.max(0,Math.min(a.right,r.right)-Math.max(a.left,r.left)),h=Math.max(0,Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top));return {text:(e.innerText||'').trim(),ratio:w*h/Math.max(1,r.width*r.height)};}).filter(x=>x.ratio>.01);return {primaryCtaOverlap:overlap};})()`);

  await call('Page.enable');
  await call('Runtime.enable');

  const viewportCaptures = [
    { route: '/', width: 1440, height: 900, file: 'home-1440x900.png', desc: 'Home desktop' },
    { route: '/', width: 1366, height: 768, file: 'home-1366x768.png', desc: 'Home wide desktop' },
    { route: '/', width: 768, height: 1024, file: 'home-768x1024.png', desc: 'Home tablet' },
    { route: '/', width: 320, height: 800, file: 'home-320x800.png', desc: 'Home narrow mobile (layout inspection)' },
    { route: '/', width: 390, height: 844, file: 'home-390x844.png', desc: 'Home mobile' },
    { route: '/', width: 430, height: 932, file: 'home-430x932.png', desc: 'Home large mobile' },
    { route: '/play/', width: 320, height: 800, file: 'play-320x800.png', desc: 'Play mobile' }
  ];
  for (const item of viewportCaptures) {
    await navigate(item.route, item.width, item.height);
    const companion = await evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),image=root?.querySelector('[data-companion-image]');if(!root||!button||!image)return null;const r=button.getBoundingClientRect();return {position:getComputedStyle(root).position,visible:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight,width:r.width,height:r.height,imageVisible:image.complete&&image.naturalWidth>0};})()`);
    assert(companion && companion.position === 'fixed' && companion.visible && companion.imageVisible, `${item.desc}: Toadal is not a visible fixed viewport companion.`);
    const minCompanionWidth = item.width <= 360 ? 92 : item.width <= 760 ? 102 : 142;
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
    assert(!overlaps.primaryCtaOverlap.length, `${item.desc}: the first-use companion position obscures a primary Home CTA: ${JSON.stringify(overlaps)}`);
  }

  for (const item of [
    { route: '/characters/toadal/', width: 390, height: 844, file: 'toadal-profile-390x844.png', desc: 'Toadal profile mobile' },
    { route: '/', width: 1440, height: 900, file: 'home-app-arcade-1440x900.png', desc: 'Home App section with Arcade capture', selector: '.app-conversion-panel' },
    { route: '/app/', width: 1440, height: 900, file: 'app-arcade-gameplay-desktop.png', desc: 'App page Arcade gameplay lead' },
    { route: '/app/', width: 390, height: 844, file: 'app-arcade-gameplay-390x844.png', desc: 'App page Arcade gameplay mobile' },
    { route: '/app/', width: 390, height: 844, file: 'app-arcade-phone-390x844.png', desc: 'App page Arcade phone capture mobile', selector: '.app-product-phone' },
    { route: '/app/', width: 1440, height: 900, file: 'app-mode-captures-1440x900.png', desc: 'App mode capture gallery', selector: '.app-gameplay-section' },
    { route: '/app/', width: 390, height: 844, file: 'app-puzzle-golden-block-390x844.png', desc: 'Mobile Puzzle Golden Block concept art', selector: '#puzzle-abilities' },
    { route: '/characters/', width: 1366, height: 768, file: 'characters-gully-1366x768.png', desc: 'Characters page canonical Gully identity', selector: "img[src*='characters/gully.webp']" },
    { route: '/world/', width: 1366, height: 768, file: 'world-gully-1366x768.png', desc: 'World page canonical Gully identity', selector: "img[src*='characters/gully.webp']" },
    { route: '/media/', width: 1366, height: 768, file: 'media-gully-1366x768.png', desc: 'Media page canonical Gully identity', selector: "img[src*='characters/gully.webp']" },
    { route: '/games/froggy-fruity-bash/', width: 1366, height: 768, file: 'fruity-bash-candy-shooter-1366x768.png', desc: 'Fruity Bash Candy Shooter concept (not gameplay)', selector: "img[src*='candy-shooter-fruity-bash.webp']" },
    { route: '/games/wicked-bites/', width: 1366, height: 768, file: 'wicked-bites-real-gameplay-1366x768.png', desc: 'Wicked Bites real v5.5 gameplay capture', selector: "img[src*='wicked-bites-v5.5-preview.webp']" },
    { route: '/search/', width: 1440, height: 900, file: 'search-1440x900.png', desc: 'Search desktop' },
    { route: '/search/', width: 390, height: 844, file: 'search-390x844.png', desc: 'Search mobile' },
    { route: '/contact/', width: 390, height: 844, file: 'contact-390x844.png', desc: 'Contact mobile' }
  ]) {
    await navigate(item.route, item.width, item.height);
    await evaluate("Promise.all([...document.images].map(image=>{image.loading='eager';return image.decode().catch(()=>null)}))");
    if (item.minimizeCompanion !== false) {
      const expanded = await evaluate("document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')");
      if (expanded === 'true') await evaluate("document.querySelector('[data-companion-toggle]')?.click(); true");
      const minimized = await waitFor("document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='false' && document.querySelector('[data-companion-panel]')?.hidden");
      assert(minimized, `${item.desc}: companion did not remain minimized for an unobstructed content capture.`);
    }
    if (item.selector) {
      const found = await evaluate('(()=>{const node=document.querySelector(' + JSON.stringify(item.selector) + ');if(!node)return false;node.scrollIntoView({block:\'center\',behavior:\'instant\'});return true})()');
      assert(found, `${item.desc}: screenshot target was not found (${item.selector}).`);
      await sleep(180);
    }
    const state = await evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),panel=root?.querySelector('[data-companion-panel]'),image=root?.querySelector('[data-companion-image]'),rect=button?.getBoundingClientRect();return {path:location.pathname,title:document.title,overflow:document.documentElement.scrollWidth>innerWidth,companionFixed:!!root&&getComputedStyle(root).position==='fixed',companionLoaded:!!image&&image.complete&&image.naturalWidth>0,companionMinimized:button?.getAttribute('aria-expanded')==='false'&&panel?.hidden===true,buttonVisible:!!rect&&rect.bottom>0&&rect.top<innerHeight,buttonWidth:rect?.width??0};})()`);
    assert(state.path === basePath + item.route.replace(/^\//, '') && !state.overflow && state.companionFixed && state.companionLoaded && state.buttonVisible, `${item.desc}: route or layout integrity check failed: ${JSON.stringify(state)}`);
    const minRouteWidth = item.width <= 360 ? 92 : item.width <= 760 ? 102 : 142;
    assert(state.buttonWidth >= minRouteWidth, `${item.desc}: contextual Toadal is too small (${state.buttonWidth}px; minimum ${minRouteWidth}px).`);
    assert(state.companionMinimized, `${item.desc}: screenshot companion state was not minimized.`);
    await capture(item.file, item.desc);
    const overlaps = await criticalOverlap();
    results.checks[`route-${item.route}-${item.width}`] = { ...state, overlaps };
    if (item.route === '/' && item.selector === '.app-conversion-panel') {
      const layout = await evaluate(`(()=>{const pick=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {selector:s,rect:{x:r.x,y:r.y+scrollY,width:r.width,height:r.height,right:r.right,bottom:r.bottom+scrollY},display:c.display,gridColumn:c.gridColumn,gridRow:c.gridRow,minHeight:c.minHeight,maxHeight:c.maxHeight,overflow:c.overflow,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};const app=pick('#app'),next=pick('#whats-next'),today=pick('#today'),interactive=pick('#interactive-discovery'),discovery=pick('#discovery'),panel=pick('#app .app-conversion-panel'),candy=pick('#app .home-app-candy'),candyButton=pick('#app .home-app-candy .home-candy-button');const ordered=!!today&&!!interactive&&!!discovery&&!!app&&today.rect.bottom<=interactive.rect.y+2&&interactive.rect.bottom<=discovery.rect.y+2&&discovery.rect.bottom<=app.rect.y+2;const aligned=!!app&&!!next&&Math.abs(app.rect.y-next.rect.y)<=2;const candyVisible=!!panel&&!!candyButton&&candyButton.rect.height>0&&candyButton.rect.y>=panel.rect.y&&candyButton.rect.bottom<=panel.rect.bottom+2;return {today,interactive,discovery,app,next,panel,candy,candyButton,ordered,aligned,candyVisible}})()`);
      results.checks.homeAppLayout = layout;
      assert(layout.ordered && layout.aligned && layout.candyVisible, `Home desktop sections overlap or the green candy is clipped: ${JSON.stringify(layout)}`);
    }
    assert(!overlaps.primaryCtaOverlap.length, `${item.desc}: the first-use companion position obscures a primary Home CTA: ${JSON.stringify(overlaps)}`);
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
    assert(overlapsAtPosition.every(overlaps => !overlaps.primaryCtaOverlap.length), `Toadal overlaps a visible primary Home CTA at a ${device.name} scroll position: ${JSON.stringify(overlapsAtPosition)}`);
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

  const geometry = async () => evaluate(`(()=>{const root=document.querySelector('[data-companion]'),button=root?.querySelector('[data-companion-toggle]'),r=root?.getBoundingClientRect(),b=button?.getBoundingClientRect();return root&&button?{x:Number(root.getAttribute('data-position-x')),y:Number(root.getAttribute('data-position-y')),width:r.width,height:r.height,button:{x:b.x,y:b.y,width:b.width,height:b.height},minimized:localStorage.getItem(${JSON.stringify(storageKey)}),reaction:root.getAttribute('data-companion-current-reaction'),dragging:root.getAttribute('data-dragging'),saved:JSON.parse(localStorage.getItem(${JSON.stringify(positionStorageKey)})||'null'),overflow:document.documentElement.scrollWidth>innerWidth}:null})()`);
  const dragMouseTo = async (targetX, targetY) => {
    const start = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect(),root=document.querySelector('[data-companion]').getBoundingClientRect(),v={x:r.x+r.width*.55,y:r.y+r.height*.5,offsetX:r.x+r.width*.55-root.x,offsetY:r.y+r.height*.5-root.y};window.__companionQaLastDragStart=v;return v})()`);
    const end = { x: targetX + start.offsetX, y: targetY + start.offsetY };
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', buttons: 1, clickCount: 1 });
    for (let i = 1; i <= 3; i += 1) {
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x + (end.x - start.x) * i / 3, y: start.y + (end.y - start.y) * i / 3, button: 'left', buttons: 1 });
    }
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', buttons: 0, clickCount: 1 });
    await sleep(80);
  };
  const dragTouchTo = async (targetX, targetY, id = 7) => {
    const start = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect(),root=document.querySelector('[data-companion]').getBoundingClientRect();return {x:r.x+r.width*.55,y:r.y+r.height*.5,offsetX:r.x+r.width*.55-root.x,offsetY:r.y+r.height*.5-root.y};})()`);
    const end = { x: targetX + start.offsetX, y: targetY + start.offsetY };
    const point = (x, y) => ({ x: Math.round(x), y: Math.round(y), radiusX: 4, radiusY: 4, force: 1, id });
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start.x, start.y)] });
    for (let i = 1; i <= 4; i += 1) {
      await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(start.x + (end.x - start.x) * i / 4, start.y + (end.y - start.y) * i / 4)] });
    }
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [point(end.x, end.y)] });
    await sleep(100);
  };
  const tapTouch = async (id = 91) => {
    const start = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    const point = (x, y) => ({ x: Math.round(x), y: Math.round(y), radiusX: 4, radiusY: 4, force: 1, id });
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start.x, start.y)] });
    await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(start.x + 3, start.y + 2)] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [point(start.x + 3, start.y + 2)] });
    await sleep(120);
  };
  const dragViewports = [
    { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false, touchTarget: null },
    { name: 'large-mobile-430x932', width: 430, height: 932, mobile: true, touchTarget: null },
    { name: 'mobile-390x844', width: 390, height: 844, mobile: true, touchTarget: 'lower-left' },
    { name: 'narrow-mobile-320x800', width: 320, height: 800, mobile: true, touchTarget: 'upper-left' }
  ];
  const targetNames = ['upper-left', 'upper-right', 'lower-left', 'center'];
  const savedScreenNames = new Set(['desktop-1440x900:upper-left', 'large-mobile-430x932:upper-right', 'mobile-390x844:lower-left', 'narrow-mobile-320x800:center']);
  const dragResults = {};
  for (const view of dragViewports) {
    await navigate('/', view.width, view.height, view.mobile, true);
    if (view.width === 320) await evaluate(`(()=>{window.__companionQaPointerLog=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{if(e.target.closest?.('[data-companion]'))window.__companionQaPointerLog.push({type,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,button:e.button,x:e.clientX,y:e.clientY});},true);return true})()`);
    const firstUse = await geometry();
    const defaultX = view.width - firstUse.width - 12;
    const defaultY = Math.max(16, view.height - firstUse.height - 12 - 180);
    assert(Math.abs(firstUse.x - defaultX) <= 2 && Math.abs(firstUse.y - defaultY) <= 2 && firstUse.y >= view.height / 2, `${view.name}: first-use position is not in the bottom-right region: ${JSON.stringify(firstUse)}`);
    const targets = {
      'upper-left': { x: 16, y: 16 },
      'upper-right': { x: view.width - firstUse.width - 16, y: 16 },
      'lower-left': { x: 16, y: view.height - firstUse.height - 16 },
      center: { x: Math.round((view.width - firstUse.width) / 2), y: Math.round((view.height - firstUse.height) / 2) }
    };
    const steps = [];
    const orderedTargets = view.touchTarget ? targetNames.filter(name => name !== view.touchTarget).concat(view.touchTarget) : targetNames;
    for (const name of orderedTargets) {
      const target = targets[name];
      const stateBeforeDrag = await geometry();
      if (name === view.touchTarget) await dragTouchTo(target.x, target.y, 11 + view.width);
      else await dragMouseTo(target.x, target.y);
      const after = await geometry();
      assert(Math.abs(after.x - target.x) <= 2 && Math.abs(after.y - target.y) <= 2, `${view.name}: ${name} drag did not land at requested position: ${JSON.stringify({target,after,pointerLog:view.width===320?await evaluate('window.__companionQaPointerLog'):undefined,hit:view.width===320?await evaluate(`(()=>{const p=window.__companionQaLastDragStart,e=document.elementFromPoint(p.x,p.y),b=document.querySelector('[data-companion-toggle]'),r=b.getBoundingClientRect();return {start:p,target:e?.outerHTML?.slice(0,180),same:e===b||b.contains(e),button:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},hidden:document.querySelector('[data-companion-panel]').hidden,capture:b.hasPointerCapture(1)}})()`):undefined})}`);
      assert(after.saved?.version === 1 && after.saved.x === after.x && after.saved.y === after.y, `${view.name}: x/y storage did not follow the drag: ${JSON.stringify(after)}`);
      assert(after.minimized === stateBeforeDrag.minimized, `${view.name}: dragging changed minimize preference: ${JSON.stringify({before:stateBeforeDrag.minimized,after})}`);
      if (name === view.touchTarget) assert(after.reaction === stateBeforeDrag.reaction, `${view.name}: touch drag triggered a contextual tap reaction: ${JSON.stringify({before:stateBeforeDrag.reaction,after:after.reaction})}`);
      assert(!after.overflow && after.x >= 0 && after.y >= 0 && after.x + after.width <= view.width + 1 && after.y + after.height <= view.height + 1, `${view.name}: companion escaped safe viewport bounds: ${JSON.stringify(after)}`);
      if (name === view.touchTarget) await sleep(520);
      steps.push({ name, ...after });
      if (savedScreenNames.has(`${view.name}:${name}`)) {
        await capture(`companion-position-${view.name}-${name}.png`, `Toadal manually dragged to ${name} at ${view.name}.`);
      }
    }
    // A sub-threshold pointer gesture remains a click; a completed drag above did not toggle.
    const beforeTap = await geometry();
    if (view.mobile) await tapTouch(100 + view.width);
    else {
      const tapStart = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tapStart.x, y: tapStart.y });
      await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: tapStart.x, y: tapStart.y, button: 'left', clickCount: 1 });
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tapStart.x + 3, y: tapStart.y + 2, button: 'left', buttons: 1 });
      await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tapStart.x + 3, y: tapStart.y + 2, button: 'left', clickCount: 1 });
      await sleep(60);
    }
    const afterTap = await geometry();
    assert(afterTap.minimized !== beforeTap.minimized && afterTap.x === beforeTap.x && afterTap.y === beforeTap.y, `${view.name}: sub-threshold tap failed to toggle without moving: ${JSON.stringify({beforeTap,afterTap})}`);
    dragResults[view.name] = { firstUse: { x: firstUse.x, y: firstUse.y }, targets: steps, tap: { before: beforeTap.minimized, after: afterTap.minimized } };
  }
  results.checks.dragViewportMatrix = dragResults;

  const bubbleChecks = [];
  for (const name of targetNames) {
    await navigate('/', 1440, 900, false, true);
    const initial = await geometry();
    const target = {
      'upper-left': {x:16,y:16},
      'upper-right': {x:1440-initial.width-16,y:16},
      'lower-left': {x:16,y:900-initial.height-16},
      center: {x:Math.round((1440-initial.width)/2),y:Math.round((900-initial.height)/2)}
    }[name];
    await dragMouseTo(target.x,target.y);
    const beforeOpen = await geometry();
    await evaluate("document.querySelector('[data-companion-toggle]').click()");
    assert(await waitFor("document.querySelector('[data-companion-panel]')?.hidden === false"), `Speech bubble did not open at ${name}.`);
    await sleep(60);
    const bubble = await evaluate(`(()=>{const root=document.querySelector('[data-companion]'),p=root.querySelector('[data-companion-panel]'),r=p.getBoundingClientRect();return {hidden:p.hidden,placement:p.getAttribute('data-bubble-placement'),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},within:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};})()`);
    const afterOpen = await geometry();
    assert(!bubble.hidden && bubble.within && bubble.placement, `Speech bubble did not flip/clamp into the viewport at ${name}: ${JSON.stringify(bubble)}`);
    assert(afterOpen.x === beforeOpen.x && afterOpen.y === beforeOpen.y, `Opening the speech bubble moved Toadal at ${name}.`);
    bubbleChecks.push({name,position:{x:afterOpen.x,y:afterOpen.y},bubble});
  }
  results.checks.bubblePlacement = bubbleChecks;

  await navigate('/', 1440, 900, false, true);
  const cancelOrigin = await geometry();
  await evaluate("document.addEventListener('pointerdown',e=>window.__companionQaPointerId=e.pointerId,{capture:true,once:true})");
  const cancelStart = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cancelStart.x, y: cancelStart.y });
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: cancelStart.x, y: cancelStart.y, button: 'left', buttons: 1, clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cancelStart.x - 140, y: cancelStart.y - 100, button: 'left', buttons: 1 });
  await sleep(60);
  const duringCancelDrag = await geometry();
  assert(duringCancelDrag.dragging === 'true', `Pointer-cancel fixture did not enter a drag: ${JSON.stringify(duringCancelDrag)}`);
  await evaluate(`(()=>{const b=document.querySelector('[data-companion-toggle]');b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerId:window.__companionQaPointerId,pointerType:'mouse',isPrimary:true}));return true;})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cancelStart.x - 140, y: cancelStart.y - 100, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(80);
  const afterCancel = await geometry();
  assert((duringCancelDrag.x !== cancelOrigin.x || duringCancelDrag.y !== cancelOrigin.y) && afterCancel.x === cancelOrigin.x && afterCancel.y === cancelOrigin.y && afterCancel.dragging === null && afterCancel.minimized === cancelOrigin.minimized, `Pointer cancel did not restore/neutralize a moved drag: ${JSON.stringify({cancelOrigin,duringCancelDrag,afterCancel})}`);
  results.checks.pointerCancel = { origin: {x:cancelOrigin.x,y:cancelOrigin.y}, during: {x:duringCancelDrag.x,y:duringCancelDrag.y}, after: {x:afterCancel.x,y:afterCancel.y,dragging:afterCancel.dragging} };

  await evaluate("document.addEventListener('pointerdown',e=>window.__companionQaPointerId=e.pointerId,{capture:true,once:true})");
  const lostStart = await evaluate(`(()=>{const r=document.querySelector('[data-companion-toggle]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: lostStart.x, y: lostStart.y });
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: lostStart.x, y: lostStart.y, button: 'left', buttons: 1, clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: lostStart.x - 120, y: lostStart.y - 90, button: 'left', buttons: 1 });
  await sleep(50);
  const duringLostCapture = await geometry();
  await evaluate(`(()=>{const b=document.querySelector('[data-companion-toggle]'),id=window.__companionQaPointerId;if(b.hasPointerCapture(id))b.releasePointerCapture(id);return true;})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: lostStart.x - 120, y: lostStart.y - 90, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(80);
  const afterLostCapture = await geometry();
  assert((duringLostCapture.x !== cancelOrigin.x || duringLostCapture.y !== cancelOrigin.y) && afterLostCapture.x === cancelOrigin.x && afterLostCapture.y === cancelOrigin.y && afterLostCapture.dragging === null, `Lost pointer capture did not restore/neutralize a moved drag: ${JSON.stringify({cancelOrigin,duringLostCapture,afterLostCapture})}`);
  results.checks.lostPointerCapture = { before:{x:cancelOrigin.x,y:cancelOrigin.y}, during:{x:duringLostCapture.x,y:duringLostCapture.y}, after:{x:afterLostCapture.x,y:afterLostCapture.y,dragging:afterLostCapture.dragging} };

  const desktopGeometry = await geometry();
  await dragMouseTo(1440 - desktopGeometry.width - 12, 900 - desktopGeometry.height - 12);
  const beforeResize = await geometry();
  await call('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  assert(await waitFor(`(()=>{const r=document.querySelector('[data-companion]')?.getBoundingClientRect();return r&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`), 'Companion did not clamp into a 320x800 viewport after resize.');
  const afterResize = await geometry();
  assert(afterResize.x + afterResize.width <= 320 + 1 && afterResize.y + afterResize.height <= 800 + 1 && afterResize.saved?.x === afterResize.x && afterResize.saved?.y === afterResize.y, `Resize did not clamp and persist the companion: ${JSON.stringify({beforeResize,afterResize})}`);
  await call('Emulation.setDeviceMetricsOverride', { width: 800, height: 320, deviceScaleFactor: 1, mobile: true });
  await evaluate("window.dispatchEvent(new Event('orientationchange'))");
  assert(await waitFor(`(()=>{const r=document.querySelector('[data-companion]')?.getBoundingClientRect();return r&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`), 'Companion did not clamp into an 800x320 orientation viewport.');
  const afterOrientation = await geometry();
  assert(afterOrientation.x + afterOrientation.width <= 800 + 1 && afterOrientation.y + afterOrientation.height <= 320 + 1 && afterOrientation.saved?.x === afterOrientation.x && afterOrientation.saved?.y === afterOrientation.y, `Orientation change did not clamp and persist the companion: ${JSON.stringify(afterOrientation)}`);
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const reducedMotion = await evaluate(`(()=>{const i=document.querySelector('[data-companion-image]'),s=getComputedStyle(i);return {transition:s.transitionDuration.split(',').map(v=>parseFloat(v)),animation:s.animationName}})()`);
  assert(reducedMotion.transition.every(value => value <= 0.00002) && reducedMotion.animation === 'none', `Reduced-motion preference is not honored: ${JSON.stringify(reducedMotion)}`);
  await call('Emulation.setEmulatedMedia', { features: [] });
  results.checks.resizeOrientationAndReducedMotion = { beforeResize:{x:beforeResize.x,y:beforeResize.y}, afterResize:{x:afterResize.x,y:afterResize.y}, afterOrientation:{x:afterOrientation.x,y:afterOrientation.y}, reducedMotion };

  await navigate('/', 1440, 900, false, true);
  await dragMouseTo(16, 16);
  const manuallyMoved = await geometry();
  await call('Page.reload', { ignoreCache: true });
  assert(await waitFor(`document.readyState === 'complete' && document.querySelector('[data-position-ready="true"]')`), 'Position controller did not initialize after reload.');
  await sleep(160);
  const afterReload = await geometry();
  assert(afterReload.x === manuallyMoved.x && afterReload.y === manuallyMoved.y, `Dragged x/y did not persist through reload: ${JSON.stringify({manuallyMoved,afterReload})}`);
  await evaluate('window.scrollTo(0, 340)');
  await sleep(100);
  const afterManualScroll = await geometry();
  assert(afterManualScroll.x === afterReload.x && afterManualScroll.y === afterReload.y && await evaluate("getComputedStyle(document.querySelector('[data-companion]')).position") === 'fixed', `Scrolling after a manual placement moved the companion: ${JSON.stringify({afterReload,afterManualScroll})}`);
  results.checks.manualPositionSurvivesScroll = { before:{x:afterReload.x,y:afterReload.y}, after:{x:afterManualScroll.x,y:afterManualScroll.y} };
  await navigate('/world/', 1440, 900, false, false);
  const afterNavigation = await geometry();
  assert(afterNavigation.x === afterReload.x && afterNavigation.y === afterReload.y, `Dragged x/y did not persist across site navigation: ${JSON.stringify({afterReload,afterNavigation})}`);
  const worldTargetMoved = await evaluate(`(()=>{const e=document.querySelector('.site-links a[href$="/world/"]');if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  assert(worldTargetMoved, 'Could not find World navigation after route change.');
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: worldTargetMoved.x, y: worldTargetMoved.y });
  const reactionWhileMoved = await waitFor(`(()=>{const r=document.querySelector('[data-companion]'),i=r?.querySelector('[data-companion-image]');return r?.getAttribute('data-companion-current-reaction')==='curious'&&i?.getAttribute('src')?.includes('/companion/runtime-v1/world-map.webp')&&i.complete&&i.naturalWidth>0;})()`, 3000);
  const afterMovedReaction = await geometry();
  assert(reactionWhileMoved && afterMovedReaction.x === afterNavigation.x && afterMovedReaction.y === afterNavigation.y, `Context reaction changed Toadal's user position: ${JSON.stringify({reactionWhileMoved,afterNavigation,afterMovedReaction})}`);
  results.checks.reactionPreservesPosition = { reaction: await evaluate("document.querySelector('[data-companion]')?.getAttribute('data-companion-current-reaction')"), before: { x: afterNavigation.x, y: afterNavigation.y }, after: { x: afterMovedReaction.x, y: afterMovedReaction.y } };
  await capture('companion-position-reaction-preserved.png', 'World hover reaction leaves manually selected x/y unchanged.');

  await navigate('/', 1440, 900, false, true);
  await dragMouseTo(16, 16);
  const beforeMinimize = await geometry();
  await evaluate("document.querySelector('[data-companion-toggle]').click()");
  assert(await waitFor("document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='true'"), 'Companion did not restore before minimize-position test.');
  await evaluate("document.querySelector('[data-companion-toggle]').click()");
  assert(await waitFor("document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='false'"), 'Companion did not minimize after manual drag.');
  const minimizedAtPosition = await geometry();
  assert(minimizedAtPosition.minimized === 'true' && minimizedAtPosition.x === beforeMinimize.x && minimizedAtPosition.y === beforeMinimize.y, `Minimizing changed the saved viewport position: ${JSON.stringify({beforeMinimize,minimizedAtPosition})}`);
  await call('Page.reload', { ignoreCache: true });
  assert(await waitFor(`document.readyState === 'complete' && document.querySelector('[data-position-ready="true"]')`), 'Position controller did not initialize after minimized reload.');
  await sleep(160);
  const minimizedAfterReload = await geometry();
  assert(minimizedAfterReload.minimized === 'true' && minimizedAfterReload.x === beforeMinimize.x && minimizedAfterReload.y === beforeMinimize.y, `Minimized state or position failed to persist through reload: ${JSON.stringify({beforeMinimize,minimizedAfterReload})}`);
  await evaluate("document.querySelector('[data-companion-toggle]').click()");
  assert(await waitFor("document.querySelector('[data-companion-toggle]')?.getAttribute('aria-expanded')==='true'"), 'Companion did not restore after minimized reload.');
  const restoredAtPosition = await geometry();
  assert(restoredAtPosition.minimized === 'false' && restoredAtPosition.x === beforeMinimize.x && restoredAtPosition.y === beforeMinimize.y, `Restoring changed the saved viewport position: ${JSON.stringify({beforeMinimize,restoredAtPosition})}`);
  results.checks.minimizeRestorePosition = {
    position: { x: beforeMinimize.x, y: beforeMinimize.y },
    minimized: minimizedAtPosition.minimized,
    minimizedAfterReload: { x: minimizedAfterReload.x, y: minimizedAfterReload.y, preference: minimizedAfterReload.minimized },
    restored: { x: restoredAtPosition.x, y: restoredAtPosition.y, preference: restoredAtPosition.minimized }
  };

  await call('Page.reload', { ignoreCache: true });
  assert(await waitFor(`document.readyState === 'complete' && document.querySelector('[data-position-ready="true"]')`), 'Position controller did not initialize after reload.');
  const finalPersistedPosition = await geometry();
  assert(finalPersistedPosition.x === afterNavigation.x && finalPersistedPosition.y === afterNavigation.y, 'Position changed on reload after a reaction.');
  const coverage = [];
  for (const route of ['/404.html', '/player/wicked-bites/', '/feast-pass/', '/feast-pass/quests/', '/feast-pass/rewards/', '/profile/']) {
    await navigate(route, 390, 844, true, false);
    const state = await evaluate(`(()=>{const roots=document.querySelectorAll('[data-companion]'),root=roots[0],r=root?.getBoundingClientRect(),frame=document.querySelector('iframe');return {path:location.pathname,count:roots.length,fixed:!!root&&getComputedStyle(root).position==='fixed',ready:root?.getAttribute('data-position-ready'),x:Number(root?.getAttribute('data-position-x')),y:Number(root?.getAttribute('data-position-y')),width:r?.width,height:r?.height,overflow:document.documentElement.scrollWidth>innerWidth,iframe:!!frame};})()`);
    assert(state.count === 1 && state.fixed && state.ready === 'true' && !state.overflow, `Companion route coverage failed at ${route}: ${JSON.stringify(state)}`);
    coverage.push(state);
  }
  results.checks.routeCoverage = coverage;

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
