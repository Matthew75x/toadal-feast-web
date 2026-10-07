const REGISTRY_SCHEMA = 'toadal.web.audio-registry.v1';
const STORAGE_KEY = 'toadal:web:v1:audio';
const PROTOCOL = 'toadal.game.v1';
const AUDIO_EVENT = 'game:audio';
const AUDIO_HOST = 'host:audio';
const ID = /^[A-Za-z][A-Za-z0-9_.:-]{0,95}$/;
const PARAMS = Object.freeze({ power: [0, 1], combo: [0, 999], pan: [-1, 1], intensity: [0, 1] });
const MAX = Object.freeze({ messageBytes: 2048, encodedBytes: 4 * 1024 * 1024, decodedBytes: 16 * 1024 * 1024, voices: 16 });

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function assert(ok, message) { if (!ok) throw new Error(message); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }
function encodedLength(value) { return new TextEncoder().encode(JSON.stringify(value)).length; }

export function validateCartridgeAudio(input) {
  assert(record(input), 'audio declaration must be an object');
  const audio = copy(input);
  assert(audio.mode === 'host', 'audio.mode must be host for shared playback');
  assert(audio.contractVersion === 1, 'audio.contractVersion must be 1');
  assert(ID.test(audio.profile || ''), 'invalid audio profile id');
  assert(Number.isInteger(audio.profileVersion) && audio.profileVersion >= 1 && audio.profileVersion <= 9999, 'invalid profile version');
  assert(audio.eventMessage === AUDIO_EVENT && audio.hostMessage === AUDIO_HOST, 'audio message contract mismatch');
  assert(['local-before-active', 'silent-before-active'].includes(audio.fallback), 'invalid audio fallback policy');
  const allowed = new Set(['mode','contractVersion','profile','profileVersion','eventMessage','hostMessage','fallback']);
  assert(Object.keys(audio).every(key => allowed.has(key)), 'unknown audio declaration field');
  return Object.freeze(audio);
}

function validateFallback(fallback) {
  if (fallback === undefined || fallback === null) return null;
  assert(record(fallback) && fallback.kind === 'tone', 'fallback kind must be tone');
  assert(['sine','triangle','square','sawtooth'].includes(fallback.wave), 'fallback waveform');
  assert(finite(fallback.startHz, 20, 16000) && finite(fallback.endHz, 20, 16000), 'fallback frequency');
  assert(Number.isInteger(fallback.durationMs) && fallback.durationMs >= 20 && fallback.durationMs <= 4000, 'fallback duration');
  return fallback;
}

