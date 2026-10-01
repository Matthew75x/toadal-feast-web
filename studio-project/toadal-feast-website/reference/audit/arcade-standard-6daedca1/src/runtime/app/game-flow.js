// ============================================================
// src/runtime/app/game-flow.js — Game flow control
// getCharDef/score calc, startGame/pauseGame/resumeGame, mode unlocks, quitToMenu, triggerGameOver, handleEscape, dev mode. Split from game.js for modularity.
// ============================================================

let _charDefCacheId;
let _charDefCache = null;


function getCharDef() {
  const selectedId = typeof canonicalCharacterId === 'function'
    ? canonicalCharacterId(GameState.selectedCharacterId)
    : GameState.selectedCharacterId;
  if (selectedId !== GameState.selectedCharacterId) GameState.selectedCharacterId = selectedId;

  const forcedId = GameModeRegistry?.[GameState.currentMode]?.forcedChar || null;
  const effectiveId = forcedId || selectedId;
  const cacheId = forcedId ? `mode:${GameState.currentMode}:${effectiveId}` : effectiveId;
  if (cacheId !== _charDefCacheId) {
    _charDefCacheId = cacheId;
    _charDefCache = CHARACTER_DATA.find(c => c.id === effectiveId && c.hidden !== true)
      || CHARACTER_DATA.find(c => c.id === 'classic')
      || CHARACTER_DATA[0];
  }
  return _charDefCache;
}

function calcScorePerCatch(charDef, options = {}) {
  const base = GameState.level * GAME_BALANCE.scoring.basePointsPerLevel;
  const allowComboScoreModifiers = options.allowComboScoreModifiers !== false;
  let pts = base;

  if (charDef.stats.scoreBonus) pts += charDef.stats.scoreBonus;
  if (charDef.stats.scoreMultiplier) pts *= charDef.stats.scoreMultiplier;

  if (allowComboScoreModifiers) {
    const streakTier = Math.floor(GameState.combo / GAME_BALANCE.royal.streakTier);
    if (streakTier > 0) {
      pts += Math.min(streakTier, GAME_BALANCE.royal.multiplierMax) * base;
    }

    if (hasAbility(charDef, 'streakMultiplier')) {
      const mult = (GameState.charState.royal && GameState.charState.royal.multiplier) || 1;
      pts *= Math.max(1, mult);
    }

    if (hasAbility(charDef, 'comboScore')) {
      const comboMult = Math.min(GAME_BALANCE.pelican.comboMultMax, 1 + GameState.combo * GAME_BALANCE.pelican.comboStep);
      pts *= comboMult;
    }
  }

  pts = AbilitySystem.modify('onScoreCatch', charDef, pts, { catchSource:options.catchSource || 'direct' });
  pts = StatusEffectSystem.modify('onScoreCatch', pts, { catchSource:options.catchSource || 'direct' });

  return Math.round(pts);
}


