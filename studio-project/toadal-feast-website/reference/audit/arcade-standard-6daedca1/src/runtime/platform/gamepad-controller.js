// Froggy Feast physical-controller adapter.
// Standard Gamepad mapping: left stick/D-pad move, A activates/catches,
// B goes back, Start pauses, and the right stick moves the canvas cursor.
(function (root) {
  'use strict';
  if (!root || !root.document || root.FroggyGamepad) return;

  const DEADZONE = 0.24;
  const REPEAT_DELAY = 330;
  const REPEAT_RATE = 115;
  const IDLE_POLL_MS = 250;
  const state = { connected: false, index: -1, cursorX: 300, cursorY: 220, buttons: [], directions: {}, repeatAt: {}, pointerDown: false, primaryKeyboardDown: false, raf: 0, idleTimer: 0, last: 0 };
  const keyMap = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  const buttonEntries = Object.freeze([[0, 'primary'], [1, 'back'], [2, 'secondary'], [3, 'tertiary'], [8, 'back'], [9, 'pause']]);

  function canvas() { return document.getElementById('gameCanvas'); }
  function activeCanvas() {
    const el = canvas();
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' ? el : null;
  }
  function key(code, down) {
    document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code === 'Space' ? ' ' : code, bubbles: true }));
  }
  function setDirection(name, down) {
    if (!!state.directions[name] === down) return;
    state.directions[name] = down;
    if (root.InputManager && typeof root.InputManager.setVirtualKey === 'function') root.InputManager.setVirtualKey(keyMap[name], down);
    key(keyMap[name], down);
  }
  function focusables() {
    return [...document.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hidden && el.offsetParent !== null && !el.classList.contains('hidden'));
  }
  function moveFocus(delta) {
    const list = focusables();
    if (!list.length) return false;
    const current = list.indexOf(document.activeElement);
    list[(current < 0 ? (delta > 0 ? 0 : list.length - 1) : (current + delta + list.length) % list.length)].focus();
    return true;
  }
  function pointer(type) {
    const el = activeCanvas();
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const logicalW = Number(el.dataset.logicalWidth) || 600;
    const logicalH = Number(el.dataset.logicalHeight) || 440;
    const event = new PointerEvent(type, {
      pointerId: 77, pointerType: 'mouse', isPrimary: true, buttons: state.pointerDown ? 1 : 0, button: 0,
      clientX: rect.left + state.cursorX / logicalW * rect.width,
      clientY: rect.top + state.cursorY / logicalH * rect.height,
      bubbles: true, cancelable: true,
    });
    el.dispatchEvent(event);
    return true;
  }
  function toadalGameplayActive() {
    try {
      return !!activeCanvas()
        && !document.body?.classList?.contains('menu-open')
        && root.GameState?.mode === root.GAME_MODES?.PLAYING
        && root.getCharDef?.()?.id === 'toadal';
    } catch (_) { return false; }
  }
  function releasePrimaryInput() {
    if (state.pointerDown) {
      state.pointerDown = false;
      pointer('pointerup');
    }
    if (state.primaryKeyboardDown) {
      state.primaryKeyboardDown = false;
      key('Space', false);
    }
  }
  function primary(down) {
    if (toadalGameplayActive()) {
      if (down) root.EventBus?.emit?.('shootPressed', { source:'gamepad', actionId:'toadal-tongue' });
      return;
    }
    if (!down) {
      releasePrimaryInput();
      return;
    }
    const el = activeCanvas();
    if (el && (typeof root.Connect3State !== 'undefined' || typeof root.InfiniteState !== 'undefined')) {
      state.pointerDown = true;
      pointer('pointerdown');
      return;
    }
    if (document.activeElement && /^(BUTTON|A)$/.test(document.activeElement.tagName)) {
      document.activeElement.click();
      return;
    }
    state.primaryKeyboardDown = true;
    key('Space', true);
  }
  function tapKey(code) {
    key(code, true);
    key(code, false);
  }
  function action(name, down) {
    if (name === 'primary') return primary(down);
    if (!down) return;
    if (toadalGameplayActive() && name === 'secondary') return root.EventBus?.emit?.('toadalThrowPressed', { source:'gamepad' });
    if (toadalGameplayActive() && name === 'tertiary') return root.EventBus?.emit?.('toadalBlockPressed', { source:'gamepad' });
    if (name === 'pause' || name === 'back') tapKey('Escape');
  }
  function pressed(pad, index) { return !!pad.buttons[index]?.pressed; }
  function axis(value) { return Math.abs(Number(value) || 0) >= DEADZONE ? Number(value) : 0; }

  function scheduleFrame() {
    if (state.raf || state.idleTimer || typeof requestAnimationFrame !== 'function') return;
    state.raf = requestAnimationFrame(poll);
  }
  function scheduleIdleProbe() {
    if (state.raf || state.idleTimer) return;
    state.idleTimer = setTimeout(() => {
      state.idleTimer = 0;
      scheduleFrame();
    }, IDLE_POLL_MS);
  }
  function cancelIdleProbe() {
    if (!state.idleTimer) return;
    clearTimeout(state.idleTimer);
    state.idleTimer = 0;
  }
  function poll(now) {
    state.raf = 0;
    cancelIdleProbe();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = pads[state.index];
    if (!pad) {
      for (let index = 0; index < pads.length; index += 1) {
        if (pads[index]) { pad = pads[index]; break; }
      }
    }
    if (!pad) {
      if (state.connected) {
        for (const name of Object.keys(state.directions)) setDirection(name, false);
        releasePrimaryInput();
        state.buttons = [];
      }
      state.connected = false;
      state.index = -1;
      state.last = 0;
      scheduleIdleProbe();
      return;
    }
    state.connected = true; state.index = pad.index;
    const dt = Math.min(40, Math.max(0, now - (state.last || now))); state.last = now;
    const x = axis(pad.axes[0]), y = axis(pad.axes[1]);
    const left = x < 0 || pressed(pad, 14);
    const right = x > 0 || pressed(pad, 15);
    const up = y < 0 || pressed(pad, 12);
    const down = y > 0 || pressed(pad, 13);
    const canvasMode = !!activeCanvas() && !document.body?.classList?.contains('menu-open');
    setDirection('left', canvasMode && left);
    setDirection('right', canvasMode && right);
    setDirection('up', canvasMode && up);
    setDirection('down', canvasMode && down);
    if (!canvasMode) {
      if (up) {
        const first = !state.repeatAt.up;
        if (first || now >= state.repeatAt.up) { moveFocus(-1); state.repeatAt.up = now + (first ? REPEAT_DELAY : REPEAT_RATE); }
      } else state.repeatAt.up = 0;
      if (down) {
        const first = !state.repeatAt.down;
        if (first || now >= state.repeatAt.down) { moveFocus(1); state.repeatAt.down = now + (first ? REPEAT_DELAY : REPEAT_RATE); }
      } else state.repeatAt.down = 0;
    }
    const cursorX = axis(pad.axes[2]) || x, cursorY = axis(pad.axes[3]) || y;
    if (canvasMode && (typeof root.Connect3State !== 'undefined' || typeof root.InfiniteState !== 'undefined')) {
      state.cursorX = Math.max(0, Math.min(600, state.cursorX + cursorX * dt * 0.45));
      state.cursorY = Math.max(0, Math.min(440, state.cursorY + cursorY * dt * 0.45));
      if (state.pointerDown) pointer('pointermove');
    }
    for (let entryIndex = 0; entryIndex < buttonEntries.length; entryIndex += 1) {
      const index = buttonEntries[entryIndex][0];
      const name = buttonEntries[entryIndex][1];
      const downNow = pressed(pad, index);
      const was = !!state.buttons[index];
      if (downNow !== was) { state.buttons[index] = downNow; action(name, downNow); }
    }
    scheduleFrame();
  }
  function connect(event) {
    cancelIdleProbe();
    state.connected = true;
    state.index = event.gamepad.index;
    state.last = 0;
    scheduleFrame();
  }
  function disconnect(event) {
    if (state.index === event.gamepad.index) {
      state.index = -1;
      state.connected = false;
      state.last = 0;
      for (const name of Object.keys(state.directions)) setDirection(name, false);
      releasePrimaryInput();
      state.buttons = [];
      if (!state.raf) scheduleIdleProbe();
    }
  }
  root.addEventListener('gamepadconnected', connect);
  root.addEventListener('gamepaddisconnected', disconnect);
  scheduleFrame();
  root.FroggyGamepad = Object.freeze({ state, DEADZONE, pollOnce: poll });
})(typeof window !== 'undefined' ? window : null);
