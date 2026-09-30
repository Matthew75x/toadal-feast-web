// src/runtime/platform/visual-background-host.js — resilient controller-level UVR consumer seam.
// Legacy Canvas2D remains authoritative until a trusted UVR-compatible provider
// is explicitly registered, passes the public-instance contract, and activates.
'use strict';

const FroggyFeastVisualHost = (() => {
  const REQUIRED_INSTANCE_METHODS = Object.freeze([
    'setAffect', 'setSignal', 'trigger', 'setScene', 'setSeed', 'setQuality',
    'pause', 'resume', 'resize', 'renderAtTime', 'getMetrics', 'getState', 'dispose',
  ]);

  const state = {
    status: 'legacy',
    provider: null,
    providerOptions: null,
    instance: null,
    mount: null,
    gameCanvas: null,
    wrapper: null,
    snapshotSource: null,
    snapshot: null,
    sceneId: null,
    seed: null,
    paused: false,
    backgroundEnabled: false,
    backend: null,
    tier: null,
    lastError: null,
    activatePromise: null,
    activationEpoch: 0,
    frameId: 0,
  };

  function recordProviderError(error) {
    const message = error?.message || error?.code || String(error || 'Unknown visual provider error');
    state.lastError = error instanceof Error ? error : new Error(message);
    return state.lastError;
  }

  function isCurrent(expectedEpoch, expectedProvider = state.provider, expectedInstance = null) {
    if (expectedEpoch !== state.activationEpoch) return false;
    if (expectedProvider && expectedProvider !== state.provider) return false;
    if (expectedInstance && expectedInstance !== state.instance) return false;
    return true;
  }

  function safeCall(fn, ...args) {
    if (typeof fn !== 'function') return true;
    const expectedEpoch = state.activationEpoch;
    const expectedInstance = state.instance;
    try {
      fn(...args);
      return true;
    } catch (error) {
      fail(error, { expectedEpoch, expectedInstance });
      return false;
    }
  }

  function disposeCandidate(instance, recordErrors = true) {
    if (!instance || typeof instance.dispose !== 'function') return;
    try {
      instance.dispose();
    } catch (error) {
      if (recordErrors) recordProviderError(error);
    }
  }

  function validateInstance(instance) {
    if (!instance || typeof instance !== 'object') throw new TypeError('UVR.create() returned no instance.');
    const missing = REQUIRED_INSTANCE_METHODS.filter(name => typeof instance[name] !== 'function');
    if (missing.length) throw new TypeError(`UVR instance is missing public API methods: ${missing.join(', ')}`);
    return instance;
  }

  function ensureMount() {
    if (state.mount?.isConnected) return state.mount;
    const gameCanvas = document.getElementById('gameCanvas');
    const wrapper = document.getElementById('canvasWrapper') || gameCanvas?.parentElement;
    if (!gameCanvas || !wrapper) return null;
    let mount = wrapper.querySelector('#visualBackgroundCanvas');
    if (!mount) {
      mount = document.createElement('canvas');
      mount.id = 'visualBackgroundCanvas';
      mount.className = 'ff-visual-background-canvas';
      mount.setAttribute('aria-hidden', 'true');
      mount.tabIndex = -1;
      wrapper.insertBefore(mount, gameCanvas);
    }
    mount.hidden = !(state.status === 'active' && state.backgroundEnabled);
    state.mount = mount;
    state.gameCanvas = gameCanvas;
    state.wrapper = wrapper;
    syncMountSize();
    return mount;
  }

  function syncMountSize() {
    const mount = state.mount;
    const gameCanvas = state.gameCanvas;
    if (!mount || !gameCanvas) return;

    // UVR owns the provider canvas drawing-buffer dimensions, DPR, and render
    // scale. The host mirrors CSS geometry only; assigning canvas.width/height
    // here would clear WebGL state and defeat UVR's adaptive-quality policy.
    const cssWidth = gameCanvas.style.width || (gameCanvas.clientWidth > 0 ? `${gameCanvas.clientWidth}px` : '100%');
    const cssHeight = gameCanvas.style.height || (gameCanvas.clientHeight > 0 ? `${gameCanvas.clientHeight}px` : '100%');
    if (mount.style.width !== cssWidth) mount.style.width = cssWidth;
    if (mount.style.height !== cssHeight) mount.style.height = cssHeight;
    safeCall(state.instance?.resize?.bind(state.instance));
  }

  function showExternal(active) {
    ensureMount();
    const visible = !!active && state.backgroundEnabled;
    state.wrapper?.classList.toggle('ff-visual-background-active', visible);
    if (state.mount) state.mount.hidden = !visible;
  }

  function registerProvider(provider, options = {}) {
    if (!provider || typeof provider.create !== 'function') throw new TypeError('Visual provider must expose UVR.create(canvas, options).');
    state.activationEpoch += 1;
    state.activatePromise = null;
    disposeInstance();
    state.provider = provider;
    state.providerOptions = Object.freeze({ ...options });
    state.status = 'prepared';
    state.lastError = null;
    return true;
  }

  function registerSnapshotSource(source) {
    if (typeof source !== 'function') throw new TypeError('Snapshot source must be a function.');
    state.snapshotSource = source;
  }

  async function activate(initialSnapshot) {
    const suppliedSnapshot = initialSnapshot == null ? null : normalizeSnapshot(initialSnapshot);
    if (initialSnapshot != null && !suppliedSnapshot) return false;
    if (suppliedSnapshot) {
      state.snapshot = suppliedSnapshot;
      state.backgroundEnabled = suppliedSnapshot.backgroundEnabled;
    }

    if (state.status === 'active') return suppliedSnapshot ? applySnapshot(suppliedSnapshot) : true;
    if (state.activatePromise) return state.activatePromise;
    if (!state.provider) return false;

    const mount = ensureMount();
    if (!mount) return false;
    const snapshot = suppliedSnapshot || readSnapshot();
    if (!snapshot) return false;
    state.snapshot = snapshot;
    state.backgroundEnabled = snapshot.backgroundEnabled;
    if (!snapshot.backgroundEnabled) {
      state.status = 'prepared';
      showExternal(false);
      return false;
    }

    const provider = state.provider;
    const activationEpoch = state.activationEpoch;
    state.status = 'starting';
    let candidate = null;
    let activationPromise;
    activationPromise = Promise.resolve().then(async () => {
      const configured = state.providerOptions || {};
      const {
        onError: consumerOnError,
        onFallback: consumerOnFallback,
        onTierChange: consumerOnTierChange,
        onBackendSelected: consumerOnBackendSelected,
        scene: _ignoredScene,
        seed: _ignoredSeed,
        ...providerOptions
      } = configured;

      candidate = await provider.create(mount, {
        backend: 'auto',
        quality: 'auto',
        transparent: false,
        reducedMotion: 'system',
        maxDevicePixelRatio: 2,
        frameBudgetMs: 12,
        visibilityPolicy: { document: true, element: true, offscreenMode: 'pause' },
        ...providerOptions,
        // Scene and seed are game-host authority and cannot be overridden by
        // provider registration options.
        scene: snapshot.sceneId,
        seed: snapshot.seed,
        onError: error => {
          if (!isCurrent(activationEpoch, provider)) return;
          recordProviderError(error);
          try { consumerOnError?.(error); } catch (callbackError) { recordProviderError(callbackError); }
        },
        onFallback: detail => {
          if (!isCurrent(activationEpoch, provider)) return;
          if (detail?.error) recordProviderError(detail.error);
          try { consumerOnFallback?.(detail); } catch (callbackError) { recordProviderError(callbackError); }
        },
        onTierChange: detail => {
          if (!isCurrent(activationEpoch, provider)) return;
          state.tier = detail?.tier || detail?.quality || String(detail || '') || null;
          try { consumerOnTierChange?.(detail); } catch (callbackError) { recordProviderError(callbackError); }
        },
        onBackendSelected: detail => {
          if (!isCurrent(activationEpoch, provider)) return;
          state.backend = detail?.backend || String(detail || '') || null;
          try { consumerOnBackendSelected?.(detail); } catch (callbackError) { recordProviderError(callbackError); }
        },
      });

      if (!isCurrent(activationEpoch, provider)) {
        disposeCandidate(candidate, false);
        candidate = null;
        return false;
      }

      try {
        validateInstance(candidate);
      } catch (error) {
        disposeCandidate(candidate);
        candidate = null;
        throw error;
      }

      // A surface can change while create() is pending. Never briefly activate
      // a provider for a surface whose background policy has since disabled it.
      const latestSnapshot = state.snapshot || snapshot;
      if (!latestSnapshot.backgroundEnabled) {
        disposeCandidate(candidate, false);
        candidate = null;
        state.status = 'prepared';
        showExternal(false);
        return false;
      }

      state.instance = candidate;
      candidate = null;
      state.sceneId = snapshot.sceneId;
      state.seed = snapshot.seed;
      state.status = 'active';
      if (!applySnapshot(latestSnapshot)) throw state.lastError || new Error('UVR snapshot application failed.');
      startSnapshotLoop();
      return true;
    }).catch(error => {
      if (candidate) {
        disposeCandidate(candidate, isCurrent(activationEpoch, provider));
        candidate = null;
      }
      if (isCurrent(activationEpoch, provider)) fail(error, { expectedEpoch: activationEpoch });
      return false;
    }).finally(() => {
      if (state.activatePromise === activationPromise) state.activatePromise = null;
    });
    state.activatePromise = activationPromise;
    return activationPromise;
  }

  function normalizeSnapshot(snapshot) {
    const contract = globalThis.FroggyFeastVisualContract;
    if (!contract) return snapshot || null;
    if (snapshot?.schema === contract.SCHEMA) return contract.canonicalizeSnapshot?.(snapshot) || null;
    const normalized = contract.buildSnapshot?.(snapshot || {});
    return contract.isValidSnapshot?.(normalized) ? normalized : null;
  }

  function readSnapshot() {
    try { return normalizeSnapshot(state.snapshotSource?.() || {}); }
    catch (error) { recordProviderError(error); return null; }
  }

  function applySnapshot(snapshotInput) {
    const snapshot = normalizeSnapshot(snapshotInput);
    if (!snapshot) return false;
    state.snapshot = snapshot;
    state.backgroundEnabled = snapshot.backgroundEnabled;
    if (state.status !== 'active' || !state.instance) {
      showExternal(false);
      return true;
    }

    if (!snapshot.backgroundEnabled) {
      if (!state.paused) {
        state.paused = true;
        if (!safeCall(state.instance.pause.bind(state.instance))) return false;
      }
      showExternal(false);
      return true;
    }

    if (snapshot.seed !== state.seed) {
      state.seed = snapshot.seed;
      if (!safeCall(state.instance.setSeed.bind(state.instance), snapshot.seed, { rebuild: true })) return false;
    }
    if (snapshot.sceneId !== state.sceneId) {
      const instance = state.instance;
      const expectedEpoch = state.activationEpoch;
      state.sceneId = snapshot.sceneId;
      try {
        Promise.resolve(instance.setScene(snapshot.sceneId, { transition: 'crossfade', durationMs: 600 }))
          .catch(error => fail(error, { expectedEpoch, expectedInstance: instance }));
      } catch (error) {
        fail(error, { expectedEpoch, expectedInstance: instance });
        return false;
      }
    }
    if (!safeCall(state.instance.setAffect.bind(state.instance), snapshot.affect)) return false;
    for (const [name, value] of Object.entries(snapshot.signals || {})) {
      if (!safeCall(state.instance.setSignal.bind(state.instance), name, value)) return false;
    }

    const wantsPause = snapshot.signals?.['host.paused'] === 1;
    if (wantsPause !== state.paused) {
      state.paused = wantsPause;
      if (!safeCall((wantsPause ? state.instance.pause : state.instance.resume).bind(state.instance))) return false;
    }
    showExternal(true);
    return true;
  }

  function queueSnapshot(snapshotInput) {
    const snapshot = normalizeSnapshot(snapshotInput);
    if (!snapshot) return false;
    if (state.status === 'prepared' && state.provider && snapshot.backgroundEnabled) {
      void activate(snapshot);
      return true;
    }
    return applySnapshot(snapshot);
  }

  function startSnapshotLoop() {
    if (typeof requestAnimationFrame !== 'function') return;
    cancelAnimationFrame(state.frameId);
    let last = 0;
    const tick = now => {
      if (state.status !== 'active') return;
      if (now - last >= 66) {
        last = now;
        const snapshot = readSnapshot();
        if (snapshot) applySnapshot(snapshot);
      }
      if (state.status === 'active') state.frameId = requestAnimationFrame(tick);
    };
    state.frameId = requestAnimationFrame(tick);
  }

  function trigger(eventName, payload = {}) {
    if (state.status !== 'active' || !state.instance || !state.backgroundEnabled) return false;
    const normalized = globalThis.FroggyFeastVisualContract?.normalizeEvent?.(eventName, payload);
    if (!normalized) return false;
    return safeCall(state.instance.trigger.bind(state.instance), normalized.name, normalized.payload);
  }

  function setQuality(tier) {
    if (state.status !== 'active' || !state.instance) return false;
    return safeCall(state.instance.setQuality.bind(state.instance), tier);
  }

  function renderOrLegacy(legacyDraw, snapshot) {
    if (snapshot) queueSnapshot(snapshot);
    if (state.status === 'active' && state.backgroundEnabled) return 'external';
    // Legacy rendering is game authority, not a provider method. Do not swallow
    // or misclassify its exceptions as UVR failures.
    if (typeof legacyDraw === 'function') legacyDraw();
    return 'legacy';
  }

  function disposeInstance() {
    cancelAnimationFrame(state.frameId);
    state.frameId = 0;
    const instance = state.instance;
    state.instance = null;
    state.sceneId = null;
    state.seed = null;
    state.paused = false;
    state.backgroundEnabled = false;
    state.backend = null;
    state.tier = null;
    disposeCandidate(instance);
  }

  function fail(error, guard = {}) {
    const expectedEpoch = guard.expectedEpoch ?? state.activationEpoch;
    const expectedInstance = guard.expectedInstance || null;
    if (!isCurrent(expectedEpoch, state.provider, expectedInstance)) return false;
    recordProviderError(error);
    state.activationEpoch += 1;
    state.activatePromise = null;
    disposeInstance();
    state.status = state.provider ? 'failed' : 'legacy';
    showExternal(false);
    console.warn('[FroggyFeastVisualHost] Restored the game-owned background after provider failure.', state.lastError);
    return true;
  }

  function dispose() {
    state.activationEpoch += 1;
    state.activatePromise = null;
    disposeInstance();
    state.provider = null;
    state.providerOptions = null;
    state.status = 'legacy';
    showExternal(false);
  }

  function getState() {
    return Object.freeze({
      status: state.status,
      active: state.status === 'active',
      backgroundEnabled: state.backgroundEnabled,
      sceneId: state.sceneId,
      seed: state.seed,
      backend: state.backend,
      tier: state.tier,
      hasProvider: !!state.provider,
      lastError: state.lastError?.message || null,
    });
  }

  function adoptPreparedGlobal() {
    const prepared = globalThis.__FROGGY_VISUAL_BACKGROUND_PROVIDER__;
    if (!prepared || state.provider === prepared || state.provider === prepared.provider) return false;
    registerProvider(prepared.provider || prepared, prepared.options || {});
    return true;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const boot = () => {
      ensureMount();
      adoptPreparedGlobal();
      if (state.provider) activate();
      if (typeof ResizeObserver === 'function' && state.gameCanvas) new ResizeObserver(syncMountSize).observe(state.gameCanvas);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
    window.addEventListener('resize', syncMountSize, { passive: true });
    window.addEventListener('orientationchange', syncMountSize, { passive: true });
    window.addEventListener('froggy-visual-provider-ready', () => { if (adoptPreparedGlobal()) activate(); });
  }

  return Object.freeze({
    REQUIRED_INSTANCE_METHODS,
    registerProvider,
    registerSnapshotSource,
    activate,
    queueSnapshot,
    trigger,
    setQuality,
    renderOrLegacy,
    syncMountSize,
    getState,
    dispose,
  });
})();
if (typeof globalThis !== 'undefined') globalThis.FroggyFeastVisualHost = FroggyFeastVisualHost;
