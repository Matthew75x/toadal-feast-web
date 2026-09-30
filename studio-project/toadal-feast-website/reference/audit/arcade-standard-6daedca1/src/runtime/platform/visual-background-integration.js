// src/runtime/platform/visual-background-integration.js — translates Froggy Feast state/events into
// the final UVR controller-facing contract. It stays outside UVR core and owns
// no rendering, scene modules, worker protocol, or gameplay behavior.
'use strict';

const FroggyFeastVisualIntegration = (() => {
  const watchedEvents = Object.keys(globalThis.FroggyFeastVisualContract?.EVENT_MAP || {});
  let connectedBus = null;
  let retryTimer = 0;

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function unit(value) { return Math.min(1, Math.max(0, number(value))); }

  function detectSurface() {
    const pathname = String(globalThis.location?.pathname || '').toLowerCase();
    const game = typeof GameState !== 'undefined' ? GameState : (globalThis.GameState || {});
    const current = String(game.currentMode || '').toLowerCase();
    const mode = String(game.mode || '').toLowerCase();
    if (current === 'puzzle' || pathname.includes('puzzle')) return 'puzzle';
    if (current === 'connect3' || current === 'feastfall' || pathname.includes('feastfall')) return 'feastfall';
    if (current === 'infinite' || pathname.includes('infinite')) return 'infinite';
    if (mode === 'menu' && !pathname.includes('arcade')) return 'menu';
    if (current === 'tc') return 'arcade-toadal';
    if (current === 'fmf') return 'arcade-fmf';
    if (current === 'zen') return 'arcade-zen';
    return 'arcade-classic';
  }

  function snapshotSource() {
    const game = typeof GameState !== 'undefined' ? GameState : (globalThis.GameState || {});
    const surface = detectSurface();
    const mode = String(game.mode || '').toLowerCase();
    const maxLives = Math.max(1, number(game.maxLives, 3));
    const health = unit(number(game.lives, maxLives) / maxLives);
    let progress = unit((Math.max(1, number(game.level, 1)) - 1) / 20);
    let danger = unit(1 - health);
    let combo = unit(number(game.combo) / 25);
    let celebration = 0;

    if (surface === 'arcade-fmf') progress = unit(1 - number(game.fmfTimeLeft, 300) / 300);
    if (surface === 'arcade-toadal') progress = unit(number(game.toadalConsumption?.foodsEaten, 0) / (number(globalThis.GULPER_TOADAL_MAX_MEALS, 140)));
    if (surface === 'arcade-zen') progress = unit((typeof ZenState !== 'undefined' ? ZenState : globalThis.ZenState)?.totalProgress);
    if (surface === 'puzzle') {
      const puzzle = typeof PuzzleFrogState !== 'undefined' ? PuzzleFrogState : (globalThis.PuzzleFrogState || {});
      const id = String(game.currentLevelId || puzzle.levelId || 'p001');
      progress = unit((number(id.replace(/\D/g, ''), 1) - 1) / 39);
      danger = unit(1 - number(puzzle.lives, 1) / Math.max(1, number(puzzle.maxLives, 1)));
      combo = unit(number(puzzle.combo, 0) / 8);
    }
    if (surface === 'feastfall') {
      const feastfall = typeof Connect3State !== 'undefined' ? Connect3State : (globalThis.Connect3State || {});
      progress = unit(number(feastfall.moves, 0) / 30);
      danger = unit(number(feastfall.hazardPressure, 0));
      combo = unit(number(feastfall.combo, 0) / 8);
    }
    if (surface === 'infinite') {
      const colony = typeof InfiniteState !== 'undefined' ? InfiniteState : (globalThis.InfiniteState || {});
      progress = unit(number(colony.totalPlotsPurchased || colony.reclaimedPlots, 0) / 169);
      danger = unit(number(colony.overrunPressure || colony.pressure, 0));
      celebration = unit(number(colony.celebrationPulse, 0));
    }

    const runActive = mode === 'playing' || mode.includes('active') || surface === 'puzzle' || surface === 'feastfall' || surface === 'infinite';
    const paused = mode === 'paused' || globalThis.document?.body?.classList?.contains('paused') === true;
    return {
      surface,
      seed: 'froggy-feast',
      progress,
      danger,
      combo,
      health,
      runActive,
      paused,
      celebration,
      intensity: Math.max(combo, danger, runActive ? 0.35 : 0.12),
    };
  }

  function connectEventBus() {
    const bus = typeof EventBus !== 'undefined' ? EventBus : globalThis.EventBus;
    if (!bus || typeof bus.on !== 'function' || bus === connectedBus) return false;
    connectedBus = bus;
    for (const eventName of watchedEvents) {
      bus.on(eventName, payload => {
        // Publish the coherent host-state snapshot before the event envelope so
        // UVR's next frame never observes an event against stale game signals.
        globalThis.FroggyFeastVisualHost?.queueSnapshot(snapshotSource());
        globalThis.FroggyFeastVisualHost?.trigger(eventName, payload || {});
      });
    }
    return true;
  }

  function boot() {
    globalThis.FroggyFeastVisualHost?.registerSnapshotSource(snapshotSource);
    connectEventBus();
    clearInterval(retryTimer);
    retryTimer = setInterval(() => {
      if (connectEventBus()) clearInterval(retryTimer);
    }, 250);
    setTimeout(() => clearInterval(retryTimer), 5000);
  }

  if (globalThis.document?.readyState === 'loading') globalThis.document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  return Object.freeze({ snapshotSource, detectSurface, connectEventBus });
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyFeastVisualIntegration = FroggyFeastVisualIntegration;
