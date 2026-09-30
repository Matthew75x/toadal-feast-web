// ============================================================
// feast-orders.js — Character Feast Orders pilot
// ============================================================
// Full-game, offline-safe daily retention system. Three authored orders use
// the stable Arcade food IDs already present in balance.js. Progress is
// cumulative across runs, rewards are atomic, and mission rewards never alter
// competitive score. A small permanent affinity bonus is part of each pilot
// character's normal identity, not a rotating daily modifier.

const FEAST_ORDER_CONFIG = Object.freeze({
  schemaVersion: 1,
  claimReason: 'feastOrderComplete',
  plateReason: 'feastStampPlate',
  affinityMultiplier: 0.15,
  stampTarget: 7,
  stampRewardCoins: 100,
  maxIngredientProgress: 999,
  spawnAssistMinChance: 0.20,
  spawnAssistMaxChance: 0.30,
});

const FEAST_ORDER_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'feast-order-ninja-bento',
    characterId: 'ninja',
    title: "Ninja's Midnight Bento",
    subtitle: 'Build a precise sushi supper.',
    accent: '#9f5cff',
    rewardCoins: 60,
    affinityItemIds: Object.freeze(['food.maki-roll', 'food.salmon-nigiri', 'food.shrimp-nigiri']),
    ingredients: Object.freeze([
      Object.freeze({ id: 'rolls', label: 'Maki Rolls', target: 2, iconItemId: 'food.maki-roll', itemIds: Object.freeze(['food.maki-roll']), priority: 100 }),
      Object.freeze({ id: 'sweet', label: 'Sweet Finish', target: 1, iconItemId: 'food.donut', categories: Object.freeze(['dessert']), priority: 10 }),
    ]),
  }),
  Object.freeze({
    id: 'feast-order-princess-candy',
    characterId: 'princess',
    title: "Princess Lily's Royal Candy Tray",
    subtitle: 'Fill a sparkling tray with sweets and fruit.',
    accent: '#ff77bd',
    rewardCoins: 65,
    affinityItemIds: Object.freeze(['food.hard-candy', 'food.chocolate', 'food.donut', 'food.cookie', 'food.red-velvet-cake', 'food.cupcake']),
    ingredients: Object.freeze([
      Object.freeze({ id: 'candy', label: 'Candy', target: 4, iconItemId: 'food.hard-candy', itemIds: Object.freeze(['food.hard-candy', 'food.chocolate']), priority: 100 }),
      Object.freeze({ id: 'pastry', label: 'Pastries', target: 2, iconItemId: 'food.cupcake', itemIds: Object.freeze(['food.donut', 'food.cookie', 'food.red-velvet-cake', 'food.cupcake']), priority: 80 }),
      Object.freeze({ id: 'fruit', label: 'Fresh Fruit', target: 1, iconItemId: 'food.strawberry', categories: Object.freeze(['fruit']), priority: 10 }),
    ]),
  }),
  Object.freeze({
    id: 'feast-order-chomper-combo',
    characterId: 'chomper',
    title: "Chomper's Ultimate Combo Meal",
    subtitle: 'Assemble the biggest drive-through tray.',
    accent: '#ff9b46',
    rewardCoins: 70,
    affinityItemIds: Object.freeze(['food.burger', 'food.fries', 'food.pizza', 'food.fried-chicken', 'food.pretzel', 'food.cheese']),
    ingredients: Object.freeze([
      Object.freeze({ id: 'burger', label: 'Burger', target: 1, iconItemId: 'food.burger', itemIds: Object.freeze(['food.burger']), priority: 120 }),
      Object.freeze({ id: 'fries', label: 'Fries', target: 1, iconItemId: 'food.fries', itemIds: Object.freeze(['food.fries']), priority: 120 }),
      Object.freeze({ id: 'pizza', label: 'Pizza', target: 1, iconItemId: 'food.pizza', itemIds: Object.freeze(['food.pizza']), priority: 120 }),
      Object.freeze({ id: 'extras', label: 'Combo Extras', target: 2, iconItemId: 'food.fried-chicken', itemIds: Object.freeze(['food.burger', 'food.fries', 'food.pizza', 'food.fried-chicken', 'food.pretzel', 'food.cheese']), priority: 20 }),
    ]),
  }),
]);

