#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const cssPath=path.join(root,'studio-project','toadal-feast-website','reference','assets','css','site.css');
const advancedPath=path.join(root,'studio-project','toadal-feast-website','collections','advanced-code.json');
const errors=[];
const ok=(c,m)=>{if(!c)errors.push(m);};
const css=fs.readFileSync(cssPath,'utf8');
const advanced=JSON.parse(fs.readFileSync(advancedPath,'utf8')).javascript||'';

ok(/\.toadal-companion,[\s\S]*?position:\s*fixed\s*!important;[\s\S]*?inset-inline-end:[\s\S]*?inset-block-end:/m.test(css),'persistent companion fixed-position contract missing');
ok(!/\.toadal-companion\s*\{[\s\S]{0,260}?position:\s*static\s*!important;/m.test(css),'global companion static-position override remains');
ok(!/\[data-studio-variant="companion"\]\s+\.toadal-companion\s*\{[\s\S]{0,260}?position:\s*static\s*!important;/m.test(css),'Home companion static-position override remains');
ok(css.includes('width: 96px;')&&css.includes('height: 104px;'),'desktop companion enlargement missing');
ok(css.includes('width: 66px;')&&css.includes('height: 72px;'),'mobile companion enlargement missing');
ok(css.includes('[data-companion-engaged="true"] .companion-image'),'engaged companion transform missing');
ok(css.includes('[data-companion-pulse="true"] .companion-image'),'context-change pulse animation missing');
ok(css.includes('@media (prefers-reduced-motion: reduce)'),'reduced-motion companion handling missing');

for(const token of [
  "document.addEventListener('pointerover'",
  "document.addEventListener('focusin'",
  "document.addEventListener('touchstart'",
  "new IntersectionObserver",
  "root.setAttribute('data-companion-engaged'",
  "root.setAttribute('data-companion-pulse'",
  "data-companion-current-reaction",
  "toadal:site:companion:minimized:v1"
]) ok(advanced.includes(token),`companion runtime contract missing: ${token}`);

ok(advanced.includes("world-map.webp")&&advanced.includes("support-help.webp")&&advanced.includes("stories-media-thinking.webp"),'contextual companion artwork map incomplete');
ok(advanced.includes("feast[- ]?pass|quest|rewards?|spark|streak"),'Feast Pass/reward semantic mapping missing');
ok(advanced.includes("play|game|preview|arcade|player"),'Play/game semantic mapping missing');
ok(advanced.includes("404|lost|error|empty"),'404/error semantic mapping missing');
ok(!advanced.includes('mousemove'), 'cursor-following behavior must remain excluded');

const site=path.join(root,'studio-project','toadal-feast-website');
const pageIndex=JSON.parse(fs.readFileSync(path.join(site,'pages','index.json'),'utf8')).pages||[];
const missingRoutes=[];
for(const record of pageIndex){
  const page=JSON.parse(fs.readFileSync(path.join(site,record.file),'utf8'));
  const raw=JSON.stringify(page);
  const hasCompanion=raw.includes('toadal-companion')||(page.components||[]).some(c=>(c.props||{}).variant==='companion');
  if(!hasCompanion) missingRoutes.push(record.route);
}
ok(missingRoutes.length===0,'registered routes missing persistent companion: '+missingRoutes.join(', '));

if(errors.length){console.error('PERSISTENT TOADAL COMPANION: FAIL');errors.forEach(e=>console.error('-',e));process.exit(1);}
console.log('PERSISTENT TOADAL COMPANION: PASS');
console.log(JSON.stringify({fixedViewport:true,desktopImage:'96x104',mobileImage:'66x72',hoverFocusTouch:true,sectionAware:true,reducedMotion:true,cursorFollow:false},null,2));
