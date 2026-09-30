// ============================================================
// src/runtime/shared/progression.js — Permanent Progression System
// Load order: after src/runtime/shared/systems.js, before game.js
// Creates globals: ProgressionManager, GIFT_BOX_CONFIG
// Consumes: SaveManager, EventBus, CHARACTER_DATA, ContentAssetResolver,
//           ACHIEVEMENT_DATA (src/runtime/shared/modes.js), ITEM_SHOP_DATA (src/runtime/shared/shop.js)
// ============================================================
//
// ARCHITECTURE
// ------------
// All progression state lives in SaveManager (localStorage) under
// the keys defined in _SAVE_DEFAULTS. ProgressionManager never
// mutates those keys directly — it always goes through SaveManager.set()
// so persistence is guaranteed on every change.
//
// EventBus integration means gameplay code only needs to emit
// the same events it already fires ('gameOver', 'foodCaught', etc.)
// and progression updates happen automatically with zero coupling.
//
// HOW TO EXTEND
// -------------
// • New coin source          → call ProgressionManager.awardCoins(n, reason)
//   anywhere and emit 'coinsAwarded' via EventBus.
// • New gift-box reward tier → add an entry to GIFT_BOX_CONFIG.rewards
// • New achievement          → add to ACHIEVEMENT_DATA in src/runtime/shared/modes.js;
//   the achievement system here reads that array at runtime.
// • New purchasable item     → use a validated generated content record or
//   approved native cosmetic definition; ProgressionManager resolves native and generated catalogs.
// ============================================================

// ──────────────────────────────────────────────────────────
// SAVE DEFAULTS — injected via migration (see below)
// ──────────────────────────────────────────────────────────
const PROGRESSION_SAVE_DEFAULTS = {
  coins: 0,
  achievementRewardsClaimed: [],  // array of achievement ids already paid out
  lifetimeCoinsEarned: 0,         // for stats display only — never spent
  revengeStreak: 0,               // legacy field retained for save compatibility; no active reward path
};

// ──────────────────────────────────────────────────────────
// REVENGE STREAK BONUS CONFIG
// ──────────────────────────────────────────────────────────
// Legacy Revenge streak constants remain only to read older saves. The active
// unified challenge system has fixed, explicit rewards and does not use streaks.
// Streak 1 = base %, +stepPct per streak after that, capped at maxBonusPct.
// The absolute coin payout is also capped (maxBonusCoins) so huge scores
// can't snowball into an unbounded reward.
const REVENGE_BONUS_CONFIG = {
  baseBonusPct:  0.25,   // streak 1 to +25%
  stepBonusPct:  0.05,   // +5% per consecutive streak after the first
  maxBonusPct:   0.60,   // hard ceiling on the percentage, regardless of streak length
  maxBonusCoins: 200,    // hard ceiling on the absolute bonus coins paid out
};

// bonusPctForStreak(1) === baseBonusPct, bonusPctForStreak(2) === baseBonusPct + stepBonusPct, etc.
function bonusPctForStreak(streak) {
  if (streak <= 0) return 0;
  const pct = REVENGE_BONUS_CONFIG.baseBonusPct + REVENGE_BONUS_CONFIG.stepBonusPct * (streak - 1);
  return Math.min(pct, REVENGE_BONUS_CONFIG.maxBonusPct);
}

// ──────────────────────────────────────────────────────────
// GIFT BOX CONFIGURATION
// ──────────────────────────────────────────────────────────
// spawnChance: probability per spawn slot (same scale as powerUpChance)
// rewards: weighted pool — higher weight = more likely
// Coin bundles: most common. Cosmetic unlock: rare. Character unlock: very rare.
// ──────────────────────────────────────────────────────────
const GIFT_BOX_CONFIG = {
  id:          'gift_box',
  label:       'Gift Box',
  assetKey:    'gift_box',
  visualKind:  'gift',
  spawnChance: 0.008,   // ~0.8% per spawn slot — rarer than powerups
  minLevel:    1,        // can appear from level 1
  rewards: [
    { type: 'coins', amount: 25,  weight: 40, label: '+25 Coins'  },
    { type: 'coins', amount: 50,  weight: 25, label: '+50 Coins'  },
    { type: 'coins', amount: 100, weight: 12, label: '+100 Coins' },
    { type: 'cosmetic',           weight: 15, label: 'New Cosmetic Unlocked!' },
    { type: 'character',          weight: 8,  label: 'New Character Unlocked!' },
  ],
  // Fallback coin amount when a cosmetic/character reward has nothing left to give
  fallbackCoins: 75,
};

