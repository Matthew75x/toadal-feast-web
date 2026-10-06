/* Reusable same-origin share client. No storage, telemetry, or cartridge access. */
export class ShareClientError extends Error {
  constructor(message, status = 0, code = 'request_failed') {
    super(message);
    this.name = 'ShareClientError';
    this.status = status;
    this.code = code;
  }
}

export function newIdempotencyKey(cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.getRandomValues) throw new ShareClientError('A secure browser is needed to prepare a share link.');
  return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function safePublicUrl(value, pageUrl = globalThis.location?.href) {
  const url = new URL(value, pageUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || !(url.protocol === 'https:' || (url.protocol === 'http:' && local))) {
    throw new ShareClientError('The share service returned an unsafe link.');
  }
  return url.href;
}

async function responseError(response) {
  let body;
  try { body = await response.json(); } catch { /* A readable default covers non-JSON failures. */ }
  const message = typeof body?.message === 'string' ? body.message
    : typeof body?.error === 'string' ? body.error
    : typeof body?.error?.message === 'string' ? body.error.message
    : response.status === 429 ? 'Too many cards are being prepared. Please try again shortly.'
    : 'The card service could not complete this request. Please try again.';
  return new ShareClientError(message.slice(0, 300), response.status, typeof body?.code === 'string' ? body.code : 'request_failed');
}

export function createShareClient({ baseUrl = globalThis.location?.origin, fetchImpl = globalThis.fetch } = {}) {
  const origin = new URL(baseUrl);
  const endpoint = path => new URL(path, origin).href;
  async function request(path, options = {}) {
    const response = await fetchImpl(endpoint(path), { credentials: 'omit', cache: 'no-store', ...options });
    if (!response.ok) throw await responseError(response);
    return response;
  }
  return Object.freeze({
    async config({ signal } = {}) {
      const value = await (await request('/api/config', { signal })).json();
      if (!value || !Array.isArray(value.games) || !value.games.length || !Array.isArray(value.themes)) {
        throw new ShareClientError('The card service configuration is unavailable.');
      }
      return value;
    },
    async preview(payload, { signal } = {}) {
      const response = await request('/api/preview', {
        method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!/^image\/png(?:;|$)/i.test(response.headers.get('Content-Type') || '')) {
        throw new ShareClientError('The preview service returned an unexpected image format.');
      }
      return response.blob();
    },
    async create(payload, { key = newIdempotencyKey(), signal } = {}) {
      if (!/^[a-f0-9]{64}$/.test(key)) throw new ShareClientError('The card request key is invalid.');
      const value = await (await request('/api/shares', {
        method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify(payload)
      })).json();
      if (!value || typeof value.id !== 'string' || typeof value.url !== 'string' || typeof value.imageUrl !== 'string' ||
          typeof value.manageToken !== 'string' || !value.manageToken ||
          !Number.isFinite(Date.parse(value.expiresAt))) {
        throw new ShareClientError('The card service returned an incomplete share link.');
      }
      return { ...value, url: safePublicUrl(value.url, origin.href), imageUrl: safePublicUrl(value.imageUrl, origin.href) };
    },
    async revoke(id, manageToken, { signal } = {}) {
      if (typeof id !== 'string' || !id || typeof manageToken !== 'string' || !manageToken) {
        throw new ShareClientError('Removal access is unavailable for this card.');
      }
      await request('/api/shares/' + encodeURIComponent(id), {
        method: 'DELETE', signal, headers: { Authorization: 'Bearer ' + manageToken }
      });
    }
  });
}

/*
 * The host owns validation and subscribes to accepted completed results.
 * Do not pass raw iframe messages to this seam or weaken sandbox/bridge policy.
 * A local completion always remains a personal, unverified score.
 */
export function attachAcceptedSnapshotAdapter({ subscribe, onSnapshot }) {
  if (typeof subscribe !== 'function' || typeof onSnapshot !== 'function') throw new TypeError('Host callbacks are required.');
  const unsubscribe = subscribe(snapshot => {
    if (!snapshot || snapshot.state !== 'complete' || snapshot.gameId !== 'wicked-bites' ||
        !Number.isSafeInteger(snapshot.score) || snapshot.score < 0) return;
    onSnapshot(Object.freeze({
      schemaVersion: 1, gameId: 'wicked-bites', score: snapshot.score,
      confidence: 'personal', source: 'website-preview-session'
    }));
  });
  return typeof unsubscribe === 'function' ? unsubscribe : () => {};
}
