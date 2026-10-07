const MAX_PAGE_SIZE = 1000;
const MAX_QUOTA_KEYS = 500;

function boundedLimit(value, maximum) {
  if (!Number.isInteger(value) || value < 1 || value > maximum) throw new RangeError('Invalid listing limit.');
  return value;
}
function continuation(page, previous) {
  if (!page.truncated) return null;
  if (typeof page.cursor !== 'string' || !page.cursor || page.cursor === previous) throw new Error('Storage listing did not advance.');
  return page.cursor;
}

export class MemoryStore {
  constructor() { this.entries = new Map(); }
  async get(key) { return this.entries.get(key)?.slice() ?? null; }
  async put(key, data) { this.entries.set(key, new Uint8Array(data)); }
  async create(key, data) { if (this.entries.has(key)) return false; this.entries.set(key, new Uint8Array(data)); return true; }
  async delete(key) { this.entries.delete(key); }
  async list(prefix) { return [...this.entries].filter(([key]) => key.startsWith(prefix)).map(([key, data]) => ({ key, data: data.slice() })); }
  async listKeys(prefix, limit = MAX_QUOTA_KEYS) {
    boundedLimit(limit, MAX_QUOTA_KEYS);
    return [...this.entries.keys()].filter(key => key.startsWith(prefix)).sort().slice(0, limit);
  }
  // Memory cursors are last keys, allowing the just-processed entries to be deleted.
  async listPage(prefix, { cursor = null, limit = MAX_PAGE_SIZE } = {}) {
    boundedLimit(limit, MAX_PAGE_SIZE);
    const keys = [...this.entries.keys()].filter(key => key.startsWith(prefix) && (!cursor || key > cursor)).sort();
    const selected = keys.slice(0, limit);
    return { items: selected.map(key => ({ key, data: this.entries.get(key).slice() })), cursor: keys.length > selected.length ? selected.at(-1) : null };
  }
}

export class R2Store {
  constructor(bucket) { this.bucket = bucket; }
  async get(key) { const value = await this.bucket.get(key); return value ? new Uint8Array(await value.arrayBuffer()) : null; }
  async put(key, data) { await this.bucket.put(key, data); }
  // R2 evaluates the write precondition atomically across Workers/isolate instances.
  // A failed precondition returns null; transport/storage failures remain errors.
  async create(key, data) { return (await this.bucket.put(key, data, { onlyIf: { etagDoesNotMatch: '*' } })) !== null; }
  async delete(key) { await this.bucket.delete(key); }
  // Quota admission only needs keys. Never fetch every reservation's object body.
  // Daily configuration is capped at 500, so this scan is bounded even at capacity.
  async listKeys(prefix, limit = MAX_QUOTA_KEYS) {
    boundedLimit(limit, MAX_QUOTA_KEYS);
    const keys = [];
    let cursor;
    let pages = 0;
    do {
      if (++pages > MAX_QUOTA_KEYS) throw new Error('Storage listing exceeded its bounded scan.');
      const page = await this.bucket.list({ prefix, limit: limit - keys.length, ...(cursor ? { cursor } : {}) });
      for (const object of page.objects) {
        keys.push(object.key);
        if (keys.length === limit) return keys;
      }
      const next = continuation(page, cursor);
      if (!next) return keys;
      cursor = next;
    } while (keys.length < limit);
    return keys;
  }
  // One bounded R2 page; the caller persists cursor only after processing succeeds.
  // Deleted objects can disappear between list and get; their data becomes null.
  async listPage(prefix, { cursor = null, limit = MAX_PAGE_SIZE } = {}) {
    boundedLimit(limit, MAX_PAGE_SIZE);
    const page = await this.bucket.list({ prefix, limit, ...(cursor ? { cursor } : {}) });
    const next = continuation(page, cursor);
    const items = [];
    for (const object of page.objects) items.push({ key: object.key, data: await this.get(object.key) });
    return { items, cursor: next };
  }
  // Compatibility helper is intentionally bounded. Maintenance must use listPage
  // and persist its cursor instead of assuming all records fit in one invocation.
  async list(prefix) { return (await this.listPage(prefix)).items; }
}
