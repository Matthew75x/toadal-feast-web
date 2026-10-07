import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateCartridgeAudio,
  validateRegistry,
  validateParams,
  resolveEvent
} from '../studio-project/toadal-feast-website/reference/assets/js/website-audio-host.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'data', 'audio-registry.json');

const declaration = {
  mode: 'host',
  contractVersion: 1,
  profile: 'fixture-game',
  profileVersion: 1,
  eventMessage: 'game:audio',
  hostMessage: 'host:audio',
  fallback: 'local-before-active'
};

const registry = {
  schema: 'toadal.web.audio-registry.v1',
  version: 1,
  policy: {},
  cues: {
    'global.confirm': {
      bus: 'menu', gain: 0.5, cooldownMs: 30, maxVoices: 2, voicePolicy: 'drop',
      fallback: { kind: 'tone', wave: 'sine', startHz: 440, endHz: 660, durationMs: 80 }
    },
    'fixture.collect.1': {
      bus: 'sfx', gain: 0.6, cooldownMs: 0, maxVoices: 4, voicePolicy: 'steal-oldest',
      fallback: { kind: 'tone', wave: 'triangle', startHz: 523.25, endHz: 523.25, durationMs: 80 }
    },
    'fixture.collect.2': {
      bus: 'sfx', gain: 0.6, cooldownMs: 0, maxVoices: 4, voicePolicy: 'steal-oldest',
      fallback: { kind: 'tone', wave: 'triangle', startHz: 659.25, endHz: 659.25, durationMs: 80 }
    }
  },
  profiles: {
    'fixture-game': {
      version: 1,
      events: {
        'ui.confirm': 'global.confirm',
        'collect.item': { parameter: 'combo', ladder: ['fixture.collect.1', 'fixture.collect.2'] }
      }
    }
  }
};

test('host audio declaration is explicit and bounded', () => {
  assert.equal(validateCartridgeAudio(declaration).profile, 'fixture-game');
  assert.throws(() => validateCartridgeAudio({ ...declaration, profile: '../escape' }), /profile/);
  assert.throws(() => validateCartridgeAudio({ ...declaration, assetUrl: 'game-controlled.wav' }), /unknown/);
  assert.throws(() => validateCartridgeAudio({ ...declaration, fallback: 'always-local' }), /fallback/);
});

test('registry maps semantic events to central cues', () => {
  validateRegistry(registry);
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'ui.confirm').cueId, 'global.confirm');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'collect.item', { combo: 1 }).cueId, 'fixture.collect.1');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'collect.item', { combo: 99 }).cueId, 'fixture.collect.2');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'unknown.event'), null);
});

test('game-supplied playback parameters are numeric and allowlisted only', () => {
  assert.deepEqual(validateParams({ power: 0.5, combo: 3, pan: -0.4, intensity: 0.8 }), { power: 0.5, combo: 3, pan: -0.4, intensity: 0.8 });
  assert.throws(() => validateParams({ url: 'sound.wav' }), /unsafe/);
  assert.throws(() => validateParams({ pan: 4 }), /unsafe/);
  assert.throws(() => validateParams({ intensity: Number.NaN }), /unsafe/);
});

test('same global cue can be referenced by more than one game profile', () => {
  const multi = structuredClone(registry);
  multi.profiles['second-game'] = { version: 1, events: { 'ui.confirm': 'global.confirm' } };
  validateRegistry(multi);
  assert.equal(resolveEvent(multi, 'fixture-game', 1, 'ui.confirm').cueId, 'global.confirm');
  assert.equal(resolveEvent(multi, 'second-game', 1, 'ui.confirm').cueId, 'global.confirm');
});

test('sample definitions require a digest and clean relative path', () => {
  const sampled = structuredClone(registry);
  sampled.cues['global.confirm'].sample = { url: 'ui-confirm.wav', sha256: 'a'.repeat(64) };
  validateRegistry(sampled);
  sampled.cues['global.confirm'].sample.url = '../escape.wav';
  assert.throws(() => validateRegistry(sampled), /relative path/);
  sampled.cues['global.confirm'].sample.url = 'https://game.invalid/sound.wav';
  assert.throws(() => validateRegistry(sampled), /relative path/);
});

