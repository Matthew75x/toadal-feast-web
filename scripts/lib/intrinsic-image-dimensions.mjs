import fs from 'node:fs';
import path from 'node:path';
import { normalizeBasePath } from '../wo001-pages-basepath.mjs';
import { isProtectedGameArtifact } from './protected-game-artifacts.mjs';

const IMG_RE=/<img\b[^>]*>/giu;
const SRC_RE=/\bsrc\s*=\s*(["'])(.*?)\1/iu;
const WIDTH_RE=/\bwidth\s*=\s*(?:(["'])(\d+)\1|(\d+))/iu;
const HEIGHT_RE=/\bheight\s*=\s*(?:(["'])(\d+)\1|(\d+))/iu;

function need(ok,message){if(!ok)throw new Error(message);}
function integerAttr(match){if(!match)return null;const v=Number(match[2]??match[3]);return Number.isSafeInteger(v)&&v>0?v:null;}
function u24le(data,offset){return data[offset]|(data[offset+1]<<8)|(data[offset+2]<<16);}

export function imageDimensions(bytes,extension=''){
  const ext=String(extension).toLowerCase();
  if((ext==='.png'||!ext)&&bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    need(width>0&&height>0,'Invalid PNG dimensions');return {width,height,format:'png'};
  }
  if((ext==='.webp'||!ext)&&bytes.length>=30&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
    let offset=12;
    while(offset+8<=bytes.length){
      const type=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8,end=start+size;
      need(end<=bytes.length,'Truncated WebP chunk');
      if(type==='VP8X'){
        need(size>=10,'Invalid VP8X header');const width=1+u24le(bytes,start+4),height=1+u24le(bytes,start+7);
        need(width>0&&height>0,'Invalid VP8X dimensions');return {width,height,format:'webp'};
      }
      if(type==='VP8L'){
        need(size>=5&&bytes[start]===0x2f,'Invalid VP8L header');const bits=bytes.readUInt32LE(start+1);
        const width=1+(bits&0x3fff),height=1+((bits>>>14)&0x3fff);
        need(width>0&&height>0,'Invalid VP8L dimensions');return {width,height,format:'webp'};
      }
      if(type==='VP8 '){
        need(size>=10&&bytes[start+3]===0x9d&&bytes[start+4]===0x01&&bytes[start+5]===0x2a,'Invalid VP8 header');
        const width=bytes.readUInt16LE(start+6)&0x3fff,height=bytes.readUInt16LE(start+8)&0x3fff;
        need(width>0&&height>0,'Invalid VP8 dimensions');return {width,height,format:'webp'};
      }
      offset=end+(size&1);
    }
    throw new Error('WebP has no supported dimension chunk');
  }
  if((ext==='.jpg'||ext==='.jpeg'||!ext)&&bytes.length>=4&&bytes[0]===0xff&&bytes[1]===0xd8){
    let offset=2;
    while(offset+4<=bytes.length){
      while(offset<bytes.length&&bytes[offset]!==0xff)offset++;
      while(offset<bytes.length&&bytes[offset]===0xff)offset++;
      if(offset>=bytes.length)break;
      const marker=bytes[offset++];
      if(marker===0xd9||marker===0xda)break;
      if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
      need(offset+2<=bytes.length,'Truncated JPEG segment');const size=bytes.readUInt16BE(offset);need(size>=2&&offset+size<=bytes.length,'Invalid JPEG segment');
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
        need(size>=7,'Invalid JPEG SOF');const height=bytes.readUInt16BE(offset+3),width=bytes.readUInt16BE(offset+5);
        need(width>0&&height>0,'Invalid JPEG dimensions');return {width,height,format:'jpeg'};
      }
      offset+=size;
    }
    throw new Error('JPEG has no dimension segment');
  }
  throw new Error('Unsupported image format for intrinsic dimensions: '+ext);
}

function safeFile(root,relative){
  need(typeof relative==='string'&&relative&&!relative.includes('\\')&&!relative.includes('\0'),'Invalid image path');
  const parts=relative.split('/');need(parts.every(p=>p&&p!=='.'&&p!=='..'),'Unsafe image path: '+relative);
  const file=path.join(root,...parts),resolved=path.resolve(file),base=path.resolve(root);
  need(resolved.startsWith(base+path.sep),'Image path escapes export: '+relative);
  const st=fs.lstatSync(resolved);need(st.isFile()&&!st.isSymbolicLink(),'Image is not a regular file: '+relative);
  return resolved;
}
function sourcePath(src,pageRel,basePath){
  need(!/[?#\u0000-\u001f]/u.test(src),'Image src must be a plain local path: '+src);
  need(!/^[a-z][a-z0-9+.-]*:/iu.test(src)&&!src.startsWith('//'),'External image cannot receive derived intrinsic dimensions: '+src);
  const base=normalizeBasePath(basePath);
  let rel;
  if(src.startsWith(base))rel=src.slice(base.length);
  else if(src.startsWith('/'))rel=src.slice(1);
  else rel=path.posix.normalize(path.posix.join(path.posix.dirname(pageRel),src));
  need(rel&&!rel.startsWith('../')&&!path.posix.isAbsolute(rel),'Image path escapes website: '+src);
  return rel;
}
function addDimensions(tag,width,height,hasWidth,hasHeight){
  const close=tag.endsWith('/>')?2:1,additions=[];
  if(!hasWidth)additions.push("width='"+width+"'");
  if(!hasHeight)additions.push("height='"+height+"'");
  return tag.slice(0,-close)+(additions.length?' '+additions.join(' '):'')+tag.slice(-close);
}

export function projectIntrinsicImageDimensions(html,root,pageRel,basePath='/toadal-feast-web/',{assetCache=new Map(),dimensions=[],dynamic=[]}={}){
 let changed=0;
  const transformed=html.replace(IMG_RE,tag=>{
          const wMatch=WIDTH_RE.exec(tag),hMatch=HEIGHT_RE.exec(tag);
          if(wMatch&&hMatch)return tag;
          const srcMatch=SRC_RE.exec(tag);
          if(!srcMatch){
            need(/\bdata-reader-page\b/u.test(tag),'Dimensionless image without src is not an approved dynamic reader image: '+pageRel);
            dynamic.push({page:pageRel,reason:'runtime-reader-src'});return tag;
          }
          const src=srcMatch[2],rel=sourcePath(src,pageRel,basePath);
          const ext=path.extname(rel).toLowerCase();
          need(['.png','.webp','.jpg','.jpeg'].includes(ext),'Unsupported local image type: '+rel);
          let dim=assetCache.get(rel);
          if(!dim){
            const file=safeFile(root,rel),bytes=fs.readFileSync(file);
            dim={...imageDimensions(bytes,ext),path:rel,bytes:bytes.length};assetCache.set(rel,dim);dimensions.push(dim);
          }
          const authoredW=integerAttr(wMatch),authoredH=integerAttr(hMatch);
          need(!wMatch||authoredW,'Invalid authored image width: '+pageRel);
          need(!hMatch||authoredH,'Invalid authored image height: '+pageRel);
          let width=authoredW,height=authoredH;
          if(width&&!height)height=Math.max(1,Math.round(width*dim.height/dim.width));
          else if(height&&!width)width=Math.max(1,Math.round(height*dim.width/dim.height));
          else if(!width&&!height){width=dim.width;height=dim.height;}
          const result=addDimensions(tag,width,height,!!wMatch,!!hMatch);changed++;return result;
        });
 return {html:transformed,images:changed};
}

export function addIntrinsicImageDimensions(exportRoot,basePath='/toadal-feast-web/'){
  const root=path.resolve(exportRoot),updates=[],assetCache=new Map(),dimensions=[],dynamic=[];
  function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const full=path.join(dir,entry.name);need(!entry.isSymbolicLink(),'Export contains symlink: '+full);
      if(entry.isDirectory())walk(full);
      else if(entry.isFile()&&entry.name.toLowerCase().endsWith('.html')){
        const pageRel=path.relative(root,full).replaceAll('\\','/');
        if(isProtectedGameArtifact(pageRel))continue;
        const original=fs.readFileSync(full,'utf8');let changed=0;
        const projected=projectIntrinsicImageDimensions(original,root,pageRel,basePath,{assetCache,dimensions,dynamic});
        const transformed=projected.html;changed=projected.images;
        if(changed)updates.push({file:full,html:transformed,page:pageRel,images:changed});
      }
    }
  }
  walk(root);
  need(dynamic.length<=1&&dynamic.every(item=>item.page==='reader/index.html'),'Unexpected dynamic/no-src image inventory');
  for(const update of updates)fs.writeFileSync(update.file,update.html,'utf8');
  return {schema:'toadal-feast.intrinsic-image-dimensions.v1',pagesUpdated:updates.length,imagesUpdated:updates.reduce((n,x)=>n+x.images,0),
    uniqueAssets:dimensions.length,dynamicImagesSkipped:dynamic.length,dynamic,assets:dimensions.sort((a,b)=>a.path.localeCompare(b.path)),
    policy:'Only local static PNG/WebP/JPEG src values; authored dimensions preserved; reader runtime image intentionally untouched'};
}