// ── First-run Arcade coach ──────────────────────────────────────────────
// The setting already promised first-time gameplay tips but did not have a
// player-facing implementation. Keep this intentionally light: it never pauses
// a run, captures input, or changes Arcade rules. It appears only until the
// player records their first real food catch, then the save remembers that the
// basics have been seen.
const ArcadeFirstRunCoach = (() => {
  const CARD_ID = 'arcadeFirstRunCoach';
  const ARCADE_MODES = new Set(['standard', 'tc', 'fmf', 'zen']);
  const STEP_TIMEOUT_MS = 4300;
  let dismissTimer = null;
  let currentStep = 0;

  function activeArcadeRun() {
    return GameState.mode === GAME_MODES.PLAYING && ARCADE_MODES.has(GameState.currentMode);
  }

  function hintsEnabled() {
    return typeof SettingsManager === 'undefined' || SettingsManager.get('tutorialHints') !== false;
  }

  function progress() {
    const settings = SaveManager.get()?.settings;
    const legacyComplete = Boolean(settings?.tutorialProgress?.arcadeBasics);
    const source = settings?.tutorialProgress?.arcadeCoachV2;
    if (legacyComplete) return { step:3, complete:true };
    if (!source || typeof source !== 'object' || Array.isArray(source)) return { step:0, complete:false };
    return {
      step:Math.max(0, Math.min(3, Math.floor(Number(source.step) || 0))),
      complete:source.complete === true,
    };
  }

  function hasSeenBasics() { return progress().complete; }

  function remember(step, complete = false) {
    SaveManager.set(data => {
      if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) data.settings = {};
      if (!data.settings.tutorialProgress || typeof data.settings.tutorialProgress !== 'object' || Array.isArray(data.settings.tutorialProgress)) {
        data.settings.tutorialProgress = {};
      }
      const prior = data.settings.tutorialProgress.arcadeCoachV2;
      const priorStep = prior && typeof prior === 'object' ? Math.floor(Number(prior.step) || 0) : 0;
      data.settings.tutorialProgress.arcadeCoachV2 = {
        step:Math.max(priorStep, Math.max(0, Math.min(3, Math.floor(Number(step) || 0)))),
        complete:complete === true || prior?.complete === true,
      };
      if (complete) data.settings.tutorialProgress.arcadeBasics = true;
    });
  }

  function usesTouchControls() {
    return Boolean(
      (typeof navigator !== 'undefined' && Number(navigator.maxTouchPoints) > 0)
      || (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches),
    );
  }

  function remove(markComplete = false) {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    const card = document.getElementById(CARD_ID);
    if (card) card.remove();
    if (markComplete) {
      remember(3, true);
      currentStep = 3;
    }
  }

  function copyFor(step) {
    const touch = usesTouchControls();
    if (step === 1) {
      const definition = typeof getCharDef === 'function' ? getCharDef() : null;
      const behavior = definition && typeof getArcadeCharacterBehaviorProfile === 'function'
        ? getArcadeCharacterBehaviorProfile(definition)
        : null;
      const guide = behavior?.playerGuide || { movement:'Move left / right', action:'Press Space', catch:'Catch falling food' };
      let mobileLine = 'Use the stick to move · tap the game to act';
      if (touch) {
        const requirements = behavior?.mobileControlRequirements || [];
        if (requirements.includes('four-direction')) mobileLine = 'Use the stick in any direction · scoop automatically';
        else if (requirements.includes('clone-pickup') || requirements.includes('clone-place')) mobileLine = 'Use the stick to move · tap PICK UP or PLANT';
        else if (requirements.includes('hold-primary')) mobileLine = 'Use the stick to move · hold the action button';
        else if (requirements.includes('toadal-crouch-hop') || requirements.includes('toadal-tongue') || requirements.includes('toadal-throw') || requirements.includes('toadal-block')) mobileLine = 'Left stick: move · hold ↓, release to spring · TONGUE / THROW / BLOCK';
        else if (!requirements.includes('primary-action')) mobileLine = 'Use the stick to move · catching is automatic';
      }
      return {
        title:'Quick start',
        line:touch ? mobileLine : `${guide.movement} · ${guide.action}`,
        tip:`${guide.catch}. Watch for red and orange hazards.`,
      };
    }
    if (step === 2) return {
      title:'Favourite foods',
      line:'A soft character-coloured ring marks bonus food.',
      tip:'Gold sparkles mark rare treats.',
    };
    return {
      title:'Stay safe',
      line:'Red and orange warnings signal hazards.',
      tip:'Move clear early—then return to the feast.',
    };
  }

  function showStep(step, { autoAdvance = true } = {}) {
    if (!activeArcadeRun() || !hintsEnabled() || hasSeenBasics()) return false;
    const safeStep = Math.max(1, Math.min(3, Math.floor(Number(step) || 1)));
    remove(false);
    currentStep = safeStep;
    remember(safeStep, false);
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return false;
    const copy = copyFor(safeStep);
    const card = document.createElement('aside');
    card.id = CARD_ID;
    card.className = 'arcade-first-run-coach';
    // The mobile joystick intentionally owns a full-viewport hit area. Portal
    // the coach above that layer on touch devices so its dismissal remains a
    // real touch target while the desktop card stays scoped to the playfield.
    const touchPortal = usesTouchControls();
    if (touchPortal) card.classList.add('arcade-first-run-coach--touch-portal');
    card.dataset.step = String(safeStep);
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('aria-label', `${copy.title}. ${copy.line} ${copy.tip}`);
    card.innerHTML =
      `<strong class="arcade-first-run-coach__title">${copy.title}</strong>` +
      `<span class="arcade-first-run-coach__line">${copy.line}</span>` +
      `<span class="arcade-first-run-coach__line arcade-first-run-coach__line--tip">${copy.tip}</span>` +
      '<button type="button" class="arcade-first-run-coach__skip" aria-label="Dismiss quick-start tip">Got it</button>';
    card.querySelector('button')?.addEventListener('click', event => {
      event.stopPropagation();
      remove(true);
    });
    (touchPortal ? document.body : wrapper).appendChild(card);
    const mobileHint = document.getElementById('mobAbilityHint');
    document.getElementById('mobileControls')?.classList.remove('mobile-controls--hint-visible');
    if (mobileHint) mobileHint.hidden = true;
    requestAnimationFrame(() => card.classList.add('is-visible'));
    if (autoAdvance && safeStep > 1) {
      dismissTimer = setTimeout(() => {
        if (safeStep === 2 && activeArcadeRun()) showStep(3);
        else remove(true);
      }, STEP_TIMEOUT_MS);
    } else if (safeStep === 1) {
      dismissTimer = setTimeout(() => remove(false), 4200);
    }
    return true;
  }

  function queueForRun() {
    remove(false);
    const saved = progress();
    if (saved.complete) return;
    const step = Math.max(1, Math.min(3, saved.step || 1));
    setTimeout(() => showStep(step), 140);
  }

  EventBus.on('gameStarted', queueForRun);
  EventBus.on('foodCaught', payload => {
    if (!activeArcadeRun() || hasSeenBasics()) return;
    if (currentStep <= 1) {
      showStep(2);
      return;
    }
    if (currentStep === 2 && Number(payload?.affinityBonus || 0) > 0) showStep(3);
  });
  EventBus.on('playerDamaged', payload => {
    if (!activeArcadeRun() || hasSeenBasics()) return;
    const source = String(payload?.source || '');
    if (currentStep === 2 && (source.startsWith('hazard:') || source === 'sun')) showStep(3);
  });
  EventBus.on('gameOver', () => remove(false));
  EventBus.on('settingChanged', ({ key, value } = {}) => {
    if (key === 'tutorialHints' && value === false) remove(false);
  });

  return Object.freeze({
    show:() => showStep(Math.max(1, progress().step || 1)),
    showStep,
    remove,
    hasSeenBasics,
    isVisible: () => Boolean(document.getElementById(CARD_ID)?.classList.contains('is-visible')),
  });
})();

let _arcadeStartPending = false;

