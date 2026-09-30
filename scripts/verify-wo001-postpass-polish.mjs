#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo=path.resolve(process.argv[2]||'.');
const project=path.join(repo,'studio-project','toadal-feast-website');
const readJson=(rel)=>JSON.parse(fs.readFileSync(path.join(project,...rel.split('/')),'utf8').replace(/^\uFEFF/,''));
const home=readJson('pages/home.json');
const symbols=readJson('collections/symbols.json');
const assets=readJson('assets/index.json');
const wicked=readJson('games/wicked-bites.json');
const claw=readJson('games/claw-feed-gulper.json');
const css=fs.readFileSync(path.join(project,'reference','assets','css','site.css'),'utf8');
const html=(home.components||[]).map(c=>c?.props?.html||'').join(' ');
const symbolHtml=(symbols.items||[]).map(s=>s?.props?.html||'').join(' ');
const checks=[];
const check=(id,ok,detail)=>checks.push({id,ok:Boolean(ok),detail});

check('hero-victory-source',/assets\/images\/characters\/toadal-victory\.webp/.test(html),
  'Hero uses the high-resolution canonical Toadal victory derivative.');
check('app-victory-source',/app-conversion-panel[\s\S]*assets\/images\/characters\/toadal-victory\.webp/.test(html),
  'App conversion uses the high-resolution canonical Toadal derivative.');
check('qualified-game-art',wicked.artAsset==='asset.home.game.wicked-bites-preview' &&
  claw.artAsset==='asset.home.game.claw-feed-gulper-preview',
  'Wicked Bites and CLAW use source-qualified gameplay preview derivatives.');
check('preview-state-preserved',wicked.status==='preview' && wicked.web?.enabled===false &&
  claw.status==='preview' && claw.web?.enabled===false,
  'Game-specific preview art does not change either game to a playable Home state.');
check('rich-world-discovery',/class='world-art-grid'/.test(html) &&
  /assets\/images\/world\/forest-portal\.webp/.test(html) &&
  /assets\/images\/world\/candyland-calm\.webp/.test(html) &&
  /\.world-art-grid\s*\{/.test(css),
  'World discovery uses three source-qualified environment visuals.');
check('stories-art-distinct',/discovery-card--stories[\s\S]*forest-portal\.webp/.test(html),
  'Stories and Media uses a distinct truthful environment treatment.');
check('arcade-still-withheld',/data-feature-state='CANDIDATE_REQUIRES_WEB_PACKAGE_AUDIT'/.test(html) &&
  /IN DEVELOPMENT/.test(html) && !/href=[^>]*arcade/i.test(html),
  'Arcade remains a non-launchable development state.');
check('feast-pass-truth',/Guest-first design/.test(symbolHtml) && /Not live yet/.test(symbolHtml) &&
  /Account sync planned/.test(symbolHtml),
  'Feast Pass is player-facing and still clearly not live.');
check('operator-jargon-removed',!/(WO-\d+|work order|staging cartridges?|AUDIT REQUIRED|package audit|website QA|candidate only|app-store URLs|approved product screenshots)/i.test(html+' '+symbolHtml+' '+wicked.summary+' '+wicked.description+' '+claw.summary+' '+claw.description),
  'Player-facing source contains no internal work-order/audit jargon.');

const required=[
 ['asset.home.character.toadal-victory','reference/assets/images/characters/toadal-victory.webp'],
 ['asset.home.world.portal','reference/assets/images/world/forest-portal.webp'],
 ['asset.home.world.calm','reference/assets/images/world/candyland-calm.webp'],
 ['asset.home.game.wicked-bites-preview','reference/assets/images/games/wicked-bites-v5.5-preview.webp'],
 ['asset.home.game.claw-feed-gulper-preview','reference/assets/images/games/claw-feed-gulper-v2.5.1-preview.webp']
];
for(const [id,expected] of required){
  const a=(assets.assets||[]).find(x=>x.id===id);
  const file=a?path.join(project,...a.source.split('/')):'';
  const ok=!!a && a.source===expected && fs.existsSync(file) &&
    fs.statSync(file).size===a.bytes &&
    crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===a.sha256;
  check('asset-'+id,ok,ok?id+' bytes/hash match registry.':id+' mismatch.');
}

const failures=checks.filter(x=>!x.ok);
console.log(JSON.stringify({
  schema:'toadal-feast.wo001-postpass-polish.v1',
  checks,
  summary:{total:checks.length,pass:checks.length-failures.length,fail:failures.length}
},null,2));
if(failures.length) process.exitCode=1;
