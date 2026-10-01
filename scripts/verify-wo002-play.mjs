#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo=path.resolve(process.argv[2]||'.');
const project=path.join(repo,'studio-project','toadal-feast-website');
const read=rel=>JSON.parse(fs.readFileSync(path.join(project,rel),'utf8').replace(/^\uFEFF/,''));
const pages=read('pages/index.json');
const nav=read('collections/navigation.json');
const home=read('pages/home.json');
const symbols=read('collections/symbols.json');
const advanced=read('collections/advanced-code.json');
const css=fs.readFileSync(path.join(project,'reference','assets','css','site.css'),'utf8');
const failures=[],warnings=[],checks=[];
const check=(id,ok,detail)=>{checks.push({id,ok:Boolean(ok),detail});if(!ok)failures.push(id+': '+detail)};

const routes=new Set((pages.pages||[]).map(p=>p.route));
check('play-route',routes.has('/play/'),'published Play hub is indexed');
check('wicked-detail-route',routes.has('/play/wicked-bites/'),'Wicked Bites detail is indexed');
check('claw-detail-route',routes.has('/play/claw-feed-gulper/'),'CLAW detail is indexed');
check('player-routes-not-public',!routes.has('/play/wicked-bites/player/')&&!routes.has('/play/claw-feed-gulper/player/'),'draft player pages are not indexed before bridge qualification');
check('primary-nav-play',nav.primary?.find(x=>x.id==='play')?.href==='./play/','primary Play nav points to real Play hub');
check('footer-nav-play',nav.footer?.find(x=>x.id==='play')?.href==='./play/','footer Play nav points to real Play hub');

const homeHtml=(home.components||[]).map(c=>c?.props?.html||'').join('\n');
check('home-play-routing',/href=['"]\.\/play\//.test(homeHtml),'Home sends browser-game discovery to Play hub');
check('home-no-player-launch',!/href=['"][^'"]*\/player\//.test(homeHtml),'Home has no direct player launch while games remain preview');

for(const [file,slug] of [['games/wicked-bites.json','wicked-bites'],['games/claw-feed-gulper.json','claw-feed-gulper']]){
 const g=read(file);
 check(slug+'-preview-state',g.status==='preview','game record remains preview');
 check(slug+'-detail-route',g.route==='/play/'+slug+'/','game record points to detail route');
 check(slug+'-web-disabled',g.web?.enabled===false,'player launch remains disabled');
 check(slug+'-player-route-recorded',g.web?.playerRoute==='/play/'+slug+'/player/','future player route is explicit');
}

const play=read('pages/play.json');
const playHtml=(play.components||[]).map(c=>c?.props?.html||'').join('\n');
check('play-truth',/No browser launches yet/i.test(playHtml)&&/Play buttons will appear when each browser version is ready/i.test(playHtml),'Play hub truthfully states that no browser launch is active yet.');
check('play-qualified-art',/wicked-bites-v5\.5\.webp/.test(playHtml)&&/claw-feed-gulper-v2\.5\.1\.webp/.test(playHtml),'Play uses source-qualified preview screenshots');
check('play-detail-links',/\.\/wicked-bites\//.test(playHtml)&&/\.\/claw-feed-gulper\//.test(playHtml),'Play links to truthful detail pages');

for(const file of ['pages/play-wicked-bites.json','pages/play-claw-feed-gulper.json']){
 const p=read(file); const html=(p.components||[]).map(c=>c?.props?.html||'').join('\n');
 check(file+'-disabled-launch',/<button[^>]+disabled[^>]*>Play preview/i.test(html),'detail Play control is disabled until qualification');
 check(file+'-screenshot-caption',/Gameplay preview from the current browser build/i.test(html),'detail identifies the image as gameplay from the current browser preview.');
}

for(const file of ['pages/player-wicked-bites.json','pages/player-claw-feed-gulper.json']){
 const p=read(file); const html=(p.components||[]).map(c=>c?.props?.html||'').join('\n');
 check(file+'-draft',p.publicationState==='draft','player source stays draft');
 check(file+'-iframe-sandbox',/sandbox=['"][^'"]*allow-scripts[^'"]*allow-same-origin/.test(html),'player iframe has explicit sandbox');
 check(file+'-fullscreen',/data-player-fullscreen/.test(html),'player has fullscreen control');
 check(file+'-exit',/browser-player__exit/.test(html),'player has exit control');
 check(file+'-status',/aria-live=['"]polite['"]/.test(html),'player exposes status live region');
}

check('host-bridge-current',/protocol:\s*'toadal\.game'/.test(advanced.javascript)&&/version:\s*1/.test(advanced.javascript),'host implements toadal.game v1 envelope');
check('host-message-origin',/event\.origin !== expectedOrigin/.test(advanced.javascript),'host validates message origin');
check('host-message-source',/event\.source !== frame\.contentWindow/.test(advanced.javascript),'host validates iframe source');
check('host-visibility',/visibilitychange/.test(advanced.javascript)&&/host:pause/.test(advanced.javascript)&&/host:resume/.test(advanced.javascript),'host has visibility pause/resume plumbing');
check('host-retry',/data-player-retry/.test(advanced.javascript),'host has retry plumbing');
check('host-fullscreen',/requestFullscreen/.test(advanced.javascript),'host owns fullscreen');

check('play-css',/\.play-feature-grid/.test(css)&&/\.game-detail-grid/.test(css)&&/\.browser-player__frame-wrap/.test(css),'shared Play/detail/player CSS exists');
check('responsive-player-css',/@media \(max-width: 520px\)[\s\S]*\.browser-player__frame-wrap/.test(css),'player has phone layout rules');

const publicText=[
 homeHtml,
 playHtml,
 ...['pages/play-wicked-bites.json','pages/play-claw-feed-gulper.json'].map(f=>(read(f).components||[]).map(c=>c?.props?.html||'').join(' ')),
 ...(symbols.items||[]).map(s=>s?.props?.html||''),
 ...['games/wicked-bites.json','games/claw-feed-gulper.json'].map(f=>JSON.stringify(read(f)))
].join(' ');
const jargon=[/\bWO-00\d\b/i,/\bwork order\b/i,/\bpackage audit\b/i,/\bwebsite QA\b/i,/\baudit required\b/i];
check('public-copy-no-operator-jargon',!jargon.some(re=>re.test(publicText)),'published/public-facing copy contains no work-order/operator language');

console.log(JSON.stringify({schema:'toadal-feast.wo002-play-source-check.v1',checks,summary:{total:checks.length,pass:checks.filter(c=>c.ok).length,fail:failures.length,warn:warnings.length},failures,warnings},null,2));
if(failures.length)process.exitCode=1;
