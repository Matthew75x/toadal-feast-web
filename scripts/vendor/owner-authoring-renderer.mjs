// Versioned semantic presentation extension. Existing v1 projects remain valid.
export const OWNER_AUTHORING_VERSION=1;
const tags=new Set('section article div nav aside header footer main p h1 h2 h3 h4 h5 h6 span strong em b i small a button img input label select option textarea form fieldset legend ul ol li dl dt dd figure figcaption blockquote cite time details summary br hr table caption thead tbody tfoot tr th td progress video source picture audio svg path circle rect line polyline polygon g title #text'.split(' '));
const voidTags=new Set(['img','input','br','hr','source']);
const esc=(v    )=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;');
export function validateOwnerProps(x    ){
 const errors         =[];
 if(x?.authoringVersion!==undefined){
  if(x.authoringVersion!==OWNER_AUTHORING_VERSION)errors.push('unsupported authoringVersion');
  if(!tags.has(x.tag))errors.push('unsupported semantic tag');
  if(x.html!==undefined)errors.push('native authoring cannot contain an HTML blob');
  if(x.attributes&&(!x.attributes||typeof x.attributes!=='object'||Array.isArray(x.attributes)))errors.push('attributes must be an object');
  for(const [key,value] of Object.entries(x.attributes||{}))if(!/^[A-Za-z_][\w:.-]*$/.test(key)||/^on/i.test(key)||['src','href','class','style'].includes(key)||/^(javascript|vbscript):/i.test(String(value)))errors.push(`unsafe native attribute: ${key}`);
  if(x.href&&!/^(\/[^/]|\/$|#|https?:\/\/|mailto:|tel:)/i.test(x.href))errors.push('invalid link scheme');
  if(x.target&&!['_self','_blank'].includes(x.target))errors.push('invalid link target');
  for(const key of ['focalX','focalY'])if(x[key]!==''&&x[key]!==undefined&&(!Number.isFinite(Number(x[key]))||Number(x[key])<0||Number(x[key])>100))errors.push(`${key} must be 0–100`);
  for(const key of ['frameHeight','imageHeight','padding','zoom','gap','columns'])if(x[key]!==''&&x[key]!==undefined&&(!Number.isFinite(Number(x[key]))||Number(x[key])<0))errors.push(`${key} must be nonnegative`);
  if(x.fit&&!['contain','cover','fill','none','scale-down'].includes(x.fit))errors.push('invalid image fit');
  if(x.backgroundFit&&!['contain','cover','auto'].includes(x.backgroundFit))errors.push('invalid background fit');
  for(const key of ['backgroundFocalX','backgroundFocalY'])if(x[key]!==''&&x[key]!==undefined&&(!Number.isFinite(Number(x[key]))||Number(x[key])<0||Number(x[key])>100))errors.push(`${key} must be 0–100`);
  if(x.mode&&!['inherit','stack','row','grid'].includes(x.mode))errors.push('invalid responsive layout');
  if(x.aspectRatio&&!/^\d+(\.\d+)?\s*(\/\s*\d+(\.\d+)?)?$/.test(x.aspectRatio))errors.push('invalid aspect ratio');
  if(x.background&&/[;{}<>]|expression\s*\(|javascript\s*:|url\s*\(/i.test(x.background))errors.push('unsafe background treatment');
  if(x.href&&/[\x00-\x20\\]/.test(x.href))errors.push('invalid characters in link');
  if(x.responsive){if(typeof x.responsive!=='object'||Array.isArray(x.responsive))errors.push('responsive must be an object');else for(const [bp,props]of Object.entries(x.responsive)){if(!['mobile','tablet','desktop'].includes(bp)||!props||typeof props!=='object'||Array.isArray(props)){errors.push('invalid responsive breakpoint');continue;}errors.push(...validateOwnerProps({...props,authoringVersion:1,tag:x.tag}).errors.map(e=>`${bp}: ${e}`));}}
  if(/(?:expression\s*\(|javascript\s*:|@import)/i.test(x.style||''))errors.push('unsafe native style');
 }
 return{valid:errors.length===0,errors};
}
export function ownerStyle(x    ){
 const parts=[String(x.style||'').replace(/;+$/,'')];
 if(x.fit)parts.push(`object-fit:${x.fit}`);
 if(x.focalX!==undefined&&x.focalX!==''||x.focalY!==undefined&&x.focalY!=='')parts.push(`object-position:${x.focalX===''||x.focalX==null?50:x.focalX}% ${x.focalY===''||x.focalY==null?50:x.focalY}%`);
 if(x.imageHeight)parts.push(`height:${Number(x.imageHeight)}px`);
 if(x.zoom&&Number(x.zoom)!==1)parts.push(`transform:scale(${Number(x.zoom)});transform-origin:${x.focalX??50}% ${x.focalY??50}%`);
 if(x.frameHeight)parts.push(`height:${Number(x.frameHeight)}px;min-height:0`);
 if(x.aspectRatio)parts.push(`aspect-ratio:${String(x.aspectRatio).replace(/[^\d./ ]/g,'')}`);
 if(x.padding!==undefined&&x.padding!=='')parts.push(`padding:${Number(x.padding)}px`);
 if(x.background)parts.push(`background:${String(x.background).replace(/[;{}<>]/g,'')}`);
 if(x.backgroundFit)parts.push(`background-size:${x.backgroundFit}`);
 if(x.backgroundFocalX!==undefined&&x.backgroundFocalX!==''||x.backgroundFocalY!==undefined&&x.backgroundFocalY!=='')parts.push(`background-position:${x.backgroundFocalX??50}% ${x.backgroundFocalY??50}%`);
 if(x.mode&&x.mode!=='inherit')parts.push(x.mode==='grid'?`display:grid;grid-template-columns:repeat(${Math.max(1,Number(x.columns)||2)},minmax(0,1fr));gap:${Number(x.gap)||0}px`:`display:flex;flex-direction:${x.mode==='row'?'row':'column'};gap:${Number(x.gap)||0}px`);
 return parts.filter(Boolean).join(';');
}
export function renderOwnerComponent(c    ,assetUrl                         ,childRender                 ,animationFallback                    =()=> 'none')       {
 const x=c.props||{};if(x.hidden)return'';
 const validation=validateOwnerProps(x);if(!validation.valid)throw new Error(validation.errors.join('; '));
 if(x.tag==='#text')return esc(x.text||'');
 let tag=x.tag||'div';const attrs    ={...(x.attributes||{})};
 const anchorId=String(x.anchorId||'').trim().replace(/[^A-Za-z0-9_.:-]+/g,'-').replace(/^-+|-+$/g,'');
 if(anchorId)attrs.id=anchorId;
 if(x.variant)attrs['data-studio-variant']=String(x.variant);
 if(x.locked)attrs['data-studio-locked']='true';
 if(x.visibility)attrs['data-studio-visibility']=JSON.stringify(x.visibility);
 if(x.bindings)attrs['data-studio-bindings']=JSON.stringify(x.bindings);
 if(x.reveal)attrs['data-studio-reveal']=String(x.revealPreset||'slide-up');
 const animation=String(x.animation||'none').replace(/^animation\./,'');
 if(animation!=='none'){attrs['data-studio-animation']=animation;attrs['data-studio-reduced-animation']=String(animationFallback(animation)||'none').replace(/^animation\./,'');}
 if(x.className){const rest={...attrs};for(const k of Object.keys(attrs))delete attrs[k];attrs.class=x.className;Object.assign(attrs,rest);}
 if(x.tag==='img'){const url=assetUrl(x.asset);if(!url)throw new Error(`Missing native image asset: ${x.asset}`);attrs.src=url;attrs.alt=x.alt||'';}
 if(x.href&&x.tag!=='img'){tag='a';attrs.href=x.href;if(attrs.role==='button')delete attrs.role;}if(x.target&&x.href&&x.tag!=='img'){attrs.target=x.target;if(x.target==='_blank')attrs.rel='noopener noreferrer';}
 let style=ownerStyle(x);if(x.backgroundAsset){const url=assetUrl(x.backgroundAsset);if(!url)throw new Error(`Missing native background asset: ${x.backgroundAsset}`);const safeUrl=url.replaceAll("'",'%27').replaceAll('"','%22');let replaced=false;if(x.backgroundSourceUrl)style=style.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(whole,quote,source)=>{if(source===x.backgroundSourceUrl){replaced=true;return`url('${safeUrl}')`;}return whole;});if(!replaced)style+=(style?';':'')+`background-image:url('${safeUrl}')`;}
 if(style)attrs.style=style;
 attrs['data-studio-component']=c.id;
 if(x.tag!=='img'&&!voidTags.has(x.tag)&&!x.children?.length&&x.text!==undefined)attrs['data-studio-edit-field']='text';
 if(x.label!==undefined&&!x.children?.length)attrs['data-studio-edit-field']='label';
 const serialized=Object.entries(attrs).filter(([,v])=>v!==false&&v!==null&&v!==undefined).map(([k,v])=>v===true?` ${k}`:` ${k}='${esc(v)}'`).join('');
 const children=(x.children||[]).map(childRender||((child    )=>renderOwnerComponent(child,assetUrl,undefined,animationFallback))).join('');
 const html=`<${tag}${serialized}>${voidTags.has(tag)?'':`${children||esc(x.text??x.label??'')}</${tag}>`}`;
 return x.tag==='img'&&x.href?`<a href='${esc(x.href)}'${x.target?` target='${esc(x.target)}'`:''}${x.target==='_blank'?" rel='noopener noreferrer'":''}>${html}</a>`:html;
}
function importantDeclarations(css       ){
 const declarations         =[],push=(part       )=>{if(part.trim())declarations.push(part.trim().replace(/\s*!important\s*$/i,'')+'!important')};
 let start=0,depth=0,quote='';
 for(let i=0;i<css.length;i++){const ch=css[i];if(quote){if(ch===quote&&css[i-1]!=='\\')quote='';continue;}if(ch==='"'||ch==="'"){quote=ch;continue;}if(ch==='(')depth++;else if(ch===')')depth=Math.max(0,depth-1);else if(ch===';'&&depth===0){push(css.slice(start,i));start=i+1;}}
 push(css.slice(start));return declarations.join(';');
}
export function ownerResponsiveCss(c    ){
 const x=c.props||{},selector=`[data-studio-component="${String(c.id).replace(/["\\]/g,'')}" ]`.replace('" ]','"]');
 return Object.entries(x.responsive||{}).map(([bp,props]    )=>{const css=importantDeclarations(ownerStyle({...props,mode:props.mode||'inherit'}));return css?`@media ${bp==='mobile'?'(max-width:600px)':bp==='tablet'?'(min-width:601px) and (max-width:1024px)':'(min-width:1025px)'}{${selector}{${css}}}`:''}).join('');
}