const FEAST_ORDER_BY_ID = Object.freeze(Object.fromEntries(FEAST_ORDER_DEFINITIONS.map(order => [order.id, order])));
const FEAST_ORDER_BY_CHARACTER = Object.freeze(Object.fromEntries(FEAST_ORDER_DEFINITIONS.map(order => [order.characterId, order])));

function feastOrderDayKey(now = Date.now()) {
  const date = new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function feastOrderSafeInt(value, fallback = 0, max = 1_000_000) {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) ? Math.max(0, Math.min(max, numeric)) : fallback;
}

function feastOrderIsCharacterUnlocked(characterId, save = (typeof SaveManager !== 'undefined' ? SaveManager.get() : {})) {
  const definition = typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA.find(character => character.id === characterId) : null;
  if (!definition) return false;
  if (typeof isCharacterPlayerSelectable === 'function' && !isCharacterPlayerSelectable(definition)) return false;
  if (Number(definition.coinCost || 0) <= 0) return true;
  return Array.isArray(save?.unlockedChars) && save.unlockedChars.includes(characterId);
}

function normalizeFeastOrdersLedger(raw, now = Date.now()) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const today = feastOrderDayKey(now);
  const lastAcceptedDayKey = /^\d{4}-\d{2}-\d{2}$/.test(String(source.lastAcceptedDayKey || ''))
    ? String(source.lastAcceptedDayKey)
    : today;
  const dayKey = today < lastAcceptedDayKey ? lastAcceptedDayKey : today;
  const sameDay = source.dayKey === dayKey;
  const orderProgress = {};
  if (sameDay && source.orderProgress && typeof source.orderProgress === 'object' && !Array.isArray(source.orderProgress)) {
    FEAST_ORDER_DEFINITIONS.forEach(order => {
      const rawOrder = source.orderProgress[order.id];
      if (!rawOrder || typeof rawOrder !== 'object' || Array.isArray(rawOrder)) return;
      const ingredients = {};
      order.ingredients.forEach(ingredient => {
        ingredients[ingredient.id] = Math.min(
          ingredient.target,
          feastOrderSafeInt(rawOrder.ingredients?.[ingredient.id], 0, FEAST_ORDER_CONFIG.maxIngredientProgress),
        );
      });
      orderProgress[order.id] = {
        ingredients,
        completed: rawOrder.completed === true,
        rewardGranted: rawOrder.rewardGranted === true,
        completedAtMs: feastOrderSafeInt(rawOrder.completedAtMs, 0, Number.MAX_SAFE_INTEGER),
      };
    });
  }
  const pinnedCandidate = String(source.pinnedOrderId || '');
  const revengeSource = sameDay && source.revenge && typeof source.revenge === 'object' && !Array.isArray(source.revenge)
    ? source.revenge
    : null;
  const revengeOrderId = String(revengeSource?.orderId || '');
  return {
    schemaVersion: FEAST_ORDER_CONFIG.schemaVersion,
    dayKey,
    lastAcceptedDayKey: dayKey,
    orderProgress,
    pinnedOrderId: FEAST_ORDER_BY_ID[pinnedCandidate] ? pinnedCandidate : null,
    stampProgress: feastOrderSafeInt(source.stampProgress, 0, FEAST_ORDER_CONFIG.stampTarget - 1),
    totalOrdersCompleted: feastOrderSafeInt(source.totalOrdersCompleted, 0, 1_000_000),
    revenge: FEAST_ORDER_BY_ID[revengeOrderId] ? {
      orderId: revengeOrderId,
      characterId: FEAST_ORDER_BY_ID[revengeOrderId].characterId,
      targetWave: Math.max(1, feastOrderSafeInt(revengeSource.targetWave, 1, 999)),
      active: revengeSource.active === true,
      completed: revengeSource.completed === true,
      rewardGranted: revengeSource.rewardGranted === true,
      createdAtMs: feastOrderSafeInt(revengeSource.createdAtMs, 0, Number.MAX_SAFE_INTEGER),
    } : null,
  };
}

