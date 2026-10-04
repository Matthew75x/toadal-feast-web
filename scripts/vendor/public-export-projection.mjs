import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EDITOR_ATTRIBUTES=new Set(['data-studio-edit-field','data-studio-locked','data-studio-sdk-part','data-studio-sdk-field','data-studio-sdk-inline']);
const LOCATOR_ATTRIBUTE='data-studio-component';
const RUNTIME_ATTRIBUTE='data-toadal-node';
const EDITOR_CODE_MARKERS=/data-studio-(?:edit-field|locked|component|sdk-part|sdk-field|sdk-inline)|\b(?:studioEditor|studioSelectedComponent|studioCanvas|__TOADAL_STUDIO_EDITOR__)\b/i;
                                                                                                              
                                                                                                                    

function listFiles(root       ,out         =[])         {
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    const full=path.join(root,entry.name);
    if(entry.isSymbolicLink())throw new Error('PUBLIC_EXPORT_SYMLINK_NOT_ALLOWED');
    if(entry.isDirectory())listFiles(full,out);else if(entry.isFile())out.push(full);
  }
  return out.sort((a,b)=>a.localeCompare(b));
}
function relative(root       ,file       ){return path.relative(root,file).split(path.sep).join('/');}
function pathSegments(file       ){return file.replaceAll('\\','/').split('/').filter(Boolean).map(x=>x.toLowerCase());}
function gamePackageRoot(file       ,embedded=false)            {
  const s=pathSegments(file);
  for(let i=0;i<s.length;i++){
    if(s[i]==='public'&&s[i+1]==='games')return s.slice(0,Math.min(i+3,s.length)).join('/');
    if((s[i]==='game-packages'||s[i]==='cartridges')&&s[i+1])return s.slice(0,i+2).join('/');
    if(embedded&&s[i]==='games'&&s[i+1])return s.slice(0,i+2).join('/');
  }
  return null;
}
function tagEnd(html       ,start       ){
  let quote='';
  for(let i=start+1;i<html.length;i++){const c=html[i];if(quote){if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='>')return i+1;}
  return html.length;
}
function parseAttributes(tag       ){
  const m=/^<\s*([A-Za-z][\w:-]*)/.exec(tag);if(!m||/^<\s*\//.test(tag))return{name:'',attributes:[]               };
  const attributes            =[];let i=m[0].length;
  while(i<tag.length){
    const leadingStart=i;while(i<tag.length&&/\s/.test(tag[i]))i++;
    if(i>=tag.length||tag[i]==='>'||tag[i]==='/')break;
    const nameStart=i;while(i<tag.length&&!/[\s=/>]/.test(tag[i]))i++;
    if(nameStart===i){i++;continue;}
    const nameEnd=i,name=tag.slice(nameStart,nameEnd);while(i<tag.length&&/\s/.test(tag[i]))i++;
    let value            =null;
    if(tag[i]==='='){i++;while(i<tag.length&&/\s/.test(tag[i]))i++;if(tag[i]==='"'||tag[i]==="'"){const q=tag[i++],start=i;while(i<tag.length&&tag[i]!==q)i++;value=tag.slice(start,i);if(i<tag.length)i++;}else{const start=i;while(i<tag.length&&!/[\s>]/.test(tag[i]))i++;value=tag.slice(start,i);}}
    attributes.push({name,value,leadingStart,nameStart,nameEnd,end:i});
  }
  return{name:m[1].toLowerCase(),attributes};
}
function tokenizeHtml(html       )           {
  const parts           =[];let i=0;
  while(i<html.length){
    const start=html.indexOf('<',i);if(start<0){parts.push({kind:'text',raw:html.slice(i)});break;}
    if(start>i)parts.push({kind:'text',raw:html.slice(i,start)});
    if(html.startsWith('<!--',start)){const close=html.indexOf('-->',start+4),end=close<0?html.length:close+3;parts.push({kind:'text',raw:html.slice(start,end)});i=end;continue;}
    const end=tagEnd(html,start),raw=html.slice(start,end),parsed=parseAttributes(raw),closing=/^<\s*\//.test(raw);
    parts.push({kind:'tag',raw,name:parsed.name,closing,attributes:parsed.attributes});i=end;
    if(!closing&&(parsed.name==='script'||parsed.name==='style')){
      const closeRe=new RegExp(`</${parsed.name}\\s*>`,'ig');closeRe.lastIndex=i;const match=closeRe.exec(html),contentEnd=match?.index??html.length;
      parts.push({kind:parsed.name                    ,raw:html.slice(i,contentEnd)});i=contentEnd;
    }
  }
  return parts;
}
function attrMap(attrs                      ){return new Map((attrs||[]).map(a=>[a.name.toLowerCase(),a.value]));}
function localUrlPath(raw       ,root       )            {
  try{const u=new URL(raw,'https://public-export.invalid');if(u.origin!=='https://public-export.invalid')return null;const decoded=decodeURIComponent(u.pathname).replace(/^\/+/,''),full=path.resolve(root,decoded);if(full!==root&&!full.startsWith(root+path.sep))return null;return relative(root,full);}catch{return null;}
}
function editorScriptReference(src       ){try{return /^(?:studio|studio-editor|editor)(?:[._-][a-z0-9_-]+)?\.m?js$/i.test(path.posix.basename(new URL(src,'https://public-export.invalid').pathname));}catch{return false;}}
function executableScript(attrs                      ){const type=(attrMap(attrs).get('type')||'').trim().toLowerCase();return !type||type==='module'||type==='text/javascript'||type==='application/javascript'||type==='application/ecmascript'||type==='text/ecmascript';}
function isGeneratedRuntime(source       ){return source.includes('toadal-studio-vars:')&&source.includes('const defaults=')&&source.includes('const applyBindings=');}
function auditScript(source       ,knownRuntime=false){if(!knownRuntime&&EDITOR_CODE_MARKERS.test(source))throw new Error('PUBLIC_EXPORT_UNKNOWN_EDITOR_CODE');}
function rewriteRuntimeJs(source       ){return source.replaceAll(LOCATOR_ATTRIBUTE,RUNTIME_ATTRIBUTE).replace(/\bdataset\.studioComponent\b/g,'dataset.toadalNode');}
function rewriteCssSelectors(css       ){return css.replace(/(\[\s*)data-studio-component(?=\s*(?:=|\]))/gi,`$1${RUNTIME_ATTRIBUTE}`);}
function rewriteStartTag(tag       ,attrs                      ){
  const list=attrs||[],existing=list.find(a=>a.name.toLowerCase()===RUNTIME_ATTRIBUTE),locator=list.find(a=>a.name.toLowerCase()===LOCATOR_ATTRIBUTE);
  if(existing&&locator&&existing.value!==locator.value)throw new Error('PUBLIC_EXPORT_NODE_ID_CONFLICT');
  let out='',cursor=0;
  for(const a of list){const key=a.name.toLowerCase();if(EDITOR_ATTRIBUTES.has(key)||(key===LOCATOR_ATTRIBUTE&&!!existing)){out+=tag.slice(cursor,a.leadingStart);cursor=a.end;continue;}out+=tag.slice(cursor,a.nameStart)+(key===LOCATOR_ATTRIBUTE?RUNTIME_ATTRIBUTE:tag.slice(a.nameStart,a.nameEnd))+tag.slice(a.nameEnd,a.end);cursor=a.end;}
  return out+tag.slice(cursor);
}
function rewriteHtml(html       ){return tokenizeHtml(html).map(part=>{if(part.kind==='tag'&&!part.closing)return rewriteStartTag(part.raw,part.attributes);if(part.kind==='style')return rewriteCssSelectors(part.raw);if(part.kind==='script'&&isGeneratedRuntime(part.raw))return rewriteRuntimeJs(part.raw);return part.raw;}).join('');}
function publicPageSet(paths         ){return new Set(paths.map(x=>x.replaceAll('\\','/').replace(/^\/+/,'')));}
function isWithin(rel       ,dir       ){const r=rel.toLowerCase(),d=dir.toLowerCase();return r===d||r.startsWith(d+'/');}
function pathIsProtected(rel       ,pages            ,forcedRoots            ){
  if([...forcedRoots].some(root=>isWithin(rel,root)))return true;
  if(gamePackageRoot(rel,false))return true;
  const s=pathSegments(rel),i=s.indexOf('games');if(i>=0&&s[i+1])return !pages.has(rel);
  return false;
}
function referencedGameRoots(root       ,files         ,pages            ){
  const roots=new Set        ();
  for(const file of files){
    if(path.extname(file).toLowerCase()!=='.html')continue;
    const rel=relative(root,file),staticRoot=gamePackageRoot(rel,false);if(staticRoot)roots.add(staticRoot);
    for(const part of tokenizeHtml(fs.readFileSync(file,'utf8'))){if(part.kind!=='tag'||part.closing)continue;const attrs=attrMap(part.attributes),tag=part.name||'';if(!['iframe','embed','object','script'].includes(tag))continue;const ref=attrs.get(tag==='object'?'data':'src');if(!ref)continue;const referenced=localUrlPath(ref,root);if(!referenced)continue;const candidate=gamePackageRoot(referenced,['iframe','embed','object'].includes(tag));if(candidate&&!pages.has(referenced))roots.add(candidate);}
  }
  return roots;
}
function hashProtectedFiles(root       ,files         ,pages            ,forcedRoots            ){
  const hashes=new Map               ();for(const file of files){const rel=relative(root,file);if(pathIsProtected(rel,pages,forcedRoots))hashes.set(rel,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));}return hashes;
}
function restoreProtectedFilesFromSource(root       ,files         ,pages            ,forcedRoots            ,sourceRoots         ){
  if(!sourceRoots.length)return;
  const plans                                    =[];
  for(const target of files){
    const rel=relative(root,target);if(!pathIsProtected(rel,pages,forcedRoots))continue;
    let source                 ;
    for(const candidateRoot of sourceRoots){
      const candidate=path.resolve(candidateRoot,rel);
      if(candidate!==candidateRoot&&!candidate.startsWith(candidateRoot+path.sep))continue;
      if(fs.existsSync(candidate)){const stat=fs.lstatSync(candidate);if(stat.isSymbolicLink()||!stat.isFile())throw new Error('PUBLIC_EXPORT_PROTECTED_SOURCE_INVALID '+rel);source=candidate;break;}
    }
    if(!source)throw new Error('PUBLIC_EXPORT_PROTECTED_SOURCE_MISSING '+rel);
    const bytes=fs.readFileSync(source);
    if(!fs.readFileSync(target).equals(bytes))plans.push({target,bytes});
  }
  for(const plan of plans)fs.writeFileSync(plan.target,plan.bytes);
}
function assertHashes(root       ,hashes                   ){
  for(const [rel,expected]of hashes){const file=path.resolve(root,rel);if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==expected)throw new Error(`PUBLIC_EXPORT_PROTECTED_GAME_CHANGED ${rel}`);}
}