// ──────────────────────────────────────────────────────────
// ACHIEVEMENT COIN REWARDS
// Keyed by achievement id (must match ACHIEVEMENT_DATA[].id).
// Any achievement id not listed here gets no coin reward.
// ──────────────────────────────────────────────────────────
const ACHIEVEMENT_COIN_REWARDS = {
  first_catch:       10,
  score500:          25,
  score1000:         50,
  score2500:         100,
  score5000:         200,
  level5:            25,
  level10:           75,
  level15:           150,
  streak10:          40,
  streak20:          100,
  streak35:          200,
  max_lives_10:      75,
  no_miss_level5:    100,
  survive_5bombs:    60,
  eat_fire_hazards:  50,
  eat_bombs_10:      40,
  hearts_25:         30,
  hearts_100:        80,
  food_100:          25,
  food_500:          75,
  food_2000:         200,
  games_10:          30,
  games_50:          100,
  golden_score:      150,
  ninja_level10:     150,
  royal_streak15:    150,
  chameleon_reach:   100,
  chomper_chain:     100,
  hippo_lunge:       100,
  flytrap_clone:     200,
  allchars:          500,
};

// ──────────────────────────────────────────────────────────
// SCORE → COIN CONVERSION
// ──────────────────────────────────────────────────────────
function scoreToCoins(score) {
  return Math.floor(score / 100);
}

