/* Website catalogue presentation only. Never launches, qualifies or changes a game. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document && root.self === root.top) { root.ToadalPlayCatalogue = api; api.boot(root.document, root); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const AVAILABILITY = Object.freeze(['all', 'playable', 'held', 'concept', 'unavailable']);
  const RELEASES = Object.freeze(['all', 'preview', 'public']);
  const LABELS = Object.freeze({ playable: 'Playable preview', held: 'Launch held', concept: 'Concept', unavailable: 'Availability unconfirmed' });
  const ID = /^[a-z][a-z0-9-]{0,79}$/;
  const plainObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  function classifyGame(game) {
    // Explicit source configuration, not runtime probing or historical CI PASS.
    if (!plainObject(game) || game.schemaVersion !== 1 || !ID.test(game.slug || '') || game.id !== 'game.' + game.slug ||
        !['preview', 'public'].includes(game.status) || !plainObject(game.web) || !plainObject(game.web.browserCartridge)) return 'unavailable';
    const web = game.web, cartridge = web.browserCartridge;
    if (cartridge.launchHeld === true) return 'held'; // A hold always defeats enabled/runnable flags.
    if (typeof web.enabled !== 'boolean' || (cartridge.launchHeld !== undefined && typeof cartridge.launchHeld !== 'boolean') ||
        (cartridge.runnable !== undefined && typeof cartridge.runnable !== 'boolean') || cartridge.publicState !== game.status.toUpperCase()) return 'unavailable';
    const entry = cartridge.entry;
    if (web.enabled && cartridge.runnable !== false && entry === '/public/games/' + game.slug + '/index.html' &&
        typeof cartridge.version === 'string' && cartridge.version.trim() && cartridge.protocol === 'toadal.game.v1') return 'playable';
    if (game.status === 'preview' && web.enabled === false && cartridge.runnable === false && cartridge.launchHeld === false &&
        (entry === '' || entry === null) && cartridge.version === null) return 'concept';
    return 'unavailable';
  }
  function availabilityLabel(availability, release) {
    return availability === 'playable' && release === 'public' ? 'Playable public release' : LABELS[availability] || LABELS.unavailable;
  }
  function cleanQuery(value) { return Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/gu, ' ').trim()).slice(0, 120).join(''); }
  function normalizeState(value) {
    value = value || {};
    return { q: cleanQuery(value.q), availability: AVAILABILITY.includes(value.availability) ? value.availability : 'all', release: RELEASES.includes(value.release) ? value.release : 'all' };
  }
  function readState(href) {
    try { const params = new URL(href, 'https://catalogue.invalid/').searchParams;
      return normalizeState({ q: params.get('q'), availability: params.get('availability'), release: params.get('release') });
    } catch (_) { return normalizeState(); }
  }
  function stateURL(href, state) {
    const url = new URL(href, 'https://catalogue.invalid/');
    const normalized = normalizeState(state);
    for (const key of ['q', 'availability', 'release']) {
      if (!normalized[key] || normalized[key] === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, normalized[key]);
    }
    return url.pathname + url.search + url.hash; // Never replace origin/path or unrelated campaign parameters.
  }
  function searchText(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function catalogueView(rows, state) {
    state = normalizeState(state);
    if (!Array.isArray(rows) || rows.length > 500) throw new Error('Invalid catalogue rows');
    const ids = new Set();
    for (const row of rows) {
      if (!plainObject(row) || !ID.test(row.id || '') || ids.has(row.id) || typeof row.title !== 'string' || !row.title.trim() ||
          !AVAILABILITY.slice(1).includes(row.availability) || !['preview', 'public'].includes(row.release)) throw new Error('Unusable catalogue projection');
      ids.add(row.id);
    }
    const words = searchText(state.q).split(/\s+/u).filter(Boolean);
    const queryMatches = rows.filter(row => words.every(word => searchText(row.title + ' ' + (row.displayTitle || '')).includes(word)));
    const inRelease = row => state.release === 'all' || state.release === row.release;
    const inAvailability = row => state.availability === 'all' || state.availability === row.availability;
    const counts = Object.fromEntries(AVAILABILITY.map(key => [key, queryMatches.filter(row => inRelease(row) && (key === 'all' || row.availability === key)).length]));
    const releaseCounts = Object.fromEntries(RELEASES.map(key => [key, queryMatches.filter(row => inAvailability(row) && (key === 'all' || row.release === key)).length]));
    return { state, total: rows.length, rows: queryMatches.filter(row => inRelease(row) && inAvailability(row)), counts, releaseCounts };
  }
  function boot(document, root) {
    const area = document && document.querySelector('[data-catalogue-root]');
    if (!area || area.__toadalCatalogue) return;
    const grid = area.querySelector('#browser-games'), form = area.querySelector('[data-catalogue-form]');
    const input = area.querySelector('[data-catalogue-query]'), release = area.querySelector('[data-catalogue-release-filter]');
    const buttons = Array.from(area.querySelectorAll('[data-catalogue-filter]'));
    const status = area.querySelector('[data-catalogue-status]'), empty = area.querySelector('[data-game-empty]');
    const reset = area.querySelector('[data-catalogue-reset]'), urlStatus = area.querySelector('[data-catalogue-url-status]');
    const cards = grid ? Array.from(grid.querySelectorAll('.studio-game-card')) : [];
    let rows;
    function unavailable() {
      cards.forEach(card => { card.hidden = false; });
      area.querySelectorAll('[data-catalogue-control]').forEach(control => { control.disabled = true; });
      area.querySelectorAll('[data-catalogue-count]').forEach(node => { node.textContent = '—'; });
      if (empty) empty.hidden = true;
      if (status) status.textContent = 'Catalogue filters are unavailable. Existing listings and detail links remain available; no empty catalogue or new availability is inferred.';
      area.setAttribute('data-catalogue-state', 'unavailable');
    }
    try {
      if (!grid || !form || !input || !release || !reset || !status || !empty || area.getAttribute('data-catalogue-version') !== '1' ||
          AVAILABILITY.some(key => buttons.filter(button => button.getAttribute('data-catalogue-filter') === key).length !== 1)) throw new Error('Incomplete catalogue controls');
      rows = cards.map(card => ({ id: card.getAttribute('data-game-id'), title: card.getAttribute('data-catalogue-title'),
        displayTitle: card.querySelector('h3')?.textContent || '', availability: card.getAttribute('data-catalogue-availability'), release: card.getAttribute('data-game-status') }));
      catalogueView(rows);
    } catch (_) { unavailable(); return; }
    area.__toadalCatalogue = true;
    let state = readState(root.location.href);
    let draftStarted = false, urlWarning = false;
    const label = { all: 'All availability', playable: 'Playable', held: 'Launch held', concept: 'Concepts', unavailable: 'Unconfirmed' };
    const releaseLabel = { all: 'All release states', preview: 'Preview', public: 'Public release' };
    function render(syncInput) {
      const view = catalogueView(rows, state);
      state = view.state;
      if (syncInput && input.value !== state.q) input.value = state.q;
      release.value = state.release;
      const visible = new Set(view.rows.map(row => row.id));
      cards.forEach(card => {
        const row = rows.find(item => item.id === card.getAttribute('data-game-id'));
        card.hidden = !visible.has(row.id);
        const badge = card.querySelector('[data-catalogue-availability-label]');
        if (badge) badge.textContent = availabilityLabel(row.availability, row.release);
      });
      buttons.forEach(button => {
        const key = button.getAttribute('data-catalogue-filter');
        button.setAttribute('aria-pressed', String(key === state.availability));
        button.setAttribute('aria-label', label[key] + ': ' + view.counts[key] + ' matching listing' + (view.counts[key] === 1 ? '' : 's'));
        const counter = button.querySelector('[data-catalogue-count]');
        if (counter) counter.textContent = String(view.counts[key]);
        // Keep zero-count choices usable. Only the unused unknown-state category is hidden.
        button.hidden = key === 'unavailable' && !rows.some(row => row.availability === key) && state.availability !== key;
      });
      for (const option of Array.from(release.options)) if (releaseLabel[option.value]) option.textContent = releaseLabel[option.value] + ' (' + view.releaseCounts[option.value] + ')';
      const count = view.rows.length;
      status.textContent = 'Showing ' + count + ' of ' + view.total + ' listing' + (view.total === 1 ? '' : 's') +
        (state.q ? ' matching “' + state.q + '”' : '') + '. ' + label[state.availability] + ' · ' + releaseLabel[state.release] + '.';
      empty.hidden = count !== 0;
      if (!count) empty.textContent = !view.total ? 'No games are listed here yet. No playable build or release is implied.' :
        state.release === 'public' ? 'No public releases match these filters. A playable preview is not a public release. Clear filters to explore the other listings.' :
        'No game titles match this combination. Try another title or Clear filters; held games and concepts are not made playable by changing filters.';
      if (urlStatus) { urlStatus.hidden = !urlWarning; urlStatus.textContent = urlWarning ? 'Filters work in this tab, but the browser did not allow the address to update. Reload or Back may restore the previous selection.' : ''; }
      const fallback = area.querySelector('[data-catalogue-fallback]');
      if (fallback) fallback.hidden = true;
      area.setAttribute('data-catalogue-state', 'ready');
      area.setAttribute('data-catalogue-visible-count', String(count));
    }
    function apply(next, mode = 'push', syncInput = true) {
      state = normalizeState(next);
      const href = stateURL(root.location.href, state);
      const old = new URL(root.location.href);
      if (href !== old.pathname + old.search + old.hash) {
        try { root.history[mode === 'replace' ? 'replaceState' : 'pushState'](root.history.state, '', href); urlWarning = false; }
        catch (_) { urlWarning = true; }
      }
      render(syncInput);
    }
    area.querySelectorAll('[data-catalogue-control]').forEach(control => { control.disabled = false; });
    input.addEventListener('input', () => {
      // One Back entry per typing interaction; subsequent keystrokes replace it.
      const next = { ...state, q: input.value };
      if (normalizeState(next).q === state.q) { render(false); return; }
      apply(next, draftStarted ? 'replace' : 'push', false); draftStarted = true;
    });
    input.addEventListener('blur', () => { draftStarted = false; });
    form.addEventListener('submit', event => { event.preventDefault(); apply({ ...state, q: input.value }); draftStarted = false; });
    buttons.forEach(button => button.addEventListener('click', () => {
      apply({ ...state, q: input.value, availability: button.getAttribute('data-catalogue-filter') }); draftStarted = false;
    }));
    release.addEventListener('change', () => { apply({ ...state, q: input.value, release: release.value }); draftStarted = false; });
    reset.addEventListener('click', () => { apply(normalizeState()); draftStarted = false; input.focus(); });
    root.addEventListener('popstate', () => { state = readState(root.location.href); draftStarted = false; urlWarning = false; render(true); });
    root.addEventListener('pageshow', event => { if (event.persisted) { state = readState(root.location.href); draftStarted = false; render(true); } });
    render(true);
  }
  return { AVAILABILITY, RELEASES, LABELS, classifyGame, availabilityLabel, cleanQuery, normalizeState, readState, stateURL, catalogueView, boot };
});
