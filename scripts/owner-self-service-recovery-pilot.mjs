import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Metarator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const url=process.env.OWNER_PILOT_URL||'http://127.0.0.1:4327/';
const root=process.env.OWNER_PILOT_ROOT||'D:/TOADAL_BACKUPS/studio-owner-authoring-20261002/owner-self-service-pilot-20261003';
const out=process.env.OWNER_PILOT_EVIDENCE||'D:/TOADAL_BACKUPS/studio-owner-authoring-20261002/owner-self-service-evidence-20261003';
const report={checks:{},errors:[],url};
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceLedger=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 if(['build','.studio-history','.history','.studio-recovery'].includes(e.name)||e.name.startsWith('toadal-project-'))return [];
 const full=path.join(dir,e.name);return e.isDirectory()?sourceLedger(full):[[full,digest(full)]];
});
const baseline=sourceLedger(root);
const walk=items=>items.flatMap(c=>[c,...walk(c.props?.children||[]),...Object.values(c.props?.slots||{}).flatMap(walk)]);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1000},acceptDownloads:true});page.setDefaultTimeout(25000);page.on('pageerror',e=>report.errors.push(e.message));
const request=async(endpoint,action)=>{
 const promise=page.waitForResponse(r=>r.url().endsWith(endpoint)&&r.request().method()==='POST',{timeout:120000});
 await action();const response=await promise;if(response.status()!==200)throw new Error(await response.text());return endpoint.startsWith('/api/project/import')?null:response.json();
};
try{
 await page.goto(url);await page.locator('#bootOverlay').waitFor({state:'hidden'});
 const safeProjects=await (await page.request.get(url+'api/projects')).json();assert.match(safeProjects.items.find(x=>x.id===safeProjects.current).path,/owner-self-service-pilot|owner-pilot-qa-/i);
 if(process.env.OWNER_RECOVERY_RESUME){
  const previous=JSON.parse(fs.readFileSync(process.env.OWNER_RECOVERY_RESUME,'utf8'));
  Object.assign(report,{copy:previous.copy,backup:previous.backup,backupSHA256:previous.backupSHA256,backupBytes:previous.backupBytes});
  assert.equal(digest(report.backup),report.backupSHA256);Object.assign(report.checks,previous.checks);
 }else{
 await page.locator('#toolboxQuick').click();await page.locator('#workbenchSaveAs').click();
 const dialog=page.getByRole('dialog',{name:'Name for the independent copy'});
 await dialog.getByRole('textbox',{name:'Name',exact:true}).fill('owner-pilot-qa-self-service-20261003');
 report.copy=await request('/api/project/save-as',()=>dialog.getByRole('button',{name:'Create independent copy'}).click());
 assert.match(report.copy.id,/^owner-pilot-qa-/);report.checks.independentSaveAs=true;
 await page.locator('#workbenchProject').selectOption(report.copy.id);
 await request('/api/project/open',()=>page.locator('#workbenchOpenProject').click());
 await page.waitForFunction(()=>document.querySelector('#saveState')?.textContent==='Ready');
 await page.locator('#toolboxQuick').click();const downloading=page.waitForEvent('download',{timeout:120000});
 await page.locator('a[href="/api/export/project"]').click();const download=await downloading;
 report.backup=out+'/restorable-owner-project.zip';assert.equal(fs.existsSync(report.backup),false,'Preserve prior evidence');
 await download.saveAs(report.backup);assert.equal(await download.failure(),null);report.backupSHA256=digest(report.backup);report.backupBytes=fs.statSync(report.backup).size;report.checks.backupDownload=true;
 await page.locator('#toolboxQuick').click();let picker=page.waitForEvent('filechooser');
 await page.locator('[data-workbench="importbackup"]').click();let chooser=await picker;
 await request('/api/project/import?filename=restorable-owner-project.zip',()=>chooser.setFiles(report.backup));
 await page.waitForFunction(()=>document.querySelector('#statusMessage')?.textContent.startsWith('Imported '));
 }
 const current=await (await page.request.get(url+'api/projects')).json();report.restored=current.items.find(x=>x.id===current.current);
 assert.ok(report.restored);assert.notEqual(report.restored.path,report.copy.path);assert.match(report.restored.id,/-import-\d+$/);
 await page.reload();await page.locator('#bootOverlay').waitFor({state:'hidden'});
 const restoredRoot=path.dirname(report.restored.path),copyRoot=path.dirname(report.copy.path);
 const copyPage=JSON.parse(fs.readFileSync(copyRoot+'/pages/owner-media-pilot.json','utf8'));
 const restoredPage=JSON.parse(fs.readFileSync(restoredRoot+'/pages/owner-media-pilot.json','utf8'));assert.deepEqual(restoredPage,copyPage);
 const ledger=dir=>sourceLedger(dir).filter(([f])=>path.relative(dir,f)!=='project.json').map(([f,h])=>[path.relative(dir,f).replaceAll('\\','/'),h]).sort((a,b)=>a[0].localeCompare(b[0]));
 assert.deepEqual(ledger(restoredRoot),ledger(copyRoot));report.sourceFiles=ledger(copyRoot).length;
 const copyManifest=JSON.parse(fs.readFileSync(report.copy.path,'utf8')),restoredManifest=JSON.parse(fs.readFileSync(report.restored.path,'utf8'));
 assert.deepEqual({...restoredManifest,id:copyManifest.id},copyManifest);report.checks.restoredSourceIntegrity=true;
 await page.locator('#projectQuick').click();await page.locator('[data-page="page.owner-media-pilot"]').click();
 const copy=walk(restoredPage.components).find(c=>c.props?.text==='OWNER_AUTHORED_MEDIA_COPY — only in the independent pilot.');assert.ok(copy);
 await page.locator('[data-tab="layers"]').click();await page.locator('[data-component="'+copy.id+'"]').click();
 assert.equal(await page.locator('textarea[data-key="text"]').inputValue(),copy.props.text);
 const projects=await (await page.request.get(url+'api/projects')).json();assert.equal(projects.current,report.restored.id);
 const health=await (await page.request.get(url+'api/health')).json();assert.equal(health.valid,true);assert.equal(health.dangling.length,0);
 const preview=await page.request.get(url+'preview/owner-media-pilot/');assert.equal(preview.status(),200);assert.match(await preview.text(),/OWNER_AUTHORED_MEDIA_COPY/);report.checks.restoredReopenAndPreview=true;
 await page.locator('#toolboxQuick').click();const picker=page.waitForEvent('filechooser');await page.locator('[data-workbench="importbackup"]').click();const chooser=await picker;
 const invalid=page.waitForResponse(r=>r.url().includes('/api/project/import')&&r.request().method()==='POST');
 await chooser.setFiles({name:'invalid-pilot.zip',mimeType:'application/zip',buffer:Buffer.from('not a zip')});
 const rejected=await invalid;assert.ok(rejected.status()>=400);assert.match(await rejected.text(),/PROJECT_PACKAGE_INVALID_ZIP/);
 await page.waitForFunction(()=>document.querySelector('#statusMessage')?.textContent.includes('PROJECT_PACKAGE_INVALID_ZIP'));
 assert.equal((await (await page.request.get(url+'api/projects')).json()).current,report.restored.id);
 assert.deepEqual(JSON.parse(fs.readFileSync(restoredRoot+'/pages/owner-media-pilot.json','utf8')),restoredPage);report.checks.invalidBackupDoesNotMutate=true;
 assert.deepEqual(sourceLedger(root),baseline);report.checks.originalPilotSourceUnchanged=true;
 await page.screenshot({path:out+'/restored-editor.png'});assert.equal(report.errors.length,0);report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;process.exitCode=1;await page.screenshot({path:out+'/recovery-failure.png'}).catch(()=>{});}
finally{fs.writeFileSync(out+'/pilot-recovery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();}
