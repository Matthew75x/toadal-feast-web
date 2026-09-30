// ============================================================
// arcade-damage-source.js — one canonical Arcade damage vocabulary
// ============================================================
// Gameplay emits hazards as `hazard:<id>`. Legacy saves/tests may still use
// the plain `bomb` token, so both forms remain readable at the boundary.

const ArcadeDamageSource = Object.freeze({
  normalize(value) {
    return String(value == null ? '' : value).trim().toLowerCase();
  },
  isBomb(value) {
    const source = this.normalize(value);
    return source === 'bomb' || source === 'hazard:bomb';
  },
  isMiss(value) {
    return this.normalize(value) === 'miss';
  },
  isHazard(value) {
    const source = this.normalize(value);
    return source === 'bomb' || source.startsWith('hazard:') || source === 'sun' || source === 'fire';
  },
  ghostFramesActive() {
    return Boolean(
      typeof SETTINGS !== 'undefined'
      && SETTINGS?.ghostFrames === true
      && typeof RuntimeState !== 'undefined'
      && Number(RuntimeState?.ghostTime || 0) > 0
    );
  },
  shouldIgnoreHazard(value) {
    return this.isHazard(value) && this.ghostFramesActive();
  },
});

function arcadeDamageSourceForFood(food) {
  if (!food) return '';
  if (food.isSun) return 'sun';
  if (food.isBomb) return `hazard:${String(food.hazardType || 'bomb')}`;
  return '';
}

const ArcadeGhostFrameDamageGuard = (() => {
  function wrap(name, blockedReturn) {
    const original = globalThis?.[name];
    if (typeof original !== 'function' || original.__arcadeGhostFrameGuard === true) return false;
    const guarded = function guardedArcadeDamageHandler(...args) {
      const source = arcadeDamageSourceForFood(args[0]);
      if (ArcadeDamageSource.shouldIgnoreHazard(source)) return blockedReturn;
      return original.apply(this, args);
    };
    Object.defineProperty(guarded, '__arcadeGhostFrameGuard', { value: true });
    Object.defineProperty(guarded, '__arcadeGhostFrameOriginal', { value: original });
    globalThis[name] = guarded;
    return true;
  }

  function install() {
    let installed = 0;
    if (wrap('handleFoodCaught', undefined)) installed += 1;
    // Bob has a dedicated basket-hazard path instead of the shared handler.
    // Returning true preserves the caller contract: the caught hazard was
    // consumed, but invulnerability prevents another damage/spill event.
    if (wrap('handleBobCatch', true)) installed += 1;
    return installed;
  }

  function schedule() {
    if (typeof document === 'undefined') return false;
    const run = () => install();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else if (typeof queueMicrotask === 'function') {
      queueMicrotask(run);
    } else {
      Promise.resolve().then(run);
    }
    return true;
  }

  return Object.freeze({ install, schedule });
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ArcadeDamageSource = ArcadeDamageSource;
  globalThis.ArcadeGhostFrameDamageGuard = ArcadeGhostFrameDamageGuard;
  ArcadeGhostFrameDamageGuard.schedule();
}
