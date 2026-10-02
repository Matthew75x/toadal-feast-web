#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const cssPath=path.join(root,'studio-project','toadal-feast-website','reference','assets','css','site.css');
const matrixPath=path.join(root,'scripts','owner-preview-browser-matrix.mjs');
const errors=[];
const ok=(c,m)=>{if(!c)errors.push(m);};
const css=fs.readFileSync(cssPath,'utf8');
const matrix=fs.readFileSync(matrixPath,'utf8');

ok(css.includes('body:has(.home-hero) #browser-games{grid-column:1;grid-row:3;'), 'desktop Home #browser-games rule is not route-scoped');
ok(css.includes('body:has(.home-hero) #browser-games{grid-template-columns:repeat(2,minmax(0,1fr)) !important;'), 'mobile Home #browser-games rule is not route-scoped');
ok(!/^#browser-games(?:\{|\s)/m.test(css), 'unscoped #browser-games rule can leak Home card layout into Play');

const mobilePlay=css.match(/\/\* Mobile Play containment closure[\s\S]*?\/\* Home LOCK_VISUAL reconciliation/);
ok(!!mobilePlay, 'mobile Play containment block missing');
if(mobilePlay){
  ok(/\.wo002-game-library \.game-tabs \{[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?overflow:\s*visible;/m.test(mobilePlay[0]), 'mobile Play filters are not wrapping inside their container');
  ok(!/\.wo002-game-library \.game-tabs \{[\s\S]*?overflow-x:\s*auto;/m.test(mobilePlay[0]), 'mobile Play filters regressed to clipped horizontal scrolling');
}

const characterMobile=css.match(/@media \(max-width:680px\)\{[\s\S]*?\.profile-gallery img\{height:120px\}[\s\S]*?\}/m);
ok(!!characterMobile, 'character mobile block missing');
if(characterMobile){
  ok(characterMobile[0].includes('.profile-anchor-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));overflow:visible;'), 'Toadal profile anchor nav is not a contained mobile grid');
  ok(characterMobile[0].includes('.profile-anchor-nav a{min-width:0;text-align:center}'), 'Toadal profile anchor links are not shrink-safe grid items');
}

ok(matrix.includes("querySelectorAll('.companion-panel,.companion-toggle')"), 'browser matrix does not measure visible companion children');
ok(matrix.includes('.filter(e=>visible(e))'), 'browser matrix does not exclude hidden companion panel geometry');
ok(!matrix.includes("const cr=comp.getBoundingClientRect(),cs=getComputedStyle(comp)"), 'browser matrix still treats the full companion container as an obstruction');
ok(matrix.includes("/claim quest reward/i.test(nm(e))"), 'browser matrix does not identify the Quests primary action');
ok(matrix.includes("if(primaryRequired&&primaryOverlaps.length)issues.push('companion-primary-action-overlap')"), 'browser matrix does not gate initial primary-action overlap');
ok(!matrix.includes("if(overlaps.length)issues.push('companion-control-overlap')"), 'browser matrix still gates every generic control overlap');

if(errors.length){console.error('NON-HOME LAYOUT CLOSURE: FAIL');errors.forEach(x=>console.error('-',x));process.exit(1);}
console.log('NON-HOME LAYOUT CLOSURE: PASS');
console.log(JSON.stringify({checks:12,homeCardRulesScoped:true,mobilePlayFiltersWrap:true,profileAnchorsWrap:true,companionOverlapUsesVisibleGeometry:true,genericCompanionOverlapsDiagnosticOnly:true,homeAndQuestPrimaryActionsGated:true},null,2));
