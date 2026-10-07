const { chromium } = require('../work/share-cards-checkout/services/share-cards/node_modules/playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async()=>{
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:768,height:760},deviceScaleFactor:1});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve('work/game-challenge-directions-preview.html')).href);
const frame=page.frames().find(f=>f.parentFrame());
await frame.waitForSelector('#tf-share-directions');
await frame.evaluate(()=>document.fonts.ready);
await page.waitForTimeout(350);
console.log(JSON.stringify({buttons:await frame.locator('button').allTextContents(),selects:await frame.locator('select').count(),errors}));
for (const width of [768,352]) {
await page.setViewportSize({width,height:1000});
for(let i=0;i<3;i++){
await frame.evaluate(i=>{document.querySelectorAll('[data-variant]').forEach((s,j)=>s.hidden=i!==j)},i);
await page.waitForTimeout(60);
await frame.locator('#tf-share-directions').screenshot({path:`work/share-concept-${width}-${i}.png`});
const info=await frame.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:Array.from(document.querySelectorAll('img')).every(im=>im.complete&&im.naturalWidth>0)}));
console.log(JSON.stringify({width,variant:i,...info}));
}
}
await browser.close();
})();