test('checked-in production registry starts empty until approved profiles exist', () => {
  const checked = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  validateRegistry(checked);
  assert.deepEqual(checked.cues, {});
  assert.deepEqual(checked.profiles, {});
});

test('current protected Wicked Bites cartridge is not silently migrated', () => {
  const manifestPath = path.join(root, 'dist', 'public', 'games', 'wicked-bites', 'cartridge.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(!manifest.audio || manifest.audio.mode !== 'host');
});

test('runtime source never accepts game-supplied URLs or recipes in game:audio', () => {
  const source = fs.readFileSync(path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'js', 'website-audio-host.mjs'), 'utf8');
  assert.match(source, /message\.type !== AUDIO_EVENT/);
  assert.match(source, /resolveEvent\(this\.registry/);
  assert.doesNotMatch(source, /payload\.(?:url|src|recipe)/);
});


test('player advanced code loads shared audio module only on player pages', () => {
  const advancedPath = path.join(root, 'studio-project', 'toadal-feast-website', 'collections', 'advanced-code.json');
  const advanced = JSON.parse(fs.readFileSync(advancedPath, 'utf8')).javascript;
  assert.match(advanced, /function initWebsiteAudioHostLoader\(\)/);
  assert.match(advanced, /document\.querySelector\('\[data-player-shell\]'\)/);
  assert.match(advanced, /\/assets\/js\/website-audio-loader\.mjs/);
  assert.match(advanced, /try \{ initWebsiteAudioHostLoader\(\); \} catch \(error\) \{\}/);
});


test('tiny loader gates the full audio runtime behind manifest opt-in', () => {
  const loader = fs.readFileSync(path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'js', 'website-audio-loader.mjs'), 'utf8');
  assert.match(loader, /manifest\.audio\.mode !== 'host'/);
  assert.match(loader, /import\(moduleUrl\.href\)/);
  assert.doesNotMatch(loader, /new \(globalThis\.AudioContext/);
});


test('qualified local site server serves module files as JavaScript', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'serve-qualified-dist.mjs'), 'utf8');
  assert.match(source, /'\.mjs': 'application\/javascript'/);
});

