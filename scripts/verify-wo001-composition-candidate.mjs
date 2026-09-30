#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo=path.resolve(process.argv[2]||'.');
const project=path.join(repo,'studio-project','toadal-feast-website');
const read=rel=>fs.readFileSync(path.join(project,rel),'utf8');
const json=rel=>JSON.parse(read(rel).replace(/^\uFEFF/,''));
const home=json('pages/home.json');
const assets=json('assets/index.json');
const wicked=json('games/wicked-bites.json');
const claw=json('games/claw-feed-gulper.json');
const css=read('reference/assets/css/site.css');
const html=(home.components||[]).map(c=>c?.props?.html||'').join('\n');
const checks=[];
const check=(id,ok,detail)=>checks.push({id,ok:Boolean(ok),detail});
const has=(s,re)=>re.test(s);

check('hero-victory-art',/assets\/images\/characters\/toadal-victory\.webp/.test(html),
  'Hero/app use the high-resolution canonical Toadal victory derivative.');
check('hero-brighter-scrim',/WO-001 approved-home composition remediation candidate/.test(css) &&
  /linear-gradient\(90deg,[\s\S]*rgb\(30 16 13 \/ 5%\)/.test(css),
  'Desktop hero uses a directional restrained scrim rather than a flat dark overlay.');
check('franchise-brand-slot',/\.site-brand::before/.test(css)&&/\.site-brand::after/.test(css)&&/TOADAL/.test(css)&&/FEAST/.test(css),
  'Header has an intentional TOADAL / FEAST wordmark treatment without using the app icon as a wordmark.');
check('games-pass-band',/data-studio-variant="games-intro"\]\s*\{[\s\S]*grid-column:\s*2/.test(css)&&
  /data-studio-variant="feast-pass"\]\s*\{[\s\S]*grid-column:\s*3/.test(css)&&
  /grid-row:\s*3\s*\/\s*5/.test(css),
  'Games and Feast Pass are composed as one desktop band.');
check('compact-today',/\.today-panel\s*\{[\s\S]*display:\s*flex/.test(css)&&/padding:\s*15px 20px/.test(css),
  'Today is a compact ribbon on desktop.');
check('rich-discovery',/class='world-art-grid'/.test(html)&&/class='stories-world-art'/.test(html)&&
  /assets\/images\/world\/forest-portal\.webp/.test(html),
  'World and Stories/Media use truthful approved environment artwork.');
check('app-next-band',/data-studio-variant="app-conversion"\]\s*\{[\s\S]*grid-column:\s*2/.test(css)&&
  /data-studio-variant="whats-next"\]\s*\{[\s\S]*grid-column:\s*3/.test(css),
  'App conversion and What’s Next share a desktop band.');
check('character-companion',/grid-template-columns:\s*minmax\(0, 1fr\) 96px/.test(css)&&
  /\.companion-toggle\s*\{[\s\S]*background:\s*transparent/.test(css),
  'Companion uses Toadal as the visible compact control with a speech bubble.');
check('mobile-world-visible',/home-hero \.hero-world\s*\{[\s\S]*z-index:\s*0/.test(css)&&
  /@media \(max-width: 767px\)[\s\S]*home-hero__toadal[\s\S]*width:\s*min\(43vw, 168px\)/.test(css),
  'Mobile hero explicitly keeps world art and Toadal visible.');
check('operator-jargon-absent',!/(WO-002|work order|AUDIT REQUIRED|package audit|website QA|candidate only|app-store URLs|approved product screenshots)/i.test(html),
  'Player-facing Home markup contains no internal operator jargon.');
check('qualified-game-art-wired', wicked.artAsset==='asset.home.game.wicked-bites-preview' &&
  claw.artAsset==='asset.home.game.claw-feed-gulper-preview',
  'Wicked Bites and CLAW cards use source-qualified preview gameplay derivatives without changing launch state.');
check('qualified-game-art-remains-preview', wicked.status==='preview' && wicked.web?.enabled===false &&
  claw.status==='preview' && claw.web?.enabled===false,
  'Game-specific preview artwork does not promote either cartridge to a playable Home state.');

const requiredAssets=[
 ['asset.home.character.toadal-victory','reference/assets/images/characters/toadal-victory.webp'],
 ['asset.home.world.portal','reference/assets/images/world/forest-portal.webp'],
 ['asset.home.world.calm','reference/assets/images/world/candyland-calm.webp'],
 ['asset.home.game.wicked-bites-preview','reference/assets/images/games/wicked-bites-v5.5-preview.webp'],
 ['asset.home.game.claw-feed-gulper-preview','reference/assets/images/games/claw-feed-gulper-v2.5.1-preview.webp']
];
for(const [id,expected] of requiredAssets){
 const a=(assets.assets||[]).find(x=>x.id===id);
 const file=a?path.join(project,a.source):'';
 const ok=!!a&&a.source===expected&&fs.existsSync(file)&&
   crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===a.sha256&&
   fs.statSync(file).size===a.bytes;
 check('asset-'+id,ok,ok?`${id} bytes/hash match asset registry.`:`${id} registry/file mismatch.`);
}
const failures=checks.filter(x=>!x.ok);
console.log(JSON.stringify({schema:'toadal-feast.wo001-composition-candidate.v1',checks,summary:{total:checks.length,pass:checks.length-failures.length,fail:failures.length}},null,2));
if(failures.length)process.exitCode=1;
