// ============================================================
// src/runtime/platform/audio-manager.js â€” AudioManager
// Load order: after src/runtime/shared/balance.js, before src/runtime/shared/characters.js / game.js
// Creates globals: AudioManager
// Consumes: SaveManager (optional â€” graceful if absent)
// ============================================================
//
// ARCHITECTURE
//   AudioContext
//     â””â”€ masterGain â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º destination
//           â”œâ”€ sfxGain â—„â”€â”€ one-shot BufferSourceNodes
//           â””â”€ bgmGain â—„â”€â”€ looping BGM BufferSourceNode
//
// MISSING ASSET STRATEGY
//   All fetch/decode errors are swallowed silently.
//   buffers[key] = null means "failed â€” stay silent".
//   The game runs normally with no audio files present.
// ============================================================

const AudioManager = (() => {

  // â”€â”€ Track manifest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TRACK_MANIFEST = [];
  // The six legacy sampled food WAVs are retained in source for provenance
  // recovery, but their original rights evidence is unresolved. Release/runtime
  // audio therefore uses the existing SOUNDS procedural definitions for these
  // cue IDs until rights-confirmed replacements are supplied.
  const FOOD_TEXTURE_KEYS = new Set(['food_juice','food_sugar','food_crumb','food_savory','food_rice','food_premium']);

  // Music is an explicit slot contract rather than a hard dependency. The
  // authored files can be dropped into assets/audio/music/ without changing
  // runtime code; until then each scene has a tiny, low-volume WebAudio
  // fallback so the complete game is already music-capable offline.
  const MUSIC_TRACK_SLOTS = Object.freeze([
    { key:'menu',      src:'assets/audio/music/menu.ogg',      loop:true, bus:'bgm', optional:true },
    { key:'arcade',    src:'assets/audio/music/arcade.ogg',    loop:true, bus:'bgm', optional:true },
    { key:'puzzle',    src:'assets/audio/music/puzzle.ogg',    loop:true, bus:'bgm', optional:true },
    { key:'feastfall', src:'assets/audio/music/feastfall.ogg', loop:true, bus:'bgm', optional:true },
    { key:'infinite',  src:'assets/audio/music/infinite.ogg',  loop:true, bus:'bgm', optional:true },
  ]);
  const MUSIC_SCENES = Object.freeze({
    menu:      Object.freeze({ root:261.63, tempo:72, pattern:[0,4,7,11,7,4,2,4] }),
    arcade:    Object.freeze({ root:220.00, tempo:92, pattern:[0,7,5,3,0,7,5,10] }),
    puzzle:    Object.freeze({ root:293.66, tempo:82, pattern:[0,2,5,7,5,2,4,2] }),
    feastfall: Object.freeze({ root:246.94, tempo:88, pattern:[0,3,7,10,7,3,5,3] }),
    infinite:  Object.freeze({ root:196.00, tempo:68, pattern:[0,5,7,12,7,5,3,5] }),
  });

  // â”€â”€ Volume defaults â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Background music is intentionally silent until the owner supplies replacement tracks.
  // Keep scene slots, lifecycle, and registration APIs intact for that later handoff.
  const BACKGROUND_MUSIC_ENABLED = false;
  const DEFAULT_VOLUMES = { master: 1.0, sfx: 1.0, bgm: 0.0, menu: 1.0 };
  const SFX_BASE_VOLUME = {
    miss: 1.4,
    // Slight trim on the authored food textures only. The original catch cue
    // remains unchanged so catch readability stays intact while the layered
    // bite/crunch/slurp sweeteners sit a little further back in the mix.
    food_juice: 0.72,
    food_sugar: 0.64,
    food_crumb: 0.68,
    food_savory: 0.70,
    food_rice: 0.62,
    food_premium: 0.72,
  };

  // â”€â”€ Procedural Fallback Engine & Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const SOUNDS = {
    catch:   [{ f: 880, d: 0.08, g: 0.2, type: 'sine' }, { f: 1200, d: 0.08, g: 0.2, type: 'sine', t: 0.06 }],
    food_juice:   [{ f: 520, d: 0.09, g: 0.07, type:'sine', rampTo:260, rampDur:0.08 }, { f:760, d:0.05, g:0.045, type:'sine', t:0.035 }],
    food_sugar:   [{ f:1180, d:0.055, g:0.055, type:'sine' }, { f:1580, d:0.075, g:0.05, type:'sine', t:0.045 }],
    food_crumb:   [{ f:340, d:0.045, g:0.065, type:'triangle' }, { f:245, d:0.055, g:0.055, type:'triangle', t:0.035 }],
    food_savory:  [{ f:280, d:0.065, g:0.06, type:'sine' }, { f:410, d:0.06, g:0.045, type:'triangle', t:0.04 }],
    food_rice:    [{ f:920, d:0.045, g:0.05, type:'triangle' }, { f:1320, d:0.07, g:0.045, type:'sine', t:0.04 }],
    food_premium: [{ f:880, d:0.07, g:0.06, type:'sine' }, { f:1320, d:0.08, g:0.055, type:'sine', t:0.055 }, { f:1760, d:0.11, g:0.05, type:'sine', t:0.11 }],
    tongue:  [{ f: 900, d: 0.15, g: 0.18, type: 'sine', rampTo: 180, rampDur: 0.12 }],
    miss:    [{ f: 220, d: 0.2, g: 0.34, type: 'triangle', linearRampTo: 60, rampDur: 0.2 }, { f: 90, d: 0.16, g: 0.3, type: 'sine' }],
    bomb:    [{ f: 180, d: 0.45, g: 0.3, type: 'sawtooth', rampTo: 30, rampDur: 0.4 }],
    pause:   [{ f: 400, d: 0.06, g: 0.2, type: 'sine' }, { f: 320, d: 0.06, g: 0.2, type: 'sine', t: 0.06 }],
    resume:  [{ f: 320, d: 0.06, g: 0.2, type: 'sine' }, { f: 480, d: 0.06, g: 0.2, type: 'sine', t: 0.06 }],
    heart:   [{ f: 740, d: 0.06, g: 0.2, type: 'sine' }, { f: 988, d: 0.10, g: 0.2, type: 'sine', t: 0.08 }],
    hover:   [{ f: 440, d: 0.04, g: 0.05, type: 'sine' }],
    click:   [{ f: 600, d: 0.05, g: 0.2, type: 'square' }],
    // Puzzle semantic cues use the existing SFX bus and sound-definition API.
    puzzleGoldenSpit: [{ f:620,d:.07,g:.045,type:'triangle' }, { f:930,d:.085,g:.04,type:'sine',t:.045 }, { f:1240,d:.10,g:.035,type:'sine',t:.09 }],
    puzzleGoldenDefusal: [{ f:180,d:.18,g:.12,type:'triangle',rampTo:60 }, { f:880,d:.12,g:.06,type:'sine',t:.10 }],
    puzzlePreferred: [{ f:1120,d:.065,g:.045,type:'sine' }, { f:1480,d:.075,g:.04,type:'sine',t:.055 }],
    puzzleTick: [{ f:520,d:.055,g:.03,type:'sine' }],
    levelup: [{ f: 523.25, d: 0.12, g: 0.15, type: 'sine' }, { f: 659.25, d: 0.12, g: 0.15, type: 'sine', t: 0.09 }, { f: 783.99, d: 0.12, g: 0.15, type: 'sine', t: 0.18 }, { f: 1046.50, d: 0.12, g: 0.12, type: 'sine', t: 0.27 }],
    // Generic fallback retained for legacy callers. Each gameplay power-up
    // below has its own editable placeholder patch in Sound Lab.
    powerup:             [{ f: 660, d: 0.07, g: 0.2, type: 'triangle' }, { f: 990, d: 0.09, g: 0.2, type: 'triangle', t: 0.07 }],
    powerup_shield:      [{ f: 523.25, d: 0.10, g: 0.18, type: 'sine' }, { f: 783.99, d: 0.14, g: 0.20, type: 'sine', t: 0.07 }],
    powerup_slowFood:    [{ f: 494.00, d: 0.16, g: 0.18, type: 'triangle', linearRampTo: 370, rampDur: 0.15 }, { f: 370.00, d: 0.10, g: 0.12, type: 'sine', t: 0.10 }],
    powerup_doublePoints:[{ f: 659.25, d: 0.08, g: 0.18, type: 'triangle' }, { f: 987.77, d: 0.12, g: 0.20, type: 'triangle', t: 0.06 }],
    powerup_speedBoost:  [{ f: 440.00, d: 0.12, g: 0.18, type: 'sawtooth', rampTo: 1320, rampDur: 0.11 }, { f: 1320.00, d: 0.07, g: 0.13, type: 'sine', t: 0.10 }],
    powerup_magnet:      [{ f: 220.00, d: 0.18, g: 0.16, type: 'sine', rampTo: 660, rampDur: 0.16 }, { f: 440.00, d: 0.12, g: 0.13, type: 'triangle', t: 0.08 }],
    powerup_scoreBoost:  [{ f: 587.33, d: 0.08, g: 0.16, type: 'sine' }, { f: 739.99, d: 0.08, g: 0.17, type: 'sine', t: 0.06 }, { f: 987.77, d: 0.12, g: 0.18, type: 'sine', t: 0.12 }],
    powerup_piercing:    [{ f: 260.00, d: 0.14, g: 0.16, type: 'sawtooth', rampTo: 1040, rampDur: 0.12 }, { f: 1040.00, d: 0.08, g: 0.12, type: 'triangle', t: 0.09 }],
    powerup_vacuum:      [{ f: 180.00, d: 0.22, g: 0.15, type: 'sine', rampTo: 720, rampDur: 0.20 }, { f: 360.00, d: 0.14, g: 0.11, type: 'sine', t: 0.08 }]
  };

  // These values deliberately match the Sound Lab streak simulator defaults.
  // They affect the existing catch placeholder (or catch.mp3 if later supplied).
  const DEFAULT_CATCH_STREAK_AUDIO = Object.freeze({ pitchStep: 0.04, pitchCap: 1.50 });
  const catchStreakAudio = { ...DEFAULT_CATCH_STREAK_AUDIO };

  let ctx        = null;
  let decodeContext = null;
  let masterGain = null;
  let sfxGain    = null;
  let menuGain   = null;
  let bgmGain    = null;

  const buffers  = Object.create(null);
  let _bgmSource = null;
  let _bgmKey    = null;
  let _musicScene = 'menu';
  let _proceduralMusic = null;
  let _musicSource = null;
  let _volumes   = { ...DEFAULT_VOLUMES };
  // Runtime telemetry is intentionally tiny and local. It makes it possible
  // to prove that an interaction reached the audio layer even when headless
  // test browsers mute physical speaker output.
  const _playback = { count: 0, fallbackCount: 0, lastKey: null, lastAt: 0, lastSource: null };
  const _musicPlayback = { count: 0, lastKey: null, lastSource: null, lastAt: 0 };

  function _standaloneProceduralOnly() {
    return globalThis.__FROGGY_STANDALONE_PROCEDURAL_AUDIO__ === true;
  }

  function _recordPlayback(key, source) {
    _playback.count += 1;
    if (source === 'procedural') _playback.fallbackCount += 1;
    _playback.lastKey = String(key || '');
    _playback.lastAt = Date.now();
    _playback.lastSource = source;
  }

  function _clamp(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }
  function _clampRange(v, min, max, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function getCatchStreakAudio() { return { ...catchStreakAudio }; }
  function setCatchStreakAudio(patch) {
    if (!patch || typeof patch !== 'object') return getCatchStreakAudio();
    if (patch.pitchStep !== undefined) {
      catchStreakAudio.pitchStep = _clampRange(patch.pitchStep, 0.01, 0.10, catchStreakAudio.pitchStep);
    }
    if (patch.pitchCap !== undefined) {
      catchStreakAudio.pitchCap = _clampRange(patch.pitchCap, 1.10, 2.50, catchStreakAudio.pitchCap);
    }
    // A cap lower than the initial pitch would make the first catch descend.
    catchStreakAudio.pitchCap = Math.max(1.0, catchStreakAudio.pitchCap);
    return getCatchStreakAudio();
  }
  function resetCatchStreakAudio() {
    catchStreakAudio.pitchStep = DEFAULT_CATCH_STREAK_AUDIO.pitchStep;
    catchStreakAudio.pitchCap  = DEFAULT_CATCH_STREAK_AUDIO.pitchCap;
    return getCatchStreakAudio();
  }
  function getCatchPitchMultiplier(comboDepth) {
    const combo = Math.max(0, Number(comboDepth) || 0);
    return Math.min(1 + combo * catchStreakAudio.pitchStep, catchStreakAudio.pitchCap);
  }

  function _ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
      return false;
    }
    masterGain = ctx.createGain();
    sfxGain    = ctx.createGain();
    menuGain   = ctx.createGain();
    bgmGain    = ctx.createGain();
    sfxGain.connect(masterGain);
    menuGain.connect(masterGain);
    bgmGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    _applyGains();
    return true;
  }

  function _applyGains() {
    if (!ctx || !masterGain) return;
    const t = ctx.currentTime;
    masterGain.gain.setTargetAtTime(_volumes.master, t, 0.02);
    sfxGain.gain.setTargetAtTime(_volumes.sfx,       t, 0.02);
    menuGain?.gain.setTargetAtTime(_volumes.menu,     t, 0.02);
    bgmGain.gain.setTargetAtTime(BACKGROUND_MUSIC_ENABLED ? _volumes.bgm : 0, t, 0.02);
  }

  function _loadOne(key, src) {
    if (key in buffers) return Promise.resolve();
    buffers[key] = null;
    return fetch(src)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .then(ab => {
        if (!decodeContext && !ctx) decodeContext = new (window.AudioContext || window.webkitAudioContext)();
        const decoder = ctx || decodeContext;
        return decoder.decodeAudioData(ab);
      })
      .then(audioBuf => { buffers[key] = audioBuf; })
      .catch(() => {});
  }

  function _notifySoundLab(defKey) {
  }

  function _playSfx(key, opts, bus = 'sfx') {
    if (!_ensureContext()) return;
    const output = bus === 'menu' ? menuGain : sfxGain;
    if (!output) return;
    const buf = buffers[key];
    if (!buf) { _playFallback(key, opts, bus); return; } // Synthesize if no file
    _recordPlayback(key, 'buffer');
    _notifySoundLab(key);
    const source = ctx.createBufferSource();
    source.buffer = buf;
    if (opts && opts.pitchShift) source.playbackRate.value = opts.pitchShift;
    const vol = ((opts && opts.volume) ? opts.volume : 1.0) * (SFX_BASE_VOLUME[key] || 1.0);
    if (vol !== 1.0) {
      const trim = ctx.createGain();
      trim.gain.value = vol;
      source.connect(trim);
      trim.connect(output);
    } else {
      source.connect(output);
    }
    source.start(0);
  }

  function playTone(defKey, pitchMult = 1.0, volumeMult = 1.0, bus = 'sfx') {
    if (!_ensureContext()) return;
    const notes = SOUNDS[defKey];
    if (!notes) return;

    _recordPlayback(defKey, 'procedural');
    _notifySoundLab(defKey);

    notes.forEach(n => {
      const delay = n.t || 0;
      setTimeout(() => {
        try {
          if (!ctx) return;
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = n.type;
          const t0 = ctx.currentTime;
          o.frequency.setValueAtTime(n.f * pitchMult, t0);
          
          if (n.rampTo) {
            o.frequency.exponentialRampToValueAtTime(n.rampTo * pitchMult, t0 + (n.rampDur || n.d));
          } else if (n.linearRampTo) {
            o.frequency.linearRampToValueAtTime(n.linearRampTo * pitchMult, t0 + (n.rampDur || n.d));
          }
          
          const busVolume = bus === 'menu' ? _volumes.menu : _volumes.sfx;
          g.gain.setValueAtTime(n.g * _volumes.master * busVolume * volumeMult, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + n.d);
          
          o.connect(g);
          g.connect(bus === 'menu' ? menuGain : sfxGain);
          o.start(t0); o.stop(t0 + n.d + 0.02);
        } catch(e) {}
      }, delay * 1000);
    });
  }

  function _playFallback(key, opts, bus = 'sfx') {
    const volMult = ((opts && opts.volume) ? opts.volume : 1.0) * (SFX_BASE_VOLUME[key] || 1.0);
    const pitchMult = (opts && opts.pitchShift) ? opts.pitchShift : 1.0;
    playTone(key, pitchMult, volMult, bus);
  }

  function _normaliseMusicScene(key) {
    const candidate = String(key || 'menu').trim().toLowerCase();
    return MUSIC_SCENES[candidate] ? candidate : 'menu';
  }

  function _clearProceduralMusic() {
    if (!_proceduralMusic) return;
    try { clearInterval(_proceduralMusic.timer); } catch (_) {}
    _proceduralMusic = null;
  }

  function _recordMusicPlayback(key, source) {
    _musicPlayback.count += 1;
    _musicPlayback.lastKey = key;
    _musicPlayback.lastSource = source;
    _musicPlayback.lastAt = Date.now();
  }

  function _startProceduralMusic(key) {
    if (!ctx || !bgmGain || ctx.state !== 'running') return;
    const sceneKey = _normaliseMusicScene(key);
    const scene = MUSIC_SCENES[sceneKey];
    _clearProceduralMusic();
    const state = { key:sceneKey, index:0, timer:null };
    const tick = () => {
      if (!ctx || ctx.state !== 'running' || !bgmGain || _proceduralMusic !== state) return;
      try {
        const semitone = scene.pattern[state.index % scene.pattern.length];
        const frequency = scene.root * Math.pow(2, semitone / 12);
        const now = ctx.currentTime;
        const length = Math.max(0.16, (60 / scene.tempo) * 0.78);
        const voice = ctx.createOscillator();
        const envelope = ctx.createGain();
        voice.type = state.index % 4 === 0 ? 'triangle' : 'sine';
        voice.frequency.setValueAtTime(frequency, now);
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(0.028, now + 0.035);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + length);
        voice.connect(envelope);
        envelope.connect(bgmGain);
        voice.start(now);
        voice.stop(now + length + 0.025);
      } catch (_) {}
      state.index += 1;
    };
    _proceduralMusic = state;
    _musicSource = 'procedural';
    _recordMusicPlayback(sceneKey, 'procedural');
    tick();
    state.timer = setInterval(tick, Math.max(180, Math.round((60 / scene.tempo) * 1000)));
  }

  function _normalisePowerUpEffect(effect) {
    const raw = String(effect || '').replace(/_pu$/i, '');
    const aliases = {
      slowfood: 'slowFood',
      doublepoints: 'doublePoints',
      speedboost: 'speedBoost',
      scoreboost: 'scoreBoost',
    };
    return aliases[raw.toLowerCase()] || raw;
  }

  function getPowerUpSoundKey(effect) {
    const key = 'powerup_' + _normalisePowerUpEffect(effect);
    return SOUNDS[key] ? key : 'powerup';
  }

  function playPowerUp(effect, opts) {
    // Preserve compatibility with older calls such as AudioManager.powerup({ volume: 0.8 }).
    if (effect && typeof effect === 'object') { opts = effect; effect = ''; }
    _playSfx(getPowerUpSoundKey(effect), opts);
  }

  function playCatchForCombo(comboDepth, opts) {
    const basePitch = opts && Number.isFinite(Number(opts.pitchShift)) ? Number(opts.pitchShift) : 1;
    _playSfx('catch', { ...(opts || {}), pitchShift: basePitch * getCatchPitchMultiplier(comboDepth) });
  }

  function playFoodTexture(family, opts = {}) {
    const safeFamily = ['juice','sugar','crumb','savory','rice','premium'].includes(String(family || ''))
      ? String(family)
      : 'savory';
    const volume = Number.isFinite(Number(opts.volume)) ? Math.max(0, Math.min(0.8, Number(opts.volume))) : 0.55;
    _playSfx(`food_${safeFamily}`, { ...opts, volume });
    return `food_${safeFamily}`;
  }

  function init() {
    if (typeof SaveManager !== 'undefined') {
      try {
        const saved = SaveManager.get();
        if (saved && saved.audio) {
          if (saved.audio.master !== undefined) _volumes.master = _clamp(saved.audio.master);
          if (saved.audio.sfx    !== undefined) _volumes.sfx    = _clamp(saved.audio.sfx);
          if (saved.audio.bgm    !== undefined) _volumes.bgm    = BACKGROUND_MUSIC_ENABLED ? _clamp(saved.audio.bgm) : 0;
          if (saved.audio.menu   !== undefined) _volumes.menu   = _clamp(saved.audio.menu);
        }
      } catch (_) {}
    }
    _volumes.bgm = BACKGROUND_MUSIC_ENABLED ? _volumes.bgm : 0;
    // Music slots are deliberately not fetched until an authored file is
    // explicitly registered. This keeps review/offline builds free of noisy
    // 404s while the procedural scene fallback remains immediately available.
    const tracks = _standaloneProceduralOnly()
      ? TRACK_MANIFEST.filter(track => FOOD_TEXTURE_KEYS.has(track.key))
      : TRACK_MANIFEST;
    const promises = tracks.map(track => _loadOne(track.key, track.src));
    return Promise.all(promises)
      .catch(() => {})
      .finally(() => {
        if (decodeContext && decodeContext !== ctx) {
          try { decodeContext.close?.(); } catch (_) {}
          decodeContext = null;
        }
      });
  }

  function activate() {
    // This is the one user-gesture-safe entry point. Scene selection may happen
    // during boot, but actual context resume/music start waits for this call.
    const loading = init();
    _ensureContext();
    const resume = ctx?.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve();
    return Promise.all([loading, resume]).then(() => {
      if (ctx?.state === 'running') playBgm(_musicScene);
      return getRuntimeStatus();
    });
  }

  function setVolumes(v) {
    if (!v) return;
    if (v.master !== undefined) _volumes.master = _clamp(v.master);
    if (v.sfx    !== undefined) _volumes.sfx    = _clamp(v.sfx);
    if (v.bgm    !== undefined) _volumes.bgm    = BACKGROUND_MUSIC_ENABLED ? _clamp(v.bgm) : 0;
    if (v.menu   !== undefined) _volumes.menu   = _clamp(v.menu);
    _applyGains();
  }

  function getVolumes() { return { ..._volumes }; }

  function playBgm(key) {
    if (!BACKGROUND_MUSIC_ENABLED) { stopBgm(); return; }
    key = _normaliseMusicScene(key || _musicScene);
    _musicScene = key;
    if (!_ensureContext()) return;
    if (_bgmSource && _bgmKey === key) return;
    if (_proceduralMusic && _proceduralMusic.key === key) return;
    stopBgm();
    const buf = buffers[key];
    if (buf) {
      _bgmSource = ctx.createBufferSource();
      _bgmSource.buffer = buf;
      _bgmSource.loop = true;
      _bgmSource.connect(bgmGain);
      _bgmSource.start(0);
      _bgmKey = key;
      _musicSource = 'buffer';
      _recordMusicPlayback(key, 'buffer');
      return;
    }
    // Missing/optional authored music never leaves the scene silent: use the
    // compact fallback until an approved track is supplied.
    _startProceduralMusic(key);
  }

  function stopBgm() {
    _clearProceduralMusic();
    if (_bgmSource) {
      try { _bgmSource.stop(); } catch (_) {}
      try { _bgmSource.disconnect(); } catch (_) {}
      _bgmSource = null;
    }
    _bgmKey = null;
    _musicSource = null;
  }

  function setMusicScene(key) {
    _musicScene = _normaliseMusicScene(key);
    if (ctx?.state === 'running') playBgm(_musicScene);
    return _musicScene;
  }
  function pauseBgm() {
    _clearProceduralMusic();
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  }
  function resumeBgm() {
    if (!ctx) return Promise.resolve();
    const resume = ctx.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve();
    return Promise.resolve(resume).then(() => {
      if (BACKGROUND_MUSIC_ENABLED && ctx?.state === 'running' && !_bgmSource && !_proceduralMusic) playBgm(_musicScene);
      return getRuntimeStatus();
    });
  }
  function registerTrack(t) {
    if (!t || !t.key || !t.src) return Promise.resolve();
    TRACK_MANIFEST.push(t);
    return _loadOne(t.key, t.src);
  }
  function registerMusicTrack(key, src) {
    const slot = MUSIC_TRACK_SLOTS.find(item => item.key === _normaliseMusicScene(key));
    if (!slot) return Promise.resolve();
    return registerTrack({ ...slot, key:slot.key, src:src || slot.src });
  }
  function list() { return TRACK_MANIFEST.map(t => ({ key: t.key, status: !(t.key in buffers) ? 'unloaded' : buffers[t.key] ? 'loaded' : 'failed/missing' })); }
  function getRuntimeStatus() {
    return Object.freeze({
      contextCreated: !!ctx,
      contextState: ctx?.state || 'uninitialized',
      usesProceduralFallback: true,
      musicScene: _musicScene,
      music: { ..._musicPlayback, source: _musicSource, active: !!(_bgmSource || _proceduralMusic) },
      musicSlots: MUSIC_TRACK_SLOTS.map(slot => ({ ...slot })),
      proceduralOnly: _standaloneProceduralOnly(),
      sampledFoodTextures: Object.freeze({
        loaded: [...FOOD_TEXTURE_KEYS].filter(key => Boolean(buffers[key])).length,
        total: FOOD_TEXTURE_KEYS.size,
      }),
      playback: { ..._playback },
      tracks: list(),
    });
  }

  return {
    init, activate, registerTrack, registerMusicTrack,
    setVolumes, getVolumes,
    catch: (o) => _playSfx('catch', o),
    catchForCombo: playCatchForCombo,
    foodTexture: playFoodTexture,
    getCatchPitchMultiplier,
    getCatchStreakAudio, setCatchStreakAudio, resetCatchStreakAudio,
    miss: (o) => _playSfx('miss', o),
    bomb: (o) => _playSfx('bomb', o),
    // Global menu button listeners use these names. Gameplay callers use
    // gameplayClick so lowering Menu Sounds never changes gameplay mix.
    click: (o) => _playSfx('click', o, 'menu'),
    menuClick: (o) => _playSfx('click', o, 'menu'),
    gameplayClick: (o) => _playSfx('click', o, 'sfx'),
    powerup: playPowerUp,
    getPowerUpSoundKey,
    levelup: (o) => _playSfx('levelup', o),
    heart: (o) => _playSfx('heart', o), 
    tongue: (o) => _playSfx('tongue', o), 
    hover: (o) => _playSfx('hover', o, 'menu'),
    menuHover: (o) => _playSfx('hover', o, 'menu'),
    gameplayHover: (o) => _playSfx('hover', o, 'sfx'),
    levelUp: (o) => _playSfx('levelup', o),
    pause: pauseBgm,
    resume: resumeBgm,
    playBgm, stopBgm, pauseBgm, resumeBgm, setMusicScene,
    list, getRuntimeStatus,
    SOUNDS, playTone // Exposed for SoundLab V2 integration
  };

})();
