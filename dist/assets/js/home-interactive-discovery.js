/* One Home-only interaction controller. Discovery remains guest-local and score-free. */
(function (root) {
  'use strict';

  const document = root && root.document;
  if (!document) return;

  const SAFE_DESTINATIONS = Object.freeze(['/characters/', '/world/', '/feast-pass/', '/play/']);
  const BLOCK_FRAME_ENDS = Object.freeze([9, 14, 19, 24]);
  const SPRITES = Object.freeze({
    chest: 'interactive/daily-chest-sprite.webp',
    burst: 'interactive/daily-fruit-burst-sprite.webp',
    block: 'interactive/golden-block-sprite.webp'
  });

  function siteBase() {
    const brand = document.querySelector('.site-brand');
    if (!brand) return '';
    try {
      const path = new root.URL(brand.href, root.location.href).pathname;
      return path === '/' ? '' : path.replace(/\/+$/, '');
    } catch (_) { return ''; }
  }
  function relativePath(path, base) {
    let value = String(path || '/').split(/[?#]/, 1)[0];
    if (base && (value === base || value.indexOf(base + '/') === 0)) value = value.slice(base.length) || '/';
    if (!value.startsWith('/')) value = '/' + value;
    return value.length > 1 ? value.replace(/\/+$/, '') + '/' : '/';
  }
  function reducedMotion() {
    try { return Boolean(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (_) { return false; }
  }
  function emit(name, detail) {
    if (!root.dispatchEvent || !root.CustomEvent) return;
    root.dispatchEvent(new root.CustomEvent(name, { detail: detail || {} }));
  }
  function actionCopy(button, copy) {
    button.setAttribute('data-companion-action', 'true');
    button.setAttribute('data-companion-action-copy', copy);
  }
  function dispatchAfter(delay, callback) {
    if (typeof root.setTimeout === 'function') root.setTimeout(callback, delay);
    else callback();
  }
  function spriteUrl(relative) {
    return (siteBase() || '') + '/assets/images/' + relative;
  }
  function ensureSpriteLoaded(element) {
    if (!element) return Promise.resolve(false);
    if (element.dataset.spriteLoaded === 'true') return Promise.resolve(true);
    if (element.__discoverySpritePromise) return element.__discoverySpritePromise;
    const path = element.getAttribute('data-lazy-sprite');
    if (!path || typeof root.Image !== 'function') {
      element.dataset.assetUnavailable = 'true';
      return Promise.resolve(false);
    }
    element.__discoverySpritePromise = new Promise(resolve => {
      const probe = new root.Image();
      probe.onload = () => {
        element.style.backgroundImage = 'url("' + spriteUrl(path) + '")';
        element.style.backgroundSize = '100% ' + (Number(element.dataset.spriteFrames) || 1) * 100 + '%';
        element.dataset.spriteLoaded = 'true';
        element.dataset.assetUnavailable = 'false';
        emit('toadal:discovery-sprite-ready', { kind: element.getAttribute('data-sprite-kind') || 'decorative' });
        resolve(true);
      };
      probe.onerror = () => {
        element.dataset.assetUnavailable = 'true';
        resolve(false);
      };
      probe.src = spriteUrl(path);
    });
    return element.__discoverySpritePromise;
  }
  function setSpriteFrame(element, frame, frameCount) {
    if (!element) return;
    const last = Math.max(1, frameCount - 1);
    const safeFrame = Math.max(0, Math.min(frameCount - 1, frame));
    element.style.backgroundPositionY = (safeFrame / last * 100) + '%';
    element.dataset.spriteFrame = String(safeFrame);
  }
  async function animateSprite(element, frameCount, from, to, millisecondsPerFrame) {
    const available = await ensureSpriteLoaded(element);
    if (!available) return false;
    setSpriteFrame(element, from, frameCount);
    if (from === to || reducedMotion() || typeof element.animate !== 'function') {
      setSpriteFrame(element, to, frameCount);
      return true;
    }
    const steps = Math.max(1, Math.abs(to - from));
    const offset = value => (value / (frameCount - 1) * 100) + '%';
    try {
      const animation = element.animate(
        [{ backgroundPositionY: offset(from) }, { backgroundPositionY: offset(to) }],
        { duration: steps * millisecondsPerFrame, easing: 'steps(' + steps + ', end)', fill: 'forwards' }
      );
      await animation.finished;
      animation.cancel();
    } catch (_) { /* The static final frame remains a fully usable fallback. */ }
    setSpriteFrame(element, to, frameCount);
    return true;
  }
  function loadSpritesWhenVisible(scope) {
    const sprites = Array.from(scope.querySelectorAll('[data-lazy-sprite]'));
    if (!sprites.length) return;
    if (typeof root.IntersectionObserver !== 'function') {
      sprites.forEach(element => { ensureSpriteLoaded(element); });
      return;
    }
    const observer = new root.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        ensureSpriteLoaded(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '160px' });
    sprites.forEach(element => observer.observe(element));
  }
  function getStore() {
    const progressionPage = document.querySelector('[data-progression-page]');
    if (progressionPage && progressionPage.__toadalProgressionStore) return progressionPage.__toadalProgressionStore;
    try {
      const api = root.ToadalGuestProgression;
      return api && api.createStore ? api.createStore({ storage: root.localStorage }) : null;
    } catch (_) { return null; }
  }
  function init() {
    const scope = document.querySelector('[data-home-discovery]');
    if (!scope || scope.dataset.interactionReady === 'true') return;
    const store = getStore();
    if (!store) {
      root.addEventListener('toadal:guest-progression-ready', init, { once: true });
      return;
    }
    scope.dataset.interactionReady = 'true';
    const base = siteBase();
    const portalButton = scope.querySelector('[data-home-portal]');
    const portalStatus = scope.querySelector('[data-portal-status]');
    const blockButton = scope.querySelector('[data-golden-block-hit]');
    const blockArt = scope.querySelector('[data-golden-block-art]');
    const blockStatus = scope.querySelector('[data-golden-block-status]');
    const thirdCandy = scope.querySelector('[data-home-candy-reveal]');
    const chestButton = document.querySelector('[data-claim-daily]');
    const chestArt = document.querySelector('[data-daily-chest-art]');
    const burstArt = document.querySelector('[data-daily-burst-art]');
    const genieCards = Array.from(document.querySelectorAll('.genie-row [data-discover-character]'));
    const passport = document.querySelector('[data-home-explorer-passport]');

    function renderExplorerPassport() {
      if (!passport) return;
      const summary = passport.querySelector('[data-home-passport-summary]');
      const list = passport.querySelector('[data-home-passport-list]');
      const link = passport.querySelector('[data-home-passport-link]');
      if (!summary || !list || !link) return;
      let snapshot;
      try { snapshot = store.getSnapshot(); } catch (_) { snapshot = null; }
      const storage = snapshot && snapshot.storage;
      const readOnly = storage && Array.isArray(storage.readOnlyKeys) &&
        (storage.readOnlyKeys.includes('toadal:web:v1:quests') || storage.readOnlyKeys.includes('toadal:web:v1:pass'));
      const validStorage = storage && storage.scope === 'browser' && storage.persistent === true && !readOnly;
      const rows = snapshot && Array.isArray(snapshot.quests)
        ? snapshot.quests.filter(quest => quest && quest.group === 'exploration') : null;
      const seen = new Set();
      const validRows = Array.isArray(rows) && rows.every(quest => {
        if (typeof quest.id !== 'string' || seen.has(quest.id) || typeof quest.title !== 'string' ||
            !Number.isSafeInteger(quest.progress) || quest.progress < 0 ||
            !Number.isSafeInteger(quest.target) || quest.target < 1 ||
            typeof quest.complete !== 'boolean' || quest.complete !== (quest.progress >= quest.target) ||
            (quest.claimedAt != null && typeof quest.claimedAt !== 'string') ||
            (quest.claimedAt && !quest.complete)) return false;
        seen.add(quest.id);
        return true;
      });
      while (list.firstChild) list.removeChild(list.firstChild);
      if (!validStorage || !validRows) {
        passport.setAttribute('data-home-passport-state', 'unavailable');
        summary.textContent = storage && storage.scope === 'browser'
          ? 'Saved exploration progress is unavailable; no empty state is assumed.'
          : 'This tab cannot confirm saved exploration progress.';
        link.textContent = 'Open quest board';
        link.setAttribute('href', (siteBase() || '') + '/feast-pass/quests/');
        return;
      }
      const claimed = rows.filter(quest => Boolean(quest.claimedAt));
      const ready = rows.filter(quest => quest.complete && !quest.claimedAt);
      passport.setAttribute('data-home-passport-state', 'available');
      summary.textContent = ready.length
        ? ready.length + ' exploration ' + (ready.length === 1 ? 'reward is' : 'rewards are') + ' ready to claim.'
        : rows.length ? claimed.length + ' of ' + rows.length + ' exploration activities claimed.'
          : 'No exploration activities are configured.';
      link.textContent = ready.length ? 'Review ready rewards' : 'Open quest board';
      link.setAttribute('href', (siteBase() || '') + (ready.length ? '/feast-pass/quests/?view=ready' : '/feast-pass/quests/'));
      rows.forEach(quest => {
        const state = quest.claimedAt ? 'claimed' : quest.complete ? 'ready' : 'active';
        const stateLabel = state === 'ready' ? 'Ready to claim' : state === 'claimed' ? 'Claimed' : 'Active';
        const item = document.createElement('li');
        item.className = 'home-explorer-passport__activity';
        item.setAttribute('data-passport-activity', quest.id);
        item.setAttribute('data-passport-state', state);
        const title = document.createElement('span');
        title.className = 'home-explorer-passport__activity-title';
        title.textContent = quest.title;
        const status = document.createElement('span');
        status.className = 'home-explorer-passport__activity-status';
        status.textContent = stateLabel + ' · ' + quest.progress + '/' + quest.target;
        item.append(title, status);
        list.appendChild(item);
      });
    }

    function render() {
      if (!store) return;
      renderExplorerPassport();
      const state = store.getHomeInteractionState();
      document.querySelectorAll('[data-home-candy]').forEach(button => {
        const found = state.candies.includes(button.getAttribute('data-home-candy'));
        button.setAttribute('aria-pressed', String(found));
        button.dataset.collected = String(found);
        button.disabled = found || state.readOnly;
        const label = button.querySelector('[data-home-candy-label]');
        if (label) label.textContent = found ? 'Found · saved in this browser' : button.dataset.prompt || 'Find this candy';
      });
      if (blockArt) {
        const frame = state.goldenBlock.hits ? BLOCK_FRAME_ENDS[state.goldenBlock.hits - 1] : 0;
        if (blockArt.dataset.spriteLoaded === 'true') setSpriteFrame(blockArt, frame, 25);
      }
      if (blockButton) {
        blockButton.disabled = state.goldenBlock.complete || state.readOnly;
        blockButton.setAttribute('aria-label', state.goldenBlock.complete
          ? 'Golden Block broken; all four hits complete'
          : 'Hit the Golden Block, ' + state.goldenBlock.hits + ' of 4');
        const label = blockButton.querySelector('[data-golden-block-label]');
        if (label) label.textContent = state.goldenBlock.complete ? 'Golden Block broken' : 'Tap to crack · ' + state.goldenBlock.hits + ' of 4 hits';
      }
      if (thirdCandy) thirdCandy.hidden = !state.goldenBlock.complete;
      if (state.readOnly && blockStatus) blockStatus.textContent = 'Stored discovery data could not be safely read, so it was left untouched.';
      const foundCharacters = new Set((store.getSnapshot().characterDiscoveries || []).map(item => item.characterId));
      genieCards.forEach(card => {
        const found = foundCharacters.has(card.getAttribute('data-discover-character'));
        card.setAttribute('aria-disabled', String(found));
        const status = card.querySelector('[data-character-discovery-status]');
        if (status) status.textContent = found ? 'Discovered in this browser' : 'Not discovered in this browser';
      });
      const daily = store.getSnapshot().daily;
      if (chestButton) chestButton.dataset.dailyClaimed = String(Boolean(daily.claimed));
      if (chestArt && daily.claimed) {
        chestArt.dataset.chestOpen = 'true';
        if (chestArt.dataset.spriteLoaded === 'true') setSpriteFrame(chestArt, 6, 7);
      }
    }

    function activatePortal(event) {
      event.preventDefault();
      if (!portalButton || portalButton.disabled) return;
      const current = relativePath(root.location && root.location.pathname, base);
      const choices = SAFE_DESTINATIONS.filter(path => relativePath(path, '') !== current);
      if (!choices.length) {
        if (portalStatus) portalStatus.textContent = 'No safe destination is available from this page.';
        return;
      }
      const random = Math.max(0, Math.min(0.999999, Number(root.Math.random()) || 0));
      const route = choices[Math.floor(random * choices.length)];
      let target;
      try { target = new root.URL((base || '') + route, root.location.href); }
      catch (_) { return; }
      if (target.origin !== root.location.origin || !SAFE_DESTINATIONS.includes(relativePath(target.pathname, base))) return;
      portalButton.disabled = true;
      portalButton.setAttribute('aria-busy', 'true');
      portalButton.dataset.portalState = 'activated';
      actionCopy(portalButton, 'Toadal is sending you to ' + route.replace(/\/$/, '').slice(1) + '.');
      if (portalStatus) portalStatus.textContent = reducedMotion() ? 'Opening a curated Feast destination…' : 'The portal is opening a curated Feast destination…';
      emit('toadal:portal-used', { path: target.pathname });
      dispatchAfter(reducedMotion() ? 0 : 650, () => {
        try { root.location.assign(target.href); }
        catch (_) {
          if (portalStatus) portalStatus.textContent = 'The destination could not be opened. Use the site navigation instead.';
          portalButton.disabled = false;
          portalButton.removeAttribute('aria-busy');
        }
      });
    }

    function collectCandy(event) {
      const button = event.currentTarget;
      if (!store || button.disabled) return;
      const id = button.getAttribute('data-home-candy');
      const result = store.collectHomeCandy(id);
      if (result.ok) {
        const copy = id === 'lower-page-candy' ? 'A Feast candy was found in the mobile-app story.' : 'A little blue Feast candy was found.';
        actionCopy(button, copy + ' It is saved only in this browser.');
        emit('toadal:candy-found', { id: id, count: result.state.candies.length });
      } else {
        actionCopy(button, result.reason === 'storage-unavailable' ? 'The candy appeared, but this browser could not save it.' : 'This Feast candy is already recorded in this browser.');
      }
      render();
    }

    function discoverGenie(event) {
      const card = event.currentTarget;
      if (!store || !card) return;
      const characterId = card.getAttribute('data-discover-character');
      const snapshot = store.getSnapshot();
      if ((snapshot.characterDiscoveries || []).some(item => item.characterId === characterId)) {
        render();
        return;
      }
      const result = store.discoverCharacter(characterId);
      const name = card.querySelector('.genie-discovery-name')?.textContent.trim() || 'Feast Genie';
      actionCopy(card, result.ok
        ? name + ' artwork discovery was saved in this browser. No reward or game completion is implied.'
        : result.reason === 'already-discovered'
          ? name + ' artwork is already discovered in this browser.'
          : name + ' artwork could not be saved. Check browser storage and retry.');
      if (result.ok) emit('toadal:character-artwork-discovered', { characterId });
      render();
    }

    async function hitGoldenBlock(event) {
      event.preventDefault();
      if (!store || !blockButton || blockButton.disabled || blockButton.dataset.animating === 'true') return;
      const before = store.getHomeInteractionState();
      const result = store.hitGoldenBlock();
      if (!result.ok) {
        if (blockStatus) blockStatus.textContent = result.reason === 'storage-unavailable' ? 'This browser could not save the block state.' : 'The Golden Block is not available for another hit.';
        render();
        return;
      }
      const hit = result.state.goldenBlock.hits;
      const from = hit === 1 ? 0 : BLOCK_FRAME_ENDS[hit - 2];
      const to = BLOCK_FRAME_ENDS[hit - 1];
      const complete = result.state.goldenBlock.complete;
      actionCopy(blockButton, complete ? 'Toadal celebrates: the Golden Block is broken and the last candy is revealed.' : 'Toadal cheers as the Golden Block cracks, hit ' + hit + ' of 4.');
      blockButton.dataset.animating = 'true';
      blockButton.disabled = true;
      if (blockStatus) blockStatus.textContent = 'Golden Block hit ' + hit + ' of 4.';
      emit('toadal:golden-block-hit', { hit: hit, complete: complete });
      await animateSprite(blockArt, 25, from, to, 38);
      blockButton.dataset.animating = 'false';
      if (complete) {
        if (blockStatus) blockStatus.textContent = 'Golden Block broken. The final candy is revealed; tap it to collect it in this browser.';
        emit('toadal:golden-block-broken', { hits: 4, candyAvailable: 'golden-block-candy' });
      } else if (blockStatus) blockStatus.textContent = 'The block is cracked. ' + (4 - hit) + ' deliberate ' + (4 - hit === 1 ? 'hit remains.' : 'hits remain.');
      if (hit === before.goldenBlock.hits + 1) render();
    }

    async function openDailyChest(event) {
      if (!chestButton) return;
      chestButton.dataset.dailyClaimed = 'true';
      actionCopy(chestButton, 'Today’s existing UTC-day check-in was claimed on this browser. It is not linked to the mobile game.');
      if (burstArt) burstArt.hidden = false;
      emit('toadal:daily-chest-opened', { period: event && event.detail && event.detail.period || null });
      await animateSprite(chestArt, 7, 0, 6, 95);
      if (chestArt) chestArt.dataset.chestOpen = 'true';
      if (burstArt) {
        await animateSprite(burstArt, 8, 0, 7, 65);
        dispatchAfter(800, () => { burstArt.hidden = true; });
      }
    }

    if (portalButton) portalButton.addEventListener('click', activatePortal);
    document.querySelectorAll('[data-home-candy]').forEach(button => button.addEventListener('click', collectCandy));
    genieCards.forEach(card => {
      card.addEventListener('click', discoverGenie);
      card.addEventListener('touchend', discoverGenie, { passive: true });
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
        if (event.preventDefault) event.preventDefault();
        discoverGenie(event);
      });
    });
    if (blockButton) blockButton.addEventListener('click', hitGoldenBlock);
    function refreshFromBrowser() {
      try { if (typeof store.refreshFromStorage === 'function') store.refreshFromStorage(); } catch (_) {}
      render();
    }
    root.addEventListener('storage', event => {
      try { if (event.storageArea === root.localStorage) refreshFromBrowser(); } catch (_) {}
    });
    root.addEventListener('focus', refreshFromBrowser);
    root.addEventListener('pageshow', event => { if (event.persisted) refreshFromBrowser(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshFromBrowser();
    });
    root.addEventListener('toadal:discovery-sprite-ready', render);
    root.addEventListener('toadal:daily-checkin-claimed', openDailyChest);
    loadSpritesWhenVisible(scope);
    if (chestArt && !scope.contains(chestArt)) loadSpritesWhenVisible(chestArt.parentElement || document);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(typeof globalThis !== 'undefined' ? globalThis : this);
