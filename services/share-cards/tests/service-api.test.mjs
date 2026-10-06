import test from 'node:test';
import assert from 'node:assert/strict';
import { createService } from '../src/service.mjs';
import { MemoryStore } from '../src/stores.mjs';

const ORIGIN = 'https://share.example';
const APP_ORIGIN = 'https://game.example';
const KEY = 'a'.repeat(64);
const PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
const SCORE = Object.freeze({ schemaVersion: 1, kind: 'score', theme: 'astro', gameId: 'wicked-bites', score: 125430, achievedAt: '2026-10-06T12:00:00.000Z' });
const INVITE = Object.freeze({ schemaVersion: 1, kind: 'invite', theme: 'feast', gameId: 'toadal-feast' });

function harness(options = {}) {
  let now = new Date('2026-10-06T12:05:00.000Z');
  let renderCalls = 0;
  const snapshots = [];
  const store = options.store ?? new MemoryStore();
  const render = options.render ?? (async snapshot => { renderCalls++; snapshots.push(snapshot); return PNG.slice(); });
  const service = createService({ store, render, origin: ORIGIN, allowedOrigins: [APP_ORIGIN], creationEnabled: true, aliasAllowed: false, retentionDays: 30, maxDailyCreates: 100, maxDailyRenders: 100, clock: () => now, ...options });
  const fetch = (path, init = {}) => service.fetch(new Request(new URL(path, ORIGIN), init));
  const post = (path, payload, { key = KEY, origin = APP_ORIGIN, raw, headers = {} } = {}) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(key ? { 'Idempotency-Key': key } : {}), ...headers }, body: raw ?? JSON.stringify(payload) });
  return { service, store, fetch, post, snapshots, advance(ms) { now = new Date(now.getTime() + ms); }, renderCalls: () => renderCalls };
}
async function created(h, payload = SCORE, key = KEY) {
  const response = await h.post('/api/shares', payload, { key });
  assert.equal(response.status, 201, await response.clone().text());
  return response.json();
}

test('durable creation supplies unique crawler metadata and a PNG without management secrets', async () => {
  const h = harness();
  const share = await created(h);
  assert.match(share.id, /^[a-f0-9]{32}$/);
  assert.equal(share.url, ORIGIN + '/s/' + share.id);
  assert.equal(share.imageUrl, share.url + '/card-v1.png');
  assert.equal(share.kind, 'score');
  assert.equal(new Date(share.expiresAt).getTime(), new Date('2026-11-05T12:05:00.000Z').getTime());
  assert.match(share.manageToken, /^[a-f0-9]{64}$/);
  const page = await h.fetch(share.url);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  const html = await page.text();
  for (const property of ['og:title', 'og:description']) assert.ok(html.includes('property="' + property + '"'));
  assert.ok(html.includes('property="og:url" content="' + share.url + '"'));
  assert.ok(html.includes('property="og:image" content="' + share.imageUrl + '"'));
  assert.ok(html.includes('rel="canonical" href="' + share.url + '"'));
  assert.ok(!html.includes(share.manageToken));
  assert.ok(!html.includes(KEY));
  const image = await h.fetch(share.imageUrl);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.deepEqual(new Uint8Array(await image.arrayBuffer()), PNG);
  assert.notEqual(share.url, (await created(h, { ...SCORE, score: 8 }, 'b'.repeat(64))).url);
});

test('the service assigns result trust and rejects unsupported claims and arbitrary URLs', async () => {
  const h = harness();
  await created(h);
  assert.equal(h.snapshots.length, 1);
  assert.equal(h.snapshots[0].confidence, 'none');
  assert.equal(h.snapshots[0].source, 'personal-submission');
  assert.equal(h.snapshots[0].persistence, 'none');
  for (const extra of [{ verified: true }, { confidence: 'independently-verified' }, { source: 'server' }, { imageUrl: 'https://attacker.example/track' }, { url: 'javascript:alert(1)' }]) {
    const r = await h.post('/api/shares', { ...SCORE, ...extra }, { key: 'b'.repeat(64) });
    assert.equal(r.status, 400, await r.text());
  }
});

