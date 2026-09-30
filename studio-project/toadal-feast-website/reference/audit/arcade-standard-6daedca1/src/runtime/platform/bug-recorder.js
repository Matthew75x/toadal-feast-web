// ============================================================
// src/runtime/platform/bug-recorder.js — local-first gameplay flight recorder
// ============================================================
// F8        : save an annotated evidence PNG and retain a compact capture record.
// Shift+F8  : export the latest compact bug capsule JSON.
//
// The recorder is intentionally bounded and local-only. It records diagnostic
// context and meaningful gameplay/UI breadcrumbs, never free-form input text.
// It does not send telemetry, mutate gameplay, or persist screenshots in
// localStorage. Screenshots are downloaded on explicit F8 only.

const FroggyBugRecorder = (() => {
  const STORAGE_KEY = 'froggy_feast_bug_recorder_v1';
  const SCHEMA = 'froggy-feast-bug-recorder@1';
  const MAX_BREADCRUMBS = 120;
  const MAX_CAPTURE_RECORDS = 30;
  const MAX_ISSUES = 30;
  const MAX_ISSUE_BREADCRUMBS = 60;
  const MAX_VISIBLE_UI = 12;
  const CONTEXT_POLL_MS = 900;
  const sessionId = `ff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const sessionStartedUtc = new Date().toISOString();
  const breadcrumbs = [];
  let latestCapture = null;
  let latestLocationKey = '';
  let initialized = false;
  let contextTimer = 0;
  let eventBusBound = false;
  let toastTimer = 0;
  let lastEvidenceKind = 'unknown';
  let lastEvidenceError = '';

  const IMPORTANT_EVENTS = Object.freeze([
    'gameStarted', 'gameOver', 'levelUp', 'resumePressed', 'arcadeLifecyclePaused',
    'arcadeFoodCaught', 'livingFeastMilestone', 'livingFeastRecordBroken',
    'puzzleLevelStarted', 'puzzleLevelComplete', 'puzzleLevelFail', 'puzzleManualRetry',
    'puzzleFrogMoved', 'puzzleFoodEaten', 'puzzleEnergyDepleted', 'puzzleEnergyGained',
    'puzzleOutOfEnergy', 'puzzleBombDefused', 'puzzleBombNeutralized', 'bombHit',
    'bombRevealed', 'puzzleForcedVomitRequired', 'puzzleSpitUp', 'puzzleSelfVomit',
    'puzzleGoldenDefusalTileEntered', 'puzzleUndoUsed', 'puzzlePauseChanged',
    'puzzleDeadEnd', 'puzzleEmptyPondAchieved', 'puzzleLifeLost',
    'connect3Started', 'connect3GameOver', 'feastfallPondStir', 'feastfallOrderComplete',
    'infiniteStarted', 'infinitePlotReclaimed', 'infiniteColonyRankUp',
    'infiniteHeroAbilityUsed', 'infiniteBuildingCompleted', 'infiniteBuildingUpgraded',
    'infiniteGoldExchangeRejected', 'infiniteGoldExchanged', 'infiniteMilestoneClaimed',
  ]);

  function text(value, limit = 180) {
    try {
      return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
    } catch (_) {
      return '';
    }
  }

  function primitiveSnapshot(value, depth = 0) {
    if (depth > 2) return undefined;
    if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) return value.slice(0, 12).map(item => primitiveSnapshot(item, depth + 1)).filter(item => item !== undefined);
    if (typeof value !== 'object') return text(value, 80);
    const result = {};
    let count = 0;
    for (const [key, item] of Object.entries(value)) {
      if (count >= 18) break;
      if (/password|token|secret|email|name|message|text|input/i.test(key) && !/level|order|visitor|pattern|mode|state|screen|messageTimer/i.test(key)) continue;
      const safe = primitiveSnapshot(item, depth + 1);
      if (safe !== undefined) {
        result[key] = safe;
        count += 1;
      }
    }
    return result;
  }

  function localTimestamp(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function filenameTimestamp(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function isVisible(element) {
    if (!(element instanceof Element) || element.hidden || element.getAttribute('aria-hidden') === 'true' || element.classList.contains('hidden')) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  function visibleUiIds() {
    const selector = [
      '#mainMenu', '#pauseOverlay', '#gameOverOverlay', '#arcadeCheckpointOverlay',
      '#panelSettings', '#panelAudio', '#panelDailyGoals', '#panelCollection', '#panelCharSelect',
      '#panelAchievements', '#panelCosmetics', '#panelInstructions', '#panelLeaderboard',
      '#puzzle-levelselect', '#puzzle-levelcomplete',
      '#arcadeStandaloneMenu', '#arcadeStandalonePause', '#arcadeResultOverlay',
      '#puzzleStandaloneMenu', '#puzzleStandalonePause',
      '#connect3StandaloneMenu', '#connect3StandalonePause',
      '#infiniteStandaloneMenu', '#infiniteStandalonePause',
      '#feastfallVisitorShell', '[data-vf-pause-overlay]', '[data-vf-help-overlay]', '[data-vf-settings-overlay]', '[data-vf-result]' ,
      '[role="dialog"]', '[data-standalone-view]'
    ].join(',');
    const ids = [];
    document.querySelectorAll(selector).forEach(element => {
      if (!isVisible(element)) return;
      const marker = element.id || element.getAttribute('data-standalone-view') || element.getAttribute('aria-label') || element.tagName.toLowerCase();
      if (marker && !ids.includes(marker)) ids.push(text(marker, 80));
    });
    return ids.slice(0, MAX_VISIBLE_UI);
  }

  function detectSurface(visible = visibleUiIds()) {
    const set = new Set(visible.map(item => item.toLowerCase()));
    if ([...set].some(id => /gameover|result|levelcomplete|checkpoint/.test(id))) return 'result/checkpoint';
    // A canonical panel can intentionally sit above the paused game.  Surface
    // classification follows the player-facing top layer, so Settings must
    // outrank the still-present shared pause shell behind it.
    if ([...set].some(id => /settings/.test(id))) return 'settings';
    if ([...set].some(id => /audio/.test(id))) return 'audio';
    if ([...set].some(id => /pause/.test(id))) return 'pause';
    if ([...set].some(id => /charselect/.test(id))) return 'character-select';
    if ([...set].some(id => /levelselect/.test(id))) return 'level-select';
    if ([...set].some(id => /menu/.test(id)) || document.body?.classList?.contains('menu-open')) return 'menu';
    const gs = typeof GameState !== 'undefined' ? GameState : null;
    if (gs?.screen && !['main', 'menu'].includes(String(gs.screen))) return text(gs.screen, 60);
    return 'gameplay';
  }

  function modeLabel(rawMode) {
    const mode = String(rawMode || '').toLowerCase();
    if (mode === 'puzzle') return 'Puzzle';
    if (mode === 'connect3' || mode === 'feastfall') return 'Feastfall';
    if (mode === 'infinite') return 'Infinite';
    if (['standard', 'tc', 'fmf', 'zen'].includes(mode)) return mode === 'standard' ? 'Arcade' : `Arcade:${mode}`;
    return mode ? text(mode, 50) : 'Unknown';
  }

  function releaseVersion() {
    try {
      if (typeof RELEASE_META !== 'undefined') return text(RELEASE_META?.version || RELEASE_META?.release || '', 80);
      if (globalThis.ReleaseMeta) return text(globalThis.ReleaseMeta.version || globalThis.ReleaseMeta.release || '', 80);
    } catch (_) {}
    return '';
  }

  function readContext() {
    const now = new Date();
    const visible = visibleUiIds();
    const gs = typeof GameState !== 'undefined' ? GameState : null;
    const standaloneHostMode = document.getElementById('connect3StandaloneMenu') ? 'connect3'
      : document.getElementById('puzzleStandaloneMenu') ? 'puzzle'
      : document.getElementById('infiniteStandaloneMenu') ? 'infinite'
      : document.getElementById('arcadeStandaloneMenu') ? 'standard'
      : '';
    const rawMode = gs?.currentMode || standaloneHostMode || (typeof Connect3State !== 'undefined' && Connect3State?.active ? 'connect3' : '') || (typeof InfiniteState !== 'undefined' ? 'infinite' : '');
    const mode = modeLabel(rawMode);
    const surface = detectSurface(visible);
    const puzzleState = typeof PuzzleFrogState !== 'undefined' ? PuzzleFrogState : null;
    const feastfallState = typeof Connect3State !== 'undefined' ? Connect3State : null;
    const infiniteState = typeof InfiniteState !== 'undefined' ? InfiniteState : null;
    const levelId = gs?.currentLevelId || puzzleState?.levelId || null;
    const orderId = feastfallState?.orderId || null;
    let orderName = '';
    try {
      if (orderId && typeof feastfallOrderById === 'function') orderName = text(feastfallOrderById(orderId)?.name || '', 100);
    } catch (_) {}
    let visitorId = null;
    let feastfallPresentation = null;
    let feastfallPantryId = null;
    try {
      const visitor = feastfallState?.visitor;
      visitorId = visitor?.current?.id || visitor?.activeVisitor?.id || visitor?.activeVisitorId || visitor?.visitorId || visitor?.id || null;
      feastfallPresentation = globalThis.FeastfallPresentationHost?.debugSnapshot?.() || null;
      feastfallPantryId = globalThis.FeastfallFoodAssets?.activePantry?.()?.id || null;
    } catch (_) {}
    const routeParts = [mode, surface];
    if (levelId) routeParts.push(levelId);
    if (orderId) routeParts.push(orderName ? `${orderId}:${orderName}` : orderId);
    if (visitorId) routeParts.push(`visitor:${visitorId}`);
    const perf = (() => {
      try { return typeof PerfMonitor !== 'undefined' ? primitiveSnapshot(PerfMonitor.getSnapshot?.()) : null; } catch (_) { return null; }
    })();
    const authorityRoot = document.body || document.documentElement;
    const uiAuthority = text(authorityRoot?.dataset?.uiAuthority || document.documentElement?.dataset?.uiAuthority || 'unknown', 80);
    const surfaceClass = text(authorityRoot?.dataset?.surfaceClass || (globalThis.FROGGY_DEV_SURFACE ? 'dev' : 'unknown'), 40);
    const routeId = text(authorityRoot?.dataset?.routeId || `${mode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${surface}`, 100);
    const themeId = text(document.documentElement?.dataset?.gameTheme || authorityRoot?.dataset?.assetTheme || document.documentElement?.dataset?.puzzleBrand || 'froggy-feast', 100);
    const visibleAuthorityNode = [...document.querySelectorAll('[data-hud-authority]')].find(node => isVisible(node));
    const visibleOverlayNode = [...document.querySelectorAll('[data-overlay-authority]')].find(node => isVisible(node));
    const hudAuthority = text(visibleAuthorityNode?.dataset?.hudAuthority || (surface === 'gameplay' ? 'unclassified' : 'none'), 100);
    const overlayAuthority = text(visibleOverlayNode?.dataset?.overlayAuthority || 'none', 100);
    return Object.freeze({
      utcTime: now.toISOString(),
      localTime: localTimestamp(now),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      sessionId,
      sessionStartedUtc,
      page: text(`${location.pathname}${location.search}${location.hash}`, 260),
      mode,
      rawMode: text(rawMode, 50),
      gameState: text(gs?.mode, 60),
      screen: text(gs?.screen, 60),
      surface,
      uiAuthority,
      surfaceClass,
      routeId,
      themeId,
      hudAuthority,
      overlayAuthority,
      menuLocation: routeParts.join(' > '),
      visibleUi: visible,
      levelId,
      arcadeLevel: mode.startsWith('Arcade') ? Number(gs?.level) || null : null,
      orderId,
      orderName: orderName || null,
      visitorId,
      puzzle: puzzleState ? primitiveSnapshot({
        row: puzzleState.row, col: puzzleState.col,
        energy: puzzleState.energy, energyMax: puzzleState.energyMax,
        stomachFullness: puzzleState.stomachFullness, stomachCapacity: puzzleState.stomachCapacity,
        hearts: puzzleState.hearts, moveCount: puzzleState.moveHistory?.length,
      }) : null,
      feastfall: feastfallState ? primitiveSnapshot({
        grid: feastfallState.grid, score: feastfallState.score, hearts: feastfallState.hearts,
        orderMovesUsed: feastfallState.orderMovesUsed, orderMoveBudget: feastfallState.orderMoveBudget,
        chorusStreak: feastfallState.chorusStreak, rngSeed: feastfallState.rngSeed,
        rngState: feastfallState.rngState, rngCalls: feastfallState.rngCalls, pondStirs: feastfallState.pondStirs,
        visitorIndex: feastfallState.visitor?.visitorIndex, visitorCount: feastfallState.visitor?.visitorCount,
        satisfaction: feastfallState.visitor?.current, satisfactionTarget: feastfallState.visitor?.target,
        servingsRemaining: feastfallState.visitor?.servingsRemaining, currentRequest: feastfallState.visitor?.currentRequest,
        pantryId: feastfallPantryId,
        boardPhase: feastfallState.boardMotion?.phase, settlingTiles: feastfallState.boardMotion?.settlingTiles,
        selectedPath: feastfallState.selected?.map?.(cell => ({ row: cell.row, col: cell.col })),
        board: feastfallState.board?.map?.(row => row.map(tile => tile?.id || null)),
        presentation: feastfallPresentation,
        reducedMotion: globalThis.SETTINGS?.reducedMotion === true,
      }) : null,
      infinite: infiniteState ? primitiveSnapshot({
        mapTier: infiniteState.mapTier, lifetimeFood: infiniteState.lifetimeFood,
        coins: infiniteState.coins, selectedPlotKey: infiniteState.selectedPlotKey,
        frogs: infiniteState.frogs?.length, buildings: infiniteState.buildings?.length,
      }) : null,
      viewport: {
        width: Math.round(window.innerWidth || 0), height: Math.round(window.innerHeight || 0),
        dpr: Number((window.devicePixelRatio || 1).toFixed(2)),
        orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
      },
      release: releaseVersion(),
      userAgent: text(navigator.userAgent, 240),
      perf,
    });
  }

  function addBreadcrumb(type, data = null) {
    const context = readContext();
    const entry = Object.freeze({
      at: context.utcTime,
      type: text(type, 80),
      location: context.menuLocation,
      data: primitiveSnapshot(data),
    });
    breadcrumbs.push(entry);
    if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.splice(0, breadcrumbs.length - MAX_BREADCRUMBS);
    return entry;
  }

  function readStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (parsed && parsed.schema === SCHEMA) return parsed;
    } catch (_) {}
    return { schema: SCHEMA, captures: [], issues: [], updatedAt: null };
  }

  function writeStore(store) {
    try {
      store.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (_) {
      return false;
    }
  }

  function fingerprintIssue(error) {
    const message = text(error?.message || error?.reason || 'unknown', 240).replace(/\b\d+\b/g, '#');
    const stackLine = text(String(error?.stack || '').split('\n').slice(0, 2).join(' '), 300).replace(/:\d+:\d+/g, ':#:#');
    const context = readContext();
    return `${text(error?.kind || 'error', 40)}|${context.mode}|${message}|${stackLine}`.slice(0, 900);
  }

  function recordIssue(error = {}) {
    const context = readContext();
    const fingerprint = fingerprintIssue(error);
    const store = readStore();
    const now = context.utcTime;
    const existing = store.issues.find(issue => issue.fingerprint === fingerprint);
    const sample = {
      at: now,
      context,
      error: primitiveSnapshot(error),
      breadcrumbs: breadcrumbs.slice(-MAX_ISSUE_BREADCRUMBS),
    };
    if (existing) {
      existing.count = Math.max(1, Number(existing.count) || 1) + 1;
      existing.lastSeen = now;
      existing.sample = sample;
    } else {
      store.issues.unshift({
        id: `issue-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        fingerprint,
        firstSeen: now,
        lastSeen: now,
        count: 1,
        kind: text(error.kind || 'error', 80),
        message: text(error.message || error.reason || 'Unknown error', 400),
        sample,
      });
      if (store.issues.length > MAX_ISSUES) store.issues.length = MAX_ISSUES;
    }
    writeStore(store);
    return existing || store.issues[0];
  }

  function recordCapture(context, filename) {
    const store = readStore();
    const capture = {
      id: `capture-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      at: context.utcTime,
      filename,
      evidenceKind: lastEvidenceKind,
      context,
      breadcrumbs: breadcrumbs.slice(-MAX_ISSUE_BREADCRUMBS),
      recentErrors: typeof ErrorReporter !== 'undefined' ? primitiveSnapshot(ErrorReporter.recent?.().slice(-8)) : [],
    };
    store.captures.unshift(capture);
    if (store.captures.length > MAX_CAPTURE_RECORDS) store.captures.length = MAX_CAPTURE_RECORDS;
    writeStore(store);
    latestCapture = capture;
    return capture;
  }

  function toast(message) {
    if (!document.body) return;
    let node = document.getElementById('froggyBugRecorderToast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'froggyBugRecorderToast';
      Object.assign(node.style, {
        position: 'fixed', left: '50%', top: 'calc(66px + env(safe-area-inset-top, 0px))', right: 'auto', bottom: 'auto', zIndex: '2147483647',
        transform: 'translateX(-50%)', maxWidth: 'min(430px, calc(100vw - 24px))', padding: '9px 12px', borderRadius: '10px',
        background: 'rgba(8,22,18,.94)', border: '1px solid rgba(126,221,84,.7)',
        color: '#efffe7', font: '700 12px/1.35 system-ui, sans-serif', boxShadow: '0 5px 24px rgba(0,0,0,.35)',
        pointerEvents: 'none', opacity: '0', transition: 'opacity .15s ease', whiteSpace: 'normal',
      });
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.style.opacity = '0'; }, 2600);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function wrapLines(ctx, value, maxWidth) {
    const words = text(value, 400).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines.slice(0, 4);
  }

  function visibleUiText() {
    const selectors = [
      '#mainMenu', '#pauseOverlay', '#gameOverOverlay', '#arcadeCheckpointOverlay',
      '#panelSettings', '#panelAudio', '#panelDailyGoals', '#panelCollection', '#panelCharSelect',
      '#panelAchievements', '#panelCosmetics', '#panelInstructions', '#panelLeaderboard',
      '#puzzle-levelselect', '#puzzle-levelcomplete',
      '#arcadeStandaloneMenu', '#arcadeStandalonePause', '#arcadeResultOverlay',
      '#puzzleStandaloneMenu', '#puzzleStandalonePause', '#connect3StandaloneMenu', '#connect3StandalonePause',
      '#infiniteStandaloneMenu', '#infiniteStandalonePause',
      '#feastfallVisitorShell', '[data-vf-pause-overlay]', '[data-vf-help-overlay]', '[data-vf-settings-overlay]', '[data-vf-result]' 
    ];
    const lines = [];
    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (!isVisible(element)) return;
      const heading = element.querySelector('h1,h2,h3,.panel-title,.standalone-menu-title')?.textContent;
      if (heading) lines.push(text(heading, 100));
      element.querySelectorAll('button:not([hidden]), [role="button"]:not([hidden])').forEach(button => {
        if (isVisible(button) && lines.length < 14) lines.push(`• ${text(button.getAttribute('aria-label') || button.textContent || button.id, 90)}`);
      });
    });
    return [...new Set(lines)].slice(0, 14);
  }

  function evidenceCanvasExportable(canvas, { requireVisible = true } = {}) {
    if (!(canvas instanceof HTMLCanvasElement) || canvas.width <= 0 || canvas.height <= 0) return false;
    if (requireVisible && !isVisible(canvas)) return false;
    try { canvas.toDataURL('image/png'); return true; } catch (_) { return false; }
  }

  // Exportability only proves that a canvas can encode a PNG. It does not prove
  // that the encoded pixels contain gameplay. Sample a small copy so blank,
  // transparent, uniform, or near-uniform dark buffers fail closed instead of
  // becoming valid-looking F8 evidence.
  function evidenceCanvasHasVisualSignal(canvas) {
    if (!evidenceCanvasExportable(canvas)) return false;
    try {
      const size = 48;
      const probe = document.createElement('canvas');
      probe.width = size; probe.height = size;
      const ctx = probe.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(canvas, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      const lum = new Float32Array(size * size);
      const opaque = new Uint8Array(size * size);
      let opaqueCount = 0, min = 255, max = 0, sum = 0, sumSq = 0;
      for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
        if (pixels[i + 3] < 16) continue;
        const value = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
        lum[p] = value; opaque[p] = 1; opaqueCount += 1;
        min = Math.min(min, value); max = Math.max(max, value); sum += value; sumSq += value * value;
      }
      if (opaqueCount < size * size * 0.25 || max - min < 20) return false;
      const mean = sum / opaqueCount;
      const variance = Math.max(0, sumSq / opaqueCount - mean * mean);
      if (Math.sqrt(variance) < 4) return false;
      let edges = 0;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const p = y * size + x;
          if (!opaque[p]) continue;
          if (x && opaque[p - 1] && Math.abs(lum[p] - lum[p - 1]) >= 10) edges += 1;
          if (y && opaque[p - size] && Math.abs(lum[p] - lum[p - size]) >= 10) edges += 1;
          if (edges >= 12) return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  function evidenceRootSelector() {
    return [
      '#mainMenu','#pauseOverlay','#gameOverOverlay','#arcadeCheckpointOverlay','#arcadeResultOverlay',
      '#panelSettings','#panelAudio','#panelDailyGoals','#panelCollection','#panelCharSelect','#panelAchievements','#panelCosmetics','#panelInstructions','#panelLeaderboard',
      '#arcadeStandaloneMenu','#arcadeStandalonePause','#puzzleStandaloneMenu','#puzzleStandalonePause',
      '#connect3StandaloneMenu','#connect3StandalonePause','#infiniteStandaloneMenu','#infiniteStandalonePause',
      '#puzzleNextScreen','#puzzle-levelselect','#puzzle-levelcomplete',
      '[data-vf-pause-overlay]','[data-vf-help-overlay]','[data-vf-settings-overlay]','[data-vf-result]',
      '[role="dialog"]','[data-standalone-view]','[id^="panel"]'
    ].join(',');
  }

  // F8 must follow actual paint order, not lifecycle residue such as body.menu-open.
  // A candidate is authoritative only when one of its own sampled points is not
  // occluded by an unrelated surface. Among simultaneously painted roots,
  // descendants, stacking order, and DOM paint order resolve the front layer.
  function topVisibleEvidenceRoot() {
    const selector = evidenceRootSelector();
    const candidates = [...document.querySelectorAll(selector)].filter(element => isVisible(element));
    if (!candidates.length) return null;
    if (typeof document.elementsFromPoint !== 'function') return candidates[candidates.length - 1] || null;
    const candidateSet = new Set(candidates);
    const hits = [];
    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement?.clientWidth || 1);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement?.clientHeight || 1);
    const rootAtPoint = (x, y) => {
      const stack = document.elementsFromPoint(
        Math.max(0, Math.min(viewportWidth - 1, x)),
        Math.max(0, Math.min(viewportHeight - 1, y))
      );
      for (const node of stack) {
        if (!(node instanceof Element)) continue;
        const root = node.closest(selector);
        if (root && candidateSet.has(root) && isVisible(root)) return root;
        const style = getComputedStyle(node);
        if (style.pointerEvents === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        return null;
      }
      return null;
    };
    candidates.forEach(candidate => {
      const rect = candidate.getBoundingClientRect();
      const points = [
        [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
        [rect.left + rect.width * 0.25, rect.top + rect.height * 0.25],
        [rect.left + rect.width * 0.75, rect.top + rect.height * 0.25],
        [rect.left + rect.width * 0.25, rect.top + rect.height * 0.75],
        [rect.left + rect.width * 0.75, rect.top + rect.height * 0.75],
      ];
      for (const [x, y] of points) {
        const root = rootAtPoint(x, y);
        if (root && !hits.includes(root)) hits.push(root);
      }
    });
    if (!hits.length) return null;
    return hits.slice().sort((a, b) => {
      if (a.contains(b)) return 1;
      if (b.contains(a)) return -1;
      const az = Number.parseFloat(getComputedStyle(a).zIndex);
      const bz = Number.parseFloat(getComputedStyle(b).zIndex);
      const aZ = Number.isFinite(az) ? az : 0;
      const bZ = Number.isFinite(bz) ? bz : 0;
      if (aZ !== bZ) return bZ - aZ;
      return candidates.indexOf(b) - candidates.indexOf(a);
    })[0] || null;
  }

  function drawEvidenceUiCard(out, lines, x, y, width, maxHeight) {
    if (!lines?.length || width <= 20 || maxHeight <= 20) return;
    const lineHeight = Math.max(24, Math.round(width / 18));
    const height = Math.min(maxHeight, 34 + lines.length * lineHeight);
    out.fillStyle = 'rgba(5,15,12,.91)'; out.fillRect(x,y,width,height);
    out.strokeStyle = 'rgba(158,232,127,.74)'; out.lineWidth = 2; out.strokeRect(x,y,width,height);
    out.fillStyle = '#f3fff0'; out.font = `700 ${Math.max(14, Math.round(width / 24))}px system-ui, sans-serif`;
    let ty=y+30;
    for (const line of lines) { for (const wrapped of wrapLines(out,line,width-30)) { out.fillText(wrapped,x+15,ty,width-30); ty+=lineHeight; if (ty>y+height-10) return; } }
  }

  function evidenceUiRoots() {
    const root = topVisibleEvidenceRoot();
    return root ? [root] : [];
  }

  function evidenceCssColor(value, fallback = 'rgba(7,24,18,.92)') {
    const v=String(value||'').trim();
    if(!v || v==='transparent' || v==='rgba(0, 0, 0, 0)') return fallback;
    return v;
  }

  function drawDomLayoutEvidence(out, imageHeight) {
    const vw=Math.max(1,window.innerWidth||900), vh=Math.max(1,window.innerHeight||700);
    const sx=out.canvas.width/vw, sy=imageHeight/vh;
    const bodyStyle=getComputedStyle(document.body);
    out.fillStyle=evidenceCssColor(bodyStyle.backgroundColor,'#10231c');out.fillRect(0,0,out.canvas.width,imageHeight);
    const roots=evidenceUiRoots();
    if(!roots.length)return false;
    const drawBox=(el, emphasis=false)=>{
      if(!isVisible(el))return;
      const r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh||r.right<0||r.left>vw)return;
      const x=Math.max(0,r.left)*sx,y=Math.max(0,r.top)*sy,w=Math.max(1,Math.min(vw,r.right)-Math.max(0,r.left))*sx,h=Math.max(1,Math.min(vh,r.bottom)-Math.max(0,r.top))*sy;
      const st=getComputedStyle(el);
      out.fillStyle=evidenceCssColor(st.backgroundColor,emphasis?'rgba(9,31,23,.94)':'rgba(6,22,16,.58)');out.fillRect(x,y,w,h);
      const bw=Math.max(0,parseFloat(st.borderTopWidth)||0);if(bw||emphasis){out.strokeStyle=evidenceCssColor(st.borderTopColor,'rgba(147,224,119,.56)');out.lineWidth=Math.max(1,(bw||1)*Math.min(sx,sy));out.strokeRect(x+.5,y+.5,Math.max(0,w-1),Math.max(0,h-1));}
    };
    roots.forEach(root=>{
      drawBox(root,true);
      root.querySelectorAll('.familiar-section,.menu-hero,.menu-play-section,.arcade-result-stats>div,.result-stat,button,[role="button"]').forEach(el=>drawBox(el,el.matches('button,[role="button"]')));
    });
    const textNodes=[];
    roots.forEach(root=>{
      root.querySelectorAll('h1,h2,h3,p,strong,small,button,[role="button"],.menu-title,.menu-tagline,.panel-title').forEach(el=>{if(isVisible(el)&&!textNodes.includes(el))textNodes.push(el);});
    });
    textNodes.slice(0,90).forEach(el=>{
      const raw=text(el.textContent||el.getAttribute('aria-label')||'',160);if(!raw)return;
      const r=el.getBoundingClientRect();if(r.bottom<0||r.top>vh||r.right<0||r.left>vw)return;
      const st=getComputedStyle(el);const size=Math.max(10,Math.min(34,(parseFloat(st.fontSize)||14)*Math.min(sx,sy)));
      out.font=`${Number(st.fontWeight)>=700?'800':'600'} ${size}px system-ui, sans-serif`;out.fillStyle=evidenceCssColor(st.color,'#f3fff0');out.textBaseline='top';
      const x=Math.max(0,r.left+6)*sx,y=Math.max(0,r.top+5)*sy,max=Math.max(30,Math.min(vw,r.right)-Math.max(0,r.left)-12)*sx;
      let ty=y;for(const line of wrapLines(out,raw,max).slice(0,2)){out.fillText(line,x,ty,max);ty+=size*1.16;}
    });
    return true;
  }

  function exactDomEvidenceRoot(context) {
    const settingsPanel = document.getElementById('panelSettings');
    const root = topVisibleEvidenceRoot();
    // Preserve the existing Settings exact-root contract without restoring the
    // old lifecycle-first menu precedence. Settings wins only when the actual
    // paint-aware selector says that same panel is frontmost.
    if (context?.surface === 'settings' && root === settingsPanel && isVisible(settingsPanel)) return settingsPanel;
    return root;
  }

  function cloneEvidenceNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
    if (!(node instanceof Element)) return null;
    if (node.matches('script,style,link[rel="stylesheet"],noscript')) return null;
    if (node instanceof HTMLCanvasElement) {
      try {
        const img = document.createElement('img');
        img.src = node.toDataURL('image/png');
        const rect = node.getBoundingClientRect();
        img.width = Math.max(1, Math.round(rect.width)); img.height = Math.max(1, Math.round(rect.height));
        return img;
      } catch (_) { return document.createElement('span'); }
    }
    const clone = node.cloneNode(false);
    try {
      const style = getComputedStyle(node);
      for (let i = 0; i < style.length; i += 1) {
        const prop = style[i]; clone.style.setProperty(prop, style.getPropertyValue(prop), style.getPropertyPriority(prop));
      }
      clone.style.setProperty('animation', 'none', 'important'); clone.style.setProperty('transition', 'none', 'important');
      clone.style.setProperty('caret-color', 'transparent', 'important');
    } catch (_) {}
    if (node instanceof HTMLImageElement) clone.setAttribute('src', node.currentSrc || node.src || node.getAttribute('src') || '');
    if (node instanceof HTMLInputElement) { clone.setAttribute('value', node.value || ''); if (node.checked) clone.setAttribute('checked',''); else clone.removeAttribute('checked'); }
    if (node instanceof HTMLTextAreaElement) clone.textContent = node.value || '';
    for (const child of node.childNodes) { const childClone = cloneEvidenceNode(child); if (childClone) clone.appendChild(childClone); }
    return clone;
  }

  async function buildExactDomEvidenceCanvas(context) {
    const root = exactDomEvidenceRoot(context);
    if (!root) return null;
    try {
      const vw = Math.max(1, window.innerWidth || 900), vh = Math.max(1, window.innerHeight || 700);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const captureWidth = Math.max(720, Math.min(1440, Math.round(vw * dpr)));
      const imageHeight = Math.max(420, Math.round(captureWidth * (vh / vw))), footerHeight = 150;
      const snapshot = document.createElement('div'); snapshot.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
      Object.assign(snapshot.style,{position:'relative',width:`${vw}px`,height:`${vh}px`,overflow:'hidden',margin:'0',padding:'0',background:evidenceCssColor(getComputedStyle(document.body).backgroundColor,'#10231c')});
      const clone = cloneEvidenceNode(root); if (!clone) return null;
      const rect = root.getBoundingClientRect(); clone.style.position='absolute'; clone.style.left=`${rect.left}px`; clone.style.top=`${rect.top}px`; clone.style.width=`${rect.width}px`; clone.style.height=`${rect.height}px`; clone.style.margin='0'; snapshot.appendChild(clone);
      const inlineCache = new Map();
      for (const imgNode of snapshot.querySelectorAll('img')) {
        const source=String(imgNode.getAttribute('src')||'').trim(); if(!source||source.startsWith('data:'))continue;
        try {
          let encoded=inlineCache.get(source);
          if(!encoded){const response=await fetch(source,{cache:'force-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const blob=await response.blob();if(String(blob.type||response.headers.get('content-type')||'').includes('image/svg+xml')){encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||new Error('SVG evidence image encoding failed.'));reader.readAsDataURL(blob);});}else{const bitmap=await createImageBitmap(blob);const maxSide=192,scale=Math.min(1,maxSide/Math.max(1,bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(bitmap,0,0,w,h);if(typeof bitmap.close==='function')bitmap.close();encoded=canvas.toDataURL('image/png');}inlineCache.set(source,encoded);}imgNode.setAttribute('src',encoded);
        } catch (_) { imgNode.removeAttribute('src'); }
      }
      const serialized=new XMLSerializer().serializeToString(snapshot);
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}"><foreignObject x="0" y="0" width="100%" height="100%">${serialized}</foreignObject></svg>`;
      const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Puzzle DOM evidence rasterization failed.'));image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;});
      const output=document.createElement('canvas');output.width=captureWidth;output.height=imageHeight+footerHeight;const out=output.getContext('2d');out.fillStyle='#10231c';out.fillRect(0,0,output.width,output.height);out.drawImage(image,0,0,output.width,imageHeight);output.toDataURL('image/png');
      out.fillStyle='rgba(5, 15, 12, .97)';out.fillRect(0,imageHeight,output.width,footerHeight);out.fillStyle='#9ee87f';out.font=`800 ${Math.max(18,Math.round(output.width/62))}px system-ui, sans-serif`;out.fillText('TOADAL FEAST · F8 EVIDENCE',24,imageHeight+30);out.fillStyle='#f3fff0';out.font=`600 ${Math.max(15,Math.round(output.width/74))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      const info=[`${context.localTime} ${context.timezone?`(${context.timezone})`:''} · UTC ${context.utcTime.replace('T',' ').replace('Z','')}`,context.menuLocation,`UI ${context.uiAuthority} · ${context.surfaceClass} · ${context.routeId} · HUD ${context.hudAuthority} · overlay ${context.overlayAuthority} · theme ${context.themeId}`,`${context.viewport.width}×${context.viewport.height} @${context.viewport.dpr}x · ${context.page}${context.release?` · ${context.release}`:''}`];let y=imageHeight+58;for(const row of info){for(const line of wrapLines(out,row,output.width-48)){out.fillText(line,24,y);y+=24;if(y>output.height-12)break;}}
      lastEvidenceKind='exact-dom';lastEvidenceError='';return output;
    } catch (error) {
      lastEvidenceError=String(error?.stack||error?.message||error||'unknown evidence error');
      const output=buildEvidenceCanvas(context,{forceDomLayout:true});lastEvidenceKind='dom-snapshot';return output;
    }
  }

  function buildEvidenceCanvas(context, { forceDomLayout = false } = {}) {
    const primary = document.getElementById('gameCanvas');
    const feastShell = document.querySelector('#feastfallVisitorShell:not([hidden])');
    const feastBoard = feastShell?.querySelector('[data-vf-board]') || null;
    const feastVisitor = feastShell?.querySelector('[data-vf-visitor-canvas]') || null;
    // Feastfall's board canvas can be CSS-composited through a host whose own
    // canvas rect is briefly zero during transitions/resizes.  F8 must still
    // capture the pixels the player is seeing, so the visible shell is the
    // visibility authority while exportability is checked on the real canvas.
    const feastShellVisible = !!feastShell && isVisible(feastShell);
    const feastBoardVisible = feastShellVisible && evidenceCanvasExportable(feastBoard, { requireVisible: false });
    const feastVisitorVisible = feastShellVisible && evidenceCanvasExportable(feastVisitor, { requireVisible: false });
    const sourceVisible = !forceDomLayout && evidenceCanvasExportable(primary);
    const sourceHasVisualSignal = sourceVisible && evidenceCanvasHasVisualSignal(primary);
    const isFeastfallComposite = feastBoardVisible;
    const gameplayPixelsRequired = !forceDomLayout && context?.surface === 'gameplay' && !isFeastfallComposite;
    if (gameplayPixelsRequired && (!sourceVisible || !sourceHasVisualSignal)) {
      lastEvidenceKind = 'unsupported-gameplay';
      lastEvidenceError = sourceVisible ? 'GAMEPLAY_CANVAS_VISUAL_SIGNAL_MISSING' : 'GAMEPLAY_CANVAS_UNAVAILABLE';
      throw new Error(lastEvidenceError);
    }
    const captureWidth = Math.max(720, Math.min(1440,
      Math.round((window.innerWidth || (isFeastfallComposite ? 1200 : 900)) * Math.min(window.devicePixelRatio || 1, 2))));
    const sourceRatio = sourceVisible ? primary.height / primary.width : Math.max(0.65, Math.min(1.7,(window.innerHeight||700)/Math.max(1,window.innerWidth||900)));
    const imageHeight = isFeastfallComposite ? Math.max(620,Math.round(captureWidth*.68)) : Math.max(420,Math.round(captureWidth*sourceRatio));
    const footerHeight=150;
    const output=document.createElement('canvas'); output.width=captureWidth; output.height=imageHeight+footerHeight;
    const out=output.getContext('2d'); out.fillStyle='#10231c'; out.fillRect(0,0,output.width,output.height);

    if (isFeastfallComposite) {
      lastEvidenceKind = 'feastfall-composite'; lastEvidenceError = '';
      // Feastfall is intentionally a layered presentation (board canvas + visitor
      // canvas + DOM chrome). Capture both real render surfaces and summarize the
      // live DOM state instead of falling back to the blank generic evidence card.
      const gradient=out.createLinearGradient(0,0,output.width,imageHeight); gradient.addColorStop(0,'#092a21'); gradient.addColorStop(1,'#171d35');
      out.fillStyle=gradient; out.fillRect(0,0,output.width,imageHeight);
      const gap=Math.max(18,Math.round(output.width*.014));
      const boardSide=Math.min(imageHeight-gap*2,Math.round(output.width*.68));
      const bx=gap, by=Math.max(gap,Math.round((imageHeight-boardSide)/2));
      try { out.drawImage(feastBoard,bx,by,boardSide,boardSide); } catch (_) {}
      const rx=bx+boardSide+gap, rw=Math.max(180,output.width-rx-gap);
      if (feastVisitorVisible) {
        const vh=Math.min(Math.round(imageHeight*.37),Math.round(rw*(feastVisitor.height/Math.max(1,feastVisitor.width))));
        try { out.drawImage(feastVisitor,rx,gap,rw,vh); } catch (_) {}
      }
      const live=[];
      const shell=document.getElementById('feastfallVisitorShell');
      const take=(sel,label='')=>{ const el=shell?.querySelector(sel); if (el && isVisible(el) && text(el.textContent,140)) live.push(`${label}${text(el.textContent,140)}`); };
      take('[data-vf-name]','Visitor: '); take('[data-vf-meter-value]','Satisfaction: '); take('[data-vf-pantry-status]','Pantry: '); take('[data-vf-pantry-hint]',''); take('[data-vf-message]','Board: '); take('[data-vf-calm]','World Calm: ');
      const overlayLines=visibleUiText();
      drawEvidenceUiCard(out,[...live,...overlayLines].slice(0,12),rx,Math.round(imageHeight*.42),rw,Math.round(imageHeight*.54));
    } else if (sourceVisible) {
      lastEvidenceKind = 'game-canvas'; lastEvidenceError = '';
      try { out.drawImage(primary,0,0,output.width,imageHeight); } catch (_) { out.fillStyle='#18382d'; out.fillRect(0,0,output.width,imageHeight); }
      if (context.surface !== 'gameplay') drawEvidenceUiCard(out,visibleUiText(),24,24,Math.min(output.width-48,Math.round(output.width*.72)),imageHeight-48);
    } else {
      lastEvidenceKind = 'ui-layout'; lastEvidenceError = '';
      const uiLines=visibleUiText();
      const sourceOnScreen=primary instanceof HTMLCanvasElement && primary.width>0 && primary.height>0 && isVisible(primary);
      const drawn=drawDomLayoutEvidence(out,imageHeight);
      if(!drawn){
        const gradient=out.createLinearGradient(0,0,output.width,imageHeight); gradient.addColorStop(0,'#143f34'); gradient.addColorStop(1,'#20183d');
        out.fillStyle=gradient; out.fillRect(0,0,output.width,imageHeight);
        out.fillStyle='#f3ffe9'; out.font=`800 ${Math.max(26,Math.round(output.width/34))}px system-ui, sans-serif`; out.fillText('TOADAL FEAST! UI Evidence',34,58);
        out.font=`700 ${Math.max(17,Math.round(output.width/55))}px system-ui, sans-serif`; let y=100; const maxWidth=output.width-68;
        const lines=[...(sourceOnScreen?['Canvas pixels unavailable to browser export; diagnostic context preserved.']:[]),...(uiLines.length?uiLines:['No visible UI surface.'])];
        for (const line of lines) { for (const wrapped of wrapLines(out,line,maxWidth)) { out.fillText(wrapped,34,y); y+=Math.max(26,Math.round(output.width/40)); if (y>imageHeight-24) break; } if (y>imageHeight-24) break; }
      }
    }

    // Evidence footer is part of the PNG so screenshots remain identifiable
    // even after they are separated from the JSON recorder state.
    out.fillStyle = 'rgba(5, 15, 12, .97)';
    out.fillRect(0, imageHeight, output.width, footerHeight);
    out.fillStyle = '#9ee87f';
    out.font = `800 ${Math.max(18, Math.round(output.width / 62))}px system-ui, sans-serif`;
    out.fillText('TOADAL FEAST · F8 EVIDENCE', 24, imageHeight + 30);
    out.fillStyle = '#f3fff0';
    out.font = `600 ${Math.max(15, Math.round(output.width / 74))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const info = [
      `${context.localTime} ${context.timezone ? `(${context.timezone})` : ''} · UTC ${context.utcTime.replace('T', ' ').replace('Z', '')}`,
      context.menuLocation,
      `UI ${context.uiAuthority} · ${context.surfaceClass} · ${context.routeId} · HUD ${context.hudAuthority} · overlay ${context.overlayAuthority} · theme ${context.themeId}`,
      `${context.viewport.width}×${context.viewport.height} @${context.viewport.dpr}x · ${context.page}${context.release ? ` · ${context.release}` : ''}`,
    ];
    let y = imageHeight + 58;
    for (const row of info) {
      for (const line of wrapLines(out, row, output.width - 48)) {
        out.fillText(line, 24, y);
        y += 24;
        if (y > output.height - 12) break;
      }
    }
    return output;
  }

  function buildUnsupportedGameplayEvidenceCanvas(context, error) {
    const reason = lastEvidenceError || text(error?.message || error || 'GAMEPLAY_EVIDENCE_UNSUPPORTED', 160);
    const output = buildEvidenceCanvas(context, { forceDomLayout: true });
    const out = output.getContext('2d');
    const bannerHeight = Math.max(92, Math.round(output.width * 0.13));
    out.fillStyle = 'rgba(5, 15, 12, .98)';
    out.fillRect(0, 0, output.width, bannerHeight);
    out.strokeStyle = 'rgba(255, 221, 100, .92)';
    out.lineWidth = 3;
    out.strokeRect(2, 2, output.width - 4, bannerHeight - 4);
    out.fillStyle = '#ffe98a';
    out.font = `800 ${Math.max(21, Math.round(output.width / 28))}px system-ui, sans-serif`;
    out.fillText('F8 GAMEPLAY EVIDENCE UNSUPPORTED', 24, 38, output.width - 48);
    out.fillStyle = '#f3fff0';
    out.font = `700 ${Math.max(14, Math.round(output.width / 55))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    out.fillText(`${reason} · use paired raw Chromium authority`, 24, 70, output.width - 48);
    lastEvidenceKind = 'unsupported-gameplay';
    lastEvidenceError = reason;
    return output;
  }

  async function captureEvidence() {
    const context = readContext();
    const date = new Date(context.utcTime);
    const modePart = context.mode.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    const surfacePart = context.surface.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    const identityPart = context.levelId || context.orderId || (Number.isFinite(context.arcadeLevel) ? `level-${context.arcadeLevel}` : '');
    const base = `FroggyFeast_F8_${filenameTimestamp(date)}_${modePart}_${surfacePart}${identityPart ? `_${identityPart}` : ''}`;
    const filename = `${base}.png`;
    let evidence = null;
    try { evidence = await buildExactDomEvidenceCanvas(context); }
    catch (error) { addBreadcrumb('exact-dom-evidence-fallback', { message: text(error?.message || error, 120) }); }
    if (!evidence) {
      try { evidence = buildEvidenceCanvas(context); }
      catch (error) {
        if (lastEvidenceKind !== 'unsupported-gameplay') throw error;
        evidence = buildUnsupportedGameplayEvidenceCanvas(context, error);
      }
    }
    const blob = await new Promise(resolve => evidence.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Evidence canvas could not be encoded as PNG.');
    const capture = recordCapture(context, filename);
    downloadBlob(blob, filename);
    addBreadcrumb('evidence-captured', { captureId: capture.id, filename });
    toast(`F8 evidence saved · ${context.menuLocation}`);
    return capture;
  }

  function buildLatestCapsule() {
    const store = readStore();
    const capture = latestCapture || store.captures[0] || null;
    return {
      schema: 'froggy-feast-bug-capsule@1',
      exportedAt: new Date().toISOString(),
      sessionId,
      capture,
      issues: store.issues.slice(0, 10),
      currentContext: readContext(),
      breadcrumbs: breadcrumbs.slice(-MAX_ISSUE_BREADCRUMBS),
    };
  }

  function debugEvidenceDataUrl() {
    try { return buildEvidenceCanvas(readContext()).toDataURL('image/png'); }
    catch (_) { return null; }
  }

  async function debugEvidenceDataUrlAsync() {
    const context = readContext();
    try { const exact=await buildExactDomEvidenceCanvas(context);return (exact||buildEvidenceCanvas(context)).toDataURL('image/png'); }
    catch (error) {
      if (lastEvidenceKind === 'unsupported-gameplay') {
        try { return buildUnsupportedGameplayEvidenceCanvas(context, error).toDataURL('image/png'); }
        catch (_) {}
      }
      lastEvidenceError=String(error?.stack||error?.message||error||'unknown evidence error');return null;
    }
  }

  function exportLatestCapsule() {
    const capsule = buildLatestCapsule();
    const context = capsule.capture?.context || capsule.currentContext;
    const filename = `FroggyFeast_BugCapsule_${filenameTimestamp(new Date())}_${context.mode.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}.json`;
    const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename);
    toast(`Bug capsule exported · ${context.menuLocation}`);
    return capsule;
  }

  function contextLocationCheck() {
    const context = readContext();
    const key = `${context.menuLocation}|${context.visibleUi.join(',')}|${context.page}`;
    if (latestLocationKey && key !== latestLocationKey) addBreadcrumb('location-changed', { to: context.menuLocation, visibleUi: context.visibleUi });
    latestLocationKey = key;
  }

  function bindEventBus() {
    if (eventBusBound) return true;
    let bus = null;
    try { bus = typeof EventBus !== 'undefined' ? EventBus : globalThis.EventBus; } catch (_) {}
    if (!bus || typeof bus.on !== 'function') return false;
    IMPORTANT_EVENTS.forEach(eventName => {
      try { bus.on(eventName, payload => addBreadcrumb(eventName, payload)); } catch (_) {}
    });
    eventBusBound = true;
    return true;
  }

  function handleClick(event) {
    const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"],[data-action],[data-standalone-action]') : null;
    if (!target) return;
    addBreadcrumb('ui-action', {
      id: target.id || null,
      action: target.getAttribute('data-action') || target.getAttribute('data-standalone-action') || null,
      mode: target.getAttribute('data-mode') || target.getAttribute('data-arcade-mode') || null,
      label: text(target.getAttribute('aria-label') || target.textContent || '', 90),
    });
  }

  function handleKey(event) {
    const key = String(event.key || '');
    if (key === 'F8') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.shiftKey) {
        exportLatestCapsule();
      } else {
        captureEvidence().catch(error => {
          recordIssue({ kind: 'evidence-capture-failed', message: error?.message || error, stack: error?.stack });
          toast(`F8 capture failed · ${text(error?.message || error, 120)}`);
        });
      }
      return;
    }
    if (['Escape', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F2'].includes(key)) {
      addBreadcrumb('key-action', { key });
    }
  }

  function bindErrors() {
    window.addEventListener('froggy:error', event => recordIssue(event.detail || { kind: 'froggy-error' }));
    window.addEventListener('error', event => {
      const target = event.target;
      if (!target || target === window) return;
      const tag = target.tagName?.toLowerCase?.() || 'resource';
      const src = target.currentSrc || target.src || target.href || '';
      recordIssue({ kind: 'resource-load-error', message: `${tag} failed to load`, filename: text(src, 320) });
    }, true);
  }

  function recordFeastfallTrace(detail) {
    return addBreadcrumb('feastfall-trace', detail);
  }

  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    breadcrumbs.length = 0;
    latestCapture = null;
    toast('Bug recorder cleared.');
  }

  function snapshot() {
    return {
      schema: SCHEMA,
      sessionId,
      context: readContext(),
      breadcrumbs: breadcrumbs.slice(),
      persisted: readStore(),
    };
  }

  function init() {
    if (initialized || typeof document === 'undefined') return api;
    initialized = true;
    bindErrors();
    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('click', handleClick, true);
    const boot = () => {
      latestLocationKey = `${readContext().menuLocation}|${visibleUiIds().join(',')}|${location.pathname}${location.search}${location.hash}`;
      bindEventBus();
      // Some standalone EventBus definitions load later than this platform file.
      setTimeout(bindEventBus, 0);
      setTimeout(bindEventBus, 250);
      contextTimer = window.setInterval(() => {
        if (!eventBusBound) bindEventBus();
        contextLocationCheck();
      }, CONTEXT_POLL_MS);
      addBreadcrumb('recorder-ready', { hotkey: 'F8', exportHotkey: 'Shift+F8' });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
    return api;
  }

  function destroy() {
    if (!initialized) return;
    initialized = false;
    document.removeEventListener('keydown', handleKey, true);
    document.removeEventListener('click', handleClick, true);
    if (contextTimer) clearInterval(contextTimer);
    contextTimer = 0;
  }

  const api = Object.freeze({
    init, destroy, captureEvidence, exportLatestCapsule, buildLatestCapsule, debugEvidenceDataUrl, debugEvidenceDataUrlAsync,
    record: addBreadcrumb, recordIssue, recordFeastfallTrace, readContext, snapshot, clear,
    get storageKey() { return STORAGE_KEY; },
    get sessionId() { return sessionId; },
    get evidenceKind() { return lastEvidenceKind; },
    get evidenceError() { return lastEvidenceError; },
  });
  return api;
})();

if (typeof globalThis !== 'undefined') globalThis.FroggyBugRecorder = FroggyBugRecorder;
FroggyBugRecorder.init();
