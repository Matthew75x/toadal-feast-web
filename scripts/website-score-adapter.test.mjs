import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const adapter = require('../studio-project/toadal-feast-website/reference/assets/js/website-score-adapter.js');

test('accepts only strict non-negative safe integer scores', () => {
  assert.equal(adapter.normalizeScore('1234'), 1234);
  assert.equal(adapter.normalizeScore('1,234'), 1234);
  for (const value of ['', '-1', '+1', '01', '1.5', '1,23', '1,234x', '9007199254740992', null, {}]) {
    assert.equal(adapter.normalizeScore(value), null, String(value));
  }
});

test('formats elapsed play time as minutes and seconds', () => {
  assert.equal(adapter.formatElapsed(0), '0:00');
  assert.equal(adapter.formatElapsed(65000), '1:05');
  assert.equal(adapter.formatElapsed(-10), '0:00');
});

test('accepts the exact opaque-origin iframe and rejects sibling or synthetic messages', () => {
  const frame = { src: 'https://site.example/public/games/wicked-bites/index.html', contentWindow: {} };
  const valid = { source: frame.contentWindow, origin: 'null', data: { protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'game:score', payload: { score: '1,234' } } };
  assert.equal(adapter.isTrustedMessage(valid, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), true);
  assert.equal(adapter.isTrustedMessage({ ...valid, source: {} }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, origin: 'https://site.example' }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, gameId: 'other' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, type: 'game:request-exit' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, payload: null } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, payload: { score: 'bad' } } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, sessionId: 'stale' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
});

test('tracks in-memory session best and excludes paused time from play duration', () => {
  let now = 0;
  const session = adapter.createSession(() => now);
  session.accept('game:started');
  now = 5000;
  session.accept('game:score', { score: '1,234' });
  now = 8000;
  session.accept('game:paused');
  now = 20000;
  session.accept('game:resumed');
  now = 23000;
  const done = session.accept('game:complete', { score: '1200' });
  assert.equal(done.score, 1200);
  assert.equal(done.sessionBest, 1234);
  assert.equal(done.elapsedMs, 11000);
  assert.equal(done.state, 'complete');
});

test('does not accept score or completion outside an active run', () => {
  const session = adapter.createSession(() => 500);
  assert.equal(session.accept('game:complete', { score: 999 }).state, 'idle');
  assert.equal(session.accept('game:score', { score: 999 }).score, null);
});
