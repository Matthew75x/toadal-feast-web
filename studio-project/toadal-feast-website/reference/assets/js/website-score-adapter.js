(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalWebsiteScoreAdapter = api;
  if (root && root.document && root.self === root.top) api.boot(root.document, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PROTOCOL = 'toadal.game.v1';
  const GAME_ID = 'wicked-bites';
  const MESSAGE_TYPES = new Set(['game:ready', 'game:started', 'game:paused', 'game:resumed', 'game:score', 'game:complete', 'game:error']);
  const GAME_NAMES = Object.freeze({
    'wicked-bites': 'Wicked Bites',
    'claw-feed-gulper': 'CLAW: Feed Gulper',
    'toadal-tower-defense': 'TOADAL Tower Defense',
    'froggy-fruity-bash': 'Froggy Fruity Bash'
  });

  function normalizeScore(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim();
    // The unchanged compatibility bridge reads the real wbScore UI, whose
    // en-US formatter uses grouped thousands above 999. Reject malformed
    // grouping instead of permissively stripping arbitrary punctuation.
    if (!/^(?:\d+|[1-9]\d{0,2}(?:,\d{3})+)$/.test(text)) return null;
    const score = Number(text.replaceAll(',', ''));
    return Number.isSafeInteger(score) && score >= 0 ? score : null;
  }

  function formatElapsed(milliseconds) {
    const seconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function expectedFrame(frame, initialSrc, pageHref) {
    try {
      const actual = new URL(frame.src, pageHref);
      const expected = new URL(initialSrc, pageHref);
      return actual.origin === new URL(pageHref).origin && actual.pathname === expected.pathname;
    } catch (_) { return false; }
  }

  function isTrustedMessage(event, frame, gameId, initialSrc, pageHref) {
    if (!event || !frame || event.source !== frame.contentWindow || event.origin !== 'null') return false;
    if (gameId !== GAME_ID || !expectedFrame(frame, initialSrc, pageHref)) return false;
    const message = event.data;
    return Boolean(message && typeof message === 'object' && !Array.isArray(message) &&
      message.protocol === PROTOCOL && message.gameId === GAME_ID && MESSAGE_TYPES.has(message.type) &&
      Object.keys(message).every(key => ['protocol', 'gameId', 'type', 'payload'].includes(key)) &&
      message.payload && typeof message.payload === 'object' && !Array.isArray(message.payload) &&
      (message.type !== 'game:score' && message.type !== 'game:complete' || normalizeScore(message.payload.score) !== null));
  }

  function createSession(clock) {
    const now = typeof clock === 'function' ? clock : () => 0;
    let state = 'idle';
    let score = null;
    let sessionBest = null;
    let startedAt = null;
    let elapsedBeforePause = 0;

    function elapsed() {
      return elapsedBeforePause + (state === 'playing' && startedAt !== null ? Math.max(0, now() - startedAt) : 0);
    }
    function accept(type, payload) {
      payload = payload && typeof payload === 'object' ? payload : {};
      if (type === 'game:started') {
        if (state !== 'playing') { state = 'playing'; startedAt = now(); elapsedBeforePause = 0; score = null; sessionBest = null; }
      } else if (type === 'game:paused' && state === 'playing') {
        elapsedBeforePause = elapsed(); startedAt = null; state = 'paused';
      } else if (type === 'game:resumed' && state === 'paused') {
        startedAt = now(); state = 'playing';
      } else if (type === 'game:error' && (state === 'playing' || state === 'paused')) {
        elapsedBeforePause = elapsed(); startedAt = null; state = 'error';
      } else if (type === 'host:exit' && (state === 'playing' || state === 'paused')) {
        elapsedBeforePause = elapsed(); startedAt = null; state = 'exited';
      } else if (type === 'game:score' || type === 'game:complete') {
        if (state !== 'playing' && state !== 'paused') return snapshot();
        const received = normalizeScore(payload.score);
        if (received !== null) {
          score = received;
          sessionBest = sessionBest === null ? received : Math.max(sessionBest, received);
        }
        if (type === 'game:complete') {
          elapsedBeforePause = elapsed(); startedAt = null; state = 'complete';
        }
      }
      return snapshot();
    }
    function snapshot() { return { state, score, sessionBest, elapsedMs: elapsed() }; }
    return { accept, snapshot };
  }

  function renderLeaderboard(root, page) {
    const gameSelect = page.querySelector('[data-leaderboard-game]');
    const scopeSelect = page.querySelector('[data-leaderboard-scope]');
    const empty = page.querySelector('[data-leaderboard-empty]');
    const personalBest = page.querySelector('[data-leaderboard-personal-best]');
    const position = page.querySelector('[data-leaderboard-position]');
    const rows = page.querySelector('[data-leaderboard-rows]');
    if (!gameSelect || !scopeSelect || !empty || !personalBest || !position || !rows) return;

    const params = new URLSearchParams(root.location.search || '');
    if (Object.prototype.hasOwnProperty.call(GAME_NAMES, params.get('game'))) gameSelect.value = params.get('game');

    function render() {
      const gameId = GAME_NAMES[gameSelect.value] ? gameSelect.value : 'wicked-bites';
      const scope = scopeSelect.value === 'connected' ? 'connected' : 'local';
      let snapshot = null;
      const progressionPage = page.matches('[data-progression-page]') ? page : page.querySelector('[data-progression-page]');
      try { snapshot = progressionPage && progressionPage.__toadalProgressionStore && progressionPage.__toadalProgressionStore.getSnapshot(); }
      catch (_) { snapshot = null; }
      const scoreState = snapshot && snapshot.localScores && snapshot.localScores[gameId];
      const records = scope === 'local' && scoreState && Array.isArray(scoreState.runs)
        ? scoreState.runs.filter(item => item && normalizeScore(item.score) !== null).slice(-50)
        : [];
      const best = scope === 'local' && scoreState && normalizeScore(scoreState.best) !== null ? normalizeScore(scoreState.best) : null;
      personalBest.textContent = best === null ? 'Not available' : String(best);
      position.textContent = 'Not available';
      while (rows.firstChild) rows.removeChild(rows.firstChild);

      if (records.length) {
        records.slice().sort((a, b) => normalizeScore(b.score) - normalizeScore(a.score)).forEach((item, index) => {
          const tr = page.ownerDocument.createElement('tr');
          [String(index + 1), 'Guest · this browser', String(normalizeScore(item.score)), item.mode || 'Mode not supplied'].forEach(value => {
            const cell = page.ownerDocument.createElement('td'); cell.textContent = value; tr.appendChild(cell);
          });
          rows.appendChild(tr);
        });
        empty.hidden = true;
        position.textContent = 'Your top result · this browser only';
      } else {
        const tr = page.ownerDocument.createElement('tr');
        const cell = page.ownerDocument.createElement('td');
        cell.colSpan = 4;
        cell.textContent = scope === 'connected'
          ? 'Connected rankings are unavailable until the Froggy Locker leaderboard service is activated.'
          : gameId === GAME_ID
            ? 'No saved Wicked Bites scores are available. The player exposes a validated run score only during its current preview session.'
            : 'This game does not currently expose a trusted website score feed.';
        tr.appendChild(cell); rows.appendChild(tr); empty.hidden = false;
      }
    }
    gameSelect.addEventListener('change', render);
    scopeSelect.addEventListener('change', render);
    // Guest progression owns storage rehydration. Paint after its lifecycle
    // handlers have read current storage, including when this tab is restored.
    let renderQueued = false;
    function scheduleRender() {
      if (renderQueued) return;
      renderQueued = true;
      Promise.resolve().then(() => { renderQueued = false; render(); });
    }
    if (typeof root.addEventListener === 'function') {
      let browserStorage;
      try { browserStorage = root.localStorage; } catch (_) { browserStorage = undefined; }
      const profileKey = root.ToadalGuestProgression && root.ToadalGuestProgression.KEYS && root.ToadalGuestProgression.KEYS.profile;
      root.addEventListener('storage', event => {
        if (browserStorage && event.storageArea === browserStorage &&
            (event.key === null || (profileKey && event.key === profileKey))) scheduleRender();
      });
      root.addEventListener('focus', scheduleRender);
      root.addEventListener('pageshow', event => { if (event.persisted) scheduleRender(); });
      if (typeof page.ownerDocument.addEventListener === 'function') {
        page.ownerDocument.addEventListener('visibilitychange', () => {
          if (page.ownerDocument.visibilityState === 'visible') scheduleRender();
        });
      }
    }
    render();
  }

  function renderPlayer(root, shell) {
    const frame = shell.querySelector('[data-player-frame]');
    const initialSrc = frame && frame.getAttribute('src');
    // Studio renders the host and HUD as sibling components. Associate them
    // explicitly rather than assuming the HUD is nested inside the host shell.
    const hudId = shell.getAttribute('data-player-hud');
    const hud = hudId ? root.document.getElementById(hudId) : shell;
    const scoreNode = hud && hud.querySelector('[data-score-current]');
    const bestNode = hud && hud.querySelector('[data-score-session-best]');
    const elapsedNode = hud && hud.querySelector('[data-score-elapsed]');
    const statusNode = hud && hud.querySelector('[data-score-session-status]');
    if (!frame || !initialSrc || !scoreNode || !elapsedNode) return;
    const elapsedLabel = elapsedNode.parentElement && elapsedNode.parentElement.querySelector('dt');
    if (elapsedLabel) elapsedLabel.textContent = 'Session time';
    const session = createSession(() => root.performance && root.performance.now ? root.performance.now() : Date.now());
    let completionRecorded = false;
    const exitLink = shell.querySelector('[data-player-exit]');

    function paint() {
      const errorPanel = shell.querySelector('[data-player-error]');
      if (errorPanel && !errorPanel.hidden && ['playing', 'paused'].includes(session.snapshot().state)) session.accept('game:error');
      const state = session.snapshot();
      scoreNode.textContent = state.score === null ? 'Waiting for a run' : state.score.toLocaleString();
      if (bestNode) bestNode.textContent = state.sessionBest === null ? '—' : state.sessionBest.toLocaleString();
      elapsedNode.textContent = formatElapsed(state.elapsedMs);
    }
    if (exitLink) exitLink.addEventListener('click', () => session.accept('host:exit'));
    root.addEventListener('message', event => {
      if (!frame.isConnected || (typeof shell.contains === 'function' && !shell.contains(frame))) return;
      if (!isTrustedMessage(event, frame, shell.getAttribute('data-game-id'), initialSrc, root.location.href)) return;
      const message = event.data;
      const priorState = session.snapshot().state;
      if (message.type === 'game:complete' && priorState !== 'playing' && priorState !== 'paused') return;
      if (message.type === 'game:started') {
        completionRecorded = false;
        if (statusNode) statusNode.textContent = 'Current run is in memory. A completed score can save in this browser only; no XP, Sparks, or global ranking is granted.';
      }
      session.accept(message.type, message.payload);
      if (message.type === 'game:complete' && !completionRecorded) {
        completionRecorded = true;
        const score = normalizeScore(message.payload.score);
        const progressionPage = hud.matches && hud.matches('[data-progression-page="game-session"]')
          ? hud : hud.querySelector('[data-progression-page="game-session"]');
        const store = progressionPage && progressionPage.__toadalProgressionStore;
        if (score !== null && store && typeof store.recordLocalScore === 'function') {
          const result = store.recordLocalScore({ gameId: GAME_ID, score, source: 'website-preview-session' });
          if (statusNode) statusNode.textContent = result.ok
            ? 'Completed score saved in this browser only. No XP, Sparks, or global ranking is granted.'
            : 'Run complete; the local score could not be saved. The current score remains visible in this tab.';
        } else if (statusNode) {
          statusNode.textContent = 'Run complete; browser-local score storage is unavailable. The score is visible in this tab only.';
        }
      }
      paint();
    });
    root.setInterval(paint, 1000);
    paint();
  }

  function boot(document, root) {
    document.querySelectorAll('[data-leaderboard-view]').forEach(page => renderLeaderboard(root, page));
    document.querySelectorAll('[data-player-shell]').forEach(shell => renderPlayer(root, shell));
  }

  return { PROTOCOL, GAME_ID, GAME_NAMES, MESSAGE_TYPES, normalizeScore, formatElapsed, expectedFrame, isTrustedMessage, createSession, boot };
});
