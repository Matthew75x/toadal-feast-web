(() => {
  'use strict';

  const PROTOCOL = 'toadal.game.v1';
  const GAME_ID = 'toadal-feast-arcade-preview';
  const EXPERIENCES = new Set(['standard', 'fmf', 'zen']);
  const STANDARD_CHARACTERS = new Set(['toadal', 'classic', 'pelican']);
  const FORCED_CHARACTERS = Object.freeze({ fmf: 'chomper', zen: 'princess' });
  const parentOrigin = (() => {
    try { return new URL(document.referrer).origin; } catch (_) { return ''; }
  })();
  const embedded = window.parent !== window;
  const allowedHostMessages = new Set([
    'host:init', 'host:start', 'host:pause', 'host:resume', 'host:mute', 'host:unmute',
    'host:exit-confirmed', 'host:visibility',
  ]);
  const send = (type, payload = {}) => {
    if (!embedded || !parentOrigin || parentOrigin === 'null' || !sessionId) return false;
    try {
      window.parent.postMessage({ protocol: PROTOCOL, gameId: GAME_ID, type, payload, sessionId }, parentOrigin);
      return true;
    } catch (_) { return false; }
  };

  let activeProfile = null;
  let hostInitialized = false;
  let sessionId = '';
  let readySent = false;
  let helloTimer = 0;
  let lastScore = null;
  let runStartedAt = 0;
  let autoPauseReasons = new Set();
  let autoPauseOwned = false;
  let domReady = document.readyState !== 'loading';

  // The donor runtime exposes ArcadeStandalone on globalThis, but keeps these
  // classic-script declarations lexical. The adapter reads them only in-frame.
  const gameState = () => typeof GameState !== 'undefined' ? GameState : globalThis.GameState;
  const gameModes = () => typeof GAME_MODES !== 'undefined' ? GAME_MODES : globalThis.GAME_MODES;
  const eventBus = () => typeof EventBus !== 'undefined' ? EventBus : globalThis.EventBus;
  const gameMode = () => String(gameState()?.mode || '');
  const isPlaying = () => gameMode() === String(gameModes()?.PLAYING || 'playing');
  const isPaused = () => gameMode() === String(gameModes()?.PAUSED || 'paused');
  const currentScore = () => Math.max(0, Math.floor(Number(gameState()?.score) || 0));
  const actualMode = () => String(gameState()?.currentMode || 'standard');
  const actualCharacter = () => {
    try { if (typeof getCharDef === 'function') return String(getCharDef()?.id || ''); } catch (_) {}
    return String(gameState()?.selectedCharacterId || '');
  };

  function sanitizeProfile(raw) {
    const experienceId = EXPERIENCES.has(raw?.experienceId) ? raw.experienceId : 'standard';
    const unlocked = Array.isArray(raw?.unlockedCharacterIds)
      ? raw.unlockedCharacterIds.filter(id => STANDARD_CHARACTERS.has(id))
      : ['toadal'];
    if (!unlocked.includes('toadal')) unlocked.unshift('toadal');
    const selectedCharacterId = FORCED_CHARACTERS[experienceId]
      || (STANDARD_CHARACTERS.has(raw?.selectedCharacterId) && unlocked.includes(raw.selectedCharacterId) ? raw.selectedCharacterId : 'toadal');
    return Object.freeze({
      experienceId,
      selectedCharacterId,
      unlockedCharacterIds: Object.freeze([...new Set(unlocked)]),
      previewSettings: Object.freeze({ muted: raw?.previewSettings?.muted === true }),
    });
  }

  function announceReady() {
    if (!embedded || !parentOrigin || !hostInitialized || !domReady || readySent) return;
    readySent = send('game:ready', { gameId: GAME_ID, version: '1.2.9' });
  }

  function reportScore(force = false) {
    const score = currentScore();
    if (!activeProfile || (force || score !== lastScore)) {
      if (!activeProfile) return;
      lastScore = score;
      send('game:score', {
        score,
        level: Math.max(1, Math.floor(Number(gameState()?.level) || 1)),
        mode: actualMode(),
        characterId: actualCharacter(),
        elapsedMs: runStartedAt ? Math.max(0, Math.round(performance.now() - runStartedAt)) : 0,
      });
    }
  }

  function applyPreviewProfile(raw) {
    if (!globalThis.ArcadeStandalone) return false;
    activeProfile = sanitizeProfile(raw);
    document.body?.classList?.add('wo003-arcade-preview');
    document.body.dataset.arcadePreviewExperience = activeProfile.experienceId;
    document.body.dataset.arcadePreviewCharacter = activeProfile.selectedCharacterId;
    const name = activeProfile.selectedCharacterId === 'pelican' ? 'Gully'
      : activeProfile.selectedCharacterId === 'classic' ? 'Classic Frog'
        : activeProfile.selectedCharacterId === 'chomper' ? 'Chomper'
          : activeProfile.selectedCharacterId === 'princess' ? 'Princess Lily' : 'Toadal';
    const characterName = document.getElementById('menuSelectedCharacterName');
    if (characterName) characterName.textContent = name;
    const startTitle = document.getElementById('arcadeStandaloneStartTitle');
    if (startTitle) startTitle.textContent = activeProfile.experienceId === 'fmf' ? '5 Minute Feast'
      : activeProfile.experienceId === 'zen' ? 'Zen' : 'Standard Arcade';
    const startButton = document.querySelector('[data-standalone-action="play-standard"]');
    if (startButton) startButton.setAttribute('aria-label', `Start ${startTitle?.textContent || 'Arcade'}`);
    const bestLabel = document.querySelector('.launch-score-window--best .launch-score-label');
    if (bestLabel) bestLabel.textContent = 'Best on this device';
    const quitLabel = document.querySelector('[data-arcade-quit-label]');
    if (quitLabel) quitLabel.textContent = 'Exit Preview';
    const resultExit = document.getElementById('arcadeResultSecondaryButton');
    if (resultExit) resultExit.textContent = 'Exit Preview';
    const payoutNote = document.getElementById('arcadeResultPayoutNote');
    if (payoutNote) payoutNote.textContent = 'Preview progress is saved in this browser only.';
    return true;
  }

  function startFromHost(raw) {
    if (!EXPERIENCES.has(raw?.experienceId)) return false;
    const profile = sanitizeProfile(raw);
    if (!globalThis.ArcadeStandalone) return false;
    activeProfile = profile;
    applyPreviewProfile(profile);
    const outcome = globalThis.ArcadeStandalone.start(profile.experienceId);
    Promise.resolve(outcome).then(result => {
      if (!result?.started) send('game:start-rejected', { reason: String(result?.reason || 'start-failed'), mode: profile.experienceId });
    }).catch(error => send('game:error', { message: String(error?.message || error).slice(0, 240) }));
    return true;
  }

  function pauseForInterruption(reason) {
    if (isPlaying()) {
      autoPauseReasons.add(reason);
      autoPauseOwned = true;
      try { globalThis.ArcadeStandalone?.openPause?.(); } catch (_) {}
    } else if (isPaused() && autoPauseOwned) autoPauseReasons.add(reason);
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
    if (Boolean(audio.getState().muted) !== muted) audio.toggleMuted();
    return Boolean(audio.getState().muted) === muted;
  }

  window.addEventListener('message', event => {
    if (!embedded || !parentOrigin || event.origin !== parentOrigin || event.source !== window.parent) return;
    const message = event.data;
    if (message?.type === 'host:init') {
      if (!message || message.protocol !== PROTOCOL || message.gameId !== GAME_ID
          || typeof message.sessionId !== 'string' || message.sessionId.length < 32 || message.sessionId.length > 64
          || !message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)) return;
      const isNewSession = message.sessionId !== sessionId;
      sessionId = message.sessionId;
      hostInitialized = true;
      if (isNewSession) {
        readySent = false;
        lastScore = null;
        runStartedAt = 0;
        autoPauseReasons.clear();
        autoPauseOwned = false;
      }
      activeProfile = sanitizeProfile(message.payload?.profile);
      if (domReady) {
        applyPreviewProfile(activeProfile);
        announceReady();
        send('game:profile-ready', { experienceId: activeProfile.experienceId, characterId: activeProfile.selectedCharacterId });
      }
    } else if (!message || message.protocol !== PROTOCOL || message.gameId !== GAME_ID
        || message.sessionId !== sessionId || !allowedHostMessages.has(message.type)
        || !message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)) return;
    else if (message.type === 'host:start') {
      if (!hostInitialized || !message.payload?.profile) return;
      startFromHost(message.payload.profile);
    } else if (message.type === 'host:pause') {
      autoPauseReasons.clear(); autoPauseOwned = false;
      if (isPlaying()) globalThis.ArcadeStandalone?.openPause?.();
    } else if (message.type === 'host:resume') {
      autoPauseReasons.clear(); autoPauseOwned = false;
      if (isPaused()) globalThis.ArcadeStandalone?.resumePause?.();
    } else if (message.type === 'host:mute') setMuted(true);
    else if (message.type === 'host:unmute') setMuted(false);
    else if (message.type === 'host:visibility') {
      if (message.payload?.visibility === 'hidden') pauseForInterruption('host-visibility');
      if (message.payload?.visibility === 'visible') resumeAfterInterruption('host-visibility');
    } else if (message.type === 'host:exit-confirmed') {
      autoPauseReasons.clear(); autoPauseOwned = false;
      try { globalThis.ArcadeStandalone?.showMenu?.('Preview closed.'); } catch (_) {}
    }
  });

  function announceHello() {
    if (!embedded || !parentOrigin || hostInitialized || !domReady) return;
    send('game:hello', { gameId: GAME_ID });
  }

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('button, a');
    if (!target) return;
    if (target.matches('[data-standalone-pause-action="quit"], [data-arcade-result-action="menu"]')) {
      event.preventDefault(); event.stopImmediatePropagation();
      send('game:request-exit', { reason: 'user-exit' });
    } else if (target.matches('[data-arcade-request-fullscreen]')) {
      event.preventDefault(); event.stopImmediatePropagation(); send('game:request-fullscreen', {});
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pauseForInterruption('visibility');
    if (document.visibilityState === 'visible') resumeAfterInterruption('visibility');
  });
  // The host owns pause/resume controls. A child-frame blur can be a transient
  // focus handoff caused by the parent launching the preview; actual background
  // interruptions are handled by document.visibilitychange above.
  window.addEventListener('error', event => send('game:error', { message: String(event.message || 'Cartridge runtime error').slice(0, 240) }));
  window.addEventListener('unhandledrejection', event => send('game:error', { message: String(event.reason?.message || event.reason || 'Unhandled cartridge rejection').slice(0, 240) }));

  const bus = eventBus();
  bus?.on?.('gameStarted', () => {
    autoPauseReasons.clear(); autoPauseOwned = false;
    runStartedAt = performance.now(); lastScore = null;
    send('game:started', { mode: actualMode(), characterId: actualCharacter() });
    reportScore(true);
  });
  bus?.on?.('gamePaused', () => send('game:paused', { mode: actualMode() }));
  bus?.on?.('gameResumed', () => send('game:resumed', { mode: actualMode() }));
  bus?.on?.('foodCaught', () => reportScore());
  bus?.on?.('gameOver', (payload = {}) => {
    reportScore(true);
    send('game:complete', {
      score: currentScore(), level: Math.max(1, Math.floor(Number(gameState()?.level) || 1)),
      mode: actualMode(), characterId: actualCharacter(),
      elapsedMs: runStartedAt ? Math.max(0, Math.round(performance.now() - runStartedAt)) : 0,
      voluntaryQuit: payload.voluntaryQuit === true,
      bankedEarly: payload.bankedEarly === true,
      badge: String(payload.badge || '').slice(0, 80),
      endCause: String(payload.endCause || '').slice(0, 80),
      reason: String(payload.reason || payload.type || 'run-ended').slice(0, 80),
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    if (activeProfile) applyPreviewProfile(activeProfile);
    announceReady();
  }, { once: true });
  if (domReady && activeProfile) applyPreviewProfile(activeProfile);
  helloTimer = window.setInterval(() => {
    if (hostInitialized) { window.clearInterval(helloTimer); return; }
    announceHello();
  }, 250);
  announceHello();
  window.setInterval(() => { if (globalThis.ArcadeStandalone) reportScore(); }, 300);

  globalThis.ToadalArcadePreview = Object.freeze({
    getActiveProfile: () => activeProfile,
    allowsExperience: id => Boolean(activeProfile && EXPERIENCES.has(id) && id === activeProfile.experienceId),
    characterForExperience: id => id === 'standard' ? activeProfile?.selectedCharacterId : FORCED_CHARACTERS[id] || null,
  });
})();
