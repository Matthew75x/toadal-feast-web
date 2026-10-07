#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || path.join(repo, 'evidence', 'website-audio-runtime-browser-qa-20261007.json'));
const require = createRequire(import.meta.url);
const pwPath = process.env.PLAYWRIGHT_MODULE || require.resolve('playwright-core');
const imported = await import(pathToFileURL(pwPath).href);
const { chromium } = imported.default || imported;
const loader = fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/reference/assets/js/website-audio-loader.mjs'));
const host = fs.readFileSync(path.join(repo, 'studio-project/toadal-feast-website/reference/assets/js/website-audio-host.mjs'));
const adapter = fs.readFileSync(path.join(repo, 'scripts/cartridge-hardener/templates/host-audio-adapter.js'));

const registry = JSON.stringify({
  schema:'toadal.web.audio-registry.v1', version:1, policy:{},
  cues:{'global.confirm':{bus:'menu',gain:.35,cooldownMs:0,maxVoices:2,voicePolicy:'drop',
    fallback:{kind:'tone',wave:'sine',startHz:440,endHz:660,durationMs:60}}},
  profiles:{'qa.audio':{version:1,events:{'ui.confirm':'global.confirm'}}}
});
const optedManifest = JSON.stringify({schemaVersion:1,id:'qa-audio',audio:{
  mode:'host',contractVersion:1,profile:'qa.audio',profileVersion:1,
  eventMessage:'game:audio',hostMessage:'host:audio',fallback:'local-before-active'
}});
const localManifest = JSON.stringify({schemaVersion:1,id:'local-game'});