import { WebsiteAudioHost, attachWebsiteAudioHost } from '../studio-project/toadal-feast-website/reference/assets/js/website-audio-host.mjs';
import { createToadalHostAudioAdapter } from './cartridge-hardener/templates/host-audio-adapter.mjs';
import { loadWebsiteAudioHost } from '../studio-project/toadal-feast-website/reference/assets/js/website-audio-loader.mjs';

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); }
  };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function fakeContext() {
  const sources = [], gains = [], panners = [], connections = [];
  const param = () => ({ value: 0, calls: [],
    setTargetAtTime(...args) { this.calls.push(['target', ...args]); },
    setValueAtTime(...args) { this.calls.push(['set', ...args]); },
    linearRampToValueAtTime(...args) { this.calls.push(['linear', ...args]); },
    exponentialRampToValueAtTime(...args) { this.calls.push(['exponential', ...args]); },
    cancelScheduledValues(...args) { this.calls.push(['cancel', ...args]); },
    cancelAndHoldAtTime(...args) { this.calls.push(['hold', ...args]); }
  });
  const context = {
    state: 'running', currentTime: 0, destination: {}, sources, gains, panners, connections,
    async resume() { this.state = 'running'; }, async suspend() { this.state = 'suspended'; }, async close() { this.state = 'closed'; },
    finishStops() { for (const source of sources) if (source.stopCalls.length) source.dispatch('ended'); }
  };
  const node = () => ({ ...eventTarget(), stopCalls: [],
    connect(to) { connections.push([this, to]); }, disconnect() {}, start() {},
    stop(when) { this.stopCalls.push(when); if (when <= context.currentTime) this.dispatch('ended'); }
  });
  context.createGain = () => { const gain = { ...node(), gain: param() }; gains.push(gain); return gain; };
  context.createDynamicsCompressor = () => ({ ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  context.createStereoPanner = () => { const panner = { ...node(), pan: param() }; panners.push(panner); return panner; };
  context.createBufferSource = context.createOscillator = () => { const source = { ...node(), frequency: param() }; sources.push(source); return source; };
  return context;
}
function hostFixture(t, preference = {}) {
  const prior = new Map();
  function set(key, value) { prior.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const win = eventTarget(), button = { ...eventTarget(), setAttribute() {} }, states = [], stored = new Map([['toadal:web:v1:audio', JSON.stringify(preference)]]);
  const frame = { src: 'http://localhost/toadal-feast-web/public/games/fixture-game/index.html', contentWindow: { postMessage: m => states.push(m.payload.state) } };
  const doc = { ...eventTarget(), hidden: false, querySelector: selector => selector === '[data-player-shell]' ? shell : { href: 'http://localhost/toadal-feast-web/' } };
  const shell = { ownerDocument: doc, querySelector: selector => selector === '[data-player-frame]' ? frame : button, getAttribute: () => 'fixture-game' };
  set('window', win); set('document', doc); set('location', new URL('http://localhost/toadal-feast-web/player/fixture-game/'));
  set('localStorage', { getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value) });
  const context = fakeContext(); let contexts = 0;
  const host = new WebsiteAudioHost({ shell, frame, gameId: 'fixture-game', declaration, registry: structuredClone(registry), registryUrl: 'http://localhost/toadal-feast-web/assets/data/audio-registry.json', contextFactory: () => { contexts++; return context; } });
  t.after(() => { host.dispose(); for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  return { host, doc, win, frame, shell, states, stored, context, get contexts() { return contexts; } };
}
const click = () => ({ preventDefault() {}, stopImmediatePropagation() {} });
const flush = () => new Promise(resolve => setImmediate(resolve));

function adapterFixture() {
  let handler; const local = [], sent = [], parent = { postMessage: message => sent.push(message) };
  const win = { parent, document: { referrer: 'http://localhost/player/' }, addEventListener: (_, fn) => { handler = fn; }, removeEventListener() {} };
  const adapter = createToadalHostAudioAdapter({ gameId: 'fixture-game', legacy: (...args) => local.push(args), win });
  const state = value => handler({ source: parent, origin: 'http://localhost', data: { protocol: 'toadal.game.v1', gameId: 'fixture-game', type: 'host:audio', payload: { state: value } } });
  return { adapter, local, sent, parent, state };
}

test('adapter retains host ownership through degradation, mute and transport failure until explicit unavailable', () => {
  const f = adapterFixture();
  assert.equal(f.adapter.emit(['ui.confirm']), false);
  assert.equal(f.adapter.emit('ui.confirm'), 'legacy');
  f.state('active');
  for (const state of ['active', 'degraded', 'available', 'muted', 'degraded', 'available']) {
    f.state(state); assert.equal(f.adapter.hostOwnsPlayback, true); assert.equal(f.adapter.emit('ui.confirm'), 'host');
  }
  f.parent.postMessage = () => { throw Error('transport failure'); };
  assert.equal(f.adapter.emit('ui.confirm'), false); assert.equal(f.local.length, 1);
  f.state('unavailable'); assert.equal(f.adapter.hostOwnsPlayback, false); assert.equal(f.adapter.emit('ui.confirm'), 'legacy');
  assert.equal(f.local.length, 2); f.adapter.dispose();
});

test('delayed sample completion admits only one cooldown slot', async t => {
  const { host } = hostFixture(t); await host.unlock();
  const pending = deferred(); host.loadSample = () => pending.promise;
  const cue = { ...registry.cues['global.confirm'], sample: {}, cooldownMs: 1000, maxVoices: 8 };
  const plays = Array.from({ length: 20 }, () => host.play({ cueId: 'global.confirm', cue, params: {} }));
  pending.resolve({ duration: 1 }); await Promise.all(plays);
  assert.equal(host.records.filter(r => r.type === 'play').length, 1); assert.equal(host.voices.size, 1);
  assert.equal(host.records.filter(r => r.type === 'cooldown').length, 19);
});

test('delayed sample completion respects per-cue and global voice caps', async t => {
  const { host, context } = hostFixture(t); await host.unlock();
  const pending = deferred(); host.loadSample = () => pending.promise;
  const cue = { ...registry.cues['global.confirm'], sample: {}, cooldownMs: 0, maxVoices: 1 };
  const plays = Array.from({ length: 20 }, () => host.play({ cueId: 'global.confirm', cue, params: {} }));
  pending.resolve({ duration: 1 }); await Promise.all(plays); assert.equal(host.voices.size, 1);
  host.stopAll(); context.finishStops();
  await Promise.all(Array.from({ length: 20 }, (_, i) => host.play({ cueId: 'cue-' + i, cue, params: {} })));
  assert.equal(host.voices.size, 16);
});

test('mute, visibility and disposal invalidate playback awaiting a sample', async t => {
  for (const transition of ['mute', 'hidden', 'dispose']) {
    await t.test(transition, async child => {
      const { host, doc } = hostFixture(child); host.arm(); await host.unlock();
      const pending = deferred(); host.loadSample = () => pending.promise;
      const task = host.play({ cueId: 'global.confirm', cue: { ...registry.cues['global.confirm'], sample: {} }, params: {} });
      if (transition === 'mute') { await host.onSoundControl(click()); await host.onSoundControl(click()); }
      if (transition === 'hidden') { doc.hidden = true; doc.dispatch('visibilitychange'); doc.hidden = false; }
      if (transition === 'dispose') host.dispose();
      pending.resolve({}); await task;
      assert.equal(host.records.filter(r => r.type === 'play').length, 0); assert.equal(host.voices.size, 0);
    });
  }
});

test('activation creates one context and prewarm cannot undo a subsequent mute', async t => {
  const f = hostFixture(t), prewarm = deferred(), resumed = deferred();
  f.context.state = 'suspended'; f.context.resume = async () => { await resumed.promise; f.context.state = 'running'; };
  f.host.prewarmProfile = () => prewarm.promise;
  const activation = f.host.onSoundControl(click()); await f.host.onSoundControl(click());
  assert.equal(f.contexts, 1); resumed.resolve(); await activation;
  await f.host.onSoundControl(click()); assert.equal(f.host.pref.muted, true);
  prewarm.resolve(); await flush(); assert.equal(f.host.pref.muted, true); assert.equal(f.contexts, 1);
});

test('stored website mute suppresses playback before any gesture and storage denial remains usable', async t => {
  const f = hostFixture(t, { muted: true, master: 5 }); f.host.arm();
  assert.equal(f.states.at(-1), 'muted'); assert.equal(f.contexts, 0); assert.equal(f.host.pref.master, 0.25);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('storage denied'); } });
  const second = new WebsiteAudioHost({ shell: f.shell, frame: f.frame, gameId: 'fixture-game', declaration, registry, registryUrl: 'http://localhost/audio-registry.json', contextFactory: () => f.context });
  assert.equal(second.pref.muted, false); await second.onSoundControl(click()); assert.equal(second.active, true); second.dispose();
});

test('malformed, foreign, or authority-bearing cartridge messages cannot select playback', async t => {
  const f = hostFixture(t); await f.host.unlock();
  const message = { protocol: 'toadal.game.v1', gameId: 'fixture-game', type: 'game:audio', payload: { event: 'ui.confirm', params: {} } };
  const cyclic = structuredClone(message); cyclic.loop = cyclic;
  for (const data of [cyclic, { ...message, big: 1n }, { ...message, payload: { event: ['ui.confirm'] } }, { ...message, payload: { event: 'ui.confirm', params: false } }, { ...message, payload: { event: 'ui.confirm', params: { url: 'x.wav' } } }, { ...message, payload: { event: 'ui.confirm', params: { bus: 'sfx', gain: 10, recipe: {} } } }]) {
    assert.doesNotThrow(() => f.host.onMessage({ source: f.frame.contentWindow, origin: 'null', data }));
  }
  f.host.onMessage({ source: {}, origin: 'null', data: message });
  f.host.onMessage({ source: f.frame.contentWindow, origin: 'http://localhost', data: message });
  assert.equal(f.host.records.filter(r => r.type === 'play').length, 0);
});

test('visibility stops voices and BFCache restore reuses the same activated context', async t => {
  const f = hostFixture(t); f.host.arm(); await f.host.onSoundControl(click());
  await f.host.play({ cueId: 'global.confirm', cue: registry.cues['global.confirm'], params: {} });
  f.doc.hidden = true; f.doc.dispatch('visibilitychange'); assert.equal(f.host.voices.size, 1); f.context.finishStops(); assert.equal(f.host.voices.size, 0); f.doc.hidden = false;
  f.win.dispatch('pagehide', { persisted: true }); await flush(); assert.equal(f.host.closed, false); assert.equal(f.context.state, 'suspended');
  f.win.dispatch('pageshow', { persisted: true }); await flush(); assert.equal(f.context.state, 'running'); assert.equal(f.contexts, 1);
  await f.context.suspend(); await f.host.onSoundControl(click());
  assert.equal(f.host.pref.muted, true); assert.equal(f.context.state, 'running'); assert.equal(f.contexts, 1);
  f.win.dispatch('pagehide', { persisted: false }); await flush(); assert.equal(f.host.closed, true); assert.equal(f.context.state, 'closed'); assert.equal(f.host.cacheBytes, 0);
});

test('profile sample prewarming has one pending load at a time', async t => {
  const f = hostFixture(t), pending = deferred(), calls = [];
  for (const cue of Object.values(f.host.registry.cues)) cue.sample = {};
  f.host.loadSample = id => { calls.push(id); return pending.promise; };
  const task = f.host.prewarmProfile(); assert.equal(calls.length, 1); pending.resolve({}); await task; assert.equal(calls.length, 3);
});

test('non-opted-in loader performs only a manifest probe', async t => {
  const f = hostFixture(t), oldFetch = globalThis.fetch, requests = [];
  t.after(() => { globalThis.fetch = oldFetch; });
  globalThis.fetch = async url => { requests.push(String(url)); return { ok: true, json: async () => ({ id: 'fixture-game' }) }; };
  assert.equal(await loadWebsiteAudioHost({ doc: f.doc }), null); assert.equal(requests.length, 1); assert.match(requests[0], /cartridge\.json$/); assert.equal(f.contexts, 0);
});

test('concurrent opted-in attachments share one host and registry request', async t => {
  const f = hostFixture(t), oldFetch = globalThis.fetch; let requests = 0;
  t.after(() => { globalThis.fetch = oldFetch; });
  globalThis.fetch = async () => { requests++; return { ok: true, json: async () => structuredClone(registry) }; };
  const options = { doc: f.doc, manifest: { id: 'fixture-game', audio: declaration } };
  const [a, b] = await Promise.all([attachWebsiteAudioHost(options), attachWebsiteAudioHost(options)]);
  assert.equal(a, b); assert.equal(requests, 1); assert.equal(a.context, null); a.dispose(); delete globalThis.__toadalWebsiteAudioHost;
});


test('volume and gentler stereo persist without activation or releasing muted ownership', async t => {
  const f = hostFixture(t, { muted: true }); f.host.arm();
  assert.equal(f.host.pref.master, 0.25); assert.equal(f.host.pref.gentleStereo, true);
  assert.equal(f.host.setVolume(0.1), true); assert.equal(f.host.setGentleStereo(false), true);
  for (const value of [-1, 2, NaN, '0.5']) assert.equal(f.host.setVolume(value), false);
  assert.equal(f.host.setGentleStereo('false'), false);
  assert.equal(f.contexts, 0); assert.equal(f.host.currentState(), 'muted');
  assert.deepEqual(JSON.parse(f.stored.get('toadal:web:v1:audio')), { muted: true, master: 0.1, sfx: 1, menu: 1, gentleStereo: false });
  assert.deepEqual([...f.stored.keys()], ['toadal:web:v1:audio']);
});

test('user volume sits after compression and zero volume emits no source', async t => {
  const f = hostFixture(t); await f.host.unlock();
  const output = f.context.connections.find(([from, to]) => to === f.context.destination);
  assert.equal(output[0], f.host.master);
  assert.ok(f.context.connections.some(([from, to]) => from.threshold && to === f.host.master));
  assert.equal(f.host.master.gain.value, 0.125);
  f.host.setVolume(0); assert.deepEqual(f.host.master.gain.calls.at(-1), ['target', 0, 0, 0.01]);
  await f.host.play(resolveEvent(registry, 'fixture-game', 1, 'ui.confirm'));
  assert.equal(f.context.sources.length, 0); assert.equal(f.host.records.at(-1).type, 'silent-event');
});

test('tone and sampled cues have zero edges, bounded panning and exact zero intensity', async t => {
  const f = hostFixture(t); await f.host.unlock();
  const cue = { ...registry.cues['global.confirm'], cooldownMs: 0 };
  await f.host.play({ cueId: 'global.confirm', cue, params: { pan: 1 } });
  assert.equal(f.context.panners.at(-1).pan.value, 0.6);
  const toneGain = f.context.gains.at(-1).gain.calls;
  assert.deepEqual(toneGain[0], ['set', 0, 0]); assert.deepEqual(toneGain[1], ['linear', 0.5, 0.005]);
  assert.deepEqual(toneGain.at(-1), ['linear', 0, 0.08]);
  f.host.setGentleStereo(false); f.host.loadSample = async () => ({ duration: 0.1 });
  await f.host.play({ cueId: 'sample', cue: { ...cue, sample: {} }, params: { pan: -1 } });
  assert.equal(f.context.panners.at(-1).pan.value, -1);
  const sampleGain = f.context.gains.at(-1).gain.calls;
  assert.deepEqual(sampleGain[0], ['set', 0, 0]); assert.deepEqual(sampleGain.at(-1), ['linear', 0, 0.1]);
  const count = f.context.sources.length;
  await f.host.play({ cueId: 'zero', cue, params: { intensity: 0 } }); assert.equal(f.context.sources.length, count);
});

test('fading steals retain physical voice slots and recheck cap after ended', async t => {
  const f = hostFixture(t); await f.host.unlock();
  const cue = { ...registry.cues['global.confirm'], cooldownMs: 0, maxVoices: 1, voicePolicy: 'steal-oldest' };
  const event = { cueId: 'global.confirm', cue, params: {} };
  await f.host.play(event);
  const burst = Array.from({ length: 20 }, () => f.host.play(event));
  assert.equal(f.context.sources.length, 1); assert.equal(f.host.voices.size, 1);
  assert.equal(f.context.sources[0].stopCalls.at(-1), 0.01);
  f.context.sources[0].dispatch('ended'); await Promise.all(burst);
  assert.equal(f.context.sources.length, 2); assert.equal(f.host.voices.size, 1);
  assert.equal(f.host.records.filter(r => r.type === 'voice-drop').length, 19);
  const next = f.host.play(event); f.host.stopAll('mute'); f.host.pref.muted = true;
  f.context.sources[1].dispatch('ended'); await next;
  assert.equal(f.context.sources.length, 2); assert.equal(f.host.voices.size, 0);
});


test('zero volume during a faded steal cancels replacement without a new source', async t => {
  const f = hostFixture(t); await f.host.unlock();
  const cue = { ...registry.cues['global.confirm'], cooldownMs: 0, maxVoices: 1, voicePolicy: 'steal-oldest' };
  const event = { cueId: 'global.confirm', cue, params: {} };
  await f.host.play(event); const pending = f.host.play(event);
  f.host.setVolume(0); f.context.sources[0].dispatch('ended'); await pending;
  assert.equal(f.context.sources.length, 1); assert.equal(f.host.records.at(-1).type, 'silent-event');
});

test('gentler stereo adjusts currently playing panners with a short ramp', async t => {
  const f = hostFixture(t); await f.host.unlock();
  await f.host.play({ cueId: 'global.confirm', cue: registry.cues['global.confirm'], params: { pan: -1 } });
  f.host.setGentleStereo(false);
  assert.deepEqual(f.context.panners.at(-1).pan.calls.at(-1), ['target', -1, 0, 0.01]);
  f.host.setGentleStereo(true);
  assert.deepEqual(f.context.panners.at(-1).pan.calls.at(-1), ['target', -0.6, 0, 0.01]);
});
