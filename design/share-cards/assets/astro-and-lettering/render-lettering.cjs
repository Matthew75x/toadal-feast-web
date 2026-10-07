const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base = __dirname;
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
    const attemptedRequests = [];
    await context.route('**/*', async route => {attemptedRequests.push(route.request().url()); await route.abort();});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; font-src data:; img-src data:; style-src \'unsafe-inline\'; connect-src \'none\'">');
    await page.addScriptTag({path:path.join(base,'lettering','toadal-lettering.js')});
    const results = await page.evaluate(async () => {
      await new Promise(resolve => TOADAL.whenReady(resolve));
      await document.fonts.ready;
      if (!document.fonts.check('30px "Lilita One"')) throw new Error('Embedded font did not load');
      const shared = {h:180,tightness:100,endBoost:8,lineScale:80,outlineWidth:9,shine:90,bounce:0,glossOn:true,glow:false};
      const left = document.createElement('canvas');
      const right = document.createElement('canvas');
      if (!TOADAL.paint(left,{...shared,w:430,letterText:'TOADAL',paletteMode:'single',accent:'#fee822',accent2:'#fda80a'})) throw new Error('TOADAL render failed');
      if (!TOADAL.paint(right,{...shared,w:570,letterText:'FEAST!',paletteMode:'rainbow'})) throw new Error('FEAST render failed');
      const composed = document.createElement('canvas'); composed.width=2000;composed.height=360;
      const ctx=composed.getContext('2d');ctx.drawImage(left,0,0);ctx.drawImage(right,860,0);
      const lockup=document.createElement('canvas');
      const lockSettings={...shared,w:640,h:330,letterText:'TOADAL|FEAST!',paletteMode:'lockup',accent:'#fee822',accent2:'#fda80a',lineScale:82,endBoost:12};
      if(!TOADAL.paint(lockup,lockSettings)) throw new Error('Lockup render failed');
      return {header:composed.toDataURL('image/png'),lockup:lockup.toDataURL('image/png'),engineVersion:TOADAL.version,headerSettings:shared,lockupSettings:lockSettings};
    });
    const renders=path.join(base,'lettering','renders');await fs.mkdir(renders,{recursive:true});
    await sharp(Buffer.from(results.header.split(',')[1],'base64')).resize(1000,180).png().toFile(path.join(renders,'toadal-feast-header.png'));
    await sharp(Buffer.from(results.lockup.split(',')[1],'base64')).resize(640,330).png().toFile(path.join(renders,'toadal-feast-lockup.png'));
    const report={engineVersion:results.engineVersion,header:{width:1000,height:180,transparent:true,segments:[{text:'TOADAL',width:430,paletteMode:'single'},{text:'FEAST!',width:570,paletteMode:'rainbow'}],settings:results.headerSettings},lockup:{width:640,height:330,transparent:true,settings:results.lockupSettings},attemptedNetworkRequests:attemptedRequests,pageErrors:errors,renderer:'Bundled Playwright Chromium; network requests blocked; data font only; supplied standalone Canvas engine executed after I/O inspection'};
    await fs.writeFile(path.join(renders,'render-report.json'),JSON.stringify(report,null,2)+'\n');
    if(attemptedRequests.length || errors.length) throw new Error('Render emitted requests/errors; see report');
    console.log(JSON.stringify({renders,engineVersion:results.engineVersion,networkRequests:0,pageErrors:0}));
    await context.close();
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
