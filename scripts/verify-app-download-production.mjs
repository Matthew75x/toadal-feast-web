#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(process.argv[2]||'.');
const site=path.join(root,'studio-project','toadal-feast-website');
const index=JSON.parse(fs.readFileSync(path.join(site,'assets','index.json'),'utf8'));
const lockRaw=fs.readFileSync(path.join(root,'manifests','visual-asset-authority-lock.json'),'utf8');
const homeRaw=fs.readFileSync(path.join(site,'pages','home.json'),'utf8');
const appRaw=fs.readFileSync(path.join(site,'pages','app.json'),'utf8');
const css=fs.readFileSync(path.join(site,'reference','assets','css','site.css'),'utf8');
const errors=[]; const notes=[];
const expected=[
 ['asset.app.gameplay.arcade','reference/assets/images/app/arcade-real-gameplay.webp',63302,'c141021348f5937d9ff6de7358aee0b038cab9fddf65c5141780a44291598ef9',360,600],
 ['asset.app.gameplay.puzzle','reference/assets/images/app/puzzle-real-gameplay.webp',43436,'c52dfa60185ac2fca83f2cc97b6c3baf369bcd0ff1389ee106135062016d6dfa',640,360],
 ['asset.app.gameplay.feastfall','reference/assets/images/app/feastfall-real-gameplay.webp',35300,'362d3d36bf3f8faf19f9db7bf63d0a8abeb1883662210fc4f992e05c5fd56afa',640,360]
];
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ok=(v,m)=>{if(!v)errors.push(m)};
let total=0;
for(const [id,rel,bytes,hash,w,h] of expected){
 const file=path.join(site,rel); total+=bytes; ok(fs.existsSync(file),'missing '+rel);
 if(fs.existsSync(file)){ok(fs.statSync(file).size===bytes,'byte drift '+id);ok(sha(file)===hash,'sha drift '+id)}
 const a=(index.assets||[]).find(x=>x.id===id); ok(!!a,'asset index missing '+id);
 if(a){ok(a.source===rel,'source drift '+id);ok(a.bytes===bytes,'index bytes drift '+id);ok(a.sha256===hash,'index sha drift '+id);ok(a.width===w&&a.height===h,'dimensions drift '+id);ok((a.tags||[]).includes('real-gameplay'),'real-gameplay tag missing '+id)}
 ok(lockRaw.includes(hash),'authority lock missing '+id);
}
ok(total<=150000,'runtime gameplay payload exceeds 150 KB budget: '+total);
const appDir=path.join(site,'reference','assets','images','app');
ok(!fs.readdirSync(appDir).some(n=>/\.png$/i.test(n)),'raw PNG shipped in app runtime directory');
for(const token of ['app-conversion-panel--production','arcade-real-gameplay.webp','puzzle-real-gameplay.webp','feastfall-real-gameplay.webp','See real gameplay']) ok(homeRaw.includes(token),'Home missing '+token);
for(const token of ['app-product-page','app-product-hero','app-gameplay-section','Three ways the Feast plays','REAL GAMEPLAY','arcade-real-gameplay.webp','puzzle-real-gameplay.webp','feastfall-real-gameplay.webp']) ok(appRaw.includes(token),'App page missing '+token);
ok((homeRaw.match(/class='store-badge'/g)||[]).length===2,'Home must retain exactly two store badges');
ok((appRaw.match(/class='store-badge'/g)||[]).length===2,'App page must retain exactly two store badges');
ok((homeRaw.match(/store-badge' type='button' disabled/g)||[]).length===2,'Home store badges must remain disabled buttons');
ok((appRaw.match(/store-badge' type='button' disabled/g)||[]).length===2,'App page store badges must remain disabled buttons');
ok(!/apps\.apple\.com|play\.google\.com/i.test(homeRaw+appRaw),'unverified store URL exposed');
ok(homeRaw.includes('real captured gameplay from the mobile game'),'Home real-gameplay truth copy missing');
ok(appRaw.includes('not as separate browser games'),'App page browser-game distinction missing');
ok(!homeRaw.includes("app-production-toadal"),'duplicate decorative Toadal returned to Home app panel');
ok(!appRaw.includes("app-product-toadal"),'duplicate decorative Toadal returned to App hero');
for(const token of ['.app-production-showcase','.app-product-stage','.app-gameplay-grid','@media (max-width: 430px)','prefers-reduced-motion']) ok(css.includes(token),'App production CSS missing '+token);
notes.push('runtimeGameplayBytes='+total);
notes.push('storeDestinations=disabled-until-verified');
notes.push('mobileModes=Arcade,Puzzle,Feastfall real captures');
notes.push('duplicateDecorativeToadal=false; persistent companion remains authoritative character presence');
if(errors.length){console.error('APP DOWNLOAD PRODUCTION: FAIL');for(const e of errors)console.error('-',e);process.exit(1)}
console.log('APP DOWNLOAD PRODUCTION: PASS');console.log(JSON.stringify({schema:'toadal-feast.app-download-production.v1',notes},null,2));