const encode = value => new TextEncoder().encode(JSON.stringify(value));
// One shared anonymous pool. No IP, device, session, or recipient key is stored.
export function createBurstLimiter(store, { limit = 5, dailyRenderLimit = 300, clock = () => new Date() } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new RangeError('Burst limit must be 1–20.');
  if (!Number.isInteger(dailyRenderLimit) || dailyRenderLimit < 1 || dailyRenderLimit > 500) throw new RangeError('Daily render limit must be 1–500.');
  return async () => {
    const now = clock(), minute = Math.floor(now.getTime() / 60000);
    const dailyPrefix = 'quota/' + now.toISOString().slice(0,10) + '/render-';
    if ((await store.listKeys(dailyPrefix, dailyRenderLimit)).length >= dailyRenderLimit) return false;
    const prefix = 'quota/' + now.toISOString().slice(0,10) + '/burst-' + minute + '-';
    const occupied = new Set(await store.listKeys(prefix, limit));
    for(let slot = 0; slot < limit; slot++) {
      const key = prefix + slot;
      if(occupied.has(key)) continue;
      if(await store.create(key, encode({ expiresAt: new Date(now.getTime()+120000).toISOString() }))) return true;
    }
    return false;
  };
}
