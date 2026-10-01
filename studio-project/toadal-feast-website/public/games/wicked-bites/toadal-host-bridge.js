(() => {
  'use strict';

  const PROTOCOL = 'toadal.game';
  const VERSION = 1;
  let hostOrigin = location.origin;
  try {
    if (document.referrer) hostOrigin = new URL(document.referrer).origin;
  } catch (_) {}

  let hostMuted = false;
  let readySent = false;
  let started = false;
  let paused = false;
  let completedSent = false;
  let lastScoreSent = null;
  let audioWrapped = false;

  function post(type, payload = {}) {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ protocol: PROTOCOL, version: VERSION, type, payload }, hostOrigin);
    } catch (_) {}
  }

  function gameApi() {
    return globalThis.WickedBitesStandalone || null;
  }

  function snapshot() {
    try { return gameApi()?.getStatus?.() || null; }
    catch (_) { return null; }
  }

  function wrapAudio() {
    if (audioWrapped || !globalThis.AudioManager) return;
    audioWrapped = true;
    const manager = globalThis.AudioManager;
    const names = ['activate','catchForCombo','catch','powerup','bomb','death','hit','shield','ability','playTone','ui','test'];
    for (const name of names) {
      if (typeof manager[name] !== 'function') continue;
      const original = manager[name].bind(manager);
      manager[name] = (...args) => hostMuted ? false : original(...args);
    }
    if (typeof manager.isMuted === 'function') {
      const originalMuted = manager.isMuted.bind(manager);
      manager.isMuted = () => hostMuted || originalMuted();
    }
  }

  function emitReady() {
    if (readySent || !gameApi()) return;
    wrapAudio();
    readySent = true;
    post('game:ready', {
      gameId: 'wicked-bites',
      version: '5.5',
      capabilities: {
        pause: true,
        resume: true,
        mute: true,
        fullscreenRequest: true,
        touch: true,
        keyboard: true
      }
    });
  }

  function requestHostFullscreen() {
    post('game:request-fullscreen', { source: 'game-settings' });
  }

  function handFullscreenToHost() {
    const oldButton = document.getElementById('wbFullscreen');
    if (!oldButton || oldButton.dataset.toadalHostFullscreen === 'true') return;
    const button = oldButton.cloneNode(true);
    button.dataset.toadalHostFullscreen = 'true';
    button.textContent = 'FULLSCREEN';
    button.addEventListener('click', requestHostFullscreen);
    oldButton.replaceWith(button);
  }

  function setHostMute(value) {
    hostMuted = Boolean(value);
    wrapAudio();
  }

  function setPaused(value) {
    const api = gameApi();
    if (!api?.pause) return;
    const state = snapshot();
    if (!state?.active || state?.dead) return;
    try { api.pause(Boolean(value)); } catch (_) {}
  }

  function reportState() {
    const state = snapshot();
    if (!state) return;

    const active = Boolean(state.active) && !state.dead;
    if (active && !started) {
      started = true;
      completedSent = false;
      post('game:started', {
        seed: state.seed ?? null,
        characterId: state.characterId ?? null
      });
    }

    const nowPaused = active && Boolean(state.paused);
    if (started && nowPaused !== paused) {
      paused = nowPaused;
      post(nowPaused ? 'game:paused' : 'game:resumed', {});
    }

    const score = Number(state.score);
    if (started && Number.isFinite(score) && score !== lastScoreSent) {
      lastScoreSent = score;
      post('game:score', {
        score,
        distance: Number(state.distance) || 0,
        candy: Number(state.runCandy) || 0
      });
    }

    const result = document.getElementById('wbResult');
    const resultVisible = result && !result.classList.contains('hidden');
    if (started && resultVisible && !completedSent) {
      completedSent = true;
      const finalState = snapshot() || state;
      post('game:complete', {
        score: Number(finalState?.score) || 0,
        distance: Number(finalState?.distance) || 0,
        candy: Number(finalState?.runCandy) || 0,
        reason: finalState?.deathReason || document.getElementById('wbResultTitle')?.textContent || 'complete'
      });
    }

    if (!active && !resultVisible && started && completedSent) {
      started = false;
      paused = false;
      lastScoreSent = null;
    }
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== hostOrigin) return;
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL || Number(message.version) !== VERSION || typeof message.type !== 'string') return;

    switch (message.type) {
      case 'host:init':
        setHostMute(Boolean(message.payload?.muted));
        emitReady();
        break;
      case 'host:pause':
        setPaused(true);
        break;
      case 'host:resume':
        setPaused(false);
        break;
      case 'host:mute':
        setHostMute(true);
        break;
      case 'host:unmute':
        setHostMute(false);
        break;
      case 'host:visibility':
        if (message.payload?.state === 'hidden') setPaused(true);
        break;
      case 'host:exit-confirmed':
        try { gameApi()?.home?.(); } catch (_) {}
        break;
      default:
        break;
    }
  });

  window.addEventListener('error', event => {
    post('game:error', { message: String(event.message || 'Runtime error') });
  });

  window.addEventListener('unhandledrejection', event => {
    post('game:error', { message: String(event.reason?.message || event.reason || 'Unhandled promise rejection') });
  });

  const timer = window.setInterval(() => {
    emitReady();
    handFullscreenToHost();
    reportState();
  }, 200);

  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      emitReady();
      handFullscreenToHost();
    }, { once: true });
  } else {
    emitReady();
    handFullscreenToHost();
  }
})();
