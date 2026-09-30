// ============================================================
// arcade-result-ui.js — Standalone Arcade result presentation
// ============================================================
// The UI consumes completed-run or Feast checkpoint payloads. Gameplay state
// changes remain owned by ArcadeFeastVictory and the standalone boot controller.

const ArcadeResultUI = (() => {
  let initialized = false;
  let visible = false;
  let lastPayload = null;
  let lastOutcome = null;
  let actionHandler = null;
  let priorFocus = null;
  let reactionTimer = null;
  let presentationGeneration = 0;

  const $ = id => document.getElementById(id);

  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = !!hidden;
    element.classList.toggle('hidden', !!hidden);
  }

  function format(value) {
    return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString();
  }

  function configureButton(button, { action, label, hidden = false } = {}) {
    if (!button) return;
    button.dataset.arcadeResultAction = String(action || 'menu');
    button.textContent = String(label || 'Continue');
    setHidden(button, hidden);
  }

  function configureActions(outcome) {
    const primary = $('arcadeResultPrimaryButton');
    const secondary = $('arcadeResultSecondaryButton');
    if (outcome.checkpoint === true) {
      configureButton(primary, { action: 'encore', label: 'Continue to Encore' });
      configureButton(secondary, { action: 'finish-victory', label: 'Finish Victorious' });
      return;
    }
    configureButton(primary, { action: 'replay', label: 'Play Again' });
    configureButton(secondary, { action: 'menu', label: ArcadeHostIntegration?.resultMenuLabel?.() || 'Arcade Menu' });
  }

  function populate(payload, outcome) {
    const artTone = typeof ArcadeReactionArt !== 'undefined' ? ArcadeReactionArt.toneForResult(payload, outcome) : outcome.tone;
    const reactionBase = ArcadeRunOutcomeEvaluator.resolveReaction(payload.charId, artTone);
    // Toadal's supplied reaction derivatives belong to Toadal. Every other
    // character must retain its own reaction art (or the canonical portrait
    // fallback) on both victory and loss surfaces.
    const isToadal = String(payload.charId || '').toLowerCase() === 'toadal';
    const customResultArt = isToadal && (outcome.feastVictory || outcome.checkpoint)
      ? 'assets/images/characters/reactions-v1/toadal/victory.png'
      : isToadal && (outcome.tone === 'sad' || outcome.tone === 'dizzy' || outcome.tone === 'determined')
        ? 'assets/images/characters/reactions-v1/toadal/sad.png'
        : '';
    const reaction = customResultArt
      ? Object.freeze({
          ...reactionBase,
          characterName: 'Toadal',
          src: customResultArt,
          fallbackSrc: reactionBase.src,
          specialized: false,
          frames: 1,
          alt: outcome.feastVictory || outcome.checkpoint ? 'Golden Toadal celebrating victory' : 'Golden Toadal after the loss',
        })
      : reactionBase;
    const root = $('arcadeResultOverlay');
    const image = $('arcadeResultCharacter');
    const eyebrow = $('arcadeResultEyebrow');
    const ruleset = $('arcadeResultRuleset');
    const title = $('arcadeResultTitle');
    const subtitle = $('arcadeResultSubtitle');
    const score = $('arcadeResultScore');
    const best = $('arcadeResultBest');
    const wave = $('arcadeResultWave');
    const progressNote = $('arcadeResultProgressNote');
    const payoutLabel = $('arcadeResultPayoutLabel');
    const payout = $('arcadeResultPayout');
    const payoutNote = $('arcadeResultPayoutNote');
    const achievements = $('arcadeResultAchievements');
    const insights = $('arcadeResultInsights');
    const insightBest = $('arcadeResultInsightBest');
    const insightMastery = $('arcadeResultInsightMastery');
    const insightNext = $('arcadeResultInsightNext');
    const revenge = $('arcadeResultRevenge');
    const revengeButton = $('arcadeResultRevengeButton');
    const revengeDismiss = $('arcadeResultRevengeDismiss');

    if (root) {
      root.dataset.outcome = outcome.type;
      root.dataset.tone = outcome.tone;
      root.dataset.checkpoint = outcome.checkpoint ? 'true' : 'false';
      root.setAttribute('aria-label', `${outcome.headline} — ${reaction.characterName}`);
    }
    if (image) {
      image.src = reaction.src;
      image.alt = reaction.alt;
      image.dataset.specialized = reaction.specialized ? 'true' : 'false';
      if (typeof ArcadeReactionArt !== 'undefined') {
        if (customResultArt) {
          ArcadeReactionArt.clear(image);
          image.onerror = () => {
            image.onerror = null;
            image.src = reaction.fallbackSrc;
            image.alt = reactionBase.alt;
          };
        } else {
          ArcadeReactionArt.present(image, reaction);
        }
      }
    }
    if (eyebrow) eyebrow.textContent = reaction.characterName;
    if (ruleset) {
      const label = String(payload.rulesetLabel || (typeof ArcadeRunRules !== 'undefined' ? ArcadeRunRules.labelFor(payload.ruleset) : 'Legacy'));
      ruleset.textContent = `${label} rules`;
      ruleset.dataset.ruleset = String(payload.ruleset || 'legacy');
      ruleset.title = payload.ruleset === 'custom'
        ? 'This run used a difficulty-affecting custom setting.'
        : 'Personal bests are compared within this ruleset.';
    }
    if (title) title.textContent = outcome.headline;
    if (subtitle) subtitle.textContent = outcome.subtitle;
    if (score) score.textContent = format(outcome.score);
    if (best) {
      best.textContent = outcome.newHighScore
        ? `Previous best ${format(outcome.previousBest)}`
        : `Best ${format(Math.max(outcome.previousBest, outcome.checkpoint ? outcome.previousBest : outcome.score))}`;
    }
    if (wave) wave.textContent = outcome.progressLabel || `Wave ${format(outcome.level)}`;
    if (progressNote) progressNote.textContent = outcome.progressNote || (outcome.encoreActive ? 'Victory secured' : 'Arcade run');
    const projectedGold = typeof ProgressionManager !== 'undefined' && ProgressionManager.scoreToCoins
      ? ProgressionManager.scoreToCoins(outcome.score)
      : Math.floor(Math.max(0, Number(outcome.score)||0) / 100);
    if (payoutLabel) payoutLabel.textContent = outcome.checkpoint ? 'Pending Froggy Gold' : 'Froggy Gold Banked';
    if (payout) payout.textContent = `+${format(projectedGold)}`;
    if (payoutNote) payoutNote.textContent = outcome.checkpoint
      ? `${format(outcome.score)} score banks as ${format(projectedGold)} Gold if you finish now. Encore keeps building it.`
      : `${format(outcome.score)} score banked as ${format(projectedGold)} Froggy Gold.`;
    if (root) { root.classList.remove('arcade-result-converting'); void root.offsetWidth; root.classList.add('arcade-result-converting'); }

    if (achievements) {
      achievements.replaceChildren();
      outcome.achievementLines.forEach(line => {
        const item = document.createElement('li');
        item.textContent = line;
        achievements.appendChild(item);
      });
      setHidden(achievements, outcome.achievementLines.length === 0);
    }

    const recap = payload.runInsights;
    if (insights) {
      const showRecap = Boolean(recap && !outcome.checkpoint);
      if (showRecap) {
        if (insightBest) insightBest.textContent = String(recap.bestMoment || 'Run complete');
        if (insightMastery) insightMastery.textContent = String(recap.feastMastery || 'Keep feasting');
        if (insightNext) insightNext.textContent = String(recap.nextOpportunity || 'Push one wave farther.');
      }
      setHidden(insights, !showRecap);
    }

    if (revenge && revengeButton) {
      const challenge = outcome.checkpoint ? null : outcome.revengeChallenge;
      const presentation = outcome.revengePresentation
        || (challenge && typeof ArcadeRevengeChallenges !== 'undefined' ? ArcadeRevengeChallenges.describe(challenge) : null);
      if (challenge && presentation) {
        revenge.dataset.challengeStatus = String(challenge.status || 'offered');
        revenge.querySelector('strong').textContent = outcome.revengeFailed
          ? `${presentation.title} Still Active`
          : `${presentation.title} Ready`;
        revenge.querySelector('span').textContent = `${presentation.detail}${challenge.rewardCoins > 0 ? ` Reward: ${format(challenge.rewardCoins)} coins.` : ''}`;
        revengeButton.textContent = String(presentation.actionLabel || (outcome.revengeFailed ? 'Try Again' : 'Get Revenge'));
        revengeButton.dataset.challengeId = String(challenge.id || '');
        revengeButton.dataset.characterId = String(challenge.characterId || payload.charId || '');
        revengeButton.dataset.mode = String(challenge.mode || 'standard');
        if (revengeDismiss) revengeDismiss.dataset.challengeId = String(challenge.id || '');
        setHidden(revenge, false);
      } else {
        revenge.dataset.challengeStatus = '';
        revengeButton.dataset.challengeId = '';
        revengeButton.dataset.characterId = '';
        revengeButton.dataset.mode = '';
        if (revengeDismiss) revengeDismiss.dataset.challengeId = '';
        setHidden(revenge, true);
      }
    }
    configureActions(outcome);

    if (reactionTimer) clearTimeout(reactionTimer);
    reactionTimer = null;
    if (typeof ArcadeReactionArt === 'undefined' && outcome.tone === 'dizzy' && outcome.revengeChallenge && image) {
      const payloadRef = lastPayload;
      reactionTimer = window.setTimeout(() => {
        if (!visible || lastPayload !== payloadRef) return;
        const determined = ArcadeRunOutcomeEvaluator.resolveReaction(payload.charId, 'determined');
        image.src = determined.src;
        image.alt = determined.alt;
        image.dataset.specialized = determined.specialized ? 'true' : 'false';
        root.dataset.tone = 'determined';
      }, 900);
    }
  }

  function showResolved(payload, outcome) {
    if (!initialized) init();
    const root = $('arcadeResultOverlay');
    if (!root) return null;
    lastPayload = Object.freeze({ ...payload });
    lastOutcome = Object.freeze({ ...outcome });
    priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    populate(lastPayload, lastOutcome);
    setHidden(root, false);
    visible = true;
    if (!outcome.checkpoint && typeof RewardCoinCelebration !== 'undefined') RewardCoinCelebration.showBanked(root.querySelector('.arcade-result-card') || root);
    presentationGeneration += 1;
    const focusGeneration = presentationGeneration;
    document.body.classList.add('arcade-result-open');
    window.setTimeout(() => {
      if (!visible || presentationGeneration !== focusGeneration) return;
      $('arcadeResultPrimaryButton')?.focus?.({ preventScroll: true });
    }, 0);
    return lastOutcome;
  }

  function show(payload = {}) {
    if (typeof ArcadeRunOutcomeEvaluator === 'undefined') return null;
    const frozenPayload = Object.freeze({ ...payload });
    return showResolved(frozenPayload, ArcadeRunOutcomeEvaluator.evaluate(frozenPayload));
  }

  function showFeastCheckpoint(payload = {}) {
    const score = Math.max(0, Math.floor(Number(payload.score) || 0));
    const level = Math.max(1, Math.floor(Number(payload.level) || 10));
    const previousBest = Math.max(0, Math.floor(Number(payload.previousBestScore) || 0));
    const goalWave = Math.max(1, Math.floor(Number(payload.feastGoalWave) || level));
    const runRules = typeof ArcadeRunRules !== 'undefined'
      ? ArcadeRunRules.snapshot()
      : { ruleset:'legacy', label:'Legacy', key:'standard:legacy' };
    return showResolved({
      ...payload,
      ruleset:payload.ruleset || runRules.ruleset,
      rulesetLabel:payload.rulesetLabel || runRules.label,
      rulesetKey:payload.rulesetKey || runRules.key,
    }, {
      type: 'FEAST_CHECKPOINT',
      headline: 'FEAST COMPLETE!',
      subtitle: `Victory is secured. Your current score is ready to bank as Froggy Gold. Finish now, or continue into Encore to grow the payout.`,
      tone: 'celebrate',
      score,
      level,
      previousBest,
      newHighScore: score > previousBest,
      feastVictory: true,
      encoreActive: false,
      checkpoint: true,
      progressLabel: `Wave ${goalWave} Clear`,
      progressNote: 'Feast Goal achieved',
      achievementLines: Object.freeze([
        `Standard Feast completed at Wave ${goalWave}.`,
        'Encore is optional — the victory cannot be lost.',
      ]),
      revengeChallenge: null,
      revengePresentation: null,
    });
  }

  function hide({ restoreFocus = false } = {}) {
    if (typeof ArcadeReactionArt !== 'undefined') ArcadeReactionArt.clear($('arcadeResultCharacter'));
    if (typeof RewardCoinCelebration !== 'undefined') RewardCoinCelebration.stopAll();
    const root = $('arcadeResultOverlay');
    if (reactionTimer) clearTimeout(reactionTimer);
    reactionTimer = null;
    setHidden(root, true);
    visible = false;
    presentationGeneration += 1;
    document.body.classList.remove('arcade-result-open');
    if (root) delete root.dataset.checkpoint;
    if (restoreFocus) priorFocus?.focus?.({ preventScroll: true });
  }

  function invoke(action, source) {
    if (typeof actionHandler === 'function') actionHandler(action, {
      payload: lastPayload,
      outcome: lastOutcome,
      source,
    });
  }

  function handleClick(event) {
    const button = event.target.closest?.('[data-arcade-result-action]');
    if (!button) return;
    invoke(button.dataset.arcadeResultAction, button);
  }

  function handleKeydown(event) {
    if (!visible) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      invoke(lastOutcome?.checkpoint ? 'finish-victory' : 'menu', event.target);
      return;
    }
    if (event.key !== 'Tab') return;
    const root = $('arcadeResultOverlay');
    const focusable = [...root.querySelectorAll('button:not([hidden]):not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init(options = {}) {
    if (initialized) {
      if (typeof options.onAction === 'function') actionHandler = options.onAction;
      return ArcadeResultUI;
    }
    initialized = true;
    actionHandler = typeof options.onAction === 'function' ? options.onAction : null;
    $('arcadeResultOverlay')?.addEventListener('click', handleClick);
    // Capture the modal keyboard contract before the underlying gameplay
    // listener can interpret Escape as Resume and restart a checkpoint behind
    // the visible result dialog.
    document.addEventListener('keydown', handleKeydown, true);
    return ArcadeResultUI;
  }

  function preview(payload = {}) {
    return show({
      score: 1200,
      level: 6,
      previousBestScore: 1000,
      charId: 'classic',
      mode: 'standard',
      endCause: 'miss',
      badge: 'miss',
      isNewBest: true,
      feastOrderSummary: null,
      ...payload,
    });
  }

  return Object.freeze({
    init,
    show,
    showFeastCheckpoint,
    hide,
    preview,
    get visible() { return visible; },
    get lastOutcome() { return lastOutcome; },
    get lastPayload() { return lastPayload; },
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeResultUI = ArcadeResultUI;