export function transformPublicExport(exportDirectory       ,publicPages         =[],protectedSourceRoots         =[]){
  const root=path.resolve(exportDirectory);if(!fs.statSync(root).isDirectory())throw new TypeError('PUBLIC_EXPORT_NOT_DIRECTORY');
  const files=listFiles(root),pages=publicPageSet(publicPages),forcedRoots=referencedGameRoots(root,files,pages),protectedHashes=hashProtectedFiles(root,files,pages,forcedRoots);
  restoreProtectedFilesFromSource(root,files,pages,forcedRoots,protectedSourceRoots.map(source=>path.resolve(source)));
  protectedHashes.clear();for(const [rel,hash]of hashProtectedFiles(root,files,pages,forcedRoots))protectedHashes.set(rel,hash);
  const protectedTextFiles=[...protectedHashes.keys()].filter(rel=>/\.(?:html|css)$/i.test(rel)),plans                                    =[];
  for(const file of files){
    const rel=relative(root,file),ext=path.extname(file).toLowerCase();if(pathIsProtected(rel,pages,forcedRoots))continue;
    if(!['.html','.css','.js','.mjs'].includes(ext))continue;
    if((ext==='.js'||ext==='.mjs')&&editorScriptReference(rel))throw new Error('PUBLIC_EXPORT_UNKNOWN_EDITOR_CODE');
    const source=fs.readFileSync(file,'utf8');let content=source;
    if(ext==='.html'){
      const parts=tokenizeHtml(source);
      for(let i=0;i<parts.length;i++){
        const part=parts[i];
        if(part.kind==='tag'&&!part.closing){
          for(const attribute of part.attributes||[])if(/^on[a-z]+$/i.test(attribute.name)&&attribute.value)auditScript(attribute.value);
          if(part.name==='script'&&executableScript(part.attributes)){const src=attrMap(part.attributes).get('src');if(src&&editorScriptReference(src))throw new Error('PUBLIC_EXPORT_UNKNOWN_EDITOR_CODE');}
        }
        if(part.kind==='script'&&executableScript(parts[i-1]?.attributes))auditScript(part.raw,isGeneratedRuntime(part.raw));
      }
      content=rewriteHtml(source);
    }else if(ext==='.css')content=rewriteCssSelectors(source);
    else{const generated=isGeneratedRuntime(source);auditScript(source,generated);if(generated)content=rewriteRuntimeJs(source);}
    if(content!==source)plans.push({file,content});
  }
  for(const plan of plans)fs.writeFileSync(plan.file,plan.content,'utf8');
  assertHashes(root,protectedHashes);
  return{filesTransformed:plans.length,protectedFiles:protectedHashes.size,protectedTextFiles,protectedHashes};
}
export function assertPublicExportProtectedFiles(exportDirectory       ,result                                         ){assertHashes(path.resolve(exportDirectory),result.protectedHashes);}

export {rewriteHtml as projectPublicHtml};