function feastOrderFoodMatchesIngredient(food, ingredient) {
  const itemId = String(food?.itemId || '');
  const category = String(food?.category || '');
  return (Array.isArray(ingredient?.itemIds) && ingredient.itemIds.includes(itemId))
    || (Array.isArray(ingredient?.categories) && ingredient.categories.includes(category));
}

const FeastOrdersManager = (() => {
  function getLedger(now = Date.now()) {
    const root = typeof SaveManager !== 'undefined' ? SaveManager.get() : {};
    const normalized = normalizeFeastOrdersLedger(root?.feastOrders, now);
    const stored = root?.feastOrders;
    const needsPersist = !stored
      || stored.dayKey !== normalized.dayKey
      || stored.lastAcceptedDayKey !== normalized.lastAcceptedDayKey;
    if (needsPersist && typeof SaveManager !== 'undefined') {
      SaveManager.set(draft => { draft.feastOrders = normalized; });
    }
    return normalized;
  }

  function getOrderState(order, ledger = getLedger()) {
    const raw = ledger.orderProgress[order.id] || { ingredients: {}, completed: false, rewardGranted: false, completedAtMs: 0 };
    const ingredients = order.ingredients.map(ingredient => ({
      id: ingredient.id,
      label: ingredient.label,
      iconItemId: ingredient.iconItemId || ingredient.itemIds?.[0] || '',
      target: ingredient.target,
      progress: Math.min(ingredient.target, feastOrderSafeInt(raw.ingredients?.[ingredient.id], 0, ingredient.target)),
    }));
    const progressTotal = ingredients.reduce((sum, ingredient) => sum + ingredient.progress, 0);
    const targetTotal = ingredients.reduce((sum, ingredient) => sum + ingredient.target, 0);
    const complete = ingredients.every(ingredient => ingredient.progress >= ingredient.target);
    return Object.freeze({
      id: order.id,
      characterId: order.characterId,
      title: order.title,
      subtitle: order.subtitle,
      accent: order.accent,
      rewardCoins: order.rewardCoins,
      unlocked: feastOrderIsCharacterUnlocked(order.characterId),
      pinned: ledger.pinnedOrderId === order.id,
      complete,
      rewardGranted: raw.rewardGranted === true,
      progressTotal,
      targetTotal,
      remainingTotal: Math.max(0, targetTotal - progressTotal),
      completionRatio: targetTotal > 0 ? progressTotal / targetTotal : 1,
      ingredients: Object.freeze(ingredients.map(Object.freeze)),
    });
  }

  function getDashboard(now = Date.now()) {
    const ledger = getLedger(now);
    const orders = FEAST_ORDER_DEFINITIONS.map(order => getOrderState(order, ledger));
    const firstUnlockedIncomplete = orders.find(order => order.unlocked && !order.complete);
    return Object.freeze({
      dayKey: ledger.dayKey,
      orders: Object.freeze(orders),
      pinnedOrderId: ledger.pinnedOrderId || firstUnlockedIncomplete?.id || null,
      stampProgress: ledger.stampProgress,
      stampTarget: FEAST_ORDER_CONFIG.stampTarget,
      stampRewardCoins: FEAST_ORDER_CONFIG.stampRewardCoins,
      revenge: ledger.revenge ? Object.freeze({ ...ledger.revenge }) : null,
    });
  }

  function persistLedger(mutator, now = Date.now()) {
    if (typeof SaveManager === 'undefined') return null;
    let result = null;
    SaveManager.set(root => {
      const ledger = normalizeFeastOrdersLedger(root.feastOrders, now);
      result = mutator(ledger, root) || null;
      root.feastOrders = normalizeFeastOrdersLedger(ledger, now);
    });
    return result;
  }

  function awardInTransaction(root, amount) {
    if (typeof ProgressionManager === 'undefined' || typeof ProgressionManager.awardCoinsInTransaction !== 'function') {
      return { amount: 0, total: Math.max(0, Math.floor(Number(root?.coins) || 0)), reason: 'wallet-authority-unavailable' };
    }
    return ProgressionManager.awardCoinsInTransaction(root, amount);
  }

  function restoreRootSnapshot(root, snapshotJson) {
    if (!snapshotJson) return null;
    try {
      const snapshot = JSON.parse(snapshotJson);
      if (typeof restoreSaveDocumentInPlace === 'function') restoreSaveDocumentInPlace(root, snapshotJson);
      else {
        for (const key of Object.keys(root)) if (!Object.prototype.hasOwnProperty.call(snapshot, key)) delete root[key];
        Object.assign(root, snapshot);
      }
      return snapshot;
    } catch (_) { return null; }
  }

  function restoreTransactionSnapshot(root, ledger, snapshotJson, now) {
    const snapshot = restoreRootSnapshot(root, snapshotJson);
    if (!snapshot) return false;
    const restoredLedger = normalizeFeastOrdersLedger(snapshot.feastOrders, now);
    for (const key of Object.keys(ledger)) delete ledger[key];
    Object.assign(ledger, restoredLedger);
    return true;
  }

  function ensurePinnedOrder() {
    const dashboard = getDashboard();
    if (dashboard.pinnedOrderId && getLedger().pinnedOrderId) return dashboard.pinnedOrderId;
    const candidate = dashboard.orders.find(order => order.unlocked && !order.complete) || dashboard.orders.find(order => order.unlocked);
    if (candidate) pinOrder(candidate.id);
    return candidate?.id || null;
  }

  function pinOrder(orderId, now = Date.now()) {
    const id = String(orderId || '');
    const order = FEAST_ORDER_BY_ID[id];
    if (!order || !feastOrderIsCharacterUnlocked(order.characterId)) return Object.freeze({ ok: false, reason: 'locked' });
    persistLedger(ledger => { ledger.pinnedOrderId = id; }, now);
    const snapshot = getDashboard(now);
    EventBus?.emit?.('feastOrdersChanged', { reason: 'pin', snapshot });
    return Object.freeze({ ok: true, orderId: id, snapshot });
  }

  function getAffinityScoreBonus(characterId, itemId, basePoints) {
    const order = FEAST_ORDER_BY_CHARACTER[String(characterId || '')];
    const favourite = typeof isArcadeFavouriteFood === 'function'
      ? isArcadeFavouriteFood(characterId, itemId)
      : Boolean(order?.affinityItemIds.includes(String(itemId || '')));
    if (!favourite) return 0;
    return Math.max(1, Math.round(Math.max(0, Number(basePoints) || 0) * FEAST_ORDER_CONFIG.affinityMultiplier));
  }

  function ingredientEligibleFoodIds(ingredient) {
    const eligible = [];
    if (Array.isArray(ingredient?.itemIds)) eligible.push(...ingredient.itemIds);
    if (Array.isArray(ingredient?.categories) && typeof ARCADE_FOOD_DEFINITIONS !== 'undefined') {
      ARCADE_FOOD_DEFINITIONS.forEach(food => {
        if (ingredient.categories.includes(food.category)) eligible.push(food.itemId);
      });
    }
    return [...new Set(eligible)].filter(itemId => typeof ARCADE_FOOD_BY_ID === 'undefined' || ARCADE_FOOD_BY_ID[itemId]);
  }

  function weightedChoice(entries, rng = Math.random) {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
    if (total <= 0) return entries[0] || null;
    let roll = Math.max(0, Math.min(0.999999999, Number(rng()) || 0)) * total;
    for (const entry of entries) {
      roll -= Math.max(0, Number(entry.weight) || 0);
      if (roll < 0) return entry;
    }
    return entries.at(-1) || null;
  }

  function getSpawnAssistPlan(characterId, rng = Math.random) {
    const dashboard = getDashboard();
    const orderState = dashboard.orders.find(entry => entry.id === dashboard.pinnedOrderId);
    if (!orderState || orderState.complete || orderState.characterId !== String(characterId || '')) return null;
    const definition = FEAST_ORDER_BY_ID[orderState.id];
    if (!definition) return null;

    const foodCount = Math.max(1, typeof ARCADE_FOOD_DEFINITIONS !== 'undefined' ? ARCADE_FOOD_DEFINITIONS.length : 1);
    const ingredientStates = new Map(orderState.ingredients.map(ingredient => [ingredient.id, ingredient]));
    const weightedIngredients = definition.ingredients.map(ingredient => {
      const state = ingredientStates.get(ingredient.id);
      const remaining = Math.max(0, Number(state?.target || ingredient.target) - Number(state?.progress || 0));
      const eligibleItemIds = ingredientEligibleFoodIds(ingredient);
      if (remaining <= 0 || !eligibleItemIds.length) return null;
      const scarcity = foodCount / eligibleItemIds.length;
      const priorityFactor = Math.max(0.6, Math.min(1.25, Number(ingredient.priority || 100) / 100));
      return { ingredient, remaining, eligibleItemIds, weight: remaining * scarcity * priorityFactor };
    }).filter(Boolean);
    if (!weightedIngredients.length) return null;

    const completionRatio = Math.max(0, Math.min(1, Number(orderState.completionRatio) || 0));
    const chance = FEAST_ORDER_CONFIG.spawnAssistMinChance
      + (FEAST_ORDER_CONFIG.spawnAssistMaxChance - FEAST_ORDER_CONFIG.spawnAssistMinChance) * completionRatio;
    const selected = weightedChoice(weightedIngredients, rng);
    if (!selected) return null;
    const itemIndex = Math.floor(Math.max(0, Math.min(0.999999999, Number(rng()) || 0)) * selected.eligibleItemIds.length);
    return Object.freeze({ orderId: orderState.id, ingredientId: selected.ingredient.id, itemId: selected.eligibleItemIds[itemIndex], chance, remaining: selected.remaining });
  }

  function pickSpawnFoodId(characterId, fallbackPicker = null, rng = Math.random) {
    const fallback = typeof fallbackPicker === 'function'
      ? fallbackPicker
      : () => (typeof randomArcadeFoodId === 'function' ? randomArcadeFoodId() : 'food.apple');
    const plan = getSpawnAssistPlan(characterId, rng);
    if (!plan || Math.max(0, Math.min(0.999999999, Number(rng()) || 0)) >= plan.chance) return fallback();
    return plan.itemId || fallback();
  }

  function recordCatch(payload = {}, now = Date.now()) {
    const characterId = String(payload.characterId || '');
    const order = FEAST_ORDER_BY_CHARACTER[characterId];
    if (!order || !feastOrderIsCharacterUnlocked(characterId)) return Object.freeze({ matched: false });
    const food = { itemId: String(payload.itemId || ''), category: String(payload.category || '') };
    const candidates = order.ingredients
      .filter(ingredient => feastOrderFoodMatchesIngredient(food, ingredient))
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    if (!candidates.length) return Object.freeze({ matched: false });

    let outcome = null;
    let snapshotJson = null;
    persistLedger((ledger, root) => {
      try { snapshotJson = JSON.stringify(root); } catch (_) { snapshotJson = null; }
      const state = ledger.orderProgress[order.id] || { ingredients: {}, completed: false, rewardGranted: false, completedAtMs: 0 };
      state.ingredients = state.ingredients && typeof state.ingredients === 'object' ? state.ingredients : {};
      const chosen = candidates.find(ingredient => feastOrderSafeInt(state.ingredients[ingredient.id], 0, ingredient.target) < ingredient.target);
      if (!chosen || state.completed) {
        ledger.orderProgress[order.id] = state;
        outcome = { matched: true, advanced: false, orderId: order.id };
        return;
      }
      const prior = feastOrderSafeInt(state.ingredients[chosen.id], 0, chosen.target);
      state.ingredients[chosen.id] = Math.min(chosen.target, prior + 1);
      const completed = order.ingredients.every(ingredient => feastOrderSafeInt(state.ingredients[ingredient.id], 0, ingredient.target) >= ingredient.target);
      let reward = null;
      let plateReward = null;
      if (completed && !state.rewardGranted) {
        reward = awardInTransaction(root, order.rewardCoins);
        if (!reward || reward.amount !== order.rewardCoins) {
          if (!restoreTransactionSnapshot(root, ledger, snapshotJson, now)) {
            state.ingredients[chosen.id] = prior;
            ledger.orderProgress[order.id] = state;
          }
          outcome = { matched: true, advanced: false, orderId: order.id, reason: reward?.reason || 'wallet-award-failed' };
          return;
        }
        state.completed = true;
        state.rewardGranted = true;
        state.completedAtMs = Math.floor(now);
        ledger.totalOrdersCompleted += 1;
        ledger.stampProgress += 1;
        if (ledger.stampProgress >= FEAST_ORDER_CONFIG.stampTarget) {
          plateReward = awardInTransaction(root, FEAST_ORDER_CONFIG.stampRewardCoins);
          if (!plateReward || plateReward.amount !== FEAST_ORDER_CONFIG.stampRewardCoins) {
            restoreTransactionSnapshot(root, ledger, snapshotJson, now);
            outcome = { matched: true, advanced: false, orderId: order.id, reason: plateReward?.reason || 'plate-wallet-award-failed' };
            return;
          }
          ledger.stampProgress = 0;
        }
      }
      ledger.orderProgress[order.id] = state;
      if (!ledger.pinnedOrderId) ledger.pinnedOrderId = order.id;
      outcome = {
        matched: true,
        advanced: true,
        orderId: order.id,
        ingredientId: chosen.id,
        ingredientLabel: chosen.label,
        ingredientProgress: state.ingredients[chosen.id],
        ingredientTarget: chosen.target,
        completed,
        ingredientCompleted: state.ingredients[chosen.id] >= chosen.target,
        rewardCoins: reward?.amount || 0,
        coinTotal: reward?.total,
        plateRewardCoins: plateReward?.amount || 0,
        plateCoinTotal: plateReward?.total,
      };
    }, now);

    if (outcome?.advanced && ((outcome.rewardCoins || 0) > 0 || (outcome.plateRewardCoins || 0) > 0)) {
      const durable = typeof SaveManager !== 'undefined' && typeof SaveManager.flushNow === 'function' ? SaveManager.flushNow() : true;
      if (durable !== true) {
        restoreRootSnapshot(SaveManager.get(), snapshotJson);
        return Object.freeze({ matched: true, advanced: false, reason: 'storage-write-failed', snapshot: getDashboard(now) });
      }
    }

    const snapshot = getDashboard(now);
    if (outcome?.advanced) {
      EventBus?.emit?.('feastOrderProgress', { ...outcome, snapshot });
      EventBus?.emit?.('feastOrdersChanged', { reason: outcome.completed ? 'complete' : 'progress', snapshot });
      if (outcome.rewardCoins > 0) EventBus?.emit?.('coinsAwarded', { amount: outcome.rewardCoins, reason: FEAST_ORDER_CONFIG.claimReason, total: outcome.coinTotal });
      if (outcome.plateRewardCoins > 0) EventBus?.emit?.('coinsAwarded', { amount: outcome.plateRewardCoins, reason: FEAST_ORDER_CONFIG.plateReason, total: outcome.plateCoinTotal });
      if (outcome.completed) EventBus?.emit?.('feastOrderCompleted', { ...outcome, order: getOrderState(order, getLedger(now)), snapshot });
    }
    return Object.freeze({ ...(outcome || { matched: false }), snapshot });
  }

  function getPinnedOrder(now = Date.now()) {
    ensurePinnedOrder();
    const dashboard = getDashboard(now);
    return dashboard.orders.find(order => order.id === dashboard.pinnedOrderId) || null;
  }

  function getResultSummary(gameOverPayload = {}, now = Date.now()) {
    const pinned = getPinnedOrder(now);
    return Object.freeze({ pinned, dashboard: getDashboard(now) });
  }

  ensurePinnedOrder();

  return Object.freeze({
    CONFIG: FEAST_ORDER_CONFIG,
    definitions: FEAST_ORDER_DEFINITIONS,
    getDashboard,
    getPinnedOrder,
    pinOrder,
    recordCatch,
    getAffinityScoreBonus,
    pickSpawnFoodId,
    getSpawnAssistPlan,
    getResultSummary,
    isCharacterUnlocked: feastOrderIsCharacterUnlocked,
  });
})();
