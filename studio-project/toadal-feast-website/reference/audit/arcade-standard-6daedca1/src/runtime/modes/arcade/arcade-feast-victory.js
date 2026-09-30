// ============================================================
// arcade-feast-victory.js — Standard Arcade Feast Goal + Encore
// ============================================================
// Owns only the run-level victory checkpoint. It does not change scoring,
// collision, spawn rules, difficulty, rewards, or save schemas.

const ArcadeFeastVictory = (() => {
  const GOAL_WAVE = 10;
  const state = {
    victorySecured: false,
    awaitingChoice: false,
    encoreActive: false,
    checkpointScore: 0,
    checkpointWave: 0,
    characterId: 'classic',
  };

  function safeInteger(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
  }

  function reset() {
    state.victorySecured = false;
    state.awaitingChoice = false;
    state.encoreActive = false;
    state.checkpointScore = 0;
    state.checkpointWave = 0;
    state.characterId = 'classic';
  }

  function snapshot() {
    return Object.freeze({
      goalWave: GOAL_WAVE,
      victorySecured: state.victorySecured,
      awaitingChoice: state.awaitingChoice,
      encoreActive: state.encoreActive,
      checkpointScore: state.checkpointScore,
      checkpointWave: state.checkpointWave,
      characterId: state.characterId,
    });
  }

  function eligibleForCheckpoint() {
    return GameState.currentMode === 'standard'
      && GameState.mode === GAME_MODES.PLAYING
      && GameState.level === GOAL_WAVE
      && !state.victorySecured
      && !state.awaitingChoice;
  }

  // Called only after the normal Wave 10 clear transition has drained. Returning
  // true prevents advanceToNextLevel() until the player chooses Finish or Encore.
  function interceptBeforeAdvance() {
    if (!eligibleForCheckpoint()) return false;

    state.victorySecured = true;
    state.awaitingChoice = true;
    state.checkpointScore = safeInteger(GameState.score);
    state.checkpointWave = safeInteger(GameState.level, GOAL_WAVE);
    state.characterId = String(typeof getCharDef === 'function' ? getCharDef()?.id || 'classic' : GameState.selectedCharacterId || 'classic');

    const runRules = typeof ArcadeRunRules !== 'undefined'
      ? ArcadeRunRules.snapshot()
      : { mode:'standard', ruleset:'legacy', label:'Legacy', key:'standard:legacy' };
    const previousBestScore = safeInteger(typeof ArcadeRunRules !== 'undefined'
      ? ArcadeRunRules.bestFor(SaveManager.get(), runRules)
      : (typeof SaveManager !== 'undefined' ? SaveManager.get()?.bestScore : 0));
    const payload = Object.freeze({
      score: state.checkpointScore,
      level: state.checkpointWave,
      previousBestScore,
      charId: state.characterId,
      mode: 'standard',
      ruleset:runRules.ruleset,
      rulesetLabel:runRules.label,
      rulesetKey:runRules.key,
      feastVictory: true,
      feastGoalWave: GOAL_WAVE,
      checkpoint: true,
    });

    if (typeof pauseGame === 'function') pauseGame();
    else if (typeof SceneManager !== 'undefined') SceneManager.go(GAME_MODES.PAUSED);

    EventBus?.emit?.('feastVictoryCheckpoint', payload);

    // Fail open rather than leaving the player in a visually unexplained pause.
    // The standalone result surface owns the Finish/Encore choice; if it fails
    // to appear for any reason, resume into Encore automatically.
    window.setTimeout(() => {
      if (!state.awaitingChoice) return;
      const resultOverlay = document.getElementById('arcadeResultOverlay');
      const unifiedOverlay = document.getElementById('arcadeCheckpointOverlay');
      const visible = Boolean(
        globalThis.ArcadeCheckpointUI?.visible
        || (resultOverlay && !resultOverlay.hidden && !resultOverlay.classList.contains('hidden'))
        || (unifiedOverlay && !unifiedOverlay.hidden && !unifiedOverlay.classList.contains('hidden'))
      );
      if (visible) return;
      console.error('[ArcadeFeastVictory] Feast checkpoint UI did not become visible; automatically continuing to Encore.');
      continueToEncore();
    }, 350);
    return true;
  }

  function continueToEncore() {
    if (!state.victorySecured || !state.awaitingChoice) return false;
    state.awaitingChoice = false;
    state.encoreActive = true;
    EventBus?.emit?.('encoreStarted', snapshot());
    if (typeof resumeGame === 'function') resumeGame();
    return true;
  }

  function finishVictorious() {
    if (!state.victorySecured || !state.awaitingChoice) return false;
    state.awaitingChoice = false;
    EventBus?.emit?.('feastVictoryFinishRequested', snapshot());
    if (typeof triggerGameOver === 'function') {
      triggerGameOver(
        'Feast Complete!',
        `Wave ${GOAL_WAVE} cleared. Victory secured!`,
        'feast-victory',
        true,
        {
          feastVictory: true,
          encoreActive: false,
          feastGoalWave: GOAL_WAVE,
          victoryChoice: 'finish',
        },
      );
    }
    return true;
  }

  function decorateGameOverPayload(payload = {}, overrides = {}) {
    const victorySecured = overrides.feastVictory === true || state.victorySecured || payload.feastVictory === true;
    const encoreActive = overrides.encoreActive === true || state.encoreActive || payload.encoreActive === true;
    return {
      ...payload,
      feastVictory: victorySecured,
      encoreActive,
      feastGoalWave: safeInteger(overrides.feastGoalWave, victorySecured ? GOAL_WAVE : 0),
      feastCheckpointScore: victorySecured ? state.checkpointScore : 0,
      victoryChoice: String(overrides.victoryChoice || payload.victoryChoice || (encoreActive ? 'encore' : '')),
    };
  }

  function bind() {
    if (typeof EventBus === 'undefined') return;
    EventBus.on('gameStarted', reset);
    EventBus.on('gameOver', () => { state.awaitingChoice = false; });
  }

  bind();

  return Object.freeze({
    GOAL_WAVE,
    interceptBeforeAdvance,
    continueToEncore,
    finishVictorious,
    decorateGameOverPayload,
    snapshot,
    reset,
    isVictorySecured: () => state.victorySecured,
    isAwaitingChoice: () => state.awaitingChoice,
    isEncoreActive: () => state.encoreActive,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeFeastVictory = ArcadeFeastVictory;
