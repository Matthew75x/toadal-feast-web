#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const repo = path.resolve(process.argv[2] || '.');
const project = path.join(repo, 'studio-project', 'toadal-feast-website');
const chrome = process.env.CHROMIUM_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = Number(process.env.TOADAL_CDP_PORT || 9236);
const keepShots = process.env.TOADAL_VIEWPORT_SCREENSHOTS === '1';
const tmp = path.join(os.tmpdir(), 'toadal-home-viewport-' + process.pid);
const preview = path.join(tmp, 'preview');
const profile = path.join(tmp, 'chrome-profile');
const shots = path.join(tmp, 'screenshots');

const viewports = [
  [390,844],[430,932],[768,1024],
  [1366,768],[1600,900],[1920,1080]
];
const sleep = ms => new Promise(r=>setTimeout(r,ms));
fs.rmSync(tmp,{recursive:true,force:true});
fs.mkdirSync(path.join(preview,'assets','css'),{recursive:true});
fs.mkdirSync(path.join(preview,'assets','images','home'),{recursive:true});
if (keepShots) fs.mkdirSync(shots,{recursive:true});

fs.copyFileSync(
  path.join(project,'reference','assets','css','site.css'),
  path.join(preview,'assets','css','site.css')
);
for (const name of fs.readdirSync(path.join(project,'reference','assets','images','home'))) {
  fs.copyFileSync(
    path.join(project,'reference','assets','images','home',name),
    path.join(preview,'assets','images','home',name)
  );
}

const page = JSON.parse(fs.readFileSync(path.join(project,'pages','home.json'),'utf8').replace(/^\uFEFF/,''));
let template = fs.readFileSync(path.join(project,'reference','home-template.html'),'utf8');
const portal = page.components?.[0]?.props?.html || '';
template = template.replace(
  '<main id="main-content"></main>',
  '<main id="main-content">' + portal + '</main>'
);
fs.writeFileSync(path.join(preview,'index.html'),template,'utf8');

if (!fs.existsSync(chrome)) throw new Error('Chromium not found: ' + chrome);
const child = spawn(chrome,[
  '--headless=new','--disable-gpu',
  '--remote-debugging-port=' + port,
  '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=' + profile,
  'about:blank'
],{stdio:'ignore'});
let target;
for (let i=0;i<40;i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
    target = list.find(t=>t.type==='page');
    if (target) break;
  } catch {}
  await sleep(100);
}
if (!target) {
  child.kill();
  throw new Error('Chrome DevTools endpoint did not become ready');
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
let seq=0;
const pending=new Map();
ws.onmessage=e=>{
  const m=JSON.parse(e.data);
  if (!m.id || !pending.has(m.id)) return;
  const x=pending.get(m.id);
  pending.delete(m.id);
  m.error ? x.reject(new Error(JSON.stringify(m.error))) : x.resolve(m.result);
};
const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;
  pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
});
await send('Page.enable');
const url = 'file:///' + path.join(preview,'index.html').replace(/\\/g,'/');
const results=[];
for (const [width,height] of viewports) {
  const mobile = width <= 768;
  await send('Emulation.setDeviceMetricsOverride',{
    width,height,deviceScaleFactor:1,mobile,
    screenWidth:width,screenHeight:height
  });
  await send('Page.navigate',{url});
  await sleep(600);
  const expression =
    '(()=>{const q=s=>document.querySelector(s);' +
    'const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right)}};' +
    'const t=q(".site-nav-toggle"),s=q(".site-search"),today=q("#today");' +
    'const cw=document.documentElement.clientWidth,sw=document.documentElement.scrollWidth;' +
    'return {clientWidth:cw,scrollWidth:sw,horizontalOverflow:sw>cw+1,' +
    'toggle:t?{display:getComputedStyle(t).display,rect:rect(t)}:null,' +
    'search:s?{display:getComputedStyle(s).display,rect:rect(s)}:null,' +
    'today:rect(today),visualWidth:visualViewport&&visualViewport.width};})()';
  const evaluated = await send('Runtime.evaluate',{expression,returnByValue:true});
  const value = evaluated.result.value;
  const checks = {
    noHorizontalOverflow: !value.horizontalOverflow,
    todayPresent: Boolean(value.today),
    shellMode: mobile
      ? value.toggle?.display !== 'none' && value.search?.display === 'none'
      : value.toggle?.display === 'none' && value.search?.display !== 'none'
  };
  const pass = Object.values(checks).every(Boolean);
  if (keepShots) {
    const shot = await send('Page.captureScreenshot',{
      format:'png',fromSurface:true,captureBeyondViewport:false
    });
    fs.writeFileSync(
      path.join(shots,width+'x'+height+'.png'),
      Buffer.from(shot.data,'base64')
    );
  }
  results.push({width,height,mobile,pass,checks,metrics:value});
}

ws.close();
const childClosed = new Promise(resolve => child.once('exit', resolve));
child.kill();
await Promise.race([childClosed, sleep(1000)]);
if (process.platform === 'win32') {
  spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});
  await sleep(250);
}
const failures=results.filter(r=>!r.pass);
console.log(JSON.stringify({
  schema:'toadal-feast.home-viewport-audit.v1',
  chrome,
  results,
  summary:{viewports:results.length,pass:results.length-failures.length,fail:failures.length},
  screenshots:keepShots?shots:null
},null,2));
if (!keepShots) {
  try { fs.rmSync(tmp,{recursive:true,force:true,maxRetries:8,retryDelay:125}); }
  catch { /* Chrome can briefly retain Windows profile handles; temp cleanup is non-evidence. */ }
}
if (failures.length) process.exitCode=1;
