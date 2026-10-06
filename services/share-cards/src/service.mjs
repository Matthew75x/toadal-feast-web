import { GAMES, HttpError, normalizePayload, escapeText, cardTitle, cardDescription } from './contract.mjs';
const encoder = new TextEncoder(), decoder = new TextDecoder();
const encode = value => encoder.encode(JSON.stringify(value));
const decode = data => data ? JSON.parse(decoder.decode(data)) : null;
const privateHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
const json = (value, status = 200, more = {}) => new Response(JSON.stringify(value), { status, headers: { ...privateHeaders, 'Content-Type': 'application/json; charset=utf-8', ...more } });
async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))].map(x => x.toString(16).padStart(2, '0')).join(''); }
function equalHash(a, b) { let diff = a.length ^ b.length; for (let i = 0; i < 64; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return diff === 0; }
async function boundedJson(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) throw new HttpError(415, 'Send JSON.');
  if (Number(request.headers.get('Content-Length')) > 4096) throw new HttpError(413, 'Card payload is too large.');
  const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, 'Missing card.');
  let size = 0; const parts = [];
  while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > 4096) { await reader.cancel(); throw new HttpError(413, 'Card payload is too large.'); } parts.push(chunk.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { return JSON.parse(decoder.decode(bytes)); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
function htmlPage(card, url, imageUrl, playUrl, expiresAt) {
  const title = escapeText(cardTitle(card)), description = escapeText(cardDescription(card));
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' · TOADAL FEAST</title><meta name="description" content="' + description + '"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="' + escapeText(url) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="TOADAL FEAST"><meta property="og:title" content="' + title + '"><meta property="og:description" content="' + description + '"><meta property="og:url" content="' + escapeText(url) + '"><meta property="og:image" content="' + escapeText(imageUrl) + '"><meta property="og:image:secure_url" content="' + escapeText(imageUrl) + '"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + title + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + title + '"><meta name="twitter:description" content="' + description + '"><meta name="twitter:image" content="' + escapeText(imageUrl) + '"><meta name="twitter:image:alt" content="' + title + '"><style>body{margin:0;background:#120c22;color:#fff8e8;font:18px/1.6 system-ui,sans-serif}main{max-width:900px;margin:auto;padding:32px 24px 60px}img{width:100%;height:auto;border-radius:24px;display:block}h1{font-size:clamp(28px,5vw,44px);line-height:1.15}a{display:inline-block;background:#fff0a3;color:#22112d;padding:14px 26px;border-radius:99px;font-weight:750;text-decoration:none}small{display:block;margin-top:24px;color:#c8bfd6}a:focus-visible{outline:3px solid #78e9ff;outline-offset:5px}</style></head><body><main><img src="' + escapeText(imageUrl) + '" width="1200" height="630" alt="' + title + '"><h1>' + title + '</h1><p>' + description + '</p>' + (card.kind === 'score' ? '<p>Personal, player-submitted score. No verified rank or reward is implied.</p>' : '') + '<a href="' + escapeText(playUrl) + '">' + (card.gameId === 'toadal-feast' ? 'Explore the games' : 'Play Wicked Bites') + '</a><small>This public card expires ' + escapeText(new Date(expiresAt).toISOString().slice(0, 10)) + '. Anyone with this link can view or forward it. External previews and saved images may remain after removal.</small></main></body></html>';
}
export function createService({ store, render, origin, allowedOrigins = [origin], playBase = 'https://matthew75x.github.io/toadal-feast-web', creationEnabled = false, aliasAllowed = false, retentionDays = 7, maxDailyCreates = 100, maxDailyRenders = 300, rateLimit = async () => true, clock = () => new Date() }) {
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.origin !== origin || !(parsedOrigin.protocol === 'https:' || (parsedOrigin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname)))) throw new Error('Configure an HTTPS public origin, or loopback for local development.');
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 30) throw new Error('Retention must be 1–30 days.');
  for (const limit of [maxDailyCreates, maxDailyRenders]) if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Daily limits must be 1–500.');
  const gameConfig = Object.values(GAMES).map(game => ({ id: game.id, name: game.name, canShareScore: game.canShareScore, playUrl: playBase + game.path }));
  async function quota(kind, limit) {
    const day = clock().toISOString().slice(0, 10), prefix = 'quota/' + day + '/' + kind + '-';
    const keys = store.listKeys ? await store.listKeys(prefix) : (await store.list(prefix)).map(item => item.key);
    const occupied = new Set(keys);
    for (let slot = 0, races = 0; slot < limit && races < 8; slot++) {
      const key = prefix + slot;
      if (occupied.has(key)) continue;
      if (await store.create(key, encode({ expiresAt: new Date(clock().getTime() + 2 * 86400000).toISOString() }))) return;
      races++;
    }
    throw new HttpError(429, 'Today’s card limit has been reached. Try again tomorrow.');
  }
  async function readyRecord(id) {
    if (await store.get('removed/' + id)) throw new HttpError(410, 'This card has expired or was removed.');
    const record = decode(await store.get('records/' + id));
    if (!record) throw new HttpError(404, 'This card could not be found.');
    if (record.status === 'removed' || new Date(record.expiresAt) <= clock()) throw new HttpError(410, 'This card has expired or was removed.');
    if (record.status !== 'ready') throw new HttpError(404, 'This card is not ready.');
    return record;
  }
  const resultFor = (record, manageToken = undefined) => ({ id: record.id, kind: record.card.kind, url: origin + '/s/' + record.id, imageUrl: origin + '/s/' + record.id + '/card-v1.png', expiresAt: record.expiresAt, manageToken });
  async function handle(request) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/api/config') return json({ games: gameConfig, themes: ['feast', 'astro'], aliasAllowed, retentionDays, analyticsEnabled: false, creationEnabled });
    if (request.method === 'GET' && path === '/health') return json({ ok: true });
    if (request.method === 'POST' && ['/api/preview', '/api/shares'].includes(path)) {
      if (!creationEnabled) throw new HttpError(503, 'Card creation is currently disabled.');
      if (!allowedOrigins.includes(request.headers.get('Origin'))) throw new HttpError(403, 'Open the card composer on an approved site.');
      const input = await boundedJson(request), card = normalizePayload(input, { aliasAllowed, now: clock() });
      if (path === '/api/preview') {
        if (!await rateLimit()) throw new HttpError(429, 'Please wait before preparing another card.');
        await quota('render', maxDailyRenders);
        const png = await render(card);
        if (!(png instanceof Uint8Array) || png.length > 2000000) throw new Error('Invalid renderer output.');
        return new Response(png, { headers: { ...privateHeaders, 'Content-Type': 'image/png' } });
      }
      const key = request.headers.get('Idempotency-Key') || '';
      if (!/^[a-f0-9]{64}$/.test(key)) throw new HttpError(400, 'Use a fresh secure creation key.');
      const id = (await digest(key + '/id')).slice(0, 32), manageToken = await digest(key + '/manage');
      const payloadHash = await digest(JSON.stringify(Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)))));
      if (await store.get('removed/' + id)) throw new HttpError(410, 'This card has expired or was removed.');
      const recordKey = 'records/' + id, existing = decode(await store.get(recordKey));
      if (existing) {
        if (existing.payloadHash !== payloadHash) throw new HttpError(409, 'This creation key belongs to another card.');
        if (existing.status === 'removed' || new Date(existing.expiresAt) <= clock()) throw new HttpError(410, 'This card has expired or was removed.');
        if (existing.status === 'ready') return json(resultFor(existing, manageToken));
        throw new HttpError(existing.status === 'failed' ? 503 : 409, existing.status === 'failed' ? 'Card preparation failed. Start a new preparation.' : 'This card is being prepared. Retry shortly with the same creation key.');
      }
      if (!await rateLimit()) throw new HttpError(429, 'Please wait before preparing another card.');
      const createdAt = clock().toISOString(), expiresAt = new Date(clock().getTime() + retentionDays * 86400000).toISOString();
      const record = { id, status: 'pending', payloadHash, manageHash: await digest(manageToken), createdAt, expiresAt, card };
      await quota('create', maxDailyCreates); await quota('render', maxDailyRenders);
      if (!await store.create(recordKey, encode(record))) throw new HttpError(409, 'This card is being prepared. Retry shortly.');
      try {
        const png = await render(card);
        if (!(png instanceof Uint8Array) || png.length > 2000000) throw new Error('Invalid renderer output.');
        if (await store.get('removed/' + id)) throw new HttpError(410, 'This card was removed during preparation.');
        await store.put('images/' + id, png);
        record.status = 'ready'; await store.put(recordKey, encode(record));
        if (await store.get('removed/' + id)) throw new HttpError(410, 'This card was removed during preparation.');
        return json(resultFor(record, manageToken), 201);
      } catch (error) {
        await store.delete('images/' + id);
        await store.put(recordKey, encode({ ...record, status: 'failed', card: null }));
        throw error;
      }
    }
    const deleteMatch = path.match(/^\/api\/shares\/([a-f0-9]{32})$/);
    if (deleteMatch && request.method === 'DELETE') {
      if (!allowedOrigins.includes(request.headers.get('Origin'))) throw new HttpError(403, 'Use an approved card composer.');
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
      const record = decode(await store.get('records/' + deleteMatch[1]));
      if (!/^[a-f0-9]{64}$/.test(token) || !record || !equalHash(await digest(token), record.manageHash)) throw new HttpError(403, 'A valid removal key is required.');
      await store.put('removed/' + record.id, encode({ retired: true }));
      await store.put('records/' + record.id, encode({ id: record.id, status: 'removed', payloadHash: record.payloadHash, manageHash: record.manageHash, expiresAt: record.expiresAt }));
      await store.delete('images/' + record.id);
      return new Response(null, { status: 204, headers: privateHeaders });
    }
    const shareMatch = path.match(/^\/s\/([a-f0-9]{32})(\/card-v1\.png)?$/);
    if (shareMatch && ['GET', 'HEAD'].includes(request.method)) {
      const record = await readyRecord(shareMatch[1]);
      if (shareMatch[2]) {
        const image = await store.get('images/' + record.id);
        if (!image) throw new HttpError(503, 'The card image is temporarily unavailable.');
        return new Response(request.method === 'HEAD' ? null : image, { headers: { ...privateHeaders, 'Content-Type': 'image/png', 'Content-Length': String(image.length) } });
      }
      const data = resultFor(record), html = htmlPage(record.card, data.url, data.imageUrl, playBase + GAMES[record.card.gameId].path, record.expiresAt);
      return new Response(request.method === 'HEAD' ? null : html, { headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" } });
    }
    if (path.startsWith('/api/') || path.startsWith('/s/')) throw new HttpError(405, 'This method or route is not supported.');
    throw new HttpError(404, 'Not found.');
  }
  return {
    async fetch(request) {
      const requestOrigin = request.headers.get('Origin');
      if (request.method === 'OPTIONS') {
        if (!allowedOrigins.includes(requestOrigin)) return json({ error: 'Origin is not allowed.' }, 403);
        return new Response(null, { status: 204, headers: { ...privateHeaders, 'Access-Control-Allow-Origin': requestOrigin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key, Authorization', 'Access-Control-Max-Age': '600' } });
      }
      let response;
      try { response = await handle(request); } catch (error) { response = json({ error: error instanceof HttpError ? error.message : 'Card preparation is temporarily unavailable.' }, error instanceof HttpError ? error.status : 503, error instanceof HttpError && [409, 429].includes(error.status) ? { 'Retry-After': '60' } : {}); }
      if (allowedOrigins.includes(requestOrigin)) { response.headers.set('Access-Control-Allow-Origin', requestOrigin); response.headers.set('Vary', 'Origin'); }
      return response;
    },
    async cleanup() {
      let removed = 0;
      async function page(prefix, label) {
        if (!store.listPage) return { items: await store.list(prefix), cursor: null };
        const cursorKey = 'system/cleanup-' + label;
        const previous = decode(await store.get(cursorKey));
        return store.listPage(prefix, { cursor: previous?.cursor || null, limit: 100 });
      }
      const records = await page('records/', 'records');
      for (const { key, data } of records.items) {
        const record = decode(data);
        if (record && (await store.get('removed/' + record.id) || new Date(record.expiresAt) <= clock() || (record.status === 'pending' && new Date(record.createdAt).getTime() + 120000 < clock().getTime()))) {
          await store.put('removed/' + record.id, encode({ retired: true }));
          await store.put(key, encode({ id: record.id, status: 'removed', payloadHash: record.payloadHash, manageHash: record.manageHash, expiresAt: record.expiresAt }));
          await store.delete('images/' + record.id);
          if (new Date(record.expiresAt).getTime() + 2 * 86400000 < clock().getTime()) await store.delete(key);
          removed++;
        }
      }
      await store.put('system/cleanup-records', encode({ cursor: records.cursor }));
      const quotas = await page('quota/', 'quota');
      for (const { key, data } of quotas.items) if (data && new Date(decode(data).expiresAt) <= clock()) await store.delete(key);
      await store.put('system/cleanup-quota', encode({ cursor: quotas.cursor }));
      return { removed };
    },
  };
}
