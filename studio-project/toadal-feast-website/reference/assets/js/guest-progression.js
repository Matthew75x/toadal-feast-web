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
  const SCORE_HISTORY_LIMIT = 50;
  const SCORE_GAME_LIMIT = 24;
  const EVENT_HISTORY_LIMIT = 128;
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
      pass: { schemaVersion: VERSION, updatedAt: timestamp, level: 1, xp: 0, sparks: 0, treats: 0, streak: { count: 0, lastQualifiedPeriod: null }, badges: [], collectibles: [] },
      quests: { schemaVersion: VERSION, updatedAt: timestamp, items: {}, processedEventIds: [], dailyClaimedPeriod: null },
      discoveries: { schemaVersion: VERSION, updatedAt: timestamp, items: [], homeInteraction: emptyHomeInteraction() },
      profile: { schemaVersion: VERSION, updatedAt: timestamp, displayName: null, selectedBadge: null, selectedTitle: null, localScores: {} }
    };
  }
  function makeMemoryStorage() {
    const values = new Map();
    return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  }
  function safeInt(value, fallback, minimum) {
    return Number.isSafeInteger(value) && value >= minimum ? value : fallback;
  }
  function normalizeScore(value) {
    if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (text.length > 64 || !/^\d+$/.test(text)) return null;
    const decimal = text.replace(/^0+(?=\d)/, '');
    if (decimal.length > 16) return null;
    const score = Number(decimal);
    return Number.isSafeInteger(score) && score >= 0 ? score : null;
  }
  function validGameId(value) { return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,47}$/.test(value) && value !== 'constructor' && value !== 'prototype'; }
  function validToken(value, maximum) {
    return typeof value === 'string' && value.length > 0 && value.length <= maximum && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);
  }
  function validIsoTimestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString() === value;
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
    const futureVersions = new Set();
    const readOnlyReasons = new Map();
    const timestamp = () => isoNow(now);
    const defaults = emptyRecords(timestamp());
    const records = {};
    const treatsByInteraction = new Map((definitions.treats || []).filter(item => item && item.localOnly === true && item.entitlement === false && HOME_CANDY_IDS.includes(item.sourceInteractionId) && validToken(item.id, 64)).map(item => [item.sourceInteractionId, item]));
    const treatsById = new Map(Array.from(treatsByInteraction.values()).map(item => [item.id, item]));

    function blockRecord(name, reason, kind, details, future) {
      blocked.add(name);
      readOnlyReasons.set(name, reason);
      if (future) futureVersions.add(name);
      diagnostics.push(Object.assign({ key: KEYS[name], kind }, details || {}));
    }
    function normalizeCollectibles(value) {
      if (!Array.isArray(value)) return null;
      const normalized = new Map();
      for (const item of value) {
        if (!item || typeof item !== 'object' || Array.isArray(item) || !validToken(item.id, 64) || !Number.isSafeInteger(item.count) || item.count < 0) return null;
        if (Object.keys(item).some(key => key !== 'id' && key !== 'count')) return null;
        const treat = treatsById.has(item.id);
        const count = treat ? Math.min(1, item.count) : item.count;
        normalized.set(item.id, Math.max(normalized.get(item.id) || 0, count));
      }
      return Array.from(normalized, ([id, count]) => ({ id, count }));
    }
    function normalizeLocalScores(value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const gameIds = Object.keys(value);
      if (gameIds.length > SCORE_GAME_LIMIT) return null;
      const normalized = {};
      for (const gameId of gameIds) {
        const entry = value[gameId];
        if (!validGameId(gameId) || !entry || typeof entry !== 'object' || Array.isArray(entry) ||
            !Number.isSafeInteger(entry.best) || entry.best < 0 || !Array.isArray(entry.runs) || entry.runs.length < 1 || entry.runs.length > SCORE_HISTORY_LIMIT) return null;
        if (Object.keys(entry).some(key => key !== 'best' && key !== 'runs')) return null;
        const seenCompletionIds = new Set();
        const runs = [];
        for (const run of entry.runs) {
          if (!run || typeof run !== 'object' || Array.isArray(run) || !Number.isSafeInteger(run.score) || run.score < 0 ||
              !validIsoTimestamp(run.completedAt) || !validToken(run.completionId, 80) || seenCompletionIds.has(run.completionId)) return null;
          if (Object.keys(run).some(key => !['score', 'completedAt', 'mode', 'ruleset', 'characterId', 'completionId'].includes(key))) return null;
          seenCompletionIds.add(run.completionId);
          for (const field of ['mode', 'ruleset', 'characterId']) {
            if (run[field] !== null && !validToken(run[field], 64)) return null;
          }
          runs.push({
            score: run.score,
            completedAt: run.completedAt,
            mode: run.mode,
            ruleset: run.ruleset,
            characterId: run.characterId,
            completionId: run.completionId
          });
        }
        if (runs.some(run => run.score > entry.best)) return null;
        normalized[gameId] = { best: entry.best, runs };
      }
      return normalized;
    }

    function read(name) {
      let raw;
      try { raw = storage.getItem(KEYS[name]); }
      catch (error) { persistent = false; blockRecord(name, 'storage-read-unavailable', 'read-failed', { message: String(error && error.message || error) }); return structuredCopy(defaults[name]); }
      if (raw == null || raw === '') return structuredCopy(defaults[name]);
      let data;
      try { data = JSON.parse(raw); }
      catch (error) {
        blockRecord(name, 'invalid-stored-data-read-only', 'malformed-json', { message: String(error && error.message || error) });
        return structuredCopy(defaults[name]);
      }
      if (!data || typeof data !== 'object' || Array.isArray(data) || !Number.isInteger(data.schemaVersion)) {
        blockRecord(name, 'invalid-stored-data-read-only', 'invalid-record');
        return structuredCopy(defaults[name]);
      }
      if (data.schemaVersion > VERSION) {
        blockRecord(name, 'future-schema-read-only', 'future-version', { schemaVersion: data.schemaVersion }, true);
        return structuredCopy(defaults[name]);
      }
      const merged = Object.assign({}, defaults[name], data, { schemaVersion: VERSION });
      if (name === 'pass') {
        for (const field of ['level', 'xp', 'sparks', 'treats']) {
          if (Object.prototype.hasOwnProperty.call(data, field) && (!Number.isSafeInteger(data[field]) || data[field] < (field === 'level' ? 1 : 0))) {
            blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field });
            return structuredCopy(defaults[name]);
          }
        }
        merged.level = safeInt(merged.level, 1, 1);
        merged.xp = safeInt(merged.xp, 0, 0);
        merged.sparks = safeInt(merged.sparks, 0, 0);
        merged.treats = safeInt(merged.treats, 0, 0);
        if (Object.prototype.hasOwnProperty.call(data, 'streak') && (!data.streak || typeof data.streak !== 'object' || Array.isArray(data.streak) ||
            (Object.prototype.hasOwnProperty.call(data.streak, 'count') && (!Number.isSafeInteger(data.streak.count) || data.streak.count < 0)) ||
            (data.streak.lastQualifiedPeriod != null && !/^\d{4}-\d{2}-\d{2}$/.test(data.streak.lastQualifiedPeriod)))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'streak' });
          return structuredCopy(defaults[name]);
        }
        const incomingStreak = merged.streak && typeof merged.streak === 'object' ? merged.streak : {};
        merged.streak = {
          count: safeInt(incomingStreak.count, 0, 0),
          lastQualifiedPeriod: typeof incomingStreak.lastQualifiedPeriod === 'string' ? incomingStreak.lastQualifiedPeriod : null
        };
        if (Object.prototype.hasOwnProperty.call(data, 'badges') && (!Array.isArray(data.badges) || data.badges.some(id => !validToken(id, 64)))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'badges' });
          return structuredCopy(defaults[name]);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'collectibles')) {
          const collectibles = normalizeCollectibles(data.collectibles);
          if (!collectibles) {
            blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'collectibles' });
            return structuredCopy(defaults[name]);
          }
          merged.collectibles = collectibles;
        }
        merged.badges = Array.from(new Set(Array.isArray(merged.badges) ? merged.badges : []));
      } else if (name === 'quests') {
        if (Object.prototype.hasOwnProperty.call(data, 'items') && (!data.items || typeof data.items !== 'object' || Array.isArray(data.items))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'items' });
          return structuredCopy(defaults[name]);
        }
        if (data.items && Object.entries(data.items).some(([id, item]) => !validToken(id, 80) || !item || typeof item !== 'object' || Array.isArray(item) ||
            (item.progress != null && (!Number.isFinite(item.progress) || item.progress < 0)) ||
            (item.completedAt != null && !validIsoTimestamp(item.completedAt)) ||
            (item.claimedAt != null && !validIsoTimestamp(item.claimedAt)))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'items' });
          return structuredCopy(defaults[name]);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'processedEventIds') && (!Array.isArray(data.processedEventIds) || data.processedEventIds.some(id => typeof id !== 'string' || id.length > 128))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'processedEventIds' });
          return structuredCopy(defaults[name]);
        }
        if (Object.prototype.hasOwnProperty.call(data, 'dailyClaimedPeriod') && data.dailyClaimedPeriod !== null && !/^\d{4}-\d{2}-\d{2}$/.test(data.dailyClaimedPeriod)) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'dailyClaimedPeriod' });
          return structuredCopy(defaults[name]);
        }
        merged.items = merged.items && typeof merged.items === 'object' && !Array.isArray(merged.items) ? merged.items : {};
        merged.processedEventIds = Array.from(new Set(Array.isArray(merged.processedEventIds) ? merged.processedEventIds : [])).slice(-EVENT_HISTORY_LIMIT);
        merged.dailyClaimedPeriod = typeof merged.dailyClaimedPeriod === 'string' ? merged.dailyClaimedPeriod : null;
      } else if (name === 'discoveries') {
        if (Object.prototype.hasOwnProperty.call(data, 'items') && (!Array.isArray(data.items) || data.items.some(id => !validToken(id, 80)))) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'items' });
          return structuredCopy(defaults[name]);
        }
        merged.items = Array.isArray(merged.items) ? merged.items : [];
        if (!Object.prototype.hasOwnProperty.call(data, 'homeInteraction')) merged.homeInteraction = emptyHomeInteraction();
        else {
          merged.homeInteraction = normalizeHomeInteraction(data.homeInteraction);
          if (merged.homeInteraction.readOnly) {
            const future = merged.homeInteraction.readOnlyReason === 'future-schema-read-only';
            blockRecord(name, merged.homeInteraction.readOnlyReason, future ? 'future-home-interaction-version' : 'invalid-home-interaction', undefined, future);
          }
        }
      } else if (name === 'profile') {
        for (const field of ['displayName', 'selectedBadge']) {
          if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== null && !validToken(data[field], 64)) {
            blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field });
            return structuredCopy(defaults[name]);
          }
        }
        const localScores = normalizeLocalScores(Object.prototype.hasOwnProperty.call(data, 'localScores') ? data.localScores : {});
        if (!localScores) {
          blockRecord(name, 'invalid-stored-data-read-only', 'invalid-field', { field: 'localScores' });
          return structuredCopy(defaults[name]);
        }
        merged.localScores = localScores;
      }
      return merged;
    }
    function structuredCopy(value) { return JSON.parse(JSON.stringify(value)); }
    for (const name of Object.keys(KEYS)) records[name] = read(name);

    function save(name) {
      if (blocked.has(name)) return false;
      records[name].schemaVersion = VERSION;
      records[name].updatedAt = timestamp();
      try { storage.setItem(KEYS[name], JSON.stringify(records[name])); return true; }
      catch (error) { persistent = false; diagnostics.push({ key: KEYS[name], kind: 'write-failed', message: String(error && error.message || error) }); return false; }
    }
    function saveMany(names) {
      if (names.some(name => blocked.has(name))) return false;
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
        futureVersions.delete(name);
        readOnlyReasons.delete(name);
        records[name] = read(name);
      }
    }
    function progressFor(definition) {
      const item = records.quests.items[definition.id] || {};
      const progress = Number.isFinite(item.progress) && item.progress >= 0 ? item.progress : 0;
      const target = Number.isFinite(definition.target) && definition.target > 0 ? definition.target : 1;
      return { category: definition.category || 'exploration', progress, target, complete: progress >= target, claimedAt: item.claimedAt || null, completedAt: item.completedAt || null };
    }
    function grant(reward) {
      reward = reward || {};
      const xp = Number.isFinite(reward.xp) && reward.xp > 0 ? Math.floor(reward.xp) : 0;
      const sparks = Number.isFinite(reward.sparks) && reward.sparks > 0 ? Math.floor(reward.sparks) : 0;
      records.pass.xp = Math.min(Number.MAX_SAFE_INTEGER, records.pass.xp + xp);
      records.pass.sparks = Math.min(Number.MAX_SAFE_INTEGER, records.pass.sparks + sparks);
      const configuredThreshold = Number.isFinite(definitions.xpPerLevel) && definitions.xpPerLevel > 0 ? Math.floor(definitions.xpPerLevel) : null;
      if (configuredThreshold) records.pass.level = 1 + Math.floor(records.pass.xp / configuredThreshold);
    }
    function eventMatches(definition, event) {
      if (!definition || !event || definition.event !== event.type) return false;
      if (event.type === 'route-visit') return definition.route === event.route;
      if (event.type === 'treat-collected') return !definition.interactionId || definition.interactionId === event.interactionId;
      if (event.type === 'game-completed') return definition.gameId === event.gameId;
      return false;
    }
    function eventKey(event) {
      if (event.type === 'route-visit') return 'route:' + event.route;
      if (event.type === 'treat-collected') return 'treat:' + event.interactionId;
      if (event.type === 'game-completed') return 'game:' + event.gameId + ':' + event.completionId;
      return '';
    }
    function applyQuestEvent(event, markProcessed) {
      const matching = (definitions.quests || []).filter(quest => eventMatches(quest, event));
      if (!matching.length || blocked.has('quests')) return false;
      const key = eventKey(event);
      if (markProcessed && records.quests.processedEventIds.includes(key)) return false;
      if (markProcessed) records.quests.processedEventIds.push(key);
      for (const quest of matching) {
        const before = progressFor(quest);
        if (before.complete) continue;
        const progress = Math.min(before.target, before.progress + 1);
        records.quests.items[quest.id] = Object.assign({}, records.quests.items[quest.id], {
          progress,
          completedAt: progress >= before.target ? timestamp() : null,
          claimedAt: records.quests.items[quest.id] && records.quests.items[quest.id].claimedAt || null
        });
      }
      if (markProcessed) records.quests.processedEventIds = records.quests.processedEventIds.slice(-EVENT_HISTORY_LIMIT);
      return true;
    }
    function treatCountFromCollectibles() {
      const counts = new Map(records.pass.collectibles.map(item => [item.id, item.count]));
      return Array.from(treatsById.keys()).reduce((sum, id) => sum + (counts.get(id) > 0 ? 1 : 0), 0);
    }
    function rewardIsEarned(reward, quests, discoveries, treats) {
      const condition = reward && reward.condition;
      if (!condition || !condition.type) return false;
      if (condition.type === 'treat-count') return treats >= condition.minimum;
      if (condition.type === 'quest-count') return quests.filter(item => item.complete).length >= condition.minimum;
      if (condition.type === 'discovery-ids') return Array.isArray(condition.ids) && condition.ids.every(id => discoveries.some(item => item.id === id));
      return false;
    }
    function getSnapshot() {
      const currentPeriod = utcDay(timestamp());
      const quests = (definitions.quests || []).map(definition => Object.assign({}, definition, progressFor(definition)));
      const discoveryDefinitions = definitions.discoveries || [];
      const discoveries = records.discoveries.items.map(id => {
        const definition = discoveryDefinitions.find(item => item.id === id);
        return definition ? { id, title: definition.title, description: definition.description || '' } : { id, title: 'Previously recorded discovery', description: '' };
      });
      const milestones = (definitions.levelMilestones || []).map(milestone => Object.assign({}, milestone, { unlocked: milestone.level <= records.pass.level, entitlement: false }));
      const configuredThreshold = Number.isFinite(definitions.xpPerLevel) && definitions.xpPerLevel > 0 ? Math.floor(definitions.xpPerLevel) : null;
      const treatCounts = new Map(records.pass.collectibles.map(item => [item.id, item.count]));
      const treats = (definitions.treats || []).map(item => Object.assign({}, item, { collected: treatCounts.get(item.id) > 0 }));
      const treatCount = treats.filter(item => item.collected).length;
      const rewards = (definitions.rewards || []).map(reward => Object.assign({}, reward, {
        earned: rewardIsEarned(reward, quests, discoveries, treatCount),
        unlocked: rewardIsEarned(reward, quests, discoveries, treatCount),
        entitlement: false
      }));
      const earnedBadges = rewards.filter(reward => reward.earned && reward.badgeId).map(reward => reward.badgeId);
      const profile = structuredCopy(records.profile);
      const profileBadges = Array.from(new Set((records.pass.badges || []).concat(earnedBadges)));
      return {
        pass: Object.assign(structuredCopy(records.pass), { treats: treatCount, badges: profileBadges }), quests,
        treats, discoveries, profile, localScores: structuredCopy(records.profile.localScores || {}), badges: profileBadges,
        rewards, milestones,
        xpToNext: configuredThreshold ? configuredThreshold - records.pass.xp % configuredThreshold : null,
        daily: {
          enabled: Boolean(definitions.dailyCheckIn && definitions.dailyCheckIn.enabled && definitions.dailyCheckIn.period === 'UTC-day'),
          period: currentPeriod, claimed: records.quests.dailyClaimedPeriod === currentPeriod,
          configStatus: definitions.configStatus || 'unverified-config'
        },
        questsComplete: quests.filter(q => q.complete).length,
        storage: {
          local: persistent, persistent, available: persistent, diagnostics: diagnostics.slice(),
          futureVersionKeys: Array.from(futureVersions).map(name => KEYS[name]),
          readOnlyKeys: Array.from(blocked).map(name => KEYS[name]),
          readOnlyReasons: Object.fromEntries(readOnlyReasons)
        }
      };
    }
    function normalizeRecordEvent(input) {
      if (typeof input === 'string' && input.startsWith('route:')) return { type: 'route-visit', route: input.slice(6) };
      if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
      if (input.type === 'treat-collected' && HOME_CANDY_IDS.includes(input.interactionId)) return { type: 'treat-collected', interactionId: input.interactionId };
      if (input.type === 'route-visit' && typeof input.route === 'string') return { type: 'route-visit', route: input.route };
      return null;
    }
    function recordEvent(input) {
      const event = normalizeRecordEvent(input);
      if (!event) return false;
      refresh(event.type === 'treat-collected' ? ['quests', 'discoveries', 'pass'] : ['quests', 'discoveries']);
      if (blocked.has('quests')) return false;
      if (event.type === 'treat-collected') {
        const home = normalizeHomeInteraction(records.discoveries.homeInteraction);
        const treat = treatsByInteraction.get(event.interactionId);
        const collectibleCount = treat && records.pass.collectibles.find(item => item.id === treat.id)?.count || 0;
        if (blocked.has('discoveries') || blocked.has('pass') || home.readOnly || !home.candies.includes(event.interactionId) || collectibleCount < 1) return false;
      }
      const key = eventKey(event);
      if (records.quests.processedEventIds.includes(key)) return false;
      const matching = (definitions.quests || []).filter(q => eventMatches(q, event));
      const matchingDiscoveries = event.type === 'route-visit' ? (definitions.discoveries || []).filter(d => d.event === 'route-visit' && event.route === d.route) : [];
      if (!matching.length && !matchingDiscoveries.length) return false;
      if (matchingDiscoveries.length && blocked.has('discoveries')) return false;
      const priorQuestState = structuredCopy(records.quests);
      const priorDiscoveryState = structuredCopy(records.discoveries);
      applyQuestEvent(event, true);
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
    function getLocalScores(gameId) {
      if (!validGameId(gameId)) return { gameId: null, best: null, runs: [] };
      refresh(['profile']);
      const entry = Object.prototype.hasOwnProperty.call(records.profile.localScores, gameId) ? records.profile.localScores[gameId] : null;
      if (!entry) return { gameId, best: null, runs: [] };
      const runs = entry.runs.slice().sort((a, b) => b.score - a.score || b.completedAt.localeCompare(a.completedAt));
      return { gameId, best: entry.best, runs: structuredCopy(runs) };
    }
    function getLocalBest(gameId) {
      const result = getLocalScores(gameId);
      return result.best;
    }
    function normalizeScoreMetadata(value, field) {
      if (value === undefined || value === null) return { ok: true, value: null };
      if (!validToken(value, 64)) return { ok: false, field };
      return { ok: true, value };
    }
    function recordLocalScore(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, reason: 'invalid-score-record' };
      const gameId = input.gameId;
      if (!validGameId(gameId)) return { ok: false, reason: 'invalid-game-id' };
      const score = normalizeScore(input.score);
      if (score === null) return { ok: false, reason: 'invalid-score' };
      if (!validToken(input.completionId, 80)) return { ok: false, reason: 'invalid-completion-id' };
      const mode = normalizeScoreMetadata(input.mode, 'mode');
      const ruleset = normalizeScoreMetadata(input.ruleset, 'ruleset');
      const characterId = normalizeScoreMetadata(input.characterId, 'characterId');
      if (!mode.ok || !ruleset.ok || !characterId.ok) return { ok: false, reason: 'invalid-score-metadata' };
      refresh(['profile', 'quests']);
      if (blocked.has('profile')) return { ok: false, reason: readOnlyReasons.get('profile') || 'future-schema-read-only' };
      const priorProfile = structuredCopy(records.profile);
      const priorQuestState = structuredCopy(records.quests);
      const scores = records.profile.localScores;
      const prior = Object.prototype.hasOwnProperty.call(scores, gameId) ? scores[gameId] : null;
      if (prior && prior.runs.some(run => run.completionId === input.completionId)) return { ok: false, reason: 'duplicate-completion' };
      if (!prior && Object.keys(scores).length >= SCORE_GAME_LIMIT) return { ok: false, reason: 'game-limit-reached' };
      const run = {
        score,
        completedAt: timestamp(),
        mode: mode.value,
        ruleset: ruleset.value,
        characterId: characterId.value,
        completionId: input.completionId
      };
      const event = { type: 'game-completed', gameId, completionId: input.completionId };
      const hasGameQuest = (definitions.quests || []).some(quest => eventMatches(quest, event));
      records.profile.localScores[gameId] = {
        best: Math.max(prior ? prior.best : 0, score),
        runs: [run].concat(prior ? prior.runs : []).slice(0, SCORE_HISTORY_LIMIT)
      };
      if (hasGameQuest && !blocked.has('quests')) applyQuestEvent(event, false);
      const names = hasGameQuest && !blocked.has('quests') ? ['profile', 'quests'] : ['profile'];
      if (!saveMany(names)) {
        records.profile = priorProfile;
        records.quests = priorQuestState;
        const reason = names.some(name => blocked.has(name)) ? 'future-schema-read-only' : 'storage-unavailable';
        return { ok: false, reason };
      }
      return { ok: true, gameId, score, best: records.profile.localScores[gameId].best, run: structuredCopy(run) };
    }
    function claimQuest(id) {
      refresh(['quests', 'pass']);
      const definition = (definitions.quests || []).find(q => q.id === id);
      if (!definition) return { ok: false, reason: 'unknown-quest' };
      const progress = progressFor(definition);
      if (!progress.complete) return { ok: false, reason: 'incomplete' };
      if (progress.claimedAt) return { ok: false, reason: 'already-claimed' };
      if (blocked.has('quests') || blocked.has('pass')) return { ok: false, reason: readOnlyReasons.get(blocked.has('quests') ? 'quests' : 'pass') || 'future-schema-read-only' };
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
    function claimDaily() {
      refresh(['quests', 'pass']);
      const config = definitions.dailyCheckIn;
      if (!config || !config.enabled || config.period !== 'UTC-day') return { ok: false, reason: 'not-configured' };
      if (blocked.has('quests') || blocked.has('pass')) return { ok: false, reason: readOnlyReasons.get(blocked.has('quests') ? 'quests' : 'pass') || 'future-schema-read-only' };
      const period = utcDay(timestamp());
      if (records.quests.dailyClaimedPeriod === period) return { ok: false, reason: 'already-claimed' };
      const priorQuestState = structuredCopy(records.quests);
      const priorPassState = structuredCopy(records.pass);
      const prior = records.pass.streak.lastQualifiedPeriod;
      const priorDate = prior ? new Date(prior + 'T00:00:00.000Z') : null;
      const thisDate = new Date(period + 'T00:00:00.000Z');
      const difference = priorDate && !Number.isNaN(priorDate.getTime()) ? Math.round((thisDate - priorDate) / 86400000) : null;
      records.pass.streak.count = difference === 1 ? Math.min(Number.MAX_SAFE_INTEGER, records.pass.streak.count + 1) : (difference === 0 ? Math.max(1, records.pass.streak.count) : 1);
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
      if (blocked.has('discoveries')) {
        state.readOnly = true;
        state.readOnlyReason = state.readOnlyReason || readOnlyReasons.get('discoveries') || 'invalid-stored-data-read-only';
      }
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
      refresh(['discoveries', 'pass']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries') || state.readOnly) return { ok: false, reason: state.readOnlyReason || readOnlyReasons.get('discoveries') || 'future-schema-read-only', state };
      if (blocked.has('pass')) return { ok: false, reason: readOnlyReasons.get('pass') || 'future-schema-read-only', state };
      if (!HOME_CANDY_IDS.includes(id)) return { ok: false, reason: 'unknown-candy', state };
      if (id === 'golden-block-candy' && !state.goldenBlock.complete) return { ok: false, reason: 'locked', state };
      if (state.candies.includes(id)) {
        const reconciled = reconcileHomeTreats();
        if (!reconciled.ok) return { ok: false, reason: reconciled.reason, state: getHomeInteractionState() };
        return { ok: false, reason: 'already-collected', state: getHomeInteractionState() };
      }
      const treat = treatsByInteraction.get(id);
      if (!treat) return { ok: false, reason: 'treat-mapping-unavailable', state };
      const priorDiscoveryState = structuredCopy(records.discoveries);
      const priorPassState = structuredCopy(records.pass);
      state.candies.push(id);
      records.discoveries.homeInteraction = state;
      const collectibles = new Map(records.pass.collectibles.map(item => [item.id, item.count]));
      collectibles.set(treat.id, Math.max(1, collectibles.get(treat.id) || 0));
      records.pass.collectibles = Array.from(collectibles, ([collectibleId, count]) => ({ id: collectibleId, count }));
      records.pass.treats = treatCountFromCollectibles();
      if (!saveMany(['discoveries', 'pass'])) {
        records.discoveries = priorDiscoveryState;
        records.pass = priorPassState;
        return { ok: false, reason: 'storage-unavailable', state: getHomeInteractionState() };
      }
      const questRecorded = recordEvent({ type: 'treat-collected', interactionId: id });
      return { ok: true, state: getHomeInteractionState(), treats: records.pass.treats, questRecorded };
    }
    function reconcileHomeTreats() {
      refresh(['discoveries', 'pass']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries') || state.readOnly) return { ok: false, changed: false, reason: state.readOnlyReason || readOnlyReasons.get('discoveries') || 'future-schema-read-only' };
      if (blocked.has('pass')) return { ok: false, changed: false, reason: readOnlyReasons.get('pass') || 'future-schema-read-only' };
      const priorDiscoveryState = structuredCopy(records.discoveries);
      const priorPassState = structuredCopy(records.pass);
      const collectibles = new Map(records.pass.collectibles.map(item => [item.id, item.count]));
      for (const interactionId of state.candies) {
        const treat = treatsByInteraction.get(interactionId);
        if (!treat) return { ok: false, changed: false, reason: 'treat-mapping-unavailable' };
        collectibles.set(treat.id, Math.max(1, collectibles.get(treat.id) || 0));
      }
      for (const [interactionId, treat] of treatsByInteraction) {
        if (!state.candies.includes(interactionId) && (collectibles.get(treat.id) || 0) > 0) {
          return { ok: false, changed: false, reason: 'inconsistent-treat-state' };
        }
      }
      records.pass.collectibles = Array.from(collectibles, ([id, count]) => ({ id, count }));
      records.pass.treats = treatCountFromCollectibles();
      const changed = JSON.stringify(records.discoveries) !== JSON.stringify(priorDiscoveryState) || JSON.stringify(records.pass) !== JSON.stringify(priorPassState);
      if (changed && !saveMany(['discoveries', 'pass'])) {
        records.discoveries = priorDiscoveryState;
        records.pass = priorPassState;
        return { ok: false, changed: false, reason: 'storage-unavailable' };
      }
      let questEventsRecorded = 0;
      for (const interactionId of state.candies) {
        if (recordEvent({ type: 'treat-collected', interactionId })) questEventsRecorded += 1;
      }
      return { ok: true, changed, treats: records.pass.treats, questEventsRecorded };
    }
    function hitGoldenBlock() {
      refresh(['discoveries']);
      const state = normalizeHomeInteraction(records.discoveries.homeInteraction);
      if (blocked.has('discoveries') || state.readOnly) return { ok: false, reason: state.readOnlyReason || readOnlyReasons.get('discoveries') || 'future-schema-read-only', state };
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
      futureVersions.clear();
      readOnlyReasons.clear();
      return getSnapshot();
    }
      return {
        getSnapshot, recordEvent, claimDaily, claimQuest,
        getHomeInteractionState, collectHomeCandy, hitGoldenBlock, reconcileHomeTreats,
        recordLocalScore, getLocalScores, getLocalBest, clear
      };
  }

  function boot(document, root) {
    if (!document || !document.querySelectorAll) return;
    let browserStorage;
    try { browserStorage = root && root.localStorage; } catch (_) { browserStorage = undefined; }
    const store = root && root.ToadalGuestProgressionStore || createStore({ storage: browserStorage });
    if (root) {
      root.ToadalGuestProgressionStore = store;
      root.__toadalGuestProgressionStore = store;
    }
    const path = normalizePath(root && root.location && root.location.pathname || '/', definitionsForRuntime());
    store.recordEvent('route:' + path);
    const roots = document.querySelectorAll('[data-progression-page]');
    roots.forEach(page => {
      if (page.__toadalProgressionBooted) return;
      page.__toadalProgressionBooted = true;
      const status = page.querySelector('[data-progression-storage-status]');
      const setStatus = text => { if (status) status.textContent = text; };
      function render() {
        const reconciliation = store.reconcileHomeTreats();
        const state = store.getSnapshot();
      const values = { level: state.pass.level, xp: state.pass.xp, 'xp-to-next': state.xpToNext == null ? '—' : state.xpToNext, sparks: state.pass.sparks, treats: state.pass.treats, streak: state.pass.streak.count, discoveries: state.discoveries.length, 'quests-complete': state.questsComplete };
        page.querySelectorAll('[data-progression-stat]').forEach(el => { const key = el.getAttribute('data-progression-stat'); if (Object.prototype.hasOwnProperty.call(values, key)) el.textContent = String(values[key]); });
        const formatQuest = q => {
          const reward = [];
          const category = ({ daily: 'Daily', weekly: 'Weekly', exploration: 'Exploration', game: 'Game', story: 'Story' })[q.category] || q.category;
          if (Number.isFinite(q.reward && q.reward.xp) && q.reward.xp > 0) reward.push(q.reward.xp + ' XP');
          if (Number.isFinite(q.reward && q.reward.sparks) && q.reward.sparks > 0) reward.push(q.reward.sparks + ' Sparks');
          const rewardText = reward.length ? ' · Reward: ' + reward.join(', ') : '';
          return { title: q.title, detail: category + ' · ' + q.description + ' · ' + q.progress + '/' + q.target + rewardText + (q.complete ? (q.claimedAt ? ' · Reward claimed' : ' · Complete; reward can be claimed') : ' · Active'), id: q.id, button: q.complete && !q.claimedAt ? 'Claim quest reward' : null };
        };
        const questContainers = page.querySelectorAll('[data-progression-quest-list]');
        if (questContainers && questContainers.length) {
          questContainers.forEach(container => {
            const category = container.getAttribute('data-quest-category') || '';
            const view = container.getAttribute('data-progression-quest-list') || 'all';
            const quests = state.quests.filter(q => (!category || q.category === category) && (view === 'all' || (view === 'completed' ? q.complete : !q.complete)));
            renderItems(container, quests.map(formatQuest), id => {
              const result = store.claimQuest(id);
              setStatus(result.ok ? 'Quest reward claimed.' : result.reason === 'already-claimed' ? 'This quest reward was already claimed.' : 'Quest reward is not available yet.');
              render();
            }, container.getAttribute('data-progression-empty') || 'No quests are configured in this category yet.', page.ownerDocument);
          });
        } else {
          renderList(page, '[data-progression-quest-list]', state.quests.map(formatQuest), id => {
            const result = store.claimQuest(id);
            setStatus(result.ok ? 'Quest reward claimed.' : result.reason === 'already-claimed' ? 'This quest reward was already claimed.' : 'Quest reward is not available yet.');
            render();
          });
        }
        const rewards = state.rewards.map(r => ({ title: r.title || r.name || r.id, detail: r.description + ' · ' + (r.earned ? 'Earned from local website activity.' : 'Locked until the configured local activity occurs.') + ' No entitlement or transfer is included.' }));
        const milestones = state.milestones.map(m => ({ title: m.title, detail: 'Level ' + m.level + ' milestone · ' + (m.unlocked ? 'Reached' : 'Not reached yet') + ' · Local recognition only; no item or entitlement is included.' }));
        renderList(page, '[data-progression-reward-list]', rewards.concat(milestones));
        renderList(page, '[data-progression-discovery-list]', state.discoveries.map(item => ({ title: item.title, detail: item.description || 'A visit to a site preview; no lore or food item is implied.' })));
        renderList(page, '[data-progression-treat-list]', state.treats.map(item => ({ title: item.title, detail: item.description + ' · ' + (item.collected ? 'Found and saved in this browser.' : 'Not found yet.') + ' Local preview only; no entitlement or transfer.' })));
        renderList(page, '[data-profile-local-score-list]', Object.entries(state.localScores).map(([gameId, scores]) => ({
          title: gameId === 'wicked-bites' ? 'Wicked Bites' : gameId,
          detail: 'Personal best ' + scores.best + ' · ' + scores.runs.length + ' recent completed local ' + (scores.runs.length === 1 ? 'run' : 'runs') + '. No global rank is implied.'
        })));
        renderList(page, '[data-profile-badge-list]', state.badges.map(id => {
          const reward = state.rewards.find(item => item.badgeId === id);
          return { title: reward ? reward.title : id, detail: 'Earned from real local website activity. No transferable reward is included.' };
        }));
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
        if (!reconciliation.ok && reconciliation.reason) setStatus('Stored collection data was left unchanged because it could not be reconciled safely.');
        else if (state.storage.readOnlyKeys.length) setStatus('Stored progression is read-only because its data could not be safely updated.');
        else if (!state.storage.persistent) setStatus('Browser storage is unavailable; progress may not persist after leaving this page.');
        else if (state.storage.diagnostics.length) setStatus('Guest progress is using safe local defaults; stored data could not be read or was outdated.');
        else if (status && !status.textContent) setStatus('Guest progress is stored only in this browser.');
      }
      page.querySelectorAll('[data-clear-progression]').forEach(button => button.addEventListener('click', () => { store.clear(); setStatus('Website guest progression was cleared from this browser. Other game and mobile data was not changed.'); render(); }));
      render();
      page.__toadalProgressionStore = store;
    });
  }
  function definitionsForRuntime() { return defaultDefinitions || {}; }
  function getStore(root) { return root && root.ToadalGuestProgressionStore || null; }
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
  function renderList(page, selector, items, onClaim, emptyCopy) {
    const container = page.querySelector(selector);
    if (!container) return;
    const configuredEmpty = container.getAttribute && container.getAttribute('data-progression-empty');
    renderItems(container, items, onClaim, emptyCopy || configuredEmpty || (selector.includes('reward') ? 'No local milestones are configured.' : 'Nothing recorded yet.'), page.ownerDocument);
  }
  function renderItems(container, items, onClaim, emptyCopy, ownerDocument) {
    while (container.firstChild) container.removeChild(container.firstChild);
    container.setAttribute('role', 'list');
    if (!items.length) {
      const empty = ownerDocument.createElement('div');
      empty.setAttribute('role', 'listitem');
      empty.textContent = emptyCopy || 'Nothing recorded yet.';
      container.appendChild(empty);
      return;
    }
    items.forEach(item => {
      const entry = ownerDocument.createElement('div');
      entry.setAttribute('role', 'listitem');
      const title = ownerDocument.createElement('strong'); title.textContent = item.title; entry.appendChild(title);
      const detail = ownerDocument.createElement('p'); detail.textContent = item.detail || ''; entry.appendChild(detail);
      if (item.button && onClaim) { const button = ownerDocument.createElement('button'); button.type = 'button'; button.textContent = item.button; button.addEventListener('click', () => onClaim(item.id)); entry.appendChild(button); }
      container.appendChild(entry);
    });
  }
  return { KEYS, createStore, boot, getStore, normalizePath, normalizeScore, renderList };
});
