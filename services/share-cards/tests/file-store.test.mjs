import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, basename, join } from 'node:path';
import { FileStore } from '../src/file-store.mjs';

const prefix = 'toadal-share-file-store-test-';
async function fixture(t) {
  const parent = resolve(tmpdir());
  const root = resolve(await mkdtemp(join(parent, prefix)));
  assert.equal(dirname(root), parent);
  assert.ok(basename(root).startsWith(prefix));
  t.after(async () => {
    const target = resolve(root);
    assert.equal(dirname(target), parent, 'cleanup must remain in the known temporary parent');
    assert.ok(basename(target).startsWith(prefix), 'cleanup must target the generated test directory');
    await rm(target, { recursive: true, force: true });
  });
  return { root, store: new FileStore(root) };
}
const bytes = value => new TextEncoder().encode(value);

test('persisted bytes survive a new FileStore instance with isolated binary copies', async t => {
  const { root, store } = await fixture(t);
  const input = Uint8Array.from([0, 1, 127, 128, 255]);
  assert.equal(await store.create('images/abc123', input), true);
  input[0] = 99;
  const restarted = new FileStore(root);
  assert.deepEqual(await restarted.get('images/abc123'), Uint8Array.from([0, 1, 127, 128, 255]));
  const returned = await restarted.get('images/abc123');
  returned[1] = 99;
  assert.deepEqual(await restarted.get('images/abc123'), Uint8Array.from([0, 1, 127, 128, 255]));
  assert.equal(await restarted.get('records/missing'), null);
});

test('concurrent independent stores permit exactly one create winner without overwriting it', async t => {
  const { root } = await fixture(t);
  const candidates = Array.from({ length: 16 }, (_, i) => bytes('writer-' + i + ':' + 'x'.repeat(64000)));
  const attempts = await Promise.all(candidates.map((candidate, i) => new FileStore(root).create('records/same-id', candidate)));
  assert.equal(attempts.filter(Boolean).length, 1);
  assert.deepEqual(await new FileStore(root).get('records/same-id'), candidates[attempts.findIndex(Boolean)]);
  assert.equal(await new FileStore(root).create('records/same-id', bytes('replacement')), false);
  assert.deepEqual(await new FileStore(root).get('records/same-id'), candidates[attempts.findIndex(Boolean)]);
});

test('atomic replacement only exposes complete old or new bytes to concurrent readers', { timeout: 10000 }, async t => {
  const { store } = await fixture(t);
  const a = new Uint8Array(262144).fill(17);
  const b = new Uint8Array(262144).fill(42);
  await store.put('images/replaced-id', a);
  let done = false;
  let observations = 0;
  const writer = (async () => {
    try { for (let i = 0; i < 16; i++) await store.put('images/replaced-id', i % 2 ? a : b); }
    finally { done = true; }
  })();
  const reader = (async () => {
    do {
      const value = await store.get('images/replaced-id');
      assert.ok(value, 'a replacement must never remove the old published object');
      assert.equal(value.length, a.length, 'a replacement must never expose partial bytes');
      const expected = value[0] === 17 ? a : b;
      assert.deepEqual(value, expected);
      observations++;
    } while (!done);
  })();
  const outcomes = await Promise.allSettled([writer, reader]);
  for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
  assert.ok(observations > 0);
  assert.deepEqual(await store.listKeys('images/'), ['images/replaced-id']);
});

test('listing selects the namespace and idempotent deletion persists across restarts', async t => {
  const { root, store } = await fixture(t);
  await store.put('records/first', bytes('first'));
  await store.put('records/nested/second', bytes('second'));
  await store.put('images/first', Uint8Array.from([1, 2, 3]));
  const listed = await store.list('records/');
  assert.deepEqual(listed.map(item => item.key).sort(), ['records/first', 'records/nested/second']);
  assert.deepEqual(listed.find(item => item.key === 'records/first').data, bytes('first'));
  await store.delete('records/first');
  await store.delete('records/first');
  const restarted = new FileStore(root);
  assert.equal(await restarted.get('records/first'), null);
  assert.deepEqual((await restarted.listKeys('records/')).sort(), ['records/nested/second']);
  assert.deepEqual(await restarted.get('images/first'), Uint8Array.from([1, 2, 3]));
});

test('unsafe keys cannot read, write, create, or delete outside the storage root', async t => {
  const { root, store } = await fixture(t);
  const invalid = ['', '..', '../outside', 'records/../../outside', '/outside', 'C:/outside', '\\\\outside', 'records\\outside', 'records/id.json', 'records/%2e%2e/outside', 'records/id\nextra'];
  for (const key of invalid) {
    await assert.rejects(store.get(key), undefined, 'read ' + JSON.stringify(key));
    await assert.rejects(store.put(key, bytes('x')), undefined, 'write ' + JSON.stringify(key));
    await assert.rejects(store.create(key, bytes('x')), undefined, 'create ' + JSON.stringify(key));
    await assert.rejects(store.delete(key), undefined, 'delete ' + JSON.stringify(key));
  }
  assert.deepEqual(await readdir(root), []);
});

test('missing storage trees can be listed and legitimate nested keys create only their parents', async t => {
  const { root } = await fixture(t);
  const nestedRoot = join(root, 'new-storage');
  const store = new FileStore(nestedRoot);
  assert.deepEqual(await store.list('records/'), []);
  await store.put('records/nested/id', bytes('stored'));
  assert.deepEqual(await new FileStore(nestedRoot).get('records/nested/id'), bytes('stored'));
  assert.deepEqual(await readdir(root), ['new-storage']);
});
