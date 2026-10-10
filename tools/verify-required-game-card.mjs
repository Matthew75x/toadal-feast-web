#!/usr/bin/env node
// Standalone TOADAL website CARD-02 gate. Asset completeness only, NOT TCS/public approval.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const assert=(condition,reason)=>{if(!condition)throw new Error(reason);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash64=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function readWebpDimensions(b){
  assert(b.length>=30&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','invalid WebP header');
  assert(b.readUInt32LE(4)+8===b.length,'invalid WebP RIFF length');
  for(let at=12;at+8<=b.length;){
    const kind=b.toString('ascii',at,at+4),len=b.readUInt32LE(at+4),start=at+8;
    assert(start+len<=b.length,'invalid WebP chunk');
    if(kind==='VP8X'&&len>=10) return {width:1+b[start+4]+(b[start+5]<<8)+(b[start+6]<<16),height:1+b[start+7]+(b[start+8]<<8)+(b[start+9]<<16)};
    if(kind==='VP8 '&&len>=10){
      assert(b[start+3]===0x9d&&b[start+4]===0x01&&b[start+5]===0x2a,'invalid VP8 frame');
      return {width:b.readUInt16LE(start+6)&0x3fff,height:b.readUInt16LE(start+8)&0x3fff};
    }
    if(kind==='VP8L'&&len>=5){
      assert(b[start]===0x2f,'invalid VP8L frame');
      return {width:1+(b[start+1]|((b[start+2]&63)<<8)),height:1+((b[start+2]>>6)|(b[start+3]<<2)|((b[start+4]&15)<<10))};
    }
    at=start+len+(len%2);
  }
  throw new Error('missing WebP image payload');
}
function readPngDimensions(b){
  assert(b.length>=24&&b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),'not PNG');
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}
const goodRatio=i=>Number.isInteger(i?.width)&&Number.isInteger(i?.height)&&i.width>=1280&&i.height>=720&&Math.abs(i.width/i.height-16/9)<.025;
export function checkGameCard(root,sourceFile){
  root=path.resolve(root);
  const m=json(path.join(root,'cartridge.json')),a=json(path.join(root,'card-authority.json'));
  assert(m.schemaVersion===1,'expected website schemaVersion 1');
  assert(typeof m.id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id),'missing/invalid game id');
  assert(typeof m.displayName==='string'&&m.displayName.trim(),'missing displayName');
  assert(m.poster==='poster.webp','required root poster.webp absent from website manifest');
  assert(m.entry==='index.html'&&fs.statSync(path.join(root,'index.html')).isFile(),'index.html entry missing');
  assert(a.schema==='toadal.game-card-authority/1'&&a.gameId===m.id&&a.displayName===m.displayName,'card authority identity mismatch');
  assert(['OWNER_DESIGNATED','OWNER_APPROVED'].includes(a.ownerArtworkApproval?.status),'owner card approval missing');
  assert(a.poster?.path===m.poster&&a.poster.format==='webp'&&hash64(a.poster.sha256),'card poster record invalid');
  assert(a.source?.format==='png'&&hash64(a.source.sha256),'source art provenance missing');
  assert(a.accessibility?.entireCardClickable===true&&a.accessibility?.decorativeButtonOverlay===false,'whole clickable tile contract missing');
  assert(typeof a.accessibility?.alt==='string'&&a.accessibility.alt.trim().length>=35,'accessible alt text missing');
  assert(a.poster.fit==='contain','card may not be cropped');
  assert(a.publication?.publicState===m.publicState,'publication state disagreement');
  const p=path.join(root,'poster.webp');
  const stat=fs.lstatSync(p);
  assert(stat.isFile()&&!stat.isSymbolicLink(),'poster must be regular file');
  const image=fs.readFileSync(p);
  assert(image.length<=1500000,'poster exceeds 1.5MB');
  assert(sha(image)===a.poster.sha256,'poster SHA mismatch');
  const dims=readWebpDimensions(image);
  assert(goodRatio(dims)&&dims.width===a.poster.width&&dims.height===a.poster.height,'poster dimension/aspect mismatch');
  assert(goodRatio(a.source)&&Math.abs(a.source.width/a.source.height-dims.width/dims.height)<.01,'source/poster crop ratio mismatch');
  if(sourceFile){
    const original=fs.readFileSync(sourceFile),s=readPngDimensions(original);
    assert(sha(original)===a.source.sha256&&s.width===a.source.width&&s.height===a.source.height,'approved PNG source mismatch');
  }
  return {status:'CARD_GATE_PASS',gameId:m.id,posterSha256:sha(image),sourceSha256:a.source.sha256,publicState:m.publicState,qualification:'NOT VERIFIED BY THIS CHECKER'};
}
const [arg,...rest]=process.argv.slice(2);
if(!arg){ console.error('CARD_GATE_FAIL: missing game directory; usage: node tools/verify-required-game-card.mjs GAME_DIRECTORY [--source ORIGINAL.png]'); process.exitCode=1; }
else {
  try{
    assert(rest.length===0||(rest.length===2&&rest[0]==='--source'),'usage: node tools/verify-required-game-card.mjs GAME_DIRECTORY [--source ORIGINAL.png]');
    console.log(JSON.stringify(checkGameCard(arg,rest[1]),null,2));
  }catch(e){console.error('CARD_GATE_FAIL:',e.message);process.exitCode=1;}
}
