import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { imageDimensions, addIntrinsicImageDimensions } from './lib/intrinsic-image-dimensions.mjs';

function png(width,height){
  const b=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(width,16);b.writeUInt32BE(height,20);return b;
}
function webp(width,height){
  const b=Buffer.alloc(30);b.write('RIFF',0);b.writeUInt32LE(22,4);b.write('WEBP',8);b.write('VP8X',12);b.writeUInt32LE(10,16);
  const w=width-1,h=height-1;b[24]=w&255;b[25]=(w>>8)&255;b[26]=(w>>16)&255;b[27]=h&255;b[28]=(h>>8)&255;b[29]=(h>>16)&255;return b;
}
function jpeg(width,height){
  const b=Buffer.alloc(23);b[0]=0xff;b[1]=0xd8;b[2]=0xff;b[3]=0xc0;b.writeUInt16BE(17,4);b[6]=8;b.writeUInt16BE(height,7);b.writeUInt16BE(width,9);b[11]=3;return b;
}
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-img-dims-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.mkdirSync(path.join(root,'sub'),{recursive:true});fs.mkdirSync(path.join(root,'reader'),{recursive:true});
  fs.mkdirSync(path.join(root,'public','games','x'),{recursive:true});
  fs.writeFileSync(path.join(root,'assets','a.webp'),webp(640,360));fs.writeFileSync(path.join(root,'assets','b.png'),png(300,200));
  fs.writeFileSync(path.join(root,'index.html'),"<img src='/toadal-feast-web/assets/a.webp' alt='A'><img src='/toadal-feast-web/assets/b.png' width='150' alt='B'>");
  fs.writeFileSync(path.join(root,'sub','index.html'),"<img src='../assets/a.webp' height='180' alt='A2'>");
  fs.writeFileSync(path.join(root,'reader','index.html'),"<img data-reader-page alt=''>");
  fs.writeFileSync(path.join(root,'public','games','x','index.html'),"<img src='/toadal-feast-web/assets/a.webp' alt='protected'>");
  return root;
}
test('dimension parser reads PNG, WebP VP8X and JPEG headers without decoding images',()=>{
  assert.deepEqual(imageDimensions(png(300,200),'.png'),{width:300,height:200,format:'png'});
  assert.deepEqual(imageDimensions(webp(640,360),'.webp'),{width:640,height:360,format:'webp'});
  assert.deepEqual(imageDimensions(jpeg(1024,768),'.jpg'),{width:1024,height:768,format:'jpeg'});
});
test('adds natural dimensions and preserves authored size ratio',t=>{
  const root=fixture(t),result=addIntrinsicImageDimensions(root,'/toadal-feast-web/');
  assert.equal(result.imagesUpdated,3);assert.equal(result.pagesUpdated,2);assert.equal(result.uniqueAssets,2);assert.equal(result.dynamicImagesSkipped,1);
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(home,/a\.webp' alt='A' width='640' height='360'/);
  assert.match(home,/b\.png' width='150' alt='B' height='100'/);
  const sub=fs.readFileSync(path.join(root,'sub','index.html'),'utf8');
  assert.match(sub,/a\.webp' height='180' alt='A2' width='320'/);
});
test('protected game HTML and dynamic reader image remain untouched',t=>{
  const root=fixture(t),before=fs.readFileSync(path.join(root,'public/games/x/index.html'),'utf8');
  addIntrinsicImageDimensions(root,'/toadal-feast-web/');
  assert.equal(fs.readFileSync(path.join(root,'public/games/x/index.html'),'utf8'),before);
  assert.equal(fs.readFileSync(path.join(root,'reader/index.html'),'utf8'),"<img data-reader-page alt=''>");
});
test('existing complete authored dimensions are preserved verbatim',t=>{
  const root=fixture(t),file=path.join(root,'index.html');
  fs.writeFileSync(file,"<img src='/toadal-feast-web/assets/a.webp' width='10' height='20' alt='custom'>");
  const result=addIntrinsicImageDimensions(root,'/toadal-feast-web/');assert.equal(result.imagesUpdated,1);
  // sub page is the one update; complete authored home is untouched.
  assert.equal(fs.readFileSync(file,'utf8'),"<img src='/toadal-feast-web/assets/a.webp' width='10' height='20' alt='custom'>");
});
test('unknown no-src images fail closed before writes',t=>{
  const root=fixture(t),file=path.join(root,'sub','index.html');fs.writeFileSync(file,"<img alt='unknown'>");
  const before=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.throws(()=>addIntrinsicImageDimensions(root,'/toadal-feast-web/'),/Dimensionless image without src/);
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),before);
});
test('external, query-bearing, unsupported and missing sources fail closed',t=>{
  for(const [src,pattern] of [['https://example.invalid/x.png',/External image/],['/toadal-feast-web/assets/a.webp?v=1',/plain local path/],['/toadal-feast-web/assets/a.svg',/Unsupported local image type/],['/toadal-feast-web/assets/missing.webp',/ENOENT/]]){
    const root=fixture(t),file=path.join(root,'index.html');fs.writeFileSync(file,"<img src='"+src+"' alt='x'>");
    assert.throws(()=>addIntrinsicImageDimensions(root,'/toadal-feast-web/'),pattern,src);
  }
});
test('invalid image header refuses instead of inventing dimensions',t=>{
  const root=fixture(t);fs.writeFileSync(path.join(root,'assets','a.webp'),Buffer.from('not-webp'));
  assert.throws(()=>addIntrinsicImageDimensions(root,'/toadal-feast-web/'),/Unsupported image format/);
});