async function startGame(modeId = 'standard', options = {}) {
  // A delayed menu event must not reset an active or paused run. The pending
  // guard also prevents double-clicks while the small essential asset set loads.
  if (_arcadeStartPending || GameState.mode === GAME_MODES.PLAYING || GameState.mode === GAME_MODES.PAUSED) return false;
  InputManager?.clearTransientInput?.();

  // Unknown ids can arrive from stale UI state or future content changes.
  // Fall back to the known default instead of leaving currentMode invalid.
  if (!GameModeRegistry[modeId]) modeId = 'standard';

  // The website preview host may expose its explicitly allowlisted sampler
  // modes without touching canonical mobile unlock progression. This adapter
  // exists only in the isolated WO-003 cartridge; the authoritative donor
  // retains the ordinary progression gate.
  const webPreviewModeAllowed = Boolean(globalThis.ToadalArcadePreview?.allowsExperience?.(modeId));
  if (!webPreviewModeAllowed && !isModeUnlocked(modeId)) {
    handleModeButtonClick(modeId); // shows tooltip
    return false;
  }

  _arcadeStartPending = true;
  try {
    const forcedCharacter = GameModeRegistry?.[modeId]?.forcedChar || null;
    const preloadCharacterId = forcedCharacter || GameState.selectedCharacterId || 'classic';
    if (typeof ArcadeRunStartGate !== 'undefined') {
      await ArcadeRunStartGate.prepare(modeId, preloadCharacterId, { showOverlay: options.showStartGate !== false });
    }
  } finally {
    _arcadeStartPending = false;
  }
  // The player may have navigated away while the capped readiness gate ran.
  if (GameState.mode === GAME_MODES.PLAYING || GameState.mode === GAME_MODES.PAUSED) return false;

  if (typeof puzzleHideAllControls === 'function') puzzleHideAllControls();
  canvas.style.pointerEvents = 'auto';
  document.getElementById('canvasWrapper').classList.add('active');
  globalThis.FroggyUIAuthority?.setHudAuthority?.('arcade-canvas-v2');
  document.body.classList.remove('menu-open');
  // Show on-screen controls on touch devices (or if forced via tweak)
  const _isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (_isTouch || (typeof TWEAK !== 'undefined' && TWEAK.showMobileControls)) {
    const mc = document.getElementById('mobileControls');
    if (mc) mc.classList.add('visible');
  }

  const modeConfig = GameModeRegistry[modeId] || GameModeRegistry.standard;
  GameState.currentMode = modeId;
  if (typeof ArcadeRunRules !== 'undefined') ArcadeRunRules.beginRun(modeId);
  modeConfig.init();
  if (typeof applyTweaks === 'function') applyTweaks();

  const effectiveCharDef = getCharDef();
  if (typeof AssetManager !== 'undefined') {
    AssetManager.preloadForRun(modeId, effectiveCharDef.id);
  }
  if (effectiveCharDef?.stats) GameState.runtimeStats = structuredClone(effectiveCharDef.stats);

  GameState.score = 0; GameState.level = 1; GameState.combo = 0;
  { const _cd = effectiveCharDef || {};
    GameState.lives = (_cd.stats && _cd.stats.startLives) || GAME_BALANCE.lives.defaultStart;
    GameState.maxLives = (_cd.stats && _cd.stats.maxLives) || GAME_BALANCE.lives.defaultMax; }

  frog.x = CONFIG.CANVAS_W/2; frog.y = CONFIG.CANVAS_H-80; frog.mouthOpen=0; frog.isMoving=false; frog.moveDir=0; frog.facing=1; frog.moveY=0; frog.stepCycle=0;
  if (typeof resetTongueAttackState === 'function') resetTongueAttackState();
  else tongue.active = false;
  entities = { foods:[], particles:[], floatingTexts:[] };
  RuntimeState.heartSpawned = false; RuntimeState.lastHeartLevel = 0; RuntimeState.shakeTime = 0; RuntimeState.ghostTime = 0;
  ProgressionState.currentLevel = 0;
  ProgressionState.foodsEaten = 0;
  ProgressionState.foodCarryover = 0;
  ProgressionState.heartsSpawnedThisLevel = 0;
  ProgressionState.transitioning = false;
  ProgressionState.transitionTimer = 0;
  GameState.charState = structuredClone(DEFAULT_CHAR_STATE);
  resetLiveStats();
  GameState.charState.royal.belly      = 0;
  GameState.charState.royal.streak     = 0;
  GameState.charState.royal.multiplier = 1;
  GameState.charState.ninja.jumping    = false;
  GameState.charState.ninja.jumpCatchBonus = 0;
  {
    const pelican = GameState.charState.pelican;
    const flight = GAME_BALANCE.pelican.flight;
    pelican.y = Number(flight.spawnY || CONFIG.CANVAS_H - 170);
    pelican.flightVx = 0; pelican.flightVy = 0;
    pelican.grounded = false; pelican.flightMode = 'airborne';
    pelican.facingSign = 1; pelican.facingFrom = 1; pelican.facingTo = 1;
    pelican.facingBlendStartedAt = 0; pelican.bank = 0;
    pelican.catchAnimUntil = 0; pelican.rareAnimUntil = 0;
  }

  modeConfig.onStart();

  SpawnManager.reset();
  SpawnManager.applyWaveConfig();
  DDAManager.reset();
  StatusEffectSystem.clear();

  SceneManager.go(GAME_MODES.PLAYING);
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  rafId = requestAnimationFrame(gameLoop);
  // Stable per-run identity for the terminal score->Gold conversion. Minted at
  // run start and snapshotted into the gameOver payload so a duplicate/replayed
  // gameOver settles exactly once through the EconomyLedger (see progression.js
  // convertScoreToCoins). A new run mints a fresh id and pays independently.
  if (typeof GameState !== 'undefined') {
    GameState.arcadeRunId = 'arcade-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
  }
  EventBus.emit('gameStarted');
  return true;
}

function pauseGame() {
  if (GameState.mode !== GAME_MODES.PLAYING) return;
  InputManager?.clearTransientInput?.();
  AudioManager.pause();
  GameClock.pause();
  if (typeof ArcadeAnimationClock !== 'undefined') ArcadeAnimationClock.pause();
  SceneManager.go(GAME_MODES.PAUSED);
  // Announce pause so shell surfaces (mobile controls, HUD chrome) can stand
  // down; main-boot has listened for this event since the pause panel shipped.
  EventBus.emit('gamePaused', {});
}

function resumeGame() {
  if (GameState.mode !== GAME_MODES.PAUSED) return;
  AudioManager.resume();
  GameClock.resume();
  if (typeof ArcadeAnimationClock !== 'undefined') ArcadeAnimationClock.resume();
  RuntimeState.lastTime = performance.now();
  if (typeof ArcadeFrameGovernor !== 'undefined') ArcadeFrameGovernor.reset(RuntimeState.lastTime);
  SceneManager.go(GAME_MODES.PLAYING);
  EventBus.emit('gameResumed', {});
}

