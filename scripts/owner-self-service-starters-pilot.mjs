import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'),{chromium}=require('playwright');
const url=process.env.OWNER_PILOT_URL||'http://127.0.0.1:4327/',out=process.env.OWNER_PILOT_EVIDENCE||'D:/TOADAL_BACKUPS/studio-owner-authoring-20261002/owner-self-service-evidence-20261003';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1000},acceptDownloads:true});page.setDefaultTimeout(20000);
const report={checks:{},errors:[],created:[]};page.on('pageerror',e=>report.errors.push(e.message));
const request=async(endpoint,action)=>{const wait=page.waitForResponse(r=>r.url().endsWith(endpoint)&&r.request().method()!=='GET');await action();const response=await wait;if(response.status()!==200)throw new Error(await response.text());return response.json();};
const walk=items=>items.flatMap(c=>[c,...walk(c.props?.children||[]),...Object.values(c.props?.slots||{}).flatMap(walk)]);
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const openPages=async()=>{const old=await page.$('#pageCreationEditor');await page.locator('#projectQuick').click();if(old)await page.waitForFunction(el=>!el.isConnected,old);await page.locator('#pageCreationEditor').waitFor();};
const prior=process.env.OWNER_STARTERS_RESUME?JSON.parse(fs.readFileSync(process.env.OWNER_STARTERS_RESUME,'utf8')).created:[];
try{
 await page.goto(url);await page.locator('#bootOverlay').waitFor({state:'hidden'});
 const safeProjects=await (await page.request.get(url+'api/projects')).json();assert.match(safeProjects.items.find(x=>x.id===safeProjects.current).path,/owner-self-service-pilot|owner-pilot-qa-/i);
 const before={};for(const id of ['page.about','page.news-article'])before[id]=hash((await (await page.request.get(url+'api/page?id='+encodeURIComponent(id))).json()).value);
 for(const starter of [
  ['Article','template','template.article-story','/owner-article-pilot/'],
  ['Information','template','template.information','/owner-information-pilot/'],
  ['Existing','existing','page.about','/owner-existing-pilot/'],
  ['Blank','blank',null,'/owner-blank-pilot/']
 ]){
  const [name,kind,source,route]=starter;let created=prior.find(x=>x.route===route);if(!created){await openPages();
  await page.locator('[data-key="newTitle"]').fill('Owner '+name+' Pilot');await page.locator('[data-key="newRoute"]').fill(route);await page.locator('#newPageKind').selectOption(kind);
  if(source)await page.locator(kind==='template'?'#newPageTemplate':'#newPageSource').selectOption(source);
  created=await request(kind==='blank'?'/api/pages':kind==='template'?'/api/pages/template':'/api/pages/from-source',()=>page.locator('#createPage').click());
  assert.equal(created.publicationState,'draft');assert.equal(created.route,route);
  await page.waitForFunction(title=>document.querySelector('#canvasTitle')?.textContent===title,'Owner '+name+' Pilot');
  }report.created.push({id:created.id,route,name,source});
  await page.reload();await page.locator('#bootOverlay').waitFor({state:'hidden'});await openPages();await page.locator('[data-page="'+created.id+'"]').click();
  await page.waitForFunction(route=>document.querySelector('[data-key="__route"]')?.value===route,created.route);
  assert.equal(await page.locator('[data-key="__publication"]').inputValue(),'draft');
  const data=(await (await page.request.get(url+'api/page?id='+encodeURIComponent(created.id))).json()).value;
  const ids=walk(data.components).map(c=>c.id);assert.equal(new Set(ids).size,ids.length);
  const preview=await browser.newPage({viewport:{width:1440,height:1000}});await preview.goto(url+'preview'+route);assert.match(await preview.content(),/noindex,nofollow/);
  assert.equal(await preview.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' desktop overflow');
  await preview.setViewportSize({width:390,height:844});assert.equal(await preview.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' mobile overflow');
  await preview.screenshot({path:out+'/starter-'+name.toLowerCase()+'-390.png'});await preview.close();report.checks[name+'CreateReopenPreview']=true;
 }
 const info=report.created.find(x=>x.name==='Information');await page.locator('#projectQuick').click();await page.locator('[data-page="'+info.id+'"]').click();
 await page.waitForFunction(route=>document.querySelector('[data-key="__route"]')?.value===route,info.route);
 const data=(await (await page.request.get(url+'api/page?id='+encodeURIComponent(info.id))).json()).value;
 const container=walk(data.components).find(c=>Array.isArray(c.props?.children)&&!c.props.locked);assert.ok(container);
 await page.locator('[data-tab="layers"]').click();await page.locator('[data-component="'+container.id+'"]').click();
 const added=await request('/api/component',()=>page.locator('#addOwnerImage').click());await page.waitForFunction(id=>document.querySelector('#rightPanel')?.innerText.includes(id),added.component.id);await page.waitForFunction(()=>document.querySelector('#saveState')?.textContent==='Ready');
 const assets=page.locator('select[data-key="asset"] option');const value=await assets.nth(1).getAttribute('value');assert.ok(value);
 await page.locator('select[data-key="asset"]').selectOption(value);await page.locator('input[data-key="alt"]').fill('Owner inserted image pilot');await page.locator('input[data-key="imageHeight"]').fill('100');
 await request('/api/component/update',()=>page.locator('#saveComponent').click());await page.waitForFunction(()=>document.querySelector('#ownerDraftState')?.textContent.startsWith('Saved'));
 await page.locator('input[data-key="alt"]').fill('UNSAVED_CANCEL_IMAGE');await page.locator('#cancelOwnerEdit').click();await page.waitForFunction(()=>document.querySelector('input[data-key="alt"]')?.value==='Owner inserted image pilot');assert.equal(await page.locator('input[data-key="alt"]').inputValue(),'Owner inserted image pilot');report.checks.addImageSaveCancel=true;
 for(const [id,h]of Object.entries(before))assert.equal(hash((await (await page.request.get(url+'api/page?id='+encodeURIComponent(id))).json()).value),h);report.checks.donorPagesUnchanged=true;
 const health=(await (await page.request.get(url+'api/health')).json());assert.equal(health.valid,true);assert.equal(health.dangling.length,0);report.checks.projectValid=true;
 await page.locator('#toolboxQuick').click();const downloading=page.waitForEvent('download',{timeout:120000});await page.locator('a[href="/api/export/static"]').click();const download=await downloading;report.export=out+'/starter-draft-boundary.zip';assert.equal(fs.existsSync(report.export),false);await download.saveAs(report.export);assert.equal(await download.failure(),null);
 const listing=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem; $ownerZip=[IO.Compression.ZipFile]::OpenRead($env:OWNER_ZIP); try { foreach($e in $ownerZip.Entries) { if($e.FullName -match "\\.(html|json|xml)$") { $ownerReader=[IO.StreamReader]::new($e.Open()); try { Write-Output ($e.FullName+" "+$ownerReader.ReadToEnd()) } finally { $ownerReader.Dispose() } } } } finally { $ownerZip.Dispose() }'],{env:{...process.env,OWNER_ZIP:report.export},encoding:'utf8',maxBuffer:10*1024*1024});
 assert.equal(listing.status,0,listing.stderr);for(const created of report.created)assert.equal(listing.stdout.includes(created.route),false,created.name+' draft must not appear in output/search/sitemap/nav');report.checks.draftsExcludedFromPublicExport=true;
 assert.equal(report.errors.length,0);report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;process.exitCode=1;await page.screenshot({path:out+'/starters-failure.png'}).catch(()=>{});}
finally{fs.writeFileSync(out+'/pilot-starters.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();}