test('invites cannot fabricate a score or accomplishment date', async () => {
  const h = harness();
  assert.equal((await created(h, INVITE)).kind, 'invite');
  for (const extra of [{ score: 0 }, { achievedAt: SCORE.achievedAt }]) {
    const r = await h.post('/api/shares', { ...INVITE, ...extra }, { key: 'b'.repeat(64) });
    assert.equal(r.status, 400, await r.text());
  }
});

test('missing, unsafe, wrong-game, and future score inputs never render', async () => {
  const h = harness();
  const { score, ...missingScore } = SCORE;
  const bad = [missingScore, { ...SCORE, score: null }, { ...SCORE, score: -1 }, { ...SCORE, score: 1.5 }, { ...SCORE, score: 1_000_000_000 }, { ...SCORE, score: Number.MAX_SAFE_INTEGER + 1 }, { ...SCORE, score: '42' }, { ...SCORE, gameId: 'toadal-feast' }, { ...SCORE, gameId: 'unknown' }, { ...SCORE, achievedAt: 'not-a-date' }, { ...SCORE, achievedAt: '2026-10-07T00:00:00.000Z' }];
  for (const payload of bad) {
    const r = await h.post('/api/shares', payload);
    assert.equal(r.status, 400, JSON.stringify(payload) + ': ' + await r.text());
  }
  assert.equal(h.renderCalls(), 0);
});

test('an explicitly saved zero score remains shareable', async () => {
  const h = harness();
  const share = await created(h, { ...SCORE, score: 0 });
  assert.match(await (await h.fetch(share.url)).text(), /\b0\b/);
});

test('public aliases require configuration and player choice and are HTML escaped', async () => {
  const off = harness();
  assert.equal((await off.post('/api/shares', { ...SCORE, alias: 'Player', aliasPublic: true })).status, 400);
  const h = harness({ aliasAllowed: true });
  for (const extra of [{ alias: 'Player' }, { alias: 'Player', aliasPublic: false }, { alias: 'x'.repeat(25), aliasPublic: true }]) assert.equal((await h.post('/api/shares', { ...SCORE, ...extra })).status, 400);
  const alias = '<script>hi</script>';
  const share = await created(h, { ...SCORE, alias, aliasPublic: true });
  const html = await (await h.fetch(share.url)).text();
  assert.ok(html.includes('&lt;script&gt;hi&lt;/script&gt;'));
  assert.ok(!html.includes(alias));
});

test('large or malformed bodies fail before rendering', async () => {
  const h = harness();
  assert.equal((await h.post('/api/shares', SCORE, { raw: '{' })).status, 400);
  assert.equal((await h.post('/api/shares', SCORE, { raw: JSON.stringify({ ...SCORE, alias: 'x'.repeat(80_000) }) })).status, 413);
  for (const body of [[], null, 1, 'string']) assert.equal((await h.post('/api/shares', body)).status, 400);
  assert.equal(h.renderCalls(), 0);
});

test('creation requires a private fixed-format idempotency key', async () => {
  const h = harness();
  for (const key of [null, 'short', 'A'.repeat(64), 'z'.repeat(64), KEY + 'x']) assert.equal((await h.post('/api/shares', SCORE, { key })).status, 400);
  assert.equal(h.renderCalls(), 0);
});

test('durable retries preserve the exact link and token with one render', async () => {
  const h = harness();
  const share = await created(h);
  const retry = await h.post('/api/shares', SCORE);
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), share);
  assert.equal(h.renderCalls(), 1);
  assert.equal((await h.post('/api/shares', { ...SCORE, score: 12 })).status, 409);
  assert.equal(h.renderCalls(), 1);
});

test('concurrent retries return pending and do not run a second render', async () => {
  let release, started;
  const rendering = new Promise(resolve => { started = resolve; });
  let calls = 0;
  const h = harness({ render: async () => { calls++; started(); return new Promise(resolve => { release = () => resolve(PNG.slice()); }); } });
  const first = h.post('/api/shares', SCORE);
  await rendering;
  const pending = await h.post('/api/shares', SCORE);
  assert.equal(pending.status, 409);
  release();
  assert.equal((await first).status, 201);
  assert.equal((await h.post('/api/shares', SCORE)).status, 200);
  assert.equal(calls, 1);
});

