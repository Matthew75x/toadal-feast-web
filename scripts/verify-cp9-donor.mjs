#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(process.argv[2] || '.');
const manifestPath = path.join(repo, 'docs', 'implementation', 'CP9_DONOR_MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
const donorRoot = path.resolve(process.argv[3] || manifest.rootPath);
const archivePath = path.resolve(process.argv[4] || manifest.archivePath);
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const failures = [];
const verified = [];
function verify(label,file,expectedHash,expectedBytes=null){
  if(!fs.existsSync(file)){failures.push(`${label}: missing ${file}`);return}
  const st=fs.statSync(file);
  const hash=sha256(file);
  if(expectedBytes!==null&&st.size!==expectedBytes)failures.push(`${label}: bytes ${st.size} != ${expectedBytes}`);
  if(expectedHash&&hash!==expectedHash)failures.push(`${label}: sha256 ${hash} != ${expectedHash}`);
  if((expectedBytes===null||st.size===expectedBytes)&&(!expectedHash||hash===expectedHash))verified.push(label);
}

verify('archive',archivePath,manifest.archiveSha256);
for(const entry of manifest.entries){
  verify(entry.path,path.join(donorRoot,...entry.path.split('/')),entry.sha256,entry.bytes);
}
let distFiles=0,distBytes=0;
const dist=path.join(donorRoot,'dist');
if(!fs.existsSync(dist)) failures.push('dist: missing');
else {
  const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.isFile()){distFiles++;distBytes+=fs.statSync(f).size}}};
  walk(dist);
  if(distFiles!==manifest.distFiles)failures.push(`dist files ${distFiles} != ${manifest.distFiles}`);
  if(distBytes!==manifest.distBytes)failures.push(`dist bytes ${distBytes} != ${manifest.distBytes}`);
  if(distFiles===manifest.distFiles&&distBytes===manifest.distBytes)verified.push('dist aggregate');
}
console.log(JSON.stringify({schema:'toadal-feast.cp9-donor-verification.v1',archivePath,donorRoot,verified:verified.length,distFiles,distBytes,failures,pass:failures.length===0},null,2));
if(failures.length)process.exitCode=1;
