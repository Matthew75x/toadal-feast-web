import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { project, components, selectedRows, synchronize } from './sync-play-catalogue.mjs';
const require = createRequire(import.meta.url);
const catalogue = require('../studio-project/toadal-feast-website/reference/assets/js/play-catalogue.js');
const ids = ['wicked-bites', 'claw-feed-gulper', 'toadal-tower-defense', 'froggy-fruity-bash'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const games = ids.map(id => read(path.join(project, 'games', id + '.json')));
const copy = object => JSON.parse(JSON.stringify(object));
const rows = games.map(g => ({ id: g.slug, title: g.name, release: g.status, availability: catalogue.classifyGame(g) }));
const hash = b => createHash('sha256').update(b).digest('hex');

test('actual registry separates two playable previews from two concepts', () => {
  assert.deepEqual(rows.map(r => [r.id, r.availability, r.release]), ids.map((id,i) => [id, ['playable','playable','concept','concept'][i], 'preview']));
  assert.equal(games[1].evidence.state, 'STAGED_PREVIEW_PENDING_SITE_QA');
  assert.equal(catalogue.classifyGame(games[1]), 'playable', 'the explicit website preview configuration is runnable while release status stays preview');
});
test('release state and playability are independent', () => {
  const g=copy(games[0]);g.status='public';g.web.browserCartridge.publicState='PUBLIC';
  assert.equal(catalogue.classifyGame(g),'playable');
  assert.equal(catalogue.availabilityLabel('playable','public'),'Playable public release');
  assert.equal(catalogue.availabilityLabel('playable','preview'),'Playable preview');
});
test('explicit hold wins even over enabled and runnable flags', () => {
  const g=copy(games[0]);g.web.browserCartridge.launchHeld=true;g.web.browserCartridge.runnable=true;
  assert.equal(catalogue.classifyGame(g),'held');
});
for (const [name,change] of [
 ['disabled enabled flag',g=>g.web.enabled=false],['string enabled flag',g=>g.web.enabled='true'],
 ['future schema',g=>g.schemaVersion=2],['wrong identity',g=>g.id='game.other'],['invalid slug',g=>g.slug='../other'],
 ['non-public status',g=>g.status='hidden'],['release mismatch',g=>g.web.browserCartridge.publicState='PUBLIC'],
 ['runnable false',g=>g.web.browserCartridge.runnable=false],['string runnable',g=>g.web.browserCartridge.runnable='true'],
 ['string hold',g=>g.web.browserCartridge.launchHeld='false'],['missing entry',g=>g.web.browserCartridge.entry=null],
 ['external entry',g=>g.web.browserCartridge.entry='https://example.com/game.html'],['other-game entry',g=>g.web.browserCartridge.entry='/public/games/other/index.html'],
 ['query entry',g=>g.web.browserCartridge.entry+='?enable=true'],['missing version',g=>g.web.browserCartridge.version=null],
 ['wrong protocol',g=>g.web.browserCartridge.protocol='other'],['missing web config',g=>delete g.web]
]) test('incomplete/contradictory source cannot become playable: '+name,()=>{const g=copy(games[0]);change(g);assert.equal(catalogue.classifyGame(g),'unavailable');});
test('concept requires explicit disconnected/no-package state, not missing metadata',()=>{
  const g=copy(games[2]);assert.equal(catalogue.classifyGame(g),'concept');delete g.web.browserCartridge.runnable;assert.equal(catalogue.classifyGame(g),'unavailable');
  assert.equal(catalogue.classifyGame(null),'unavailable');
});
test('query filtering is case/accent-insensitive title token matching, not arbitrary page-text search',()=>{
  assert.deepEqual(catalogue.catalogueView(rows,{q:'  WICKED    bites '}).rows.map(r=>r.id),['wicked-bites']);
  assert.deepEqual(catalogue.catalogueView(rows,{q:'gulper'}).rows.map(r=>r.id),['claw-feed-gulper']);
  assert.equal(catalogue.catalogueView([{...rows[0],title:'Crème Toad'}],{q:'CREME'}).rows.length,1);
  assert.equal(catalogue.catalogueView(rows,{q:'non-transferable'}).rows.length,0);
});
test('availability facets compose with search and release status',()=>{
  assert.deepEqual(catalogue.catalogueView(rows).counts,{all:4,playable:2,held:0,concept:2,unavailable:0});
  assert.deepEqual(catalogue.catalogueView(rows,{q:'toadal'}).counts,{all:1,playable:0,held:0,concept:1,unavailable:0});
  assert.equal(catalogue.catalogueView([{...rows[1],availability:'held'}],{availability:'held'}).rows[0].id,'claw-feed-gulper');
  assert.equal(catalogue.catalogueView(rows,{availability:'playable',release:'public'}).rows.length,0);
  assert.deepEqual(catalogue.catalogueView(rows,{availability:'concept'}).releaseCounts,{all:2,preview:2,public:0});
});
test('unavailable is its own classification and never gets pooled into concepts',()=>{
  const data=rows.concat({id:'future-game',title:'Future metadata',release:'preview',availability:'unavailable'});
  const view=catalogue.catalogueView(data,{availability:'unavailable'});assert.equal(view.rows.length,1);assert.equal(view.counts.concept,2);
});
test('empty catalogue and malformed projection remain distinct',()=>{
  assert.equal(catalogue.catalogueView([]).total,0);
  for(const value of [null,[rows[0],rows[0]],[{...rows[0],availability:'latest'}],[{...rows[0],title:''}],[{...rows[0],id:'../escape'}]])assert.throws(()=>catalogue.catalogueView(value));
});
test('displayed owner-authored title also participates without changing canonical identity',()=>{
  assert.equal(catalogue.catalogueView([{...rows[0],displayTitle:'Small Snack Adventure'}],{q:'small snack'}).rows[0].id,'wicked-bites');
});
test('URL state roundtrip works under root and Pages hosting and keeps unrelated parameters/fragments',()=>{
  for(const base of ['https://site.test/play/','https://site.test/toadal-feast-web/play/']){
    const original=base+'?utm_source=qr&campaign=first&campaign=second#browser-games';
    const next=catalogue.stateURL(original,{q:'CLAW & snack',availability:'held',release:'preview'});
    const url=new URL(next,base);assert.equal(url.origin,'https://site.test');assert.equal(url.pathname,new URL(base).pathname);
    assert.deepEqual(url.searchParams.getAll('campaign'),['first','second']);assert.equal(url.searchParams.get('utm_source'),'qr');assert.equal(url.hash,'#browser-games');
    assert.deepEqual(catalogue.readState(url.href),{q:'CLAW & snack',availability:'held',release:'preview'});
    const cleared=new URL(catalogue.stateURL(url.href,{}),base);assert.equal(cleared.searchParams.get('availability'),null);assert.equal(cleared.searchParams.get('utm_source'),'qr');
  }
});
test('unknown and duplicate owned URL parameters normalize without changing other state',()=>{
  assert.deepEqual(catalogue.readState('https://x/play/?availability=evil&release=latest&q=claw'),{q:'claw',availability:'all',release:'all'});
  const path=catalogue.stateURL('https://x/play/?q=a&q=b&availability=held&availability=playable&keep=1',{q:'toad',availability:'concept'});
  const u=new URL(path,'https://x');assert.deepEqual(u.searchParams.getAll('q'),['toad']);assert.deepEqual(u.searchParams.getAll('availability'),['concept']);assert.equal(u.searchParams.get('keep'),'1');
});
test('query text is bounded, strips controls, preserves Unicode and treats markup as plain search',()=>{
  assert.equal(catalogue.cleanQuery(' a\n b\u0000c '),'a bc'.replace('bc','b c'));
  assert.equal(Array.from(catalogue.cleanQuery('🍓'.repeat(150))).length,120);
  assert.equal(catalogue.catalogueView(rows,{q:'<img src=x onerror=alert(1)>'}).rows.length,0);
});
test('current native projection matches exact game records, not manually repeated availability',()=>{
  const before=fs.readFileSync(path.join(project,'pages/play.json'));const result=synchronize(project,true);
  assert.equal(result.differences,0);assert.equal(result.listedGames.length,4);assert.deepEqual(fs.readFileSync(path.join(project,'pages/play.json')),before);
  const selected=selectedRows(project,JSON.parse(before));assert.deepEqual(selected.map(r=>r.id),ids);
});
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'toadal-catalogue-test-'));
  const files=['pages/play.json',...ids.map(id=>'games/'+id+'.json'),...['wicked-bites','claw-feed-gulper'].flatMap(id=>[
    'pages/game-'+id+'.json','pages/player-'+id+'.json','reference/public/games/'+id+'/index.html'
  ])];
  for(const rel of files){fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.copyFileSync(path.join(project,rel),path.join(root,rel));}
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;
}
test('stale source projection blocks export and deliberate sync changes only native metadata',t=>{
  const root=fixture(t),file=path.join(root,'games/wicked-bites.json'),g=read(file);g.web.enabled=false;fs.writeFileSync(file,JSON.stringify(g));
  assert.throws(()=>synchronize(root,true),/Stale catalogue projection/);const raw=fs.readFileSync(file);
  const result=synchronize(root,false);assert.equal(result.listedGames[0].availability,'unavailable');assert.deepEqual(fs.readFileSync(file),raw);assert.equal(synchronize(root,true).differences,0);
});
test('unlisted private/hidden catalogue records cannot leak into the published card inventory',t=>{
  const root=fixture(t);fs.writeFileSync(path.join(root,'games/private-internal.json'),JSON.stringify({slug:'private-internal',status:'hidden',secret:'not-read'}));
  assert.equal(synchronize(root,true).listedGames.length,4);
});
test('duplicate or escaping native game IDs refuse projection',t=>{
  const root=fixture(t),file=path.join(root,'pages/play.json'),page=read(file),cards=[...components(page)].filter(n=>n.props?.attributes?.['data-game-id']);
  cards[1].props.attributes['data-game-id']=cards[0].props.attributes['data-game-id'];fs.writeFileSync(file,JSON.stringify(page));assert.throws(()=>synchronize(root,true),/duplicate/);
});
test('missing connected artifact refuses a playable label rather than trusting historical evidence',t=>{
  const root=fixture(t);fs.unlinkSync(path.join(root,'reference/public/games/wicked-bites/index.html'));assert.throws(()=>synchronize(root,true),/entry is not present/);
});
test('unknown publication source requires explicit review, not silent admission',t=>{
  const root=fixture(t),f=path.join(root,'games/claw-feed-gulper.json'),g=read(f);g.status='hidden';fs.writeFileSync(f,JSON.stringify(g));assert.throws(()=>synchronize(root,false),/publication state/);
});
test('native catalogue cards retain detail destinations without launching games directly',()=>{
  const page=read(path.join(project,'pages/play.json'));const list=[...components(page)];
  const controls=list.filter(n=>n.id.startsWith('component.play.catalogue.'));assert.ok(controls.length>30);assert.ok(controls.every(n=>n.props.authoringVersion===1&&n.type!=='core.rich-text'));
  const cards=list.filter(n=>n.props?.attributes?.['data-game-id']);
  for(const card of cards){const id=card.props.attributes['data-game-id'];const links=[...components(card)].filter(n=>n.props?.tag==='a');assert.ok(links.length);assert.ok(links.every(n=>n.props.href==='/games/'+id+'/'));}
  assert.equal(list.filter(n=>n.props?.className==='game-tabs').length,0,'legacy filters do not bind the new controls');
});
test('Home loader pins the exact catalogue and adapter source; exporter performs read-only projection check',()=>{
  const home=read(path.join(project,'pages/home.json'));const resources=[...components(home)].flatMap(n=>n.props?.runtimeCodeResources||[]);
  for(const file of ['manifest-shell.js','play-catalogue.js'])assert.equal(resources.find(x=>x.url==='/assets/js/'+file)?.sha256,hash(fs.readFileSync(path.join(project,'reference/assets/js',file))));
  const exporter=fs.readFileSync(new URL('./export-staging-candidate.mjs',import.meta.url),'utf8');assert.match(exporter,/verifyPlayCatalogue\(project, true\)/);
});