// ──────────────────────────────────────────────────────────
// PROGRESSION MANAGER
// ──────────────────────────────────────────────────────────
const ProgressionManager = (() => {

  // ── Save helpers ──────────────────────────────────────────

  function _ensureDefaults(d) {
    if (d.coins === undefined)                    d.coins = PROGRESSION_SAVE_DEFAULTS.coins;
    if (!d.achievementRewardsClaimed)             d.achievementRewardsClaimed = [];
    if (d.lifetimeCoinsEarned === undefined)      d.lifetimeCoinsEarned = 0;
    if (d.revengeStreak === undefined)            d.revengeStreak = 0;
  }

  /**
   * Applies a shared-Gold award inside a caller-owned SaveManager.set()
   * transaction. This helper intentionally does not emit events: the caller
   * must emit only after the entire multi-branch transaction commits.
   *
   * It exists for trusted bridges such as the full-game Infinite Frog Bank;
   * ordinary game code must continue to call awardCoins().
   */
  function awardCoinsInTransaction(d, amount) {
    // Strict even on the trusted bridge: an invalid amount awards nothing
    // rather than corrupting the wallet (Infinity previously propagated into
    // d.coins and serialized to null). Callers pass pre-validated integers.
    const safeAmount = strictCurrencyAmount(amount);
    _ensureDefaults(d);
    if (safeAmount === null) return { amount: 0, total: d.coins };
    d.coins += safeAmount;
    d.lifetimeCoinsEarned += safeAmount;
    return { amount: safeAmount, total: d.coins };
  }

  function getAllCosmeticDefinitions() {
    if (typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getAllCosmeticDefinitions === 'function') {
      return ContentAssetResolver.getAllCosmeticDefinitions();
    }
    return (typeof COSMETIC_DATA !== 'undefined' && Array.isArray(COSMETIC_DATA)) ? COSMETIC_DATA : [];
  }

  function getCosmeticDefinition(cosmeticId) {
    return getAllCosmeticDefinitions().find(item => item.id === cosmeticId) || null;
  }

  // ── Coin management ───────────────────────────────────────

  /**
   * Award `amount` coins and persist.
   * `reason` is a short string for the EventBus payload (e.g. 'scoreConversion', 'achievement', 'giftBox').
   * Returns the new coin total.
   */
  function awardCoins(amount, reason = 'unknown') {
    // Strict mutation boundary (EC-9): reject — never coerce — strings,
    // fractions, NaN, Infinity, negatives. Invalid input awards nothing.
    const safeAmount = strictCurrencyAmount(amount);
    if (safeAmount === null) return getCoins();
    let award = { amount: 0, total: getCoins() };
    // Durable-before-celebrate: confirm the physical write before emitting the
    // award event. On failure setDurable rolls the in-memory document back to
    // its pre-award state, so we neither mint an uncommitted balance nor
    // announce Gold that never reached storage.
    const { ok } = SaveManager.setDurable(d => { award = awardCoinsInTransaction(d, safeAmount); });
    if (!ok) return getCoins();
    EventBus.emit('coinsAwarded', { amount: award.amount, reason, total: award.total });
    return award.total;
  }

  /**
   * Spend `amount` coins.
   * Returns { ok: true, newTotal } or { ok: false, reason }.
   * `reason` is 'invalid-amount' (non-finite / non-positive / unsafe integer),
   * 'insufficient' (balance too low), or 'write-failed' (durable commit failed).
   */
  function spendCoins(amount) {
    // Numeric integrity: Gold is an integer currency. Reject non-numbers,
    // negative, zero, NaN/Infinity, fractional, and unsafe-integer inputs
    // BEFORE any mutation, WITHOUT coercing attacker-controlled strings into
    // value. A negative amount previously passed the insufficient-funds check
    // and made subtraction into addition — an economy-minting defect.
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return { ok: false, reason: 'invalid-amount' };
    }
    const current = getCoins();
    if (current < amount) return { ok: false, reason: 'insufficient' };
    let newTotal = current;
    // Durable-before-celebrate: only emit the spend after the physical write is
    // confirmed; on failure the balance is rolled back and no event fires.
    const { ok } = SaveManager.setDurable(d => {
      _ensureDefaults(d);
      d.coins = Math.max(0, d.coins - amount);
      newTotal = d.coins;
    });
    if (!ok) return { ok: false, reason: 'write-failed' };
    EventBus.emit('coinsSpent', { amount, total: newTotal });
    return { ok: true, newTotal };
  }

  function getCoins() {
    const d = SaveManager.get();
    _ensureDefaults(d);
    return d.coins;
  }

  // ── Once-only coin transactions (P0-B economy ledger) ─────
  //
  // Must happen exactly once or survive replay? Use a transaction ID and the
  // once-only API below. Intentionally repeatable and independently initiated
  // (score conversion, random gift-box drops)? Use ordinary awardCoins /
  // spendCoins, or mint one persisted purchase-intent ID at the interaction
  // boundary and reuse it across every retry of that single intent.
  //
  // Deterministic ID conventions: achievement:{id}, purchase:character:{id},
  // purchase:cosmetic:{id}, giftbox:{yyyy-mm-dd}, purchase-intent:{uuid},
  // grant:{campaignId} (LiveOps/campaign gifts via GrantService),
  // iap:{receiptId} (store purchases; platform receipt identity is the ID).

  /**
   * Award `amount` coins exactly once for `transactionId`.
   * Returns the EconomyLedger outcome:
   *   { status: 'applied'|'duplicate'|'rejected', applied, record, result, reason }
   * 'coinsAwarded' fires only when the award actually applied.
   */
  function awardCoinsOnce(transactionId, amount, meta = {}) {
    // Strict mutation boundary (EC-9): invalid amounts are REJECTED without
    // consuming the transaction id — never coerced into value.
    const safeAmount = strictCurrencyAmount(amount);
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      const award = awardCoinsInTransaction(d, safeAmount);
      return { commit: true, amount: award.amount, total: award.total };
    }, {
      domain: 'wallet',
      kind: meta.kind || 'award-once',
      subjectId: meta.subjectId,
      amount: safeAmount === null ? 0 : safeAmount,
      contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('coinsAwarded', {
        amount: outcome.result.amount,
        reason: meta.reason || meta.kind || 'awardOnce',
        total: outcome.result.total,
        transactionId,
      });
    }
    return outcome;
  }

  /**
   * Spend `amount` coins exactly once for `transactionId`.
   * Insufficient funds returns REJECTED and does not consume the transaction
   * ID — once the balance can cover it, the same ID may retry and succeed.
   * 'coinsSpent' fires only when the charge actually applied.
   */
  function spendCoinsOnce(transactionId, amount, meta = {}) {
    // Strict mutation boundary (EC-9): invalid amounts are REJECTED without
    // consuming the transaction id — never coerced into value.
    const safeAmount = strictCurrencyAmount(amount);
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      _ensureDefaults(d);
      if (d.coins < safeAmount) return { commit: false, reason: 'insufficient-funds' };
      d.coins -= safeAmount;
      return { commit: true, amount: safeAmount, total: d.coins };
    }, {
      domain: 'wallet',
      kind: meta.kind || 'spend-once',
      subjectId: meta.subjectId,
      amount: safeAmount === null ? 0 : safeAmount,
      contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('coinsSpent', { amount: safeAmount, total: outcome.result.total, transactionId });
    }
    return outcome;
  }

  // ── Revenge streak management ──────────────────────────────
  function getRevengeStreak() {
    const d = SaveManager.get();
    _ensureDefaults(d);
    return d.revengeStreak;
  }

  // ── Score → Coins (called at game over) ───────────────────

  /**
   * Convert a final run score into coins and award them.
   * When a stable per-run `runId` is supplied (from the gameOver payload), the
   * payout settles exactly-once through the EconomyLedger so a duplicate/replayed
   * gameOver cannot repay the same run; a new run carries a fresh runId and pays
   * independently. Without a runId it falls back to the repeatable award (still
   * durable-before-celebrate via awardCoins).
   * Returns { coinsEarned, newTotal }.
   */
  function convertScoreToCoins(score, runId = null) {
    const earned = scoreToCoins(score);
    if (earned <= 0) return { coinsEarned: 0, newTotal: getCoins() };
    if (typeof runId === 'string' && runId) {
      const outcome = awardCoinsOnce(`arcade:score:${runId}`, earned, {
        kind: 'arcade-score', subjectId: runId, reason: 'scoreConversion',
      });
      const newTotal = (outcome.status === 'applied' && outcome.result) ? outcome.result.total : getCoins();
      return { coinsEarned: outcome.status === 'applied' ? earned : 0, newTotal };
    }
    const newTotal = awardCoins(earned, 'scoreConversion');
    return { coinsEarned: earned, newTotal };
  }

  // ── Gift Box ──────────────────────────────────────────────

  /**
   * Weighted-random pick from GIFT_BOX_CONFIG.rewards.
   */
  function _pickGiftReward() {
    const pool = GIFT_BOX_CONFIG.rewards;
    const total = pool.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total;
    for (const r of pool) {
      roll -= r.weight;
      if (roll <= 0) return r;
    }
    return pool[pool.length - 1];
  }

  /**
   * Open a Gift Box. Resolves a reward, applies it, saves, and fires
   * 'giftBoxOpened' on EventBus.
   *
   * Returns a result object:
   *   { type, amount?, newTotal?, itemId?, itemName?, label, fallback? }
   */
  function openGiftBox() {
    const d = SaveManager.get();
    _ensureDefaults(d);

    const reward = _pickGiftReward();
    let result = { type: reward.type, label: reward.label };

    if (reward.type === 'coins') {
      const newTotal = awardCoins(reward.amount, 'giftBox');
      result.amount   = reward.amount;
      result.newTotal = newTotal;

    } else if (reward.type === 'cosmetic') {
      const all = getAllCosmeticDefinitions();
      const eligible = all.filter(c => {
        if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.isGiftEligible === 'function') {
          return ContentUnlockResolver.isGiftEligible(c, d, 'gift-box');
        }
        return !(d.unlockedCosmetics || []).includes(c.id);
      });
      if (eligible.length) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        SaveManager.set(d2 => {
          if (!d2.unlockedCosmetics) d2.unlockedCosmetics = [];
          if (!d2.unlockedCosmetics.includes(pick.id)) d2.unlockedCosmetics.push(pick.id);
        });
        result.itemId   = pick.id;
        result.itemName = pick.name;
        result.label    = `${pick.name} Unlocked!`;
        EventBus.emit('cosmeticUnlocked', { id: pick.id, source: 'giftBox' });
      } else {
        // All cosmetics owned — convert to coins
        const newTotal = awardCoins(GIFT_BOX_CONFIG.fallbackCoins, 'giftBoxFallback');
        result.type     = 'coins';
        result.amount   = GIFT_BOX_CONFIG.fallbackCoins;
        result.newTotal = newTotal;
        result.label    = `+${GIFT_BOX_CONFIG.fallbackCoins} Coins (Collection Complete!)`;
        result.fallback = true;
      }

    } else if (reward.type === 'character') {
      const all      = (typeof CHARACTER_DATA !== 'undefined') ? CHARACTER_DATA : [];
      const owned    = d.unlockedChars || [];
      const eligible = all.filter(c => (typeof isCharacterPlayerSelectable !== 'function' || isCharacterPlayerSelectable(c)) && !owned.includes(c.id));
      if (eligible.length) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        SaveManager.set(d2 => {
          if (!d2.unlockedChars) d2.unlockedChars = [];
          if (!d2.unlockedChars.includes(pick.id)) d2.unlockedChars.push(pick.id);
        });
        result.itemId   = pick.id;
        result.itemName = pick.name;
        result.label    = `${pick.name} Unlocked!`;
        EventBus.emit('characterUnlocked', { id: pick.id, source: 'giftBox' });
      } else {
        // All characters owned — convert to coins
        const newTotal = awardCoins(GIFT_BOX_CONFIG.fallbackCoins, 'giftBoxFallback');
        result.type     = 'coins';
        result.amount   = GIFT_BOX_CONFIG.fallbackCoins;
        result.newTotal = newTotal;
        result.label    = `+${GIFT_BOX_CONFIG.fallbackCoins} Coins (Roster Complete!)`;
        result.fallback = true;
      }
    }

    EventBus.emit('giftBoxOpened', result);
    return result;
  }

  // ── Achievements ──────────────────────────────────────────

  /**
   * Check all ACHIEVEMENT_DATA entries against current save state and
   * award coin rewards for any newly-completed achievements.
   * Safe to call multiple times — already-claimed rewards are skipped.
   *
   * Returns an array of { id, name, coinsAwarded } for achievements
   * completed this call, so callers can display notifications.
   */
  function checkAndClaimAchievements(score, level, saveOverrides = null) {
    const d = SaveManager.get();
    _ensureDefaults(d);
    if (!d.achievements)              d.achievements = [];
    if (!d.achievementRewardsClaimed) d.achievementRewardsClaimed = [];
    // Achievement checks sometimes need run-scoped facts (for example a mode
    // that forces Gulper without changing the player's saved menu selection).
    // Overlay only the supplied evaluation facts; durable ownership/rewards
    // continue to commit through the real SaveManager document below.
    const evaluationSave = saveOverrides && typeof saveOverrides === 'object'
      ? { ...d, ...saveOverrides }
      : d;

    const achievements = (typeof ACHIEVEMENT_DATA !== 'undefined') ? ACHIEVEMENT_DATA : [];
    const newlyCompleted = [];

    const stats = (typeof StatsTracker !== 'undefined') ? StatsTracker.getStats() : null;

    achievements.forEach(ach => {
      if (ach?.retired === true || ach?.releaseState === 'post-launch') return;
      // Fast path only — the transaction's own claimed re-check is the authority.
      if (d.achievementRewardsClaimed.includes(ach.id)) return;

      let passed = false;
      try { passed = ach.check(score, level, stats, evaluationSave); } catch (_) {}
      if (!passed) return;

      // Resolve catalog facts outside the durable transaction.
      const coinReward = ACHIEVEMENT_COIN_REWARDS[ach.id] || 0;
      const unlockCharIds = (ach.unlocks || [])
        .map(rawCharId => typeof canonicalCharacterId === 'function' ? canonicalCharacterId(rawCharId) : rawCharId)
        .filter(charId => {
          const definition = typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA.find(item => item.id === charId) : null;
          return Boolean(definition) && (typeof isCharacterPlayerSelectable !== 'function' || isCharacterPlayerSelectable(definition));
        });

      // Earned mark, character unlocks, coin payout, claimed marker, and the
      // achievement ProgressionFacts commit in ONE durable transaction keyed
      // achievement:{id}, through the single GrantService choke point. A crash
      // or replayed gameOver can no longer pay twice or half-apply a claim,
      // and a failed grant can never leave a success fact behind.
      const outcome = GrantService.grant({
        transactionId: `achievement:${ach.id}`,
        amountCoins: coinReward,
        reason: 'achievement',
        mutate: d2 => {
          _ensureDefaults(d2);
          if (d2.achievementRewardsClaimed.includes(ach.id)) return { commit: false, reason: 'already-claimed' };
          if (!d2.achievements) d2.achievements = [];
          if (!d2.achievements.includes(ach.id)) d2.achievements.push(ach.id);
          if (!d2.unlockedChars) d2.unlockedChars = [];
          unlockCharIds.forEach(charId => {
            if (!d2.unlockedChars.includes(charId)) d2.unlockedChars.push(charId);
          });
          d2.achievementRewardsClaimed.push(ach.id);
          return { commit: true };
        },
        facts: [
          { kind: 'first', key: `achievement.${ach.id}` },
          { kind: 'count', key: 'achievements.claimed' },
        ],
        meta: { domain: 'progression', kind: 'achievement-reward', subjectId: ach.id },
      });
      if (outcome.status !== 'applied') return;

      newlyCompleted.push({ id: ach.id, name: ach.name, icon: ach.icon, coinsAwarded: coinReward, unlocks: ach.unlocks || [] });
      EventBus.emit('achievementUnlocked', { id: ach.id, name: ach.name, coinsAwarded: coinReward, unlocks: ach.unlocks || [] });
    });

    return newlyCompleted;
  }

  // ── Shop purchases ────────────────────────────────────────

  /**
   * Attempt to purchase a character by id.
   * Cost is read from CHARACTER_DATA[].coinCost (default 0 = free).
   * Returns { ok, reason?, newTotal? }
   */
  function purchaseCharacter(charId) {
    const all    = (typeof CHARACTER_DATA !== 'undefined') ? CHARACTER_DATA : [];
    const canonicalId = typeof canonicalCharacterId === 'function' ? canonicalCharacterId(charId) : charId;
    const charDef = all.find(c => c.id === canonicalId);
    if (!charDef) return { ok: false, reason: 'unknownCharacter' };
    if (typeof isCharacterPlayerSelectable === 'function' && !isCharacterPlayerSelectable(charDef)) return { ok: false, reason: 'hiddenCharacter' };
    charId = canonicalId;

    const cost = charDef.coinCost || 0;
    // Spend and unlock commit in ONE durable transaction keyed to this
    // character. A double-click replay returns DUPLICATE, and a crash can no
    // longer charge coins without granting ownership. Insufficient funds is
    // REJECTED and leaves the same transaction ID retryable.
    const outcome = EconomyLedger.apply(`purchase:character:${charId}`, d => {
      _ensureDefaults(d);
      if (!d.unlockedChars) d.unlockedChars = [];
      if (d.unlockedChars.includes(charId)) return { commit: false, reason: 'alreadyOwned' };
      if (cost > 0 && d.coins < cost) return { commit: false, reason: 'insufficient' };
      if (cost > 0) d.coins = Math.max(0, d.coins - cost);
      d.unlockedChars.push(charId);
      return { commit: true, amount: cost, total: d.coins };
    }, { domain: 'wallet', kind: 'character-purchase', subjectId: charId, amount: cost });

    if (outcome.status === 'duplicate') return { ok: false, reason: 'alreadyOwned' };
    if (outcome.status === 'rejected') return { ok: false, reason: outcome.reason };
    if (cost > 0) EventBus.emit('coinsSpent', { amount: cost, total: outcome.result.total, transactionId: `purchase:character:${charId}` });
    EventBus.emit('characterUnlocked', { id: charId, source: 'purchase', cost });
    return { ok: true, newTotal: getCoins() };
  }

  /**
   * Attempt to purchase a cosmetic by id.
   * Cost is read from the merged legacy/generated cosmetic catalog. Generated
   * items may only be purchased when their validated unlock policy is coins.
   * Returns { ok, reason?, newTotal? }
   */
  function purchaseCosmetic(cosmeticId) {
    const cosDef = getCosmeticDefinition(cosmeticId);
    if (!cosDef) return { ok: false, reason: 'unknownCosmetic' };

    const d = SaveManager.get();
    const owned = d.unlockedCosmetics || [];
    const isOwned = typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.isUnlocked === 'function'
      ? ContentUnlockResolver.isUnlocked(cosDef, d)
      : owned.includes(cosmeticId);
    if (isOwned) return { ok: false, reason: 'alreadyOwned' };

    const canPurchase = typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.canPurchase === 'function'
      ? ContentUnlockResolver.canPurchase(cosDef, d)
      : Number(cosDef.coinCost || 0) > 0;
    if (!canPurchase) return { ok: false, reason: 'notPurchasable' };

    const cost = typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.getCoinCost === 'function'
      ? ContentUnlockResolver.getCoinCost(cosDef)
      : Number(cosDef.coinCost || 0);
    if (!Number.isFinite(cost) || cost < 1) return { ok: false, reason: 'notPurchasable' };

    // Spend and unlock commit in ONE durable transaction keyed to this
    // cosmetic. Ownership is re-checked inside the transaction so replay or
    // double-click returns DUPLICATE/alreadyOwned instead of a second charge.
    const outcome = EconomyLedger.apply(`purchase:cosmetic:${cosmeticId}`, d2 => {
      _ensureDefaults(d2);
      if (!d2.unlockedCosmetics) d2.unlockedCosmetics = [];
      const ownedNow = typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.isUnlocked === 'function'
        ? ContentUnlockResolver.isUnlocked(cosDef, d2)
        : d2.unlockedCosmetics.includes(cosmeticId);
      if (ownedNow) return { commit: false, reason: 'alreadyOwned' };
      if (d2.coins < cost) return { commit: false, reason: 'insufficient' };
      d2.coins = Math.max(0, d2.coins - cost);
      if (!d2.unlockedCosmetics.includes(cosmeticId)) d2.unlockedCosmetics.push(cosmeticId);
      return { commit: true, amount: cost, total: d2.coins };
    }, { domain: 'wallet', kind: 'cosmetic-purchase', subjectId: cosmeticId, amount: cost });

    if (outcome.status === 'duplicate') return { ok: false, reason: 'alreadyOwned' };
    if (outcome.status === 'rejected') return { ok: false, reason: outcome.reason };
    EventBus.emit('coinsSpent', { amount: cost, total: outcome.result.total, transactionId: `purchase:cosmetic:${cosmeticId}` });
    EventBus.emit('cosmeticUnlocked', { id: cosmeticId, source: 'purchase', cost });
    return { ok: true, newTotal: getCoins() };
  }

  // ── Ownership queries ─────────────────────────────────────

  function ownsCharacter(charId) {
    const d = SaveManager.get();
    const canonicalId = typeof canonicalCharacterId === 'function' ? canonicalCharacterId(charId) : charId;
    return (d.unlockedChars || []).includes(canonicalId);
  }

  function ownsCosmetic(cosmeticId) {
    const d = SaveManager.get();
    const definition = getCosmeticDefinition(cosmeticId);
    if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.isUnlocked === 'function') {
      return ContentUnlockResolver.isUnlocked(definition, d);
    }
    return (d.unlockedCosmetics || []).includes(cosmeticId);
  }

  function hasClaimedAchievementReward(achId) {
    const d = SaveManager.get();
    return (d.achievementRewardsClaimed || []).includes(achId);
  }

  // ── Game Over hook ────────────────────────────────────────
  // Automatically triggered by the existing 'gameOver' EventBus event.
  // Converts score → coins and checks achievements in one shot.
  // The payload { score, level, charId, mode } must be emitted by game.js.

  EventBus.on('gameOver', (info) => {
    if (!info) return;
    const { coinsEarned, newTotal } = convertScoreToCoins(info.score || 0, info.runId || null);

    // Legacy score-streak Revenge rewards are intentionally disabled.
    // The unified ArcadeRevengeChallenges manager owns the only active
    // challenge, completion rule, and atomic coin reward. These zeroed fields
    // remain in the summary shape so older result consumers do not break.
    const revengeBonus = 0;
    const revengeBonusPct = 0;
    const streakBroken = false;
    const revengeStreak = 0;
    const nextRevengeBonusPct = 0;

    const newAchievements = checkAndClaimAchievements(
      info.score || 0,
      info.level || 1,
      info.charId ? { selectedChar: info.charId } : null,
    );

    EventBus.emit('progressionGameOverSummary', {
      score:              info.score || 0,
      coinsEarned:        coinsEarned + revengeBonus,
      revengeBonus,
      revengeBonusPct,
      revengeStreak,
      nextRevengeBonusPct,
      streakBroken,
      totalCoins:         getCoins(),
      newAchievements,
    });
  });

  // ──────────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────────
  return {
    // Coins
    getCoins,
    awardCoins,
    // Trusted internal bridge only. Use awardCoins() for ordinary sources.
    awardCoinsInTransaction,
    spendCoins,
    // Exactly-once wallet operations backed by the economy ledger.
    awardCoinsOnce,
    spendCoinsOnce,
    convertScoreToCoins,
    scoreToCoins,

    // Revenge streak
    getRevengeStreak,
    bonusPctForStreak,

    // Gift box
    openGiftBox,

    // Achievements
    checkAndClaimAchievements,
    hasClaimedAchievementReward,

    // Shop purchases
    purchaseCharacter,
    purchaseCosmetic,

    // Ownership
    ownsCharacter,
    ownsCosmetic,

    // Migration helper — call from SaveManager migration step 4
    // to ensure save data has all progression fields without wiping existing data.
    ensureDefaults(d) { _ensureDefaults(d); },
  };

})();

