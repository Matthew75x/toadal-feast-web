(() => {
  'use strict';

  const PROTOCOL = 'toadal.game.v1';
  const gameId = 'wicked-bites';
  if (!document.getElementById('wbPause')) return;
  const embedded = window.parent !== window;
  let parentOrigin = '';
  try { parentOrigin = new URL(document.referrer).origin; } catch (_) {}
  const allowedHost = new Set(['host:init', 'host:pause', 'host:resume', 'host:mute', 'host:unmute', 'host:visibility']);
  const send = (type, payload = {}) => {
    if (!embedded || !parentOrigin) return false;
    try {
      parent.postMessage({ protocol: PROTOCOL, gameId, type, payload }, parentOrigin);
      return true;
    } catch (_) { return false; }
  };
  const node = (id) => document.getElementById(id);
  const visible = (element) => {
    if (!element || element.hidden || element.classList.contains('hidden') || element.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  };
  const click = (id) => { const element = node(id); if (visible(element)) element.click(); };
  let previousPause = null;
  let previousResult = false;
  let previousGame = false;
  let previousScore = '';
  let muteSnapshot = null;
  let hostInitialized = false;
  let readySent = false;
  let domReady = document.readyState !== 'loading';

  function announceReady() {
    if (!hostInitialized || !domReady || readySent) return;
    readySent = true;
    send('game:ready', { gameId, version: '5.5' });
  }
  function isPaused() { return visible(node('wbPauseOverlay')); }
  function isPlaying() { return !visible(node('wbStart')) && !visible(node('wbResult')); }
  function isComplete() { return visible(node('wbResult')); }
  function readScore() { return node('wbScore')?.textContent?.trim() || ''; }
  function syncState() {
    const playing = isPlaying();
    const paused = isPaused();
    const complete = isComplete();
    if (playing && !previousGame) send('game:started');
    if (paused !== previousPause && playing) send(paused ? 'game:paused' : 'game:resumed');
    if (complete && !previousResult) send('game:complete', { score: readScore() });
    const score = readScore();
    if (score && score !== previousScore) send('game:score', { score });
    previousGame = playing;
    previousPause = paused;
    previousResult = complete;
    previousScore = score;
  }
  function setSound(muted) {
    const controls = ['wbAudioEnabled'];
    const wasOpen = visible(node('wbSettingsOverlay'));
    if (!wasOpen) click('wbSettings');
    window.setTimeout(() => {
      const fields = controls.map(node).filter(Boolean);
      if (!muted && muteSnapshot) {
        fields.forEach((field, index) => { field.checked = muteSnapshot[index] ?? true; field.dispatchEvent(new Event('change', { bubbles: true })); });
        muteSnapshot = null;
      } else if (muted && !muteSnapshot) {
        muteSnapshot = fields.map((field) => field.checked);
        fields.forEach((field) => { field.checked = false; field.dispatchEvent(new Event('change', { bubbles: true })); });
      }
      if (!wasOpen) click('wbSettingsClose');
    }, 80);
  }

  window.addEventListener('message', (event) => {
    if (!embedded || !parentOrigin || event.origin !== parentOrigin || event.source !== parent) return;
    const message = event.data;
    if (!message || message.protocol !== PROTOCOL || message.gameId !== gameId || !allowedHost.has(message.type)) return;
    if (message.type === 'host:init') {
      hostInitialized = true;
      announceReady();
    }
    if (message.type === 'host:pause' && isPlaying() && !isPaused()) click('wbPause');
    if (message.type === 'host:resume' && isPaused()) click('wbResume');
    if (message.type === 'host:visibility' && message.payload?.visibility === 'hidden' && isPlaying() && !isPaused()) click('wbPause');
    if (message.type === 'host:visibility' && message.payload?.visibility === 'visible' && isPaused()) click('wbResume');
    if (message.type === 'host:mute') setSound(true);
    if (message.type === 'host:unmute') setSound(false);
  });

  window.addEventListener('error', (event) => send('game:error', { message: String(event.message || 'Cartridge runtime error').slice(0, 240) }));
  window.addEventListener('unhandledrejection', (event) => send('game:error', { message: String(event.reason?.message || event.reason || 'Unhandled cartridge rejection').slice(0, 240) }));
  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('#wbFullscreen')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      send('game:request-fullscreen');
    }
    window.setTimeout(syncState, 0);
  }, true);
  const observer = new MutationObserver(syncState);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'open', 'aria-hidden'] });
  window.addEventListener('DOMContentLoaded', () => { domReady = true; announceReady(); syncState(); });
  if (domReady) announceReady();
})();
