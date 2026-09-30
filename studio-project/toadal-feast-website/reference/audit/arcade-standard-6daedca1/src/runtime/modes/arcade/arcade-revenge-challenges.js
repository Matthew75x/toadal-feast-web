// ============================================================
// arcade-revenge-challenges.js — One unified Arcade comeback system
// ============================================================
// Replaces the older score-only Revenge button and the separate Feast Order
// hazard revenge. Exactly one offered/active challenge is stored at a time.
// Rewards are atomic, optional, modest, and never affect competitive score.

const ArcadeRevengeChallenges = (() => {
  const CONFIG = Object.freeze({
    schemaVersion: 2,
    rewardReason: 'arcadeRevengeComplete',
    hazardRewardCoins: 60,
    feastRewardCoins: 75,
    orderRewardCoins: 60,
    recordRewardCoins: 55,
    comebackRewardCoins: 40,
    nearFeastWindow: 2,
    nearRecordRatio: 0.75,
    maxOrderRemaining: 2,
  });

  const TYPES = Object.freeze([
    'HAZARD_CLEAN',
    'FEAST_GOAL',
    'ORDER_FINISH',
    'RECORD_BEAT',
    'COMEBACK_SCORE',
  ]);

  const runState = {
    participating: false,
    challengeId: '',
    characterId: '',
    mode: '',
    ruleset: 'legacy',
    hazardHit: false,
    completedOrderIds: new Set(),
    startedAtMs: 0,
  };

  const safeInt = (value, fallback = 0, max = 1_000_000_000) => {
    const numeric = Math.floor(Number(value));
    return Number.isFinite(numeric) ? Math.max(0, Math.min(max, numeric)) : fallback;
  };

  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const validType = value => TYPES.includes(String(value || '')) ? String(value) : null;
  const validStatus = value => ['offered', 'active'].includes(String(value || '')) ? String(value) : 'offered';

  function orderDefinition(orderId) {
    if (typeof FeastOrdersManager === 'undefined') return null;
    return (FeastOrdersManager.definitions || []).find(order => order.id === orderId) || null;
  }

  function normalizeChallenge(raw) {
    if (!isRecord(raw)) return null;
    const type = validType(raw.type);
    const characterId = String(raw.characterId || '');
    if (!type || !characterId) return null;
    const createdAtMs = safeInt(raw.createdAtMs, Date.now(), Number.MAX_SAFE_INTEGER);
    const id = /^revenge-[a-z0-9-]{6,96}$/.test(String(raw.id || ''))
      ? String(raw.id)
      : `revenge-${type.toLowerCase().replace(/_/g, '-')}-${createdAtMs}`;
    const challenge = {
      id,
      type,
      status: validStatus(raw.status),
      characterId,
      mode: String(raw.mode || 'standard'),
      ruleset: ['classic', 'touch-comfort', 'custom', 'legacy'].includes(String(raw.ruleset || ''))
        ? String(raw.ruleset)
        : 'legacy',
      targetWave: Math.max(0, safeInt(raw.targetWave, 0, 999)),
      targetScore: safeInt(raw.targetScore, 0),
      orderId: String(raw.orderId || ''),
      avoidHazards: raw.avoidHazards === true,
      rewardCoins: safeInt(raw.rewardCoins, 0, 500),
      createdAtMs,
      activatedAtMs: safeInt(raw.activatedAtMs, 0, Number.MAX_SAFE_INTEGER),
      attempts: safeInt(raw.attempts, 0, 999),
      sourceScore: safeInt(raw.sourceScore, 0),
      sourceWave: Math.max(1, safeInt(raw.sourceWave, 1, 999)),
      sourceEndCause: String(raw.sourceEndCause || 'unknown'),
    };
    if (type === 'ORDER_FINISH' && !orderDefinition(challenge.orderId)) return null;
    return challenge;
  }

  function legacyChallenge(root) {
    const legacy = root?.feastOrders?.revenge;
    if (!isRecord(legacy) || legacy.completed === true || !legacy.characterId) return null;
    const now = safeInt(legacy.createdAtMs, Date.now(), Number.MAX_SAFE_INTEGER);
    return normalizeChallenge({
      id: `revenge-hazard-clean-${now}`,
      type: 'HAZARD_CLEAN',
      status: legacy.active === true ? 'active' : 'offered',
      characterId: legacy.characterId,
      mode: 'standard',
      targetWave: Math.max(2, safeInt(legacy.targetWave, 2, 999)),
      orderId: String(legacy.orderId || ''),
      avoidHazards: true,
      rewardCoins: CONFIG.hazardRewardCoins,
      createdAtMs: now,
      activatedAtMs: legacy.active === true ? now : 0,
      sourceWave: Math.max(1, safeInt(legacy.targetWave, 1, 999)),
      sourceEndCause: 'hazard:legacy',
    });
  }

  function normalizeLedger(raw, root = null) {
    const source = isRecord(raw) ? raw : {};
    return {
      schemaVersion: CONFIG.schemaVersion,
      challenge: normalizeChallenge(source.challenge) || legacyChallenge(root),
      totalCompleted: safeInt(source.totalCompleted, 0, 1_000_000),
      lastCompleted: isRecord(source.lastCompleted) ? {
        id: String(source.lastCompleted.id || ''),
        type: validType(source.lastCompleted.type) || 'COMEBACK_SCORE',
        rewardCoins: safeInt(source.lastCompleted.rewardCoins, 0, 500),
        completedAtMs: safeInt(source.lastCompleted.completedAtMs, 0, Number.MAX_SAFE_INTEGER),
      } : null,
    };
  }

  function sameChallenge(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); }
    catch (_) { return false; }
  }

  function getLedger() {
    const root = typeof SaveManager !== 'undefined' ? SaveManager.get() : {};
    const normalized = normalizeLedger(root?.arcadeRevenge, root);
    if (!sameChallenge(root?.arcadeRevenge, normalized) || root?.feastOrders?.revenge) {
      SaveManager?.set?.(draft => {
        draft.arcadeRevenge = normalized;
        if (isRecord(draft.feastOrders)) draft.feastOrders.revenge = null;
      });
    }
    return normalized;
  }

  function persist(mutator) {
    let result = null;
    SaveManager?.set?.(root => {
      const ledger = normalizeLedger(root.arcadeRevenge, root);
      result = mutator(ledger, root);
      root.arcadeRevenge = ledger;
      if (isRecord(root.feastOrders)) root.feastOrders.revenge = null;
    });
    return result;
  }

  function orderState(orderId, dashboard = null) {
    const source = dashboard || FeastOrdersManager?.getDashboard?.();
    return source?.orders?.find?.(order => order.id === orderId) || null;
  }

  function orderRemaining(order) {
    if (!order) return Infinity;
    return Math.max(0, safeInt(order.targetTotal) - safeInt(order.progressTotal));
  }

  function isHazardCause(payload = {}) {
    const cause = String(payload.endCause || payload.badge || '').toLowerCase();
    return cause.includes('hazard') || cause.includes('bomb') || cause.includes('fire') || cause.includes('caution');
  }

  function createChallenge(type, payload, details = {}) {
    const now = Date.now();
    return normalizeChallenge({
      id: `revenge-${type.toLowerCase().replace(/_/g, '-')}-${now}`,
      type,
      status: 'offered',
      characterId: details.characterId || payload.charId || 'classic',
      mode: details.mode || payload.mode || 'standard',
      ruleset: details.ruleset || payload.ruleset || 'legacy',
      targetWave: details.targetWave,
      targetScore: details.targetScore,
      orderId: details.orderId,
      avoidHazards: details.avoidHazards,
      rewardCoins: details.rewardCoins,
      createdAtMs: now,
      attempts: 0,
      sourceScore: payload.score,
      sourceWave: payload.level,
      sourceEndCause: payload.endCause || payload.badge || 'unknown',
    });
  }

  function generate(payload = {}) {
    if (payload.feastVictory === true || payload.isNewBest === true) return null;
    const characterId = String(payload.charId || 'classic');
    const level = Math.max(1, safeInt(payload.level, 1, 999));
    const score = safeInt(payload.score);
    const previousBest = safeInt(payload.previousBestScore);
    const mode = String(payload.mode || 'standard');
    const goalWave = Math.max(1, safeInt(payload.feastGoalWave, 10, 999));
    const pinned = payload.feastOrderSummary?.pinned || null;
    const remaining = orderRemaining(pinned);

    if (isHazardCause(payload) && level >= 2) {
      return createChallenge('HAZARD_CLEAN', payload, {
        characterId,
        mode: 'standard',
        targetWave: level,
        avoidHazards: true,
        rewardCoins: CONFIG.hazardRewardCoins,
      });
    }

    if (pinned && !pinned.complete && remaining > 0 && remaining <= CONFIG.maxOrderRemaining) {
      return createChallenge('ORDER_FINISH', payload, {
        characterId: pinned.characterId,
        mode: 'standard',
        orderId: pinned.id,
        rewardCoins: CONFIG.orderRewardCoins,
      });
    }

    if (mode === 'standard' && level >= Math.max(2, goalWave - CONFIG.nearFeastWindow) && level < goalWave) {
      return createChallenge('FEAST_GOAL', payload, {
        characterId,
        mode: 'standard',
        targetWave: goalWave,
        rewardCoins: CONFIG.feastRewardCoins,
      });
    }

    if (previousBest > 0 && score >= previousBest * CONFIG.nearRecordRatio && score < previousBest) {
      return createChallenge('RECORD_BEAT', payload, {
        characterId,
        mode,
        targetScore: previousBest + 1,
        rewardCoins: CONFIG.recordRewardCoins,
      });
    }

    const targetScore = Math.max(300, score + 150, previousBest > 0 ? Math.ceil(previousBest * 0.5) : 0);
    if (level >= 2 || score >= 100 || previousBest > 0) {
      return createChallenge('COMEBACK_SCORE', payload, {
        characterId,
        mode,
        targetScore,
        rewardCoins: CONFIG.comebackRewardCoins,
      });
    }
    return null;
  }

  function describe(challenge) {
    const item = normalizeChallenge(challenge);
    if (!item) return Object.freeze({ title:'Revenge Challenge', detail:'Return stronger next run.', hud:'REVENGE', actionLabel:'Get Revenge' });
    const character = typeof CHARACTER_DATA !== 'undefined'
      ? CHARACTER_DATA.find(entry => entry.id === item.characterId)
      : null;
    const name = String(character?.name || 'your character');
    const order = orderDefinition(item.orderId);
    const rulesLabel = item.ruleset !== 'legacy' && typeof ArcadeRunRules !== 'undefined' ? ArcadeRunRules.labelFor(item.ruleset) : '';
    const suffix = rulesLabel ? ` · ${rulesLabel} rules` : '';
    const base = { actionLabel:item.status === 'active' ? 'Try Again' : 'Get Revenge' };
    if (item.type === 'HAZARD_CLEAN') return Object.freeze({ ...base, title:'Bomb Revenge', detail:`Reach Wave ${item.targetWave} as ${name} without catching a hazard${suffix}.`, hud:`REVENGE · Wave ${item.targetWave} · No hazards` });
    if (item.type === 'FEAST_GOAL') return Object.freeze({ ...base, title:'Feast Revenge', detail:`Clear Wave ${item.targetWave} as ${name}${suffix}.`, hud:`REVENGE · Feast Goal ${item.targetWave}` });
    if (item.type === 'ORDER_FINISH') return Object.freeze({ ...base, title:'Order Revenge', detail:`Finish ${order?.title || 'the pinned Feast Order'} as ${name}${suffix}.`, hud:`REVENGE · Finish ${order?.title || 'Feast Order'}` });
    if (item.type === 'RECORD_BEAT') return Object.freeze({ ...base, title:'Record Revenge', detail:`Score ${item.targetScore.toLocaleString()} points as ${name}${suffix}.`, hud:`REVENGE · ${item.targetScore.toLocaleString()} pts` });
    return Object.freeze({ ...base, title:'Comeback Challenge', detail:`Score ${item.targetScore.toLocaleString()} points as ${name}${suffix}.`, hud:`REVENGE · ${item.targetScore.toLocaleString()} pts` });
  }

  function activate(challengeId) {
    const id = String(challengeId || '');
    let activated = null;
    persist(ledger => {
      const challenge = normalizeChallenge(ledger.challenge);
      if (!challenge || challenge.id !== id) return null;
      challenge.status = 'active';
      challenge.activatedAtMs = Date.now();
      ledger.challenge = challenge;
      activated = { ...challenge };
      return activated;
    });
    if (activated) EventBus?.emit?.('arcadeRevengeActivated', { challenge:activated, presentation:describe(activated) });
    return Object.freeze({ ok:Boolean(activated), challenge:activated });
  }

  function dismiss(challengeId = '') {
    const id = String(challengeId || '');
    let removed = null;
    persist(ledger => {
      if (!ledger.challenge || (id && ledger.challenge.id !== id)) return null;
      removed = { ...ledger.challenge };
      ledger.challenge = null;
      return removed;
    });
    if (removed) EventBus?.emit?.('arcadeRevengeDismissed', { challenge:removed });
    return Object.freeze({ ok:Boolean(removed), challenge:removed });
  }

  function complete(challenge) {
    let result = null;
    let snapshotJson = null;
    persist((ledger, root) => {
      const current = normalizeChallenge(ledger.challenge);
      if (!current || current.id !== challenge.id) return null;
      try { snapshotJson = JSON.stringify(root); } catch (_) { snapshotJson = null; }
      let award = { amount:0, total:safeInt(root.coins) };
      if (current.rewardCoins > 0 && typeof ProgressionManager !== 'undefined' && typeof ProgressionManager.awardCoinsInTransaction === 'function') {
        award = ProgressionManager.awardCoinsInTransaction(root, current.rewardCoins);
      }
      ledger.totalCompleted += 1;
      ledger.lastCompleted = {
        id:current.id,
        type:current.type,
        rewardCoins:award.amount,
        completedAtMs:Date.now(),
      };
      ledger.challenge = null;
      result = { challenge:{ ...current }, rewardCoins:award.amount, coinTotal:award.total };
      return result;
    });
    // Commit first, celebrate second: the reward and cleared challenge must be
    // physically durable before any success event. On flush failure the whole
    // completion rolls back and stays claimable.
    if (result) {
      const durable = typeof SaveManager !== 'undefined' && typeof SaveManager.flushNow === 'function' ? SaveManager.flushNow() : true;
      if (durable !== true) {
        if (snapshotJson && typeof restoreSaveDocumentInPlace === 'function') {
          try { restoreSaveDocumentInPlace(SaveManager.get(), snapshotJson); } catch (_) {}
        }
        return null;
      }
    }
    if (result) {
      if (result.rewardCoins > 0) EventBus?.emit?.('coinsAwarded', { amount:result.rewardCoins, reason:CONFIG.rewardReason, total:result.coinTotal });
      EventBus?.emit?.('arcadeRevengeCompleted', result);
    }
    return result;
  }

  function matchesRun(challenge, payload = {}) {
    const payloadRuleset = String(payload.ruleset || (typeof ArcadeRunRules !== 'undefined' ? ArcadeRunRules.snapshot().ruleset : 'legacy'));
    const rulesMatch = challenge.ruleset === 'legacy' || challenge.ruleset === payloadRuleset;
    return String(payload.charId || '') === challenge.characterId
      && String(payload.mode || 'standard') === challenge.mode
      && rulesMatch;
  }

  function challengeSucceeded(challenge, payload = {}) {
    if (!matchesRun(challenge, payload) || !runState.participating || runState.challengeId !== challenge.id) return false;
    if (challenge.avoidHazards && runState.hazardHit) return false;
    if (challenge.type === 'HAZARD_CLEAN') return safeInt(payload.level, 0, 999) >= challenge.targetWave;
    if (challenge.type === 'FEAST_GOAL') return payload.feastVictory === true || safeInt(payload.level, 0, 999) >= challenge.targetWave;
    if (challenge.type === 'ORDER_FINISH') return runState.completedOrderIds.has(challenge.orderId);
    return safeInt(payload.score) >= challenge.targetScore;
  }

  function resolveGameOver(payload = {}) {
    const ledger = getLedger();
    let challenge = normalizeChallenge(ledger.challenge);
    let completed = null;
    let failed = null;

    if (challenge?.status === 'active' && matchesRun(challenge, payload) && runState.participating) {
      if (challengeSucceeded(challenge, payload)) {
        completed = complete(challenge);
        challenge = null;
      } else {
        persist(next => {
          const current = normalizeChallenge(next.challenge);
          if (!current || current.id !== challenge.id) return null;
          current.attempts += 1;
          next.challenge = current;
          failed = { ...current };
          return failed;
        });
        challenge = failed;
        EventBus?.emit?.('arcadeRevengeFailed', { challenge:failed, presentation:describe(failed) });
      }
    }

    let offered = null;
    if (!completed && !challenge?.status?.includes?.('active')) {
      offered = generate(payload);
      if (offered) {
        persist(next => { next.challenge = offered; return offered; });
        challenge = offered;
        EventBus?.emit?.('arcadeRevengeOffered', { challenge:offered, presentation:describe(offered) });
      }
    }

    const active = challenge?.status === 'active' ? challenge : null;
    const current = offered || active || null;
    return Object.freeze({
      completed,
      offered,
      active,
      failed,
      current,
      presentation:current ? describe(current) : null,
    });
  }

  function onGameStarted() {
    const challenge = normalizeChallenge(getLedger().challenge);
    const characterId = String(typeof getCharDef === 'function' ? getCharDef()?.id : (typeof GameState !== 'undefined' ? GameState.selectedCharacterId : '') || '');
    const mode = String(typeof GameState !== 'undefined' ? GameState.currentMode || 'standard' : 'standard');
    const ruleset = String(typeof ArcadeRunRules !== 'undefined' ? ArcadeRunRules.snapshot().ruleset : 'legacy');
    const rulesMatch = challenge?.ruleset === 'legacy' || challenge?.ruleset === ruleset;
    runState.participating = Boolean(challenge?.status === 'active' && challenge.characterId === characterId && challenge.mode === mode && rulesMatch);
    runState.challengeId = runState.participating ? challenge.id : '';
    runState.characterId = characterId;
    runState.mode = mode;
    runState.ruleset = ruleset;
    runState.hazardHit = false;
    runState.completedOrderIds.clear();
    runState.startedAtMs = Date.now();
  }

  function onPlayerDamaged(payload = {}) {
    if (String(payload.source || '').startsWith('hazard:')) runState.hazardHit = true;
  }

  function onOrderCompleted(payload = {}) {
    const orderId = String(payload.orderId || payload.order?.id || '');
    if (orderId) runState.completedOrderIds.add(orderId);
  }

  function getCurrentChallenge() {
    const challenge = normalizeChallenge(getLedger().challenge);
    return challenge ? Object.freeze({ ...challenge }) : null;
  }

  function getHudStatus() {
    const challenge = getCurrentChallenge();
    if (!challenge || challenge.status !== 'active' || !runState.participating) return null;
    const presentation = describe(challenge);
    let progress = presentation.hud;
    if (challenge.type === 'HAZARD_CLEAN' || challenge.type === 'FEAST_GOAL') {
      const wave = Math.max(1, safeInt(typeof GameState !== 'undefined' ? GameState.level : 1, 1, 999));
      progress = `REVENGE · Wave ${Math.min(wave, challenge.targetWave)}/${challenge.targetWave}${challenge.avoidHazards ? ' · Clean' : ''}`;
    } else if (challenge.type === 'RECORD_BEAT' || challenge.type === 'COMEBACK_SCORE') {
      const score = safeInt(typeof GameState !== 'undefined' ? GameState.score : 0);
      progress = `REVENGE · ${Math.min(score, challenge.targetScore).toLocaleString()}/${challenge.targetScore.toLocaleString()}`;
    } else if (challenge.type === 'ORDER_FINISH') {
      const remaining = orderRemaining(orderState(challenge.orderId));
      progress = `REVENGE · ${Number.isFinite(remaining) ? remaining : '?'} ingredient${remaining === 1 ? '' : 's'} left`;
    }
    return Object.freeze({ challenge, presentation, progress, hazardHit:runState.hazardHit });
  }

  function bind() {
    if (typeof EventBus === 'undefined') return;
    EventBus.on('gameStarted', onGameStarted);
    EventBus.on('playerDamaged', onPlayerDamaged);
    EventBus.on('feastOrderCompleted', onOrderCompleted);
  }

  bind();
  getLedger();

  return Object.freeze({
    CONFIG,
    TYPES,
    getCurrentChallenge,
    getHudStatus,
    describe,
    activate,
    dismiss,
    resolveGameOver,
    isHazardCause,
    snapshotRunState:() => Object.freeze({
      participating:runState.participating,
      challengeId:runState.challengeId,
      characterId:runState.characterId,
      mode:runState.mode,
      ruleset:runState.ruleset,
      hazardHit:runState.hazardHit,
      completedOrderIds:Object.freeze([...runState.completedOrderIds]),
    }),
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeRevengeChallenges = ArcadeRevengeChallenges;
