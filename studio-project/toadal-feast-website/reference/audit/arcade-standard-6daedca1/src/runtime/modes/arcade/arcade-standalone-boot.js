// ============================================================
// src/runtime/modes/arcade/arcade-standalone-boot.js — Arcade-only host with the familiar
// Froggy Feast menu surface. Puzzle and Feastfall are never imported.
// ============================================================

const ArcadeStandalone = (() => {
  let menu = null;
  let pause = null;
  let result = null;
  let activeView = 'home';
  let menuOpenedFromPause = false;
  let mobileControlHost = null;
  let startPending = false;
  let runSurfaceGeneration = 0;
  let menuOwnsSurface = false;
  let arcadeRunActive = false;

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const text = value => String(value ?? '');
  const score = value => Math.max(0, Math.floor(Number(value) || 0));
  const format = value => score(value).toLocaleString();
  const escapeHtml = value => text(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const themedText = (key, fallback, values = {}) => typeof ThemeSystem !== 'undefined' && typeof ThemeSystem.format === 'function'
    ? ThemeSystem.format(key, values, fallback)
    : String(fallback || '');
  const catalogPresentation = (kind, item) => typeof ThemeSystem !== 'undefined' && typeof ThemeSystem.presentCatalogItem === 'function'
    ? ThemeSystem.presentCatalogItem(kind, item)
    : { name: item?.name || '', description: item?.desc || item?.description || '' };
  const currencyLabel = () => typeof ThemeSystem !== 'undefined' && typeof ThemeSystem.role === 'function'
    ? ThemeSystem.role('currency', 'plural', 'coins')
    : 'coins';

  const arcadeModeDefaults = Object.freeze({
    catchSounds: true,
    missSounds: true,
    actionSounds: true,
    haptics: true,
    visualIntensity: 'full',
  });

  function arcadeModeSettings() {
    if (globalThis.ArcadeHostIntegration?.getModeSettings) return globalThis.ArcadeHostIntegration.getModeSettings();
    try {
      const raw = localStorage.getItem('froggyFeast.arcade.modeSettings.v1');
      return { ...arcadeModeDefaults, ...(raw ? JSON.parse(raw) : {}) };
    } catch (_) {
      return { ...arcadeModeDefaults };
    }
  }

  function setArcadeModeSetting(key, value) {
    const patch = { [key]: value };
    const next = globalThis.ArcadeHostIntegration?.setModeSettings
      ? globalThis.ArcadeHostIntegration.setModeSettings(patch)
      : { ...arcadeModeSettings(), ...patch };
    if (!globalThis.ArcadeHostIntegration?.setModeSettings) {
      try { localStorage.setItem('froggyFeast.arcade.modeSettings.v1', JSON.stringify(next)); } catch (_) { /* optional storage */ }
    }
    globalThis.ArcadeHostIntegration?.applyModeSettings?.(next);
    applyArcadeRuntimePreferences();
    return next;
  }

  function arcadeRunIsActive() {
    const current = String(GameState?.currentMode || '').toLowerCase();
    const state = GameState?.mode;
    return arcadeRunActive || (['standard', 'tc', 'fmf', 'zen'].includes(current)
      && [GAME_MODES.PLAYING, GAME_MODES.PAUSED, GAME_MODES.DEAD].includes(state));
  }

  function applyArcadeRuntimePreferences() {
    const preferences = arcadeModeSettings();
    globalThis.ArcadeHostIntegration?.applyModeSettings?.(preferences);
    const reduced = preferences.visualIntensity !== 'full';
    document.documentElement?.classList?.toggle('arcade-less-flashy', reduced);
    document.documentElement?.setAttribute?.('data-arcade-visual-intensity', preferences.visualIntensity);
    return preferences;
  }

  function installArcadeRuntimeGates() {
    const manager = typeof AudioManager !== 'undefined' ? AudioManager : null;
    if (manager && !manager.__arcadeContextGatesInstalled) {
      const groups = {
        catchSounds: ['catch', 'catchForCombo', 'foodTexture'],
        missSounds: ['miss', 'bomb'],
        actionSounds: ['tongue', 'heart', 'powerup', 'levelup', 'levelUp'],
      };
      Object.entries(groups).forEach(([setting, methods]) => methods.forEach(method => {
        const original = manager[method];
        if (typeof original !== 'function') return;
        try {
          manager[method] = function (...args) {
            if (arcadeRunIsActive() && arcadeModeSettings()[setting] === false) return undefined;
            return original.apply(this, args);
          };
        } catch (_) { /* an alternate host may expose a read-only audio facade */ }
      }));
      try { manager.__arcadeContextGatesInstalled = true; } catch (_) {}
    }
    const fx = typeof FXManager !== 'undefined' ? FXManager : null;
    if (fx && typeof fx.spawnParticles === 'function' && !fx.__arcadeContextGateInstalled) {
      const originalParticles = fx.spawnParticles.bind(fx);
      try {
        fx.spawnParticles = function (entities, x, y, color, count = 12) {
          if (arcadeRunIsActive() && arcadeModeSettings().visualIntensity !== 'full') {
            const intensity = arcadeModeSettings().visualIntensity;
            if (intensity === 'minimal' && Number(count) <= 6) return;
            return originalParticles(entities, x, y, color, Math.max(2, Math.ceil(Number(count) * (intensity === 'minimal' ? 0.15 : 0.35))));
          }
          return originalParticles(entities, x, y, color, count);
        };
        fx.__arcadeContextGateInstalled = true;
      } catch (_) {}
    }
    const navigatorObject = typeof navigator !== 'undefined' ? navigator : null;
    if (navigatorObject && typeof navigatorObject.vibrate === 'function' && !navigatorObject.__arcadeContextHapticGate) {
      const originalVibrate = navigatorObject.vibrate.bind(navigatorObject);
      try {
        navigatorObject.vibrate = pattern => {
          if (arcadeRunIsActive() && arcadeModeSettings().haptics === false) return false;
          return originalVibrate(pattern);
        };
        navigatorObject.__arcadeContextHapticGate = true;
      } catch (_) {}
    }
  }
  const cosmeticVisualMarkup = (item, className = '') => {
    const safeClass = String(className || '').replace(/[^a-zA-Z0-9_\-\s]/g, '');
    if (item?.previewSrc) {
      return `<img src="${escapeHtml(item.previewSrc)}" class="${safeClass}" alt="${escapeHtml(item.name || 'Cosmetic preview')}" loading="lazy" onerror="this.onerror=null;this.hidden=true;">`;
    }
    if (typeof ArcadeVisuals !== 'undefined' && typeof ArcadeVisuals.cosmeticIconMarkup === 'function') {
      return ArcadeVisuals.cosmeticIconMarkup(item, safeClass);
    }
    const fallback = 'assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-cosmetic.png';
    return `<img src="${fallback}" class="${safeClass}" alt="${escapeHtml(item?.name || 'Cosmetic preview')}" loading="lazy" decoding="async" onerror="this.onerror=null;this.hidden=true;">`;
  };

  function installOptionalShellStubs() {
    if (typeof globalThis.hidePanels !== 'function') globalThis.hidePanels = () => {};
    if (typeof globalThis.updateMenuCoins !== 'function') globalThis.updateMenuCoins = () => {};
    if (typeof globalThis.buildLeaderboard !== 'function') globalThis.buildLeaderboard = () => {};
  }

  function refreshPauseAudioLabel() {
    const button = document.querySelector('#arcadeStandalonePause [data-standalone-audio-button]');
    if (button && typeof StandaloneAudio !== 'undefined') StandaloneAudio.syncButton?.(button);
  }

  function canOpenPause() {
    return !menu?.isOpen() && GameState?.mode === GAME_MODES.PLAYING;
  }

  function touchPrimary() {
    const coarsePrimary = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
    const touchOnlyHover = Boolean(Number(navigator.maxTouchPoints || 0) > 0
      && window.matchMedia?.('(hover: none)')?.matches);
    return coarsePrimary || touchOnlyHover;
  }

  function activeMobileRequirements() {
    const charDef = typeof getCharDef === 'function' ? getCharDef() : null;
    const profile = charDef && typeof getArcadeCharacterBehaviorProfile === 'function'
      ? getArcadeCharacterBehaviorProfile(charDef)
      : null;
    return profile?.mobileControlRequirements || [];
  }

  // Generic multi-action descriptor surface. Characters that need more than the
  // legacy single contextual action can provide action slots without forking the
  // touch runtime. Existing characters return an empty list and keep legacy UI.
  function activeMobileActions() {
    const requirements = activeMobileRequirements();
    const actions = [];
    if (requirements.includes('toadal-tongue') || requirements.includes('toadal-crouch-hop') || requirements.includes('toadal-throw') || requirements.includes('toadal-block')) {
      const snapshot = typeof ArcadeToadalMechanics !== 'undefined'
        ? ArcadeToadalMechanics.snapshot()
        : { charge:0, grounded:false, blockCount:0, throwActive:false, buildActive:false };
      const rules = typeof ArcadeToadalMechanics !== 'undefined' ? ArcadeToadalMechanics.CONFIG : {};
      const charge = Math.max(0, Number(snapshot.charge || 0));
      const max = Math.max(1, Number(rules.maxCharge || 100));
      let placement = { ok:false, reason:'UNAVAILABLE' };
      try { placement = ArcadeToadalMechanics?.placementCandidate?.() || placement; } catch (_) {}
      const busy = Boolean(snapshot.throwActive || snapshot.buildActive);
      const crouchBusy = Boolean(snapshot.crouchHeld);
      const resource = Object.freeze({
        label:'GOLDEN', value:charge, max,
        threshold:Number(rules.throwCost || 45),
        fullThreshold:Number(rules.blockCost || 100),
      });
      actions.push(Object.freeze({
        slot:'primary', id:'toadal-tongue', kind:'event', event:'shootPressed',
        label:'TONGUE', hint:'', aria:'Snap tongue', guide:'Tongue reaches farther; body catches build Golden Charge',
        visible:true, enabled:!busy && !crouchBusy,
        deniedReason:crouchBusy ? 'CHARGING HOP' : (busy ? 'BUSY' : ''), resource,
      }));
      actions.push(Object.freeze({
        slot:'secondary', id:'toadal-throw', kind:'event', event:'toadalThrowPressed',
        label:'THROW', hint:'', aria:`Golden Throw, costs ${Number(rules.throwCost || 45)} Golden Charge`,
        guide:'Golden Throw pierces catches until a hazard', visible:true,
        enabled:charge >= Number(rules.throwCost || 45) && !busy && !crouchBusy,
        deniedReason:charge < Number(rules.throwCost || 45) ? `${Number(rules.throwCost || 45)} GOLD` : (crouchBusy ? 'CHARGING HOP' : (busy ? 'BUSY' : '')), resource,
      }));
      actions.push(Object.freeze({
        slot:'tertiary', id:'toadal-block', kind:'event', event:'toadalBlockPressed',
        label:'BLOCK', hint:'', aria:`Build Golden Block, costs ${Number(rules.blockCost || 100)} Golden Charge`,
        guide:'Build a stackable Golden Block', visible:true,
        enabled:charge >= Number(rules.blockCost || 100) && Boolean(placement.ok) && !busy && !crouchBusy,
        deniedReason:charge < Number(rules.blockCost || 100) ? `${Number(rules.blockCost || 100)} GOLD` : (crouchBusy ? 'CHARGING HOP' : (placement.reason || 'BLOCKED')), resource,
      }));
    }
    return actions;
  }

  function mobileActionForSlot(slot) {
    return activeMobileActions().find(action => action.slot === slot) || null;
  }

  function pulseDeniedMobileAction(slot, descriptor) {
    const ids = { primary:'mobShoot', secondary:'mobActionSecondary', tertiary:'mobActionTertiary' };
    const button = document.getElementById(ids[slot] || '');
    if (button) {
      button.classList.remove('mob-action--denied');
      // Force a style flush so repeated denied taps replay the short feedback.
      void button.offsetWidth;
      button.classList.add('mob-action--denied');
      setTimeout(() => button.classList.remove('mob-action--denied'), 180);
    }
    try { navigator.vibrate?.(8); } catch (_) {}
    EventBus.emit('arcadeMobileActionDenied', {
      source:'mobile', actionId:descriptor?.id || '', slot,
      reason:String(descriptor?.deniedReason || descriptor?.hint || 'UNAVAILABLE'),
    });
  }

  function dispatchMobileAction(slot, phase = 'press') {
    if (GameState.mode !== GAME_MODES.PLAYING) return false;
    const descriptor = mobileActionForSlot(slot);
    if (descriptor) {
      if (phase === 'press' && descriptor.enabled === false) {
        pulseDeniedMobileAction(slot, descriptor);
        setTimeout(updateMobileControls, 0);
        return true;
      }
      if (phase === 'press') EventBus.emit(descriptor.event, { source:'mobile', actionId:descriptor.id });
      setTimeout(updateMobileControls, 0);
      return true;
    }
    if (slot !== 'primary') return false;
    const requirements = activeMobileRequirements();
    const cloneAction = requirements.includes('clone-pickup') || requirements.includes('clone-place');
    if (phase === 'press') {
      if (cloneAction) {
        if (GameState.charState?.flytrap?.cloneHeld) EventBus.emit('clonePlace');
        else EventBus.emit('clonePickup');
      } else {
        EventBus.emit('shootPressed');
        EventBus.emit('spaceDown');
      }
    } else if (!cloneAction) {
      EventBus.emit('spaceUp');
    }
    setTimeout(updateMobileControls, 0);
    return true;
  }

  function setMobileControlsVisible(visible) {
    const requirements = activeMobileRequirements();
    if (mobileControlHost) {
      return mobileControlHost.update({ visible:Boolean(visible), requirements });
    }
    const controls = document.getElementById('mobileControls');
    if (!controls) return false;
    const show = Boolean(visible && touchPrimary());
    controls.classList.toggle('visible', show);
    controls.setAttribute('aria-hidden', show ? 'false' : 'true');
    if ('inert' in controls) controls.inert = !show;
    document.body.classList.toggle('arcade-mobile-controls-visible', show);
    if (!show) InputManager?.clearTransientInput?.();
    return show;
  }

  function updateMobileControls() {
    const visible = GameState?.mode === GAME_MODES.PLAYING && !pause?.isOpen() && !menu?.isOpen();
    return setMobileControlsVisible(visible);
  }

  function wireMobileButton(id, onDown, onUp, onCancel) {
    const button = document.getElementById(id);
    if (!button) return;
    let activePointerId = null;
    const release = event => {
      if (activePointerId === null) return;
      if (event?.pointerId != null && event.pointerId !== activePointerId) return;
      event?.preventDefault?.();
      const releasedId = activePointerId;
      const cancelled = event?.type === 'pointercancel' || event?.type === 'lostpointercapture';
      activePointerId = null;
      button.classList.remove('mob-btn-pressed');
      if (cancelled && onCancel) onCancel();
      else onUp?.();
      try { if (!cancelled && releasedId !== null && button.hasPointerCapture?.(releasedId)) button.releasePointerCapture(releasedId); } catch (_) {}
    };
    button.addEventListener('pointerdown', event => {
      if (activePointerId !== null) return;
      event.preventDefault();
      event.stopPropagation();
      activePointerId = event.pointerId;
      AudioManager?.init?.();
      button.classList.add('mob-btn-pressed');
      try { button.setPointerCapture?.(event.pointerId); } catch (_) {}
      onDown?.();
    }, { passive:false });
    button.addEventListener('pointerup', release, { passive:false });
    button.addEventListener('pointercancel', release, { passive:false });
    button.addEventListener('lostpointercapture', release, { passive:false });
    button.addEventListener('contextmenu', event => event.preventDefault());
  }

  function wireMobileControls() {
    const controls = document.getElementById('mobileControls');
    if (!controls) return;
    controls.setAttribute('aria-hidden', 'true');
    wireMobileButton('mobLeft', () => InputManager.setVirtualKey('ArrowLeft', true), () => InputManager.setVirtualKey('ArrowLeft', false));
    wireMobileButton('mobRight', () => InputManager.setVirtualKey('ArrowRight', true), () => InputManager.setVirtualKey('ArrowRight', false));
    wireMobileButton('mobShoot', () => dispatchMobileAction('primary', 'press'), () => dispatchMobileAction('primary', 'release'));
    wireMobileButton('mobActionSecondary', () => dispatchMobileAction('secondary', 'press'));
    wireMobileButton('mobActionTertiary', () => dispatchMobileAction('tertiary', 'press'));
    wireMobileButton('mobHop',
      () => InputManager.setVirtualKey('ArrowDown', true),
      () => InputManager.setVirtualKey('ArrowDown', false),
      () => {
        InputManager.setVirtualKey('ArrowDown', false);
        try { ArcadeToadalMechanics?.cancelCrouch?.('mobile-hop-cancel'); } catch (_) {}
      });
    wireMobileButton('mobPause', () => {
      if (GameState.mode === GAME_MODES.PLAYING) openPause();
      else if (GameState.mode === GAME_MODES.PAUSED) resumePause();
    });
    wireMobileButton('mobUp', () => {
      InputManager.setVirtualKey('ArrowUp', true);
      if (activeMobileRequirements().includes('clone-pickup')) EventBus.emit('clonePickup');
    }, () => InputManager.setVirtualKey('ArrowUp', false));
    wireMobileButton('mobDown', () => {
      InputManager.setVirtualKey('ArrowDown', true);
      if (activeMobileRequirements().includes('clone-place')) EventBus.emit('clonePlace');
    }, () => InputManager.setVirtualKey('ArrowDown', false));
    mobileControlHost = typeof FroggyMobileControls !== 'undefined'
      ? FroggyMobileControls.init({
          getRequirements: activeMobileRequirements,
          getActions: activeMobileActions,
          dispatchPrimaryAction: (phase) => dispatchMobileAction('primary', phase),
          getPlaying: () => GameState?.mode === GAME_MODES.PLAYING && !pause?.isOpen() && !menu?.isOpen(),
        })
      : null;
    EventBus.on('gameStarted', () => setTimeout(updateMobileControls, 0));
    EventBus.on('gameOver', () => setMobileControlsVisible(false));
    ['toadalChargeChanged','toadalChargeFull','toadalBlockCreated','toadalBlockRemoved','toadalLanded','toadalThrowStarted','toadalBuildStarted','toadalActionEnded','toadalBuildReadinessChanged','toadalActionDenied']
      .forEach(eventName => EventBus.on(eventName, () => setTimeout(updateMobileControls, 0)));
    window.addEventListener('resize', updateMobileControls, { passive:true });
    window.visualViewport?.addEventListener?.('resize', updateMobileControls, { passive:true });
    window.addEventListener('orientationchange', () => setTimeout(updateMobileControls, 180), { passive:true });
  }

  function openPause() {
    if (!canOpenPause()) return false;
    if (typeof pauseGame === 'function') pauseGame();
    refreshPauseAudioLabel();
    setMobileControlsVisible(false);
    pause?.show({
      title: themedText('menu.pause', 'Paused'),
      subtitle: themedText('menu.pauseHelp', 'Press Esc or tap Resume to continue'),
      focus: true,
    });
    return true;
  }

  function resumePause() {
    if (GameState?.mode === GAME_MODES.PAUSED && typeof resumeGame === 'function') resumeGame();
    pause?.hide({ restoreFocus: true });
    updateMobileControls();
    return GameState?.mode === GAME_MODES.PLAYING;
  }

  function returnToPause() {
    if (!menuOpenedFromPause) return false;
    menuOpenedFromPause = false;
    menu?.hide();
    refreshPauseAudioLabel();
    pause?.show({ title: themedText('menu.pause', 'Paused'), subtitle: themedText('menu.pauseHelp', 'Press Esc or tap Resume to continue'), focus: true });
    return true;
  }

  function openPanelFromPause(view) {
    if (!pause?.isOpen()) return false;
    pause.hide();
    menuOpenedFromPause = true;
    activeView = view;
    menu?.show({ message: 'Current run remains paused. Use Back or Esc to return to the pause menu.', focus: true });
    return true;
  }

  function onPauseAction(action) {
    if (action === 'pause') openPause();
    else if (action === 'resume') resumePause();
    else if (action === 'restart') {
      pause?.hide();
      start(GameState.currentMode || 'standard');
    } else if (action === 'audio') {
      StandaloneAudio?.toggleMuted?.();
      refreshPauseAudioLabel();
    } else if (action === 'settings') openPanelFromPause('settings');
    else if (action === 'change-character') openPanelFromPause('characters');
    else if (action === 'quit') showMenu();
  }

  function ownedCharacter(character, save = SaveManager.get()) {
    return (character.coinCost || 0) === 0 || (save.unlockedChars || []).includes(character.id);
  }

  function selectableCharacters() {
    return typeof getPlayerSelectableCharacters === 'function'
      ? getPlayerSelectableCharacters()
      : [];
  }

  // Phase 4: Arcade standalone must present the same merged catalog as the
  // full-game cosmetics panel. The resolver merges the approved native catalog
  // with reviewed generated visual-content records; retired items stay archived.
  function cosmeticCatalog() {
    if (typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getAllCosmeticDefinitions === 'function') {
      return ContentAssetResolver.getAllCosmeticDefinitions();
    }
    return typeof COSMETIC_DATA !== 'undefined' && Array.isArray(COSMETIC_DATA) ? COSMETIC_DATA : [];
  }

  function cosmeticDefinition(id) {
    const requested = String(id || '');
    if (typeof ContentAssetResolver !== 'undefined' && typeof ContentAssetResolver.getCosmeticDefinition === 'function') {
      return ContentAssetResolver.getCosmeticDefinition(requested);
    }
    return cosmeticCatalog().find(item => item.id === requested) || null;
  }

  function ownsCosmetic(item, save = SaveManager.get()) {
    if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.isUnlocked === 'function') {
      return ContentUnlockResolver.isUnlocked(item, save);
    }
    return !!item && (!Number(item.coinCost || 0) || (save.unlockedCosmetics || []).includes(item.id));
  }

  function canPurchaseCosmetic(item, save = SaveManager.get()) {
    if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.canPurchase === 'function') {
      return ContentUnlockResolver.canPurchase(item, save);
    }
    return !!item && !ownsCosmetic(item, save) && Number(item.coinCost || 0) > 0;
  }

  function cosmeticCoinCost(item) {
    if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.getCoinCost === 'function') {
      return ContentUnlockResolver.getCoinCost(item);
    }
    const value = Number(item?.coinCost || 0);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function cosmeticUnlockLabel(item) {
    if (typeof ContentUnlockResolver !== 'undefined' && typeof ContentUnlockResolver.getUnlockLabel === 'function') {
      return ContentUnlockResolver.getUnlockLabel(item);
    }
    const cost = cosmeticCoinCost(item);
    return cost ? `Cost: ${cost}` : 'Included';
  }

  function ensureArcadeSelection() {
    const save = SaveManager.get();
    const candidate = selectableCharacters().find(character => character.id === save.selectedChar && ownedCharacter(character, save));
    const selected = candidate?.id || 'classic';
    if (save.selectedChar !== selected) SaveManager.set(data => { data.selectedChar = selected; });
    GameState.selectedCharacterId = selected;
  }

  function selectedCharacter(save = SaveManager.get()) {
    const canonical = typeof canonicalCharacterId === 'function' ? canonicalCharacterId(save.selectedChar) : save.selectedChar;
    return selectableCharacters().find(character => character.id === canonical) || CHARACTER_DATA.find(character => character.id === 'classic');
  }

  function showView(view = 'home') {
    activeView = view;
    const root = $('#arcadeStandaloneMenu');
    if (!root) return;
    root.querySelectorAll('[data-standalone-view]').forEach(node => {
      const visible = node.dataset.standaloneView === view;
      node.hidden = !visible;
      node.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if ('inert' in node) node.inert = !visible;
    });
    if (view === 'characters') renderCharacters();
    if (view === 'scores') renderScores();
    if (view === 'unlocks') renderUnlocks();
    if (view === 'cosmetics') renderCosmetics();
    if (view === 'shop') renderShop();
    if (view === 'settings') renderSettings();
    if (view === 'help') renderSelectedCharacterGuide();
    if (view === 'home') updateMenu();
    StandaloneMenu?.focusView?.(view);
    requestAnimationFrame(() => StandaloneMenu?.focusView?.(view));
    setTimeout(() => StandaloneMenu?.focusView?.(view), 50);
  }

  function updateMenu() {
    const save = SaveManager.get();
    const best = score(save.bestScore);
    const coins = typeof ProgressionManager !== 'undefined' ? ProgressionManager.getCoins() : score(save.coins);
    const bestEl = $('#arcadeStandaloneBest');
    const coinsEl = $('#arcadeStandaloneCoins');
    if (bestEl) bestEl.textContent = format(best);
    if (coinsEl) coinsEl.textContent = format(coins);
    renderSelectedCharacterGuide();
    $$('[data-arcade-mode]').forEach(button => {
      const modeId = button.dataset.arcadeMode;
      const unlocked = typeof isModeUnlocked === 'function' ? isModeUnlocked(modeId) : true;
      const threshold = Number(GAME_BALANCE?.modeUnlocks?.[modeId]) || 0;
      button.disabled = !unlocked;
      button.title = unlocked ? '' : `Reach ${format(threshold)} points in Standard to unlock.`;
      button.setAttribute('aria-label', unlocked ? button.textContent.trim() : `${button.textContent.trim()} locked; ${format(threshold)} best score needed`);
    });
  }


  function characterPlayerGuide(character) {
    const profile = typeof ArcadeCharacterBehaviorProfiles !== 'undefined'
      ? ArcadeCharacterBehaviorProfiles.get(character?.id)
      : null;
    const guide = profile?.playerGuide || { movement: 'Move left / right', action: 'Press Space', catch: 'Catch falling food' };
    return {
      movement: themedText(`arcade.characterGuide.${character?.id}.movement`, guide.movement),
      action: themedText(`arcade.characterGuide.${character?.id}.action`, guide.action),
      catch: themedText(`arcade.characterGuide.${character?.id}.catch`, guide.catch),
    };
  }

  function characterGuideMarkup(character) {
    const guide = characterPlayerGuide(character);
    return `<span class="familiar-guide" aria-label="${escapeHtml(`${guide.movement}. ${guide.action}. ${guide.catch}.`)}">
      <span>${escapeHtml(guide.movement)}</span><span>${escapeHtml(guide.action)}</span><span>${escapeHtml(guide.catch)}</span>
    </span>`;
  }

  function renderSelectedCharacterGuide() {
    const target = $('#arcadeStandaloneSelectedGuide');
    if (!target) return;
    const character = selectedCharacter();
    const presentation = catalogPresentation('characters', character);
    const guide = characterPlayerGuide(character);
    target.innerHTML = `<strong>${escapeHtml(presentation.name)}</strong><span>${escapeHtml(guide.movement)} · ${escapeHtml(guide.action)} · ${escapeHtml(guide.catch)}</span>`;
  }

  function characterPortraitHtml(character, cssClass = 'familiar-icon-img') {
    const src = character?.src || '';
    const alt = escapeHtml(character?.name || character?.id || 'Character');
    if (!src) return `<span class="${cssClass} char-portrait-missing" role="img" aria-label="${alt} portrait unavailable"></span>`;
    return `<img src="${escapeHtml(src)}" class="${cssClass}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.hidden=true;">`;
  }

  function renderCharacters() {
    const grid = $('#arcadeCharacterGrid');
    const note = $('#arcadeCharactersNote');
    if (!grid) return;
    const save = SaveManager.get();
    const coins = typeof ProgressionManager !== 'undefined' ? ProgressionManager.getCoins() : score(save.coins);
    const current = selectedCharacter(save);
    const currentPresentation = catalogPresentation('characters', current);
    const currentGuide = characterPlayerGuide(current);
    if (note) note.textContent = themedText('ui.selectedCharacter', `Selected: ${currentPresentation.name} · ${currentGuide.action} · ${format(coins)} ${currencyLabel()}`, {
      character: currentPresentation.name,
      currencyIcon: currencyLabel(),
      coins: format(coins),
    });
    const roster = selectableCharacters();
    grid.innerHTML = roster.map(character => {
      const presentation = catalogPresentation('characters', character);
      const guide = characterPlayerGuide(character);
      const owned = ownedCharacter(character, save);
      const selected = current.id === character.id;
      const action = owned ? 'select-character' : 'buy-character';
      const canAfford = coins >= score(character.coinCost);
      const stateLabel = selected ? themedText('ui.selected', 'Selected') : (owned ? themedText('ui.available', 'Available') : themedText('ui.locked', 'Locked'));
      const aria = `${presentation.name}. ${stateLabel}. ${guide.movement}. ${guide.action}. ${guide.catch}.`;
      return `<button type="button" class="familiar-card ${selected ? 'selected' : ''} ${owned ? '' : 'locked'}" data-standalone-action="${action}" data-character-id="${character.id}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${escapeHtml(aria)}" ${!owned && !canAfford ? 'disabled' : ''}>
        <span class="familiar-icon">${characterPortraitHtml(character)}</span><strong>${escapeHtml(presentation.name)}</strong>${selected ? `<span class="familiar-selected-badge">${escapeHtml(themedText('ui.selected', 'Selected'))}</span>` : ''}${characterGuideMarkup(character)}<small>${owned ? escapeHtml(presentation.description) : `${format(character.coinCost)} ${escapeHtml(currencyLabel())}`}</small>
      </button>`;
    }).join('');
    renderSelectedCharacterGuide();
  }

  function renderScores() {
    const stats = $('#arcadeScoreStats');
    const list = $('#arcadeScoreList');
    if (!stats || !list) return;
    const save = SaveManager.get();
    const gameStats = save.stats || {};
    stats.innerHTML = [
      [themedText('ui.bestScore', 'Best score'), format(save.bestScore)],
      [themedText('ui.bestLevel', 'Best level'), format(gameStats.highestLevel || 1)],
      [themedText('ui.collectiblesCaught', 'Food caught', { collectiblePlural: typeof ThemeSystem !== 'undefined' ? ThemeSystem.role('primaryCollectible', 'plural', 'Food') : 'Food' }), format(gameStats.totalFoodCaught)],
      [themedText('ui.gamesPlayed', 'Games played'), format(gameStats.totalGamesPlayed)],
    ].map(([label, value]) => `<div class="familiar-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
    const entries = [...(save.leaderboard || [])].filter(entry => entry && Number.isFinite(Number(entry.score))).sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 8);
    list.innerHTML = entries.length ? entries.map((entry, index) => {
      const char = CHARACTER_DATA.find(character => character.id === entry.charId) || null;
      const charName = char?.name || 'Unknown Character';
      return `<div class="familiar-row"><div class="familiar-row-icon familiar-row-character-icon">${characterPortraitHtml(char, 'familiar-row-icon-img')}</div><div class="familiar-row-copy"><strong>#${index + 1} · ${escapeHtml(charName)}</strong><span>${escapeHtml(entry.mode || 'Standard')} run</span></div><strong>${format(entry.score)}</strong></div>`;
    }).join('') : '<div class="familiar-row"><div class="familiar-row-copy"><strong>No scores yet</strong><span>Finish an Arcade run to add it here.</span></div></div>';
  }

  function renderUnlocks() {
    const stats = $('#arcadeUnlockStats');
    const list = $('#arcadeUnlockList');
    if (!stats || !list) return;
    const save = SaveManager.get();
    const roster = selectableCharacters();
    const owned = roster.filter(character => ownedCharacter(character, save)).length;
    const cosmetics = cosmeticCatalog();
    const ownedCosmetics = cosmetics.filter(item => ownsCosmetic(item, save)).length;
    stats.innerHTML = [
      ['Characters', `${owned} / ${roster.length}`],
      ['Cosmetics', `${ownedCosmetics} / ${cosmetics.length}`],
    ].map(([label, value]) => `<div class="familiar-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
    const modes = [
      ['FF', 'FEAST FRENZY', 'tc'],
      ['5M', '5 Minute Feast', 'fmf'],
      ['ZEN', 'Zen Garden', 'zen'],
    ];
    list.innerHTML = modes.map(([icon, label, id]) => {
      const threshold = Number(GAME_BALANCE?.modeUnlocks?.[id]) || 0;
      const unlocked = typeof isModeUnlocked === 'function' ? isModeUnlocked(id) : true;
      return `<div class="familiar-row"><div class="familiar-row-icon">${icon}</div><div class="familiar-row-copy"><strong>${label}</strong><span>${unlocked ? 'Unlocked and ready to play.' : `Reach ${format(threshold)} best score in Standard.`}</span></div><strong>${unlocked ? 'OK' : 'LOCKED'}</strong></div>`;
    }).join('');
  }

  function cosmeticSlot(item) {
    if (typeof cosmeticSlotForItem === 'function') return cosmeticSlotForItem(item);
    if (item?.slot) return item.slot;
    if (item?.type === 'background') return 'background';
    if (item?.type === 'skin') return 'skin';
    return 'hat';
  }


  function cosmeticApplies(item, charId) {
    return item.applicableTo?.includes('all') || item.applicableTo?.includes(charId);
  }

  function renderCosmetics() {
    const list = $('#arcadeCosmeticList');
    const note = $('#arcadeCosmeticsNote');
    if (!list) return;
    const save = SaveManager.get();
    const char = selectedCharacter(save);
    const coins = typeof ProgressionManager !== 'undefined' ? ProgressionManager.getCoins() : score(save.coins);
    const equipped = (save.equippedCosmetics || {})[char.id] || {};
    const items = cosmeticCatalog().filter(item => cosmeticApplies(item, char.id));
    const characterPresentation = catalogPresentation('characters', char);
    if (note) note.textContent = `${characterPresentation.name} · ${format(coins)} ${currencyLabel()} · ${themedText('menu.cosmetics', 'Cosmetics').toLowerCase()} ${themedText('ui.only', 'only')}`;
    list.innerHTML = items.length ? items.map(item => {
      const presentation = catalogPresentation('cosmetics', item);
      const owned = ownsCosmetic(item, save);
      const purchasable = canPurchaseCosmetic(item, save);
      const price = cosmeticCoinCost(item);
      const slot = cosmeticSlot(item);
      const active = equipped[slot] === item.id;
      const canAfford = price !== null && coins >= score(price);
      let actionHtml;
      if (owned) {
        actionHtml = `<button class="familiar-action" type="button" data-standalone-action="toggle-cosmetic" data-cosmetic-id="${item.id}">${escapeHtml(themedText(active ? 'ui.unequip' : 'ui.equip', active ? 'Unequip' : 'Equip'))}</button>`;
      } else if (purchasable) {
        actionHtml = `<button class="familiar-action" type="button" data-standalone-action="buy-cosmetic" data-cosmetic-id="${item.id}" ${canAfford ? '' : 'disabled'}>${escapeHtml(themedText('ui.buy', 'Buy'))} ${format(price)}</button>`;
      } else {
        actionHtml = `<span class="familiar-action-label">${escapeHtml(cosmeticUnlockLabel(item))}</span>`;
      }
      return `<div class="familiar-row familiar-row--cosmetic"><div class="familiar-row-icon familiar-row-icon--cosmetic">${cosmeticVisualMarkup(item, 'standalone-cosmetic-mark')}</div><div class="familiar-row-copy"><strong>${escapeHtml(presentation.name)}${active ? ` · ${escapeHtml(themedText('ui.equipped', 'Equipped'))}` : ''}</strong><span>${escapeHtml(presentation.description)}</span></div>${actionHtml}</div>`;
    }).join('') : `<div class="familiar-row"><div class="familiar-row-copy"><strong>${escapeHtml(themedText('ui.noCosmeticsForCharacter', 'No cosmetics for this character'))}</strong><span>${escapeHtml(themedText('ui.chooseAnotherCharacter', 'Choose another character'))}</span></div></div>`;
  }

  function renderShop() {
    const list = $('#arcadeShopList');
    if (!list) return;
    list.innerHTML = ITEM_SHOP_DATA.map(item => `<div class="familiar-row familiar-row--cosmetic"><div class="familiar-row-icon familiar-row-icon--cosmetic">${cosmeticVisualMarkup(item, 'standalone-cosmetic-mark')}</div><div class="familiar-row-copy"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.desc)} ${item.duration ? `${item.duration}s effect.` : ''}</span></div></div>`).join('');
  }

  function renderSettings() {
    const list = $('#arcadeSettingsList');
    if (!list) return;
    const settings = typeof SettingsManager !== 'undefined' ? SettingsManager.load() : {};
    const modeSettings = arcadeModeSettings();
    const options = [
      ['reduceMotion', 'Reduce motion', 'Less screen shake and particle motion.'],
      ['entityGlowEffects', 'Glow effects', 'Glow halo on bombs, hearts, suns, power-ups, and special frog states.'],
      ['missPenalty', 'Miss penalty', 'Food misses cost a Heart in Standard mode.'],
      ['hapticFeedback', 'Haptic feedback', 'Vibration feedback on supported touch devices.'],
      ['tutorialHints', 'Tutorial hints', 'Show first-time gameplay tips.'],
    ];
    const globalRows = options.map(([key, label, description]) => `<label class="familiar-toggle"><span><strong>${label}</strong><br><small>${description}</small></span><input type="checkbox" data-standalone-action="toggle-setting" data-setting-key="${key}" ${settings[key] ? 'checked' : ''}></label>`).join('');
    const modeRows = [
      ['catchSounds', 'Catch sounds', 'Food catch and texture cues for this Arcade run.'],
      ['missSounds', 'Miss / hazard sounds', 'Misses, bombs, and other hazard warnings.'],
      ['actionSounds', 'Character / action sounds', 'Tongue, hearts, power-ups, and character actions.'],
      ['haptics', 'Arcade haptics', 'Vibration feedback for Arcade catches, misses, and hazards.'],
    ].map(([key, label, description]) => `<label class="familiar-toggle arcade-context-toggle"><span><strong>${label}</strong><br><small>${description}</small></span><input type="checkbox" data-standalone-action="toggle-setting" data-setting-scope="arcade" data-setting-key="${key}" ${modeSettings[key] ? 'checked' : ''}></label>`).join('');
    const intensity = `<label class="familiar-toggle arcade-context-toggle"><span><strong>Visual intensity</strong><br><small>Reduced or minimal keeps the Arcade presentation calmer and less flashy.</small></span><select data-standalone-action="select-setting" data-setting-scope="arcade" data-setting-key="visualIntensity" aria-label="Arcade visual intensity"><option value="full" ${modeSettings.visualIntensity === 'full' ? 'selected' : ''}>Full</option><option value="reduced" ${modeSettings.visualIntensity === 'reduced' ? 'selected' : ''}>Reduced</option><option value="minimal" ${modeSettings.visualIntensity === 'minimal' ? 'selected' : ''}>Minimal</option></select></label>`;
    list.innerHTML = `<div class="arcade-settings-group"><h3 class="familiar-section-title">Arcade sound and feel</h3>${modeRows}${intensity}</div><div class="arcade-settings-group"><h3 class="familiar-section-title">Shared accessibility</h3>${globalRows}</div>`;
  }

  function stopActiveRunForMenu() {
    if (GameState.mode === GAME_MODES.PLAYING || GameState.mode === GAME_MODES.PAUSED || GameState.mode === GAME_MODES.DEAD) {
      if (typeof quitToMenu === 'function') {
        quitToMenu();
        // A scored quit routes through the shared banked-result pipeline and
        // lands on DEAD after the 'gameOver' economy/progression events have
        // already committed. The standalone menu owns the surface here and
        // suppresses that result overlay, so settle the scene to MENU — the
        // same terminal state as the zero-score quit path and the fallback
        // branch below.
        if (GameState.mode !== GAME_MODES.MENU && typeof SceneManager !== 'undefined' && SceneManager?.go) {
          SceneManager.go(GAME_MODES.MENU);
        }
      } else {
        if (typeof rafId !== 'undefined' && rafId) cancelAnimationFrame(rafId);
        if (typeof rafId !== 'undefined') rafId = null;
        GameState.mode = GAME_MODES.MENU;
        $('#canvasWrapper')?.classList.remove('active');
      }
    }
  }

  function showMenu(message = '') {
    // A deliberate mode exit wins over already-queued checkpoint/game-over
    // callbacks from the run being drained.
    menuOwnsSurface = true;
    runSurfaceGeneration += 1;
    installOptionalShellStubs();
    arcadeRunActive = false;
    applyArcadeRuntimePreferences();
    // Programmatic/developer transitions can bypass the result surface's own
    // Menu button. Always dismiss any stale result/checkpoint overlay before
    // exposing the standalone menu so a completed run cannot cover the next run.
    hideResult({ restoreFocus: false });
    menuOpenedFromPause = false;
    pause?.hide();
    stopActiveRunForMenu();
    AudioManager?.setMusicScene?.('menu');
    setMobileControlsVisible(false);
    showView('home');
    updateMenu();
    menu?.show({ message, focus: true });
    return true;
  }

  async function start(modeId = 'standard', options = {}) {
    if (startPending) return Object.freeze({ started:false, reason:'busy', mode:modeId });
    startPending = true;
    menuOwnsSurface = false;
    runSurfaceGeneration += 1;
    const menuRoot = document.getElementById('arcadeStandaloneMenu');
    menuRoot?.setAttribute('aria-busy', 'true');
    try {
      installOptionalShellStubs();
      // A direct start (character sweep, checkpoint jump, dev control, etc.) can
      // occur without clicking through the previous result UI. Clear it here as
      // part of the lifecycle boundary before the new game becomes PLAYING.
      hideResult({ restoreFocus: false });
      menuOpenedFromPause = false;
      pause?.hide();
      StandaloneAudio?.activate?.({ cue: true });
      AudioManager?.setMusicScene?.('arcade');
      ensureArcadeSelection();
      if (!GameModeRegistry?.[modeId]) modeId = 'standard';
      const webPreview = globalThis.ToadalArcadePreview;
      const previewProfile = webPreview?.getActiveProfile?.();
      const previewModeAllowed = Boolean(previewProfile && webPreview?.allowsExperience?.(modeId));
      if (previewModeAllowed) {
        const previewCharacterId = webPreview.characterForExperience(modeId);
        const previewCharacter = CHARACTER_DATA.find(character => character.id === previewCharacterId);
        if (!previewCharacter) {
          showMenu('This preview character is unavailable.');
          return Object.freeze({ started: false, reason: 'preview-character-unavailable', mode: modeId });
        }
        // The website owns its sampler unlocks. Grant only the selected
        // character in this opaque, non-persistent cartridge session; never
        // alter canonical character costs or mobile save data.
        SaveManager.set(data => {
          data.selectedChar = previewCharacterId;
          data.unlockedChars = [...new Set([...(data.unlockedChars || []), previewCharacterId])];
        });
        GameState.selectedCharacterId = previewCharacterId;
        if (typeof initPlayerSpriteRenderer === 'function') initPlayerSpriteRenderer(previewCharacterId);
      }
      try {
        const devCharacterId = new URLSearchParams(location.search).get('devCharacter');
        if (modeId === 'standard' && devCharacterId === 'toadal' && CHARACTER_DATA.some(character => character.id === 'toadal')) {
          GameState.selectedCharacterId = 'toadal';
        }
      } catch (_) {}
      if (!previewModeAllowed && typeof isModeUnlocked === 'function' && !isModeUnlocked(modeId)) {
        const threshold = Number(GAME_BALANCE?.modeUnlocks?.[modeId]) || 0;
        showMenu(`Reach ${format(threshold)} points in Standard mode to unlock this mode.`);
        return Object.freeze({ started: false, reason: 'locked', mode: modeId });
      }
      stopActiveRunForMenu();
      RuntimeState.lastTime = performance.now();
      menu?.hide();
      const started = await startGame(modeId, { showStartGate: options.showStartGate !== false });
      if (!started) {
        return Object.freeze({ started: false, reason: 'runtime-busy', mode: GameState.currentMode, state: GameState.mode });
      }
      return Object.freeze({ started: true, mode: GameState.currentMode, state: GameState.mode, character: (typeof getCharDef === 'function' ? getCharDef().id : GameState.selectedCharacterId) });
    } finally {
      startPending = false;
      if (!document.body.classList.contains('arcade-start-pending')) menuRoot?.removeAttribute('aria-busy');
    }
  }

  function selectCharacter(id) {
    const save = SaveManager.get();
    const canonical = typeof canonicalCharacterId === 'function' ? canonicalCharacterId(id) : id;
    const char = selectableCharacters().find(item => item.id === canonical);
    if (!char || !ownedCharacter(char, save)) return;
    SaveManager.set(data => { data.selectedChar = char.id; });
    GameState.selectedCharacterId = char.id;
    if (typeof initPlayerSpriteRenderer === 'function') initPlayerSpriteRenderer(char.id);
    renderCharacters();
    updateMenu();
  }

  function buyCharacter(id) {
    const result = ProgressionManager?.purchaseCharacter?.(id);
    if (!result?.ok) return;
    selectCharacter(id);
  }

  function buyCosmetic(id) {
    const result = ProgressionManager?.purchaseCosmetic?.(id);
    if (result?.ok) { renderCosmetics(); updateMenu(); }
  }

  function toggleCosmetic(id) {
    const item = cosmeticDefinition(id);
    if (!item) return;
    const save = SaveManager.get();
    const char = selectedCharacter(save);
    if (!cosmeticApplies(item, char.id) || !ownsCosmetic(item, save)) return;
    const slot = cosmeticSlot(item);
    SaveManager.set(data => {
      data.equippedCosmetics = data.equippedCosmetics || {};
      data.equippedCosmetics[char.id] = data.equippedCosmetics[char.id] || {};
      data.equippedCosmetics[char.id] = typeof resolveCosmeticEquip === 'function'
        ? resolveCosmeticEquip(data.equippedCosmetics[char.id], item, cosmeticDefinition)
        : (() => {
            const current = { ...data.equippedCosmetics[char.id] };
            if (current[slot] === id) delete current[slot]; else current[slot] = id;
            return current;
          })();
    });
    renderCosmetics();
  }

  function hideResult({ restoreFocus = false } = {}) {
    result?.hide?.({ restoreFocus });
  }

  function showRunResult(payload = {}) {
    if (menuOwnsSurface || GameState?.mode !== GAME_MODES.DEAD) return null;
    pause?.hide();
    menu?.hide();
    setMobileControlsVisible(false);
    const outcome = result?.show?.(payload) || null;
    if (!outcome) {
      // A missing result surface must never strand the player in DEAD state.
      showMenu(`Run complete · ${format(payload?.score)} points.`);
    }
    return outcome;
  }

  function showFeastCheckpoint(payload = {}) {
    if (menuOwnsSurface) return null;
    pause?.hide();
    menu?.hide();
    setMobileControlsVisible(false);
    const outcome = result?.showFeastCheckpoint?.(payload) || null;
    if (!outcome) {
      console.error('[ArcadeStandalone] Feast checkpoint UI was unavailable; continuing to Encore instead of leaving gameplay invisibly paused.');
      ArcadeFeastVictory?.continueToEncore?.();
    }
    return outcome;
  }

  function onResultAction(action, context = {}) {
    const payload = context.payload || {};
    const outcome = context.outcome || {};
    const source = context.source || null;
    if (action === 'encore') {
      hideResult();
      const resumed = ArcadeFeastVictory?.continueToEncore?.();
      if (!resumed && GameState?.mode === GAME_MODES.PAUSED) resumeGame?.();
      updateMobileControls();
      return;
    }
    if (action === 'finish-victory') {
      hideResult();
      if (!ArcadeFeastVictory?.finishVictorious?.()) showMenu('Feast complete.');
      return;
    }
    if (action === 'replay') {
      hideResult();
      start(payload.mode || GameState.currentMode || 'standard');
      return;
    }
    if (action === 'menu') {
      hideResult();
      if (!ArcadeHostIntegration?.returnToHost?.('result')) showMenu();
      return;
    }
    if (action === 'revenge') {
      const challenge = outcome.revengeChallenge || payload.revengeSummary?.current || null;
      const challengeId = String(source?.dataset?.challengeId || challenge?.id || '');
      const activated = ArcadeRevengeChallenges?.activate?.(challengeId);
      if (!activated?.ok) return;
      if (challenge?.characterId) selectCharacter(challenge.characterId);
      hideResult();
      start(challenge?.mode || payload.mode || 'standard');
      return;
    }
    if (action === 'dismiss-revenge') {
      const challenge = outcome.revengeChallenge || payload.revengeSummary?.current || null;
      ArcadeRevengeChallenges?.dismiss?.(source?.dataset?.challengeId || challenge?.id || '');
      const panel = document.getElementById('arcadeResultRevenge');
      if (panel) {
        panel.hidden = true;
        panel.classList.add('hidden');
      }
    }
  }

  function onMenuAction(action, element) {
    if (action === 'play-standard') start('standard');
    else if (action === 'play-mode') start(element.dataset.arcadeMode || 'standard');
    else if (action === 'back-home') {
      if (menuOpenedFromPause) returnToPause();
      else showView('home');
    }
    else if (action === 'open-characters') showView('characters');
    else if (action === 'open-scores') showView('scores');
    else if (action === 'open-unlocks') showView('unlocks');
    else if (action === 'open-cosmetics') showView('cosmetics');
    else if (action === 'open-shop') showView('shop');
    else if (action === 'open-settings') showView('settings');
    else if (action === 'open-help') showView('help');
    else if (action === 'select-character') selectCharacter(element.dataset.characterId);
    else if (action === 'buy-character') buyCharacter(element.dataset.characterId);
    else if (action === 'buy-cosmetic') buyCosmetic(element.dataset.cosmeticId);
    else if (action === 'toggle-cosmetic') toggleCosmetic(element.dataset.cosmeticId);
    else if (action === 'toggle-setting') {
      if (element.dataset.settingScope === 'arcade') setArcadeModeSetting(element.dataset.settingKey, !!element.checked);
      else if (typeof SettingsManager !== 'undefined') SettingsManager.set?.(element.dataset.settingKey, !!element.checked);
    }
    else if (action === 'select-setting' && element.dataset.settingScope === 'arcade') setArcadeModeSetting(element.dataset.settingKey, element.value);
  }

  function wire() {
    installOptionalShellStubs();
    installArcadeRuntimeGates();
    applyArcadeRuntimePreferences();
    if (typeof AssetManager !== 'undefined') AssetManager.init({ preloadCritical: true });
    if (typeof ArcadeSpriteRuntime !== 'undefined') ArcadeSpriteRuntime.init();
    StandaloneAudio?.init?.();
    wireMobileControls();
    menu = StandaloneMenu.init({
      rootId: 'arcadeStandaloneMenu',
      onAction: onMenuAction,
      onShow: () => { showView(menuOpenedFromPause ? activeView : 'home'); updateMenu(); },
      onEscape: () => menuOpenedFromPause ? returnToPause() : false,
    });
    pause = StandalonePause.init({
      rootId: 'arcadeStandalonePause',
      canOpen: canOpenPause,
      onAction: onPauseAction,
      onShow: refreshPauseAudioLabel,
    });
    result = typeof ArcadeResultUI !== 'undefined'
      ? ArcadeResultUI.init({ onAction: onResultAction })
      : null;
    $('#arcadeStandaloneMenuButton')?.addEventListener('click', () => {
      if (!openPause()) showMenu();
    });
    $('#arcadeStandaloneRestart')?.addEventListener('click', () => start(GameState.currentMode || 'standard'));
    EventBus.on('feastVictoryCheckpoint', payload => {
      const generation = runSurfaceGeneration;
      window.setTimeout(() => {
        if (generation !== runSurfaceGeneration || menuOwnsSurface) return;
        showFeastCheckpoint(payload);
      }, 0);
    });
    EventBus.on('gameOver', payload => {
      arcadeRunActive = false;
      applyArcadeRuntimePreferences();
      const generation = runSurfaceGeneration;
      window.setTimeout(() => {
        if (generation !== runSurfaceGeneration || menuOwnsSurface || GameState?.mode !== GAME_MODES.DEAD) return;
        showRunResult(payload);
      }, 0);
    });
    EventBus.on('gameStarted', () => {
      arcadeRunActive = true;
      installArcadeRuntimeGates();
      applyArcadeRuntimePreferences();
    });
    globalThis.ArcadeHostIntegration?.installUi?.();

    // An integrated full-game launch must be one tap -> gameplay. The old
    // standalone home screen is still useful for the isolated direct/product host,
    // but it must never flash as a second player menu before autostart.
    const integratedAutostart = globalThis.ArcadeHostIntegration?.autostart === true;
    globalThis.ArcadeHostIntegration?.consumeAutostartParam?.();

    if (!integratedAutostart) {
      showMenu();
    } else {
      const root = document.getElementById('arcadeStandaloneMenu');
      document.body.classList.add('arcade-start-pending');
      root?.setAttribute('aria-busy', 'true');
      root?.setAttribute('aria-hidden', 'true');
      if (root) root.hidden = true;
      requestAnimationFrame(() => requestAnimationFrame(async () => {
        try {
          const outcome = await start(globalThis.ArcadeHostIntegration.requestedMode, { showStartGate: false });
          if (!outcome?.started && !menu?.isOpen?.()) {
            showMenu('Arcade could not start automatically. Choose Play to retry.');
          }
        } catch (error) {
          console.error('[ArcadeStandalone] Integrated autostart failed.', error);
          showMenu('Arcade could not start automatically. Choose Play to retry.');
        } finally {
          document.body.classList.remove('arcade-start-pending');
          root?.removeAttribute('aria-busy');
        }
      }));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, { once: true });
  else wire();

  return Object.freeze({ start, showMenu, updateMenu, showView, selectCharacter, openPause, resumePause, get pauseOpen() { return !!pause?.isOpen(); } });
})();

if (typeof globalThis !== 'undefined') globalThis.ArcadeStandalone = ArcadeStandalone;