test('scanner GET and HEAD requests have no render, write, or expiry-extension side effects', async () => {
  class ObservedStore extends MemoryStore {
    writes = 0;
    async put(...args) { this.writes++; return super.put(...args); }
    async create(...args) { this.writes++; return super.create(...args); }
    async delete(...args) { this.writes++; return super.delete(...args); }
  }
  const store = new ObservedStore();
  const h = harness({ store });
  const share = await created(h);
  const before = store.writes;
  for (let i = 0; i < 3; i++) for (const url of [share.url, share.imageUrl]) {
    const get = await h.fetch(url);
    const head = await h.fetch(url, { method: 'HEAD' });
    assert.equal(get.status, 200);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('content-type'), get.headers.get('content-type'));
  }
  assert.equal(store.writes, before);
  assert.equal(h.renderCalls(), 1);
  h.advance(30 * 86400_000 + 1);
  assert.equal((await h.fetch(share.url)).status, 410);
  assert.equal((await h.fetch(share.imageUrl)).status, 410);
});

test('revocation needs management authority and invalidates page and direct image', async () => {
  const h = harness();
  const share = await created(h);
  assert.ok([401, 403].includes((await h.fetch('/api/shares/' + share.id, { method: 'DELETE' })).status));
  assert.ok([401, 403].includes((await h.fetch('/api/shares/' + share.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + '0'.repeat(64), Origin: APP_ORIGIN } })).status));
  assert.equal((await h.fetch(share.url)).status, 200);
  assert.equal((await h.fetch('/api/shares/' + share.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + share.manageToken, Origin: APP_ORIGIN } })).status, 204);
  for (const url of [share.url, share.imageUrl]) {
    const result = await h.fetch(url);
    assert.equal(result.status, 410);
    assert.ok(!(await result.text()).includes('125430'));
  }
  assert.equal((await h.post('/api/shares', SCORE)).status, 410);
});

test('expired links cannot serve their PNG and cleanup cannot restore them', async () => {
  const h = harness({ retentionDays: 1 });
  const share = await created(h);
  h.advance(86400_000 + 1);
  assert.equal((await h.fetch(share.url)).status, 410);
  assert.equal((await h.fetch(share.imageUrl)).status, 410);
  await h.service.cleanup();
  assert.ok([404, 410].includes((await h.fetch(share.url)).status));
  assert.ok([404, 410].includes((await h.fetch(share.imageUrl)).status));
});

test('untrusted origins cannot create or invoke the renderer', async () => {
  const h = harness();
  const r = await h.post('/api/shares', SCORE, { origin: 'https://attacker.example' });
  assert.equal(r.status, 403);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  assert.equal(h.renderCalls(), 0);
});

test('disabled creation exposes an honest capability and refuses new links', async () => {
  const h = harness({ creationEnabled: false });
  const config = await h.fetch('/api/config');
  assert.equal(config.status, 200);
  assert.equal((await config.json()).creationEnabled, false);
  assert.equal((await h.post('/api/shares', SCORE)).status, 503);
  assert.equal(h.renderCalls(), 0);
});

test('preview returns PNG bytes and consumes no durable creation slot', async () => {
  const h = harness({ maxDailyCreates: 1 });
  const preview = await h.post('/api/preview', SCORE, { key: null });
  assert.equal(preview.status, 200);
  assert.equal(preview.headers.get('content-type'), 'image/png');
  assert.deepEqual(new Uint8Array(await preview.arrayBuffer()), PNG);
  await created(h);
  assert.equal(h.renderCalls(), 2);
});

test('render failure keeps a private failed tombstone and a fresh key safely recovers', async () => {
  let fail = true;
  const h = harness({ render: async () => { if (fail) throw new Error('private-renderer-path'); return PNG.slice(); } });
  const failed = await h.post('/api/shares', SCORE);
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('private-renderer-path'));
  fail = false;
  assert.equal((await h.post('/api/shares', SCORE)).status, 503);
  assert.equal((await h.fetch((await created(h, SCORE, 'b'.repeat(64))).url)).status, 200);
});

test('storage errors are recoverable and private details stay out of responses', async () => {
  class FailingStore extends MemoryStore {
    fail = true;
    async create(...args) { if (this.fail) throw new Error('private-storage-path'); return super.create(...args); }
  }
  const store = new FailingStore();
  const h = harness({ store });
  const failed = await h.post('/api/shares', SCORE);
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('private-storage-path'));
  store.fail = false;
  await created(h);
});

