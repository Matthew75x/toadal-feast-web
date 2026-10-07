import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore, R2Store } from '../src/stores.mjs';

const bytes = value => new TextEncoder().encode(value);
class MockR2Bucket {
  constructor({ pageSize = 1000 } = {}) { this.entries = new Map(); this.pageSize = pageSize; this.calls = { get: [], put: [], list: [], delete: [] }; }
  async put(key, data, options) {
    this.calls.put.push({ key, options });
    if (options?.onlyIf?.etagDoesNotMatch === '*' && this.entries.has(key)) return null;
    this.entries.set(key, new Uint8Array(data));
    return { key, etag: 'mock-etag' };
  }
  async get(key) {
    this.calls.get.push(key);
    const data = this.entries.get(key)?.slice();
    return data ? { key, arrayBuffer: async () => data.buffer } : null;
  }
  async delete(key) { this.calls.delete.push(key); this.entries.delete(key); }
  async list(options) {
    this.calls.list.push(options);
    assert.ok(Number.isInteger(options.limit) && options.limit >= 1 && options.limit <= 1000);
    assert.equal(options.include, undefined);
    const after = options.cursor ? decodeURIComponent(options.cursor.slice('after:'.length)) : '';
    if (options.cursor) assert.ok(options.cursor.startsWith('after:'));
    const all = [...this.entries.keys()].filter(key => key.startsWith(options.prefix) && key > after).sort();
    const keys = all.slice(0, Math.min(options.limit, this.pageSize));
    const truncated = keys.length < all.length;
    return { objects: keys.map(key => ({ key })), truncated, ...(truncated ? { cursor: 'after:' + encodeURIComponent(keys.at(-1)) } : {}) };
  }
}

test('R2 conditional create admits one writer across adapters without reading or overwriting', async () => {
  const bucket = new MockR2Bucket(), a = new R2Store(bucket), b = new R2Store(bucket);
  const result = await Promise.all([a.create('records/id', bytes('first')), b.create('records/id', bytes('second'))]);
  assert.deepEqual(result, [true, false]);
  assert.deepEqual(await a.get('records/id'), bytes('first'));
  assert.equal(bucket.calls.get.length, 1);
  assert.deepEqual(bucket.calls.put.map(call => call.options), [{ onlyIf: { etagDoesNotMatch: '*' } }, { onlyIf: { etagDoesNotMatch: '*' } }]);
});

test('R2 create returns conditional failure but propagates storage errors', async () => {
  const store = new R2Store({ put: async () => { throw new Error('R2 unavailable'); } });
  await assert.rejects(store.create('record', bytes('x')), /R2 unavailable/);
});

test('quota key listing follows short R2 pages, stops at 500 and never downloads data', async () => {
  const bucket = new MockR2Bucket({ pageSize: 73 });
  for (let n = 0; n < 600; n++) bucket.entries.set('quota/2026-10-06/render-' + String(n).padStart(3, '0'), bytes('large body is unnecessary'));
  bucket.entries.set('quota/2026-10-05/render-000', bytes('other day'));
  const keys = await new R2Store(bucket).listKeys('quota/2026-10-06/render-');
  assert.equal(keys.length, 500);
  assert.equal(new Set(keys).size, 500);
  assert.equal(keys[0], 'quota/2026-10-06/render-000');
  assert.equal(keys.at(-1), 'quota/2026-10-06/render-499');
  assert.equal(bucket.calls.get.length, 0);
  assert.equal(bucket.calls.list.length, 7);
  assert.equal(bucket.calls.list.at(-1).limit, 62);
});

test('quota listing completes normally below cap and respects smaller explicit limits', async () => {
  const bucket = new MockR2Bucket({ pageSize: 2 });
  for (const name of ['a', 'b', 'c']) bucket.entries.set('quota/' + name, bytes(name));
  const store = new R2Store(bucket);
  assert.deepEqual(await store.listKeys('quota/'), ['quota/a', 'quota/b', 'quota/c']);
  assert.deepEqual(await store.listKeys('quota/', 1), ['quota/a']);
  assert.deepEqual(await store.listKeys('missing/'), []);
  assert.equal(bucket.calls.get.length, 0);
});

test('cleanup pages remain bounded and resume across independent R2 adapters after deletion', async () => {
  const bucket = new MockR2Bucket();
  for (let n = 0; n < 1003; n++) bucket.entries.set('records/' + String(n).padStart(4, '0'), bytes('record'));
  const first = await new R2Store(bucket).listPage('records/');
  assert.equal(first.items.length, 1000);
  assert.ok(first.cursor);
  assert.equal(bucket.calls.get.length, 1000);
  await new R2Store(bucket).put('system/cleanup-records', bytes(first.cursor));
  for (const item of first.items) await bucket.delete(item.key);
  const restarted = new R2Store(bucket);
  const cursor = new TextDecoder().decode(await restarted.get('system/cleanup-records'));
  const next = await restarted.listPage('records/', { cursor });
  assert.equal(next.items.length, 3);
  assert.equal(next.items[0].key, 'records/1000');
  assert.equal(next.cursor, null);
});

test('R2 cleanup handles shorter pages and an object disappearing after listing', async () => {
  const bucket = new MockR2Bucket({ pageSize: 1 });
  bucket.entries.set('records/a', bytes('a')); bucket.entries.set('records/b', bytes('b'));
  const get = bucket.get.bind(bucket);
  bucket.get = async key => { if (key === 'records/a') bucket.entries.delete(key); return get(key); };
  const store = new R2Store(bucket), first = await store.listPage('records/', { limit: 1000 });
  assert.deepEqual(first.items, [{ key: 'records/a', data: null }]);
  assert.ok(first.cursor);
  const next = await store.listPage('records/', { cursor: first.cursor });
  assert.deepEqual(next.items, [{ key: 'records/b', data: bytes('b') }]);
  assert.equal(next.cursor, null);
});

test('invalid and non-advancing listing cursors fail instead of creating unbounded loops', async () => {
  const noCursor = new R2Store({ list: async () => ({ objects: [], truncated: true }) });
  await assert.rejects(noCursor.listKeys('quota/'), /did not advance/);
  const repeats = new R2Store({ list: async () => ({ objects: [], truncated: true, cursor: 'same' }) });
  await assert.rejects(repeats.listKeys('quota/'), /did not advance/);
  await assert.rejects(repeats.listPage('records/', { cursor: 'same' }), /did not advance/);
});

test('both stores validate listing limits and MemoryStore cursors survive deletion', async () => {
  const memory = new MemoryStore();
  for (const key of ['records/c', 'records/a', 'records/b']) await memory.put(key, bytes(key));
  const first = await memory.listPage('records/', { limit: 2 });
  assert.deepEqual(first.items.map(x => x.key), ['records/a', 'records/b']);
  await memory.delete('records/a'); await memory.delete('records/b');
  assert.deepEqual((await memory.listPage('records/', { cursor: first.cursor })).items.map(x => x.key), ['records/c']);
  assert.deepEqual(await memory.listKeys('records/'), ['records/c']);
  const r2 = new R2Store(new MockR2Bucket());
  for (const store of [memory, r2]) {
    for (const limit of [0, 1001, NaN, Infinity, 1.5]) await assert.rejects(store.listPage('records/', { limit }), RangeError);
    for (const limit of [0, 501, NaN, Infinity, 1.5]) await assert.rejects(store.listKeys('quota/', limit), RangeError);
  }
});
