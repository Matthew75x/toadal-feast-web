import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
const project=path.resolve(import.meta.dirname,'../studio-project/toadal-feast-website');
const read=f=>JSON.parse(fs.readFileSync(path.join(project,f),'utf8'));
const walk=x=>Array.isArray(x)?x.flatMap(walk):x&&typeof x==='object'?[...(x.props?[x]:[]),...Object.values(x).flatMap(walk)]:[];
const home=walk(read('pages/home.json')),play=walk(read('pages/play.json')),assets=read('assets/index.json').assets;
const css=read('collections/advanced-code.json').css;
test('all Home cards use the same editable 16:9 cover frame at every breakpoint',()=>{
 const cards=home.find(n=>n.id==='component.home.games').props.children;assert.equal(cards.length,4);
 for(const card of cards){const ns=walk(card),stage=ns.find(n=>Object.hasOwn(n.props.attributes||{},'data-game-preview-stage'))||ns.find(n=>n.type==='core.image');assert.equal(stage.props.aspectRatio,'16/9');assert.equal(stage.props.imageHeight,undefined);assert.equal(stage.props.frameHeight,undefined);}
 assert.doesNotMatch(css,/\[data-game-preview-stage\]\s*\{[^}]*height:155px/);
});
test('promotional covers use natural 16:9 pixels at center with no zoom or stretch',()=>{
 const covers=[...home,...play].filter(n=>n.type==='core.image'&&/promotional title illustration/.test(n.props.alt));assert.equal(covers.length,5);
 for(const {props:p} of covers){assert.equal(p.fit,'cover');assert.equal(p.focalX,50);assert.equal(p.focalY,50);assert.equal(p.zoom,1);const a=assets.find(a=>a.id===p.asset);assert.ok(Math.abs(a.width/a.height-16/9)<.001,'at most source pixel rounding, never a significant cover crop');for(const b of Object.values(p.responsive||{})){assert.equal(b.fit,'cover');const asset=assets.find(a=>a.id===b.asset);if(asset)assert.equal(asset.width/asset.height,16/9);}}
});
test('Play artwork uses the same ratio with status chips outside the title art',()=>{
 const frames=play.filter(n=>n.props.className==='play-card__art');assert.equal(frames.length,4);
 for(const frame of frames){assert.equal(frame.props.aspectRatio,'16/9');assert.ok(!walk(frame).some(n=>/^chip\b/.test(n.props.className)));}
 assert.match(css,/\.wo002-game-library \.play-card\.studio-game-card\.module \{ grid-template-columns:minmax\(0,1fr\)/);
});
test('held Feed Gulper preserves authentic gameplay art and game details without offering launch',()=>{
 const card=home.find(n=>n.id==='component.home.game.claw-feed-gulper');assert.equal(card.props.tag,'article');
 const ns=walk(card),get=attr=>ns.find(n=>Object.hasOwn(n.props.attributes||{},attr));
 assert.match(get('data-game-preview-cover').props.alt,/promotional.*not gameplay/);
 assert.equal(get('data-game-preview-gameplay').props.asset,'asset.home.game.claw-feed-gulper-preview');assert.equal(get('data-game-preview-gameplay').props.fit,'contain');
 assert.equal(get('data-game-preview-toggle').props.tag,'button');assert.equal(get('data-game-preview-link'),undefined);
 assert.ok(!ns.some(n=>n.props.href==='/player/claw-feed-gulper/'));
 assert.ok(ns.some(n=>n.props.href==='/games/claw-feed-gulper/'),'the ordinary detail destination remains available');
 assert.ok(ns.some(n=>/Browser preview unavailable/i.test(n.props.text||'')),'held availability stays explicit');
 assert.match(css,/\[data-game-preview-toggle\] \{\s*position:relative; top:auto; right:auto;/);
});
test('generated Gulper artwork is versioned as promotion while source gameplay stays hash-pinned',()=>{
 const promo=assets.find(a=>a.id==='asset.import.feed-gulper-title-card-v1.e8ca7e00');assert.ok(promo);
 assert.equal(promo.sha256,'e8ca7e000f1d77cbdc272854e84ac6010ea29b422369d316c140bd7f6386c46a');
 assert.deepEqual([promo.width,promo.height],[1672,941]);assert.ok(promo.tags.includes('not-gameplay'));assert.ok(promo.tags.includes('owner-requested'));
 assert.ok(promo.derivatives.webp&&promo.derivatives.avif&&promo.derivatives.thumbnail,'Studio optimization preserves the original and records generated derivatives');
 assert.match(promo.provenance.scope,/not gameplay, game canon, launch approval/);
 assert.equal(assets.find(a=>a.id==='asset.home.game.claw-feed-gulper-preview').sha256,'a2c11d58bc7c05ef0cfe7aea01c57c27ae71bfb86c99e590420c0045d5fbca4f');
});
test('Play companion collision protects reflowed card copy without overriding saved placement',()=>{
 const source=fs.readFileSync(path.join(project,'reference/assets/js/companion-position.js'),'utf8');
 assert.match(source,/if \(!headerOnly && document.querySelector\('\.wo002-game-library'\)\) \{\s*selectors \+= ', \.play-card, \.wo002-section-heading';/);
 assert.match(source,/if \(manualPosition\) return \{ x: saved.x, y: saved.y \}/);
});
