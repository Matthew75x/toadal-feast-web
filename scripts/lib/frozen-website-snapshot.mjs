import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Accepted source custody is retained in Git; historical diagnostic exports
// are not copied back into the current public staging projection.
export const FROZEN_WEBSITE_SOURCE = '72c8f76686a9479f593aea36c1dc20f116706b98';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cache = new Map();
export function readFrozenWebsiteSnapshot(relative) {
  if (typeof relative !== 'string' || relative.split('/').some(part => !part || part === '.' || part === '..') ||
      !/^(?:dist\/previews\/cards-phone-20261008\/|studio-project\/toadal-feast-website\/pages\/player-claw-feed-gulper\.json$)/.test(relative)) {
    throw new Error('Unexpected historical website snapshot fixture: ' + relative);
  }
  if (!cache.has(relative)) {
    const result = spawnSync('git', ['show', FROZEN_WEBSITE_SOURCE + ':' + relative], {
      cwd: repo, encoding: null, windowsHide: true, maxBuffer: 32 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) throw new Error('Frozen website snapshot is unavailable: ' + relative);
    cache.set(relative, result.stdout.toString('utf8'));
  }
  return cache.get(relative);
}
