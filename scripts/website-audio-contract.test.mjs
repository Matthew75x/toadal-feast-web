import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateCartridgeAudio,
  validateRegistry,
  validateParams,
  resolveEvent
} from '../studio-project/toadal-feast-website/reference/assets/js/website-audio-host.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'data', 'audio-registry.json');

const declaration = {
  mode: 'host',
  contractVersion: 1,
  profile: 'fixture-game',
  profileVersion: 1,
  eventMessage: 'game:audio',
  hostMessage: 'host:audio',
  fallback: 'local-before-active'
};

const registry = {
  schema: 'toadal.web.audio-registry.v1',
  version: 1,
  policy: {},
  cues: {
    'global.confirm': {
      bus: 'menu', gain: 0.5, cooldownMs: 30, maxVoices: 2, voicePolicy: 'drop',
      fallback: { kind: 'tone', wave: 'sine', startHz: 440, endHz: 660, durationMs: 80 }
    },
    'fixture.collect.1': {
      bus: 'sfx', gain: 0.6, cooldownMs: 0, maxVoices: 4, voicePolicy: 'steal-oldest',
      fallback: { kind: 'tone', wave: 'triangle', startHz: 523.25, endHz: 523.25, durationMs: 80 }
    },
    'fixture.collect.2': {
      bus: 'sfx', gain: 0.6, cooldownMs: 0, maxVoices: 4, voicePolicy: 'steal-oldest',
      fallback: { kind: 'tone', wave: 'triangle', startHz: 659.25, endHz: 659.25, durationMs: 80 }
    }
  },
  profiles: {
    'fixture-game': {
      version: 1,
      events: {
        'ui.confirm': 'global.confirm',
        'collect.item': { parameter: 'combo', ladder: ['fixture.collect.1', 'fixture.collect.2'] }
      }
    }
  }
};

test('host audio declaration is explicit and bounded', () => {
  assert.equal(validateCartridgeAudio(declaration).profile, 'fixture-game');
  assert.throws(() => validateCartridgeAudio({ ...declaration, profile: '../escape' }), /profile/);
  assert.throws(() => validateCartridgeAudio({ ...declaration, assetUrl: 'game-controlled.wav' }), /unknown/);
  assert.throws(() => validateCartridgeAudio({ ...declaration, fallback: 'always-local' }), /fallback/);
});

test('registry maps semantic events to central cues', () => {
  validateRegistry(registry);
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'ui.confirm').cueId, 'global.confirm');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'collect.item', { combo: 1 }).cueId, 'fixture.collect.1');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'collect.item', { combo: 99 }).cueId, 'fixture.collect.2');
  assert.equal(resolveEvent(registry, 'fixture-game', 1, 'unknown.event'), null);
});

test('game-supplied playback parameters are numeric and allowlisted only', () => {
  assert.deepEqual(validateParams({ power: 0.5, combo: 3, pan: -0.4, intensity: 0.8 }), { power: 0.5, combo: 3, pan: -0.4, intensity: 0.8 });
  assert.throws(() => validateParams({ url: 'sound.wav' }), /unsafe/);
  assert.throws(() => validateParams({ pan: 4 }), /unsafe/);
  assert.throws(() => validateParams({ intensity: Number.NaN }), /unsafe/);
});

test('same global cue can be referenced by more than one game profile', () => {
  const multi = structuredClone(registry);
  multi.profiles['second-game'] = { version: 1, events: { 'ui.confirm': 'global.confirm' } };
  validateRegistry(multi);
  assert.equal(resolveEvent(multi, 'fixture-game', 1, 'ui.confirm').cueId, 'global.confirm');
  assert.equal(resolveEvent(multi, 'second-game', 1, 'ui.confirm').cueId, 'global.confirm');
});

test('sample definitions require a digest and clean relative path', () => {
  const sampled = structuredClone(registry);
  sampled.cues['global.confirm'].sample = { url: '../audio/ui-confirm.wav', sha256: 'a'.repeat(64) };
  validateRegistry(sampled);
  sampled.cues['global.confirm'].sample.url = 'https://game.invalid/sound.wav';
  assert.throws(() => validateRegistry(sampled), /relative path/);
});

test('checked-in production registry starts empty until approved profiles exist', () => {
  const checked = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  validateRegistry(checked);
  assert.deepEqual(checked.cues, {});
  assert.deepEqual(checked.profiles, {});
});

test('current protected Wicked Bites cartridge is not silently migrated', () => {
  const manifestPath = path.join(root, 'dist', 'public', 'games', 'wicked-bites', 'cartridge.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(!manifest.audio || manifest.audio.mode !== 'host');
});

test('runtime source never accepts game-supplied URLs or recipes in game:audio', () => {
  const source = fs.readFileSync(path.join(root, 'studio-project', 'toadal-feast-website', 'reference', 'assets', 'js', 'website-audio-host.mjs'), 'utf8');
  assert.match(source, /message\.type !== AUDIO_EVENT/);
  assert.match(source, /resolveEvent\(this\.registry/);
  assert.doesNotMatch(source, /payload\.(?:url|src|recipe)/);
});


test('player advanced code loads shared audio module only on player pages', () => {
  const advancedPath = path.join(root, 'studio-project', 'toadal-feast-website', 'collections', 'advanced-code.json');
  const advanced = JSON.parse(fs.readFileSync(advancedPath, 'utf8')).javascript;
  assert.match(advanced, /function initWebsiteAudioHostLoader\(\)/);
  assert.match(advanced, /document\.querySelector\('\[data-player-shell\]'\)/);
  assert.match(advanced, /\/assets\/js\/website-audio-host\.mjs/);
  assert.match(advanced, /try \{ initWebsiteAudioHostLoader\(\); \} catch \(error\) \{\}/);
});
