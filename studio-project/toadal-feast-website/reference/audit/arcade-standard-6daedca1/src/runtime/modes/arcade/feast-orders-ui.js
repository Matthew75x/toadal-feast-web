// ============================================================
// feast-orders-ui.js — Daily Feast board, tracker, and feedback
// ============================================================

const FeastOrdersUI = (() => {
  const ARCADE_RUN_MODES = new Set(['standard', 'tc', 'fmf', 'zen']);
  let toastTimer = null;

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }
  function characterDef(id) {
    return typeof CHARACTER_DATA !== 'undefined' ? CHARACTER_DATA.find(character => character.id === id) : null;
  }
  function selectedCharacterId() {
    const saveId = typeof SaveManager !== 'undefined' ? String(SaveManager.get()?.selectedChar || '') : '';
    return saveId || (typeof GameState !== 'undefined' ? String(GameState.selectedCharacterId || '') : '');
  }
  function foodAssetSrc(itemId) {
    if (!itemId || typeof ArcadeAssetBindings === 'undefined' || typeof ArcadeAssetBindings.getForItem !== 'function') return '';
    return ArcadeAssetBindings.getForItem(itemId)?.src || '';
  }
  function activeArcadeRun() {
    return typeof GameState !== 'undefined'
      && GameState.mode === (typeof GAME_MODES !== 'undefined' ? GAME_MODES.PLAYING : 'playing')
      && ARCADE_RUN_MODES.has(String(GameState.currentMode || '').toLowerCase());
  }
  function clearGameplayOverlays() {
    el('feastOrderTracker')?.classList.add('hidden');
    el('feastOrderToast')?.classList.add('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
  }
  function ingredientSlots(ingredient) {
    const slots = [];
    const source = foodAssetSrc(ingredient.iconItemId);
    for (let index = 0; index < ingredient.target; index += 1) {
      const filled = index < ingredient.progress;
      slots.push(`<span class="feast-slot${filled ? ' feast-slot-filled' : ''}"${source ? ` data-feast-food-src="${escapeHtml(source)}"` : ''} aria-label="${escapeHtml(ingredient.label)} ${filled ? 'collected' : 'needed'}"></span>`);
    }
    return `<div class="feast-ingredient"><span>${escapeHtml(ingredient.label)}</span><div class="feast-slots">${slots.join('')}</div><strong>${ingredient.progress}/${ingredient.target}</strong></div>`;
  }

  function orderCard(order) {
    const character = characterDef(order.characterId);
    const stateClass = order.complete ? ' complete' : (order.unlocked ? '' : ' locked');
    const selected = selectedCharacterId() === order.characterId;
    let action = '';
    if (order.complete) {
      action = '<span class="feast-order-status">Served!</span>';
    } else if (!order.unlocked) {
      action = `<span class="feast-order-status">Unlock ${escapeHtml(character?.name || order.characterId)}</span>`;
    } else {
      action = [
        `<button class="feast-order-pin" type="button" data-feast-pin="${escapeHtml(order.id)}">${order.pinned ? 'Tracking' : 'Track order'}</button>`,
        selected
          ? '<span class="feast-order-status feast-order-ready">Character selected</span>'
          : `<button class="feast-order-character-select" type="button" data-feast-character="${escapeHtml(order.characterId)}">Use ${escapeHtml(character?.name || order.characterId)}</button>`,
      ].join('');
    }
    return [
      `<article class="feast-order-card${stateClass}" style="--feast-accent:${escapeHtml(order.accent)}">`,
      ' <header class="feast-order-card-header">',
      character?.src ? `  <span class="feast-order-character-host" data-feast-character-src="${escapeHtml(character.src)}"></span>` : '',
      `  <div><strong>${escapeHtml(order.title)}</strong><span>${escapeHtml(order.subtitle)}</span></div>`,
      `  <b>+${order.rewardCoins}</b>`,
      ' </header>',
      ` <div class="feast-order-meta"><span>${order.complete ? 'Meal complete' : `${order.remainingTotal} catches left`}</span><span>Favourite foods +15% score</span></div>`,
      ` <div class="feast-order-tray">${order.ingredients.map(ingredientSlots).join('')}</div>`,
      ` <footer>${action}</footer>`,
      '</article>',
    ].join('');
  }

  function render(snapshot = FeastOrdersManager.getDashboard()) {
    const board = el('feastOrdersBoard');
    if (board) {
      const revengeChallenge = typeof ArcadeRevengeChallenges !== 'undefined'
        ? ArcadeRevengeChallenges.getCurrentChallenge()
        : null;
      const revengePresentation = revengeChallenge && typeof ArcadeRevengeChallenges !== 'undefined'
        ? ArcadeRevengeChallenges.describe(revengeChallenge)
        : null;
      const revengeCard = revengeChallenge && revengePresentation
        ? `<div class="feast-revenge-card"><strong>${escapeHtml(revengePresentation.title)}</strong><span>${escapeHtml(revengePresentation.detail)} Reward: ${revengeChallenge.rewardCoins} coins.</span>${revengeChallenge.status === 'active' ? '<b>Active</b>' : `<button type="button" data-arcade-revenge="${escapeHtml(revengeChallenge.id)}">Accept Challenge</button>`}</div>`
        : '';
      board.innerHTML = [
        '<div class="feast-board-heading"><div><strong>Character Feast Orders</strong><span>Catch the right foods with the right character. Progress survives every run.</span></div>',
        `<div class="feast-stamp-track"><b>${snapshot.stampProgress}/${snapshot.stampTarget}</b><span>Feast Stamps</span><small>+${snapshot.stampRewardCoins} coins at 7</small></div></div>`,
        revengeCard,
        '<div class="feast-order-grid">',
        snapshot.orders.map(orderCard).join(''),
        '</div>',
      ].join('');
      board.querySelectorAll('[data-feast-character-src]').forEach(host => {
        const portrait = new Image();
        portrait.className = 'feast-order-character';
        portrait.alt = '';
        portrait.decoding = 'async';
        portrait.src = /** @type {HTMLElement} */ (host).dataset.feastCharacterSrc || '';
        host.replaceWith(portrait);
      });
      board.querySelectorAll('[data-feast-food-src]').forEach(slot => {
        const icon = new Image();
        icon.className = 'feast-slot-icon';
        icon.alt = '';
        icon.decoding = 'async';
        icon.src = /** @type {HTMLElement} */ (slot).dataset.feastFoodSrc || '';
        slot.appendChild(icon);
      });
      board.querySelectorAll('[data-feast-pin]').forEach(button => button.addEventListener('click', () => {
        FeastOrdersManager.pinOrder(/** @type {HTMLElement} */ (button).dataset.feastPin);
        render();
      }));
      board.querySelectorAll('[data-feast-character]').forEach(button => button.addEventListener('click', () => {
        const characterId = /** @type {HTMLElement} */ (button).dataset.feastCharacter || '';
        const character = characterDef(characterId);
        if (!character || !FeastOrdersManager.isCharacterUnlocked(characterId)) return;
        if (typeof ArcadeStandalone !== 'undefined' && typeof ArcadeStandalone.selectCharacter === 'function') ArcadeStandalone.selectCharacter(characterId);
        else {
          SaveManager?.set?.(draft => { draft.selectedChar = characterId; });
          if (typeof GameState !== 'undefined') GameState.selectedCharacterId = characterId;
        }
        showToast(`${character.name} selected`, 'Ready for this Feast Order.', character.color || '#ffd86b', 1500);
        render();
      }));
      board.querySelectorAll('[data-arcade-revenge]').forEach(button => button.addEventListener('click', () => {
        ArcadeRevengeChallenges?.activate?.(/** @type {HTMLElement} */ (button).dataset.arcadeRevenge);
        render();
      }));
    }
    renderTracker(snapshot);
  }

  function renderTracker(snapshot = FeastOrdersManager.getDashboard()) {
    const tracker = el('feastOrderTracker');
    if (!tracker) return;
    const order = snapshot.orders.find(entry => entry.id === snapshot.pinnedOrderId);
    const correctCharacter = order && typeof getCharDef === 'function' && getCharDef()?.id === order.characterId;
    if (!activeArcadeRun() || !order || order.complete || !correctCharacter) {
      tracker.classList.add('hidden');
      return;
    }
    const next = order.ingredients.find(ingredient => ingredient.progress < ingredient.target) || order.ingredients[order.ingredients.length - 1];
    tracker.style.setProperty('--feast-accent', order.accent);
    tracker.innerHTML = `<strong>${escapeHtml(order.title)}</strong><span>${escapeHtml(next.label)} ${next.progress}/${next.target}</span><div><i style="width:${Math.round(order.progressTotal / Math.max(1, order.targetTotal) * 100)}%"></i></div>`;
    tracker.classList.remove('hidden');
  }

  function pulseTracker() {
    const tracker = el('feastOrderTracker');
    if (!tracker || tracker.classList.contains('hidden')) return;
    tracker.classList.remove('feast-order-tracker-pulse');
    void tracker.offsetWidth;
    tracker.classList.add('feast-order-tracker-pulse');
  }

  function showToast(title, detail, accent = '#ffd86b', duration = 2200) {
    const toast = el('feastOrderToast');
    if (!toast) return;
    toast.style.setProperty('--feast-accent', accent);
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), Math.max(700, Number(duration) || 2200));
  }

  function bind() {
    EventBus?.on?.('feastOrdersChanged', (/** @type {any} */ payload = {}) => render(payload.snapshot || FeastOrdersManager.getDashboard()));
    EventBus?.on?.('feastOrderProgress', payload => {
      const order = payload.snapshot?.orders?.find(entry => entry.id === payload.orderId);
      render(payload.snapshot);
      pulseTracker();
      if (payload.completed) showToast('Feast Order Served!', `+${payload.rewardCoins} coins`, order?.accent, 2400);
      else if (payload.ingredientCompleted) showToast(`${payload.ingredientLabel} complete!`, `${order?.remainingTotal || 0} catches left`, order?.accent, 1400);
    });
    EventBus?.on?.('arcadeRevengeOffered', ({ presentation }) => { showToast(presentation?.title || 'Revenge Challenge Ready', presentation?.detail || 'Return stronger next run.', '#ff596d'); render(); });
    EventBus?.on?.('arcadeRevengeActivated', ({ presentation }) => { showToast('Revenge Accepted', presentation?.detail || 'Challenge active.', '#ff596d'); render(); });
    EventBus?.on?.('arcadeRevengeCompleted', ({ rewardCoins }) => { showToast('Revenge Complete!', `+${rewardCoins} coins`, '#ff596d'); render(); });
    EventBus?.on?.('arcadeRevengeFailed', () => render());
    EventBus?.on?.('gameStarted', () => renderTracker());
    EventBus?.on?.('gameOver', () => renderTracker());
    EventBus?.on?.('sceneChanged', () => {
      if (activeArcadeRun()) renderTracker();
      else clearGameplayOverlays();
    });
    // The non-Arcade hosts own their own HUDs and do not all emit the generic
    // sceneChanged event. Clear any Arcade feedback at each explicit handoff so
    // a tracker or short-lived toast cannot leak across modes.
    ['connect3Started', 'puzzleLevelStarted', 'infiniteStarted'].forEach(eventName => {
      EventBus?.on?.(eventName, clearGameplayOverlays);
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();

  return Object.freeze({ render, renderTracker, showToast, pulseTracker });
})();
