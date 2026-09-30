// Thin event adapters. Existing mode systems own truth, timing and progression;
// this layer only decides when the shared Genie presenter may help.
(function (root) {
  'use strict';

  function bus() {
    try { if (typeof EventBus !== 'undefined') return EventBus; } catch (_) {}
    return root.EventBus || null;
  }
  function gameState() {
    try { if (typeof GameState !== 'undefined') return GameState; } catch (_) {}
    return root.GameState || null;
  }
  function currentChar() {
    try { if (typeof getCharDef === 'function') return getCharDef(); } catch (_) {}
    return null;
  }
  function guide() { return root.FeastGenieGuide; }
  function guidance() { return root.FeastGenieGuidance; }
  function step(id, overrides = {}) { return root.FeastGenieSteps?.get?.(id, overrides) || null; }
  function on(name, fn) { bus()?.on?.(name, fn); }
  function activeArcadeToadal() {
    const state = gameState();
    try {
      const playing = typeof GAME_MODES !== 'undefined' ? GAME_MODES.PLAYING : 'playing';
      return state?.mode === playing && currentChar()?.id === 'toadal';
    } catch (_) { return false; }
  }
  function toadalBasicsMastered() {
    return guidance()?.mastered?.('toadalReleasedChargedHop') === true
      && guidance()?.mastered?.('toadalUsedTongue') === true;
  }
  function presentById(id, overrides = {}, context = {}) {
    const definition = step(id, overrides);
    return definition ? guide()?.present?.(definition, context) === true : false;
  }

  const delayedGuides = new Map();
  function clearDelayedGuides() {
    for (const timer of delayedGuides.values()) clearTimeout(timer);
    delayedGuides.clear();
  }
  function scheduleGuide(id, delayMs, overrides = {}, predicate = () => true) {
    const key = String(id || '');
    if (!key) return false;
    if (delayedGuides.has(key)) clearTimeout(delayedGuides.get(key));
    const timer = setTimeout(() => {
      delayedGuides.delete(key);
      if (!activeArcadeToadal() || !predicate()) return;
      presentById(key, overrides);
    }, Math.max(0, Number(delayMs) || 0));
    delayedGuides.set(key, timer);
    return true;
  }
  function master(key) {
    if (!key) return false;
    guidance()?.markMastery?.(key);
    // complete() only closes the active guide when this mastery matches it.
    guide()?.complete?.({ mastery:key });
    return true;
  }

  on('gameStarted', () => {
    if (!activeArcadeToadal()) return;
    if (!guidance()?.mastered?.('toadalReleasedChargedHop')) {
      presentById('arcade.toadal-crouch');
      return;
    }
    if (!guidance()?.mastered?.('toadalUsedTongue')) presentById('arcade.toadal-tongue');
  });

  on('toadalCrouchStarted', () => {
    if (!activeArcadeToadal()) return;
    const state = guide()?.state?.();
    if (state?.id === 'arcade.toadal-crouch') {
      guide()?.updateActive?.({ message:'Now let go to spring!', pose:'explaining' });
      guide()?.escalate?.('hint');
    }
  });
  on('toadalChargedHopStarted', () => {
    if (!activeArcadeToadal()) return;
    master('toadalReleasedChargedHop');
    // Keep the first-run flow progressive rather than stacking two bubbles. If
    // Tongue is independently discovered first, mastery suppresses this later.
    if (!guidance()?.mastered?.('toadalUsedTongue')) {
      scheduleGuide('arcade.toadal-tongue', 10000, { minInterruptionGapMs:9000 },
        () => !guidance()?.mastered?.('toadalUsedTongue'));
    }
  });
  on('toadalTongueStarted', () => {
    if (!activeArcadeToadal()) return;
    master('toadalUsedTongue');
    if (!toadalBasicsMastered()) return;
    let charge = 0;
    try { charge = Number(root.ArcadeToadalMechanics?.snapshot?.()?.charge || 0); } catch (_) {}
    if (charge >= 100 && !guidance()?.mastered?.('toadalUsedGoldenBlock')) {
      scheduleGuide('arcade.toadal-block', 9000, { minInterruptionGapMs:8000 }, () => {
        const current = Number(root.ArcadeToadalMechanics?.snapshot?.()?.charge || 0);
        return current >= 100 && toadalBasicsMastered() && !guidance()?.mastered?.('toadalUsedGoldenBlock');
      });
    } else if (charge >= 45 && !guidance()?.mastered?.('toadalUsedGoldenThrow')) {
      scheduleGuide('arcade.toadal-throw', 9000, { minInterruptionGapMs:8000 }, () => {
        const current = Number(root.ArcadeToadalMechanics?.snapshot?.()?.charge || 0);
        return current >= 45 && toadalBasicsMastered() && !guidance()?.mastered?.('toadalUsedGoldenThrow');
      });
    }
  });
  on('toadalGoldenThrowReleased', () => { if (activeArcadeToadal()) master('toadalUsedGoldenThrow'); });
  on('toadalBlockCreated', () => { if (activeArcadeToadal()) master('toadalUsedGoldenBlock'); });
  on('toadalChargeChanged', ({ charge } = {}) => {
    const value = Number(charge);
    if (!activeArcadeToadal() || !toadalBasicsMastered() || value < 45 || guidance()?.mastered?.('toadalUsedGoldenThrow')) return;
    if (!presentById('arcade.toadal-throw', { minInterruptionGapMs:9000 })) {
      scheduleGuide('arcade.toadal-throw', 10000, { minInterruptionGapMs:9000 }, () => {
        const current = Number(root.ArcadeToadalMechanics?.snapshot?.()?.charge || 0);
        return current >= 45 && toadalBasicsMastered() && !guidance()?.mastered?.('toadalUsedGoldenThrow');
      });
    }
  });
  on('toadalChargeFull', () => {
    if (!activeArcadeToadal() || !toadalBasicsMastered() || guidance()?.mastered?.('toadalUsedGoldenBlock')) return;
    if (!presentById('arcade.toadal-block', { minInterruptionGapMs:9000 })) {
      scheduleGuide('arcade.toadal-block', 10000, { minInterruptionGapMs:9000 }, () => {
        const current = Number(root.ArcadeToadalMechanics?.snapshot?.()?.charge || 0);
        return current >= 100 && toadalBasicsMastered() && !guidance()?.mastered?.('toadalUsedGoldenBlock');
      });
    }
  });

  // Puzzle first-play teaching advances only after an accepted hop, so each
  // short tip appears beside the HUD or control it describes.
  const puzzleTutorialStepIds = Object.freeze(['puzzle.hud', 'puzzle.clues', 'puzzle.controls', 'puzzle.belly']);
  function nextPuzzleTutorialStepId() {
    if (guidance()?.mastered?.('puzzleTutorialComplete')) return null;
    return puzzleTutorialStepIds.find(id => {
      const mastery = step(id)?.mastery;
      return mastery && !guidance()?.mastered?.(mastery);
    }) || null;
  }
  function presentNextPuzzleTutorial(context = {}) {
    const id = nextPuzzleTutorialStepId();
    if (!id) {
      guidance()?.markMastery?.('puzzleTutorialComplete');
      return false;
    }
    return presentById(id, {}, context);
  }
  function advancePuzzleTutorial() {
    const currentId = nextPuzzleTutorialStepId();
    if (!currentId) return false;
    master(step(currentId)?.mastery);
    const nextId = nextPuzzleTutorialStepId();
    if (!nextId) {
      guidance()?.markMastery?.('puzzleTutorialComplete');
      return true;
    }
    return presentById(nextId);
  }

  // Current production Puzzle is puzzle-next. Its host emits the level event
  // only after the real App is created and the board exists.
  on('puzzleNextLevelStarted', ({ levelId } = {}) => {
    if (guidance()?.mastered?.('puzzleTutorialComplete')) return;
    presentNextPuzzleTutorial({ contextLevelId:levelId });
  });
  on('puzzleNextMoveCommitted', () => advancePuzzleTutorial());
  on('puzzleNextLevelComplete', () => {
    master('foundPuzzleExit');
    guide()?.dismiss?.('puzzle-level-complete');
  });

  // InfiniteFirstRunCoach owns the automatic presentation. These events only
  // record demonstrated mastery and close the matching Genie, never another one.
  on('infiniteRecruitPlaced', () => master('infiniteRecruitPlaced'));
  on('infiniteFrogAssigned', () => master('infiniteFrogAssigned'));
  on('infinitePlotReclaimed', () => master('infinitePlotReclaimed'));
  on('infiniteCellExplored', () => master('infiniteCellExplored'));
  on('settingChanged', ({ key, value } = {}) => {
    if ((key === 'tutorialHints' && value === false) || (key === 'feastGeniePreference' && value === 'off')) {
      clearDelayedGuides();
      guide()?.dismiss?.('settings-off');
    }
  });

  // One-shell mode changes must never leave a tutorial card from the previous
  // mode floating over the new surface.  Mode-owned progression remains intact.
  root.FroggyModeLifecycle?.subscribe?.(event => {
    if (event?.type === 'switching' || event?.type === 'menu' || event?.type === 'error') {
      clearDelayedGuides();
      guide()?.dismiss?.('mode-change');
      // A new mode session gets a fresh deterministic speaker assignment while
      // every short sequence remains stable for its own lifetime.
      guide()?.resetSequenceSpeakers?.();
    }
  });
  on('arcadeRunEnded', () => { clearDelayedGuides(); guide()?.dismiss?.('arcade-ended'); });
  on('gameOver', () => { clearDelayedGuides(); guide()?.dismiss?.('arcade-ended'); });

  function infiniteManualStep() {
    try {
      if (typeof InfiniteState === 'undefined') return null;
      if (!Array.isArray(InfiniteState.frogs) || InfiniteState.frogs.length === 0) return step('infinite.recruit');
      if (!InfiniteState.frogs.some(frog => ['clear','patrol','gather'].includes(frog.assignment))) return step('infinite.assign');
      const summary = typeof infiniteColonyPressureSummary === 'function' ? infiniteColonyPressureSummary() : null;
      if (!summary?.reclaimed) return step('infinite.reclaim');
      if ((InfiniteState.exploredCells?.size || 0) <= 1) return step('infinite.expand');
      return { id:'manual.infinite', mode:'infinite', sequence:'manual-infinite', pose:'celebrate', message:'Your colony basics are in place. Follow the next highlighted objective.', maxLevel:'hint' };
    } catch (_) { return null; }
  }

  function arcadeManualStep() {
    if (activeArcadeToadal()) {
      if (!guidance()?.mastered?.('toadalReleasedChargedHop')) return step('arcade.toadal-crouch');
      if (!guidance()?.mastered?.('toadalUsedTongue')) return step('arcade.toadal-tongue');
      let snapshot = null;
      try { snapshot = root.ArcadeToadalMechanics?.snapshot?.(); } catch (_) {}
      const charge = Number(snapshot?.charge || 0);
      if (charge >= 100 && !guidance()?.mastered?.('toadalUsedGoldenBlock')) return step('arcade.toadal-block');
      if (charge >= 45 && !guidance()?.mastered?.('toadalUsedGoldenThrow')) return step('arcade.toadal-throw');
      return { id:'manual.arcade.toadal', mode:'arcade', sequence:'manual-arcade', pose:'hint', message:'Body catches build Golden Charge; Tongue reaches safely but does not add Charge.', maxLevel:'hint' };
    }
    const def = currentChar();
    const behavior = root.getArcadeCharacterBehaviorProfile?.(def) || null;
    const playerGuide = behavior?.playerGuide || {};
    const hints = [playerGuide.movement, playerGuide.action, playerGuide.catch].filter(Boolean);
    const message = hints.length ? hints.join('. ') + '.' : 'Use your main action when a safe opening appears.';
    return { id:'manual.arcade', mode:'arcade', sequence:'manual-arcade', pose:'hint', message, target:'#gameCanvas', maxLevel:'hint' };
  }

  function puzzleManualStep() {
    if (document.getElementById('boardZone') && !guidance()?.mastered?.('puzzleTutorialComplete')) {
      const nextId = nextPuzzleTutorialStepId();
      return step(nextId || 'puzzle.route');
    }
    const energyWarning = document.getElementById('energyWarning');
    if (energyWarning && !energyWarning.classList.contains('hidden')) {
      return { id:'manual.puzzle.energy', mode:'puzzle', sequence:'manual-puzzle', pose:'warning', message:'Energy pays for empty ground; food costs no Energy. The Exit remains reachable at 0 Energy.', target:'#energyMeter', maxLevel:'hint' };
    }
    const bellyWarning = document.getElementById('bellyWarning');
    if (bellyWarning && !bellyWarning.classList.contains('hidden')) {
      return { id:'manual.puzzle.belly', mode:'puzzle', sequence:'manual-puzzle', pose:'warning', message:'At Belly 4+, empty ground costs 2 Energy. At full Belly, use Golden Action or take an adjacent authorized Exit.', target:'#bellyMeter', maxLevel:'hint' };
    }
    return { id:'manual.puzzle', mode:'puzzle', sequence:'manual-puzzle', pose:'hint', message:'Column numbers count hidden Bombs; marked tiles can still hide one. Save Energy for empty ground and keep the Exit reachable.', target:'#boardZone', maxLevel:'hint' };
  }

  function feastfallManualStep() {
    try {
      const current = root.FeastfallStoryTutorial?.current?.();
      if (current?.lessonId) {
        return { id:`manual.feastfall.${current.lessonId}`, mode:'feastfall', sequence:'manual-feastfall', pose:'target', message:current.message || current.title || 'Follow the highlighted Feastfall lesson.', target:current.target || current.selector || null, maxLevel:'hint' };
      }
    } catch (_) {}
    return { id:'manual.feastfall', mode:'feastfall', sequence:'manual-feastfall', pose:'hint', message:'Read the current Visitor card, then serve what helps that guest most.', target:'.ff-vf-info', maxLevel:'hint' };
  }

  function requestManual(mode, context = {}) {
    const normalized = String(mode || gameState()?.currentMode || '').toLowerCase();
    const candidate = normalized === 'feastfall' ? feastfallManualStep()
      : normalized === 'puzzle' ? puzzleManualStep()
        : normalized === 'infinite' ? infiniteManualStep()
          : arcadeManualStep();
    if (!candidate) return false;
    return guide()?.manual?.({ ...candidate, manual:true }, context) === true;
  }

  root.FeastGenieModeAdapters = Object.freeze({ presentById, master, requestManual, arcadeManualStep, puzzleManualStep, infiniteManualStep, feastfallManualStep });
})(typeof globalThis !== 'undefined' ? globalThis : window);