test('new controls retain labelled native inputs, disabled fallback and unstyled label spans',()=>{
  const nodes=[...components(read(path.join(project,'pages/play.json')))];
  const input=nodes.find(n=>Object.hasOwn(n.props?.attributes||{},'data-catalogue-query'));
  assert.equal(input.props.tag,'input');assert.equal(input.props.attributes.type,'search');assert.equal(input.props.attributes.maxlength,120);assert.equal(input.props.attributes.disabled,true);
  assert.ok(nodes.some(n=>n.props?.tag==='label'&&n.props.attributes?.for===input.props.attributes.id));
  for(const id of ['component.play.catalogue.search-submit-label','component.play.catalogue.reset-label'])assert.equal(nodes.find(n=>n.id===id).props.className,'catalogue-filter-label');
  assert.ok(nodes.some(n=>Object.hasOwn(n.props?.attributes||{},'data-catalogue-fallback')));
});
test('unsupported release metadata does not silently enter the available catalogue',()=>{
  for(const release of ['hidden','draft','unknown','',null])assert.throws(()=>catalogue.catalogueView([{...rows[0],release}]));
});
test('companion bubble placement protects the full catalogue on desktop and mobile',()=>{
  const js=fs.readFileSync(path.join(project,'reference/assets/js/companion-position.js'),'utf8');
  assert.ok(js.includes("if (includeNavigation) selectors += ', .site-header, [role=\"navigation\"], main .catalogue-controls';"));
  assert.match(js,/main \.quest-board, main \.quest-next/);
});
