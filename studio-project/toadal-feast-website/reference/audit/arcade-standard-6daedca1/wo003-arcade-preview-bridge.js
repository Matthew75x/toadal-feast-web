(() => {
  'use strict';

  const PROTOCOL = 'toadal.game.v1';
  const GAME_ID = 'toadal-feast-arcade-preview';
  const parentOrigin = (() => {
    try { return new URL(document.referrer).origin; } catch (_) { return ''; }
  })();
  const embedded = window.parent !== window;
  const allowedHostMessages = new Set([
    'host:init', 'host:pause', 'host:resume', 'host:mute', 'host:unmute',
    'host:exit-confirmed', 'host:visibility',
  ]);
  const send = (type, payload = {}) => {
    if (!embedded || !parentOrigin || parentOrigin === 'null') return false;
    try {
      window.parent.postMessage({ protocol: PROTOCOL, gameId: GAME_ID, type, payload }, parentOrigin);
      return true;
    } catch (_) { return false; }
  };

  let hostInitialized = false;
  let readySent = false;
  let lastScore = null;
  let autoPauseReasons = new Set();
  let autoPauseOwned = false;
  let domReady = document.readyState !== 'loading';

  // The donor runtime exposes ArcadeStandalone/StandaloneAudio on globalThis,
  // but keeps GameState, GAME_MODES and EventBus as classic-script lexical
  // bindings. Read those bindings directly when available.
  const gameState = () => typeof GameState !== 'undefined' ? GameState : globalThis.GameState;
  const gameModes = () => typeof GAME_MODES !== 'undefined' ? GAME_MODES : globalThis.GAME_MODES;
  const eventBus = () => typeof EventBus !== 'undefined' ? EventBus : globalThis.EventBus;
  const gameMode = () => String(gameState()?.mode || '');
  const isPlaying = () => gameMode() === String(gameModes()?.PLAYING || 'playing');
  const isPaused = () => gameMode() === String(gameModes()?.PAUSED || 'paused');
  const currentScore = () => Math.max(0, Math.floor(Number(gameState()?.score) || 0));

  function announceReady() {
    if (!embedded || !parentOrigin || !hostInitialized || !domReady || readySent) return;
    readySent = send('game:ready', {
      gameId: GAME_ID,
      version: '1.2.9',
      mode: 'standard',
      characterId: 'toadal',
      storage: 'none',
    });
  }

  function reportScore(force = false) {
    const score = currentScore();
    if (force || score !== lastScore) {
      lastScore = score;
      send('game:score', {
        score,
        level: Math.max(1, Math.floor(Number(gameState()?.level) || 1)),
        characterId: 'toadal',
      });
    }
  }

  function applyPreviewProfile() {
    const root = document.body;
    root?.classList?.add('wo003-arcade-preview');
    if (!globalThis.ArcadeStandalone) return false;

    try { globalThis.ArcadeStandalone.selectCharacter('toadal'); } catch (_) {}
    const characterName = document.getElementById('menuSelectedCharacterName');
    if (characterName) characterName.textContent = 'Toadal';
    const startTitle = document.getElementById('arcadeStandaloneStartTitle');
    if (startTitle) startTitle.textContent = 'Standard Arcade';
    const startButton = document.querySelector('[data-standalone-action="play-standard"]');
    if (startButton) startButton.setAttribute('aria-label', 'Start Standard Arcade as Toadal');
    const bestLabel = document.querySelector('.launch-score-window--best .launch-score-label');
    if (bestLabel) bestLabel.textContent = 'Best this session';
    const quitLabel = document.querySelector('[data-arcade-quit-label]');
    if (quitLabel) quitLabel.textContent = 'Exit Preview';
    const resultExit = document.getElementById('arcadeResultSecondaryButton');
    if (resultExit) resultExit.textContent = 'Exit Preview';
    const payoutNote = document.getElementById('arcadeResultPayoutNote');
    if (payoutNote) payoutNote.textContent = 'Session only; clears when you leave the preview.';
    const resultBest = document.getElementById('arcadeResultBest');
    if (resultBest && !/session/i.test(resultBest.textContent || '')) {
      resultBest.textContent = `Session best ${currentScore()}`;
    }
    return true;
  }

  function pauseForInterruption(reason) {
    if (isPlaying()) {
      autoPauseReasons.add(reason);
      autoPauseOwned = true;
      try { globalThis.ArcadeStandalone?.openPause?.(); } catch (_) {}
    } else if (isPaused() && autoPauseOwned) {
      autoPauseReasons.add(reason);
    }
  }

  function resumeAfterInterruption(reason) {
    autoPauseReasons.delete(reason);
    if (autoPauseOwned && autoPauseReasons.size === 0 && isPaused()) {
      autoPauseOwned = false;
      try { globalThis.ArcadeStandalone?.resumePause?.(); } catch (_) {}
    }
  }

  function setMuted(muted) {
    const audio = typeof StandaloneAudio !== 'undefined' ? StandaloneAudio : globalThis.StandaloneAudio;
    if (!audio?.getState || !audio?.toggleMuted) return false;
    const current = Boolean(audio.getState().muted);
    if (current !== muted) audio.toggleMuted();
    return Boolean(audio.getState().muted) === muted;
  }

  window.addEventListener('message', (event) => {
    if (!embedded || !parentOrigin || event.origin !== parentOrigin || event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL || message.gameId !== GAME_ID || !allowedHostMessages.has(message.type)) return;

    if (message.type === 'host:init') {
      hostInitialized = true;
      announceReady();
    } else if (message.type === 'host:pause') {
      autoPauseReasons.clear();
      autoPauseOwned = false;
      if (isPlaying()) globalThis.ArcadeStandalone?.openPause?.();
    } else if (message.type === 'host:resume') {
      autoPauseReasons.clear();
      autoPauseOwned = false;
      if (isPaused()) globalThis.ArcadeStandalone?.resumePause?.();
    } else if (message.type === 'host:mute') {
      setMuted(true);
    } else if (message.type === 'host:unmute') {
      setMuted(false);
    } else if (message.type === 'host:visibility') {
      if (message.payload?.visibility === 'hidden') pauseForInterruption('host-visibility');
      if (message.payload?.visibility === 'visible') resumeAfterInterruption('host-visibility');
    } else if (message.type === 'host:exit-confirmed') {
      autoPauseReasons.clear();
      autoPauseOwned = false;
      try { globalThis.ArcadeStandalone?.showMenu?.('Preview closed.'); } catch (_) {}
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button, a');
    if (!target) return;
    if (target.matches('[data-standalone-action="play-standard"]')) {
      try { globalThis.ArcadeStandalone?.selectCharacter?.('toadal'); } catch (_) {}
      return;
    }
    if (target.matches('[data-standalone-pause-action="quit"], [data-arcade-result-action="menu"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      send('game:request-exit', { reason: 'user-exit' });
      return;
    }
    if (target.matches('[data-arcade-request-fullscreen]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      send('game:request-fullscreen', {});
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pauseForInterruption('visibility');
    if (document.visibilityState === 'visible') resumeAfterInterruption('visibility');
  });
  // Capture page-level focus events before any overlay focus trap, while
  // ignoring descendant focus/blur events that share the capture path.
  window.addEventListener('blur', event => {
    if (event.target === window) pauseForInterruption('focus');
  }, true);
  window.addEventListener('focus', event => {
    if (event.target === window) resumeAfterInterruption('focus');
  }, true);

  window.addEventListener('error', (event) => {
    send('game:error', { message: String(event.message || 'Cartridge runtime error').slice(0, 240) });
  });
  window.addEventListener('unhandledrejection', (event) => {
    send('game:error', { message: String(event.reason?.message || event.reason || 'Unhandled cartridge rejection').slice(0, 240) });
  });

  const bus = eventBus();
  bus?.on?.('gameStarted', () => {
    autoPauseReasons.clear();
    autoPauseOwned = false;
    reportScore(true);
    send('game:started', { mode: String(gameState()?.currentMode || 'standard'), characterId: 'toadal' });
  });
  bus?.on?.('gamePaused', () => send('game:paused', { mode: String(gameState()?.currentMode || 'standard') }));
  bus?.on?.('gameResumed', () => send('game:resumed', { mode: String(gameState()?.currentMode || 'standard') }));
  bus?.on?.('foodCaught', () => reportScore());
  bus?.on?.('gameOver', (payload = {}) => {
    reportScore(true);
    send('game:complete', {
      score: currentScore(),
      level: Math.max(1, Math.floor(Number(gameState()?.level) || 1)),
      characterId: 'toadal',
      reason: String(payload.reason || 'run-ended').slice(0, 80),
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    applyPreviewProfile();
    announceReady();
  }, { once: true });
  if (domReady) applyPreviewProfile();

  window.setInterval(() => {
    if (!globalThis.ArcadeStandalone) return;
    reportScore();
  }, 300);
})();
