// Only paired CSS URL quote spelling within parsed single-quoted style values.
// This preserves URL/declaration bytes and never decodes arbitrary entities.
export function normalizeConvergenceHtml(html){
 const source=String(html);let out='',cursor=0;
 while(cursor<source.length){
  const start=source.indexOf('<',cursor);if(start<0)return out+source.slice(cursor);
  out+=source.slice(cursor,start);
  if(source.startsWith('<!--',start)){const close=source.indexOf('-->',start+4),end=close<0?source.length:close+3;out+=source.slice(start,end);cursor=end;continue;}
  let end=start+1,quote='';
  for(;end<source.length;end++){const c=source[end];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='>'){end++;break;}}
  const tag=source.slice(start,end),opening=/^<([A-Za-z][\w:-]*)([\s\S]*)>$/.exec(tag);
  if(!opening){out+=tag;cursor=end;continue;}
  const name=opening[1],attributes=opening[2];
  const normalized=attributes.replace(/([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g,(all,key,value)=>{
   if(key.toLowerCase()!=='style'||!value?.startsWith("'"))return all;
   return all.slice(0,all.length-value.length)+"'"+value.slice(1,-1).replace(/url\("([^"<>]*)"\)/g,(_url,url)=>`url(&quot;${url}&quot;)`)+"'";
  });
  out+=`<${name}${normalized}>`;cursor=end;
  if(/^(script|style|textarea|title|xmp|iframe|noembed|noframes|plaintext)$/i.test(name)){
   const close=new RegExp(`</${name}\\s*>`,'ig');close.lastIndex=cursor;const match=close.exec(source),rawEnd=match?close.lastIndex:source.length;
   out+=source.slice(cursor,rawEnd);cursor=rawEnd;
  }
 }
 return out;
}