// ── Progressive Game Mode Unlocks ────────────────────────────────────────

function isModeUnlocked(modeId) {
  if (typeof ModeAccess !== 'undefined' && typeof ModeAccess.isUnlocked === 'function') {
    return ModeAccess.isUnlocked(modeId);
  }
  if (modeId === 'standard') return true;
  const unlocks = GAME_BALANCE.modeUnlocks;
  if (!unlocks || !(modeId in unlocks)) return true;
  return (SaveManager.get().bestScore || 0) >= unlocks[modeId];
}

function handleModeButtonClick(modeId) {
  AudioManager.click();
  if (isModeUnlocked(modeId)) {
    startGame(modeId);
    return;
  }
  const access = typeof ModeAccess !== 'undefined' && typeof ModeAccess.notifyLocked === 'function'
    ? ModeAccess.notifyLocked(modeId)
    : null;
  const threshold = Number(GAME_BALANCE?.modeUnlocks?.[modeId]) || 0;
  const best = Math.max(0, Number(SaveManager.get().bestScore) || 0);
  const existing = document.getElementById('modeLockTooltip');
  if (existing) existing.remove();
  const tip = document.createElement('div');
  tip.id = 'modeLockTooltip';
  tip.style.cssText =
    'position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 160px);' +
    'left:50%;transform:translateX(-50%);' +
    'background:rgba(10,18,10,0.95);border:1px solid rgba(255,215,0,0.3);' +
    'color:var(--color-gold,#ffd700);font-family:var(--font-body);font-size:13px;' +
    'padding:10px 18px;border-radius:12px;z-index:100;text-align:center;' +
    'max-width:min(300px,88vw);pointer-events:none;';
  if (access?.requirement) {
    const progress = access.progress?.routes?.length
      ? access.progress.routes.map(route => `${route.current}/${route.target}`).join(' · ')
      : access.progress && Number.isFinite(access.progress.current) && Number.isFinite(access.progress.target)
        ? `${access.progress.current}/${access.progress.target}`
        : '';
    tip.textContent = access.unlocked
      ? `${access.label || modeId} is ready.`
      : `Locked: ${access.requirement}${progress ? ` · ${progress}` : ''}`;
  } else {
    const needed = Math.max(0, threshold - best);
    tip.textContent = 'Locked: score ' + threshold.toLocaleString() + ' pts to unlock (' + needed.toLocaleString() + ' more needed)';
  }
  document.body.appendChild(tip);
  _safeTimeout(() => { if (tip.parentNode) tip.remove(); }, 2200);
}

function refreshModeButtons() {
  const best = SaveManager.get().bestScore || 0;
  const buttonByMode = {
    tc: '.menu-btn-tc',
    fmf: '.menu-btn-fmf',
    zen: '.menu-btn-zen',
    'feastfall-challenge': '#btnFeastfallChallenge',
    infinite: '#btnInfinite',
  };
  Object.entries(buttonByMode).forEach(([modeId, selector]) => {
    const access = typeof ModeAccess !== 'undefined' && typeof ModeAccess.status === 'function'
      ? ModeAccess.status(modeId)
      : null;
    const threshold = Number(GAME_BALANCE?.modeUnlocks?.[modeId]) || 0;
    const unlocked = access ? access.unlocked === true : (threshold <= 0 || best >= threshold);
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.classList.toggle('is-locked', !unlocked);
    btn.dataset.modeAccess = unlocked ? 'unlocked' : 'locked';
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    const baseAria = btn.dataset.baseAriaLabel || btn.getAttribute('aria-label') || modeId;
    if (!btn.dataset.baseAriaLabel) btn.dataset.baseAriaLabel = baseAria;
    btn.setAttribute('aria-label', unlocked
      ? baseAria
      : `${baseAria}. ${access?.requirement || `Locked until ${threshold.toLocaleString()} points.`}`);
    if (unlocked) {
      btn.style.opacity = '';
      btn.style.filter  = '';
      const lockEl = btn.querySelector('.mode-lock-label');
      if (lockEl) lockEl.remove();
    } else {
      // Keep the approved artwork readable.  A compact lock pill communicates
      // progression without washing the entire illustration into grey.
      btn.style.opacity = '';
      btn.style.filter  = '';
      if (!btn.querySelector('.mode-lock-label')) {
        const lock = document.createElement('div');
        lock.className = 'mode-lock-label';
        const progress = access?.progress?.routes?.length
          ? access.progress.routes.map(route => `${route.current}/${route.target}`).join(' · ')
          : access?.progress && Number.isFinite(access.progress.current) && Number.isFinite(access.progress.target)
            ? `${access.progress.current}/${access.progress.target}`
            : '';
        lock.textContent = access?.requirement
          ? `Locked · ${access.requirement}${progress ? ` · ${progress}` : ''}`
          : 'Locked · ' + threshold.toLocaleString() + ' pts';
        btn.appendChild(lock);
      }
    }
  });
}

function quitToMenu(returnFocusMode = 'standard') {
  // Premium Feastfall owns canvas-hiding classes only while its board is live.
  // Clear them at the shared menu boundary rather than waiting for its idle
  // presentation probe; otherwise another mode can inherit a hidden canvas.
  document.documentElement?.classList?.remove('feastfall-premium-preboot');
  document.body?.classList?.remove('feastfall-premium-active');
  // Leaving a live Arcade run is a cash-out, not a forfeiture. Route the player
  // through the normal result pipeline so score, best-score history and Froggy
  // Gold conversion are visibly banked before returning to the menu.
  if ((GameState.mode === GAME_MODES.PLAYING || GameState.mode === GAME_MODES.PAUSED) && Math.max(0, Number(GameState.score)||0) > 0) {
    triggerGameOver('RUN BANKED!', 'Your score is saved and converted to Froggy Gold.', 'cashout', true, { voluntaryQuit:true, bankedEarly:true });
    return;
  }
  return teardownToMainMenu(returnFocusMode);
}

