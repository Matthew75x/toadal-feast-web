/* Local-only guest progression runtime. No account, server, or mobile-game integration. */
(function (root, factory) {
  const definitions = (typeof module === 'object' && module.exports)
    ? require('./progression-definitions.js')
    : root && root.ToadalProgressionDefinitions;
  const api = factory(definitions);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalGuestProgression = api;
  if (root && root.document) {
    api.boot(root.document, root);
    const discovery = root.document.querySelector('[data-home-discovery]');
    if (discovery && !root.__toadalHomeDiscoveryLoading && !root.__toadalHomeDiscoveryLoaded) {
      root.__toadalHomeDiscoveryLoading = true;
      const brand = root.document.querySelector('.site-brand');
      let baseRoot = '';
      try {
        const homePath = brand ? new root.URL(brand.href, root.location.href).pathname : '/';
        baseRoot = homePath === '/' ? '' : homePath.replace(/\/+$/, '');
      } catch (_) { /* The root-mounted path remains the safe default. */ }
      const script = root.document.createElement('script');
      script.src = baseRoot + '/assets/js/home-interactive-discovery.js';
      script.onload = () => { root.__toadalHomeDiscoveryLoading = false; root.__toadalHomeDiscoveryLoaded = true; };
      script.onerror = () => {
        root.__toadalHomeDiscoveryLoading = false;
        discovery.dataset.interactionUnavailable = 'true';
        const status = discovery.querySelector('[data-portal-status]');
        if (status) status.textContent = 'Interactive discoveries could not load. Site navigation remains available.';
        discovery.querySelectorAll('[data-home-candy], [data-golden-block-hit]').forEach(button => { button.disabled = true; });
      };
      root.document.head.appendChild(script);
    }
    if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('toadal:guest-progression-ready'));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (defaultDefinitions) {
  'use strict';

  const VERSION = 1;
  const HOME_INTERACTION_VERSION = 1;
  const HOME_CANDY_IDS = Object.freeze(['portal-candy', 'lower-page-candy', 'golden-block-candy']);
  const MAX_LOCAL_RUNS = 50;
  const KEYS = Object.freeze({
    pass: 'toadal:web:v1:feast-pass',
    quests: 'toadal:web:v1:quests',
    discoveries: 'toadal:web:v1:discoveries',
    profile: 'toadal:web:v1:profile'
  });

  function isoNow(now) {
    const value = typeof now === 'function' ? now() : new Date();
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  function utcDay(iso) { return iso.slice(0, 10); }
  function emptyHomeInteraction() {
    return { schemaVersion: HOME_INTERACTION_VERSION, candies: [], goldenBlock: { hits: 0, complete: false } };
  }
  function normalizeHomeInteraction(value) {
    if (value === undefined) return emptyHomeInteraction();
    const readOnly = reason => Object.assign(emptyHomeInteraction(), { readOnly: true, readOnlyReason: reason });
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return readOnly('invalid-stored-data-read-only');
    if (Number.isInteger(source.schemaVersion) && source.schemaVersion > HOME_INTERACTION_VERSION) return readOnly('future-schema-read-only');
    if (source.schemaVersion !== HOME_INTERACTION_VERSION) return readOnly('invalid-stored-data-read-only');
    const block = source.goldenBlock && typeof source.goldenBlock === 'object' ? source.goldenBlock : {};
    const hits = block.hits;
    const complete = block.complete;
    if (!Array.isArray(source.candies) || source.candies.some(id => !HOME_CANDY_IDS.includes(id)) ||
        new Set(source.candies).size !== source.candies.length || !Number.isInteger(hits) || hits < 0 || hits > 4 ||
        typeof complete !== 'boolean' || complete !== (hits === 4)) return readOnly('invalid-stored-data-read-only');
    if (source.candies.includes('golden-block-candy') && !complete) return readOnly('invalid-stored-data-read-only');
    const candies = HOME_CANDY_IDS.filter(id => source.candies.includes(id));
    return Object.assign({}, source, {
      candies,
      goldenBlock: { hits, complete }
    });
  }
  function emptyRecords(timestamp) {
    return {
      pass: { schemaVersion: VERSION, updatedAt: timestamp, level: 1, xp: 0, sparks: 0, treats: 0, streak: { count: 0, lastQualifiedPeriod: null }, badges: [], collectibles: [], claimedRewardIds: [] },
      quests: { schemaVersion: VERSION, updatedAt: timestamp, items: {}, processedEventIds: [], dailyClaimedPeriod: null },
      discoveries: { schemaVersion: VERSION, updatedAt: timestamp, items: [], homeInteraction: emptyHomeInteraction() },
      profile: { schemaVersion: VERSION, updatedAt: timestamp, displayName: null, selectedBadge: null, selectedTitle: null, badges: [], titles: [], collectibles: [], rewardClaims: {}, localScores: {}, localHighScores: [] }
    };
  }
  function makeMemoryStorage() {
    const values = new Map();
    return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  }
  function safeInt(value, fallback, minimum) {
    return Number.isInteger(value) && value >= minimum ? value : fallback;
  }
  function normalizeScore(value) {
    if (Number.isSafeInteger(value) && value >= 0) return value;
    if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
    const normalized = Number(value.trim());
    return Number.isSafeInteger(normalized) && normalized >= 0 ? normalized : null;
  }
  function normalizeCollectibles(value) {
    const counts = new Map();
    for (const item of Array.isArray(value) ? value : []) {
      const id = typeof item === 'string' ? item : item && item.id;
      const count = typeof item === 'string' ? 1 : item && item.count;
      if (typeof id !== 'string' || !id.trim() || !Number.isSafeInteger(count) || count < 0) continue;
      counts.set(id, (counts.get(id) || 0) + count);
    }
    return Array.from(counts, ([id, count]) => ({ id, count }));
  }
  function normalizeLocalScores(value, legacyBest) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const output = {};
    const candidate = source['wicked-bites'];
    const runs = [];
    if (candidate && Array.isArray(candidate.runs)) {
      for (const run of candidate.runs) {
        const score = normalizeScore(run && run.score);
        if (score === null || !run || typeof run.completedAt !== 'string') continue;
        runs.push({ score, completedAt: run.completedAt, mode: null, ruleset: null, characterId: null });
      }
    }
    if (!runs.length && Array.isArray(legacyBest)) {
      for (const item of legacyBest) {
        if (!item || item.gameId !== 'wicked-bites') continue;
        const score = normalizeScore(item.score);
        const completedAt = typeof item.updatedAt === 'string' ? item.updatedAt : null;
        if (score !== null && completedAt) runs.push({ score, completedAt, mode: null, ruleset: null, characterId: null });
      }
    }
    if (runs.length) {
      const bounded = runs.slice(-MAX_LOCAL_RUNS);
      // The personal best is all-time; the run list is only the latest 50.
      const best = Math.max(normalizeScore(candidate && candidate.best) || 0,
        bounded.reduce((value, run) => Math.max(value, run.score), 0));
      output['wicked-bites'] = { best, runs: bounded };
    }
    return output;
  }
  function validLocalScores(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.entries(value).every(([gameId, state]) => {
      if (gameId !== 'wicked-bites' || !state || typeof state !== 'object' || Array.isArray(state) ||
          normalizeScore(state.best) === null || !Array.isArray(state.runs) || state.runs.length > MAX_LOCAL_RUNS) return false;
      const validRuns = state.runs.every(run => run && typeof run === 'object' && normalizeScore(run.score) !== null &&
        typeof run.completedAt === 'string' && !Number.isNaN(Date.parse(run.completedAt)) && new Date(run.completedAt).toISOString() === run.completedAt &&
        ['mode', 'ruleset', 'characterId'].every(key => run[key] === null || typeof run[key] === 'string'));
      return validRuns && typeof state.best === 'number' &&
        state.best >= state.runs.reduce((best, run) => Math.max(best, run.score), 0);
    });
  }
  function createStore(options) {
    options = options || {};
    const suppliedStorage = Boolean(options.storage);
    const storage = options.storage || makeMemoryStorage();
    let persistent = suppliedStorage;
    const now = options.now || (() => new Date());
    const definitions = options.definitions || defaultDefinitions || {};
    const diagnostics = [];
    const blocked = new Set();
    const unwritable = new Set();
    const timestamp = () => isoNow(now);
    const defaults = emptyRecords(timestamp());
    const records = {};
    let lastReset = null;
    let lastRefresh = null;
    let refreshReadFailed = false;

    function read(name, observed) {
      let raw;
      try { raw = observed ? observed.raw : storage.getItem(KEYS[name]); }
      catch (error) { persistent = false; unwritable.add(name); diagnostics.push({ key: KEYS[name], kind: 'read-failed', message: String(error && error.message || error) }); return structuredCopy(defaults[name]); }
      if (raw == null || raw === '') { blocked.delete(name); unwritable.delete(name); return structuredCopy(defaults[name]); }
      let data;
      try { data = JSON.parse(raw); }
      catch (error) {
        unwritable.add(name);
        diagnostics.push({ key: KEYS[name], kind: 'malformed-json', message: String(error && error.message || error) });
        return structuredCopy(defaults[name]);
      }
      if (!data || typeof data !== 'object' || Array.isArray(data) || !Number.isInteger(data.schemaVersion)) {
        unwritable.add(name);
        diagnostics.push({ key: KEYS[name], kind: 'invalid-record' });
        return structuredCopy(defaults[name]);
      }
      if (data.schemaVersion > VERSION) {
        blocked.add(name);
        unwritable.delete(name);
        diagnostics.push({ key: KEYS[name], kind: 'future-version', schemaVersion: data.schemaVersion });
        return structuredCopy(defaults[name]);
      }
      const invalidMarkers = (name === 'profile' && !validProfileMarkerShape(data)) ||
        (name === 'pass' && Object.prototype.hasOwnProperty.call(data, 'claimedRewardIds') &&
          (!Array.isArray(data.claimedRewardIds) || data.claimedRewardIds.some(id => typeof id !== 'string' || !id)));
      if (invalidMarkers) {
        unwritable.add(name);
        diagnostics.push({ key: KEYS[name], kind: 'invalid-showcase-state-read-only' });
      }
      if (name === 'profile' && Object.prototype.hasOwnProperty.call(data, 'localScores') && !validLocalScores(data.localScores)) {
        unwritable.add(name);
        diagnostics.push({ key: KEYS[name], kind: 'invalid-score-state-read-only' });
      }
      blocked.delete(name);
      if (!invalidMarkers && !(name === 'profile' && Object.prototype.hasOwnProperty.call(data, 'localScores') && !validLocalScores(data.localScores))) unwritable.delete(name);
      const merged = Object.assign({}, defaults[name], data, { schemaVersion: VERSION });
      if (name === 'pass') {
        merged.level = safeInt(merged.level, 1, 1);
        merged.xp = safeInt(merged.xp, 0, 0);
        merged.sparks = safeInt(merged.sparks, 0, 0);
        merged.treats = safeInt(merged.treats, 0, 0);
        const incomingStreak = merged.streak && typeof merged.streak === 'object' ? merged.streak : {};
        merged.streak = {
          count: safeInt(incomingStreak.count, 0, 0),
          lastQualifiedPeriod: typeof incomingStreak.lastQualifiedPeriod === 'string' ? incomingStreak.lastQualifiedPeriod : null
        };
        merged.badges = Array.isArray(merged.badges) ? merged.badges : [];
        merged.collectibles = normalizeCollectibles(merged.collectibles);
        merged.claimedRewardIds = Array.isArray(merged.claimedRewardIds) ? merged.claimedRewardIds.filter(id => typeof id === 'string') : [];
      } else if (name === 'quests') {
        merged.items = merged.items && typeof merged.items === 'object' && !Array.isArray(merged.items) ? merged.items : {};
        merged.processedEventIds = Array.isArray(merged.processedEventIds) ? merged.processedEventIds : [];
        merged.dailyClaimedPeriod = typeof merged.dailyClaimedPeriod === 'string' ? merged.dailyClaimedPeriod : null;
      } else if (name === 'discoveries') {
        merged.items = Array.isArray(merged.items) ? merged.items : [];
        if (!Object.prototype.hasOwnProperty.call(data, 'homeInteraction')) merged.homeInteraction = emptyHomeInteraction();
      } else if (name === 'profile') {
        merged.badges = Array.isArray(merged.badges) ? merged.badges.filter(id => typeof id === 'string') : [];
        merged.titles = Array.isArray(merged.titles) ? merged.titles.filter(id => typeof id === 'string') : [];
        merged.collectibles = Array.isArray(merged.collectibles) ? merged.collectibles.filter(id => typeof id === 'string') : [];
        merged.selectedTitle = typeof merged.selectedTitle === 'string' ? merged.selectedTitle : null;
        merged.rewardClaims = merged.rewardClaims && typeof merged.rewardClaims === 'object' && !Array.isArray(merged.rewardClaims) ? merged.rewardClaims : {};
        merged.localScores = normalizeLocalScores(merged.localScores, merged.localHighScores);
        delete merged.localHighScores;
      }
      return merged;
    }
    function structuredCopy(value) { return JSON.parse(JSON.stringify(value)); }
    for (const name of Object.keys(KEYS)) records[name] = read(name);

    function save(name) {
      if (blocked.has(name) || unwritable.has(name)) return false;
      records[name].schemaVersion = VERSION;
      records[name].updatedAt = timestamp();
      try { storage.setItem(KEYS[name], JSON.stringify(records[name])); return true; }
      catch (error) { persistent = false; diagnostics.push({ key: KEYS[name], kind: 'write-failed', message: String(error && error.message || error) }); return false; }
    }
    function saveMany(names) {
      if (names.some(name => blocked.has(name) || unwritable.has(name))) return false;
      const previous = {};
      try {
        for (const name of names) previous[name] = storage.getItem(KEYS[name]);
        for (const name of names) {
          records[name].schemaVersion = VERSION;
          records[name].updatedAt = timestamp();
          storage.setItem(KEYS[name], JSON.stringify(records[name]));
        }
        return true;
      } catch (error) {
        persistent = false;
        for (const name of names) {
          try {
            if (Object.prototype.hasOwnProperty.call(previous, name)) {
              if (previous[name] == null) storage.removeItem(KEYS[name]);
              else storage.setItem(KEYS[name], previous[name]);
            }
          } catch (_) { /* Best-effort rollback; original write error is retained below. */ }
        }
        diagnostics.push({ key: names.map(name => KEYS[name]).join(','), kind: 'write-failed', message: String(error && error.message || error) });
        return false;
      }
    }
    function refresh(names) {
      for (const name of names) {
        blocked.delete(name);
        unwritable.delete(name);
        records[name] = read(name);
      }
    }
    function refreshFromStorage() {
      // Rehydrate only. Never replay route events, migration writes or rewards
      // when another tab changes storage or this document returns from cache.
      if (!suppliedStorage) {
        lastRefresh = { ok: true, changed: false, scope: 'page-only', unreadableKeys: [] };
        return getSnapshot();
      }
      const fingerprint = () => JSON.stringify([records, Array.from(blocked).sort(), Array.from(unwritable).sort(), refreshReadFailed]);
      const before = fingerprint();
      const unreadableKeys = [];
      for (const name of Object.keys(KEYS)) {
        let raw;
        try { raw = storage.getItem(KEYS[name]); }
        catch (_) {
          // Last-readable progress is not empty progress. Keep it visible with
          // an explicit refresh warning and prevent writes through this state.
          unwritable.add(name);
          unreadableKeys.push(KEYS[name]);
          continue;
        }
        blocked.delete(name);
        unwritable.delete(name);
        const next = read(name, { raw });
        if (blocked.has(name) || unwritable.has(name)) {
          unreadableKeys.push(KEYS[name]);
          continue;
        }
        // Missing keys have no timestamp; don't spuriously rerender after an
        // explicit reset merely because its empty defaults were created later.
        if (raw == null || raw === '') next.updatedAt = records[name].updatedAt;
        records[name] = next;
      }
      refreshReadFailed = unreadableKeys.length > 0;
      const changed = before !== fingerprint();
      if (changed) lastReset = null;
      lastRefresh = { ok: !refreshReadFailed, changed, scope: 'browser', unreadableKeys };
      return getSnapshot();
    }
    function progressFor(definition) {
      const item = records.quests.items[definition.id] || {};
      const progress = Number.isFinite(item.progress) ? Math.max(0, item.progress) : 0;
      const target = Number.isFinite(definition.target) && definition.target > 0 ? definition.target : 1;
      return { progress, target, complete: progress >= target, claimedAt: item.claimedAt || null, completedAt: item.completedAt || null };
    }
    function treatCollectibleId(definition) {
      return definition && typeof definition.collectibleId === 'string' && definition.collectibleId
        ? definition.collectibleId : (definition ? 'treat-' + definition.id : null);
    }
    function treatTotal(collectibles) {
      const ids = new Set((definitions.treats || []).map(treatCollectibleId));
      return normalizeCollectibles(collectibles).reduce((total, item) => total + (ids.has(item.id) ? Math.min(1, item.count) : 0), 0);
    }
    function applyTreatQuestEvent(id) {
      const eventId = 'treat:' + id;
      if (records.quests.processedEventIds.includes(eventId)) return false;
      records.quests.processedEventIds.push(eventId);
      for (const quest of (definitions.quests || []).filter(item => item.event === 'treat-collect')) {
        const before = progressFor(quest);
        if (before.complete) continue;
        const progress = Math.min(before.target, before.progress + 1);
        records.quests.items[quest.id] = Object.assign({}, records.quests.items[quest.id], {
          progress,
          completedAt: progress >= before.target ? timestamp() : null,
          claimedAt: records.quests.items[quest.id] && records.quests.items[quest.id].claimedAt || null
        });
      }
      return true;
    }
    function grant(reward) {
      reward = reward || {};
      records.pass.xp += Number.isFinite(reward.xp) && reward.xp > 0 ? Math.floor(reward.xp) : 0;
      records.pass.sparks += Number.isFinite(reward.sparks) && reward.sparks > 0 ? Math.floor(reward.sparks) : 0;
      const configuredThreshold = Number.isFinite(definitions.xpPerLevel) && definitions.xpPerLevel > 0 ? Math.floor(definitions.xpPerLevel) : null;
      if (configuredThreshold) records.pass.level = 1 + Math.floor(records.pass.xp / configuredThreshold);
    }
    function getSnapshot() {
      const currentPeriod = utcDay(timestamp());
      const quests = (definitions.quests || []).map(definition => Object.assign({}, definition, progressFor(definition)));
      const discoveryDefinitions = definitions.discoveries || [];
      const discoveries = records.discoveries.items.map(id => {
        const definition = discoveryDefinitions.find(item => item.id === id);
        return definition ? { id, title: definition.title, description: definition.description || '',
          characterId: definition.event === 'character-view' ? definition.characterId : null,
          routeVisit: definition.event === 'route-visit' } :
          { id, title: 'Previously recorded discovery', description: '', characterId: null };
      });
      const pass = structuredCopy(records.pass);
      pass.collectibles = normalizeCollectibles(pass.collectibles);
      pass.treats = treatTotal(pass.collectibles);
      const collectibleIds = new Set(pass.collectibles.filter(item => item.count > 0).map(item => item.id));
      const treats = (definitions.treats || [])
        .filter(treat => collectibleIds.has(treatCollectibleId(treat)))
        .map(treat => Object.assign({}, treat, { collected: true, localOnly: true }));
      const localScores = structuredCopy(records.profile.localScores || {});
      const localHighScores = Object.entries(localScores).map(([gameId, scoreState]) => ({ gameId, score: scoreState.best }));
      const milestones = (definitions.levelMilestones || []).map(milestone => Object.assign({}, milestone, { unlocked: milestone.level <= pass.level, entitlement: false }));
      const rewards = (definitions.rewards || []).map(reward => Object.assign({}, reward, {
        unlocked: Number.isInteger(reward.level) && reward.level <= pass.level,
        claimed: pass.claimedRewardIds.includes(reward.id),
        claimedAt: records.profile.rewardClaims[reward.id] || null,
        entitlement: false,
        localOnly: true
      }));
      const configuredThreshold = Number.isFinite(definitions.xpPerLevel) && definitions.xpPerLevel > 0 ? Math.floor(definitions.xpPerLevel) : null;
      const daily = {
        enabled: Boolean(definitions.dailyCheckIn && definitions.dailyCheckIn.enabled && definitions.dailyCheckIn.period === 'UTC-day'),
        period: currentPeriod, claimed: records.quests.dailyClaimedPeriod === currentPeriod,
        configStatus: definitions.configStatus || 'unverified-config'
      };
      const lastPeriod = records.pass.streak.lastQualifiedPeriod;
      const yesterday = new Date(Date.parse(currentPeriod + 'T00:00:00.000Z') - 86400000).toISOString().slice(0, 10);
      const nextDayNumber = daily.claimed ? records.pass.streak.count : (lastPeriod === yesterday ? records.pass.streak.count + 1 : 1);
      daily.streakDay = records.pass.streak.count > 0 && daily.claimed ? ((records.pass.streak.count - 1) % 7) + 1 : 0;
      daily.nextStreakDay = ((Math.max(1, nextDayNumber) - 1) % 7) + 1;
      quests.push({
        id: 'daily-check-in', group: 'daily', title: 'Daily check-in',
        description: 'The existing UTC-day guest check-in; its configured starter values are editable.',
        progress: daily.claimed ? 1 : 0, target: 1, complete: daily.claimed,
        claimedAt: daily.claimed ? records.quests.dailyClaimedPeriod : null,
        href: '/feast-pass/#daily-reward-title', dailyCheckIn: true
      });
      return {
        pass, quests,
        discoveries, characterDiscoveries: discoveries.filter(item => item.characterId),
        treats, profile: structuredCopy(records.profile), localScores, localHighScores,
        rewards, milestones,
        xpToNext: configuredThreshold ? configuredThreshold - records.pass.xp % configuredThreshold : null,
        daily,
        questsComplete: quests.filter(q => q.complete).length,
        storage: { local: persistent && !refreshReadFailed, persistent: persistent && !refreshReadFailed, available: persistent && !refreshReadFailed, diagnostics: diagnostics.slice(), scope: suppliedStorage ? 'browser' : 'page-only', readOnlyKeys: Array.from(new Set([...blocked, ...unwritable])).map(name => KEYS[name]), futureVersionKeys: Array.from(blocked).map(name => KEYS[name]), lastReset: lastReset ? structuredCopy(lastReset) : null, lastRefresh: lastRefresh ? structuredCopy(lastRefresh) : null }
      };
    }
    function recordEvent(eventId) {
      if (typeof eventId !== 'string' || !eventId.trim()) return false;
      refresh(['quests', 'discoveries']);
      if (blocked.has('quests')) return false;
      if (records.quests.processedEventIds.includes(eventId)) return false;
      const matching = (definitions.quests || []).filter(q => q.event === 'route-visit' && eventId === 'route:' + q.route);
      const matchingDiscoveries = (definitions.discoveries || []).filter(d => d.event === 'route-visit' && eventId === 'route:' + d.route);
      if (!matching.length && !matchingDiscoveries.length) return false;
      if (matchingDiscoveries.length && blocked.has('discoveries')) return false;
      const priorQuestState = structuredCopy(records.quests);
      const priorDiscoveryState = structuredCopy(records.discoveries);
      records.quests.processedEventIds.push(eventId);
      for (const quest of matching) {
        const before = progressFor(quest);
        if (before.complete) continue;
        const progress = Math.min(before.target, before.progress + 1);
        records.quests.items[quest.id] = Object.assign({}, records.quests.items[quest.id], { progress, completedAt: progress >= before.target ? timestamp() : null, claimedAt: records.quests.items[quest.id] && records.quests.items[quest.id].claimedAt || null });
      }
      for (const discovery of matchingDiscoveries) {
        if (!records.discoveries.items.includes(discovery.id)) records.discoveries.items.push(discovery.id);
      }
      const changed = matchingDiscoveries.length ? saveMany(['quests', 'discoveries']) : save('quests');
      if (!changed) {
        records.quests = priorQuestState;
        records.discoveries = priorDiscoveryState;
        return false;
      }
      return true;
    }
    function discoverCharacter(id) {
      const definition = (definitions.discoveries || []).find(item => item.event === 'character-view' && item.characterId === id);
      if (!definition) return { ok: false, reason: 'unknown-character' };
      refresh(['discoveries']);
      if (blocked.has('discoveries') || unwritable.has('discoveries')) return { ok: false, reason: 'stored-data-read-only' };
      if (records.discoveries.items.includes(definition.id)) return { ok: false, reason: 'already-discovered' };
      const before = structuredCopy(records.discoveries);
      records.discoveries.items.push(definition.id);
      if (!save('discoveries')) { records.discoveries = before; return { ok: false, reason: 'storage-unavailable' }; }
      return { ok: true, characterId: id };
    }
    function claimQuest(id) {
      refresh(['quests', 'pass']);
      const definition = (definitions.quests || []).find(q => q.id === id);
      if (!definition) return { ok: false, reason: 'unknown-quest' };
      const progress = progressFor(definition);
      if (!progress.complete) return { ok: false, reason: 'incomplete' };
      if (progress.claimedAt) return { ok: false, reason: 'already-claimed' };
      if (blocked.has('quests') || blocked.has('pass')) return { ok: false, reason: 'future-schema-read-only' };
      const priorQuestState = structuredCopy(records.quests);
      const priorPassState = structuredCopy(records.pass);
      records.quests.items[id].claimedAt = timestamp();
      grant(definition.reward);
      if (!saveMany(['quests', 'pass'])) {
        records.quests = priorQuestState;
        records.pass = priorPassState;
        return { ok: false, reason: 'storage-unavailable' };
      }
      return { ok: true };
    }
    function claimReward(id) {
      refresh(['pass', 'profile']);
      const definition = (definitions.rewards || []).find(reward => reward.id === id);
      if (!definition) return { ok: false, reason: 'unknown-reward' };
      if (records.pass.claimedRewardIds.includes(id)) return { ok: false, reason: 'already-claimed' };
      if (!Number.isInteger(definition.level) || records.pass.level < definition.level) return { ok: false, reason: 'locked' };
      if (!['badge', 'title', 'collectible'].includes(definition.type) || typeof definition.awardId !== 'string' || !definition.awardId) return { ok: false, reason: 'invalid-reward-definition' };
      if (blocked.has('pass') || blocked.has('profile')) return { ok: false, reason: 'future-schema-read-only' };
      if (unwritable.has('pass') || unwritable.has('profile')) return { ok: false, reason: 'stored-data-read-only' };
      const priorPassState = structuredCopy(records.pass);
      const priorProfileState = structuredCopy(records.profile);
      records.pass.claimedRewardIds.push(id);
      records.profile.rewardClaims[id] = timestamp();
      const collection = definition.type === 'badge' ? 'badges' : definition.type === 'title' ? 'titles' : 'collectibles';
      if (!records.pass[collection]) records.pass[collection] = [];
      if (!records.profile[collection].includes(definition.awardId)) records.profile[collection].push(definition.awardId);
      if (definition.type === 'badge' && !records.pass.badges.includes(definition.awardId)) records.pass.badges.push(definition.awardId);
      if (definition.type === 'collectible' && !records.pass.collectibles.some(item => item.id === definition.awardId && item.count > 0)) {
        records.pass.collectibles.push({ id: definition.awardId, count: 1 });
      }
      if (definition.type === 'title' && !records.profile.selectedTitle) records.profile.selectedTitle = definition.awardId;
      if (!saveMany(['pass', 'profile'])) {
        records.pass = priorPassState;
        records.profile = priorProfileState;
        return { ok: false, reason: 'storage-unavailable' };
      }
      return { ok: true, id };
    }
    function selectProfileReward(type, awardId) {
      // Cosmetic selection only. Read current ownership and mutate one profile
      // field; never call grant(), claimReward(), saveMany() or another store.
      if (!['badge', 'title'].includes(type) || (awardId !== null && (typeof awardId !== 'string' || !awardId))) {
        return { ok: false, reason: 'invalid-selection' };
      }
      if (!suppliedStorage) return { ok: false, reason: 'browser-storage-required' };
      const observed = {};
      for (const name of ['pass', 'profile']) {
        try { observed[name] = storage.getItem(KEYS[name]); }
        catch (_) { unwritable.add(name); persistent = false; return { ok: false, reason: 'stored-data-read-only' }; }
        const next = read(name, { raw: observed[name] });
        if (!blocked.has(name) && !unwritable.has(name)) records[name] = next;
      }
      const view = profileShowcaseView(getSnapshot(), definitions);
      if (!view.available) return { ok: false, reason: 'stored-data-read-only' };
      const group = view.groups[type];
      if (awardId !== null && !group.earned.some(item => item.awardId === awardId)) return { ok: false, reason: 'not-earned' };
      let original;
      try { original = observed.profile == null || observed.profile === '' ? null : JSON.parse(observed.profile); }
      catch (_) { return { ok: false, reason: 'stored-data-read-only' }; }
      if (original && original.schemaVersion !== VERSION) return { ok: false, reason: 'stored-data-read-only' };
      const field = type === 'badge' ? 'selectedBadge' : 'selectedTitle';
      const previous = original && original[field] != null ? original[field] : null;
      if (previous === awardId) return { ok: true, changed: false, type, awardId };
      // An absent/reset profile cannot acquire an earned marker from stale memory.
      if (!original) return { ok: false, reason: 'not-earned' };
      const next = structuredCopy(original);
      next[field] = awardId;
      next.updatedAt = timestamp();
      const encoded = JSON.stringify(next);
      try {
        // Best-effort stale-read guard, not a claim of cross-tab transactions.
        if (storage.getItem(KEYS.pass) !== observed.pass || storage.getItem(KEYS.profile) !== observed.profile) {
          refreshFromStorage();
          return { ok: false, reason: 'state-changed' };
        }
        storage.setItem(KEYS.profile, encoded);
        if (storage.getItem(KEYS.profile) !== encoded) {
          // Never roll back over a newer tab's write or recreate a reset record.
          refreshFromStorage();
          return { ok: false, reason: 'save-unverified' };
        }
      } catch (_) {
        persistent = false;
        diagnostics.push({ key: KEYS.profile, kind: 'showcase-save-failed' });
        return { ok: false, reason: 'storage-unavailable' };
      }
      records.profile = read('profile', { raw: encoded });
      persistent = suppliedStorage && !blocked.size && !unwritable.size;
      lastReset = null;
      return { ok: true, changed: true, type, awardId };
    }
    function recordLocalScore(input) {
      refresh(['profile']);
      const score = normalizeScore(input && input.score);
      if (!input || input.gameId !== 'wicked-bites' || score === null) return { ok: false, reason: 'invalid-score-record' };
      if (blocked.has('profile')) return { ok: false, reason: 'future-schema-read-only' };
      if (unwritable.has('profile')) return { ok: false, reason: 'stored-data-read-only' };
      const before = structuredCopy(records.profile);
      const previous = records.profile.localScores['wicked-bites'] || { best: null, runs: [] };
      const run = { score, completedAt: timestamp(), mode: null, ruleset: null, characterId: null };
      const runs = previous.runs.concat(run).slice(-MAX_LOCAL_RUNS);
      records.profile.localScores['wicked-bites'] = {
        best: Math.max(previous.best || 0, score),
        runs
      };
      if (!save('profile')) { records.profile = before; return { ok: false, reason: 'storage-unavailable' }; }
      return { ok: true, gameId: input.gameId, score, personalBest: previous.best === null || score > previous.best, runCount: runs.length };
    }
    function recordLocalHighScore(input) {
      const score = normalizeScore(input && input.score);
      if (!input || input.gameId !== 'wicked-bites' || score === null) return { ok: false, reason: 'invalid-score-record' };
      refresh(['profile']);
      if (blocked.has('profile')) return { ok: false, reason: 'future-schema-read-only' };
      const previous = records.profile.localScores['wicked-bites'];
      if (previous && previous.best >= score) return { ok: false, reason: 'not-a-personal-best' };
      const result = recordLocalScore({ gameId: input.gameId, score });
      return result.ok ? { ok: true, gameId: input.gameId, score } : result;
    }
    function claimDaily() {
      refresh(['quests', 'pass']);
      const config = definitions.dailyCheckIn;
      if (!config || !config.enabled || config.period !== 'UTC-day') return { ok: false, reason: 'not-configured' };
      if (blocked.has('quests') || blocked.has('pass')) return { ok: false, reason: 'future-schema-read-only' };
      const period = utcDay(timestamp());
      if (records.quests.dailyClaimedPeriod === period) return { ok: false, reason: 'already-claimed' };
      const priorQuestState = structuredCopy(records.quests);
      const priorPassState = structuredCopy(records.pass);
      const prior = records.pass.streak.lastQualifiedPeriod;
      const priorDate = prior ? new Date(prior + 'T00:00:00.000Z') : null;
      const thisDate = new Date(period + 'T00:00:00.000Z');
      const difference = priorDate && !Number.isNaN(priorDate.getTime()) ? Math.round((thisDate - priorDate) / 86400000) : null;
      records.pass.streak.count = difference === 1 ? records.pass.streak.count + 1 : (difference === 0 ? Math.max(1, records.pass.streak.count) : 1);
      records.pass.streak.lastQualifiedPeriod = period;
      records.quests.dailyClaimedPeriod = period;
      grant(config);
      if (!saveMany(['quests', 'pass'])) {
        records.quests = priorQuestState;
        records.pass = priorPassState;
        return { ok: false, reason: 'storage-unavailable' };
      }
      return { ok: true, period };
    }
    function getHomeInteractionState() {
      refresh(['discoveries']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries')) state.readOnly = true;
      return structuredCopy(state);
    }
    function writeHomeInteraction(next) {
      if (blocked.has('discoveries') || next.readOnly) return false;
      const previous = structuredCopy(records.discoveries);
      records.discoveries.homeInteraction = next;
      if (save('discoveries')) return true;
      records.discoveries = previous;
      return false;
    }
    function collectHomeCandy(id) {
      refresh(['discoveries', 'pass', 'quests']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries') || state.readOnly) return { ok: false, reason: state.readOnlyReason || 'future-schema-read-only', state };
      if (!HOME_CANDY_IDS.includes(id)) return { ok: false, reason: 'unknown-candy', state };
      const definition = (definitions.treats || []).find(treat => treat.id === id);
      if (!definition || !treatCollectibleId(definition)) return { ok: false, reason: 'treat-not-configured', state };
      if (id === 'golden-block-candy' && !state.goldenBlock.complete) return { ok: false, reason: 'locked', state };
      if (state.candies.includes(id)) return { ok: false, reason: 'already-collected', state };
      if (blocked.has('pass') || blocked.has('quests')) return { ok: false, reason: 'future-schema-read-only', state };
      if (unwritable.has('pass') || unwritable.has('quests') || unwritable.has('discoveries')) return { ok: false, reason: 'stored-data-read-only', state };
      const priorDiscoveryState = structuredCopy(records.discoveries);
      const priorPassState = structuredCopy(records.pass);
      const priorQuestState = structuredCopy(records.quests);
      state.candies.push(id);
      records.discoveries.homeInteraction = state;
      const collectibleId = treatCollectibleId(definition);
      if (!records.pass.collectibles.some(item => item.id === collectibleId && item.count > 0)) records.pass.collectibles.push({ id: collectibleId, count: 1 });
      records.pass.treats = treatTotal(records.pass.collectibles);
      applyTreatQuestEvent(id);
      if (saveMany(['discoveries', 'pass', 'quests'])) return { ok: true, state: getHomeInteractionState() };
      records.discoveries = priorDiscoveryState;
      records.pass = priorPassState;
      records.quests = priorQuestState;
      return { ok: false, reason: 'storage-unavailable', state: getHomeInteractionState() };
    }
    function reconcileHomeTreats() {
      refresh(['discoveries', 'pass', 'quests']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (state.readOnly || blocked.has('discoveries') || blocked.has('pass') || blocked.has('quests')) {
        return { ok: false, reason: state.readOnlyReason || 'future-schema-read-only', migrated: 0 };
      }
      if (unwritable.has('discoveries') || unwritable.has('pass') || unwritable.has('quests')) {
        return { ok: false, reason: 'stored-data-read-only', migrated: 0 };
      }
      const prior = {
        discoveries: structuredCopy(records.discoveries),
        pass: structuredCopy(records.pass),
        quests: structuredCopy(records.quests)
      };
      let migrated = 0;
      for (const id of state.candies) {
        const definition = (definitions.treats || []).find(treat => treat.id === id);
        if (!definition) continue;
        const collectibleId = treatCollectibleId(definition);
        if (!records.pass.collectibles.some(item => item.id === collectibleId && item.count > 0)) {
          records.pass.collectibles.push({ id: collectibleId, count: 1 });
          migrated += 1;
        }
        applyTreatQuestEvent(id);
      }
      records.pass.collectibles = normalizeCollectibles(records.pass.collectibles);
      records.pass.treats = treatTotal(records.pass.collectibles);
      if (!migrated && records.pass.treats === prior.pass.treats && records.quests.processedEventIds.length === prior.quests.processedEventIds.length) {
        return { ok: true, migrated: 0 };
      }
      if (saveMany(['discoveries', 'pass', 'quests'])) return { ok: true, migrated };
      records.discoveries = prior.discoveries;
      records.pass = prior.pass;
      records.quests = prior.quests;
      return { ok: false, reason: 'storage-unavailable', migrated: 0 };
    }
    function hitGoldenBlock() {
      refresh(['discoveries']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries') || state.readOnly) return { ok: false, reason: state.readOnlyReason || 'future-schema-read-only', state };
      if (state.goldenBlock.complete) return { ok: false, reason: 'already-broken', state };
      state.goldenBlock.hits += 1;
      if (state.goldenBlock.hits === 4) {
        state.goldenBlock.complete = true;
      }
      return writeHomeInteraction(state)
        ? { ok: true, state: getHomeInteractionState() }
        : { ok: false, reason: 'storage-unavailable', state: getHomeInteractionState() };
    }
    function clear() {
      // localStorage has no multi-key transaction. Report what was actually
      // observed, not an invented all-or-nothing reset or a blank fallback.
      const names = Object.keys(KEYS);
      const failedKeys = [], clearedKeys = [], retainedKeys = [], unverifiedKeys = [];
      for (const name of names) {
        try { storage.removeItem(KEYS[name]); }
        catch (error) {
          failedKeys.push(KEYS[name]);
          diagnostics.push({ key: KEYS[name], kind: 'clear-failed', message: String(error && error.message || error) });
        }
      }
      const fresh = emptyRecords(timestamp());
      for (const name of names) {
        let raw;
        try { raw = storage.getItem(KEYS[name]); }
        catch (error) {
          // Keep the last-readable in-memory value, explicitly unverified and
          // unwritable. A failed read must not impersonate empty saved data.
          unverifiedKeys.push(KEYS[name]);
          unwritable.add(name);
          diagnostics.push({ key: KEYS[name], kind: 'clear-readback-failed', message: String(error && error.message || error) });
          continue;
        }
        blocked.delete(name);
        unwritable.delete(name);
        if (raw === null) {
          clearedKeys.push(KEYS[name]);
          records[name] = fresh[name];
        } else {
          retainedKeys.push(KEYS[name]);
          // Normalize the exact observed value without a second storage read;
          // retained future/corrupt records keep their normal read-only guards.
          records[name] = read(name, { raw });
          diagnostics.push({ key: KEYS[name], kind: 'clear-not-removed' });
        }
      }
      const ok = failedKeys.length === 0 && retainedKeys.length === 0 && unverifiedKeys.length === 0;
      lastReset = { ok, scope: suppliedStorage ? 'browser' : 'page-only', clearedKeys, retainedKeys, unverifiedKeys, failedKeys };
      persistent = suppliedStorage && ok;
      lastRefresh = null;
      refreshReadFailed = false;
      return getSnapshot();
    }
      return { getSnapshot, refreshFromStorage, recordEvent, discoverCharacter, claimDaily, claimQuest, claimReward, selectProfileReward, recordLocalScore, recordLocalHighScore, getHomeInteractionState, collectHomeCandy, reconcileHomeTreats, hitGoldenBlock, clear };
  }

  function validProfileMarkerShape(value) {
    const object = v => v && typeof v === 'object' && !Array.isArray(v);
    const list = v => Array.isArray(v) && v.every(id => typeof id === 'string' && id.length > 0);
    if (!object(value)) return false;
    for (const key of ['badges', 'titles']) if (Object.prototype.hasOwnProperty.call(value, key) && !list(value[key])) return false;
    for (const key of ['selectedBadge', 'selectedTitle']) {
      if (Object.prototype.hasOwnProperty.call(value, key) && value[key] !== null && typeof value[key] !== 'string') return false;
    }
    return !Object.prototype.hasOwnProperty.call(value, 'rewardClaims') || object(value.rewardClaims);
  }
  function profileShowcaseView(snapshot, definitions = defaultDefinitions) {
    const unavailable = reason => ({ available: false, reason, groups: {},
      message: reason === 'temporary' ? 'Saved showcase is unavailable in this tab. Browser storage is required; no saved badge or title is inferred.' :
        'Saved showcase is unavailable or inconsistent. Its records are not overwritten, and no earned or selected marker is inferred.' });
    const state = snapshot, storage = state && state.storage;
    if (!storage || storage.scope !== 'browser') return unavailable('temporary');
    if (!Array.isArray(storage.readOnlyKeys) || [KEYS.profile, KEYS.pass].some(key => storage.readOnlyKeys.includes(key))) return unavailable('read-only');
    if (!state.pass || !validProfileMarkerShape(state.profile) || !Array.isArray(state.pass.claimedRewardIds) || !Array.isArray(state.rewards)) return unavailable('invalid');
    const groups = {};
    const ids = new Set(), awards = new Set();
    const configured = Array.isArray(definitions && definitions.rewards) ? definitions.rewards : [];
    for (const reward of configured) {
      if (!reward || !['badge', 'title'].includes(reward.type)) continue;
      const key = reward.type + ':' + reward.awardId;
      if (typeof reward.id !== 'string' || !reward.id || typeof reward.awardId !== 'string' || !reward.awardId ||
          ids.has(reward.id) || awards.has(key)) return unavailable('configuration');
      ids.add(reward.id); awards.add(key);
    }
    for (const type of ['badge', 'title']) {
      const list = type === 'badge' ? 'badges' : 'titles';
      const field = type === 'badge' ? 'selectedBadge' : 'selectedTitle';
      const owned = state.profile[list] || [], earned = [];
      for (const definition of configured.filter(item => item && item.type === type)) {
        const reward = state.rewards.find(item => item.id === definition.id);
        if (!reward || reward.type !== type || reward.awardId !== definition.awardId) return unavailable('configuration');
        const claimed = state.pass.claimedRewardIds.includes(definition.id);
        const hasMarker = owned.includes(definition.awardId);
        const claim = state.profile.rewardClaims && state.profile.rewardClaims[definition.id];
        const timestamp = typeof claim === 'string' && !Number.isNaN(Date.parse(claim)) && new Date(claim).toISOString() === claim;
        if (claimed || hasMarker || claim != null) {
          if (!claimed || !hasMarker || !timestamp || reward.claimed !== true) return unavailable('inconsistent-claim');
          if (reward.unlocked && Number.isInteger(definition.level) && definition.level <= state.pass.level) {
            earned.push({ awardId: definition.awardId, rewardId: definition.id, title: definition.title || definition.awardId });
          }
        }
      }
      const rawSelected = state.profile[field] == null || state.profile[field] === '' ? null : state.profile[field];
      const selected = earned.find(item => item.awardId === rawSelected) || null;
      groups[type] = { type, earned, selected, rawSelected, invalidSelection: rawSelected !== null && !selected,
        display: selected ? selected.title : rawSelected !== null ? 'Saved selection is not an earned configured ' + type : 'No ' + type + ' displayed' };
    }
    return { available: true, reason: null, groups, message: 'Choose a claimed website-local marker. Saving or hiding it does not grant, spend or remove rewards.' };
  }
  function showcaseResultMessage(result) {
    if (result.ok) return result.changed
      ? result.awardId === null ? 'Displayed ' + result.type + ' removed. Your earned rewards are unchanged.' : 'Your ' + result.type + ' selection was saved in this browser.'
      : 'That selection is already saved. No progress or rewards changed.';
    if (result.reason === 'not-earned') return 'This marker is not currently an earned, claimed website reward. Nothing was selected.';
    if (result.reason === 'state-changed') return 'Saved progress changed in another tab. Review the current showcase and try again; no stale selection was written.';
    if (result.reason === 'save-unverified') return 'The selection could not be verified after saving. Current readable data is shown; a newer change or reset was not overwritten.';
    if (result.reason === 'stored-data-read-only' || result.reason === 'browser-storage-required') return 'Saved profile or reward data cannot be read safely. No selection was saved; restore browser storage access and retry.';
    return 'Your selection could not be saved. The previous selection is retained; check browser storage and retry.';
  }
  function renderProfileShowcase(page, snapshot, onSelect) {
    const panel = page.querySelector('[data-profile-showcase]');
    if (!panel) return;
    const view = profileShowcaseView(snapshot);
    panel.setAttribute('data-showcase-state', view.available ? 'available' : 'unavailable');
    const feedback = panel.querySelector('[data-showcase-status]');
    const fingerprint = JSON.stringify(view);
    if (feedback && panel.__showcaseFingerprint !== fingerprint) feedback.textContent = view.message;
    panel.__showcaseFingerprint = fingerprint;
    for (const type of ['badge', 'title']) {
      const group = panel.querySelector('[data-showcase-group="' + type + '"]');
      if (!group) continue;
      const current = group.querySelector('[data-showcase-current]');
      const select = group.querySelector('[data-showcase-select]');
      const button = group.querySelector('[data-showcase-save]');
      const note = group.querySelector('[data-showcase-note]');
      if (!select || !button) continue;
      const value = view.available ? view.groups[type] : null;
      if (current) current.textContent = value ? value.display : 'Unavailable';
      if (note) note.textContent = !value ? 'Saved ownership cannot be checked. No empty collection is assumed.' : value.invalidSelection
        ? 'The saved selection is not displayed. Choose an earned marker or save No ' + type + ' displayed to remove this selection only.'
        : value.earned.length ? value.earned.length + ' claimed ' + (type === 'badge' ? 'badge' : 'title') + (value.earned.length === 1 ? '' : 's') + ' available here.'
        : 'No claimed ' + (type === 'badge' ? 'badges' : 'titles') + ' yet. Visit Rewards to see the existing unlock and claim requirements.';
      const oldDraft = select.value;
      const options = value ? value.earned : [];
      const signature = JSON.stringify(options);
      if (select.__showcaseOptions !== signature) {
        select.textContent = '';
        const none = page.ownerDocument.createElement('option'); none.value = ''; none.textContent = 'No ' + type + ' displayed'; select.appendChild(none);
        for (const item of options) {
          const option = page.ownerDocument.createElement('option'); option.value = item.awardId; option.textContent = item.title; select.appendChild(option);
        }
        select.__showcaseOptions = signature;
      }
      const stored = value && value.rawSelected || '';
      const validDraft = oldDraft === '' || options.some(item => item.awardId === oldDraft);
      const unchangedStored = select.__showcaseStored === stored && select.__showcaseAvailable === view.available;
      select.value = unchangedStored && validDraft ? oldDraft : value && value.selected ? value.selected.awardId : '';
      select.__showcaseStored = stored;
      select.__showcaseAvailable = view.available;
      select.disabled = !view.available;
      const updateButton = () => {
        button.disabled = !view.available || select.value === stored;
        button.setAttribute('aria-disabled', String(button.disabled));
      };
      select.onchange = updateButton;
      updateButton();
      button.onclick = () => onSelect(type, select.value || null);
    }
  }

  function boot(document, root) {
    if (!document || !document.querySelectorAll) return;
    const roots = document.querySelectorAll('[data-progression-page]');
    // A repeated script/boot must not replay writes or install duplicate listeners.
    if (roots.length && Array.from(roots).every(page => page.__toadalProgressionBooted)) return;
    const refreshRenderers = [];
    let browserStorage;
    try { browserStorage = root && root.localStorage; } catch (_) { browserStorage = undefined; }
    const store = createStore({ storage: browserStorage });
    store.reconcileHomeTreats();
    const path = normalizePath(root && root.location && root.location.pathname || '/', definitionsForRuntime());
    store.recordEvent('route:' + path);
    roots.forEach(page => {
      if (page.__toadalProgressionBooted) return;
      page.__toadalProgressionBooted = true;
      const status = page.querySelector('[data-progression-storage-status]');
      const setStatus = text => { if (status) status.textContent = text; };
      let renderedPeriod = null;
      function render() {
        const state = store.getSnapshot();
        renderedPeriod = state.daily.period;
        const showcase = profileShowcaseView(state);
        const title = showcase.available && showcase.groups.title.selected;
        const values = { level: state.pass.level, xp: state.pass.xp, 'xp-to-next': state.xpToNext == null ? '—' : state.xpToNext, sparks: state.pass.sparks, treats: state.pass.treats, streak: state.pass.streak.count, discoveries: state.discoveries.length, 'quests-complete': state.questsComplete,
          'route-visits': state.discoveries.filter(item => item.routeVisit).length,
          'character-discoveries': state.characterDiscoveries.length, 'selected-title': !showcase.available ? 'Unavailable' : title ? title.title : showcase.groups.title.rawSelected ? 'Unavailable saved title' : 'No title selected' };
        page.querySelectorAll('[data-progression-stat]').forEach(el => { const key = el.getAttribute('data-progression-stat'); if (Object.prototype.hasOwnProperty.call(values, key)) el.textContent = String(values[key]); });
        renderProfileShowcase(page, state, (type, awardId) => {
          const result = store.selectProfileReward(type, awardId);
          render();
          const message = page.querySelector('[data-showcase-status]');
          if (message) message.textContent = showcaseResultMessage(result);
        });
        renderQuestJourney(page, state, id => {
          const result = store.claimQuest(id);
          render();
          // The operation result follows rendering so a storage warning cannot
          // turn an unsuccessful claim into an apparent success.
          setStatus(result.ok ? 'Quest reward claimed in this browser.' :
            result.reason === 'already-claimed' ? 'This quest reward was already claimed. No additional reward was granted.' :
            result.reason === 'incomplete' ? 'This activity is not complete yet. No reward was claimed.' :
            'Quest reward could not be saved. Check browser storage and retry; no successful claim is being reported.');
        }, root);
        const rewards = state.rewards.map(r => ({ id: r.id, title: r.title || r.name || r.id, detail: (r.description || 'Configured reward') + ' · Level ' + r.level + ' · Website-local, non-transferable · ' + (r.claimed ? 'Claimed' : r.unlocked ? 'Ready to claim' : 'Locked'), button: r.claimed ? null : r.unlocked ? 'Claim locally' : null }));
        const milestones = state.milestones.map(m => ({ title: m.title, detail: 'Level ' + m.level + ' milestone · ' + (m.unlocked ? 'Reached' : 'Not reached yet') + ' · No item, entitlement, or transfer is included.' }));
        renderList(page, '[data-progression-reward-list]', rewards.concat(milestones), id => {
          const result = store.claimReward(id);
          render();
          setStatus(result.ok ? 'A website-local reward was added to this guest profile. Claimed badges and titles can be displayed in Your showcase.' :
            result.reason === 'already-claimed' ? 'This reward was already claimed in this browser.' : result.reason === 'locked' ? 'This reward is not available yet.' :
            'The reward could not be saved. No successful claim is being reported; check browser storage and retry.');
        });
        const discoveryItems = state.discoveries.filter(item => !item.characterId).map(item => ({ title: item.title, detail: item.description || 'A visit to a site preview; no lore or food item is implied.' }));
        const treatItems = state.treats.map(item => ({ title: item.title, detail: item.description + ' · Found · Saved in this browser' }));
        renderList(page, '[data-progression-discovery-list]', discoveryItems.concat(treatItems));
        renderList(page, '[data-progression-character-list]', state.characterDiscoveries.map(item => ({ title: item.title, detail: item.description })));
        page.querySelectorAll('[data-discover-character]').forEach(button => {
          const found = state.characterDiscoveries.some(item => item.characterId === button.getAttribute('data-discover-character'));
          const isButton = String(button.tagName || '').toLowerCase() === 'button';
          const isRoleButton = button.getAttribute('role') === 'button';
          if (isButton) {
            button.disabled = found;
            button.setAttribute('aria-disabled', String(found));
            button.textContent = found ? 'Artwork discovered' : 'Discover this character artwork';
          } else if (isRoleButton) {
            if (!button.hasAttribute('tabindex')) button.setAttribute('tabindex', '0');
            button.setAttribute('aria-disabled', String(found));
          }
        });
        page.querySelectorAll('[data-character-discovery-status]').forEach(node => {
          const found = state.characterDiscoveries.some(item => item.characterId === node.getAttribute('data-character-discovery-status'));
          node.textContent = found ? 'Discovered in this browser' : 'Not discovered in this browser';
        });
        const profileItems = [];
        state.treats.forEach(item => profileItems.push({ title: item.title, detail: item.description + ' · Treat · Website-local' }));
        ['badges', 'titles', 'collectibles'].forEach(type => (state.profile[type] || []).forEach(id => {
          const reward = state.rewards.find(item => item.awardId === id);
          profileItems.push({ title: reward ? reward.title : id, detail: type.slice(0, -1) + ' · Website-local, non-transferable' });
        }));
        renderList(page, '[data-progression-collection-list]', profileItems);
        renderList(page, '[data-progression-achievement-list]', (state.profile.badges || []).map(id => {
          const reward = state.rewards.find(item => item.type === 'badge' && item.awardId === id);
          return { title: reward ? reward.title : id, detail: 'Claimed website-local badge; not a game or connected achievement.' };
        }));
        const scoreItems = (state.localHighScores || []).map(item => ({
          title: item.gameId === 'wicked-bites' ? 'Wicked Bites personal best' : 'Local game personal best',
          detail: Number(item.score).toLocaleString() + ' points · saved in this browser · not a global rank or progression reward',
          href: '/leaderboards/?game=' + encodeURIComponent(item.gameId), button: 'View local leaderboard'
        }));
        renderList(page, '[data-progression-score-list]', scoreItems);
        renderGameRecords(page, state);
        const dailyStatus = page.querySelector('[data-daily-reward-status]');
        if (dailyStatus) dailyStatus.textContent = state.daily.enabled ? (state.daily.claimed ? 'Today’s UTC check-in is already claimed.' : 'A starter-config UTC-day check-in is available. Progress is local to this browser.') : 'No daily check-in is configured.';
        const dailyButton = page.querySelector('[data-claim-daily]');
        if (dailyButton) {
          const disabled = !state.daily.enabled || state.daily.claimed;
          dailyButton.disabled = disabled;
          dailyButton.setAttribute('aria-disabled', String(disabled));
          const label = !state.daily.enabled ? 'Daily check-in unavailable' : state.daily.claimed ? 'Already claimed today' : 'Claim daily check-in';
          const labelNode = dailyButton.querySelector && dailyButton.querySelector('[data-daily-claim-label]');
          if (labelNode) labelNode.textContent = label;
          else dailyButton.textContent = label;
          dailyButton.onclick = () => {
            const result = store.claimDaily();
            setStatus(result.ok ? 'UTC-day check-in claimed on this browser.' : result.reason === 'already-claimed' ? 'Today’s check-in was already claimed.' : 'Check-in is unavailable.');
            if (result.ok && root && root.dispatchEvent && root.CustomEvent) {
              root.dispatchEvent(new root.CustomEvent('toadal:daily-checkin-claimed', { detail: { period: result.period } }));
            }
            render();
          };
        }
        page.querySelectorAll('[data-daily-track-day]').forEach(day => {
          const number = Number(day.getAttribute('data-daily-track-day'));
          const completed = state.daily.claimed ? number <= state.daily.streakDay : number < state.daily.nextStreakDay;
          day.setAttribute('data-completed', String(completed));
          if (number === state.daily.nextStreakDay) day.setAttribute('aria-current', 'step');
          else day.removeAttribute('aria-current');
        });
        if (state.storage.lastRefresh && !state.storage.lastRefresh.ok) setStatus('Saved website progress could not be fully refreshed. Showing the last readable values; unreadable or newer data was not overwritten.');
        else if (!state.storage.persistent) setStatus('Browser storage is unavailable; progress may not persist after leaving this page.');
        else if (state.storage.diagnostics.length) setStatus('Guest progress is using safe local defaults; stored data could not be read or was outdated.');
        else if (status && !status.textContent) setStatus('Guest progress is stored only in this browser.');
      }
      page.querySelectorAll('[data-clear-progression]').forEach(button => button.addEventListener('click', () => {
        const state = store.clear();
        render();
        // Set the operation result after rendering so a generic storage notice
        // cannot hide an incomplete reset or claim a browser reset in memory mode.
        const reset = state.storage.lastReset;
        if (!reset.ok) setStatus('Reset could not be completed and verified. Some website progress may remain; displayed values are the last readable state. You can retry when browser storage is available. Other game and mobile data was not changed.');
        else if (reset.scope === 'page-only') setStatus('Only temporary progress in this tab was reset. Saved browser progress could not be verified because browser storage is unavailable. Other game and mobile data was not changed.');
        else setStatus('Website guest progression was cleared from this browser. Other game and mobile data was not changed.');
      }));
      function isNestedInteractiveTarget(target, control) {
        let current = target;
        while (current && current !== control) {
          const tag = String(current.tagName || '').toLowerCase();
          const role = current.getAttribute && current.getAttribute('role');
          if (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag) ||
              role === 'button' || role === 'link' || (current.hasAttribute && current.hasAttribute('contenteditable'))) return true;
          current = current.parentNode;
        }
        return false;
      }
      function discoverFromControl(control) {
        const characterId = control.getAttribute('data-discover-character');
        const alreadyFound = store.getSnapshot().characterDiscoveries.some(item => item.characterId === characterId);
        if (alreadyFound) return;
        const result = store.discoverCharacter(characterId);
        setStatus(result.ok ? 'Character artwork discovery saved in this browser. No game completion or reward is implied.' :
          result.reason === 'already-discovered' ? 'This artwork is already discovered in this browser.' : 'Character discovery could not be saved.');
        render();
      }
      page.querySelectorAll('[data-discover-character]').forEach(control => {
        control.addEventListener('click', event => {
          if (isNestedInteractiveTarget(event.target, control)) return;
          discoverFromControl(control);
        });
        control.addEventListener('touchend', event => {
          if (isNestedInteractiveTarget(event.target, control)) return;
          discoverFromControl(control);
        }, { passive: true });
        if (control.getAttribute('role') === 'button' && String(control.tagName || '').toLowerCase() !== 'button') {
          control.addEventListener('keydown', event => {
            if (isNestedInteractiveTarget(event.target, control)) return;
            if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
            if (event.preventDefault) event.preventDefault();
            discoverFromControl(control);
          });
        }
      });
      page.querySelectorAll('[data-site-motion-toggle]').forEach(input => {
        input.checked = Boolean(document.documentElement && document.documentElement.hasAttribute('data-site-reduced-motion'));
        input.addEventListener('change', () => {
          if (document.documentElement) document.documentElement.toggleAttribute('data-site-reduced-motion', input.checked);
          setStatus(input.checked ? 'Site CSS animations reduced in this tab. Operating-system reduced motion remains respected.' :
            'Tab-only CSS animation preference cleared. Operating-system reduced motion remains respected.');
        });
      });
      render();
      page.__toadalProgressionStore = store;
      refreshRenderers.push(state => {
        const refreshed = state.storage.lastRefresh;
        // Keep focus/list nodes and operation messages intact on no-op focus.
        if (!refreshed.changed && renderedPeriod === state.daily.period) return;
        render();
        if (!refreshed.ok) return; // render keeps the refresh warning above.
        if (refreshed.scope === 'browser' && refreshed.changed) {
          setStatus(state.storage.persistent
            ? 'Saved website progress refreshed from this browser. Progress remains browser-local, not account-synced.'
            : 'Saved website progress was refreshed, but browser writes may still be unavailable. No account synchronization is implied.');
        }
      });
    });
    if (refreshRenderers.length && root && typeof root.addEventListener === 'function') {
      const refreshViews = () => {
        const state = store.refreshFromStorage();
        refreshRenderers.forEach(render => render(state));
      };
      root.addEventListener('storage', event => {
        // Ignore other games/preferences, sessionStorage and unbound events.
        // Read current storage instead of trusting a delayed event.newValue.
        if (!browserStorage || event.storageArea !== browserStorage ||
            (event.key !== null && !Object.values(KEYS).includes(event.key))) return;
        refreshViews();
      });
      root.addEventListener('pageshow', event => { if (event.persisted) refreshViews(); });
      root.addEventListener('focus', refreshViews);
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') refreshViews();
        });
      }
    }
  }

  // Presentation only. The existing store remains the sole quest/claim authority.
  const QUEST_FILTERS = Object.freeze(['all', 'active', 'ready', 'claimed']);
  function questDestination(quest, definitions) {
    const href = quest && (quest.href || quest.route);
    if (typeof href !== 'string' || !/^\/(?!\/)/.test(href) || /[\\\s%?]/.test(href)) return null;
    const parts = href.split('#');
    if (parts.length > 2 || (parts.length === 2 && !/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(parts[1]))) return null;
    const routes = ['/', ...((definitions && definitions.knownSiteRoutes) || [])];
    return routes.includes(parts[0]) ? href : null;
  }
  function questJourneyView(snapshot, definitions = defaultDefinitions) {
    const storage = snapshot && snapshot.storage;
    const unavailable = reason => ({
      available: false, reason, rows: [], counts: { all: null, active: null, ready: null, claimed: null },
      next: { kind: 'unavailable', title: 'Quest progress is unavailable',
        description: reason === 'temporary'
          ? 'This tab cannot read saved browser progress. A multi-page quest journey cannot be retained here.'
          : 'Quest progress cannot be read safely. No empty or completed state is substituted, and stored records are left untouched.',
        label: 'Open Support', href: '/support/' }
    });
    if (!storage || !Array.isArray(storage.readOnlyKeys) || !Array.isArray(snapshot.quests)) return unavailable('invalid');
    if (storage.scope !== 'browser') return unavailable('temporary');
    if ([KEYS.quests, KEYS.pass].some(key => storage.readOnlyKeys.includes(key))) return unavailable('read-only');
    const rows = [];
    const ids = new Set();
    for (const quest of snapshot.quests) {
      if (!quest || typeof quest.id !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(quest.id) || ids.has(quest.id)) return unavailable('invalid');
      ids.add(quest.id);
      const daily = quest.dailyCheckIn === true;
      if (daily && !snapshot.daily?.enabled) continue;
      if (!Number.isSafeInteger(quest.progress) || quest.progress < 0 || !Number.isSafeInteger(quest.target) || quest.target <= 0 ||
          typeof quest.complete !== 'boolean' || quest.complete !== (quest.progress >= quest.target)) return unavailable('invalid');
      if (!daily && quest.claimedAt && (typeof quest.claimedAt !== 'string' || Number.isNaN(Date.parse(quest.claimedAt)) || new Date(quest.claimedAt).toISOString() !== quest.claimedAt)) return unavailable('invalid');
      if (daily && snapshot.daily.claimed !== quest.complete) return unavailable('invalid');
      const claimed = daily ? snapshot.daily.claimed === true : Boolean(quest.claimedAt);
      if (claimed && !quest.complete) return unavailable('invalid');
      const state = claimed ? 'claimed' : quest.complete ? 'ready' : 'active';
      const rewards = [];
      for (const [key, label] of [['xp', 'XP'], ['sparks', 'Sparks']]) {
        if (Number.isFinite(quest.reward?.[key]) && quest.reward[key] > 0) rewards.push(Math.floor(quest.reward[key]) + ' ' + label);
      }
      rows.push({ id: quest.id, title: quest.title || quest.id, description: quest.description || '',
        group: quest.group || 'exploration', state, daily, progress: quest.progress, target: quest.target,
        href: questDestination(quest, definitions), rewardText: rewards.length ? rewards.join(', ') : '',
        claimable: !daily && state === 'ready' });
    }
    const counts = { all: rows.length, active: 0, ready: 0, claimed: 0 };
    rows.forEach(row => counts[row.state]++);
    const ready = rows.find(row => row.claimable);
    const active = rows.find(row => row.state === 'active' && !row.daily && row.href);
    const daily = rows.find(row => row.state === 'active' && row.daily && row.href);
    let next;
    if (ready) next = { kind: 'ready', questId: ready.id, title: ready.title,
      description: 'Activity complete. Open the quest board to claim its configured website-local reward.',
      label: 'Review ready rewards', href: '/feast-pass/quests/?view=ready' };
    else if (active) next = { kind: 'active', questId: active.id, title: active.title,
      description: active.description + ' Return to Quests when it is complete; opening a link does not claim a reward.',
      label: active.group === 'exploration' ? 'Open activity' : 'View activity', href: active.href };
    else if (daily) next = { kind: 'daily', questId: daily.id, title: 'Daily check-in',
      description: 'The current UTC-day check-in is available. Open its existing claim control in Feast Pass.',
      label: 'Open daily check-in', href: daily.href };
    else if (counts.active || counts.ready) next = { kind: 'no-destination', title: 'An activity has no available destination',
      description: 'Your existing quest state is retained. No unavailable game or unpublished story is opened.',
      label: 'View quest board', href: '/feast-pass/quests/' };
    else next = { kind: 'complete', title: rows.length ? 'All current quest rewards claimed' : 'No quests are configured',
      description: rows.length ? 'Your configured website activities are claimed for this period. There is no extra completion reward. Explore the current game listings next.' : 'No new activities or rewards are invented. Existing game listings remain available.',
      label: 'Browse game listings', href: '/play/' };
    return { available: true, reason: null, rows, counts, next };
  }
  function renderQuestJourney(page, snapshot, onClaim, root) {
    const list = page.querySelector('[data-progression-quest-list]');
    const nextCard = page.querySelector('[data-quest-next]');
    if (!list && !nextCard) return;
    const view = questJourneyView(snapshot);
    if (nextCard) {
      nextCard.setAttribute('data-quest-next-state', view.next.kind);
      for (const key of ['title', 'description']) {
        const node = nextCard.querySelector('[data-quest-next-' + key + ']');
        if (node && node.textContent !== view.next[key]) node.textContent = view.next[key];
      }
      const link = nextCard.querySelector('[data-quest-next-link]');
      if (link) {
        link.textContent = view.next.label;
        link.setAttribute('href', siteHref(page.ownerDocument, view.next.href));
      }
    }
    if (!list) return;
    const document = page.ownerDocument;
    const priorFocus = document.activeElement;
    const filterFromLocation = () => {
      try { const value = new URL(root.location.href).searchParams.get('view'); return QUEST_FILTERS.includes(value) ? value : 'all'; }
      catch (_) { return 'all'; }
    };
    if (!page.__questJourneyUI) {
      while (list.firstChild) list.removeChild(list.firstChild);
      list.setAttribute('role', 'list');
      const ui = page.__questJourneyUI = { rows: new Map(), filter: filterFromLocation(), snapshot, onClaim };
      page.querySelectorAll('[data-quest-filter]').forEach(button => {
        const filter = button.getAttribute('data-quest-filter');
        if (!QUEST_FILTERS.includes(filter)) return;
        button.addEventListener('click', () => {
          ui.filter = filter;
          try { const url = new URL(root.location.href); url.searchParams.set('view', filter); root.history.replaceState(root.history.state, '', url.href); }
          catch (_) { /* Filtering remains usable when URL history is unavailable. */ }
          renderQuestJourney(page, ui.snapshot, ui.onClaim, root);
        });
      });
      if (root && typeof root.addEventListener === 'function') root.addEventListener('popstate', () => {
        ui.filter = filterFromLocation(); renderQuestJourney(page, ui.snapshot, ui.onClaim, root);
      });
    }
    const ui = page.__questJourneyUI;
    ui.snapshot = snapshot; ui.onClaim = onClaim;
    const filterLabels = { all: 'All quests', active: 'Active', ready: 'Ready to claim', claimed: 'Claimed' };
    page.querySelectorAll('[data-quest-filter]').forEach(button => {
      const filter = button.getAttribute('data-quest-filter');
      if (!QUEST_FILTERS.includes(filter)) return;
      button.setAttribute('aria-pressed', String(ui.filter === filter));
      if (!button.__questLabel) button.__questLabel = button.textContent;
      const count = view.available ? String(view.counts[filter]) : '—';
      button.setAttribute('data-quest-count', count);
      button.textContent = button.__questLabel + ' (' + count + ')';
    });
    const empty = page.querySelector('[data-quest-empty]');
    const summary = page.querySelector('[data-quest-summary]');
    const shown = view.rows.filter(row => ui.filter === 'all' || row.state === ui.filter);
    if (summary) {
      const message = view.available ? filterLabels[ui.filter] + ': ' + shown.length + ' of ' + view.counts.all + ' configured activities.' : 'Quest status unavailable; stored progress is not treated as empty.';
      if (summary.textContent !== message) summary.textContent = message;
    }
    if (empty) {
      empty.hidden = view.available && shown.length > 0;
      const message = !view.available ? view.next.description : {
        all: 'No quests are configured. No gameplay or story completion is inferred.',
        active: 'No active quests. Check Ready to claim for completed activities.',
        ready: 'No quest rewards are ready to claim. Open an active activity to continue.',
        claimed: 'No quest rewards claimed in this view yet. Completed activities become claimable first.'
      }[ui.filter];
      if (empty.textContent !== message) empty.textContent = message;
    }
    const stateLabels = { active: 'Active', ready: 'Ready to claim', claimed: 'Claimed' };
    const groupLabels = { daily: 'Daily', weekly: 'Weekly', exploration: 'Exploration', game: 'Game', story: 'Story' };
    const visible = new Set(shown.map(row => row.id));
    const valid = new Set(view.rows.map(row => row.id));
    for (const row of view.rows) {
      let item = ui.rows.get(row.id);
      if (!item) {
        const node = document.createElement('article');
        node.className = 'quest-card'; node.setAttribute('role', 'listitem'); node.setAttribute('data-quest-id', row.id);
        const make = (tag, cls) => { const el = document.createElement(tag); el.className = cls; node.appendChild(el); return el; };
        item = { node, title: make('h3','quest-card__title'), state: make('p','quest-card__state'),
          description: make('p','quest-card__description'), progress: make('p','quest-card__progress'),
          reward: make('p','quest-card__reward'), actions: make('div','quest-card__actions') };
        item.link = document.createElement('a'); item.link.className = 'button-link button-link--secondary';
        item.link.textContent = 'Open activity'; item.actions.appendChild(item.link);
        item.claim = document.createElement('button'); item.claim.type = 'button';
        item.claim.className = 'button-link button-link--primary'; item.claim.textContent = 'Claim quest reward';
        item.claim.setAttribute('data-quest-claim',row.id);
        item.claim.addEventListener('click', () => ui.onClaim(row.id)); item.actions.appendChild(item.claim);
        list.appendChild(node); ui.rows.set(row.id,item);
      }
      item.node.setAttribute('data-quest-state',row.state);
      item.title.textContent = row.title;
      item.state.textContent = (groupLabels[row.group] || 'Website') + ' · ' + stateLabels[row.state];
      item.description.textContent = row.daily ? 'One configured browser-local check-in per UTC day.' : row.description;
      item.progress.textContent = 'Progress: ' + row.progress + ' / ' + row.target;
      item.reward.textContent = row.daily ? 'Use the daily check-in control in Feast Pass; there is no second quest payout.' : row.rewardText ? 'Reward: ' + row.rewardText + ' · Website-local' : 'No additional reward is configured.';
      item.link.hidden = !row.href || row.state === 'claimed';
      item.link.textContent = row.daily ? 'Open daily check-in' : 'Open activity';
      if (row.href) item.link.setAttribute('href',siteHref(document,row.href));
      else item.link.removeAttribute('href');
      item.claim.hidden = !row.claimable;
      item.claim.disabled = !row.claimable;
      item.claim.setAttribute('aria-label','Claim quest reward: ' + row.title);
      item.node.hidden = !visible.has(row.id);
    }
    for (const [id,item] of ui.rows) {
      if (!valid.has(id)) { item.node.hidden = true; item.claim.disabled = true; item.claim.hidden = true; }
    }
    // A claimed row can leave the selected filter. Keep keyboard users in the
    // quest controls instead of leaving focus in a hidden/disabled subtree.
    const focused = priorFocus;
    if (focused && typeof focused.closest === 'function' &&
        (focused.closest('[data-quest-id][hidden]') || (focused.hasAttribute('data-quest-claim') && focused.disabled))) {
      const button = page.querySelector('[data-quest-filter="' + ui.filter + '"]');
      if (button && typeof button.focus === 'function') button.focus({ preventScroll: true });
    }
  }

  // Read model only: the existing host/store owns score admission and persistence.
  // A saved result is not a verified accomplishment, a build approval or a reward.
  function gameRecordView(snapshot, gameId) {
    const empty = { state: 'unavailable', best: null, latest: null, recentCount: null, recordedAt: null };
    if (gameId !== 'wicked-bites') return Object.assign({}, empty, { state: 'unsupported' });
    if (!snapshot || !snapshot.storage || !['browser', 'page-only'].includes(snapshot.storage.scope)) return empty;
    const storage = snapshot.storage;
    if (!Array.isArray(storage.readOnlyKeys) || storage.readOnlyKeys.includes(KEYS.profile)) return empty;
    const scores = snapshot.localScores;
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)) return empty;
    const own = Object.prototype.hasOwnProperty.call(scores, gameId);
    const record = own ? scores[gameId] : null;
    if (own && (!record || !validLocalScores({ 'wicked-bites': record }))) return empty;
    if (!record || !record.runs.length) {
      return Object.assign({}, empty, { state: storage.scope === 'page-only' ? 'temporary' : 'not-recorded' });
    }
    const latest = record.runs[record.runs.length - 1];
    return {
      state: storage.scope === 'page-only' ? 'temporary' : 'recorded',
      best: normalizeScore(record.best), latest: normalizeScore(latest.score),
      recentCount: record.runs.length, recordedAt: latest.completedAt
    };
  }
  function renderGameRecords(page, snapshot) {
    const labels = {
      'recorded': 'Saved results in this browser',
      'not-recorded': 'No saved results yet',
      'unsupported': 'Website score feed not connected',
      'unavailable': 'Saved results unavailable',
      'temporary': 'Temporary tab only; saved browser results unavailable'
    };
    const details = {
      'recorded': 'Best is from the saved record in this browser. Up to 50 recent results are kept, not a lifetime play count.',
      'not-recorded': 'No result saved here yet. Missing results are not zero scores or 0% completion.',
      'unsupported': 'No connected score or completion data. Check the listing for availability and controls.',
      'unavailable': 'Saved scores cannot be read safely. No zero is substituted; stored data is untouched.',
      'temporary': 'Temporary tab data only. Browser persistence and account synchronization are unavailable.'
    };
    page.querySelectorAll('[data-game-record]').forEach(card => {
      const view = gameRecordView(snapshot, card.getAttribute('data-game-record'));
      card.setAttribute('data-game-record-state', view.state);
      const values = {
        'state': labels[view.state], 'detail': details[view.state],
        'best': view.best === null ? '—' : view.best.toLocaleString('en-US'),
        'latest': view.latest === null ? '—' : view.latest.toLocaleString('en-US'),
        'recent-count': view.recentCount === null ? '—' : String(view.recentCount),
        'recorded-at': view.recordedAt ? view.recordedAt.slice(0, 10) + ' ' + view.recordedAt.slice(11, 16) + ' UTC' : 'Not available'
      };
      card.querySelectorAll('[data-game-record-field]').forEach(node => {
        const field = node.getAttribute('data-game-record-field');
        if (!Object.prototype.hasOwnProperty.call(values, field)) return;
        if (node.textContent !== values[field]) node.textContent = values[field];
        if (field === 'recorded-at') {
          if (view.recordedAt) node.setAttribute('datetime', view.recordedAt);
          else node.removeAttribute('datetime');
        }
      });
    });
  }

  function definitionsForRuntime() { return defaultDefinitions || {}; }
  function normalizePath(path, definitions) {
    let clean = String(path == null ? '/' : path).split(/[?#]/, 1)[0].replace(/\\/g, '/');
    clean = '/' + clean.split('/').filter(Boolean).join('/') + '/';
    if (clean === '//') clean = '/';
    const routes = [].concat((definitions && definitions.knownSiteRoutes) || [], (definitions && definitions.quests) || [], (definitions && definitions.discoveries) || [])
      .map(item => typeof item === 'string' ? item : item.route).filter(route => typeof route === 'string' && route.startsWith('/'))
      .sort((a, b) => b.length - a.length);
    const match = routes.find(route => clean === route || clean.endsWith(route));
    if (match) return match;
    const segments = clean.split('/').filter(Boolean);
    return segments.length <= 1 ? '/' : clean;
  }
  function siteHref(document, href) {
    if (typeof href !== 'string' || !/^\/(?!\/)/.test(href)) return href;
    const brand = document && document.querySelector && document.querySelector('.site-brand');
    const home = brand && (brand.getAttribute && brand.getAttribute('href') || brand.href);
    let base = '';
    try { if (home) base = new URL(home, document.baseURI || 'https://local.invalid/').pathname.replace(/\/+$/, ''); }
    catch (_) { /* Root hosting remains the safe default. */ }
    return base && href !== base && !href.startsWith(base + '/') ? base + href : href;
  }
  function renderList(page, selector, items, onClaim) {
    const container = page.querySelector(selector);
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    container.setAttribute('role', 'list');
    if (!items.length) {
      const empty = page.ownerDocument.createElement('div');
      empty.setAttribute('role', 'listitem');
      empty.textContent = selector.includes('reward') ? 'No claimable or entitlement rewards are configured.' : 'Nothing recorded yet.';
      container.appendChild(empty);
      return;
    }
    function appendItem(list, item) {
      const entry = page.ownerDocument.createElement('div');
      entry.setAttribute('role', 'listitem');
      const title = page.ownerDocument.createElement('strong'); title.textContent = item.title; entry.appendChild(title);
      const detail = page.ownerDocument.createElement('p'); detail.textContent = item.detail || ''; entry.appendChild(detail);
      if (item.href) { const link = page.ownerDocument.createElement('a'); link.href = siteHref(page.ownerDocument, item.href); link.textContent = item.button || 'Open'; entry.appendChild(link); }
      else if (item.button && onClaim) { const button = page.ownerDocument.createElement('button'); button.type = 'button'; button.textContent = item.button; button.addEventListener('click', () => onClaim(item.id)); entry.appendChild(button); }
      list.appendChild(entry);
    }
    if (items.some(item => item.group)) {
      const groups = new Map();
      items.forEach(item => {
        const group = item.group || 'other';
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(item);
      });
      groups.forEach((groupItems, group) => {
        const section = page.ownerDocument.createElement('section');
        section.setAttribute('role', 'group');
        section.setAttribute('aria-label', group.charAt(0).toUpperCase() + group.slice(1) + ' quests');
        const heading = page.ownerDocument.createElement('h3');
        heading.textContent = group.charAt(0).toUpperCase() + group.slice(1);
        section.appendChild(heading);
        const list = page.ownerDocument.createElement('div');
        list.setAttribute('role', 'list');
        groupItems.forEach(item => appendItem(list, item));
        section.appendChild(list);
        container.appendChild(section);
      });
    } else items.forEach(item => appendItem(container, item));
  }
  return { KEYS, createStore, boot, profileShowcaseView, renderProfileShowcase, showcaseResultMessage, normalizePath, siteHref, renderList, gameRecordView, renderGameRecords, questDestination, questJourneyView, renderQuestJourney };
});
