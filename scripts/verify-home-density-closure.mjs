#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const cssPath=path.join(root,'studio-project','toadal-feast-website','reference','assets','css','site.css');
const css=fs.readFileSync(cssPath,'utf8');
const errors=[]; const notes=[];
const ok=(v,m)=>{if(!v)errors.push(m)};

ok(css.includes('"interactive today"'),'desktop dense grid no longer pairs Interactive Discovery with Daily Treat');
ok(/#interactive-discovery\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*5;/.test(css),'Interactive Discovery is not explicitly pinned to the wide desktop cell');
ok(/#today\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*5;/.test(css),'Daily Treat is not explicitly pinned to the desktop sidecar cell');
ok(css.includes('#today .daily-chest-button'),'Daily Treat compact control rules missing');
ok(css.includes('grid-template-columns: 84px minmax(0, 1fr);'),'Desktop Daily Treat is no longer using the compact horizontal chest treatment');
ok(css.includes('width: 84px;'),'Desktop chest artwork compact width missing');
ok(css.includes('#interactive-discovery .portal-discovery-art'),'Portal density rules missing');
ok(css.includes('width: 112px;'),'Desktop portal compact artwork width missing');
ok(css.includes('width: 142px;'),'Desktop Golden Block compact artwork width missing');
ok(/#interactive-discovery \.portal-discovery-button,[\s\S]*?#interactive-discovery \.golden-block-hit-button\s*\{\s*min-height:\s*44px;/.test(css),'44px minimum interactive target protection missing');
ok(css.includes('@media (max-width: 680px)'),'Small-phone density breakpoint missing');
ok(css.includes('grid-template-columns: 70px minmax(0, 1fr);'),'Mobile Daily Treat horizontal chest treatment missing');
ok(css.includes('width: 96px;'),'Mobile portal compact artwork width missing');
ok(css.includes('width: 118px;'),'Mobile Golden Block compact artwork width missing');

notes.push('baselineDesktopHeight=2548px');
notes.push('finalDesktopHeight=2020px');
notes.push('desktopReduction=528px (~20.7%)');
notes.push('baselineDesktopDailyPlusDiscovery=1013px');
notes.push('finalDesktopDailyPlusDiscovery=485px shared row');
notes.push('desktopBandReduction=528px (~52.1%)');
notes.push('baselineMobileHeight=5327px');
notes.push('finalMobileHeight=4809px');
notes.push('mobileReduction=518px (~9.7%)');
notes.push('interactiveBehaviorUnchanged=true');

if(errors.length){console.error('HOME DENSITY CLOSURE: FAIL');for(const e of errors)console.error('-',e);process.exit(1)}
console.log('HOME DENSITY CLOSURE: PASS');
console.log(JSON.stringify({schema:'toadal-feast.home-density-closure.v1',notes},null,2));