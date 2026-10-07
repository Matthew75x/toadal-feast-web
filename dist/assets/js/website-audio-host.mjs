const REGISTRY_SCHEMA = 'toadal.web.audio-registry.v1';
const STORAGE_KEY = 'toadal:web:v1:audio';
const PROTOCOL = 'toadal.game.v1';
const AUDIO_EVENT = 'game:audio';
const AUDIO_HOST = 'host:audio';
const ID = /^[A-Za-z][A-Za-z0-9_.:-]{0,95}$/;
const PARAMS = Object.freeze({ power: [0, 1], combo: [0, 999], pan: [-1, 1], intensity: [0, 1] });
const MAX = Object.freeze({ messageBytes: 2048, encodedBytes: 4 * 1024 * 1024, decodedBytes: 16 * 1024 * 1024, voices: 16 });

// Digital comfort defaults; these do not measure or certify sound pressure at the ear.
const COMFORT = Object.freeze({ master: 0.25, headroom: 0.5, panSpan: 0.6, attack: 0.005, release: 0.01 });

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
  assert(typeof audio.profile === 'string' && ID.test(audio.profile), 'invalid audio profile id');
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
  assert(typeof event === 'string' && ID.test(event), 'invalid audio event');
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

function readPreference(storage) {
  try {
    storage ||= globalThis.localStorage;
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return {
      muted: parsed.muted === true,
      master: finite(parsed.master, 0, 1) ? parsed.master : COMFORT.master,
      sfx: finite(parsed.sfx, 0, 1) ? parsed.sfx : 1,
      menu: finite(parsed.menu, 0, 1) ? parsed.menu : 1,
      gentleStereo: parsed.gentleStereo !== false
    };
  } catch (_) {
    return { muted: false, master: COMFORT.master, sfx: 1, menu: 1, gentleStereo: true };
  }
}
function writePreference(pref, storage) {
  try { storage ||= globalThis.localStorage; storage.setItem(STORAGE_KEY, JSON.stringify(pref)); } catch (_) {}
}

