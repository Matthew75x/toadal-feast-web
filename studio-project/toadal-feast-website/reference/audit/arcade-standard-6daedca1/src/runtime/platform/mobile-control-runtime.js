// ============================================================
// src/runtime/platform/mobile-control-runtime.js — Arcade analog-first touch HUD
// ============================================================
// Default touch controls are a fixed lower-left analog and a visible action
// button on the lower-right. Players may hide the control artwork in Settings.

const FroggyMobileControls = (() => {
  'use strict';

  const STORAGE_KEY = 'froggyFeast.mobileControls.mode.v2';
  const VISUAL_STORAGE_KEY = 'froggyFeast.mobileControls.visual.v1';
  const CONTROL_STYLE_STORAGE_KEY = 'froggyFeast.mobileControls.controlStyle.v1';
  const VISIBILITY_STORAGE_KEY = 'froggyFeast.mobileControls.visibility.v1';
  const ACTION_STYLE_STORAGE_KEY = 'froggyFeast.mobileControls.actionStyle.v1';
  const VISUAL_MODES = Object.freeze(['invisible', 'faint', 'visible']);
  const CONTROL_STYLES = Object.freeze(['auto', 'one-hand', 'two-hands']);
  const VISIBILITY_MODES = Object.freeze(['minimal', 'faint', 'analog', 'fixed', 'buttons', 'full']);
  const ACTION_STYLES = Object.freeze(['smart', 'toggle', 'hold']);
  const MODES = Object.freeze(['joystick', 'buttons']);
  const KEY_NAMES = Object.freeze(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const DEFAULT_MODE = 'joystick';
  const DEFAULT_CONTROL_STYLE = 'auto';
  const DEFAULT_VISIBILITY_MODE = 'minimal';
  const DEFAULT_ACTION_STYLE = 'smart';
  const DEFAULT_CONTROL_HINTS = true;
  const TAP_MAX_MS = 300;
  const TAP_MAX_DISTANCE_PX = 12;
  const HOLD_GESTURE_MS = 380;
  const RETOUCH_WINDOW_MS = 145;
  const RETOUCH_RADIUS_PX = 56;

  let root = null;
  let joystick = null;
  let knob = null;
  let modeButton = null;
  let actionButton = null;
  let actionLabel = null;
  let actionHint = null;
  let abilityHint = null;
  let abilityHintText = null;
  let secondaryActionButton = null;
  let secondaryActionLabel = null;
  let secondaryActionHint = null;
  let tertiaryActionButton = null;
  let tertiaryActionLabel = null;
  let tertiaryActionHint = null;
  let hopButton = null;
  let actionResource = null;
  let actionResourceLabel = null;
  let actionResourceValue = null;
  let actionResourceFill = null;
  let actionResourceThreshold = null;
  let getRequirements = () => [];
  let getActions = () => [];
  let dispatchPrimaryAction = null;
  let getPlaying = () => false;
  let mode = readMode();
  let pointerId = null;
  let movementUsesFixedAssist = false;
  let joystickOriginX = 0;
  let joystickOriginY = 0;
  let joystickStartedAt = 0;
  let joystickMaxDisplacement = 0;
  let joystickDirectionChanges = 0;
  let lastAxisDirection = 0;
  const actionPointers = new Map();
  let visualMode = readVisualMode();
  function canonicalSettingsManager() {
    return typeof SettingsManager !== 'undefined' ? SettingsManager : globalThis.SettingsManager;
  }
  function readCanonicalSettings() {
    try {
      const value = canonicalSettingsManager()?.get?.('mobileControls');
      return value && typeof value === 'object' ? value : null;
    } catch (_) { return null; }
  }
  const canonicalControls = readCanonicalSettings();
  let controlStyle = CONTROL_STYLES.includes(canonicalControls?.controlStyle)
    ? canonicalControls.controlStyle : readStoredChoice(CONTROL_STYLE_STORAGE_KEY, CONTROL_STYLES, DEFAULT_CONTROL_STYLE);
  let visibilityMode = VISIBILITY_MODES.includes(canonicalControls?.visibilityMode)
    ? canonicalControls.visibilityMode : readStoredChoice(VISIBILITY_STORAGE_KEY, VISIBILITY_MODES, DEFAULT_VISIBILITY_MODE);
  let actionStyle = ACTION_STYLES.includes(canonicalControls?.actionStyle)
    ? canonicalControls.actionStyle : readStoredChoice(ACTION_STYLE_STORAGE_KEY, ACTION_STYLES, DEFAULT_ACTION_STYLE);
  let controlHints = typeof canonicalControls?.controlHints === 'boolean'
    ? canonicalControls.controlHints : DEFAULT_CONTROL_HINTS;
  let oneHandToggleHeld = false;
  let oneHandHoldActive = false;
  let oneHandHoldTimer = 0;
  let lastMovementRelease = null;
  let lastRequirements = [];
  let lastVisible = false;
  let verticalEnabled = false;
  let downOnlyVertical = false;
  let initialized = false;
  let hintTimer = 0;
  let restTimer = 0;
  let lastCharacterKey = '';
  let lastActionKey = '';
  let toadalChargeVisualFrame = 0;
  let lastToadalChargeVisualRatio = 0;
  let lastToadalChargeVisualCharging = false;

  function readStoredChoice(key, allowed, fallback) {
    try {
      const value = localStorage.getItem(key);
      return allowed.includes(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStoredChoice(key, allowed, fallback, value) {
    const next = allowed.includes(value) ? value : fallback;
    try { localStorage.setItem(key, next); } catch (_) {}
    return next;
  }

  function readMode() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(value) ? value : DEFAULT_MODE;
    } catch (_) {
      return DEFAULT_MODE;
    }
  }

  function writeMode(value) {
    mode = MODES.includes(value) ? value : DEFAULT_MODE;
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
    return mode;
  }

  function readVisualMode() {
    try {
      const requested = new URLSearchParams(location.search).get('ffJoystickVisual');
      if (VISUAL_MODES.includes(requested)) return requested;
      const stored = localStorage.getItem(VISUAL_STORAGE_KEY);
      return VISUAL_MODES.includes(stored) ? stored : 'invisible';
    } catch (_) {
      return 'invisible';
    }
  }

  function writeVisualMode(value) {
    visualMode = VISUAL_MODES.includes(value) ? value : 'invisible';
    try { localStorage.setItem(VISUAL_STORAGE_KEY, visualMode); } catch (_) {}
    if (joystick) joystick.dataset.visualMode = visualMode;
    return visualMode;
  }

  function emitControlTelemetry(phase, detail = {}) {
    root?.dispatchEvent(new CustomEvent('froggy-mobile-control-input', {
      bubbles: true,
      detail: { phase, mode:effectiveMode(lastRequirements), visualMode:effectiveVisualMode(), controlStyle, visibilityMode, actionStyle, controlHints, ...detail }
    }));
  }

  function touchPrimary() {
    const coarsePrimary = Boolean(globalThis.matchMedia?.('(pointer: coarse)')?.matches);
    const touchOnlyHover = Boolean(Number(navigator.maxTouchPoints || 0) > 0
      && globalThis.matchMedia?.('(hover: none)')?.matches);
    return coarsePrimary || touchOnlyHover;
  }

  function currentCharacter() {
    try {
      const definition = typeof getCharDef === 'function' ? getCharDef() : null;
      const profile = definition && typeof getArcadeCharacterBehaviorProfile === 'function'
        ? getArcadeCharacterBehaviorProfile(definition)
        : null;
      return { definition, profile };
    } catch (_) {
      return { definition:null, profile:null };
    }
  }

  function cloneHeld() {
    try { return Boolean(typeof GameState !== 'undefined' && GameState?.charState?.flytrap?.cloneHeld); }
    catch (_) { return false; }
  }

  function actionDescriptor(requirements = []) {
    const { definition, profile } = currentCharacter();
    const id = String(definition?.id || profile?.id || 'classic');
    const cloneAction = requirements.includes('clone-pickup') || requirements.includes('clone-place');
    if (cloneAction) {
      const held = cloneHeld();
      return Object.freeze({
        visible:true,
        kind:'context',
        label:held ? 'PLANT' : 'PICK UP',
        hint:held ? 'Tap to place clone' : 'Tap to carry clone',
        guide:held ? 'Tap to plant your helper' : 'Tap to pick up your helper',
        aria:held ? 'Plant Flytrap clone' : 'Pick up Flytrap clone',
      });
    }
    if (requirements.includes('four-direction')) {
      return Object.freeze({ visible:false, kind:'passive', label:'', hint:'', guide:'Scoop food automatically', aria:'' });
    }
    if (requirements.includes('hold-primary')) {
      const gulperToadal = id === 'gulper' && typeof GameState !== 'undefined' && GameState.isTC;
      const copy = id === 'gulper'
        ? (gulperToadal
          ? { label:'CLOSE', hint:'Hold to close · release to eat', guide:'Mouth stays open; hold only to close it', aria:'Hold to close Gulper mouth' }
          : { label:'OPEN', hint:'Hold to open mouth', guide:'Hold to open wide', aria:'Hold to open Gulper mouth' })
        : id === 'bob'
          ? { label:'LEAN', hint:'Hold to reach farther', guide:'Hold to lean the basket', aria:'Hold to lean basket' }
          : { label:'HOLD', hint:'Hold special action', guide:'Hold for special action', aria:'Hold special action' };
      return Object.freeze({ visible:true, kind:'hold', ...copy });
    }
    if (requirements.includes('primary-action')) {
      const label = id === 'chameleon' ? 'HOOK' : 'TONGUE';
      const hint = id === 'chameleon' ? 'Tap to hook food' : 'Tap to catch';
      return Object.freeze({ visible:true, kind:'tap', label, hint, guide:hint, aria:hint });
    }
    return Object.freeze({ visible:false, kind:'passive', label:'', hint:'', guide:'Catch automatically', aria:'' });
  }

  function suppliedActions(requirements = []) {
    try {
      const actions = getActions(requirements);
      return Array.isArray(actions) ? actions.filter(action => action && action.visible !== false) : [];
    } catch (_) { return []; }
  }

  function primaryDescriptor(requirements = []) {
    const supplied = suppliedActions(requirements);
    return supplied.find(action => action.slot === 'primary') || supplied[0] || actionDescriptor(requirements);
  }

  function dispatchSuppliedPrimary(descriptor, phase = 'press') {
    if (!descriptor || descriptor.kind !== 'event' || typeof dispatchPrimaryAction !== 'function') return false;
    try { return dispatchPrimaryAction(phase, descriptor) !== false; } catch (_) { return false; }
  }

  function guideText(requirements = [], descriptor = primaryDescriptor(requirements)) {
    const { definition } = currentCharacter();
    const id = String(definition?.id || 'classic');
    const name = String(definition?.name || 'Character');
    const crouchHop = requirements.includes('toadal-crouch-hop');
    // Toadal has the richest launch kit, so his onboarding must be the shortest.
    // The control surface itself carries TONGUE / THROW / BLOCK labels and costs;
    // this one-line hint only teaches the one non-standard gesture.
    if (id === 'toadal' && crouchHop) {
      return visibilityMode === 'fixed'
        ? 'Drag anywhere · or use the bottom-right assist · pull down and release to spring'
        : 'Drag anywhere · pull down · hold · release to spring';
    }
    const movement = requirements.includes('four-direction')
      ? (visibilityMode === 'fixed' ? 'Drag anywhere to move · bottom-right assist is optional' : 'Drag anywhere to move')
      : (visibilityMode === 'fixed' ? 'Drag anywhere left/right · bottom-right assist is optional' : 'Drag anywhere left or right');
    const action = descriptor.visible ? descriptor.guide : descriptor.guide || 'Automatic catch';
    return `${name}: ${movement} · ${action}`;
  }

  function singleFingerActionsEnabled() {
    // Visible/fixed controls are an optional assist, never a replacement for
    // the original one-hand gesture grammar.
    return controlStyle === 'auto' || controlStyle === 'one-hand';
  }

  function secondFingerActionsEnabled() {
    return controlStyle === 'auto' || controlStyle === 'two-hands';
  }

  function clearOneHandHold(reason = 'clear') {
    clearTimeout(oneHandHoldTimer);
    oneHandHoldTimer = 0;
    if (oneHandHoldActive || oneHandToggleHeld) {
      try { EventBus?.emit?.('spaceUp'); } catch (_) {}
      emitControlTelemetry('one-hand-hold-end', { reason });
    }
    oneHandHoldActive = false;
    oneHandToggleHeld = false;
  }

  function pulseOneHandAction(descriptor, reason = 'tap') {
    if (!descriptor?.visible) return false;
    try { AudioManager?.init?.(); } catch (_) {}
    if (descriptor.kind === 'event') {
      if (!dispatchSuppliedPrimary(descriptor, 'press')) return false;
    } else if (descriptor.kind === 'context') {
      try {
        if (cloneHeld()) EventBus?.emit?.('clonePlace');
        else EventBus?.emit?.('clonePickup');
      } catch (_) {}
    } else if (descriptor.kind === 'tap') {
      try {
        EventBus?.emit?.('shootPressed');
        EventBus?.emit?.('spaceDown');
        EventBus?.emit?.('spaceUp');
      } catch (_) {}
    } else if (descriptor.kind === 'hold') {
      if (actionStyle === 'smart' || actionStyle === 'toggle') {
        try {
          if (oneHandToggleHeld) EventBus?.emit?.('spaceUp');
          else { EventBus?.emit?.('shootPressed'); EventBus?.emit?.('spaceDown'); }
        } catch (_) {}
        oneHandToggleHeld = !oneHandToggleHeld;
      } else {
        // Hold-style one-hand actions are started by a deliberate stationary
        // press timer so ordinary movement does not accidentally activate them.
        return false;
      }
    } else {
      return false;
    }
    emitControlTelemetry('one-hand-action', { actionKind:descriptor.kind, reason, toggled:Boolean(oneHandToggleHeld) });
    return true;
  }

  function scheduleOneHandHoldGesture() {
    clearTimeout(oneHandHoldTimer);
    if (!singleFingerActionsEnabled() || actionStyle !== 'hold') return;
    const descriptor = primaryDescriptor(lastRequirements);
    if (descriptor.kind !== 'hold') return;
    oneHandHoldTimer = setTimeout(() => {
      oneHandHoldTimer = 0;
      if (pointerId === null || joystickMaxDisplacement > TAP_MAX_DISTANCE_PX || oneHandHoldActive) return;
      try {
        EventBus?.emit?.('shootPressed');
        EventBus?.emit?.('spaceDown');
        oneHandHoldActive = true;
        emitControlTelemetry('one-hand-hold-start', { actionKind:descriptor.kind });
      } catch (_) {}
    }, HOLD_GESTURE_MS);
  }

  function maybeRetouchAction(event) {
    if (!singleFingerActionsEnabled() || !lastMovementRelease) return false;
    const age = performance.now() - lastMovementRelease.at;
    const distance = Math.hypot(Number(event.clientX) - lastMovementRelease.x, Number(event.clientY) - lastMovementRelease.y);
    if (age > RETOUCH_WINDOW_MS || distance > RETOUCH_RADIUS_PX) return false;
    lastMovementRelease = null;
    return pulseOneHandAction(primaryDescriptor(lastRequirements), 'retouch');
  }

  function persistCanonicalSettings() {
    const next = { controlStyle, visibilityMode, actionStyle, controlHints };
    try { canonicalSettingsManager()?.set?.('mobileControls', next); } catch (_) {}
  }

  function writeControlStyle(value) {
    const previous = controlStyle;
    controlStyle = writeStoredChoice(CONTROL_STYLE_STORAGE_KEY, CONTROL_STYLES, DEFAULT_CONTROL_STYLE, value);
    persistCanonicalSettings();
    if (controlStyle !== previous) {
      clearOneHandHold('control-style-change');
      releaseAllActionPointers('control-style-change');
      emitControlTelemetry('settings', { controlStyle });
      update({ visible:lastVisible, requirements:lastRequirements });
    }
    return controlStyle;
  }

  function writeVisibilityMode(value) {
    const previous = visibilityMode;
    visibilityMode = writeStoredChoice(VISIBILITY_STORAGE_KEY, VISIBILITY_MODES, DEFAULT_VISIBILITY_MODE, value);
    persistCanonicalSettings();
    if (visibilityMode !== previous) {
      releaseJoystick(null, 'visibility-mode-change');
      clearOneHandHold('visibility-mode-change');
    }
    emitControlTelemetry('settings', { visibilityMode });
    update({ visible:lastVisible, requirements:lastRequirements });
    return visibilityMode;
  }

  function writeActionStyle(value) {
    const previous = actionStyle;
    actionStyle = writeStoredChoice(ACTION_STYLE_STORAGE_KEY, ACTION_STYLES, DEFAULT_ACTION_STYLE, value);
    persistCanonicalSettings();
    if (actionStyle !== previous) clearOneHandHold('action-style-change');
    emitControlTelemetry('settings', { actionStyle });
    update({ visible:lastVisible, requirements:lastRequirements });
    return actionStyle;
  }

  function writeControlHints(value) {
    controlHints = Boolean(value);
    persistCanonicalSettings();
    if (!controlHints) {
      clearTimeout(hintTimer);
      root?.classList.remove('mobile-controls--hint-visible');
      if (abilityHint) abilityHint.hidden = true;
    }
    emitControlTelemetry('settings', { controlHints });
    update({ visible:lastVisible, requirements:lastRequirements });
    return controlHints;
  }

  function resetPreferences() {
    controlStyle = writeStoredChoice(CONTROL_STYLE_STORAGE_KEY, CONTROL_STYLES, DEFAULT_CONTROL_STYLE, DEFAULT_CONTROL_STYLE);
    visibilityMode = writeStoredChoice(VISIBILITY_STORAGE_KEY, VISIBILITY_MODES, DEFAULT_VISIBILITY_MODE, DEFAULT_VISIBILITY_MODE);
    actionStyle = writeStoredChoice(ACTION_STYLE_STORAGE_KEY, ACTION_STYLES, DEFAULT_ACTION_STYLE, DEFAULT_ACTION_STYLE);
    controlHints = DEFAULT_CONTROL_HINTS;
    persistCanonicalSettings();
    clearOneHandHold('settings-reset');
    update({ visible:lastVisible, requirements:lastRequirements });
  }

  function effectiveVisualMode() {
    if (visibilityMode === 'faint') return 'faint';
    if (visibilityMode === 'analog' || visibilityMode === 'fixed' || visibilityMode === 'full') return 'visible';
    // Minimal is a true clean-screen mode for every character, including
    // Toadal. Gesture input remains fully active underneath.
    return 'invisible';
  }

  function fixedJoystickGeometry() {
    if (visibilityMode !== 'fixed' || !joystick) return null;
    const ring = joystick.querySelector('.mob-joystick-ring');
    const rect = ring?.getBoundingClientRect?.();
    if (!rect || rect.width < 1 || rect.height < 1) return null;
    return {
      x:rect.left + rect.width / 2,
      y:rect.top + rect.height / 2,
      hitRadius:Math.max(58, Math.max(rect.width, rect.height) / 2 + 18),
    };
  }

  function setVirtualKey(key, pressed) {
    if (typeof InputManager !== 'undefined' && InputManager?.setVirtualKey) {
      InputManager.setVirtualKey(key, Boolean(pressed));
    }
  }

  function setAnalogAxis(x, y) {
    if (typeof InputManager !== 'undefined' && typeof InputManager?.setVirtualAxis === 'function') {
      InputManager.setVirtualAxis(Number(x) || 0, Number(y) || 0);
      KEY_NAMES.forEach(key => setVirtualKey(key, false));
      return;
    }
    const threshold = 0.28;
    setVirtualKey('ArrowLeft', x < -threshold);
    setVirtualKey('ArrowRight', x > threshold);
    setVirtualKey('ArrowUp', verticalEnabled && !downOnlyVertical && y < -threshold);
    setVirtualKey('ArrowDown', verticalEnabled && y > threshold);
  }

  function clearDirectionalInput(reason = 'cancel') {
    KEY_NAMES.forEach(key => setVirtualKey(key, false));
    if (typeof InputManager !== 'undefined' && typeof InputManager?.setVirtualAxis === 'function') {
      InputManager.setVirtualAxis(0, 0);
    }
    // A normal joystick release is meaningful input for Toadal: the next game
    // frame must observe Down -> released and launch the charged hop.  Hard
    // interruption paths (blur/cancel/hide/mode change) still clear transient
    // state and cancel crouch so they can never create a surprise jump.
    if (reason !== 'end' && typeof InputManager !== 'undefined') InputManager?.clearTransientInput?.();
  }

  function scheduleRest() {
    clearTimeout(restTimer);
    root?.classList.remove('mobile-controls--resting');
    restTimer = setTimeout(() => root?.classList.add('mobile-controls--resting'), 1500);
  }

  function showGuide(duration = 3600) {
    if (!controlHints || !root || !abilityHint) return;
    const coach = document.getElementById('arcadeFirstRunCoach');
    if (coach?.classList.contains('is-visible')) return;
    clearTimeout(hintTimer);
    root.classList.add('mobile-controls--hint-visible');
    abilityHint.hidden = false;
    hintTimer = setTimeout(() => {
      root?.classList.remove('mobile-controls--hint-visible');
      if (abilityHint) abilityHint.hidden = true;
    }, duration);
  }

  function setJoystickOrigin(x, y) {
    joystickOriginX = Math.max(0, Math.min(Number(globalThis.innerWidth || 0), Number(x) || 0));
    joystickOriginY = Math.max(0, Math.min(Number(globalThis.innerHeight || 0), Number(y) || 0));
    joystick?.style.setProperty('--stick-origin-x', `${joystickOriginX.toFixed(1)}px`);
    joystick?.style.setProperty('--stick-origin-y', `${joystickOriginY.toFixed(1)}px`);
  }

  function clearToadalChargeVisual() {
    if (toadalChargeVisualFrame) cancelAnimationFrame(toadalChargeVisualFrame);
    toadalChargeVisualFrame = 0;
    const wasCharging = lastToadalChargeVisualCharging;
    lastToadalChargeVisualRatio = 0;
    lastToadalChargeVisualCharging = false;
    root?.classList.remove('mobile-controls--toadal-charging', 'mobile-controls--toadal-charge-full');
    root?.style.setProperty('--toadal-crouch-charge', '0');
    if (knob) knob.dataset.charge = '0';
    // Release-to-hop is processed by the gameplay frame immediately after the
    // pointer release. Refresh action readiness on the next paint so the right
    // cluster exits its charging-disabled state without waiting for another
    // unrelated HUD update.
    if (wasCharging && root && lastVisible) {
      requestAnimationFrame(() => {
        try { updateActionPresentation(lastRequirements); } catch (_) {}
      });
    }
  }

  function refreshToadalChargeVisual() {
    toadalChargeVisualFrame = 0;
    if (!root || !downOnlyVertical || pointerId === null) {
      clearToadalChargeVisual();
      return;
    }
    let snapshot = null;
    try { snapshot = globalThis.ArcadeToadalMechanics?.snapshot?.() || null; } catch (_) {}
    const charging = Boolean(snapshot?.crouchHeld);
    const ratio = Math.max(0, Math.min(1, Number(snapshot?.crouchChargeRatio || 0)));
    root.classList.toggle('mobile-controls--toadal-charging', charging);
    root.classList.toggle('mobile-controls--toadal-charge-full', charging && ratio >= 0.999);
    if (charging !== lastToadalChargeVisualCharging) {
      lastToadalChargeVisualCharging = charging;
      try { updateActionPresentation(lastRequirements); } catch (_) {}
    }
    root.style.setProperty('--toadal-crouch-charge', String(ratio));
    if (knob) knob.dataset.charge = String(Math.round(ratio * 100));
    if (charging && ratio >= 0.999 && lastToadalChargeVisualRatio < 0.999) {
      try { navigator.vibrate?.(10); } catch (_) {}
    }
    lastToadalChargeVisualRatio = ratio;
    toadalChargeVisualFrame = requestAnimationFrame(refreshToadalChargeVisual);
  }

  function startToadalChargeVisual() {
    if (!downOnlyVertical || toadalChargeVisualFrame) return;
    toadalChargeVisualFrame = requestAnimationFrame(refreshToadalChargeVisual);
  }

  function resetKnob(animate = true) {
    if (!knob) return;
    knob.classList.toggle('is-recentering', Boolean(animate));
    knob.style.setProperty('--stick-x', '0px');
    knob.style.setProperty('--stick-y', '0px');
    if (animate) setTimeout(() => knob?.classList.remove('is-recentering'), 130);
  }

  function releaseActionPointer(event, reason = 'end') {
    if (!event?.pointerId && event?.pointerId !== 0) return false;
    const record = actionPointers.get(event.pointerId);
    if (!record) return false;
    actionPointers.delete(event.pointerId);
    if (record.hold) {
      try { EventBus?.emit?.('spaceUp'); } catch (_) {}
    }
    emitControlTelemetry('action-end', { pointerId:event.pointerId, reason, actionKind:record.kind });
    try {
      if (joystick?.hasPointerCapture?.(event.pointerId)) joystick.releasePointerCapture(event.pointerId);
    } catch (_) {}
    return true;
  }

  function releaseAllActionPointers(reason = 'clear') {
    if (!actionPointers.size) return;
    let needsRelease = false;
    for (const [id, record] of actionPointers) {
      needsRelease = needsRelease || Boolean(record.hold);
      emitControlTelemetry('action-end', { pointerId:id, reason, actionKind:record.kind });
    }
    actionPointers.clear();
    if (needsRelease) {
      try { EventBus?.emit?.('spaceUp'); } catch (_) {}
    }
  }

  function beginSecondaryAction(event) {
    if (!secondFingerActionsEnabled()) return false;
    // Movement plus one action pointer is the complete two-input gameplay budget.
    // Ignore further fingers so they cannot stack actions.
    if (actionPointers.size >= 1) return false;
    const descriptor = primaryDescriptor(lastRequirements);
    if (!descriptor.visible || actionPointers.has(event.pointerId)) return false;
    event.preventDefault();
    event.stopPropagation();
    try { AudioManager?.init?.(); } catch (_) {}
    let hold = false;
    if (descriptor.kind === 'event') {
      if (!dispatchSuppliedPrimary(descriptor, 'press')) return false;
    } else if (descriptor.kind === 'context') {
      try {
        if (cloneHeld()) EventBus?.emit?.('clonePlace');
        else EventBus?.emit?.('clonePickup');
      } catch (_) {}
    } else if (descriptor.kind === 'hold' || descriptor.kind === 'tap') {
      try {
        EventBus?.emit?.('shootPressed');
        EventBus?.emit?.('spaceDown');
      } catch (_) {}
      hold = true;
    } else {
      return false;
    }
    actionPointers.set(event.pointerId, { kind:descriptor.kind, hold, startedAt:performance.now() });
    try { joystick?.setPointerCapture?.(event.pointerId); } catch (_) {}
    emitControlTelemetry('action-start', { pointerId:event.pointerId, actionKind:descriptor.kind });
    return true;
  }

  function releaseJoystick(event, reason = 'cancel') {
    if (event && event.pointerId !== pointerId) {
      releaseActionPointer(event, reason);
      return;
    }
    const activeId = pointerId;
    if (activeId === null) {
      if (!event) releaseAllActionPointers(reason);
      return;
    }
    const durationMs = Math.max(0, performance.now() - joystickStartedAt);
    clearTimeout(oneHandHoldTimer);
    oneHandHoldTimer = 0;
    const qualifiesTap = reason === 'end' && singleFingerActionsEnabled() && !movementUsesFixedAssist && !oneHandHoldActive
      && durationMs <= TAP_MAX_MS && joystickMaxDisplacement <= TAP_MAX_DISTANCE_PX;
    const releaseX = Number(event?.clientX ?? joystickOriginX);
    const releaseY = Number(event?.clientY ?? joystickOriginY);
    if (qualifiesTap) pulseOneHandAction(primaryDescriptor(lastRequirements), 'tap');
    else if (reason === 'end' && joystickMaxDisplacement > TAP_MAX_DISTANCE_PX) {
      lastMovementRelease = { at:performance.now(), x:releaseX, y:releaseY };
    } else if (reason !== 'end') {
      lastMovementRelease = null;
    }
    if (oneHandHoldActive) {
      try { EventBus?.emit?.('spaceUp'); } catch (_) {}
      emitControlTelemetry('one-hand-hold-end', { reason:'movement-release' });
      oneHandHoldActive = false;
    }
    emitControlTelemetry(reason === 'cancel' ? 'cancel' : 'end', {
      pointerId:activeId,
      originX:joystickOriginX,
      originY:joystickOriginY,
      originXNorm:innerWidth ? joystickOriginX / innerWidth : null,
      originYNorm:innerHeight ? joystickOriginY / innerHeight : null,
      durationMs,
      maxDisplacementPx:joystickMaxDisplacement,
      directionChanges:joystickDirectionChanges,
      oneHandTap:Boolean(qualifiesTap)
    });
    pointerId = null;
    movementUsesFixedAssist = false;
    clearDirectionalInput(reason);
    resetKnob(true);
    joystick?.classList.remove('is-active');
    clearToadalChargeVisual();
    scheduleRest();
    try {
      if (activeId !== null && joystick?.hasPointerCapture?.(activeId)) joystick.releasePointerCapture(activeId);
    } catch (_) {}
    if (!event) releaseAllActionPointers(reason);
  }

  function updateJoystick(event) {
    if (!joystick || event.pointerId !== pointerId) return;
    let dx = Number(event.clientX) - joystickOriginX;
    let dy = Number(event.clientY) - joystickOriginY;
    if (!verticalEnabled) dy = 0;
    else if (downOnlyVertical && dy < 0) dy = 0;

    const fixedGeometry = movementUsesFixedAssist ? fixedJoystickGeometry() : null;
    const radius = fixedGeometry
      ? Math.max(46, Math.min(58, fixedGeometry.hitRadius - 22))
      : Math.max(54, Math.min(92, Math.min(innerWidth || 390, innerHeight || 844) * 0.14));
    const deadZone = Math.max(8, radius * 0.15);
    let distance = Math.hypot(dx, dy);
    const driftStart = radius * 0.82;

    // Floating-origin behavior: once the thumb pushes past the comfort radius,
    // the origin follows it instead of forcing the hand against a fixed dock.
    if (!fixedGeometry && distance > driftStart) {
      const excess = distance - driftStart;
      const ux = dx / Math.max(distance, 0.001);
      const uy = dy / Math.max(distance, 0.001);
      const follow = excess * 0.72;
      setJoystickOrigin(joystickOriginX + ux * follow, joystickOriginY + (verticalEnabled ? uy * follow : 0));
      dx = Number(event.clientX) - joystickOriginX;
      dy = verticalEnabled ? Number(event.clientY) - joystickOriginY : 0;
      if (downOnlyVertical && dy < 0) dy = 0;
      distance = Math.hypot(dx, dy);
    }

    joystickMaxDisplacement = Math.max(joystickMaxDisplacement, distance);
    if (joystickMaxDisplacement > TAP_MAX_DISTANCE_PX) { clearTimeout(oneHandHoldTimer); oneHandHoldTimer = 0; }
    const direction = Math.abs(dx) > deadZone ? Math.sign(dx) : 0;
    if (direction && lastAxisDirection && direction !== lastAxisDirection) joystickDirectionChanges += 1;
    if (direction) lastAxisDirection = direction;

    let nx = 0;
    let ny = 0;
    let visualX = 0;
    let visualY = 0;
    if (distance > deadZone) {
      const clamped = Math.min(distance, radius);
      const scale = clamped / Math.max(distance, 0.001);
      visualX = dx * scale;
      visualY = dy * scale;
      const strength = Math.min(1, (clamped - deadZone) / Math.max(1, radius - deadZone));
      nx = (visualX / Math.max(clamped, 0.001)) * strength;
      ny = (visualY / Math.max(clamped, 0.001)) * strength;
    }

    // Toadal's down gesture is a deliberate crouch-charge, not ordinary
    // vertical locomotion. Require a clear downward pull and reject steep
    // diagonals so normal horizontal thumb drift cannot accidentally charge.
    if (downOnlyVertical) {
      const deliberateDown = ny >= 0.58 && Math.abs(nx) <= 0.45;
      ny = deliberateDown ? ny : 0;
    }

    knob?.classList.remove('is-recentering');
    knob?.style.setProperty('--stick-x', `${visualX.toFixed(1)}px`);
    knob?.style.setProperty('--stick-y', `${visualY.toFixed(1)}px`);
    setAnalogAxis(nx, verticalEnabled ? ny : 0);
    scheduleRest();
    emitControlTelemetry('move', {
      pointerId:event.pointerId,
      x:nx,
      y:verticalEnabled ? ny : 0,
      originX:joystickOriginX,
      originY:joystickOriginY,
      originXNorm:innerWidth ? joystickOriginX / innerWidth : null,
      originYNorm:innerHeight ? joystickOriginY / innerHeight : null,
      displacementPx:distance,
      radiusPx:radius
    });
  }

  function wireJoystick() {
    if (!joystick || joystick.dataset.mobileJoystickWired === '1') return;
    joystick.dataset.mobileJoystickWired = '1';
    joystick.dataset.visualMode = visualMode;
    joystick.addEventListener('pointerdown', event => {
      if (!lastVisible) return;
      if (pointerId !== null) {
        beginSecondaryAction(event);
        return;
      }
      const fixedGeometry = fixedJoystickGeometry();
      movementUsesFixedAssist = Boolean(fixedGeometry
        && Math.hypot(event.clientX - fixedGeometry.x, event.clientY - fixedGeometry.y) <= fixedGeometry.hitRadius);
      event.preventDefault();
      event.stopPropagation();
      try { AudioManager?.init?.(); } catch (_) {}
      if (!movementUsesFixedAssist) maybeRetouchAction(event);
      pointerId = event.pointerId;
      joystickStartedAt = performance.now();
      joystickMaxDisplacement = 0;
      joystickDirectionChanges = 0;
      lastAxisDirection = 0;
      setJoystickOrigin(movementUsesFixedAssist ? fixedGeometry.x : event.clientX, movementUsesFixedAssist ? fixedGeometry.y : event.clientY);
      joystick.classList.add('is-active');
      root?.classList.remove('mobile-controls--resting');
      try { joystick.setPointerCapture(event.pointerId); } catch (_) {}
      try {
        if (navigator.vibrate && !(typeof DeviceCapability!=='undefined'?DeviceCapability.effectiveReducedMotion():globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)) navigator.vibrate(5);
      } catch (_) {}
      emitControlTelemetry('start', {
        pointerId:event.pointerId,
        originX:joystickOriginX,
        originY:joystickOriginY,
        originXNorm:innerWidth ? joystickOriginX / innerWidth : null,
        originYNorm:innerHeight ? joystickOriginY / innerHeight : null
      });
      scheduleOneHandHoldGesture();
      updateJoystick(event);
      startToadalChargeVisual();
    }, { passive:false });
    joystick.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      updateJoystick(event);
    }, { passive:false });
    joystick.addEventListener('pointerup', event => releaseJoystick(event, 'end'), { passive:false });
    joystick.addEventListener('pointercancel', event => releaseJoystick(event, 'cancel'), { passive:false });
    joystick.addEventListener('lostpointercapture', event => releaseJoystick(event, 'lost-capture'), { passive:false });
    // Some mobile engines coalesce a secondary finger lift into TouchEvent
    // state without exposing a distinct PointerEvent before the next frame.
    // Fail safe: release held character actions as soon as only the movement
    // thumb remains, and clear movement when every touch is gone.
    joystick.addEventListener('touchend', event => {
      if (actionPointers.size && Number(event.targetTouches?.length || 0) <= 1) releaseAllActionPointers('touch-end');
      if (Number(event.targetTouches?.length || 0) === 0 && pointerId !== null) releaseJoystick(null, 'end');
    }, { passive:true });
    joystick.addEventListener('touchcancel', () => { releaseAllActionPointers('touch-cancel'); releaseJoystick(null, 'cancel'); }, { passive:true });
    joystick.addEventListener('contextmenu', event => event.preventDefault());
  }

  function cycleMode() {
    const current = MODES.indexOf(mode);
    writeMode(MODES[(current + 1) % MODES.length]);
    releaseJoystick();
    update({ visible:lastVisible, requirements:lastRequirements, forceGuide:true });
  }

  function wireModeButton() {
    if (!modeButton || modeButton.dataset.mobileModeWired === '1') return;
    modeButton.dataset.mobileModeWired = '1';
    modeButton.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      cycleMode();
    }, { passive:false });
    modeButton.addEventListener('contextmenu', event => event.preventDefault());
  }

  function wireActionFeedback() {
    if (!actionButton || actionButton.dataset.mobileFeedbackWired === '1') return;
    actionButton.dataset.mobileFeedbackWired = '1';
    actionButton.addEventListener('pointerdown', () => {
      root?.classList.remove('mobile-controls--resting');
    }, { passive:true });
    actionButton.addEventListener('pointerup', () => {
      scheduleRest();
      setTimeout(() => update({ visible:lastVisible, requirements:getRequirements() || lastRequirements }), 0);
    }, { passive:true });
  }

  function effectiveMode() {
    // Minimal/Faint/Analog are always the adaptive floating surface so a legacy
    // stored button-layout preference can never make the default Pause-only UI
    // unplayable. Buttons explicitly selects the traditional fallback; Full
    // exposes the legacy layout toggle for players who want it.
    if (visibilityMode === 'buttons') return 'buttons';
    if (visibilityMode === 'minimal' || visibilityMode === 'faint' || visibilityMode === 'analog' || visibilityMode === 'fixed') return 'joystick';
    return mode === 'buttons' ? 'buttons' : 'joystick';
  }

  function setNodeVisible(node, visible, display = 'flex') {
    if (!node) return;
    node.hidden = !visible;
    node.style.display = visible ? display : 'none';
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function updateDirectionalLabels(up, down, fourDirection) {
    const upLabel = fourDirection ? 'Fly up' : 'Move up';
    const downLabel = fourDirection ? 'Fly down' : 'Move down';
    if (up) { up.setAttribute('aria-label', upLabel); up.title = upLabel; }
    if (down) { down.setAttribute('aria-label', downLabel); down.title = downLabel; }
  }

  function updateModeLabel(effective) {
    if (!modeButton) return;
    modeButton.textContent = effective === 'joystick' ? 'STICK' : 'BUTTONS';
    modeButton.dataset.requestedMode = mode;
    modeButton.dataset.effectiveMode = effective;
    modeButton.setAttribute('aria-label', `Touch controls: ${effective}. Tap to switch layout.`);
    modeButton.title = `Touch controls: ${effective}. Tap to switch layout.`;
  }

  function applyActionDescriptor(button, labelNode, hintNode, descriptor, fallbackAria = 'Arcade action') {
    if (!button) return;
    const value = descriptor || Object.freeze({ visible:false, label:'', hint:'', aria:'', kind:'passive', enabled:false });
    button.dataset.actionKind = String(value.kind || 'event');
    button.dataset.actionId = String(value.id || '');
    button.dataset.actionCost = Number.isFinite(Number(value.cost)) && Number(value.cost) > 0 ? String(Math.round(Number(value.cost))) : '';
    button.classList.toggle('mob-action--unavailable', value.enabled === false);
    button.setAttribute('aria-disabled', value.enabled === false ? 'true' : 'false');
    button.setAttribute('aria-label', value.aria || value.label || fallbackAria);
    button.title = value.hint || value.aria || '';
    if (labelNode) labelNode.textContent = value.label || '';
    if (hintNode) hintNode.textContent = value.hint || '';
  }

  function updateResourcePresentation(actions) {
    const resource = actions.map(action => action?.resource).find(Boolean) || null;
    if (!resource || !actionResource) return resource;
    const value = Math.max(0, Number(resource.value || 0));
    const max = Math.max(1, Number(resource.max || 100));
    const pct = Math.max(0, Math.min(1, value / max));
    const threshold = Math.max(0, Math.min(max, Number(resource.threshold || 0)));
    if (actionResourceLabel) actionResourceLabel.textContent = String(resource.label || 'RESOURCE');
    if (actionResourceValue) actionResourceValue.textContent = `${Math.round(value)}/${Math.round(max)}`;
    if (actionResourceFill) actionResourceFill.style.width = `${(pct * 100).toFixed(2)}%`;
    if (actionResourceThreshold) actionResourceThreshold.style.left = `${(threshold / max * 100).toFixed(2)}%`;
    actionResource.classList.toggle('mob-action-resource--full', value >= Number(resource.fullThreshold || max));
    actionResource.classList.toggle('mob-action-resource--primary-ready', value >= threshold);
    actionResource.setAttribute('aria-label', `${resource.label || 'Resource'} ${Math.round(value)} of ${Math.round(max)}`);
    return resource;
  }

  function updateActionPresentation(requirements) {
    const supplied = suppliedActions(requirements);
    const descriptor = supplied.find(action => action.slot === 'primary') || supplied[0] || actionDescriptor(requirements);
    const secondary = supplied.find(action => action.slot === 'secondary') || null;
    const tertiary = supplied.find(action => action.slot === 'tertiary') || null;
    applyActionDescriptor(actionButton, actionLabel, actionHint, descriptor);
    applyActionDescriptor(secondaryActionButton, secondaryActionLabel, secondaryActionHint, secondary, 'Secondary Arcade action');
    applyActionDescriptor(tertiaryActionButton, tertiaryActionLabel, tertiaryActionHint, tertiary, 'Tertiary Arcade action');
    updateResourcePresentation(supplied);
    if (abilityHintText) {
      const { definition } = currentCharacter();
      const id = String(definition?.id || 'classic');
      abilityHintText.textContent = id === 'toadal'
        ? guideText(requirements, descriptor)
        : supplied.length > 1
          ? guideText(requirements, descriptor) + ` · ${supplied.slice(1).map(action => action.guide || action.label).join(' · ')}`
          : guideText(requirements, descriptor);
    }
    return { descriptor, supplied, secondary, tertiary };
  }

  function syncFrameChrome() {
    const body = document.body;
    const active = body?.classList?.contains('arcade-shell-open')
      || body?.classList?.contains('arcade-standalone');
    if (!active) {
      if (body?.dataset) delete body.dataset.arcadePausePlacement;
      return null;
    }

    const canvas = document.getElementById('gameCanvas');
    const rect = canvas?.getBoundingClientRect?.();
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;

    const viewport = window.visualViewport;
    const viewportLeft = Number(viewport?.offsetLeft) || 0;
    const viewportTop = Number(viewport?.offsetTop) || 0;
    const viewportWidth = Math.max(1, Number(viewport?.width) || window.innerWidth);
    const viewportHeight = Math.max(1, Number(viewport?.height) || window.innerHeight);
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const bottomGap = Math.max(0, viewportBottom - rect.bottom);
    const rightGap = Math.max(0, viewportRight - rect.right);

    const rightActionVisible = ['mobShoot','mobActionSecondary','mobActionTertiary','mobHop']
      .map(id => document.getElementById(id))
      .some(node => node && !node.hidden);

    const controlClearance = 62;
    const placement = rightActionVisible
      ? (rightGap >= controlClearance ? 'right-of-frame' : 'hud-reserved')
      : (bottomGap >= controlClearance
        ? 'below-frame'
        : rightGap >= controlClearance
          ? 'right-of-frame'
          : 'hud-reserved');

    body.dataset.arcadePausePlacement = placement;
    const style = document.documentElement?.style;
    style?.setProperty('--arcade-frame-left', Math.round(rect.left) + 'px');
    style?.setProperty('--arcade-frame-top', Math.round(rect.top) + 'px');
    style?.setProperty('--arcade-frame-right', Math.round(rect.right) + 'px');
    style?.setProperty('--arcade-frame-bottom', Math.round(rect.bottom) + 'px');

    return Object.freeze({
      placement,
      frame:{ left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom, width:rect.width, height:rect.height },
      viewport:{ left:viewportLeft, top:viewportTop, right:viewportRight, bottom:viewportBottom, width:viewportWidth, height:viewportHeight },
      bottomGap,
      rightGap,
      rightActionVisible,
    });
  }

  function scheduleFrameChrome() {
    const run = () => syncFrameChrome();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function update(options = {}) {
    if (!root) return false;
    const requirements = Array.isArray(options.requirements) ? options.requirements : (getRequirements() || []);
    lastRequirements = [...requirements];
    const requestedVisible = options.visible !== undefined ? Boolean(options.visible) : Boolean(getPlaying());
    const visible = requestedVisible && touchPrimary();
    lastVisible = visible;
    const fourDirection = requirements.includes('four-direction');
    downOnlyVertical = requirements.includes('toadal-crouch-hop') && !fourDirection;
    verticalEnabled = fourDirection || downOnlyVertical;
    const effective = effectiveMode(requirements);
    const actionPresentation = updateActionPresentation(requirements);
    const { descriptor, supplied, secondary, tertiary } = actionPresentation;
    const multiAction = supplied.length > 1;
    const forceActionSurface = supplied.some(action => action.forceVisible);
    const { definition } = currentCharacter();
    const characterKey = String(definition?.id || 'classic');
    const actionKey = `${characterKey}:${descriptor.label}:${cloneHeld()}`;
    if (lastActionKey && actionKey !== lastActionKey) clearOneHandHold('character-action-change');

    root.classList.toggle('visible', visible);
    root.classList.toggle('mobile-controls--joystick', effective === 'joystick');
    root.classList.toggle('mobile-controls--buttons', effective === 'buttons');
    root.classList.toggle('mobile-controls--four-direction', fourDirection);
    root.classList.toggle('mobile-controls--down-charge', downOnlyVertical);
    root.classList.toggle('mobile-controls--has-action', descriptor.visible);
    root.classList.toggle('mobile-controls--multi-action', multiAction);
    root.classList.toggle('mobile-controls--visibility-minimal', visibilityMode === 'minimal');
    root.classList.toggle('mobile-controls--visibility-faint', visibilityMode === 'faint');
    root.classList.toggle('mobile-controls--visibility-analog', visibilityMode === 'analog');
    root.classList.toggle('mobile-controls--visibility-fixed', visibilityMode === 'fixed');
    root.classList.toggle('mobile-controls--visibility-buttons', visibilityMode === 'buttons');
    root.classList.toggle('mobile-controls--visibility-full', visibilityMode === 'full');
    root.dataset.controlMode = mode;
    root.dataset.effectiveControlMode = effective;
    root.dataset.controlStyle = controlStyle;
    root.dataset.visibilityMode = visibilityMode;
    root.dataset.joystickPlacement = visibilityMode === 'fixed' ? 'assist-bottom-right' : 'floating';
    root.dataset.actionStyle = actionStyle;
    root.dataset.controlHints = controlHints ? 'on' : 'off';
    root.dataset.hudTheme = typeof SETTINGS !== 'undefined' && ['garden', 'luminous', 'astro'].includes(SETTINGS?.modes?.arcade?.hudTheme)
      ? SETTINGS.modes.arcade.hudTheme : 'classic';
    document.body.dataset.arcadeHudTheme = root.dataset.hudTheme;
    root.dataset.characterId = characterKey;
    root.dataset.actionKind = descriptor.kind;
    // Visibility is an input-ownership boundary, not only presentation.
    // Modal accessibility may inert this body-level surface while Pause/Menu
    // owns the page; gameplay must synchronously reclaim it on resume/rotation.
    if ('inert' in root) root.inert = !visible;
    if (joystick) joystick.dataset.visualMode = effectiveVisualMode();
    // A faint floating affordance must never render from the default (0,0)
    // origin and leave a clipped arc in the top-left corner. Give the resting
    // Toadal stick a safe lower-left home until the player's first touch, then
    // retain/clamp the player's latest origin across responsive layout changes.
    if (visible && effective === 'joystick' && visibilityMode !== 'fixed' && pointerId === null) {
      const w = Math.max(1, Number(globalThis.innerWidth || 0));
      const h = Math.max(1, Number(globalThis.innerHeight || 0));
      const margin = Math.min(52, Math.max(40, Math.min(w, h) * 0.10));
      let restX = joystickOriginX > 1 ? joystickOriginX : w - Math.min(76, w * 0.20);
      let restY = joystickOriginY > 1 ? joystickOriginY : h - Math.min(72, h * 0.16);
      restX = Math.max(margin, Math.min(w - margin, restX));
      restY = Math.max(margin, Math.min(h - margin, restY));
      if (Math.abs(restX - joystickOriginX) > 0.5 || Math.abs(restY - joystickOriginY) > 0.5) {
        setJoystickOrigin(restX, restY);
      }
    }
    root.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.body.classList.toggle('arcade-mobile-controls-visible', visible);
    document.documentElement.dataset.mobileControlMode = effective;

    const left = document.getElementById('mobLeft');
    const right = document.getElementById('mobRight');
    const up = document.getElementById('mobUp');
    const down = document.getElementById('mobDown');
    const pause = document.getElementById('mobPause');

    updateDirectionalLabels(up, down, verticalEnabled);
    const explicitButtonsVisible = visibilityMode === 'buttons' || visibilityMode === 'full' || visibilityMode === 'faint' || visibilityMode === 'fixed';
    const analogSurfaceVisible = visible && effective === 'joystick';
    const showButtons = visible && effective === 'buttons' && explicitButtonsVisible;
    setNodeVisible(left, showButtons);
    setNodeVisible(right, showButtons);
    setNodeVisible(up, showButtons && verticalEnabled && !downOnlyVertical);
    setNodeVisible(down, showButtons && verticalEnabled);
    // Minimal is a true visual-off state. Character-specific buttons appear
    // only when the player selected a visible-control presentation (or a
    // narrowly documented mechanic explicitly requires a surface).
    const actionSurfaceVisible = explicitButtonsVisible || forceActionSurface;
    const redundantToadalTongueButton = characterKey === 'toadal' && descriptor.id === 'toadal-tongue'
      && multiAction && visibilityMode !== 'full';
    const ordinaryGestureAction = supplied.length === 0 && descriptor.kind === 'tap';
    const showOrdinaryExplicitAction = visibilityMode === 'full' || visibilityMode === 'buttons';
    setNodeVisible(actionButton, visible && descriptor.visible && actionSurfaceVisible
      && !redundantToadalTongueButton && (!ordinaryGestureAction || showOrdinaryExplicitAction));
    setNodeVisible(secondaryActionButton, visible && Boolean(secondary) && actionSurfaceVisible);
    setNodeVisible(tertiaryActionButton, visible && Boolean(tertiary) && actionSurfaceVisible);
    // Hop is a separate optional affordance only; it drives the same ArrowDown
    // crouch/charge/release authority as the free downward gesture.
    setNodeVisible(hopButton, visible && downOnlyVertical && actionSurfaceVisible);
    // Toadal's Golden Charge is already presented in the canonical top canvas
    // HUD.  Do not duplicate it in the thumb zone; other future multi-action
    // characters may still opt into the generic resource card.
    setNodeVisible(actionResource, visible && characterKey !== 'toadal' && multiAction && Boolean(supplied.some(action => action.resource)), 'grid');
    setNodeVisible(pause, visible);
    // The full-screen analog surface remains active even in Minimal mode; only
    // its visual ring/knob disappear. This is the default one-thumb surface.
    setNodeVisible(joystick, analogSurfaceVisible, 'block');
    setNodeVisible(modeButton, visible && visibilityMode === 'full');
    joystick?.setAttribute('aria-label', downOnlyVertical
      ? (visibilityMode === 'fixed'
        ? 'Optional bottom-right movement assist; drag anywhere to move; pull down and release for Toadal charged hop'
        : 'Floating movement surface; pull down and release for Toadal charged hop')
      : visibilityMode === 'fixed'
        ? 'Optional bottom-right analog movement assist; drag anywhere else to move'
        : 'Floating analog movement surface');

    if (!visible || effective !== 'joystick') releaseJoystick();
    if (!visible || !downOnlyVertical) clearToadalChargeVisual();
    if (!visible) clearOneHandHold('controls-hidden');
    updateModeLabel(effective);

    const firstPresentation = !lastCharacterKey && !lastActionKey;
    const characterChanged = Boolean(lastCharacterKey) && characterKey !== lastCharacterKey;
    const actionChanged = Boolean(lastActionKey) && actionKey !== lastActionKey;
    if (controlHints && visible && (options.forceGuide || firstPresentation || characterChanged || actionChanged)) {
      // Toadal gets one brief, gesture-only orientation when selected. Ability
      // readiness changes must never cause another overlay mid-play.
      if (characterKey !== 'toadal' || options.forceGuide || characterChanged || firstPresentation) {
        showGuide(characterKey === 'toadal' ? (options.forceGuide ? 1800 : 1500) : (characterChanged ? 2800 : 1700));
      }
    }
    lastCharacterKey = characterKey;
    lastActionKey = actionKey;
    if (visible) scheduleRest();
    else {
      clearTimeout(hintTimer);
      clearTimeout(restTimer);
      abilityHint && (abilityHint.hidden = true);
      root.classList.remove('mobile-controls--hint-visible', 'mobile-controls--resting');
    }
    scheduleFrameChrome();
    return visible;
  }

  function init(options = {}) {
    root = document.getElementById(options.rootId || 'mobileControls');
    if (!root) return null;
    joystick = document.getElementById(options.joystickId || 'mobJoystick');
    knob = document.getElementById(options.knobId || 'mobJoystickKnob');
    modeButton = document.getElementById(options.modeButtonId || 'mobControlMode');
    actionButton = document.getElementById(options.actionButtonId || 'mobShoot');
    actionLabel = document.getElementById(options.actionLabelId || 'mobActionLabel');
    actionHint = document.getElementById(options.actionHintId || 'mobActionHint');
    abilityHint = document.getElementById(options.abilityHintId || 'mobAbilityHint');
    abilityHintText = document.getElementById(options.abilityHintTextId || 'mobAbilityHintText');
    secondaryActionButton = document.getElementById(options.secondaryActionButtonId || 'mobActionSecondary');
    secondaryActionLabel = document.getElementById(options.secondaryActionLabelId || 'mobActionSecondaryLabel');
    secondaryActionHint = document.getElementById(options.secondaryActionHintId || 'mobActionSecondaryHint');
    tertiaryActionButton = document.getElementById(options.tertiaryActionButtonId || 'mobActionTertiary');
    tertiaryActionLabel = document.getElementById(options.tertiaryActionLabelId || 'mobActionTertiaryLabel');
    tertiaryActionHint = document.getElementById(options.tertiaryActionHintId || 'mobActionTertiaryHint');
    hopButton = document.getElementById(options.hopButtonId || 'mobHop');
    actionResource = document.getElementById(options.actionResourceId || 'mobActionResource');
    actionResourceLabel = document.getElementById(options.actionResourceLabelId || 'mobActionResourceLabel');
    actionResourceValue = document.getElementById(options.actionResourceValueId || 'mobActionResourceValue');
    actionResourceFill = document.getElementById(options.actionResourceFillId || 'mobActionResourceFill');
    actionResourceThreshold = document.getElementById(options.actionResourceThresholdId || 'mobActionResourceThreshold');
    getRequirements = typeof options.getRequirements === 'function' ? options.getRequirements : getRequirements;
    getActions = typeof options.getActions === 'function' ? options.getActions : getActions;
    dispatchPrimaryAction = typeof options.dispatchPrimaryAction === 'function' ? options.dispatchPrimaryAction : dispatchPrimaryAction;
    getPlaying = typeof options.getPlaying === 'function' ? options.getPlaying : getPlaying;

    writeVisualMode(visualMode);
    if (joystick) joystick.dataset.visualMode = effectiveVisualMode();
    wireJoystick();
    wireModeButton();
    wireActionFeedback();
    if (!initialized) {
      initialized = true;
      window.addEventListener('blur', () => { releaseJoystick(); clearOneHandHold('blur'); });
      window.addEventListener('pagehide', () => { releaseJoystick(); clearOneHandHold('pagehide'); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseJoystick(); clearOneHandHold('hidden'); } });
      window.addEventListener('orientationchange', () => {
        releaseJoystick();
        setTimeout(() => {
          update();
          scheduleFrameChrome();
        }, 160);
      }, { passive:true });
      window.addEventListener('resize', scheduleFrameChrome, { passive:true });
      window.visualViewport?.addEventListener?.('resize', scheduleFrameChrome, { passive:true });
    }
    update({ visible:false, requirements:getRequirements() || [] });
    return Object.freeze({
      update,
      clear:releaseJoystick,
      showGuide,
      get mode(){ return mode; },
      get effectiveMode(){ return effectiveMode(lastRequirements); },
      get visualMode(){ return effectiveVisualMode(); },
      get controlStyle(){ return controlStyle; },
      get visibilityMode(){ return visibilityMode; },
      get actionStyle(){ return actionStyle; },
      get controlHints(){ return controlHints; },
      setVisualMode:writeVisualMode,
      setControlStyle:writeControlStyle,
      setVisibilityMode:writeVisibilityMode,
      setActionStyle:writeActionStyle,
      setControlHints:writeControlHints,
      syncFrameChrome,
      scheduleFrameChrome,
    });
  }

  return Object.freeze({
    init, update, clear:releaseJoystick, effectiveMode, actionDescriptor, syncFrameChrome, scheduleFrameChrome,
    setVisualMode:writeVisualMode, setControlStyle:writeControlStyle, setVisibilityMode:writeVisibilityMode, setActionStyle:writeActionStyle, setControlHints:writeControlHints, resetPreferences,
    get mode(){ return mode; }, get visualMode(){ return effectiveVisualMode(); }, get controlStyle(){ return controlStyle; },
    get visibilityMode(){ return visibilityMode; }, get actionStyle(){ return actionStyle; }, get controlHints(){ return controlHints; }, get isActive(){ return pointerId !== null; }
  });
})();
