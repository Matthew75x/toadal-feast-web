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
  const MESSAGE_TYPES = new Set(['game:ready', 'game:started', 'game:paused', 'game:resumed', 'game:score', 'game:complete']);
  const GAME_NAMES = Object.freeze({
    'wicked-bites': 'Wicked Bites',
    'claw-feed-gulper': 'CLAW: Feed Gulper',
    'toadal-tower-defense': 'TOADAL Tower Defense',
    'froggy-fruity-bash': 'Froggy Fruity Bash'
  });

  function normalizeScore(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim();
    if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)$/.test(text)) return null;
    const score = Number(text.replace(/,/g, ''));
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
        if (state !== 'playing') { state = 'playing'; startedAt = now(); }
      } else if (type === 'game:paused' && state === 'playing') {
        elapsedBeforePause = elapsed(); startedAt = null; state = 'paused';
      } else if (type === 'game:resumed' && state === 'paused') {
        startedAt = now(); state = 'playing';
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
      const supported = snapshot && Array.isArray(snapshot.localHighScores)
        ? snapshot.localHighScores.filter(item => item && item.gameId === gameId && normalizeScore(item.score) !== null)
        : [];
      const records = scope === 'local' ? supported : [];
      const best = records.reduce((value, item) => Math.max(value, normalizeScore(item.score)), null);
      personalBest.textContent = best === null ? 'Not available' : String(best);
      position.textContent = 'Not available';
      while (rows.firstChild) rows.removeChild(rows.firstChild);

      if (records.length) {
        records.slice().sort((a, b) => normalizeScore(b.score) - normalizeScore(a.score)).slice(0, 50).forEach((item, index) => {
          const tr = page.ownerDocument.createElement('tr');
          [String(index + 1), 'Guest · this browser', String(normalizeScore(item.score)), item.mode || 'Mode not supplied'].forEach(value => {
            const cell = page.ownerDocument.createElement('td'); cell.textContent = value; tr.appendChild(cell);
          });
          rows.appendChild(tr);
        });
        empty.hidden = true;
        position.textContent = 'Available from local scores';
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
    render();
  }

  function renderPlayer(root, shell) {
    const frame = shell.querySelector('[data-player-frame]');
    const initialSrc = frame && frame.getAttribute('src');
    const scoreNode = shell.querySelector('[data-score-current]');
    const bestNode = shell.querySelector('[data-score-session-best]');
    const elapsedNode = shell.querySelector('[data-score-elapsed]');
    if (!frame || !initialSrc || !scoreNode || !elapsedNode) return;
    const session = createSession(() => root.performance && root.performance.now ? root.performance.now() : Date.now());
    let completionRecorded = false;

    function paint() {
      const state = session.snapshot();
      scoreNode.textContent = state.score === null ? 'Waiting for a run' : state.score.toLocaleString();
      if (bestNode) bestNode.textContent = state.sessionBest === null ? '—' : state.sessionBest.toLocaleString();
      elapsedNode.textContent = formatElapsed(state.elapsedMs);
    }
    root.addEventListener('message', event => {
      if (!frame.isConnected || (typeof shell.contains === 'function' && !shell.contains(frame))) return;
      if (!isTrustedMessage(event, frame, shell.getAttribute('data-game-id'), initialSrc, root.location.href)) return;
      const message = event.data;
      const priorState = session.snapshot().state;
      if (message.type === 'game:complete' && priorState !== 'playing' && priorState !== 'paused') return;
      if (message.type === 'game:started') completionRecorded = false;
      session.accept(message.type, message.payload);
      if (message.type === 'game:complete' && !completionRecorded) {
        completionRecorded = true;
        const score = normalizeScore(message.payload.score);
        const progressionPage = root.document.querySelector('[data-progression-page="game-session"]');
        const store = progressionPage && progressionPage.__toadalProgressionStore;
        if (score !== null && store && typeof store.recordLocalHighScore === 'function') {
          store.recordLocalHighScore({ gameId: GAME_ID, score, source: 'website-preview-session' });
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

  return { PROTOCOL, GAME_ID, GAME_NAMES, normalizeScore, formatElapsed, expectedFrame, isTrustedMessage, createSession, boot };
});
