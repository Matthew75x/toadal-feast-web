const {chromium}=require('./share-cards-checkout/services/share-cards/node_modules/playwright');
const {pathToFileURL}=require('node:url'); const path=require('node:path'); const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});
await page.goto(pathToFileURL(path.resolve('work/game-challenge-directions-preview.html')).href);
const frame=page.frames().find(f=>f.parentFrame());
await frame.waitForSelector('#tf-share-directions'); await frame.evaluate(()=>document.fonts.ready);
for(const [index,name] of [[0,'arcade'],[1,'wicked-bites'],[2,'puzzle-astro']]){
await frame.evaluate(index=>{document.querySelectorAll('[data-variant]').forEach((s,i)=>{s.hidden=i!==index});const card=document.querySelectorAll('.tf-card')[index];card.style.width='690px';card.style.maxWidth='690px';card.style.zoom=String(1200/690);card.style.borderRadius='0';card.style.boxShadow='none';},index);
const card=frame.locator('.tf-card').nth(index); await page.waitForTimeout(60);
const box=await card.boundingBox();const out=`outputs/${name}-decorated-card-design-example.png`;
await card.screenshot({path:out});
console.log(JSON.stringify({path:out,width:box.width,height:box.height,bytes:fs.statSync(out).size}));
}
await browser.close();
})();