// ──────────────────────────────────────────────────────────
// PROGRESSION VIEW (EC-2) — read-only cross-mode derivation
// ──────────────────────────────────────────────────────────
// ProgressionView derives cross-mode progression state for consumers such as
// menus, analytics, future Castle and LiveOps. It is STRICTLY read-only: every
// snapshot is a deep-frozen copy, it never calls SaveManager.set, and it is
// never an authority — modes keep sole ownership of their durable state.
const ProgressionView = (() => {
  function freezeDeep(value) {
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) freezeDeep(value[key]);
      Object.freeze(value);
    }
    return value;
  }

  function snapshot() {
    const d = SaveManager.get();
    const facts = typeof normalizeProgressionFacts === 'function'
      ? normalizeProgressionFacts(d.progressionFacts)
      : { schemaVersion: 0, counters: {}, latest: {}, firsts: {}, dropped: 0 };

    const levelStars = d.puzzleProgress && typeof d.puzzleProgress === 'object' ? (d.puzzleProgress.levelStars || {}) : {};
    let puzzleLevelsCleared = 0;
    let puzzleStarsTotal = 0;
    for (const id of Object.keys(levelStars)) {
      const stars = Math.max(0, Math.floor(Number(levelStars[id]) || 0));
      if (stars > 0) puzzleLevelsCleared += 1;
      puzzleStarsTotal += Math.min(3, stars);
    }

    // Feastfall progression lives in the mode-owned Feastfall blob; read it
    // through the mode's own reader when that module is loaded. Read-only.
    let feastfall = null;
    if (typeof feastfallReadSave === 'function') {
      try {
        const blob = feastfallReadSave() || {};
        const persistent = blob.feastfallProgression && typeof blob.feastfallProgression === 'object' ? blob.feastfallProgression : {};
        feastfall = {
          worldCalm: Math.max(0, Number(persistent.worldCalm) || 0),
          visitorsSatisfied: Object.values(persistent.visitors && typeof persistent.visitors === 'object' ? persistent.visitors : {})
            .reduce((sum, v) => sum + Math.max(0, Number(v && v.satisfied) || 0), 0),
        };
      } catch (_) { feastfall = null; }
    }

    const stats = d.stats && typeof d.stats === 'object' ? d.stats : {};
    const infiniteExchange = d.infiniteGoldExchange && typeof d.infiniteGoldExchange === 'object' ? d.infiniteGoldExchange : {};

    return freezeDeep({
      generatedAt: Date.now(),
      saveVersion: Math.max(0, Math.floor(Number(d.version) || 0)),
      wallet: {
        coins: Math.max(0, Math.floor(Number(d.coins) || 0)),
        lifetimeCoinsEarned: Math.max(0, Math.floor(Number(d.lifetimeCoinsEarned) || 0)),
      },
      facts,
      arcade: {
        gamesPlayed: Math.max(0, Math.floor(Number(stats.totalGamesPlayed) || 0)),
        highestScore: Math.max(0, Math.floor(Number(stats.highestScore) || 0)),
        charactersUnlocked: Array.isArray(d.unlockedChars) ? d.unlockedChars.length : 0,
      },
      achievements: {
        earned: Array.isArray(d.achievements) ? d.achievements.length : 0,
        claimed: Array.isArray(d.achievementRewardsClaimed) ? d.achievementRewardsClaimed.length : 0,
      },
      puzzle: {
        levelsCleared: puzzleLevelsCleared,
        starsTotal: puzzleStarsTotal,
      },
      infinite: {
        lifetimeGoldConverted: Math.max(0, Math.floor(Number(infiniteExchange.lifetimeGoldConverted) || 0)),
      },
      feastfall,
    });
  }

  return { snapshot };
})();

// ──────────────────────────────────────────────────────────
// SAVE MIGRATION — bump to version 4 and add progression fields.
//
// Paste this migration entry into the MIGRATIONS array in src/runtime/shared/systems.js:
//
//   {
//     to: 4,
//     run(d) {
//       ProgressionManager.ensureDefaults(d);
//     }
//   }
//
// And update:   const SAVE_VERSION = 4;
// ──────────────────────────────────────────────────────────