function teardownToMainMenu(returnFocusMode = 'standard') {
  // Lifecycle owners call this teardown primitive directly after any required
  // settlement. It never starts result presentation.
  document.documentElement?.classList?.remove('feastfall-premium-preboot');
  document.body?.classList?.remove('feastfall-premium-active');
  ArcadeFirstRunCoach.remove(false);
  if (typeof ArcadeRunRules !== 'undefined') ArcadeRunRules.endRun();
  if (typeof ArcadeEatingFinish !== 'undefined') ArcadeEatingFinish.clear();
  if (typeof LivingFeastBackgroundRenderer !== 'undefined') LivingFeastBackgroundRenderer.reset();
  if (typeof ArcadeReactionArt !== 'undefined') ArcadeReactionArt.clearAll();
  if (typeof RewardCoinCelebration !== 'undefined') RewardCoinCelebration.stopAll();
  InputManager?.clearTransientInput?.();
  // Returning to the shared menu is an audio lifecycle boundary too. This
  // keeps Arcade, Feastfall, and Infinite from leaving a running audio context
  // after an in-run Quit; their next normal start resumes it through init().
  AudioManager?.pause?.();
  // Direct click listeners can pass an event object; mode hosts pass a mode id.
  const normalizedFocusMode = typeof returnFocusMode === 'string' ? returnFocusMode : 'standard';
  if (typeof puzzleHideAllControls === 'function') puzzleHideAllControls();
  canvas.style.pointerEvents = 'none';
  document.getElementById('canvasWrapper').classList.remove('active');
  globalThis.FroggyUIAuthority?.clearHudAuthority?.();
  document.body.classList.add('menu-open');
  const mc = document.getElementById('mobileControls');
  if (mc) mc.classList.remove('visible');
  // InputManager.clearTransientInput() above clears every desktop, touch,
  // and virtual movement key, including Pelican up/down controls.
  // Every main-menu readout repaints from its own source; the Best pill no
  // longer needs a bespoke write here (it had three copies).
  if (typeof FroggyHud !== 'undefined') FroggyHud.refresh();
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (typeof ArcadeAnimationClock !== 'undefined') ArcadeAnimationClock.pause();
  _clearAllTimers();
  entities = { foods:[], particles:[], floatingTexts:[] };
  if (typeof resetTongueAttackState === 'function') resetTongueAttackState();
  else tongue.active = false;
  StatusEffectSystem.clear();
  EventBus.emit('arcadeRunEnded', { reason:'menu-teardown', mode:GameState.currentMode });
  hidePanels();
  SceneManager.go(GAME_MODES.MENU);
  if (typeof focusMainMenuMode === 'function') focusMainMenuMode(normalizedFocusMode);
  refreshModeButtons();
  globalThis.FroggyModeLifecycle?.noteMenuReturn?.(normalizedFocusMode);
}

function settleArcadeRun(title, sub, badge='default', force=false, outcomeContext={}, settlementOptions={}) {
  if (!force && GameState.lives > 0 && !GAME_BALANCE.invincible) return null;
  if (GameState.mode === GAME_MODES.DEAD) return null;
  InputManager?.clearTransientInput?.();

  // Unified Revenge Challenge participation is owned by
  // ArcadeRevengeChallenges. Keep the legacy score-streak flag disabled so a
  // single run cannot receive two different Revenge rewards.
  const revengeRunState = typeof ArcadeRevengeChallenges !== 'undefined'
    ? ArcadeRevengeChallenges.snapshotRunState()
    : null;
  const wasRevengeChallenge = revengeRunState?.participating === true;
  isRevengeRun = false;

  canvas.style.pointerEvents = 'none';
  const mc = document.getElementById('mobileControls');
  if (mc) mc.classList.remove('visible');
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  _clearAllTimers();
  
  const finalScore = GameState.score;
  const finalLevel = GameState.level;
  const runRules = typeof ArcadeRunRules !== 'undefined'
    ? ArcadeRunRules.snapshot()
    : { mode:GameState.currentMode, ruleset:'legacy', label:'Legacy', key:`${GameState.currentMode}:legacy` };
  // Personal-best comparisons are separated by both mode and ruleset. The
  // global best remains intact for shared unlock progression.
  const prevBestScore = typeof ArcadeRunRules !== 'undefined'
    ? ArcadeRunRules.bestFor(SaveManager.get(), runRules)
    : (SaveManager.get().bestScore || 0);
  const isNewBest = finalScore > prevBestScore;
  const runInsights = typeof ArcadeRunInsights !== 'undefined'
    ? ArcadeRunInsights.finish({ badge, endCause:badge, misses:LiveStats.misses })
    : null;
  // Mark the run terminal before emitting economic/progression events so a
  // duplicate teardown or stale callback cannot settle the same run twice.
  // Explicit player results preserve the established DEAD scene transition;
  // lifecycle settlement marks the same terminal state without presenting it.
  if (settlementOptions.presentResult === true) SceneManager.go(GAME_MODES.DEAD);
  else GameState.mode = GAME_MODES.DEAD;
  addLeaderboardEntry(finalScore, runRules);
  const baseGameOverPayload = {
    score: finalScore,
    level: finalLevel,
    charId: getCharDef().id,
    mode: GameState.currentMode,
    isRevengeRun: false,
    isRevengeChallengeRun: wasRevengeChallenge,
    isNewBest,
    previousBestScore: prevBestScore,
    ruleset:runRules.ruleset,
    rulesetLabel:runRules.label,
    rulesetKey:runRules.key,
    runInsights,
    badge: String(badge || 'default'),
    endCause: String(badge || 'default'),
    voluntaryQuit: outcomeContext?.voluntaryQuit === true,
    bankedEarly: outcomeContext?.bankedEarly === true,
  };
  const gameOverPayload = typeof ArcadeFeastVictory !== 'undefined'
    ? ArcadeFeastVictory.decorateGameOverPayload(baseGameOverPayload, outcomeContext)
    : { ...baseGameOverPayload, ...outcomeContext };
  const feastOrderSummary = typeof FeastOrdersManager !== 'undefined'
    ? FeastOrdersManager.getResultSummary(gameOverPayload)
    : null;
  const revengeSummary = typeof ArcadeRevengeChallenges !== 'undefined'
    ? ArcadeRevengeChallenges.resolveGameOver({ ...gameOverPayload, feastOrderSummary })
    : null;
  // NOTE: checkUnlocks() is an intentional no-op stub (unlocks happen via
  // ProgressionManager on the 'gameOver' event below). Call removed here to
  // avoid implying unlock logic runs at this point.
  const eventPayload = Object.freeze({
    ...gameOverPayload,
    feastOrderSummary,
    revengeSummary,
    runId: (typeof GameState !== 'undefined' ? GameState.arcadeRunId : null) || null,
  });
  EventBus.emit('gameOver', eventPayload);

  return Object.freeze({
    title,
    sub,
    badge:String(badge || 'default'),
    finalScore,
    isNewBest,
    feastOrderSummary,
    revengeSummary,
    eventPayload,
  });
}