function validateCue(id, cue) {
  assert(ID.test(id) && record(cue), 'cue identity');
  assert(['sfx','menu'].includes(cue.bus), 'cue bus');
  assert(finite(cue.gain, 0, 1), 'cue gain');
  assert(Number.isInteger(cue.cooldownMs) && cue.cooldownMs >= 0 && cue.cooldownMs <= 2000, 'cue cooldown');
  assert(Number.isInteger(cue.maxVoices) && cue.maxVoices >= 1 && cue.maxVoices <= 8, 'cue voice limit');
  assert(['drop','steal-oldest'].includes(cue.voicePolicy), 'cue voice policy');
  if (cue.sample !== undefined && cue.sample !== null) {
    assert(record(cue.sample) && typeof cue.sample.url === 'string' && cue.sample.url.length <= 512, 'sample url');
    assert(!cue.sample.url.includes('..') && !cue.sample.url.includes('\\') && !/[?#]/.test(cue.sample.url) && !/^[a-z][a-z0-9+.-]*:/i.test(cue.sample.url) && !cue.sample.url.startsWith('/'), 'sample url must be clean relative path');
    assert(/^[a-f0-9]{64}$/.test(cue.sample.sha256 || ''), 'sample sha256');
  }
  validateFallback(cue.fallback);
  assert(cue.sample || cue.fallback, 'cue needs sample or fallback');
}

function bindingCue(binding, params) {
  if (typeof binding === 'string') return binding;
  assert(record(binding), 'event binding');
  if (typeof binding.cue === 'string') return binding.cue;
  assert(binding.parameter === 'combo' && Array.isArray(binding.ladder) && binding.ladder.length > 0 && binding.ladder.length <= 8, 'event ladder');
  const index = Math.max(0, Math.min(binding.ladder.length - 1, Math.trunc(params.combo || 1) - 1));
  return binding.ladder[index];
}

export function validateRegistry(input) {
  assert(record(input) && input.schema === REGISTRY_SCHEMA && input.version === 1, 'audio registry schema');
  assert(record(input.cues) && Object.keys(input.cues).length <= 128, 'cue registry limit');
  assert(record(input.profiles) && Object.keys(input.profiles).length <= 128, 'profile registry limit');
  for (const [id, cue] of Object.entries(input.cues)) validateCue(id, cue);
  for (const [id, profile] of Object.entries(input.profiles)) {
    assert(ID.test(id) && record(profile), 'profile identity');
    assert(Number.isInteger(profile.version) && profile.version >= 1 && profile.version <= 9999, 'profile version');
    assert(record(profile.events) && Object.keys(profile.events).length <= 128, 'profile event limit');
    for (const [event, binding] of Object.entries(profile.events)) {
      assert(ID.test(event), 'event id');
      const references = typeof binding === 'string' ? [binding] :
        (typeof binding?.cue === 'string' ? [binding.cue] : binding?.ladder);
      assert(Array.isArray(references) && references.length > 0 && references.every(cue => own(input.cues, cue)), 'event cue reference');
      bindingCue(binding, { combo: 1 });
    }
  }
  return input;
}

export function validateParams(input = {}) {
  assert(record(input), 'audio params must be an object');
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    assert(own(PARAMS, key) && finite(value, PARAMS[key][0], PARAMS[key][1]), 'unsafe audio parameter');
    out[key] = value;
  }
  return Object.freeze(out);
}

export function resolveEvent(registry, profileId, profileVersion, event, unsafeParams = {}) {
  validateRegistry(registry);
  assert(ID.test(event || ''), 'invalid audio event');
  const params = validateParams(unsafeParams);
  const profile = registry.profiles[profileId];
  assert(profile && profile.version === profileVersion, 'audio profile/version unavailable');
  if (!own(profile.events, event)) return null;
  const cueId = bindingCue(profile.events[event], params);
  return { cueId, cue: registry.cues[cueId], params };
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function readPreference(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return {
      muted: parsed.muted === true,
      master: finite(parsed.master, 0, 1) ? parsed.master : 0.65,
      sfx: finite(parsed.sfx, 0, 1) ? parsed.sfx : 1,
      menu: finite(parsed.menu, 0, 1) ? parsed.menu : 1
    };
  } catch (_) {
    return { muted: false, master: 0.65, sfx: 1, menu: 1 };
  }
}
function writePreference(pref, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch (_) {}
}

export class WebsiteAudioHost {
  constructor({ shell, frame, gameId, declaration, registry, registryUrl, contextFactory } = {}) {
    assert(shell && frame && gameId, 'player shell/frame/game id required');
    this.shell = shell; this.frame = frame; this.gameId = gameId;
    this.declaration = validateCartridgeAudio(declaration); this.registry = validateRegistry(registry);
    const profile = registry.profiles[this.declaration.profile];
    assert(profile && profile.version === this.declaration.profileVersion, 'declared website audio profile unavailable');
    this.registryUrl = new URL(registryUrl, location.href);
    assert(this.registryUrl.origin === location.origin, 'registry must be same-origin');
    this.contextFactory = contextFactory || (() => new (globalThis.AudioContext || globalThis.webkitAudioContext)());
    this.context = null; this.master = null; this.buses = null; this.pref = readPreference();
    this.active = false; this.closed = false; this.cache = new Map(); this.cacheBytes = 0;
    this.pending = new Map(); this.voices = new Set(); this.lastAt = new Map(); this.records = [];
    this.soundButton = shell.querySelector('[data-player-sound]');
    this.boundMessage = event => this.onMessage(event);
    this.boundClick = event => this.onSoundControl(event);
  }
  record(type, detail = {}) {
    const row = Object.freeze({ atMs: performance.now(), type, ...detail });
    this.records.push(row); if (this.records.length > 128) this.records.shift();
    return row;
  }
  sendState(state, detail = {}) {
    try {
      this.frame.contentWindow.postMessage({
        protocol: PROTOCOL, gameId: this.gameId, type: AUDIO_HOST,
        payload: { state, profile: this.declaration.profile, profileVersion: this.declaration.profileVersion, ...detail }
      }, '*');
    } catch (_) {}
  }
  arm() {
    if (this.closed) return;
    window.addEventListener('message', this.boundMessage);
    if (this.soundButton) {
      this.soundButton.addEventListener('click', this.boundClick, true);
      this.soundButton.disabled = false;
      this.soundButton.textContent = this.pref.muted ? 'Enable site sound' : 'Enable site sound';
      this.soundButton.setAttribute('aria-pressed', this.pref.muted ? 'true' : 'false');
      this.soundButton.setAttribute('title', 'Use TOADAL shared audio for this game');
    }
    const initialState = this.currentState();
    this.sendState(initialState, { fallback: this.declaration.fallback });
    this.record(initialState);
  }
  async onSoundControl(event) {
    if (this.closed) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!this.active) {
      try {
        await this.unlock();
        this.pref.muted = false; writePreference(this.pref); this.applyLevels();
        this.sendState('active'); this.syncButton(); this.record('active');
      } catch (error) {
        this.sendState('degraded', { reason: 'unlock-failed' }); this.record('unlock-failed', { error: String(error?.message || error).slice(0, 160) });
      }
      return;
    }
    this.pref.muted = !this.pref.muted; writePreference(this.pref); this.applyLevels();
    this.sendState(this.pref.muted ? 'muted' : 'active');
    this.syncButton(); this.record('mute', { muted: this.pref.muted });
  }
  syncButton() {
    if (!this.soundButton) return;
    this.soundButton.setAttribute('aria-pressed', this.pref.muted ? 'true' : 'false');
    this.soundButton.textContent = this.pref.muted ? 'Unmute site sound' : 'Mute site sound';
  }
  async unlock() {
    if (!this.context) {
      this.context = this.contextFactory();
      this.master = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -4; compressor.knee.value = 6; compressor.ratio.value = 12;
      compressor.attack.value = 0.002; compressor.release.value = 0.1;
      this.master.connect(compressor); compressor.connect(this.context.destination);
      this.buses = { sfx: this.context.createGain(), menu: this.context.createGain() };
      this.buses.sfx.connect(this.master); this.buses.menu.connect(this.master);
    }
    if (this.context.state !== 'running') await this.context.resume();
    this.active = this.context.state === 'running';
    assert(this.active, 'audio context did not unlock');
    this.applyLevels();
    await this.prewarmProfile();
  }
  applyLevels() {
    if (!this.master || !this.buses) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.pref.muted ? 0 : this.pref.master, now, 0.01);
    this.buses.sfx.gain.setTargetAtTime(this.pref.sfx, now, 0.01);
    this.buses.menu.gain.setTargetAtTime(this.pref.menu, now, 0.01);
  }
  profileCueIds() {
    const profile = this.registry.profiles[this.declaration.profile];
    const ids = new Set();
    for (const binding of Object.values(profile.events)) {
      if (typeof binding === 'string') ids.add(binding);
      else if (typeof binding.cue === 'string') ids.add(binding.cue);
      else for (const id of binding.ladder || []) ids.add(id);
    }
    return [...ids];
  }
  async prewarmProfile() {
    const jobs = this.profileCueIds().map(id => this.registry.cues[id]?.sample ? this.loadSample(id).catch(error => {
      this.record('sample-failed', { cue: id, error: String(error?.message || error).slice(0, 160) });
      return null;
    }) : null);
    await Promise.all(jobs.filter(Boolean));
  }
  sampleUrl(sample) {
    const base = new URL(siteRoot() + '/assets/audio/', location.href);
    const url = new URL(sample.url, base);
    assert(url.origin === location.origin && url.pathname.startsWith(base.pathname) && !url.username && !url.password && !url.search && !url.hash, 'sample URL must stay inside site audio assets');
    return url;
  }
  async loadSample(cueId) {
    if (this.cache.has(cueId)) return this.cache.get(cueId).buffer;
    if (this.pending.has(cueId)) return this.pending.get(cueId);
    const cue = this.registry.cues[cueId], sample = cue.sample;
    assert(sample, 'sample unavailable');
    const task = (async () => {
      const response = await fetch(this.sampleUrl(sample), { credentials: 'same-origin', redirect: 'error', cache: 'default' });
      assert(response.ok, 'sample HTTP ' + response.status);
      const bytes = new Uint8Array(await response.arrayBuffer());
      assert(bytes.byteLength <= MAX.encodedBytes, 'encoded sample budget');
      assert(await sha256Hex(bytes) === sample.sha256, 'sample digest mismatch');
      const buffer = await this.context.decodeAudioData(bytes.buffer.slice(0));
      const cost = buffer.length * buffer.numberOfChannels * 4;
      assert(buffer.duration > 0 && buffer.duration <= 12 && buffer.numberOfChannels <= 2 && cost <= MAX.decodedBytes, 'decoded sample budget');
      while (this.cacheBytes + cost > MAX.decodedBytes && this.cache.size) {
        const first = this.cache.keys().next().value, old = this.cache.get(first);
        this.cache.delete(first); this.cacheBytes -= old.cost;
      }
      this.cache.set(cueId, { buffer, cost }); this.cacheBytes += cost;
      return buffer;
    })().finally(() => this.pending.delete(cueId));
    this.pending.set(cueId, task); return task;
  }
  currentState() {
    if (this.pref.muted) return 'muted';
    return this.active ? 'active' : 'available';
  }
  onMessage(event) {
    if (this.closed || event.source !== this.frame.contentWindow || event.origin !== 'null') return;
    const message = event.data;
    if (!record(message) || message.protocol !== PROTOCOL || message.gameId !== this.gameId) return;
    if (encodedLength(message) > MAX.messageBytes) return;
    if (message.type === 'game:ready') {
      this.sendState(this.currentState(), { fallback: this.declaration.fallback });
      return;
    }
    if (message.type !== AUDIO_EVENT) return;
    const payload = record(message.payload) ? message.payload : {};
    if (!ID.test(payload.event || '')) return;
    let params; try { params = validateParams(payload.params || {}); } catch (_) { return; }
    if (!this.active) { this.record('inactive-event', { event: payload.event }); return; }
    if (this.pref.muted) { this.record('muted-event', { event: payload.event }); return; }
    let resolved; try { resolved = resolveEvent(this.registry, this.declaration.profile, this.declaration.profileVersion, payload.event, params); } catch (error) {
      this.record('resolve-failed', { event: payload.event, error: String(error?.message || error).slice(0, 160) }); return;
    }
    if (!resolved) { this.record('unmapped-event', { event: payload.event }); return; }
    this.play(resolved).catch(error => this.record('play-failed', { cue: resolved.cueId, error: String(error?.message || error).slice(0, 160) }));
  }
  async play({ cueId, cue, params }) {
    const nowMs = performance.now();
    if (nowMs - (this.lastAt.get(cueId) ?? -Infinity) < cue.cooldownMs) { this.record('cooldown', { cue: cueId }); return; }
    const same = [...this.voices].filter(v => v.cueId === cueId);
    if (same.length >= cue.maxVoices || this.voices.size >= MAX.voices) {
      if (cue.voicePolicy === 'drop') { this.record('voice-drop', { cue: cueId }); return; }
      const victim = (same.length >= cue.maxVoices ? same : [...this.voices]).sort((a,b) => a.started - b.started)[0];
      victim?.stop('voice-steal');
    }
    let buffer = null;
    if (cue.sample) { try { buffer = await this.loadSample(cueId); } catch (_) {} }
    const bus = this.buses[cue.bus], gain = this.context.createGain();
    const panner = this.context.createStereoPanner ? this.context.createStereoPanner() : null;
    const intensity = params.intensity ?? 1, power = params.power ?? 1;
    gain.gain.value = clamp(cue.gain * intensity * (0.6 + 0.4 * power), 0, 1);
    if (panner) { panner.pan.value = params.pan ?? 0; gain.connect(panner); panner.connect(bus); } else gain.connect(bus);
    let node, done;
    if (buffer) {
      node = this.context.createBufferSource(); node.buffer = buffer; node.connect(gain);
      done = new Promise(resolve => node.addEventListener('ended', resolve, { once: true })); node.start();
    } else {
      const fallback = validateFallback(cue.fallback);
      if (!fallback) { gain.disconnect(); panner?.disconnect(); this.record('no-fallback', { cue: cueId }); return; }
      node = this.context.createOscillator(); node.type = fallback.wave; node.connect(gain);
      const t = this.context.currentTime, seconds = fallback.durationMs / 1000;
      node.frequency.setValueAtTime(fallback.startHz, t);
      if (fallback.startHz > 0 && fallback.endHz > 0) node.frequency.exponentialRampToValueAtTime(fallback.endHz, t + seconds);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
      done = new Promise(resolve => node.addEventListener('ended', resolve, { once: true })); node.start(); node.stop(t + seconds + 0.01);
    }
    let released = false;
    const voice = {
      cueId, started: nowMs,
      stop: reason => { if (released) return; released = true; try { node.stop(); } catch (_) {} this.voices.delete(voice); this.record('stopped', { cue: cueId, reason }); }
    };
    this.voices.add(voice); this.lastAt.set(cueId, nowMs);
    this.record('play', { cue: cueId, source: buffer ? 'sample' : 'procedural-fallback' });
    done.finally(() => { if (!released) { released = true; this.voices.delete(voice); } try { gain.disconnect(); panner?.disconnect(); } catch (_) {} });
  }
  stopAll(reason = 'stop-all') { for (const voice of [...this.voices]) voice.stop(reason); }
  dispose() {
    if (this.closed) return; this.closed = true; this.stopAll('dispose');
    window.removeEventListener('message', this.boundMessage);
    if (this.soundButton) this.soundButton.removeEventListener('click', this.boundClick, true);
    try { this.context?.suspend(); } catch (_) {}
  }
}

