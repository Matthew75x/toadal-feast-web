const PROTOCOL = 'toadal.game.v1';
const AUDIO_EVENT = 'game:audio';
const AUDIO_HOST = 'host:audio';
const OWNED_STATES = new Set(['active', 'muted']);
const LOCAL_STATES = new Set(['available', 'degraded', 'unavailable']);
const PARAMS = Object.freeze({ power: [0, 1], combo: [0, 999], pan: [-1, 1], intensity: [0, 1] });
const ID = /^[A-Za-z][A-Za-z0-9_.:-]{0,95}$/;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
function cleanParams(input = {}) {
  if (!record(input)) return null;
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const range = PARAMS[key];
    if (!range || !finite(value, range[0], range[1])) return null;
    out[key] = value;
  }
  return out;
}

/**
 * Tiny cartridge-side audio handoff.
 * This owns no AudioContext, files, cache, mixer, profile or settings.
 * The game still decides when a real gameplay action occurred.
 */
export function createToadalHostAudioAdapter({
  gameId,
  legacy,
  fallback = 'local-before-active',
  win = globalThis.window,
  parentOrigin = null
} = {}) {
  if (typeof gameId !== 'string' || !ID.test(gameId)) throw new Error('valid gameId required');
  if (typeof legacy !== 'function') throw new Error('legacy sound function required');
  if (!['local-before-active', 'silent-before-active'].includes(fallback)) throw new Error('unsupported fallback');
  if (!win || win.parent === win) throw new Error('host audio requires an embedded cartridge');

  let origin = parentOrigin;
  if (!origin) {
    try { origin = new URL(win.document.referrer).origin; } catch (_) {}
  }
  if (!origin || origin === 'null') throw new Error('exact parent origin required');

  let state = 'unavailable';
  let hostOwnsPlayback = false;
  let closed = false;

  const onMessage = event => {
    if (closed || event.source !== win.parent || event.origin !== origin) return;
    const message = event.data;
    if (!record(message) || message.protocol !== PROTOCOL || message.gameId !== gameId || message.type !== AUDIO_HOST) return;
    const next = message.payload?.state;
    if (!OWNED_STATES.has(next) && !LOCAL_STATES.has(next)) return;
    state = next;
    if (OWNED_STATES.has(next)) hostOwnsPlayback = true;
    else if (next === 'unavailable') hostOwnsPlayback = false;
  };
  win.addEventListener('message', onMessage);

  function localAllowed() {
    return fallback === 'local-before-active' && !hostOwnsPlayback;
  }

  function emit(event, unsafeParams = {}) {
    if (closed || typeof event !== 'string' || !ID.test(event)) return false;
    const params = cleanParams(unsafeParams);
    if (!params) return false;

    if (hostOwnsPlayback) {
      try {
        win.parent.postMessage({
          protocol: PROTOCOL,
          gameId,
          type: AUDIO_EVENT,
          payload: { event, params }
        }, origin);
        return 'host';
      } catch (_) {
        // Once the host has explicitly taken ownership, a transport failure must
        // not immediately double-play locally. Wait for an explicit host state change.
        return false;
      }
    }

    if (localAllowed()) {
      legacy(event, params);
      return 'legacy';
    }
    return false;
  }

  function dispose() {
    if (closed) return;
    closed = true;
    win.removeEventListener('message', onMessage);
  }

  return Object.freeze({
    emit,
    dispose,
    get state() { return state; },
    get hostOwnsPlayback() { return hostOwnsPlayback; }
  });
}