function presentArcadeResult(settlement) {
  if (!settlement) return null;
  const hazardId = String(settlement.eventPayload?.hazardId || '').toLowerCase();
  const hazardLoss = !settlement.eventPayload?.voluntaryQuit
    && !settlement.eventPayload?.bankedEarly
    && String(settlement.eventPayload?.endCause || settlement.badge || '').toLowerCase() === 'hazard';
  const resultRevealDelay = hazardLoss ? 1200 : 350;
  // SceneManager enters DEAD immediately, but hold the card off for one beat so
  // the frozen hit and damage feedback stay visible before the result covers them.
  if (hazardLoss) document.getElementById('gameOverOverlay')?.classList.add('hidden');
  const { title, sub, badge, finalScore, isNewBest, feastOrderSummary, revengeSummary } = settlement;
  const eventPayload = settlement.eventPayload || {};
  const outcome = typeof ArcadeRunOutcomeEvaluator !== 'undefined'
    ? ArcadeRunOutcomeEvaluator.evaluate(eventPayload)
    : {};
  const lossResult = !outcome.feastVictory
    && !outcome.newHighScore
    && (outcome.tone === 'sad'
      || ['miss', 'hazard'].includes(String(eventPayload.badge || '').toLowerCase()));
  const outcomeDriven = !eventPayload.voluntaryQuit && !eventPayload.bankedEarly
    && Boolean(outcome.type && outcome.type !== 'NORMAL_RUN');
  const resultTitle = outcomeDriven
    ? outcome.headline
    : (outcome.feastVictory ? 'FEAST COMPLETE!' : lossResult ? 'GAME OVER!' : title);
  const resultSub = outcomeDriven
    ? String(outcome.subtitle || sub)
    : (outcome.feastVictory
      ? ('Wave ' + Number(eventPayload.feastGoalWave || 10) + ' cleared. Victory secured!')
      : lossResult
        ? (String(eventPayload.badge || '').toLowerCase() === 'hazard'
          ? 'A hazard ended the run. Try again!'
          : 'Run complete — try again to improve your score!')
        : sub);
  const collisionSub = hazardId === 'bomb'
    ? 'You caught a Bomb; it took your last Heart.'
    : hazardId === 'fire'
      ? 'You caught Fire; it took your last Heart.'
      : hazardId === 'caution'
        ? 'You caught a Caution hazard; it took your last Heart.'
        : 'You hit ' + String(eventPayload.hazardLabel || 'a hazard') + '; it took your last Heart.';
  const currentCharacter = getCharDef();
  // Toadal's supplied victory/loss derivatives are character-specific. Do
  // not replace another selected character's result portrait with Golden
  // Toadal; ArcadeReactionArt resolves their own art or canonical fallback.
  const isToadal = String(currentCharacter?.id || '').toLowerCase() === 'toadal';
  const customResultArt = isToadal && outcome.feastVictory
    ? 'assets/images/characters/reactions-v1/toadal/victory.png'
    : isToadal && lossResult
      ? 'assets/images/characters/reactions-v1/toadal/sad.png'
      : '';
  
  const _goBadge = document.getElementById('goEmoji');
  const _goTitle = document.getElementById('goTitle');
  const _goSub   = document.getElementById('goSub');
  const _goScore = document.getElementById('goScore');
  const _goBest  = document.getElementById('goBest');
  const _goOver  = document.getElementById('gameOverOverlay');
  if (_goOver) _goOver.dataset.resultTone = outcome.feastVictory ? 'celebrate' : lossResult ? 'sad' : '';
  if (_goOver) _goOver.dataset.resultCause = hazardLoss ? 'hazard' : '';
  
  const persist = SaveManager.get();
  if (typeof ArcadeReactionArt !== 'undefined') ArcadeReactionArt.clearAll();
  
  if (_goBadge) {
    _goBadge.textContent = '';
    _goBadge.dataset.badge = String(badge || 'default');
    _goBadge.classList.add('go-character-portrait');
    _goBadge.dataset.reactionTone = 'neutral';
    _goBadge.replaceChildren();
    if (currentCharacter?.src) {
      const portrait = document.createElement('img');
      portrait.className = 'go-character-portrait-img';
      portrait.decoding = 'async';
      _goBadge.appendChild(portrait);
      if (customResultArt) {
        portrait.src = customResultArt;
        portrait.alt = outcome.feastVictory ? 'Golden Toadal celebrating victory' : 'Golden Toadal after the loss';
        portrait.onerror = () => {
          portrait.onerror = null;
          portrait.src = currentCharacter.src;
          portrait.alt = currentCharacter.name + ' result';
        };
        _goBadge.dataset.reactionTone = outcome.feastVictory ? 'celebrate' : 'sad';
      } else if (typeof ArcadeReactionArt !== 'undefined') {
        const reactionTone = ArcadeReactionArt.toneForResult(eventPayload, outcome);
        _goBadge.dataset.reactionTone = reactionTone;
        ArcadeReactionArt.present(portrait, ArcadeReactionArt.resolve(currentCharacter.id, reactionTone));
      } else { portrait.src = currentCharacter.src; portrait.alt = currentCharacter.name + ' result'; }
    }
  }
  if (_goTitle) { _goTitle.textContent = resultTitle; _goTitle.style.color = ''; }
  if (_goSub)   _goSub.textContent   = hazardLoss ? collisionSub : resultSub;
  if (_goScore) _goScore.textContent = `Score: ${finalScore.toLocaleString()}`;
  const best = persist.bestScore || 0;
  if (_goBest)  _goBest.textContent  = isNewBest ? 'New Best Score!' : `Best: ${best.toLocaleString()}`;
  const _goFeast = document.getElementById('goFeastOrderResult');
  if (_goFeast) {
    const order = feastOrderSummary?.pinned;
    const revengeCompleted = revengeSummary?.completed;
    const revengeChallenge = revengeSummary?.offered || revengeSummary?.active || revengeSummary?.failed;
    if (revengeCompleted) {
      _goFeast.innerHTML = `<strong>Revenge Complete!</strong>Comeback challenge cleared. +${Number(revengeCompleted.rewardCoins || 0).toLocaleString()} coins`;
      _goFeast.style.display = '';
    } else if (revengeChallenge) {
      const presentation = ArcadeRevengeChallenges?.describe?.(revengeChallenge);
      _goFeast.innerHTML = `<strong>${presentation?.title || 'Revenge Challenge'}</strong>${presentation?.detail || 'Return stronger next run.'}`;
      _goFeast.style.display = '';
    } else if (order) {
      const nextIngredient = order.ingredients.find(ingredient => ingredient.progress < ingredient.target);
      _goFeast.innerHTML = order.complete
        ? `<strong>${order.title} served!</strong>Your daily reward has been collected.`
        : `<strong>${order.title}</strong>${nextIngredient ? `${nextIngredient.label}: ${nextIngredient.progress}/${nextIngredient.target}` : `${order.progressTotal}/${order.targetTotal}`}`;
      _goFeast.style.display = '';
    } else {
      _goFeast.style.display = 'none';
      _goFeast.textContent = '';
    }
  }

  if (_goOver) _safeTimeout(() => {
    _goOver.classList.remove('hidden');
    // The overlay is now measurable and visible, so the pooled shower can
    // attach to it without its lifecycle guard cancelling on a hidden host.
    if (typeof RewardCoinCelebration !== 'undefined') RewardCoinCelebration.showBanked(_goOver);

    // Unified Revenge presentation is rendered by ArcadeResultUI.

    // ── Unlock Progress Bar ─────────────────────────────────────────────
    const _block = document.getElementById('goProgressBlock');
    if (_block) {
      _block.innerHTML = '';
      const _target = getNextUnlockTarget(finalScore);

      if (_target) {
        const _pct       = Math.min(1, finalScore / _target.threshold);
        const _remaining = Math.max(0, _target.threshold - finalScore);
        const _canAfford = finalScore >= _target.threshold;
        const _nearMiss  = _remaining <= 200 && !_canAfford;

        const _label = document.createElement('div');
        _label.style.cssText = 'font-size:12px;color:var(--color-text-muted);display:flex;justify-content:space-between;align-items:center;gap:8px;';
        _label.innerHTML =
          '<span style="white-space:nowrap"><strong style="color:var(--color-text)">' + _target.name + '</strong></span>' +
          '<span style="white-space:nowrap;color:' + (_nearMiss || _canAfford ? 'var(--color-gold,#ffd700)' : 'var(--color-text-muted)') + '">' +
          (_canAfford ? 'Unlock now!' : _remaining.toLocaleString() + ' pts') + '</span>';

        const _track = document.createElement('div');
        _track.style.cssText = 'width:100%;height:8px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);';

        const _fill = document.createElement('div');
        _fill.className = 'progress-bar-fill' + (_nearMiss || _canAfford ? ' pulsing' : '');
        _fill.style.cssText = 'height:100%;border-radius:999px;transition:width 0.6s ease;background:' +
          (_canAfford ? 'var(--color-gold,#ffd700)' : 'var(--color-primary,#7edd54)') + ';width:0%;';

        _track.appendChild(_fill);
        _block.appendChild(_label);
        _block.appendChild(_track);

        // Animate after short delay so CSS transition fires
        _safeTimeout(() => { _fill.style.width = Math.round(_pct * 100) + '%'; }, 80);

        if (_nearMiss) {
          const _hint = document.createElement('div');
          _hint.style.cssText = 'font-size:11px;color:var(--color-gold,#ffd700);text-align:center;';
          _hint.textContent = 'One good run away!';
          _block.appendChild(_hint);
        }
      } else {
        const _done = document.createElement('div');
        _done.style.cssText = 'font-size:12px;color:var(--color-gold,#ffd700);text-align:center;';
        _done.textContent = 'All score milestones reached!';
        _block.appendChild(_done);
      }
    }

    // Refresh mode buttons in case this run crossed an unlock threshold
    refreshModeButtons();
  }, resultRevealDelay);
  return settlement;
}