test('daily creation cap permits retries, blocks new keys, and resets next UTC day', async () => {
  const h = harness({ maxDailyCreates: 1 });
  await created(h);
  assert.equal((await h.post('/api/shares', SCORE)).status, 200);
  assert.equal((await h.post('/api/shares', SCORE, { key: 'b'.repeat(64) })).status, 429);
  assert.equal(h.renderCalls(), 1);
  h.advance(86400_000);
  await created(h, SCORE, 'b'.repeat(64));
});

test('previews cannot bypass the daily renderer cap', async () => {
  const h = harness({ maxDailyRenders: 1 });
  assert.equal((await h.post('/api/preview', SCORE, { key: null })).status, 200);
  assert.equal((await h.post('/api/preview', SCORE, { key: null })).status, 429);
  assert.equal((await h.post('/api/shares', SCORE)).status, 429);
  assert.equal(h.renderCalls(), 1);
});

test('a global rate refusal blocks new preview and link work without affecting an existing durable retry', async () => {
  let allowed = true;
  const h = harness({ rateLimit: async () => allowed });
  const share = await created(h);
  allowed = false;
  assert.equal((await h.post('/api/preview', SCORE, { key: null })).status, 429);
  assert.equal((await h.post('/api/shares', SCORE, { key: 'b'.repeat(64) })).status, 429);
  const retry = await h.post('/api/shares', SCORE);
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), share);
  assert.equal(h.renderCalls(), 1);
});

test('daily creation cap is shared across concurrent service instances', async () => {
  const store = new MemoryStore();
  const a = harness({ store, maxDailyCreates: 1 });
  const b = harness({ store, maxDailyCreates: 1 });
  const results = await Promise.all([a.post('/api/shares', SCORE), b.post('/api/shares', SCORE, { key: 'b'.repeat(64) })]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 429]);
  assert.equal(a.renderCalls() + b.renderCalls(), 1);
});

test('daily render cap is shared across concurrent preview and durable work', async () => {
  const store = new MemoryStore();
  const a = harness({ store, maxDailyRenders: 1 });
  const b = harness({ store, maxDailyRenders: 1 });
  const results = await Promise.all([a.post('/api/preview', SCORE, { key: null }), b.post('/api/shares', SCORE, { key: 'b'.repeat(64) })]);
  assert.ok(results.map(r => r.status).includes(429));
  assert.equal(a.renderCalls() + b.renderCalls(), 1);
});

test('an image-storage failure cannot publish a ready page or orphan PNG', async () => {
  class ImageFailStore extends MemoryStore {
    fail = true;
    async put(key, data) { if (this.fail && data[0] === 137 && data[1] === 80) throw new Error('private-image-path'); return super.put(key, data); }
  }
  const store = new ImageFailStore();
  const h = harness({ store });
  const fail = await h.post('/api/shares', SCORE);
  assert.equal(fail.status, 503);
  assert.ok(!(await fail.text()).includes('private-image-path'));
  assert.equal((await store.list('images/')).length, 0);
  for (const { key } of await store.list('records/')) assert.equal((await h.fetch('/s/' + key.split('/')[1])).status, 404);
  store.fail = false;
  await created(h, SCORE, 'b'.repeat(64));
});

