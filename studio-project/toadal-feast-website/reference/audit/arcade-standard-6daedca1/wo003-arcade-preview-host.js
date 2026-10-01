(() => {
  'use strict';

  const PROTOCOL = 'toadal.game.v1';
  const GAME_ID = 'toadal-feast-arcade-preview';
  const NAMESPACE = 'toadal:game:toadal-feast-arcade-preview:v1:';
  const STORAGE_KEY = `${NAMESPACE}state`;
  const EXPERIENCES = new Set(['standard', 'fmf', 'zen']);
  const STANDARD_CHARACTERS = new Set(['toadal', 'classic', 'pelican']);
  const FORCED_CHARACTERS = Object.freeze({ fmf: 'chomper', zen: 'princess' });
  const LABELS = Object.freeze({ toadal: 'Toadal', classic: 'Classic Frog', pelican: 'Gully' });
  const frame = document.querySelector('[data-arcade-preview-frame]');
  if (!frame) return;

  const state = {
    bestScoreOverall: 0,
    bestScoreByCharacter: {},
    completedStandardRuns: 0,
    unlockedCharacterIds: ['toadal'],
    selectedCharacterId: 'toadal',
    selectedExperienceId: 'standard',
    previewSettings: { muted: false },
  };
  const runtime = { ready: false, profileReady: false, startPending: false, pendingStart: null, activeRun: null, persistenceAvailable: false, sessionId: createSessionId() };
  const ACCEPTED_TYPES = new Set([
    'game:ready', 'game:hello', 'game:profile-ready', 'game:started', 'game:score', 'game:complete',
    'game:paused', 'game:resumed', 'game:request-exit', 'game:request-fullscreen', 'game:error', 'game:start-rejected',
  ]);
  const CHARACTERS = new Set(['toadal', 'classic', 'pelican', 'chomper', 'princess']);

  function createSessionId() {
    try { return crypto.randomUUID(); } catch (_) {}
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function exactKeys(value, required, optional = []) {
    if (!isRecord(value)) return false;
    const allowed = new Set([...required, ...optional]);
    return required.every(key => Object.prototype.hasOwnProperty.call(value, key))
      && Object.keys(value).every(key => allowed.has(key));
  }

  function validText(value, max = 240) {
    return typeof value === 'string' && value.length <= max;
  }

  function validCounter(value, minimum = 0) {
    return Number.isSafeInteger(value) && value >= minimum;
  }

  function validPayload(type, payload) {
    switch (type) {
      case 'game:ready': return exactKeys(payload, ['gameId', 'version']) && payload.gameId === GAME_ID && validText(payload.version, 32);
      case 'game:hello': return exactKeys(payload, ['gameId']) && payload.gameId === GAME_ID;
      case 'game:profile-ready': return exactKeys(payload, ['experienceId', 'characterId']) && EXPERIENCES.has(payload.experienceId) && CHARACTERS.has(payload.characterId);
      case 'game:started':
      case 'game:paused':
      case 'game:resumed': return exactKeys(payload, ['mode', ...(type === 'game:started' ? ['characterId'] : [])])
        && EXPERIENCES.has(payload.mode) && (type !== 'game:started' || CHARACTERS.has(payload.characterId));
      case 'game:score': return exactKeys(payload, ['score', 'level', 'mode', 'characterId', 'elapsedMs'])
        && validCounter(payload.score) && validCounter(payload.level, 1) && EXPERIENCES.has(payload.mode)
        && CHARACTERS.has(payload.characterId) && validCounter(payload.elapsedMs);
      case 'game:complete': return exactKeys(payload,
        ['score', 'level', 'mode', 'characterId', 'elapsedMs', 'voluntaryQuit', 'bankedEarly', 'badge', 'endCause', 'reason'])
        && validCounter(payload.score) && validCounter(payload.level, 1) && EXPERIENCES.has(payload.mode)
        && CHARACTERS.has(payload.characterId) && validCounter(payload.elapsedMs)
        && typeof payload.voluntaryQuit === 'boolean' && typeof payload.bankedEarly === 'boolean'
        && validText(payload.badge, 80) && validText(payload.endCause, 80) && validText(payload.reason, 80);
      case 'game:request-exit': return exactKeys(payload, ['reason']) && validText(payload.reason, 80);
      case 'game:request-fullscreen': return exactKeys(payload, []);
      case 'game:error': return exactKeys(payload, ['message']) && validText(payload.message);
      case 'game:start-rejected': return exactKeys(payload, ['reason', 'mode']) && validText(payload.reason, 80) && EXPERIENCES.has(payload.mode);
      default: return false;
    }
  }

  window.__wo003HostMessageAudit = [];
  function auditMessage(message, event, decision, reason) {
    const type = isRecord(message) && typeof message.type === 'string' ? message.type : '<malformed>';
    window.__wo003HostMessageAudit.push({
      type, decision, reason, at: Date.now(),
      source: event.source === frame.contentWindow ? 'cartridge' : 'other',
      origin: event.origin,
    });
  }
  const local = {
    experience: document.querySelector('[data-arcade-preview-experience]'),
    character: document.querySelector('[data-arcade-preview-character]'),
    start: document.querySelector('[data-arcade-preview-start]'),
    status: document.querySelector('[data-arcade-preview-status]'),
    best: document.querySelector('[data-arcade-preview-best]'),
    result: document.querySelector('[data-arcade-preview-result]'),
    fullscreen: document.querySelector('[data-arcade-preview-fullscreen]'),
    pause: document.querySelector('[data-arcade-preview-pause]'),
    resume: document.querySelector('[data-arcade-preview-resume]'),
    sound: document.querySelector('[data-arcade-preview-sound]'),
    exit: document.querySelector('[data-arcade-preview-exit]'),
  };

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  function deriveUnlocks() {
    const unlocked = ['toadal'];
    if (state.completedStandardRuns >= 1) unlocked.push('classic');
    if (state.bestScoreOverall >= 600 || state.completedStandardRuns >= 3) unlocked.push('pelican');
    state.unlockedCharacterIds = unlocked;
    if (state.selectedExperienceId === 'standard' && !unlocked.includes(state.selectedCharacterId)) state.selectedCharacterId = 'toadal';
    if (FORCED_CHARACTERS[state.selectedExperienceId]) state.selectedCharacterId = FORCED_CHARACTERS[state.selectedExperienceId];
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    state.bestScoreOverall = number(raw.bestScoreOverall);
    state.bestScoreByCharacter = {};
    if (raw.bestScoreByCharacter && typeof raw.bestScoreByCharacter === 'object' && !Array.isArray(raw.bestScoreByCharacter)) {
      for (const [id, score] of Object.entries(raw.bestScoreByCharacter)) {
        if (STANDARD_CHARACTERS.has(id)) state.bestScoreByCharacter[id] = number(score);
      }
    }
    state.completedStandardRuns = number(raw.completedStandardRuns);
    if (EXPERIENCES.has(raw.selectedExperienceId)) state.selectedExperienceId = raw.selectedExperienceId;
    if (STANDARD_CHARACTERS.has(raw.selectedCharacterId) || Object.values(FORCED_CHARACTERS).includes(raw.selectedCharacterId)) {
      state.selectedCharacterId = raw.selectedCharacterId;
    }
    if (raw.previewSettings && typeof raw.previewSettings === 'object') {
      state.previewSettings.muted = raw.previewSettings.muted === true;
    }
    deriveUnlocks();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      runtime.persistenceAvailable = localStorage.getItem(STORAGE_KEY) !== null;
    } catch (_) {
      runtime.persistenceAvailable = false;
    }
    render();
    return runtime.persistenceAvailable;
  }

  function setChooserLocked(locked) {
    if (local.experience) local.experience.disabled = Boolean(locked);
    if (local.character) local.character.disabled = Boolean(locked) || Boolean(FORCED_CHARACTERS[state.selectedExperienceId]);
    if (local.start) local.start.disabled = Boolean(locked) || !runtime.ready;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) normalize(JSON.parse(saved));
    deriveUnlocks();
    runtime.persistenceAvailable = true;
  } catch (_) {
    runtime.persistenceAvailable = false;
  }

  function selectedCharacterFor(experienceId = state.selectedExperienceId) {
    if (FORCED_CHARACTERS[experienceId]) return FORCED_CHARACTERS[experienceId];
    return state.unlockedCharacterIds.includes(state.selectedCharacterId) ? state.selectedCharacterId : 'toadal';
  }

  function childProfile() {
    const experienceId = EXPERIENCES.has(state.selectedExperienceId) ? state.selectedExperienceId : 'standard';
    return {
      experienceId,
      selectedCharacterId: selectedCharacterFor(experienceId),
      unlockedCharacterIds: [...state.unlockedCharacterIds],
      previewSettings: { ...state.previewSettings },
    };
  }

  function send(type, payload = {}) {
    if (!frame.contentWindow || !runtime.sessionId) return false;
    try {
      window.__wo003HostMessages = window.__wo003HostMessages || [];
      window.__wo003HostMessages.push({ type, payload, at: Date.now(), visibility: document.visibilityState });
      // The sandboxed child has an opaque origin. This targets only the exact
      // iframe WindowProxy; every child message is source/origin checked below.
      frame.contentWindow.postMessage({ protocol: PROTOCOL, gameId: GAME_ID, type, payload, sessionId: runtime.sessionId }, '*');
      return true;
    } catch (_) { return false; }
  }

  function updateSelection() {
    const experienceId = EXPERIENCES.has(local.experience?.value) ? local.experience.value : 'standard';
    state.selectedExperienceId = experienceId;
    if (local.character) {
      const forced = FORCED_CHARACTERS[experienceId];
      local.character.disabled = Boolean(forced);
      if (forced) local.character.value = forced;
      else if (STANDARD_CHARACTERS.has(local.character.value) && state.unlockedCharacterIds.includes(local.character.value)) {
        state.selectedCharacterId = local.character.value;
      } else {
        local.character.value = state.selectedCharacterId;
      }
    }
    deriveUnlocks();
    persist();
    setChooserLocked(Boolean(runtime.startPending || (runtime.activeRun && !runtime.activeRun.completed)));
  }

  function render() {
    deriveUnlocks();
    if (local.experience && EXPERIENCES.has(state.selectedExperienceId)) local.experience.value = state.selectedExperienceId;
    if (local.character) {
      local.character.replaceChildren();
      for (const id of ['toadal', 'classic', 'pelican']) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = LABELS[id] + (state.unlockedCharacterIds.includes(id) ? '' : ' · Complete a Standard run to unlock');
        option.disabled = !state.unlockedCharacterIds.includes(id);
        local.character.append(option);
      }
      const forcedCharacter = FORCED_CHARACTERS[state.selectedExperienceId];
      if (forcedCharacter) {
        const option = document.createElement('option');
        option.value = forcedCharacter;
        option.textContent = `${forcedCharacter === 'chomper' ? 'Chomper' : 'Princess Lily'} · selected for this experience`;
        local.character.append(option);
      }
      local.character.disabled = Boolean(FORCED_CHARACTERS[state.selectedExperienceId]);
      local.character.value = selectedCharacterFor();
    }
    if (local.best) local.best.textContent = String(state.bestScoreOverall);
    if (local.sound) {
      local.sound.setAttribute('aria-pressed', state.previewSettings.muted ? 'true' : 'false');
      local.sound.textContent = state.previewSettings.muted ? 'Turn sound on' : 'Mute';
    }
  }

  function sendProfile() {
    runtime.profileReady = false;
    send('host:init', { profile: childProfile() });
  }

  function beginExperience(experienceId, requestedCharacterId) {
    if (!EXPERIENCES.has(experienceId) || !runtime.ready || runtime.startPending || (runtime.activeRun && !runtime.activeRun.completed)) return false;
    if (experienceId === 'standard') {
      const characterId = STANDARD_CHARACTERS.has(requestedCharacterId) ? requestedCharacterId : 'toadal';
      if (!state.unlockedCharacterIds.includes(characterId)) return false;
      state.selectedCharacterId = characterId;
    } else {
      state.selectedExperienceId = experienceId;
      state.selectedCharacterId = FORCED_CHARACTERS[experienceId];
    }
    state.selectedExperienceId = experienceId;
    if (local.experience) local.experience.value = experienceId;
    if (local.character) local.character.value = state.selectedCharacterId;
    updateSelection();
    frame.hidden = false;
    try { frame.focus({ preventScroll: false }); } catch (_) { frame.focus(); }
    runtime.startPending = true;
    runtime.pendingStart = { sessionId: runtime.sessionId, experienceId, characterId: state.selectedCharacterId };
    setChooserLocked(true);
    runtime.activeRun = null;
    sendProfile();
    send('host:start', { profile: childProfile() });
    if (local.result) local.result.hidden = true;
    if (local.status) local.status.textContent = `Starting ${experienceId === 'fmf' ? '5 Minute Feast' : experienceId === 'zen' ? 'Zen' : 'Standard Arcade'}…`;
    return true;
  }

  function handleScore(payload) {
    if (!runtime.activeRun || payload.mode !== runtime.activeRun.experienceId || payload.characterId !== runtime.activeRun.characterId) return;
    if (runtime.activeRun.experienceId !== 'standard' || !STANDARD_CHARACTERS.has(runtime.activeRun.characterId)) return;
    const score = number(payload.score);
    const characterId = runtime.activeRun.characterId;
    state.bestScoreOverall = Math.max(state.bestScoreOverall, score);
    state.bestScoreByCharacter[characterId] = Math.max(number(state.bestScoreByCharacter[characterId]), score);
    deriveUnlocks();
    persist();
  }

  function handleComplete(payload) {
    if (!runtime.activeRun || runtime.activeRun.completed) return;
    const run = runtime.activeRun;
    if (payload.mode !== run.experienceId || payload.characterId !== run.characterId) return;
    run.completed = true;
    runtime.startPending = false;
    setChooserLocked(false);
    const score = number(payload.score);
    const previousBest = state.bestScoreOverall;
    const voluntaryQuit = payload.voluntaryQuit === true || payload.bankedEarly === true;
    if (run.experienceId === 'standard' && STANDARD_CHARACTERS.has(run.characterId)) {
      state.bestScoreOverall = Math.max(state.bestScoreOverall, score);
      state.bestScoreByCharacter[run.characterId] = Math.max(number(state.bestScoreByCharacter[run.characterId]), score);
      if (!voluntaryQuit) state.completedStandardRuns += 1;
      deriveUnlocks();
      persist();
    }
    if (voluntaryQuit) {
      if (local.status) local.status.textContent = 'Run ended early. Score saved; no run-completion unlock was granted.';
      return;
    }
    if (local.result) {
      local.result.hidden = false;
      local.result.replaceChildren();
      const heading = document.createElement('h2');
      heading.textContent = 'Run complete';
      const scoreLine = document.createElement('p');
      scoreLine.textContent = `Run score: ${score}`;
      const bestLine = document.createElement('p');
      bestLine.textContent = state.bestScoreOverall > previousBest ? 'NEW BEST' : `Personal best: ${state.bestScoreOverall}`;
      local.result.append(heading, scoreLine, bestLine);
      if (run.experienceId === 'standard' && state.completedStandardRuns === 1) {
        const unlocked = document.createElement('p');
        unlocked.textContent = 'Classic Frog unlocked';
        local.result.append(unlocked);
      }
      if (run.experienceId === 'standard' && state.unlockedCharacterIds.includes('pelican') && !run.unlockedGullyBefore) {
        const unlocked = document.createElement('p');
        unlocked.textContent = 'Gully unlocked';
        local.result.append(unlocked);
      }
      if (local.start) local.start.textContent = 'Replay';
    }
    if (local.status) local.status.textContent = `${run.experienceId} run finished after ${Math.round((Date.now() - run.startedAt) / 1000)} seconds.`;
  }

  window.addEventListener('message', event => {
    const message = event.data;
    if (event.source !== frame.contentWindow) { auditMessage(message, event, 'rejected', 'source'); return; }
    if (event.origin !== 'null') { auditMessage(message, event, 'rejected', 'origin'); return; }
    if (!isRecord(message) || message.protocol !== PROTOCOL || message.gameId !== GAME_ID || typeof message.type !== 'string') {
      auditMessage(message, event, 'rejected', 'envelope'); return;
    }
    if (typeof message.sessionId !== 'string' || message.sessionId !== runtime.sessionId) {
      auditMessage(message, event, 'rejected', 'session'); return;
    }
    if (!exactKeys(message, ['protocol', 'gameId', 'type', 'payload', 'sessionId'])
        || !ACCEPTED_TYPES.has(message.type) || !validPayload(message.type, message.payload)) {
      auditMessage(message, event, 'rejected', 'schema'); return;
    }
    auditMessage(message, event, 'accepted', '');
    const payload = message.payload;
    if (message.type === 'game:ready') {
      runtime.ready = true;
      setChooserLocked(Boolean(runtime.startPending || (runtime.activeRun && !runtime.activeRun.completed)));
      sendProfile();
    } else if (message.type === 'game:hello') {
      sendProfile();
    } else if (message.type === 'game:profile-ready') {
      runtime.profileReady = true;
      if (local.status) local.status.textContent = runtime.persistenceAvailable ? 'Preview ready. Progress saves in this browser.' : 'Preview ready for this session. Browser storage is unavailable.';
    } else if (message.type === 'game:started') {
      const pending = runtime.pendingStart;
      if (!runtime.startPending || !pending || pending.sessionId !== runtime.sessionId
          || payload.mode !== pending.experienceId || payload.characterId !== pending.characterId) return;
      runtime.startPending = false;
      runtime.pendingStart = null;
      runtime.activeRun = {
        experienceId: pending.experienceId,
        characterId: pending.characterId,
        startedAt: Date.now(),
        completed: false,
        unlockedGullyBefore: state.unlockedCharacterIds.includes('pelican'),
      };
      if (local.result) local.result.hidden = true;
      if (local.status) local.status.textContent = `${pending.experienceId} is playing as ${pending.characterId}.`;
      if (local.start) local.start.textContent = 'Play';
    } else if (message.type === 'game:score') {
      handleScore(payload);
    } else if (message.type === 'game:complete') {
      handleComplete(payload);
    } else if (message.type === 'game:paused') {
      if (local.status) local.status.textContent = 'Game paused.';
    } else if (message.type === 'game:resumed') {
      if (local.status) local.status.textContent = 'Game resumed.';
    } else if (message.type === 'game:request-exit') {
      send('host:exit-confirmed');
      runtime.activeRun = null;
      runtime.startPending = false;
      frame.hidden = true;
      setChooserLocked(false);
      if (local.status) local.status.textContent = 'Preview closed.';
      window.dispatchEvent(new CustomEvent('toadal-arcade-preview-exit', { detail: { reason: payload.reason || 'user-exit' } }));
    } else if (message.type === 'game:request-fullscreen') {
      const target = document.querySelector('[data-arcade-preview-shell]') || frame;
      target.requestFullscreen?.().catch(() => {});
    } else if (message.type === 'game:error') {
      if (local.status) local.status.textContent = 'The preview reported an error.';
    } else if (message.type === 'game:start-rejected') {
      if (!runtime.startPending || !runtime.pendingStart || payload.mode !== runtime.pendingStart.experienceId) return;
      runtime.startPending = false;
      runtime.pendingStart = null;
      runtime.activeRun = null;
      setChooserLocked(false);
      if (local.status) local.status.textContent = `The ${payload.mode || 'selected'} experience could not start (${payload.reason || 'unknown reason'}).`;
    }
  });

  frame.addEventListener('load', () => {
    runtime.sessionId = createSessionId();
    runtime.ready = false;
    runtime.profileReady = false;
    runtime.startPending = false;
    runtime.pendingStart = null;
    runtime.activeRun = null;
    setChooserLocked(true);
    send('host:init', { profile: childProfile() });
  });
  local.experience?.addEventListener('change', updateSelection);
  local.character?.addEventListener('change', updateSelection);
  local.start?.addEventListener('click', () => beginExperience(local.experience?.value || state.selectedExperienceId, local.character?.value || state.selectedCharacterId));
  local.pause?.addEventListener('click', () => send('host:pause'));
  local.resume?.addEventListener('click', () => send('host:resume'));
  local.sound?.addEventListener('click', () => {
    state.previewSettings.muted = !state.previewSettings.muted;
    persist();
    send(state.previewSettings.muted ? 'host:mute' : 'host:unmute');
  });
  local.fullscreen?.addEventListener('click', () => {
    const target = document.querySelector('[data-arcade-preview-shell]') || frame;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else target.requestFullscreen?.().catch(() => {});
  });
  local.exit?.addEventListener('click', event => {
    if (local.exit.tagName === 'A' && local.exit.href) return;
    event.preventDefault();
    send('host:exit-confirmed');
    runtime.activeRun = null;
    runtime.startPending = false;
    frame.hidden = true;
    setChooserLocked(false);
    if (local.status) local.status.textContent = 'Preview closed.';
  });
  document.addEventListener('visibilitychange', () => send('host:visibility', { visibility: document.hidden ? 'hidden' : 'visible' }));
  persist();
  setChooserLocked(true);

  window.ToadalArcadePreviewHost = Object.freeze({
    protocol: PROTOCOL,
    gameId: GAME_ID,
    namespace: NAMESPACE,
    storageKey: STORAGE_KEY,
    state,
    start: beginExperience,
    send,
    reload: () => frame.contentWindow?.location?.reload(),
    sessionId: () => runtime.sessionId,
    persistenceAvailable: () => runtime.persistenceAvailable,
  });
})();
