#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, spawnSync, execFileSync } from 'node:child_process';

const repo = path.resolve(process.argv[2] || '.');
const dist = path.join(repo, 'dist');
const baseline = process.argv[3];
const reportPath = path.resolve(process.argv[4] || path.join(repo, 'docs/review/manifest-complete-v1-20261002/network-payload.json'));
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!baseline) throw new Error('Pass the qualified baseline commit SHA.');
if (!fs.existsSync(chromePath)) throw new Error('Chrome executable not found: ' + chromePath);

const routes = [
  ['Home', '/'], ['Play', '/play/'], ['World', '/world/'], ['Media', '/media/'],
  ['App', '/app/'], ['Feast Pass', '/feast-pass/']
];
const baselineCache = new Map();
let servingBaseline = false;
function mime(file) {
  return ({ '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp4':'video/mp4' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
function safeLocalPath(root, urlPath) {
  if (!urlPath.startsWith('/toadal-feast-web/')) return null;
  let relative = decodeURIComponent(urlPath.slice('/toadal-feast-web/'.length)).replace(/^\/+/, '');
  if (!relative || urlPath.endsWith('/')) relative = path.posix.join(relative, 'index.html');
  const target = path.resolve(root, ...relative.split('/'));
  return target === root || target.startsWith(root + path.sep) ? target : null;
}
const baselineRoot = '/__baseline__/';
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (pathname.startsWith(baselineRoot) || (servingBaseline && pathname.startsWith('/toadal-feast-web/'))) {
    let relative = decodeURIComponent(pathname.startsWith(baselineRoot) ? pathname.slice(baselineRoot.length) : pathname.slice('/toadal-feast-web/'.length));
    if (!relative || pathname.endsWith('/')) relative = path.posix.join(relative, 'index.html');
    if (!/^[a-zA-Z0-9._/-]+$/.test(relative) || relative.includes('..')) { res.writeHead(400).end(); return; }
    let bytes = baselineCache.get(relative);
    if (!bytes) {
      try { bytes = execFileSync('git', ['show', baseline + ':dist/' + relative], { cwd: repo, maxBuffer: 64 * 1024 * 1024 }); baselineCache.set(relative, bytes); }
      catch { res.writeHead(404).end('not found'); return; }
    }
    res.writeHead(200, { 'content-type': mime(relative), 'content-length': bytes.length, 'cache-control': 'no-store' }); res.end(bytes); return;
  }
  const file = safeLocalPath(dist, pathname);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': mime(file), 'content-length': fs.statSync(file).size, 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const origin = 'http://127.0.0.1:' + port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toadal-net-'));
const debugPort = 9321;
const chrome = spawn(chromePath, ['--remote-debugging-port=' + debugPort, '--user-data-dir=' + profile, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  let target;
  for (let i = 0; i < 60; i++) {
    try { target = (await (await fetch('http://127.0.0.1:' + debugPort + '/json')).json()).find(item => item.type === 'page'); if (target) break; } catch { /* Chrome starting */ }
    await sleep(100);
  }
  if (!target) throw new Error('Chrome DevTools target unavailable.');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } else events.push(message); };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, message => message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message)); ws.send(JSON.stringify({ id, method, params })); });
  await call('Page.enable'); await call('Network.enable'); await call('Network.setCacheDisabled', { cacheDisabled: true }); await call('Network.setBypassServiceWorker', { bypass: true });
  const measurements = [];
  async function measure(label, url) {
    events.length = 0;
    await call('Network.clearBrowserCache');
    const loaded = new Promise(resolve => {
      const handler = message => { if (message.method === 'Page.loadEventFired') { const index = events.indexOf(message); if (index >= 0) events.splice(index, 1); resolve(); } };
      const interval = setInterval(() => { const event = events.find(item => item.method === 'Page.loadEventFired'); if (event) { const index = events.indexOf(event); events.splice(index, 1); clearInterval(interval); resolve(); } }, 25);
      setTimeout(() => { clearInterval(interval); resolve(); }, 15000);
    });
    await call('Page.navigate', { url });
    await loaded;
    await sleep(700);
    const requests = new Map();
    const lengths = new Map();
    const statuses = new Map();
    for (const item of events) {
      if (item.method === 'Network.requestWillBeSent') requests.set(item.params.requestId, item.params.request.url);
      if (item.method === 'Network.loadingFinished') lengths.set(item.params.requestId, item.params.encodedDataLength);
      if (item.method === 'Network.responseReceived') statuses.set(item.params.requestId, item.params.response.status);
    }
    const resources = [];
    for (const [requestId, requestUrl] of requests) {
      if (!requestUrl.startsWith(origin)) continue;
      const pathname = new URL(requestUrl).pathname;
      resources.push({ path: pathname, status: statuses.get(requestId) || null, bytes: lengths.get(requestId) || 0 });
    }
    const external = [];
    for (const requestUrl of requests.values()) if (/^https?:/i.test(requestUrl) && !requestUrl.startsWith(origin)) external.push(requestUrl);
    measurements.push({ label, url, requestCount: resources.length, totalTransferredBytes: resources.reduce((total, item) => total + item.bytes, 0), externalRequests: [...new Set(external)], masterPngRequests: resources.filter(item => /(?:master-v2-selected|production-pack-v2)\/.*\.png(?:$|\?)/i.test(item.path)), resources });
  }
  for (const [label, route] of routes) await measure(label, origin + '/toadal-feast-web' + route);
  servingBaseline = true;
  await measure('Home baseline ' + baseline.slice(0, 8), origin + '/toadal-feast-web/?baseline=' + baseline.slice(0, 8));
  const result = { schema: 'toadal-feast.cold-network-payload.v1', baseline, basePath: '/toadal-feast-web/', measurements, checkedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
  for (const item of measurements) console.log(JSON.stringify({ label: item.label, requests: item.requestCount, transferredBytes: item.totalTransferredBytes, externalRequests: item.externalRequests.length, masterPngRequests: item.masterPngRequests.length }));
  console.log('Report: ' + path.relative(repo, reportPath).replaceAll(path.sep, '/'));
} finally {
  try { ws?.close(); } catch { /* already closed */ }
  chrome.kill(); server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* temp profile is recoverable */ }
}