test('public responses prohibit cache retention, MIME sniffing, and executable framing', async () => {
  const h = harness();
  const share = await created(h);
  for (const url of [share.url, share.imageUrl]) {
    const response = await h.fetch(url);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
  }
  const csp = (await h.fetch(share.url)).headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
  const untrustedPreflight = await h.fetch('/api/shares', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
  assert.equal(untrustedPreflight.status, 403);
  assert.equal(untrustedPreflight.headers.get('access-control-allow-origin'), null);
  const allowedPreflight = await h.fetch('/api/shares', { method: 'OPTIONS', headers: { Origin: APP_ORIGIN } });
  assert.equal(allowedPreflight.status, 204);
  assert.equal(allowedPreflight.headers.get('access-control-allow-origin'), APP_ORIGIN);
});

test('the mutation boundary rejects non-JSON and cannot be used to redirect public links', async () => {
  const h = harness();
  assert.equal((await h.post('/api/shares', SCORE, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  const share = await created(h);
  const html = await (await h.fetch(share.url + '?url=https://evil.example&image=https://evil.example')).text();
  assert.ok(!html.includes('evil.example'));
  assert.equal((await h.fetch(share.url, { method: 'POST', body: '{}' })).status, 405);
});

test('cleanup of a stale preparation cannot be undone by a late renderer', async () => {
  let release, started;
  const rendering = new Promise(resolve => { started = resolve; });
  const h = harness({ render: async () => { started(); return new Promise(resolve => { release = () => resolve(PNG.slice()); }); } });
  const creation = h.post('/api/shares', SCORE);
  await rendering;
  const [{ key }] = await h.store.list('records/');
  const id = key.split('/')[1];
  h.advance(120001);
  await h.service.cleanup();
  assert.equal((await h.fetch('/s/' + id)).status, 410);
  release();
  await creation;
  assert.equal((await h.fetch('/s/' + id)).status, 410);
  assert.equal((await h.fetch('/s/' + id + '/card-v1.png')).status, 410);
});

test('retention cleanup never allows the old private key to republish its old URL', async () => {
  const h = harness({ retentionDays: 1 });
  const share = await created(h);
  const key = KEY;
  h.advance(4 * 86400_000);
  await h.service.cleanup();
  const replay = await h.post('/api/shares', SCORE, { key });
  assert.ok([404, 410].includes(replay.status));
  assert.ok([404, 410].includes((await h.fetch(share.url)).status));
  assert.ok([404, 410].includes((await h.fetch(share.imageUrl)).status));
});

test('score timestamps reject impossible calendar dates and even slightly future claims', async () => {
  const h = harness();
  for (const achievedAt of ['2026-02-31T00:00:00.000Z', '2026-02-29T00:00:00Z', '2026-04-31T00:00:00Z', '2026-10-06T12:05:00.001Z']) {
    assert.equal((await h.post('/api/shares', { ...SCORE, achievedAt })).status, 400, achievedAt);
  }
  assert.equal(h.renderCalls(), 0);
});

test('manual score submissions do not fabricate a game source, save, or achievement timestamp', async () => {
  const h = harness();
  const { achievedAt, ...manual } = SCORE;
  const share = await created(h, manual);
  const html = await (await h.fetch(share.url)).text();
  assert.match(html, /personal/i);
  assert.doesNotMatch(html, /source-reported/i);
  assert.equal(h.snapshots[0].confidence, 'none');
  assert.equal(h.snapshots[0].persistence, 'none');
  assert.equal(h.snapshots[0].source, 'personal-submission');
  assert.equal(h.snapshots[0].achievedAt, null);
});

test('failed renders consume their renderer budget and cannot be retried unlimitedly', async () => {
  let calls = 0;
  const h = harness({ maxDailyRenders: 1, render: async () => { calls++; throw new Error('render failure'); } });
  assert.equal((await h.post('/api/preview', SCORE, { key: null })).status, 503);
  assert.equal((await h.post('/api/preview', SCORE, { key: null })).status, 429);
  assert.equal(calls, 1);
});

test('the real stream limit catches dishonest or absent content-length headers', async () => {
  const h = harness();
  const raw = JSON.stringify({ ...SCORE, alias: 'x'.repeat(8192) });
  assert.equal((await h.post('/api/shares', SCORE, { raw, headers: { 'Content-Length': '1' } })).status, 413);
  assert.equal(h.renderCalls(), 0);
});

async function expiredFixtures(store, count) {
  const encode = value => new TextEncoder().encode(JSON.stringify(value));
  const ids = [];
  for (let i = 1; i <= count; i++) {
    const id = i.toString(16).padStart(32, '0');
    ids.push(id);
    await store.put('records/' + id, encode({
      id, status: 'ready', createdAt: '2026-09-30T00:00:00.000Z',
      expiresAt: '2026-10-01T00:00:00.000Z', payloadHash: 'fixture',
      manageHash: '0'.repeat(64), card: { ...SCORE, alias: 'Private player ' + i },
    }));
    await store.put('images/' + id, PNG);
  }
  return ids;
}

test('cleanup resumes persisted cursors across service restarts and retires every page', async () => {
  class PagedStore extends MemoryStore {
    pages = [];
    async listPage(prefix, options) { const result = await super.listPage(prefix, options); this.pages.push({ prefix, ...options, count: result.items.length }); return result; }
  }
  const store = new PagedStore();
  const ids = await expiredFixtures(store, 205);
  const encode = value => new TextEncoder().encode(JSON.stringify(value));
  for (let i = 1; i <= 205; i++) await store.put('quota/2026-10-01/render-fixture-' + String(i).padStart(3, '0'), encode({ expiresAt: '2026-10-02T00:00:00.000Z' }));
  const h = harness({ store, retentionDays: 1 });
  const actual = await created(h);
  h.advance(4 * 86400_000);
  const first = await h.service.cleanup();
  assert.equal(first.removed, 100);
  const persisted = JSON.parse(new TextDecoder().decode(await store.get('system/cleanup-records')));
  assert.equal(persisted.cursor, 'records/' + ids[99]);
  assert.equal((await store.list('records/')).length, 106);
  // Each fresh service reads the persisted storage cursor, as separate Worker invocations do.
  for (let i = 0; i < 2; i++) {
    const restarted = harness({ store, retentionDays: 1, clock: () => new Date('2026-10-10T12:05:00.000Z') });
    await restarted.service.cleanup();
  }
  assert.deepEqual(store.pages.filter(page => page.prefix === 'records/').map(page => page.count), [100, 100, 6]);
  assert.deepEqual(store.pages.filter(page => page.prefix === 'quota/').map(page => page.count), [100, 100, 7]);
  assert.ok(store.pages.every(page => page.limit === 100));
  assert.equal((await store.list('records/')).length, 0);
  assert.equal((await store.list('images/')).length, 0);
  assert.equal((await store.list('quota/')).length, 0);
  assert.equal((await store.list('removed/')).length, 206);
  for (const { data } of await store.list('removed/')) assert.deepEqual(JSON.parse(new TextDecoder().decode(data)), { retired: true });
  assert.deepEqual(JSON.parse(new TextDecoder().decode(await store.get('system/cleanup-records'))), { cursor: null });
  for (const id of [...ids, actual.id]) {
    assert.equal((await h.fetch('/s/' + id)).status, 410);
    assert.equal((await h.fetch('/s/' + id + '/card-v1.png')).status, 410);
  }
  assert.equal((await h.post('/api/shares', SCORE)).status, 410);
  assert.equal(h.renderCalls(), 1);
});

test('a cleanup storage failure preserves the previous cursor and safely retries the unfinished page', async () => {
  class FailureStore extends MemoryStore {
    failingKey = null;
    failed = false;
    seenCursors = [];
    async listPage(prefix, options) { if (prefix === 'records/') this.seenCursors.push(options.cursor); return super.listPage(prefix, options); }
    async delete(key) {
      if (!this.failed && key === this.failingKey) { this.failed = true; throw new Error('temporary storage outage'); }
      return super.delete(key);
    }
  }
  const store = new FailureStore();
  const ids = await expiredFixtures(store, 205);
  const h = harness({ store });
  assert.equal((await h.service.cleanup()).removed, 100);
  const prior = await store.get('system/cleanup-records');
  const previousCursor = JSON.parse(new TextDecoder().decode(prior)).cursor;
  assert.equal(previousCursor, 'records/' + ids[99]);
  store.failingKey = 'images/' + ids[149];
  await assert.rejects(h.service.cleanup(), /temporary storage outage/);
  assert.deepEqual(await store.get('system/cleanup-records'), prior);
  // Retrying cannot skip entries whose record marker was written before the failed image removal.
  const restarted = harness({ store });
  await restarted.service.cleanup();
  assert.deepEqual(store.seenCursors, [null, previousCursor, previousCursor]);
  assert.equal((await store.list('records/')).length, 0);
  assert.equal((await store.list('images/')).length, 0);
  assert.equal((await store.list('removed/')).length, 205);
  for (const id of ids) assert.equal((await restarted.fetch('/s/' + id + '/card-v1.png')).status, 410);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(await store.get('system/cleanup-records'))), { cursor: null });
});
