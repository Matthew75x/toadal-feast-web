// ════════════════════════════════════════════════════════════════════════
//  SYSTEMS.JS — Core architecture for years of expansion
// ════════════════════════════════════════════════════════════════════════
//  Load order: data.js → src/runtime/shared/systems.js → game.js → main.js
//
//  This file owns six foundational systems. Game.js consumes them through
//  small, stable APIs so new content (abilities, statuses, stats, save
//  fields, difficulty curves) can be added here WITHOUT touching game.js.
//
//  1. EventBus            — pub/sub backbone, used by every other system
//  2. SaveManager         — versioned persistence w/ migrations
//  3. DifficultyDirector   — per-mode adaptive difficulty (was DDAManager)
//  4. AbilitySystem        — declarative hooks for character abilities
//  5. StatusEffectSystem   — timed buffs/debuffs, stackable, hookable
//  6. StatsTracker         — lifetime player statistics, event-driven
//
//  HOW TO EXTEND (read this before adding features):
//
//  • New ability behavior → AbilitySystem.register('id', { onTick, onFoodCaught, ... })
//  • New buff/debuff       → StatusEffectSystem.register('id', { onApply, onTick, onExpire, ... })
//  • New stat to track     → add a field to DEFAULT_STATS + a small EventBus.on() listener below
//  • New save field        → bump SAVE_VERSION, add a migration step
//  • New difficulty curve  → DifficultyDirector.configureMode('modeId', {...})
//  • New global event      → just EventBus.emit('myEvent', data) from anywhere; no registration needed
// ════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────
// 1. EVENT SYSTEM
// ────────────────────────────────────────────────────────────────────────
let saveTransactionHook = null;
const EventBus = (() => {
  // Null-prototype storage prevents hostile or accidental event names such as
  // `__proto__`, `constructor`, or `toString` from colliding with Object.prototype.
  const listeners = Object.create(null);
  let debugLog = false;

  return {
    on(event, fn) {
      listeners[event] = listeners[event] || [];
      if (!listeners[event].includes(fn)) listeners[event].push(fn);
    },
    emit(event, data) {
      if (debugLog) console.log('[EventBus]', event, data);
      const dispatch = () => {
        (listeners[event] || []).forEach(fn => {
          try { fn(data); } catch (e) { console.error(`[EventBus] listener for "${event}" threw:`, e); }
        });
      };
      // A single gameplay event can update several save-backed systems
      // (statistics, Feast Orders, achievements, Revenge, etc.). Coalesce those
      // synchronous mutations into one localStorage serialization/write while
      // keeping every in-memory mutation immediately visible to later listeners.
      return typeof saveTransactionHook === 'function' ? saveTransactionHook(dispatch) : dispatch();
    },
    off(event, fn) { listeners[event] = (listeners[event] || []).filter(h => h !== fn); },
    removeListener(event, fn) { this.off(event, fn); }, // Alias for broader compatibility
    clear(event) { if (event) delete listeners[event]; },
    clearAll() { Object.keys(listeners).forEach(k => delete listeners[k]); },
    setDebug(v) { debugLog = !!v; },
    listenerCount(event) { return (listeners[event] || []).length; },
    eventNames() { return Object.keys(listeners); },
  };
})();

// ────────────────────────────────────────────────────────────────────────
// 2. SAVE VERSIONING
// ────────────────────────────────────────────────────────────────────────
const SAVE_VERSION = 30;

// Collection Platform V1 owns only future-facing collection state. Existing
// wallets, mode progress, unlocks, achievements, and EconomyLedger receipts
// remain in their canonical roots and are aggregated read-only.
const COLLECTION_PLATFORM_SCHEMA_VERSION = 1;
const COLLECTION_PLATFORM_MAX_ENTRIES = 512;
const COLLECTION_PLATFORM_MAX_UNSEEN = 64;
const COLLECTION_PLATFORM_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;

function normalizeCollectionPlatformState(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const parsedVersion = Math.floor(Number(source.schemaVersion) || 0);
  // A newer optional sub-schema is preserved verbatim. The global save-version
  // guard normally catches this pairing; this local guard prevents an unusual
  // imported document from being destructively downgraded.
  if (parsedVersion > COLLECTION_PLATFORM_SCHEMA_VERSION) return source;

  const inventorySource = source.inventory && typeof source.inventory === 'object' && !Array.isArray(source.inventory)
    ? source.inventory
    : {};
  const inventory = {};
  for (const itemId of Object.keys(inventorySource).filter(id => COLLECTION_PLATFORM_ID_PATTERN.test(id)).sort().slice(0, COLLECTION_PLATFORM_MAX_ENTRIES)) {
    const quantity = Math.floor(Number(inventorySource[itemId]));
    if (Number.isFinite(quantity) && quantity > 0) inventory[itemId] = Math.min(quantity, 1_000_000_000);
  }

  const storySource = source.story && typeof source.story === 'object' && !Array.isArray(source.story)
    ? source.story
    : {};
  const discoveredSource = storySource.discoveredEntries
    && typeof storySource.discoveredEntries === 'object'
    && !Array.isArray(storySource.discoveredEntries)
    ? storySource.discoveredEntries
    : {};
  const discoveredEntries = {};
  for (const entryId of Object.keys(discoveredSource).filter(id => COLLECTION_PLATFORM_ID_PATTERN.test(id)).sort().slice(0, COLLECTION_PLATFORM_MAX_ENTRIES)) {
    const record = discoveredSource[entryId] && typeof discoveredSource[entryId] === 'object'
      && !Array.isArray(discoveredSource[entryId])
      ? discoveredSource[entryId]
      : {};
    const timestamp = Math.floor(Number(record.discoveredAt));
    const sourceId = String(record.source || 'unknown').replace(/\s+/g, '-').slice(0, 96);
    discoveredEntries[entryId] = {
      discoveredAt: Number.isFinite(timestamp) && timestamp > 0 ? Math.min(timestamp, 9_000_000_000_000_000) : 0,
      source: /^[a-z0-9][a-z0-9._:-]{0,95}$/i.test(sourceId) ? sourceId : 'unknown',
    };
  }

  const attentionSource = source.attention && typeof source.attention === 'object' && !Array.isArray(source.attention)
    ? source.attention
    : {};
  const unseenSource = attentionSource.unseen && typeof attentionSource.unseen === 'object' && !Array.isArray(attentionSource.unseen)
    ? attentionSource.unseen
    : {};
  const normalizeUnseen = value => {
    const output = [];
    const seen = new Set();
    for (const id of Array.isArray(value) ? value : []) {
      if (typeof id !== 'string' || !COLLECTION_PLATFORM_ID_PATTERN.test(id) || seen.has(id)) continue;
      seen.add(id);
      output.push(id);
      if (output.length >= COLLECTION_PLATFORM_MAX_UNSEEN) break;
    }
    return output;
  };
  const revision = Math.max(0, Math.min(1_000_000_000, Math.floor(Number(attentionSource.revision) || 0)));
  const seenRevision = Math.max(0, Math.min(revision, Math.floor(Number(attentionSource.seenRevision) || 0)));

  return {
    schemaVersion: COLLECTION_PLATFORM_SCHEMA_VERSION,
    inventory,
    story: { discoveredEntries },
    attention: {
      revision,
      seenRevision,
      unseen: {
        inventory: normalizeUnseen(unseenSource.inventory),
        story: normalizeUnseen(unseenSource.story),
        worldCandies: normalizeUnseen(unseenSource.worldCandies),
      },
    },
  };
}

// EC-2.5: shared cross-mode value roots introduced at v29.
// `candy` — Jeweled Candy, the rare cross-mode special currency (integer ≥ 0).
// `entitlements` — per-item durable ownership map: itemId → { at, source }.
// Both live under the same physical-write, ledger, and migration guarantees
// as Gold; neither may be shadowed by a mode-local wallet.
function normalizeCandyBalance(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1000000) : 0;
}

