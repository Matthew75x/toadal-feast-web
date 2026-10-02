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
      const best = bounded.reduce((value, run) => Math.max(value, run.score), 0);
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
      return validRuns && state.best === state.runs.reduce((best, run) => Math.max(best, run.score), 0);
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

    function read(name) {
      let raw;
      try { raw = storage.getItem(KEYS[name]); }
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
      if (name === 'profile' && Object.prototype.hasOwnProperty.call(data, 'localScores') && !validLocalScores(data.localScores)) {
        unwritable.add(name);
        diagnostics.push({ key: KEYS[name], kind: 'invalid-score-state-read-only' });
      }
      blocked.delete(name);
      if (!(name === 'profile' && Object.prototype.hasOwnProperty.call(data, 'localScores') && !validLocalScores(data.localScores))) unwritable.delete(name);
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
        return definition ? { id, title: definition.title, description: definition.description || '' } : { id, title: 'Previously recorded discovery', description: '' };
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
        discoveries, treats, profile: structuredCopy(records.profile), localScores, localHighScores,
        rewards, milestones,
        xpToNext: configuredThreshold ? configuredThreshold - records.pass.xp % configuredThreshold : null,
        daily,
        questsComplete: quests.filter(q => q.complete).length,
        storage: { local: persistent, persistent, available: persistent, diagnostics: diagnostics.slice(), futureVersionKeys: Array.from(blocked).map(name => KEYS[name]) }
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
      for (const name of Object.keys(KEYS)) {
        try { storage.removeItem(KEYS[name]); }
        catch (error) { diagnostics.push({ key: KEYS[name], kind: 'clear-failed', message: String(error && error.message || error) }); }
      }
      const fresh = emptyRecords(timestamp());
      for (const name of Object.keys(KEYS)) records[name] = fresh[name];
      blocked.clear();
      unwritable.clear();
      return getSnapshot();
    }
      return { getSnapshot, recordEvent, claimDaily, claimQuest, claimReward, recordLocalScore, recordLocalHighScore, getHomeInteractionState, collectHomeCandy, reconcileHomeTreats, hitGoldenBlock, clear };
  }

  function boot(document, root) {
    if (!document || !document.querySelectorAll) return;
    let browserStorage;
    try { browserStorage = root && root.localStorage; } catch (_) { browserStorage = undefined; }
    const store = createStore({ storage: browserStorage });
    store.reconcileHomeTreats();
    const path = normalizePath(root && root.location && root.location.pathname || '/', definitionsForRuntime());
    store.recordEvent('route:' + path);
    const roots = document.querySelectorAll('[data-progression-page]');
    roots.forEach(page => {
      if (page.__toadalProgressionBooted) return;
      page.__toadalProgressionBooted = true;
      const status = page.querySelector('[data-progression-storage-status]');
      const setStatus = text => { if (status) status.textContent = text; };
      function render() {
        const state = store.getSnapshot();
      const values = { level: state.pass.level, xp: state.pass.xp, 'xp-to-next': state.xpToNext == null ? '—' : state.xpToNext, sparks: state.pass.sparks, treats: state.pass.treats, streak: state.pass.streak.count, discoveries: state.discoveries.length, 'quests-complete': state.questsComplete };
        page.querySelectorAll('[data-progression-stat]').forEach(el => { const key = el.getAttribute('data-progression-stat'); if (Object.prototype.hasOwnProperty.call(values, key)) el.textContent = String(values[key]); });
        const questGroups = { daily: 'Daily', weekly: 'Weekly', exploration: 'Exploration', game: 'Game', story: 'Story' };
        const questEmpty = {
          weekly: 'No weekly quests are configured. This preview has no weekly timer or reset.',
          game: 'No browser game quests are configured from published gameplay results.',
          story: 'No story quests are configured; unpublished chapters are not counted.'
        };
        const questItems = state.quests.map(q => {
          const reward = [];
          if (Number.isFinite(q.reward && q.reward.xp) && q.reward.xp > 0) reward.push(q.reward.xp + ' XP');
          if (Number.isFinite(q.reward && q.reward.sparks) && q.reward.sparks > 0) reward.push(q.reward.sparks + ' Sparks');
          const rewardText = reward.length ? ' · Reward: ' + reward.join(', ') : '';
          return { group: q.group || (q.dailyCheckIn ? 'daily' : 'exploration'), title: q.title, detail: q.description + ' ' + q.progress + '/' + q.target + rewardText + (q.complete ? (q.dailyCheckIn ? ' · Claimed today' : (q.claimedAt ? ' · Reward claimed' : ' · Complete')) : ''), id: q.id, href: q.href, button: q.complete && !q.claimedAt && !q.dailyCheckIn ? 'Claim quest reward' : (q.dailyCheckIn && !q.complete ? 'Open daily check-in' : null) };
        });
        Object.keys(questGroups).forEach(group => {
          if (!questItems.some(item => item.group === group) && questEmpty[group]) questItems.push({ group, title: 'No active quests', detail: questEmpty[group], empty: true });
        });
        questItems.sort((a, b) => Object.keys(questGroups).indexOf(a.group) - Object.keys(questGroups).indexOf(b.group));
        renderList(page, '[data-progression-quest-list]', questItems, id => {
          if (id === 'daily-check-in') { if (root && root.location) root.location.href = '/feast-pass/#daily-reward-title'; return; }
          const result = store.claimQuest(id); setStatus(result.ok ? 'Quest reward claimed.' : result.reason === 'already-claimed' ? 'This quest reward was already claimed.' : 'Quest reward is not available yet.'); render();
        });
        const rewards = state.rewards.map(r => ({ id: r.id, title: r.title || r.name || r.id, detail: (r.description || 'Configured reward') + ' · Level ' + r.level + ' · Website-local, non-transferable · ' + (r.claimed ? 'Claimed' : r.unlocked ? 'Ready to claim' : 'Locked'), button: r.claimed ? null : r.unlocked ? 'Claim locally' : null }));
        const milestones = state.milestones.map(m => ({ title: m.title, detail: 'Level ' + m.level + ' milestone · ' + (m.unlocked ? 'Reached' : 'Not reached yet') + ' · No item, entitlement, or transfer is included.' }));
        renderList(page, '[data-progression-reward-list]', rewards.concat(milestones), id => {
          const result = store.claimReward(id); setStatus(result.ok ? 'A website-local reward was added to this guest profile.' : result.reason === 'already-claimed' ? 'This reward was already claimed in this browser.' : 'This reward is not available yet.'); render();
        });
        const discoveryItems = state.discoveries.map(item => ({ title: item.title, detail: item.description || 'A visit to a site preview; no lore or food item is implied.' }));
        const treatItems = state.treats.map(item => ({ title: item.title, detail: item.description + ' · Found · Saved in this browser' }));
        renderList(page, '[data-progression-discovery-list]', discoveryItems.concat(treatItems));
        const profileItems = [];
        state.treats.forEach(item => profileItems.push({ title: item.title, detail: item.description + ' · Treat · Website-local' }));
        ['badges', 'titles', 'collectibles'].forEach(type => (state.profile[type] || []).forEach(id => {
          const reward = state.rewards.find(item => item.awardId === id);
          profileItems.push({ title: reward ? reward.title : id, detail: type.slice(0, -1) + ' · Website-local, non-transferable' });
        }));
        renderList(page, '[data-progression-collection-list]', profileItems);
        const scoreItems = (state.localHighScores || []).map(item => ({
          title: item.gameId === 'wicked-bites' ? 'Wicked Bites personal best' : 'Local game personal best',
          detail: Number(item.score).toLocaleString() + ' points · saved in this browser · not a global rank or progression reward',
          href: '/leaderboards/?game=' + encodeURIComponent(item.gameId), button: 'View local leaderboard'
        }));
        renderList(page, '[data-progression-score-list]', scoreItems);
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
        if (!state.storage.persistent) setStatus('Browser storage is unavailable; progress may not persist after leaving this page.');
        else if (state.storage.diagnostics.length) setStatus('Guest progress is using safe local defaults; stored data could not be read or was outdated.');
        else if (status && !status.textContent) setStatus('Guest progress is stored only in this browser.');
      }
      page.querySelectorAll('[data-clear-progression]').forEach(button => button.addEventListener('click', () => { store.clear(); setStatus('Website guest progression was cleared from this browser. Other game and mobile data was not changed.'); render(); }));
      render();
      page.__toadalProgressionStore = store;
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
      if (item.href) { const link = page.ownerDocument.createElement('a'); link.href = item.href; link.textContent = item.button || 'Open'; entry.appendChild(link); }
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
  return { KEYS, createStore, boot, normalizePath, renderList };
});
