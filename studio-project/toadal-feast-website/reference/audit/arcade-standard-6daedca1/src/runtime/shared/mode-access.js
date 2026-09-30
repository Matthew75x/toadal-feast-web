// ============================================================
// mode-access.js — shared, durable game-mode access authority
// ============================================================
// This service owns only mode access facts. Mode-owned progress (Arcade
// scores, Feastfall Orders, and Puzzle levels) remains in its existing save
// authority and is read here as evidence. No wallet, reward, or gameplay state
// is mutated when a mode is unlocked.

const MODE_ACCESS_SAVE_MANAGER = (() => {
  try { if (typeof SaveManager !== 'undefined' && SaveManager) return SaveManager; } catch (_) {}
  try { return typeof globalThis !== 'undefined' ? globalThis.SaveManager || null : null; } catch (_) { return null; }
})();

const ModeAccess = (() => {
  'use strict';

  const SCHEMA_VERSION = 1;
  const LEGACY_FREE_MODE_IDS = Object.freeze(['zen', 'feastfall-challenge', 'infinite']);
  const ARCADE_SCORE_MODE_IDS = Object.freeze(['fmf', 'tc']);
  const PUZZLE_CAMPAIGN_LEVEL_IDS = Object.freeze(
    Array.from({ length: 36 }, (_, index) => `p${String(index + 1).padStart(3, '0')}`),
  );
  const KNOWN_MODE_IDS = Object.freeze([
    'standard', 'feastfall-story', 'puzzle', 'fmf', 'tc', 'zen',
    'feastfall-challenge', 'infinite', 'puzzle-daily', 'puzzle-featured',
  ]);

  const MODE_RULES = Object.freeze({
    standard: Object.freeze({ label: 'Classic Arcade', requirement: 'Available from the start', kind: 'always' }),
    'feastfall-story': Object.freeze({ label: 'Feastfall Story', requirement: 'Available from the start', kind: 'always' }),
    puzzle: Object.freeze({ label: 'Puzzle Mode', requirement: 'Available from the start', kind: 'always' }),
    fmf: Object.freeze({ label: '5 Minute Feast', requirement: 'Reach 600 best-score points', kind: 'score', balanceKey: 'fmf', actionMode: 'fmf' }),
    tc: Object.freeze({ label: 'Feast Frenzy', requirement: 'Reach 1,500 best-score points', kind: 'score', balanceKey: 'tc', actionMode: 'tc' }),
    zen: Object.freeze({ label: 'Zen Garden', requirement: 'Finish one Arcade run, Feastfall Order, or Puzzle level', kind: 'any', actionMode: 'zen' }),
    'feastfall-challenge': Object.freeze({ label: 'Feastfall Challenge', requirement: 'Clear 6 distinct Feastfall Story Orders', kind: 'feastfall-orders', actionMode: 'feastfall-challenge' }),
    infinite: Object.freeze({ label: 'Infinite Feasts', requirement: 'Reach 600 score, clear 6 Feastfall Orders, or clear 6 Puzzle levels', kind: 'any', actionMode: 'infinite' }),
    'puzzle-daily': Object.freeze({ label: 'Daily Puzzle', requirement: 'Clear Puzzle campaign level 12', kind: 'puzzle-level', levelId: 'p012', actionMode: 'puzzle' }),
    'puzzle-featured': Object.freeze({ label: 'Featured Puzzle', requirement: 'Clear Puzzle campaign level 12', kind: 'puzzle-level', levelId: 'p012', actionMode: 'puzzle' }),
  });

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function saveAuthority() {
    if (MODE_ACCESS_SAVE_MANAGER) return MODE_ACCESS_SAVE_MANAGER;
    try {
      const root = typeof globalThis === 'object' && globalThis ? globalThis : null;
      if (root?.SaveManager) return root.SaveManager;
    } catch (_) {}
    try { if (typeof SaveManager !== 'undefined' && SaveManager) return SaveManager; } catch (_) {}
    return null;
  }

  function int(value, fallback = 0) {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }

  function scoreThreshold(modeId, save = {}) {
    const key = MODE_RULES[modeId]?.balanceKey;
    const configured = typeof GAME_BALANCE !== 'undefined' ? GAME_BALANCE?.modeUnlocks?.[key] : undefined;
    // The fallback is only for an isolated evaluator. Full builds always read
    // the existing GAME_BALANCE authority instead of copying a second value.
    return int(configured, key === 'fmf' ? 600 : key === 'tc' ? 1500 : 0);
  }

  function normalizeGrants(raw) {
    if (!isRecord(raw)) return {};
    const grants = {};
    for (const id of KNOWN_MODE_IDS) {
      const record = raw[id];
      if (record === true) {
        grants[id] = { source: 'legacy', grantedAtMs: 0 };
      } else if (isRecord(record)) {
        grants[id] = {
          source: String(record.source || 'reconciled').slice(0, 64),
          grantedAtMs: int(record.grantedAtMs),
        };
      }
    }
    return grants;
  }

  function normalizeRoot(raw) {
    const source = isRecord(raw) ? raw : {};
    const grants = normalizeGrants(source.grants);
    return {
      schemaVersion: SCHEMA_VERSION,
      policyVersion: int(source.policyVersion, 0),
      migratedFromLegacy: source.migratedFromLegacy === true,
      grants,
    };
  }

  function grantsFrom(save) {
    return normalizeRoot(save?.modeAccess).grants;
  }

  function storyOrderFacts(feastfallSave, orderCatalog) {
    const orders = isRecord(feastfallSave?.orders) ? feastfallSave.orders : {};
    const validIds = new Set((Array.isArray(orderCatalog) ? orderCatalog : [])
      .map(order => String(order?.id || ''))
      .filter(Boolean));
    const ids = [...validIds].filter(id => int(orders[id]) >= 1).sort();
    return { count: ids.length, ids };
  }

  function puzzleFacts(save) {
    const stars = isRecord(save?.puzzleProgress?.levelStars) ? save.puzzleProgress.levelStars : {};
    const ids = PUZZLE_CAMPAIGN_LEVEL_IDS.filter(id => int(stars[id]) >= 1);
    return { count: ids.length, ids };
  }

  function arcadeRunFacts(save) {
    const perMode = isRecord(save?.stats?.perMode) ? save.stats.perMode : {};
    const standardGames = int(perMode.standard?.gamesPlayed);
    // Older valid saves only have the aggregate total. Treat one completed
    // Arcade session as evidence in that case, while a mode-specific record
    // remains the preferred proof for current saves.
    const aggregateGames = int(save?.stats?.totalGamesPlayed);
    return { count: Math.max(standardGames, aggregateGames > 0 && !Object.keys(perMode).length ? 1 : 0) };
  }

  function factsFor(save = {}, options = {}) {
    const feastfall = storyOrderFacts(
      options.feastfallSave || (typeof feastfallReadSave === 'function' ? feastfallReadSave() : {}),
      options.orderCatalog || (typeof feastfallAllOrders === 'function' ? feastfallAllOrders() : []),
    );
    const puzzle = puzzleFacts(save);
    const arcade = arcadeRunFacts(save);
    const bestScore = int(save.bestScore);
    return Object.freeze({ bestScore, feastfall, puzzle, arcade });
  }

  function legacyPreserved(id, options = {}) {
    if (!LEGACY_FREE_MODE_IDS.includes(id)) return false;
    if (options.legacyExistingSave === true) return true;
    // The authenticated local development/benchmark host is an operator
    // surface whose purpose is to exercise every shipped route. Keep that
    // exception URL-scoped; production player URLs never receive it.
    try {
      const query = new URLSearchParams(globalThis?.location?.search || '');
      return query.get('ffDevHost') === '1' || query.get('ffBenchmark') === '1' || query.get('dev') === '1';
    } catch (_) { return false; }
  }

  function evaluate(modeId, save = {}, options = {}) {
    const id = String(modeId || '').toLowerCase();
    const rule = MODE_RULES[id];
    if (!rule) {
      return Object.freeze({ id, known: false, unlocked: false, granted: false, reason: 'unknown-mode', requirement: 'Unavailable' });
    }
    const facts = options.facts || factsFor(save, options);
    const grants = grantsFrom(save);
    const granted = isRecord(grants[id]);
    let unlocked = granted || rule.kind === 'always' || legacyPreserved(id, options);
    let reason = granted ? 'durable-grant' : (legacyPreserved(id, options) ? 'legacy-preserved' : rule.kind === 'always' ? 'always-available' : 'requirements-incomplete');
    let progress = Object.freeze({});

    if (!unlocked && rule.kind === 'score') {
      const target = scoreThreshold(id, save);
      progress = Object.freeze({ route: 'best-score', current: facts.bestScore, target, complete: facts.bestScore >= target });
      unlocked = progress.complete;
      if (unlocked) reason = 'score-qualified';
    } else if (!unlocked && rule.kind === 'feastfall-orders') {
      progress = Object.freeze({ route: 'feastfall-orders', current: facts.feastfall.count, target: 6, complete: facts.feastfall.count >= 6, ids: facts.feastfall.ids.slice() });
      unlocked = progress.complete;
      if (unlocked) reason = 'feastfall-qualified';
    } else if (!unlocked && rule.kind === 'puzzle-level') {
      const complete = facts.puzzle.ids.includes(rule.levelId);
      progress = Object.freeze({ route: 'puzzle-level', levelId: rule.levelId, current: complete ? 1 : 0, target: 1, complete });
      unlocked = complete;
      if (unlocked) reason = 'puzzle-qualified';
    } else if (!unlocked && rule.kind === 'any') {
      const score = Object.freeze({ route: 'best-score', current: facts.bestScore, target: 600, complete: facts.bestScore >= 600 });
      const orders = Object.freeze({ route: 'feastfall-orders', current: facts.feastfall.count, target: 6, complete: facts.feastfall.count >= 6, ids: facts.feastfall.ids.slice() });
      const puzzle = Object.freeze({ route: 'puzzle-levels', current: facts.puzzle.count, target: 6, complete: facts.puzzle.count >= 6, ids: facts.puzzle.ids.slice() });
      progress = Object.freeze({ routes: Object.freeze([score, orders, puzzle]), complete: score.complete || orders.complete || puzzle.complete });
      unlocked = progress.complete;
      if (unlocked) reason = 'route-qualified';
    }

    if (id === 'zen' && !unlocked) {
      const routes = Object.freeze({
        arcade: Object.freeze({ route: 'arcade-run', current: facts.arcade.count, target: 1, complete: facts.arcade.count >= 1 }),
        feastfall: Object.freeze({ route: 'feastfall-order', current: facts.feastfall.count, target: 1, complete: facts.feastfall.count >= 1 }),
        puzzle: Object.freeze({ route: 'puzzle-level', current: facts.puzzle.count, target: 1, complete: facts.puzzle.count >= 1 }),
      });
      progress = Object.freeze({ routes: Object.freeze(Object.values(routes)), complete: Object.values(routes).some(route => route.complete) });
      unlocked = progress.complete;
      if (unlocked) reason = 'participation-qualified';
    }

    return Object.freeze({
      id,
      known: true,
      unlocked: Boolean(unlocked),
      granted,
      grant: granted ? Object.freeze({ ...grants[id] }) : null,
      requirement: rule.requirement,
      label: rule.label,
      actionMode: rule.actionMode || id,
      progress,
      reason,
    });
  }

  function legacyEvidence() {
    try {
      const authority = saveAuthority();
      return typeof authority?.hasPersistedSave === 'function' && authority.hasPersistedSave() === true;
    } catch (_) { return false; }
  }

  function durableMutation(mutator) {
    const authority = saveAuthority();
    if (!authority || typeof authority.set !== 'function') return { ok: false, reason: 'save-unavailable' };
    if (typeof authority.setDurable === 'function') {
      const outcome = authority.setDurable(mutator);
      return { ok: outcome?.ok === true, reason: outcome?.ok === true ? null : 'write-failed' };
    }
    try {
      authority.set(mutator);
      const flushed = typeof authority.flushNow === 'function' ? authority.flushNow() : authority.flush?.();
      return { ok: flushed !== false, reason: flushed === false ? 'write-failed' : null };
    } catch (_) { return { ok: false, reason: 'write-failed' }; }
  }

  function currentFacts(save) {
    return factsFor(save, {});
  }

  function reconcile({ reason = 'reconcile', emit = true } = {}) {
    const authority = saveAuthority();
    if (!authority || typeof authority.get !== 'function') return Object.freeze({ ok: false, changed: false, granted: [], reason: 'save-unavailable' });
    const before = authority.get() || {};
    const existingRoot = normalizeRoot(before.modeAccess);
    const hadPolicy = isRecord(before.modeAccess) && existingRoot.policyVersion === SCHEMA_VERSION;
    const legacy = !hadPolicy && legacyEvidence();
    const facts = currentFacts(before);
    const planned = [];
    for (const id of KNOWN_MODE_IDS) {
      if (existingRoot.grants[id]) continue;
      if (legacy && LEGACY_FREE_MODE_IDS.includes(id)) {
        planned.push({ id, source: 'legacy-migration' });
        continue;
      }
      const result = evaluate(id, { ...before, modeAccess: { ...existingRoot, grants: existingRoot.grants } }, { facts });
      if (result.unlocked && !['standard', 'feastfall-story', 'puzzle'].includes(id)) planned.push({ id, source: result.reason });
    }
    const needsRootWrite = !hadPolicy || JSON.stringify(existingRoot) !== JSON.stringify(normalizeRoot(before.modeAccess));
    if (!needsRootWrite && planned.length === 0) return Object.freeze({ ok: true, changed: false, granted: [], statuses: statuses(before, facts), reason });

    const outcome = durableMutation(save => {
      const current = normalizeRoot(save.modeAccess);
      current.schemaVersion = SCHEMA_VERSION;
      current.policyVersion = SCHEMA_VERSION;
      current.migratedFromLegacy = current.migratedFromLegacy === true || legacy;
      current.grants = normalizeGrants(current.grants);
      for (const item of planned) {
        if (current.grants[item.id]) continue;
        current.grants[item.id] = { source: item.source, grantedAtMs: Date.now() };
      }
      save.modeAccess = current;
    });
    if (!outcome.ok) return Object.freeze({ ok: false, changed: false, granted: [], statuses: statuses(before, facts), reason: outcome.reason });
    const after = authority.get() || {};
    const added = planned.filter(item => isRecord(after.modeAccess?.grants?.[item.id]));
    if (emit && typeof EventBus !== 'undefined') {
      for (const item of added) EventBus.emit('modeAccessGranted', Object.freeze({ modeId: item.id, source: item.source, reason }));
    }
    return Object.freeze({ ok: true, changed: true, granted: added.map(item => item.id), statuses: statuses(after, currentFacts(after)), reason });
  }

  function statuses(save, facts) {
    return Object.freeze(KNOWN_MODE_IDS.map(id => evaluate(id, save, { facts })));
  }

  function status(modeId) {
    reconcile({ emit: false });
    const authority = saveAuthority();
    const save = authority && typeof authority.get === 'function' ? authority.get() : {};
    return evaluate(modeId, save, { facts: currentFacts(save) });
  }

  function isUnlocked(modeId) { return status(modeId).unlocked === true; }

  function notifyLocked(modeId) {
    const result = status(modeId);
    if (result.unlocked) return result;
    if (typeof EventBus !== 'undefined') EventBus.emit('modeAccessLocked', result);
    return result;
  }

  // Reconcile only from committed, mode-owned facts. Daily/Featured Puzzle
  // events intentionally do not reach this listener as they carry a lane.
  if (typeof EventBus !== 'undefined' && typeof EventBus.on === 'function') {
    EventBus.on('gameOver', () => reconcile({ reason: 'arcade-run-complete' }));
    EventBus.on('feastfallOrderComplete', payload => {
      if (payload?.result === 'won' && int(payload?.stars) >= 1) reconcile({ reason: 'feastfall-order-complete' });
    });
    EventBus.on('puzzleNextLevelComplete', payload => {
      if (payload?.lane === 'daily' || payload?.lane === 'featured' || payload?.featured === true) return;
      if (PUZZLE_CAMPAIGN_LEVEL_IDS.includes(String(payload?.levelId || '')) && int(payload?.stars) >= 1) reconcile({ reason: 'puzzle-campaign-complete' });
    });
  }

  // Initialize policy state once at boot. A truly new save has no persisted
  // primary, so it receives the new gates; an old persisted save receives only
  // the three modes that were previously free.
  try { reconcile({ reason: 'boot', emit: false }); } catch (_) {}

  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    knownModeIds: [...KNOWN_MODE_IDS],
    legacyFreeModeIds: [...LEGACY_FREE_MODE_IDS],
    puzzleCampaignLevelIds: [...PUZZLE_CAMPAIGN_LEVEL_IDS],
    rules: MODE_RULES,
    evaluate,
    factsFor,
    normalizeRoot,
    reconcile,
    status,
    statuses: () => {
      const authority = saveAuthority();
      const save = authority && typeof authority.get === 'function' ? authority.get() : {};
      return statuses(save, currentFacts(save));
    },
    isUnlocked,
    notifyLocked,
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ModeAccess = ModeAccess;
