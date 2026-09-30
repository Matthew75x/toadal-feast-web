// Froggy Feast launch-shell.js
// Presentation-only helpers for the launch-ready menu. The shell reads the
// existing save, character, and balance registries; it does not own game state.
const LaunchShell = (() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const format = value => Math.max(0, Math.floor(Number(value) || 0)).toLocaleString();

  function selectedCharacter(save) {
    if (typeof CHARACTER_DATA === 'undefined' || !Array.isArray(CHARACTER_DATA)) return null;
    return CHARACTER_DATA.find(character => character.id === save?.selectedChar)
      || CHARACTER_DATA.find(character => character.id === 'classic')
      || CHARACTER_DATA[0]
      || null;
  }

  function syncModeCard(button, best) {
    const modeId = button?.dataset?.arcadeMode;
    if (!modeId) return;
    const threshold = Number(typeof GAME_BALANCE !== 'undefined' ? GAME_BALANCE?.modeUnlocks?.[modeId] : 0) || 0;
    const unlocked = typeof isModeUnlocked === 'function'
      ? isModeUnlocked(modeId)
      : !button.disabled;
    button.dataset.unlocked = unlocked ? 'true' : 'false';
    button.style.setProperty('--launch-unlock-progress', `${threshold > 0 ? Math.min(100, (best / threshold) * 100) : 100}%`);
    const copy = button.querySelector('.launch-lock-copy');
    if (copy) copy.textContent = threshold > 0 ? `Reach ${format(threshold)} pts` : 'Available from the start';
    const padlock = button.querySelector('.launch-padlock');
    if (padlock) padlock.textContent = unlocked ? 'Ready' : 'Locked';
  }

  function sync(payload = {}) {
    const save = payload.save || (typeof SaveManager !== 'undefined' ? SaveManager.get?.() : null) || {};
    const best = Number.isFinite(Number(payload.best)) ? Number(payload.best) : Number(save.bestScore) || 0;
    const coins = Number.isFinite(Number(payload.coins))
      ? Number(payload.coins)
      : Number((typeof ProgressionManager !== 'undefined' ? ProgressionManager.getCoins?.() : undefined) ?? save.coins) || 0;
    const character = selectedCharacter(save);

    const portrait = $('#menuSelectedCharacterPortrait');
    const name = $('#menuSelectedCharacterName');
    if (character) {
      if (portrait) {
        portrait.src = character.src || `assets/images/characters/runtime-select/${character.id}.png`;
        portrait.alt = '';
      }
      if (name) name.textContent = character.name || 'Classic Frog';
    }

    const bestEl = $('#arcadeStandaloneBest');
    const coinsEl = $('#arcadeStandaloneCoins');
    if (bestEl) bestEl.textContent = format(best);
    if (coinsEl) coinsEl.textContent = format(coins);

    document.querySelectorAll('[data-arcade-mode]').forEach(button => syncModeCard(button, best));
  }

  function markReady() {
    document.body.classList.add('launch-shell-ready');
    sync();
    globalThis.GameTransitionOverlay?.markReady?.({ source:'canonical-arcade-launch-shell' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markReady, { once:true });
  else markReady();

  return Object.freeze({ sync });
})();
