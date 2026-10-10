import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readWickedBitesHudScore, SCORE_LOCALES, scoreLocaleEnvironment, assertScoreLocaleChild, scoreFixture, createScoreFixture } from './lib/wicked-bites-score-fixture.mjs';

const adapter = scoreFixture.adapter;

test('accepts safe integers and the real cartridge default-locale score format only', () => {
  assert.equal(adapter.normalizeScore('1234'), 1234);
  assert.equal(adapter.normalizeScore(' 1234 '), 1234);
  assert.equal(adapter.normalizeScore(readWickedBitesHudScore(1234)), 1234);
  assert.equal(adapter.normalizeScore(readWickedBitesHudScore(1489)), 1489);
  assert.equal(adapter.normalizeScore(readWickedBitesHudScore(1234567)), 1234567);
  for (const value of ['', '-1', '+1', '1.5', '1,23', '12,34', '1234,567', '0,123', ',123', '1,234x', '9,007,199,254,740,992', '9007199254740992', null, {}]) {
    assert.equal(adapter.normalizeScore(value), null, String(value));
  }
});

// Each child executes an explicitly locale-controlled VM fixture using native
// Intl built-ins. Separate native-default coverage below has no override.
for (const locale of SCORE_LOCALES) {
  test(`controlled-locale score source fixture: ${locale}`, () => {
    const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern=^score representation boundary$', import.meta.filename], {
      encoding: 'utf8', env: scoreLocaleEnvironment(locale)
    });
    assertScoreLocaleChild(child);
  });
}

test('score representation boundary', t => {
  const locale = scoreFixture.locale;
  if (process.env.TOADAL_SCORE_TEST_LOCALE) {
    assert.equal(scoreFixture.mode, 'controlled-locale');
    assert.equal(locale, process.env.TOADAL_SCORE_TEST_LOCALE);
  } else {
    assert.equal(scoreFixture.mode, 'native-default');
    assert.equal(locale, new Intl.NumberFormat().resolvedOptions().locale);
  }
  t.diagnostic(`${scoreFixture.mode} source contract; selected=${locale}; native=${new Intl.NumberFormat().resolvedOptions().locale}`);
  const frame = { src: 'https://site.example/public/games/wicked-bites/index.html', contentWindow: {} };
  const trusted = (score, type = 'game:complete', changes = {}) => adapter.isTrustedMessage({
    source: frame.contentWindow, origin: 'null',
    data: { protocol: adapter.PROTOCOL, gameId: adapter.GAME_ID, type, payload: { score } }, ...changes
  }, frame, adapter.GAME_ID, frame.src, 'https://site.example/player/wicked-bites/');
  for (const score of [0, 1, 999, 1000, 1234, 123456, 1234567, Number.MAX_SAFE_INTEGER]) {
    const hudScore = readWickedBitesHudScore(score);
    assert.equal(adapter.normalizeScore(hudScore), score, `${locale}: ${hudScore}`);
    assert.equal(adapter.normalizeScore('  ' + hudScore + '  '), score, 'bridge-compatible outer trim');
    assert.equal(adapter.normalizeScore(score), score, 'numeric protocol value');
    assert.equal(adapter.normalizeScore(String(score)), score, 'plain ASCII protocol value');
    for (const type of ['game:score', 'game:complete']) {
      assert.equal(trusted(hudScore, type), true);
      assert.equal(trusted(hudScore, type, { source: {} }), false);
      assert.equal(trusted(hudScore, type, { origin: 'https://site.example' }), false);
      assert.equal(trusted(hudScore, type, { data: { protocol: adapter.PROTOCOL, gameId: 'other', type, payload: { score: hudScore } } }), false);
      assert.equal(trusted(hudScore, type, { data: { protocol: 'other', gameId: adapter.GAME_ID, type, payload: { score: hudScore } } }), false);
    }
  }
  const malformed = [
    '', ' ', '-1', '+1', '-0', '1.5', '1e3', '1E3', '0x10', '1_234', '1,2,3456',
    ',123', '123,', '0,123', '1234,567', '1,,234', '1 234', '1,234.567', '1.234,567',
    readWickedBitesHudScore(1234) + 'x', readWickedBitesHudScore(Number.MAX_SAFE_INTEGER + 1),
    scoreFixture.format(1234, { minimumFractionDigits: 1 }),
    scoreFixture.format(1234, { signDisplay: 'always' }),
    scoreFixture.format(1234, { notation: 'scientific' }),
    scoreFixture.format(-1234),
    Number.MAX_SAFE_INTEGER + 1, -1, 1.5, NaN, Infinity, null, undefined, {}, [], true
  ];
  // Foreign groups are invalid unless that exact text is also this locale's
  // canonical output. In de-DE this expressly rejects decimal-looking 1,234.
  for (const otherLocale of SCORE_LOCALES) {
    const foreign = (1234567).toLocaleString(otherLocale);
    if (foreign !== readWickedBitesHudScore(1234567)) malformed.push(foreign);
  }
  if (locale === 'en-US') {
    assert.equal(adapter.normalizeScore('1,234'), 1234);
    assert.equal(adapter.normalizeScore('1,489'), 1489);
    assert.equal(adapter.normalizeScore('1,234,567'), 1234567);
  }
  if (locale === 'de-DE') malformed.push('1,234');
  if (locale === 'ar-EG') malformed.push('١٢3', '1٬234', '١,٢٣٤', '١٢٣٤', '٩٬٠٠٧٬١٩٩٬٢٥٤٬٧٤٠٬٩٩٢');
  if (locale === 'fr-FR') malformed.push('1\u00a0234', '1 234', '12\u202f34');
  if (locale === 'hi-IN') malformed.push('1,234,567', '12,345,67');
  for (const score of malformed) {
    assert.equal(adapter.normalizeScore(score), null, `${locale}: rejected ${String(score)}`);
    assert.equal(trusted(score), false, `${locale}: untrusted ${String(score)}`);
  }
});

