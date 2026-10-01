#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo=path.resolve(process.argv[2]||'.');
const base=path.join(repo,'studio-project','toadal-feast-website','public','games');
const ids=['wicked-bites','claw-feed-gulper'];
const failures=[],warnings=[],results=[];
const sha256=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>{
 const out=[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory())out.push(...walk(p)); else if(e.isFile())out.push(p)} return out;
};
for(const id of ids){
 const dir=path.join(base,id),manifestPath=path.join(dir,'cartridge.json');
 if(!fs.existsSync(manifestPath)){failures.push(id+': missing cartridge.json');continue}
 const m=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
 const required=['schemaVersion','id','displayName','version','publicState','entry','orientation','inputs','storage','protocol','source'];
 for(const key of required) if(m[key]===undefined||m[key]===null) failures.push(`${id}: missing manifest key ${key}`);
 if(m.schemaVersion!==1)failures.push(`${id}: schemaVersion must be 1`);
 if(m.id!==id)failures.push(`${id}: manifest id mismatch ${m.id}`);
 if(!['PUBLIC','PREVIEW','PLANNED','COMING_SOON','DISABLED'].includes(m.publicState))failures.push(`${id}: invalid publicState`);
 if(m.publicState==='PUBLIC' && !m.hostIntegration?.messageBridgeCertified) failures.push(`${id}: PUBLIC requires certified host bridge`);
 if(m.protocol?.name!=='toadal.game'||m.protocol?.version!==1)failures.push(`${id}: protocol mismatch`);
 const entry=path.join(dir,m.entry);
 if(!fs.existsSync(entry))failures.push(`${id}: missing entry ${m.entry}`);
 const poster=m.poster?path.join(dir,m.poster):null;
 if(poster&&!fs.existsSync(poster))failures.push(`${id}: missing poster ${m.poster}`);
 const files=walk(dir);
 const bytes=files.reduce((n,p)=>n+fs.statSync(p).size,0);
 results.push({id,state:m.publicState,files:files.length,bytes,entrySha256:fs.existsSync(entry)?sha256(entry):null,storage:m.storage?.namespace,hostBridgeCertified:Boolean(m.hostIntegration?.messageBridgeCertified)});
}
const wicked=JSON.parse(fs.readFileSync(path.join(base,'wicked-bites','cartridge.json'),'utf8'));
const wickedDir=path.join(base,'wicked-bites');
const wickedEntry=path.join(wickedDir,'index.html');
const wickedCurrentHash=sha256(wickedEntry);
const intakePath=path.join(repo,'docs','review','WO-002','cartridge-intake','intake-evidence.json');
const intake=fs.existsSync(intakePath)?JSON.parse(fs.readFileSync(intakePath,'utf8').replace(/^\uFEFF/,'')):null;
const wickedDonor=intake?.cartridges?.find(x=>x.id==='wicked-bites');
if(!wickedDonor||wickedDonor.entry?.sha256!==wicked.source.sourceHash)failures.push('wicked-bites: qualified donor hash evidence does not match cartridge source authority');
if(wicked.hostIntegration?.adapter){
 const adapter=path.join(wickedDir,wicked.hostIntegration.adapter);
 if(!fs.existsSync(adapter))failures.push('wicked-bites: declared host adapter is missing');
 else if(sha256(adapter)!==wicked.hostIntegration.adapterSha256)failures.push('wicked-bites: host adapter hash mismatch');
 if(wickedCurrentHash!==wicked.hostIntegration.adaptedEntrySha256)failures.push('wicked-bites: adapted entry hash mismatch');
 if(!fs.readFileSync(wickedEntry,'utf8').includes(wicked.hostIntegration.adapter))failures.push('wicked-bites: adapted entry does not load declared host adapter');
}else if(wickedCurrentHash!==wicked.source.sourceHash){
 failures.push('wicked-bites: imported entry hash differs from exact qualified donor without a declared adapter');
}
const wickedText=fs.readFileSync(wickedEntry,'utf8');
if(/<(?:script|link)[^>]+(?:src|href)\s*=\s*["']https?:/i.test(wickedText))warnings.push('wicked-bites: external http(s) dependency detected');

const clawDir=path.join(base,'claw-feed-gulper');
for(const forbidden of ['PLAYER_SERVER.ps1','START_CLAW.cmd','build-manifest.json']) if(fs.existsSync(path.join(clawDir,forbidden))) failures.push('claw-feed-gulper: source-only helper leaked into cartridge: '+forbidden);
const clawIndex=path.join(clawDir,'index.html');
const clawManifest=JSON.parse(fs.readFileSync(path.join(clawDir,'cartridge.json'),'utf8'));
if(sha256(clawIndex)!==clawManifest.source.sourceHash)failures.push('claw-feed-gulper: imported index hash differs from exact qualified donor');
const swPath=path.join(clawDir,'sw.js');
if(!fs.existsSync(swPath))failures.push('claw-feed-gulper: missing service worker');
else{
 const sw=fs.readFileSync(swPath,'utf8');
 const paths=[...sw.matchAll(/"\.\/([^"]+)"/g)].map(m=>m[1]).filter(x=>x);
 const missing=[...new Set(paths)].filter(rel=>!fs.existsSync(path.join(clawDir,...rel.split('/'))));
 if(missing.length)failures.push('claw-feed-gulper: service worker precache missing '+missing.join(', '));
 if(/scope\s*:/i.test(sw)) warnings.push('claw-feed-gulper: explicit SW scope found; verify cartridge-only scope');
}
const clawMain=fs.readFileSync(clawIndex,'utf8');
if(!/serviceWorker\.register\(['"]\.\/sw\.js['"]\)/.test(clawMain) && !walk(clawDir).some(p=>p.endsWith('main.js')&&/serviceWorker\.register\(['"]\.\/sw\.js['"]\)/.test(fs.readFileSync(p,'utf8')))) failures.push('claw-feed-gulper: relative ./sw.js registration not found');

console.log(JSON.stringify({schema:'toadal-feast.wo002-cartridge-intake.v1',results,failures,warnings,summary:{cartridges:results.length,failures:failures.length,warnings:warnings.length}},null,2));
if(failures.length)process.exitCode=1;
