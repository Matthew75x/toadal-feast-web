// ============================================================
// arcade-run-outcomes.js — Arcade end-of-run meaning and reactions
// ============================================================
// Owns presentation priority only. It does not alter score, collision,
// rewards, saves, progression, or the cause that ended a run.

const ArcadeRunOutcomeEvaluator = (() => {
  const OUTCOME_PRIORITY = Object.freeze([
    'ENCORE_HIGH_SCORE',
    'ENCORE_COMPLETE',
    'FEAST_COMPLETE_HIGH_SCORE',
    'FEAST_COMPLETE',
    'NEW_HIGH_SCORE',
    'ORDER_COMPLETED',
    'REVENGE_COMPLETED',
    'GREAT_RUN',
    'HAZARD_ENDING',
    'ROUGH_RUN',
    'NORMAL_RUN',
  ]);

  const runEvidence = {
    completedOrders: [],
    revengeCompleted: null,
  };

  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const safeInteger = (value, fallback = 0) => Math.max(0, Math.floor(number(value, fallback)));

  function resetRunEvidence() {
    runEvidence.completedOrders = [];
    runEvidence.revengeCompleted = null;
  }

  function recordOrderCompletion(payload = {}) {
    const order = payload.order || null;
    const id = String(payload.orderId || order?.id || '');
    if (!id || runEvidence.completedOrders.some(item => item.id === id)) return;
    runEvidence.completedOrders.push(Object.freeze({
      id,
      title: String(order?.title || payload.title || 'Feast Order'),
      rewardCoins: safeInteger(payload.rewardCoins),
      plateRewardCoins: safeInteger(payload.plateRewardCoins),
    }));
  }

  function recordRevengeCompletion(payload = {}) {
    runEvidence.revengeCompleted = Object.freeze({
      rewardCoins: safeInteger(payload.rewardCoins),
      challengeId: String(payload.challenge?.id || ''),
      challengeType: String(payload.challenge?.type || ''),
    });
  }

  function isHazardCause(payload = {}) {
    const cause = String(payload.endCause || payload.badge || '').toLowerCase();
    return cause.includes('hazard') || cause.includes('bomb') || cause.includes('stun') || cause.includes('dizzy');
  }

  function performanceTier(payload = {}) {
    const score = safeInteger(payload.score);
    const level = Math.max(1, safeInteger(payload.level, 1));
    const previousBest = safeInteger(payload.previousBestScore);

    if (previousBest <= 0) {
      if (level >= 7 || score >= 900) return 'great';
      if (level <= 2 && score < 180) return 'rough';
      return 'normal';
    }

    const ratio = score / Math.max(1, previousBest);
    if (ratio >= 0.8 || level >= 8) return 'great';
    if (ratio < 0.3 && level <= 3) return 'rough';
    return 'normal';
  }

  function resultLine(payload, orderCompletion, revengeCompletion) {
    const lines = [];
    const score = safeInteger(payload.score);
    const previousBest = safeInteger(payload.previousBestScore);
    const level = Math.max(1, safeInteger(payload.level, 1));

    if (payload.isNewBest === true) {
      const delta = Math.max(0, score - previousBest);
      lines.push(delta > 0 ? `Personal best improved by ${delta.toLocaleString()} points.` : 'A new personal best was recorded.');
    }
    if (orderCompletion) {
      const coins = orderCompletion.rewardCoins + orderCompletion.plateRewardCoins;
      lines.push(`${orderCompletion.title} completed${coins > 0 ? ` · +${coins.toLocaleString()} coins` : ''}.`);
    }
    if (revengeCompletion) {
      lines.push(`Revenge Challenge completed${revengeCompletion.rewardCoins > 0 ? ` · +${revengeCompletion.rewardCoins.toLocaleString()} coins` : ''}.`);
    }
    if (payload.feastVictory === true) {
      const goalWave = Math.max(1, safeInteger(payload.feastGoalWave, 10));
      lines.push(`Feast Goal cleared at Wave ${goalWave}.`);
    }
    if (payload.encoreActive === true) lines.push(`Encore reached Wave ${level}.`);
    if (isHazardCause(payload)) lines.push(`A hazard ended the run at Wave ${level}.`);
    return lines;
  }

  function evaluate(payload = {}) {
    const score = safeInteger(payload.score);
    const level = Math.max(1, safeInteger(payload.level, 1));
    const previousBest = safeInteger(payload.previousBestScore);
    const feastVictory = payload.feastVictory === true;
    const encoreActive = payload.encoreActive === true;
    const feastGoalWave = Math.max(1, safeInteger(payload.feastGoalWave, 10));
    const newHighScore = payload.isNewBest === true;
    const orderCompletion = runEvidence.completedOrders.at(-1) || null;
    const revengeCompletion = payload.revengeSummary?.completed || runEvidence.revengeCompleted || null;
    const revengeChallenge = payload.revengeSummary?.offered || payload.revengeSummary?.failed || payload.revengeSummary?.active || null;
    const revengePresentation = payload.revengeSummary?.presentation || (revengeChallenge && typeof ArcadeRevengeChallenges !== 'undefined' ? ArcadeRevengeChallenges.describe(revengeChallenge) : null);
    const tier = performanceTier(payload);
    const hazard = isHazardCause(payload);

    let type = 'NORMAL_RUN';
    let headline = 'RUN COMPLETE';
    let subtitle = `Wave ${level} · ${score.toLocaleString()} points`;
    let tone = 'neutral';

    if (feastVictory && encoreActive && newHighScore) {
      type = 'ENCORE_HIGH_SCORE';
      headline = 'NEW HIGH SCORE!';
      subtitle = `Feast victory secured — Encore ended at Wave ${level} with a new personal best.`;
      tone = 'celebrate';
    } else if (feastVictory && encoreActive) {
      type = 'ENCORE_COMPLETE';
      headline = 'ENCORE COMPLETE!';
      subtitle = `Victory was secured at Wave ${feastGoalWave}. Encore reached Wave ${level}.`;
      tone = 'celebrate';
    } else if (feastVictory && newHighScore) {
      type = 'FEAST_COMPLETE_HIGH_SCORE';
      headline = 'FEAST COMPLETE!';
      subtitle = 'Victory secured — and a new personal best!';
      tone = 'celebrate';
    } else if (feastVictory) {
      type = 'FEAST_COMPLETE';
      headline = 'FEAST COMPLETE!';
      subtitle = 'You reached the feast goal. The victory is yours.';
      tone = 'celebrate';
    } else if (newHighScore) {
      type = 'NEW_HIGH_SCORE';
      headline = 'NEW HIGH SCORE!';
      subtitle = hazard
        ? 'The run ended, but the new record still counts.'
        : 'A new personal best worth celebrating.';
      tone = 'celebrate';
    } else if (orderCompletion) {
      type = 'ORDER_COMPLETED';
      headline = 'FEAST ORDER SERVED!';
      subtitle = `${orderCompletion.title} is complete.`;
      tone = 'proud';
    } else if (revengeCompletion) {
      type = 'REVENGE_COMPLETED';
      headline = 'REVENGE COMPLETE!';
      subtitle = 'You answered the setback with a clean comeback.';
      tone = 'celebrate';
    } else if (tier === 'great') {
      type = 'GREAT_RUN';
      headline = 'GREAT FEAST!';
      subtitle = previousBest > 0
        ? `${Math.round((score / Math.max(1, previousBest)) * 100)}% of your personal best.`
        : `Strong progress through Wave ${level}.`;
      tone = 'proud';
    } else if (hazard) {
      type = 'HAZARD_ENDING';
      headline = 'GAME OVER!';
      subtitle = 'A hazard ended the run. Try again!';
      tone = 'sad';
    } else if (tier === 'rough') {
      type = 'ROUGH_RUN';
      headline = 'GAME OVER!';
      subtitle = previousBest > 0
        ? `Run complete — try again to improve your score. Next target: ${Math.max(score + 50, Math.ceil(previousBest * 0.5)).toLocaleString()}.`
        : 'Run complete — try again to improve your score!';
      tone = 'sad';
    }

    const achievementLines = resultLine(payload, orderCompletion, revengeCompletion);

    return Object.freeze({
      type,
      headline,
      subtitle,
      tone,
      score,
      level,
      previousBest,
      newHighScore,
      feastVictory,
      encoreActive,
      feastGoalWave,
      hazard,
      orderCompletion,
      revengeCompletion,
      revengeChallenge,
      revengePresentation,
      revengeFailed: Boolean(payload.revengeSummary?.failed),
      achievementLines: Object.freeze(achievementLines),
      priorityIndex: OUTCOME_PRIORITY.indexOf(type),
    });
  }

  function characterDefinition(characterId) {
    const id = String(characterId || '');
    if (!id || typeof CHARACTER_DATA === 'undefined') return null;
    return CHARACTER_DATA.find(character => character.id === id) || null;
  }

  const REACTIONS = Object.freeze({
    classic: Object.freeze({
      celebrate: 'assets/images/characters/results/classic-happy.png',
      proud: 'assets/images/characters/results/classic-happy.png',
      dizzy: 'assets/images/characters/results/classic-hurt.png',
      determined: 'assets/images/characters/results/classic-determined.png',
    }),
    pelican: Object.freeze({
      celebrate: 'assets/images/characters/results/gully-victory.png',
      proud: 'assets/images/characters/results/gully-proud.png',
      dizzy: 'assets/images/characters/results/gully-dizzy.png',
      determined: 'assets/images/characters/results/gully-proud.png',
    }),
  });

  function resolveReaction(characterId, tone = 'neutral') {
    if (typeof ArcadeReactionArt !== 'undefined') return ArcadeReactionArt.resolve(characterId, tone);
    const id = String(characterId || '');
    const character = characterDefinition(id);
    const profile = REACTIONS[id] || null;
    const src = profile?.[tone] || character?.src || '';
    return Object.freeze({
      characterId: id,
      characterName: String(character?.name || 'Unknown Character'),
      src,
      tone,
      alt: `${String(character?.name || 'Character')} ${tone} reaction`,
      specialized: Boolean(profile?.[tone]),
    });
  }

  function bind() {
    if (typeof EventBus === 'undefined') return;
    EventBus.on('gameStarted', resetRunEvidence);
    EventBus.on('feastOrderCompleted', recordOrderCompletion);
    EventBus.on('arcadeRevengeCompleted', recordRevengeCompletion);
  }

  bind();

  return Object.freeze({
    OUTCOME_PRIORITY,
    evaluate,
    resolveReaction,
    performanceTier,
    isHazardCause,
    resetRunEvidence,
    snapshotEvidence: () => Object.freeze({
      completedOrders: Object.freeze([...runEvidence.completedOrders]),
      revengeCompleted: runEvidence.revengeCompleted,
    }),
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeRunOutcomeEvaluator = ArcadeRunOutcomeEvaluator;