function parentPage(gameId) {
  return `<!doctype html><meta charset=utf-8><a class=site-brand href="/toadal-feast-web/">TOADAL</a>
  <section data-player-shell data-game-id="${gameId}">
    <button data-player-sound type=button>Request mute</button>
    <iframe data-player-frame sandbox="allow-scripts" src="/toadal-feast-web/public/games/${gameId}/index.html"></iframe>
  </section>
  <script type=module src="/toadal-feast-web/assets/js/website-audio-loader.mjs"></script>`;
}
function childPage(gameId, useAdapter) {
  if (!useAdapter) return `<!doctype html><button id=emit>local</button><script>window.localPlays=0;emit.onclick=()=>localPlays++;</script>`;
  return `<!doctype html><script src="/toadal-feast-web/assets/js/host-audio-adapter.js"></script><button id=emit>emit</button><script>
    window.localPlays=0;
    window.audio=ToadalHostAudioAdapter.create({gameId:'${gameId}',legacy:()=>{window.localPlays++},fallback:'local-before-active'});
    window.states=[];
    window.addEventListener('message',e=>{if(e.data?.type==='host:audio')window.states.push(e.data.payload?.state)});
    parent.postMessage({protocol:'toadal.game.v1',gameId:'${gameId}',type:'game:ready',payload:{}},'*');
    emit.onclick=()=>window.audio.emit('ui.confirm');
  </script>`;
}
const hits = [];
let origin;
const server = http.createServer((req,res)=>{
  const url = new URL(req.url, origin || 'http://127.0.0.1');
  hits.push(url.pathname);
  const send=(status,type,body)=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(body)};
  if(url.pathname==='/toadal-feast-web/player/qa-audio/') return send(200,'text/html',parentPage('qa-audio'));
  if(url.pathname==='/toadal-feast-web/player/local-game/') return send(200,'text/html',parentPage('local-game'));
  if(url.pathname==='/toadal-feast-web/public/games/qa-audio/index.html') return send(200,'text/html',childPage('qa-audio',true));
  if(url.pathname==='/toadal-feast-web/public/games/local-game/index.html') return send(200,'text/html',childPage('local-game',false));
  if(url.pathname==='/toadal-feast-web/public/games/qa-audio/cartridge.json') return send(200,'application/json',optedManifest);
  if(url.pathname==='/toadal-feast-web/public/games/local-game/cartridge.json') return send(200,'application/json',localManifest);
  if(url.pathname==='/toadal-feast-web/assets/data/audio-registry.json') return send(200,'application/json',registry);
  if(url.pathname==='/toadal-feast-web/assets/js/website-audio-loader.mjs') return send(200,'text/javascript',loader);
  if(url.pathname==='/toadal-feast-web/assets/js/website-audio-host.mjs') return send(200,'text/javascript',host);
  if(url.pathname==='/toadal-feast-web/assets/js/host-audio-adapter.js') return send(200,'text/javascript',adapter);
  if(url.pathname==='/favicon.ico') return send(204,'image/x-icon','');
  return send(404,'text/plain','not found');
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
origin = `http://127.0.0.1:${server.address().port}`;

const checks=[]; const errors=[];
const check=(name,ok,detail=null)=>{checks.push({name,passed:!!ok,detail});if(!ok)throw new Error(name+(detail?': '+JSON.stringify(detail):''));};
let browser;
try {
  browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),timeout:15000});
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

  await page.goto(origin+'/toadal-feast-web/player/qa-audio/',{waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__toadalWebsiteAudioHost);
  const frame=page.frames().find(f=>/\/public\/games\/qa-audio\/index\.html/.test(f.url()));
  await frame.waitForFunction(()=>globalThis.audio);
  await page.waitForFunction(()=>globalThis.__toadalWebsiteAudioHost.currentState()==='available');
  check('Opt-in cartridge loads tiny loader and full host only after manifest declaration',
    hits.includes('/toadal-feast-web/assets/js/website-audio-loader.mjs')&&hits.includes('/toadal-feast-web/assets/js/website-audio-host.mjs'));

  await frame.click('#emit');
  check('Before activation local-before-active uses the cartridge legacy path',
    await frame.evaluate(()=>localPlays===1&&audio.state==='available'));

  await page.click('[data-player-sound]');
  await page.waitForFunction(()=>globalThis.__toadalWebsiteAudioHost.currentState()==='active');
  await frame.waitForFunction(()=>audio.state==='active');
  const before=await page.evaluate(()=>__toadalWebsiteAudioHost.records.filter(r=>r.type==='play').length);
  await frame.click('#emit');
  await page.waitForFunction(n=>__toadalWebsiteAudioHost.records.filter(r=>r.type==='play').length>n,before);
  check('After activation the same semantic event is played by the shared host with no local duplicate',
    await frame.evaluate(()=>localPlays===1&&audio.hostOwnsPlayback));
  check('Real browser host uses one running AudioContext',
    await page.evaluate(()=>__toadalWebsiteAudioHost.context?.state==='running'));

  await page.evaluate(()=>{localStorage.setItem('toadal:web:v1:audio',JSON.stringify({muted:true,master:.65,sfx:1,menu:1}))});
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>globalThis.__toadalWebsiteAudioHost);
  const frame2=page.frames().find(f=>/\/public\/games\/qa-audio\/index\.html/.test(f.url()));
  await frame2.waitForFunction(()=>globalThis.audio?.state==='muted');
  check('Persisted website mute takes ownership before AudioContext unlock',
    await page.evaluate(()=>__toadalWebsiteAudioHost.currentState()==='muted'&&__toadalWebsiteAudioHost.context===null));
  await frame2.click('#emit');
  check('Persisted mute suppresses the action without leaking to legacy audio',
    await frame2.evaluate(()=>localPlays===0&&audio.hostOwnsPlayback));

  const hostHitsBefore=hits.filter(x=>x.endsWith('/website-audio-host.mjs')).length;
  await page.goto(origin+'/toadal-feast-web/player/local-game/',{waitUntil:'load'});
  await page.waitForTimeout(250);
  check('Non-opt-in cartridge never imports the full shared audio runtime',
    hits.filter(x=>x.endsWith('/website-audio-host.mjs')).length===hostHitsBefore);
  check('Non-opt-in cartridge has no website audio host instance',
    await page.evaluate(()=>!globalThis.__toadalWebsiteAudioHost));
  check('No uncaught browser errors',errors.length===0,errors);

  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify({
    schema:'toadal.website-audio.browser-qa.v1',status:'PASS',generatedAt:new Date().toISOString(),
    origin,autoplayPolicyOverridden:false,checks,errors,
    requests:{total:hits.length,fullHostLoads:hits.filter(x=>x.endsWith('/website-audio-host.mjs')).length}
  },null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',checks:checks.length,errors:errors.length,output:out},null,2));
} catch(error) {
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify({schema:'toadal.website-audio.browser-qa.v1',status:'FAIL',generatedAt:new Date().toISOString(),checks,errors,error:String(error?.stack||error)},null,2)+'\n');
  console.error(error);
  process.exitCode=1;
} finally {
  await browser?.close().catch(()=>{});
  await new Promise(resolve=>server.close(resolve));
}