function triggerGameOver(title, sub, badge='default', force=false, outcomeContext={}) {
  return presentArcadeResult(settleArcadeRun(title, sub, badge, force, outcomeContext, { presentResult:true }));
}

function settleArcadeRunForLifecycle() {
  const live = GameState.mode === GAME_MODES.PLAYING || GameState.mode === GAME_MODES.PAUSED;
  const scored = Math.max(0, Number(GameState.score) || 0) > 0;
  if (!live || !scored) return null;
  return settleArcadeRun(
    'RUN BANKED!',
    'Your score is saved and converted to Froggy Gold.',
    'cashout',
    true,
    { voluntaryQuit:true, bankedEarly:true },
  );
}

function handleEscape() {
  if (GameState.currentMode !== 'infinite' && GameState.currentMode !== 'puzzle' && GameState.currentMode !== 'connect3'
    && typeof ArcadeShellHost !== 'undefined' && ArcadeShellHost.handleEscape?.()) return;
  if (GameState.currentMode === 'infinite' && typeof InfiniteGameHost !== 'undefined') {
    if (InfiniteGameHost.handleEscape()) return;
  }
  // Puzzle Mode owns a dedicated Escape menu. It pauses the active attempt
  // without changing the deterministic board or returning to level select.
  if (GameState.currentMode === 'puzzle' && typeof PuzzleNextHost !== 'undefined'
    && typeof PuzzleNextHost.handleEscape === 'function' && PuzzleNextHost.handleEscape()) {
    return;
  }
  if (GameState.currentMode === 'connect3' && typeof connect3HandleEscape === 'function') {
    if (connect3HandleEscape()) return;
  }

  const panels = ['panelLeaderboard','panelCharSelect','panelAchievements','panelCosmetics','panelInstructions','panelAudio','panelSettings'];
  let anyOpen = false;
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (el && !el.classList.contains('hidden')) anyOpen = true;
  });

  if (anyOpen) {
    hidePanels();
    // A panel opened from Pause is one level above gameplay. Escape follows
    // the same contract as Back: close the panel, restore its pause opener,
    // and leave the run paused until the player explicitly resumes.
    return;
  }

  if (GameState.mode === GAME_MODES.PLAYING) {
    pauseGame();
  } else if (GameState.mode === GAME_MODES.PAUSED) {
    resumeGame();
  }
}