// The local wallet remains authoritative only in the dark/offline lane. Once
// the Froggy adapter is installed, premium value must come from a verified
// server workflow; until that workflow is wired, every local Candy mutation is
// fail-closed. This intentionally does not affect Gold or offline gameplay.
const FroggyPremiumMutationBoundary = (() => {
  const ONLINE_KINDS = new Set(['froggy-locker', 'froggy-locker-shadow']);
  function localCandyMutationAllowed() {
    const services = typeof globalThis !== 'undefined' ? globalThis.GameServices : null;
    return !(services?.online === true && ONLINE_KINDS.has(String(services.kind || '')));
  }
  function blockedReason() { return 'froggy-premium-authority-unavailable'; }
  return Object.freeze({ localCandyMutationAllowed, blockedReason });
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyPremiumMutationBoundary = FroggyPremiumMutationBoundary;

// EC-9 strict mutation-boundary amount contract (independent-review reopen of
// LATE-07). Durable value mutation APIs (grant/spend/reservation) accept ONLY
// an actual number that is a finite safe integer within the explicit currency
// bound — no string/boolean coercion, no fraction flooring, no NaN/Infinity,
// no negatives. Returns the amount itself when valid, else null. Save/load
// NORMALIZATION stays tolerant (normalizeCandyBalance etc.); MUTATION is strict.
const CURRENCY_MUTATION_MAX_AMOUNT = 1_000_000_000; // = ECONOMY_LEDGER_MAX_AMOUNT
function strictCurrencyAmount(value, { allowZero = false } = {}) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return null;
  if (value < 0 || (value === 0 && !allowZero)) return null;
  if (value > CURRENCY_MUTATION_MAX_AMOUNT) return null;
  return value;
}
const ENTITLEMENT_ID_PATTERN = /^[a-z][a-z0-9._-]{0,95}$/;
const ENTITLEMENTS_MAX = 512;
function normalizeEntitlements(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = {};
  // Validate IDs BEFORE applying the capacity slice: a crafted set of invalid
  // lexically-early keys must never crowd legitimately-owned IDs out of the cap
  // (independent-review addendum to LATE-08).
  for (const key of Object.keys(source).filter(key => ENTITLEMENT_ID_PATTERN.test(key)).sort().slice(0, ENTITLEMENTS_MAX)) {
    const record = source[key];
    const at = Math.floor(Number(record && record.at));
    out[key] = {
      at: Number.isFinite(at) && at > 0 ? at : 0,
      source: typeof (record && record.source) === 'string' ? record.source.slice(0, 96) : 'unknown',
    };
  }
  return out;
}

// EC-9 durable Candy-assist reservations. Holds ONLY in-flight (unconfirmed)
// assist spends: reserve appends here inside the same durable transaction as the
// Candy debit; confirm/settle removes on effect-received; refund removes and
// reverse-credits. Any record surviving to the next boot was debited but never
// confirmed (crash between reserve and effect) and is refunded on load.
const CANDY_RESERVATION_ID_PATTERN = /^[a-z0-9][a-z0-9:._-]{0,127}$/;
const CANDY_RESERVATIONS_MAX = 32;
function normalizeCandyReservations(value) {
  const list = Array.isArray(value) ? value : [];
  const out = [];
  const seen = new Set();
  for (const entry of list) {
    if (out.length >= CANDY_RESERVATIONS_MAX) break;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const id = String(entry.id || '');
    if (!CANDY_RESERVATION_ID_PATTERN.test(id) || seen.has(id)) continue;
    const candy = Math.floor(Number(entry.candy));
    if (!Number.isFinite(candy) || candy <= 0) continue;
    seen.add(id);
    out.push({ id, candy: Math.min(candy, 1000000) });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// EC-9 v2: CURRENCY / VALUE REGISTRY (currency+storefront contract §2/§3/§7)
// ────────────────────────────────────────────────────────────────────────
// THE single registry commerce resolves a generic `currencyId` through. It
// defines WHAT a currency is (class, wallet routing, lifecycle status,
// conversion policy); GrantService/EconomyLedger remain the ONLY mutation
// authority. Gold and Jeweled Candy are the two shipped visible currencies;
// additional currencies are ADDITIVE registry definitions (a test-only
// fictional currency needs no gameplay-mode edits). Conversion between
// currencies requires an EXPLICIT versioned policy rule — the default policy
// is NONE and balances are never silently converted (Gold is never implicitly
// interchangeable with premium/voucher value).
const CurrencyRegistry = (() => {
  const ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
  const CLASSES = Object.freeze(['SOFT_EARNED', 'SCARCE_VOUCHER']);
  const STATUSES = Object.freeze(['active', 'deprecated', 'hidden']);
  const WALLETS = Object.freeze(['coins', 'candy', 'registry']);
  const BUILT_IN = Object.freeze(['gold', 'candy']);
  const definitions = new Map();

  function validate(def) {
    const d = def && typeof def === 'object' ? def : {};
    if (!ID_PATTERN.test(String(d.id || ''))) return 'invalid-currency-id';
    if (!CLASSES.includes(d.class)) return 'invalid-currency-class';
    if (!WALLETS.includes(d.wallet)) return 'invalid-currency-wallet';
    if (d.status !== undefined && !STATUSES.includes(d.status)) return 'invalid-currency-status';
    return null;
  }

  function freezeDefinition(def) {
    return Object.freeze({
      id: def.id,
      class: def.class,
      wallet: def.wallet,
      status: def.status || 'active',
      // Conversion policy is versioned and EXPLICIT. version 0 + empty rules =
      // the shipped default: NO conversion of any kind.
      conversionPolicy: Object.freeze({
        version: Math.max(0, Math.floor(Number(def.conversionPolicy?.version) || 0)),
        rules: Object.freeze(Array.isArray(def.conversionPolicy?.rules) ? [...def.conversionPolicy.rules] : []),
      }),
    });
  }

  /** Additive registration (new currencies/test fixtures). Built-ins are locked. */
  function register(def) {
    const problem = validate(def);
    if (problem) return { ok: false, reason: problem };
    if (BUILT_IN.includes(def.id) || definitions.has(def.id)) return { ok: false, reason: 'currency-already-defined' };
    definitions.set(def.id, freezeDefinition(def));
    return { ok: true, definition: definitions.get(def.id) };
  }

  /** Lifecycle transition — deprecation stops NEW grants/offers; the stored
   *  balance interpretation is never deleted (contract §7). */
  function setStatus(currencyId, status) {
    const current = definitions.get(String(currencyId || ''));
    if (!current) return { ok: false, reason: 'unknown-currency' };
    if (BUILT_IN.includes(current.id)) return { ok: false, reason: 'built-in-currency-locked' };
    if (!STATUSES.includes(status)) return { ok: false, reason: 'invalid-currency-status' };
    definitions.set(current.id, freezeDefinition({ ...current, status, conversionPolicy: current.conversionPolicy }));
    return { ok: true, definition: definitions.get(current.id) };
  }

  function resolve(currencyId) { return definitions.get(String(currencyId || '')) || null; }
  function list() { return [...definitions.values()]; }

  /** Conversion FAIL-CLOSED default: without an explicit versioned rule for
   *  the exact from→to pair, nothing converts — ever. No rule ships. */
  function conversionRule(fromId, toId) {
    const from = resolve(fromId);
    if (!from) return { ok: false, reason: 'unknown-currency' };
    if (!resolve(toId)) return { ok: false, reason: 'unknown-currency' };
    const rule = from.conversionPolicy.rules.find(entry => entry && entry.to === toId
      && Number.isSafeInteger(entry.fromAmount) && entry.fromAmount > 0
      && Number.isSafeInteger(entry.toAmount) && entry.toAmount >= 0);
    if (!rule) return { ok: false, reason: 'no-conversion-policy' };
    return { ok: true, policyVersion: from.conversionPolicy.version, rule };
  }

  definitions.set('gold', freezeDefinition({ id: 'gold', class: 'SOFT_EARNED', wallet: 'coins' }));
  definitions.set('candy', freezeDefinition({ id: 'candy', class: 'SCARCE_VOUCHER', wallet: 'candy' }));

  return Object.freeze({ register, setStatus, resolve, list, conversionRule, CLASSES, STATUSES });
})();

// Generic registry-wallet balances (currencies whose `wallet` is 'registry',
// e.g. test fixtures / future additive currencies). Tolerant on load like
// every save slice; mutation stays strict inside GrantService.
const CURRENCY_BALANCE_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
function normalizeCurrencyBalances(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const out = {};
  for (const key of Object.keys(source).filter(key => CURRENCY_BALANCE_ID_PATTERN.test(key)).sort()) {
    const n = Math.floor(Number(source[key]));
    if (Number.isFinite(n) && n > 0) out[key] = Math.min(n, 1_000_000_000);
  }
  return out;
}

// Historical p001-p040 IDs are retained only as a migration/default compatibility
// baseline. They are NOT the authority for how many Puzzle levels may exist.
// New Puzzle content may add stable IDs without changing the shared save schema.
const PUZZLE_LEGACY_SAVE_LEVEL_IDS = Object.freeze(Array.from({ length: 40 }, (_, index) => `p${String(index + 1).padStart(3, '0')}`));
const PUZZLE_SAVE_LEVEL_IDS = PUZZLE_LEGACY_SAVE_LEVEL_IDS; // compatibility alias for legacy tests/tools
const PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS = 256;
const PUZZLE_SAVE_MAX_MEMORY_POINTS_PER_LEVEL = 4096;
const PUZZLE_SAVE_MAX_COORDINATE = 4095; // corruption guard, not board geometry

function isPuzzleSaveLevelId(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9._-]{0,63}$/.test(value);
}

function collectPuzzleSaveLevelIds(progress) {
  const source = progress && typeof progress === 'object' && !Array.isArray(progress) ? progress : {};
  const ids = new Set(PUZZLE_LEGACY_SAVE_LEVEL_IDS);
  const add = value => {
    if (ids.size < PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS && isPuzzleSaveLevelId(value)) ids.add(value);
  };
  if (Array.isArray(source.levelsUnlocked)) source.levelsUnlocked.forEach(add);
  for (const field of ['levelStars', 'levelStarFlags', 'levelMemory', 'levelYumminess', 'levelYumCoinsPending', 'levelSeeds']) {
    const record = source[field];
    if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
    Object.keys(record).forEach(add);
  }
  const legacyOrder = new Map(PUZZLE_LEGACY_SAVE_LEVEL_IDS.map((id, index) => [id, index]));
  return [...ids].sort((a, b) => {
    const ai = legacyOrder.has(a) ? legacyOrder.get(a) : Number.MAX_SAFE_INTEGER;
    const bi = legacyOrder.has(b) ? legacyOrder.get(b) : Number.MAX_SAFE_INTEGER;
    return ai - bi || a.localeCompare(b);
  });
}

function normalizePuzzleMemoryPoints(points) {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(points) ? points : [];
  for (const point of source) {
    if (!point || typeof point !== 'object' || Array.isArray(point)) continue;
    if (!Number.isInteger(point.row) || !Number.isInteger(point.col)) continue;
    if (point.row < 0 || point.col < 0 || point.row > PUZZLE_SAVE_MAX_COORDINATE || point.col > PUZZLE_SAVE_MAX_COORDINATE) continue;
    const key = `${point.row},${point.col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ row: point.row, col: point.col });
    if (out.length >= PUZZLE_SAVE_MAX_MEMORY_POINTS_PER_LEVEL) break;
  }
  return out;
}

function createDefaultPuzzleProgress() {
  return {
    undosOwned: 1,
    levelsUnlocked: ['p001'],
    levelStars: Object.fromEntries(PUZZLE_SAVE_LEVEL_IDS.map(id => [id, 0])),
    // Player-facing mastery details are stored separately from the compact
    // numeric star total so old saves remain valid and can be upgraded safely.
    levelStarFlags: Object.fromEntries(PUZZLE_SAVE_LEVEL_IDS.map(id => [id, {
      complete: false, yumminessMax: false, emptyPond: false,
      neutralizedBombs: 0, totalBombs: 0,
    }])),
    // Legacy import field. Normal Puzzle Mode now keeps skull markers only in
    // the active PuzzleFrogState attempt and clears this field at each new run.
    levelMemory: Object.fromEntries(PUZZLE_SAVE_LEVEL_IDS.map(id => [id, []])),
    // Yumminess is run-local: it persists after a non-fatal heart-loss reset
    // but clears on full death or a manual retry. Coins commit only on level completion.
    levelYumminess: Object.fromEntries(PUZZLE_SAVE_LEVEL_IDS.map(id => [id, 0])),
    levelYumCoinsPending: Object.fromEntries(PUZZLE_SAVE_LEVEL_IDS.map(id => [id, 0])),
    // Per-level deterministic layout seeds keep retries reproducible while
    // attempt-local skull markers are cleared on any fresh run.
    levelSeeds: {},
    bonusLives: 0,
    // Score and earned coins are retained as light progression history. The
    // current level score itself lives in PuzzleFrogState and is reset on a
    // retry, while these totals survive as part of the player save.
    totalFruitScore: 0,
    totalPuzzleCoins: 0,
    lastLevelScore: 0,
    lastLevelCoins: 0,
    // Master-spec session telemetry. These do not affect puzzle logic; they
    // make progression history durable without persisting board obstacles.
    totalSpitUps: 0,
    totalYumMilestones: 0,
    // Mobile players can hide the puzzle D-pad; touch input remains optional.
    mobileDpadEnabled: false,
    // Campaign story is a presentation ledger only. It never changes Puzzle
    // mechanics, unlocks, solver state, or per-level result data.
    story: { schemaVersion: 1, seenScenes: {} },
    // Per-level memory of an explicit bomb-sweep/planning-tip skip. Presentation
    // only: it never changes Puzzle mechanics, unlocks, solver state, or
    // per-level result data.
    tutorialSkips: {},
    // First-route coach progress is presentation-only. It records which
    // player actions were genuinely performed and never changes the board,
    // solver, unlocks, score, or campaign state.
    firstRouteCoach: { emptyTravel: false, preferredFood: false, bellyRecovery: false, exitRoute: false, complete: false },
  };
}

const DEFAULT_STATS = {
  totalGamesPlayed:  0,
  totalPlayTimeSec:  0,
  totalFoodCaught:   0,
  totalBombsHit:     0,
  totalMisses:       0,
  totalHeartsCaught: 0,
  highestScore:      0,
  highestLevel:      1,
  longestComboEver:  0,
  perCharacter:      {},   // charId -> { gamesPlayed, bestScore }
  perMode:           {},   // modeId -> { gamesPlayed, bestScore }
};

// Phase 13.5.6 keeps Frog Bank history in the full-game root save rather
// than the isolated Infinite progress branch. The standalone never loads
// src/runtime/shared/systems.js or this module, so it cannot read or write shared Gold state.
const INFINITE_GOLD_EXCHANGE_DAILY_LIMIT = 2;
const INFINITE_GOLD_EXCHANGE_ROLLING_LIMIT = 10;
const INFINITE_GOLD_EXCHANGE_ROLLING_DAYS = 7;
const INFINITE_GOLD_EXCHANGE_MAX_FORWARD_DAY_JUMP = 31;

function infiniteGoldExchangeDayKey(now = Date.now()) {
  const date = new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function infiniteGoldExchangeDaySerial(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if (!match) return null;
  const value = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isFinite(value) ? Math.floor(value / 86_400_000) : null;
}

function normalizeInfiniteGoldExchangeLedger(raw, now = Date.now()) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const currentDayKey = infiniteGoldExchangeDayKey(now);
  const storedDayKey = /^\d{4}-\d{2}-\d{2}$/.test(String(source.dayKey || '')) ? String(source.dayKey) : '';
  let dayKey = storedDayKey || currentDayKey;
  let clockAnomaly = source.clockAnomaly === true;
  let clockAnomalyObservedDayKey = typeof source.clockAnomalyObservedDayKey === 'string' ? source.clockAnomalyObservedDayKey : '';
  if (!storedDayKey) {
    dayKey = currentDayKey;
    clockAnomaly = false;
    clockAnomalyObservedDayKey = '';
  } else if (currentDayKey < storedDayKey) {
    dayKey = storedDayKey;
  } else {
    const currentSerial = infiniteGoldExchangeDaySerial(currentDayKey);
    const storedSerial = infiniteGoldExchangeDaySerial(storedDayKey);
    const forwardDays = currentSerial !== null && storedSerial !== null ? currentSerial - storedSerial : 0;
    if (forwardDays > INFINITE_GOLD_EXCHANGE_MAX_FORWARD_DAY_JUMP) {
      // A synthetic far-future clock does not become the new accepted reward
      // day. This avoids both jackpot cycling and the "year 2099 lockout".
      dayKey = storedDayKey;
      clockAnomaly = true;
      clockAnomalyObservedDayKey = currentDayKey;
    } else {
      dayKey = currentDayKey;
      clockAnomaly = false;
      clockAnomalyObservedDayKey = '';
    }
  }

  const byDay = new Map();
  const accept = (key, amount) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || '')) || String(key) > dayKey) return;
    byDay.set(String(key), Math.max(0, Math.min(INFINITE_GOLD_EXCHANGE_DAILY_LIMIT, Math.floor(Number(amount) || 0))));
  };
  if (Array.isArray(source.acceptedDays)) {
    source.acceptedDays.slice(-32).forEach(entry => accept(entry?.dayKey, entry?.goldConverted));
  }
  // v1 migration: preserve the old daily amount as the first accepted-day row.
  if (storedDayKey) accept(storedDayKey, Math.max(byDay.get(storedDayKey) || 0, Math.floor(Number(source.goldConvertedToday) || 0)));
  if (!byDay.has(dayKey)) byDay.set(dayKey, 0);
  const acceptedDays = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-INFINITE_GOLD_EXCHANGE_ROLLING_DAYS)
    .map(([acceptedDayKey, goldConverted]) => ({ dayKey: acceptedDayKey, goldConverted }));
  const todayEntry = acceptedDays.find(entry => entry.dayKey === dayKey) || { goldConverted: 0 };
  const lifetimeAmount = Math.floor(Number(source.lifetimeGoldConverted));
  const rawLastExchangeAtMs = Math.floor(Number(source.lastExchangeAtMs));
  return {
    schemaVersion: 2,
    dayKey,
    goldConvertedToday: todayEntry.goldConverted,
    acceptedDays,
    rollingGoldConverted: acceptedDays.reduce((sum, entry) => sum + entry.goldConverted, 0),
    lifetimeGoldConverted: Number.isFinite(lifetimeAmount) ? Math.max(0, Math.min(1_000_000_000, lifetimeAmount)) : 0,
    lastExchangeAtMs: Number.isFinite(rawLastExchangeAtMs) ? Math.max(0, Math.min(Math.floor(now), rawLastExchangeAtMs)) : 0,
    clockAnomaly,
    clockAnomalyObservedDayKey,
  };
}


// Phase 13.6 Daily Goals are a full-game root ledger. Their progress resets
// by device-local calendar day like Frog Bank, while the deterministic daily
// Puzzle seed itself uses UTC inside src/runtime/shared/daily-goals.js so every player receives
// the same challenge layout for a given global date.
const DAILY_GOALS_LEDGER_VERSION = 1;
const DAILY_GOALS_MAX_PROGRESS = 1_000_000;
const DAILY_GOALS_MAX_TRACKED_IDS = 32;

function dailyGoalsDayKey(now = Date.now()) {
  const date = new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeDailyGoalsLedger(raw, now = Date.now()) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  // Monotonic accepted day: backward clock movement cannot re-open claimed
  // daily rewards or reset progress to farm them again.
  const currentDayKey = dailyGoalsDayKey(now);
  const storedDayKey = /^\d{4}-\d{2}-\d{2}$/.test(String(source.dayKey || '')) ? String(source.dayKey) : '';
  const dayKey = storedDayKey && currentDayKey < storedDayKey ? storedDayKey : currentDayKey;
  const sameLocalDay = source.dayKey === dayKey;
  const sourceProgress = sameLocalDay && source.progress && typeof source.progress === 'object' && !Array.isArray(source.progress)
    ? source.progress
    : {};
  const progress = {};
  Object.entries(sourceProgress).slice(0, DAILY_GOALS_MAX_TRACKED_IDS).forEach(([id, value]) => {
    if (!/^daily-[a-z][a-z0-9-]{0,63}$/.test(String(id))) return;
    const amount = Math.floor(Number(value));
    if (Number.isFinite(amount) && amount > 0) progress[id] = Math.min(DAILY_GOALS_MAX_PROGRESS, amount);
  });
  const claimedGoalIds = sameLocalDay && Array.isArray(source.claimedGoalIds)
    ? [...new Set(source.claimedGoalIds
      .map(value => String(value || ''))
      .filter(id => /^daily-[a-z][a-z0-9-]{0,63}$/.test(id)))].slice(0, DAILY_GOALS_MAX_TRACKED_IDS)
    : [];
  return {
    schemaVersion: DAILY_GOALS_LEDGER_VERSION,
    dayKey,
    progress,
    claimedGoalIds,
  };
}

// EC-2 ProgressionFacts — the durable cross-mode progression record. Facts are
// BOUNDED BY CONSTRUCTION: named counters, monotonic maxima/latest values, and
// first-occurrence stamps under hard key caps. There is deliberately NO
// append-only event log; anything needing history must justify its own bounded
// structure. Facts commit inside the same durable save transaction as the
// outcome they describe — never via events.
const PROGRESSION_FACTS_VERSION = 1;
const PROGRESSION_FACTS_MAX_COUNTERS = 256;
const PROGRESSION_FACTS_MAX_LATEST = 256;
const PROGRESSION_FACTS_MAX_FIRSTS = 512;
const PROGRESSION_FACTS_MAX_VALUE = 1_000_000_000_000;
const PROGRESSION_FACT_KEY_PATTERN = /^[a-z][a-z0-9._-]{0,95}$/;

function isValidProgressionFactKey(key) {
  if (typeof key !== 'string' || !PROGRESSION_FACT_KEY_PATTERN.test(key)) return false;
  return key.split('.').every(segment => !ECONOMY_LEDGER_FORBIDDEN_SEGMENTS.has(segment));
}

function clampProgressionFactNumber(value) {
  const amount = Math.floor(Number(value));
  return Number.isFinite(amount) ? Math.max(0, Math.min(PROGRESSION_FACTS_MAX_VALUE, amount)) : 0;
}

function normalizeProgressionFacts(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const counters = {};
  const latest = {};
  const firsts = {};
  const counterSource = source.counters && typeof source.counters === 'object' && !Array.isArray(source.counters) ? source.counters : {};
  const latestSource = source.latest && typeof source.latest === 'object' && !Array.isArray(source.latest) ? source.latest : {};
  const firstsSource = source.firsts && typeof source.firsts === 'object' && !Array.isArray(source.firsts) ? source.firsts : {};
  let kept = 0;
  for (const key of Object.keys(counterSource)) {
    if (kept >= PROGRESSION_FACTS_MAX_COUNTERS) break;
    if (!isValidProgressionFactKey(key)) continue;
    counters[key] = clampProgressionFactNumber(counterSource[key]);
    kept += 1;
  }
  kept = 0;
  for (const key of Object.keys(latestSource)) {
    if (kept >= PROGRESSION_FACTS_MAX_LATEST) break;
    if (!isValidProgressionFactKey(key)) continue;
    const entry = latestSource[key];
    const record = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
    latest[key] = { v: clampProgressionFactNumber(record.v), at: clampProgressionFactNumber(record.at) };
    kept += 1;
  }
  kept = 0;
  for (const key of Object.keys(firstsSource)) {
    if (kept >= PROGRESSION_FACTS_MAX_FIRSTS) break;
    if (!isValidProgressionFactKey(key)) continue;
    firsts[key] = clampProgressionFactNumber(firstsSource[key]);
    kept += 1;
  }
  return {
    schemaVersion: PROGRESSION_FACTS_VERSION,
    counters,
    latest,
    firsts,
    dropped: clampProgressionFactNumber(source.dropped),
  };
}

// Applies fact specs to the save document INSIDE a caller-owned durable
// transaction (SaveManager.set / EconomyLedger mutator / GrantService).
// Invalid specs are skipped and counted in `dropped` — facts must never be
// able to abort the value transaction that carries them.
// Spec kinds: {kind:'count',key,by} {kind:'max',key,value} {kind:'latest',key,value}
// {kind:'first',key}. Returns { applied, dropped, firstApplied: {key:true} }.
function recordProgressionFactsInTransaction(d, factSpecs) {
  const facts = d.progressionFacts = normalizeProgressionFacts(d.progressionFacts);
  const outcome = { applied: 0, dropped: 0, firstApplied: {} };
  const specs = Array.isArray(factSpecs) ? factSpecs : [];
  for (const spec of specs) {
    const key = spec && spec.key;
    if (!spec || !isValidProgressionFactKey(key)) { outcome.dropped += 1; continue; }
    if (spec.kind === 'count') {
      const has = Object.prototype.hasOwnProperty.call(facts.counters, key);
      if (!has && Object.keys(facts.counters).length >= PROGRESSION_FACTS_MAX_COUNTERS) { outcome.dropped += 1; continue; }
      const by = Math.max(1, clampProgressionFactNumber(spec.by === undefined ? 1 : spec.by));
      facts.counters[key] = Math.min(PROGRESSION_FACTS_MAX_VALUE, (has ? facts.counters[key] : 0) + by);
      outcome.applied += 1;
    } else if (spec.kind === 'max') {
      const has = Object.prototype.hasOwnProperty.call(facts.latest, key);
      if (!has && Object.keys(facts.latest).length >= PROGRESSION_FACTS_MAX_LATEST) { outcome.dropped += 1; continue; }
      const value = clampProgressionFactNumber(spec.value);
      if (!has || value > facts.latest[key].v) facts.latest[key] = { v: value, at: Date.now() };
      outcome.applied += 1;
    } else if (spec.kind === 'latest') {
      const has = Object.prototype.hasOwnProperty.call(facts.latest, key);
      if (!has && Object.keys(facts.latest).length >= PROGRESSION_FACTS_MAX_LATEST) { outcome.dropped += 1; continue; }
      facts.latest[key] = { v: clampProgressionFactNumber(spec.value), at: Date.now() };
      outcome.applied += 1;
    } else if (spec.kind === 'first') {
      if (Object.prototype.hasOwnProperty.call(facts.firsts, key)) continue; // already recorded; not an error
      if (Object.keys(facts.firsts).length >= PROGRESSION_FACTS_MAX_FIRSTS) { outcome.dropped += 1; continue; }
      // Migrations pass an explicit deterministic `at` (typically 0) so that
      // running a migration twice stays byte-identical; live gameplay omits it.
      facts.firsts[key] = spec.at === undefined ? Date.now() : clampProgressionFactNumber(spec.at);
      outcome.firstApplied[key] = true;
      outcome.applied += 1;
    } else {
      outcome.dropped += 1;
    }
  }
  if (outcome.dropped > 0) facts.dropped = Math.min(PROGRESSION_FACTS_MAX_VALUE, facts.dropped + outcome.dropped);
  return outcome;
}

// Cutover Contract amendment A: when a future cutover migration maps a legacy
// Puzzle clear to a different canonical level ID, it must establish the durable
// state for that canonical level to ALREADY count as completed — without
// incrementing counters, emitting facts/events, or issuing any grant. A legacy
// clear can never become a new reward opportunity because its identifier
// changed. This helper is the ONLY sanctioned way for a migration to do that;
// it is deterministic (appliedAt 0) so migrations stay byte-idempotent.
function seedMigratedPuzzleClearInPlace(d, canonicalLevelId) {
  const levelId = String(canonicalLevelId || '');
  if (!isPuzzleSaveLevelId(levelId)) return { ok: false, reason: 'invalid-level-id' };
  if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
    d.puzzleProgress = createDefaultPuzzleProgress();
  }
  const progress = d.puzzleProgress;
  if (!progress.levelStars || typeof progress.levelStars !== 'object') progress.levelStars = {};
  if (!progress.levelStarFlags || typeof progress.levelStarFlags !== 'object') progress.levelStarFlags = {};
  if (!Array.isArray(progress.levelsUnlocked)) progress.levelsUnlocked = ['p001'];
  progress.levelStars[levelId] = Math.max(1, Math.floor(Number(progress.levelStars[levelId]) || 0));
  const priorFlags = progress.levelStarFlags[levelId];
  const flags = priorFlags && typeof priorFlags === 'object' && !Array.isArray(priorFlags) ? priorFlags : {
    complete: false, yumminessMax: false, emptyPond: false, neutralizedBombs: 0, totalBombs: 0,
  };
  flags.complete = true;
  progress.levelStarFlags[levelId] = flags;
  if (!progress.levelsUnlocked.includes(levelId)) progress.levelsUnlocked.push(levelId);
  // Pre-seed the first-clear fact at deterministic time 0. The live completion
  // path increments `puzzle.levels-cleared` ONLY when its first-fact actually
  // applies, so a migrated clear can never re-count or re-reward.
  recordProgressionFactsInTransaction(d, [{ kind: 'first', key: `puzzle.first-clear.${levelId}`, at: 0 }]);
  return { ok: true, levelId };
}

// Restores a save document to a snapshot in place, preserving the root object
// identity other systems may hold. Shared by the economy ledger's rejection
// rollback and SaveManager.setDurable's failed-flush rollback.
function restoreSaveDocumentInPlace(target, snapshotJson) {
  const snapshot = JSON.parse(snapshotJson);
  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) delete target[key];
  }
  Object.assign(target, snapshot);
}

// P0-B economy transaction ledger. Every valuable mutation that must happen
// exactly once records its transaction ID here, inside the same durable save
// write as the mutation itself. EventBus remains post-commit notification and
// never durable economy authority.
const ECONOMY_LEDGER_VERSION = 1;
const ECONOMY_LEDGER_MAX_AMOUNT = 1_000_000_000;
// First character must be alphanumeric so `__proto__` can never validate;
// later segments are additionally screened against forbidden prototype names.
const ECONOMY_TRANSACTION_ID_PATTERN = /^[a-z0-9][a-z0-9:._-]{0,159}$/i;
const ECONOMY_LEDGER_TEXT_PATTERN = /^[a-z0-9][a-z0-9:._-]{0,63}$/i;
const ECONOMY_LEDGER_FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function isValidEconomyTransactionId(value) {
  if (typeof value !== 'string' || !ECONOMY_TRANSACTION_ID_PATTERN.test(value)) return false;
  return value.split(':').every(segment => !ECONOMY_LEDGER_FORBIDDEN_SEGMENTS.has(segment.toLowerCase()));
}

function sanitizeEconomyLedgerText(value, fallback = '') {
  return typeof value === 'string' && ECONOMY_LEDGER_TEXT_PATTERN.test(value)
    && !ECONOMY_LEDGER_FORBIDDEN_SEGMENTS.has(value.toLowerCase())
    ? value
    : fallback;
}

function normalizeEconomyLedgerRecord(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const amount = Math.floor(Number(source.amount));
  const appliedAt = Math.floor(Number(source.appliedAt));
  const record = {
    domain: sanitizeEconomyLedgerText(source.domain, 'economy'),
    kind: sanitizeEconomyLedgerText(source.kind, 'transaction'),
    subjectId: sanitizeEconomyLedgerText(source.subjectId, ''),
    amount: Number.isFinite(amount) ? Math.max(0, Math.min(ECONOMY_LEDGER_MAX_AMOUNT, amount)) : 0,
    contentVersion: sanitizeEconomyLedgerText(source.contentVersion, ''),
    appliedAt: Number.isFinite(appliedAt) ? Math.max(0, appliedAt) : 0,
  };
  if (source.reconstructed === true) record.reconstructed = true;
  return record;
}

function normalizeEconomyLedger(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const appliedSource = source.applied && typeof source.applied === 'object' && !Array.isArray(source.applied)
    ? source.applied
    : {};
  const applied = {};
  // Valid applied IDs are durable transaction history and are NEVER pruned:
  // a silently dropped ID becomes replayable, which re-pays its transaction.
  // Only invalid/prototype-shaped IDs are discarded.
  for (const transactionId of Object.keys(appliedSource)) {
    if (!isValidEconomyTransactionId(transactionId)) continue;
    applied[transactionId] = normalizeEconomyLedgerRecord(appliedSource[transactionId]);
  }
  return { schemaVersion: ECONOMY_LEDGER_VERSION, applied };
}

// Corrupt/missing ledger repair must never silently reopen deterministic
// rewards that durable progression state proves were already paid. The claimed
// achievement list is that durable proof for achievement payouts, so those
// applied IDs are reconstructed here. One-time purchases need no ledger
// reconstruction: ownership itself (unlockedChars/unlockedCosmetics) durably
// blocks re-purchase before any spend is attempted. Future valuable IDs with
// no reconstructable durable proof must fail closed rather than degrade to an
// empty ledger.
function reconcileEconomyLedger(rawLedger, save) {
  const ledger = normalizeEconomyLedger(rawLedger);
  const claimed = save && Array.isArray(save.achievementRewardsClaimed) ? save.achievementRewardsClaimed : [];
  for (const achievementId of claimed) {
    if (typeof achievementId !== 'string') continue;
    const transactionId = `achievement:${achievementId}`;
    if (!isValidEconomyTransactionId(transactionId)) continue;
    if (Object.prototype.hasOwnProperty.call(ledger.applied, transactionId)) continue;
    // appliedAt/amount stay 0 so reconstruction is deterministic and never
    // claims value movement it cannot prove; the entry only closes the door.
    ledger.applied[transactionId] = normalizeEconomyLedgerRecord({
      domain: 'progression', kind: 'achievement-reward', subjectId: achievementId, reconstructed: true,
    });
  }
  return ledger;
}

const MIGRATIONS = [
  {
    to: 1,
    run(d) {
      if (!d.leaderboard)    d.leaderboard = [];
      if (!d.bestScore)      d.bestScore = 0;
      if (!d.audio) d.audio = { master: 1.0, sfx: 1.0, bgm: 1.0, menu: 1.0 };
      if (d.volume !== undefined) { d.audio.master = d.volume === 0 ? 0 : d.volume / 5; delete d.volume; }
      if (!d.selectedChar)   d.selectedChar = 'classic';
      if (!d.unlockedChars)  d.unlockedChars = ['classic'];
      if (!d.achievements)   d.achievements = [];
      if (!d.unlockedCosmetics) d.unlockedCosmetics = [];
      if (!d.equippedCosmetics) d.equippedCosmetics = {};
    }
  },
  {
    to: 2,
    run(d) {
      if (!d.stats) d.stats = structuredClone(DEFAULT_STATS);
    }
  },
  {
    to: 3,
    run(d) {
      if (d.devModeUnlocked === undefined) d.devModeUnlocked = false;
    }
  },
  {
    to: 4,
    run(d) {
      // Progression system fields (src/runtime/shared/progression.js)
      // ProgressionManager may not be defined yet at migration time if
      // src/runtime/shared/systems.js loads before src/runtime/shared/progression.js, so we inline the defaults here.
      if (d.coins === undefined)                    d.coins = 0;
      if (!d.achievementRewardsClaimed)             d.achievementRewardsClaimed = [];
      if (d.lifetimeCoinsEarned === undefined)      d.lifetimeCoinsEarned = 0;
    }
  },
  {
    to: 5,
    run(d) {
      // Puzzle Mode is fully additive. Existing arcade saves receive a
      // complete, playable puzzle slot without altering their old progress.
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
    }
  },
  {
    to: 6,
    run(d) {
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
      if (!d.puzzleProgress.levelSeeds || typeof d.puzzleProgress.levelSeeds !== 'object' || Array.isArray(d.puzzleProgress.levelSeeds)) {
        d.puzzleProgress.levelSeeds = {};
      }
    }
  },
  {
    to: 7,
    run(d) {
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
      if (typeof d.puzzleProgress.mobileDpadEnabled !== 'boolean') d.puzzleProgress.mobileDpadEnabled = false;
    }
  },
  {
    to: 8,
    run(d) {
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
      const progress = d.puzzleProgress;
      if (!Number.isFinite(progress.totalFruitScore) || progress.totalFruitScore < 0) progress.totalFruitScore = 0;
      if (!Number.isFinite(progress.totalPuzzleCoins) || progress.totalPuzzleCoins < 0) progress.totalPuzzleCoins = 0;
      if (!Number.isFinite(progress.lastLevelScore) || progress.lastLevelScore < 0) progress.lastLevelScore = 0;
      if (!Number.isFinite(progress.lastLevelCoins) || progress.lastLevelCoins < 0) progress.lastLevelCoins = 0;
    }
  },
  {
    to: 9,
    run(d) {
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
      const progress = d.puzzleProgress;
      if (!Number.isFinite(progress.totalSpitUps) || progress.totalSpitUps < 0) progress.totalSpitUps = 0;
      if (!Number.isFinite(progress.totalYumMilestones) || progress.totalYumMilestones < 0) progress.totalYumMilestones = 0;
      if (!progress.levelYumminess || typeof progress.levelYumminess !== 'object' || Array.isArray(progress.levelYumminess)) progress.levelYumminess = {};
      if (!progress.levelYumCoinsPending || typeof progress.levelYumCoinsPending !== 'object' || Array.isArray(progress.levelYumCoinsPending)) progress.levelYumCoinsPending = {};
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        if (!Number.isFinite(progress.levelYumminess[id]) || progress.levelYumminess[id] < 0) progress.levelYumminess[id] = 0;
        if (!Number.isFinite(progress.levelYumCoinsPending[id]) || progress.levelYumCoinsPending[id] < 0) progress.levelYumCoinsPending[id] = 0;
      });
    }
  },
  {
    to: 10,
    run(d) {
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
      }
      const progress = d.puzzleProgress;
      // Final Puzzle Mode keeps these fields only as run telemetry. Active
      // levels reset them explicitly on retry/full death, so repair malformed
      // imported values without inventing cross-run carry-over.
      if (!progress.levelYumminess || typeof progress.levelYumminess !== 'object' || Array.isArray(progress.levelYumminess)) progress.levelYumminess = {};
      if (!progress.levelYumCoinsPending || typeof progress.levelYumCoinsPending !== 'object' || Array.isArray(progress.levelYumCoinsPending)) progress.levelYumCoinsPending = {};
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        if (!Number.isFinite(progress.levelYumminess[id]) || progress.levelYumminess[id] < 0) progress.levelYumminess[id] = 0;
        if (!Number.isFinite(progress.levelYumCoinsPending[id]) || progress.levelYumCoinsPending[id] < 0) progress.levelYumCoinsPending[id] = 0;
      });
    }
  },
  {
    to: 11,
    run(d) {
      // World 2 adds p006-p010. Existing saves keep their completion history
      // and simply receive clean locked slots for the new campaign levels.
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
        return;
      }
      const progress = d.puzzleProgress;
      if (!Array.isArray(progress.levelsUnlocked)) progress.levelsUnlocked = ['p001'];
      if (!progress.levelStars || typeof progress.levelStars !== 'object' || Array.isArray(progress.levelStars)) progress.levelStars = {};
      if (!progress.levelMemory || typeof progress.levelMemory !== 'object' || Array.isArray(progress.levelMemory)) progress.levelMemory = {};
      if (!progress.levelYumminess || typeof progress.levelYumminess !== 'object' || Array.isArray(progress.levelYumminess)) progress.levelYumminess = {};
      if (!progress.levelYumCoinsPending || typeof progress.levelYumCoinsPending !== 'object' || Array.isArray(progress.levelYumCoinsPending)) progress.levelYumCoinsPending = {};
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        if (!Number.isFinite(progress.levelStars[id])) progress.levelStars[id] = 0;
        if (!Array.isArray(progress.levelMemory[id])) progress.levelMemory[id] = [];
        if (!Number.isFinite(progress.levelYumminess[id])) progress.levelYumminess[id] = 0;
        if (!Number.isFinite(progress.levelYumCoinsPending[id])) progress.levelYumCoinsPending[id] = 0;
      });
    }
  },
  {
    to: 12,
    run(d) {
      // World 3/4 adds p011-p020. Preserve earned history and advance a
      // completed prior campaign into the new arc without granting stars.
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
        return;
      }
      const progress = d.puzzleProgress;
      if (!Array.isArray(progress.levelsUnlocked)) progress.levelsUnlocked = ['p001'];
      if (!progress.levelStars || typeof progress.levelStars !== 'object' || Array.isArray(progress.levelStars)) progress.levelStars = {};
      if (!progress.levelMemory || typeof progress.levelMemory !== 'object' || Array.isArray(progress.levelMemory)) progress.levelMemory = {};
      if (!progress.levelYumminess || typeof progress.levelYumminess !== 'object' || Array.isArray(progress.levelYumminess)) progress.levelYumminess = {};
      if (!progress.levelYumCoinsPending || typeof progress.levelYumCoinsPending !== 'object' || Array.isArray(progress.levelYumCoinsPending)) progress.levelYumCoinsPending = {};

      const unlocked = new Set(progress.levelsUnlocked.filter(id => PUZZLE_SAVE_LEVEL_IDS.includes(id)));
      unlocked.add('p001');
      // The development build retains full test-save access after the campaign
      // grows. Production deliberately compiles this flag out.
      let unlockEntireCampaign = false;
      if (unlockEntireCampaign) {
        PUZZLE_SAVE_LEVEL_IDS.forEach(id => unlocked.add(id));
      } else if (Math.max(0, Math.floor(Number(progress.levelStars.p010) || 0)) >= 1) {
        // A player who completed the former finale can immediately begin the
        // new arc, but must still earn p012-p020 in sequence.
        unlocked.add('p011');
      }
      progress.levelsUnlocked = PUZZLE_SAVE_LEVEL_IDS.filter(id => unlocked.has(id));
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        if (!Number.isFinite(progress.levelStars[id])) progress.levelStars[id] = 0;
        if (!Array.isArray(progress.levelMemory[id])) progress.levelMemory[id] = [];
        if (!Number.isFinite(progress.levelYumminess[id])) progress.levelYumminess[id] = 0;
        if (!Number.isFinite(progress.levelYumCoinsPending[id])) progress.levelYumCoinsPending[id] = 0;
      });
    }
  },
  {
    to: 13,
    run(d) {
      // Mastery-star details add explanatory UI without invalidating the
      // existing numeric star totals on older saves.
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
        return;
      }
      const progress = d.puzzleProgress;
      if (!progress.levelStarFlags || typeof progress.levelStarFlags !== 'object' || Array.isArray(progress.levelStarFlags)) {
        progress.levelStarFlags = {};
      }
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        const source = progress.levelStarFlags[id];
        const flags = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
        progress.levelStarFlags[id] = {
          complete: flags.complete === true,
          yumminessMax: flags.yumminessMax === true,
          emptyPond: flags.emptyPond === true,
          neutralizedBombs: Math.max(0, Math.floor(Number(flags.neutralizedBombs) || 0)),
          totalBombs: Math.max(0, Math.floor(Number(flags.totalBombs) || 0)),
        };
      });
    }
  },
  {
    to: 14,
    run(d) {
      // World V (p021–p040) is a separate campaign arc. Existing players who
      // cleared the former finale receive only p021; all later Echo Marsh
      // levels remain sequence-unlocked through normal completion.
      if (!d.puzzleProgress || typeof d.puzzleProgress !== 'object' || Array.isArray(d.puzzleProgress)) {
        d.puzzleProgress = createDefaultPuzzleProgress();
        return;
      }
      const progress = d.puzzleProgress;
      if (!Array.isArray(progress.levelsUnlocked)) progress.levelsUnlocked = ['p001'];
      if (!progress.levelStars || typeof progress.levelStars !== 'object' || Array.isArray(progress.levelStars)) progress.levelStars = {};
      if (!progress.levelMemory || typeof progress.levelMemory !== 'object' || Array.isArray(progress.levelMemory)) progress.levelMemory = {};
      if (!progress.levelYumminess || typeof progress.levelYumminess !== 'object' || Array.isArray(progress.levelYumminess)) progress.levelYumminess = {};
      if (!progress.levelYumCoinsPending || typeof progress.levelYumCoinsPending !== 'object' || Array.isArray(progress.levelYumCoinsPending)) progress.levelYumCoinsPending = {};
      if (!progress.levelStarFlags || typeof progress.levelStarFlags !== 'object' || Array.isArray(progress.levelStarFlags)) progress.levelStarFlags = {};

      const unlocked = new Set(progress.levelsUnlocked.filter(id => PUZZLE_SAVE_LEVEL_IDS.includes(id)));
      unlocked.add('p001');
      let unlockEntireCampaign = false;
      if (unlockEntireCampaign) {
        PUZZLE_SAVE_LEVEL_IDS.forEach(id => unlocked.add(id));
      } else if (Math.max(0, Math.floor(Number(progress.levelStars.p020) || 0)) >= 1) {
        unlocked.add('p021');
      }
      progress.levelsUnlocked = PUZZLE_SAVE_LEVEL_IDS.filter(id => unlocked.has(id));
      PUZZLE_SAVE_LEVEL_IDS.forEach(id => {
        if (!Number.isFinite(progress.levelStars[id])) progress.levelStars[id] = 0;
        if (!Array.isArray(progress.levelMemory[id])) progress.levelMemory[id] = [];
        if (!Number.isFinite(progress.levelYumminess[id])) progress.levelYumminess[id] = 0;
        if (!Number.isFinite(progress.levelYumCoinsPending[id])) progress.levelYumCoinsPending[id] = 0;
        const flags = progress.levelStarFlags[id];
        if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
          progress.levelStarFlags[id] = {
            complete: false, yumminessMax: false, emptyPond: false,
            neutralizedBombs: 0, totalBombs: 0,
          };
        }
      });
    }
  },
  {
    to: 15,
    run(d) {
      // Infinite Feasts is a namespaced colony save. It never touches the
      // main coin balance, cosmetic save sanitation, or any other mode's fields.
      d.infiniteProgress = typeof InfiniteSave !== 'undefined'
        ? InfiniteSave.normalizeProgress(d.infiniteProgress, Date.now())
        : (d.infiniteProgress && typeof d.infiniteProgress === 'object' ? d.infiniteProgress : {
          coins: 0, lifetimeFood: 0, unlockedFrogTypes: [], frogs: [], buildings: [], lastOfflineCheckMs: Date.now(),
        });
    }
  },
  {
    to: 16,
    run(d) {
      // Phase 13.5.1 adds colony territory, milestones, and timed station
      // construction. The mode-local normalizer preserves existing Phase
      // 13.5 colonies as fully explored, while a brand-new colony starts on
      // its compact center patch. No shared-mode/save fields are changed.
      d.infiniteProgress = typeof InfiniteSave !== 'undefined'
        ? InfiniteSave.normalizeProgress(d.infiniteProgress, Date.now())
        : (d.infiniteProgress && typeof d.infiniteProgress === 'object' ? d.infiniteProgress : {
          coins: 0, lifetimeFood: 0, unlockedFrogTypes: [], frogs: [], buildings: [],
          exploredCells: [], milestonesClaimed: [], lastOfflineCheckMs: Date.now(),
        });
    }
  },
  {
    to: 17,
    run(d) {
      // Phase 13.5.2 adds only mode-local colony status fields. Avoid calling
      // InfiniteSave here because src/runtime/shared/systems.js can migrate before its classic
      // script module is loaded; InfiniteSave performs the full canonical
      // normalizer pass when Infinite Feasts starts. This migration only gives
      // already-persisted frog records safe durable defaults.
      if (!d.infiniteProgress || typeof d.infiniteProgress !== 'object' || Array.isArray(d.infiniteProgress)) return;
      const progress = d.infiniteProgress;
      progress.schemaVersion = Math.max(3, Math.floor(Number(progress.schemaVersion) || 0));
      if (Array.isArray(progress.frogs)) {
        progress.frogs = progress.frogs.map(frog => {
          if (!frog || typeof frog !== 'object' || Array.isArray(frog)) return frog;
          const health = Number(frog.health);
          const fullness = Number(frog.fullness);
          const waste = Number(frog.waste);
          return {
            ...frog,
            health: Number.isFinite(health) ? Math.max(0, Math.min(100, health)) : 100,
            fullness: Number.isFinite(fullness) ? Math.max(0, Math.min(100, fullness)) : 0,
            waste: Number.isFinite(waste) ? Math.max(0, Math.min(100, waste)) : 0,
          };
        });
      }
    }
  },
  {
    to: 18,
    run(d) {
      // Phase 13.5.4 centralizes Infinite definition IDs. Existing colonies
      // retain their previously usable roster; legacy building records gain a
      // durable `building-N` instance ID. The canonical normalizer is loaded
      // before SaveManager in full builds and remains the source of truth.
      if (!d.infiniteProgress || typeof d.infiniteProgress !== 'object' || Array.isArray(d.infiniteProgress)) return;
      if (typeof InfiniteSave !== 'undefined') {
        d.infiniteProgress = InfiniteSave.normalizeProgress(d.infiniteProgress, Date.now());
        return;
      }
      const progress = d.infiniteProgress;
      const sourceVersion = Math.floor(Number(progress.schemaVersion) || 0);
      const legacyFrogIds = ['common', 'berry', 'toad', 'dessert', 'hunter', 'aquatic', 'glutton'];
      if (sourceVersion < 4 || !Array.isArray(progress.unlockedFrogTypes)) progress.unlockedFrogTypes = legacyFrogIds;
      const usedBuildingIds = new Set();
      let nextBuildingId = 1;
      if (Array.isArray(progress.buildings)) {
        progress.buildings = progress.buildings.map(building => {
          if (!building || typeof building !== 'object' || Array.isArray(building)) return building;
          const candidate = /^building-([1-9]\d*)$/.exec(String(building.id || ''));
          let id = candidate ? `building-${Number(candidate[1])}` : '';
          while (!id || usedBuildingIds.has(id)) id = `building-${nextBuildingId++}`;
          usedBuildingIds.add(id);
          const sequence = Number(/^building-([1-9]\d*)$/.exec(id)?.[1] || 0);
          nextBuildingId = Math.max(nextBuildingId, sequence + 1);
          return { ...building, id };
        });
      }
      progress.schemaVersion = Math.max(4, sourceVersion);
    }
  },
  {
    to: 19,
    run(d) {
      // Phase 13.5.5 adds persistent territory tiers inside the isolated
      // Infinite progress branch. The InfiniteSave normalizer performs the
      // coordinate migration (5×5 legacy core → centered max map); this root
      // migration deliberately does not move coordinates a second time.
      if (!d.infiniteProgress || typeof d.infiniteProgress !== 'object' || Array.isArray(d.infiniteProgress)) return;
      if (typeof InfiniteSave !== 'undefined') {
        d.infiniteProgress = InfiniteSave.normalizeProgress(d.infiniteProgress, Date.now());
        return;
      }
      const progress = d.infiniteProgress;
      if (!Number.isInteger(progress.mapTier) || progress.mapTier < 0 || progress.mapTier > 4) progress.mapTier = 0;
      // Do not claim schema 5 here when the normalizer is unavailable: it
      // must still see the legacy schema marker in order to shift positions.
    }
  },
  {
    to: 20,
    run(d) {
      // Phase 13.5.6 adds the full-game Frog Bank ledger. It is deliberately
      // root-owned: Infinite standalone has no shared-Gold bridge or ledger.
      d.infiniteGoldExchange = normalizeInfiniteGoldExchangeLedger(d.infiniteGoldExchange, Date.now());
    }
  },
  {
    to: 21,
    run(d) {
      // Phase 13.6 adds the full-game Daily Goals ledger. It stays outside
      // infiniteProgress so a standalone colony can never claim shared Gold
      // or acquire full-game daily state.
      d.dailyGoals = normalizeDailyGoalsLedger(d.dailyGoals, Date.now());
    }
  },
  {
    to: 22,
    run(d) {
      // v1.0.48 adds offline Character Feast Orders. The feature module owns
      // detailed normalization; this migration only creates the isolated root
      // ledger so older saves keep every existing progression field intact.
      if (!d.feastOrders || typeof d.feastOrders !== 'object' || Array.isArray(d.feastOrders)) d.feastOrders = {};
    }
  },
  {
    to: 23,
    run(d) {
      // v1.0.51 consolidates every Arcade comeback path into one optional,
      // save-backed Revenge Challenge. Detailed validation remains owned by
      // arcade-revenge-challenges.js after character/order data is available.
      if (!d.arcadeRevenge || typeof d.arcadeRevenge !== 'object' || Array.isArray(d.arcadeRevenge)) {
        d.arcadeRevenge = { schemaVersion: 1, challenge: null, totalCompleted: 0, lastCompleted: null };
      }
    }
  },
  {
    to: 24,
    run(d) {
      // v1.0.68 separates competitive personal bests by mode and ruleset while
      // retaining the historical global best for shared unlock progression.
      if (!d.bestScoresByRuleset || typeof d.bestScoresByRuleset !== 'object' || Array.isArray(d.bestScoresByRuleset)) {
        d.bestScoresByRuleset = {};
      }
    }
  },
  {
    to: 25,
    run(d) {
      // RC16 retires Ocean as an Arcade identity. Historical selection safely returns to Classic Frog.
      if (!Array.isArray(d.unlockedChars)) d.unlockedChars = ['classic'];
      if (d.selectedChar === 'ocean') d.selectedChar = 'classic';
    }
  },
  {
    to: 26,
    run(d) {
      // The legacy procedural/effect cosmetic catalog was retired. Keep only approved current content.
      if (typeof sanitizeCosmeticSaveData === 'function') sanitizeCosmeticSaveData(d);
    }
  },
  {
    to: 27,
    run(d) {
      // P0-B adds the root economy transaction ledger. Existing balances and
      // progression fields are untouched; already-claimed achievement payouts
      // are reconstructed as applied IDs so introducing the ledger can never
      // reopen a reward the save proves was paid.
      d.economyLedger = reconcileEconomyLedger(d.economyLedger, d);
    }
  },
  {
    to: 28,
    run(d) {
      // EC-2 adds the bounded ProgressionFacts root. Introducing it never
      // changes balances, unlocks, or any mode-owned durable state.
      d.progressionFacts = normalizeProgressionFacts(d.progressionFacts);
    }
  },
  {
    to: 29,
    run(d) {
      // EC-2.5 adds the shared Jeweled Candy balance and the per-item
      // entitlement ownership map. Deterministic and idempotent: existing
      // values normalize in place; absent values initialize empty. No other
      // balance, unlock, ledger, or fact is touched.
      d.candy = normalizeCandyBalance(d.candy);
      d.entitlements = normalizeEntitlements(d.entitlements);
    }
  },
  {
    to: 30,
    run(d) {
      // Only Collection-owned optional state is introduced. Canonical value,
      // progress, unlock, achievement, fact, and transaction roots are untouched.
      d.collectionPlatform = normalizeCollectionPlatformState(d.collectionPlatform);
    }
  }
];

const SaveManager = (() => {
  const BASE_KEY = 'froggyFeast';
  // ThemeSaveResolver locks the selected product namespace at boot. A later
  // presentation-only ThemeSystem.apply() cannot redirect a live save session.
  const KEY = typeof ThemeSaveResolver !== 'undefined'
    ? ThemeSaveResolver.key(BASE_KEY, { consumer: 'full-game' })
    : BASE_KEY;
  let _data = null;
  let _transactionDepth = 0;
  let _transactionDirty = false;
  // An older runtime that loads a save written by a NEWER schema must treat it
  // as read-only: it may read best-effort, but never migrate, normalize, or
  // rewrite data it does not understand.
  let _futureSaveReadOnly = false;
  let _futureWriteWarned = false;
  let _writeFailureWarned = false;
  // When the primary cannot even be READ, "no save" and "unreadable save" are
  // indistinguishable — so this session must never write defaults over what
  // might be real progress. Reads run on in-memory defaults; writes stay off.
  let _storageReadFailed = false;
  // EC-5 multi-tab policy: the exact bytes this session last read from or
  // wrote to storage. A mismatch before a write means another tab committed
  // newer durable state — this session adopts it before mutating (a stale
  // tab can never silently overwrite a newer durable transaction).
  let _lastSyncedBytes = null;
  // EC-5: sticky-until-recovery signal that durable writes are failing
  // (quota/private mode). Presentation may show honest state; recovery is
  // still owned by the retry-on-next-write behavior below.
  let _writeDegraded = false;
  // Distinguish a genuinely new local player from the normalized defaults
  // that load() may persist during first boot. Cloud reconciliation uses this
  // to decide whether a remote copy may be restored without treating defaults
  // as player-authored progress.
  let _primaryExisted = false;
  // Sibling keys inherit the theme-resolved namespace. `.lkg` holds the last
  // healthy primary bytes; `.corrupt` preserves malformed bytes verbatim so a
  // damaged save is never the player's only destroyed copy.
  const RECOVERY_KEY = KEY + '.lkg';
  const QUARANTINE_KEY = KEY + '.corrupt';

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function quarantineCorruptPrimary(rawBytes) {
    if (typeof rawBytes !== 'string' || !rawBytes) return;
    try { localStorage.setItem(QUARANTINE_KEY, rawBytes); } catch (_) {}
  }

  function readRecoverySnapshot() {
    try {
      const bytes = localStorage.getItem(RECOVERY_KEY);
      if (typeof bytes === 'string' && bytes) {
        const parsed = JSON.parse(bytes);
        if (isRecord(parsed)) {
          console.warn('[SaveManager] Malformed primary save; restored the last-known-good snapshot. Original bytes preserved under', QUARANTINE_KEY);
          return parsed;
        }
      }
    } catch (_) {}
    console.warn('[SaveManager] Malformed primary save with no usable recovery snapshot; starting fresh. Original bytes preserved under', QUARANTINE_KEY);
    return {};
  }

  function writeRecoverySnapshot() {
    if (previewPersistenceDisabled() || _futureSaveReadOnly || _storageReadFailed) return;
    // Serialize the known-good in-memory state rather than copying primary
    // bytes: after a failed primary write the primary may still hold corrupt
    // bytes, and copying them here would destroy the last-known-good copy.
    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(_data)); } catch (_) {}
  }

  function normalizeFiniteNumber(value, fallback, min = -Infinity) {
    return Number.isFinite(value) && value >= min ? value : fallback;
  }

  // Imports and manually edited localStorage can contain valid JSON with the
  // wrong value types. Preserve recognised, valid values while repairing only
  // fields whose type would otherwise crash normal gameplay/UI code.
  function normalizeSaveShape(d) {
    let changed = false;
    const replace = (key, value) => { if (d[key] !== value) { d[key] = value; changed = true; } };
    const ensureArray = (key, fallback) => { if (!Array.isArray(d[key])) replace(key, fallback); };
    const ensureRecord = (key, fallback = {}) => { if (!isRecord(d[key])) replace(key, fallback); };

    ensureArray('leaderboard', []);
    ensureArray('unlockedChars', ['classic']);
    ensureArray('achievements', []);
    ensureArray('unlockedCosmetics', []);
    ensureArray('achievementRewardsClaimed', []);
    ensureRecord('equippedCosmetics');
    ensureRecord('audio');
    ensureRecord('settings');
    ensureRecord('bestScoresByRuleset');

    const normalizedCollectionPlatform = normalizeCollectionPlatformState(d.collectionPlatform);
    if (JSON.stringify(normalizedCollectionPlatform) !== JSON.stringify(d.collectionPlatform)) {
      replace('collectionPlatform', normalizedCollectionPlatform);
    }

    const normaliseStringList = (key, required = []) => {
      const source = d[key];
      const next = [];
      const seen = new Set();
      source.forEach(value => {
        if (typeof value !== 'string' || !value || seen.has(value)) return;
        seen.add(value);
        next.push(value);
      });
      required.forEach(value => {
        if (!seen.has(value)) { seen.add(value); next.push(value); }
      });
      if (next.length !== source.length || next.some((value, index) => value !== source[index])) replace(key, next);
    };

    // These lists drive .includes() checks throughout menus and progression.
    // Keep their values string-only and guarantee the always-free base frog.
    normaliseStringList('unlockedChars', ['classic']);
    normaliseStringList('achievements');
    normaliseStringList('unlockedCosmetics');
    normaliseStringList('achievementRewardsClaimed');

    const canonicaliseCharacter = value => typeof canonicalCharacterId === 'function'
      ? canonicalCharacterId(value)
      : value;

    if (d.selectedChar === 'ocean') { d.selectedChar = 'classic'; changed = true; }
    if (typeof sanitizeCosmeticSaveData === 'function' && sanitizeCosmeticSaveData(d)) changed = true;

    // Gulper and Chomper are independent player identities. Retired Arcade
    // identities canonicalize safely without merging unrelated active heroes.
    const canonicalUnlocked = [];
    const canonicalUnlockedSeen = new Set();
    for (const value of d.unlockedChars) {
      const canonical = canonicaliseCharacter(value);
      if (typeof canonical !== 'string' || !canonical || canonicalUnlockedSeen.has(canonical)) continue;
      canonicalUnlockedSeen.add(canonical);
      canonicalUnlocked.push(canonical);
    }
    if (!canonicalUnlockedSeen.has('classic')) canonicalUnlocked.unshift('classic');
    if (canonicalUnlocked.length !== d.unlockedChars.length || canonicalUnlocked.some((value, index) => value !== d.unlockedChars[index])) {
      replace('unlockedChars', canonicalUnlocked);
    }

    if (typeof d.selectedChar === 'string') {
      const canonicalSelected = canonicaliseCharacter(d.selectedChar);
      if (canonicalSelected !== d.selectedChar) replace('selectedChar', canonicalSelected);
    }

    const characterCatalog = (typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA : []);
    // Canonical player eligibility comes from one authority only. Fail closed if
    // the roster helper is unavailable instead of re-deriving a weaker filter.
    const selectableCatalog = typeof getPlayerSelectableCharacters === 'function'
      ? getPlayerSelectableCharacters()
      : [];
    const knownCharacterIds = new Set(selectableCatalog.map(char => char.id));
    const leaderboardCharacterIds = new Set(knownCharacterIds);
    const selectedIsKnown = typeof d.selectedChar === 'string' && knownCharacterIds.has(d.selectedChar);
    const selectedIsFree = selectedIsKnown && (CHARACTER_DATA.find(char => char.id === d.selectedChar)?.coinCost || 0) === 0;
    if (!selectedIsKnown || (!selectedIsFree && !d.unlockedChars.includes(d.selectedChar))) replace('selectedChar', 'classic');

    // Leaderboard UI expects each row to expose a finite numeric score and a
    // character id. Repair individual bad entries rather than allowing one
    // malformed import to crash the entire panel.
    const safeLeaderboard = d.leaderboard
      .filter(isRecord)
      .map(entry => {
        const score = normalizeFiniteNumber(entry.score, 0, 0);
        const canonicalEntryCharId = typeof entry.charId === 'string' ? canonicaliseCharacter(entry.charId) : 'classic';
        const charId = leaderboardCharacterIds.has(canonicalEntryCharId) ? canonicalEntryCharId : 'classic';
        const date = normalizeFiniteNumber(entry.date, 0, 0);
        const mode = /^[a-z0-9-]{1,32}$/i.test(String(entry.mode || '')) ? String(entry.mode).toLowerCase() : 'standard';
        const ruleset = ['classic', 'touch-comfort', 'custom', 'legacy'].includes(String(entry.ruleset || ''))
          ? String(entry.ruleset)
          : 'legacy';
        const rulesetKey = `${mode}:${ruleset}`;
        return { ...entry, score, charId, date, mode, ruleset, rulesetKey };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    if (safeLeaderboard.length !== d.leaderboard.length || safeLeaderboard.some((entry, index) => {
      const original = d.leaderboard[index];
      return !isRecord(original) || original.score !== entry.score || original.charId !== entry.charId || original.date !== entry.date
        || original.mode !== entry.mode || original.ruleset !== entry.ruleset || original.rulesetKey !== entry.rulesetKey;
    })) replace('leaderboard', safeLeaderboard);

    const safeRulesetBests = {};
    Object.entries(d.bestScoresByRuleset).slice(0, 64).forEach(([key, value]) => {
      if (!/^[a-z0-9-]{1,32}:(classic|touch-comfort|custom|legacy)$/.test(String(key))) return;
      const score = Math.floor(normalizeFiniteNumber(value, 0, 0));
      if (score > 0) safeRulesetBests[key] = score;
    });
    if (JSON.stringify(safeRulesetBests) !== JSON.stringify(d.bestScoresByRuleset)) replace('bestScoresByRuleset', safeRulesetBests);

    replace('bestScore', normalizeFiniteNumber(d.bestScore, 0, 0));
    replace('coins', normalizeFiniteNumber(d.coins, 0, 0));
    replace('lifetimeCoinsEarned', normalizeFiniteNumber(d.lifetimeCoinsEarned, 0, 0));
    replace('revengeStreak', Math.floor(normalizeFiniteNumber(d.revengeStreak, 0, 0)));
    if (typeof d.devModeUnlocked !== 'boolean') replace('devModeUnlocked', false);

    const audioDefaults = { master: 1, sfx: 1, bgm: 1, menu: 1 };
    for (const [key, fallback] of Object.entries(audioDefaults)) {
      const value = d.audio[key];
      const safe = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
      if (value !== safe) { d.audio[key] = safe; changed = true; }
    }

    if (!isRecord(d.stats)) {
      replace('stats', structuredClone(DEFAULT_STATS));
    } else {
      const stats = d.stats;
      for (const [key, fallback] of Object.entries(DEFAULT_STATS)) {
        if (key === 'perCharacter' || key === 'perMode') continue;
        const safe = normalizeFiniteNumber(stats[key], fallback, 0);
        if (stats[key] !== safe) { stats[key] = safe; changed = true; }
      }
      if (!isRecord(stats.perCharacter)) { stats.perCharacter = {}; changed = true; }
      if (!isRecord(stats.perMode)) { stats.perMode = {}; changed = true; }
    }

    // Puzzle saves are player-facing memory. Normalise them defensively so a
    // malformed import cannot break level-select, skull overlays, or undo use.
    const sourcePuzzle = isRecord(d.puzzleProgress) ? d.puzzleProgress : {};
    // v9 adds run-history counters for the directional Spit-Up loop.
    const safePuzzle = createDefaultPuzzleProgress();
    safePuzzle.undosOwned = Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(sourcePuzzle.undosOwned, 1, 0))));
    safePuzzle.bonusLives = Math.max(0, Math.min(20, Math.floor(normalizeFiniteNumber(sourcePuzzle.bonusLives, 0, 0))));
    safePuzzle.totalFruitScore = Math.floor(normalizeFiniteNumber(sourcePuzzle.totalFruitScore, 0, 0));
    safePuzzle.totalPuzzleCoins = Math.floor(normalizeFiniteNumber(sourcePuzzle.totalPuzzleCoins, 0, 0));
    safePuzzle.lastLevelScore = Math.floor(normalizeFiniteNumber(sourcePuzzle.lastLevelScore, 0, 0));
    safePuzzle.lastLevelCoins = Math.floor(normalizeFiniteNumber(sourcePuzzle.lastLevelCoins, 0, 0));
    safePuzzle.totalSpitUps = Math.floor(normalizeFiniteNumber(sourcePuzzle.totalSpitUps, 0, 0));
    safePuzzle.totalYumMilestones = Math.floor(normalizeFiniteNumber(sourcePuzzle.totalYumMilestones, 0, 0));
    safePuzzle.mobileDpadEnabled = typeof sourcePuzzle.mobileDpadEnabled === 'boolean'
      ? sourcePuzzle.mobileDpadEnabled
      : false;

    const saveLevelIds = collectPuzzleSaveLevelIds(sourcePuzzle);
    const unlockedSource = Array.isArray(sourcePuzzle.levelsUnlocked) ? sourcePuzzle.levelsUnlocked : [];
    const unlockedSet = new Set(unlockedSource.filter(isPuzzleSaveLevelId));
    unlockedSet.add('p001');
    safePuzzle.levelsUnlocked = saveLevelIds.filter(id => unlockedSet.has(id));

    const starsSource = isRecord(sourcePuzzle.levelStars) ? sourcePuzzle.levelStars : {};
    saveLevelIds.forEach(id => {
      safePuzzle.levelStars[id] = Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(starsSource[id], 0, 0))));
    });

    const starFlagsSource = isRecord(sourcePuzzle.levelStarFlags) ? sourcePuzzle.levelStarFlags : {};
    saveLevelIds.forEach(id => {
      const rawFlags = isRecord(starFlagsSource[id]) ? starFlagsSource[id] : {};
      const totalBombs = Math.max(0, Math.floor(normalizeFiniteNumber(rawFlags.totalBombs, 0, 0)));
      const neutralizedBombs = Math.max(0, Math.min(totalBombs, Math.floor(normalizeFiniteNumber(rawFlags.neutralizedBombs, 0, 0))));
      safePuzzle.levelStarFlags[id] = {
        complete: rawFlags.complete === true,
        yumminessMax: rawFlags.yumminessMax === true,
        emptyPond: rawFlags.emptyPond === true,
        neutralizedBombs,
        totalBombs,
      };
    });

    const memorySource = isRecord(sourcePuzzle.levelMemory) ? sourcePuzzle.levelMemory : {};
    saveLevelIds.forEach(id => {
      safePuzzle.levelMemory[id] = normalizePuzzleMemoryPoints(memorySource[id]);
    });

    const yumSource = isRecord(sourcePuzzle.levelYumminess) ? sourcePuzzle.levelYumminess : {};
    const yumCoinsSource = isRecord(sourcePuzzle.levelYumCoinsPending) ? sourcePuzzle.levelYumCoinsPending : {};
    saveLevelIds.forEach(id => {
      safePuzzle.levelYumminess[id] = Math.max(0, Math.floor(normalizeFiniteNumber(yumSource[id], 0, 0)));
      safePuzzle.levelYumCoinsPending[id] = Math.max(0, Math.floor(normalizeFiniteNumber(yumCoinsSource[id], 0, 0)));
    });

    // Keep only finite unsigned seeds. The save layer intentionally does not
    // know board rows/columns; the Puzzle compiler validates geometry when a
    // level is loaded. This keeps future tiny/large/irregular boards from being
    // truncated by a legacy 8x6 persistence assumption.
    const seedsSource = isRecord(sourcePuzzle.levelSeeds) ? sourcePuzzle.levelSeeds : {};
    saveLevelIds.forEach(id => {
      const candidate = seedsSource[id];
      if (Number.isInteger(candidate) && candidate > 0 && candidate <= 0xffffffff) {
        safePuzzle.levelSeeds[id] = candidate >>> 0;
      }
    });

    // Narrative progress must survive the defensive Puzzle-save normalizer.
    // Keep it deliberately small: only known-scene booleans, never a board
    // snapshot, route decision, or gameplay-affecting story state.
    const storySource = isRecord(sourcePuzzle.story) ? sourcePuzzle.story : {};
    const seenSceneSource = isRecord(storySource.seenScenes) ? storySource.seenScenes : {};
    const safeSeenScenes = {};
    Object.entries(seenSceneSource).forEach(([sceneId, seen]) => {
      if (seen === true && typeof sceneId === 'string' && sceneId.length > 0 && sceneId.length <= 120) {
        safeSeenScenes[sceneId] = true;
      }
    });
    safePuzzle.story = { schemaVersion: 1, seenScenes: safeSeenScenes };

    // Preserve only the four presentation-only first-route coach actions.
    // This small record cannot influence gameplay and is intentionally
    // isolated inside each host's existing Puzzle save boundary.
    const coachSource = isRecord(sourcePuzzle.firstRouteCoach) ? sourcePuzzle.firstRouteCoach : {};
    safePuzzle.firstRouteCoach = {
      emptyTravel: coachSource.emptyTravel === true,
      preferredFood: coachSource.preferredFood === true,
      bellyRecovery: coachSource.bellyRecovery === true,
      exitRoute: coachSource.exitRoute === true,
      complete: coachSource.complete === true || (coachSource.emptyTravel === true
        && coachSource.preferredFood === true
        && coachSource.bellyRecovery === true
        && coachSource.exitRoute === true),
    };

    // PX-CUTOVER / Puzzle v4.4: canonical Puzzle Next persistence slice.
    // This is additive state the legacy runtime never enumerates. Keep the
    // normalizer bounded and JSON-only, but preserve the v4.4 Recovery Epoch,
    // recipe-cycle, resumable-attempt and best-improvement records exactly
    // enough for deterministic resume and economy-safe settlement.
    const puzzleNextSource = isRecord(sourcePuzzle.puzzleNext) ? sourcePuzzle.puzzleNext : {};
    {
      const masterySource = isRecord(puzzleNextSource.mastery) ? puzzleNextSource.mastery : {};
      const safeMastery = {};
      Object.entries(masterySource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS).forEach(([id, record]) => {
        if (!isPuzzleSaveLevelId(id) || !isRecord(record)) return;
        const normalizeBestRun = (value, { firstClear = false } = {}) => {
          if (!isRecord(value)) return null;
          const out = {
            stars: Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(value.stars, 0, 0)))),
            yum: Math.max(0, Math.floor(normalizeFiniteNumber(value.yum, 0, 0))),
            yumBanks: Math.max(0, Math.floor(normalizeFiniteNumber(value.yumBanks, 0, 0))),
            yumRemainder: Math.max(0, Math.min(99, Math.floor(normalizeFiniteNumber(value.yumRemainder, 0, 0)))),
            yumFinishTier: Math.max(0, Math.min(3, Math.floor(normalizeFiniteNumber(value.yumFinishTier, 0, 0)))),
            moves: Math.max(0, Math.floor(normalizeFiniteNumber(value.moves, 0, 0))),
            energy: Math.max(0, Math.floor(normalizeFiniteNumber(value.energy, 0, 0))),
            perfectFeast: value.perfectFeast === true,
            contentVersion: Math.max(0, Math.floor(normalizeFiniteNumber(value.contentVersion, 0, 0))),
          };
          if (firstClear) {
            const prestige = isRecord(value.prestige) ? value.prestige : {};
            out.prestige = {
              perfectSurvival: prestige.perfectSurvival === true,
              noRestart: prestige.noRestart === true,
              noUndo: prestige.noUndo === true,
              noBombHit: prestige.noBombHit === true,
              firstAttempt: prestige.firstAttempt === true,
              unassisted: prestige.unassisted === true,
            };
            out.clearedAtMs = Math.max(0, Math.floor(normalizeFiniteNumber(value.clearedAtMs, 0, 0)));
          }
          return out;
        };
        const primary = normalizeBestRun(record.primaryBest);
        const lifetime = normalizeBestRun(record.lifetimeBest ?? record.primaryBest);
        const firstClearRecord = normalizeBestRun(record.firstClearRecord, { firstClear: true });
        const bestPrestigeSource = isRecord(record.bestPrestige) ? record.bestPrestige : {};
        safeMastery[id] = {
          bestStars: Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(record.bestStars, 0, 0)))),
          ...(record.bestNormalStars != null ? { bestNormalStars: Math.max(0, Math.min(3, Math.floor(normalizeFiniteNumber(record.bestNormalStars, 0, 0)))) } : {}),
          // `flame` is retained only as a rollback-era compatibility alias;
          // v4.4 authority is `perfectFeast` / five stars.
          flame: record.flame === true || record.perfectFeast === true,
          perfectFeast: record.perfectFeast === true || record.flame === true || Number(record.bestStars) >= 5,
          clears: Math.max(0, Math.floor(normalizeFiniteNumber(record.clears, 0, 0))),
          candySecured: record.candySecured === true,
          bestYum: Math.max(0, Math.floor(normalizeFiniteNumber(record.bestYum, 0, 0))),
          bestYumBanks: Math.max(0, Math.floor(normalizeFiniteNumber(record.bestYumBanks, Math.floor(normalizeFiniteNumber(record.bestYum, 0, 0) / 100), 0))),
          contentVersion: Math.max(0, Math.floor(normalizeFiniteNumber(record.contentVersion, 0, 0))),
          firstClearRecord,
          lifetimeBest: lifetime,
          primaryBest: primary,
          bestPrestige: {
            perfectSurvival: bestPrestigeSource.perfectSurvival === true,
            noRestart: bestPrestigeSource.noRestart === true,
            noUndo: bestPrestigeSource.noUndo === true,
            noBombHit: bestPrestigeSource.noBombHit === true,
            firstAttempt: bestPrestigeSource.firstAttempt === true,
            unassisted: bestPrestigeSource.unassisted === true,
          },
        };
      });

      const safeRecipeCycles = {};
      const cyclesSource = isRecord(puzzleNextSource.recipeCycles) ? puzzleNextSource.recipeCycles : {};
      Object.entries(cyclesSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS).forEach(([id, value]) => {
        if (!isPuzzleSaveLevelId(id)) return;
        safeRecipeCycles[id] = Math.max(0, Math.floor(normalizeFiniteNumber(value, 0, 0)));
      });

      const safeAttempts = {};
      const attemptsSource = isRecord(puzzleNextSource.attempts) ? puzzleNextSource.attempts : {};
      Object.entries(attemptsSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS).forEach(([id, record]) => {
        if (!isPuzzleSaveLevelId(id) || !isRecord(record) || !Array.isArray(record.actions)) return;
        // Attempt records are inert action journals. Clamp journal length to a
        // corruption guard while preserving the canonical content identity and
        // Recovery-Ledger seed used by PuzzleNextEngine.resumeAttempt().
        safeAttempts[id] = {
          ...record,
          actions: record.actions.slice(0, 8192).filter(action => isRecord(action)).map(action => ({ ...action })),
          initialRecoveryLedger: isRecord(record.initialRecoveryLedger) ? { ...record.initialRecoveryLedger } : null,
          display: isRecord(record.display) ? { ...record.display } : {},
        };
      });

      const safeLedgers = {};
      const ledgersSource = isRecord(puzzleNextSource.recoveryLedgers) ? puzzleNextSource.recoveryLedgers : {};
      Object.entries(ledgersSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS * 4).forEach(([key, ledger]) => {
        if (typeof key !== 'string' || key.length > 160 || !isRecord(ledger)) return;
        safeLedgers[key] = {
          ...ledger,
          heartsRemaining: Math.max(0, Math.floor(normalizeFiniteNumber(ledger.heartsRemaining, 0, 0))),
          freeUndoRemaining: Math.max(0, Math.floor(normalizeFiniteNumber(ledger.freeUndoRemaining, 0, 0))),
          purchasedUndoRemaining: Math.max(0, Math.floor(normalizeFiniteNumber(ledger.purchasedUndoRemaining, 0, 0))),
          recipeCursor: Math.max(0, Math.floor(normalizeFiniteNumber(ledger.recipeCursor, 0, 0))),
          revision: Math.max(0, Math.floor(normalizeFiniteNumber(ledger.revision, 0, 0))),
          learnedBombs: Array.isArray(ledger.learnedBombs) ? ledger.learnedBombs.slice(0, PUZZLE_SAVE_MAX_MEMORY_POINTS_PER_LEVEL).filter(x => typeof x === 'string') : [],
          learnedSafe: Array.isArray(ledger.learnedSafe) ? ledger.learnedSafe.slice(0, PUZZLE_SAVE_MAX_MEMORY_POINTS_PER_LEVEL).filter(x => typeof x === 'string') : [],
          sectorKnowledge: Array.isArray(ledger.sectorKnowledge) ? ledger.sectorKnowledge.slice(0, 256).filter(x => typeof x === 'string') : [],
          armedForgedAssists: Array.isArray(ledger.armedForgedAssists)
            ? ledger.armedForgedAssists.slice(0, 32).filter(isRecord).map(x => ({ ...x })) : [],
        };
      });

      const claimedForgeSlots = {};
      const forgeClaimsSource = isRecord(puzzleNextSource.claimedForgeSlots) ? puzzleNextSource.claimedForgeSlots : {};
      Object.entries(forgeClaimsSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS * 8).forEach(([key, value]) => {
        if (value === true && typeof key === 'string' && key.length <= 180) claimedForgeSlots[key] = true;
      });

      const claimedLevelKeys = {};
      const levelKeyClaimsSource = isRecord(puzzleNextSource.claimedLevelKeys) ? puzzleNextSource.claimedLevelKeys : null;
      if (levelKeyClaimsSource) Object.entries(levelKeyClaimsSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS * 4).forEach(([key, value]) => {
        if (value === true && typeof key === 'string' && key.length <= 180) claimedLevelKeys[key] = true;
      });

      const openedLocks = {};
      const openedLocksSource = isRecord(puzzleNextSource.openedLocks) ? puzzleNextSource.openedLocks : null;
      if (openedLocksSource) Object.entries(openedLocksSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS * 8).forEach(([key, value]) => {
        if (value === true && typeof key === 'string' && key.length <= 180) openedLocks[key] = true;
      });

      const missedForgeSlots = {};
      const missedForgeSource = isRecord(puzzleNextSource.missedForgeSlots) ? puzzleNextSource.missedForgeSlots : null;
      if (missedForgeSource) Object.entries(missedForgeSource).slice(0, PUZZLE_SAVE_MAX_DYNAMIC_LEVEL_IDS * 8).forEach(([key, record]) => {
        if (typeof key !== 'string' || key.length > 180 || !isRecord(record)) return;
        const levelId = String(record.levelId || '');
        if (!isPuzzleSaveLevelId(levelId)) return;
        missedForgeSlots[key] = {
          levelId,
          source: record.source === 'featured' ? 'featured' : 'campaign',
          missedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.missedAtMs, 0, 0))),
          ...(typeof record.challengeId === 'string' && record.challengeId ? { challengeId: record.challengeId.slice(0, 220) } : {}),
          ...(Number.isFinite(Number(record.expiresAtMs)) ? { expiresAtMs: Math.max(0, Math.floor(Number(record.expiresAtMs))) } : {}),
        };
      });

      const forgedKeyReservations = {};
      const reservationsSource = isRecord(puzzleNextSource.forgedKeyReservations) ? puzzleNextSource.forgedKeyReservations : {};
      Object.entries(reservationsSource).slice(0, 256).forEach(([id, record]) => {
        if (typeof id !== 'string' || id.length > 180 || !isRecord(record)) return;
        forgedKeyReservations[id] = { ...record };
      });

      const dailySource = isRecord(puzzleNextSource.daily) ? puzzleNextSource.daily : {};
      const dailyHistorySource = isRecord(dailySource.history) ? dailySource.history : {};
      const safeDailyHistory = {};
      Object.entries(dailyHistorySource).sort(([a], [b]) => a.localeCompare(b)).slice(-3660).forEach(([dayKey, record]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !isRecord(record)) return;
        const contentId = String(record.contentId || '');
        const contentHash = String(record.contentHash || '');
        if (!isPuzzleSaveLevelId(contentId) || contentHash.length > 160) return;
        safeDailyHistory[dayKey] = {
          challengeId: String(record.challengeId || '').slice(0, 220), dayKey,
          contentId, contentHash,
          contentVersion: Math.max(0, Math.floor(normalizeFiniteNumber(record.contentVersion, 0, 0))),
          certification: String(record.certification || '').slice(0, 96),
          attempted: record.attempted === true,
          startedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.startedAtMs, 0, 0))),
          activeStarts: Math.max(0, Math.floor(normalizeFiniteNumber(record.activeStarts, 0, 0))),
          bestStars: Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(record.bestStars, 0, 0)))),
          ...(record.bestNormalStars != null ? { bestNormalStars: Math.max(0, Math.min(3, Math.floor(normalizeFiniteNumber(record.bestNormalStars, 0, 0)))) } : {}),
          bestYum: Math.max(0, Math.floor(normalizeFiniteNumber(record.bestYum, 0, 0))),
          clears: Math.max(0, Math.floor(normalizeFiniteNumber(record.clears, 0, 0))),
          clearedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.clearedAtMs, 0, 0))),
          lastImprovedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.lastImprovedAtMs, 0, 0))),
        };
      });
      const safeDaily = {
        schemaVersion: 1,
        stamps: Math.max(0, Math.floor(normalizeFiniteNumber(dailySource.stamps, Object.keys(safeDailyHistory).length, 0))),
        masteryPoints: Math.max(0, Math.floor(normalizeFiniteNumber(dailySource.masteryPoints, 0, 0))),
        history: safeDailyHistory,
      };

      const featuredSource = isRecord(puzzleNextSource.featured) ? puzzleNextSource.featured : null;
      let safeFeatured = null;
      if (featuredSource) {
        const featuredHistorySource = isRecord(featuredSource.history) ? featuredSource.history : {};
        const safeFeaturedHistory = {};
        Object.entries(featuredHistorySource)
          .filter(([challengeId, record]) => typeof challengeId === 'string' && challengeId.length <= 240 && isRecord(record))
          .sort(([, a], [, b]) => normalizeFiniteNumber(a.startsAtMs, 0, 0) - normalizeFiniteNumber(b.startsAtMs, 0, 0))
          .slice(-32)
          .forEach(([challengeId, record]) => {
            const contentId = String(record.contentId || '');
            const contentHash = String(record.contentHash || '');
            if (!isPuzzleSaveLevelId(contentId) || contentHash.length > 160) return;
            safeFeaturedHistory[challengeId] = {
              challengeId,
              slotKey: String(record.slotKey || '').slice(0, 32),
              startsAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.startsAtMs, 0, 0))),
              expiresAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.expiresAtMs, 0, 0))),
              contentId, contentHash,
              contentVersion: Math.max(0, Math.floor(normalizeFiniteNumber(record.contentVersion, 0, 0))),
              certification: String(record.certification || '').slice(0, 96),
              bestStars: Math.max(0, Math.min(5, Math.floor(normalizeFiniteNumber(record.bestStars, 0, 0)))),
              ...(record.bestNormalStars != null ? { bestNormalStars: Math.max(0, Math.min(3, Math.floor(normalizeFiniteNumber(record.bestNormalStars, 0, 0)))) } : {}),
              bestYum: Math.max(0, Math.floor(normalizeFiniteNumber(record.bestYum, 0, 0))),
              clears: Math.max(0, Math.floor(normalizeFiniteNumber(record.clears, 0, 0))),
              firstTryClear: record.firstTryClear === true,
              firstClearedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.firstClearedAtMs, 0, 0))),
              lastImprovedAtMs: Math.max(0, Math.floor(normalizeFiniteNumber(record.lastImprovedAtMs, 0, 0))),
            };
          });
        safeFeatured = {
          schemaVersion: 1,
          activeChallengeId: String(featuredSource.activeChallengeId || '').slice(0, 240),
          activeStarts: Math.max(0, Math.floor(normalizeFiniteNumber(featuredSource.activeStarts, 0, 0))),
          naturalDayKey: /^\d{4}-\d{2}-\d{2}$/.test(String(featuredSource.naturalDayKey || '')) ? String(featuredSource.naturalDayKey) : '',
          naturalChallengeId: String(featuredSource.naturalChallengeId || '').slice(0, 240),
          extraAttempts: Math.max(0, Math.min(32, Math.floor(normalizeFiniteNumber(featuredSource.extraAttempts, 0, 0)))),
          history: safeFeaturedHistory,
        };
      }

      const storedPuzzleCharacter = String(puzzleNextSource.selectedCharacterId || '');
      const selectedCharacterId = ['froggie','toadal','classic'].includes(storedPuzzleCharacter)
        ? storedPuzzleCharacter : null;
      const characterUnlocksSource = isRecord(puzzleNextSource.characterUnlocks) ? puzzleNextSource.characterUnlocks : {};
      const characterUnlocks = characterUnlocksSource.toadal === true ? { toadal:true } : {};

      safePuzzle.puzzleNext = {
        ...(puzzleNextSource.normalStarsVersion === 1 ? { normalStarsVersion: 1 } : {}),
        ...(selectedCharacterId ? { selectedCharacterId } : {}),
        ...(characterUnlocks.toadal === true ? { characterUnlocks } : {}),
        mastery: safeMastery,
        recipeCycles: safeRecipeCycles,
        attempts: safeAttempts,
        recoveryLedgers: safeLedgers,
        claimedForgeSlots,
        ...(levelKeyClaimsSource ? { claimedLevelKeys } : {}),
        ...(openedLocksSource ? { openedLocks } : {}),
        ...(missedForgeSource ? { missedForgeSlots } : {}),
        forgeShards: Math.max(0, Math.floor(normalizeFiniteNumber(puzzleNextSource.forgeShards, 0, 0))),
        forgedKeys: Math.max(0, Math.floor(normalizeFiniteNumber(puzzleNextSource.forgedKeys, 0, 0))),
        forgedKeyReservations,
        daily: safeDaily,
        ...(safeFeatured ? { featured: safeFeatured } : {}),
      };
      if (puzzleNextSource.quality === 'high' || puzzleNextSource.quality === 'balanced' || puzzleNextSource.quality === 'low') {
        safePuzzle.puzzleNext.quality = puzzleNextSource.quality;
      }
    }

    let puzzleChanged = false;
    try { puzzleChanged = JSON.stringify(sourcePuzzle) !== JSON.stringify(safePuzzle); } catch (_) { puzzleChanged = true; }
    if (puzzleChanged || !isRecord(d.puzzleProgress)) { d.puzzleProgress = safePuzzle; changed = true; }

    // Infinite Feasts uses an explicit normalizer so malformed localStorage
    // cannot duplicate entity IDs, create off-map recruits, or poison the
    // offline economy. The helper is loaded before SaveManager in full builds.
    const sourceInfinite = isRecord(d.infiniteProgress) ? d.infiniteProgress : {};
    const safeInfinite = typeof InfiniteSave !== 'undefined'
      ? InfiniteSave.normalizeProgress(sourceInfinite, Date.now())
      : sourceInfinite;
    let infiniteChanged = false;
    try { infiniteChanged = JSON.stringify(sourceInfinite) !== JSON.stringify(safeInfinite); } catch (_) { infiniteChanged = true; }
    if (infiniteChanged || !isRecord(d.infiniteProgress)) { d.infiniteProgress = safeInfinite; changed = true; }

    // The exchange ledger is full-game-only. Normalize it alongside the
    // shared progression fields while keeping it outside infiniteProgress so
    // standalone colony saves remain physically and logically isolated.
    const sourceGoldExchange = isRecord(d.infiniteGoldExchange) ? d.infiniteGoldExchange : {};
    const safeGoldExchange = normalizeInfiniteGoldExchangeLedger(sourceGoldExchange, Date.now());
    let goldExchangeChanged = false;
    try { goldExchangeChanged = JSON.stringify(sourceGoldExchange) !== JSON.stringify(safeGoldExchange); } catch (_) { goldExchangeChanged = true; }
    if (goldExchangeChanged || !isRecord(d.infiniteGoldExchange)) { d.infiniteGoldExchange = safeGoldExchange; changed = true; }

    // Daily Goals are root-owned full-game retention state. Do not move this
    // ledger into infiniteProgress: standalone builds intentionally exclude
    // daily shared-Gold claims and have an independent save surface.
    const sourceDailyGoals = isRecord(d.dailyGoals) ? d.dailyGoals : {};
    const safeDailyGoals = normalizeDailyGoalsLedger(sourceDailyGoals, Date.now());
    let dailyGoalsChanged = false;
    try { dailyGoalsChanged = JSON.stringify(sourceDailyGoals) !== JSON.stringify(safeDailyGoals); } catch (_) { dailyGoalsChanged = true; }
    if (dailyGoalsChanged || !isRecord(d.dailyGoals)) { d.dailyGoals = safeDailyGoals; changed = true; }

    // ProgressionFacts normalize like every other root ledger: malformed
    // imports repair to a valid bounded record without inventing history.
    const sourceProgressionFacts = isRecord(d.progressionFacts) ? d.progressionFacts : {};
    const safeProgressionFacts = normalizeProgressionFacts(sourceProgressionFacts);
    let progressionFactsChanged = false;
    try { progressionFactsChanged = JSON.stringify(sourceProgressionFacts) !== JSON.stringify(safeProgressionFacts); } catch (_) { progressionFactsChanged = true; }
    if (progressionFactsChanged || !isRecord(d.progressionFacts)) { d.progressionFacts = safeProgressionFacts; changed = true; }

    // The economy ledger is repaired with reconstruction, never replaced with
    // empty history: a wiped ledger would let deterministic one-time rewards
    // pay out again on replayed events.
    const sourceEconomyLedger = isRecord(d.economyLedger) ? d.economyLedger : {};
    const safeEconomyLedger = reconcileEconomyLedger(sourceEconomyLedger, d);
    let economyLedgerChanged = false;
    try { economyLedgerChanged = JSON.stringify(sourceEconomyLedger) !== JSON.stringify(safeEconomyLedger); } catch (_) { economyLedgerChanged = true; }
    if (economyLedgerChanged || !isRecord(d.economyLedger)) { d.economyLedger = safeEconomyLedger; changed = true; }

    // EC-9 Candy-assist reservations: sanitize the in-flight list defensively on
    // every load (absent/old saves default to empty). Bounded and idempotent.
    const sourceCandyReservations = Array.isArray(d.candyReservations) ? d.candyReservations : [];
    const safeCandyReservations = normalizeCandyReservations(sourceCandyReservations);
    let candyReservationsChanged = false;
    try { candyReservationsChanged = JSON.stringify(sourceCandyReservations) !== JSON.stringify(safeCandyReservations); } catch (_) { candyReservationsChanged = true; }
    if (candyReservationsChanged || !Array.isArray(d.candyReservations)) { d.candyReservations = safeCandyReservations; changed = true; }

    // EC-9 v2 generic registry-wallet currency balances: sanitize defensively
    // on every load (absent/old saves default to empty). Bounded, idempotent,
    // additive — Gold/Candy stay in their own dedicated roots.
    const sourceCurrencyBalances = isRecord(d.currencyBalances) ? d.currencyBalances : {};
    const safeCurrencyBalances = normalizeCurrencyBalances(sourceCurrencyBalances);
    let currencyBalancesChanged = false;
    try { currencyBalancesChanged = JSON.stringify(sourceCurrencyBalances) !== JSON.stringify(safeCurrencyBalances); } catch (_) { currencyBalancesChanged = true; }
    if (currencyBalancesChanged || !isRecord(d.currencyBalances)) { d.currencyBalances = safeCurrencyBalances; changed = true; }

    // Character Feast Orders are normalized by feast-orders.js after all
    // character and food definitions are available. SaveManager only protects
    // the root shape here so malformed imports cannot crash that module.
    if (!isRecord(d.feastOrders)) { d.feastOrders = {}; changed = true; }

    // Unified Arcade Revenge Challenges are normalized by their feature module.
    // SaveManager protects only the root record so malformed imports cannot
    // break boot before that module has loaded.
    if (!isRecord(d.arcadeRevenge)) {
      d.arcadeRevenge = { schemaVersion: 1, challenge: null, totalCompleted: 0, lastCompleted: null };
      changed = true;
    }

    return changed;
  }

  function runMigrations(d) {
    const from = Number.isFinite(d.version) ? Math.max(0, Math.floor(d.version)) : 0;
    let migrated = false;
    MIGRATIONS.forEach(m => {
      if (m.to > from) { m.run(d); migrated = true; }
    });
    // Never downgrade a save written by a newer compatible runtime. Both the
    // full host and canonical Arcade share this namespace, so preserving a
    // future schema marker prevents repeated migrations and data churn.
    const targetVersion = Math.max(from, SAVE_VERSION);
    d.version = targetVersion;
    if (migrated) EventBus.emit('saveDataMigrated', { from, to: targetVersion });
    return migrated;
  }

  function load() {
    if (_data) return _data;
    let rawBytes = null;
    let parseFailed = false;
    try { rawBytes = localStorage.getItem(KEY); _primaryExisted = rawBytes !== null; _lastSyncedBytes = rawBytes; } catch (e) {
      // Unreadable storage is NOT the same as an empty save. Run this session
      // on in-memory defaults and refuse every write, so a transient read
      // failure can never end with defaults overwriting real progress.
      _storageReadFailed = true;
      console.warn('[SaveManager] Primary save could not be read; this session runs in memory only and will not overwrite storage.');
      rawBytes = null;
    }
    try { _data = JSON.parse(rawBytes || '{}'); } catch (e) { parseFailed = true; _data = null; }
    if (parseFailed || !isRecord(_data)) {
      // Never destroy the player's only copy: preserve the malformed bytes
      // verbatim, then prefer the last-known-good snapshot over a blank save.
      quarantineCorruptPrimary(rawBytes);
      _data = readRecoverySnapshot();
    }

    // A save stamped by a newer OR unintelligible version marker is read-only
    // for this runtime: it cannot tell a genuine newer schema from a poisoned
    // marker, and either way it must not rewrite structures it does not
    // understand. The RUNNING session still needs safe shapes, so it plays
    // against a normalized deep copy that is never persisted. Non-finite
    // markers (Infinity, arrays, objects) are treated as future, not as v0 —
    // replaying every migration over a possibly-newer save would destroy it.
    const rawVersion = _data.version;
    const parsedVersion = Number(rawVersion);
    const versionUnintelligible = rawVersion !== undefined && rawVersion !== null && !Number.isFinite(parsedVersion);
    if (versionUnintelligible || (Number.isFinite(parsedVersion) && parsedVersion > SAVE_VERSION)) {
      _futureSaveReadOnly = true;
      try {
        const sessionView = JSON.parse(JSON.stringify(_data));
        runMigrations(sessionView);
        normalizeSaveShape(sessionView);
        _data = sessionView;
      } catch (_) { /* keep the raw parsed view; reads stay best-effort */ }
      return _data;
    }

    let catastrophicReset = false;
    try {
      const migrated = runMigrations(_data);
      const normalized = normalizeSaveShape(_data);
      if (migrated || normalized) save();
    } catch (err) {
      console.error('[SaveManager] Migration failed; attempting last-known-good recovery.', err);
      quarantineCorruptPrimary(rawBytes);
      // Prefer the last-known-good snapshot over a blank reset; only fall to
      // defaults when the snapshot is unusable too.
      _data = readRecoverySnapshot();
      try {
        runMigrations(_data);
        normalizeSaveShape(_data);
      } catch (err2) {
        console.error('[SaveManager] Recovery snapshot also failed migration; starting fresh. Original bytes preserved under', QUARANTINE_KEY, err2);
        catastrophicReset = true;
        _data = {}; // Safe fallback
        runMigrations(_data);
        normalizeSaveShape(_data);
      }
      save();
    }

    // Never refresh the recovery snapshot with a defaults-reset document: the
    // old snapshot may be the player's only remaining restorable progress.
    if (!catastrophicReset) writeRecoverySnapshot();
    return _data;
  }
  function previewPersistenceDisabled() {
    return false;
  }
  function writeNow() {
    // The preview sandbox intentionally never persists; report success so
    // simulated flows behave normally without touching real storage.
    if (previewPersistenceDisabled()) return true;
    if (_storageReadFailed) return false;
    if (_futureSaveReadOnly) {
      if (!_futureWriteWarned) {
        _futureWriteWarned = true;
        console.warn('[SaveManager] Save was written by a newer runtime; this session is read-only and will not persist changes.');
      }
      return false;
    }
    try {
      const serialized = JSON.stringify(_data);
      localStorage.setItem(KEY, serialized);
      _lastSyncedBytes = serialized;
      _writeFailureWarned = false;
      _writeDegraded = false;
      return true;
    } catch (e) {
      // Storage being unavailable (quota, private mode, sandboxed WebView) is
      // a tolerated operating condition, not a runtime error: gameplay keeps
      // running in memory. Warn once per failure epoch; the economy ledger
      // separately converts failed commits into hard REJECTED outcomes.
      _writeDegraded = true;
      if (!_writeFailureWarned) {
        _writeFailureWarned = true;
        console.warn('[SaveManager] Durable save write failed; state kept in memory and retried on later writes.', e && e.name ? e.name : e);
      }
      return false;
    }
  }
  function save() {
    if (previewPersistenceDisabled()) return true;
    if (_transactionDepth > 0) {
      _transactionDirty = true;
      return null; // deferred to the enclosing transaction's flush
    }
    return writeNow();
  }
  function flush() {
    if (_transactionDepth > 0 || !_transactionDirty) return false;
    _transactionDirty = false;
    return writeNow();
  }
  // Forced durable commit for callers that must confirm physical persistence
  // (the economy ledger) before announcing success. Safe inside a coalescing
  // transaction: every completed set() leaves the document self-consistent, so
  // an early write is equivalent to a crash-recovered prefix of the batch.
  function flushNow() {
    if (previewPersistenceDisabled()) return true;
    const ok = writeNow();
    if (ok) {
      _transactionDirty = false;
      // Confirmed durable commits carry player value, so they also refresh
      // the last-known-good snapshot: a later corrupt primary can never cost
      // an already-committed economy transaction.
      writeRecoverySnapshot();
    }
    return ok;
  }
  function isReadOnly() { return _futureSaveReadOnly || _storageReadFailed; }
  // Durable-or-nothing write: applies `fn` like set(), then confirms the
  // physical write. On flush failure the in-memory document rolls back to its
  // pre-fn state, so callers can gate success UI/events on `ok` without ever
  // celebrating value that never reached storage. Safe inside a coalescing
  // transaction for the same reason flushNow() is.
  function setDurable(fn) {
    let snapshotJson = null;
    let result;
    const data = set(d => {
      snapshotJson = JSON.stringify(d);
      result = fn(d);
    });
    const ok = flushNow();
    if (ok !== true && snapshotJson) restoreSaveDocumentInPlace(data, snapshotJson);
    return { ok: ok === true, result, data };
  }
  function transaction(fn) {
    _transactionDepth += 1;
    try {
      return fn();
    } finally {
      _transactionDepth = Math.max(0, _transactionDepth - 1);
      if (_transactionDepth === 0) flush();
    }
  }
  function get() { return load(); }
  function set(fn) {
    adoptNewerTabWrite();
    const current = load();
    if (previewPersistenceDisabled()) {
      const sandbox = typeof structuredClone === 'function' ? structuredClone(current) : JSON.parse(JSON.stringify(current));
      fn(sandbox);
      return sandbox;
    }
    fn(current);
    save();
    return current;
  }

  // EC-5 multi-tab reconciliation: if another tab committed newer bytes,
  // drop the in-memory cache so the next load() re-reads (and re-normalizes)
  // the newest durable state before any mutation is applied on top of it.
  function adoptNewerTabWrite() {
    if (_transactionDepth > 0 || _storageReadFailed || previewPersistenceDisabled()) return false;
    let onDisk = null;
    try { onDisk = localStorage.getItem(KEY); } catch { return false; }
    if (onDisk === null || _lastSyncedBytes === null || onDisk === _lastSyncedBytes) return false;
    _lastSyncedBytes = onDisk;
    _data = null;
    return true;
  }
  if (typeof addEventListener === 'function') {
    addEventListener('storage', event => {
      if (!event || event.key !== KEY) return;
      if (_transactionDepth > 0) return; // adopted by the next set() instead
      if (event.newValue !== null && event.newValue !== _lastSyncedBytes) {
        _lastSyncedBytes = event.newValue;
        _data = null;
      }
    });
  }

  return { get, set, save, flush, transaction, KEY, BASE_KEY, flushNow, setDurable, isReadOnly, hasPersistedSave: () => _primaryExisted, RECOVERY_KEY, QUARANTINE_KEY, adoptNewerTabWrite, writeDegraded: () => _writeDegraded, get version() { return SAVE_VERSION; } };
})();

// The explicit Froggy synchronization boundary may be created by the platform
// module after boot. Exposing the already-instantiated manager preserves its
// local/offline authority; no sync or network request is started here.
if (typeof globalThis !== 'undefined') globalThis.SaveManager = SaveManager;

// EventBus is declared before SaveManager, so the lexical hook is assigned only
// after SaveManager is constructed. Migration events emitted during initial
// construction safely dispatch directly; later gameplay events are transactional.
saveTransactionHook = SaveManager.transaction;

// ────────────────────────────────────────────────────────────────────────
// 2b. ECONOMY TRANSACTION PRIMITIVE (P0-B)
// ────────────────────────────────────────────────────────────────────────
// One documented authority for exactly-once valuable mutations:
//
//   check → mutator → decision → record, inside ONE SaveManager.set().
//
// Outcomes: APPLIED (mutation + ledger record committed together),
// DUPLICATE (ID already applied; no mutation, no second event),
// REJECTED (precondition failed; no mutation, no record — the same
// transaction ID stays valid for a later retry).
//
// Because mutation and ledger record live in the same durable save document,
// a crash can only lose or keep them together — an APPLIED record without its
// value mutation cannot exist.
const EconomyLedger = (() => {
  function rejectedOutcome(reason, result = null) {
    return { status: 'rejected', applied: false, record: null, result, reason };
  }

  function ensureLedger(d) {
    const root = d.economyLedger;
    if (!root || typeof root !== 'object' || Array.isArray(root)
      || !root.applied || typeof root.applied !== 'object' || Array.isArray(root.applied)) {
      d.economyLedger = reconcileEconomyLedger(root, d);
    }
    return d.economyLedger;
  }

  function restoreSaveInPlace(d, snapshotJson) {
    restoreSaveDocumentInPlace(d, snapshotJson);
  }

  function apply(transactionId, mutator, meta = {}) {
    if (!isValidEconomyTransactionId(transactionId)) return rejectedOutcome('invalid-transaction-id');
    if (typeof mutator !== 'function') return rejectedOutcome('invalid-mutator');
    // An older runtime holding a newer-schema save must never mutate it.
    // Rejected (not duplicate): the same ID stays valid on the newer runtime.
    // get() forces the lazy load so read-only detection precedes any mutation.
    SaveManager.get();
    if (typeof SaveManager.isReadOnly === 'function' && SaveManager.isReadOnly()) {
      return rejectedOutcome('save-read-only');
    }
    let outcome = null;
    let preApplySnapshot = null;

    SaveManager.set(d => {
      const ledger = ensureLedger(d);
      if (Object.prototype.hasOwnProperty.call(ledger.applied, transactionId)) {
        outcome = { status: 'duplicate', applied: false, record: ledger.applied[transactionId], result: null, reason: null };
        return;
      }

      // A rejection or mutator crash must leave zero durable trace so the
      // transaction ID remains honestly retryable. The snapshot restores the
      // save only when a non-committing mutator actually dirtied it.
      const snapshot = JSON.stringify(d);
      preApplySnapshot = snapshot;
      let result = null;
      try {
        result = mutator(d) || {};
      } catch (err) {
        if (JSON.stringify(d) !== snapshot) restoreSaveInPlace(d, snapshot);
        console.error('[EconomyLedger] mutator threw; transaction rejected and retryable:', transactionId, err);
        outcome = rejectedOutcome('mutator-error');
        return;
      }
      if (result.commit !== true) {
        if (JSON.stringify(d) !== snapshot) restoreSaveInPlace(d, snapshot);
        outcome = rejectedOutcome(typeof result.reason === 'string' && result.reason ? result.reason : 'rejected', result);
        return;
      }

      const record = normalizeEconomyLedgerRecord({
        domain: meta && meta.domain,
        kind: meta && meta.kind,
        subjectId: meta && meta.subjectId,
        amount: Number.isFinite(Number(result.amount)) ? Number(result.amount) : (meta && meta.amount),
        contentVersion: meta && meta.contentVersion,
        appliedAt: Date.now(),
      });
      ledger.applied[transactionId] = record;
      outcome = { status: 'applied', applied: true, record, result, reason: null };
    });

    // APPLIED is only real once the physical write is confirmed. On storage
    // failure the in-memory mutation AND ledger record roll back together, so
    // the transaction ID stays honestly retryable in this session and no
    // false value can be celebrated.
    if (outcome && outcome.status === 'applied') {
      const durable = typeof SaveManager.flushNow === 'function' ? SaveManager.flushNow() : true;
      if (durable !== true) {
        if (preApplySnapshot) restoreSaveInPlace(SaveManager.get(), preApplySnapshot);
        outcome = rejectedOutcome('storage-write-failed');
      }
    }

    // Post-commit notification only — and only for APPLIED. DUPLICATE and
    // REJECTED never re-announce value that did not move.
    if (outcome && outcome.status === 'applied') {
      EventBus.emit('economyTransactionApplied', { transactionId, record: outcome.record });
    }
    return outcome;
  }

  function hasApplied(transactionId) {
    if (!isValidEconomyTransactionId(transactionId)) return false;
    const d = SaveManager.get();
    const ledger = d.economyLedger;
    return Boolean(ledger && typeof ledger === 'object' && !Array.isArray(ledger)
      && ledger.applied && typeof ledger.applied === 'object' && !Array.isArray(ledger.applied)
      && Object.prototype.hasOwnProperty.call(ledger.applied, transactionId));
  }

  function getRecord(transactionId) {
    if (!hasApplied(transactionId)) return null;
    return SaveManager.get().economyLedger.applied[transactionId];
  }

  return { apply, hasApplied, getRecord, isValidTransactionId: isValidEconomyTransactionId };
})();

// ────────────────────────────────────────────────────────────────────────
// 2c. GRANT SERVICE (EC-2)
// ────────────────────────────────────────────────────────────────────────
// THE single completion→durable-value choke point. Rewarded-ad completions,
// IAP grants, LiveOps gifts, achievement payouts and similar one-time value
// all attach here. GrantService composes the EC-1 EconomyLedger (durable,
// idempotent, physically confirmed) with same-transaction ProgressionFacts:
// the wallet credit, any extra durable mutation, the fact record, and the
// ledger entry commit or roll back together. Events fire post-commit only.
//
// Transaction-ID conventions (see progression.js for the full list):
//   grant:{campaignId}      — LiveOps/campaign gifts
//   iap:{receiptId}         — store purchases (platform receipt identity)
//   achievement:{id}        — achievement payouts
//   purchase-intent:{uuid}  — repeatable shop intents
const GrantService = (() => {
  function premiumMutationAllowed() {
    return globalThis.FroggyPremiumMutationBoundary?.localCandyMutationAllowed?.() !== false;
  }
  function rejected(reason) {
    return { status: 'rejected', applied: false, record: null, result: null, reason, code: 'REJECTED' };
  }

  function grant(spec) {
    const source = spec && typeof spec === 'object' ? spec : {};
    const transactionId = source.transactionId;
    // Strict mutation-boundary amounts: an omitted amount means 0, but a
    // PROVIDED amount must be a real safe non-negative integer. Infinity/NaN/
    // fraction/string inputs are REJECTED (id not consumed) instead of being
    // coerced into value — `amountCandy: Infinity` previously APPLIED and wiped
    // the Candy balance to 0 through tolerant normalization.
    const amountCoins = source.amountCoins === undefined || source.amountCoins === null
      ? 0 : strictCurrencyAmount(source.amountCoins, { allowZero: true });
    const amountCandy = source.amountCandy === undefined || source.amountCandy === null
      ? 0 : strictCurrencyAmount(source.amountCandy, { allowZero: true });
    const entitlementIds = (Array.isArray(source.entitlements) ? source.entitlements : [])
      .map(id => String(id || '')).filter(id => ENTITLEMENT_ID_PATTERN.test(id));
    const facts = Array.isArray(source.facts) ? source.facts : [];
    const meta = source.meta && typeof source.meta === 'object' ? source.meta : {};
    // EC-9 v2 generic commerce settlement: an optional registry-resolved SPEND
    // (offer price) and additive registry-currency grants ride the SAME
    // durable transaction as the coins/candy/entitlement grants — debit and
    // grant commit or roll back together; REJECTED never consumes the id.
    const spendPrice = source.spend && typeof source.spend === 'object' ? source.spend : null;
    const currencyGrantList = Array.isArray(source.currencyGrants) ? source.currencyGrants : [];
    // Collection V1 normalized rewards reuse this same GrantService and its
    // EconomyLedger transaction. No second receipt or wallet path is created.
    const normalizedRewards = Array.isArray(source.rewards)
      ? source.rewards
      : Array.isArray(source.grants)
        ? source.grants
        : source.type
          ? [source]
          : [];
    const collectionAdapter = globalThis.CollectionPlatformTransactions;
    const collectionPlanning = normalizedRewards.length
      ? (collectionAdapter?.plan?.(normalizedRewards, { source: source.source || meta.source }) || { ok: false, reason: 'collection-service-unavailable' })
      : { ok: true, plan: null };
    const collectionPlan = collectionPlanning.ok ? collectionPlanning.plan : null;
    const resolvedEntitlementIds = [...entitlementIds, ...(collectionPlan?.entitlements || [])];
    const resolvedFacts = [...facts, ...(collectionPlan?.facts || [])];
    const resolvedCurrencyGrantList = [...currencyGrantList, ...(collectionPlan?.currencyGrants || [])];

    if (!collectionPlanning.ok) return rejected(collectionPlanning.reason || 'invalid-reward-spec');
    if ((amountCandy > 0 || spendPrice?.currencyId === 'candy' || resolvedCurrencyGrantList.some(item => item?.currencyId === 'candy')) && !premiumMutationAllowed()) {
      return rejected(FroggyPremiumMutationBoundary.blockedReason());
    }
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (amountCoins === null || amountCandy === null) return { commit: false, reason: 'invalid-amount' };
      let spent = null;
      if (spendPrice) {
        const resolvedSpend = resolveActiveCurrency(spendPrice.currencyId);
        if (resolvedSpend.error) return { commit: false, reason: resolvedSpend.error };
        const spendAmount = strictCurrencyAmount(spendPrice.amount);
        if (spendAmount === null) return { commit: false, reason: 'invalid-amount' };
        const debit = debitCurrencyInTransaction(d, resolvedSpend.definition, spendAmount);
        if (!debit) return { commit: false, reason: 'insufficient-currency' };
        spent = { currencyId: resolvedSpend.definition.id, amount: debit.amount, total: debit.total };
      }
      const grantedCurrencies = [];
      for (const item of resolvedCurrencyGrantList) {
        const resolvedGrant = resolveActiveCurrency(item?.currencyId);
        if (resolvedGrant.error) return { commit: false, reason: resolvedGrant.error };
        const grantAmount = strictCurrencyAmount(item?.amount);
        if (grantAmount === null) return { commit: false, reason: 'invalid-amount' };
        const credit = creditCurrencyInTransaction(d, resolvedGrant.definition, grantAmount);
        if (!credit) return { commit: false, reason: 'wallet-unavailable' };
        grantedCurrencies.push({ currencyId: resolvedGrant.definition.id, amount: credit.amount, total: credit.total });
      }
      let award = { amount: 0, total: Math.max(0, Math.floor(Number(d.coins) || 0)) };
      if (amountCoins > 0) {
        if (typeof ProgressionManager === 'undefined' || typeof ProgressionManager.awardCoinsInTransaction !== 'function') {
          return { commit: false, reason: 'wallet-unavailable' };
        }
        award = ProgressionManager.awardCoinsInTransaction(d, amountCoins);
      }
      let candyAward = { amount: 0, total: normalizeCandyBalance(d.candy) };
      if (amountCandy > 0) {
        const before = normalizeCandyBalance(d.candy);
        d.candy = normalizeCandyBalance(before + amountCandy);
        candyAward = { amount: d.candy - before, total: d.candy };
      }
      const grantedEntitlements = [];
      if (resolvedEntitlementIds.length) {
        d.entitlements = normalizeEntitlements(d.entitlements);
        const newIds = resolvedEntitlementIds.filter(id => !d.entitlements[id]);
        // Fail closed at the ownership cap: never silently drop a legitimately
        // granted entitlement (normalizeEntitlements would slice an alphabetically
        // late 513th on the next load, losing paid ownership while the receipt
        // ledger entry blocks a re-grant). REJECTED does not consume the id, so a
        // later reconciliation/retry can still establish ownership if capacity is
        // freed or raised.
        if (Object.keys(d.entitlements).length + newIds.length > ENTITLEMENTS_MAX) {
          return { commit: false, reason: 'entitlement-capacity' };
        }
        for (const id of resolvedEntitlementIds) {
          if (!d.entitlements[id]) {
            d.entitlements[id] = { at: Date.now(), source: String(meta.kind || 'grant').slice(0, 96) };
            grantedEntitlements.push(id);
          }
        }
      }
      let collectionResult = null;
      if (collectionPlan) {
        collectionResult = collectionAdapter.apply(d, collectionPlan) || {};
        if (collectionResult.commit === false) return collectionResult;
      }

      let extraResult = null;
      if (typeof source.mutate === 'function') {
        const extra = source.mutate(d) || {};
        if (extra.commit === false) return extra;
        extraResult = extra;
      }
      // Facts ride the same durable transaction as the value they describe;
      // every applied grant also counts itself for cross-mode visibility.
      const factResult = recordProgressionFactsInTransaction(d, [...resolvedFacts, { kind: 'count', key: 'grants.applied' }]);
      // The mutate result's own fields (e.g. a granted item payload) are
      // carried through to outcome.result; wallet totals stay authoritative.
      return {
        ...(extraResult || {}), commit: true, amount: award.amount, total: award.total,
        candyAmount: candyAward.amount, candyTotal: candyAward.total,
        grantedEntitlements, spent, grantedCurrencies, factResult,
        collectionChanges: collectionResult?.collectionChanges || [],
      };
    }, {
      domain: meta.domain || 'wallet',
      kind: meta.kind || 'grant',
      subjectId: meta.subjectId,
      amount: (amountCoins || 0) + (amountCandy || 0),
      contentVersion: meta.contentVersion,
    });

    if (outcome && outcome.status === 'applied') {
      if (amountCoins > 0) {
        EventBus.emit('coinsAwarded', {
          amount: outcome.result.amount,
          reason: source.reason || meta.kind || 'grant',
          total: outcome.result.total,
          transactionId,
        });
      }
      if (outcome.result.candyAmount > 0) {
        EventBus.emit('candyAwarded', {
          amount: outcome.result.candyAmount,
          reason: source.reason || meta.kind || 'grant',
          total: outcome.result.candyTotal,
          transactionId,
        });
      }
      if (outcome.result.grantedEntitlements && outcome.result.grantedEntitlements.length) {
        EventBus.emit('entitlementsGranted', { itemIds: outcome.result.grantedEntitlements, transactionId });
      }
      if (outcome.result.spent) {
        EventBus.emit('currencySpent', { ...outcome.result.spent, transactionId });
      }
      for (const grantedCurrency of outcome.result.grantedCurrencies || []) {
        EventBus.emit('currencyGranted', { ...grantedCurrency, transactionId });
      }
      EventBus.emit('grantApplied', { transactionId, record: outcome.record });
    }
      const collectionChanges = outcome.status === 'applied' ? (outcome.result.collectionChanges || []) : [];
      if (collectionChanges.length) {
        EventBus.emit('collection:changed', { transactionId, changes: collectionChanges });
      }
      for (const change of collectionChanges) {
        if (change.type === 'inventory-item') EventBus.emit('inventory:changed', { ...change, transactionId });
        if (change.type === 'story-entry' && change.status === 'discovered') {
          EventBus.emit('story:discovered', { ...change, transactionId });
        }
        if (change.type === 'world-candy' && change.status === 'discovered') {
          const detail = { id: change.id, name: change.name, at: Date.now(), transactionId };
          EventBus.emit('worldCandyDiscovered', detail);
          try {
            globalThis.dispatchEvent?.(new CustomEvent('froggyfeast:world-candy-discovered', { detail }));
          } catch (_) {}
        }
        if (change.type === 'unlock' && change.status === 'unlocked') {
          EventBus.emit(change.targetType === 'character' ? 'characterUnlocked' : 'cosmeticUnlocked', { id: change.id, transactionId });
        }
        if (change.type === 'achievement' && change.status === 'earned') EventBus.emit('achievementUnlocked', { id: change.id, transactionId });
      }
    return {
      ...outcome,
      code: outcome.status === 'applied' ? 'APPLIED' : outcome.status === 'duplicate' ? 'ALREADY_APPLIED' : 'REJECTED',
    };
  }

  /**
   * Durable Candy debit (EC-2.5 spend contract): confirmed physical write
   * FIRST, effect second — callers apply the assist/purchase only on an
   * `applied` outcome. REJECTED never consumes the transaction id.
   */
  function spendCandy(transactionId, amount, meta = {}) {
    if (!premiumMutationAllowed()) return rejected(FroggyPremiumMutationBoundary.blockedReason());
    // Strict amount contract: no string/fraction coercion at a mutation API.
    const safeAmount = strictCurrencyAmount(amount);
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      const balance = normalizeCandyBalance(d.candy);
      if (balance < safeAmount) return { commit: false, reason: 'insufficient-candy' };
      d.candy = balance - safeAmount;
      return { commit: true, candyAmount: safeAmount, candyTotal: d.candy };
    }, {
      domain: 'wallet',
      kind: meta.kind || 'candy-spend',
      subjectId: meta.subjectId,
      amount: safeAmount === null ? 0 : safeAmount,
      contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('candySpent', { amount: safeAmount, total: outcome.result.candyTotal, transactionId });
    }
    return outcome;
  }

  function candyBalance() {
    return normalizeCandyBalance(SaveManager.get().candy);
  }

  // ── EC-9 v2 generic currency mutation (currency+storefront contract §2) ──
  // ONE registry-routed path so commerce references a `currencyId` without
  // hard-coded currency branches. Gold routes to the coins wallet, Candy to
  // the candy wallet, additive currencies to the registry-wallet slice —
  // still THIS single mutation authority, never a second wallet system.
  // Unknown ids fail closed (REJECTED, id not consumed); deprecated/hidden
  // currencies accept no NEW grants or spends (their stored balances remain
  // interpretable — deletion/conversion needs an explicit versioned policy).
  function resolveActiveCurrency(currencyId) {
    const definition = typeof CurrencyRegistry !== 'undefined' ? CurrencyRegistry.resolve(currencyId) : null;
    if (!definition) return { error: 'unknown-currency' };
    if (definition.status !== 'active') return { error: 'currency-deprecated' };
    return { definition };
  }

  function readCurrencyInTransaction(d, definition) {
    if (definition.wallet === 'coins') return Math.max(0, Math.floor(Number(d.coins) || 0));
    if (definition.wallet === 'candy') return normalizeCandyBalance(d.candy);
    return normalizeCurrencyBalances(d.currencyBalances)[definition.id] || 0;
  }

  function creditCurrencyInTransaction(d, definition, amount) {
    if (definition.wallet === 'coins') {
      if (typeof ProgressionManager === 'undefined' || typeof ProgressionManager.awardCoinsInTransaction !== 'function') return null;
      return ProgressionManager.awardCoinsInTransaction(d, amount);
    }
    if (definition.wallet === 'candy') {
      const before = normalizeCandyBalance(d.candy);
      d.candy = normalizeCandyBalance(before + amount);
      return { amount: d.candy - before, total: d.candy };
    }
    const balances = normalizeCurrencyBalances(d.currencyBalances);
    const before = balances[definition.id] || 0;
    balances[definition.id] = Math.min(before + amount, 1_000_000_000);
    d.currencyBalances = balances;
    return { amount: balances[definition.id] - before, total: balances[definition.id] };
  }

  function debitCurrencyInTransaction(d, definition, amount) {
    const balance = readCurrencyInTransaction(d, definition);
    if (balance < amount) return null;
    if (definition.wallet === 'coins') d.coins = balance - amount;
    else if (definition.wallet === 'candy') d.candy = balance - amount;
    else {
      const balances = normalizeCurrencyBalances(d.currencyBalances);
      balances[definition.id] = balance - amount;
      if (!balances[definition.id]) delete balances[definition.id];
      d.currencyBalances = balances;
    }
    return { amount, total: balance - amount };
  }

  function grantCurrency(transactionId, currencyId, amount, meta = {}) {
    const safeAmount = strictCurrencyAmount(amount);
    const resolved = resolveActiveCurrency(currencyId);
    if (!premiumMutationAllowed() && resolved.definition?.wallet === 'candy') return rejected(FroggyPremiumMutationBoundary.blockedReason());
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (resolved.error) return { commit: false, reason: resolved.error };
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      const credit = creditCurrencyInTransaction(d, resolved.definition, safeAmount);
      if (!credit) return { commit: false, reason: 'wallet-unavailable' };
      recordProgressionFactsInTransaction(d, [{ kind: 'count', key: 'grants.applied' }]);
      return { commit: true, currencyId: resolved.definition.id, amount: credit.amount, total: credit.total };
    }, {
      domain: 'wallet', kind: meta.kind || 'currency-grant', subjectId: meta.subjectId || String(currencyId || ''),
      amount: safeAmount === null ? 0 : safeAmount, contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('currencyGranted', { currencyId: outcome.result.currencyId, amount: outcome.result.amount, total: outcome.result.total, transactionId });
    }
    return outcome;
  }

  function spendCurrency(transactionId, currencyId, amount, meta = {}) {
    const safeAmount = strictCurrencyAmount(amount);
    const resolved = resolveActiveCurrency(currencyId);
    if (!premiumMutationAllowed() && resolved.definition?.wallet === 'candy') return rejected(FroggyPremiumMutationBoundary.blockedReason());
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (resolved.error) return { commit: false, reason: resolved.error };
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      const debit = debitCurrencyInTransaction(d, resolved.definition, safeAmount);
      if (!debit) return { commit: false, reason: 'insufficient-currency' };
      return { commit: true, currencyId: resolved.definition.id, amount: debit.amount, total: debit.total };
    }, {
      domain: 'wallet', kind: meta.kind || 'currency-spend', subjectId: meta.subjectId || String(currencyId || ''),
      amount: safeAmount === null ? 0 : safeAmount, contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('currencySpent', { currencyId: outcome.result.currencyId, amount: outcome.result.amount, total: outcome.result.total, transactionId });
    }
    return outcome;
  }

  function currencyBalance(currencyId) {
    const definition = typeof CurrencyRegistry !== 'undefined' ? CurrencyRegistry.resolve(currencyId) : null;
    if (!definition) return null;
    return readCurrencyInTransaction(SaveManager.get(), definition);
  }

  // ── EC-9 durable Candy-assist reservation lifecycle ───────────────────────
  // reserve → (gameplay effect) → confirm/settle, else refund. Prevents both a
  // Candy debit without its effect and an effect without exactly one debit.

  // Durable reserve: debit Candy AND record the in-flight reservation in the
  // SAME ledger transaction, so a crash can never persist the debit without a
  // reservation to recover. REJECTED (insufficient/invalid) records nothing and
  // does not consume the transaction id; DUPLICATE never double-debits.
  function reserveCandyAssist(transactionId, amount, meta = {}) {
    if (!premiumMutationAllowed()) return rejected(FroggyPremiumMutationBoundary.blockedReason());
    // Strict amount contract: no string/fraction coercion at a mutation API.
    const safeAmount = strictCurrencyAmount(amount);
    const outcome = EconomyLedger.apply(transactionId, d => {
      if (safeAmount === null) return { commit: false, reason: 'invalid-amount' };
      // Fail CLOSED **before the debit** when the reservation cannot be durably
      // retained. At capacity, committing would debit Candy and consume the
      // ledger id while recording nothing to confirm or refund — the spend
      // would be silently unrecoverable. REJECTED leaves the id retryable once
      // a slot frees. A same-id survivor without an applied ledger entry is
      // inconsistent state and also fails closed rather than double-debiting.
      const reservations = normalizeCandyReservations(d.candyReservations);
      if (reservations.some(r => r.id === transactionId)) return { commit: false, reason: 'reservation-exists' };
      if (reservations.length >= CANDY_RESERVATIONS_MAX) return { commit: false, reason: 'reservation-capacity' };
      const balance = normalizeCandyBalance(d.candy);
      if (balance < safeAmount) return { commit: false, reason: 'insufficient-candy' };
      d.candy = balance - safeAmount;
      reservations.push({ id: transactionId, candy: safeAmount });
      d.candyReservations = reservations;
      return { commit: true, candyAmount: safeAmount, candyTotal: d.candy };
    }, {
      domain: 'wallet', kind: meta.kind || 'candy-assist', subjectId: meta.subjectId,
      amount: safeAmount === null ? 0 : safeAmount, contentVersion: meta.contentVersion,
    });
    if (outcome.status === 'applied') {
      EventBus.emit('candySpent', { amount: safeAmount, total: outcome.result.candyTotal, transactionId });
    }
    return outcome;
  }

  // Effect received: durably drop the reservation so it is never refunded. The
  // Candy stays legitimately spent. Idempotent (no-op if already settled).
  function confirmCandyAssist(transactionId) {
    const id = String(transactionId || '');
    let confirmed = false;
    const { ok } = SaveManager.setDurable(d => {
      const reservations = normalizeCandyReservations(d.candyReservations);
      const next = reservations.filter(r => r.id !== id);
      confirmed = next.length !== reservations.length;
      d.candyReservations = next;
    });
    return { ok: ok === true, confirmed };
  }

  // Refund tied to the original spend id: reverse-credit exactly once (the
  // `<id>:refund` ledger id dedupes replays) AND drop the reservation, in one
  // durable transaction. Never a dev-grant path.
  function refundCandyAssist(transactionId) {
    if (!premiumMutationAllowed()) return rejected(FroggyPremiumMutationBoundary.blockedReason());
    const id = String(transactionId || '');
    const refundId = `${id}:refund`;
    const outcome = EconomyLedger.apply(refundId, d => {
      const reservations = normalizeCandyReservations(d.candyReservations);
      const entry = reservations.find(r => r.id === id);
      if (!entry) return { commit: false, reason: 'no-reservation' };
      d.candy = normalizeCandyBalance(normalizeCandyBalance(d.candy) + entry.candy);
      d.candyReservations = reservations.filter(r => r.id !== id);
      return { commit: true, candyAmount: entry.candy, candyTotal: d.candy };
    }, { domain: 'wallet', kind: 'candy-assist-refund', subjectId: id });
    if (outcome.status === 'applied') {
      EventBus.emit('candyAwarded', { amount: outcome.result.candyAmount, reason: 'candyAssistRefund', total: outcome.result.candyTotal, transactionId: refundId });
    }
    return outcome;
  }

  // Run completion (durable outcome reached): the run's assists are legitimately
  // spent — clear the in-flight list so nothing is refunded on the next boot.
  function settleCandyAssists() {
    let cleared = 0;
    const { ok } = SaveManager.setDurable(d => {
      const reservations = normalizeCandyReservations(d.candyReservations);
      cleared = reservations.length;
      d.candyReservations = [];
    });
    return { ok: ok === true, cleared };
  }

  // Boot recovery: any surviving reservation was debited but never confirmed
  // (crash between reserve and effect) — refund each exactly once.
  function resolveCandyAssists() {
    const pending = normalizeCandyReservations(SaveManager.get().candyReservations);
    const refunded = [];
    for (const entry of pending) {
      const outcome = refundCandyAssist(entry.id);
      if (outcome.status === 'applied') refunded.push(entry.id);
    }
    return { refunded };
  }

  function ownsEntitlement(itemId) {
    const entitlements = normalizeEntitlements(SaveManager.get().entitlements);
    return !!entitlements[String(itemId || '')];
  }

  function ownedEntitlements() {
    return Object.keys(normalizeEntitlements(SaveManager.get().entitlements)).sort();
  }

  // Fact updates that are not grants (repeatable telemetry counters). Commits
  // durably via its own transaction; never touches the ledger.
  function recordFacts(factSpecs) {
    let outcome = null;
    SaveManager.set(d => { outcome = recordProgressionFactsInTransaction(d, factSpecs); });
    if (outcome && outcome.applied > 0) EventBus.emit('progressionFactsChanged', { applied: outcome.applied });
    return outcome;
  }

  return {
    grant, recordFacts, spendCandy, candyBalance, ownsEntitlement, ownedEntitlements,
    reserveCandyAssist, confirmCandyAssist, refundCandyAssist, settleCandyAssists, resolveCandyAssists,
    grantCurrency, spendCurrency, currencyBalance,
  };
})();

// ────────────────────────────────────────────────────────────────────────
// 3. DIFFICULTY DIRECTOR
// ────────────────────────────────────────────────────────────────────────
const DifficultyDirector = (() => {
  const state = { currentBias: 0, windowDuration: 10, catchHistory: [], missHistory: [], _lastAdjustment: 1 };
  const modeConfig = {
    standard: { enabled: true },
    tc:       { enabled: false },
    fmf:      { enabled: false },
  };

  function pruneArrayInPlace(values, cutoff) {
    let write = 0;
    for (let read = 0; read < values.length; read += 1) {
      const value = values[read];
      if (value > cutoff) values[write++] = value;
    }
    values.length = write;
  }
  function pruneHistory(now) {
    const cutoff = now - state.windowDuration * 1000;
    pruneArrayInPlace(state.catchHistory, cutoff);
    pruneArrayInPlace(state.missHistory, cutoff);
  }
  function calculatePerformance() {
    const total = state.catchHistory.length + state.missHistory.length;
    if (total < 3) return 0.5;
    return state.catchHistory.length / total;
  }
  function isEnabled(mode) {
    const cfg = modeConfig[mode];
    return !cfg || cfg.enabled !== false; 
  }

  // Recompute and cache the bias — call once per game tick (from SpawnManager).
  function _recompute(mode) {
    if (mode !== undefined && !isEnabled(mode)) { state._lastAdjustment = 1; return 1; }
    pruneHistory(performance.now());
    const perf = calculatePerformance();
    if (perf > 0.85) state.currentBias = Math.min(1, state.currentBias + 0.02);
    else if (perf < 0.55) state.currentBias = Math.max(-1, state.currentBias - 0.03);
    else state.currentBias *= 0.95;
    // `adjustedInterval = baseInterval * adjustment` in SpawnManager.
    // A smaller interval is harder, so strong recent play must produce a value
    // below 1, while misses create breathing room above 1. The prior sign was
    // reversed: success slowed drops and misses sped them up.
    state._lastAdjustment = 1 - (state.currentBias * 0.12);
    return state._lastAdjustment;
  }

  return {
    configureMode(mode, cfg) { modeConfig[mode] = Object.assign({ enabled: true }, modeConfig[mode], cfg); },
    recordCatch() { state.catchHistory.push(performance.now()); },
    recordMiss()  { state.missHistory.push(performance.now()); },
    // getAdjustment is the primary call — recomputes bias (call once per spawn tick).
    getAdjustment(mode) { return _recompute(mode); },
    // getAdjustmentCached is a read-only query — safe to call from the stats panel every frame.
    getAdjustmentCached() { return state._lastAdjustment; },
    getDebug() {
      pruneHistory(performance.now());
      return { catches: state.catchHistory.length, misses: state.missHistory.length, bias: state.currentBias, adjustment: state._lastAdjustment };
    },
    reset() { state.catchHistory = []; state.missHistory = []; state.currentBias = 0; state._lastAdjustment = 1; },
  };
})();
EventBus.on('foodCaught', () => DifficultyDirector.recordCatch());

const DDAManager = DifficultyDirector;

// ────────────────────────────────────────────────────────────────────────
// 4. ABILITY SYSTEM
// ────────────────────────────────────────────────────────────────────────
const AbilitySystem = (() => {
  const registry = {};
  const hooksPresent = new Set();

  function register(id, def) {
    const registered = Object.assign({ id }, def);
    registry[id] = registered;
    for (const key of Object.keys(registered)) {
      if (typeof registered[key] === 'function') hooksPresent.add(key);
    }
  }
  function get(id) { return registry[id]; }
  function getActive(charDef) {
    const ids = charDef?.abilities;
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const active = [];
    for (let index = 0; index < ids.length; index += 1) {
      const def = registry[ids[index]];
      if (def) active.push(def);
    }
    return active;
  }
  function trigger(hook, charDef, ctx) {
    const ids = charDef?.abilities;
    if (!hooksPresent.has(hook) || !Array.isArray(ids)) return;
    for (let index = 0; index < ids.length; index += 1) {
      const def = registry[ids[index]];
      if (typeof def?.[hook] === 'function') {
        def[hook](ctx, charDef);
        EventBus.emit('abilityTriggered', { ability: def.id, hook });
      }
    }
  }
  function modify(hook, charDef, baseValue, ctx) {
    let value = baseValue;
    const ids = charDef?.abilities;
    if (!hooksPresent.has(hook) || !Array.isArray(ids)) return value;
    for (let index = 0; index < ids.length; index += 1) {
      const def = registry[ids[index]];
      if (typeof def?.[hook] === 'function') {
        const result = def[hook](value, ctx, charDef);
        if (result !== undefined) value = result;
      }
    }
    return value;
  }

  const KNOWN_ABILITIES = {
    tongue:          { label: 'Tongue Catch',     category: 'catch' },
    legs:            { label: 'Standard Legs',    category: 'movement' },
    fastTongue:      { label: 'Fast Tongue',      category: 'catch' },
    fastMove:        { label: 'Fast Movement',    category: 'movement' },
    wideCatch:       { label: 'Wide Catch',       category: 'catch' },
    hookedTongue:    { label: 'Hooked Tongue',    category: 'catch' },
    pouchCatch:      { label: 'Pouch Catch',      category: 'catch' },
    flyingCatch:     { label: 'Flying',           category: 'movement' },
    comboScore:      { label: 'Combo Scoring',    category: 'scoring' },
    snapJaw:         { label: 'Snap Jaw',         category: 'catch' },
    snapClone:       { label: 'Clone',            category: 'special' },
    heavyMovement:   { label: 'Lunge',            category: 'catch' },
    basketCatch:     { label: 'Basket',           category: 'catch' },
    gulperCatch:     { label: 'Gulp',             category: 'catch' },
    chomperCatch:    { label: 'Chomp',            category: 'catch' },
    vampireFeed:     { label: 'Vampire Feed',     category: 'special' },
    scoreBonus:      { label: 'Score Bonus',      category: 'scoring' },
    scoreMultiplier: { label: 'Score Multiplier', category: 'scoring' },
    growingBelly:    { label: 'Growing Belly',    category: 'special' },
    streakMultiplier:{ label: 'Streak Multiplier',category: 'scoring' },
    ninjaJump:       { label: 'Ninja Jump',       category: 'movement' },
    toadalPassiveEat: { label: 'Royal Appetite',    category: 'catch' },
    toadalHop:        { label: 'Charged Royal Hop', category: 'movement' },
    toadalTongue:     { label: 'Royal Tongue',      category: 'catch' },
    toadalGoldenThrow:{ label: 'Golden Throw',      category: 'special' },
    toadalGoldenBlock:{ label: 'Golden Block',      category: 'special' },
  };
  Object.entries(KNOWN_ABILITIES).forEach(([id, def]) => register(id, def));

  return { register, get, getActive, trigger, modify, hasHook: hook => hooksPresent.has(hook), all: () => registry };
})();

// ────────────────────────────────────────────────────────────────────────
// 5. STATUS EFFECT SYSTEM
// ────────────────────────────────────────────────────────────────────────
const StatusEffectSystem = (() => {
  let active = [];
  const registry = {};

  function register(id, def) { registry[id] = Object.assign({ id }, def); }

  function findActive(id) {
    for (let index = 0; index < active.length; index += 1) {
      if (active[index].id === id) return active[index];
    }
    return undefined;
  }

  function apply(id, duration, data = {}) {
    const def = registry[id] || {};
    const existing = findActive(id);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, duration);
      existing.duration  = duration;
      existing.data = Object.assign({}, existing.data, data);
      EventBus.emit('statusApplied', { id, duration, refreshed: true });
      return existing;
    }
    const entry = { id, remaining: duration, duration, data, def };
    active.push(entry);
    if (typeof def.onApply === 'function') def.onApply(entry);
    EventBus.emit('statusApplied', { id, duration, refreshed: false });
    return entry;
  }

  function remove(id) {
    let idx = -1;
    for (let index = 0; index < active.length; index += 1) {
      if (active[index].id === id) { idx = index; break; }
    }
    if (idx < 0) return;
    const [entry] = active.splice(idx, 1);
    if (typeof entry.def.onExpire === 'function') entry.def.onExpire(entry);
    EventBus.emit('statusExpired', { id });
  }

  function has(id) { return findActive(id) !== undefined; }
  function get(id) { return findActive(id); }
  function hasActiveHook(hook) {
    for (let index = 0; index < active.length; index += 1) {
      if (typeof active[index].def[hook] === 'function') return true;
    }
    return false;
  }
  function list() { return active.slice(); }

  function update(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const e = active[i];
      if (typeof e.def.onTick === 'function') e.def.onTick(e, dt);
      e.remaining -= dt;
      if (e.remaining <= 0) {
        active.splice(i, 1);
        if (typeof e.def.onExpire === 'function') e.def.onExpire(e);
        EventBus.emit('statusExpired', { id: e.id });
      }
    }
  }

  function modify(hook, baseValue, ctx) {
    let value = baseValue;
    for (let index = 0; index < active.length; index += 1) {
      const entry = active[index];
      if (typeof entry.def[hook] === 'function') {
        const result = entry.def[hook](value, entry, ctx);
        if (result !== undefined) value = result;
      }
    }
    return value;
  }

  function clear() { active = []; }

  register('shield',      { label: 'Shield Candy',        visualKind: 'shield',       blocksDamage: true });
  register('speedBoost',  { label: 'Haste Candy',   visualKind: 'speedBoost',   onSpeedCalc: (spd) => spd + 120 });
  register('slowed',      { label: 'Slowed',        visualKind: 'slowFood',     onSpeedCalc: (spd) => Math.max(80, spd - 150) });
  register('scoreBoost',  { label: 'Star Candy',   visualKind: 'scoreBoost',   onScoreCatch: (pts) => Math.round(pts * 1.5) });
  register('slowFood',    { label: 'Time Candy',     visualKind: 'slowFood',     onFoodSpeedScale: (scale) => scale * 0.45 });
  register('doublePoints',{ label: 'Royal Candy', visualKind: 'doublePoints', onScoreCatch: (pts) => pts * 2 });
  register('magnet',      {
    label: 'Magnet Candy', visualKind: 'magnet',
    // Pull strength: px/s² acceleration applied toward frog each update tick
    PULL_ACCEL: 1800,
    // Items within this px radius get pulled (large enough to cover whole screen)
    PULL_RADIUS: 900,
    onApply(entry) {
      // Mark flag so updateFoods can skip the normal slow-drift wobble on pulled items
      entry.data.pulling = true;
    },
    onExpire() {},
    // Called from updateFoods for each food item while magnet is active
    onFoodUpdate(f, dt, frogX, frogY) {
      // Only pull positive (non-hazard) items
      if (f.isBomb || f.isSun) return;
      const dx = frogX - f.x;
      const dy = frogY - f.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 1) return;
      const accel = this.PULL_ACCEL * dt;
      // Give the food item velocity properties if it doesn't have them
      if (f.magnetVx === undefined) { f.magnetVx = 0; f.magnetVy = 0; }
      f.magnetVx += (dx / dist) * accel;
      f.magnetVy += (dy / dist) * accel;
      // Clamp to a reasonable max speed so items don't teleport
      const maxSpd = 1200;
      const spd = Math.sqrt(f.magnetVx*f.magnetVx + f.magnetVy*f.magnetVy);
      if (spd > maxSpd) { f.magnetVx *= maxSpd/spd; f.magnetVy *= maxSpd/spd; }
      f.x += f.magnetVx * dt;
      f.y += f.magnetVy * dt;
    },
  });

  return { register, apply, remove, has, get, hasActiveHook, list, update, modify, clear };
})();

// ────────────────────────────────────────────────────────────────────────
// 6. STATISTICS TRACKER
// ────────────────────────────────────────────────────────────────────────
const StatsTracker = (() => {
  let sessionStart = 0;

  function ensure(d) {
    if (!d.stats) d.stats = structuredClone(DEFAULT_STATS);
    return d.stats;
  }

  EventBus.on('gameStarted', () => { sessionStart = performance.now(); });

  EventBus.on('foodCaught', () => {
    SaveManager.set(d => {
      const s = ensure(d);
      s.totalFoodCaught++;
      if (typeof GameState !== 'undefined' && GameState.combo > s.longestComboEver) {
        s.longestComboEver = GameState.combo;
      }
    });
  });

  EventBus.on('heartCaught', () => {
    SaveManager.set(d => { ensure(d).totalHeartsCaught++; });
  });

  EventBus.on('playerDamaged', (data) => {
    SaveManager.set(d => {
      const s = ensure(d);
      const source = data?.source;
      if (ArcadeDamageSource.isBomb(source)) s.totalBombsHit++;
      else if (ArcadeDamageSource.isMiss(source)) s.totalMisses++;
      // Fire and sun are hazards, not dropped-food misses. They remain covered
      // by their dedicated run/lifetime tracking rather than corrupting the
      // player-facing totalMisses statistic.
    });
  });

  EventBus.on('gameOver', (info) => {
    const elapsed = sessionStart ? (performance.now() - sessionStart) / 1000 : 0;
    SaveManager.set(d => {
      const s = ensure(d);
      s.totalGamesPlayed++;
      s.totalPlayTimeSec += elapsed;
      if (!info) return;
      if (info.score > s.highestScore) s.highestScore = info.score;
      if (info.level > s.highestLevel) s.highestLevel = info.level;
      if (info.charId) {
        const c = s.perCharacter[info.charId] || { gamesPlayed: 0, bestScore: 0 };
        c.gamesPlayed++;
        if (info.score > c.bestScore) c.bestScore = info.score;
        s.perCharacter[info.charId] = c;
      }
      if (info.mode) {
        const m = s.perMode[info.mode] || { gamesPlayed: 0, bestScore: 0 };
        m.gamesPlayed++;
        if (info.score > m.bestScore) m.bestScore = info.score;
        s.perMode[info.mode] = m;
      }
    });
    EventBus.emit('statRecorded', { type: 'gameOver', info });
  });

  return {
    defaultStats: () => structuredClone(DEFAULT_STATS),
    getStats: () => ensure(SaveManager.get()),
  };
})();