function cartridgeManifestUrl(frame) {
  const entry = new URL(frame.src, location.href);
  assert(entry.origin === location.origin, 'cartridge entry must be same-origin');
  return new URL('cartridge.json', entry);
}
function siteRoot() {
  const brand = document.querySelector('.site-brand');
  const path = brand ? new URL(brand.href, location.href).pathname : '/';
  return path === '/' ? '' : path.replace(/\/+$/, '');
}

export async function attachWebsiteAudioHost({ doc = document, manifest = null } = {}) {
  const shell = doc.querySelector('[data-player-shell]'); if (!shell) return null;
  const frame = shell.querySelector('[data-player-frame]'); const gameId = shell.getAttribute('data-game-id') || '';
  if (!frame || !gameId) return null;
  if (!manifest) {
    try {
      const response = await fetch(cartridgeManifestUrl(frame), { credentials: 'same-origin', redirect: 'error', cache: 'no-cache' });
      if (!response.ok) return null; manifest = await response.json();
    } catch (_) { return null; }
  }
  if (!manifest.audio || manifest.audio.mode !== 'host') return null;
  let declaration; try { declaration = validateCartridgeAudio(manifest.audio); } catch (_) { return null; }
  const registryUrl = new URL(siteRoot() + '/assets/data/audio-registry.json', location.href);
  let registry;
  try {
    const response = await fetch(registryUrl, { credentials: 'same-origin', redirect: 'error', cache: 'no-cache' });
    assert(response.ok, 'audio registry HTTP ' + response.status); registry = validateRegistry(await response.json());
  } catch (_) {
    try { frame.contentWindow.postMessage({ protocol: PROTOCOL, gameId, type: AUDIO_HOST, payload: { state: 'unavailable' } }, '*'); } catch (_) {}
    return null;
  }
  let host;
  try { host = new WebsiteAudioHost({ shell, frame, gameId, declaration, registry, registryUrl }); }
  catch (_) {
    try { frame.contentWindow.postMessage({ protocol: PROTOCOL, gameId, type: AUDIO_HOST, payload: { state: 'unavailable' } }, '*'); } catch (_) {}
    return null;
  }
  host.arm();
  window.addEventListener('pagehide', () => host.dispose(), { once: true });
  globalThis.__toadalWebsiteAudioHost = host;
  return host;
}

