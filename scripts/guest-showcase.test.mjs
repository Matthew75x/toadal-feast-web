import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const runtime = require('../studio-project/toadal-feast-website/reference/assets/js/guest-progression.js');
const definitions = require('../studio-project/toadal-feast-website/reference/assets/js/progression-definitions.js');
const { KEYS } = runtime;
function fixture(config = definitions) {
  const map = new Map(), writes = [], deny = { read: null, write: null, silent: false, mutateRead: null };
  let day = 1;
  const storage = {
    getItem(key) { if (deny.read === key) throw Error('controlled read failure'); if (deny.mutateRead) deny.mutateRead(key); return map.get(key) ?? null; },
    setItem(key, value) { if (deny.write === key) throw Error('controlled quota failure'); writes.push(key); if (!deny.silent) map.set(key, String(value)); },
    removeItem(key) { writes.push('remove:' + key); map.delete(key); }
  };
  const now = () => new Date(Date.UTC(2026, 9, day, 12));
  return { map, writes, deny, storage, now, nextDay: () => day++, config, store: runtime.createStore({ storage, now, definitions: config }) };
}
const view = f => runtime.profileShowcaseView(f.store.getSnapshot(), f.config);
const claimBadge = f => assert.equal(f.store.claimReward('starter-feaster-badge').ok, true);
function claimTitle(f) {
  // Advance only the injected clock and existing daily authority; do not modify reward values.
  for (let i = 0; i < 20; i++) { assert.equal(f.store.claimDaily().ok, true); f.nextDay(); }
  assert.equal(f.store.claimReward('curious-feaster-title').ok, true);
}
function raw(f, name) { return JSON.parse(f.map.get(KEYS[name])); }
function change(f, name, edit) { const data = raw(f, name); edit(data); f.map.set(KEYS[name], JSON.stringify(data)); f.store.refreshFromStorage(); }