export class WebsiteAudioHost {
  constructor({ shell, frame, gameId, declaration, registry, registryUrl, contextFactory } = {}) {
    assert(shell && frame && gameId, 'player shell/frame/game id required');
    this.shell = shell; this.frame = frame; this.gameId = gameId;
    this.doc = shell.ownerDocument || document; this.playEpoch = 0;
    this.declaration = validateCartridgeAudio(declaration); this.registry = validateRegistry(registry);
    const profile = registry.profiles[this.declaration.profile];
    assert(profile && profile.version === this.declaration.profileVersion, 'declared website audio profile unavailable');
    this.registryUrl = new URL(registryUrl, location.href);
    assert(this.registryUrl.origin === location.origin, 'registry must be same-origin');
    this.contextFactory = contextFactory || (() => new (globalThis.AudioContext || globalThis.webkitAudioContext)());
    this.context = null; this.master = null; this.buses = null; this.pref = readPreference();
    this.active = false; this.activating = false; this.closed = false; this.cache = new Map(); this.cacheBytes = 0;
    this.pending = new Map(); this.voices = new Set(); this.lastAt = new Map(); this.records = [];
    this.soundButton = shell.querySelector('[data-player-sound]');
    this.boundMessage = event => this.onMessage(event);
    this.boundClick = event => this.onSoundControl(event);
    this.boundVisibility = () => { if (this.doc.hidden) this.stopAll('page-hidden'); };
    this.boundPageHide = event => {
      if (!event.persisted) { this.dispose(); return; }
      this.stopAll('pagehide', true);
      if (this.context) Promise.resolve(this.context.suspend()).catch(() => {});
    };
    this.boundPageShow = event => {
      if (!event.persisted || this.closed || !this.active || !this.context) return;
      Promise.resolve(this.context.resume()).then(() => {
        if (this.closed) return;
        this.applyLevels(); this.sendState(this.currentState()); this.syncButton();
      }).catch(() => this.sendState('degraded', { reason: 'resume-failed' }));
    };
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
    this.doc.addEventListener('visibilitychange', this.boundVisibility);
    window.addEventListener('pagehide', this.boundPageHide);
    window.addEventListener('pageshow', this.boundPageShow);
    if (this.soundButton) {
      this.soundButton.addEventListener('click', this.boundClick, true);
      this.soundButton.disabled = false;
      this.soundButton.textContent = 'Enable site sound';
      this.soundButton.setAttribute('aria-pressed', this.pref.muted ? 'true' : 'false');
      this.soundButton.setAttribute('title', 'Use TOADAL shared audio for this game');
    }
    this.mountSettings();
    this.sendState(this.currentState(), { fallback: this.declaration.fallback });
    this.record('available');
  }
  mountSettings() {
    const parent = this.soundButton?.parentElement;
    if (!parent || this.settings || !this.doc.createElement) return;
    const group = this.doc.createElement('div');
    group.setAttribute('data-player-audio-settings', '');
    const label = this.doc.createElement('label');
    label.textContent = 'Site sound volume ';
    const output = this.doc.createElement('output');
    const volume = this.doc.createElement('input');
    volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.step = '1';
    volume.setAttribute('aria-label', 'Site sound volume');
    label.append(output, volume);
    const stereoLabel = this.doc.createElement('label');
    const stereo = this.doc.createElement('input'); stereo.type = 'checkbox';
    stereoLabel.append(stereo, ' Gentler stereo');
    const note = this.doc.createElement('p');
    note.textContent = 'Start with low device volume, especially with headphones. Adjust for comfort and take listening breaks.';
    group.append(label, stereoLabel, note); parent.append(group);
    this.settings = { group, volume, output, stereo };
    this.boundVolume = () => this.setVolume(Number(volume.value) / 100);
    this.boundStereo = () => this.setGentleStereo(stereo.checked);
    volume.addEventListener('input', this.boundVolume);
    stereo.addEventListener('change', this.boundStereo);
    this.syncSettings();
  }
  syncSettings() {
    if (!this.settings) return;
    const percent = String(Math.round(this.pref.master * 100));
    this.settings.volume.value = percent; this.settings.output.textContent = percent + '%';
    this.settings.volume.setAttribute('aria-valuetext', percent + '%');
    this.settings.stereo.checked = this.pref.gentleStereo;
  }
  setVolume(value) {
    if (this.closed || !finite(value, 0, 1)) return false;
    this.pref.master = value; writePreference(this.pref); this.applyLevels(); this.syncSettings();
    return true;
  }
  setGentleStereo(value) {
    if (this.closed || typeof value !== 'boolean') return false;
    this.pref.gentleStereo = value; writePreference(this.pref); this.syncSettings();
    for (const voice of this.voices) if (voice.panner) voice.panner.pan.setTargetAtTime(voice.requestedPan * (value ? COMFORT.panSpan : 1), this.context.currentTime, 0.01);
    return true;
  }
  async onSoundControl(event) {
    if (this.closed) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (this.activating) return;
    if (!this.active || this.context?.state !== 'running') {
      const nextMuted = this.active ? !this.pref.muted : false;
      this.activating = true;
      try {
        await this.unlock();
        if (this.closed) return;
        this.pref.muted = nextMuted;
        if (this.pref.muted) this.stopAll('mute');
        writePreference(this.pref); this.applyLevels();
        this.sendState(this.currentState()); this.syncButton(); this.record('active');
      } catch (error) {
        this.sendState('degraded', { reason: 'unlock-failed' }); this.record('unlock-failed', { error: String(error?.message || error).slice(0, 160) });
      } finally { this.activating = false; }
      return;
    }
    this.pref.muted = !this.pref.muted;
    if (this.pref.muted) this.stopAll('mute');
    writePreference(this.pref); this.applyLevels();
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
      this.master.gain.value = this.pref.muted ? 0 : this.pref.master * COMFORT.headroom;
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -4; compressor.knee.value = 6; compressor.ratio.value = 12;
      compressor.attack.value = 0.002; compressor.release.value = 0.1;
      // User volume is last: compressor makeup gain cannot undo attenuation.
      compressor.connect(this.master); this.master.connect(this.context.destination);
      this.buses = { sfx: this.context.createGain(), menu: this.context.createGain() };
      this.buses.sfx.connect(compressor); this.buses.menu.connect(compressor);
    }
    if (this.context.state !== 'running') await this.context.resume();
    assert(!this.closed, 'audio host disposed');
    this.active = this.context.state === 'running';
    assert(this.active, 'audio context did not unlock');
    this.applyLevels();
    this.prewarmProfile().catch(() => {});
  }
  applyLevels() {
    if (!this.master || !this.buses) return;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(this.pref.muted ? 0 : this.pref.master * COMFORT.headroom, now, 0.01);
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
    // Load sequentially so decoded buffers evicted from the cache are not kept
    // alive by an all-profile Promise.all result array.
    for (const id of this.profileCueIds()) {
      if (this.closed) return;
      if (!this.registry.cues[id]?.sample) continue;
      try { await this.loadSample(id); }
      catch (error) { this.record('sample-failed', { cue: id, error: String(error?.message || error).slice(0, 160) }); }
    }
  }
  sampleUrl(sample) {
    const base = new URL(siteRoot() + '/assets/audio/', location.href);
    const url = new URL(sample.url, base);
    assert(url.origin === location.origin && url.pathname.startsWith(base.pathname) && !url.username && !url.password && !url.search && !url.hash, 'sample URL must stay inside site audio assets');
    return url;
  }
  async loadSample(cueId) {
    assert(!this.closed, 'audio host disposed');
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
      assert(!this.closed, 'audio host disposed');
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
    try { if (encodedLength(message) > MAX.messageBytes) return; } catch (_) { return; }
    if (message.type === 'game:ready') {
      this.sendState(this.currentState(), { fallback: this.declaration.fallback });
      return;
    }
    if (message.type !== AUDIO_EVENT) return;
    const payload = record(message.payload) ? message.payload : {};
    if (typeof payload.event !== 'string' || !ID.test(payload.event)) return;
    let params; try { params = validateParams(payload.params === undefined ? {} : payload.params); } catch (_) { return; }
    if (this.doc.hidden) { this.record('hidden-event', { event: payload.event }); return; }
    if (!this.active) { this.record('inactive-event', { event: payload.event }); return; }
    if (this.pref.muted) { this.record('muted-event', { event: payload.event }); return; }
    let resolved; try { resolved = resolveEvent(this.registry, this.declaration.profile, this.declaration.profileVersion, payload.event, params); } catch (error) {
      this.record('resolve-failed', { event: payload.event, error: String(error?.message || error).slice(0, 160) }); return;
    }
    if (!resolved) { this.record('unmapped-event', { event: payload.event }); return; }
    this.play(resolved).catch(error => this.record('play-failed', { cue: resolved.cueId, error: String(error?.message || error).slice(0, 160) }));
  }
  async play({ cueId, cue, params }) {
    const epoch = this.playEpoch;
    if (this.closed || !this.active || this.pref.muted || this.doc.hidden) return;
    let buffer = null;
    if (cue.sample) { try { buffer = await this.loadSample(cueId); } catch (_) {} }
    // Admission happens after loading: concurrent events cannot reserve the same
    // cooldown/voice slot, and a mute, visibility change or disposal cancels it.
    if (this.closed || epoch !== this.playEpoch || !this.active || this.pref.muted || this.doc.hidden || this.context?.state !== 'running') return;
    const level = clamp(cue.gain * (params.intensity ?? 1) * (0.6 + 0.4 * (params.power ?? 1)), 0, 1);
    if (level === 0 || this.pref.master === 0 || this.pref[cue.bus] === 0) { this.record('silent-event', { cue: cueId }); return; }
    const admit = () => {
      if (this.closed || epoch !== this.playEpoch || !this.active || this.pref.muted || this.doc.hidden || this.context?.state !== 'running') return false;
      if (this.pref.master === 0 || this.pref[cue.bus] === 0) { this.record('silent-event', { cue: cueId }); return false; }
      if (performance.now() - (this.lastAt.get(cueId) ?? -Infinity) < cue.cooldownMs) { this.record('cooldown', { cue: cueId }); return false; }
      return true;
    };
    if (!admit()) return;
    let same = [...this.voices].filter(v => v.cueId === cueId);
    if (same.length >= cue.maxVoices || this.voices.size >= MAX.voices) {
      if (cue.voicePolicy === 'drop') { this.record('voice-drop', { cue: cueId }); return; }
      const victim = (same.length >= cue.maxVoices ? same : [...this.voices]).sort((a,b) => a.started - b.started)[0];
      // A fading voice still consumes a physical slot. Concurrent steals must
      // wait for its ended event and recheck admission before creating a node.
      if (victim) await victim.stop('voice-steal');
      if (!admit()) return;
      same = [...this.voices].filter(v => v.cueId === cueId);
      if (same.length >= cue.maxVoices || this.voices.size >= MAX.voices) { this.record('voice-drop', { cue: cueId }); return; }
    }
    const fallback = buffer ? null : validateFallback(cue.fallback);
    if (!buffer && !fallback) { this.record('no-fallback', { cue: cueId }); return; }
    const bus = this.buses[cue.bus], gain = this.context.createGain();
    const panner = this.context.createStereoPanner ? this.context.createStereoPanner() : null;
    const pan = (params.pan ?? 0) * (this.pref.gentleStereo ? COMFORT.panSpan : 1);
    if (panner) { panner.pan.value = pan; gain.connect(panner); panner.connect(bus); } else gain.connect(bus);
    const t = this.context.currentTime, seconds = buffer ? buffer.duration : fallback.durationMs / 1000;
    const attack = Math.min(COMFORT.attack, seconds / 4), release = Math.min(COMFORT.release, seconds / 4);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + attack);
    if (buffer) gain.gain.setValueAtTime(level, t + seconds - release);
    else gain.gain.exponentialRampToValueAtTime(Math.min(0.0001, level), t + seconds - release);
    gain.gain.linearRampToValueAtTime(0, t + seconds);
    const node = buffer ? this.context.createBufferSource() : this.context.createOscillator();
    if (buffer) node.buffer = buffer;
    else {
      node.type = fallback.wave;
      node.frequency.setValueAtTime(fallback.startHz, t);
      node.frequency.exponentialRampToValueAtTime(fallback.endHz, t + seconds);
    }
    node.connect(gain);
    let finish;
    const done = new Promise(resolve => { finish = resolve; });
    let released = false, stopping = false;
    const voice = {
      cueId, started: performance.now(), panner, requestedPan: params.pan ?? 0,
      stop: (reason, immediate = false) => {
        if (released || (stopping && !immediate)) return done;
        stopping = true;
        const now = this.context.currentTime, end = immediate ? now : now + COMFORT.release;
        try {
          if (gain.gain.cancelAndHoldAtTime) gain.gain.cancelAndHoldAtTime(now);
          else { const held = gain.gain.value; gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(held, now); }
          if (immediate) gain.gain.setValueAtTime(0, now);
          else gain.gain.linearRampToValueAtTime(0, end);
          node.stop(end);
        } catch (_) { cleanup(); }
        this.record('stopped', { cue: cueId, reason });
        return done;
      }
    };
    const cleanup = () => {
      if (released) return; released = true; this.voices.delete(voice);
      try { node.disconnect(); gain.disconnect(); panner?.disconnect(); } catch (_) {}
      finish();
    };
    node.addEventListener('ended', cleanup, { once: true });
    this.voices.add(voice); this.lastAt.set(cueId, voice.started);
    try { node.start(t); node.stop(t + seconds); }
    catch (error) { cleanup(); throw error; }
    this.record('play', { cue: cueId, source: buffer ? 'sample' : 'procedural-fallback', pan });
  }
  stopAll(reason = 'stop-all', immediate = false) { this.playEpoch += 1; for (const voice of [...this.voices]) voice.stop(reason, immediate); }

  dispose() {
    if (this.closed) return; this.closed = true; this.stopAll('dispose', true);
    window.removeEventListener('message', this.boundMessage);
    this.doc.removeEventListener('visibilitychange', this.boundVisibility);
    window.removeEventListener('pagehide', this.boundPageHide);
    window.removeEventListener('pageshow', this.boundPageShow);
    if (this.soundButton) this.soundButton.removeEventListener('click', this.boundClick, true);
    if (this.settings) {
      this.settings.volume.removeEventListener('input', this.boundVolume);
      this.settings.stereo.removeEventListener('change', this.boundStereo);
      this.settings.group.remove(); this.settings = null;
    }
    this.cache.clear(); this.cacheBytes = 0; this.pending.clear();
    try { if (this.context) Promise.resolve(this.context.close()).catch(() => {}); } catch (_) {}
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

async function attachHost({ doc = document, manifest = null } = {}) {
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
  globalThis.__toadalWebsiteAudioHost = host;
  return host;
}


// Concurrent probes of one player document share one attachment/context owner.
const attachments = new WeakMap();
export function attachWebsiteAudioHost({ doc = document, manifest = null } = {}) {
  if (attachments.has(doc)) return attachments.get(doc);
  const task = attachHost({ doc, manifest }).then(host => {
    if (!host) attachments.delete(doc);
    return host;
  }, error => { attachments.delete(doc); throw error; });
  attachments.set(doc, task);
  return task;
}