test('controlled fixtures leave native-default formatting and intrinsics untouched', () => {
  const childEnv = scoreLocaleEnvironment('de-DE');
  assert.equal(childEnv.LANG, process.env.LANG);
  assert.equal(childEnv.LC_ALL, process.env.LC_ALL);
  assert.equal(childEnv.NODE_TEST_CONTEXT, undefined);
  const originalNumberFormat = Intl.NumberFormat;
  const originalToLocaleString = Number.prototype.toLocaleString;
  const nativeLocale = new Intl.NumberFormat().resolvedOptions().locale;
  const nativeText = (1234567).toLocaleString();
  for (const locale of SCORE_LOCALES) {
    const controlled = createScoreFixture(locale);
    assert.equal(controlled.mode, 'controlled-locale');
    assert.equal(controlled.locale, locale);
    assert.equal(controlled.readHudScore(1234567), (1234567).toLocaleString(locale));
    assert.equal(controlled.adapter.normalizeScore(controlled.readHudScore(1234567)), 1234567);
  }
  assert.equal(Intl.NumberFormat, originalNumberFormat);
  assert.equal(Number.prototype.toLocaleString, originalToLocaleString);
  assert.equal(new Intl.NumberFormat().resolvedOptions().locale, nativeLocale);
  assert.equal((1234567).toLocaleString(), nativeText);
  const native = createScoreFixture();
  assert.equal(native.mode, 'native-default');
  assert.equal(native.locale, nativeLocale);
  assert.equal(native.readHudScore(1234567), nativeText);
  assert.equal(native.adapter.normalizeScore(nativeText), 1234567);
});

test('formats elapsed play time as minutes and seconds', () => {
  assert.equal(adapter.formatElapsed(0), '0:00');
  assert.equal(adapter.formatElapsed(65000), '1:05');
  assert.equal(adapter.formatElapsed(-10), '0:00');
});

test('accepts the exact opaque-origin iframe and rejects sibling or synthetic messages', () => {
  const frame = { src: 'https://site.example/public/games/wicked-bites/index.html', contentWindow: {} };
  const valid = { source: frame.contentWindow, origin: 'null', data: { protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'game:score', payload: { score: '1234' } } };
  assert.equal(adapter.isTrustedMessage(valid, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), true);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, payload: { score: readWickedBitesHudScore(1489) } } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), true);
  assert.equal(adapter.isTrustedMessage({ ...valid, source: {} }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, origin: 'https://site.example' }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, gameId: 'other' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, type: 'game:request-exit' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, payload: null } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, payload: { score: 'bad' } } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { ...valid.data, sessionId: 'stale' } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), false);
  assert.equal(adapter.isTrustedMessage({ ...valid, data: { protocol: 'toadal.game.v1', gameId: 'wicked-bites', type: 'game:error', payload: { message: 'failed' } } }, frame, 'wicked-bites', '/public/games/wicked-bites/index.html', 'https://site.example/player/wicked-bites/'), true);
});

test('tracks in-memory session best and excludes paused time from play duration', () => {
  let now = 0;
  const session = adapter.createSession(() => now);
  session.accept('game:started');
  now = 5000;
  session.accept('game:score', { score: '1234' });
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

test('error and exit stop host-measured session time; a retry starts a fresh run', () => {
  let now = 1000;
  const session = adapter.createSession(() => now);
  session.accept('game:started');
  now = 9000;
  session.accept('game:score', { score: '45' });
  const failed = session.accept('game:error');
  assert.equal(failed.state, 'error');
  assert.equal(failed.elapsedMs, 8000);
  now = 20000;
  assert.equal(session.snapshot().elapsedMs, 8000);
  session.accept('game:started');
  assert.equal(session.snapshot().state, 'playing');
  assert.equal(session.snapshot().elapsedMs, 0);
  assert.equal(session.snapshot().score, null);
  now = 25000;
  assert.equal(session.accept('host:exit').state, 'exited');
  now = 50000;
  assert.equal(session.snapshot().elapsedMs, 5000);
});
