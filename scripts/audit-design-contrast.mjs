#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo=path.resolve(process.argv[2]||'.');
const css=fs.readFileSync(path.join(repo,'studio-project','toadal-feast-website','reference','assets','css','site.css'),'utf8');
const vars=new Map([...css.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map(m=>[m[1],m[2].toLowerCase()]));

function channel(v){v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}
function luminance(hex){const h=hex.slice(1);const [r,g,b]=[0,2,4].map(i=>channel(parseInt(h.slice(i,i+2),16)));return 0.2126*r+0.7152*g+0.0722*b}
function contrast(a,b){let x=luminance(a),y=luminance(b);if(x<y)[x,y]=[y,x];return (x+0.05)/(y+0.05)}

const pairs=[
 ['body-dark','cream-50','chocolate-950'],
 ['primary-button','cream-50','pink-700'],
 ['gold-chip','chocolate-950','gold-400'],
 ['navy-heading','navy-900','cream-50'],
 ['muted-body','muted-500','cream-50'],
 ['gold-on-dark','gold-400','chocolate-950'],
 ['coming-chip','pink-700','cream-50'],
 ['planned-chip','navy-900','cream-100'],
 ['control-text','chocolate-950','cream-200']
];

const rows=pairs.map(([name,fgKey,bgKey])=>{
 const fg=vars.get(fgKey),bg=vars.get(bgKey);
 const ratio=fg&&bg?contrast(fg,bg):0;
 return {name,foreground:fgKey,background:bgKey,fg,bg,ratio:Number(ratio.toFixed(2)),aaNormal:ratio>=4.5,aaaNormal:ratio>=7};
});
const failures=rows.filter(r=>!r.aaNormal);
console.log(JSON.stringify({schema:'toadal-feast.design-contrast-audit.v1',rows,summary:{tested:rows.length,aaPass:rows.length-failures.length,aaFail:failures.length}},null,2));
if(failures.length)process.exitCode=1;