test('an unclaimed starter reward is not a showcase marker; reads do not grant or write', () => {
  const f = fixture(); assert.equal(view(f).available, true); assert.deepEqual(view(f).groups.badge.earned, []);
  assert.deepEqual(f.store.selectProfileReward('badge', 'first-feast'), { ok: false, reason: 'not-earned' });
  assert.equal(f.writes.length, 0); assert.equal(f.store.getSnapshot().pass.xp, 0);
});
test('actual existing badge claim can be displayed, removed and displayed again', () => {
  const f = fixture(); claimBadge(f); const before = JSON.stringify(f.store.getSnapshot().pass);
  assert.equal(view(f).groups.badge.selected, null);
  assert.equal(f.store.selectProfileReward('badge', 'first-feast').ok, true);
  assert.equal(view(f).groups.badge.selected.title, 'First Feast');
  assert.equal(f.store.selectProfileReward('badge', null).ok, true);
  assert.equal(view(f).groups.badge.selected, null); assert.equal(view(f).groups.badge.earned.length, 1);
  assert.equal(f.store.selectProfileReward('badge', 'first-feast').ok, true);
  assert.equal(JSON.stringify(f.store.getSnapshot().pass), before);
});
test('claim, display and reload do not replay rewards', () => {
  const f = fixture(); claimBadge(f); f.store.selectProfileReward('badge', 'first-feast'); const writes = f.writes.length;
  const fresh = runtime.createStore({ storage: f.storage, now: f.now, definitions });
  assert.equal(runtime.profileShowcaseView(fresh.getSnapshot()).groups.badge.selected.awardId, 'first-feast');
  assert.equal(fresh.claimReward('starter-feaster-badge').reason, 'already-claimed');
  assert.equal(f.writes.length, writes);
});
test('selection preserves unknown fields, score history and the other three exact saved records', () => {
  const f = fixture(); claimBadge(f); f.store.recordEvent('route:/world/'); f.store.recordLocalScore({ gameId: 'wicked-bites', score: 0 });
  change(f, 'profile', p => { p.extension = { keep: ['untouched'] }; });
  const original = raw(f, 'profile'), before = new Map(f.map); f.map.set('unrelated:game:save', 'keep');
  const count = f.writes.length; assert.equal(f.store.selectProfileReward('badge', 'first-feast').ok, true);
  const after = raw(f, 'profile'); delete original.selectedBadge; delete original.updatedAt; delete after.selectedBadge; delete after.updatedAt;
  assert.deepEqual(after, original); assert.deepEqual(f.writes.slice(count), [KEYS.profile]);
  for (const name of ['pass', 'quests', 'discoveries']) assert.equal(f.map.get(KEYS[name]), before.get(KEYS[name]));
  assert.equal(f.map.get('unrelated:game:save'), 'keep');
});
test('already-selected and already-hidden actions are idempotent without timestamp writes', () => {
  const f = fixture(); claimBadge(f); f.store.selectProfileReward('badge', 'first-feast'); const before = [...f.map], writes = f.writes.length;
  assert.deepEqual(f.store.selectProfileReward('badge', 'first-feast'), { ok: true, changed: false, type: 'badge', awardId: 'first-feast' });
  assert.deepEqual([...f.map], before); assert.equal(f.writes.length, writes);
  const empty = fixture(); assert.equal(empty.store.selectProfileReward('title', null).changed, false); assert.equal(empty.writes.length, 0);
});
test('existing level-two title auto-selection remains, and owner can hide and restore it', () => {
  const f = fixture(); claimTitle(f); assert.equal(view(f).groups.title.selected.title, 'Curious Feaster');
  assert.equal(f.store.selectProfileReward('title', null).ok, true); assert.equal(view(f).groups.title.selected, null);
  assert.equal(f.store.selectProfileReward('title', 'curious-feaster').ok, true);
  assert.equal(f.store.getSnapshot().pass.xp, 100); assert.equal(f.store.getSnapshot().pass.sparks, 20);
});
test('two configured earned badges can be switched without granting anything', () => {
  const config = structuredClone(definitions); config.rewards.push({ id: 'controlled-second-badge', title: 'Controlled second badge', type: 'badge', awardId: 'controlled-second', level: 1 });
  const f = fixture(config); claimBadge(f); assert.equal(f.store.claimReward('controlled-second-badge').ok, true);
  f.store.selectProfileReward('badge', 'first-feast'); const pass = f.map.get(KEYS.pass);
  assert.equal(f.store.selectProfileReward('badge', 'controlled-second').ok, true); assert.equal(view(f).groups.badge.selected.title, 'Controlled second badge');
  assert.equal(f.map.get(KEYS.pass), pass); assert.equal(view(f).groups.badge.earned.length, 2);
});
for (const [type, id] of [['collectible','feast-pass-sticker'],['__proto__','first-feast'],['badge',{}],['badge',''],['title','first-feast'],['badge','curious-feaster'],['badge','unknown']]) {
  test('reject unknown, unearned, mismatched or unsupported selection '+JSON.stringify([type,id]), () => {
    const f = fixture(); claimBadge(f); const before = [...f.map], writes = f.writes.length;
    assert.equal(f.store.selectProfileReward(type, id).ok, false); assert.deepEqual([...f.map], before); assert.equal(f.writes.length, writes);
  });
}
test('profile raw value never becomes an earned public/display title just because it is selected', () => {
  const f = fixture(); claimBadge(f); change(f, 'profile', p => { p.selectedTitle = '<script>not-earned</script>'; });
  assert.equal(view(f).groups.title.selected, null); assert.equal(view(f).groups.title.invalidSelection, true);
  assert.doesNotMatch(view(f).groups.title.display, /<script>/);
  assert.equal(f.store.selectProfileReward('title', null).ok, true); assert.equal(raw(f,'profile').selectedTitle, null);
});
test('write failure retains selection and permits a successful retry', () => {
  const f = fixture(); claimBadge(f); const original = f.map.get(KEYS.profile); f.deny.write = KEYS.profile;
  assert.equal(f.store.selectProfileReward('badge', 'first-feast').reason, 'storage-unavailable');
  assert.equal(f.map.get(KEYS.profile), original); assert.equal(view(f).groups.badge.selected, null);
  f.deny.write = null; assert.equal(f.store.selectProfileReward('badge', 'first-feast').ok, true);
});
test('silent storage refusal is not successful persistence', () => {
  const f = fixture(); claimBadge(f); f.deny.silent = true; const original = f.map.get(KEYS.profile);
  assert.equal(f.store.selectProfileReward('badge','first-feast').reason, 'save-unverified'); assert.equal(f.map.get(KEYS.profile), original);
});
for (const name of ['pass','profile']) {
  test(name+' read refusal never writes selection or invents empty ownership', () => {
    const f = fixture(); claimBadge(f); const original = [...f.map], count = f.writes.length; f.deny.read = KEYS[name];
    assert.equal(f.store.selectProfileReward('badge','first-feast').ok, false); assert.equal(view(f).available, false);
    assert.deepEqual([...f.map], original); assert.equal(f.writes.length, count);
    f.deny.read = null; assert.equal(f.store.selectProfileReward('badge','first-feast').ok, true);
  });
  for (const value of ['{broken', JSON.stringify({schemaVersion:99,marker:'retained future'})]) {
    test(name+' malformed/future storage is preserved: '+value, () => {
      const f = fixture(); claimBadge(f); f.map.set(KEYS[name], value); const count=f.writes.length;
      assert.equal(f.store.selectProfileReward('badge','first-feast').ok,false); assert.equal(view(f).available,false);
      assert.equal(f.map.get(KEYS[name]),value); assert.equal(f.writes.length,count);
    });
  }
}
for (const edit of [p=>p.badges='first-feast',p=>p.selectedBadge=42,p=>p.rewardClaims=[],p=>p.rewardClaims['starter-feaster-badge']='not-a-date']) {
  test('malformed marker state is unavailable, not silently overwritten: '+edit, () => {
    const f=fixture();claimBadge(f);change(f,'profile',edit);const original=f.map.get(KEYS.profile),writes=f.writes.length;
    assert.equal(view(f).available,false);assert.equal(f.store.selectProfileReward('badge','first-feast').ok,false);
    assert.equal(f.map.get(KEYS.profile),original);assert.equal(f.writes.length,writes);
  });
}
test('a partial reset cannot promote remaining profile markers into earned authority', () => {
  const f=fixture();claimBadge(f);f.map.delete(KEYS.pass);f.store.refreshFromStorage();const count=f.writes.length;
  assert.equal(view(f).available,false);assert.equal(f.store.selectProfileReward('badge','first-feast').ok,false);assert.equal(f.writes.length,count);
});
test('external reset is read fresh before save and stale tab cannot resurrect it', () => {
  const f=fixture();claimBadge(f);const stale=runtime.createStore({storage:f.storage,now:f.now,definitions});
  f.store.clear();const count=f.writes.length;assert.equal(stale.selectProfileReward('badge','first-feast').reason,'not-earned');
  assert.equal(f.writes.length,count);for(const key of Object.values(KEYS))assert.equal(f.map.has(key),false);
});
test('stale profile save rereads new scores and preserves another tab selection', () => {
  const f=fixture();claimBadge(f);const stale=runtime.createStore({storage:f.storage,now:f.now,definitions});
  f.store.recordLocalScore({gameId:'wicked-bites',score:17});assert.equal(stale.selectProfileReward('badge','first-feast').ok,true);
  assert.equal(raw(f,'profile').localScores['wicked-bites'].best,17);f.store.refreshFromStorage();assert.equal(view(f).groups.badge.selected.awardId,'first-feast');
});
test('change during final prewrite read refuses without overwriting a reset', () => {
  const f=fixture();claimBadge(f);let reads=0;const count=f.writes.length;
  f.deny.mutateRead=key=>{if(key===KEYS.pass && ++reads===2){f.map.delete(KEYS.pass);f.map.delete(KEYS.profile);}};
  assert.equal(f.store.selectProfileReward('badge','first-feast').reason,'state-changed');assert.equal(f.writes.length,count);assert.equal(f.map.has(KEYS.profile),false);
});
test('another tab refresh is read-only and shows selected/cleared state', () => {
  const f=fixture();claimBadge(f);const other=runtime.createStore({storage:f.storage,now:f.now,definitions});
  f.store.selectProfileReward('badge','first-feast');let n=f.writes.length;
  assert.equal(runtime.profileShowcaseView(other.refreshFromStorage()).groups.badge.selected.awardId,'first-feast');assert.equal(f.writes.length,n);
  f.store.selectProfileReward('badge',null);n=f.writes.length;assert.equal(runtime.profileShowcaseView(other.refreshFromStorage()).groups.badge.selected,null);assert.equal(f.writes.length,n);
});
test('no-storage tab refuses saved-profile claims', () => {
  const store=runtime.createStore({definitions});assert.equal(runtime.profileShowcaseView(store.getSnapshot()).available,false);
  assert.equal(store.selectProfileReward('badge',null).reason,'browser-storage-required');
});
test('duplicate configured award identity fails closed', () => {
  const config=structuredClone(definitions);config.rewards.push({...config.rewards[0],id:'duplicate-award'});
  const f=fixture(config);assert.equal(view(f).available,false);assert.equal(f.store.selectProfileReward('badge',null).ok,false);
});
test('native Profile and Rewards supply editable section, labels, controls and links', () => {
  for(const file of ['profile','rewards']){
    const page=JSON.parse(fs.readFileSync(new URL('../studio-project/toadal-feast-website/pages/'+file+'.json',import.meta.url),'utf8'));
    const nodes=[];function walk(o){if(!o||typeof o!=='object')return;if(o.type)nodes.push(o);for(const v of Object.values(o))if(typeof v==='object')walk(v);}
    walk(page);assert.equal(nodes.filter(n=>Object.hasOwn(n.props?.attributes||{},'data-profile-showcase')).length,1);
    assert.equal(nodes.filter(n=>Object.hasOwn(n.props?.attributes||{},'data-showcase-save')).length,2);
    assert.equal(nodes.filter(n=>Object.hasOwn(n.props?.attributes||{},'data-showcase-select')).length,2);
    assert.equal(nodes.some(n=>n.type==='core.text'&&n.props.text==='Your showcase'),true);
  }
});
