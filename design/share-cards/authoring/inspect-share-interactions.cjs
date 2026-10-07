const {chromium}=require('./share-cards-checkout/services/share-cards/node_modules/playwright');
const {pathToFileURL}=require('node:url'); const path=require('node:path');
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:768,height:1000}});await p.goto(pathToFileURL(path.resolve('work/game-challenge-directions-preview.html')).href);const f=p.frames().find(x=>x.parentFrame());await f.waitForSelector('#tf-share-directions');
console.log(await f.locator('button').evaluateAll(bs=>bs.map(x=>({name:x.getAttribute('aria-label'),class:x.className,text:x.textContent}))));
for(const width of [768,352]){await p.setViewportSize({width,height:1100});const next=f.locator('button[aria-label]').last();for(let i=0;i<3;i++){const state=await f.evaluate(()=>{const s=Array.from(document.querySelectorAll('[data-variant]')).filter(x=>!x.hidden);return{visible:s.map(x=>x.dataset.variant),height:s[0].querySelector('.tf-stage').getBoundingClientRect().height}});console.log(JSON.stringify({width,...state}));await next.click();}}
await b.close();})();