// Player-runtime lifecycle safety. Switching apps, locking a phone, or
// clicking browser chrome must never leave a live run consuming inputs or
// silently progressing. The run pauses once and requires an intentional Resume.
const ArcadeSessionGuard = (() => {
  let lastReason = '';
  let pauseCount = 0;

  function isPlayerRuntime() {
    return document.body?.dataset?.runtimeProfile === 'player';
  }

  function pauseForLifecycle(reason = 'focus-loss') {
    InputManager?.clearTransientInput?.();
    const hybridAdActive = globalThis.HybridEngagementEngine?.lifecycle?.isActive?.('advertisement') === true;
    if (hybridAdActive) {
      EventBus.emit('arcadeLifecyclePauseSuppressed', { reason:String(reason || 'focus-loss'), externalModal:'advertisement' });
      return false;
    }
    if (!isPlayerRuntime() || GameState.mode !== GAME_MODES.PLAYING) return false;
    lastReason = String(reason || 'focus-loss');
    pauseCount += 1;
    const opened = typeof ArcadeStandalone !== 'undefined' && typeof ArcadeStandalone.openPause === 'function'
      ? ArcadeStandalone.openPause({ reason:lastReason })
      : false;
    if (!opened && typeof pauseGame === 'function') pauseGame();
    EventBus.emit('arcadeLifecyclePaused', { reason:lastReason, count:pauseCount });
    return true;
  }

  // Interruption events arrive through the single lifecycle coordinator; this
  // guard owns only the Arcade pause POLICY, never event registration.
  if (typeof FroggyLifecycleCoordinator !== 'undefined') {
    FroggyLifecycleCoordinator.onInterruption(({ reason }) => pauseForLifecycle(reason));
    FroggyLifecycleCoordinator.onResume(() => {
      if (typeof RuntimeState !== 'undefined') RuntimeState.lastTime = performance.now();
    });
  } else {
    const onVisibilityChange = () => {
      if (document.hidden) pauseForLifecycle('hidden');
      else if (typeof RuntimeState !== 'undefined') RuntimeState.lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', () => pauseForLifecycle('blur'));
    window.addEventListener('pagehide', () => pauseForLifecycle('pagehide'));
  }

  return Object.freeze({
    pauseForLifecycle,
    snapshot:() => Object.freeze({ lastReason, pauseCount }),
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeSessionGuard = ArcadeSessionGuard;

EventBus.on('escapePressed', handleEscape);
EventBus.on('resumePressed', resumeGame);
EventBus.on('shootPressed', () => { if (GameState.mode === GAME_MODES.PLAYING) tryShootTongue(); });
EventBus.on('clonePickup',  () => { if (GameState.mode === GAME_MODES.PLAYING) tryClonePickup(); });
EventBus.on('clonePlace',   () => { if (GameState.mode === GAME_MODES.PLAYING) tryClonePlace(); });
function applyArcadeHeldAction(phase) {
  const charDef = getCharDef();
  const behavior = typeof getArcadeCharacterBehaviorProfile === 'function'
    ? getArcadeCharacterBehaviorProfile(charDef)
    : null;
  if (!behavior) return;
  const pressed = phase === 'down';
  switch (behavior.heldActionBehavior) {
    case 'hippo-lunge':
      GameState.charState.hippo.lunging = pressed;
      break;
    case 'bob-lean':
      GameState.charState.bob.leaning = pressed;
      break;
    case 'gulper-mouth':
      if (GameState.isTC) GameState.toadalConsumption.mouthClosed = pressed;
      else GameState.charState.gulper.mouthHeld = pressed;
      break;
    case 'ninja-jump':
      if (pressed && !GameState.charState.ninja.jumping) {
        GameState.charState.ninja.jumping = true;
        GameState.charState.ninja.jumpT = 0;
        GameState.charState.ninja.jumpY = frog.y;
      }
      break;
    default:
      break;
  }
}

EventBus.on('spaceDown', () => {
  if (GameState.mode === GAME_MODES.PLAYING) applyArcadeHeldAction('down');
});
EventBus.on('spaceUp', () => applyArcadeHeldAction('up'));

EventBus.on('achievementUnlocked', a => {
  FXManager.spawnFloatingText(entities, CONFIG.CANVAS_W/2, CONFIG.CANVAS_H/2 - 50, `${a.name}!`, '#ffd700');
});




EventBus.on('playerDamaged', () => {
  LiveStats.totalDamageEvents++;
  LiveStats.lastDamageTime = performance.now();
  DDAManager.recordMiss();
});
