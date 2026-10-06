import test from 'node:test';
import assert from 'node:assert/strict';
import { createBurstLimiter } from '../src/burst-limit.mjs';
import { MemoryStore } from '../src/stores.mjs';

test('twenty independent limiter instances share exactly five atomic reservations', async () => {
  const store = new MemoryStore();
  const clock = () => new Date('2026-10-06T12:05:20.000Z');
  const limiters = Array.from({ length: 20 }, () => createBurstLimiter(store, { clock }));
  const results = await Promise.all(limiters.map(allow => allow()));
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(results.filter(value => value === false).length, 15);
  assert.equal((await store.list('quota/')).length, 5);
  assert.equal(await createBurstLimiter(store, { clock })(), false);
});

test('a fresh wall-clock minute resets the shared pool without removing the prior minute', async () => {
  const store = new MemoryStore();
  let now = new Date('2026-10-06T12:05:59.999Z');
  const allow = createBurstLimiter(store, { clock: () => now });
  for (let i = 0; i < 5; i++) assert.equal(await allow(), true);
  assert.equal(await allow(), false);
  now = new Date('2026-10-06T12:06:00.000Z');
  const restarted = createBurstLimiter(store, { clock: () => now });
  for (let i = 0; i < 5; i++) assert.equal(await restarted(), true);
  assert.equal(await allow(), false);
  assert.equal((await store.list('quota/')).length, 10);
});

test('storage failures fail closed and a recovered limiter still has a bounded pool', async () => {
  class FailingStore extends MemoryStore {
    failList = true;
    failCreate = false;
    async listKeys(...args) { if (this.failList) throw new Error('list unavailable'); return super.listKeys(...args); }
    async create(...args) { if (this.failCreate) throw new Error('reservation unavailable'); return super.create(...args); }
  }
  const store = new FailingStore();
  const allow = createBurstLimiter(store, { clock: () => new Date('2026-10-06T12:05:00.000Z') });
  await assert.rejects(allow, /list unavailable/);
  assert.equal(store.entries.size, 0);
  store.failList = false; store.failCreate = true;
  await assert.rejects(allow, /reservation unavailable/);
  assert.equal(store.entries.size, 0);
  store.failCreate = false;
  for (let i = 0; i < 5; i++) assert.equal(await allow(), true);
  assert.equal(await allow(), false);
});

test('reservations contain only anonymous quota metadata and a short expiry', async () => {
  const store = new MemoryStore();
  const allow = createBurstLimiter(store, { clock: () => new Date('2026-10-06T23:59:50.000Z') });
  assert.equal(await allow(), true);
  const [{ key, data }] = await store.list('quota/');
  assert.match(key, /^quota\/2026-10-06\/burst-\d+-\d+$/);
  const value = JSON.parse(new TextDecoder().decode(data));
  assert.deepEqual(value, { expiresAt: '2026-10-07T00:01:50.000Z' });
  assert.ok(!/ip|device|session|recipient|alias|score|token|user/i.test(key + JSON.stringify(value)));
  assert.equal((await store.list('records/')).length, 0);
});

test('invalid configuration cannot widen or disable the global pool', () => {
  for (const limit of [0, -1, 21, 1.5, '5', null, NaN]) {
    assert.throws(() => createBurstLimiter(new MemoryStore(), { limit }), RangeError);
  }
});

test('an exhausted daily renderer budget refuses future burst claims without extra writes', async () => {
  class ObservedStore extends MemoryStore {
    claims = 0;
    async create(...args) { this.claims++; return super.create(...args); }
  }
  const store = new ObservedStore();
  await store.put('quota/2026-10-06/render-0', new TextEncoder().encode(JSON.stringify({ expiresAt: '2026-10-08T12:00:00.000Z' })));
  let now = new Date('2026-10-06T12:05:00.000Z');
  const allow = createBurstLimiter(store, { dailyRenderLimit: 1, clock: () => now });
  assert.deepEqual(await Promise.all(Array.from({ length: 20 }, () => allow())), Array(20).fill(false));
  now = new Date('2026-10-06T12:06:00.000Z');
  assert.equal(await allow(), false);
  now = new Date('2026-10-06T23:59:00.000Z');
  assert.equal(await createBurstLimiter(store, { dailyRenderLimit: 1, clock: () => now })(), false);
  assert.equal(store.claims, 0);
  assert.equal(store.entries.size, 1);
  now = new Date('2026-10-07T00:00:00.000Z');
  assert.equal(await allow(), true);
  assert.equal(store.claims, 1);
  assert.equal(store.entries.size, 2);
});
