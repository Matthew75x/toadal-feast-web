#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';

// QA-only local capture harness. It does not alter the site or dispatch gameplay.
const repo = path.resolve(process.argv[2] || '.');
const dist = path.resolve(repo, process.argv[3] || 'dist');
const options = Object.fromEntries(process.argv.slice(4).map((value, index, args) => {
  if (!value.startsWith('--')) return [];
  const [key, inlineValue] = value.slice(2).split('=', 2);
  return [key, inlineValue ?? (args[index + 1]?.startsWith('--') ? '' : args[index + 1])];
}));
const evidenceDir = path.resolve(repo, options['report-dir'] || 'docs/authoring/app-download-browser-qa');
const basePath = '/toadal-feast-web/';
const reportPath = path.join(evidenceDir, 'app-download-browser-qa.json');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const externalBase = options['base-url'] ? new URL(options['base-url']) : null;
assert(!externalBase || externalBase.pathname.endsWith(basePath), `Base URL must end with ${basePath}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const mime = file => ({ '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon' }[path.extname(file).toLowerCase()] || 'application/octet-stream');

assert(fs.existsSync(path.join(dist, 'index.html')), `Missing rendered Home: ${path.join(dist, 'index.html')}`);
assert(fs.existsSync(path.join(dist, 'app', 'index.html')), `Missing rendered App page: ${path.join(dist, 'app', 'index.html')}`);
fs.mkdirSync(evidenceDir, { recursive: true });

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

let chrome, ws;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-app-download-qa-'));
const results = {
  schema: 'toadal-feast.app-download-browser-qa.v1', status: 'RUNNING', repo, dist,
  basePath, baseUrl: externalBase ? externalBase.href : null,
  generatedAt: new Date().toISOString(), captures: [], checks: [], limitations: [],
};
const record = (name, pass, detail = null) => {
  results.checks.push({ name, status: pass ? 'PASS' : 'FAIL', detail });
  if (!pass) results.status = 'FAIL';
};

try {
  if (!externalBase) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = externalBase ? externalBase.origin : `http://127.0.0.1:${server.address().port}`;
  const chromeCandidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  const chromePath = chromeCandidates.find(file => fs.existsSync(file));
  assert(chromePath, 'Chrome executable not found (set CHROME_PATH).');
  const requestedDebugPort = Number(options['debug-port'] || 0);
  const probe = http.createServer();
  if (requestedDebugPort) await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(requestedDebugPort, '127.0.0.1', resolve);
  });
  else await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const debugPort = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  results.debugPort = debugPort;
  chrome = spawn(chromePath, [`--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore', windowsHide: true });

  let target;
  for (let i = 0; i < 80; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(item => item.type === 'page'); if (target) break; } catch {}
    await sleep(125);
  }
  assert(target, 'Chrome DevTools page target did not become available.');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map(); let sequence = 0;
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id); pending.delete(message.id);
      message.error ? waiter.reject(new Error(`${waiter.method}: ${JSON.stringify(message.error)}`)) : waiter.resolve(message);
    }
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject, method }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text || 'Browser evaluation failed.');
    return response.result.result.value;
  };
  const waitFor = async (expression, timeoutMs = 10000) => {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) { const result = await evaluate(expression); if (result) return result; await sleep(60); }
    return null;
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });

  const targets = [
    { id:'home-app-1440x900', route:'', width:1440, height:900, selector:'#app' },
    { id:'home-app-430x932', route:'', width:430, height:932, selector:'#app' },
    { id:'home-app-390x844', route:'', width:390, height:844, selector:'#app' },
    { id:'home-app-320x800', route:'', width:320, height:800, selector:'#app' },
    { id:'app-hero-1440x900', route:'app/', width:1440, height:900, selector:'.app-product-hero' },
    { id:'app-hero-390x844', route:'app/', width:390, height:844, selector:'.app-product-hero' },
    { id:'app-gameplay-gallery-1440x900', route:'app/', width:1440, height:900, selector:'.app-gameplay-section' },
    { id:'app-gameplay-gallery-390x844', route:'app/', width:390, height:844, selector:'.app-gameplay-section' },
  ];
  const assetNames = ['arcade-real-gameplay.webp', 'puzzle-real-gameplay.webp', 'feastfall-real-gameplay.webp'];

  for (const item of targets) {
    await call('Emulation.setDeviceMetricsOverride', { width:item.width, height:item.height, deviceScaleFactor:1, mobile:item.width <= 768 });
    await call('Emulation.setTouchEmulationEnabled', { enabled:item.width <= 768, maxTouchPoints:1 });
    const url = (externalBase ? externalBase.href : origin + basePath) + item.route;
    await call('Page.navigate', { url });
    assert(await waitFor(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`), `Navigation failed for ${item.id}`);
    const targetReady = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(item.selector)});if(!e)return false;document.documentElement.style.scrollBehavior='auto';e.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'});return true})()`);
    assert(targetReady, `Target ${item.selector} missing at ${item.id}`);
    // Trigger native lazy loading for the target and its nearby rendered content; no app state is changed.
    const loaded = await evaluate(`(async()=>{const section=document.querySelector(${JSON.stringify(item.selector)});const root=section?.querySelector('.app-production-showcase,.app-product-stage,.app-gameplay-grid')||section;const imgs=[...new Set([...root.querySelectorAll('img'),...document.querySelectorAll('.site-header img')])];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode().catch(()=>null)));return imgs.map(i=>({src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth}))})()`);
    await waitFor('document.fonts ? document.fonts.ready.then(()=>true) : true', 5000);
    await sleep(180);

    const state = await evaluate(`(()=>{const section=document.querySelector(${JSON.stringify(item.selector)});const companion=document.querySelector('[data-companion]');const bounds=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};const buttons=[...section.querySelectorAll('.store-badge-row button,button.store-badge')];const buttonInfo=buttons.map(b=>{const r=b.getBoundingClientRect(),p=b.parentElement?.getBoundingClientRect(),s=getComputedStyle(b);return {text:(b.innerText||'').trim(),disabled:b.disabled,rect:bounds(b),parent:bounds(b.parentElement),clipped:!!p&&(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1),visible:s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}});const decorations=[...section.querySelectorAll('img,svg,[data-toadal]')].filter(e=>!e.closest('[data-companion]')).map(e=>({tag:e.tagName,alt:e.getAttribute('alt')||'',src:e.currentSrc||e.getAttribute('src')||'',className:typeof e.className==='string'?e.className:'',text:(e.textContent||'').trim().slice(0,80)})).filter(x=>{const description=[x.alt,x.className,x.text].join(' ');const source=x.src.toLowerCase();const actualCharacterArt=(source.includes('/assets/images/characters/')||source.includes('/assets/images/companion/'))&&source.includes('toadal');const lowerDescription=description.toLowerCase();const semanticCharacter=lowerDescription.includes('toadal')&&['mascot','character','companion','frog king','sprite'].some(term=>lowerDescription.includes(term));return actualCharacterArt||semanticCharacter});const imgs=[...section.querySelectorAll('img')].map(i=>({src:i.currentSrc||i.src,loaded:i.complete&&i.naturalWidth>0,naturalWidth:i.naturalWidth}));return {path:location.pathname,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,section:bounds(section),companionCount:document.querySelectorAll('[data-companion]').length,companionPresent:!!companion,buttons:buttonInfo,decorativeToadal:decorations,images:imgs}})()`);
    const expectedRoute = basePath + item.route;
    record(`${item.id}: route and target`, state.path === expectedRoute && !!state.section, { path:state.path, expectedRoute, section:state.section });
    record(`${item.id}: no document horizontal overflow`, !state.overflow, { documentWidth:state.documentWidth, viewportWidth:item.width });
    record(`${item.id}: persistent companion only; no section-local decorative Toadal`, state.companionCount === 1 && state.decorativeToadal.length === 0, { companionCount:state.companionCount, decorativeToadal:state.decorativeToadal });

    const needsGameplay = item.selector === '#app' || item.selector === '.app-gameplay-section' || item.selector === '.app-product-hero';
    if (needsGameplay) {
      const assets = assetNames.map(name => {
        const image = state.images.find(image => new URL(image.src).pathname.endsWith(`/assets/images/app/${name}`));
        return { name, loaded:!!image?.loaded, naturalWidth:image?.naturalWidth || 0 };
      });
      record(`${item.id}: all three real gameplay images loaded`, assets.every(asset => asset.loaded), assets);
    }
    if (item.selector === '#app' || item.selector === '.app-product-hero') {
      const buttons = state.buttons;
      record(`${item.id}: store controls exist and are disabled`, buttons.length === 2 && buttons.every(button => button.disabled), buttons);
      record(`${item.id}: store controls visible and not clipped`, buttons.length === 2 && buttons.every(button => button.visible && !button.clipped && button.rect.top >= -1 && button.rect.bottom <= item.height + 1), buttons);
    }

    const screenshot = await call('Page.captureScreenshot', { format:'png', fromSurface:true, captureBeyondViewport:false });
    const file = path.join(evidenceDir, `${item.id}.png`);
    const bytes = Buffer.from(screenshot.result.data, 'base64');
    fs.writeFileSync(file, bytes);
    results.captures.push({ id:item.id, file:path.relative(repo,file).replaceAll(path.sep,'/'), width:item.width, height:item.height, bytes:bytes.length, route:item.route ? `/${item.route}` : '/' });
  }

  if (results.checks.some(check => check.status === 'FAIL')) results.status = 'FAIL';
  else results.status = 'PASS';
} catch (error) {
  results.status = 'ERROR';
  results.error = error?.stack || String(error);
} finally {
  results.finishedAt = new Date().toISOString();
  try { fs.writeFileSync(reportPath, `${JSON.stringify(results, null, 2)}\n`); } catch (error) { process.stderr.write(`Could not write QA report: ${error.message}\n`); }
  if (ws) try { ws.close(); } catch {}
  if (chrome && !chrome.killed) chrome.kill();
  try { fs.rmSync(profile, { recursive:true, force:true }); } catch {}
  if (server.listening) await new Promise(resolve => server.close(resolve));
}

process.stdout.write(`${JSON.stringify({ status:results.status, captures:results.captures.length, checks:results.checks.length, report:path.relative(repo,reportPath).replaceAll(path.sep,'/'), ...(results.error ? {error:results.error} : {}) }, null, 2)}\n`);
if (results.status !== 'PASS') process.exitCode = 1;
