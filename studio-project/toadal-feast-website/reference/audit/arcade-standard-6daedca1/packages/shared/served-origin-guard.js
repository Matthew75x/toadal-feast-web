// ============================================================
// served-origin-guard.js — earliest shared player bootstrap
//
// TOADAL FEAST stores progress in origin-scoped browser storage. Direct file://
// launches can split saves between entry points, so shipping player surfaces
// require the bundled local server launcher.
//
// This is also the one script guaranteed to execute before gameplay code in the
// full game and all shipped standalones. It therefore owns only two pieces of
// universal bootstrap policy:
//   1) conditional browser-floor shims; and
//   2) the engine-wide performance budget authority.
//
// Mode modules own gameplay and rendering implementation. The performance
// authority owns presentation budgets and shared observations only. It never
// owns board topology, content, RNG, scoring or other gameplay rules. Quality
// mutation stays disabled until Observation Contract v2 (cadence-deadline-v2)
// is wired and witnessed across every scheduling consumer. Modern native
// browser APIs are never replaced.
// ============================================================

(() => {
  'use strict';

  function defineMethod(proto, name, implementation) {
    if (!proto || typeof proto[name] === 'function') return;
    try {
      Object.defineProperty(proto, name, {
        configurable: true,
        writable: true,
        value: implementation,
      });
    } catch (_) {
      proto[name] = implementation;
    }
  }

  function installReplaceChildren(proto) {
    defineMethod(proto, 'replaceChildren', function replaceChildren(...nodes) {
      const ownerDocument = this.ownerDocument || (this.nodeType === 9 ? this : globalThis.document);
      if (!ownerDocument || typeof ownerDocument.createDocumentFragment !== 'function' || typeof ownerDocument.createTextNode !== 'function') {
        throw new TypeError('replaceChildren compatibility requires an owner document.');
      }
      const fragment = ownerDocument.createDocumentFragment();
      for (const item of nodes) {
        const node = item && typeof item === 'object' && typeof item.nodeType === 'number'
          ? item
          : ownerDocument.createTextNode(String(item));
        fragment.appendChild(node);
      }
      while (this.firstChild) this.removeChild(this.firstChild);
      this.appendChild(fragment);
    });
  }

  function normalizeRoundRectRadius(value) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) throw new RangeError('roundRect radius must be a finite non-negative number.');
      return { x: value, y: value };
    }
    if (value && typeof value === 'object') {
      const x = Number(value.x);
      const y = Number(value.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
        throw new RangeError('roundRect radius components must be finite non-negative numbers.');
      }
      return { x, y };
    }
    throw new TypeError('roundRect radius must be a number or point-like object.');
  }

  function expandRoundRectRadii(radii) {
    const values = Array.isArray(radii) ? radii.slice() : [radii == null ? 0 : radii];
    if (values.length < 1 || values.length > 4) throw new RangeError('roundRect radii must contain between one and four values.');
    const normalized = values.map(normalizeRoundRectRadius);
    if (normalized.length === 1) return [normalized[0], normalized[0], normalized[0], normalized[0]];
    if (normalized.length === 2) return [normalized[0], normalized[1], normalized[0], normalized[1]];
    if (normalized.length === 3) return [normalized[0], normalized[1], normalized[2], normalized[1]];
    return normalized;
  }

  function scaleRoundRectRadii(radii, width, height) {
    const [tl, tr, br, bl] = radii;
    const ratios = [1];
    const addRatio = (limit, total) => {
      if (total > 0) ratios.push(limit / total);
    };
    addRatio(width, tl.x + tr.x);
    addRatio(width, bl.x + br.x);
    addRatio(height, tl.y + bl.y);
    addRatio(height, tr.y + br.y);
    const scale = Math.min(...ratios);
    if (scale >= 1) return radii;
    return radii.map(radius => ({ x: radius.x * scale, y: radius.y * scale }));
  }

  if (typeof globalThis.Element === 'function') installReplaceChildren(globalThis.Element.prototype);
  if (typeof globalThis.DocumentFragment === 'function') installReplaceChildren(globalThis.DocumentFragment.prototype);
  if (typeof globalThis.Document === 'function') installReplaceChildren(globalThis.Document.prototype);

  if (typeof globalThis.CanvasRenderingContext2D === 'function') {
    defineMethod(globalThis.CanvasRenderingContext2D.prototype, 'roundRect', function roundRect(x, y, width, height, radii = 0) {
      x = Number(x);
      y = Number(y);
      width = Number(width);
      height = Number(height);
      if (![x, y, width, height].every(Number.isFinite)) {
        throw new TypeError('roundRect coordinates must be finite numbers.');
      }

      let corners = expandRoundRectRadii(radii);
      if (width < 0) {
        x += width;
        width = -width;
        corners = [corners[1], corners[0], corners[3], corners[2]];
      }
      if (height < 0) {
        y += height;
        height = -height;
        corners = [corners[3], corners[2], corners[1], corners[0]];
      }
      corners = scaleRoundRectRadii(corners, width, height);
      const [tl, tr, br, bl] = corners;

      this.moveTo(x + tl.x, y);
      this.lineTo(x + width - tr.x, y);
      if (tr.x || tr.y) this.ellipse(x + width - tr.x, y + tr.y, tr.x, tr.y, 0, -Math.PI / 2, 0);
      this.lineTo(x + width, y + height - br.y);
      if (br.x || br.y) this.ellipse(x + width - br.x, y + height - br.y, br.x, br.y, 0, 0, Math.PI / 2);
      this.lineTo(x + bl.x, y + height);
      if (bl.x || bl.y) this.ellipse(x + bl.x, y + height - bl.y, bl.x, bl.y, 0, Math.PI / 2, Math.PI);
      this.lineTo(x, y + tl.y);
      if (tl.x || tl.y) this.ellipse(x + tl.x, y + tl.y, tl.x, tl.y, 0, Math.PI, Math.PI * 1.5);
      this.closePath();
      return this;
    });
  }

  // --------------------------------------------------------------------------
  // Engine performance authority
  // --------------------------------------------------------------------------
  // Device names never select gameplay. Static capability hints choose only the
  // starting presentation budget.
  //
  // Observation Contract v2 (`cadence-deadline-v2`)
  // ----------------------------------------------
  // The SCHEDULER is the authority for what cadence was intended. Intended FPS
  // and phase arrive as scalar hot-path arguments; nothing here infers intent
  // from observed rAF timing. Each presentation is scored against the intended
  // deadline sequence, so evidence is expressed as delivered-vs-intended
  // deadlines rather than as an average frame rate.
  //
  // A long frame is EVIDENCE, not a reason to forget. v1 discarded any window
  // containing a >250ms delta, which erased exactly the main-thread stalls that
  // matter. A 250-600ms stall now increases missed deadlines, lowers the
  // delivered/intended ratio, increments the long-stall counters and lands in
  // the timing tail. It is not a cadence-epoch boundary.
  //
  // Legitimate epoch boundaries are only: mode entry/exit, active<->idle phase
  // change, intended-FPS change, lifecycle pause and lifecycle resume. Hidden /
  // background duration closes and restarts an epoch so it can never surface as
  // one giant foreground stall.
  //
  // Storage is a fixed preallocated ring; there is no steady-state push/shift
  // queue and no per-frame options object. Budget records are pre-resolved, so
  // repeated frame-path budgetForMode() calls return the same object identity.
  //
  // Classification is diagnostic only. adaptationReady stays false: nothing here
  // mutates quality, persists a profile, or touches rules/RNG/input/save/
  // progression/topology.
  if (!globalThis.FroggyEnginePerformance) {
    const PROFILE_ORDER = Object.freeze(['compatibility', 'balanced', 'premium']);
    const MODE_ORDER = Object.freeze(['arcade', 'feastfall', 'puzzle', 'infinite']);
    const BUDGETS = Object.freeze({
      compatibility: Object.freeze({
        arcade: Object.freeze({ targetFps:45, renderDprCap:1.25, idleFps:10, particleScale:0.45, maxParticles:96, maxParticlesPerBurst:18, maxFloaters:10, backgroundStarCount:28, backgroundParticleCount:8, assetTier:'compact' }),
        feastfall: Object.freeze({ targetFps:30, renderDprCap:1.25, idleFps:20, idleMotionHz:20, particleScale:0.45, maxParticles:16, maxFloaters:4, shadows:false, lightweight:true, animatedBackground:false, tileBob:0.18, foodBreath:0.35, assetTier:'compact' }),
        puzzle: Object.freeze({ targetFps:45, renderDprCap:1.5, idleFps:20, particleScale:0.6, assetTier:'compact' }),
        infinite: Object.freeze({ targetFps:45, renderDprCap:1.25, idleFps:15, particleScale:0.5, assetTier:'compact' }),
      }),
      balanced: Object.freeze({
        arcade: Object.freeze({ targetFps:60, renderDprCap:1.75, idleFps:20, particleScale:0.72, maxParticles:180, maxParticlesPerBurst:32, maxFloaters:18, backgroundStarCount:60, backgroundParticleCount:20, assetTier:'standard' }),
        feastfall: Object.freeze({ targetFps:45, renderDprCap:1.5, idleFps:24, idleMotionHz:30, particleScale:0.72, maxParticles:180, maxFloaters:48, shadows:true, lightweight:false, animatedBackground:true, tileBob:0.8, foodBreath:1, assetTier:'standard' }),
        puzzle: Object.freeze({ targetFps:60, renderDprCap:1.75, idleFps:24, particleScale:0.8, assetTier:'standard' }),
        infinite: Object.freeze({ targetFps:45, renderDprCap:1.5, idleFps:20, particleScale:0.72, assetTier:'standard' }),
      }),
      premium: Object.freeze({
        arcade: Object.freeze({ targetFps:60, renderDprCap:3, idleFps:30, particleScale:1, maxParticles:180, maxParticlesPerBurst:32, maxFloaters:18, backgroundStarCount:60, backgroundParticleCount:20, assetTier:'full' }),
        feastfall: Object.freeze({ targetFps:60, renderDprCap:2, idleFps:30, idleMotionHz:60, particleScale:1, maxParticles:180, maxFloaters:48, shadows:true, lightweight:false, animatedBackground:true, tileBob:0.8, foodBreath:1, assetTier:'full' }),
        puzzle: Object.freeze({ targetFps:60, renderDprCap:2.5, idleFps:30, particleScale:1, assetTier:'full' }),
        infinite: Object.freeze({ targetFps:60, renderDprCap:2, idleFps:30, particleScale:1, assetTier:'full' }),
      }),
    });

    // Observation Contract v2 tuning constants.
    const OBSERVATION_RING_CAPACITY = 256;
    const OBSERVATION_MIN_DELIVERED = 90;
    const OBSERVATION_MIN_ELAPSED_MS = 1500;
    // A window dominated by stalls still has to produce evidence rather than
    // waiting forever for a delivered-frame quota it will never reach.
    const OBSERVATION_STALLED_ELAPSED_MS = 6000;
    const OBSERVATION_STALLED_MIN_DELIVERED = 20;
    const LONG_STALL_MS = 250;
    const WORST_SAMPLE_COUNT = 5;
    const HEALTHY_DELIVERED_RATIO = 0.9;
    const HEALTHY_MISSED_RATIO = 0.1;
    const HEALTHY_P95_FACTOR = 1.35;
    const HEALTHY_P99_FACTOR = 2;

    // Preallocated scratch. Only low-frequency evaluation touches these.
    const sortScratch = new Float64Array(OBSERVATION_RING_CAPACITY);

    // Defect repair (Engine v1 Stage 1): the successor's mode normalizer matched
    // only 'connect3' and 'feastfall-full', so the literal id 'feastfall' — the
    // id the Feastfall presentation host actually passes — fell through to
    // 'arcade'. Feastfall budgets and Feastfall observations were therefore being
    // read from and written into the Arcade state.
    function normalizeMode(mode) {
      const value = String(mode || '').toLowerCase();
      if (value === 'connect3' || value.indexOf('feastfall') >= 0) return 'feastfall';
      if (value.indexOf('puzzle') >= 0) return 'puzzle';
      if (value.indexOf('infinite') >= 0) return 'infinite';
      return 'arcade';
    }

    function capabilitySnapshot() {
      const nav = typeof navigator !== 'undefined' ? navigator : {};
      const memory = Math.max(0, Number(nav.deviceMemory) || 0);
      const cores = Math.max(0, Number(nav.hardwareConcurrency) || 0);
      const saveData = Boolean(nav.connection && nav.connection.saveData === true);
      const touchPoints = Math.max(0, Number(nav.maxTouchPoints) || 0);
      const coarsePointer = Boolean(typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(pointer: coarse)').matches);
      const width = Math.max(0, Number(globalThis.innerWidth) || 0);
      const height = Math.max(0, Number(globalThis.innerHeight) || 0);
      const shortestEdge = width && height ? Math.min(width, height) : 0;
      return Object.freeze({
        memory,
        cores,
        saveData,
        touchPoints,
        coarsePointer,
        width,
        height,
        shortestEdge,
        devicePixelRatio:Math.max(1, Number(globalThis.devicePixelRatio) || 1),
      });
    }

    const capability = capabilitySnapshot();

    function seedProfile() {
      if (capability.saveData) return 'compatibility';
      if (capability.memory > 0 && capability.memory <= 4) return 'compatibility';
      if (capability.cores > 0 && capability.cores <= 4) return 'compatibility';
      // Premium requires explicit strong evidence. Missing/ambiguous optional
      // memory data must not itself create an extreme Balanced<->Premium jump.
      if (capability.cores >= 8 && capability.memory >= 8) return 'premium';
      return 'balanced';
    }

    // ------------------------------------------------------------------------
    // Stable budget records
    // ------------------------------------------------------------------------
    // budgetForMode() sits on the frame path. Pre-resolve one frozen record per
    // (profile, mode) at bootstrap so repeated calls for an unchanged state
    // return the SAME object identity instead of a fresh spread/frozen literal.
    const BUDGET_RECORDS = new Map();
    for (const profile of PROFILE_ORDER) {
      const table = BUDGETS[profile] || BUDGETS.balanced;
      for (const mode of MODE_ORDER) {
        BUDGET_RECORDS.set(`${profile}:${mode}`, Object.freeze({ profile, mode, ...(table[mode] || table.arcade) }));
      }
    }
    function budgetRecord(profile, mode) {
      return BUDGET_RECORDS.get(`${profile}:${mode}`)
        || BUDGET_RECORDS.get(`balanced:${mode}`)
        || BUDGET_RECORDS.get('balanced:arcade');
    }

    const states = new Map();

    function ensureState(mode) {
      const key = normalizeMode(mode);
      if (states.has(key)) return states.get(key);
      const seeded = seedProfile();
      const state = {
        mode:key,
        profile:seeded,
        seedProfile:seeded,
        source:'capability-seed',
        adjusted:false,
        cadencePreferenceFps:0,
        cadencePreferenceSource:'',
        // Cadence epoch identity. Only a legitimate boundary advances epochId.
        epochId:0,
        windowId:0,
        boundaryReason:'mode-enter',
        intendedFps:0,
        expectedPeriodMs:0,
        phase:'unqualified',
        started:false,
        // Bounded window accounting.
        windowStartedAt:0,
        lastPresentedAt:0,
        delivered:0,
        intendedDeadlines:0,
        missedDeadlines:0,
        longStallCount:0,
        longestStallMs:0,
        intervalTotalMs:0,
        ring:new Float64Array(OBSERVATION_RING_CAPACITY),
        ringWrites:0,
        lastEvaluation:null,
        // Mode entry is completed by the first real scheduler presentation so
        // the epoch starts with that scheduler's actual cadence/phase instead
        // of opening an unqualified epoch and immediately opening a second one.
        pendingBoundaryReason:'',
      };
      states.set(key, state);
      return state;
    }

    function budgetForMode(mode) {
      const state = ensureState(mode);
      return budgetRecord(state.profile, state.mode);
    }

    function normalizeIntendedFps(value) {
      return Math.max(0, Math.min(240, Number(value) || 0));
    }

    function publishPerformanceChange(state, reason) {
      if (typeof globalThis.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
      try {
        globalThis.dispatchEvent(new CustomEvent('froggy-engine-performance-change', {
          detail:Object.freeze({ mode:state.mode, profile:state.profile, source:state.source,
            reason:String(reason || 'presentation-budget-change'), budget:budgetForMode(state.mode),
            effectiveTargetFps:targetFpsForMode(state.mode) }),
        }));
      } catch (_) {}
    }
    function setProfileForMode(mode, profileValue, sourceValue = 'external-profile') {
      const state = ensureState(mode);
      const profile = PROFILE_ORDER.includes(String(profileValue || '')) ? String(profileValue) : state.profile;
      const source = String(sourceValue || 'external-profile');
      const changed = state.profile !== profile || state.source !== source;
      state.profile = profile; state.source = source; state.adjusted = state.profile !== state.seedProfile;
      if (changed) publishPerformanceChange(state, 'profile-input');
      return budgetForMode(state.mode);
    }
    function setCadencePreferenceForMode(mode, fpsValue = 0, sourceValue = 'external-cadence') {
      const state = ensureState(mode);
      const fps = normalizeIntendedFps(fpsValue); const source = String(sourceValue || 'external-cadence');
      const changed = Math.abs(state.cadencePreferenceFps - fps) >= 0.001 || state.cadencePreferenceSource !== source;
      state.cadencePreferenceFps = fps; state.cadencePreferenceSource = source;
      if (changed) publishPerformanceChange(state, 'cadence-input');
      return targetFpsForMode(state.mode);
    }
    function targetFpsForMode(mode, preferredFpsValue = 0) {
      const state = ensureState(mode);
      const designTarget = Math.max(1, Number(budgetForMode(state.mode).targetFps) || 60);
      const suppliedPreference = normalizeIntendedFps(preferredFpsValue);
      const storedPreference = normalizeIntendedFps(state.cadencePreferenceFps);
      const preference = suppliedPreference > 0 ? suppliedPreference : storedPreference;
      return preference > 0 ? Math.min(designTarget, preference) : designTarget;
    }

    function normalizePhase(value, intendedFps) {
      const phaseValue = String(value || (intendedFps > 0 ? 'active' : 'unqualified')).trim().toLowerCase();
      return phaseValue || (intendedFps > 0 ? 'active' : 'unqualified');
    }

    // Roll the measurement window inside the CURRENT cadence epoch. Used after
    // an evaluation. Epoch identity, intended cadence and phase are preserved.
    function rollWindow(state, now) {
      state.windowId += 1;
      state.windowStartedAt = now;
      state.delivered = 0;
      state.intendedDeadlines = 0;
      state.missedDeadlines = 0;
      state.longStallCount = 0;
      state.longestStallMs = 0;
      state.intervalTotalMs = 0;
      state.ringWrites = 0;
    }

    // Open a NEW cadence epoch. Only mode entry/exit, phase change, intended-FPS
    // change and lifecycle pause/resume may call this. A long stall may not.
    function openEpoch(state, now, intendedFps, phase, reason) {
      state.epochId += 1;
      state.boundaryReason = reason;
      state.intendedFps = intendedFps;
      state.expectedPeriodMs = intendedFps > 0 ? 1000 / intendedFps : 0;
      state.phase = phase;
      state.pendingBoundaryReason = '';
      state.started = true;
      state.lastPresentedAt = now;
      state.windowId = -1;
      rollWindow(state, now);
    }

    function sameCadenceEpoch(state, intendedFps, phase) {
      if (!state.started) return false;
      if (state.phase !== phase) return false;
      if (state.intendedFps === 0 && intendedFps === 0) return true;
      return Math.abs(state.intendedFps - intendedFps) < 0.25;
    }

    function percentileFromSorted(sorted, count, fraction) {
      if (count <= 0) return 0;
      return sorted[Math.min(count - 1, Math.floor((count - 1) * fraction))];
    }

    function readyToEvaluate(state, now) {
      const elapsed = now - state.windowStartedAt;
      if (state.delivered >= OBSERVATION_MIN_DELIVERED && elapsed >= OBSERVATION_MIN_ELAPSED_MS) return true;
      // Severe-stall escape hatch: evidence must still be produced.
      return elapsed >= OBSERVATION_STALLED_ELAPSED_MS && state.delivered >= OBSERVATION_STALLED_MIN_DELIVERED;
    }

    function evaluate(state, now) {
      if (!readyToEvaluate(state, now)) return false;

      const retained = Math.min(state.ringWrites, OBSERVATION_RING_CAPACITY);
      for (let index = 0; index < retained; index += 1) {
        sortScratch[index] = state.ring[(state.ringWrites - retained + index) % OBSERVATION_RING_CAPACITY];
      }
      const sorted = sortScratch.subarray(0, retained);
      sorted.sort();

      const worst = [];
      for (let index = retained - 1; index >= 0 && worst.length < WORST_SAMPLE_COUNT; index -= 1) {
        worst.push(Math.round(sorted[index] * 100) / 100);
      }

      const qualified = state.intendedFps > 0;
      const budget = budgetForMode(state.mode);
      const expectedPeriodMs = qualified
        ? state.expectedPeriodMs
        : 1000 / Math.max(1, Number(budget.targetFps) || 60);
      const intendedDeadlines = Math.max(1, state.intendedDeadlines);
      const deliveredRatio = Math.min(1, state.delivered / intendedDeadlines);
      const missedRatio = Math.min(1, state.missedDeadlines / intendedDeadlines);
      const meanMs = state.delivered > 0 ? state.intervalTotalMs / state.delivered : 0;
      const p95Ms = percentileFromSorted(sorted, retained, 0.95);
      const p99Ms = percentileFromSorted(sorted, retained, 0.99);

      const pressureCandidate = qualified && (
        deliveredRatio < HEALTHY_DELIVERED_RATIO
        || missedRatio > HEALTHY_MISSED_RATIO
        || p95Ms > expectedPeriodMs * HEALTHY_P95_FACTOR
        || p99Ms > expectedPeriodMs * HEALTHY_P99_FACTOR
        || state.longStallCount > 0
      );

      // Low-frequency diagnostic snapshot. This is the one allocation site, and
      // it happens once per evaluated window, never per frame.
      state.lastEvaluation = Object.freeze({
        contract:'cadence-deadline-v2',
        mode:state.mode,
        epochId:state.epochId,
        windowId:state.windowId,
        boundaryReason:state.boundaryReason,
        phase:state.phase,
        qualified,
        intendedFps:qualified ? Math.round(state.intendedFps * 100) / 100 : null,
        expectedPeriodMs:Math.round(expectedPeriodMs * 1000) / 1000,
        budgetTargetFps:Math.max(1, Number(budget.targetFps) || 60),
        intendedDeadlines:state.intendedDeadlines,
        deliveredPresentations:state.delivered,
        deliveredRatio:Math.round(deliveredRatio * 1000) / 1000,
        missedDeadlines:state.missedDeadlines,
        missedRatio:Math.round(missedRatio * 1000) / 1000,
        meanMs:Math.round(meanMs * 100) / 100,
        p95Ms:Math.round(p95Ms * 100) / 100,
        p99Ms:Math.round(p99Ms * 100) / 100,
        worstMs:Object.freeze(worst),
        longStallCount:state.longStallCount,
        longestStallMs:Math.round(state.longestStallMs * 100) / 100,
        longStallThresholdMs:LONG_STALL_MS,
        elapsedMs:Math.round(now - state.windowStartedAt),
        retainedSamples:retained,
        ringCapacity:OBSERVATION_RING_CAPACITY,
        classification:qualified
          ? (pressureCandidate ? 'pressure-candidate-qualified' : 'healthy-qualified')
          : 'observation-only',
      });

      rollWindow(state, now);

      // Qualified pressure is intentionally only a candidate. Central mutation
      // stays off until every scheduler reports intended cadence, boundaries are
      // browser-witnessed, and mode-state isolation is complete. The temporary
      // local governors remain the only adaptation authority.
      return false;
    }

    function notePresented(mode, timestamp, intendedFpsValue = 0, phaseValue = '') {
      const now = Number(timestamp);
      if (!Number.isFinite(now)) return false;
      const state = ensureState(mode);
      if (typeof document !== 'undefined' && document.hidden) {
        // Background time is not foreground pressure. Close the epoch instead of
        // letting the eventual resume look like one enormous stall.
        if (state.started && state.boundaryReason !== 'lifecycle-hidden') {
          openEpoch(state, now, state.intendedFps, state.phase, 'lifecycle-hidden');
        }
        return false;
      }
      const intendedFps = normalizeIntendedFps(intendedFpsValue);
      const phase = normalizePhase(phaseValue, intendedFps);

      // mode-enter is deliberately pending until the destination scheduler has
      // produced its first real presentation intent. That makes mode entry one
      // epoch boundary even when the destination cadence differs from the last
      // time that mode ran (or the state has never presented before).
      if (state.pendingBoundaryReason) {
        openEpoch(state, now, intendedFps, phase, state.pendingBoundaryReason);
        return false;
      }

      if (!sameCadenceEpoch(state, intendedFps, phase)) {
        const reason = !state.started
          ? 'mode-enter'
          : (state.phase !== phase ? 'phase-change' : 'cadence-change');
        openEpoch(state, now, intendedFps, phase, reason);
        return false;
      }

      const delta = now - state.lastPresentedAt;
      state.lastPresentedAt = now;
      if (!(delta > 0)) return false;

      state.delivered += 1;
      state.intervalTotalMs += delta;
      state.ring[state.ringWrites % OBSERVATION_RING_CAPACITY] = delta;
      state.ringWrites += 1;

      // Deadline accounting against the cadence the SCHEDULER said it intended.
      // A presentation may run up to half an intended period late before it is
      // treated as having consumed the following deadline.
      const consumed = state.expectedPeriodMs > 0
        ? Math.max(1, Math.round(delta / state.expectedPeriodMs))
        : 1;
      state.intendedDeadlines += consumed;
      state.missedDeadlines += consumed - 1;

      // A long frame is evidence. It is never an epoch boundary.
      if (delta >= LONG_STALL_MS) {
        state.longStallCount += 1;
        if (delta > state.longestStallMs) state.longestStallMs = delta;
      }

      return evaluate(state, now);
    }

    // Explicit lifecycle / mode boundaries. Reasons: 'mode-enter', 'mode-exit',
    // 'lifecycle-pause', 'lifecycle-resume', 'lifecycle-hidden',
    // 'lifecycle-visible'. Scalar arguments; no options object.
    function noteLifecycle(reasonValue, timestamp, modeValue = '') {
      const now = Number(timestamp);
      if (!Number.isFinite(now)) return false;
      const reason = String(reasonValue || 'lifecycle').trim().toLowerCase() || 'lifecycle';
      if (modeValue) {
        const state = ensureState(modeValue);
        if (reason === 'mode-enter') {
          state.pendingBoundaryReason = 'mode-enter';
          return true;
        }
        openEpoch(state, now, state.intendedFps, state.phase, reason);
        return true;
      }
      for (const state of states.values()) openEpoch(state, now, state.intendedFps, state.phase, reason);
      return true;
    }

    function profileForMode(mode) {
      return ensureState(mode).profile;
    }

    // Bounded storage diagnostic. Low frequency; QA/reporting only.
    function observationStorage(mode) {
      const state = ensureState(mode || 'arcade');
      const retained = Math.min(state.ringWrites, OBSERVATION_RING_CAPACITY);
      return Object.freeze({
        mode:state.mode,
        ringCapacity:OBSERVATION_RING_CAPACITY,
        ringBytes:state.ring.byteLength,
        ringWrites:state.ringWrites,
        retainedSamples:retained,
        newestIntervalMs:state.ringWrites > 0 ? state.ring[(state.ringWrites - 1) % OBSERVATION_RING_CAPACITY] : 0,
        oldestRetainedIntervalMs:retained > 0 ? state.ring[(state.ringWrites - retained) % OBSERVATION_RING_CAPACITY] : 0,
      });
    }

    function snapshot(mode) {
      const state = ensureState(mode || 'arcade');
      return Object.freeze({
        version:4,
        adaptationReady:false,
        observationContract:'cadence-deadline-v2',
        mode:state.mode,
        profile:state.profile,
        seedProfile:state.seedProfile,
        source:state.source,
        adjusted:false,
        budget:budgetForMode(state.mode),
        capability,
        epochId:state.epochId,
        windowId:state.windowId,
        boundaryReason:state.boundaryReason,
        phase:state.phase,
        intendedFps:state.intendedFps,
        effectiveTargetFps:targetFpsForMode(state.mode),
        cadencePreferenceFps:state.cadencePreferenceFps,
        cadencePreferenceSource:state.cadencePreferenceSource,
        lastEvaluation:state.lastEvaluation,
      });
    }

    const api = Object.freeze({
      version:4,
      adaptationReady:false,
      observationContract:'cadence-deadline-v2',
      profileOrder:PROFILE_ORDER,
      modeOrder:MODE_ORDER,
      budgets:BUDGETS,
      capability,
      observationRingCapacity:OBSERVATION_RING_CAPACITY,
      longStallThresholdMs:LONG_STALL_MS,
      normalizeMode,
      profileForMode,
      budgetForMode,
      targetFpsForMode,
      setProfileForMode,
      setCadencePreferenceForMode,
      notePresented,
      noteLifecycle,
      observationStorage,
      snapshot,
    });
    globalThis.FroggyEnginePerformance = api;
    for (const mode of MODE_ORDER) ensureState(mode);

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
        noteLifecycle(document.hidden ? 'lifecycle-hidden' : 'lifecycle-visible', now);
      });
    }
  }

  const params = new URLSearchParams(globalThis.location?.search || '');
  const native = globalThis.FROGGY_NATIVE_APP === true;
  const allowFileQa = globalThis.FROGGY_DEV_SURFACE === true && params.get('allowFileQa') === '1';
  const blocked = !native && globalThis.location?.protocol === 'file:' && !allowFileQa;
  const api = Object.freeze({ blocked, native, protocol: globalThis.location?.protocol || '', allowFileQa });
  globalThis.FroggyLaunchOrigin = api;
  if (!blocked || typeof document === 'undefined') return;

  const title = 'Launch TOADAL FEAST! with its local playtest server';
  document.open();
  document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
  :root{color-scheme:dark;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#06140d;color:#efffe8}*{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 15%,#184725,#06140d 58%,#020805)}main{width:min(620px,100%);padding:clamp(24px,5vw,42px);border:1px solid rgba(194,255,164,.34);border-radius:24px;background:rgba(7,30,17,.96);box-shadow:0 28px 80px rgba(0,0,0,.52)}h1{margin:0 0 14px;color:#9df36d;font-size:clamp(1.8rem,6vw,2.8rem)}p{color:#c8dfc6;line-height:1.55}strong,code{color:#fff0a8}code{display:block;margin:18px 0;padding:14px 16px;border-radius:12px;background:#020805;border:1px solid rgba(255,255,255,.12);font:700 .95rem/1.45 ui-monospace,monospace;word-break:break-word}.why{font-size:.9rem;color:#a9c3aa}.badge{display:inline-block;margin-bottom:12px;padding:5px 10px;border-radius:999px;background:rgba(255,198,73,.14);border:1px solid rgba(255,198,73,.35);color:#ffe39a;font-weight:800;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase}</style></head><body><main><span class="badge">Save protection</span><h1>${title}</h1><p>Close this tab and double-click the launcher included beside the game files:</p><code>START_TOADAL_FEAST.cmd</code><p class="why">Opening internal HTML files directly with <strong>file://</strong> can create separate save origins, inconsistent coins/unlocks, blocked audio, and broken navigation. The launcher starts the bundled local server and opens the one canonical <strong>index.html</strong> product.</p></main></body></html>`);
  document.close();
})();
